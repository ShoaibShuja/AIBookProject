import UploadForm from "@/components/UploadForm";
import { requireUser } from '@/lib/auth';

const Page = async () => {
    await requireUser();
    return (
        <main className="upload-page">
            <section className="upload-page__hero">
                <p className="summary-eyebrow">Add to your personal library</p>
                <h1>Bring a book into focus.</h1>
                <p>Upload a PDF and create a private study companion built around the way you prefer to learn.</p>
            </section>

            <UploadForm />
        </main>
    )
}

export default Page
