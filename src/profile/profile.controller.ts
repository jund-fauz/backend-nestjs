import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('api')
@UseGuards(AuthGuard())
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post('createProfile')
  async createProfile(@Body() createProfileDto: CreateProfileDto, @Req() req) {
    return this.profileService.createProfile(createProfileDto, req.user);
  }
  
  @Get('getProfile')
  async getProfile(@Req() req) {
    return this.profileService.getProfile(req.user);
  }

  @Put('updateProfile')
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Req() req) {
    return this.profileService.updateProfile(updateProfileDto, req.user);
  }
}
