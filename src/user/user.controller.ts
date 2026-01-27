import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  async registerUser(@Body() registerDto: RegisterDto): Promise<{ access_token: string, message: string }> {
    return this.userService.signUp(registerDto);
  }

  @Post('login')
  loginUser(@Body() loginDto: LoginDto): Promise<{ access_token: string, message: string }> {
    return this.userService.login(loginDto);
  }
}
