import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Min } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Payment } from '../entities/payment.entity';

@InputType()
export class CreatePaymentInput extends PickType(Payment, ['transactionId', 'restaurantId']) {
  @Field(type => Int)
  @Min(3)
  untilDate: number;
}

@ObjectType()
export class CreatePaymentOutput extends CoreOutput {
  @Field(type => Int, { nullable: true })
  transactionId?: number;
}
