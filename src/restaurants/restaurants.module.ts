import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repositories';
import { CategoryService, RestaurantService } from './restaurant.service';
import { CategoryResolver, RestaurantResolver } from './restaurants.resolver';
@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, CategoryRepository])],
  providers: [RestaurantResolver, RestaurantService, CategoryResolver, CategoryService],
})
export class RestaurantsModule {}
