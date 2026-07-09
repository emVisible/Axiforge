const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface NexusNote {
  id: string;
  author_id: string;
  title: string;
  body: string;
  tags: string[];
  links: string[];
  status: string;
  related_characters: string[];
  related_projects: string[];
  created_at: string;
  updated_at: string;
}

export const nexusApi = {
  list: (authorId: string, status?: string) => {
    const q = new URLSearchParams({ author_id: authorId });
    if (status) q.set("status", status);
    return request<NexusNote[]>(`/nexus/notes?${q}`);
  },
  create: (data: {
    author_id: string;
    title?: string;
    body?: string;
    tags?: string[];
    status?: string;
    related_projects?: string[];
    related_characters?: string[];
  }) =>
    request<NexusNote>("/nexus/notes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<NexusNote>) =>
    request<NexusNote>(`/nexus/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/nexus/notes/${id}`, { method: "DELETE" }),
  distribute: (data: {
    author_id: string;
    note_id: string;
    target_type: "character" | "project";
    target_id: string;
  }) =>
    request<{ ok: boolean; message: string }>("/nexus/distribute", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
