import { API_URL } from "@/constants/env";
import { customFetch } from "./customFetch";

export interface BibleVersionDetail {
  id: number;
  abbreviation: string;
  name: string;
}

export async function fetchBibleVersions(): Promise<BibleVersionDetail[]> {
  const response = await customFetch(`${API_URL}/bible/versions`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bible versions");
  }

  const data = await response.json();
  console.log(JSON.stringify({ data }, null, 2));
  return data.data;
}

export interface FetchPassageResult {
  reference: string;
  text: string;
  translation: string;
}

export async function fetchBiblePassage(
  translation: number,
  bookUSFM: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
): Promise<FetchPassageResult> {
  const response = await customFetch(`${API_URL}/bible/passage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      translation,
      bookUSFM,
      chapter,
      verseStart,
      verseEnd,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Bible passage");
  }

  const data = await response.json();
  return data;
}

export interface BibleVerseDetail {
  id: string;
  passage_id: string;
  title: string;
}

export interface BibleChapterDetail {
  id: string;
  passage_id: string;
  title: string;
  verses?: BibleVerseDetail[];
}

export interface BibleBookDetail {
  id: string;
  title: string;
  full_title: string;
  abbreviation?: string;
  canon: string;
  intro?: {
    id: string;
    passage_id: string;
    title: string;
  };
  chapters?: BibleChapterDetail[];
}

export async function fetchBibleBooks(
  versionId?: number,
  canon?: string
): Promise<BibleBookDetail[]> {
  const params = new URLSearchParams();
  if (versionId) {
    params.append("versionId", versionId.toString());
  }
  if (canon) {
    params.append("canon", canon);
  }
  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await customFetch(`${API_URL}/bible/books${queryString}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bible books");
  }

  const data = await response.json();
  return data.data;
}

