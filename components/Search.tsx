'use client';

import { useEffect, useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Search() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(searchParams.get('query') || '');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (query) params.set('query', query);
      else params.delete('query');
      const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, pathname, router]);

  return (
    <div className="library-search-wrapper">
      <SearchIcon className="library-search-icon" aria-hidden="true" />
      <label htmlFor="library-search" className="sr-only">Search your library</label>
      <input id="library-search" type="search" placeholder="Search title or author" className="library-search-input" value={query} onChange={(event) => setQuery(event.target.value)} />
      {query ? <button type="button" onClick={() => setQuery('')} className="library-search-clear" aria-label="Clear search"><X aria-hidden="true" /></button> : null}
    </div>
  );
}
