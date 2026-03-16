import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, Logger } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';

async function* fakeStream(...chunks: string[]) {
  for (const chunk of chunks) yield chunk;
}

async function* failingStream() {
  yield 'first chunk';
  throw new Error('LLM blew up');
}

function makeRes() {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    writableEnded: false,
  };
  return res;
}

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: { processMessage: jest.Mock };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    chatService = { processMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: chatService },
        RateLimitGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ChatController);
  });

  describe('successful stream', () => {
    it('sets SSE headers before writing', async () => {
      chatService.processMessage.mockReturnValue(fakeStream('hello'));
      const res = makeRes();

      await controller.stream({ message: 'hi' }, res as any);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    });

    it('responds with 200', async () => {
      chatService.processMessage.mockReturnValue(fakeStream('hi'));
      const res = makeRes();

      await controller.stream({ message: 'hello' }, res as any);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    });

    it('writes each chunk in SSE data format', async () => {
      chatService.processMessage.mockReturnValue(fakeStream('hello', ' world'));
      const res = makeRes();

      await controller.stream({ message: 'hi' }, res as any);

      expect(res.write).toHaveBeenCalledTimes(2);
      expect(res.write).toHaveBeenNthCalledWith(
        1,
        `reply: ${JSON.stringify({ text: 'hello' })}\n\n`,
      );
      expect(res.write).toHaveBeenNthCalledWith(
        2,
        `reply: ${JSON.stringify({ text: ' world' })}\n\n`,
      );
    });

    it('ends the response after the stream completes', async () => {
      chatService.processMessage.mockReturnValue(fakeStream('chunk'));
      const res = makeRes();

      await controller.stream({ message: 'hi' }, res as any);

      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('writes SSE error event when the stream throws mid-way', async () => {
      chatService.processMessage.mockReturnValue(failingStream());
      const res = makeRes();

      await controller.stream({ message: 'hi' }, res as any);

      expect(res.write).toHaveBeenLastCalledWith(
        `error: ${JSON.stringify({ message: 'An error occurred while processing your request.' })}\n\n`,
      );
    });

    it('ends the response cleanly when the stream throws mid-way', async () => {
      chatService.processMessage.mockReturnValue(failingStream());
      const res = makeRes();

      await controller.stream({ message: 'hi' }, res as any);

      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('client disconnect', () => {
    it('stops writing when the connection closes', async () => {
      chatService.processMessage.mockReturnValue(fakeStream('a', 'b', 'c'));
      const res = makeRes();

      res.on.mockImplementation((event: string, cb: () => void) => {
        if (event === 'close') cb();
      });

      await controller.stream({ message: 'hi' }, res as any);

      expect(res.write).toHaveBeenCalledTimes(0);
      expect(res.end).toHaveBeenCalled();
    });
  });
});
