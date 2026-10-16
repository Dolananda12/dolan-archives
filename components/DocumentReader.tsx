'use client';

import React from 'react';
import {
  ArrowLeft, Edit3, Printer, Pin, Clock, Trash2,
} from 'lucide-react';
import { ArchiveDoc } from '@/types/archive';

interface DocumentReaderProps {
  doc: ArchiveDoc;
  onBack: () => void;
  onEdit: (doc: ArchiveDoc) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

export default function DocumentReader({
  doc,
  onBack,
  onEdit,
  onDelete,
  onTogglePin,
}: DocumentReaderProps) {

  const handleDelete = () => {
    if (confirm(`Remove "${doc.title}" from the archive?`)) {
      onDelete(doc.id);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="reader-shell">

      {/* Action bar */}
      <div className="reader-actionbar">
        <button className="gdoc-btn-icon" onClick={onBack} title="Back to archive">
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }} />

        <button
          className="gdoc-btn-icon"
          onClick={() => onTogglePin(doc.id, !doc.isPinned)}
          title={doc.isPinned ? 'Unpin' : 'Pin document'}
        >
          <Pin size={16} fill={doc.isPinned ? 'currentColor' : 'none'} />
        </button>
        <button className="gdoc-btn-icon" onClick={handlePrint} title="Print / Save as PDF">
          <Printer size={16} />
        </button>
        <button className="gdoc-btn-icon" onClick={() => onEdit(doc)} title="Edit document">
          <Edit3 size={16} />
        </button>
        <button
          className="gdoc-btn-icon gdoc-btn-danger"
          onClick={handleDelete}
          title="Delete document"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Document page */}
      <div className="reader-page-wrap">
        <div className="reader-page">

          {/* Header */}
          <div className="reader-doc-header">
            <div className="reader-meta-row">
              <span className="reader-code">{doc.code}</span>
              <span className="reader-subject">{doc.subject}</span>
              <span className="reader-doctype">{doc.docType}</span>
              {doc.isPinned && <Pin size={12} fill="currentColor" style={{ color: 'var(--ink-muted)' }} />}
            </div>
            <h1 className="reader-title">{doc.title}</h1>
            {doc.subtitle && <p className="reader-subtitle">{doc.subtitle}</p>}
            {doc.abstract && (
              <blockquote className="reader-abstract">{doc.abstract}</blockquote>
            )}
            <div className="reader-stats-row">
              <span>{doc.wordCount?.toLocaleString()} words</span>
              <span>·</span>
              <Clock size={12} />
              <span>{doc.readingTimeMin} min read</span>
              <span>·</span>
              <span>Updated {new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {doc.tags && doc.tags.length > 0 && (
              <div className="reader-tags">
                {doc.tags.map((tag) => (
                  <span key={tag} className="archive-tag-pill">{tag}</span>
                ))}
              </div>
            )}
            <hr className="reader-divider" />
          </div>

          {/* Content — rendered as HTML from editor */}
          <div
            className="reader-content"
            dangerouslySetInnerHTML={{ __html: doc.content || '' }}
          />
        </div>
      </div>
    </div>
  );
}
