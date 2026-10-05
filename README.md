# Chief of Staff

A personal AI Chief of Staff focused on low-friction capture, structured memory, retrieval, and proactive awareness.

## MVP

The first vertical slice is:

1. Capture a thought, task, commitment, fact, or note in one box.
2. AI extracts a small structured record from the natural-language input.
3. The record is stored in Supabase.
4. The home screen shows recent captured items and connection health.
5. The system is designed so calendar/email/etc. connectors can be added without changing the core memory model.

## Local setup

Requirements:
- Node.js 20+
- A Supabase project
- An OpenAI API key

Copy `.env.example` to `.env.local` and fill in the values.

Then:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Architecture

Next.js provides the web UI and server routes. Supabase provides Postgres persistence. The AI extraction route is server-side so API credentials never reach the browser.

The important design choice is keeping the "memory item" generic. A user should not have to decide whether something is a task, event, person, or note before capturing it. The AI and later workflows can classify it after capture.