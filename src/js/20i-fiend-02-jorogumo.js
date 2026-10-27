/* ---------- JORŌGUMO, the Moonweb Devourer ----------
   An ivory spider the size of a shrine: eight hooked legs that plant and step one by one, clusters of golden eyes, and a
   swollen translucent abdomen full of glowing eggs, trailing ribbons of silk from its spinnerets. Its arena is a moonlit
   clearing in an old forest: raked gravel, a ring of flagstones and six carved stone pillars it strings with tripwires.
   Later it climbs into the dark and hunts through falling silk, lowering itself to lay eggs (its abdomen is soft then).
   In its last act the floor gives way and only its web holds the pet: a strand quivers before every strike along it.
   The Closing Web: four anchor threads fold the web in around the pet; sever one to slip out and throw it off balance. */
FIEND_DEFS.jorogumo = (() => {
  const TAU = Math.PI * 2, PR = 9.5, NP = 6, NR = 18;
  const IVORY = '#E8E0CA', GOLD = '#FFD36B', EGG = '#FFE29A', FANG = '#151018', SILK = '#F4F0E4', VENOM = '#C8F05A';
  // the six pillars stand on whole tiles, so the stone that blocks the pet is the stone that is drawn
  const pillarAt = (C, i) => { const a = -Math.PI / 2 + (i + 0.5) / NP * TAU; return { x: Math.floor(C.x + Math.cos(a) * PR) + 0.5, y: Math.floor(C.y + Math.sin(a) * PR) + 0.5, a, i }; };
  const segD = (px, py, x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, u = clamp(((px - x0) * dx + (py - y0) * dy) / L2, 0, 1); return Math.hypot(px - (x0 + dx * u), py - (y0 + dy * u)); };
  const lerp = (a, b, u) => a + (b - a) * u;
  // each side: angle of the leg from the facing, its reach, and where its hip sits along the cephalothorax
  const LEG = [[0.5, 3.8, 0.34], [1.12, 3.45, 0.12], [1.98, 3.35, -0.1], [2.62, 3.8, -0.3]];
  const STRAND = k => k / NR * TAU + 0.09;
  // the toon palette: cream chitin, gold bands, plum socks, ink outlines
  const CREAM = '#F6EEDB', CREAM_SH = '#D9C8A4', CREAM_SH2 = '#BBA67E', CREAM_FAR = '#CFC2A6', CREAM_FAR_SH = '#AA9A7C', GOLDT = '#F4BE3E', GOLD_SH = '#C88A1A', PLUM = '#5A3A62', PLUM_SH = '#3A2242', LINE = '#33213A', BLUSH = '#FF9AA8';
  return {
    arenaR: 15, firstAct: 'stalk', artY: 0.6, ambient: 'fireflies',
    artPoses: [{ name: 'facing you', mem: { ang: Math.PI / 2 } }, { name: 'side, mid-step', mem: { ang: 0.05, demo: 1 } }, { name: 'from behind', mem: { ang: -Math.PI / 2 + 0.3 } },
      { name: 'rearing, fangs bared', mem: { ang: 1.25, rear: 1, fang: 1 } }, { name: 'foreleg stab', mem: { ang: 1.9, stab: { s: 1, x: 2.6, y: 4.2, t: 0.36, dur: 0.62 } } },
      { name: 'lowered to lay (soft)', mem: { ang: 2.0, fold: 1, lay: 1 }, m: { z: 0.3 } }, { name: 'thrown off balance', mem: { ang: 0.7, tip: 1 } }],
    phaseNames: ['The Shrine of Threads', 'Silk from Above', 'The Web Floor', 'Mother of a Thousand'],
    carve(set, C) { for (let i = 0; i < NP; i++) { const p = pillarAt(C, i); set(Math.floor(p.x), Math.floor(p.y), T_SOLID); } },
    props(C) { const out = []; for (let i = 0; i < NP; i++) out.push(Object.assign({ kind: 'pillar' }, pillarAt(C, i))); return out; },
    /* ---- the arena: a forest shrine under the moon ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd;
      let g = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R + 1.4); g.addColorStop(0, '#1F2A27'); g.addColorStop(0.6, '#18231F'); g.addColorStop(0.92, '#0E1513'); g.addColorStop(1, 'rgba(10,16,14,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
      // moss and loam
      for (let i = 0; i < 110; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, r = 0.5 + rnd() * 2.2, x = Math.cos(a) * d, y = Math.sin(a) * d, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rnd() < 0.55 ? 'rgba(60,96,62,.22)' : 'rgba(0,0,0,.3)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      // the raked gravel garden in the middle
      g = c.createRadialGradient(0, 0, 0.5, 0, 0, 7.2); g.addColorStop(0, '#3A403F'); g.addColorStop(0.85, '#2E3433'); g.addColorStop(1, 'rgba(40,46,44,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 7.2, 0, TAU); c.fill();
      for (let i = 0; i < 1400; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * 6.9; c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(220,226,230,.12)'; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.05, 0.05); }
      c.lineCap = 'round';
      for (let r = 1.7; r < 6.8; r += 0.26) { c.beginPath(); for (let j = 0; j <= 90; j++) { const a = j / 90 * TAU, rr = r + Math.sin(a * 5 + r) * 0.04; j ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 0.07; c.stroke(); c.translate(-0.03, -0.03); c.strokeStyle = 'rgba(225,232,236,.12)'; c.lineWidth = 0.045; c.stroke(); c.translate(0.03, 0.03); }
      // the dais: a worn round stone carved with a web
      g = c.createRadialGradient(-0.3, -0.3, 0.1, 0, 0, 1.6); g.addColorStop(0, '#6A6E70'); g.addColorStop(0.8, '#45494C'); g.addColorStop(1, '#2A2D30'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1.55, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,211,107,.28)'; c.lineWidth = 0.035; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 1.4, Math.sin(a) * 1.4); c.stroke(); } for (let r = 0.35; r < 1.4; r += 0.3) { c.beginPath(); for (let k = 0; k <= 8; k++) { const a = k / 8 * TAU; k ? c.quadraticCurveTo(Math.cos(a - TAU / 16) * r * 0.88, Math.sin(a - TAU / 16) * r * 0.88, Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(r, 0); } c.stroke(); }
      // flagstones in a ring through the pillars
      for (let k = 0; k < 120; k++) {
        const a = k / 120 * TAU + (rnd() - 0.5) * 0.03, rr = PR + (rnd() - 0.5) * 1.5, x = Math.cos(a) * rr, y = Math.sin(a) * rr, s = 0.32 + rnd() * 0.22, n = 5 + Math.floor(rnd() * 3);
        c.beginPath(); for (let j = 0; j < n; j++) { const b = j / n * TAU + rnd() * 0.5, q = s * (0.75 + rnd() * 0.35); j ? c.lineTo(x + Math.cos(b) * q, y + Math.sin(b) * q * 0.9) : c.moveTo(x + Math.cos(b) * q, y + Math.sin(b) * q * 0.9); } c.closePath();
        const sg = c.createLinearGradient(x - s, y - s, x + s, y + s); sg.addColorStop(0, '#62676A'); sg.addColorStop(1, '#2C3033'); c.fillStyle = sg; c.fill(); c.strokeStyle = 'rgba(40,70,44,.7)'; c.lineWidth = 0.06; c.stroke();
      }
      // fallen leaves, gold and rust
      for (let i = 0; i < 170; i++) { const a = rnd() * TAU, d = 2 + Math.sqrt(rnd()) * (R - 2), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.1 + rnd() * 0.12; c.save(); c.translate(x, y); c.rotate(rnd() * TAU); c.fillStyle = ['rgba(214,170,60,.75)', 'rgba(170,80,40,.7)', 'rgba(230,200,110,.6)', 'rgba(120,60,30,.7)'][i % 4]; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(s, -s * 0.8, s * 1.6, s * 0.2, 0, s * 1.3); c.bezierCurveTo(-s * 1.6, s * 0.2, -s, -s * 0.8, 0, 0); c.fill(); c.restore(); }
      // what it has caught before: silk-wrapped bundles near the trees
      for (let i = 0; i < 7; i++) { const a = rnd() * TAU, d = R - 1.4 - rnd() * 1.6, x = Math.cos(a) * d, y = Math.sin(a) * d, L = 0.7 + rnd() * 0.5, rot = rnd() * TAU; c.save(); c.translate(x, y); c.rotate(rot);
        const cg = c.createLinearGradient(0, -0.3, 0, 0.3); cg.addColorStop(0, '#F2EEE2'); cg.addColorStop(1, '#8E8A80'); c.fillStyle = cg; c.beginPath(); c.ellipse(0, 0, L, 0.3, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(80,76,70,.5)'; c.lineWidth = 0.025; for (let j = 0; j < 9; j++) { c.beginPath(); c.moveTo(-L + j * L * 0.22, -0.3); c.lineTo(-L + j * L * 0.22 + 0.3, 0.3); c.stroke(); } c.restore(); }
      // old threads stuck to the ground and two ruined webs at the edge
      c.strokeStyle = 'rgba(240,236,224,.13)'; c.lineWidth = 0.03; for (let i = 0; i < 16; i++) { const a = rnd() * TAU, d = rnd() * R, x = Math.cos(a) * d, y = Math.sin(a) * d, b = rnd() * TAU, L = 2 + rnd() * 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(b) * L, y + Math.sin(b) * L); c.stroke(); }
      [[2.2, R - 2.3], [5.0, R - 2.0]].forEach(([a, d]) => { const x = Math.cos(a) * d, y = Math.sin(a) * d; for (let k = 0; k < 10; k++) { const b = k / 10 * TAU; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(b) * 1.6, y + Math.sin(b) * 1.6); c.stroke(); } for (let r = 0.3; r < 1.6; r += 0.28) { c.beginPath(); c.arc(x, y, r, 0, TAU * 0.8); c.stroke(); } });
      // footings for the pillars
      for (let i = 0; i < NP; i++) { const a = -Math.PI / 2 + (i + 0.5) / NP * TAU, x = Math.cos(a) * PR, y = Math.sin(a) * PR; const fg = c.createRadialGradient(x, y, 0.2, x, y, 1.25); fg.addColorStop(0, '#2A2E30'); fg.addColorStop(0.7, '#3E4245'); fg.addColorStop(1, 'rgba(30,34,36,0)'); c.fillStyle = fg; c.beginPath(); c.arc(x, y, 1.25, 0, TAU); c.fill(); }
      // roots and ferns crossing the rim
      for (let i = 0; i < 26; i++) { const a = rnd() * TAU, x = Math.cos(a) * (R + 0.8), y = Math.sin(a) * (R + 0.8); c.strokeStyle = 'rgba(20,16,12,.9)'; c.lineWidth = 0.18 + rnd() * 0.2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(Math.cos(a + 0.1) * (R - 0.6), Math.sin(a + 0.1) * (R - 0.6), Math.cos(a + (rnd() - 0.5) * 0.3) * (R - 1.4 - rnd()), Math.sin(a + (rnd() - 0.5) * 0.3) * (R - 1.4 - rnd())); c.stroke(); c.strokeStyle = 'rgba(120,110,90,.18)'; c.lineWidth = 0.05; c.stroke(); }
      if (A.FX && A.FX.mem && A.FX.mem.web >= 1) webArt(c, 0, 0, R, 1, 1, {}, 0, false, 0.04);
    },
    /* ---- beyond the clearing: cedars, mist and an enormous moon caught in a web ---- */
    sky(c, W, H, t, cam, T) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05070F'); g.addColorStop(0.45, '#0B1220'); g.addColorStop(1, '#05090B'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const px = (cam.x - 28) * T, py = (cam.y - 28) * T, mx = W * 0.7 - px * 0.06, my = H * 0.15 - py * 0.04, mr = Math.min(W, H) * 0.2;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite('#9FB4FF'), mx - mr * 2.6, my - mr * 2.6, mr * 5.2, mr * 5.2); c.restore();
      const mg = c.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr); mg.addColorStop(0, '#F8FAFF'); mg.addColorStop(0.7, '#D2DAF2'); mg.addColorStop(1, '#9AA6CC'); c.fillStyle = mg; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
      c.fillStyle = 'rgba(120,130,170,.18)'; [[0.3, -0.2, 0.18], [-0.35, 0.25, 0.13], [0.05, 0.4, 0.1], [-0.2, -0.4, 0.08]].forEach(([u, v, r]) => { c.beginPath(); c.arc(mx + u * mr, my + v * mr, r * mr, 0, TAU); c.fill(); });
      // a web strung across the face of the moon
      c.save(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1; const wx = mx - mr * 0.25, wy = my + mr * 0.1;
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + Math.cos(a) * mr * 1.5, wy + Math.sin(a) * mr * 1.5); c.stroke(); }
      for (let r = mr * 0.12; r < mr * 1.4; r += mr * 0.13) { c.beginPath(); for (let k = 0; k <= 12; k++) { const a = k / 12 * TAU; k ? c.quadraticCurveTo(wx + Math.cos(a - TAU / 24) * r * 0.9, wy + Math.sin(a - TAU / 24) * r * 0.9, wx + Math.cos(a) * r, wy + Math.sin(a) * r) : c.moveTo(wx + r, wy); } c.stroke(); }
      c.restore();
      // cedar trunks rising out of view, with a cold rim of moonlight
      for (let i = 0; i < 7; i++) { const x = ((i * 191 + 60) % (W + 260)) - 130 - px * (0.2 + (i % 3) * 0.08), w = 50 + (i % 3) * 30; const tg = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); tg.addColorStop(0, 'rgba(6,8,12,0)'); tg.addColorStop(0.25, 'rgba(8,10,14,.9)'); tg.addColorStop(0.65, 'rgba(14,17,24,.9)'); tg.addColorStop(1, 'rgba(6,8,12,0)'); c.fillStyle = tg; c.fillRect(x - w / 2, 0, w, H);
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { const yy = (k * 97 + i * 41) % H; c.beginPath(); c.moveTo(x - w * 0.3, yy); c.quadraticCurveTo(x, yy + 14, x + w * 0.25, yy + 4); c.stroke(); } }
      // mist drifting in bands
      for (let i = 0; i < 5; i++) { const y = H * (0.25 + i * 0.17) + Math.sin(t * 0.2 + i) * 10 - py * 0.1, mg2 = c.createLinearGradient(0, y - 40, 0, y + 40); mg2.addColorStop(0, 'rgba(160,180,210,0)'); mg2.addColorStop(0.5, 'rgba(160,180,210,.07)'); mg2.addColorStop(1, 'rgba(160,180,210,0)'); c.fillStyle = mg2; c.fillRect(0, y - 40, W, 80); }
    },
    /* ---- living layers: when the floor gives way, a void under a vast web ---- */
    // once the floor has given way for good, the void and its web are painted into the ground itself
    groundKey(FX) { return (FX.mem && FX.mem.web >= 1) ? 'web' : ''; },
    overlay(c, FX, t, T) {
      const M = FX.mem, C = FX.C, w = M.web || 0; if (w <= 0) return;
      const vib = {}; for (const s of FX.S.tele) if (s.strand != null && !s.done) vib[s.strand] = clamp(s.age / s.t, 0, 1);
      // while it falls away the whole web is painted live; after that, only the strands about to be struck
      webArt(c, FX.sx(C.x), FX.sy(C.y), C.R * T, T, w, vib, t, w >= 1, 1);
    },
    /* ---- the fight ---- */
    init(FX) {
      Object.assign(FX.mem, { ang: Math.PI / 2, faceTo: Math.PI / 2, feet: null, rear: 0, fang: 0, fold: 0, tip: 0, lay: 0, crouch: 0, stab: null, web: 0, webFloor: false, sigT: 14, climbT: 6, weaveT: 2.5, strandT: 4 });
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H; M.sigT = Math.min(M.sigT, 6); M.climbT = Math.min(M.climbT, 2.5); M.strandT = 3;
      if (lv === 2) H.banner('It climbs into the dark', 'Silk falls where its shadow hangs: when it lowers itself, strike the abdomen', GOLD, 2.6);
      if (lv >= 3 && !M.webFloor) { M.webFloor = true; M.collapse = 0; H.banner('THE FLOOR GIVES WAY', 'Only its web holds you now: a strand quivers before it strikes', GOLD, 2.8, true); H.shake(18, 1.2); H.sfx.crash(); }
      if (lv === 4) H.banner('Mother of a Thousand', 'Its eggs hatch faster and it never rests', '#FF9A6A', 2.2);
    },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, lv = FX.S.lv, fast = (1 + (lv - 1) * 0.1) * FX.S.fast;
      M.sigT -= dt; M.climbT -= dt; M.weaveT -= dt; M.strandT -= dt;
      const d = FX.dist(m.x, m.y), aPet = FX.angPet(m.x, m.y);
      let tx = null, ty = null, spd = 0; M.faceTo = aPet;
      m.actT += dt;
      switch (m.act) {
        case 'stalk': {   // circles at a spider's distance, never quite still
          M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.32 * (M.dir || 1);
          const R = clamp(d, 5.2, 7.2), p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, m.r);
          tx = p.x; ty = p.y; spd = 4.3 * fast;
          if (m.actT > (lv >= 3 ? 1.25 : 1.8) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; pick(FX, m, d, lv); }
          break; }
        case 'stab': {   // forelegs driven down like spears, one after another, following the pet
          tx = me.x; ty = me.y; spd = 1.4;
          M.stabNext -= dt; if (M.stab) M.stab.t += dt;
          if (M.stabNext <= 0 && M.stabI < M.stabN) { M.stabI++; M.stabNext = 0.5 / fast; const dur = 0.62 / fast, s = M.stabI % 2 ? 1 : -1, lead = 0.18, px = me.x + (me.vx || 0) * lead, py = me.y + (me.vy || 0) * lead;
            M.stab = { s, x: px, y: py, t: 0, dur };
            FX.tele({ shape: 'circle', x: px, y: py, r: 1.15, t: dur, dmg: m.dmg * 1.3, col: GOLD, fn: q => { FX.H.shake(5, 0.15); FX.H.sfx.thud(); FX.H.sparks(q.x, q.y, '#EDE4CC', 10, 6); FX.H.ring(q.x, q.y, 0.2, 1.3, 0.25, GOLD, 0.15); } }); }
          if (M.stabI >= M.stabN && M.stabNext <= -0.25) { m.act = 'stalk'; m.actT = 0; M.stab = null; }
          break; }
        case 'venom': {   // rears up, fangs open, and spits a spray of venom that pools where it lands
          M.rear = Math.min(1, M.rear + dt * 3); M.fang = Math.min(1, M.fang + dt * 3);
          if (m.actT > 0.6 / fast && !M.shot) { M.shot = true; const h = headAt(m, M); FX.fan(h.x, h.y + 1.2, aPet, 5 + lv, 0.95, 6.5, { color: VENOM, core: '#F6FFD8', dmg: m.dmg * 0.5, r: 0.24 }); FX.H.sfx.pop();
            for (let k = 0; k < 2 + (lv >= 3 ? 1 : 0); k++) { const p = FX.clampArena({ x: me.x + FX.rnd(-2.2, 2.2), y: me.y + FX.rnd(-2.2, 2.2) }, 1); FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.1, t: 0.95, dmg: m.dmg * 0.8, col: VENOM, fn: q => venomPool(FX, q.x, q.y) }); } }
          if (m.actT > 1.25 / fast) { m.act = 'stalk'; m.actT = 0; M.shot = false; }
          break; }
        case 'crouch': M.faceTo = M.lg.a; M.crouch = Math.min(1, M.crouch + dt * 3); if (m.actT > M.lg.wait) { m.act = 'leap'; m.actT = 0; FX.H.sfx.whoosh(); } break;
        case 'leap': {   // the whole shrine-sized body in the air
          const L = M.lg, u = clamp(m.actT / 0.5, 0, 1); M.faceTo = L.a; M.crouch = 0; M.fold = Math.sin(u * Math.PI) * 0.7;
          m.x = lerp(L.x0, L.x1, u); m.y = lerp(L.y0, L.y1, u); m.z = Math.sin(u * Math.PI) * 0.55;
          if (u >= 1) { m.z = 0; M.fold = 0; M.feet = null; m.act = 'stalk'; m.actT = 0; silkPatch(FX, m.x, m.y, 2.2); }
          FX.parts(bodyParts(m, M)); return; }
        case 'weave': {   // silk from the spinnerets to the pillars: tripwires across the shrine
          M.rear = Math.min(0.7, M.rear + dt * 2); spd = 0;
          if (m.actT > 1.4) { m.act = 'stalk'; m.actT = 0; }
          break; }
        case 'strands': M.rear = Math.min(0.5, M.rear + dt * 2); M.drum = 1; if (m.actT > 1.7 / fast) { m.act = 'stalk'; m.actT = 0; M.drum = 0; } break;
        case 'closing': spd = 0; M.rear = Math.min(0.8, M.rear + dt * 2); if (!M.cw) { m.act = 'stalk'; m.actT = 0; } break;
        case 'climb': climb(FX, m, dt, lv, fast); return;
      }
      if (m.act !== 'venom' && m.act !== 'weave' && m.act !== 'strands' && m.act !== 'closing') { M.rear = Math.max(0, M.rear - dt * 2.5); M.fang = Math.max(0, M.fang - dt * 2); }
      if (m.act !== 'crouch') M.crouch = Math.max(0, M.crouch - dt * 4);
      if (tx != null) walk(FX, m, tx, ty, spd, dt);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.tip = Math.min(1, M.tip + dt * 4); M.rear = Math.max(0, M.rear - dt * 3); const a = abdAt(m, M); FX.weak('abd', a.x, a.y, 1.3, 2.5, true); if (m.stunT <= 0.05) FX.weak('abd', 0, 0, 0, 0, false); FX.parts(bodyParts(m, M)); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return;
      if (!(m.stunT > 0)) { M.tip = Math.max(0, M.tip - dt * 2); if (FX.S.weak.abd && !(m.act === 'climb' && M.cl && M.cl.st === 'lay')) FX.weak('abd', 0, 0, 0, 0, false); }
      // the floor crumbling away into the dark
      if (M.webFloor && M.collapse < 1) { M.collapse = Math.min(1, M.collapse + dt * 0.55); M.web = M.collapse; if (Math.random() < 0.7) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * FX.C.R; FX.H.part({ kind: 'shard', x: FX.C.x + Math.cos(a) * r, y: FX.C.y + Math.sin(a) * r, vx: FX.rnd(-1, 1), vy: FX.rnd(1, 3), g: 14, life: 0.9, max: 0.9, size: 4 + Math.random() * 5, rot: Math.random() * 6, vr: FX.rnd(-6, 6), color: '#4E5356' }); } }
      // the Closing Web runs on even while the spider reels
      const W = M.cw; if (W) closing(FX, m, W, dt);
    },
    dmgK() { return 1; },
    /* ---- the colossus ---- */
    // the pillars are kept as pictures, each repainted a few times a second in turn
    propKeep: { every: 6, box: p => [-1.3, -4.2, 1.3, 0.7], sig: FX => Math.round((FX.mem.web || 0) * 10) },
    draw(c, FX, m, X, Y, T, t) { drawSpider(c, FX, m, X, Y, T, t); },
    drawProp(c, FX, p, X, Y, T, t) { drawPillar(c, FX, p, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'egg') drawEgg(c, FX, o, X, Y, T, t); else if (o.kind === 'anchor') drawAnchor(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) {
      const M = FX.mem, W = M.cw;
      if (W) drawClosing(c, FX, W, T, t);
      // heavy ropes of silk dropping from the dark where it hunts overhead
      for (const s of FX.S.tele) if (s.silk && !s.done) { const X = FX.sx(s.x), Y = FX.sy(s.y), u = clamp(s.age / s.t, 0, 1); c.save(); c.globalAlpha = 0.25 + u * 0.6; c.strokeStyle = SILK; c.lineWidth = 1 + u * 3; c.beginPath(); c.moveTo(X + Math.sin(t * 3 + s.x) * 6, 0); c.lineTo(X, Y - T * 0.2 - (1 - u) * T * 6); c.stroke(); c.restore(); }
    },
  };
  /* ---- choosing what to do ---- */
  function pick(FX, m, d, lv) {
    const M = FX.mem;
    if (lv >= 2 && M.sigT <= 0) return startClosingWeb(FX, m);
    if (lv >= 2 && M.climbT <= 0) return startClimb(FX, m);
    if (lv >= 3 && M.strandT <= 0) return startStrands(FX, m);
    if (M.weaveT <= 0) return startWeave(FX, m);
    if (d < 4.6) { m.act = 'stab'; m.actT = 0; M.stabN = lv >= 3 ? 4 : 3; M.stabI = 0; M.stabNext = 0; return; }
    if (Math.random() < 0.5) { m.act = 'venom'; m.actT = 0; M.shot = false; return; }
    // the lunge: a crouch, a line on the ground, and a landing that shakes the shrine
    const a = FX.angPet(m.x, m.y), p = FX.clampArena({ x: m.x + Math.cos(a) * Math.min(13, d + 1.5), y: m.y + Math.sin(a) * Math.min(13, d + 1.5) }, m.r), wait = 0.8 / FX.S.fast;
    M.lg = { a, x0: m.x, y0: m.y, x1: p.x, y1: p.y, wait }; m.act = 'crouch'; m.actT = 0;
    FX.tele({ shape: 'line', x: m.x, y: m.y, a, len: Math.hypot(p.x - m.x, p.y - m.y), w: 2.2, t: wait, dmg: 0, col: '#FF9A6A' });
    FX.slam(p.x, p.y, 2.4, wait + 0.5, m.dmg * 1.6, { col: GOLD });
  }
  function walk(FX, m, tx, ty, spd, dt) {
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d < 0.05) return;
    const v = Math.min(spd, d * 3) * dt; let nx = m.x + dx / d * v, ny = m.y + dy / d * v;
    for (const p of FX.S.props) { const ex = nx - p.x, ey = ny - p.y, e = Math.hypot(ex, ey) || 1; if (e < 1.6) { nx = p.x + ex / e * 1.6; ny = p.y + ey / e * 1.6; } }   // it steps around the pillars
    const q = FX.clampArena({ x: nx, y: ny }, m.r * 0.6); m.x = q.x; m.y = q.y;
  }
  function startWeave(FX, m) {
    const M = FX.mem, lv = FX.S.lv, n = 2 + (lv >= 3 ? 1 : 0) + (lv >= 4 ? 1 : 0), used = new Set(), P = FX.S.props;
    m.act = 'weave'; m.actT = 0; M.weaveT = lv >= 3 ? 10 : 13;
    FX.H.sfx.twang();
    for (let k = 0; k < n * 4 && used.size < n; k++) {
      const i = Math.floor(Math.random() * NP), j = (i + (Math.random() < 0.5 ? 2 : 3)) % NP, key = Math.min(i, j) + '-' + Math.max(i, j); if (used.has(key)) continue; used.add(key);
      const a = P[i], b = P[j], ang = Math.atan2(b.y - a.y, b.x - a.x), len = Math.hypot(b.x - a.x, b.y - a.y);
      FX.tele({ shape: 'line', x: a.x, y: a.y, a: ang, len, w: 0.6, t: 1.0, dmg: m.dmg * 0.8, col: SILK, fn: () => wire(FX, a, b, lv) });
    }
  }
  function wire(FX, a, b, lv) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x), len = Math.hypot(b.x - a.x, b.y - a.y);
    FX.hz({ kind: 'wire', shape: 'line', x: a.x, y: a.y, a: ang, len, w: 0.55, life: lv >= 3 ? 16 : 13, dps: FX.m.dmg * 1.0, tick: 0.3, slow: true, col: SILK, draw: (c, z, FX2, T, t) => drawWire(c, FX, z, T, t) });
  }
  function startStrands(FX, m) {
    const M = FX.mem, C = FX.C, me = FX.me, lv = FX.S.lv, fast = FX.S.fast;
    m.act = 'strands'; m.actT = 0; M.strandT = (lv >= 4 ? 6 : 7.5) / fast;
    const pa = Math.atan2(me.y - C.y, me.x - C.x), near = Math.round((pa - 0.09) / TAU * NR), ks = new Set([((near % NR) + NR) % NR]);
    const n = 3 + (lv >= 4 ? 2 : 1); while (ks.size < n) ks.add(Math.floor(Math.random() * NR));
    [...ks].forEach((k, i) => FX.tele({ shape: 'line', x: C.x, y: C.y, a: STRAND(k), len: C.R, w: 1.15, t: (1.05 + i * 0.22) / fast, dmg: m.dmg * 1.35, col: GOLD, strand: k,
      fn: q => { FX.H.shake(6, 0.2); FX.H.sfx.thud(); for (let j = 0; j < 8; j++) { const r = Math.random() * C.R; FX.H.sparks(C.x + Math.cos(q.a) * r, C.y + Math.sin(q.a) * r, GOLD, 2, 5); } } }));
    FX.H.sfx.twang();
  }
  /* ---- overhead: it climbs into the dark, drops silk, then lowers itself to lay ---- */
  function startClimb(FX, m) {
    const M = FX.mem, lv = FX.S.lv; m.act = 'climb'; m.actT = 0; M.climbT = lv >= 4 ? 15 : 19;
    M.cl = { st: 'up', t: 0, next: 1.0, layT: 0.3 }; FX.untarget(true); m.noTouch = true; FX.H.sfx.whoosh();
    if (!M.climbed) { M.climbed = true; FX.H.banner('It climbs into the dark', 'Silk falls where its shadow hangs: keep moving', GOLD, 2.2); }
  }
  function climb(FX, m, dt, lv, fast) {
    const M = FX.mem, me = FX.me, L = M.cl; L.t += dt; M.fold = Math.min(1, M.fold + dt * 3);
    if (L.st === 'up') { m.z = Math.min(3.2, m.z + dt * 2.4); if (m.z >= 3.2) { L.st = 'hunt'; L.t = 0; } }
    else if (L.st === 'hunt') {
      // its shadow drifts after the pet; silk falls in heavy ropes where it hangs
      const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy) || 1, v = Math.min(3.6 * fast, d * 2) * dt; m.x += dx / d * v; m.y += dy / d * v;
      L.next -= dt; if (L.next <= 0) { L.next = (lv >= 4 ? 0.6 : 0.78) / fast; const p = FX.clampArena({ x: me.x + (me.vx || 0) * 0.45 + FX.rnd(-0.6, 0.6), y: me.y + (me.vy || 0) * 0.45 + FX.rnd(-0.6, 0.6) }, 1);
        FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.35, t: 0.95 / fast, dmg: m.dmg * 1.2, col: SILK, silk: true, fn: q => { silkPatch(FX, q.x, q.y, 1.5); FX.H.sfx.thud(); FX.H.shake(4, 0.12); } }); }
      if (L.t > 4.4 + lv * 0.4) { L.st = 'down'; L.t = 0; const p = FX.clampArena({ x: me.x + FX.rnd(-3, 3), y: me.y - FX.rnd(2.5, 4.5) }, 3.5); m.x = p.x; m.y = p.y; }
    } else if (L.st === 'down') { m.z = Math.max(0.32, m.z - dt * 3.2); if (m.z <= 0.32) { L.st = 'lay'; L.t = 0; FX.untarget(false); FX.H.banner('It lowers itself to lay', 'Strike the swollen abdomen before the eggs hatch!', EGG, 1.6); M.layN = 0; } }
    else if (L.st === 'lay') {
      M.lay = Math.min(1, M.lay + dt * 2); const a = abdAt(m, M); FX.weak('abd', a.x, a.y, 1.3, 2.5, true); FX.parts(bodyParts(m, M));
      L.layT -= dt; if (L.layT <= 0 && M.layN < 3 + lv) { L.layT = 0.75; M.layN++; const b = M.ang + Math.PI + FX.rnd(-1.2, 1.2), r = FX.rnd(1.4, 3.6); egg(FX, m.x + Math.cos(b) * r, m.y + Math.sin(b) * r); }
      if (L.t > 4.3) { L.st = 'drop'; L.t = 0; FX.weak('abd', 0, 0, 0, 0, false); FX.slam(m.x, m.y, 2.8, 0.5, m.dmg * 1.5, { col: GOLD }); }
    } else if (L.st === 'drop') { m.z = Math.max(0, m.z - dt * 1.2); M.fold = Math.max(0, 1 - L.t * 3); if (L.t >= 0.5) { m.z = 0; M.fold = 0; M.feet = null; M.lay = 0; m.noTouch = false; m.act = 'stalk'; m.actT = 0; FX.H.shake(10, 0.3); } FX.parts(bodyParts(m, M)); }
  }
  function egg(FX, x, y) {
    const lv = FX.S.lv, p = FX.clampArena({ x, y }, 1.5);
    FX.H.sfx.pop();
    FX.obj({ kind: 'egg', x: p.x, y: p.y, r: 0.55, hp: FX.S.barHP * 0.007, life: lv >= 4 ? 5 : 6.5, born: FX.g.t,
      onExpire: o => { const n = lv >= 3 ? 3 : 2; for (let k = 0; k < n; k++) FX.minion('spiderling', o.x + FX.rnd(-0.6, 0.6), o.y + FX.rnd(-0.6, 0.6)); FX.H.sparks(o.x, o.y, EGG, 14, 6); FX.H.text(o.x, o.y - 0.8, 'Hatched!', EGG, 13); FX.H.sfx.crack && FX.H.sfx.crack(); },
      onKill: o => { FX.H.sparks(o.x, o.y, EGG, 16, 7); FX.H.ring(o.x, o.y, 0.2, 1.2, 0.3, EGG, 0.15); if (Math.random() < 0.3) FX.H.drop('hp', o.x, o.y); } });
  }
  function venomPool(FX, x, y) { FX.hz({ kind: 'venom', x, y, r: 1.05, life: 5, dps: FX.m.dmg * 0.5, tick: 0.35, arm: 0.2, col: VENOM }); }
  function silkPatch(FX, x, y, r) {
    FX.hz({ kind: 'silk', x, y, r, life: 7, slow: true, col: SILK, draw: (c, z, FX2, T, t) => { const X = FX.sx(z.x), Y = FX.sy(z.y), a = Math.min(1, z.age / 0.3, (z.life - z.age) / 1.2), rr = z.r * T; c.globalAlpha = a * 0.75; c.strokeStyle = 'rgba(244,240,228,.7)'; c.lineWidth = 1; for (let k = 0; k < 9; k++) { const b = k / 9 * TAU + z.x; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(b) * rr, Y + Math.sin(b) * rr * 0.8); c.stroke(); } for (let r2 = 0.25; r2 < 1; r2 += 0.22) { c.beginPath(); c.ellipse(X, Y, rr * r2, rr * r2 * 0.8, 0, 0, TAU); c.stroke(); } c.globalAlpha = a * 0.25; c.fillStyle = '#F4F0E4'; c.beginPath(); c.ellipse(X, Y, rr, rr * 0.8, 0, 0, TAU); c.fill(); } });
  }
  /* ---- The Closing Web ---- */
  function startClosingWeb(FX, m) {
    const M = FX.mem, me = FX.me, lv = FX.S.lv;
    M.sigT = lv >= 4 ? 17 : 22; m.act = 'closing'; m.actT = 0;
    const c0 = FX.clampArena({ x: me.x, y: me.y }, 3.5), a0 = Math.random() * TAU, R0 = 7;
    const W = M.cw = { x: c0.x, y: c0.y, R0, R: R0, a0, t: 0, dur: lv >= 4 ? 6.5 : 8, cut: [false, false, false, false], an: [], tk: 0, thrown: false };
    for (let k = 0; k < 4; k++) { const p = anchorPos(FX, W, k); W.an.push(FX.obj({ kind: 'anchor', x: p.x, y: p.y, r: 0.8, hp: FX.S.barHP * 0.02, k, onKill: o => cutAnchor(FX, o.k) })); }
    FX.H.banner('THE CLOSING WEB', 'Four anchors fold the web around you: sever one to escape!', GOLD, 2.8, true); FX.H.sfx.twang();
  }
  function anchorPos(FX, W, k) { const a = W.a0 + k * TAU / 4; return FX.clampArena({ x: W.x + Math.cos(a) * W.R, y: W.y + Math.sin(a) * W.R }, 1); }
  function liveEdges(W) { const out = []; for (let k = 0; k < 4; k++) { const j = (k + 1) % 4; if (!W.cut[k] && !W.cut[j]) out.push([W.an[k], W.an[j]]); } return out; }
  function closing(FX, m, W, dt) {
    const me = FX.me; W.t += dt; const u = clamp(W.t / W.dur, 0, 1); W.R = W.R0 - (W.R0 - 0.7) * u;
    W.an.forEach((o, k) => { if (!W.cut[k]) { const p = anchorPos(FX, W, k); o.x = p.x; o.y = p.y; } });
    W.tk -= dt; if (W.tk <= 0) { W.tk = 0.2; if (liveEdges(W).some(([a, b]) => segD(me.x, me.y, a.x, a.y, b.x, b.y) < 0.45 + me.r * 0.5)) { if (FX.hurt(FX.m.dmg * 0.55)) me.chill = Math.max(me.chill || 0, 0.8); } }
    if (u >= 1) {
      // all four anchors held: the pet is wrapped where it stands
      if (!W.cut.some(Boolean) && inQuad(W, me.x, me.y)) { FX.hurt(FX.m.dmg * 3.2); me.chill = Math.max(me.chill || 0, 2); FX.H.text(me.x, me.y - 1.2, 'COCOONED!', SILK, 18); FX.H.flash(0.3, SILK); }
      W.an.forEach(o => { if (!o.dead) o.dead = true; }); FX.mem.cw = null;
    }
  }
  function inQuad(W, x, y) { let s = 0; for (let k = 0; k < 4; k++) { const a = W.an[k], b = W.an[(k + 1) % 4], cr = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x); s += cr > 0 ? 1 : -1; } return Math.abs(s) === 4; }
  function cutAnchor(FX, k) {
    const M = FX.mem, W = M.cw, m = FX.m; if (!W) return; W.cut[k] = true;
    FX.H.sfx.twang(); FX.H.shake(10, 0.35);
    if (!W.thrown && m && !m.dead) { W.thrown = true; m.stunT = 3.4; FX.H.banner('Anchor severed!', 'The web snaps back: it is thrown off balance, abdomen bare!', GOLD, 1.8); }
  }
  /* ---- where its parts are, as world points (the body rides high on its legs) ---- */
  function bodyH(m, M) { return 1.55 + (m.z || 0) * 4 - (M.crouch || 0) * 0.45; }
  function headAt(m, M) { const fx = Math.cos(M.ang), fy = Math.sin(M.ang), H = bodyH(m, M); return { x: m.x + fx * 1.7, y: m.y + fy * 1.7 - H - 0.2 }; }
  function abdAt(m, M) { const fx = Math.cos(M.ang), fy = Math.sin(M.ang), H = bodyH(m, M); return { x: m.x - fx * 1.5, y: m.y - fy * 1.5 - H - 0.7 }; }
  function bodyParts(m, M) { const fx = Math.cos(M.ang), fy = Math.sin(M.ang), H = bodyH(m, M), out = [{ key: 'ceph', dx: fx * 0.8, dy: fy * 0.8 - H - 0.2, r: 1.05 }, { key: 'abd', dx: -fx * 1.5, dy: -fy * 1.5 - H - 0.7, r: 1.5 }]; if (!(m.z > 0.1)) out.push({ key: 'legs', dx: 0, dy: -0.5, r: 2.1 }); return out; }
  /* ---- the legs: each foot is planted on the ground and steps when the body has moved on, in alternating sets of four ---- */
  function hipOf(m, M, s, i) { const fx = Math.cos(M.ang), fy = Math.sin(M.ang), o = LEG[i][2] * 1.2; return [m.x + fx * (0.85 + o) - fy * s * 0.55, m.y + fy * (0.85 + o) + fx * s * 0.55]; }
  function restOf(m, M, s, i) { const [hx, hy] = hipOf(m, M, s, i), a = M.ang + s * LEG[i][0], L = LEG[i][1]; return [hx + Math.cos(a) * L, hy + Math.sin(a) * L]; }
  function rig(m, M, dt) {
    if (!M.feet) { M.feet = []; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const [x, y] = restOf(m, M, s, i), grp = (i + (s > 0 ? 1 : 0)) % 2; let fx = x, fy = y, lift = 0; if (M.demo) { const k = grp ? 0.55 : -0.45; fx += Math.cos(M.ang) * k; fy += Math.sin(M.ang) * k; lift = grp ? 0.55 : 0; } M.feet.push({ s, i, grp, x: fx, y: fy, lift, u: 1, x0: fx, y0: fy, x1: fx, y1: fy, dur: 0.2 }); } M.lx = m.x; M.ly = m.y; }
    const vx = (m.x - M.lx) / Math.max(dt, 1e-3), vy = (m.y - M.ly) / Math.max(dt, 1e-3), sp = Math.hypot(vx, vy); M.lx = m.x; M.ly = m.y;
    if (dt <= 0 || M.demo) return;
    const busy = [0, 0]; M.feet.forEach(f => { if (f.u < 1) busy[f.grp]++; });
    for (const f of M.feet) {
      if (f.u < 1) { f.u = Math.min(1, f.u + dt / f.dur); const e = f.u * f.u * (3 - 2 * f.u); f.x = lerp(f.x0, f.x1, e); f.y = lerp(f.y0, f.y1, e); f.lift = Math.sin(f.u * Math.PI) * 0.7; if (f.u >= 1) { f.lift = 0; M.stepDust = (M.stepDust || []); M.stepDust.push([f.x, f.y]); } continue; }
      const [rx, ry] = restOf(m, M, f.s, f.i), d = Math.hypot(f.x - rx, f.y - ry);
      if (d > (sp > 0.6 ? 0.95 : 0.4) && !busy[1 - f.grp]) { f.u = 0; f.x0 = f.x; f.y0 = f.y; f.x1 = rx + vx * 0.2; f.y1 = ry + vy * 0.2; f.dur = 0.16 + 0.08 * (1 - Math.min(1, sp / 6)); busy[f.grp]++; }
    }
  }
  /* ---- painting it ---- */
  function drawSpider(c, FX, m, X, Y, T, t) {
    const K = FX.K, M = FX.mem; if (M.ang == null) M.ang = Math.PI / 2;
    const dt = clamp(t - (M.rt == null ? t : M.rt), 0, 0.05); M.rt = t;
    if (!(m.z > 0.05) && !(M.fold > 0.5)) rig(m, M, dt); else M.feet = M.feet && M.fold > 0.95 ? null : M.feet;
    if (M.stepDust && M.stepDust.length) { if (FX.H.part) M.stepDust.forEach(([x, y]) => { for (let k = 0; k < 2; k++) FX.H.part({ kind: 'smoke', x: x + FX.rnd(-0.2, 0.2), y, vx: FX.rnd(-0.6, 0.6), vy: -0.3, life: 0.5, max: 0.5, size: 0.25, color: 'rgba(170,180,175,' }); }); M.stepDust.length = 0; }
    // ease its turning toward its prey
    M.ang = K.lerpA(M.ang, M.faceTo == null ? M.ang : M.faceTo, Math.min(1, dt * 3.2)); m.face = Math.cos(M.ang) >= 0 ? 1 : -1;
    const zl = (m.z || 0) * 4, Yg = Y + zl * T;
    if (!M.feet) rig(m, M, 0);
    K.shade(c, X, Yg + T * 0.1, T * 3.6, T * 2.6, 0.58 * Math.max(0.25, 1 - (m.z || 0) * 0.3));
    if (m.z > 0.05) { c.save(); c.strokeStyle = 'rgba(244,240,228,.75)'; c.lineWidth = Math.max(1.2, T * 0.06); c.beginPath(); c.moveTo(X - Math.cos(M.ang) * 1.5 * T, Y - T * 3.4); c.lineTo(X - Math.cos(M.ang) * 1.5 * T + Math.sin(t) * 3, -10); c.stroke(); c.restore(); }
    if (Y < -T * 7) return;   // high in the dark: only its shadow and its thread
    K.stage(c, 'jorogumo', X, Y, T * 11, T * 13.2, T * 5, (a, step) => paintSpider(a, FX, K, m, M, T, t, zl, step),
      { key: 'rgba(214,226,255,1)', keyA: 0.3, rim: GOLD, rimA: 0.22, ao: 0.42, side: 0.3, off: 0.004, steps: 2, t: K.fightT(FX, t), sig: Math.round(T * 8) });
  }
  function paintSpider(c, FX, K, m, M, T, t, zl, step) {
    const th = M.ang, fx = Math.cos(th), fy = Math.sin(th), fold = M.fold || 0, tip = M.tip || 0, rear = M.rear || 0, lay = M.lay || 0, crouch = M.crouch || 0;
    const H = 1.55 + Math.sin(t * 2.1) * 0.04 - crouch * 0.45 + zl;
    const P3 = (x, y, z) => [(x - m.x) * T, (y - m.y) * T - (z - zl) * T];
    // the two halves of the body, as ellipsoids
    const roll = tip * 0.45, cg = [m.x + fx * 0.85 - fy * roll * 0.5, m.y + fy * 0.85 + fx * roll * 0.5, H + 0.25 + rear * 0.55 - tip * 0.35];
    const ag = [m.x - fx * 1.85 - fy * roll, m.y - fy * 1.85 + fx * roll, H + 0.85 - rear * 0.25 - lay * 0.35 - tip * 0.5 + Math.sin(t * 1.4) * 0.05];
    const CA = [1.2, 0.98, 0.68], AA = [2.2 + lay * 0.1, 1.78 + lay * 0.12, 1.42 + lay * 0.08];
    const legs = M.feet.map(f => legGeo(f));
    function legGeo(f) {
      const [ang] = LEG[f.i], s = f.s, [hx, hy] = hipOf(m, M, s, f.i), hz = cg[2] - 0.1;
      let px = f.x, py = f.y, pz = f.lift || 0;
      if (fold > 0) { const da = th + s * ang, qx = hx + Math.cos(da) * 1.25, qy = hy + Math.sin(da) * 1.25, qz = hz + 0.7 - (f.i === 3 ? 0.9 : 0); px = lerp(px, qx, fold); py = lerp(py, qy, fold); pz = lerp(pz, qz, fold); }
      if (rear > 0 && f.i < 2) { const qx = hx + fx * (1.7 - f.i * 0.5) - fy * s * (0.7 + f.i * 0.7), qy = hy + fy * (1.7 - f.i * 0.5) + fx * s * (0.7 + f.i * 0.7), qz = hz + 1.2 - f.i * 0.45 + Math.sin(t * 7 + s + f.i) * 0.12; const k = rear * (1 - fold); px = lerp(px, qx, k); py = lerp(py, qy, k); pz = lerp(pz, qz, k); }
      if (M.stab && f.i === 0 && f.s === M.stab.s) { const u = clamp(M.stab.t / M.stab.dur, 0, 1), up = u < 0.78 ? Math.sin(u / 0.78 * Math.PI / 2) : 1 - (u - 0.78) / 0.22; px = lerp(hx + fx * 1.6, M.stab.x, 0.35 + u * 0.65); py = lerp(hy + fy * 1.6, M.stab.y, 0.35 + u * 0.65); pz = 0.05 + up * 3.1; }
      if (M.drum && f.i < 2) pz += Math.abs(Math.sin(t * 16 + f.i * 1.3 + s)) * 0.5;
      if (tip > 0) pz += Math.abs(Math.sin(t * 8 + f.i * 1.7 + s)) * tip * 0.9;
      const gx = px - hx, gy = py - hy;
      const knee = [hx + gx * 0.3, hy + gy * 0.3, Math.max(hz, pz) + 1.9 + (f.i === 0 ? 0.3 : 0) - fold * 0.9];
      const ank = [hx + gx * 0.76, hy + gy * 0.76, pz + 0.95 * (1 - fold * 0.5)];
      return { f, hip: [hx, hy, hz], knee, ank, foot: [px, py, pz], depth: py };
    }
    const dk = (col, k) => K.sh(col, k);
    function paintLeg(L) {
      const far = (L.foot[1] - m.y) < -0.4 ? 1 : 0, col = dk(IVORY, far ? -0.32 : -0.06);
      const hip = P3(...L.hip), knee = P3(...L.knee), ank = P3(...L.ank), foot = P3(...L.foot);
      const outX = (foot[0] - hip[0]), outY = (foot[1] - hip[1]), ol = Math.hypot(outX, outY) || 1;
      const mid = (a, b, k, bx, by) => [(a[0] + b[0]) / 2 + bx * k, (a[1] + b[1]) / 2 + by * k];
      const o = { col, tex: 'chitin', texA: 0.9, texS: 0.35, dk: '#141020', dkA: 0.7, hi: '#FFFFFF', hiA: 0.25, rim: GOLD, rimA: 0.14 };
      K.tube(c, [hip, mid(hip, knee, T * 0.14, outX / ol, -0.6), knee], u => T * (0.4 - u * 0.12), o);
      K.tube(c, [knee, mid(knee, ank, T * 0.12, outX / ol, -0.2), ank], u => T * (0.27 - u * 0.09), o);
      // the hooked tarsus, darkening to a black claw
      const tipP = [foot[0] - outX / ol * T * 0.18, foot[1] - T * 0.16];
      K.tube(c, [ank, mid(ank, foot, T * 0.14, outX / ol, -0.2), foot, tipP], u => T * (0.17 * (1 - u) + 0.03), Object.assign({}, o, { col: dk(IVORY, far ? -0.45 : -0.2), inner: (A, B) => { c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(ank[0], ank[1], foot[0], foot[1]); g.addColorStop(0, 'rgba(20,14,24,0)'); g.addColorStop(0.6, 'rgba(20,14,24,.55)'); g.addColorStop(1, 'rgba(10,6,12,.95)'); c.fillStyle = g; c.fillRect(Math.min(ank[0], tipP[0]) - T, Math.min(ank[1], tipP[1]) - T, Math.abs(tipP[0] - ank[0]) + T * 2, Math.abs(tipP[1] - ank[1]) + T * 2); c.globalCompositeOperation = 'source-over'; } }));
      // joints: dark sockets ringed with gold
      [[knee, 0.21], [ank, 0.15]].forEach(([p, r]) => { K.body(c, K.ellP(c, p[0], p[1], T * r, T * r * 0.85), p[0], p[1], T * r, { col: '#2A2230', hi: '#6A5A70', spec: 0.5, ao: 0.2 }); c.save(); c.strokeStyle = far ? 'rgba(200,154,58,.5)' : 'rgba(255,211,107,.85)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.ellipse(p[0], p[1], T * r * 1.05, T * r * 0.9, 0, 0, TAU); c.stroke(); c.restore(); });
      // fine bristles along the femur
      c.save(); c.strokeStyle = far ? 'rgba(40,34,48,.35)' : 'rgba(60,50,64,.45)'; c.lineWidth = 0.8; for (let k = 1; k < 7; k++) { const u = k / 7, x = lerp(hip[0], knee[0], u), y = lerp(hip[1], knee[1], u); c.beginPath(); c.moveTo(x, y); c.lineTo(x + T * 0.12, y - T * 0.1); c.stroke(); } c.restore();
    }
    const ellipsoid = (g, A) => { const [ex, ey, rot] = K.ell3(A[0], A[1], A[2], th), p = P3(g[0], g[1], g[2]); return { p, rx: ex * T, ry: ey * T, rot }; };
    const surf = (g, A, u, v, lift) => K.surf3(P3, g[0], g[1], g[2], A[0], A[1], A[2], th, u, v, lift);
    function paintAbdomen() {
      const E = ellipsoid(ag, AA), path = K.ellP(c, E.p[0], E.p[1], E.rx, E.ry, E.rot);
      // the ribbons of silk trailing from the spinnerets
      const sp = surf(ag, AA, -0.97, 0, -0.3);
      for (let k = 0; k < 3; k++) { const pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10, wx = ag[0] - fx * (AA[0] + u * 3.2) - fy * (k - 1) * u * 0.9, wy = ag[1] - fy * (AA[0] + u * 3.2) + fx * (k - 1) * u * 0.9, wz = Math.max(0.05, ag[2] - 0.4 - u * (ag[2] - 0.2) * 1.1); const q = P3(wx, wy, wz); pts.push([q[0] + Math.sin(t * 2.4 + u * 5 + k * 2) * T * 0.3 * u, q[1] + Math.cos(t * 1.9 + u * 4 + k) * T * 0.12 * u]); }
        pts[0] = sp; c.save(); c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); c.globalAlpha = 0.55; c.strokeStyle = SILK; c.lineWidth = Math.max(1, T * 0.05); c.stroke(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; c.lineWidth = Math.max(2, T * 0.16); c.stroke(); c.restore(); }
      K.body(c, path, E.p[0], E.p[1], Math.max(E.rx, E.ry), { col: '#D2CCBC', hi: '#FFFBEF', dk: '#6E6E86', dk2: '#3A3A52', tex: 'silk', texA: 0.5, texS: 0.5, rim: GOLD, rimA: 0.35, rimW: 0.08, spec: 0.6, specR: 0.22, ao: 0.22, aoA: 0.4,
        inner: () => {
          // the eggs inside, glowing through the skin
          c.save(); c.globalCompositeOperation = 'lighter'; const R = mulberry32(7);
          for (let k = 0; k < 16; k++) { const u = (R() - 0.5) * 1.5, v = (R() - 0.5) * 1.4, q = surf(ag, AA, u * 0.8, v * 0.8, -AA[2] * (0.35 + R() * 0.3)), pul = 0.6 + 0.4 * Math.sin(t * (1.5 + R()) + k), r = T * (0.22 + R() * 0.2) * (1 + lay * 0.15); c.globalAlpha = (0.45 + lay * 0.3) * pul; blitSized(c, glowSprite('#FFB840'), q[0] - r * 2, q[1] - r * 2, r * 4, r * 4); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.35 + 0.2 * pul; const eg = c.createRadialGradient(q[0] - r * 0.3, q[1] - r * 0.3, 0, q[0], q[1], r); eg.addColorStop(0, '#FFF6D0'); eg.addColorStop(0.6, '#F0B850'); eg.addColorStop(1, 'rgba(160,100,30,0)'); c.fillStyle = eg; c.beginPath(); c.arc(q[0], q[1], r, 0, TAU); c.fill(); c.globalCompositeOperation = 'lighter'; }
          // warm light scattering through the lower half
          const sg = c.createRadialGradient(E.p[0], E.p[1] + E.ry * 0.5, 0, E.p[0], E.p[1] + E.ry * 0.5, E.rx * 1.1); sg.addColorStop(0, `rgba(255,190,90,${0.28 + lay * 0.2})`); sg.addColorStop(1, 'rgba(255,190,90,0)'); c.globalAlpha = 1; c.fillStyle = sg; c.fillRect(E.p[0] - E.rx * 1.2, E.p[1] - E.ry * 1.2, E.rx * 2.4, E.ry * 2.4);
          c.restore();
          // golden bands across the back, following its curve, and a spine of gold beads
          c.save(); c.lineCap = 'round';
          for (let k = 0; k < 4; k++) { const u = 0.45 - k * 0.3; for (const s of [-1, 1]) { c.beginPath(); for (let j = 0; j <= 8; j++) { const v = s * (0.12 + j / 8 * 0.62), q = surf(ag, AA, u - v * v * 0.25 + Math.sin(j * 1.3 + k) * 0.02, v * Math.sqrt(Math.max(0, 1 - u * u))); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.strokeStyle = 'rgba(90,70,50,.3)'; c.lineWidth = Math.max(1.5, T * 0.09); c.stroke(); c.strokeStyle = 'rgba(232,180,70,.6)'; c.lineWidth = Math.max(1, T * 0.03); c.stroke(); } }
          for (let k = 0; k < 7; k++) { const u = 0.7 - k * 0.22, q = surf(ag, AA, u, 0, 0.02), r = T * (0.11 - k * 0.008); c.fillStyle = 'rgba(150,100,30,.8)'; c.beginPath(); c.moveTo(q[0], q[1] - r * 1.4); c.lineTo(q[0] + r, q[1]); c.lineTo(q[0], q[1] + r * 1.4); c.lineTo(q[0] - r, q[1]); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,226,140,.9)'; c.beginPath(); c.arc(q[0] - r * 0.2, q[1] - r * 0.3, r * 0.4, 0, TAU); c.fill(); }
          c.restore();
        } });
      // the spinnerets
      const s0 = surf(ag, AA, -0.92, 0, -0.25); K.body(c, K.ellP(c, s0[0], s0[1], T * 0.22, T * 0.16), s0[0], s0[1], T * 0.22, { col: '#C8C0AE', spec: 0.4, ao: 0.2 });
    }
    function paintCeph() {
      const E = ellipsoid(cg, CA), path = K.ellP(c, E.p[0], E.p[1], E.rx, E.ry, E.rot), front = fy > -0.55;
      const fang = M.fang || 0;
      // pedipalps and chelicerae hang below the front
      const chel = s => { const b = surf(cg, CA, 0.88, s * 0.3, -0.4), tip2 = P3(cg[0] + fx * 1.45 - fy * s * 0.32, cg[1] + fy * 1.45 + fx * s * 0.32, cg[2] - 0.85 + fang * 0.25);
        K.tube(c, [b, [(b[0] + tip2[0]) / 2, (b[1] + tip2[1]) / 2 - T * 0.05], tip2], u => T * (0.3 - u * 0.12), { col: '#D6CCB4', tex: 'chitin', texA: 0.8, texS: 0.3, dk: '#2A2230', dkA: 0.5, hiA: 0.25 });
        // the fang: a black hook that swings open
        const fa = Math.atan2(fy, fx) + s * (0.6 + fang * 0.9), fl = T * (0.55 + fang * 0.15), f1 = [tip2[0] + Math.cos(fa) * fl * 0.5, tip2[1] + Math.sin(fa) * fl * 0.3 + fl * 0.4], f2 = [tip2[0] + Math.cos(fa - s * 0.9) * fl * 0.7, tip2[1] + fl * 0.75];
        K.tube(c, [tip2, f1, f2], u => T * (0.12 * (1 - u) + 0.015), { col: FANG, hi: '#9A8AB0', hiA: 0.5, dkA: 0.3 });
        if (fang > 0.3) K.glow(c, f2[0], f2[1], T * 0.25, VENOM, fang * 0.6); };
      const palp = s => { const b = surf(cg, CA, 0.7, s * 0.6, -0.4), f2 = P3(cg[0] + fx * 1.75 - fy * s * 0.7, cg[1] + fy * 1.75 + fx * s * 0.7, cg[2] - 0.9 + rear * 0.7), k2 = [(b[0] + f2[0]) / 2, Math.min(b[1], f2[1]) - T * 0.3]; K.tube(c, [b, k2, f2], u => T * (0.2 - u * 0.08), { col: dk(IVORY, -0.15), tex: 'chitin', texA: 0.8, dk: '#2A2230', dkA: 0.5 }); };
      if (!front) { K.body(c, path, E.p[0], E.p[1], Math.max(E.rx, E.ry), { col: IVORY, hi: '#FFFFFF', dk: '#8A8A9A', dk2: '#40405A', tex: 'chitin', texA: 0.75, texS: 0.4, rim: GOLD, rimA: 0.3, spec: 0.5, ao: 0.25 }); return; }
      [-1, 1].forEach(palp); [-1, 1].forEach(chel);
      K.body(c, path, E.p[0], E.p[1], Math.max(E.rx, E.ry), { col: IVORY, hi: '#FFFFFF', dk: '#8A8A9A', dk2: '#40405A', tex: 'chitin', texA: 0.75, texS: 0.4, rim: GOLD, rimA: 0.3, spec: 0.5, ao: 0.25,
        inner: () => {
          // the carapace: a central furrow and radiating grooves
          c.save(); c.strokeStyle = 'rgba(60,54,70,.5)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); for (let j = 0; j <= 10; j++) { const q = surf(cg, CA, -0.8 + j * 0.13, 0); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
          c.lineWidth = Math.max(0.8, T * 0.03); for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { const a = surf(cg, CA, -0.1 - k * 0.12, s * 0.08), b = surf(cg, CA, -0.2 - k * 0.15, s * 0.75); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); } c.restore();
        } });
      // the golden eyes, two great ones and six lesser, clustered on the brow
      const eyes = [[0.8, 0.17, 0.17], [0.8, -0.17, 0.17], [0.66, 0.36, 0.11], [0.66, -0.36, 0.11], [0.56, 0.17, 0.08], [0.56, -0.17, 0.08], [0.6, 0.55, 0.07], [0.6, -0.55, 0.07]];
      const vis = clamp((fy + 0.55) / 0.5, 0, 1);
      eyes.forEach(([u, v, r]) => { const q = surf(cg, CA, u, v, 0.02), rr = T * r * 1.25; c.save(); c.globalAlpha = vis; const g = c.createRadialGradient(q[0] - rr * 0.3, q[1] - rr * 0.35, rr * 0.05, q[0], q[1], rr); g.addColorStop(0, '#FFF6C8'); g.addColorStop(0.35, GOLD); g.addColorStop(0.8, '#8A5410'); g.addColorStop(1, '#2A1404'); c.fillStyle = g; c.beginPath(); c.arc(q[0], q[1], rr, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(q[0] - rr * 0.35, q[1] - rr * 0.35, rr * 0.28, rr * 0.18, -0.6, 0, TAU); c.fill(); c.restore(); K.glow(c, q[0], q[1], rr * 2.6, GOLD, 0.35 * vis); });
    }
    // depth: what is farther from the camera is painted first
    const back = legs.filter(L => L.depth - m.y < -0.35).sort((a, b) => a.depth - b.depth), frontL = legs.filter(L => L.depth - m.y >= -0.35).sort((a, b) => a.depth - b.depth);
    // kept, it is painted in two steps: the far legs and the farther half of the body, then the nearer half and the near legs
    if (step !== 1) { back.forEach(paintLeg); if (fy >= 0) paintAbdomen(); else paintCeph(); }
    if (step !== 0) { if (fy >= 0) paintCeph(); else paintAbdomen(); frontL.forEach(paintLeg); }
  }
  /* ---- scenery and things on the field ---- */
  /* the void under the web floor and the web strung across it: drawn on the screen while the floor falls away (and for
     the strands about to be struck), and into the ground once it has gone (px: one pixel in the units it is drawn in) */
  function webArt(c, X, Y, R, T, w, vib, t, onlyVib, px) {
    c.save();
    if (!onlyVib) {
      c.globalAlpha = Math.min(1, w) * 0.94;
      const g = c.createRadialGradient(X, Y, R * 0.05, X, Y, R * 1.08); g.addColorStop(0, '#010205'); g.addColorStop(0.7, '#04060C'); g.addColorStop(1, 'rgba(6,9,16,0)'); c.fillStyle = g; c.beginPath(); c.arc(X, Y, R * 1.08, 0, TAU); c.fill();
      // far below, the moon's reflection on black water
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12 * w; blitSized(c, glowSprite('#9FB4FF'), X + R * 0.2 - R * 0.4, Y - R * 0.3 - R * 0.4, R * 0.8, R * 0.8); c.globalCompositeOperation = 'source-over';
    }
    // the strands: any strand about to be struck quivers and burns gold
    for (let k = 0; k < NR; k++) {
      const a = STRAND(k), v = vib[k], ca = Math.cos(a), sa = Math.sin(a);
      if (onlyVib && v == null) continue;
      c.globalAlpha = w * (v != null ? 1 : 0.6); c.strokeStyle = v != null ? `rgba(255,${220 - v * 60},${140 - v * 80},${0.6 + v * 0.4})` : 'rgba(236,236,226,.55)'; c.lineWidth = Math.max(px, T * (v != null ? 0.09 : 0.055));
      c.beginPath(); for (let j = 0; j <= 30; j++) { const u = j / 30, off = v != null ? Math.sin(u * 26 - t * 50) * T * 0.16 * v * Math.sin(u * Math.PI) : 0, r = u * R; const x = X + ca * r - sa * off, y = Y + sa * r + ca * off; j ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      if (v != null) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = w * v * 0.5; c.lineWidth = T * 0.3; c.strokeStyle = 'rgba(255,190,80,.35)'; c.stroke(); c.globalCompositeOperation = 'source-over'; }
    }
    if (!onlyVib) { c.globalAlpha = w * 0.55; c.strokeStyle = 'rgba(236,236,226,.6)'; c.lineWidth = Math.max(px, T * 0.045);
      for (let j = 0; j < 13; j++) { const r = (1.0 + j * 1.08) * T; c.beginPath(); for (let k = 0; k <= NR; k++) { const a = STRAND(k), a0 = STRAND(k - 1) + TAU / NR / 2; k ? c.quadraticCurveTo(X + Math.cos(a0) * r * 0.9, Y + Math.sin(a0) * r * 0.9, X + Math.cos(a) * r, Y + Math.sin(a) * r) : c.moveTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); } c.stroke(); } }
    c.restore();
  }
  function drawPillar(c, FX, p, X, Y, T, t) {
    const K = FX.K, r = T * 0.64, h = T * 3.3, web = FX.mem.web || 0;
    K.shade(c, X, Y + T * 0.08, r * 1.7, r * 0.62, 0.6);
    const path = () => { c.beginPath(); c.moveTo(X - r, Y); c.lineTo(X - r * 0.9, Y - h); c.ellipse(X, Y - h, r * 0.9, r * 0.32, 0, Math.PI, 0); c.lineTo(X + r, Y); c.ellipse(X, Y, r, r * 0.36, 0, 0, Math.PI); c.closePath(); };
    K.body(c, path, X, Y - h * 0.5, h * 0.62, { col: '#5A5F66', hi: '#A2ACBC', dk: '#22252C', dk2: '#121418', tex: 'stone', texA: 0.95, texS: 0.45, rim: GOLD, rimA: 0.1, spec: 0.1, lx: -0.7, ly: -0.15, ao: 0.18 });
    // carved bands and a worn sigil
    c.save(); [0.16, 0.84].forEach(v => { const yy = Y - h * v; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(1, T * 0.07); c.beginPath(); c.ellipse(X, yy, r * 0.97, r * 0.33, 0, 0.05, Math.PI - 0.05); c.stroke(); c.strokeStyle = 'rgba(200,210,230,.18)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(X, yy - T * 0.05, r * 0.97, r * 0.33, 0, 0.1, Math.PI - 0.1); c.stroke(); });
    c.strokeStyle = 'rgba(255,211,107,.22)'; c.lineWidth = Math.max(1, T * 0.035); const sy = Y - h * 0.38; c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.moveTo(X - r * 0.15, sy); c.lineTo(X - r * 0.15 + Math.cos(a) * r * 0.4, sy + Math.sin(a) * r * 0.4); } c.stroke(); c.restore();
    // a sacred rope of twisted straw, with paper charms that stir in the air
    const ry = Y - h * 0.63; c.save(); c.lineCap = 'round';
    for (let k = 0; k < 2; k++) { c.strokeStyle = k ? '#B89A5A' : '#6A5430'; c.lineWidth = Math.max(1.5, T * (k ? 0.08 : 0.14)); c.beginPath(); for (let j = 0; j <= 16; j++) { const a = Math.PI * j / 16, x = X - Math.cos(a) * r * 1.04, y = ry + Math.sin(a) * r * 0.36 + Math.sin(j * 1.6 + k * 1.5) * T * 0.04; j ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    [-0.55, 0.05, 0.6].forEach((u, k) => { const x = X + u * r, y = ry + Math.sqrt(1 - u * u) * r * 0.36, sw = Math.sin(t * 1.6 + k * 2 + p.i) * 0.2; c.save(); c.translate(x, y); c.rotate(sw); c.fillStyle = '#ECE8DC'; c.strokeStyle = 'rgba(60,56,50,.5)'; c.lineWidth = 0.8; const w = T * 0.13, s2 = T * 0.17; c.beginPath(); c.moveTo(-w, 0); c.lineTo(w, 0); c.lineTo(w, s2); c.lineTo(-w * 0.2, s2); c.lineTo(-w * 0.2, s2 * 2); c.lineTo(w * 0.6, s2 * 2); c.lineTo(w * 0.6, s2 * 3); c.lineTo(-w, s2 * 3); c.closePath(); c.fill(); c.stroke(); c.restore(); });
    c.restore();
    // a crown of moss, dripping
    c.save(); const mg = c.createRadialGradient(X - r * 0.2, Y - h - r * 0.1, 0, X, Y - h, r * 1.1); mg.addColorStop(0, '#6E9A5E'); mg.addColorStop(1, '#22361E'); c.fillStyle = mg; c.beginPath(); c.ellipse(X, Y - h, r * 0.95, r * 0.36, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(70,104,60,.85)'; c.lineWidth = Math.max(1, T * 0.05); for (let k = 0; k < 7; k++) { const u = -0.85 + k * 0.28, x = X + u * r, y = Y - h + Math.sqrt(Math.max(0, 1 - u * u)) * r * 0.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(k) * 2, y + T * (0.2 + (k % 3) * 0.18)); c.stroke(); } c.restore();
    // silk bound around it, glowing faintly once the web has taken the floor
    c.save(); c.strokeStyle = `rgba(244,240,228,${0.3 + web * 0.4})`; c.lineWidth = 1; for (let k = 0; k < 5; k++) { const yy = Y - h * (0.22 + k * 0.1); c.beginPath(); c.ellipse(X, yy, r * 1.01, r * 0.35, 0, 0.1 + k * 0.2, Math.PI - 0.1); c.stroke(); } c.restore();
  }
  function drawWire(c, FX, z, T, t) {
    const x0 = FX.sx(z.x), y0 = FX.sy(z.y), x1 = FX.sx(z.x + Math.cos(z.a) * z.len), y1 = FX.sy(z.y + Math.sin(z.a) * z.len), a = Math.min(1, z.age / 0.25, (z.life - z.age) / 0.8), hg = T * 0.6, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    c.globalAlpha = a * 0.3; c.strokeStyle = '#000000'; c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    // where it will catch the pet: a faint gold band on the ground
    c.globalAlpha = a * 0.22; c.strokeStyle = GOLD; c.lineWidth = z.w * T; c.setLineDash([T * 0.3, T * 0.35]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]);
    // the strand itself, strung at knee height and sagging a little
    c.globalAlpha = a; c.strokeStyle = 'rgba(250,246,232,.95)'; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.moveTo(x0, y0 - hg * 1.6); c.quadraticCurveTo(mx, my - hg * 0.5, x1, y1 - hg * 1.6); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,211,107,.3)'; c.lineWidth = Math.max(3, T * 0.18); c.stroke();
    for (let k = 1; k < 9; k++) { const u = k / 9, bx = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * x1, by = (1 - u) * (1 - u) * (y0 - hg * 1.6) + 2 * u * (1 - u) * (my - hg * 0.5) + u * u * (y1 - hg * 1.6), tw = 0.5 + 0.5 * Math.sin(t * 5 + k * 1.7 + z.x); c.globalAlpha = a * tw * 0.8; blitSized(c, glowSprite('#FFFFFF'), bx - T * 0.15, by - T * 0.15, T * 0.3, T * 0.3); }
    c.globalCompositeOperation = 'source-over';
  }
  function drawEgg(c, FX, o, X, Y, T, t) {
    const K = FX.K, left = o.life == null ? 1 : clamp(o.life / 6.5, 0, 1), pul = 0.5 + 0.5 * Math.sin(t * (4 + (1 - left) * 14)), r = T * 0.58, sq = 1 + Math.sin(t * 6 + o.x) * 0.03 * (2 - left);
    K.shade(c, X, Y + T * 0.05, r * 1.2, r * 0.42, 0.55);
    // threads tying it to the ground
    c.save(); c.strokeStyle = 'rgba(244,240,228,.5)'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; c.beginPath(); c.moveTo(X, Y - r * 0.6); c.lineTo(X + Math.cos(a) * r * 1.5, Y + Math.sin(a) * r * 0.5); c.stroke(); } c.restore();
    K.body(c, K.ellP(c, X, Y - r * 0.75, r * 0.85 / sq, r * 0.95 * sq), X, Y - r * 0.75, r, { col: '#E6DCC2', hi: '#FFFFFF', dk: '#9A8A6A', tex: 'silk', texA: 0.8, texS: 0.4, spec: 0.4, ao: 0.2,
      inner: () => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + pul * 0.4 * (1.3 - left); blitSized(c, glowSprite(EGG), X - r * 1.2, Y - r * 1.95, r * 2.4, r * 2.4); c.restore(); c.fillStyle = `rgba(60,40,20,${0.2 + (1 - left) * 0.35})`; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(X + (k - 1) * r * 0.32, Y - r * 0.8 + Math.sin(t * 3 + k) * r * 0.08, r * 0.14, r * 0.2, 0, 0, TAU); c.fill(); } } });
  }
  function drawAnchor(c, FX, o, X, Y, T, t) {
    const K = FX.K, h = T * 1.5, w = T * 0.32, p = 0.5 + 0.5 * Math.sin(t * 6 + o.k);
    K.shade(c, X, Y + T * 0.06, w * 2.2, w * 0.7, 0.55);
    K.body(c, () => { c.beginPath(); c.moveTo(X - w, Y); c.quadraticCurveTo(X - w * 1.3, Y - h * 0.6, X - w * 0.3, Y - h); c.lineTo(X + w * 0.35, Y - h * 0.96); c.quadraticCurveTo(X + w * 1.2, Y - h * 0.5, X + w, Y); c.closePath(); }, X, Y - h * 0.5, h * 0.6, { col: '#D8D0BC', hi: '#FFFFFF', dk: '#6A6458', tex: 'silk', texA: 1, texS: 0.35, spec: 0.3, rim: GOLD, rimA: 0.4 });
    c.save(); c.strokeStyle = 'rgba(120,110,90,.6)'; c.lineWidth = 1; for (let k = 0; k < 8; k++) { const y = Y - h * (0.1 + k * 0.1); c.beginPath(); c.moveTo(X - w, y); c.lineTo(X + w, y - T * 0.12); c.stroke(); } c.restore();
    // the knot where the anchor thread is tied: cut it here
    K.glow(c, X, Y - h * 0.72, T * (0.7 + p * 0.3), GOLD, 0.55 + p * 0.3);
    c.save(); c.fillStyle = '#FFF0B8'; c.beginPath(); c.arc(X, Y - h * 0.72, T * 0.13, 0, TAU); c.fill(); c.restore();
  }
  function drawClosing(c, FX, W, T, t) {
    const live = liveEdges(W), cx = FX.sx(W.x), cy = FX.sy(W.y);
    c.save(); c.lineCap = 'round';
    // the web being drawn tight inside the anchors
    const an = W.an.map(o => [FX.sx(o.x), FX.sy(o.y) - T * 0.6]);
    c.strokeStyle = 'rgba(244,240,228,.22)'; c.lineWidth = 1;
    W.an.forEach((o, k) => { if (W.cut[k]) return; c.beginPath(); c.moveTo(an[k][0], an[k][1]); c.lineTo(cx, cy - T * 0.3); c.stroke(); });
    for (let j = 1; j < 5; j++) { const u = j / 5; c.beginPath(); let first = true; for (let k = 0; k <= 4; k++) { const kk = k % 4, kn = (k + 1) % 4; if (W.cut[kk] || (k < 4 && W.cut[kn] && false)) { first = true; continue; } const x = lerp(cx, an[kk][0], u), y = lerp(cy - T * 0.3, an[kk][1], u); first ? c.moveTo(x, y) : c.lineTo(x, y); first = false; } c.stroke(); }
    // the anchor cables, tight and burning: touching one is like touching a blade
    live.forEach(([a, b]) => { const x0 = FX.sx(a.x), y0 = FX.sy(a.y) - T * 0.6, x1 = FX.sx(b.x), y1 = FX.sy(b.y) - T * 0.6, sh = Math.sin(t * 30 + a.k) * 1.5;
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.moveTo(FX.sx(a.x), FX.sy(a.y)); c.lineTo(FX.sx(b.x), FX.sy(b.y)); c.stroke();
      c.strokeStyle = '#FFF8E4'; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.moveTo(x0, y0); c.lineTo((x0 + x1) / 2, (y0 + y1) / 2 + sh); c.lineTo(x1, y1); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,200,90,.45)'; c.lineWidth = Math.max(4, T * 0.3); c.stroke(); });
    // severed threads curl and drift
    W.an.forEach((o, k) => { if (!W.cut[k]) return; [W.an[(k + 3) % 4], W.an[(k + 1) % 4]].forEach(n => { if (W.cut[n.k]) return; const x0 = FX.sx(n.x), y0 = FX.sy(n.y) - T * 0.6, dx = FX.sx(o.x) - x0, dy = FX.sy(o.y) - T * 0.6 - y0; c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(244,240,228,.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + dx * 0.25, y0 + dy * 0.25 + T * 0.8, x0 + dx * 0.4 + Math.sin(t * 3) * 4, y0 + dy * 0.35 + T * 1.4); c.stroke(); }); });
    c.restore();
  }
})();
