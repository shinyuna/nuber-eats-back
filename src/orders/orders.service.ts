import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { NEW_CHECKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Dish } from '@/dish/entities/dish.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { TakeOrderOutput } from './dtos/take-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItem: Repository<OrderItem>,
    @InjectRepository(Restaurant) private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async checkOrderAndUser(orderId: number, user: User): Promise<{ error?: string; order?: Order }> {
    const order = await this.orders.findOne(orderId);
    if (!order) {
      return { error: 'Order not found.' };
    }

    const checkCustomer = user.role === UserRole.Client && order.customerId !== user.id;
    const checkDriver = user.role === UserRole.Delivery && order.driverId !== user.id;
    const checkOwner = user.role === UserRole.Owner && order.restaurant.ownerId !== user.id;
    if (checkCustomer || checkDriver || checkOwner) {
      return { error: "You can't not do that." };
    }

    return { order };
  }

  async createOrder(customer: User, { restaurantId, items }: CreateOrderInput): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      const orderItems: OrderItem[] = [];
      let orderFinalPrice = 0;

      if (!restaurant) return { ok: false, error: 'Restaurant not found.' };

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
            if (dishOption.choices) {
              const usePriceDish = dishOption.choices.filter(item => item.price);
              if (usePriceDish.length !== 0) {
                const choiceOptionPrice = usePriceDish
                  .filter(option => itemOption.choice.indexOf(option.name) > -1)
                  .map(option => option.price);
                const choiceFinalPrice = choiceOptionPrice.reduce((a, b) => a + b);
                dishFinalPrice += choiceFinalPrice;
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
      await this.pubSub.publish(NEW_PENDING_ORDER, { pendingOrders: { order, ownerId: restaurant.ownerId } });
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
      const { error, order } = await this.checkOrderAndUser(orderId, user);
      if (error) {
        return { ok: false, error };
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

  async updateOrderStatus(user: User, { id: orderId, status }: EditOrderInput): Promise<EditOrderOutput> {
    try {
      const { error, order } = await this.checkOrderAndUser(orderId, user);
      if (error) {
        return { ok: false, error };
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
      await this.orders.save({
        id: orderId,
        status,
      });
      // 레스토랑 오너가 주문을 확인하면 드라이버들에게 새로운 오더 업데이트 알림
      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Checked) {
          await this.pubSub.publish(NEW_CHECKED_ORDER, {
            checkedOrders: { ...order, status },
          });
        }
      }
      // 주문 상태가 업데이트 될 때마다 주문 관련자(손님, 오너, 드라이버)에게 상태 업데이트 알림
      await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: { ...order, status } });
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

  async takeOrder(driver: User, { id: orderId }): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }
      if (order.driver) {
        return {
          ok: false,
          error: 'This order already has a dirver.',
        };
      }
      await this.orders.save({
        id: orderId,
        driver,
      });
      // 드라이버가 주문을 받으면 해당 주문 관련자(손님, 오너)에게 업데이트 알림
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });
      return {
        ok: true,
        orderId: order.id,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not drive order.',
      };
    }
  }
}
