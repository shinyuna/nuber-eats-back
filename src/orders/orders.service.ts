import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItem: Repository<OrderItem>,
    @InjectRepository(Restaurant) private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
  ) {}

  async createOrder(customer: User, { restaurantId, items }: CreateOrderInput): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      }
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return {
            ok: false,
            error: 'Dish not found.',
          };
        }
        let dishFinalPrice = dish.price;
        console.log(dish.price);
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(dishOption => dishOption.name === itemOption.name);
          if (dishOption) {
            if (dishOption.price) {
              dishFinalPrice += dishOption.price;
            } else {
              if (dishOption.choices) {
                const usePriceDish = dishOption.choices.filter(item => item.price);
                if (usePriceDish.length != 0) {
                  const choiceOptionPrice = usePriceDish
                    .filter(option => itemOption.choice.indexOf(option.name) > -1)
                    .map(option => option.price);
                  const choiceFinalPrice = choiceOptionPrice.reduce((a, b) => a + b);
                  dishFinalPrice += choiceFinalPrice;
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItem.save(this.orderItem.create({ dish, options: item.options }));
        orderItems.push(orderItem);
      }
      const order = await this.orders.save(
        this.orders.create({ customer, restaurant, items: orderItems, total: orderFinalPrice }),
      );
      return {
        ok: true,
      };
    } catch (error) {
      console.log('🚀 error:', error);
      return {
        ok: false,
        error: 'Could not create order.',
      };
    }
  }

  async getOrders(user: User, { status }: GetOrdersInput): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurant = await this.restaurants.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });
        orders = restaurant.map(restaurant => restaurant.orders).flat(); // 내부 배열의 모든 요소를 외부로 가져옴 (= 모든 하위 배열을 가져와서 새로운 배열을 만듭니다)
        if (status) {
          orders = orders.filter(order => order.status === status);
        }
      }
      return {
        ok: true,
        orders,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not get orders.',
      };
    }
  }

  async getOrder(user: User, { id: orderId }: GetOrderInput): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, { relations: ['restaurant'] });
      if (!order) return { ok: false, error: 'Order not found.' };
      const checkCustomer = user.role === UserRole.Client && order.customerId !== user.id;
      const checkDriver = user.role === UserRole.Delivery && order.driverId !== user.id;
      const checkOwner = user.role === UserRole.Owner && order.restaurant.ownerId !== user.id;
      if (checkCustomer || checkDriver || checkOwner) {
        return { ok: false, error: "You can't not see that." };
      }
      return {
        ok: true,
        order,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not get order.',
      };
    }
  }

  async updateOrderStatus(user: User, { id: OrderId, status }: EditOrderInput): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(OrderId, { relations: ['restaurant'] });
      if (!order) {
        return { ok: false, error: 'Order not found.' };
      }
      const checkCustomer = user.role === UserRole.Client && order.customerId !== user.id;
      const checkDriver = user.role === UserRole.Delivery && order.driverId !== user.id;
      const checkOwner = user.role === UserRole.Owner && order.restaurant.ownerId !== user.id;
      if (checkCustomer || checkDriver || checkOwner) {
        return { ok: false, error: "You can't not see that." };
      }
      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Checked && status !== OrderStatus.Cooking) {
          canEdit = false;
        }
      }
      if (user.role === UserRole.Delivery) {
        if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return {
          ok: false,
          error: "You can't not do that.",
        };
      }
      await this.orders.save([
        {
          id: OrderId,
          status,
        },
      ]);
      return {
        ok: true,
        status,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit order.',
      };
    }
  }
}
