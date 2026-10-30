/* ---------- Lightning, reworked: Forked Fang, Stormbead Chain, Volt Scythe, Thunderpin, Railflash ----------
   The first five Lightning Strongs brought to the fire rework's standard with the lightning kit (TK): luminous,
   translucent forms of white-hot plasma in blue-cyan bodies with violet fringes, a glow and particles round every piece,
   light on the floor under it, a gathering, a strike and a fading; strikes leave only violet impressions that fade out.
   Repeated shapes (the fang lances, the beads, the pins) are drawn once into cached sprites and blitted.
   Evolution (C.evo 1 Hatchling .. 4 Adept .. 7 Celestial) adds pieces and, at Celestial, a golden flourish:
     Forked Fang      2 / 3 / 4 lances; Celestial: their pinpoints join in a golden crown that bursts
     Stormbead Chain  4 / 6 / 8 beads;  Celestial: a golden crown-bead strikes every monster the chain reached
     Volt Scythe      1 / 2 / 3 blades; Celestial: the third is a great gold-edged scythe that bursts in a fan of rays
     Thunderpin       1 / 3 / 5 pins (two then four satellites); Celestial: a golden sigil joins them, the last pulse gold
     Railflash        1 / 2 / 3 bolts;  Celestial: golden accelerator rings stand over the rails and the last bolt is gold
   Anything round the pet goes behind it (drawUnder) when it lies on the far side. */
(() => {
  const S = ELEM_IMPL.thunder.strong, TAU = Math.PI * 2;
  let H, K, P;
  const bind = h => { H = h; K = TK.bind(h); P = K.P; return K; };
  const cl = u => Math.max(0, Math.min(1, u));
  /* how far along angle a from (x, y) the floor stays open, up to max tiles */
  function reach(x, y, a, max, r) { let L = 1; while (L < max && !H.X.blocked(x + Math.cos(a) * (L + 0.4), y + Math.sin(a) * (L + 0.4), r || 0.3, 0)) L += 0.25; return L; }

  /* ---------- cached sprites ---------- */
  const SPR = {};
  function sprite(key, w, h, fn) { if (SPR[key]) return SPR[key]; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); fn(c, w, h); SPR[key] = cv; return cv; }
  /* a fang lance pointing along +x, its tip at (150, 24) of a 160 x 48 picture: a haze, a tapered plasma body from a
     violet tail to a white-hot tip, two little barbs (the fang) and a hot point */
  function lanceSprite(gold) {
    return sprite('lance' + (gold ? 'G' : ''), 160, 48, (c, w, h) => {
      const lit = gold ? '#FFF1C2' : P.ice, body = gold ? P.gold : P.cyan, rim = gold ? P.amber : P.blue, dk = gold ? '#9A5A18' : P.deep, cy = h / 2;
      // a soft halo behind it
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; blitSized(c, glowSprite(rim), 30, 2, 130, h - 4); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      // the shaft: a lit upper face over a shaded lower face, fading out toward the tail
      const gs = c.createLinearGradient(8, 0, 100, 0); gs.addColorStop(0, H.rgba(body, 0)); gs.addColorStop(0.5, H.rgba(body, 0.7)); gs.addColorStop(1, body);
      c.fillStyle = gs; c.beginPath(); c.moveTo(8, cy); c.lineTo(100, cy - 3.4); c.lineTo(100, cy); c.closePath(); c.fill();
      const gs2 = c.createLinearGradient(8, 0, 100, 0); gs2.addColorStop(0, H.rgba(dk, 0)); gs2.addColorStop(0.5, H.rgba(rim, 0.7)); gs2.addColorStop(1, rim);
      c.fillStyle = gs2; c.beginPath(); c.moveTo(8, cy); c.lineTo(100, cy + 3.4); c.lineTo(100, cy); c.closePath(); c.fill();
      // the fang head: a long faceted diamond with two swept barbs
      const head = (sgn, fill) => { c.fillStyle = fill; c.beginPath(); c.moveTo(94, cy); c.lineTo(104, cy + sgn * 9); c.quadraticCurveTo(128, cy + sgn * 7, 154, cy); c.lineTo(94, cy); c.closePath(); c.fill(); };
      const gu = c.createLinearGradient(0, cy - 9, 0, cy); gu.addColorStop(0, lit); gu.addColorStop(1, body); head(-1, gu);
      const gd = c.createLinearGradient(0, cy, 0, cy + 9); gd.addColorStop(0, rim); gd.addColorStop(1, dk); head(1, gd);
      for (const sg of [-1, 1]) { c.fillStyle = sg < 0 ? body : rim; c.beginPath(); c.moveTo(104, cy + sg * 9); c.lineTo(92, cy + sg * 15); c.lineTo(100, cy + sg * 5); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(20,14,70,0.75)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(94, cy); c.lineTo(104, cy - 9); c.lineTo(92, cy - 15); c.lineTo(100, cy - 5); c.moveTo(104, cy - 9); c.quadraticCurveTo(128, cy - 7, 154, cy); c.quadraticCurveTo(128, cy + 7, 104, cy + 9); c.lineTo(92, cy + 15); c.lineTo(100, cy + 5); c.moveTo(104, cy + 9); c.lineTo(94, cy); c.stroke();
      // the white-hot ridge and point
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = P.white; c.lineWidth = 1.4; c.beginPath(); c.moveTo(60, cy - 0.5); c.lineTo(152, cy - 0.5); c.stroke();
      const gt = c.createRadialGradient(148, cy, 0, 148, cy, 9); gt.addColorStop(0, P.white); gt.addColorStop(0.5, H.rgba(P.ice, 0.5)); gt.addColorStop(1, H.rgba(body, 0)); c.fillStyle = gt; c.beginPath(); c.arc(148, cy, 9, 0, TAU); c.fill();
    });
  }
  /* a charged bead (64 x 64): a violet halo, a deep rim, a cyan body, an ice-white heart lit from the upper left */
  function beadSprite(gold) {
    return sprite('bead' + (gold ? 'G' : ''), 64, 64, (c) => {
      const body = gold ? P.gold : P.cyan, rim = gold ? P.amber : P.deep;
      const gh = c.createRadialGradient(32, 32, 10, 32, 32, 32); gh.addColorStop(0, H.rgba(gold ? P.gold : P.blue, 0.55)); gh.addColorStop(0.5, H.rgba(gold ? P.amber : P.violet, 0.22)); gh.addColorStop(1, H.rgba(P.violet, 0)); c.fillStyle = gh; c.fillRect(0, 0, 64, 64);
      const g = c.createRadialGradient(27, 27, 1, 32, 32, 15); g.addColorStop(0, P.white); g.addColorStop(0.3, P.ice); g.addColorStop(0.7, body); g.addColorStop(1, H.rgba(rim, 0.9));
      c.fillStyle = g; c.beginPath(); c.arc(32, 32, 15, 0, TAU); c.fill();
      c.strokeStyle = H.rgba(P.white, 0.55); c.lineWidth = 1.2; c.beginPath(); c.arc(32, 32, 14.5, 2.2, 3.9); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(27, 26, 4, 2.5, -0.6, 0, TAU); c.fill();
    });
  }
  /* a thunderpin (40 x 220): a slim faceted needle, lit face and shaded face, a white ridge, its point at the bottom
     (it stands in the floor) and a socket for the head at the top */
  function pinSprite(gold) {
    return sprite('pin' + (gold ? 'G' : ''), 40, 220, (c, w, h) => {
      const cx = 20, top = 22, wide = 150, tip = 218, hw = 7;
      const gl = c.createLinearGradient(0, top, 0, tip); gl.addColorStop(0, P.white); gl.addColorStop(0.25, P.ice); gl.addColorStop(0.7, gold ? P.gold : P.cyan); gl.addColorStop(1, H.rgba(P.blue, 0.85));
      c.fillStyle = gl; c.beginPath(); c.moveTo(cx, top - 6); c.lineTo(cx - hw * 0.55, top + 10); c.lineTo(cx - hw, wide); c.lineTo(cx, tip); c.closePath(); c.fill();
      const gd = c.createLinearGradient(0, top, 0, tip); gd.addColorStop(0, gold ? P.amber : P.blue); gd.addColorStop(0.55, gold ? '#B8742A' : P.deep); gd.addColorStop(1, H.rgba(P.night, 0.9));
      c.fillStyle = gd; c.beginPath(); c.moveTo(cx, top - 6); c.lineTo(cx + hw * 0.55, top + 10); c.lineTo(cx + hw, wide); c.lineTo(cx, tip); c.closePath(); c.fill();
      c.strokeStyle = H.rgba(P.white, 0.9); c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, top - 4); c.lineTo(cx, tip - 4); c.stroke();
      c.strokeStyle = H.rgba(P.white, 0.45); c.lineWidth = 1; c.beginPath(); c.moveTo(cx - hw * 0.55, top + 10); c.lineTo(cx - hw, wide); c.stroke();
      c.strokeStyle = 'rgba(20,14,60,0.8)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, top - 6); c.lineTo(cx - hw * 0.55, top + 10); c.lineTo(cx - hw, wide); c.lineTo(cx, tip); c.lineTo(cx + hw, wide); c.lineTo(cx + hw * 0.55, top + 10); c.closePath(); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(gold ? P.gold : P.cyan, 0.6); c.lineWidth = 1; for (let i = 0; i < 4; i++) { const y = top + 30 + i * 30; c.beginPath(); c.moveTo(cx - hw * 0.8, y); c.lineTo(cx, y + 6); c.lineTo(cx + hw * 0.8, y); c.stroke(); }
    });
  }
  /* blit a sprite rotated about its anchor (ax, ay in sprite px), scaled by k, additive */
  function blitRot(c, spr, x, y, ang, k, ax, ay, a, solid) { if (!(a > 0.01) || !(k > 0.01)) return; c.save(); if (!solid) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.translate(x, y); c.rotate(ang); c.drawImage(spr, -ax * k, -ay * k, spr.width * k, spr.height * k); c.restore(); }
  /* a charged bead on screen: halo sprite, turning filament rings, a hot glint */
  function bead(c, x, y, r, t, s, a, gold, swell) {
    if (!(a > 0.01) || r < 0.5) return; const k = r / 15;
    K.glow(c, x, y, r * (3.2 + 2 * (swell || 0)), gold ? P.gold : P.blue, (0.35 + 0.4 * (swell || 0)) * a);
    c.save(); c.globalAlpha = Math.min(1, a); c.drawImage(beadSprite(gold), x - 32 * k, y - 32 * k, 64 * k, 64 * k); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * a; c.strokeStyle = gold ? P.gold : P.ice; c.lineWidth = Math.max(0.6, r * 0.06);
    for (let i = 0; i < 2; i++) { c.save(); c.translate(x, y); c.rotate(t * (3 + i * 1.7) + s + i * 1.9); c.scale(1, 0.28 + 0.14 * i); c.beginPath(); c.arc(0, 0, r * (1.18 + i * 0.12), 0, TAU); c.restore(); c.stroke(); }
    c.restore();
    if (swell > 0.05) { for (let i = 0; i < 2; i++) { const b = K.R1(K.seed(t, i + s * 7, 24)) * TAU, rr = r * (1.4 + swell); K.arc(c, x + Math.cos(b) * r * 0.6, y + Math.sin(b) * r * 0.6, x + Math.cos(b + 0.6) * rr, y + Math.sin(b + 0.6) * rr, K.seed(t, i + 9, 24), 1, swell * a, { forks: 0, jit: r * 0.3, gold }); } }
  }
  /* a burst of sparks spraying out of a world point at height z */
  function spray(x, y, z, k, v, gold, life) { for (let i = 0; i < H.n(k); i++) { const b = Math.random() * TAU, sp = (v || 6) * (0.4 + Math.random() * 0.8); H.P({ kind: 'spark', x, y: y - (z || 0), vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.75 - 1, g: 5, drag: 1.2, life: (life || 0.35) * (0.6 + Math.random() * 0.6), max: life || 0.35, size: 1.6 + Math.random() * 1.4, color: gold && i % 2 ? (i % 4 === 1 ? P.gold : P.amber) : i % 3 === 0 ? P.white : i % 3 === 1 ? P.ice : P.cyan }); } }
  /* a struck point: light, a glow particle, sparks, motes */
  function flare(x, y, z, r, gold) { H.X.light(x, y, r * 2, 0.22); H.glowAt(x, y - (z || 0), r * 0.5, 0.2, gold ? P.gold : P.cyan, 0.45); spray(x, y, z, 10, 6, gold); K.motes(x, y - (z || 0), 5); }
  /* the rings and lights a strike leaves on the floor (drawn by the move's drawUnder): {x, y, t, r, gold, pts} */
  function drawMarks(c, marks, now, T) {
    for (const m of marks) { const age = now - m.t; if (age < 0) continue; const X = H.sx(m.x), Y = H.sy(m.y);
      if (age < 0.45) { const u = age / 0.45; K.shockRing(c, X, Y, T * m.r * (0.25 + 0.95 * H.ease.out(u)), (1 - u) * 0.9, now, u < 0.5 ? 2 : 0); }
      if (age < 0.6) K.floorLight(c, X, Y, T * m.r * 1.5, 0.6 * (1 - age / 0.6), m.gold ? P.gold : P.blue);
      if (m.pts && age < 1.3) K.scar(c, m.pts.map(p => [H.sx(p[0]), H.sy(p[1])]), 1 - age / 1.3); }
  }
  /* a forked violet impression round a point (world), for drawMarks */
  function forkScar(x, y, r, s) { const pts = []; for (let i = 0; i < 3; i++) { const b = s + i * 2.1 + K.R1(s + i) * 0.8, rr = r * (0.6 + 0.5 * K.R1(s * 3 + i)); pts.push([x, y], [x + Math.cos(b) * rr * 0.5 + (K.R1(i + s) - 0.5) * 0.2, y + Math.sin(b) * rr * 0.5 * 0.7], [x + Math.cos(b) * rr, y + Math.sin(b) * rr * 0.7]); } return pts; }

  /* ================= LI-S01 Forked Fang =================
     Fang lances gather in a fan before you, cross-linked by crackling arcs, then fire together, twisting round one
     shared path in a helix with plasma trails. Just before impact they separate onto nearby monsters (or converge on
     one); thin branching arcs join the impact points and retract into bright pinpoints that fade.
     2 lances at Hatchling, 3 at Adept, 4 at Celestial, where the pinpoints join in a golden crown that bursts. */
  S.forkedfang = (C, h) => {
    bind(h); const me = H.me, a = C.a, E = K.evo(C), CEL = E >= 7, n = E >= 7 ? 4 : E >= 4 ? 3 : 2, dir = [Math.cos(a), Math.sin(a)], per = [-dir[1], dir[0]];
    const L = Math.min(reach(me.x, me.y, a, 6, 0.25), Math.max(2.4, Math.hypot(C.tx - me.x, C.ty - me.y) + 0.3)), sx0 = me.x + dir[0] * 0.95, sy0 = me.y + dir[1] * 0.95;
    const CH = 0.3, FLY = 0.32, SPL = 0.12, TI = CH + FLY + SPL, Ls = Math.max(1.5, (L - 0.95) * 0.85), Z0 = 0.62;
    const ex = sx0 + dir[0] * (L - 0.95), ey = sy0 + dir[1] * (L - 0.95), tg = H.sortNear(ex, ey).filter(m => Math.hypot(m.x - ex, m.y - ey) < 2.6).slice(0, n);
    const tot = C.base * 2.4 * C.K * K.evoK(C), finK = CEL ? 0.18 : 0, per1 = tot * (1 - finK) / n, behind = dir[1] < -0.35;
    /* each lance's target: its own monster when there are enough, else they converge round one */
    const lances = []; for (let i = 0; i < n; i++) { const m = tg.length ? tg[i % tg.length] : null, conv = tg.length < n, ob = i / n * TAU + a, oR = conv ? 0.28 : 0; lances.push({ i, m, tx: (m ? m.x : ex) + Math.cos(ob) * oR, ty: (m ? m.y : ey) + Math.sin(ob) * oR * 0.7, hist: [], hit: false, gold: CEL && i === n - 1 }); }
    const marks = []; let crown = null;
    const helix = (ln, u) => { const d = Ls * H.ease.io(u), ph = ln.i / n * TAU + u * TAU * 1.6, rr = 0.42 * Math.min(1, u * 4) * (1 - 0.2 * u); return [sx0 + dir[0] * d + per[0] * Math.cos(ph) * rr, sy0 + dir[1] * d + per[1] * Math.cos(ph) * rr, Z0 + Math.sin(ph) * rr * 0.8]; };
    const pos = (ln, t) => { if (t < CH) { const u = cl(t / CH), sp = (ln.i - (n - 1) / 2) * 0.32 * H.ease.out(u); return [sx0 - dir[0] * 0.15 + per[0] * sp, sy0 - dir[1] * 0.15 + per[1] * sp, Z0 + 0.12 * Math.sin(u * Math.PI)]; }
      if (t < CH + FLY) return helix(ln, (t - CH) / FLY); const s = helix(ln, 1), v = H.ease.in(cl((t - CH - FLY) / SPL)); return [s[0] + (ln.tx - s[0]) * v, s[1] + (ln.ty - s[1]) * v, s[2] + (0.4 - s[2]) * v]; };
    H.X.sfx.hum(); me.sq = 0.75;
    H.add({ life: TI + (CEL ? 1.25 : 0.95),
      update(dt, f) {
        if (f.t < CH) { const b = Math.random() * TAU, r = 0.9 + Math.random() * 0.5; if (Math.random() < 0.9 * H.Q()) H.P({ kind: 'spark', x: sx0 + Math.cos(b) * r, y: sy0 + Math.sin(b) * r * 0.6 - Z0, vx: -Math.cos(b) * r * 4, vy: -Math.sin(b) * r * 2.4, g: 0, drag: 0, life: 0.22, max: 0.22, size: 1.8, color: Math.random() < 0.5 ? P.white : P.cyan }); }
        for (const ln of lances) { if (ln.hit) continue; const p = pos(ln, f.t); ln.hist.push(p); if (ln.hist.length > 11) ln.hist.shift(); if (f.t > CH) K.aura(p[0], p[1], 0.18, dt, 18, p[2]);
          if (f.t >= TI) { ln.hit = true; H.hitArea(ln.tx, ln.ty, 0.8, per1, C.dmgO({ kb: 2, stun: 0.25 })); flare(ln.tx, ln.ty, 0.4, 1, ln.gold); marks.push({ x: ln.tx, y: ln.ty, t: f.t, r: 0.85, gold: ln.gold, pts: forkScar(ln.tx, ln.ty, 0.8, ln.i * 1.7 + a) });
            if (lances.every(q => q.hit)) { H.X.sfx.crack(); H.X.shake(4, 0.12); H.X.hitstop(0.03); if (CEL) { const cx = lances.reduce((s, q) => s + q.tx, 0) / n, cy = lances.reduce((s, q) => s + q.ty, 0) / n; crown = { x: cx, y: cy, t: f.t + 0.3, hit: false }; } } } }
        if (crown && !crown.hit && f.t >= crown.t) { crown.hit = true; H.hitArea(crown.x, crown.y, 1.5, tot * finK, C.dmgO({ kb: 3, stun: 0.3 })); flare(crown.x, crown.y, 0.5, 1.5, true); K.goldSparks(crown.x, crown.y - 0.5, 16, 7); marks.push({ x: crown.x, y: crown.y, t: f.t, r: 1.5, gold: true }); H.X.sfx.crack(); H.X.flash(0.05, P.gold); }
      },
      paint(c, f, T, t, under) {
        const k = cl(f.life / 0.3), scr = p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T], flying = f.t < TI;
        // the gathering (and the lances while near you) sits behind you when you aim away
        if (flying && (f.t < CH + 0.08 ? behind === under : !under)) {
          const heads = [];
          for (const ln of lances) { if (ln.hit) continue; const hs = ln.hist; if (!hs.length) continue; const pts = hs.map(scr), hd = pts[pts.length - 1], pv = pts.length > 1 ? pts[pts.length - 2] : [hd[0] - dir[0], hd[1] - dir[1]];
            const ang = f.t < CH ? Math.atan2(H.sy(sy0 + dir[1]) - H.sy(sy0), H.sx(sx0 + dir[0]) - H.sx(sx0)) : Math.atan2(hd[1] - pv[1], hd[0] - pv[0]), g0 = cl(f.t / CH);
            const gp = hs[hs.length - 1]; K.floorLight(c, H.sx(gp[0]), H.sy(gp[1]), T * 0.7, 0.35 * g0, ln.gold ? P.gold : P.blue);
            if (f.t > CH && pts.length > 2) K.ribbon(c, pts, T * 0.11, 0.8, ln.gold);
            const sz = T * (0.75 + 0.35 * cl((f.t - CH) / 0.1)) * (f.t < CH ? H.ease.back(g0) : 1);
            K.glow(c, hd[0], hd[1], T * 0.7, ln.gold ? P.gold : P.blue, 0.45); blitRot(c, lanceSprite(ln.gold), hd[0], hd[1], ang, sz / 160 * 1.45, 152, 24, 1, true);
            heads.push(hd); }
          // the arcs that link the lances: flickering in the gathering and the flight, strong as they part
          const linkA = f.t < CH ? 0.5 * cl(f.t / CH) : f.t < CH + FLY ? 0.35 + 0.4 * ((f.t - CH) / FLY) : 0.9;
          for (let i = 0; i + 1 < heads.length + (heads.length > 2 ? 1 : 0); i++) { const p = heads[i], q = heads[(i + 1) % heads.length]; if (K.R1(K.seed(t, i, 14)) < 0.45 && f.t < CH + FLY) continue; K.arc(c, p[0], p[1], q[0], q[1], K.seed(t, i + 3, 22), 0.9, linkA * 0.75, { forks: 1, jit: T * 0.14, gold: CEL && i === heads.length - 1 }); }
          if (f.t < CH) { const X0 = H.sx(sx0), Y0 = H.sy(sy0) - Z0 * T, g0 = cl(f.t / CH); K.glow(c, X0, Y0, T * (0.5 + 0.6 * g0), P.blue, 0.4 * g0); K.glow(c, X0, Y0, T * 0.22 * g0, P.white, 0.5 * g0); }
        }
        if (!under) {
          // after impact: arcs join the struck points and retract into pinpoints
          const hits = lances.filter(q => q.hit), age = f.t - TI;
          if (hits.length && age >= 0) {
            const rt = cl(age / 0.32), pin = cl(1 - (age - 0.2) / 0.55);
            for (let i = 0; i < hits.length; i++) { const p = hits[i], q = hits[(i + 1) % hits.length]; if (hits.length < 2 && i) break; const px = H.sx(p.tx), py = H.sy(p.ty) - 0.4 * T, qx = H.sx(q.tx), qy = H.sy(q.ty) - 0.4 * T;
              if (p === q || Math.hypot(qx - px, qy - py) < 4) { for (let j = 0; j < 3; j++) { const b = j / 3 * TAU + a, l = T * 0.8 * (1 - rt); if (l > 2) K.arc(c, px, py, px + Math.cos(b) * l, py + Math.sin(b) * l * 0.7, K.seed(t, j + 30, 24), 1.2, 0.9 * (1 - rt), { forks: 1 }); } continue; }
              if (rt < 1) { const mx = (px + qx) / 2, my = (py + qy) / 2; K.arc(c, px, py, px + (mx - px) * (1 - rt), py + (my - py) * (1 - rt), K.seed(t, i + 40, 24), 1, 0.8 - rt * 0.4, { forks: 1, jit: T * 0.18, gold: CEL }); K.arc(c, qx, qy, qx + (mx - qx) * (1 - rt), qy + (my - qy) * (1 - rt), K.seed(t, i + 50, 24), 1, 0.8 - rt * 0.4, { forks: 1, jit: T * 0.18, gold: CEL }); } }
            for (const p of hits) { const px = H.sx(p.tx), py = H.sy(p.ty) - 0.4 * T, tw = 0.75 + 0.25 * Math.sin(t * 40 + p.i * 2); if (pin > 0) { K.glow(c, px, py, T * (0.2 + 0.3 * pin) * tw, p.gold ? P.gold : P.cyan, 0.7 * pin); K.glow(c, px, py, T * 0.1 * pin, P.white, pin); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = pin; c.strokeStyle = P.white; c.lineWidth = 1.2; const l = T * 0.32 * pin * tw; c.beginPath(); c.moveTo(px - l, py); c.lineTo(px + l, py); c.moveTo(px, py - l * 0.8); c.lineTo(px, py + l * 0.8); c.stroke(); c.restore(); }
              if (age < 0.12) K.glow(c, px, py, T * 0.9, P.cyan, 0.45 * (1 - age / 0.12)); }
          }
          // the Celestial crown: the pinpoints join in a golden star, rise a little and burst
          if (CEL && crown) { const u = (f.t - (crown.t - 0.3)) / 0.3, X = H.sx(crown.x), Y = H.sy(crown.y) - T * 0.6;
            if (u > 0 && u < 1) { const rr = T * 0.9 * (1 - 0.6 * u), pts = hits.map((p, i) => [X + Math.cos(i / hits.length * TAU - Math.PI / 2 + u * 2) * rr, Y - T * 0.3 * u + Math.sin(i / hits.length * TAU - Math.PI / 2 + u * 2) * rr * 0.6]);
              for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 2) % pts.length]; K.arc(c, p[0], p[1], q[0], q[1], K.seed(t, i + 60, 24), 1, 0.7, { forks: 0, gold: true, jit: T * 0.06 }); K.glow(c, p[0], p[1], T * 0.25, P.gold, 0.6); } K.glow(c, X, Y - T * 0.3 * u, T * (0.4 + 0.4 * u), P.gold, 0.35 * u); }
            const v = (f.t - crown.t) / 0.5; if (v > 0 && v < 1) { K.glow(c, X, Y - T * 0.3, T * 1.6 * (0.4 + v), P.gold, 0.45 * (1 - v)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - v; c.strokeStyle = P.gold; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.2, r0 = T * 0.3, r1 = T * (0.6 + 1.6 * H.ease.out(v)); c.beginPath(); c.moveTo(X + Math.cos(b) * r0, Y - T * 0.3 + Math.sin(b) * r0 * 0.6); c.lineTo(X + Math.cos(b) * r1, Y - T * 0.3 + Math.sin(b) * r1 * 0.6); c.stroke(); } c.restore(); } }
        } else {
          drawMarks(c, marks, f.t, T);
          if (f.t < TI) K.floorLight(c, H.sx(sx0 + dir[0] * Ls * 0.5), H.sy(sy0 + dir[1] * Ls * 0.5), T * Ls * 0.55, 0.2 * cl((f.t - CH) / 0.1), P.blue);
        }
        void k;
      },
      drawUnder(c, f, X, Y, T, t) { this.paint(c, f, T, t, true); },
      draw(c, f, X, Y, T, t) { this.paint(c, f, T, t, false); } });
    H.X.after(CH, () => H.X.sfx.whoosh());
  };

  /* ================= LI-S02 Stormbead Chain =================
     Charged beads condense out of motes on a ring round the target, strung together by a faint necklace of arcs over a
     ring of floor light. One after another each bead swells, crackles and discharges a bolt into a monster, the bolt
     jumping on to the next; the last bead breaks into a spray of blue-white sparks.
     4 beads at Hatchling, 6 at Adept, 8 at Celestial, where a golden crown-bead then strikes every monster reached. */
  S.stormbead = (C, h) => {
    bind(h); const x = C.tx, y = C.ty, E = K.evo(C), CEL = E >= 7, N = K.evoN(C, 4, 8), T0 = 0.45, GAP = Math.min(0.2, 0.95 / N), SW = 0.14, RX = 1.15, RY = 0.8;
    const tot = C.base * 3.2 * C.K * K.evoK(C), finK = CEL ? 0.2 : 0, perB = tot * (1 - finK) / N, END = T0 + N * GAP;
    const beads = []; for (let i = 0; i < N; i++) beads.push({ i, b: i / N * TAU + 0.4, z: 0.95 + 0.18 * (i % 2), fired: -1, tf: T0 + i * GAP, wx: x, wy: y });
    const bolts = [], marks = [], struck = new Set(); let crown = null;
    const bpos = (b, t) => { const ang = b.b + t * 0.9; return [x + Math.cos(ang) * RX, y + Math.sin(ang) * RY, b.z + 0.08 * Math.sin(t * 5 + b.i)]; };
    H.X.sfx.hum();
    const fireBead = (b, f) => {
      const p = bpos(b, f.t); b.fired = f.t; b.wx = p[0]; b.wy = p[1]; const list = H.sortNear(p[0], p[1]).filter(m => Math.hypot(m.x - x, m.y - y) < 4.4), m = list.find(q => !struck.has(q)) || list[0], last = b.i === N - 1;
      if (m) { struck.add(m); bolts.push({ x0: p[0], y0: p[1], z0: p[2], x1: m.x, y1: m.y, z1: 0.4, t: f.t, w: 3.2, gold: false }); H.X.hitMon(m, perB * 0.72, C.dmgO({ stun: 0.18 })); flare(m.x, m.y, 0.4, 0.9); marks.push({ x: m.x, y: m.y, t: f.t, r: 0.7, pts: forkScar(m.x, m.y, 0.6, b.i * 2.3) });
        const m2 = H.X.nearestMon(m.x, m.y, 3.2, m); if (m2) H.X.after(0.06, () => { if (m2.dead) return; bolts.push({ x0: m.x, y0: m.y, z0: 0.4, x1: m2.x, y1: m2.y, z1: 0.4, t: F.t, w: 2, gold: false }); H.X.hitMon(m2, perB * 0.28, C.dmgO({ stun: 0.1 })); spray(m2.x, m2.y, 0.4, 6, 5); H.X.light(m2.x, m2.y, 1.2, 0.12); struck.add(m2); }); }
      else { bolts.push({ x0: p[0], y0: p[1], z0: p[2], x1: x, y1: y, z1: 0, t: f.t, w: 3.2 }); H.hitArea(x, y, 1.25, perB, C.dmgO({ stun: 0.15 })); marks.push({ x, y, t: f.t, r: 1.1, pts: forkScar(x, y, 0.9, b.i) }); }
      spray(p[0], p[1], p[2], last ? 26 : 8, last ? 8 : 5, false, last ? 0.5 : 0.3); H.X.sfx.crack();
      if (last) { H.X.light(p[0], p[1], 2.4, 0.25); H.X.shake(3, 0.1); K.motes(p[0], p[1] - p[2], 10); if (CEL) crown = { t: f.t + 0.22, hit: false }; }
    };
    const F = H.add({ life: END + (CEL ? 1.25 : 0.9), x, y,
      update(dt, f) {
        for (const b of beads) { if (b.fired < 0 && f.t >= b.tf) fireBead(b, f); if (b.fired < 0) { const p = bpos(b, f.t); if (f.t < 0.4 && Math.random() < 0.6 * H.Q()) H.P({ kind: 'ember', x: p[0] + (Math.random() - 0.5) * 0.9, y: p[1] - p[2] + (Math.random() - 0.5) * 0.7, vx: 0, vy: 0, g: 0, drag: 2, life: 0.25, max: 0.25, size: 2.4, color: Math.random() < 0.5 ? P.cyan : P.violet }); else K.aura(p[0], p[1], 0.12, dt, 5, p[2]); } }
        if (crown && !crown.hit && f.t >= crown.t + 0.35) { crown.hit = true; const list = [...struck].filter(m => !m.dead).slice(0, 8); if (!list.length) { H.hitArea(x, y, 1.6, tot * finK, C.dmgO({ stun: 0.3 })); marks.push({ x, y, t: f.t, r: 1.6, gold: true }); }
          for (const m of list) { H.X.hitMon(m, tot * finK / list.length, C.dmgO({ stun: 0.3 })); bolts.push({ x0: x, y0: y, z0: 1.9, x1: m.x, y1: m.y, z1: 0.4, t: f.t, w: 3, gold: true }); K.goldSparks(m.x, m.y - 0.4, 6, 5); marks.push({ x: m.x, y: m.y, t: f.t, r: 0.8, gold: true }); }
          K.goldSparks(x, y - 1.9, 18, 7); H.X.light(x, y, 3, 0.3); H.X.flash(0.05, P.gold); H.X.sfx.crack(); }
      },
      drawUnder(c, f, X, Y, T, t) {
        const inK = H.ease.out(cl(f.t / 0.35)), k = cl(f.life / 0.4), live = cl(1 - (f.t - END) / 0.4);
        // the floor ring the beads stand over
        K.floorLight(c, X, Y, T * RX * 1.6, 0.35 * inK * live, P.blue);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * inK * live; c.strokeStyle = H.rgba(P.violet, 0.6); c.lineWidth = 3; H.floorEllipse(c, X, Y, T * RX, T * RY); c.stroke(); c.strokeStyle = H.rgba(P.cyan, 0.7); c.lineWidth = 1; c.setLineDash([T * 0.12, T * 0.18]); c.lineDashOffset = -t * T; H.floorEllipse(c, X, Y, T * RX * 0.86, T * RY * 0.86); c.stroke(); c.setLineDash([]); c.restore();
        for (const b of beads) { if (b.fired >= 0 && f.t - b.fired > 0.1) continue; const p = bpos(b, f.t); K.floorLight(c, H.sx(p[0]), H.sy(p[1]), T * 0.45, 0.4 * inK, P.cyan); }
        drawMarks(c, marks, f.t, T); void k;
      },
      draw(c, f, X, Y, T, t) {
        const inK = H.ease.out(cl(f.t / 0.35)), scr = p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T * inK];
        // the necklace of arcs strung between the live beads
        const live = beads.filter(b => b.fired < 0);
        for (let i = 0; i < live.length; i++) { const b = live[i], q = live[(i + 1) % live.length]; if (live.length < 2 || (live.length === 2 && i)) break; if (K.R1(K.seed(t, i, 10)) < 0.3) continue; const p0 = scr(bpos(b, f.t)), p1 = scr(bpos(q, f.t)); K.arc(c, p0[0], p0[1], p1[0], p1[1], K.seed(t, i + b.i * 3, 16), 0.9, 0.45 * inK, { forks: 0, jit: T * 0.12 }); }
        for (const b of beads) { const p = scr(bpos(b, f.t)), appear = cl((f.t - b.i * 0.03) / 0.3);
          if (b.fired < 0) { const sw = cl((f.t - (b.tf - SW)) / SW); bead(c, p[0], p[1], T * (0.19 + 0.12 * sw * sw) * H.ease.back(appear), t, b.i, appear, false, sw); }
          else { const age = f.t - b.fired; if (age < 0.25) { const u = age / 0.25, last = b.i === N - 1; K.glow(c, p[0], p[1], T * (last ? 1.5 : 0.8) * (0.5 + u), P.cyan, 0.7 * (1 - u)); K.glow(c, p[0], p[1], T * 0.3 * (1 - u), P.white, 1 - u); if (last) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * (1 - u); c.strokeStyle = P.ice; c.lineWidth = 1.3; for (let j = 0; j < 10; j++) { const b2 = j / 10 * TAU + 0.3, r0 = T * (0.15 + 0.9 * u), r1 = r0 + T * 0.3 * (1 - u); c.beginPath(); c.moveTo(p[0] + Math.cos(b2) * r0, p[1] + Math.sin(b2) * r0); c.lineTo(p[0] + Math.cos(b2) * r1, p[1] + Math.sin(b2) * r1); c.stroke(); } c.restore(); } } } }
        // the discharges
        for (const bo of bolts) { const age = f.t - bo.t; if (age > 0.22) continue; const a2 = 1 - age / 0.22, x0 = H.sx(bo.x0), y0 = H.sy(bo.y0) - bo.z0 * T, x1 = H.sx(bo.x1), y1 = H.sy(bo.y1) - bo.z1 * T; K.arc(c, x0, y0, x1, y1, K.seed(t, bo.x0 * 7 + bo.y1 * 3, 24), bo.w, a2, { forks: 3, gold: bo.gold }); K.glow(c, x1, y1, T * 0.9, bo.gold ? P.gold : P.cyan, 0.7 * a2); }
        // the Celestial crown-bead: it descends over the ring, swells and strikes every monster the chain reached
        if (crown) { const u = cl((f.t - crown.t) / 0.35), gone = crown.hit ? cl((f.t - crown.t - 0.35) / 0.3) : 0; if (gone < 1) { const cx = X, cy = Y - T * (2.6 - 0.7 * H.ease.out(u)); K.glow(c, cx, cy, T * 2.2, P.gold, 0.35 * u * (1 - gone)); bead(c, cx, cy, T * (0.22 + 0.14 * u) * (1 + gone), t, 9, (1 - gone) * cl(u * 3), true, u);
            c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * u * (1 - gone); c.strokeStyle = P.gold; c.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + t * 1.5; c.beginPath(); c.moveTo(cx + Math.cos(b) * T * 0.45, cy + Math.sin(b) * T * 0.45); c.lineTo(cx + Math.cos(b) * T * 0.75, cy + Math.sin(b) * T * 0.75); c.stroke(); } c.restore(); } }
      } });
  };

  /* ================= LI-S03 Volt Scythe =================
     A curved blade of lightning forms along your sweep: its edge is drawn on the arc as you swing, a stable bright
     outline over a translucent plasma body with small arcs crawling across its face. After the swing it flies a short way
     ahead, widening, as a broad cone strike, then dissolves into motes and leaves a fading violet arc on the floor.
     1 blade at Hatchling, 2 at Adept (crossing sweeps), 3 at Celestial, the third a great gold-edged scythe. */
  S.voltscythe = (C, h) => {
    bind(h); const me = H.me, a = C.a, E = K.evo(C), CEL = E >= 7, NB = E >= 7 ? 3 : E >= 4 ? 2 : 1, dir = [Math.cos(a), Math.sin(a)], ox = me.x, oy = me.y;
    const tot = C.base * 2.5 * C.K * K.evoK(C), SW = 0.22, FLY = 0.3, GAPB = 0.24, R0 = 1.25, DF = 2.4;
    const blades = []; for (let j = 0; j < NB; j++) { const big = CEL && j === NB - 1; blades.push({ j, side: j % 2 ? -1 : 1, t0: 0.06 + j * GAPB, big, R: R0 * (big ? 1.18 : 1), half: big ? 1.15 : 0.95, W: big ? 0.5 : 0.4, dmg: tot / NB * (big ? 1.15 : 1) / (1 + (CEL ? 0.15 / NB : 0)), hit1: false, hit2: false }); }
    const marks = [], END = blades[NB - 1].t0 + SW + FLY;
    /* blade j's state at time t: the swept extent, its centre offset along the aim, and its alpha */
    const state = (b, t) => { const u = t - b.t0; if (u < 0) return null; const sw = cl(u / SW), fl = cl((u - SW) / FLY), fade = cl((u - SW - FLY) / 0.32); if (fade >= 1) return null; return { sw: H.ease.io(sw), fl: H.ease.out(fl), d: DF * H.ease.out(fl), grow: 1 + 0.35 * fl, a: (1 - fade) * cl(u / 0.06), fade, u }; };
    /* the blade's outline in screen px: outer edge then inner edge, theta across [lo, hi] */
    const outline = (b, s, T) => { const cx = ox + dir[0] * s.d, cy = oy + dir[1] * s.d, R = b.R * s.grow, half = b.half * s.grow * 0.92, z = 0.45 * T, n = 16;
      const th0 = a - b.side * half, thN = a - b.side * half + b.side * 2 * half * s.sw, outer = [], inner = [];
      for (let i = 0; i <= n; i++) { const v = i / n, th = th0 + (thN - th0) * v, tw = Math.pow(Math.sin(Math.PI * Math.min(1, v * (s.sw < 1 ? 1 : 1))), 0.75) * b.W * (s.sw < 1 ? 0.6 + 0.4 * v : 1), lead = s.sw < 1 ? 1 - v : 0;
        outer.push([H.sx(cx + Math.cos(th) * R), H.sy(cy + Math.sin(th) * R) - z - lead * 0]); inner.push([H.sx(cx + Math.cos(th) * (R - tw)), H.sy(cy + Math.sin(th) * (R - tw)) - z * (1 - 0.15 * tw)]); }
      return { outer, inner, cx, cy, R, th0, thN }; };
    H.X.sfx.whoosh(); me.sq = 0.65;
    const drawBlade = (c, b, s, T, t) => {
      const o = outline(b, s, T), pts = o.outer.concat(o.inner.slice().reverse()), A = s.a, gold = b.big;
      // ghosts of the blade where it was a moment ago (while it flies)
      if (s.fl > 0 && s.fl < 1) for (let g = 1; g <= 2; g++) { const sg = Object.assign({}, s, { d: DF * H.ease.out(cl((s.u - SW - FLY * 0.12 * g) / FLY)) }), og = outline(b, sg, T); K.ribbon(c, og.outer, T * 0.07, 0.25 * A / g, gold); }
      // the haze along it
      for (let i = 0; i < o.outer.length; i += 3) K.glow(c, o.outer[i][0], o.outer[i][1], T * 0.55 * (b.big ? 1.3 : 1), gold ? P.gold : P.blue, 0.32 * A);
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
      // the translucent body: violet fill, then a brighter cyan inner fill
      c.globalAlpha = 0.42 * A; c.fillStyle = gold ? P.amber : P.violet; H.poly(c, pts); c.fill();
      const mid = o.outer.map((p, i) => [(p[0] * 0.6 + o.inner[i][0] * 0.4), (p[1] * 0.6 + o.inner[i][1] * 0.4)]), ptsM = o.outer.concat(mid.slice().reverse());
      c.globalAlpha = 0.5 * A; c.fillStyle = gold ? P.gold : P.cyan; H.poly(c, ptsM); c.fill();
      // the stable outline: a soft blue band, a cyan edge and a white-hot rim on the cutting side; a thin violet back edge
      c.globalAlpha = 0.45 * A; c.strokeStyle = gold ? P.amber : P.blue; c.lineWidth = T * 0.14; H.poly(c, o.outer, false); c.stroke();
      c.globalAlpha = 0.95 * A; c.strokeStyle = gold ? P.gold : P.cyan; c.lineWidth = T * 0.06; c.stroke();
      c.globalAlpha = gold ? 0.7 * A : A; c.strokeStyle = gold ? '#FFF1C2' : P.white; c.lineWidth = Math.max(1.2, T * 0.025); c.stroke();
      c.globalAlpha = 0.7 * A; c.strokeStyle = gold ? P.gold : P.violet; c.lineWidth = 1.2; H.poly(c, o.inner, false); c.stroke();
      c.restore();
      // small arcs crawling across the face
      const na = b.big ? 4 : 3, n = o.outer.length - 1; for (let i = 0; i < na; i++) { const ph = (t * (1.2 + 0.3 * i) + i / na) % 1, k0 = Math.max(1, Math.min(n - 3, Math.floor(ph * n))), k1 = Math.min(n - 1, k0 + 2), p0 = o.outer[k0], p1 = o.inner[k1]; K.arc(c, p0[0], p0[1], p1[0] * 0.5 + o.outer[k1][0] * 0.5, p1[1] * 0.5 + o.outer[k1][1] * 0.5, K.seed(t, i + b.j * 5, 22), 1.2, 0.85 * A * Math.sin(ph * Math.PI), { forks: 1, jit: T * 0.12, gold }); }
      // the leading point while it sweeps
      if (s.sw < 1) { const p = o.outer[o.outer.length - 1]; K.glow(c, p[0], p[1], T * 0.7, P.white, 0.7 * A); K.glow(c, p[0], p[1], T * 0.3, P.cyan, A); }
      else { for (const p of [o.outer[0], o.outer[o.outer.length - 1]]) K.glow(c, p[0], p[1], T * 0.35, gold ? P.gold : P.ice, 0.6 * A); }
    };
    H.add({ life: END + 0.4,
      update(dt, f) {
        for (const b of blades) { const s = state(b, f.t); if (!s) continue; const cx = ox + dir[0] * s.d, cy = oy + dir[1] * s.d, R = b.R * s.grow, th = s.sw < 1 ? a - b.side * b.half + b.side * 2 * b.half * s.sw : a + (Math.random() - 0.5) * 2 * b.half;
          if (s.fade < 1 && Math.random() < (s.fade > 0 ? 1.5 : 0.8) * H.Q()) H.P({ kind: s.fade > 0 ? 'ember' : 'spark', x: cx + Math.cos(th) * R, y: cy + Math.sin(th) * R - 0.45, vx: dir[0] * 2 + (Math.random() - 0.5) * 2, vy: dir[1] * 2 - 0.8 - Math.random(), g: s.fade > 0 ? -0.5 : 3, drag: 1, life: 0.35, max: 0.35, size: 2, color: b.big && Math.random() < 0.5 ? P.gold : Math.random() < 0.4 ? P.white : P.cyan });
          if (!b.hit1 && s.u >= SW * 0.85) { b.hit1 = true; H.hitCone(ox, oy, a, b.R + 0.7, b.half + 0.15, b.dmg * 0.4, C.dmgO({ kb: 1.5 })); H.X.sfx.crack(); H.X.shake(2, 0.06); }
          if (!b.hit2 && s.u >= SW + FLY * 0.75) { b.hit2 = true; const n2 = H.hitCone(ox, oy, a, b.R * 1.3 + DF + 0.5, Math.min(1.0, b.half * 0.85), b.dmg * 0.6, C.dmgO({ kb: 2.5, stun: 0.22 })); const ex = ox + dir[0] * (b.R + DF), ey = oy + dir[1] * (b.R + DF);
            const arcPts = []; for (let i = 0; i <= 10; i++) { const th2 = a - b.half * 1.1 + 2.2 * b.half * i / 10; arcPts.push([ox + dir[0] * DF + Math.cos(th2) * b.R * 1.3, oy + dir[1] * DF + Math.sin(th2) * b.R * 1.3]); }
            marks.push({ x: ex, y: ey, t: f.t, r: 1.2, gold: b.big, pts: arcPts }); flare(ex, ey, 0.45, 1.2, b.big); H.X.sfx.crack(); if (n2) H.X.hitstop(0.02);
            if (b.big) { for (let i = 0; i < 9; i++) { const th2 = a - 1.1 + 2.2 * i / 8; H.P({ kind: 'spark', x: ex, y: ey - 0.45, vx: Math.cos(th2) * 9, vy: Math.sin(th2) * 9 * 0.7, g: 0, drag: 2.5, life: 0.4, max: 0.4, size: 2.6, color: i % 2 ? P.gold : P.white }); } K.goldSparks(ex, ey - 0.45, 14, 7); H.X.flash(0.05, P.gold); } } }
      },
      paint(c, f, T, t, under) {
        // a blade near you on your far side is drawn behind you; once it flies it is in front
        for (const b of blades) { const s = state(b, f.t); if (!s) continue; const back = dir[1] < -0.3 && s.d < 1.2; if (back !== under) continue; drawBlade(c, b, s, T, t);
          if (s.sw < 1) { // the swept fan: a faint sheet of light behind the leading edge
            const o = outline(b, s, T), X0 = H.sx(ox), Y0 = H.sy(oy) - 0.45 * T; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * s.a; c.fillStyle = b.big ? P.gold : P.cyan; c.beginPath(); const inn = o.outer.map(p => [X0 + (p[0] - X0) * 0.55, Y0 + (p[1] - Y0) * 0.55]); H.poly(c, o.outer.concat(inn.reverse())); c.fill(); c.restore(); } }
      },
      drawUnder(c, f, X, Y, T, t) {
        for (const b of blades) { const s = state(b, f.t); if (!s || s.fade > 0.6) continue; const cx = ox + dir[0] * (s.d + b.R * 0.9), cy = oy + dir[1] * (s.d + b.R * 0.9); K.floorLight(c, H.sx(cx), H.sy(cy), T * b.R * 1.4, 0.4 * s.a, b.big ? P.gold : P.blue); }
        drawMarks(c, marks, f.t, T); this.paint(c, f, T, t, true);
      },
      draw(c, f, X, Y, T, t) { this.paint(c, f, T, t, false); } });
    for (let j = 1; j < NB; j++) H.X.after(blades[j].t0, () => { H.X.sfx.whoosh(); me.sq = 0.7; });
  };

  /* ================= LI-S04 Thunderpin =================
     A slim faceted needle of lightning with a charged bead for a head falls on the aim in a streak and stands in the
     floor. Branching arcs crawl down its length, then it sends three short pulses rippling into the ground around it;
     at last it splits into vertical slivers of light that rise apart and vanish, leaving a violet impression.
     1 pin at Hatchling, 3 at Adept (two satellite pins), 5 at Celestial (four), joined there by a golden sigil, the last
     pulse golden. */
  S.thunderpin = (C, h) => {
    bind(h); const x = C.tx, y = C.ty, E = K.evo(C), CEL = E >= 7, NS = E >= 7 ? 4 : E >= 4 ? 2 : 0, FALL = 0.24, PUL = [0.58, 0.8, 1.02], SPLIT = 1.2, R = 1.9, RS = 1.0, me = H.me;
    const tot = C.base * 2.6 * C.K * K.evoK(C), mainK = NS ? 0.72 : 1, satK = NS ? (1 - mainK) / NS : 0;
    const pins = [{ x, y, s: 1, d: 0, main: true }]; const a0 = Math.atan2(y - me.y, x - me.x);
    for (let i = 0; i < NS; i++) { const b = a0 + Math.PI / 2 + i / NS * TAU + (NS === 2 ? 0 : Math.PI / 4); let px = x + Math.cos(b) * 1.45, py = y + Math.sin(b) * 1.0; if (H.X.blocked(px, py, 0.25, 0)) { px = x + Math.cos(b) * 0.8; py = y + Math.sin(b) * 0.6; } pins.push({ x: px, y: py, s: 0.7, d: 0.07 + i * 0.05, main: false }); }
    const marks = []; H.warn(x, y, R, FALL, C.col); H.X.sfx.hum();
    for (const p of pins) {
      H.X.after(FALL + p.d, () => { const dm = tot * (p.main ? mainK : satK); H.hitArea(p.x, p.y, p.main ? 0.95 : 0.7, dm * 0.25, C.dmgO({ kb: 1, stun: 0.3 })); flare(p.x, p.y, 0.2, p.main ? 1.2 : 0.8, CEL && p.main); marks.push({ x: p.x, y: p.y, t: F.t, r: p.main ? 1.1 : 0.7, pts: forkScar(p.x, p.y, p.main ? 1 : 0.6, p.x * 3) }); if (p.main) { H.X.shake(5, 0.12); H.X.sfx.crack(); H.X.hitstop(0.02); } });
      PUL.forEach((tp, i) => H.X.after(tp + p.d, () => { const dm = tot * (p.main ? mainK : satK) * 0.25, gold = CEL && i === 2; H.hitArea(p.x, p.y, p.main ? R : RS, dm, C.dmgO({ stun: 0.15 })); spray(p.x, p.y, 0.1, p.main ? 8 : 4, 5, gold); if (gold && p.main) K.goldSparks(p.x, p.y, 16, 7); H.X.light(p.x, p.y, (p.main ? R : RS) * 1.5, 0.15); if (p.main) { H.X.sfx.crack(); H.X.shake(2, 0.06); } }));
    }
    H.X.after(SPLIT, () => { for (const p of pins) K.motes(p.x, p.y - 1.2 * p.s, p.main ? 10 : 5); H.X.sfx.sparkle(); });
    /* where pin p stands in screen px, and how high its head is */
    const F = H.add({ life: SPLIT + 0.75, x, y,
      update(dt, f) { for (const p of pins) { const u = f.t - p.d; if (u > FALL && u < SPLIT) K.aura(p.x, p.y, 0.25, dt, p.main ? 12 : 6, 2.2 * p.s * Math.random()); } },
      pulseRing(c, p, T, t, gold) { const X = H.sx(p.x), Y = H.sy(p.y), r = (p.main ? R : RS);
        PUL.forEach((tp, i) => { const u = (F.t - tp - p.d) / 0.34; if (u <= 0 || u >= 1) return; const g = gold && i === 2; K.shockRing(c, X, Y, T * r * H.ease.out(u), (1 - u) * (p.main ? 1 : 0.7), t, p.main ? 3 : 0); if (g) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - u; c.strokeStyle = P.gold; c.lineWidth = 2.5; H.floorEllipse(c, X, Y, T * r * H.ease.out(u)); c.stroke(); c.restore(); }
          if (u < 0.6 && p.main) K.groundArcs(c, X, Y, T * r * H.ease.out(u) * 1.05, 4 + i, t, (1 - u / 0.6) * 0.8, i * 1.3);
          K.floorLight(c, X, Y, T * r * 1.3, 0.5 * (1 - u), g ? P.gold : P.blue); }); },
      drawPin(c, p, T, t) {
        const u = F.t - p.d, X = H.sx(p.x), Y = H.sy(p.y), s = p.s, hh = T * 2.3 * s, k = T * s / 72, spr = pinSprite(CEL && p.main), sw = spr.width * k * 1.5, sh = spr.height * k * (2.3 * 72 / 220) * 1.0;
        if (u < 0) return; const fall = cl(u / FALL), drop = (1 - H.ease.in(fall)) * T * 7, split = cl((u - SPLIT) / 0.5), top = Y - hh - drop;
        if (fall < 1) { // the falling streak
          const pts = []; for (let j = 0; j < 8; j++) pts.push([X, top - T * 3 * (1 - j / 7)]); K.ribbon(c, pts, T * 0.22 * s, 0.9 * fall); }
        const hk = split > 0 ? 1 - split : 1;
        if (split <= 0) {
          K.glow(c, X, Y - hh * 0.5 - drop, T * 1.3 * s, P.blue, 0.4);
          c.save(); c.globalAlpha = 0.95; c.drawImage(spr, X - sw / 2, top - T * 0.25 * s, sw, hh + T * 0.25 * s); c.restore();
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 30); c.drawImage(spr, X - sw / 2, top - T * 0.25 * s, sw, hh + T * 0.25 * s); c.restore();
          // arcs crawling down its length (a fresh wave from the head each 0.3 s once it has landed)
          if (fall >= 1) { const ph = ((u - FALL) / 0.3) % 1, na = p.main ? 3 : 2; for (let i = 0; i < na; i++) { const v0 = cl(ph - 0.2 + i * 0.08), v1 = cl(ph + 0.05 + i * 0.08), sd = i % 2 ? 1 : -1; K.arc(c, X + sd * T * 0.06 * s, top + hh * v0, X - sd * T * 0.14 * s, top + hh * v1, K.seed(t, i + (p.main ? 0 : 7), 24), 1.2 * s + 0.4, 0.9, { forks: 2, jit: T * 0.2 * s }); }
            // and down into the floor at its point
            if (u - FALL < 0.5) for (let i = 0; i < 3; i++) { const b = i / 3 * TAU + p.x, l = T * 0.8 * s; K.arc(c, X, Y, X + Math.cos(b) * l, Y + Math.sin(b) * l * H.GY, K.seed(t, i + 20, 20), 1, 0.8 * (1 - (u - FALL) / 0.5), { forks: 1 }); } }
          // its head: a charged bead, golden at Celestial
          bead(c, X, top - T * 0.2 * s, T * 0.17 * s * (1 + 0.12 * Math.sin(t * 20)), t, p.x, 1, CEL && p.main, fall >= 1 ? 0.3 : 0);
          if (CEL && p.main && fall >= 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = P.gold; c.globalAlpha = 0.8; c.lineWidth = 1.4; const hy = top - T * 0.2; for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + t * 0.8, l = T * (0.45 + 0.1 * Math.sin(t * 9 + i)); c.beginPath(); c.moveTo(X + Math.cos(b) * T * 0.22, hy + Math.sin(b) * T * 0.22); c.lineTo(X + Math.cos(b) * l, hy + Math.sin(b) * l); c.stroke(); } c.restore(); }
          if (u - FALL >= 0 && u - FALL < 0.14) K.glow(c, X, Y - T * 0.5, T * 1.5 * s, P.cyan, 0.45 * (1 - (u - FALL) / 0.14));
        } else {
          // the split: vertical slivers of the needle drift apart and rise, thinning to light
          const NSL = 4, e = H.ease.out(split); for (let i = 0; i < NSL; i++) { const sx = i / NSL * spr.width, sW = spr.width / NSL, ox = (i - (NSL - 1) / 2) * T * 0.38 * s * e, oy = -T * (0.6 + 0.5 * (i % 2)) * s * e; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = hk * 0.9; c.drawImage(spr, sx, 0, sW, spr.height, X - sw / 2 + sw * i / NSL + ox, top - T * 0.25 * s + oy, sw / NSL, (hh + T * 0.25 * s) * (1 - 0.3 * e)); c.restore();
            K.glow(c, X + ox + (i - 1.5) * sw / NSL, top + hh * 0.4 + oy, T * 0.5 * s, P.cyan, 0.5 * hk); }
          K.glow(c, X, top - T * 0.2 * s - T * e * s, T * 0.5 * s, CEL && p.main ? P.gold : P.ice, hk);
        }
        void hk;
      },
      drawUnder(c, f, X, Y, T, t) {
        const live = cl(f.t / FALL) * cl(1 - (f.t - SPLIT) / 0.4);
        // the Celestial sigil: a golden ring and lines joining the pins, brightening with each pulse
        if (CEL) { let b = 0.35; PUL.forEach(tp => { const u = (f.t - tp) / 0.3; if (u > 0 && u < 1) b += 0.6 * (1 - u); }); const al = live * b; if (al > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al; c.strokeStyle = P.gold; c.lineWidth = 1.6; H.floorEllipse(c, X, Y, T * 1.75); c.stroke(); c.strokeStyle = H.rgba(P.amber, 0.7); c.lineWidth = 1; H.floorEllipse(c, X, Y, T * 1.55); c.stroke(); const sat = pins.slice(1); c.beginPath(); for (let i = 0; i < sat.length; i++) { const p = sat[i], q = sat[(i + 2) % sat.length]; c.moveTo(H.sx(p.x), H.sy(p.y)); c.lineTo(H.sx(q.x), H.sy(q.y)); } c.stroke(); c.restore(); } }
        for (const p of pins) { const u = f.t - p.d; if (u > FALL * 0.5 && u < SPLIT + 0.3) K.floorLight(c, H.sx(p.x), H.sy(p.y), T * (p.main ? 1.3 : 0.8), 0.45 * cl(1 - (u - SPLIT) / 0.3), CEL && p.main ? P.gold : P.blue); this.pulseRing(c, p, T, t, CEL); }
        drawMarks(c, marks, f.t, T);
        // pins standing behind you on the screen are drawn behind you
        for (const p of pins) if (p.y < me.y && Math.abs(p.x - me.x) < 1.2 && me.y - p.y < 3) this.drawPin(c, p, T, t);
      },
      draw(c, f, X, Y, T, t) { for (const p of pins) if (!(p.y < me.y && Math.abs(p.x - me.x) < 1.2 && me.y - p.y < 3)) this.drawPin(c, p, T, t); } });
  };

  /* ================= LI-S05 Railflash =================
     Two parallel rails of light draw themselves out along the aimed corridor from your feet, studded with charged nodes
     that crackle across to each other. A concentrated bolt races between them, its white-hot head trailing plasma,
     flaring the rails as it passes and piercing each monster with a sharp flash as it reaches it; a moment later sparks
     chase along its route; then the rails break into motes and only a violet line fades on the floor.
     1 bolt at Hatchling, 2 at Adept, 3 at Celestial, where golden accelerator rings stand over the rails and the last
     bolt runs gold and bursts at the end. */
  S.railflash = (C, h) => {
    bind(h); const me = H.me, a = C.a, E = K.evo(C), CEL = E >= 7, NBo = E >= 7 ? 3 : E >= 4 ? 2 : 1, dir = [Math.cos(a), Math.sin(a)], per = [-dir[1], dir[0]];
    const x0 = me.x + dir[0] * 0.6, y0 = me.y + dir[1] * 0.6, L = reach(x0, y0, a, 7.5, 0.25), W = 0.55, RAIL = 0.26, RUN = 0.14, GAPB = 0.2, Z = 0.42, behind = dir[1] < -0.35;
    const tot = C.base * 2.5 * C.K * K.evoK(C), perBolt = tot / NBo, marks = [];
    const bolts = []; for (let j = 0; j < NBo; j++) bolts.push({ j, t0: RAIL + j * GAPB, gold: CEL && j === NBo - 1, w: 1 + 0.15 * j });
    const END = bolts[NBo - 1].t0 + RUN, NODES = Math.max(3, Math.round(L / 1.1)), RINGS = CEL ? [0.3, 0.55, 0.8] : [];
    const W2 = (d, s) => [x0 + dir[0] * d + per[0] * s, y0 + dir[1] * d + per[1] * s];
    H.X.sfx.hum(); me.sq = 0.7;
    for (const bo of bolts) H.X.after(bo.t0, () => {
      // every monster in the corridor is struck when the head reaches it
      for (const m of H.living()) { const rx = m.x - x0, ry = m.y - y0, al = rx * dir[0] + ry * dir[1], of = Math.abs(-rx * dir[1] + ry * dir[0]); if (al > -m.r && al < L + m.r && of < W + 0.2 + m.r) H.X.after(RUN * cl(al / L), () => { if (m.dead) return; H.X.hitMon(m, perBolt, C.dmgO({ kb: bo.j === NBo - 1 ? 3 : 1, stun: 0.25 })); flare(m.x, m.y, Z, 0.9, bo.gold); H.X.hitstop(0.015); }); }
      H.X.sfx.crack(); H.X.shake(bo.j === NBo - 1 ? 5 : 3, 0.12); H.X.flash(0.05, bo.gold ? P.gold : P.ice);
      H.X.after(RUN, () => { const e = W2(L, 0); flare(e[0], e[1], Z, 1, bo.gold); if (bo.gold) { K.goldSparks(e[0], e[1] - Z, 20, 8); H.X.flash(0.06, P.gold); } marks.push({ x: e[0], y: e[1], t: F.t, r: bo.gold ? 1.4 : 0.9, gold: bo.gold, pts: [W2(0, 0), W2(L * 0.5, 0.05), W2(L, 0)] }); });
    });
    const F = H.add({ life: END + 0.95,
      update(dt, f) {
        // residual sparks chasing the bolt's route a moment after it
        for (const bo of bolts) { const u = (f.t - bo.t0 - 0.1) / 0.4; if (u > 0 && u < 1) for (let i = 0; i < H.n(3); i++) { const d = L * cl(u * 1.2 - Math.random() * 0.25), p = W2(d, (Math.random() - 0.5) * W * 1.6); H.P({ kind: 'spark', x: p[0], y: p[1] - Z * Math.random(), vx: dir[0] * 7 + (Math.random() - 0.5) * 2, vy: dir[1] * 7 - 0.5 - Math.random(), g: 3, drag: 3, life: 0.3, max: 0.3, size: 1.8, color: bo.gold && i % 2 ? P.gold : i % 2 ? P.ice : P.cyan }); } }
        const fade = (f.t - END) / 0.5; if (fade > 0 && fade < 1) for (let i = 0; i < H.n(2); i++) { const s = Math.random() < 0.5 ? -W : W, p = W2(Math.random() * L, s); H.P({ kind: 'ember', x: p[0], y: p[1] - 0.1, vx: 0, vy: -1, g: -0.5, drag: 1, life: 0.5, max: 0.5, size: 2.2, color: Math.random() < 0.5 ? P.cyan : P.violet }); }
      },
      rails(c, f, T, t) {
        const grow = H.ease.out(cl(f.t / RAIL)), k = cl(1 - (f.t - END) / 0.45), A = k * cl(f.t / 0.08); if (A <= 0.01) return; const Lg = L * grow;
        for (const s of [-1, 1]) { const p0 = W2(0, s * W), p1 = W2(Lg, s * W), X0 = H.sx(p0[0]), Y0 = H.sy(p0[1]) - 0.08 * T, X1 = H.sx(p1[0]), Y1 = H.sy(p1[1]) - 0.08 * T;
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = 0.35 * A; c.strokeStyle = P.violet; c.lineWidth = T * 0.16; c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X1, Y1); c.stroke();
          c.globalAlpha = 0.7 * A; c.strokeStyle = P.blue; c.lineWidth = T * 0.07; c.stroke(); c.globalAlpha = A; c.strokeStyle = P.ice; c.lineWidth = Math.max(1, T * 0.025); c.stroke(); c.restore();
          if (grow < 1) K.glow(c, X1, Y1, T * 0.5, P.white, 0.9 * A); }
        // the nodes along the rails and the arcs that crackle between them
        for (let i = 0; i <= NODES; i++) { const d = L * i / NODES; if (d > Lg) break; for (const s of [-1, 1]) { const p = W2(d, s * W); K.glow(c, H.sx(p[0]), H.sy(p[1]) - 0.08 * T, T * 0.28, P.cyan, 0.7 * A); }
          if (K.R1(K.seed(t, i, 12)) < 0.45) { const p = W2(d, -W), q = W2(d, W); K.arc(c, H.sx(p[0]), H.sy(p[1]) - 0.08 * T, H.sx(q[0]), H.sy(q[1]) - 0.08 * T, K.seed(t, i + 5, 20), 0.9, 0.6 * A, { forks: 0, jit: T * 0.12 }); } }
        // the flare that runs along the rails with each bolt
        for (const bo of bolts) { const u = (f.t - bo.t0) / RUN; if (u <= 0 || u > 1.6) continue; const d = L * cl(u), fl = u > 1 ? 1 - (u - 1) / 0.6 : 1; for (const s of [-1, 1]) { const p = W2(d, s * W); K.glow(c, H.sx(p[0]), H.sy(p[1]), T * 0.6, bo.gold ? P.gold : P.cyan, 0.6 * fl); }
          K.floorLight(c, H.sx(W2(d, 0)[0]), H.sy(W2(d, 0)[1]), T * 1.3, 0.7 * fl, bo.gold ? P.gold : P.blue); }
      },
      boltFx(c, f, T, t) {
        for (const bo of bolts) { const u = (f.t - bo.t0) / RUN; if (u <= 0 || u > 1 + 0.22 / RUN) continue; const d = L * cl(u), a2 = u <= 1 ? 1 : 1 - (u - 1) * RUN / 0.22, s0 = W2(0, 0), hd = W2(d, 0), X0 = H.sx(s0[0]), Y0 = H.sy(s0[1]) - Z * T, Xh = H.sx(hd[0]), Yh = H.sy(hd[1]) - Z * T;
          K.arc(c, X0, Y0, Xh, Yh, K.seed(t, bo.j + 3, 24), 3 * bo.w, a2 * 0.9, { forks: 4, jit: T * 0.2, gold: bo.gold });
          if (u <= 1) { const tr = []; for (let i = 0; i <= 8; i++) { const p = W2(Math.max(0, d - L * 0.35 * (1 - i / 8)), 0); tr.push([H.sx(p[0]), H.sy(p[1]) - Z * T]); } K.ribbon(c, tr, T * 0.22 * bo.w, 0.9, bo.gold); K.glow(c, Xh, Yh, T * 0.75, bo.gold ? P.gold : P.cyan, 0.6); K.glow(c, Xh, Yh, T * 0.22, P.white, 0.9); }
          else if (u < 1 + 0.12 / RUN) K.glow(c, Xh, Yh, T * 1.1, bo.gold ? P.gold : P.cyan, 0.55 * a2); }
        // the Celestial accelerator rings, standing over the rails, pulsing as each bolt goes through
        for (const r of RINGS) { const d = L * r, p = W2(d, 0), X = H.sx(p[0]), Y = H.sy(p[1]) - Z * T, app = H.ease.back(cl((f.t - 0.05 - r * 0.2) / 0.25)), k = cl(1 - (f.t - END) / 0.45); if (app <= 0 || k <= 0) continue; let pu = 0; for (const bo of bolts) { const v = (f.t - bo.t0 - RUN * r) / 0.2; if (v > 0 && v < 1) pu = Math.max(pu, 1 - v); }
          // a hoop standing across the corridor: in the plane of the floor's sideways direction and of up
          const Rr = (W + 0.25) * T * app, pts = []; for (let i = 0; i <= 24; i++) { const th = i / 24 * TAU; pts.push([X + per[0] * Math.cos(th) * Rr + dir[0] * Math.sin(th) * Rr * 0.38, Y + per[1] * Math.cos(th) * Rr * H.GY - Math.sin(th) * Rr * 0.75]); }
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.globalAlpha = (0.5 + 0.5 * pu) * k; c.strokeStyle = P.amber; c.lineWidth = T * 0.055 * (1 + pu); H.poly(c, pts); c.stroke(); c.strokeStyle = P.gold; c.lineWidth = T * 0.025; c.stroke(); c.globalAlpha = k * 0.9; c.strokeStyle = P.white; c.lineWidth = 1; c.stroke(); c.restore();
          for (let i = 0; i < 4; i++) { const p = pts[(i * 6 + Math.floor(t * 30)) % 24]; K.glow(c, p[0], p[1], T * 0.22, P.gold, 0.8 * k); }
          K.glow(c, X, Y, T * (0.5 + 0.5 * pu), P.gold, (0.15 + 0.35 * pu) * k); }
      },
      drawUnder(c, f, X, Y, T, t) {
        const k = cl(1 - (f.t - END) / 0.45); K.floorLight(c, H.sx(W2(L * 0.5, 0)[0]), H.sy(W2(L * 0.5, 0)[1]), T * L * 0.45, 0.22 * k * cl(f.t / RAIL), P.blue);
        drawMarks(c, marks, f.t, T); this.rails(c, f, T, t); if (behind) this.boltFx(c, f, T, t);
      },
      draw(c, f, X, Y, T, t) { if (!behind) this.boltFx(c, f, T, t); } });
  };
})();
