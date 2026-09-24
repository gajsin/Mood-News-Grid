import { XMLParser } from 'fast-xml-parser';
import crypto from 'crypto';
import { Article, Category } from '@/types/news';

export interface RawRssItem {
  title?: string;
  link?: string | { [key: string]: any; '#text'?: string; '@_href'?: string };
  description?: string;
  'content:encoded'?: string;
  summary?: string;
  pubDate?: string;
  published?: string;
  'dc:date'?: string;
  guid?: string | { '#text'?: string };
}

export function cleanHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let text = rawHtml
    // Remove scripts and styles
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    // Replace breaks and paragraphs with spaces
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  // Normalize spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Strip RSS boilerplate tails (e.g. "Читать далее", "Читать дальше на Хабре", "Подробнее...")
  text = text
    .replace(/\s*\[?\s*Читать\s+(?:далее|дальше|полную\s+новость)(?:\s+на\s+Хабре)?\s*\]?\.{0,3}\s*$/gi, '')
    .replace(/\s*\[?\s*Подробнее(?:\s+в\s+источнике|\s+на\s+сайте)?\s*\]?\.{0,3}\s*$/gi, '')
    .replace(/\s*\[?\s*Источник(?:\s*:\s*.*)?\s*\]?\s*$/gi, '')
    .trim();

  return text;
}

export function computeContentHash(url: string, title: string, text: string): string {
  const content = `${url.trim().toLowerCase()}|${title.trim()}|${text.trim()}`;
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

export function parseRssFeed(
  xmlContent: string,
  category: Category,
  sourceName: string,
  utcOffsetCorrectionHours = 0
): Article[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true,
  });

  const parsed = parser.parse(xmlContent);
  const items: RawRssItem[] = [];

  // RSS 2.0
  if (parsed.rss?.channel?.item) {
    const channelItems = parsed.rss.channel.item;
    if (Array.isArray(channelItems)) {
      items.push(...channelItems);
    } else {
      items.push(channelItems);
    }
  }
  // Atom
  else if (parsed.feed?.entry) {
    const feedEntries = parsed.feed.entry;
    if (Array.isArray(feedEntries)) {
      items.push(...feedEntries);
    } else {
      items.push(feedEntries);
    }
  }

  const articles: Article[] = [];

  for (const item of items) {
    const rawTitle = typeof item.title === 'string' ? item.title : (item.title as any)?.['#text'] || '';
    const cleanTitle = cleanHtml(rawTitle);

    let rawLink = '';
    if (typeof item.link === 'string') {
      rawLink = item.link;
    } else if (typeof item.link === 'object' && item.link !== null) {
      rawLink = item.link['@_href'] || item.link['#text'] || '';
    } else if (item.guid) {
      rawLink = typeof item.guid === 'string' ? item.guid : item.guid['#text'] || '';
    }

    const cleanLink = rawLink.trim();
    if (!cleanTitle || !cleanLink) continue;

    const rawDescription =
      item['content:encoded'] || item.description || item.summary || '';
    const cleanDesc = cleanHtml(
      typeof rawDescription === 'string' ? rawDescription : (rawDescription as any)?.['#text'] || ''
    );

    // If description is empty or identical to title, keep at least title as announcement
    const originalText = cleanDesc.length > 20 ? cleanDesc : cleanTitle;

    const rawDate = item.pubDate || item.published || item['dc:date'] || new Date().toISOString();
    let publishedAt = new Date().toISOString();
    try {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        const hasUtcMarker = /(?:\+0000|\bGMT\b)/i.test(String(rawDate));
        const correctedTime = hasUtcMarker
          ? parsedDate.getTime() + utcOffsetCorrectionHours * 3600 * 1000
          : parsedDate.getTime();
        publishedAt = new Date(correctedTime).toISOString();
      }
    } catch {
      publishedAt = new Date().toISOString();
    }

    const contentHash = computeContentHash(cleanLink, cleanTitle, originalText);
    const id = `art_${contentHash.substring(0, 16)}`;

    articles.push({
      id,
      category,
      original_title: cleanTitle,
      original_text: originalText,
      source_name: sourceName,
      source_url: cleanLink,
      published_at: publishedAt,
      content_hash: contentHash,
      safety_status: 'safe',
      created_at: new Date().toISOString(),
    });
  }

  return articles;
}
