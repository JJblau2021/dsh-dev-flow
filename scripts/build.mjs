import { createHash } from 'node:crypto'
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

const REGISTRY = 'dev-flow:css-registry'

const cssRegistry = {
  name: 'css-registry',
  setup(build) {
    build.onResolve({ filter: /^dev-flow:css-registry$/ }, () => ({ path: REGISTRY, namespace: 'df' }))
    build.onLoad({ filter: /.*/, namespace: 'df' }, () => ({
      contents: 'const chunks = []; export function register(text) { chunks.push(text) } export function all() { return chunks.join("\\n") }',
      loader: 'js',
    }))
  },
}

const cssModules = {
  name: 'css-modules',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = readFileSync(args.path, 'utf8')
      const names = new Set()
      for (const match of source.matchAll(/\.([A-Za-z_][\w-]*)/g)) names.add(match[1])
      // 面板样式注入到 document.head，是全局生效的；类名必须带文件哈希，
      // 否则 `.text`、`.line` 这类通用名字会命中宿主自己的界面。
      const file = relative(root, args.path).replaceAll('\\', '/')
      const hash = createHash('sha1').update(file).update('\0').update(source).digest('hex').slice(0, 6)
      const mapping = Object.fromEntries([...names].map((name) => [name, `df-${name}-${hash}`]))
      const scoped = source.replace(/\.([A-Za-z_][\w-]*)/g, (whole, name) => `.${mapping[name]}`)
      return {
        contents: `import { register } from '${REGISTRY}'; register(${JSON.stringify(scoped)}); export default ${JSON.stringify(mapping)};`,
        loader: 'js',
      }
    })
  },
}

const result = await esbuild.build({
  absWorkingDir: root,
  entryPoints: ['src/client/index.tsx'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['react', '@deepseek-ai/dsh-client-ui-primitives'],
  write: false,
  legalComments: 'none',
  plugins: [cssRegistry, cssModules],
})

const bundled = result.outputFiles[0].text
if (!bundled.includes('module.exports') && !bundled.includes('exports.apply')) {
  throw new Error('dev-flow: 构建结果没有导出 apply')
}

const client = `/**
 * 由 scripts/build.mjs 从 src/client 构建。不要手改这个文件。
 */
window.__ModuleLoader__.load({
  id: '@jjblau2021/dsh-dev-flow',
  factory(require) {
    const loaded = require('react');
    const React = loaded && typeof loaded.useState === 'function' ? loaded : loaded.default;
    const module = { exports: {} };
    const exports = module.exports;
    ${bundled}
    const plugin = module.exports;
    if (typeof plugin.apply !== 'function') throw new Error('dev-flow: 构建产物缺少 apply');
    return plugin;
  },
});
`

// 原子替换：先写临时文件再改名，避免宿主在构建中途读到半个 bundle 而整体白屏。
const target = resolve(root, 'client.js')
const temp = `${target}.tmp`
writeFileSync(temp, client)
renameSync(temp, target)
console.log('built client.js')
