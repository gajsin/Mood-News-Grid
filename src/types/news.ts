export const CATEGORIES = ['it', 'economy', 'sport', 'science', 'culture', 'travel'] as const;
export type Category = (typeof CATEGORIES)[number];

export const MOODS = ['neutral', 'joyful', 'sad', 'ironic', 'surprised'] as const;
export type Mood = (typeof MOODS)[number];
export const PROMPT_VERSION = 'v3.0-simple';

export interface CategoryMeta {
  id: Category;
  nameRu: string;
  color: string;
}

export interface MoodMeta {
  id: Mood;
  labelRu: string;
  description: string;
}

export interface Article {
  id: string;
  category: Category;
  original_title: string;
  original_text: string;
  source_name: string;
  source_url: string;
  published_at: string;
  content_hash: string;
  safety_status: 'safe' | 'rejected';
  created_at: string;
}

export interface Rewrite {
  id: string;
  article_id: string;
  mood: Mood;
  rewritten_title: string;
  rewritten_text: string;
  model: string;
  prompt_version: string;
  fact_check_status: 'passed' | 'failed';
  fact_check_details: FactCheckResult;
  created_at: string;
}

export interface FactCheckResult {
  passed: boolean;
  preservedNumbers: boolean;
  preservedQuotes: boolean;
  preservedDates: boolean;
  score: number;
  mismatches?: string[];
  checkedAt?: string;
}

export interface NewsCard {
  id: string;
  category: Category;
  source_name: string;
  source_url: string;
  published_at: string;
  original_title: string;
  original_text: string;
  content_hash: string;
}

export const CATEGORIES_CONFIG: Record<Category, CategoryMeta> = {
  it: {
    id: 'it',
    nameRu: 'Технологии',
    color: '#2563eb',
  },
  economy: {
    id: 'economy',
    nameRu: 'Экономика',
    color: '#0284c7',
  },
  sport: {
    id: 'sport',
    nameRu: 'Спорт',
    color: '#ea580c',
  },
  science: {
    id: 'science',
    nameRu: 'Наука',
    color: '#7c3aed',
  },
  culture: {
    id: 'culture',
    nameRu: 'Культура',
    color: '#db2777',
  },
  travel: {
    id: 'travel',
    nameRu: 'Путешествия',
    color: '#059669',
  },
};

export const MOODS_CONFIG: Record<Mood, MoodMeta> = {
  neutral: {
    id: 'neutral',
    labelRu: 'Нейтрально',
    description: 'Фактический, сдержанный и объективный стиль',
  },
  joyful: {
    id: 'joyful',
    labelRu: 'Радостно',
    description: 'Позитивный, вдохновляющий и энергичный тон',
  },
  sad: {
    id: 'sad',
    labelRu: 'Грустно',
    description: 'Меланхоличный и задумчивый стиль',
  },
  ironic: {
    id: 'ironic',
    labelRu: 'Иронично',
    description: 'Остроумный, тонкий сарказм и скепсис',
  },
  surprised: {
    id: 'surprised',
    labelRu: 'Удивлённо',
    description: 'Интригующий, восторженный и сенсационный тон',
  },
};
