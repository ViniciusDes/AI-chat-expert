import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiClient } from './clients/gemini.client';
import { LLM_CLIENT } from './llm.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LLM_CLIENT,
      useClass: GeminiClient,
    },
  ],
  exports: [LLM_CLIENT],
})
export class LlmModule {}
