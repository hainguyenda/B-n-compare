// One-off: rebuild the app the way the old loader chain did at runtime
// (classic.html + loaderA patches E + index_prev patches P + p3.js patches), into one file.
import fs from 'node:fs'
const L = p => fs.readFileSync(new URL('../legacy/' + p, import.meta.url), 'utf8')
const arr = (src, start, end) => { const a = src.indexOf(start) + start.length, b = src.indexOf(end, a); return (0, eval)(src.slice(a, b)) }
const E = arr(L('loaderA.html'), 'const E=', ';\nlet s=')
const P = arr(L('index_prev.html'), 'const P=', ';\nwindow.__patch')
const P3 = (0, eval)(L('p3.js').replace('window.__P3=', '(') .replace(/;\s*$/, '') + ')')
let s = L('classic.html')
for (const [name, list] of [['E', E], ['P', P], ['P3', P3]])
  for (const [a, b] of list) { if (s.split(a).length !== 2) throw new Error(name + ' miss: ' + a.slice(0, 50)); s = s.replace(a, () => b) }
s = s.replace('<script src="/ball.js"></script>', '<script src="ball.js"></script>')
fs.mkdirSync(new URL('../src/', import.meta.url), { recursive: true })
fs.writeFileSync(new URL('../src/index.html', import.meta.url), s)
fs.copyFileSync(new URL('../legacy/ball.js', import.meta.url), new URL('../src/ball.js', import.meta.url))
console.log('ok', s.length)
