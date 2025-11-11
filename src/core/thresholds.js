export const DENSITY = {
  GASOLINE: 0.00075,
  DIESEL: 0.00085
};

export const THRESHOLDS = {
  SALES_ANOMALY_RATE: 0.3,          // 30%
  COMPARISON_RATE: 50,              // 50%
  COMPARISON_RATE_HIGH: 100,        // 100%
  MONTHLY_TOLERANCE: 0.1,           // 吨
  MAX_TOTAL_SALES: 1000,            // 吨
  EVALUATION_MIN: 0,
  EVALUATION_MAX: 100,
  LOW_EVALUATION_RATE: 50           // 50%
};

export const REPORT_TEMPLATE = {
  header({ stationName, date }) {
    return `${stationName}${date}:`;
  }
};

export const DEFAULT_VALUES = {
  stationName: '宝湖加油站',
  demoMode: false
};
