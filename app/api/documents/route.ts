import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, initDb } from '@/lib/db';
import { ArchiveDoc } from '@/types/archive';

function mapRowToDoc(row: any): ArchiveDoc {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    subtitle: row.subtitle,
    subject: row.subject,
    docType: row.doc_type,
    status: row.status,
    content: row.content,
    abstract: row.abstract,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isPinned: Boolean(row.is_pinned),
    wordCount: Number(row.word_count || 0),
    readingTimeMin: Number(row.reading_time_min || 1),
    citations: typeof row.citations === 'string' ? JSON.parse(row.citations) : (row.citations || []),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function GET(req: NextRequest) {
  try {
    await initDb();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const subject = searchParams.get('subject')?.trim() || '';
    const docType = searchParams.get('docType')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const tag = searchParams.get('tag')?.trim() || '';
    const pinnedOnly = searchParams.get('pinnedOnly') === 'true';
    const sort = searchParams.get('sort') || 'updated';

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(
        title ILIKE $${pIdx} OR 
        abstract ILIKE $${pIdx} OR 
        content ILIKE $${pIdx} OR 
        code ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (subject && subject !== 'ALL') {
      conditions.push(`subject = $${pIdx}`);
      params.push(subject);
      pIdx++;
    }

    if (docType && docType !== 'ALL') {
      conditions.push(`doc_type = $${pIdx}`);
      params.push(docType);
      pIdx++;
    }

    if (status && status !== 'ALL') {
      conditions.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (tag) {
      conditions.push(`$${pIdx} = ANY(tags)`);
      params.push(tag.startsWith('#') ? tag : `#${tag}`);
      pIdx++;
    }

    if (pinnedOnly) {
      conditions.push(`is_pinned = true`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY is_pinned DESC, updated_at DESC';
    if (sort === 'created') {
      orderBy = 'ORDER BY is_pinned DESC, created_at DESC';
    } else if (sort === 'title') {
      orderBy = 'ORDER BY title ASC';
    } else if (sort === 'code') {
      orderBy = 'ORDER BY code DESC';
    }

    const rows = await query(`SELECT * FROM dolan_archives ${whereClause} ${orderBy}`, params);
    const documents = rows.map(mapRowToDoc);

    // Fetch unique subjects and all tags for metadata filters
    const subjectsRows = await query<{ subject: string }>(
      'SELECT DISTINCT subject FROM dolan_archives ORDER BY subject ASC'
    );
    const allTagsRows = await query<{ tag: string }>(
      'SELECT DISTINCT unnest(tags) as tag FROM dolan_archives WHERE tags IS NOT NULL'
    );

    return NextResponse.json({
      documents,
      totalCount: documents.length,
      subjects: subjectsRows.map((r) => r.subject).filter(Boolean),
      docTypes: [
        'Research Notes',
        'Lecture Log',
        'Concept Deep Dive',
        'Paper Review',
        'Theorem / Proof',
        'Problem Set',
        'Academic Reflection',
      ],
      allTags: allTagsRows.map((r) => r.tag).filter(Boolean),
    });
  } catch (err: any) {
    console.error('Error in GET /api/documents:', err);
    return NextResponse.json({ error: err?.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const body = await req.json();

    const title = (body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const content = body.content || '';
    const subject = (body.subject || 'Computer Science').trim();
    const docType = body.docType || 'Research Notes';
    const status = body.status || 'published';
    const subtitle = body.subtitle ? body.subtitle.trim() : null;
    const abstract = body.abstract ? body.abstract.trim() : null;
    const isPinned = Boolean(body.isPinned);
    const citations = Array.isArray(body.citations) ? JSON.stringify(body.citations) : '[]';

    // Format tags: ensure starting with '#'
    const rawTags = Array.isArray(body.tags) ? body.tags : [];
    const tags = rawTags
      .map((t: string) => t.trim())
      .filter(Boolean)
      .map((t: string) => (t.startsWith('#') ? t : `#${t}`));

    // Word count & reading time
    const words = content.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    // Auto-generate code e.g. ARC-2026-002
    const year = new Date().getFullYear();
    const latestCodeRow = await queryOne<{ code: string }>(
      `SELECT code FROM dolan_archives WHERE code LIKE 'ARC-${year}-%' ORDER BY code DESC LIMIT 1`
    );

    let nextNum = 1;
    if (latestCodeRow && latestCodeRow.code) {
      const parts = latestCodeRow.code.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }
    const code = `ARC-${year}-${String(nextNum).padStart(3, '0')}`;

    const insertSql = `
      INSERT INTO dolan_archives (
        code, title, subtitle, subject, doc_type, status, abstract, content, tags, is_pinned, word_count, reading_time_min, citations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const inserted = await queryOne(insertSql, [
      code,
      title,
      subtitle,
      subject,
      docType,
      status,
      abstract,
      content,
      tags,
      isPinned,
      wordCount,
      readingTimeMin,
      citations,
    ]);

    return NextResponse.json(mapRowToDoc(inserted), { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/documents:', err);
    return NextResponse.json({ error: err?.message || 'Database insert error' }, { status: 500 });
  }
}
