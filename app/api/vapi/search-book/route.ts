import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

type SearchRow = { content: string };

function isAuthorized(request: Request) {
  const secret = process.env.VAPI_SEARCH_WEBHOOK_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || !authorization?.startsWith('Bearer ')) return false;
  const received = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function parseArgs(args: unknown): Record<string, unknown> {
  if (!args) return {};
  if (typeof args === 'string') {
    try { return JSON.parse(args) as Record<string, unknown>; } catch { return {}; }
  }
  return typeof args === 'object' ? args as Record<string, unknown> : {};
}

async function search(bookId: unknown, query: unknown) {
  const normalizedBookId = typeof bookId === 'string' ? bookId : '';
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedBookId) || !normalizedQuery) {
    return { result: 'Missing or invalid bookId or query.' };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('search_book_segments', {
    p_book_id: normalizedBookId,
    p_query: normalizedQuery.slice(0, 500),
    p_limit: 3,
  });
  if (error || !data?.length) return { result: 'No information found about this topic in the book.' };
  return { result: (data as SearchRow[]).map(({ content }) => content).join('\n\n') };
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const functionCall = body?.message?.functionCall;
    const toolCalls = body?.message?.toolCallList ?? body?.message?.toolCalls;
    if (functionCall) {
      if (functionCall.name !== 'searchBook') return NextResponse.json({ result: `Unknown function: ${functionCall.name}` }, { status: 400 });
      const args = parseArgs(functionCall.parameters);
      return NextResponse.json(await search(args.bookId, args.query));
    }
    if (!Array.isArray(toolCalls)) return NextResponse.json({ results: [{ result: 'No tool calls found.' }] }, { status: 400 });

    const results = await Promise.all(toolCalls.map(async (toolCall: { id?: string; function?: { name?: string; arguments?: unknown } }) => {
      if (toolCall.function?.name !== 'searchBook') return { toolCallId: toolCall.id, result: `Unknown function: ${toolCall.function?.name ?? 'unknown'}` };
      const args = parseArgs(toolCall.function.arguments);
      return { toolCallId: toolCall.id, ...await search(args.bookId, args.query) };
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [{ result: 'Error processing request.' }] }, { status: 400 });
  }
}
