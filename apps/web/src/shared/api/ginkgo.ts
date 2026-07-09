import { apiClient } from "./client";

export interface AchievementDef {
  id: string;
  project_id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  condition: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerAchievement {
  id: string;
  achievement_id: string;
  project_id: string;
  unlocked_at: string;
  achievement?: AchievementDef;
}

export const ginkgoApi = {
  list: (projectId: string) =>
    apiClient.get<{ items: AchievementDef[] }>(
      `/ginkgo/projects/${projectId}/achievements`,
    ),

  create: (
    projectId: string,
    data: {
      key: string;
      title: string;
      description?: string;
      icon?: string;
      condition?: Record<string, unknown>;
      is_public?: boolean;
    },
  ) =>
    apiClient.post<AchievementDef>(`/ginkgo/projects/${projectId}/achievements`, data),

  update: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      icon: string;
      condition: Record<string, unknown>;
      is_public: boolean;
    }>,
  ) => apiClient.put<AchievementDef>(`/ginkgo/achievements/${id}`, data),

  remove: (id: string) => apiClient.delete<void>(`/ginkgo/achievements/${id}`),

  unlock: (projectId: string, playerToken: string, achievementKey: string) =>
    apiClient.post<PlayerAchievement>(`/ginkgo/projects/${projectId}/unlock`, {
      player_token: playerToken,
      achievement_key: achievementKey,
    }),

  playerList: (projectId: string, playerToken: string) =>
    apiClient.get<PlayerAchievement[]>(`/ginkgo/projects/${projectId}/player`, {
      player_token: playerToken,
    }),
};
