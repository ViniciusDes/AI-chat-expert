import { env } from "../env";

class ChatServices {
  private baseUrl = env.apiBaseUrl;

  postMessageChat(message: string, signal?: AbortSignal) {
    const requestBody = this.createBodyRequest(message);
    return fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    });
  }

  createBodyRequest(message: string): {
    message: string;
  } {
    return {
      message: message,
    };
  }
}

export default new ChatServices();
