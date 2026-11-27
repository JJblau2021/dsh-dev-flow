# panel-visual-system

面板的视觉系统：颜色、字阶、几何、表面、状态与交互约定。所有页面共用同一套语法，页面只决定内容，不发明样式。

## ADDED Requirements

### Requirement: 只用主题 token

颜色、描边、阴影与圆角 MUST 全部来自 ui-theme 的语义变量（`--dsw-alias-*`、`--dsw-radius-*`）。MUST NOT 出现字面色值、自造 `color-mix`、自写 `box-shadow` 或主题分支选择器（`[data-ds-dark-theme]`、`prefers-color-scheme`）。状态色只允许出现在状态点、状态词、diff 行与错误提示上；结构一律中性墨色。主题新增或更换时面板 MUST 不需要改样式。

#### Scenario: 深色主题

- **WHEN** 用户切到深色主题
- **THEN** 面板底色、墨色、状态点与描边全部跟随，面板代码里没有任何一条深色专用规则

### Requirement: 组件复用优先

凡 DSH 已有实现的控件 MUST 复用：`Button`、`Switch`、`Checkbox`、`Input`、`Pill`、`Tag`、`StateDot`、`Menu`、`Tooltip`、`HoverCard`、`Modal`、`Toast`、`DiffBlock`、`SegmentedTabs`。MUST NOT 复制这些控件的视觉或行为；需要不同尺寸或语气时 MUST 通过 prop 或局部 custom property 表达。只有列表行、列头、段头、停靠区这类「页面骨架」由面板自己实现。

#### Scenario: 需要 segmented 控件

- **WHEN** 界面需要一组互斥选项
- **THEN** 使用 primitives 的 `SegmentedControl`，不自绘胶囊与滑动指示器

### Requirement: 字阶四级

面板内 MUST 只用四级字号：22/28/500（页面主数）、13/20/500（段头、组头）、12/18/400（元信息、状态词、正文辅助）、11/16/400（列头与等宽路径、分支、编号）。13px 的正文级标题 MUST NOT 加粗到 500 以上：段头与组头可以用 500，**任务名等条目标题 MUST 用 400**——列表里每行都加粗就没有层级可言。字重 MUST NOT 超过 500。等宽字体 MUST 只用于路径、分支、编号与数字。MUST NOT 为单个元素发明字号，也 MUST NOT 用 600/700 加粗制造层级。

#### Scenario: 强调一行

- **WHEN** 某行需要比其它行更突出
- **THEN** 允许用 500 字重 + 主墨色 + 选中底色，不放大字号也不加粗到 600

### Requirement: 并列与分隔符

两件以上互相独立的事实 MUST NOT 用中点（`·`）、竖线（`|`）、斜线（`/`）或破折号串成一句。可用的做法只有三种：进各自的列（首选）、各占一行、或写成一句自然语言（逗号、冒号、括号）。数字与标签配对时 MUST 是「标签 + 数字」的紧邻对（`开发 1`），对与对之间 MUST 用 10–14px 间距分开，MUST NOT 插入任何分隔符。同一段文字里 MUST NOT 出现两个以上中点。

#### Scenario: 页脚的两项统计

- **WHEN** 需要同时显示活跃槽位数与基线改动数
- **THEN** 它们是两格指标或两行文字，不写成「4 个活跃槽位 · 1 条基线有改动」

#### Scenario: 一行里的仓库、编号与时间

- **WHEN** 一条任务需要显示所属仓库、编号与已用时间
- **THEN** 仓库与编号写在副行（`kernel 05-支付回调`），时间进自己的列，不串成「kernel · 05-支付回调 · 12 分钟」

### Requirement: 几何与圆角

列表页 MUST 用同一套尺寸，不得逐页微调：

- 列表项 38px 高、`padding: 0 10px 0 16px`、圆角 8；图标位 20×20；名称 13/20/500；自定义区域 12/18。
- 组块（仓库、基线组）34px 高，与列表项不同高。
- 停靠区头部 34、kv 行 24、文件行 24；工具图标键 28；行内操作键 24；砖 20 R6；输入 32 R12；按钮 28 R8。

MUST NOT 出现列头（column header）、列对齐、单元格描边或任何表格结构。

#### Scenario: 一行任务

- **WHEN** 渲染一条开发任务
- **THEN** 这一行 38px 高，左侧 20px 图标位、中间名称、右侧自定义区域，没有任何列头或对齐线

#### Scenario: 320px 宽的侧栏

- **WHEN** 面板被拖到 320px
- **THEN** 行仍是三段，名称先被截断/滚动，自定义区域不被压扁

### Requirement: 表面与层次

面板 MUST 视为页面的一列，铺 `--dsw-alias-bg-base`，MUST NOT 有左右下边框、MUST NOT 铺自己的抬高层。层次 MUST 只由三件事产生：44px 网格（列对齐）、段头与 18px 间距、三级墨色。MUST NOT 用区域整幅底色带、卡片、描边盒、竖轨或缩进分组。全页唯一的结构容器是停靠区，它只给自己的上沿一条 0.5px 线。抬高的材质（阴影、模糊）只留给菜单、弹层、`Tooltip`、`Toast` 与对话框。

#### Scenario: 区分两个区域

- **WHEN** 任务页要把调度与开发分开
- **THEN** 用段头（13/500 + 计数 + 右端动作）与 18px 间距，不铺底色也不画线

#### Scenario: 停靠区

- **WHEN** 任务详情或基线编辑器出现
- **THEN** 它固定在面板下半屏，与列表之间只有一条 0.5px 上沿，自身没有圆角与底色

### Requirement: 视觉词汇与分割线预算

只有三种承担结构的东西：

1. **列表项**（38px）：默认无底色，悬停铺 `interactive-bg-hover`，圆角 8。
2. **组块**（34px）：仓库、基线组的标题行，不参与列表项形态。
3. **停靠区**：全页唯一的容器，只有上沿一条 0.5px 线。

MUST NOT 使用：表格（列头 / 列对齐 / 单元格描边）、卡片、整幅色带、缩进竖轨、分割线。

#### Scenario: 一页的线

- **WHEN** 看任意一页
- **THEN** 除了停靠区上沿，没有第二条横线或竖线

### Requirement: 列表项的三段与悬停

每个对象 MUST 是一条列表项，由三部分组成：**图标位、名称、自定义区域**。MUST NOT 出现第四段（副行、次级说明行）——次要信息要么并进名称（等宽后缀），要么进自定义区域，要么留给详情。

- 名称溢出时 MUST 在悬停时横向滚动到末尾（从左往右走到最后一段），离开 MUST 复位；未溢出 MUST 不动。
- 名称未悬停且放不下时 MUST 省略号（或裁剪），MUST NOT 用 tooltip 代替滚动。
- 自定义区域平时 MUST 显示一个值；悬停 MUST 换成操作键（最多 3 个 24px 图标键）。
- 悬停 MUST NOT 改变行高、列宽或把值挤走——操作键占用预留宽度。

#### Scenario: 名称太长

- **WHEN** 任务名超过名称区宽度且用户悬停该行
- **THEN** 名称从右往左滚到末尾，行高不变；鼠标离开后回到开头

#### Scenario: 自定义区域换操作

- **WHEN** 用户悬停一条开发任务
- **THEN** 右侧的值（「开发中」）淡出，同一位置出现暂停/停止/更多三个 24px 键

### Requirement: 每页一个焦点

每页 MUST 只有一个 22px 元素组（概览与代理的运行数）或一个停靠区。焦点 MUST NOT 与其它 22px 元素同页出现两次。每行 MUST 最多三段信息：标记 + 标题/副行 + 右侧一个值。MUST NOT 在行内塞短 id、多个标签与时间；这些属于副行或停靠区。

#### Scenario: 概览页的焦点

- **WHEN** 用户打开概览页
- **THEN** 视线先落在三格 22/28/500 主数上，其余是 30/44px 行与 12px 元信息

#### Scenario: 任务页的焦点

- **WHEN** 用户选中一条任务
- **THEN** 焦点是停靠区，列表行只铺选中底色，不放大字号

### Requirement: 间距与分组

左右 inset MUST 为 16px（列头、行、段头、组行一致）。间距 MUST 按固定次序：行内 2–6、列内 8、段头到首行 0、段间 18、页级 6–10。外层间距 MUST 大于内层；标题 MUST 离自己的内容比离上一组更近。MUST NOT 靠整体缩小字号或 gap 处理密度，密度差异 MUST 体现在「单行 30 / 双行 44」与信息取舍上。

#### Scenario: 段与段之间

- **WHEN** 开发段与验收段相接
- **THEN** 两段之间是 18px 加一个段头，段头与其列头的距离小于段与段之间

#### Scenario: 窄面板

- **WHEN** 面板被拖到 320px 宽
- **THEN** 行仍按左 16 起排，右列仍右对齐，不出现横向滚动

### Requirement: 状态词表

状态 MUST 由行右端的**指示灯 + 状态词**共同表达（灯 6px、词 12px，间距 6px，灯在词的左边）。MUST NOT 把指示灯放进左侧图标位：图标位属于**结构**（叶子 / 有子级 / 展开与否），状态只在右端。

灯色：待验收、已通过 = success；待合入、被占用 = warning；失败、未通过、槽位缺失、异常 = error；等待、暂停、空闲、未建立、不计入 = neutral。**开发中 / 运行中 MUST 是蓝色呼吸灯**：7px 蓝点（`--dsw-alias-state-business-primary`）+ 同色光晕，1.9s 循环呼吸（透明度与光晕同步），常驻一圈淡光晕保证静帧也像亮着的灯；`prefers-reduced-motion` 下停止呼吸但保留蓝点与光晕。MUST NOT 用旋转圆弧、MUST NOT 用绿色。

状态词 MUST 用中性墨色，只有「失败」「未通过」「异常」允许用 error 墨色，「被占用」允许用 warning 墨色。MUST NOT 用彩色胶囊。灯只表达状态类别，MUST NOT 用灯替代状态词（只有灯没有词的表达不合格）。

词表固定为：开发中、待验收、待合入、已合入、已通过、未通过、失败、等待、暂停、空闲、未建立、异常、被占用。

#### Scenario: 一条失败的任务

- **WHEN** 渲染一条失败的任务行
- **THEN** 左侧图标是任务结构图标（与状态无关），右端写红色「失败」二字，整行没有红点也没有红色胶囊

#### Scenario: 一条开发中的任务

- **WHEN** 一条任务状态是开发中
- **THEN** 左侧图标仍是结构图标（叶子或箭头），右端写「开发中」，不出现蓝灯或旋转圆弧

### Requirement: 交互四态可辨

选中、悬停、焦点与禁用 MUST 能同时被分辨。选中 MUST 用选中底色（浅色偏冷灰、深色提亮一档）且 MUST NOT 被悬停覆盖；悬停 MUST 是更浅的一层填充；焦点 MUST 走 `--dsw-focus-ring-*`；禁用 MUST 降低墨色。所有 `:hover` MUST 包在 `@media (hover: hover)` 内，选中与键盘焦点样式 MUST 放在媒体查询之外。

#### Scenario: 悬停一条已选中的行

- **WHEN** 鼠标移到已选中行上
- **THEN** 行仍是选中底色，不出现第二层填充

### Requirement: 菜单、浮层与提示

菜单、下拉、上下文菜单 MUST 用 `Menu` 或 `MenuSurface`，MUST NOT 覆盖菜单材质。弹层 MUST 外部点击与 Escape 关闭、portal 渲染、只在能放下的一侧翻转。含义不明的纯图标动作 MUST 配 `Tooltip`；信息性悬停内容 MUST 用 `HoverCard`，MUST NOT 自造 `title`。

#### Scenario: 行尾的更多按钮

- **WHEN** 行内显示一个「更多」图标键
- **THEN** 悬停与聚焦都出 `Tooltip`「更多操作」，点击弹出 `Menu`

### Requirement: 图标

图标 MUST 来自 primitives 的图标表（Regular 1px / Medium 1.3px，16 viewBox），MUST NOT 复制 SVG 路径。每个页签 MUST 有语义正常的图标。图标与伴随文字 MUST 同前景色；纯图标动作 MUST 配 `Tooltip`。

列表项与页签的图标 MUST 用**细线风格**：16 viewBox、1px 线宽（Regular 档）、round cap / round join、默认无填充；只有点阵（如更多菜单的三点）允许实心。线宽 MUST NOT 超过 1.3px，MUST NOT 用双线或面性图形。自绘 glyph（示意稿阶段）也 MUST 遵守同一套几何，落到实现时换成 primitives 里对应的 Regular 图标。

列表项的图标位 MUST 用图形表达对象类型：仓库用 git 分支 glyph，子代理用 agent glyph，主会话用会话 glyph。MUST NOT 用首字母、缩写或色块里的文字当图标。

#### Scenario: 页签图标

- **WHEN** 面板注册右侧栏页签
- **THEN** 页签有图标，且图标与标题同墨色
#### Scenario: 项目行

- **WHEN** 列表里出现仓库
- **THEN** 图标位是 git 分支图形，不是仓库首字母


### Requirement: 加载与骨架

列表区域加载 MUST 用与行高一致的骨架（30/44px，2–4 行），MUST NOT 用整块 spinner 遮住已有内容。页面级首屏加载 MUST 用居中裸 spinner。一个页面 MUST 只用一种加载表现。刷新失败 MUST 保留已渲染数据并在顶部给一行可重试的提示。

#### Scenario: 刷新失败

- **WHEN** 拉取状态失败但已有数据
- **THEN** 列表照常显示，顶部出现一行「刷新失败，显示上次数据 · 重试」
