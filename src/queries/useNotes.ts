import { fetchNotesApi } from "@/services/api";
import { useAuthStore } from "@/store";
import { useInfiniteQuery } from "@tanstack/react-query";

export function useNotesQuery(folderId?: string, limit: number = 20) {
  const token = useAuthStore((state) => state.token);

  return useInfiniteQuery({
    queryKey: ["notes", token, folderId || "all", limit],
    queryFn: ({ pageParam = 1 }) =>
      fetchNotesApi(pageParam as number, limit, folderId),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasNextPage) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}
