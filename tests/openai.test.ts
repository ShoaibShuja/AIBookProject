import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractOpenAIText, generateBookReply } from '@/lib/openai';

describe('OpenAI chat provider', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('extracts text from a Responses API message payload', () => {
    expect(extractOpenAIText({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'Grounded answer' }] }] })).toBe('Grounded answer');
  });

  it('sends grounded chat requests to GPT-5.6 Luna', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ output_text: 'Answer from the book.' }), { status: 200 }));
    await expect(generateBookReply({ question: 'What is the topic?', history: [], grounding: 'The book discusses testing.', safetyIdentifier: 'test-user' })).resolves.toBe('Answer from the book.');
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.model).toBe('gpt-5.6-luna');
    expect(request.input).toContain('The book discusses testing.');
    fetchMock.mockRestore();
  });
});
