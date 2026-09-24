import { RSS_SOURCES } from './sources';
import { fetchRssFeed } from './fetcher';
import { parseRssFeed } from './parser';
import { filterSafeArticles } from './content-filter';
import { saveArticle } from '../db/repository';
import { initDbSchema } from '../db/index';
import { Article } from '@/types/news';

export async function syncFreshRssArticles(): Promise<Article[]> {
  await initDbSchema();

  const articlesByCategory = await Promise.all(RSS_SOURCES.map(async (source) => {
    try {
      const { xml, feed } = await fetchRssFeed(source);
      const rawArticles = parseRssFeed(
        xml,
        source.category,
        feed.sourceName,
        feed.utcOffsetCorrectionHours
      );
      const safeArticles = filterSafeArticles(rawArticles);

      const latestArticles = safeArticles.slice(0, 12);
      await Promise.all(latestArticles.map(saveArticle));
      return latestArticles;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[RSS Sync] Could not fetch ${source.category}: ${message}`);
      return [];
    }
  }));

  return articlesByCategory.flat();
}
