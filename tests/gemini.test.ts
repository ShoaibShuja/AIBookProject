import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractGeminiText, generateBookReply, toGeminiError } from '@/lib/gemini';

describe('Gemini chat provider', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('extracts text from a generateContent payload', () => {
    expect(extractGeminiText({ candidates: [{ content: { parts: [{ text: 'Grounded answer' }] } }] })).toBe('Grounded answer');
  });

  it('makes exhausted Gemini quota actionable', () => {
    expect(toGeminiError(429, { error: { message: 'Resource exhausted' } })).toContain('quota');
  });

  it('sends grounded chat requests to Gemini', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Answer from the book.' }] } }] }), { status: 200 }));
    await expect(generateBookReply({ question: 'What is the topic?', history: [], grounding: 'The book discusses testing.', safetyIdentifier: 'test-user' })).resolves.toBe('Answer from the book.');
    const [url, options] = fetchMock.mock.calls[0];
    const request = JSON.parse(String(options?.body));
    expect(String(url)).toContain('gemini-2.5-flash:generateContent');
    expect(request.system_instruction.parts[0].text).toContain('The book discusses testing.');
    fetchMock.mockRestore();
  });
});
