# Project State: KitabHoshmand

## Current Phase

Post-implementation validation and handoff. Completed prompts: **1** Supabase migration; **2** Supabase/Vapi validation; **3** persisted voice/chat sessions and migration; **4** auth/upload fixes; **5** Navbar profile dropdown; **6** Vapi tool-call repair; **7** OpenAI-to-Gemini chat migration; **8** Gemini error handling; **9** per-book Gemini summaries; **10** summary library/Navbar entry; **11** unlimited book uploads; **12** unlimited voice sessions and duration; **13** premium frontend redesign (auth, dashboard, library, summaries, upload, navbar, and book workspace).

## Repository

- Branch: `main`.
- Recent commits: `882e360` `improved the overall ui of the project`; `194b3ca` `removed all limits to users`; `91fef4f` `removed the book upload limits`; `5a230e4` `added summaries to navbar`; `216e3ce` `Merge pull request #5 from ShoaibShuja/feat/summaries`; `6fa10dc` `added a new feature: summarize books or docs`; `153aeb8` `Merge pull request #4 from ShoaibShuja/feat/add-chat`; `0022e6c` `Merge pull request #3 from ShoaibShuja/feat/supabase`.
- Working tree: only this `PROJECT_STATE.md` handoff refresh is uncommitted. The premium frontend redesign, including `components/BookWorkspaceHeader.tsx`, is committed in `882e360`.

## Completed Features

- Supabase Auth/Postgres/private Storage/RLS replace Clerk, Mongo/Mongoose, and Vercel Blob. Books, voice sessions, and voice duration are unlimited.
- Books store isolated sequential text segments. Voice transcripts, chat sessions/messages, and saved summaries are persisted per book with ownership RLS.
- Text chat uses server-only Gemini `gemini-2.5-flash`, grounded private segment retrieval, recent history, timeout handling, and actionable Gemini errors.
- `/books/[slug]/summary` supports heading-based chapter detection with editable segment ranges, hierarchical Gemini chapter summaries, and a saved study guide. `/summaries` lists every owned book as summarized or not; users explicitly choose generation.
- Premium frontend redesign is complete without database or backend changes: editorial authentication screens; dashboard and book shelf; summary shelf/reading desk; guided upload flow; responsive navbar/profile menu; unified Voice/Chat/Summary book workspace.

## Important Files and Migrations

- Frontend: `app/globals.css`; `components/{AuthForm,HeroSection,BookCard,Search,UploadForm,FileUploader,VoiceSelector,LoadingOverlay,Navbar,SummaryStudy,BookModeTabs,BookWorkspaceHeader,VoiceStudy,VapiControls,Transcript,ChatStudy,ConversationSidebar}.tsx`; `app/(root)/page.tsx`; `app/(root)/books/new/page.tsx`; `app/summaries/page.tsx`; `app/books/[slug]/{page,chat/page,summary/page}.tsx`.
- Backend/domain: `lib/gemini.ts`, `lib/summary.ts`, `lib/actions/{conversation,summary,session,book}.actions.ts`.
- `202608100001_conversation_history_and_segments.sql`: chat/voice history and validated ingestion.
- `202608100002_book_summaries.sql`: `book_summary_chapters` and `book_summaries`, indexes, owner RLS.
- `202608100003_remove_book_limit.sql`: removes ingestion quota.
- `202608100004_remove_voice_limits.sql`: removes session-count and duration caps.

## Routes, Security, and Environment

- Protected: `/`, `/books/new`, `/books/[slug]`, `/books/[slug]/chat`, `/books/[slug]/summary`, `/summaries`. Public: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/callback`.
- Vapi `POST /api/vapi/search-book` requires its bearer secret; `GET` is health only.
- Required: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ASSISTANT_ID`, `NEXT_PUBLIC_VAPI_API_KEY`, `VAPI_SEARCH_WEBHOOK_SECRET`, `GEMINI_API_KEY`. Optional: `GEMINI_CHAT_MODEL=gemini-2.5-flash`.

## Validation and Debt

- After every premium frontend implementation: `npm test` (10 tests), `npx tsc --noEmit`, and `npm run build` passed. Lint has one pre-existing warning: unused `media` in `docs/proposal/build-proposal.mjs:113`.
- No live Gemini AI Studio test, live Supabase RLS integration suite, authenticated Playwright suite, or browser visual-regression pass exists. Playwright Chromium is not installed locally. Chapter detection remains heuristic. Legacy Mongo/Vercel Blob migration tooling remains unexecuted against live legacy data.

## Next Recommended Prompt

"Run an authenticated visual and end-to-end QA pass across the premium frontend at mobile and desktop sizes, then add Playwright coverage for auth, upload, dashboard/library search, summary generation, chat, voice-session history, navbar navigation, and responsive book workspaces. Commit the completed frontend redesign after verification."

## Do Not Accidentally Change

- Do not restore Clerk, Mongo/Mongoose runtime code, Vercel Blob, paid plans, subscriptions, user quotas, or automatic summary generation.
- Do not change database schema, migrations, server actions, Gemini/Vapi/Supabase behavior, RLS, private buckets, or authentication flow as part of frontend work.
- Do not expose `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, make Storage public, accept client-supplied owner IDs, grant `search_book_segments` to browser roles, silently change the Gemini model, or delete legacy migration/backups/mapping metadata.
