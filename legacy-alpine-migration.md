# Alpine 逻辑迁移清单

| 模块/能力 | 旧版 `index.html` 描述 | 现状 (模块化版本) | 待迁移/改造要点 |
| --- | --- | --- | --- |
| **步骤导航** | `nextStep`/`prevStep`/`goToStep` 配合 `updateStepStatus`、自动滚动、多步骤卡片状态。 | ✅ 已迁移：`steps-navigation.js` + `app-shell` 控制步骤状态并同步体验舞台。 | 后续可补充滚动到卡片顶端/提示文案。 |
| **日期 & 演示逻辑** | `initializeDate`、`expectedYesterdayDate`、`demoMode`、`testClick` 设置默认日期与演示提示。 | ✅ `app-shell` 自动设置今日/昨日日期，导航面板支持“今日日期”与“加载演示数据”操作。 | 后续若需专门的演示引导，可继续扩展。 |
| **Reactive Watchers** | `setupReactiveWatchers` 用 `$watch` 监听关键字段自动触发计算/累计。 | ✅ 数据仓库新增 `watch()` API，关键字段变更自动触发重算与校验。 | 可视需要继续扩展更多字段及自定义副作用。 |
| **动画系统** | `triggerMagneticEntrance` 等五种入场、`triggerStepAnimation`、`resetAnimations`、`triggerUltimateCelebrationAnimation` 等，控制卡片、背景、庆祝动画。 | ✅ 使用 `experience/stage.js` 提供 index2 风格的粒子、脉冲、庆祝效果；旧版卡片动画已弃用。 | 可继续扩展更多场景或粒子形态。 |
| **音景联动** | 旧版未实现，需求为步骤/异常触发音效。 | ✅ `experience/audio-engine.js` 基于 Web Audio 生成场景化音景，随步骤/验证/庆祝联动。 | 若需更丰富素材，可后续替换为采样音源。 |
| **UI 状态/模态** | `uiState` 管理异常弹窗、解析选项、计算详情、loading、烟花等。 | ✅ 异常详情、解析选项、加载 overlay 均已实现（`anomaly-modal.js`、`parse-options-modal.js`、`loading-overlay.js`）。 | 后续可补充计算详情视图/烟花等视觉反馈。 |
| **异常触发与反馈** | 旧版多处调用 `detectAnomalies()` 并触发动画反馈。 | ✅ `app-shell` 内置自动校验节流，实时同步验证状态至舞台效果。 | 可继续扩展异常列表的高亮/通知与音效。 |
| **复制状态** | 通过 `copyReport` + `copyStatus` 显示复制结果提示。 | ✅ 复制事件触发全局通知并在报告面板提示。 | 可考虑重用 `copyStatus` 统一管理不同复制动作。 |
| **步骤内容与提示** | 7 步卡片包含图标、说明、手动/解析切换等 UI。 | 目前只有简化输入控件。 | 依据旧结构拆分成多个面板组件，补充引导文字与可选项。 |
| **庆祝动效联动** | 报告成功即触发终极庆祝动画 + confetti。 | ✅ `experience/stage.js` 的 celebrate() 在报告成功后调用；后续可替换为更丰富动画。 | 迭代动画细节即可。 |
| **日志与状态提示** | `appStatus.message` 等用于实时提示步骤/动画状态。 | ✅ Toast + `status-panel` 展示最新状态、期望日期与演示模式。 | 若需更长历史，可接入日志时间线。 |

> 本清单会随着迁移推进持续更新，可勾选完成项或追加细分任务。
