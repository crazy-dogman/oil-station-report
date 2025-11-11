export const DEFAULT_SCENE = 'rain';

const SCENE_PRESETS = [
  {
    key: 'rain',
    label: '雨天',
    description: '冷色雨幕 + 细腻流光',
    audio: '/audio/xiayu.mp3',
    visuals: {
      hue: 200,
      particleColor: 'rgba(118,200,255,0.85)',
      connectionColor: 'rgba(118,200,255,0.25)',
      parallax: 0.35
    }
  },
  {
    key: 'demo',
    label: '演示模式',
    description: '演示/脉冲场景专用',
    audio: '/audio/niaojiao.mp3',
    visuals: {
      hue: 280,
      particleColor: 'rgba(255,118,255,0.75)',
      connectionColor: 'rgba(255,118,255,0.25)',
      parallax: 0.3
    },
    hidden: true
  }
];

const SCENE_MAP = SCENE_PRESETS.reduce((acc, scene) => {
  acc[scene.key] = scene;
  return acc;
}, {});

export function listScenes(includeHidden = false) {
  if (includeHidden) return [...SCENE_PRESETS];
  return SCENE_PRESETS.filter((scene) => !scene.hidden);
}

export function resolveScene(key) {
  if (!key) return SCENE_MAP[DEFAULT_SCENE];
  return SCENE_MAP[key] || SCENE_MAP[DEFAULT_SCENE];
}

export function getSceneAudio(key) {
  return resolveScene(key).audio;
}

export function getSceneVisuals(key) {
  return resolveScene(key).visuals;
}

export function getSceneLabel(key) {
  return resolveScene(key).label;
}
