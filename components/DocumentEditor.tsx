'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered,
  Heading1, Heading2, Heading3,
  Save, X, ChevronDown, Loader2,
} from 'lucide-react';
import { ArchiveDoc, DocType, DocStatus } from '@/types/archive';

interface DocumentEditorProps {
  initialDoc?: ArchiveDoc | null;
  onSave: (docData: Partial<ArchiveDoc>) => Promise<void>;
  onClose: () => void;
  subjects: string[];
  docTypes: string[];
}

const FONT_FAMILIES = [
  { label: 'Inter (Sans)', value: 'Inter, sans-serif' },
  { label: 'Newsreader (Serif)', value: 'Newsreader, Georgia, serif' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
];

const FONT_SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36'];

const DEFAULT_SUBJECTS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Philosophy', 'History', 'Economics', 'Literature', 'Engineering',
];

const DEFAULT_DOC_TYPES: DocType[] = [
  'Research Notes', 'Working Paper', 'Concept Proof', 'Literature Review',
  'Lab Log', 'Essay', 'Thesis Draft', 'Problem Set', 'Reference', 'Annotation',
];

export default function DocumentEditor({
  initialDoc,
  onSave,
  onClose,
  subjects,
  docTypes,
}: DocumentEditorProps) {
  const isEditing = Boolean(initialDoc?.id);
  const editorRef = useRef<HTMLDivElement>(null);

  // Metadata
  const [title, setTitle] = useState(initialDoc?.title || '');
  const [subtitle, setSubtitle] = useState(initialDoc?.subtitle || '');
  const [subject, setSubject] = useState(initialDoc?.subject || 'Computer Science');
  const [docType, setDocType] = useState<DocType>(initialDoc?.docType || 'Research Notes');
  const [status, setStatus] = useState<DocStatus>(initialDoc?.status || 'published');
  const [tagsInput, setTagsInput] = useState((initialDoc?.tags || []).join(', '));
  const [abstract, setAbstract] = useState(initialDoc?.abstract || '');
  const [isPinned, setIsPinned] = useState(Boolean(initialDoc?.isPinned));

  // Editor font controls
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState('14');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Populate editor with initial content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML =
        initialDoc?.content || '<p>Start writing here...</p>';
      editorRef.current.style.fontFamily = fontFamily;
      editorRef.current.style.fontSize = fontSize + 'px';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply font family to entire editor
  const applyFontFamily = (value: string) => {
    setFontFamily(value);
    if (editorRef.current) {
      editorRef.current.style.fontFamily = value;
    }
  };

  // Apply font size to entire editor
  const applyFontSize = (value: string) => {
    setFontSize(value);
    if (editorRef.current) {
      editorRef.current.style.fontSize = value + 'px';
    }
  };

  // execCommand wrapper
  const exec = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }, []);

  // Format block (headings, paragraph)
  const formatBlock = (tag: string) => exec('formatBlock', tag);

  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError('Please add a title before saving.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const html = editorRef.current?.innerHTML || '';
      const wordCount = editorRef.current?.innerText?.trim().split(/\s+/).filter(Boolean).length || 0;
      const readingTimeMin = Math.max(1, Math.round(wordCount / 200));
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim(),
        subject,
        docType,
        status,
        abstract: abstract.trim(),
        content: html,
        tags,
        isPinned,
        wordCount,
        readingTimeMin,
      });
      setSaved(true);
    } catch (err: any) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, subject, docType, status, abstract, tagsInput, isPinned]);

  const subjectsList = subjects.length ? subjects : DEFAULT_SUBJECTS;
  const docTypesList = (docTypes.length ? docTypes : DEFAULT_DOC_TYPES) as DocType[];

  return (
    <div className="gdoc-editor-shell">

      {/* ── Top bar ── */}
      <div className="gdoc-topbar">
        <div className="gdoc-topbar-left">
          <button onClick={onClose} className="gdoc-btn-icon" title="Close editor">
            <X size={18} />
          </button>
          <input
            className="gdoc-title-input"
            placeholder="Document title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="gdoc-topbar-right">
          {saveError && (
            <span className="gdoc-save-error">{saveError}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="gdoc-save-btn"
          >
            {saving ? <Loader2 size={15} className="gdoc-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Formatting toolbar ── */}
      <div className="gdoc-toolbar">

        {/* Font family */}
        <div className="gdoc-select-wrap">
          <select
            className="gdoc-select"
            value={fontFamily}
            onChange={(e) => applyFontFamily(e.target.value)}
            title="Font family"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="gdoc-toolbar-sep" />

        {/* Font size */}
        <div className="gdoc-select-wrap" style={{ width: 60 }}>
          <select
            className="gdoc-select"
            value={fontSize}
            onChange={(e) => applyFontSize(e.target.value)}
            title="Font size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="gdoc-toolbar-sep" />

        {/* Headings */}
        <button className="gdoc-tb-btn" onClick={() => formatBlock('h1')} title="Heading 1"><Heading1 size={16} /></button>
        <button className="gdoc-tb-btn" onClick={() => formatBlock('h2')} title="Heading 2"><Heading2 size={16} /></button>
        <button className="gdoc-tb-btn" onClick={() => formatBlock('h3')} title="Heading 3"><Heading3 size={16} /></button>

        <div className="gdoc-toolbar-sep" />

        {/* Text formatting */}
        <button className="gdoc-tb-btn" onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold size={16} /></button>
        <button className="gdoc-tb-btn" onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic size={16} /></button>
        <button className="gdoc-tb-btn" onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline size={16} /></button>
        <button className="gdoc-tb-btn" onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough size={16} /></button>

        <div className="gdoc-toolbar-sep" />

        {/* Alignment */}
        <button className="gdoc-tb-btn" onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft size={16} /></button>
        <button className="gdoc-tb-btn" onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter size={16} /></button>
        <button className="gdoc-tb-btn" onClick={() => exec('justifyRight')} title="Align right"><AlignRight size={16} /></button>

        <div className="gdoc-toolbar-sep" />

        {/* Lists */}
        <button className="gdoc-tb-btn" onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={16} /></button>
        <button className="gdoc-tb-btn" onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered size={16} /></button>
      </div>

      {/* ── Main area: sidebar + page ── */}
      <div className="gdoc-body">

        {/* Sidebar — metadata */}
        <aside className="gdoc-sidebar">
          <div className="gdoc-sidebar-inner">
            <p className="gdoc-sidebar-label">Subtitle</p>
            <input
              className="gdoc-field"
              placeholder="Optional subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />

            <p className="gdoc-sidebar-label">Subject</p>
            <select
              className="gdoc-field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {subjectsList.map((s) => <option key={s}>{s}</option>)}
              <option value="Other">Other</option>
            </select>

            <p className="gdoc-sidebar-label">Type</p>
            <select
              className="gdoc-field"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType)}
            >
              {docTypesList.map((d) => <option key={d}>{d}</option>)}
            </select>

            <p className="gdoc-sidebar-label">Status</p>
            <select
              className="gdoc-field"
              value={status}
              onChange={(e) => setStatus(e.target.value as DocStatus)}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <p className="gdoc-sidebar-label">Abstract</p>
            <textarea
              className="gdoc-field gdoc-textarea"
              placeholder="Short summary (optional)"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              rows={4}
            />

            <p className="gdoc-sidebar-label">Tags</p>
            <input
              className="gdoc-field"
              placeholder="tag1, tag2, tag3"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />

            <label className="gdoc-checkbox-row">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <span>Pin document</span>
            </label>

            <p className="gdoc-sidebar-hint">Ctrl+S to save</p>
          </div>
        </aside>

        {/* Page — the document writing surface */}
        <div className="gdoc-page-wrap">
          <div
            ref={editorRef}
            className="gdoc-page"
            contentEditable
            suppressContentEditableWarning
            spellCheck
            data-placeholder="Start writing here…"
          />
        </div>
      </div>
    </div>
  );
}
