import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat-gateway';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let service: ChatService;
  let mockServer: Partial<Server>;
  let mockClient: any;

  const mockMessage = {
    _id: '507f1f77bcf86cd799439011',
    sender: '507f1f77bcf86cd799439012',
    senderUsername: 'testuser',
    content: 'Hello World',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    mockClient = {
      id: 'socket-id-1',
      userId: '507f1f77bcf86cd799439012',
      username: 'testuser',
      user: { _id: '507f1f77bcf86cd799439012', username: 'testuser' },
      emit: jest.fn(),
      broadcast: {
        emit: jest.fn(),
      },
    };

    const mockChatService = {
      saveMessage: jest.fn(),
      getMessages: jest.fn(),
      deleteMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    })
      .useMocker((token) => {
        // Mock the guard so it doesn't try to resolve dependencies
        if (token && token.name === 'WsJwtGuard') {
          return {};
        }
      })
      .compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('afterInit', () => {
    it('should initialize server', () => {
      const server: any = { emit: jest.fn() };
      gateway.afterInit(server);
      expect((gateway as any).server).toBe(server);
    });
  });

  describe('handleConnection', () => {
    it('should emit message history on client connection', async () => {
      const messages = [mockMessage];
      jest.spyOn(service, 'getMessages').mockResolvedValue(messages);

      await gateway.handleConnection(mockClient);

      expect(service.getMessages).toHaveBeenCalledWith(50);
      expect(mockClient.emit).toHaveBeenCalledWith('message_history', messages);
    });

    it('should broadcast user joined event', async () => {
      jest.spyOn(service, 'getMessages').mockResolvedValue([]);

      await gateway.handleConnection(mockClient);

      expect(mockClient.broadcast.emit).toHaveBeenCalledWith('user_joined', {
        username: 'testuser',
        message: 'testuser joined the chat',
      });
    });

    it('should handle connection error', async () => {
      jest
        .spyOn(service, 'getMessages')
        .mockRejectedValue(new Error('DB Error'));

      await expect(gateway.handleConnection(mockClient)).rejects.toThrow(
        'DB Error',
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should broadcast user left event', () => {
      gateway.afterInit(mockServer as any);
      gateway.handleDisconnect(mockClient);

      expect(mockServer.emit).toHaveBeenCalledWith('user_left', {
        username: 'testuser',
        message: 'testuser left the chat',
      });
    });
  });

  describe('handleSendMessage', () => {
    beforeEach(() => {
      gateway.afterInit(mockServer as any);
    });

    it('should save and broadcast message', async () => {
      const createMessageDto: CreateMessageDto = { content: 'Hello' };

      jest.spyOn(service, 'saveMessage').mockResolvedValue(mockMessage);

      const result = await gateway.handleSendMessage(
        mockClient,
        createMessageDto,
      );

      expect(service.saveMessage).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        'testuser',
        createMessageDto,
      );
      expect(mockServer.emit).toHaveBeenCalledWith(
        'receive_message',
        mockMessage,
      );
      expect(result).toEqual({ success: true, message: mockMessage });
    });

    it('should reject empty message content', async () => {
      const createMessageDto: CreateMessageDto = { content: '' };

      await gateway.handleSendMessage(mockClient, createMessageDto);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: expect.any(String),
      });
    });

    it('should reject whitespace-only message', async () => {
      const createMessageDto: CreateMessageDto = { content: '   ' };

      await gateway.handleSendMessage(mockClient, createMessageDto);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: expect.any(String),
      });
    });

    it('should handle service error gracefully', async () => {
      const createMessageDto: CreateMessageDto = { content: 'Hello' };
      const error = new Error('Save failed');

      jest.spyOn(service, 'saveMessage').mockRejectedValue(error);

      await gateway.handleSendMessage(mockClient, createMessageDto);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Save failed',
      });
    });
  });

  describe('handleDeleteMessage', () => {
    beforeEach(() => {
      gateway.afterInit(mockServer as any);
    });

    it('should delete message and broadcast event', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      jest.spyOn(service, 'deleteMessage').mockResolvedValue({ success: true });

      const result = await gateway.handleDeleteMessage(mockClient, {
        messageId,
      });

      expect(service.deleteMessage).toHaveBeenCalledWith(
        messageId,
        '507f1f77bcf86cd799439012',
      );
      expect(mockServer.emit).toHaveBeenCalledWith('message_deleted', {
        messageId,
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle delete error', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      const error = new Error('Unauthorized');

      jest.spyOn(service, 'deleteMessage').mockRejectedValue(error);

      await gateway.handleDeleteMessage(mockClient, { messageId });

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized',
      });
    });
  });

  describe('handleTyping', () => {
    it('should broadcast typing status', () => {
      gateway.handleTyping(mockClient, { isTyping: true });

      expect(mockClient.broadcast.emit).toHaveBeenCalledWith('user_typing', {
        username: 'testuser',
        isTyping: true,
      });
    });

    it('should broadcast stop typing', () => {
      gateway.handleTyping(mockClient, { isTyping: false });

      expect(mockClient.broadcast.emit).toHaveBeenCalledWith('user_typing', {
        username: 'testuser',
        isTyping: false,
      });
    });
  });
});
