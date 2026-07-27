import { fetchBiblePassage } from "@/services/youversion";
import { useQuery } from "@tanstack/react-query";

export function useBiblePassageQuery(
  translation: number,
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
