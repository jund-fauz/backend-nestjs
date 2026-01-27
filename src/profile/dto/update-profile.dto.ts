import {
  IsDate,
  IsEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '../schemas/profile.schema';
import { User } from 'src/user/schemas/user.schema';
import { Type } from 'class-transformer';

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
  @IsString()
  readonly profilePictureUrl: string;

  @IsEmpty()
  readonly user: User;
}
