import type React from 'react'
import type { AgentRow, Snapshot, TaskRow, Translate } from '../types'
import { Empty, IconAgent, IconChat, Item, SplitGroup, Status } from './parts'
import { statusText, toneOf } from './status'
import css from './ui.module.css'

/** 代理页：顶部三个数字，下面「主会话 / 子代理」两块子面板。 */
export function Agents({ data, t }: { data: Snapshot, t: Translate }) {
  const counts = data.counts
  const agents = data.agents ?? []
  const tasks = new Map<string, TaskRow>((data.tasks ?? []).map((task) => [task.id, task]))
  const limit = counts.agentLimit ?? 0
  const active = counts.activeAgents ?? 0
  const accepting = agents.filter((agent) => agent.status === 'accepting').length
  const idle = Math.max(0, limit - active)

  const metrics: { key: string, value: React.ReactNode, label: string }[] = [
    {
      key: 'running',
      value: (
        <>
          {active}
          <span className={css.metricLabel} style={{ fontSize: 13, marginLeft: 1 }}>{`/${limit}`}</span>
        </>
      ),
      label: t('agents.running'),
    },
    { key: 'accepting', value: accepting, label: t('status.accepting') },
    { key: 'idle', value: idle, label: t('status.idle') },
  ]

  return (
    <div className={css.group} style={{ overflow: 'hidden' }}>
      <div className={css.metrics}>
        {metrics.map((metric) => (
          <div key={metric.key} className={css.metric}>
            <span className={css.metricValue}>{metric.value}</span>
            <span className={css.metricLabel}>{metric.label}</span>
          </div>
        ))}
      </div>
      <SplitGroup
        panes={[
          {
            key: 'main',
            title: t('agents.main'),
            content: (
              <Item
                icon={<IconChat />}
                title={t('agents.mainHint')}
                titleAttr={t('agents.mainHint')}
                trail={<Status tone="idle" label={t('agents.notCounted')} />}
              />
            ),
          },
          {
            key: 'sub',
            title: t('agents.sub'),
            count: agents.length,
            content: agents.length === 0
              ? <Empty text={t('agents.empty')} />
              : agents.map((agent) => agentRow(agent, tasks, t)),
          },
        ]}
      />
    </div>
  )
}

function agentRow(agent: AgentRow, tasks: Map<string, TaskRow>, t: Translate) {
  const task = agent.taskId ? tasks.get(agent.taskId) : agent.lastTaskId ? tasks.get(agent.lastTaskId) : undefined
  const status = agent.status === 'running' ? 'running' : agent.status || 'idle'
  return (
    <Item
      key={agent.id}
      icon={<IconAgent />}
      title={agent.id}
      titleAttr={agent.id}
      suffix={task ? task.title : t('status.idle')}
      trail={<Status tone={toneOf(status)} label={statusText(t, status)} />}
    />
  )
}
