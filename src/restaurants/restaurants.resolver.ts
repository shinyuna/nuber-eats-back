import { Resolver, Query, Args, Mutation, ResolveField, Int, Parent } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dto/create-restaurant.dto';
import { CategoryService, RestaurantService } from './restaurant.service';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/role.decorator';
import { EditRestaurantInput, EditRestaurantOutput } from './dto/edit-restaurant.dto';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dto/delete-restaurant.dto';
import { Category } from './entities/category.entity';
import { GetCategoriesOutput } from './dto/get-categories.dto';
import { FindRestaurantByCategoryInput, FindRestaurantByCategoryOutput } from './dto/find-restaurant-by-category';
import { GetRestaurantsInput, GetRestaurantsOutput } from './dto/get-restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dto/restaurant.dto';
import { FindRestaurantInput, FindRestaurantOutput } from './dto/find-restaurant-by-name.dto';
import { Dish } from './entities/dish.entity';
import { CreateDishInput, CreateDishOutput } from './dto/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dto/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dto/delete-dish.dto';
import { GetRestaurantByOwnerOutput } from './dto/get-restaurant-by-owner';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(returns => CreateRestaurantOutput)
  @Role(['Owner'])
  async createRestaurant(
    @AuthUser() owner: User,
    @Args('input') params: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(owner, params);
  }

  @Mutation(returns => EditRestaurantOutput)
  @Role(['Owner'])
  async editRestaurant(
    @AuthUser() owner: User,
    @Args('input') params: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, params);
  }

  @Mutation(returns => DeleteRestaurantOutput)
  @Role(['Owner'])
  async deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') params: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(owner, params);
  }

  @Query(returns => GetRestaurantsOutput)
  async getRestaurants(@Args('input') params: GetRestaurantsInput): Promise<GetRestaurantsOutput> {
    return this.restaurantService.getRestaurants(params);
  }

  @Query(returns => RestaurantOutput)
  async findRestaurantById(@Args('input') params: RestaurantInput): Promise<RestaurantOutput> {
    return this.restaurantService.findRestaurantById(params);
  }

  @Query(returns => FindRestaurantOutput)
  async findRestaurantByName(@Args('input') params: FindRestaurantInput): Promise<FindRestaurantOutput> {
    return this.restaurantService.findRestaurantByName(params);
  }

  @Query(returns => GetRestaurantByOwnerOutput)
  @Role(['Owner'])
  async getRestaurantByOwner(@AuthUser() owner: User) {
    return this.restaurantService.getRestaurantByOwner(owner);
  }
}

@Resolver(of => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @ResolveField(type => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.categoryService.countRestaurants(category);
  }

  @Query(retruns => GetCategoriesOutput)
  async getCategories(): Promise<GetCategoriesOutput> {
    return this.categoryService.getCategories();
  }

  @Query(returns => FindRestaurantByCategoryOutput)
  async findRestaurantByCategory(
    @Args('input') categoryInput: FindRestaurantByCategoryInput,
  ): Promise<FindRestaurantByCategoryOutput> {
    return this.categoryService.findRestaurantByCategory(categoryInput);
  }
}

@Resolver(of => Dish)
export class DishResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(returns => CreateDishOutput)
  @Role(['Owner'])
  async createDish(@AuthUser() owner: User, @Args('input') params: CreateDishInput): Promise<CreateDishOutput> {
    return this.restaurantService.createDish(owner, params);
  }

  @Mutation(returns => EditDishOutput)
  @Role(['Owner'])
  async editDish(@AuthUser() owner: User, @Args('input') params: EditDishInput): Promise<EditDishOutput> {
    return this.restaurantService.editDish(owner, params);
  }

  @Mutation(returns => DeleteDishOutput)
  @Role(['Owner'])
  async deleteDish(@AuthUser() owner: User, @Args('input') params: DeleteDishInput): Promise<DeleteDishOutput> {
    return this.restaurantService.deleteDish(owner, params);
  }
}
