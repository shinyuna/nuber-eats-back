import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/createRestaurant.dto';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  @Query(returnes => [Restaurant])
  restaurants(@Args('veganOnly') veganOnly: boolean): Restaurant[] {
    return [];
  }

  @Mutation(returns => Boolean)
  createRastaurant(@Args() params: CreateRestaurantDto): boolean {
    return true;
  }
}
