# FinSim Studio

Phase 1 prototype for facilitator-led, scenario-based financial lessons.

## Requirements

- Node.js 22+
- npm
- Supabase project
- OpenAI API key

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database

Apply the SQL files in `supabase/migrations/` to Supabase in filename order. For local/demo data, apply `supabase/seed.sql` after the migrations.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Use `npm run test:e2e` after the database has seed data and the app can reach the configured Supabase project.
