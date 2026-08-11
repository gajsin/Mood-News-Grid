'use client';

import React from 'react';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export function RefreshButton({ onRefresh, isLoading }: RefreshButtonProps) {
  return (
    <div className="pagination-wrapper">
      <button
        type="button"
        className={`linear-button ${isLoading ? 'loading' : ''}`}
        onClick={onRefresh}
        disabled={isLoading}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="button-icon"
        >
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
        <span>{isLoading ? 'Обновление ленты...' : 'Показать другие новости'}</span>
      </button>
    </div>
  );
}
