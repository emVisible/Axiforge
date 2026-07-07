/** Player 设置（v1.4 桥6）——按作品存 localStorage */

export interface PlayerSettings {
  textSpeedMs: number;
  autoDelayMs: number;
  bgmVolume: number;
  voiceVolume: number;
  seVolume: number;
  skipRead: boolean;
}

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  textSpeedMs: 35,
  autoDelayMs: 2000,
  bgmVolume: 0.5,
  voiceVolume: 0.9,
  seVolume: 0.8,
  skipRead: false,
};

const KEY = (projectId: string) => `axiforge:player-settings:${projectId}`;

export function loadPlayerSettings(projectId: string): PlayerSettings {
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return { ...DEFAULT_PLAYER_SETTINGS };
    return { ...DEFAULT_PLAYER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PLAYER_SETTINGS };
  }
}

export function savePlayerSettings(
  projectId: string,
  settings: PlayerSettings,
): void {
  localStorage.setItem(KEY(projectId), JSON.stringify(settings));
}
