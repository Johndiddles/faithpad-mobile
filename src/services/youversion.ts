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
  return data;
}

export interface FetchPassageResult {
  reference: string;
  text: string;
  translation: string;
}

export async function fetchBiblePassage(
  translation: string,
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
