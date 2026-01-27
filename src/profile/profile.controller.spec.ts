import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfileService = {
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockRequest = {
    user: mockUser,
  };

  const mockProfile = {
    _id: '607f1f77bcf86cd799439013',
    user: mockUser._id,
    name: 'Test User',
    gender: 'male',
    horoscope: 'aries',
    zodiac: 'dragon',
    height: 180,
    weight: 75,
    interests: ['music', 'reading'],
    about: 'Test bio',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    })
      .overrideGuard('AuthGuard')
      .useValue(true)
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProfile', () => {
    it('should create a new profile', async () => {
      const createProfileDto: CreateProfileDto = {
        name: 'Test User',
        gender: 'male',
        birthday: new Date('2000-03-21'),
        height: 180,
        weight: 75,
        interests: ['music', 'reading'],
        about: 'Test bio',
      };

      const mockResponse = {
        message: 'Profile has been created successfully',
        data: mockProfile,
      };

      mockProfileService.createProfile.mockResolvedValue(mockResponse);

      const result = await controller.createProfile(
        createProfileDto,
        mockRequest,
      );

      expect(mockProfileService.createProfile).toHaveBeenCalledWith(
        createProfileDto,
        mockUser,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      const createProfileDto: CreateProfileDto = {
        name: 'Test User',
        gender: 'male',
        birthday: new Date('2000-03-21'),
        height: 180,
        weight: 75,
        interests: [],
        about: 'Test',
      };

      mockProfileService.createProfile.mockRejectedValue(
        new Error('Profile already exists'),
      );

      await expect(
        controller.createProfile(createProfileDto, mockRequest),
      ).rejects.toThrow('Profile already exists');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateProfileDto: UpdateProfileDto = {
        name: 'Updated User',
        height: 182,
      };

      const mockResponse = {
        message: 'Profile has been updated successfully',
        data: { ...mockProfile, ...updateProfileDto },
      };

      mockProfileService.updateProfile.mockResolvedValue(mockResponse);

      const result = await controller.updateProfile(
        updateProfileDto,
        mockRequest,
      );

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        updateProfileDto,
        mockUser,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle update errors', async () => {
      const updateProfileDto: UpdateProfileDto = {
        name: 'Updated',
      };

      mockProfileService.updateProfile.mockRejectedValue(
        new Error('Profile not found'),
      );

      await expect(
        controller.updateProfile(updateProfileDto, mockRequest),
      ).rejects.toThrow('Profile not found');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockResponse = {
        message: 'Profile has been found successfully',
        data: mockProfile,
      };

      mockProfileService.getProfile.mockResolvedValue(mockResponse);

      const result = await controller.getProfile(mockRequest);

      expect(mockProfileService.getProfile).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockResponse);
    });

    it('should handle getProfile errors', async () => {
      mockProfileService.getProfile.mockRejectedValue(
        new Error('Profile not found'),
      );

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        'Profile not found',
      );
    });
  });
});
