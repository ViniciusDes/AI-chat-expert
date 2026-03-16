import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GenerativeModel,
  GoogleGenerativeAI,
  GoogleGenerativeAIAbortError,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIRequestInputError,
} from '@google/generative-ai';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LlmClient } from '../interfaces/llm-client.interface';
import { getSystemInstruction } from '../system-instructions/system-instruction.factory';

@Injectable()
export class GeminiClient implements LlmClient {
  private readonly model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    const specialistType =
      this.configService.getOrThrow<string>('SPECIALIST_TYPE');

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: getSystemInstruction(specialistType).getInstruction(),
    });
  }

  async getStreamingReply(
    userMessage: string,
  ): Promise<AsyncGenerator<string>> {
    let result: Awaited<ReturnType<typeof this.model.generateContentStream>>;

    try {
      result = await this.model.generateContentStream(userMessage);
    } catch (e) {
      throw this.mapError(e);
    }

    return this.streamChunks(result.stream);
  }

  private async *streamChunks(
    stream: AsyncIterable<{ text(): string }>,
  ): AsyncGenerator<string> {
    for await (const chunk of stream) {
      yield chunk.text();
    }
  }

  private mapError(e: unknown): HttpException {
    if (e instanceof GoogleGenerativeAIRequestInputError) {
      return new BadRequestException(e.message);
    }

    if (e instanceof GoogleGenerativeAIAbortError) {
      return new ServiceUnavailableException('LLM service unavailable');
    }

    if (e instanceof GoogleGenerativeAIFetchError) {
      const status = e.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return new HttpException(e.statusText ?? e.message, status);
    }

    return new InternalServerErrorException('Unexpected LLM error');
  }
}
