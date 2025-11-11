import { render } from './dom-utils.js';

const template = (state) => `
  <section class="panel status-panel">
    <h2>运行状态</h2>
    <p>当前消息：<strong>${state.appStatus.message || '就绪'}</strong></p>
    <p>预期昨日：${state.expectedYesterdayDate || '未设置'}</p>
    <p>演示模式：${state.demoMode ? '开启' : '关闭'}</p>
  </section>
`;

export function mountStatusPanel(store, mountPoint) {
  const renderPanel = () => {
    render(template(store.state), mountPoint);
  };

  renderPanel();
  const unsubscribe = store.subscribe(renderPanel);

  return {
    destroy() {
      unsubscribe?.();
      mountPoint.innerHTML = '';
    }
  };
}
