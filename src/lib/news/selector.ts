import { Article, CATEGORIES, Category, NewsCard } from '@/types/news';

export const NEWS_BATCH_SIZE = 12;

export function selectBalancedNews(
  dataset: Article[],
  excludedIds: string[] = []
): NewsCard[] {
  const excludeSet = new Set(excludedIds);

  // Group by category
  const byCategory = new Map<Category, Article[]>();
  for (const cat of CATEGORIES) {
    byCategory.set(cat, []);
  }

  for (const item of dataset) {
    const list = byCategory.get(item.category) || [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  // Sort each category pool by published_at DESC (freshest first)
  for (const list of byCategory.values()) {
    list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }

  // Determine round offset for cyclic rotation
  const roundOffset = Math.floor(excludedIds.length / NEWS_BATCH_SIZE);

  // Two cards from each of six categories fill four complete three-column rows.
  const countsPerCategory: Record<Category, number> = {
    it: 2,
    economy: 2,
    sport: 2,
    science: 2,
    culture: 2,
    travel: 2,
  };

  const selectedItems: Article[] = [];
  const selectedArticleIds = new Set<string>();

  for (const cat of CATEGORIES) {
    const needed = countsPerCategory[cat] || 1;
    const pool = byCategory.get(cat) || [];

    if (pool.length === 0) continue;

    // Prioritize non-excluded items
    const unseen = pool.filter((item) => !excludeSet.has(item.id));
    
    // Rotate pool based on roundOffset so cycling always provides different combinations
    const shift = (roundOffset * 2) % pool.length;
    const rotatedPool = [...pool.slice(shift), ...pool.slice(0, shift)];
    const candidates = unseen.length >= needed ? unseen : [...unseen, ...rotatedPool];

    let added = 0;
    for (const candidate of candidates) {
      if (added >= needed) break;
      if (!selectedArticleIds.has(candidate.id)) {
        selectedItems.push(candidate);
        selectedArticleIds.add(candidate.id);
        added++;
      }
    }
  }

  // Fill missing category slots from the remaining dataset.
  if (selectedItems.length < NEWS_BATCH_SIZE && dataset.length > 0) {
    const shift = (roundOffset * CATEGORIES.length) % dataset.length;
    const rotatedDataset = [...dataset.slice(shift), ...dataset.slice(0, shift)];
    for (const item of rotatedDataset) {
      if (selectedItems.length >= NEWS_BATCH_SIZE) break;
      if (!selectedArticleIds.has(item.id)) {
        selectedItems.push(item);
        selectedArticleIds.add(item.id);
      }
    }
  }

  // Sort selected cards chronologically descending (freshest first)
  const batch = selectedItems.slice(0, NEWS_BATCH_SIZE);
  batch.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return batch.map((article) => ({
    id: article.id,
    category: article.category,
    source_name: article.source_name,
    source_url: article.source_url,
    published_at: article.published_at,
    original_title: article.original_title,
    original_text: article.original_text,
    content_hash: article.content_hash,
  }));
}
