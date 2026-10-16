'use client';

import React from 'react';
import { Search, X, Pin } from 'lucide-react';
import { ArchiveFilterOptions } from '@/types/archive';

interface ArchiveFiltersProps {
  filters: ArchiveFilterOptions;
  onChangeFilters: (filters: ArchiveFilterOptions) => void;
  subjects: string[];
  docTypes: string[];
  totalResults: number;
}

export default function ArchiveFilters({
  filters,
  onChangeFilters,
  subjects,
  docTypes,
  totalResults,
}: ArchiveFiltersProps) {
  const currentSubject = filters.subject || 'ALL';
  const currentDocType = filters.docType || 'ALL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Search row */}
      <div className="archive-search-row">
        <div className="archive-search-box">
          <Search size={15} className="archive-search-icon" />
          <input
            type="text"
            placeholder="Search by title, keyword, or archive code…"
            value={filters.search || ''}
            onChange={(e) => onChangeFilters({ ...filters, search: e.target.value })}
            className="archive-search-input"
          />
          {filters.search && (
            <button
              onClick={() => onChangeFilters({ ...filters, search: '' })}
              style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={filters.sort || 'updated'}
          onChange={(e) => onChangeFilters({ ...filters, sort: e.target.value as any })}
          className="gdoc-select"
          style={{ border: '1px solid var(--border-medium)', borderRadius: 6, padding: '7px 10px', height: 'auto', background: 'var(--bg-primary)' }}
        >
          <option value="updated">Recently updated</option>
          <option value="created">Date archived</option>
          <option value="code">Archive code</option>
          <option value="title">Title A–Z</option>
        </select>

        {/* Pinned toggle */}
        <button
          onClick={() => onChangeFilters({ ...filters, pinnedOnly: !filters.pinnedOnly })}
          className={`archive-pill ${filters.pinnedOnly ? 'active' : ''}`}
          style={{ height: 36, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <Pin size={12} fill={filters.pinnedOnly ? 'currentColor' : 'none'} />
          Pinned only
        </button>
      </div>

      {/* Subject pills */}
      <div className="archive-pills-row">
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginRight: 4, fontWeight: 500 }}>Subject:</span>
        <button
          onClick={() => onChangeFilters({ ...filters, subject: 'ALL' })}
          className={`archive-pill ${currentSubject === 'ALL' ? 'active' : ''}`}
        >All</button>
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => onChangeFilters({ ...filters, subject: sub })}
            className={`archive-pill ${currentSubject === sub ? 'active' : ''}`}
          >{sub}</button>
        ))}
      </div>

      {/* DocType pills + results count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div className="archive-pills-row" style={{ paddingBottom: 0 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginRight: 4, fontWeight: 500 }}>Type:</span>
          <button
            onClick={() => onChangeFilters({ ...filters, docType: 'ALL' })}
            className={`archive-pill ${currentDocType === 'ALL' ? 'active' : ''}`}
          >All</button>
          {docTypes.map((dt) => (
            <button
              key={dt}
              onClick={() => onChangeFilters({ ...filters, docType: dt })}
              className={`archive-pill ${currentDocType === dt ? 'active' : ''}`}
            >{dt}</button>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
          {totalResults} document{totalResults !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
