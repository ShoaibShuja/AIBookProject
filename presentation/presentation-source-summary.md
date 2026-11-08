# KitabHoshmand Presentation Source Summary

## Verified project identity

- Project name: KitabHoshmand.
- Category: AI-powered PDF study companion and private digital library.
- Primary user: an authenticated individual who uploads and studies their own PDF documents.
- Purpose: convert text-searchable PDFs into private, searchable study resources with voice conversation, grounded text chat, and saved histories.

Primary evidence: `README.md`, `app/layout.tsx`, `app/(root)/page.tsx`, `components/UploadForm.tsx`.

## Verified architecture

- Next.js 16 App Router and React 19 provide the web interface, server components, server actions, and route handlers.
- Browser code uses `pdfjs-dist` to extract PDF text and create 500-word segments with a 50-word overlap.
- Supabase supplies email/password authentication, PostgreSQL, Row Level Security, RPC functions, and private file storage.
- Gemini is called only from server-side code for grounded text answers.
- Vapi Web SDK handles real-time voice sessions; the application persists final transcripts and session duration.

Primary evidence: `package.json`, `lib/utils.ts`, `lib/actions/*.ts`, `lib/gemini.ts`, `hooks/useVapi.ts`, `lib/supabase/*.ts`.

## Verified implemented features

- Sign-up, sign-in, email confirmation callback, forgot-password, and reset-password flows.
- Private PDF and cover upload with client, server, database, and storage validation.
- Personal library listing and title/author search.
- Per-book voice study with session history and saved transcripts.
- Per-book text chat grounded in retrieved book segments, with saved sessions/messages.

Primary evidence: `components/AuthForm.tsx`, `lib/actions/book.actions.ts`, `lib/actions/conversation.actions.ts`, and `lib/actions/session.actions.ts`.

## Verified database and security facts

- Main tables: `profiles`, `books`, `book_segments`, `voice_sessions`, `voice_session_messages`, `chat_sessions`, `chat_messages`, and `legacy_user_mappings`.
- Foreign keys use cascade deletion for dependent data.
- Row Level Security restricts user data to its authenticated owner.
- Storage buckets `book-files` and `book-covers` are private and enforce user-ID folder ownership.
- Cover images are exposed through short-lived signed URLs.
- The Vapi search route validates a bearer secret with `timingSafeEqual` and validates/truncates inputs.
- No application-defined administrator, teacher, or subscription role exists.

Primary evidence: `supabase/migrations/*.sql`, `lib/auth.ts`, `lib/actions/book.actions.ts`, `app/api/vapi/search-book/route.ts`.

## Verified testing on 15 August 2026

- `npm test`: 4 test files passed, 10 tests passed.
- `npx tsc --noEmit`: passed with exit code 0.
- `npm run build`: production build compiled successfully and generated all application routes.
- One Playwright E2E test exists for anonymous redirection, but it was not executed as part of this verification.

Primary evidence: command output from the current workspace, `tests/`, `vitest.config.mts`, and `playwright.config.ts`.

## Verified limitations

- No OCR: scanned PDFs without extractable text are rejected.
- No administrative roles, subscription/payment system, operational analytics, or export feature.
- Vapi assistant configuration remains external to the repository.
- Automated coverage does not include live Supabase RLS/storage integration or complete authenticated browser workflows.
- No verified production deployment URL or formal field research records were found.
- Historical diagrams and planning documents that reference Clerk, MongoDB, Vercel Blob, billing, or limits do not describe the current implementation and were not used as current architecture evidence.

## Branding and interface evidence

- Current application logo: `public/brand/kitabhoshmand-logo-mark.svg`.
- Current brand colors visible in the SVG: deep navy `#102033`, paper `#F8F4E9`, gold `#D8A94A`, and teal `#1C8C86`.
- Actual sign-in screenshot captured locally from `/sign-in` without credentials: `presentation/screenshots/sign-in.png`.

