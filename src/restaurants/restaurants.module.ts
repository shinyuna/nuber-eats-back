import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repositories';
import { CategoryService, RestaurantService } from './restaurant.service';
import { CategoryResolver, DishResolver, RestaurantResolver } from './restaurants.resolver';
@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, CategoryRepository, Dish])],
  providers: [RestaurantResolver, RestaurantService, CategoryResolver, CategoryService, DishResolver],
})
export class RestaurantsModule {}
