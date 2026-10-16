'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onHeadingsExtracted?: (headings: Array<{ id: string; text: string; level: number }>) => void;
}

export default function MarkdownRenderer({
  content,
  className = '',
  onHeadingsExtracted,
}: MarkdownRendererProps) {
  // Pre-process LaTeX blocks before general markdown parsing
  const renderedElements = useMemo(() => {
    if (!content) return [];

    const headings: Array<{ id: string; text: string; level: number }> = [];
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let inTable = false;
    let tableBuffer: string[] = [];
    let inBlockMath = false;
    let mathBuffer: string[] = [];

    const renderInline = (text: string): React.ReactNode[] => {
      // Split on inline LaTeX ($...$) first
      const parts = text.split(/(\$[^\$]+?\$)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const rawMath = part.slice(1, -1);
          try {
            const html = katex.renderToString(rawMath, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={`inline-math-${pIdx}`}
                className="academic-inline-math"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={`math-err-${pIdx}`}>{part}</code>;
          }
        }

        // Inline code `...`
        const codeParts = part.split(/(`[^`]+?`)/g);
        return (
          <React.Fragment key={`text-seg-${pIdx}`}>
            {codeParts.map((sub, sIdx) => {
              if (sub.startsWith('`') && sub.endsWith('`') && sub.length > 2) {
                return (
                  <code key={`code-${sIdx}`} className="academic-inline-code">
                    {sub.slice(1, -1)}
                  </code>
                );
              }

              // Bold **...** and Italics *...*
              let formatted: React.ReactNode = sub;
              // Bold
              const boldSegments = sub.split(/(\*\*[^\*]+?\*\*)/g);
              return boldSegments.map((bPart, bIdx) => {
                if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
                  return <strong key={`bold-${bIdx}`}>{bPart.slice(2, -2)}</strong>;
                }
                // Italics
                const italicSegments = bPart.split(/(\*[^\*]+?\*)/g);
                return italicSegments.map((iPart, iIdx) => {
                  if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
                    return <em key={`italic-${iIdx}`}>{iPart.slice(1, -1)}</em>;
                  }
                  return iPart;
                });
              });
            })}
          </React.Fragment>
        );
      });
    };

    const flushTable = () => {
      if (tableBuffer.length === 0) return;
      const rows = tableBuffer
        .filter((r) => !r.trim().match(/^\|?(\s*:?-+:?\s*\|?)+$/)) // filter separator row
        .map((r) =>
          r
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => (idx === 0 && c === '' ? false : idx === arr.length - 1 && c === '' ? false : true))
        );

      if (rows.length > 0) {
        const headerRow = rows[0];
        const bodyRows = rows.slice(1);
        elements.push(
          <div key={`table-${elements.length}`} className="academic-table-wrapper">
            <table className="academic-table">
              <thead>
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={`th-${cIdx}`}>{renderInline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((bRow, rIdx) => (
                  <tr key={`tr-${rIdx}`}>
                    {bRow.map((bCell, cIdx) => (
                      <td key={`td-${rIdx}-${cIdx}`}>{renderInline(bCell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableBuffer = [];
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Block Math $$ ... $$
      if (trimmed.startsWith('$$')) {
        if (inBlockMath) {
          // Closing block math
          const mathString = mathBuffer.join('\n');
          mathBuffer = [];
          inBlockMath = false;
          try {
            const html = katex.renderToString(mathString, {
              displayMode: true,
              throwOnError: false,
            });
            elements.push(
              <div
                key={`block-math-${elements.length}`}
                className="academic-block-math"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            elements.push(
              <pre key={`math-err-${elements.length}`} className="academic-math-error">
                {mathString}
              </pre>
            );
          }
          continue;
        } else {
          // Check if single line $$ ... $$
          const singleLineMatch = trimmed.match(/^\$\$(.+?)\$\$$/);
          if (singleLineMatch) {
            try {
              const html = katex.renderToString(singleLineMatch[1], {
                displayMode: true,
                throwOnError: false,
              });
              elements.push(
                <div
                  key={`block-math-${elements.length}`}
                  className="academic-block-math"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch (e) {
              elements.push(<pre key={`math-err-${elements.length}`}>{singleLineMatch[1]}</pre>);
            }
            continue;
          } else {
            inBlockMath = true;
            mathBuffer = [];
            continue;
          }
        }
      }

      if (inBlockMath) {
        mathBuffer.push(line);
        continue;
      }

      // Code blocks ```
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          // Flush code block
          const codeString = codeBuffer.join('\n');
          const lang = codeLanguage;
          codeBuffer = [];
          codeLanguage = '';
          inCodeBlock = false;

          elements.push(
            <CodeBlockWithCopy
              key={`code-${elements.length}`}
              code={codeString}
              language={lang}
            />
          );
        } else {
          inCodeBlock = true;
          codeLanguage = trimmed.slice(3).trim() || 'text';
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Tables
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableBuffer.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Empty line
      if (!trimmed) {
        continue;
      }

      // Headings
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        const text = h1Match[1].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ id, text, level: 1 });
        elements.push(
          <h1 key={`h1-${elements.length}`} id={id} className="academic-h1">
            {renderInline(text)}
          </h1>
        );
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        const text = h2Match[1].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ id, text, level: 2 });
        elements.push(
          <h2 key={`h2-${elements.length}`} id={id} className="academic-h2">
            {renderInline(text)}
          </h2>
        );
        continue;
      }

      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        const text = h3Match[1].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ id, text, level: 3 });
        elements.push(
          <h3 key={`h3-${elements.length}`} id={id} className="academic-h3">
            {renderInline(text)}
          </h3>
        );
        continue;
      }

      // Horizontal rule ---
      if (trimmed.match(/^(---|___|\*\*\*)$/)) {
        elements.push(<hr key={`hr-${elements.length}`} className="academic-hr" />);
        continue;
      }

      // Blockquote >
      if (trimmed.startsWith('>')) {
        const quoteText = line.replace(/^>\s?/, '');
        elements.push(
          <blockquote key={`quote-${elements.length}`} className="academic-blockquote">
            {renderInline(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Unordered list - or *
      if (trimmed.match(/^[-*]\s+/)) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        // Task checkbox
        if (itemText.startsWith('[ ] ')) {
          elements.push(
            <div key={`task-${elements.length}`} className="academic-task-item">
              <span className="academic-checkbox unchecked" />
              <span>{renderInline(itemText.slice(4))}</span>
            </div>
          );
        } else if (itemText.startsWith('[x] ') || itemText.startsWith('[X] ')) {
          elements.push(
            <div key={`task-${elements.length}`} className="academic-task-item completed">
              <span className="academic-checkbox checked">✓</span>
              <span>{renderInline(itemText.slice(4))}</span>
            </div>
          );
        } else {
          elements.push(
            <li key={`li-${elements.length}`} className="academic-list-item">
              {renderInline(itemText)}
            </li>
          );
        }
        continue;
      }

      // Ordered list 1.
      const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (olMatch) {
        elements.push(
          <div key={`ol-${elements.length}`} className="academic-numbered-item">
            <span className="academic-num-badge">{olMatch[1]}.</span>
            <span>{renderInline(olMatch[2])}</span>
          </div>
        );
        continue;
      }

      // Regular Paragraph
      elements.push(
        <p key={`p-${elements.length}`} className="academic-paragraph">
          {renderInline(line)}
        </p>
      );
    }

    if (inTable) flushTable();

    if (onHeadingsExtracted && headings.length > 0) {
      onHeadingsExtracted(headings);
    }

    return elements;
  }, [content, onHeadingsExtracted]);

  return <div className={`academic-prose ${className}`}>{renderedElements}</div>;
}

function CodeBlockWithCopy({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="academic-code-wrapper">
      <div className="academic-code-header">
        <span className="academic-code-lang">{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="academic-copy-btn"
          title="Copy code to clipboard"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>
      <pre className="academic-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
