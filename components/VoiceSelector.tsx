'use client';

import { Volume2 } from 'lucide-react';
import { voiceCategories, voiceOptions } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { VoiceSelectorProps } from '@/types';

export default function VoiceSelector({ value, onChange, disabled, className }: VoiceSelectorProps) {
  return <div className={cn('voice-selector', className)}>
    <RadioGroup value={value} onValueChange={onChange} disabled={disabled} className="voice-selector__groups">
      {Object.entries(voiceCategories).map(([category, voiceIds]) => <section key={category} className="voice-selector__group">
        <p>{category === 'male' ? 'Lower voices' : 'Higher voices'}</p>
        <div className="voice-selector-options">
          {voiceIds.map((voiceId) => {
            const voice = voiceOptions[voiceId as keyof typeof voiceOptions];
            const isSelected = value === voiceId;
            return <Label key={voiceId} htmlFor={voiceId} className={cn('voice-selector-option', isSelected ? 'voice-selector-option-selected' : 'voice-selector-option-default', disabled && 'voice-selector-option-disabled')}>
              <RadioGroupItem value={voiceId} id={voiceId} className="sr-only" />
              <span className="voice-selector-option__icon"><Volume2 aria-hidden="true" /></span>
              <span><strong>{voice.name}</strong><small>{voice.description}</small></span>
              <span className="voice-selector-option__indicator" aria-hidden="true" />
            </Label>;
          })}
        </div>
      </section>)}
    </RadioGroup>
  </div>;
}
