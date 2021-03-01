import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>('roles', context.getHandler());
    // metadata가 없는 public한 애들
    if (!roles) {
      return true;
    }
    // graphql context에 유저가 없으면, token이 없거나 아예 보내지 않았다는 것
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext['token'];
    if (token) {
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user, ok } = await this.usersService.findById(decoded['id']);
        if (!user) {
          return false;
        }
        gqlContext['user'] = user;
        // 모든 유저가 다 사용할 수 있음.
        if (roles.includes('Any')) {
          return true;
        }
        // user data에서 온 role이 metadata role에 포함 되어 있는지의 여부
        return roles.includes(user.role);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
