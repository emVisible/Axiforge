const STUDIO = "/studio";

export const routes = {
  studio: STUDIO,
  dashboard: `${STUDIO}/dashboard`,
  discover: "/discover",
  discoverProject: (id: string) => `/discover/projects/${id}`,
  author: (id: string) => `/author/${id}`,
  projects: `${STUDIO}/projects`,
  projectNew: `${STUDIO}/projects/new`,
  project: (id: string) => `${STUDIO}/projects/${id}`,
  /** @deprecated 与 project 同址，保留兼容旧链接 */
  projectFlow: (id: string) => `${STUDIO}/projects/${id}`,
  items: `${STUDIO}/items`,
  item: (id: string) => `${STUDIO}/items/${id}`,
  scenes: `${STUDIO}/scenes`,
  scene: (id: string) => `${STUDIO}/scenes/${id}`,
  characters: {
    index: `${STUDIO}/characters`,
    create: `${STUDIO}/characters/new`,
    mine: `${STUDIO}/characters/mine`,
    detail: (id: string) => `${STUDIO}/characters/${id}`,
    edit: (id: string) => `${STUDIO}/characters/${id}/edit`,
    story: (characterId: string, storyId: string) =>
      `${STUDIO}/characters/${characterId}/stories/${storyId}`,
    storyEdit: (characterId: string, storyId: string) =>
      `${STUDIO}/characters/${characterId}/stories/${storyId}/edit`,
  },
  play: (projectId: string) => `/play/${projectId}`,
  profile: "/profile",
} as const;
