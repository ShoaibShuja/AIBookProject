import { ReactNode } from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';
import z from 'zod';
import { UploadSchema } from '@/lib/zod';

// ============================================
// DATABASE MODELS
// ============================================

export interface IBook {
    id: string;
    title: string;
    slug: string;
    author: string;
    persona?: string;
    pdfPath: string;
    coverPath: string | null;
    coverURL?: string | null;
    fileSize: number;
    totalSegments: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBookSegment {
    id: string;
    bookId: string;
    content: string;
    segmentIndex: number;
    pageNumber?: number;
    wordCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IVoiceSession {
    id: string;
    userId: string;
    bookId: string;
    startedAt: Date;
    endedAt?: Date;
    durationSeconds: number;
    billingPeriodStart: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export type BookUploadFormValues = z.infer<typeof UploadSchema>;

export interface CreateBook {
    id: string;
    title: string;
    author: string;
    persona?: string;
    pdfPath: string;
    coverPath?: string;
    fileSize: number;
    segments: TextSegment[];
}

export interface TextSegment {
    text: string;
    segmentIndex: number;
    pageNumber?: number;
    wordCount: number;
}

export interface BookCardProps {
    title: string;
    author: string;
    coverURL?: string | null;
    slug: string;
}

export interface Messages {
    role: string;
    content: string;
}

export interface ShadowBoxProps {
    children: ReactNode;
    className?: string;
}

export interface VoiceSelectorProps {
    disabled?: boolean;
    className?: string;
    value?: string;
    onChange: (voiceId: string) => void;
}

export interface InputFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    placeholder?: string;
    disabled?: boolean;
}

export interface FileUploadFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    acceptTypes: string[];
    disabled?: boolean;
    icon: LucideIcon;
    placeholder: string;
    hint: string;
}
export interface StartSessionResult {
    success: boolean;
    sessionId?: string;
    maxDurationMinutes?: number;
    error?: string;
}

export interface EndSessionResult {
    success: boolean;
    error?: string;
}
