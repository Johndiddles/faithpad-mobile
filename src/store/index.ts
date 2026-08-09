import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "../lib/mmkv";
import { User, Folder, Note, NoteShare } from "../lib/types";
import {
  fetchFoldersApi,
  createFolderApi,
  renameFolderApi,
  deleteFolderApi,
  fetchNotesApi,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
  updateUserSettingsApi,
} from "../services/api";

// Helper to generate UUIDs
const generateId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

interface AuthState {
  user: User | null;
  token: string | null;
  signIn: (user: any, token: string) => void;
  signOut: () => void;
  updateProfile: (displayName: string, avatarUrl: string | null) => void;
  updateSettings: (
    translation: User["globalDefaultTranslation"],
    aiDetection: boolean,
  ) => void;
  setToken: (token: string | null) => void;
}

interface NoteState {
  folders: Folder[];
  notes: Note[];
  deletedNoteIds: string[];
  noteShares: NoteShare[];

  // Backend Sync
  syncWithBackend: () => Promise<void>;

  // Folder Operations
  createFolder: (name: string) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  // Note Operations
  createNote: (folderId: string | null, title?: string) => Note;
  updateNote: (
    id: string,
    updates: Partial<Note> | ((note: Note) => Partial<Note>),
  ) => void;
  deleteNote: (id: string) => void;
  moveNote: (id: string, folderId: string | null) => void;

  // Sharing Operations
  shareNote: (
    noteId: string,
    email: string,
    level: "VIEW" | "EDIT",
  ) => NoteShare;
  removeShare: (shareId: string) => void;

  // Local Sync Helper
  resetData: () => void;
}

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
            displayName:
              serverUser.displayName || serverUser.name || "Faith Pad User",
            avatarUrl: serverUser.avatarUrl || null,
            globalDefaultTranslation:
              serverUser.globalDefaultTranslation || "NLT",
            aiDetectionEnabled: serverUser.aiDetectionEnabled ?? true,
            createdAt: serverUser.createdAt || new Date().toISOString(),
            updatedAt: serverUser.updatedAt || new Date().toISOString(),
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
        updateUserSettingsApi(translation, aiDetection).catch((err) =>
          console.error("Failed to sync user settings to backend:", err),
        );
      },
      setToken: (token) => {
        set({ token });
      },
    }),
    {
      name: "faith-pad-auth",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

export const useNotesStore = create<NoteState>()(
  persist(
    (set, get) => ({
      folders: [],
      notes: [],
      deletedNoteIds: [],
      noteShares: [],

      syncWithBackend: async () => {
        try {
          const [remoteFoldersRes, remoteNotesRes] = await Promise.all([
            fetchFoldersApi(1, 1000).catch(() => null),
            fetchNotesApi(1, 1000).catch(() => null),
          ]);

          if (remoteFoldersRes !== null) {
            const foldersData = remoteFoldersRes?.data || [];

            set({ folders: foldersData });
          }
          if (remoteNotesRes !== null) {
            const notesData = Array.isArray(remoteNotesRes)
              ? remoteNotesRes
              : Array.isArray((remoteNotesRes as any)?.data)
                ? (remoteNotesRes as any).data
                : [];
            set({ notes: notesData });
          }
        } catch (err) {
          console.error("Error syncing with backend:", err);
        }
      },

      createFolder: (name) => {
        const newFolder: Folder = {
          id: "f_" + generateId(),
          userId: useAuthStore.getState().user?.id || "u1",
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        createFolderApi(newFolder.name, newFolder.id).catch((err) =>
          console.error("Failed to sync new folder to backend:", err),
        );
        return newFolder;
      },

      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id
              ? { ...f, name, updatedAt: new Date().toISOString() }
              : f,
          ),
        }));
        renameFolderApi(id, name).catch((err) =>
          console.error("Failed to sync renamed folder to backend:", err),
        );
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          // Unassign rather than delete to prevent losing content (moves to "Uncategorized" state)
          notes: state.notes.map((n) =>
            n.folderId === id
              ? { ...n, folderId: null, updatedAt: new Date().toISOString() }
              : n,
          ),
        }));
        deleteFolderApi(id).catch((err) =>
          console.error("Failed to sync folder deletion to backend:", err),
        );
      },

      createNote: (folderId, title = "") => {
        const newNote: Note = {
          id: "n_" + generateId(),
          userId: useAuthStore.getState().user?.id || "u1",
          folderId,
          title: title || null,
          version: 1,
          blocks: [
            {
              id: "b_" + generateId(),
              type: "paragraph",
              content: "",
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
        }));
        createNoteApi(
          newNote.folderId,
          newNote.title,
          newNote.id,
          newNote.blocks,
        ).catch((err) =>
          console.error("Failed to sync new note to backend:", err),
        );
        return newNote;
      },

      updateNote: (id, updates) => {
        let updatedNote: Note | undefined;
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== id) return n;
            const changes =
              typeof updates === "function" ? updates(n) : updates;
            updatedNote = {
              ...n,
              ...changes,
              version: n.version + 1,
              updatedAt: new Date().toISOString(),
            };
            return updatedNote;
          }),
        }));
        if (updatedNote) {
          const noteToSync: Note = updatedNote;
          updateNoteApi(id, {
            folderId: noteToSync.folderId,
            title: noteToSync.title,
            blocks: noteToSync.blocks,
            version: noteToSync.version,
          }).catch((err) =>
            console.error("Failed to sync updated note to backend:", err),
          );
        }
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          deletedNoteIds: [...state.deletedNoteIds, id],
          noteShares: state.noteShares.filter((s) => s.noteId !== id),
        }));
        deleteNoteApi(id).catch((err) =>
          console.error("Failed to sync note deletion to backend:", err),
        );
      },

      moveNote: (id, folderId) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, folderId, updatedAt: new Date().toISOString() }
              : n,
          ),
        }));
      },

      shareNote: (noteId, email, level) => {
        const newShare: NoteShare = {
          id: "s_" + generateId(),
          noteId,
          sharedByUserId: useAuthStore.getState().user?.id || "u1",
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
          folders: [],
          notes: [],
          deletedNoteIds: [],
          noteShares: [],
        });
      },
    }),
    {
      name: "faith-pad-notes",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
