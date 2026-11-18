---
name: dev-flow
description: 工作流开关打开时，主会话在任何改代码、修复、实现之前必须先调用本技能。主会话只分配开发槽位并拉起子代理，可以并行到上限，禁止自己编辑文件。开关关闭或当前会话是子代理时不要调用。
---

# Dev Flow

使用 `{{DEV_FLOW_CLI}}`。工作区根是当前会话打开的目录。开关关闭时，`dispatch` 返回 `skip`，到此为止，不要创建槽位或子代理。

## 开发

1. 先用 `schedule-start` 创建这次调度任务。先确认这次需求基于哪条基线（默认是仓库默认分支），在 `schedule-start --base <基线分支>` 上写明：登记时会建立一组基线（编号 01、02…），把存在这条分支的每个仓库加进去并分配基线槽位 `<根>/base/<编号>/<仓库-编号>/`，下面每条任务默认继承这个组；已有组用 `--group <编号>`，单条任务也可以用 `task-create --base/--group` 覆盖。已有调度还没有槽位时用 `base-add --group <编号> --repo <仓库> --branch <基线分支>` 补建；面板的基线页也可以直接新建/编辑基线组（勾选项目和分支），失败会在编辑器里显示原因。拆分时每个任务只涉及一个服务（一个仓库）；跨服务的需求拆成多条任务，再用 `task-create --schedule <调度 id> --repos <一个仓库>` 分配开发槽位和 `df-task/<任务 id>` 分支。同一次调度下的多个开发任务共用这个调度 id。根目录检出不要改，也不要切换它的分支；合入由工作流在基线槽位里完成。
2. 结果如果是 `waiting`，不要拉这条任务的子代理。依赖已经待验收或已完成时，不要再等。
3. 对每条已经建好槽位、还没有子代理的任务执行 `dispatch --kind dev`。返回 `spawn` 就拉起一个子代理，工作目录用返回的 `cwd`，模型用返回的 `model`（空则跟随主会话）。不要因为另一条无关任务还在跑就停下来。
4. 同一轮把能开工的任务都派完，直到 `dispatch` 返回 `waiting`（已到子代理上限）。然后结束本轮，不要自己实现。结束前在主会话写明这次调度结果：创建了哪些任务，每条任务依赖谁、依赖分支有没有并入，以及分到的槽位（仓库名-编号）和分支。没有依赖或没有并入也要写出来。
5. 子代理必须把改动提交在任务分支上。完成后运行 `task-complete`。未提交改动不要当成完成。失败运行 `task-fail`。只有用户明确放弃时才运行 `task-abandon`。
6. 依赖链上的任务必须合回同一条基线；`task-create` 会拒绝基线不一致的依赖。同一基线组里不同项目的分支可以不同。

一个子代理同时只处理一个任务，但多个子代理可以并行，上限默认 3。开发槽位和验收槽位不能混用。不要把没有依赖关系的任务排成串行。

## 验收

用户点名或面板勾选待验收任务后，用 `accept-start` 准备验收槽位、验收任务和验收分支。同一验收批次里，同一个仓库的任务必须基于同一条基线分支，否则拆成两批。不要默认启动服务。

工作区根、`.dev-flow/` 或涉及仓库里如果有 `验收.md` 或 `VERIFY.md`，再 `dispatch --kind accept`，让一个子代理按说明验收。子代理发现需要启动服务时，不会自己启动，而会通知你。你在当前父会话里启动，工作目录用它给的验收槽位，端口用分配的端口，并保持运行。不要再开子代理去启动服务。什么说明都没有时，不要派验收子代理。

```bash
node {{DEV_FLOW_CLI}} accept-start --workspace <根> --id <批次 id> --tasks <任务>,<任务>
node {{DEV_FLOW_CLI}} dispatch --workspace <根> --session <会话> --kind accept --id <批次 id>
```

通过或不通过按单个开发任务记录。不要推送；需要清理已经结束的任务时用 `task-delete`，不要手动删分支。

## 常用命令

```bash
node {{DEV_FLOW_CLI}} schedule-start --workspace <根> --session <会话> --id <调度 id> --title <这次调度> [--base <基线分支> | --group <编号>]
node {{DEV_FLOW_CLI}} task-create --workspace <根> --schedule <调度 id> --id <任务 id> --title <标题> --repos <仓库>
node {{DEV_FLOW_CLI}} base-list --workspace <根>
node {{DEV_FLOW_CLI}} base-add --workspace <根> [--group <编号>] --repo <仓库> --branch <基线分支>
node {{DEV_FLOW_CLI}} base-remove --workspace <根> --group <编号> --repo <仓库>
node {{DEV_FLOW_CLI}} task-delete --workspace <根> --ids <任务>,<任务>
node {{DEV_FLOW_CLI}} scan --workspace <根>
node {{DEV_FLOW_CLI}} status --workspace <根>
node {{DEV_FLOW_CLI}} session-set --workspace <根> --session <会话> --enabled true
```

`task-delete` 只删已经结束的任务（`merged`、`abandoned`、`failed`、`rejected` 和不属于进行中验收批次的 `pending-acceptance`），会同时删掉 `df-task/<任务 id>` 分支并清理槽位、调度、代理和验收批次里的引用。子代理还在跑、任务仍在开发/等待/调度/待合入、或仍被其它未删除任务依赖时整批拒绝。分支删不掉时命令会返回 warning，任务记录仍然删除。
