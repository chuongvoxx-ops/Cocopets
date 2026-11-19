/* ---------- v423 GB · Rift 02 · CALYX ASTRUM THE STARBORN VINE on the GPU ----------
   Calyx Astrum (20x-rift-fiend-garden-3.js) as a 3D creature in GLM (materials 270..277 between the GB-CALYX-MAT markers in
   20k5uz), on GB_KIT (20x2): a serpent-dragon woven of starlit vines, its body one tube rewritten every frame along the
   fight's own spine (the head leads, the body follows its trail, a wave runs down it), three strands plaited round it with
   starlight down its spine; ivory thorns along both its flanks and four constellation blossoms on its back (each many copies of
   one mesh in one draw, placed every frame: the blossoms open and swell for a bloom); a head like a great closed flower-bud,
   two plum upper petals that peel open when it is seized, a lower petal for a jaw lined with thorn-fangs that opens to show
   the star burning in its throat, gold slit eyes that blink, jade sepals and two curling tendrils at its neck, a curl of
   tendril and a leaf at its tail. Its effects (Vine Whips' lanes and lashes, Star Rain's pools of light and falling stars,
   Bloom Burst's petals of light, Constrict's coil of light and its gap, the star blossoms' light, the seizing, the
   withering) are drawn on the FGFX painter (kinds 179..181); the tells are light only.
   Without WebGL, or on a software rasteriser (window.__GB_GL = 1 forces the GPU there: tests), or without the FGFX painter,
   the existing 2D Calyx is drawn with the same fight. */
const CALYX_GL = (() => {
  const K = GB_KIT, { TAU, cl, lerp, sstep, ease, GY, ZK, CW, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm, rotX, rotY, rotZ, rotAxis, frameXZ, hash } = K;
  const M_VINE = 270, M_THORN = 271, M_PETAL = 272, M_HEART = 273, M_BUD = 274, M_CORE = 275, M_LEAF = 276, M_EYE = 277;
  const N = 24, BLOOM = [4, 9, 14, 19], NS = 47, NVR = 12, THN = [];
  for (let i = 2; i < N - 1; i += 2) for (const sd of [1, -1]) THN.push([i, sd]);
  const CAL = K.model('Calyx', buildMeshes);
  function buildMeshes() {
    const DQ = K.lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    // the body: a tube along the spine (rewritten each frame); vA.y along it 0 (the neck) .. 1 (the tail), vA.z round it (0.25 the top)
    { const B = nb(); B.surf((u, v) => [u * 10, Math.cos(v * TAU) * 0.5, Math.sin(v * TAU) * 0.5], NS - 1, NVR, () => M_VINE, { e: u => u, a: (u, v) => v }); fin('body', B); }
    // a thorn (along x, its base at 0): ivory, curved a little
    { const B = nb(); B.surf((u, v) => { const a = v * TAU, r = 0.22 * Math.pow(1 - u, 1.1) + 0.006; return [u, Math.cos(a) * r, Math.sin(a) * r * 0.8 + 0.12 * u * u]; }, 6, q(7), () => M_THORN, { e: () => 0, a: u => u }); out.thorns = K.multi(B.done(), THN.length); }
    // a blossom's petal (along x from its heart): a cupped cream oval; its heart: a gold five-pointed star
    { const B = nb(); B.surf((u, v) => { const x = 0.12 + u * 0.95, w = 0.42 * Math.sin(Math.PI * Math.pow(u, 0.8)) + 0.02, y = (v - 0.5) * 2 * w; return [x, y, 0.18 * u * u - 0.12 * (y / (w + 0.01)) * (y / (w + 0.01)) * u + 0.06]; }, q(8), q(6), () => M_PETAL, { e: (u, v) => Math.abs(v - 0.5) * 2, a: u => u }); out.petals = K.multi(B.done(), BLOOM.length * 5); }
    { const B = nb(), pts = []; for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 0.16 : 0.36; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } B.prism(pts, 0, 0.12, M_HEART, { b: 0.03 }); out.hearts = K.multi(B.done(), BLOOM.length); }
    // the bud: two upper petals (left, right), each a shell from the top down its side, closing to a point forward, a rose lip
    // and thorn-fangs along its lower edge; the jaw: the lower petal, hinged at the throat, fangs up its lip
    const prof = x => { const u = (x + 0.5) / 1.95; return 0.56 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u)) * 0.93 + 0.12), 0.9) * (1 - 0.25 * u); };
    for (const [nm, sg] of [['budL', 1], ['budR', -1]]) { const B = nb();
      B.surf((u, v) => { const x = -0.5 + u * 1.95, r = prof(x) * (1.04 + 0.04 * Math.sin(Math.PI * v)), a = lerp(Math.PI / 2 + 0.12, -0.32, v), lip = sstep(0.85, 1, v) * 0.03; return [x, sg * Math.cos(a) * (r - lip), Math.sin(a) * (r - lip) + 0.02]; }, q(18), q(10), () => M_BUD, { e: (u, v) => sstep(0.72, 1, v), a: u => u });
      for (let j = 0; j < 4; j++) { const x = 0.45 + j * 0.25, r = prof(x), a = -0.32, p = [x, sg * Math.cos(a) * r, Math.sin(a) * r]; B.tube(p, vadd(p, [0.03, sg * 0.03, -0.17 - (j === 3 ? 0.08 : 0)]), 0.05, 0.004, M_THORN, { seg: 6, cap1: false }); }
      fin(nm, B); }
    { const B = nb(); B.surf((u, v) => { const x = -0.15 + u * 1.5, r = prof(x - 0.1) * 0.92, a = lerp(-0.3, -Math.PI + 0.3, v); return [x, Math.cos(a) * r, Math.sin(a) * r * 0.85 + 0.05]; }, q(16), q(10), () => M_BUD, { e: (u, v) => Math.max(sstep(0.82, 1, v), sstep(0.18, 0, v)), a: u => u });
      for (let j = 0; j < 5; j++) for (const sg of [1, -1]) { const x = 0.35 + j * 0.22, r = prof(x - 0.1) * 0.92, a = sg > 0 ? -0.3 : -Math.PI + 0.3, p = [x, Math.cos(a) * r, Math.sin(a) * r * 0.85 + 0.05]; B.tube(p, vadd(p, [0.02, -sg * 0.02, 0.15 + (j === 4 ? 0.08 : 0)]), 0.045, 0.004, M_THORN, { seg: 6, cap1: false }); }
      fin('jaw', B); }
    { const B = nb(); B.sph([0, 0, 0], 0.3, M_CORE, q(16)); fin('core', B); }
    { const B = nb(); B.ell([0, 0, 0], [0.19, 0.07, 0.12], M_EYE, { seg: q(14), rings: q(8) }); fin('eye', B); }
    // a jade leaf (along x): a pointed blade with a midrib, curled; a tendril: a curling tube
    { const B = nb(); B.surf((u, v) => { const x = u, w = 0.36 * Math.sin(Math.PI * Math.pow(u, 0.75)) + 0.01, y = (v - 0.5) * 2 * w; return [x, y, 0.1 * Math.sin(Math.PI * u) - 0.25 * (y * y) + 0.15 * u * u]; }, q(10), q(6), () => M_LEAF, { e: (u, v) => Math.abs(v - 0.5) * 2, a: u => u }); fin('leaf', B); }
    { const B = nb(), P = u => { const a = u * 4.2; return [u * 1.3 + 0.25 * Math.sin(a) * u, 0.3 * (1 - Math.cos(a)) * u, 0.12 * Math.sin(a * 0.5)]; };
      B.surf((u, v) => { const p = P(u), p2 = P(Math.min(1, u + 0.02)), d = vnrm(vsub(p2, p)), s = vnrm(vcross(d, [0, 0, 1])), up = vcross(s, d), r = 0.08 * (1 - u * 0.85) + 0.006, a = v * TAU; return vadd(p, vadd(vmul(s, Math.cos(a) * r), vmul(up, Math.sin(a) * r))); }, q(18), q(6), () => M_LEAF, { e: () => 0.5, a: u => u }); fin('tendril', B); }
    // a floor star blossom (its stem, two sepals and a five-petalled star-flower facing up), open (lit) or half shut
    for (const [nm, op] of [['flowerO', 1], ['flowerC', 0.45]]) { const B = nb();
      B.tube([0, 0, 0], [0.12, 0, 1.25], 0.07, 0.05, M_LEAF, { seg: q(8) });
      for (const sg of [1, -1]) { B.push([0.55 * sg, 0, 0.2], [0, 1, 0], [-0.2 * sg, 0, 0.55], [0.05, 0, 0.15]); B.surf((u, v) => { const x = u, w = 0.36 * Math.sin(Math.PI * Math.pow(u, 0.75)) + 0.01, y = (v - 0.5) * 2 * w; return [x, y, 0.1 * Math.sin(Math.PI * u) - 0.25 * (y * y)]; }, q(8), q(5), () => M_LEAF, { e: (u, v) => Math.abs(v - 0.5) * 2, a: u => u }); B.pop(); }
      for (let j = 0; j < 5; j++) { const a = j / 5 * TAU - Math.PI / 2, tilt = 0.25 + (1 - op) * 0.9, d = [Math.cos(a) * Math.cos(tilt), Math.sin(a) * Math.cos(tilt), Math.sin(tilt)], s2 = 0.75;
        const z = [-Math.cos(a) * Math.sin(tilt), -Math.sin(a) * Math.sin(tilt), Math.cos(tilt)], y = vcross(z, d); B.push(vmul(d, s2), vmul(y, s2), vmul(z, s2), [0.12, 0, 1.3]);
        B.surf((u, v) => { const x = 0.12 + u * 0.95, w = 0.42 * Math.sin(Math.PI * Math.pow(u, 0.8)) + 0.02, yy = (v - 0.5) * 2 * w; return [x, yy, 0.18 * u * u - 0.12 * (yy / (w + 0.01)) * (yy / (w + 0.01)) * u + 0.06]; }, q(8), q(6), () => M_PETAL, { e: (u, v) => Math.abs(v - 0.5) * 2, a: u => u }); B.pop(); }
      { const pts = []; for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r = (k % 2 ? 0.12 : 0.27); pts.push([Math.cos(a) * r, Math.sin(a) * r]); } B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.12, 0, 1.36]); B.prism(pts, 0, 0.1, M_HEART, { b: 0.025 }); B.pop(); }
      fin(nm, B); }
    return out; }
  /* ================= the rig: the spine from the fight (its points in tiles, as the 2D draws them: the wave applied, widths) ================= */
  const toM = (m, p) => [p.x - m.x, (p.y - m.y) / GY, p.z / ZK];
  function cr(a, b, c, d, t) { return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); }
  function spineAt(S, f) { const n = S.length, i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i, A = S[Math.max(0, i - 1)], B = S[i], C = S[i + 1], D = S[Math.min(n - 1, i + 2)];
    return [cr(A[0], B[0], C[0], D[0], t), cr(A[1], B[1], C[1], D[1], t), cr(A[2], B[2], C[2], D[2], t), lerp(B[3], C[3], t)]; }
  // a frame along the spine at f: x the tangent (toward the tail), y its side, z its up
  function frameAt(S, f) { const a = spineAt(S, Math.max(0, f - 0.25)), b = spineAt(S, Math.min(S.length - 1, f + 0.25)); return frameXZ(vsub(b, a), [0, 0, 1]); }
  let BODYKEY = '';
  /* P: sp (the spine: [{ x, y, z, w }] head first), bt, jaw, open (the bud peeled), seize, bloom, menace, roar, blink, look
     (the pet, world), dead (0..1), alpha */
  function rig(m, P) {
    const inst = [], A = {}, dead = cl(P.dead || 0), bt = P.bt || 0, bloom = cl(P.bloom || 0), open = cl(P.open || 0), seize = cl(P.seize || 0), roar = P.roar || 0, menace = P.menace || 0, jaw = cl(P.jaw || 0);
    const I = (name, part, R, o, ex) => { const it = { name, part, R, o, s: 1, al: 1, glow: 0, glow2: 0, spill: 0, kind: 0, fx: dead * 0.85, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const S = P.sp.map(p => { const q = toM(m, p); q.push((p.w || 1) * 0.58); return q; }), n = S.length;
    // the body: rewritten along the spine
    const MB = CAL.MESH.body, rad = f => { const r = spineAt(S, f)[3]; return r * (1 - 0.15 * dead); };
    K.regrid(MB, NS - 1, NVR, (u, v) => { const f = u * (n - 1), c = spineAt(S, f), F = frameAt(S, f), r = rad(f), a = v * TAU; return vadd(c.slice(0, 3), vadd(vmul(F.y, Math.cos(a) * r), vmul(F.z, Math.sin(a) * r * 0.82))); });
    CAL.PB.body = null;
    const glowB = Math.max(bloom, open, roar) * (1 - dead);
    I('body', 'body', I3(), [0, 0, 0], { glow: 0.25 + glowB * 0.9, glow2: seize, wear: 0.33 });
    // the thorns down both flanks
    const MT = CAL.MESH.thorns; THN.forEach(([i, sd], k) => { const F = frameAt(S, i), c = S[i], r = rad(i), base = vadd(c.slice(0, 3), vadd(vmul(F.y, sd * r * 0.9), vmul(F.z, r * 0.2))), d = vnrm(vadd(vadd(vmul(F.y, sd * 0.85), vmul(F.z, 0.35)), vmul(F.x, 0.45))), L = Math.max(0.12, r * 0.9);
      K.place(MT, k, frameXZ(d, F.z), base, [L, L * 1.4, L * 1.4]); }); K.commit(MT); CAL.PB.thorns = null;
    I('thorns', 'thorns', I3(), [0, 0, 0], { wear: 0.6 });
    // the constellation blossoms on its back: five petals round a gold heart, swelling and opening for a bloom
    const MP = CAL.MESH.petals, MHe = CAL.MESH.hearts; BLOOM.forEach((i, k) => { const F = frameAt(S, i), c = S[i], r = rad(i), lit = Math.max(bloom, open, roar), pk = 0.7 + 0.3 * Math.sin(bt * 2.4 + k * 1.3), sz = r * (0.8 + lit * 0.45) * (0.96 + pk * 0.04) * (1 - dead * 0.4);
      const ctr = vadd(c.slice(0, 3), vmul(F.z, r * 0.78)), up = vnrm(vadd(F.z, vmul(F.y, 0.0))), spin = bt * 0.4 * lit + k;
      for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + spin, dir = vadd(vmul(F.x, Math.cos(a)), vmul(F.y, Math.sin(a))), tilt = 0.55 - lit * 0.45 + dead * 0.8, d2 = vnrm(vadd(vmul(dir, Math.cos(tilt)), vmul(up, Math.sin(tilt))));
        K.place(MP, k * 5 + j, frameXZ(d2, up), ctr, [sz, sz, sz]); }
      K.place(MHe, k, M3(F.x, F.y, F.z), vadd(ctr, vmul(up, 0.05)), [sz * 0.9, sz * 0.9, sz]); A['bl' + k] = vadd(ctr, vmul(up, 0.1)); });
    K.commit(MP); K.commit(MHe); CAL.PB.petals = null; CAL.PB.hearts = null;
    I('petals', 'petals', I3(), [0, 0, 0], { glow: (0.2 + Math.max(bloom, open, roar) * 1.1) * (1 - dead), wear: 0.4 });
    I('hearts', 'hearts', I3(), [0, 0, 0], { glow: (0.35 + Math.max(bloom, open, roar) * 1.4) * (1 - dead), wear: 0.5 });
    // the head: a frame at the spine's head (x forward along the neck), the bud, its jaw, the star core, eyes, sepals, tendrils
    const h0 = S[0], h2 = S[Math.min(2, n - 1)], fwd = vnrm(vsub(h0.slice(0, 3), h2.slice(0, 3))), Fh = frameXZ(fwd, [0, 0, 1]), hs = 1.5 * (1 + roar * 0.1 + (P.hs || 0) * 0.06), H = vadd(h0.slice(0, 3), vmul(fwd, 0.25 * hs));
    const toH = p => vadd(H, mv(Fh, vmul(p, hs))), peel = open * 0.85 + dead * 0.4;
    I('budL', 'budL', mm(Fh, rotX(-peel)), H, { s: hs, glow: menace * 0.6 + open * 0.8, wear: 0.2 });
    I('budR', 'budR', mm(Fh, rotX(peel)), H, { s: hs, glow: menace * 0.6 + open * 0.8, wear: 0.7 });
    const hinge = toH([-0.15, 0, -0.05]); I('jaw', 'jaw', mm(Fh, rotY(jaw * 0.75)), hinge, { s: hs, glow: jaw, wear: 0.45 });
    const corP = toH([0.62, 0, 0.0]), cg = Math.max(jaw, open, roar * 0.8) * (1 - dead);
    I('core', 'core', Fh, corP, { s: hs * (0.85 + 0.25 * cg + 0.06 * Math.sin(bt * 12) * cg), glow: 0.25 + cg * 1.4, wear: 0.5 });
    const blink = cl(P.blink || 0); for (const sg of [1, -1]) I('eye' + sg, 'eye', mm(Fh, rotZ(sg * 0.25)), toH([0.52, sg * 0.4, 0.2]), { s: hs, sc: [1, 1, Math.max(0.12, 1 - blink)], glow: 0.6 + menace * 1.2 + seize * 0.6, glow2: seize, wear: sg > 0 ? 0.2 : 0.8 });
    for (let j = 0; j < 4; j++) { const a = j / 4 * TAU + Math.PI / 4, dir = mv(Fh, [-0.75, Math.cos(a) * 0.65, Math.sin(a) * 0.65]); I('sep' + j, 'leaf', frameXZ(dir, mv(Fh, [0, Math.cos(a), Math.sin(a)])), toH([-0.35, Math.cos(a) * 0.35, Math.sin(a) * 0.3]), { s: hs * 0.85, wear: 0.1 + j * 0.2 }); }
    for (const sg of [1, -1]) { const tw = Math.sin(bt * 2.2 + (sg > 0 ? 0 : 2)) * 0.25, Rt = mm(Fh, mm(rotZ(Math.PI + sg * 0.5 + tw), M3([1, 0, 0], [0, sg, 0], [0, 0, 1]))); I('ten' + sg, 'tendril', Rt, toH([-0.3, sg * 0.45, 0.2]), { s: hs * 1.1, wear: sg > 0 ? 0.3 : 0.6 }); }
    // the tail: a curl of tendril and a leaf
    { const te = S[n - 1], tb = S[Math.max(0, n - 3)], d = vnrm(vsub(te.slice(0, 3), tb.slice(0, 3))), Ft = frameXZ(d, [0, 0, 1]); I('tcurl', 'tendril', mm(Ft, rotX(Math.sin(bt * 2) * 0.3)), te.slice(0, 3), { s: 0.9, wear: 0.9 }); I('tleaf', 'leaf', mm(Ft, rotZ(0.6 + Math.sin(bt * 1.6) * 0.15)), vadd(te.slice(0, 3), vmul(d, 0.2)), { s: 1.4, wear: 0.55 }); }
    A.core = corP; A.head = H; A.hs = hs; A.fwd = fwd;
    return { inst, A, S }; }
  let LAST = null;
  function draw(c, m, P, o) { if (!CAL.on()) return null; const al0 = P.alpha == null ? 1 : P.alpha; if (!(al0 > 0.01)) return null;
    let R; try { R = rig(m, P); } catch (e) { CAL.fail(); if (typeof console !== 'undefined') console.warn('Calyx: rig', e); return null; }
    const V = K.mkView(m.x, m.y, 0, 0, o); LAST = { R, V };
    K.shadow(c, V, R.inst.filter(it => it.part === 'body' || it.part === 'budL' || it.part === 'jaw'), al0 * 0.9, CAL);
    let ok = false; try { ok = K.glPass(c, V, R.inst, al0, { t: o.t, flash: o.flash, occ: K.lowFx() ? null : [[R.A.head, R.A.hs * 0.55]] }, CAL); } catch (e) { CAL.fail(); if (typeof console !== 'undefined') console.warn('Calyx: draw', e); ok = false; }
    return ok ? R : null; }
  /* ================= the fight on the GPU ================= */
  const GOLD = '#FFD36B', CREAM = '#F2D8A1', JADE_HI = '#86C9B2', MINT = '#C8FFE8', STARW = '#FFF4C0';
  const on = () => CAL.on() && !!K.fg();
  /* its pose from the fight's memory (the 2D Calyx's own numbers, drawVine); sp: the spine (the fight file's gbSpine) */
  function poseOf(FX, m, M, t, sp) { const E = M.gbEnd, roar = M.roar || 0, open = M.open || 0;
    const P = { sp, bt: M.bt != null ? M.bt : t, jaw: Math.max(M.jaw || 0, M.clack || 0, roar, open), open, seize: M.seize || 0, bloom: M.bloom || 0, menace: M.menace || 0, roar, blink: Math.max(M.blink || 0, (m.hitSq || 0) * 0.6), hs: m.hitSq || 0, dead: 0, alpha: 1 };
    if (E) { const u = E.t; P.dead = cl(u / 1.8); P.jaw = 0.55 * ease(cl(u / 0.8)) + Math.max(0, 0.8 - u) * 0.6; P.open = Math.max(0, open - u); P.bloom = Math.max(0, 1 - u * 1.5); P.roar = Math.max(0, 1 - u * 2) * 0.7; P.menace = 0; P.blink = cl((u - 1.0) / 0.6); P.alpha = 1 - cl((u - 2.4) / 0.8);
      P.sp = sp.map(p => Object.assign({}, p, { z: lerp(p.z, 0.32, ease(cl(u / 1.4))) })); }
    return P; }
  function paint(c, FX, m, X, Y, T, t, sp, corpse) { const M = FX.mem; if (!M || !sp || (m.dead && !corpse)) return !!m.dead; const P = poseOf(FX, m, M, t, sp);
    return !!draw(c, m, P, { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T, t: P.bt, flash: m.flash > 0 ? 1 : 0 }); }
  const scr = p => { const L = LAST; return L ? L.V.toS(p) : null; };
  /* light that runs round an arc as overlapping links (no beads), a link whose middle is off the floor left out */
  function arcLinks(X, Y, R, b0, b1, n, fn) { const st = (b1 - b0) / n; for (let i = 0; i < n; i++) { const p0 = b0 + st * (i - 0.13), p1 = b0 + st * (i + 1.13); fn(X + Math.cos(p0) * R, Y + Math.sin(p0) * R, X + Math.cos(p1) * R, Y + Math.sin(p1) * R, i); } }
  /* the tells this fight keeps (to see a strike land: a tell gone from the list, done) */
  function strikes(FX, M, t) { const seen = M.gbSeen || (M.gbSeen = []), fx = M.gbFx || (M.gbFx = []), now = FX.S.tele;
    for (let i = seen.length - 1; i >= 0; i--) { const s = seen[i]; if (now.includes(s)) continue; seen.splice(i, 1); if (s.done && s.age >= s.t - 0.02) fx.push({ kind: s.gb, x: s.x, y: s.y, a: s.a, len: s.len, w: s.w, r: s.r, r0: s.r0, r1: s.r1, ga: s.ga, t0: t }); }
    for (const s of now) if (s.gb && !seen.includes(s)) seen.push(s);
    for (let i = fx.length - 1; i >= 0; i--) if (t - fx[i].t0 > 0.9 || t < fx[i].t0) fx.splice(i, 1); return fx; }
  /* the floor's pass (the overlay): the blossoms' pools of light, the lanes, the pools where the stars will fall, the coil */
  function ground(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m || !on()) return false; const F = K.fg(), Q = F.begin(c, null), lf = K.lowFx();
    try {
      for (const o of FX.S.objs) if (o.kind === 'blossom' && !o.dead) { const X = FX.sx(o.x), Y = FX.sy(o.y), lit = M.lit === o.idx, k = lit ? 0.7 + 0.3 * Math.sin(t * 4.8 + o.idx) : 0.35 + 0.1 * Math.sin(t * 1.5 + o.idx); Q.glow(X, Y, T * (lit ? 3.0 : 1.8), GOLD, (lit ? 0.32 : 0.1) * k, 0.5); if (lit) Q.ripple(X, Y, T * (0.9 + ((t * 0.8 + o.idx * 0.3) % 1) * 1.8), STARW, 0.3 * (1 - (t * 0.8 + o.idx * 0.3) % 1), o.idx, 0.5, 0.1); }
      for (const s of FX.S.tele) { if (!s.gb || s.done) continue; const u = cl(s.age / s.t), pul = 0.5 + 0.5 * Math.sin(t * (6 + 10 * u));
        if (s.gb === 'whip') { const x0 = FX.sx(s.x), y0 = FX.sy(s.y), x1 = FX.sx(s.x + Math.cos(s.a) * s.len), y1 = FX.sy(s.y + Math.sin(s.a) * s.len), nx = -Math.sin(s.a) * s.w / 2 * T, ny = Math.cos(s.a) * s.w / 2 * T;
          Q.rbeam(x0, y0, x1, y1, s.w * T * 0.45, JADE_HI, 0.06 + 0.12 * u, 0.6, 0.3);
          for (const sg of [-1, 1]) Q.rbeam(x0 + nx * sg, y0 + ny * sg, x1 + nx * sg, y1 + ny * sg, T * 0.1, MINT, 0.22 + 0.4 * u * (0.8 + 0.2 * pul), 0.8, 0.2);
          Q.quad(179, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, nx * 0.7, ny * 0.7, JADE_HI, 0.3 + 0.6 * u, s.len / s.w, s.x * 1.7, u);
          const f = (t * 0.9 + s.a) % 1; Q.glow(lerp(x0, x1, f), lerp(y0, y1, f), T * 0.7, MINT, 0.3 * u * Math.sin(Math.PI * f)); }
        else if (s.gb === 'rain') { const X = FX.sx(s.x), Y = FX.sy(s.y), r = s.r * T;
          Q.glow(X, Y, r * 1.25, GOLD, 0.1 + 0.32 * u, 0.55); Q.glow(X, Y, r * 0.55, STARW, 0.1 + 0.4 * u * u, 0.55);
          for (let i = 0; i < (lf ? 1 : 2); i++) { const f = (t * 0.7 + i * 0.5 + s.x * 0.13) % 1; Q.ripple(X, Y, r * (1.05 - f * 0.75), STARW, 0.32 * u * Math.sin(Math.PI * f), s.x + i, 0.55, 0.1); } }
        else if (s.gb === 'coil') { const X = FX.sx(s.x), Y = FX.sy(s.y), g0 = s.ga - s.gw, g1 = s.ga + s.gw, n2 = lf ? 14 : 26;
          for (const [rr, w2] of [[s.r0, 0.16], [s.r1, 0.16], [(s.r0 + s.r1) / 2, 0.4]]) arcLinks(X, Y, rr * T, g1 + 0.03, g0 + TAU - 0.03, n2, (a0, b0, a1, b1, i) => { Q.rbeam(a0, b0, a1, b1, T * w2 * 2.6, JADE_HI, (rr === s.r0 || rr === s.r1 ? 0.18 + 0.3 * u : 0.08 + 0.16 * u)); if (w2 < 0.3) Q.rbeam(a0, b0, a1, b1, T * w2 * 0.7, MINT, 0.4 + 0.5 * u * (0.7 + 0.3 * Math.sin(t * 9 + i))); });
          const rm = (s.r0 + s.r1) / 2 * T, nn = lf ? 10 : 20; for (let i = 0; i < nn; i++) { const f = (i / nn + t * 0.12) % 1, a = g1 + 0.05 + f * (TAU - 2 * s.gw - 0.1), rw = rm + Math.sin(f * 40 + t * 3) * (s.r1 - s.r0) * T * 0.32; Q.glow(X + Math.cos(a) * rw, Y + Math.sin(a) * rw, T * 0.32, MINT, 0.3 + 0.4 * u); }
          const gx = X + Math.cos(s.ga) * rm, gy = Y + Math.sin(s.ga) * rm; Q.rbeam(X + Math.cos(s.ga) * s.r0 * T * 0.6, Y + Math.sin(s.ga) * s.r0 * T * 0.6, X + Math.cos(s.ga) * (s.r1 + 0.8) * T, Y + Math.sin(s.ga) * (s.r1 + 0.8) * T, Math.sin(s.gw) * rm * 0.8, '#FFFFFF', 0.12 + 0.12 * pul, 0.3, 0.3);
          for (const sg of [-1, 1]) { const a = s.ga + sg * s.gw; for (const rr of [s.r0, s.r1]) Q.glow(X + Math.cos(a) * rr * T, Y + Math.sin(a) * rr * T, T * 0.5, '#FFFFFF', 0.5 + 0.3 * pul); }
          Q.glow(gx, gy, T * 1.2, MINT, 0.25 + 0.25 * pul); } }
      // where the blows land: the lash's scar of light, the stars' splash, the coil snapping shut
      for (const f of strikes(FX, M, t)) { const u = cl((t - f.t0) / 0.6), e = 1 - u; if (!(e > 0)) continue;
        if (f.kind === 'whip') { const x0 = FX.sx(f.x), y0 = FX.sy(f.y), x1 = FX.sx(f.x + Math.cos(f.a) * f.len), y1 = FX.sy(f.y + Math.sin(f.a) * f.len); Q.rbeam(x0, y0, x1, y1, T * 1.2 * e, JADE_HI, 0.35 * e, 1, 0.3); Q.rbeam(x0, y0, x1, y1, T * 0.25, '#FFFFFF', 0.7 * e * e, 1, 0.4); }
        else if (f.kind === 'rain') { const X = FX.sx(f.x), Y = FX.sy(f.y); Q.ewave(X, Y, T * (0.6 + u * 2.4), GOLD, 0.8, 0.6 * e, f.x, 0.55, 0.14); Q.glow(X, Y, T * 1.8 * e, STARW, 0.5 * e, 0.6); }
        else if (f.kind === 'coil') { const X = FX.sx(f.x), Y = FX.sy(f.y); Q.ewave(X, Y, T * (f.r1 - u * 1.5), JADE_HI, 0.75, 0.55 * e, 3.3, 1, 0.16); Q.glow(X, Y, T * f.r1, JADE_HI, 0.15 * e); } }
    } finally { F.flush(c); }
    return true; }
  /* the upper pass (drawFx): the falling stars, its blossoms' light and a bloom's flare, the star core, the eyes, the roar,
     the seizing, the withering, the floor blossoms' light */
  function upper(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m || !on()) return false; const F = K.fg(), Q = F.begin(c, null), lf = K.lowFx(), L = LAST, E = M.gbEnd, alive = !m.dead || E;
    try {
      for (const o of FX.S.objs) if (o.kind === 'blossom' && !o.dead) { const X = FX.sx(o.x), Y = FX.sy(o.y) - T * 1.1, lit = M.lit === o.idx, k = lit ? 0.7 + 0.3 * Math.sin(t * 4.8 + o.idx) : 0.35; Q.glow(X, Y, T * (lit ? 2.2 : 1.0), GOLD, (lit ? 0.45 : 0.12) * k); if (lit) { Q.glow(X, Y, T * 0.5, '#FFFFFF', 0.5 * k); Q.star(X, Y, T * (0.8 + 0.2 * Math.sin(t * 9)), 0.8, STARW); } }
      // the stars coming down into their pools: high over them, falling faster at the end, a tail of light
      for (const s of FX.S.tele) { if (s.gb !== 'rain' || s.done) continue; const u = cl(s.age / s.t), X = FX.sx(s.x), Y = FX.sy(s.y), h = (1 - u * u) * T * 9, y = Y - h; if (y < -60) continue;
        const tx = X + T * 0.5 * (1 - u * 0.4), ty = y - T * 2.6 * (1 - u * 0.5); Q.rbeam(tx, ty, X, y, T * 0.55, GOLD, 0.25 + 0.3 * u, 0.1, 1); Q.rbeam(tx, ty, X, y, T * 0.16, '#FFFFFF', 0.4 + 0.4 * u, 0.15, 1);
        Q.glow(X, y, T * (0.9 + 0.3 * u), GOLD, 0.6); Q.glow(X, y, T * 0.3, '#FFFFFF', 0.85); Q.star(X, y, T * (0.5 + 0.12 * Math.sin(t * 9 + s.x)), 1, STARW); }
      if (alive && L) { const R = L.R, A = R.A, cg = Math.max(M.jaw || 0, M.open || 0, M.roar || 0) * (E ? Math.max(0, 1 - E.t / 1.2) : 1), cp = scr(A.core);
        // its blossoms: a soft gold light, flaring for a bloom
        const bl = Math.max(M.bloom || 0, M.open || 0, M.roar || 0) * (E ? Math.max(0, 1 - E.t) : 1);
        for (let k = 0; k < BLOOM.length; k++) { const p = A['bl' + k] && scr(A['bl' + k]); if (!p) continue; const pk = 0.7 + 0.3 * Math.sin(t * 2.4 + k * 1.3); Q.glow(p[0], p[1], T * (0.9 + bl * 1.3), GOLD, (0.16 + bl * 0.4) * pk); if (bl > 0.3) Q.star(p[0], p[1], T * (0.5 + bl * 0.5), bl * pk, STARW); }
        // the star in its throat, burning when the jaw opens; bared and blazing when it is seized
        if (cp && cg > 0.05) { Q.glow(cp[0], cp[1], T * (1.0 + cg * 1.4 + (M.open || 0) * 1.4), GOLD, 0.35 * cg); Q.glow(cp[0], cp[1], T * 0.4 * (1 + cg), '#FFFFFF', 0.6 * cg); Q.star(cp[0], cp[1], T * (0.7 + cg * 0.6 + (M.open || 0) * 0.8) * (0.9 + 0.1 * Math.sin(t * 12)), cg, STARW); }
        if ((M.seize || 0) > 0.3 && !E && cp) { for (let i = 0; i < (lf ? 4 : 8); i++) { const a = i / 8 * TAU + t * 0.6, r0 = T * 1.2, r1 = T * (2.4 + 0.4 * Math.sin(t * 5 + i)); Q.rbeam(cp[0] + Math.cos(a) * r0, cp[1] + Math.sin(a) * r0 * 0.8, cp[0] + Math.cos(a) * r1, cp[1] + Math.sin(a) * r1 * 0.8, T * 0.18, STARW, 0.35 * M.seize, 1, 0); } }
        if ((M.menace || 0) > 0.1 && !E) { const hp = scr(A.head); if (hp) Q.glow(hp[0], hp[1], T * 1.4, GOLD, 0.15 * M.menace); }
        if ((M.roar || 0) > 0.05 && cp) Q.ewave(cp[0], cp[1], T * (1.5 + (1 - M.roar) * 5), GOLD, 0.7, 0.45 * M.roar, 1.1, 1, 0.14);
        // the withering: petals of light falling from it, the starlight going out of it
        if (E) { const u = E.t, S = R.S; for (let i = 0; i < (lf ? 10 : 22); i++) { const h = hash(i * 2.3 + 0.7), f = Math.min(S.length - 1, Math.floor(h * S.length)), p0 = S[f], fall = cl(u * 0.8 - h * 0.4), p = L.V.toS([p0[0] + (hash(i + 3) - 0.5) * 1.5, p0[1] + (hash(i + 5) - 0.5), Math.max(0, p0[2] + 1.2 - fall * 2.4)]);
            if (fall > 0 && fall < 1) Q.quad(180, p[0], p[1], Math.cos(u * 3 + i) * T * 0.3, Math.sin(u * 3 + i) * T * 0.3, -Math.sin(u * 3 + i) * T * 0.2, Math.cos(u * 3 + i) * T * 0.2, i % 3 ? CREAM : GOLD, 0.8 * (1 - fall), u * 2 + i, i, 0); } } }
    } finally { F.flush(c); }
    return true; }
  /* a floor star blossom from its kept picture (open and lit, or half shut), its label kept by the caller */
  function blossom(c, FX, o, X, Y, T, t, lit) { if (!on()) return false; const r = K.pic(c, CAL, lit ? 'flowerLit' : 'flowerOff', T, () => [{ part: lit ? 'flowerO' : 'flowerC', R: I3(), o: [0, 0, 0], s: 1.25, glow: lit ? 1.2 : 0.25, wear: 0.5 }]); if (!r) return false;
    const P = r.P, f = r.f, sway = Math.sin(t * 1.4 + o.idx * 2) * 0.05; c.save(); c.fillStyle = 'rgba(10,6,4,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 0.7, T * 0.26, 0, 0, TAU); c.fill();
    c.translate(X, Y); c.rotate(sway); if (o.flash > 0) c.filter = 'brightness(1.6)'; c.drawImage(P.cv, 0, 0, P.cv.width, P.cv.height, P.bx0 * f, P.by0 * f, P.bw * f, P.bh * f); c.restore(); return true; }
  /* a Bloom Burst petal (an enemy shot painting itself on the dungeon's GPU pass): a petal of cream-gold light */
  function petalPaint(Q, X, Y, r, T, b) { const a = Math.atan2(b.vy, b.vx), s = T * 0.42, ca = Math.cos(a), sa = Math.sin(a), sd = (b.x * 5.1 + b.y * 2.7) % 6.28;
    Q.glow(X, Y, s * 2.2, GOLD, 0.38); Q.quad(180, X, Y, ca * s, sa * s, -sa * s * 0.7, ca * s * 0.7, CREAM, 1, (b.t || 0) * 6 + sd, sd, 1); Q.glow(X, Y, s * 0.35, '#FFFFFF', 0.55); return true; }
  function fall(FX, m) { const M = FX.mem; if (!M || M.gbEnd || !on()) return false; M.gbEnd = { t: 0 }; M.gbCorpse = { kind: 'gbcorpse', x: m.x, y: m.y + 0.05 }; FX.S.props.push(M.gbCorpse); return true; }
  function fallTick(FX, m, dt) { const M = FX.mem, E = M && M.gbEnd; if (!E) return; E.t += dt; if (E.t > 3.4 && M.gbCorpse) { const i = FX.S.props.indexOf(M.gbCorpse); if (i >= 0) FX.S.props.splice(i, 1); M.gbCorpse = null; } }
  /* (tests) a studio turnaround: the vine alone, coiled, at four headings and in its key poses */
  function studio() { const mk = (name, hd, o) => { const sp = []; for (let i = 0; i < N; i++) { const u = i * 0.62, x = -Math.cos(hd) * u + Math.sin(u * 0.55 + 0.3) * 1.3 * Math.sin(hd), y = -Math.sin(hd) * u * 0.8 - Math.sin(u * 0.55 + 0.3) * 1.3 * Math.cos(hd) - 2; const uu = i / (N - 1); sp.push({ x, y, z: i < 5 ? lerp(o.alt || 0.45, 0.45, i / 5) : 0.45, w: (uu < 0.1 ? 1.05 + uu * 3.5 : 1.4 * Math.pow(1 - (uu - 0.1) / 0.9, 0.7) + 0.12) * (1 + (o.bloom || 0) * 0.05) }); }
      return Object.assign({ name, sp, bt: 2, T: 19, fy: 0.6 }, o); };
    return [mk('heading south', Math.PI / 2, {}), mk('heading east', 0, {}), mk('heading north', -Math.PI / 2, {}), mk('heading west', Math.PI, {}),
      mk('rearing for the rain, jaw open', Math.PI / 2 + 0.3, { alt: 2.2, jaw: 0.9, menace: 1 }), mk('blossoms open (bloom)', 0.4, { bloom: 1, menace: 0.7 }), mk('seized: the bud peeled', Math.PI / 2 - 0.4, { alt: 1.4, open: 1, jaw: 1, seize: 1 }), mk('roaring', Math.PI / 2, { alt: 1.8, roar: 1, jaw: 1 }),
      mk('a blink', Math.PI / 2, { blink: 1 }), mk('struck', Math.PI / 2, { hs: 1, blink: 0.6 }), mk('withering (defeat)', 2.5, { dead: 0.8, jaw: 0.55 }), mk('head close', Math.PI / 2 + 0.5, { alt: 1.2, jaw: 0.4, T: 30, fy: 0.5 })]; }
  function studioDraw(c, ps, o) { return !!draw(c, { x: 0, y: 0 }, ps, o); }
  return { draw, rig, G: CAL, get last() { return LAST; }, release() { LAST = null; }, BLOOM, N, on, poseOf, paint, ground, upper, blossom, petalPaint, fall, fallTick, studio, studioDraw,
    __dbg: { get gl() { return CAL.on(); }, set noGL(v) { CAL.NOGL = !!v; }, get MESH() { return CAL.MESH; }, get stats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +CAL.ms.toFixed(2), frames: CAL.n, box: CAL.box, meshMs: +CAL.meshMs.toFixed(1), meshTris: CAL.tris, pics: K.picN }); } } };
})();
GB_KIT.onRelease(() => CALYX_GL.release());
