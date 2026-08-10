# Project State: KitabHoshmand Supabase, Voice, and Chat

## Current Phase

Post-implementation validation and handoff. Text chat and saved per-book study guides use Gemini through Google AI Studio.

## Repository

- Branch: `main`.
- Recent relevant commits: `153aeb8` `Merge pull request #4 from ShoaibShuja/feat/add-chat`; `a630368` `added another tab besides voice named chat`; `0022e6c` `Merge pull request #3 from ShoaibShuja/feat/supabase`; `04e1e41` `recreated the database and changed DB from mongodb to supabase`; `399d1c5` `first commit`; `654b87d` `feat: rebrand app as KitabHoshmand`.
- Chat provider files: `lib/gemini.ts` and `tests/gemini.test.ts`.

## Completed Product Work

- Supabase Auth/Postgres/private Storage replaced Clerk, MongoDB/Mongoose, Vercel Blob, and subscription UI. Book uploads are unlimited; voice limits remain five monthly sessions and five minutes each.
- Auth state now subscribes to Supabase events, sign-in forces a cookie-visible navigation, uploads re-check the current browser session, and Navbar has an accessible profile menu.
- Books have isolated sequential text segments; server/RPC validation protects malformed input and `total_segments` consistency.
- Voice sessions persist final Vapi transcripts. Saved voice and text conversations are listed per book; `/books/[slug]` stays voice and `/books/[slug]/chat` is text chat.
- Text chat uses the server-only Gemini GenerateContent API with `gemini-2.5-flash`, book-segment grounding, recent history, an abort timeout, and RLS-protected persisted sessions/messages.
- `/books/[slug]/summary` detects editable chapter ranges and generates a saved, grounded Gemini study guide through chapter summaries followed by final synthesis.
- Vapi search supports current and legacy tool-call formats, returns matching call IDs and concise one-line passages. Direct validation found an uploaded book with 172 segments and a valid search response.

## Key Files and Schema

- `supabase/migrations/202608090001_initial_schema.sql`: original Supabase schema/RPCs.
- `supabase/migrations/202608100001_conversation_history_and_segments.sql`: retry-safe migration adding `voice_session_messages`, `chat_sessions`, `chat_messages`, RLS/indexes, and stricter `ingest_book` validation. The `ROWS FROM (...) WITH ORDINALITY` syntax fixes its prior PostgreSQL error.
- `supabase/migrations/202608100002_book_summaries.sql`: owner-scoped chapter outline and saved study-guide tables with RLS.
- `lib/actions/conversation.actions.ts`, `lib/gemini.ts`, `components/ChatStudy.tsx`, `components/VoiceStudy.tsx`, `components/ConversationSidebar.tsx`, `components/BookModeTabs.tsx`: conversations and text chat.
- `hooks/useVapi.ts`, `app/api/vapi/search-book/route.ts`: transcript persistence and Vapi tool boundary.
- `components/AuthProvider.tsx`, `components/AuthForm.tsx`, `components/UploadForm.tsx`, `components/Navbar.tsx`: live auth state, reliable uploads, profile dropdown.
- `tests/gemini.test.ts`, `tests/utils.test.ts`, `vitest.config.mts`, `playwright.config.ts`: current test baseline.

## Routes, Security, and Configuration

- Protected: `/`, `/books/new`, `/books/[slug]`, `/books/[slug]/chat`. Auth routes remain public. `/api/vapi/search-book` allows health `GET`; its `POST` requires the Vapi bearer secret.
- RLS remains mandatory. Do not expose the service role or make storage buckets public. Vapi search is service-role-only after a constant-time bearer check; it must receive a public deployed URL, never localhost.
- Required chat environment: `GEMINI_API_KEY` and optional `GEMINI_CHAT_MODEL=gemini-2.5-flash`. Keep existing Supabase/Vapi variables unchanged.

## Validation and Known Issues

- Passing: `npm test` (5 tests), `npx tsc --noEmit`, `npm run build`. Lint has only the old unused `media` warning in `docs/proposal/build-proposal.mjs:113`.
- Gemini has not yet been live-tested. Google AI Studio free-tier availability and limits are subject to the API project's quota.
- No live Supabase RLS integration suite or authenticated Playwright suite is complete. The Playwright protected-route spec requires a running configured app/browser setup. Legacy import tooling exists but no live legacy import was run.

## Next Recommended Prompt

"Add GEMINI_API_KEY from Google AI Studio, then run and verify an authenticated end-to-end chat conversation against an uploaded book, including persisted session history and a grounded response. Add Supabase RLS integration tests and complete Playwright coverage without changing production schema or auth behavior."

## Do Not Accidentally Change

- Do not restore Clerk, Mongoose, Vercel Blob, paid plans, or `/subscriptions`.
- Do not accept client-supplied owner IDs, expose `SUPABASE_SERVICE_ROLE_KEY`/`GEMINI_API_KEY`, bypass RLS, make buckets public, remove voice limits, or grant segment search to browser roles.
- Do not silently change the configured Gemini model or hide actionable Gemini API errors.
- Do not delete legacy backups/mapping metadata or auto-assign unmapped legacy books.
