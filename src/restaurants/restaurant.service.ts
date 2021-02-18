import { Injectable, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileOutput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AllCategoriesOutput } from './dto/all-categories.dto';
import { CategorySlugInput, CategorySlugOutput } from './dto/find-category-by-slug.dto';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dto/create-restaurant.dto';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dto/delete-restaurant.dto';
import { EditRestaurantInput } from './dto/edit-restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dto/all-restaurants.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repositories';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant) private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      const category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
      newRestaurant.owner = owner;
      newRestaurant.category = category;
      this.restaurants.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create restaurant' };
    }
  }

  async editRestaurant(owner: User, editRestaurantInput: EditRestaurantInput): Promise<EditProfileOutput> {
    try {
      const restaurant = await this.restaurants.findOne(editRestaurantInput.restaurantId, {
        loadRelationIds: true,
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't edit a restaurant that you don't own.",
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
        error: null,
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
      const restaurant = await this.restaurants.findOne(restaurantId, { loadRelationIds: true });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't edit a restaurant that you don't own.",
        };
      }
      await this.restaurants.delete(restaurantId);
      return { ok: true, error: null };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not delete restaurant.',
      };
    }
  }

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Restaurant) private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  async allCategories(): Promise<AllCategoriesOutput> {
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

  async findCategoryBySlug({ slug, page, limit }: CategorySlugInput): Promise<CategorySlugOutput> {
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
      });
      const totalResult = await this.countRestaurants(category);
      return {
        ok: true,
        restaurants,
        category,
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
