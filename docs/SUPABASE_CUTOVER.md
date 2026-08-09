# Supabase Cutover

1. Create a Supabase project and add its URL, publishable key, and service-role key to deployment secrets. Never expose the service-role key to the browser.
2. Enable email/password authentication, email confirmations, password recovery, and redirect URLs for `https://your-domain/auth/callback` and the local development equivalent.
3. Apply every file in `supabase/migrations/` through the Supabase CLI or SQL editor. They create the schema, RLS policies, private buckets, full-text index, RPCs, and conversation tables.
4. In Vapi, configure the `searchBook` function tool with a public HTTPS server URL of `https://your-deployment-domain/api/vapi/search-book`, not a localhost URL. Enable tool-call server messages, make the tool synchronous, and set its bearer credential to `VAPI_SEARCH_WEBHOOK_SECRET`. The function must send `bookId` and `query` parameters. Vapi cannot call a local Next.js server without a public tunnel.
5. Back up MongoDB and Vercel Blob, freeze legacy uploads, run `npm run migrate:legacy`, and verify the logged source/import counts and sampled asset checksums.
6. Create fresh Supabase accounts, prepare a verified legacy Clerk ID to Supabase user ID JSON mapping, then run `npm run map:legacy-users`. Re-check each mapped library and its private files.
7. Deploy the new app with Supabase environment values. Keep the MongoDB/Vercel Blob backup; do not delete it as part of this migration.
