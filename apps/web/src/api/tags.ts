import { apiClient } from './client';
import type { Tag } from '@/types/character';

export const tagApi = {
  list: (sortBy: 'usage' | 'name' = 'usage') =>
    apiClient.get<Tag[]>('/tags/', { sort_by: sortBy }),
};