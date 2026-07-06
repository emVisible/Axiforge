import { useQuery } from '@tanstack/react-query';
import { tagApi } from '@/api/tags';

export const TAG_KEYS = {
  all: ['tags'] as const,
  list: (sortBy: 'usage' | 'name') => ['tags', 'list', sortBy] as const,
};

export const useTags = (sortBy: 'usage' | 'name' = 'usage') => {
  return useQuery({
    queryKey: TAG_KEYS.list(sortBy),
    queryFn: () => tagApi.list(sortBy),
    staleTime: 60 * 1000,
  });
};