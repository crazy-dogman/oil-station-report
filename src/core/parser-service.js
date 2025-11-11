const patterns = {
  gasoline92: /92#汽油销售?(\d+\.?\d*)吨/,
  gasoline95: /95#汽油(\d+\.?\d*)吨/,
  gasoline98: /98#汽油销售?(\d+\.?\d*)吨/,
  diesel: /柴油(\d+\.?\d*)吨/,
  gasolineTotal: /共计汽油销售(\d+\.?\d*)吨/,
  totalSales: /柴汽合计销售(\d+\.?\d*)吨/,
  monthlyGasoline: /本月累计销售汽油(\d+\.?\d*)吨/,
  monthlyDiesel: /柴油(\d+\.?\d*)吨，共销售油品/,
  monthlyTotal: /共销售油品(\d+\.?\d*)吨/,
  nonOilSales: /当日非油销售(\d+\.?\d*)元/,
  monthlyNonOil: /本月累计(\d+\.?\d*)元/,
  electronicVouchersToday: /当日电子券核销(\d+)张/,
  electronicVouchersTotal: /累计核销(\d+)张/,
  icbcPointsExchange: /工行积分兑换(\d+)笔/,
  icbcExchangeAmount: /兑换?金额(\d+\.?\d*)元/,
  icbcETC: /当日工行ETC(\d+)单/,
  threeEndOrders: /三端订单消费(\d+)笔/,
  actualReviews: /实际评价数量(\d+)笔/,
  // 兼容全角％与半角%
  ratingRate: /测评率(\d+(?:\.\d+)?)[%％]/,
  electronicCards: /今日办理电子卡(\d+)张/
};

export function parseYesterdayMessage(text) {
  if (!text || typeof text !== 'string') {
    return { success: false, reason: '暂无数据' };
  }

  const data = {};
  let hits = 0;

  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match) {
      data[key] = parseFloat(match[1]);
      hits += 1;
    }
  });

  if (hits < 5) {
    return { success: false, reason: '匹配字段不足' };
  }

  const gasolineTotal = (data.gasoline92 || 0) + (data.gasoline95 || 0) + (data.gasoline98 || 0);
  const totalSales = gasolineTotal + (data.diesel || 0);

  return {
    success: true,
    payload: {
      gasoline92: data.gasoline92 || 0,
      gasoline95: data.gasoline95 || 0,
      gasoline98: data.gasoline98 || 0,
      diesel: data.diesel || 0,
      nonOilSales: data.nonOilSales || 0,
      monthlyGasoline: data.monthlyGasoline || 0,
      monthlyDiesel: data.monthlyDiesel || 0,
      monthlyTotal: data.monthlyTotal || 0,
      monthlyNonOil: data.monthlyNonOil || 0,
      vouchersTotal: data.electronicVouchersTotal || 0,
      gasolineTotal: data.gasolineTotal || gasolineTotal,
      totalSales: data.totalSales || totalSales,
      parsed: true
    }
  };
}
