import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Vertification } from '../entities/vertification.entity';

@ObjectType()
export class VertifyEmailOutput extends CoreOutput {}

@InputType()
export class VertifyEmailInput extends PickType(Vertification, ['code']) {}
