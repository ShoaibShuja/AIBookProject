# KitabHoshmand (کتاب هوشمند)

**Voice-Native AI Book Companion**

KitabHoshmand means **Smart Book**. It is an AI-powered book companion customized for a university monograph/demo project. The app lets users upload PDF books, extract searchable text, browse a smart library, and discuss book content through a real-time voice assistant.

## Overview

KitabHoshmand transforms a static PDF into an interactive study companion:

- Upload a PDF book or academic document.
- Extract and store text segments for search.
- Browse and search the uploaded library.
- Open a protected book page.
- Start a real-time voice conversation about the book.
- Let the voice assistant search stored book segments during the conversation.
- Track usage through subscription-style limits.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/Radix UI
- Clerk authentication and PricingTable
- MongoDB and Mongoose
- Vercel Blob
- Vapi Web SDK
- ElevenLabs voice configuration through Vapi
- pdfjs-dist
- React Hook Form and Zod

## Main Features

- **PDF upload and ingestion**: validates PDF files, uploads them to Vercel Blob, extracts text, and stores searchable segments.
- **Smart book library**: lists uploaded books and supports title/author search.
- **Voice-native study flow**: starts a Vapi session for a selected book and displays live transcripts.
- **Book-aware search tool**: Vapi can call the app API to search stored book segments.
- **Authentication**: protected book conversation pages and authenticated upload flow through Clerk.
- **Subscription limits**: plan-based limits for books, monthly sessions, and session duration.

## Routes

- `/`: smart book library and search.
- `/books/new`: PDF upload and assistant voice selection.
- `/books/[slug]`: protected voice study page for one book.
- `/subscriptions`: Clerk PricingTable page.
- `/api/upload`: Vercel Blob upload token endpoint.
- `/api/vapi/search-book`: Vapi tool endpoint for searching book segments.

## Environment Variables

Create `.env.local` in the project root:

```env
NODE_ENV='development'
NEXT_PUBLIC_BASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# MongoDB
MONGODB_URI=

# Vapi
NEXT_PUBLIC_ASSISTANT_ID=
NEXT_PUBLIC_VAPI_API_KEY=
VAPI_SERVER_SECRET=

# Optional/future AI integrations
GOOGLE_GEMINI_API_KEY=
ELEVENLABS_API_KEY=
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
npx tsc --noEmit
```

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
