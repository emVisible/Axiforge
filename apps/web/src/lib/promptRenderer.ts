import type { CharacterData } from '@/types/character';

export type PromptFormat = 'plain' | 'markdown';

function section(title: string, body: string, format: PromptFormat): string {
  if (!body.trim()) return '';
  if (format === 'markdown') {
    return `## ${title}\n\n${body}\n`;
  }
  return `【${title}】\n${body}\n`;
}

function field(label: string, value: string | undefined | null, format: PromptFormat): string {
  if (!value) return '';
  if (format === 'markdown') {
    return `**${label}**：${value}\n`;
  }
  return `${label}：${value}\n`;
}

export function renderCharacterPrompt(data: CharacterData, format: PromptFormat = 'markdown'): string {
  const { contour, demeanor, psyche, anchor, trace, bond } = data;
  let prompt = '';

  // 锚点
  const anchorFields = [
    field('姓名', anchor?.name, format),
    field('概括', anchor?.essence, format),
    field('描述', anchor?.summary, format),
    anchor?.tags?.length ? field('标签', anchor.tags.join('、'), format) : '',
    field('人生主题', anchor?.theme, format),
    field('核心信念', anchor?.core_belief, format),
  ].join('');
  prompt += section('锚点', anchorFields, format);

  // 轮廓
  const contourFields = [
    field('外貌', contour?.appearance, format),
    field('年龄/时代', contour?.age_era, format),
    field('身份', contour?.identity, format),
    field('第一印象', contour?.first_impression, format),
  ].join('');
  prompt += section('轮廓', contourFields, format);

  // 举止
  const demeanorFields = [
    field('说话方式', demeanor?.speech_style, format),
    field('习惯', demeanor?.habits, format),
    field('常见反应', demeanor?.typical_reaction, format),
    field('情绪外露', demeanor?.expressiveness, format),
  ].join('');
  prompt += section('举止', demeanorFields, format);

  // 内心
  const psycheFields = [
    field('深层欲望', psyche?.desire, format),
    field('核心恐惧', psyche?.fear, format),
    field('内在矛盾', psyche?.conflict, format),
    field('自我认知', psyche?.self_perception, format),
  ].join('');
  prompt += section('内心', psycheFields, format);

  // 轨迹
  const traceFields = [
    field('出身', trace?.background, format),
    trace?.key_events?.length ? field('关键事件', trace.key_events.join('、'), format) : '',
    field('转折点', trace?.turning_point, format),
  ].join('');
  prompt += section('轨迹', traceFields, format);

  // 羁绊
  const bondFields = [
    field('对他人态度', bond?.attitude_to_others, format),
    field('亲密关系', bond?.intimate_pattern, format),
    field('敌对关系', bond?.hostile_pattern, format),
    field('群体角色', bond?.group_role, format),
  ].join('');
  prompt += section('羁绊', bondFields, format);

  return prompt.trim();
}

export function renderSystemPrompt(data: CharacterData): string {
  const { contour, anchor, demeanor, psyche } = data;
  const name = anchor?.name || '角色';

  return [
    `你是${name}。`,
    anchor?.essence ? `\n概括：${anchor.essence}` : '',
    anchor?.summary ? `\n描述：${anchor.summary}` : '',
    anchor?.tags?.length ? `\n标签：${anchor.tags.join('、')}` : '',
    anchor?.theme ? `\n人生主题：${anchor.theme}` : '',
    anchor?.core_belief ? `\n核心信念：${anchor.core_belief}` : '',
    contour?.first_impression ? `\n第一印象：${contour.first_impression}` : '',
    demeanor?.speech_style ? `\n说话方式：${demeanor.speech_style}` : '',
    demeanor?.habits ? `\n习惯：${demeanor.habits}` : '',
    psyche?.desire ? `\n深层欲望：${psyche.desire}` : '',
    psyche?.fear ? `\n核心恐惧：${psyche.fear}` : '',
    psyche?.conflict ? `\n内在矛盾：${psyche.conflict}` : '',
    psyche?.self_perception ? `\n自我认知：${psyche.self_perception}` : '',
    '\n请始终以上述设定进行对话，不要跳出角色。',
  ].filter(Boolean).join('');
}