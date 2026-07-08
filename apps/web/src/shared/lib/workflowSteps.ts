import type { WorkflowStep } from "@axiforge/ui";

export const PROJECT_WORKFLOW: WorkflowStep[] = [
  {
    title: "创建剧本",
    description: "写下故事梗概，设定叙事基调与基本结构",
  },
  {
    title: "编排画布",
    description: "在流程画布中连接场景、分支与角色互动",
  },
  {
    title: "发布游玩",
    description: "预览体验后发布，供玩家探索你的叙事世界",
  },
];

export const CHARACTER_WORKFLOW: WorkflowStep[] = [
  {
    title: "写角色 Brief",
    description: "描述性格、背景与叙事定位，作为生成起点",
  },
  {
    title: "生成变体",
    description: "基于六层模型生成外观、语音与行为特征",
  },
  {
    title: "审阅交付",
    description: "调整细节后保存，在剧本中引用该角色",
  },
];

export const ITEM_WORKFLOW: WorkflowStep[] = [
  {
    title: "定义道具",
    description: "命名、分类并描述道具在叙事中的作用",
  },
  {
    title: "配置属性",
    description: "设置图标、稀有度与可交互行为",
  },
  {
    title: "接入剧本",
    description: "在场景或流程节点中引用，驱动剧情推进",
  },
];

export const SCENE_WORKFLOW: WorkflowStep[] = [
  {
    title: "搭建场景",
    description: "设定地点、氛围与世界观背景",
  },
  {
    title: "布置资产",
    description: "关联角色立绘、背景图与音效资源",
  },
  {
    title: "复用模板",
    description: "保存为模板，在多部剧本中快速引用",
  },
];

export const DISCOVER_WORKFLOW: WorkflowStep[] = [
  {
    title: "浏览发现",
    description: "探索社区公开的剧本、角色与道具",
  },
  {
    title: "获取灵感",
    description: "阅读优秀作品，了解叙事编排方式",
  },
  {
    title: "开始创作",
    description: "创建你的第一部作品，加入创作者社区",
  },
];
