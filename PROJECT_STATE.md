# Project State: KitabHoshmand

## Current Phase

Post-implementation validation and handoff. Completed prompts include Supabase migration, Supabase/Vapi validation, persisted voice/chat sessions, auth/upload fixes, Navbar profile dropdown, Vapi tool-call repair, OpenAI-to-Gemini chat migration, Gemini error handling, unlimited book uploads, unlimited voice sessions and duration, premium frontend redesign, and dashboard refinements.

## Repository

- Branch: `main`.
- Recent commits: `b78f5d5` `changed typography`; `f70e27c` `fixed hero illustration`; `3166eba` `improved the dashboard ui`; `882e360` `improved the overall ui of the project`; `194b3ca` `removed all limits to users`; `91fef4f` `removed the book upload limits`; `5a230e4` `added summaries to navbar`; `6fa10dc` `added a new feature: summarize books or docs`.
- Working tree: only this `PROJECT_STATE.md` handoff refresh is uncommitted. Dashboard refinements are committed in `3166eba`/`f70e27c`; global typography is committed in `b78f5d5`.

## Completed Features

- Supabase Auth/Postgres/private Storage/RLS replace Clerk, Mongo/Mongoose, and Vercel Blob. Books, voice sessions, and voice duration are unlimited.
- Books store isolated sequential text segments. Voice transcripts and chat sessions/messages are persisted per book with ownership RLS.
- Text chat uses server-only Gemini `gemini-2.5-flash`, grounded private segment retrieval, recent history, timeout handling, and actionable Gemini errors.
- Premium frontend redesign is complete without database or backend changes: editorial authentication screens; dashboard and book shelf; guided upload flow; responsive navbar/profile menu; and unified voice/chat book workspaces. The dashboard hero has responsive, touch-friendly actions and a visible framed illustration with a transparent library-count card.
- Global typography uses only Outfit for UI/body text and Space Grotesk for display, headings, and emphasized actions, loaded through `next/font` in the root layout.

## Important Files and Migrations

- Frontend: `app/layout.tsx`, `app/globals.css`; `components/{AuthForm,HeroSection,BookCard,Search,UploadForm,FileUploader,VoiceSelector,LoadingOverlay,Navbar,BookWorkspaceHeader,VoiceStudy,VapiControls,Transcript,ChatStudy,ConversationSidebar}.tsx`; `app/(root)/page.tsx`; `app/(root)/books/new/page.tsx`; `app/books/[slug]/{page,chat/page}.tsx`.
- Backend/domain: `lib/gemini.ts`, `lib/actions/{conversation,session,book}.actions.ts`.
- `202608100001_conversation_history_and_segments.sql`: chat/voice history and validated ingestion.
- `202610030001_remove_study_guides.sql`: removes the retired study-guide tables.
- `202608100003_remove_book_limit.sql`: removes ingestion quota.
- `202608100004_remove_voice_limits.sql`: removes session-count and duration caps.

## Routes, Security, and Environment

- Protected: `/`, `/books/new`, `/books/[slug]`, `/books/[slug]/chat`. Public: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/callback`.
- Vapi `POST /api/vapi/search-book` requires its bearer secret; `GET` is health only.
- Required: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ASSISTANT_ID`, `NEXT_PUBLIC_VAPI_API_KEY`, `VAPI_SEARCH_WEBHOOK_SECRET`, `GEMINI_API_KEY`. Optional: `GEMINI_CHAT_MODEL=gemini-2.5-flash`.

## Validation and Debt

- After every premium frontend implementation: `npm test`, `npx tsc --noEmit`, and `npm run build` passed. Lint has one pre-existing warning: unused `media` in `docs/proposal/build-proposal.mjs:113`.
- No live Gemini AI Studio test, live Supabase RLS integration suite, authenticated Playwright suite, or browser visual-regression pass exists. Playwright Chromium is not installed locally. Chapter detection remains heuristic. Legacy Mongo/Vercel Blob migration tooling remains unexecuted against live legacy data.

## Next Recommended Prompt

"Run an authenticated visual and end-to-end QA pass across the premium frontend at mobile and desktop sizes, then add Playwright coverage for auth, upload, dashboard/library search, chat, voice-session history, navbar navigation, and responsive book workspaces. Preserve the Outfit/Space Grotesk pairing and existing dashboard hero composition."

## Do Not Accidentally Change

- Do not restore Clerk, Mongo/Mongoose runtime code, Vercel Blob, paid plans, subscriptions, or user quotas.
- Do not change database schema, migrations, server actions, Gemini/Vapi/Supabase behavior, RLS, private buckets, or authentication flow as part of frontend work.
- Do not expose `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, make Storage public, accept client-supplied owner IDs, grant `search_book_segments` to browser roles, silently change the Gemini model, or delete legacy migration/backups/mapping metadata.
- Do not replace Outfit or Space Grotesk, add a third runtime typeface, or reintroduce the former Arial, Georgia, or IBM Plex font declarations.
