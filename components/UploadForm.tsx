'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, ImageIcon, Upload, UserRound, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FileUploader from '@/components/FileUploader';
import VoiceSelector from '@/components/VoiceSelector';
import LoadingOverlay from '@/components/LoadingOverlay';
import { UploadSchema } from '@/lib/zod';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPES } from '@/lib/constants';
import { parsePDFFile } from '@/lib/utils';
import { checkBookExists, ingestBook } from '@/lib/actions/book.actions';
import { createClient } from '@/lib/supabase/client';
import type { BookUploadFormValues } from '@/types';

function extensionFor(file: File | Blob, fallback: string) {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/png') return 'png';
  return fallback;
}

export default function UploadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const form = useForm<BookUploadFormValues>({ resolver: zodResolver(UploadSchema), defaultValues: { title: '', author: '', persona: '', pdfFile: undefined, coverImage: undefined } });

  async function onSubmit(data: BookUploadFormValues) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/sign-in'); return; }

    setIsSubmitting(true);
    const bookId = crypto.randomUUID();
    const prefix = `${user.id}/${bookId}`;
    const uploaded: { bucket: 'book-files' | 'book-covers'; path: string }[] = [];

    try {
      const existing = await checkBookExists(data.title);
      if (existing.exists && existing.book) { toast.info('A book with this title already exists in your library.'); router.push(`/books/${existing.book.slug}`); return; }

      const parsed = await parsePDFFile(data.pdfFile);
      if (!parsed.content.length) throw new Error('No searchable text was found in this PDF.');

      const pdfPath = `${prefix}/source.pdf`;
      const pdfUpload = await supabase.storage.from('book-files').upload(pdfPath, data.pdfFile, { contentType: 'application/pdf', upsert: false });
      if (pdfUpload.error) throw pdfUpload.error;
      uploaded.push({ bucket: 'book-files', path: pdfPath });

      const coverBlob: Blob = data.coverImage ? data.coverImage : await fetch(parsed.cover).then((response) => response.blob());
      const coverPath = `${prefix}/cover.${extensionFor(coverBlob, 'png')}`;
      const coverUpload = await supabase.storage.from('book-covers').upload(coverPath, coverBlob, { contentType: coverBlob.type || 'image/png', upsert: false });
      if (coverUpload.error) throw coverUpload.error;
      uploaded.push({ bucket: 'book-covers', path: coverPath });

      const result = await ingestBook({ id: bookId, title: data.title, author: data.author, persona: data.persona, pdfPath, coverPath, fileSize: data.pdfFile.size, segments: parsed.content });
      if (!result.success) throw new Error(result.error);
      if (result.alreadyExists) { await Promise.all(uploaded.map(({ bucket, path }) => supabase.storage.from(bucket).remove([path]))); toast.info('A book with this title already exists in your library.'); router.push(`/books/${result.data.slug}`); return; }

      form.reset();
      router.push('/');
      router.refresh();
    } catch (error) {
      await Promise.all(uploaded.map(({ bucket, path }) => supabase.storage.from(bucket).remove([path])));
      toast.error(error instanceof Error ? error.message : 'Failed to upload the book. Please try again.');
    } finally { setIsSubmitting(false); }
  }

  return <>
    {isSubmitting ? <LoadingOverlay /> : null}
    <div className="upload-form-layout">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="upload-form-card">
          <section className="upload-form-section upload-form-section--source">
            <header><span><Upload aria-hidden="true" /></span><div><p className="summary-eyebrow">01 · Source material</p><h2>Choose your book</h2><p>Start with a searchable PDF. We keep it private to your library.</p></div></header>
            <FileUploader control={form.control} name="pdfFile" label="Book PDF" acceptTypes={ACCEPTED_PDF_TYPES} icon={Upload} placeholder="Select a PDF from your device" hint="PDF only · up to 50 MB" disabled={isSubmitting} />
          </section>

          <section className="upload-form-section">
            <header><span><BookOpen aria-hidden="true" /></span><div><p className="summary-eyebrow">02 · Book details</p><h2>Name the work</h2><p>These details make the book easy to find later.</p></div></header>
            <div className="upload-form-fields">
              <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel className="upload-field-label">Book title</FormLabel><FormControl><Input className="upload-form-input" placeholder="Introduction to Artificial Intelligence" disabled={isSubmitting} {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="author" render={({ field }) => <FormItem><FormLabel className="upload-field-label">Author</FormLabel><FormControl><Input className="upload-form-input" placeholder="Stuart Russell and Peter Norvig" disabled={isSubmitting} {...field} /></FormControl><FormMessage /></FormItem>} />
            </div>
            <FileUploader control={form.control} name="coverImage" label="Cover image · optional" acceptTypes={ACCEPTED_IMAGE_TYPES} icon={ImageIcon} placeholder="Add a cover image" hint="Or we will create one from the PDF" disabled={isSubmitting} />
          </section>

          <section className="upload-form-section">
            <header><span><Volume2 aria-hidden="true" /></span><div><p className="summary-eyebrow">03 · Study companion</p><h2>Choose a voice</h2><p>Select the voice that will guide your future conversations.</p></div></header>
            <FormField control={form.control} name="persona" render={({ field }) => <FormItem><FormLabel className="sr-only">Choose assistant voice</FormLabel><FormControl><VoiceSelector value={field.value} onChange={field.onChange} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>} />
          </section>

          <Button type="submit" className="upload-submit" disabled={isSubmitting}><UserRound aria-hidden="true" />Create study companion</Button>
        </form>
      </Form>

      <aside className="upload-form-aside">
        <p className="summary-eyebrow">A private reading practice</p>
        <h2>What happens next</h2>
        <ol><li><span>01</span><div><strong>We read the document</strong><p>Your PDF is prepared for meaningful questions and search.</p></div></li><li><span>02</span><div><strong>We build your companion</strong><p>Your selected voice is ready to discuss the text with you.</p></div></li><li><span>03</span><div><strong>You choose how to study</strong><p>Talk, chat, or create a guide whenever it suits you.</p></div></li></ol>
      </aside>
    </div>
  </>;
}
