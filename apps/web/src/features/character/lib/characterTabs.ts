import { BookOpen, FileText, ImageIcon, Network } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * 角色详情页的标签清单（从 `CharacterDetailPage.tsx` 外提的唯一理由：
 * 「桌面该不该给这个入口」必须变成可单测的判据，而不是页面里一条手抄白名单）。
 *
 * `cloudOnly` 记的是**这一栏的数据通路在哪**，不是「看着像云端功能」：
 * 传记一度被当成协作服务列进白名单外，而 S13-1 早就把它落进了本地契约
 * （`StoredStory` + SQLite v4 + `storySaves` 分派口）——于是本地化做完却没人能点进去，
 * 界面上等于没有这个功能。手抄白名单会因为这个原因过期：它离写侧太远。
 */
export type CharacterTabKey = "info" | "relations" | "stories" | "sprites";

export interface CharacterTab {
  key: CharacterTabKey;
  label: string;
  Icon: LucideIcon;
  /** 只有云端才有的能力：桌面态不给入口（见 `shared/lib/deployment.ts`） */
  cloudOnly: boolean;
}

export const characterTabs: readonly CharacterTab[] = [
  { key: "info", label: "角色信息", Icon: FileText, cloudOnly: false },
  { key: "relations", label: "关系", Icon: Network, cloudOnly: true },
  { key: "stories", label: "传记", Icon: BookOpen, cloudOnly: false },
  { key: "sprites", label: "立绘", Icon: ImageIcon, cloudOnly: false },
];

/** 桌面态只给本地通路齐的那几栏；浏览器一支全给 */
export function visibleCharacterTabs(localOnly: boolean): readonly CharacterTab[] {
  return localOnly ? characterTabs.filter((t) => !t.cloudOnly) : characterTabs;
}
