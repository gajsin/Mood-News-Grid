import { RssFeedConfig, RssSourceConfig } from './sources';

export interface FetchedRssFeed {
  xml: string;
  feed: RssFeedConfig;
}

export async function fetchRssFeed(source: RssSourceConfig): Promise<FetchedRssFeed> {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  let lastError: Error | null = null;

  for (const feed of source.feeds) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(feed.url, {
          headers,
          signal: controller.signal,
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.length > 50) {
            return { xml: text, feed };
          }
        } else {
          lastError = new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  throw new Error(
    `Не удалось загрузить RSS для ${source.category}: ${lastError?.message || 'Все источники недоступны'}`
  );
}
