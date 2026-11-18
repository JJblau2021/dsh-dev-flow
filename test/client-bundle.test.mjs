import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 面板的组件引用若漏了 import，esbuild 不会报错，运行时才会抛 ReferenceError。
// 这里重新构建一次客户端，再静态检查构建产物里每个 createElement 的组件都有定义。
const root = new URL('..', import.meta.url);

execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'ignore' });
const bundle = readFileSync(new URL('client.js', root), 'utf8');

function defined(name) {
  return new RegExp(`(?:function|class)\\s+${name}\\b`, 'u').test(bundle)
    || new RegExp(`(?:var|let|const)\\s+${name}\\b`, 'u').test(bundle);
}

test('the built client defines every component it renders', () => {
  const used = new Set([...bundle.matchAll(/React\.createElement\(([A-Za-z_$][\w$]*)(?=[,)\s])/gu)].map((match) => match[1]));
  const missing = [...used].filter((name) => name !== 'React' && !defined(name));
  assert.deepEqual(missing, [], `client.js 渲染了未定义的组件：${missing.join(', ')}`);
});

test('the comparison component is in the bundle', () => {
  assert.match(bundle, /function FileDiff\(/u);
});

test('css module class names are scoped to the panel', () => {
  // 面板样式注入 document.head，全局生效；类名必须带文件哈希，不能是裸的 .text/.line。
  assert.match(bundle, /df-text-[0-9a-f]{6}/u);
  const registered = [...bundle.matchAll(/register\("((?:[^"\\]|\\.)*)"\)/gu)].map((match) => JSON.parse(`"${match[1]}"`));
  const css = registered.join('\n');
  assert.notEqual(css, '');
  assert.deepEqual([...css.matchAll(/\.(text|line|header|body|status|number)\s*(?=[,{:[])/gu)].map((match) => match[0]), []);
});
