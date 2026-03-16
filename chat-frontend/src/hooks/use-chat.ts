import { useState, useRef, useCallback, useEffect } from "react";
import chat from "../services/chat.services";

export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
};

const CHARS_PER_TICK = 7;
const TICK_MS = 16;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const charQueueRef = useRef<string[]>([]);
  const displayedRef = useRef<string>("");
  const networkDoneRef = useRef<boolean>(false);
  const intervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentBotIdRef = useRef<string | null>(null);

  const updateBot = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }, []);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const stopTypewriter = useCallback(
    (botId: string, errorMessage?: string) => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      charQueueRef.current = [];
      if (errorMessage !== undefined) {
        updateBot(botId, errorMessage);
      }
      setIsLoading(false);
    },
    [updateBot]
  );

  const cancelMessage = useCallback(() => {
    abortControllerRef.current?.abort();
    if (currentBotIdRef.current !== null) {
      stopTypewriter(currentBotIdRef.current);
      currentBotIdRef.current = null;
    }
  }, [stopTypewriter]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const botMessageId = crypto.randomUUID();
    const botPlaceholder: ChatMessage = {
      id: botMessageId,
      role: "bot",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, botPlaceholder]);
    setInput("");
    setIsLoading(true);

    charQueueRef.current = [];
    displayedRef.current = "";
    networkDoneRef.current = false;
    currentBotIdRef.current = botMessageId;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    intervalRef.current = window.setInterval(() => {
      if (charQueueRef.current.length > 0) {
        const batch = charQueueRef.current.splice(0, CHARS_PER_TICK);
        displayedRef.current += batch.join("");
        updateBot(botMessageId, displayedRef.current);
      } else if (networkDoneRef.current) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        currentBotIdRef.current = null;
        setIsLoading(false);
      }
    }, TICK_MS);

    try {
      const response = await chat.postMessageChat(trimmed, controller.signal);

      if (response.status === 400) {
        stopTypewriter(botMessageId, "Message cannot be empty.");
        return;
      }

      if (response.status === 429) {
        stopTypewriter(botMessageId, "Connection lost, please retry again later");
        return;
      }

      if (!response.ok) {
        stopTypewriter(botMessageId, "Connection lost, please retry.");
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const data = (await response.json()) as { reply: string };
        const reply = data.reply ?? "No reply received.";
        charQueueRef.current.push(...reply.split(""));
      } else {
        const reader = response.body?.getReader();
        if (!reader) {
          stopTypewriter(botMessageId, "Connection lost, please retry.");
          return;
        }

        const decoder = new TextDecoder();
        let accumulated = "";
        let streamError: string | null = null;

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw = decoder.decode(value, { stream: true });
          const lines = raw.split("\n").filter((l) => l.trim().length > 0);
          const prevLen = accumulated.length;

          for (const line of lines) {
            if (line.startsWith("error: ")) {
              const errorText = line.slice(7).trim();
              try {
                const parsed = JSON.parse(errorText) as { message?: string };
                streamError = parsed.message ?? "An error occurred.";
              } catch {
                streamError = "An error occurred.";
              }
              break outer;
            }

            const text = line.startsWith("reply: ")
              ? line.slice(7).trim()
              : line.trim();

            if (text === "[DONE]") break outer;

            try {
              const parsed = JSON.parse(text) as {
                text?: string;
                reply?: string;
              };
              accumulated += parsed.text ?? parsed.reply ?? "";
            } catch {
              accumulated += text;
            }
          }

          const newChars = accumulated.slice(prevLen);
          if (newChars) {
            charQueueRef.current.push(...newChars.split(""));
          }
        }

        if (streamError !== null) {
          stopTypewriter(botMessageId, streamError);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        stopTypewriter(botMessageId);
      } else {
        stopTypewriter(botMessageId, "Connection lost, please retry.");
      }
    } finally {
      networkDoneRef.current = true;
      abortControllerRef.current = null;
    }
  }, [input, isLoading, updateBot, stopTypewriter]);

  return {
    messages,
    isLoading,
    input,
    setInput,
    sendMessage,
    cancelMessage,
    inputRef,
  };
}
