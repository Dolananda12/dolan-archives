export type DocType =
  | 'Research Notes'
  | 'Working Paper'
  | 'Concept Proof'
  | 'Literature Review'
  | 'Lab Log'
  | 'Essay'
  | 'Thesis Draft'
  | 'Problem Set'
  | 'Reference'
  | 'Annotation'
  | 'Lecture Log'
  | 'Academic Reflection';

export type DocStatus = 'published' | 'draft' | 'in_review' | 'archived';

export interface Citation {
  id: string;
  text: string;
  url?: string;
}

export interface ArchiveDoc {
  id: string;
  code: string;
  title: string;
  subtitle: string | null;
  subject: string;
  docType: DocType;
  status: DocStatus;
  content: string;
  abstract: string | null;
  tags: string[];
  isPinned: boolean;
  wordCount: number;
  readingTimeMin: number;
  citations: Citation[];
  createdAt: string;
  updatedAt: string;
}

export interface ArchiveFilterOptions {
  search?: string;
  subject?: string;
  docType?: string;
  status?: string;
  tag?: string;
  pinnedOnly?: boolean;
  sort?: 'updated' | 'created' | 'title' | 'code';
}

export interface ArchiveListResponse {
  documents: ArchiveDoc[];
  totalCount: number;
  subjects: string[];
  docTypes: string[];
  allTags: string[];
}
