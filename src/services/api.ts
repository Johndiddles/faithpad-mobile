import { Folder, Note, EditorBlock, PaginatedResponse } from "../lib/types";
import { customFetch } from "./customFetch";
import { queryClient } from "@/lib/queryClient";

// --- FOLDERS API ---

export async function fetchFoldersApi(
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResponse<Folder>> {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  try {
    const response = await customFetch<PaginatedResponse<Folder>>(
      `/folders?${queryParams.toString()}`,
      {
        method: "GET",
      },
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching folders:", error);
    throw new Error(error.message || "Failed to fetch folders");
  }
}

export async function createFolderApi(
  name: string,
  id?: string,
): Promise<Folder> {
  try {
    const response = await customFetch<Folder>(`/folders`, {
      method: "POST",
      data: { id, name },
    });
    queryClient.invalidateQueries({ queryKey: ["folders"] });
    return response;
  } catch (error: any) {
    console.error("Error creating folder:", error);
    throw new Error(error.message || "Failed to create folder");
  }
}

export async function renameFolderApi(
  id: string,
  name: string,
): Promise<Folder> {
  try {
    const response = await customFetch<Folder>(`/folders/${id}`, {
      method: "PUT",
      data: { name },
    });
    queryClient.invalidateQueries({ queryKey: ["folders"] });
    return response;
  } catch (error: any) {
    console.error("Error renaming folder:", error);
    throw new Error(error.message || "Failed to rename folder");
  }
}

export async function deleteFolderApi(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const response = await customFetch<{ success: boolean }>(`/folders/${id}`, {
      method: "DELETE",
    });
    queryClient.invalidateQueries({ queryKey: ["folders"] });
    return response;
  } catch (error: any) {
    console.error("Error deleting folder:", error);
    throw new Error(error.message || "Failed to delete folder");
  }
}

// --- NOTES API ---

export async function fetchNotesApi(
  page: number = 1,
  limit: number = 20,
  folderId?: string,
): Promise<PaginatedResponse<Note>> {
  try {
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (
      folderId !== undefined &&
      folderId !== null &&
      folderId !== "" &&
      folderId !== "all"
    ) {
      queryParams.append("folderId", folderId);
    }

    const response = await customFetch<PaginatedResponse<Note>>(
      `/notes?${queryParams.toString()}`,
      {
        method: "GET",
      },
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    throw new Error(error.message || "Failed to fetch notes");
  }
}

export async function createNoteApi(
  folderId: string | null,
  title?: string | null,
  id?: string,
  blocks?: EditorBlock[],
): Promise<Note> {
  try {
    const response = await customFetch<Note>(`/notes`, {
      method: "POST",
      data: { id, folderId, title, blocks },
    });
    return response;
  } catch (error: any) {
    console.error("Error creating note:", error);
    throw new Error(error.message || "Failed to create note");
  }
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
  try {
    const response = await customFetch<Note>(`/notes/${id}`, {
      method: "PUT",
      data: updates,
    });
    return response;
  } catch (error: any) {
    console.error("Error updating note:", error);
    throw new Error(error.message || "Failed to update note");
  }
}

export async function deleteNoteApi(id: string): Promise<{ success: boolean }> {
  try {
    const response = await customFetch<{ success: boolean }>(`/notes/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error: any) {
    console.error("Error deleting note:", error);
    throw new Error(error.message || "Failed to delete note");
  }
}

// --- USER SETTINGS API ---

export async function updateUserSettingsApi(
  globalDefaultTranslation: string,
  aiDetectionEnabled: boolean,
): Promise<any> {
  try {
    const response = await customFetch(`/users/settings`, {
      method: "PUT",
      data: { globalDefaultTranslation, aiDetectionEnabled },
    });
    return response;
  } catch (error: any) {
    console.error("Error updating user settings:", error);
    throw new Error(error.message || "Failed to update user settings");
  }
}
