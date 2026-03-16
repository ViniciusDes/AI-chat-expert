# Chat App

A simple AI chat app with a NestJS backend and a React frontend. The AI is powered by Google Gemini.

Watch a brief overview of the application: [video](https://www.canva.com/design/DAHEICgh6gA/vGIX5BGCrpEw6V4lPygGBw/edit?utm_content=DAHEICgh6gA&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

---

## Prerequisites

### Docker

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose (v2+)

### Local

| Tool | Version | Used by |
| ---- | ------- | ------- |
| [Node.js](https://nodejs.org/) | 22 | backend + frontend |
| [yarn](https://yarnpkg.com/) | any | backend (`chat-api`) |
| [yarn](https://yarnpkg.com/) | any | frontend (`chat-frontend`) |

---

## Getting started

### Clone the repository

```bash
git clone https://github.com/ViniciusDes/AI-chat-expert.git
cd AI-chat-expert
```

---

### How to run, option 1 — Docker

```bash
docker-compose up
```

- Frontend: http://localhost:5173
- API: http://localhost:3000

> You still need to set up the `.env` file before running (see below).

---

### Option 2 — Running locally

**Backend**

```bash
cd chat-api
yarn install
yarn start:dev
```

**Frontend** (in another terminal)

```bash
cd chat-frontend
yarn install
yarn dev
```

---

## Environment variables

Copy the example files and fill in your values:

**Backend**

```bash
cp chat-api/.env.example chat-api/.env
```

```env
GEMINI_API_KEY=your-gemini-api-key-here
SPECIALIST_TYPE=argentine-cuisine
```

Get your Gemini API key at [aistudio.google.com](https://aistudio.google.com).

**Frontend**

```bash
cp chat-frontend/.env.example chat-frontend/.env
```

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## Features worth knowing

### Streaming response

The API streams the AI reply chunk by chunk instead of waiting for the full response. On the frontend, the text appears gradually using a typewriter effect — the chunks land in a queue and are rendered at a steady pace so it feels smooth even when the network is slow.

### Cancel a request

While the AI is replying, there's a stop button. Clicking it aborts the in-flight HTTP request (`AbortController`) and immediately clears the typewriter queue, so the response stops right away without waiting for the stream to finish.

### AI specialist

You can change the AI's personality and area of expertise by setting `SPECIALIST_TYPE` in the `.env` file. Available options:

| Value               | Specialist                   |
| ------------------- | ---------------------------- |
| `argentine-cuisine` | Argentine food expert        |
| `classic-movies`    | Classic films buff           |
| `electric-cars`     | Electric vehicles enthusiast |

Restart the API after changing this value.

### Plugging in other LLM providers

The backend uses a simple interface to talk to any LLM:

```ts
interface LlmClient {
  getStreamingReply(prompt: string): Promise<AsyncGenerator<string>>;
}
```

The current implementation is Gemini, but you can add any other provider (OpenAI, Ollama, etc.) by creating a new class that implements this interface. The rest of the app doesn't need to change.
