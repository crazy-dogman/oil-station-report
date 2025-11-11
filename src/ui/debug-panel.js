const PANEL_ID = 'modular-app-debug-panel';

function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.position = 'fixed';
    panel.style.bottom = '16px';
    panel.style.right = '16px';
    panel.style.width = '320px';
    panel.style.maxHeight = '50vh';
    panel.style.overflow = 'auto';
    panel.style.background = 'rgba(0, 0, 0, 0.75)';
    panel.style.color = '#0f0';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '12px';
    panel.style.padding = '12px';
    panel.style.borderRadius = '12px';
    panel.style.zIndex = '9999';
    panel.style.pointerEvents = 'none';
    panel.innerHTML = '<strong>模块化状态调试</strong><pre></pre>';
    document.body.appendChild(panel);
  }
  return panel;
}

export function mountDebugPanel(store) {
  const panel = ensurePanel();
  const pre = panel.querySelector('pre');
  pre.textContent = JSON.stringify({
    step: store.state.currentStep,
    station: store.state.formData.stationName,
    totals: store.state.calculatedResults.totalSales,
    anomalies: store.state.anomalies.length
  }, null, 2);

  store.subscribe((state) => {
    pre.textContent = JSON.stringify({
      step: state.currentStep,
      station: state.formData.stationName,
      totals: state.calculatedResults.totalSales,
      anomalies: state.anomalies.length
    }, null, 2);
  });
}
