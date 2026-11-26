// Countryball Showdown (Tab 2): a JSON-driven countryball video made of scenes (lineup, stat_battle, champion),
// synced to a bass beat. Uses the app's shared globals: ctx, W, H, S, flags, loadFlag, font, clamp, seg, eout, back.
"use strict";
const SD = (() => {
  const SAMPLE = {
    fps: 30, bpm: 128, beatIntensity: 0.8, watermark: "",
    scenes: [
      { type: "lineup", duration: 3.5, title: "ASEAN SHOWDOWN", badge: "ASEAN", align: "right", eyeDropAt: 1.4,
        members: [{ code: "VN", eyeStart: "normal", eyeEnd: "serious" }, { code: "ID", eyeStart: "normal", eyeEnd: "serious" }, { code: "MY", eyeStart: "normal", eyeEnd: "serious" }, { code: "TH", eyeStart: "normal", eyeEnd: "serious" }, { code: "SG", eyeStart: "normal", eyeEnd: "serious" }] },
      { type: "stat_battle", duration: 3.0, category: "COFFEE EXPORTS", unit: "M tons", winner: "VN",
        items: [{ code: "VN", value: 1.65, label: "Vietnam" }, { code: "ID", value: 0.65, label: "Indonesia" }, { code: "LA", value: 0.03, label: "Laos" }, { code: "TH", value: 0.02, label: "Thailand" }] },
      { type: "stat_battle", duration: 3.0, category: "GDP GROWTH RATE", unit: "%", winner: "VN",
        items: [{ code: "VN", value: 7.1, label: "Vietnam" }, { code: "PH", value: 5.8, label: "Philippines" }, { code: "ID", value: 5.1, label: "Indonesia" }, { code: "MY", value: 4.9, label: "Malaysia" }] },
      { type: "champion", duration: 4.0, code: "VN", headline: "TOP 1 ASEAN", subtext: "VIETNAM DOMINATES", props: { sunglasses: true, cigar: true, trophy: true, crown: false } }
    ]
  };
  const NAMES = { VN: "Vietnam", ID: "Indonesia", MY: "Malaysia", TH: "Thailand", SG: "Singapore", PH: "Philippines", LA: "Laos", KH: "Cambodia", MM: "Myanmar", BN: "Brunei", TL: "Timor-Leste", CN: "China", JP: "Japan", KR: "South Korea", IN: "India", US: "United States" };
  const FCOL = { VN: "#DA251D", ID: "#E70011", MY: "#010066", TH: "#2D2A4A", SG: "#EF3340", PH: "#0038A8", LA: "#CE1126", KH: "#032EA1", MM: "#FECB00", BN: "#F7E017", TL: "#DC241F" };
  const EYES = { // lid = share of the eye cut off by a flat top; tilt = inner corners down (radians); w,h in ball radii
    normal: { lid: 0, tilt: 0, w: .30, h: .36, shake: 0, glass: 0 },
    serious: { lid: .5, tilt: .1, w: .44, h: .40, shake: 0, glass: 0 },
    angry: { lid: .56, tilt: .36, w: .44, h: .40, shake: 0, glass: 0 },
    shocked: { lid: 0, tilt: 0, w: .19, h: .22, shake: 1, glass: 0 },
    cool: { lid: .5, tilt: .1, w: .44, h: .40, shake: 0, glass: 1 }
  };
  const EYE_T = .12; // 120 ms between eye states
  const h01 = (a, b = 0) => { let z = (a * 374761393 + b * 668265263) | 0; z = Math.imul(z ^ (z >>> 13), 1274126177); z ^= z >>> 16; return (z >>> 0) / 4294967296; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const eyeMix = (a, b, k) => { const A = EYES[a] || EYES.normal, B = EYES[b] || EYES.normal, o = {}; for (const key in A) o[key] = lerp(A[key], B[key], k); return o; };
  const eyeAt = (from, to, at, u) => at == null || u < at ? eyeMix(from, from, 0) : eyeMix(from, to, eout(clamp((u - at) / EYE_T)));
  const nm = (it) => it.label || it.name || NAMES[it.code] || it.code;

  // ---------- build ----------
  function build(cfg) {
    if (!cfg || !Array.isArray(cfg.scenes) || !cfg.scenes.length) throw new Error('Code Tab 2 cần có "scenes": [ … ] (lineup, stat_battle, champion).');
    const scenes = []; let t0 = 0; const bad = [];
    cfg.scenes.forEach((s, i) => {
      const type = String(s.type || "").toLowerCase();
      if (!["lineup", "stat_battle", "champion"].includes(type)) throw new Error('Cảnh ' + (i + 1) + ': type phải là "lineup", "stat_battle" hoặc "champion".');
      const d = Math.max(.8, +s.duration || (type === "champion" ? 4 : 3));
      const codes = type === "lineup" ? (s.members || []).map(m => m.code) : type === "stat_battle" ? (s.items || []).map(m => m.code) : [s.code];
      codes.forEach(c => { c = String(c || "").toUpperCase(); if (!/^[A-Z]{2}$/.test(c)) bad.push(c || "?"); else loadFlag(c); });
      const sc = Object.assign({}, s, { type, t0, d, i });
      if (type === "lineup") sc.members = (s.members || []).map(m => Object.assign({}, m, { code: String(m.code).toUpperCase() }));
      if (type === "stat_battle") { sc.items = (s.items || []).map(m => Object.assign({}, m, { code: String(m.code).toUpperCase(), value: +m.value || 0 })).sort((a, b) => b.value - a.value).slice(0, 5);
        sc.max = Math.max(1e-9, ...sc.items.map(x => x.value)); sc.win = String(s.winner || (sc.items[0] || {}).code || "").toUpperCase();
        sc.dec = Math.min(2, Math.max(0, ...sc.items.map(x => (String(x.value).split(".")[1] || "").length))); }
      if (type === "champion") sc.code = String(s.code || "VN").toUpperCase();
      scenes.push(sc); t0 += d;
    });
    const total = t0, bpm = clamp(+cfg.bpm || 130, 60, 200), I = clamp(cfg.beatIntensity ?? .8, 0, 1.5), hard = String(cfg.beatStyle || "soft").toLowerCase() === "hard";
    const title = (cfg.scenes.find(s => s.title) || {}).title || (cfg.scenes.find(s => s.headline) || {}).headline || "countryball-showdown";
    return { showdown: true, cfg: Object.assign({ title }, cfg), scenes, total, bpm, I, hard, beats: grid(total, bpm, +cfg.beatOffset || 0), items: [], bad,
      st: [], dur: [], pause: [], intro: 0, itemsT: total, out: 0, end: 0, e0: total, spotT: 0 };
  }
  const grid = (D, bpm, off) => { const b = [], p = 60 / bpm; for (let x = off; x < D + p; x += p) if (x >= 0) b.push(x); return b; };
  // Bass onsets in a music file: low-passed energy per 512-sample hop, peaks well above the local average, at least 0.22 s apart.
  function detectBeats(buf, D) {
    const sr = buf.sampleRate, ch = buf.getChannelData(0), hop = 512, n = Math.floor(Math.min(buf.length, (D + 1) * sr) / hop), E = new Float32Array(n);
    let lp = 0; const a = 1 - Math.exp(-2 * Math.PI * 150 / sr);
    for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < hop; j++) { lp += a * (ch[i * hop + j] - lp); s += lp * lp; } E[i] = s; }
    const out = [], win = Math.round(sr / hop * .6), gap = .22; let last = -9;
    for (let i = 1; i < n - 1; i++) { let m = 0, c = 0; for (let j = Math.max(0, i - win); j < Math.min(n, i + win); j++) { m += E[j]; c++; } m /= c;
      const tt = i * hop / sr; if (E[i] > m * 1.5 && E[i] >= E[i - 1] && E[i] >= E[i + 1] && tt - last > gap) { out.push(tt); last = tt; } }
    if (out.length < 4) return null;
    const L = buf.duration, all = []; for (let k = 0; k * L < D + 1; k++) out.forEach(x => all.push(x + k * L)); // the track loops
    return all.filter(x => x < D + 1);
  }
  function beatsFor(S0, fileBuf) { const auto = !document.getElementById("sbeat") || document.getElementById("sbeat").checked, fb = auto && fileBuf && S0.cfg.beatSync !== false && detectBeats(fileBuf, S0.total);
    S0.fileBeats = !!fb; return fb || grid(S0.total, S0.bpm, +S0.cfg.beatOffset || 0); }
  function beatEnv(t) { // time since the last beat → punch envelope; hits = scene cuts and the champion drop count double
    const B = S.beats; let lo = 0, hi = B.length - 1, k = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (B[m] <= t) { k = m; lo = m + 1; } else hi = m - 1; }
    if (!S.hard && k >= 0 && !S.fileBeats && k % 2) k--; // soft: half-time pulse
    const db = k >= 0 ? t - B[k] : 9; let hit = 9; S.scenes.forEach(s => { if (t >= s.t0) hit = Math.min(hit, t - s.t0); if (s.type === "lineup" && s.eyeDropAt != null && t >= s.t0 + s.eyeDropAt) hit = Math.min(hit, t - s.t0 - s.eyeDropAt); });
    return S.hard ? { e: Math.exp(-db * 13), sq: Math.exp(-db * 9) * Math.cos(db * 24), hit: Math.exp(-hit * 7), db, k }
      : { e: Math.exp(-db * 5) * Math.min(1, db * 30), sq: .55 * Math.exp(-db * 4.5) * Math.sin(Math.min(Math.PI, db * 9) + .3), hit: Math.exp(-hit * 7), db, k };
  }

  // ---------- drawing helpers ----------
  function txt(s, x, y, size, col, o = {}) {
    font(size, o.w || 900); const mw = o.max || W - 80; if (ctx.measureText(s).width > mw) font(Math.floor(size * mw / ctx.measureText(s).width), o.w || 900);
    ctx.textAlign = o.align || "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    if (o.stroke !== false) { ctx.lineWidth = Math.max(4, size * .16); ctx.strokeStyle = o.stroke || "#000"; ctx.strokeText(s, x, y); }
    if (o.glow) { ctx.save(); ctx.shadowColor = o.glow; ctx.shadowBlur = size * .5; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore(); }
    ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.textBaseline = "alphabetic";
  }
  function blob(cx, cy, rx, ry) { // countryball body: a dome on top, a slightly flatter bottom
    ctx.beginPath(); ctx.moveTo(cx - rx, cy);
    ctx.bezierCurveTo(cx - rx, cy - ry * 1.36, cx + rx, cy - ry * 1.36, cx + rx, cy);
    ctx.bezierCurveTo(cx + rx, cy + ry * 1.26, cx - rx, cy + ry * 1.26, cx - rx, cy); ctx.closePath();
  }
  function shadow(x, y, rx, a = .55) { const g = ctx.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, "rgba(0,0,0," + a + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.translate(x, y); ctx.scale(1, .22); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, 7); ctx.fill(); ctx.restore(); }
  function eye(ex, ey, r, E, side, sc, t) {
    const w = E.w * r * sc, h = E.h * r * sc, a = w / 2, b = h / 2, yl = -b + E.lid * h, th0 = Math.asin(clamp(yl / b, -1, 1));
    const jx = E.shake ? Math.sin(t * 71 + side) * r * .018 * E.shake : 0, jy = E.shake ? Math.cos(t * 63) * r * .012 * E.shake : 0;
    ctx.save(); ctx.translate(ex + jx, ey + jy - E.lid * h * .5); ctx.rotate(E.tilt * side);
    ctx.beginPath(); if (E.lid < .01) ctx.ellipse(0, 0, a, b, 0, 0, 7); else { ctx.ellipse(0, 0, a, b, 0, th0, Math.PI - th0); ctx.closePath(); }
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = Math.max(2.5, r * .045); ctx.strokeStyle = "#0a0a0a"; ctx.lineJoin = "round"; ctx.stroke(); ctx.restore();
  }
  function glasses(cx, ey, r, look, a, dy = 0) { // thick black shades with a white diagonal glint
    if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx + look * r * .28, ey + dy);
    const lw = r * .5, lh = r * .27, gx = r * .42;
    ctx.fillStyle = "#050505"; ctx.strokeStyle = "#000"; ctx.lineWidth = r * .03;
    ctx.beginPath(); ctx.roundRect(-gx - lw / 2 - r * .08, -lh * .62, (gx + lw / 2 + r * .08) * 2, lh * .3, r * .03); ctx.fill(); // top bar
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * gx - lw / 2, -lh * .5); ctx.lineTo(s * gx + lw / 2, -lh * .5); ctx.lineTo(s * gx + lw * .4, lh * .45); ctx.quadraticCurveTo(s * gx, lh * .62, s * gx - lw * .4, lh * .45); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.moveTo(s * gx - lw * .3, -lh * .5); ctx.lineTo(s * gx - lw * .12, -lh * .5); ctx.lineTo(s * gx - lw * .34, lh * .5); ctx.lineTo(s * gx - lw * .52, lh * .5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.moveTo(s * gx - lw * .02, -lh * .5); ctx.lineTo(s * gx + lw * .06, -lh * .5); ctx.lineTo(s * gx - lw * .16, lh * .5); ctx.lineTo(s * gx - lw * .24, lh * .5); ctx.closePath(); ctx.fill(); ctx.restore(); });
    ctx.restore();
  }
  // a countryball standing on (x, y): o = { r, code, E (eye params), look, dark, sq, glow, alpha }
  function ball(x, y, o) {
    const r = o.r, sq = o.sq || 0, rx = r * 1.08 * (1 + sq * .1), ry = r * (1 - sq * .1), cy = y - ry * .96, look = o.look || 0, f = flags[o.code];
    shadow(x, y + r * .02, rx * 1.05, .6 * (o.alpha ?? 1));
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    if (o.glow) { ctx.save(); ctx.shadowColor = o.glow; ctx.shadowBlur = r * .45; blob(x, cy, rx, ry); ctx.fillStyle = o.glow; ctx.fill(); ctx.restore(); }
    blob(x, cy, rx, ry); ctx.save(); ctx.clip();
    if (f && f.ok) { const fh = ry * 2.25, fw = Math.max(rx * 2.3, fh / (f.ar || .66)), fx = x - fw / 2 + look * rx * .1; ctx.drawImage(f.im, fx, cy - fh * .5, fw, fh); } // flag centred on the face (keeps its proportions), nudged the way the ball looks
    else { ctx.fillStyle = FCOL[o.code] || "#64748b"; ctx.fillRect(x - rx, cy - ry * 1.4, rx * 2, ry * 2.8); }
    let g = ctx.createRadialGradient(x - look * rx * .35 - rx * .1, cy - ry * .45, rx * .05, x, cy, rx * 1.35); // 3D shading, darker to the bottom and back
    g.addColorStop(0, "rgba(255,255,255,.22)"); g.addColorStop(.42, "rgba(255,255,255,0)"); g.addColorStop(.8, "rgba(0,0,0,.28)"); g.addColorStop(1, "rgba(0,0,0,.62)"); ctx.fillStyle = g; ctx.fillRect(x - rx, cy - ry * 1.4, rx * 2, ry * 2.8);
    g = ctx.createLinearGradient(0, cy, 0, cy + ry); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(20,12,0,.38)"); ctx.fillStyle = g; ctx.fillRect(x - rx, cy, rx * 2, ry * 1.4);
    if (o.dark) { ctx.fillStyle = "rgba(0,0,0," + o.dark + ")"; ctx.fillRect(x - rx, cy - ry * 1.4, rx * 2, ry * 2.8); }
    ctx.restore();
    blob(x, cy, rx, ry); ctx.lineWidth = Math.max(3, r * .055); ctx.strokeStyle = "#080808"; ctx.lineJoin = "round"; ctx.stroke();
    const E = o.E || EYES.normal, ex = x + look * r * .28, ey = cy - ry * .04, gap = r * .40;
    [-1, 1].forEach(s => { const far = s === Math.sign(look) ? 1 - .14 * Math.abs(look) : 1; eye(ex + s * gap, ey, r, E, -s, far, o.t || 0); });
    glasses(x, ey, r, look, E.glass);
    ctx.restore();
    return { cx: x, cy, rx, ry, ex, ey };
  }
  function badge(x, y, R, label, a = 1) { // round badge: white and blue rings, red disc, label
    if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, R * .93, 0, 7); ctx.fillStyle = "#1e3a8a"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, R * .86, 0, 7); ctx.fillStyle = "#fff"; ctx.fill();
    const g = ctx.createRadialGradient(x - R * .25, y - R * .3, R * .1, x, y, R * .84); g.addColorStop(0, "#f87171"); g.addColorStop(1, "#dc2626");
    ctx.beginPath(); ctx.arc(x, y, R * .82, 0, 7); ctx.fillStyle = g; ctx.fill();
    txt(String(label || "").toUpperCase(), x, y + R * .04, R * .42, "#fde047", { stroke: "#1e3a8a", max: R * 1.4 }); ctx.restore();
  }
  function background(t, warm = 1) {
    ctx.fillStyle = "#050505"; ctx.fillRect(-40, -40, W + 80, H + 80);
    const g = ctx.createRadialGradient(W / 2, H * 1.02, 0, W / 2, H * 1.02, Math.max(W, H) * .78);
    g.addColorStop(0, "rgba(90,70,26," + .9 * warm + ")"); g.addColorStop(.35, "rgba(58,46,18," + .75 * warm + ")"); g.addColorStop(1, "rgba(58,46,18,0)");
    ctx.fillStyle = g; ctx.fillRect(-40, -40, W + 80, H + 80);
  }
  const PT = () => H > W; // portrait

  // ---------- scenes ----------
  function lineup(sc, u, B, t) {
    const n = sc.members.length, P = PT(), right = (sc.align || "right") !== "left", dir = right ? 1 : -1, look = -dir * .55;
    const R0 = P ? 280 : 230, x0 = right ? W * (P ? .8 : .7) : W * (P ? .2 : .3), xe = right ? W * (P ? .13 : .2) : W * (P ? .87 : .8), gy = H * (P ? .64 : .8);
    badge(W / 2, H * (P ? .13 : .14), P ? 118 : 96, sc.badge || "ASEAN", eout(clamp(u / .35)));
    if (sc.title) txt(String(sc.title).toUpperCase(), W / 2, H * (P ? .13 : .14) + (P ? 188 : 148), P ? 64 : 54, "#fff", { glow: "rgba(255,210,63,.35)" });
    for (let i = n - 1; i >= 0; i--) {
      const m = sc.members[i], s = Math.pow(.8, i), r = R0 * s, tx = n > 1 ? lerp(x0, xe, Math.pow(i / (n - 1), .85)) : x0, ty = gy - i * (P ? 40 : 26);
      const a0 = .12 + i * .1, k = i === 0 ? eout(clamp(u / .3)) : back(clamp((u - a0) / .42)), x = i === 0 ? x0 + dir * (1 - k) * W * .5 : lerp(x0, tx, k);
      const E = eyeAt(m.eyeStart || "normal", m.eyeEnd || "serious", sc.eyeDropAt ?? 1.4, u);
      const moving = i > 0 && u > a0 && u < a0 + .42; // short motion blur while sliding out
      if (moving) [.06, .03].forEach((dt, j) => { const k2 = back(clamp((u - dt - a0) / .42)); ctx.save(); ctx.globalAlpha = j ? .25 : .12; ball(lerp(x0, tx, k2), ty, { r, code: m.code, E, look, dark: i * .13, t }); ctx.restore(); });
      ball(x, ty, { r, code: m.code, E, look, dark: i * .13, sq: B.sq * S.I * (i ? .7 : 1), t });
    }
  }
  function statBattle(sc, u, B, t) {
    const P = PT(), n = sc.items.length, top = H * (P ? .27 : .24), bot = H * (P ? .86 : .9), rh = (bot - top) / Math.max(n, 2), r = Math.min(P ? 135 : 100, rh * .4);
    const reveal = Math.min(sc.d * .55, 1.45), done = u > reveal;
    txt(String(sc.category || "").toUpperCase(), W / 2, H * (P ? .12 : .1), P ? 78 : 64, "#FFD23F", { glow: "rgba(255,210,63,.5)" });
    if (sc.unit) txt(String(sc.unit), W / 2, H * (P ? .12 : .1) + (P ? 84 : 66), P ? 42 : 32, "#e5e7eb", { w: 800 });
    const bx = P ? 290 : W * .3, bw = W - bx - (P ? 70 : W * .18);
    sc.items.forEach((it, i) => {
      const y = top + rh * (i + .62), a = eout(clamp((u - .05 - i * .08) / .3)), win = it.code === sc.win, xo = (1 - a) * W * .6;
      const p = eout(clamp((u - .25 - i * .05) / (reveal - .25))), dim = done && !win ? .5 : 0;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(xo, 0);
      const E = done ? (win ? eyeMix("serious", "angry", eout(clamp((u - reveal) / EYE_T))) : eyeMix("serious", "shocked", eout(clamp((u - reveal) / EYE_T)))) : EYES.serious;
      ball(bx - r * 1.25, y + r * .9, { r, code: it.code, E, look: .5, dark: dim * .6, sq: B.sq * S.I * (win && done ? 1.8 : .6), glow: win && done ? "rgba(255,200,40,.95)" : null, t });
      const v = it.value * p, bwv = Math.max(8, bw * (it.value / sc.max) * p), bh = Math.max(34, r * .78), by = y + r * .3 - bh / 2;
      txt(nm(it), bx, y - r * .58, P ? 48 : 36, win && done ? "#FFD23F" : "#fff", { align: "left", w: 900, max: bw });
      const g = ctx.createLinearGradient(bx, 0, bx + bwv, 0); g.addColorStop(0, win ? "#f59e0b" : "#475569"); g.addColorStop(1, win ? "#fde047" : "#94a3b8");
      ctx.save(); if (win && done) { ctx.shadowColor = "#FFD23F"; ctx.shadowBlur = 30 + 20 * B.e; } ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(bx, by, bwv, bh, bh / 2); ctx.fill(); ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = "#000"; ctx.beginPath(); ctx.roundRect(bx, by, bwv, bh, bh / 2); ctx.stroke();
      const vs = v.toFixed(sc.dec) + (sc.unit === "%" ? "%" : ""), vx = Math.min(bx + bwv + 14, W - 24);
      txt(vs, vx, by + bh / 2, P ? 52 : 40, win && done ? "#FFD23F" : "#fff", { align: vx > W - 140 ? "right" : "left", w: 900 });
      if (dim) { ctx.fillStyle = "rgba(5,5,5," + dim * .6 + ")"; ctx.fillRect(bx, by - 2, bw + 10, bh + 4); }
      if (win && done) { const k = back(clamp((u - reveal) / .3)); ctx.save(); ctx.translate(bx - r * 1.25, y + r * .9 - r * 2.25); ctx.scale(k, k); txt("#1", 0, 0, P ? 52 : 44, "#FFD23F", { glow: "rgba(255,210,63,.8)" }); ctx.restore(); }
      ctx.restore();
    });
  }
  function rays(x, y, R, a, t) { ctx.save(); ctx.translate(x, y); ctx.rotate(t * .25); ctx.globalAlpha *= a;
    for (let i = 0; i < 18; i++) { const g = ctx.createLinearGradient(0, 0, R, 0); g.addColorStop(0, "rgba(255,214,80,.55)"); g.addColorStop(1, "rgba(255,214,80,0)"); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, (i * 2) * Math.PI / 18, (i * 2 + 1) * Math.PI / 18); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
  function star(x, y, s, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = "#fff8d0"; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr = i % 2 ? s * .28 : s; ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); } ctx.closePath(); ctx.shadowColor = "#FFD23F"; ctx.shadowBlur = s; ctx.fill(); ctx.restore(); }
  function trophy(x, y, s, t, shine) { // standing on (x, y), height ~ s
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = Math.max(3, s * .03); ctx.strokeStyle = "#3b2a00"; ctx.lineJoin = "round";
    const gold = ctx.createLinearGradient(-s * .4, 0, s * .4, 0); gold.addColorStop(0, "#b7791f"); gold.addColorStop(.35, "#fde68a"); gold.addColorStop(.6, "#f59e0b"); gold.addColorStop(1, "#92400e");
    const path = () => { ctx.beginPath(); ctx.roundRect(-s * .3, -s * .14, s * .6, s * .14, s * .03); ctx.rect(-s * .08, -s * .36, s * .16, s * .22);
      ctx.moveTo(-s * .38, -s * .95); ctx.lineTo(s * .38, -s * .95); ctx.bezierCurveTo(s * .38, -s * .55, s * .2, -s * .38, 0, -s * .38); ctx.bezierCurveTo(-s * .2, -s * .38, -s * .38, -s * .55, -s * .38, -s * .95); ctx.closePath(); };
    [-1, 1].forEach(k => { ctx.beginPath(); ctx.ellipse(k * s * .4, -s * .76, s * .14, s * .16, 0, 0, 7); ctx.lineWidth = s * .055; ctx.strokeStyle = "#b7791f"; ctx.stroke(); });
    ctx.lineWidth = Math.max(3, s * .03); ctx.strokeStyle = "#3b2a00"; path(); ctx.fillStyle = gold; ctx.fill(); ctx.stroke();
    ctx.save(); path(); ctx.clip(); const sx = (shine % 1) * s * 2.2 - s * 1.1; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.moveTo(sx, -s); ctx.lineTo(sx + s * .14, -s); ctx.lineTo(sx - s * .2, 0); ctx.lineTo(sx - s * .34, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    txt("1", 0, -s * .68, s * .3, "#7c2d12", { stroke: false }); ctx.restore(); }
  function crown(x, y, s, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s, -s * .55); ctx.lineTo(-s * .5, -s * .2); ctx.lineTo(0, -s * .75); ctx.lineTo(s * .5, -s * .2); ctx.lineTo(s, -s * .55); ctx.lineTo(s, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, -s * .75, 0, 0); g.addColorStop(0, "#fde68a"); g.addColorStop(1, "#d97706"); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = s * .08; ctx.strokeStyle = "#3b2a00"; ctx.stroke();
    [[-s * .55, -s * .1, "#ef4444"], [0, -s * .12, "#3b82f6"], [s * .55, -s * .1, "#22c55e"]].forEach(([a, b, c]) => { ctx.beginPath(); ctx.arc(a, b, s * .09, 0, 7); ctx.fillStyle = c; ctx.fill(); }); ctx.restore(); }
  function cigar(G, r, u0, u) { // from the mouth corner, lower right; glowing tip; smoke
    const a = eout(clamp((u - u0) / .25)); if (a <= 0) return; const mx = G.cx + r * .3, my = G.cy + G.ry * .42, L = r * .62, th = r * .1, ang = .22;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(mx, my); ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, -th, 0, th); g.addColorStop(0, "#a16207"); g.addColorStop(.5, "#78350f"); g.addColorStop(1, "#451a03");
    ctx.fillStyle = g; ctx.strokeStyle = "#000"; ctx.lineWidth = Math.max(2, r * .025); ctx.beginPath(); ctx.roundRect(0, -th / 2, L, th, th / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#b91c1c"; ctx.fillRect(L * .18, -th / 2, L * .1, th); ctx.fillStyle = "#facc15"; ctx.fillRect(L * .2, -th / 2, L * .06, th);
    ctx.fillStyle = "#57534e"; ctx.fillRect(L - th * .5, -th / 2, th * .5, th);
    const fl = .65 + .35 * Math.sin(u * 23) * Math.sin(u * 7.1); ctx.save(); ctx.shadowColor = "#ff6a00"; ctx.shadowBlur = r * .25 * fl; ctx.fillStyle = "rgba(255," + Math.round(90 + 80 * fl) + ",20,1)"; ctx.beginPath(); ctx.ellipse(L, 0, th * .22, th * .5, 0, 0, 7); ctx.fill(); ctx.restore();
    ctx.restore();
    const tx = mx + Math.cos(ang) * L, ty = my + Math.sin(ang) * L; // smoke particles
    for (let i = 0; i < 22; i++) { const life = 2.2, ph = ((u - u0) - i * .1) / life; if (ph < 0) continue; const q = ph % 1, s0 = h01(i, 3);
      const px = tx + Math.sin(q * 5 + s0 * 6) * r * .18 * q + q * r * .15, py = ty - q * r * 1.6, rr = r * (.05 + .2 * q);
      ctx.fillStyle = "rgba(225,225,225," + (.4 * (1 - q) * a) + ")"; ctx.beginPath(); ctx.arc(px, py, rr, 0, 7); ctx.fill(); } }
  function champion(sc, u, B, t) {
    const P = PT(), r = P ? 300 : 230, gy = H * (P ? .66 : .74), k = back(clamp(u / .38)), x = W / 2 + (P ? 0 : -W * .06), y = gy + (1 - k) * H * .6, props = sc.props || {};
    rays(W / 2, gy - r, Math.max(W, H) * .8, eout(clamp(u / .5)) * (.75 + .25 * B.e), t);
    const hb = eout(clamp((u - .25) / .3)); badge(W / 2, H * (P ? .13 : .14), (P ? 135 : 95) * (1 + .06 * B.e), "#1", hb);
    const sgAt = .55, E = props.sunglasses ? (u < sgAt + .3 ? EYES.serious : EYES.serious) : eyeAt("serious", "angry", .9, u);
    const G = ball(x, y, { r, code: sc.code, E, look: 0, sq: B.sq * S.I * 1.4 + (u < .55 ? Math.max(0, Math.sin(clamp((u - .3) / .25) * Math.PI)) * .6 : 0), glow: "rgba(255,200,40," + (.6 + .3 * B.e) + ")", t });
    if (props.crown) { const ck = back(clamp((u - 1.1) / .3)); if (ck > 0) crown(G.cx + r * .25, G.cy - G.ry * .98, r * .32 * ck, .22); }
    if (props.sunglasses) { const d = clamp((u - sgAt) / .28), dy = (1 - eout(d)) * -(G.ey + r); if (u > sgAt) glasses(G.cx, G.ey, r, 0, 1, dy);
      const fl = clamp((u - sgAt - .28) / .35); if (fl > 0 && fl < 1) { star(G.cx - r * .52, G.ey - r * .1, r * .35 * Math.sin(fl * Math.PI), 1); star(G.cx + r * .3, G.ey - r * .12, r * .2 * Math.sin(fl * Math.PI), .8); } }
    if (props.cigar) cigar(G, r, props.sunglasses ? .95 : .5, u);
    if (props.trophy) { const tk = back(clamp((u - 1.2) / .35)); if (tk > 0) { const ts = r * .95 * tk, tx = G.cx + (P ? -r * 1.05 : r * 1.55), ty = gy + 6 - B.e * r * .05 - Math.sin(u * 3) * 6;
      shadow(tx, gy + 6, ts * .45, .5); trophy(tx, ty, ts, t, (u - 1.2) * .7); for (let i = 0; i < 5; i++) { const q = (u * .9 + i * .21) % 1; star(tx + (h01(i, 7) - .5) * ts * 1.1, ty - ts * (.2 + h01(i, 9) * .9), ts * .09, Math.sin(q * Math.PI)); } } }
    const ha = eout(clamp((u - .4) / .3)), hs = 1 + .05 * B.e;
    if (sc.headline && ha > 0) { ctx.save(); ctx.globalAlpha = ha; ctx.translate(W / 2, H * (P ? .79 : .87)); ctx.scale(hs, hs); txt(String(sc.headline).toUpperCase(), 0, 0, P ? 110 : 84, "#FFD23F", { glow: "rgba(255,200,40,.9)" }); ctx.restore(); }
    if (sc.subtext && ha > 0) { ctx.save(); ctx.globalAlpha = eout(clamp((u - .7) / .3)); txt(String(sc.subtext).toUpperCase(), W / 2, H * (P ? .79 : .87) + (P ? 100 : 74), P ? 50 : 40, "#fff"); ctx.restore(); }
    if (u > .4) for (let i = 0; i < 70; i++) { const sp = 260 + h01(i, 1) * 360, yy = ((u - .4) * sp + h01(i, 2) * H * 1.2) % (H * 1.2) - H * .1, xx = h01(i, 4) * W + Math.sin(u * 3 + i) * 20; // confetti
      ctx.save(); ctx.translate(xx, yy); ctx.rotate(u * (2 + h01(i, 5) * 4) + i); ctx.fillStyle = ["#FFD23F", "#fde68a", "#f59e0b", "#fff"][i % 4]; ctx.globalAlpha = .9; ctx.fillRect(-7, -4, 14, 8); ctx.restore(); }
  }

  // ---------- frame ----------
  function draw(t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    const sc = S.scenes.find(s => t >= s.t0 && t < s.t0 + s.d) || S.scenes[S.scenes.length - 1], u = t - sc.t0, B = beatEnv(t), I = S.I;
    const champHit = sc.type === "champion" ? Math.exp(-u * 4) : 0, z = 1 + (S.hard ? .045 : .022) * I * B.e + (S.hard ? .09 : .05) * champHit, sh = S.hard ? (3 + 3 * I) * B.e + 14 * champHit : 1.2 * I * B.e + 6 * champHit;
    background(t, sc.type === "champion" ? 1.25 : 1);
    ctx.translate(W / 2 + Math.sin(t * 97) * sh, H / 2 + Math.cos(t * 83) * sh); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    if (sc.type === "lineup") lineup(sc, u, B, t); else if (sc.type === "stat_battle") statBattle(sc, u, B, t); else champion(sc, u, B, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0," + (.55 + .15 * B.e * I) + ")");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const fl = Math.exp(-u * 9) * (sc.type === "champion" ? .75 : sc.i ? .35 : 0); if (fl > .01) { ctx.fillStyle = sc.type === "champion" ? "rgba(255,236,170," + fl + ")" : "rgba(255,255,255," + fl + ")"; ctx.fillRect(0, 0, W, H); }
    if (B.hit < 1 && sc.type === "lineup" && sc.eyeDropAt != null && u >= sc.eyeDropAt) { ctx.fillStyle = "rgba(255,210,63," + .18 * Math.exp(-(u - sc.eyeDropAt) * 10) + ")"; ctx.fillRect(0, 0, W, H); }
    if (S.cfg.watermark) { ctx.globalAlpha = .55; txt(String(S.cfg.watermark), W / 2, H - (PT() ? 120 : 50), PT() ? 34 : 26, "#fff", { w: 800 }); }
    ctx.restore();
  }

  // ---------- sound: phonk-style beat at the video's bpm, plus whooshes, hits, a riser and a glint ----------
  function audio(oc, out0, fileBuf) {
    const lim = oc.createDynamicsCompressor(); lim.threshold.value = -8; lim.ratio.value = 12; lim.attack.value = .003; lim.release.value = .15; const out = oc.createGain(); out.gain.value = .8; out.connect(lim).connect(out0); // keep peaks under 0 dB
    const D = S.total, sr = oc.sampleRate, beat = 60 / S.bpm;
    const noise = (() => { const b = oc.createBuffer(1, sr, sr), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = h01(i, 11) * 2 - 1; return b; })();
    const nz = (t0, dur, type, f0, f1, g, q = 1) => { const s = oc.createBufferSource(), f = oc.createBiquadFilter(), e = oc.createGain(); s.buffer = noise; s.loop = true; f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur); e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + Math.min(.02, dur * .3)); e.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      s.connect(f).connect(e).connect(out); s.start(t0); s.stop(t0 + dur + .02); };
    const boom = (t0, g, f0 = 70) => { const o = oc.createOscillator(), e = oc.createGain(); o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(32, t0 + .55);
      e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + .008); e.gain.exponentialRampToValueAtTime(.0001, t0 + .9); o.connect(e).connect(out); o.start(t0); o.stop(t0 + 1); };
    if (fileBuf) { const b = oc.createBufferSource(), g = oc.createGain(); b.buffer = fileBuf; b.loop = true; g.gain.value = .9; b.connect(g).connect(out); b.start(0); }
    else if ($("music").value !== "off") {
      const sat = oc.createWaveShaper(), cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cv[i] = Math.tanh(x * (S.hard ? 2.4 : 1.1)); } sat.curve = cv; const bus = oc.createGain(); bus.gain.value = .55; sat.connect(bus).connect(out);
      if (!S.hard) { // soft: half-time 808 + one clap a bar, light hats on 8ths, a quiet bell line and a warm pad (E minor)
        const pad = oc.createGain(); pad.gain.value = .5; pad.connect(out); const lpf = oc.createBiquadFilter(); lpf.type = "lowpass"; lpf.frequency.value = 1400; lpf.connect(pad);
        const CH = [[52, 55, 59, 64], [48, 52, 55, 60], [50, 54, 57, 62], [47, 50, 54, 59]], BELL = [76, 74, 71, 74, 76, 79, 76, 71];
        for (let bar = 0, tb = 0; tb < D; bar++, tb = bar * beat * 4) {
          CH[bar % 4].forEach(m => [.996, 1.004].forEach(dt => { const o = oc.createOscillator(), e = oc.createGain(); o.type = "triangle"; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12) * dt;
            e.gain.setValueAtTime(.0001, tb); e.gain.linearRampToValueAtTime(.022, tb + .25); e.gain.setValueAtTime(.022, tb + beat * 3.6); e.gain.linearRampToValueAtTime(.0001, tb + beat * 4.2); o.connect(e).connect(lpf); o.start(tb); o.stop(tb + beat * 4.3); }));
          [0, 2.5].forEach(bb => { const t0 = tb + bb * beat; if (t0 >= D) return; const o = oc.createOscillator(), e = oc.createGain(), root = [40, 36, 38, 35][bar % 4];
            o.frequency.setValueAtTime(440 * Math.pow(2, (root - 69) / 12) * 1.6, t0); o.frequency.exponentialRampToValueAtTime(440 * Math.pow(2, (root - 69) / 12), t0 + .06);
            e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(bb ? .45 : .6, t0 + .01); e.gain.exponentialRampToValueAtTime(.0001, t0 + beat * 1.6); o.connect(e).connect(sat); o.start(t0); o.stop(t0 + beat * 1.7); });
          nz(tb + 2 * beat, .22, "bandpass", 1600, 1100, .14, .7);
          for (let q = 0; q < 8; q++) nz(tb + q * beat / 2, .025, "highpass", 8500, 9500, q % 2 ? .018 : .03);
          BELL.forEach((m, q) => { const ts = tb + q * beat / 2; if (q % 2 && bar % 2 === 0) return; const c = oc.createOscillator(), e2 = oc.createGain(); c.type = "sine"; c.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
            e2.gain.setValueAtTime(.0001, ts); e2.gain.exponentialRampToValueAtTime(.035, ts + .005); e2.gain.exponentialRampToValueAtTime(.0001, ts + .5); c.connect(e2).connect(out); c.start(ts); c.stop(ts + .55); });
        }
      } else {
      const COW = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1], NOTES = [0, 0, 3, 0, 5, 3, 7, 5, 0, 0, 3, 0, 10, 7, 5, 3], ROOT = 64; // E minor-ish cowbell line
      for (let k = 0, t0 = 0; t0 < D; k++, t0 = k * beat) {
        const o = oc.createOscillator(), e = oc.createGain(); o.frequency.setValueAtTime(k % 8 === 6 ? 62 : 55, t0); o.frequency.exponentialRampToValueAtTime(36, t0 + beat * .9); // 808
        e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(.9, t0 + .006); e.gain.exponentialRampToValueAtTime(.0001, t0 + beat * .95); o.connect(e).connect(sat); o.start(t0); o.stop(t0 + beat);
        if (k % 2 === 1) nz(t0, .16, "bandpass", 1800, 1200, .22, .8); // clap
        for (let s = 0; s < 4; s++) { const ts = t0 + s * beat / 4, idx = (k * 4 + s) % 16; nz(ts, .03, "highpass", 8000, 9000, s % 2 ? .035 : .06);
          if (COW[idx]) [1, 1.48].forEach(m => { const c = oc.createOscillator(), f = oc.createBiquadFilter(), e2 = oc.createGain(); c.type = "square"; c.frequency.value = 440 * Math.pow(2, (ROOT + NOTES[idx] - 69) / 12) * m;
            f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 2; e2.gain.setValueAtTime(.0001, ts); e2.gain.exponentialRampToValueAtTime(.05, ts + .004); e2.gain.exponentialRampToValueAtTime(.0001, ts + .22); c.connect(f).connect(e2).connect(out); c.start(ts); c.stop(ts + .25); }); }
      }
      }
    }
    S.scenes.forEach(sc => {
      if (sc.i) boom(sc.t0, S.hard ? .45 : .3);
      if (sc.type === "lineup") { sc.members.forEach((m, i) => { if (i) nz(sc.t0 + .12 + i * .1, .32, "bandpass", 500, 3500, .12, 1.2); }); if (sc.eyeDropAt != null) boom(sc.t0 + sc.eyeDropAt, S.hard ? .5 : .35, 90); }
      if (sc.type === "stat_battle") { const rv = sc.t0 + Math.min(sc.d * .55, 1.45); nz(sc.t0 + .2, rv - sc.t0 - .2, "bandpass", 400, 4000, .05, 2); boom(rv, .4, 110); }
      if (sc.type === "champion") { nz(Math.max(0, sc.t0 - 1.2), 1.2, "bandpass", 300, 6000, .12, 3); boom(sc.t0, .85, 80);
        const p = sc.props || {}; if (p.sunglasses) { const tg = sc.t0 + .83; [2093, 2637, 3136].forEach((f, j) => { const o = oc.createOscillator(), e = oc.createGain(); o.type = "sine"; o.frequency.value = f; e.gain.setValueAtTime(.0001, tg + j * .03); e.gain.exponentialRampToValueAtTime(.08, tg + j * .03 + .005); e.gain.exponentialRampToValueAtTime(.0001, tg + j * .03 + .6); o.connect(e).connect(out); o.start(tg + j * .03); o.stop(tg + .7); }); }
        if (p.trophy) nz(sc.t0 + 1.2, .5, "highpass", 5000, 9000, .05); }
    });
  }
  return { SAMPLE, build, draw, audio, beatsFor };
})();
