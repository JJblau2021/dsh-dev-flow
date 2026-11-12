---
name: dev-flow
description: 工作流开关打开时，主会话在任何改代码、修复、实现之前必须先调用本技能。主会话只分配开发槽位并拉起一个子代理，禁止自己编辑文件。开关关闭或当前会话是子代理时不要调用。
---

# Dev Flow

使用 `{{DEV_FLOW_CLI}}`。工作区根是当前会话打开的目录。开关关闭时，`dispatch` 返回 `skip`，到此为止，不要创建槽位或子代理。

## 开发

1. 用 `task-create` 分配开发槽位和 `df-task/<任务 id>` 分支。主干检出不要改。
2. 结果如果是 `waiting`，不要拉子代理。
3. 否则用 `dispatch --kind dev`。返回 `spawn` 时，只拉起一个子代理，工作目录用返回的 `cwd`，模型用返回的 `model`（空则跟随主会话）。
4. 拉起后结束本轮，不要自己实现。
5. 子代理必须把改动提交在任务分支上。完成后运行 `task-complete`。未提交改动不要当成完成。失败运行 `task-fail`。只有用户明确放弃时才运行 `task-abandon`。

一个子代理同时只处理一个任务。开发槽位和验收槽位不能混用。

## 验收

用户点名或面板勾选待验收任务后：

```bash
node {{DEV_FLOW_CLI}} accept-start --workspace <根> --id <批次 id> --tasks <任务>,<任务>
node {{DEV_FLOW_CLI}} dispatch --workspace <根> --session <会话> --kind accept --id <批次 id>
```

验收子代理只用返回里的端口。通过或不通过分别运行 `accept-pass`、`accept-fail`。不要合并，不要推送，不要删除分支。

## 常用命令

```bash
node {{DEV_FLOW_CLI}} scan --workspace <根>
node {{DEV_FLOW_CLI}} status --workspace <根>
node {{DEV_FLOW_CLI}} session-set --workspace <根> --session <会话> --enabled true
```
