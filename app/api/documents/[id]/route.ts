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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;

    // Check by UUID or by code (e.g. ARC-2026-001)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const sql = isUuid
      ? 'SELECT * FROM dolan_archives WHERE id = $1'
      : 'SELECT * FROM dolan_archives WHERE code = $1';

    const row = await queryOne(sql, [id]);
    if (!row) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(mapRowToDoc(row));
  } catch (err: any) {
    console.error('Error in GET /api/documents/[id]:', err);
    return NextResponse.json({ error: err?.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
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

    const rawTags = Array.isArray(body.tags) ? body.tags : [];
    const tags = rawTags
      .map((t: string) => t.trim())
      .filter(Boolean)
      .map((t: string) => (t.startsWith('#') ? t : `#${t}`));

    const words = content.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const updateSql = `
      UPDATE dolan_archives
      SET title = $1,
          subtitle = $2,
          subject = $3,
          doc_type = $4,
          status = $5,
          content = $6,
          abstract = $7,
          tags = $8,
          is_pinned = $9,
          word_count = $10,
          reading_time_min = $11,
          citations = $12,
          updated_at = now()
      WHERE ${isUuid ? 'id = $13' : 'code = $13'}
      RETURNING *
    `;

    const updated = await queryOne(updateSql, [
      title,
      subtitle,
      subject,
      docType,
      status,
      content,
      abstract,
      tags,
      isPinned,
      wordCount,
      readingTimeMin,
      citations,
      id,
    ]);

    if (!updated) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(mapRowToDoc(updated));
  } catch (err: any) {
    console.error('Error in PUT /api/documents/[id]:', err);
    return NextResponse.json({ error: err?.message || 'Update error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const deleteSql = isUuid
      ? 'DELETE FROM dolan_archives WHERE id = $1 RETURNING id'
      : 'DELETE FROM dolan_archives WHERE code = $1 RETURNING id';

    const deleted = await queryOne(deleteSql, [id]);
    if (!deleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document removed from archive' });
  } catch (err: any) {
    console.error('Error in DELETE /api/documents/[id]:', err);
    return NextResponse.json({ error: err?.message || 'Delete error' }, { status: 500 });
  }
}
