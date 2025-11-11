import { getStepLayout } from '../config/steps-layout.js';
import { mountStepsPanel } from './steps-panel.js';
import { mountParserPanel } from './parser-panel.js';
import { mountReportPanel } from './report-panel.js';

const PANEL_FACTORIES = {
  form: (app, host) => mountStepsPanel(app, host),
  parser: (app, host) => mountParserPanel(app, host),
  report: (app, host) => mountReportPanel(app, host)
};

export function mountCardRouter(app, mountPoint) {
  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const host = document.createElement('div');
  host.className = 'card-host';
  mountPoint.append(meta, host);

  let mountedPanel = null;
  let currentStep = 0;

  const destroyPanel = () => {
    if (mountedPanel?.destroy) {
      mountedPanel.destroy();
    }
    mountedPanel = null;
    host.innerHTML = '';
  };

  const render = (stepIndex) => {
    const layout = getStepLayout(stepIndex);
    meta.innerHTML = `
      <div class="card-meta__stage">
        <span>STEP ${layout.id}</span>
        <strong>${layout.name}</strong>
      </div>
      <div class="card-meta__titles">
        <h2>${layout.cardTitle}</h2>
        <p>${layout.cardSubtitle}</p>
      </div>
    `;

    destroyPanel();
    const factory = PANEL_FACTORIES[layout.panel];
    if (!factory) {
      host.innerHTML = '<section class="panel"><p>未配置该步骤面板</p></section>';
      return;
    }
    mountedPanel = factory(app, host) || null;
    host.classList.remove('entering');
    void host.offsetWidth;
    host.classList.add('entering');
  };

  const unsubscribe = app.store.subscribe(() => {
    const nextStep = app.store.state.currentStep;
    if (nextStep !== currentStep) {
      currentStep = nextStep;
      render(nextStep);
    }
  });

  currentStep = app.store.state.currentStep;
  render(currentStep);

  return {
    destroy() {
      unsubscribe?.();
      destroyPanel();
      meta.remove();
      host.remove();
    }
  };
}
