import type { ChatMessage } from "../hooks/use-chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isEmpty = message.content === "";

  return (
    <div className={`message-bubble ${isUser ? "message-user" : "message-bot"}`}>
      <div className="message-content">
        {isEmpty && !isUser ? (
          <span className="typing-indicator">Typing…</span>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}
