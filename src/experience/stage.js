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
    this.lightning = 0;         // 0..1 当前闪电强度
    this.lightningX = 0.5;      // 闪电中心（0..1）
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
    // 取消乌云渲染
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
    const ctx = this.fxCtx;
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.lightning <= 0.01) return; // 取消连环闪

    const originX = this.width * (this.lightningX ?? 0.5);
    const H = this.height;
    const W = this.width;

    ctx.save();

    // 1) 全屏轻闪（极致明亮档位X）
    const globalFlash = Math.min(0.95, 0.42 + this.lightning * 0.58); // 0.42~0.95
    ctx.fillStyle = `rgba(255,255,255,${globalFlash})`;
    ctx.fillRect(0, 0, W, H);

    // 2) 竖向强光带（更宽、更亮，中心 100%）
    const bandHalf = Math.max(80, Math.min(180, W * 0.14)); // 80~180px 或 14% 宽
    const gradX = ctx.createLinearGradient(originX - bandHalf, 0, originX + bandHalf, 0);
    gradX.addColorStop(0, `rgba(255,255,255,0)`);
    gradX.addColorStop(0.5, `rgba(255,255,255,${1.0 * this.lightning})`);
    gradX.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = gradX;
    ctx.fillRect(0, 0, W, H);

    // 2.1) 两侧次强光带（提升体积感）
    const sideOffset = bandHalf * 1.6;
    const sideHalf = bandHalf * 0.65;
    const sideAlpha = 0.35 * this.lightning;
    const drawSide = (cx) => {
      const g = ctx.createLinearGradient(cx - sideHalf, 0, cx + sideHalf, 0);
      g.addColorStop(0, `rgba(255,255,255,0)`);
      g.addColorStop(0.5, `rgba(255,255,255,${sideAlpha})`);
      g.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    };
    drawSide(Math.max(0, Math.min(W, originX - sideOffset)));
    drawSide(Math.max(0, Math.min(W, originX + sideOffset)));

    // 取消倒三角楔形闪电

    // 4) 径向辉光（更高亮、更大半径）
    const glowRadius = Math.max(H * 0.62, W * 0.62);
    const rg = ctx.createRadialGradient(originX, H * 0.28, 0, originX, H * 0.28, glowRadius);
    rg.addColorStop(0, `rgba(255,255,255,${0.55 * this.lightning})`);
    rg.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();

    // 缩短持续时间：更快衰减（测试 0.77）
    this.lightning *= 0.77;
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
    // 取消顶部律动长方形（频谱）
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
