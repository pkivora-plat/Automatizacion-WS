# Supabase setup

## Environment

Copy `.env.example` to `.env.local` and configure the project URL and publishable key.
Never put a secret key in a `VITE_*` variable or commit it.

## Database

Apply the migrations in chronological order:

1. `supabase/migrations/20260831000000_saas_foundation.sql`
2. `supabase/migrations/20260901000000_phases_1_to_5.sql`
3. `supabase/migrations/20260901010000_platform_admin_and_doradito.sql`

The second migration provisions an organization for dashboard-created users, adds secure
invitations, member management, atomic order creation, order history and collision-safe closer
assignment. The third migration adds the global platform-administrator boundary, company
lifecycle controls, database-backed pricing tiers and reusable workflow templates. Apply all
three in the Supabase SQL Editor, or authenticate the CLI and run:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

The checked-in TypeScript contract covers the tables used by the current application.
Regenerate it after every applied schema change.

After applying a new migration, refresh the browser. Existing authenticated users without an
organization are provisioned automatically on their next application load.

## Platform administrator

The third migration grants platform-administrator access to the oldest existing Auth account as
the initial secure bootstrap. That account sees **Administración global** in the navigation and
can create, activate, suspend and assign plans to companies. Platform administration uses narrow
security-definer RPCs and does not bypass tenant RLS for contacts, leads, orders or other company
records.

From **Administración global**, use **Crear ejemplo DORADITO** to provision DORADITO as an
independent company. Its initial catalog, pricing tiers and inactive deterministic workflow are
stored in Supabase and remain isolated from every other company. Meta, AI and N8N are not enabled
by this action.

## Authentication

In Authentication > URL Configuration, set the production Site URL and allow the local
and production callback URLs. Keep email/password authentication and email confirmation
enabled for production.

Invitation emails require an external email provider. Until that phase is configured, an
administrator creates an invitation in **Configuración → Equipo y roles** and securely shares the
generated one-time link with the invited person.
