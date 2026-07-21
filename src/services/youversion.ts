import { useAuthStore } from "../store";

export interface BibleVersionDetail {
  id: number;
  abbreviation: string;
  name: string;
}

export async function fetchBibleVersions(): Promise<BibleVersionDetail[]> {
  const token = useAuthStore.getState().token;
  const response = await fetch("http://localhost:5770/api/v1/bible/versions", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
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
  const token = useAuthStore.getState().token;
  const response = await fetch("http://localhost:5770/api/v1/bible/passage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
    },
    body: JSON.stringify({
      translation,
      bookUSFM,
      chapter,
      verseStart,
      verseEnd,
    }),
  });

  console.log(JSON.stringify(response, null, 2));

  if (!response.ok) {
    throw new Error("Failed to fetch Bible passage");
  }

  const data = await response.json();
  return data;
}
