'use client';

import React, { useEffect, useState, useRef } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('theme') as Theme) || 'system';
    setTheme(saved);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setIsOpen(false);
  };

  if (!mounted) {
    return <div className="theme-btn-skeleton" aria-hidden="true" />;
  }

  const getThemeTitle = () => {
    switch (theme) {
      case 'light':
        return 'Светлая тема';
      case 'dark':
        return 'Тёмная тема';
      case 'system':
        return 'Системная тема';
    }
  };

  return (
    <div className="theme-dropdown-container" ref={containerRef}>
      <button
        type="button"
        className={`theme-icon-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title={getThemeTitle()}
        aria-label={getThemeTitle()}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {theme === 'light' && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
        {theme === 'dark' && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
        {theme === 'system' && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <line x1="8" x2="16" y1="21" y2="21" />
            <line x1="12" x2="12" y1="17" y2="21" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="theme-menu-popup" role="menu" aria-label="Выбор темы">
          <button
            type="button"
            role="menuitem"
            className={`theme-menu-item ${theme === 'light' ? 'selected' : ''}`}
            onClick={() => handleSelectTheme('light')}
          >
            <span className="theme-menu-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </span>
            <span className="theme-menu-item-label">Светлая</span>
            {theme === 'light' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="theme-check-icon">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            className={`theme-menu-item ${theme === 'dark' ? 'selected' : ''}`}
            onClick={() => handleSelectTheme('dark')}
          >
            <span className="theme-menu-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </span>
            <span className="theme-menu-item-label">Тёмная</span>
            {theme === 'dark' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="theme-check-icon">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            className={`theme-menu-item ${theme === 'system' ? 'selected' : ''}`}
            onClick={() => handleSelectTheme('system')}
          >
            <span className="theme-menu-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>
            </span>
            <span className="theme-menu-item-label">Системная</span>
            {theme === 'system' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="theme-check-icon">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
