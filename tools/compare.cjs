// Render the same frames from two URLs and compare canvas pixels.
const { chromium } = require('playwright');
const crypto = require('crypto');
async function frames(url, modes, fmt) {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.route('**/npm/d3@7/dist/d3.min.js', r => r.fulfill({ path: process.env.D3_PATH, contentType: 'application/javascript' }));
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof draw === 'function' && document.getElementById('msg') && !/Đang tải/.test(document.getElementById('msg').textContent), null, { timeout: 60000 });
  const out = {};
  for (const m of modes) {
    await p.evaluate(([m, fmt]) => { document.getElementById('sample').click(); document.getElementById('vmode').value = m; document.getElementById('fmt').value = fmt; document.getElementById('fmt').dispatchEvent(new Event('change')); document.getElementById('run').click(); }, [m, fmt]);
    await p.waitForTimeout(2500);
    for (const t of [0.5, 2, 5, 9, 14, 20, 26]) {
      const d = await p.evaluate(t => { draw(t); return document.getElementById('cv').toDataURL(); }, t);
      out[m + '@' + t] = crypto.createHash('md5').update(d).digest('hex').slice(0, 10);
    }
  }
  out.msg = await p.evaluate(() => document.getElementById('msg').textContent);
  out.errs = errs.join(' | ');
  await b.close(); return out;
}
(async () => {
  const [a, bUrl, fmt] = process.argv.slice(2);
  const modes = ['map', 'stack', 'split', 'ball'];
  const A = await frames(a, modes, fmt || 'port'), B = await frames(bUrl, modes, fmt || 'port');
  let diff = 0; for (const k of Object.keys(A)) { const same = A[k] === B[k]; if (!same) diff++; console.log(same ? '=' : 'X', k, A[k], B[k]); }
  console.log(diff ? 'DIFFERENT: ' + diff : 'IDENTICAL');
})();
