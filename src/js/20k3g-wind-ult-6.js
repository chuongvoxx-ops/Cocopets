/* ---------- Wind, new: Breath of the Wild ----------
   The pet summons a flowering meadow stirred by gentle winds that heals the allied pets standing in it.
   Replaces Breath Between Mountains (row in 20k1: key 'breathofthewild', cost 100, cd 120, glyph 'leaf').
   Gameplay (every level): the sanctuary stays at the cast position; it activates when the formation ends (FORM = 1.2 s
   after the cast) and is active for exactly 20 s; the cooldown (120 s) runs from the cast (the row's cd). From the
   activation, once a second (20 pulses: activation + 0 .. 19 s, on the game clock f.t), every living allied pet inside
   the meadow (distance <= R + its radius) is healed through the game's heal (X.heal: it respects the 'noheal' curse and
   never revives). In the Tower only the played pet stands on the field (benched party members wait in the switch
   strip, off the field, and Animas have no health), so "every allied pet inside" is the played pet, whichever party
   member it is at that moment; it is healed only while it stands inside. No damage.
   Healing a pulse: (2 + 0.25 (evo - 1)) % of the pet's max HP: 2 % at L1, 2.75 % at L4, 3.5 % at L7 (40 / 55 / 70 % of
   max HP over the 20 s). Radius R = (3.2 + 0.27 (evo - 1)) x K tiles (3.2 / 4.0 / 4.8); the centre (1 tile) stays open.
   Choreography:
     formation (1.2 s): the pet lowers a little (hopSq) over gathering mint light; a circular breeze runs out across the
       floor carrying petals, motes and pollen; behind it grass sprouts and stems rise, leaves unfurl, buds open in a
       rolling wave from the centre to the rim.
     active: broad translucent mint / pearl wind ribbons circle at different radii, speeds and heights (some skim the
       grass, some rise in arcs and curl back down); the plants bend as each gust passes and recover with a delayed
       sway; petals lift from clusters and drift; a moving wreath of petals and a narrow green floor glow mark the rim.
       Each pulse: a green ripple runs out over the meadow, flower centres brighten (from Adept in a wave that travels
       with the ripple), small lights leave the flowers and curve to each healed pet, where a mint spiral rises round it
       carrying petals and pollen. Adept: taller clusters, richer foliage, a second, elevated layer of currents.
       Celestial: a wider meadow with layered blossoms, streams of airborne petals, translucent wind arches over it as
       an open canopy, and each pulse first traces a six-petalled flower across the floor before breaking into lights.
     expiry: over the last 3 s the currents rise and the flower centres soften; at 20 s healing stops, the flowers shed
       their petals, fold back into buds and dissolve into green motes while the grass fades in a rolling wave and the
       last ribbons unwind upward (1.8 s). Nothing remains.
   The meadow is floor art drawn under the entities (it never blocks movement or covers the pet); the currents, lights and
   canopy above them dim smoothly round the pet. Performance: every plant is a cached picture (12 plant kinds x 9 lean
   buckets + a bud each, painted once with stems, folded leaves and layered petals), baked lazily a few at a time (and in
   idle time when a floor starts with the move in its kit: U.breathofthewild.warm); a plant costs one blit a frame. */
(() => {
  const U = ELEM_IMPL.wind.ult; delete U.breath;
  const TAU = Math.PI * 2;
  const MINT = '#73E8B6', PALE = '#E7FFF6', PEARL = '#F2FFF8', POLLEN = '#FFF1A8', LEAFG = '#B4F5CF';
  const FLC = [['#FFAFD2', '#DE5A9A', '#FFE3F0'], ['#FFFFFF', '#C9D8E8', '#FFFFFF'], ['#DCCBFF', '#9A82D9', '#F1EAFF']];   // pink, white, lavender: face, deep, edge
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sst = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const fr = x => x - Math.floor(x), hsh = (i, k) => fr(Math.sin(i * 12.9898 + k * 78.233 + 0.71) * 43758.5453);
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const rgb = h => hexRGB(h), rgbaS = (h, a) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
  const mixS = (h1, h2, k) => { const a = rgb(h1), b = rgb(h2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  let H = null;

  const DATA = { active: 20, interval: 1, form: 1.2, healPct: ev => 2 + 0.25 * (ev - 1), radius: ev => 3.2 + 0.27 * (ev - 1), open: 1.0, outro: 1.8 };

  /* ================= the plant pictures (baked) ================= */
  // kinds: 0-2 grass tufts; 3 + 3 * colour + form (form 0 a single bloom, 1 a low cluster, 2 a tall cluster)
  const NK = 12, NL = 9, LEANS = [...Array(NL)].map((_, i) => (i / (NL - 1) - 0.5) * 0.9);
  const BK = { P: 0, pic: [], bud: [], queue: [], job: null, ms: 0, built: 0 };
  const kindH = k => (k < 3 ? 0.32 + 0.07 * k : [0.52, 0.62, 0.98][(k - 3) % 3]);   // height in tiles
  function setScale(P) { P = Math.round(P / 4) * 4; if (BK.P && Math.abs(P - BK.P) / BK.P < 0.3) return false;   /* (the camera zooms a little during casts: a picture within 30% of its size is reused) */ BK.P = P; BK.pic = []; BK.bud = []; BK.queue = []; BK.job = null; return true; }
  const has = q => (q[1] < 0 ? !!BK.bud[q[0]] : !!(BK.pic[q[0]] && BK.pic[q[0]][q[1]]));
  function want(list, front) { for (const q of list) { if (has(q) || BK.queue.some(z => z[0] === q[0] && z[1] === q[1])) continue; front ? BK.queue.unshift(q) : BK.queue.push(q); } }
  const keysFor = kinds => { const out = []; for (const k of kinds) { if (k >= 3) out.push([k, -1]); for (let l = 0; l < NL; l++) out.push([k, l]); } return out; };
  function bakeStep(ms) { if (!BK.P) return; const t0 = performance.now(); while (BK.queue.length && performance.now() - t0 < ms) { const q = BK.queue.shift(); if (has(q)) continue; const r = paintPlant(q[0], q[1] < 0 ? 0 : LEANS[q[1]], q[1] < 0); if (q[1] < 0) BK.bud[q[0]] = r; else (BK.pic[q[0]] = BK.pic[q[0]] || [])[q[1]] = r; BK.built++; } BK.ms += performance.now() - t0; }
  let idleOn = false;
  function idleBake() { if (idleOn) return; idleOn = true; const step = () => { bakeStep(4); if (BK.queue.length) setTimeout(step, 24); else idleOn = false; }; setTimeout(step, 40); }

  // a stem: a tapered curve from the base, a dark core, a lit side; returns its tip
  function stem(g, x0, h, lean, w, P) { const tx = x0 + lean * h, ty = -h * Math.sqrt(1 - Math.min(0.5, lean * lean)), cx = x0 + lean * h * 0.15, cy = -h * 0.55;
    g.lineCap = 'round'; g.strokeStyle = '#1C5E3E'; g.lineWidth = w; g.beginPath(); g.moveTo(x0, 0); g.quadraticCurveTo(cx, cy, tx, ty); g.stroke();
    g.strokeStyle = 'rgba(126,214,140,0.85)'; g.lineWidth = w * 0.4; g.beginPath(); g.moveTo(x0 - w * 0.2, -h * 0.05); g.quadraticCurveTo(cx - w * 0.2, cy, tx - w * 0.15, ty); g.stroke(); return [tx, ty, cx, cy]; }
  const qpt = (x0, cx, cy, tx, ty, u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * tx, 2 * (1 - u) * u * cy + u * u * ty];
  // a leaf: folded (a dark and a light half), a midrib, a pale edge
  function leaf(g, x, y, ang, len, wid) { g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.45, -wid, len, 0); g.quadraticCurveTo(len * 0.5, -wid * 0.1, 0, 0); g.fillStyle = '#7FD98C'; g.fill();
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -wid * 0.1, len, 0); g.quadraticCurveTo(len * 0.45, wid * 0.85, 0, 0); g.fillStyle = '#2F8F57'; g.fill();
    g.strokeStyle = 'rgba(200,245,196,0.75)'; g.lineWidth = Math.max(0.6, wid * 0.18); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.45, -wid, len, 0); g.stroke();
    g.strokeStyle = 'rgba(20,70,45,0.6)'; g.lineWidth = Math.max(0.5, wid * 0.12); g.beginPath(); g.moveTo(len * 0.05, 0); g.lineTo(len * 0.85, 0); g.stroke(); g.restore(); }
  // a bloom seen from three-quarters: a dark back layer, a lit front layer, a luminous centre
  function bloom(g, x, y, r, col, tilt, rot) { const [face, deep, edge] = col; g.save(); g.translate(x, y); g.rotate(tilt * 0.6); g.scale(1, 0.66);
    const petal = (a, len, w, fill, k) => { g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * 0.35, -w, len * 0.95, -w * 0.8, len, 0); g.bezierCurveTo(len * 0.95, w * 0.8, len * 0.35, w, 0, 0); g.fillStyle = fill; g.fill(); if (k) { g.strokeStyle = rgbaS(edge, 0.7); g.lineWidth = Math.max(0.6, r * 0.08); g.stroke(); } g.restore(); };
    g.translate(0, r * 0.12); for (let i = 0; i < 6; i++) petal(rot + (i + 0.5) / 6 * TAU, r * 1.05, r * 0.42, mixS(deep, '#3A1E3A', 0.25), 0);   // (the thickness under the bloom)
    g.translate(0, -r * 0.12);
    for (let i = 0; i < 6; i++) { const a = rot + (i + 0.5) / 6 * TAU, lit = 0.5 + 0.5 * Math.cos(a + 2.2); const gr = g.createLinearGradient(0, 0, Math.cos(a) * r, Math.sin(a) * r); gr.addColorStop(0, deep); gr.addColorStop(1, mixS(face, deep, 0.35 - 0.3 * lit)); petal(a, r, r * 0.42, gr, 0); }
    for (let i = 0; i < 5; i++) { const a = rot + i / 5 * TAU, lit = 0.5 + 0.5 * Math.cos(a + 2.2); const gr = g.createLinearGradient(0, 0, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); gr.addColorStop(0, mixS(deep, face, 0.4)); gr.addColorStop(0.7, face); gr.addColorStop(1, mixS(face, '#FFFFFF', 0.5 * lit)); petal(a, r * 0.78, r * 0.36, gr, 1); }
    const gc = g.createRadialGradient(-r * 0.05, -r * 0.08, 0, 0, 0, r * 0.3); gc.addColorStop(0, '#FFFFF0'); gc.addColorStop(0.5, '#FFE98A'); gc.addColorStop(1, '#E8B84A'); g.fillStyle = gc; g.beginPath(); g.arc(0, 0, r * 0.26, 0, TAU); g.fill(); g.restore(); }
  function bud(g, x, y, r, col, tilt) { g.save(); g.translate(x, y); g.rotate(tilt * 0.6); g.beginPath(); g.moveTo(0, r * 0.4); g.bezierCurveTo(r * 0.55, 0, r * 0.3, -r * 0.7, 0, -r * 0.95); g.bezierCurveTo(-r * 0.3, -r * 0.7, -r * 0.55, 0, 0, r * 0.4); const gr = g.createLinearGradient(-r * 0.4, 0, r * 0.4, 0); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]); g.fillStyle = gr; g.fill();
    g.fillStyle = '#2F8F57'; g.beginPath(); g.moveTo(0, r * 0.45); g.quadraticCurveTo(r * 0.5, r * 0.1, r * 0.25, -r * 0.25); g.quadraticCurveTo(0, 0, -r * 0.25, -r * 0.25); g.quadraticCurveTo(-r * 0.5, r * 0.1, 0, r * 0.45); g.fill(); g.restore(); }
  // one plant picture: kind k, lean (tip offset / height), the bud version; returns { cv, ox, oy, heads: [[x, y], ...] } (px, from the base)
  function paintPlant(k, lean, isBud) {
    const P = BK.P, h = kindH(k) * P, W = Math.ceil(P * 1.35), Hh = Math.ceil(h + P * 0.32), ox = W / 2, oy = Hh - P * 0.06, cv = mk(W, Hh), g = cv.getContext('2d'); g.translate(ox, oy);
    // deep green shade at the base
    const gb = g.createRadialGradient(0, 0, 0, 0, 0, P * 0.3); gb.addColorStop(0, 'rgba(8,48,30,0.5)'); gb.addColorStop(1, 'rgba(8,48,30,0)'); g.fillStyle = gb; g.save(); g.scale(1, 0.4); g.beginPath(); g.arc(0, 0, P * 0.3, 0, TAU); g.fill(); g.restore();
    const heads = [];
    if (k < 3) {   // a grass tuft: tapered blades, dark at the root, light at the tip
      const n = 7 + k * 2; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n - 0.5, bh = h * (0.55 + 0.45 * hsh(i + k * 13, 1)), bx = u * P * 0.34, tip = lean * bh + u * bh * 0.9, w = P * 0.035;
        const gr = g.createLinearGradient(0, 0, 0, -bh); gr.addColorStop(0, '#15503A'); gr.addColorStop(0.5, i % 2 ? '#3FAE63' : '#2E9658'); gr.addColorStop(1, i % 3 ? '#A8EBA0' : '#CFF7C2');
        g.beginPath(); g.moveTo(bx - w, 0); g.quadraticCurveTo(bx + tip * 0.3 - w * 0.4, -bh * 0.55, bx + tip, -bh); g.quadraticCurveTo(bx + tip * 0.3 + w * 0.4, -bh * 0.55, bx + w, 0); g.closePath(); g.fillStyle = gr; g.fill(); }
      return { cv, ox, oy, heads }; }
    const ci = Math.floor((k - 3) / 3), form = (k - 3) % 3, col = FLC[ci], nb = form === 0 ? 1 : 3;
    // leaves round the base
    for (let i = 0; i < (form === 2 ? 5 : 3); i++) { const s = i % 2 ? 1 : -1; leaf(g, s * P * 0.03, -P * 0.02 * i, s > 0 ? -0.35 - 0.12 * i + lean * 0.6 : Math.PI + 0.35 + 0.12 * i + lean * 0.6, P * (0.2 + 0.04 * (i % 3)), P * 0.06); }
    for (let b = 0; b < nb; b++) { const hb = h * (nb === 1 ? 1 : [1, 0.72, 0.58][b]), xb = nb === 1 ? 0 : [0, -1, 1][b] * P * 0.08, lb = lean + (nb === 1 ? 0 : [0, -0.18, 0.2][b]);
      const [tx, ty, cx, cy] = stem(g, xb, hb, lb, P * (form === 2 ? 0.032 : 0.026), P);
      if (form === 2) { const p = qpt(xb, cx, cy, tx, ty, 0.5); leaf(g, p[0], p[1], (b % 2 ? Math.PI + 0.6 : -0.6) + lean * 0.5, P * 0.15, P * 0.05); }
      const r = P * (form === 2 ? 0.14 : 0.13) * (b ? 0.85 : 1); if (isBud) bud(g, tx, ty, r * 0.75, col, lb); else bloom(g, tx, ty, r, col, lb, hsh(k, b) * TAU); heads.push([tx, ty]); }
    return { cv, ox, oy, heads }; }
  // small cached pictures: a petal (3 colours), a soft floor ring, a ribbon sprite
  const petalSpr = ci => fxSprite('bw-petal' + ci, 24, 16, (g, w, h) => { const [face, deep] = FLC[ci]; g.translate(w / 2, h / 2); g.beginPath(); g.ellipse(0, 0, w * 0.42, h * 0.32, 0, 0, TAU); const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, deep); gr.addColorStop(0.6, face); gr.addColorStop(1, '#FFFFFF'); g.fillStyle = gr; g.fill(); });
  const ringSpr = () => fxSprite('bw-ring', 256, 256, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); [[0, 'rgba(115,232,182,0)'], [0.8, 'rgba(115,232,182,0)'], [0.9, 'rgba(115,232,182,0.5)'], [0.95, 'rgba(231,255,246,0.9)'], [0.98, 'rgba(115,232,182,0.3)'], [1, 'rgba(115,232,182,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const discSpr = () => fxSprite('bw-disc', 128, 128, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, 'rgba(115,232,182,0)'); gr.addColorStop(0.3, 'rgba(115,232,182,0.05)'); gr.addColorStop(0.75, 'rgba(115,232,182,0.22)'); gr.addColorStop(0.92, 'rgba(160,240,200,0.32)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });

  /* ================= the move ================= */
  U.breathofthewild = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, K = C.K || 1;
    const R = DATA.radius(ev) * K, R0 = DATA.open, FORM = DATA.form, ACT = DATA.active, END = FORM + ACT, OUT = DATA.outro, PCT = DATA.healPct(ev) / 100;
    const cx = me.x, cy = me.y;
    H.X.banner('BREATH OF THE WILD', '', MINT, 1.6); H.X.sfx.hum();
    // the plants: a sunflower spiral over the ring between the open centre and the rim; flowers in clusters, gaps between
    const kinds = tier === 1 ? [0, 1, 2, 3, 4, 6, 7, 9, 10] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const plants = [], area = Math.PI * (R * R - R0 * R0), NP = Math.round(area * (tier === 3 ? 3.4 : tier === 2 ? 3.1 : 2.8));
    for (let i = 0, j = 0; plants.length < NP && j < NP * 3; j++) { const r = Math.sqrt(lerp(R0 * R0, R * R, (j + 0.5) / (NP * 1.25))), a = j * 2.39996, x = cx + Math.cos(a) * r + (hsh(j, 1) - 0.5) * 0.3, y = cy + Math.sin(a) * r + (hsh(j, 2) - 0.5) * 0.3;
      const rr = Math.hypot(x - cx, y - cy); if (rr < R0 || rr > R || (H.X.blocked && H.X.blocked(x, y, 0.12, 0))) continue;   // (only on the walkable floor)
      const zone = Math.sin(3 * a + rr * 1.7) + Math.sin(5 * a - rr * 2.3) + Math.sin(2 * a + 1.3);
      let k; if (zone > 0.25) { const ci = (Math.floor((a + rr) * 0.8) % 3 + 3) % 3, tall = tier >= 2 && hsh(j, 3) < (tier === 3 ? 0.5 : 0.35); k = 3 + ci * 3 + (tall ? 2 : hsh(j, 4) < 0.5 ? 0 : 1); } else if (zone < -1.3 && hsh(j, 5) < 0.7) continue; else k = Math.floor(hsh(j, 6) * 3);
      plants.push({ i: i++, x, y, r: rr, a: Math.atan2(y - cy, x - cx), k, sc: 0.8 + 0.4 * hsh(j, 7), ph: hsh(j, 8) * TAU, d: hsh(j, 9), lean: 0, glow: 0 }); }
    plants.sort((p, q) => p.y - q.y);
    const flowers = plants.filter(p => p.k >= 3);
    // the currents: radius, speed, height profile; Adept adds an elevated layer
    const ribs = []; const NR = tier === 3 ? 6 : tier === 2 ? 5 : 3;
    for (let k = 0; k < NR; k++) { const high = k >= 3; ribs.push({ r: lerp(R0 + 0.6, R - 0.4, hsh(k, 11)) * (high ? 0.9 : 1), w: (high ? 1.3 : 1.0) * (k % 2 ? 1.1 : 0.9), sp: (0.55 + 0.35 * hsh(k, 12)) * (k % 3 === 2 ? -1 : 1), a0: hsh(k, 13) * TAU, z0: high ? 0.9 + 0.5 * hsh(k, 14) : 0.12 + 0.12 * hsh(k, 15), arc: high ? 0.6 : (k === 1 ? 0.9 : 0.15), len: 1.5 + 0.6 * hsh(k, 16), high }); }
    const arches = tier === 3 ? [0, 1, 2, 3].map(k => ({ a: k / 4 * Math.PI + 0.3, hgt: 2.4 + 0.4 * (k % 2), sp: 0.07 * (k % 2 ? 1 : -1) })) : [];
    const lights = [], spirals = [], ripples = [], traces = [];
    let lastPulse = -1, healed = 0, pulses = 0, sqOn = false;
    const P0 = H.X.Tz() * Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || 1); setScale(P0); want(keysFor(kinds.filter(k => k >= 3)).filter(q => q[1] < 0), true); want(keysFor(kinds));
    const inside = () => !me.dead && Math.hypot(me.x - cx, me.y - cy) <= R + (me.r || 0.4);
    const petBox = T => [H.sx(me.x), H.sy(me.y) - T * 0.5 - (me.z || 0) * T];
    const nearPet = (X, Y, T, pb) => 0.25 + 0.75 * sst(T * 0.45, T * 1.25, Math.hypot(X - pb[0], (Y - pb[1]) * 1.15));
    const growOf = (p, t) => cl((t - 0.12 - p.r / R * 0.85 - p.d * 0.15) / 0.5);
    const fadeOf = (p, t) => cl((t - END - 0.35 - p.r / R * 0.8 - p.d * 0.2) / 0.6);
    // where a current is at angle offset v behind its head (world x, y, height z)
    const ribPt = (rb, t, v, rise) => { const a = rb.a0 + rb.sp * t - Math.sign(rb.sp) * v * rb.len, r = rb.r + Math.sin(a * 2 + rb.a0) * 0.35, z = rb.z0 + rb.arc * Math.sin(Math.PI * cl(v)) * (0.6 + 0.4 * Math.sin(t * 0.7 + rb.a0)) + rise; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z, a]; };

    function pulse(t) {
      pulses++; const inP = inside(); H.X.sfx.sparkle && H.X.sfx.sparkle();
      ripples.push({ t0: t }); if (tier === 3) traces.push({ t0: t, rot: pulses * 0.4 });
      if (inP) { const before = me.hp; H.X.heal(H.X.ST().hp * PCT); if (me.hp > before) healed += me.hp - before;
        // lights from the flowers nearest the pet curve to it, a spiral rises round it when they arrive
        const src = flowers.slice().sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y)).slice(0, tier === 3 ? 10 : tier === 2 ? 8 : 6);
        src.forEach((p, n) => lights.push({ t0: t + (tier >= 2 ? p.r / R * 0.35 : 0.1) + n * 0.03, x0: p.x, y0: p.y, z0: kindH(p.k) * p.sc, side: n % 2 ? 1 : -1, d: 0.45 + 0.1 * hsh(n, pulses) }));
        spirals.push({ t0: t + 0.55 + (tier >= 2 ? 0.2 : 0) });
        for (let q = 0; q < H.n(6); q++) H.P({ kind: 'petal', x: me.x + (Math.random() - 0.5) * 0.6, y: me.y - 0.2, vx: (Math.random() - 0.5) * 0.6, vy: -1.4 - Math.random(), life: 1.1, max: 1.1, size: 2.6, rot: Math.random() * TAU, vr: 5, drag: 1.2, color: FLC[q % 3][0] }); } }

    const F = H.add({ key: 'breathofthewild', life: END + OUT + 0.2, x: cx, y: cy, ev, R, PCT, plants, flowers,
      update(dt, f) { const t = f.t; f.pulses = pulses; f.healed = healed;
        if (BK.queue.length) bakeStep(t < FORM + 0.3 ? 2.5 : 0.8);
        // the pet lowers a little while the light gathers, then rises
        if (t < 0.9) { me.hopSq = 0.22 * Math.sin(Math.PI * cl(t / 0.9)); sqOn = true; } else if (sqOn) { me.hopSq = 0; sqOn = false; }
        if (me.dead && f.life > OUT && t < END) { f.life = Math.min(f.life, OUT); }
        // the pulses: activation + 0 .. 19 s, nothing at or after 20 s
        if (t >= FORM && t < END - 1e-6) { const k = Math.floor((t - FORM) / DATA.interval + 1e-6); if (k > lastPulse && k < ACT) { lastPulse = k; pulse(t); } }
        // the plants: a gust bends each as a current's head passes over it, then it recovers with a delayed sway
        for (const p of plants) { let b = 0; for (const rb of ribs) { if (rb.high) continue; const hd = rb.a0 + rb.sp * t, d = wrapA(hd - p.a) * Math.sign(rb.sp); if (d > 0 && d < 2.2) { const rr = Math.exp(-((p.r - rb.r) * (p.r - rb.r)) / 1.6); b += rr * Math.exp(-d * 2.2) * Math.cos(d * 3.5) * Math.sign(rb.sp) * (-Math.sin(p.a)); } }
          p.lean = 0.12 * Math.sin(t * 1.4 + p.ph) + 0.06 * Math.sin(t * 2.3 + p.ph * 2) + 0.42 * b; p.glow = Math.max(0, p.glow - dt * 1.6); }
        // the pulses' flower light: all at once (L1), or travelling with the ripple (Adept, Celestial)
        for (const rp of ripples) { const u = (t - rp.t0) / 0.9; if (u > 1.2) continue; const rr = u * (R + 0.3); for (const p of flowers) if (tier === 1 ? u < 0.1 : Math.abs(p.r - rr) < 0.35) p.glow = Math.max(p.glow, 1); }
        while (ripples.length && t - ripples[0].t0 > 1.2) ripples.shift(); while (traces.length && t - traces[0].t0 > 1.0) traces.shift();
        while (lights.length && t - lights[0].t0 > 1.0) lights.shift(); while (spirals.length && t - spirals[0].t0 > 1.2) spirals.shift();
        // drifting petals and pollen over the meadow; the formation breeze's petals and motes
        const live = t > FORM && t < END;
        if (t < FORM) { const rw = (t / FORM) * R; if (Math.random() < dt * 40 * H.Q()) { const a = Math.random() * TAU; H.P({ kind: Math.random() < 0.5 ? 'petal' : 'spark', x: cx + Math.cos(a) * rw, y: cy + Math.sin(a) * rw - 0.15, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 1.6 - 0.4, life: 0.7, max: 0.7, size: 2.2, rot: a, vr: 6, drag: 1.5, color: Math.random() < 0.4 ? FLC[0][0] : Math.random() < 0.5 ? LEAFG : POLLEN }); } }
        if (live && Math.random() < dt * (tier === 3 ? 9 : tier === 2 ? 6 : 4) * H.Q()) { const p = flowers[(Math.random() * flowers.length) | 0]; if (p) H.P({ kind: 'petal', x: p.x, y: p.y - kindH(p.k) * p.sc, vx: (Math.random() - 0.5) * 1.2 + 0.6, vy: -0.8 - Math.random() * 0.6, g: 0.9, life: 2.0, max: 2.0, size: 2.4, rot: Math.random() * TAU, vr: 4, drag: 0.6, color: FLC[Math.floor((p.k - 3) / 3)][0] }); }
        if (live && Math.random() < dt * 5 * H.Q()) { const a = Math.random() * TAU, r = lerp(R0, R, Math.random()); H.P({ kind: 'spark', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r - 0.3 - Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.3, vy: -0.25, life: 1.4, max: 1.4, size: 1.3, color: Math.random() < 0.5 ? POLLEN : PALE }); }
        if (t > END && !f.shed) { f.shed = 1; H.X.sfx.whoosh(); for (const p of flowers) if (Math.random() < 0.4 * H.Q()) for (let q = 0; q < 1; q++) H.P({ kind: 'petal', x: p.x, y: p.y - kindH(p.k) * p.sc, vx: (Math.random() - 0.5) * 1.4, vy: -0.6 - Math.random() * 0.8, g: 0.8, life: 1.4, max: 1.4, size: 2.4, rot: Math.random() * TAU, vr: 5, drag: 0.8, color: FLC[Math.floor((p.k - 3) / 3)][0] }); }
        if (t > END + 0.6 && !f.motes) { f.motes = 1; for (const p of plants) if (Math.random() < 0.2 * H.Q()) H.P({ kind: 'spark', x: p.x, y: p.y - 0.2, vx: (Math.random() - 0.5) * 0.4, vy: -0.6 - Math.random() * 0.5, life: 1.0, max: 1.0, size: 1.4, color: Math.random() < 0.5 ? MINT : LEAFG }); }
      },
      onEnd() { if (sqOn) me.hopSq = 0; },
      drawUnder(c, f, X, Y, T) { const t = f.t, pxk = c.getTransform().a || 1; if (setScale(T * pxk)) { want(keysFor(kinds.filter(k => k >= 3)).filter(q => q[1] < 0), true); want(keysFor(kinds)); }
        const Xc = H.sx(cx), Yc = H.sy(cy), out = cl((t - END) / OUT), form = cl(t / FORM);
        c.save(); c.globalCompositeOperation = 'lighter';
        // the gathering light under the pet, the formation breeze's ring
        if (t < FORM + 0.3) { const a = Math.sin(Math.PI * cl(t / (FORM + 0.3))); c.globalAlpha = 0.5 * a; const r0 = T * 0.9; c.drawImage(glowSprite(MINT), Xc - r0, Yc - r0 * 0.55, r0 * 2, r0 * 1.1); const rw = R * T * H.ease.out(form) + T * 0.2; c.globalAlpha = 0.5 * (1 - form * 0.6); c.drawImage(ringSpr(), Xc - rw, Yc - rw * H.GY, rw * 2, rw * 2 * H.GY); }
        // the meadow's floor light (light only) and the narrow green glow on the rim
        const on = sst(0.2, FORM, t) * (1 - out); if (on > 0.01) { const rr = R * T * 1.04; c.globalAlpha = 0.3 * on; c.drawImage(discSpr(), Xc - rr, Yc - rr * H.GY, rr * 2, rr * 2 * H.GY); c.globalAlpha = 0.28 * on; const rg = R * T * 1.02; c.drawImage(ringSpr(), Xc - rg, Yc - rg * H.GY, rg * 2, rg * 2 * H.GY); }
        // the pulses: a green ripple out over the meadow; at Celestial a six-petalled flower traced across the floor first
        for (const rp of ripples) { const u = (t - rp.t0) / 0.9; if (u < 0 || u > 1) continue; const rr = T * (R0 * 0.6 + u * (R + 0.3 - R0 * 0.6)); c.globalAlpha = 0.42 * Math.sin(Math.PI * u) * (1 - out); c.drawImage(ringSpr(), Xc - rr, Yc - rr * H.GY, rr * 2, rr * 2 * H.GY); }
        for (const tr of traces) { const u = (t - tr.t0) / 1.0; if (u < 0 || u > 1) continue; const dr = cl(u / 0.55), al = (1 - sst(0.55, 1, u)) * 0.85, N = 96, n = Math.max(2, Math.floor(N * dr)); c.lineCap = 'round'; c.lineJoin = 'round';
          for (const [lw, col, a] of [[T * 0.16, MINT, 0.3], [Math.max(1, T * 0.04), PEARL, 0.9]]) { c.beginPath(); for (let i = 0; i <= n; i++) { const th = i / N * TAU, r = (R0 + (R - R0) * 0.75 * Math.abs(Math.cos(3 * th))) * T, a2 = th + tr.rot; const x = Xc + Math.cos(a2) * r, y = Yc + Math.sin(a2) * r * H.GY; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.globalAlpha = al * a; c.strokeStyle = col; c.lineWidth = lw; c.stroke(); } }
        c.restore();
        // the plants (back to front), one cached picture each; the bud while growing / folding; flower centres glow
        const P = BK.P, k1 = T / P * 1; const glows = [];
        for (const p of plants) { const gw = growOf(p, t), fd = fadeOf(p, t); if (gw <= 0 || fd >= 1) continue; const set = BK.pic[p.k]; if (!set) continue;
          const li = Math.max(0, Math.min(NL - 1, Math.round((p.lean / 0.9 + 0.5) * (NL - 1)))); let pic = set[li]; if (!pic) { for (let d = 1; d < NL && !pic; d++) pic = set[li + d] || set[li - d]; } if (!pic) continue;
          const Xp = H.sx(p.x), Yp = H.sy(p.y), s = k1 * p.sc, w = pic.cv.width * s, hh = pic.cv.height * s;
          const open = p.k >= 3 ? cl((gw - 0.55) / 0.45) * (1 - cl((fd - 0.0) / 0.45)) : 1, vs = p.k >= 3 ? lerp(0.25, 1, cl(gw / 0.6)) * (1 - 0.3 * cl(fd / 0.6)) : H.ease.out(gw) * (1 - fd * 0.5), alpha = 1 - sst(0.4, 1, fd);
          if (p.k >= 3 && open < 1 && BK.bud[p.k]) { const b = BK.bud[p.k]; c.globalAlpha = alpha * (1 - open); c.drawImage(b.cv, Xp - b.ox * s, Yp - b.oy * s * vs, b.cv.width * s, b.cv.height * s * vs); }
          if (open > 0 || p.k < 3) { c.globalAlpha = alpha * (p.k >= 3 ? open : 1); c.drawImage(pic.cv, Xp - pic.ox * s, Yp - pic.oy * s * vs, w, hh * vs); }
          if (p.k >= 3 && open > 0.5) { const soft = 1 - 0.6 * sst(END - 3, END, t); const gl = (0.1 * soft + 0.7 * p.glow) * open * alpha; if (gl > 0.03) for (const hd of pic.heads) glows.push(Xp + hd[0] * s, Yp + hd[1] * s * vs, gl, p.k); } }
        c.globalAlpha = 1;
        if (glows.length) { c.save(); c.globalCompositeOperation = 'lighter'; const gs = glowSprite('#FFF4C8'), gm = glowSprite(MINT), r = T * 0.13; for (let i = 0; i < glows.length; i += 4) { const a = glows[i + 2]; c.globalAlpha = Math.min(1, a); c.drawImage(gs, glows[i] - r, glows[i + 1] - r, r * 2, r * 2); if (a > 0.4) { c.globalAlpha = (a - 0.4) * 0.5; c.drawImage(gm, glows[i] - r * 2, glows[i + 1] - r * 2, r * 4, r * 4); } } c.restore(); }
      },
      draw(c, f, X, Y, T) { const t = f.t, Xc = H.sx(cx), Yc = H.sy(cy), pb = petBox(T), out = cl((t - END) / OUT), on = sst(0.3, FORM, t) * (1 - sst(0.2, 1, out)), rise = sst(END - 3, END + OUT, t) * 1.6;
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        // the currents: tapered translucent ribbons, mint with a pearl core, feathered at both ends
        if (on > 0.01) for (const rb of ribs) { const n = 14, pts = []; for (let j = 0; j <= n; j++) { const q = ribPt(rb, t, j / n, rise * (rb.high ? 1.2 : 0.8)); pts.push([H.sx(q[0]), H.sy(q[1]) - q[2] * T]); }
          for (let j = 1; j <= n; j++) { const u = j / n, tp = Math.pow(Math.sin(Math.PI * u), 0.8), dim = nearPet(pts[j][0], pts[j][1], T, pb); c.beginPath(); c.moveTo(pts[j - 1][0], pts[j - 1][1]); c.lineTo(pts[j][0], pts[j][1]);
            c.globalAlpha = 0.09 * on * tp * dim; c.strokeStyle = MINT; c.lineWidth = T * 0.34 * rb.w; c.stroke(); c.globalAlpha = 0.11 * on * tp * dim; c.strokeStyle = '#BFF5DC'; c.lineWidth = T * 0.14 * rb.w; c.stroke(); c.globalAlpha = 0.32 * on * tp * dim; c.strokeStyle = PEARL; c.lineWidth = Math.max(1, T * 0.022); c.stroke(); } }
        // Celestial: translucent wind arches over the meadow, an open canopy
        if (on > 0.01) for (const ar of arches) { const a = ar.a + ar.sp * t, dx = Math.cos(a), dy = Math.sin(a), n = 18, pts = []; for (let j = 0; j <= n; j++) { const v = j / n - 0.5, x = cx + dx * v * 2 * R * 0.95, y = cy + dy * v * 2 * R * 0.95, z = ar.hgt * (1 - 4 * v * v) + rise * 1.5; pts.push([H.sx(x), H.sy(y) - z * T]); }
          for (let j = 1; j <= n; j++) { const u = j / n, tp = Math.pow(Math.sin(Math.PI * u), 0.6), dim = nearPet(pts[j][0], pts[j][1], T, pb), fl = 0.6 + 0.4 * Math.sin(u * 9 - t * 3 + ar.a); c.beginPath(); c.moveTo(pts[j - 1][0], pts[j - 1][1]); c.lineTo(pts[j][0], pts[j][1]);
            c.globalAlpha = 0.05 * on * tp * dim; c.strokeStyle = MINT; c.lineWidth = T * 0.4; c.stroke(); c.globalAlpha = 0.2 * on * tp * dim * fl; c.strokeStyle = PEARL; c.lineWidth = Math.max(1, T * 0.03); c.stroke(); } }
        // the wreath of petals round the rim
        c.globalCompositeOperation = 'source-over';
        if (on > 0.01) { const NW = tier === 3 ? 56 : tier === 2 ? 44 : 34; for (let i = 0; i < NW; i++) { const a = i / NW * TAU + t * 0.22 * (i % 2 ? 1 : 0.8), r = R + 0.12 * Math.sin(t * 1.3 + i), z = 0.25 + 0.2 * Math.sin(t * 1.7 + i * 1.9), Xw = Xc + Math.cos(a) * r * T, Yw = Yc + Math.sin(a) * r * T * H.GY - z * T, sp = petalSpr(i % 3), w = T * 0.2, fl = Math.abs(Math.sin(t * 2.4 + i * 0.7));
          c.globalAlpha = 0.85 * on * nearPet(Xw, Yw, T, pb); c.drawImage(sp, Xw - w / 2, Yw - w * 0.33 * (0.3 + 0.7 * fl), w, w * 0.66 * (0.3 + 0.7 * fl)); } }
        // the pulses' lights curving to the healed pet, and the mint spiral rising round it
        c.globalCompositeOperation = 'lighter';
        const gm = glowSprite(MINT), gp = glowSprite(PEARL);
        for (const L of lights) { const u = (t - L.t0) / L.d; if (u < 0 || u > 1) continue; const e = u * u * (3 - 2 * u), tx = me.x, ty = me.y, mx = (L.x0 + tx) / 2 + (ty - L.y0) * 0.35 * L.side, my = (L.y0 + ty) / 2 - (tx - L.x0) * 0.35 * L.side, x = (1 - e) * (1 - e) * L.x0 + 2 * (1 - e) * e * mx + e * e * tx, y = (1 - e) * (1 - e) * L.y0 + 2 * (1 - e) * e * my + e * e * ty, z = lerp(L.z0, 0.5, e) + Math.sin(Math.PI * e) * 0.8;
          const Xl = H.sx(x), Yl = H.sy(y) - z * T, r = T * 0.22; c.globalAlpha = 0.9 * Math.sin(Math.PI * Math.min(1, u * 1.15)); c.drawImage(gm, Xl - r * 1.8, Yl - r * 1.8, r * 3.6, r * 3.6); c.drawImage(gp, Xl - r * 0.6, Yl - r * 0.6, r * 1.2, r * 1.2); }
        for (const S of spirals) { const u = (t - S.t0) / 1.2; if (u < 0 || u > 1) continue; const Xp = H.sx(me.x), Yp = H.sy(me.y), al = Math.sin(Math.PI * u);
          for (let s = 0; s < 2; s++) { let px0 = 0, py0 = 0; for (let j = 0; j <= 16; j++) { const v = j / 16, h = (v * 1.3 + u * 0.6) * T, a = v * TAU * 1.5 + s * Math.PI + u * 5, rr = T * (0.55 - 0.15 * v), x = Xp + Math.cos(a) * rr, y = Yp + Math.sin(a) * rr * 0.4 - h;
            if (j) { c.beginPath(); c.moveTo(px0, py0); c.lineTo(x, y); const front = Math.sin(a) > 0; c.globalAlpha = al * Math.sin(Math.PI * v) * (front ? 0.85 : 0.35); c.strokeStyle = front ? PEARL : MINT; c.lineWidth = T * (front ? 0.05 : 0.08); c.stroke(); } px0 = x; py0 = y; } }
          if (u < 0.5) { const r = T * 0.7; c.globalAlpha = 0.35 * (1 - u * 2); c.drawImage(gm, Xp - r, Yp - r * 0.6 - T * 0.4, r * 2, r * 1.2); } }
        c.restore(); }
    });
    return F;
  };
  U.breathofthewild.data = DATA;
  U.breathofthewild.warm = o => { setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; const ev = Math.max(1, Math.min(7, Math.round(o.evo || 1))); setScale(T * Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || 1)); const kinds = ev >= 4 ? [...Array(NK).keys()] : [0, 1, 2, 3, 4, 6, 7, 9, 10]; want(keysFor(kinds)); idleBake(); }, 450); };
  U.breathofthewild.__dbg = { BK, bakeStep, setScale, want, keysFor, paintPlant, DATA, NK };
})();
