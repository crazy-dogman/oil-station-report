# index.html 逻辑全景梳理

## 1. 数据结构与状态
- **核心容器**：`gasStationApp()` 负责 `currentStep`、`demoMode`、`appStatus`、`steps` 等流程控制，并集中管理所有数据。
- **表单数据 `formData`**：含基础信息、油品（92#/95#/98#/柴油，携带升、吨与密度）、非油销售、电子券、工行积分/ETC、三端订单、实际评价、电子卡等输入。
- **昨日数据 `yesterdayData`**：缓存智能解析结果（单项、合计、月累计、非油累计、电子券累计），以 `parsed` 标识解析成功，供环比与月累计使用。
- **计算结果 `calculatedResults`**：存放汽油合计、柴汽合计、月累计、非油累计、电子券累计、环比、测评率等派生指标，并附 `calculationProcesses` 保存公式文本。
- **状态与反馈**：`reportStatus`、`copyStatus`、`validationStatus`、`missingFields`、`anomalies`、`uiConfig`、动画配置与庆祝特效参数共同维护交互体验。

## 2. 计算流程
- **升转吨**：`calculateTons(type)` 读取油品升数与密度比，输出两位小数吨数并记录详细计算过程。
- **汇总与累计**：`calculateTotals()` 生成汽油合计与柴汽合计，同时触发 `calculateMonthlyCumulative()`（昨日累计 + 今日销量）、`calculateMonthlyNonOilTotal()`（非油）、`calculateCumulativeVouchers()`（电子券）。
- **环比体系**：`calculateComparison()` 对比今日与昨日柴汽合计，产出变化量、变化率、描述文本，并调用 `calculateGasolineComparison()`、`calculateDieselComparison()` 复用 `calculateComparisonHelper()`。
- **测评率**：`calculateEvaluationRate()` 根据 `actualReviews.count` 与 `threeEndOrders.count` 计算百分比，提供完整公式说明。
- **最终计算**：`performFinalCalculations()`（文件内有重复定义）统一确保生成报告前所有派生数据最新。

## 3. 验证与异常处理
- **完整性检查**：`checkDataCompleteness()` 针对各步骤必填字段（含 0 判定为无效）收集缺失项，借助 `getNestedValue`、`getFieldDisplayName`、`getStepDisplayName` 提示用户。
- **异常检测**：`detectAnomalies()` 顺序执行 `checkSalesAnomaly()`（销量偏差>30%）、`checkComparisonAnomaly()`（环比>50%）、`checkEvaluationAnomaly()`（测评率<50% 或 >100%）、`checkMonthlyLogicAnomaly()`（月累计不一致）与 `checkDataRangeAnomaly()`（负值或超阈）。
- **报告前校验**：`checkReportDataCompleteness()` 确认日期/站名与油品销售数据存在，`validateReportGeneration()` 二次计算并确认总销量>0。

## 4. 报告生成系统
- **入口**：`generateFinalReport()` 触发终极庆祝动画、完整性校验、最终计算，然后依次拼接 8 个段落（油品销售、环比、非油、电子券、工行积分、工行ETC、三端订单、电子卡）。
- **输出管理**：`reportStatus` 记录成功与否及文本；`copyReport()` 首选 `navigator.clipboard`，失败时降级为 `execCommand`，并通过 `copyStatus` 呈现提示。
- **辅助方法**：`generateReportHeader()` 以及 `generateSectionX_*` 系列函数分别封装各段内容，引用 `formData` 与 `calculatedResults`。

## 5. 智能解析机制
- **触发点**：步骤2按钮调用 `parseYesterdayData()`，解析微信消息文本。
- **实现**：根据多组正则提取汽油/柴油、合计、月累计、非油、电子券、工行、三端、测评率等关键字段，成功提取≥5项即视为有效。
- **数据落库**：解析结果写入 `yesterdayData`，包含单项、合计、月累计与标记位，为后续环比与累计计算提供基础。
- **容错现状**：正则为硬编码格式，对文字变体、单位差异的兼容性有限，后续重构需增强稳健性。

## 6. 交互与 UI
- **步骤导航**：`currentStep` 搭配 `goToStep` / `nextStep` / `previousStep` 管理 7 步向导，动画通过 `triggerEntranceAnimation()`、`resetAnimations()` 与多套炫酷特效（磁悬浮、扫描仪等）呈现。
- **演示与反馈**：`testClick()`、`triggerInteractionAnimation()`、`showCopySuccess/Error()`、`triggerUltimateCelebrationAnimation()`（待补全）提供演示及用户反馈。
- **验证面板**：缺失字段与异常列表实时展示，指导用户纠错。
- **体验差距**：当前 UI 偏业务表单，视觉与交互未达到 `index2.html` 的沉浸式体验，为方案C重构提供提升空间。

## 7. 风险与改进要点
- **函数重复**：`performFinalCalculations()` 在文件中重复出现，潜在维护隐患。
- **高耦合结构**：数据、计算、验证、动画全部集中在单 Alpine 组件，难以复用或分层。
- **阈值写死**：异常判定与正则规则固定，缺乏配置化。
- **体验短板**：缺少实时视觉反馈和动态场景，与 `index2.html` 的沉浸式体验存在明显差距。
- **重构方向**：方案C 需以本梳理为基础，将流程、数据、视觉与音频整体重构到全新场景化界面中。

