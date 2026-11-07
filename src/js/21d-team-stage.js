/* ---------- Team: the live stage. The pet picked in the Team sheet stands large on a stage of its element (a deep
   starry nebula, drifting, with a glowing dais under it), drawn live as the town and the Tower draw it (drawPetFull:
   its magic circle, float and lights, shadow and element glow, the body in parts stepping, swinging its arms, beating
   its wings, breathing). It idles, wanders the dais, emotes, hops; tap it for a boop (a few quick ones tickle it, too
   many annoy it), rub across it to pet it (hearts and a purr), hold it to pick it up and carry it, tap the floor to toss
   it a light to chase. Picking another pet swaps it in with a beam of light. One canvas, kept across the sheet's
   re-renders (moved into each new render), and its loop runs only while the Team sheet is open, the page is visible
   and the stage is on screen ---------- */
const TS_PAL = {
  // sky: top, the glow's middle, the floor; neb: the nebula's three hues; star: the twinkle's tint; fall: how the motes move
  wind: { sky: ['#03130F', '#0B3A31', '#06201B'], neb: ['#8FE8C8', '#2E8C78', '#7FC8F2'], star: '#E8FFF6', mote: 'drift' },
  fire: { sky: ['#120403', '#46130A', '#220805'], neb: ['#FF7A3D', '#C2410C', '#FFC15A'], star: '#FFF1DE', mote: 'ember' },
  ice: { sky: ['#06101C', '#1E4A6E', '#0C2238'], neb: ['#CFF4FF', '#6FB8E0', '#C9B8FF'], star: '#F4FCFF', mote: 'snow' },
  water: { sky: ['#010614', '#06245E', '#03112E'], neb: ['#3E8FE8', '#1B4FA0', '#2FD0C8'], star: '#E2F6FF', mote: 'bubble' },
  thunder: { sky: ['#0A0618', '#2E1A52', '#150C26'], neb: ['#FFD447', '#8A5AE0', '#FFF0A0'], star: '#FFFBE6', mote: 'spark' },
  earth: { sky: ['#0C0702', '#3C2810', '#1C1206'], neb: ['#D49A4A', '#8A5A22', '#9FBF6A'], star: '#FFF4DC', mote: 'rise' },
  dark: { sky: ['#05030E', '#231848', '#0F0A24'], neb: ['#9C88D6', '#3B2F63', '#E06BC8'], star: '#F1ECFF', mote: 'rise' },
  light: { sky: ['#110614', '#4A1E44', '#220F22'], neb: ['#FFB3E0', '#C2508F', '#FFE3A0'], star: '#FFF5FB', mote: 'rise' },
};
const TS_GLYPH = { wind: 'vortex', fire: 'flame', ice: 'snow', water: 'bubbles', thunder: 'bolt', earth: 'gem', dark: 'crescent', light: 'stars' };
const TS = { cv: null, c: null, W: 0, H: 0, dpr: 1, raf: 0, last: 0, t: 0, inView: true, io: null, ro: null, bound: false,
  uid: null, el: 'thunder', p: null, S: null, want: null, sig: '', bg: null, prevBg: null, xf: 0, out: null, A: null, fx: [], orb: null,
  ptr: null, hint: true, sprites: new Map(), bgs: new Map(), ms: [], shoot: null, rm: false, bgCv: null, bgC: null, bdpr: 1 };
/* is the stage's loop running (the town draws itself only now and then under it, 24a) */
const tsBusy = () => !!TS.raf;
const tsRM = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

/* ---------- the backdrop, made once per element and size: a still layer (gradient, glow, dust of stars, a faint
   constellation, the vignette), three nebula clouds (small, drawn large: they are soft), a light shaft, the dais, a
   star and a mote picture. A frame lays these down as a dozen or so copies ---------- */
function tsSeeded(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return mulberry32(h >>> 0); }
function tsCanvas(w, h) { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h)); return cv; }
const tsRGBA = (hex, a) => { const [r, g, b] = hexRGB(hex); return `rgba(${r},${g},${b},${a})`; };
function tsBackdrop(el, W, H, dpr) {
  const key = `${el}|${W}|${H}|${dpr}`;
  if (TS.bgs.has(key)) return TS.bgs.get(key);
  const P = TS_PAL[el] || TS_PAL.thunder, R = tsSeeded('stage:' + el), fy = H * 0.8;
  // the still layer, at full resolution
  // (the backdrop is soft: it is made at 1.5 device pixels per point at most, whatever the phone's density)
  const bd = Math.min(1.5, dpr), base = tsCanvas(W * bd, H * bd), g = base.getContext('2d'); g.scale(bd, bd);
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, P.sky[0]); gr.addColorStop(0.5, P.sky[1]); gr.addColorStop(0.8, mixHex(P.sky[1], P.sky[2], 0.5)); gr.addColorStop(1, P.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // the soft light behind the pet
  gr = g.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.62); gr.addColorStop(0, tsRGBA(P.neb[0], 0.36)); gr.addColorStop(0.45, tsRGBA(P.neb[1], 0.16)); gr.addColorStop(1, tsRGBA(P.neb[1], 0));
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // a dust of faint stars
  for (let i = 0; i < Math.round(W * H / 420); i++) { const x = R() * W, y = R() * H * 0.86, r = 0.25 + R() * R() * 1.1; g.fillStyle = tsRGBA(R() < 0.7 ? '#FFFFFF' : P.neb[0], 0.18 + R() * 0.5); g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
  // a constellation, faint, high on one side
  { const n = 6 + Math.floor(R() * 3), pts = []; let x = W * (0.08 + R() * 0.12), y = H * (0.2 + R() * 0.1);
    for (let i = 0; i < n; i++) { pts.push([x, y]); x += W * (0.06 + R() * 0.1); y += H * (R() - 0.5) * 0.16; y = clamp(y, H * 0.1, H * 0.42); }
    if (R() < 0.5) pts.forEach(p => { p[0] = W - p[0]; });
    g.strokeStyle = tsRGBA(P.star, 0.16); g.lineWidth = 0.8; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    pts.forEach(p => { g.fillStyle = tsRGBA(P.star, 0.55); g.beginPath(); g.arc(p[0], p[1], 1.4, 0, 6.283); g.fill(); g.fillStyle = tsRGBA(P.neb[0], 0.18); g.beginPath(); g.arc(p[0], p[1], 4, 0, 6.283); g.fill(); }); }
  // the floor: a deeper band, then the vignette round the edges
  gr = g.createLinearGradient(0, fy - H * 0.1, 0, H); gr.addColorStop(0, tsRGBA(P.sky[2], 0)); gr.addColorStop(1, tsRGBA(P.sky[2], 0.85)); g.fillStyle = gr; g.fillRect(0, fy - H * 0.1, W, H);
  gr = g.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.35, W / 2, H * 0.48, Math.max(W, H) * 0.78); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // the nebula: three soft clouds, each a few dozen blobs, at a quarter of the size (they are drawn large and soft)
  const q = 0.25 * bd, neb = [0, 1, 2].map(j => {
    const cw = W * 1.3, ch = H * 1.1, cv = tsCanvas(cw * q, ch * q), n = cv.getContext('2d'); n.scale(q, q);
    const cx = cw * (j === 0 ? 0.32 : j === 1 ? 0.7 : 0.5), cy = ch * (j === 0 ? 0.3 : j === 1 ? 0.42 : 0.62), col = P.neb[j], col2 = P.neb[(j + 1) % 3];
    for (let i = 0; i < 26; i++) {
      const a = R() * 6.283, d = Math.pow(R(), 0.7) * cw * 0.34, x = cx + Math.cos(a) * d * 1.3, y = cy + Math.sin(a) * d * 0.55, r = cw * (0.06 + R() * 0.16);
      const b = n.createRadialGradient(x, y, 0, x, y, r), c0 = R() < 0.3 ? col2 : col; b.addColorStop(0, tsRGBA(c0, 0.09 + R() * 0.12)); b.addColorStop(1, tsRGBA(c0, 0));
      n.fillStyle = b; n.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // a few darker lanes cut through, for depth
    n.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 5; i++) { const x = cx + (R() - 0.5) * cw * 0.6, y = cy + (R() - 0.5) * ch * 0.3, r = cw * (0.04 + R() * 0.07), b = n.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, 'rgba(0,0,0,.55)'); b.addColorStop(1, 'rgba(0,0,0,0)'); n.fillStyle = b; n.fillRect(x - r, y - r, r * 2, r * 2); }
    return { cv, w: cw, h: ch, ph: R() * 6.283, sp: 0.05 + R() * 0.04, ax: W * (0.05 + R() * 0.04), ay: H * (0.03 + R() * 0.03) };
  });
  // a light shaft from above, slanting
  const shaft = tsCanvas(W * 0.5 * bd, H * 0.5 * bd); { const s = shaft.getContext('2d'); s.scale(bd * 0.5, bd * 0.5); s.translate(W * 0.5, 0); s.transform(1, 0, -0.18, 1, 0, 0);
    [[-0.16, 0.12, 0.13], [0.02, 0.07, 0.1], [0.14, 0.05, 0.08]].forEach(([dx, w, a]) => { const lg = s.createLinearGradient(0, 0, 0, H * 0.85); lg.addColorStop(0, tsRGBA(mixHex(P.neb[0], '#FFFFFF', 0.6), a)); lg.addColorStop(1, tsRGBA(P.neb[0], 0));
      const hg = s.createLinearGradient(W * (dx - w), 0, W * (dx + w), 0); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, '#000'); hg.addColorStop(1, 'rgba(0,0,0,0)');
      s.fillStyle = lg; s.save(); s.beginPath(); s.rect(W * (dx - w), 0, W * w * 2, H * 0.85); s.clip(); s.fillRect(W * (dx - w), 0, W * w * 2, H * 0.85); s.globalCompositeOperation = 'destination-in'; s.fillStyle = hg; s.fillRect(W * (dx - w), 0, W * w * 2, H * 0.85); s.restore(); }); }
  // the dais: a disc of light ringed with fine lines and ticks, drawn flat (squashed) and turning slowly
  const RD = Math.min(W * 0.42, H * 0.46), dk = Math.min(2, dpr) * 1, dais = tsCanvas(RD * 2 * dk, RD * 2 * dk); { const d = dais.getContext('2d'); d.scale(dk, dk); d.translate(RD, RD);
    let b = d.createRadialGradient(0, 0, 0, 0, 0, RD); b.addColorStop(0, tsRGBA(mixHex(P.neb[0], '#FFFFFF', 0.4), 0.55)); b.addColorStop(0.35, tsRGBA(P.neb[0], 0.26)); b.addColorStop(0.8, tsRGBA(P.neb[1], 0.1)); b.addColorStop(1, tsRGBA(P.neb[1], 0));
    d.fillStyle = b; d.beginPath(); d.arc(0, 0, RD, 0, 6.283); d.fill();
    const ring = (r, a, w, dash) => { d.strokeStyle = tsRGBA(mixHex(P.neb[0], '#FFFFFF', 0.5), a); d.lineWidth = w; d.setLineDash(dash || []); d.beginPath(); d.arc(0, 0, r, 0, 6.283); d.stroke(); d.setLineDash([]); };
    ring(RD * 0.93, 0.55, 2.2); ring(RD * 0.86, 0.3, 1, [2, 5]); ring(RD * 0.62, 0.42, 1.4); ring(RD * 0.55, 0.22, 6, [1, 9]); ring(RD * 0.3, 0.3, 1);
    d.strokeStyle = tsRGBA(P.star, 0.5); d.lineWidth = 1.6;
    for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283, r0 = RD * (i % 4 ? 0.88 : 0.82), r1 = RD * 0.93; d.beginPath(); d.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); d.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); d.stroke(); }
    // four little diamonds at the quarters
    d.fillStyle = tsRGBA(mixHex(P.neb[0], '#FFFFFF', 0.7), 0.85);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, r = RD * 0.62; d.save(); d.translate(Math.cos(a) * r, Math.sin(a) * r); d.rotate(a); d.beginPath(); d.moveTo(0, -6); d.lineTo(3, 0); d.lineTo(0, 6); d.lineTo(-3, 0); d.closePath(); d.fill(); d.restore(); } }
  // a twinkling star (a glowing dot with four thin rays) and a soft mote, in the element's tint
  const star = tsCanvas(32 * dpr, 32 * dpr); { const s = star.getContext('2d'); s.scale(dpr, dpr); s.translate(16, 16); let b = s.createRadialGradient(0, 0, 0, 0, 0, 7); b.addColorStop(0, 'rgba(255,255,255,1)'); b.addColorStop(0.3, tsRGBA(P.star, 0.75)); b.addColorStop(1, tsRGBA(P.neb[0], 0)); s.fillStyle = b; s.fillRect(-8, -8, 16, 16);
    s.globalCompositeOperation = 'lighter'; [[16, 1.1], [10, 0.8]].forEach(([L, w], i) => { s.save(); s.rotate(i * Math.PI / 4); const lg = s.createLinearGradient(-L, 0, L, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, tsRGBA(P.star, i ? 0.4 : 0.9)); lg.addColorStop(1, 'rgba(255,255,255,0)'); s.fillStyle = lg; s.fillRect(-L, -w / 2, L * 2, w); s.fillRect(-w / 2, -L, w, L * 2); s.restore(); }); }
  const mote = glowSprite(mixHex(P.neb[0], '#FFFFFF', 0.25));
  const out = { el, P, base, neb, shaft, dais, RD, star, mote, W, H, bd };
  TS.bgs.set(key, out);
  // (only the last few backdrops are kept: the pets browsed lately)
  while (TS.bgs.size > 3) { const k0 = TS.bgs.keys().next().value, o = TS.bgs.get(k0); TS.bgs.delete(k0); if (o !== TS.bg && o !== TS.prevBg) tsCanvases(o).forEach(cv => { cv.width = cv.height = 0; }); else { TS.bgs.set(k0, o); break; } }
  return out;
}
/* the twinkling stars and the motes, placed afresh for each element */
function tsSky(el) {
  const R = tsSeeded('sky:' + el), W = TS.W, H = TS.H;
  TS.stars = []; for (let i = 0; i < 22; i++) TS.stars.push({ x: R() * W, y: R() * H * 0.72, s: 0.35 + R() * R() * 0.9, ph: R() * 6.283, f: 0.6 + R() * 1.8 });
  TS.ms = []; for (let i = 0; i < 14; i++) TS.ms.push(tsMote(R, true));
}
function tsMote(R, fresh) {
  R = R || Math.random; const W = TS.W, H = TS.H, P = TS_PAL[TS.el] || TS_PAL.thunder, k = P.mote;
  const m = { x: R() * W, y: fresh ? R() * H : (k === 'snow' ? -10 : H * (0.7 + R() * 0.3)), r: 1.5 + R() * 3.5, a: 0.25 + R() * 0.55, ph: R() * 6.283, life: 0, max: 5 + R() * 6 };
  if (k === 'snow') { m.vx = (R() - 0.5) * 8; m.vy = 8 + R() * 14; }
  else if (k === 'drift') { m.vx = 14 + R() * 22; m.vy = -3 - R() * 6; if (!fresh) { m.x = -10; m.y = R() * H * 0.9; } }
  else if (k === 'ember') { m.vx = (R() - 0.5) * 10; m.vy = -(18 + R() * 26); }
  else if (k === 'bubble') { m.vx = (R() - 0.5) * 4; m.vy = -(10 + R() * 14); m.r += 1; }
  else if (k === 'spark') { m.vx = (R() - 0.5) * 6; m.vy = -(4 + R() * 8); }
  else { m.vx = (R() - 0.5) * 6; m.vy = -(6 + R() * 12); }
  return m;
}
const tsCanvases = o => [o.base, o.shaft, o.dais, o.star].concat(o.neb.map(n => n.cv), o.sky || []);
/* the backdrop is a canvas of its own under the pet's (the page lays one over the other): the still layer, the drifting
   clouds and the shaft are laid together into a spare picture a layer a frame, a few times a second (the clouds move a
   fraction of a pixel in that time), and only then copied onto it. So most frames the backdrop costs nothing; while one
   element melts into the next (0.7 s) it is drawn every frame */
function tsBgFrame(t) {
  const B = TS.bg, g = TS.bgC; if (!B || !g) return;
  const bd = B.bd, W = B.W, H = B.H, done = () => B.sky[B.front];
  if (!B.sky) { B.sky = [tsCanvas(W * bd, H * bd), tsCanvas(W * bd, H * bd)]; B.front = 0; B.step = -1; B.at = t;
    const g0 = B.sky[0].getContext('2d'); g0.setTransform(bd, 0, 0, bd, 0, 0); tsDrawBackdrop(g0, B, t, 1); B.shown = false; }
  let fresh = false;
  if (B.step < 0 && t - B.at >= (TS.rm ? 2 : 0.25)) { B.step = 0; B.tc = t; }
  if (B.step >= 0) {
    const back = B.sky[1 - B.front], g2 = back.getContext('2d'); g2.setTransform(bd, 0, 0, bd, 0, 0);
    if (B.step === 0) { g2.globalCompositeOperation = 'copy'; g2.globalAlpha = 1; g2.drawImage(B.base, 0, 0, W, H); g2.globalCompositeOperation = 'source-over'; }
    else tsDrawBackdrop(g2, B, B.tc, 1, B.step);
    if (++B.step > 3) { B.front = 1 - B.front; B.step = -1; B.at = t; fresh = true; }
  }
  const PB = TS.prevBg && TS.xf > 0 && TS.prevBg.sky ? TS.prevBg : null;
  if (!fresh && B.shown && !PB && !B.mixed) return;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'copy'; g.globalAlpha = 1; g.drawImage(done(), 0, 0, g.canvas.width, g.canvas.height);
  g.globalCompositeOperation = 'source-over';
  if (PB) { g.globalAlpha = TS.xf * TS.xf * (3 - 2 * TS.xf); g.drawImage(PB.sky[PB.front], 0, 0, g.canvas.width, g.canvas.height); g.globalAlpha = 1; }
  B.shown = true; B.mixed = !!PB;
}
function tsDrawBackdrop(c, B, t, a, only) {
  if (only) { const W = TS.W, H = TS.H, rm = TS.rm ? 0.25 : 1, n = B.neb[only - 1]; c.globalCompositeOperation = 'lighter';
    if (n) { const x = (W - n.w) / 2 + Math.sin(t * n.sp * rm + n.ph) * n.ax, y = (H - n.h) / 2 + Math.cos(t * n.sp * 0.8 * rm + n.ph) * n.ay; c.globalAlpha = a * (0.85 + 0.15 * Math.sin(t * 0.3 + n.ph)); c.drawImage(n.cv, x, y, n.w, n.h); }
    if (only === 3) { c.globalAlpha = a * (0.55 + 0.25 * Math.sin(t * 0.4)); c.drawImage(B.shaft, 0, -H * 0.02, W, H); }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; return; }
  const W = TS.W, H = TS.H, rm = TS.rm ? 0.25 : 1;
  c.globalAlpha = a; c.drawImage(B.base, 0, 0, W, H);
  c.globalCompositeOperation = 'lighter';
  for (const n of B.neb) { const x = (W - n.w) / 2 + Math.sin(t * n.sp * rm + n.ph) * n.ax, y = (H - n.h) / 2 + Math.cos(t * n.sp * 0.8 * rm + n.ph) * n.ay; c.globalAlpha = a * (0.85 + 0.15 * Math.sin(t * 0.3 + n.ph)); c.drawImage(n.cv, x, y, n.w, n.h); }
  c.globalAlpha = a * (0.55 + 0.25 * Math.sin(t * 0.4)); c.drawImage(B.shaft, 0, -H * 0.02, W, H);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}

/* ---------- the pet's pictures: made once per pet and stage (the town's and the Tower's own: loadSprites, loadRig) ---------- */
function tsKey(p) { return `${p.uid}|${p.stage}|${p.rarity}`; }
function tsSpritesFor(p) {
  const key = tsKey(p);
  if (TS.sprites.has(key)) return TS.sprites.get(key);
  TS.sprites.set(key, null);
  try {
    loadSprites(formOf(p)).then(S => { S.rig = null; TS.sprites.set(key, S); loadRig(S.form).then(r => { S.rig = r; }, () => {}); }, () => {});
  } catch (e) {}
  while (TS.sprites.size > 10) TS.sprites.delete(TS.sprites.keys().next().value);
  return null;
}

/* ---------- mounting it in the Team sheet (every render: the canvas is kept and moved into the new one) ---------- */
function teamStageHTML(P, L) {
  const el = petElement(P), E = E8[el], pal = TS_PAL[el] || TS_PAL.thunder;
  return `<div class="tm-stage" data-tstage style="--tb0:${pal.sky[0]};--tb1:${pal.sky[1]};--ec:${E.color}">
    <div class="tms-id dp-id"><b>${esc(P.name)} ${starsHTML(starsOf(P.rarity))}</b><span>Level ${L} · ${STAGES[P.stage].name}</span></div>
    <span class="tms-el" style="--ec:${E.color};--ed:${E.dark}" title="${E.name}"><i>${glyphSVG(TS_GLYPH[el] || 'orb')}</i>${E.name}</span>
    <span class="tms-hint"${TS.hint ? '' : ' hidden'}>Tap, rub or hold it · tap the floor to play</span>
  </div>`;
}
function teamStageMount(P) {
  const host = $('[data-tstage]', sheetEl); if (!host || !P) return;
  if (!TS.cv) {
    TS.cv = document.createElement('canvas'); TS.cv.className = 'tms-cv'; TS.cv.setAttribute('aria-label', 'Your pet, live: tap, rub or hold it to play');
    TS.cv.setAttribute('role', 'img'); TS.c = TS.cv.getContext('2d');
    TS.bgCv = document.createElement('canvas'); TS.bgCv.className = 'tms-bg'; TS.bgCv.setAttribute('aria-hidden', 'true'); TS.bgC = TS.bgCv.getContext('2d', { alpha: false });
    tsBind();
  }
  host.insertBefore(TS.cv, host.firstChild); host.insertBefore(TS.bgCv, TS.cv);
  TS.rm = tsRM();
  tsResize();
  const el = petElement(P), sig = `${P.dlv || 1}|${P.dxp || 0}|${P.xp || 0}|${P.stage}`;
  if (P.uid !== TS.uid) tsSwap(P, el);
  else { TS.p = P; if (sig !== TS.sig && TS.A && TS.S) tsCheer(); if (TS.want && tsKey(P) !== TS.want) tsSwap(P, el, true); }
  TS.sig = sig;
  tsKick();
}
/* a new pet on the stage: the old one goes up in light, the backdrop melts into the new element's, the new one comes
   down a beam of light onto the dais */
function tsSwap(P, el, same) {
  if (TS.A && TS.S && !same) TS.out = { S: TS.S, A: TS.A, form: TS.form, el: TS.el, h: TS.h, t: 0 };
  if (TS.bg && TS.el !== el && TS.W) { TS.prevBg = TS.bg; TS.xf = 1; }
  TS.uid = P.uid; TS.p = P; TS.el = el; TS.want = tsKey(P); TS.S = null; TS.A = null; TS.orb = null;
  if (TS.W) { TS.bg = tsBackdrop(el, TS.W, TS.H, TS.dpr); TS.bg.shown = false; tsSky(el); }
  TS.first = !TS.out && !TS.prevBg;
}
function tsResize() {
  const cv = TS.cv; if (!cv || !cv.isConnected) return;
  const W = Math.round(cv.parentNode.clientWidth || 0); if (W < 50) return;
  const H = Math.round(clamp(W * 1.02, 260, 440)), dpr = Math.min(2, window.devicePixelRatio || 1);
  if (W === TS.W && H === TS.H && dpr === TS.dpr && cv.width === Math.round(W * dpr)) return;
  TS.W = W; TS.H = H; TS.dpr = dpr; TS.bdpr = Math.min(1.5, dpr);
  cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  TS.bgCv.style.height = H + 'px'; TS.bgCv.width = Math.round(W * TS.bdpr); TS.bgCv.height = Math.round(H * TS.bdpr);
  if (TS.uid) { TS.bg = tsBackdrop(TS.el, W, H, dpr); TS.bg.shown = false; TS.prevBg = null; TS.xf = 0; tsSky(TS.el); if (TS.A) tsFit(); }
}
function tsBind() {
  if (TS.bound) return; TS.bound = true;
  const cv = TS.cv;
  if (typeof IntersectionObserver === 'function') { TS.io = new IntersectionObserver(es => { for (const e of es) TS.inView = e.isIntersecting; tsKick(); }); TS.io.observe(cv); }
  if (typeof ResizeObserver === 'function') { TS.ro = new ResizeObserver(() => { if (TS.cv.isConnected) { const w = Math.round(TS.cv.parentNode.clientWidth); if (w !== TS.W) { tsResize(); tsKick(); } } }); TS.ro.observe(cv); }
  else window.addEventListener('resize', () => { tsResize(); tsKick(); });
  document.addEventListener('visibilitychange', tsKick);
  const at = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => {
    if (e.button > 0 || !TS.A) return;
    const [x, y] = at(e), on = tsHit(x, y);
    TS.ptr = { id: e.pointerId, x0: x, y0: y, x, y, t0: performance.now(), on, moved: 0, held: false, rubbed: 0 };
    if (on) { TS.ptr.timer = setTimeout(() => { const q = TS.ptr; if (q && q.id === e.pointerId && q.moved < 10) tsPickUp(q); }, 420); try { cv.setPointerCapture(e.pointerId); } catch (er) {} }
  });
  cv.addEventListener('pointermove', e => {
    const q = TS.ptr; if (!q || q.id !== e.pointerId || !TS.A) return;
    const [x, y] = at(e), d = Math.hypot(x - q.x, y - q.y); q.moved += d; q.x = x; q.y = y;
    if (q.held) return;
    if (q.on && q.moved > 10 && tsHit(x, y, 1.25)) { tsRub(d); q.rubbed += d; }
  });
  const up = (e, cancel) => {
    const q = TS.ptr; if (!q || q.id !== e.pointerId) return; clearTimeout(q.timer); TS.ptr = null;
    if (!TS.A) return;
    if (q.held) { tsDrop(); return; }
    if (cancel) return;
    if (q.moved < 12 && performance.now() - q.t0 < 420) { tsSeen(); if (q.on) tsBoop(); else tsToss(q.x, q.y); }
  };
  cv.addEventListener('pointerup', e => up(e, false)); cv.addEventListener('pointercancel', e => up(e, true));
  cv.addEventListener('contextmenu', e => e.preventDefault());
}
function tsSeen() { if (!TS.hint) return; TS.hint = false; const h = TS.cv && TS.cv.parentNode && $('.tms-hint', TS.cv.parentNode); if (h) h.classList.add('gone'); }

/* ---------- the loop: only while the Team sheet is open and the stage is visible ---------- */
const tsWanted = () => !!(TS.cv && TS.cv.isConnected && sheetKind === 'team' && !sheetWrap.hidden && !document.hidden && TS.inView && TS.W);
function tsKick() { if (!TS.raf && tsWanted()) { TS.last = performance.now(); TS.raf = requestAnimationFrame(tsFrame); } }
function tsSleep() {
  if (TS.raf) cancelAnimationFrame(TS.raf); TS.raf = 0;
  if (TS.ptr) { clearTimeout(TS.ptr.timer); TS.ptr = null; if (TS.A && TS.A.held) tsDrop(); }
  // (the sheet closed: its picture's memory goes back; reopening sizes it again)
  // (and the next opening starts afresh: the pet steps onto the dais again)
  if (TS.cv && (!TS.cv.isConnected || sheetKind !== 'team' || sheetWrap.hidden)) { if (TS.cv.width) { TS.cv.width = TS.cv.height = 0; TS.bgCv.width = TS.bgCv.height = 0; TS.W = 0; } TS.uid = null; TS.A = null; TS.S = null; TS.out = null; TS.prevBg = null; TS.xf = 0; TS.orb = null; TS.fx.length = 0;
    TS.bgs.forEach(o => tsCanvases(o).forEach(cv => { cv.width = cv.height = 0; })); TS.bgs.clear(); TS.bg = null;
    while (TS.sprites.size > 4) TS.sprites.delete(TS.sprites.keys().next().value); }
}
TS.perfLog = []; TS.parts = [];
function tsFrame(now) {
  TS.raf = 0;
  if (!tsWanted()) { tsSleep(); return; }
  // (real time: a slow frame does not slow the pet, its wings or the sky; the pet's moves are stepped at 30 a second at
  // least, so a long frame cannot throw it through the floor)
  const dt = Math.min(0.25, Math.max(0, (now - TS.last) / 1000)); TS.last = now;
  const t0 = performance.now();
  try { const n = Math.max(1, Math.ceil(dt / (1 / 30))); for (let i = 0; i < n; i++) { TS.t += dt / n; tsUpdate(dt / n); } const t1 = performance.now(); tsBgFrame(TS.t); const t2 = performance.now(); tsDraw(dt); const t3 = performance.now();
    TS.parts.push([t1 - t0, t2 - t1, t3 - t2]); if (TS.parts.length > 240) TS.parts.shift(); } catch (e) { console.error(e); if (globalThis.__errbox) __errbox('The Team stage failed: ' + (e && e.message)); return; }
  const ms = performance.now() - t0; TS.perfLog.push(ms); if (TS.perfLog.length > 240) TS.perfLog.shift();
  TS.raf = requestAnimationFrame(tsFrame);
}

/* ---------- the pet: what it does ---------- */
function tsFit() {
  const S = TS.S, A = TS.A, W = TS.W, H = TS.H; if (!S || !A) return;
  const fy = H * 0.8, top = 70, E = tsExtent(S), wingUp = S.rig && S.rig.legW && S.rig.legW.length ? 0.1 : 0, flt = TS.form && TS.form.x && TS.form.x.gold && TS.form.stage >= 7 && TS.form.x.leg ? 0.3 : 0;
  // the body's height h (feet to the top of the body); the whole pet (its parts as they really paint, the wings at the
  // top of their beat, a Celestial's float) must fit between the name and the floor, and in the middle of the width
  const upU = E.up / S.bodyTop + wingUp + flt + 0.04, wU = E.hw * 2 / S.bodyTop;
  let h = Math.min((fy - top - 34) / upU, W * (wingUp ? 0.86 : 0.66) / wU, H * 0.42);
  h = Math.max(60, h);
  TS.h = h; TS.fy = fy;
  A.range = Math.max(0, Math.min(W * 0.24, W / 2 - wU * h / 2 - 6));
  A.x = clamp(A.x, -A.range, A.range);
}
/* how far the pet reaches above its feet and to either side, in its picture's units: from its parts when made (each
   cut to what it paints; the far side's arm, foot and wings are these mirrored), else from the whole picture */
function tsExtent(S) {
  const R = S.rig;
  if (R && R.front && R.front.normal) {
    let up = 0, hw = 0;
    const add = p => { if (!p || !p.vb) return; const [x, y, w] = p.vb; up = Math.max(up, -y); hw = Math.max(hw, Math.abs(x), Math.abs(x + w)); };
    [R.back, R.front.normal, R.foot, R.arm, R.wing].forEach(add); (R.legW || []).forEach(add);
    if (up > 0 && hw > 0) return { up, hw };
  }
  const vb = S.normal && S.normal.vb ? S.normal.vb : [-60, -S.bodyTop - 10, 120, S.bodyTop + 14];
  return { up: -vb[1], hw: vb[2] / 2 };
}
function tsNewActor() {
  return { x: 0, face: Math.random() < 0.5 ? 1 : -1, z: 0, zv: 0, sq: 0, walk: 0, wph: 0, mv: false, goal: null, run: false, think: 1.2, mode: 'idle', mT: 0, emote: null,
    blinkT: rand(1.5, 4), rot: 0, sx: 1, sy: 1, faceX: null, faceT: 0, boops: [], rubAcc: 0, lastRub: -9, held: false, range: 0, enter: 0 };
}
function tsSetFace(f, d) { const A = TS.A; A.faceX = f; A.faceT = d; }
function tsJump(k) { const A = TS.A; if (A.z > 1 && A.zv > 0) return; A.zv = Math.sqrt(2 * tsG() * TS.h * k); }
const tsG = () => TS.h * 16;
function tsEmote(kind) { TS.A.emote = { kind, t: 1.6 }; }
function tsMode(m) { TS.A.mode = m; TS.A.mT = 0; }
function tsUpdate(dt) {
  const t = TS.t;
  // the backdrop's crossfade and the pet that left
  if (TS.xf > 0) { TS.xf = Math.max(0, TS.xf - dt / 0.7); if (!TS.xf) TS.prevBg = null; }
  if (TS.out) { TS.out.t += dt; if (TS.out.t > 0.45) TS.out = null; }
  // the pictures arrive: the pet steps in
  if (!TS.S && TS.p) {
    const S = tsSpritesFor(TS.p);
    // (it waits a moment for its parts, so it is sized by what it really paints; then comes in whole if they are late)
    if (S && !S.rig) TS.waitT = (TS.waitT || 0) + dt;
    if (S && !TS.out && (S.rig || TS.waitT > 1.5)) {
      TS.waitT = 0;
      TS.S = S; TS.form = S.form; TS.A = tsNewActor(); tsFit();
      const A = TS.A; A.lev = !!(S.form && S.form.x && S.form.x.gold && S.form.stage >= 7 && S.form.x.leg); A.z = TS.first ? TS.h * 0.25 : TS.h * 1.7; A.enter = 1; A.zv = 0; TS.beam = TS.first ? 0 : 1;
      if (!TS.first) sfx.sparkle && sfx.sparkle();
    }
  }
  if (TS.beam > 0) TS.beam = Math.max(0, TS.beam - dt / 0.9);
  for (let i = TS.fx.length - 1; i >= 0; i--) { const f = TS.fx[i]; f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt; if (f.kind === 'heart') f.x += Math.sin(f.life * 9) * 10 * dt; if (f.life <= 0) TS.fx.splice(i, 1); }
  // the motes and the odd shooting star
  for (let i = 0; i < TS.ms.length; i++) { const m = TS.ms[i]; m.life += dt; m.x += (m.vx + Math.sin(t * 0.8 + m.ph) * 4) * dt; m.y += m.vy * dt; if (m.life > m.max || m.y < -10 || m.y > TS.H + 10 || m.x > TS.W + 10 || m.x < -10) TS.ms[i] = tsMote(); }
  if (!TS.rm) { if (TS.shoot) { TS.shoot.u += dt / 0.8; if (TS.shoot.u >= 1) TS.shoot = null; } else if (Math.random() < dt / 7) TS.shoot = { x: rand(0.2, 0.95) * TS.W, y: rand(0.04, 0.3) * TS.H, a: Math.PI * rand(0.8, 0.9), L: TS.W * rand(0.25, 0.4), u: 0 }; }
  const A = TS.A; if (!A) return;
  A.mT += dt; A.faceT -= dt; A.wph += dt * (A.z > 6 ? 17 : A.mv ? 9 : A.lev ? 4 : 3.2);   // (the house's beat: in the air, walking, a Celestial floating, at rest)
  A.blinkT -= dt; if (A.blinkT <= -0.13) A.blinkT = Math.random() < 0.18 ? 0.25 : rand(2.2, 5.5);
  if (A.emote) { A.emote.t -= dt; if (A.emote.t <= 0) A.emote = null; }
  A.boops = A.boops.filter(b => t - b < 2.2);
  // held up: it hangs from the finger, feet paddling
  if (A.held) {
    const q = TS.ptr, tx = q ? clamp(q.x - TS.W / 2 - A.hx, -A.range, A.range) : A.x, k = 1 - Math.exp(-dt * 14);
    A.x += (tx - A.x) * k; A.z += (TS.h * 0.32 - A.z) * k; A.zv = 0; A.mv = true; A.walk += dt * 10;
    if (Math.abs(tx - A.x) > 2) A.face = tx > A.x ? 1 : -1;
    A.rot = clamp((tx - A.x) * -0.004, -0.25, 0.25);
    if (A.mT > 0.5) tsSetFace('happy', 0.1);
    return;
  }
  // a jump and its landing
  if (A.z > 0 || A.zv > 0) { A.zv -= tsG() * dt; A.z += A.zv * dt; if (A.z <= 0) { const hard = A.zv < -TS.h * 3; A.z = 0; if (A.zv < -TS.h * 1.2) A.sq = clamp(-A.zv / (TS.h * 18), 0.08, 0.32); A.zv = 0; if (A.enter) tsLanded(); else if (hard) tsDust(); } }
  A.sq *= Math.exp(-dt * 9);
  A.mv = false; A.rot *= Math.exp(-dt * 8); A.sx = 1; A.sy = 1;
  if (A.enter) return;
  switch (A.mode) {
    case 'idle': {
      A.think -= dt;
      if (TS.orb && TS.orb.y >= TS.fy - 1) { A.goal = TS.orb.x; A.run = true; tsMode('chase'); break; }
      if (A.think > 0) break;
      A.think = rand(2.4, 5.2);
      const r = Math.random(), joy = TS.p ? TS.p.joy || 60 : 60;
      if (r < 0.36) { A.goal = clamp(A.x + rand(-1, 1) * A.range * 1.4, -A.range, A.range); A.run = false; if (Math.abs(A.goal - A.x) > 10) tsMode('walk'); }
      else if (r < 0.52) { tsEmote(pick(['heart', 'note', 'star', 'heart', 'bang'])); tsJump(0.12); sfx.chirp(); }
      else if (r < 0.62) { A.face0 = A.face; tsMode('look'); }
      else if (r < 0.7) { tsJump(0.2); tsEmote('note'); }
      else if (r < 0.77 && joy > 45) { tsMode('spin'); sfx.giggle(); }
      else if (r < 0.88) { tsMode('sit'); A.dur = rand(2.2, 3.6); }
      else { tsMode('stretch'); }
      break;
    }
    case 'walk': case 'chase': {
      if (A.mode === 'chase') { if (!TS.orb) { tsMode('idle'); break; } A.goal = TS.orb.x; }
      const dx = A.goal - A.x, d = Math.abs(dx), sp = TS.h * (A.run ? 2.2 : 1.05) * clamp(d / (TS.h * 0.25), 0.35, 1);
      if (d < 4) {
        if (A.mode === 'chase' && TS.orb) tsCatch();
        else { tsMode('idle'); A.think = rand(1.2, 3); if (Math.random() < 0.3) tsJump(0.12); }
        break;
      }
      A.x += Math.sign(dx) * Math.min(d, sp * dt); A.face = dx > 0 ? 1 : -1; A.mv = true; A.walk += dt * (sp / TS.h) * 7.5;
      break;
    }
    case 'look': { A.face = Math.floor(A.mT / 0.7) % 2 ? -A.face0 : A.face0; A.rot = Math.sin(A.mT * 2) * 0.05; if (A.mT > 2.1) tsMode('idle'); break; }
    case 'spin': { A.face = Math.floor(A.mT / 0.14) % 2 ? 1 : -1; A.x = clamp(A.x + Math.sin(A.mT * 9) * 30 * dt, -A.range, A.range); tsSetFace('happy', 0.1); if (A.mT > 1.4) { tsMode('dizzy'); } break; }
    case 'dizzy': { A.rot = Math.sin(A.mT * 6) * 0.14; tsSetFace('hurt', 0.1); if (A.mT > 1) { A.rot = 0; tsMode('idle'); A.think = rand(1.5, 3); } break; }
    case 'sit': { A.sy = 0.88; A.sx = 1.05; if (A.mT > 0.4 && A.mT < A.dur - 0.3) tsSetFace('blink', 0.1); if (A.mT > A.dur) { tsMode('idle'); A.think = rand(1, 2.5); } break; }
    case 'stretch': { const u = Math.sin(Math.min(1, A.mT / 1.1) * Math.PI); A.sy = 1 + u * 0.1; A.sx = 1 - u * 0.05; tsSetFace(A.mT < 0.8 ? 'blink' : 'happy', 0.1); if (A.mT > 1.3) { tsMode('idle'); A.think = rand(1.5, 3); } break; }
    case 'petted': { tsSetFace('happy', 0.1); A.rot = Math.sin(t * 5) * 0.03; if (t - A.lastRub > 0.6) { tsMode('idle'); A.think = rand(1.5, 3); } break; }
    case 'tickle': { A.rot = Math.sin(A.mT * 30) * 0.1; tsSetFace('happy', 0.1); if (A.mT > 1) { A.rot = 0; tsMode('idle'); A.think = rand(1, 2); } break; }
    case 'annoyed': { A.rot = Math.sin(A.mT * 40) * 0.035; tsSetFace('hurt', 0.1); if (A.mT > 1.3) { A.rot = 0; A.goal = clamp(A.x + (A.x < 0 ? 1 : -1) * A.range * 1.6, -A.range, A.range); A.run = true; tsMode('walk'); } break; }
    case 'happy': { tsSetFace('happy', 0.1); if (A.mT > (A.dur || 0.8)) { tsMode('idle'); A.think = rand(1, 2.5); } break; }
  }
  // the orb: falls, bounces, waits
  const O = TS.orb;
  if (O) { O.t += dt; if (O.y < TS.fy) { O.vy += TS.h * 14 * dt; O.y += O.vy * dt; if (O.y >= TS.fy) { O.y = TS.fy; O.vy = -O.vy * 0.45; if (Math.abs(O.vy) > TS.h * 0.6) O.y = TS.fy - 0.01; else O.vy = 0; } } if (O.t > 9) TS.orb = null; }
}
/* what the touches do (the house's reactions: a boop hops it, a few quick ones tickle it, a flurry annoys it; a rub is
   petting, with hearts and a purr; held, it is picked up) */
function tsBoop() {
  const A = TS.A, P = TS.p, t = TS.t; if (!A || A.enter) return;
  A.boops.push(t); const n = A.boops.length;
  if (n >= 9) { A.boops = []; tsMode('annoyed'); tsEmote('bang'); sfx.grumble(); tsPuffs(); if (P) P.joy = Math.max(0, (P.joy || 0) - 4); saveSoon(); return; }
  if (n >= 4) { tsMode('tickle'); sfx.giggle(); buzz([6, 40, 6]); tsHearts(2); if (P) P.joy = Math.min(100, (P.joy || 0) + 2.5); saveSoon(); return; }
  if (A.mode !== 'idle' && A.mode !== 'happy') tsMode('idle');
  tsJump(0.22); tsSetFace('happy', 0.6); tsEmote(Math.random() < 0.6 ? 'heart' : 'note'); sfx.boop(); buzz(8); tsHearts(1);
  A.think = rand(2, 4);
  if (P) { P.joy = Math.min(100, (P.joy || 0) + 1.2); saveSoon(); }
}
function tsRub(d) {
  const A = TS.A, P = TS.p; if (!A || A.enter) return;
  tsSeen(); A.lastRub = TS.t;
  if (A.mode !== 'petted') { tsMode('petted'); A.goal = null; }
  A.rubAcc += d;
  if (P) P.joy = Math.min(100, (P.joy || 0) + d * 0.022);
  if (A.rubAcc >= 65) {
    A.rubAcc = 0; tsHearts(1); buzz(5);
    if (P) P.pats = (P.pats || 0) + 1;
    if (TS.t - (A.purrT || -9) > 0.9) { A.purrT = TS.t; sfx.purr(); }
    if (!A.emote || A.emote.t < 0.6) tsEmote('heart');
    saveSoon();
  }
}
function tsPickUp(q) {
  const A = TS.A; if (!A || A.enter) return;
  tsSeen(); q.held = true; A.held = true; A.hx = q.x - TS.W / 2 - A.x; tsMode('held'); A.goal = null; sfx.squeak(); buzz(10); tsSetFace('hurt', 0.35);
}
function tsDrop() {
  const A = TS.A; if (!A) return; A.held = false; A.rot = 0; A.x = clamp(A.x, -A.range, A.range); A.zv = 0;
  tsMode('happy'); A.dur = 1; tsEmote('heart'); if (TS.p) { TS.p.joy = Math.min(100, (TS.p.joy || 0) + 1); saveSoon(); }
}
function tsToss(x, y) {
  const A = TS.A; if (!A || A.enter) return;
  const ox = clamp(x - TS.W / 2, -A.range, A.range);
  TS.orb = { x: ox, y: Math.min(y, TS.fy - TS.h * 0.2), vy: 0, t: 0 };
  for (let i = 0; i < 6; i++) TS.fx.push({ kind: 'spark', x: TS.W / 2 + ox, y: TS.orb.y, vx: rand(-40, 40), vy: rand(-50, 10), life: 0.6, max: 0.6, s: rand(0.6, 1.1) });
  sfx.chirp(); tsEmote('bang'); A.face = ox > A.x ? 1 : -1; A.goal = ox; A.run = true; tsMode('chase');
}
function tsCatch() {
  const A = TS.A, O = TS.orb; TS.orb = null;
  tsJump(0.32); tsMode('happy'); A.dur = 1.1; tsEmote('star'); sfx.yum ? sfx.yum() : sfx.chirp();
  const X = TS.W / 2 + O.x, Y = TS.fy - TS.h * 0.3;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; TS.fx.push({ kind: 'spark', x: X, y: Y, vx: Math.cos(a) * rand(50, 90), vy: Math.sin(a) * rand(50, 90) - 30, life: 0.7, max: 0.7, s: rand(0.7, 1.2) }); }
  if (TS.p) { TS.p.joy = Math.min(100, (TS.p.joy || 0) + 1.5); saveSoon(); }
}
/* fed or levelled from the sheet: it cheers */
function tsCheer() { const A = TS.A; if (!A || A.enter) return; tsJump(0.3); tsMode('happy'); A.dur = 1.2; tsEmote('heart'); tsHearts(3); }
function tsLanded() {
  const A = TS.A; A.enter = 0; tsMode('happy'); A.dur = 1; A.think = 1.5;
  TS.ring = 1; if (!TS.first) { tsEmote(pick(['heart', 'star', 'note'])); tsHearts(2); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; TS.fx.push({ kind: 'spark', x: TS.W / 2 + A.x + Math.cos(a) * TS.h * 0.3, y: TS.fy, vx: Math.cos(a) * rand(40, 80), vy: Math.sin(a) * rand(10, 25) - rand(30, 70), life: 0.8, max: 0.8, s: rand(0.6, 1.2) }); }
  TS.first = false;
}
function tsHearts(n) { const A = TS.A, X = TS.W / 2 + A.x, Y = TS.fy - A.z - TS.h * 0.9; for (let i = 0; i < n; i++) TS.fx.push({ kind: 'heart', x: X + rand(-TS.h * 0.25, TS.h * 0.25), y: Y + rand(-6, 6), vx: rand(-10, 10), vy: -rand(30, 50), life: 1.3, max: 1.3, s: rand(0.8, 1.25) * TS.h / 110 }); }
function tsPuffs() { const A = TS.A, X = TS.W / 2 + A.x, Y = TS.fy - TS.h * 0.95; [-1, 1].forEach(s => TS.fx.push({ kind: 'puff', x: X + s * TS.h * 0.35, y: Y, vx: s * 18, vy: -14, life: 0.8, max: 0.8, s: TS.h / 110 })); }
function tsDust() { const A = TS.A; [-1, 1].forEach(s => TS.fx.push({ kind: 'puff', x: TS.W / 2 + A.x + s * TS.h * 0.3, y: TS.fy, vx: s * 30, vy: -6, life: 0.45, max: 0.45, s: TS.h / 160 })); }
function tsHit(x, y, grow) {
  const A = TS.A; if (!A || !TS.h) return false; const g = grow || 1;
  const fl = petFloatOf(TS.form, TS.h / 1.02, TS.t), cx = TS.W / 2 + A.x, cy = TS.fy - A.z - fl - TS.h * 0.5, rx = Math.max(34, TS.h * 0.5) * g, ry = Math.max(40, TS.h * 0.62) * g;
  const dx = (x - cx) / rx, dy = (y - cy) / ry; return dx * dx + dy * dy <= 1;
}

/* ---------- drawing a frame ---------- */
function tsDraw() {
  const c = TS.c, W = TS.W, H = TS.H, t = TS.t, dpr = TS.dpr, B = TS.bg;
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'medium';
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.clearRect(0, 0, W, H);
  if (!B) return;
  // the twinkling stars
  c.globalCompositeOperation = 'lighter';
  for (const s of TS.stars) { const tw = 0.5 + 0.5 * Math.sin(t * s.f + s.ph), a = 0.15 + 0.85 * tw * tw, z = 14 * s.s * (0.7 + 0.3 * tw); c.globalAlpha = a; c.drawImage(B.star, s.x - z, s.y - z, z * 2, z * 2); }
  if (TS.shoot) { const S2 = TS.shoot, u = S2.u, hx = S2.x + Math.cos(S2.a) * S2.L * u, hy = S2.y + Math.sin(S2.a) * S2.L * u * -0.5, tx = hx - Math.cos(S2.a) * S2.L * 0.35, ty = hy + Math.sin(S2.a) * S2.L * 0.35 * 0.5;
    const lg = c.createLinearGradient(hx, hy, tx, ty); lg.addColorStop(0, tsRGBA(B.P.star, 0.9 * Math.sin(u * Math.PI))); lg.addColorStop(1, tsRGBA(B.P.star, 0)); c.globalAlpha = 1; c.strokeStyle = lg; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx, hy); c.lineTo(tx, ty); c.stroke(); }
  // the motes (snow, embers, bubbles, sparks: each element its own drift)
  for (const m of TS.ms) { const f = Math.min(1, m.life / 0.8, (m.max - m.life) / 1.2), a = m.a * Math.max(0, f) * (B.P.mote === 'spark' ? 0.5 + 0.5 * Math.sin(t * 13 + m.ph) : 1), r = m.r * 2.6; if (a <= 0.01) continue; c.globalAlpha = a; c.drawImage(B.mote, m.x - r, m.y - r, r * 2, r * 2); }
  // the dais, turning; a ring pulses out when a pet lands
  const fy = TS.fy || H * 0.8, X0 = W / 2;
  c.globalAlpha = 0.85 + 0.15 * Math.sin(t * 1.3);
  c.save(); c.translate(X0, fy); c.scale(1, 0.26); c.rotate(t * (TS.rm ? 0.02 : 0.09)); c.drawImage(B.dais, -B.RD, -B.RD, B.RD * 2, B.RD * 2); c.restore();
  if (TS.ring > 0) { TS.ring = Math.max(0, TS.ring - 1 / 50); const u = 1 - TS.ring; c.globalAlpha = TS.ring; c.strokeStyle = mixHex(B.P.neb[0], '#FFFFFF', 0.5); c.lineWidth = 3 * TS.ring + 0.5; c.beginPath(); c.ellipse(X0, fy, B.RD * (0.3 + u * 0.9), B.RD * (0.3 + u * 0.9) * 0.26, 0, 0, 6.283); c.stroke(); }
  // the beam a new pet comes down
  if (TS.beam > 0) { const a = Math.sin(TS.beam * Math.PI) * 0.5, bx = X0 + (TS.A ? TS.A.x : 0), bw = (TS.h || 100) * 0.55; const lg = c.createLinearGradient(bx - bw, 0, bx + bw, 0); lg.addColorStop(0, tsRGBA(B.P.neb[0], 0)); lg.addColorStop(0.5, tsRGBA(mixHex(B.P.neb[0], '#FFFFFF', 0.35), a)); lg.addColorStop(1, tsRGBA(B.P.neb[0], 0)); c.globalAlpha = 1; c.fillStyle = lg; c.fillRect(bx - bw, 0, bw * 2, fy); }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  // the pet that left: up in light
  if (TS.out) { const O = TS.out, u = O.t / 0.45, sc = 1 - u * 0.7;
    try { drawPetFull(c, X0 + O.A.x, fy, O.h, { sprites: O.S, form: O.form, t, face: 'happy', flip: O.A.face < 0, z: O.h * u * 0.8, sx: sc, sy: sc * (1 + u * 0.4), rig: true, circle: false, shadow: false, glow: false, lights: false, alpha: 1 - u }); } catch (e) {}
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.sin(u * Math.PI) * 0.55; const r = O.h * 0.8; c.drawImage(glowSprite(mixHex(E8[O.el] ? E8[O.el].color : '#FFFFFF', '#FFFFFF', 0.5)), X0 + O.A.x - r, fy - O.h * 0.6 - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  const A = TS.A;
  if (!A) { // (its pictures are on their way: a light waits on the dais)
    if (!TS.out) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 5); const r = W * 0.12; c.drawImage(B.mote, X0 - r, fy - W * 0.18 - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    tsDrawFx(c); return;
  }
  // the orb to chase
  if (TS.orb) { const O = TS.orb, ox = X0 + O.x, r = 7 + Math.sin(t * 8) * 1; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(ox, fy, 9, 3, 0, 0, 6.283); c.fill(); c.globalCompositeOperation = 'lighter'; c.drawImage(glowSprite(E8[TS.el].color), ox - r * 4, O.y - r - r * 4, r * 8, r * 8); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FFFDF8'; c.beginPath(); c.arc(ox, O.y - r, r * 0.55, 0, 6.283); c.fill(); }
  const S = TS.S, h = TS.h, X = X0 + A.x, blink = A.blinkT <= 0 && S.rig && S.rig.front && S.rig.front.blink;
  let face = A.faceT > 0 && A.faceX ? A.faceX : blink ? 'blink' : 'normal';
  if (face === 'blink' && !(S.rig && S.rig.front && S.rig.front.blink)) face = 'normal';
  // a jump stretches it going up, squashes it landing
  let sx = A.sx * (1 + A.sq * 0.7), sy = A.sy * (1 - A.sq);
  if (A.z > 0 && !A.held) { const u = clamp(A.zv / (h * 4), -1, 1); sy *= 1 + u * 0.1; sx *= 1 - u * 0.07; }
  drawPetFull(c, X, fy, h, { sprites: S, form: TS.form, t, face, moving: A.mv, walk: A.walk, wingPh: A.wph, wingSmooth: true, flip: A.face < 0, z: A.z, sx, sy, rot: A.rot, el: TS.el, rig: true });
  // the emote over its head (over a Legendary's wings)
  if (A.emote) { const top = fy - A.z - petFloatOf(TS.form, h / 1.02, t) - h * (S.rig && S.rig.legW && S.rig.legW.length ? 1.2 : 1.02), k = clamp(h / 110, 1, 1.35); c.save(); c.translate(X + A.face * h * 0.3, Math.max(top - 4, 62 + 40 * k)); c.scale(k, k); drawEmote(c, 0, 0, A.emote); c.restore(); }
  tsDrawFx(c);
}
function tsDrawFx(c) {
  for (const f of TS.fx) {
    const a = Math.min(1, f.life / 0.4);
    if (f.kind === 'heart') { c.save(); c.globalAlpha = a; c.translate(f.x, f.y); c.scale(f.s, f.s); c.fillStyle = '#FF6F59'; c.strokeStyle = '#FFFDF8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-12, -2, -8, -12, 0, -5); c.bezierCurveTo(8, -12, 12, -2, 0, 8); c.fill(); c.stroke(); c.restore(); }
    else if (f.kind === 'spark') { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; const r = 9 * f.s; c.drawImage(TS.bg.star, f.x - r, f.y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; }
    else if (f.kind === 'puff') { const u = 1 - f.life / f.max; c.globalAlpha = a * 0.8; c.fillStyle = '#F1ECFF'; c.beginPath(); c.arc(f.x, f.y, (6 + u * 10) * f.s, 0, 6.283); c.fill(); }
  }
  c.globalAlpha = 1;
}

/* the test hook's handle (the test build exposes it as team.stage) */
const teamStage = {
  state: () => ({ running: !!TS.raf, uid: TS.uid, el: TS.el, ready: !!TS.A, W: TS.W, H: TS.H, cv: TS.cv ? [TS.cv.width, TS.cv.height] : null, mode: TS.A && TS.A.mode, fx: TS.fx.length, sprites: TS.sprites.size, bgs: TS.bgs.size }),
  parts: () => { const P = TS.parts, q = (i, f) => { const L = P.map(x => x[i]).sort((a, b) => a - b); return L.length ? +L[Math.floor(L.length * f)].toFixed(2) : null; }; return { update: [q(0, 0.5), q(0, 0.95)], backdrop: [q(1, 0.5), q(1, 0.95)], draw: [q(2, 0.5), q(2, 0.95)] }; },
  perf: () => { const L = TS.perfLog.slice().sort((a, b) => a - b); return L.length ? { n: L.length, avg: +(L.reduce((s, v) => s + v, 0) / L.length).toFixed(3), p50: +L[L.length >> 1].toFixed(3), p95: +L[Math.floor(L.length * 0.95)].toFixed(3), max: +L[L.length - 1].toFixed(3) } : null; },
  petScreen: () => { const A = TS.A; if (!A || !TS.cv) return null; const r = TS.cv.getBoundingClientRect(); return { x: r.left + TS.W / 2 + A.x, y: r.top + TS.fy - A.z - TS.h * 0.5, top: r.top, floor: r.top + TS.fy, left: r.left, w: TS.W }; },
  boop: () => tsBoop(), toss: (x, y) => tsToss(x, y), TS,
  // (what the parts cost, each drawn n times and then waited for once, so the wait is shared: the backdrop's refresh,
  // the pet, a whole frame of the pet's canvas)
  bench: n => { const c = TS.c, B = TS.bg, T = () => performance.now(), r = {}; if (!B || !TS.A) return null; const fl = g => g.getImageData(0, 0, 1, 1);
    fl(c); fl(TS.bgC); let t0 = T(); fl(c); r.readback = T() - t0;
    t0 = T(); for (let i = 0; i < n; i++) { B.at = -9; for (let k = 0; k < 5; k++) tsBgFrame(TS.t + i); } fl(TS.bgC); r.backdropRefresh = (T() - t0) / n;
    t0 = T(); for (let i = 0; i < n; i++) drawPetFull(c, TS.W / 2, TS.fy, TS.h, { sprites: TS.S, form: TS.form, t: TS.t + i * 0.016, el: TS.el, rig: true, wingPh: i * 0.3, wingSmooth: true }); fl(c); r.pet = (T() - t0) / n;
    t0 = T(); for (let i = 0; i < n; i++) tsDraw(); fl(c); r.frame = (T() - t0) / n; return r; },
};
