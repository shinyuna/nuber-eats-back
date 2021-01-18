import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/vetify-email.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(of => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Mutation(returns => CreateAccountOutput)
  async createAccount(@Args('input') createAccountInput: CreateAccountInput): Promise<CreateAccountOutput> {
    return this.userService.createAccount(createAccountInput);
  }

  @Mutation(returns => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.userService.login(loginInput);
  }

  @UseGuards(AuthGuard)
  @Query(returns => User)
  authorization(@AuthUser() authUser: User) {
    return authUser;
  }

  @UseGuards(AuthGuard)
  @Query(returns => UserProfileOutput)
  async userProfile(@Args() { userId }: UserProfileInput): Promise<UserProfileOutput> {
    return this.userService.findById(userId);
  }

  @UseGuards(AuthGuard)
  @Mutation(returns => EditProfileOutput)
  async editProfile(@AuthUser() authUser: User, @Args('input') editProfileInput: EditProfileInput): Promise<EditProfileOutput> {
    return this.userService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation(returns => VerifyEmailOutput)
  async verifyEmail(@Args('input') { code }: VerifyEmailInput): Promise<VerifyEmailOutput> {
    return this.userService.verifyEmail(code);
  }
}
