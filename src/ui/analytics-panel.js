import { render } from './dom-utils.js';

const template = (state) => `
  <section class="panel analytics">
    <h2>实时数据</h2>
    <p>柴汽合计：<strong>${state.calculatedResults.totalSales.toFixed(2)}</strong> 吨</p>
    <p>测评率：<strong>${state.calculatedResults.evaluationRate.toFixed(2)}%</strong></p>
    <p>异常数：<strong>${state.anomalies.length}</strong></p>
  </section>
`;

export function mountAnalyticsPanel(store, mountPoint) {
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
