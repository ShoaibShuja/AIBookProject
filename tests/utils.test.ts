import { describe, expect, it } from 'vitest';
import { splitIntoSegments } from '@/lib/utils';

describe('splitIntoSegments', () => {
  it('creates ordered fixed-size chunks with the configured overlap', () => {
    const words = Array.from({ length: 950 }, (_, index) => `word${index + 1}`).join(' ');
    const segments = splitIntoSegments(words);
    expect(segments).toHaveLength(2);
    expect(segments.map((segment) => segment.segmentIndex)).toEqual([0, 1]);
    expect(segments.map((segment) => segment.wordCount)).toEqual([500, 500]);
    expect(segments[0].text.split(' ').slice(-50)).toEqual(segments[1].text.split(' ').slice(0, 50));
  });

  it('accepts short documents without fabricating duplicate segments', () => {
    expect(splitIntoSegments('one two three')).toEqual([{ text: 'one two three', segmentIndex: 0, wordCount: 3 }]);
  });
});
