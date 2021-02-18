import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import { PaginationInput, PaginationOutput } from 'src/common/dtos/pagination.dto';
import { Category } from '../entities/category.entity';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class CategorySlugInput extends PaginationInput {
  @Field(type => String)
  slug: string;
}

@ObjectType()
export class CategorySlugOutput extends PaginationOutput {
  @Field(type => Category, { nullable: true })
  category?: Category;

  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
