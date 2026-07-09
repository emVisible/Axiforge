import { apiClient } from "./client";

export interface CreatorHubProject {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  view_count: number;
  play_count: number;
  comment_count: number;
  fork_count: number;
  is_public: boolean;
}

export interface CreatorHubResponse {
  author_id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  featured_projects: CreatorHubProject[];
  projects: CreatorHubProject[];
  total_views: number;
  total_plays: number;
  total_comments: number;
  forks_7d: number;
}

export interface TopicSummary {
  slug: string;
  label: string;
  project_count: number;
}

export interface DiscoverDashboardProject {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  play_count: number;
  view_count: number;
  author_id: string;
}

export interface DiscoverDashboard {
  counts: {
    projects: number;
    characters: number;
    items: number;
    scenes: number;
  };
  activity_7d: {
    plays: number;
    forks: number;
    comments: number;
  };
  hot_topics: TopicSummary[];
  trending_projects: DiscoverDashboardProject[];
}

export interface CreatorDashboard {
  author_id: string;
  counts: {
    projects: number;
    characters: number;
    items: number;
    scenes: number;
  };
  public_ratio: { public: number; private: number };
  views_7d: number;
  plays_7d: number;
  forks_7d: number;
  comments_7d: number;
  total_comments: number;
  pending_reports: number;
  trend: { date: string; views: number; plays: number; forks: number }[];
}

export const creatorApi = {
  dashboard: (authorId: string) =>
    apiClient.get<CreatorDashboard>("/creator/dashboard", { author_id: authorId }),

  hub: (authorId: string) =>
    apiClient.get<CreatorHubResponse>("/creator/hub", { author_id: authorId }),

  setFeatured: (creatorId: string, projectIds: string[]) =>
    apiClient.put<void>("/creator/featured", {
      creator_id: creatorId,
      project_ids: projectIds,
    }),
};

export const discoverApi = {
  dashboard: () => apiClient.get<DiscoverDashboard>("/discover/dashboard"),

  topics: () =>
    apiClient.get<{ items: TopicSummary[] }>("/discover/topics"),

  topicProjects: (slug: string, params?: { skip?: number; limit?: number }) =>
    apiClient.get<import("@/shared/types/project").ProjectResponse[]>(
      `/discover/topics/${encodeURIComponent(slug)}/projects`,
      params,
    ),
};
