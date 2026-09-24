'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NewsCard as NewsCardType } from '@/types/news';
import { Header } from '@/components/Header';
import { CategoryLegend } from '@/components/CategoryLegend';
import { NewsGrid } from '@/components/NewsGrid';
import { NewsModal } from '@/components/NewsModal';
import { RefreshButton } from '@/components/RefreshButton';

export default function HomePage() {
  const [cards, setCards] = useState<NewsCardType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | NewsCardType['category']>('all');
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [selectedCard, setSelectedCard] = useState<NewsCardType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsBatch = useCallback(async (excludeList: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const excludeParam = excludeList.length > 0
        ? `?exclude=${encodeURIComponent(excludeList.join(','))}`
        : '';
      const response = await fetch(`/api/news${excludeParam}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.news)) {
        setCards(data.news);
        const newCardIds = data.news.map((c: NewsCardType) => c.id);
        setSeenIds((prev) => Array.from(new Set([...prev, ...newCardIds])));
        if (data.news.length === 0) {
          setError(data.message || 'Новости пока недоступны');
        }
      } else {
        setError(data.message || data.error || 'Не удалось получить новости');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewsBatch([]);
  }, [fetchNewsBatch]);

  const handleRefresh = () => {
    fetchNewsBatch(seenIds);
  };

  const categoryCounts = cards.reduce<Record<string, number>>((acc, card) => {
    acc[card.category] = (acc[card.category] || 0) + 1;
    return acc;
  }, {});

  const displayedCards = selectedCategory === 'all'
    ? cards
    : cards.filter((c) => c.category === selectedCategory);

  return (
    <div className="page-wrapper">
      <Header />

      <main className="container">
        <div className="controls-panel">
          <CategoryLegend
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </div>

        {error && (
          <div className="page-error-banner">
            <span>{error}</span>
          </div>
        )}

        <NewsGrid
          cards={displayedCards}
          onCardClick={(card) => setSelectedCard(card)}
          isLoading={isLoading}
        />

        {cards.length > 0 && (
          <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
        )}
      </main>

      <NewsModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>Mood News Grid — Новостная лента с адаптацией тона публикаций</span>
          <span>Оригинальный источник указан в каждой карточке</span>
        </div>
      </footer>
    </div>
  );
}
