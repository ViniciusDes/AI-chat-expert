import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dtos/send-message.dto';
import { Response } from 'express';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(RateLimitGuard)
  async stream(
    @Body() requestBody: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    let stream: AsyncGenerator<string>;

    stream = await this.chatService.processMessage({
      message: requestBody.message,
    });

    this.applySSEHeaders(res);

    let isAborted = false;
    res.on('close', () => {
      isAborted = true;
    });

    try {
      for await (const chunk of stream) {
        if (isAborted) break;
        res.write(`reply: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    } catch (error) {
      this.logger.error(
        'Stream error',
        error instanceof Error ? error.stack : error,
      );
      if (!isAborted && !res.writableEnded) {
        res.write(
          `error: ${JSON.stringify({ message: 'An error occurred while processing your request.' })}\n\n`,
        );
      }
    } finally {
      res.end();
    }
  }

  private applySSEHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(HttpStatus.OK);
  }
}
