import { Test } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { LLM_CLIENT } from 'src/llm/llm.constants';

async function* fakeStream(...chunks: string[]) {
  for (const chunk of chunks) yield chunk;
}

describe('ChatService', () => {
  let service: ChatService;
  let llmClient: { getStreamingReply: jest.Mock };

  beforeEach(async () => {
    llmClient = { getStreamingReply: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [ChatService, { provide: LLM_CLIENT, useValue: llmClient }],
    }).compile();

    service = module.get(ChatService);
  });

  it('delegates to llm client with the message', () => {
    llmClient.getStreamingReply.mockReturnValue(fakeStream('hello'));

    service.processMessage({ message: 'what is asado?' });

    expect(llmClient.getStreamingReply).toHaveBeenCalledWith('what is asado?');
  });

  it('streams all chunks from the llm', async () => {
    llmClient.getStreamingReply.mockReturnValue(
      fakeStream('chunk1', 'chunk2', 'chunk3'),
    );

    const stream = await service.processMessage({
      message: 'tell me about malbec',
    });
    const collected: string[] = [];

    for await (const chunk of stream) {
      collected.push(chunk);
    }

    expect(collected).toEqual(['chunk1', 'chunk2', 'chunk3']);
  });
});
