# Supabase setup

## Environment

Copy `.env.example` to `.env.local` and configure the project URL and publishable key.
Never put a secret key in a `VITE_*` variable or commit it.

## Database

The canonical migration is `supabase/migrations/20260831000000_saas_foundation.sql`.
Apply it in the Supabase SQL Editor, or authenticate the CLI and run:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

The checked-in TypeScript contract covers the tables used by the current application.
Regenerate it after every applied schema change.

## Authentication

In Authentication > URL Configuration, set the production Site URL and allow the local
and production callback URLs. Keep email/password authentication and email confirmation
enabled for production.
