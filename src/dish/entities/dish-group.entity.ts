import { CoreEntity } from '@/common/entities/core.entity';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Dish } from './dish.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@InputType('DishGroupType', { isAbstract: true })
@ObjectType()
@Entity()
export class DishGroup extends CoreEntity {
  @Field(type => String)
  @Column()
  @IsString()
  name: string;

  @Field(type => String, { nullable: true })
  @Column()
  @IsString()
  description?: string;

  @Field(type => Restaurant)
  @ManyToOne(type => Restaurant, restaurant => restaurant.menuGroup, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @RelationId((dishGroup: DishGroup) => dishGroup.restaurant)
  restaurantId: number;

  @Field(type => [Dish])
  @OneToMany(type => Dish, dish => dish.menuGroup)
  menu: Dish[];
}
