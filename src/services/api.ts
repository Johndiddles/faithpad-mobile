import { useAuthStore } from "../store";
import { Folder, Note, EditorBlock } from "../lib/types";
import { API_URL } from "@/constants/env";
import { customFetch } from "./customFetch";

const getApiUrl = () => {
  return API_URL;
};

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

// --- FOLDERS API ---

export async function fetchFoldersApi(): Promise<Folder[]> {
  const response = await customFetch(`${getApiUrl()}/folders`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }
  return response.json();
}

export async function createFolderApi(
  name: string,
  id?: string,
): Promise<Folder> {
  const response = await customFetch(`${getApiUrl()}/folders`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, name }),
  });
  if (!response.ok) {
    throw new Error("Failed to create folder");
  }
  return response.json();
}

export async function renameFolderApi(
  id: string,
  name: string,
): Promise<Folder> {
  const response = await customFetch(`${getApiUrl()}/folders/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error("Failed to rename folder");
  }
  return response.json();
}

export async function deleteFolderApi(
  id: string,
): Promise<{ success: boolean }> {
  const response = await customFetch(`${getApiUrl()}/folders/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete folder");
  }
  return response.json();
}

// --- NOTES API ---

export async function fetchNotesApi(): Promise<Note[]> {
  const response = await customFetch(`${getApiUrl()}/notes`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }
  return response.json();
}

export async function createNoteApi(
  folderId: string | null,
  title?: string | null,
  id?: string,
  blocks?: EditorBlock[],
): Promise<Note> {
  const response = await customFetch(`${getApiUrl()}/notes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, folderId, title, blocks }),
  });
  if (!response.ok) {
    throw new Error("Failed to create note");
  }
  return response.json();
}

export async function updateNoteApi(
  id: string,
  updates: {
    folderId?: string | null;
    title?: string | null;
    blocks?: EditorBlock[];
    version?: number;
  },
): Promise<Note> {
  const response = await customFetch(`${getApiUrl()}/notes/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("Failed to update note");
  }
  return response.json();
}

export async function deleteNoteApi(id: string): Promise<{ success: boolean }> {
  const response = await customFetch(`${getApiUrl()}/notes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete note");
  }
  return response.json();
}

// --- USER SETTINGS API ---

export async function updateUserSettingsApi(
  globalDefaultTranslation: string,
  aiDetectionEnabled: boolean,
): Promise<any> {
  const response = await customFetch(`${getApiUrl()}/users/settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ globalDefaultTranslation, aiDetectionEnabled }),
  });
  if (!response.ok) {
    throw new Error("Failed to update user settings");
  }
  return response.json();
}
