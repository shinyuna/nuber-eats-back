import { Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, RelationId } from 'typeorm';
import { IsEnum, IsNumber } from 'class-validator';
import { OrderItem } from './order-item.entity';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';

export enum OrderStatus {
  Pending = 'Pending',
  Checked = 'Checked',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}
registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field(type => User, { nullable: true })
  @ManyToOne(type => User, user => user.orders, { onDelete: 'SET NULL', nullable: true, eager: true }) // 많은 오더는 한 명의 유저를 갖는다.
  customer?: User;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  @Field(type => User, { nullable: true })
  @ManyToOne(type => User, user => user.rides, { onDelete: 'SET NULL', nullable: true, eager: true })
  driver?: User;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  @Field(type => Restaurant, { nullable: true })
  @ManyToOne(type => Restaurant, restaurant => restaurant.orders, { onDelete: 'SET NULL', nullable: true, eager: true })
  restaurant?: Restaurant;

  @Field(type => [OrderItem])
  @ManyToMany(type => OrderItem, { onDelete: 'CASCADE', eager: true }) // 오더는 여러개의 디시를 갖을 수 있도 디쉬 또한 같음
  @JoinTable({ name: 'order_detail' }) // 소유하고 있는 쪽에 선언해주면 된다. (디시는 자신이 어떤 오더에 포함되어 있는지 알 수 없음 하지만 오더는 얻떤 디시를 고객이 선택했는지 알 수 있음. )
  items: OrderItem[];

  @Column({ nullable: true })
  @Field(type => Int, { nullable: true })
  @IsNumber()
  total?: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field(type => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
