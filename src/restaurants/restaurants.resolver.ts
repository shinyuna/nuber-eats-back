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
import { CategorySlugInput, CategorySlugOutput } from './dto/find-category-by-slug.dto';
import { RestaurantsInput, RestaurantsOutput } from './dto/all-restaurants.dto';

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

  @Query(returns => CategorySlugOutput)
  async findCategoryBySlug(@Args('input') categoryInput: CategorySlugInput): Promise<CategorySlugOutput> {
    return this.categoryService.findCategoryBySlug(categoryInput);
  }
}
