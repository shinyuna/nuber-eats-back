import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/vetify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification) private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly emailService: MailService,
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    // check new user -> create user & hash the password
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }
      const user = await this.users.save(this.users.create({ email, password, role }));
      const { code } = await this.verification.save(this.verification.create({ user }));
      const username = user.email.slice(0, user.email.indexOf('@'));
      this.emailService.sendVerificationEmail(username, code);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // find user email -> check password -> make a JWT and give to the user
    try {
      const user = await this.users.findOne({ email }, { select: ['id', 'password'] });
      if (!user) {
        return { ok: false, error: 'User not found.' };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return { ok: false, error: 'Wrong password' };
      }
      const token = this.jwtService.sign(user.id);
      return { ok: true, token };
    } catch (e) {
      return { ok: false, error: "Can't log user in." };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'User Not Found',
      };
    }
  }

  async editProfile(userId: number, { email, password }: EditProfileInput): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        user.verify = false;
        this.verification.delete({ user: { id: user.id } });
        const { code } = await this.verification.save(this.verification.create({ user }));
        const username = user.email.slice(0, user.email.indexOf('@'));
        this.emailService.sendVerificationEmail(username, code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not update profile',
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verification.findOne({ code }, { relations: ['user'] });
      if (verification) {
        verification.user.verify = true;
        await this.users.save(verification.user);
        await this.verification.delete(verification.id);
        return { ok: true };
      }
      return { ok: false, error: 'Verification not foune.' };
    } catch (error) {
      return { ok: false, error: 'Could not verify email' };
    }
  }
}
