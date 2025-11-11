import { render } from './dom-utils.js';

const template = (state) => `
  <section class="panel">
    <h2>基础信息</h2>
    <div class="field">
      <label>加油站名称</label>
      <input type="text" id="station-name" />
    </div>
    <div class="field">
      <label>日期</label>
      <input type="text" id="report-date" placeholder="如：1月1日" />
      <small class="hint date-hint">建议格式：1月1日；期望昨日：${state.expectedYesterdayDate || '未设置'}</small>
    </div>
    <h2>今日油品（升）</h2>
    <div class="grid">
      <label>92#</label>
      <input type="number" id="gasoline92" min="0" />
      <label>95#</label>
      <input type="number" id="gasoline95" min="0" />
      <label>98#</label>
      <input type="number" id="gasoline98" min="0" />
      <label>柴油</label>
      <input type="number" id="diesel" min="0" />
    </div>
    <h2>非油销售</h2>
    <div class="grid">
      <label>当日</label>
      <input type="number" id="non-oil-today" min="0" step="0.01" />
      <label>去年同期</label>
      <input type="number" id="non-oil-lastyear" min="0" step="0.01" />
    </div>
    <h2>电子券 / 工行</h2>
    <div class="grid">
      <label>电子券核销</label>
      <input type="number" id="voucher-today" min="0" />
      <label>工行积分兑换笔数</label>
      <input type="number" id="icbc-points-count" min="0" />
      <label>工行积分兑换金额</label>
      <input type="number" id="icbc-points-amount" min="0" step="0.01" />
      <label>工行ETC</label>
      <input type="number" id="icbc-etc" min="0" />
    </div>
    <h2>三端业务</h2>
    <div class="grid">
      <label>三端订单</label>
      <input type="number" id="three-end-orders" min="0" />
      <label>实际评价</label>
      <input type="number" id="actual-reviews" min="0" />
      <label>电子卡办理</label>
      <input type="number" id="electronic-cards" min="0" />
    </div>
  </section>
`;

export function mountStepsPanel(app, mountPoint) {
  const { store } = app;
  render(template(store.state), mountPoint);

  const bindInput = (selector, path) => {
    const el = mountPoint.querySelector(selector);
    if (!el) return;
    const updateValue = () => {
      store.update(path, el.type === 'number' ? Number(el.value) : el.value);
      app.recalc();
    };
    el.addEventListener('input', updateValue);
    // 初始值
    const segments = path.split('.');
    let cursor = store.state;
    segments.forEach((seg) => {
      cursor = cursor?.[seg];
    });
    if (cursor !== undefined) {
      el.value = cursor;
    }
  };

  bindInput('#station-name', 'formData.stationName');
  bindInput('#report-date', 'formData.date');
  bindInput('#gasoline92', 'formData.gasoline92.liters');
  bindInput('#gasoline95', 'formData.gasoline95.liters');
  bindInput('#gasoline98', 'formData.gasoline98.liters');
  bindInput('#diesel', 'formData.diesel.liters');
  bindInput('#non-oil-today', 'formData.nonOilSales.today');
  bindInput('#non-oil-lastyear', 'formData.nonOilSales.lastYear');
  bindInput('#voucher-today', 'formData.electronicVouchers.today');
  bindInput('#icbc-points-count', 'formData.icbcPoints.count');
  bindInput('#icbc-points-amount', 'formData.icbcPoints.amount');
  bindInput('#icbc-etc', 'formData.icbcETC.count');
  bindInput('#three-end-orders', 'formData.threeEndOrders.count');
  bindInput('#actual-reviews', 'formData.actualReviews.count');
  bindInput('#electronic-cards', 'formData.electronicCards.count');

  const updateHints = () => {
    const hint = mountPoint.querySelector('.date-hint');
    if (hint) {
      hint.textContent = `建议格式：1月1日；期望昨日：${store.state.expectedYesterdayDate || '未设置'}`;
    }
  };

  updateHints();
  const unsubscribe = store.subscribe(updateHints);

  return {
    destroy() {
      unsubscribe?.();
      mountPoint.innerHTML = '';
    }
  };
}
