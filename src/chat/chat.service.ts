import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async saveMessage(
    userId: string,
    username: string,
    createMessageDto: CreateMessageDto,
  ) {
    const message = await this.messageModel.create({
      sender: userId,
      senderUsername: username,
      content: createMessageDto.content,
    });
    return message.toObject();
  }

  async getMessages(limit: number = 50) {
    return this.messageModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .then((messages) => messages.reverse());
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    if (message.sender.toString() !== userId) {
      throw new Error('Unauthorized');
    }
    await this.messageModel.findByIdAndDelete(messageId);
    return { success: true };
  }
}
