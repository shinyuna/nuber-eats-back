import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [UsersModule],
  providers: [
    {
      provide: APP_GUARD, // 가드를 app의 모든 곳에서 사용하고 싶을 때 provide 하면 됨.
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
