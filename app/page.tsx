'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Pin, BookOpen, TrendingUp } from 'lucide-react';
import { ArchiveDoc, ArchiveFilterOptions } from '@/types/archive';

import Header from '@/components/Header';
import ArchiveFilters from '@/components/ArchiveFilters';
import DocumentTable from '@/components/DocumentTable';
import DocumentCards from '@/components/DocumentCards';
import DocumentReader from '@/components/DocumentReader';
import DocumentEditor from '@/components/DocumentEditor';

// ─── Types ──────────────────────────────────────────────────────────────────
type View = 'list' | 'reading' | 'editing';
type ViewMode = 'table' | 'cards';
type Theme = 'light' | 'dark';

// ─── Static fallback lists (populated from live data too) ────────────────────
const DEFAULT_SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Philosophy',
  'History',
  'Economics',
  'Literature',
  'Engineering',
];

const DEFAULT_DOC_TYPES = [
  'Research Notes',
  'Working Paper',
  'Concept Proof',
  'Literature Review',
  'Lab Log',
  'Essay',
  'Thesis Draft',
  'Problem Set',
  'Reference',
  'Annotation',
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function DolanArchivesPage() {
  // ── State ──
  const [view, setView] = useState<View>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [theme, setTheme] = useState<Theme>('dark');

  const [documents, setDocuments] = useState<ArchiveDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDoc, setSelectedDoc] = useState<ArchiveDoc | null>(null);
  const [editingDoc, setEditingDoc] = useState<ArchiveDoc | null | undefined>(undefined);
  // undefined = editor closed, null = new doc, ArchiveDoc = editing existing

  const [filters, setFilters] = useState<ArchiveFilterOptions>({
    search: '',
    sort: 'updated',
    pinnedOnly: false,
  });

  // ── Theme initialisation ──
  useEffect(() => {
    const saved = localStorage.getItem('dolan-archives-theme') as Theme | null;
    const initial: Theme = saved || 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  // ── View-mode initialisation ──
  useEffect(() => {
    const saved = localStorage.getItem('dolan-archives-viewmode') as ViewMode | null;
    if (saved) setViewMode(saved);
  }, []);

  // ── Fetch documents ──
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.subject && filters.subject !== 'ALL') params.set('subject', filters.subject);
      if (filters.docType && filters.docType !== 'ALL') params.set('docType', filters.docType);
      if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters.pinnedOnly) params.set('pinnedOnly', 'true');
      if (filters.sort) params.set('sort', filters.sort);

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ── Derived: unique subjects + doc types from live data ──
  const liveSubjects = useMemo(() => {
    const s = new Set(documents.map((d) => d.subject).filter(Boolean));
    return Array.from(s).sort();
  }, [documents]);

  const liveDocTypes = useMemo(() => {
    const s = new Set(documents.map((d) => d.docType).filter(Boolean));
    return Array.from(s).sort();
  }, [documents]);

  const subjects = liveSubjects.length ? liveSubjects : DEFAULT_SUBJECTS;
  const docTypes = liveDocTypes.length ? liveDocTypes : DEFAULT_DOC_TYPES;

  // ── Stats ──
  const stats = useMemo(() => {
    // always use unfiltered count — filters only affect what's displayed
    const pinned = documents.filter((d) => d.isPinned).length;
    const uniqueSubjects = new Set(documents.map((d) => d.subject)).size;
    const totalWords = documents.reduce((sum, d) => sum + (d.wordCount || 0), 0);
    return { total: documents.length, pinned, uniqueSubjects, totalWords };
  }, [documents]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dolan-archives-theme', next);
  };

  const handleChangeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dolan-archives-viewmode', mode);
  };

  const handleGoHome = () => {
    setView('list');
    setSelectedDoc(null);
    setEditingDoc(undefined);
  };

  const handleOpenNewDoc = () => {
    setEditingDoc(null); // null = new document
    setView('editing');
  };

  const handleSelectDoc = (doc: ArchiveDoc) => {
    setSelectedDoc(doc);
    setView('reading');
  };

  const handleEditDoc = (doc: ArchiveDoc) => {
    setEditingDoc(doc);
    setView('editing');
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      if (view === 'reading' && selectedDoc?.id === id) {
        setView('list');
        setSelectedDoc(null);
      }
      await fetchDocuments();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error('Failed to update pin');
      // Optimistically update both lists and the selectedDoc
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, isPinned } : d)));
      if (selectedDoc?.id === id) setSelectedDoc((prev) => (prev ? { ...prev, isPinned } : prev));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSaveDoc = async (docData: Partial<ArchiveDoc>) => {
    const isNew = !editingDoc;
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/documents' : `/api/documents/${editingDoc!.id}`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `Server error ${res.status}`);
    }
    const saved: ArchiveDoc = await res.json();
    await fetchDocuments();
    // After save, open reader on the saved doc
    setSelectedDoc(saved);
    setEditingDoc(undefined);
    setView('reading');
  };

  const handleCloseEditor = () => {
    setEditingDoc(undefined);
    setView(selectedDoc ? 'reading' : 'list');
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  // EDITOR — full-screen, no header overlay
  if (view === 'editing') {
    return (
      <DocumentEditor
        initialDoc={editingDoc ?? null}
        onSave={handleSaveDoc}
        onClose={handleCloseEditor}
        subjects={subjects}
        docTypes={docTypes}
      />
    );
  }

  return (
    <div className="archive-root">
      {/* ── Header ── */}
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        viewMode={viewMode}
        onChangeViewMode={handleChangeViewMode}
        onOpenNewDoc={handleOpenNewDoc}
        onGoHome={handleGoHome}
        activeDocTitle={view === 'reading' && selectedDoc ? selectedDoc.title : null}
      />

      {/* ── READER VIEW ── */}
      {view === 'reading' && selectedDoc && (
        <DocumentReader
          doc={selectedDoc}
          onBack={handleGoHome}
          onEdit={handleEditDoc}
          onDelete={handleDeleteDoc}
          onTogglePin={handleTogglePin}
        />
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <main>
          {/* Stats Strip — full width */}
          <div className="archive-stats-strip">
            <div className="archive-container" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="archive-stat-item">
                <FileText size={14} />
                <span className="archive-stat-value">{stats.total}</span>
                <span className="archive-stat-label">documents</span>
              </div>
              <div className="archive-stat-divider" />
              <div className="archive-stat-item">
                <Pin size={13} fill="currentColor" />
                <span className="archive-stat-value">{stats.pinned}</span>
                <span className="archive-stat-label">pinned</span>
              </div>
              <div className="archive-stat-divider" />
              <div className="archive-stat-item">
                <BookOpen size={14} />
                <span className="archive-stat-value">{stats.uniqueSubjects}</span>
                <span className="archive-stat-label">subjects</span>
              </div>
              <div className="archive-stat-divider" />
              <div className="archive-stat-item">
                <TrendingUp size={14} />
                <span className="archive-stat-value">{stats.totalWords.toLocaleString()}</span>
                <span className="archive-stat-label">words</span>
              </div>
            </div>
          </div>

          {/* Filters — full width */}
          <div style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-medium)', padding: '12px 0' }}>
            <div className="archive-container">
              <ArchiveFilters
                filters={filters}
                onChangeFilters={setFilters}
                subjects={subjects}
                docTypes={docTypes}
                totalResults={documents.length}
              />
            </div>
          </div>

          {/* Document list */}
          <div className="archive-container" style={{ paddingTop: 20, paddingBottom: 60 }}>
            {/* Error */}
            {error && (
              <div style={{ padding: '16px', border: '1px solid var(--border-medium)', borderRadius: 8, background: 'var(--bg-primary)', fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
                ⚠ {error}{' '}
                <button onClick={fetchDocuments} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'var(--ink-primary)' }}>
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && !error && (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                Loading documents…
              </div>
            )}

            {/* Documents */}
            {!loading && !error && (
              viewMode === 'table' ? (
                <DocumentTable
                  documents={documents}
                  onSelectDoc={handleSelectDoc}
                  onEditDoc={handleEditDoc}
                  onDeleteDoc={handleDeleteDoc}
                  onTogglePin={handleTogglePin}
                />
              ) : (
                <DocumentCards
                  documents={documents}
                  onSelectDoc={handleSelectDoc}
                  onEditDoc={handleEditDoc}
                  onDeleteDoc={handleDeleteDoc}
                  onTogglePin={handleTogglePin}
                />
              )
            )}
          </div>
        </main>
      )}
    </div>
  );
}


