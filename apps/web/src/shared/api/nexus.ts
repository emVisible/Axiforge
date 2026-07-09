import { apiClient } from "@/shared/api/client";

export interface NexusNote {
  id: string;
  author_id: string;
  title: string;
  body: string;
  status: string;
}

export const nexusApi = {
  sendToInbox: (data: {
    author_id: string;
    title?: string;
    body: string;
    tags?: string[];
    related_projects?: string[];
    related_characters?: string[];
  }) =>
    apiClient.post<NexusNote>("/nexus/notes", {
      ...data,
      status: "inbox",
    }),
};
