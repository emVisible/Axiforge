import { apiClient } from "./client";

export interface UserProfile {
  id: string;
  creator_id: string;
  player_token: string;
  email?: string | null;
  display_name?: string | null;
  avatar_emoji?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDataExport {
  profile: UserProfile;
  projects: { id: string; title: string; is_public: boolean; created_at: string }[];
  characters: { id: string; name: string; is_public: boolean; created_at: string }[];
  identity_links: { id: string; local_id: string; email: string; kind: string }[];
}

export interface AuthorPublic {
  creator_id: string;
  display_name?: string | null;
  avatar_emoji?: string | null;
}

export const userApi = {
  session: (body: { creator_id: string; player_token: string }) =>
    apiClient.post<UserProfile>("/users/session", body),

  updateProfile: (body: {
    creator_id: string;
    player_token: string;
    email?: string;
    display_name?: string;
    avatar_emoji?: string;
  }) => apiClient.put<UserProfile>("/users/profile", body),

  author: (creatorId: string) =>
    apiClient.get<AuthorPublic>(`/users/author/${encodeURIComponent(creatorId)}`),

  resolve: (email: string) =>
    apiClient.get<{ email: string; profiles: UserProfile[] }>("/users/resolve", {
      email,
    }),

  exportData: (body: { creator_id: string; player_token: string }) =>
    apiClient.post<UserDataExport>("/users/export", body),

  deleteAccount: (body: { creator_id: string; player_token: string }) =>
    apiClient.delete<void>("/users/account", body),
};
