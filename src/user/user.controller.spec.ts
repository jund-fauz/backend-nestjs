import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    signUp: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const mockResponse = {
        message: 'User has been created successfully',
        access_token: 'jwt-token-123',
      };

      mockUserService.signUp.mockResolvedValue(mockResponse);

      const result = await controller.registerUser(registerDto);

      expect(mockUserService.signUp).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBeDefined();
    });

    it('should handle signup errors', async () => {
      const registerDto: RegisterDto = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUserService.signUp.mockRejectedValue(
        new Error('User already exists'),
      );

      await expect(controller.registerUser(registerDto)).rejects.toThrow(
        'User already exists',
      );
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        email: '',
        password: 'password123',
      };

      const mockResponse = {
        message: 'User has been logged in successfully',
        access_token: 'jwt-token-456',
      };

      mockUserService.login.mockResolvedValue(mockResponse);

      const result = await controller.loginUser(loginDto);

      expect(mockUserService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBeDefined();
    });

    it('should login user with email', async () => {
      const loginDto: LoginDto = {
        username: '',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        message: 'User has been logged in successfully',
        access_token: 'jwt-token-789',
      };

      mockUserService.login.mockResolvedValue(mockResponse);

      const result = await controller.loginUser(loginDto);

      expect(mockUserService.login).toHaveBeenCalledWith(loginDto);
      expect(result.access_token).toBeDefined();
    });

    it('should handle login errors', async () => {
      const loginDto: LoginDto = {
        username: 'nonexistent',
        email: '',
        password: 'password123',
      };

      mockUserService.login.mockRejectedValue(new Error('User not found'));

      await expect(controller.loginUser(loginDto)).rejects.toThrow(
        'User not found',
      );
    });
  });
});
