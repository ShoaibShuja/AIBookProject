'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, LibraryBig, LogOut, Menu, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';

const navItems = [{ label: 'Library', href: '/', icon: LibraryBig }];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
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
    setIsMobileMenuOpen(false);
    await signOut();
    router.replace('/sign-in');
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  }

  const email = user?.email ?? '';
  const name = email.split('@')[0] || 'Reader';
  const initials = name.slice(0, 2).toUpperCase();

  return <header className="app-navbar" ref={navRef}>
    <div className="wrapper app-nav">
      <Link href="/" className="app-nav__brand" aria-label="KitabHoshmand library">
        <span className="app-nav__mark"><Image src="/brand/kitabhoshmand-logo-mark.svg" alt="" width={30} height={30} priority /></span>
        <span><strong>KitabHoshmand</strong><small>Personal library</small></span>
      </Link>

      {user ? <>
        <nav className="app-nav__links" aria-label="Primary navigation">
          {navItems.map(({ label, href }) => <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={cn('app-nav__link', isActive(href) && 'app-nav__link--active')}>{label}</Link>)}
        </nav>
        <div className="app-nav__desktop-actions">
          <Link href="/books/new" className="app-nav__upload"><Upload aria-hidden="true" />Upload book</Link>
          <div className="app-nav__profile-wrap">
            <button type="button" onClick={() => setIsProfileOpen((open) => !open)} aria-expanded={isProfileOpen} aria-haspopup="menu" className="app-nav__profile-button">
              <span className="app-nav__avatar">{initials}</span><span className="app-nav__profile-name">{name}</span><ChevronDown className={cn('app-nav__chevron', isProfileOpen && 'app-nav__chevron--open')} aria-hidden="true" />
              <span className="sr-only">Open profile menu</span>
            </button>
            {isProfileOpen ? <div role="menu" className="app-profile-menu">
              <div className="app-profile-menu__identity"><span className="app-nav__avatar">{initials}</span><div><p>Personal library</p><strong>{email}</strong></div></div>
              <div className="app-profile-menu__rule" />
              <Link role="menuitem" href="/" onClick={() => setIsProfileOpen(false)}><BookOpen aria-hidden="true" />My library</Link>
              <Link role="menuitem" href="/books/new" onClick={() => setIsProfileOpen(false)}><Upload aria-hidden="true" />Upload a book</Link>
              <div className="app-profile-menu__rule" />
              <button role="menuitem" type="button" onClick={handleSignOut}><LogOut aria-hidden="true" />Sign out</button>
            </div> : null}
          </div>
        </div>
        <button type="button" className="app-nav__mobile-trigger" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation" aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}>{isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
      </> : <Link href="/sign-in" className="app-nav__sign-in">Sign in</Link>}
    </div>

    {user && isMobileMenuOpen ? <nav id="mobile-navigation" className="app-mobile-menu" aria-label="Mobile navigation">
      <div className="app-mobile-menu__identity"><span className="app-nav__avatar">{initials}</span><div><p>Signed in as</p><strong>{email}</strong></div></div>
      <div className="app-mobile-menu__links">
        {navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setIsMobileMenuOpen(false)} aria-current={isActive(href) ? 'page' : undefined} className={cn(isActive(href) && 'app-mobile-menu__link--active')}><Icon aria-hidden="true" />{label}</Link>)}
        <Link href="/books/new" onClick={() => setIsMobileMenuOpen(false)}><Upload aria-hidden="true" />Upload a book</Link>
      </div>
      <button type="button" onClick={handleSignOut} className="app-mobile-menu__sign-out"><LogOut aria-hidden="true" />Sign out</button>
    </nav> : null}
  </header>;
}
