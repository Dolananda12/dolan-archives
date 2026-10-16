'use client';

import React from 'react';
import { Pin, Clock, FileText, ArrowRight, Trash2, Edit3 } from 'lucide-react';
import { ArchiveDoc } from '@/types/archive';

interface DocumentTableProps {
  documents: ArchiveDoc[];
  onSelectDoc: (doc: ArchiveDoc) => void;
  onEditDoc: (doc: ArchiveDoc) => void;
  onDeleteDoc: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

export default function DocumentTable({
  documents,
  onSelectDoc,
  onEditDoc,
  onDeleteDoc,
  onTogglePin,
}: DocumentTableProps) {
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
    <div className="archive-table-container">
      <table className="archive-catalogue-table">
        <thead>
          <tr>
            <th style={{ width: '130px' }}>CODE</th>
            <th>DOCUMENT TITLE &amp; ABSTRACT</th>
            <th style={{ width: '170px' }}>SUBJECT &amp; TYPE</th>
            <th style={{ width: '130px' }}>METRICS</th>
            <th style={{ width: '120px' }}>UPDATED</th>
            <th style={{ width: '110px', textAlign: 'center' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="archive-catalogue-row"
              onClick={() => onSelectDoc(doc)}
            >
              {/* Code + Pin */}
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {doc.isPinned && (
                    <Pin size={12} fill="currentColor" className="archive-pin-icon" />
                  )}
                  <span className="archive-catalogue-code">{doc.code}</span>
                </div>
              </td>

              {/* Title & Abstract */}
              <td>
                <div className="archive-catalogue-title">{doc.title}</div>
                {doc.subtitle && (
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: '0.84rem',
                      color: 'var(--ink-secondary)',
                      marginTop: '2px',
                    }}
                  >
                    {doc.subtitle}
                  </div>
                )}
                {doc.abstract && <div className="archive-catalogue-desc">{doc.abstract}</div>}
                {doc.tags && doc.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="archive-tag-pill">
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="archive-tag-pill">+{doc.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </td>

              {/* Subject & DocType */}
              <td>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700 }}>
                  {doc.subject}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--ink-muted)',
                    textTransform: 'uppercase',
                    marginTop: '2px',
                  }}
                >
                  {doc.docType}
                </div>
              </td>

              {/* Metrics */}
              <td>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-secondary)' }}>
                  {doc.wordCount.toLocaleString()} words
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--ink-muted)',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} />
                  <span>{doc.readingTimeMin} min read</span>
                </div>
              </td>

              {/* Updated date */}
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                {new Date(doc.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>

              {/* Actions */}
              <td onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <button
                    onClick={() => onTogglePin(doc.id, !doc.isPinned)}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                    title={doc.isPinned ? 'Unpin Document' : 'Pin to Top'}
                  >
                    <Pin size={13} fill={doc.isPinned ? 'currentColor' : 'none'} />
                  </button>
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
