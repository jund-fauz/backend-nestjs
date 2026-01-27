import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat-gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Message, MessageSchema } from './schemas/message.schema';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from '../user/schemas/user.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../user/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    PassportModule,
  ],
  providers: [ChatGateway, ChatService, JwtStrategy],
  controllers: [ChatController],
})
export class ChatModule {}
