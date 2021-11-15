import { CoreOutput } from '@/common/dtos/output.dto';
import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { DishGroup } from '../entities/dish-group.entity';

@InputType()
export class CreateDishGroupInput extends PickType(DishGroup, ['name', 'description']) {
  @Field(type => Int)
  restaurantId: number;
}

@ObjectType()
export class CreateDishGroupOutput extends CoreOutput {
  @Field(type => Int)
  dishGroupId?: number;
}
