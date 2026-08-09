import { BibleBookDetail, fetchBibleBooks } from "@/services/youversion";
import { useAuthStore } from "@/store";
import { useQuery } from "@tanstack/react-query";

export function useBibleBooks(options: {
  enabled?: boolean;
  versionId: number;
}) {
  const token = useAuthStore((state) => state.token);
  return useQuery<BibleBookDetail[]>({
    queryKey: ["bibleBooks", token, options?.versionId],
    queryFn: () => fetchBibleBooks(options?.versionId),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    ...options,
  });
}
