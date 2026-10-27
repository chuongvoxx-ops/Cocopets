/* ---------- The Mouth Beneath the Dunes' three bosses: Super Fiend-class, cel-shaded and three-dimensional ----------
   What they share: the dunes' palette (ochre sand, black basalt, bleached bone, cyan resonance, amber), a floor of
   rippled sand strewn with bone and ringed by the fossil jaw's teeth, and a sky of hot dusk under the upper jaw. */
const DuneFiend = (() => {
  const TAU = Math.PI * 2;
  const OCHRE = '#CDA15E', OCHRE_SH = '#9C7238', OCHRE_HI = '#EBC98A', BASALT = '#28252F', BASALT_SH = '#15131A', BASALT_HI = '#4A4556', BONE = '#E7D9B1', BONE_SH = '#B9A77A', BONE_HI = '#FBF4E0', CYAN = '#62BFC9', CYAN_HI = '#C8F6F8', AMBER = '#E8A33A', AMBER_SH = '#A86A1A', INK = '#1E1A22', VIOLET = '#4A3A5C', VIOLET_SH = '#2A1F36', VIOLET_HI = '#7A678E';
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  // a strike's follow-through: 0..1 of its time, overshooting to 1.2 in the first quarter and settling back
  const snap = u => u < 0.25 ? 1.2 * Math.sin(u / 0.25 * Math.PI / 2) : 1.2 * Math.cos((u - 0.25) / 0.75 * Math.PI / 2);
  /* the dune floor: rippled ochre sand, pale where the light falls, bone fragments and basalt outcrops toward the rim,
     faint cyan resonance veins, and the fossil jaw's teeth leaning in all round */
  function floor(c, A, o) { const R = A.R, rnd = A.rnd; o = o || {};
    let g = c.createRadialGradient(-R * 0.2, -R * 0.2, R * 0.1, 0, 0, R + 1.4); g.addColorStop(0, o.mid || '#D9B06A'); g.addColorStop(0.65, o.edge || '#BE9150'); g.addColorStop(0.94, '#6E5232'); g.addColorStop(1, 'rgba(110,82,50,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
    // the ripples of the sand: wind-combed lines running across, a dark crease and a lit crest to each
    c.lineCap = 'round'; for (let y = -R - 1; y < R + 1; y += 1.15) { const ph = rnd() * 6; for (const [col, w, dy] of [['rgba(110,70,25,.13)', 0.14, 0], ['rgba(255,240,200,.17)', 0.08, -0.14]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); for (let x = -R - 1; x <= R + 1; x += 0.5) { const yy = y + dy + Math.sin(x * 0.9 + ph) * 0.18 + Math.sin(x * 0.23 + ph * 2) * 0.35; if (Math.hypot(x, yy) > R + 1) { c.moveTo(x, yy); continue; } x > -R - 1 ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); } }
    // basalt outcrops toward the rim, and bone: rib shards and vertebrae half buried
    for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = R * (0.62 + rnd() * 0.3), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.5 + rnd() * 0.7; c.fillStyle = BASALT; c.strokeStyle = BASALT_SH; c.lineWidth = 0.08; c.beginPath(); c.moveTo(x - s, y + s * 0.3); c.lineTo(x - s * 0.5, y - s * 0.5); c.lineTo(x + s * 0.3, y - s * 0.7); c.lineTo(x + s, y + s * 0.2); c.lineTo(x + s * 0.4, y + s * 0.45); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(74,69,86,.6)'; c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.5); c.lineTo(x + s * 0.3, y - s * 0.7); c.lineTo(x + s * 0.1, y - s * 0.2); c.closePath(); c.fill(); }
    for (let i = 0; i < 22; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 1), x = Math.cos(a) * d, y = Math.sin(a) * d, rib = rnd() < 0.6, ra = rnd() * TAU, L = 0.5 + rnd() * 0.9; c.strokeStyle = 'rgba(60,45,30,.5)'; c.lineWidth = 0.06;
      if (rib) { c.fillStyle = BONE; c.beginPath(); c.ellipse(x, y, L, 0.16, ra, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(120,100,70,.35)'; c.beginPath(); c.ellipse(x + Math.cos(ra) * L * 0.3, y + Math.sin(ra) * L * 0.3 + 0.06, L * 0.4, 0.06, ra, 0, TAU); c.fill(); }
      else { c.fillStyle = BONE; c.beginPath(); c.arc(x, y, 0.28, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(120,100,70,.4)'; c.beginPath(); c.arc(x, y, 0.12, 0, TAU); c.fill(); } }
    // resonance veins: faint cyan lines in the sand, like the grain of the thing that swallowed it
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(98,191,201,.14)'; c.lineWidth = 0.1; for (let i = 0; i < 7; i++) { const a0 = rnd() * TAU; let x = Math.cos(a0) * R, y = Math.sin(a0) * R, a = a0 + Math.PI + (rnd() - 0.5) * 0.5; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 9; j++) { x += Math.cos(a) * 1.6; y += Math.sin(a) * 1.6; a += (rnd() - 0.5) * 0.7; if (Math.hypot(x, y) > R) break; c.lineTo(x, y); } c.stroke(); } c.restore();
    if (o.extra) o.extra(c, A);
    // the rim: a dark basalt lip, and the jaw's teeth leaning in over it, bone with dark roots
    c.strokeStyle = BASALT_SH; c.lineWidth = 0.5; c.beginPath(); c.arc(0, 0, R + 0.25, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(74,69,86,.5)'; c.lineWidth = 0.12; c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(60,45,30,.6)'; c.lineWidth = 0.07; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU + rnd() * 0.04, r0 = R + 0.3, h = 0.6 + rnd() * 0.9, w = 0.3 + rnd() * 0.12, ca = Math.cos(a), sa = Math.sin(a); c.fillStyle = BONE; c.beginPath(); c.moveTo(ca * r0 - sa * w, sa * r0 + ca * w); c.quadraticCurveTo(ca * (r0 - h * 0.6) + (rnd() - 0.5) * 0.2, sa * (r0 - h * 0.6) - 0.3 * h, ca * (r0 - h), sa * (r0 - h) - 0.45 * h); c.quadraticCurveTo(ca * (r0 - h * 0.6) - (rnd() - 0.5) * 0.2, sa * (r0 - h * 0.6) - 0.3 * h, ca * r0 + sa * w, sa * r0 - ca * w); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(120,100,70,.3)'; c.beginPath(); c.ellipse(ca * r0, sa * r0, w * 0.9, w * 0.35, a, 0, TAU); c.fill(); } }
  /* the sky: a hot dusk under the upper jaw, whose teeth hang down into it; amber haze at the horizon; dust bands */
  function sky(c, W, H, t, cam, T, o) { o = o || {}; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top || '#2A0F22'); g.addColorStop(0.45, o.mid || '#5A1E3A'); g.addColorStop(0.8, o.bot || '#8A4A3A'); g.addColorStop(1, '#C07A48'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(53); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 40; i++) { c.globalAlpha = 0.15 + R() * 0.45; c.beginPath(); c.arc(R() * W, R() * H * 0.45, 0.5 + R() * 1.1, 0, TAU); c.fill(); } c.globalAlpha = 1;
    // the amber haze of the buried sun, low
    const sx = W * 0.7 - (cam.x - 28) * T * 0.05, sy = H * 0.62; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; blitSized(c, glowSprite(AMBER), sx - T * 9, sy - T * 6, T * 18, T * 12); c.globalAlpha = 0.5; blitSized(c, glowSprite('#FFE9A8'), sx - T * 2.2, sy - T * 2.2, T * 4.4, T * 4.4); c.restore();
    // dust bands drifting across
    c.save(); for (let i = 0; i < 9; i++) { const y = H * (0.3 + i * 0.06) + Math.sin(i * 2.3) * 8, w = W * (0.3 + R() * 0.5), x = R() * W - w / 2 + (i % 2 ? 20 : -20); c.globalAlpha = 0.05 + (i % 3) * 0.03; c.fillStyle = '#FFE9A8'; c.beginPath(); c.ellipse(x + w / 2, y, w / 2, 3 + (i % 3) * 2, 0, 0, TAU); c.fill(); } c.restore();
    // the upper jaw: a ridge of bone across the top with the great teeth hanging from it, nearest ones largest
    c.save(); const R2 = mulberry32(19), gum = H * 0.05; c.fillStyle = BONE_SH; c.fillRect(0, 0, W, gum + 6); c.fillStyle = BONE; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, gum); for (let x = W; x >= 0; x -= 24) c.quadraticCurveTo(x - 12, gum + 10 + R2() * 6, x - 24, gum); c.closePath(); c.fill();
    for (let i = 0; i < 9; i++) { const x = W * (i + 0.5) / 9 + (R2() - 0.5) * 20, L = 40 + R2() * 70 + (i % 3 === 1 ? 40 : 0), w = 14 + R2() * 10 + (i % 3 === 1 ? 8 : 0), lean = (R2() - 0.5) * 18;
      c.fillStyle = BONE; c.strokeStyle = 'rgba(60,45,30,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - w, gum); c.quadraticCurveTo(x - w * 0.7 + lean * 0.3, gum + L * 0.55, x + lean, gum + L); c.quadraticCurveTo(x + w * 0.7 + lean * 0.3, gum + L * 0.55, x + w, gum); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(120,100,70,.35)'; c.beginPath(); c.moveTo(x + w * 0.1, gum); c.quadraticCurveTo(x + w * 0.5 + lean * 0.3, gum + L * 0.5, x + lean, gum + L); c.quadraticCurveTo(x + w * 0.7 + lean * 0.3, gum + L * 0.55, x + w, gum); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,250,235,.45)'; c.beginPath(); c.ellipse(x - w * 0.35, gum + L * 0.25, w * 0.18, L * 0.18, 0.1, 0, TAU); c.fill(); }
    c.restore();
    if (o.silhouette) o.silhouette(c, W, H, t, cam, T); }
  /* a spray of sand: streaks thrown up and a puff of ochre dust */
  function sand(FX, x, y, n, k) { k = k || 1; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (2 + Math.random() * 4) * k; FX.H.part({ kind: 'sand', x: x + Math.cos(a) * 0.3, y: y + Math.sin(a) * 0.2, vx: Math.cos(a) * v * 0.6, vy: -v - 1.5, g: 11, life: 0.4 + Math.random() * 0.3, max: 0.7, size: 2, color: OCHRE_HI }); }
    FX.H.part({ kind: 'smoke', x, y: y - 0.2, vx: 0, vy: -0.6 * k, life: 0.6 + 0.3 * k, max: 0.9, size: 4 + 4 * k, color: OCHRE }); }
  /* a mound of sand raised by something under it: an ochre hump with a lit crest and a dark shadowed foot */
  function mound(c, X, Y, rx, ry, k, o) { o = o || {}; k = k == null ? 1 : k; c.save(); c.fillStyle = 'rgba(80,55,25,.28)'; c.beginPath(); c.ellipse(X, Y + ry * 0.35, rx * 1.15, ry * 0.75, 0, 0, TAU); c.fill();
    FiendToon.shape(c, FiendToon.blob([[X - rx, Y + ry * 0.3], [X - rx * 0.55, Y - ry * 0.75 * k], [X + rx * 0.1, Y - ry * k], [X + rx * 0.65, Y - ry * 0.6 * k], [X + rx, Y + ry * 0.3], [X, Y + ry * 0.45]]), { col: o.col || OCHRE, shade: OCHRE_SH, hi: OCHRE_HI, line: o.line || 'rgba(60,45,30,.6)', r: rx, lw: Math.max(1, rx * 0.06), d1: 0.14, d2: 0.22, spec: false, force: true });
    if (o.glow) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = o.glow; blitSized(c, glowSprite(CYAN), X - rx, Y - ry - rx * 0.4, rx * 2, rx * 2); } c.restore(); }
  /* a bone barnacle: a small cream cone with a dark pit, for hides and tentacles */
  function barnacle(c, x, y, r, a) { c.save(); c.translate(x, y); c.rotate(a || 0); c.fillStyle = BONE; c.strokeStyle = INK; c.lineWidth = Math.max(0.8, r * 0.12); c.beginPath(); c.moveTo(-r, r * 0.4); c.lineTo(-r * 0.3, -r * 0.7); c.lineTo(r * 0.3, -r * 0.7); c.lineTo(r, r * 0.4); c.closePath(); c.fill(); c.stroke(); c.fillStyle = BASALT_SH; c.beginPath(); c.ellipse(0, -r * 0.55, r * 0.22, r * 0.12, 0, 0, TAU); c.fill(); c.restore(); }
  return { TAU, OCHRE, OCHRE_SH, OCHRE_HI, BASALT, BASALT_SH, BASALT_HI, BONE, BONE_SH, BONE_HI, CYAN, CYAN_HI, AMBER, AMBER_SH, INK, VIOLET, VIOLET_SH, VIOLET_HI, decay, toward, lerp, snap, floor, sky, sand, mound, barnacle };
})();

/* ---------- SARRUKH THE BLOOM SERPENT ----------
   A colossal serpent that lives under the Gullet's sand, built on Astaroth's rig (the Tower's floor-50 dragon): a long
   tube of bone-and-ochre scales with a pale belly, cyan veins down its back, basalt plates along its spine and two small
   pairs of fins, a wave running down it as it swims. Where its head should be it carries a flower: a closed bud of
   bone petals over rose ones, cyan at their edges, in a basalt calyx; when it blooms the petals peel back and bare a
   small glowing orb, its heart. Six blades of steel float in a loose ring about the bud, and spin up fast and glow when
   it blooms. Most of the time only a travelling wake shows where it is: a hump of sand with ripples behind it. Then it
   bursts up in an arc, the bud leading and the body rising and plunging with sand spraying off it, and dives again.
   Sand Wake marks a line and it surges under it; Breach marks a ring and it erupts there and arcs over; Spit Grit
   pushes the bud up through the sand, then rears out to spit fans of grit; Quake Rings roll out from wherever it dives.
   Three Resonator Spires stand round the Gullet: break one while it is under the sand and the resonance forces it up,
   thrashing on the surface for six seconds with the bud open and its heart bared. In the second phase it runs two
   wakes and dune skitters burst from the sand.
   It is never still: under the sand its wake heaves and spills; surfaced it sways, its bud turns toward the pet, the
   petals breathe and twitch and the blades drift round it; before each spit the bud swells, opens a little and the
   blades draw in, and every spit pops it open; it rears up out of the sand and blooms with a roar on entering and on
   the second phase; struck, it flinches and the blades jolt out; forced up, it writhes end to end in full bloom, the
   orb flickering and the blades hanging round it in a slow halo. */
RiftFiend.define({ id: 'sarrukh', name: 'Sarrukh', title: 'The Bloom Serpent', color: '#E7D9B1', glow: '#62BFC9', accent: '#DFFFF8', biome: 'dunes', r: 2.4, els: ['earth', 'dark'] }, (() => {
  const { TAU, TN, ell, hit } = RiftFiend, G = DuneFiend, tubeLite = TN.tubeLite;
  const { OCHRE, OCHRE_SH, OCHRE_HI, BASALT, BASALT_SH, BASALT_HI, BONE, BONE_SH, BONE_HI, CYAN, CYAN_HI, AMBER, INK, decay, toward, lerp } = G;
  const N = 20, SEG = 0.72, HR = 1.2, ARC_D = 7.5, ARC_H = 4.2, SP_A = [Math.PI / 2 + 0.4, Math.PI / 2 + 0.4 + TAU / 3, Math.PI / 2 + 0.4 - TAU / 3];
  const spireAt = (C, i) => [C.x + Math.cos(SP_A[i]) * (C.R - 2.6), C.y + Math.sin(SP_A[i]) * (C.R - 2.6)];
  const CAM = [0, 0.707, 0.707];   // which way the camera is, for which way the bud and its petals face
  // (the painter's palette and the blades' outlines)
  const BUD = 1.35, SCALE = '#BE9152', SCALE_DK = '#3A2414', SCALE_HI = '#FFF0C8', STEEL = '#B4BDC8', STEEL_SH = '#5A6370', STEEL_HI = '#F6FAFF';
  const PO = '#DCC08A', PO_SH = '#A4844E', PO_HI = '#F7E9C4', PR = '#C8697A', PR_SH = '#86394E', PR_HI = '#F4AFAE', HEART = '#6E3242';
  const dep = p => p[1] + p[2];
  // the serpent's girth along it (Astaroth's taper: a slim neck under the head, broad shoulders, a long thinning tail)
  const girth = u => u < 0.08 ? 1.45 + u * 11 : 2.33 * Math.pow(1 - (u - 0.08) / 0.92, 0.7) + 0.22;
  // the blades' outlines in their own frame (x along the blade, y across), and which part of each is lit
  const CRES = [], CRES_LIT = [], CRES_EDGE = [], KITE = [[1.15, 0], [0, 0.42], [-0.6, 0], [0, -0.42]], KITE_LIT = [[1.15, 0], [-0.6, 0], [0, -0.42]], KITE_EDGE = [[-0.6, 0], [0, -0.42], [1.15, 0]];
  for (let i = 0; i <= 6; i++) { const x = i / 3 - 1; CRES.push([x, -0.62 * (1 - x * x)]); CRES_EDGE.push([x, -0.62 * (1 - x * x)]); CRES_LIT.push([x, -0.62 * (1 - x * x)]); }
  for (let i = 5; i >= 1; i--) { const x = (i / 3 - 1) * 0.85; CRES.push([x, -0.14 * (1 - x * x)]); CRES_LIT.push([x, -0.36 * (1 - x * x)]); }
  return {
    arenaR: 15, firstAct: 'hunt',
    artPoses: [{ name: 'the wake', mem: { demo: 'under', hd: 0.3 } }, { name: 'breaching', mem: { demo: 'arc', hd: 1.0, arcProg: 4.2 } }, { name: 'surfaced to spit: the bud swells', mem: { demo: 'surf', hd: 1.57, menace: 1, jaw: 1, bloom: 0.45, wind: 0.8 } }, { name: 'forced up: the heart bared', mem: { demo: 'lie', hd: 1.57, lie: 1, jaw: 1, bloom: 1 } }],
    phaseNames: ['The Gullet', 'The Second Wake', 'The Swallowing', 'The Last Wake'],
    paintGround(c, A) { G.floor(c, A, { extra: (c2, A2) => { const R = A2.R;
      // the spires' footings: rings of basalt rubble; and the gullet's rings: concentric ridges in the sand toward the middle
      SP_A.forEach(a => { const x = Math.cos(a) * (R - 2.6), y = Math.sin(a) * (R - 2.6); c2.fillStyle = BASALT; c2.beginPath(); c2.ellipse(x, y + 0.2, 1.4, 0.75, 0, 0, TAU); c2.fill(); c2.strokeStyle = BASALT_SH; c2.lineWidth = 0.12; c2.stroke(); c2.fillStyle = 'rgba(98,191,201,.15)'; c2.beginPath(); c2.ellipse(x, y + 0.15, 1.1, 0.55, 0, 0, TAU); c2.fill(); });
      c2.strokeStyle = 'rgba(110,70,25,.22)'; c2.lineWidth = 0.3; for (let i = 0; i < 3; i++) { c2.beginPath(); c2.arc(0, 0, 3 + i * 2.6, 0, TAU); c2.stroke(); } } }); },
    sky(c, W, H, t, cam, T) { G.sky(c, W, H, t, cam, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; m.act = 'enter'; m.x = FX.C.x; m.y = FX.C.y - 3;
      Object.assign(M, { hd: Math.PI / 2, mode: 'surf', rise: 0, zs: new Float32Array(N).fill(-1.2), up: new Uint8Array(N), trail: [], px: m.x, py: m.y, vx: 0, vy: 0, spd: 0, wph: 0, menace: 0, jaw: 0, roar: 0, recoil: 0, lie: 0, bt: 0, twT: 1, tw: 0, spires: SP_A.map(() => ({ obj: null, respawnT: 0 })), broodT: 12, wasEnter: true, roared: false, wasStun: false, seen: {}, sprayT: 0, wk: null, br: null, arcX: m.x, arcY: m.y, arcA: Math.PI / 2, arcProg: 0, surfT: 0, spitT: 0, bloom: 0, peek: 0, wind: 0, bA: 0, bS: 0, turn: 0, lastHd: Math.PI / 2, colT: 0 });
      for (let i = 0; i < 80; i++) M.trail.push({ x: m.x, y: m.y - i * 0.25 });
      SP_A.forEach((a, i) => spawnSpire(FX, i)); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.roar = 1; M.jaw = 1; M.menace = 1; M.broodT = 3; FX.H.shake(10, 0.5); FX.H.flash(0.2, CYAN); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - 2, CYAN, 18, 7); G.sand(FX, m.x, m.y, 14, 1.6);
      M.spires.forEach((h, i) => { if (!h.obj || h.obj.dead) { h.respawnT = 0; spawnSpire(FX, i); } });
      if (lv >= 2) FX.H.banner('THE SECOND WAKE', 'It runs two wakes; dune skitters burst from the sand', CYAN, 2.6, true); if (lv >= 4) FX.H.banner('The Last Wake', 'The sand itself hunts', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.08) * FX.S.fast, d = FX.dist(m.x, m.y); m.actT += dt; m.noTouch = true;
      M.spires.forEach((h, i) => { if ((!h.obj || h.obj.dead) && !h.respawnT) h.respawnT = 14; if (h.respawnT) { h.respawnT -= dt; if (h.respawnT <= 0) { h.respawnT = 0; spawnSpire(FX, i); } } });
      if (P >= 2 && (M.broodT -= dt) <= 0 && m.act === 'hunt') { M.broodT = P >= 4 ? 9 : 13; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, p = FX.clampArena({ x: me.x + Math.cos(a) * 3, y: me.y + Math.sin(a) * 3 }, 1.5); FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.1, t: 0.9, dmg: m.dmg * 0.6, col: BONE, fn: s => { G.sand(FX, s.x, s.y, 8, 1); FX.H.sfx.pop(); if (FX.m && !FX.m.dead) FX.minion('skitter', s.x, s.y); } }); } FX.H.text(me.x, me.y - 2, 'Skitters burst from the sand', BONE, 13); }
      let menace = 0, jaw = 0;
      switch (m.act) {
        case 'hunt': {   // under the sand, circling the pet by its wake; then chooses
          M.mode = 'under'; M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.6 * fast * (M.dir || 1); const R = 5.5 + Math.sin(m.t * 0.7) * 1.2, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2); glide(FX, m, M, p.x, p.y, 5.5 * fast, dt, 2.4);
          if (m.actT > (P >= 3 ? 1.4 : 1.8) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; const r = Math.random(); if (r < 0.36) startWake(FX, m, 1); else if (r < 0.66) startBreach(FX, m); else startSpit(FX, m); } break; }
        case 'wake': { const W = M.wk; M.mode = 'under';
          if (!W.go) { menace = 0.5; glide(FX, m, M, W.x0, W.y0, 6 * fast, dt, 5); M.hd = FX.K.lerpA(M.hd, W.a, Math.min(1, dt * 5)); if (m.actT > W.wait + 1.5) { m.act = 'hunt'; m.actT = 0; } break; }
          const sp = 15 * fast, b = [m.x, m.y]; m.x += Math.cos(W.a) * sp * dt; m.y += Math.sin(W.a) * sp * dt; M.hd = W.a; W.prog += sp * dt; push(M, m); M.spd = sp;
          if (!W.hit && Math.hypot(me.x - m.x, me.y - m.y) < 1.3 + me.r) { if (FX.hurt(m.dmg * 1.2)) { W.hit = true; me.push = { vx: Math.cos(W.a + Math.PI / 2) * 9, vy: Math.sin(W.a + Math.PI / 2) * 9, t: 0.2 }; } }
          if (W.prog >= W.len || !FX.inArena(m.x + Math.cos(W.a) * 1.5, m.y + Math.sin(W.a) * 1.5, 1)) { const q = FX.clampArena(m, 1.5); m.x = q.x; m.y = q.y; G.sand(FX, m.x, m.y, 8, 1.2); if (P >= 2 && W.n < 2) startWake(FX, m, 2); else { m.act = 'hunt'; m.actT = 0; } }
          break; }
        case 'breach': { const B = M.br;
          if (!B.go) { M.mode = 'under'; menace = 0.8; glide(FX, m, M, B.x, B.y, 12 * fast, dt, 6); if (Math.hypot(m.x - B.x, m.y - B.y) < 0.4) M.hd = FX.K.lerpA(M.hd, B.a, Math.min(1, dt * 6)); if (m.actT > B.wait + 1.5) { m.act = 'hunt'; m.actT = 0; } break; }
          M.mode = 'arc'; menace = 0.6; jaw = 0.5; const sp = 8 * fast; M.arcProg += sp * dt; const h = Math.min(ARC_D, M.arcProg); m.x = M.arcX + Math.cos(M.arcA) * h; m.y = M.arcY + Math.sin(M.arcA) * h; M.hd = M.arcA; M.spd = sp;
          if (M.arcProg >= ARC_D + N * SEG) { M.mode = 'under'; M.trail = []; for (let i = 0; i < 80; i++) M.trail.push({ x: m.x - Math.cos(M.arcA) * i * 0.25, y: m.y - Math.sin(M.arcA) * i * 0.25 }); m.act = 'hunt'; m.actT = 0; }
          break; }
        case 'spit': { const S = M.sp;
          if (!S.go) { M.mode = 'under'; menace = 0.7; glide(FX, m, M, m.x, m.y, 1, dt, 1); M.hd = FX.K.lerpA(M.hd, FX.angPet(m.x, m.y), Math.min(1, dt * 4)); if (m.actT > S.wait + 1.5) { m.act = 'hunt'; m.actT = 0; } break; }
          M.mode = 'surf'; menace = 1; jaw = 1; M.hd = FX.K.lerpA(M.hd, FX.angPet(m.x, m.y), Math.min(1, dt * 2.5)); M.spitT -= dt;
          if (M.spitT <= 0 && M.rise > 0.7) { M.spitT = P >= 3 ? 0.45 : 0.6; M.recoil = 0.6; const hp = headAt(M, m), a = FX.angPet(m.x, m.y) + (Math.random() - 0.5) * 0.3; FX.fan(hp[0] + Math.cos(a) * HR, hp[1] + Math.sin(a) * HR, a, P >= 2 ? 7 : 5, 1.0, 6.5 * fast, { dmg: m.dmg * 0.5, color: OCHRE, core: '#FFF0C2', r: 0.26 }); FX.H.sfx.whoosh(); FX.H.sparks(hp[0] + Math.cos(a) * HR, hp[1] - hp[2] + Math.sin(a) * HR, OCHRE_HI, 6, 5); }
          if (m.actT > S.wait + 3.0) { dive(FX, m, true); m.act = 'hunt'; m.actT = 0; }
          break; }
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.jaw = toward(M.jaw, Math.max(jaw, M.roar || 0), dt, jaw > M.jaw ? 4 : 3); M.lie = decay(M.lie, dt, 2);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.mode = 'lie'; M.lie = Math.min(1, M.lie + dt * 2.5); M.jaw = toward(M.jaw, 1, dt, 3); M.menace = decay(M.menace, dt, 4); m.noTouch = true;
      const p = orbAt(FX, M, m); FX.weak('throat', p[0], p[1], 1.3, 2.4, m.stunT > 0.05);
      // thrashing end to end: sand flung with every heave
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.3; const B = body(M, m), q = B[2 + Math.floor(Math.random() * (N - 3))]; grit(FX, q.x, q.y, 5, 0.9); FX.H.shake(2, 0.08); if (Math.random() < 0.4) FX.H.sfx.thud(); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt += dt;
      if (!(m.stunT > 0)) { if (FX.S.weak.throat) FX.weak('throat', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; dive(FX, m, false); M.recoil = 0.8; FX.H.text(m.x, m.y - 2, 'It dives', OCHRE_HI, 13); } } else M.wasStun = true;
      // how it moves: its speed drives the wave down its body and the spray off its wake
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.vx = toward(M.vx, vx, dt, 10); M.vy = toward(M.vy, vy, dt, 10); M.spd = toward(M.spd, Math.hypot(vx, vy), dt, 6); }
      M.wph += dt * (2.2 + M.spd * 0.6 + (M.lie || 0) * 4); M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.2);
      // it banks into its turns
      if (dt > 1e-4) { let dh = (M.hd || 0) - (M.lastHd == null ? (M.hd || 0) : M.lastHd); while (dh > Math.PI) dh -= TAU; while (dh < -Math.PI) dh += TAU; M.lastHd = M.hd; M.turn = toward(M.turn, clamp(dh / dt, -4, 4), dt, 5); }
      // the flower: how far it is open. Forced up it is in full bloom; surfaced to spit it swells and half opens before each
      // spit and pops open with it; under the sand, waiting to spit or to breach, it pushes its bud up through the wake;
      // a roar blooms it (pushing it up out of the sand if it is under). The blades spin with the bloom (slowly, a halo,
      // when it lies forced up)
      const stun = m.stunT > 0, S2 = M.sp, spitUp = m.act === 'spit' && S2 && S2.go, per = FX.S.lv >= 3 ? 0.45 : 0.6;
      const wind = spitUp ? clamp(1 - M.spitT / per, 0, 1) * clamp((M.rise - 0.4) / 0.4, 0, 1) : 0;
      let peek = 0; if (M.mode === 'under' && !stun && m.act !== 'enter') { if (m.act === 'spit' && S2 && !S2.go) peek = 0.35 + 0.5 * clamp(m.actT / S2.wait, 0, 1); else if (m.act === 'breach' && M.br && !M.br.go && Math.hypot(m.x - M.br.x, m.y - M.br.y) < 0.8) peek = 0.6; if (M.roar > 0.15) peek = Math.max(peek, Math.min(1, M.roar * 1.2)); }
      M.wind = toward(M.wind, Math.max(wind, peek * 0.7), dt, 8);
      const bloom = stun ? 1 : Math.max(M.roar || 0, spitUp ? 0.2 + wind * 0.4 + (M.recoil || 0) * 0.8 : 0, peek * 0.35, M.mode === 'arc' ? 0.12 : 0);
      M.bloom = toward(M.bloom, Math.min(1, bloom), dt, bloom > M.bloom ? 7 : 2.5); M.peek = toward(M.peek, peek, dt, peek > M.peek ? 3 : 4);
      const spin = M.bloom * (1 - (M.lie || 0) * 0.75); M.bA += dt * (0.45 + spin * 5); M.bS += dt * (0.3 + spin * 12);
      // the petals twitch now and then
      M.twT -= dt; if (M.twT <= 0) { M.twT = 0.8 + Math.random() * 1.6; M.twU = 0; } if (M.twU != null) { M.twU += dt / 0.3; M.tw = Math.sin(Math.min(1, M.twU) * Math.PI); if (M.twU >= 1) { M.twU = null; M.tw = 0; } }
      // the segments' heights: each follows the mode's shape, and crossing the sand throws it up
      const mode = M.mode, zs = M.zs, lieZ = 0.3; let anyUp = false;
      if (mode === 'surf') M.rise = toward(M.rise, 1, dt, 2.6); else M.rise = toward(M.rise, 0, dt, 5);
      for (let i = 0; i < N; i++) { let z;
        if (mode === 'arc') { const d2 = M.arcProg - i * SEG; z = d2 > 0 && d2 < ARC_D ? ARC_H * Math.sin(Math.PI * d2 / ARC_D) : -1.2; zs[i] = z; }
        else { const want = mode === 'under' ? -1.2 : mode === 'surf' ? (i < 10 ? 4.2 * Math.pow(1 - i / 10, 1.2) * M.rise - (1 - M.rise) * 1.2 : -1.2) : lieZ; zs[i] = toward(zs[i], want, dt, mode === 'lie' ? 4 : 5); }
        const up = zs[i] > 0 ? 1 : 0; if (up) anyUp = true; if (up !== M.up[i] && M.sprayT <= 0 && mode !== 'surf') { const B = M.lastBody; if (B && B[i]) { grit(FX, B[i].x, B[i].y, 5, 1.1 + (mode === 'arc' ? 0.5 : 0)); if (i === 0) FX.H.sfx.whoosh(); } } M.up[i] = up; }
      M.sprayT = (M.sprayT || 0) - dt; if (M.sprayT < -0.05) M.sprayT = 0.04;
      // sand runs off it wherever it goes into the sand or comes out; and off the bud pushing up through the wake
      M.colT -= dt; if (M.colT <= 0) { M.colT = 0.16; if (mode !== 'under' && M.lastBody) { for (let i = 0; i < N - 1; i++) if ((zs[i] > 0) !== (zs[i + 1] > 0) && M.lastBody[i]) grit(FX, M.lastBody[i].x, M.lastBody[i].y, 1, 0.5 + Math.min(1, M.spd * 0.06)); } else if (M.peek > 0.3) grit(FX, m.x + FX.rnd(-0.4, 0.4), m.y, 1, 0.6); }
      // under the sand, its wake spills; surfacing, sand pours off it
      if (mode === 'under' && m.act !== 'enter') { M.wakeT = (M.wakeT || 0) - dt; if (M.wakeT <= 0) { M.wakeT = 0.14 - Math.min(0.08, M.spd * 0.005); grit(FX, m.x + FX.rnd(-0.6, 0.6), m.y + FX.rnd(-0.3, 0.3), 2, 0.5 + Math.min(1.2, M.spd * 0.08)); } }
      if (mode === 'surf' && M.rise < 0.95 && Math.random() < dt * 14) grit(FX, m.x + FX.rnd(-1.2, 1.2), m.y + FX.rnd(-0.5, 0.8), 3, 0.9);
      // out of reach while it is under: nothing of it can be struck but the spires
      const want = !anyUp && mode === 'under' && !(m.stunT > 0) && m.act !== 'enter'; if (want !== !!m.under) FX.untarget(want);
      // the entrance: it heaves up out of the Gullet's sand, rears with a roar, mouth agape at the sky, and plunges
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.mode = e > 0.8 ? 'surf' : 'under'; M.hd = Math.PI / 2; if (e > 1.4) { M.menace = toward(M.menace, 1, dt, 5); M.jaw = toward(M.jaw, 1, dt, 3); if (!M.roared) { M.roared = true; M.roar = 1; FX.H.sfx.crash(); FX.H.shake(8, 0.4); G.sand(FX, m.x, m.y, 16, 1.8); } } }
      else if (M.wasEnter) { M.wasEnter = false; dive(FX, m, false); M.recoil = 1; } },
    dmgK() { return 1; },
    keep: { steps: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t, step) { drawWorm(c, FX, m, X, Y + (m.z || 0) * T * 4, T, t, step); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'spire') drawSpire(c, FX, o, X, Y, T, t); },
  };
  /* ---- the resonator spires: three, round the Gullet; broken while the worm is under, their note forces it up ---- */
  function spawnSpire(FX, i) { const p = spireAt(FX.C, i), h = FX.mem.spires[i]; h.obj = FX.obj({ kind: 'spire', x: p[0], y: p[1], r: 0.9, hp: FX.S.barHP * 0.03, idx: i, onKill: o => { const m = FX.m, M = FX.mem; if (!m || m.dead) return; FX.H.boom(o.x, o.y, 1.3, CYAN, '#FFFFFF', { n: 16, shake: 7 }); FX.H.sfx.crack(); for (let k = 0; k < 8; k++) FX.H.part({ kind: 'shard', x: o.x, y: o.y - 1, vx: FX.rnd(-3, 3), vy: FX.rnd(-5, -1), g: 8, life: 0.8, max: 0.8, size: 5, rot: Math.random() * 3, vr: 6, color: BASALT_HI });
    if (M.mode === 'under' && !(m.stunT > 0) && m.act !== 'enter') resonate(FX, m); else FX.H.text(o.x, o.y - 2, 'The note finds nothing beneath', CYAN_HI, 13); } }); }
  function resonate(FX, m) { const M = FX.mem; m.stunT = 6; m.act = 'hunt'; m.actT = 0; M.mode = 'lie'; M.lie = 0; M.wk = null; M.br = null; FX.S.tele.length = 0; FX.untarget(false); M.roar = 0.7; M.recoil = 1;
    FX.H.banner('THE RESONANCE', 'It is forced up, in bloom: strike the glowing heart!', CYAN, 2.2, true); FX.H.shake(12, 0.5); FX.H.sfx.crash(); FX.H.ring(m.x, m.y, 0.3, 6, 0.6, CYAN, 0.4); const B = body(M, m); for (let i = 0; i < N; i += 2) G.sand(FX, B[i].x, B[i].y, 6, 1.4); }
  function dive(FX, m, quake) { const M = FX.mem; M.mode = 'under'; M.rise = 0; G.sand(FX, m.x, m.y, 14, 1.6); FX.H.shake(6, 0.3); FX.H.sfx.thud(); if (quake) quakeRings(FX, m, m.x, m.y); }
  function quakeRings(FX, m, x, y) { const M = FX.mem, P = FX.S.lv, n = P >= 2 ? 3 : 2;
    for (let k = 0; k < n; k++) { const gaps = [[Math.random() * TAU, 0.45], [Math.random() * TAU, 0.4]]; FX.tele({ shape: 'ring', x, y, r0: 0.4, r1: 1.5, gaps, t: 0.5 + k * 0.7, dmg: m.dmg * 1.3, col: OCHRE_HI, linger: 2.6, tick: (dt, s) => { if (!s.done) return; const sp = 5.5 * FX.S.fast; s.r0 += sp * dt; s.r1 += sp * dt; s.hitT = (s.hitT || 0) - dt; if (s.hitT <= 0 && FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) { s.hitT = 1; FX.hurt(s.dmg); } }, fn: s => { FX.H.shake(6, 0.3); FX.H.sfx.thud(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; G.sand(FX, s.x + Math.cos(a) * 1.2, s.y + Math.sin(a) * 0.8, 2, 0.8); } } }); }
    say(FX, 'quake', 'QUAKE RINGS', 'Rings roll out from where it dives: slip through the gaps', OCHRE_HI); }
  /* the steady sand off it as it moves (its wake, where it goes into the sand, its thrashing): streaks of grit only.
     (G.sand's dust puff is kept for the big moments, a breach or a dive; a puff for every grain of spray would lay an
     ochre haze over the whole Gullet and the worm in it) */
  function grit(FX, x, y, n, k) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (2 + Math.random() * 4) * k; FX.H.part({ kind: 'sand', x: x + Math.cos(a) * 0.3, y: y + Math.sin(a) * 0.2, vx: Math.cos(a) * v * 0.6, vy: -v - 1.5, g: 11, life: 0.4 + Math.random() * 0.3, max: 0.7, size: 2, color: OCHRE_HI }); } }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 1.9 : 1.1, true); }
  /* ---- choosing ---- */
  function startWake(FX, m, n) { const M = FX.mem, me = FX.me, C = FX.C, a = FX.angPet(m.x, m.y), far = Math.hypot(me.x - m.x, me.y - m.y) + 6, wait = (n === 1 ? 1.2 : 0.9) / FX.S.fast;
    // the line runs from the head through the pet to the Gullet's edge
    let len = 2; while (len < 26 && FX.inArena(m.x + Math.cos(a) * len, m.y + Math.sin(a) * len, 1.2)) len += 0.5; len = Math.min(len, far + 4);
    M.wk = { a, x0: m.x, y0: m.y, len, wait, go: false, prog: 0, hit: false, n }; m.act = 'wake'; m.actT = 0; FX.H.sfx.hum();
    FX.tele({ shape: 'line', x: m.x, y: m.y, a, len, w: 2.4, t: wait, dmg: m.dmg * 1.3, col: CYAN, fn: () => { if (M.wk) M.wk.go = true; M.recoil = 0.5; FX.H.sfx.whoosh(); G.sand(FX, m.x, m.y, 10, 1.4); } });
    say(FX, 'wake', n === 1 ? 'SAND WAKE' : 'SAND WAKE · AGAIN', 'Off the line: it surges beneath it', CYAN); }
  function startBreach(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, wait = 1.5 / FX.S.fast, p = FX.clampArena({ x: me.x + (me.vx || 0) * 0.3, y: me.y + (me.vy || 0) * 0.3 }, 2.2);
    let a = Math.atan2(C.y - p.y, C.x - p.x) + (Math.random() - 0.5) * 1.2; if (!FX.inArena(p.x + Math.cos(a) * ARC_D, p.y + Math.sin(a) * ARC_D, 1.5)) a = Math.atan2(C.y - p.y, C.x - p.x);
    M.br = { x: p.x, y: p.y, a, wait, go: false }; m.act = 'breach'; m.actT = 0; FX.H.sfx.hum();
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 2.6, t: wait, dmg: m.dmg * 1.6, col: OCHRE_HI, fn: s => { const B = M.br; if (!B) return; B.go = true; M.arcX = m.x; M.arcY = m.y; M.arcA = B.a; M.arcProg = 0; M.mode = 'arc'; M.roar = 0.5; M.jaw = 1; FX.H.boom(s.x, s.y, 2.2, OCHRE_HI, '#FFFFFF', { n: 20, shake: 10, smoke: 6 }); G.sand(FX, s.x, s.y, 18, 2); FX.H.sfx.crash();
      // where it comes down, and the rings that roll from it
      const ex = s.x + Math.cos(B.a) * ARC_D, ey = s.y + Math.sin(B.a) * ARC_D; FX.tele({ shape: 'circle', x: ex, y: ey, r: 2.2, t: ARC_D / (8 * FX.S.fast), dmg: m.dmg * 1.2, col: OCHRE_HI, fn: s2 => { FX.H.boom(s2.x, s2.y, 1.8, OCHRE_HI, '#FFFFFF', { n: 14, shake: 8, smoke: 4 }); G.sand(FX, s2.x, s2.y, 14, 1.8); quakeRings(FX, m, s2.x, s2.y); } }); } });
    say(FX, 'breach', 'BREACH', 'Off the ring: it erupts there and arcs over', OCHRE_HI); }
  function startSpit(FX, m) { const M = FX.mem, wait = 1.0 / FX.S.fast; M.sp = { wait, go: false }; m.act = 'spit'; m.actT = 0; M.spitT = 0.6; FX.H.sfx.hum();
    FX.tele({ shape: 'circle', x: m.x, y: m.y, r: 2.2, t: wait, dmg: m.dmg * 1.2, col: BONE, tick: (dt, s) => { if (!s.done) { s.x = m.x; s.y = m.y; } }, fn: s => { if (M.sp) M.sp.go = true; M.roar = 0.4; FX.H.boom(s.x, s.y, 1.6, OCHRE_HI, '#FFFFFF', { n: 14, shake: 7, smoke: 5 }); G.sand(FX, s.x, s.y, 16, 1.8); FX.H.sfx.crash(); } });
    say(FX, 'spit', 'SPIT GRIT', 'It surfaces and spits: between the fans, and strike it while it is up', BONE); }
  /* ---- the body: the head leads, the rest follows its trail; each segment has its own height out of the sand ---- */
  function push(M, m) { const tr = M.trail, last = tr[0]; if (!last || Math.hypot(m.x - last.x, m.y - last.y) > 0.1) { tr.unshift({ x: m.x, y: m.y }); if (tr.length > 160) tr.pop(); } }
  function glide(FX, m, M, tx, ty, spd, dt, turn) { const d = Math.hypot(tx - m.x, ty - m.y); if (d > 0.2) { const want = Math.atan2(ty - m.y, tx - m.x); M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (turn || 2.2))); } const v = Math.min(spd, d * 3); m.x += Math.cos(M.hd) * v * dt; m.y += Math.sin(M.hd) * v * dt; const q = FX.clampArena(m, 1.5); m.x = q.x; m.y = q.y; push(M, m); }
  function body(M, m) { const pts = [], zs = M.zs;
    if (M.mode === 'arc' || M.demo === 'arc') { const a = M.demo ? M.hd : M.arcA, ox = M.demo ? m.x - Math.cos(a) * (M.arcProg || 0) : M.arcX, oy = M.demo ? m.y - Math.sin(a) * (M.arcProg || 0) : M.arcY; for (let i = 0; i < N; i++) { const d2 = (M.arcProg || 0) - i * SEG; pts.push({ x: ox + Math.cos(a) * d2, y: oy + Math.sin(a) * d2, z: M.demo ? (d2 > 0 && d2 < ARC_D ? ARC_H * Math.sin(Math.PI * d2 / ARC_D) : -1.2) : zs[i] }); } M.lastBody = pts; return pts; }
    const tr = M.trail; let acc = 0; pts.push({ x: tr[0].x, y: tr[0].y, z: zs[0] });
    for (let i = 1; i < tr.length && pts.length < N; i++) { const a = tr[i - 1], b = tr[i], d = Math.hypot(b.x - a.x, b.y - a.y); acc += d; while (acc >= SEG && pts.length < N) { acc -= SEG; const u = 1 - acc / (d || 1); pts.push({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: zs[pts.length] }); } }
    while (pts.length < N) { const l = pts[pts.length - 1], hd = M.hd || 0; pts.push({ x: l.x - Math.cos(hd) * SEG, y: l.y - Math.sin(hd) * SEG, z: zs[pts.length] }); }
    // reared out of the sand, the raised segments draw in under the head into a column that leans back a little
    const rise = M.mode === 'surf' || M.demo === 'surf' ? (M.rise || 0) : 0; if (rise > 0) { const hd = M.hd == null ? Math.PI / 2 : M.hd, cx = Math.cos(hd), cy = Math.sin(hd), h = pts[0]; for (let i = 1; i < 10; i++) { const back = i * SEG * 0.12 + (i / 9) * (i / 9) * 0.35, p = pts[i]; p.x = lerp(p.x, h.x - cx * back, rise); p.y = lerp(p.y, h.y - cy * back, rise); } }
    M.lastBody = pts; return pts; }
  function headAt(M, m) { const B = M.lastBody || body(M, m), h = B[0]; return [h.x, h.y, Math.max(0, h.z)]; }
  // which way the head points: along its heading, tilted up by its pitch (the arc's slope, a rear, a thrash to the sky)
  function pitchOf(M) { if (M.mode === 'arc' || M.demo === 'arc') { const d2 = M.arcProg || 0; return d2 > 0 && d2 < ARC_D ? Math.atan(ARC_H * Math.PI / ARC_D * Math.cos(Math.PI * d2 / ARC_D) * 0.8) : -0.6; } if (M.mode === 'lie' || M.demo === 'lie') return 1.15 + Math.sin((M.bt || 0) * 3.1) * 0.2; if (M.mode === 'surf' || M.demo === 'surf') return 0.45 - (M.menace || 0) * 0.25 + (M.recoil || 0) * 0.35; return 0; }
  function fwdOf(M, k) { const hd = M.hd == null ? Math.PI / 2 : M.hd, p = pitchOf(M) * (k == null ? 1 : k), cp = Math.cos(p), sp = Math.sin(p); return [Math.cos(hd) * cp, Math.sin(hd) * cp, sp]; }
  // (every key is always listed: a segment under the sand shrinks to nothing at the head, rather than lingering where it was)
  function bodyParts(m, M) { const B = body(M, m), out = []; [0, 3, 6, 9, 13].forEach((i, k) => { const p = B[i], up = p.z > -0.3; out.push(up ? { key: 'b' + k, dx: p.x - m.x, dy: p.y - Math.max(0, p.z) - m.y, r: k ? 1.0 : 1.5 } : { key: 'b' + k, dx: 0, dy: 0, r: 0.01 }); }); return out; }
  /* ---- the spire: a basalt needle with a fork of bone at its top that hums cyan while the worm is under ---- */
  function drawSpire(c, FX, o, X, Y, T, t) { const M = FX.mem, cracked = 1 - o.hp / o.maxhp, under = M.mode === 'under' && FX.m && !(FX.m.stunT > 0) && FX.m.act !== 'enter' ? 1 : 0, hum = under ? 0.6 + 0.4 * Math.sin(t * 6 + o.idx) : 0.2, lw = Math.max(1.2, T * 0.07), sw = Math.sin(t * 1.3 + o.idx) * 0.02;
    c.save(); c.fillStyle = 'rgba(60,40,20,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 0.9, T * 0.32, 0, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = hum * 0.5; blitSized(c, glowSprite(CYAN), X - T * 1.6, Y - T * 3.6, T * 3.2, T * 3.2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // rubble at the foot, the needle, the fork
    [[-0.6, 0.05, 0.3], [0.55, 0.1, 0.26], [0.1, 0.2, 0.2]].forEach(([dx, dy, r]) => TN.shape(c, TN.blob([[X + dx * T - r * T, Y + dy * T], [X + dx * T - r * T * 0.4, Y + dy * T - r * T * 0.9], [X + dx * T + r * T * 0.6, Y + dy * T - r * T * 0.7], [X + dx * T + r * T, Y + dy * T + r * T * 0.2]]), { col: BASALT, shade: BASALT_SH, hi: BASALT_HI, line: INK, r: r * T, lw: lw * 0.8, spec: false, force: true }));
    TN.shape(c, TN.blob([[X - T * 0.42, Y], [X - T * 0.3 + sw * T, Y - T * 1.6], [X - T * 0.12 + sw * T * 2, Y - T * 2.9], [X + T * 0.12 + sw * T * 2, Y - T * 2.9], [X + T * 0.3 + sw * T, Y - T * 1.6], [X + T * 0.42, Y]]), { col: BASALT, shade: BASALT_SH, hi: BASALT_HI, line: INK, r: T * 1.2, lw, d1: 0.1, d2: 0.2, spec: 0.3, specAt: [X - T * 0.15, Y - T * 2.2], force: true, inner: g => { g.save(); g.strokeStyle = `rgba(98,191,201,${0.3 + hum * 0.6})`; g.lineWidth = Math.max(1, T * 0.06); for (let i = 0; i < 4; i++) { const yy = Y - T * (0.5 + i * 0.55); g.beginPath(); g.moveTo(X - T * 0.4, yy); g.lineTo(X + T * 0.4, yy - T * 0.15); g.stroke(); } if (cracked > 0.3) { g.strokeStyle = INK; g.lineWidth = Math.max(1.2, T * 0.08); g.beginPath(); g.moveTo(X - T * 0.2, Y - T * 2.4); g.lineTo(X + T * 0.05, Y - T * 1.9); g.lineTo(X - T * 0.1, Y - T * 1.3); g.lineTo(X + T * 0.15, Y - T * 0.7); g.stroke(); } g.restore(); } });
    [-1, 1].forEach(sd => tubeLite(c, [[X + sd * T * 0.1, Y - T * 2.85], [X + sd * T * 0.3 + sw * T * 3, Y - T * 3.4], [X + sd * T * 0.36 + sw * T * 4, Y - T * 3.95]], u => T * (0.16 - u * 0.05), { col: BONE, shade: BONE_SH, hi: BONE_HI, line: INK, lw: lw * 0.8, force: true }));
    // the note: rings rising off the fork while it hums
    if (under) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = CYAN_HI; c.lineWidth = Math.max(1, T * 0.06); for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i / 3 + o.idx * 0.2) % 1; c.globalAlpha = (1 - u) * 0.7; c.beginPath(); c.ellipse(X + sw * T * 4, Y - T * 3.6 - u * T * 1.2, T * (0.3 + u * 1.1), T * (0.12 + u * 0.4), 0, 0, TAU); c.stroke(); } c.restore();
      c.font = `800 ${Math.round(T * 0.26)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('RESONATE', X, Y - T * 4.5); c.fillText('RESONATE', X, Y - T * 4.5); }
    c.restore(); }
  /* ---- painting: the wake; Astaroth's serpent wherever it is out of the sand; the bud, its heart and the blades ---- */
  function drawWorm(c, FX, m, X, Y, T, t, step) {
    const go = i => step == null || step === i, K = FX.K, M = FX.mem, P3 = TN.cam(X, Y, T, m), bt = M.bt || t, hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, lie = M.lie || (M.demo === 'lie' ? 1 : 0), wph = M.wph == null ? t * 3 : M.wph, lw = Math.max(1.4, T * 0.08);
    if (M.demo && (!M.trail || !M.trail.length)) { M.hd = M.hd == null ? Math.PI / 2 : M.hd; M.mode = M.demo; M.trail = []; M.zs = new Float32Array(N); for (let i = 0; i < 90; i++) { const u = i * 0.15; M.trail.push({ x: m.x - Math.cos(M.hd) * u + Math.sin(u * 0.7) * 0.9 * Math.sin(M.hd), y: m.y - Math.sin(M.hd) * u - Math.sin(u * 0.7) * 0.9 * Math.cos(M.hd) }); } for (let i = 0; i < N; i++) M.zs[i] = M.demo === 'under' ? -1.2 : M.demo === 'surf' ? (i < 10 ? 4.2 * Math.pow(1 - i / 10, 1.2) : -1.2) : 0.3; M.rise = 1; }
    const B = body(M, m), under = M.mode === 'under';
    // rearing out of the sand it is seen to come up at once (the picture leads its heights a little, so the first
    // moments of a rear are not a stub)
    if (M.mode === 'surf' && !M.demo && M.rise > 0.02) { const r2 = Math.sqrt(M.rise); for (let i = 0; i < 10; i++) B[i].z = Math.max(B[i].z, 4.2 * Math.pow(1 - i / 10, 1.2) * r2 - (1 - r2) * 1.2); }
    // Astaroth's swimming: a wave runs down the body from the neck, side to side, growing toward the tail, a jolt when it
    // is struck and wild when it lies forced up (then it heaves in humps off the sand); the head is spared, it leads
    const amp = (1 + hs * 1.2) * (1 + lie * 0.6) * (under ? 0.5 : 1);
    for (let i = 1; i < N; i++) { const u = i / (N - 1), a = B[i - 1], b = B[Math.min(N - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, s = Math.sin(wph - i * 0.6) * (0.05 + u * 0.36) * amp * Math.min(1, i / 3), p = B[i]; p.x += -dy / d * s; p.y += dx / d * s;
      if (p.z > 0) p.z = lie > 0 ? p.z + Math.max(0, Math.sin(wph * 1.3 - i * 0.7)) * 0.45 * lie : Math.max(0.03, p.z + Math.cos(wph * 0.7 - i * 0.5) * 0.12 * u * amp); }
    // reared out of the sand, its neck bows back like a cobra's, the bud held out in front, swaying
    const rs = M.mode === 'surf' || M.demo === 'surf' ? (M.rise || 0) : 0; if (rs > 0) { const hd = M.hd == null ? Math.PI / 2 : M.hd, cx = Math.cos(hd), cy = Math.sin(hd); for (let i = 1; i < 10; i++) { const off = Math.sin(i / 9 * Math.PI) * 1.1 * rs * (1 + Math.sin(bt * 1.2) * 0.12); B[i].x -= cx * off; B[i].y -= cy * off; } }
    // (its girth, breathing at the shoulders)
    const wf = i => T * girth(i / (N - 1)) * (1 + hs * 0.1 + roar * 0.06 + Math.sin(bt * 1.6) * 0.04 * Math.max(0, 1 - i / 6));
    // the stretches of it out of the sand, each cut off exactly where it meets the sand (a point laid on the surface there)
    const runs = []; let cur = null;
    for (let i = 0; i < N; i++) { const p = B[i];
      if (p.z > 0) { if (!cur) { cur = { pts: [], e: 0 }; runs.push(cur); if (i > 0) { const q = B[i - 1], f = p.z / (p.z - q.z); cur.pts.push({ x: lerp(p.x, q.x, f), y: lerp(p.y, q.y, f), z: 0, i: i - f, cross: true }); } } cur.pts.push({ x: p.x, y: p.y, z: p.z, i }); cur.e = i; }
      else if (cur) { const q = B[i - 1], f = q.z / (q.z - p.z); cur.pts.push({ x: lerp(q.x, p.x, f), y: lerp(q.y, p.y, f), z: 0, i: i - 1 + f, cross: true }); cur = null; } }
    const hOut = B[0].z > 0;
    // the wake: a hump of sand over the head with ripples spilling behind it
    if (go(0)) { if (under || !hOut) { const q = P3(m.x, m.y, 0), k = Math.min(1, 0.55 + (M.spd || 0) * 0.05), tr = M.trail;
        c.save(); c.lineCap = 'round'; for (let i = 1; i <= 4; i++) { const j = Math.min(tr.length - 1, i * 4); if (!tr[j] || !tr[j - 1]) break; const r = P3(tr[j].x, tr[j].y, 0), da = Math.atan2(tr[j - 1].y - tr[j].y, tr[j - 1].x - tr[j].x), rr = T * (1.3 + i * 0.5), a = (1 - i * 0.2) * k; for (const [col, w, off] of [['rgba(110,70,25,.75)', 0.16, 0], ['rgba(255,240,200,.75)', 0.07, -0.08]]) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = Math.max(1, T * w); c.beginPath(); c.ellipse(r[0], r[1] + off * T, rr, rr * 0.42, 0, da + Math.PI / 2 + 0.35, da + Math.PI * 1.5 - 0.35); c.stroke(); } } c.restore();
        if (under) { G.mound(c, q[0], q[1], T * 2.2 * (0.8 + k * 0.3), T * 1.4 * k, 1, { glow: menace * 0.5 + (M.peek || 0) * 0.4 }); const sp = Math.min(1, (M.spd || 0) / 8); if (sp > 0.05) { c.save(); c.fillStyle = 'rgba(251,244,224,.75)'; for (let i = 0; i < 6; i++) { const ph = (bt * 3 + i * 0.37) % 1, a = (M.hd || 0) + (i - 2.5) * 0.25; c.globalAlpha = (1 - ph) * sp; c.beginPath(); c.arc(q[0] + Math.cos(a) * T * (1.2 + ph * 1.6), q[1] - T * (0.9 + ph * 1.2 - ph * ph * 1.4) + Math.sin(a) * T * 0.3, T * (0.09 - ph * 0.05), 0, TAU); c.fill(); } c.restore(); } } }
      // shadows under the raised stretches, and a scoop of sand behind it wherever it goes into the sand or comes out
      c.save(); c.fillStyle = 'rgba(60,40,20,.35)'; for (let i = 0; i < N; i += 2) { const p = B[i]; if (p.z <= 0) continue; const q = P3(p.x, p.y, 0), kk = 1 / (1 + p.z * 0.25); c.globalAlpha = 0.6 * kk; c.beginPath(); c.ellipse(q[0], q[1], T * (1.3 - i / N) * kk, T * 0.45 * kk, 0, 0, TAU); c.fill(); } c.restore();
      for (const r of runs) for (const p of [r.pts[0], r.pts[r.pts.length - 1]]) if (p.cross) { const q = P3(p.x, p.y, 0), w = wf(p.i); c.fillStyle = 'rgba(70,45,20,.4)'; c.beginPath(); c.ellipse(q[0], q[1] + w * 0.1, w * 0.95, w * 0.4, 0, 0, TAU); c.fill(); G.mound(c, q[0], q[1] - w * 0.08, w * 0.95, w * 0.45, 1); } }
    if (!go(1)) return;
    // the fins: two small pairs behind the head, bone membranes ribbed with cyan; they beat with its pace, bank on the
    // turns, flare when it roars and flail when it lies forced up
    const fins = []; for (const i of [3, 8]) { const p = B[i]; if (!(p.z > 0.3)) continue; const a = B[i - 1], b = B[i + 1], hd = Math.atan2(a.y - b.y, a.x - b.x); for (const s of [-1, 1]) fins.push({ i, s, hd, k: i === 3 ? 0 : 1, far: Math.sin(hd + s * Math.PI / 2) < 0 }); }
    const fin = F => { const a = B[F.i], bank = clamp((M.turn || 0) * F.s * 0.2, -0.3, 0.3), beat = Math.sin(t * (3 + (M.spd || 0) * 0.2) + F.k * 0.9 + (F.s > 0 ? 0 : 0.5)) * 0.4 + lie * Math.sin(t * 9 + F.i) * 0.35, L = (F.k ? 1.1 : 1.55) * (1 + roar * 0.25 + menace * 0.1 - bank), sa = F.hd + F.s * (Math.PI / 2 + 0.45 + bank), ch = Math.cos(F.hd), sh = Math.sin(F.hd);
      const root = P3(a.x, a.y, a.z + 0.1), tip = P3(a.x + Math.cos(sa) * L - ch * 0.8, a.y + Math.sin(sa) * L - sh * 0.8, a.z + 0.45 + beat * 0.7 + bank), mid = P3(a.x + Math.cos(sa) * L * 0.5 + ch * 0.25, a.y + Math.sin(sa) * L * 0.5 + sh * 0.25, a.z + 0.35 + beat * 0.4), tr = P3(a.x - ch * 1.1 + Math.cos(sa) * L * 0.25, a.y - sh * 1.1 + Math.sin(sa) * L * 0.25, a.z + 0.05);
      const path = () => { c.beginPath(); c.moveTo(root[0], root[1]); c.quadraticCurveTo(mid[0], mid[1] - T * 0.2, tip[0], tip[1]); c.quadraticCurveTo((tip[0] + tr[0]) / 2 + T * 0.1, (tip[1] + tr[1]) / 2 + T * 0.25, tr[0], tr[1]); c.closePath(); };
      c.save(); c.globalAlpha = F.far ? 0.75 : 0.95; path(); const g = c.createLinearGradient(root[0], root[1], tip[0], tip[1]); g.addColorStop(0, OCHRE_SH); g.addColorStop(0.55, OCHRE_HI); g.addColorStop(1, BONE_HI); c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = CYAN; c.globalAlpha = 0.35 + menace * 0.3 + lie * 0.3; c.lineWidth = Math.max(1, T * 0.05); for (let f = 1; f < 4; f++) { c.beginPath(); c.moveTo(root[0], root[1]); c.lineTo(lerp(tip[0], tr[0], f / 4), lerp(tip[1], tr[1], f / 4)); c.stroke(); } c.restore();
      path(); c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.lineJoin = 'round'; c.stroke(); c.restore(); };
    fins.forEach(F => F.far && fin(F));
    // the long body: bone-and-ochre scales above, a pale belly beneath, cyan veins down the back that burn brighter
    // before a blow and when it lies forced up, basalt plates along the spine
    const vein = 0.3 + menace * 0.35 + lie * 0.3 + roar * 0.3;
    for (const r of runs) { const n = r.pts.length; if (n < 2) continue; const sp = [], ws = []; for (let k = 0; k < n; k++) { const p = r.pts[n - 1 - k]; sp.push(P3(p.x, p.y, p.z)); ws.push(wf(p.i)); }
      const W = u => ws[Math.round(u * (n - 1))];
      const E = K.tube(c, sp, W, { col: SCALE, tex: 'scale', texA: 0.85, texS: 0.4, dk: SCALE_DK, dkA: 0.55, hi: SCALE_HI, hiA: 0.3, rim: CYAN, rimA: 0.2 + menace * 0.2 + lie * 0.25,
        inner: (L, R) => { const lowL = (L[0][1] + L[n - 1][1]) > (R[0][1] + R[n - 1][1]), low = lowL ? L : R, up = lowL ? R : L;
          c.strokeStyle = 'rgba(251,244,224,.62)'; c.lineWidth = T * 0.42; c.lineJoin = 'round'; c.beginPath(); low.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
          c.strokeStyle = 'rgba(120,90,55,.45)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); for (let k = 1; k < n - 1; k++) { const a = low[k], q = sp[k]; c.moveTo(a[0], a[1]); c.lineTo(lerp(a[0], q[0], 0.4), lerp(a[1], q[1], 0.4)); } c.stroke();
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = CYAN; c.lineWidth = Math.max(1, T * 0.07); c.globalAlpha = Math.min(1, vein * (0.8 + 0.2 * Math.sin(t * 5))); c.beginPath(); for (let k = 0; k < n; k++) { const q = sp[k], e = up[k], wv = Math.sin(k * 1.9 + bt * 0.8) * 0.12; const x = lerp(q[0], e[0], 0.5 + wv), y = lerp(q[1], e[1], 0.5 + wv); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
          c.lineWidth = Math.max(1, T * 0.04); c.globalAlpha *= 0.6; c.beginPath(); for (let k = 0; k < n; k++) { const q = sp[k], e = low[k], wv = Math.cos(k * 1.4 + bt * 0.6) * 0.1; const x = lerp(q[0], e[0], 0.25 + wv), y = lerp(q[1], e[1], 0.25 + wv); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
          c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } });
      // (an ink outline round it, as the cel-shaded fiends all have)
      c.beginPath(); E.L.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); for (let k = E.R.length - 1; k >= 0; k--) c.lineTo(E.R[k][0], E.R[k][1]); c.closePath(); c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke();
      // the basalt plates down its spine, raked back, riding the wave; their roots hum cyan
      for (let k = 1; k < n - 1; k++) { const p = r.pts[k]; if (p.cross || p.i % 2 || p.i < 2 || p.i > N - 4) continue; const q = P3(p.x, p.y, p.z), qa = r.pts[k - 1], qb = r.pts[k + 1], A = P3(qa.x, qa.y, qa.z), Bq = P3(qb.x, qb.y, qb.z); let dx = Bq[0] - A[0], dy = Bq[1] - A[1]; const dd = Math.hypot(dx, dy) || 1; dx /= dd; dy /= dd;
        let nx = -dy, ny = dx; if (ny > 0 || (Math.abs(ny) < 0.05 && nx > 0)) { nx = -nx; ny = -ny; }
        const w = wf(p.i), u = p.i / (N - 1), L = w * (0.3 + 0.32 * (1 - u)) * (1 + roar * 0.15 + Math.sin(wph - p.i * 0.6) * 0.06), bw = w * 0.2, bx = q[0] + nx * w * 0.34, by = q[1] + ny * w * 0.34, b0 = [bx - dx * bw, by - dy * bw], b1 = [bx + dx * bw, by + dy * bw], tip = [bx + nx * L + dx * L * 0.6, by + ny * L + dy * L * 0.6];
        c.fillStyle = BASALT; c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(tip[0], tip[1]); c.lineTo(b1[0], b1[1]); c.closePath(); c.fill();
        c.fillStyle = BASALT_SH; c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(b1[0], b1[1]); c.lineTo(bx, by); c.closePath(); c.fill();
        c.strokeStyle = BASALT_HI; c.lineWidth = Math.max(1, w * 0.06); c.beginPath(); c.moveTo(lerp(b0[0], tip[0], 0.15), lerp(b0[1], tip[1], 0.15)); c.lineTo(lerp(b0[0], tip[0], 0.85), lerp(b0[1], tip[1], 0.85)); c.stroke();
        c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.75); c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(tip[0], tip[1]); c.lineTo(b1[0], b1[1]); c.stroke();
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, vein); c.strokeStyle = CYAN; c.lineWidth = Math.max(1, w * 0.07); c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke(); c.restore(); }
      // the tail, when it is out: a basalt fluke
      const tl = r.pts[n - 1]; if (r.e === N - 1 && !tl.cross) { const te = sp[0], tb = sp[Math.min(n - 1, 2)], ta = Math.atan2(te[1] - tb[1], te[0] - tb[0]), s = T * 0.9, ca = Math.cos(ta), sa = Math.sin(ta), F = (x, y) => [te[0] + ca * x * s - sa * y * s, te[1] + sa * x * s + ca * y * s], fl = Math.sin(wph * 1.2) * 0.25;
        TN.shape(c, TN.poly([F(-0.2, 0), F(0.9, -0.75 + fl), F(0.55, 0), F(0.9, 0.75 + fl)]), { col: BASALT, shade: BASALT_SH, hi: BASALT_HI, line: INK, r: s, lw: lw * 0.8, spec: false, force: true }); }
      // where it goes into the sand: a lip of sand heaped over it, grains spilling off
      for (const p of [r.pts[0], r.pts[n - 1]]) if (p.cross) { const q = P3(p.x, p.y, 0), w = wf(p.i); G.mound(c, q[0], q[1] + w * 0.18, w * 0.8, w * 0.34, 0.9);
        c.save(); c.fillStyle = 'rgba(251,244,224,.8)'; for (let j = 0; j < 5; j++) { const ph = (bt * 1.6 + j * 0.21 + p.i * 0.3) % 1, a = j * 1.3 + p.i; c.globalAlpha = (1 - ph) * 0.8; c.beginPath(); c.arc(q[0] + Math.cos(a) * w * (0.3 + ph * 0.5), q[1] - w * (0.25 + ph * 0.6 - ph * ph * 0.9), T * (0.07 - ph * 0.04), 0, TAU); c.fill(); } c.restore(); } }
    fins.forEach(F => !F.far && fin(F));
    // the head: a flower bud on the end of the neck, or (still under the sand) the bud pushing up through the wake
    const k = M.bloom || (M.demo === 'lie' ? 1 : 0), wind = M.wind || 0, sw = BUD * (1 + wind * 0.14 + hs * 0.08 + Math.sin(bt * 1.6) * 0.025);
    if (hOut) { const h = B[0], F = budFrame(FX, M, m, [h.x, h.y, h.z]); drawBud(c, FX, m, M, P3, T, t, F, { k, sw, wind, lie, alpha: 1 }); }
    else if (under && (M.peek || 0) > 0.02) { const pk = M.peek, hd = M.hd == null ? Math.PI / 2 : M.hd, pp = 1.0 + Math.sin(bt * 1.3) * 0.08, cp = Math.cos(pp), spp = Math.sin(pp), ch = Math.cos(hd), sh = Math.sin(hd), f = [ch * cp, sh * cp, spp], base = [m.x, m.y, -2.4 + pk * 3.0];
      const F = { f, u: [-sh, ch, 0], v: [-ch * spp, -sh * spp, cp], base }, cy = Y - T * 0.45;
      drawBud(c, FX, m, M, P3, T, t, F, { k, sw, wind, lie: 0, alpha: 1, clipY: cy, neck: true });
      G.mound(c, X, cy + T * 0.2, T * 1.05, T * 0.42, 1); }
    if (roar > 0 && (hOut || under)) { const h = hOut ? B[0] : { x: m.x, y: m.y, z: 0.5 }, q = P3(h.x, h.y, Math.max(0, h.z) + 1); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = roar * 0.35; blitSized(c, glowSprite(CYAN), q[0] - T * 3.5, q[1] - T * 3, T * 7, T * 6); c.restore(); }
  }
  // the bud's frame: f along it (its heading, tipped up by its pitch), u and v across. Surfaced or lying out it turns its
  // bud toward the pet; it sways a little always, and leans into its turns
  function budFrame(FX, M, m, h) { const mode = M.demo || M.mode, bt = M.bt || 0, me = FX.me; let hd = M.hd == null ? Math.PI / 2 : M.hd;
    if (me && (mode === 'surf' || mode === 'lie')) hd = FX.K.lerpA(hd, Math.atan2(me.y - h[1], me.x - h[0]), mode === 'lie' ? 0.5 : 0.3);
    hd += Math.sin(bt * 1.1) * 0.14 * (1 - (M.menace || 0) * 0.5) + clamp((M.turn || 0) * 0.06, -0.2, 0.2);
    const p = pitchOf(M) + Math.sin(bt * 1.6 + 1) * 0.06 - (FX.m && FX.m.hitSq || 0) * 0.15, cp = Math.cos(p), sp = Math.sin(p), ch = Math.cos(hd), sh = Math.sin(hd);
    return { f: [ch * cp, sh * cp, sp], u: [-sh, ch, 0], v: [-ch * sp, -sh * sp, cp], base: [h[0] + ch * cp * 0.1, h[1] + sh * cp * 0.1, Math.max(0, h[2]) + sp * 0.1] }; }
  // the glowing heart in the bud, where the weak point sits (on the ground plane, as the hit proxies are)
  function orbAt(FX, M, m) { const h = headAt(M, m), F = budFrame(FX, M, m, h), a = (0.8 + (M.bloom || 0) * 0.12) * BUD * (1 + (M.wind || 0) * 0.14), o = [F.base[0] + F.f[0] * a, F.base[1] + F.f[1] * a, F.base[2] + F.f[2] * a]; return [o[0], o[1] - o[2]]; }
  /* the bud: five bone-and-ochre outer petals over five rose-and-amber inner ones, cyan at their edges, wrapped to a point
     in a basalt calyx round a dark heart; blooming, they peel open and back and the heart's orb shines out, cyan-white.
     About it six blades of steel float in a loose ring, bobbing and turning; as it blooms they spin up fast, turn edge-on
     and glow with trails behind them; lying forced up they hang in a slow wide halo, glowing */
  function drawBud(c, FX, m, M, P3, T, t, F, o) {
    const K = FX.K, { f, u, v, base } = F, k = o.k, sw = o.sw, bt = M.bt || t, hs = m.hitSq || 0, lie = o.lie, tw = M.tw || 0, lw = Math.max(1.2, T * 0.07), stun = m.stunT > 0 || M.demo === 'lie';
    const at = (ax, r, ca, sa, w) => { const dx = u[0] * ca + v[0] * sa, dy = u[1] * ca + v[1] * sa, dz = u[2] * ca + v[2] * sa, tx = -u[0] * sa + v[0] * ca, ty = -u[1] * sa + v[1] * ca, tz = -u[2] * sa + v[2] * ca; return [base[0] + f[0] * ax + dx * r + tx * w, base[1] + f[1] * ax + dy * r + ty * w, base[2] + f[2] * ax + dz * r + tz * w]; };
    const parts = [], twist = Math.sin(bt * 0.7) * 0.12, heart = at(0.72 * sw, 0, 1, 0, 0), hq = P3(heart[0], heart[1], heart[2]), orb = at((0.8 + k * 0.12) * sw, 0, 1, 0, 0), toCam = f[1] * CAM[1] + f[2] * CAM[2];
    // the calyx: five basalt sepals cupping the foot of the bud
    for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + Math.PI / 5 + twist, ca = Math.cos(a), sa = Math.sin(a), P = [at(0, 0.5 * sw, ca, sa, -0.26 * sw), at(0.3 * sw, (0.7 + k * 0.2) * sw, ca, sa, -0.18 * sw), at((0.66 - k * 0.22) * sw, (0.64 + k * 0.45) * sw, ca, sa, 0), at(0.3 * sw, (0.7 + k * 0.2) * sw, ca, sa, 0.18 * sw), at(0, 0.5 * sw, ca, sa, 0.26 * sw)];
      parts.push({ at: P[1], draw: () => { const sp = P.map(p => P3(p[0], p[1], p[2])); TN.shape(c, TN.blob(sp), { col: BASALT, shade: BASALT_SH, hi: BASALT_HI, line: INK, r: T * 0.5, lw, d1: 0.1, d2: 0.2, spec: false, force: true, inner: g => { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = CYAN; g.globalAlpha = 0.4; g.lineWidth = Math.max(1, T * 0.05); g.beginPath(); g.moveTo((sp[0][0] + sp[4][0]) / 2, (sp[0][1] + sp[4][1]) / 2); g.lineTo(sp[2][0], sp[2][1]); g.stroke(); g.restore(); } }); } }); }
    // the petals: peeled by kk (0 wrapped to a point, 1 opened right back), each breathing and twitching on its own
    const petal = (j, off, S, kk, inner) => { const a = j / 5 * TAU + off + twist, ca = Math.cos(a), sa = Math.sin(a), fl = Math.sin(bt * 2.1 + j * 1.3 + (inner ? 2 : 0)) * 0.05 + tw * 0.14 * Math.sin(j * 2.7 + 1) + hs * 0.15 + (o.wind || 0) * Math.sin(bt * 14 + j) * 0.03;
      const s = S * sw, rb = 0.52, ab = 0.05, rm = 0.95 + kk * 0.6, am = 0.85 - kk * 0.15, rt = 0.12 + kk * 1.6 + fl, aT = 1.95 - kk * 1.55, wb = 0.3, wm = 0.55 - kk * 0.08, wt = 0.08 + kk * 0.25;
      const P = [at(ab * s, rb * s, ca, sa, -wb * s), at(am * s, rm * s, ca, sa, -wm * s), at(aT * s, rt * s, ca, sa, -wt * s), at((aT + 0.08 - kk * 0.3) * s, (rt + 0.08) * s, ca, sa, 0), at(aT * s, rt * s, ca, sa, wt * s), at(am * s, rm * s, ca, sa, wm * s), at(ab * s, rb * s, ca, sa, wb * s)], mid = at(am * s, rm * s, ca, sa, 0);
      // (its inner face looks in at the axis while it is wrapped, and along the axis once it has peeled back)
      const nx = f[0] * kk - (u[0] * ca + v[0] * sa) * (1 - kk), ny = f[1] * kk - (u[1] * ca + v[1] * sa) * (1 - kk), nz = f[2] * kk - (u[2] * ca + v[2] * sa) * (1 - kk), fk = clamp(0.5 + (ny * CAM[1] + nz * CAM[2]) * 1.6, 0, 1);
      parts.push({ at: [mid[0], mid[1], mid[2] + (inner ? -0.06 : 0.06)], draw: () => { const sp = P.map(p => P3(p[0], p[1], p[2])), q = P3(mid[0], mid[1], mid[2]), mk = kk * (0.25 + 0.7 * fk);
        const col = inner ? K.mixC(PR, AMBER, mk * 0.55) : K.mixC(PO, PR, mk), shade = inner ? PR_SH : K.mixC(PO_SH, PR_SH, mk * 0.7), hi = inner ? PR_HI : K.mixC(PO_HI, PR_HI, mk * 0.6);
        TN.shape(c, TN.blob(sp), { col, shade, hi, line: INK, r: T * 0.9 * s, lw, d1: 0.1, d2: 0.2, spec: 0.25, specAt: [q[0] - T * 0.2, q[1] - T * 0.35], force: true, inner: g => { g.save(); g.strokeStyle = 'rgba(90,50,40,.45)'; g.lineWidth = Math.max(1, T * 0.05); g.beginPath(); g.moveTo((sp[0][0] + sp[6][0]) / 2, (sp[0][1] + sp[6][1]) / 2); g.quadraticCurveTo(q[0], q[1], sp[3][0], sp[3][1]); g.stroke();
          g.globalCompositeOperation = 'lighter'; g.strokeStyle = CYAN; g.globalAlpha = 0.45 + k * 0.4; g.lineWidth = Math.max(1.5, T * 0.13); g.beginPath(); TN.blob(sp)(g); g.stroke();
          if (k > 0.3) { g.globalAlpha = (k - 0.3) * 0.5; blitSized(g, glowSprite(inner ? AMBER : CYAN), q[0] - T, q[1] - T, T * 2, T * 2); } g.restore(); } }); } }); };
    for (let j = 0; j < 5; j++) petal(j, 0, 1, k, false);
    for (let j = 0; j < 5; j++) petal(j, Math.PI / 5, 0.8, k * 0.78, true);
    // the heart, and the orb it bares: cyan-white, a soft glow and a twinkle; it flickers when the worm is stunned
    parts.push({ at: heart, draw: () => { const r = T * 0.55 * sw; TN.shape(c, TN.ell(hq[0], hq[1], r, r * 0.95, 0), { col: HEART, shade: '#3E1A26', hi: '#A0566A', line: INK, r, lw, d1: 0.1, d2: 0.22, spec: false, force: true });
      const ko = clamp((k - 0.15) / 0.5, 0, 1) * clamp((toCam + 0.45) / 0.6, 0, 1); if (ko <= 0.01) return;
      const q = P3(orb[0], orb[1], orb[2]), fl = stun ? 0.6 + 0.4 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5.3 + 1)) : 0.88 + 0.12 * Math.sin(t * 6), R1 = T * (1.1 + k * 0.9), R2 = T * 0.6, rr = T * 0.3 * (0.6 + ko * 0.4) * sw;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ko * 0.75 * fl; blitSized(c, glowSprite(CYAN), q[0] - R1, q[1] - R1, R1 * 2, R1 * 2); c.globalAlpha = ko * 0.8 * fl; blitSized(c, glowSprite('#FFFFFF'), q[0] - R2, q[1] - R2, R2 * 2, R2 * 2); c.restore();
      c.save(); c.globalAlpha = ko; c.fillStyle = CYAN; c.beginPath(); c.arc(q[0], q[1], rr, 0, TAU); c.fill(); c.fillStyle = '#E8FFFC'; c.beginPath(); c.arc(q[0] - rr * 0.15, q[1] - rr * 0.15, rr * 0.72, 0, TAU); c.fill(); c.strokeStyle = 'rgba(30,26,34,.55)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.arc(q[0], q[1], rr, 0, TAU); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(q[0] - rr * 0.35, q[1] - rr * 0.4, rr * 0.22, 0, TAU); c.fill(); c.restore();
      TN.twinkle(c, q[0], q[1], T * (0.4 + 0.2 * Math.sin(t * 4)) * ko * fl, '#FFFFFF', 0.9 * ko); } });
    // the blades: a loose ring about the middle of the bud, the far ones behind it and the near ones in front
    const spin = k * (1 - lie * 0.75), glowK = clamp((k - 0.2) / 0.5, 0, 1), bA = M.bA == null ? bt * 0.5 : M.bA, bS = M.bS == null ? bt * 0.4 : M.bS, Cb = at(0.85 * sw, 0, 1, 0, 0), cd = dep(Cb), R0 = 2.5 + lie * 0.6 - (o.wind || 0) * 0.6 + hs * 0.45 - spin * 0.15, far = [], near = [];
    for (let j = 0; j < 6; j++) { const a = bA + j * TAU / 6, R = R0 + Math.sin(bt * 0.9 + j * 1.7) * 0.12, p = [Cb[0] + Math.cos(a) * R, Cb[1] + Math.sin(a) * R, Cb[2] + Math.sin(bt * 1.7 + j * 2.1) * 0.22 * (1 - spin * 0.5) + lie * 0.35], b = { p, a, R, j, rs: bS * (j % 2 ? 1 : -1) + j }; (dep(p) < cd ? far : near).push(b); }
    const al = b => (o.clipY != null ? clamp((b.p[2] + 0.3) / 0.6, 0, 1) : 1) * o.alpha;
    far.forEach(b => blade(c, P3, T, b, spin, glowK, lw, al(b)));
    if (o.clipY != null) { c.save(); c.beginPath(); c.rect(hq[0] - T * 12, o.clipY - T * 16, T * 24, T * 16); c.clip(); }
    if (o.neck) { const n0 = [base[0] - f[0] * 1.6, base[1] - f[1] * 1.6, base[2] - f[2] * 1.6], n1 = [base[0] - f[0] * 0.6, base[1] - f[1] * 0.6, base[2] - f[2] * 0.6]; K.tube(c, [P3(n0[0], n0[1], n0[2]), P3(n1[0], n1[1], n1[2]), P3(base[0], base[1], base[2])], () => T * 1.45, { col: SCALE, dk: SCALE_DK, dkA: 0.55, hi: SCALE_HI, hiA: 0.3, rim: CYAN, rimA: 0.3 }); }
    parts.sort((a, b) => dep(a.at) - dep(b.at)); for (let i = 0; i < parts.length; i++) parts[i].draw();
    if (o.clipY != null) c.restore();
    near.forEach(b => blade(c, P3, T, b, spin, glowK, lw, al(b)));
  }
  // one blade: a steel crescent or a kite-shaped shard, cel-shaded (a dark face, a lit face, a bright edge, an ink line);
  // spinning, it turns edge-on and trails light along its orbit; glowing, cyan or amber
  function blade(c, P3, T, b, spin, glowK, lw, al) { if (al <= 0.02) return;
    const q = P3(b.p[0], b.p[1], b.p[2]), j = b.j, cres = j % 2 === 0, s = T * (cres ? 0.55 : 0.46), rot = b.a + Math.PI / 2 + b.rs * (0.2 + spin * 0.8), sq = 1 - spin * 0.7 * (0.55 + 0.45 * Math.abs(Math.sin(b.rs * 0.5 + j))), cr = Math.cos(rot), sr = Math.sin(rot), gc = j % 2 ? AMBER : CYAN;
    const path = L => { c.beginPath(); for (let i = 0; i < L.length; i++) { const x = q[0] + L[i][0] * s * cr - L[i][1] * s * sq * sr, y = q[1] + L[i][0] * s * sr + L[i][1] * s * sq * cr; i ? c.lineTo(x, y) : c.moveTo(x, y); } };
    c.save(); c.globalAlpha = al; c.lineJoin = 'round'; c.lineCap = 'round';
    if (spin > 0.15) { const cx = q[0] - Math.cos(b.a) * b.R * T, cy = q[1] - Math.sin(b.a) * b.R * T, len = 0.25 + spin * 0.8; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = gc; c.globalAlpha = al * spin * 0.5; c.lineWidth = s * 0.5; c.beginPath(); c.arc(cx, cy, b.R * T, b.a - len, b.a); c.stroke(); c.strokeStyle = '#FFFFFF'; c.globalAlpha = al * spin * 0.4; c.lineWidth = s * 0.14; c.beginPath(); c.arc(cx, cy, b.R * T, b.a - len * 0.6, b.a); c.stroke(); c.restore(); }
    if (glowK > 0.03) { const r = s * 2.3; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * glowK * 0.75; blitSized(c, glowSprite(gc), q[0] - r, q[1] - r, r * 2, r * 2); c.restore(); }
    path(cres ? CRES : KITE); c.closePath(); c.fillStyle = STEEL_SH; c.fill();
    path(cres ? CRES_LIT : KITE_LIT); c.closePath(); c.fillStyle = STEEL; c.fill();
    if (!cres) { c.strokeStyle = 'rgba(30,26,34,.35)'; c.lineWidth = Math.max(1, s * 0.06); path([[1.15, 0], [-0.6, 0]]); c.stroke(); }
    c.strokeStyle = STEEL_HI; c.lineWidth = Math.max(1, s * 0.13); path(cres ? CRES_EDGE : KITE_EDGE); c.stroke();
    if (glowK > 0.03) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * glowK; c.strokeStyle = j % 2 ? '#FFE3A8' : CYAN_HI; c.lineWidth = Math.max(1, s * 0.1); path(cres ? CRES_EDGE : KITE_EDGE); c.stroke(); c.restore(); }
    path(cres ? CRES : KITE); c.closePath(); c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.75); c.stroke();
    c.restore(); }
})());
