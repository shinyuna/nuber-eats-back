import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Min } from 'class-validator';
import { CoreOutput } from './output.dto';

@InputType()
export class PaginationInput {
  @Field(type => Int, { defaultValue: 1 })
  page: number;

  @Field(type => Int)
  @Min(2)
  limit: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field(type => Int, { nullable: true })
  totalPages?: number;

  @Field(type => Int, { nullable: true })
  totalCount?: number;
}
