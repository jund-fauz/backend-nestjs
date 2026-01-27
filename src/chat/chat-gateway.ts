import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { WsJwtGuard } from './ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
  user: any;
}

@WebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'] } })
@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private logger = new Logger(ChatGateway.name);
  private server: Server;

  constructor(private chatService: ChatService) {}

  afterInit(server: Server) {
    this.server = server;
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}, User: ${client.username}`);

    const messages = await this.chatService.getMessages(50);
    client.emit('message_history', messages);

    client.broadcast.emit('user_joined', {
      username: client.username,
      message: `${client.username} joined the chat`,
    });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(
      `Client disconnected: ${client.id}, User: ${client.username}`,
    );
    this.server.emit('user_left', {
      username: client.username,
      message: `${client.username} left the chat`,
    });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      if (!createMessageDto.content || createMessageDto.content.trim() === '') {
        throw new BadRequestException('Message content cannot be empty');
      }

      const message = await this.chatService.saveMessage(
        client.userId,
        client.username,
        createMessageDto,
      );
      this.server.emit('receive_message', message);
      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      await this.chatService.deleteMessage(data.messageId, client.userId);
      this.server.emit('message_deleted', { messageId: data.messageId });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting message: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { isTyping: boolean },
  ) {
    client.broadcast.emit('user_typing', {
      username: client.username,
      isTyping: data.isTyping,
    });
  }
}
