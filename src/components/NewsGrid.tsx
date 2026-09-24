'use client';

import React from 'react';
import { NewsCard as NewsCardType } from '@/types/news';
import { NewsCard } from './NewsCard';

interface NewsGridProps {
  cards: NewsCardType[];
  onCardClick: (card: NewsCardType) => void;
  isLoading: boolean;
}

export function NewsGrid({ cards, onCardClick, isLoading }: NewsGridProps) {
  if (!cards || cards.length === 0) {
    return (
      <div className="empty-state-box">
        <p className="empty-state-title">
          {isLoading ? 'Загрузка новостной ленты...' : 'Новостей пока нет'}
        </p>
        <p className="empty-state-sub">
          {isLoading ? 'Получение свежих публикаций' : 'Попробуйте обновить страницу позже'}
        </p>
      </div>
    );
  }

  return (
    <section className="news-grid-section">
      <div className="linear-cards-grid">
        {cards.map((card) => (
          <NewsCard
            key={card.id}
            card={card}
            onClick={onCardClick}
          />
        ))}
      </div>
    </section>
  );
}
