import { render } from './dom-utils.js';

const severityClass = (level = '') => {
  if (level === 'high' || level === '高') return 'severity-high';
  if (level === 'medium' || level === '中') return 'severity-medium';
  return 'severity-low';
};

const template = (anomalies) => `
  <div class="modal-overlay">
    <div class="modal">
      <header>
        <h3>异常详情 (${anomalies.length})</h3>
        <button data-close>×</button>
      </header>
      <ul class="anomaly-list">
        ${anomalies.map((item) => `
          <li>
            <div class="${severityClass(item.severity)}">${item.message}</div>
            ${item.data ? `<small>${JSON.stringify(item.data)}</small>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  </div>
`;

export function mountAnomalyModal(app) {
  const mountPoint = document.createElement('div');
  document.body.appendChild(mountPoint);

  const renderModal = () => {
    const { uiState, anomalies } = app.store.state;
    if (!uiState.showAnomalyModal || anomalies.length === 0) {
      mountPoint.innerHTML = '';
      return;
    }

    render(template(anomalies), mountPoint);
    mountPoint.querySelector('[data-close]').addEventListener('click', () => {
      app.toggleAnomalyModal(false);
    });
  };

  renderModal();
  app.store.subscribe(renderModal);
}
