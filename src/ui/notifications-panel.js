import { render } from './dom-utils.js';

const template = (state) => {
  const items = state.notifications || [];
  return `
    <div class="toast-stack">
      ${items.map((item) => `
        <div class="toast ${item.type}" data-id="${item.id}">
          <span>${item.message}</span>
          <button data-dismiss="${item.id}" aria-label="关闭">×</button>
        </div>
      `).join('')}
    </div>
  `;
};

export function mountNotificationsPanel(app) {
  const mountPoint = document.createElement('div');
  mountPoint.id = 'toast-root';
  document.body.appendChild(mountPoint);

  const renderToasts = () => {
    render(template(app.store.state), mountPoint);
    mountPoint.querySelectorAll('button[data-dismiss]').forEach((btn) => {
      btn.addEventListener('click', () => {
        app.dismissNotification(btn.dataset.dismiss);
      });
    });
  };

  renderToasts();
  app.store.subscribe(renderToasts);
}
