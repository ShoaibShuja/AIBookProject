# Important Code to Explain During the Defense

## 1. Authentication guard

- File: `lib/auth.ts`
- Code: `getCurrentUser()` and `requireUser()`
- Purpose: verifies the Supabase user on the server and redirects anonymous requests to `/sign-in`.
- Importance: establishes the trusted authentication boundary for pages and server actions.
- Simple explanation: “Every protected operation asks Supabase for the real current user. If no verified user exists, the operation stops and redirects to sign-in.”
- Likely question: Why not trust the browser’s user state?
- Answer: Browser state can be manipulated. Server verification uses Supabase’s authenticated session before protected data is accessed.

## 2. Supabase session proxy

- File: `lib/supabase/proxy.ts` and root `proxy.ts`
- Code: `updateSession()`
- Purpose: refreshes Supabase cookies for matching Next.js requests.
- Importance: keeps server-rendered routes synchronized with the user’s authentication session.
- Simple explanation: “The proxy carries refreshed authentication cookies between the incoming request and outgoing response.”
- Likely question: Does the proxy itself authorize every route?
- Answer: No. It refreshes session state; protected pages and actions still call `requireUser()`.

## 3. Upload validation schema

- File: `lib/zod.ts`
- Code: `UploadSchema`
- Purpose: validates title, author, selected voice, PDF type/size, and optional cover type/size.
- Importance: rejects incorrect files and metadata before expensive parsing and upload work.
- Simple explanation: “The schema is one reusable definition of acceptable upload data and produces user-friendly validation messages.”
- Likely question: Is client validation enough?
- Answer: No. The server action and database repeat critical checks because browser validation can be bypassed.

## 4. PDF extraction and segmentation

- File: `lib/utils.ts`
- Code: `parsePDFFile()` and `splitIntoSegments()`
- Purpose: extracts text with PDF.js, renders the first page as a cover, and creates 500-word segments with 50-word overlap.
- Importance: converts a static PDF into searchable content suitable for retrieval and AI context.
- Simple explanation: “The PDF is read page by page, converted to text, and divided into overlapping sections so a question can retrieve focused passages without losing boundary context.”
- Likely question: Why is OCR not supported?
- Answer: PDF.js extracts embedded text but does not perform OCR; image-only documents therefore produce no searchable content.

## 5. Atomic book ingestion

- File: `lib/actions/book.actions.ts`
- Code: `ingestBook()` and `createBookSchema`
- Database: `public.ingest_book` in `supabase/migrations/202608100003_remove_book_limit.sql`
- Purpose: revalidates the request, verifies user-owned storage paths, and inserts the book plus all segments.
- Importance: protects ownership and prevents partially persisted book records.
- Simple explanation: “The server checks the whole upload again, then asks one database function to save the metadata and ordered segments together.”
- Likely question: Why use a database function instead of separate inserts?
- Answer: It centralizes database validation and keeps the related inserts within one PostgreSQL operation.

## 6. Grounded text chat

- File: `lib/actions/conversation.actions.ts`
- Code: `sendChatMessage()` and `getGrounding()`
- Supporting code: `generateBookReply()` in `lib/gemini.ts`
- Purpose: validates the message, verifies book/session access, retrieves relevant segments, calls Gemini, and persists both messages.
- Importance: this is the core source-grounded AI workflow.
- Simple explanation: “The user’s question first searches the owned book. Only the matching passages and recent history are sent to Gemini, and the answer is saved in the same session.”
- Likely question: Can Gemini use outside knowledge?
- Answer: The prompt instructs it not to, but model behavior cannot be guaranteed absolutely; grounding and explicit fallback wording reduce unsupported answers.

## 7. Row Level Security and private storage

- File: `supabase/migrations/202608090001_initial_schema.sql`
- Code: RLS policies for profiles, books, segments, sessions, and `storage.objects`
- Purpose: restricts records and files to their owner at the database layer.
- Importance: database-level authorization remains active even if an application query is too broad.
- Simple explanation: “The database checks the authenticated user ID for every protected row and storage path, so ownership is enforced below the UI.”
- Likely question: How can a segment policy determine ownership?
- Answer: It checks whether the segment’s parent book belongs to `auth.uid()`.

## 8. Vapi book-search endpoint

- File: `app/api/vapi/search-book/route.ts`
- Code: `isAuthorized()`, `search()`, and `POST()`
- Purpose: accepts Vapi tool calls, validates a shared bearer secret and arguments, and returns concise matching book passages.
- Importance: connects live voice interaction to the stored book content.
- Simple explanation: “Vapi sends a protected tool request containing a book ID and query; the route validates it and returns short matching excerpts.”
- Likely question: What security improvement is needed?
- Answer: Add short-lived, book-scoped authorization so the endpoint verifies both the caller and the specific book, not only a shared webhook secret.

