import {
  detectSalesAnomaly,
  detectComparisonAnomaly,
  detectEvaluationAnomaly,
  detectMonthlyLogicAnomaly,
  checkDataRange
} from './compute-engine.js';

const REQUIRED_FIELDS = {
  step1: ['formData.date', 'formData.stationName'],
  step3: [
    'formData.gasoline92.liters',
    'formData.gasoline95.liters',
    'formData.gasoline98.liters',
    'formData.diesel.liters'
  ],
  step4: ['formData.nonOilSales.today'],
  step5: [
    'formData.electronicVouchers.today',
    'formData.threeEndOrders.count',
    'formData.actualReviews.count',
    'formData.electronicCards.count'
  ]
};

function getValue(state, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], state);
}

function getFieldLabel(path) {
  const map = {
    'formData.date': '日期',
    'formData.stationName': '加油站名称',
    'formData.gasoline92.liters': '92#汽油',
    'formData.gasoline95.liters': '95#汽油',
    'formData.gasoline98.liters': '98#汽油',
    'formData.diesel.liters': '柴油',
    'formData.nonOilSales.today': '当日非油销售',
    'formData.electronicVouchers.today': '电子券核销',
    'formData.threeEndOrders.count': '三端订单',
    'formData.actualReviews.count': '实际评价',
    'formData.electronicCards.count': '电子卡办理'
  };
  return map[path] || path;
}

export function validateCompleteness(state) {
  const missing = [];
  Object.entries(REQUIRED_FIELDS).forEach(([step, fields]) => {
    fields.forEach((path) => {
      const value = getValue(state, path);
      let isInvalid = false;
      if (typeof value === 'string') {
        isInvalid = value.trim() === '';
      } else {
        isInvalid = value === null || value === undefined || Number(value) <= 0;
      }
      if (isInvalid) {
        missing.push({ field: path, step, label: getFieldLabel(path) });
      }
    });
  });
  return missing;
}

export function runValidation(state) {
  const missingFields = validateCompleteness(state);
  const anomalies = [];

  if (missingFields.length === 0) {
    const salesAnomaly = detectSalesAnomaly(
      state.calculatedResults.totalSales,
      state.yesterdayData.totalSales
    );
    if (salesAnomaly) anomalies.push(salesAnomaly);

    const comparisonRate = state.calculatedResults.comparisonData?.changeRate;
    if (comparisonRate !== undefined) {
      const comparisonAnomaly = detectComparisonAnomaly(comparisonRate);
      if (comparisonAnomaly) anomalies.push(comparisonAnomaly);
    }

    const evalAnomaly = detectEvaluationAnomaly(
      state.calculatedResults.evaluationRate,
      state.formData.threeEndOrders.count
    );
    if (evalAnomaly) anomalies.push(evalAnomaly);

    const monthlyAnomaly = detectMonthlyLogicAnomaly(
      state.calculatedResults.monthlyTotal,
      state.yesterdayData.monthlyTotal,
      state.calculatedResults.totalSales
    );
    if (monthlyAnomaly) anomalies.push(monthlyAnomaly);

    const rangeIssues = checkDataRange(state.calculatedResults, state.formData);
    anomalies.push(...rangeIssues);
  }

  return { missingFields, anomalies };
}
