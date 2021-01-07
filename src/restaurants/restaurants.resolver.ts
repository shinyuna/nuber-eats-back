import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/createRestaurant.dto';
import { RestaurantService } from './restaurant.service';
import { UpdateRestaurantDto } from './dto/updateRestaurant.dto';
@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query(returnes => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }

  @Mutation(returns => Boolean)
  async createRastaurant(@Args('input') params: CreateRestaurantDto): Promise<boolean> {
    try {
      await this.restaurantService.createRestaurant(params);
      return true;
    } catch (e) {
      console.log('err:', e);
      return false;
    }
  }

  @Mutation(returns => Boolean)
  async updateRestaurant(@Args() params: UpdateRestaurantDto) {
    try {
      await this.restaurantService.updateRestaurant(params);
      return true;
    } catch (e) {
      console.log('🚀 ~ updateRestaurant ~ e', e);
      return false;
    }
  }
}
