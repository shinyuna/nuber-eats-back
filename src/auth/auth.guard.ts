import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>('roles', context.getHandler());
    // metadata가 없는 public힌 애들
    if (!roles) {
      return true;
    }
    // graphql context에 유저가 없으면, token이 없거나 아예 보내지 않았다는 것
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];
    if (!user) {
      return false;
    }
    // 모든 유저가 다 사용할 수 있음.
    if (roles.includes('Any')) {
      return true;
    }
    return roles.includes(user.role);
  }
}
