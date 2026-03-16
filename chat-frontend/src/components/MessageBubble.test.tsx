import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  it('applies the user class to user messages', () => {
    const { container } = render(
      <MessageBubble message={{ id: '1', role: 'user', content: 'hello' }} />
    );
    expect(container.firstChild).toHaveClass('message-user');
  });

  it('applies the bot class to bot messages', () => {
    const { container } = render(
      <MessageBubble message={{ id: '1', role: 'bot', content: 'hello' }} />
    );
    expect(container.firstChild).toHaveClass('message-bot');
  });

  it('shows "Typing…" when the bot message is still empty', () => {
    render(<MessageBubble message={{ id: '1', role: 'bot', content: '' }} />);
    expect(screen.getByText('Typing…')).toBeInTheDocument();
  });

  it('does not show "Typing…" once the bot has content', () => {
    render(<MessageBubble message={{ id: '1', role: 'bot', content: 'Here is my answer' }} />);
    expect(screen.queryByText('Typing…')).not.toBeInTheDocument();
    expect(screen.getByText('Here is my answer')).toBeInTheDocument();
  });

  it('does not show "Typing…" for an empty user message', () => {
    render(<MessageBubble message={{ id: '1', role: 'user', content: '' }} />);
    expect(screen.queryByText('Typing…')).not.toBeInTheDocument();
  });

  it('renders the full message content', () => {
    render(
      <MessageBubble message={{ id: '1', role: 'user', content: 'What is the capital of France?' }} />
    );
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
  });
});
