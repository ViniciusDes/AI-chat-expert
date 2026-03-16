import { useEffect, useRef } from "react";
import type { ChatMessage } from "../hooks/use-chat";
import { MessageBubble } from "./MessageBubble";

interface ScrollableMessagesProps {
  messages: ChatMessage[];
}

export function ScrollableMessages({ messages }: ScrollableMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <p className="empty-state">Send a message to start the conversation.</p>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
