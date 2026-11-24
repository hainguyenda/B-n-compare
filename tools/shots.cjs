// Dev check: render a config in each mode and save frames as PNGs.
// usage: D3_PATH=... node tools/shots.cjs <url> <config.json> <outdir> <fmt> <modes> <times>
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [url, cfgPath, outDir, fmt, modes, times] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  if (process.env.D3_PATH) await p.route('**/npm/d3@7/dist/d3.min.js', r => r.fulfill({ path: process.env.D3_PATH, contentType: 'application/javascript' }));
  await p.goto(url); await p.waitForFunction(() => typeof draw === 'function' && !/Đang tải/.test(document.getElementById('msg').textContent), null, { timeout: 60000 });
  const cfg = fs.readFileSync(cfgPath, 'utf8');
  for (const m of modes.split(',')) {
    const info = await p.evaluate(([cfg, m, fmt]) => { const $ = id => document.getElementById(id); $('code').value = cfg; $('vmode').value = m; $('fmt').value = fmt; $('fmt').dispatchEvent(new Event('change')); $('run').click();
      return { msg: $('msg').textContent, total: S && S.total, last: S && (S.intro + S.st[S.items.length - 1]), pause: S && S.pause[S.items.length - 1], itemsEnd: S && (S.intro + S.itemsT) }; }, [cfg, m, fmt]);
    console.log(m, JSON.stringify(info));
    await p.waitForTimeout(1500);
    const ts = times.split(',').map(x => x.replace('L', String(info.last)).replace('E', String(info.itemsEnd))).map(x => eval(x));
    for (const t of ts) {
      const d = await p.evaluate(t => { draw(t); return document.getElementById('cv').toDataURL('image/png'); }, t);
      fs.writeFileSync(`${outDir}/${fmt}-${m}-${t.toFixed(2)}.png`, Buffer.from(d.split(',')[1], 'base64'));
    }
  }
  console.log('errors:', errs.join(' | ') || 'none'); await b.close();
})();
