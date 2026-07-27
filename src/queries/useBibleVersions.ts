import { fetchBibleVersions } from "@/services/youversion";
import { useAuthStore } from "@/store";
import { useQuery } from "@tanstack/react-query";

export function useBibleVersionsQuery(options?: { enabled?: boolean }) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["bibleVersions", token],
    queryFn: () => fetchBibleVersions(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    ...options,
  });
}
