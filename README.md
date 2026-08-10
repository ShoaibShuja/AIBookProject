# KitabHoshmand (کتاب هوشمند)

**Voice-Native AI Book Companion**

KitabHoshmand means **Smart Book**. It is an AI-powered book companion customized for a university monograph/demo project. The app lets users upload PDF books, extract searchable text, browse a smart library, and discuss book content through a real-time voice assistant.

## Overview

KitabHoshmand transforms a static PDF into an interactive study companion:

- Upload a PDF book or academic document.
- Extract and store text segments for search.
- Browse and search the uploaded library.
- Open a protected book page.
- Start a real-time voice conversation or a persisted text chat about the book.
- Let the voice assistant search stored book segments during the conversation.
- Save voice sessions and transcripts for each uploaded book.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/Radix UI
- Supabase Auth, Postgres, Row Level Security, and private Storage
- Vapi Web SDK
- ElevenLabs voice configuration through Vapi
- pdfjs-dist
- React Hook Form and Zod

## Main Features

- **PDF upload and ingestion**: validates PDF files, uploads them to private Supabase Storage, extracts text, and stores searchable segments.
- **Smart book library**: lists uploaded books and supports title/author search.
- **Conversation history**: saves final voice transcripts and text-chat messages in per-book sessions.
- **Text study flow**: uses Gemini through a server-only boundary and grounds answers in private book segments.
- **Book-aware search tool**: Vapi can call the app API to search stored book segments.
- **Authentication**: protected pages and authenticated uploads through Supabase email/password Auth.
- **Unlimited study access**: book uploads, voice sessions, and voice duration are currently unlimited.

## Routes

- `/`: smart book library and search.
- `/books/new`: PDF upload and assistant voice selection.
- `/books/[slug]`: protected voice study page for one book.
- `/books/[slug]/chat`: protected text-chat study page for one book.
- `/books/[slug]/summary`: protected saved Gemini study guide for one book.
- `/summaries`: protected summary library listing every book and its study-guide status.
- `/api/vapi/search-book`: Vapi tool endpoint for searching book segments.

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vapi
NEXT_PUBLIC_ASSISTANT_ID=
NEXT_PUBLIC_VAPI_API_KEY=
VAPI_SEARCH_WEBHOOK_SECRET=

# Text chat (server-only Gemini API)
GEMINI_API_KEY=
GEMINI_CHAT_MODEL=gemini-2.5-flash
ELEVENLABS_API_KEY=
```

## Local Development

```bash
npm install
npm run dev
```

Apply all SQL files in `supabase/migrations/` to a new Supabase project before starting the app. Configure Supabase Auth with email confirmation, password recovery redirects, and your local/production callback URL. Copy `.env.example` to `.env.local` and supply the Supabase, Vapi, and Gemini values. Apply the summary migration before using the Summary tab.

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
npx tsc --noEmit
npm test
```

## Legacy MongoDB Migration

Keep a MongoDB and Vercel Blob backup before cutover. Run `npm run migrate:legacy` with the temporary MongoDB credentials in `.env.local`; it imports records without assigning them to an account. After users create fresh Supabase accounts, provide a JSON array of `{ "legacyClerkId", "newSupabaseUserId" }` mappings and run `npm run map:legacy-users` with `LEGACY_USER_MAPPING_FILE` set. Imported books remain private and inaccessible until mapped.

## Monograph Notes

For the university monograph, add:

- System architecture diagram.
- Upload pipeline diagram.
- Voice assistant sequence diagram.
- Database ERD.
- Authentication and subscription flow diagram.
- Screenshots for library, upload, subscriptions, book conversation, transcript, and limit/error states.
- Implementation explanation for PDF parsing, text chunking, MongoDB search, Vapi tool calls, and subscription enforcement.
- Testing evidence and known limitations.

## Attribution

This project is based on the public repository:

[adrianhajdin/jsm_bookified](https://github.com/adrianhajdin/jsm_bookified)

Original project reference: **Bookified** by JavaScript Mastery.

This version has been customized as **KitabHoshmand (کتاب هوشمند)** for university monograph and demo purposes. Changes include project branding, academic documentation, smart-book positioning, brand assets, README rewrite, metadata updates, and UI copy updates while preserving the original core application features.
