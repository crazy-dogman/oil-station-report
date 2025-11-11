import { render } from './dom-utils.js';

const template = (state) => `
  <div class="modal-overlay">
    <div class="modal">
      <header>
        <h3>数据输入方式</h3>
        <button data-close>×</button>
      </header>
      <p>可选择以下方式获取昨日数据：</p>
      <ul class="parse-options">
        <li>
          <strong>粘贴微信消息</strong>
          <span>自动解析 92#/95#/98#、柴油、非油、电子券等字段。</span>
        </li>
        <li>
          <strong>手动补录</strong>
          <span>在表单中填写昨日数据保障环比与月累计准确。</span>
        </li>
        <li>
          <strong>演示模式</strong>
          <span>仅用于培训，示例数据不会保存。</span>
        </li>
      </ul>
      <div class="modal-actions">
        <button data-action="paste">去粘贴微信消息</button>
      </div>
    </div>
  </div>
`;

export function mountParseOptionsModal(app) {
  const mountPoint = document.createElement('div');
  document.body.appendChild(mountPoint);

  const renderModal = () => {
    const { uiState } = app.store.state;
    if (!uiState.showParseOptions) {
      mountPoint.innerHTML = '';
      return;
    }

    render(template(app.store.state), mountPoint);
    mountPoint.querySelector('[data-close]').addEventListener('click', () => app.toggleParseOptions(false));
    mountPoint.querySelector('[data-action="paste"]').addEventListener('click', () => {
      app.toggleParseOptions(false);
      if (document.querySelector('#yesterday-text')) {
        document.querySelector('#yesterday-text').focus();
      }
    });
    const pasteButton = mountPoint.querySelector('[data-action="paste"]');
    pasteButton.addEventListener('click', () => {
      app.toggleParseOptions(false);
      const textarea = document.querySelector('#yesterday-text');
      textarea?.focus();
    });
  };

  renderModal();
  app.store.subscribe(renderModal);
}
