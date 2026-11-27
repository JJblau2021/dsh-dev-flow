## Why

工作流面板是本插件唯一的操作界面，但它现在是一套自己长出来的设计系统：`src/client/sheet.ts` 的 520 行 CSS 里定义了 `df-card`、`df-metrics`、`df-kicker`、`df-hover-card`、`df-review-native-select`、`df-icon-btn`、`df-menu-item`，等于把 DSH 已经提供的卡片、指标、hover card、菜单、图标按钮和下拉重新实现了一遍。浅色主题下 `--dsw-alias-bg-layer-1|2|3` 三者同为白色（`design-platform.css:181-183`），所以这些分组只能靠自绘描边与阴影拉开，整页变成"一堆小盒子"，与右侧栏其它面板不像同一个产品；DSH 的界面其实只有一层表面，层次靠 0.5px 细线、墨色分级与留白。

DSH 的规范把这条路堵死了：不得复制已存在的控件、只用 `--dsw-alias-*` 语义 token、菜单只能经 `Menu`/`MenuSurface`、hover 样式必须包在 `@media (hover: hover)` 里。既然功能清单已经稳定，现在是把视图层整体换成 DSH 原生语言的最低成本时机。

## What Changes

- 重写 `src/client` 的整个视图层，落到一套固定骨架：38px 页头（`SegmentedTabs size="sm"`）、34px 工具栏（`Pill` 筛选 + 28px 图标键）、32px sticky 段头、44–52px 记录行、52px 底部确认条。删除 `sheet.ts` 与全部 `df-*` 类。
- 五页信息架构按新风格重排，且每页只留一个视觉焦点：概览（指标带 + 项目带 + 未完成带，指标带里三个主数字 + 一行元信息）、任务（调度 / 开发 / 验收三条区域带，只有展开详情是抬起块）、槽位（每个仓库一条带 + 表格式槽位行 + 一行验收）、基线（每组一条带 + 成员行 + 编辑带）、代理（一个主数字 + 主会话行 + 跑着的子代理行，空闲合并成一行）。
- **BREAKING**（相对 `功能清单.md` 12.3）任务页去掉三块可独立拖拽高度、拖拽换序的面板与 `dsh-dev-flow.task-panes` 高度持久化，改为三段单滚动；筛选变成页级并作用于三段。
- 概览从"三张复合指标卡"改为三个 20px 主数字加一行元信息；项目与任务都改成 44px 无底行，全页零卡片。
- **不在范围**：Diff 页与设置页维持现状，本次一行不改——Diff 仍用 `diff-tab.tsx` + `vendor/FileDiff.tsx`，设置仍是插件详情页里的 `SettingsForm`。
- 会话开关从 `conversation.input.overlay` 迁到 `conversation.session.header.utilities`（`kind: 'list', scope: 'session'`），换成共享 `Switch`，只根会话显示。
- 反馈统一：瞬时成功/失败走全局 `Toast`（挂 `shell.overlay`）；行内失败用原位 notice + 重试；空状态用 13px `label-tertiary` 文本加一个 primary 按钮；列表首屏用行级 skeleton。
- 后端完全不动：`index.js`、`kernel/*`、`.dev-flow/` 状态文件 v3 与迁移、CLI、RPC 方法表、调度与验收规则一律保持现状。

## Capabilities

### New Capabilities

- `workflow-panel-ui`：工作流面板的页面结构与行为契约——五个页面各放什么、三段单滚动与筛选规则、批量选择与验收模式、会话开关、空/错/载三种状态。Diff 页与设置页不在本能力范围内。
- `panel-visual-system`：这套界面不可协商的视觉约束——只用主题 token、四级字阶、固定几何与间距次序、组件复用映射、九态状态词表、交互状态（hover/选中/焦点/禁用）四态可辨。

### Modified Capabilities

无。`openspec/specs/` 目前为空，本插件的既有规格以 `功能清单.md` 与 `需求.md` 为准。

## Impact

- 前端：`src/client/pages.tsx`（重写）、`plugin.tsx`（槽位迁移与 id 调整）、`ui.tsx`（去掉 `loadUi()` 兼容层，改为直接引用 primitives）、`locale.ts`（增删文案 key）、`styles.ts`/`snapshot.ts`；删除 `pages.tsx` 里面板相关的 `df-*` 用法；`sheet.ts` 保留（Diff 页仍在用它的 `df-review*` 类），`diff-tab.tsx` 与 `vendor/FileDiff.tsx` 不动。
- 构建：`scripts/build.mjs` 与包结构不变，不新增任何依赖。
- 依赖的 DSH 能力：`@deepseek-ai/dsh-client-ui-primitives`（运行时模块表提供，当前 `client.js` 已在用）、`conversation.session.header.utilities`（`ui-conversation/src/client/apply.ts:446`）。两者都需要在运行版 0.2.2-rc.5 上各做一次可用性验证。
- 文档：`README.md` 里引用的 `docs/images/panel-*.png` 旧截图全部失效，需要重新出图。
- 风险：面板宽度在 320–560px 之间浮动，骨架里的"三段 + 段头计数"必须在这个区间内不出现横向滚动。
