import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum Horoscope {
  ARIES = 'Aries',
  TAURUS = 'Taurus',
  GEMINI = 'Gemini',
  CANCER = 'Cancer',
  LEO = 'Leo',
  VIRGO = 'Virgo',
  LIBRA = 'Libra',
  SCORPIUS = 'Scorpius',
  SAGITTARIUS = 'Sagittarius',
  CAPRICORNUS = 'Capricornus',
  AQUARIUS = 'Aquarius',
  PISCES = 'Pisces',
}

export enum Zodiac {
  RAT = 'Rat',
  OX = 'Ox',
  TIGER = 'Tiger',
  RABBIT = 'Rabbit',
  DRAGON = 'Dragon',
  SNAKE = 'Snake',
  HORSE = 'Horse',
  GOAT = 'Goat',
  MONKEY = 'Monkey',
  ROOSTER = 'Rooster',
  DOG = 'Dog',
  BOAR = 'Boar',
}

@Schema({ versionKey: false })
export class Profile {
  @Prop()
  name: string;

  @Prop()
  gender: Gender;

  @Prop()
  birthday: Date;

  @Prop()
  height: number;

  @Prop()
  weight: number;

  @Prop()
  horoscope: Horoscope;

  @Prop()
  zodiac: Zodiac;

  @Prop()
  interests: string[];

  @Prop()
  profilePictureUrl: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
