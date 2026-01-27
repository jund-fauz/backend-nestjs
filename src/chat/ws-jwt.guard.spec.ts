import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from './ws-jwt.guard';
import { User } from '../user/schemas/user.schema';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let jwtService: JwtService;
  let mockUserModel: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed-password',
  };

  beforeEach(async () => {
    mockUserModel = {
      findById: jest.fn(),
    };

    const mockJwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsJwtGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    guard = module.get<WsJwtGuard>(WsJwtGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should authenticate with valid token from auth property', async () => {
      const mockClient = {
        handshake: {
          auth: {
            token: 'valid-jwt-token',
          },
          headers: {},
        },
      };

      const mockContext = {
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue(mockClient),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(jwtService, 'verify').mockReturnValue({ id: mockUser._id });
      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockContext);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockClient.userId).toBe(mockUser._id.toString());
      expect(mockClient.username).toBe(mockUser.username);
      expect(mockClient.user).toBe(mockUser);
      expect(result).toBe(true);
    });

    it('should authenticate with valid token from authorization header', async () => {
      const mockClient = {
        handshake: {
          auth: {},
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        },
      };

      const mockContext = {
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue(mockClient),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(jwtService, 'verify').mockReturnValue({ id: mockUser._id });
      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockContext);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token');
      expect(result).toBe(true);
    });

    it('should reject connection with no token', async () => {
      const mockClient = {
        handshake: {
          auth: {},
          headers: {},
        },
      };

      const mockContext = {
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue(mockClient),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('No token provided'),
      );
    });

    it('should reject connection with invalid token', async () => {
      const mockClient = {
        handshake: {
          auth: {
            token: 'invalid-token',
          },
          headers: {},
        },
      };

      const mockContext = {
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue(mockClient),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );
    });

    it('should reject connection if user not found', async () => {
      const mockClient = {
        handshake: {
          auth: {
            token: 'valid-jwt-token',
          },
          headers: {},
        },
      };

      const mockContext = {
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue(mockClient),
        }),
      } as unknown as ExecutionContext;

      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ id: 'non-existent-id' });
      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should attach user data to client socket', async () => {
      const mockClient = {
        handshake: {
          auth: {
            token: 'valid-jwt-token',
          },
          headers: {},
        },
      };

      const mockContext = {
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue(mockClient),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(jwtService, 'verify').mockReturnValue({ id: mockUser._id });
      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(mockUser);

      await guard.canActivate(mockContext);

      expect(mockClient.user).toEqual(mockUser);
      expect(mockClient.userId).toBe(mockUser._id.toString());
      expect(mockClient.username).toBe(mockUser.username);
    });
  });
});
