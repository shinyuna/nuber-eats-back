import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './createRestaurant.dto';

@InputType()
export class UpdateRestauranInputType extends PartialType(CreateRestaurantDto) {}

@ArgsType()
export class UpdateRestaurantDto {
  @Field(typs => Number)
  id: number;

  @Field(type => UpdateRestauranInputType)
  data: UpdateRestauranInputType;
}
