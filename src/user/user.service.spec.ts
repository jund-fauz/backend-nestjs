import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcryptjs from 'bcryptjs';

jest.mock('bcryptjs');

describe('UserService', () => {
  let service: UserService;
  let mockUserModel: any;
  let mockJwtService: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2a$10$hashed.password',
  };

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('jwt-token-123'),
    };

    (bcryptjs.hash as jest.Mock).mockResolvedValue('$2a$10$hashed.password');
    (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({
        ...mockUser,
        username: registerDto.username,
        email: registerDto.email,
        _id: new Object(),
      });

      const result = await service.signUp(registerDto);

      expect(bcryptjs.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [{ username: registerDto.username }, { email: registerDto.email }],
      });
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'User has been created successfully',
        access_token: 'jwt-token-123',
      });
    });

    it('should throw error if user already exists', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.signUp(registerDto)).rejects.toThrow(
        new BadRequestException(
          'User with this email or username already exists',
        ),
      );
    });

    it('should throw error if email already exists', async () => {
      const registerDto: RegisterDto = {
        username: 'differentuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.signUp(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should login user with username successfully', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
        email: '',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [{ username: 'testuser' }, { email: '' }],
      });
      expect(bcryptjs.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toEqual({
        message: 'User has been logged in successfully',
        access_token: 'jwt-token-123',
      });
    });

    it('should login user with email successfully', async () => {
      const loginDto: LoginDto = {
        username: '',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.access_token).toBeDefined();
      expect(result.message).toBe('User has been logged in successfully');
    });

    it('should throw error if user not found', async () => {
      const loginDto: LoginDto = {
        username: 'nonexistent',
        password: 'password123',
        email: '',
      };

      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should throw error if password is incorrect', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
        email: '',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Incorrect password'),
      );
    });
  });
});
