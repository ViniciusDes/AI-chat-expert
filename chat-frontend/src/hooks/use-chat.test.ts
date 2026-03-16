import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import chat from '../services/chat.services';
import { useChat } from './use-chat';

vi.mock('../services/chat.services', () => ({
  default: { postMessageChat: vi.fn() },
}));

function jsonResponse(reply: string) {
  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('useChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('starts with no messages, not loading, and empty input', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.input).toBe('');
  });

  it('does nothing when the input is blank', async () => {
    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage();
    });
    expect(result.current.messages).toHaveLength(0);
    expect(vi.mocked(chat.postMessageChat)).not.toHaveBeenCalled();
  });

  it('does not fire a second request while one is already loading', async () => {
    vi.mocked(chat.postMessageChat).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('hello'));

    act(() => { void result.current.sendMessage(); });
    act(() => { void result.current.sendMessage(); });

    expect(vi.mocked(chat.postMessageChat)).toHaveBeenCalledTimes(1);
  });

  it('adds the user message and a bot placeholder right away', async () => {
    vi.mocked(chat.postMessageChat).mockResolvedValue(jsonResponse('ok'));

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('hello'));

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: 'hello' });
    expect(result.current.messages[1]).toMatchObject({ role: 'bot' });
  });

  it('clears the input after sending', async () => {
    vi.mocked(chat.postMessageChat).mockResolvedValue(jsonResponse('ok'));

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('hello'));

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.input).toBe('');
  });

  it('eventually shows the full bot reply after the typewriter drains', async () => {
    vi.mocked(chat.postMessageChat).mockResolvedValue(jsonResponse('Hello there!'));

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('hi'));

    await act(async () => {
      await result.current.sendMessage();
    });

    act(() => vi.advanceTimersByTime(500));

    const bot = result.current.messages.find((m) => m.role === 'bot');
    expect(bot?.content).toBe('Hello there!');
    expect(result.current.isLoading).toBe(false);
  });

  it('shows "Message cannot be empty." on a 400', async () => {
    vi.mocked(chat.postMessageChat).mockResolvedValue(new Response(null, { status: 400 }));

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('test'));

    await act(async () => {
      await result.current.sendMessage();
    });

    const bot = result.current.messages.find((m) => m.role === 'bot');
    expect(bot?.content).toBe('Message cannot be empty.');
    expect(result.current.isLoading).toBe(false);
  });

  it('shows the connection error on a 500', async () => {
    vi.mocked(chat.postMessageChat).mockResolvedValue(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('test'));

    await act(async () => {
      await result.current.sendMessage();
    });

    const bot = result.current.messages.find((m) => m.role === 'bot');
    expect(bot?.content).toBe('Connection lost, please retry.');
    expect(result.current.isLoading).toBe(false);
  });

  it('shows the connection error when the network throws', async () => {
    vi.mocked(chat.postMessageChat).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('test'));

    await act(async () => {
      await result.current.sendMessage();
    });

    const bot = result.current.messages.find((m) => m.role === 'bot');
    expect(bot?.content).toBe('Connection lost, please retry.');
    expect(result.current.isLoading).toBe(false);
  });

  it('cancelMessage stops loading and freezes whatever text was already shown', async () => {
    vi.mocked(chat.postMessageChat).mockResolvedValue(
      jsonResponse('a'.repeat(200))
    );

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('hi'));

    await act(async () => {
      await result.current.sendMessage();
    });

    act(() => result.current.cancelMessage());

    expect(result.current.isLoading).toBe(false);
  });

  it('cancelMessage works even when the request has not returned yet', () => {
    vi.mocked(chat.postMessageChat).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useChat());
    act(() => result.current.setInput('hi'));

    act(() => { void result.current.sendMessage(); });

    expect(result.current.isLoading).toBe(true);

    act(() => result.current.cancelMessage());

    expect(result.current.isLoading).toBe(false);
  });
});
