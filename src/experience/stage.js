import { qs } from '../ui/dom-utils.js';
import { DEFAULT_SCENE, resolveScene } from '../config/scenes.js';

const RAIN_STATE = {
  mouse: { x: 0.5, y: 0.5 }
};

export function setRainMouse(x, y) {
  RAIN_STATE.mouse.x = x;
  RAIN_STATE.mouse.y = y;
}

function createOverlay(stage) {
  stage.innerHTML = `
    <canvas id="bg-canvas"></canvas>
    <canvas id="scene-canvas"></canvas>
    <canvas id="fx-canvas"></canvas>
    <canvas id="spectrum-canvas"></canvas>
  `;
  return {
    background: stage.querySelector('#bg-canvas'),
    scene: stage.querySelector('#scene-canvas'),
    fx: stage.querySelector('#fx-canvas'),
    spectrum: stage.querySelector('#spectrum-canvas')
  };
}

function resolveStageContext(options = {}) {
  const { container = null, canvases = {} } = options;
  if (container && canvases.background && canvases.scene && canvases.fx) {
    return { stage: container, container, canvases };
  }

  let stage = container || qs('#experience-stage');
  if (!stage) {
    stage = document.createElement('div');
    stage.id = 'experience-stage';
    document.body.prepend(stage);
  }

  let resolved = canvases;
  if (!resolved.background || !resolved.scene || !resolved.fx) {
    resolved = createOverlay(stage);
  }

  return {
    stage,
    container: container || stage,
    canvases: resolved
  };
}

class VisualEngine {
  constructor(container, canvases) {
    this.container = container;
    this.bg = canvases.background;
    this.scene = canvases.scene;
    this.fx = canvases.fx;
    this.spectrum = canvases.spectrum;
    this.bgCtx = this.bg?.getContext('2d') || null;
    this.sceneCtx = this.scene?.getContext('2d') || null;
    this.fxCtx = this.fx?.getContext('2d') || null;
    this.spectrumCtx = this.spectrum?.getContext('2d') || null;
    this.sceneKey = DEFAULT_SCENE;
    this.sceneConfig = resolveScene(this.sceneKey);
    this.pixelRatio = window.devicePixelRatio || 1;
    this.drops = [];
    this.clouds = [];
    this.lightning = 0;
    this.lightningX = 0.5;
    this.ticker = 0;
    this.resizeHandler = () => this.resize();
    this.resize();
    window.addEventListener('resize', this.resizeHandler);
    this.loop();
  }

  resize() {
    const target = this.container || this.bg?.parentElement || document.body;
    const rect = target.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.pixelRatio = window.devicePixelRatio || 1;
    this.syncCanvasSize(this.bg, this.bgCtx, this.width, this.height);
    this.syncCanvasSize(this.scene, this.sceneCtx, this.width, this.height);
    this.syncCanvasSize(this.fx, this.fxCtx, this.width, this.height);
    const spectrumRect = this.spectrum ? this.spectrum.getBoundingClientRect() : null;
    this.spectrumWidth = spectrumRect?.width || this.width;
    this.spectrumHeight = spectrumRect?.height || Math.min(80, this.height * 0.2);
    this.syncCanvasSize(this.spectrum, this.spectrumCtx, this.spectrumWidth, this.spectrumHeight);
    this.initDrops();
    this.initClouds();
  }

  syncCanvasSize(canvas, ctx, width, height) {
    if (!canvas || !ctx) return;
    canvas.width = width * this.pixelRatio;
    canvas.height = height * this.pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
  }

  initDrops() {
    const area = this.width * this.height;
    const count = Math.min(1600, Math.max(400, Math.floor(area / 2600)));
    this.drops = Array.from({ length: count }, () => this.createDrop(true));
  }

  createDrop(initial = false) {
    return {
      x: Math.random() * this.width,
      y: initial ? Math.random() * this.height : -Math.random() * this.height,
      length: 12 + Math.random() * 20,
      speed: 14 + Math.random() * 8,
      drift: -0.3 + Math.random() * 0.6,
      opacity: 0.4 + Math.random() * 0.4
    };
  }

  initClouds() {
    const count = 18;
    this.clouds = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * (this.height * 0.35),
      width: 140 + Math.random() * 220,
      height: 40 + Math.random() * 70,
      opacity: 0.05 + Math.random() * 0.18,
      drift: -0.15 + Math.random() * 0.3
    }));
  }

  setScene(sceneKey) {
    this.sceneKey = sceneKey || DEFAULT_SCENE;
    this.sceneConfig = resolveScene(this.sceneKey);
  }

  updateDrops() {
    if (!this.drops.length) return;
    const tilt = (RAIN_STATE.mouse.x - 0.5) * (this.sceneConfig.visuals?.parallax || 0.35) * 6;
    this.drops.forEach((drop, index) => {
      drop.y += drop.speed;
      drop.x += tilt + drop.drift;
      if (drop.y > this.height + drop.length || drop.x < -60 || drop.x > this.width + 60) {
        this.drops[index] = this.createDrop();
      }
    });
  }

  drawBackground() {
    if (!this.bgCtx) return;
    const gradient = this.bgCtx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#111a38');
    gradient.addColorStop(1, '#050a1d');
    this.bgCtx.fillStyle = gradient;
    this.bgCtx.fillRect(0, 0, this.width, this.height);

    if (this.clouds?.length) {
      this.clouds.forEach((cloud) => {
        cloud.x += cloud.drift + (RAIN_STATE.mouse.x - 0.5) * 0.4;
        if (cloud.x > this.width + cloud.width) cloud.x = -cloud.width;
        if (cloud.x < -cloud.width) cloud.x = this.width + cloud.width;
        this.bgCtx.fillStyle = `rgba(6, 9, 20, ${cloud.opacity})`;
        this.bgCtx.beginPath();
        this.bgCtx.ellipse(cloud.x, cloud.y, cloud.width, cloud.height, 0, 0, Math.PI * 2);
        this.bgCtx.fill();
      });
    }
  }

  drawDrops() {
    if (!this.sceneCtx) return;
    this.sceneCtx.clearRect(0, 0, this.width, this.height);
    this.sceneCtx.lineWidth = 1.15;
    this.sceneCtx.lineCap = 'round';
    this.sceneCtx.strokeStyle = 'rgba(200, 220, 255, 0.92)';
    this.drops.forEach((drop) => {
      this.sceneCtx.globalAlpha = drop.opacity;
      this.sceneCtx.beginPath();
      this.sceneCtx.moveTo(drop.x, drop.y);
      this.sceneCtx.lineTo(drop.x + (RAIN_STATE.mouse.x - 0.5) * 6, drop.y - drop.length);
      this.sceneCtx.stroke();
    });
  }

  drawLightning() {
    if (!this.fxCtx) return;
    this.fxCtx.clearRect(0, 0, this.width, this.height);
    if (this.lightning <= 0.01) return;
    const ctx = this.fxCtx;
    const originX = this.width * (this.lightningX ?? 0.5);
    const gradient = ctx.createLinearGradient(originX, 0, originX, this.height);
    gradient.addColorStop(0, `rgba(255,255,255,${0.9 * this.lightning})`);
    gradient.addColorStop(0.3, `rgba(255,255,255,${0.4 * this.lightning})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height * 0.9);
    ctx.fillStyle = `rgba(255,255,255,${0.6 * this.lightning})`;
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX - 8, this.height * 0.45);
    ctx.lineTo(originX + 8, this.height * 0.45);
    ctx.closePath();
    ctx.fill();
    this.lightning *= 0.8;
  }

  drawSpectrum() {
    if (!this.spectrumCtx) return;
    const ctx = this.spectrumCtx;
    const height = this.spectrumHeight || 60;
    const bars = 32;
    ctx.clearRect(0, 0, this.spectrumWidth, height);
    for (let i = 0; i < bars; i += 1) {
      const progress = i / bars;
      const energy = (Math.sin(this.ticker * 0.08 + progress * 4) + 1) / 2;
      const barHeight = height * (0.2 + energy * 0.7);
      const x = (this.spectrumWidth / bars) * i;
      ctx.fillStyle = `rgba(118,200,255,${0.3 + energy * 0.5})`;
      ctx.fillRect(x, height - barHeight, (this.spectrumWidth / bars) * 0.6, barHeight);
    }
  }

  loop() {
    this.ticker += 1;
    this.drawBackground();
    this.updateDrops();
    this.drawDrops();
    this.drawLightning();
    this.drawSpectrum();
    requestAnimationFrame(() => this.loop());
  }

  triggerLightning() {
    this.lightning = 1;
    this.lightningX = Math.random() * 0.6 + 0.2;
  }
}

export function mountExperienceStage(options = {}) {
  const context = resolveStageContext(options);
  const { stage, container, canvases } = context;
  if (!canvases.background || !canvases.scene || !canvases.fx) {
    return {
      stage,
      setMode: () => {},
      pulse: () => {},
      celebrate: () => {},
      attachAudio: () => {},
      switchScene: () => {},
      triggerLightning: () => {}
    };
  }

  const visual = new VisualEngine(container, canvases);

  return {
    stage,
    setMode: () => {},
    pulse: () => {},
    celebrate: () => {},
    attachAudio: () => {},
    switchScene: (sceneKey) => visual.setScene(sceneKey),
    triggerLightning: () => visual.triggerLightning()
  };
}
