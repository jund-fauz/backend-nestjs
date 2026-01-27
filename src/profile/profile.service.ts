import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Horoscope, Profile, Zodiac } from './schemas/profile.schema';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto, user: User) {
    const existingProfile = await this.profileModel.findOne({ user: user._id });
    if (existingProfile) {
      throw new BadRequestException('Profile already exists for this user');
    }
    const profile = await this.profileModel.create({
      ...createProfileDto,
      user: user._id,
      horoscope: this.getHoroscope(createProfileDto.birthday),
      zodiac: this.getZodiac(createProfileDto.birthday),
    });
    return { message: 'Profile has been created successfully', data: profile };
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, user: User) {
    const existingProfile = await this.profileModel.findOne({ user: user._id });
    if (!existingProfile) {
      throw new NotFoundException('Profile does not exist for this user');
    }
    const updatedProfile = await this.profileModel.findOneAndUpdate(
        { user: user._id },
        {
          ...updateProfileDto,
          user: user._id,
          horoscope: this.getHoroscope(updateProfileDto.birthday),
          zodiac: this.getZodiac(updateProfileDto.birthday),
        },
        { new: true },
      );
      return {
        message: 'Profile has been updated successfully',
        data: updatedProfile,
      };
  }

  async getProfile(user: User) {
    const profile = await this.profileModel
      .findOne({ user: user._id })
      .populate('user', '-password -_id');
    return { message: 'Profile has been found successfully', data: profile };
  }

  getHoroscope(birthDate: Date): Horoscope {
    const month = birthDate.getUTCMonth() + 1;
    const day = birthDate.getUTCDate();
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
      return Horoscope.ARIES;
    } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
      return Horoscope.TAURUS;
    } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
      return Horoscope.GEMINI;
    } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
      return Horoscope.CANCER;
    } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      return Horoscope.LEO;
    } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      return Horoscope.VIRGO;
    } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
      return Horoscope.LIBRA;
    } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
      return Horoscope.SCORPIUS;
    } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      return Horoscope.SAGITTARIUS;
    } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
      return Horoscope.CAPRICORNUS;
    } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
      return Horoscope.AQUARIUS;
    } else {
      return Horoscope.PISCES;
    }
  }

  getZodiac(birthDate: Date): Zodiac {
    const year = birthDate.getUTCFullYear();
    if ((year - 4) % 12 === 0) {
      return Zodiac.RAT;
    } else if ((year - 4) % 12 === 1) {
      return Zodiac.OX;
    } else if ((year - 4) % 12 === 2) {
      return Zodiac.TIGER;
    } else if ((year - 4) % 12 === 3) {
      return Zodiac.RABBIT;
    } else if ((year - 4) % 12 === 4) {
      return Zodiac.DRAGON;
    } else if ((year - 4) % 12 === 5) {
      return Zodiac.SNAKE;
    } else if ((year - 4) % 12 === 6) {
      return Zodiac.HORSE;
    } else if ((year - 4) % 12 === 7) {
      return Zodiac.GOAT;
    } else if ((year - 4) % 12 === 8) {
      return Zodiac.MONKEY;
    } else if ((year - 4) % 12 === 9) {
      return Zodiac.ROOSTER;
    } else if ((year - 4) % 12 === 10) {
      return Zodiac.DOG;
    } else {
      return Zodiac.BOAR;
    }
  }
}
