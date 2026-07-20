import { fetchBibleVersions } from "@/services/youversion";
import { useQuery } from "@tanstack/react-query";

export function useBibleVersionsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["bibleVersions"],
    queryFn: () => fetchBibleVersions(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    ...options,
  });
}
