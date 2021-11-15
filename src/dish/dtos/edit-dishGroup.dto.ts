import { CoreOutput } from '@/common/dtos/output.dto';
import { Field, InputType, Int, ObjectType, OmitType, PartialType } from '@nestjs/graphql';
import { CreateDishGroupInput } from '@/dish/dtos/create-dishGroup.dto';

@InputType()
export class EditDishGroupInput extends OmitType(PartialType(CreateDishGroupInput), ['restaurantId']) {
  @Field(type => Int)
  dishGroupId: number;
}

@ObjectType()
export class EditDishGroupOutput extends CoreOutput {}
