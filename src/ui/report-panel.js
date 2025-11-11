import { render } from './dom-utils.js';

const template = (state) => `
  <section class="panel">
    <h2>标准报告</h2>
    <button id="generate-report">📄 生成报告</button>
    <button id="copy-report">📋 复制</button>
    <pre class="report-output">${state.reportStatus.report || '尚未生成报告'}</pre>
    <p class="status">${state.reportStatus.message || ''}</p>
  </section>
`;

async function copyText(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // ignore
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  const success = document.execCommand('copy');
  document.body.removeChild(textArea);
  return success;
}

export function mountReportPanel(app, mountPoint) {
  const renderPanel = () => {
    render(template(app.store.state), mountPoint);
    mountPoint.querySelector('#generate-report').addEventListener('click', () => {
      app.generateReport();
    });
    mountPoint.querySelector('#copy-report').addEventListener('click', async () => {
      const text = app.store.state.reportStatus.report;
      const status = mountPoint.querySelector('.status');
      const ok = await copyText(text);
      status.textContent = ok ? '✅ 已复制到剪贴板' : '❌ 复制失败，请手动选择文本';
      app.notify(ok ? '报告内容已复制' : '复制失败，请检查权限', ok ? 'success' : 'error');
    });
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
