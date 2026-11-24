const CountryballEngine = (() => {
function computeBallRadius(value, maxValue, minR = 34, maxR = 148) {
if (!maxValue || maxValue <= 0) return minR;
const ratio = Math.max(0, Math.min(1, value / maxValue));
const curved = Math.pow(ratio, 0.44);
return minR + curved * (maxR - minR);
}
function getDefaultEmotion(rank, isNextToGiant = false) {
if (isNextToGiant) return 'shocked';
if (rank === 1) return 'proud';
if (rank <= 3) return 'angry';
if (rank <= 6) return 'determined';
return 'happy';
}
function getBounceTransform(dropProgress, idleTime = 0, isShocked = false) {
let offsetY = 0;
let scaleX = 1;
let scaleY = 1;
let trembleX = 0;
if (dropProgress < 1) {
if (dropProgress < 0.55) {
const t = dropProgress / 0.55;
offsetY = -260 * (1 - t * t);
scaleX = 0.92;
scaleY = 1.09;
} else if (dropProgress < 0.78) {
const t = (dropProgress - 0.55) / 0.23;
const squash = Math.sin(t * Math.PI);
scaleX = 1 + squash * 0.22;
scaleY = 1 - squash * 0.20;
} else {
const t = (dropProgress - 0.78) / 0.22;
const hop = Math.sin(t * Math.PI);
offsetY = -26 * hop;
scaleX = 1 - hop * 0.06;
scaleY = 1 + hop * 0.07;
}
} else {
const breath = Math.sin(idleTime * 5.2);
scaleX = 1 + breath * 0.025;
scaleY = 1 - breath * 0.025;
offsetY = -Math.abs(Math.sin(idleTime * 2.6)) * 6;
}
if (isShocked) {
trembleX = Math.sin(idleTime * 62) * 3.5;
}
return { offsetX: trembleX, offsetY, scaleX, scaleY };
}
function drawCartoonBackdrop(ctx, w, h, theme = 'comic_sky', cameraScrollX = 0, groundY = h * 0.76) {
ctx.save();
const sky = ctx.createLinearGradient(0, 0, 0, groundY);
if (theme === 'sunset_drama') {
sky.addColorStop(0, '#3B2F63');
sky.addColorStop(0.52, '#8E5384');
sky.addColorStop(1, '#F6A45B');
} else if (theme === 'studio_dark') {
sky.addColorStop(0, '#091020');
sky.addColorStop(1, '#142038');
} else {
sky.addColorStop(0, '#4FA8F6');
sky.addColorStop(0.65, '#8FD3FE');
sky.addColorStop(1, '#D8F1FF');
}
ctx.fillStyle = sky;
ctx.fillRect(0, 0, w, groundY);
if (theme !== 'studio_dark') {
ctx.fillStyle = theme === 'sunset_drama'
? 'rgba(255, 210, 175, 0.35)'
: 'rgba(255, 255, 255, 0.85)';
const cloudSpan = w + 320;
const clouds = [
{ base: 140, y: h * 0.14, s: 1.0 },
{ base: 520, y: h * 0.22, s: 0.78 },
{ base: 920, y: h * 0.12, s: 1.15 },
];
clouds.forEach((c) => {
const cx = ((c.base - cameraScrollX * 0.18) % cloudSpan + cloudSpan) % cloudSpan - 160;
drawFluffyCloud(ctx, cx, c.y, 44 * c.s);
});
}
const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
if (theme === 'sunset_drama') {
groundGrad.addColorStop(0, '#5A6B47');
groundGrad.addColorStop(1, '#2D3A26');
} else if (theme === 'studio_dark') {
groundGrad.addColorStop(0, '#10192D');
groundGrad.addColorStop(1, '#070C17');
} else {
groundGrad.addColorStop(0, '#85D46B');
groundGrad.addColorStop(1, '#4EA843');
}
ctx.fillStyle = groundGrad;
ctx.fillRect(0, groundY, w, h - groundY);
ctx.strokeStyle = theme === 'studio_dark' ? 'rgba(120, 180, 255, 0.28)' : '#1A241A';
ctx.lineWidth = Math.max(3, Math.round(w * 0.003));
ctx.beginPath();
ctx.moveTo(0, groundY);
ctx.lineTo(w, groundY);
ctx.stroke();
ctx.restore();
}
function drawFluffyCloud(ctx, x, y, r) {
ctx.beginPath();
ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
ctx.arc(x + r * 0.7, y - r * 0.2, r * 0.9, 0, Math.PI * 2);
ctx.arc(x + r * 1.45, y, r * 0.7, 0, Math.PI * 2);
ctx.fill();
}
function drawCountryball(ctx, opts) {
const {
x,
groundY,
radius,
flagImg = null,
fallbackColor = '#E63946',
emotion = 'happy',
isMystery = false,
hasCrown = false,
dropProgress = 1,
time = 0,
lookDir = 0,
} = opts;
const isShocked = emotion === 'shocked';
const tf = getBounceTransform(dropProgress, time, isShocked);
const outlineW = Math.max(3, Math.min(7, radius * 0.065));
const airFactor = Math.max(0.35, 1 + tf.offsetY / 350);
ctx.save();
ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
ctx.beginPath();
ctx.ellipse(
x + tf.offsetX,
groundY + 4,
radius * 0.88 * airFactor * tf.scaleX,
Math.max(6, radius * 0.17 * airFactor),
0,
0,
Math.PI * 2
);
ctx.fill();
ctx.restore();
ctx.save();
ctx.translate(x + tf.offsetX, groundY + tf.offsetY);
ctx.scale(tf.scaleX, tf.scaleY);
const cy = -radius;
if (isMystery) {
drawMysteryAura(ctx, 0, cy, radius, time);
}
ctx.save();
ctx.beginPath();
ctx.arc(0, cy, radius, 0, Math.PI * 2);
ctx.clip();
if (isMystery) {
const mGrad = ctx.createRadialGradient(-radius * 0.25, cy - radius * 0.25, radius * 0.1, 0, cy, radius);
mGrad.addColorStop(0, '#2B2B33');
mGrad.addColorStop(0.65, '#111116');
mGrad.addColorStop(1, '#050507');
ctx.fillStyle = mGrad;
ctx.fillRect(-radius, cy - radius, radius * 2, radius * 2);
} else if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
const imgAspect = flagImg.naturalWidth / flagImg.naturalHeight;
let drawW = radius * 2;
let drawH = radius * 2;
if (imgAspect > 1) {
drawW = drawH * imgAspect;
} else {
drawH = drawW / imgAspect;
}
ctx.drawImage(flagImg, -drawW / 2, cy - drawH / 2, drawW, drawH);
} else {
ctx.fillStyle = fallbackColor;
ctx.fillRect(-radius, cy - radius, radius * 2, radius * 2);
}
const shadeGrad = ctx.createRadialGradient(
-radius * 0.28,
cy - radius * 0.28,
radius * 0.35,
0,
cy,
radius * 1.05
);
shadeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
shadeGrad.addColorStop(0.68, 'rgba(0, 0, 0, 0)');
shadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.36)');
ctx.fillStyle = shadeGrad;
ctx.fillRect(-radius, cy - radius, radius * 2, radius * 2);
ctx.fillStyle = isMystery ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.28)';
ctx.beginPath();
ctx.ellipse(-radius * 0.36, cy - radius * 0.42, radius * 0.24, radius * 0.13, -0.65, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
ctx.strokeStyle = '#111111';
ctx.lineWidth = outlineW;
ctx.beginPath();
ctx.arc(0, cy, radius, 0, Math.PI * 2);
ctx.stroke();
if (isMystery) {
drawQuestionMark(ctx, 0, cy, radius, time);
} else {
drawFace(ctx, 0, cy, radius, emotion, lookDir, outlineW, time);
}
if (!isMystery && emotion === 'angry') {
drawSteamPuffs(ctx, radius, cy, time);
}
if (!isMystery && (emotion === 'shocked' || emotion === 'tired')) {
drawSweatDrops(ctx, radius, cy, time);
}
if (hasCrown) {
drawCartoonCrown(ctx, radius * 0.25, cy - radius * 0.92, radius * 0.48, outlineW);
}
ctx.restore();
}
function drawMysteryAura(ctx, cx, cy, r, time) {
const pulse = 1 + Math.sin(time * 5) * 0.04;
ctx.save();
const aura = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.48 * pulse);
aura.addColorStop(0, 'rgba(255, 212, 59, 0.42)');
aura.addColorStop(1, 'rgba(255, 212, 59, 0)');
ctx.fillStyle = aura;
ctx.beginPath();
ctx.arc(cx, cy, r * 1.48 * pulse, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = 'rgba(20, 20, 25, 0.72)';
ctx.lineWidth = Math.max(2.5, r * 0.03);
ctx.lineCap = 'round';
const arcOffset = r * 1.13 + Math.sin(time * 18) * 2;
[-1, 1].forEach((side) => {
const startAngle = side === -1 ? Math.PI * 0.85 : -Math.PI * 0.15;
const endAngle = side === -1 ? Math.PI * 1.15 : Math.PI * 0.15;
ctx.beginPath();
ctx.arc(cx, cy, arcOffset, startAngle, endAngle);
ctx.stroke();
});
ctx.restore();
}
function drawQuestionMark(ctx, cx, cy, r, time) {
const glow = 14 + Math.sin(time * 6) * 6;
ctx.save();
ctx.font = `900 ${Math.round(r * 1.18)}px ${FONT}`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.shadowColor = 'rgba(255, 224, 102, 0.75)';
ctx.shadowBlur = glow;
ctx.fillStyle = '#F8FAFC';
ctx.fillText('?', cx, cy + r * 0.05);
ctx.restore();
}
function drawFace(ctx, cx, cy, r, emotion, lookDir, outlineW, time) {
const eyeShiftX = lookDir * r * 0.14;
const eyeOffsetX = r * 0.29;
const eyeY = cy - r * 0.08;
const eyeW = emotion === 'shocked' ? r * 0.24 : r * 0.19;
const eyeH = emotion === 'shocked' ? r * 0.29 : r * 0.23;
const isBlinking = emotion === 'happy' && (time % 3.4) > 3.28;
[-1, 1].forEach((side) => {
const ex = cx + eyeShiftX + side * eyeOffsetX;
ctx.save();
ctx.translate(ex, eyeY);
if (isBlinking) {
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(2.5, outlineW * 0.75);
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(-eyeW * 0.75, 0);
ctx.lineTo(eyeW * 0.75, 0);
ctx.stroke();
} else if (emotion === 'tired') { // out of breath: heavy drooping lids, pupils low
ctx.fillStyle = '#FFFFFF';
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(2.2, outlineW * 0.72);
ctx.beginPath();
ctx.ellipse(0, eyeH * 0.15, eyeW, eyeH * 0.7, 0, 0, Math.PI);
ctx.closePath();
ctx.fill();
ctx.stroke();
ctx.fillStyle = '#111111';
ctx.beginPath();
ctx.arc(0, eyeH * 0.45, Math.max(2.2, r * 0.055), 0, Math.PI * 2);
ctx.fill();
ctx.lineWidth = Math.max(3, outlineW * 0.9);
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(-eyeW * 1.15, eyeH * (side === -1 ? 0.35 : 0.0));
ctx.lineTo(eyeW * 1.15, eyeH * (side === -1 ? 0.0 : 0.35));
ctx.stroke();
} else if (emotion === 'proud') {
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(3, outlineW * 0.9);
ctx.lineCap = 'round';
ctx.beginPath();
ctx.arc(0, eyeH * 0.2, eyeW * 0.85, Math.PI * 1.12, Math.PI * 1.88);
ctx.stroke();
} else {
ctx.fillStyle = '#FFFFFF';
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(2.2, outlineW * 0.72);
ctx.beginPath();
ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();
ctx.fillStyle = '#111111';
ctx.beginPath();
ctx.arc(lookDir * eyeW * 0.3, eyeH * 0.08, Math.max(2.4, r * (emotion === 'shocked' ? 0.045 : 0.075)), 0, Math.PI * 2);
ctx.fill();
if (emotion === 'angry' || emotion === 'determined') {
ctx.save();
ctx.beginPath();
ctx.ellipse(0, 0, eyeW + 1, eyeH + 1, 0, 0, Math.PI * 2);
ctx.clip();
const slant = emotion === 'angry' ? eyeH * 0.65 : eyeH * 0.35;
ctx.fillStyle = 'rgba(20, 20, 25, 0.08)';
ctx.beginPath();
ctx.moveTo(-eyeW * 1.4, -eyeH * 1.4);
ctx.lineTo(eyeW * 1.4, -eyeH * 1.4);
ctx.lineTo(eyeW * 1.4, side === -1 ? -eyeH * 0.15 + slant : -eyeH * 0.55);
ctx.lineTo(-eyeW * 1.4, side === -1 ? -eyeH * 0.55 : -eyeH * 0.15 + slant);
ctx.closePath();
ctx.fill();
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(2.8, outlineW * 0.85);
ctx.beginPath();
ctx.moveTo(-eyeW * 1.15, side === -1 ? -eyeH * 0.55 : -eyeH * 0.12 + slant);
ctx.lineTo(eyeW * 1.15, side === -1 ? -eyeH * 0.12 + slant : -eyeH * 0.55);
ctx.stroke();
ctx.restore();
}
}
ctx.restore();
});
if (emotion === 'tired') { // panting: open mouth that pulses, tongue hanging out
const mx = cx + eyeShiftX;
const my = cy + r * 0.38;
const pant = 1 + 0.22 * Math.sin(time * 11);
const mw = r * 0.25;
const mh = r * 0.17 * pant;
ctx.save();
ctx.fillStyle = '#5B1219';
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(2.2, outlineW * 0.7);
ctx.beginPath();
ctx.ellipse(mx, my, mw, mh, 0, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();
ctx.fillStyle = '#F472B6';
ctx.beginPath();
ctx.ellipse(mx + mw * 0.15, my + mh * 0.85, mw * 0.5, mh * 0.75, 0.15, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();
ctx.restore();
}
if (emotion === 'shocked') {
const mx = cx + eyeShiftX;
const my = cy + r * 0.34;
const mw = r * 0.27;
const mh = r * 0.22;
ctx.save();
ctx.fillStyle = '#7A1C24';
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(2.2, outlineW * 0.7);
ctx.beginPath();
ctx.ellipse(mx, my, mw, mh, 0, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();
ctx.fillStyle = '#E85D75';
ctx.beginPath();
ctx.ellipse(mx, my + mh * 0.45, mw * 0.58, mh * 0.38, 0, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
}
}
function drawSweatDrops(ctx, r, cy, time) {
ctx.save();
ctx.fillStyle = '#74D3FF';
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(1.8, r * 0.032);
const drops = [
{ ang: -2.4, dist: 1.18, phase: 0 },
{ ang: -2.05, dist: 1.28, phase: 0.4 },
{ ang: -0.75, dist: 1.2, phase: 0.2 },
];
drops.forEach((d) => {
const drift = ((time * 1.6 + d.phase) % 1) * r * 0.22;
const dx = Math.cos(d.ang) * (r * d.dist + drift);
const dy = cy + Math.sin(d.ang) * (r * d.dist + drift);
const sz = Math.max(4, r * 0.11);
ctx.beginPath();
ctx.moveTo(dx, dy - sz * 1.3);
ctx.quadraticCurveTo(dx + sz, dy + sz * 0.5, dx, dy + sz);
ctx.quadraticCurveTo(dx - sz, dy + sz * 0.5, dx, dy - sz * 1.3);
ctx.fill();
ctx.stroke();
});
ctx.restore();
}
function drawSteamPuffs(ctx, r, cy, time) {
ctx.save();
const cycle = (time * 1.4) % 1;
const alpha = Math.sin(cycle * Math.PI);
ctx.globalAlpha = alpha * 0.9;
ctx.fillStyle = '#FFFFFF';
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(1.8, r * 0.03);
[-1, 1].forEach((side) => {
const px = side * (r * 0.98 + cycle * r * 0.28);
const py = cy - r * 0.72 - cycle * r * 0.32;
const pr = r * (0.14 + cycle * 0.08);
ctx.beginPath();
ctx.arc(px, py, pr, 0, Math.PI * 2);
ctx.arc(px + side * pr * 0.7, py - pr * 0.35, pr * 0.75, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();
});
ctx.restore();
}
function drawCartoonCrown(ctx, x, y, size, outlineW) {
ctx.save();
ctx.translate(x, y);
ctx.rotate(0.24);
ctx.fillStyle = '#FFD43B';
ctx.strokeStyle = '#111111';
ctx.lineWidth = Math.max(2.5, outlineW * 0.75);
ctx.lineJoin = 'round';
const w = size;
const h = size * 0.62;
ctx.beginPath();
ctx.moveTo(-w / 2, h / 2);
ctx.lineTo(-w * 0.62, -h * 0.35);
ctx.lineTo(-w * 0.22, 0);
ctx.lineTo(0, -h * 0.62);
ctx.lineTo(w * 0.22, 0);
ctx.lineTo(w * 0.62, -h * 0.35);
ctx.lineTo(w / 2, h / 2);
ctx.closePath();
ctx.fill();
ctx.stroke();
ctx.restore();
}
function scheduleCartoonSfxOffline(audioCtx, destination, startTime, type, volume = 0.45) {
const t = Math.max(0, startTime);
if (type === 'boing') {
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.type = 'sine';
osc.frequency.setValueAtTime(190, t);
osc.frequency.exponentialRampToValueAtTime(520, t + 0.09);
osc.frequency.exponentialRampToValueAtTime(310, t + 0.22);
gain.gain.setValueAtTime(0.001, t);
gain.gain.linearRampToValueAtTime(volume * 0.55, t + 0.02);
gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
osc.connect(gain).connect(destination);
osc.start(t);
osc.stop(t + 0.26);
return;
}
if (type === 'pop') {
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.type = 'triangle';
osc.frequency.setValueAtTime(620, t);
osc.frequency.exponentialRampToValueAtTime(240, t + 0.055);
gain.gain.setValueAtTime(volume * 0.45, t);
gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
osc.connect(gain).connect(destination);
osc.start(t);
osc.stop(t + 0.07);
return;
}
if (type === 'gasp_drop') {
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.type = 'sine';
osc.frequency.setValueAtTime(155, t);
osc.frequency.exponentialRampToValueAtTime(40, t + 0.38);
gain.gain.setValueAtTime(volume * 0.9, t);
gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
osc.connect(gain).connect(destination);
osc.start(t);
osc.stop(t + 0.45);
return;
}
if (type === 'victory_chime') {
const notes = [523.25, 659.25, 783.99, 1046.5];
notes.forEach((freq, i) => {
const nt = t + i * 0.06;
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.type = 'triangle';
osc.frequency.setValueAtTime(freq, nt);
gain.gain.setValueAtTime(0.001, nt);
gain.gain.linearRampToValueAtTime(volume * 0.38, nt + 0.02);
gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.55);
osc.connect(gain).connect(destination);
osc.start(nt);
osc.stop(nt + 0.58);
});
}
}
return {
computeBallRadius,
getDefaultEmotion,
getBounceTransform,
drawCartoonBackdrop,
drawCountryball,
scheduleCartoonSfxOffline,
};
})();

function ballTheme() {
const v = $("btheme") ? $("btheme").value : "auto";
if (v !== "auto") return v;
const c = S && S.cfg && S.cfg.ballTheme;
return /^(comic_sky|sunset_drama|studio_dark)$/.test(c || "") ? c : "auto";
}
function ballLayout() {
if (S.ballL) return S.ballL;
const items = S.items, maxV = Math.max(1e-9, ...items.map(x => x.value)), minR = PORT ? 62 : 46, maxR = PORT ? 265 : 250, gap = PORT ? 24 : 18;
let x = 0;
const pos = items.map(it => { const r = CountryballEngine.computeBallRadius(it.value, maxV, minR, maxR), o = { r, x: x + r }; x += 2 * r + gap; return o; });
return (S.ballL = { pos, x0: pos[0].x - pos[0].r, x1: pos[pos.length - 1].x + pos[pos.length - 1].r });
}
function ballText(txt, x, y, size, fill, maxW) {
ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
fit(txt, size, 900, maxW); ctx.lineWidth = Math.max(6, size * .16); ctx.strokeStyle = "#111"; ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y); ctx.restore();
}
function drawBallHook(t, groundY) {
const CE = CountryballEngine, { items } = S, two = items.find(x => x.rank === 2) || items[0], f = flags[two.code];
const giantR = PORT ? W * .31 : H * .24, smallR = giantR * .5;
CE.drawCountryball(ctx, { x: W * (PORT ? .62 : .60), groundY, radius: giantR, isMystery: true, hasCrown: true, dropProgress: clamp(t / .5), time: t });
CE.drawCountryball(ctx, { x: W * (PORT ? .27 : .36), groundY: groundY + 14, radius: smallR, flagImg: f && f.ok ? f.im : null, fallbackColor: (two.m && two.m.col) || "#475569", emotion: "shocked", lookDir: 1, dropProgress: 1, time: t });
}
function drawBallFrame(t) {
const CE = CountryballEngine, { cfg, items, intro } = S, n = items.length, Ly = ballLayout();
const ci = ciAt(t), inOut = ci >= n, live = ci >= 0 && !inOut, cc = Math.min(Math.max(ci, 0), n - 1), PRT = PORT;
const tau0 = live ? t - intro - S.st[ci] : 0, ps = live ? S.pause[ci] : 0, tau = Math.max(0, tau0 - ps), inPause = live && tau0 < ps;
const pc = live ? S.dur[ci] - ps : S.per, to = inOut ? t - (intro + S.itemsT) : 0, quick = S.outMode !== "full", TL = quick ? 1 : 1.4;
const groundY = H * (PRT ? .70 : .74), anchorX = W * (PRT ? .62 : .64);
const curX = Ly.pos[cc].x, prevX = cc > 0 ? Ly.pos[cc - 1].x : curX - (PRT ? 420 : 520), camT = Math.min(.45 * pc, 1.0);
let camX = ci < 0 ? prevX : lerp2(prevX, curX, easeIO(tau0 / camT)), z = 1, ax = anchorX;
if (inOut) { const T = eout(seg(to, 0, TL)), rowC = (Ly.x0 + Ly.x1) / 2, zf = Math.min(1, W * .94 / (Ly.x1 - Ly.x0)); camX = lerp2(curX, rowC, T); z = lerp2(1, zf, T); ax = lerp2(anchorX, W / 2, T); }
ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
const fixed = ballTheme(), t3k = items.findIndex(x => x.rank <= 3), t3 = t3k < 0 ? 1e9 : intro + S.st[t3k];
const hookSun = cfg.hook !== false ? 1 - seg(t, intro - .05, intro + .45) : 0, aSun = fixed === "sunset_drama" ? 1 : Math.max(hookSun, eout(seg(t, t3, t3 + .6)));
CE.drawCartoonBackdrop(ctx, W, H, fixed === "studio_dark" ? "studio_dark" : "comic_sky", camX * z, groundY);
if (fixed === "auto" && aSun > .001 || fixed === "sunset_drama") { ctx.save(); ctx.globalAlpha = aSun; CE.drawCartoonBackdrop(ctx, W, H, "sunset_drama", camX * z, groundY); ctx.restore(); }
if (ci < 0) { if (cfg.hook !== false) drawBallHook(t, groundY); }
else {
let amp = 0;
if (live) {
const r1 = items[cc].rank;
if (inPause) { const s = tau0 - .22; if (s > 0 && s < .5) amp = 10 * (1 - s / .5); }
else { const big = ps > 0 || r1 === 1 ? 1 : r1 <= 3 ? .5 : 0, s = tau - (ps > 0 ? 0 : .25); if (big && s > 0 && s < .5) amp = 16 * big * (1 - s / .5); }
}
const shx = Math.sin(t * 95) * amp, shy = Math.cos(t * 83) * amp * .7;
const rev1 = live && items[cc].rank === 1 && !inPause;
if (rev1) {
const ge = eout(clamp(tau / .7)), gx = ax + (curX - camX) * z, gy = groundY - Ly.pos[cc].r * z, gr = Math.max(W, H) * .7, gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
gg.addColorStop(0, "rgba(255,200,40," + (.38 * ge) + ")"); gg.addColorStop(.5, "rgba(255,170,30," + (.12 * ge) + ")"); gg.addColorStop(1, "rgba(255,170,30,0)");
ctx.save(); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); ctx.restore();
}
const G = Math.max(pc * .7, pc - .7), grow = inOut ? 1 : eout(clamp(tau / G));
const hasOne = items.slice(0, cc + 1).some(x => x.rank === 1), hl = new Set(S.hl), sb = PRT ? 38 : 32;
const curHalf = live && !inPause ? Math.max(Ly.pos[cc].r, (items[cc].name.length + 4) * (PRT ? 52 : 46) * .32) + 30 : 0;
ctx.save(); ctx.translate(ax + shx, groundY + shy); ctx.scale(z, z); ctx.translate(-camX, -groundY);
for (let i = 0; i <= cc; i++) {
const it = items[i], p = Ly.pos[i], sx = ax + (p.x - camX) * z; if (sx + p.r * z < -60 || sx - p.r * z > W + 60) continue;
const cur = live && i === cc, mys = cur && inPause, f = flags[it.code], labelY = groundY + (PRT ? 56 : 46);
let dp = 1; if (cur) dp = ps > 0 ? (inPause ? clamp(tau0 / .5) : .78 + .22 * clamp(tau / .35)) : clamp(tau / .45);
const shocked = it.rank === 2 && hasOne, emo = shocked ? "shocked" : CE.getDefaultEmotion(it.rank);
CE.drawCountryball(ctx, { x: p.x, groundY, radius: p.r, flagImg: f && f.ok ? f.im : null, fallbackColor: (it.m && it.m.col) || "#475569", emotion: emo, isMystery: mys, hasCrown: it.rank === 1 && !mys, dropProgress: dp, time: t + i * .37, lookDir: shocked ? 1 : 0 });
if (inOut && hl.has(it.m)) { ctx.save(); ctx.strokeStyle = "#FFD43B"; ctx.lineWidth = 8; ctx.shadowColor = "#FFD43B"; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(p.x, groundY - p.r, p.r + 14 + 5 * Math.sin(t * 6), 0, 7); ctx.stroke(); ctx.restore(); }
if (mys) continue;
if (cur) {
const a = eout(seg(tau, .2, .5)); if (a > 0) { const ls = PRT ? 52 : 46, mw = Math.max(p.r * 2.4, PRT ? 360 : 420);
ctx.save(); ctx.globalAlpha = a; ballText("#" + it.rank + " " + it.name, p.x, labelY, ls, it.rank === 1 ? "#FFE033" : "#fff", mw); ballText(full(it.value * grow), p.x, labelY + ls * 1.12, ls * .9, "#FFD43B", mw); ctx.restore(); }
} else if (inOut) {
const top = it.rank <= 3, a = eout(seg(to, .3, .9)), sc = 1 / z;
if (top && z >= .55) { ctx.save(); ctx.globalAlpha = a; ballText("#" + it.rank + " " + it.name, p.x, labelY, (PRT ? 32 : 28) * sc, it.rank === 1 ? "#FFE033" : "#fff", p.r * 2.6); ballText(short(it.value), p.x, labelY + 34 * sc, 26 * sc, "#FFD43B", p.r * 2.6); ctx.restore(); }
else if (top || n <= 12) ballText("#" + it.rank, p.x, labelY, (top ? sb + 6 : sb - 8) * sc, it.rank === 1 ? "#FFE033" : "#fff", p.r * 2);
} else if (Math.abs(p.x - curX) > curHalf + p.r * .4) ballText("#" + it.rank, p.x, labelY, sb - 4, "#fff", p.r * 2);
}
ctx.restore();
if (rev1 && tau < .3) { ctx.save(); ctx.globalAlpha = .6 * (1 - tau / .3); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
if (live || inOut) {
ctx.fillStyle = "#fff"; ctx.save(); ctx.lineJoin = "round"; ctx.lineWidth = 7; ctx.strokeStyle = "#111"; ctx.textAlign = "left";
const ttl = String(cfg.title || "").toUpperCase(); fit(ttl, PRT ? 30 : 30, 900, W - 90); ctx.strokeText(ttl, PRT ? 34 : 46, 44); ctx.fillText(ttl, PRT ? 34 : 46, 44); ctx.restore();
}
}
if (cfg.source) { ctx.save(); ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.lineJoin = "round"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.55)"; fit(cfg.source, PRT ? 17 : 15, 600, W - 60); ctx.textAlign = "left"; ctx.strokeText(cfg.source, 28, H - 20); ctx.fillText(cfg.source, 28, H - 20); ctx.restore(); }
if (inOut && quick && S.outMode === "quick" && to > TL + (S.spotT || 0) && (S.cfg.question || !S.end)) {
const q = String(cfg.question || (cfg.outro && cfg.outro.cta && cfg.outro.cta.length < 60 ? cfg.outro.cta : "Is your country in the top " + S.items.length + "? Tell us below"));
const a = eout(seg(to, TL + (S.spotT || 0), TL + (S.spotT || 0) + .3)), qy = PRT ? H * .92 : H * .93;
ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle"; fit(q, PRT ? 52 : 44, 900, W - 120);
const tw = ctx.measureText(q).width, ph = PRT ? 92 : 80;
ctx.fillStyle = "rgba(8,12,24,.88)"; ctx.strokeStyle = "#FFD23F"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2 - 36, qy - ph / 2, tw + 72, ph, ph / 2); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#fff"; ctx.fillText(q, W / 2, qy + 2); ctx.restore();
}
if (inOut && !quick && cfg.outro && to > .6) {
const o = cfg.outro, a = eout(seg(to, .6, 1.4)), cw = PRT ? W * .58 : 620, chh = PRT ? 360 : 330, x = PRT ? 34 : 46, y = PRT ? 200 : 205;
ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "rgba(8,12,24,.84)"; ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 1.5;
ctx.beginPath(); ctx.roundRect(x, y, cw, chh, 22); ctx.fill(); ctx.stroke(); ctx.textBaseline = "alphabetic";
let yy = wrap(o.big || "", x + 28, y + 70, PRT ? 46 : 54, 800, cw - 56, PRT ? 56 : 64, "#fff");
yy = wrap(o.text || "", x + 28, yy + 6, PRT ? 26 : 29, 600, cw - 56, PRT ? 36 : 40, "#fff");
if (o.cta) wrap(o.cta, x + 28, Math.max(yy + 14, y + chh - 62), PRT ? 23 : 25, 600, cw - 56, 33, "rgba(255,255,255,.75)");
ctx.restore();
}
ctx.restore();
}
