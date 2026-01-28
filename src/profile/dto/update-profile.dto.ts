import {
  IsArray,
  IsDate,
  IsEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '../schemas/profile.schema';
import { User } from 'src/user/schemas/user.schema';
import { Type, Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsEnum(Gender)
  readonly gender: Gender;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly birthday: Date;

  @IsOptional()
  @IsNumber()
  readonly height: number;

  @IsOptional()
  @IsNumber()
  readonly weight: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  readonly interests: string[];

  @IsOptional()
  @IsString()
  readonly profilePictureUrl: string;

  @IsOptional()
  profilePicture?: Express.Multer.File;

  @IsEmpty()
  readonly user: User;
}
