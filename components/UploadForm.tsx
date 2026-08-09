'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/components/AuthProvider';
import type { BookUploadFormValues } from '@/types';

function extensionFor(file: File | Blob, fallback: string) {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/png') return 'png';
  return fallback;
}

export default function UploadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const form = useForm<BookUploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: { title: '', author: '', persona: '', pdfFile: undefined, coverImage: undefined },
  });

  async function onSubmit(data: BookUploadFormValues) {
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const bookId = crypto.randomUUID();
    const prefix = `${user.id}/${bookId}`;
    const uploaded: { bucket: 'book-files' | 'book-covers'; path: string }[] = [];

    try {
      const existing = await checkBookExists(data.title);
      if (existing.exists && existing.book) {
        toast.info('A book with this title already exists in your library.');
        router.push(`/books/${existing.book.slug}`);
        return;
      }

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

      const result = await ingestBook({
        id: bookId,
        title: data.title,
        author: data.author,
        persona: data.persona,
        pdfPath,
        coverPath,
        fileSize: data.pdfFile.size,
        segments: parsed.content,
      });

      if (!result.success) throw new Error(result.error);
      if (result.alreadyExists) {
        await Promise.all(uploaded.map(({ bucket, path }) => supabase.storage.from(bucket).remove([path])));
        toast.info('A book with this title already exists in your library.');
        router.push(`/books/${result.data.slug}`);
        return;
      }

      form.reset();
      router.push('/');
      router.refresh();
    } catch (error) {
      await Promise.all(uploaded.map(({ bucket, path }) => supabase.storage.from(bucket).remove([path])));
      toast.error(error instanceof Error ? error.message : 'Failed to upload the book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isSubmitting ? <LoadingOverlay /> : null}
      <div className="new-book-wrapper">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FileUploader control={form.control} name="pdfFile" label="Book PDF File" acceptTypes={ACCEPTED_PDF_TYPES} icon={Upload} placeholder="Click to upload PDF" hint="PDF file (max 50MB)" disabled={isSubmitting} />
            <FileUploader control={form.control} name="coverImage" label="Cover Image (Optional)" acceptTypes={ACCEPTED_IMAGE_TYPES} icon={ImageIcon} placeholder="Click to upload cover image" hint="Leave empty to generate from the PDF" disabled={isSubmitting} />
            <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel className="form-label">Title</FormLabel><FormControl><Input className="form-input" placeholder="Introduction to Artificial Intelligence" disabled={isSubmitting} {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="author" render={({ field }) => <FormItem><FormLabel className="form-label">Author Name</FormLabel><FormControl><Input className="form-input" placeholder="Stuart Russell and Peter Norvig" disabled={isSubmitting} {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="persona" render={({ field }) => <FormItem><FormLabel className="form-label">Choose Assistant Voice</FormLabel><FormControl><VoiceSelector value={field.value} onChange={field.onChange} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>} />
            <Button type="submit" className="form-btn" disabled={isSubmitting}>Create Smart Companion</Button>
          </form>
        </Form>
      </div>
    </>
  );
}
