'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';

const copy: Record<AuthMode, { title: string; submit: string }> = {
  'sign-in': { title: 'Welcome back', submit: 'Sign in' },
  'sign-up': { title: 'Create your account', submit: 'Create account' },
  'forgot-password': { title: 'Reset your password', submit: 'Send reset link' },
  'reset-password': { title: 'Choose a new password', submit: 'Update password' },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showEmail = mode !== 'reset-password';
  const showPassword = mode !== 'forgot-password';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const supabase = createClient();
    const siteUrl = window.location.origin;

    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else router.replace(searchParams.get('next') || '/');
    }
    if (mode === 'sign-up') {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/` } });
      setMessage(error ? error.message : 'Check your email to confirm your account.');
    }
    if (mode === 'forgot-password') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=/reset-password` });
      setMessage(error ? error.message : 'Check your email for a password reset link.');
    }
    if (mode === 'reset-password') {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage(error.message);
      else router.replace('/');
    }
    setIsSubmitting(false);
  }

  return (
    <main className="auth-wrapper">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-soft space-y-5">
        <h1 className="text-3xl font-serif font-bold text-[#212a3b]">{copy[mode].title}</h1>
        {showEmail && <Input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" />}
        {showPassword && <Input aria-label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} required autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} />}
        {message && <p role="status" className="text-sm text-[#3d485e]">{message}</p>}
        <Button type="submit" className="form-btn" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : copy[mode].submit}</Button>
        <div className="text-sm text-[#3d485e] space-y-2">
          {mode === 'sign-in' && <><p>New here? <Link href="/sign-up" className="underline">Create an account</Link></p><Link href="/forgot-password" className="underline">Forgot password?</Link></>}
          {mode === 'sign-up' && <p>Already have an account? <Link href="/sign-in" className="underline">Sign in</Link></p>}
          {(mode === 'forgot-password' || mode === 'reset-password') && <Link href="/sign-in" className="underline">Back to sign in</Link>}
        </div>
      </form>
    </main>
  );
}
