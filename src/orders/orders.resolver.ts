import { Args, Query, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { CreateDishOutput } from 'src/restaurants/dto/create-dish.dto';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';

@Resolver(of => Order)
export class OrderResolver {
  constructor(private readonly OrdersService: OrderService) {}

  @Mutation(returns => CreateOrderOutput)
  async createOrder(@AuthUser() customer: User, @Args('input') params: CreateOrderInput): Promise<CreateDishOutput> {
    return this.OrdersService.createOrder(customer, params);
  }

  @Query(returns => GetOrdersOutput)
  @Role(['Any'])
  async getOrders(@AuthUser() user: User, @Args('input') params: GetOrdersInput): Promise<GetOrdersOutput> {
    return this.OrdersService.getOrders(user, params);
  }
}
