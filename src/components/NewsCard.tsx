'use client';

import React from 'react';
import { NewsCard as NewsCardType, CATEGORIES_CONFIG } from '@/types/news';

interface NewsCardProps {
  card: NewsCardType;
  onClick: (card: NewsCardType) => void;
}

export function NewsCard({ card, onClick }: NewsCardProps) {
  const categoryMeta = CATEGORIES_CONFIG[card.category];

  const formattedDate = new Date(card.published_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article
      className="news-card"
      role="button"
      tabIndex={0}
      onClick={() => onClick(card)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(card);
        }
      }}
    >
      <div className="news-card-body">
        <div className="news-card-meta">
          <span className="card-category">
            <span
              className="category-indicator-dot"
              style={{ backgroundColor: categoryMeta.color }}
            />
            {categoryMeta.nameRu}
          </span>
          <span className="meta-separator">·</span>
          <span className="card-source">{card.source_name}</span>
          <span className="meta-separator">·</span>
          <time className="card-time" dateTime={card.published_at}>{formattedDate}</time>
        </div>

        <h3 className="card-headline">{card.original_title}</h3>
        <p className="card-summary">{card.original_text}</p>
      </div>

      <div className="news-card-footer">
        <span className="card-action-hint">
          Прочитать иначе
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-arrow-icon">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </article>
  );
}
