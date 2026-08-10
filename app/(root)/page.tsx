import HeroSection from "@/components/HeroSection";
import BookCard from "@/components/BookCard";
import {getAllBooks} from "@/lib/actions/book.actions";
import Search from "@/components/Search";
import Link from 'next/link';
import { LibraryBig, SearchX } from 'lucide-react';

const Page = async ({ searchParams }: { searchParams: Promise<{ query?: string }> }) => {
    const { query } = await searchParams;

    const bookResults = await getAllBooks(query)
    const books = bookResults.success ? bookResults.data ?? [] : []

    return (
        <main className="wrapper container dashboard-page">
            <HeroSection bookCount={books.length} featuredBook={books[0]} isSearchResult={Boolean(query?.trim())} />

            <section className="dashboard-library" aria-labelledby="library-title">
                <header className="dashboard-library__header">
                    <div>
                        <p className="dashboard-kicker">Library index</p>
                        <h2 id="library-title">Your books</h2>
                        <p className="dashboard-library__count">{books.length} {books.length === 1 ? 'title' : 'titles'} {query ? 'found' : 'in your collection'}</p>
                    </div>
                    <Search />
                </header>

                {books.length ? <div className="library-books-grid">
                    {books.map((book) => (
                        <BookCard key={book.id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
                    ))}
                </div> : <div className="dashboard-library__empty">
                    <div className="dashboard-library__empty-icon">{query ? <SearchX aria-hidden="true" /> : <LibraryBig aria-hidden="true" />}</div>
                    <h3>{query ? 'No books match that search.' : 'Your library is ready for its first book.'}</h3>
                    <p>{query ? 'Try a different title or author.' : 'Upload a PDF to begin a more thoughtful way to read, ask, and review.'}</p>
                    {query ? <Link href="/" className="dashboard-empty-link">Clear search</Link> : <Link href="/books/new" className="dashboard-empty-link">Upload your first book</Link>}
                </div>}
            </section>
        </main>
    )
}

export default Page
