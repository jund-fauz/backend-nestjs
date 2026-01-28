import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; message: string }> {
    const { username, email, password } = registerDto;
    const hashedPassword = await hash(password, 10);
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      throw new BadRequestException(
        'User with this email or username already exists',
      );
    }
    const newUser = await this.userModel.create({
      username,
      email,
      password: hashedPassword,
    });
    const token = this.jwtService.sign({ id: newUser._id });
    return {
      message: 'User has been created successfully',
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
      const { username, email, password } = loginDto;
      const user = await this.userModel.findOne({ $or: [{ username }, { email }] });
      if (!user) {
          throw new UnauthorizedException('User not found');
      }
      const passwordTrue = await compare(password, user.password);
      if (!passwordTrue) {
          throw new UnauthorizedException('Incorrect password');
      }
      const token = this.jwtService.sign({ id: user._id });
      return {
        message: 'User has been logged in successfully',
        access_token: token,
      };
  }
}
