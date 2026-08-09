import { customFetch } from "./customFetch";

export interface BibleVersionDetail {
  id: number;
  abbreviation: string;
  name: string;
}

export interface BibleVersionsResponse {
  success: boolean;
  data: BibleVersionDetail[];
}

export async function fetchBibleVersions(): Promise<
  BibleVersionsResponse["data"]
> {
  try {
    const response = await customFetch<BibleVersionsResponse>(
      `/bible/versions`,
      {
        method: "GET",
      },
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching bible versions:", error);
    throw new Error(error.message || "Failed to fetch bible versions");
  }
}

export interface FetchPassageResult {
  reference: string;
  text: string;
  translation: string;
}

export interface FetchPassageResponse {
  success: boolean;
  data: FetchPassageResult;
}

export async function fetchBiblePassage(
  translation: number,
  bookUSFM: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
): Promise<FetchPassageResult> {
  try {
    const response = await customFetch<FetchPassageResponse>(`/bible/passage`, {
      method: "POST",
      data: {
        translation,
        bookUSFM,
        chapter,
        verseStart,
        verseEnd,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching bible passage:", error);
    throw new Error(error.message || "Failed to fetch bible passage");
  }
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

interface FetchBibleBooksResponse {
  success: boolean;
  data: BibleBookDetail[];
}
export async function fetchBibleBooks(
  versionId: number,
  canon?: string,
): Promise<BibleBookDetail[]> {
  try {
    const response = await customFetch<FetchBibleBooksResponse>(
      `/bible/books/${versionId}`,
      {
        method: "GET",
      },
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching bible books:", error);
    throw new Error(error.message || "Failed to fetch bible books");
  }
}
