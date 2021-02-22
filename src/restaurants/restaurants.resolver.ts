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
import { AllCategoriesOutput } from './dto/all-categories.dto';
import { CategoryBySlugInput, CategoryBySlugOutput } from './dto/category';
import { RestaurantsInput, RestaurantsOutput } from './dto/all-restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dto/restaurant.dto';
import { SearchRestaurantInput, SearchRestaurantOutput } from './dto/search-restaurant.dto';
import { Dish } from './entities/dish.entity';
import { CreateDishInput, CreateDishOutput } from './dto/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dto/edit-dish.dto';

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

  @Query(returns => RestaurantsOutput)
  async allRestaurants(@Args('input') params: RestaurantsInput): Promise<RestaurantsOutput> {
    return this.restaurantService.allRestaurants(params);
  }

  @Query(returns => RestaurantOutput)
  async findRestaurantById(@Args('input') params: RestaurantInput): Promise<RestaurantOutput> {
    return this.restaurantService.findRestaurantById(params);
  }

  @Query(returns => SearchRestaurantOutput)
  async searchRestaurantByName(@Args('input') params: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurantByName(params);
  }
}

@Resolver(of => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @ResolveField(type => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.categoryService.countRestaurants(category);
  }

  @Query(retruns => AllCategoriesOutput)
  async allCategories(): Promise<AllCategoriesOutput> {
    return this.categoryService.allCategories();
  }

  @Query(returns => CategoryBySlugOutput)
  async findRestaurantByCategory(@Args('input') categoryInput: CategoryBySlugInput): Promise<CategoryBySlugOutput> {
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
}
