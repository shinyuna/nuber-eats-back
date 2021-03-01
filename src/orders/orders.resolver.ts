import { Inject } from '@nestjs/common';
import { Args, Query, Mutation, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { NEW_CHECKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { CreateDishOutput } from 'src/restaurants/dto/create-dish.dto';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderUpdatesInput } from './dtos/order-updates.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';

@Resolver(of => Order)
export class OrderResolver {
  constructor(private readonly OrdersService: OrderService, @Inject(PUB_SUB) private readonly pubSub: PubSub) {}

  @Mutation(returns => CreateOrderOutput)
  @Role(['Client'])
  async createOrder(@AuthUser() customer: User, @Args('input') params: CreateOrderInput): Promise<CreateDishOutput> {
    return this.OrdersService.createOrder(customer, params);
  }

  @Query(returns => GetOrdersOutput)
  @Role(['Any'])
  async getOrders(@AuthUser() user: User, @Args('input') params: GetOrdersInput): Promise<GetOrdersOutput> {
    return this.OrdersService.getOrders(user, params);
  }

  @Query(returns => GetOrderOutput)
  @Role(['Any'])
  async getOrder(@AuthUser() user: User, @Args('input') params: GetOrderInput): Promise<GetOrderOutput> {
    return this.OrdersService.getOrder(user, params);
  }

  @Mutation(returns => EditOrderOutput)
  @Role(['Any'])
  async updateOrderStatus(@AuthUser() user: User, @Args('input') params: EditOrderInput): Promise<EditOrderOutput> {
    return this.OrdersService.updateOrderStatus(user, params);
  }

  @Subscription(returns => Order, {
    filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
      return ownerId === user.id;
    },
    resolve: ({ pendingOrders: { order } }) => order,
  })
  @Role(['Owner'])
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  @Subscription(returns => Order)
  @Role(['Delivery'])
  checkedOrders() {
    return this.pubSub.asyncIterator(NEW_CHECKED_ORDER);
  }

  @Subscription(returns => Order, {
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) => {
      if (order.driverId !== user.id && order.customerId !== user.id && order.restaurant.ownerId !== user.id) {
        return false;
      }
      return order.id === input.id;
    },
  })
  @Role(['Any'])
  orderUpdates(@Args('input') orderId: OrderUpdatesInput) {
    return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
  }

  }
}
