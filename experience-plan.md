# 体验方案C实施计划

## 1. 目标体验
- **沉浸式场景**：沿用 `index2.html` 的多层 Canvas、3D 倾斜与音频反馈，将 7 步流程包装成未来式操作台。
- **实时联动**：业务数据驱动粒子、极光、HUD 指标与音效，异常/完成事件触发对应反馈。
- **可维护结构**：拆分数据、计算、解析、视觉、音频与 UI 层，便于扩展和测试。

## 2. 模块职责
| 模块 | 职责 |
| --- | --- |
| `core/data-store.js` | 管理 `formData`、`yesterdayData`、`calculatedResults` 等，提供订阅/事件。 |
| `core/compute-engine.js` | 封装升转吨、月累计、环比、异常检测、报告生成等纯函数。 |
| `core/parser-service.js` | 集中正则配置与解析逻辑，为后续容错扩展做准备。 |
| `core/thresholds.js` | 存放密度、阈值、模板等常量，供代码与文档统一引用。 |
| `experience/visual-engine.js` | 负责 Canvas 场景、多图层特效、HUD 指标，可参考 `index2` 的 `VisualEngine`。 |
| `experience/audio-engine.js` | 管理 Web Audio 场景与触发器，将业务事件映射为音效。 |
| `experience/feedback-controller.js` | 监听 Store 事件，协调视觉与音频反馈。 |
| `ui/*.js` | 负责步骤面板、分析面板、报告输出、控制栏等界面组件。 |

## 3. 文件结构建议
```
/src
  /core
    data-store.js
    compute-engine.js
    parser-service.js
    thresholds.js
  /experience
    visual-engine.js
    audio-engine.js
    feedback-controller.js
  /ui
    app-shell.js
    steps-panel.js
    analytics-panel.js
    report-panel.js
    controls.js
/index.html (或 /src/main.html，构建后产出 dist)
```

## 4. 迁移顺序
1. **核心常量与数据层**：创建 `thresholds.js`、`data-store.js`，迁移表单/状态管理。
2. **计算与验证**: 抽取 `compute-engine.js`，整理现有计算函数，统一对外 API。
3. **UI 骨架**：在 `app-shell.js` 中初始化 Store + UI 组件，确保输入→计算链路可运行。
4. **视觉/音频接入**：移植 `VisualEngine`/`AudioEngine` 并与 Store 事件联动。
5. **反馈与报告**：整合验证面板、异常提示、报告生成与庆祝动画，完成体验打磨。

## 5. 实施建议
- **构建工具**：采用 Vite/Rollup 等轻量工具，以 ES 模块组织源码，`npm run build` 输出静态文件部署到 GitHub Pages。
- **阈值配置化**：所有 30%/50% 等阈值统一定义在 `thresholds.js`，文档引用同一来源，避免不一致。
- **渐进迁移**：先保证旧功能在新结构下可运行，再逐步接入视觉/音频模块，降低一次性风险。
- **文档同步**：`index-logic-overview.md` 与 `计算逻辑优化.md` 可直接引用 `thresholds.js` 中的常量说明，保持规范同步。

## 6. 当前进展节选
- ✅ 已完成核心数据层/计算引擎拆分，`app-shell` 接入自动校验调度与步骤导航。
- ✅ 体验舞台 `experience/stage.js` 实现 index2 风格的沉浸式背景/脉冲/庆祝效果，并与步骤、验证、报告联动。
- ✅ 引入 Vite + `patch-package` 的构建流程，提供 `npm run dev/build/preview/check` 全套脚本。
- ✅ 新增全局 Toast、异常弹层、解析选项与加载模态，配合自动验证、复制、解析等事件输出通知。
- ✅ 迁移日期/演示模式逻辑，并新增状态面板、计算详情面板以承接旧版日志/计算展示需求。
- ✅ 引入粒子背景与音景引擎：`experience/stage.js` 支持多场景粒子特效，`audio-engine.js` 提供场景化音景并自动随步骤/验证联动。
- ✅ 计算详情扩展：字段级 watcher 自动触发重算，`calculation-panel` 展示更多公式并记录实时计算日志。
- 🔊 粒子/音景升级：多层粒子（连接线、脉冲、火花）与程序化音景（Pad/LFO/噪声）已上线，可根据步骤、验证、庆祝动态切换。
- 🔜 下一阶段将继续迁移 UI 模态、通知与剩余表单提示；动画仅保留 index2 风格（旧版 Alpine 卡片动画已弃用）。
