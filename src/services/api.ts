import { useAuthStore } from "../store";
import { Folder, Note, EditorBlock, PaginatedResponse } from "../lib/types";
import { API_URL } from "@/constants/env";
import { customFetch } from "./customFetch";
import { queryClient } from "@/lib/queryClient";

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

export async function fetchFoldersApi(
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResponse<Folder>> {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await customFetch(
    `${getApiUrl()}/folders?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }
  return await response.json();
  // console.log(JSON.stringify({ fetchFoldersApiResult: result }, null, 2));
  // if (Array.isArray(result)) {
  //   return {
  //     success: true,
  //     data: result,
  //     pagination: {
  //       page,
  //       limit,
  //       totalItems: result.length,
  //       totalPages: 1,
  //       hasNextPage: false,
  //       hasPrevPage: false,
  //     },
  //   };
  // }
  // return {
  //   success: result.success ?? true,
  //   data: Array.isArray(result.data) ? result.data : result.folders || [],
  //   pagination: result.pagination || {
  //     page,
  //     limit,
  //     totalItems: Array.isArray(result.data) ? result.data.length : 0,
  //     totalPages: 1,
  //     hasNextPage: false,
  //     hasPrevPage: false,
  //   },
  // };
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
  const resData = await response.json();
  queryClient.invalidateQueries({ queryKey: ["folders"] });
  return resData.data || resData;
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
  const resData = await response.json();
  queryClient.invalidateQueries({ queryKey: ["folders"] });
  return resData.data || resData;
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
  const resData = await response.json();
  queryClient.invalidateQueries({ queryKey: ["folders"] });
  return resData;
}

// --- NOTES API ---

export async function fetchNotesApi(
  page: number = 1,
  limit: number = 20,
  folderId?: string,
): Promise<PaginatedResponse<Note>> {
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

  const response = await customFetch(
    `${getApiUrl()}/notes?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }
  const result = await response.json();
  if (Array.isArray(result)) {
    return {
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        totalItems: result.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
  return result;
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
