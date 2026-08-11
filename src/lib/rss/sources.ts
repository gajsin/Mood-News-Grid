import { Category } from '@/types/news';

export interface RssSourceConfig {
  category: Category;
  feeds: RssFeedConfig[];
}

export interface RssFeedConfig {
  url: string;
  sourceName: string;
  utcOffsetCorrectionHours?: number;
}

export const RSS_SOURCES: RssSourceConfig[] = [
  {
    category: 'it',
    feeds: [
      { url: 'https://habr.com/ru/rss/news/?fl=ru', sourceName: 'Habr News' },
      { url: 'https://habr.com/ru/rss/all/all/?fl=ru', sourceName: 'Habr' },
      { url: 'https://3dnews.ru/news/rss/', sourceName: '3DNews' },
    ],
  },
  {
    category: 'economy',
    feeds: [
      { url: 'https://www.kommersant.ru/RSS/section-business.xml', sourceName: 'Коммерсантъ' },
      { url: 'https://www.kommersant.ru/RSS/section-economics.xml', sourceName: 'Коммерсантъ' },
    ],
  },
  {
    category: 'sport',
    feeds: [
      { url: 'https://www.championat.com/rss/news/', sourceName: 'Чемпионат' },
      { url: 'https://www.championat.com/rss/news/sport/', sourceName: 'Чемпионат' },
      { url: 'https://www.sports.ru/rss/all_news.xml', sourceName: 'Sports.ru' },
    ],
  },
  {
    category: 'science',
    feeds: [
      { url: 'https://nplus1.ru/rss', sourceName: 'N + 1' },
    ],
  },
  {
    category: 'culture',
    feeds: [
      { url: 'https://www.kommersant.ru/RSS/section-culture.xml', sourceName: 'Коммерсантъ' },
      { url: 'https://www.kommersant.ru/RSS/rubric-culture.xml', sourceName: 'Коммерсантъ' },
    ],
  },
  {
    category: 'travel',
    feeds: [
      {
        url: 'https://www.tourdom.ru/rss/',
        sourceName: 'TourDom',
        // TourDom publishes Moscow wall-clock time with a misleading GMT marker.
        utcOffsetCorrectionHours: -3,
      },
      { url: 'https://www.atorus.ru/news/rss.xml', sourceName: 'АТОР' },
    ],
  },
];
