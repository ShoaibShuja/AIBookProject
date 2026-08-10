'use client';

import { Check, FileText, LoaderCircle, Sparkles } from 'lucide-react';

export default function LoadingOverlay() {
  return <div className="loading-wrapper" role="status" aria-live="polite" aria-label="Preparing your book">
    <div className="upload-loading-card">
      <div className="upload-loading-card__icon"><LoaderCircle className="animate-spin" aria-hidden="true" /></div>
      <p className="summary-eyebrow">Preparing your book</p>
      <h2>Setting up your reading room.</h2>
      <p>We are extracting the text, creating a cover, and indexing the pages for thoughtful study.</p>
      <div className="upload-loading-card__steps"><span><Check aria-hidden="true" />Upload source</span><span><FileText aria-hidden="true" />Read document</span><span><Sparkles aria-hidden="true" />Create companion</span></div>
    </div>
  </div>;
}
