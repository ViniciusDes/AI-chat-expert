import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import chat from '../services/chat.services';
import { ChatBox } from './ChatBot';

vi.mock('../services/chat.services', () => ({
  default: { postMessageChat: vi.fn() },
}));

function jsonResponse(reply: string) {
  return new Response(JSON.stringify({ reply }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ChatBox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the input and the Send button', () => {
    render(<ChatBox />);
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('Send is disabled when the input is empty', () => {
    render(<ChatBox />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('Send becomes enabled once the user types something', () => {
    render(<ChatBox />);
    fireEvent.change(screen.getByPlaceholderText(/type a message/i), {
      target: { value: 'hello' },
    });
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
  });

  it('shows the Stop button while a request is in flight', () => {
    vi.mocked(chat.postMessageChat).mockReturnValue(new Promise(() => {}));

    render(<ChatBox />);
    fireEvent.change(screen.getByPlaceholderText(/type a message/i), {
      target: { value: 'hello' },
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  });

  it('clicking Stop brings back the Send button', () => {
    vi.mocked(chat.postMessageChat).mockReturnValue(new Promise(() => {}));

    render(<ChatBox />);
    fireEvent.change(screen.getByPlaceholderText(/type a message/i), {
      target: { value: 'hello' },
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    });

    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('submits on Enter key', () => {
    vi.mocked(chat.postMessageChat).mockReturnValue(new Promise(() => {}));

    render(<ChatBox />);
    const input = screen.getByPlaceholderText(/type a message/i);

    fireEvent.change(input, { target: { value: 'hello' } });
    act(() => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(vi.mocked(chat.postMessageChat)).toHaveBeenCalledWith(
      'hello',
      expect.any(AbortSignal)
    );
  });

  it('does not submit on Shift+Enter', () => {
    render(<ChatBox />);
    const input = screen.getByPlaceholderText(/type a message/i);

    fireEvent.change(input, { target: { value: 'hello' } });
    act(() => {
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    });

    expect(vi.mocked(chat.postMessageChat)).not.toHaveBeenCalled();
  });

  it('displays user and bot messages after a successful exchange', async () => {
    vi.mocked(chat.postMessageChat).mockResolvedValue(jsonResponse('Hi there!'));

    render(<ChatBox />);
    fireEvent.change(screen.getByPlaceholderText(/type a message/i), {
      target: { value: 'hey' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });

    act(() => vi.advanceTimersByTime(500));

    expect(screen.getByText('hey')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });
});
