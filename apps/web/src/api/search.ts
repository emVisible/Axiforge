
import { apiClient } from './client';

export interface SearchResultItem {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface SelectableItem {
  id: string;
  name: string;
}

export const searchApi = {
  global: (q: string) =>
    apiClient.get<{ results: SearchResultItem[] }>(`/search/all?q=${encodeURIComponent(q)}`),

  scenes: (q: string) =>
    apiClient.get<SelectableItem[]>(`/search/scenes?q=${encodeURIComponent(q)}`),

  items: (q: string) =>
    apiClient.get<SelectableItem[]>(`/search/items?q=${encodeURIComponent(q)}`),
};