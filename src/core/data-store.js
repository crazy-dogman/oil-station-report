import { createDefaultSteps } from '../config/steps-layout.js';
import { DENSITY, DEFAULT_VALUES } from './thresholds.js';

const defaultAppStatus = () => ({
  initialized: false,
  loading: false,
  error: null,
  message: '应用初始化中...'
});

const createOilProduct = (label, conversionRate) => ({
  liters: 0,
  tons: 0,
  label,
  unit: '升',
  conversionRate
});

const createInitialFormData = () => ({
  stationName: DEFAULT_VALUES.stationName,
  date: '',
  yesterdayData: '',
  gasoline92: createOilProduct('92#汽油', DENSITY.GASOLINE),
  gasoline95: createOilProduct('95#汽油', DENSITY.GASOLINE),
  gasoline98: createOilProduct('98#汽油', DENSITY.GASOLINE),
  diesel: createOilProduct('柴油', DENSITY.DIESEL),
  nonOilSales: {
    today: 0,
    yesterday: 0,
    lastYear: 0,
    label: '非油销售',
    unit: '元'
  },
  electronicVouchers: {
    today: 0,
    label: '电子券核销',
    unit: '张'
  },
  icbcPoints: {
    count: 0,
    amount: 0,
    label: '工行积分兑换',
    unit: '笔/元'
  },
  icbcETC: {
    count: 0,
    label: '工行ETC',
    unit: '单'
  },
  threeEndOrders: {
    count: 0,
    label: '三端订单消费',
    unit: '笔'
  },
  actualReviews: {
    count: 0,
    label: '实际评价数量',
    unit: '笔'
  },
  electronicCards: {
    count: 0,
    label: '电子卡办理',
    unit: '张'
  }
});

const createInitialYesterdayData = () => ({
  gasoline92: 0,
  gasoline95: 0,
  gasoline98: 0,
  diesel: 0,
  nonOilSales: 0,
  monthlyGasoline: 0,
  monthlyDiesel: 0,
  monthlyTotal: 0,
  monthlyNonOil: 0,
  vouchersTotal: 0,
  gasolineTotal: 0,
  totalSales: 0,
  parsed: false
});

const createComparisonShape = () => ({
  change: 0,
  changeRate: 0,
  changeType: '增加',
  changeRateType: '增幅',
  processText: ''
});

const createInitialCalculatedResults = () => ({
  gasolineTotal: 0,
  totalSales: 0,
  monthlyGasoline: 0,
  monthlyDiesel: 0,
  monthlyTotal: 0,
  monthlyNonOilTotal: 0,
  cumulativeVouchers: 0,
  comparisonData: createComparisonShape(),
  gasolineComparison: createComparisonShape(),
  dieselComparison: createComparisonShape(),
  nonOilComparison: createComparisonShape(),
  evaluationRate: 0
});

const createInitialCalculationProcesses = () => ({
  gasoline92: '',
  gasoline95: '',
  gasoline98: '',
  diesel: '',
  evaluationRate: '',
  comparison: '',
  monthlyTotal: '',
  nonOil: '',
  vouchers: ''
});

const createInitialUiState = () => ({
  showAnomalyModal: false,
  showParseOptions: false,
  showCalculationDetails: false,
  showFireworks: false,
  showLoading: false,
  loadingMessage: '处理中…',
  highlightedField: ''
});

const createInitialAnimations = () => ({
  entrance: '',
  interaction: '',
  background: '',
  celebration: false
});

const createInitialReportStatus = () => ({
  success: false,
  message: '',
  report: ''
});

const createInitialCopyStatus = () => ({
  success: false,
  message: ''
});

const createState = () => ({
  currentStep: 1,
  demoMode: DEFAULT_VALUES.demoMode,
  appStatus: defaultAppStatus(),
  steps: createDefaultSteps(),
  formData: createInitialFormData(),
  yesterdayData: createInitialYesterdayData(),
  expectedYesterdayDate: '',
  validationErrors: [],
  anomalies: [],
  missingFields: [],
  validationStatus: 'not_checked',
  calculatedResults: createInitialCalculatedResults(),
  calculationProcesses: createInitialCalculationProcesses(),
  calculationLogs: [],
  reportStatus: createInitialReportStatus(),
  copyStatus: createInitialCopyStatus(),
  uiState: createInitialUiState(),
  animations: createInitialAnimations(),
  notifications: []
});

export function createDataStore() {
  const state = createState();
  const listeners = new Set();
  const fieldWatchers = new Map();

  const notify = () => {
    listeners.forEach((listener) => listener(state));
  };

  const notifyField = (path, value, previous) => {
    if (fieldWatchers.has(path)) {
      fieldWatchers.get(path).forEach((fn) => fn(value, previous));
    }
  };

  return {
    state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      const fresh = createState();
      Object.keys(fresh).forEach((key) => {
        state[key] = fresh[key];
      });
      notify();
    },
    update(path, value) {
      const segments = path.split('.');
      let cursor = state;
      for (let i = 0; i < segments.length - 1; i += 1) {
        cursor = cursor[segments[i]];
        if (cursor === undefined) {
          throw new Error(`无效路径: ${path}`);
        }
      }
      const lastKey = segments.at(-1);
      const previous = cursor[lastKey];
      cursor[lastKey] = value;
      notify();
      notifyField(path, value, previous);
    },
    merge(patch) {
      Object.assign(state, patch);
      notify();
    },
    watch(path, callback) {
      if (!fieldWatchers.has(path)) {
        fieldWatchers.set(path, new Set());
      }
      const set = fieldWatchers.get(path);
      set.add(callback);
      return () => {
        set.delete(callback);
        if (set.size === 0) {
          fieldWatchers.delete(path);
        }
      };
    }
  };
}
