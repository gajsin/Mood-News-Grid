import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { Article } from '@/types/news';

let sqlClient: NeonQueryFunction<false, false> | null = null;

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface LocalStore {
  articles: Article[];
}

function readLocalStore(): LocalStore {
  if (!fs.existsSync(STORE_PATH)) {
    return { articles: [] };
  }
  try {
    const content = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(content) as Partial<LocalStore>;
    return { articles: Array.isArray(parsed.articles) ? parsed.articles : [] };
  } catch {
    return { articles: [] };
  }
}

function getLocalStore(): LocalStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: LocalStore = { articles: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  return readLocalStore();
}

function saveLocalStore(store: LocalStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export function isNeonConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.startsWith('postgres') && !url.includes('sample-123456'));
}

export function getDb() {
  if (isNeonConfigured()) {
    if (!sqlClient) {
      sqlClient = neon(process.env.DATABASE_URL!);
    }
    return { type: 'neon' as const, sql: sqlClient };
  }
  if (process.env.VERCEL) {
    return { type: 'local-readonly' as const, getStore: readLocalStore };
  }
  return { type: 'local' as const, getStore: getLocalStore, saveStore: saveLocalStore };
}

export async function initDbSchema(): Promise<void> {
  const db = getDb();
  if (db.type === 'neon') {
    await db.sql`
      CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(64) PRIMARY KEY,
        category VARCHAR(32) NOT NULL,
        original_title TEXT NOT NULL,
        original_text TEXT NOT NULL,
        source_name VARCHAR(128) NOT NULL,
        source_url TEXT NOT NULL UNIQUE,
        published_at TIMESTAMPTZ NOT NULL,
        content_hash VARCHAR(64) NOT NULL UNIQUE,
        safety_status VARCHAR(16) NOT NULL DEFAULT 'safe',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
  }
}
