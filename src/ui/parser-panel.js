import { render } from './dom-utils.js';
import { parseYesterdayMessage } from '../core/parser-service.js';

const template = () => `
  <section class="panel">
    <h2>智能解析昨日数据</h2>
    <textarea id="yesterday-text" rows="6" placeholder="粘贴微信消息..."></textarea>
    <div class="parser-actions">
      <button id="parse-btn">🔍 解析</button>
    </div>
    <p id="parse-status" class="status"></p>
  </section>
`;

export function mountParserPanel(app, mountPoint) {
  render(template(), mountPoint);
  const textArea = mountPoint.querySelector('#yesterday-text');
  const status = mountPoint.querySelector('#parse-status');
  const btn = mountPoint.querySelector('#parse-btn');
  const handleParse = () => {
    const text = textArea.value;
    const result = parseYesterdayMessage(text);
    if (!result.success) {
      status.textContent = `❌ ${result.reason}`;
      status.style.color = '#ff6b6b';
      app.notify(`解析失败：${result.reason}`, 'error');
      return;
    }

    app.store.update('yesterdayData', { ...app.store.state.yesterdayData, ...result.payload });
    status.textContent = '✅ 解析成功，已更新昨日数据';
    status.style.color = '#4ade80';
    app.notify('解析成功，已自动刷新相关计算', 'success');
    app.recalc();
  };

  btn.addEventListener('click', handleParse);

  let parseTimer = null;
  const scheduleAutoParse = () => {
    clearTimeout(parseTimer);
    parseTimer = setTimeout(() => {
      if (!textArea.value.trim()) {
        status.textContent = '';
        return;
      }
      handleParse();
    }, 600);
  };

  textArea.addEventListener('input', scheduleAutoParse);
  textArea.addEventListener('paste', scheduleAutoParse);

  return {
    destroy() {
      btn.removeEventListener('click', handleParse);
      textArea.removeEventListener('input', scheduleAutoParse);
      textArea.removeEventListener('paste', scheduleAutoParse);
      clearTimeout(parseTimer);
      mountPoint.innerHTML = '';
    }
  };
}
