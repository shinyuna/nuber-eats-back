import { Module } from '@nestjs/common';
import { DishService } from './dish.service';
import { DishResolver } from './dish.resolver';
import { RestaurantsModule } from '@/restaurants/restaurants.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { DishGroup } from '@/dish/entities/dish-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dish, DishGroup]), RestaurantsModule],
  providers: [DishService, DishResolver],
})
export class DishModule {}
