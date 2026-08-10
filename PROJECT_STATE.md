# Project State: Supabase Migration Complete

## Current Phase

Handoff/post-validation. Completed prompts: **1** (full Supabase migration implementation) and **2** (live project configuration verification). No active feature work is in progress.

## Repository

- Branch: `main`
- Latest migration commit: `399d1c5` — `first commit` (contains the Supabase migration and supporting docs/assets).
- Earlier relevant commits: `4b44713` — `Merge pull request #2 from ShoaibShuja/feature/kitabhoshmand-rebrand`; `654b87d` — `feat: rebrand app as KitabHoshmand`.
- The worktree was clean before this state-file refresh. After this edit, only `PROJECT_STATE.md` is expected to be modified unless the user makes additional changes.

## Completed Product Work

- Replaced Clerk, MongoDB/Mongoose, Vercel Blob, and Clerk billing UI with Supabase Auth, Postgres, private Storage, RLS, and a free-only plan.
- Added email/password sign-up, sign-in, confirmation callback, password reset, sign-out, Supabase SSR cookie refresh, and authenticated app routes.
- Private per-user library is enforced by RLS; book ingestion/session RPCs derive the authenticated user in Postgres and atomically enforce: 1 book, 5 monthly sessions, 5 minutes/session.
- Voice session transcripts and GPT-5.6 Luna-backed text chats are persisted as ordered, RLS-protected per-book conversation messages. Text chat is unlimited and does not consume voice limits.
- PDF/cover uploads go directly to private Supabase buckets under `<user-id>/<book-id>/…`; server pages issue short-lived cover URLs.
- Vapi tool endpoint requires `Authorization: Bearer <VAPI_SEARCH_WEBHOOK_SECRET>`, validates Vapi payloads, and queries a service-role-only full-text search RPC.
- Implemented idempotent legacy MongoDB/Vercel Blob migration plus explicit legacy Clerk-ID-to-new-Supabase-user mapping scripts. No migration data is exposed before mapping.

## Key Files

- `supabase/migrations/202608090001_initial_schema.sql`: schema, RLS, buckets, indexes, triggers, and RPCs.
- `lib/supabase/{client,server,admin,proxy}.ts`, `lib/auth.ts`, `lib/limits.ts`: Supabase integration and auth/limits.
- `lib/actions/{book,session}.actions.ts`: RLS-aware app actions.
- `components/{AuthForm,AuthProvider,UploadForm,Navbar}.tsx`: auth UI and storage upload flow.
- `app/auth/callback/route.ts`, `app/{sign-in,sign-up,forgot-password,reset-password}/page.tsx`: auth routes.
- `app/api/vapi/search-book/route.ts`: protected Vapi search.
- `scripts/migrate-from-mongodb.mjs`, `scripts/map-legacy-users.mjs`, `docs/SUPABASE_CUTOVER.md`, `.env.example`: cutover tooling/docs.

## Database and Roles

- Tables: `profiles`, `books`, `book_segments`, `voice_sessions`, `legacy_user_mappings`.
- `book_segments.search_vector` is generated and GIN-indexed; `search_book_segments` ranks FTS results then performs safe substring fallback.
- `ingest_book`, `start_voice_session`, and `end_voice_session` are authenticated RPCs. `search_book_segments` is executable only by `service_role`.
- `book-files` and `book-covers` are private. RLS permits access only to objects inside the calling user’s top-level folder.
- Legacy records use `owner_id/user_id = NULL` and `legacy_clerk_id` until the mapping script assigns them.

## Runtime Routes and Architecture

- Protected: `/`, `/books/new`, `/books/[slug]`; unauthenticated requests redirect to `/sign-in`.
- Public auth: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/callback`.
- `/api/vapi/search-book`: `GET` health check; `POST` requires the Vapi shared secret. Removed: `/subscriptions` and `/api/upload`.
- Next.js remains the UI/SSR and trusted Vapi boundary. Supabase owns auth, persistence, storage, and authorization. Avoid restoring client-supplied owner IDs or public storage URLs.

## Environment and Validation

- Required runtime keys: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ASSISTANT_ID`, `NEXT_PUBLIC_VAPI_API_KEY`, `VAPI_SEARCH_WEBHOOK_SECRET`.
- Temporary migration keys: `MONGODB_URI`, optional `MONGODB_DATABASE`, `LEGACY_USER_MAPPING_FILE`.
- Live checks on 2026-08-10 passed: configured key presence, production build, Supabase service-role query, private bucket existence, Vapi `GET` 200, authorized Vapi `POST` 200, unauthorized Vapi `POST` 401.
- `npx tsc --noEmit` and `npm run build` pass. `npm run lint` has one pre-existing warning: unused `media` in `docs/proposal/build-proposal.mjs:113`.

## Known Debt / Do Not Change Accidentally

- There is no committed automated Supabase RLS/E2E suite yet; live migration data has not been run in this workspace.
- Keep `mongodb` as a dev dependency only for the one-time migration scripts; do not re-add Mongoose or MongoDB runtime code.
- Preserve private buckets, service-role secrecy, authenticated RPC ownership checks, Vapi constant-time secret verification, and legacy records’ unmapped privacy.
- Do not delete MongoDB/Vercel Blob backups or legacy migration metadata until migration and account mapping are formally signed off.
