import { flatten, Injectable } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import { CreatePaymentInput, CreatePaymentOutput } from './dtos/create-payment.dto';
import { GetPaymentOutput } from './dtos/get-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private readonly payment: Repository<Payment>,
    @InjectRepository(Restaurant) private readonly restaurant: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    { restaurantId, transactionId, untilDate }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurant.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You are not allowed to do this.',
        };
      }
      restaurant.isPromoted = true;

      const date = new Date();
      date.setDate(date.getDate() + untilDate);
      restaurant.promotedUntil = date;

      this.restaurant.save(restaurant);
      const payment = await this.payment.save(
        this.payment.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );
      return {
        ok: true,
        transactionId: payment.restaurantId,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create payment.',
      };
    }
  }

  async getPayments(owner: User): Promise<GetPaymentOutput> {
    try {
      const payments = await this.payment.find({ user: owner });
      return {
        ok: true,
        payments,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load payments.',
      };
    }
  }

  @Cron('0 * * * * *')
  async checkPromoedRestaurant() {
    const restaurant = await this.restaurant.find({ isPromoted: true, promotedUntil: LessThan(new Date()) });
    restaurant.forEach(async restaurant => {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurant.save(restaurant);
    });
  }
}
