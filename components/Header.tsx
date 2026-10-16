'use client';

import React from 'react';
import { Sun, Moon, Plus, LayoutGrid, List, BookOpen } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  viewMode: 'table' | 'cards';
  onChangeViewMode: (mode: 'table' | 'cards') => void;
  onOpenNewDoc: () => void;
  onGoHome: () => void;
  activeDocTitle?: string | null;
}

export default function Header({
  theme,
  onToggleTheme,
  viewMode,
  onChangeViewMode,
  onOpenNewDoc,
  onGoHome,
  activeDocTitle,
}: HeaderProps) {
  return (
    <header className="archive-header">
      <div className="archive-container">
        <div className="archive-header-inner">

          {/* Masthead */}
          <div className="archive-masthead" onClick={onGoHome}>
            <div className="archive-masthead-title">
              <BookOpen size={18} strokeWidth={2} />
              <span>Dolan Archives</span>
              <span className="archive-stamp">Academia</span>
            </div>
            {activeDocTitle && (
              <div className="archive-masthead-sub">
                {activeDocTitle}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="archive-header-actions">
            {/* View mode toggle — only on list */}
            {!activeDocTitle && (
              <div style={{ display: 'flex', border: '1px solid var(--border-medium)', borderRadius: 6, overflow: 'hidden' }}>
                <button
                  onClick={() => onChangeViewMode('table')}
                  className="btn-icon"
                  style={{
                    borderRadius: 0,
                    border: 'none',
                    background: viewMode === 'table' ? 'var(--bg-hover)' : 'transparent',
                    color: viewMode === 'table' ? 'var(--ink-primary)' : 'var(--ink-muted)',
                  }}
                  title="Table view"
                >
                  <List size={15} />
                </button>
                <button
                  onClick={() => onChangeViewMode('cards')}
                  className="btn-icon"
                  style={{
                    borderRadius: 0,
                    border: 'none',
                    background: viewMode === 'cards' ? 'var(--bg-hover)' : 'transparent',
                    color: viewMode === 'cards' ? 'var(--ink-primary)' : 'var(--ink-muted)',
                  }}
                  title="Card view"
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            )}

            <button onClick={onToggleTheme} className="btn-archive-secondary" title="Toggle theme">
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            <button onClick={onOpenNewDoc} className="btn-archive-primary">
              <Plus size={15} strokeWidth={2.5} />
              <span>New Document</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
