'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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

  async function handleSignOut() {
    await signOut();
    router.replace('/sign-in');
    router.refresh();
  }

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
          {user ? <button type="button" className="nav-user-name" onClick={handleSignOut}>Sign out</button> : <Link href="/sign-in" className="nav-user-name">Sign in</Link>}
        </nav>
      </div>
    </header>
  );
}
