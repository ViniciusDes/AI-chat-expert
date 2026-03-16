import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmModule } from '../llm/llm.module';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';

@Module({
  imports: [LlmModule],
  controllers: [ChatController],
  providers: [ChatService, RateLimitGuard],
})
export class ChatModule {}
