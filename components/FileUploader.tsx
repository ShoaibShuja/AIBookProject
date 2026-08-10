'use client';

import { useCallback, useId, useRef } from 'react';
import { Check, FileText, X } from 'lucide-react';
import { useController, type FieldValues } from 'react-hook-form';
import type { FileUploadFieldProps } from '@/types';
import { cn } from '@/lib/utils';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;

export default function FileUploader<T extends FieldValues>({ control, name, label, acceptTypes, disabled, icon: Icon, placeholder, hint }: FileUploadFieldProps<T>) {
  const { field: { onChange, value } } = useController({ name, control });
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const isUploaded = Boolean(value);
  const file = value as File | undefined;

  const openPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) onChange(selectedFile);
  }, [onChange]);

  const onRemove = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onChange]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  }, [openPicker]);

  return <FormItem className="upload-file-field">
    <FormLabel className="upload-field-label">{label}</FormLabel>
    <FormControl>
      <div
        className={cn('upload-dropzone', isUploaded && 'upload-dropzone-uploaded', disabled && 'upload-dropzone-disabled')}
        role={isUploaded ? undefined : 'button'}
        tabIndex={isUploaded || disabled ? undefined : 0}
        aria-label={isUploaded ? undefined : placeholder}
        onClick={openPicker}
        onKeyDown={isUploaded ? undefined : onKeyDown}
      >
        <input id={inputId} type="file" accept={acceptTypes.join(',')} className="sr-only" ref={inputRef} onChange={handleFileChange} disabled={disabled} />
        {isUploaded && file ? <div className="upload-dropzone__selected">
          <div className="upload-dropzone__selected-icon"><FileText aria-hidden="true" /></div>
          <div className="min-w-0 flex-1"><p>{file.name}</p><span><Check aria-hidden="true" />{formatFileSize(file.size)} · Ready to upload</span></div>
          <button type="button" onClick={onRemove} className="upload-dropzone-remove" aria-label={`Remove ${file.name}`}><X aria-hidden="true" /></button>
        </div> : <>
          <div className="upload-dropzone__icon"><Icon aria-hidden="true" /></div>
          <p className="upload-dropzone-text">{placeholder}</p>
          <p className="upload-dropzone-hint">{hint}</p>
        </>}
      </div>
    </FormControl>
    <FormMessage />
  </FormItem>;
}
