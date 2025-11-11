import { createAppShell } from './ui/app-shell.js';
import { mountStepsNavigation } from './ui/steps-navigation.js';
import { mountNotificationsPanel } from './ui/notifications-panel.js';
import { mountAnomalyModal } from './ui/anomaly-modal.js';
import { qs } from './ui/dom-utils.js';
import { mountExperienceStage, setRainMouse } from './experience/stage.js';
import { mountAudioEngine } from './experience/audio-engine.js';
import { mountParseOptionsModal } from './ui/parse-options-modal.js';
import { mountLoadingOverlay } from './ui/loading-overlay.js';
import { DEFAULT_SCENE } from './config/scenes.js';
import { mountCardRouter } from './ui/card-router.js';

const app = createAppShell();
app.init();
const audio = mountAudioEngine();
const stage = mountExperienceStage();
stage?.switchScene?.(DEFAULT_SCENE);
app.setStageController(stage || null);

if (typeof window !== 'undefined') {
  window.__triggerRainLightning = () => stage?.triggerLightning?.();
}

const root = qs('#app-root');
if (root) {
  const overlay = createStartOverlay();
  // 将启动覆盖层挂载到 body，避免受 #app-root 透视/层叠影响
  document.body.appendChild(overlay);

  const layout = createAppLayout(Boolean(audio));
  root.appendChild(layout.container);

  // 整体卡片（app-shell）倾斜：对齐 index2 的算法
  attachIndex2Tilt(layout.container, layout.container);

  mountStepsNavigation(app, layout.navDock);
  mountCardRouter(app, layout.cardViewport);
  audio?.switchScene?.(DEFAULT_SCENE);

  if (layout.goFillBtn) {
    layout.goFillBtn.addEventListener('click', () => {
      const anchor = layout.cardViewport.querySelector('.card-meta') || document.querySelector('.card-meta');
      if (anchor && anchor.scrollIntoView) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // 手机端侧边栏（1 基础信息 / 2 昨日数据 / 3 生成报告）
  const sidebar = document.createElement('div');
  sidebar.className = 'mobile-sidebar';
  const btn1 = document.createElement('button');
  btn1.textContent = '1 基础信息';
  const btn2 = document.createElement('button');
  btn2.textContent = '2 昨日数据';
  const btn3 = document.createElement('button');
  btn3.textContent = '3 生成报告';
  sidebar.append(btn1, btn2, btn3);
  document.body.appendChild(sidebar);

  // 让侧边栏始终贴在可视区右缘：通过 JS 直接定位 left
  const vv = window.visualViewport;
  const positionSidebar = () => {
    const pageLeft = vv && typeof vv.pageLeft === 'number' ? vv.pageLeft : (typeof window.pageXOffset === 'number' ? window.pageXOffset : (document.documentElement.scrollLeft || 0));
    const vWidth = vv && typeof vv.width === 'number' ? vv.width : window.innerWidth;
    const safeRight = 12; // 右侧安全间距（可按需微调）
    const width = sidebar.offsetWidth || 0;
    const left = Math.max(0, pageLeft + vWidth - width - safeRight);
    sidebar.style.left = `${left}px`;
    sidebar.style.right = 'auto';
  };
  positionSidebar();
  vv?.addEventListener('scroll', positionSidebar);
  vv?.addEventListener('resize', positionSidebar);
  window.addEventListener('scroll', positionSidebar, { passive: true });
  window.addEventListener('resize', positionSidebar);

  const gotoStepAndScroll = (stepId) => {
    // 切换步骤
    app.goToStep(stepId);
    // 等待面板渲染后滚动到锚点
    const tryScroll = (attempt = 0) => {
      const anchor = layout.cardViewport.querySelector('.card-meta');
      if (anchor && anchor.scrollIntoView) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempt < 10) {
        requestAnimationFrame(() => tryScroll(attempt + 1));
      }
    };
    requestAnimationFrame(() => tryScroll());
  };

  btn1.addEventListener('click', () => gotoStepAndScroll(1));
  btn2.addEventListener('click', () => gotoStepAndScroll(2));
  btn3.addEventListener('click', () => gotoStepAndScroll(3));

  const syncSidebarActive = () => {
    const step = app.store.state.currentStep || 1;
    [btn1, btn2, btn3].forEach((b, i) => {
      b.classList.toggle('active', step === i + 1);
    });
  };
  syncSidebarActive();
  app.store.subscribe(syncSidebarActive);

  if (audio && layout.audioGroup) {
    setupAudioControls(audio, layout.audioGroup);
  }

  const updateTime = () => {
    layout.timeText.textContent = new Date().toLocaleTimeString();
  };
  updateTime();
  setInterval(updateTime, 30 * 1000);

  const renderHero = () => {
    const state = app.store.state;
    layout.heroTitle.textContent = state.formData.stationName || '宝湖加油站';
    layout.subtitleText.textContent = `今日 ${state.formData.date || '未设置日期'} · 期望昨日 ${state.expectedYesterdayDate || '未设置'}`;
    layout.trackName.textContent = '雨夜声景';
    layout.totalStatValue.textContent = `${formatNumber(state.calculatedResults.totalSales)} 吨`;
    layout.monthlyStatValue.textContent = `${formatNumber(state.calculatedResults.monthlyTotal)} 吨`;
    const evalRate = Number(state.calculatedResults.evaluationRate) || 0;
    layout.evalStatValue.textContent = `${evalRate.toFixed(1)}%`;
    layout.parsingBadge.textContent = state.yesterdayData.parsed ? '解析就绪' : '待解析';
    layout.parsingBadge.classList.toggle('active', state.yesterdayData.parsed);
    layout.modeBadge.textContent = state.demoMode ? '演示模式' : '生产模式';
    layout.modeBadge.classList.toggle('active', state.demoMode);
    layout.stepBadge.textContent = `阶段 ${state.currentStep}/${state.steps.length}`;
  };

  renderHero();
  app.store.subscribe(renderHero);

  // 锁定背景滚动，阻止滚动链
  const preventScroll = (e) => { e.preventDefault(); };
  const lockBodyScroll = () => {
    document.documentElement.classList.add('overlay-open');
    document.body.classList.add('overlay-open');
    overlay.addEventListener('wheel', preventScroll, { passive: false });
    overlay.addEventListener('touchmove', preventScroll, { passive: false });
  };
  const unlockBodyScroll = () => {
    document.documentElement.classList.remove('overlay-open');
    document.body.classList.remove('overlay-open');
    overlay.removeEventListener('wheel', preventScroll, { passive: false });
    overlay.removeEventListener('touchmove', preventScroll, { passive: false });
  };
  lockBodyScroll();

  const handleStart = () => {
    overlay.classList.add('hidden');
    stage?.pulse?.(DEFAULT_SCENE);
    audio?.switchScene?.(DEFAULT_SCENE);
    audio?.unlock?.();
    setTimeout(() => { unlockBodyScroll(); overlay.remove(); }, 900);
  };

  // 移除背景点击进入，仅允许按下按钮进入
  overlay.querySelector('button')?.addEventListener('click', (event) => {
    event.stopPropagation();
    handleStart();
  });

  // 复制微信号：H2 与副文案共用逻辑；反馈仅显示在 H2
  const copyHeading = overlay.querySelector('#copy-wechat');
  const copyInfo = overlay.querySelector('#copy-info');
  const copySubtitle = overlay.querySelector('.overlay-subtitle');
  const copyWeChat = async (e) => {
    if (e) {
      e.stopPropagation?.();
      e.stopImmediatePropagation?.();
      e.preventDefault?.();
    }
    const text = 'stood__up';
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); copied = true; } catch (_) {}
    }
    if (!copied) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); copied = true; } catch (_) {}
      ta.remove();
    }
    if (copied && copyHeading) {
      const old = copyHeading.textContent;
      copyHeading.textContent = `已复制：${text}`;
      setTimeout(() => { copyHeading.textContent = old; }, 1200);
    }
  };
  copyHeading?.addEventListener('click', copyWeChat, { capture: true });
  copyInfo?.addEventListener('click', copyWeChat, { capture: true });
  copySubtitle?.addEventListener('click', copyWeChat, { capture: true });

  const thunderSelector = ['input', 'button', 'textarea', 'select', 'label', 'a'].join(',');
  layout.container.addEventListener('click', (event) => {
    const target = event.target;
    if (target.closest(thunderSelector)) return;
    if (target.closest('.panel')) return;
    if (target.closest('.steps-nav')) return;
    stage?.triggerLightning?.();
    audio?.triggerThunder?.();
  });

}

mountNotificationsPanel(app);
mountAnomalyModal(app);
mountParseOptionsModal(app);
mountLoadingOverlay(app);

// 暂时暴露到 window 以便调试
window.__gasStationApp = app;

function createStartOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'start-overlay';
  overlay.innerHTML = `
    <div class="overlay-content">
      <h2 id="copy-wechat" title="点击复制微信号">微信:stood__up</h2>
      <div class="overlay-subtitle">加油站小程序</div>
      <p id="copy-info" class="copy-click">点击此处复制微信号 · 免费为您和贵公司提供软件开发服务</p>
      
      <button type="button">进入体验</button>
    </div>
  `;
  return overlay;
}

function createAppLayout(enableAudio) {
  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const header = document.createElement('header');

  const heroLeft = document.createElement('div');
  heroLeft.className = 'hero-left';
  const heroTitle = document.createElement('h1');
  heroTitle.className = 'hero-title';
  const heroSubtitle = document.createElement('div');
  heroSubtitle.className = 'hero-subtitle';
  const liveIndicator = document.createElement('div');
  liveIndicator.className = 'live-indicator';
  const subtitleText = document.createElement('span');
  heroSubtitle.append(liveIndicator, subtitleText);
  const trackInfo = document.createElement('div');
  trackInfo.className = 'now-playing';
  const trackLabel = document.createElement('span');
  trackLabel.className = 'track-label';
  trackLabel.textContent = 'Now Generating';
  const trackName = document.createElement('span');
  trackName.className = 'track-name';
  trackInfo.append(trackLabel, trackName);
  const timeText = document.createElement('div');
  timeText.id = 'time-text';
  heroLeft.append(heroTitle, heroSubtitle, trackInfo, timeText);

  const heroStats = document.createElement('div');
  heroStats.className = 'hero-stats';
  const createStatBlock = (label) => {
    const block = document.createElement('div');
    const nameEl = document.createElement('span');
    nameEl.textContent = label;
    const strong = document.createElement('strong');
    const valEl = document.createElement('span');
    valEl.className = 'stat-val';
    valEl.textContent = '--';
    strong.append(valEl);
    block.append(nameEl, strong);
    heroStats.appendChild(block);
    return valEl;
  };
  const totalStatValue = createStatBlock('今日总销量');
  const monthlyStatValue = createStatBlock('月累计');
  const evalStatValue = createStatBlock('测评率');

  const heroControls = document.createElement('div');
  heroControls.className = 'hero-controls';
  const goFillBtn = document.createElement('button');
  goFillBtn.type = 'button';
  goFillBtn.className = 'start-fill-btn';
  goFillBtn.textContent = '去填写';
  heroControls.appendChild(goFillBtn);
  const parsingBadge = document.createElement('span');
  parsingBadge.className = 'status-badge';
  const modeBadge = document.createElement('span');
  modeBadge.className = 'status-badge';
  const stepBadge = document.createElement('span');
  stepBadge.className = 'status-badge';
  heroControls.append(parsingBadge, modeBadge, stepBadge);

  let audioGroup = null;
  if (enableAudio) {
    audioGroup = document.createElement('div');
    audioGroup.className = 'audio-group';
    heroControls.appendChild(audioGroup);
  }

  const heroCard = document.createElement('div');
  heroCard.className = 'hero-card';
  heroCard.append(heroLeft, heroStats, heroControls);

  header.appendChild(heroCard);
  shell.appendChild(header);

  const shellBody = document.createElement('div');
  shellBody.className = 'shell-body';
  const navColumn = document.createElement('div');
  navColumn.className = 'panel-stack';
  const navDock = document.createElement('div');
  navColumn.appendChild(navDock);
  const contentColumn = document.createElement('div');
  contentColumn.className = 'panel-stack wide';
  const cardViewport = document.createElement('div');
  cardViewport.className = 'card-viewport';
  contentColumn.appendChild(cardViewport);
  shellBody.append(navColumn, contentColumn);
  shell.appendChild(shellBody);

  return {
    container: shell,
    heroCard,
    navDock,
    cardViewport,
    goFillBtn,
    audioGroup,
    heroTitle,
    subtitleText,
    trackName,
    timeText,
    totalStatValue,
    monthlyStatValue,
    evalStatValue,
    parsingBadge,
    modeBadge,
    stepBadge
  };
}

function setupAudioControls(audioEngine, group) {
  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = '0';
  volumeSlider.max = '100';
  volumeSlider.value = Math.round((audioEngine.getVolume?.() ?? 0.8) * 100);

  const muteButton = document.createElement('button');
  muteButton.type = 'button';

  const updateMuteButton = () => {
    const currentVolume = audioEngine.getVolume?.() ?? 0;
    muteButton.textContent = currentVolume <= 0.01 ? '🔇' : '🎧';
  };

  volumeSlider.addEventListener('input', () => {
    const value = Number(volumeSlider.value) / 100;
    audioEngine.setVolume?.(value);
    updateMuteButton();
  });

  muteButton.addEventListener('click', () => {
    audioEngine.toggleMute?.();
    volumeSlider.value = Math.round((audioEngine.getVolume?.() ?? 0) * 100);
    updateMuteButton();
  });

  updateMuteButton();
  group.append(volumeSlider, muteButton);
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
}

// 完全对齐 index2.html 的倾斜算法：
// x,y 取值范围 [-1, 1]，目标 transform：rotateY(x*10deg) rotateX(-y*10deg)
function attachIndex2Tilt(container, target) {
  if (!container || !target) return;
  let rect = container.getBoundingClientRect();
  let tx = 0, ty = 0; // 目标 tilt（-1..1）
  let cx = 0, cy = 0; // 当前 tilt（-1..1）
  const maxDeg = 10;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const recalc = () => { rect = container.getBoundingClientRect(); };
  window.addEventListener('resize', recalc);
  container.addEventListener('pointerenter', recalc);

  const updateTarget = (e) => {
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    // 边缘稳定：略微收缩有效区域，避免临界值跳变
    tx = clamp(nx, -0.98, 0.98);
    ty = clamp(ny, -0.98, 0.98);
  };

  const animate = () => {
    // 平滑追踪，抑制抖动
    cx = lerp(cx, tx, 0.12);
    cy = lerp(cy, ty, 0.12);
    target.style.transform = `rotateY(${cx * maxDeg}deg) rotateX(${cy * -maxDeg}deg)`;
    // 同步雨幕坐标（0..1）
    setRainMouse((cx + 1) / 2, (cy + 1) / 2);
    requestAnimationFrame(animate);
  };
  animate();

  const onLeave = () => { tx = 0; ty = 0; };

  container.addEventListener('mousemove', updateTarget);
  container.addEventListener('mouseleave', onLeave);

  // 移动端：点一下瞬时倾斜，随后自动回正
  container.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return; // 桌面端仍由 mousemove 控制
    updateTarget(e);
    // 轻触后快速回正，避免持续倾斜
    setTimeout(() => { tx = 0; ty = 0; }, 180);
  });
  container.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    tx = 0; ty = 0;
  });
  container.addEventListener('pointercancel', () => { tx = 0; ty = 0; });
}

function addTiltEffect(container, target = container) {
  if (!container || !target) return;
  let baseRect = container.getBoundingClientRect();
  const maxTilt = 8;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const reset = () => {
    target.style.transform = 'rotateY(0deg) rotateX(0deg)';
    target.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.45)';
    setRainMouse(0.5, 0.5);
  };

  const recalc = () => {
    baseRect = container.getBoundingClientRect();
  };

  window.addEventListener('resize', recalc);

  const applyTilt = (event) => {
    const offsetX = event.clientX - (baseRect.left + baseRect.width / 2);
    const offsetY = event.clientY - (baseRect.top + baseRect.height / 2);
    const rotateY = (offsetX / baseRect.width) * maxTilt;
    const rotateX = (offsetY / baseRect.height) * -maxTilt;
    target.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    target.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2}px 45px rgba(0, 0, 0, 0.45)`;
    const normX = clamp((event.clientX - baseRect.left) / baseRect.width, 0, 1);
    const normY = clamp((event.clientY - baseRect.top) / baseRect.height, 0, 1);
    setRainMouse(normX, normY);
  };

  container.addEventListener('pointermove', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    applyTilt(event);
  });

  // 桌面端兜底：mousemove 直接跟随，无需点击
  container.addEventListener('mousemove', (event) => {
    applyTilt(event);
  });

  container.addEventListener('pointerdown', applyTilt);

  ['pointerleave', 'pointerup'].forEach((type) => {
    container.addEventListener(type, reset);
  });
}
