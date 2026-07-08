/** 分支回想 / 路线记录（v1.4）——按作品存 localStorage */

export interface RouteChoice {
  beatId: string;
  label: string;
  at: string;
}

export interface RouteHistory {
  choices: RouteChoice[];
  endings: string[];
}

const KEY = (projectId: string) => `axiforge:route-history:${projectId}`;

export function loadRouteHistory(projectId: string): RouteHistory {
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return { choices: [], endings: [] };
    const p = JSON.parse(raw);
    return {
      choices: Array.isArray(p.choices) ? p.choices : [],
      endings: Array.isArray(p.endings) ? p.endings : [],
    };
  } catch {
    return { choices: [], endings: [] };
  }
}

export function saveRouteHistory(projectId: string, h: RouteHistory): void {
  localStorage.setItem(KEY(projectId), JSON.stringify(h));
}

export function recordChoice(
  projectId: string,
  beatId: string,
  label: string,
): RouteHistory {
  const h = loadRouteHistory(projectId);
  h.choices.push({ beatId, label, at: new Date().toISOString() });
  saveRouteHistory(projectId, h);
  return h;
}

export function recordEnding(projectId: string, label: string): RouteHistory {
  const h = loadRouteHistory(projectId);
  if (!h.endings.includes(label)) h.endings.push(label);
  saveRouteHistory(projectId, h);
  return h;
}
