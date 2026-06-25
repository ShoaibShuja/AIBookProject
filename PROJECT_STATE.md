# Project State

## Current Repo Summary

This repository is a customized local clone of the public Bookified project, being prepared as the university monograph project **KitabHoshmand (کتاب هوشمند)**. Its technical project name is **Voice-Native AI Book Companion**.

The application lets authenticated users upload PDF books, extract and store searchable text segments, browse a library, search books by title or author, open a protected book conversation page, and start a real-time Vapi voice session that can search stored book text through a server API tool.

This file documents the current codebase before further branding, academic documentation, and presentation customization.

## Tech Stack

- **Next.js 16 App Router** for routing, layouts, API routes, and server actions.
- **React 19** for UI components.
- **TypeScript** for typed application code.
- **Tailwind CSS 4** for styling through `app/globals.css`.
- **shadcn/Radix UI** components for form, input, button, radio group, label, and toast primitives.
- **Clerk** for authentication, user session access, protected pages, user button, sign-in modal, and subscription pricing UI.
- **MongoDB with Mongoose** for books, book text segments, and voice session records.
- **Vercel Blob** for PDF and cover image storage.
- **Vapi Web SDK** for real-time voice conversation.
- **ElevenLabs voice configuration** through Vapi voice settings and stored persona choices.
- **pdfjs-dist** for client-side PDF text extraction and first-page cover rendering.
- **Zod** and **React Hook Form** for upload form validation and state.
- **Lucide React** for icons.
- **Sonner** for toast notifications.

## Main Features

- PDF upload with file validation, Blob storage, PDF text extraction, and automatic cover generation from the first PDF page.
- Optional custom cover image upload.
- Book creation with duplicate-title detection through generated slugs.
- Book library page with recent books and query-string search by title or author.
- Protected book detail page for voice interaction.
- Real-time Vapi voice session controls with connection state, transcript streaming, duration tracking, and stop/start handling.
- Vapi search tool endpoint that retrieves relevant book segments using MongoDB text search with regex fallback.
- Clerk authentication and user session checks.
- Clerk PricingTable subscription page.
- Subscription limit enforcement for maximum books, monthly voice sessions, and maximum session duration.

## Main Folders

- `app/`: Next.js App Router pages, layout, global CSS, and API routes.
- `app/(root)/`: public root pages for library, new-book upload, and subscriptions.
- `app/books/[slug]/`: protected book conversation page.
- `app/api/upload/`: Vercel Blob client upload handler.
- `app/api/vapi/search-book/`: API endpoint used by Vapi tool calls to search stored book text.
- `components/`: reusable UI and feature components, including navbar, hero, upload form, file uploader, book card, search, voice selector, Vapi controls, transcript, and loading overlay.
- `components/ui/`: shadcn/Radix UI primitives.
- `database/`: MongoDB connection and Mongoose models.
- `hooks/`: client hooks for Vapi call lifecycle and subscription plan detection.
- `lib/`: constants, validation, utility functions, subscription helpers, and server actions.
- `public/assets/`: application images and logos.
- `public/readme/`: original tutorial README images and marketing assets.

## App Routes

- `/`: library homepage. Loads books through `getAllBooks(query)`, shows the hero, search input, and book cards.
- `/books/new`: upload page. Shows the upload form for PDF, optional cover image, metadata, and assistant voice.
- `/books/[slug]`: protected voice chat page. Redirects unauthenticated users to `/sign-in`, loads a book by slug, and renders Vapi controls.
- `/subscriptions`: subscription page using Clerk `PricingTable`.
- `/api/upload`: Vercel Blob upload token endpoint. Requires Clerk authentication.
- `/api/vapi/search-book`: Vapi tool endpoint. Accepts several Vapi function/tool-call payload shapes and returns matching book text segments.

## Components

- `Navbar`: fixed top navigation with logo, library, add-new, pricing, Clerk auth controls, and user button.
- `HeroSection`: library hero with app explanation, add-book CTA, illustration, and upload/process/chat steps.
- `Search`: debounced query-string search input for library filtering.
- `BookCard`: book cover and metadata card linking to the book detail route.
- `UploadForm`: full upload workflow, PDF parsing, Blob uploads, book creation, segment saving, billing error handling, and redirects.
- `FileUploader`: reusable file input/dropzone wrapper for PDF and image upload.
- `VoiceSelector`: male/female voice persona radio options.
- `VapiControls`: book voice-chat interface with status, mic control, duration, and transcript display.
- `Transcript`: real-time conversation transcript with empty state and streaming messages.
- `LoadingOverlay`: upload/processing loading overlay.

## Server Actions

- `getAllBooks(search?)`: fetches all books, optionally filtered by title or author.
- `checkBookExists(title)`: checks duplicate books by generated slug.
- `createBook(data)`: validates authenticated user, checks plan book limit, creates a book, and returns billing errors when limits are exceeded.
- `getBookBySlug(slug)`: retrieves one book for the protected detail page.
- `saveBookSegments(bookId, clerkId, segments)`: stores parsed PDF text chunks and updates book segment count.
- `searchBookSegments(bookId, query, limit)`: searches stored chunks using MongoDB text search and regex fallback.
- `startVoiceSession(clerkId, bookId)`: checks monthly session limits, creates a voice session, and returns session duration limits.
- `endVoiceSession(sessionId, durationSeconds)`: marks a session as ended and records duration.

## API Routes

- `POST /api/upload`
  - Uses `@vercel/blob/client` `handleUpload`.
  - Requires Clerk auth before generating a client upload token.
  - Allows PDF and image upload content types.
  - Applies the 50 MB `MAX_FILE_SIZE` limit.
  - Current code reads `process.env.bookified_READ_WRITE_TOKEN`.

- `GET /api/vapi/search-book`
  - Health check returning `{ status: "ok" }`.

- `POST /api/vapi/search-book`
  - Handles Vapi `functionCall`, `toolCallList`, and `toolCalls` formats.
  - Supports the `searchBook` function/tool name.
  - Requires `bookId` and `query`.
  - Returns combined text from up to three matching segments or a fallback message.

## Database Entities

### Book

Stores uploaded book metadata and ownership.

- `clerkId`: Clerk user ID.
- `title`: book title.
- `slug`: unique generated route slug.
- `author`: author name.
- `persona`: selected assistant voice/persona.
- `fileURL`, `fileBlobKey`: PDF Blob storage location.
- `coverURL`, `coverBlobKey`: cover image Blob storage location.
- `fileSize`: uploaded PDF size.
- `totalSegments`: number of stored text chunks.
- `createdAt`, `updatedAt`: timestamps.

### BookSegment

Stores searchable text chunks extracted from uploaded PDFs.

- `clerkId`: owner user ID.
- `bookId`: reference to `Book`.
- `content`: extracted chunk text.
- `segmentIndex`: chunk order.
- `pageNumber`: optional page number.
- `wordCount`: chunk word count.
- Indexes: unique `{ bookId, segmentIndex }`, `{ bookId, pageNumber }`, and text index on `{ bookId, content }`.

### VoiceSession

Tracks voice-session usage for subscription limits.

- `clerkId`: user ID.
- `bookId`: reference to `Book`.
- `startedAt`: session start time.
- `endedAt`: optional session end time.
- `durationSeconds`: recorded duration.
- `billingPeriodStart`: first day of the current billing month.
- Indexes: `clerkId`, `billingPeriodStart`, and compound `{ clerkId, billingPeriodStart }`.

## Main User Flow

1. User visits `/` and browses recent uploaded books.
2. User signs in through Clerk when needed.
3. User opens `/books/new`.
4. User selects a PDF, optionally uploads a cover, enters title/author, and chooses a voice.
5. Client validates form input with Zod and React Hook Form.
6. Client parses the PDF with pdfjs-dist, extracts text, splits it into segments, and renders the first page as a cover if no cover was uploaded.
7. Client uploads PDF and cover to Vercel Blob through `/api/upload`.
8. Server action checks duplicate slug, validates user, checks plan book limits, and creates the `Book`.
9. Server action saves all `BookSegment` records and updates `totalSegments`.
10. User returns to the library and opens a book.
11. Protected book page verifies auth and loads the book.
12. User starts a voice session.
13. Server action checks monthly session limits and creates a `VoiceSession`.
14. Vapi starts with selected ElevenLabs voice settings and book variables.
15. Vapi can call `/api/vapi/search-book` to retrieve relevant book segments.
16. Transcript updates in real time.
17. On stop, error, timeout, or unmount, the session is ended and duration is recorded.

## Upload Flow

- `UploadForm` validates the PDF and optional cover image.
- `parsePDFFile` loads the PDF in the browser, renders page one to a canvas, extracts page text, and splits text into overlapping segments.
- `upload` from `@vercel/blob/client` sends files to `/api/upload`.
- `/api/upload` checks Clerk authentication and returns upload permissions.
- `createBook` creates the book only after duplicate and subscription checks.
- `saveBookSegments` inserts parsed chunks and updates the book segment count.

## Search Flow

- Library search uses `Search` to update `?query=...` after a 300 ms debounce.
- The root page passes the query to `getAllBooks`.
- `getAllBooks` searches book titles and authors with an escaped case-insensitive regex.
- Voice search uses Vapi tool calls to `/api/vapi/search-book`.
- `searchBookSegments` first attempts MongoDB text search.
- If no text-search results are found or text search fails, it searches segment content with a keyword regex fallback.

## Voice Assistant Flow

- `VapiControls` renders the current book, status indicators, mic button, duration, and transcript.
- `useVapi` initializes `@vapi-ai/web` using `NEXT_PUBLIC_VAPI_API_KEY`.
- `ASSISTANT_ID` comes from `NEXT_PUBLIC_ASSISTANT_ID`.
- `startVoiceSession` enforces plan limits before Vapi starts.
- Vapi starts with book variables: `title`, `author`, and `bookId`.
- Voice uses ElevenLabs provider settings from `VOICE_SETTINGS` and the selected persona from `voiceOptions`.
- Transcript events update user and assistant messages.
- Session duration is enforced in the client using plan limits from `useSubscription`.
- `endVoiceSession` records duration when the call ends.

## Authentication Flow

- `ClerkProvider` wraps the app in `app/layout.tsx`.
- `proxy.ts` applies Clerk middleware to app and API routes.
- Navbar uses `SignedIn`, `SignedOut`, `SignInButton`, `UserButton`, and `useUser`.
- Book detail page calls `auth()` server-side and redirects unauthenticated users to `/sign-in`.
- Upload API and book/session server actions verify Clerk user identity before protected operations.

## Subscription and Billing Logic

- `/subscriptions` renders Clerk `PricingTable`.
- `PLANS`: `free`, `standard`, `pro`.
- Free limits: 1 book, 5 monthly sessions, 5 minutes per session, no session history.
- Standard limits: 10 books, 100 monthly sessions, 15 minutes per session, session history enabled.
- Pro limits: 100 books, unlimited monthly sessions, 60 minutes per session, session history enabled.
- Server-side plan detection uses Clerk `auth().has({ plan })`.
- Client-side plan detection uses Clerk `useAuth().has(...)` and user public metadata fallback.
- Book creation and voice session creation redirect users toward `/subscriptions` when limits are exceeded.

## Environment Variables

Current `.env.local` contains these keys, values redacted:

- `NODE_ENV`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `BLOB_READ_WRITE_TOKEN`
- `MONGODB_URI`
- `NEXT_PUBLIC_ASSISTANT_ID`
- `NEXT_PUBLIC_VAPI_API_KEY`
- `VAPI_SERVER_SECRET`
- `GOOGLE_GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`

Known mismatch: the upload API currently reads `bookified_READ_WRITE_TOKEN`, while local env and README use `BLOB_READ_WRITE_TOKEN`.

## Known Risks and Missing Setup Items

- `npm run lint` currently fails because `database/mongoose.ts` uses `let cached` where ESLint expects `const cached`.
- `npm run lint` also reports unused imports/variables and React Hook dependency warnings.
- `npx tsc --noEmit` fails because Clerk `has({ product })` is not accepted by the installed type definitions.
- `npx tsc --noEmit` fails because the pdfjs render call is missing the `canvas` property required by current types.
- `next.config.ts` has `typescript.ignoreBuildErrors: true`, so production build skips type validation.
- `README.md` documents `BLOB_READ_WRITE_TOKEN` but the code reads `bookified_READ_WRITE_TOKEN`.
- `README.md` omits `NEXT_PUBLIC_ASSISTANT_ID`, which is required by `ASSISTANT_ID`.
- `GOOGLE_GEMINI_API_KEY` is documented, but the current search implementation uses MongoDB text search and regex fallback, not Gemini embeddings.
- `VAPI_SERVER_SECRET` is present but not currently used by the inspected API route.
- ElevenLabs API key is documented, but voice calls are configured through Vapi client voice settings.
- `next.config.ts` allows remote images from a specific Vercel Blob host, which may need updating for a different Blob project.
- Some original tutorial/marketing assets and links remain in `README.md` and `public/readme`.
- Authentication and subscriptions depend on correct Clerk dashboard configuration.
- Vapi assistant tool configuration must match `/api/vapi/search-book` and the `searchBook` tool schema.

## Branding and Customization Targets

- `package.json` and `package-lock.json`: package name is still `bookified`.
- `README.md`: contains Bookified, JavaScript Mastery, JSM links, tutorial copy, original clone commands, badges, and promotional assets.
- `app/layout.tsx`: metadata title is `Bookified`; description references voice book conversations.
- `components/Navbar.tsx`: visible brand is `Bookified`; logo alt text is `Bookfied`; nav labels are `Library`, `Add New`, and `Pricing`.
- `components/HeroSection.tsx`: visible copy includes `Your Library`, generic book conversation text, and upload/process/chat steps.
- `app/(root)/page.tsx`: section heading is `Recent Books`.
- `app/(root)/books/new/page.tsx`: copy includes `Add a New Book` and upload subtitle.
- `app/(root)/subscriptions/page.tsx`: copy includes plan upgrade messaging.
- `components/UploadForm.tsx`: placeholders include sample book/author text and submit button `Begin Synthesis`.
- `components/Search.tsx`: placeholder is `Search books by title or author`.
- `components/Transcript.tsx`: empty state copy is generic voice-chat guidance.
- `lib/constants.ts`: sample books, voice labels/descriptions, Vapi dashboard notes, and brand colors should be reviewed.
- `public/assets/*`: logo and app imagery should be replaced or documented as customized assets.
- `public/readme/*`: original README/tutorial images should be replaced for final monograph presentation.
- `app/api/upload/route.ts`: env variable name contains old branding.

## Check Results

- `npm run build`: passes.
- `npm run lint`: fails with 1 error and 13 warnings.
- `npx tsc --noEmit`: fails with 3 type errors.
- No configured `typecheck` script exists in `package.json`.

## Monograph-Specific Tasks Still Remaining

- Replace Bookified branding with KitabHoshmand (کتاب هوشمند) in app UI, metadata, README, package metadata, and assets.
- Write original project background and implementation explanation in the monograph.
- Add screenshots for homepage/library, upload form, subscription page, book conversation page, transcript, and error/limit states.
- Create diagrams for architecture, upload pipeline, voice assistant sequence, database ERD, and auth/subscription flow.
- Add implementation notes explaining PDF parsing, chunking, MongoDB search, Vapi tool calls, and subscription enforcement.
- Fix lint and type errors before final academic submission.
- Confirm all environment variables and third-party dashboards are configured.
- Add setup instructions customized for the university project instead of tutorial links.
- Add testing evidence: build logs, lint/typecheck status, manual test checklist, and screenshots.
- Review UI copy for academic clarity and bilingual branding.
- Prepare final presentation slides and demo script.

## Recommended Next Branch

`docs/kitabhoshmand-project-state`

## Exact Commit Message

`docs: document KitabHoshmand project state and monograph plan`
