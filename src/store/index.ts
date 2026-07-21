import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';
import { User, Folder, Note, NoteShare } from '../lib/types';

// Helper to generate UUIDs
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

interface AuthState {
  user: User | null;
  token: string | null;
  signIn: (
    user: { id: string; email: string; name: string; avatarUrl: string | null },
    token: string,
  ) => void;
  signOut: () => void;
  updateProfile: (displayName: string, avatarUrl: string | null) => void;
  updateSettings: (
    translation: User["globalDefaultTranslation"],
    aiDetection: boolean,
  ) => void;
}

interface NoteState {
  folders: Folder[];
  notes: Note[];
  noteShares: NoteShare[];
  
  // Folder Operations
  createFolder: (name: string) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  
  // Note Operations
  createNote: (folderId: string | null, title?: string) => Note;
  updateNote: (id: string, updates: Partial<Note> | ((note: Note) => Partial<Note>)) => void;
  deleteNote: (id: string) => void;
  moveNote: (id: string, folderId: string | null) => void;
  
  // Sharing Operations
  shareNote: (noteId: string, email: string, level: 'VIEW' | 'EDIT') => NoteShare;
  removeShare: (shareId: string) => void;
  
  // Local Sync Helper
  resetData: () => void;
}


const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'f1',
    userId: 'u1',
    name: 'Sermon Jottings',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'f2',
    userId: 'u1',
    name: 'Personal Bible Study',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'f3',
    userId: 'u1',
    name: 'Small Group Outlines',
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
];

const INITIAL_NOTES: Note[] = [
  {
    id: 'n1',
    userId: 'u1',
    folderId: 'f1',
    title: 'The Assurance of Things Hoped For',
    version: 1,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    blocks: [
      {
        id: 'b1',
        type: 'paragraph',
        content: 'Sunday sermon at Grace Fellowship. Pastor Timothy spoke on Hebrews 11. He defined faith as the firm conviction that what God has promised, He will perform, even if we cannot see it yet.',
      },
      {
        id: 'b2',
        type: 'scripture',
        content: 'Hebrews 11:1',
        scriptureRef: 'Hebrews 11:1',
        verseText: 'Now faith is the assurance of things hoped for, the conviction of things not seen.',
        translation: 'ESV',
        isCollapsed: false,
      },
      {
        id: 'b3',
        type: 'paragraph',
        content: 'Key takeaways: \n1. Faith is not blind optimism; it is anchored in the character of God. \n2. Without faith, it is impossible to please Him. \n3. True biblical faith always prompts action.',
      },
    ],
  },
  {
    id: 'n2',
    userId: 'u1',
    folderId: 'f2',
    title: 'Romans 8:28 Reflection',
    version: 1,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    blocks: [
      {
        id: 'b4',
        type: 'paragraph',
        content: 'Reflecting on the Sovereignty of God in our trials. Sometimes it is hard to see how all things are working for our good, but we trust His promise.',
      },
      {
        id: 'b5',
        type: 'comparison',
        content: 'Romans 8:28 Translation Comparison',
        scriptureRef: 'Romans 8:28',
        comparisons: [
          {
            translation: 'ESV',
            text: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.',
          },
          {
            translation: 'AMP',
            text: 'And we know [with great confidence] that God [who is deeply concerned about us] causes all things to work together for good for those who love God, to those who are called according to His plan and purpose.',
          },
          {
            translation: 'NLT',
            text: 'And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.',
          },
        ],
      },
    ],
  },
  {
    id: 'n3',
    userId: 'u1',
    folderId: 'f3',
    title: 'John 15: Abiding in the Vine',
    version: 1,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    blocks: [
      {
        id: 'b6',
        type: 'paragraph',
        content: 'Small Group Discussion notes for Wednesday evening. We discussed what it practically looks like to remain connected to Jesus daily.',
      },
      {
        id: 'b7',
        type: 'bullet-list',
        content: '',
        items: [
          'Abiding requires discipline: Daily scripture, constant prayer.',
          'Pruning is painful but necessary: God trims away branches that don\'t bear fruit.',
          'Apart from Him, we can do absolutely nothing.',
        ],
      },
      {
        id: 'b8',
        type: 'scripture',
        content: 'John 15:5',
        scriptureRef: 'John 15:5',
        verseText: 'I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.',
        translation: 'ESV',
        isCollapsed: true,
      },
    ],
  },
  {
    id: 'n4',
    userId: 'u2', // Shared by pastor
    folderId: null, // Shared folders/notes are uncategorized or listed separately
    title: 'Shared: Ministry Strategy 2026',
    version: 2,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    blocks: [
      {
        id: 'b9',
        type: 'paragraph',
        content: 'Hi John, here is the outline for our outreach ministry. Please add the scripture verses we discussed for the launch sermon.',
      },
      {
        id: 'b10',
        type: 'paragraph',
        content: 'Focus verse: Proverbs 3:5-6. Let\'s place the comparison block here.',
      },
    ],
  },
];

const INITIAL_SHARES: NoteShare[] = [
  {
    id: 's1',
    noteId: 'n4',
    sharedByUserId: 'u2', // pastor@church.org
    sharedWithEmail: 'john.diddles@faithpad.org',
    permissionLevel: 'EDIT',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      signIn: (serverUser, serverToken) => {
        set({
          user: {
            id: serverUser.id,
            email: serverUser.email,
            displayName: serverUser.name || "Faith Pad User",
            avatarUrl: serverUser.avatarUrl || null,
            globalDefaultTranslation: "ESV",
            aiDetectionEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: serverToken,
        });
      },
      signOut: () => {
        set({ user: null, token: null });
      },
      updateProfile: (displayName, avatarUrl) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              displayName,
              avatarUrl,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      updateSettings: (translation, aiDetection) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              globalDefaultTranslation: translation,
              aiDetectionEnabled: aiDetection,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
    }),
    {
      name: 'faith-pad-auth',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

export const useNotesStore = create<NoteState>()(
  persist(
    (set, get) => ({
      folders: INITIAL_FOLDERS,
      notes: INITIAL_NOTES,
      noteShares: INITIAL_SHARES,

      createFolder: (name) => {
        const newFolder: Folder = {
          id: 'f_' + generateId(),
          userId: useAuthStore.getState().user?.id || 'u1',
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        return newFolder;
      },

      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f
          ),
        }));
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          // Unassign rather than delete to prevent losing content (moves to "Uncategorized" state)
          notes: state.notes.map((n) =>
            n.folderId === id ? { ...n, folderId: null, updatedAt: new Date().toISOString() } : n
          ),
        }));
      },

      createNote: (folderId, title = '') => {
        const newNote: Note = {
          id: 'n_' + generateId(),
          userId: useAuthStore.getState().user?.id || 'u1',
          folderId,
          title: title || null,
          version: 1,
          blocks: [
            {
              id: 'b_' + generateId(),
              type: 'paragraph',
              content: '',
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
        }));
        return newNote;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== id) return n;
            const changes = typeof updates === 'function' ? updates(n) : updates;
            return {
              ...n,
              ...changes,
              version: n.version + 1,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          noteShares: state.noteShares.filter((s) => s.noteId !== id),
        }));
      },

      moveNote: (id, folderId) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, folderId, updatedAt: new Date().toISOString() } : n
          ),
        }));
      },

      shareNote: (noteId, email, level) => {
        const newShare: NoteShare = {
          id: 's_' + generateId(),
          noteId,
          sharedByUserId: useAuthStore.getState().user?.id || 'u1',
          sharedWithEmail: email,
          permissionLevel: level,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          noteShares: [...state.noteShares, newShare],
        }));
        return newShare;
      },

      removeShare: (shareId) => {
        set((state) => ({
          noteShares: state.noteShares.filter((s) => s.id !== shareId),
        }));
      },

      resetData: () => {
        set({
          folders: INITIAL_FOLDERS,
          notes: INITIAL_NOTES,
          noteShares: INITIAL_SHARES,
        });
      },
    }),
    {
      name: 'faith-pad-notes',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
