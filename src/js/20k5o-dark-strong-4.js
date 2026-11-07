/* ---------- Dark Strong, new: Dracula ----------
   The pet becomes a vampire bat, climbs over the monsters and dives on them again and again, biting and siphoning their
   blood; spheres of darkness erupt with every bite. Replaces Blackglass Fracture (row in 20k1: key 'dracula', cost 28,
   cd 6, glyph 'feather').
   Counts (held until their breakpoints): 2 dives at levels 1-3, 3 at 4-6, 4 at 7 (C.evo).
   Each dive is one Dark AoE hit, fired in the frame the bat's dive reaches its victim (the bite), on every monster within
   R_j of the victim (hypot(dx, dy) - m.r <= R_j, R_j = (1.15 + 0.05 j) K, the last x1.3), once per monster per dive: the
   bite and the darkness spheres are that one hit (the spheres on the other monsters show where it landed; decorative
   particles never hit). No stun, no knockback, no displacement (H.X.hitMon with the element only).
   Damage (DK = base x K x (1 + 0.1 (evo - 1))), for a monster struck by every dive: TOT = (2.5 + 0.25 (N - 2)) DK
   (2.5 / 2.75 / 3.0 DK at levels 1 / 4 / 7, i.e. 2.5 / 3.58 / 4.8 base), split by weights 1 for each dive and 1.5 for
   the last:   L1  1.00, 1.50       L4  1.10, 1.10, 1.65 (x1.3)       L7  0.92, 0.92, 0.92, 1.38 (x1.6)   (x base x K)
   Healing: a dive that damaged at least one monster (hitMon > 0) heals the caster 6% of its max HP (H.X.heal: clamped,
   blocked by a no-heal curse), once, when that dive's siphon resolves; a dive that struck nothing heals nothing. So at
   most 12 / 18 / 24% a cast, however many monsters each bite reached.
   Targeting (range 6.5 tiles from the bat): the first dive takes the aimed / selected monster (else the nearest); each
   later dive the nearest, preferring one not just bitten (a lone monster or boss is bitten again, from a new side). If
   the victim dies before the bite the bat turns smoothly onto the nearest other; if none is left (or none at the next
   launch) the sequence ends early and the pet reforms.
   Choreography (FORM 0.6 s; per dive: ascent 0.3-0.55 s (lateral travel to the next victim happens here), hover 0.1 s
   (0.2 last), dive 0.22 s (0.27 last), feed 0.42 s (0.52 last); END 0.55 s; 3.4 / 4.5 / 5.7 s in all):
     transformation: a tight spiral of black-violet mist and crimson motes coils round the pet, which squashes down
       (me.hopSq), then hides; a burst of mist, and the bat appears with its wings folded and unfolds them.
     ascent: wingbeats, the bat rises and swings round toward the next victim, banking with its travel; its shadow moves
       on the floor and a dark-red ripple marks the strike point under the victim.
     hover: a beat over the victim, leaning toward it.
     dive: wings folded, accelerating down at it with violet-black smoke ribbons and crimson streaks behind, then the
       wings flare to brake (the last flare the biggest) and the head turns to the victim.
     bite: a fang flash; the hit; a large darkness sphere at the victim and smaller ones on each other monster struck
       (swell, compress with bright fissures, rupture into curved shell fragments, rolling smoke and violet-crimson
       shockwaves; the last dive's the largest, with the deepest sound and a short camera impulse).
     feed: the bat clings beside the victim at its body height; glossy droplets and narrowing ribbons of blood stream
       from the victim into its mouth; when the siphon resolves a crimson pulse runs through its chest and wing veins
       and the heal lands. Then the next ascent.
     end: the bat rises a little and dissolves into curling mist; the pet reforms below with a stretch and settle.
   Pet hooks (as Fujin's): input held with me.push = hold (re-armed each frame, it lapses on its own), the bat's ground
   point is the pet's own position moved by H.X.moveEnt (walls stop it, so the pet always reforms on valid ground),
   me.hopSq for the squash before the change and the settle after it. New: me.petAlt (20b drawPet skips the pet while
   this effect is in ELEM.fx and the pet is alive); the pet's normal attacks and dodge wait (g.normalT / g.dodgeCd kept
   just above zero, lapsing by themselves). Unlike Fujin there is NO me.inv and no me.z: the pet keeps its normal hurtbox
   at its ground point the whole time (the spec forbids silently added invulnerability; the game's leap is untouchable,
   but this is not that leap). Everything is reset on completion, on early end, on the pet's death and on a party swap
   (the ST changes); the floor's end throws the whole game (and the pet) away.
   Pictures: the bat's parts are cached sprites baked at the screen's scale (the furred body with the pet's colour in
   its collar ruff and inner ears; the ear; each wing pose: 3 folds x 10 flap phases + the flare, a membrane layer and an
   emissive layer (crimson veins and backlit edges) each), drawn with transforms; the darkness sphere's shaded body,
   two swirling smoke layers, rim light, fissures and shell fragments are baked per pixel once. All lazily in slices
   (1.2 ms a frame, 2 ms while one on screen is missing; Strongs are not prewarmed) with cheap fallbacks meanwhile.
   Reduced motion: no camera impulse. */
(() => {
  const S = ELEM_IMPL.dark.strong; delete S.blackglass;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const CRIM = '#D0183F', RUBY = '#FF2D55', ROSE = '#FF8FA3';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const mixHex = (a, b, k) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.max(0, Math.min(255, Math.round(v + (B[i] - v) * k))).toString(16).padStart(2, '0')).join(''); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const hash2 = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const fbm = (x, y) => vnoise(x, y) * 0.5 + vnoise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.3 + vnoise(x * 4.1 + 9.1, y * 4.1 + 7.7) * 0.2;
  let H = null;

  /* ================= the bat's geometry (units: tiles for a bat of size 1; y down; the body's centre at 0) ================= */
  const NP = 10, FOLDK = [0, 0.5, 1];
  const LH = 0.24, LF = 0.34, DL = [0.3, 0.44, 0.39, 0.33], SPR0 = [-0.3, 0.22, 0.72, 1.22], HIP = [-0.06, 0.3], SHO = [0.085, -0.03];
  // a wing pose: th the upper arm's angle (0 out sideways, - up), ka the flex (0 stretched .. 1 folded), sp the finger spread
  function wingParams(k, ph) {
    const thF = -0.15 - 0.8 * Math.cos(TAU * ph), kaF = 0.05 + 0.5 * Math.pow(Math.max(0, -Math.sin(TAU * ph)), 0.8);   // (stretched on the downstroke, flexed on the recovery)
    return { th: lerp(thF, 0.85 + 0.06 * Math.cos(TAU * ph), k), ka: lerp(kaF, 0.9, k), sp: 1 + 0.6 * k, dl: 1 };
  }
  const FLARE = { th: -0.62, ka: 0, sp: 1.2, dl: 1.06 };   // (braking: spread wide and forward, the fingers fanned)
  function wingGeo(P) {
    const th = P.th, ka = P.ka, bend = lerp(0.3, 2.75, ka), al = th - bend;
    const E = [Math.cos(th) * LH, Math.sin(th) * LH], W = [E[0] + Math.cos(al) * LF, E[1] + Math.sin(al) * LF];
    const ff = 3.25 * ka, dls = (1 - 0.38 * ka) * P.dl, tips = [], mids = [];
    for (let i = 0; i < 4; i++) { const b = al + SPR0[i] * (1 - 0.86 * ka) * P.sp + ff, L = DL[i] * dls, m = [W[0] + Math.cos(b) * L * 0.55, W[1] + Math.sin(b) * L * 0.55], b2 = b + 0.16 + 0.1 * ka; mids.push(m); tips.push([m[0] + Math.cos(b2) * L * 0.45, m[1] + Math.sin(b2) * L * 0.45]); }
    return { E, W, tips, mids, hip: HIP, th, al };
  }
  // the membrane's outline: shoulder, the leading edge to the wrist, along the second finger, scallops between the tips, to the hip
  const scal = (G, a, b, k) => [(a[0] + b[0]) / 2 + (G.W[0] - (a[0] + b[0]) / 2) * k, (a[1] + b[1]) / 2 + (G.W[1] - (a[1] + b[1]) / 2) * k];
  function memPath(g, G) {
    const W = G.W, lc = [W[0] * 0.5 - W[1] * 0.12, W[1] * 0.5 + W[0] * 0.12 - 0.02];
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lc[0], lc[1], W[0], W[1]); g.lineTo(G.mids[0][0], G.mids[0][1]); g.lineTo(G.tips[0][0], G.tips[0][1]);
    for (let i = 1; i < 4; i++) { const q = scal(G, G.tips[i - 1], G.tips[i], 0.26); g.quadraticCurveTo(q[0], q[1], G.tips[i][0], G.tips[i][1]); }
    const q = scal(G, G.tips[3], G.hip, 0.2); g.quadraticCurveTo(q[0], q[1], G.hip[0], G.hip[1]); g.closePath();
  }
  function trailPath(g, G) {   // (the trailing edges only: the scallops)
    g.beginPath(); g.moveTo(G.tips[0][0], G.tips[0][1]);
    for (let i = 1; i < 4; i++) { const q = scal(G, G.tips[i - 1], G.tips[i], 0.26); g.quadraticCurveTo(q[0], q[1], G.tips[i][0], G.tips[i][1]); }
    const q = scal(G, G.tips[3], G.hip, 0.2); g.quadraticCurveTo(q[0], q[1], G.hip[0], G.hip[1]);
  }

  /* ================= the picture cache ================= */
  const BK = { px: 0, spr: new Map(), queue: [], qset: new Set(), job: null, ms: 0, maxSlice: 0, miss: 0, built: 0 };
  function setScale(px) { if (BK.px && Math.abs(px / BK.px - 1) < 0.25) return; for (const k of [...BK.spr.keys()]) if ('WBE'.includes(k[0])) BK.spr.delete(k); BK.queue = BK.queue.filter(k => !'WBE'.includes(k[0])); BK.qset = new Set(BK.queue); if (BK.job && 'WBE'.includes(BK.job.key[0])) BK.job = null; BK.px = px; }
  function want(key, front) { if (BK.spr.has(key) || (BK.job && BK.job.key === key)) return; if (BK.qset.has(key)) { if (front) { const i = BK.queue.indexOf(key); if (i > 0) { BK.queue.splice(i, 1); BK.queue.unshift(key); } } return; } BK.qset.add(key); if (front) BK.queue.unshift(key); else BK.queue.push(key); }
  function genFor(key, res) {
    if (key[0] === 'W') return wingGen(+key[1], +key.slice(3), res);
    if (key[0] === 'B') return bodyGen(key.slice(1), res);
    if (key[0] === 'E') return earGen(key.slice(1), res);
    if (key === 'SPH') return sphereGen(res); if (key === 'SPHR') return sphereRimGen(res);
    if (key === 'SW0' || key === 'SW1') return swirlGen(+key[2], res); if (key === 'FIS') return fisGen(res);
    return fragGen(+key[2], res);
  }
  function bakeStep(ms) {
    const t0 = nowMs(), until = t0 + ms;
    while (nowMs() < until) {
      if (!BK.job) { let key = null; while (BK.queue.length && !key) { const k = BK.queue.shift(); BK.qset.delete(k); if (!BK.spr.has(k)) key = k; } if (!key) break; const res = {}; BK.job = { key, res, it: genFor(key, res) }; }
      const jb = BK.job; let done = false; while (nowMs() < until) { if (jb.it.next().done) { done = true; break; } }
      if (!done) break; BK.spr.set(jb.key, jb.res); BK.built++; BK.job = null;
    }
    const dt = nowMs() - t0; BK.ms += dt; if (dt > BK.maxSlice) BK.maxSlice = dt;
  }
  const get = key => { const r = BK.spr.get(key); if (r) return r; want(key, true); BK.miss++; return null; };
  const wkey = (ki, p) => 'W' + ki + '.' + p;
  function wingFrame(ki, p) { let r = get(wkey(ki, p)); if (r) return r; for (let d = 1; d <= NP / 2; d++) for (const s of [1, -1]) { r = BK.spr.get(wkey(ki, ((p + s * d) % NP + NP) % NP)); if (r) return r; } for (const k2 of [0, 1, 2, 3]) { r = BK.spr.get(wkey(k2, k2 === 3 ? 0 : p)); if (r) return r; } return null; }
  function plan(acc) {
    want('B' + acc); want('E' + acc); want(wkey(2, 0)); for (let p = 0; p < NP; p++) want(wkey(0, p)); want(wkey(3, 0));
    for (let p = 0; p < NP; p++) want(wkey(1, p)); for (let p = 1; p < NP; p++) want(wkey(2, p));
    for (const k of ['SPH', 'SPHR', 'SW0', 'SW1', 'FIS', 'FR0', 'FR1', 'FR2']) want(k);
  }

  /* ---- a wing: the membrane layer (leather, thickness, wrinkles, veins, bones, joints, a ruby rim on the leading edge)
     and the emissive layer (crimson light through the thin trailing edges and the veins, a violet rim) ---- */
  function* wingGen(ki, p, res) {
    const P = ki === 3 ? FLARE : wingParams(FOLDK[ki], p / NP), G = wingGeo(P), s = BK.px, px = 1 / s;
    let x0 = 0, y0 = 0, x1 = 0, y1 = 0; for (const q of [G.E, G.W, G.hip, ...G.tips, ...G.mids]) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
    const pad = 0.06 * s + 4, W = (x1 - x0) * s + pad * 2, Hh = (y1 - y0) * s + pad * 2, ox = -x0 * s + pad, oy = -y0 * s + pad;
    const cv = mk(W, Hh), em = mk(W, Hh), g = cv.getContext('2d'), e = em.getContext('2d');
    for (const c of [g, e]) { c.translate(ox, oy); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round'; }
    const fan = G.tips.concat([G.hip]);   // (the panel edges: four fingers and the body side)
    // thickness: the underside's dark edge, offset down-right
    g.save(); g.translate(0.9 * px, 1.7 * px); memPath(g, G); g.fillStyle = '#040106'; g.fill(); g.restore();
    // the leather: darker toward the trailing edge, a soft leathery light from the upper left
    memPath(g, G); let gr = g.createRadialGradient(G.W[0], G.W[1], 0, G.W[0], G.W[1], 0.5); gr.addColorStop(0, '#47294D'); gr.addColorStop(0.4, '#2E1733'); gr.addColorStop(0.8, '#1D0C22'); gr.addColorStop(1, '#150711'); g.fillStyle = gr; g.fill();
    g.save(); memPath(g, G); g.clip();
    gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(190,140,215,0.16)'); gr.addColorStop(0.5, 'rgba(120,80,150,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0.18)'); g.fillStyle = gr; g.fillRect(x0 - 0.1, y0 - 0.1, x1 - x0 + 0.2, y1 - y0 + 0.2);
    yield 0;
    // tension wrinkles: the panel's iso-lines from the wrist, a dark crease with a lit lip
    for (let i = 0; i < 4; i++) { const a = fan[i], b = fan[i + 1], q = scal(G, a, b, i === 3 ? 0.2 : 0.26);
      for (let w = 0; w < 5; w++) { const f = 0.42 + w * 0.12 + 0.03 * R1(i * 7 + w + p), A = [lerp(G.W[0], a[0], f), lerp(G.W[1], a[1], f)], B = [lerp(G.W[0], b[0], f), lerp(G.W[1], b[1], f)], Q = [lerp(G.W[0], q[0], f), lerp(G.W[1], q[1], f)];
        g.strokeStyle = 'rgba(0,0,0,0.32)'; g.lineWidth = 0.8 * px; g.beginPath(); g.moveTo(A[0], A[1]); g.quadraticCurveTo(Q[0], Q[1], B[0], B[1]); g.stroke();
        g.strokeStyle = 'rgba(170,120,190,0.09)'; g.beginPath(); g.moveTo(A[0] - 0.6 * px, A[1] - 0.8 * px); g.quadraticCurveTo(Q[0] - 0.6 * px, Q[1] - 0.8 * px, B[0] - 0.6 * px, B[1] - 0.8 * px); g.stroke(); } }
    // a fine grain
    for (let i = 0; i < 90; i++) { const x = lerp(x0, x1, R1(i * 3.3 + p * 1.7 + ki)), y = lerp(y0, y1, R1(i * 5.1 + p + ki * 2.3)); g.fillStyle = R1(i * 9.7) < 0.5 ? 'rgba(200,160,220,0.07)' : 'rgba(0,0,0,0.16)'; g.beginPath(); g.arc(x, y, (0.6 + R1(i) * 0.7) * px, 0, TAU); g.fill(); }
    // the light coming through the thin trailing edges (inside the edge: clipped)
    trailPath(g, G); g.strokeStyle = 'rgba(110,8,32,0.3)'; g.lineWidth = 0.09; g.stroke(); g.strokeStyle = 'rgba(170,22,54,0.22)'; g.lineWidth = 0.035; g.stroke();
    // veins: from each finger into its panel, branching
    const veins = []; for (let i = 0; i < 4; i++) for (let v = 0; v < 2; v++) { const a = fan[i], b = fan[i + 1], f0 = 0.3 + 0.28 * v + 0.08 * R1(i * 3 + v), P0 = [lerp(G.W[0], a[0], f0), lerp(G.W[1], a[1], f0)], f1 = f0 + 0.3, P1 = [lerp(lerp(G.W[0], a[0], f1), lerp(G.W[0], b[0], f1), 0.45), lerp(lerp(G.W[1], a[1], f1), lerp(G.W[1], b[1], f1), 0.45)], Pm = [lerp(P0[0], P1[0], 0.5) + (b[0] - a[0]) * 0.08, lerp(P0[1], P1[1], 0.5) + (b[1] - a[1]) * 0.08], Pb = [lerp(P1[0], lerp(G.W[0], b[0], f1 + 0.1), 0.6), lerp(P1[1], lerp(G.W[1], b[1], f1 + 0.1), 0.6)]; veins.push([P0, Pm, P1, Pb]); }
    const veinPath = c => { c.beginPath(); for (const [P0, Pm, P1, Pb] of veins) { c.moveTo(P0[0], P0[1]); c.quadraticCurveTo(Pm[0], Pm[1], P1[0], P1[1]); c.moveTo(lerp(P0[0], P1[0], 0.6), lerp(P0[1], P1[1], 0.6)); c.lineTo(Pb[0], Pb[1]); } };
    veinPath(g); g.strokeStyle = 'rgba(80,6,24,0.75)'; g.lineWidth = 0.9 * px; g.stroke();
    // deep folds at the joints
    for (const [J, r] of [[G.W, 0.075], [G.E, 0.07], [[0, 0], 0.08]]) { const gj = g.createRadialGradient(J[0], J[1], 0, J[0], J[1], r); gj.addColorStop(0, 'rgba(0,0,0,0.55)'); gj.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gj; g.fillRect(J[0] - r, J[1] - r, r * 2, r * 2); }
    g.restore(); yield 0;
    // the outline (a soft dark edge), then the bones: tapered, a lit upper edge, knuckles, the thumb's claw
    memPath(g, G); g.strokeStyle = 'rgba(8,2,10,0.85)'; g.lineWidth = 1.1 * px; g.stroke();
    const bone = (a, b, w0, w1) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; g.beginPath(); g.moveTo(a[0] + nx * w0 / 2, a[1] + ny * w0 / 2); g.lineTo(b[0] + nx * w1 / 2, b[1] + ny * w1 / 2); g.lineTo(b[0] - nx * w1 / 2, b[1] - ny * w1 / 2); g.lineTo(a[0] - nx * w0 / 2, a[1] - ny * w0 / 2); g.closePath(); g.fillStyle = '#1C0E21'; g.fill(); g.strokeStyle = 'rgba(6,1,8,0.9)'; g.lineWidth = 0.7 * px; g.stroke();
      const sg = (nx * -0.6 + ny * -0.8) > 0 ? 1 : -1; g.strokeStyle = 'rgba(205,165,235,0.5)'; g.lineWidth = 0.7 * px; g.beginPath(); g.moveTo(a[0] + sg * nx * w0 * 0.3, a[1] + sg * ny * w0 * 0.3); g.lineTo(b[0] + sg * nx * w1 * 0.3, b[1] + sg * ny * w1 * 0.3); g.stroke(); };
    bone([0, 0], G.E, 0.05, 0.04); bone(G.E, G.W, 0.04, 0.03);
    for (let i = 0; i < 4; i++) { bone(G.W, G.mids[i], 0.024, 0.016); bone(G.mids[i], G.tips[i], 0.016, 0.006); }
    for (const [J, r] of [[G.E, 0.026], [G.W, 0.022]]) { const gk = g.createRadialGradient(J[0] - r * 0.4, J[1] - r * 0.4, 0, J[0], J[1], r); gk.addColorStop(0, '#5A4266'); gk.addColorStop(0.6, '#24132A'); gk.addColorStop(1, '#0C0510'); g.fillStyle = gk; g.beginPath(); g.arc(J[0], J[1], r, 0, TAU); g.fill(); }
    { const a = G.al - 0.9, W0 = G.W, t1 = [W0[0] + Math.cos(a) * 0.05, W0[1] + Math.sin(a) * 0.05], t2 = [t1[0] + Math.cos(a + 1.2) * 0.022, t1[1] + Math.sin(a + 1.2) * 0.022]; g.strokeStyle = '#2A1830'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(W0[0], W0[1]); g.lineTo(t1[0], t1[1]); g.stroke(); g.strokeStyle = '#E8DDF0'; g.lineWidth = 0.008; g.beginPath(); g.moveTo(t1[0], t1[1]); g.quadraticCurveTo(t1[0] + Math.cos(a) * 0.012, t1[1] + Math.sin(a) * 0.012, t2[0], t2[1]); g.stroke(); }
    // the ruby rim along the leading edge (the lit side)
    { const W0 = G.W, lc = [W0[0] * 0.5 - W0[1] * 0.12, W0[1] * 0.5 + W0[0] * 0.12 - 0.02]; g.strokeStyle = 'rgba(255,90,125,0.42)'; g.lineWidth = 0.8 * px; g.beginPath(); g.moveTo(0, -1.2 * px); g.quadraticCurveTo(lc[0], lc[1] - 1.2 * px, W0[0], W0[1] - 1.2 * px); g.lineTo(G.mids[0][0], G.mids[0][1] - 1 * px); g.lineTo(G.tips[0][0], G.tips[0][1] - 0.8 * px); g.stroke(); }
    yield 0;
    // the emissive layer
    e.save(); memPath(e, G); e.clip(); trailPath(e, G); e.strokeStyle = 'rgba(200,22,60,0.4)'; e.lineWidth = 0.07; e.stroke(); e.strokeStyle = 'rgba(255,70,100,0.45)'; e.lineWidth = 0.02; e.stroke();
    veinPath(e); e.strokeStyle = 'rgba(230,30,70,0.7)'; e.lineWidth = 1.2 * px; e.stroke(); e.strokeStyle = 'rgba(255,120,150,0.5)'; e.lineWidth = 0.5 * px; e.stroke(); e.restore();
    trailPath(e, G); e.strokeStyle = 'rgba(165,92,255,0.35)'; e.lineWidth = 0.9 * px; e.stroke();
    yield 0;
    Object.assign(res, { cv, em, ox, oy, s, th: P.th, ready: true });
  }

  /* ---- the body: soft dark fur (gradient, a few hundred hairs, a fuzzy silhouette), a lighter belly, the collar ruff in
     the pet's colour, the face: muzzle, nose leaf, glowing ruby eyes under a brow, small fangs ---- */
  const TOR = [0, 0.08, 0.145, 0.2], HEAD = [0, -0.15, 0.125];
  const inTor = (x, y) => ((x - TOR[0]) / TOR[2]) ** 2 + ((y - TOR[1]) / TOR[3]) ** 2 < 1, inHead = (x, y) => Math.hypot(x - HEAD[0], y - HEAD[1]) < HEAD[2];
  const bodyPath = g => { g.beginPath(); g.ellipse(TOR[0], TOR[1], TOR[2], TOR[3], 0, 0, TAU); g.moveTo(HEAD[0] + HEAD[2], HEAD[1]); g.arc(HEAD[0], HEAD[1], HEAD[2], 0, TAU); g.moveTo(0.12, -0.1); g.ellipse(0, -0.1, 0.12, 0.08, 0, 0, TAU); };
  function* bodyGen(acc, res) {
    const s = BK.px, px = 1 / s, pad = 4, cv = mk(0.46 * s + pad * 2, 0.64 * s + pad * 2), ox = 0.23 * s + pad, oy = 0.31 * s + pad, g = cv.getContext('2d');
    g.translate(ox, oy); g.scale(s, s); g.lineCap = 'round';
    const fur = mixHex('#2A1C33', acc, 0.12), ruff = mixHex(acc, '#1E1426', 0.5);
    bodyPath(g); let gr = g.createRadialGradient(-0.07, -0.13, 0.01, 0, 0, 0.42); gr.addColorStop(0, '#54406A'); gr.addColorStop(0.3, fur); gr.addColorStop(0.7, '#150D1B'); gr.addColorStop(1, '#09050C'); g.fillStyle = gr; g.fill();
    g.save(); bodyPath(g); g.clip();
    gr = g.createRadialGradient(0.0, 0.14, 0, 0.0, 0.14, 0.15); gr.addColorStop(0, 'rgba(98,54,72,0.6)'); gr.addColorStop(1, 'rgba(98,54,72,0)'); g.fillStyle = gr; g.fillRect(-0.2, -0.05, 0.4, 0.4);
    gr = g.createRadialGradient(0, -0.03, 0, 0, -0.03, 0.15); gr.addColorStop(0, rgba(ruff, 0.55)); gr.addColorStop(1, rgba(ruff, 0)); g.fillStyle = gr; g.save(); g.scale(1, 0.5); g.fillRect(-0.2, -0.36, 0.4, 0.4); g.restore();
    yield 0;
    // hairs: away from the head's middle on the head, down and out on the body; lit from the upper left
    let n = 0; for (let i = 0; i < 900 && n < 300; i++) { const x = (R1(i * 1.37 + 0.2) - 0.5) * 0.32, y = -0.28 + R1(i * 2.71 + 0.9) * 0.58; const onH = inHead(x, y); if (!onH && !inTor(x, y)) continue; n++;
      const a = onH ? Math.atan2(y - HEAD[1], x - HEAD[0]) : Math.atan2(1, x * 3) + (R1(i) - 0.5) * 0.5, L = 0.022 + R1(i * 3.3) * 0.03, lit = cl(0.5 - x * 2.2 - (y + 0.1) * 1.6), neck = Math.abs(y + 0.03) < 0.035;
      g.strokeStyle = neck && R1(i * 5.5) < 0.7 ? rgba(mixHex(ruff, '#FFFFFF', 0.15), 0.35 + 0.3 * lit) : R1(i * 7.7) < 0.55 ? `rgba(${150 + 40 * lit | 0},${118 + 30 * lit | 0},${170 + 30 * lit | 0},${0.12 + 0.22 * lit})` : 'rgba(0,0,0,0.38)';
      g.lineWidth = (0.7 + R1(i) * 0.6) * px; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + 0.004, y + Math.sin(a) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); if ((n & 63) === 63) yield 0; }
    g.restore(); yield 0;
    // the fuzzy silhouette: hairs out of the outline (dark, a few lit on the upper left), a violet rim lower right
    for (let i = 0; i < 160; i++) { const a = i / 160 * TAU, onT = i % 2 === 0; let x, y, nx, ny;
      if (onT) { x = TOR[0] + Math.cos(a) * TOR[2]; y = TOR[1] + Math.sin(a) * TOR[3]; if (inHead(x, y)) continue; nx = Math.cos(a) / TOR[2]; ny = Math.sin(a) / TOR[3]; } else { x = HEAD[0] + Math.cos(a) * HEAD[2]; y = HEAD[1] + Math.sin(a) * HEAD[2]; if (inTor(x, y)) continue; nx = Math.cos(a); ny = Math.sin(a); }
      const q = Math.hypot(nx, ny); nx /= q; ny /= q; const L = 0.012 + R1(i * 4.1) * 0.022, lit = cl(-(nx * 0.6 + ny * 0.8)), rim = cl(nx * 0.6 + ny * 0.8);
      g.strokeStyle = lit > 0.5 && R1(i * 2.2) < 0.6 ? `rgba(160,130,190,${0.35 * lit})` : rim > 0.55 && R1(i * 3.9) < 0.5 ? `rgba(165,92,255,${0.45 * rim})` : 'rgba(12,6,16,0.85)';
      g.lineWidth = (0.8 + R1(i) * 0.5) * px; g.beginPath(); g.moveTo(x - nx * 0.01, y - ny * 0.01); g.lineTo(x + nx * L + ny * L * 0.3 * (R1(i * 6) - 0.5), y + ny * L - nx * L * 0.3 * (R1(i * 6) - 0.5)); g.stroke(); }
    g.save(); bodyPath(g); g.clip(); g.strokeStyle = 'rgba(165,92,255,0.35)'; g.lineWidth = 1.4 * px; g.beginPath(); g.ellipse(TOR[0] - 0.004, TOR[1] - 0.004, TOR[2], TOR[3], 0, -0.4, 1.9); g.stroke(); g.strokeStyle = 'rgba(220,190,245,0.25)'; g.beginPath(); g.arc(HEAD[0] + 0.004, HEAD[1] + 0.004, HEAD[2], 3.5, 4.6); g.stroke(); g.restore();
    yield 0;
    // the face
    gr = g.createRadialGradient(-0.015, -0.115, 0, 0, -0.1, 0.065); gr.addColorStop(0, '#5A3A4E'); gr.addColorStop(0.7, '#2E1A28'); gr.addColorStop(1, 'rgba(30,16,26,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, -0.1, 0.065, 0.048, 0, 0, TAU); g.fill();
    g.fillStyle = '#2A1420'; g.beginPath(); g.moveTo(0, -0.152); g.quadraticCurveTo(0.024, -0.13, 0.018, -0.112); g.lineTo(-0.018, -0.112); g.quadraticCurveTo(-0.024, -0.13, 0, -0.152); g.fill(); g.strokeStyle = 'rgba(200,150,190,0.4)'; g.lineWidth = 0.7 * px; g.beginPath(); g.moveTo(-0.006, -0.145); g.lineTo(-0.012, -0.118); g.stroke();
    g.fillStyle = '#0A0306'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 0.009, -0.108, 0.004, 0.003, 0, 0, TAU); g.fill(); }
    g.strokeStyle = '#0A0306'; g.lineWidth = 1.1 * px; g.beginPath(); g.moveTo(-0.032, -0.09); g.quadraticCurveTo(0, -0.078, 0.032, -0.09); g.stroke();
    for (const sd of [-1, 1]) { g.fillStyle = '#F6EEF8'; g.beginPath(); g.moveTo(sd * 0.024, -0.087); g.lineTo(sd * 0.013, -0.085); g.lineTo(sd * 0.019, -0.064); g.closePath(); g.fill(); g.fillStyle = 'rgba(120,90,130,0.5)'; g.beginPath(); g.moveTo(sd * 0.019, -0.086); g.lineTo(sd * 0.0175, -0.068); g.lineTo(sd * 0.021, -0.07); g.closePath(); g.fill(); }
    for (const sd of [-1, 1]) { const ex = sd * 0.052, ey = -0.168; g.save(); g.translate(ex, ey); g.rotate(-sd * 0.3);
      g.fillStyle = '#0A0206'; g.beginPath(); g.ellipse(0, 0, 0.032, 0.025, 0, 0, TAU); g.fill();
      const gi = g.createRadialGradient(-0.005, -0.004, 0, 0, 0, 0.022); gi.addColorStop(0, '#FF6A82'); gi.addColorStop(0.45, '#E0183F'); gi.addColorStop(0.85, '#5A0014'); gi.addColorStop(1, '#2A0008'); g.fillStyle = gi; g.beginPath(); g.ellipse(0, 0.002, 0.024, 0.019, 0, 0, TAU); g.fill();
      g.fillStyle = '#1A0006'; g.beginPath(); g.ellipse(0, 0.002, 0.006, 0.012, 0, 0, TAU); g.fill();
      g.scale(sd, 1); g.strokeStyle = '#08030A'; g.lineWidth = 2.4 * px; g.beginPath(); g.moveTo(0.038, -0.034); g.quadraticCurveTo(0.004, -0.03, -0.032, -0.02); g.stroke(); g.restore();
      g.fillStyle = 'rgba(255,240,245,0.95)'; g.beginPath(); g.arc(ex - 0.008, ey - 0.006, 0.0055, 0, TAU); g.fill(); }
    yield 0;
    Object.assign(res, { cv, ox, oy, s, ready: true });
  }
  /* ---- an ear (the right one; mirrored for the left): furred outside, a thin skin inside lit crimson from behind, ridges ---- */
  function* earGen(acc, res) {
    const s = BK.px, px = 1 / s, pad = 4, cv = mk(0.18 * s + pad * 2, 0.26 * s + pad * 2), ox = 0.075 * s + pad, oy = 0.225 * s + pad, g = cv.getContext('2d'); g.translate(ox, oy); g.scale(s, s); g.lineCap = 'round';
    const ear = k => { g.beginPath(); g.moveTo(-0.048 * k, 0.012); g.quadraticCurveTo(-0.052 * k, -0.12 * k, 0.034 * k, -0.205 * k); g.quadraticCurveTo(0.078 * k, -0.08 * k, 0.05 * k, 0.016); g.closePath(); };
    ear(1); let gr = g.createLinearGradient(-0.05, -0.2, 0.06, 0.02); gr.addColorStop(0, '#4E3A60'); gr.addColorStop(0.5, '#22162A'); gr.addColorStop(1, '#0C0610'); g.fillStyle = gr; g.fill();
    g.save(); g.translate(0.004, -0.004); ear(0.7); g.restore(); gr = g.createLinearGradient(0, -0.15, 0, 0.01); gr.addColorStop(0, mixHex('#C0284E', acc, 0.2)); gr.addColorStop(0.35, mixHex('#6A2240', acc, 0.25)); gr.addColorStop(1, '#2A0E1C'); g.fillStyle = gr; g.fill();
    g.save(); g.translate(0.004, -0.004); ear(0.7); g.restore(); g.save(); g.clip(); g.strokeStyle = 'rgba(20,4,12,0.6)'; g.lineWidth = 0.9 * px; for (let i = 0; i < 4; i++) { const y = -0.02 - i * 0.03; g.beginPath(); g.moveTo(-0.03, y); g.quadraticCurveTo(0.01, y - 0.012, 0.04, y + 0.004); g.stroke(); } g.restore();
    ear(1); g.strokeStyle = 'rgba(8,3,10,0.9)'; g.lineWidth = 1 * px; g.stroke();
    g.strokeStyle = 'rgba(215,185,245,0.45)'; g.lineWidth = 0.9 * px; g.beginPath(); g.moveTo(-0.046, 0.0); g.quadraticCurveTo(-0.05, -0.118, 0.03, -0.198); g.stroke();
    for (let i = 0; i < 18; i++) { const u = i / 18, x = lerp(0.05, 0.034, u) + 0.02 * Math.sin(u * 3), y = lerp(0.01, -0.19, u); g.strokeStyle = 'rgba(12,6,16,0.8)'; g.lineWidth = 0.8 * px; g.beginPath(); g.moveTo(x - 0.004, y); g.lineTo(x + 0.008 + R1(i) * 0.006, y - 0.004); g.stroke(); }
    yield 0; Object.assign(res, { cv, ox, oy, s, ready: true });
  }

  /* ---- the darkness sphere (fixed size, drawn scaled): a midnight core with swirled smoke texture, lit dimly from the
     upper left; an additive rim (violet up-left turning crimson down-right) and a small specular; two swirling smoke
     layers turned in opposite directions inside it; fissures of light; curved shell fragments ---- */
  const SPN = 160, SPC = 80, SPR = 76, LV = (() => { const l = [-0.45, -0.6, 0.66], q = Math.hypot(...l); return l.map(x => x / q); })();
  function* sphereGen(res) {
    const cv = mk(SPN, SPN), g = cv.getContext('2d'), im = g.createImageData(SPN, SPN), d = im.data; yield 0;
    for (let y = 0; y < SPN; y++) { for (let x = 0; x < SPN; x++) { const dx = (x + 0.5 - SPC) / SPR, dy = (y + 0.5 - SPC) / SPR, r2 = dx * dx + dy * dy; if (r2 > 1.05) continue;
        const r = Math.sqrt(r2), nz = Math.sqrt(Math.max(0, 1 - r2)), ndl = Math.max(0, dx * LV[0] + dy * LV[1] + nz * LV[2]);
        const an = Math.atan2(dy, dx) + 2.4 * r, t1 = fbm(Math.cos(an) * r * 2.6 + 3.1, Math.sin(an) * r * 2.6 + 1.7), t2 = fbm(dx * 5 + 11, dy * 5 + 4);
        const core = 0.28 + 0.72 * Math.pow(1 - nz, 0.7), lit = (0.25 + 0.75 * ndl) * core;
        let R = 8 + 34 * lit, G = 5 + 14 * lit, B = 15 + 52 * lit;
        const band = sstep(0.5, 0.72, t1) * 0.55 + sstep(0.62, 0.8, t2) * 0.25; R += 50 * band * (0.4 + lit); G += 30 * band * (0.4 + lit); B += 70 * band * (0.4 + lit);
        const o = (y * SPN + x) * 4; d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255 * cl((1 - r) * SPR / 1.6 + 0.5); }
      if (y % 6 === 5) yield 0; }
    g.putImageData(im, 0, 0); yield 0; Object.assign(res, { cv, ready: true });
  }
  function* sphereRimGen(res) {
    const cv = mk(SPN, SPN), g = cv.getContext('2d'), im = g.createImageData(SPN, SPN), d = im.data; yield 0;
    const hv = [LV[0], LV[1], LV[2] + 1], hq = Math.hypot(...hv); hv[0] /= hq; hv[1] /= hq; hv[2] /= hq;
    for (let y = 0; y < SPN; y++) { for (let x = 0; x < SPN; x++) { const dx = (x + 0.5 - SPC) / SPR, dy = (y + 0.5 - SPC) / SPR, r2 = dx * dx + dy * dy; if (r2 > 1.05) continue;
        const r = Math.sqrt(r2), nz = Math.sqrt(Math.max(0, 1 - r2)), fr = Math.pow(1 - nz, 3), ndh = Math.max(0, dx * hv[0] + dy * hv[1] + nz * hv[2]), sp = Math.pow(ndh, 60) * 0.85;
        const cr = 0.5 + 0.5 * Math.cos(Math.atan2(dy, dx) - 0.8), edge = Math.exp(-Math.pow((r - 0.975) / 0.03, 2)) * 0.55, I = cl(fr * 0.85 + edge) * cl((1 - r) * SPR / 1.6 + 0.5);
        const o = (y * SPN + x) * 4; d[o] = lerp(165, 235, cr) * I + 210 * sp; d[o + 1] = lerp(92, 30, cr) * I + 190 * sp; d[o + 2] = lerp(255, 80, cr) * I + 250 * sp; d[o + 3] = 255 * cl(I + sp); }
      if (y % 8 === 7) yield 0; }
    g.putImageData(im, 0, 0); yield 0; Object.assign(res, { cv, ready: true });
  }
  function* swirlGen(v, res) {
    const N = 128, c0 = 64, cv = mk(N, N), g = cv.getContext('2d'), im = g.createImageData(N, N), d = im.data, col = v ? [96, 26, 70] : [92, 52, 140]; yield 0;
    for (let y = 0; y < N; y++) { for (let x = 0; x < N; x++) { const dx = (x + 0.5 - c0) / c0, dy = (y + 0.5 - c0) / c0, r = Math.hypot(dx, dy); if (r > 1) continue;
        const an = Math.atan2(dy, dx) + (v ? 4.2 : 3) * (1 - r), n = fbm(Math.cos(an) * (1.2 + r * 2) + v * 7, Math.sin(an) * (1.2 + r * 2) + v * 3), a = sstep(0.48, 0.78, n) * (1 - Math.pow(r, 4)) * 0.85;
        const o = (y * N + x) * 4; d[o] = col[0] + 60 * a; d[o + 1] = col[1] + 30 * a; d[o + 2] = col[2] + 60 * a; d[o + 3] = 255 * a; }
      if (y % 8 === 7) yield 0; }
    g.putImageData(im, 0, 0); yield 0; Object.assign(res, { cv, ready: true });
  }
  function* fisGen(res) {
    const cv = mk(SPN, SPN), g = cv.getContext('2d'); g.translate(SPC, SPC); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.arc(0, 0, SPR * 0.97, 0, TAU); g.clip(); g.globalCompositeOperation = 'lighter';
    const cracks = []; for (let i = 0; i < 8; i++) { let a = i / 8 * TAU + R1(i) * 0.6, r = SPR * (0.05 + 0.1 * R1(i * 3)); const pts = [[Math.cos(a) * r, Math.sin(a) * r]]; while (r < SPR * 0.98) { r += 7 + R1(i * 9 + r) * 9; a += (R1(i * 5 + r * 0.3) - 0.5) * 0.7; pts.push([Math.cos(a) * r, Math.sin(a) * r]); if (R1(r + i) < 0.18) { const b = a + (R1(r) < 0.5 ? 0.7 : -0.7); cracks.push([pts[pts.length - 1], [Math.cos(b) * (r + 14), Math.sin(b) * (r + 14)], [Math.cos(b + 0.2) * (r + 24), Math.sin(b + 0.2) * (r + 24)]]); } } cracks.push(pts); }
    yield 0;
    for (const [lw, col] of [[7, 'rgba(209,24,63,0.22)'], [3.2, 'rgba(165,92,255,0.55)'], [1.3, 'rgba(255,200,225,0.95)']]) { g.strokeStyle = col; g.lineWidth = lw; for (const pts of cracks) { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, SPR * 0.45); gr.addColorStop(0, 'rgba(255,150,190,0.5)'); gr.addColorStop(1, 'rgba(165,92,255,0)'); g.fillStyle = gr; g.fillRect(-SPR, -SPR, SPR * 2, SPR * 2);
    yield 0; Object.assign(res, { cv, ready: true });
  }
  function* fragGen(v, res) {
    const N = 64, cv = mk(N, N), g = cv.getContext('2d'), span = [0.7, 1.0, 0.5][v], r0 = 16 + 2 * v, r1 = r0 + [9, 7, 11][v]; g.translate(N / 2, N / 2 + (r0 + r1) / 2); g.lineJoin = 'round';
    const a0 = -Math.PI / 2 - span / 2, a1 = -Math.PI / 2 + span / 2, shape = () => { g.beginPath(); g.arc(0, 0, r1, a0, a1); g.lineTo(Math.cos(a1 - 0.08) * r0, Math.sin(a1 - 0.08) * r0); g.arc(0, 0, r0, a1 - 0.08, a0 + 0.1, true); g.closePath(); };
    shape(); const gr = g.createLinearGradient(0, -r1, 0, -r0); gr.addColorStop(0, '#3A2450'); gr.addColorStop(0.5, '#160C22'); gr.addColorStop(1, '#07030C'); g.fillStyle = gr; g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(165,92,255,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, r1, a0, a1); g.stroke(); g.strokeStyle = 'rgba(255,80,130,0.9)'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, r0, a1 - 0.08, a0 + 0.1, true); g.stroke();
    yield 0; Object.assign(res, { cv, ready: true });
  }

  /* ---- small effect sprites (fxSprite: made once, each well under a millisecond) ---- */
  const radial = (g, S, stops) => { const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const [k, c] of stops) gr.addColorStop(k, c); g.fillStyle = gr; g.fillRect(0, 0, S, S); };
  const mistSpr = v => fxSprite('drc_mist' + v, 64, 64, g => { for (let i = 0; i < 6; i++) { const a = R1(i * 3 + v * 11) * TAU, d = 6 + R1(i + v) * 8, x = 32 + Math.cos(a) * d, y = 32 + Math.sin(a) * d, r = 14 + R1(i * 7 + v) * 10, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, v === 2 ? 'rgba(150,90,230,0.22)' : 'rgba(34,16,48,0.42)'); gr.addColorStop(0.6, v === 2 ? 'rgba(120,60,200,0.08)' : 'rgba(30,14,44,0.18)'); gr.addColorStop(1, 'rgba(30,14,44,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); } });
  const dropSpr = () => fxSprite('drc_drop', 32, 32, g => { g.fillStyle = 'rgba(70,0,14,0.5)'; g.beginPath(); g.arc(16.6, 17, 11.5, 0, TAU); g.fill(); const gr = g.createRadialGradient(12, 12, 1, 16, 16, 11); gr.addColorStop(0, '#FF6F86'); gr.addColorStop(0.35, '#D0183F'); gr.addColorStop(0.8, '#7A0620'); gr.addColorStop(1, '#3E0010'); g.fillStyle = gr; g.beginPath(); g.arc(16, 16, 11, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(11.5, 11, 3.2, 2.2, -0.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,160,180,0.5)'; g.beginPath(); g.arc(20, 21, 2, 0, TAU); g.fill(); });
  const RW = [0.06, 0.12, 0.22];
  const ringSpr = (kind, b) => fxSprite('drc_ring' + kind + b, 256, 256, g => { const w = RW[b];
    radial(g, 256, kind === 'c' ? [[0, 'rgba(160,10,40,0)'], [1 - w, 'rgba(160,10,40,0)'], [1 - 0.6 * w, 'rgba(180,16,50,0.45)'], [1 - 0.3 * w, 'rgba(255,60,95,0.85)'], [1 - 0.1 * w, 'rgba(180,16,50,0.3)'], [1, 'rgba(160,10,40,0)']]
      : [[0, 'rgba(165,92,255,0)'], [1 - w, 'rgba(165,92,255,0)'], [1 - 0.75 * w, 'rgba(200,30,70,0.5)'], [1 - 0.45 * w, 'rgba(255,120,170,0.9)'], [1 - 0.22 * w, 'rgba(165,92,255,0.75)'], [1, 'rgba(120,60,220,0)']]); });
  const starSpr = () => fxSprite('drc_star', 64, 64, g => { g.globalCompositeOperation = 'lighter'; radial(g, 64, [[0, 'rgba(255,255,255,1)'], [0.15, 'rgba(255,190,210,0.8)'], [0.45, 'rgba(255,45,85,0.25)'], [1, 'rgba(255,45,85,0)']]); for (let i = 0; i < 4; i++) { g.save(); g.translate(32, 32); g.rotate(i * Math.PI / 4); g.scale(1, i % 2 ? 0.05 : 0.08); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 31); gr.addColorStop(0, 'rgba(255,240,245,0.9)'); gr.addColorStop(1, 'rgba(255,45,85,0)'); g.fillStyle = gr; g.fillRect(-32, -32, 64, 64); g.restore(); } });
  const WARM = [() => mistSpr(0), () => mistSpr(1), () => mistSpr(2), () => dropSpr(), () => starSpr(), () => glowSprite(RUBY), () => glowSprite(EDGE), () => glowSprite(CRIM)];
  for (const k of ['c', 'v']) for (let b = 0; b < RW.length; b++) WARM.push(() => ringSpr(k, b));
  const pickB = q => (q < 0.09 ? 0 : q < 0.17 ? 1 : 2);
  function ringF(c, kind, X, Y, r, thick, a, gy) { if (r < 2 || !(a > 0.01)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); const ry = r * (gy == null ? 0.55 : gy); c.drawImage(ringSpr(kind, pickB(thick / r)), X - r, Y - ry, r * 2, ry * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  function glowF(c, X, Y, r, col, a, gy) { if (r < 1 || !(a > 0.006)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); const ry = r * (gy || 1); c.drawImage(glowSprite(col), X - r, Y - ry, r * 2, ry * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }

  /* ================= drawing the bat =================
     B: s (px per unit), roll, pitch (0..1, nose down), ph (flap phase), k (fold 0..1), flare (0..1), a (alpha), emA (the
     wings' emissive light), pulse (the heal's crimson pulse), eye, bite (the fang flash), asym (bank: -..+), wob (ears) */
  function fallbackWing(c, s, k, ph) { const G = wingGeo(wingParams(k, ph)); c.save(); c.scale(s, s); memPath(c, G); c.fillStyle = '#24122A'; c.fill(); c.strokeStyle = 'rgba(165,92,255,0.5)'; c.lineWidth = 1.2 / s; c.stroke(); c.restore(); }
  function drawBat(c, X, Y, B, t, acc) {
    const s = B.s; if (s < 2 || !(B.a > 0.01)) return;
    c.save(); c.translate(X, Y); c.rotate(B.roll); c.scale(1, 1 - 0.12 * B.pitch);
    glowF(c, 0, 0, s * 0.95, EDGE, 0.16 * B.a);   // (a narrow violet back-light: the dark bat reads on dark floors)
    c.globalAlpha = B.a;
    const kk = cl(B.k), ki = B.flare > 0.5 ? 3 : Math.round(kk * 2), pf = ((B.ph % 1) + 1) % 1, p = ki === 3 ? 0 : Math.round(pf * NP) % NP;
    let dth = 0; if (ki < 3) dth = Math.max(-0.4, Math.min(0.4, wingParams(kk, pf).th - wingParams(FOLDK[ki], p / NP).th));
    const spr = wingFrame(ki, p), ws = 1 + 0.12 * B.flare;
    for (const sd of [-1, 1]) { c.save(); c.translate(sd * SHO[0] * s, SHO[1] * s); c.rotate(sd * dth); c.scale(sd * ws * (1 + sd * B.asym), ws * (1 + sd * B.asym * 0.3));
      if (spr) { const f = s / spr.s; c.drawImage(spr.cv, -spr.ox * f, -spr.oy * f, spr.cv.width * f, spr.cv.height * f); if (B.emA > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = B.a * Math.min(1, B.emA); c.drawImage(spr.em, -spr.ox * f, -spr.oy * f, spr.cv.width * f, spr.cv.height * f); c.globalCompositeOperation = 'source-over'; c.globalAlpha = B.a; } }
      else fallbackWing(c, s, ki === 3 ? 0 : FOLDK[ki], pf);
      c.restore(); }
    // the tail membrane and the feet (a little sway)
    { const sw = Math.sin(t * 7.3) * 0.022 * (1 - 0.5 * kk), u = s; c.fillStyle = '#1A0D1F'; c.beginPath(); c.moveTo(-0.055 * u, 0.235 * u); c.quadraticCurveTo(sw * u, 0.33 * u, sw * 1.4 * u, 0.375 * u); c.quadraticCurveTo(sw * u + 0.01 * u, 0.33 * u, 0.055 * u, 0.235 * u); c.closePath(); c.fill(); c.strokeStyle = 'rgba(165,92,255,0.35)'; c.lineWidth = Math.max(0.6, 0.006 * u); c.stroke();
      c.strokeStyle = '#120914'; c.lineWidth = Math.max(1, 0.016 * u); c.lineCap = 'round'; for (const sd of [-1, 1]) { const fx2 = (sd * 0.06 + sw * sd * 0.6) * u, fy = 0.33 * u; c.beginPath(); c.moveTo(sd * 0.045 * u, 0.22 * u); c.lineTo(fx2, fy); c.stroke(); c.strokeStyle = 'rgba(225,210,235,0.7)'; c.lineWidth = Math.max(0.6, 0.007 * u); for (const q of [-1, 1]) { c.beginPath(); c.moveTo(fx2, fy); c.lineTo(fx2 + q * 0.012 * u, fy + 0.016 * u); c.stroke(); } c.strokeStyle = '#120914'; c.lineWidth = Math.max(1, 0.016 * u); } }
    // the ears (behind the head's crown), then the body
    { const er = get('E' + acc); for (const sd of [-1, 1]) { c.save(); c.translate(sd * 0.066 * s, -0.24 * s); c.rotate(sd * (0.2 + B.wob)); c.scale(sd, 1);
        if (er) { const f = s / er.s; c.drawImage(er.cv, -er.ox * f, -er.oy * f, er.cv.width * f, er.cv.height * f); } else { c.fillStyle = '#22162A'; c.beginPath(); c.moveTo(-0.045 * s, 0.01 * s); c.lineTo(0.034 * s, -0.2 * s); c.lineTo(0.05 * s, 0.015 * s); c.fill(); }
        c.restore(); } }
    { const bd = get('B' + acc); if (bd) { const f = s / bd.s; c.drawImage(bd.cv, -bd.ox * f, -bd.oy * f, bd.cv.width * f, bd.cv.height * f); } else { c.fillStyle = '#1E1426'; c.beginPath(); c.ellipse(0, TOR[1] * s, TOR[2] * s, TOR[3] * s, 0, 0, TAU); c.moveTo(HEAD[2] * s, HEAD[1] * s); c.arc(0, HEAD[1] * s, HEAD[2] * s, 0, TAU); c.fill(); } }
    // the eyes' glow, the fangs' flash, the heal's crimson pulse in the chest
    c.globalAlpha = 1;
    for (const sd of [-1, 1]) glowF(c, sd * 0.052 * s, -0.166 * s, s * (0.06 + 0.05 * B.eye), RUBY, B.a * (0.45 + 0.45 * B.eye));
    if (B.bite > 0.01) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = B.a * B.bite; const r = s * (0.08 + 0.12 * B.bite); c.drawImage(starSpr(), -r, -0.075 * s - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    if (B.pulse > 0.01) { glowF(c, 0, 0.04 * s, s * (0.22 + 0.25 * B.pulse), CRIM, B.a * 0.75 * B.pulse); glowF(c, 0, 0.0, s * 0.1, '#FFC0CC', B.a * 0.5 * B.pulse); }
    c.restore();
  }

  /* ================= the move ================= */
  const FORM = 0.6, REVEAL = 0.3, ENDD = 0.55, RANGE = 6.5;
  S.dracula = (C, h) => {
    H = h; const me = H.me, g = H.g, ev = evoOf(C), K = C.K || 1, evoK = 1 + 0.1 * (ev - 1), DK = C.base * K * evoK;
    const N = ev >= 7 ? 4 : ev >= 4 ? 3 : 2, TOT = (2.5 + 0.25 * (N - 2)) * DK, WS = (N - 1) + 1.5;
    const petHT = () => { const SZ = Math.max(0.6, ((me.r || 0.3) - 0.2) / 0.1); return 1.02 * SZ * (g.pw && g.pw.giant ? 1.35 : 1) * (g.petK || 1); };
    const bs = Math.max(0.9, Math.min(1.3, petHT()));
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, RES = Math.min(2, Math.max(1, dpr));
    // the pet's own colour, for the collar ruff and the inner ears
    let acc = '#8C5BC8', PM = null; try { const X = H.X; PM = X.pet ? { p: X.pet() } : null; const pal = PM && PM.p && formOf(PM.p).pal; if (pal && /^#[0-9a-fA-F]{6}$/.test(pal.base)) acc = pal.base; } catch (e) { /* (keep the default) */ }
    setScale(H.X.Tz() * RES * bs); plan(acc); bakeStep(1.5);
    const P0 = H.X.pet ? H.X.pet() : null, swapped = () => !!P0 && H.X.pet() !== P0,   /* (the pet on the field changed) */ sfx = H.X.sfx, note = (...a) => sfx.note && sfx.note(...a), hiss = (...a) => sfx.hiss && sfx.hiss(...a);
    H.X.banner('DRACULA', '', C.col, 1.2); hiss(0.5, 0.18, 500); note(180, 0.5, 'sine', 0.18, 90); me.castT = 0;
    const hold = { vx: 0, vy: 0, t: 0.12 };
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    let prevTgt = null; const TGN = new Map();
    const dbg = { dives: [], heals: [], retargets: 0, early: false, interrupted: null, maxUpd: 0, maxDraw: 0 };
    // the bat's state
    const bat = { z: 0.45, ph: 0, k: 1, flare: 0, roll: 0, pitch: 0, a: 0, pulse: 0, eye: 0, bite: 0, asym: 0, wob: 0, emA: 0.3, scale: 0.5, vxS: 0, on: false, lastX: null };
    const ph = { name: 'form', t0: 0 }, Dv = []; let q = null, j = -1, lastT = 0, goneAt = 0, pulseT = -9, rest = false;
    const PS = [], FREE = [], ripples = [], trail = [], siph = [];   // particles (pooled), floor ripples, the trail, the siphons
    const part = o => { const p = FREE.pop() || {}; p.x = 0; p.y = 0; p.z = 0; p.vx = 0; p.vy = 0; p.vz = 0; p.g = 0; p.drag = 1; p.t = 0; p.life = 1; p.s = 0.3; p.grow = 0; p.rot = Math.random() * TAU; p.vr = 0; p.v = 0; p.cx = null; p.curl = 0; p.pull = 0; p.a = 1; Object.assign(p, o); PS.push(p); return p; };
    const kids = [];
    const F = H.add({ key: 'dracula', life: 30, N, TOT, dbg, bat, update, draw, drawUnder, onEnd() { clearPet(); for (const k of kids) k.life = 0; } });
    F.dbgPh = () => ph.name; F.dbgQ = () => q; F.dbgT0 = () => ph.t0;

    /* ---- pet hooks ---- */
    function clearPet() { if (me.petAlt === F) me.petAlt = null; me.hopSq = 0; if (me.push === hold) me.push = null; }
    function lockPet() { me.push = hold; hold.t = 0.12; hold.vx = 0; hold.vy = 0; g.normalT = Math.max(g.normalT || 0, 0.06); g.dodgeCd = Math.max(g.dodgeCd || 0, 0.06); }
    const moveTo = (x, y) => { const dx = x - me.x, dy = y - me.y; if (Math.hypot(dx, dy) > 1e-4) H.X.moveEnt(me, dx, dy, 0); };

    /* ---- targeting ---- */
    function acquire(jj, x, y) {
      const list = H.living().filter(m => valid(m) && Math.hypot(m.x - x, m.y - y) < RANGE + m.r); if (!list.length) return null;
      let best = null, bsc = 1e9; for (const m of list) { let sc = Math.hypot(m.x - x, m.y - y);
        if (jj === 0 && isFinite(C.tx) && isFinite(C.ty)) sc = 0.35 * sc + Math.hypot(m.x - C.tx, m.y - C.ty);
        else if (list.length > 1) sc += (m === prevTgt ? 3 : 0) + 0.9 * (TGN.get(m) || 0);
        if (sc < bsc) { bsc = sc; best = m; } }
      return best;
    }
    const zOf = m => Math.max(0.42, Math.min(1.3, 0.3 + (m.r || 0.35) * 0.9));
    const spotOf = (m, psi, d) => [m.x + Math.cos(psi) * d, m.y + Math.sin(psi) * d];
    const biteD = m => (m.r || 0.35) + (me.r || 0.3) + 0.06;
    function choosePsi(m, psi0) {   // an approach side whose apex and bite points are open floor
      for (let i = 0; i < 9; i++) { const psi = psi0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.7, A = spotOf(m, psi, m.r + 1.05), B = spotOf(m, psi, biteD(m)); if (!H.X.blocked(A[0], A[1], me.r || 0.3, 0) && !H.X.blocked(B[0], B[1], me.r || 0.3, 0)) return psi; }
      return Math.atan2(me.y - m.y, me.x - m.x);
    }
    /* ---- one dive: launch (ascent) ---- */
    function launch(t) {
      j++; if (j >= N) return enter('end', t);
      const tg = acquire(j, me.x, me.y); if (!tg) { dbg.early = true; return enter('end', t); }
      const fin = j === N - 1, side = j % 2 ? -1 : 1;
      let psi0 = j === 0 ? Math.atan2(me.y - tg.y, me.x - tg.x) + 0.35 * side : (q ? q.psi : 0) + side * (1.9 + 0.5 * R1(j * 3.7));
      if (tg === (q && q.tgt) && j > 0) psi0 = q.psi + side * (1.7 + 0.4 * R1(j));   // (the same victim: a new side each time)
      const psi = choosePsi(tg, psi0), A = spotOf(tg, psi, tg.r + 1.05), dist = Math.hypot(A[0] - me.x, A[1] - me.y);
      q = { j, fin, tgt: tg, psi, R: (1.15 + 0.05 * j) * K * (fin ? 1.3 : 1), dmg: TOT * (fin ? 1.5 : 1) / WS, za: 1.9 + 0.15 * j + (fin ? 0.45 : 0), A: Math.min(0.55, 0.3 + 0.045 * dist), Hd: fin ? 0.2 : 0.1, D: fin ? 0.27 : 0.22, Fd: fin ? 0.52 : 0.42,
        x0: me.x, y0: me.y, z0: bat.z, n: 0, hit: [], healed: 0, src: null, done: false };
      Dv.push(q); dbg.dives.push(q); prevTgt = tg; TGN.set(tg, (TGN.get(tg) || 0) + 1);
      if (Math.abs(tg.x - me.x) > 0.15) me.face = tg.x > me.x ? 1 : -1;
      ripples.push({ x: tg.x, y: tg.y, t0: t, R: q.R, tg });
      hiss(0.12, 0.2, 380); note(130, 0.08, 'sine', 0.16, 80); if (fin) note(90, 0.3, 'sine', 0.12, 150);
      enter('asc', t);
    }
    function enter(name, t) { ph.name = name; ph.t0 = t;
      if (name === 'dive') { q.dx0 = me.x; q.dy0 = me.y; q.dz0 = bat.z; q.Dcur = q.D; hiss(0.32, 0.22, 1700); hiss(0.2, 0.12, 900, 0.08); sfx.whoosh && sfx.whoosh(); }
      if (name === 'aim' && q) ripples.push({ x: q.tgt.x, y: q.tgt.y, t0: t, R: q.R, tg: q.tgt });
      if (name === 'end') { hiss(0.4, 0.16, 600); note(240, 0.45, 'sine', 0.14, 110); }
    }
    function retarget(t, inDive) {
      const m = acquire(1, me.x, me.y); if (!m) { dbg.early = true; enter('end', t); return false; }
      dbg.retargets++; q.tgt = m; q.psi = Math.atan2(me.y - m.y, me.x - m.x); prevTgt = m; TGN.set(m, (TGN.get(m) || 0) + 1);
      if (!inDive && ph.name === 'asc') { q.x0 = me.x; q.y0 = me.y; q.z0 = bat.z; ph.t0 = t; }
      if (inDive) { const u = cl((t - ph.t0) / q.Dcur); q.dx0 = me.x; q.dy0 = me.y; q.dz0 = bat.z; q.Dcur = Math.max(0.16, q.Dcur * (1 - u) + 0.08); ph.t0 = t; }
      ripples.push({ x: m.x, y: m.y, t0: t, R: q.R, tg: m }); return true;
    }

    /* ---- the bite: the dive's one hit; the spheres ---- */
    function bite(t) {
      const tg = q.tgt, live = valid(tg), cx = live ? tg.x : me.x, cy = live ? tg.y : me.y;
      // (if a wall kept the bat short of its victim, the hit is where the bat actually is)
      const near = live && Math.hypot(tg.x - me.x, tg.y - me.y) < tg.r + (me.r || 0.3) + 1.2, hx = near ? cx : me.x, hy = near ? cy : me.y;
      const struck = []; for (const m of H.living()) { if (!valid(m)) continue; if (Math.hypot(m.x - hx, m.y - hy) - m.r <= q.R) { const d = H.X.hitMon(m, q.dmg, C.dmgO()); if (d > 0) { q.n++; struck.push(m); } } }
      q.hit = struck; q.src = { x: live ? tg.x : hx, y: live ? tg.y : hy, z: live ? zOf(tg) : 0.5, m: live ? tg : null };
      bat.bite = 1;
      // the spheres: the large one at the victim, smaller ones on the others struck (decorative: no further hits)
      const main = struck.includes(tg) ? tg : struck[0];
      if (main) { const R = (q.fin ? 1.05 : 0.75) * Math.max(1, Math.min(1.5, main.r * 1.8)); sphere(main.x, main.y, Math.max(R * 0.7, zOf(main) * 0.8), R, q.fin, 0, true, t); }
      let k2 = 0; for (const m of struck) if (m !== main && k2++ < 8) { const R = (q.fin ? 0.5 : 0.42) * Math.max(1, Math.min(1.4, m.r * 1.8)); sphere(m.x, m.y, Math.max(R * 0.75, zOf(m) * 0.75), R, q.fin, 0.03 + 0.03 * k2, false, t); }
      if (!main) { for (let i = 0; i < H.n(8); i++) part({ k: 'mist', x: hx, y: hy, z: q.src.z, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 1.2, vz: 0.5, life: 0.6, s: 0.35, grow: 0.8, v: i % 2 }); }
      note(95, 0.16, 'sine', 0.45, 55); sfx.chomp && sfx.chomp(); if (q.fin) note(70, 0.3, 'triangle', 0.25, 40);
      if (H.X.light) H.X.light(hx, hy, q.R * (q.fin ? 1.2 : 0.85), q.fin ? 0.4 : 0.24);
      H.X.hitstop(q.fin ? 0.07 : 0.035);
      if (q.fin && !RM()) H.X.shake(7, 0.22);
      if (q.n > 0) { siph.push({ q, t0: t, drops: [], dur: q.Fd }); const sp = siph[siph.length - 1], nd = H.n(q.fin ? 16 : 11); for (let i = 0; i < nd; i++) sp.drops.push({ t0: 0.02 + i / nd * (q.Fd * 0.6), dur: 0.2 + 0.08 * R1(i * 3.1 + j), side: (R1(i * 7.7 + j) - 0.5) * 2, s: 0.8 + 0.4 * R1(i * 1.9) }); note(330, q.Fd * 0.8, 'sine', 0.14, 640, 0.05); sfx.bubble && sfx.bubble(); }
      dbg.hitT = t;
    }
    function resolve(t) {   // the siphon completes: the crimson pulse and, for a dive that struck something, the one heal
      q.done = true; if (q.n > 0) { const max = H.X.ST().hp, before = me.hp; H.X.heal(0.06 * max); q.healed = me.hp - before; dbg.heals.push({ j: q.j, amt: q.healed, want: 0.06 * max, t }); pulseT = t; note(520, 0.18, 'sine', 0.16, 780); note(780, 0.22, 'sine', 0.1, 1040, 0.06); }
    }
    function sphere(x, y, zc, R, fin, d, main, t) {
      const o = H.add({ key: 'draculaS', life: d + 0.45, entY: y - 0.03, x, y, zc, R, fin, d, main, rup: false, RU: fin && main ? 0.3 : 0.24,
        update(dt, f) { if (!f.rup && f.t >= f.d + f.RU) { f.rup = true; rupture(f); } }, drawEnt(c) { drawSphere(c, o); } });
      kids.push(o); void t;
    }
    function rupture(o) {
      const n = H.n(o.main ? (o.fin ? 14 : 9) : 5);
      for (let i = 0; i < n; i++) { const a = i / n * TAU + Math.random() * 0.5, v = (2.4 + Math.random() * 2) * o.R; part({ k: 'frag', x: o.x + Math.cos(a) * o.R * 0.6, y: o.y + (Math.random() - 0.5) * 0.2, z: o.zc - Math.sin(a) * o.R * 0.6, vx: Math.cos(a) * v, vy: (Math.random() - 0.5) * 1.5, vz: -Math.sin(a) * v + 1.5, g: 9, drag: 1.6, life: 0.45 + Math.random() * 0.2, s: o.R * (0.32 + Math.random() * 0.2), rot: a + Math.PI / 2, vr: (Math.random() - 0.5) * 9, v: i % 3 }); }
      const ns = H.n(o.main ? (o.fin ? 14 : 9) : 4);
      for (let i = 0; i < ns; i++) { const a = Math.random() * TAU, v = (1.2 + Math.random()) * o.R * (o.fin ? 1.4 : 1); part({ k: 'mist', x: o.x + Math.cos(a) * o.R * 0.4, y: o.y + Math.sin(a) * o.R * 0.25, z: o.zc * (0.3 + 0.5 * Math.random()), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 0.4, drag: 2.2, life: 0.6 + Math.random() * 0.3, s: o.R * 0.45, grow: 1.2, v: i % 3 === 0 ? 2 : i % 2, a: 0.6 }); }
      for (let i = 0; i < H.n(o.main ? 10 : 4); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 3; part({ k: 'mote', x: o.x, y: o.y, z: o.zc, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 1 + Math.random() * 2, g: 3, drag: 1.5, life: 0.5 + Math.random() * 0.4, s: 0.07 + Math.random() * 0.05 }); }
      part({ k: 'shock', x: o.x, y: o.y, z: o.zc, life: o.fin ? 0.55 : 0.42, s: o.R * (o.fin ? 2.5 : 1.9) });
      part({ k: 'air', x: o.x, y: o.y, z: o.zc, life: 0.3, s: o.R * 1.8 });
      if (o.main) { note(o.fin ? 46 : 68, o.fin ? 0.75 : 0.42, 'sine', o.fin ? 0.75 : 0.5, o.fin ? 26 : 34); sfx.crash && sfx.crash(); if (o.fin) { sfx.stomp && sfx.stomp(); hiss(0.6, 0.25, 220); } }
    }

    /* ---- the update ---- */
    function update(dt, f) {
      const u0 = nowMs(), t = f.t; lastT = t; const T = H.X.Tz();
      if (ph.name !== 'gone' && (me.dead || swapped())) { dbg.interrupted = me.dead ? 'death' : 'swap'; mistAt(me.x, me.y, bat.z, 10); clearPet(); bat.on = false; bat.a = 0; siph.length = 0; trail.length = 0; for (const k of kids) k.life = Math.min(k.life, 0.2); ph.name = 'gone'; goneAt = t; }
      if (ph.name === 'gone') { stepParts(dt, t); if (!PS.length && t > goneAt + 0.2) f.life = 0; return; }
      lockPet();
      const P = ph.name, tau = t - ph.t0; let fold = 0, flare = 0, freq = 0, roll = 0, pitch = 0;
      if (P === 'form') {
        if (tau < REVEAL) me.hopSq = 0.6 * sm(tau / 0.26);
        if (!bat.on && tau >= REVEAL) { bat.on = true; me.petAlt = F; me.hopSq = 0; mistAt(me.x, me.y, 0.45, 12); for (let i = 0; i < H.n(10); i++) { const a = Math.random() * TAU; part({ k: 'mote', x: me.x, y: me.y, z: 0.5, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 1.5, vz: 1 + Math.random(), drag: 2, life: 0.6, s: 0.06 }); } note(150, 0.25, 'triangle', 0.18, 300); hiss(0.18, 0.2, 520); }
        const u = cl((tau - REVEAL) / (FORM - REVEAL)); bat.z = 0.45 + 0.2 * sm(u); fold = 1 - sm(u / 0.85); freq = 2.5; bat.a = bat.on ? 1 : 0; bat.scale = bat.on ? 0.55 + 0.45 * sm(u / 0.7) + 0.06 * Math.sin(Math.PI * cl(u / 0.7)) : 0.55;
        if (tau < REVEAL + 0.02 && Math.random() < dt * 60 * H.Q()) { const a = Math.random() * TAU; part({ k: 'mote', x: me.x + Math.cos(a) * 0.7, y: me.y + Math.sin(a) * 0.4, z: 0.2 + Math.random() * 0.6, cx: [me.x, me.y], curl: 6, vx: 0, vy: 0, vz: 0.4, drag: 0.5, life: 0.4, s: 0.05 }); }
        if (tau >= FORM) launch(t);
      } else if (P === 'asc') {
        const u = cl(tau / q.A), e = sm(u / 0.9), tg = q.tgt;
        if (!valid(tg) && !retarget(t, false)) return endFrame(dt, t, u0);
        const A = spotOf(q.tgt, q.psi, q.tgt.r + 1.05); moveTo(lerp(q.x0, A[0], e), lerp(q.y0, A[1], e));
        bat.z = lerp(q.z0, q.za, 1 - Math.pow(1 - u, 2.2)); fold = 0.05; freq = 6.5; pitch = -0.2; bat.scale = 1;
        if (u >= 1) enter('aim', t);
      } else if (P === 'aim') {
        const u = cl(tau / q.Hd); if (!valid(q.tgt) && !retarget(t, false)) return endFrame(dt, t, u0);
        const A = spotOf(q.tgt, q.psi, q.tgt.r + 1.05), dx = A[0] - me.x, dy = A[1] - me.y, d = Math.hypot(dx, dy), st = Math.min(d, 5 * dt); if (d > 1e-3) moveTo(me.x + dx / d * st, me.y + dy / d * st);
        bat.z = q.za + 0.06 * Math.sin(Math.PI * u); fold = 0.15 * u; freq = q.fin ? 3.2 : 4.5; flare = q.fin ? 0.35 * Math.sin(Math.PI * u) : 0; roll = 0.35 * Math.sign(q.tgt.x - me.x || 1) * Math.sin(Math.PI * u);
        if (u >= 1) enter('dive', t);
      } else if (P === 'dive') {
        if (!valid(q.tgt) && !retarget(t, true)) return endFrame(dt, t, u0);
        const tau2 = t - ph.t0, u = cl(tau2 / q.Dcur), e = u < 0.8 ? 0.94 * Math.pow(u / 0.8, 1.7) : 0.94 + 0.06 * sm((u - 0.8) / 0.2);
        const B = spotOf(q.tgt, q.psi, biteD(q.tgt)); moveTo(lerp(q.dx0, B[0], e), lerp(q.dy0, B[1], e)); bat.z = lerp(q.dz0, zOf(q.tgt), e);
        fold = u < 0.78 ? sm(u / 0.22) : 1 - sm((u - 0.78) / 0.1); flare = sstep(0.76, 0.9, u) * (q.fin ? 1 : 0.9); freq = 0; pitch = u < 0.8 ? 1 : 1 - sm((u - 0.8) / 0.2);
        roll = Math.max(-0.75, Math.min(0.75, (B[0] - q.dx0) * 0.35)) * (u < 0.8 ? 1 : 0.6);
        if (Math.abs(B[0] - me.x) > 0.05) me.face = B[0] > me.x ? 1 : -1;
        if (u >= 1) { bite(t); enter('feed', t); }
      } else if (P === 'feed') {
        const u = cl(tau / q.Fd), tg = q.tgt;
        // (it clings for a beat, then hangs back a little while it drinks, so the stream between them shows)
        const back = sstep(0.1, 0.42, u) * (1 - 0.35 * sstep(0.75, 1, u));
        if (valid(tg)) { const B = spotOf(tg, q.psi, biteD(tg) + 0.45 * back); moveTo(B[0], B[1]); q.src.x = tg.x; q.src.y = tg.y; }
        bat.z = (q.src ? (valid(tg) ? zOf(tg) : q.src.z) : bat.z) + 0.38 * back + 0.03 * Math.sin(t * 9); fold = 0.5; freq = 3.2; flare = (1 - sm(tau / 0.12)) * (q.fin ? 1 : 0.9);
        roll = 0.42 * Math.sign((q.src ? q.src.x : me.x) - me.x || me.face || 1);
        if (u >= 1) { resolve(t); launch(t); }
      } else if (P === 'end') {
        const u = cl(tau / ENDD); fold = 0.1; freq = 5; bat.z += dt * 0.6 * (1 - u);
        if (tau < 0.2 && q && q.src) { const d = Math.hypot(me.x - q.src.x, me.y - q.src.y) || 1; moveTo(me.x + (me.x - q.src.x) / d * 2.2 * dt, me.y + (me.y - q.src.y) / d * 2.2 * dt); }
        bat.a = 1 - sstep(0.12, 0.45, tau); bat.scale = 1 - 0.3 * sstep(0.12, 0.45, tau);
        if (tau > 0.1 && tau < 0.4 && Math.random() < dt * 50 * H.Q()) { const a = Math.random() * TAU; part({ k: 'mist', x: me.x + Math.cos(a) * 0.3, y: me.y + Math.sin(a) * 0.15, z: bat.z + (Math.random() - 0.5) * 0.4, cx: [me.x, me.y], curl: 3.5, vx: 0, vy: 0, vz: -bat.z * 1.6, drag: 0.3, life: 0.6, s: 0.28, grow: 0.6, v: Math.random() < 0.5 ? 0 : 1 }); if (Math.random() < 0.5) part({ k: 'mote', x: me.x, y: me.y, z: bat.z, vx: Math.cos(a) * 1.5, vy: Math.sin(a), vz: -0.5, drag: 1, life: 0.5, s: 0.05 }); }
        if (tau >= 0.3 && me.petAlt === F) { me.petAlt = null; rest = true; mistAt(me.x, me.y, 0.3, 6); }
        if (rest) { const v = tau - 0.3; me.hopSq = -0.45 * Math.exp(-9 * v) * Math.cos(16 * v); }
        if (tau >= ENDD) { clearPet(); ph.name = 'gone'; goneAt = t; for (const k of kids) k.life = Math.min(k.life, 0.5); }
      }
      // the wings, the body's bank and pitch (eased); the flap's sound on each downstroke
      const k1 = Math.min(1, dt * 14); bat.k += (fold - bat.k) * Math.min(1, dt * 18); bat.flare += (flare - bat.flare) * Math.min(1, dt * 25);
      const prevPh = bat.ph; bat.ph += dt * freq; if (freq > 0 && Math.floor(prevPh + 0.95) !== Math.floor(bat.ph + 0.95) && bat.on && bat.a > 0.3) { hiss(0.07, 0.13, 420); note(150, 0.05, 'sine', 0.08, 90); }
      const X = H.sx(me.x); if (bat.lastX != null && dt > 0) bat.vxS += ((X - bat.lastX) / dt / T - bat.vxS) * Math.min(1, dt * 10); bat.lastX = X;
      const rollT = (P === 'asc' ? Math.max(-0.5, Math.min(0.5, bat.vxS * 0.06)) : 0) + roll; bat.roll += (rollT - bat.roll) * k1; bat.pitch += (pitch - bat.pitch) * k1; bat.asym = Math.max(-0.14, Math.min(0.14, bat.roll * 0.25));
      bat.wob = 0.08 * Math.sin(t * 11) * (freq > 0 ? 1 : 0.3) - 0.12 * bat.pitch;
      bat.bite = Math.max(0, bat.bite - dt * 5); bat.eye = P === 'dive' ? 1 : P === 'feed' ? 0.7 : 0.25 + 0.15 * Math.sin(t * 4);
      bat.pulse = t - pulseT < 0.6 ? Math.exp(-(t - pulseT) * 5) * sstep(0, 0.05, t - pulseT) : 0;
      bat.emA = 0.14 + 0.12 * (P === 'feed' ? 1 : 0) + 1.2 * (t - pulseT < 0.6 ? Math.exp(-Math.pow((t - pulseT - 0.12) / 0.12, 2)) : 0);
      // the trail (in the air: the ascent lightly, the dive heavily)
      if (bat.on && (P === 'asc' || P === 'dive')) trail.push({ x: me.x, y: me.y, z: bat.z, t, d: P === 'dive' ? 1 : 0.45 });
      while (trail.length && t - trail[0].t > 0.3) trail.shift();
      // the transformation's mist spiral
      if (P === 'form' && tau < REVEAL + 0.15 && Math.random() < dt * 55 * H.Q()) { const a = Math.random() * TAU; part({ k: 'mist', x: me.x + Math.cos(a) * 0.85, y: me.y + Math.sin(a) * 0.5, z: 0.1 + Math.random() * 0.3, cx: [me.x, me.y], curl: 7, vx: 0, vy: 0, vz: 1.4, drag: 0.4, life: 0.42, s: 0.26, grow: -0.3, v: Math.random() < 0.6 ? 0 : 1, pull: 1.6 }); }
      endFrame(dt, t, u0);
    }
    function endFrame(dt, t, u0) {
      stepParts(dt, t);
      if (WI < WARM.length && t > 0.02) { const t0 = nowMs(); while (WI < WARM.length && nowMs() - t0 < 0.8) WARM[WI++](); }
      if (BK.queue.length || BK.job) { const sync = typeof window !== 'undefined' && window.__drcSync; bakeStep(sync ? 1e4 : BK.miss > 0 ? 2 : 1.2); BK.miss = 0; }
      const du = nowMs() - u0; if (du > dbg.maxUpd) dbg.maxUpd = du;
    }
    let WI = 0;
    function mistAt(x, y, z, n) { for (let i = 0; i < H.n(n); i++) { const a = Math.random() * TAU, v = 0.8 + Math.random() * 1.6; part({ k: 'mist', x, y, z: z + (Math.random() - 0.5) * 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: (Math.random() - 0.3) * 0.8, drag: 2.2, life: 0.55 + Math.random() * 0.3, s: 0.3, grow: 1.1, v: i % 3 === 0 ? 2 : i % 2 }); } }
    function stepParts(dt, t) {
      for (let i = PS.length - 1; i >= 0; i--) { const p = PS[i]; p.t += dt; if (p.t >= p.life) { PS[i] = PS[PS.length - 1]; PS.pop(); FREE.push(p); continue; }
        const dg = Math.exp(-p.drag * dt); p.vx *= dg; p.vy *= dg; p.vz = p.vz * dg - p.g * dt;
        if (p.cx) { const dx = p.x - p.cx[0], dy = (p.y - p.cx[1]) / 0.6, r = Math.hypot(dx, dy) || 1e-3, a = Math.atan2(dy, dx) + p.curl * dt / Math.max(0.3, r), r2 = Math.max(0.05, r - (p.pull || 0) * dt); p.x = p.cx[0] + Math.cos(a) * r2; p.y = p.cx[1] + Math.sin(a) * r2 * 0.6; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0 && p.k !== 'shock') { p.z = 0; p.vz *= -0.2; } }
      for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > 0.6) ripples.splice(i, 1);
      for (let i = siph.length - 1; i >= 0; i--) if (t - siph[i].t0 > siph[i].dur + 0.15) siph.splice(i, 1);
    }

    /* ---- drawing ---- */
    const floorY = (y, T) => H.sy(y) + 0.18 * T;
    const batXY = T => [H.sx(me.x), floorY(me.y, T) - bat.z * T];
    function batPose(T) { return { s: T * bs * bat.scale, roll: bat.roll, pitch: bat.pitch, ph: bat.ph, k: bat.k, flare: bat.flare, a: bat.a, emA: bat.emA, pulse: bat.pulse, eye: bat.eye, bite: bat.bite, asym: bat.asym, wob: bat.wob }; }
    function mouthXY(T) { const [X, Y] = batXY(T), s = T * bs * bat.scale, mx = 0, my = -0.08 * s * (1 - 0.12 * bat.pitch), c = Math.cos(bat.roll), sn = Math.sin(bat.roll); return [X + mx * c - my * sn, Y + mx * sn + my * c]; }
    function drawUnder(c) {
      const T = H.X.Tz(), t = lastT;
      // the strike point: a dark-red ripple and a faint light on the floor where the dive will land
      for (const r of ripples) { const u = (t - r.t0) / 0.6, x = r.tg && valid(r.tg) ? r.tg.x : r.x, y = r.tg && valid(r.tg) ? r.tg.y : r.y, X = H.sx(x), Y = floorY(y, T) - 0.1 * T;
        for (const off of [0, 0.22]) { const v = cl((u - off) / (1 - off)); if (v <= 0) continue; ringF(c, 'c', X, Y, T * r.R * (0.25 + 0.85 * sm(v)), T * 0.12, 0.55 * (1 - v)); } }
      if (q && (ph.name === 'asc' || ph.name === 'aim' || ph.name === 'dive') && valid(q.tgt)) { const X = H.sx(q.tgt.x), Y = floorY(q.tgt.y, T) - 0.1 * T, k = ph.name === 'dive' ? 0.3 : 0.16; glowF(c, X, Y, T * q.R, CRIM, k, 0.55); }
      // the floor's light under each burst
      for (const p of PS) if (p.k === 'shock') { const u = p.t / p.life, X = H.sx(p.x), Y = floorY(p.y, T); ringF(c, 'v', X, Y, T * p.s * (0.3 + 0.7 * Math.sqrt(u)), T * 0.25, 0.75 * (1 - u)); if (u < 0.5) glowF(c, X, Y, T * p.s * 0.6, EDGE, 0.3 * (1 - u * 2), 0.55); }
      // the bat's moving shadow
      if (bat.on && bat.a > 0.05) { const X = H.sx(me.x), Y = floorY(me.y, T); H.softShadow(c, X, Y, T * 0.42 * bs * (1 - Math.min(0.45, bat.z * 0.15)) * (0.6 + 0.4 * (1 - bat.k * 0.4)), (0.34 - Math.min(0.18, bat.z * 0.06)) * bat.a); }
    }
    function draw(c) {
      const d0 = nowMs(), T = H.X.Tz(), t = lastT;
      // the air shockwaves and the distortion ripple of each rupture
      for (const p of PS) if (p.k === 'air') { const u = p.t / p.life, X = H.sx(p.x), Y = floorY(p.y, T) - p.z * T, r = T * p.s * (0.5 + 0.7 * sm(u)); ringF(c, 'v', X, Y, r, T * 0.18, 0.7 * (1 - u), 1); if (u < 0.6) { c.strokeStyle = `rgba(0,0,0,${0.18 * (1 - u / 0.6)})`; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.arc(X, Y, r * 1.12, 0, TAU); c.stroke(); } }
      // smoke, shell fragments
      for (const p of PS) { if (p.k === 'mist') { const u = p.t / p.life, r = T * p.s * Math.max(0.2, 1 + p.grow * u), X = H.sx(p.x), Y = floorY(p.y, T) - p.z * T, a = Math.min(1, p.t / 0.08) * (1 - u) * (p.v === 2 ? 1.2 : 1) * p.a; c.globalAlpha = cl(a); if (p.v === 2) c.globalCompositeOperation = 'lighter'; c.drawImage(mistSpr(p.v), X - r, Y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; }
        else if (p.k === 'frag') { const fr = BK.spr.get('FR' + p.v), u = p.t / p.life, X = H.sx(p.x), Y = floorY(p.y, T) - p.z * T, r = T * p.s; c.save(); c.translate(X, Y); c.rotate(p.rot); c.globalAlpha = 1 - sm((u - 0.5) / 0.5); if (fr) c.drawImage(fr.cv, -r, -r, r * 2, r * 2); else { c.fillStyle = '#1A0D26'; c.fillRect(-r * 0.4, -r * 0.12, r * 0.8, r * 0.24); } c.restore(); } }
      c.globalAlpha = 1;
      // the trail: violet-black smoke ribbons and thin crimson streaks
      if (trail.length > 2 && bat.on) drawTrail(c, T, t);
      // the siphons: blood from the victim to the bat's mouth
      for (const sp of siph) drawSiphon(c, sp, T, t);
      // the bat
      if (bat.on && bat.a > 0.01) { const [X, Y] = batXY(T), B = batPose(T); if (me.hurtT != null && me.hurtT < 0.3 && Math.floor(lastT * 24) % 2 === 0) B.a *= 0.55; drawBat(c, X, Y, B, t, acc); }
      // crimson motes on top
      for (const p of PS) if (p.k === 'mote') { const u = p.t / p.life, X = H.sx(p.x), Y = floorY(p.y, T) - p.z * T; glowF(c, X, Y, T * p.s * 2.2, RUBY, 0.8 * (1 - u)); }
      const dd = nowMs() - d0; if (dd > dbg.maxDraw) dbg.maxDraw = dd;
    }
    function drawTrail(c, T, t) {
      const n = trail.length, P = [], Wd = [];
      for (let i = 0; i < n; i++) { const p = trail[i]; P.push([H.sx(p.x), floorY(p.y, T) - p.z * T]); Wd.push(cl(1 - (t - p.t) / 0.3) * p.d); }
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const side of [-1, 1]) {   // two smoke ribbons off the wing roots, curling
        const L = [], R = []; for (let i = 0; i < n; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, off = side * T * bs * (0.16 + 0.09 * Math.sin(t * 11 + i * 0.9 + side * 1.7)) * (0.4 + 0.6 * (1 - i / n)), w = T * bs * 0.06 * Wd[i] * Math.sin(Math.PI * Math.min(1, (i + 0.5) / n)); L.push([P[i][0] + nx * (off + w), P[i][1] + ny * (off + w)]); R.push([P[i][0] + nx * (off - w), P[i][1] + ny * (off - w)]); }
        c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); c.fillStyle = 'rgba(30,12,46,0.42)'; c.fill();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(165,92,255,0.22)'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.globalCompositeOperation = 'source-over'; }
      c.globalCompositeOperation = 'lighter'; c.lineWidth = Math.max(1, T * 0.025);
      for (const off of [-0.07, 0.0, 0.08]) for (let i = 1; i < n; i++) { const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, o = off * T * bs; if (Wd[i] < 0.5) continue; c.strokeStyle = `rgba(255,45,85,${0.55 * Wd[i] * Wd[i]})`; c.beginPath(); c.moveTo(a[0] - dy / l * o, a[1] + dx / l * o); c.lineTo(b[0] - dy / l * o, b[1] + dx / l * o); c.stroke(); }
      c.globalCompositeOperation = 'source-over';
    }
    // a point on the siphon's curve (screen): from the victim's body to the mouth, bowed to one side
    function sCurve(sp, side, u, T, out) { const s = sp.q.src, x0 = H.sx(s.x), y0 = floorY(s.y, T) - s.z * T, m = mouthXY(T), dx = m[0] - x0, dy = m[1] - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, bow = side * Math.max(T * 0.18, Math.min(T * 0.7, l * 0.55));
      const c1x = x0 + dx * 0.3 + nx * bow, c1y = y0 + dy * 0.3 + ny * bow - T * 0.15, c2x = x0 + dx * 0.75 + nx * bow * 0.4, c2y = y0 + dy * 0.75 + ny * bow * 0.4, v = 1 - u;
      out[0] = v * v * v * x0 + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * m[0]; out[1] = v * v * v * y0 + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * m[1]; return out; }
    const SQ = [0, 0], SQ2 = [0, 0];
    function drawSiphon(c, sp, T, t) {
      const tau = t - sp.t0; if (tau < 0 || !sp.q.src) return; const end = cl((tau - sp.dur) / 0.15);
      // the ribbons: narrow liquid strands that pour along the curve and narrow into the mouth
      for (const [side, dl] of [[-1, 0.02], [0.5, 0.07], [1.1, 0.12]]) {
        const head = cl((tau - dl) / 0.2), tail = cl((tau - dl - 0.12) / (sp.dur * 0.75)); if (head <= tail + 0.01) continue; const NSEG = 12, Lp = [], Rp = [];
        for (let i = 0; i <= NSEG; i++) { const u = lerp(tail, head, i / NSEG); sCurve(sp, side, u, T, SQ); sCurve(sp, side, Math.min(1, u + 0.02), T, SQ2); const dx = SQ2[0] - SQ[0], dy = SQ2[1] - SQ[1], l = Math.hypot(dx, dy) || 1, w = T * 0.065 * (1 - 0.8 * u) * (1 - end) * (0.8 + 0.2 * Math.sin(t * 30 + i)); Lp.push([SQ[0] - dy / l * w, SQ[1] + dx / l * w]); Rp.push([SQ[0] + dy / l * w, SQ[1] - dx / l * w]); }
        c.beginPath(); Lp.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); for (let i = NSEG; i >= 0; i--) c.lineTo(Rp[i][0], Rp[i][1]); c.closePath(); c.fillStyle = 'rgba(110,6,28,0.92)'; c.fill();
        c.strokeStyle = 'rgba(214,28,64,0.9)'; c.lineWidth = Math.max(0.8, T * 0.025 * (1 - end)); c.beginPath(); for (let i = 0; i <= NSEG; i++) { const p = [(Lp[i][0] + Rp[i][0]) / 2, (Lp[i][1] + Rp[i][1]) / 2]; i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
        c.strokeStyle = 'rgba(255,170,185,0.75)'; c.lineWidth = Math.max(0.6, T * 0.009); c.beginPath(); for (let i = 0; i <= NSEG; i++) { const p = [lerp(Lp[i][0], Rp[i][0], 0.3), lerp(Lp[i][1], Rp[i][1], 0.3) - 0.5]; i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
      // glossy droplets riding the curves
      const dsp = dropSpr();
      for (const d of sp.drops) { const u = (tau - d.t0) / d.dur; if (u <= 0 || u >= 1) continue; const e = u * u * (1.6 - 0.6 * u); sCurve(sp, d.side, e, T, SQ); sCurve(sp, d.side, Math.min(1, e + 0.04), T, SQ2); const a = Math.atan2(SQ2[1] - SQ[1], SQ2[0] - SQ[0]), r = T * 0.075 * d.s * (1 - 0.55 * e);
        c.save(); c.translate(SQ[0], SQ[1]); c.rotate(a); c.scale(1.5, 1); c.drawImage(dsp, -r, -r, r * 2, r * 2); c.restore(); }
      // where it leaves the victim: a small wound-light; where it enters: a glow at the mouth
      { const s = sp.q.src, X = H.sx(s.x), Y = floorY(s.y, T) - s.z * T; glowF(c, X, Y, T * 0.3, CRIM, 0.45 * (1 - end) * cl(tau / 0.05)); const m = mouthXY(T); glowF(c, m[0], m[1], T * 0.18, ROSE, 0.35 * (1 - end) * cl(tau / 0.1)); }
    }
    function drawSphere(c, o) {
      const tau = o.t - o.d; if (tau < 0) return; const T = H.X.Tz(), X = H.sx(o.x), Y = floorY(o.y, T) - o.zc * T, SW = 0.11, RU = o.RU;
      let k, a = 1; if (tau < SW) { const u = tau / SW; k = 1.12 * (1 - Math.pow(1 - u, 3)); } else if (tau < RU) { const u = (tau - SW) / (RU - SW); k = lerp(1.12, 0.8, sm(u)) + 0.025 * Math.sin(u * 34) * u; } else { const u = (tau - RU) / 0.13; k = lerp(0.8, 1.2, sm(u)); a = 1 - sm(u); }
      if (a <= 0.01) return; const r = o.R * T * k, wob = tau < RU ? 0.035 * Math.sin(tau * 41) : 0, rx = r * (1 + wob), ry = r * (1 - wob), sp = BK.spr.get('SPH');
      glowF(c, X, Y, r * 1.6, EDGE, 0.22 * a);   // (a controlled bloom round it)
      c.globalAlpha = a;
      if (sp) c.drawImage(sp.cv, X - rx * SPN / 2 / SPR, Y - ry * SPN / 2 / SPR, rx * SPN / SPR, ry * SPN / SPR); else { const gr = c.createRadialGradient(X - r * 0.3, Y - r * 0.35, 0, X, Y, r); gr.addColorStop(0, '#2A1C40'); gr.addColorStop(0.7, '#0C0716'); gr.addColorStop(1, '#05030A'); c.fillStyle = gr; c.beginPath(); c.ellipse(X, Y, rx, ry, 0, 0, TAU); c.fill(); }
      // the moving inner layers: two smoke swirls turning opposite ways (clipped to the sphere)
      const s0 = BK.spr.get('SW0'), s1 = BK.spr.get('SW1');
      if (s0 || s1) { c.save(); c.beginPath(); c.ellipse(X, Y, rx * 0.96, ry * 0.96, 0, 0, TAU); c.clip(); c.translate(X, Y);
        if (s0) { c.save(); c.rotate(tau * 2.2 + o.x); c.globalAlpha = a * 0.55; c.drawImage(s0.cv, -r * 0.95, -r * 0.95, r * 1.9, r * 1.9); c.restore(); }
        if (s1) { c.save(); c.rotate(-tau * 3 + o.y); c.globalAlpha = a * 0.45; c.drawImage(s1.cv, -r * 0.75, -r * 0.75, r * 1.5, r * 1.5); c.restore(); } c.restore(); }
      // the rim (violet turning crimson with the angle) and the fissures opening before it bursts
      const rim = BK.spr.get('SPHR'), fis = BK.spr.get('FIS'); c.globalCompositeOperation = 'lighter';
      if (rim) { c.globalAlpha = a; c.drawImage(rim.cv, X - rx * SPN / 2 / SPR, Y - ry * SPN / 2 / SPR, rx * SPN / SPR, ry * SPN / SPR); } else { c.globalAlpha = a * 0.7; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, r * 0.06); c.beginPath(); c.ellipse(X, Y, rx * 0.97, ry * 0.97, 0, 0, TAU); c.stroke(); }
      const fk = sstep(SW * 0.7, RU, tau) * (tau > RU ? 1 - sm((tau - RU) / 0.09) : 1) + (tau > RU - 0.03 && tau < RU + 0.06 ? 0.6 : 0);
      if (fis && fk > 0.01) { c.globalAlpha = Math.min(1, fk) * a; c.save(); c.translate(X, Y); c.rotate(o.x * 3.1 + o.y); c.drawImage(fis.cv, -rx * SPN / 2 / SPR, -ry * SPN / 2 / SPR, rx * SPN / SPR, ry * SPN / SPR); c.restore(); }
      if (tau > RU - 0.02 && tau < RU + 0.1) { const u = (tau - RU + 0.02) / 0.12; c.globalAlpha = (1 - u) * 0.9; const rr = r * (0.5 + 0.8 * u); c.drawImage(starSpr(), X - rr, Y - rr, rr * 2, rr * 2); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    return F;
  };

  /* (checks and the model sheet) */
  S.dracula.__dbg = { BK, bakeStep, setScale, plan, drawBat, wingGeo, wingParams, NP, FLARE,
    bakeAll(px, acc) { setScale(px); plan(acc || '#8C5BC8'); bakeStep(1e5); for (const f of WARM) f(); return BK.spr.size; },
    bakeCost(px, acc) { BK.spr.clear(); BK.queue = []; BK.qset = new Set(); BK.job = null; BK.px = 0; setScale(px); plan(acc || '#8C5BC8'); const keys = BK.queue.slice(); BK.queue = []; BK.qset = new Set(); const out = {};
      for (const key of keys) { const res = {}, it = genFor(key, res); let tot = 0, mx = 0; for (;;) { const t0 = nowMs(), r = it.next(), d = nowMs() - t0; tot += d; mx = Math.max(mx, d); if (r.done) break; } BK.spr.set(key, res); out[key] = [+tot.toFixed(2), +mx.toFixed(2)]; } return out; } };
})();
