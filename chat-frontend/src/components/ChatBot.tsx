import { useChat } from "../hooks/use-chat";
import { ScrollableMessages } from "./ScrollableMessage";

export function ChatBox() {
  const { messages, isLoading, input, setInput, sendMessage, cancelMessage, inputRef } =
    useChat();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-box">
      <ScrollableMessages messages={messages} />
      <div className="chat-input-area">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoFocus
        />
        {isLoading ? (
          <button className="cancel-button" onClick={cancelMessage}>
            Stop
          </button>
        ) : (
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
