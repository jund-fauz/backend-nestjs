import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockMessage = {
    _id: '507f1f77bcf86cd799439011',
    sender: '507f1f77bcf86cd799439012',
    senderUsername: 'testuser',
    content: 'Hello World',
    createdAt: new Date(),
  };

  const mockMessages = [
    mockMessage,
    {
      ...mockMessage,
      _id: '507f1f77bcf86cd799439013',
      content: 'Second message',
    },
  ];

  const mockRequest = {
    user: {
      _id: { toString: () => '507f1f77bcf86cd799439012' },
      username: 'testuser',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    const mockChatService = {
      getMessages: jest.fn().mockResolvedValue(mockMessages),
      deleteMessage: jest.fn().mockResolvedValue({ success: true }),
      saveMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('should return array of messages', async () => {
      const result = await controller.getMessages();

      expect(service.getMessages).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockMessages);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no messages', async () => {
      jest.spyOn(service, 'getMessages').mockResolvedValue([]);

      const result = await controller.getMessages();

      expect(result).toEqual([]);
    });

    it('should handle service error', async () => {
      jest
        .spyOn(service, 'getMessages')
        .mockRejectedValue(new Error('Database error'));

      await expect(controller.getMessages()).rejects.toThrow('Database error');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      const messageId = '507f1f77bcf86cd799439011';

      const result = await controller.deleteMessage(messageId, mockRequest);

      expect(service.deleteMessage).toHaveBeenCalledWith(
        messageId,
        '507f1f77bcf86cd799439012',
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle unauthorized deletion', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      jest
        .spyOn(service, 'deleteMessage')
        .mockRejectedValue(new Error('Unauthorized'));

      await expect(
        controller.deleteMessage(messageId, mockRequest),
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle message not found error', async () => {
      const messageId = 'non-existent-id';
      jest
        .spyOn(service, 'deleteMessage')
        .mockRejectedValue(new Error('Message not found'));

      await expect(
        controller.deleteMessage(messageId, mockRequest),
      ).rejects.toThrow('Message not found');
    });
  });

  describe('getWebSocketDocumentation', () => {
    it('should return WebSocket documentation', () => {
      const result = controller.getWebSocketDocumentation();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('connection');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('example');
      expect(result.message).toBe('WebSocket Chat Documentation');
    });

    it('should include client to server events', () => {
      const result = controller.getWebSocketDocumentation();

      expect(result.events.clientToServer).toHaveProperty('send_message');
      expect(result.events.clientToServer).toHaveProperty('delete_message');
      expect(result.events.clientToServer).toHaveProperty('typing');
    });

    it('should include server to client events', () => {
      const result = controller.getWebSocketDocumentation();

      expect(result.events.serverToClient).toHaveProperty('message_history');
      expect(result.events.serverToClient).toHaveProperty('receive_message');
      expect(result.events.serverToClient).toHaveProperty('user_joined');
      expect(result.events.serverToClient).toHaveProperty('user_left');
      expect(result.events.serverToClient).toHaveProperty('user_typing');
      expect(result.events.serverToClient).toHaveProperty('message_deleted');
      expect(result.events.serverToClient).toHaveProperty('error');
    });

    it('should include connection information', () => {
      const result = controller.getWebSocketDocumentation();

      expect(result.connection.url).toBe('ws://localhost:3000');
      expect(result.connection.auth).toHaveProperty('token');
    });

    it('should include JavaScript example', () => {
      const result = controller.getWebSocketDocumentation();

      expect(result.example.javascript).toContain('io(');
      expect(result.example.javascript).toContain('emit');
      expect(result.example.javascript).toContain('on');
    });
  });
});
