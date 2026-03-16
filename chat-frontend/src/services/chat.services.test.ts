import { beforeEach, describe, expect, it, vi } from 'vitest';
import chat from './chat.services';

describe('ChatServices', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to the right endpoint', async () => {
    await chat.postMessageChat('hello');
    expect(fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL}/chat`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('sends the message in the body', async () => {
    await chat.postMessageChat('what is the weather?');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ message: 'what is the weather?' }),
      })
    );
  });

  it('sets the content-type header', async () => {
    await chat.postMessageChat('hi');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('forwards the abort signal when provided', async () => {
    const controller = new AbortController();
    await chat.postMessageChat('hi', controller.signal);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it('works without a signal', async () => {
    await expect(chat.postMessageChat('hi')).resolves.not.toThrow();
  });

  describe('request body', () => {
    it('contains only the message field', async () => {
      await chat.postMessageChat('hello');
      const body = JSON.parse(
        (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string
      );
      expect(Object.keys(body)).toEqual(['message']);
    });

    it('preserves the message value exactly', async () => {
      const message = '  what about "asado" & empanadas? ';
      await chat.postMessageChat(message);
      const body = JSON.parse(
        (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string
      );
      expect(body.message).toBe(message);
    });
  });
});
