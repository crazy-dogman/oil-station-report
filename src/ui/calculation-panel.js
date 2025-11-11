import { render } from './dom-utils.js';

const fieldMap = [
  { key: 'gasoline92', label: '92#汽油' },
  { key: 'gasoline95', label: '95#汽油' },
  { key: 'gasoline98', label: '98#汽油' },
  { key: 'diesel', label: '柴油' },
  { key: 'monthlyTotal', label: '月累计油品' },
  { key: 'nonOil', label: '非油累计' },
  { key: 'vouchers', label: '电子券累计' },
  { key: 'comparison', label: '柴汽环比' },
  { key: 'evaluationRate', label: '测评率' }
];

const template = (state) => {
  const processes = state.calculationProcesses || {};
  const logs = (state.calculationLogs || []).slice(-10).reverse();
  return `
    <section class="panel calc-panel">
      <h2>计算详情</h2>
      <ul>
        ${fieldMap.map(({ key, label }) => {
          const text = processes[key];
          return `<li><strong>${label}</strong><span>${text || '暂无数据'}</span></li>`;
        }).join('')}
      </ul>
      <div class="calc-logs">
        <h3>计算日志</h3>
        <ul>
          ${logs.map((log) => `
            <li>
              <span class="log-time">${log.timestamp}</span>
              <span class="log-type">${log.type}</span>
              <span class="log-message">${log.message}</span>
            </li>
          `).join('') || '<li>暂无日志</li>'}
        </ul>
      </div>
    </section>
  `;
};

export function mountCalculationPanel(store, mountPoint) {
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
