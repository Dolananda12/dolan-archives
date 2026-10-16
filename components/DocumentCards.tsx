'use client';

import React from 'react';
import { Pin, Clock, Edit3, Trash2, ArrowUpRight } from 'lucide-react';
import { ArchiveDoc } from '@/types/archive';

interface DocumentCardsProps {
  documents: ArchiveDoc[];
  onSelectDoc: (doc: ArchiveDoc) => void;
  onEditDoc: (doc: ArchiveDoc) => void;
  onDeleteDoc: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

export default function DocumentCards({
  documents,
  onSelectDoc,
  onEditDoc,
  onDeleteDoc,
  onTogglePin,
}: DocumentCardsProps) {
  if (documents.length === 0) {
    return (
      <div
        style={{
          border: '1px solid var(--border-strong)',
          padding: '48px 24px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          marginTop: '20px',
        }}
      >
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          [ NO ARCHIVAL DOCUMENTS FOUND MATCHING SEARCH CRITERIA ]
        </p>
      </div>
    );
  }

  return (
    <div className="archive-grid">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="archive-card"
          onClick={() => onSelectDoc(doc)}
        >
          <div>
            {/* Top row */}
            <div className="archive-card-top">
              <div className="archive-card-meta">
                <span className="archive-code-badge">{doc.code}</span>
                <span className="archive-subject-badge">{doc.subject}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onTogglePin(doc.id, !doc.isPinned)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  title={doc.isPinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin size={14} fill={doc.isPinned ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Title */}
            <h3 className="archive-card-title">{doc.title}</h3>
            {doc.subtitle && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '0.88rem',
                  color: 'var(--ink-secondary)',
                  marginBottom: '10px',
                }}
              >
                {doc.subtitle}
              </p>
            )}

            {/* Abstract */}
            {doc.abstract && <p className="archive-card-abstract">{doc.abstract}</p>}

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div className="archive-card-tags">
                {doc.tags.map((tag) => (
                  <span key={tag} className="archive-tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="archive-card-footer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{doc.wordCount.toLocaleString()} w</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={11} /> {doc.readingTimeMin}m
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => onEditDoc(doc)}
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Edit Document"
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remove document ${doc.code} from the archive?`)) {
                    onDeleteDoc(doc.id);
                  }
                }}
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Delete Document"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => onSelectDoc(doc)}
                className="btn-icon"
                style={{ width: '28px', height: '28px', background: 'var(--accent-invert-bg)', color: 'var(--accent-invert-ink)' }}
                title="Read Document"
              >
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
