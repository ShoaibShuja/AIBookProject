# KitabHoshmand University Defense Questions and Model Answers

## 1. Why did you select this project?

Students often work with long PDF documents using passive reading and basic search. I selected the project to explore how document processing, secure storage, voice interaction, and source-grounded AI could be combined into one study workflow.

## 2. What problem does KitabHoshmand solve?

It reduces the fragmentation of reading, searching, discussing, and reviewing PDF content. A user can upload a document once and then search it or discuss it through voice or text.

## 3. Who are the target users?

The implemented system targets authenticated individuals who upload and study their own PDFs. There are no separate institutional, teacher, or administrator roles in the current version.

## 4. Why did you use Next.js?

Next.js supports the React interface, server-rendered pages, route handlers, and server actions in one codebase. This reduces integration complexity while preserving a trusted server boundary for database and AI operations.

## 5. Why did you use Supabase?

Supabase provides PostgreSQL, authentication, private storage, server-side functions, and Row Level Security. Those services match the project’s need for per-user ownership of books, files, and sessions.

## 6. How does authentication work?

The browser uses Supabase email/password authentication. Sign-up can require email confirmation through `/auth/callback`. Password recovery sends a secure reset link, and server code verifies the current user with `supabase.auth.getUser()`.

## 7. What roles exist in the system?

There is one application role: authenticated user. Each user can access only their own data. A Supabase service-role key is used only in trusted server code for controlled book-segment search; it is not an interactive application role.

## 8. How are users prevented from reading another user’s books?

Row Level Security compares `auth.uid()` with each record’s owner. Segment, session, and message policies follow ownership through their parent book or session. Private storage policies also require the first folder name to equal the authenticated user ID.

## 9. How is an uploaded PDF processed?

The browser validates the file, uses PDF.js to extract text, renders the first page as a cover when needed, and splits text into segments. It uploads the PDF and cover to private storage, then a server action validates the request and calls the `ingest_book` database function.

## 10. Why are text segments limited to 500 words?

The implementation uses segments small enough for targeted search and AI context. A 50-word overlap preserves context across adjacent boundaries. The server and database both reject segments above 500 words.

## 11. How does text chat remain related to the book?

The server retrieves matching segments using PostgreSQL full-text search, with an `ILIKE` fallback. Those excerpts are included in Gemini’s system instruction, which directs the model to answer only from supplied book content.

## 12. How does the voice feature work?

The browser starts a Vapi session with the selected book and voice configuration. Vapi can call the protected `searchBook` webhook for relevant excerpts. Final user and assistant transcripts are saved as ordered session messages.

## 13. What are the main database relationships?

A profile owns many books. A book owns many segments, voice sessions, and chat sessions. Voice and chat sessions each own ordered messages.

## 14. What happens when invalid data is submitted?

Zod returns user-friendly errors for form and server inputs. The database applies additional type, length, range, uniqueness, and ownership constraints. The upload workflow removes already-uploaded files if ingestion fails.

## 15. How was the project tested?

Vitest tests cover text segmentation and Gemini response/request handling. On 15 August 2026, TypeScript checking passed, and the Next.js production build completed successfully.

## 16. What testing is still missing?

The current suite does not verify live Supabase RLS and storage policies, a complete authenticated upload flow, Vapi integration, or full browser-level chat and voice workflows.

## 17. What was the most important technical challenge?

A central challenge is keeping AI responses connected to the uploaded document while protecting private content. The implementation addresses this with segment retrieval, server-only Gemini calls, ownership policies, and private storage.

## 18. What is the main security limitation?

The Vapi webhook uses one shared bearer secret and service-role search. It validates the secret and input, but it does not independently associate the requested book ID with a particular end user. A future version should use short-lived, book-scoped authorization.

## 19. Does the system support scanned PDFs?

No. It depends on text extraction from PDF.js. Image-only PDFs with no searchable text are rejected because OCR is not implemented.

## 20. Is subscription or payment management implemented?

No. Earlier planning documents mention usage limits, but later migrations explicitly remove book and voice limits. No payment or subscription module exists in the current application.

## 21. Is the system deployed publicly?

No production URL or deployment record is verified in the repository. The project includes local development and production build scripts, and the build succeeds, but production deployment should not be claimed.

## 22. What would you improve first?

I would add complete integration and end-to-end tests, then strengthen Vapi book authorization. OCR would be a valuable user-facing improvement after the security and testing work.

## 23. How is this different from a general chatbot?

The chat prompt uses excerpts retrieved from a user-selected document, and sessions are organized around a specific owned book. A general chatbot is not normally tied to a private, persisted document library in this way.

## 24. What is the final achievement of the project?

The project demonstrates a working full-stack workflow that transforms a searchable PDF into a private library item with search, voice study, grounded text chat, and saved histories.

