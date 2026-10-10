# Zenvora AI — Your Intelligent Workspace

A premium, responsive AI workspace for exploring ideas, learning technical concepts, and preparing for software-development interviews. Zenvora uses Google's official Gemini SDK through a small Express API; the API key stays on the server.

## Features

- Real Gemini conversations with follow-up context, using the official `@google/genai` Interactions API (`gemini-3.8-flash`).
- Markdown, GitHub-flavored tables/lists, syntax-highlighted code, and copy controls.
- Local conversation history with create, rename, and delete actions.
- Suggested prompts and focused Coding (Java, Python, SQL), Study, Interview Preparation, and Resume Coach modes.
- Search conversation titles and message content; rename and delete saved conversations.
- PDF resume text extraction with server-side validation, page/file limits, and an optional user-triggered AI review.
- Light/dark themes, collapsible desktop sidebar, and mobile navigation drawer.
- Request validation, payload limits, configurable CORS, rate limiting, Helmet headers, and safe API errors.
- Resume guidance is not a hiring guarantee; no ATS score is generated. PDF image OCR is not supported.

## Architecture

```text
frontend/  React 18 + Vite + Tailwind CSS + react-markdown
backend/   Express API + Google GenAI SDK + Gemini Interactions API
```

The browser calls `POST /api/chat`. In local development, Vite proxies `/api` to the Express server. The server checks the request, adds the selected assistant instructions and conversation context, then calls Gemini with storage disabled. Chat history and theme preference are stored in the browser's local storage; the existing storage keys are retained so this rebrand preserves saved conversations and theme settings.

Resume PDFs are uploaded to `POST /api/resume/parse` and parsed in memory on the backend using `pdf-parse`. Uploads must be PDFs with matching MIME type, `.pdf` extension, and PDF signature; the backend limits each file to 5 MB and 20 pages and returns at most 7,000 characters of extracted text. Zenvora does not save uploaded file bytes or extracted text on its server. The browser retains extracted text only until the user requests a review; then that text becomes a chat message in local conversation history and is sent to Gemini. Scanned/image-only PDFs, OCR, password-protected documents, and malformed PDFs are unsupported and receive an explicit error. Never upload sensitive data you do not want processed.

## Requirements

- Node.js 20.16+ (20.x), or 22.3+ (including newer major releases), and npm. This follows `pdf-parse`'s supported Node engine range; Node 21 is not supported.
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- The [official Gemini Interactions API documentation](https://ai.google.dev/gemini-api/docs/interactions-overview) describes the SDK method, model, and response field used here.

## Setup and run in VS Code (Windows PowerShell)

Open the existing project folder in VS Code, then run these commands in its integrated terminal:

```powershell
npm install
if (-not (Test-Path .\backend\.env)) {
  Copy-Item .\backend\.env.example .\backend\.env
}
```

Open `backend/.env` in VS Code and add your valid `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/app/apikey). Keep the key in this server-side file; do not put it in frontend code, a `VITE_` variable, source control, or a chat message. The `.env` file is ignored by Git. Restart the backend after changing environment values.

From the project root, start both the backend (defaults to `http://localhost:3002`) and frontend with:

```powershell
npm run dev
```

The frontend uses `http://localhost:5174` in strict-port mode, so it reports a clear error instead of silently choosing another port. The Vite `/api` proxy and Express server both read `PORT` from `backend/.env`; if it is not set, both use `3002`. A backend startup failure is reported without automatically stopping the frontend, so its error remains visible while you debug. If the API key is missing or invalid, Zenvora reports an error instead of returning a fabricated answer.

The root command starts the backend once with its `start` script and the frontend with Vite's `dev` script. Keep one root development session running; strict ports prevent duplicate sessions from silently moving to other ports. Restart the root command to reload backend code changes. To start the servers separately, run `npm run start --workspace backend` in one terminal and `npm run dev --workspace frontend` in another, both from the project root.

### Troubleshooting a busy development port

The root `npm run dev` starts one Express server and one Vite server. If you see `EADDRINUSE` or Vite reports port 5174 is occupied, an earlier process may still be running. The backend uses port `3002` by default to avoid conflicting with other local services on `3001`. In PowerShell, identify the listener and its command before stopping anything:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3002,5174 | Select-Object LocalPort, OwningProcess
Get-CimInstance Win32_Process -Filter "ProcessId = <PID>" | Select-Object ProcessId, CommandLine
```

Stop a listener only after confirming its command belongs to this project:

```powershell
Stop-Process -Id <PID>
```

Then rerun `npm run dev`. If the backend fails to bind, `concurrently` leaves Vite running so the API error remains visible. If you deliberately configure a different backend `PORT` in `backend/.env`, both the backend and Vite proxy use it automatically.

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for chat | Private key used only by the Express backend |
| `PORT` | No | Backend port; defaults to `3002`. The Vite proxy reads this same setting. |
| `FRONTEND_ORIGIN` | No | Comma-separated allowed frontend origins; the example includes `http://localhost:5173`, `http://localhost:5174`, and `http://127.0.0.1:5174`. Outside production, the local origins are also allowed for development. In production only the configured list is allowed. |

Do not expose secrets in frontend environment variables or API responses.

## API

### `POST /api/chat`

Request:

```json
{
  "messages": [
    { "role": "user", "content": "Explain Java interfaces with an example." },
    { "role": "assistant", "content": "An interface defines a contract..." },
    { "role": "user", "content": "How does that compare with an abstract class?" }
  ],
  "mode": "chat"
}
```

`mode` accepts `chat`, `coding`, `study`, `interview`, or `resume` and is optional. The backend uses the official `@google/genai` SDK Interactions API (`ai.interactions.create`) and the documented `gemini-3.8-flash` model. Successful responses have `{ "reply": "...", "model": "gemini-3.8-flash" }`. Errors have a user-safe `{ "error": "...", "code": "..." }` shape. The route accepts at most 30 messages, 8,000 characters per message, 30,000 aggregate characters, and limits JSON requests to 64 KB. It allows 20 requests per IP per 15-minute window by default.

### `POST /api/resume/parse`

Send a multipart form with one `file` field containing a PDF. Successful responses contain `{ "text": "...", "pages": 1, "truncated": false }`. The endpoint permits up to 5 requests per IP per 15-minute window. Size, page, type, malformed-PDF, encrypted, and no-selectable-text failures return explicit error codes. PDF parsing extracts text only and never executes uploaded contents.

`GET /api/health` returns `{ "status": "ok" }`.

## Checks

Run backend validation and API tests:

```powershell
npm test
```

Build the production frontend:

```powershell
npm run build
```

The tests cover each assistant mode's instructions, request validation, message-size limits, the health route, missing-key and chat/upload rate-limit handling, and the backend's Gemini request/response contract using a test-only injected client. Resume upload tests cover valid PDF text extraction, type/signature/size failures, and rate limiting. A real Gemini-generated response requires a valid API key and is not replaced with a mock outside tests.

## Deployment

Deploy the frontend and Node API separately:

1. **Backend (Render, Railway, or another Node.js host):** deploy the `backend` workspace (or root workspace), run `npm install` and `npm run start --workspace backend`, and set `GEMINI_API_KEY`, `PORT` if required by the host, and `FRONTEND_ORIGIN` to the deployed frontend URL. Add secrets in the host's environment-variable settings, not in Git.
2. **Frontend (Vercel):** deploy the `frontend` workspace with Vite and set the build command to `npm run build --workspace frontend` from the repository root (output directory `frontend/dist`). Configure `VITE_API_BASE_URL` to the backend's HTTPS origin (for example `https://zenvora-api.example.com`). This variable is a public API address, not a secret.
3. Set the backend's `FRONTEND_ORIGIN` to the frontend's exact HTTPS origin. In local development, leave `VITE_API_BASE_URL` unset to use the Vite `/api` proxy.

Never add `GEMINI_API_KEY` to Vercel frontend variables. Keep it only in the backend host's secret environment configuration.

## Notes

- Conversation content is saved in this browser's local storage. The application sends the current conversation to the backend for each turn; Gemini calls use `store: false`.
- Resume coaching is guidance, not a hiring guarantee. No ATS score is calculated. PDF analysis is limited to text-based PDFs: file uploads must be at most 5 MB and 20 pages, extraction is capped at 7,000 characters, and scanned PDFs/OCR are unsupported.
- Gemini quota and availability depend on the API project and Google's current service limits.
