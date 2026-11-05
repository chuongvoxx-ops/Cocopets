/* ---------- Dark, reworked: Requiem ----------
   Enormous gothic scythes emerge from dark portals over the target area and reap it with heavy, deliberate sweeps.
   Each scythe is a real cel-shaded 3D model drawn live through GeoKit (one closed volumetric blade with a thick spine,
   a broad body, a gunmetal bevel that catches a travelling highlight in the fast phase, recessed gothic grooves running
   #6D28A8 energy near the root, chips and scratches painted in face space; a forged socket with overlapping plates,
   ribs, rivets and a pointed-arch ornament; a bowed blackened-wood shaft with grain; two leather grips with wrap seams
   under engraved steel bands; a weighted steel end cap). A portal opens, the whole weapon descends out of it as one
   rigid object, tilts forward and hangs poised; three sweeps follow (windup, a fast cut about a pivot in the upper grip
   while the pivot slides along the arc, follow-through, a tiny settle), each cut hitting every monster the blade's
   swept volume passes once; a translucent shadow crescent, a thin violet trail and ash follow the real path and fade
   fast so the steel stays the main object. After the last cut the scythe slows, turns upright and withdraws intact into
   its portal, which closes. 1 scythe, 3 at Adept from staggered positions, 5 at Celestial in a loose turning ring with
   the engravings lighting in sequence and interlacing afterimages. Damage ≈ the old Curtain of the Last Night's budget
   (14 x base x K x evoK) split 28 / 30 / 42 % over the three sweeps and shared among the scythes. */
(() => {
  const U = ELEM_IMPL.dark.ult; delete U.lastnight;
  const TAU = Math.PI * 2, SE = Math.sin(0.62), CE = Math.cos(0.62);
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  let H;

  /* ================= the model (scythe-local units: tiles; z up the shaft, the blade toward +x at the top) =================
     Every face carries texture coordinates (u along the part, w across it), so a baked skin (grooves, scratches, rivets,
     grain) can be laid over it with one clip-free pattern fill; GeoKit's own per-face tile and painter layers are not used
     (five scythes a frame could not afford a clip a face) */
  const G = () => GeoKit;
  // a mesh with the winding I give it (GeoKit's own flips faces toward a centroid, which a hooked blade has none of)
  function mk(v, f, tag, tc) { const E = new Map(); f.forEach((F, fi) => F.forEach((a, k) => { const b = F[(k + 1) % F.length], lo = Math.min(a, b), hi = Math.max(a, b), key = lo * 4096 + hi, e = E.get(key); if (e) e[3] = fi; else E.set(key, [lo, hi, fi, -1]); })); return { v, f, e: [...E.values()], mat: f.map(() => 0), tag: tag || f.map(() => ''), tc: tc || f.map(() => null) }; }
  // a face wound so its normal agrees with ref; its texture coordinates follow the same order
  function wind(v, F, ref, tc) { const g = G(), n = g.cross(g.sub(v[F[1]], v[F[0]]), g.sub(v[F[2]], v[F[0]])); return g.dot(n, ref) < 0 ? [F.slice().reverse(), tc && tc.slice().reverse()] : [F, tc]; }
  const SL_TOP = 1.2, SL_BOT = -1.55;   // the shaft above and below the pivot (the pivot sits in the upper grip)
  const bow = z => 0.07 * (1 - Math.pow((z - (SL_TOP + SL_BOT) / 2) / ((SL_TOP - SL_BOT) / 2), 2));   // the snath's bow, toward the blade
  // an n-sided lathe along the bowed shaft axis: rings [[r, z], ...]; u runs along the axis, w round it
  function lathe(rings, tag, n) { n = n || 6; const v = [], f = [], tg = [], tc = []; rings.forEach(([r, z]) => { for (let i = 0; i < n; i++) { const a = i / n * TAU + Math.PI / n; v.push([bow(z) + Math.cos(a) * r, Math.sin(a) * r, z]); } });
    const m = rings.length, push = (F, ref, t, T2) => { const [F2, T3] = wind(v, F, ref, T2); f.push(F2); tg.push(t); tc.push(T3); };
    for (let k = 0; k < m - 1; k++) for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = (i + 0.5) / n * TAU + Math.PI / n, u0 = k / (m - 1), u1 = (k + 1) / (m - 1); push([k * n + i, (k + 1) * n + i, (k + 1) * n + j, k * n + j], [Math.cos(a), Math.sin(a), 0], tag, [[u0, i / n], [u1, i / n], [u1, (i + 1) / n], [u0, (i + 1) / n]]); }
    push(Array.from({ length: n }, (_, i) => i), [0, 0, -1], 'cap', null); push(Array.from({ length: n }, (_, i) => (m - 1) * n + i), [0, 0, 1], 'cap', null); return mk(v, f, tg, tc); }
  // a box about (cx, cy, cz) with half sizes, tapering toward its top by k; u across each side, w down it
  function box(cx, cy, cz, hx, hy, hz, k, tag) { k = k == null ? 1 : k; const v = []; for (const z of [-1, 1]) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) v.push([cx + sx * hx * (z > 0 ? k : 1), cy + sy * hy * (z > 0 ? k : 1), cz + z * hz]);
    const f = [], tg = [], tc = [], side = [[0, 1], [1, 0]], push = (F, ref, t, T2) => { const [F2, T3] = wind(v, F, ref, T2); f.push(F2); tg.push(t); tc.push(T3); };
    push([0, 1, 2, 3], [0, 0, -1], 'cap', null); push([4, 5, 6, 7], [0, 0, 1], 'top', null);
    [[[0, 1, 5, 4], [0, -1, 0], 'F'], [[1, 2, 6, 5], [1, 0, 0], 'S'], [[2, 3, 7, 6], [0, 1, 0], 'F'], [[3, 0, 4, 7], [-1, 0, 0], 'S']].forEach(([F, ref, s]) => push(F, ref, tag + s, [[0, 1], [1, 1], [1, 0], [0, 0]]));
    void side; return mk(v, f, tg, tc); }
  /* the blade: a quadratic curve out of the socket that hooks back down; cross-sections of five points (spine front and
     back, bevel line front and back, the edge) joined into one closed mesh: front body, front bevel, back body, back
     bevel, the spine's flat top, two end caps. The edge is on the concave (inner) side. u runs root -> tip, w spine -> edge */
  const NB = 7, BZ = [[0.06, 1.17], [1.06, 1.5], [1.6, 0.68]], WB = 0.58;
  const bz = u => { const a = 1 - u; return [a * a * BZ[0][0] + 2 * a * u * BZ[1][0] + u * u * BZ[2][0], a * a * BZ[0][1] + 2 * a * u * BZ[1][1] + u * u * BZ[2][1]]; };
  const bzT = u => { const a = 1 - u; const d = [2 * a * (BZ[1][0] - BZ[0][0]) + 2 * u * (BZ[2][0] - BZ[1][0]), 2 * a * (BZ[1][1] - BZ[0][1]) + 2 * u * (BZ[2][1] - BZ[1][1])], l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l]; };
  const bW = u => 0.045 + 0.5 * Math.pow(1 - u, 0.62) * (0.5 + 0.5 * Math.min(1, u * 3.5));   // width spine -> edge
  const bTh = u => 0.1 * (1 - 0.75 * u);   // the spine's thickness
  function bladeMesh() {
    const v = [], sec = [];
    for (let k = 0; k < NB; k++) { const u = k / (NB - 1), P = bz(u), T2 = bzT(u), ed = [T2[1], -T2[0]], w = bW(u), th = bTh(u); const S = [P[0], P[1]], B = [P[0] + ed[0] * w * WB, P[1] + ed[1] * w * WB], E = [P[0] + ed[0] * w, P[1] + ed[1] * w];
      sec.push({ u, ed, tg: T2 }); v.push([S[0], th / 2, S[1]], [S[0], -th / 2, S[1]], [B[0], th * 0.2, B[1]], [B[0], -th * 0.2, B[1]], [E[0], 0, E[1]]); }
    const f = [], tg = [], tc = [], Y = [0, 1, 0], NY = [0, -1, 0], TC = i => [Math.floor(i / 5) / (NB - 1), [0, 0, WB, WB, 1][i % 5]], push = (F, ref, t) => { const [F2, T3] = wind(v, F, ref, F.map(TC)); f.push(F2); tg.push(t); tc.push(T3); };
    for (let k = 0; k < NB - 1; k++) { const b = k * 5, n = b + 5, ed = sec[k].ed, up = [-ed[0], 0, -ed[1]];
      push([b, n, n + 2, b + 2], Y, 'bodyF'); push([b + 2, n + 2, n + 4, b + 4], [ed[0] * 0.6, 1, ed[1] * 0.6], 'bevF');
      push([b + 1, n + 1, n + 3, b + 3], NY, 'bodyB'); push([b + 3, n + 3, n + 4, b + 4], [ed[0] * 0.6, -1, ed[1] * 0.6], 'bevB');
      push([b, n, n + 1, b + 1], up, 'spine'); }
    push([0, 1, 3, 4, 2], [-sec[0].tg[0], 0, -sec[0].tg[1]], 'cap'); const L = (NB - 1) * 5; push([L, L + 1, L + 3, L + 4, L + 2], [sec[NB - 1].tg[0], 0, sec[NB - 1].tg[1]], 'cap');
    const M = mk(v, f, tg, tc); M.mat = tg.map(t => t === 'bevF' || t === 'bevB' ? 1 : t === 'spine' ? 2 : 0); return M;
  }
  /* materials: three cel tones, a glint on the polished parts (the brushed detail lives in the baked skins) */
  const mat = (c, o) => Object.assign({ c }, o || {});
  const MAT = {
    steel: mat(['#120E1C', '#271F36', '#443A5A'], { gloss: 0.6, glint: '#C4B2E6', glintA: 0.25 }),
    bevel: mat(['#3E3E4A', '#80848F', '#D2D6E0'], { gloss: 1, glint: '#FFFFFF', glintA: 0.12 }),
    spine: mat(['#15111C', '#2E2738', '#4A425C'], { gloss: 0.45, glint: '#B8A8D8', glintA: 0.3 }),
    socket: mat(['#141019', '#2A2334', '#463C56'], { gloss: 0.45, glint: '#B0A0D0', glintA: 0.9 }),
    wood: mat(['#0E0906', '#201611', '#34271C']),
    leather: mat(['#100C0A', '#251D18', '#382D25']),
    band: mat(['#2C2C36', '#5E606E', '#A0A4B4'], { gloss: 0.9, glint: '#FFFFFF', glintA: 0.9 }),
  };
  let MODEL = null;
  function model() {
    if (MODEL) return MODEL;
    const parts = [];
    const add = (M, mats, kind, o) => parts.push(Object.assign({ M, mats, kind }, o || {}));
    add(bladeMesh(), [MAT.steel, MAT.bevel, MAT.spine], 'blade', { lw: 0.032, inner: false });
    // the shaft and its fittings: lathes, drawn as solids up close; at the game's scale they are the baked strip below
    // (a lathe projects to a constant-width band along its axis under this camera, so the strip is exact in silhouette)
    add(lathe([[0.054, SL_BOT + 0.1], [0.062, -0.1], [0.07, SL_TOP - 0.1]], 'shaft'), [MAT.wood], 'shaft', { lw: 0.03, inner: false });
    // two leather grips (the pivot lies in the upper one), each under two engraved steel bands
    for (const [z0, z1] of [[-1.15, -0.7], [-0.28, 0.2]]) { add(lathe([[0.082, z0 + 0.04], [0.082, z1 - 0.04]], 'grip'), [MAT.leather], 'grip', { lw: 0.03, inner: false }); for (const z of [z0, z1]) add(lathe([[0.09, z - 0.03], [0.09, z + 0.03]], 'band', 5), [MAT.band], 'band', { lw: 0.025, inner: false }); }
    // the collar under the socket and the weighted end cap
    add(lathe([[0.08, 0.86], [0.088, 0.93], [0.08, 1.0]], 'band', 5), [MAT.band], 'band', { lw: 0.025, inner: false });
    add(lathe([[0.05, SL_BOT - 0.22], [0.092, SL_BOT - 0.1], [0.072, SL_BOT + 0.1]], 'band', 5), [MAT.band], 'cap', { lw: 0.028, inner: false });
    // the forged socket: a tapered steel block with two overlapping plates each side
    add(box(0.0, 0, 1.17, 0.125, 0.095, 0.2, 0.8, 'sock'), [MAT.socket], 'socket', { lw: 0.03, lwI: 0.014, inkIA: 0.5 });
    for (const s of [-1, 1]) { add(box(0.02, s * 0.1, 1.09, 0.085, 0.016, 0.09, 0.9, 'plate'), [MAT.socket], 'plate', { lw: 0.025, lwI: 0.012, inkIA: 0.45 }); add(box(-0.035, s * 0.108, 1.24, 0.065, 0.014, 0.07, 0.85, 'plate'), [MAT.socket], 'plate', { lw: 0.025, lwI: 0.012, inkIA: 0.45, fine: true }); }
    MODEL = { parts }; return MODEL;
  }

  /* ================= the skins: painted once, laid over faces by their texture coordinates ================= */
  // a recessed groove in skin pixels: dark cut, a light lip, and (into the energy layers) the light that runs inside it
  function grooveP(g, ge, gg, pts, w) { const path = (cc, dx, dy) => { cc.beginPath(); pts.forEach((p, i) => i ? cc.lineTo(p[0] + dx, p[1] + dy) : cc.moveTo(p[0] + dx, p[1] + dy)); }; g.lineCap = 'round'; g.lineJoin = 'round';
    path(g, 1.5, 1.5); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = w; g.stroke(); path(g, 0, 0); g.strokeStyle = 'rgba(0,0,0,.78)'; g.lineWidth = w; g.stroke();
    ge.lineCap = 'round'; ge.lineJoin = 'round'; path(ge, 0, 0); ge.strokeStyle = ENERGY; ge.lineWidth = w * 0.6; ge.stroke(); ge.strokeStyle = ACC; ge.lineWidth = Math.max(1, w * 0.22); ge.stroke();
    gg.lineCap = 'round'; gg.lineJoin = 'round'; path(gg, 0, 0); gg.strokeStyle = rgba(EDGE, 0.5); gg.lineWidth = w * 4; gg.stroke(); }
  const SKW = 768, SKH = 112;   // the blade skin: u along (root at the left), w down (spine at the top, edge at the bottom)
  let SKIN = null;
  function skins() {
    if (SKIN) return SKIN;
    const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
    const bl = mkc(SKW, SKH), en = mkc(SKW, SKH), gl = mkc(SKW, SKH), g = bl.getContext('2d'), ge = en.getContext('2d'), gg = gl.getContext('2d'), R = mulberry32(41);
    const U = u => u * SKW, Wt = w => w * SKH;
    // brushed grain along the blade, fine scratches, a few deeper gouges with bright lips
    for (let i = 0; i < 260; i++) { const y = R() * SKH, x = R() * SKW, L = 40 + R() * 220; g.strokeStyle = R() < 0.5 ? `rgba(255,255,255,${0.03 + R() * 0.06})` : `rgba(0,0,0,${0.08 + R() * 0.14})`; g.lineWidth = 0.6 + R() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (R() - 0.5) * 4); g.stroke(); }
    for (let i = 0; i < 18; i++) { const x = R() * SKW, y = R() * SKH, a = (R() - 0.5) * 0.9, L = 20 + R() * 90; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); g.strokeStyle = `rgba(220,214,240,${0.25 + R() * 0.3})`; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x + 1, y + 1); g.lineTo(x + Math.cos(a) * L + 1, y + Math.sin(a) * L + 1); g.stroke(); }
    for (let i = 0; i < 10; i++) { const x = R() * SKW, y = R() * SKH, r = 20 + R() * 50, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, R() < 0.5 ? 'rgba(170,120,255,.09)' : 'rgba(0,0,0,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // the ridge where the bevel starts: a light line with a shadow under it; the bevel brushed across, its edge bright
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, Wt(WB) + 1.5); g.lineTo(SKW, Wt(WB) + 1.5); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, Wt(WB)); g.lineTo(SKW, Wt(WB)); g.stroke();
    for (let i = 0; i < 160; i++) { const x = R() * SKW, y = Wt(WB) + R() * (SKH - Wt(WB)), L = 30 + R() * 120; g.strokeStyle = R() < 0.5 ? `rgba(255,255,255,${0.05 + R() * 0.09})` : `rgba(0,0,0,${0.06 + R() * 0.1})`; g.lineWidth = 0.6 + R(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (R() - 0.5) * 2); g.stroke(); }
    const eg = g.createLinearGradient(0, Wt(0.86), 0, SKH); eg.addColorStop(0, 'rgba(255,255,255,0)'); eg.addColorStop(1, 'rgba(255,255,255,.45)'); g.fillStyle = eg; g.fillRect(0, Wt(0.86), SKW, SKH - Wt(0.86));
    // the engravings near the root: two long grooves meeting in a lancet point, two cross-ribs, three lozenges, a bar of small cuts
    const lan = (w0, dir) => { const pts = []; for (let i = 0; i <= 10; i++) { const s = i / 10, u = 0.05 + 0.42 * s, w = s < 0.72 ? w0 : w0 + dir * (s - 0.72) / 0.28 * (Math.abs(w0 - 0.4)); pts.push([U(u), Wt(w)]); } return pts; };
    grooveP(g, ge, gg, lan(0.31, 1), 3.6); grooveP(g, ge, gg, lan(0.49, -1), 3.6);
    grooveP(g, ge, gg, [[U(0.1), Wt(0.2)], [U(0.1), Wt(0.56)]], 2.6); grooveP(g, ge, gg, [[U(0.19), Wt(0.22)], [U(0.19), Wt(0.54)]], 2.6);
    for (let i = 0; i < 3; i++) { const u = 0.27 + i * 0.065; grooveP(g, ge, gg, [[U(u - 0.02), Wt(0.4)], [U(u), Wt(0.33)], [U(u + 0.02), Wt(0.4)], [U(u), Wt(0.47)], [U(u - 0.02), Wt(0.4)]], 2.2); }
    for (let i = 0; i < 5; i++) { const u = 0.55 + i * 0.03; grooveP(g, ge, gg, [[U(u), Wt(0.3)], [U(u + 0.012), Wt(0.5)]], 1.8); }
    // two chips out of the edge
    for (const [u, s] of [[0.3, 1], [0.66, 0.7]]) { g.fillStyle = 'rgba(10,6,16,.95)'; g.beginPath(); g.moveTo(U(u - 0.012 * s), SKH + 1); g.lineTo(U(u + 0.004 * s), Wt(1 - 0.22 * s)); g.lineTo(U(u + 0.018 * s), SKH + 1); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(U(u - 0.012 * s), SKH); g.lineTo(U(u + 0.004 * s), Wt(1 - 0.22 * s)); g.stroke(); }
    // the socket's face: four rivets, two raised ribs, a pointed arch, a bolt below it; the plate: two rivets and a rib
    const SW = 160, SH = 220, so = mkc(SW, SH), soe = mkc(SW, SH), sog = mkc(SW, SH), s = so.getContext('2d'), se = soe.getContext('2d'), sg = sog.getContext('2d');
    const rivet = (cc, x, y, r) => { cc.fillStyle = 'rgba(0,0,0,.55)'; cc.beginPath(); cc.arc(x + r * 0.3, y + r * 0.3, r * 1.15, 0, TAU); cc.fill(); cc.fillStyle = '#4C475A'; cc.beginPath(); cc.arc(x, y, r, 0, TAU); cc.fill(); cc.strokeStyle = 'rgba(255,255,255,.6)'; cc.lineWidth = r * 0.45; cc.beginPath(); cc.arc(x - r * 0.15, y - r * 0.15, r * 0.55, Math.PI * 0.9, Math.PI * 1.7); cc.stroke(); cc.fillStyle = 'rgba(0,0,0,.35)'; cc.beginPath(); cc.arc(x + r * 0.3, y + r * 0.3, r * 0.3, 0, TAU); cc.fill(); };
    const rib = (cc, x, y0, y1, w) => { cc.fillStyle = 'rgba(255,255,255,.22)'; cc.fillRect(x - w, y0, w, y1 - y0); cc.fillStyle = 'rgba(0,0,0,.55)'; cc.fillRect(x, y0, w, y1 - y0); };
    for (let i = 0; i < 700; i++) { s.fillStyle = R() < 0.5 ? `rgba(0,0,0,${0.08 + R() * 0.15})` : `rgba(255,255,255,${0.04 + R() * 0.07})`; s.fillRect(R() * SW, R() * SH, 1 + R() * 2, 1 + R() * 1.5); }
    rib(s, SW * 0.3, SH * 0.06, SH * 0.94, 4); rib(s, SW * 0.72, SH * 0.06, SH * 0.94, 4);
    [[0.14, 0.12], [0.86, 0.12], [0.14, 0.88], [0.86, 0.88]].forEach(([u, w]) => rivet(s, SW * u, SH * w, 7));
    { const pts = []; for (let i = 0; i <= 12; i++) { const q = i / 12, a = Math.PI + q * Math.PI; pts.push([SW * 0.5 + Math.cos(a) * SW * 0.17, SH * 0.5 + Math.sin(a) * SH * 0.15 - (i === 6 ? SH * 0.1 : 0)]); } pts.push([SW * 0.5 + SW * 0.17, SH * 0.72], [SW * 0.5 - SW * 0.17, SH * 0.72], pts[0]); grooveP(s, se, sg, pts, 3.4); }
    s.fillStyle = 'rgba(0,0,0,.55)'; s.beginPath(); s.arc(SW * 0.5, SH * 0.84, 6, 0, TAU); s.fill(); s.strokeStyle = 'rgba(255,255,255,.4)'; s.lineWidth = 1.5; s.beginPath(); s.moveTo(SW * 0.5 - 4, SH * 0.84 - 4); s.lineTo(SW * 0.5 + 4, SH * 0.84 + 4); s.moveTo(SW * 0.5 + 4, SH * 0.84 - 4); s.lineTo(SW * 0.5 - 4, SH * 0.84 + 4); s.stroke();
    const PW = 120, PH = 120, pl = mkc(PW, PH), p = pl.getContext('2d'); for (let i = 0; i < 300; i++) { p.fillStyle = R() < 0.5 ? `rgba(0,0,0,${0.08 + R() * 0.15})` : `rgba(255,255,255,${0.04 + R() * 0.07})`; p.fillRect(R() * PW, R() * PH, 1 + R() * 2, 1 + R() * 1.5); } rib(p, PW * 0.5, PH * 0.1, PH * 0.9, 4); rivet(p, PW * 0.2, PH * 0.5, 8); rivet(p, PW * 0.8, PH * 0.5, 8);
    // wood and leather tiles (u along the part across the tile's x, w round it down the tile)
    const WT = 128, wd = mkc(WT, WT), w2 = wd.getContext('2d'); for (let i = 0; i < 90; i++) { const y = R() * WT, bowy = (R() - 0.5) * 6; w2.strokeStyle = R() < 0.55 ? `rgba(0,0,0,${0.15 + R() * 0.3})` : `rgba(170,125,80,${0.1 + R() * 0.18})`; w2.lineWidth = 0.6 + R() * 1.4; w2.beginPath(); w2.moveTo(-4, y); w2.quadraticCurveTo(WT / 2, y + bowy, WT + 4, y); w2.stroke(); }
    for (let i = 0; i < 4; i++) { const x = R() * WT, y = R() * WT; w2.fillStyle = 'rgba(0,0,0,.45)'; w2.beginPath(); w2.ellipse(x, y, 5, 2.5, 0, 0, TAU); w2.fill(); } for (let i = 0; i < 5; i++) { const x = R() * WT, y = R() * WT, L = 10 + R() * 30; w2.strokeStyle = 'rgba(0,0,0,.5)'; w2.lineWidth = 1.2; w2.beginPath(); w2.moveTo(x, y); w2.lineTo(x + L, y + (R() - 0.5) * 8); w2.stroke(); }
    const le = mkc(WT, WT), l2 = le.getContext('2d'); for (let i = 0; i < 500; i++) { l2.fillStyle = R() < 0.5 ? `rgba(0,0,0,${0.1 + R() * 0.2})` : `rgba(210,180,150,${0.04 + R() * 0.07})`; l2.fillRect(R() * WT, R() * WT, 1 + R(), 1 + R()); }
    for (let k = -1; k <= 4; k++) { const x0 = k * WT / 4; l2.strokeStyle = 'rgba(0,0,0,.65)'; l2.lineWidth = 4; l2.beginPath(); l2.moveTo(x0, 0); l2.lineTo(x0 + WT * 0.35, WT); l2.stroke(); l2.strokeStyle = 'rgba(205,175,145,.2)'; l2.lineWidth = 2.5; l2.beginPath(); l2.moveTo(x0 + 5, 0); l2.lineTo(x0 + 5 + WT * 0.35, WT); l2.stroke(); }
    const pat = (cv, rep) => { const p2 = g.createPattern(cv, rep || 'no-repeat'); return p2; };
    SKIN = { bl: pat(bl), en: pat(en), gl: pat(gl), so: pat(so), soe: pat(soe), sog: pat(sog), pl: pat(pl), wd: pat(wd, 'repeat'), le: pat(le, 'repeat'), sz: { bl: [SKW, SKH], so: [SW, SH], pl: [PW, PH], wd: [WT, WT], le: [WT, WT] } };
    return SKIN;
  }
  /* lay a skin over a visible face: an affine from texture space to the screen fitted on the face's first three
     corners, the pattern turned by it, the face's own outline filled (no clip). Returns the affine for more layers */
  function lay(c, S, F, tc, pat, sz, alpha, comp) {
    const [u0, w0] = tc[0], [u1, w1] = tc[1], [u2, w2] = tc[2], P0 = S[F[0]], P1 = S[F[1]], P2 = S[F[2]], du1 = u1 - u0, dw1 = w1 - w0, du2 = u2 - u0, dw2 = w2 - w0, det = du1 * dw2 - du2 * dw1; if (Math.abs(det) < 1e-9) return null;
    const dx1 = P1[0] - P0[0], dy1 = P1[1] - P0[1], dx2 = P2[0] - P0[0], dy2 = P2[1] - P0[1];
    const a = (dx1 * dw2 - dx2 * dw1) / det, b = (dy1 * dw2 - dy2 * dw1) / det, cc = (dx2 * du1 - dx1 * du2) / det, d = (dy2 * du1 - dy1 * du2) / det, e = P0[0] - a * u0 - cc * w0, f = P0[1] - b * u0 - d * w0;
    if (pat) { pat.setTransform(new DOMMatrix([a / sz[0], b / sz[0], cc / sz[1], d / sz[1], e, f])); c.save(); if (comp) c.globalCompositeOperation = comp; c.globalAlpha = alpha; c.fillStyle = pat; c.beginPath(); c.moveTo(P0[0], P0[1]); for (let k = 1; k < F.length; k++) c.lineTo(S[F[k]][0], S[F[k]][1]); c.closePath(); c.fill(); c.restore(); }
    return [a, b, cc, d, e, f];
  }
  const bbox = (S, F) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const k of F) { const p = S[k]; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x1 - x0, y1 - y0]; };

  /* the shaft strip: butt at the left, socket end at the right; wood with grain, two leather grips with wrap seams under
     engraved bands, the collar, the weighted cap; lit in three cel bands across (the light from the upper left) with ink */
  const SPX = 200, Z0 = SL_BOT - 0.22, Z1 = 1.12, SRW = 0.2;
  let STRIP = null;
  function strip() {
    if (STRIP) return STRIP;
    const W = Math.ceil((Z1 - Z0) * SPX), Hh = Math.ceil(SRW * SPX), cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d'), R = mulberry32(77), cy = Hh / 2, X = z => (z - Z0) * SPX;
    g.lineJoin = 'round'; g.lineCap = 'round';
    // a piece of the lathe: a profile of [z, r] pairs, filled in three bands with a soft edge, inked
    const piece = (prof, m, o) => { const top = [], bot = []; for (const [z, r] of prof) { top.push([X(z), cy - r * SPX]); bot.push([X(z), cy + r * SPX]); } const outline = () => { g.beginPath(); top.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); bot.slice().reverse().forEach(p => g.lineTo(p[0], p[1])); g.closePath(); };
      outline(); g.fillStyle = m.c[1]; g.fill(); g.save(); outline(); g.clip(); const rm = Math.max(...prof.map(q => q[1])) * SPX; g.fillStyle = m.c[2]; g.fillRect(0, cy - rm, W, rm * 0.62); g.fillStyle = m.c[0]; g.fillRect(0, cy + rm * 0.3, W, rm); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, cy - rm * 0.78, W, rm * 0.3); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, cy + rm * 0.72, W, rm); if (o && o.paint) o.paint(rm); g.restore(); outline(); g.strokeStyle = SHADE.ink; g.lineWidth = 2.2; g.stroke(); };
    // the shaft: a slight taper, grain, a knot, scratches
    piece([[SL_BOT + 0.05, 0.054], [-0.1, 0.062], [Z1, 0.07]], MAT.wood, { paint: rm => { for (let i = 0; i < 70; i++) { const y = cy + (R() - 0.5) * rm * 1.9, x = R() * W, L = 60 + R() * 300; g.strokeStyle = R() < 0.55 ? `rgba(0,0,0,${0.18 + R() * 0.3})` : `rgba(170,125,80,${0.1 + R() * 0.16})`; g.lineWidth = 0.8 + R() * 1.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L / 2, y + (R() - 0.5) * 5, x + L, y + (R() - 0.5) * 3); g.stroke(); }
      for (let i = 0; i < 6; i++) { const x = R() * W, y = cy + (R() - 0.5) * rm; g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(x, y, 5, 2.4, 0, 0, TAU); g.fill(); } for (let i = 0; i < 9; i++) { const x = R() * W, y = cy + (R() - 0.5) * rm * 1.4, L = 10 + R() * 40; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (R() - 0.5) * 10); g.stroke(); g.strokeStyle = 'rgba(200,170,130,.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 1, y + 1.5); g.lineTo(x + L + 1, y + (R() - 0.5) * 10 + 1.5); g.stroke(); } } });
    // the grips: leather with overlapping diagonal wrap seams and worn ends; a band at each end
    const band = (z0, z1, r) => piece([[z0, r * 0.92], [z0 + 0.012, r], [z1 - 0.012, r], [z1, r * 0.92]], MAT.band, { paint: rm => { for (const u of [0.3, 0.7]) { const x = X(z0 + (z1 - z0) * u); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, cy - rm); g.lineTo(x, cy + rm); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 1.6, cy - rm); g.lineTo(x + 1.6, cy + rm); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(X(z0) + 2, cy - rm * 0.62, X(z1) - X(z0) - 4, 2.2); } });
    for (const [z0, z1] of [[-1.15, -0.7], [-0.28, 0.2]]) { piece([[z0 + 0.03, 0.082], [z1 - 0.03, 0.082]], MAT.leather, { paint: rm => { const x0 = X(z0), x1 = X(z1), n = Math.round((z1 - z0) / 0.055); for (let k = -1; k <= n; k++) { const x = x0 + k * (x1 - x0) / n; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, cy - rm); g.lineTo(x + rm * 0.9, cy + rm); g.stroke(); g.strokeStyle = 'rgba(205,175,145,.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 3.5, cy - rm); g.lineTo(x + 3.5 + rm * 0.9, cy + rm); g.stroke(); } for (let i = 0; i < 160; i++) { g.fillStyle = R() < 0.5 ? `rgba(0,0,0,${0.1 + R() * 0.25})` : `rgba(210,180,150,${0.05 + R() * 0.08})`; g.fillRect(x0 + R() * (x1 - x0), cy + (R() - 0.5) * rm * 1.9, 1 + R() * 2, 1 + R()); } g.fillStyle = 'rgba(200,170,140,.14)'; g.fillRect(x0, cy - rm, 9, rm * 2); g.fillRect(x1 - 9, cy - rm, 9, rm * 2); } }); band(z0 - 0.03, z0 + 0.03, 0.09); band(z1 - 0.03, z1 + 0.03, 0.09); }
    // the collar under the socket and the weighted end cap (a swell of steel with a domed butt)
    band(0.86, 1.0, 0.088);
    piece([[Z0, 0.05], [SL_BOT - 0.12, 0.092], [SL_BOT + 0.02, 0.09], [SL_BOT + 0.1, 0.072]], MAT.band, { paint: rm => { for (const z of [SL_BOT - 0.15, SL_BOT + 0.04]) { const x = X(z); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, cy - rm); g.lineTo(x, cy + rm); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(X(Z0) + 6, cy - rm * 0.62, X(SL_BOT + 0.08) - X(Z0) - 10, 2.4); } });
    STRIP = { cv, W, Hh }; return STRIP;
  }
  // lay the strip along the projected shaft: three chunks following the bow, each a parallelogram between its axis points
  function drawStrip(c, cm, R, t, alpha) {
    const g = G(), S = strip(), w = SRW * cm.T, zs = [Z0, SL_BOT + 0.9, 0.3, Z1], P = zs.map(z => cm.P(g.add(t, g.mv(R, [bow(Math.max(SL_BOT, Math.min(SL_TOP, z))), 0, z]))));
    c.save(); c.globalAlpha = alpha;
    for (let i = 0; i < 3; i++) { const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), sx = (zs[i] - Z0) * SPX, sw = (zs[i + 1] - zs[i]) * SPX; if (L < 0.5) continue; c.save(); c.translate(a[0], a[1]); c.rotate(Math.atan2(b[1] - a[1], b[0] - a[0])); c.drawImage(S.cv, sx, 0, sw, S.Hh, -0.5, -w / 2, L + 1, w); c.restore(); }
    c.restore();
  }

  /* ================= drawing a scythe ================= */
  const SHADE = { ink: '#06040A' };
  /* paint the whole weapon at camera cm, placed by rotation R and translation t (anchor space, tiles), with
     P = { charge, hl, hlPos, glow, alpha, light, rim } */
  function paintScythe(c, cm, R, t, P) {
    const g = G(), MD = model(), SK = skins(), T = cm.T, alpha = P.alpha == null ? 1 : P.alpha, items = [], detail = T > 60;
    const LATHE = { shaft: 1, grip: 1, band: 1, cap: 1 };
    for (const p of MD.parts) {
      if (!detail && LATHE[p.kind]) { if (p.kind === 'shaft') items.push({ dep: cm.dep(g.add(t, g.mv(R, [0, 0, -0.2]))), strip: true }); continue; }
      const Wv = p.M.v.map(v => g.add(t, g.mv(R, v))); let dep = 0; for (const w of Wv) dep += cm.dep(w); dep /= Wv.length;
      if (p.kind === 'blade') dep += 0.02; if (p.kind === 'plate') dep -= 0.01;
      items.push({ dep, p });
    }
    items.sort((a, b) => a.dep - b.dep);
    let rim = null;
    for (const it of items) {
      if (it.strip) { drawStrip(c, cm, R, t, alpha); continue; }
      const p = it.p, M = p.M, kind = p.kind;
      if (p.fine && !detail) continue;
      let mats = p.mats; if (P.noGloss || (!detail && kind !== 'blade')) mats = p.matsFlat || (p.matsFlat = mats.map(m => { const q = Object.assign({}, m); delete q.gloss; return q; }));
      const r = g.solid(c, cm, M, { R, t }, { mats, force: true, ink: SHADE.ink, lw: p.lw, lwI: p.lwI || 0.012, inkIA: p.inkIA == null ? 0.6 : p.inkIA, inner: p.inner, alpha, light: P.light });
      if (P.noSkin) continue;
      const S = r.S, vis = r.vis, nf = M.f.length;
      if (kind === 'blade') { rim = { r, M };
        for (let i = 0; i < nf; i++) { if (!vis[i]) continue; const tg = M.tag[i]; if (tg === 'spine' || tg === 'cap') continue; const F = M.f[i], tc = M.tc[i], bb = bbox(S, F); if (Math.min(bb[0], bb[1]) < 2.5) continue;
          const A = lay(c, S, F, tc, SK.bl, SK.sz.bl, alpha * 0.9); if (!A) continue;
          if ((tg === 'bodyF' || tg === 'bodyB') && P.charge > 0.02 && tc[0][0] < 0.62) { lay(c, S, F, tc, SK.en, SK.sz.bl, alpha * P.charge, 'lighter'); if (P.glow) lay(c, S, F, tc, SK.gl, SK.sz.bl, alpha * P.charge * 0.6, 'lighter'); }
          // the highlight that runs down the bevel in the fast phase: a bright band across the bevel face at hlPos
          if ((tg === 'bevF' || tg === 'bevB') && P.hl > 0.02) { let ua = 1e9, ub = -1e9; for (const q of tc) { if (q[0] < ua) ua = q[0]; if (q[0] > ub) ub = q[0]; } const d = Math.abs((ua + ub) / 2 - P.hlPos); if (d < 0.2) { const k = (1 - d / 0.2) * P.hl, [a, b, cc, dd, e, f] = A, Q = (u, w) => [a * u + cc * w + e, b * u + dd * w + f]; c.save(); c.globalCompositeOperation = 'lighter'; for (const [hw, al] of [[0.11, 0.2], [0.04, 0.6]]) { const s0 = Math.max(ua, P.hlPos - hw), s1 = Math.min(ub, P.hlPos + hw); if (s1 <= s0) continue; const q0 = Q(s0, WB), q1 = Q(s1, WB), q2 = Q(s1, 1), q3 = Q(s0, 1); c.globalAlpha = alpha * al * k; c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.lineTo(q2[0], q2[1]); c.lineTo(q3[0], q3[1]); c.closePath(); c.fill(); } c.restore(); } } }
        // the silhouette ink again over the skins (they covered its inner half)
        c.save(); c.globalAlpha = alpha; c.strokeStyle = SHADE.ink; c.lineWidth = Math.max(1.4, T * (p.lw || 0.07)); c.lineCap = 'round'; c.beginPath(); for (const [a, b, f1, f2] of M.e) { const v1 = f1 >= 0 && vis[f1], v2 = f2 >= 0 && vis[f2]; if (v1 === v2) continue; c.moveTo(S[a][0], S[a][1]); c.lineTo(S[b][0], S[b][1]); } c.stroke(); c.restore();
      } else if (kind === 'socket' || kind === 'plate') {
        for (let i = 0; i < nf; i++) { if (!vis[i]) continue; const tg = M.tag[i]; if (tg === 'cap' || tg === 'top') continue; const F = M.f[i], bb = bbox(S, F); if (Math.min(bb[0], bb[1]) < 4) continue; const tc = M.tc[i];
          if (kind === 'plate') lay(c, S, F, tc, SK.pl, SK.sz.pl, alpha * 0.9); else { lay(c, S, F, tc, SK.so, SK.sz.so, alpha * 0.9); if (tg === 'sockF' && P.charge > 0.02) { lay(c, S, F, tc, SK.soe, SK.sz.so, alpha * P.charge, 'lighter'); if (P.glow) lay(c, S, F, tc, SK.sog, SK.sz.so, alpha * P.charge * 0.6, 'lighter'); } } }
      } else if (detail && (kind === 'shaft' || kind === 'grip')) {   // grain and wrap seams only when the weapon is big enough on the screen for them to read
        for (let i = 0; i < nf; i++) { if (!vis[i] || M.tag[i] === 'cap') continue; const F = M.f[i], bb = bbox(S, F); if (Math.min(bb[0], bb[1]) < 5) continue; const tc = M.tc[i].map(q => kind === 'shaft' ? [q[0] * 6, q[1]] : [q[0] * 1.2, q[1]]); lay(c, S, F, tc, kind === 'shaft' ? SK.wd : SK.le, SK.sz.wd, alpha * 0.85); }
      }
    }
    // a thin violet rim light along the blade's silhouette, so the dark steel reads on a dark floor
    if (rim && P.rim !== false) { const { r, M } = rim; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * 0.7; c.strokeStyle = rgba(EDGE, 0.6); c.lineWidth = Math.max(1, T * 0.016); c.lineCap = 'round'; c.beginPath(); for (const [a, b, f1, f2] of M.e) { const v1 = f1 >= 0 && r.vis[f1], v2 = f2 >= 0 && r.vis[f2]; if (v1 === v2) continue; c.moveTo(r.S[a][0], r.S[a][1]); c.lineTo(r.S[b][0], r.S[b][1]); } c.stroke(); c.restore(); }
    const P3 = v => cm.P(g.add(t, g.mv(R, v)));
    return { tip: P3([BZ[2][0], 0, BZ[2][1]]), sock: P3([0, 0, 1.2]), piv: P3([0, 0, 0]), butt: P3([bow(SL_BOT), 0, SL_BOT]) };
  }
  // the pose matrix: yaw about the vertical, the shaft tilted from vertical by tilt (socket end up and out), the blade rolled about the shaft
  const poseR = (yaw, tilt, roll) => { const g = G(); return g.mm(g.rz(yaw), g.mm(g.ry(tilt), g.rz(roll))); };
  // the blade's socket, middle and tip in anchor space for a pose (for the sweep's hits and the trail)
  function bladePts(R, t) { const g = G(), m = bz(0.55); return [g.add(t, g.mv(R, [0.1, 0, 1.2])), g.add(t, g.mv(R, [m[0], 0, m[1]])), g.add(t, g.mv(R, [BZ[2][0], 0, BZ[2][1]]))]; }

  /* ================= the portal: a dark horizontal rift in the air with a violet rim, smoke and ash ================= */
  const portalSpr = () => fxSprite('rqPortal', 256, 256, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, 'rgba(8,5,15,1)'); gr.addColorStop(0.55, 'rgba(24,11,46,1)'); gr.addColorStop(0.8, 'rgba(43,11,69,0.95)'); gr.addColorStop(0.9, 'rgba(109,40,168,0.7)'); gr.addColorStop(0.96, 'rgba(165,92,255,0.35)'); gr.addColorStop(1, 'rgba(165,92,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const ringSpr = () => fxSprite('rqRing', 256, 256, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, c0 * 0.7, c0, c0, c0); gr.addColorStop(0, 'rgba(165,92,255,0)'); gr.addColorStop(0.55, 'rgba(165,92,255,0.5)'); gr.addColorStop(0.72, 'rgba(208,174,255,0.9)'); gr.addColorStop(0.85, 'rgba(165,92,255,0.35)'); gr.addColorStop(1, 'rgba(165,92,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const floorSpr = () => fxSprite('rqFloor', 128, 128, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, 'rgba(165,92,255,0.5)'); gr.addColorStop(0.5, 'rgba(109,40,168,0.22)'); gr.addColorStop(1, 'rgba(109,40,168,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  function drawPortal(c, X, PY, rx, ry, open, t, k, glow) {
    if (open <= 0.01 || rx < 1) return; c.save(); c.translate(X, PY); c.scale(open, 1); c.globalAlpha = k;
    if (glow) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * 0.35; blitSized(c, glowSprite(ENERGY), -rx * 1.6, -ry * 2.6, rx * 3.2, ry * 5.2); c.restore(); }
    c.drawImage(portalSpr(), -rx, -ry, rx * 2, ry * 2);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * (glow ? 0.9 : 0.5); c.drawImage(ringSpr(), -rx * 1.04, -ry * 1.04, rx * 2.08, ry * 2.08);
    // two broken arcs of brighter light turning round the rim, and a slow inner current
    c.lineCap = 'round'; c.strokeStyle = rgba(ACC, 0.55 * k); c.lineWidth = Math.max(1, rx * 0.03); for (let i = 0; i < 2; i++) { const a0 = t * (1.3 + i * 0.4) * (i ? -1 : 1) + i * 2.2; c.beginPath(); c.ellipse(0, 0, rx * 0.97, ry * 0.97, 0, a0, a0 + 1.2); c.stroke(); }
    c.strokeStyle = rgba(ENERGY, 0.35 * k); c.lineWidth = Math.max(1, rx * 0.05); for (let i = 0; i < 2; i++) { const a0 = -t * (0.8 + i * 0.3) + i * 2.8; c.beginPath(); c.ellipse(0, 0, rx * (0.55 - i * 0.18), ry * (0.55 - i * 0.18), 0, a0, a0 + 2.4); c.stroke(); }
    c.restore();
  }

  /* ================= the move ================= */
  U.requiem = (C, h) => {
    H = h; const g = G(), me = H.me, x = C.tx, y = C.ty, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), N = [1, 1, 2, 3, 3, 4, 5][ev - 1], CEL = ev >= 7, evoK = 1 + 0.08 * (ev - 1);
    const TOT = C.base * 14 * C.K * evoK, SHARE = [0.28, 0.3, 0.42].map(w => TOT * w / Math.sqrt(N)), SC = N >= 5 ? 1.0 : N >= 3 ? 1.1 : 1.22, RING = N === 1 ? 1.1 : N <= 3 ? 1.3 : 1.4;
    const PZ = 2.9, HOV = 1.4, TILT = 0.8, ROLL = 0, PRX = 0.95;
    H.X.banner('REQUIEM', '', C.col, 1.4); H.X.sfx.hum(); H.warn(x, y, RING + 1.2, 0.9, C.col);
    // the scythes: each round the aim at its own angle, its mid-cut pointing at the aim; stagger the entrances and the sweeps
    // (a fan on the far side of the aim, leaving the pet's side open, so no weapon hangs over the pet)
    const away = Math.atan2(y - me.y, x - me.x), spread = N === 1 ? 0 : Math.min(TAU / N, 1.3), sc = [];
    for (let i = 0; i < N; i++) { const phi = away + (i - (N - 1) / 2) * spread, tin = 0.2 + i * (N >= 5 ? 0.11 : 0.16), ord = [0, 2, 4, 1, 3][i % 5];
      sc.push({ i, phi, tin, cuts: [tin + 1.3 + ord * 0.1, tin + 2.2 + ord * 0.1, tin + 3.15 + ord * 0.08], hit: [new Set(), new Set(), new Set()], done: [false, false, false], charge: 0, chT: tin + 0.85 + (CEL ? i * 0.14 : 0), trail: [], yaw0: 0, lastYaw: 0, rest: 0 }); }
    const END = sc[N - 1].tin + 4.95, LIFE = END + 0.35;
    /* the pose of a scythe at time t: { R, t, phase, yawV (rad/s), k (its fade), open (portal), clip (hidden above the portal plane) } */
    function pose(s, t) {
      const g2 = G(), u = t - s.tin, ex = END - 1.25 - (N - 1 - s.i) * 0.08;   // ex: when this one starts to withdraw
      const rot = CEL ? 0.09 * Math.max(0, Math.min(t, END) - 0.4) : 0, phi = s.phi + rot, ax = x + Math.cos(phi) * RING, ay = y + Math.sin(phi) * RING * SE, face = phi + Math.PI;
      let yaw = 0, tilt = TILT, roll = ROLL, z = HOV, dipx = 0, phase = 'poised', cutK = 0, yawV = 0, settle = 0;
      if (u < 0) return null;
      const out = t - ex;
      if (u < 0.95) {   // emerging: vertical out of the portal, then tilting forward into the reaping pose
        const d = g2.ease(cl(u / 0.6)), tl = g2.ease(cl((u - 0.5) / 0.45)); z = lerp(PZ + 1.7, HOV + 0.25, d) - 0.25 * tl; tilt = lerp(0.12, TILT, tl); roll = lerp(0, ROLL, tl); yaw = face + 0.9 - 0.5 * tl; phase = u < 0.6 ? 'in' : 'tilt';
        return { R: poseR(yaw, tilt, roll), t: [0, 0, z], ax, ay, phase, yawV: 0, cutK: 0, clip: u < 0.55, open: cl(u / 0.3 + 0.6), yaw };
      }
      if (out > 0) {   // leaving: a turn upright, a slow rise into the portal, the portal closing after
        const tl = g2.ease(cl(out / 0.45)), up = g2.ease(cl((out - 0.35) / 0.65)); const y0 = s.rest; yaw = y0 + 0.6 * tl; tilt = lerp(TILT, 0.1, tl); roll = lerp(ROLL, 0, tl); z = lerp(HOV, PZ + 1.8, up);
        return { R: poseR(yaw, tilt, roll), t: [0, 0, z], ax, ay, phase: 'out', yawV: 0, cutK: 0, clip: up > 0.35, open: 1 - cl((out - 1.0) / 0.3), yaw, gone: up >= 1 };
      }
      // the sweeps: windup (slow, back), cut (fast, about the pivot while it slides along the arc), follow-through, settle
      let yawR = face + 0.55, k = 0; phase = 'poised';
      for (let n = 0; n < 3; n++) { const tc = s.cuts[n], dir = n % 2 ? 1 : -1, W = 0.5, CUT = n === 2 ? 0.26 : 0.22, FT = 0.32, arc = n === 2 ? 4.4 : 3.7, back = 0.9, fwd = 0.45;
        const t0 = tc - W, t1 = tc, t2 = tc + CUT, t3 = t2 + FT;
        if (t < t0) break;
        const y0 = yawR;   // the rest before this sweep
        if (t < t1) { const w = g2.ease(cl((t - t0) / W)); yaw = y0 + dir * back * w; phase = 'windup'; yawV = dir * back / W * 2 * Math.sin(w * Math.PI) * 0.6; z = HOV + 0.15 * w; tilt = TILT - 0.25 * w; break; }
        if (t < t2) { const w = (t - t1) / CUT, e = 1 - Math.pow(1 - w, 2.2); yaw = y0 + dir * back - dir * arc * e; phase = 'cut'; cutK = Math.sin(w * Math.PI); yawV = -dir * arc / CUT * 2.2 * Math.pow(1 - w, 1.2); z = HOV + 0.15 - 0.5 * Math.sin(Math.min(1, w * 1.15) * Math.PI); tilt = TILT - 0.25 + 0.55 * e; dipx = 0.8 * e; break; }
        if (t < t3) { const w = cl((t - t2) / FT), e = 1 - Math.pow(1 - w, 2); yaw = y0 + dir * back - dir * (arc + fwd * e); phase = 'follow'; yawV = -dir * fwd / FT * 2 * (1 - w); z = HOV - 0.35 + 0.35 * e; tilt = TILT + 0.3 * (1 - e); dipx = 0.8 * (1 - 0.4 * e); settle = Math.max(0, 1 - w * 1.5); break; }
        yawR = y0 + dir * back - dir * (arc + fwd); dipx = 0.48; yaw = yawR; k = n + 1; settle = Math.max(0, 1 - (t - t3) / 0.4);
        if (n === 2) { phase = 'spent'; }
      }
      if (phase === 'poised' || phase === 'spent') { yaw = yawR; }
      s.rest = yaw;
      // the pivot slides a little along the swing (toward the aim) and the fittings quiver as the weapon settles (no bending: the whole rigid body shivers)
      const sh = settle > 0 ? Math.sin(t * 90) * 0.012 * settle : 0, px = ax + Math.cos(face) * dipx, py = ay + Math.sin(face) * dipx * SE;
      return { R: poseR(yaw + sh, tilt + sh * 0.5, roll), t: [0, 0, z + sh * 0.3], ax: px, ay: py, phase, yawV, cutK, clip: false, open: 1, yaw };
    }
    /* a sweep's hits: every living monster the blade's floor track crosses, once per sweep; sparks and fragments at each contact */
    function sweepHit(s, n, ps, lowZ) { const [S0, Mp, E] = bladePts(ps.R, ps.t), S = [S0[0] * 0.55, S0[1] * 0.55, S0[2]]; if (lowZ > 1.35) return; const W = 0.6, dmg = SHARE[n], o = C.dmgO({ kb: n === 2 ? 4 : 2, stun: n === 2 ? 0.3 : 0 });
      const seg = [[S, Mp], [Mp, E]].map(([a, b]) => [ps.ax + a[0], ps.ay + a[1] * SE, ps.ax + b[0], ps.ay + b[1] * SE]);
      for (const m of H.living()) { if (s.hit[n].has(m)) continue; let d = 1e9; for (const [x0, y0, x1, y1] of seg) d = Math.min(d, g.segD(m.x, m.y, x0, y0, x1, y1)); if (d < W + m.r + 0.1) { s.hit[n].add(m); H.X.hitMon(m, dmg, o); H.burst(m.x, m.y - 0.6, 'spark', 7, { v: 6, life: 0.35, size: 1.6, color: [EDGE, ACC, ACC] }); H.burst(m.x, m.y - 0.4, 'shard', 3, { v: 4, up: 2, g: 8, life: 0.5, size: 3, color: [SMOKE, PLUM] }); H.X.sfx.crash(); H.X.hitstop(n === 2 ? 0.035 : 0.02); H.X.shake(n === 2 ? 7 : 4, 0.12); H.X.light(m.x, m.y, 1.2, 0.12); } } }
    const F = H.add({ life: LIFE, x, y, dmgT: 0,
      update(dt, f) {
        for (const s of sc) { const ps = pose(s, f.t); if (!ps) continue; s.charge = Math.min(1, Math.max(0, (f.t - s.chT) / 0.35)) * (0.75 + 0.25 * Math.sin(f.t * 5 + s.i)) * (ps.phase === 'out' ? Math.max(0, 1 - (f.t - (END - 1.25)) / 0.5) : 1);
          if (ps.phase === 'cut') { const n = s.cuts.findIndex(tc => f.t >= tc && f.t < tc + 0.3); if (n >= 0) { const pts = bladePts(ps.R, ps.t); sweepHit(s, n, ps, Math.min(pts[0][2], pts[1][2], pts[2][2])); if (!s.done[n]) { s.done[n] = true; H.X.sfx.whoosh(); } }
            // ash and dark fragments torn from the air behind the blade
            if (Math.random() < 1.6 * H.Q()) { const E = bladePts(ps.R, ps.t)[2]; H.P({ kind: 'smoke', x: ps.ax + E[0], y: ps.ay + E[1] * SE - E[2] * CE, vx: (Math.random() - 0.5) * 1.5, vy: -0.4 - Math.random() * 0.8, life: 0.5, max: 0.5, size: 0.28, color: 'rgba(40,25,60,' }); }
            if (Math.random() < 1.2 * H.Q()) { const E = bladePts(ps.R, ps.t)[1]; H.P({ kind: 'ember', x: ps.ax + E[0], y: ps.ay + E[1] * SE - E[2] * CE, vx: (Math.random() - 0.5) * 2, vy: 0.5 + Math.random(), g: 2, life: 0.45, max: 0.45, size: 1.6, color: Math.random() < 0.5 ? SMOKE : EDGE }); } }
          // smoke and ash drifting from the portal rim while it is open
          if (ps.open > 0.3 && Math.random() < 0.5 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: ps.ax + Math.cos(b) * PRX, y: ps.ay + Math.sin(b) * PRX * 0.4 - PZ * CE, vx: Math.cos(b) * 0.5, vy: 0.3 + Math.random() * 0.4, life: 0.8, max: 0.8, size: 0.32, color: 'rgba(36,20,60,' }); }
          if (ps.open > 0.3 && Math.random() < 0.6 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'ember', x: ps.ax + Math.cos(b) * PRX * 0.7, y: ps.ay + Math.sin(b) * PRX * 0.3 - PZ * CE, vx: (Math.random() - 0.5) * 0.6, vy: 0.8 + Math.random() * 1.2, g: 1.5, life: 0.9, max: 0.9, size: 1.4, color: Math.random() < 0.3 ? EDGE : '#2A1C3A' }); } }
      },
      drawUnder(c, f, X, Y, T) {
        // violet light on the floor under each scythe (light only), brighter under a cut
        const fl = floorSpr(); c.save(); c.globalCompositeOperation = 'lighter';
        for (const s of sc) { const ps = pose(s, f.t); if (!ps || ps.gone) continue; const AX = H.sx(ps.ax), AY = H.sy(ps.ay), r = T * (1.6 + 0.6 * ps.cutK) * SC, k = (0.35 + 0.45 * ps.cutK) * ps.open; c.globalAlpha = k; c.drawImage(fl, AX - r, AY - r * 0.55, r * 2, r * 1.1); }
        c.restore();
      },
      draw(c, f, X, Y, T) {
        const t = f.t, PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45, cm0 = g.cam(0, 0, T * SC), list = [];
        for (const s of sc) { const ps = pose(s, t); if (!ps) continue; list.push({ s, ps, Y: H.sy(ps.ay) }); }
        list.sort((a, b) => a.Y - b.Y);
        for (const { s, ps } of list) {
          const AX = H.sx(ps.ax), AY = H.sy(ps.ay), cm = g.cam(AX, AY, T * SC), PRY = AY - PZ * CE * T * SC, prx = PRX * T * SC, pry = prx * 0.42;
          // the weapon's distance to the pet on the screen: it dims smoothly as it comes near, never covering it
          const pts = [[0, 0, 0], [bow(SL_BOT), 0, SL_BOT], [0, 0, 1.2], [BZ[2][0], 0, BZ[2][1]]].map(v => cm.P(g.add(ps.t, g.mv(ps.R, v))));
          let dp = 1e9; for (const [a, b] of [[0, 1], [0, 2], [2, 3]]) dp = Math.min(dp, g.segD(PX, PY, pts[a][0], pts[a][1], pts[b][0], pts[b][1])); const near = sstep(T * 0.6, T * 1.7, dp), alpha = lerp(0.12, 1, near);
          // the shadow on the floor, the portal's back, the scythe (clipped under the portal plane while it passes), then its trail
          if (!ps.gone) { c.save(); c.globalAlpha = alpha * 0.35 * ps.open; G().shadow(c, (pts[1][0] + pts[3][0]) / 2, AY, Math.abs(pts[3][0] - pts[1][0]) * 0.5 + T * 0.5, T * 0.4, 0, 0.5); c.restore(); }
          if (ps.open > 0.01) drawPortal(c, AX, PRY, prx, pry, ps.open, t + s.i, alpha * Math.min(1, (LIFE - t) / 0.3), true);
          if (ps.gone) continue;
          // the crescent and the thin violet trail behind the real blade (fading fast, drawn before the steel)
          if (ps.phase === 'cut' || ps.phase === 'follow') s.trail.push({ t, p: bladePts(ps.R, ps.t).map(v => cm.P(v)), k: ps.cutK });
          else if (s.trail.length && t - s.trail[s.trail.length - 1].t > 0.3) s.trail.length = 0;
          while (s.trail.length && t - s.trail[0].t > 0.24) s.trail.shift();
          if (s.trail.length > 1) { c.save(); c.globalAlpha = alpha; const tr = s.trail;
            // the shadow crescent: translucent plum quads between successive blade positions, fading with age toward the far end
            for (let j = 1; j < tr.length; j++) { const a = tr[j - 1], b = tr[j], age = cl(1 - (t - b.t) / 0.24); if (age <= 0) continue; const al = 0.42 * age * age * (0.5 + 0.5 * b.k); c.fillStyle = rgba(PLUM, al); c.beginPath(); c.moveTo(a.p[0][0], a.p[0][1]); c.lineTo(a.p[1][0], a.p[1][1]); c.lineTo(a.p[2][0], a.p[2][1]); c.lineTo(b.p[2][0], b.p[2][1]); c.lineTo(b.p[1][0], b.p[1][1]); c.lineTo(b.p[0][0], b.p[0][1]); c.closePath(); c.fill(); c.fillStyle = rgba(BODY, al * 0.7); c.beginPath(); c.moveTo(a.p[1][0], a.p[1][1]); c.lineTo(a.p[2][0], a.p[2][1]); c.lineTo(b.p[2][0], b.p[2][1]); c.lineTo(b.p[1][0], b.p[1][1]); c.closePath(); c.fill(); }
            // the thin violet trail along the tip's path, additive, a pale heart
            c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
            for (let j = 1; j < tr.length; j++) { const a = tr[j - 1], b = tr[j], age = cl(1 - (t - b.t) / 0.2); if (age <= 0) continue; c.strokeStyle = rgba(EDGE, 0.5 * age); c.lineWidth = Math.max(1.5, T * 0.09 * age); c.beginPath(); c.moveTo(a.p[2][0], a.p[2][1]); c.lineTo(b.p[2][0], b.p[2][1]); c.stroke(); c.strokeStyle = rgba(ACC, 0.6 * age); c.lineWidth = Math.max(0.8, T * 0.025); c.stroke(); c.strokeStyle = rgba(ENERGY, 0.3 * age); c.lineWidth = Math.max(1, T * 0.06 * age); c.beginPath(); c.moveTo(a.p[1][0], a.p[1][1]); c.lineTo(b.p[1][0], b.p[1][1]); c.stroke(); }
            c.restore(); }
          // the weapon itself
          c.save(); if (ps.clip) { c.beginPath(); c.rect(AX - T * 8, PRY, T * 16, T * 30); c.clip(); }
          const fast = cl((Math.abs(ps.yawV) - 4) / 10), tcN = s.cuts.find(tc => t >= tc - 0.01 && t < tc + 0.4), hlPos = ps.phase === 'cut' && tcN != null ? 0.15 + 0.8 * cl((t - tcN) / 0.2) : 0;
          paintScythe(c, cm, ps.R, ps.t, { charge: s.charge * (ev >= 4 ? 1 : 0.8), hl: fast, hlPos, glow: !(st && st.lowFx), alpha });
          // the engravings' light on the air round the socket when charged
          if (s.charge > 0.05 && !(st && st.lowFx)) { const sk = pts[2]; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * 0.22 * s.charge; blitSized(c, glowSprite(ENERGY), sk[0] - T * 0.7, sk[1] - T * 0.7, T * 1.4, T * 1.4); c.restore(); }
          c.restore();
        }
      } });
    void F;
    // the whoosh of each withdrawal and the hum of each portal
    sc.forEach(s => { H.X.after(s.tin, () => H.X.sfx.hum()); H.X.after(s.tin + 0.6, () => H.X.sfx.whoosh()); });
    H.X.after(END - 1.0, () => H.X.sfx.thud());
  };
  // the debug door: the model alone, for the harness (glow off, neutral light)
  U.requiem.__dbg = { paintScythe, poseR, model, MAT, G: GeoKit };
})();
