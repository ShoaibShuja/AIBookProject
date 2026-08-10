'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';

const copy: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  'sign-in': {
    eyebrow: 'Your reading room',
    title: 'Welcome back.',
    description: 'Continue your conversations, notes, and study guides.',
    submit: 'Sign in',
  },
  'sign-up': {
    eyebrow: 'Begin your library',
    title: 'Make every book more useful.',
    description: 'Create your private space for thoughtful study.',
    submit: 'Create account',
  },
  'forgot-password': {
    eyebrow: 'Account recovery',
    title: 'Reset your password.',
    description: 'We will send a secure reset link to your email address.',
    submit: 'Send reset link',
  },
  'reset-password': {
    eyebrow: 'Secure your account',
    title: 'Choose a new password.',
    description: 'Use at least eight characters to keep your library protected.',
    submit: 'Update password',
  },
};

const authErrorMessages: Record<string, string> = {
  missing_code: 'This confirmation link is incomplete. Request a new link and try again.',
  invalid_link: 'This link has expired or is no longer valid. Request a new one and try again.',
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordValue, setShowPasswordValue] = useState(false);
  const showEmail = mode !== 'reset-password';
  const showPassword = mode !== 'forgot-password';
  const callbackError = searchParams.get('error');
  const visibleMessage = message ?? (callbackError ? (authErrorMessages[callbackError] ?? 'We could not complete that request. Please try again.') : null);
  const visibleMessageType = messageType ?? (callbackError ? 'error' : null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);
    const supabase = createClient();
    const siteUrl = window.location.origin;

    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        window.location.assign(searchParams.get('next') || '/');
        return;
      }
    }
    if (mode === 'sign-up') {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/` } });
      setMessage(error ? error.message : 'Check your email to confirm your account.');
      setMessageType(error ? 'error' : 'success');
    }
    if (mode === 'forgot-password') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=/reset-password` });
      setMessage(error ? error.message : 'Check your email for a password reset link.');
      setMessageType(error ? 'error' : 'success');
    }
    if (mode === 'reset-password') {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        window.location.assign('/');
        return;
      }
    }
    setIsSubmitting(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <section className="auth-reading-room" aria-label="About KitabHoshmand">
          <div className="auth-reading-room__glow" aria-hidden="true" />
          <div className="auth-reading-room__content">
            <div className="auth-brand-lockup">
              <Image src="/brand/kitabhoshmand-logo-mark.svg" alt="" width={36} height={36} priority />
              <span>KitabHoshmand</span>
            </div>
            <div className="auth-reading-room__statement">
              <p className="auth-eyebrow">A considered way to study</p>
              <h2>Build a deeper relationship with every page.</h2>
              <p>Bring your books, conversations, and ideas into one private reading practice.</p>
            </div>
            <div className="auth-reading-room__feature-list">
              <p><BookOpen aria-hidden="true" />Your personal library, always within reach</p>
              <p><Sparkles aria-hidden="true" />Thoughtful AI study for the books you choose</p>
            </div>
          </div>
          <Image src="/assets/hero-illustration.png" alt="A collection of books ready to study" width={430} height={430} priority className="auth-reading-room__illustration" />
          <p className="auth-reading-room__edition">KITABHOSHMAND · PERSONAL LIBRARY</p>
        </section>

        <section className="auth-form-column" aria-labelledby="auth-title">
          <div className="auth-form-intro">
            <p className="auth-eyebrow">{copy[mode].eyebrow}</p>
            <h1 id="auth-title">{copy[mode].title}</h1>
            <p>{copy[mode].description}</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            {showEmail ? <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </div> : null}

            {showPassword ? <div className="auth-field">
              <div className="auth-field__label-row">
                <label htmlFor="password">Password</label>
                {mode === 'sign-in' ? <Link href="/forgot-password">Forgot password?</Link> : null}
              </div>
              <div className="auth-password-input">
                <input id="password" type={showPasswordValue ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} required autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPasswordValue((current) => !current)} aria-label={showPasswordValue ? 'Hide password' : 'Show password'}>
                  {showPasswordValue ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
              {mode !== 'sign-in' ? <p className="auth-field__hint">Use at least 8 characters.</p> : null}
            </div> : null}

            {visibleMessage ? <p role="status" className={`auth-message auth-message--${visibleMessageType ?? 'success'}`}>
              {visibleMessageType === 'success' ? <Check aria-hidden="true" /> : null}
              {visibleMessage}
            </p> : null}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Please wait…' : copy[mode].submit}</span>
              {!isSubmitting ? <ArrowRight aria-hidden="true" /> : null}
            </button>
          </form>

          <div className="auth-form-footer">
            {mode === 'sign-in' ? <p>New to KitabHoshmand? <Link href="/sign-up">Create an account</Link></p> : null}
            {mode === 'sign-up' ? <p>Already have an account? <Link href="/sign-in">Sign in</Link></p> : null}
            {(mode === 'forgot-password' || mode === 'reset-password') ? <Link href="/sign-in">Back to sign in</Link> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
