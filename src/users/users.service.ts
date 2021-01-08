import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput, CreateAccountOutput } from './dtos/createAccount.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async createAccount({ email, password, role }: CreateAccountInput) {
    // check new user -> create user & hash the password
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return;
      }
      await this.users.save(this.users.create({ email, password, role }));
      return true;
    } catch (e) {
      console.log('createAccount e:', e);
      return;
    }
  }
}
