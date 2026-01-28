import {
  IsArray,
  IsDate,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '../schemas/profile.schema';
import { User } from 'src/user/schemas/user.schema';
import { Type } from 'class-transformer';

export class CreateProfileDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly interests: string[];

  @IsNotEmpty()
  @IsEnum(Gender)
  readonly gender: Gender;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly birthday: Date;

  @IsNotEmpty()
  @IsNumber()
  readonly height: number;

  @IsNotEmpty()
  @IsNumber()
  readonly weight: number;

  @IsOptional()
  @IsString()
  readonly profilePictureUrl: string;

  @IsOptional()
  profilePicture?: Express.Multer.File;

  @IsEmpty()
  readonly user: User;
}
