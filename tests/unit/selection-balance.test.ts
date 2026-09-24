import { describe, expect, it } from 'vitest';
import { selectBalancedNews } from '@/lib/news/selector';
import { Article, CATEGORIES, Category } from '@/types/news';

function createMockDataset(countPerCategory = 5): Article[] {
  const dataset: Article[] = [];

  for (const category of CATEGORIES) {
    for (let index = 1; index <= countPerCategory; index++) {
      dataset.push({
        id: `${category}_art_${index}`,
        category,
        original_title: `Заголовок ${category} ${index}`,
        original_text: `Исходный текст ${category} ${index}`,
        source_name: `Источник ${category}`,
        source_url: `https://example.com/${category}/${index}`,
        published_at: new Date(Date.now() - index * 3_600_000).toISOString(),
        content_hash: `hash_${category}_${index}`,
        safety_status: 'safe',
        created_at: new Date().toISOString(),
      });
    }
  }

  return dataset;
}

describe('Selection & Balance Algorithm', () => {
  it('returns 12 cards for four complete desktop grid rows', () => {
    expect(selectBalancedNews(createMockDataset())).toHaveLength(12);
  });

  it('includes exactly 2 cards from each of the 6 categories', () => {
    const selected = selectBalancedNews(createMockDataset());
    const counts = selected.reduce<Partial<Record<Category, number>>>((result, card) => {
      result[card.category] = (result[card.category] || 0) + 1;
      return result;
    }, {});

    for (const category of CATEGORIES) {
      expect(counts[category]).toBe(2);
    }
  });

  it('avoids repeating excluded cards across pagination rounds', () => {
    const dataset = createMockDataset();
    const firstIds = selectBalancedNews(dataset).map((card) => card.id);
    const secondIds = selectBalancedNews(dataset, firstIds).map((card) => card.id);

    expect(secondIds).toHaveLength(12);
    for (const id of secondIds) {
      expect(firstIds).not.toContain(id);
    }
  });
});
