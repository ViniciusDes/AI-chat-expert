import { Inject, Injectable } from '@nestjs/common';
import { SendMessageDto } from './dtos/send-message.dto';
import { LLM_CLIENT } from 'src/llm/llm.constants';
import { LlmClient } from 'src/llm/interfaces/llm-client.interface';

@Injectable()
export class ChatService {
  constructor(
    @Inject(LLM_CLIENT)
    private readonly llmClient: LlmClient,
  ) {}
  processMessage(requestBody: SendMessageDto): Promise<AsyncGenerator<string>> {
    return this.llmClient.getStreamingReply(String(requestBody.message));
  }
}
