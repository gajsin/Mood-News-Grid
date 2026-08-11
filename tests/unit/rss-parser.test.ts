import { describe, it, expect } from 'vitest';
import { cleanHtml, computeContentHash, parseRssFeed } from '@/lib/rss/parser';

describe('RSS Parser & Normalizer', () => {
  it('cleans HTML tags and decodes entities properly', () => {
    const raw = '<p>Компания &laquo;Яндекс&raquo; объявила о запуске &mdash; 100% нового сервиса &amp; API.<br/>Подробности: <a href="https://example.com">тут</a></p>';
    const cleaned = cleanHtml(raw);
    expect(cleaned).toBe('Компания «Яндекс» объявила о запуске — 100% нового сервиса & API. Подробности: тут');
  });

  it('strips RSS boilerplate tails like Читать далее and Подробнее', () => {
    const raw1 = 'Контроль статуса самозанятого встраивается в момент операции. Читать далее';
    expect(cleanHtml(raw1)).toBe('Контроль статуса самозанятого встраивается в момент операции.');

    const raw2 = 'Президент лиги сообщил о новом бое. Читать далее на Хабре';
    expect(cleanHtml(raw2)).toBe('Президент лиги сообщил о новом бое.');

    const raw3 = 'Финансовый отчёт компании за квартал. [Подробнее]...';
    expect(cleanHtml(raw3)).toBe('Финансовый отчёт компании за квартал.');

    const raw4 = 'Игра разошлась тиражом в 3 миллиона копий. Читать полную новость';
    expect(cleanHtml(raw4)).toBe('Игра разошлась тиражом в 3 миллиона копий.');
  });

  it('computes deterministic SHA-256 content hashes', () => {
    const hash1 = computeContentHash('https://habr.com/news/1', 'Заголовок 1', 'Текст 1');
    const hash2 = computeContentHash('https://habr.com/news/1', 'Заголовок 1', 'Текст 1');
    const hash3 = computeContentHash('https://habr.com/news/2', 'Заголовок 2', 'Текст 2');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it('parses RSS 2.0 XML with items', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <item>
            <title>Тестовая новость 1</title>
            <link>https://habr.com/ru/news/12345/</link>
            <description>&lt;p&gt;Краткое описание события 2026 года.&lt;/p&gt;</description>
            <pubDate>Mon, 11 Aug 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;

    const articles = parseRssFeed(sampleXml, 'it', 'Habr News');
    expect(articles).toHaveLength(1);
    expect(articles[0].category).toBe('it');
    expect(articles[0].source_name).toBe('Habr News');
    expect(articles[0].original_title).toBe('Тестовая новость 1');
    expect(articles[0].original_text).toContain('Краткое описание события 2026 года.');
    expect(articles[0].source_url).toBe('https://habr.com/ru/news/12345/');
  });

  it('applies a deterministic source-specific UTC correction', () => {
    const sampleXml = `<?xml version="1.0"?>
      <rss><channel><item>
        <title>Новость TourDom</title>
        <link>https://www.tourdom.ru/news/1</link>
        <description>Достаточно длинное описание туристической новости.</description>
        <pubDate>Tue, 11 Aug 2026 18:51:50 GMT</pubDate>
      </item></channel></rss>`;

    const articles = parseRssFeed(sampleXml, 'travel', 'TourDom', -3);
    expect(articles[0].published_at).toBe('2026-08-11T15:51:50.000Z');
  });

  it('prefers the full content over a title-like RSS description', () => {
    const sampleXml = `<?xml version="1.0"?>
      <rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item>
        <title>Короткий заголовок</title>
        <link>https://nplus1.ru/news/1</link>
        <description>Короткий заголовок</description>
        <content:encoded><![CDATA[Полный исходный текст новости с важными фактами и подробностями.]]></content:encoded>
        <pubDate>Tue, 11 Aug 2026 12:00:00 +0300</pubDate>
      </item></channel></rss>`;

    const articles = parseRssFeed(sampleXml, 'science', 'N + 1');
    expect(articles[0].original_text).toBe(
      'Полный исходный текст новости с важными фактами и подробностями.'
    );
  });
});
