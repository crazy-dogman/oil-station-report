import { REPORT_TEMPLATE } from './thresholds.js';

const formatNumber = (value, digits = 2) => Number(value || 0).toFixed(digits);

function sectionOilSales(formData, calculatedResults) {
  const { gasoline92, gasoline95, gasoline98, diesel } = formData;
  return `一、92#汽油销售${formatNumber(gasoline92.tons)}吨，95#汽油${formatNumber(gasoline95.tons)}吨，98#汽油销售${formatNumber(gasoline98.tons)}吨，共计汽油销售${formatNumber(calculatedResults.gasolineTotal)}吨，柴油${formatNumber(diesel.tons)}吨，柴汽合计销售${formatNumber(calculatedResults.totalSales)}吨。本月累计销售汽油${formatNumber(calculatedResults.monthlyGasoline)}吨，柴油${formatNumber(calculatedResults.monthlyDiesel)}吨，共销售油品${formatNumber(calculatedResults.monthlyTotal)}吨。`;
}

function comparisonText(result) {
  if (!result || result.changeType === '无法计算') {
    return '缺少昨日数据，无法计算环比。';
  }
  return `环比昨日${result.changeType}${formatNumber(result.change)}吨，${result.changeRateType}${formatNumber(result.changeRate)}%`;
}

function sectionComparison(calculatedResults) {
  const total = calculatedResults.comparisonData;
  const gasoline = calculatedResults.gasolineComparison;
  const diesel = calculatedResults.dieselComparison;
  if (total.changeType === '无法计算') {
    return '二、缺少昨日数据，无法进行环比分析。';
  }
  return `二、环比昨日${total.changeType}${formatNumber(total.change)}吨，${total.changeRateType}${formatNumber(total.changeRate)}%，其中汽油${gasoline.changeType}${formatNumber(gasoline.change)}吨，${gasoline.changeRateType}${formatNumber(gasoline.changeRate)}%，柴油${diesel.changeType}${formatNumber(diesel.change)}吨，${diesel.changeRateType}${formatNumber(diesel.changeRate)}%。`;
}

function sectionNonOil(formData, calculatedResults, yesterdayData) {
  const today = Number(formData.nonOilSales.today || 0);
  const yesterday = Number(yesterdayData.nonOilSales || 0);
  const change = today - yesterday;
  const changeRate = yesterday > 0 ? (change / yesterday) * 100 : 0;
  const changeDesc = change >= 0 ? '增加' : '减少';
  const changeRateDesc = changeRate >= 0 ? '增幅' : '减幅';

  const lastYear = Number(formData.nonOilSales.lastYear || 0);
  const lastYearChange = today - lastYear;
  const lastYearRate = lastYear > 0 ? (lastYearChange / lastYear) * 100 : 0;
  const lastYearDesc = lastYearChange >= 0 ? '增加' : '减少';
  const lastYearRateDesc = lastYearRate >= 0 ? '增幅' : '减幅';
  const yearText = lastYear > 0
    ? `，同比去年${lastYearDesc}${formatNumber(Math.abs(lastYearChange), 2)}元，${lastYearRateDesc}${formatNumber(Math.abs(lastYearRate))}%`
    : '';

  return `三、当日非油销售${formatNumber(today)}元，环比昨日${changeDesc}${formatNumber(Math.abs(change))}元，${changeRateDesc}${formatNumber(Math.abs(changeRate))}%${yearText}，本月累计${formatNumber(calculatedResults.monthlyNonOilTotal, 2)}元。`;
}

function sectionVouchers(formData, calculatedResults) {
  return `四、当日电子券核销${formData.electronicVouchers.today || 0}张，累计核销${calculatedResults.cumulativeVouchers || 0}张。`;
}

function sectionICBCPoints(formData) {
  return `五、工行积分兑换${formData.icbcPoints.count || 0}笔，兑换金额${formatNumber(formData.icbcPoints.amount)}元。`;
}

function sectionICBCETC(formData) {
  return `六、当日工行ETC${formData.icbcETC.count || 0}单。`;
}

function sectionThreeEnd(formData, calculatedResults) {
  return `七、三端订单消费${formData.threeEndOrders.count || 0}笔，实际评价数量${formData.actualReviews.count || 0}笔，测评率${formatNumber(calculatedResults.evaluationRate)}%。`;
}

function sectionElectronicCards(formData) {
  return `八、今日办理电子卡${formData.electronicCards.count || 0}张。`;
}

function hasMinData(state) {
  const { formData } = state;
  return Boolean(formData.date && formData.stationName && state.calculatedResults.totalSales > 0);
}

export function generateStandardReport(state) {
  if (!hasMinData(state)) {
    return {
      success: false,
      message: '缺少基础信息或油品数据',
      report: ''
    };
  }

  const header = REPORT_TEMPLATE.header({
    stationName: state.formData.stationName,
    date: state.formData.date
  });

  const sections = [
    header,
    sectionOilSales(state.formData, state.calculatedResults),
    sectionComparison(state.calculatedResults),
    sectionNonOil(state.formData, state.calculatedResults, state.yesterdayData),
    sectionVouchers(state.formData, state.calculatedResults),
    sectionICBCPoints(state.formData),
    sectionICBCETC(state.formData),
    sectionThreeEnd(state.formData, state.calculatedResults),
    sectionElectronicCards(state.formData)
  ];

  return {
    success: true,
    message: '报告生成成功',
    report: sections.join('\n')
  };
}
