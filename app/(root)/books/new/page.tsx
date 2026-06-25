import UploadForm from "@/components/UploadForm";

const Page = () => {
    return (
        <main className="new-book">
            <section className="flex flex-col gap-5 text-center">
                <h1 className="page-title-xl">Upload a Book</h1>
                <p className="subtitle">Add a PDF to create a voice-native smart study companion</p>
            </section>

            <UploadForm />
        </main>
    )
}

export default Page
