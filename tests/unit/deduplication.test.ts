import { describe, it, expect } from 'vitest';
import { computeContentHash } from '@/lib/rss/parser';

describe('Deduplication logic', () => {
  it('identifies duplicates with same canonical URL even if spacing differs', () => {
    const hashA = computeContentHash('https://habr.com/news/100', 'Заголовок', 'Текст новости');
    const hashB = computeContentHash('https://habr.com/news/100 ', ' Заголовок ', ' Текст новости ');
    expect(hashA).toBe(hashB);
  });

  it('generates distinct hashes for different URLs with identical text', () => {
    const hashA = computeContentHash('https://habr.com/news/1', 'Новость', 'Текст');
    const hashB = computeContentHash('https://habr.com/news/2', 'Новость', 'Текст');
    expect(hashA).not.toBe(hashB);
  });
});
