/* ---------- v474 LE: the Library's trial pieces and its boss arenas' standing pieces, painted (20zb3's LIB_PROPS) ----------
   The trials (20za, LIB_STAGES): their pieces are painted pictures (BELPROPS.kit in the land's light) and their marks are the GPU
   painter's light; each piece's rule, place, timing and label stay 20za's, which calls LIB_PROPS.stage.* (false / null: it draws
   its old 2D, as it does whenever the painter or the GPU is off):
     the Catalogue of Truth: the pedestal (a carved plinth holding an open book with the gold eye) rising; the four banners (velvet
       on a gilt pole and crossbar, the icon embroidered in gold on their faces, a gold "?" on their backs), turning as they flip;
       the plates to step on, the eye's mark while it shows and the picked banner's mark as rings of light (no dashed ellipse);
       the passage's two leather-bound leaves sliding apart.
     the Unfinished Fable: the lecterns (painted wood), the stone pages (tablets of parchment stone, their pictures carved), the
       empty slots as soft light, the steps before the lecterns (gilt-ringed stone), the gold line lighting between lecterns in
       order (a beam of script light), the binding press's two leaves sliding apart.
     the False Procession: the rest circles (stone daises ringed in gold, lit when live or woken), the floating books (painted, their
       page wings flapping), the truth marks (a pool of gold light / a violet flicker), the way ahead and the leading circle as
       light, the monsters at the books marked by a rose glow (no red ring).
   The arenas (FIEND_DEFS.syllax / vellum / nhalex .drawProp wrapped at run time; the boss files untouched):
     Syllax: the fifteen bookcases, the candelabras and the stacks: the lands' painted props.
     Vellum: the four lecterns: the painted lectern (a dark-stained one when its page is lost), the page and everything the fight
       does to it (its glow, the stain creeping over it, the drowning, its ghost and the ring as it comes back) drawn over as before.
     Nhalex: the eight great books: painted (block, top, cover tooled in gilt with the fight's sigils); as one opens, its cover
       swings back on its spine over the painted pages, their light the GPU's.
   Without the painter (or window.__LIBP = 0) each wrapper hands back to the old art. */
(() => {
  const A = typeof LIB_PROPS !== 'undefined' ? LIB_PROPS : null; if (!A) return;
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined', DEF = A.DEF, X2 = A.kitx, XK = () => window.YUG_PROPS.kitx, clamp = (v, a, b) => v < a ? a : v > b ? b : v, md = (a, n) => ((a % n) + n) % n;
  const on = () => !(HAS_W && (window.__LIBP === 0 || window.__BELP === 0)) && HAS_W && window.BELPROPS && window.BELPROPS.kit && window.YUG_PROPS;
  const GOLD = '#E8C36A', GOLD_HI = '#FFF0B8', VIOLET_HI = '#CDB4FF', ROSE = '#FF8FB4';
  const VELVET = [0.36, 0.06, 0.15], INKVEL = [0.07, 0.06, 0.14], BOOKC = { 0: [0.36, 0.08, 0.16], 1: [0.1, 0.13, 0.26], 2: [0.12, 0.22, 0.14], 3: [0.3, 0.08, 0.14], 4: [0.2, 0.14, 0.32], 5: [0.42, 0.28, 0.08], 6: [0.24, 0.07, 0.15], 7: [0.08, 0.22, 0.22] };
  // the trials' icons (20za's: the eye, the moon, the crown, the key; the egg, the hatchling, the winged adult, the empty shell)
  function icon(c, k, s) { c.beginPath();
    if (k === 0) { c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * 0.85, s, 0); c.quadraticCurveTo(0, s * 0.85, -s, 0); c.closePath(); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill(); }
    else if (k === 1) { c.arc(0, 0, s * 0.8, 0.6, TAU - 0.6); c.arc(s * 0.38, 0, s * 0.62, TAU - 0.9, 0.9, true); c.closePath(); c.fill(); }
    else if (k === 2) { c.moveTo(-s * 0.85, s * 0.5); c.lineTo(-s * 0.85, -s * 0.35); c.lineTo(-s * 0.42, s * 0.05); c.lineTo(0, -s * 0.6); c.lineTo(s * 0.42, s * 0.05); c.lineTo(s * 0.85, -s * 0.35); c.lineTo(s * 0.85, s * 0.5); c.closePath(); c.fill(); }
    else if (k === 3) { c.arc(-s * 0.45, 0, s * 0.38, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-s * 0.07, 0); c.lineTo(s * 0.9, 0); c.moveTo(s * 0.55, 0); c.lineTo(s * 0.55, s * 0.35); c.moveTo(s * 0.85, 0); c.lineTo(s * 0.85, s * 0.28); c.stroke(); }
    else if (k === 4) { c.font = `900 ${s * 2}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, s * 0.05); }
    else if (k === 5) { c.ellipse(0, 0, s * 0.55, s * 0.72, 0, 0, TAU); c.fill(); }
    else if (k === 6) { c.moveTo(-s * 0.6, 0); c.lineTo(-s * 0.35, -s * 0.2); c.lineTo(-s * 0.15, s * 0.05); c.lineTo(s * 0.1, -s * 0.22); c.lineTo(s * 0.32, s * 0.02); c.lineTo(s * 0.6, -s * 0.15); c.quadraticCurveTo(s * 0.6, s * 0.7, 0, s * 0.7); c.quadraticCurveTo(-s * 0.6, s * 0.7, -s * 0.6, 0); c.fill(); c.beginPath(); c.arc(0, -s * 0.35, s * 0.3, 0, TAU); c.fill(); }
    else if (k === 7) { c.ellipse(0, s * 0.1, s * 0.3, s * 0.42, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(0, -s * 0.45, s * 0.22, 0, TAU); c.fill(); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * s * 0.2, -s * 0.1); c.quadraticCurveTo(sd * s * 0.9, -s * 0.8, sd * s * 0.95, -s * 0.1); c.quadraticCurveTo(sd * s * 0.6, -s * 0.2, sd * s * 0.25, s * 0.15); c.closePath(); c.fill(); } }
    else { c.moveTo(-s * 0.6, -s * 0.05); c.lineTo(-s * 0.4, -s * 0.3); c.lineTo(-s * 0.2, -s * 0.05); c.lineTo(0, -s * 0.32); c.lineTo(s * 0.2, -s * 0.05); c.lineTo(s * 0.4, -s * 0.3); c.lineTo(s * 0.6, -s * 0.05); c.quadraticCurveTo(s * 0.6, s * 0.6, 0, s * 0.6); c.quadraticCurveTo(-s * 0.6, s * 0.6, -s * 0.6, -s * 0.05); c.closePath(); c.stroke(); } }
  // an icon worked in gold thread / carved: a dark bed, the gold, a lit edge
  function emboss(c, k, x, y, s, gold) { c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s * 0.2;
    c.save(); c.translate(s * 0.05, s * 0.06); c.fillStyle = c.strokeStyle = 'rgba(10,4,12,.55)'; icon(c, k, s); c.restore();
    const g = c.createLinearGradient(-s, -s, s, s); g.addColorStop(0, gold ? '#FFF3C4' : '#F4E6C8'); g.addColorStop(0.5, gold ? '#E2B04A' : '#9A8460'); g.addColorStop(1, gold ? '#8A6420' : '#5A4A34'); c.fillStyle = c.strokeStyle = g; icon(c, k, s); c.restore(); }
  Object.assign(DEF, {
    /* the Catalogue's pedestal: a carved plinth with gilt mouldings and an inlaid panel, a slanted top holding an open book whose
       pages bear the gold eye */
    lpedestal: { box: () => [-1.3, -2.0, 1.3, 0.5], vs: [0], paint(K, S, v, L) { const X = XK(), sd = 901, c = S.c; X2.contact(K, S, 1.1, 0.4, 0.5);
      K.rbox(S, 0, 0.06, 0.62, 0.42, 0, 0.16, 0.04, (f, u, vv) => X2.woodM(K, u * 2, vv * 3, sd, L, { tone: 0.85 })); S.unlock();
      K.rbox(S, 0, 0.02, 0.45, 0.32, 0.16, 0.95, 0.04, (f, u, vv) => { X2.woodM(K, u * 2, vv * 2, sd + 1, L); if (f === 'f') { const dx = Math.abs(u) - 0.3, dz = Math.abs(vv - 0.56) - 0.3; if (Math.abs(Math.max(dx, dz)) < 0.02) X2.metalM(K, u * 4, vv * 4, sd, L, 0.4); else if (Math.max(dx, dz) < 0) K.M.ao *= 0.85; if (vv < 0.22 || vv > 0.88) X2.metalM(K, u * 4, vv * 4, sd, L, 0.3); } }); S.unlock();
      X.plate(K, S, [[-1.0, -0.98], [1.0, -0.98], [0.85, -1.3], [-0.85, -1.3]], [0, 0.55, 0.84], 0.035, (x, y) => X2.woodM(K, x * 2, y * 2, sd + 2, L)); S.unlock();
      for (const s2 of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10; pts.push([s2 * a * 0.95, -1.24 - Math.sin(a * Math.PI * 0.85) * 0.2 + a * 0.06]); } for (let i = 10; i >= 0; i--) { const a = i / 10; pts.push([s2 * a * 0.9, -1.06 - Math.sin(a * Math.PI * 0.85) * 0.1 + a * 0.08]); }
        X.plate(K, S, pts, [s2 * 0.18, 0.6, 0.78], 0.02, (x, y) => { X2.parchM(K, x * 3, y * 3, sd + s2, L === 'holy'); K.M.ao *= 0.75 + 0.25 * Math.min(1, Math.abs(x) / 0.15); }); } S.unlock();
      c.save(); c.translate(-0.45, -1.26); c.scale(1, 0.5); c.fillStyle = c.strokeStyle = 'rgba(107,50,79,.9)'; c.lineWidth = 0.05; icon(c, 0, 0.26); c.restore();
      K.ink(S, X2.INK[L], 0.42); } },
    /* a banner of the Catalogue's shuffle: a gilt pole and crossbar, a velvet banner (burgundy on its face with its icon worked in
       gold, ink-dark on its back with a gold "?"), a gilt border, its folds shaded; v 0..3 the faces, 4 the back */
    lbanner: { box: () => [-1.05, -3.15, 1.05, 0.3], vs: [0, 1, 2, 3, 4], paint(K, S, v, L) { const X = XK(), sd = 911 + v, c = S.c, back = v === 4, h = 2.6, w = 0.85; X2.contact(K, S, 0.9, 0.3, 0.45);
      K.rev(S, 0, 0, hh => 0.12 - hh * 0.3, 0, 0.14, { mat: (u, hh) => X2.metalM(K, u * 3, hh * 4, sd, L, 0.4), top: true, capMat: () => X2.metalM(K, 0, 0, sd, L, 0.5) }); S.unlock();
      K.tube(S, [[0, -0.1], [0, -h - 0.32]], 0.04, 0.035, (t, s2) => X2.metalM(K, t * 6, s2, sd, L, 0.4)); S.unlock();
      const pts = [[-w, -h], [w, -h], [w, -0.6], [0, -0.18], [-w, -0.6]];
      X.plate(K, S, pts, [0, 0.95, 0.3], 0.05, (x, y, ao, e, d) => { const fold = Math.cos(x * 9.5 + 0.4 * Math.sin(y * 2)), col = back ? INKVEL : VELVET, M = K.M; M.r = col[0] * (0.82 + 0.25 * fold); M.g = col[1] * (0.82 + 0.25 * fold); M.b = col[2] * (0.82 + 0.25 * fold); M.rg = 0.75; M.sh = 0.9; M.ao *= 0.78 + 0.22 * fold;
        if (d < 0.09 && d > 0.025) X2.metalM(K, x * 6, y * 6, sd, L, 0.4); else if (d < 0.025) { M.r *= 0.7; M.g *= 0.7; M.b *= 0.7; } }); S.unlock();
      K.tube(S, [[-w - 0.1, -h - 0.06], [w + 0.1, -h - 0.06]], 0.05, 0.05, (t, s2) => X2.metalM(K, t * 8, s2, sd + 1, L, 0.5)); S.unlock();
      for (const s2 of [-1, 1]) K.ball(S, s2 * (w + 0.13), -h - 0.06, 0.07, 0.07, (dx, dy) => X2.metalM(K, dx, dy, sd, L, 0.6)); K.ball(S, 0, -h - 0.36, 0.08, 0.08, (dx, dy) => X2.metalM(K, dx, dy, sd, L, 0.6)); S.unlock();
      emboss(c, v, 0, -h * 0.55, 0.42, true); K.ink(S, X2.INK[L], 0.42); } },
    /* a leaf of a trial's passage: the Catalogue's leather-bound door (burgundy, a gilt frame, studs, a page edge where it meets
       the other) or the Fable's binding press (stained dark wood, iron bands, a violet-gold rule); 3.5 x 2.4 tiles */
    lleaf: { box: () => [0, -2.45, 3.55, 0.06], vs: [0, 1], paint(K, S, v, L) { const sd = 921 + v;
      K.rbox(S, 1.75, 0, 1.72, 0.12, 0, 2.4, 0.06, (f, u, vv) => { const x = u, edge = Math.min(1.72 - Math.abs(x), Math.abs(vv - 1.2) > 1.1 ? 0 : 1.2 - Math.abs(vv - 1.2)), M = K.M;
        if (v === 0) { X2.leatherM(K, u * 3, vv * 3, sd, [0.36, 0.07, 0.15], 0); if (Math.abs(edge - 0.18) < 0.03 || Math.abs(edge - 0.26) < 0.015) X2.metalM(K, u * 4, vv * 4, sd, L, 0.4); else if (u > 1.57) X2.parchM(K, u * 3, vv * 40, sd, false); }
        else { X2.woodM(K, u * 1.5, vv * 1.5, sd, 'cat', { tone: 0.55 }); if (Math.abs(vv - 0.4) < 0.07 || Math.abs(vv - 2.0) < 0.07) { M.mt = 0.85; M.fr = 0.22; M.fg = 0.22; M.fb = 0.26; M.rg = 0.4; } else if (Math.abs(edge - 0.2) < 0.02) X2.metalM(K, u * 4, vv * 4, sd, L, 0.4); } }); S.unlock();
      const st = []; for (const x of [0.25, 1.75, 3.25]) for (const z of [0.25, 1.2, 2.15]) st.push([x, -z - 0.04]); for (const [x, y] of st) K.ball(S, x, y, 0.06, 0.06, (dx, dy) => X2.metalM(K, dx, dy, sd, L, 0.6)); S.unlock();
      K.ink(S, X2.INK[L], 0.4); } },
    /* the Fable's stone page: a tablet of pale parchment-stone, bevelled, its picture carved in it (v 0 egg, 1 hatchling, 2 winged
       adult, 3 the empty shell) */
    lstone: { box: () => [-0.72, -1.42, 0.72, 0.1], vs: [0, 1, 2, 3], paint(K, S, v, L) { const sd = 931 + v, c = S.c;
      K.rbox(S, 0, 0, 0.64, 0.08, 0, 1.32, 0.06, (f, u, vv) => { X2.parchM(K, u * 2, vv * 2, sd, false); const M = K.M; M.r *= 0.92; M.g *= 0.9; M.b *= 0.86; M.rg = 0.7; const e = Math.min(0.64 - Math.abs(u), Math.abs(vv - 0.66) > 0.6 ? 0 : 0.66 - Math.abs(vv - 0.66)); if (Math.abs(e - 0.07) < 0.012) M.ao *= 0.6; }); S.unlock();
      emboss(c, 5 + v, 0, -0.68, 0.36, false); K.ink(S, X2.INK[L], 0.4); } },
    /* a gilt-ringed stone step (before a lectern, the Procession's rest circle: v 1 larger, two rings and a star inlaid) */
    lstep: { box: v => v ? [-1.3, -0.6, 1.3, 0.55] : [-0.75, -0.35, 0.75, 0.32], vs: [0, 1], paint(K, S, v, L) { const X = XK(), sd = 941 + v, rx = v ? 1.15 : 0.62, ry = rx * 0.38;
      X.disc(K, S, 0, 0, rx, ry, (dx, dy, r) => { X2.marbleL(K, dx * 2, dy * 2, sd, L); if (Math.abs(r - 0.86) < 0.045 || (v && Math.abs(r - 0.62) < 0.03)) X2.metalM(K, dx * 4, dy * 4, sd, L, 0.4); else if (v && r < 0.4) { const a = Math.atan2(dy, dx), st = Math.abs(md(a / TAU * 8, 1) - 0.5) * 2; if (r < 0.12 + 0.26 * (1 - st)) X2.metalM(K, dx * 4, dy * 4, sd, L, 0.5); } }, { bv: 0.12, dome: 0.05 }); S.unlock();
      K.ink(S, X2.INK[L], 0.35); } },
    /* a book of the Procession: a closed book floating, burgundy (or its own colour) with a gilt edge and the page block at its side */
    lpbook: { box: () => [-0.42, -0.5, 0.42, 0.06], vs: [0], paint(K, S, v, L) { const sd = 951;
      K.rbox(S, 0, 0, 0.3, 0.06, 0, 0.48, 0.04, (f, u, vv) => { if (f === 'f' && u > 0.21) { X2.parchM(K, u * 3, vv * 40, sd, false); return; } X2.leatherM(K, u * 4, vv * 4, sd, [0.36, 0.08, 0.16], 0); if (vv > 0.43 || Math.abs(Math.abs(u) - 0.17) < 0.015 && vv > 0.08 && vv < 0.4) X2.metalM(K, u * 4, vv * 4, sd, L, 0.4); }); S.unlock();
      K.ink(S, X2.INK[L], 0.4); } },
    /* the Procession's page wing (one side; the other mirrored), cream parchment curling */
    lwing: { box: () => [0.15, -0.5, 0.8, 0.2], vs: [0], paint(K, S, v, L) { const X = XK(), sd = 961;
      X.plate(K, S, [[0.25, -0.05], [0.45, -0.3], [0.7, -0.38], [0.7, -0.05], [0.5, 0.05], [0.25, 0.08]], [0.1, 0.9, 0.4], 0.02, (x, y) => { X2.parchM(K, x * 4, y * 4, sd, false); if (Math.abs(md((x - 0.25) * 12, 1) - 0.5) < 0.06) K.M.ao *= 0.85; }); S.unlock(); K.ink(S, X2.INK[L], 0.4); } },
  });
  // (the Fable's lecterns are the land's lectern without its book: DEF.lectern v 2)
  DEF.lslot = { box: DEF.lectern.box, vs: [0], paint(K, S, v, L) { DEF.lectern.paint(K, S, 2, L); } };
  A.PIECES_OF.push([/Catalogue of Truth/, [['lpedestal', 0], ['lbanner', 0], ['lbanner', 1], ['lbanner', 2], ['lbanner', 3], ['lbanner', 4], ['lleaf', 0]]],
    [/Unfinished Fable/, [['lslot', 0], ['lstone', 0], ['lstone', 1], ['lstone', 2], ['lstone', 3], ['lstep', 0], ['lleaf', 1]]], [/False Procession/, [['lstep', 1], ['lpbook', 0], ['lwing', 0]]]);

  /* ======================= the trials' parts (20za calls these; false: it draws its old 2D) ======================= */
  const ql = A.ql, qo = A.qo, P = (c, n, v, x, y, T, o) => A.piece(c, n, v, x, y, T, o);
  const ST = {
    // the pedestal rising (k 0..1: clipped at the floor, fading in), the eye's glow while it waits
    pedestal(c, Xs, Ys, T, k, live, t) { c.save(); c.globalAlpha *= Math.min(1, k * 1.5); c.beginPath(); c.rect(Xs - T * 2, Ys - T * 3, T * 4, T * 3 + T * 0.4); c.clip(); const ok = P(c, 'lpedestal', 0, Xs, Ys + (1 - k) * T * 1.4, T); c.restore(); if (!ok) return false;
      qo('glow', Xs - T * 0.45, Ys - T * 1.26 + (1 - k) * T * 1.4, T * (live ? 1.1 : 0.7), GOLD, (live ? 0.4 + 0.25 * Math.sin(t * 5) : 0.18) * k); if (live) ql('glow', Xs, Ys + T * 0.1, T * 1.4, GOLD, 0.2 + 0.1 * Math.sin(t * 5), 0.45); return true; },
    // a banner (b.face 0..1 its turn: squeezed through its edge as it flips), the eye's light on its face
    banner(c, b, Xs, Ys, sc, T, t) { const f = b.face, face = f > 0.5, kx = Math.max(0.06, Math.abs(f * 2 - 1)), v = face ? ['eye', 'moon', 'crown', 'key'].indexOf(b.k) : 4; if (v < 0) return false;
      if (!P(c, 'lbanner', v, Xs, Ys, T * sc, { sx: kx })) return false; if (face && b.k === 'eye') qo('glow', Xs, Ys - T * sc * 1.43, T * 1.2 * sc, GOLD, 0.35 * kx); return true; },
    // a plate to step on, a mark round a banner: rings of light (no dashed ellipse)
    plate(Xs, Ys, T, t, i) { ql('ring', Xs, Ys, T * 0.72, GOLD_HI, 0.45 + 0.2 * Math.sin(t * 6 + i), T * 0.22, 0.42); ql('glow', Xs, Ys, T * 0.9, GOLD, 0.2, 0.42); },
    ring(Xs, Ys, T, t, col, a) { ql('ring', Xs, Ys, T * 1.1, col || '#FFFFFF', a == null ? 0.55 : a, T * 0.24, 0.42); qo('glow', Xs, Ys - T * 1.2, T * 1.6, col || '#FFFFFF', 0.12); },
    // a passage's two leaves (v 0 the Catalogue's, 1 the Fable's press) sliding apart by sh px, clipped to its opening
    leaves(c, v, X0, X1, Y0, Y1, sh) { const s = A.pic(c, 'lleaf', v, (Y1 - Y0) / 2.4, (A.live && A.live.L) || 'cat'); if (!s) return false; const w = (X1 - X0) / 2, k = (Y1 - Y0) / 2.4 / s.P;
      c.save(); c.beginPath(); c.rect(X0, Y0 - 4, X1 - X0, Y1 - Y0 + 8); c.clip();
      c.drawImage(s.cv, X0 - sh, Y1 - s.ay * k, w, s.cv.height * k); c.save(); c.translate(X0 + w * 2 + sh, 0); c.scale(-1, 1); c.drawImage(s.cv, 0, Y1 - s.ay * k, w, s.cv.height * k); c.restore(); c.restore(); return true; },
    lectern(c, Xs, Ys, T, sc) { return P(c, 'lslot', 0, Xs, Ys, T * sc); },
    stone(c, kind, Xs, Ys, T, glow) { const v = ['egg', 'hatch', 'adult', 'shell'].indexOf(kind); if (v < 0 || !P(c, 'lstone', v, Xs, Ys, T)) return false; if (glow) qo('glow', Xs, Ys - T * 0.7, T * 1.0, GOLD, 0.25 * glow); return true; },
    slot(Xs, Ys, T, t, side) { ql('glow', Xs, Ys, T * 0.9, side ? VIOLET_HI : GOLD_HI, 0.22 + 0.1 * Math.sin(t * 4), 0.6); },
    step(c, Xs, Ys, T, side, t) { if (!P(c, 'lstep', 0, Xs, Ys, T)) return false; ql('glow', Xs, Ys, T * 0.7, side ? VIOLET_HI : GOLD, 0.12 + 0.05 * Math.sin(t * 3), 0.45); return true; },
    // the line under two lecterns in order: a beam of running script light (LE-FX 623)
    line(ax, bx, y, T, ok) { if (!ok) return; const dx = (bx - ax) / 2; qo('quad', 623, ax + dx, y, dx, 0, 0, T * 0.35, GOLD_HI, 0.9, 3, 1, 0); ql('glow', ax + dx, y, Math.abs(dx) * 1.1, GOLD, 0.12, 0.3); },
    marker(c, Xs, Ys, T, live, woke, t) { if (!P(c, 'lstep', 1, Xs, Ys, T)) return false; if (live || woke) { ql('glow', Xs, Ys, T * 1.6, GOLD, live ? 0.3 + 0.2 * Math.sin(t * 5) : 0.25, 0.45); if (live) ql('ring', Xs, Ys, T * 1.05, '#FFFFFF', 0.4 + 0.2 * Math.sin(t * 5), T * 0.18, 0.42); qo('glow', Xs, Ys - T * 0.5, T * 1.4, GOLD, live ? 0.2 : 0.12); } return true; },
    // a floating book of the Procession, its two page wings flapping (fin -0.3..0.3); hurt: a rose flush
    pbook(c, Xs, Ys, Y, T, fin, hurt) { const s = A.pic(c, 'lwing', 0, T, (A.live && A.live.L) || 'cat'); if (!s) return false; c.save(); const g = c.createRadialGradient(Xs, Ys, 0, Xs, Ys, T * 0.4); g.addColorStop(0, 'rgba(20,12,24,.28)'); g.addColorStop(1, 'rgba(20,12,24,0)'); c.fillStyle = g; c.translate(Xs, Ys); c.scale(1, 0.34); c.translate(-Xs, -Ys); c.fillRect(Xs - T * 0.4, Ys - T * 0.4, T * 0.8, T * 0.8); c.restore();
      for (const sd of [-1, 1]) { c.save(); c.translate(Xs, Y); c.scale(sd, 1); c.translate(0, -T * 0.12); c.scale(1, 1 + fin * 0.9); A.put(c, s, 0, 0, T); c.restore(); }
      if (!P(c, 'lpbook', 0, Xs, Y + T * 0.12, T)) return false; if (hurt) qo('glow', Xs, Y - T * 0.13, T * 0.6, ROSE, 0.5); return true; },
    // a group's truth (k 0..1 as it is inspected): a pool of gold light under the true books, a flicker of violet under a false one
    truth(Xs, Ys, T, w, real, t, k) { if (real) { ql('glow', Xs, Ys + T * 0.08, w * 1.5, GOLD, 0.45 * k, 0.4); ql('ring', Xs, Ys + T * 0.08, w, GOLD_HI, 0.4 * k, T * 0.12, 0.4); } else ql('ring', Xs, Ys + T * 0.08, w, VIOLET_HI, (0.3 + 0.25 * Math.sin(t * 9)) * k, T * 0.16, 0.42); },
    // the way ahead (a run of light along each leg) and the leading circle (a ring of light: rose while they wait)
    path(pts, T) { for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = (bx - ax) / 2, dy = (by - ay) / 2, l = Math.hypot(dx, dy) || 1; ql('quad', 623, ax + dx, ay + dy, dx, dy, -dy / l * T * 0.3, dx / l * T * 0.3, GOLD, 0.55, 11 + i, 1, 0); } },
    lead(Xs, Ys, R, T, waiting, t) { const n = 28; for (let i = 0; i < n; i++) { const a = i / n * TAU + (t || 0) * 0.15; ql('glow', Xs + Math.cos(a) * R, Ys + Math.sin(a) * R * 0.55, T * 0.32, waiting ? ROSE : GOLD, waiting ? 0.32 : 0.14, 0.5); } },
    threat(Xs, Ys, T, t) { ql('glow', Xs, Ys, T * 0.95, ROSE, 0.3 + 0.2 * Math.sin(t * 10), 0.5); ql('ring', Xs, Ys, T * 0.7, ROSE, 0.35 + 0.2 * Math.sin(t * 10), T * 0.16, 0.42); },
  };
  A.stage = ST;

  /* ======================= the arenas' standing pieces ======================= */
  const STATS = { syllax: 0, vellum: 0, nhalex: 0, fallback: 0 };
  const live = () => !!(A.live && A.gpuOK && A.gpuOK());
  // Syllax's: the land's painted bookcases (their variant from p.i), candelabras and stacks
  function syProp(c, FX, p, X, Y, T) { const n = p.kind === 'case' ? 'bookcase' : p.kind === 'candle' ? 'candelabra' : p.kind === 'stack' ? 'bookstack' : null; if (!n) return false; const v = (p.i | 0) % 4; return P(c, n, v % 2, X, Y, T, { L: 'cat', flip: v >= 2 }); }
  // Vellum's lectern: the painted lectern (its book left off), then its page and the fight's marks on it as 20zf draws them
  function vlLectern(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, Lc = (M.lect && M.lect[p.i]) || { st: 'page', glow: 1, stain: 0, drown: false }, lost = Lc.st === 'lost', teth = M.st && M.st.on && M.st.i === p.i, x = X + (teth ? Math.sin(t * 40) * T * 0.015 * (M.st.fill || 0) : 0);
    if (!P(c, 'lslot', 0, x, Y, T * 1.1, { L: 'cat' })) return false; const pg = [[x - T * 0.54, Y - T * 1.12], [x + T * 0.54, Y - T * 1.12], [x + T * 0.45, Y - T * 1.42], [x - T * 0.45, Y - T * 1.42]], path = () => { c.beginPath(); pg.forEach((q, j) => j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
    c.save();
    if (Lc.st === 'page' || lost) { if (Lc.glow > 0.02 && live()) { qo('glow', x, Y - T * 1.35, T * 1.3, GOLD, Lc.glow * (0.32 + 0.14 * Math.sin(t * 3 + p.i))); ql('glow', x, Y, T * 1.4, GOLD, Lc.glow * 0.15, 0.45); }
      path(); const g = c.createLinearGradient(x - T * 0.5, Y - T * 1.42, x + T * 0.5, Y - T * 1.12); if (lost) { g.addColorStop(0, '#2A2236'); g.addColorStop(1, '#0E0A12'); } else { g.addColorStop(0, '#FFFBEE'); g.addColorStop(1, '#E0CFA6'); } c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(30,20,40,.55)'; c.lineWidth = Math.max(1, T * 0.03); c.stroke();
      c.save(); path(); c.clip();
      if (!lost) { c.strokeStyle = 'rgba(107,50,79,.4)'; c.lineWidth = Math.max(1, T * 0.022); c.beginPath(); for (let i = 0; i < 4; i++) { const yy = Y - T * (1.2 + i * 0.06); c.moveTo(x - T * 0.36, yy); c.lineTo(x + T * (0.1 + (i % 2) * 0.2), yy); } c.stroke(); c.fillStyle = GOLD; c.beginPath(); c.arc(x + T * 0.28, Y - T * 1.3, T * 0.055, 0, TAU); c.fill(); }
      const s = Lc.stain || 0; if (s > 0.01 && !lost) { c.fillStyle = '#120D1A'; c.beginPath(); c.moveTo(x - T * 0.6, Y - T * 1.45); for (let j = 0; j <= 8; j++) { const yy = Y - T * (1.45 - j * 0.04), xx = x - T * 0.6 + T * 1.25 * s + Math.sin(j * 1.7 + t * 2) * T * 0.07; c.lineTo(xx, yy); } c.lineTo(x - T * 0.6, Y - T * 1.1); c.closePath(); c.fill(); }
      if (Lc.drown) { c.fillStyle = 'rgba(23,17,31,.85)'; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x - T * 0.3 + j * T * 0.2, Y - T * (1.22 + (j % 2) * 0.1), T * (0.1 + (j % 3) * 0.04), 0, TAU); c.fill(); } }
      c.restore();
      if (Lc.glow > 0.3 && !lost && live()) for (let j = 0; j < 2; j++) { const ph = (t * 0.5 + j * 0.5 + p.i * 0.3) % 1; qo('glow', x + Math.sin(j * 2 + p.i) * T * 0.45, Y - T * (1.55 + ph * 0.8), T * 0.14 * (1 - ph), GOLD_HI, Lc.glow * (1 - ph)); } }
    else { if (live()) { const cx = x, cy = Y - T * 1.27; qo('quad', 623, cx, cy, T * 0.5, 0, 0, T * 0.35, '#F4EAD2', 0.35, p.i, 0.3, 0); } else { c.strokeStyle = 'rgba(244,234,210,.55)'; c.lineWidth = 1.5; c.setLineDash([3, 3]); path(); c.stroke(); c.setLineDash([]); }
      if (Lc.st === 'gone') { const f = 1 - clamp(Lc.back / 8, 0, 1); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 4; c.beginPath(); c.arc(x, Y - T * 2.0, T * 0.24, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = 2.5; c.beginPath(); c.arc(x, Y - T * 2.0, T * 0.24, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); } }
    if (lost) { c.strokeStyle = 'rgba(23,17,31,.9)'; c.lineWidth = Math.max(1.5, T * 0.07); c.lineCap = 'round'; for (const dx of [-0.35, 0.05, 0.4]) { const L2 = T * (0.3 + 0.25 * ((Math.sin(t * 0.8 + dx * 9) + 1) / 2)); c.beginPath(); c.moveTo(x + dx * T, Y - T * 1.07); c.lineTo(x + dx * T, Y - T * 1.07 + L2); c.stroke(); c.fillStyle = '#17111F'; c.beginPath(); c.arc(x + dx * T, Y - T * 1.07 + L2, T * 0.05, 0, TAU); c.fill(); } }
    c.restore(); return true; }
  /* Nhalex's great books (2.4 x 3.7 tiles, 0.55 deep): lnbook v the whole closed book (its colour v), lnbody v the book with its
     front cover off (the page block's face lined), lncover v the cover alone (tooled in gilt) */
  const NB_COL = ['#6B324F', '#2F3A5A', '#3E5A44', '#5A2A3A', '#4A3A6A', '#7A5A2A', '#4A2236', '#2A4A4A'].map(h => { const n = parseInt(h.slice(1), 16); return [Math.pow((n >> 16 & 255) / 255, 1.6) * 1.15, Math.pow((n >> 8 & 255) / 255, 1.6) * 1.15, Math.pow((n & 255) / 255, 1.6) * 1.15]; });
  const NW = 1.2, NH = 3.7, ND = 0.55;
  function nbBack(K, S, v, L, sd) { const X = XK(), col = NB_COL[v % 8]; X2.contact(K, S, 1.8, 0.45, 0.4, ND * 0.5, 0.05);
    X.plate(K, S, [[NW, 0], [NW + ND, -ND * 0.6], [NW + ND, -NH - ND * 0.6], [NW, -NH]], [0.85, 0.45, 0.1], 0.02, (x, y) => { X2.parchM(K, x * 3, y * 60, sd, L === 'holy'); if (md(y * 70, 1) < 0.3) K.M.ao *= 0.85; }); S.unlock();
    X.plate(K, S, [[-NW, -NH], [NW, -NH], [NW + ND, -NH - ND * 0.6], [-NW + ND, -NH - ND * 0.6]], [0.1, 0.3, 0.95], 0.02, (x, y) => X2.leatherM(K, x * 4, y * 4, sd, col.map(q => q * 0.7), 0)); S.unlock(); }
  function nbCover(K, S, v, L, sd) { const X = XK(), col = NB_COL[v % 8];
    X.plate(K, S, [[-NW, 0], [NW, 0], [NW, -NH], [-NW, -NH]], [0, 1, 0.12], 0.05, (x, y, ao, e, d) => { X2.leatherM(K, x * 3, y * 3, sd, col, e * 0.5); const bx = Math.abs(x) - (NW - 0.3), by = Math.max(-y - (NH - 0.3), 0.3 + y), q = Math.max(bx, by), ring = Math.abs(Math.hypot(x, (y + NH * 0.55)) - 0.6);
      if (x < -NW + 0.32) { K.M.ao *= 0.8; const r = -y / NH; if ([0.15, 0.32, 0.68, 0.85].some(b2 => Math.abs(r - b2) < 0.012)) X2.metalM(K, x * 4, y * 4, sd, L, 0.4); }
      else if (Math.abs(q) < 0.035 || ring < 0.035) X2.metalM(K, x * 4, y * 4, sd, L, 0.4); else for (const [cx, cy] of [[-NW + 0.3, -0.3], [NW - 0.3, -0.3], [-NW + 0.3, -NH + 0.3], [NW - 0.3, -NH + 0.3]]) if (Math.hypot(x - cx, y - cy) < 0.2) X2.metalM(K, x * 4, y * 4, sd, L, 0.5); }); S.unlock(); }
  Object.assign(DEF, {
    lnbook: { box: () => [-NW - 0.1, -NH - ND * 0.6 - 0.1, NW + ND + 0.1, 0.5], vs: [0, 1, 2, 3, 4, 5, 6, 7], paint(K, S, v, L) { const sd = 971 + v; nbBack(K, S, v, L, sd); nbCover(K, S, v, L, sd + 1); K.ink(S, X2.INK[L], 0.4); } },
    lnbody: { box: () => [-NW - 0.1, -NH - ND * 0.6 - 0.1, NW + ND + 0.1, 0.5], vs: [0, 1, 2, 3, 4, 5, 6, 7], paint(K, S, v, L) { const X = XK(), sd = 981 + v; nbBack(K, S, v, L, sd);
      X.plate(K, S, [[-NW + 0.06, -0.06], [NW - 0.02, -0.06], [NW - 0.02, -NH + 0.08], [-NW + 0.06, -NH + 0.08]], [0, 1, 0.1], 0.03, (x, y) => { X2.parchM(K, x * 2, y * 2, sd, true); const r = (-y - 0.5) / 0.34; if (y < -0.4 && y > -NH + 0.5 && Math.abs(md(r, 1) - 0.5) > 0.47 && x > -NW + 0.35 && x < NW - 0.35 - (Math.floor(r) % 3) * 0.3) K.M.ao *= 0.7; }); S.unlock(); K.ink(S, X2.INK[L], 0.4); } },
    lncover: { box: () => [-NW - 0.1, -NH - 0.1, NW + 0.1, 0.1], vs: [0, 1, 2, 3, 4, 5, 6, 7], paint(K, S, v, L) { nbCover(K, S, v, L, 991 + v); K.ink(S, X2.INK[L], 0.4); } },
  });
  A.PIECES_OF.push([/syllax|Reading Circle/, [['bookcase', 0], ['bookcase', 1], ['candelabra', 0], ['candelabra', 1], ['bookstack', 0], ['bookstack', 1]]], [/vellum|Spilled-Ink/, []], [/nhalex|Final Archive/, [0, 1, 2, 3, 4, 5, 6, 7].map(v => ['lnbook', v])]);
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  function nhBook(c, FX, p, X, Y, T, t) { const D = FIEND_DEFS.nhalex, sym = D && D.symbol; if (typeof sym !== 'function') return false; const M = FX.mem, bk = M && M.books ? M.books[p.i] : { open: 0 }, o = smooth(bk.open || 0), v = p.i % 8, x0 = X - NW * T, y0 = Y - NH * T, w = NW * 2 * T, h = NH * T;
    if (o <= 0.02) { if (!P(c, 'lnbook', v, X, Y, T, { L: 'holy' })) return false; sym(c, (p.i + 1) % 4, X, y0 + h * 0.45, T * 0.32, GOLD_HI, T); return true; }
    if (!P(c, 'lnbody', v, X, Y, T, { L: 'holy' })) return false; sym(c, p.i % 4, X, y0 + h * 0.45, T * 0.55, 'rgba(40,24,60,.75)', T);
    if (live()) { qo('glow', X, y0 + h * 0.45, w * 0.9, VIOLET_HI, 0.45 * o); qo('glow', X, y0 + h * 0.5, w * 0.5, '#FFFFFF', 0.3 * o); }
    const s = A.pic(c, 'lncover', v, T, 'holy'); if (!s) return true; const ang = o * Math.PI * 0.85, kx = Math.cos(ang), lean = Math.sin(ang) * 0.35, f = T / s.P;
    c.save(); c.translate(x0, Y); c.scale(kx || 0.001, 1); c.drawImage(s.cv, (-s.ax * f) + NW * T, -s.ay * f, s.cv.width * f, s.cv.height * f); if (kx < 0) { c.fillStyle = 'rgba(30,20,36,.42)'; c.fillRect(0, -NH * T, NW * 2 * T, NH * T); } c.restore(); void lean;
    if (kx > 0.25) { c.save(); c.translate(x0 + NW * T * kx, y0 + h * 0.45); c.scale(kx, 1); sym(c, (p.i + 1) % 4, 0, 0, T * 0.32, GOLD_HI, T); c.restore(); }
    return true; }
  function wrap() { const FD = typeof FIEND_DEFS !== 'undefined' ? FIEND_DEFS : null; if (!FD) return;
    const W = (id, kinds, fn) => { const D = FD[id]; if (!D || typeof D.drawProp !== 'function' || D.drawProp.__libA) return; const od = D.drawProp; const f = function (c, FX, p, Xs, Ys, T, t) { if (on() && p && kinds.includes(p.kind)) { try { if (fn(c, FX, p, Xs, Ys, T, t)) { STATS[id]++; return; } } catch (e) {} STATS.fallback++; } return od.apply(this, arguments); }; f.__libA = 1; D.drawProp = f; };
    W('syllax', ['case', 'candle', 'stack'], syProp); W('vellum', ['lectern'], vlLectern); W('nhalex', ['book'], nhBook); }
  wrap(); if (typeof setTimeout === 'function') setTimeout(wrap, 0);
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.library; if (Rf && !Rf.__libA) { Rf.__libA = 1; const op = Rf.preload; Rf.preload = function (Pp) { try { wrap(); } catch (e) {} return op ? op.apply(this, arguments) : []; }; } } catch (e) {}
  const API = { wrap, get stats() { return Object.assign({}, STATS); } };
  A.arena = API; if (HAS_W) window.LIB_ARENA = API;
})();
