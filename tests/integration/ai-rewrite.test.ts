import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { requestRewriteFromAi } from '@/lib/ai/polza-client';

const originalFetch = global.fetch;

describe('AI Rewrite Client (Integration & Schema)', () => {
  beforeEach(() => {
    vi.stubEnv('POLZA_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it('parses valid JSON Schema response correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Радостная победа отечественных исследователей!',
                text: 'Ученые успешно запустили новый квантовый генератор в 2026 году.',
                mood: 'joyful',
              }),
            },
          },
        ],
      }),
    });

    global.fetch = mockFetch;

    const result = await requestRewriteFromAi(
      'Ученые запустили квантовый генератор в 2026 году',
      'Запуск прошел в штатном режиме.',
      'joyful'
    );

    expect(result.title).toBe('Радостная победа отечественных исследователей!');
    expect(result.text).toContain('2026');
    expect(result.mood).toBe('joyful');
  });

  it('throws informative error on API failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized invalid key',
    });

    global.fetch = mockFetch;

    await expect(
      requestRewriteFromAi('Заголовок', 'Текст', 'neutral')
    ).rejects.toThrow('Polza API error (401)');
  });
});
