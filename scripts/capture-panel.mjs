import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sheet = readFileSync(resolve(root, 'src/client/sheet.ts'), 'utf8')
const css = sheet.match(/export const panelSheet = `([\s\S]*?)`/u)?.[1]
if (!css) throw new Error('找不到面板样式')

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const outDir = resolve(root, 'docs/images')
const tmpDir = resolve(root, '.capture')
mkdirSync(outDir, { recursive: true })
mkdirSync(tmpDir, { recursive: true })

const theme = `
  :root {
    --dsw-alias-label-primary: rgb(15, 17, 21);
    --dsw-alias-label-secondary: rgb(97, 102, 107);
    --dsw-alias-label-tertiary: rgb(129, 133, 140);
    --dsw-alias-label-primary-foreground: #fff;
    --dsw-alias-bg-base: #fff;
    --dsw-alias-border-l2: rgba(0, 0, 0, 0.1);
    --dsw-alias-border-l4: rgba(0, 0, 0, 0.16);
    --dsw-alias-state-business-primary: rgb(65, 118, 230);
    --dsw-alias-state-success-primary: rgb(34, 197, 94);
    --dsw-alias-state-warn-primary: rgb(245, 158, 11);
    --dsw-alias-state-error-primary: rgb(236, 19, 19);
    --dsw-alias-button-primary-fill: rgb(15, 17, 21);
    --dsw-radius-md: 8px;
    --dsw-radius-sm: 6px;
    color-scheme: light;
  }
  body { margin: 0; background: rgb(249, 250, 251); font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; }
  .frame { width: 400px; padding: 16px; box-sizing: border-box; }
  .tabs { display: grid; grid-template-columns: repeat(4, 1fr); background: #fff; border: 0.5px solid rgba(0,0,0,.12); border-radius: 8px; padding: 2px; }
  .tabs span { height: 30px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: rgb(97, 102, 107); border-radius: 6px; }
  .tabs span[data-on] { background: #fff; color: rgb(65, 118, 230); box-shadow: inset 0 0 0 0.5px rgba(0,0,0,.08); }
  .ghost { border: 0; background: transparent; color: rgb(65, 118, 230); font-size: 13px; padding: 0 8px; height: 28px; }
  .pill { height: 24px; padding: 0 10px; border-radius: 999px; background: rgb(241, 243, 245); color: rgb(97, 102, 107); font-size: 12px; display: inline-flex; align-items: center; }
  .pill[data-on] { color: #fff; background: rgb(65, 118, 230); }
  .tag { display: inline-flex; align-items: center; border-radius: 999px; padding: 1px 8px; font-size: 11px; line-height: 17px; font-weight: 500; }
  .tag.info { color: rgb(65, 118, 230); background: color-mix(in srgb, rgb(65, 118, 230) 10%, transparent); }
  .tag.warn { color: rgb(180, 110, 0); background: color-mix(in srgb, rgb(245, 158, 11) 16%, transparent); }
  .tag.bad { color: rgb(236, 19, 19); background: color-mix(in srgb, rgb(236, 19, 19) 10%, transparent); }
  .tag.ok { color: rgb(21, 128, 61); background: color-mix(in srgb, rgb(34, 197, 94) 14%, transparent); }
  .tag.neutral { color: rgb(97, 102, 107); background: rgb(241, 243, 245); }
  .go { width: 100%; height: 36px; border: 0; border-radius: 8px; background: rgb(15, 17, 21); color: #fff; font-size: 14px; }
  .mini { height: 28px; padding: 0 10px; border-radius: 6px; border: 0.5px solid rgba(0,0,0,.16); background: #fff; font-size: 12px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .dot.ongoing { background: rgb(65, 118, 230); }
  .dot.idle { background: rgb(173, 178, 184); }
`

function page(name, active, body) {
  const tabs = ['概览', '任务', '槽位', '代理'].map((label) => `<span ${label === active ? 'data-on' : ''}>${label}</span>`).join('')
  return `<!doctype html><meta charset="utf-8"><style>${theme}${css}</style><div class="frame"><div class="df"><div class="df-toolbar"><div class="tabs">${tabs}</div><button class="ghost">刷新</button></div>${body}</div></div>`
}

const pages = {
  overview: page('overview', '概览', `
    <div class="df-metrics">
      <div class="df-metric"><div class="df-kicker">项目</div><strong>3</strong></div>
      <div class="df-metric" data-tone="info"><div class="df-kicker">活跃子代理</div><strong>2/3</strong></div>
      <div class="df-metric"><div class="df-kicker">活跃任务</div><strong>3</strong></div>
      <div class="df-metric"><div class="df-kicker">活跃槽位</div><strong>3</strong></div>
      <div class="df-metric" data-tone="warn"><div class="df-kicker">待验收</div><strong>3</strong></div>
      <div class="df-metric" data-tone="warn"><div class="df-kicker">主干不干净</div><strong>1/3</strong></div>
    </div>
    <h3 class="df-section">主干</h3>
    <div class="df-card">
      <div class="df-line"><span class="df-name">kit</span><span class="df-ok">干净</span></div>
      <div class="df-line"><span class="df-name">glose</span><span class="df-warn">不干净</span></div>
      <div class="df-line"><span class="df-name">docs</span><span class="df-ok">干净</span></div>
    </div>
    <h3 class="df-section">活跃中</h3>
    <div class="df-card">
      <div class="df-line"><span>agent-1 · 开发 · 登录改造</span><span class="df-meta">kit-01</span></div>
      <div class="df-line"><span>agent-3 · 验收 · 批次 12</span><span class="df-meta">kit 4173</span></div>
    </div>
    <p class="df-note">开发 2/4 · 验收 1/2</p>
  `),
  tasks: page('tasks', '任务', `
    <div class="df-filters"><span class="pill" data-on>全部</span><span class="pill">待验收</span><span class="pill">开发中</span><span class="pill">更早</span></div>
    <div class="df-card">
      <div class="df-task"><span class="dot ongoing"></span><div><div class="df-name">登录改造</div><div class="df-meta">kit-01 · df-task/login</div></div><span class="tag info">开发中</span></div>
      <div class="df-task"><span class="dot idle"></span><div><div class="df-name">支付回调</div><div class="df-meta">glose-02 · df-task/pay</div></div><span class="tag bad">失败</span></div>
      <div class="df-task"><input class="df-check" type="checkbox" checked><div><div class="df-name">文案调整</div><div class="df-meta">glose · df-task/copy</div></div><span class="tag warn">待验收</span></div>
      <div class="df-task"><input class="df-check" type="checkbox" checked><div><div class="df-name">设置页</div><div class="df-meta">docs · df-task/settings</div></div><span class="tag warn">待验收</span></div>
      <div class="df-task"><span class="dot idle"></span><div><div class="df-name">批次 batch-12</div><div class="df-meta">kit 验收 · 端口 4173</div></div><span class="df-actions"><span class="tag warn">待确认</span><button class="mini">通过</button><button class="mini">不通过</button></span></div>
    </div>
    <div class="df-foot"><button class="go">发起验收</button><p class="df-hint">按勾选顺序并入：文案调整 → 设置页</p></div>
  `),
  slots: page('slots', '槽位', `
    <p class="df-note">开发 2/4 · 验收 1/2</p>
    <section class="df-card">
      <div class="df-repo"><strong>kit</strong> <span class="df-ok">干净</span></div>
      <div class="df-slot"><span>开发 01</span><span class="df-warn">占用</span><span class="df-meta">登录改造 · df-task/login</span></div>
      <div class="df-slot"><span>开发 02</span><span class="df-ok">空闲</span><span class="df-meta">可复用</span></div>
      <div class="df-slot"><span>验收</span><span class="df-warn">占用</span><span class="df-meta">端口 4173 · batch-12</span></div>
    </section>
    <section class="df-card">
      <div class="df-repo"><strong>glose</strong> <span class="df-warn">不干净</span></div>
      <div class="df-slot"><span>开发 01</span><span class="df-ok">空闲</span><span class="df-meta">可复用</span></div>
      <div class="df-slot"><span>开发 02</span><span class="df-warn">占用</span><span class="df-meta">支付回调 · df-task/pay</span></div>
      <div class="df-slot"><span>验收</span><span class="df-ok">空闲</span><span class="df-meta">端口 4180</span></div>
    </section>
    <section class="df-card">
      <div class="df-repo"><strong>docs</strong> <span class="df-ok">干净</span></div>
      <div class="df-slot"><span>开发</span><span class="df-muted">未建立</span><span class="df-meta">还没有开发槽位</span></div>
      <div class="df-slot"><span>验收</span><span class="df-muted">未建立</span><span class="df-meta">不计入验收分母</span></div>
    </section>
  `),
  agents: page('agents', '代理', `
    <p class="df-note">活跃子代理 2/3</p>
    <div class="df-card">
      <div class="df-agent"><span class="dot idle"></span><div><div class="df-name">主会话</div><div class="df-meta">不开发</div></div><span class="tag neutral">调度</span></div>
      <div class="df-agent"><span class="dot ongoing"></span><div><div class="df-name">agent-1</div><div class="df-meta">开发 · 登录改造</div></div><span class="tag info">处理中</span></div>
      <div class="df-agent"><span class="dot idle"></span><div><div class="df-name">agent-2</div><div class="df-meta">上一任务 · 支付回调</div></div><span class="tag neutral">空闲</span></div>
      <div class="df-agent"><span class="dot ongoing"></span><div><div class="df-name">agent-3</div><div class="df-meta">验收 · 批次 12</div></div><span class="tag ok">处理中</span></div>
    </div>
  `),
}

const heights = { overview: 760, tasks: 720, slots: 640, agents: 520 }

for (const [name, html] of Object.entries(pages)) {
  const file = resolve(tmpDir, `${name}.html`)
  const image = resolve(outDir, `panel-${name}.png`)
  writeFileSync(file, html)
  const shot = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    `--user-data-dir=${resolve(tmpDir, 'chrome')}`,
    '--force-device-scale-factor=2',
    `--window-size=400,${heights[name]}`,
    `--screenshot=${image}`,
    `file://${file}`,
  ], { stdio: 'inherit' })
  if (shot.status !== 0) throw new Error(`截图失败 ${name}`)
}
console.log('captured', outDir)
