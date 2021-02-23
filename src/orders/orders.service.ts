import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

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
}
