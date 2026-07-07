import { apiClient } from "./client";

export interface UserProfile {
  id: string;
  creator_id: string;
  player_token: string;
  email?: string | null;
  display_name?: string | null;
  created_at: string;
  updated_at: string;
}

export const userApi = {
  session: (body: { creator_id: string; player_token: string }) =>
    apiClient.post<UserProfile>("/users/session", body),

  updateProfile: (body: {
    creator_id: string;
    player_token: string;
    email?: string;
    display_name?: string;
  }) => apiClient.put<UserProfile>("/users/profile", body),

  resolve: (email: string) =>
    apiClient.get<{ email: string; profiles: UserProfile[] }>("/users/resolve", {
      email,
    }),
};
