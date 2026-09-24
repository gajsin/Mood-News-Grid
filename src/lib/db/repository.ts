import { Article, Category } from '@/types/news';
import { hasUsableArticleBody } from '@/lib/rss/content-filter';
import { getDb } from './index';

function mapArticleRow(row: any): Article {
  return {
    id: row.id,
    category: row.category as Category,
    original_title: row.original_title,
    original_text: row.original_text,
    source_name: row.source_name,
    source_url: row.source_url,
    published_at: new Date(row.published_at).toISOString(),
    content_hash: row.content_hash,
    safety_status: row.safety_status,
    created_at: new Date(row.created_at).toISOString(),
  };
}

export async function saveArticle(article: Article): Promise<void> {
  const db = getDb();
  if (db.type === 'neon') {
    await db.sql`
      INSERT INTO articles (
        id, category, original_title, original_text, source_name,
        source_url, published_at, content_hash, safety_status, created_at
      ) VALUES (
        ${article.id}, ${article.category}, ${article.original_title},
        ${article.original_text}, ${article.source_name}, ${article.source_url},
        ${article.published_at}, ${article.content_hash}, ${article.safety_status},
        ${article.created_at}
      )
      ON CONFLICT (source_url) DO UPDATE SET
        original_title = EXCLUDED.original_title,
        original_text = EXCLUDED.original_text,
        source_name = EXCLUDED.source_name,
        published_at = EXCLUDED.published_at,
        content_hash = EXCLUDED.content_hash,
        safety_status = EXCLUDED.safety_status;
    `;
    return;
  }

  if (db.type === 'local-readonly') {
    return;
  }

  const store = db.getStore();
  const existingIndex = store.articles.findIndex(
    (saved) => saved.id === article.id || saved.source_url === article.source_url
  );
  if (existingIndex >= 0) {
    const existing = store.articles[existingIndex];
    store.articles[existingIndex] = {
      ...article,
      id: existing.id,
      created_at: existing.created_at,
    };
  } else {
    store.articles.push(article);
  }
  db.saveStore(store);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const db = getDb();
  if (db.type === 'neon') {
    const rows = await db.sql`
      SELECT * FROM articles WHERE id = ${id} LIMIT 1;
    `;
    return rows.length > 0 ? mapArticleRow(rows[0]) : null;
  }

  return db.getStore().articles.find((article) => article.id === id) || null;
}

export async function getAllSafeArticles(): Promise<Article[]> {
  const db = getDb();
  if (db.type === 'neon') {
    const rows = await db.sql`
      SELECT * FROM articles
      WHERE safety_status = 'safe'
        AND NULLIF(TRIM(original_text), '') IS NOT NULL
        AND TRIM(original_text) <> TRIM(original_title)
      ORDER BY published_at DESC;
    `;
    return rows.map(mapArticleRow);
  }

  return db.getStore().articles.filter(
    (article) =>
      article.safety_status === 'safe' &&
      hasUsableArticleBody(article.original_title, article.original_text)
  );
}
