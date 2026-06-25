# Monograph Implementation Plan

## Project Title

**KitabHoshmand (کتاب هوشمند)**

Technical name: **Voice-Native AI Book Companion**

## Problem Statement

Students and readers often need to understand long PDF books, notes, and academic material quickly, but traditional reading tools are mostly passive. They usually provide storage, highlighting, or search, but they do not support natural spoken interaction with the content. This creates a gap for users who want to ask questions, review ideas, hear explanations, and navigate book knowledge through voice.

KitabHoshmand addresses this problem by turning uploaded PDF books into searchable, voice-interactive companions. The system stores extracted text in searchable segments and connects a real-time voice assistant to the book content so the user can discuss a specific uploaded book naturally.

## Objectives

- Build a web-based AI book companion that supports PDF upload, processing, storage, browsing, search, and voice conversation.
- Provide authenticated user access and protected voice-chat pages.
- Store book metadata, extracted book text segments, and voice session usage in MongoDB.
- Use Vapi and ElevenLabs voice configuration to support natural real-time conversation.
- Enforce subscription-style usage limits for books, monthly sessions, and session duration.
- Customize the original cloned repository into the KitabHoshmand university monograph project.
- Prepare documentation, diagrams, screenshots, implementation notes, and testing evidence suitable for academic presentation.

## Scope

Included:

- PDF upload and validation.
- PDF text extraction and chunking.
- Optional cover image upload and automatic first-page cover generation.
- Book library and title/author search.
- Protected book-specific voice assistant page.
- Real-time transcript display.
- Vapi tool endpoint for searching stored book segments.
- Clerk authentication and pricing/subscription UI.
- MongoDB persistence for books, segments, and voice sessions.
- Monograph documentation and final presentation preparation.

Not included in the current implementation:

- Full semantic vector search or embeddings, despite Gemini env variables being present.
- In-app history page for past voice sessions.
- Admin dashboard.
- Full bilingual UI translation.
- Automated end-to-end test suite.
- Custom payment provider beyond Clerk PricingTable integration.

## Proposed System Overview

KitabHoshmand is a full-stack Next.js application with client-side PDF processing, server actions for database operations, API routes for uploads and Vapi tool calls, Clerk for authentication and subscription UI, Vercel Blob for file storage, MongoDB for persistent data, and Vapi for real-time voice interaction.

High-level flow:

1. User signs in with Clerk.
2. User uploads a PDF and enters book metadata.
3. Browser extracts text with pdfjs-dist and splits content into searchable segments.
4. PDF and cover image are uploaded to Vercel Blob.
5. Server actions create the book record and save extracted text segments in MongoDB.
6. User opens a book-specific page.
7. User starts a Vapi voice session.
8. Vapi receives book variables and uses the configured assistant.
9. When the assistant needs book context, it calls the search API.
10. The search API retrieves matching MongoDB book segments and returns them to the assistant.
11. Transcript messages appear in the UI.
12. Voice session usage is stored for subscription limits.

## Required Customizations

- Replace visible app brand with **KitabHoshmand (کتاب هوشمند)** where appropriate.
- Update technical/package identity from `bookified` to a KitabHoshmand-compatible name.
- Replace or revise original README tutorial content with project-specific setup, purpose, architecture, and academic notes.
- Replace original JavaScript Mastery/JSM promotional links, clone commands, and public tutorial assets.
- Update metadata title and description.
- Update logo alt text, visible navbar brand, and final project logo.
- Review nav labels, hero copy, upload page copy, subscription copy, search placeholder, transcript empty state, and upload button text.
- Decide whether to keep English-only UI for implementation or add Dari/Persian branding in selected places.
- Rename branding-specific environment variable usage from `bookified_READ_WRITE_TOKEN` to the documented Blob token name during the implementation-fix phase.
- Add `NEXT_PUBLIC_ASSISTANT_ID` to final setup documentation.
- Clarify in documentation that current book search is MongoDB text/regex search, not Gemini embedding search.
- Fix lint and type errors before final submission.

## Documentation Deliverables

- Final `README.md` customized for KitabHoshmand.
- Project setup guide with all required environment variables.
- Architecture explanation.
- Database schema explanation.
- Upload flow explanation.
- Voice assistant flow explanation.
- Authentication and subscription flow explanation.
- API route documentation.
- Server action documentation.
- Testing report with command outputs and manual test evidence.
- Known limitations and future work section.
- Screenshots of all main UI states.
- Final presentation slides.
- Demo script for the viva/presentation.

## Diagrams to Create

- **System architecture diagram**: browser, Next.js app, Clerk, Vercel Blob, MongoDB, Vapi, ElevenLabs.
- **Upload pipeline diagram**: form validation, PDF parsing, Blob upload, book creation, segment storage.
- **Voice assistant sequence diagram**: user starts session, server creates session, Vapi starts, tool call searches book, transcript updates, session ends.
- **Database ERD**: Book, BookSegment, VoiceSession, and their relationships.
- **Authentication and subscription flow diagram**: Clerk sign-in, route protection, plan detection, book/session limit checks, subscription page redirect.

## Testing Checklist

Automated/current checks:

- `npm run build`: currently passes.
- `npm run lint`: currently fails with 1 error and 13 warnings.
- `npx tsc --noEmit`: currently fails with 3 type errors.
- `package.json`: no configured `typecheck` script.

Manual test scenarios:

- User can open homepage and see the library.
- User can sign in through Clerk.
- Signed-out user is redirected from `/books/[slug]` to sign-in.
- User can upload a valid PDF under 50 MB.
- Invalid file type is rejected.
- Oversized PDF is rejected.
- Optional cover image upload works.
- First PDF page is used as cover when no cover is uploaded.
- Duplicate title redirects to existing book.
- Book record is created in MongoDB.
- Book segments are saved in MongoDB.
- Library search filters by title and author.
- Book detail page loads the selected book.
- Voice session starts and stops.
- Transcript updates during conversation.
- Vapi `searchBook` tool returns relevant stored book text.
- Monthly session limit is enforced.
- Book upload limit is enforced.
- Session duration limit stops or blocks over-limit usage.
- Subscription page renders Clerk PricingTable.
- Build works after final branding changes.
- Lint and typecheck pass before final submission.

## Final Presentation Checklist

- Project name and technical name clearly shown.
- Problem statement and objectives explained.
- Live demo prepared with at least one uploaded academic PDF.
- Screenshots included for fallback if live services fail.
- Architecture diagram included.
- Upload flow diagram included.
- Voice assistant sequence diagram included.
- Database ERD included.
- Authentication/subscription flow diagram included.
- Environment variables documented with no secrets exposed.
- Testing evidence included.
- Known limitations explained honestly.
- Future improvements listed, such as semantic embeddings, session history UI, multilingual UI, and stronger automated tests.
- Original implementation explanation written in the student's own words.
- Commit history and branch names are clean and presentation-ready.

## Academic Implementation Notes to Add

- Explain why the app uses chunking: long PDFs must be divided into smaller searchable text segments.
- Explain current search behavior: MongoDB text search is attempted first, then regex fallback.
- Explain how Vapi receives `bookId`, `title`, and `author` as variables.
- Explain why authenticated routes and upload/session checks are necessary.
- Explain how subscription limits protect resources and control usage.
- Include screenshots from the local customized project, not only source repository images.
- Clearly identify which parts were customized, documented, fixed, or extended for the monograph project.

## Recommended Next Branch

`docs/kitabhoshmand-project-state`

## Exact Commit Message

`docs: document KitabHoshmand project state and monograph plan`
