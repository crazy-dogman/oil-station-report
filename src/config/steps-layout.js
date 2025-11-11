export const STEP_LAYOUTS = [
  {
    id: 1,
    name: '基础信息',
    title: '📅 设置日期和基本信息',
    panel: 'form',
    cardTitle: '基础信息填报',
    cardSubtitle: '填写站点信息、日期及全部基础指标'
  },
  {
    id: 2,
    name: '昨日数据',
    title: '📋 粘贴昨日数据(可选)',
    panel: 'parser',
    cardTitle: '昨日数据解析',
    cardSubtitle: '粘贴微信消息并自动抽取昨日日报'
  },
  {
    id: 3,
    name: '生成报告',
    title: '📄 生成标准报告',
    panel: 'report',
    cardTitle: '报告生成与复制',
    cardSubtitle: '生成/复制标准日报并推送通知'
  }
];

const STEP_MAP = STEP_LAYOUTS.reduce((acc, layout) => {
  acc.set(layout.id, layout);
  return acc;
}, new Map());

export function listStepLayouts() {
  return [...STEP_LAYOUTS];
}

export function getStepLayout(stepIndex) {
  if (!stepIndex) return STEP_LAYOUTS[0];
  return STEP_MAP.get(stepIndex) || STEP_LAYOUTS[Math.min(stepIndex - 1, STEP_LAYOUTS.length - 1)] || STEP_LAYOUTS[0];
}

export function createDefaultSteps() {
  return STEP_LAYOUTS.map(({ id, name, title }) => ({
    id,
    name,
    title,
    completed: false
  }));
}
