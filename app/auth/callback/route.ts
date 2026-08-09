import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next')?.startsWith('/') ? url.searchParams.get('next')! : '/';
  const response = NextResponse.redirect(new URL(next, url.origin));

  if (!code) return NextResponse.redirect(new URL('/sign-in?error=missing_code', url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } },
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? NextResponse.redirect(new URL('/sign-in?error=invalid_link', url.origin)) : response;
}
