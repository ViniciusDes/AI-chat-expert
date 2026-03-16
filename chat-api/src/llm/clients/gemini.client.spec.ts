import { ConfigService } from '@nestjs/config';
import { GeminiClient } from './gemini.client';

const mockGenerateContentStream = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContentStream: mockGenerateContentStream,
    }),
  })),
  GoogleGenerativeAIRequestInputError: class GoogleGenerativeAIRequestInputError extends Error {},
  GoogleGenerativeAIAbortError: class GoogleGenerativeAIAbortError extends Error {},
  GoogleGenerativeAIFetchError: class GoogleGenerativeAIFetchError extends Error {},
}));

jest.mock('../system-instructions/system-instruction.factory', () => ({
  getSystemInstruction: jest.fn().mockReturnValue({
    getInstruction: () => 'you are a test bot',
  }),
}));

function makeConfigService(
  overrides: Record<string, string> = {},
): ConfigService {
  const defaults: Record<string, string> = {
    GEMINI_API_KEY: 'fake-key',
    SPECIALIST_TYPE: 'argentine-cuisine',
    ...overrides,
  };
  return {
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key in defaults) return defaults[key];
      throw new Error(`Missing env: ${key}`);
    }),
  } as unknown as ConfigService;
}

async function* fakeModelStream(...texts: string[]) {
  for (const text of texts) yield { text: () => text };
}

describe('GeminiClient', () => {
  let client: GeminiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GeminiClient(makeConfigService());
  });

  describe('getStreamingReply', () => {
    it('yields text from each chunk', async () => {
      mockGenerateContentStream.mockResolvedValue({
        stream: fakeModelStream('hello ', 'world'),
      });

      const chunks: string[] = [];
      for await (const chunk of await client.getStreamingReply(
        'what is asado?',
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['hello ', 'world']);
    });

    it('passes the user message to the model', async () => {
      mockGenerateContentStream.mockResolvedValue({
        stream: fakeModelStream('ok'),
      });

      for await (const _ of await client.getStreamingReply(
        'tell me about malbec',
      )) {
        // drain
      }

      expect(mockGenerateContentStream).toHaveBeenCalledWith(
        'tell me about malbec',
      );
    });

    it('propagates errors thrown by the model', async () => {
      mockGenerateContentStream.mockRejectedValue(
        new Error('API quota exceeded'),
      );

      await expect(client.getStreamingReply('anything')).rejects.toThrow(
        'Unexpected LLM error',
      );
    });

    it('yields nothing when the model returns an empty stream', async () => {
      mockGenerateContentStream.mockResolvedValue({
        stream: fakeModelStream(),
      });

      const chunks: string[] = [];
      for await (const chunk of await client.getStreamingReply('hello')) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(0);
    });
  });
});
