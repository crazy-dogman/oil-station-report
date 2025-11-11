import { render } from './dom-utils.js';

const template = (state) => {
  const steps = state.steps || [];
  return `
    <section class="panel steps-nav">
      <h2>流程导航</h2>
      <div class="step-tools">
        <button class="ghost" data-action="today">今日日期</button>
        <button data-action="demo">加载演示数据</button>
        <label class="demo-toggle">
          <input type="checkbox" ${state.demoMode ? 'checked' : ''} data-action="demo-toggle">
          演示模式
        </label>
      </div>
      <div class="steps-list">
        ${steps.map((step) => `
          <button class="step-chip ${step.id === state.currentStep ? 'active' : ''} ${step.completed ? 'completed' : ''}" data-step="${step.id}">
            <span>${step.id}</span>${step.name}
          </button>
        `).join('')}
      </div>
      <div class="steps-actions">
        <button class="ghost" data-action="prev">上一阶段</button>
        <span>STEP ${state.currentStep} / ${steps.length}</span>
        <button class="ghost" data-action="next">下一阶段</button>
      </div>
    </section>
  `;
};

export function mountStepsNavigation(app, mountPoint) {
  const renderPanel = () => {
    render(template(app.store.state), mountPoint);
    mountPoint.querySelectorAll('.step-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const step = Number(chip.dataset.step);
        app.goToStep(step);
      });
    });

    mountPoint.querySelector('[data-action="prev"]').addEventListener('click', () => app.prevStep());
    mountPoint.querySelector('[data-action="next"]').addEventListener('click', () => app.nextStep());
    mountPoint.querySelector('[data-action="today"]').addEventListener('click', () => app.setTodayDate());
    mountPoint.querySelector('[data-action="demo"]').addEventListener('click', () => app.loadDemoData());
    mountPoint.querySelector('[data-action="demo-toggle"]').addEventListener('change', (e) => app.toggleDemoMode(e.target.checked));
  };

  renderPanel();
  app.store.subscribe(renderPanel);
}
