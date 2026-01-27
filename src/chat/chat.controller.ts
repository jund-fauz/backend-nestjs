import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Get message history' })
  @ApiResponse({
    status: 200,
    description: 'Returns last 50 messages',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          sender: { type: 'string' },
          senderUsername: { type: 'string' },
          content: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getMessages() {
    return this.chatService.getMessages(50);
  }

  @Delete('messages/:messageId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Delete a message (only by sender)' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Only message sender can delete',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async deleteMessage(@Param('messageId') messageId: string, @Req() req) {
    return this.chatService.deleteMessage(messageId, req.user._id.toString());
  }

  @Get('ws-documentation')
  @ApiOperation({
    summary: 'WebSocket Chat Documentation',
    description: 'Returns WebSocket events and usage documentation',
  })
  @ApiResponse({
    status: 200,
    description: 'WebSocket documentation',
  })
  getWebSocketDocumentation() {
    return {
      message: 'WebSocket Chat Documentation',
      connection: {
        url: 'ws://localhost:3000',
        auth: {
          token: 'JWT_TOKEN_FROM_LOGIN',
        },
      },
      events: {
        clientToServer: {
          send_message: {
            description: 'Send a message to all connected clients',
            payload: { content: 'string' },
          },
          delete_message: {
            description: 'Delete a message (only by sender)',
            payload: { messageId: 'string' },
          },
          typing: {
            description: 'Emit typing status to other users',
            payload: { isTyping: 'boolean' },
          },
        },
        serverToClient: {
          message_history: {
            description: 'Sent on connection with last 50 messages',
            payload: 'Message[]',
          },
          receive_message: {
            description: 'Broadcasted when a new message is sent',
            payload: {
              _id: 'string',
              sender: 'string',
              senderUsername: 'string',
              content: 'string',
              createdAt: 'Date',
            },
          },
          user_joined: {
            description: 'Notifies when a user joins the chat',
            payload: {
              username: 'string',
              message: 'string',
            },
          },
          user_left: {
            description: 'Notifies when a user leaves the chat',
            payload: {
              username: 'string',
              message: 'string',
            },
          },
          user_typing: {
            description: 'Notifies when a user is typing',
            payload: {
              username: 'string',
              isTyping: 'boolean',
            },
          },
          message_deleted: {
            description: 'Notifies when a message is deleted',
            payload: {
              messageId: 'string',
            },
          },
          error: {
            description: 'Error event',
            payload: {
              message: 'string',
            },
          },
        },
      },
      example: {
        javascript: `
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => console.log('Connected'));
socket.on('message_history', (msgs) => console.log(msgs));
socket.on('receive_message', (msg) => console.log('New message:', msg));
socket.emit('send_message', { content: 'Hello' });
        `,
      },
    };
  }
}
