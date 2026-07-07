import { apiClient } from "./client";

export const reportApi = {
  create: (body: {
    target_type: "project" | "character" | "asset";
    target_id: string;
    reason: string;
    reporter_token?: string;
  }) =>
    apiClient.post<{ id: string }>("/report/", body),
};
