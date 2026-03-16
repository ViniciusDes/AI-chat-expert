export interface LlmClient {
  getStreamingReply(prompt: string): Promise<AsyncGenerator<string>>;
}
