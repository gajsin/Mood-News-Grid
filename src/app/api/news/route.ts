import { NextRequest, NextResponse } from 'next/server';
import { getAllSafeArticles } from '@/lib/db/repository';
import { selectBalancedNews } from '@/lib/news/selector';
import { syncFreshRssArticles } from '@/lib/rss/sync';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeParam = searchParams.get('exclude') || '';
    const excludedIds = excludeParam
      ? excludeParam.split(',').map((id) => id.trim()).filter(Boolean)
      : [];

    // Every feed request checks live RSS first; stored articles are the fallback if a source is down.
    const liveArticles = await syncFreshRssArticles();
    const storedArticles = await getAllSafeArticles();
    const liveUrls = new Set(liveArticles.map((article) => article.source_url));
    const dataset = [
      ...liveArticles,
      ...storedArticles.filter((article) => !liveUrls.has(article.source_url)),
    ];

    if (dataset.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        news: [],
        message: 'Не удалось получить новости из RSS-лент. Проверьте сетевое подключение.',
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const cards = selectBalancedNews(dataset, excludedIds);

    return NextResponse.json(
      {
        success: true,
        count: cards.length,
        news: cards,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Ошибка получения новостей',
      },
      { status: 500 }
    );
  }
}
