import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

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

writeFileSync(resolve(root, 'client.js'), client)
console.log('built client.js')
