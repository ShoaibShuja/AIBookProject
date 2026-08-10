type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
};

export function extractOpenAIText(payload: OpenAIResponse) {
  const directText = payload.output_text?.trim();
  if (directText) return directText;
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text')
    .map((item) => item.text ?? '')
    .join('')
    .trim() ?? '';
}

export async function generateBookReply({
  question,
  history,
  grounding,
  safetyIdentifier,
}: {
  question: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  grounding: string;
  safetyIdentifier: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Text chat is not configured. Add OPENAI_API_KEY to the server environment.');

  const transcript = history.slice(-10).map((message) => `${message.role}: ${message.content}`).join('\n');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-5.6-luna',
        reasoning: { effort: 'low' },
        max_output_tokens: 700,
        safety_identifier: safetyIdentifier,
        instructions: 'You are a helpful study companion. Answer only from the supplied book excerpts. If the excerpts do not support an answer, say so plainly. Do not invent citations or facts.',
        input: `Book excerpts:\n${grounding || 'No relevant excerpts were found.'}\n\nRecent conversation:\n${transcript || 'No prior messages.'}\n\nUser question: ${question}`,
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('The chat assistant could not respond.');
    const text = extractOpenAIText(await response.json() as OpenAIResponse);
    if (!text) throw new Error('The chat assistant returned an empty response.');
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The chat assistant took too long to respond. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
