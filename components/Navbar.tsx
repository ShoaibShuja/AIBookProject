'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, LogOut, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';

const navItems = [
  { label: 'Library', href: '/' },
  { label: 'Upload', href: '/books/new' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsProfileOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  async function handleSignOut() {
    setIsProfileOpen(false);
    await signOut();
    router.replace('/sign-in');
    router.refresh();
  }

  const email = user?.email ?? '';
  const initials = (email.split('@')[0] || 'U').slice(0, 2).toUpperCase();

  return (
    <header className="w-full fixed z-50 bg-(--bg-primary)">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-0.5 items-center">
          <Image src="/brand/kitabhoshmand-logo-mark.svg" alt="KitabHoshmand logo" width={38} height={38} />
          <span className="logo-text">KitabHoshmand</span>
        </Link>
        <nav className="w-fit flex gap-5 items-center">
          {user && navItems.map(({ label, href }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            return <Link href={href} key={href} className={cn('nav-link-base', isActive ? 'nav-link-active' : 'text-black hover:opacity-70')}>{label}</Link>;
          })}
          {user ? <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-full border border-[#d6c4aa] bg-[#fffaf0] py-1 pl-1 pr-2 text-[#3c2718] shadow-sm transition hover:border-[#9a633e] hover:bg-[#f8ebd9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663820]"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#663820] font-serif text-xs font-bold tracking-wide text-white">{initials}</span>
              <span className="hidden max-w-28 truncate text-sm font-semibold sm:inline">{email.split('@')[0]}</span>
              <ChevronDown className={`size-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              <span className="sr-only">Open profile menu</span>
            </button>
            {isProfileOpen ? <div role="menu" className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-64 overflow-hidden rounded-2xl border border-[#d6c4aa] bg-[#fffdf8] p-2 shadow-[0_18px_45px_rgba(80,48,25,0.18)]">
              <div className="rounded-xl bg-[#f3e4cc] px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8d5e3e]">Reader profile</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#2b1d14]">{email}</p>
              </div>
              <div className="my-2 h-px bg-[#eadcc8]" />
              <Link role="menuitem" href="/" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4a3424] transition hover:bg-[#f7ead8]"><BookOpen className="size-4 text-[#8d5e3e]" />My library</Link>
              <Link role="menuitem" href="/books/new" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4a3424] transition hover:bg-[#f7ead8]"><Upload className="size-4 text-[#8d5e3e]" />Upload a book</Link>
              <div className="my-2 h-px bg-[#eadcc8]" />
              <button role="menuitem" type="button" onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#9f2d22] transition hover:bg-[#fff0eb]"><LogOut className="size-4" />Sign out</button>
            </div> : null}
          </div> : <Link href="/sign-in" className="nav-user-name">Sign in</Link>}
        </nav>
      </div>
    </header>
  );
}
