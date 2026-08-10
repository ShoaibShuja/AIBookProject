# Project State: KitabHoshmand

## Current Phase

Post-implementation validation and handoff. Completed prompts: **1** Supabase migration; **2** Supabase/Vapi validation; **3** persisted voice/chat sessions and migration; **4** auth/upload fixes; **5** Navbar profile dropdown; **6** Vapi tool-call repair; **7** OpenAI-to-Gemini chat migration; **8** Gemini error handling; **9** per-book Gemini summaries; **10** summary library/Navbar entry; **11** unlimited book uploads; **12** unlimited voice sessions and duration.

## Repository

- Branch: `main`.
- Recent commits: `194b3ca` `removed all limits to users`; `91fef4f` `removed the book upload limits`; `5a230e4` `added summaries to navbar`; `216e3ce` `Merge pull request #5 from ShoaibShuja/feat/summaries`; `6fa10dc` `added a new feature: summarize books or docs`; `153aeb8` `Merge pull request #4 from ShoaibShuja/feat/add-chat`; `0022e6c` `Merge pull request #3 from ShoaibShuja/feat/supabase`.
- Working tree was clean at handoff, except this state-file refresh if not committed afterward.

## Completed Features

- Supabase Auth/Postgres/private Storage/RLS replace Clerk, Mongo/Mongoose, and Vercel Blob. Books, voice sessions, and voice duration are currently unlimited.
- Books store isolated sequential text segments. Voice transcripts, chat sessions/messages, and saved summaries are all persisted per book with ownership RLS.
- Text chat uses server-only Gemini `gemini-2.5-flash`, grounded private segment retrieval, recent history, timeout handling, and actionable Gemini errors.
- `/books/[slug]/summary` supports heading-based chapter detection with editable segment ranges, hierarchical Gemini chapter summaries, and a saved study guide. `/summaries` lists every owned book as summarized or not; users explicitly choose generation.
- Navbar includes Library, Summary, Upload, and profile-menu equivalents. Vapi search remains bearer-secret protected and service-role-only.

## Important Files and Migrations

- `lib/gemini.ts`, `lib/summary.ts`, `lib/actions/{conversation,summary,session,book}.actions.ts`.
- `components/{SummaryStudy,ChatStudy,VoiceStudy,BookModeTabs,Navbar}.tsx`; `app/books/[slug]/summary/page.tsx`; `app/summaries/page.tsx`.
- `202608100001_conversation_history_and_segments.sql`: chat/voice history and validated ingestion.
- `202608100002_book_summaries.sql`: `book_summary_chapters` and `book_summaries`, triggers, indexes, owner RLS.
- `202608100003_remove_book_limit.sql`: removes active one-book ingestion check.
- `202608100004_remove_voice_limits.sql`: removes active session-count and duration caps.

## Routes, Security, and Environment

- Protected routes: `/`, `/books/new`, `/books/[slug]`, `/books/[slug]/chat`, `/books/[slug]/summary`, `/summaries`. Auth routes are public. Vapi `POST /api/vapi/search-book` requires its bearer secret; `GET` is health only.
- Never expose `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`; Gemini and service-role retrieval remain server-side. Keep RLS/private buckets and server-derived ownership checks.
- Required chat env: `GEMINI_API_KEY`; optional `GEMINI_CHAT_MODEL=gemini-2.5-flash`. Existing Supabase/Vapi variables remain required.

## Validation and Debt

- Passing: `npm test` (10 tests), `npx tsc --noEmit`, `npm run build`. Lint has one pre-existing warning: unused `media` in `docs/proposal/build-proposal.mjs:113`.
- Apply migrations `202608100002` through `202608100004` to the live Supabase project if not already applied. Gemini has not been live-tested with a funded/configured AI Studio key. No completed live Supabase RLS suite or authenticated Playwright suite exists.

## Next Recommended Prompt

"Apply and verify the latest Supabase migrations, then run an authenticated end-to-end validation of unlimited uploads, unlimited voice sessions, chat, and saved Gemini summaries against multiple books. Add Supabase RLS integration tests and authenticated Playwright coverage."

## Do Not Accidentally Change

- Do not restore Clerk, Mongo/Mongoose runtime code, Vercel Blob, paid plans, subscriptions, user quotas, or automatic summary generation.
- Do not bypass RLS, make Storage public, accept client-supplied owner IDs, expose secrets, grant `search_book_segments` to browser roles, silently change the Gemini model, or delete legacy migration/backups/mapping metadata.
