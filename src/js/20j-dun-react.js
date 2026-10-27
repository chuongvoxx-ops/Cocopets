/* ---------- Elemental marks and reactions in the Tower ----------
   Every pet is one of eight elements. A hit leaves its element on the monster as a mark; a hit of a different element
   triggers the reaction of the pair, consumes the mark and cannot itself start another reaction (so chains only come
   from the follow-ups built for it: Eclipse Cores, Shatter and Stormbog). Switching pets is how reactions are set up.
   Light leans to enhancement and restoration, Dark to curses and draining; both still hit hard. On bosses, Freeze and
   Gravebind build a stagger meter instead of holding them; a full meter staggers them for a moment. */
const REACTIONS = {
  'fire+water': { name: 'Vaporise', col: '#CFE8FF' }, 'fire+ice': { name: 'Melt', col: '#FFB088' }, 'fire+thunder': { name: 'Overload', col: '#FF8A3A' },
  'ice+water': { name: 'Freeze', col: '#BFEFFF' }, 'thunder+water': { name: 'Electrocute', col: '#9FD8FF' }, 'ice+thunder': { name: 'Fracture', col: '#E8F8FF' },
  'fire+wind': { name: 'Firestorm', col: '#FF9A5A' }, 'water+wind': { name: 'Mist', col: '#B8E8FF' }, 'ice+wind': { name: 'Blizzard', col: '#DFF6FF' }, 'thunder+wind': { name: 'Chainstorm', col: '#FFE37A' },
  'earth+wind': { name: 'Sandstorm', col: '#E8C890' }, 'earth+fire': { name: 'Magma', col: '#FF6A1E' }, 'earth+water': { name: 'Mire', col: '#8A6A3A' }, 'earth+ice': { name: 'Permafrost', col: '#CFEFFF' }, 'earth+thunder': { name: 'Rupture', col: '#FFD080' },
  'fire+light': { name: 'Solar Flare', col: '#FFF4B0' }, 'light+water': { name: 'Purification', col: '#E8FFF4' }, 'ice+light': { name: 'Prism', col: '#FFFFFF' }, 'light+thunder': { name: 'Judgement', col: '#FFF0A0' }, 'earth+light': { name: 'Sanctuary', col: '#FFE9A8' }, 'light+wind': { name: 'Aurora', col: '#B8FFE8' },
  'dark+fire': { name: 'Hellfire', col: '#B04AFF' }, 'dark+water': { name: 'Miasma', col: '#7A3AA8' }, 'dark+ice': { name: 'Deathfrost', col: '#9FB8FF' }, 'dark+thunder': { name: 'Soulshock', col: '#D08AFF' }, 'dark+earth': { name: 'Gravebind', col: '#6A4A8A' }, 'dark+wind': { name: 'Dreadstorm', col: '#8A6AC8' }, 'dark+light': { name: 'Eclipse', col: '#FFFFFF' },
};
const pairKey = (a, b) => [a, b].sort().join('+');
const DunReact = (() => {
  // the pool a Magma reaction leaves: the lava's own cracked rock, cooler and darker toward its rim, faded softly into the
  // ground over a scorched halo; made once and laid down over every pool
  let magmaPic = null;
  function magmaSprite() {
    if (magmaPic) return magmaPic;
    const W = 256, H = 180, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const oval = stops => { x.save(); x.translate(W / 2, H / 2); x.scale(1, H / W); const gr = x.createRadialGradient(0, 0, 0, 0, 0, W / 2); stops.forEach(([o, col]) => gr.addColorStop(o, col)); x.fillStyle = gr; x.fillRect(-W / 2, -W / 2, W, W); x.restore(); };
    x.fillStyle = DunWorld.pattern('lava'); x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'source-atop'; oval([[0, 'rgba(70,16,4,0)'], [0.42, 'rgba(70,16,4,0)'], [0.8, 'rgba(70,16,4,.5)'], [1, 'rgba(70,16,4,.75)']]);
    x.globalCompositeOperation = 'destination-in'; oval([[0, 'rgba(0,0,0,1)'], [0.5, 'rgba(0,0,0,.95)'], [0.8, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]);
    x.globalCompositeOperation = 'destination-over'; oval([[0, 'rgba(40,12,6,.55)'], [0.72, 'rgba(40,12,6,.32)'], [1, 'rgba(40,12,6,0)']]);
    x.globalCompositeOperation = 'source-over';
    return (magmaPic = cv);
  }
  const TAU = Math.PI * 2, MARK_T = 9, CORE_MAX = 3;
  function create(X) {
    const me = X.me, g = X.g, mons = X.mons, zones = [], cores = [], S = { cdHeal: 0, cdShield: 0, cdSanct: 0, sanct: null, count: 0, last: '' };
    const atk = () => X.ST().atk;
    const near = (x, y, r, skip) => mons.filter(m => !m.dead && m !== skip && !m.fobj && Math.hypot(m.x - x, m.y - y) < r + m.r);
    const dmg = (m, d, el, o) => X.hitMon(m, d, Object.assign({ react: true, el: el2old(el), noAggro: false }, o || {}));
    const el2old = el => ({ fire: 'fire', ice: 'frost', water: 'bubble', thunder: 'spark', wind: 'leaf', earth: 'gold', dark: 'shadow', light: 'prism' })[el];
    // a reaction announces itself the first time it happens on a floor; after that it only shows its effect
    S.seen = S.seen || {};
    const label = (m, R, extra) => { S.count++; S.last = R.name; if (S.seen[R.name]) return; S.seen[R.name] = 1; X.text(m.x, m.y - m.r - 0.9, R.name.toUpperCase() + (extra || ''), R.col, 15, { life: 1.1, max: 1.1 }); };
    const steam = (x, y, r) => { for (let i = 0; i < 12; i++) { const a = Math.random() * TAU; X.part({ kind: 'smoke', x: x + Math.cos(a) * r * 0.4, y: y + Math.sin(a) * r * 0.3, vx: Math.cos(a) * 1.5, vy: -1.5 - Math.random(), life: 0.8, max: 0.8, size: 0.7, color: 'rgba(220,235,255,' }); } X.ring(x, y, 0.2, r, 0.3, '#CFE8FF', 0.2); };
    const zone = o => { if (zones.length >= 24) { const old = zones.reduce((a, b) => (a.life < b.life ? a : b)); old.life = Math.min(old.life, 0.3); } const z = Object.assign({ age: 0, tk: 0 }, o); zones.push(z); return z; };
    /* ---- marks ---- */
    function mark(m, el) { m.mark = { el, t: MARK_T }; }
    function onHit(m, d, o) {
      if (!m || m.dead || m.fobj || o.react || o.dot && !o.el) return;
      const el = e8Of(o.el || X.AB().el);
      if (!m.mark) { mark(m, el); return; }
      if (m.mark.el === el) { m.mark.t = MARK_T; return; }
      if ((m.rxCd || 0) > 0) return;
      m.rxCd = 0.35; const a = m.mark.el; m.mark = null; react(a, el, m, d, o);
    }
    /* ---- the reactions ---- */
    function react(a, b, m, d, o) {
      const key = pairKey(a, b), R = REACTIONS[key]; if (!R) return;
      const A = atk(), heavy = o.src === 'strong' || o.src === 'ult', boss = !!m.boss, fiend = !!m.fiend;
      const stagger = n => { if (fiend) addStagger(m, n); else if (boss) m.chill = Math.max(m.chill, 1.5); };
      switch (R.name) {
        case 'Vaporise': dmg(m, d * 1.5, b); label(m, R); steam(m.x, m.y, 1.4); break;
        case 'Melt': dmg(m, d * 1.5, b); m.chill = 0; m.freeze = 0; label(m, R); X.boom(m.x, m.y, 1.2, '#FFB088', '#FFFFFF', { n: 10, shake: 3, smoke: 3 }); break;
        case 'Overload': label(m, R); X.boom(m.x, m.y, 2.2, '#FF8A3A', '#FFE08A', { n: 20, shake: 10, smoke: 6 }); near(m.x, m.y, 2.2).forEach(q => { dmg(q, A * 2.2, 'fire', { kb: 7, stun: 0.6 }); }); stagger(20); break;
        case 'Freeze': if (boss) { m.chill = Math.max(m.chill, 2.5); stagger(28); label(m, R, fiend ? ' · stagger' : ''); } else { m.freeze = Math.max(m.freeze, 2.6); m.frozenBy = 'rx'; label(m, R); } X.sparks(m.x, m.y, '#BFEFFF', 14, 5); X.ring(m.x, m.y, 0.2, 1.4, 0.3, '#BFEFFF', 0.15); break;
        case 'Electrocute': m.electro = { t: 3.2, d: Math.max(A * 0.35, d * 0.25), tk: 0 }; label(m, R); break;
        case 'Fracture': m.brittle = 6; label(m, R); X.sparks(m.x, m.y, '#E8F8FF', 12, 6); stagger(15); break;
        case 'Firestorm': label(m, R); X.boom(m.x, m.y, 2.6, '#FF9A5A', '#FFE08A', { n: 18, shake: 6, smoke: 8 }); near(m.x, m.y, 3, m).forEach(q => { mark(q, 'fire'); dmg(q, A * 1.2, 'fire'); }); dmg(m, A * 0.8, 'fire'); break;
        case 'Mist': label(m, R); near(m.x, m.y, 3, m).forEach(q => mark(q, 'water')); for (let i = 0; i < 10; i++) X.part({ kind: 'smoke', x: m.x + (Math.random() - 0.5) * 3, y: m.y + (Math.random() - 0.5) * 2, vx: 0, vy: -0.5, life: 1, max: 1, size: 0.8, color: 'rgba(160,220,255,' }); break;
        case 'Blizzard': label(m, R); near(m.x, m.y, 3, m).forEach(q => { mark(q, 'ice'); q.chill = Math.max(q.chill, 2.5); dmg(q, A * 1.1, 'ice'); }); for (let i = 0; i < 14; i++) X.part({ kind: 'snow', x: m.x + (Math.random() - 0.5) * 4, y: m.y - 2 + Math.random(), vx: (Math.random() - 0.5) * 2, vy: 2, life: 0.9, max: 0.9, size: 2 }); break;
        case 'Chainstorm': { label(m, R); let from = m, hit = new Set([m]); for (let k = 0; k < 3; k++) { const n = near(from.x, from.y, 4).filter(q => !hit.has(q)).sort((p, q) => Math.hypot(p.x - from.x, p.y - from.y) - Math.hypot(q.x - from.x, q.y - from.y))[0]; if (!n) break; X.zap(from.x, from.y - 0.4, n.x, n.y - 0.4, '#FFE37A', 3); dmg(n, A * (1.2 - k * 0.2), 'thunder'); hit.add(n); from = n; } break; }
        case 'Sandstorm': { label(m, R); const near2 = zones.find(z => z.kind === 'sand' && Math.hypot(z.x - m.x, z.y - m.y) < 2.6); if (near2) { near2.life = Math.max(near2.life, 5); near2.d = Math.max(near2.d, A * 0.45); break; } const sands = zones.filter(z => z.kind === 'sand'); if (sands.length >= 3) { const old = sands.reduce((a, b) => (a.life < b.life ? a : b)); old.life = Math.min(old.life, 0.5); } zone({ kind: 'sand', x: m.x, y: m.y, r: 2.4, life: 5, tick: 0.5, d: A * 0.45, col: '#E8C890' }); break; }
        case 'Magma': label(m, R); zone({ kind: 'magma', x: m.x, y: m.y, r: 1.7, life: 5.5, tick: 0.4, d: A * 0.6, col: '#FF6A1E' }); break;
        case 'Mire': label(m, R); zone({ kind: 'mire', x: m.x, y: m.y, r: 2.2, life: 7, tick: 0.4, d: 0, col: '#8A6A3A' }); break;
        case 'Permafrost': if (S.cdShield <= 0) { S.cdShield = 8; const hp = X.ST().hp; g.guardMax = Math.max(g.guardMax || 1, hp * 0.3); g.guardHP = Math.min(hp * 0.3, (g.guardHP || 0) + hp * 0.22); X.ring(me.x, me.y, 0.4, 1.6, 0.4, '#CFEFFF', 0.2); label(m, R); X.text(me.x, me.y - 1.3, 'Frost armour', '#CFEFFF', 13); } else label(m, R); dmg(m, A * 0.6, 'ice'); break;
        case 'Rupture': label(m, R); X.boom(m.x, m.y, 1.8, '#D4A054', '#FFD080', { n: 16, shake: 12, smoke: 6 }); dmg(m, A * 2.4, 'earth', { stun: 0.8 }); stagger(26); for (let i = 0; i < 8; i++) X.part({ kind: 'shard', x: m.x, y: m.y, vx: (Math.random() - 0.5) * 8, vy: -4 - Math.random() * 4, g: 12, life: 0.8, max: 0.8, size: 4 + Math.random() * 4, rot: Math.random() * 6, vr: 8, color: '#9A7A4A' }); break;
        case 'Solar Flare': label(m, R); X.boom(m.x, m.y, 2.4, '#FFF4B0', '#FFFFFF', { n: 22, shake: 6, smoke: 2 }); near(m.x, m.y, 2.4).forEach(q => dmg(q, A * 1.8, 'light')); X.light(m.x, m.y, 5, 0.6); break;
        case 'Purification': if (S.cdHeal <= 0) { S.cdHeal = 6; for (let i = 0; i < 2; i++) X.drop('hp', m.x, m.y); me.chill = 0; if (me.venom) me.venom = 0; X.text(me.x, me.y - 1.3, 'Cleansed', '#E8FFF4', 13); } label(m, R); dmg(m, A * 0.7, 'light'); break;
        case 'Prism': m.prism = 1; label(m, R); X.sparks(m.x, m.y, '#FFFFFF', 12, 6); break;
        case 'Judgement': m.judge = 3; label(m, R); X.light(m.x, m.y, 3, 0.5); break;
        case 'Sanctuary': if (S.cdSanct <= 0) { S.cdSanct = 10; S.sanct = zone({ kind: 'sanct', x: me.x, y: me.y, r: 2.6, life: 7, tick: 1, d: 0, col: '#FFE9A8' }); X.text(me.x, me.y - 1.3, 'Sanctuary', '#FFE9A8', 13); } label(m, R); dmg(m, A * 0.6, 'earth'); break;
        case 'Aurora': label(m, R); near(m.x, m.y, 3, m).forEach(q => mark(q, 'light')); g.buff.haste = Math.max(g.buff.haste || 0, 4); X.ring(me.x, me.y, 0.3, 2, 0.5, '#B8FFE8', 0.2); break;
        case 'Hellfire': m.burn = Math.max(m.burn, 6); m.burnD = Math.max(m.burnD, A * 0.4); m.curse = 6; label(m, R); break;
        case 'Miasma': label(m, R); zone({ kind: 'miasma', x: m.x, y: m.y, r: 1.9, life: 5, tick: 0.5, d: A * 0.5, col: '#7A3AA8', healLeft: X.ST().hp * 0.08 }); break;
        case 'Deathfrost': m.chill = Math.max(m.chill, 4); m.deathfrost = { t: 2.5, d: A * 2.2 }; label(m, R); break;
        case 'Soulshock': label(m, R); dmg(m, A * 1.4, 'dark', { stun: 1.2 }); if (!boss) { m.cd = (m.cd || 0) + 1.2; m.laser = null; } stagger(32); X.ring(m.x, m.y, 0.2, 1.6, 0.3, '#D08AFF', 0.15); break;
        case 'Gravebind': label(m, R); if (boss) stagger(30); else { m.freeze = Math.max(m.freeze, 2.5); m.rooted = 2.5; } for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; X.part({ kind: 'spike', x: m.x + Math.cos(a) * m.r * 1.3, y: m.y + Math.sin(a) * m.r * 0.8, vx: 0, vy: 0, life: 1.6, max: 1.6, size: 0.8, color: '#3B2F63' }); } break;
        case 'Dreadstorm': label(m, R); zone({ kind: 'vortex', x: m.x, y: m.y, r: 3.2, life: 3, tick: 0.5, d: A * 0.3, col: '#8A6AC8' }); near(m.x, m.y, 3.2, m).forEach(q => mark(q, 'dark')); break;
        case 'Eclipse': { label(m, R); if (cores.length >= CORE_MAX) { const c0 = cores.shift(); burstCore(c0, 'early'); } cores.push({ x: m.x, y: m.y, t: 4, ph: Math.random() * TAU }); X.ring(m.x, m.y, 0.2, 1.4, 0.4, '#FFFFFF', 0.2); break; }
      }
      if (X.sfx) X.sfx.sparkle();
    }
    /* ---- follow-ups: Eclipse Cores, Shatter and Stormbog ---- */
    function followUps(m, d, o) {
      if (o.react) return; const el = e8Of(o.el || X.AB().el), heavy = o.src === 'strong' || o.src === 'ult';
      // a core nearby answers fire, thunder or earth
      if (cores.length && (el === 'fire' || el === 'thunder' || el === 'earth')) { const i = cores.findIndex(c0 => Math.hypot(c0.x - m.x, c0.y - m.y) < 2.6); if (i >= 0) { const c0 = cores.splice(i, 1)[0]; if (el === 'fire') { X.text(c0.x, c0.y - 1.4, 'NOVA', '#FF8A3A', 17); X.boom(c0.x, c0.y, 3.6, '#FF6A1E', '#FFFFFF', { n: 30, shake: 14, smoke: 10 }); near(c0.x, c0.y, 3.6).forEach(q => dmg(q, atk() * 3.2, 'fire')); }
        else if (el === 'thunder') { X.text(c0.x, c0.y - 1.4, 'RIFTBOLT', '#FFE37A', 17); near(c0.x, c0.y, 8).sort((p, q) => Math.hypot(p.x - c0.x, p.y - c0.y) - Math.hypot(q.x - c0.x, q.y - c0.y)).slice(0, 5).forEach((q, k) => { X.zap(c0.x, c0.y - 0.5, q.x, q.y - 0.4, '#FFE37A', 3); dmg(q, atk() * 1.1, 'thunder'); }); }
        else { X.text(c0.x, c0.y - 1.4, 'ECLIPSE WARD', '#FFE9A8', 17); const hp = X.ST().hp; g.guardMax = Math.max(g.guardMax || 1, hp * 0.5); g.guardHP = Math.min(hp * 0.5, (g.guardHP || 0) + hp * 0.5); X.ring(me.x, me.y, 0.4, 2.2, 0.5, '#FFE9A8', 0.25); } if (X.sfx) X.sfx.crash(); } }
      // Shatter: a heavy Earth blow on a frozen target
      if (el === 'earth' && heavy && (m.freeze > 0 || (m.boss && m.chill > 1.5))) { m.freeze = 0; m.chill = 0; X.text(m.x, m.y - m.r - 0.9, 'SHATTER', '#E8F8FF', 17); X.boom(m.x, m.y, 1.6, '#CFEFFF', '#FFFFFF', { n: 24, shake: 12, smoke: 2 }); dmg(m, atk() * 3 + d, 'earth', { stun: 1 }); if (m.fiend) addStagger(m, 40); }
      // Stormbog: Thunder into a monster standing in mire
      if (el === 'thunder') for (const z of zones) if (z.kind === 'mire' && !z.storm && Math.hypot(m.x - z.x, m.y - z.y) < z.r) { z.storm = true; z.d = atk() * 0.55; z.col = '#9FD8FF'; z.life = Math.max(z.life, 4); X.text(z.x, z.y - 1, 'STORMBOG', '#9FD8FF', 16); X.zap(z.x - 1.5, z.y - 2, z.x + 1.5, z.y, '#9FD8FF', 3); }
    }
    function burstCore(c0, why) { X.text(c0.x, c0.y - 1.2, 'ECLIPSE BURST', '#FFFFFF', 16); X.boom(c0.x, c0.y, 2.6, '#B983F5', '#FFFFFF', { n: 24, shake: 10, smoke: 6 }); near(c0.x, c0.y, 2.6).forEach(q => dmg(q, atk() * 2.5, 'dark')); if (X.sfx) X.sfx.crash(); }
    /* ---- the stagger meter on Super Fiends ---- */
    function addStagger(m, n) { m.stagger = (m.stagger || 0) + n; m.staggerT = 4; if (m.stagger >= 100) { m.stagger = 0; m.stunT = Math.max(m.stunT || 0, 2.2); X.banner('STAGGERED!', `${m.bname || 'It'} reels`, '#FFE37A', 1.4, true); X.ring(m.x, m.y, 0.5, 4, 0.6, '#FFE37A', 0.3); } }
    /* ---- damage going in and out, adjusted by marks ---- */
    function inK(m) { return m.brittle > 0 ? 1.3 : 1; }
    function onDirectHit(m, d, o) {
      if (o.react || o.dot) return;
      if (m.prism) { m.prism = 0; near(m.x, m.y, 5, m).slice(0, 4).forEach(q => { X.zap(m.x, m.y - 0.5, q.x, q.y - 0.3, '#FFFFFF', 2); dmg(q, d * 0.4, 'light'); }); X.sparks(m.x, m.y, '#FFFFFF', 10, 6); }
      if (m.judge > 0) { m.judge--; dmg(m, d * 0.5, 'light'); X.bolt(m.x, m.y, '#FFF0A0'); }
    }
    function petHurtK() { return S.sanct && Math.hypot(me.x - S.sanct.x, me.y - S.sanct.y) < S.sanct.r ? 0.6 : 1; }
    /* ---- ticking ---- */
    function update(dt) {
      S.cdHeal -= dt; S.cdShield -= dt; S.cdSanct -= dt;
      for (const m of mons) { if (m.dead) continue; if (m.rxCd > 0) m.rxCd -= dt; if (m.mark) { m.mark.t -= dt; if (m.mark.t <= 0) m.mark = null; } if (m.brittle > 0) m.brittle -= dt; if (m.curse > 0) m.curse -= dt; if (m.staggerT > 0) { m.staggerT -= dt; if (m.staggerT <= 0) m.stagger = 0; }
        if (m.electro) { const e = m.electro; e.t -= dt; e.tk -= dt; if (e.tk <= 0) { e.tk = 0.5; dmg(m, e.d, 'thunder', { dot: true, dotC: '#9FD8FF' }); const w = near(m.x, m.y, 3.5, m).find(q => q.mark && q.mark.el === 'water' && !q.electro); if (w) { X.zap(m.x, m.y - 0.4, w.x, w.y - 0.4, '#9FD8FF', 2); w.electro = { t: e.t, d: e.d, tk: 0.25 }; } } if (e.t <= 0) m.electro = null; }
        if (m.deathfrost) { m.deathfrost.t -= dt; if (m.deathfrost.t <= 0) { X.boom(m.x, m.y, 1.6, '#9FB8FF', '#FFFFFF', { n: 14, shake: 6, smoke: 3 }); dmg(m, m.deathfrost.d, 'dark'); X.text(m.x, m.y - m.r - 0.9, 'DEATHFROST', '#9FB8FF', 15); m.deathfrost = null; } } }
      for (let i = zones.length - 1; i >= 0; i--) { const z = zones[i]; z.age += dt; z.life -= dt; z.tk -= dt;
        if (z.kind === 'magma' && z.life > 0.4 && Math.random() < dt * 9) { const an = Math.random() * TAU, d = Math.random() * 0.75; X.part({ kind: 'ember', x: z.x + Math.cos(an) * z.r * d, y: z.y + Math.sin(an) * z.r * d * 0.6, vx: (Math.random() - 0.5) * 0.4, vy: -1.3 - Math.random() * 1.2, life: 0.7, max: 0.7, size: 2.4 + Math.random() * 2.2, color: Math.random() < 0.5 ? '#FFB347' : '#FF6A1E' }); }
        if (z.kind === 'vortex') for (const m of mons) { if (m.dead || m.boss || m.still || m.fobj) continue; const dx = z.x - m.x, dy = z.y - m.y, d = Math.hypot(dx, dy); if (d < z.r && d > 0.3) { m.x += dx / d * dt * 3; m.y += dy / d * dt * 3; } }
        if (z.kind === 'sand') for (let j = X.eshots.length - 1; j >= 0; j--) { const e = X.eshots[j]; if (Math.hypot(e.x - z.x, e.y - z.y) < z.r) { X.eshots.splice(j, 1); X.sparks(e.x, e.y, '#E8C890', 3, 3); } }
        if (z.kind === 'mire') for (const m of mons) if (!m.dead && !m.boss && Math.hypot(m.x - z.x, m.y - z.y) < z.r) m.chill = Math.max(m.chill, z.storm ? 0.25 : 0.5);
        if (z.tk <= 0) { z.tk = z.tick; if (z.d > 0) for (const m of near(z.x, z.y, z.r)) { dmg(m, z.d * z.tick, z.kind === 'magma' ? 'fire' : z.kind === 'sand' ? 'earth' : z.kind === 'miasma' || z.kind === 'vortex' ? 'dark' : 'thunder', { dot: true, dotC: z.col }); if (z.kind === 'miasma' && z.healLeft > 0) { const h = Math.min(z.healLeft, z.d * z.tick * 0.2); z.healLeft -= h; X.heal(h, true); } } }
        if (z.life <= 0) { if (S.sanct === z) S.sanct = null; zones.splice(i, 1); } }
      for (let i = cores.length - 1; i >= 0; i--) { const c0 = cores[i]; c0.t -= dt; if (c0.t <= 0) { cores.splice(i, 1); burstCore(c0); } }
    }
    /* ---- drawing: zones under everything, marks on monsters, cores and the stagger meter above ---- */
    // a soft patch on the ground: the gradient squashed with the oval, so it fades to nothing all the way round (a round
    // gradient cut to a flat oval leaves a hard edge top and bottom)
    function softOval(c, x, y, r, k, stops) {
      c.save(); c.translate(x, y); c.scale(1, k);
      const gr = c.createRadialGradient(0, 0, 0, 0, 0, r); for (const [o, col] of stops) gr.addColorStop(o, col);
      c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore();
    }
    function drawGround(c) {
      const T = X.Tz(), t = g.t;
      for (const z of zones) { const Xp = X.sx(z.x), Y = X.sy(z.y), r = z.r * T, a = Math.min(1, z.age / 0.3, z.life / 0.6); c.save(); c.globalAlpha = a;
        if (z.kind === 'sanct') { softOval(c, Xp, Y, r, 0.7, [[0, 'rgba(255,233,168,.25)'], [0.2, 'rgba(255,233,168,.25)'], [1, 'rgba(255,233,168,0)']]); c.strokeStyle = 'rgba(255,233,168,.7)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -t * 20; c.beginPath(); c.ellipse(Xp, Y, r, r * 0.7, 0, 0, TAU); c.stroke(); c.setLineDash([]); }
        else if (z.kind === 'mire') { softOval(c, Xp, Y, r, 0.7, [[0, z.storm ? 'rgba(80,120,160,.85)' : 'rgba(90,70,40,.85)'], [1, 'rgba(60,45,25,0)']]); if (z.storm) for (let k = 0; k < 3; k++) { const a2 = t * 7 + k * 2.1; c.strokeStyle = 'rgba(159,216,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Xp + Math.cos(a2) * r * 0.2, Y + Math.sin(a2) * r * 0.15); c.lineTo(Xp + Math.cos(a2 + 0.4) * r * 0.8, Y + Math.sin(a2 + 0.4) * r * 0.55); c.stroke(); } }
        else if (z.kind === 'magma') { c.drawImage(magmaSprite(), Xp - r * 1.1, Y - r * 0.77, r * 2.2, r * 1.54);
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (0.28 + 0.14 * Math.sin(t * 4 + z.x)); c.translate(Xp, Y); c.scale(1, 0.62); blitSized(c, glowSprite('#FF6A1E'), -r, -r, r * 2, r * 2);
          // a few bubbles of brighter rock swell and fade
          for (let k = 0; k < 3; k++) { const ph = (t * 0.7 + k * 0.33 + z.x * 0.1) % 1, an = k * 2.1 + z.y, s = r * (0.16 + 0.12 * Math.sin(ph * Math.PI)); c.globalAlpha = a * 0.5 * Math.sin(ph * Math.PI); blitSized(c, glowSprite('#FFD27A'), Math.cos(an) * r * 0.42 - s, Math.sin(an) * r * 0.55 - s, s * 2, s * 2); } }
        else if (z.kind === 'miasma') { softOval(c, Xp, Y, r, 0.7, [[0, 'rgba(90,30,130,.8)'], [1, 'rgba(60,20,90,0)']]); for (let k = 0; k < 4; k++) { const ph = (t * 0.6 + k * 0.25) % 1; c.globalAlpha = a * (1 - ph) * 0.6; c.strokeStyle = '#B983F5'; c.lineWidth = 1.2; c.beginPath(); c.arc(Xp + Math.sin(k * 2 + t) * r * 0.3, Y - ph * T * 1.2, 3 + ph * 4, 0, TAU); c.stroke(); } }
        else if (z.kind === 'sand') { softOval(c, Xp, Y, r, 0.7, [[0, 'rgba(220,190,130,.16)'], [0.6, 'rgba(220,190,130,.08)'], [1, 'rgba(220,190,130,0)']]); c.strokeStyle = 'rgba(255,240,200,.55)'; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); for (let k = 0; k < 7; k++) { const an = t * 1.6 + k * 0.9, d = r * (0.25 + (k % 3) * 0.25), gx = Xp + Math.cos(an) * d, gy = Y + Math.sin(an) * d * 0.7; c.moveTo(gx, gy); c.lineTo(gx - Math.sin(an) * T * 0.35, gy + Math.cos(an) * T * 0.25); } c.stroke(); }
        else if (z.kind === 'vortex') { for (let k = 0; k < 9; k++) { const an = t * (z.kind === 'vortex' ? 3 : 1.2) + k * 0.7, d = r * (0.3 + (k % 3) * 0.25) * (z.kind === 'vortex' ? 1 - ((t * 0.5 + k * 0.11) % 1) * 0.8 : 1), s = r * 0.5; c.globalAlpha = a * 0.3; blitSized(c, puffSprite(z.kind === 'sand' ? 'rgba(200,170,110,' : 'rgba(90,60,140,'), Xp + Math.cos(an) * d - s, Y + Math.sin(an) * d * 0.7 - s, s * 2, s * 2); } }
        c.restore(); }
    }
    function drawFx(c) {
      const T = X.Tz(), t = g.t;
      for (const m of mons) { if (m.dead || m.fobj || !m.mark && !(m.stagger > 0)) continue; const Xp = X.sx(m.x), Y = X.sy(m.y) - (m.z || 0) * T * 4 - m.r * T * 1.5;
        if (m.mark) { const E = E8[m.mark.el], r = Math.max(5, T * 0.2), a = Math.min(1, m.mark.t / 1.5); c.save(); c.globalAlpha = a; c.translate(Xp, Y - r - 4 + Math.sin(t * 4 + m.x) * 2); c.fillStyle = 'rgba(12,9,26,.7)'; c.beginPath(); c.arc(0, 0, r + 2, 0, TAU); c.fill(); c.fillStyle = E.color; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.5; blitSized(c, glowSprite(E.color), -r * 2.2, -r * 2.2, r * 4.4, r * 4.4); c.restore(); }
        if (m.stagger > 0 && m.fiend) { const w = 60; c.save(); c.fillStyle = 'rgba(0,0,0,.5)'; GFX.rr(c, Xp - w / 2, Y - 6, w, 6, 3); c.fill(); c.fillStyle = '#FFE37A'; GFX.rr(c, Xp - w / 2, Y - 6, w * Math.min(1, m.stagger / 100), 6, 3); c.fill(); c.restore(); } }
      for (const c0 of cores) { const Xp = X.sx(c0.x), Y = X.sy(c0.y) - T * 0.8, r = T * 0.45 * (1 + 0.1 * Math.sin(t * 8 + c0.ph)), u = 1 - c0.t / 4; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 + u * 0.4; blitSized(c, glowSprite('#B983F5'), Xp - r * 3, Y - r * 3, r * 6, r * 6); c.globalCompositeOperation = 'source-over'; const gr = c.createRadialGradient(Xp, Y, 0, Xp, Y, r); gr.addColorStop(0, '#000000'); gr.addColorStop(0.7, '#1A0A2E'); gr.addColorStop(1, '#FFFFFF'); c.fillStyle = gr; c.beginPath(); c.arc(Xp, Y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(Xp, Y, r * 1.3, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore(); }
    }
    return { S, zones, cores, onHit, followUps, onDirectHit, inK, petHurtK, update, drawGround, drawFx, onSwitch() {}, addStagger };
  }
  return { create };
})();
