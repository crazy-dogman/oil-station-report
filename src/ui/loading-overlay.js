import { render } from './dom-utils.js';

const template = (message) => `
  <div class="loading-overlay">
    <div class="spinner"></div>
    <p>${message || '处理中…'}</p>
  </div>
`;

export function mountLoadingOverlay(app) {
  const mountPoint = document.createElement('div');
  document.body.appendChild(mountPoint);

  const renderOverlay = () => {
    const { uiState } = app.store.state;
    if (!uiState.showLoading) {
      mountPoint.innerHTML = '';
      return;
    }
    render(template(uiState.loadingMessage), mountPoint);
  };

  renderOverlay();
  app.store.subscribe(renderOverlay);
}
