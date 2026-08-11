import { Mood, MOODS } from '@/types/news';

export const POLZA_BASE_URL = process.env.POLZA_BASE_URL || 'https://polza.ai/api/v1';
export const POLZA_MODEL = process.env.POLZA_MODEL || 'openai/gpt-5.6-luna';
export const getPolzaApiKey = () => process.env.POLZA_API_KEY;

export const EDITOR_PROMPT = `# Role & Mission
Ты — редактор новостей в проекте Mood News Grid.
Твоя задача — переписать заголовок и текст новости в выбранном эмоциональном режиме (<mood>).
Настроение должно явно чувствоваться и в заголовке, и в тексте, даже если оно противоположно исходной эмоциональной окраске события.

# Mood Definitions
- neutral — объективно, спокойно, информационно.
- joyful — явно радостно, тепло, оптимистично.
- sad — явно грустно, меланхолично.
- ironic — явно иронично, остроумно, без токсичности.
- surprised — явно удивлённо, интригующе, без дешёвого кликбейта.

# Core Constraints
- Сохрани смысл и фактическую основу новости.
- Не придумывай новые реальные события, людей, цифры, даты, причины, цитаты или другие сведения, которых нет в исходнике.
- Не превращай прогноз, предположение или роль в гарантированный свершившийся факт.
- При этом не будь чрезмерно буквальным: разрешены нормальные журналистские переформулировки, очевидные выводы из контекста, метафоры, игра слов, изменение акцентов, композиции и эмоциональной интерпретации, если они не делают фактический смысл новости другим.
- Не пытайся подставить механический шаблон — выбирай подходящий художественный приём исходя из конкретной новости.
- Длина текста должна быть естественной для количества информации в источнике (обычно 1–3 связных предложения).

# Output Format
Верни строго JSON: {"title": "...", "text": "...", "mood": "..."}.`;

function serializePromptData(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

const JSON_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'news_rewrite',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Эмоциональный заголовок новости в заданном тоне',
        },
        text: {
          type: 'string',
          description: 'Переписанный текст новости (анонс) в заданном тоне с точным сохранением всех фактов',
        },
        mood: {
          type: 'string',
          enum: MOODS,
          description: 'Идентификатор настроения',
        },
      },
      required: ['title', 'text', 'mood'],
      additionalProperties: false,
    },
  },
};

export interface RewriteAiResponse {
  title: string;
  text: string;
  mood: Mood;
}

export async function requestRewriteFromAi(
  originalTitle: string,
  originalText: string,
  mood: Mood,
  feedbackGuidance?: string
): Promise<RewriteAiResponse> {
  const apiKey = getPolzaApiKey();
  if (!apiKey) {
    throw new Error('POLZA_API_KEY не настроен');
  }

  const userPrompt = `<source_news>
${serializePromptData({ title: originalTitle, text: originalText })}
</source_news>
<requested_mood>${mood}</requested_mood>${
    feedbackGuidance
      ? `\n\nОбрати внимание на замечание: ${serializePromptData(feedbackGuidance)}`
      : ''
  }`;

  const payload = {
    model: POLZA_MODEL,
    messages: [
      { role: 'developer' as const, content: EDITOR_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ],
    response_format: JSON_SCHEMA,
    temperature: 0.35,
    reasoning_effort: 'medium',
    max_tokens: 2000,
  };

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${POLZA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Polza API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const rawContent = choice?.message?.content;
      if (!rawContent) {
        const finishReason = choice?.finish_reason || 'unknown';
        const completionTokens = data.usage?.completion_tokens ?? 'unknown';
        const refused = Boolean(choice?.message?.refusal);
        throw new Error(
          `Polza API вернула пустой ответ (finish_reason=${finishReason}, completion_tokens=${completionTokens}, refusal=${refused})`
        );
      }

      const parsed = JSON.parse(rawContent) as RewriteAiResponse;
      if (typeof parsed.title !== 'string' || typeof parsed.text !== 'string') {
        throw new Error('Polza API вернула ответ неверного формата');
      }
      return {
        title: parsed.title.trim(),
        text: parsed.text.trim(),
        mood,
      };
    } catch (err: any) {
      lastError = err;
      if (attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('Не удалось получить ответ от Polza API');
}
