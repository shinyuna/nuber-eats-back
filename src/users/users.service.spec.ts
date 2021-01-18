import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Vertification } from './entities/vertification.entity';
import { UsersService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  findOneOrFail: jest.fn(),
});
const mockJwtService = () => ({
  sign: jest.fn(() => 'signe-token-baby'),
  vertify: jest.fn(),
});
const mockMailService = () => ({
  sendVertificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let vertificationRepository: MockRepository<Vertification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Vertification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    vertificationRepository = module.get(getRepositoryToken(Vertification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@email.com',
      password: 'test.password',
      role: 0,
    };

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });
    it('should create a new user', async () => {
      // Set mock
      usersRepository.findOne.mockReturnValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      vertificationRepository.create.mockReturnValue({ user: createAccountArgs });
      vertificationRepository.save.mockResolvedValue({ code: 'code' });
      // Run Fuc
      const result = await service.createAccount(createAccountArgs);
      // Testing
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(vertificationRepository.create).toHaveBeenCalledWith({ user: createAccountArgs });
      expect(vertificationRepository.save).toHaveBeenCalledTimes(1);

      expect(vertificationRepository.save).toHaveBeenCalledWith({ user: createAccountArgs });

      expect(mailService.sendVertificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVertificationEmail).toHaveBeenCalledWith(expect.any(String), expect.any(String));

      expect(result).toEqual({ ok: true });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error(':('));
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: "Couldn't create account" });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'test@test.com',
      password: 'test.password',
    };

    it('should fail it user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
      expect(result).toEqual({ ok: false, error: 'User not found.' });
    });
    it('should fail it if the password id wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };

      usersRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(result).toEqual({ ok: false, error: 'Wrong password' });
    });
    it('should get token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };

      usersRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({ ok: true, token: 'signe-token-baby' });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error(':('));
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: "Can't log user in." });
    });
  });

  describe('findById', () => {
    const findByIdArgs = { id: 1 };

    it('should find an existing user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });
    it('should fail if no user is foune', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error(':('));
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    it('should chage email', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'new@test.com' },
      };
      const oldUser = {
        email: 'test@test.com',
        vertify: true,
      };
      const newVertification = {
        code: 'new_code',
      };
      const newUser = {
        vertify: false,
        email: editProfileArgs.input.email,
      };

      usersRepository.findOne.mockResolvedValue(oldUser);
      vertificationRepository.create.mockReturnValue(newVertification);
      vertificationRepository.save.mockResolvedValue(newVertification);

      const result = await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(editProfileArgs.userId);

      expect(vertificationRepository.create).toHaveBeenCalledWith({ user: newUser });
      expect(vertificationRepository.save).toHaveBeenCalledWith(newVertification);

      expect(mailService.sendVertificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVertificationEmail).toHaveBeenCalledWith('new', newVertification.code);

      expect(result).toEqual({ ok: true });
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'new.password' },
      };
      usersRepository.findOne.mockResolvedValue({ password: 'old' });
      const result = await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgs.input);
      expect(result).toEqual({ ok: true });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: '1' });
      expect(result).toEqual({ ok: false, error: 'Could not update profile' });
    });
  });

  describe('vertifyEmail', () => {
    it('should vertify email', async () => {
      const mockedVertification = {
        user: {
          vertify: false,
        },
        id: 1,
      };
      vertificationRepository.findOne.mockResolvedValue(mockedVertification);

      const result = await service.vertifyEmail('');

      expect(vertificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(vertificationRepository.findOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ vertify: true });

      expect(vertificationRepository.delete).toHaveBeenCalledTimes(1);
      expect(vertificationRepository.delete).toHaveBeenCalledWith(mockedVertification.id);

      expect(result).toEqual({ ok: true });
    });
    it('should fail on vertification not found', async () => {
      vertificationRepository.findOne.mockResolvedValue(undefined);
      const result = await service.vertifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Vertification not foune.' });
    });
    it('should fail on exception', async () => {
      vertificationRepository.findOne.mockRejectedValue(new Error());
      const result = await service.vertifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Could not vertify email' });
    });
  });
});
