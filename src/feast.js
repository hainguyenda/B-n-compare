// "feast" mode: each countryball opens its mouth, a crowd of tiny figures (tourists, people…) runs in and the ball
// grows until its number is reached. At the end the biggest one burps, then gets shades, a crown and hugs a trophy.
// Timeline, layout, hook, quiz and labels follow "ball" mode. Shared globals: ctx, W, H, S, PORT, flags, CountryballEngine,
// ballLayout, ballText, ballTheme, drawBallHook, ciAt, seg, eout, clamp, fit, full, short, lerp2, easeIO.
"use strict";
const FEAST = (() => {
  const SKIN = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#f5cba7"], SHIRT = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#14b8a6", "#ec4899", "#f8fafc"],
    CASE = ["#1f2937", "#7c3aed", "#dc2626", "#0ea5e9", "#facc15", "#16a34a"];
  const hh = (a, b = 0) => { let z = (a * 374761393 + b * 668265263) | 0; z = Math.imul(z ^ (z >>> 13), 1274126177); z ^= z >>> 16; return (z >>> 0) / 4294967296; };
  const BURP = 1.25, SHADES = 2.0, CROWN = 2.45, TROPHY = 2.8; // seconds into the outro (after the camera move)
  // the ball's own wobble, so the mouth / shades sit on the face
  function face(x, groundY, r, t, dp = 1) { const tf = CountryballEngine.getBounceTransform(dp, t, false); return { x: x + tf.offsetX, gy: groundY + tf.offsetY, sx: tf.scaleX, sy: tf.scaleY, r }; }
  function inFace(F, fn) { ctx.save(); ctx.translate(F.x, F.gy); ctx.scale(F.sx, F.sy); ctx.translate(0, -F.r); fn(F.r); ctx.restore(); } // origin = ball centre
  function mouth(F, open, look) { // open 0..1; a dark mouth with a tongue, slightly toward the look side
    if (open <= .02) return; inFace(F, r => { const mx = look * r * .12, my = r * .4, a = r * .27 * (.55 + .45 * open), b = r * .24 * open;
      ctx.beginPath(); ctx.ellipse(mx, my, a, b, 0, 0, 7); ctx.fillStyle = "#3b0a0a"; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.ellipse(mx, my + b * .75, a * .7, b * .55, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.lineWidth = Math.max(2.5, r * .045); ctx.strokeStyle = "#111"; ctx.beginPath(); ctx.ellipse(mx, my, a, b, 0, 0, 7); ctx.stroke(); }); }
  function smile(F, look) { inFace(F, r => { ctx.lineWidth = Math.max(2.5, r * .04); ctx.strokeStyle = "#111"; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(look * r * .1, r * .3, r * .16, .25 * Math.PI, .75 * Math.PI); ctx.stroke(); }); }
  function shades(F, a, dy) { if (a <= 0) return; inFace(F, r => { ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, -r * .08 + dy);
    const lw = r * .42, lh = r * .26, gx = r * .29; ctx.fillStyle = "#050505";
    ctx.beginPath(); ctx.roundRect(-gx - lw / 2 - r * .06, -lh * .62, (gx + lw / 2 + r * .06) * 2, lh * .28, r * .03); ctx.fill();
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * gx - lw / 2, -lh * .5); ctx.lineTo(s * gx + lw / 2, -lh * .5); ctx.lineTo(s * gx + lw * .4, lh * .45); ctx.quadraticCurveTo(s * gx, lh * .62, s * gx - lw * .4, lh * .45); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.moveTo(s * gx - lw * .3, -lh * .5); ctx.lineTo(s * gx - lw * .12, -lh * .5); ctx.lineTo(s * gx - lw * .34, lh * .5); ctx.lineTo(s * gx - lw * .52, lh * .5); ctx.closePath(); ctx.fill(); ctx.restore(); });
    ctx.restore(); }); }
  function crown(F, k, t) { if (k <= 0) return; inFace(F, r => { // gold crown with gems and a glint, tilted, sitting on top
    ctx.save(); ctx.translate(r * .18, -r * .92); ctx.rotate(.2); ctx.scale(k, k); const s = r * .5;
    const g = ctx.createLinearGradient(0, -s * .9, 0, s * .1); g.addColorStop(0, "#fff3b0"); g.addColorStop(.45, "#fbbf24"); g.addColorStop(1, "#b45309");
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * 1.05, -s * .62); ctx.lineTo(-s * .55, -s * .28); ctx.lineTo(0, -s * .9); ctx.lineTo(s * .55, -s * .28); ctx.lineTo(s * 1.05, -s * .62); ctx.lineTo(s, 0); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(2.5, s * .07); ctx.strokeStyle = "#3b2a00"; ctx.lineJoin = "round"; ctx.stroke();
    ctx.fillStyle = "#b45309"; ctx.fillRect(-s, -s * .14, s * 2, s * .14); ctx.strokeRect(-s, -s * .14, s * 2, s * .14);
    [[-1.05, -.62], [0, -.9], [1.05, -.62]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a * s, b * s, s * .09, 0, 7); ctx.fillStyle = "#fde68a"; ctx.fill(); ctx.stroke(); });
    [[-s * .55, "#ef4444"], [0, "#3b82f6"], [s * .55, "#22c55e"]].forEach(([a, c]) => { ctx.beginPath(); ctx.ellipse(a, -s * .3, s * .1, s * .13, 0, 0, 7); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = s * .04; ctx.stroke(); });
    const sx = ((t * .6) % 1.4 - .2) * s * 2.4 - s * 1.2; ctx.save(); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * 1.05, -s * .62); ctx.lineTo(-s * .55, -s * .28); ctx.lineTo(0, -s * .9); ctx.lineTo(s * .55, -s * .28); ctx.lineTo(s * 1.05, -s * .62); ctx.lineTo(s, 0); ctx.closePath(); ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.beginPath(); ctx.moveTo(sx, -s); ctx.lineTo(sx + s * .18, -s); ctx.lineTo(sx - s * .12, s * .1); ctx.lineTo(sx - s * .3, s * .1); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.restore(); }); }
  function trophy(F, k, t) { if (k <= 0) return; inFace(F, r => { // hugged in front of the ball, tilted -12°
    const s = r * .78 * k; ctx.save(); ctx.translate(r * .1, r * .98); ctx.rotate(-12 * Math.PI / 180); ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = s * .3; ctx.shadowOffsetY = s * .04;
    const gold = ctx.createLinearGradient(-s * .4, 0, s * .4, 0); gold.addColorStop(0, "#b7791f"); gold.addColorStop(.35, "#fde68a"); gold.addColorStop(.6, "#f59e0b"); gold.addColorStop(1, "#92400e");
    [-1, 1].forEach(q => { ctx.beginPath(); ctx.ellipse(q * s * .4, -s * .76, s * .14, s * .16, 0, 0, 7); ctx.lineWidth = s * .055; ctx.strokeStyle = "#b7791f"; ctx.stroke(); });
    const path = () => { ctx.beginPath(); ctx.roundRect(-s * .3, -s * .14, s * .6, s * .14, s * .03); ctx.rect(-s * .08, -s * .36, s * .16, s * .22);
      ctx.moveTo(-s * .38, -s * .95); ctx.lineTo(s * .38, -s * .95); ctx.bezierCurveTo(s * .38, -s * .55, s * .2, -s * .38, 0, -s * .38); ctx.bezierCurveTo(-s * .2, -s * .38, -s * .38, -s * .55, -s * .38, -s * .95); ctx.closePath(); };
    path(); ctx.fillStyle = gold; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = Math.max(2.5, s * .03); ctx.strokeStyle = "#3b2a00"; ctx.stroke();
    ctx.save(); path(); ctx.clip(); const sx = ((t * .7) % 1) * s * 2.2 - s * 1.1; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.moveTo(sx, -s); ctx.lineTo(sx + s * .14, -s); ctx.lineTo(sx - s * .2, 0); ctx.lineTo(sx - s * .34, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = "#7c2d12"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; fit("1", s * .3, 900, s); ctx.fillText("1", 0, -s * .68);
    for (let i = 0; i < 4; i++) { const q = (t * .9 + i * .27) % 1, a = Math.sin(q * Math.PI), px = (hh(i, 7) - .5) * s * 1.2, py = -s * (.3 + hh(i, 9) * .8), ss = s * .09 * a;
      ctx.save(); ctx.fillStyle = "#fff8d0"; ctx.shadowColor = "#FFD23F"; ctx.shadowBlur = ss * 2; ctx.beginPath(); for (let j = 0; j < 8; j++) { const ang = j * Math.PI / 4, rr = j % 2 ? ss * .28 : ss; ctx.lineTo(px + Math.cos(ang) * rr, py + Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.restore(); }); }
  function person(x, y, h, seed, t, a) { // tiny cartoon figure with a suitcase, running left; feet at y
    if (a <= 0) return; const sk = SKIN[Math.floor(hh(seed, 1) * SKIN.length)], sh = SHIRT[Math.floor(hh(seed, 2) * SHIRT.length)], cs = CASE[Math.floor(hh(seed, 3) * CASE.length)], ph = t * 16 + seed, lw = Math.max(1.5, h * .06);
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y - Math.abs(Math.sin(ph)) * h * .06); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111";
    ctx.lineWidth = lw * 1.4; [0, Math.PI].forEach(o => { const s = Math.sin(ph + o); ctx.beginPath(); ctx.moveTo(0, -h * .38); ctx.lineTo(s * h * .16, 0); ctx.stroke(); }); // legs
    ctx.fillStyle = cs; ctx.lineWidth = lw; ctx.beginPath(); ctx.roundRect(h * .14, -h * .36, h * .26, h * .3, h * .04); ctx.fill(); ctx.stroke(); // suitcase behind (they run left)
    ctx.beginPath(); ctx.moveTo(h * .27, -h * .36); ctx.lineTo(h * .2, -h * .5); ctx.stroke();
    ctx.fillStyle = sh; ctx.beginPath(); ctx.roundRect(-h * .14, -h * .72, h * .28, h * .38, h * .1); ctx.fill(); ctx.stroke(); // body
    ctx.fillStyle = sk; ctx.beginPath(); ctx.arc(-h * .02, -h * .86, h * .15, 0, 7); ctx.fill(); ctx.stroke(); // head
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-h * .08, -h * .88, h * .025, 0, 7); ctx.fill();
    if (hh(seed, 4) > .6) { ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(-h * .02, -h * .97, h * .2, h * .05, 0, 0, 7); ctx.fill(); ctx.stroke(); } // sun hat
    ctx.restore(); }
  // the crowd running in from the right and leaping into the mouth; stops once the number is reached
  function crowd(F, t, tau, G, ph, rate) {
    const r = F.r, h = clamp(r * .5, PORT ? 40 : 34, PORT ? 74 : 62), mx = F.x + r * .12, my = F.gy - r + r * .4 * F.sy, start = F.x + (PORT ? W * .75 : W * .55), N = Math.ceil(G * rate);
    for (let j = 0; j < N; j++) { const t0 = j / rate, life = .75, q = (tau - t0) / life; if (q < 0 || q > 1) continue;
      const lane = hh(j, 5), jx = start + lane * h * 2.2, jy = F.gy + (lane - .5) * h * .5 + h * .1, run = Math.min(1, q / .78), x = lerp2(jx, mx + r * .3, run), y = jy;
      if (q < .78) person(x, y, h, j, t, Math.min(1, q * 8));
      else { const k = (q - .78) / .22, lx = lerp2(mx + r * .3, mx, k), ly = lerp2(y, my, k) - Math.sin(k * Math.PI) * r * .35, s = 1 - k * .7; // leap and shrink into the mouth
        ctx.save(); ctx.translate(lx, ly); ctx.scale(s, s); ctx.rotate(-k * 1.2); person(0, 0, h, j, t, 1 - k * .3); ctx.restore(); }
    } }
  function burpBubble(F, k, t) { if (k <= 0 || k >= 1) return; const a = Math.min(1, k * 6, (1 - k) * 4), r = F.r, x = F.x - r * .55, y = F.gy - r * 2.45, sc = .8 + .3 * eout(Math.min(1, k * 5));
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(sc, sc); const s = PORT ? 1 : .85;
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.ellipse(0, 0, 190 * s, 92 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60 * s, 62 * s); ctx.lineTo(150 * s, 150 * s); ctx.lineTo(10 * s, 84 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 52 * s, 80 * s, 30 * s);
    ballText("BURP!", 0, 4, 96 * s, "#FFD23F", 340 * s);
    for (let i = 0; i < 5; i++) { const q = Math.min(1, k * 1.6), px = r * .55 + Math.cos(i * 1.3) * r * .3 * q, py = r * 1.85 - q * r * (.4 + i * .12); // puff clouds from the mouth
      ctx.fillStyle = "rgba(230,240,200," + (.6 * (1 - q)) + ")"; ctx.beginPath(); ctx.arc(px, py, r * (.08 + .1 * q), 0, 7); ctx.fill(); }
    ctx.restore(); }

  function draw(t) {
    const CE = CountryballEngine, { cfg, items, intro } = S, n = items.length, Ly = ballLayout(), PRT = PORT;
    const ci = ciAt(t), inOut = ci >= n, live = ci >= 0 && !inOut, cc = Math.min(Math.max(ci, 0), n - 1);
    const tau0 = live ? t - intro - S.st[ci] : 0, ps = live ? S.pause[ci] : 0, tau = Math.max(0, tau0 - ps), inPause = live && tau0 < ps;
    const pc = live ? S.dur[ci] - ps : S.per, to = inOut ? t - (intro + S.itemsT) : 0, TL = 1;
    const groundY = H * (PRT ? .70 : .74), anchorX = W * (PRT ? .5 : .55);
    const curX = Ly.pos[cc].x, prevX = cc > 0 ? Ly.pos[cc - 1].x : curX - (PRT ? 420 : 520), camT = Math.min(.45 * pc, 1.0);
    let camX = ci < 0 ? prevX : lerp2(prevX, curX, easeIO(tau0 / camT)), z = 1, ax = anchorX;
    const top = items.slice(-Math.min(3, n)), k1 = n - 1;
    if (inOut) { const T = eout(seg(to, 0, TL)), x0 = Ly.pos[n - top.length].x - Ly.pos[n - top.length].r, x1 = Ly.pos[k1].x + Ly.pos[k1].r, zf = Math.min(1, W * .9 / (x1 - x0)); camX = lerp2(curX, (x0 + x1) / 2, T); z = lerp2(1, zf, T); ax = lerp2(anchorX, W / 2, T);
      const T2 = eout(seg(to - TL - (S.spotT || 0), BURP - .6, BURP - .1)), p1 = Ly.pos[k1], z1 = Math.min(1.15, W * (PRT ? .62 : .4) / (2 * p1.r)); // then close in on #1 for the burp
      camX = lerp2(camX, p1.x, T2); z = lerp2(z, z1, T2); }
    ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    const fixed = ballTheme(), t3k = items.findIndex(x => x.rank <= 3), t3 = t3k < 0 ? 1e9 : intro + S.st[t3k];
    const hookSun = cfg.hook !== false ? 1 - seg(t, intro - .05, intro + .45) : 0, aSun = fixed === "sunset_drama" ? 1 : Math.max(hookSun, eout(seg(t, t3, t3 + .6)));
    CE.drawCartoonBackdrop(ctx, W, H, fixed === "studio_dark" ? "studio_dark" : "comic_sky", camX * z, groundY);
    if (fixed === "auto" && aSun > .001 || fixed === "sunset_drama") { ctx.save(); ctx.globalAlpha = aSun; CE.drawCartoonBackdrop(ctx, W, H, "sunset_drama", camX * z, groundY); ctx.restore(); }
    if (ci < 0) { if (cfg.hook !== false) drawBallHook(t, groundY); }
    else {
      const G = Math.max(pc * .72, pc - .6), eat = live && !inPause ? clamp(tau / G) : 1, grow = inOut ? 1 : eout(eat);
      const rev1 = live && items[cc].rank === 1 && !inPause;
      if (rev1 || inOut) { const ge = inOut ? 1 : eout(clamp(tau / .7)), p = Ly.pos[k1], gx = ax + (p.x - camX) * z, gy = groundY - p.r * z, gr = Math.max(W, H) * .7, gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        gg.addColorStop(0, "rgba(255,200,40," + (.34 * ge) + ")"); gg.addColorStop(.5, "rgba(255,170,30," + (.1 * ge) + ")"); gg.addColorStop(1, "rgba(255,170,30,0)"); ctx.save(); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      const hasOne = items.slice(0, cc + 1).some(x => x.rank === 1) && !(live && inPause && items[cc].rank === 1);
      const bt = to - TL - (S.spotT || 0), burpK = inOut ? (bt - BURP) / .9 : -1, sq = burpK > 0 && burpK < .5 ? Math.sin(burpK / .5 * Math.PI) : 0;
      ctx.save(); ctx.translate(ax, groundY); ctx.scale(z, z); ctx.translate(-camX, -groundY);
      for (let i = 0; i <= cc; i++) {
        const it = items[i], p = Ly.pos[i], sx = ax + (p.x - camX) * z; if (sx + p.r * z < -60 || sx - p.r * z > W + 60) continue;
        const cur = live && i === cc, mys = cur && inPause, f = flags[it.code], labelY = groundY + (PRT ? 56 : 46);
        const r = cur && !mys ? p.r * (.28 + .72 * grow) : p.r, look = cur && !mys && eat < 1 ? 1 : it.rank === 2 && hasOne ? 1 : 0;
        const shocked = it.rank === 2 && hasOne, emo = mys ? "happy" : cur && eat < 1 ? "happy" : shocked ? "shocked" : CE.getDefaultEmotion(it.rank), tt = t + i * .37;
        const isTop = inOut && i === k1;
        if (cur && !mys && eat < 1) crowd(face(p.x, groundY, r, tt), t, tau, G, 0, Math.min(14, 6 + 30 / Math.max(1, it.rank)));
        ctx.save(); if (isTop && sq) { ctx.translate(p.x, groundY); ctx.scale(1 + .12 * sq, 1 - .1 * sq); ctx.translate(-p.x, -groundY); }
        CE.drawCountryball(ctx, { x: p.x, groundY, radius: r, flagImg: f && f.ok ? f.im : null, fallbackColor: (it.m && it.m.col) || "#475569", emotion: emo, isMystery: mys, hasCrown: false, dropProgress: mys ? clamp(tau0 / .5) : 1, time: tt, lookDir: look });
        const F = face(p.x, groundY, r, tt);
        if (cur && !mys && eat < 1) mouth(F, .55 + .45 * Math.abs(Math.sin(tau * 9)), 1);
        else if (cur && !mys && tau < G + .5) mouth(F, Math.max(0, .5 - (tau - G) * 1.2) * Math.abs(Math.sin(tau * 14)), 0); // chew, chew
        else if (isTop && burpK > 0 && burpK < .6) mouth(F, Math.sin(Math.min(1, burpK / .6) * Math.PI), 0);
        else if (!mys) smile(F, look);
        if (isTop) { const sk = clamp((bt - SHADES) / .3); shades(F, sk > 0 ? 1 : 0, -(1 - eout(sk)) * H * .5 / z); crown(F, eout(clamp((bt - CROWN) / .35)) * (1 + .08 * Math.sin(bt * 6)), t); trophy(F, eout(clamp((bt - TROPHY) / .35)), t); }
        else if (it.rank === 1 && !mys) crown(F, 1, t);
        ctx.restore();
        if (isTop) burpBubble(F, burpK, t);
        if (mys) continue;
        if (cur) { const a = eout(seg(tau, .2, .5)); if (a > 0) { const ls = PRT ? 52 : 46, mw = Math.max(p.r * 2.4, PRT ? 360 : 420);
            ctx.save(); ctx.globalAlpha = a; ballText("#" + it.rank + " " + it.name, p.x, labelY, ls, it.rank === 1 ? "#FFE033" : "#fff", mw); ballText(full(it.value * grow), p.x, labelY + ls * 1.12, ls * .9, "#FFD43B", mw); ctx.restore(); } }
        else if (inOut) { const tp = it.rank <= 3, a = eout(seg(to, .3, .9)), s2 = 1 / z;
          if (tp) { ctx.save(); ctx.globalAlpha = a; ballText("#" + it.rank + " " + it.name, p.x, labelY, (PRT ? 34 : 30) * s2, it.rank === 1 ? "#FFE033" : "#fff", p.r * 2.6); ballText(short(it.value), p.x, labelY + 36 * s2, 28 * s2, "#FFD43B", p.r * 2.6); ctx.restore(); } }
        else ballText("#" + it.rank, p.x, labelY, PRT ? 34 : 30, "#fff", p.r * 2);
      }
      ctx.restore();
      if (rev1 && tau < .3) { ctx.save(); ctx.globalAlpha = .6 * (1 - tau / .3); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      ctx.save(); ctx.lineJoin = "round"; ctx.lineWidth = 7; ctx.strokeStyle = "#111"; ctx.fillStyle = "#fff"; ctx.textAlign = "left";
      const ttl = String(cfg.title || "").toUpperCase(); fit(ttl, 30, 900, W - 90); ctx.strokeText(ttl, PRT ? 34 : 46, 44); ctx.fillText(ttl, PRT ? 34 : 46, 44); ctx.restore();
    }
    if (cfg.source) { ctx.save(); ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.lineJoin = "round"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.55)"; fit(cfg.source, PRT ? 17 : 15, 600, W - 60); ctx.textAlign = "left"; ctx.strokeText(cfg.source, 28, H - 20); ctx.fillText(cfg.source, 28, H - 20); ctx.restore(); }
    if (inOut && to > TL + (S.spotT || 0) + TROPHY + .5) { // the closing question, once the trophy is in
      const q = String(cfg.question || "Is your country in the top " + n + "? Tell us below"), a = eout(seg(to, TL + (S.spotT || 0) + TROPHY + .5, TL + (S.spotT || 0) + TROPHY + .8)), qy = PRT ? H * .9 : H * .92;
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle"; fit(q, PRT ? 48 : 42, 900, W - 140); const tw = ctx.measureText(q).width, ph = PRT ? 88 : 76;
      ctx.fillStyle = "rgba(8,12,24,.88)"; ctx.strokeStyle = "#FFD23F"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2 - 34, qy - ph / 2, tw + 68, ph, ph / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.fillText(q, W / 2, qy + 2); ctx.restore(); }
    ctx.restore();
  }

  // sounds: chomping and footsteps while eating, a big burp, a glint for the shades, a chime for crown and trophy
  function sfx(oc, out) {
    const sr = oc.sampleRate, noise = oc.createBuffer(1, sr, sr), d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = hh(i, 13) * 2 - 1;
    const nz = (t0, dur, type, f, g) => { const s = oc.createBufferSource(), fl = oc.createBiquadFilter(), e = oc.createGain(); s.buffer = noise; s.loop = true; fl.type = type; fl.frequency.value = f;
      e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + .006); e.gain.exponentialRampToValueAtTime(.0001, t0 + dur); s.connect(fl).connect(e).connect(out); s.start(t0); s.stop(t0 + dur + .02); };
    S.items.forEach((x, i) => { const tr = S.intro + S.st[i] + S.pause[i], pc = S.dur[i] - S.pause[i], G = Math.max(pc * .72, pc - .6);
      for (let k = tr + .3; k < tr + G; k += .17) nz(k, .07, "lowpass", 700, .09); // chomp
      for (let k = tr; k < tr + G; k += .09) nz(k + hh(Math.round(k * 100), 2) * .03, .025, "highpass", 3000, .025); // patter of feet
      [0, .16].forEach(o => nz(tr + G + .05 + o, .08, "lowpass", 600, .12)); });
    const tb = S.intro + S.itemsT + 1 + (S.spotT || 0) + BURP; // the burp: a wobbly low saw through a vowel-ish band, plus breath
    const o = oc.createOscillator(), f1 = oc.createBiquadFilter(), e = oc.createGain(), lfo = oc.createOscillator(), lg = oc.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(105, tb); o.frequency.exponentialRampToValueAtTime(62, tb + .7);
    lfo.frequency.value = 28; lg.gain.value = 14; lfo.connect(lg).connect(o.frequency); f1.type = "bandpass"; f1.frequency.value = 520; f1.Q.value = 1.4;
    e.gain.setValueAtTime(.0001, tb); e.gain.exponentialRampToValueAtTime(.5, tb + .04); e.gain.setValueAtTime(.45, tb + .45); e.gain.exponentialRampToValueAtTime(.0001, tb + .8);
    o.connect(f1).connect(e).connect(out); o.start(tb); o.stop(tb + .85); lfo.start(tb); lfo.stop(tb + .85); nz(tb, .5, "bandpass", 900, .08);
    const ting = (t0, fs, g) => fs.forEach((f, j) => { const s = oc.createOscillator(), eg = oc.createGain(); s.frequency.value = f; eg.gain.setValueAtTime(.0001, t0 + j * .04); eg.gain.exponentialRampToValueAtTime(g, t0 + j * .04 + .005); eg.gain.exponentialRampToValueAtTime(.0001, t0 + j * .04 + .6); s.connect(eg).connect(out); s.start(t0 + j * .04); s.stop(t0 + .8); });
    const t1 = S.intro + S.itemsT + 1 + (S.spotT || 0); ting(t1 + SHADES + .3, [2093, 2637, 3136], .07); ting(t1 + CROWN + .2, [1047, 1319, 1568], .08); ting(t1 + TROPHY + .2, [1568, 1976, 2349, 3136], .07);
  }
  return { draw, sfx };
})();
