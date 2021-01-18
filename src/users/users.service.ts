import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Vertification } from './entities/vertification.entity';
import { VertifyEmailOutput } from './dtos/vetify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Vertification) private readonly vertification: Repository<Vertification>,
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
      const { code } = await this.vertification.save(this.vertification.create({ user }));
      const username = user.email.slice(0, user.email.indexOf('@'));
      this.emailService.sendVertificationEmail(username, code);
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
        user.vertify = false;
        const { code } = await this.vertification.save(this.vertification.create({ user }));
        const username = user.email.slice(0, user.email.indexOf('@'));
        this.emailService.sendVertificationEmail(username, code);
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

  async vertifyEmail(code: string): Promise<VertifyEmailOutput> {
    try {
      const vertification = await this.vertification.findOne({ code }, { relations: ['user'] });
      if (vertification) {
        vertification.user.vertify = true;
        await this.users.save(vertification.user);
        await this.vertification.delete(vertification.id);
        return { ok: true };
      }
      return { ok: false, error: 'Vertification not foune.' };
    } catch (error) {
      return { ok: false, error: 'Could not vertify email' };
    }
  }
}
