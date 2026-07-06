const PRESET_COLORS = [
  "#C44D4D", "#B8602A", "#7A8C4A", "#4A6B8C", "#8C5A7A",
  "#5A7A6A", "#9C6A4A", "#6A5A8C", "#4A7A8C", "#8C6A5A",
  "#6A8C5A", "#8C4A6A", "#5A6A8C", "#9C8A5A", "#6A4A5A", "#4A8C7A",
];

export function generateTagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRESET_COLORS[Math.abs(hash) % PRESET_COLORS.length];
}

export const layerPresets = {
  contour: {
    appearance: [
      "短发利落", "长发柔和", "戴眼镜", "身形修长",
      "体格结实", "面容稚嫩", "肤色黝黑", "保养精致",
      "有旧伤疤", "着装正式", "打扮随性", "微胖和蔼",
      "瘦削锐利", "纹身醒目", "白发苍苍", "异色瞳",
    ],
    age_era: [
      "刚成年", "二十出头", "二十五六",
      "三十上下", "四十左右", "五十知天命",
      "眼神显老", "看不出年纪", "早熟",
      "少年老成", "童心未泯",
    ],
    identity: [
      "学生", "自由职业", "上班族", "教师",
      "创作者", "技术岗", "医生", "管理者",
      "旅居者", "商人", "军人", "学者",
      "公务员", "手艺人", "无业游民", "退休",
    ],
    first_impression: [
      "不好接近", "值得信任", "安静寡言",
      "引人注目", "心不在焉", "有故事",
      "过目不忘", "耐看型", "温暖亲切",
      "气场强大", "平平无奇", "古怪有趣",
    ],
  },
  demeanor: {
    speech_style: [
      "慢条斯理", "快人快语", "言简意赅",
      "爱打比方", "温和有礼", "暗藏讽刺",
      "习惯自嘲", "声音不大", "手势丰富",
      "倾听多于说", "滔滔不绝", "惜字如金",
    ],
    habits: [
      "自言自语", "走路快", "随手整理",
      "咬笔头", "大量喝水", "熬夜党",
      "爱记笔记", "雷打不动早起", "习惯皱眉",
      "笑点奇怪", "抽烟或嚼糖", "反复检查",
    ],
    typical_reaction: [
      "先观察", "先保护人", "幽默化解",
      "沉默复盘", "立刻解决", "先问还好吗",
      "外表镇定", "先退一步", "直接对峙",
    ],
    expressiveness: [
      "喜怒不上脸", "什么都写在脸上",
      "熟人才能懂", "自以为藏很好",
      "刻意控制", "自然流露",
      "笑点低哭点高", "温和但会爆发",
    ],
  },
  psyche: {
    desire: [
      "被理解", "掌控生活", "做成大事",
      "找到位置", "保护所爱", "挣脱过去",
      "追求极致", "安稳度日", "被接纳",
      "证明自己", "探索边界", "深度连接",
      "留下痕迹", "活得真实", "被人记住",
    ],
    fear: [
      "被放弃", "白忙一场", "失控",
      "重蹈覆辙", "被看穿", "未知",
      "真正的孤独", "辜负信任", "无能为力",
      "被遗忘", "平庸", "亲密关系",
    ],
    conflict: [
      "靠近怕受伤", "理性对抗感性",
      "责任与欲望", "现状与冒险",
      "自我要求过高", "想被看见又怕",
      "又爱又恨", "知道但做不到",
      "自由与归属", "骄傲与自卑",
    ],
    self_perception: [
      "比看起来脆弱", "比自己想的有力",
      "局外人感", "别人的依靠",
      "不够好", "不敢用天赋",
      "藏得很深", "评价过低",
      "有用才有价值", "不擅亲密",
      "觉得自己是负担", "高估了自己",
    ],
  },
  anchor: {
    name: [],
    summary: [],
    essence: [
      "冷漠包裹温柔", "废墟里找花",
      "嘴上不在乎", "一人扛所有",
      "本可走却留", "笑藏太多东西",
      "一直在找归处", "放弃被理解但没放弃理解人",
      "让世界变好一点", "规则与良心间横跳",
      "温柔而坚定", "破碎却完整",
      "害怕孤独却选择孤独", "以黑暗守护光明",
    ],
    tags: [],
    theme: [
      "救赎", "成长", "寻己", "守护",
      "和解", "自由", "归属", "抗争",
      "遗忘", "传承", "爱", "牺牲",
      "存在", "告别", "接纳", "反抗",
    ],
    core_belief: [
      "人性本善", "适者生存", "永不晚",
      "力量即责任", "真相必现", "人能互相理解",
      "时间最强", "没什么过不去",
      "人人值得善待", "行胜于言",
      "软弱不可耻", "总得有人做",
      "自由高于一切", "爱是最优解",
      "命由己造", "万物有灵",
    ],
  },
  trace: {
    background: [
      "普通长大", "单亲早熟", "富裕孤独",
      "贫苦知艰", "背负期望", "漂泊不定",
      "社区长大", "早早离家", "备受宠爱",
      "被忽视的中间孩子", "独生子女", "大家庭长大",
    ],
    turning_point: [
      "重要的人离去或到来", "彻底失败反解脱",
      "被背叛", "看到更大的世界",
      "濒死经历", "一句改变一切的话",
      "做成不可能的事", "无法挽回的选择",
      "第一次远行", "孩子的出生",
    ],
  },
  bond: {
    attitude_to_others: [
      "观察再决定", "温和有距",
      "先疑后信", "先付出",
      "只分里外", "总有戒心",
      "来者不拒", "宁缺毋滥",
    ],
    intimate_pattern: [
      "认定不放", "越近越不会表达",
      "只顾照顾", "需要空间又想要伴",
      "容易理想化", "怕太依赖",
      "测试底线", "笨拙真诚",
      "热烈后冷却", "细水长流",
    ],
    hostile_pattern: [
      "正面交锋", "退一步回击",
      "冷处理", "以理服人",
      "化怒为力", "忍久爆发",
      "永不原谅", "快速翻篇",
    ],
    group_role: [
      "拿主意的人", "独行者",
      "关系粘合剂", "点子王不执行",
      "默默做完", "关键时刻顶",
      "旁观全知", "冲突调解",
      "开心果", "定海神针",
    ],
  },
};

// ── 模板：荣格八原型 + 扩展 ──

export interface CharacterTemplate {
  id: string;
  name: string;
  summary: string;
  data: Record<string, Record<string, string>>;
}

export const characterTemplates: CharacterTemplate[] = [
  {
    id: "hero", name: "英雄", summary: "证明自己，证明世界可以更好",
    data: {
      contour: { appearance: "身形修长", age_era: "二十出头", identity: "自由职业", first_impression: "引人注目" },
      demeanor: { speech_style: "声音不大", habits: "雷打不动早起", typical_reaction: "先观察", expressiveness: "自以为藏很好" },
      psyche: { desire: "做成大事", fear: "白忙一场", conflict: "责任与欲望", self_perception: "自我要求过高" },
      anchor: { essence: "让世界变好一点", theme: "抗争", core_belief: "总得有人做" },
      trace: { background: "背负期望", turning_point: "看到更大的世界" },
      bond: { attitude_to_others: "先付出", intimate_pattern: "只顾照顾", hostile_pattern: "正面交锋", group_role: "拿主意的人" },
    },
  },
  {
    id: "shadow", name: "暗影", summary: "被过去咬住，在黑暗中独行",
    data: {
      contour: { appearance: "有旧伤疤", age_era: "眼神显老", identity: "旅居者", first_impression: "有故事" },
      demeanor: { speech_style: "言简意赅", habits: "熬夜党", typical_reaction: "沉默复盘", expressiveness: "喜怒不上脸" },
      psyche: { desire: "挣脱过去", fear: "重蹈覆辙", conflict: "靠近怕受伤", self_perception: "比看起来脆弱" },
      anchor: { essence: "放弃被理解但没放弃理解人", theme: "救赎", core_belief: "时间最强" },
      trace: { background: "漂泊不定", turning_point: "被背叛" },
      bond: { attitude_to_others: "先疑后信", intimate_pattern: "越近越不会表达", hostile_pattern: "忍久爆发", group_role: "独行者" },
    },
  },
  {
    id: "caregiver", name: "照顾者", summary: "把所有人扛肩上，忘了自己",
    data: {
      contour: { appearance: "面容稚嫩", age_era: "二十五六", identity: "教师", first_impression: "值得信任" },
      demeanor: { speech_style: "温和有礼", habits: "爱记笔记", typical_reaction: "先保护人", expressiveness: "温和但会爆发" },
      psyche: { desire: "保护所爱", fear: "辜负信任", conflict: "别人的依靠", self_perception: "有用才有价值" },
      anchor: { essence: "一人扛所有", theme: "守护", core_belief: "人人值得善待" },
      trace: { background: "单亲早熟", turning_point: "重要的人离去或到来" },
      bond: { attitude_to_others: "温和有距", intimate_pattern: "只顾照顾", hostile_pattern: "化怒为力", group_role: "关系粘合剂" },
    },
  },
  {
    id: "seeker", name: "追寻者", summary: "一直在找什么，自己也不确定",
    data: {
      contour: { appearance: "着装正式", age_era: "看不出年纪", identity: "创作者", first_impression: "心不在焉" },
      demeanor: { speech_style: "爱打比方", habits: "大量喝水", typical_reaction: "幽默化解", expressiveness: "熟人才能懂" },
      psyche: { desire: "追求极致", fear: "未知", conflict: "现状与冒险", self_perception: "局外人感" },
      anchor: { essence: "一直在找归处", theme: "寻己", core_belief: "真相必现" },
      trace: { background: "早早离家", turning_point: "一句改变一切的话" },
      bond: { attitude_to_others: "观察再决定", intimate_pattern: "需要空间又想要伴", hostile_pattern: "以理服人", group_role: "点子王不执行" },
    },
  },
  {
    id: "trickster", name: "愚者", summary: "用笑藏起一切，包括自己",
    data: {
      contour: { appearance: "打扮随性", age_era: "早熟", identity: "商人", first_impression: "过目不忘" },
      demeanor: { speech_style: "暗藏讽刺", habits: "笑点奇怪", typical_reaction: "外表镇定", expressiveness: "自然流露" },
      psyche: { desire: "被接纳", fear: "被看穿", conflict: "想被看见又怕", self_perception: "藏得很深" },
      anchor: { essence: "笑藏太多东西", theme: "自由", core_belief: "软弱不可耻" },
      trace: { background: "贫苦知艰", turning_point: "做成不可能的事" },
      bond: { attitude_to_others: "只分里外", intimate_pattern: "测试底线", hostile_pattern: "冷处理", group_role: "旁观全知" },
    },
  },
  {
    id: "sage", name: "智者", summary: "看得太多，说得太少",
    data: {
      contour: { appearance: "戴眼镜", age_era: "四十左右", identity: "学者", first_impression: "安静寡言" },
      demeanor: { speech_style: "慢条斯理", habits: "随手整理", typical_reaction: "先观察", expressiveness: "刻意控制" },
      psyche: { desire: "探索边界", fear: "真正的孤独", conflict: "理性对抗感性", self_perception: "比自己想的有力" },
      anchor: { essence: "废墟里找花", theme: "传承", core_belief: "人能互相理解" },
      trace: { background: "富裕孤独", turning_point: "彻底失败反解脱" },
      bond: { attitude_to_others: "温和有距", intimate_pattern: "笨拙真诚", hostile_pattern: "以理服人", group_role: "关键时刻顶" },
    },
  },
  {
    id: "orphan", name: "孤儿", summary: "过早学会独站，不太会依靠",
    data: {
      contour: { appearance: "耐看型", age_era: "刚成年", identity: "学生", first_impression: "有故事" },
      demeanor: { speech_style: "习惯自嘲", habits: "自言自语", typical_reaction: "先退一步", expressiveness: "熟人才能懂" },
      psyche: { desire: "找到位置", fear: "被放弃", conflict: "靠近怕受伤", self_perception: "评价过低" },
      anchor: { essence: "本可走却留", theme: "归属", core_belief: "没什么过不去" },
      trace: { background: "普通长大", turning_point: "重要的人离去或到来" },
      bond: { attitude_to_others: "总有戒心", intimate_pattern: "怕太依赖", hostile_pattern: "退一步回击", group_role: "默默做完" },
    },
  },
  {
    id: "lover", name: "爱人者", summary: "为某人或某种信念倾尽所有",
    data: {
      contour: { appearance: "长发柔和", age_era: "二十五六", identity: "创作者", first_impression: "值得信任" },
      demeanor: { speech_style: "声音不大", habits: "爱记笔记", typical_reaction: "先问还好吗", expressiveness: "什么都写在脸上" },
      psyche: { desire: "深度连接", fear: "失控", conflict: "又爱又恨", self_perception: "不擅亲密" },
      anchor: { essence: "嘴上不在乎", theme: "爱", core_belief: "爱能战胜一切" },
      trace: { background: "社区长大", turning_point: "濒死经历" },
      bond: { attitude_to_others: "先付出", intimate_pattern: "容易理想化", hostile_pattern: "化怒为力", group_role: "关系粘合剂" },
    },
  },
  {
    id: "ruler", name: "统治者", summary: "掌控全局是本能，放松是奢望",
    data: {
      contour: { appearance: "着装正式", age_era: "三十上下", identity: "管理者", first_impression: "气场强大" },
      demeanor: { speech_style: "言简意赅", habits: "随手整理", typical_reaction: "立刻解决", expressiveness: "刻意控制" },
      psyche: { desire: "掌控生活", fear: "失控", conflict: "责任与欲望", self_perception: "别人的依靠" },
      anchor: { essence: "一人扛所有", theme: "守护", core_belief: "力量即责任" },
      trace: { background: "背负期望", turning_point: "彻底失败反解脱" },
      bond: { attitude_to_others: "只分里外", intimate_pattern: "只顾照顾", hostile_pattern: "正面交锋", group_role: "拿主意的人" },
    },
  },
  {
    id: "creator", name: "创造者", summary: "活在自己的世界里，偶尔探出头",
    data: {
      contour: { appearance: "打扮随性", age_era: "二十五六", identity: "创作者", first_impression: "古怪有趣" },
      demeanor: { speech_style: "滔滔不绝", habits: "熬夜党", typical_reaction: "幽默化解", expressiveness: "什么都写在脸上" },
      psyche: { desire: "留下痕迹", fear: "平庸", conflict: "自由与归属", self_perception: "不敢用天赋" },
      anchor: { essence: "一直在找归处", theme: "寻己", core_belief: "自由高于一切" },
      trace: { background: "备受宠爱", turning_point: "做成不可能的事" },
      bond: { attitude_to_others: "来者不拒", intimate_pattern: "容易理想化", hostile_pattern: "快速翻篇", group_role: "点子王不执行" },
    },
  },
  {
    id: "explorer", name: "探险者", summary: "边界是用来打破的",
    data: {
      contour: { appearance: "肤色黝黑", age_era: "二十出头", identity: "旅居者", first_impression: "过目不忘" },
      demeanor: { speech_style: "快人快语", habits: "走路快", typical_reaction: "直接对峙", expressiveness: "自然流露" },
      psyche: { desire: "探索边界", fear: "平庸", conflict: "现状与冒险", self_perception: "比自己想的有力" },
      anchor: { essence: "让世界变好一点", theme: "自由", core_belief: "命由己造" },
      trace: { background: "漂泊不定", turning_point: "第一次远行" },
      bond: { attitude_to_others: "来者不拒", intimate_pattern: "热烈后冷却", hostile_pattern: "快速翻篇", group_role: "独行者" },
    },
  },
  {
    id: "everyman", name: "凡人", summary: "普通就是最大的不普通",
    data: {
      contour: { appearance: "平平无奇", age_era: "二十五六", identity: "上班族", first_impression: "温暖亲切" },
      demeanor: { speech_style: "温和有礼", habits: "雷打不动早起", typical_reaction: "先问还好吗", expressiveness: "什么都写在脸上" },
      psyche: { desire: "安稳度日", fear: "被遗忘", conflict: "现状与冒险", self_perception: "评价过低" },
      anchor: { essence: "温柔而坚定", theme: "归属", core_belief: "没什么过不去" },
      trace: { background: "普通长大", turning_point: "孩子的出生" },
      bond: { attitude_to_others: "先付出", intimate_pattern: "细水长流", hostile_pattern: "快速翻篇", group_role: "定海神针" },
    },
  },
  {
    id: "rebel", name: "反抗者", summary: "对一切说「不」，包括自己",
    data: {
      contour: { appearance: "纹身醒目", age_era: "刚成年", identity: "无业游民", first_impression: "不好接近" },
      demeanor: { speech_style: "暗藏讽刺", habits: "抽烟或嚼糖", typical_reaction: "直接对峙", expressiveness: "温和但会爆发" },
      psyche: { desire: "活得真实", fear: "被控制", conflict: "规则与良心间横跳", self_perception: "藏得很深" },
      anchor: { essence: "规则与良心间横跳", theme: "反抗", core_belief: "自由高于一切" },
      trace: { background: "贫苦知艰", turning_point: "被背叛" },
      bond: { attitude_to_others: "总有戒心", intimate_pattern: "测试底线", hostile_pattern: "永不原谅", group_role: "独行者" },
    },
  },
  {
    id: "innocent", name: "纯真者", summary: "相信美好，哪怕被伤害过",
    data: {
      contour: { appearance: "面容稚嫩", age_era: "刚成年", identity: "学生", first_impression: "温暖亲切" },
      demeanor: { speech_style: "快人快语", habits: "笑点奇怪", typical_reaction: "先问还好吗", expressiveness: "什么都写在脸上" },
      psyche: { desire: "被接纳", fear: "被放弃", conflict: "想被看见又怕", self_perception: "比看起来脆弱" },
      anchor: { essence: "温柔而坚定", theme: "爱", core_belief: "人性本善" },
      trace: { background: "备受宠爱", turning_point: "看到更大的世界" },
      bond: { attitude_to_others: "先付出", intimate_pattern: "笨拙真诚", hostile_pattern: "快速翻篇", group_role: "开心果" },
    },
  },
  {
    id: "jester", name: "小丑", summary: "看透一切，选择用荒唐面对",
    data: {
      contour: { appearance: "打扮随性", age_era: "看不出年纪", identity: "自由职业", first_impression: "古怪有趣" },
      demeanor: { speech_style: "滔滔不绝", habits: "笑点奇怪", typical_reaction: "幽默化解", expressiveness: "自以为藏很好" },
      psyche: { desire: "活得真实", fear: "被看穿", conflict: "想被看见又怕", self_perception: "藏得很深" },
      anchor: { essence: "笑藏太多东西", theme: "自由", core_belief: "软弱不可耻" },
      trace: { background: "漂泊不定", turning_point: "做成不可能的事" },
      bond: { attitude_to_others: "来者不拒", intimate_pattern: "测试底线", hostile_pattern: "冷处理", group_role: "开心果" },
    },
  },
  {
    id: "hermit", name: "隐士", summary: "主动选择的孤独，不是逃避",
    data: {
      contour: { appearance: "白发苍苍", age_era: "五十知天命", identity: "退休", first_impression: "安静寡言" },
      demeanor: { speech_style: "惜字如金", habits: "自言自语", typical_reaction: "先观察", expressiveness: "喜怒不上脸" },
      psyche: { desire: "追求极致", fear: "真正的孤独", conflict: "自由与归属", self_perception: "比自己想的有力" },
      anchor: { essence: "害怕孤独却选择孤独", theme: "寻己", core_belief: "时间最强" },
      trace: { background: "富裕孤独", turning_point: "彻底失败反解脱" },
      bond: { attitude_to_others: "宁缺毋滥", intimate_pattern: "需要空间又想要伴", hostile_pattern: "以理服人", group_role: "旁观全知" },
    },
  }
];