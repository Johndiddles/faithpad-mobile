import { ApiClient, BibleClient } from "@youversion/platform-core";
import { useQuery } from "@tanstack/react-query";

const appKey = process.env.EXPO_PUBLIC_YOUVERSION_APP_KEY || "";

// Initialize client only if we have a valid key (not the default placeholder)
const hasValidKey = appKey && appKey !== "your_app_key" && appKey !== "";

export const apiClient = hasValidKey
  ? new ApiClient({
      appKey,
      apiHost: "api.youversion.com",
      installationId: "faith-pad-mobile",
    })
  : null;

export const bibleClient = apiClient ? new BibleClient(apiClient) : null;

export interface BibleVersionDetail {
  id: number;
  abbreviation: string;
  name: string;
}

// Memory cache to query versions only once during app session
let cachedVersionsPromise: Promise<BibleVersionDetail[]> | null = null;

export async function fetchBibleVersions(): Promise<BibleVersionDetail[]> {
  if (!bibleClient) {
    throw new Error(
      "YouVersion API is not configured. Please set a valid EXPO_PUBLIC_YOUVERSION_APP_KEY in your .env file.",
    );
  }

  if (cachedVersionsPromise) {
    return cachedVersionsPromise;
  }

  cachedVersionsPromise = bibleClient
    .getVersions("en*")
    .then((response) => {
      if (!response.data || response.data.length === 0) {
        throw new Error("No Bible versions returned from YouVersion API.");
      }
      return response.data.map((version) => ({
        id: version.id,
        abbreviation: version.localized_abbreviation,
        name: version.title,
      }));
    })
    .catch((err) => {
      cachedVersionsPromise = null; // Clear on error to allow retry
      throw err;
    });

  return cachedVersionsPromise;
}

export function useBibleVersionsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["bibleVersions"],
    queryFn: () => fetchBibleVersions(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    ...options,
  });
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
  if (!bibleClient) {
    throw new Error(
      "YouVersion API is not configured. Please set a valid EXPO_PUBLIC_YOUVERSION_APP_KEY in your .env file.",
    );
  }

  // Fetch dynamic versions first
  const versions = await fetchBibleVersions();

  // Find version matching abbreviation (case-insensitive)
  const matchedVersion = versions.find(
    (v) => v.abbreviation.toUpperCase() === translation.toUpperCase(),
  );

  if (!matchedVersion) {
    throw new Error(
      `Bible translation "${translation}" not found in available YouVersion Bibles.`,
    );
  }

  const versionId = matchedVersion.id;

  // Format the passage reference for YouVersion API: e.g. JHN.3.16 or JHN.3.16-18
  const passageRef =
    verseEnd && verseEnd > verseStart
      ? `${bookUSFM.toUpperCase()}.${chapter}.${verseStart}-${verseEnd}`
      : `${bookUSFM.toUpperCase()}.${chapter}.${verseStart}`;

  // Fetch as plain text
  const response = await bibleClient.getPassage(versionId, passageRef, "text");

  return {
    reference: response.reference,
    text: response.content,
    translation: matchedVersion?.abbreviation,
  };
}

export function useBiblePassageQuery(
  translation: string,
  bookUSFM: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [
      "biblePassage",
      translation,
      bookUSFM,
      chapter,
      verseStart,
      verseEnd,
    ],
    queryFn: () =>
      fetchBiblePassage(translation, bookUSFM, chapter, verseStart, verseEnd),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    ...options,
  });
}
