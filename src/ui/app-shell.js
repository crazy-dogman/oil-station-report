import { createDataStore } from '../core/data-store.js';
import {
  convertLitersToTons,
  calculateOilTotals,
  calculateMonthlyCumulative,
  calculateMonthlyNonOilTotal,
  calculateCumulativeVouchers,
  calculateComparison,
  calculateEvaluationRate
} from '../core/compute-engine.js';
import { runValidation } from '../core/validation-engine.js';
import { generateStandardReport } from '../core/report-engine.js';
import { demoFormData, demoYesterdayData } from '../core/demo-data.js';

const formatDateString = (date = new Date()) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

function updateOilProduct(store, key) {
  const product = store.state.formData[key];
  const { tons, process } = convertLitersToTons(product.liters, product.conversionRate);
  product.tons = tons;
  store.state.calculationProcesses[key] = process;
}

function recalcSummaries(store) {
  const totals = calculateOilTotals(store.state.formData);
  store.state.calculatedResults.gasolineTotal = totals.gasolineTotal;
  store.state.calculatedResults.totalSales = totals.totalSales;

  const monthly = calculateMonthlyCumulative(
    { ...totals, dieselTons: store.state.formData.diesel.tons },
    store.state.yesterdayData
  );
  Object.assign(store.state.calculatedResults, monthly);
  store.state.calculationProcesses.monthlyTotal = `昨日累计${store.state.yesterdayData.monthlyTotal || 0}吨 + 今日销售${totals.totalSales}吨 = ${store.state.calculatedResults.monthlyTotal}吨`;

  store.state.calculatedResults.monthlyNonOilTotal = calculateMonthlyNonOilTotal(
    store.state.yesterdayData.monthlyNonOil,
    store.state.formData.nonOilSales.today
  );
  store.state.calculationProcesses.nonOil = `昨日累计${store.state.yesterdayData.monthlyNonOil || 0}元 + 今日非油${store.state.formData.nonOilSales.today || 0}元 = ${store.state.calculatedResults.monthlyNonOilTotal}元`;

  store.state.calculatedResults.cumulativeVouchers = calculateCumulativeVouchers(
    store.state.yesterdayData.vouchersTotal,
    store.state.formData.electronicVouchers.today
  );
  store.state.calculationProcesses.vouchers = `昨日累计${store.state.yesterdayData.vouchersTotal || 0}张 + 今日核销${store.state.formData.electronicVouchers.today || 0}张 = ${store.state.calculatedResults.cumulativeVouchers}张`;

  if (store.state.yesterdayData.parsed) {
    store.state.calculatedResults.comparisonData = calculateComparison(
      store.state.calculatedResults.totalSales,
      store.state.yesterdayData.totalSales
    );
    store.state.calculationProcesses.comparison = store.state.calculatedResults.comparisonData.processText;
    store.state.calculatedResults.gasolineComparison = calculateComparison(
      store.state.calculatedResults.gasolineTotal,
      store.state.yesterdayData.gasolineTotal
    );
    store.state.calculatedResults.dieselComparison = calculateComparison(
      store.state.formData.diesel.tons,
      store.state.yesterdayData.diesel
    );
  } else {
    store.state.calculationProcesses.comparison = '缺少昨日数据，无法计算环比';
  }

  const evaluation = calculateEvaluationRate(
    store.state.formData.actualReviews.count,
    store.state.formData.threeEndOrders.count
  );
  store.state.calculatedResults.evaluationRate = evaluation.rate;
  store.state.calculationProcesses.evaluationRate = evaluation.process;
}

export function createAppShell() {
  const store = createDataStore();
  let stageController = null;
  let autoValidationTimer = null;
  const notificationTimers = new Map();
  const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const AUTO_VALIDATE_DELAY = 600;
  const MAX_NOTIFICATIONS = 5;
  const MAX_CALC_LOGS = 40;
  let watchersSuspended = false;

  function updateStepStatus() {
    store.state.steps.forEach((step) => {
      step.completed = step.id < store.state.currentStep;
    });
  }

  function removeNotification(id) {
    const idx = store.state.notifications.findIndex((item) => item.id === id);
    if (idx !== -1) {
      store.state.notifications.splice(idx, 1);
      store.merge({});
    }
    const timer = notificationTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      notificationTimers.delete(id);
    }
  }

  function pushNotification(message, type = 'info', duration = 4000) {
    if (!message) return;
    const notification = {
      id: generateId(),
      type,
      message,
      timestamp: Date.now()
    };
    store.state.notifications.push(notification);
    const overflow = store.state.notifications.length - MAX_NOTIFICATIONS;
    if (overflow > 0) {
      for (let i = 0; i < overflow; i += 1) {
        const removed = store.state.notifications.shift();
        if (removed) {
          const timer = notificationTimers.get(removed.id);
          if (timer) {
            clearTimeout(timer);
            notificationTimers.delete(removed.id);
          }
        }
      }
    }
    store.merge({});
    if (duration > 0) {
      const timer = setTimeout(() => removeNotification(notification.id), duration);
      notificationTimers.set(notification.id, timer);
    }
  }

  function addCalcLog(type, message) {
    const entry = {
      id: generateId(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    store.state.calculationLogs.push(entry);
    if (store.state.calculationLogs.length > MAX_CALC_LOGS) {
      store.state.calculationLogs.shift();
    }
    store.merge({});
  }

  function setDatesToToday() {
    store.state.formData.date = formatDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    store.state.expectedYesterdayDate = formatDateString(yesterday);
  }

  function setAppMessage(message) {
    store.state.appStatus.message = message;
    store.merge({});
  }

  function syncStage(effect = 'magnetic') {
    if (!stageController) return;
    const current = store.state.steps[store.state.currentStep - 1];
    stageController.setMode({
      title: current?.title || '未来油站中枢',
      subtitle: `STEP ${store.state.currentStep} / ${store.state.steps.length}`
    });
    if (effect) {
      stageController.pulse(effect);
    }
  }

  function applyValidationResult(result, mode) {
    store.merge({
      missingFields: result.missingFields,
      anomalies: result.anomalies,
      validationStatus: mode
    });

    const hasIssues = result.missingFields.length > 0 || result.anomalies.length > 0;
    const effect = hasIssues ? 'alert' : 'scan';
    if (mode === 'manual') {
      syncStage(effect);
    } else {
      stageController?.pulse(effect);
    }
  }

  function scheduleAutoValidation() {
    clearTimeout(autoValidationTimer);
    autoValidationTimer = setTimeout(() => {
      const result = runValidation(store.state);
      applyValidationResult(result, 'auto');
    }, AUTO_VALIDATE_DELAY);
  }

  function performRecalc(type = 'recalc', message = '') {
    recalcSummaries(store);
    store.merge({});
    scheduleAutoValidation();
    if (message) {
      addCalcLog(type, message);
    }
  }

  function withWatchersSuspended(fn) {
    watchersSuspended = true;
    fn();
    watchersSuspended = false;
  }

  function setLoading(isLoading, message = '处理中…') {
    store.state.uiState.showLoading = isLoading;
    store.state.uiState.loadingMessage = message;
    store.merge({});
  }

  function applyDemoDataset() {
    withWatchersSuspended(() => {
      store.state.demoMode = true;
      store.state.formData.stationName = demoFormData.stationName;
      store.state.formData.gasoline92.liters = demoFormData.gasoline92Liters;
      store.state.formData.gasoline95.liters = demoFormData.gasoline95Liters;
      store.state.formData.gasoline98.liters = demoFormData.gasoline98Liters;
      store.state.formData.diesel.liters = demoFormData.dieselLiters;
      store.state.formData.nonOilSales.today = demoFormData.nonOilToday;
      store.state.formData.nonOilSales.lastYear = demoFormData.nonOilLastYear;
      store.state.formData.electronicVouchers.today = demoFormData.vouchersToday;
      store.state.formData.icbcPoints.count = demoFormData.icbcPointsCount;
      store.state.formData.icbcPoints.amount = demoFormData.icbcPointsAmount;
      store.state.formData.icbcETC.count = demoFormData.icbcETCCount;
      store.state.formData.threeEndOrders.count = demoFormData.threeEndOrders;
      store.state.formData.actualReviews.count = demoFormData.actualReviews;
      store.state.formData.electronicCards.count = demoFormData.electronicCards;
      store.state.yesterdayData = { ...store.state.yesterdayData, ...demoYesterdayData };
      setDatesToToday();
    });
    ['gasoline92', 'gasoline95', 'gasoline98', 'diesel'].forEach((key) => updateOilProduct(store, key));
    performRecalc('demo', '加载演示数据，已重新计算');
    pushNotification('已加载演示数据，可直接体验全流程', 'success', 5000);
    stageController?.pulse('demo');
    setAppMessage('演示数据已就绪，可直接体验完整流程');
    addCalcLog('demo', '演示数据加载完成');
  }

  function init() {
    ['gasoline92', 'gasoline95', 'gasoline98', 'diesel'].forEach((key) => updateOilProduct(store, key));
    recalcSummaries(store);
    updateStepStatus();
    setDatesToToday();
    store.state.appStatus.initialized = true;
    store.state.appStatus.loading = false;
    store.state.appStatus.message = '模块化体验就绪';
    syncStage(null);
    scheduleAutoValidation();
    setupFieldWatchers();
  }

  function setupFieldWatchers() {
    const watchList = [
      { path: 'formData.gasoline92.liters', label: '92#汽油', updater: () => updateOilProduct(store, 'gasoline92') },
      { path: 'formData.gasoline95.liters', label: '95#汽油', updater: () => updateOilProduct(store, 'gasoline95') },
      { path: 'formData.gasoline98.liters', label: '98#汽油', updater: () => updateOilProduct(store, 'gasoline98') },
      { path: 'formData.diesel.liters', label: '柴油', updater: () => updateOilProduct(store, 'diesel') },
      { path: 'formData.nonOilSales.today', label: '非油销售' },
      { path: 'formData.nonOilSales.lastYear', label: '非油去年' },
      { path: 'formData.electronicVouchers.today', label: '电子券' },
      { path: 'formData.icbcPoints.count', label: '工行积分笔数' },
      { path: 'formData.icbcPoints.amount', label: '工行积分金额' },
      { path: 'formData.icbcETC.count', label: '工行ETC' },
      { path: 'formData.threeEndOrders.count', label: '三端订单' },
      { path: 'formData.actualReviews.count', label: '实际评价' },
      { path: 'formData.electronicCards.count', label: '电子卡办理' }
    ];

    const handler = (entry) => {
      if (watchersSuspended) return;
      entry?.updater?.();
      performRecalc('field', `${entry.label} 更新，自动重新计算`);
    };

    watchList.forEach((entry) => {
      store.watch(entry.path, () => handler(entry));
    });

    store.watch('formData.date', () => {
      if (watchersSuspended) return;
      performRecalc('field', '日期已更新');
    });
  }

  return {
    store,
    init,
    setStageController(controller) {
      stageController = controller;
      syncStage(null);
    },
    notify: pushNotification,
    dismissNotification: removeNotification,
    toggleAnomalyModal(open) {
      store.state.uiState.showAnomalyModal = open;
      store.merge({});
    },
    toggleParseOptions(open) {
      store.state.uiState.showParseOptions = open;
      store.merge({});
    },
    recalc: () => {
      setLoading(true, '重新计算中');
      ['gasoline92', 'gasoline95', 'gasoline98', 'diesel'].forEach((key) => updateOilProduct(store, key));
      performRecalc('recalc', '手动重新计算所有指标');
      setLoading(false);
      setAppMessage('已重新计算所有派生指标');
    },
    validate: () => {
      stageController?.setMode?.({ title: '数据验证', subtitle: 'VALIDATING' });
      setLoading(true, '验证数据完整性');
      recalcSummaries(store);
      const result = runValidation(store.state);
      applyValidationResult(result, 'manual');
      setLoading(false);
      setAppMessage('数据验证完成');
      addCalcLog('validate', '手动触发数据验证');
    },
    generateReport: () => {
      setLoading(true, '生成标准报告');
      recalcSummaries(store);
      const report = generateStandardReport(store.state);
      store.state.reportStatus = report;
      if (report.success) {
        stageController?.celebrate();
        pushNotification('标准报告生成成功，已更新预览', 'success');
        setAppMessage('报告生成成功，可以复制使用');
        addCalcLog('report', '报告生成成功');
      } else {
        pushNotification(report.message || '报告生成失败', 'error');
        setAppMessage('报告生成失败，请检查数据');
        addCalcLog('report', '报告生成失败，数据未通过校验');
      }
      store.merge({});
      setLoading(false);
      return report;
    },
    nextStep: () => {
      if (store.state.currentStep >= store.state.steps.length) return;
      store.state.currentStep += 1;
      updateStepStatus();
      syncStage('forward');
      pushNotification(`进入 ${store.state.steps[store.state.currentStep - 1]?.name || '下一步骤'}`, 'info', 2500);
      store.merge({});
    },
    prevStep: () => {
      if (store.state.currentStep <= 1) return;
      store.state.currentStep -= 1;
      updateStepStatus();
      syncStage('backward');
      pushNotification(`返回 ${store.state.steps[store.state.currentStep - 1]?.name || '上一步骤'}`, 'info', 2500);
      store.merge({});
    },
    goToStep: (target) => {
      if (target < 1 || target > store.state.steps.length) return;
      store.state.currentStep = target;
      updateStepStatus();
      syncStage('jump');
      pushNotification(`跳转到 ${store.state.steps[target - 1]?.name || '指定步骤'}`, 'info', 2500);
      store.merge({});
    },
    setTodayDate: () => {
      setDatesToToday();
      store.merge({});
      pushNotification('已更新为今日日期', 'info');
      setAppMessage('日期已同步为今日');
      addCalcLog('field', '已同步今日日期');
    },
    loadDemoData: applyDemoDataset,
    toggleDemoMode(enabled) {
      store.state.demoMode = enabled;
      store.merge({});
    }
  };
}
