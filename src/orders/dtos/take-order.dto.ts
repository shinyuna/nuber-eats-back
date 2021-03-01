import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class TakeOrderInput extends PickType(Order, ['id']) {}

@ObjectType()
export class TakeOrderOutput extends CoreOutput {
  @Field(type => Int, { nullable: true })
  orderId?: number;
}
