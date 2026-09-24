'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  NewsCard,
  Mood,
  CATEGORIES_CONFIG,
  MOODS,
  MOODS_CONFIG,
  PROMPT_VERSION,
  Rewrite,
} from '@/types/news';

interface NewsModalProps {
  card: NewsCard | null;
  onClose: () => void;
}

function getStorageKey(articleId: string, contentHash: string) {
  return `mng_user_versions_${articleId}_${contentHash}`;
}

export function NewsModal({ card, onClose }: NewsModalProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [createdVersions, setCreatedVersions] = useState<Partial<Record<Mood, Rewrite>>>({});
  const [loadingMoods, setLoadingMoods] = useState<Partial<Record<Mood, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<Mood, string>>>({});
  const activeRequestsRef = useRef<Partial<Record<Mood, AbortController>>>({});

  // Cleanup all pending requests on unmount
  useEffect(() => {
    return () => {
      Object.values(activeRequestsRef.current).forEach((ctrl) => ctrl?.abort());
      activeRequestsRef.current = {};
    };
  }, []);

  // Load personal versions from user's localStorage when opening a card
  useEffect(() => {
    Object.values(activeRequestsRef.current).forEach((ctrl) => ctrl?.abort());
    activeRequestsRef.current = {};
    setErrors({});
    setLoadingMoods({});

    if (!card) {
      setSelectedMood(null);
      setCreatedVersions({});
      return;
    }

    const cachedVersions: Partial<Record<Mood, Rewrite>> = {};
    try {
      const savedRaw = localStorage.getItem(getStorageKey(card.id, card.content_hash));
      const parsed = savedRaw
        ? JSON.parse(savedRaw) as Partial<Record<Mood, Rewrite>>
        : {};
      for (const mood of MOODS) {
        const rewrite = parsed[mood];
        if (
          rewrite?.article_id === card.id
          && rewrite.fact_check_status === 'passed'
          && rewrite.prompt_version === PROMPT_VERSION
        ) {
          cachedVersions[mood] = rewrite;
        }
      }
    } catch {
      // Ignore invalid or unavailable localStorage.
    }

    setCreatedVersions(cachedVersions);
    setSelectedMood(MOODS.find((mood) => cachedVersions[mood]) ?? null);
  }, [card]);

  const generateRewrite = useCallback(async (
    articleId: string,
    contentHash: string,
    mood: Mood
  ) => {
    // Abort previous in-flight request only for THIS specific mood if re-triggered
    activeRequestsRef.current[mood]?.abort();
    const controller = new AbortController();
    activeRequestsRef.current[mood] = controller;

    setLoadingMoods((prev) => ({ ...prev, [mood]: true }));
    setErrors((prev) => ({ ...prev, [mood]: undefined }));

    try {
      const response = await fetch(`/api/news/${articleId}/rewrite?mood=${mood}`, {
        method: 'POST',
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Ошибка запроса: ${response.statusText}`);
      }
      if (data.success && data.rewrite?.fact_check_status === 'passed') {
        setCreatedVersions((prev) => {
          const updated = {
            ...prev,
            [mood]: data.rewrite,
          };
          try {
            localStorage.setItem(getStorageKey(articleId, contentHash), JSON.stringify(updated));
          } catch {
            // Ignore localStorage quota errors
          }
          return updated;
        });
      } else {
        throw new Error(data.error || 'Не удалось адаптировать текст');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setErrors((prev) => ({
        ...prev,
        [mood]: err instanceof Error ? err.message : 'Не удалось загрузить версию',
      }));
    } finally {
      if (activeRequestsRef.current[mood] === controller) {
        delete activeRequestsRef.current[mood];
        setLoadingMoods((prev) => ({ ...prev, [mood]: false }));
      }
    }
  }, []);

  const handleSelectMood = (mood: Mood) => {
    setSelectedMood(mood);
    if (card && !createdVersions[mood] && !loadingMoods[mood]) {
      generateRewrite(card.id, card.content_hash, mood);
    }
  };

  const handleRegenerate = () => {
    if (card && selectedMood && !loadingMoods[selectedMood]) {
      generateRewrite(card.id, card.content_hash, selectedMood);
    }
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!card) return null;

  const categoryMeta = CATEGORIES_CONFIG[card.category];
  const isCurrentMoodLoading = selectedMood ? !!loadingMoods[selectedMood] : false;
  const currentMoodError = selectedMood ? errors[selectedMood] : null;
  const activeRewrite = selectedMood ? createdVersions[selectedMood] : null;

  const formattedDate = new Date(card.published_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Новость: ${card.original_title}`}
      >
        <div className="modal-panel-header">
          <div className="modal-panel-meta">
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

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-panel-body">
          {/* Left Column: Original */}
          <div className="modal-column original-column">
            <div className="column-label-bar">
              <span className="column-label">Оригинал</span>
            </div>

            <h3 className="modal-headline">{card.original_title}</h3>
            <p className="modal-text">{card.original_text}</p>

            <div className="modal-source-action">
              <a
                href={card.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                <span>Читать в источнике</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: Mood Selection or Rewritten Version */}
          <div className="modal-column rewritten-column">
            {selectedMood === null ? (
              /* State 1: Prompt to select mood */
              <div className="mood-prompt-box">
                <div className="mood-prompt-header">
                  <h4 className="mood-prompt-title">Как вы хотите прочитать эту новость?</h4>
                  <p className="mood-prompt-sub">Выберите настроение для адаптации текста</p>
                </div>

                <div className="mood-choice-grid">
                  {MOODS.map((m) => {
                    const meta = MOODS_CONFIG[m];
                    return (
                      <button
                        key={m}
                        type="button"
                        className="mood-choice-button"
                        onClick={() => handleSelectMood(m)}
                      >
                        <span className="choice-label">{meta.labelRu}</span>
                        <span className="choice-desc">{meta.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* State 2: Mood is selected — show switcher, loading or generated content */
              <>
                <div className="column-label-bar">
                  <span className="column-label">Адаптированный текст</span>
                  {activeRewrite && !isCurrentMoodLoading && (
                    <button
                      type="button"
                      className="regenerate-link"
                      onClick={handleRegenerate}
                      title="Сгенерировать ещё один вариант в этом настроении"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      <span>Ещё вариант</span>
                    </button>
                  )}
                </div>

                {/* Compact Segmented Switcher for Created / Available Moods */}
                <div className="modal-segmented-control" role="tablist" aria-label="Настроение текста">
                  {MOODS.map((m) => {
                    const isSelected = m === selectedMood;
                    const isCreated = !!createdVersions[m];
                    const isMoodLoading = !!loadingMoods[m];
                    const meta = MOODS_CONFIG[m];
                    return (
                      <button
                        key={m}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        className={`modal-segmented-tab ${isSelected ? 'active' : ''} ${isCreated ? 'has-version' : ''}`}
                        onClick={() => handleSelectMood(m)}
                      >
                        <span>{meta.labelRu}</span>
                        {isMoodLoading ? (
                          <span className="tab-loading-spinner" title="Генерация..." />
                        ) : isCreated ? (
                          <span className="tab-created-dot" title="Ваша версия сохранена" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {/* Content Area */}
                {isCurrentMoodLoading ? (
                  <div className="linear-loading-state">
                    <div className="linear-progress-track">
                      <div className="linear-progress-bar"></div>
                    </div>
                    <span className="linear-loading-caption">Адаптация текста...</span>
                    <div className="skeleton-block">
                      <div className="skeleton-row headline-skeleton"></div>
                      <div className="skeleton-row"></div>
                      <div className="skeleton-row"></div>
                      <div className="skeleton-row short"></div>
                    </div>
                  </div>
                ) : currentMoodError ? (
                  <div className="linear-error-box">
                    <p className="error-text">{currentMoodError}</p>
                    <button
                      type="button"
                      className="retry-button"
                      onClick={handleRegenerate}
                    >
                      Повторить запрос
                    </button>
                  </div>
                ) : activeRewrite ? (
                  <div className="rewrite-content-wrap">
                    <h3 className="modal-headline">{activeRewrite.rewritten_title}</h3>
                    <p className="modal-text">{activeRewrite.rewritten_text}</p>

                    <div className="fact-verification-badge">
                      <span className="verification-dot"></span>
                      <span className="verification-text">Факты, даты и числа сохранены</span>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
