import { DENSITY, THRESHOLDS } from './thresholds.js';

const toNumber = (value) => Number(value) || 0;

export function convertLitersToTons(liters, conversionRate) {
  const value = toNumber(liters);
  if (value <= 0) {
    return {
      tons: 0,
      process: ''
    };
  }

  const rate = conversionRate ?? DENSITY.GASOLINE;
  const raw = value * rate;
  const tons = Number(raw.toFixed(2));
  const process = `${value} 升 × ${rate} = ${raw.toFixed(4)} 吨 → ${tons} 吨 (四舍五入)`;
  return { tons, process };
}

export function calculateOilTotals(formData) {
  const gasolineTotal = Number((
    toNumber(formData.gasoline92?.tons) +
    toNumber(formData.gasoline95?.tons) +
    toNumber(formData.gasoline98?.tons)
  ).toFixed(2));

  const totalSales = Number((gasolineTotal + toNumber(formData.diesel?.tons)).toFixed(2));

  return { gasolineTotal, totalSales };
}

export function calculateMonthlyCumulative(totals, yesterdayData) {
  if (yesterdayData?.parsed) {
    const monthlyGasoline = Number((toNumber(yesterdayData.monthlyGasoline) + totals.gasolineTotal).toFixed(2));
    const monthlyDiesel = Number((toNumber(yesterdayData.monthlyDiesel) + toNumber(totals.dieselTons ?? 0)).toFixed(2));
    const monthlyTotal = Number((monthlyGasoline + monthlyDiesel).toFixed(2));
    return { monthlyGasoline, monthlyDiesel, monthlyTotal };
  }

  return {
    monthlyGasoline: totals.gasolineTotal,
    monthlyDiesel: toNumber(totals.dieselTons ?? 0),
    monthlyTotal: totals.totalSales
  };
}

export function calculateMonthlyNonOilTotal(yesterdayTotal, todayAmount) {
  return Number(((toNumber(yesterdayTotal) + toNumber(todayAmount))).toFixed(2));
}

export function calculateCumulativeVouchers(yesterdayTotal, todayCount) {
  return toNumber(yesterdayTotal) + toNumber(todayCount);
}

const comparisonFallback = {
  change: 0,
  changeRate: 0,
  changeType: '无法计算',
  changeRateType: '无法计算',
  processText: '缺少昨日数据，无法计算环比'
};

export function calculateComparison(todayValue, yesterdayValue) {
  const today = toNumber(todayValue);
  const yesterday = toNumber(yesterdayValue);

  if (!yesterday) {
    return { ...comparisonFallback };
  }

  const change = Number((today - yesterday).toFixed(2));
  const changeRateRaw = (change / yesterday) * 100;
  const changeRate = Number(changeRateRaw.toFixed(2));

  return {
    change: Math.abs(change),
    changeRate: Math.abs(changeRate),
    changeType: change >= 0 ? '增加' : '减少',
    changeRateType: changeRate >= 0 ? '增幅' : '减幅',
    processText: `(${today} - ${yesterday}) ÷ ${yesterday} × 100% = ${changeRateRaw.toFixed(4)}% → ${changeRate}% (四舍五入)`
  };
}

export function calculateEvaluationRate(reviews, orders) {
  const orderCount = toNumber(orders);
  if (!orderCount) {
    return {
      rate: 0,
      process: '订单数为0，无法计算测评率'
    };
  }

  const reviewCount = toNumber(reviews);
  const rateRaw = (reviewCount / orderCount) * 100;
  const rate = Number(rateRaw.toFixed(2));
  return {
    rate,
    process: `${reviewCount} ÷ ${orderCount} × 100% = ${rateRaw.toFixed(4)}% → ${rate}% (四舍五入)`
  };
}

export function detectSalesAnomaly(todayTotal, yesterdayTotal) {
  const yesterday = toNumber(yesterdayTotal);
  if (!yesterday) return null;

  const threshold = yesterday * THRESHOLDS.SALES_ANOMALY_RATE;
  const today = toNumber(todayTotal);
  if (Math.abs(today - yesterday) > threshold) {
    return {
      type: 'sales_anomaly',
      field: 'totalSales',
      severity: 'high',
      message: `销量异常：当日${today.toFixed(2)}吨，平均${yesterday.toFixed(2)}吨`
    };
  }
  return null;
}

export function detectComparisonAnomaly(changeRate) {
  const rate = toNumber(changeRate);
  if (Math.abs(rate) > THRESHOLDS.COMPARISON_RATE) {
    return {
      type: 'change_anomaly',
      field: 'changeRate',
      severity: Math.abs(rate) > THRESHOLDS.COMPARISON_RATE_HIGH ? 'high' : 'medium',
      message: `环比变化异常：${rate.toFixed(2)}%`
    };
  }
  return null;
}

export function detectEvaluationAnomaly(rate, orders) {
  const orderCount = toNumber(orders);
  const value = toNumber(rate);
  if (orderCount > 0 && value < THRESHOLDS.LOW_EVALUATION_RATE) {
    return {
      type: 'rating_anomaly',
      field: 'evaluationRate',
      severity: 'medium',
      message: `测评率过低：${value.toFixed(2)}%`
    };
  }
  if (value > THRESHOLDS.EVALUATION_MAX || (orderCount > 0 && value === 0)) {
    return {
      type: 'rating_logic_error',
      field: 'evaluationRate',
      severity: 'high',
      message: '测评率逻辑错误：请检查订单数量和评价数量'
    };
  }
  return null;
}

export function detectMonthlyLogicAnomaly(todayMonthly, yesterdayMonthly, todayDaily) {
  if (!toNumber(yesterdayMonthly)) return null;
  const expected = toNumber(yesterdayMonthly) + toNumber(todayDaily);
  if (Math.abs(toNumber(todayMonthly) - expected) > THRESHOLDS.MONTHLY_TOLERANCE) {
    return {
      type: 'monthly',
      field: 'monthlyTotal',
      severity: 'high',
      message: '月累计数据逻辑错误：计算结果与预期不符'
    };
  }
  return null;
}

export function checkDataRange(calculatedResults, formData) {
  const issues = [];
  const totalSales = toNumber(calculatedResults.totalSales);
  if (totalSales < 0) {
    issues.push({ type: 'range_error', field: 'totalSales', message: '数据范围错误：销售量不能为负数', severity: 'high' });
  }
  if (totalSales > THRESHOLDS.MAX_TOTAL_SALES) {
    issues.push({ type: 'range_warning', field: 'totalSales', message: '单日销售量超过1000吨，请确认数据', severity: 'medium' });
  }

  const nonOil = toNumber(formData?.nonOilSales?.today);
  if (nonOil < 0) {
    issues.push({ type: 'range_error', field: 'nonOilSales', message: '非油销售额不能为负数', severity: 'high' });
  }

  const evaluationRate = toNumber(calculatedResults.evaluationRate);
  if (evaluationRate < THRESHOLDS.EVALUATION_MIN || evaluationRate > THRESHOLDS.EVALUATION_MAX) {
    issues.push({ type: 'range_error', field: 'evaluationRate', message: '测评率必须在0-100%之间', severity: 'high' });
  }

  return issues;
}
