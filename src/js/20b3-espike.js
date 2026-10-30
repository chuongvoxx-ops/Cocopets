/* ---------- Spike Bloom, element by element ----------
   The innate Strong attack "Spike Bloom" any pet may roll from its body. It was drawn as flat triangles in the pet's
   colour whatever its element; now each element has its own version (its name, its material and its burst), drawn as a
   faceted 3D spike: a lit face and a shaded face meeting on a bright front edge, an outline, a crack and glow at its
   foot, the element's own detail (stone strata, prism glints, obsidian rim light, frost, a water spout, a twist of air,
   a charged rod) and particles. Fire keeps its own burning spikes. */
const ESPIKE = {
  earth: { name: 'Earthen Spires', desc: 'Faceted stone spires burst from the ground all around you.', lit: '#F0D9A6', mid: '#B48C52', dark: '#5C4426', glow: '#D4A054', glass: false },
  light: { name: 'Prism Thorns', desc: 'Thorns of living crystal burst from the ground all around you, scattering light.', lit: '#FFFFFF', mid: '#FFF4D2', dark: '#E8C878', glow: '#FFF3C2', glass: true },
  dark: { name: 'Obsidian Thorns', desc: 'Black glass thorns burst from the ground all around you, edged with violet light.', lit: '#9C88D6', mid: '#2C2140', dark: '#0E0A16', glow: '#B983F5', glass: false },
  ice: { name: 'Frost Spires', desc: 'Spires of clear ice burst from the ground all around you.', lit: '#FFFFFF', mid: '#BFEFFF', dark: '#4E9CC8', glow: '#9FE0F8', glass: true },
  water: { name: 'Geyser Bloom', desc: 'Spouts of water burst from the ground all around you.', lit: '#E6F8FF', mid: '#4FA8F0', dark: '#1F5FA8', glow: '#8FE3F0', glass: true },
  wind: { name: 'Gale Thorns', desc: 'Twisting thorns of hard air burst from the ground all around you.', lit: '#FFFFFF', mid: '#A8F0D6', dark: '#2E8C78', glow: '#CFF5E6', glass: true },
  thunder: { name: 'Volt Spires', desc: 'Charged spires burst from the ground all around you, crackling.', lit: '#FFFFFF', mid: '#FFD447', dark: '#8A6A10', glow: '#FFF4B0', glass: false },
  fire: { name: 'Flame Spires', desc: 'Burning spires burst from the ground all around you and leave it alight.' },
};
const espikeName = el => (ESPIKE[e8Of(el)] || {}).name || 'Spike Bloom';
const espikeDesc = el => (ESPIKE[e8Of(el)] || {}).desc || 'Giant spikes burst from the ground all around you.';
function espikeRGBA(h, a) { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; }
/* one spike: at (X, Y) on the screen, h tall, w wide at its foot, a (0..1) its life left, ph its own phase, t the time */
function drawESpike(c, X, Y, T, h, w, e8, a, ph, t) {
  const S = ESPIKE[e8]; if (!S || !S.mid) return false;
  const fade = Math.min(1, a * 3), lean = Math.sin(ph * 2.3) * w * 0.25, tipX = X + lean, tipY = Y - h;
  const BL = [X - w / 2, Y], BR = [X + w / 2, Y], F = [X + w * 0.06, Y + w * 0.2], tip = [tipX, tipY];
  c.save(); c.globalAlpha = fade;
  // the ground at its foot: a dark crack and the element's glow
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(X, Y + w * 0.12, w * 0.95, w * 0.32, 0, 0, 6.283); c.fill();
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * fade; blitSized(c, glowSprite(S.glow), X - w * 1.6, Y - w * 0.9, w * 3.2, w * 1.8); c.restore();
  if (e8 === 'water') { c.strokeStyle = espikeRGBA('#FFFFFF', 0.7 * fade); c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.ellipse(X, Y + w * 0.1, w * (0.8 + 0.15 * Math.sin(t * 9 + ph)), w * 0.26, 0, 0, 6.283); c.stroke(); }
  else { c.strokeStyle = 'rgba(20,14,10,.55)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(X - w * 0.9, Y + w * 0.1); c.lineTo(X - w * 0.35, Y + w * 0.2); c.lineTo(X - w * 0.1, Y + w * 0.05); c.moveTo(X + w * 0.2, Y + w * 0.22); c.lineTo(X + w * 0.75, Y + w * 0.08); c.stroke(); }
  const ga = S.glass ? 0.82 : 1;
  if (e8 === 'water') { // a spout: a rounded column of water that wobbles, a foam crown at its top
    const wb = Math.sin(t * 12 + ph) * w * 0.08; c.beginPath(); c.moveTo(X - w * 0.42, Y); c.bezierCurveTo(X - w * 0.5 + wb, Y - h * 0.4, X - w * 0.22 - wb, Y - h * 0.75, tipX - w * 0.12, tipY + w * 0.2); c.quadraticCurveTo(tipX, tipY - w * 0.25, tipX + w * 0.14, tipY + w * 0.2); c.bezierCurveTo(X + w * 0.25 + wb, Y - h * 0.75, X + w * 0.5 - wb, Y - h * 0.4, X + w * 0.42, Y); c.closePath();
    const gr = c.createLinearGradient(X - w / 2, 0, X + w / 2, 0); gr.addColorStop(0, espikeRGBA(S.lit, 0.85)); gr.addColorStop(0.35, espikeRGBA(S.mid, 0.8)); gr.addColorStop(1, espikeRGBA(S.dark, 0.9)); c.fillStyle = gr; c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = Math.max(1, w * 0.1); c.beginPath(); c.moveTo(X - w * 0.22, Y - h * 0.1); c.quadraticCurveTo(X - w * 0.3 + wb, Y - h * 0.5, tipX - w * 0.05, tipY + w * 0.4); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(tipX + (i - 1.5) * w * 0.16, tipY + w * 0.12 - Math.abs(Math.sin(t * 10 + i + ph)) * w * 0.15, w * 0.09, 0, 6.283); c.fill(); }
    c.restore(); return true; }
  // the two faces: lit on the left, shaded on the right, meeting on the bright front edge
  let gL = c.createLinearGradient(BL[0], tipY, F[0], Y); gL.addColorStop(0, espikeRGBA(S.lit, ga)); gL.addColorStop(1, espikeRGBA(S.mid, ga));
  c.beginPath(); c.moveTo(BL[0], BL[1]); c.lineTo(F[0], F[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fillStyle = gL; c.fill();
  let gR = c.createLinearGradient(F[0], tipY, BR[0], Y); if (e8 === 'light') { gR.addColorStop(0, espikeRGBA('#FFD8F0', 0.75)); gR.addColorStop(0.5, espikeRGBA('#D8F4FF', 0.72)); gR.addColorStop(1, espikeRGBA('#9FD8F2', 0.8)); } else { gR.addColorStop(0, espikeRGBA(S.mid, ga)); gR.addColorStop(1, espikeRGBA(S.dark, ga)); }   /* (light: a prism, its shaded face splitting pink to cyan) */
  c.beginPath(); c.moveTo(F[0], F[1]); c.lineTo(BR[0], BR[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fillStyle = gR; c.fill();
  if (e8 === 'wind') { // a twist of hard air: curling streaks wound round the thorn
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, w * 0.07); for (let k = 0; k < 3; k++) { const y0 = Y - h * (0.15 + k * 0.25) - ((t * 1.6 + ph) % 0.25) * h; c.beginPath(); c.ellipse(X + lean * (1 - (Y - y0) / h * -1) * 0.5, y0, w * (0.5 - k * 0.12), w * 0.12, 0, Math.PI * 0.1, Math.PI * 1.2); c.stroke(); } }
  if (e8 === 'earth') { c.strokeStyle = 'rgba(70,48,24,.45)'; c.lineWidth = Math.max(1, w * 0.06); for (let k = 1; k < 4; k++) { const v = k / 4, yy = Y - h * v * 0.85, hw = w * 0.5 * (1 - v); c.beginPath(); c.moveTo(X - hw + lean * v, yy); c.lineTo(X + w * 0.06 * (1 - v) + lean * v, yy + w * 0.1 * (1 - v)); c.lineTo(X + hw + lean * v, yy - w * 0.04); c.stroke(); } }
  // the bright front edge, the outline, a rim of reflected light on the shaded side
  c.strokeStyle = espikeRGBA('#FFFFFF', S.glass ? 0.9 : 0.55); c.lineWidth = Math.max(1, w * 0.08); c.beginPath(); c.moveTo(F[0], F[1] - w * 0.05); c.lineTo(tip[0], tip[1] + w * 0.1); c.stroke();
  c.strokeStyle = GFX.line; c.lineWidth = 1.7; c.lineJoin = 'round'; c.beginPath(); c.moveTo(BL[0], BL[1]); c.lineTo(F[0], F[1]); c.lineTo(BR[0], BR[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.stroke();
  c.strokeStyle = espikeRGBA(e8 === 'dark' ? '#B983F5' : S.glow, e8 === 'dark' ? 0.85 : 0.45); c.lineWidth = Math.max(1, w * 0.06); c.beginPath(); c.moveTo(BR[0] - w * 0.06, BR[1] - w * 0.05); c.lineTo(tip[0] + w * 0.03, tip[1] + w * 0.25); c.stroke();
  c.save(); c.globalCompositeOperation = 'lighter';
  if (S.glass) { c.globalAlpha = 0.35 * fade; blitSized(c, glowSprite(S.glow), X - w * 0.5, Y - h * 0.75, w, h * 0.6); }
  if (e8 === 'light') { // prismatic glints down its edges and a four-pointed star at its tip
    c.globalAlpha = 0.7 * fade; c.lineWidth = Math.max(1, w * 0.05); c.strokeStyle = '#FF9BD2'; c.beginPath(); c.moveTo(BL[0] + w * 0.04, BL[1] - w * 0.05); c.lineTo(tip[0] - w * 0.02, tip[1] + w * 0.2); c.stroke(); c.strokeStyle = '#7FE3F2'; c.beginPath(); c.moveTo(BL[0] + w * 0.1, BL[1] - w * 0.05); c.lineTo(tip[0] + w * 0.01, tip[1] + w * 0.25); c.stroke();
    const s = w * (0.5 + 0.25 * Math.sin(t * 14 + ph)); c.globalAlpha = fade; c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(tipX, tipY - s); c.lineTo(tipX + s * 0.18, tipY - s * 0.18); c.lineTo(tipX + s, tipY); c.lineTo(tipX + s * 0.18, tipY + s * 0.18); c.lineTo(tipX, tipY + s); c.lineTo(tipX - s * 0.18, tipY + s * 0.18); c.lineTo(tipX - s, tipY); c.lineTo(tipX - s * 0.18, tipY - s * 0.18); c.closePath(); c.fill(); blitSized(c, glowSprite('#FFF3C2'), tipX - s * 1.4, tipY - s * 1.4, s * 2.8, s * 2.8); }
  if (e8 === 'thunder') { // arcs crawling down the charged rod, new every few frames
    const seed = Math.floor(t * 18 + ph * 7); c.globalAlpha = 0.9 * fade; c.strokeStyle = '#FFF4B0'; c.lineWidth = Math.max(1, w * 0.07); for (let k = 0; k < 2; k++) { c.beginPath(); let px = tipX, py = tipY + w * 0.2; c.moveTo(px, py); for (let j = 1; j <= 5; j++) { const r = Math.sin(seed * 12.9898 + j * 78.233 + k * 3.1) * 43758.5453, fr = r - Math.floor(r); px = X + lean * (1 - j / 5) + (fr - 0.5) * w * 0.9; py = tipY + (Y - tipY) * j / 5; c.lineTo(px, py); } c.stroke(); } blitSized(c, glowSprite('#FFD447'), tipX - w, tipY - w, w * 2, w * 2); }
  if (e8 === 'ice' || e8 === 'light') { c.globalAlpha = 0.9 * fade; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(X - w * 0.12 + lean * 0.6, Y - h * 0.62, Math.max(1.2, w * 0.07), 0, 6.283); c.fill(); }
  if (e8 === 'dark') { c.globalAlpha = 0.5 * fade; blitSized(c, glowSprite('#B983F5'), tipX - w * 0.8, tipY - w * 0.6, w * 1.6, w * 1.6); }
  c.restore(); c.restore(); return true;
}
/* the burst each spike throws as it breaks the ground */
function espikeBurst(part, e8, x, y, k) {
  const S = ESPIKE[e8]; if (!S || !S.mid) return; const n = (st && st.lowFx) ? 1 : 3, rnd = Math.random;
  for (let i = 0; i < n; i++) { const vx = (rnd() - 0.5) * 3, vy = -1.5 - rnd() * 3;
    if (e8 === 'earth') part({ kind: 'shard', x, y: y - 0.1, vx, vy, g: 12, life: 0.5, max: 0.5, size: 4, rot: rnd() * 6, vr: 9, color: i % 2 ? S.mid : S.lit });
    else if (e8 === 'light') part({ kind: i % 2 ? 'star' : 'spark', x, y: y - 0.3, vx: vx * 0.6, vy: vy * 0.6, g: 1, life: 0.6, max: 0.6, size: i % 2 ? 5 : 2.5, color: i % 2 ? '#FFFFFF' : ['#FF9BD2', '#7FE3F2', '#FFE37A'][i % 3] });
    else if (e8 === 'dark') part({ kind: i % 2 ? 'smoke' : 'spark', x, y: y - 0.2, vx: vx * 0.5, vy: vy * 0.5, g: 0, life: 0.7, max: 0.7, size: i % 2 ? 0.4 : 2.5, color: i % 2 ? 'rgba(60,40,100,' : '#B983F5' });
    else if (e8 === 'ice') part({ kind: i % 2 ? 'snow' : 'shard', x, y: y - 0.2, vx, vy, g: 8, life: 0.55, max: 0.55, size: i % 2 ? 2 : 3.5, rot: rnd() * 6, vr: 8, color: '#E8F8FF' });
    else if (e8 === 'water') part({ kind: i % 2 ? 'bubble' : 'spark', x, y: y - 0.4, vx, vy: vy * 1.3, g: 10, life: 0.6, max: 0.6, size: i % 2 ? 3 : 2.5, color: i % 2 ? '#BFEFFF' : '#FFFFFF' });
    else if (e8 === 'wind') part({ kind: 'wind', x, y: y - 0.3, vx: vx * 2, vy: vy * 0.4, g: 0, life: 0.4, max: 0.4, size: 2, color: '#E8FFF6' });
    else if (e8 === 'thunder') part({ kind: 'spark', x, y: y - 0.3, vx: vx * 2, vy: vy * 1.5, g: 4, life: 0.35, max: 0.35, size: 2.5, color: i % 2 ? '#FFFFFF' : '#FFD447' }); }
}
