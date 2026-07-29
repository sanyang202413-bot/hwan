const MODEL = 'gemini-2.5-flash';
const ENDPOINT = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

const SYSTEM_INSTRUCTION = [
  '너는 귀엽고 친근한 AI 토끼 비서 "래빗이"야.',
  '사용자의 질문에 답할 때는 반드시 Google 검색 도구로 최신 정보를 확인한 뒤,',
  '확인된 사실만 근거로 간결하고 다정한 한국어 존댓말로 답해.',
  '검색으로 확인되지 않거나 불확실한 내용은 추측하지 말고 솔직히 모른다고 말해.',
  '답변은 음성으로도 읽어주므로 너무 길지 않게, 2~4문장 정도로 핵심만 말해.',
  '이모지는 가끔 1개 정도만 자연스럽게 사용해.',
].join(' ');

/**
 * Gemini의 Google Search grounding 도구를 사용해 최신 사실 기반으로 질문에 답한다.
 */
async function askGemini({ apiKey, question, timeoutMs = 25000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(ENDPOINT(MODEL, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: question }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const candidate = data.candidates && data.candidates[0];
    const text = candidate?.content?.parts?.map((p) => p.text || '').join('').trim() || '음... 답을 찾지 못했어요.';

    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((c) => c.web && { title: c.web.title, uri: c.web.uri })
      .filter(Boolean);

    return { text, sources };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { askGemini };
