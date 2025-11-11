import { render } from './dom-utils.js';

const template = (state) => {
  const missing = state.missingFields || [];
  const anomalies = state.anomalies || [];
  return `
    <section class="panel">
      <h2>数据验证</h2>
      <button id="run-validation">🔍 开始验证</button>
      ${anomalies.length > 0 ? '<button id="view-anomalies" class="ghost">查看异常详情</button>' : ''}
      <div class="validation-block">
        <h3>缺失字段 (${missing.length})</h3>
        <ul>
          ${missing.map((item) => `<li>${item.label}</li>`).join('') || '<li>无</li>'}
        </ul>
      </div>
      <div class="validation-block">
        <h3>异常 (${anomalies.length})</h3>
        <ul>
          ${anomalies.map((item) => `<li>${item.message}</li>`).join('') || '<li>无</li>'}
        </ul>
      </div>
    </section>
  `;
};

export function mountValidationPanel(app, mountPoint) {
  const renderPanel = () => {
    render(template(app.store.state), mountPoint);
    mountPoint.querySelector('#run-validation').addEventListener('click', () => {
      app.validate();
      app.notify('已重新执行数据验证', 'info');
    });
    const viewBtn = mountPoint.querySelector('#view-anomalies');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        app.toggleAnomalyModal(true);
      });
    }
  };

  renderPanel();
  const unsubscribe = app.store.subscribe(renderPanel);

  return {
    destroy() {
      unsubscribe?.();
      mountPoint.innerHTML = '';
    }
  };
}
