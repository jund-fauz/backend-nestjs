import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ required: true })
  senderUsername: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: new Date() })
  createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
