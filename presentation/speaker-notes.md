# KitabHoshmand Monograph Presentation: Speaker Notes

## Slide 1 - KitabHoshmand

Introduce the project as an AI-powered PDF study companion developed for the Software Engineering monograph. Explain the name briefly: KitabHoshmand means “Smart Book.” State that the presentation focuses on what is verifiably implemented. Do not spend time explaining technologies yet. Replace the student, department, university, and supervisor placeholders before the defense.

[Sources]
- `README.md`
- `app/layout.tsx`
- `public/brand/kitabhoshmand-logo-mark.svg`

## Slide 2 - A static PDF becomes an interactive study resource

Explain that many academic materials arrive as long PDFs. Reading page by page and using basic keyword search can make revision slow and fragmented. KitabHoshmand provides one private place to upload a document, search it, discuss it, and return to saved study outputs. Present this as the project context, not as survey findings or measured statistics.

[Sources]
- `docs/proposal/build-proposal.mjs`
- `README.md`

## Slide 3 - The project addresses four practical study gaps

Walk through the four supported problem points: passive reading, fragmented tools, weak continuity, and limited natural interaction. Emphasize that these are problem statements documented in the proposal and reflected in the implemented workflows. Do not claim that interviews or questionnaires proved these issues, because no formal field-study evidence is present.

[Sources]
- `docs/proposal/build-proposal.mjs`
- `MONOGRAPH_IMPLEMENTATION_PLAN.md`

## Slide 4 - Objectives align directly with implemented behavior

State the general objective: build a secure interactive study system around user-selected PDFs. Then briefly explain the specific objectives: ingest and search documents, support voice and text chat, retain sessions, and isolate each user’s data. Tie each objective to a working module rather than presenting aspirational goals.

[Sources]
- `components/UploadForm.tsx`
- `lib/actions/conversation.actions.ts`
- `supabase/migrations/202608090001_initial_schema.sql`

## Slide 5 - One workflow connects upload, search, conversation, and review

Explain the user journey from authentication to PDF upload, text extraction, private storage, and study modes. Clarify that voice and text chat use the selected book as their context. The key message is that the system is a connected learning workflow rather than a standalone chatbot.

[Sources]
- `app/(root)/page.tsx`
- `app/books/[slug]/page.tsx`
- `app/books/[slug]/chat/page.tsx`

## Slide 6 - The architecture separates interface, trusted server logic, and managed services

Describe the three execution areas. The browser renders React interfaces, parses PDFs, and runs the Vapi client. Next.js server actions authenticate requests, validate inputs, call Gemini, and coordinate persistence. Supabase provides identity, PostgreSQL, Row Level Security, and private storage. Vapi and Gemini are external services, while API keys and the Supabase service key remain server-side.

[Sources]
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/admin.ts`
- `lib/gemini.ts`
- `hooks/useVapi.ts`

## Slide 7 - Each technology has a specific responsibility

Explain technologies by responsibility rather than reading dependency names. Next.js and React implement the application. TypeScript strengthens code correctness. Supabase provides data, authentication, and files. Tailwind implements the visual system. Supporting tools handle PDF extraction, form state, validation, voice, AI generation, and automated verification. Mention that only actively used libraries are shown.

[Sources]
- `package.json`
- `app/globals.css`
- `lib/utils.ts`
- `lib/zod.ts`

## Slide 8 - Six implemented capabilities form the working system

Summarize the implemented modules: account access, PDF ingestion, private library search, voice study, and grounded text chat. Note that histories are persisted per book. Avoid describing administration, payments, subscriptions, or reporting as implemented because current code contains none of those modules.

[Sources]
- `app/`
- `components/`
- `lib/actions/`

## Slide 9 - Upload is the core end-to-end workflow

Explain the upload path precisely. Zod first validates metadata and files in the browser. PDF.js extracts text and creates overlapping segments. Files are uploaded into a user/book folder. A server action revalidates IDs, sizes, paths, and segment order. Finally, the `ingest_book` RPC inserts the book and segments within the database operation. If an error occurs, uploaded files are removed.

[Sources]
- `lib/zod.ts`
- `components/UploadForm.tsx`
- `lib/utils.ts`
- `lib/actions/book.actions.ts`
- `supabase/migrations/202608100003_remove_book_limit.sql`

## Slide 10 - The data model follows ownership and study activity

Start with `profiles`, which corresponds to Supabase users. A profile owns books; each book owns text segments, voice sessions, and chat sessions. Voice and chat sessions own ordered messages. Explain cascade deletion and ownership-based policies at a high level. The slide intentionally simplifies the complete schema for readability.

[Sources]
- `supabase/migrations/202608090001_initial_schema.sql`
- `supabase/migrations/202608100001_conversation_history_and_segments.sql`

## Slide 11 - Protection is applied in layers

Describe the security layers from outer to inner. Supabase handles authentication. `requireUser` protects server operations and pages. Zod validates application input. Database constraints protect persisted data. Row Level Security enforces ownership even when application queries are incorrect. Storage policies keep files private, and covers use temporary signed URLs. Mention the Vapi bearer secret, but do not describe it as per-user authorization.

[Sources]
- `lib/auth.ts`
- `lib/zod.ts`
- `lib/actions/book.actions.ts`
- `supabase/migrations/202608090001_initial_schema.sql`
- `app/api/vapi/search-book/route.ts`

## Slide 12 - The implemented interface emphasizes private study

Identify this as a screenshot of the running `/sign-in` route. Point out the project’s real logo, consistent navy/paper palette, email/password fields, password recovery link, and account creation path. State that protected library and study routes require an authenticated account, so the screenshot contains no demonstration credentials or private records.

[Sources]
- `presentation/screenshots/sign-in.png`
- `components/AuthForm.tsx`
- `components/Navbar.tsx`

## Slide 13 - Current verification confirms the code builds and core logic passes

Report only the verified results: TypeScript checking and the production build compiled successfully on 15 August 2026. Explain that the tests cover segmentation and Gemini handling. Then acknowledge what they do not cover: live Supabase policies, authenticated upload, and complete voice/browser workflows.

[Sources]
- Current command output: `npm test`, `npx tsc --noEmit`, `npm run build`
- `tests/`
- `vitest.config.mts`
- `playwright.config.ts`

## Slide 14 - Limitations define a realistic next iteration

Separate current limitations from future work. Current limitations include no OCR, external Vapi setup, no administrative roles or analytics, and limited integration coverage. Appropriate improvements are OCR, broader end-to-end tests, scoped Vapi authorization, exportable study materials, and accessibility/usability evaluation. Make clear that these are recommendations, not completed features.

[Sources]
- `lib/utils.ts`
- `app/api/vapi/search-book/route.ts`
- `tests/`
- `app/`

## Slide 15 - The project demonstrates a complete private study workflow

Conclude that KitabHoshmand integrates document processing, managed data services, AI interaction, and layered access control into a coherent study application. Its strongest contribution is converting a user-selected PDF into searchable, conversational, and reusable study material while preserving per-user ownership. Thank the audience and invite questions.

[Sources]
- `README.md`
- `lib/actions/`
- `supabase/migrations/`

