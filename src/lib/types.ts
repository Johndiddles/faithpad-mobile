export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  globalDefaultTranslation: string;
  aiDetectionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type BlockType = 'paragraph' | 'header' | 'bullet-list' | 'scripture' | 'comparison';

export interface EditorBlock {
  id: string;
  type: BlockType;
  content: string; // Plain text or description
  items?: string[]; // Bullet point list items
  scriptureRef?: string; // Resolved scripture reference e.g., 'John 3:16'
  verseText?: string; // Main scripture text content
  translation?: string; // Specific translation override e.g. 'AMP'
  isCollapsed?: boolean; // For collapsible scriptures
  comparisons?: {
    translation: string;
    text: string;
  }[]; // For scripture comparison block
}

export interface Note {
  id: string;
  userId: string;
  folderId: string | null; // null for Uncategorized/root level notes
  title: string | null;
  blocks: EditorBlock[];
  version: number; // for optimistic locking
  createdAt: string;
  updatedAt: string;
}

export interface NoteShare {
  id: string;
  noteId: string;
  sharedByUserId: string;
  sharedWithEmail: string;
  permissionLevel: 'VIEW' | 'EDIT';
  createdAt: string;
}
