/* ---------- Dungeon: summoning Animas ----------
   The summon gauge fills when the pet takes hits and fills at once in critical condition. Once per floor the pet can call
   its Anima: a cinematic entrance (the constellation draws itself, then the creature descends from the heavens or rises
   from the void), a battle theme of its own, a fighting style, and a finale: the Astral Awakening. From Guardian (stage 5) a
   pet calls two: opposite signs resonate into one combined attack, any other pair awakens together in Astral Harmony. */
const DunAnima = (() => {
  // kept pictures for the summon button (see drawBtn): made at the screen's resolution, laid down at whole pixels
  const BTN_PICS = new Map();
  function btnPic(key, w, h, paint) {
    const k = (typeof arc !== 'undefined' && arc.dpr) || 1, kk = key + '@' + k; let p = BTN_PICS.get(kk);
    if (p) return p;
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k));
    const x = cv.getContext('2d'); x.scale(k, k); paint(x, cv.width / k, cv.height / k);
    p = { cv, w: cv.width / k, h: cv.height / k }; BTN_PICS.set(kk, p);
    if (BTN_PICS.size > 48) BTN_PICS.delete(BTN_PICS.keys().next().value);
    return p;
  }
  function blitC(c, p, x, y) {
    const M = c.getTransform(), k = M.a;
    if (M.b || M.c || k !== M.d || !(k >= 1.5)) { c.drawImage(p.cv, x - p.w / 2, y - p.h / 2, p.w, p.h); return; }
    c.drawImage(p.cv, (Math.round((x - p.w / 2) * k + M.e) - M.e) / k, (Math.round((y - p.h / 2) * k + M.f) - M.f) / k, p.w, p.h);
  }
  const TAU = Math.PI * 2;
  function create(X) {
    const kit = X.kit, me = X.me, g = X.g, mons = X.mons;
    const S = { gauge: 0, used: false, list: [], cine: null, fx: [], q: [], theme: null, bulwark: 0, balance: 0, liberate: 0, plagueT: 0, dome: 0, resDone: false, flashT: 0 };
    if (!kit) return { S, stop() {}, active: () => false, onHurt() {}, update() {}, drawFx() {}, drawGround() {}, drawCine() {}, drawBtn() {}, onBtn: () => false, summon() {}, inK: () => 1, outK: () => 1, rateK: () => 1, ents: () => [], drawAnima() {}, ready: () => false };
    const ST = () => X.ST(), T = () => X.Tz();
    setTimeout(() => { try { AnimaArt.still(kit.main.id, kit.main.k, 64, { aura: false, bloom: 0 }); if (kit.res) AnimaArt.still(kit.res.id, kit.res.k, 64, { aura: false, bloom: 0 }); } catch (e) {} }, 900);
    // (a.awk: what an Astral Awakening multiplies by, set as the attack begins: twice the blow for every Anima but Bahamut,
    // whose judgement is measured on its own; it stays on the Anima, so blows that land a moment later count it too)
    const P = a => ST().atk * ANIMA_POWER[a.k] * (a.awk || 1);
    const AWK = 2, awkOf = a => a.id === 'ophiuchus' ? 1 : AWK;
    /* a Super Fiend's hit boxes (the proxies that pass blows on to its painted body) are not monsters of their own: an
       Anima strikes the fiend itself, once, so blows measured against a monster's health are measured against the fiend's */
    const proxy = m => !!(m.fobj && m.forward);
    const living = () => mons.filter(m => !m.dead && !m.under && !m.falling && !proxy(m));
    const near = (x, y, r) => living().filter(m => Math.hypot(m.x - x, m.y - y) < r + m.r).sort((p, q) => Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y));
    const hit = (m, d, o) => { if (proxy(m)) return 0; const r = X.hitMon(m, d, Object.assign({ src: 'anima' }, o || {})); if (m.dead && !m.boss && Math.random() < 0.3) { const a = S.list.find(b => b.st === 'fight'); if (a) emote(a, Math.random() < 0.5 ? 'star' : 'note'); } return r; };
    /* far-off monsters fester but are never killed by it: they're left weakened for when the pet arrives */
    const fester = (m, d, o) => { const room = m.hp - m.maxhp * 0.2; if (room > 0) hit(m, Math.min(d, room), o); };
    const area = (x, y, r, d, o) => X.hitArea(x, y, r, d, Object.assign({ src: 'anima', noProxy: true }, o || {}));
    const ready = () => !S.used && S.gauge >= 1 && !S.cine;
    // the banner a summoning throws: a quick flash over the fight, gone in a second and a half
    const ASTRAL_T = 1.5;
    // an Astral Awakening's banners come first, a second each and one after another (one for an Anima alone, two for a
    // pair), and the attack only once the last has gone, so it is seen whole. aw: an Anima's awakening, named in its
    // banner (the subtitle names the Anima, or the pair for a Harmony)
    const AW_T = 1;
    function awBanner(a, sub) { const w = B[a.id].aw; X.banner(w[0], sub || `${a.A.name} · Astral Awakening`, w[1], AW_T, true, true); }
    // (things to do a moment from now, on the wall's clock like the banners, not the fight's, which slows for effect)
    const later = (t, f) => S.q.push({ t, f });
    /* ---- the gauge ---- */
    function onHurt(d, dot) { if (S.used) return; const hp = ST().hp, was = S.gauge; S.gauge = Math.min(1, S.gauge + (dot ? 0 : 0.05) + d / hp * 1.3); if (was < 1 && S.gauge >= 1) { X.sfx.chirp(); X.banner('Anima ready!', 'Tap the sigil to summon', ANIMAS[kit.main.id].glow, 1.6); } }
    /* ---- the summon ---- */
    function spawn(id, k, side, delay) {
      const A = ANIMAS[id];
      const a = { id, k, A, x: me.x - side * 1.6, y: me.y - 0.2, t: 0, st: 'enter', life: ANIMA_DUR[k], cd: 0.6, cd2: 0.8, cd3: 1, face: side, side, alpha: 0, scale: 0, rage: 0, dash: null, ang: 0, delay: delay || 0, awakened: false,
        at: Math.random() * 5, mv: 0, ph: 0, atk: -1, atkBig: false, emo: null, emoCd: 1, idleT: 0, px: null, py: null, step: 0,
        vx: 0, vy: 0, oa: null, or: 2.8, wanderT: 0, spd: 2.6 + Math.random() * 0.8, lag: 0, lagV: 0, lvx: 0, fk: side, sq: 0, en: -1, dropZ: 5, landed: false, blinkT: 1 + Math.random() * 2, blink: 0 };
      const p = X.walkPoint(a.x, a.y, { r: 0.4, mv: 0, x: me.x, y: me.y }); a.x = p.x; a.y = p.y;
      S.list.push(a);
      return a;
    }
    function summon() {
      if (!ready()) return false;
      S.used = true; S.gauge = 0;
      const m = kit.main, a = spawn(m.id, m.k, -1);
      if (kit.res) { const b = spawn(kit.res.id, kit.res.k, 1, 0.45); b.life = Math.max(3, a.life - 1.5); }   // both awaken together
      // the summoning: the sign flashes up, a magic circle opens under the pet, and a ray of light comes down from the heavens
      S.cine = { t: 0, dur: 2.2, id: m.id, a };
      S.circle = { t: 0, life: kit.res ? 4 : 2.9, A: ANIMAS[m.id], id: m.id, res: kit.res ? kit.res.id : null };
      g.cineT = 2.2; me.inv = Math.max(me.inv, 2.5);
      X.sfx.hum(); X.sfx.sparkle();
      return true;
    }
    /* ---- entrances: the realm brings the creature in, the sign leaves its mark ---- */
    function entrance(a) {
      const A = a.A, x = a.x, y = a.y;
      for (let i = 0; i < 8; i++) S.fx.push({ kind: 'feather', x: x + (Math.random() - 0.5) * 2.4, y: y - 3 - Math.random() * 2.5, vy: 1.3 + Math.random(), t: 0, life: 1.5, rot: Math.random() * 6, col: A.glow });
      X.ring(x, y, 0.3, 2, 0.45, A.glow, 0.08);
      X.light(x, y, 3, 0.5);
      const em = (n, col, sp, up) => { for (let i = 0; i < n; i++) { const an = Math.random() * TAU, v = sp * (0.4 + Math.random()); X.part({ kind: 'ember', x, y: y - 0.4, vx: Math.cos(an) * v, vy: Math.sin(an) * v - (up || 0), life: 0.9, max: 0.9, size: 5 + Math.random() * 6, color: col, drag: 1.2 }); } };
      switch (a.id) {
        case 'aries': em(34, '#FF7A3D', 7, 4); X.boom(x, y, 1.8, '#FF5A3C', '#FFE37A', { n: 24, shake: 8, smoke: 5 }); break;
        case 'taurus': X.shake(16, 0.6); for (let i = 0; i < 3; i++) X.after(i * 0.15, () => X.ring(x, y, 0.4, 1.8 + i * 0.5, 0.45, '#F2C65A', 0.1)); for (let i = 0; i < 14; i++) { const an = Math.random() * TAU; X.part({ kind: 'shard', x, y, vx: Math.cos(an) * 6, vy: Math.sin(an) * 6 - 3, g: 12, life: 0.8, max: 0.8, size: 6, rot: an, vr: 9, color: '#8C7B6B' }); } break;
        case 'gemini': S.fx.push({ kind: 'twin', x, y: y - 1, t: 0, life: 1.4, c1: '#FFD98A', c2: '#4A90E2' }); X.ring(x, y, 0.3, 2.4, 0.5, '#FFD98A', 0.1); X.after(0.12, () => X.ring(x, y, 0.3, 2.8, 0.55, '#4A90E2', 0.1)); break;
        case 'cancer': for (let i = 0; i < 26; i++) X.part({ kind: 'bubble', x: x + (Math.random() - 0.5) * 3, y: y + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 3, life: 1.1, max: 1.1, size: 3 + Math.random() * 5, color: Math.random() < 0.5 ? '#5DF2FF' : '#B983F5' }); X.ring(x, y, 0.3, 2.4, 0.6, '#7A2E5E', 0.14); break;
        case 'leo': for (let i = 0; i < 18; i++) { const an = i / 18 * TAU; X.part({ kind: 'star', x: x + Math.cos(an) * 0.5, y: y - 0.7 + Math.sin(an) * 0.4, vx: Math.cos(an) * 3.2, vy: Math.sin(an) * 2.4 - 0.6, life: 0.7, max: 0.7, size: 3 + (i % 3), color: i % 2 ? '#FFE37A' : '#FFFFFF', drag: 1.5 }); } X.shake(6, 0.3); break;
        case 'virgo': for (let i = 0; i < 28; i++) { const an = i / 28 * TAU; X.part({ kind: 'petal', x: x + Math.cos(an) * 2.5, y: y - 0.6 + Math.sin(an) * 1.6, vx: -Math.sin(an) * 4, vy: Math.cos(an) * 3 - 1, life: 1.4, max: 1.4, size: 6, rot: an, vr: 7, color: i % 2 ? '#FFB3D9' : '#FFFFFF', drag: 1 }); } break;
        case 'libra': S.fx.push({ kind: 'scales', x, y: y - 1.4, t: 0, life: 1.5 }); X.ring(x, y, 0.4, 2.4, 0.5, '#FFC24D', 0.1); break;
        case 'scorpio': for (let i = 0; i < 16; i++) { const an = Math.random() * TAU; X.part({ kind: 'smoke', x: x + Math.cos(an) * 0.6, y: y + Math.sin(an) * 0.4, vx: Math.cos(an) * 2.4, vy: Math.sin(an) * 1.6 - 0.5, life: 1.2, max: 1.2, size: 0.8, color: 'rgba(120,20,40,' }); } em(20, '#FF3B4E', 5, 2); break;
        case 'sagittarius': for (let i = 0; i < 14; i++) X.after(i * 0.05, () => S.fx.push({ kind: 'arrow', x: x + (Math.random() - 0.5) * 4, y: y + (Math.random() - 0.5) * 2, t: 0, life: 0.3, col: '#E8E0FF', dmg: 0 })); break;
        case 'capricorn': for (let i = 0; i < 5; i++) X.after(i * 0.08, () => { X.bolt(x + (Math.random() - 0.5) * 3, y + (Math.random() - 0.5) * 2, '#FFE37A'); X.light(x, y, 3, 0.25); }); for (let i = 0; i < 6; i++) X.drop('coin', x, y); break;
        case 'aquarius': X.splash(x, y, 2.4); X.splash(x, y, 1.4); X.ring(x, y, 0.3, 2.4, 0.5, '#5FD4FF', 0.12); break;
        case 'pisces': S.fx.push({ kind: 'twin', x, y: y - 1, t: 0, life: 1.6, c1: '#FFFFFF', c2: '#6A5AB0' }); X.ring(x, y, 0.3, 2.4, 0.55, '#B9A6FF', 0.12); break;
        case 'ophiuchus': for (let i = 0; i < 4; i++) X.after(i * 0.1, () => X.ring(x, y, 0.3, 1.6 + i * 0.75, 0.5, i % 2 ? '#FFD36B' : '#BFF4FF', 0.14)); for (let i = 0; i < 14; i++) S.fx.push({ kind: 'feather', x: x + (Math.random() - 0.5) * 4, y: y - 2.5 - Math.random() * 3, vy: 1 + Math.random(), t: 0, life: 1.8, rot: Math.random() * 6, col: '#FFFFFF' }); X.light(x, y, 5, 0.8); X.flash(0.3, '#FFF4D0'); break;
      }
      X.sfx.crash();
    }
    /* ---- arrival effects that are part of the role ---- */
    function arrive(a) {
      emote(a, 'bang', true);
      if (a.id === 'pisces') { me.chill = 0; me.push = null; for (let i = X.zones.length - 1; i >= 0; i--) { const z = X.zones[i]; if (z.own === 'enemy' && (z.kind === 'web' || z.kind === 'poison' || z.kind === 'evoid' || z.kind === 'sweep')) X.zones.splice(i, 1); } g.cdS = g.cdS2 = g.cdS3 = g.cdU = 0; X.gainMP(50); X.text(me.x, me.y - 1.4, 'CHAINS BROKEN!', '#EAF2FF', 16, { crit: true, life: 1.2, max: 1.2 }); }
    }
    /* ---- each Anima's way of fighting ---- */
    /* a companion with a mind of its own: it picks a spot a few steps from the pet (its own side, or flanking toward the
       fight), drifts there at its own pace, keeps a little personal space, and trails the pet's heading when it travels */
    const angD = (p, q) => Math.abs(((p - q) % TAU + TAU * 1.5) % TAU - Math.PI);
    function pickSpot(a) {
      a.wanderT = 2 + Math.random() * 2.8;
      const foe = near(me.x, me.y, 8)[0];
      let an = foe && Math.random() < 0.55 ? Math.atan2(foe.y - me.y, foe.x - me.x) + (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.7)
        : (a.side < 0 ? Math.PI : 0) + (Math.random() - 0.5) * 2.4;
      const other = S.list.find(b => b !== a && b.oa != null && b.st !== 'leave');
      if (other && angD(an, other.oa) < 1.1) an = other.oa + Math.PI * (0.75 + Math.random() * 0.5);   // two Animas keep to different sides
      const r = 2.3 + Math.random() * 1.3, p = X.walkPoint(me.x + Math.cos(an) * r, me.y + Math.sin(an) * r * 0.8, { r: 0.35, mv: 0, x: me.x + Math.cos(an) * 1.6, y: me.y + Math.sin(an) * 1.3 });
      a.oa = Math.atan2((p.y - me.y) / 0.8, p.x - me.x); a.or = Math.max(1.9, Math.min(3.8, Math.hypot(p.x - me.x, (p.y - me.y) / 0.8)));
    }
    function heel(a, dt) {
      a.wanderT -= dt; if (a.oa == null || a.wanderT <= 0) pickSpot(a);
      const pvx = me.vx || 0, pvy = me.vy || 0, pv = Math.hypot(pvx, pvy);
      const tx = me.x + Math.cos(a.oa) * a.or + pvx * 0.4, ty = me.y + Math.sin(a.oa) * a.or * 0.8 + pvy * 0.4;
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), dp = Math.hypot(me.x - a.x, me.y - a.y);
      if (dp > 13) { const p = X.walkPoint(me.x - Math.cos(a.oa) * 2, me.y - Math.sin(a.oa) * 1.6, { r: 0.35, mv: 0, x: me.x, y: me.y }); a.x = p.x; a.y = p.y; a.vx = a.vy = 0; X.sparks(a.x, a.y, a.A.glow, 10, 4); return; }
      const want = Math.min((a.spd + pv * 0.85) * (dp > 5.5 ? 2 : 1), d * 2.4), acc = Math.min(1, dt * (dp > 5.5 ? 4.5 : 2.8));
      a.vx += ((d > 0.04 ? dx / d * want : 0) - a.vx) * acc; a.vy += ((d > 0.04 ? dy / d * want : 0) - a.vy) * acc;
      if (dp < 1.6 && dp > 0.01) { const k = (1.6 - dp) * 7 * dt; a.vx += (a.x - me.x) / dp * k * 4; a.vy += (a.y - me.y) / dp * k * 4; }
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (Math.abs(a.vx) > 0.35) a.face = a.vx > 0 ? 1 : -1;
      else if (Math.hypot(a.vx, a.vy) < 0.3) { const foe = near(a.x, a.y, 7)[0]; if (foe && Math.abs(foe.x - a.x) > 0.3) a.face = foe.x > a.x ? 1 : -1; else if (pv > 0.3 && Math.abs(pvx) > 0.2) a.face = pvx > 0 ? 1 : -1; }
    }
    function dash(a, m, dur) { a.dash = { sx: a.x, sy: a.y, m, t: 0, dur: dur || 0.2 }; }
    function dashTick(a, dt, onHit) { const D = a.dash; D.t += dt; const u = Math.min(1, D.t / D.dur), tx = D.m.x - Math.sign(D.m.x - D.sx || 1) * (D.m.r + 0.3), ty = D.m.y; a.x = D.sx + (tx - D.sx) * u; a.y = D.sy + (ty - D.sy) * u; a.face = tx > D.sx ? 1 : -1; if (Math.random() < 0.6) X.part({ kind: 'ghost', x: a.x, y: a.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 1, color: a.A.color }); if (u >= 1) { a.dash = null; a.vx = a.vy = 0; onHit(D.m); } }
    const B = {
      aries: { tick(a, dt) { if (a.dash) return dashTick(a, dt, m => { area(a.x, a.y, 1.7, P(a) * 1.2 * (1 + a.rage * 0.08), { el: 'fire', burn: true, kb: 3 }); X.boom(a.x, a.y, 1.7, '#FF5A3C', '#FFE37A', { n: 14, shake: 5, smoke: 2 }); a.rage = Math.min(10, a.rage + 1); if (a.rage % 3 === 0) X.text(a.x, a.y - 1.6, `RAGE ×${a.rage}`, '#FF7A3D', 14); a.cd = Math.max(0.22, 0.6 - a.rage * 0.036); });
          a.cd -= dt; if (a.cd <= 0) { const t = near(a.x, a.y, 9)[0]; if (t) dash(a, t, 0.18); else { a.cd = 0.3; heel(a, dt); } } else heel(a, dt); },
        aw: ['INFERNAL STAMPEDE', '#FF5A3C'], fin(a) { const tg = near(a.x, a.y, 11).slice(0, 8); tg.forEach((m, i) => X.after(0.12 * i, () => { if (m.dead) return; X.part({ kind: 'beamfx', x: a.x, y: a.y - 0.3, a: Math.atan2(m.y - a.y, m.x - a.x), r: Math.hypot(m.x - a.x, m.y - a.y), life: 0.3, max: 0.3, color: '#FF7A3D', vx: 0, vy: 0 }); a.x = m.x; a.y = m.y; area(m.x, m.y, 2.2, P(a) * 3.2, { el: 'fire', burn: true, kb: 5 }); X.boom(m.x, m.y, 2.2, '#FF5A3C', '#FFE37A', { n: 22, shake: 9, smoke: 4 }); X.zones.push({ kind: 'fire', x: m.x, y: m.y, r: 1.4, life: 3, max: 3, dps: ST().atk * 0.6 * (a.awk || 1), tick: 0, own: 'pet', el: 'fire' }); })); } },
      taurus: { tick(a, dt) { S.bulwark = 1; heel(a, dt); for (const m of near(a.x, a.y, 5)) if (!m.boss && !m.still && Math.hypot(m.x - a.x, m.y - a.y) > 1.4) X.moveEnt(m, (a.x - m.x) * 0.9 * dt, (a.y - m.y) * 0.9 * dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 1.5; area(a.x, a.y, 3, P(a) * 1.1, { el: 'gold', stun: 1.2 }); X.ring(a.x, a.y, 0.3, 3.2, 0.4, '#F2C65A', 0.3); X.shake(6, 0.2); X.sfx.thud(); } },
        aw: ['AEGIS OF AGES', '#F2C65A'], fin(a) { me.inv = Math.max(me.inv, 3.2); S.dome = 3.2; area(a.x, a.y, 7, P(a) * 4, { el: 'gold', stun: 2.2, kb: 4 }); for (let i = 0; i < 4; i++) X.after(i * 0.12, () => X.ring(a.x, a.y, 0.5, 4 + i * 2, 0.6, '#F2C65A', 0.35)); X.shake(18, 0.6); X.sfx.crash(); } },
      gemini: { tick(a, dt) { heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 0.3; a.alt = !a.alt; const t = near(a.x, a.y, 9)[0]; if (t) { const ox = a.alt ? -0.5 : 0.5, an = Math.atan2(t.y - a.y, t.x - (a.x + ox)); line(a.x + ox, a.y - 0.6, an, 9, 0.9, P(a) * 0.75, a.alt ? '#FFD36B' : '#8FD3FF', { el: 'prism' }); } } },
        aw: ['TWIN HELIX NOVA', '#FFD98A'], fin(a) { helixNova(a); } },
      cancer: { tick(a, dt) { heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 0.5; for (const m of near(a.x, a.y, 9)) { m.curseT = 3; if (Math.random() < 0.3) X.part({ kind: 'smoke', x: m.x, y: m.y - 0.3, vx: 0, vy: -0.6, life: 0.7, max: 0.7, size: 0.35, color: 'rgba(120,40,140,' }); } } a.cd2 -= dt; if (a.cd2 <= 0) { a.cd2 = 0.9; const t = near(a.x, a.y, 8)[0]; if (t) { const an = Math.atan2(t.y - a.y, t.x - a.x); X.shot({ x: a.x, y: a.y - 0.5, vx: Math.cos(an) * 7, vy: Math.sin(an) * 7, dmg: P(a) * 0.7, r: 0.26, style: 'bubble', el: 'shadow', src: 'anima', life: 1.6, aoe: 1, chill: true }); } } },
        aw: ['ABYSSAL TIDE', '#7A2E5E'], fin(a) { S.fx.push({ kind: 'wave', x: a.x, y: a.y, t: 0, life: 1, r1: 12, col: '#5A1E6A', col2: '#5DF2FF', hit: new Set(), f: m => { m.curseT = 8; m.chill = Math.max(m.chill, 3); hit(m, P(a) * 2.6, { el: 'shadow' }); } }); X.flash(0.3, '#5A1E6A'); } },
      leo: { tick(a, dt) { if (a.dash) return dashTick(a, dt, m => { area(a.x, a.y, 1.5, P(a) * 1.35, { el: 'gold', kb: 4 }); X.slash(a.x, a.y - 0.3, a.face > 0 ? 0 : Math.PI, 1.8, '#FFD36B'); X.sfx.whoosh(); a.cd = 0.55; });
          a.cd -= dt; if (a.cd <= 0) { const t = near(a.x, a.y, 7)[0]; if (t) dash(a, t, 0.2); else { a.cd = 0.3; heel(a, dt); } } else heel(a, dt);
          a.cd3 -= dt; if (a.cd3 <= 0) { a.cd3 = 1; X.heal(ST().hp * 0.03, true); X.part({ kind: 'glow', x: me.x, y: me.y - 0.4, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 1.2, color: '#FFE9A8' }); for (let i = 0; i < 4; i++) X.part({ kind: 'star', x: me.x + (Math.random() - 0.5), y: me.y - Math.random(), vx: 0, vy: -1.4, life: 0.7, max: 0.7, size: 3, color: '#FFE37A' }); } },
        aw: ['JUDGEMENT OF THE SUN', '#FFD36B'], fin(a) { area(a.x, a.y, 7, P(a) * 4.5, { el: 'gold', kb: 6 }); X.heal(ST().hp * 0.35); X.part({ kind: 'flare', x: a.x, y: a.y - 1, vx: 0, vy: 0, life: 0.9, max: 0.9, size: 9, color: '#FFE37A' }); for (let i = 0; i < 3; i++) X.ring(a.x, a.y, 0.4, 6 + i * 1.5, 0.7 + i * 0.1, i ? '#FFD36B' : '#FFFFFF', 0.4); X.flash(0.5, '#FFF3C2'); X.shake(12, 0.4); sunOnBoss(a); } },
      virgo: { tick(a, dt) { heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 0.6; const tg = near(a.x, a.y, 9); const m = tg[Math.floor(Math.random() * Math.min(4, tg.length))]; if (m) holy(m.x, m.y, P(a) * 1.4); } a.cd3 -= dt; if (a.cd3 <= 0) { a.cd3 = 1; X.heal(ST().hp * 0.012, true); X.part({ kind: 'petal', x: me.x + (Math.random() - 0.5), y: me.y - 1, vx: (Math.random() - 0.5) * 2, vy: 1, life: 1, max: 1, size: 5, rot: 0, vr: 5, color: '#FFB3D9' }); } },
        aw: ['ETERNAL REQUIEM', '#FFB3D9'], fin(a) { const tg = near(a.x, a.y, 12); for (let i = 0; i < 14; i++) X.after(i * 0.07, () => { const m = tg[i % Math.max(1, tg.length)]; const x = m ? m.x : me.x + (Math.random() - 0.5) * 10, y = m ? m.y : me.y + (Math.random() - 0.5) * 8; holy(x, y, P(a) * 2.5); }); X.heal(ST().hp * 0.2); X.eshots.length = 0; } },
      libra: { tick(a, dt) { S.balance = 1; heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 2; X.ring(a.x, a.y, 0.4, 6, 0.6, '#FFC24D', 0.25); for (const m of near(a.x, a.y, 6)) hit(m, m.boss ? P(a) * 0.8 : Math.max(P(a) * 0.5, m.maxhp * 0.03), { el: 'gold' }); } },
        aw: ['SCALES OF JUDGEMENT', '#FFC24D'], fin(a) { near(a.x, a.y, 14).forEach((m, i) => X.after(Math.min(i, 14) * 0.04, () => { if (m.dead) return; if (i < 14) X.part({ kind: 'pillar', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 0.9, color: '#FFC24D' }); hit(m, (m.boss ? m.maxhp * 0.08 : m.maxhp * 0.22) + P(a), { el: 'gold' }); })); X.flash(0.35, '#FFE9A8'); } },
      scorpio: { tick(a, dt) { heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 0.5; for (const m of mons) { if (m.dead || m.falling) continue; const vis = Math.hypot(m.x - me.x, m.y - me.y) < 8; if (vis || m.boss) hit(m, m.boss ? P(a) * 0.35 : Math.max(P(a) * 0.18, m.maxhp * 0.012), { dot: true, dotC: '#FF6A7A' }); else fester(m, Math.max(P(a) * 0.06, m.maxhp * 0.01), { dot: true, noText: true, noAggro: true }); if (vis && Math.random() < 0.35) X.part({ kind: 'smoke', x: m.x, y: m.y - 0.3, vx: 0, vy: -0.8, life: 0.6, max: 0.6, size: 0.3, color: 'rgba(150,200,60,' }); } }
          a.cd2 -= dt; if (a.cd2 <= 0) { a.cd2 = 1.1; const t = near(a.x, a.y, 7)[0]; if (t) { X.zap(a.x, a.y - 1.2, t.x, t.y, '#FF3B4E', 4); hit(t, P(a) * 1.8, { el: 'shadow', venom: 2 }); } } },
        aw: ['PANDEMIC', '#FF3B4E'], fin(a) { for (const m of mons) { if (m.dead || m.falling) continue; const vis = Math.hypot(m.x - me.x, m.y - me.y) < 10; if (vis) hit(m, P(a) * 3 + m.maxhp * (m.boss ? 0.04 : 0.1) * (a.awk || 1), { el: 'shadow', venom: 4 }); else fester(m, P(a) * 0.5 + m.maxhp * 0.05 * (a.awk || 1), { dot: true, noText: true, noAggro: true }); if (vis) X.boom(m.x, m.y, 1.2, '#FF3B4E', '#B6F09C', { n: 8, shake: 2, smoke: 2 }); } X.flash(0.35, '#FF3B4E'); } },
      sagittarius: { tick(a, dt) { heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 0.13; const tg = near(a.x, a.y, 10); const m = tg[Math.floor(Math.random() * Math.min(6, tg.length))]; if (m) S.fx.push({ kind: 'arrow', x: m.x + (Math.random() - 0.5) * 0.5, y: m.y + (Math.random() - 0.5) * 0.5, t: 0, life: 0.28, col: '#E8E0FF', dmg: P(a) * 0.42 }); } },
        aw: ['HEAVEN\'S VOLLEY', '#BFA8FF'], fin(a) { const tg = near(a.x, a.y, 12); for (let i = 0; i < 70; i++) X.after(i * 0.028, () => { const m = tg.length ? tg[Math.floor(Math.random() * tg.length)] : null; const x = m ? m.x : me.x + (Math.random() - 0.5) * 12, y = m ? m.y : me.y + (Math.random() - 0.5) * 9; S.fx.push({ kind: 'arrow', x: x + (Math.random() - 0.5), y: y + (Math.random() - 0.5), t: 0, life: 0.26, col: '#FFFFFF', dmg: P(a) * 0.7, big: true }); }); } },
      capricorn: { tick(a, dt) { heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 0.28; let from = { x: a.x, y: a.y - 1 }; const done = new Set(); for (let j = 0; j < 3; j++) { const t = X.nearestMon(from.x, from.y, j ? 4 : 7, done); if (!t) break; done.add(t); X.zap(from.x, from.y, t.x, t.y, '#FFE37A', 3.5); hit(t, P(a) * 0.6 * Math.pow(0.85, j), { el: 'spark', stun: 0.2 }); if (Math.random() < 0.04) X.drop('coin', t.x, t.y); from = t; } }
          a.cd2 -= dt; if (a.cd2 <= 0) { a.cd2 = 0.9; const tg = near(a.x, a.y, 9), m = tg[Math.floor(Math.random() * tg.length)]; if (m) { X.bolt(m.x, m.y, '#FFE37A'); area(m.x, m.y, 1, P(a) * 1.2, { el: 'spark', stun: 0.5 }); X.light(m.x, m.y, 3, 0.2); } } },
        aw: ['AVARICE TEMPEST', '#FFE37A'], fin(a) { const tg = near(a.x, a.y, 12); for (let i = 0; i < 22; i++) X.after(i * 0.06, () => { const m = tg[i % Math.max(1, tg.length)]; const x = m ? m.x : me.x + (Math.random() - 0.5) * 10, y = m ? m.y : me.y + (Math.random() - 0.5) * 8; X.bolt(x, y, '#FFE37A'); area(x, y, 1.3, P(a) * 2.2, { el: 'spark', stun: 1 }); X.light(x, y, 4, 0.3); if (i % 2) X.drop('coin', x, y); }); X.flash(0.4, '#FFF7C2'); X.sfx.crash(); } },
      aquarius: { tick(a, dt) { heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 0.42; const t = near(a.x, a.y, 9)[0]; if (t) { const an = Math.atan2(t.y - a.y, t.x - a.x); X.shot({ x: a.x, y: a.y - 0.6, vx: Math.cos(an) * 8, vy: Math.sin(an) * 8, dmg: P(a) * 0.9, r: 0.28, style: 'bubble', el: 'bubble', src: 'anima', life: 1.6, aoe: 1.1, home: 4, kb: 4 }); X.sfx.bubble(); } } },
        aw: ['CELESTIAL DELUGE', '#5FD4FF'], fin(a) { S.fx.push({ kind: 'wave', x: a.x, y: a.y, t: 0, life: 1.1, r1: 11, col: '#2F7BE0', col2: '#C9F3FF', hit: new Set(), f: m => { hit(m, P(a) * 3.5, { el: 'bubble', kb: 9 }); X.splash(m.x, m.y, 0.8); } }); X.sfx.splash(); } },
      // Bahamut, the thirteenth: lashes of light at the nearest monsters, and its rings ring out in golden waves that stun
      ophiuchus: { tick(a, dt) { heel(a, dt);
          a.cd -= dt; if (a.cd <= 0) { const tg = near(a.x, a.y, 9).slice(0, a.k >= 3 ? 3 : 2); if (tg.length) { a.cd = 0.5; tg.forEach((m, i) => X.after(i * 0.06, () => { if (m.dead) return; const an = Math.atan2(m.y - (a.y - 0.8), m.x - a.x), d = Math.hypot(m.x - a.x, m.y - (a.y - 0.8)); line(a.x, a.y - 0.8, an, d + 0.3, 0.45, 0, i % 2 ? '#FFE9A8' : '#BFF4FF'); hit(m, P(a) * 0.85, { el: 'prism' }); X.sparks(m.x, m.y, '#BFF4FF', 5, 4); })); } else a.cd = 0.25; }
          a.cd2 -= dt; if (a.cd2 <= 0) { if (near(a.x, a.y, 4).length) { a.cd2 = 1.8; area(a.x, a.y, 3.6, P(a) * 1.3, { el: 'gold', stun: 0.6 }); for (let i = 0; i < 2; i++) X.after(i * 0.1, () => X.ring(a.x, a.y - 0.6, 0.4, 3.4 + i * 0.6, 0.45, i ? '#BFF4FF' : '#FFD36B', 0.3)); X.sfx.hum(); } else a.cd2 = 0.6; } },
        aw: ['FINAL JUDGEMENT', '#FFE9A8'], fin(a) { judgement(a); } },
      pisces: { tick(a, dt) { S.liberate = 1; me.chill = 0; heel(a, dt); a.cd -= dt; if (a.cd <= 0) { a.cd = 0.25; for (const m of near(a.x, a.y, 3)) { m.shield = 0; m.block = 0; hit(m, P(a) * 0.45, { el: 'cosmic' }); if (!m.boss && !m.still) X.moveEnt(m, (a.x - m.x) * 0.25, (a.y - m.y) * 0.25); } } },
        aw: ['TIDE OF UNBINDING', '#B9A6FF'], fin(a) { area(a.x, a.y, 6.5, P(a) * 4.2, { el: 'cosmic', kb: 7 }); X.eshots.length = 0; me.inv = Math.max(me.inv, 2.5); S.fx.push({ kind: 'twin', x: a.x, y: a.y - 0.6, t: 0, life: 1, c1: '#FFFFFF', c2: '#6A5AB0', burst: true }); X.flash(0.35, '#EAF2FF'); } },
    };
    /* the Judgement of the Sun falls on the floor's boss too, wherever it stands in sight: a column of sunlight takes three
       of a Super Fiend's health bars (a lesser boss, with a single bar, loses three tenths of it). It lands as a flat share,
       as Final Judgement does, no crit or bonus on top, and burns through any armour */
    function sunOnBoss(a) {
      const b = mons.find(m => m.boss && !m.dead && !m.fobj && m.act !== 'sleep' && m.act !== 'enter' && Math.hypot(m.x - me.x, m.y - me.y) < 18);
      if (!b) return;
      const bars = X.bossBars ? X.bossBars() : null, d = bars ? bars.hp * 3 : b.maxhp * 0.3;
      X.part({ kind: 'pillar', x: b.x, y: b.y, vx: 0, vy: 0, life: 1, max: 1, size: Math.max(2, b.r * 1.2), color: '#FFE37A' });
      X.after(0.3, () => { if (b.dead) return; hit(b, d, { el: 'gold', flat: true, pierce: true }); X.ring(b.x, b.y, 0.5, 4 + b.r, 0.6, '#FFD36B', 0.45); X.part({ kind: 'flare', x: b.x, y: b.y - b.r * 0.6, vx: 0, vy: 0, life: 0.8, max: 0.8, size: 8, color: '#FFE37A' }); X.shake(10, 0.35); });
    }
    /* ---- Final Judgement, Bahamut's Astral Awakening and the strongest attack in the game: night falls over the floor,
       the serpent-bearer's stars draw themselves across the sky, Bahamut looms in it with its rings turning into the golden
       corridor, a seal of runes opens under every monster in sight, and a pillar of light from the heavens judges each one ---- */
    // k: how hard it lands, two and a half times the share of a boss's health it once took (about 14 of Bahamut the
    // Infinite's 26 bars), a flat share no bonus can stack higher
    const JUDG = { len: 3.1, strike: 1.55, boss: 0.22, k: 2.5 };
    function judgement(a) {
      const tg = living().filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 16).sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y));
      S.judg = { t: 0, a, tg, done: false, inst: {}, seed: Math.random() * 1000 };
      a.judg = true; a.jA = 1;
      g.cineT = Math.max(g.cineT, JUDG.len); me.inv = Math.max(me.inv, JUDG.len + 0.5);
      X.sfx.hum(); X.sfx.sparkle();
    }
    function stepJudgement(dtReal) {
      const J = S.judg; J.t += dtReal; const a = J.a;
      g.cineT = Math.max(0.02, JUDG.len - J.t); me.inv = Math.max(me.inv, 0.4);
      a.jA = J.t < 0.35 ? 1 - J.t / 0.35 : J.t > JUDG.len - 0.5 ? Math.min(1, (J.t - (JUDG.len - 0.5)) / 0.5) : 0;
      if (J.t > 0.8 && J.t < JUDG.strike && Math.random() < dtReal * 8) X.shake(3, 0.1);
      if (J.t >= JUDG.strike && !J.done) {
        J.done = true;
        const p = P(a);
        // a monster is judged outright; a boss loses about a quarter of its health: six of Bahamut's bars at the top of the Tower
        J.tg.forEach(m => { if (m.dead) return; hit(m, (p * 10 + m.maxhp * (m.boss ? JUDG.boss : 0.4)) * JUDG.k, { el: 'prism', kb: 5, noCrit: true, flat: true }); X.sparks(m.x, m.y, '#FFF4D0', 14, 8); X.light(m.x, m.y, 4, 0.6); });
        if (!J.tg.length) for (let i = 0; i < 5; i++) X.light(me.x + (Math.random() - 0.5) * 8, me.y + (Math.random() - 0.5) * 6, 4, 0.6);
        X.flash(1, '#FFFFFF'); X.shake(26, 0.9); X.sfx.crash(); X.after(0.15, () => X.sfx.fanfare());
        for (let i = 0; i < 26; i++) S.fx.push({ kind: 'feather', x: me.x + (Math.random() - 0.5) * 12, y: me.y - 4 - Math.random() * 6, vy: 1.2 + Math.random() * 1.4, t: 0, life: 2.6, rot: Math.random() * 6, col: '#FFFFFF' });
      }
      if (J.t >= JUDG.len) { S.judg = null; a.judg = false; a.jA = 1; g.cineT = 0; }
    }
    /* drawn over the whole screen, in screen space */
    function drawJudgement(c, W, H) {
      const J = S.judg, t = J.t, Tz = T(), A = ANIMAS.ophiuchus, sk = JUDG.strike;
      const night = ease(Math.min(1, t / 0.45)) * (1 - ease(Math.max(0, Math.min(1, (t - (JUDG.len - 0.7)) / 0.7))));
      c.save();
      // night falls
      c.fillStyle = `rgba(2,4,14,${0.8 * night})`; c.fillRect(0, 0, W, H);
      const gr = c.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, Math.max(W, H) * 0.7); gr.addColorStop(0, `rgba(40,70,140,${0.35 * night})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      // the stars come out
      const R = mulberry32((J.seed | 0) >>> 0);
      for (let i = 0; i < 90; i++) { const x = R() * W, y = R() * H * 0.75, s = (0.6 + R() * 1.6), tw = 0.55 + 0.45 * Math.sin(t * (2 + R() * 4) + i); c.globalAlpha = night * tw * (0.4 + R() * 0.6); blitSized(c, glowSprite('#FFFFFF'), x - s * 2, y - s * 2, s * 4, s * 4); }
      // the serpent-bearer's stars, drawing themselves across the sky
      const CS = CONSTELLATION.ophiuchus, cx0 = W * 0.08, cy0 = H * 0.04, cw = W * 0.84, chh = H * 0.5, draw = Math.max(0, Math.min(1, (t - 0.15) / 0.8));
      c.lineCap = 'round'; c.lineWidth = 2;
      CS.e.forEach(([i, j], n) => { const u = Math.max(0, Math.min(1, draw * CS.e.length - n)); if (u <= 0) return; const ax = cx0 + CS.p[i][0] * cw, ay = cy0 + CS.p[i][1] * chh, bx = cx0 + CS.p[j][0] * cw, by = cy0 + CS.p[j][1] * chh; c.globalAlpha = 0.6 * night; c.strokeStyle = '#FFE9A8'; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (bx - ax) * u, ay + (by - ay) * u); c.stroke(); });
      CS.p.forEach(([x, y], i) => { const on = draw * CS.p.length - i; if (on <= 0) return; const s = 5 + 2 * Math.sin(t * 6 + i); c.globalAlpha = night * Math.min(1, on); blitSized(c, glowSprite('#FFF4D0'), cx0 + x * cw - s * 2, cy0 + y * chh - s * 2, s * 4, s * 4); });
      c.globalCompositeOperation = 'source-over';
      // Bahamut in the sky, winding its rings up and turning them into the golden corridor
      // sized so its eight wings (four times as wide as they are tall, nearly) just about span the sky
      const size = Math.min(W * 0.44, H * 0.27), come = ease(Math.max(0, Math.min(1, (t - 0.15) / 0.6))), leave = ease(Math.max(0, Math.min(1, (t - (JUDG.len - 0.6)) / 0.6)));
      const charge = ease(Math.max(0, Math.min(1, (t - 0.35) / 0.9))) * (t < sk + 0.4 ? 1 : Math.max(0, 1 - (t - sk - 0.4) / 0.6)), align = ease(Math.max(0, Math.min(1, (t - 0.55) / 0.6))) * (1 - leave);
      const fy = H * 0.32 - (1 - come) * H * 0.4 - leave * H * 0.15, gx = W / 2, gy = fy - size * 0.5;
      if (come > 0.01) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * come * (1 - leave) * (0.6 + 0.4 * charge); const gs = size * (1.1 + charge * 0.6); blitSized(c, glowSprite(A.glow), gx - gs, gy - gs, gs * 2, gs * 2); c.restore();
        AnimaArt.draw(c, 'ophiuchus', 3, gx, fy, size, t + 10, { inst: J.inst, charge, align, alignAx: [0, 1, 0.25], alpha: come * (1 - leave), aura: false, q: 1 });
        // the gem gathers the light
        if (charge > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; const r = size * (0.12 + 0.2 * charge) * (1 + 0.15 * Math.sin(t * 20)); c.globalAlpha = Math.min(1, charge * 1.2) * (1 - leave); blitSized(c, glowSprite('#FFFFFF'), gx - r, gy - r, r * 2, r * 2); for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + t * 0.8, L = size * (0.35 + 0.5 * charge); c.globalAlpha = 0.35 * charge * (1 - leave); c.strokeStyle = '#FFF4D0'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx + Math.cos(an) * r * 0.6, gy + Math.sin(an) * r * 0.6); c.lineTo(gx + Math.cos(an) * L, gy + Math.sin(an) * L); c.stroke(); } c.restore(); }
      }
      // a seal of runes opens under every monster, and the gem's light locks on to each
      const seal = ease(Math.max(0, Math.min(1, (t - 0.7) / 0.6))), sealOut = t > sk ? Math.max(0, 1 - (t - sk) / 0.5) : 1;
      c.save(); c.globalCompositeOperation = 'lighter';
      J.tg.forEach((m, i) => {
        const X0 = X.sx(m.x), Y0 = X.sy(m.y), rr = Tz * (0.7 + m.r) * (0.4 + 0.6 * seal);
        if (seal > 0 && sealOut > 0) {
          c.save(); c.translate(X0, Y0); c.scale(1, 0.42); c.rotate(t * (i % 2 ? 1.6 : -1.6));
          c.globalAlpha = seal * sealOut; c.strokeStyle = '#FFD36B'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke();
          c.lineWidth = 1.5; c.strokeStyle = '#FFF4D0'; c.beginPath(); c.arc(0, 0, rr * 0.78, 0, TAU); c.stroke();
          for (let j = 0; j < 8; j++) { const an = j / 8 * TAU; c.beginPath(); c.moveTo(Math.cos(an) * rr * 0.78, Math.sin(an) * rr * 0.78); c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); c.stroke(); }
          AnimaArt.sigil(c, 'ophiuchus', 0, 0, rr * 0.9, '#FFE9A8', seal * sealOut, 2.4);
          c.restore();
        }
        // the lock-on: a thread of gold from the gem
        const lk = t > 1.1 && t < sk ? (t - 1.1) / (sk - 1.1) : 0;
        if (lk > 0) { c.globalAlpha = 0.5 * lk; c.strokeStyle = '#FFE9A8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(gx, gy); c.lineTo(X0, Y0); c.stroke(); }
        // the judgement: a pillar of light from the heavens
        if (t >= sk) {
          const u = (t - sk) / 0.9, k2 = u < 0.12 ? u / 0.12 : Math.max(0, 1 - (u - 0.12) / 0.88), w = Tz * (1 + m.r) * (1.4 - u * 0.6);
          if (k2 > 0) {
            // (a soft ray from above the screen down to the ground, its foot rounded off in light)
            c.globalAlpha = 1; softRay(c, X0, -w * 2, X0, Y0 + Tz * 0.1, w * 2.2, '#FFE28C', 0.75 * k2); softRay(c, X0, -w * 2, X0, Y0 + Tz * 0.1, w * 1.1, '#FFE28C', k2, 0.55);
            const ps = w * 2.6; c.globalAlpha = k2; blitSized(c, glowSprite('#FFFFFF'), X0 - ps, Y0 - ps * 0.45, ps * 2, ps * 0.9); blitSized(c, shockSprite('#FFE9A8'), X0 - ps * (0.6 + u), Y0 - ps * (0.6 + u) * 0.4, ps * (1.2 + u * 2), ps * (1.2 + u * 2) * 0.4);
          }
        }
      });
      c.restore();
      c.restore();
    }
    /* ---- Twin Helix Nova, Raziel's Astral Awakening: the room darkens, the twin dragons spiral up out of the fight into
       the sky as a double helix of gold and blue, the light gathers between their meeting heads while a yin-yang seal
       opens on the floor where the monsters crowd, then sunlight and moonlight braid into one beam that crashes down and
       bursts across the room as a vast yin-yang nova. Every monster in reach is struck, those under the beam twice over ---- */
    // len: the whole cinematic, strike: when the beam lands; nova: the burst's reach in tiles, core: the beam's own;
    // k: how hard the nova hits (times the Anima's power), kc: the beam's extra blow on top for anything under it. It never
    // crits, so it lands the same every time: the third strongest final attack, after Bahamut's and Mammon's
    const HELIX = { len: 3.3, strike: 1.75, nova: 11, core: 3.2, k: 9, kc: 12 };
    function helixNova(a) {
      const tg = near(me.x, me.y, 14);
      // aim where the monsters crowd thickest: the one with the most neighbours, and the middle of its crowd
      let x = me.x + (a.face || 1) * 3, y = me.y;
      if (tg.length) { let best = null, bn = -1; for (const m of tg) { const nb = tg.filter(q => Math.hypot(q.x - m.x, q.y - m.y) < 3.5); if (nb.length > bn) { bn = nb.length; best = nb; } } x = best.reduce((s2, m) => s2 + m.x, 0) / best.length; y = best.reduce((s2, m) => s2 + m.y, 0) / best.length; }
      S.helix = { t: 0, a, x, y, done: false, seed: Math.random() * 1000, hitN: 0 };
      a.judg = true; a.jA = 1;
      g.cineT = Math.max(g.cineT, HELIX.len); me.inv = Math.max(me.inv, HELIX.len + 0.5);
      X.sfx.hum(); X.sfx.sparkle(); X.after(0.5, () => X.sfx.whoosh());
    }
    function stepHelix(dtReal) {
      const J = S.helix; J.t += dtReal; const a = J.a, sk = HELIX.strike;
      g.cineT = Math.max(0.02, HELIX.len - J.t); me.inv = Math.max(me.inv, 0.4);
      a.jA = J.t < 0.3 ? 1 - J.t / 0.3 : J.t > HELIX.len - 0.45 ? Math.min(1, (J.t - (HELIX.len - 0.45)) / 0.45) : 0;
      if (J.t > 1.0 && J.t < sk && Math.random() < dtReal * 10) X.shake(2 + (J.t - 1) * 5, 0.1);
      if (J.t >= sk - 0.3 && !J.pre) { J.pre = true; X.sfx.hum(); }
      if (J.t >= sk && !J.done) {
        J.done = true;
        const p = P(a);
        for (const m of living()) {
          const d = Math.hypot(m.x - J.x, m.y - J.y);
          if (d > HELIX.nova + m.r || Math.hypot(m.x - me.x, m.y - me.y) > 16) continue;
          const core = d < HELIX.core + m.r;
          hit(m, p * (HELIX.k + (core ? HELIX.kc : 0)), { el: 'prism', kb: core ? 7 : 5, noCrit: true }); J.hitN++;
          X.sparks(m.x, m.y, core ? '#FFFFFF' : (m.x < J.x ? '#FFD98A' : '#8FD3FF'), core ? 14 : 8, 8);
        }
        X.flash(0.7, '#FFF6E0'); X.shake(26, 0.9); X.sfx.crash(); X.after(0.12, () => X.sfx.fanfare());
        for (let i = 0; i < 4; i++) X.after(i * 0.09, () => X.ring(J.x, J.y, 0.5, HELIX.nova * (0.45 + i * 0.18), 0.7, i % 2 ? '#8FD3FF' : '#FFD98A', 0.4));
        X.light(J.x, J.y, 9, 1);
        for (let i = 0; i < 40; i++) { const an = Math.random() * TAU, v = 4 + Math.random() * 9; X.part({ kind: 'star', x: J.x, y: J.y - 0.3, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, life: 0.9, max: 0.9, size: 3 + Math.random() * 3, color: i % 2 ? '#FFE9A8' : '#CFE6FA', drag: 1.6 }); }
      }
      if (J.t >= HELIX.len) { S.helix = null; a.judg = false; a.jA = 1; g.cineT = 0; }
    }
    // a yin-yang of radius r at the origin: the dark disc, the light fish over it, the two eyes
    function yinYang(c, r, light, dark, a) {
      c.globalAlpha = a; c.fillStyle = dark; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.fillStyle = light; c.beginPath(); c.moveTo(0, -r); c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); c.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true); c.arc(0, -r / 2, r / 2, Math.PI / 2, Math.PI * 1.5); c.closePath(); c.fill();
      c.fillStyle = dark; c.beginPath(); c.arc(0, -r / 2, r * 0.13, 0, TAU); c.fill(); c.fillStyle = light; c.beginPath(); c.arc(0, r / 2, r * 0.13, 0, TAU); c.fill();
    }
    /* drawn over the whole screen, in screen space */
    function drawHelix(c, W, H) {
      const J = S.helix, t = J.t, sk = HELIX.strike, L = HELIX.len, Tz = T(), cl = v => Math.max(0, Math.min(1, v)), lerp = (p, q, u) => p + (q - p) * u;
      const dim = ease(cl(t / 0.4)) * (1 - ease(cl((t - (L - 0.6)) / 0.6)));
      const ix = X.sx(J.x), iy = X.sy(J.y), ax = X.sx(J.a.x), ay = X.sy(J.a.y);
      const rise = ease(cl((t - 0.12) / 1.0)), leave = ease(cl((t - (L - 0.55)) / 0.55)), charge = ease(cl((t - 0.85) / (sk - 0.85))) * (t < sk + 0.25 ? 1 : Math.max(0, 1 - (t - sk - 0.25) / 0.5));
      const up = rise * (1 - leave), size = Math.min(W * 0.66, H * 0.36), gx = lerp(ax, W / 2, up), fy = lerp(ay, H * 0.42, up), sz = size * (0.35 + 0.65 * up);
      const ox = gx - sz * 0.05, oy = fy - sz * 0.8;   // the light gathers where their heads meet
      c.save();
      // the room darkens to a starry indigo night
      c.fillStyle = `rgba(6,10,34,${0.66 * dim})`; c.fillRect(0, 0, W, H);
      const gr = c.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, Math.max(W, H) * 0.7); gr.addColorStop(0, `rgba(60,90,190,${0.35 * dim})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      const R0 = mulberry32((J.seed | 0) >>> 0);
      for (let i = 0; i < 70; i++) { const x = R0() * W, y = R0() * H * 0.7, s2 = 0.6 + R0() * 1.5, tw = 0.55 + 0.45 * Math.sin(t * (2 + R0() * 4) + i); c.globalAlpha = dim * tw * (0.35 + R0() * 0.6); blitSized(c, glowSprite(i % 3 ? '#FFFFFF' : i % 2 ? '#FFD98A' : '#8FD3FF'), x - s2 * 2, y - s2 * 2, s2 * 4, s2 * 4); }
      // the double helix of light the twins leave as they spiral up from the fight
      const trail = cl((t - 0.05) / 0.3) * (1 - cl((t - sk - 0.1) / 0.5));
      if (trail > 0) {
        const N = 40, y0 = ay - Tz * 0.4, y1 = fy - sz * 0.45, amp = Tz * 1.3 + sz * 0.18;
        for (const [ph, col] of [[0, '#FFD36B'], [Math.PI, '#5AA8F2']]) {
          const pts = []; for (let i = 0; i <= N; i++) { const u = i / N, an = u * TAU * 2.2 - t * 9 + ph; pts.push([lerp(ax, gx, u) + Math.sin(an) * amp * (0.35 + 0.65 * u), lerp(y0, y1, u)]); }
          [[16, 0.12], [7, 0.35], [2.2, 0.9]].forEach(([w, al], li) => { c.globalAlpha = trail * al; c.strokeStyle = li === 2 ? '#FFFFFF' : col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); });
        }
      }
      // the twins in the sky, turning as they rise and settling face to face
      c.globalCompositeOperation = 'source-over';
      if (rise > 0.01 && leave < 0.99) {
        const av = rise * (1 - leave);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * av * (0.6 + 0.4 * charge); const gs = sz * (1 + charge * 0.5);
        blitSized(c, glowSprite('#FFD98A'), gx - gs * 1.1, fy - sz * 0.5 - gs, gs * 2, gs * 2); blitSized(c, glowSprite('#4A90E2'), gx - gs * 0.9, fy - sz * 0.5 - gs, gs * 2, gs * 2); c.restore();
        AnimaArt.draw(c, 'gemini', 3, gx, fy, sz, t + 4, { alpha: Math.min(1, av * 1.6), aura: false, yaw: 0.1 + (1 - rise) * 7.5, atk: t > sk - 0.35 && t < sk + 0.5 ? cl((t - sk + 0.35) / 0.85) : null, atkBig: true });
      }
      c.globalCompositeOperation = 'lighter';
      // the light gathering between their heads
      if (charge > 0.03) {
        const r = sz * (0.06 + 0.16 * charge) * (1 + 0.12 * Math.sin(t * 24));
        c.globalAlpha = Math.min(0.75, charge); blitSized(c, glowSprite('#FFB84A'), ox - r * 1.8 - r * 0.6, oy - r * 1.8, r * 3.6, r * 3.6); blitSized(c, glowSprite('#3A7AE8'), ox - r * 1.8 + r * 0.6, oy - r * 1.8, r * 3.6, r * 3.6); c.globalAlpha = Math.min(1, charge * 1.2); blitSized(c, glowSprite('#FFFFFF'), ox - r * 0.8, oy - r * 0.8, r * 1.6, r * 1.6);
        for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + t * 1.2, Ln = sz * (0.3 + 0.55 * charge) * (0.7 + 0.3 * Math.sin(i * 2.3)); c.globalAlpha = 0.32 * charge; c.strokeStyle = i % 2 ? '#CFE6FA' : '#FFE9A8'; c.lineWidth = 2; c.beginPath(); c.moveTo(ox + Math.cos(an) * r * 0.7, oy + Math.sin(an) * r * 0.7); c.lineTo(ox + Math.cos(an) * Ln, oy + Math.sin(an) * Ln); c.stroke(); }
        // motes drawn in toward it
        for (let i = 0; i < 18; i++) { const u = (t * 1.6 + i / 18) % 1, an = i * 2.39, d = sz * 0.9 * (1 - u); c.globalAlpha = charge * u; const s2 = 3 + (i % 3); blitSized(c, glowSprite(i % 2 ? '#8FD3FF' : '#FFD98A'), ox + Math.cos(an) * d - s2 * 2, oy + Math.sin(an) * d * 0.7 - s2 * 2, s2 * 4, s2 * 4); }
      }
      // the seal on the floor where it will land: a turning yin-yang inside rings of gold and blue
      const seal = ease(cl((t - 0.7) / 0.7)) * (t < sk ? 1 : Math.max(0, 1 - (t - sk) / 0.35));
      if (seal > 0) {
        const rr = Tz * HELIX.core * (0.5 + 0.5 * seal);
        c.save(); c.translate(ix, iy); c.scale(1, 0.45);
        c.save(); c.rotate(-t * 2.4); yinYang(c, rr * 0.62, 'rgba(255,217,138,.55)', 'rgba(58,122,232,.55)', seal * 0.8); c.restore();
        c.rotate(t * 1.2); c.globalAlpha = seal; c.lineWidth = 3; c.strokeStyle = '#FFD98A'; c.beginPath(); c.arc(0, 0, rr, 0, Math.PI); c.stroke(); c.strokeStyle = '#5AA8F2'; c.beginPath(); c.arc(0, 0, rr, Math.PI, TAU); c.stroke();
        c.lineWidth = 1.5; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, rr * 0.8, 0, TAU); c.stroke();
        for (let j = 0; j < 12; j++) { const an = j / 12 * TAU; c.strokeStyle = j % 2 ? '#8FD3FF' : '#FFE9A8'; c.beginPath(); c.moveTo(Math.cos(an) * rr * 0.8, Math.sin(an) * rr * 0.8); c.lineTo(Math.cos(an) * rr * 1.08, Math.sin(an) * rr * 1.08); c.stroke(); }
        AnimaArt.sigil(c, 'gemini', 0, 0, rr * 0.5, '#FFFFFF', seal * 0.9, 2.4);
        c.restore();
      }
      // the strike: sunlight and moonlight braided into one beam, crashing down from their heads to the seal
      if (t >= sk - 0.08 && t < sk + 0.75) {
        const u = (t - sk + 0.08) / 0.83, k2 = u < 0.1 ? u / 0.1 : Math.max(0, 1 - (u - 0.1) / 0.9), bw = Tz * 1.6 * (1.3 - u * 0.5);
        c.globalAlpha = 1; softRay(c, ox, oy, ix, iy, bw * 1.5, '#6F9CFF', 0.45 * k2); softRay(c, ox, oy, ix, iy, bw * 0.7, '#FFE9A8', 0.8 * k2, 0.45);
        const N = 36, dx = ix - ox, dy = iy - oy, Ln = Math.hypot(dx, dy) || 1, nx = -dy / Ln, ny = dx / Ln;
        for (const [ph, col] of [[0, '#FFD36B'], [Math.PI, '#4A90E2']]) {
          const pts = []; for (let i = 0; i <= N; i++) { const v = i / N, an = v * TAU * 3.2 - t * 26 + ph, am = bw * 0.75 * (0.5 + 0.5 * v); pts.push([ox + dx * v + nx * Math.sin(an) * am, oy + dy * v + ny * Math.sin(an) * am]); }
          [[14, 0.25], [6, 0.7], [2, 1]].forEach(([w, al], li) => { c.globalAlpha = k2 * al; c.strokeStyle = li === 2 ? '#FFFFFF' : col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); });
        }
        const ps = bw * 2.2; c.globalAlpha = 0.8 * k2; blitSized(c, glowSprite('#FFFFFF'), ix - ps, iy - ps * 0.5, ps * 2, ps);
      }
      // the nova: a vast yin-yang of gold and blue bursting out across the room, turning as it spreads and fades
      if (t >= sk) {
        const u = cl((t - sk) / 1.25), e = 1 - Math.pow(1 - u, 3), R = Tz * HELIX.nova * (0.15 + 0.85 * e), fade = 1 - ease(u);
        c.save(); c.translate(ix, iy); c.scale(1, 0.5);
        // (the yin-yang itself painted solid so it reads, then light poured over it)
        c.save(); c.globalCompositeOperation = 'source-over'; c.rotate(t * 1.4); yinYang(c, R * 0.9, '#F2CD7E', '#2F63C8', 0.5 * fade);
        c.globalAlpha = 0.8 * fade; c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.beginPath(); c.arc(0, -R * 0.45, R * 0.45, -Math.PI / 2, Math.PI / 2, true); c.arc(0, R * 0.45, R * 0.45, -Math.PI / 2, Math.PI / 2); c.stroke(); c.restore();
        c.save(); c.rotate(t * 1.4); yinYang(c, R * 0.9, 'rgba(255,200,110,1)', 'rgba(60,130,255,1)', 0.22 * fade); c.restore();
        c.globalAlpha = 0.8 * fade; blitSized(c, shockSprite('#FFD98A'), -R / 0.86, -R / 0.86, R / 0.43, R / 0.43); c.globalAlpha = 0.7 * fade; blitSized(c, shockSprite('#8FD3FF'), -R * 0.9 / 0.86, -R * 0.9 / 0.86, R * 1.8 / 0.86, R * 1.8 / 0.86);
        c.globalAlpha = fade; c.lineWidth = 4; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
        c.lineWidth = 2; c.strokeStyle = '#FFD98A'; c.beginPath(); c.arc(0, 0, R * 1.04, t * 2, t * 2 + Math.PI); c.stroke(); c.strokeStyle = '#8FD3FF'; c.beginPath(); c.arc(0, 0, R * 1.04, t * 2 + Math.PI, t * 2 + TAU); c.stroke();
        c.globalAlpha = Math.max(0, 1 - u * 2.6); const cs = Tz * 3; blitSized(c, glowSprite('#FFFFFF'), -cs, -cs, cs * 2, cs * 2);
        c.restore();
        // shards of light flung outward
        const R1 = mulberry32(((J.seed | 0) + 7) >>> 0);
        for (let i = 0; i < 26; i++) { const an = R1() * TAU, sp2 = 0.4 + R1() * 0.6, d = R * sp2 * 1.05, s2 = (3 + R1() * 4) * fade; if (s2 < 0.3) continue; c.globalAlpha = fade; blitSized(c, glowSprite(i % 2 ? '#FFE9A8' : '#8FD3FF'), ix + Math.cos(an) * d - s2 * 2, iy + Math.sin(an) * d * 0.5 - s2 * 2 - (1 - fade) * Tz * sp2, s2 * 4, s2 * 4); }
      }
      c.restore();
    }
    function line(x, y, an, len, w, dmg, col, o) {
      X.part({ kind: 'beamfx', x, y, a: an, r: len, life: 0.3, max: 0.3, color: col, vx: 0, vy: 0, w });
      if (!dmg) return;
      for (const m of living()) { const rx = m.x - x, ry = m.y - y, al = rx * Math.cos(an) + ry * Math.sin(an), of = Math.abs(-rx * Math.sin(an) + ry * Math.cos(an)); if (al > 0 && al < len + m.r && of < w / 2 + m.r) hit(m, dmg, o); }
    }
    function holy(x, y, dmg) { X.part({ kind: 'pillar', x, y, vx: 0, vy: 0, life: 0.55, max: 0.55, size: 0.9, color: '#FFE0F2' }); area(x, y, 1.2, dmg, { el: 'prism' }); X.sparks(x, y, '#FFE0F2', 8, 5); X.light(x, y, 2.6, 0.3); }
    /* ---- Zodiac Resonance: the dual attack ---- */
    function resonance(a, b) {
      const R = kit.resonance, k2 = resKey(a.id, b.id), p = (P(a) + P(b)) / 2, kw = ((a.awk || 1) + (b.awk || 1)) / 2;
      S.fx.push({ kind: 'link', a, b, t: 0, life: 1.4 }); X.flash(0.6, '#FFFFFF'); X.shake(16, 0.6); g.slowT = Math.max(g.slowT, 0.5);
      if (R.generic) {   // Astral Harmony: both Awakenings at once, then a burst of starlight from the pet
        B[a.id].fin(a); X.after(0.18, () => B[b.id].fin(b));
        X.after(0.45, () => { area(me.x, me.y, 8, p * 2.6, { el: 'cosmic', kb: 4 }); for (let i = 0; i < 3; i++) X.ring(me.x, me.y, 0.4, 5 + i * 2, 0.6 + i * 0.1, i ? a.A.glow : b.A.glow, 0.35); for (let i = 0; i < 18; i++) { const an = i / 18 * TAU; X.part({ kind: 'star', x: me.x + Math.cos(an), y: me.y - 0.5 + Math.sin(an), vx: Math.cos(an) * 6, vy: Math.sin(an) * 6, life: 0.7, max: 0.7, size: 4, color: i % 2 ? a.A.glow : b.A.glow }); } X.light(me.x, me.y, 10, 0.6); X.sfx.fanfare(); });
        return; }
      const tg = near(me.x, me.y, 14);
      if (k2 === 'aries|libra') tg.slice(0, 16).forEach((m, i) => X.after(0.3 + i * 0.05, () => { if (m.dead) return; X.part({ kind: 'pillar', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.7, max: 0.7, size: 1.2, color: '#FF7A3D' }); hit(m, p * 5, { el: 'fire', burn: true }); X.zones.push({ kind: 'fire', x: m.x, y: m.y, r: 1.2, life: 3, max: 3, dps: ST().atk * 0.6 * kw, tick: 0, own: 'pet', el: 'fire' }); }));
      else if (k2 === 'taurus|scorpio') { me.inv = Math.max(me.inv, 4); S.dome = 4; for (const m of mons) if (!m.dead && !m.falling) { const vis = Math.hypot(m.x - me.x, m.y - me.y) < 10; if (vis) hit(m, p * 4 + m.maxhp * (m.boss ? 0.05 : 0.12) * kw, { el: 'shadow', venom: 4 }); else fester(m, p * 0.6 + m.maxhp * 0.08 * kw, { dot: true, noText: true, noAggro: true }); } }
      else if (k2 === 'gemini|sagittarius') { [0, 1, 2, 3].forEach(i => X.after(0.25 + i * 0.12, () => { const an = i * Math.PI / 4 + 0.2; line(me.x - Math.cos(an) * 7, me.y - Math.sin(an) * 7, an, 14, 2, p * 4, i % 2 ? '#8FD3FF' : '#FFD36B', { el: 'prism' }); })); for (let i = 0; i < 50; i++) X.after(0.4 + i * 0.03, () => { const m = tg.length ? tg[Math.floor(Math.random() * tg.length)] : null; S.fx.push({ kind: 'arrow', x: (m ? m.x : me.x + (Math.random() - 0.5) * 12) + (Math.random() - 0.5), y: (m ? m.y : me.y + (Math.random() - 0.5) * 9) + (Math.random() - 0.5), t: 0, life: 0.26, col: '#FFF3C2', dmg: p * 0.8, big: true }); }); }
      else if (k2 === 'cancer|capricorn') { tg.forEach(m => { m.curseT = 10; }); for (let i = 0; i < 30; i++) X.after(0.3 + i * 0.05, () => { const m = tg[i % Math.max(1, tg.length)]; if (!m || m.dead) return; X.bolt(m.x, m.y, '#C9A6FF'); hit(m, p * 2.6, { el: 'spark', stun: 1 }); X.light(m.x, m.y, 3, 0.3); }); }
      else if (k2 === 'leo|aquarius') { S.fx.push({ kind: 'wave', x: me.x, y: me.y, t: 0, life: 1.3, r1: 12, col: '#FFD36B', col2: '#5FD4FF', hit: new Set(), f: m => { hit(m, p * 5.5, { el: 'gold', kb: 8 }); X.splash(m.x, m.y, 0.7); } }); X.heal(ST().hp * 0.5); }
      else if (k2 === 'virgo|pisces') { X.heal(ST().hp); me.chill = 0; g.cdS = g.cdS2 = g.cdS3 = g.cdU = 0; X.eshots.length = 0; tg.slice(0, 18).forEach((m, i) => X.after(0.3 + i * 0.05, () => { if (!m.dead) holy(m.x, m.y, p * 4.5); })); }
      X.sfx.fanfare();
    }
    /* ---- life: walking, striking and little emotes, so a summoned Anima never just glides ---- */
    const GROUNDED = { trot: 1, stomp: 1, gallop: 1, scuttle: 1, hop: 1 };
    const STRIDE = { trot: 1.15, stomp: 0.8, gallop: 0.95, scuttle: 2.2, hop: 0.75, fly: 0.6, float: 0.5, swim: 0.85 };
    function strike(a, big) { if (a.atk >= 0 && a.atk < 0.6 && !big) return; a.atk = 0; a.atkBig = !!big; a.atkDur = big ? 0.8 : 0.42; }
    function noticeStrike(a, c0, c2, c3, dsh) {
      const healer = a.id === 'leo' || a.id === 'virgo';
      if ((a.id !== 'scorpio' && a.cd > c0 + 0.02) || a.cd2 > c2 + 0.02 || (!dsh && a.dash)) strike(a, false);
      if (a.cd3 > c3 + 0.02 && healer && Math.random() < 0.35) emote(a, 'heart');
    }
    function emote(a, kind, force) { if (!force && (a.emoCd > 0 || a.emo)) return; a.emo = { kind, t: 0, life: kind === 'bang' ? 1 : 1.5 }; a.emoCd = 2.5 + Math.random() * 2; }
    function live(a, dt) {
      const loco = AnimaArt.LOCO[a.id];
      if (a.px == null) { a.px = a.x; a.py = a.y; }
      const v = Math.hypot(a.x - a.px, a.y - a.py) / Math.max(dt, 1e-4); a.px = a.x; a.py = a.y;
      const want = a.st === 'enter' ? 0 : Math.min(1, v / (a.dash ? 9 : 4.5));
      a.mv += (want - a.mv) * Math.min(1, dt * (want > a.mv ? 10 : 5));
      a.at += dt * (1 + a.mv * (loco === 'fly' ? 1.8 : 0.8));
      a.ph += dt * (2.4 + v * STRIDE[loco] * 1.9) * (a.mv > 0.04 ? 1 : 0.15);
      // a puff of dust each time a foot lands; a trail of sparkles behind fliers and swimmers
      const step = Math.floor(a.ph / Math.PI);
      if (step !== a.step) { a.step = step; if (a.mv > 0.35 && GROUNDED[loco]) X.part({ kind: 'smoke', x: a.x + (Math.random() - 0.5) * 0.4, y: a.y + 0.05, vx: -a.face * 0.6, vy: -0.3, life: 0.45, max: 0.45, size: loco === 'stomp' ? 0.34 : 0.22, color: 'rgba(210,200,235,' }); if (loco === 'stomp' && a.mv > 0.5) X.shake(1.5, 0.08); }
      if (!GROUNDED[loco] && a.mv > 0.4 && Math.random() < dt * 9) X.part({ kind: 'star', x: a.x - a.face * 0.5 + (Math.random() - 0.5) * 0.4, y: a.y - 0.6 - Math.random() * 0.6, vx: -a.face * 0.8, vy: -0.4, life: 0.5, max: 0.5, size: 2.2, color: a.A.glow });
      if (a.atk >= 0) { a.atk += dt / (a.atkDur || 0.42); if (a.atk > 1) a.atk = -1; }
      // follow-through: the top of the body lags when it sets off and swings past when it stops
      const vxh = (a.x - (a.qx == null ? a.x : a.qx)) / Math.max(dt, 1e-4); a.qx = a.x;
      const ax = Math.max(-30, Math.min(30, (vxh - a.lvx) / Math.max(dt, 1e-4))); a.lvx = vxh;
      a.lagV += (-ax * 30 - a.lag * 60 - a.lagV * 8) * dt; a.lag = Math.max(-9, Math.min(9, a.lag + a.lagV * dt));
      // turning round is a quick squash through the middle instead of a snap
      const fd = a.face - a.fk; if (fd) a.fk += Math.sign(fd) * Math.min(Math.abs(fd), dt * 11);
      // blinks, and a squash on landing
      a.blinkT -= dt; if (a.blinkT <= 0) { a.blink = 0.001; a.blinkT = 2.2 + Math.random() * 3 + (Math.random() < 0.2 ? -1.8 : 0); }
      if (a.blink > 0) { a.blink += dt / 0.16; if (a.blink >= 1) a.blink = 0; }
      if (a.sq > 0) a.sq = Math.max(0, a.sq - dt * 3.2);
      // idle chatter when nothing is near
      if (a.emoCd > 0) a.emoCd -= dt;
      if (a.emo) { a.emo.t += dt; if (a.emo.t >= a.emo.life) a.emo = null; }
      const calm = a.st === 'fight' && a.mv < 0.2 && !near(a.x, a.y, 7).length;
      a.idleT = calm ? a.idleT + dt : 0;
      if (a.idleT > 2.5) { a.idleT = -1.5; emote(a, ['note', 'heart', 'star', 'note', 'zz'][Math.floor(Math.random() * 5)]); }
    }
    /* a little speech bubble with an icon, popping in above the head */
    function drawEmote(c, a, x, y) {
      const E = a.emo, u = E.t / E.life, pop = u < 0.15 ? 0.4 + u / 0.15 * 0.8 : u < 0.25 ? 1.2 - (u - 0.15) / 0.1 * 0.2 : 1, al = Math.min(1, (1 - u) * 5) * a.alpha, s = T() * 0.42 * pop, yy = y - u * T() * 0.25;
      c.save(); c.globalAlpha = al; c.translate(x, yy); c.scale(s / 10, s / 10);
      c.fillStyle = '#FFFFFF'; c.strokeStyle = '#2B2433'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, 11, 10, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-3, 8.6); c.lineTo(-7 * a.face, 15); c.lineTo(2, 9.4); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, 6, 5, 3.4, 0, 0, TAU); c.fill();
      const k = E.kind;
      if (k === 'heart') { const b = 1 + 0.12 * Math.sin(E.t * 14); c.scale(b, b); c.fillStyle = '#FF5C8A'; c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-9, -1, -5, -9, 0, -4); c.bezierCurveTo(5, -9, 9, -1, 0, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-3.4, -3, 1.6, 1.1, -0.6, 0, TAU); c.fill(); }
      else if (k === 'bang') { c.fillStyle = '#FF7A3D'; c.beginPath(); c.moveTo(-2.2, -7.5); c.lineTo(2.2, -7.5); c.lineTo(1.2, 2.5); c.lineTo(-1.2, 2.5); c.closePath(); c.fill(); c.beginPath(); c.arc(0, 5.6, 1.8, 0, TAU); c.fill(); }
      else if (k === 'note') { const w = Math.sin(E.t * 8) * 0.2; c.rotate(w); c.fillStyle = '#7A5AE0'; c.beginPath(); c.ellipse(-2.6, 4.2, 3, 2.3, -0.4, 0, TAU); c.fill(); c.fillRect(-0.2, -6.5, 1.6, 10.6); c.beginPath(); c.moveTo(1.4, -6.5); c.quadraticCurveTo(6, -5, 4.6, -0.5); c.quadraticCurveTo(4.4, -3.5, 1.4, -3.4); c.closePath(); c.fill(); }
      else if (k === 'anger') { c.strokeStyle = '#FF3B4E'; c.lineWidth = 2.2; c.lineCap = 'round'; for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2 + Math.PI / 4); c.beginPath(); c.moveTo(2, -6); c.quadraticCurveTo(2.2, -2.2, 6, -2); c.stroke(); c.restore(); } }
      else if (k === 'star') { c.rotate(E.t * 2); c.fillStyle = '#FFC24D'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7, an = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); }
      else if (k === 'zz') { c.fillStyle = '#5A6FD8'; c.font = '900 9px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('z', -3, 2); c.font = '900 6px sans-serif'; c.fillText('z', 3.5, -3.5); }
      c.restore();
    }
    /* ---- the descent: a ray of light comes down from the heavens and the Anima floats down inside it ---- */
    function beginDescent(a) {
      a.en = 0; a.dropZ = 5; a.alpha = 0; a.scale = 0.5;
      S.fx.push({ kind: 'heaven', a, x: a.x, y: a.y, t: 0, life: 1.75, col: a.A.glow, col2: a.A.color });
      X.light(a.x, a.y, 5, 1.2); X.sfx.sparkle();
    }
    function descend(a, dt) {
      a.en += dt;
      const u = Math.max(0, Math.min(1, (a.en - 0.14) / 0.7)), e = 1 - Math.pow(1 - u, 3);
      a.dropZ = 5 * (1 - e); a.alpha = Math.min(1, u * 1.7); a.scale = 0.55 + 0.45 * e;
      if (u >= 1 && !a.landed) {
        a.landed = true; a.dropZ = 0; a.sq = 1; entrance(a);
        if (S.cine && S.cine.a === a) { X.banner(a.A.name.toUpperCase(), `${a.A.title} · ${a.A.sign}`, a.A.color, ASTRAL_T, true, true); S.theme = X.sfx.theme(ANIMA_THEME[a.id], ANIMA_DUR[a.k] + 6); }
      }
      if (a.landed && !S.cine && a.en >= 1.1) { a.st = 'fight'; arrive(a); }
    }
    /* ---- the loop ---- */
    function update(dt, dtReal) {
      for (let i = S.q.length - 1; i >= 0; i--) if ((S.q[i].t -= dtReal) <= 0) { const f = S.q[i].f; S.q.splice(i, 1); f(); }
      if (!S.used && S.gauge < 1 && me.hp < ST().hp * 0.25 && !me.dead) { S.gauge = 1; X.sfx.chirp(); X.banner('Critical! Anima ready!', 'Tap the sigil to summon', ANIMAS[kit.main.id].glow, 1.8); }
      S.bulwark = 0; S.balance = 0; S.liberate = 0; if (S.dome > 0) S.dome -= dt;
      if (S.circle) { const Cc = S.circle; Cc.t += dtReal; if (Cc.t < Cc.life - 0.4 && Math.random() < dtReal * 26) { const an = Math.random() * TAU, R = 1.5 + Math.random() * 0.2; X.part({ kind: 'star', x: me.x + Math.cos(an) * R, y: me.y + 0.1 + Math.sin(an) * R * 0.42, vx: 0, vy: -1.6 - Math.random() * 1.6, life: 0.7, max: 0.7, size: 2 + Math.random() * 2, color: Math.random() < 0.5 ? Cc.A.glow : '#FFFFFF' }); } if (Cc.t >= Cc.life) S.circle = null; }
      if (S.judg) stepJudgement(dtReal);
      if (S.helix) stepHelix(dtReal);
      if (S.cine) {
        const C = S.cine; C.t += dtReal; g.cineT = Math.max(0, C.dur - C.t); me.inv = Math.max(me.inv, 0.3);
        if (C.t >= 0.62 && C.a.en < 0) beginDescent(C.a);
        if (C.t >= C.dur) { S.cine = null; g.cineT = 0; S.list.forEach(a => { if (a.st === 'enter' && !a.delay && a.landed) { a.st = 'fight'; arrive(a); } }); }
      }
      for (let i = S.list.length - 1; i >= 0; i--) {
        const a = S.list[i];
        if (a.delay > 0) { if (S.cine) continue; a.delay -= dt; if (a.delay <= 0) { a.delay = 0; beginDescent(a); } continue; }
        a.t += dt;
        if (a.st === 'enter') { if (a.en >= 0) descend(a, S.cine ? dtReal : dt); continue; }
        a.alpha = Math.min(1, a.alpha + dt * 3); a.scale = Math.min(1, a.scale + dt * 3);
        if (a.st === 'fight') { a.life -= dt; const c0 = a.cd, c2 = a.cd2, c3 = a.cd3, dsh = !!a.dash; if (B[a.id]) B[a.id].tick(a, dt); noticeStrike(a, c0, c2, c3, dsh); if (a.life <= 0) { a.st = 'awaken'; a.aw = 0; a.dash = null; emote(a, 'anger', true); } }
        else if (a.st === 'awaken') {
          a.aw += dt; heel(a, dt);
          if (a.aw < 0.7 && Math.random() < 0.5) X.part({ kind: 'star', x: a.x + (Math.random() - 0.5) * 2, y: a.y - Math.random() * 2, vx: 0, vy: -1.5, life: 0.5, max: 0.5, size: 3, color: a.A.glow });
          if (a.aw >= 0.25 && !a.awakened) { a.awakened = true; X.part({ kind: 'flare', x: a.x, y: a.y - 0.9, vx: 0, vy: 0, life: 0.7, max: 0.7, size: 6, color: a.A.color }); X.ring(a.x, a.y, 0.4, 3.5, 0.5, a.A.glow, 0.3); X.sfx.sparkle(); }
          if (a.aw >= 0.7 && !a.finDone) { a.finDone = true; const other = S.list.find(b => b !== a && b.st === 'awaken');
            if (kit.resonance && other && !S.resDone) {   // a pair: two banners, then the two attack as one
              S.resDone = true; other.finDone = true; const main = S.list[0] === other ? other : a, sec = main === a ? other : a, R = kit.resonance;
              if (R.generic) { awBanner(main); later(AW_T, () => awBanner(sec, `Astral Harmony · ${main.A.name} + ${sec.A.name}`)); }
              else { X.banner('ZODIAC RESONANCE', `${main.A.name} + ${sec.A.name}`, '#FFE37A', AW_T, true, true); later(AW_T, () => X.banner(R.name.toUpperCase(), 'Astral Awakening', '#FFE37A', AW_T, true, true)); }
              main.wait = sec.wait = AW_T * 2; later(AW_T * 2, () => { main.awk = awkOf(main); sec.awk = awkOf(sec); strike(main, true); strike(sec, true); resonance(main, sec); });
            } else if (!S.resDone || !kit.resonance) { awBanner(a); a.wait = AW_T; later(AW_T, () => { a.awk = awkOf(a); strike(a, true); B[a.id].fin(a); }); }
          }
          // (an Anima holds its awakened pose while its banners are up)
          if (a.wait > 0) { a.wait -= dtReal; a.aw = Math.min(a.aw, 0.7); }
          if (a.judg) a.aw = Math.min(a.aw, 1);   // Bahamut (and Raziel) stay until the cinematic is done
          if (a.aw >= 1.7) { a.st = 'leave'; a.lv = 0; }
        } else if (a.st === 'leave') { if (!a.waved) { a.waved = true; emote(a, 'heart', true); } a.lv += dt; a.alpha = Math.max(0, 1 - a.lv / 0.8); if (a.lv >= 0.8) { S.list.splice(i, 1); for (let j = 0; j < 12; j++) X.part({ kind: 'star', x: a.x + (Math.random() - 0.5) * 1.5, y: a.y - Math.random() * 2, vx: (Math.random() - 0.5), vy: -2.5, life: 0.8, max: 0.8, size: 3, color: a.A.glow }); } }
      }
      for (const a of S.list) if (!(a.delay > 0)) live(a, dt);
      if (S.theme) { if (!S.list.length || me.dead || g.won) { S.theme.stop(); S.theme = null; } else S.theme.beat(); }
      // effects
      for (let i = S.fx.length - 1; i >= 0; i--) {
        const f = S.fx[i]; f.t += dt;
        if (f.kind === 'arrow' && !f.hitDone && f.t >= f.life) { f.hitDone = true; if (f.dmg) area(f.x, f.y, f.big ? 0.9 : 0.65, f.dmg, { el: 'cosmic' }); X.sparks(f.x, f.y, f.col, 4, 4); }
        if (f.kind === 'feather') f.y += f.vy * dt;
        if (f.kind === 'wave') { const r = f.r1 * Math.min(1, f.t / f.life); for (const m of living()) if (!f.hit.has(m) && Math.hypot(m.x - f.x, m.y - f.y) < r + m.r) { f.hit.add(m); f.f(m); } }
        if (f.t > f.life + (f.kind === 'arrow' ? 0.25 : 0)) S.fx.splice(i, 1);
      }
    }
    /* ---- drawing ---- */
    function ents() { return S.list.filter(a => !(a.delay > 0)).map(a => [a.y + 0.05, a]); }
    function drawAnima(c, a) {
      if (!(a.alpha > 0.01) || (a.judg && !(a.jA > 0.01))) return;
      const Tz = T(), X0 = X.sx(a.x), Y0 = X.sy(a.y), aw = a.st === 'awaken', k = aw ? 3 : a.k, size = Tz * ANIMA_SIZE[k] * (aw ? 1.18 : 1) * (0.2 + 0.8 * a.scale) * (a.id === 'ophiuchus' ? OPH_BIG : 1), loco = AnimaArt.LOCO[a.id];
      const hover = Tz * ((GROUNDED[loco] ? 0.02 : loco === 'fly' ? 0.55 : 0.32) + (a.dropZ || 0)), sh = 1 - Math.min(1, (a.dropZ || 0) / 6);
      c.save(); c.globalAlpha = 0.35 * a.alpha * sh; c.fillStyle = '#000'; c.beginPath(); c.ellipse(X0, Y0 + Tz * 0.12, size * 0.32 * (0.5 + 0.5 * sh), size * 0.08 * (0.5 + 0.5 * sh), 0, 0, TAU); c.fill(); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.45 + (aw ? 0.35 : 0) + 0.1 * Math.sin(a.t * 4)) * a.alpha; const gs = size * (aw ? 1.1 : 0.85); blitSized(c, glowSprite(a.A.glow), X0 - gs, Y0 - hover - size * 0.45 - gs, gs * 2, gs * 2); c.restore();
      const is3d = a.id === 'ophiuchus' || (typeof Anima3D !== 'undefined' && Anima3D.has(a.id)), tk = is3d ? 1 : Math.max(0.16, Math.abs(a.fk == null ? 1 : a.fk)), fy = Y0 - hover;
      c.save(); if (tk < 0.999) { c.translate(X0, fy); c.scale(tk, 1 + (1 - tk) * 0.08); c.translate(-X0, -fy); }
      AnimaArt.draw(c, a.id, k, X0, fy, size, a.at, { inst: a, fk: a.fk == null ? a.face : a.fk, flip: (a.fk == null ? a.face : a.fk) < 0, alpha: a.alpha * (a.judg ? a.jA : 1), mv: a.mv, ph: a.ph, atk: a.atk >= 0 ? a.atk : null, atkBig: a.atkBig, lag: a.lag, sq: a.sq, blink: a.blink, vx: a.vx, fall: a.st === 'enter' ? (a.dropZ || 0) / 5 : 0 });
      c.restore();
      if (a.emo) drawEmote(c, a, X0 + a.face * size * 0.2, Y0 - hover - size * 1.02);
      if (aw) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * a.alpha; AnimaArt.sigil(c, a.id, X0, Y0 - hover - size * 1.05, Tz * 0.9, a.A.color, 0.9, 2.6); c.restore(); }
    }
    function drawFx(c) {
      const Tz = T();
      if (S.dome > 0 || S.bulwark) { const X0 = X.sx(me.x), Y0 = X.sy(me.y - 0.4), R = Tz * (S.dome > 0 ? 1.6 : 1.15); c.globalAlpha = S.dome > 0 ? 0.9 : 0.55; blitSized(c, shockSprite('#F2C65A'), X0 - R / 0.86, Y0 - R / 0.86, R / 0.43, R / 0.43); c.globalAlpha = 1; }
      if (S.balance) { const X0 = X.sx(me.x), Y0 = X.sy(me.y), s = Tz * 1.1; c.globalAlpha = 0.5 + 0.2 * Math.sin(g.t * 4); blitSized(c, glowSprite('#FFC24D'), X0 - s, Y0 - s * 1.2, s * 2, s * 2); c.globalAlpha = 1; }
      for (const a of S.list) if (a.id === 'pisces' && a.st === 'fight') { const X0 = X.sx(a.x), Y0 = X.sy(a.y), R = Tz * 3 / 0.86; for (let i = 0; i < 2; i++) { c.save(); c.translate(X0, Y0); c.rotate(g.t * (2 + i)); c.scale(1, 0.6); c.globalAlpha = 0.35; blitSized(c, shockSprite(i ? '#B9A6FF' : '#EAF2FF'), -R * (0.7 + i * 0.3), -R * (0.7 + i * 0.3), R * (1.4 + i * 0.6), R * (1.4 + i * 0.6)); c.restore(); } }
      for (const f of S.fx) {
        const X0 = X.sx(f.x), Y0 = X.sy(f.y), u = Math.min(1, f.t / f.life);
        if (f.kind === 'arrow') { const fall = 1 - u, hx = X0 + fall * Tz * 2, hy = Y0 - fall * Tz * 7; if (u < 1) { c.save(); c.translate(hx, hy); c.rotate(Math.atan2(-7, 2)); c.globalAlpha = 0.9; blitSized(c, beamSprite(f.col === '#FFFFFF' ? '#BFA8FF' : f.col), -Tz * 0.1, -Tz * (f.big ? 0.14 : 0.1), Tz * 2.2, Tz * (f.big ? 0.28 : 0.2)); blitSized(c, beamSprite('#FFFFFF'), -Tz * 0.05, -Tz * 0.04, Tz * 1.2, Tz * 0.08); c.restore(); const s = Tz * 0.3; blitSized(c, glowSprite(f.col), hx - s, hy - s, s * 2, s * 2); } else { c.globalAlpha = Math.max(0, 1 - (f.t - f.life) / 0.25); const s = Tz * 0.6; blitSized(c, glowSprite(f.col), X0 - s, Y0 - s * 0.5, s * 2, s); c.globalAlpha = 1; } }
        else if (f.kind === 'rift') { const k = Math.sin(Math.min(1, u) * Math.PI), R = Tz * 2.4 * k; c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.85 * k; const gr = c.createRadialGradient(X0, Y0, 0, X0, Y0, R); gr.addColorStop(0, 'rgba(8,2,16,.95)'); gr.addColorStop(0.7, 'rgba(30,6,40,.8)'); gr.addColorStop(1, 'rgba(30,6,40,0)'); c.fillStyle = gr; c.beginPath(); c.ellipse(X0, Y0, R, R * 0.4, 0, 0, TAU); c.fill(); c.restore(); c.globalAlpha = k; c.save(); c.translate(X0, Y0); c.scale(1, 0.4); blitSized(c, shockSprite(f.col), -R * 1.1, -R * 1.1, R * 2.2, R * 2.2); c.restore(); for (let i = 0; i < 6; i++) { const an = g.t * 3 + i; blitSized(c, glowSprite(f.col), X0 + Math.cos(an) * R * 0.8 - Tz * 0.3, Y0 + Math.sin(an) * R * 0.3 - Tz * 0.3 - (g.t * 40 + i * 13) % (Tz * 1.5), Tz * 0.6, Tz * 0.6); } c.globalAlpha = 1; }
        else if (f.kind === 'heaven') drawHeaven(c, f, Tz, X0, Y0, true);
        else if (f.kind === 'feather') { c.save(); c.globalAlpha = Math.sin(u * Math.PI) * 0.9; c.translate(X0, Y0); c.rotate(f.rot + f.t * 2); blitSized(c, beamSprite('#FFFFFF'), -Tz * 0.2, -Tz * 0.07, Tz * 0.4, Tz * 0.14); c.restore(); }
        else if (f.kind === 'twin') { const R = Tz * (f.burst ? 1 + u * 5 : 2.6 * (1 - u) + 0.3); for (let i = 0; i < 2; i++) { const an = f.t * 7 + i * Math.PI, x = X0 + Math.cos(an) * R, y = Y0 + Math.sin(an) * R * 0.5, col = i ? f.c2 : f.c1, s = Tz * 0.7; c.globalAlpha = 1 - (f.burst ? u : u * 0.3); blitSized(c, glowSprite(col), x - s, y - s, s * 2, s * 2); blitSized(c, glowSprite('#FFFFFF'), x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.6); } c.globalAlpha = 1; }
        else if (f.kind === 'scales') { const k = Math.sin(u * Math.PI); c.globalAlpha = k; [-1, 1].forEach(s => { const x = X0 + s * Tz * (1.6 + (1 - u) * 2), y = Y0 + Math.sin(g.t * 3 + s) * Tz * 0.2; blitSized(c, glowSprite('#FFC24D'), x - Tz * 0.6, y - Tz * 0.6, Tz * 1.2, Tz * 1.2); c.save(); c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#FFE37A'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - Tz * 0.35, y); c.quadraticCurveTo(x, y + Tz * 0.3, x + Tz * 0.35, y); c.stroke(); c.restore(); }); c.globalAlpha = 1; }
        else if (f.kind === 'wave') { const R = f.r1 * Tz * u / 0.86; c.globalAlpha = 1 - u * 0.7; c.save(); c.translate(X0, Y0); c.scale(1, 0.7); blitSized(c, shockSprite(f.col), -R, -R, R * 2, R * 2); blitSized(c, shockSprite(f.col2), -R * 0.93, -R * 0.93, R * 1.86, R * 1.86); c.restore(); c.globalAlpha = 1; }
        else if (f.kind === 'link') { const a = f.a, b = f.b, ax = X.sx(a.x), ay = X.sy(a.y) - Tz, bx = X.sx(b.x), by = X.sy(b.y) - Tz, L = Math.hypot(bx - ax, by - ay); c.save(); c.translate(ax, ay); c.rotate(Math.atan2(by - ay, bx - ax)); c.globalAlpha = Math.sin(u * Math.PI); blitSized(c, beamSprite(a.A.color), -Tz * 0.3, -Tz * 0.5, L + Tz * 0.6, Tz); blitSized(c, beamSprite(b.A.color), -Tz * 0.3, -Tz * 0.3, L + Tz * 0.6, Tz * 0.6); blitSized(c, beamSprite('#FFFFFF'), -Tz * 0.2, -Tz * 0.1, L + Tz * 0.4, Tz * 0.2); c.restore(); }
      }
      c.globalAlpha = 1;
    }
    const ease = u => u * u * (3 - 2 * u), hexA = (h, a) => { const [r, gg, b] = hexRGB(h); return `rgba(${r},${gg},${b},${Math.max(0, Math.min(1, a))})`; };
    /* a shaft of light from the top of the screen down to where the Anima will stand: it opens, pools on the ground, lets
       the creature float down inside it, then narrows away */
    function drawHeaven(c, f, Tz, X0, Y0, front) {
      const t = f.t, open = ease(Math.min(1, t / 0.22)), close = t > f.life - 0.6 ? Math.max(0, (f.life - t) / 0.6) : 1, k = open * close;
      if (k <= 0) return;
      const w = Tz * 0.72 * (0.3 + 0.7 * open) * (0.35 + 0.65 * close) * (1 + 0.05 * Math.sin(t * 31)), top = -Tz * 2, hgt = Y0 - top;
      c.save(); c.globalCompositeOperation = 'lighter';
      if (front) {   // motes of light falling down the shaft, and a ripple where it meets the ground
        for (let i = 0; i < 12; i++) { const ph = (t * 1.3 + i * 0.0833) % 1, yy = top + ph * hgt, xx = X0 + Math.sin(i * 7.31 + t * 4) * w * 0.7, s = Tz * (0.06 + (i % 3) * 0.025); c.globalAlpha = 0.9 * k * Math.sin(ph * Math.PI); blitSized(c, glowSprite('#FFFFFF'), xx - s * 2, yy - s * 2, s * 4, s * 4); }
        if (t > 0.18) { const r = ((t - 0.18) / 0.9) % 1, R = Tz * (0.5 + r * 1.3) / 0.86; c.globalAlpha = 0.45 * k * (1 - r); c.save(); c.translate(X0, Y0); c.scale(1, 0.38); blitSized(c, shockSprite(f.col), -R, -R, R * 2, R * 2); c.restore(); }
        c.restore(); return;
      }
      // (the shaft: soft rays, gaussian across, its foot at the creature's feet rounded off in light)
      softRay(c, X0, top - w * 2, X0, top + hgt - w * 0.6, w * 5.2, f.col, 0.3 * k); softRay(c, X0, top - w * 2, X0, top + hgt - w * 0.4, w * 2, f.col, 0.5 * k, 0.5);
      // where it meets the ground: a pool of light
      c.globalAlpha = 0.75 * k; const pw = w * 2.2; blitSized(c, glowSprite(f.col), X0 - pw, Y0 - pw * 0.32, pw * 2, pw * 0.64); c.globalAlpha = 0.6 * k; blitSized(c, glowSprite('#FFFFFF'), X0 - pw * 0.4, Y0 - pw * 0.12, pw * 0.8, pw * 0.24);
      c.restore();
    }
    /* the magic circle on the ground under the summoning pet: double rings, the signs turning in the rim, a woven star,
       and the Anima's own sign blazing in the middle */
    function drawGround(c) {
      for (const f of S.fx) if (f.kind === 'heaven') drawHeaven(c, f, T(), X.sx(f.x), X.sy(f.y), false);
      const Cc = S.circle; if (!Cc) return;
      const t = Cc.t, grow = ease(Math.min(1, t / 0.4)), fade = Math.min(1, (Cc.life - t) / 0.55), k = grow * fade;
      if (k <= 0) return;
      const Tz = T(), X0 = X.sx(me.x), Y0 = X.sy(me.y) + Tz * 0.12, R = Tz * 1.85 * (0.55 + 0.45 * grow), A = Cc.A, col = A.glow, col2 = A.color, pul = 0.85 + 0.15 * Math.sin(t * 9);
      c.save(); c.translate(X0, Y0); c.scale(1, 0.42); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.5 * k; blitSized(c, glowSprite(col2), -R * 1.5, -R * 1.5, R * 3, R * 3);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const ring = (r, w, a, cc) => { c.globalAlpha = a * k; c.strokeStyle = cc; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); };
      ring(R, 6, 0.5 * pul, col2); ring(R, 3.4, 0.9 * pul, col); ring(R, 1.2, 1, '#FFFFFF'); ring(R * 0.86, 2.4, 0.85, col); ring(R * 0.6, 1.8, 0.85, col); ring(R * 0.6, 0.8, 0.9, '#FFFFFF');
      // the rim: every sign, turning; the summoner's own (and its partner's) shine brightest
      c.save(); c.rotate(t * 0.7);
      ANIMA_ORDER.forEach((id, i) => { const an = i / ANIMA_ORDER.length * TAU, x = Math.cos(an) * R * 0.93 * 1, y = Math.sin(an) * R * 0.93, mine = id === Cc.id || id === Cc.res; AnimaArt.sigil(c, id, x, y, R * 0.15, mine ? '#FFFFFF' : col, k * (mine ? 1 : 0.7), mine ? 2.8 : 2); });
      c.globalAlpha = 0.7 * k; c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < 36; i++) { const an = i / 36 * TAU; c.moveTo(Math.cos(an) * R * 0.86, Math.sin(an) * R * 0.86); c.lineTo(Math.cos(an) * R * (i % 3 ? 0.82 : 0.78), Math.sin(an) * R * (i % 3 ? 0.82 : 0.78)); } c.stroke();
      c.restore();
      // the woven star: two triangles turning against each other
      [1, -1].forEach((dir, j) => { c.save(); c.rotate(dir * t * 0.9 + j * Math.PI); c.globalAlpha = 0.85 * k; c.strokeStyle = j ? col : '#FFFFFF'; c.lineWidth = j ? 2.2 : 1.4; c.beginPath(); for (let i = 0; i <= 3; i++) { const an = -Math.PI / 2 + i / 3 * TAU; c[i ? 'lineTo' : 'moveTo'](Math.cos(an) * R * 0.6, Math.sin(an) * R * 0.6); } c.stroke(); c.restore(); });
      c.save(); c.rotate(-t * 0.4); c.globalAlpha = 0.75 * k; c.strokeStyle = col; c.lineWidth = 1.4; c.setLineDash([R * 0.06, R * 0.05]); c.beginPath(); c.arc(0, 0, R * 0.42, 0, TAU); c.stroke(); c.setLineDash([]); c.restore();
      // the sign at the heart of it
      c.globalAlpha = 0.6 * k * pul; blitSized(c, glowSprite(col), -R * 0.5, -R * 0.5, R, R);
      AnimaArt.sigil(c, Cc.id, 0, 0, R * 0.52, col, k, 3.4); AnimaArt.sigil(c, Cc.id, 0, 0, R * 0.52, '#FFFFFF', k * pul, 1.4);
      c.restore();
      // the light it throws up round the pet
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * k; const gw = R * 1.1; blitSized(c, glowSprite(col), X0 - gw, Y0 - Tz * 0.9 - gw, gw * 2, gw * 2); c.restore();
    }
    /* the summoning: the zodiac sign flashes up on screen, then the light takes over */
    function drawCine(c, W, H) {
      if (S.judg) drawJudgement(c, W, H);
      if (S.helix) drawHelix(c, W, H);
      if (!S.cine) return;
      const C = S.cine, A = C.a.A, t = C.t, k = Math.min(1, t / 0.25) * Math.min(1, (C.dur - t) / 0.6);
      // a soft vignette so the light reads
      const gr = c.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.72); gr.addColorStop(0, 'rgba(8,4,24,0)'); gr.addColorStop(1, `rgba(8,4,24,${0.55 * k})`); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      if (t < 1.15) {
        const pop = t < 0.14 ? ease(t / 0.14) : 1, a = t < 0.14 ? pop : t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.45), s = Math.min(W, H * 0.6) * 0.4 * (0.6 + 0.4 * pop + t * 0.08), cx = W / 2, cy = H * 0.34;
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.3 * a; blitSized(c, glowSprite(A.color), cx - s * 1.1, cy - s * 1.1, s * 2.2, s * 2.2);
        AnimaArt.sigil(c, C.id, cx, cy, s * 0.9, A.color, 0.5 * a, 3.6); AnimaArt.sigil(c, C.id, cx, cy, s * 0.9, A.glow, 0.85 * a, 1.8); AnimaArt.sigil(c, C.id, cx, cy, s * 0.9, '#FFFFFF', 0.9 * a, 0.7);
        // a glint sweeps across it
        if (t < 0.6) { const gx = cx - s * 0.6 + (t / 0.6) * s * 1.2; c.globalAlpha = 0.35 * a; blitSized(c, glowSprite('#FFFFFF'), gx - s * 0.08, cy - s * 0.45, s * 0.16, s * 0.9); }
        for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + t * 0.8, rr = s * (0.62 + 0.08 * Math.sin(t * 6 + i)), ss = s * 0.04 * (1 + (i % 2)); c.globalAlpha = a * 0.9; blitSized(c, glowSprite('#FFFFFF'), cx + Math.cos(an) * rr - ss * 2, cy + Math.sin(an) * rr - ss * 2, ss * 4, ss * 4); }
        c.restore();
      }
    }
    /* the summon button: a sigil ring that fills as the gauge does, on the left above the move stick, well away from
       the right thumb's attack taps */
    const btn = () => ({ x: 58, y: X.H() - 272, r: 30 });
    function onBtn(x, y) { const b = btn(); if (Math.hypot(x - b.x, y - b.y) > b.r + 8) return false; if (ready()) summon(); else if (!S.used) { X.text(me.x, me.y - 1.2, `Summon gauge ${Math.round(S.gauge * 100)}%`, kit ? ANIMAS[kit.main.id].glow : '#FFF', 13); X.sfx.wrong(); } return true; }
    // the button's still parts (its disc, the Anima's portrait cut to a circle, the second Anima's) are kept as pictures
    // at the screen's resolution and laid down at whole pixels: a circle cut out of a picture is slow to paint every frame
    function drawBtn(c) {
      const b = btn(), A = ANIMAS[kit.main.id], r = ready();
      if (S.used && !S.list.length) { c.globalAlpha = 0.5; }
      if (r) { c.save(); c.globalCompositeOperation = 'lighter'; const s = b.r * Math.round((2.3 + 0.25 * Math.sin(g.t * 5)) * 20) / 20; blitC(c, btnPic('glow|' + A.color + '|' + s, s * 2, s * 2, (x, w) => blitSized(x, glowSprite(A.color), 0, 0, w, w)), b.x, b.y); c.restore(); }
      blitC(c, btnPic('disc|' + r + '|' + b.r, b.r * 2 + 4, b.r * 2 + 4, (x, w, h) => { const cx = w / 2, cy = h / 2; x.beginPath(); x.arc(cx, cy, b.r, 0, TAU); const gr = x.createRadialGradient(cx - b.r * 0.3, cy - b.r * 0.3, 2, cx, cy, b.r); gr.addColorStop(0, r ? '#F4F0FF' : '#C9C0E8'); gr.addColorStop(0.6, r ? '#B3A2E8' : '#8A7FB8'); gr.addColorStop(1, r ? '#6E58B8' : '#4A4278'); x.fillStyle = gr; x.fill();
        x.lineWidth = 5; x.strokeStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.arc(cx, cy, b.r - 3, 0, TAU); x.stroke(); }), b.x, b.y);
      if (!S.used) { c.lineWidth = 5; c.strokeStyle = A.color; c.lineCap = 'round'; c.beginPath(); c.arc(b.x, b.y, b.r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * S.gauge); c.stroke(); }
      c.lineWidth = 2.5; c.strokeStyle = r ? '#FFFFFF' : 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.stroke();
      { const id = kit.main.id, k = kit.main.k, d = b.r * 2.05; c.save(); c.globalAlpha = r || S.list.length ? 1 : 0.5;
        blitC(c, btnPic('face|' + id + '|' + k + '|' + b.r, b.r * 2 + 4, b.r * 2 + 4, (x, w, h) => { const cx = w / 2, cy = h / 2, im = AnimaArt.still(id, k, 64, { aura: false, bloom: 0 }); x.beginPath(); x.arc(cx, cy, b.r - 1.5, 0, TAU); x.clip(); x.drawImage(im, cx - d / 2, cy - d / 2 - b.r * 0.18, d, d); }), b.x, b.y); c.restore(); }
      AnimaArt.sigil(c, kit.main.id, b.x + b.r * 0.72, b.y - b.r * 0.72, 14, A.color, 1, 2.6);
      c.font = `800 9px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; const lab = S.used ? (S.list.length ? A.name.toUpperCase() : 'SUMMONED') : r ? 'SUMMON!' : `ANIMA ${Math.round(S.gauge * 100)}%`; c.strokeText(lab, b.x, b.y + b.r + 9); c.fillStyle = r ? '#FFE37A' : '#CFE2FF'; c.fillText(lab, b.x, b.y + b.r + 9);
      if (kit.res) { const id = kit.res.id, k = kit.res.k, r2 = b.r * 0.46, x2 = b.x + b.r * 0.78, y2 = b.y + b.r * 0.62;
        blitC(c, btnPic('res|' + id + '|' + k + '|' + r2, r2 * 2 + 6, r2 * 2 + 6, (x, w, h) => { const cx = w / 2, cy = h / 2, im2 = AnimaArt.still(id, k, 64, { aura: false, bloom: 0 }); x.save(); x.beginPath(); x.arc(cx, cy, r2, 0, TAU); x.fillStyle = '#2A2260'; x.fill(); x.clip(); x.drawImage(im2, cx - r2 * 1.05, cy - r2 * 1.2, r2 * 2.1, r2 * 2.1); x.restore(); x.lineWidth = 2; x.strokeStyle = '#FFE37A'; x.beginPath(); x.arc(cx, cy, r2, 0, TAU); x.stroke(); }), x2, y2);
        c.font = `800 7px ${arcFont}`; c.fillStyle = '#FFE37A'; c.fillText(kit.resonance.generic ? 'HARMONY' : 'RESONANCE', b.x, b.y + b.r + 19); }
      c.globalAlpha = 1;
    }
    /* how the Animas tilt the fight */
    const inK = src => (S.bulwark ? 0.35 : 1) * (S.balance ? 0.7 : 1) * (src && src.curseT > 0 ? 0.6 : 1);
    const outK = m => (S.balance ? 1.5 : 1) * (m && m.curseT > 0 ? 1.3 : 1);
    const rateK = () => (S.balance ? 1.25 : 1);
    const stop = () => { if (S.theme) { S.theme.stop(); S.theme = null; } };
    return { S, kit, stop, active: () => S.list.length > 0 || !!S.cine, ready, summon, onHurt, update, ents, drawAnima, drawFx, drawGround, drawCine, drawBtn, onBtn, inK, outK, rateK, liberated: () => S.liberate > 0 };
  }
  return { create };
})();
