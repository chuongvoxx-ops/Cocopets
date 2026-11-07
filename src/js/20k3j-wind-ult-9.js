/* ---------- Wind, new: Zephyr's Blessing ----------
   A party blessing. Replaces Palace of the Sky (row in 20k1: key 'zephyrblessing', cost 100, cd 90, glyph 'leaf').
   The pet leaps and unfurls translucent butterfly wings of emerald wind; one sweeping wingbeat sends a gentle shockwave
   through the party and wraps it in flowing wind ribbons. While the blessing lasts, whichever party pet is on the field:
     +30% movement speed, +20% attack speed (+30% at Adept, +35% at Celestial; continuous levels interpolate:
       20 / 23.3 / 26.7 / 30 / 31.7 / 33.3 / 35%), 20% less damage taken, immune to slows (chill, webs, mud; slows on it are
       cleared at the wingbeat), and Windguard charges (1; 2 at Celestial): the next hit (not a damage-over-time tick) is
       blocked entirely, and cannot stagger or knock back the pet. Duration 25 / 30 / 35 s at levels 1 / 4 / 7 (25 + 5/3 per level; was 9 + level).
   Party-wide: the state lives on the floor's game object (g.zephyr: t left, dur, as, mv, ch, chMax, guardT, prePush),
   which every party pet shares, so switching pets keeps it; recasting refreshes the time and the charges (no stacking).
   The hooks in 20b-game-dungeon.js (zephK): the normal attack's interval and the Strong cooldowns run `as` times faster
   (never the Ultimate's), the walking speed is x mv, chill and mud do not slow; the ward (X.addWard(fn, true): first in
   the list) blocks a hit with a charge (0 damage, returns nothing to the other wards), otherwise takes 20% off before
   Rock Steady and Love Sanctuary see the rest; after a block any push laid on the pet for 0.2 s is dropped.
   It ends at its time (the ribbons unwind and fade), at once on the pet's death, and with the floor (g is the floor's).
   No damage is dealt.
   Visuals: the cast (1.25 s): a crouch with wind motes gathering, a leap (me.z / me.hopSq / me.hopArmS: the pet's own rig,
   never turned in 3D), the wings unfurling (cached feathered membranes: deep emerald at the root to mint, mint rims and
   pearly veins; Celestial eyespots), the wingbeat and its soft floor shockwave, the landing as the wings dissolve.
   While active: satin wind ribbons spiralling round the pet (feathered strips, front and back runs depth-sorted with the
   pet, dimmed over it), feather wisps orbiting, the Windguard charges as glowing feather emblems, soft mint afterimages
   of the pet's last positions while it moves (a cached tinted silhouette of its picture). A blocked hit: the ribbons
   unfold into enormous butterfly wings round the pet, then dissolve back into air with a spiral of feathers.
   HUD: a ZEPHYR chip with its time and a dot per charge (20b). Sprites are baked once (fxSprite), warmed in idle time
   (U.zephyrblessing.warm); particles go through H.n / H.Q. */
(() => {
  const U = ELEM_IMPL.wind.ult; delete U.skypalace;
  const TAU = Math.PI * 2, GY = 0.55;
  const MINT = '#73E8B6', EMER = '#16A57B', AIR = '#E7FFF6', PINK = '#FFAFD2';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const tierOf = ev => (ev >= 7 ? 3 : ev >= 4 ? 2 : 1);
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const backOut = u => { const s = 1.6; u = cl(u) - 1; return u * u * ((s + 1) * u + s) + 1; };
  // the numbers
  const durOf = ev => 25 + (ev - 1) * 5 / 3;   // 25 / 30 / 35 s (the user)
  const asOf = ev => (ev <= 4 ? 0.2 + (ev - 1) * 0.1 / 3 : 0.3 + (ev - 4) * 0.05 / 3);   // +20% / +30% / +35%
  const chOf = ev => (ev >= 7 ? 2 : 1);
  const MV = 1.3, DR = 0.8;
  let H = null;

  /* ================= sprites (baked once) ================= */
  const NROT = 16;
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  // a shape only as its soft shadow (the feathered mask): drawn far off the canvas, its shadow brought back in
  const soft = (g, blur, col, fn) => { g.save(); g.shadowColor = col; g.shadowBlur = blur; g.shadowOffsetX = 4000; g.translate(-4000, 0); fn(g); g.restore(); };
  // the right wing (the root at RX, RY; the sprite 256 square): a broad forewing up and out, a rounded hindwing below
  const RX = 22, RY = 150;
  function wingPaths() {
    const f = new Path2D(); f.moveTo(RX, RY - 8); f.bezierCurveTo(56, 74, 146, 10, 232, 20); f.bezierCurveTo(252, 50, 236, 104, 196, 132); f.bezierCurveTo(150, 152, 74, 156, RX, RY + 2); f.closePath();
    const h = new Path2D(); h.moveTo(RX, RY); h.bezierCurveTo(84, 146, 168, 146, 198, 178); h.bezierCurveTo(222, 204, 196, 246, 154, 248); h.bezierCurveTo(118, 250, 92, 234, 76, 212); h.bezierCurveTo(58, 188, 38, 166, RX, RY + 6); h.closePath();
    return [f, h];
  }
  const wingSpr = tier => fxSprite('zpWing' + tier, 256, 256, (g, W, Hh) => {
    const [fw, hw] = wingPaths();
    // the body: emerald from the root, mint toward the edges, a pale sheen across
    const gr = g.createRadialGradient(RX, RY, 4, RX, RY, 250); gr.addColorStop(0, 'rgba(6,74,55,0.8)'); gr.addColorStop(0.3, 'rgba(18,140,104,0.6)'); gr.addColorStop(0.7, 'rgba(70,206,158,0.46)'); gr.addColorStop(1, 'rgba(150,242,206,0.55)');
    g.fillStyle = gr; g.strokeStyle = gr; g.lineWidth = 10; g.lineJoin = 'round'; for (const p of [fw, hw]) { g.fill(p); g.stroke(p); }
    g.save(); g.clip(hw); g.fillStyle = 'rgba(8,80,60,0.16)'; g.fillRect(0, 0, W, Hh); g.restore();
    g.save(); g.clip(fw); const sh = g.createLinearGradient(60, 30, 190, 170); sh.addColorStop(0, 'rgba(231,255,246,0)'); sh.addColorStop(0.42, 'rgba(231,255,246,0.2)'); sh.addColorStop(0.5, 'rgba(231,255,246,0.06)'); sh.addColorStop(0.62, 'rgba(231,255,246,0.14)'); sh.addColorStop(1, 'rgba(231,255,246,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, Hh);
    // (the leading edge a touch deeper, as a membrane curving away)
    g.strokeStyle = 'rgba(6,70,52,0.3)'; g.lineWidth = 16; g.beginPath(); g.moveTo(RX, RY - 8); g.bezierCurveTo(56, 74, 146, 10, 232, 20); g.stroke(); g.restore();
    // the veins: pearly, fanning from the root, a cross vein round the cell
    const veins = [[[70, 70], [150, 24], [226, 24]], [[80, 90], [170, 52], [238, 56]], [[90, 112], [180, 92], [228, 98]], [[86, 130], [160, 126], [200, 130]], [[70, 146], [120, 150], [168, 148]],
      [[70, 160], [140, 168], [196, 186]], [[64, 168], [120, 196], [164, 240]], [[52, 170], [80, 196], [98, 228]]];
    g.lineCap = 'round';
    for (const [a, b, e] of veins) { g.strokeStyle = 'rgba(238,255,250,0.62)'; g.lineWidth = 1.7; g.beginPath(); g.moveTo(RX + 4, RY); g.bezierCurveTo(a[0], a[1], b[0], b[1], e[0], e[1]); g.stroke();
      g.strokeStyle = 'rgba(255,214,236,0.3)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(RX + 5, RY + 1.5); g.bezierCurveTo(a[0] + 1, a[1] + 2, b[0] + 1, b[1] + 2, e[0], e[1] + 2); g.stroke(); }
    g.strokeStyle = 'rgba(238,255,250,0.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(96, 74); g.quadraticCurveTo(130, 104, 112, 140); g.stroke(); g.beginPath(); g.moveTo(84, 160); g.quadraticCurveTo(116, 176, 104, 204); g.stroke();
    // Adept: a submarginal row of pearls; Celestial: eyespots
    if (tier >= 2) { const row = [[200, 40], [214, 60], [214, 84], [198, 108], [178, 124], [182, 190], [184, 214], [166, 232], [140, 236]]; for (const [x, y] of row) { g.fillStyle = 'rgba(240,255,250,0.55)'; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,200,228,0.35)'; g.beginPath(); g.arc(x + 1, y + 1, 1.3, 0, TAU); g.fill(); } }
    if (tier >= 3) { for (const [x, y, r] of [[196, 72, 13], [160, 210, 11]]) { const eg = g.createRadialGradient(x - 2, y - 2, 1, x, y, r); eg.addColorStop(0, 'rgba(255,255,255,0.95)'); eg.addColorStop(0.3, 'rgba(255,175,210,0.7)'); eg.addColorStop(0.6, 'rgba(22,165,123,0.55)'); eg.addColorStop(0.82, 'rgba(231,255,246,0.75)'); eg.addColorStop(1, 'rgba(231,255,246,0)'); g.fillStyle = eg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } }
    // the rims: a mint glow band and a pale fine edge (their outer halves fade under the mask: feathered)
    g.strokeStyle = 'rgba(115,232,182,0.6)'; g.lineWidth = 9; for (const p of [fw, hw]) g.stroke(p);
    g.strokeStyle = 'rgba(231,255,246,0.85)'; g.lineWidth = 2.4; for (const p of [fw, hw]) g.stroke(p);
    // the feathered edge: everything kept only inside a softened copy of the outline
    const m = mk(W, Hh), mg = m.getContext('2d'); soft(mg, 6, 'rgba(0,0,0,1)', q => { q.fillStyle = '#000'; q.fill(fw); q.fill(hw); });
    g.globalCompositeOperation = 'destination-in'; g.drawImage(m, 0, 0); g.globalCompositeOperation = 'source-over';
  });
  // its glow: the outline blurred wide in mint, for the beat and the shield (additive)
  const wingGlowSpr = () => fxSprite('zpWingG', 256, 256, g => { const [fw, hw] = wingPaths(); soft(g, 18, 'rgba(115,232,182,0.9)', q => { q.fillStyle = '#000'; q.fill(fw); q.fill(hw); }); soft(g, 6, 'rgba(231,255,246,0.5)', q => { q.strokeStyle = '#000'; q.lineWidth = 4; q.stroke(fw); q.stroke(hw); }); });
  // a small feather wisp (v 0 mint, 1 pale with a blush), turned to bucket b
  const featherSpr = (v, b) => fxSprite('zpFeather' + v + '|' + b, 32, 32, g => { g.translate(16, 16); g.rotate(b / NROT * TAU);
    const vane = q => { q.beginPath(); q.moveTo(0, -12); q.bezierCurveTo(6, -8, 6.5, 2, 2.5, 9); q.lineTo(0, 12); q.lineTo(-2.5, 9); q.bezierCurveTo(-6.5, 2, -6, -8, 0, -12); q.closePath(); };
    soft(g, 3, v ? 'rgba(231,255,246,0.75)' : 'rgba(115,232,182,0.8)', q => { q.fillStyle = '#000'; vane(q); q.fill(); });
    const lg = g.createLinearGradient(-6, 0, 6, 0); lg.addColorStop(0, v ? 'rgba(255,214,232,0.55)' : 'rgba(22,165,123,0.55)'); lg.addColorStop(0.5, 'rgba(231,255,246,0.85)'); lg.addColorStop(1, v ? 'rgba(231,255,246,0.45)' : 'rgba(115,232,182,0.5)'); g.fillStyle = lg; vane(g); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, -10); g.quadraticCurveTo(0.8, 0, 0, 12); g.stroke();
    g.strokeStyle = 'rgba(6,90,66,0.35)'; g.lineWidth = 0.6; for (let i = 0; i < 4; i++) { const y = -6 + i * 4; g.beginPath(); g.moveTo(0.4, y); g.lineTo(4.2, y - 2.4); g.moveTo(-0.4, y + 1); g.lineTo(-4.2, y - 1.4); g.stroke(); } });
  // a Windguard emblem: a bright feather in a soft halo
  const emblemSpr = () => fxSprite('zpEmblem', 64, 64, g => { g.translate(32, 32);
    const hg = g.createRadialGradient(0, 0, 2, 0, 0, 31); hg.addColorStop(0, 'rgba(231,255,246,0.7)'); hg.addColorStop(0.35, 'rgba(115,232,182,0.35)'); hg.addColorStop(1, 'rgba(22,165,123,0)'); g.fillStyle = hg; g.fillRect(-32, -32, 64, 64);
    g.rotate(0.35); const vane = q => { q.beginPath(); q.moveTo(0, -19); q.bezierCurveTo(9, -12, 10, 4, 3.5, 14); q.lineTo(0, 18); q.lineTo(-3.5, 14); q.bezierCurveTo(-10, 4, -9, -12, 0, -19); q.closePath(); };
    soft(g, 4, 'rgba(231,255,246,0.9)', q => { q.fillStyle = '#000'; vane(q); q.fill(); });
    const lg = g.createLinearGradient(-9, -10, 9, 12); lg.addColorStop(0, '#E7FFF6'); lg.addColorStop(0.5, '#9EF2CF'); lg.addColorStop(1, '#2BBE8E'); g.fillStyle = lg; vane(g); g.fill();
    g.strokeStyle = 'rgba(11,92,69,0.5)'; g.lineWidth = 0.9; for (let i = 0; i < 6; i++) { const y = -11 + i * 4.6; g.beginPath(); g.moveTo(0.5, y); g.lineTo(6.5, y - 3.6); g.moveTo(-0.5, y + 1.4); g.lineTo(-6.5, y - 2); g.stroke(); }
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -16); g.quadraticCurveTo(1.2, 0, 0, 18); g.stroke(); });
  // a soft floor ring (feathered both sides)
  const ringSpr = () => fxSprite('zpRing', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(115,232,182,0)'); gr.addColorStop(0.62, 'rgba(115,232,182,0)'); gr.addColorStop(0.8, 'rgba(115,232,182,0.32)'); gr.addColorStop(0.9, 'rgba(231,255,246,0.8)'); gr.addColorStop(0.95, 'rgba(115,232,182,0.3)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // a gust arc (a curved soft streak), for the shockwave
  const gustSpr = () => fxSprite('zpGust', 128, 64, g => { g.lineCap = 'round'; for (const [w, a, col] of [[10, 0.12, MINT], [5, 0.3, MINT], [1.8, 0.75, AIR]]) { g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = w; g.beginPath(); g.moveTo(10, 50); g.quadraticCurveTo(64, 6, 118, 40); g.stroke(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; const lg = g.createLinearGradient(0, 0, 128, 0); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.3, 'rgba(0,0,0,1)'); lg.addColorStop(0.7, 'rgba(0,0,0,1)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(0, 0, 128, 64); });
  const WARM = [() => wingSpr(1), () => wingSpr(2), () => wingSpr(3), () => wingGlowSpr(), () => emblemSpr(), () => ringSpr(), () => gustSpr(), () => glowSprite(MINT), () => glowSprite(AIR), () => glowSprite(EMER)];
  for (let v = 0; v < 2; v++) for (let b = 0; b < NROT; b++) WARM.push(() => featherSpr(v, b));
  let WI = 0; const warmStep = ms => { const t0 = nowMs(); while (WI < WARM.length && nowMs() - t0 < ms) WARM[WI++](); return WI >= WARM.length; };
  // the pet's afterimage: its picture as a soft mint silhouette, one per set of pictures (a pet switch brings another)
  const GHOSTS = new WeakMap(); let GHOST_MS = 0;
  function ghostOf(S) {
    if (!S || !S.normal || !S.normal.img || typeof drawPetSprite !== 'function') return null; let G = GHOSTS.get(S); if (G !== undefined) return G; const t0 = nowMs();
    const W = 128, a = mk(W, W), ag = a.getContext('2d'); drawPetSprite(ag, W / 2, W - 10, 100, { sprites: S });
    ag.globalCompositeOperation = 'source-in'; const lg = ag.createLinearGradient(0, 0, 0, W); lg.addColorStop(0, '#E7FFF6'); lg.addColorStop(0.5, '#73E8B6'); lg.addColorStop(1, '#16A57B'); ag.fillStyle = lg; ag.fillRect(0, 0, W, W);
    const cv = mk(W, W), g = cv.getContext('2d'); g.save(); g.shadowColor = 'rgba(115,232,182,0.9)'; g.shadowBlur = 7; g.shadowOffsetX = 4000; g.drawImage(a, -4000, 0); g.restore(); g.globalAlpha = 0.55; g.drawImage(a, 0, 0);
    G = { cv, foot: W - 10, h: 100 }; GHOSTS.set(S, G); GHOST_MS = nowMs() - t0; return G;
  }
  const glowF = (c, x, y, r, col, a, sy) => { if (a <= 0.004 || r <= 0.5) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); const ry = r * (sy || 1); blitSized(c, glowSprite(col), x - r, y - ry, r * 2, ry * 2); c.restore(); };
  const petHTof = me => { const SZ = Math.max(0.6, ((me.r || 0.3) - 0.2) / 0.1), g = H.g; return 1.02 * SZ * (g.pw && g.pw.giant ? 1.35 : 1) * (g.petK || 1); };
  // a wing pair drawn about its root (screen px): L the wing's length (px), ang its raise (- up), fx its foreshortening,
  // a its opacity, glow the extra additive light, mirror both sides
  function wings(c, X, Y, L, ang, fx, a, tier, glow, sideK) {
    if (a <= 0.01 || L < 2) return; const spr = wingSpr(tier), k = L / 232;
    for (const s of [-1, 1]) { c.save(); c.translate(X + s * L * 0.02, Y); c.scale(s * Math.max(0.05, fx) * (sideK || 1), 1); c.rotate(ang);
      c.globalAlpha = Math.min(1, a); c.drawImage(spr, -RX * k, -RY * k, 256 * k, 256 * k);
      if (glow > 0.01) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, glow); c.drawImage(wingGlowSpr(), -RX * k, -RY * k, 256 * k, 256 * k); }
      c.restore(); }
  }

  /* ================= the blessing: the party state, the ward, the lasting look ================= */
  function bless(ev, tier) {
    const g = H.g, me = H.me, dur = durOf(ev), ch = chOf(ev);
    let Z = g.zephyr; if (!Z) Z = g.zephyr = { guardT: 0, prePush: null, blocks: 0 };
    Object.assign(Z, { t: dur, dur, as: 1 + asOf(ev), mv: MV, dr: DR, ch, chMax: ch, ev, tier });
    me.chill = 0;   // (slows on the pet cleared)
    if (Z.aura && !Z.aura.ending && H.fx.includes(Z.aura)) Z.aura.refresh(tier); else Z.aura = aura(tier);
    return Z;
  }
  function aura(tier) {
    const me = H.me, g = H.g, X0 = H.X;
    // the ward: Windguard first (the whole hit blocked, no other ward sees it), otherwise 20% off
    const ward = (d, src, o) => { const Z = g.zephyr; if (!Z || !(Z.t > 0) || me.dead || !(d > 0)) return d;
      if (Z.ch > 0 && !(o && o.dot)) { Z.ch--; Z.blocks++; Z.guardT = 0.2; Z.prePush = me.push; onBlock(src); return 0; }
      return d * Z.dr; };
    let unWard = X0.addWard ? X0.addWard(ward, true) : null;
    const release = () => { if (unWard) { unWard(); unWard = null; } };
    let lastT = 0, ribA = 0, wrapK = 0, endT = -1, dead = false, emb = [];
    const ghosts = [], blks = [], spiral = [], sparks = []; let gT = 0, lx = me.x, ly = me.y, vx = 0, vy = 0;
    const NS = tier >= 3 ? 3 : 2, NP = 26;
    const wisps = []; const nW = H.n(tier >= 3 ? 9 : tier >= 2 ? 7 : 5); for (let i = 0; i < nW; i++) wisps.push({ a: i / nW * TAU, w: (1.5 + Math.random() * 0.9) * (i % 3 === 2 ? -1 : 1), r: 0.62 + Math.random() * 0.22, h: 0.15 + (i / nW) * 0.95, ph: Math.random() * TAU, v: i % 2, s: 0.2 + Math.random() * 0.06 });
    const F = H.add({ key: 'zephyrAura', life: 1e6, entY: me.y - 0.004, ending: false, tier, update, draw, drawUnder, onEnd() { release(); if (g.zephyr && g.zephyr.aura === F) g.zephyr = null; kid.life = 0; } });
    const kid = H.add({ key: 'zephyrAuraF', life: 1e6, entY: me.y + 0.03 });
    F.refresh = tr => { F.tier = tier = Math.max(tier, tr); wrapK = Math.min(wrapK, 0.35); for (const e of emb) e.gone = 0; for (let i = 0; i < 6; i++) spiralAdd(lastT + i * 0.02, i / 6 * TAU, 0.6); };
    function onBlock(src) {
      const T = X0.Tz(), hT = petHTof(me); let a = -Math.PI / 2; if (src && isFinite(src.x)) a = Math.atan2(src.y - me.y, src.x - me.x);
      blks.push({ t0: lastT, a }); if (blks.length > 3) blks.shift();
      // the emblem spent bursts where it was
      const e = emb.find(q => !q.gone); if (e) { e.gone = 1; for (let i = 0; i < H.n(8); i++) { const an = Math.random() * TAU, v = T * (0.6 + Math.random()); sparks.push({ X: e.X, Y: e.Y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - T * 0.3, t: 0, life: 0.5 + Math.random() * 0.3, s: T * 0.05 }); } }
      const n = H.n(16 + 4 * tier); for (let i = 0; i < n; i++) spiralAdd(lastT + 0.26 + i * 0.014, i / n * TAU * 2, 1);
      X0.text(me.x, me.y - 1.1 * hT - 0.3, 'WINDGUARD', AIR, 14); X0.light && X0.light(me.x, me.y, 3, 0.35); X0.sfx.whoosh(); X0.sfx.chirp && X0.sfx.chirp();
      X0.ring(me.x, me.y, 0.4, 1.8 * hT, 0.35, MINT, 0.14);
    }
    function spiralAdd(t0, a0, k) { spiral.push({ t0, a0, k, v: spiral.length % 2, s: 0.16 + Math.random() * 0.07, dir: Math.random() < 0.5 ? 1 : -1, hh: 0.6 + Math.random() * 0.8 }); }
    function end(died) { if (F.ending) return; F.ending = true; endT = lastT; dead = died; release(); if (g.zephyr && g.zephyr.aura === F) g.zephyr = null;
      F.life = died ? 0.35 : 1.0; kid.life = F.life; if (!died) { X0.text(me.x, me.y - 1.3, "Zephyr's Blessing faded", '#CFE2FF', 12); for (const w of wisps) w.fly = 1; } }
    function update(dt, f) {
      const t = f.t; lastT = t; const Z = g.zephyr;
      if (!F.ending) {
        if (me.dead) end(true);
        else if (!Z || Z.aura !== F) end(false);
        else { Z.t -= dt; if (Z.guardT > 0) Z.guardT = Math.max(0, Z.guardT - dt); if (me.chill) me.chill = 0; if (Z.t <= 0) end(false); }
      }
      // the ribbons wrap in from wide, unwind at the end
      wrapK = Math.min(1, wrapK + dt / 0.7);
      const eu = F.ending ? cl((t - endT) / (dead ? 0.35 : 0.95)) : 0;
      ribA = Math.min(1, sm(t / 0.35)) * (1 - sm(eu));
      // the emblems: one per charge left
      const ch = Z && Z.aura === F ? Z.ch : 0; while (emb.filter(e => !e.gone).length < ch) emb.push({ gone: 0, ph: emb.length * Math.PI, k: 0, X: 0, Y: 0 }); { let live = emb.filter(e => !e.gone).length; for (const e of emb) if (!e.gone && live > ch) { e.gone = 1; live--; } }
      for (const e of emb) e.k = e.gone ? Math.max(0, e.k - dt * 5) : Math.min(1, e.k + dt * 3); emb = emb.filter(e => !(e.gone && e.k <= 0));
      // the afterimages: the pet's last places while it moves
      const mvd = Math.hypot(me.x - lx, me.y - ly); vx = lerp(vx, (me.x - lx) / Math.max(dt, 1e-3), Math.min(1, dt * 8)); vy = lerp(vy, (me.y - ly) / Math.max(dt, 1e-3), Math.min(1, dt * 8)); lx = me.x; ly = me.y; void mvd;
      gT -= dt; if (gT <= 0 && Math.hypot(vx, vy) > 1.2 && !F.ending) { gT = 0.085; ghosts.push({ x: me.x, y: me.y, z: me.z || 0, face: me.face, t }); if (ghosts.length > 4) ghosts.shift(); }
      while (ghosts.length && t - ghosts[0].t > 0.38) ghosts.shift();
      for (const w of wisps) { w.a += w.w * dt * (1 + 1.4 * eu); if (w.fly) w.r += dt * 2.2; }
      for (const s of sparks) { s.t += dt; s.X += s.vx * dt; s.Y += s.vy * dt; s.vy += 0.6 * X0.Tz() * dt; } for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].t >= sparks[i].life) sparks.splice(i, 1);
      for (let i = spiral.length - 1; i >= 0; i--) if (t - spiral[i].t0 > 1.3) spiral.splice(i, 1);
      for (let i = blks.length - 1; i >= 0; i--) if (t - blks[i].t0 > 0.9) blks.splice(i, 1);
      // a few motes shed off the ribbons as they unwind
      if (F.ending && !dead && Math.random() < dt * 30 * H.Q()) { const T = X0.Tz(), hT = petHTof(me), a = Math.random() * TAU, r = hT * 0.5 * (1 + 1.6 * eu); sparks.push({ X: H.sx(me.x) + Math.cos(a) * r * T, Y: H.sy(me.y) + 0.18 * T - (me.z || 0) * T - hT * T * (0.2 + 0.8 * Math.random()) + Math.sin(a) * r * T * 0.42, vx: Math.cos(a) * T * 0.4, vy: -T * (0.2 + Math.random() * 0.4), t: 0, life: 0.6, s: T * 0.045 }); }
      F.entY = me.y - 0.004; kid.entY = me.y + 0.03;
      if (WI < WARM.length) warmStep(1);
    }
    // where the pet is on screen: its feet (lifted by a jump), its height
    const feet = T => [H.sx(me.x + (me.hopDX || 0)), H.sy(me.y + (me.hopDY || 0)) + 0.18 * T - (me.z || 0) * T];
    // the block's wings: how much the ribbons have become wings (0..1) and how open they are
    const blkK = () => { let k = 0; for (const b of blks) { const u = lastT - b.t0; k = Math.max(k, sm(u / 0.06) * (1 - sm((u - 0.4) / 0.4))); } return k; };
    /* ---- the ribbons: NS satin strips spiralling up round the pet, their loose ends streaming behind its motion ---- */
    const RXa = new Float32Array(NP), RYa = new Float32Array(NP), RW = new Float32Array(NP), RD = new Float32Array(NP), NX = new Float32Array(NP), NY = new Float32Array(NP), TW = new Float32Array(NP);
    function ribbons(c, front) {
      const bk = blkK(), al = ribA * (1 - 0.85 * bk); if (al <= 0.01) return; const T = X0.Tz(), hT = petHTof(me), Fp = feet(T), t = lastT, eu = F.ending ? cl((lastT - endT) / 0.95) : 0, hp = hT * T;
      const spd = Math.hypot(vx, vy), tvx = -vx / Math.max(1, spd) * Math.min(1, spd / 5), tvy = -vy / Math.max(1, spd) * Math.min(1, spd / 5);
      const radK = lerp(2.3, 1, sm(wrapK)) * (1 + 1.8 * sm(eu)) * (1 + 0.6 * bk);
      for (let k = 0; k < NS; k++) {
        const ph = k / NS * TAU, om = 2.1 + 0.25 * k + 2.5 * eu, turns = 1.15 - 0.4 * sm(eu);
        for (let i = 0; i < NP; i++) { const s = i / (NP - 1), th = ph + t * om - s * TAU * turns, tail = sm((s - 0.72) / 0.28);
          const r = hp * (0.46 + 0.07 * Math.sin(t * 2.3 + s * 5 + k * 2)) * radK * (1 + 0.9 * tail), h = hp * (0.04 + 1.0 * s + 0.07 * Math.sin(t * 3 + s * 6 + k) + 0.25 * tail * Math.sin(t * 2.6 + k));
          RXa[i] = Fp[0] + Math.cos(th) * r + tvx * tail * hp * 0.9 + Math.sin(t * 1.7 + k + s * 3) * hp * 0.05 * tail; RYa[i] = Fp[1] - h + Math.sin(th) * r * 0.42 + tvy * tail * hp * 0.5;
          RD[i] = Math.sin(th); TW[i] = 0.4 + 0.6 * Math.abs(Math.cos(s * 7.5 + t * 2.4 + k * 1.7));
          RW[i] = hp * (tier >= 3 ? 0.2 : 0.17) * TW[i] * sm(s / 0.12) * Math.pow(cl((1 - s) / 0.22), 0.7) * (1 - 0.5 * sm(eu)); }
        for (let i = 0; i < NP; i++) { const a = Math.max(0, i - 1), b = Math.min(NP - 1, i + 1), dx = RXa[b] - RXa[a], dy = RYa[b] - RYa[a], l = Math.hypot(dx, dy) || 1; NX[i] = -dy / l; NY[i] = dx / l; }
        // the runs on this side (front ones dimmed over the pet's body)
        let i0 = -1; for (let i = 0; i <= NP; i++) { const on = i < NP && (RD[i] > 0) === front; if (on && i0 < 0) i0 = Math.max(0, i - 1); if (!on && i0 >= 0) { strip(c, i0, Math.min(NP - 1, i), al * (front ? 0.62 : 1), T, hp); i0 = -1; } }
      }
    }
    function strip(c, a, b, al, T, hp) { if (b - a < 1) return;
      const poly = k => { c.beginPath(); for (let i = a; i <= b; i++) { const w = RW[i] * k * 0.5; i === a ? c.moveTo(RXa[i] + NX[i] * w, RYa[i] + NY[i] * w) : c.lineTo(RXa[i] + NX[i] * w, RYa[i] + NY[i] * w); } for (let i = b; i >= a; i--) { const w = RW[i] * k * 0.5; c.lineTo(RXa[i] - NX[i] * w, RYa[i] - NY[i] * w); } c.closePath(); c.fill(); };
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.globalCompositeOperation = 'lighter'; c.fillStyle = MINT; c.globalAlpha = 0.07 * al; poly(1.7); c.globalAlpha = 0.1 * al; poly(1.3);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgb(18,128,96)'; c.globalAlpha = 0.3 * al; poly(1.0);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgb(120,226,184)'; c.globalAlpha = 0.26 * al; poly(0.7); c.fillStyle = 'rgb(206,250,232)'; c.globalAlpha = 0.16 * al; poly(0.32);
      // the folds where it twists, a crest where it faces the light
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgb(6,70,52)'; c.globalAlpha = 0.2 * al; c.lineWidth = Math.max(1, hp * 0.05); c.beginPath(); let on = false;
      for (let i = a; i <= b; i++) { const f = TW[i] < 0.6; if (f && !on) { c.moveTo(RXa[i], RYa[i]); on = true; } else if (f) c.lineTo(RXa[i], RYa[i]); else on = false; } c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = AIR; c.globalAlpha = 0.28 * al; c.lineWidth = Math.max(1, hp * 0.03); c.beginPath(); on = false;
      for (let i = a; i <= b; i++) { const f = TW[i] > 0.86; if (f && !on) { c.moveTo(RXa[i], RYa[i]); on = true; } else if (f) c.lineTo(RXa[i], RYa[i]); else on = false; } c.stroke();
      // luminous edges (finer and doubled at Adept, a pearly thread at Celestial)
      const edges = k => { c.beginPath(); for (let i = a; i <= b; i++) { const w = RW[i] * 0.5 * k; i === a ? c.moveTo(RXa[i] + NX[i] * w, RYa[i] + NY[i] * w) : c.lineTo(RXa[i] + NX[i] * w, RYa[i] + NY[i] * w); } for (let i = a; i <= b; i++) { const w = RW[i] * 0.5 * k; i === a ? c.moveTo(RXa[i] - NX[i] * w, RYa[i] - NY[i] * w) : c.lineTo(RXa[i] - NX[i] * w, RYa[i] - NY[i] * w); } c.stroke(); };
      c.strokeStyle = MINT; c.globalAlpha = 0.2 * al; c.lineWidth = Math.max(1.5, T * 0.05); edges(0.95);
      c.strokeStyle = AIR; c.globalAlpha = 0.45 * al; c.lineWidth = Math.max(0.8, T * 0.014); edges(0.92);
      if (tier >= 2) { c.strokeStyle = MINT; c.globalAlpha = 0.35 * al; c.lineWidth = Math.max(0.6, T * 0.009); edges(0.6); }
      if (tier >= 3) { c.strokeStyle = ['#FFE3F1', '#E6F7FF', '#F3E9FF'][((lastT * 1.3) | 0) % 3]; c.globalAlpha = 0.4 * al; c.lineWidth = Math.max(0.8, T * 0.018); c.beginPath(); for (let i = a; i <= b; i++) i === a ? c.moveTo(RXa[i] + NX[i] * RW[i] * 0.1, RYa[i] + NY[i] * RW[i] * 0.1) : c.lineTo(RXa[i] + NX[i] * RW[i] * 0.1, RYa[i] + NY[i] * RW[i] * 0.1); c.stroke(); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    /* ---- the orbiting feather wisps and the Windguard emblems ---- */
    function orbiters(c, front) {
      const T = X0.Tz(), hT = petHTof(me), hp = hT * T, Fp = feet(T), t = lastT, eu = F.ending ? cl((t - endT) / 0.95) : 0, al = ribA > 0 ? Math.min(1, sm(t / 0.5)) * (1 - sm(eu * 1.2)) : 0;
      if (al > 0.01) for (const w of wisps) { const sn = Math.sin(w.a); if ((sn > 0) !== front) continue; const r = w.r * hp, X = Fp[0] + Math.cos(w.a) * r, Y = Fp[1] - hp * (w.h + 0.06 * Math.sin(t * 2.2 + w.ph)) + sn * r * 0.42;
        const dir = Math.atan2(Math.cos(w.a) * 0.42 * Math.sign(w.w), -Math.sin(w.a) * Math.sign(w.w)) + Math.PI / 2 + 0.4 * Math.sin(t * 3 + w.ph), b = ((Math.round(dir / TAU * NROT) % NROT) + NROT) % NROT, sz = w.s * hp * 1.6 * (front ? 1 : 0.9), aa = al * (front ? 0.8 : 0.6);
        // (a short soft trail behind it)
        c.save(); c.globalCompositeOperation = 'lighter'; for (let j = 1; j <= 2; j++) { const a2 = w.a - w.w * 0.07 * j, X2 = Fp[0] + Math.cos(a2) * r, Y2 = Fp[1] - hp * (w.h + 0.06 * Math.sin(t * 2.2 + w.ph)) + Math.sin(a2) * r * 0.42, s2 = sz * (0.5 - 0.12 * j); c.globalAlpha = aa * (0.3 - 0.1 * j); c.drawImage(glowSprite(MINT), X2 - s2, Y2 - s2, s2 * 2, s2 * 2); } c.restore();
        c.globalAlpha = aa; c.drawImage(featherSpr(w.v, b), X - sz / 2, Y - sz / 2, sz, sz); }
      c.globalAlpha = 1;
      // the Windguard emblems: circling at the head, a soft halo, bobbing
      for (const e of emb) { const an = t * 1.25 + e.ph, sn = Math.sin(an); const r = hp * 0.72, X = Fp[0] + Math.cos(an) * r, Y = Fp[1] - hp * (1.05 + 0.05 * Math.sin(t * 2.6 + e.ph)) + sn * r * 0.42; e.X = X; e.Y = Y; if ((sn > 0) !== front) continue;
        const k = sm(e.k) * (1 - sm(eu * 1.3)); if (k < 0.01) continue; const sz = hp * 0.62 * (0.85 + 0.15 * (sn + 1) / 2) * (0.6 + 0.4 * k), pul = 0.85 + 0.15 * Math.sin(t * 4 + e.ph);
        glowF(c, X, Y, sz * 1.2, MINT, 0.5 * k * pul); glowF(c, X, Y, sz * 0.45, AIR, 0.4 * k * pul); c.save(); c.translate(X, Y); c.rotate(0.25 * Math.sin(t * 1.8 + e.ph)); c.globalAlpha = k * (front ? 1 : 0.75); c.drawImage(emblemSpr(), -sz / 2, -sz / 2, sz, sz); c.restore(); }
    }
    /* ---- the afterimages: soft mint copies of the pet at its last places ---- */
    function drawGhosts(c) {
      if (!ghosts.length) return; const G = ghostOf(typeof arc !== 'undefined' ? arc.sprites : null), T = X0.Tz(), hT = petHTof(me), hp = hT * T;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const q of ghosts) { const u = (lastT - q.t) / 0.38; if (u >= 1) continue; const a = 0.55 * (1 - u) * (1 - u) * ribA, X = H.sx(q.x), Y = H.sy(q.y) + 0.18 * T - q.z * T;
        if (G) { const k = hp / G.h, w = G.cv.width * k; c.globalAlpha = a; c.save(); c.translate(X, Y); c.scale(q.face < 0 ? -1 : 1, 1); c.drawImage(G.cv, -w / 2, -G.foot * k, w, w); c.restore(); }
        else glowF(c, X, Y - hp * 0.5, hp * 0.6, MINT, a); }
      c.restore();
    }
    /* ---- the block: the ribbons unfolding into enormous butterfly wings round the pet ---- */
    function blockWings(c, front) {
      if (!blks.length) return; const T = X0.Tz(), hT = petHTof(me), hp = hT * T, Fp = feet(T);
      for (const b of blks) { const u = lastT - b.t0; if (u > 0.9) continue; const open = backOut(u / 0.16), fade = 1 - sm((u - 0.34) / 0.5), a = sm(u / 0.05) * fade; if (a < 0.01) continue;
        const L = hp * (1.0 + 1.25 * open) * (1 + 0.12 * sm((u - 0.34) / 0.5)), ang = lerp(-0.9, -0.12, open) + 0.05 * Math.sin(u * 20) * (1 - open * 0.5), rootY = Fp[1] - hp * 0.6, flash = Math.exp(-u * 7);
        if (!front) { wings(c, Fp[0], rootY, L, ang, lerp(0.4, 1, open), a * 0.85, tier, 0.35 * a + 0.5 * flash * a); glowF(c, Fp[0], rootY, L * 0.9, MINT, 0.25 * a); }
        else { // the near halves curling round the front: narrow, faint, the pet seen through them
          wings(c, Fp[0], rootY + hp * 0.04, L * 0.92, ang + 0.15, 0.32, a * 0.22, tier, 0.16 * a + 0.2 * flash * a, 1);
          // the struck side: a bright bloom where the hit met the wing
          const sx = Fp[0] + Math.cos(b.a) * hp * 0.75, sy = rootY + Math.sin(b.a) * hp * 0.4; glowF(c, sx, sy, hp * 0.9, AIR, 0.7 * flash); glowF(c, sx, sy, hp * 0.5, '#FFFFFF', 0.6 * flash); }
      }
    }
    function drawSpiral(c) {
      if (!spiral.length) return; const T = X0.Tz(), hT = petHTof(me), hp = hT * T, Fp = feet(T);
      for (const p of spiral) { const tau = lastT - p.t0; if (tau < 0) continue; const u = cl(tau / 1.25), r = hp * (0.4 + 1.9 * Math.pow(u, 0.75)) * p.k, an = p.a0 + p.dir * u * 4.5, X = Fp[0] + Math.cos(an) * r, Y = Fp[1] - hp * (0.4 + p.hh * 1.6 * u) + Math.sin(an) * r * 0.42;
        const a = sm(tau / 0.1) * (1 - sm((u - 0.55) / 0.45)) * (Math.sin(an) > 0 ? 0.85 : 0.6); if (a < 0.02) continue; const sz = p.s * hp * 2 * (1 - 0.3 * u), bb = ((Math.round((an * 2 + tau * 6) / TAU * NROT) % NROT) + NROT) % NROT;
        c.globalAlpha = a; c.drawImage(featherSpr(p.v, bb), X - sz / 2, Y - sz / 2, sz, sz); }
      c.globalAlpha = 1;
    }
    // (each actor among the others, depth-sorted round the pet: the far side behind it, the near side in front)
    F.drawEnt = (c) => paintEnt(c, false); kid.drawEnt = (c) => paintEnt(c, true);
    function paintEnt(c, front) {
      if (!front) { drawGhosts(c); blockWings(c, false); orbiters(c, false); ribbons(c, false); }
      else { ribbons(c, true); orbiters(c, true); blockWings(c, true); }
    }
    function drawUnder(c) {
      const T = X0.Tz(), hT = petHTof(me), a = ribA; if (a <= 0.01) return;
      // a soft breath of mint light on the floor under the pet
      glowF(c, H.sx(me.x), H.sy(me.y) + 0.18 * T, hT * T * 0.95, MINT, 0.16 * a * (0.85 + 0.15 * Math.sin(lastT * 2.4)), GY);
      for (const b of blks) { const u = lastT - b.t0; if (u > 0.7) continue; const R = hT * T * (0.6 + 2.2 * (1 - Math.pow(1 - cl(u / 0.6), 2))), aa = 0.7 * (1 - sm(u / 0.7)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = aa; c.drawImage(ringSpr(), H.sx(me.x) - R, H.sy(me.y) + 0.18 * T - R * GY, R * 2, R * 2 * GY); c.restore(); }
    }
    function draw(c) {
      drawSpiral(c);
      if (sparks.length) { c.save(); c.globalCompositeOperation = 'lighter'; const gs = glowSprite(MINT); for (const s of sparks) { const u = s.t / s.life; c.globalAlpha = 0.85 * (1 - u); const r = s.s * (1 - 0.5 * u); c.drawImage(gs, s.X - r * 2, s.Y - r * 2, r * 4, r * 4); } c.restore(); }
    }
    return F;
  }

  /* ================= the cast: the leap, the wings, the wingbeat ================= */
  const CROUCH = 0.28, RISE = 0.6, BEAT0 = 0.76, BEAT = 0.86, BEAT1 = 0.95, LAND = 1.16, CAST = 1.42;
  U.zephyrblessing = (C, h) => {
    H = h; const me = H.me, g = H.g, X0 = H.X, ev = evoOf(C), tier = tierOf(ev);
    X0.banner("ZEPHYR'S BLESSING", '', C.col, 1.4); X0.sfx.hum(); me.castT = 0;
    const hold = { vx: 0, vy: 0, t: 0.12 }; let lastT = 0, blessed = false, done = false;
    const SM = { z: 0, sq: 0, armF: 0, armB: 0 };
    const motes = []; for (let i = 0; i < H.n(16 + 4 * tier); i++) motes.push({ a: Math.random() * TAU, d: 1.2 + Math.random() * 1.2, h: Math.random() * 1.4, t0: Math.random() * 0.12, t1: 0.3 + Math.random() * 0.25, s: 0.05 + Math.random() * 0.05 });
    const flyers = [];   // feathers and petals thrown by the wingbeat
    // the pose at time t
    function pose(t) {
      let z = 0, sq = 0, aF = 0, aB = 0;
      if (t < CROUCH) { const u = sm(t / CROUCH); sq = 0.38 * u; aF = -20 * u; aB = -30 * u; }
      else if (t < RISE) { const u = (t - CROUCH) / (RISE - CROUCH); z = 1.05 * (1 - Math.pow(1 - u, 2.4)); sq = u < 0.15 ? lerp(0.38, -0.45, sm(u / 0.15)) : -0.45 * (1 - sm((u - 0.15) / 0.7)); aF = lerp(-20, 135, sm(u / 0.5)); aB = lerp(-30, 120, sm(u / 0.5)); }
      else if (t < BEAT1) { const u = (t - RISE) / (BEAT1 - RISE), bu = sm((t - BEAT0) / (BEAT - BEAT0)); z = 1.05 + 0.1 * Math.sin(Math.PI * u) - 0.12 * bu * 0; sq = 0.1 * Math.sin(Math.PI * cl((t - BEAT0) / (BEAT1 - BEAT0))); aF = lerp(150, 40, bu); aB = lerp(130, 30, bu); }
      else if (t < LAND) { const u = (t - BEAT1) / (LAND - BEAT1); z = 1.05 * (1 - u * u); sq = -0.2 * Math.sin(Math.PI * u); aF = lerp(40, 70, u); aB = lerp(30, 55, u); }
      else { const tau = t - LAND; z = 0; sq = 0.55 * Math.exp(-9 * tau) * Math.cos(15 * tau); const r = sm(tau / 0.25); aF = 70 * (1 - r); aB = 55 * (1 - r); }
      return { z, sq, aF, aB };
    }
    function clearPet() { me.z = 0; me.hopSq = 0; me.hopArmS = null; if (me.push === hold) me.push = null; }
    // the wings this frame: length (pet heights), raise, foreshortening, opacity, glow
    function wingNow(t) {
      if (t < CROUCH + 0.04 || t > LAND + 0.12) return null;
      const open = backOut((t - CROUCH - 0.04) / (RISE - CROUCH)), L = (tier >= 3 ? 1.5 : tier >= 2 ? 1.38 : 1.28) * (0.2 + 0.8 * open);
      let ang = lerp(-1.25, -0.3, open), fx = lerp(0.25, 1, open), glow = 0.25 * open;
      if (t > RISE) { const gu = sm((t - RISE) / (BEAT0 - RISE)); ang = lerp(-0.3, -0.85, gu); fx = lerp(1, 0.92, gu); }
      if (t > BEAT0) { const bu = sm((t - BEAT0) / (BEAT - BEAT0)); ang = lerp(-0.85, 0.62, bu); fx = lerp(0.92, 0.55, Math.sin(Math.PI * cl(bu * 0.9 + 0.1)) * 0.6 + bu * 0.4); glow = 0.25 + 0.7 * Math.sin(Math.PI * bu); }
      if (t > BEAT) { const ru = sm((t - BEAT) / (LAND - BEAT)); ang = lerp(0.62, -0.05, ru); fx = lerp(0.55, 0.85, ru); glow = lerp(0.6, 0.15, ru); }
      const a = sm((t - CROUCH - 0.04) / 0.14) * (1 - sm((t - BEAT1) / (LAND + 0.12 - BEAT1)));
      return { L, ang, fx, a, glow: glow * a };
    }
    const feet = T => [H.sx(me.x), H.sy(me.y) + 0.18 * T - (me.z || 0) * T];
    function beat() {
      const T = X0.Tz(), hT = petHTof(me);
      bless(ev, tier); blessed = true;
      X0.sfx.whoosh(); X0.sfx.sparkle && X0.sfx.sparkle(); X0.shake(4, 0.2); X0.light && X0.light(me.x, me.y, 5, 0.45);
      // feathers and a few petals thrown out on the beat
      const n = H.n(14 + 5 * tier); for (let i = 0; i < n; i++) { const a = i / n * TAU + Math.random() * 0.3, v = 2.2 + Math.random() * 2.2; flyers.push({ x: me.x, y: me.y, z: 0.6 + Math.random() * 0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: 0.6 + Math.random() * 1.2, t: 0, life: 1.0 + Math.random() * 0.5, v: i % 3 === 0 ? 1 : 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, s: 0.15 + Math.random() * 0.06, pk: i % 5 === 0 }); }
      for (let i = 0; i < H.n(16); i++) { const a = Math.random() * TAU, v = 3 + Math.random() * 3; H.P({ kind: 'spark', x: me.x + Math.cos(a) * 0.3, y: me.y + Math.sin(a) * 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.55 - 1, g: 3, life: 0.6, max: 0.6, size: 1.6, color: i % 2 ? MINT : AIR }); }
      void T; void hT;
    }
    const F = H.add({ key: 'zephyr', life: CAST, entY: me.y - 0.004, update, draw, drawUnder, onEnd() { clearPet(); if (!blessed && !me.dead) bless(ev, tier); } });
    F.drawEnt = c => drawWings(c);
    function update(dt, f) {
      const t = f.t; lastT = t;
      if (me.dead) { if (!done) { done = true; clearPet(); f.life = Math.min(f.life, 0.25); } return; }
      if (t < LAND) { me.push = hold; hold.t = 0.12; } else if (me.push === hold) me.push = null;
      const P = pose(t), k = Math.min(1, dt * 30); SM.z = P.z; SM.sq += (P.sq - SM.sq) * Math.min(1, dt * 50); SM.armF += (P.aF - SM.armF) * k; SM.armB += (P.aB - SM.armB) * k;
      me.z = Math.max(0, SM.z); me.hopSq = SM.sq; me.hopArmS = [SM.armF, SM.armB];
      if (me.z > 0.25) me.inv = Math.max(me.inv || 0, 0.08);   // (out of reach in the air, without the hurt blink)
      if (t >= CROUCH && !F._jump) { F._jump = 1; X0.sfx.jump && X0.sfx.jump(); for (let i = 0; i < H.n(8); i++) { const a = Math.random() * TAU, v = 1.2 + Math.random() * 1.5; H.P({ kind: 'smoke', x: me.x + Math.cos(a) * 0.2, y: me.y + Math.sin(a) * 0.1, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5, life: 0.6, max: 0.6, size: 0.16, color: 'rgba(206,232,218,' }); } }
      if (t >= BEAT && !blessed) beat();
      if (t >= LAND && !F._land) { F._land = 1; X0.sfx.stomp && X0.sfx.stomp(); }
      if (t >= LAND + 0.1 && !F._gh) { F._gh = 1; ghostOf(typeof arc !== 'undefined' ? arc.sprites : null); }   // (the afterimage's picture, made in a quiet frame)
      for (const p of flyers) { p.t += dt; const dg = Math.exp(-1.6 * dt); p.vx *= dg; p.vy *= dg; p.vz = p.vz * dg - 1.6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.rot += p.vr * dt; }
      for (let i = flyers.length - 1; i >= 0; i--) if (flyers[i].t >= flyers[i].life) flyers.splice(i, 1);
      F.entY = me.y - 0.004;
      if (WI < WARM.length) warmStep(t < BEAT ? 3 : 1.5);
    }
    function drawWings(c) {
      const W = wingNow(lastT); if (!W) return; const T = X0.Tz(), hT = petHTof(me), hp = hT * T, Fp = feet(T), sq = me.hopSq || 0, rootY = Fp[1] - hp * 0.6 * (1 - sq * 0.3);
      glowF(c, Fp[0], rootY, W.L * hp * 0.9, MINT, 0.18 * W.a);
      wings(c, Fp[0], rootY, W.L * hp, W.ang, W.fx, W.a * 0.8, tier, Math.max(W.glow, 0.22 * W.a));
    }
    function drawUnder(c) {
      const t = lastT, T = X0.Tz(), hT = petHTof(me), X = H.sx(me.x), Y = H.sy(me.y) + 0.18 * T;
      // the gathering: a soft light under the pet, a thin ring tightening
      const ga = sm(t / 0.2) * (1 - sm((t - BEAT) / 0.4)); glowF(c, X, Y, hT * T * 1.1, MINT, 0.3 * ga, GY);
      if (t < RISE + 0.1) { const u = cl(t / (RISE + 0.1)), R = hT * T * lerp(1.7, 0.6, sm(u)), a = 0.55 * sm(u / 0.3) * (1 - sm((u - 0.75) / 0.25)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(ringSpr(), X - R, Y - R * GY, R * 2, R * 2 * GY); c.restore(); }
      // the wingbeat's shockwave: a gentle soft ring rolling out, a second fainter one, gust arcs riding it
      if (t >= BEAT) { const tau = t - BEAT, gs = gustSpr();
        for (const [dl, sp, kR, ka] of [[0, 0.55, 4.6, 0.9], [0.1, 0.6, 3.4, 0.5]]) { const u = cl((tau - dl) / sp); if (u <= 0 || u >= 1) continue; const R = T * (0.4 + kR * C.K * (1 - Math.pow(1 - u, 2.2))), a = ka * (1 - sm((u - 0.3) / 0.7)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(ringSpr(), X - R, Y - R * GY, R * 2, R * 2 * GY); c.restore(); }
        const u = cl(tau / 0.6), R = T * (0.6 + 3.8 * C.K * (1 - Math.pow(1 - u, 2))), a = 0.7 * (1 - sm((u - 0.35) / 0.65)); if (a > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; const n = 9 + tier;
          for (let i = 0; i < n; i++) { const an = i / n * TAU + 0.3 + tau * 0.9, x = X + Math.cos(an) * R, y = Y + Math.sin(an) * R * GY, w = T * (0.9 + 0.25 * tier) * (0.6 + 0.4 * u); c.globalAlpha = a; c.save(); c.translate(x, y); c.rotate(Math.atan2(Math.sin(an) * GY, Math.cos(an)) + Math.PI / 2); c.drawImage(gs, -w / 2, -w * 0.25, w, w * 0.5); c.restore(); } c.restore(); }
        glowF(c, X, Y, T * 2.2, MINT, 0.4 * Math.exp(-tau * 5), GY); }
    }
    function draw(c) {
      const t = lastT, T = X0.Tz(), hT = petHTof(me), hp = hT * T, Fp = feet(T);
      // the gathering motes, drawn in to the pet's back
      if (t < RISE) { c.save(); c.globalCompositeOperation = 'lighter'; const gs = glowSprite(MINT);
        for (const p of motes) { const u = cl((t - p.t0) / p.t1); if (u >= 1 || t < p.t0) continue; const e = sm(u), sx0 = Fp[0] + Math.cos(p.a) * p.d * T, sy0 = Fp[1] - p.h * T + Math.sin(p.a) * p.d * T * 0.5, x = lerp(sx0, Fp[0], e), y = lerp(sy0, Fp[1] - hp * 0.6, e), s = p.s * T * 2 * (1.4 - 0.6 * e);
          c.globalAlpha = Math.min(1, u * 4) * (1 - sm((u - 0.8) / 0.2)); c.drawImage(gs, x - s, y - s, s * 2, s * 2); } c.restore(); }
      // the beat's flash at the pet's back
      if (t >= BEAT) { const k = Math.exp(-(t - BEAT) * 8); glowF(c, Fp[0], Fp[1] - hp * 0.6, hp * 1.4, AIR, 0.5 * k); }
      // the thrown feathers
      for (const p of flyers) { const X = H.sx(p.x), Y = H.sy(p.y) + 0.18 * T - p.z * T, u = p.t / p.life, a = sm(p.t / 0.08) * (1 - sm((u - 0.6) / 0.4)); if (a < 0.02) continue; const sz = p.s * T * 2, b = ((Math.round(p.rot / TAU * NROT) % NROT) + NROT) % NROT;
        c.globalAlpha = a; if (p.pk) { c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(glowSprite(PINK), X - sz * 0.4, Y - sz * 0.4, sz * 0.8, sz * 0.8); c.restore(); } c.drawImage(featherSpr(p.v, b), X - sz / 2, Y - sz / 2, sz, sz); }
      c.globalAlpha = 1;
      // the party strip: a shimmer passing over each pet waiting there (the blessing reaches them too)
    }
    F.drawHud = function (c) { const t = lastT; if (t < BEAT || t > BEAT + 0.9 || !X0.partySlot || !X0.party) return; const u = (t - BEAT) / 0.9;
      X0.party().forEach((m, i) => { const s = X0.partySlot(i); if (!s || m.down) return; const d = u - i * 0.06; if (d <= 0) return; const a = Math.sin(Math.PI * cl(d / 0.8)); glowF(c, s.x, s.y, 26, MINT, 0.55 * a); glowF(c, s.x, s.y, 12, AIR, 0.5 * a); }); };
    return F;
  };
  U.zephyrblessing.warm = () => { if (WI >= WARM.length) return; setTimeout(function step() { if (!warmStep(2)) setTimeout(step, 30); }, 300); };
  // the debug door for the harness
  U.zephyrblessing.__dbg = { get ghostMs() { return GHOST_MS; }, durOf, asOf, chOf, MV, DR, WARM, warmAll: () => warmStep(1e9) };
})();
