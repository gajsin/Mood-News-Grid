'use client';

import React from 'react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          <div className="logo-area">
            <div className="logo-mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19V5L12 13L20 5V19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <span className="site-title">Mood News Grid</span>
          </div>

          <div className="header-meta">
            <span className="live-status-pill">
              <span className="live-status-dot"></span>
              6 рубрик
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
