import { Restaurant } from '@/restaurants/entities/restaurant.entity';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsString, Length, Min } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { DishGroup } from './dish-group.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(type => String)
  @IsString()
  name: string;

  @Field(type => Int, { defaultValue: 0 })
  @IsNumber()
  price: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field(type => String)
  @IsString()
  name: string;

  @Field(type => [DishChoice], { nullable: true })
  choices?: DishChoice[];

  @Field(type => Boolean, { defaultValue: false })
  @IsBoolean()
  isRequired: boolean;

  @Field(type => Int, { defaultValue: 0 })
  @IsNumber()
  min: number;

  @Field(typs => Int, { defaultValue: 1 })
  @IsNumber()
  @Min(1)
  max: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field(type => String)
  @Column()
  @IsString()
  name: string;

  @Field(type => String)
  @Column()
  @IsString()
  @Length(5, 120)
  description: string;

  @Field(type => Int)
  @Column()
  @IsNumber()
  price: number;

  @Field(type => String)
  @Column()
  @IsString()
  photo: string;

  @Field(type => Restaurant, { nullable: true })
  @ManyToOne(type => Restaurant, restaurant => restaurant.menu, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Field(type => DishGroup)
  @ManyToOne(type => DishGroup, dishGroup => dishGroup.menu)
  menuGroup: DishGroup;

  @Field(type => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true }) // 주인장이 option을 지우거나 변경하기 쉽게 json을 사용.
  options?: DishOption[];
}
