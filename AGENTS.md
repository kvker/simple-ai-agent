# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Running the Project

This is a minimal Node.js demo using Express and the Vercel AI SDK with DeepSeek. There are no build, test, or lint scripts.

- Install dependencies: `pnpm install`
- Start the server: `node server.js`
- Open `http://localhost:3000` in a browser

The server requires a `DEEPSEEK_API_KEY` environment variable. `server.js` has a hardcoded fallback key on line 4 — do not commit new keys or sensitive values.

## Architecture

- **Backend**: `server.js` — Express server exposing a single `POST /api/chat` endpoint.
- **Frontend**: `index.html` — vanilla HTML/JS chat UI that consumes the streamed response.
- **Streaming**: The backend uses `streamText` with `pipeTextStreamToResponse` to stream chunks directly to the frontend, which reads them via `response.body.getReader()`.

## AI Integration Pattern

The project demonstrates a ReAct-style multi-step loop:

- `maxSteps: 5` is set in `streamText`, allowing the model to call tools and reason across multiple turns.
- Tools are defined with Zod schemas via the `tool()` helper from `ai`.
- Two mock tools are registered in `server.js`:
  - `getWeather` — returns static weather data.
  - `sendEmail` — logs to the console and returns a success message.

When modifying or adding tools, keep Zod schemas strict and avoid returning `undefined` fields in `execute` results (see the commented note in `getWeather`).
