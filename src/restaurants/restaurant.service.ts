import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileOutput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Raw, Repository } from 'typeorm';
import { GetCategoriesOutput } from './dto/get-categories.dto';
import { FindRestaurantByCategoryInput, FindRestaurantByCategoryOutput } from './dto/find-restaurant-by-category';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dto/create-restaurant.dto';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dto/delete-restaurant.dto';
import { EditRestaurantInput } from './dto/edit-restaurant.dto';
import { GetRestaurantsInput, GetRestaurantsOutput } from './dto/get-restaurants.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repositories';
import { RestaurantInput, RestaurantOutput } from './dto/restaurant.dto';
import { FindRestaurantInput, FindRestaurantOutput } from './dto/find-restaurant-by-name.dto';
import { CreateDishInput, CreateDishOutput } from './dto/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dto/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dto/delete-dish.dto';
import { GetRestaurantsByOwnerOutput } from './dto/get-restaurant-by-owner';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant) private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    private readonly categories: CategoryRepository,
  ) {}

  async checkRestaurant(restaurantId: number, ownerId: number): Promise<{ err?: string; restaurant?: Restaurant }> {
    const restaurant = await this.restaurants.findOne(restaurantId, {
      loadRelationIds: true,
    });
    if (!restaurant) {
      return { err: 'Restaurant not found.' };
    }
    if (ownerId != restaurant.ownerId) {
      return { err: "You can't do that you don't own." };
    }
    return {
      restaurant,
    };
  }

  async checkDish(dishId: number, ownerId: number): Promise<{ err?: string; dish?: Dish }> {
    const dish = await this.dishes.findOne(dishId, { relations: ['restaurant'] });
    if (!dish) {
      return { err: 'Dish not found.' };
    }
    if (ownerId != dish.restaurant.ownerId) {
      return { err: "You can't do that you don't own." };
    }
    return {
      dish,
    };
  }

  async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      const category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
      newRestaurant.owner = owner;
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return { ok: true, restaurantId: newRestaurant.id };
    } catch (error) {
      return { ok: false, error: 'Could not create restaurant' };
    }
  }

  async editRestaurant(owner: User, editRestaurantInput: EditRestaurantInput): Promise<EditProfileOutput> {
    try {
      const { err, restaurant } = await this.checkRestaurant(editRestaurantInput.restaurantId, owner.id);
      if (err) {
        return {
          ok: false,
          error: err,
        };
      }
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(editRestaurantInput.categoryName);
      }
      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async deleteRestaurant(owner: User, { restaurantId }: DeleteRestaurantInput): Promise<DeleteRestaurantOutput> {
    try {
      const { err, restaurant } = await this.checkRestaurant(restaurantId, owner.id);
      if (err) {
        return {
          ok: false,
          error: err,
        };
      }
      await this.restaurants.delete(restaurantId);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not delete restaurant.',
      };
    }
  }

  async getRestaurants({ page, limit }: GetRestaurantsInput): Promise<GetRestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        result: restaurants,
        totalCount: totalResults,
        totalPages: Math.ceil(totalResults / limit),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load restaurants.',
      };
    }
  }

  async getRestaurant({ restaurantId }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, { relations: ['menu'] });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load restaurant.',
      };
    }
  }

  async findRestaurantByName({ query, page, limit }: FindRestaurantInput): Promise<FindRestaurantOutput> {
    try {
      const [restaurants, totalResult] = await this.restaurants.findAndCount({
        where: {
          name: Raw(name => `${name} ILIKE '%${query}%'`),
        },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        ok: true,
        restaurants,
        totalCount: totalResult,
        totalPages: Math.ceil(totalResult / limit),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not search for restaurant.',
      };
    }
  }

  async getRestaurantsByOwner(owner: User): Promise<GetRestaurantsByOwnerOutput> {
    try {
      const restaurants = await this.restaurants.find({ owner });
      return {
        ok: true,
        restaurants,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load restaurants.',
      };
    }
  }

  async getRestaurantByOwner(owner: User, { restaurantId: id }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({ owner, id }, { relations: ['menu'] });
      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Cloud not find restaurant.',
      };
    }
  }

  /** Dish API
   * createDish
   * editDish
   * DeleteDish
   */
  async createDish(owner: User, createDishInput: CreateDishInput): Promise<CreateDishOutput> {
    try {
      const { err, restaurant } = await this.checkRestaurant(createDishInput.restaurantId, owner.id);
      if (err) {
        return {
          ok: false,
          error: err,
        };
      }
      await this.dishes.save(this.dishes.create({ ...createDishInput, restaurant }));
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create dish.',
      };
    }
  }

  async editDish(owner: User, editDishInput: EditDishInput): Promise<EditDishOutput> {
    try {
      const { err } = await this.checkDish(editDishInput.dishId, owner.id);
      if (err) {
        return {
          ok: false,
          error: err,
        };
      }
      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit dish.',
      };
    }
  }

  async deleteDish(owner: User, { dishId }: DeleteDishInput): Promise<DeleteDishOutput> {
    try {
      const { err, dish } = await this.checkDish(dishId, owner.id);
      if (err) {
        return {
          ok: false,
          error: err,
        };
      }
      await this.dishes.delete(dish.id);
      return {
        ok: true,
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not delete dish.',
      };
    }
  }
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Restaurant) private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  async getCategories(): Promise<GetCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load categories.',
      };
    }
  }

  countRestaurants(category: Category) {
    return this.restaurants.count({ category });
  }

  async findRestaurantByCategory({
    slug,
    page,
    limit,
  }: FindRestaurantByCategoryInput): Promise<FindRestaurantByCategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found.',
        };
      }
      const restaurants = await this.restaurants.find({
        where: { category },
        take: limit,
        skip: (page - 1) * limit,
        order: {
          isPromoted: 'DESC',
        },
      });
      const totalResult = await this.countRestaurants(category);
      return {
        ok: true,
        restaurants,
        category,
        totalCount: totalResult,
        totalPages: Math.ceil(totalResult / limit),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not find category.',
      };
    }
  }
}
