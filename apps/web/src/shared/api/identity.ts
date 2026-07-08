import { apiClient } from "./client";

export interface IdentityLink {
  id: string;
  local_id: string;
  email: string;
  kind: "creator" | "player";
  created_at: string;
}

export const identityApi = {
  linkEmail: (body: {
    local_id: string;
    email: string;
    kind: "creator" | "player";
  }) => apiClient.post<IdentityLink>("/identity/link-email", body),

  resolve: (email: string) =>
    apiClient.get<{ email: string; links: IdentityLink[] }>("/identity/resolve", {
      email,
    }),
};
