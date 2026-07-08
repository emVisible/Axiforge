import { apiClient } from "./client";

export interface CreatorDashboard {
  author_id: string;
  counts: {
    projects: number;
    characters: number;
    items: number;
    scenes: number;
  };
  public_ratio: {
    public: number;
    private: number;
  };
  views_7d: number;
  plays_7d: number;
  forks_7d: number;
  pending_reports: number;
  trend: Array<{
    date: string;
    views: number;
    plays: number;
    forks: number;
  }>;
}

export const creatorApi = {
  dashboard: (authorId: string) =>
    apiClient.get<CreatorDashboard>(
      `/creator/dashboard?author_id=${encodeURIComponent(authorId)}`,
    ),
};
