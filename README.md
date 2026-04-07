# Benkyo React Dashboard

A React + Vite dashboard for manually testing and running the Benkyo backend workflow.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env
```

3. Run the app:

```bash
npm run dev
```

> Make sure your backend API is running and reachable at `VITE_API_BASE_URL`.

## Environment Variable

- `VITE_API_BASE_URL` - backend base URL (example: `http://localhost:5000`)

## UI Sections

- **Health Check**: Runs `GET /health` and displays API status/message.
- **Create Material**: Sends `POST /materials` with title, content, tags, domain, and difficulty; stores the returned `materialId`.
- **Generate Questions**: Sends `POST /questions/generate` with a `materialId`; renders questions and tracks question IDs.
- **Create Test**: Sends `POST /tests/create` with `userId`, `type`, and `numberOfQuestions`; stores `testId` and test questions.
- **Submit Test**: Builds answer inputs from test questions and sends `POST /tests/submit` with `{ testId, userId, answers }`.
- **Analyze Performance**: Sends `POST /analysis` with `userId` and displays analysis output.
- **Rewrite Material**: Sends `POST /rewrite` with `materialId`, `conceptIds`, and `insights`.

## Notes

- All requests use `fetch` through a reusable API client helper.
- UI includes loading, success, and error states for each request.
- Responses are shown in JSON panels for debugging and verification.
