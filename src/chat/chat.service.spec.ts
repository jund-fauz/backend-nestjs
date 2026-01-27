import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { Message } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

describe('ChatService', () => {
  let service: ChatService;
  let mockMessageModel: any;

  const mockMessage = {
    _id: '507f1f77bcf86cd799439011',
    sender: '507f1f77bcf86cd799439012',
    senderUsername: 'testuser',
    content: 'Hello World',
    createdAt: new Date(),
    toObject: jest.fn(function () {
      return {
        _id: this._id,
        sender: this.sender,
        senderUsername: this.senderUsername,
        content: this.content,
        createdAt: this.createdAt,
      };
    }),
  };

  beforeEach(async () => {
    mockMessageModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMessage', () => {
    it('should save a message successfully', async () => {
      const createMessageDto: CreateMessageDto = { content: 'Hello World' };
      const userId = '507f1f77bcf86cd799439012';
      const username = 'testuser';

      mockMessageModel.create.mockResolvedValue(mockMessage);

      const result = await service.saveMessage(
        userId,
        username,
        createMessageDto,
      );

      expect(mockMessageModel.create).toHaveBeenCalledWith({
        sender: userId,
        senderUsername: username,
        content: createMessageDto.content,
      });
      expect(result).toEqual(mockMessage.toObject());
    });

    it('should handle create message error', async () => {
      const createMessageDto: CreateMessageDto = { content: 'Hello' };
      const error = new Error('Database error');

      mockMessageModel.create.mockRejectedValue(error);

      await expect(
        service.saveMessage('userId', 'username', createMessageDto),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getMessages', () => {
    it('should retrieve messages in ascending order', async () => {
      const mockMessages = [
        mockMessage,
        { ...mockMessage, _id: '507f1f77bcf86cd799439013' },
      ];

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockMessages),
      };

      mockMessageModel.find.mockReturnValue(mockChain);

      const result = await service.getMessages(50);

      expect(mockMessageModel.find).toHaveBeenCalled();
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockMessages);
    });

    it('should use default limit of 50', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      mockMessageModel.find.mockReturnValue(mockChain);

      await service.getMessages();

      expect(mockChain.limit).toHaveBeenCalledWith(50);
    });

    it('should use custom limit', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      mockMessageModel.find.mockReturnValue(mockChain);

      await service.getMessages(100);

      expect(mockChain.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('deleteMessage', () => {
    it('should delete message by sender', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      mockMessageModel.findById.mockResolvedValue({
        sender: { toString: () => userId },
      });
      mockMessageModel.findByIdAndDelete.mockResolvedValue({
        ...mockMessage,
        _id: messageId,
      });

      const result = await service.deleteMessage(messageId, userId);

      expect(mockMessageModel.findById).toHaveBeenCalledWith(messageId);
      expect(mockMessageModel.findByIdAndDelete).toHaveBeenCalledWith(
        messageId,
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw error if message not found', async () => {
      mockMessageModel.findById.mockResolvedValue(null);

      await expect(
        service.deleteMessage('invalid-id', 'userId'),
      ).rejects.toThrow('Message not found');
    });

    it('should throw error if user is not sender', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';
      const senderId = '507f1f77bcf86cd799439013';

      mockMessageModel.findById.mockResolvedValue({
        sender: { toString: () => senderId },
      });

      await expect(service.deleteMessage(messageId, userId)).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should not call delete if user is not authorized', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      mockMessageModel.findById.mockResolvedValue({
        sender: { toString: () => 'different-user-id' },
      });

      await expect(service.deleteMessage(messageId, userId)).rejects.toThrow();
      expect(mockMessageModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});
