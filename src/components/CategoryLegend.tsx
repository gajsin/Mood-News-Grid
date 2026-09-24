'use client';

import React from 'react';
import { CATEGORIES, CATEGORIES_CONFIG, Category } from '@/types/news';

export type CategoryFilterValue = Category | 'all';

interface CategoryLegendProps {
  selectedCategory: CategoryFilterValue;
  onSelectCategory: (category: CategoryFilterValue) => void;
  categoryCounts?: Record<string, number>;
}

export function CategoryLegend({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: CategoryLegendProps) {
  const totalCount = categoryCounts
    ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
    : undefined;

  return (
    <nav className="category-bar" aria-label="Фильтр по рубрикам">
      <span className="category-bar-label">Рубрики:</span>
      <div className="category-chips-list" role="group" aria-label="Выбор рубрики">
        <button
          type="button"
          className={`category-tag ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
          aria-pressed={selectedCategory === 'all'}
        >
          <span>Все</span>
          {typeof totalCount === 'number' && totalCount > 0 && (
            <span className="category-chip-count">{totalCount}</span>
          )}
        </button>

        {CATEGORIES.map((cat) => {
          const meta = CATEGORIES_CONFIG[cat];
          const count = categoryCounts?.[cat];
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              className={`category-tag ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
              aria-pressed={isActive}
            >
              <span
                className="category-indicator-dot"
                style={{ backgroundColor: meta.color }}
              />
              <span>{meta.nameRu}</span>
              {typeof count === 'number' && count > 0 && (
                <span className="category-chip-count">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
