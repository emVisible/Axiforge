export const EXPRESSION_LABELS: Record<string, string> = {
  neutral: "平静",
  happy: "愉悦",
  sad: "低落",
  angry: "愤怒",
  surprised: "惊讶",
  scared: "恐惧",
  thoughtful: "沉思",
  smirk: "戏谑",
  blush: "羞涩",
  tired: "疲惫",
  determined: "坚定",
};

export function expressionLabel(key?: string | null): string {
  if (!key) return EXPRESSION_LABELS.neutral;
  return EXPRESSION_LABELS[key] ?? key;
}
