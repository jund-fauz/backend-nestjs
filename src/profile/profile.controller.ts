import { Body, Controller, Get, Post, Put, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LandscapeImageUploadInterceptor } from './interceptors/landscape-image-upload.interceptor';

@Controller('api')
@UseGuards(AuthGuard())
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post('createProfile')
  @UseInterceptors(LandscapeImageUploadInterceptor())
  async createProfile(
    @Body() createProfileDto: CreateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.profileService.createProfile(createProfileDto, req.user, file);
  }
  
  @Get('getProfile')
  async getProfile(@Req() req) {
    return this.profileService.getProfile(req.user);
  }

  @Put('updateProfile')
  @UseInterceptors(LandscapeImageUploadInterceptor())
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.profileService.updateProfile(updateProfileDto, req.user, file);
  }
}
