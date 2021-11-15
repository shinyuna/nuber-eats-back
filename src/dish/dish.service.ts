import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { User } from '@/users/entities/user.entity';
import { RestaurantService } from '@/restaurants/restaurant.service';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { CreateDishGroupInput, CreateDishGroupOutput } from './dtos/create-dishGroup.dto';
import { DishGroup } from '@/dish/entities/dish-group.entity';
import { EditDishGroupInput, EditDishGroupOutput } from '@/dish/dtos/edit-dishGroup.dto';

/** Dish Service
 * createDish
 * editDish
 * DeleteDish
 */
@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @InjectRepository(DishGroup) private readonly dishGroups: Repository<DishGroup>,
    private readonly restaurantService: RestaurantService,
  ) {}

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

  async createDishGroup(owner: User, createDishGroupInput: CreateDishGroupInput): Promise<CreateDishGroupOutput> {
    try {
      const { err, restaurant } = await this.restaurantService.checkRestaurant(
        createDishGroupInput.restaurantId,
        owner.id,
      );
      if (err) {
        return {
          ok: false,
          error: err,
        };
      }
      const dishGroup = await this.dishGroups.save(this.dishGroups.create({ ...createDishGroupInput, restaurant }));
      return {
        ok: true,
        dishGroupId: dishGroup.id,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not create dish group.',
      };
    }
  }

  async editDishGroup(owner: User, editDishGroupInput: EditDishGroupInput): Promise<EditDishGroupOutput> {
    try {
      const dishGroup = await this.dishGroups.findOne(editDishGroupInput.dishGroupId);
      if (!dishGroup) {
        return {
          ok: false,
          error: 'Dish group Not found.',
        };
      }
      await this.dishGroups.save([{ id: editDishGroupInput.dishGroupId, ...editDishGroupInput }]);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not edit dish group.',
      };
    }
  }

  async createDish(owner: User, createDishInput: CreateDishInput): Promise<CreateDishOutput> {
    try {
      const { err, restaurant } = await this.restaurantService.checkRestaurant(createDishInput.restaurantId, owner.id);
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
