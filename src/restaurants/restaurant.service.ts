import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dto/createRestaurant.dto';
import { UpdateRestaurantDto } from './dto/updateRestaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(@InjectRepository(Restaurant) private readonly restaurants: Repository<Restaurant>) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  createRestaurant(ReestaurantData: CreateRestaurantDto): Promise<Restaurant> {
    const newRestaurant = this.restaurants.create(ReestaurantData);
    return this.restaurants.save(newRestaurant);
  }

  updateRestaurant({ id, data }: UpdateRestaurantDto) {
    return this.restaurants.update(id, { ...data });
  }
}

/* 
create: javascript에서만 데이터를 생성?존재?하고 DB에 저장이 되지 않음
save: DB에 데이터를 저장
*/
