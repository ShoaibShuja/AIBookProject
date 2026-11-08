type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { code?: number; message?: string; status?: string };
};

type GeminiRequest = {
  systemInstruction: string;
  contents: Array<{ role: 'user' | 'model'; text: string }>;
  maxOutputTokens: number;
  responseMimeType?: 'application/json';
};

export function toGeminiError(status: number, payload: GeminiResponse) {
  if (status === 400 || status === 401 || status === 403) return 'Gemini rejected the API key. Check GEMINI_API_KEY in the server environment.';
  if (status === 404) return 'The configured Gemini model is unavailable. Check GEMINI_CHAT_MODEL access.';
  if (status === 429) return 'Gemini quota is exhausted or rate limited. Check your Google AI Studio quota, then try again.';
  return payload.error?.message || 'The chat assistant could not respond. Please try again.';
}

export function extractGeminiText(payload: GeminiResponse) {
  return payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim() ?? '';
}

export async function generateGeminiText({ systemInstruction, contents, maxOutputTokens, responseMimeType }: GeminiRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Text chat is not configured. Add GEMINI_API_KEY to the server environment.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: contents.map((content) => ({ role: content.role, parts: [{ text: content.text }] })),
        generationConfig: { maxOutputTokens, ...(responseMimeType ? { responseMimeType } : {}) },
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    const payload = await response.json() as GeminiResponse;
    if (!response.ok) throw new Error(toGeminiError(response.status, payload));
    const text = extractGeminiText(payload);
    if (!text) throw new Error('The chat assistant returned an empty response.');
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The chat assistant took too long to respond. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
