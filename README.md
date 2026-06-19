# Brand Pitch Assistant

Personal AI assistant for creator brand outreach. It stores your creator profile, brand contacts, AI-generated pitch drafts, and Gmail OAuth tokens locally.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Gmail OAuth

Create a Google Cloud OAuth client and set:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APP_URL=http://localhost:3000
```

Authorized redirect URI:

```text
http://localhost:3000/api/auth/google/callback
```

The app requests Gmail scopes for sending and reading message metadata. It does not need your email password.

## OpenAI

Set `OPENAI_API_KEY` for AI-generated pitches. Without it, the app uses a deterministic pitch template.

## Safety Defaults

- The app drafts first.
- You approve each send.
- Follow-ups are tracked as due items; the app does not silently blast emails.
- Data is stored locally in `data/store.json`.
