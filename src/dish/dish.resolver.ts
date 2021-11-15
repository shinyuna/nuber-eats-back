import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Role } from '@/auth/role.decorator';
import { Dish } from './entities/dish.entity';
import { DishService } from './dish.service';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { AuthUser } from '@/auth/auth-user.decorator';
import { User } from '@/users/entities/user.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { CreateDishGroupInput, CreateDishGroupOutput } from '@/dish/dtos/create-dishGroup.dto';
import { EditDishGroupInput, EditDishGroupOutput } from '@/dish/dtos/edit-dishGroup.dto';

@Resolver(of => Dish)
export class DishResolver {
  constructor(private readonly dishService: DishService) {}

  @Mutation(returns => CreateDishGroupOutput)
  @Role(['Owner'])
  async createDishGroup(
    @AuthUser() owner: User,
    @Args('input') payload: CreateDishGroupInput,
  ): Promise<CreateDishGroupOutput> {
    return this.dishService.createDishGroup(owner, payload);
  }

  @Mutation(returns => EditDishGroupOutput)
  @Role(['Owner'])
  async editDishGroup(
    @AuthUser() owner: User,
    @Args('input') payload: EditDishGroupInput,
  ): Promise<EditDishGroupOutput> {
    return this.dishService.editDishGroup(owner, payload);
  }

  @Mutation(returns => CreateDishOutput)
  @Role(['Owner'])
  async createDish(@AuthUser() owner: User, @Args('input') payload: CreateDishInput): Promise<CreateDishOutput> {
    return this.dishService.createDish(owner, payload);
  }

  @Mutation(returns => EditDishOutput)
  @Role(['Owner'])
  async editDish(@AuthUser() owner: User, @Args('input') payload: EditDishInput): Promise<EditDishOutput> {
    return this.dishService.editDish(owner, payload);
  }

  @Mutation(returns => DeleteDishOutput)
  @Role(['Owner'])
  async deleteDish(@AuthUser() owner: User, @Args('input') payload: DeleteDishInput): Promise<DeleteDishOutput> {
    return this.dishService.deleteDish(owner, payload);
  }
}
