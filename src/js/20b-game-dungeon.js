/* ---------- Dungeon: a top-down action game across sixteen lands. Your pet moves with the stick, attacks where you tap, uses its Strong
   attack and Ult, dodges through attacks and levels up. Every floor ends with a boss once its monsters are beaten. ---------- */
const NORMAL_IV = { n_twin: 0.28, n_volley: 0.32, n_spread: 0.36, n_lance: 0.34, n_seeker: 0.36, n_wave: 0.3, n_burst: 0.2, n_chain: 0.36, n_orbit: 0.36, n_bouncer: 0.4, n_boomerang: 0.55, n_shard: 0.34,
  firedart: 0.16, icicle: 0.3, leafblade: 0.3, sparkzap: 0.34, bubblebomb: 0.42, shadowclaw: 0.38, prismlaser: 0.3, starboom: 0.62, comet: 0.72 };
const FOG_COL = { halls: '#07050E', swamp: '#0B1813', caves: '#05060F', high: '#E8F3FB', frost: '#081222', hell: '#140504', heaven: '#F6F0FF', keep: '#050309' };
const DARK_COL = { halls: '4,3,12', swamp: '4,16,11', caves: '3,4,14', high: '0,0,0', frost: '4,10,24', hell: '26,5,2', heaven: '0,0,0', keep: '5,2,10' };
/* random events that liven up a floor */
const DUN_EVENTS = ['ambush', 'meteors', 'coinrain', 'quake', 'bloodmoon', 'surge', 'lightning', 'ambush', 'meteors'];
/* how big a pet is in the Dungeon: babies are small, evolved pets tower over the monsters */
function dunPetSize(p, form) { return clamp(((STAGES[p.stage] || STAGES[1]).scale) * ((form && form.grow) || 1) * ((p.dna && p.dna.size) || 1) / 0.84, 0.66, 1.5); }
GAMES.dungeon = {
  create(api) {
    const F = api.def; let PI = F.pet, AB = PI.AB, KIT = PI.kit, TW = AB.twist;
    /* the party: up to four pets come in; one is played, the others wait to be switched in. Each keeps its own health, magic and cooldowns */
    const party = (F.party && F.party.length ? F.party : [{ p: st, kit: F.pet }]).map((m, i) => ({ p: m.p, kit: m.kit, ST: petCombat(m.p), hp: 0, mp: 0, cd: { cdS: 0, cdS2: 0, cdS3: 0, cdU: 0 }, down: false, sprites: (arc.partySprites && arc.partySprites[i]) || arc.sprites, el: petElement(m.p) }));
    party.forEach(m => { m.hp = m.ST.hp; m.mp = m.ST.mp; });
    let cur = 0, P = party[0].p;
    const R = mulberry32((F.seed || Math.floor(Math.random() * 2147483647)) >>> 0);
    // the floor's rule (20l): rolled from its seed before the floor is laid out, since a boon or bane can change how many
    // monsters it holds; a curse that bares the party strips the accessories from every pet's stats
    F.rules = rollFloorRules(F, R); const RU = F.rules;
    if (RU.mCount !== 1) { F.pack = Math.max(3, Math.round(F.pack * RU.mCount)); F.maxMons = Math.max(12, Math.round(F.maxMons * RU.mCount)); }
    if (RU.curse && RU.curse.id === 'noacc') party.forEach(m => { m.ST = petCombat(Object.assign({}, m.p, { acc: {} })); m.hp = m.ST.hp; m.mp = m.ST.mp; });
    const M = F.rift && (F.rift.gate || F.rift.kind === 'puzzle') ? genRift(F) : genFloor(F, R), MW = M.MW, MH = M.MH, G = M.G, PB = BIOMES[F.biome];
    M.fill = PB.out ? T_GAP : T_SOLID;
    M.decalsByChunk = new Map();
    for (const d of M.decals) { const keys = new Set(); [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([ox, oy]) => keys.add(Math.floor((d.x + ox) / DunWorld.CH) + ',' + Math.floor((d.y + oy) / DunWorld.CH))); keys.forEach(k => { if (!M.decalsByChunk.has(k)) M.decalsByChunk.set(k, []); M.decalsByChunk.get(k).push(d); }); }
    const EL = k => ELEMENTS[k] || ELEMENTS.spark;
    const god = !!(st && st.dun && st.dun.god);
    let ST = party[0].ST;
    let SIZE = dunPetSize(P, formOf(P)), OY = 0.25 * SIZE;
    const me = { x: M.start.x, y: M.start.y, r: 0.2 + 0.1 * SIZE, hp: ST.hp, mp: ST.mp, ax: 0, ay: -1, face: 1, inv: 0, hurtT: 9, dash: null, spin: null, leap: null, beam: null, dead: false, bob: 0, lvFx: 0, z: 0, vx: 0, vy: 0, dodge: null, chill: 0, push: null, tilt: 0, sq: 0, wx: M.start.x, wy: M.start.y };
    const g = { t: 0, frostbite: 0, ts: 1, hitStop: 0, slowT: 0, won: false, over: false, coins: 0, kills: 0, xp: 0, lvls: 0, combo: 0, comboT: 0, comboBest: 0, total: 0, normalT: 0.4, cdS: 0, cdS2: 0, cdS3: 0, cdU: 0, warpT: 0, stopT: 0, shieldT: 0, phoenixT: 0, flash: 0, flashC: '#FFFFFF', hurtV: 0, zoom: 1, zoomP: 1, zoomT: 0, intro: 2.4, boss: null, bossIntro: 0, lastHit: 0, ultReady: false, shownTips: {}, dodgeCd: 0, dodges: 0, perfects: 0, counterT: 0, buff: {}, guardHP: 0, guardMax: 1, dmgTaken: 0, gems: [], accs: [], gremlin: null, elapsed: 0, hpShow: 1, movedOnce: false, seenNew: {},
      taps: 0, tapBuf: 0, tapAim: null, tapFx: 0, pw: {}, pwT: 0, swordA: 0, eventT: 18 + Math.random() * 10, eventN: 0, bloodT: 0, bossWake: 0, cleared: false, stonesGot: 0, lastTapT: -9, food: {} };
    const cam = { x: me.x, y: me.y, sm: 0, st: 0 };
    let RULES = null;   // the floor's rule (20l): keys, curses, boons; made once the helpers below exist
    let TS = 40;
    const layout = () => { TS = clamp(Math.round(Math.min(api.W / 9.6, api.H / 12.5)), 28, 64); };
    layout();
    let AN = null;   // the summoned Animas (20g)
    let RX = null;   // elemental marks and reactions (20j)
    const mons = [], shots = [], eshots = [], zones = [], parts = [], amb = [], rings = [], bolts = [], texts = [], lights = [], banners = [], picks = [], helpers = [];
    const pots = M.pots.map(p => Object.assign({ hp: p.kind === 'chest' ? 3 : 1, flash: 0, v: Math.floor(R() * 4) }, p));
    const shrines = M.shrines.map(s => Object.assign({ used: false, t: R() * 6 }, s));
    const hazards = M.hazards.map(h => Object.assign({ t: h.ph || 0, st: 'idle' }, h));
    const traps = M.traps.map(t => Object.assign({ t: t.ph || 0, st: 'idle', on: false, px: t.x, py: t.y, dir: 1 }, t));
    const stones = M.stones.map(s => Object.assign({ t: R() * 6, got: false }, s));
    if (RU.curse && RU.curse.id === 'nostone') stones.length = 0;
    let BOSS_KIND = F.rift && F.bossKind ? F.bossKind : floorBossKind(F, R);
    // (the Tower's bosses are all Rift-touched Cocopets: the floor's own one is made now, so its name heads the floor; it
    // fights with the floor's kind of boss for its attacks. Super Fiends keep their own shapes)
    const towerEvil = (k, i) => RiftEvil.make((((F.seed || 1) * 7919) ^ (F.n * 104729) ^ (k * 2654435761) ^ (i * 40503)) >>> 0);
    let towerEvilN = 0;
    const FLOOR_EVIL = !F.rift && !F.fiend && typeof RiftEvil !== 'undefined' ? towerEvil(1, 0) : null;
    F.bossName = F.fiend ? F.fiend.name : FLOOR_EVIL ? FLOOR_EVIL.name : BOSS_KIND.name + romanN(F.loop);
    const propList = [];
    M.props.forEach((kind, k) => propList.push({ x: (k % MW) + 0.5, y: Math.floor(k / MW) + 0.92, kind, v: Math.floor(DunArt.th(k % MW, Math.floor(k / MW), 3) * 4), biome: BIOME_ORDER[M.BI[k]], k }));
    const explored = new Uint8Array(MW * MH); if (F.fiend || (F.rift && F.rift.kind !== 'fight')) explored.fill(1);
    let RIFT = null;   // a rift stage's module (20m): its objects, puzzle and way on
    let expV = 0;   // counts the tiles explored, so pictures of the explored floor know when to repaint
    const miniNew = [];   // tiles explored since the minimap last looked
    const flow = new Int16Array(MW * MH);
    let flowT = 0;

    /* ---------- the map: walls block everything, gaps (water, sky, lava) only block walkers ---------- */
    const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
    const tileAt = (x, y) => inMap(x, y) ? G[y * MW + x] : T_SOLID;
    const walkAt = (x, y) => T_WALK[tileAt(x, y)] === 1;
    const solidAt = (x, y) => tileAt(x, y) === T_SOLID;
    const gapAt = (x, y) => tileAt(x, y) === T_GAP;
    const wallAt = solidAt;
    function blockT(tx, ty, mode) { if (!inMap(tx, ty)) return true; const t = G[ty * MW + tx]; return mode === 2 ? false : mode === 1 ? t === T_SOLID : T_WALK[t] !== 1; }
    function blocked(x, y, r, mode) {
      const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (!blockT(tx, ty, mode)) continue;
        const cx = clamp(x, tx, tx + 1), cy = clamp(y, ty, ty + 1);
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
      }
      return false;
    }
    function moveEnt(e, dx, dy, mode) {
      if (mode == null) mode = e.mv || 0;
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.2));
      let hit = false;
      const stuck = blocked(e.x, e.y, e.r, mode);
      for (let i = 0; i < n; i++) {
        const sx = dx / n, sy = dy / n;
        e.x += sx; if (!stuck && blocked(e.x, e.y, e.r, mode)) { e.x -= sx; hit = true; }
        e.y += sy; if (!stuck && blocked(e.x, e.y, e.r, mode)) { e.y -= sy; hit = true; }
      }
      if (stuck && blocked(e.x, e.y, e.r, mode)) settle(e, mode);
      return hit;
    }
    /* nudge something that ended up overlapping a wall or a drop back onto open ground */
    function settle(e, mode) {
      let best = null, bd = 1e9;
      const tx0 = Math.floor(e.x), ty0 = Math.floor(e.y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const tx = tx0 + dx, ty = ty0 + dy; if (blockT(tx, ty, mode)) continue; const px = tx + 0.5, py = ty + 0.5, d = Math.hypot(px - e.x, py - e.y); if (d < bd && !blocked(px, py, e.r, mode)) { bd = d; best = [px, py]; } }
      if (best) { const k = Math.min(1, 0.22 / (bd || 1)); e.x += (best[0] - e.x) * k; e.y += (best[1] - e.y) * k; }
    }
    function unstick(m) {
      const mode = m.mv || 0;
      if (!blocked(m.x, m.y, m.r, mode)) return;
      for (let rr = 0.25; rr < 1.6; rr += 0.25) for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, x = m.x + Math.cos(a) * rr, y = m.y + Math.sin(a) * rr; if (!blocked(x, y, m.r, mode)) { m.x = x; m.y = y; return; } }
    }
    // a free spot near (tx, ty) for something placed (a key's shards, a lesser boss): by the walls alone, since the
    // pet's distance field may not reach a far room yet
    function freeSpot(tx, ty, r) {
      const ok = (x, y) => inMap(Math.floor(x), Math.floor(y)) && !blocked(x, y, r, 0);
      if (ok(tx, ty)) return { x: tx, y: ty };
      for (let rr = 0.3; rr < 5; rr += 0.3) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, x = tx + Math.cos(a) * rr, y = ty + Math.sin(a) * rr; if (ok(x, y)) return { x, y }; }
      return null;
    }
    function walkPoint(tx, ty, m) {
      const r = m ? m.r : 0.4, mode = m && m.mv === 1 ? 1 : 0;
      const ok = (x, y) => !blocked(x, y, r, mode) && (mode === 1 || flow[Math.floor(y) * MW + Math.floor(x)] < 9999 || !inMap(Math.floor(x), Math.floor(y)));
      if (ok(tx, ty)) return { x: tx, y: ty };
      for (let rr = 0.3; rr < 4; rr += 0.3) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, x = tx + Math.cos(a) * rr, y = ty + Math.sin(a) * rr; if (ok(x, y)) return { x, y }; }
      return { x: m ? m.x : tx, y: m ? m.y : ty };
    }
    function los(x0, y0, x1, y1) {
      const dx = x1 - x0, dy = y1 - y0, d = hyp(dx, dy), n = Math.ceil(d * 3);
      for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(Math.floor(x0 + dx * t), Math.floor(y0 + dy * t))) return false; }
      return true;
    }
    function rayLen(x, y, a, max) { for (let s = 0.3; s < max; s += 0.2) if (solidAt(Math.floor(x + Math.cos(a) * s), Math.floor(y + Math.sin(a) * s))) return s; return max; }
    function buildFlow() {
      flow.fill(9999);
      const q = new Int32Array(MW * MH); let h = 0, tl = 0;
      const sx = Math.floor(me.x), sy = Math.floor(me.y);
      if (!walkAt(sx, sy)) return;
      flow[sy * MW + sx] = 0; q[tl++] = sy * MW + sx;
      while (h < tl) {
        const k = q[h++], x = k % MW, y = (k / MW) | 0, d = flow[k] + 1;
        if (d > 45) continue;
        if (x > 0 && T_WALK[G[k - 1]] && flow[k - 1] > d) { flow[k - 1] = d; q[tl++] = k - 1; }
        if (x < MW - 1 && T_WALK[G[k + 1]] && flow[k + 1] > d) { flow[k + 1] = d; q[tl++] = k + 1; }
        if (y > 0 && T_WALK[G[k - MW]] && flow[k - MW] > d) { flow[k - MW] = d; q[tl++] = k - MW; }
        if (y < MH - 1 && T_WALK[G[k + MW]] && flow[k + MW] > d) { flow[k + MW] = d; q[tl++] = k + MW; }
      }
    }
    function flowStep(m, away) {
      const tx = Math.floor(m.x), ty = Math.floor(m.y);
      let best = null, bd = away ? -1 : (flow[ty * MW + tx] || 9999);
      if (away) bd = flow[ty * MW + tx];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = tx + dx, ny = ty + dy;
        if (!walkAt(nx, ny) || (dx && dy && (!walkAt(tx + dx, ty) || !walkAt(tx, ty + dy)))) continue;
        const d = flow[ny * MW + nx] + (dx && dy ? (away ? -0.4 : 0.4) : 0);
        if (away ? d > bd : d < bd) { bd = d; best = [nx + 0.5, ny + 0.5]; }
      }
      return best;
    }

    /* ---------- effects ---------- */
    const part = o => { if (parts.length > 420) parts.splice(0, 30); parts.push(o); };
    const ring = (x, y, r0, r1, life, color, w) => { if (rings.length > 60) rings.shift(); rings.push({ x, y, r0, r1, life, max: life, color, w: w || 0.18 }); };
    const light = (x, y, r, life) => { if (lights.length > 40) lights.shift(); lights.push({ x, y, r, life, max: life }); };
    const shake = (m, t) => { cam.sm = Math.max(cam.sm, m); cam.st = Math.max(cam.st, t || 0.25); };
    const flash = (a, c) => { g.flash = Math.max(g.flash, a); g.flashC = c || '#FFFFFF'; };
    const hitstop = t => { g.hitStop = Math.max(g.hitStop, t); };
    function text(x, y, s, color, size, o) { if (texts.length > 40) texts.shift(); texts.push(Object.assign({ x: x + (Math.random() - 0.5) * 0.3, y, s: String(s), color: color || '#FFFFFF', size: size || 15, life: 0.85, max: 0.85, vy: -1.6 }, o || {})); }
    function dmgText(m, dmg, color, size, crit) {
      const t = m.dmgT;
      if (!crit && t && t.life > t.max - 0.22 && texts.includes(t)) { t.n += dmg; t.s = String(Math.round(t.n)); t.size = Math.min(size + 6, t.size + 0.6); return; }
      text(m.x, m.y - m.r - 0.25 - (m.z || 0), Math.round(dmg), color, size, crit ? { crit: true } : null);
      m.dmgT = texts[texts.length - 1]; m.dmgT.n = dmg;
    }
    /* one big banner at a time; small ones stack two deep, newest at the bottom */
    function banner(s, sub, color, life, big, astral) {
      if (banners.some(b => b.s === s && b.t < 0.5)) return;
      const same = banners.filter(b => b.big === !!big);
      if (big) same.forEach(b => { b.t = Math.max(b.t, b.life * 0.8); });
      else if (same.length >= 2) banners.splice(banners.indexOf(same[0]), 1);
      banners.push({ s, sub: sub || '', color: color || '#FFE37A', t: 0, life: life || 1.6, big: !!big, astral: !!astral });
    }
    function sparks(x, y, color, n, sp, o) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = (sp || 5) * (0.35 + Math.random() * 0.9); part(Object.assign({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.25 + Math.random() * 0.3, max: 0.55, size: 2 + Math.random() * 1.6, color, drag: 3 }, o || {})); } }
    function boom(x, y, r, color, core, o) {
      o = o || {};
      ring(x, y, 0.2, r, 0.38, color, 0.32); ring(x, y, 0.1, r * 0.7, 0.28, core || '#FFFFFF', 0.2);
      part({ kind: 'glow', x, y, vx: 0, vy: 0, life: 0.32, max: 0.32, size: r * 1.6, color });
      part({ kind: 'glow', x, y, vx: 0, vy: 0, life: 0.18, max: 0.18, size: r * 0.9, color: core || '#FFFFFF' });
      sparks(x, y, color, o.n || 14, r * 6);
      for (let i = 0; i < (o.smoke || 4); i++) { const a = Math.random() * 6.283; part({ kind: 'smoke', x: x + Math.cos(a) * r * 0.3, y: y + Math.sin(a) * r * 0.3, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 - 0.4, life: 0.7, max: 0.7, size: r * 0.35, color: 'rgba(40,30,60,' }); }
      light(x, y, r * 2.4, 0.4);
      shake(o.shake || r * 3, 0.22);
    }
    function zap(x1, y1, x2, y2, color, w) {
      const pts = [[x1, y1]], n = Math.max(3, Math.ceil(hyp(x2 - x1, y2 - y1) * 2.2));
      for (let i = 1; i < n; i++) { const t = i / n; pts.push([lerp(x1, x2, t) + (Math.random() - 0.5) * 0.5, lerp(y1, y2, t) + (Math.random() - 0.5) * 0.5]); }
      pts.push([x2, y2]);
      bolts.push({ pts, life: 0.22, max: 0.22, color, w: w || 3 });
    }
    function skyBolt(x, y) { const pts = []; let px = x + (Math.random() - 0.5) * 2, py = y - 7; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([lerp(px, x, t) + (i < 8 ? (Math.random() - 0.5) * 0.8 : 0), lerp(py, y, t)]); } return pts; }
    const timers = [];
    function after(t, f) { timers.push({ t, f }); }
    const hexA = (h, a) => { const [r, gg, b] = hexRGB(h); return `rgba(${r},${gg},${b},${clamp(a, 0, 1)})`; };

    /* ---------- monsters ---------- */
    const k = F.k;
    function spawnMon(type, x, y, o) {
      const D = MON[type] || MON.blob, el = o && o.elite;
      const m = Object.assign({ type, x, y, r: D.r * (el ? 1.35 : 1), hp: D.hp * F.hpMul * F.monHp * RU.mHp * (el ? 3 : 1), spd: D.spd * RU.mSpd * (el ? 1.12 : 1) * (0.92 + Math.random() * 0.16), dmg: D.dmg * F.dmgMul * F.monDmg * RU.mDmg * 1.25 * (el ? 1.3 : 1), xp: D.xp * (1 + 0.15 * k) * (el ? 4 : 1) * 0.65,
        color: D.color, t: Math.random() * 5, cd: 1 + Math.random() * 1.5, atkCd: 0, aggro: false, flash: 0, burn: 0, burnD: 0, venom: 0, venomT: 0, chill: 0, freeze: 0, stun: 0, kbx: 0, kby: 0, elite: !!el, state: 'move', st: 0, wob: Math.random() * 6.28, kids: 0,
        mv: D.ghost ? 2 : D.fly ? 1 : 0, z: 0, hitSq: 0, face: 1, ph: Math.random(), still: !!D.still, flank: Math.random() * 6.283 }, o || {});
      if (el) {
        const keys = AFFIX_KEYS.slice(); m.affixes = [];
        for (let i = 0; i < F.affixes; i++) m.affixes.push(keys.splice(Math.floor(Math.random() * keys.length), 1)[0]);
        if (m.affixes.includes('swift')) m.spd *= 1.55;
        if (m.affixes.includes('shielded')) { m.shieldMax = m.hp * (F.rift ? 0.2 : 0.45); m.shield = m.shieldMax; }
        m.ename = m.affixes.map(a => AFFIXES[a].name).join(' ') + ' ' + D.name;
      }
      if (type === 'gremlin') { m.life = 15; m.hp = 150 * F.hpMul * F.monHp * 0.6; m.coinStep = 0; }
      m.maxhp = m.hp;
      unstick(m);
      m.wx = m.x; m.wy = m.y;
      mons.push(m);
      return m;
    }
    function packType(biome, exclude) {
      const list = F.types.filter(t => t !== 'nest' && t !== exclude);
      // above floor 100 the high lands' own creatures lead the packs; the old ones still turn up now and then
      let tot = 0; const w = list.map(t => { const v = (MON[t].bio.includes(biome) ? 4 : 1) * (t === 'totem' ? 0.35 : 1) * (F.high && !HIGH_MON.includes(t) ? 0.35 : 1); tot += v; return v; });
      let r = R() * tot; for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
      return list[0] || 'blob';
    }
    /* packs swarm together: each member takes a slot around the pet so they surround instead of queueing */
    let brutes = 0; const bruteQ = [];
    // (F.typeShare: a type held to a share of the rolled monsters and at most three to a pack, so a floor never
    // turns up a crowd of them; a rift's typeShare, e.g. Rift 9's gaze scarabs)
    const tShare = F.typeShare || null, tCount = {}; let tAll = 0;
    const shareOk = (t, inPack) => !tShare || tShare[t] == null || ((tCount[t] || 0) < tShare[t] * (tAll + 1) && (inPack[t] || 0) < 3);
    const otherType = (avoid, inPack) => { const pool = F.types.filter(q => q !== 'nest' && q !== 'totem' && shareOk(q, inPack) && !(MON[q] && MON[q].still)); return pool.length ? pool[Math.floor(R() * pool.length)] : avoid; };
    M.packs.forEach((p, i) => {
      const n = F.pack + (R() < 0.5 ? 1 : 0), mainT = packType(p.biome, 'totem'), altT = packType(p.biome);
      const eliteHere = R() < F.elite;
      let totems = 0; const inPack = {};
      for (let j = 0; j < n; j++) {
        let t = j % 3 === 2 ? altT : mainT;
        const still = MON[t] && MON[t].still;
        if (still && totems++) t = mainT;
        if (!shareOk(t, inPack)) t = otherType(t, inPack);
        else if (tShare && !still) for (const k in tShare) if (k !== t && F.types.includes(k) && (tCount[k] || 0) + 1 <= tShare[k] * (tAll + 1) && (inPack[k] || 0) < 3 && (j % 4 === 1)) { t = k; break; }   // (and spread evenly: a few in each pack, not a crowd in one)
        tCount[t] = (tCount[t] || 0) + 1; inPack[t] = (inPack[t] || 0) + 1; tAll++;
        let x = p.x + (R() - 0.5) * 3.6, y = p.y + (R() - 0.5) * 3.6;
        if (!walkAt(Math.floor(x), Math.floor(y))) { x = p.x; y = p.y; }
        spawnMon(t, x, y, { elite: eliteHere && j === 0 && !still, pack: i, room: p.room, flank: j / n * 6.283 });
      }
      // (a brute with the pack now and then: one of the old bosses, fighting as a strong monster at half a mini boss's
      // health and half its blows; from the third floor, a few to a floor)
      if (!F.rift && !F.fiend && F.n >= 3 && brutes < (F.n < 10 ? 2 : 4) && R() < 0.3) { brutes++; bruteQ.push({ x: p.x, y: p.y, pack: i, room: p.room }); }
    });
    for (const q of bruteQ) { const pool = BOSSES.filter(b => !b.rift && (F.loop > 0 || !b.late) && (!b.titan || F.n >= 9)), here = pool.filter(b => b.biome === F.biome || (b.bio || []).includes(F.biome)), L = here.length ? here : pool;
      const bm = lesserBoss(q.x + 1.2, q.y, 0.5, '', L[Math.floor(R() * L.length)], { brute: true }); bm.brute = true; bm.dmg *= 0.5; bm.pack = q.pack; bm.room = q.room; bm.aggro = false; bm.xp = Math.round(bm.xp * 0.6); }
    M.nests.forEach(p => spawnMon('nest', p.x, p.y, { pack: -1 }));
    g.total = mons.length;
    // (floors 81 to 99: four lesser bosses roam the floor, one to a room, on top of its boss)
    if (RU.minis) { const rooms = M.rooms.map((r, i) => ({ r, i })).filter(o => o.i !== 0 && !o.r.arena && o.r.w * o.r.h >= 20); for (let i = 0; i < 4 && rooms.length; i++) { const o = rooms.splice(Math.floor(R() * rooms.length), 1)[0]; lesserBoss(o.r.x + o.r.w / 2, o.r.y + o.r.h / 2, 0.5); } }
    F.sec = M.sec; F.ter = M.ter; F.monCount = mons.length; F.shrineCount = M.shrines.length;
    /* the floor's boss: wakes once every monster is beaten. Finale floors keep it waiting in the arena; elsewhere it drops in next to you */
    // (B2: a kind other than the floor's own, for the four guardians; o.lesser: a lesser boss, roaming the floor with the
    // monsters or holding a key, with o.hpK of a guardian's health, that does not end the floor when it falls)
    function makeBoss(B2, o) {
      const B = B2 || BOSS_KIND, mini = !F.boss || !!(o && o.lesser), kindK = 0.5 + 0.5 * clamp(B.hp / BOSS_HP_MEAN, 0.5, 1.5);
      // (floor bosses, a floor's guardian and an act's boss alike: four times the health and blows 30% harder than they
      // were, then the Tower's own layers on top: monHp and monDmg by floor, and the floor's boon or bane)
      // (a rift's boss: its health and blows written for the rift's level, scaled by the pet's growth)
      const hp = F.rift ? B.hp * F.hpMul * ((o && o.hpK) || 1) : 4 * F.monHp * RU.mHp * ((o && o.hpK) || 1) * (mini ? 0.42 * BOSS_HP_MEAN * F.hpMul * kindK * (1 + 0.3 * F.loop) : B.hp * F.hpMul * 1.7 * (1 + 0.4 * F.loop));
      const bm = { type: 'boss', boss: B.id, bk: B, mini, lesser: !!(o && o.lesser), bname: o && o.name ? o.name : B2 ? B.name + romanN(F.loop) : F.bossName, x: 0, y: 0, r: B.r * (mini ? 0.9 : 1), hp, maxhp: hp, spd: B.spd * RU.mSpd * (mini ? 1.05 : 1), dmg: F.rift ? (B.dmg || 14) * F.dmgMul : 1.3 * F.monDmg * RU.mDmg * 15 * F.dmgMul * (mini ? 0.85 : 1.1) * (1 + 0.2 * F.loop), xp: mini ? (30 + 8 * F.n) : (60 + 15 * F.n), color: B.color, glow: B.glow, aggro: true, act: 'enter', actT: 0, phase: 1, cd: 2.4, z: 0, t: 0, flash: 0, burn: 0, burnD: 0, venom: 0, venomT: 0, chill: 0, freeze: 0, stun: 0, kbx: 0, kby: 0, atkCd: 0, mv: B.fly || B.id === 'moth' || B.id === 'seraph' ? 1 : 0, hitSq: 0, face: 1, step: 0, flank: 0 };
      // (a Tower boss, of any rank, is a Rift-touched Cocopet; a brute, one of the old bosses fighting with the monsters, is not)
      if (!F.rift && !(o && o.brute) && typeof RiftEvil !== 'undefined') { towerEvilN++; const E = !B2 && !(o && o.lesser) && FLOOR_EVIL ? FLOOR_EVIL : towerEvil(2, towerEvilN);
        bm.evil = E; bm.glow = E.acc; bm.bname = (o && o.name ? o.name : '') || E.name + (B2 && !(o && o.lesser) ? romanN(F.loop) : ''); }
      return bm;
    }
    function bossSpot() {
      let best = null, bs = -1;
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * 6.283, d = 4.2 + (i % 3) * 0.9, x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d;
        if (!inMap(Math.floor(x), Math.floor(y)) || blocked(x, y, 1.2, 0) || flow[Math.floor(y) * MW + Math.floor(x)] >= 9999) continue;
        let room = 0; for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (walkAt(Math.floor(x) + xx, Math.floor(y) + yy)) room++;
        const s = room + (los(me.x, me.y, x, y) ? 6 : 0) + Math.random();
        if (s > bs) { bs = s; best = { x, y }; }
      }
      return best || walkPoint(me.x + 3, me.y, { r: 1.2, mv: 0 });
    }
    function wakeBoss() {
      if (g.boss || g.won || me.dead) return;
      // (floors 41 to 59: four guardians at once, the floor's own and three more kinds; all must fall)
      const kinds = [BOSS_KIND]; if (RU.four) { const pool = BOSSES.filter(b => !b.rift && b.id !== BOSS_KIND.id && (F.loop > 0 || !b.late)); while (kinds.length < 4 && pool.length) kinds.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); }
      kinds.forEach((B2, i) => {
        const bm = makeBoss(i ? B2 : null), p = i ? guardSpot(i) : bossSpot();
        bm.x = p.x; bm.y = p.y; bm.home = null; bm.cd = 2.4 + i * 0.6;
        mons.push(bm); if (!i) { g.boss = bm; g.bossIntro = 2.8; g.bossShow = null; }
        ring(p.x, p.y, 0.3, 3.4, 0.9, bm.glow, 0.35);
        warnZone({ x: p.x, y: p.y, r: bm.r * 1.6, life: 1.25, max: 1.25, color: bm.glow });
      });
      g.bossN = kinds.length; g.bossDown = 0;
      g.slowT = Math.max(g.slowT, 0.5);
      flash(0.35, g.boss.glow); shake(9, 0.5); api.sfx.hum();
    }
    // a spot for the i-th guardian: round the pet, well apart from the others
    function guardSpot(i) { const a = i / 4 * 6.283 + 0.8; for (let d = 4.5; d < 9; d += 0.7) { const x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d; if (inMap(Math.floor(x), Math.floor(y)) && !blocked(x, y, 1.2, 0) && flow[Math.floor(y) * MW + Math.floor(x)] < 9999) return { x, y }; } return walkPoint(me.x + Math.cos(a) * 4, me.y + Math.sin(a) * 4, { r: 1.2, mv: 0, x: me.x, y: me.y }); }
    /* a lesser boss (a key's keeper, or one of the four that roam a boon floor): a kind the floor likes, at half a
       guardian's health, asleep until the pet comes near */
    function lesserBoss(x, y, hpK, name, kind, opt) {
      const pool = BOSSES.filter(b => !b.rift && (F.loop > 0 || !b.late) && (!b.titan || F.n >= 9)), B2 = kind || pool[Math.floor(R() * pool.length)] || BOSS_KIND;
      const bm = makeBoss(B2, Object.assign({ lesser: true, hpK: hpK || 0.5, name: (name ? name + ' ' : '') + B2.name }, opt || {}));
      if (bm.evil) bm.bname = (name ? name + ' ' : '') + bm.evil.name;
      const p = freeSpot(x, y, 1.0) || freeSpot(x, y, 0.5) || { x, y }; bm.x = p.x; bm.y = p.y; bm.home = null; bm.act = 'move'; bm.landed = true; bm.aggro = !!name;
      mons.push(bm); g.total++; return bm;
    }

    /* ---------- the pet's damage, crits and signature effect ---------- */
    const critC = TW === 'crit' ? 0.26 : 0.08, critM = TW === 'crit' ? 2.6 : 2;
    // what the pet in play gets from its accessories (crits, defence, speed, haste, coins, experience, treasure find)
    const accK = k => (ST && ST.acc && ST.acc[k]) || 0;
    const living = () => mons.filter(m => !m.dead);
    function nearestMon(x, y, maxD, skip, needLos) {
      let best = null, bd = maxD || 99;
      for (const m of mons) { if (m.dead || m === skip || m.pile && false || (skip && skip.has && skip.has(m)) || m.under || m.falling) continue; const d = hyp(m.x - x, m.y - y) - m.r; if (d < bd && (!needLos || los(x, y, m.x, m.y))) { bd = d; best = m; } }
      return best;
    }
    function hitMon(m, dmg, o) {
      if (!m || m.dead || m.falling) return 0;
      o = o || {}; if (g.rollOnly && !o.roll && !m.boss) { m.flash = 0.04; return 0; }
      if (m.fobj) { if (m.forward) { if (m.onHit) m.onHit(m, dmg, o); if (FD && FD.S.m && !FD.S.m.dead) hitMon(FD.S.m, dmg * m.forward, Object.assign({}, o, { viaWeak: m.kind === 'weak', weakKey: m.key, viaProxy: true })); m.flash = 0.09; return dmg; } if (m.invuln) { m.flash = 0.06; return 0; } }
      // a fiend under the ground or the water can't be struck directly, only through the parts of it still out (anchors, eyes)
      if (m.boss && (m.act === 'enter' || m.act === 'sleep' || (m.under && !o.viaProxy))) return 0;
      // a flat share of a monster's own health (Final Judgement's) lands as it is: no crit, no buff, no stun, mark or
      // reaction bonus on top, so it means the same against every boss. Only the boss's own armour still turns it
      const flat = !!o.flat;
      let crit = false;
      if (!flat) {
        if (!o.dot && !o.noCrit && Math.random() < critC + accK('crit')) { crit = true; dmg *= critM + accK('critd'); }
        if (g.stopT > 0) dmg *= 2;
        if (g.collapse && !(o && o.react)) g.collapse.d += dmg;
        if (g.buff.fury > 0) dmg *= 1.5;
        if (RULES) dmg *= RULES.dmgK();
        if (g.pw.giant) dmg *= 1 + 0.5 * g.pw.giant;
        if (g.counterT > 0 && !o.dot) dmg *= 1.6;
        if (g.bloodT > 0) dmg *= 1.15;
        if (AN && o.src !== 'hazard') dmg *= AN.outK(m);
        if (m.boss && m.stunT > 0) dmg *= 1.5;
      }
      if (m.fiend && FD) dmg = FD.dmgIn(m, dmg, o);
      if (!flat) {
        if (RX) dmg *= RX.inK(m);
        if (m.act === 'dizzy') dmg *= 1.5;
      }
      const D = MON[m.type];
      if (D && D.armor && !o.dot) dmg *= 1 - D.armor;
      if (m.guardFn && !o.dot && !o.viaProxy) { const k = m.guardFn(m, o); if (k < 1) { dmg *= k; if (k <= 0.2 && Math.random() < 0.35) text(m.x, m.y - m.r - 0.3, 'Guarded!', '#CFE2FF', 12); } }   // (a rift boss's shield side, a shell, a burrow)
      if (m.block > 0 && !o.dot) { dmg *= 0.3; if (Math.random() < 0.3) text(m.x, m.y - m.r - 0.3, 'Block!', '#CFE2FF', 12); }
      if (m.type === 'crab' && !m.block && (m.blockCd || 0) <= 0 && !o.dot && Math.random() < 0.18) { m.block = 1.3; m.blockCd = 4.5; }
      if (m.shield > 0 && !o.dot) { const s = Math.min(m.shield, F.rift ? dmg * 0.6 : dmg); m.shield -= s; dmg -= s; m.shieldT = 4; ring(m.x, m.y, m.r * 1.2, m.r * 1.5, 0.15, '#8FE3F0', 0.08); if (m.shield <= 0) { text(m.x, m.y - m.r - 0.5, 'Shield broken!', '#8FE3F0', 13); sparks(m.x, m.y, '#8FE3F0', 14, 6); } if (dmg <= 0) return 0; }
      m.hp -= dmg; m.flash = 0.09; m.hitSq = 1; g.lastHit = g.t;
      if (FD) { if (m.fiend) FD.onHit(m, dmg); else if (m.fobj) FD.objHit(m, dmg); }
      if (RX && !m.fobj && !flat) { RX.onDirectHit(m, dmg, o); RX.followUps(m, dmg, o); RX.onHit(m, dmg, o); }
      if (!m.aggro && !o.noAggro) aggroPack(m);
      // MP is earned, not regenerated: every hit of a normal attack gives a little
      if (!o.dot && (!o.src || o.src === 'normal')) gainMP(ST.regen * (crit ? 2 : 1) * (g.buff.arcane > 0 ? 3 : 1));
      if (g.pw.vampire && !o.dot && !flat) heal(dmg * 0.02 * g.pw.vampire, true);
      const E = EL(o.el || AB.el);
      if (!o.noText && (!o.dot || dmg >= 4)) {
        const big = o.src === 'ult' || dmg > ST.atk * 4;
        dmgText(m, dmg, crit ? '#FFE37A' : big ? '#FFB066' : o.dot ? (o.dotC || '#B6F09C') : '#FFFFFF', crit ? 21 : big ? 19 : o.dot ? 12 : 15, crit);
        if (!o.dot) sparks(m.x, m.y - (m.z || 0), E.color, crit ? 10 : 5, crit ? 8 : 5);
        if (crit) { ring(m.x, m.y, 0.1, 0.9, 0.2, '#FFE37A', 0.12); if (o.src && o.src !== 'normal') hitstop(0.03); }
      }
      if (!o.dot) {
        if (TW === 'burn' || o.burn) { m.burn = Math.max(m.burn, 3); m.burnD = Math.max(m.burnD, ST.atk * (o.burn ? 0.45 : 0.3)); }
        if (TW === 'chill' || o.chill) m.chill = Math.max(m.chill, m.boss ? 1 : 2.2);
        if (TW === 'venom' || o.venom) { m.venom = Math.min(6, m.venom + (o.venom || 1)); m.venomT = 4; }
        if ((TW === 'knock' || o.kb) && !m.still) { const a = Math.atan2(m.y - me.y, m.x - me.x), f = (o.kb || 4.5) * (m.boss ? 0.12 : m.type === 'golem' || m.type === 'knight' ? 0.5 : 1); m.kbx += Math.cos(a) * f; m.kby += Math.sin(a) * f; }
        if (TW === 'leech' && !flat) heal(dmg * 0.015, true);
        if (TW === 'shock' && Math.random() < 0.22 && !o.noShock && !flat) { const m2 = nearestMon(m.x, m.y, 3.5, m); if (m2) { zap(m.x, m.y, m2.x, m2.y, '#FFE37A', 2.5); hitMon(m2, dmg * 0.45, { el: 'spark', noShock: true, src: o.src }); } }
        if (o.freeze && !m.boss) m.freeze = Math.max(m.freeze, o.freeze);
        else if (o.freeze && m.boss) m.chill = Math.max(m.chill, 1.5);
        if (o.stun) m.stun = Math.max(m.stun, m.boss ? o.stun * 0.25 : o.stun);
      }
      if (m.type === 'gremlin') { const step = Math.floor((1 - m.hp / m.maxhp) * 8); while (m.coinStep < step) { m.coinStep++; drop('coin', m.x, m.y); drop('coin', m.x, m.y); } }
      if (m.hp <= 0) {
        if (m.fiend && FD && FD.holdOn && FD.holdOn(m)) return dmg;
        if ((m.type === 'skull' || (MON[m.type] && MON[m.type].pile)) && !m.rose && !m.pile) { m.pile = true; m.pileT = 3.2; m.hp = m.maxhp * 0.22; m.kbx = m.kby = 0; text(m.x, m.y - m.r - 0.4, 'Smash the bones!', '#EDE6D6', 13); sparks(m.x, m.y, '#EDE6D6', 12, 5); api.sfx.crash(); return dmg; }
        killMon(m, crit || o.src === 'ult');
      }
      return dmg;
    }
    function hitArea(x, y, r, dmg, o) { let n = 0; for (const m of mons) if (!m.dead && hyp(m.x - x, m.y - y) < r + m.r) { if (o && o.noProxy && m.fobj && m.forward) continue; hitMon(m, dmg, o); n++; } hitPots(x, y, r); if (RES && (!o || o.src !== 'hazard')) RES.areaHit(x, y, r, dmg, o); return n; }
    function hitPots(x, y, r) { for (const p of pots) if (!p.broken && hyp(p.x - x, p.y - y) < r + 0.35) breakPot(p); }
    function aggroPack(m) {
      if (m.type === 'gremlin') return;
      m.aggro = true; newMonster(m);
      // the whole room wakes up: packs that share a room fight together
      if (m.pack != null && m.pack >= 0) for (const o of mons) if (!o.aggro && (o.pack === m.pack || (m.room != null && o.room === m.room)) && hyp(o.x - m.x, o.y - m.y) < 11) { o.aggro = true; newMonster(o); }
    }
    function newMonster(m) {
      const t = m.type;
      if (!st.dun.seen || st.dun.seen[t] != null || g.seenNew[t] || !MON[t] || t === 'jelly') return;
      g.seenNew[t] = 1; st.dun.seen[t] = 0;
      if (t !== 'gremlin') banner('NEW MONSTER: ' + MON[t].name.toUpperCase(), MON[t].tip, '#FF9BD2', 2.6);
    }
    function killMon(m, big, how) {
      if (m.dead) return;
      if (m.fobj) { m.dead = true; if (FD) FD.objDied(m); return; }
      m.dead = true; g.kills++;
      if (st.dun.seen && MON[m.type] && m.type !== 'jelly') st.dun.seen[m.type] = (st.dun.seen[m.type] || 0) + 1;
      // bosses and Super Fiends go in the book too, under their own names
      if (st.dun.seen && m.boss && !(F.fiend && F.fiend.rift)) { const key = m.fiend && F.fiend ? 'fiend' + F.fiend.id : m.bk ? 'boss' + m.bk.id : null; if (key) st.dun.seen[key] = (st.dun.seen[key] || 0) + 1; }
      const E = EL(AB.el);
      if (m.boss && !m.lesser) { bossDeath(m); return; }
      if (m.lesser) { boom(m.x, m.y, 2.4, m.glow || '#FFE37A', '#FFFFFF', { n: 30, shake: 10 }); hitstop(0.08); if (!m.brute) banner('LESSER BOSS DOWN', m.bname, '#FF9F43', 1.6); for (let i = 0; i < 8; i++) drop(i % 4 === 0 ? 'hp' : i % 3 === 0 ? 'mp' : 'coin', m.x, m.y); if (accChance(0.3)) dropAcc(m.x, m.y, { bonus: 10 }); gainXP(m.xp, m.x, m.y); api.sfx.crash(); return; }
      const dx = how === 'fell' ? m.wx : m.x, dy = how === 'fell' ? m.wy : m.y;
      for (let i = 0; i < (m.elite ? 26 : 14); i++) { const a = Math.random() * 6.283, v = 2 + Math.random() * 4; part({ kind: 'confetti', x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: 9, life: 0.9, max: 0.9, size: 3 + Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 18, color: [m.color, E.color, '#FFE37A', '#FFFFFF'][i % 4] }); }
      part({ kind: 'glow', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: m.r * 3.2, color: E.color });
      ring(m.x, m.y, 0.2, m.r * 2.6, 0.3, '#FFFFFF', 0.12);
      light(m.x, m.y, 2.4, 0.3);
      if (m.elite) { boom(m.x, m.y, 1.8, '#FFE37A', '#FFFFFF', { shake: 7 }); hitstop(0.06); banner('Elite down!', m.ename || '', '#FFE37A', 1); }
      else if (big) hitstop(0.03);
      api.sfx.pop();
      const D = MON[m.type] || MON.blob;
      if (m.type === 'gremlin') {
        banner('GREMLIN CAUGHT!', 'It dropped its treasure', '#9BD15E', 2, true); flash(0.3, '#FFE37A'); api.sfx.fanfare();
        for (let i = 0; i < 22; i++) drop('coin', dx, dy);
        if (Math.random() < 0.45) drop('gem', dx, dy);
        if (accChance(0.4)) dropAcc(dx, dy, { bonus: 8 });
        drop('hp', dx, dy); drop('mp', dx, dy);
      } else {
        const nc = (m.elite ? 4 + Math.floor(Math.random() * 3) : Math.random() < D.coin * 0.7 ? 1 + (Math.random() < 0.25 ? 1 : 0) : 0) * (g.bloodT > 0 ? 2 : 1);
        for (let i = 0; i < nc; i++) drop('coin', dx, dy);
        if (m.elite || Math.random() < 0.08) drop('hp', dx, dy);
        if (m.elite || Math.random() < 0.2) drop('mp', dx, dy);
        if (m.elite || Math.random() < 0.07) drop('food', dx, dy);
        if (m.elite && Math.random() < 0.35) dropStone(dx, dy);
        if (accChance(m.elite ? 0.1 : 0.012)) dropAcc(dx, dy, { bonus: m.elite ? 6 : 0 });
      }
      gainXP(m.xp, m.x, m.y);
      g.combo++; g.comboT = 2.6; g.comboBest = Math.max(g.comboBest, g.combo);
      const cm = { 5: 'Nice!', 10: 'Great!', 20: 'Awesome!', 35: 'RAMPAGE!', 50: 'UNSTOPPABLE!', 80: 'LEGENDARY!', 120: 'GODLIKE!' }[g.combo];
      if (cm) { banner(cm, `${g.combo} combo`, '#FF9BD2', 1.1); api.sfx.chirp(); if (g.combo >= 20) { gainMP(8); heal(ST.hp * 0.025, true); } }
      if (g.combo >= 15 && g.combo % 5 === 0) { flash(0.12, '#FF9BD2'); ring(me.x, me.y, 0.3, 2.6, 0.4, '#FF9BD2', 0.2); }
      if (m.parent) m.parent.kids--;
      if (TW === 'leech') heal(ST.hp * 0.005, true);
      // what some monsters do when they go down
      if (MON[m.type] && MON[m.type].onDeath) MON[m.type].onDeath(m, X);
      if (m.type === 'spore') after(0.15, () => zones.push({ kind: 'poison', x: m.x, y: m.y, r: 1.1, life: 3, max: 3, dps: m.dmg * 0.8, tick: 0.3, own: 'enemy' }));
      if (m.type === 'splitter') for (let i = 0; i < 2; i++) { const c = spawnMon('jelly', m.x + (i ? 0.4 : -0.4), m.y, { aggro: true, pack: m.pack }); c.kbx = (i ? 3 : -3); g.total++; }
      if (m.type === 'bomb' && m.fuse == null) { boom(m.x, m.y, 1.5, '#FF6F59', '#FFE37A', { n: 12, shake: 4 }); for (const o of mons) if (o !== m && !o.dead && !o.boss && hyp(o.x - m.x, o.y - m.y) < 1.6) hitMon(o, m.dmg * 1.5, { el: 'fire' }); }
      if (m.affixes && m.affixes.includes('molten')) { const x = m.x, y = m.y, dmg = m.dmg; warnZone({ x, y, r: 2, life: 0.75, max: 0.75, color: '#FF7A3D', fn: () => { boom(x, y, 2, '#FF7A3D', '#FFE37A', { n: 18, shake: 6 }); if (hyp(me.x - x, me.y - y) < 2 + me.r) hurtPet(dmg, null); } }); }
      if (how === 'fell') { text(m.x, m.y - 0.6, ['Bye!', 'Splash!', 'Wheee!'][Math.floor(Math.random() * 3)], '#FFFFFF', 15); }
    }
    function drop(kind, x, y, food) {
      const a = Math.random() * 6.283, v = 1.5 + Math.random() * 2.5;
      const p = { kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, z: 0, vz: 4 + Math.random() * 2, t: 0, v: kind === 'coin' ? 3 + Math.floor(F.n / 2) : 0 };
      if (kind === 'gem') p.gem = wkeyR(Math.random, GIFT_GEMS);
      if (kind === 'food') p.food = food || wkeyR(Math.random, FOOD_DROPS);
      picks.push(p);
    }
    /* an accessory drops: its rarity is rolled now, from the floor (and how big the foe was) */
    function dropAcc(x, y, o) { o = o || {}; const p = { kind: 'acc', x, y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, z: 0, vz: 5 + Math.random() * 2, t: 0, v: 0, acc: rollAccessory(F.n, o) }; picks.push(p); return p; }
    const accChance = c => Math.random() < c * (1 + accK('luck'));
    /* a power stone appears on the ground near (x, y) */
    function dropStone(x, y, kind) {
      if (RULES && RULES.blocks('nostone')) return;
      const p = walkPoint(x + (Math.random() - 0.5) * 1.5, y + (Math.random() - 0.5) * 1.5, { r: 0.3, mv: 0 });
      stones.push({ x: p.x, y: p.y, kind: kind || POWER_KEYS[Math.floor(Math.random() * POWER_KEYS.length)], t: 0, got: false, fresh: 0.6 });
      ring(p.x, p.y, 0.2, 1.4, 0.4, '#FFFFFF', 0.15); sparks(p.x, p.y, '#FFE37A', 10, 5);
    }
    function takeStone(s) {
      s.got = true;
      const P = POWERS[s.kind], lv = (g.pw[s.kind] || 0) + 1;
      g.pw[s.kind] = Math.min(3, lv); g.stonesGot++;
      banner(P.name.toUpperCase() + (lv > 1 ? ` LV ${Math.min(3, lv)}` : ''), P.desc, P.color, 2.0, true);
      flash(0.3, P.color); shake(5, 0.25); api.sfx.fanfare();
      ring(me.x, me.y, 0.3, 3, 0.6, P.color, 0.3); ring(me.x, me.y, 0.2, 2, 0.45, '#FFFFFF', 0.2);
      for (let i = 0; i < 26; i++) { const a = Math.random() * 6.283, v = 2 + Math.random() * 5; part({ kind: 'spark', x: me.x, y: me.y - OY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, max: 0.6, size: 3, color: i % 2 ? P.color : '#FFFFFF', drag: 2 }); }
      light(me.x, me.y, 6, 0.6);
      if (s.kind === 'mirror') helpers.push({ kind: 'mirror', x: me.x - 1.2, y: me.y, s: -1, t: 1e9, fireT: 0.3, color: P.color });
      if (s.kind === 'giant') me.r = (0.2 + 0.1 * SIZE) * 1.15;
    }
    function breakPot(p) {
      p.hp--; p.flash = 0.1;
      if (p.hp > 0) { sparks(p.x, p.y, '#E7B46C', 5, 4); api.sfx.thud(); return; }
      p.broken = true;
      const col = p.kind === 'chest' ? '#C48A52' : p.kind === 'barrel' ? '#D9483B' : p.kind === 'crate' ? '#C49A66' : '#B7836B';
      for (let i = 0; i < 10; i++) { const a = Math.random() * 6.283, v = 2 + Math.random() * 3; part({ kind: 'shard', x: p.x, y: p.y - 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, g: 8, life: 0.7, max: 0.7, size: 4 + Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, color: col }); }
      api.sfx.crash();
      if (p.kind === 'barrel') { after(0.05, () => { boom(p.x, p.y, 2.2, '#FF7A3D', '#FFE37A', { n: 24, shake: 9, smoke: 6 }); flash(0.15, '#FFB066'); for (const m of mons) if (!m.dead && hyp(m.x - p.x, m.y - p.y) < 2.2 + m.r) hitMon(m, ST.atk * 4, { el: 'fire', burn: true, kb: 5, src: 'strong' }); hitPots(p.x, p.y, 2.2); zones.push({ kind: 'fire', x: p.x, y: p.y, r: 1.3, life: 2.5, max: 2.5, dps: ST.atk * 0.5, tick: 0, own: 'pet', el: 'fire' }); }); return; }
      const n = p.kind === 'chest' ? 5 + Math.floor(Math.random() * 3) : Math.random() < 0.65 ? 1 + Math.floor(Math.random() * 2) : 0;
      for (let i = 0; i < n; i++) drop('coin', p.x, p.y);
      const r = Math.random();
      if (p.kind === 'chest' || r < 0.18) drop('hp', p.x, p.y);
      if (p.kind === 'chest' || (r > 0.82)) drop('mp', p.x, p.y);
      if (p.kind === 'chest') { ring(p.x, p.y, 0.2, 1.6, 0.4, '#FFE37A'); text(p.x, p.y - 0.6, 'Treasure!', '#FFE37A', 16); api.sfx.sparkle(); if (Math.random() < 0.12) drop('gem', p.x, p.y); if (accChance(0.08)) dropAcc(p.x, p.y, { bonus: 4 }); }
    }

    /* ---------- the pet ---------- */
    function heal(n, quiet) {
      if (me.dead || n <= 0) return;
      if (RULES && RULES.blocks('noheal')) { if (!quiet) text(me.x, me.y - 0.9 * SIZE - 0.2, 'Cursed', '#E07BF0', 12); return; }
      const before = me.hp; me.hp = Math.min(ST.hp, me.hp + n);
      if (!quiet && me.hp - before >= 1) text(me.x, me.y - 0.9 * SIZE - 0.2, '+' + Math.round(me.hp - before), '#8FE0A6', 15);
    }
    /* low-level pets get a lot more out of every healing item: +60% at level 1, fading to nothing by level 12 */
    const lowK = () => 1 + 0.6 * clamp((12 - ST.L) / 11, 0, 1);
    function gainMP(n) { me.mp = Math.min(ST.mp, me.mp + n * 1.2); }   // all MP restoration +20%
    function gainXP(n, x, y) {
      n = Math.round(n * (1 + accK('xp')));
      P.dxp = (P.dxp || 0) + n; g.xp += n;
      // every party member earns the same experience, played or benched
      party.forEach(m => { if (m.p === P) return; m.p.dxp = (m.p.dxp || 0) + n; while (m.p.dxp >= dunXpNeed(m.p.dlv || 1) && (m.p.dlv || 1) < DLV_MAX) { m.p.dxp -= dunXpNeed(m.p.dlv || 1); m.p.dlv = (m.p.dlv || 1) + 1; const o2 = m.ST; m.ST = petCombat(m.p); m.hp = Math.min(m.ST.hp, m.hp + (m.ST.hp - o2.hp)); } });
      let up = false;
      while (P.dxp >= dunXpNeed(P.dlv || 1) && (P.dlv || 1) < DLV_MAX) { P.dxp -= dunXpNeed(P.dlv || 1); P.dlv = (P.dlv || 1) + 1; g.lvls++; up = true; }
      if (up) {
        const old = ST; ST = petCombat(P); party[cur].ST = ST;
        me.hp = Math.min(ST.hp, me.hp + (ST.hp - old.hp) + ST.hp * 0.15); me.mp = Math.min(ST.mp, me.mp + ST.mp * 0.5);
        me.lvFx = 1.6; flash(0.35, '#FFE37A'); shake(5, 0.3);
        ring(me.x, me.y, 0.3, 3.2, 0.6, '#FFE37A', 0.3); ring(me.x, me.y, 0.2, 2.2, 0.45, '#FFFFFF', 0.2);
        for (let i = 0; i < 30; i++) part({ kind: 'ember', x: me.x + (Math.random() - 0.5) * 1.2, y: me.y + (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.5) * 0.6, vy: -3 - Math.random() * 4, life: 1, max: 1, size: 3 + Math.random() * 3, color: '#FFE37A' });
        banner('LEVEL UP!', `Level ${P.dlv} · HP ${ST.hp} · MP ${ST.mp}`, '#FFE37A', 1.8, true);
        light(me.x, me.y, 6, 0.8);
        api.sfx.fanfare();
      }
    }
    function perfectDodge() {
      if (!me.dodge || me.dodge.perf) return;
      me.dodge.perf = true; g.perfects++;
      g.slowT = Math.max(g.slowT, 0.45); g.counterT = 2.6; gainMP(6);
      text(me.x, me.y - 1 * SIZE - 0.4, 'PERFECT!', '#FFE37A', 19, { crit: true, life: 1, max: 1 });
      ring(me.x, me.y, 0.3, 2.4, 0.4, '#FFE37A', 0.25); ring(me.x, me.y, 0.2, 1.4, 0.3, '#FFFFFF', 0.15);
      flash(0.12, '#FFF3B0'); api.sfx.chirp(); buzz(15);
      if (!g.shownTips.perfect) { g.shownTips.perfect = true; banner('Perfect dodge!', 'Your next hits do +60% damage', '#FFE37A', 1.6); }
    }
    /* returns true if the hit landed */
    function hurtPet(d, src, o) {
      if (me.dead || g.won) return false;
      if (me.dodge) { if (me.dodge.t < 0.24 && !(o && o.dot)) perfectDodge(); return false; }
      if (me.inv > 0 || me.dash || g.shieldT > 0 || g.phoenixT > 0 || (me.spin && me.spin.guard) || me.leap) { if (g.shieldT > 0) ring(me.x, me.y, 0.6, 1.1, 0.2, '#7FD3F2', 0.1); return false; }
      if (RX) d *= RX.petHurtK();
      d *= 1 - Math.min(0.6, accK('def'));
      if (RULES) d *= 1 - RULES.defK();
      if (AN) { d *= AN.inK(src); AN.onHurt(d, o && o.dot); }
      if (god) { ring(me.x, me.y, 0.5, 1, 0.15, '#FFE37A', 0.08); return false; }
      if (g.guardHP > 0) { const s = Math.min(g.guardHP, d); g.guardHP -= s; d -= s; ring(me.x, me.y, 0.7, 1.1, 0.2, '#8FE3F0', 0.12); if (g.guardHP <= 0) { text(me.x, me.y - 1.2, 'Shield gone!', '#8FE3F0', 13); sparks(me.x, me.y, '#8FE3F0', 12, 5); } if (d <= 0) { me.inv = 0.3; return false; } }
      me.hp -= d; me.inv = 0.55; me.hurtT = 0; g.hurtV = 0.55; g.combo = Math.max(0, Math.floor(g.combo * 0.5)); g.dmgTaken += d; me.sq = 1;
      if (src && src.affixes && src.affixes.includes('vampiric') && !src.dead) { const h = d * 2.5; src.hp = Math.min(src.maxhp, src.hp + h); text(src.x, src.y - src.r - 0.3, '+' + Math.round(h), '#FF4D6D', 12); }
      text(me.x, me.y - 0.9 * SIZE - 0.2, '-' + Math.round(d), '#FF5C5C', 17);
      sparks(me.x, me.y - OY, '#FF8FB1', 8, 5);
      shake(6, 0.22); api.sfx.squeak(); buzz(30);
      if (!g.shownTips.dodge && g.dmgTaken > ST.hp * 0.25) { g.shownTips.dodge = true; banner('Tip: DODGE!', touchUI ? 'Tap the dodge button to roll through attacks' : 'Press Shift to roll through attacks', '#7FD3F2', 2.2); }
      if (me.hp <= 0) {
        me.hp = 0; party[cur].down = true; party[cur].hp = 0; const next = party.findIndex(m => !m.down);
        if (next >= 0) { me.dead = true; g.slowT = 0.8; flash(0.4, '#FF5C5C'); banner(`${PI.name.toUpperCase()} IS DOWN`, `${party[next].p.name} steps in`, '#FF5C5C', 1.8, true); for (let i = 0; i < 20; i++) sparks(me.x, me.y, '#FF8FB1', 1, 6); after(0.9, () => { if (g.over) return; me.dead = false; switchTo(next, true); }); return true; }
        me.dead = true; g.slowT = 1.2; flash(0.5, '#FF5C5C'); banner('THE PARTY FALLS', '', '#FF5C5C', 2.2, true);
        for (let i = 0; i < 20; i++) sparks(me.x, me.y, '#FF8FB1', 1, 6);
        setTimeout(() => api.finish(false, result(false, `${party.map(m => m.p.name).join(', ')} ${party.length > 1 ? 'were' : 'was'} knocked out on floor ${F.n}.`)), 1500);
      }
      return true;
    }
    function wipeParty(why) {
      if (me.dead || g.won || g.over) return false;
      party.forEach(m => { m.down = true; m.hp = 0; }); me.hp = 0; me.dead = true; g.slowT = 1.2; flash(0.6, '#FF5C5C'); banner('THE PARTY FALLS', why || '', '#FF5C5C', 2.2, true);
      for (let i = 0; i < 20; i++) sparks(me.x, me.y, '#FF8FB1', 1, 6);
      setTimeout(() => api.finish(false, result(false, `${party.map(m => m.p.name).join(', ')} ${party.length > 1 ? 'were' : 'was'} knocked out on floor ${F.n}.`)), 1500);
      return true;
    }
    /* ---------- switching pets: the new one takes the field where the old one stood ---------- */
    function switchTo(i, forced) {
      if (i === cur && !forced) return false; const m = party[i]; if (!m || m.down || g.over) return false;
      if (!forced && RULES && RULES.blocks('noswitch')) { text(me.x, me.y - 1.2, 'Cursed: bound', '#E07BF0', 12); api.sfx.wrong(); return false; }
      if (!forced && (g.swapCd > 0 || me.dodge || me.dash || me.leap || me.beam || (AN && AN.S.cine))) return false;
      const old = party[cur]; old.hp = me.hp; old.mp = me.mp; old.cd = { cdS: g.cdS, cdS2: g.cdS2, cdS3: g.cdS3, cdU: g.cdU };
      cur = i; P = m.p; PI = m.kit; AB = PI.AB; KIT = PI.kit; TW = AB.twist; ST = m.ST; SSL = ['strong', 'strong2', 'strong3'].filter(k => KIT[k]); SIZE = dunPetSize(P, formOf(P)); OY = 0.25 * SIZE;
      me.hp = m.hp; me.mp = m.mp; me.r = 0.2 + 0.1 * SIZE; g.cdS = m.cd.cdS; g.cdS2 = m.cd.cdS2; g.cdS3 = m.cd.cdS3; g.cdU = m.cd.cdU; g.hpShow = me.hp / ST.hp;
      arc.sprites = m.sprites; if (api.form !== undefined) api.form = formOf(P);
      me.inv = Math.max(me.inv, 0.7); g.swapCd = 1.1; me.spin = null; me.beam = null; g.normalT = Math.max(g.normalT, 0.25);
      const E = EL(AB.el); ring(me.x, me.y, 0.2, 2.4, 0.4, E.color, 0.3); sparks(me.x, me.y - OY, E.color, 18, 6); light(me.x, me.y, 4, 0.6); api.sfx.chirp();
      banner(P.name.toUpperCase(), `${E8[m.el].name} · Level ${P.dlv || 1}`, E8[m.el].color, 1.1);
      if (RX) RX.onSwitch(m);
      return true;
    }
    function switchNext() { if (party.length < 2) return; for (let k = 1; k < party.length; k++) { const i = (cur + k) % party.length; if (!party[i].down) { if (switchTo(i)) return; else break; } } if (g.swapCd > 0) text(me.x, me.y - 1.2, 'Not yet', '#CFE2FF', 12); }
    /* the party re-dressed mid-run (the Team sheet, opened from the HUD's Team button): every pet's abilities, accessories
       and level read again; a pet taken out leaves, a pet put in joins at full strength; each keeps its share of health
       and magic, its cooldowns, and whether it is knocked out */
    function reparty() {
      const old = party[cur]; old.hp = me.hp; old.mp = me.mp; old.cd = { cdS: g.cdS, cdS2: g.cdS2, cdS3: g.cdS3, cdU: g.cdU };
      const playing = old.p, list = partyPets(), anima = typeof animaKitFor === 'function' ? animaKitFor(list) : null;
      const next = list.map(p => { const was = party.find(m => m.p === p), kit = petKit(p); kit.name = p.name; if (anima) kit.anima = anima;
        const ST2 = RU.curse && RU.curse.id === 'noacc' ? petCombat(Object.assign({}, p, { acc: {} })) : petCombat(p);
        const e = { p, kit, ST: ST2, hp: ST2.hp, mp: ST2.mp, cd: was ? was.cd : { cdS: 0, cdS2: 0, cdS3: 0, cdU: 0 }, down: was ? was.down : false, sprites: was ? was.sprites : null, el: petElement(p) };
        if (was) { e.hp = was.down ? 0 : Math.max(1, Math.round(ST2.hp * clamp(was.hp / was.ST.hp, 0, 1))); e.mp = Math.round(ST2.mp * clamp(was.mp / Math.max(1, was.ST.mp), 0, 1)); }
        // (a newcomer's pictures are made in the background; until they are ready the played pet's stand in)
        if (!e.sprites) { e.sprites = arc.sprites; loadSprites(formOf(p)).then(sp => { sp.rig = null; e.sprites = sp; if (party[cur] === e) arc.sprites = sp; loadRig(formOf(p)).then(r => { sp.rig = r; }, () => {}); }, () => {}); }
        return e; });
      party.length = 0; next.forEach(e => party.push(e));
      F.party = party.map(m => ({ p: m.p, kit: m.kit }));
      let i = party.findIndex(m => m.p === playing && !m.down); if (i < 0) i = party.findIndex(m => !m.down); if (i < 0) i = 0;
      const m = party[i]; cur = i; me.hp = Math.max(1, m.hp); me.mp = m.mp; g.cdS = m.cd.cdS; g.cdS2 = m.cd.cdS2; g.cdS3 = m.cd.cdS3; g.cdU = m.cd.cdU;
      switchTo(i, true); g.swapCd = 0; m.down = false;
      text(me.x, me.y - 1.6, 'The party is ready', '#8FE0A6', 13);
    }
    /* the Team button beside the health bars: pauses the run and opens the Team sheet over it */
    const btnTeam = () => ({ x: 10 + Math.min(150, api.W * 0.4) + 66, y: 26, r: 17 });
    const teamOk = () => !g.over && !me.dead && !(AN && AN.S.cine) && !(g.cineT > 0) && typeof openRunTeam === 'function';
    /* the party strip under the health bars: the played pet's element, and the others ready to tag in */
    function drawParty(c, x0, y0, bw) {
      const E = E8[party[cur].el]; c.save(); c.font = `800 8px ${arcFont}`; c.textAlign = 'left'; c.textBaseline = 'middle';   // the element shows on the pet's strip, and in the reaction call-outs when one fires
      if (party.length > 1) { const sw = 24, y = y0 + 48, cdK = clamp(1 - (g.swapCd || 0) / 1.1, 0, 1); let x = x0 + 42;
        party.forEach((m, i) => { if (i === cur) return; const EE = E8[m.el]; c.fillStyle = 'rgba(12,9,26,.72)'; GFX.rr(c, x, y, sw + 20, 22, 8); c.fill(); if (!m.down) { c.strokeStyle = cdK >= 1 ? EE.color : 'rgba(255,255,255,.25)'; c.lineWidth = 1.5; GFX.rr(c, x, y, sw + 20, 22, 8); c.stroke(); }
          const s0 = arc.sprites; arc.sprites = m.sprites; c.save(); if (m.down) c.globalAlpha = 0.35; api.pet(c, x + 12, y + 20, 16, { flip: false }); c.restore(); arc.sprites = s0;
          c.fillStyle = m.down ? 'rgba(255,92,92,.8)' : 'rgba(0,0,0,.5)'; GFX.rr(c, x + 24, y + 9, 16, 4, 2); c.fill(); if (!m.down) { c.fillStyle = m.hp / m.ST.hp < 0.3 ? '#FF5C5C' : '#8FE0A6'; GFX.rr(c, x + 24, y + 9, Math.max(2, 16 * clamp(m.hp / m.ST.hp, 0, 1)), 4, 2); c.fill(); }
          x += sw + 24; });
        c.fillStyle = 'rgba(255,255,255,.55)'; c.font = `700 8px ${arcFont}`; c.fillText(touchUI ? 'TAP ME TO SWITCH' : 'TAB SWITCHES', x0 + 42, y + 30); }
      c.restore();
    }
    function result(win, msg) {
      const r = { stars: 1, score: g.coins, coins: g.coins, kills: g.kills, xp: g.xp, lvls: g.lvls, combo: g.comboBest, msg, boss: F.boss, bossName: F.bossName, gems: win ? g.gems.slice() : [], accs: g.accs.slice(), time: g.elapsed, perfects: g.perfects, dodges: g.dodges, biome: F.biome, taps: g.taps, stones: g.stonesGot, fiend: F.fiend ? F.fiend.id : null, food: Object.assign({}, g.food) };
      if (win) { const s = gradeScore(); r.gscore = s.total; r.grade = gradeOf(s.total).g; r.parts = s; }
      return r;
    }
    function gradeScore() {
      const par = F.fiend ? 60 + 30 * F.fiend.bars : 30 + 1.3 * g.total + (F.boss ? 30 : 14) + F.n * 0.5;
      const time = clamp(1 - (g.elapsed - par) / par, 0, 1) * 35;
      const hp = clamp(1 - g.dmgTaken / (ST.hp * 1.6), 0, 1) * 35;
      const combo = clamp(g.comboBest / Math.max(6, g.total * 0.35), 0, 1) * 20;
      const dodge = Math.min(10, g.perfects * 2.5);
      return { time: Math.round(time), hp: Math.round(hp), combo: Math.round(combo), dodge: Math.round(dodge), total: Math.round(time + hp + combo + dodge) };
    }
    function aim() {
      const t = nearestMon(me.x, me.y, 8.5, null, true);
      if (t) { const d = hyp(t.x - me.x, t.y - me.y) || 1; return { t, x: (t.x - me.x) / d, y: (t.y - me.y) / d, a: Math.atan2(t.y - me.y, t.x - me.x) }; }
      return { t: null, x: me.ax, y: me.ay, a: Math.atan2(me.ay, me.ax) };
    }
    /* where a tap on the screen means to attack: the monster under (or near) the finger, else that direction */
    function aimTap(wx, wy) {
      let best = null, bd = 2.2;
      for (const m of mons) { if (m.dead || m.under || m.falling) continue; const d = hyp(m.x - wx, m.y - (m.z || 0) * 0.5 - wy) - m.r; if (d < bd) { bd = d; best = m; } }
      const tx = best ? best.x : wx, ty = best ? best.y : wy;
      let dx = tx - me.x, dy = ty - (me.y - OY), d = hyp(dx, dy);
      if (d < 0.35) { const A = aim(); return Object.assign(A, { tap: true }); }
      dx /= d; dy /= d;
      return { t: best, x: dx, y: dy, a: Math.atan2(dy, dx), tap: true, px: tx, py: ty };
    }
    const normalRate = () => (NORMAL_IV[KIT.normal.key] || 0.32) * (AB.rate || 1) / ((g.warpT > 0 ? 2 : 1) * (g.phoenixT > 0 ? 1.5 : 1) * (g.buff.haste > 0 ? 1.4 : 1) * (g.pw.quick ? 1 + 0.4 * g.pw.quick : 1) * (AN ? AN.rateK() : 1));
    /* one normal attack toward A, if the pet is ready for it */
    function tryFire(A) {
      if (me.dead || g.won || g.intro > 1.9 || g.bossIntro > 0.6 || me.dodge || me.dash || me.leap || g.normalT > 0) return false;
      const melee = KIT.normal.key === 'shadowclaw';
      if (melee && A.t && hyp(A.t.x - me.x, A.t.y - me.y) > 3 + A.t.r) { const d = hyp(A.t.x - me.x, A.t.y - me.y); moveEnt(me, (A.t.x - me.x) / d * 0.5, (A.t.y - me.y) / d * 0.5, 0); }
      else if (melee) moveEnt(me, A.x * 0.25, A.y * 0.25, 0);
      me.face = A.x >= 0 ? 1 : -1;
      g.normalT = normalRate();
      fireNormal(A);
      if (g.pw.multiply) after(0.07, () => { if (!me.dead) fireNormal(A); });
      g.taps++; g.lastTapT = g.t;
      return true;
    }
    let mxIn = 0, myIn = 0;
    function dodge() {
      if (me.dead || g.won || me.dodge || g.dodgeCd > 0 || me.leap || me.dash || g.intro > 1.9 || g.bossIntro > 0.6) return;
      let dx = mxIn, dy = myIn;
      if (!dx && !dy) { const t = nearestMon(me.x, me.y, 6); if (t) { dx = me.x - t.x; dy = me.y - t.y; } else { dx = me.ax; dy = me.ay; } }
      const d = hyp(dx, dy) || 1;
      me.dodge = { t: 0, dur: 0.3, vx: dx / d * 12.5, vy: dy / d * 12.5, perf: false };
      me.inv = Math.max(me.inv, 0.06);
      g.dodgeCd = 0.85 * (g.buff.arcane > 0 ? 0.6 : 1) * (g.dodgeK || 1); g.dodges++; g.movedOnce = true;
      api.sfx.whoosh(); if (typeof accBellChime === 'function') accBellChime();
      for (let i = 0; i < 8; i++) { const a = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 1.4, v = 2 + Math.random() * 3; part({ kind: 'smoke', x: me.x, y: me.y + 0.15, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.45, max: 0.45, size: 0.18 + Math.random() * 0.12, color: 'rgba(230,230,255,' }); }
    }

    /* ---------- pet projectiles ---------- */
    function shot(o) {
      const b = Object.assign({ x: me.x, y: me.y - OY, vx: 0, vy: 0, r: 0.14, dmg: 1, life: 1.4, t: 0, pierce: 0, hits: null, style: 'bolt', el: AB.el, src: 'normal' }, o);
      if (TW === 'pierce' && b.src === 'normal') b.pierce += 1;
      if (g.pw.bounce && !b.bounce && !b.boom) b.bounce = 1 + g.pw.bounce;
      if (g.pw.homing && !b.home && !b.boom) b.home = 2.5 + 2 * g.pw.homing;
      if (b.pierce || b.boom || b.multi) b.hits = new Map();
      shots.push(b);
      return b;
    }
    const sp = (a, v) => [Math.cos(a) * v, Math.sin(a) * v];
    function fireNormal(A) {
      const ab = KIT.normal, base = ST.atk * ab.mult, a = A.a, E = EL(ab.el), el = ab.el;
      const perp = a + Math.PI / 2, ox = Math.cos(perp), oy = Math.sin(perp), n = AB.count || 1, sz = AB.size || 1, spd = 11 * (AB.speed || 1);
      const fx = (dx, dy) => ({ x: me.x + dx, y: me.y - OY + dy });
      switch (ab.key) {
        case 'n_twin': [-0.17, 0.17].forEach(o => { const [vx, vy] = sp(a, spd); shot(Object.assign(fx(ox * o, oy * o), { vx, vy, dmg: base * 0.5, r: 0.13 * sz, style: 'bolt', el })); }); break;
        case 'n_volley': [-0.13, 0, 0.13].forEach(d => { const [vx, vy] = sp(a + d, spd); shot({ vx, vy, dmg: base * 0.37, r: 0.13 * sz, style: 'orb', el }); }); break;
        case 'n_spread': for (let i = 0; i < n; i++) { const [vx, vy] = sp(a + (i - (n - 1) / 2) * 0.17, spd); shot({ vx, vy, dmg: base * 0.45, r: 0.13 * sz, style: 'dart', el }); } break;
        case 'n_lance': for (let i = 0; i < n; i++) { const o2 = n > 1 ? (i - 0.5) * 0.3 : 0, [vx, vy] = sp(a, spd * 1.45); shot(Object.assign(fx(ox * o2, oy * o2), { vx, vy, dmg: base * 1.1, r: 0.12, pierce: 3, style: 'needle', el })); } break;
        case 'n_seeker': for (let i = 0; i < n; i++) { const [vx, vy] = sp(a + (n > 1 ? (i ? 0.9 : -0.9) : (Math.random() < 0.5 ? -0.8 : 0.8)), spd * 0.62); shot({ vx, vy, dmg: base * 0.75, r: 0.17 * sz, home: 7, style: 'orb', el, life: 2 }); } break;
        case 'n_wave': [1, -1].forEach(w => { const [vx, vy] = sp(a, spd * 0.85); shot({ vx, vy, dmg: base * 0.55, r: 0.15 * sz, wave: w, ox, oy, style: 'diamond', el }); }); break;
        case 'n_burst': for (let i = 0; i < n; i++) { const [vx, vy] = sp(a + (Math.random() - 0.5) * 0.9, spd * (0.8 + Math.random() * 0.4)); shot({ vx, vy, dmg: base * 0.16, r: 0.11, life: 0.32, style: 'spark', el }); } break;
        case 'n_chain': { const [vx, vy] = sp(a, spd * 1.15); shot({ vx, vy, dmg: base * 1, r: 0.14, chain: n, style: 'zap', el }); break; }
        case 'n_orbit': { const [vx, vy] = sp(a, spd); shot({ vx, vy, dmg: base * 0.7, r: 0.15 * sz, style: 'orb', el }); break; }
        case 'n_bouncer': [-0.25, 0.25].forEach(d => { const [vx, vy] = sp(a + d, spd * 0.72); shot({ vx, vy, dmg: base * 0.7, r: 0.2 * sz, bounce: 3, style: 'bubble', el, life: 2.2 }); }); break;
        case 'n_boomerang': for (let i = 0; i < n; i++) { const [vx, vy] = sp(a + (n > 1 ? (i ? 0.35 : -0.35) : 0), spd * 0.95); shot({ vx, vy, dmg: base * 1, r: 0.26 * sz, boom: 0.42, style: 'boom', el, life: 2.4 }); } break;
        case 'n_shard': { const [vx, vy] = sp(a, spd); shot({ vx, vy, dmg: base * 1, r: 0.17 * sz, split: true, style: 'crystal', el }); break; }
        case 'firedart': { const [vx, vy] = sp(a + (Math.random() - 0.5) * 0.12, 14); shot({ vx, vy, dmg: base * 0.42, r: 0.12, burn: Math.random() < 0.3, style: 'dart', el: 'fire' }); break; }
        case 'icicle': { const [vx, vy] = sp(a, 16); shot({ vx, vy, dmg: base * 0.95, r: 0.12, pierce: 4, chill: true, style: 'needle', el: 'frost' }); break; }
        case 'leafblade': [-0.5, 0.5].forEach(d => { const [vx, vy] = sp(a + d, 8); shot({ vx, vy, dmg: base * 0.6, r: 0.18, home: 5, spin: 1, style: 'leaf', el: 'leaf', life: 1.8 }); }); break;
        case 'sparkzap': { const t = A.t || nearestMon(me.x, me.y, 6, null, true); if (t) { zap(me.x, me.y - OY, t.x, t.y, E.color, 3.5); hitMon(t, base * 0.9, { el }); let from = t; const done = new Set([t]); for (let j = 0; j < 2; j++) { const t2 = nearestMon(from.x, from.y, 3.5, done); if (!t2) break; done.add(t2); zap(from.x, from.y, t2.x, t2.y, E.color, 2.5); hitMon(t2, base * 0.6, { el }); from = t2; } light(t.x, t.y, 2, 0.15); } break; }
        case 'bubblebomb': { const [vx, vy] = sp(a, 8); shot({ vx, vy, dmg: base * 0.9, r: 0.24, bounce: 2, aoe: 1.2, style: 'bubble', el: 'bubble', life: 2 }); break; }
        case 'shadowclaw': { const reach = 2.3 * (0.9 + 0.1 * SIZE); for (const m of mons) { if (m.dead) continue; const dx = m.x - me.x, dy = m.y - me.y, d = hyp(dx, dy); if (d < reach + m.r) { let da = Math.atan2(dy, dx) - a; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; if (Math.abs(da) < 1.05) hitMon(m, base * 1.25, { el }); } } hitPots(me.x + Math.cos(a) * 1.2, me.y + Math.sin(a) * 1.2, 1); part({ kind: 'slash', x: me.x, y: me.y - 0.2, a, r: reach, life: 0.18, max: 0.18, color: E.color, vx: 0, vy: 0, flip: (g.t * 3 | 0) % 2 }); api.sfx.whoosh(); break; }
        case 'prismlaser': { const [vx, vy] = sp(a, 20); shot({ vx, vy, dmg: base * 0.6, r: 0.1, bounce: 3, pierce: 2, style: 'laser', el: 'prism', life: 1.2 }); break; }
        case 'starboom': [-0.45, 0, 0.45].forEach(d => { const [vx, vy] = sp(a + d, 10); shot({ vx, vy, dmg: base * 0.72, r: 0.3, boom: 0.4, style: 'star', el: 'gold', life: 2.4 }); }); break;
        case 'comet': { const [vx, vy] = sp(a, 7.5); shot({ vx, vy, dmg: base * 2, r: 0.32, aoe: 1.8, burnZone: true, style: 'comet', el: 'cosmic', life: 1.8 }); break; }
      }
      me.sq = Math.max(me.sq, 0.35);
      if (Math.random() < 0.35) api.sfx.blip();
    }
    function splashShot(b, x, y) {
      if (b.aoe) { hitArea(x, y, b.aoe, b.dmg * 0.7, { el: b.el }); boom(x, y, b.aoe, EL(b.el).color, EL(b.el).core, { n: 10, smoke: 2, shake: 2 }); }
      if (b.burnZone) zones.push({ kind: 'fire', x, y, r: 1.3, life: 2.5, max: 2.5, dps: ST.atk * 0.45, tick: 0, own: 'pet', el: 'fire' });
    }

    /* ---------- strong attacks ---------- */
    let SSL = ['strong', 'strong2', 'strong3'].filter(k => KIT[k]); const CDK = { strong: 'cdS', strong2: 'cdS2', strong3: 'cdS3' };
    function useStrong(slot) {
      slot = slot && KIT[slot] ? slot : 'strong';
      const ab = KIT[slot];
      if (me.dead || g.won || g.intro > 1.9 || g.bossIntro > 0.6) return;
      if (RULES && RULES.blocks('noskill')) { text(me.x, me.y - 1.1, 'Cursed: no skills', '#E07BF0', 13); api.sfx.wrong(); return; }
      if (g[CDK[slot]] > 0) return;
      if (me.mp < ab.cost) { text(me.x, me.y - 1.1, 'Not enough MP', '#7FB6FF', 13); api.sfx.wrong(); return; }
      me.mp -= ab.cost; g[CDK[slot]] = ab.cd; me.castT = me.castM = 0.55; me.castUlt = false;   // (its arms thrust out with it)
      const A = aim(), base = ST.atk * ab.mult, a = A.a, E = EL(ab.el), el = ab.el, tx = A.t ? A.t.x : me.x + Math.cos(a) * 3, ty = A.t ? A.t.y : me.y + Math.sin(a) * 3;
      api.sfx.whoosh(); me.sq = 0.8;
      switch (ab.key) {
        case 's_rush': case 'pounce': {
          const dist = ab.key === 'pounce' ? 4.5 : 4, t = ab.key === 'pounce' ? 0.32 : 0.24;
          me.dash = { vx: Math.cos(a) * dist / t, vy: Math.sin(a) * dist / t, t, max: t, hit: new Set(), dmg: base * (ab.key === 'pounce' ? 1.4 : 2.2), land: ab.key === 'pounce' ? base * 2.6 : base * 1.5, el, leap: ab.key === 'pounce' };
          break;
        }
        case 's_gust': { const [vx, vy] = sp(a, 11); shot({ vx, vy, dmg: base * 2.4, r: 0.7, pierce: 99, style: 'crescent', el, life: 0.75, src: 'strong', a, kb: 3 }); shake(3, 0.15); break; }
        case 's_whip': case 'whirl': me.spin = { t: ab.key === 'whirl' ? 1.2 : 0.8, tick: 0, r: (ab.key === 'whirl' ? 2.1 : 1.8) * (0.9 + 0.1 * SIZE), dmg: base * 0.6, el, pull: ab.key === 'whirl' }; break;
        case 's_fury': { let i = 0; const go = () => { if (me.dead || g.won) return; const A2 = aim(); for (const m of mons) { if (m.dead) continue; const dx = m.x - me.x, dy = m.y - me.y, d = hyp(dx, dy); let da = Math.atan2(dy, dx) - A2.a; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; if (d < 2.5 + m.r && Math.abs(da) < 1.1) hitMon(m, base * 0.7, { el, src: 'strong' }); } part({ kind: 'slash', x: me.x, y: me.y - 0.2, a: A2.a + (i % 2 ? 0.3 : -0.3), r: 2.5, life: 0.16, max: 0.16, color: E.color, vx: 0, vy: 0, flip: i % 2 }); api.sfx.whoosh(); shake(2, 0.08); if (++i < 5) after(0.08, go); }; go(); break; }
        case 's_eyebeam': me.beam = { t: 0.55, max: 0.55, w: 0.45, len: 8, dps: base * 6, el, a, small: true }; flash(0.15, E.color); break;
        case 's_slam': me.leap = { t: 0.36, max: 0.36, dmg: base * 2.8, r: 2.6, el }; break;
        case 's_orbs': for (let i = 0; i < 8; i++) { const [vx, vy] = sp(i / 8 * 6.283, 7); shot({ vx, vy, dmg: base * 0.55, r: 0.2, home: 9, style: 'orb', el, life: 2.2, src: 'strong' }); } ring(me.x, me.y, 0.3, 1.6, 0.3, E.color); break;
        case 's_burst': after(0.12, () => { hitArea(tx, ty, 1.9, base * 3, { el, src: 'strong', kb: 2 }); boom(tx, ty, 1.9, E.color, E.core, { n: 22, shake: 7 }); flash(0.12, E.color); }); ring(tx, ty, 1.9, 1.7, 0.14, '#FFFFFF', 0.06); break;
        case 's_spikes': { const fiery = el === 'fire', e8 = e8Of(el), ph = i2 => i2 * 0.7; for (let w = 0; w < 2; w++) after(w * 0.18, () => { const rr = 1.4 + w * 1.2; for (let i = 0; i < 12; i++) { const aa = i / 12 * 6.283 + w * 0.26, x = me.x + Math.cos(aa) * rr, y = me.y + Math.sin(aa) * rr; part({ kind: 'spike', x, y, vx: 0, vy: 0, life: fiery ? 0.75 : 0.6, max: fiery ? 0.75 : 0.6, size: fiery ? 0.7 : 1.0 + (i % 3) * 0.12, color: E.color, el, e8: fiery ? null : e8, core: E.core, ph: ph(i) + w * 3.1 });
              // the element bursts with each spike: fire throws embers and smoke and leaves a burning scorch, others glow
              if (fiery) { for (let k = 0; k < 3; k++) part({ kind: 'ember', x, y: y - 0.3, vx: (Math.random() - 0.5) * 2.5, vy: -2 - Math.random() * 3, g: 3, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 3 + Math.random() * 3, color: k ? E.color : '#FFE37A' }); if (i % 3 === 0) part({ kind: 'smoke', x, y: y - 0.4, vx: (Math.random() - 0.5) * 0.6, vy: -1.4, life: 0.9, max: 0.9, size: 0.6, color: 'rgba(60,40,36,' }); }
              else espikeBurst(part, e8, x, y, i); }
            hitArea(me.x, me.y, rr + 0.6, base * 1.4, { el, src: 'strong', kb: 3 }); ring(me.x, me.y, 0.3, rr + 0.6, 0.25, E.color); shake(4, 0.12);
            if (fiery) { for (let i = 0; i < 12; i++) { const aa = i / 12 * 6.283 + w * 0.26; if (i % 2 === 0) zones.push({ kind: 'fire', x: me.x + Math.cos(aa) * rr, y: me.y + Math.sin(aa) * rr, r: 1.0, life: 2.2, max: 2.2, dps: base * 0.25, tick: 0, own: 'pet', el: 'fire' }); } flash(0.08, E.color); } }); break; }
        case 'fireball': { const [vx, vy] = sp(a, 9); shot({ vx, vy, dmg: base * 3.2, r: 0.38, aoe: 1.9, burn: true, style: 'fireball', el: 'fire', life: 1.5, src: 'strong', boomBig: true }); break; }
        case 'frostnova': { hitArea(me.x, me.y, 3.2, base * 1.6, { el: 'frost', freeze: 2.4, src: 'strong' }); boom(me.x, me.y, 3.2, '#7FD3F2', '#FFFFFF', { n: 26, shake: 6 }); for (let i = 0; i < 18; i++) { const aa = i / 18 * 6.283; part({ kind: 'shard', x: me.x, y: me.y, vx: Math.cos(aa) * 8, vy: Math.sin(aa) * 8, life: 0.45, max: 0.45, size: 6, rot: aa, vr: 0, color: '#CFEFFF', drag: 4 }); } flash(0.25, '#BFEFFF'); break; }
        case 'chain': { let from = me, done = new Set(); for (let j = 0; j < 6; j++) { const t2 = nearestMon(from.x, from.y, j ? 4.5 : 8, done, !j); if (!t2) break; done.add(t2); const fx0 = from.x, fy0 = from.y - (j ? 0 : OY); after(j * 0.06, () => { zap(fx0, fy0, t2.x, t2.y, '#FFE37A', 5); zap(fx0, fy0, t2.x, t2.y, '#FFFFFF', 2); hitMon(t2, base * 1.6 * Math.pow(0.92, j), { el: 'spark', src: 'strong', stun: 0.3 }); light(t2.x, t2.y, 2.4, 0.2); sparks(t2.x, t2.y, '#FFE37A', 8, 7); }); from = t2; } flash(0.12, '#FFF3B0'); shake(3, 0.12); break; }
        case 'thorns': for (let i = 1; i <= 7; i++) after(i * 0.05, () => { const x = me.x + Math.cos(a) * i * 0.9, y = me.y + Math.sin(a) * i * 0.9; if (solidAt(Math.floor(x), Math.floor(y))) return; part({ kind: 'spike', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 1, color: '#6CC15A' }); hitArea(x, y, 0.85, base * 1.5, { el: 'leaf', venom: 2, src: 'strong' }); sparks(x, y, '#B6F09C', 4, 4); shake(1.5, 0.06); }); break;
        case 'meteor': zones.push({ kind: 'warn', x: tx, y: ty, r: 2.4, life: 0.45, max: 0.45, own: 'pet', color: '#FF9F43', fn: () => { hitArea(tx, ty, 2.4, base * 5, { el: 'fire', src: 'strong', kb: 3 }); boom(tx, ty, 2.4, '#FF9F43', '#FFE37A', { n: 30, shake: 10, smoke: 8 }); flash(0.25, '#FFB066'); hitstop(0.05); zones.push({ kind: 'fire', x: tx, y: ty, r: 1.6, life: 3, max: 3, dps: ST.atk * 0.5, tick: 0, own: 'pet', el: 'fire' }); } }); part({ kind: 'meteorfall', x: tx, y: ty, vx: 0, vy: 0, life: 0.45, max: 0.45, size: 1.1, color: '#FF9F43' }); break;
        case 'blackhole': zones.push({ kind: 'vortex', x: tx, y: ty, r: 3.5, life: 2.2, max: 2.2, dps: base * 1.6, tick: 0, own: 'pet', el: 'cosmic', end: base * 2.5 }); flash(0.15, '#B07CF0'); break;
        default: if (STAR && ab.key.slice(0, 2) === 'x_') STAR.strong(ab.key.slice(2), { a, base, E, el, tx, ty, A, up: false }); else if (ELEM && ab.key.slice(0, 3) === 'ex_') ELEM.strong(ab.key.slice(3), { a, base, E, el, e8: ab.e8, tx, ty, A, up: (ab.tier || 1) >= 2, evo: ab.evo || 1, sig: !!ab.sig }); break;
        case 'thunder': { hitArea(me.x, me.y, 2.5, base * 2.2, { el: 'spark', stun: 1, src: 'strong', kb: 2 }); boom(me.x, me.y, 2.5, '#FFE37A', '#FFFFFF', { n: 20, shake: 9 }); const tg = living().filter(m => hyp(m.x - me.x, m.y - me.y) < 7).slice(0, 8); tg.forEach((m, j) => after(0.08 + j * 0.07, () => { if (m.dead) return; bolts.push({ pts: skyBolt(m.x, m.y), life: 0.3, max: 0.3, color: '#FFE37A', w: 5 }); hitMon(m, base * 1.8, { el: 'spark', stun: 0.8, src: 'strong' }); boom(m.x, m.y, 0.9, '#FFE37A', '#FFFFFF', { n: 8, smoke: 1, shake: 3 }); })); flash(0.35, '#FFF7C2'); api.sfx.crash(); break; }
      }
    }

    /* ---------- ultimates ---------- */
    let beamUlt = null, petalT = 0, blizT = 0, supernova = 0, swarmQ = 0, novaR = 11, STAR = null, ELEM = null, RES = null;
    const dragons = [];
    function useUlt() {
      const ab = KIT.ult;
      if (me.dead || g.won || g.intro > 1.9 || g.bossIntro > 0.6) return;
      if (RULES && RULES.blocks('noult')) { text(me.x, me.y - 1.1, 'Cursed: no Ultimates', '#E07BF0', 13); api.sfx.wrong(); return; }
      if (g.cdU > 0) return;
      if (ab.elem && (ab.star || 0) < ELEM_ULT_STARS) { text(me.x, me.y - 1.1, 'Only a five-star pet can cast this', '#CFE2FF', 13); api.sfx.wrong(); return; }
      if (me.mp < ab.cost) { text(me.x, me.y - 1.1, `Ult needs ${ab.cost} MP`, '#7FB6FF', 13); api.sfx.wrong(); return; }
      me.mp -= ab.cost; g.cdU = ab.cd; me.castT = me.castM = 1.0; me.castUlt = true;   // (its arms go up high)
      const E = EL(ab.el), base = ST.atk * ab.mult, A = aim(), up = ab.tier >= 2;
      g.slowT = up ? 0.5 : 0.35; flash(up ? 0.7 : 0.55, E.color); g.zoomP = up ? 1.16 : 1.12; g.zoomT = up ? 0.7 : 0.5; shake(up ? 11 : 8, 0.35);
      // the cast: a column of light, a flare and two soft shockwaves
      part({ kind: 'pillar', x: me.x, y: me.y, vx: 0, vy: 0, life: up ? 0.9 : 0.6, max: up ? 0.9 : 0.6, size: up ? 1.6 : 1.1, color: E.color });
      part({ kind: 'flare', x: me.x, y: me.y - OY, vx: 0, vy: 0, life: 0.5, max: 0.5, size: up ? 7 : 5, color: E.color });
      ring(me.x, me.y, 0.2, up ? 6 : 4.5, 0.55, E.color, 0.35); ring(me.x, me.y, 0.2, 3, 0.4, '#FFFFFF', 0.2);
      if (up) { ring(me.x, me.y, 0.4, 8, 0.8, '#FFE37A', 0.3); for (let i = 0; i < 6; i++) after(i * 0.05, () => part({ kind: 'flare', x: me.x + (Math.random() - 0.5) * 3, y: me.y - OY + (Math.random() - 0.5) * 2, vx: 0, vy: 0, life: 0.4, max: 0.4, size: 2.2, color: '#FFE37A' })); }
      for (let i = 0; i < (up ? 60 : 40); i++) { const aa = Math.random() * 6.283, v = 3 + Math.random() * 7; part({ kind: 'spark', x: me.x, y: me.y - OY, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, life: 0.6, max: 0.6, size: 3, color: i % 2 ? E.color : '#FFFFFF', drag: 2 }); }
      light(me.x, me.y, up ? 12 : 9, 0.8);
      api.sfx.hum(); api.sfx.sparkle();
      switch (ab.key) {
        case 'u_nova': { const R2 = up ? 9.5 : 7, blast = (r2, dmg, k) => { hitArea(me.x, me.y, r2, dmg, { el: ab.el, src: 'ult', kb: 5 }); eshots.length = 0; for (let i = 0; i < 3; i++) ring(me.x, me.y, 0.3, r2 + i, 0.6 + i * 0.15, i ? E.color : '#FFFFFF', 0.5); part({ kind: 'flare', x: me.x, y: me.y - OY, vx: 0, vy: 0, life: 0.6, max: 0.6, size: r2 * 0.9, color: E.color }); boom(me.x, me.y, 4 * k, E.color, '#FFFFFF', { n: 50, shake: 16, smoke: 10 }); flash(0.8, '#FFFFFF'); hitstop(0.08); api.sfx.crash(); };
          after(0.35, () => blast(R2, base * 9, 1)); if (up) after(0.85, () => blast(R2 * 0.8, base * 6, 0.8)); break; }
        case 'u_shield': g.shieldT = up ? 9 : 6; break;
        case 'u_meteor': for (let i = 0; i < (up ? 30 : 18); i++) after(i * 0.11, () => meteorAt(base * 2.2, up ? 7.5 : 6, up ? 1.7 : 1.4)); break;
        case 'u_clone': (up ? [-2, -1, 1, 2] : [-1, 1]).forEach(s => helpers.push({ kind: 'clone', x: me.x + s * 1.2, y: me.y, s, t: up ? 12 : 9, fireT: 0.3, color: E.color })); break;
        case 'u_warp': g.warpT = up ? 9 : 6; break;
        case 'u_beam': beamUlt = { t: up ? 4 : 3, max: up ? 4 : 3, w: up ? 1.3 : 1.1, len: up ? 13 : 10, dps: base * 5, el: ab.el, a: A.a, offs: up ? [0, -0.42, 0.42] : [0] }; break;
        case 'u_swarm': case 'starswarm': swarmQ = up ? 55 : 30; break;
        case 'megabeam': beamUlt = { t: up ? 4 : 3, max: up ? 4 : 3, w: up ? 1.8 : 1.6, len: up ? 14 : 11, dps: base * 6, el: 'gold', a: A.a, offs: up ? [0, -0.42, 0.42] : [0] }; break;
        case 'blossom': petalT = up ? 5 : 3.2; heal(ST.hp * (up ? 0.3 : 0.2)); for (let i = 0; i < 24; i++) part({ kind: 'petal', x: me.x, y: me.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 1.4, max: 1.4, size: 7, rot: Math.random() * 6, vr: 8, color: i % 2 ? '#FF9BD2' : '#FFFFFF', drag: 1.5 }); break;
        case 'meteorstorm': for (let i = 0; i < (up ? 48 : 30); i++) after(i * 0.1, () => meteorAt(base * 2.4, up ? 10 : 8, up ? 1.8 : 1.5)); break;
        case 'clones': { const n = up ? 5 : 3; for (let i = 0; i < n; i++) { const aa = i / n * 6.283; helpers.push({ kind: 'shadow', x: me.x + Math.cos(aa) * 1.3, y: me.y + Math.sin(aa) * 1.3, s: i, t: up ? 13 : 10, fireT: 0.2 + i * 0.1, color: '#9C88D6' }); } break; }
        case 'blizzard': blizT = up ? 8 : 5; break;
        case 'timestop': g.stopT = up ? 7.5 : 5; flash(0.6, '#B07CF0'); break;
        case 'dragon': dragons.push({ t: 0, passes: 0, max: up ? 4 : 3, x: me.x - 9, y: me.y, oy: 0, ph: 0, dir: 1, dmg: base * 2.2, trail: [], col: '#FF9F43', hot: '#FFE37A' }); if (up) dragons.push({ t: 0, passes: 0, max: 4, x: me.x + 9, y: me.y, oy: 1.2, ph: 1.6, dir: -1, dmg: base * 2.2, trail: [], col: '#7FD3F2', hot: '#E8FAFF' }); break;
        case 'supernova': supernova = 1; me.inv = 2; novaR = up ? 14 : 11; break;
        case 'phoenix': g.phoenixT = up ? 12 : 8; break;
        default: if (STAR && ab.key.slice(0, 2) === 'y_') STAR.ult(ab.key.slice(2), { a: A.a, base, E, el: ab.el, A, up }); else if (ELEM && ab.key.slice(0, 3) === 'ey_') ELEM.ult(ab.key.slice(3), { a: A.a, base, E, el: ab.el, e8: ab.e8, evo: ab.evo || 1, sig: !!ab.sig, tx: A.t ? A.t.x : me.x + Math.cos(A.a) * 4, ty: A.t ? A.t.y : me.y + Math.sin(A.a) * 4, A, up }); break;
      }
    }
    function meteorAt(dmg, range, r) {
      const tg = living().filter(m => hyp(m.x - me.x, m.y - me.y) < range);
      const m = tg.length ? tg[Math.floor(Math.random() * tg.length)] : null;
      let x = m ? m.x + (Math.random() - 0.5) * 0.8 : me.x + (Math.random() - 0.5) * range * 1.4, y = m ? m.y + (Math.random() - 0.5) * 0.8 : me.y + (Math.random() - 0.5) * range * 1.4;
      part({ kind: 'meteorfall', x, y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: r * 0.7, color: '#FF9F43' });
      after(0.35, () => { hitArea(x, y, r, dmg, { el: 'fire', src: 'ult', burn: true }); boom(x, y, r, '#FF9F43', '#FFE37A', { n: 14, shake: 5, smoke: 3 }); api.sfx.thud(); });
    }

    /* ---------- enemy attacks ---------- */
    function eshot(x, y, a, v, o) { if (eshots.length > 260) eshots.shift(); eshots.push(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 0.16, dmg: 10 * F.dmgMul, life: 4, t: 0, color: '#FF5C9A', core: '#FFE3F0', style: 'orb' }, o || {})); }
    function warnZone(o) { zones.push(Object.assign({ kind: 'warn', own: 'enemy', color: '#FF4D6D' }, o)); }
    const inLine = (x, y, a, len, w) => { const rx = me.x - x, ry = me.y - y, al = rx * Math.cos(a) + ry * Math.sin(a), of = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)); return al > -me.r && al < len + me.r && of < w / 2 + me.r; };
    const inCone = (x, y, a, len, spread) => { const d = hyp(me.x - x, me.y - y); if (d > len + me.r) return false; return Math.abs(DunAI.angTo(a, Math.atan2(me.y - y, me.x - x))) < spread + me.r / Math.max(0.5, d); };
    function slam(x, y, r, dmg, color, src, quiet) {
      if (hyp(me.x - x, me.y - y) < r + me.r) hurtPet(dmg, src);
      if (!quiet) boom(x, y, r, color || '#FF7A8A', '#FFFFFF', { n: 14, shake: 5, smoke: 4 });
      else ring(x, y, 0.3, r, 0.3, color || '#FFFFFF', 0.25);
      api.sfx.thud();
    }
    function lob(x0, y0, tx, ty, o) {
      const z = Object.assign({ kind: 'warn', own: 'enemy', x: tx, y: ty, r: o.r, life: o.dur, max: o.dur, color: o.color || (o.kind === 'poison' ? '#9BE07A' : o.kind === 'bubble' ? '#7FD3F2' : o.kind === 'rock' ? '#B7836B' : '#FF7A3D') }, {});
      z.fn = () => {
        const col = z.color;
        boom(tx, ty, o.r, col, '#FFFFFF', { n: 10, shake: o.kind === 'rock' ? 6 : 3, smoke: o.kind === 'rock' ? 5 : 2 });
        if (hyp(me.x - tx, me.y - ty) < o.r + me.r) hurtPet(o.dmg, o.src);
        if (o.fire) zones.push({ kind: 'efire', x: tx, y: ty, r: o.r * 0.9, life: o.fire, max: o.fire, dps: o.dmg * 0.7, tick: 0.2, own: 'enemy' });
        if (o.poison) zones.push({ kind: 'poison', x: tx, y: ty, r: o.r, life: o.poison, max: o.poison, dps: o.dmg * 0.7, tick: 0.2, own: 'enemy' });
        if (o.kind === 'rock') for (let j = 0; j < 7; j++) { const aa = Math.random() * 6.283; part({ kind: 'shard', x: tx, y: ty, vx: Math.cos(aa) * 4, vy: Math.sin(aa) * 4 - 2, g: 9, life: 0.6, max: 0.6, size: 5, rot: aa, vr: 9, color: col }); }
        if (o.kind === 'bubble') api.sfx.bubble(); else api.sfx.thud();
      };
      zones.push(z);
      eshots.push({ x: x0, y: y0, lob: { sx: x0, sy: y0, tx, ty, dur: o.dur, h: o.kind === 'rock' ? 3.2 : 2.2 }, vx: 0, vy: 0, r: o.kind === 'rock' ? 0.34 : 0.2, t: 0, life: o.dur, dmg: 0, color: z.color, core: '#FFFFFF', style: o.kind === 'fire' ? 'fire' : o.kind === 'poison' ? 'spore' : o.kind === 'rock' ? 'rock' : 'bubble' });
    }
    function ringWave(x, y, o) { zones.push(Object.assign({ kind: 'ring', own: 'enemy', x, y, r: 0.4, hitT: 0, off: Math.random() * 6.283, max: o.life }, o)); }
    function pillar(x, y, r, dmg, delay) {
      warnZone({ x, y, r, life: delay, max: delay, color: '#FFD447', fn: () => { if (hyp(me.x - x, me.y - y) < r + me.r) hurtPet(dmg, null); part({ kind: 'pillar', x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: r, color: '#FFF3B0' }); sparks(x, y, '#FFE37A', 10, 5); light(x, y, 2.5, 0.3); api.sfx.sparkle(); } });
    }
    function rockFall(x, y, dmg) {
      if (solidAt(Math.floor(x), Math.floor(y))) return;
      warnZone({ x, y, r: 1.2, life: 0.9, max: 0.9, fn: () => { if (hyp(me.x - x, me.y - y) < 1.2 + me.r) hurtPet(dmg, null); boom(x, y, 1.2, '#B7836B', '#FFE3C2', { n: 10, shake: 4, smoke: 5 }); for (let i = 0; i < 6; i++) { const aa = Math.random() * 6.283; part({ kind: 'shard', x, y, vx: Math.cos(aa) * 4, vy: Math.sin(aa) * 4 - 2, g: 9, life: 0.6, max: 0.6, size: 5, rot: aa, vr: 9, color: '#8C7B6B' }); } } });
      part({ kind: 'rockfall', x, y, vx: 0, vy: 0, life: 0.9, max: 0.9, size: 0.55, color: '#8C7B6B' });
    }
    function explodeBomb(m) {
      if (m.dead) return;
      m.dead = true; g.kills++;
      boom(m.x, m.y, 1.8, '#FF6F59', '#FFE37A', { n: 20, shake: 8 });
      if (hyp(me.x - m.x, me.y - m.y) < 1.8 + me.r) hurtPet(m.dmg, m);
      for (const o of mons) if (o !== m && !o.dead && !o.boss && hyp(o.x - m.x, o.y - m.y) < 1.8) hitMon(o, m.dmg * 2, { el: 'fire' });
      hitPots(m.x, m.y, 1.8);
      api.sfx.crash();
    }
    function gremlinEscape(m) {
      if (m.dead) return;
      m.dead = true; m.escaped = true;
      ring(m.x, m.y, 2, 0.2, 0.5, '#9BD15E', 0.3); sparks(m.x, m.y, '#9BD15E', 20, 6);
      text(m.x, m.y - 0.8, 'Nyeh nyeh!', '#9BD15E', 16); banner('The gremlin got away!', '', '#9BD15E', 1.6); api.sfx.giggle && api.sfx.giggle();
    }
    const chillPet = t => { me.chill = Math.max(me.chill, t); };
    const X = {
      F, M, me, g, mons, eshots, zones, sfx: api.sfx, freeSpot,   // (freeSpot: the rift brood and their mini bosses place what they call or lay with it)
      walkPoint, unstick, moveEnt, blocked, los, rayLen, fleeStep: m => flowStep(m, true),
      warn: warnZone, slam, eshot, lob, ringWave, pillar, rockFall, explodeBomb, gremlinEscape, chillPet,
      inLine, inCone, hurtPet, spawnMon, after, part, text, boom, sparks, ring, shake, light,
      smashPots: m => { for (const p of pots) if (!p.broken && hyp(p.x - m.x, p.y - m.y) < m.r + 0.4) breakPot(p); },
      pull: (x, y, dist) => { const a = Math.atan2(y - me.y, x - me.x), d = Math.max(0, Math.min(dist, hyp(x - me.x, y - me.y) - 1)); me.push = { vx: Math.cos(a) * d / 0.18, vy: Math.sin(a) * d / 0.18, t: 0.18 }; },
      push: (a, dist) => { me.push = { vx: Math.cos(a) * dist / 0.25, vy: Math.sin(a) * dist / 0.25, t: 0.25 }; },
      healBeam: (a, b) => { bolts.push({ pts: [[a.x, a.y], [lerp(a.x, b.x, 0.5), lerp(a.y, b.y, 0.5) - 0.4], [b.x, b.y]], life: 0.4, max: 0.4, color: '#8FE0A6', w: 4 }); sparks(b.x, b.y, '#8FE0A6', 10, 4); },
      zone: z => zones.push(z), drop,
      say: (m, s) => text(m.x, m.y - m.r - 0.9 - (m.z || 0), s, '#FF9BD2', 14, { life: 1.2, max: 1.2, vy: -0.6 }),
      hydraHeads: m => DunBoss.heads(m, g.t),
      splash: (x, y, r) => { for (let i = 0; i < 14; i++) { const a = Math.random() * 6.283, v = 2 + Math.random() * 4; part({ kind: 'bubble', x: x + Math.cos(a) * r * 0.5, y: y + Math.sin(a) * r * 0.3, vx: Math.cos(a) * v * 0.4, vy: -v, g: 8, life: 0.6, max: 0.6, size: 3 + Math.random() * 4, color: '#BFF5E4' }); } ring(x, y, 0.3, r, 0.4, '#BFF5E4', 0.2); api.sfx.splash(); },
      bolt: (x, y, color) => bolts.push({ pts: skyBolt(x, y), life: 0.3, max: 0.3, color, w: 5 }),
      slash: (x, y, a, r, color) => part({ kind: 'slash', x, y, a, r, life: 0.2, max: 0.2, color, vx: 0, vy: 0, flip: 0 }),
      beamFx: (x, y, a, len, color) => { part({ kind: 'beamfx', x, y, a, r: len, life: 0.35, max: 0.35, color, vx: 0, vy: 0 }); shake(4, 0.15); },
      get mpos() { return me; }, get rift() { return RIFT; }, killMon: (m2, big, how) => killMon(m2, big, how), hitMon: (m2, d, o) => hitMon(m2, d, o),
    };
    AN = DunAnima.create(Object.assign({}, X, {
      kit: PI.anima || null, ST: () => ST, Tz: () => Tz(), H: () => api.H, W: () => api.W,
      hitMon, hitArea, banner, flash, heal, gainMP, shot, drop, zap, nearestMon, sx, sy,
      // (a Super Fiend's health bars: how many and how much each holds; nothing for a boss of a single bar)
      bossBars: () => (FD && FD.S ? { n: FD.S.bars, hp: FD.barHP } : null),
    }));
    STAR = DunStar.create({ me, g, mons, eshots, zones, ST: () => ST, shot, hitMon, hitArea, part, ring, boom, zap, bolt: (x, y, color) => bolts.push({ pts: skyBolt(x, y), life: 0.3, max: 0.3, color, w: 5 }), sparks, after, nearestMon, text, banner, flash, shake, hitstop, heal, light, moveEnt, walkPoint, blocked, meteorAt, sfx: api.sfx, sx, sy, Tz: () => Tz(), warn: (x, y, r, life, col, fn) => zones.push({ kind: 'warn', x, y, r, life, max: life, own: 'pet', color: col, fn }), blizzard: t => { blizT = Math.max(blizT, t); }, supernova: r => { supernova = 1; me.inv = 2; novaR = r; }, dragon: d => dragons.push(d) });
    ELEM = DunElem.create({ me, g, mons, eshots, zones, ST: () => ST, shot, hitMon, hitArea, part, ring, boom, zap, bolt: (x, y, color) => bolts.push({ pts: skyBolt(x, y), life: 0.3, max: 0.3, color, w: 5 }), sparks, after, nearestMon, text, banner, flash, shake, hitstop, heal, light, moveEnt, walkPoint, blocked, sfx: api.sfx, sx, sy, Tz: () => Tz() });
    RES = DunResidue.create({ me, g, mons, props: propList, M, T_FLOOR, EL, e8Of, REACT_NAME: (a, b) => (REACTIONS[pairKey(a, b)] || {}).name, ST: () => ST, hitMon, part, boom, ring, sparks, text, light, drop, sfx: api.sfx, sx, sy, Tz: () => Tz() });
    RX = DunReact.create({ me, g, mons, eshots, ST: () => ST, AB: () => AB, hitMon, text, part, boom, zap, bolt: (x, y, color) => bolts.push({ pts: skyBolt(x, y), life: 0.3, max: 0.3, color, w: 5 }), sparks, ring, light, drop, heal, banner, sfx: api.sfx, sx, sy, Tz: () => Tz() });
    RULES = F.band ? DunRules.create({ F, M, me, g, mons, R, spawnMon, lesserBoss, walkPoint, freeSpot, after, banner, flash, text, ring, part, sparks, boom, shake, drop, heal, gainMP, ST: () => ST, sfx: api.sfx, sx, sy, Tz: () => Tz() }) : null;
    RIFT = F.rift ? DunRift.create({ F, M, me, g, mons, R, shots, spawnMon, lesserBoss, freeSpot, walkPoint, blocked, los, after, banner, flash, text, ring, part, sparks, boom, shake, light, drop, heal, gainMP, hurtPet, hitMon, hitArea, warn: warnZone, zone: z => zones.push(z), eshot, lob, ringWave, slam, pull: X.pull, push: X.push, beamFx: X.beamFx, ST: () => ST, sfx: api.sfx, sx, sy, Tz: () => Tz(), W: () => api.W, H: () => api.H,
      retile: () => { chunks.clear(); flowT = 0; miniNew.length = 0; expV++; }, winStage, unstick, splash: X.splash, slash: X.slash, say: X.say, inCone, inLine, moveEnt, bolt: X.bolt, get rift() { return RIFT; }, finishWin: () => finishWin(), props: propList, setTile: (x, y, t) => { G[y * MW + x] = t; }, tileAt: (x, y) => G[y * MW + x], killMon, get boss() { return g.boss; } }) : null;
    if (RULES && RULES.blocks('nosummon') && AN) { AN.ready = () => false; AN.summon = () => { text(me.x, me.y - 1.1, 'Cursed: no summons', '#E07BF0', 13); api.sfx.wrong(); }; }
    const FD = F.fiend ? DunFiend.create({ F, M, me, g, mons, eshots, ST: () => ST, AB: () => AB, e8Of, zone: z => zones.push(z), sfx: api.sfx, spawnMon, walkPoint, moveEnt, blocked, los, hurtPet, wipeParty, hitMon, eshot, banner, flash, shake, boom, ring, sparks, part, text, light, drop, heal, gainMP, after, zap,
      bolt: (x, y, color) => bolts.push({ pts: skyBolt(x, y), life: 0.3, max: 0.3, color, w: 5 }), sx, sy, Tz: () => Tz(), W: () => api.W, H: () => api.H, me }) : null;
    function updMon(m, dt) {
      m.t += dt; if (m.curseT > 0) m.curseT -= dt; m.ph = (m.ph + dt * (DunArt.NF[m.type] === 6 ? 2.2 : 1.6)) % 1;
      m.flash = Math.max(0, m.flash - dt); m.atkCd = Math.max(0, m.atkCd - dt); m.hitSq = Math.max(0, m.hitSq - dt * 6); m.blockCd = (m.blockCd || 0) - dt; if (m.hasted > 0) m.hasted -= dt;
      if (m.falling != null) { m.falling -= dt; if (m.falling <= 0) killMon(m, false, 'fell'); return; }
      // statuses
      if (m.burn > 0) { m.burn -= dt; m.burnTick = (m.burnTick || 0) - dt; if (m.burnTick <= 0) { m.burnTick = 0.5; hitMon(m, m.burnD * 0.5, { dot: true, dotC: '#FFB066' }); if (Math.random() < 0.8) part({ kind: 'ember', x: m.x + (Math.random() - 0.5) * m.r, y: m.y - m.r * 0.5, vx: 0, vy: -2, life: 0.5, max: 0.5, size: 3, color: '#FF9F43' }); } }
      if (m.venom > 0 && !m.dead) { m.venomT -= dt; m.venTick = (m.venTick || 0) - dt; if (m.venTick <= 0) { m.venTick = 0.6; hitMon(m, ST.atk * 0.1 * m.venom * 0.6, { dot: true, dotC: '#B6F09C' }); } if (m.venomT <= 0) m.venom = 0; }
      if (m.dead) return;
      if (m.fobj) { if (FD) FD.updObj(m, dt); return; }
      m.chill = Math.max(0, m.chill - dt); m.freeze = Math.max(0, m.freeze - dt); m.stun = Math.max(0, m.stun - dt);
      if (m.kbx || m.kby) {
        if (m.mv === 2) { m.x += m.kbx * dt; m.y += m.kby * dt; } else moveEnt(m, m.kbx * dt, m.kby * dt, 1);
        m.kbx *= Math.pow(0.02, dt); m.kby *= Math.pow(0.02, dt); if (Math.abs(m.kbx) + Math.abs(m.kby) < 0.05) m.kbx = m.kby = 0;
        if (!m.boss && m.mv === 0 && gapAt(Math.floor(m.x), Math.floor(m.y)) && !m.hop) { m.falling = 0.55; m.fallGap = M.BI[Math.floor(m.y) * MW + Math.floor(m.x)]; aggroPack(m); return; }
        if (m.mv === 0 && !m.hop && blocked(m.x, m.y, m.r, 0)) settle(m, 0);
      }
      if (m.mv === 0 && !m.hop && walkAt(Math.floor(m.x), Math.floor(m.y))) { m.wx = m.x; m.wy = m.y; }
      if (m.mv !== 2 && m.aggro && !m.boss && !m.still && !m.hop) {
        const tk = Math.floor(m.y) * MW + Math.floor(m.x), d0 = hyp(me.x - m.x, me.y - m.y);
        const far = d0 < 14 && (m.mv === 0 ? flow[tk] >= 9999 : (d0 > 6 && flow[tk] >= 9999 && ((m.losT = (m.losT || 0) - dt) > 0 ? m.losOk === false : (m.losT = 0.5, (m.losOk = los(m.x, m.y, me.x, me.y)) === false))));
        m.lostT = far ? (m.lostT || 0) + dt : 0;
        if (m.lostT > 5) { m.lostT = 0; const p = walkPoint(me.x + (Math.random() - 0.5) * 6, me.y + (Math.random() - 0.5) * 6, m); if (flow[Math.floor(p.y) * MW + Math.floor(p.x)] < 9999) { sparks(m.x, m.y, '#B39CFF', 10, 4); m.x = p.x; m.y = p.y; ring(m.x, m.y, 0.2, 1.2, 0.3, '#B39CFF'); } }
      }
      if (m.boss) { updBoss(m, dt); return; }
      const held = m.freeze > 0 || m.stun > 0 || g.stopT > 0 || g.cineT > 0;
      const slow = (m.curseT > 0 ? 0.7 : 1) * (m.chill > 0 ? 0.55 : 1) * (g.warpT > 0 ? 0.3 : 1) * (m.hasted > 0 ? 1.35 : 1);
      const dx = me.x - m.x, dy = me.y - m.y, d = hyp(dx, dy) || 0.001;
      if (!m.aggro) {
        if (m.type === 'gremlin') { m.aggro = true; return; }
        if (d < 7 && (m.mv === 2 || los(m.x, m.y, me.x, me.y))) aggroPack(m);
        return;
      }
      if (held) return;
      if (m.ultFx > 0) m.ultFx -= dt;
      const frostAura = g.pw.frost && d < 3 + g.pw.frost * 0.5 ? 0.55 : 1;
      m.cd -= dt * slow;
      const mud = m.mv === 0 && tileAt(Math.floor(m.x), Math.floor(m.y)) === T_MUD ? 0.6 : 1;
      const x0 = m.x, y0 = m.y;
      let losC = null;
      m.flank = (m.flank || 0) + dt * 0.25;
      const A = {
        dt: dt * slow * frostAura, dx, dy, d, a: Math.atan2(dy, dx), ux: dx / d, uy: dy / d, sp: m.spd * mud * (g.bloodT > 0 ? 1.3 : 1),
        los: () => (losC == null ? (losC = m.mv === 2 || los(m.x, m.y, me.x, me.y)) : losC),
        steer: (spd) => {
          let tx = me.x, ty = me.y;
          if (m.mv !== 2 && !(d < 5 && A.los())) { const s = flowStep(m); if (s) { tx = s[0]; ty = s[1]; } }
          else if (d > 1.7 && d < 6 && !m.still) { tx = me.x + Math.cos(m.flank) * 1.15; ty = me.y + Math.sin(m.flank) * 1.15; }
          const ddx = tx - m.x, ddy = ty - m.y, dd = hyp(ddx, ddy) || 1;
          moveEnt(m, ddx / dd * spd * dt * slow * frostAura, ddy / dd * spd * dt * slow * frostAura);
          m.face = ddx >= 0 ? 1 : -1;
        },
      };
      const busy = DunAI.kit(m, A, X);
      if (!busy) { const ai = DunAI.mon[m.type]; if (ai) ai(m, A, X); }
      m.moved = hyp(m.x - x0, m.y - y0) > 0.001;
      if (m.affixes) for (const a of m.affixes) DunAI.affix(m, A, X, a);
      if (!m.still && m.type !== 'gremlin' && !m.pile && m.atkCd <= 0 && d < m.r + me.r + 0.05 && m.fuse == null && !(m.z > 0.3) && !m.hop) { hurtPet(m.dmg, m); m.atkCd = 0.9; m.kbx -= dx / d * 2; m.kby -= dy / d * 2; }
      if (!m.face || Math.abs(dx) > 0.2) m.face = dx >= 0 ? 1 : -1;
    }
    function updBoss(m, dt) {
      if (m.fiend) { if (FD) FD.updBoss(m, dt); return; }
      if (m.lesser && !m.aggro) { if (hyp(me.x - m.x, me.y - m.y) < 9 && los(m.x, m.y, me.x, me.y)) { m.aggro = true; if (!m.brute) banner(m.bname.toUpperCase(), 'A lesser boss', m.glow || '#FF9F43', 1.6); ring(m.x, m.y, 0.3, 4, 0.7, m.glow || '#FF9F43', 0.35); api.sfx.hum(); } else return; }
      const B = m.bk, dx = me.x - m.x, dy = me.y - m.y, d = hyp(dx, dy) || 1, a = Math.atan2(dy, dx);
      if (m.act === 'enter') {
        // it drops out of the sky (or bursts from the ground) during the intro
        const u = clamp((g.bossIntro - 1.3) / 1.2, 0, 1);
        if (!m.landed) { m.z = u * 7; if (u <= 0) { m.landed = true; m.z = 0; unstick(m); boom(m.x, m.y, 2.6, m.glow || '#FFE37A', '#FFFFFF', { n: 30, shake: 14, smoke: 10 }); flash(0.3, m.glow); api.sfx.crash(); if (hyp(me.x - m.x, me.y - m.y) < m.r * 1.6 + me.r) hurtPet(m.dmg * 0.8, m); } }
        if (g.bossIntro <= 0) { m.act = 'move'; m.cd = 1.0; }
        return;
      }
      const q = Math.floor(clamp(m.hp / m.maxhp, 0, 1) * 4);
      if (m.lastQ == null) m.lastQ = q;
      if (q < m.lastQ) { m.lastQ = q; if (q > 0) { drop('hp', m.x, m.y); drop('mp', m.x, m.y); drop('coin', m.x, m.y); text(m.x, m.y - m.r - 0.6, 'Orbs!', '#FF8FB1', 14); } }
      const rage = (p, label, col) => { m.phase = p; banner(label, m.bname, col, 1.4, true); flash(0.4, col); shake(10, 0.5); ring(m.x, m.y, 0.3, 5, 0.6, col, 0.4); api.sfx.hum(); m.act = 'move'; m.cd = 0.8; m.bites = null; m.under = false; m.laser = null; m.z = 0; };
      if (m.phase === 1 && m.hp < m.maxhp * 0.66) rage(2, 'ENRAGED!', '#FF5C5C');
      else if (m.phase === 2 && m.hp < m.maxhp * 0.33) rage(3, 'FRENZY!', '#E07BF0');
      const held = g.stopT > 0 || g.cineT > 0 || (m.stun > 0 && m.act === 'move');
      if (held) return;
      const slow = (m.curseT > 0 ? 0.8 : 1) * (m.chill > 0 ? 0.7 : 1) * (g.warpT > 0 ? 0.35 : 1), fast = m.phase === 3 ? 1.55 : m.phase === 2 ? 1.25 : 1;
      m.actT += dt * slow; m.cd -= dt * slow * fast;
      if (m.bites) m.bites.forEach(b => { if (b && b.snap > 0) b.snap -= dt; });
      const A = {
        dt: dt * slow, dx, dy, d, a, ux: dx / d, uy: dy / d, sp: B.spd,
        los: () => los(m.x, m.y, me.x, me.y),
        walk: s => { const st2 = !(d < 6 && los(m.x, m.y, me.x, me.y)) && flowStep(m); const tx = st2 ? st2[0] : me.x, ty = st2 ? st2[1] : me.y, ddx = tx - m.x, ddy = ty - m.y, dd = hyp(ddx, ddy) || 1; moveEnt(m, ddx / dd * s * slow * dt * (m.phase === 3 ? 1.2 : 1), ddy / dd * s * slow * dt * (m.phase === 3 ? 1.2 : 1)); m.face = ddx >= 0 ? 1 : -1; },
      };
      A.steer = A.walk;
      if (m.stunT > 0 && m.act !== 'stunned') { m.stunT -= dt; return; }
      (DunAI.boss[B.ai || B.id] || DunAI.boss.king)(m, A, X, B);
      if ((m.act === 'move' || m.act === 'spit' || m.act === 'summon') && !m.under) { if (d < m.r + me.r && m.atkCd <= 0 && !(m.z > 0.5)) { hurtPet(m.dmg, m); m.atkCd = 0.8; } }
    }
    function bossDeath(m) {
      if (RIFT && RIFT.onBossDeath(m)) return;   // (a rift's last boss: the sealing follows)
      // four guardians: the floor is won only when the last falls; till then the next takes the health bar
      const others = mons.filter(q => q !== m && q.boss && !q.dead && !q.lesser);
      if (others.length) { g.bossDown = (g.bossDown || 0) + 1; g.boss = others[0]; g.bossShow = null; flash(0.5, '#FFFFFF'); hitstop(0.08); banner('GUARDIAN DOWN', `${m.bname} · ${others.length} left`, '#FFE37A', 2, true); for (let i = 0; i < 6; i++) after(i * 0.12, () => boom(m.x + (Math.random() - 0.5) * m.r * 2, m.y + (Math.random() - 0.5) * m.r * 2, 1.4, i % 2 ? (m.glow || '#FFE37A') : '#FFE37A', '#FFFFFF', { n: 16, shake: 8 })); for (let i = 0; i < 10; i++) drop(i % 5 === 0 ? 'hp' : i % 4 === 0 ? 'mp' : 'coin', m.x, m.y); if (accChance(0.4)) dropAcc(m.x, m.y, { bonus: 10 }); gainXP(m.xp, m.x, m.y); api.sfx.crash(); return; }
      // a Super Fiend may stage its own ending (the last guardian's rings breaking, its serpent coming down to rest at dawn)
      const E = m.fiend && FD && FD.ending ? FD.ending(m) : null;
      g.slowT = E ? (E.slow || 0) : 1.6; g.won = true; flash(0.9, '#FFFFFF'); hitstop(0.12);
      if (E) after(E.bannerAt || 0, () => banner(E.title, E.sub || '', E.col || '#FFE37A', 3.4, true));
      else banner(m.fiend ? 'SUPER FIEND SLAIN!' : m.mini ? 'FLOOR BOSS DOWN!' : 'BOSS DEFEATED!', m.bname, '#FFE37A', 2.6, true);
      if (!(E && E.quiet)) for (let i = 0; i < 8; i++) after(i * 0.13, () => boom(m.x + (Math.random() - 0.5) * m.r * 2, m.y + (Math.random() - 0.5) * m.r * 2, 1.4 + Math.random(), i % 2 ? (m.glow || '#FFE37A') : '#FFE37A', '#FFFFFF', { n: 18, shake: 10 }));
      after(1.1, () => { if (!(E && E.quiet)) boom(m.x, m.y, 4, '#FFFFFF', '#FFE37A', { n: 60, shake: 18, smoke: 12 }); for (let i = 0; i < (m.mini ? 16 : 26); i++) drop(i % 6 === 0 ? 'hp' : i % 7 === 0 ? 'mp' : 'coin', m.x, m.y); if (m.fiend) for (let i = 0; i < 24; i++) drop('coin', m.x, m.y); if (m.fiend || Math.random() < (m.mini ? 0.3 : 0.55)) drop('gem', m.x, m.y); if (m.fiend) { for (let i = 0, na = accChance(0.5) ? 3 : 2; i < na; i++) dropAcc(m.x, m.y, { bonus: 40, min: 2 }); } else if (F.boss && !m.mini) { dropAcc(m.x, m.y, { bonus: 16, min: 1 }); if (accChance(0.35)) dropAcc(m.x, m.y, { bonus: 16 }); } else if (accChance(0.4)) dropAcc(m.x, m.y, { bonus: 10 }); for (let i = 0, nf = m.fiend ? 4 : m.mini ? 2 : 3; i < nf; i++) drop('food', m.x, m.y, wkeyR(Math.random, BOSS_FOOD)); mons.forEach(o => { if (!o.dead) killMon(o); }); });
      gainXP(m.xp, m.x, m.y);
      if (E) after(E.fanfareAt || 0, () => api.sfx.fanfare()); else api.sfx.fanfare();
      after(E ? (E.delay || 3.4) : 3.4, () => finishWin());
    }
    function finishWin() { if (g.over) return; g.over = true; collectAll(); api.finish(true, result(true)); }
    // a rift section done: the way on taken
    function winStage() { if (g.won) return; g.won = true; g.slowT = 0.8; flash(0.5, '#FFFFFF'); banner(F.rift && F.rift.gate ? 'TRIAL COMPLETE' : 'SECTION CLEAR', F.rift ? F.rift.name : '', '#8FE0A6', 2.4, true); api.sfx.fanfare(); heal(ST.hp * 0.2, true); gainMP(20); after(2.2, () => finishWin()); }
    // a won floor sweeps up whatever is still lying on it, accessories too
    function collectAll() { for (const p of picks) { if (p.got) continue; if (p.kind === 'coin') g.coins += Math.round(p.v * (g.buff.fortune > 0 ? 2 : 1) * (1 + accK('gold'))); if (p.kind === 'gem') g.gems.push(p.gem); if (p.kind === 'food') gotFood(p.food); if (p.kind === 'acc') g.accs.push(p.acc); } picks.length = 0; }
    function gotFood(k) { st.pantry[k] = Math.min(999, (st.pantry[k] || 0) + 1); g.food[k] = (g.food[k] || 0) + 1; }

    /* ---------- shrines, hazards and the loot gremlin ---------- */
    function useShrine(s) {
      s.used = true;
      const S = SHRINES[s.kind];
      g.buff[s.kind] = S.t;
      if (s.kind === 'guardian') { g.guardMax = ST.hp * 0.4; g.guardHP = g.guardMax; }
      banner(`${S.name.toUpperCase()} SHRINE`, S.desc, S.color, 1.8, true);
      boom(s.x, s.y - 0.5, 2, S.color, '#FFFFFF', { n: 24, shake: 5 }); flash(0.25, S.color);
      for (let i = 0; i < 24; i++) part({ kind: 'ember', x: s.x + (Math.random() - 0.5), y: s.y - Math.random() * 1.2, vx: (Math.random() - 0.5) * 1.5, vy: -3 - Math.random() * 3, life: 1, max: 1, size: 3 + Math.random() * 3, color: S.color });
      api.sfx.fanfare();
    }
    const HZ_COL = { holy: '#FFD447', hands: '#B07CF0', icicle: '#BFEFFF', laser: '#4DF0FF', sandspout: '#FFD88A', steamvent: '#E8F0F8', pollen: '#FFE37A', icespikes: '#BFEFFF', thorns: '#6CC15A' };
    function hazardTick(h, dt) {
      const near = hyp(me.x - (h.x || me.x), me.y - (h.y || me.y)) < 10;
      const fam = h.fam || HAZ_FAMILY[h.kind] || (h.area ? 'area' : 'spikes');
      if (h.area) {
        const inRoom = M.RM[Math.floor(me.y) * MW + Math.floor(me.x)] === h.room;
        if (!inRoom || g.intro > 0) return;
        h.t -= dt;
        if (h.t > 0) return;
        h.t = 2.6 + Math.random() * 1.4;
        const n = F.n >= 12 ? 2 : 1, dmg = 11 * F.dmgMul, kind = h.kind, col = HZ_COL[kind] || '#FF4D6D';
        if (kind === 'laser') {
          // a security grid: a laser line sweeps through the room
          const x = me.x + (Math.random() - 0.5) * 2, y = me.y + (Math.random() - 0.5) * 2, a = Math.random() * 6.283, len = 5;
          warnZone({ shape: 'line', x: x - Math.cos(a) * len, y: y - Math.sin(a) * len, a, len: len * 2, w: 0.6, life: 1.0, max: 1.0, color: col, fn: () => { X.beamFx(x - Math.cos(a) * len, y - Math.sin(a) * len, a, len * 2, col); if (inLine(x - Math.cos(a) * len, y - Math.sin(a) * len, a, len * 2, 0.6)) hurtPet(dmg, null); for (const m of mons) if (!m.dead && !m.boss) { const rx = m.x - x, ry = m.y - y, of = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)); if (of < 0.5 + m.r && Math.abs(rx * Math.cos(a) + ry * Math.sin(a)) < len) hitMon(m, dmg * 2, { el: 'spark', src: 'hazard' }); } api.sfx.crash(); } });
          return;
        }
        for (let i = 0; i < n; i++) {
          const x = me.x + (Math.random() - 0.5) * 3.5, y = me.y + (Math.random() - 0.5) * 3.5;
          if (!walkAt(Math.floor(x), Math.floor(y))) continue;
          warnZone({ x, y, r: 1.05, life: 1.0, max: 1.0, color: col, hz: kind, fn: () => {
            if (hyp(me.x - x, me.y - y) < 1.05 + me.r) hurtPet(dmg, null);
            for (const m of mons) if (!m.dead && !m.boss && hyp(m.x - x, m.y - y) < 1.05 + m.r) hitMon(m, dmg * 2, { el: 'spark', src: 'hazard' });
            if (kind === 'holy') { part({ kind: 'pillar', x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: 1.05, color: '#FFF3B0' }); sparks(x, y, '#FFE37A', 10, 5); light(x, y, 2.5, 0.3); api.sfx.sparkle(); }
            else if (kind === 'hands') { part({ kind: 'hand', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 1, color: '#3B2F63' }); sparks(x, y, '#B07CF0', 10, 4); api.sfx.thud(); }
            else { boom(x, y, 1.05, kind === 'icicle' ? '#BFEFFF' : '#B7836B', '#FFFFFF', { n: 10, shake: 4, smoke: 3 }); for (let j = 0; j < 6; j++) { const aa = Math.random() * 6.283; part({ kind: 'shard', x, y, vx: Math.cos(aa) * 4, vy: Math.sin(aa) * 4 - 2, g: 9, life: 0.6, max: 0.6, size: 5, rot: aa, vr: 9, color: kind === 'icicle' ? '#DDF6FF' : kind === 'stalactite' ? '#7A7590' : '#8C7B6B' }); } api.sfx.crash(); }
          } });
          if (kind !== 'holy' && kind !== 'hands') part({ kind: kind === 'icicle' ? 'iciclefall' : 'rockfall', x, y, vx: 0, vy: 0, life: 1.0, max: 1.0, size: 0.5, color: kind === 'stalactite' ? '#7A7590' : '#8C7B6B' });
        }
        return;
      }
      if (h.pop > 0) h.pop -= dt;
      if (!near) return;
      h.t += dt;
      const per = fam === 'spikes' ? 3.0 : fam === 'gas' ? 5.2 : 4.6, warn = fam === 'spikes' ? 0.7 : 1.0;
      const st2 = (h.t % per) >= per - warn ? 'warn' : 'idle';
      if (st2 === 'warn' && h.st !== 'warn') {
        const r = fam === 'spikes' ? 0.62 : fam === 'gas' ? 1.35 : 1.25, dmg = 12 * F.dmgMul, x = h.x, y = h.y, col = HZ_COL[h.kind] || (fam === 'gas' ? '#9BE07A' : '#FF4D6D');
        warnZone({ x, y, r, life: warn, max: warn, color: col, hz: h.kind, fn: () => {
          if (fam === 'spikes') { if (hyp(me.x - x, me.y - y) < r + me.r * 0.5) hurtPet(dmg, null); for (const m of mons) if (!m.dead && !m.boss && m.mv === 0 && hyp(m.x - x, m.y - y) < r) hitMon(m, dmg * 2, { src: 'hazard' }); api.sfx.crack(); }
          else if (fam === 'gas') { zones.push({ kind: 'poison', x, y, r, life: 2.4, max: 2.4, dps: dmg * 0.9, tick: 0.2, own: 'enemy', hurtsMons: true, col: h.kind === 'steamvent' ? '#E8F0F8' : h.kind === 'pollen' ? '#FFE37A' : null }); api.sfx.bubble(); }
          else { if (hyp(me.x - x, me.y - y) < r + me.r) hurtPet(dmg, null); for (const m of mons) if (!m.dead && !m.boss && hyp(m.x - x, m.y - y) < r + m.r) hitMon(m, dmg * 2, { el: 'fire', burn: h.kind === 'geyser', src: 'hazard' }); const c1 = h.kind === 'sandspout' ? '#D9B36B' : '#FF7A3D', c2 = h.kind === 'sandspout' ? '#FFF0C2' : '#FFE37A'; boom(x, y, r, c1, c2, { n: 16, shake: 4, smoke: 3 }); for (let j = 0; j < 14; j++) part({ kind: 'ember', x: x + (Math.random() - 0.5) * 0.6, y, vx: (Math.random() - 0.5) * 1.5, vy: -4 - Math.random() * 6, life: 0.7, max: 0.7, size: 6 + Math.random() * 6, color: Math.random() < 0.5 ? c1 : c2 }); if (h.kind === 'geyser') zones.push({ kind: 'efire', x, y, r: r * 0.8, life: 1.6, max: 1.6, dps: dmg * 0.6, tick: 0.2, own: 'enemy' }); api.sfx.crash(); }
          h.pop = 0.45;
        } });
      }
      h.st = st2;
    }
    /* ---------- traps: arrow launchers, flame jets, saw blades, mines and laser fences. They hurt monsters too ---------- */
    function trapTick(t, dt) {
      if (hyp(me.x - t.x, me.y - t.y) > 12) return;
      const dmg = 12 * F.dmgMul;
      t.t += dt;
      if (t.kind === 'arrow') {
        const per = 2.6; if ((t.t % per) < dt && hyp(me.x - t.x, me.y - t.y) < 9) { const a = Math.atan2(t.dy, t.dx); for (let i = 0; i < 2; i++) after(i * 0.12, () => eshot(t.x + t.dx * 0.3, t.y + t.dy * 0.3, a, 9, { dmg: dmg * 0.8, color: '#C9A27A', core: '#FFFFFF', r: 0.14, style: 'arrow', life: t.len / 9 + 0.1, hurtsMons: true })); t.on = 0.3; api.sfx.twang(); }
      } else if (t.kind === 'flame') {
        const per = 3.4, u = t.t % per;
        if (u > per - 0.6 && t.st !== 'warn') { t.st = 'warn'; const a = Math.atan2(t.dy, t.dx); warnZone({ shape: 'cone', x: t.x, y: t.y, a, len: t.len, spread: 0.32, life: 0.6, max: 0.6, color: '#FF9F43' }); }
        if (u < 1.2 && t.st === 'warn') { t.st = 'fire'; t.on = 1.2; }
        if (t.on > 0) { t.on -= dt; const a = Math.atan2(t.dy, t.dx); for (let i = 0; i < 2; i++) part({ kind: 'ember', x: t.x + t.dx * 0.3, y: t.y + t.dy * 0.3 - 0.2, vx: Math.cos(a + (Math.random() - 0.5) * 0.35) * 8, vy: Math.sin(a + (Math.random() - 0.5) * 0.35) * 8, life: t.len / 8, max: t.len / 8, size: 6 + Math.random() * 4, color: Math.random() < 0.5 ? '#FF9F43' : '#FFE37A' }); t.hitT = (t.hitT || 0) - dt; if (t.hitT <= 0) { t.hitT = 0.3; if (inCone(t.x, t.y, a, t.len, 0.32)) hurtPet(dmg * 0.7, null); for (const m of mons) if (!m.dead && !m.boss) { const rx = m.x - t.x, ry = m.y - t.y, d = hyp(rx, ry); if (d < t.len + m.r && Math.abs(DunAI.angTo(a, Math.atan2(ry, rx))) < 0.4) hitMon(m, dmg * 1.5, { el: 'fire', burn: true, src: 'hazard' }); } } light(t.x + t.dx * t.len * 0.5, t.y + t.dy * t.len * 0.5, 3, 0.1); if (t.on <= 0) t.st = 'idle'; }
      } else if (t.kind === 'saw') {
        const L = hyp(t.x1 - t.x0, t.y1 - t.y0) || 1, u = (Math.sin(t.t * t.spd / L * 2) + 1) / 2;
        t.px = lerp(t.x0, t.x1, u); t.py = lerp(t.y0, t.y1, u); t.spin = (t.spin || 0) + dt * 14;
        t.hitT = (t.hitT || 0) - dt;
        if (t.hitT <= 0) { if (hyp(me.x - t.px, me.y - t.py) < 0.55 + me.r && hurtPet(dmg * 0.9, null)) { t.hitT = 0.5; me.push = { vx: (me.x - t.px) * 12, vy: (me.y - t.py) * 12, t: 0.15 }; } for (const m of mons) if (!m.dead && !m.boss && m.mv === 0 && hyp(m.x - t.px, m.y - t.py) < 0.55 + m.r) { hitMon(m, dmg * 1.5, { src: 'hazard', kb: 4 }); t.hitT = 0.2; } }
        if (Math.random() < dt * 8) sparks(t.px, t.py, '#FFE37A', 1, 4);
      } else if (t.kind === 'mine') {
        if (t.st === 'done') return;
        if (t.st === 'idle' && hyp(me.x - t.x, me.y - t.y) < 1.1) { t.st = 'armed'; t.on = 0.55; api.sfx.twang(); warnZone({ x: t.x, y: t.y, r: 1.9, life: 0.55, max: 0.55, color: '#FF4D6D', fn: () => { t.st = 'done'; boom(t.x, t.y, 1.9, '#FF6F59', '#FFE37A', { n: 24, shake: 9, smoke: 6 }); if (hyp(me.x - t.x, me.y - t.y) < 1.9 + me.r) hurtPet(dmg * 1.3, null); for (const m of mons) if (!m.dead && !m.boss && hyp(m.x - t.x, m.y - t.y) < 1.9 + m.r) hitMon(m, dmg * 3, { el: 'fire', src: 'hazard', kb: 5 }); hitPots(t.x, t.y, 1.9); api.sfx.crash(); } }); }
      } else if (t.kind === 'fence') {
        const per = 4, u = t.t % per, a = Math.atan2(t.y1 - t.y, t.x1 - t.x), len = hyp(t.x1 - t.x, t.y1 - t.y);
        t.on = u > 2.4 ? 1 : u > 1.9 ? 0.5 : 0;   // off, charging, on
        if (t.on === 1) { t.hitT = (t.hitT || 0) - dt; if (t.hitT <= 0 && inLine(t.x, t.y, a, len, 0.35)) { if (hurtPet(dmg * 0.8, null)) t.hitT = 0.4; } for (const m of mons) if (!m.dead && !m.boss) { const rx = m.x - t.x, ry = m.y - t.y, al = rx * Math.cos(a) + ry * Math.sin(a), of = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)); if (al > 0 && al < len && of < 0.3 + m.r) { m.fenceT = (m.fenceT || 0) - dt; if (m.fenceT <= 0) { m.fenceT = 0.4; hitMon(m, dmg * 1.2, { el: 'spark', src: 'hazard' }); } } } if (Math.random() < dt * 6) sparks(t.x + Math.cos(a) * Math.random() * len, t.y + Math.sin(a) * Math.random() * len, '#4DF0FF', 1, 3); }
      }
    }
    /* ---------- random events: something is always happening ---------- */
    function fireEvent() {
      const kind = DUN_EVENTS[Math.floor(Math.random() * DUN_EVENTS.length)];
      g.eventN++;
      if (kind === 'ambush') {
        const n = 3 + Math.min(4, Math.floor(F.n / 3)), types = F.types.filter(t => !MON[t].still);
        banner('AMBUSH!', 'Monsters pour out of a rift', '#E07BF0', 1.8, true); api.sfx.hum();
        const p = walkPoint(me.x + (Math.random() - 0.5) * 6, me.y + (Math.random() - 0.5) * 6, { r: 0.6, mv: 0 });
        warnZone({ x: p.x, y: p.y, r: 1.8, life: 1.2, max: 1.2, color: '#E07BF0', fn: () => { ring(p.x, p.y, 0.2, 2.4, 0.5, '#E07BF0', 0.3); for (let i = 0; i < n; i++) { const a = i / n * 6.283; spawnMon(types[Math.floor(Math.random() * types.length)] || 'blob', p.x + Math.cos(a) * 0.8, p.y + Math.sin(a) * 0.8, { aggro: true, pack: 900 + g.eventN, flank: a }); g.total++; } flash(0.2, '#E07BF0'); } });
      } else if (kind === 'meteors') {
        banner('METEOR SHOWER!', 'Watch the sky', '#FF9F43', 1.8, true);
        for (let i = 0; i < 10; i++) after(i * 0.4, () => { if (g.won) return; const x = me.x + (Math.random() - 0.5) * 7, y = me.y + (Math.random() - 0.5) * 7; if (!walkAt(Math.floor(x), Math.floor(y))) return; part({ kind: 'meteorfall', x, y, vx: 0, vy: 0, life: 0.9, max: 0.9, size: 1, color: '#FF9F43' }); warnZone({ x, y, r: 1.3, life: 0.9, max: 0.9, color: '#FF9F43', fn: () => { boom(x, y, 1.3, '#FF9F43', '#FFE37A', { n: 16, shake: 6, smoke: 4 }); if (hyp(me.x - x, me.y - y) < 1.3 + me.r) hurtPet(10 * F.dmgMul, null); for (const m of mons) if (!m.dead && !m.boss && hyp(m.x - x, m.y - y) < 1.3 + m.r) hitMon(m, ST.atk * 3, { el: 'fire', burn: true, src: 'hazard' }); } }); });
      } else if (kind === 'coinrain') {
        banner('COIN RAIN!', 'Grab them all', '#FFD447', 1.6, true); api.sfx.coin();
        for (let i = 0; i < 16; i++) after(i * 0.1, () => { const p = walkPoint(me.x + (Math.random() - 0.5) * 6, me.y + (Math.random() - 0.5) * 6, { r: 0.1, mv: 0 }); drop('coin', p.x, p.y); });
      } else if (kind === 'quake') {
        banner('EARTHQUAKE!', 'The ground shakes', '#B7836B', 1.8, true); shake(14, 1.2); api.sfx.crash();
        for (let i = 0; i < 7; i++) after(0.3 + i * 0.25, () => { if (!g.won) rockFall(me.x + (Math.random() - 0.5) * 7, me.y + (Math.random() - 0.5) * 7, 10 * F.dmgMul); });
        for (const m of mons) if (!m.dead && !m.boss && !m.still) m.stun = Math.max(m.stun, 1.2);
      } else if (kind === 'bloodmoon') {
        g.bloodT = 12; banner('BLOOD MOON', 'Monsters rage: double coins for 12s', '#FF4D6D', 2, true); flash(0.4, '#FF4D6D'); api.sfx.hum();
        for (const m of mons) if (!m.dead && !m.aggro && hyp(m.x - me.x, m.y - me.y) < 14) aggroPack(m);
      } else if (kind === 'surge') {
        banner('POWER SURGE!', 'A power stone appears', '#FFE37A', 1.6, true); api.sfx.sparkle();
        dropStone(me.x + (Math.random() - 0.5) * 3, me.y + (Math.random() - 0.5) * 3);
      } else if (kind === 'lightning') {
        banner('LIGHTNING STORM!', 'Bolts hunt the monsters', '#FFE37A', 1.6, true); flash(0.3, '#FFF7C2'); api.sfx.crash();
        const tg = living().filter(m => hyp(m.x - me.x, m.y - me.y) < 10).slice(0, 8);
        tg.forEach((m, j) => after(0.15 + j * 0.12, () => { if (m.dead) return; bolts.push({ pts: skyBolt(m.x, m.y), life: 0.3, max: 0.3, color: '#FFE37A', w: 5 }); hitMon(m, ST.atk * 4, { el: 'spark', stun: 0.8, src: 'hazard' }); boom(m.x, m.y, 0.9, '#FFE37A', '#FFFFFF', { n: 8, smoke: 1, shake: 3 }); }));
        if (!tg.length) for (let i = 0; i < 4; i++) after(i * 0.15, () => { const x = me.x + (Math.random() - 0.5) * 6, y = me.y + (Math.random() - 0.5) * 6; bolts.push({ pts: skyBolt(x, y), life: 0.3, max: 0.3, color: '#FFE37A', w: 4 }); });
      }
    }
    /* ---------- power stones at work every frame ---------- */
    function powersTick(dt) {
      const P = g.pw; if (!Object.keys(P).length) return;
      g.swordA += dt * 3.2;
      if (P.swords) { const n = 2 + P.swords, rr = 1.35; for (let i = 0; i < n; i++) { const aa = g.swordA + i * 6.283 / n, ox = me.x + Math.cos(aa) * rr, oy = me.y - OY + Math.sin(aa) * rr; for (const m of mons) if (!m.dead && hyp(m.x - ox, m.y - oy) < m.r + 0.3) { m.swT = m.swT || 0; if (g.t - m.swT > 0.28) { m.swT = g.t; hitMon(m, ST.atk * 0.9, { el: 'gold', src: 'strong', kb: 2 }); } } hitPots(ox, oy, 0.3); } }
      if (P.chainsaws) { const n = 1 + P.chainsaws, rr = 2.3; for (let i = 0; i < n; i++) { const aa = -g.swordA * 0.8 + i * 6.283 / n, ox = me.x + Math.cos(aa) * rr, oy = me.y - OY + Math.sin(aa) * rr; for (const m of mons) if (!m.dead && hyp(m.x - ox, m.y - oy) < m.r + 0.55) { m.csT = m.csT || 0; if (g.t - m.csT > 0.16) { m.csT = g.t; hitMon(m, ST.atk * 0.55, { el: 'fire', src: 'strong', kb: 1.5 }); if (Math.random() < 0.6) sparks(ox, oy, '#FFE37A', 2, 6); } } hitPots(ox, oy, 0.5); } }
      if (P.laser) { m2tick('plaser', 1.6 / P.laser, () => { const t = nearestMon(me.x, me.y, 8, null, true); if (t) { const a = Math.atan2(t.y - me.y, t.x - me.x), len = rayLen(me.x, me.y - OY, a, 9); X.beamFx(me.x, me.y - OY, a, len, '#FF5C8A'); for (const m of mons) if (!m.dead) { const rx = m.x - me.x, ry = m.y - me.y + OY, al = rx * Math.cos(a) + ry * Math.sin(a), of = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)); if (al > 0 && al < len + m.r && of < 0.35 + m.r) hitMon(m, ST.atk * 2.2, { el: 'prism', src: 'strong' }); } api.sfx.blip(); } }); }
      if (P.thunder) { m2tick('pthunder', 1.1 / P.thunder, () => { const tg = living().filter(m => hyp(m.x - me.x, m.y - me.y) < 8); if (tg.length) { const m = tg[Math.floor(Math.random() * tg.length)]; bolts.push({ pts: skyBolt(m.x, m.y), life: 0.3, max: 0.3, color: '#B983F5', w: 4 }); hitMon(m, ST.atk * 2.5, { el: 'spark', src: 'strong', stun: 0.4 }); boom(m.x, m.y, 0.8, '#B983F5', '#FFFFFF', { n: 6, smoke: 1, shake: 2 }); } }); }
      if (P.firetrail && (me.vx || me.vy)) m2tick('ptrail', 0.22, () => zones.push({ kind: 'fire', x: me.x, y: me.y + 0.1, r: 0.7, life: 1.8, max: 1.8, dps: ST.atk * 0.6 * P.firetrail, tick: 0, own: 'pet', el: 'fire' }));
      if (P.shieldorbs) { const n = 2 + P.shieldorbs, rr = 1.1; for (let i = 0; i < n; i++) { const aa = g.swordA * 0.7 + i * 6.283 / n, ox = me.x + Math.cos(aa) * rr, oy = me.y - OY + Math.sin(aa) * rr; for (const b of eshots) if (!b.lob && !b.mine && b.dmg > 0 && hyp(b.x - ox, b.y - oy) < 0.45 + b.r) { b.life = 0; sparks(ox, oy, '#8FE3F0', 5, 4); ring(ox, oy, 0.1, 0.6, 0.2, '#8FE3F0', 0.1); } } }
    }
    /* ---------- a cap on the monsters alive at once (F.liveCap, a rift's liveCap): the rest of a floor's rolled packs wait
       off the field, neither drawn nor thought about, and walk back in, out of sight of the pet, as the field thins. Only
       rolled pack monsters wait (a stage's own placed monsters, bosses, minis and objects never do); a stage counts them
       as still to beat (g.reserve) ---------- */
    g.reserve = [];
    let capT = 0, capWait = 0;
    const capable = m => !m.dead && !m.boss && !m.fobj && !m.optional && !m.aggro && m.type !== 'nest' && m.type !== 'gremlin' && (m.pack == null || (m.pack >= 0 && m.pack < 300));
    function liveCapTick(dt) {
      capT -= dt; if (capT > 0) return; capT = 0.5;
      const cap = F.liveCap, live = mons.filter(m => !m.dead && !m.fobj && !m.boss);
      if (live.length > cap) {   // (the furthest unroused ones step off)
        const far = live.filter(capable).filter(m => hyp(m.x - me.x, m.y - me.y) > 9).sort((p, q) => hyp(q.x - me.x, q.y - me.y) - hyp(p.x - me.x, p.y - me.y));
        for (const m of far.slice(0, live.length - cap)) { const i = mons.indexOf(m); if (i >= 0) { mons.splice(i, 1); g.reserve.push(m); } }
      } else if (live.length < cap && g.reserve.length) {   // (and come back where they were, while the pet is not looking)
        capWait += 0.5; let room = cap - live.length;
        for (let i = 0; i < g.reserve.length && room > 0; i++) { const m = g.reserve[i]; if (hyp(m.x - me.x, m.y - me.y) > 9 || capWait > 4) { g.reserve.splice(i--, 1); m.aggro = false; mons.push(m); room--; capWait = 0; } }
      }
    }
    /* ---------- the floor's monsters are down: the boss wakes ---------- */
    function floorClearCheck() {
      if (FD || RIFT) return;   // the arena has only the fiend; a rift stage decides its own way on
      if (g.cleared || g.won || me.dead || g.intro > 0) return;
      if (mons.some(m => !m.dead && m.type !== 'gremlin') || (g.gremlin && !g.gremlin.dead)) return;
      if (RULES && !RULES.keysDone()) { if (!g.keysTold) { g.keysTold = true; banner('ALL MONSTERS DOWN', `Find the keys: ${RULES.held()} of 4 held`, '#8FE0A6', 2.2, true); } return; }
      g.cleared = true;
      banner('ALL MONSTERS DOWN', F.boss ? `${F.bossName} is coming for you...` : 'Something big is coming...', '#8FE0A6', 2.2, true); flash(0.3, '#FFFFFF'); api.sfx.fanfare();
      heal(ST.hp * 0.13 * lowK()); gainMP(10 * lowK());
      // (every floor's boss, an act's too, now drops in beside the pet: one waiting far off in its arena left the camera
      // pulled off the pet toward it)
      after(F.boss ? 1.6 : 2.4, () => wakeBoss());
    }

    /* ---------- input ---------- */
    /* the move stick: a thumb on the left half of the screen floats a joystick under it. It is the only way to move;
       attacks only come from taps (a quick tap on the left still attacks) */
    const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0, t0: 0, far: 0 }, STICK_R = 46;
    let touchUI = true; try { touchUI = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0; } catch (e) {}
    /* the controls sit above a bottom margin so labels clear browser bars and home indicators */
    const BOT = 52, HB = () => api.H - BOT;
    const stickHome = () => ({ x: 72, y: HB() - 70 });   // bottom left, under the left thumb
    const inStickZone = (x, y) => touchUI && x < api.W * 0.5 && y > api.H * 0.26;   // mice and keyboards move with the keys
    function stickVec() {
      if (stick.id == null) return null;
      const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = hyp(dx, dy), dz = STICK_R * 0.16;
      if (d < dz) return [0, 0];
      const k = Math.min(1, (d - dz) / (STICK_R * 0.7)); return [dx / d * k, dy / d * k];
    }
    /* the right thumb's cluster: the Ult, up to three Strong buttons fanned around it, Dodge above */
    const STRONG_ANG = [[200], [196, 142], [193, 149, 108]], STRONG_R = [30, 28, 26];
    const btnU = () => ({ x: api.W - 60, y: HB() - 48, r: 38 });
    const btnSs = () => { const U = btnU(), n = SSL.length, A = STRONG_ANG[n - 1]; return SSL.map((k, i) => { const a = A[i] * Math.PI / 180; return { k, x: U.x + Math.cos(a) * 90, y: U.y - Math.sin(a) * 90, r: STRONG_R[n - 1] }; }); };
    const btnS = () => btnSs()[0];
    const btnSw = () => ({ x: SSL.length > 1 ? api.W - 218 : api.W - 128, y: SSL.length > 1 ? HB() - 16 : HB() - 96, r: 22 });
    const btnD = () => SSL.length >= 3 ? { x: api.W - 34, y: HB() - 154, r: 26 } : { x: api.W - 52, y: HB() - 138, r: 27 };
    const onBtn = (b, x, y) => hyp(x - b.x, y - b.y) < b.r + 10;

    /* ---------- one-hand controls: tap anywhere and the pet attacks that way and runs there.
       Tapping a monster stops a little short of it; holding keeps attacking and follows the finger ---------- */
    const holds = new Map();
    const nav = { goal: null, mon: null, keep: 0, fx: -1, fy: -1, fT: 0, stuck: 0, mark: 0 };
    const navD = new Int16Array(MW * MH), navQ = new Int32Array(MW * MH);
    function navField(tx, ty) {
      navD.fill(-1); nav.fx = tx; nav.fy = ty;
      if (!walkAt(tx, ty)) { let best = null, bd = 1e9; for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) { const d = ox * ox + oy * oy; if (d < bd && walkAt(tx + ox, ty + oy)) { bd = d; best = [tx + ox, ty + oy]; } } if (!best) return; tx = best[0]; ty = best[1]; }
      if (!inMap(tx, ty)) return;
      let h = 0, t = 0; navD[ty * MW + tx] = 0; navQ[t++] = ty * MW + tx;
      while (h < t) {
        const k = navQ[h++], x = k % MW, y = (k / MW) | 0, d = navD[k] + 1;
        if (d > 600) break;
        if (x > 0 && navD[k - 1] < 0 && walkAt(x - 1, y)) { navD[k - 1] = d; navQ[t++] = k - 1; }
        if (x < MW - 1 && navD[k + 1] < 0 && walkAt(x + 1, y)) { navD[k + 1] = d; navQ[t++] = k + 1; }
        if (y > 0 && navD[k - MW] < 0 && walkAt(x, y - 1)) { navD[k - MW] = d; navQ[t++] = k - MW; }
        if (y < MH - 1 && navD[k + MW] < 0 && walkAt(x, y + 1)) { navD[k + MW] = d; navQ[t++] = k + MW; }
      }
    }
    function clearPath(x0, y0, x1, y1) { const d = hyp(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.25)); for (let i = 1; i <= n; i++) { const t = i / n; if (blocked(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, me.r * 0.95, 0)) return false; } return true; }
    function goTo(A, wx, wy) {
      if (A && A.t && A.px !== undefined) { const m = A.t; nav.mon = m; nav.keep = m.r + (KIT.normal.key === 'shadowclaw' ? 0.9 : m.boss ? 3 : 2.2); nav.goal = { x: m.x, y: m.y }; nav.stuck = 0; return; }
      nav.mon = null;
      // walk to the nearest open spot on the way to the tap
      let x = me.x, y = me.y; const d = hyp(wx - me.x, wy - me.y), n = Math.max(1, Math.ceil(d / 0.25));
      for (let i = 0; i <= n; i++) { const t = 1 - i / n, px = me.x + (wx - me.x) * t, py = me.y + (wy - me.y) * t; if (walkAt(Math.floor(px), Math.floor(py)) && !blocked(px, py, me.r, 0)) { x = px; y = py; break; } }
      if (hyp(x - me.x, y - me.y) < 0.3) { nav.goal = null; return; }
      nav.goal = { x, y }; nav.stuck = 0; nav.mark = 0.7;
    }
    function navDir(dt) {
      if (!nav.goal) return null;
      nav.fT -= dt;
      let gx = nav.goal.x, gy = nav.goal.y, d = hyp(gx - me.x, gy - me.y);
      if (nav.mon) {
        // run toward the monster itself and stop once it's in range and in sight
        const m = nav.mon; gx = m.x; gy = m.y; d = hyp(m.x - me.x, m.y - me.y); nav.goal.x = m.x; nav.goal.y = m.y;
        if (m.dead || m.under) { nav.goal = null; nav.mon = null; return null; }
        if (d <= nav.keep + 0.12 && los(me.x, me.y, m.x, m.y)) { if (!holds.size) { nav.goal = null; nav.mon = null; } return null; }
      } else if (d < 0.2) { nav.goal = null; return null; }
      let tx = gx, ty = gy;
      if (!clearPath(me.x, me.y, gx, gy)) {
        const gtx = Math.floor(gx), gty = Math.floor(gy);
        if ((gtx !== nav.fx || gty !== nav.fy) && nav.fT <= 0) { navField(gtx, gty); nav.fT = 0.18; }
        const mtx = Math.floor(me.x), mty = Math.floor(me.y), here = inMap(mtx, mty) ? navD[mty * MW + mtx] : -1;
        let best = null, bd = here >= 0 ? here : 1e9;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue; const nx = mtx + ox, ny = mty + oy; if (!inMap(nx, ny)) continue;
          const dd = navD[ny * MW + nx]; if (dd < 0) continue;
          if (ox && oy && (!walkAt(mtx + ox, mty) || !walkAt(mtx, mty + oy))) continue;
          if (dd < bd) { bd = dd; best = [nx + 0.5, ny + 0.5]; }
        }
        if (best) { tx = best[0]; ty = best[1]; }
      }
      const dx = tx - me.x, dy = ty - me.y, dl = hyp(dx, dy) || 1, k = nav.mon ? 1 : Math.min(1, 0.35 + d / 0.6);
      return [dx / dl * k, dy / dl * k];
    }

    /* ---------- the loop ---------- */
    buildFlow();
    let curDt = 1 / 60;
    function update(dtReal) {
      g.t += dtReal;
      for (const b of banners) b.t += dtReal;
      for (let i = banners.length - 1; i >= 0; i--) if (banners[i].t > banners[i].life) banners.splice(i, 1);
      g.flash = Math.max(0, g.flash - dtReal * 2.2); g.hurtV = Math.max(0, g.hurtV - dtReal * 1.4);
      if (g.zoomT > 0) { g.zoomT -= dtReal; if (g.zoomT <= 0) g.zoomP = 1; }
      // the camera pulls back a little while a boss is up
      { const bossUp = g.boss && !g.boss.dead && g.boss.act !== 'sleep', fz = FD && FD.camFocus ? FD.camFocus() : RIFT && RIFT.cam ? RIFT.cam() : null, want = (fz && fz.zoom ? fz.zoom : FD ? (bossUp ? 0.66 : 0.78) : bossUp ? 0.86 : 1) * g.zoomP; g.zoom += (want - g.zoom) * Math.min(1, dtReal * 3); if (Math.abs(g.zoom - want) < 0.002) g.zoom = want; }
      if (g.hitStop > 0) { g.hitStop -= dtReal; return; }
      g.ts = g.slowT > 0 ? 0.3 : 1; if (g.slowT > 0) g.slowT -= dtReal;
      const dt = dtReal * g.ts; curDt = dt;
      if (!g.won && !me.dead) g.elapsed += dt;
      if (g.intro > 0) g.intro -= dt;
      if (FD && !FD.S.started && g.intro <= 0.5) FD.start();
      if (g.bossWake === 1 && M.bossAt) { const bm = makeBoss(); bm.x = M.bossAt.x; bm.y = M.bossAt.y; bm.act = 'sleep'; bm.landed = true; mons.push(bm); g.boss = bm; g.bossWake = 2; }
      if (g.bossWake === 2 && g.boss && hyp(me.x - g.boss.x, me.y - g.boss.y) < 8.5 && los(me.x, me.y, g.boss.x, g.boss.y)) { g.bossWake = 3; g.boss.act = 'enter'; g.bossIntro = 2.8; g.bossShow = null; g.slowT = Math.max(g.slowT, 0.4); flash(0.35, g.boss.glow); shake(9, 0.5); api.sfx.hum(); ring(g.boss.x, g.boss.y, 0.3, 4, 0.9, g.boss.glow, 0.35); }
      if (g.bossIntro > 0) { g.bossIntro -= dt; if (g.bossIntro <= 2.3 && !g.shownBoss && !FD) { g.shownBoss = true; banner(g.boss.bname.toUpperCase(), F.rift ? (g.boss.bk.title || F.rift.name) : g.boss.mini ? `Floor ${F.n} guardian` : `Act ${F.act + 1} boss`, g.boss.glow, 2.2, true); shake(10, 0.6); api.sfx.hum(); flash(0.3, g.boss.glow); } }
      for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const f = timers[i].f; timers.splice(i, 1); f(); } }
      if (AN) AN.update(dt, dtReal);
      if (RULES) RULES.update(dt);
      if (RIFT) RIFT.update(dt);
      // a sandstorm blows in waves (fourteen seconds of storm, twelve of calm): while it blows, the sand wears the pet's HP
      // slowly away (never below 1)
      if (PB.storm === 'sand' && !F.fiend) { g.stormC = (g.stormC || 0) + dt; const cyc = g.stormC % 26, on = cyc < 14 && g.intro <= 0;
        if (on && !g.stormOn) { g.stormOn = true; banner('SANDSTORM', 'The sand wears at you while it blows', '#E8B36A', 2, true); api.sfx.whoosh(); } else if (!on && g.stormOn) { g.stormOn = false; text(me.x, me.y - 1.4, 'The storm passes', '#FFE9A8', 12); }
        g.stormK = (g.stormK || 0) + ((on ? 1 : 0) - (g.stormK || 0)) * Math.min(1, dt * 0.8);
        if (g.stormK > 0.5 && !me.dead && !g.won) { g.stormHurtT = (g.stormHurtT || 0) - dt; if (g.stormHurtT <= 0) { g.stormHurtT = 1; const d = Math.min(me.hp - 1, Math.max(1, Math.round(ST.hp * 0.006))); if (d > 0) { me.hp -= d; text(me.x + (Math.random() - 0.5) * 0.6, me.y - 1.1, `-${d}`, '#E8B36A', 10); } } } }
      if (FD) FD.update(dt);
      if (F.liveCap) liveCapTick(dt);
      if (RX) RX.update(dt); if (STAR) STAR.update(dt); if (ELEM) ELEM.update(dt); if (RES) RES.update(dt); if (g.eclipseT > 0) g.eclipseT -= dt;
      const cdK = (g.buff.arcane > 0 ? 1.6 : 1) * (RULES ? RULES.cdK() : 1) / (1 - Math.min(0.5, accK('cdr')));
      g.cdS = Math.max(0, g.cdS - dt * cdK); g.cdS2 = Math.max(0, g.cdS2 - dt * cdK); g.cdS3 = Math.max(0, g.cdS3 - dt * cdK); g.cdU = Math.max(0, g.cdU - dt * cdK);
      ['warpT', 'stopT', 'shieldT', 'phoenixT', 'dodgeCd', 'counterT', 'frostbite'].forEach(kk => { g[kk] = Math.max(0, g[kk] - dt); });
      if (g.swapCd > 0) g.swapCd -= dt;
      for (const b in g.buff) { if (g.buff[b] > 0) { g.buff[b] -= dt; if (g.buff[b] <= 0) { g.buff[b] = 0; if (b === 'guardian') g.guardHP = 0; text(me.x, me.y - 1.2, `${SHRINES[b].name} faded`, '#CFE2FF', 12); } } }
      me.inv = Math.max(0, me.inv - dt); me.hurtT += dt; me.lvFx = Math.max(0, me.lvFx - dt); me.chill = Math.max(0, me.chill - dt); me.sq = Math.max(0, me.sq - dt * 4);
      if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) g.combo = 0; }
      if (g.bloodT > 0) g.bloodT -= dt;
      if (g.tapFx > 0) g.tapFx -= dtReal;
      g.hpShow += (me.hp / ST.hp - g.hpShow) * Math.min(1, dt * (me.hp / ST.hp > g.hpShow ? 8 : 1.6));
      const ultOk = me.mp >= KIT.ult.cost && g.cdU <= 0;
      if (ultOk && !g.ultReady && g.intro <= 0 && g.bossIntro <= 0) { g.ultReady = true; api.sfx.chirp(); if (!g.shownTips.ult) { g.shownTips.ult = true; banner('Ult ready!', 'Tap the big glowing button', EL(KIT.ult.el).color, 1.6); } }
      if (!ultOk) g.ultReady = false;
      // movement
      let mx = 0, my = 0;
      if (!me.dead && !g.won && !(g.cineT > 0)) {
        const K = api.keys;
        if (K.left) mx -= 1; if (K.right) mx += 1; if (K.up) my -= 1; if (K.down) my += 1;
        // the stick (or the keys) is the only way to move; attacks come only from taps
        const sv = stickVec();
        if (!mx && !my && sv) { mx = sv[0]; my = sv[1]; }
        nav.goal = null; nav.mon = null; g.navFrom = null;
        const mm = hyp(mx, my); if (mm > 1) { mx /= mm; my /= mm; }
        if (K.dodge && !g.dodgeHeld) { g.dodgeHeld = true; dodge(); } else if (!K.dodge) g.dodgeHeld = false;
      }
      mxIn = mx; myIn = my;
      const tile = tileAt(Math.floor(me.x), Math.floor(me.y));
      const spd = 4.3 * (1 + accK('spd')) * (RULES ? RULES.spdK() : 1) * (g.phoenixT > 0 ? 1.35 : 1) * (g.buff.haste > 0 ? 1.3 : 1) * (me.chill > 0 ? 0.6 : 1) * (tile === T_MUD ? 0.62 : 1) * (g.pw.giant ? 0.92 : 1);
      if (me.dodge) {
        const D = me.dodge; D.t += dt; const k2 = 1 - Math.pow(D.t / D.dur, 2) * 0.6;
        moveEnt(me, D.vx * dt * k2, D.vy * dt * k2, 0);
        if (Math.random() < 0.8) part({ kind: 'afterP', x: me.x, y: me.y, vx: 0, vy: 0, life: 0.22, max: 0.22, size: 1, color: EL(AB.el).color, face: me.face, rot: D.t / D.dur * 6.283 * (D.vx >= 0 ? 1 : -1) });
        if (D.t >= D.dur) { me.dodge = null; me.inv = Math.max(me.inv, 0.08); }
      } else if (me.push) {
        const P = me.push; P.t -= dt; moveEnt(me, P.vx * dt, P.vy * dt, 0); if (P.t <= 0) me.push = null;
      } else if (me.dash) {
        const D = me.dash; D.t -= dt;
        const before = [me.x, me.y]; moveEnt(me, D.vx * dt, D.vy * dt, 0);
        for (const m of mons) if (!m.dead && !D.hit.has(m) && hyp(m.x - me.x, m.y - me.y) < m.r + 0.7) { D.hit.add(m); hitMon(m, D.dmg, { el: D.el, src: 'strong', kb: 5 }); }
        hitPots(me.x, me.y, 0.6);
        part({ kind: 'ghost', x: before[0], y: before[1], vx: 0, vy: 0, life: 0.25, max: 0.25, size: 1, color: EL(D.el).color });
        if (D.t <= 0) { me.dash = null; hitArea(me.x, me.y, 2, D.land, { el: D.el, src: 'strong', kb: 3 }); boom(me.x, me.y, 2, EL(D.el).color, '#FFFFFF', { n: 18, shake: 7 }); }
      } else if (me.leap) {
        const L = me.leap; L.t -= dt; me.z = Math.sin((1 - L.t / L.max) * Math.PI) * 1.4;
        if (L.t <= 0) { me.leap = null; me.z = 0; hitArea(me.x, me.y, L.r, L.dmg, { el: L.el, src: 'strong', stun: 0.6, kb: 4 }); boom(me.x, me.y, L.r, EL(L.el).color, '#FFFFFF', { n: 26, shake: 11, smoke: 8 }); for (let i = 0; i < 14; i++) { const aa = Math.random() * 6.283; part({ kind: 'shard', x: me.x, y: me.y, vx: Math.cos(aa) * 5, vy: Math.sin(aa) * 5 - 2, g: 10, life: 0.6, max: 0.6, size: 5, rot: aa, vr: 10, color: PB.top }); } api.sfx.crash(); }
        moveEnt(me, mx * spd * 0.6 * dt, my * spd * 0.6 * dt, 0);
      } else if (!me.dead) {
        if (tile === T_ICE) { me.vx += (mx * spd - me.vx) * Math.min(1, dt * 2.2); me.vy += (my * spd - me.vy) * Math.min(1, dt * 2.2); }
        else { me.vx = mx * spd; me.vy = my * spd; }
        moveEnt(me, me.vx * dt, me.vy * dt, 0);
        if (me.castT > 0) me.castT -= dt;
        { const mvW = !!(mx || my); me.wph = (me.wph || 0) + dt * (mvW ? 9 : 3.4); }
        if (mx || my) { const mm = hyp(mx, my); me.ax = mx / mm; me.ay = my / mm; me.bob += dt * 12; if (Math.random() < dt * 6) part({ kind: 'smoke', x: me.x - mx * 0.2, y: me.y + 0.12, vx: -mx * 0.6, vy: -0.3, life: 0.4, max: 0.4, size: 0.1 + 0.06 * SIZE, color: PB.out ? 'rgba(220,230,210,' : 'rgba(200,190,230,' }); }
      }
      if (g.navFrom && nav.goal) { const moved = hyp(me.x - g.navFrom[0], me.y - g.navFrom[1]); if (moved < spd * dt * 0.15) { nav.stuck += dt; if (nav.stuck > 0.45) { nav.goal = null; nav.mon = null; } } else nav.stuck = 0; }
      if (nav.mark > 0) nav.mark -= dtReal;
      me.tilt += (clamp(me.vx * 0.04, -0.18, 0.18) * (me.dodge ? 0 : 1) - me.tilt) * Math.min(1, dt * 10);
      for (const p of pots) if (!p.broken && hyp(p.x - me.x, p.y - me.y) < 0.55 + me.r) breakPot(p);
      // shrines
      for (const s of shrines) { s.t += dt; if (!s.used && hyp(s.x - me.x, s.y - me.y) < 0.95 && !me.dead) useShrine(s); }
      // explore (and clear the fog)
      const ex0 = Math.floor(me.x - 7), ex1 = Math.floor(me.x + 7), ey0 = Math.floor(me.y - 7), ey1 = Math.floor(me.y + 7);
      for (let ty = ey0; ty <= ey1; ty++) for (let tx = ex0; tx <= ex1; tx++) if (inMap(tx, ty) && !explored[ty * MW + tx] && (tx + 0.5 - me.x) ** 2 + (ty + 0.5 - me.y) ** 2 < 52) { explored[ty * MW + tx] = 1; fogDirty = true; expV++; if (miniNew.length < 4096) miniNew.push(ty * MW + tx); else miniNew.full = true; }
      flowT -= dt; if (flowT <= 0) { flowT = 0.25; buildFlow(); }
      // the loot gremlin appears
      if (M.gremlin && !g.gremlin && hyp(M.gremlin.x - me.x, M.gremlin.y - me.y) < 7.5 && explored[Math.floor(M.gremlin.y) * MW + Math.floor(M.gremlin.x)]) {
        g.gremlin = spawnMon('gremlin', M.gremlin.x, M.gremlin.y, { aggro: true, pack: -1 });
        banner('A LOOT GREMLIN!', 'Catch it before it escapes!', '#9BD15E', 2.2, true); api.sfx.giggle && api.sfx.giggle(); ring(M.gremlin.x, M.gremlin.y, 0.3, 2.4, 0.5, '#9BD15E', 0.3);
        newMonster(g.gremlin);
      }
      for (const h of hazards) hazardTick(h, dt);
      for (const t of traps) trapTick(t, dt);
      // power stones on the floor
      for (const s of stones) { if (s.got) continue; s.t += dt; if (s.fresh > 0) s.fresh -= dt; if (!me.dead && !g.won && hyp(s.x - me.x, s.y - me.y) < 0.75 + me.r) takeStone(s); }
      for (let i = stones.length - 1; i >= 0; i--) if (stones[i].got) stones.splice(i, 1);
      powersTick(dt);
      // random events
      if (F.events && !g.won && !me.dead && g.intro <= 0 && g.bossIntro <= 0 && !(g.boss && !g.boss.dead && g.boss.act === 'enter')) { g.eventT -= dt; if (g.eventT <= 0) { g.eventT = 26 + Math.random() * 16; fireEvent(); } }
      // normal attack: fired where you tap (Space on a keyboard). Taps during the cooldown are kept for a moment
      if (mx && g.t - g.lastTapT > 0.5) me.face = mx > 0 ? 1 : -1;
      g.normalT = Math.max(0, g.normalT - dt);
      if (g.tapBuf > 0 && !(g.cineT > 0)) { g.tapBuf -= dt; const A = g.tapAim || aim(); if (tryFire(A)) { if (!api.keys.tap) { g.tapBuf = 0; g.tapAim = null; } } }
      if (g.tapAim && g.tapAim.key && !api.keys.tap) g.tapAim = null;
      if (KIT.normal.key === 'n_orbit' && !me.dead) {
        const n = AB.count || 2;
        for (let i = 0; i < n; i++) { const aa = g.t * 3.4 + i * 6.283 / n, ox = me.x + Math.cos(aa) * 1.15, oy = me.y - OY + Math.sin(aa) * 1.15; for (const m of mons) if (!m.dead && hyp(m.x - ox, m.y - oy) < m.r + 0.25) { m.orbT = m.orbT || 0; if (g.t - m.orbT > 0.3) { m.orbT = g.t; hitMon(m, ST.atk * KIT.normal.mult * 0.6, {}); } } }
      }
      if (me.spin) {
        const S2 = me.spin; S2.t -= dt; S2.tick -= dt;
        if (S2.tick <= 0) { S2.tick = 0.14; hitArea(me.x, me.y, S2.r, S2.dmg, { el: S2.el, src: 'strong', kb: S2.pull ? 0 : 2.5 }); for (let i = 0; i < 6; i++) { const aa = Math.random() * 6.283; part({ kind: 'spark', x: me.x + Math.cos(aa) * S2.r * 0.8, y: me.y + Math.sin(aa) * S2.r * 0.8, vx: -Math.sin(aa) * 7, vy: Math.cos(aa) * 7, life: 0.25, max: 0.25, size: 2.5, color: EL(S2.el).color }); } }
        if (S2.pull) for (const m of mons) if (!m.dead && !m.boss && !m.still) { const dd = hyp(me.x - m.x, me.y - m.y); if (dd < 4 && dd > 0.8) moveEnt(m, (me.x - m.x) / dd * 2.5 * dt, (me.y - m.y) / dd * 2.5 * dt); }
        if (S2.t <= 0) me.spin = null;
      }
      [me.beam, beamUlt].forEach((Bm, bi) => {
        if (!Bm) return;
        Bm.t -= dt;
        const tA = aim(); if (tA.t) { let da = tA.a - Bm.a; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; Bm.a += clamp(da, -2.4 * dt, 2.4 * dt); }
        let len = Bm.len; for (let s = 0.5; s < Bm.len; s += 0.25) if (solidAt(Math.floor(me.x + Math.cos(Bm.a) * s), Math.floor(me.y - 0.2 + Math.sin(Bm.a) * s))) { len = s; break; }
        Bm.cur = len;
        Bm.tick = (Bm.tick || 0) - dt;
        if (Bm.tick <= 0) {
          Bm.tick = 0.1;
          for (const o of (Bm.offs || [0])) { const ba = Bm.a + o, bw = o ? Bm.w * 0.6 : Bm.w; for (const m of mons) { if (m.dead) continue; const rx = m.x - me.x, ry = m.y - me.y + 0.2, along = rx * Math.cos(ba) + ry * Math.sin(ba), off = Math.abs(-rx * Math.sin(ba) + ry * Math.cos(ba)); if (along > 0 && along < len + m.r && off < bw / 2 + m.r) hitMon(m, Bm.dps * 0.1 * (o ? 0.6 : 1), { el: Bm.el, src: bi ? 'ult' : 'strong' }); } }
          hitPots(me.x + Math.cos(Bm.a) * len * 0.5, me.y + Math.sin(Bm.a) * len * 0.5, 0.6);
          if (bi) { eshots.forEach(b => { const rx = b.x - me.x, ry = b.y - me.y, al = rx * Math.cos(Bm.a) + ry * Math.sin(Bm.a), of = Math.abs(-rx * Math.sin(Bm.a) + ry * Math.cos(Bm.a)); if (al > 0 && al < len && of < Bm.w && !b.lob) b.life = 0; }); shake(3, 0.1); }
        }
        light(me.x + Math.cos(Bm.a) * len * 0.5, me.y + Math.sin(Bm.a) * len * 0.5, len * 0.6, 0.12);
        if (Math.random() < 0.7) sparks(me.x + Math.cos(Bm.a) * len, me.y - 0.2 + Math.sin(Bm.a) * len, EL(Bm.el).color, 2, 6);
        if (Bm.t <= 0) { if (bi) beamUlt = null; else me.beam = null; }
      });
      if (swarmQ > 0) { const n = Math.min(swarmQ, 3); swarmQ -= n; for (let i = 0; i < n; i++) { const aa = Math.random() * 6.283; shot({ vx: Math.cos(aa) * 9, vy: Math.sin(aa) * 9, dmg: ST.atk * KIT.ult.mult * 0.9, r: 0.18, home: 10, style: 'star', el: KIT.ult.el, life: 3, src: 'ult' }); } }
      if (petalT > 0) { petalT -= dt; m2tick('petal', 0.15, () => { hitArea(me.x, me.y, 4, ST.atk * KIT.ult.mult * 0.45, { el: 'leaf', src: 'ult' }); heal(ST.hp * 0.012, true); }); for (let i = 0; i < 3; i++) { const aa = g.t * 5 + i * 2.1 + Math.random(), rr = 1 + Math.random() * 3; part({ kind: 'petal', x: me.x + Math.cos(aa) * rr, y: me.y + Math.sin(aa) * rr, vx: -Math.sin(aa) * 6, vy: Math.cos(aa) * 6, life: 0.7, max: 0.7, size: 6, rot: aa, vr: 10, color: i % 2 ? '#FF9BD2' : '#FFE3F0' }); } }
      if (blizT > 0) { blizT -= dt; m2tick('bliz', 0.25, () => { for (const m of mons) if (!m.dead && hyp(m.x - me.x, m.y - me.y) < 9) { hitMon(m, ST.atk * KIT.ult.mult * 0.55, { el: 'frost', src: 'ult', chill: true }); } }); if (Math.random() < 0.25) part({ kind: 'glow', x: me.x + (Math.random() - 0.5) * 12, y: me.y + (Math.random() - 0.5) * 8, vx: -1, vy: 0.4, life: 2.2, max: 2.2, size: 2.4 + Math.random() * 2, color: '#CFEFFF', alpha: 0.18 }); for (let i = 0; i < 3; i++) part({ kind: 'snow', x: me.x + (Math.random() - 0.5) * 16, y: me.y - 9 + Math.random() * 4, vx: -2 + Math.random(), vy: 6 + Math.random() * 4, life: 1.6, max: 1.6, size: 2 + Math.random() * 3.5, color: '#FFFFFF' }); if (Math.random() < 0.15) { const m = nearestMon(me.x + (Math.random() - 0.5) * 8, me.y + (Math.random() - 0.5) * 8, 4); if (m) { part({ kind: 'shard', x: m.x, y: m.y - 3, vx: 0, vy: 12, life: 0.25, max: 0.25, size: 9, rot: Math.PI / 2, vr: 0, color: '#CFEFFF' }); after(0.25, () => { if (!m.dead) { hitMon(m, ST.atk * KIT.ult.mult * 1.2, { el: 'frost', src: 'ult', freeze: 1 }); sparks(m.x, m.y, '#CFEFFF', 8, 5); } }); } } }
      for (let di = dragons.length - 1; di >= 0; di--) { const Dg = dragons[di]; Dg.t += dt; Dg.x += Dg.dir * 11 * dt; Dg.y = me.y + Dg.oy + Math.sin(Dg.t * 3 + Dg.ph) * 2.2; Dg.trail.unshift([Dg.x, Dg.y]); if (Dg.trail.length > 24) Dg.trail.length = 24; m2tick('dragon' + di, 0.1, () => { for (const m of mons) if (!m.dead && hyp(m.x - Dg.x, m.y - Dg.y) < 2.4) hitMon(m, Dg.dmg * 0.3, { el: 'fire', src: 'ult', burn: true }); }); for (let i = 0; i < 3; i++) part({ kind: 'ember', x: Dg.x - Dg.dir * 0.6, y: Dg.y + (Math.random() - 0.5), vx: -Dg.dir * 2 + (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 0.6, max: 0.6, size: 6 + Math.random() * 6, color: Math.random() < 0.5 ? Dg.col : '#FF5C8A' }); light(Dg.x, Dg.y, 4, 0.1); if (Math.abs(Dg.x - me.x) > 10 && Dg.t > 0.5) { Dg.passes++; if (Dg.passes >= Dg.max) dragons.splice(di, 1); else { Dg.dir *= -1; Dg.t = 0; } } }
      if (supernova > 0) { supernova -= dt; me.inv = Math.max(me.inv, 0.2); if (Math.random() < 0.8) { const aa = Math.random() * 6.283; part({ kind: 'spark', x: me.x + Math.cos(aa) * 4, y: me.y + Math.sin(aa) * 4, vx: -Math.cos(aa) * 10, vy: -Math.sin(aa) * 10, life: 0.4, max: 0.4, size: 3, color: ['#FF9BD2', '#7FD3F2', '#FFE37A'][Math.floor(Math.random() * 3)] }); } light(me.x, me.y, 4 + (1 - supernova) * 6, 0.1); if (Math.random() < 0.06) ring(me.x, me.y, 4.5, 0.6, 0.35, ['#FF9BD2', '#7FD3F2', '#FFE37A'][Math.floor(Math.random() * 3)], 0.2); if (supernova <= 0) { const dmg = ST.atk * KIT.ult.mult * 14; for (const m of mons) if (!m.dead && hyp(m.x - me.x, m.y - me.y) < novaR) hitMon(m, dmg, { el: 'prism', src: 'ult', kb: 6 }); part({ kind: 'flare', x: me.x, y: me.y - OY, vx: 0, vy: 0, life: 0.8, max: 0.8, size: novaR, color: '#FFFFFF' }); eshots.length = 0; for (let i = 0; i < 4; i++) ring(me.x, me.y, 0.3, novaR - 1 + i * 2, 0.8 + i * 0.2, ['#FFFFFF', '#FF9BD2', '#7FD3F2', '#FFE37A'][i], 0.6); boom(me.x, me.y, 6, '#FFFFFF', '#FFE37A', { n: 80, shake: 20, smoke: 14 }); flash(1, '#FFFFFF'); hitstop(0.1); g.slowT = 0.6; api.sfx.crash(); } }
      if (g.phoenixT > 0) { m2tick('phx', 0.2, () => { hitArea(me.x, me.y, 1.7, ST.atk * KIT.ult.mult * 0.6, { el: 'fire', src: 'ult', burn: true }); if (mx || my) zones.push({ kind: 'fire', x: me.x, y: me.y, r: 0.8, life: 1.6, max: 1.6, dps: ST.atk * 0.6, tick: 0, own: 'pet', el: 'fire' }); }); for (let i = 0; i < 3; i++) part({ kind: 'ember', x: me.x + (Math.random() - 0.5) * 1.4, y: me.y - Math.random(), vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 3, life: 0.6, max: 0.6, size: 4 + Math.random() * 4, color: Math.random() < 0.5 ? '#FF9F43' : '#FFE37A' }); light(me.x, me.y, 4.5, 0.1); }
      if (g.shieldT > 0) { m2tick('bub', 0.5, () => { const nb = KIT.ult.tier ? 12 : 8; for (let i = 0; i < nb; i++) { const aa = i / nb * 6.283 + g.t; shot({ x: me.x, y: me.y - OY, vx: Math.cos(aa) * 6, vy: Math.sin(aa) * 6, dmg: ST.atk * KIT.ult.mult * 0.6, r: 0.2, style: 'bubble', el: 'bubble', life: 1, src: 'ult' }); } }); eshots.forEach(b => { if (!b.lob && hyp(b.x - me.x, b.y - me.y) < 1.2) { b.vx *= -1; b.vy *= -1; b.mine = true; b.boomer = null; } }); }
      for (const h of helpers) {
        h.t -= dt; h.fireT -= dt;
        const off = h.kind === 'clone' || h.kind === 'mirror' ? [h.s * 1.3, 0.2] : [Math.cos(g.t * 1.8 + h.s * 2.1) * 1.6, Math.sin(g.t * 1.8 + h.s * 2.1) * 1.6];
        h.x = lerp(h.x, me.x + off[0], Math.min(1, dt * 6)); h.y = lerp(h.y, me.y + off[1], Math.min(1, dt * 6));
        if (h.fireT <= 0) { h.fireT = h.kind === 'mirror' ? 0.5 : 0.34; const t = nearestMon(h.x, h.y, 8, null, true); if (t) { const aa = Math.atan2(t.y - h.y, t.x - h.x); shot({ x: h.x, y: h.y - 0.25, vx: Math.cos(aa) * 12, vy: Math.sin(aa) * 12, dmg: h.kind === 'mirror' ? ST.atk * KIT.normal.mult * 0.45 * (g.pw.mirror || 1) : ST.atk * KIT.ult.mult * (h.kind === 'clone' ? 0.8 : 0.6), r: 0.15, style: h.kind === 'shadow' ? 'dart' : 'orb', el: h.kind === 'shadow' ? 'shadow' : AB.el, src: h.kind === 'mirror' ? 'strong' : 'ult' }); } }
        if (h.t <= 0) { h.dead = true; sparks(h.x, h.y, h.color, 12, 5); }
      }
      for (let i = helpers.length - 1; i >= 0; i--) if (helpers[i].dead) helpers.splice(i, 1);
      // pet shots
      for (const b of shots) {
        b.t += dt; b.life -= dt; if (b.onTick) b.onTick(b, dt);
        if (b.home) { const t = nearestMon(b.x, b.y, 7); if (t) { const s = hyp(b.vx, b.vy) || 1, ca = Math.atan2(b.vy, b.vx); let da = Math.atan2(t.y - b.y, t.x - b.x) - ca; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; const na = ca + clamp(da, -b.home * dt, b.home * dt), s2 = Math.min(13, s + 6 * dt); b.vx = Math.cos(na) * s2; b.vy = Math.sin(na) * s2; } }
        if (b.boom) { b.bt = (b.bt || 0) + dt; if (b.bt > b.boom) { const dx = me.x - b.x, dy = me.y - OY - b.y, dd = hyp(dx, dy) || 1; b.vx += (dx / dd * 16 - b.vx) * Math.min(1, dt * 5); b.vy += (dy / dd * 16 - b.vy) * Math.min(1, dt * 5); if (dd < 0.45) b.life = 0; } }
        let nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
        if (b.wave) { const w = Math.cos(b.t * 14) * 4.9 * b.wave * dt; nx += b.ox * w; ny += b.oy * w; }
        if (!b.boom && RES && solidAt(Math.floor(nx), Math.floor(ny))) { const pp = RES.propAt(Math.floor(nx), Math.floor(ny)); if (pp) { RES.hitProp(pp, b.el, b.src === 'ult' ? 3 : b.src === 'strong' ? 2 : 1); if (b.pierce > 0) b.pierce--; else { b.life = 0; splashShot(b, b.x, b.y); } continue; } }
        if (!b.boom && solidAt(Math.floor(nx), Math.floor(ny))) {
          if (b.bounce > 0) { b.bounce--; if (solidAt(Math.floor(nx), Math.floor(b.y))) b.vx *= -1; else b.vy *= -1; nx = b.x; ny = b.y; sparks(b.x, b.y, EL(b.el).color, 3, 3); }
          else { b.life = 0; sparks(b.x, b.y, EL(b.el).color, 4, 3); splashShot(b, b.x, b.y); if (b.boomBig) { boom(b.x, b.y, b.aoe || 1.5, '#FF9F43', '#FFE37A', { n: 20, shake: 7 }); hitArea(b.x, b.y, b.aoe || 1.5, b.dmg, { el: b.el, burn: b.burn, src: b.src }); } continue; }
        }
        b.x = nx; b.y = ny; if (RES) RES.shotAt(b);
        if (b.style === 'comet' || b.style === 'fireball' || b.style === 'star' || b.style === 'crescent') { if (Math.random() < 0.8) part({ kind: b.style === 'star' ? 'star' : 'ember', x: b.x, y: b.y, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), life: 0.4, max: 0.4, size: b.style === 'comet' || b.style === 'fireball' ? 7 : 4, color: EL(b.el).color }); }
        for (const m of mons) {
          if (m.dead || b.life <= 0 || m.under) continue;
          if (hyp(m.x - b.x, m.y - (m.z || 0) - b.y) > m.r + b.r) continue;
          if (b.hits) { const last = b.hits.get(m); if (last != null && (!b.boom || b.t - last < 0.3)) continue; b.hits.set(m, b.t); }
          if (b.boomBig) { boom(b.x, b.y, b.aoe, '#FF9F43', '#FFE37A', { n: 24, shake: 8, smoke: 5 }); hitArea(b.x, b.y, b.aoe, b.dmg, { el: b.el, burn: b.burn, src: b.src, kb: 3 }); flash(0.15, '#FFB066'); b.life = 0; break; }
          hitMon(m, b.dmg, { el: b.el, burn: b.burn, chill: b.chill, src: b.src, kb: b.kb });
          if (b.onHit) b.onHit(m, b);
          if (b.split) { [-0.6, 0, 0.6].forEach(o => { const aa = Math.atan2(b.vy, b.vx) + o; const s = shot({ x: m.x, y: m.y, vx: Math.cos(aa) * 9, vy: Math.sin(aa) * 9, dmg: b.dmg * 0.35, r: 0.1, life: 0.4, style: 'crystal', el: b.el }); s.hits = new Map([[m, 0]]); }); }
          if (b.chain) { let from = m; const done = new Set([m]); for (let j = 0; j < b.chain; j++) { const t2 = nearestMon(from.x, from.y, 3.5, done); if (!t2) break; done.add(t2); zap(from.x, from.y, t2.x, t2.y, EL(b.el).color, 3); hitMon(t2, b.dmg * 0.6, { el: b.el }); from = t2; } }
          if (b.aoe || b.burnZone) splashShot(b, b.x, b.y);
          if (b.pierce > 0) b.pierce--; else if (!b.boom) { b.life = 0; break; }
        }
        if (b.life > 0) for (const p of pots) if (!p.broken && hyp(p.x - b.x, p.y - b.y) < 0.4 + b.r) { breakPot(p); if (!b.pierce && !b.boom) b.life = 0; }
      }
      for (let i = shots.length - 1; i >= 0; i--) if (shots[i].life <= 0) { if (shots[i].onEnd) shots[i].onEnd(shots[i]); shots.splice(i, 1); }
      // monsters
      const edt = g.stopT > 0 || g.cineT > 0 ? 0 : dt;
      for (let i = 0; i < mons.length; i++) updMon(mons[i], dt);
      for (let i = 0; i < mons.length; i++) {
        const a = mons[i]; if (a.dead || a.mv === 2 || a.falling != null || a.under) continue;
        for (let j = i + 1; j < mons.length; j++) {
          const b = mons[j]; if (b.dead || b.mv === 2 || b.falling != null || b.under) continue;
          const dx = b.x - a.x, dy = b.y - a.y; if (Math.abs(dx) > 2.4 || Math.abs(dy) > 2.4) continue;
          const d = hyp(dx, dy), mn = a.r + b.r;
          if (d > 0.001 && d < mn) { const push = (mn - d) / 2, ux = dx / d, uy = dy / d; if (!a.boss && !a.still) moveEnt(a, -ux * push, -uy * push); if (!b.boss && !b.still) moveEnt(b, ux * push, uy * push); }
        }
      }
      for (let i = mons.length - 1; i >= 0; i--) if (mons[i].dead && !mons[i].boss) mons.splice(i, 1);
      // enemy shots
      for (const b of eshots) {
        b.t += edt; b.life -= edt;
        if (b.lob) { const L = b.lob, u = clamp(b.t / L.dur, 0, 1); b.x = lerp(L.sx, L.tx, u); b.y = lerp(L.sy, L.ty, u); b.z = Math.sin(u * Math.PI) * L.h; continue; }
        if (b.home && !b.mine) { const s = hyp(b.vx, b.vy), ca = Math.atan2(b.vy, b.vx); let da = Math.atan2(me.y - b.y, me.x - b.x) - ca; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; const na = ca + clamp(da, -b.home * edt, b.home * edt); b.vx = Math.cos(na) * s; b.vy = Math.sin(na) * s; }
        if (b.boomer && b.t > b.boomer.out) { const h = b.boomer.home, hx = h && !h.dead ? h.x : b.x, hy = h && !h.dead ? h.y : b.y, dx = hx - b.x, dy = hy - b.y, dd = hyp(dx, dy) || 1, s = Math.max(6, hyp(b.vx, b.vy)); b.vx += (dx / dd * s - b.vx) * Math.min(1, edt * 6); b.vy += (dy / dd * s - b.vy) * Math.min(1, edt * 6); if (dd < 0.5 || !h || h.dead) b.life = Math.min(b.life, dd < 0.5 ? 0 : 0.3); }
        const k2 = g.warpT > 0 ? 0.3 : 1;
        b.x += b.vx * edt * k2; b.y += b.vy * edt * k2;
        if (!b.boomer && solidAt(Math.floor(b.x), Math.floor(b.y))) {
          if (b.bounce > 0) { b.bounce--; b.x -= b.vx * edt * k2; b.y -= b.vy * edt * k2; if (solidAt(Math.floor(b.x + b.vx * edt * k2 * 2), Math.floor(b.y))) b.vx *= -1; else b.vy *= -1; sparks(b.x, b.y, b.color, 3, 3); }
          else { b.life = 0; sparks(b.x, b.y, b.color, 3, 2); continue; }
        }
        if (b.hurtsMons) { for (const m of mons) if (!m.dead && !m.boss && hyp(m.x - b.x, m.y - b.y) < m.r + b.r) { hitMon(m, b.dmg * 1.5, { src: 'hazard' }); b.life = 0; break; } if (b.life <= 0) continue; }
        if (b.mine) { for (const m of mons) if (!m.dead && hyp(m.x - b.x, m.y - b.y) < m.r + b.r) { hitMon(m, ST.atk, { el: 'bubble' }); b.life = 0; break; } continue; }
        b.hitT = (b.hitT || 0) - edt;
        if (b.hitT <= 0 && hyp(me.x - b.x, me.y - OY * 0.5 - b.y) < me.r + b.r) {
          const landed = hurtPet(b.dmg, null);
          if (landed && b.chill) chillPet(b.chill);
          if (b.keep) b.hitT = 0.5; else if (!me.dodge) b.life = 0;
        }
      }
      for (let i = eshots.length - 1; i >= 0; i--) if (eshots[i].life <= 0) eshots.splice(i, 1);
      // zones (ground effects and warnings)
      for (const z of zones) {
        z.life -= z.own === 'enemy' && (g.stopT > 0 || g.cineT > 0) ? 0 : dt;
        if (z.follow && !z.follow.dead) { z.x = z.follow.x; z.y = z.follow.y; }
        if (z.kind === 'warn') { if (z.life <= 0 && z.fn) z.fn(); continue; }
        if (z.kind === 'vortex') { if (z.follow) { z.x = me.x; z.y = me.y; } for (const m of mons) if (!m.dead && !m.boss && !m.still) { const dd = hyp(z.x - m.x, z.y - m.y); if (dd < z.r && dd > 0.2) moveEnt(m, (z.x - m.x) / dd * 3.4 * dt, (z.y - m.y) / dd * 3.4 * dt); } if (Math.random() < 0.9) { const aa = Math.random() * 6.283; part({ kind: 'spark', x: z.x + Math.cos(aa) * z.r, y: z.y + Math.sin(aa) * z.r, vx: -Math.cos(aa) * 6 - Math.sin(aa) * 4, vy: -Math.sin(aa) * 6 + Math.cos(aa) * 4, life: 0.5, max: 0.5, size: 2.5, color: '#B07CF0' }); } light(z.x, z.y, 3, 0.1); if (z.life <= 0) { hitArea(z.x, z.y, 2.5, z.end || 0, { el: z.el || 'cosmic', src: 'strong', kb: 6 }); boom(z.x, z.y, 2.5, '#B07CF0', '#FFFFFF', { n: 30, shake: 9 }); } }
        if (z.kind === 'ring') {
          z.r += z.speed * edt; z.hitT -= edt;
          const pd = hyp(me.x - z.x, me.y - z.y);
          if (Math.abs(pd - z.r) < z.w && z.hitT <= 0) { let ang = Math.atan2(me.y - z.y, me.x - z.x) - z.off; ang = ((ang % 6.283) + 6.283) % 6.283; const seg = 6.283 / z.gaps; if ((ang % seg) > seg * 0.3) { if (hurtPet(z.dmg, null) && z.chill) chillPet(z.chill); z.hitT = 0.6; } }
        }
        if (z.kind === 'sweep') {
          if (z.src && !z.src.dead) { z.x = z.src.x; z.y = z.src.y; }
          const age = z.max - z.life;
          if (age > z.warm) { z.a += z.va * edt; z.hitT -= edt; if (z.hitT <= 0 && inLine(z.x, z.y, z.a, z.len, z.w)) { if (hurtPet(z.dmg, z.src)) z.hitT = 0.4; } if (Math.random() < 0.6) sparks(z.x + Math.cos(z.a) * z.len * Math.random(), z.y + Math.sin(z.a) * z.len * Math.random(), '#FFE37A', 1, 4); light(z.x + Math.cos(z.a) * 4, z.y + Math.sin(z.a) * 4, 4, 0.1); }
        }
        if (z.pull && z.life > 0) { const dd = hyp(z.x - me.x, z.y - me.y); if (dd < z.r * 2.2 && dd > 0.3 && !me.dodge) moveEnt(me, (z.x - me.x) / dd * z.pull * dt, (z.y - me.y) / dd * z.pull * dt, 0); }
        if (z.kind === 'web' && !me.dodge && hyp(z.x - me.x, z.y - me.y) < z.r + me.r * 0.5) me.chill = Math.max(me.chill, 0.3);
        if (z.kind === 'stall' && hyp(z.x - me.x, z.y - me.y) < z.r + me.r * 0.5) me.chill = Math.max(me.chill, 0.3);   // (a second-eater's stopped patch)
        if (z.dps) { z.tick -= dt; if (z.tick <= 0) { z.tick = 0.3; if (z.own === 'pet') { for (const m of mons) if (!m.dead && hyp(m.x - z.x, m.y - z.y) < z.r + m.r) hitMon(m, z.dps * 0.3, { dot: true, dotC: z.kind === 'fire' ? '#FFB066' : '#D7B9FF' }); } else { if (hyp(me.x - z.x, me.y - z.y) < z.r) hurtPet(z.dps * 0.3, null, { dot: true }); if (z.hurtsMons) for (const m of mons) if (!m.dead && !m.boss && hyp(m.x - z.x, m.y - z.y) < z.r + m.r) hitMon(m, z.dps * 0.6, { dot: true, dotC: '#B6F09C' }); } } if (z.kind === 'fire' || z.kind === 'efire') { if (Math.random() < 0.5) part({ kind: 'ember', x: z.x + (Math.random() - 0.5) * z.r * 1.6, y: z.y + (Math.random() - 0.5) * z.r * 1.2, vx: 0, vy: -1.5 - Math.random() * 2, life: 0.6, max: 0.6, size: 4 + Math.random() * 4, color: z.kind === 'efire' ? '#FF5C8A' : '#FF9F43' }); light(z.x, z.y, z.r * 1.8, 0.1); } if (z.kind === 'poison' && Math.random() < 0.4) part({ kind: 'bubble', x: z.x + (Math.random() - 0.5) * z.r * 1.6, y: z.y + (Math.random() - 0.5) * z.r, vx: 0, vy: -1, life: 0.8, max: 0.8, size: 3 + Math.random() * 3, color: '#9BE07A' }); if (z.kind === 'evoid' && Math.random() < 0.6) { const aa = Math.random() * 6.283; part({ kind: 'spark', x: z.x + Math.cos(aa) * z.r, y: z.y + Math.sin(aa) * z.r, vx: -Math.cos(aa) * 3, vy: -Math.sin(aa) * 3, life: 0.5, max: 0.5, size: 2.5, color: '#B07CF0' }); } }
      }
      for (let i = zones.length - 1; i >= 0; i--) if (zones[i].life <= 0) zones.splice(i, 1);
      // pickups
      for (const p of picks) {
        p.t += dt; p.vz -= 18 * dt; p.z = Math.max(0, p.z + p.vz * dt); if (p.z === 0) { p.vz = Math.abs(p.vz) > 2 ? -p.vz * 0.4 : 0; p.vx *= 0.8; p.vy *= 0.8; }
        const dx = me.x - p.x, dy = me.y - p.y, d = hyp(dx, dy), reach = g.pw.magnet ? 2.8 + 3 * g.pw.magnet : 2.8;
        if (p.t > 0.35 && d < reach) { const pull = 9 * (1 - d / reach) + 3; p.x += dx / (d || 1) * pull * dt; p.y += dy / (d || 1) * pull * dt; } else { p.x += p.vx * dt; p.y += p.vy * dt; if (blocked(p.x, p.y, 0.1, 0)) { p.x -= p.vx * dt; p.y -= p.vy * dt; p.vx = p.vy = 0; } }
        if (d < 0.5 && p.t > 0.25) {
          p.got = true;
          if (p.kind === 'coin') { const v = Math.round(p.v * (g.buff.fortune > 0 ? 2 : 1) * (g.pw.magnet ? 2 : 1) * (1 + accK('gold'))); g.coins += v; api.sfx.coin(); text(me.x + 0.4, me.y - 0.8, '+' + v, '#FFD447', 12, { life: 0.6, max: 0.6 }); }
          else if ((p.kind === 'hp' || p.kind === 'mp') && g.frostbite > 0) { text(me.x, me.y - 1.1, 'Frostbite: it does not heal', '#9FD8F0', 13); api.sfx.wrong(); }   // (frostbite: healing items do nothing)
          else if (p.kind === 'hp') { const hv = ST.hp * 0.146 * lowK(); heal(hv); text(me.x, me.y - 1.1, '+' + Math.round(Math.min(hv, ST.hp)) + ' HP', '#FF8FB0', 14); api.sfx.yum(); ring(me.x, me.y, 0.2, 1.2, 0.3, '#FF5C8A'); }
          else if (p.kind === 'food') { gotFood(p.food); text(me.x, me.y - 1.1, `+1 ${SNACKS[p.food].name}`, '#9BD178', 13); api.sfx.yum(); ring(me.x, me.y, 0.2, 1.2, 0.3, '#9BD178'); }
          else if (p.kind === 'acc') { const a = p.acc, Rr = ACC_R[a.r]; g.accs.push(a); banner(`${Rr.name.toUpperCase()} ${ACC_TYPE[a.t].name.toUpperCase()}!`, `${accName(a)} · ${accMainText(a)}`, Rr.c, a.r >= 4 ? 2.4 : 1.8, a.r >= 3); if (a.r >= 4) api.sfx.fanfare(); else api.sfx.sparkle(); ring(me.x, me.y, 0.2, 2.2, 0.45, Rr.c); if (a.r >= 3) flash(0.18, Rr.c); }
          else if (p.kind === 'gem') { g.gems.push(p.gem); banner(`${GEMS[p.gem].name}!`, 'A gemstone for evolving', GEMS[p.gem].color, 1.6); api.sfx.sparkle(); ring(me.x, me.y, 0.2, 1.8, 0.4, GEMS[p.gem].color); }
          else { const mv = 15.4 * lowK(); gainMP(mv); text(me.x, me.y - 1.1, '+' + Math.round(mv * 1.2) + ' MP', '#7FB6FF', 14); api.sfx.bubble(); ring(me.x, me.y, 0.2, 1.2, 0.3, '#5DA8F0'); }
        }
      }
      for (let i = picks.length - 1; i >= 0; i--) if (picks[i].got) picks.splice(i, 1);
      // particles, rings, bolts, texts, lights
      for (const p of parts) { p.life -= dt; if (p.drag) { p.vx *= Math.pow(1 / (1 + p.drag), dt * 4); p.vy *= Math.pow(1 / (1 + p.drag), dt * 4); } if (p.g) p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt; }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
      ambient(dt);
      for (const r of rings) r.life -= dt; for (let i = rings.length - 1; i >= 0; i--) if (rings[i].life <= 0) rings.splice(i, 1);
      for (const b of bolts) b.life -= dt; for (let i = bolts.length - 1; i >= 0; i--) if (bolts[i].life <= 0) bolts.splice(i, 1);
      for (const t of texts) { t.life -= dtReal; t.y += t.vy * dtReal; t.vy *= 0.94; } for (let i = texts.length - 1; i >= 0; i--) if (texts[i].life <= 0) texts.splice(i, 1);
      for (const l of lights) l.life -= dt; for (let i = lights.length - 1; i >= 0; i--) if (lights[i].life <= 0) lights.splice(i, 1);
      // camera: follow the pet with a little look-ahead (and keep the boss in frame)
      const bossUp = g.boss && !g.boss.dead && g.boss.act !== 'sleep';
      // a Super Fiend may say where to look (its body high over its feet, its own ending after it falls)
      const fc = FD && FD.camFocus ? FD.camFocus() : RIFT && RIFT.cam ? RIFT.cam() : null;
      const bf = fc ? fc.k : bossUp ? 0.38 : 0, look = 0.7, fx = fc ? fc.x : bossUp ? g.boss.x : me.x, fy = fc ? fc.y : bossUp ? g.boss.y : me.y;
      // (the pull toward a boss is held to a few tiles, so the pet never leaves the screen)
      let ox = (fx - me.x) * bf, oy = (fy - me.y) * bf; if (!fc) { const od = Math.hypot(ox, oy), cap = 3.2; if (od > cap) { ox *= cap / od; oy *= cap / od; } }
      const ctx = me.x + mx * look * (1 - bf) + ox, cty = me.y + my * look * (1 - bf) + oy;
      cam.x += (ctx - cam.x) * Math.min(1, dtReal * 6); cam.y += (cty - cam.y) * Math.min(1, dtReal * 6);
      if (cam.st > 0) { cam.st -= dtReal; if (cam.st <= 0) cam.sm = 0; }
      // every monster down: the floor's boss wakes (a loot gremlin still on the run gets its chance first)
      floorClearCheck();
      hudSync();
    }
    function m2tick(key, every, f) { g['tk_' + key] = (g['tk_' + key] || 0) - curDt; if (g['tk_' + key] <= 0) { g['tk_' + key] = every; f(); } }
    /* drifting dust, fireflies, snow, embers, leaves and sparkles: each land has its own air */
    function ambient(dt) {
      for (const p of amb) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'greenflies') { p.vx += Math.sin(g.t * 1.3 + p.ph2) * dt * 0.5; p.vy += Math.cos(g.t * 1.1 + p.ph) * dt * 0.4; p.vx *= 1 - dt * 0.3; p.vy *= 1 - dt * 0.3; } if (p.kind === 'leaf' || p.kind === 'petal') { p.rot += p.vr * dt; p.vx += Math.sin(g.t * 2 + p.ph) * dt * 0.8; } }
      for (let i = amb.length - 1; i >= 0; i--) if (amb[i].life <= 0) amb.splice(i, 1);
      const storm = !F.fiend && PB.storm;
      // (a Super Fiend's arena keeps fewer motes in the air, and none on a device that has had to give up its light passes)
      if (amb.length > (storm ? 90 : F.fiend ? 18 : 46) || reduceMotion || (F.fiend && fiendLow())) return;
      const FDA = F.fiend && FIEND_DEFS[F.fiend.id], kind = FDA && 'ambient' in FDA ? FDA.ambient : PB.ambient; if (!kind) return;
      const rate = (kind === 'greenflies' ? 9 : kind === 'snow' ? 14 : kind === 'leaves' ? 4 : kind === 'petals' ? 6 : kind === 'sand' || kind === 'wind' ? 10 : 8) * (storm ? (storm === 'sand' ? 1 + 1.3 * (g.stormK || 0) : 3) : PB.haze ? 1.8 : 1);
      if (Math.random() > rate * dt) return;
      const w = api.W / TS / 2 + 1, h = api.H / TS / 2 + 1, x = cam.x + (Math.random() * 2 - 1) * w, y = cam.y + (Math.random() * 2 - 1) * h;
      const P = { x, y, vx: 0, vy: 0, life: 3 + Math.random() * 3, max: 6, ph: Math.random() * 6.28, kind, rot: Math.random() * 6, vr: 0, size: 1 };
      if (kind === 'snow') { P.y = cam.y - h; P.vx = -0.4 + Math.random() * 0.3; P.vy = 1 + Math.random() * 0.8; P.size = 1.5 + Math.random() * 2; P.life = P.max = 8; if (storm) { P.x = cam.x + w; P.vx = -(5 + Math.random() * 3); P.vy = 1.5 + Math.random(); P.life = P.max = 3; } }
      else if (kind === 'sand' || kind === 'wind') { P.x = cam.x - w; P.vx = (kind === 'sand' ? 5 : 7) + Math.random() * 3; P.vy = (Math.random() - 0.5) * 0.6; P.size = 2 + Math.random() * 3; P.life = P.max = 2.5 + Math.random(); }
      else if (kind === 'steam') { P.y = cam.y + h; P.vy = -1.2 - Math.random() * 0.8; P.vx = (Math.random() - 0.5) * 0.4; P.size = 4 + Math.random() * 5; P.life = P.max = 4; }
      else if (kind === 'petals') { P.kind = 'petal'; P.y = cam.y - h; P.vx = 0.4 + Math.random() * 0.8; P.vy = 0.7 + Math.random() * 0.5; P.vr = 3 + Math.random() * 3; P.size = 3 + Math.random() * 2; P.life = P.max = 9; P.c = Math.random() < 0.5 ? '#FF9BD2' : Math.random() < 0.5 ? '#FFFFFF' : '#FFE3F0'; }
      else if (kind === 'embers') { P.vy = -0.6 - Math.random() * 0.8; P.vx = (Math.random() - 0.5) * 0.4; P.size = 1.5 + Math.random() * 2; }
      else if (kind === 'leaves') { P.kind = 'leaf'; P.x = cam.x - w; P.vx = 1.2 + Math.random(); P.vy = 0.3 + Math.random() * 0.4; P.vr = 2 + Math.random() * 3; P.size = 3 + Math.random() * 2; P.life = P.max = 9; P.c = Math.random() < 0.5 ? '#9BD178' : '#FFE37A'; }
      else if (kind === 'goldmotes') { P.vx = (Math.random() - 0.5) * 0.08; P.vy = -0.05; P.size = 1.5 + Math.random() * 2; P.life = P.max = 5 + Math.random() * 3; }
      else if (kind === 'greenflies') { P.vx = (Math.random() - 0.5) * 0.4; P.vy = (Math.random() - 0.5) * 0.3; P.size = 2.2 + Math.random() * 1.6; P.life = P.max = 6 + Math.random() * 4; P.ph2 = Math.random() * 6.28; }
      else if (kind === 'fireflies') { P.vx = (Math.random() - 0.5) * 0.3; P.vy = (Math.random() - 0.5) * 0.3; P.size = 2 + Math.random() * 1.5; }
      else if (kind === 'sparkles') { P.vy = -0.15; P.size = 2 + Math.random() * 2.5; P.life = P.max = 2 + Math.random() * 2; }
      else if (kind === 'wisps') { P.vy = -0.25; P.vx = (Math.random() - 0.5) * 0.2; P.size = 2.5 + Math.random() * 2; }
      else { P.vx = (Math.random() - 0.5) * 0.15; P.vy = -0.08; P.size = 1 + Math.random() * 1.5; }
      amb.push(P);
    }
    let hudKey = '';
    function hudSync() {
      const left = mons.filter(m => !m.dead && m.type !== 'gremlin' && (!m.boss || m.lesser)).length, bossUp = g.boss && !g.boss.dead, RL = RULES ? RULES.label() : '', four = g.bossN > 1 ? ` · ${g.bossDown || 0}/${g.bossN} down` : '';
      const key = bossUp ? `b${Math.ceil(g.boss.hp)}|${g.coins}|${g.boss.act === 'sleep' ? 1 : 0}|${FD ? FD.S.phase : 0}|${four}` : `${left}|${g.coins}|${g.cleared ? 1 : 0}|${RL}|${RIFT ? RIFT.goal() : ''}`;
      if (key === hudKey) return;
      hudKey = key;
      if (bossUp) api.hud({ score: g.coins, hearts: 0, max: 0, goal: FD ? FD.goal() : g.boss.act === 'sleep' ? `Find ${g.boss.bname} in the arena` : `${g.boss.bname} · ${Math.max(0, Math.ceil(g.boss.hp / g.boss.maxhp * 100))}%${four}` });
      else if (RIFT) api.hud({ score: g.coins, hearts: 0, max: 0, goal: g.won ? 'Section clear!' : RIFT.goal() });
      else api.hud({ score: g.coins, hearts: 0, max: 0, goal: (g.won ? 'Floor clear!' : left ? `${left} monster${left > 1 ? 's' : ''} left · ${PB.name}` : g.cleared ? 'The boss is coming!' : RULES && !RULES.keysDone() ? 'Find the keys' : 'Floor clear!') + (RL ? ' · ' + RL : '') });
    }

    /* ---------- drawing ---------- */
    let lc = null, lx = null, shX = 0, shY = 0;
    const SKIP = {};
    let miniMap = null;
    const Tz = () => TS * g.zoom, SK = () => Math.min(arc.dpr || 1, 2);
    // where a picture drawn pixel for pixel lands: on the screen's own pixel grid, which is sharper, and several times
    // cheaper to draw where the drawing is not done by the graphics chip, than between pixels (set from the canvas's
    // transform at the start of every frame; on a screen of coarse pixels, where a whole pixel is a step the eye can see,
    // things are left to glide between them)
    let snK = 1, snE = 0, snF = 0, snOn = false;
    const snX = v => snOn ? (Math.round(v * snK + snE) - snE) / snK : v, snY = v => snOn ? (Math.round(v * snK + snF) - snF) / snK : v;
    function sx(x) { return (x - cam.x) * TS * g.zoom + api.W / 2 + shX; }
    function sy(y) { return (y - cam.y) * TS * g.zoom + api.H / 2 + shY; }
    const isExp = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return inMap(tx, ty) && explored[ty * MW + tx] === 1; };
    // ground chunks, painted once and reused
    const chunks = new Map(); let chunkTS = 0, chunkK = 1;
    const CH = DunWorld.CH, CHUNK_MAX = 40;   // the view (up to 3 x 5 chunks) and the ring round it (5 x 7) fit with room to spare
    // a full cache lets go of a chunk outside the view and its ring first (the oldest of those), so the ring is never
    // thrown out to make room for itself
    let ringB = null;
    const inRing = k => { if (!ringB) return false; const i = k.indexOf(','), x = +k.slice(0, i), y = +k.slice(i + 1); return x >= ringB[0] && x <= ringB[2] && y >= ringB[1] && y <= ringB[3]; };
    const farChunk = () => { for (const k of chunks.keys()) if (!inRing(k)) return k; return null; };
    function getChunk(cx, cy, mayPaint) {
      const k2 = Math.min(arc.dpr || 1, 1.5);
      if (chunkTS !== TS || chunkK !== k2) { chunks.clear(); chunkTS = TS; chunkK = k2; }
      const key = cx + ',' + cy;
      let c = chunks.get(key);
      if (c) { chunks.delete(key); chunks.set(key, c); return c; }
      if (!mayPaint) return null;
      c = DunWorld.chunk(M, cx, cy, TS, k2);
      chunks.set(key, c);
      if (chunks.size > CHUNK_MAX) chunks.delete(farChunk() || chunks.keys().next().value);
      return c;
    }
    function prewarm() {
      const T = TS, x0 = Math.floor((cam.x - api.W / 2 / T - 1) / CH), x1 = Math.floor((cam.x + api.W / 2 / T + 1) / CH), y0 = Math.floor((cam.y - api.H / 2 / T - 2) / CH), y1 = Math.floor((cam.y + api.H / 2 / T + 2) / CH);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (cx >= 0 && cy >= 0 && cx * CH < MW && cy * CH < MH) getChunk(cx, cy, true);
    }
    // fog over places not explored yet: one pixel per tile, blown up smoothly
    const fogC = document.createElement('canvas'); fogC.width = MW; fogC.height = MH;
    const fogX = fogC.getContext('2d'); fogX.fillStyle = PB.fog || FOG_COL[F.biome] || '#07050E'; fogX.fillRect(0, 0, MW, MH);
    let fogDirty = true;
    // (the fog's pixels are kept here, in the page's own memory, and only ever written to the canvas: reading a canvas
    // back stalls until everything drawn so far is finished, which cost more than the rest of the overlay together)
    const fogImg = fogX.getImageData(0, 0, MW, MH);
    function fogSync() { if (!fogDirty) return; fogDirty = false; const d = fogImg.data; for (let i = 0; i < MW * MH; i++) if (explored[i]) d[i * 4 + 3] = 0; fogX.putImageData(fogImg, 0, 0); }
    function drawWorld(c) {
      const W = api.W, H = api.H, T = Tz();
      if (FD) { FD.drawArena(c, W, H, cam, T, g.t); return; }
      const x0 = Math.floor(cam.x - W / 2 / T) - 1, x1 = Math.ceil(cam.x + W / 2 / T) + 1, y0 = Math.floor(cam.y - H / 2 / T) - 2, y1 = Math.ceil(cam.y + H / 2 / T) + 2;
      // the backdrop shows only through the gaps and past the edge of the map: it is painted inside the box round those
      // (a tile wider all round, for the rounded corners of the ground beside a gap), and not at all when there are none
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      const box = (ax, ay, bx, by) => { if (ax < bx0) bx0 = ax; if (ay < by0) by0 = ay; if (bx > bx1) bx1 = bx; if (by > by1) by1 = by; };
      if (x0 < 0) box(x0, y0, -1, y1); if (x1 >= MW) box(MW, y0, x1, y1); if (y0 < 0) box(x0, y0, x1, -1); if (y1 >= MH) box(x0, MH, x1, y1);
      for (let ty = Math.max(0, y0); ty <= Math.min(MH - 1, y1); ty++) for (let tx = Math.max(0, x0); tx <= Math.min(MW - 1, x1); tx++) if (G[ty * MW + tx] === T_GAP) box(tx, ty, tx, ty);
      const open = bx1 >= bx0;
      if (open) {
        const X0 = Math.max(0, Math.floor(sx(bx0 - 1))), Y0 = Math.max(0, Math.floor(sy(by0 - 1))), X1 = Math.min(W, Math.ceil(sx(bx1 + 2))), Y1 = Math.min(H, Math.ceil(sy(by1 + 2)));
        if (X1 > X0 && Y1 > Y0) { c.save(); c.beginPath(); c.rect(X0, Y0, X1 - X0, Y1 - Y0); c.clip();
          if (!SKIP.backdrop) DunWorld.backdrop(c, PB.gap, W, H, cam.x, cam.y, T, g.t); else { c.fillStyle = PB.bg; c.fillRect(0, 0, W, H); }
          c.restore(); }
      }
      // gaps from another land (a lava pool on a sky floor) get their own look
      let gs = null;
      for (let ty = Math.max(0, y0); ty <= Math.min(MH - 1, y1); ty++) for (let tx = Math.max(0, x0); tx <= Math.min(MW - 1, x1); tx++) {
        const kk = ty * MW + tx; if (G[kk] !== T_GAP) continue;
        const gb = BIOMES[BIOME_ORDER[M.BI[kk]]]; if (gb.gap === PB.gap) continue;
        if (!gs || gs.kind !== gb.gap) { gs = DunWorld.gapStyle(c, gb.gap, cam.x, cam.y, T, W, H); gs.kind = gb.gap; }
        c.fillStyle = gs.base; c.fillRect(sx(tx), sy(ty), T + 0.5, T + 0.5);
        if (gs.pat) { c.fillStyle = gs.pat; c.fillRect(sx(tx), sy(ty), T + 0.5, T + 0.5); }
      }
      // ground chunks
      const cx0 = Math.max(0, Math.floor(x0 / CH)), cx1 = Math.min(Math.floor((MW - 1) / CH), Math.floor(x1 / CH)), cy0 = Math.max(0, Math.floor(y0 / CH)), cy1 = Math.min(Math.floor((MH - 1) / CH), Math.floor(y1 / CH));
      let paints = 0; ringB = [cx0 - 1, cy0 - 1, cx1 + 1, cy1 + 1];
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const had = chunks.has(cx + ',' + cy), cv = getChunk(cx, cy, paints < 3);
        if (!cv || SKIP.chunks) continue;
        if (!had) paints++;
        c.drawImage(cv, sx(cx * CH), sy(cy * CH), CH * T + 0.5, CH * T + 0.5);
      }
      // warm the next ring of chunks a little at a time (while there is room for it, or something farther off to let go)
      if (paints === 0 && g.t > 0.5 && (chunks.size < CHUNK_MAX || farChunk())) { outer: for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) { if (cx < 0 || cy < 0 || cx * CH >= MW || cy * CH >= MH) continue; if (!chunks.has(cx + ',' + cy)) { getChunk(cx, cy, true); break outer; } } }
      // animated touches: shimmering ice and mud, glowing lava cracks
      for (let ty = Math.max(0, y0); ty <= Math.min(MH - 1, y1); ty++) for (let tx = Math.max(0, x0); tx <= Math.min(MW - 1, x1); tx++) {
        const t = G[ty * MW + tx];
        if (t === T_ICE && ((tx * 7 + ty * 3) % 5 === 0)) { const u = (g.t * 0.6 + tx * 0.13 + ty * 0.07) % 1; if (u < 0.25) { c.globalAlpha = Math.sin(u / 0.25 * Math.PI) * 0.7; c.fillStyle = '#FFFFFF'; GFX.star(c, sx(tx + 0.5), sy(ty + 0.4), T * 0.12, '#FFFFFF', 0); c.globalAlpha = 1; } }
      }
    }
    function drawProp(c, p) {
      const T = Tz(), sk = SK(), sp = DunWorld.propSprite(p.kind, TS, sk, p.v, p.biome), k2 = g.zoom / sk, jx = p.flash > 0 ? Math.sin(g.t * 60) * T * 0.08 : 0;
      c.drawImage(sp.cv, snX(sx(p.x) - sp.ax * k2 + jx), snY(sy(p.y) - sp.ay * k2), sp.cv.width * k2, sp.cv.height * k2);
      if (p.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = p.flash * 4; blitSized(c, glowSprite(EL(p.el).color), sx(p.x) - T * 0.8, sy(p.y) - T * 1.1, T * 1.6, T * 1.6); c.restore(); }
    }
    function drawPot(c, p) {
      const T = Tz(), kind = p.kind === 'pot' && BIOMES[p.biome] && BIOMES[p.biome].out ? 'urn' : p.kind === 'pot' && (p.v % 3 === 0) ? 'crate' : p.kind === 'barrel' ? 'xbarrel' : p.kind;
      const sk = SK(), sp = DunWorld.propSprite(kind, TS, sk, 0, p.biome || F.biome), k2 = g.zoom / sk;
      const jig = p.flash > 0 ? (Math.random() - 0.5) * 3 : 0;
      c.drawImage(sp.cv, snX(sx(p.x) - sp.ax * k2 + jig), snY(sy(p.y + 0.3) - sp.ay * k2), sp.cv.width * k2, sp.cv.height * k2);
      p.flash = Math.max(0, p.flash - 0.016);
    }
    function drawShrine(c, s) {
      const T = Tz(), S = SHRINES[s.kind], sk = SK(), sp = DunWorld.propSprite(s.used ? 'spent' : 'shrine', TS, sk, 0, F.biome, s.used ? '' : S.color), k2 = g.zoom / sk;
      const X = sx(s.x), Y = sy(s.y + 0.3);
      c.drawImage(sp.cv, snX(X - sp.ax * k2), snY(Y - sp.ay * k2), sp.cv.width * k2, sp.cv.height * k2);
      if (!s.used) {
        const bob = Math.sin(s.t * 2.5) * T * 0.08, gy = Y - T * 1.95 + bob;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 + 0.2 * Math.sin(s.t * 4); const gsz = T * 0.9; blitSized(c, glowSprite(S.color), X - gsz, gy - gsz, gsz * 2, gsz * 2); c.restore();
        GFX.gem(c, X, gy, T * 0.2, S.color);
        if (hyp(me.x - s.x, me.y - s.y) < 4) GFX.textS(c, S.name, X, Y - T * 2.45, Math.max(10, Math.round(T * 0.3)), S.color);
      }
    }
    function drawHazard(c, h) {
      if (h.area || !isExp(h.x, h.y)) return;
      const T = Tz(), X = sx(h.x), Y = sy(h.y), fam = h.fam || HAZ_FAMILY[h.kind] || 'spikes';
      if (fam === 'spikes') {
        const ice = h.kind === 'icespikes', thorn = h.kind === 'thorns';
        c.fillStyle = 'rgba(0,0,0,.25)'; GFX.rr(c, X - T * 0.42, Y - T * 0.42, T * 0.84, T * 0.84, T * 0.1); c.fill();
        c.fillStyle = h.st === 'warn' ? '#8C5A6B' : ice ? '#9FC4E0' : thorn ? '#4E6A3A' : '#5E5A6A'; GFX.rr(c, X - T * 0.38, Y - T * 0.38, T * 0.76, T * 0.76, T * 0.08); c.fill(); c.lineWidth = 1.5; c.strokeStyle = GFX.line; c.stroke();
        const up = h.pop > 0 ? Math.min(1, h.pop / 0.15) : h.st === 'warn' ? 0.15 * Math.abs(Math.sin(g.t * 30)) : 0;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const px = X + (i - 1) * T * 0.24, py = Y + (j - 1) * T * 0.24; c.fillStyle = '#2B2433'; c.beginPath(); c.arc(px, py, T * 0.04, 0, 6.283); c.fill(); if (up > 0) { c.fillStyle = ice ? '#DDF6FF' : thorn ? '#6CC15A' : '#E8EEF8'; c.beginPath(); c.moveTo(px - T * 0.06, py); c.lineTo(px, py - T * 0.36 * up); c.lineTo(px + T * 0.06, py); c.closePath(); c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 1; c.stroke(); } }
      } else if (fam === 'gas') {
        const col = h.kind === 'steamvent' ? '#E8F0F8' : h.kind === 'pollen' ? '#FFE37A' : '#9BE07A', base = h.kind === 'steamvent' ? '#6B4E3A' : h.kind === 'pollen' ? '#B85A88' : '#3F5A30', inner = h.kind === 'steamvent' ? '#3E2C20' : h.kind === 'pollen' ? '#8E3F68' : '#1E3A22';
        c.fillStyle = base; c.beginPath(); c.ellipse(X, Y, T * 0.36, T * 0.18, 0, 0, 6.283); c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = inner; c.beginPath(); c.ellipse(X, Y, T * 0.22, T * 0.1, 0, 0, 6.283); c.fill();
        const n = h.st === 'warn' ? 3 : 1; for (let i = 0; i < n; i++) { const u = (g.t * (h.st === 'warn' ? 2.5 : 0.8) + i * 0.33 + h.ph) % 1; c.globalAlpha = 1 - u; c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(X + Math.sin(i * 2 + h.ph) * T * 0.1, Y - u * T * 0.6, T * (0.05 + u * 0.06), 0, 6.283); c.stroke(); } c.globalAlpha = 1;
      } else {
        const sand = h.kind === 'sandspout';
        c.fillStyle = sand ? '#B5824C' : '#2A1515'; c.beginPath(); c.ellipse(X, Y, T * 0.4, T * 0.2, 0, 0, 6.283); c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.stroke();
        const glow = h.st === 'warn' ? 0.6 + 0.4 * Math.sin(g.t * 20) : 0.35 + 0.1 * Math.sin(g.t * 3 + h.ph);
        c.fillStyle = sand ? `rgba(255,230,170,${glow})` : `rgba(255,${h.st === 'warn' ? 180 : 111},60,${glow})`; c.beginPath(); c.ellipse(X, Y, T * 0.24, T * 0.1, 0, 0, 6.283); c.fill();
      }
    }
    function drawTrap(c, t) {
      if (!isExp(t.x, t.y)) return;
      const T = Tz(), X = sx(t.x), Y = sy(t.y);
      if (t.kind === 'arrow' || t.kind === 'flame') {
        const a = Math.atan2(t.dy, t.dx), fl = t.kind === 'flame';
        c.save(); c.translate(X, Y - T * 0.1); c.rotate(a);
        c.fillStyle = fl ? '#5A4632' : '#5E5A6A'; GFX.rr(c, -T * 0.34, -T * 0.26, T * 0.6, T * 0.52, T * 0.08); c.fill(); c.lineWidth = 1.5; c.strokeStyle = GFX.line; c.stroke();
        c.fillStyle = '#1A1426'; c.beginPath(); c.arc(T * 0.18, 0, T * 0.12, 0, 6.283); c.fill();
        if (fl) { c.fillStyle = `rgba(255,159,67,${0.5 + 0.4 * Math.sin(g.t * 9)})`; c.beginPath(); c.arc(T * 0.18, 0, T * 0.07, 0, 6.283); c.fill(); }
        else if (t.on > 0) { t.on -= 0.016; c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(T * 0.18, 0, T * 0.06, 0, 6.283); c.fill(); }
        c.restore();
      } else if (t.kind === 'saw') {
        // the track, then the blade
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = T * 0.14; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx(t.x0), sy(t.y0)); c.lineTo(sx(t.x1), sy(t.y1)); c.stroke();
        c.strokeStyle = '#8B93A1'; c.lineWidth = T * 0.06; c.stroke();
        const bx = sx(t.px), by = sy(t.py) - T * 0.12, r = T * 0.5;
        c.save(); c.translate(bx, by); c.rotate(t.spin || 0);
        c.beginPath(); for (let i = 0; i < 12; i++) { const aa = i / 12 * 6.283, a2 = aa + 6.283 / 24; c.lineTo(Math.cos(aa) * r, Math.sin(aa) * r); c.lineTo(Math.cos(a2) * r * 0.72, Math.sin(a2) * r * 0.72); } c.closePath();
        c.fillStyle = '#C9D2DC'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = GFX.line; c.stroke();
        c.fillStyle = '#5E5A6A'; c.beginPath(); c.arc(0, 0, r * 0.25, 0, 6.283); c.fill(); c.stroke();
        c.restore();
      } else if (t.kind === 'mine') {
        if (t.st === 'done') return;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.05, T * 0.3, T * 0.12, 0, 0, 6.283); c.fill();
        c.fillStyle = t.st === 'armed' ? '#FF6F59' : '#6B6F8F'; c.beginPath(); c.ellipse(X, Y - T * 0.08, T * 0.28, T * 0.18, 0, 0, 6.283); c.fill(); c.lineWidth = 1.5; c.strokeStyle = GFX.line; c.stroke();
        c.fillStyle = (Math.floor(g.t * (t.st === 'armed' ? 16 : 2)) % 2) ? '#FF4D6D' : '#5A1E2B'; c.beginPath(); c.arc(X, Y - T * 0.16, T * 0.05, 0, 6.283); c.fill();
        for (let i = 0; i < 4; i++) { const aa = i / 4 * 6.283 + 0.6; c.fillStyle = '#3A3450'; c.beginPath(); c.arc(X + Math.cos(aa) * T * 0.24, Y - T * 0.08 + Math.sin(aa) * T * 0.14, T * 0.035, 0, 6.283); c.fill(); }
      } else if (t.kind === 'fence') {
        const X1 = sx(t.x1), Y1 = sy(t.y1);
        // (charging: a dashed thread of warning; on: a ray of soft light from lamp to lamp)
        if (t.on) { c.save(); c.globalCompositeOperation = 'lighter';
          if (t.on === 1) { const w = T * 0.16 * (0.9 + 0.2 * Math.sin(g.t * 40)); softRay(c, X, Y - T * 0.32, X1, Y1 - T * 0.32, w * 3.2, '#4DF0FF', 0.7); softRay(c, X, Y - T * 0.32, X1, Y1 - T * 0.32, w * 1.5, '#4DF0FF', 1, 0.4); }
          else { c.strokeStyle = 'rgba(77,240,255,.35)'; c.lineWidth = T * 0.05; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(X, Y - T * 0.32); c.lineTo(X1, Y1 - T * 0.32); c.stroke(); c.setLineDash([]); }
          c.restore(); }
        [[X, Y], [X1, Y1]].forEach(([px, py]) => { c.fillStyle = '#3A4466'; GFX.rr(c, px - T * 0.14, py - T * 0.62, T * 0.28, T * 0.66, T * 0.05); c.fill(); c.lineWidth = 1.5; c.strokeStyle = GFX.line; c.stroke(); c.fillStyle = t.on === 1 ? '#4DF0FF' : '#1C2438'; c.beginPath(); c.arc(px, py - T * 0.32, T * 0.07, 0, 6.283); c.fill();
          if (t.on === 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite('#4DF0FF'), px - T * 0.3, py - T * 0.62, T * 0.6, T * 0.6); c.restore(); } });
      }
    }
    function drawStone(c, s) {
      if (!isExp(s.x, s.y)) return;
      const T = Tz(), X = sx(s.x), Y = sy(s.y), P = POWERS[s.kind], bob = Math.sin(s.t * 2.6) * T * 0.08, r = T * 0.3;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.12, r * 0.9, r * 0.35, 0, 0, 6.283); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 + 0.25 * Math.sin(s.t * 5); const gs = T * 0.8; blitSized(c, glowSprite(P.color), X - gs, Y - T * 0.35 + bob - gs, gs * 2, gs * 2); c.restore();
      c.save(); c.translate(X, Y - T * 0.38 + bob); c.rotate(Math.sin(s.t * 1.3) * 0.2);
      c.beginPath(); for (let i = 0; i < 6; i++) { const aa = i / 6 * 6.283 - Math.PI / 2; c.lineTo(Math.cos(aa) * r, Math.sin(aa) * r * 1.25); } c.closePath();
      const gr = c.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.35, P.color); gr.addColorStop(1, shadeC(P.color, -0.45)); c.fillStyle = gr; c.fill(); c.lineWidth = 2; c.strokeStyle = GFX.line; c.stroke();
      c.globalAlpha = 0.9; drawGlyph(c, P.glyph, 0, 0, r * 1.3, 1); c.globalAlpha = 1;
      c.restore();
      if (hyp(me.x - s.x, me.y - s.y) < 3.5) GFX.textS(c, P.name, X, Y - T * 1.05 + bob, Math.max(10, Math.round(T * 0.28)), P.color);
      if (Math.random() < 0.08) part({ kind: 'star', x: s.x + (Math.random() - 0.5) * 0.6, y: s.y - 0.4 - Math.random() * 0.4, vx: 0, vy: -0.8, life: 0.7, max: 0.7, size: 3, color: P.color });
    }
    function drawMon(c, m) {
      const T = Tz(), X = sx(m.x), Yg = sy(m.y), r = m.r * T, z = (m.z || 0) * T;
      // shadow
      if (m.fobj) { if (FD) FD.drawObj(c, m, X, Yg); return; }
      if (!m.under && !m.fiend) { c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(X, Yg + r * 0.82, r * (0.95 - Math.min(0.4, (m.z || 0) * 0.15)), r * 0.3, 0, 0, 6.283); c.fill(); }
      if (m.fiend) { if (FD) FD.drawBoss(c, m, X, Yg); return; }
      if (m.boss) { drawBoss(c, m, X, Yg - z, r); return; }
      if (m.falling != null) { const u = 1 - m.falling / 0.55; c.save(); c.globalAlpha = 1 - u; c.translate(X, Yg + u * T * 0.8); c.scale(1 - u * 0.7, 1 - u * 0.7); c.rotate(u * 4); const s = DunArt.monSprite(m.type, m.r * TS * SK(), m.ph, m.color, '', false), k2 = g.zoom / SK(); c.drawImage(s.cv, -s.half * k2, -s.half * k2, s.half * 2 * k2, s.half * 2 * k2); c.restore(); return; }
      const lit = hyp(m.x - me.x, m.y - me.y) < 8;
      // aura for elites, and a purple flare while a monster winds up its ult
      if (m.elite) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 + 0.15 * Math.sin(g.t * 5); const col = AFFIXES[m.affixes[0]].color, s2 = r * 2.4; blitSized(c, glowSprite(col), X - s2, Yg - z - s2, s2 * 2, s2 * 2); c.restore(); }
      if (m.ultFx > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(0.7, m.ultFx) * (0.7 + 0.3 * Math.sin(g.t * 20)); const s2 = r * 2.6; blitSized(c, glowSprite('#E07BF0'), X - s2, Yg - z - s2, s2 * 2, s2 * 2); c.restore(); }
      if (m.hasted > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; const s2 = r * 1.8; blitSized(c, glowSprite('#B983F5'), X - s2, Yg - z - s2, s2 * 2, s2 * 2); c.restore(); }
      const mode = m.type === 'roller' && (m.act === 'roll' || m.act === 'curl') ? 'ball' : m.type === 'crab' && m.block > 0 ? 'block' : m.type === 'skull' && m.pile ? 'pile' : (typeof m.mode === 'string' ? m.mode : '');
      const s = DunArt.monSprite(m.type, m.r * TS * SK(), m.ph, m.color, mode, m.flash > 0 && !m.boss), k2 = g.zoom / SK();
      const squash = m.squash || 0, hs = m.hitSq * 0.18, bob = m.mv ? Math.sin(m.t * 3 + m.wob) * r * 0.12 : 0;
      const sxk = (1 + hs + squash * 0.25) * (m.face < 0 ? -1 : 1), syk = 1 - hs * 0.8 - squash * 0.2 + (m.type === 'blob' || m.type === 'jelly' ? Math.sin(m.t * 8) * 0.06 : 0);
      c.save(); c.translate(snX(X), snY(Yg - z + bob));
      if (mode === 'ball') c.rotate((m.spin || 0) * (m.rx >= 0 ? 1 : -1));
      if (m.type === 'knight' && m.act === 'spin') c.rotate(m.spinFx || 0);
      if (m.type === 'frost' && m.charge > 0) c.rotate((m.spinFx || 0));
      c.scale(sxk, syk);
      if (m.type === 'wisp' || m.type === 'gremlin' && m.life < 3 && Math.floor(g.t * 10) % 2) c.globalAlpha = m.type === 'wisp' ? 0.85 : 0.5;
      c.drawImage(s.cv, -s.half * k2, -s.half * k2, s.half * 2 * k2, s.half * 2 * k2);
      c.restore();
      if (m.elite) DunArt.crown(c, X, Yg - z - r * 1.05, r * 0.7);
      if (m.shield > 0) { c.save(); c.globalAlpha = 0.35 + 0.2 * (m.shield / m.shieldMax); c.strokeStyle = '#8FE3F0'; c.lineWidth = 2.5; c.beginPath(); c.arc(X, Yg - z, r * 1.3, 0, 6.283); c.stroke(); c.fillStyle = 'rgba(143,227,240,.15)'; c.fill(); c.restore(); }
      if (m.freeze > 0) {   // frozen: a block of ice round it, faceted, lit from within, a frost star over it
        const ix = X, iy = Yg - z - r * 0.1, R2 = r * 1.3; c.save(); c.globalAlpha = Math.min(1, m.freeze * 3);
        const ig = c.createLinearGradient(ix - R2, iy - R2, ix + R2, iy + R2); ig.addColorStop(0, 'rgba(230,250,255,.75)'); ig.addColorStop(0.5, 'rgba(160,220,245,.55)'); ig.addColorStop(1, 'rgba(90,170,220,.6)'); c.fillStyle = ig; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.lineJoin = 'round';
        c.beginPath(); [[-0.55, -1.15], [0.6, -1.05], [1.1, -0.3], [0.95, 0.75], [0.1, 1.1], [-0.9, 0.85], [-1.15, -0.2]].forEach(([px, py], i) => i ? c.lineTo(ix + px * R2, iy + py * R2) : c.moveTo(ix + px * R2, iy + py * R2)); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ix - R2 * 0.55, iy - R2 * 1.15); c.lineTo(ix - R2 * 0.1, iy - R2 * 0.2); c.lineTo(ix + R2 * 0.95, iy + R2 * 0.75); c.moveTo(ix - R2 * 0.1, iy - R2 * 0.2); c.lineTo(ix - R2 * 0.9, iy + R2 * 0.85); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(ix - R2 * 0.45, iy - R2 * 0.55, R2 * 0.22, R2 * 0.1, -0.6, 0, 6.283); c.fill();
        c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3 + g.t; c.beginPath(); c.moveTo(ix + Math.cos(a) * R2 * 0.25, iy - R2 * 1.5 + Math.sin(a) * R2 * 0.25); c.lineTo(ix - Math.cos(a) * R2 * 0.25, iy - R2 * 1.5 - Math.sin(a) * R2 * 0.25); c.stroke(); } c.restore(); }
      if (m.stun > 0 || m.act === 'dizzy') for (let i = 0; i < 3; i++) { const aa = g.t * 5 + i * 2.09; GFX.star(c, X + Math.cos(aa) * r * 0.8, Yg - z - r * 1.25 + Math.sin(aa) * r * 0.25, 4, '#FFE37A', 1.2); }
      if (m.chill > 0 && !m.freeze) { c.fillStyle = 'rgba(127,211,242,.25)'; c.beginPath(); c.arc(X, Yg - z, r * 1.05, 0, 6.283); c.fill(); }
      // a burning monster sheds embers ten times a second, whatever the frame rate (and none while the screen is already full of them)
      if (m.burn > 0 && g.t - (m.emberT || -1) > 0.1 && parts.length < 300) { m.emberT = g.t; part({ kind: 'ember', x: m.x + (Math.random() - 0.5) * m.r, y: m.y - m.r * 0.6, vx: 0, vy: -1.5, life: 0.35, max: 0.35, size: 3, color: '#FF9F43' }); }
      if (m.venom > 0) { c.fillStyle = '#9BE07A'; for (let i = 0; i < Math.min(3, m.venom); i++) { c.beginPath(); c.arc(X + (i - 1) * r * 0.5, Yg - z - r * 1.15 - Math.abs(Math.sin(g.t * 4 + i)) * 4, 2.6, 0, 6.283); c.fill(); } }
      if (m.type === 'gremlin') { const w = Math.max(28, r * 2.4); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(X - w / 2, Yg - z - r - 16, w, 5); c.fillStyle = '#9BD15E'; c.fillRect(X - w / 2 + 1, Yg - z - r - 15, (w - 2) * clamp(m.life / 15, 0, 1), 3); }
      if (m.hp < m.maxhp && lit && m.type !== 'gremlin') { const w = Math.max(22, r * 2); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(X - w / 2, Yg - z - r - 10, w, 5); c.fillStyle = m.elite ? '#FFD447' : m.pile ? '#EDE6D6' : '#FF5C5C'; c.fillRect(X - w / 2 + 1, Yg - z - r - 9, (w - 2) * Math.max(0, m.hp / m.maxhp), 3); }
      if (m.elite && lit && hyp(m.x - me.x, m.y - me.y) < 5.5) GFX.textS(c, m.ename, X, Yg - z - r - 22, 10, AFFIXES[m.affixes[0]].color);
    }
    function drawBoss(c, m, X, Y, r) {
      c.save();
      const sleeping = m.act === 'sleep';
      if (sleeping) c.globalAlpha = 0.85;
      const aura = glowSprite(m.glow || '#FF5C8A');
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = (sleeping ? 0.15 : 0.35) + 0.15 * Math.sin(g.t * 3); c.drawImage(aura, X - r * 2.2, Y - r * 2.2, r * 4.4, r * 4.4); c.globalAlpha = sleeping ? 0.85 : 1; c.globalCompositeOperation = 'source-over';
      if (m.phase >= 3) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.1 * Math.sin(g.t * 9); blitSized(c, glowSprite('#E07BF0'), X - r * 1.8, Y - r * 1.8, r * 3.6, r * 3.6); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      if (!(m.evil && !m.under && RiftEvil.draw(c, m, X, Y, r, g.t, me))) DunBoss.draw(c, m, X, Y, r, g.t, me, sx, sy, Tz(), true);
      if (m.flash > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28; blitSized(c, glowSprite('#FFFFFF'), X - r * 1.4, Y - r * 1.4, r * 2.8, r * 2.8); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      c.restore();
      if (sleeping) { const k2 = (g.t * 0.8) % 1; GFX.text(c, 'z', X + r * 0.6 + k2 * r * 0.4, Y - r * 1.2 - k2 * r * 0.6, Math.max(11, r * 0.5), 'rgba(255,255,255,' + (1 - k2).toFixed(2) + ')'); }
      if (m.stunT > 0 && m.act === 'stunned') for (let i = 0; i < 3; i++) { const aa = g.t * 5 + i * 2.09; GFX.star(c, X + Math.cos(aa) * r * 0.8, Y - r * 1.25 + Math.sin(aa) * r * 0.25, 5, '#FFE37A', 1.2); }
    }
    /* orbiting blades, chainsaws and guard orbs from power stones, and the frost aura */
    function drawPowers(c) {
      const P = g.pw, T = Tz(), X = sx(me.x), Y = sy(me.y - OY);
      if (P.frost) { const Rr = (3 + P.frost * 0.5) * T, X0 = sx(me.x), Y0 = sy(me.y), pul = 0.5 + 0.5 * Math.sin(g.t * 2.2);
        // (a soft breath of cold, no edge to it: a mist that thins away to nothing, brighter near the pet, a faint frosted
        // band where it fades, and a few ice glints turning in it)
        c.save(); c.translate(X0, Y0); c.scale(1, 0.72);
        const fg = c.createRadialGradient(0, 0, Rr * 0.05, 0, 0, Rr * 1.08); fg.addColorStop(0, `rgba(225,248,255,${0.3 + 0.06 * pul})`); fg.addColorStop(0.45, `rgba(165,224,248,${0.2 + 0.05 * pul})`); fg.addColorStop(0.8, `rgba(150,215,245,${0.11 + 0.04 * pul})`); fg.addColorStop(1, 'rgba(150,215,245,0)');
        c.fillStyle = fg; c.beginPath(); c.arc(0, 0, Rr * 1.08, 0, 6.283); c.fill();
        c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + g.t * 0.25 * (i % 2 ? 1 : -1), d = Rr * (0.35 + ((i * 37) % 50) / 100), tw = 0.5 + 0.5 * Math.sin(g.t * 3 + i * 1.7); c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d); c.rotate(g.t * 0.6 + i); c.globalAlpha = 0.25 + 0.45 * tw; c.strokeStyle = '#E8FAFF'; c.lineWidth = 1.2; const k = T * (0.09 + 0.05 * tw); c.beginPath(); for (let j = 0; j < 3; j++) { const b = j / 3 * Math.PI; c.moveTo(Math.cos(b) * k, Math.sin(b) * k); c.lineTo(-Math.cos(b) * k, -Math.sin(b) * k); } c.stroke(); c.restore(); }
        c.restore();
        if (Math.random() < 0.5) { const a = Math.random() * 6.283, d = Math.random() * (3 + P.frost * 0.5); part({ kind: 'snow', x: me.x + Math.cos(a) * d, y: me.y + Math.sin(a) * d * 0.72 - 1.2, vx: (Math.random() - 0.5) * 0.4, vy: 0.9, life: 1.2, max: 1.2, size: 1.6 + Math.random(), color: '#FFFFFF' }); } }
      if (P.swords) { const n = 2 + P.swords, rr = 1.35 * T; for (let i = 0; i < n; i++) { const aa = g.swordA + i * 6.283 / n, bx = X + Math.cos(aa) * rr, by = Y + Math.sin(aa) * rr; c.save(); c.translate(bx, by); c.rotate(aa + Math.PI / 2); blitSized(c, glowSprite('#CFE2FF'), -T * 0.5, -T * 0.5, T, T); c.fillStyle = '#E8EEF8'; c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -T * 0.42); c.lineTo(T * 0.09, -T * 0.1); c.lineTo(T * 0.09, T * 0.2); c.lineTo(-T * 0.09, T * 0.2); c.lineTo(-T * 0.09, -T * 0.1); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#F2C94C'; c.fillRect(-T * 0.16, T * 0.2, T * 0.32, T * 0.06); c.fillStyle = '#8C6450'; c.fillRect(-T * 0.04, T * 0.26, T * 0.08, T * 0.14); c.restore(); } }
      if (P.chainsaws) { const n = 1 + P.chainsaws, rr = 2.3 * T; for (let i = 0; i < n; i++) { const aa = -g.swordA * 0.8 + i * 6.283 / n, bx = X + Math.cos(aa) * rr, by = Y + Math.sin(aa) * rr, r = T * 0.5; c.strokeStyle = 'rgba(255,159,67,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X, Y); c.lineTo(bx, by); c.stroke(); c.save(); c.translate(bx, by); c.rotate(g.t * 25 * (i % 2 ? -1 : 1)); blitSized(c, glowSprite('#FF9F43'), -r * 1.6, -r * 1.6, r * 3.2, r * 3.2); c.beginPath(); for (let j = 0; j < 14; j++) { const a2 = j / 14 * 6.283, a3 = a2 + 0.22; c.lineTo(Math.cos(a2) * r, Math.sin(a2) * r); c.lineTo(Math.cos(a3) * r * 0.74, Math.sin(a3) * r * 0.74); } c.closePath(); c.fillStyle = '#C9D2DC'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = GFX.line; c.stroke(); c.fillStyle = '#FF6F59'; c.beginPath(); c.arc(0, 0, r * 0.3, 0, 6.283); c.fill(); c.stroke(); c.restore(); } }
      if (P.shieldorbs) { const n = 2 + P.shieldorbs, rr = 1.1 * T; for (let i = 0; i < n; i++) { const aa = g.swordA * 0.7 + i * 6.283 / n, bx = X + Math.cos(aa) * rr, by = Y + Math.sin(aa) * rr; blitSized(c, glowSprite('#8FE3F0'), bx - T * 0.4, by - T * 0.4, T * 0.8, T * 0.8); c.fillStyle = '#CFF7FF'; c.beginPath(); c.arc(bx, by, T * 0.11, 0, 6.283); c.fill(); c.strokeStyle = '#8FE3F0'; c.lineWidth = 2; c.stroke(); } }
    }
    /* the pet's face and pose this frame: its walk, a skill's lift of the arms, its wings' beat */
    function petLook() {
      const moving = !!((me.vx || me.vy) && !me.dead), PF = formOf(P), fl = !!(PF.x && PF.x.gold && PF.stage >= 7 && PF.x.leg && !me.dead);
      return { face: me.dead ? 'hurt' : me.hurtT < 0.4 ? 'hurt' : (g.won || me.lvFx > 0 || g.counterT > 0) ? 'happy' : 'normal',
        pose: { walk: me.bob, moving, t: g.t, cast: me.castT > 0 ? 1 - me.castT / (me.castM || 1) : 0, ult: !!me.castUlt, wingPh: me.wph || 0, wingAmp: moving ? 14 : fl ? 11 : 8 } };
    }
    let petSnapF = null;   // this frame's picture of the pet, while copies of it are out
    function drawPet(c) {
      const T = Tz(), X = sx(me.x), Y0 = sy(me.y), z = (me.z || 0) * T, h = T * 1.02 * SIZE * (g.pw.giant ? 1.35 : 1) * (g.petK || 1);
      // a Celestial six-star floats over its magic circle, here as in the room (the circle turning on the floor, its two
      // layers opposite ways, in the pet's light colour; drawn from pictures made once)
      const PF = formOf(P), LGc = PF.x && PF.x.gold && PF.stage >= 7 && PF.x.leg ? PF.x.leg : null, fl = LGc && !me.dead ? T * SIZE * (0.24 + 0.035 * Math.sin(g.t * 1.7)) : 0;
      if (LGc) {
        // (or its ring: smooth light, spiked metal or its element, turning faster)
        const RG2 = legRingOf(LGc, PF), sp2 = ringSpin(RG2.style, RG2.el), R2 = h * 1.25, m0 = c.getTransform(), px = R2 * 2 * Math.hypot(m0.a, m0.b), A = magicCircleCanvas(LGc.c, 'outer', px, RG2.style, RG2.el), B = magicCircleCanvas(LGc.c, 'inner', px, RG2.style, RG2.el);
        if (A && B) { c.save(); c.translate(X, Y0 + T * 0.18); c.scale(1, 0.34); c.globalAlpha = 0.86 + 0.14 * Math.sin(g.t * 1.96);
          c.save(); c.rotate(g.t * 6.283 / 28 * sp2); c.drawImage(A, -R2, -R2, R2 * 2, R2 * 2); c.restore();
          c.rotate(-g.t * 6.283 / 16 * sp2); c.drawImage(B, -R2, -R2, R2 * 2, R2 * 2); c.restore(); }
      }
      // a soft contact shadow that lifts with jumps, and the pet's element glowing faintly on the ground beneath it
      { const lift = Math.min(1, (z + fl) / (T * 1.2)), sr = T * 0.34 * SIZE * (1 - lift * 0.35); const sg = c.createRadialGradient(X, Y0 + T * 0.18, 0, X, Y0 + T * 0.18, sr * 1.4); sg.addColorStop(0, `rgba(0,0,0,${0.42 - lift * 0.2})`); sg.addColorStop(0.7, `rgba(0,0,0,${0.22 - lift * 0.12})`); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sg; c.beginPath(); c.ellipse(X, Y0 + T * 0.18, sr * 1.4, sr * 0.5, 0, 0, 6.283); c.fill();
        const EC = E8[party[cur].el].color; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 + 0.05 * Math.sin(g.t * 3); blitSized(c, glowSprite(EC), X - T * 0.9 * SIZE, Y0 + T * 0.18 - T * 0.4 * SIZE, T * 1.8 * SIZE, T * 0.8 * SIZE); c.restore(); }
      if (g.phoenixT > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const wg = Math.sin(g.t * 10) * 0.3, cy = Y0 - T * 0.45 - z, fadeP = Math.min(1, g.phoenixT * 2);
        const as = T * 1.7; c.globalAlpha = 0.55 * fadeP; blitSized(c, glowSprite('#FF9F43'), X - as, cy - as, as * 2, as * 2);
        [-1, 1].forEach(s => { for (let f = 0; f < 7; f++) { const u = f / 6, ang = -0.25 - u * 1.25 - wg * 0.35, len = T * (1.0 + 0.9 * Math.sin(0.3 + u * 2.6)), bx = X + s * T * 0.15, ex = bx + s * Math.cos(ang) * len * 1.25, ey = cy + Math.sin(ang) * len, L = hyp(ex - bx, ey - cy);
          c.save(); c.translate(bx, cy); c.rotate(Math.atan2(ey - cy, ex - bx)); c.globalAlpha = 0.7 * fadeP; blitSized(c, beamSprite(f % 2 ? '#FFB347' : '#FF6A3D'), -T * 0.1, -T * 0.2, L + T * 0.25, T * 0.4); c.globalAlpha = 0.55 * fadeP; blitSized(c, beamSprite('#FFE9A8'), -T * 0.05, -T * 0.06, L * 0.85, T * 0.12); c.restore(); } });
        c.restore(); }
      if (supernova > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; const s2 = T * (1 + (1 - supernova) * 2); blitSized(c, glowSprite('#FFE37A'), X - s2, Y0 - T * 0.5 - s2, s2 * 2, s2 * 2); c.restore(); }
      if (g.counterT > 0 || g.buff.fury > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.15 * Math.sin(g.t * 12); const s2 = h * 0.9; blitSized(c, glowSprite(g.counterT > 0 ? '#FFE37A' : '#FF5C5C'), X - s2, Y0 - h * 0.5 - s2, s2 * 2, s2 * 2); c.restore(); }
      const blink = me.inv > 0.08 && !me.dash && !me.dodge && !(g.cineT > 0) && !(AN && AN.S.circle) && Math.floor(g.t * 18) % 2 === 0 && g.shieldT <= 0;
      if (!blink) {
        let sxs = 1, sys = 1, rot = me.tilt;
        if (me.spin) sxs = Math.cos(g.t * 30);
        const moving = (me.vx || me.vy) && !me.dead, bob = moving ? Math.abs(Math.sin(me.bob)) * T * 0.06 : 0;
        if (moving) { const st2 = Math.sin(me.bob * 2) * 0.06; sxs *= 1 + st2; sys *= 1 - st2; } else { const br = Math.sin(g.t * 2.4) * 0.025; sxs *= 1 + br; sys *= 1 - br; }
        sxs *= 1 + me.sq * 0.12; sys *= 1 - me.sq * 0.1;
        if (me.dodge) rot = me.dodge.t / me.dodge.dur * 6.283 * (me.dodge.vx >= 0 ? 1 : -1);
        if (me.dead) rot = g.t * 4;
        // a six-star's lights circle it here too: drawn behind the pet on the far side of their rings, after it on the near
        // side (one small picture for each, laid down unturned)
        const NLt = PF.x && PF.x.gold && PF.x.leg && PF.x.lights ? (PF.x.lights >= 4 ? 4 : 2) : 0, LGeo = NLt ? legLightGeo(PF) : null, kU = NLt ? h / ((PF.legs.len || 0) + 9 + PF.body.h) : 0, baseY = Y0 + T * 0.18 - z - bob - fl;
        const lights = fr => { if (!NLt) return; const m1 = c.getTransform(), sc1 = Math.hypot(m1.a, m1.b);
          for (let i = 0; i < NLt; i++) { const ring = i >= 2 ? 1 : 0, [lx, ly, , front] = legLightAt(legLightPhase(i, g.t), LGeo.cy, LGeo.Rr, ring); if (front !== fr) continue;
            const rr = 15 * kU * (ring ? 0.78 : 1), im = legLightCanvas(PF.x.leg.c, rr * 2 * sc1); if (im) c.drawImage(im, X + (me.face < 0 ? -lx : lx) * kU - rr, baseY + ly * kU - rr, rr * 2, rr * 2); } };
        lights(false);
        // (in parts: feet stepping, arms swinging, lifted for a skill, the wings beating; when copies of the pet are out,
        // laid down from the one picture drawn for them all this frame)
        const L2 = petLook();
        api.pet(c, X, Y0 + T * 0.18 - z - bob - fl, h, { flip: me.face < 0, face: L2.face, sx: sxs, sy: sys, rot, rig: !me.dead, pose: L2.pose, snap: petSnapF });
        lights(true);
        if (me.chill > 0) { c.save(); c.globalAlpha = 0.3; c.fillStyle = '#9FD8F0'; c.beginPath(); c.ellipse(X, Y0 - h * 0.4 - z - fl, h * 0.45, h * 0.55, 0, 0, 6.283); c.fill(); c.restore(); }
      }
      if (g.shieldT > 0 || g.guardHP > 0) { const gr = g.shieldT > 0 ? 1 : 0.6, R2 = h * 0.85, bx = X, by = Y0 - h * 0.35, flick = g.shieldT > 0 && g.shieldT < 1.5 && Math.floor(g.t * 10) % 2 ? 0.45 : 1, col = g.shieldT > 0 && KIT.ult.tier ? '#FFE9A8' : '#8FE3F0';
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9 * gr * flick; const s2 = R2 / 0.86 * (1 + 0.03 * Math.sin(g.t * 6)); blitSized(c, shockSprite(col), bx - s2, by - s2, s2 * 2, s2 * 2);
        c.globalAlpha = 0.16 * gr; blitSized(c, glowSprite('#BFF4FF'), bx - R2, by - R2, R2 * 2, R2 * 2);
        c.globalAlpha = 0.65 * gr; const hs = R2 * 0.32; blitSized(c, glowSprite('#FFFFFF'), bx - R2 * 0.42 - hs, by - R2 * 0.5 - hs * 0.55, hs * 2, hs * 1.1); c.restore(); }
      if (P.stage >= 7 && (me.vx || me.vy) && Math.random() < 0.4) part({ kind: 'star', x: me.x - me.ax * 0.3, y: me.y - OY, vx: (Math.random() - 0.5), vy: -0.5, life: 0.5, max: 0.5, size: 3, color: '#FFE37A' });
    }
    function drawShots(c) {
      const T = Tz();
      for (const b of shots) {
        const E = EL(b.el), col = E.rainbow || b.style === 'laser' ? `hsl(${(b.t * 600 + b.x * 40) % 360},95%,65%)` : E.color, X = sx(b.x), Y = sy(b.y), r = Math.max(3, b.r * T), a = Math.atan2(b.vy, b.vx);
        blitSized(c, glowSprite(E.color), X - r * 3, Y - r * 3, r * 6, r * 6);
        c.save(); c.translate(X, Y); c.rotate(a);
        c.fillStyle = col; c.strokeStyle = E.core;
        switch (b.style) {
          case 'needle': case 'laser': { const L = b.style === 'laser' ? r * 6 : r * 5, hx = b.style === 'laser' || E.rainbow ? hueHex(b.t * 600 + b.x * 40) : E.color;   // (a bolt of soft light, bright down its middle)
            softRay(c, -L + r, 0, r * 0.4, 0, r * 2, hx, 1); softRay(c, -L * 0.7 + r * 0.3, 0, r * 0.6, 0, r * 0.8, E.core && E.core[0] === '#' ? E.core : '#FFFFFF', 1); break; }
          case 'dart': case 'bolt': c.beginPath(); c.moveTo(r * 1.8, 0); c.lineTo(-r * 1.6, -r * 0.8); c.lineTo(-r, 0); c.lineTo(-r * 1.6, r * 0.8); c.closePath(); c.fill(); c.fillStyle = E.core; c.beginPath(); c.arc(r * 0.3, 0, r * 0.45, 0, 6.283); c.fill(); break;
          case 'diamond': case 'crystal': c.rotate(b.t * 8); c.beginPath(); c.moveTo(r * 1.3, 0); c.lineTo(0, r * 0.8); c.lineTo(-r * 1.3, 0); c.lineTo(0, -r * 0.8); c.closePath(); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#FFFFFF'; c.stroke(); break;
          case 'spark': c.beginPath(); c.arc(0, 0, r * 0.9, 0, 6.283); c.fill(); break;
          case 'zap': c.lineWidth = 3; c.strokeStyle = col; c.beginPath(); c.moveTo(-r * 2, 0); c.lineTo(-r, -r * 0.8); c.lineTo(0, r * 0.6); c.lineTo(r * 1.4, -r * 0.4); c.stroke(); break;
          case 'bubble': c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fillStyle = 'rgba(255,255,255,.2)'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = col; c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, 6.283); c.fill(); break;
          case 'boom': case 'star': c.rotate(b.t * 16); if (b.style === 'star') { GFX.star(c, 0, 0, r * 1.25, col, 1.5); } else { c.lineWidth = 1.8; c.strokeStyle = GFX.line; c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, -r * 0.9, r, 0); c.quadraticCurveTo(0, -r * 0.3, -r, 0); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(r * 0.9, 0, 0, r); c.quadraticCurveTo(r * 0.3, 0, 0, -r); c.fill(); c.stroke(); } break;
          case 'leaf': c.rotate(b.t * 12); c.fillStyle = '#6CC15A'; c.beginPath(); c.ellipse(0, 0, r * 1.3, r * 0.6, 0, 0, 6.283); c.fill(); c.strokeStyle = '#E8FFC2'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.stroke(); break;
          case 'comet': case 'fireball': { c.globalAlpha = 0.9; blitSized(c, beamSprite(E.color), -r * 5.5, -r * 1.3, r * 6.4, r * 2.6); blitSized(c, beamSprite('#FFFFFF'), -r * 3.2, -r * 0.4, r * 3.8, r * 0.8); c.globalAlpha = 1; blitSized(c, glowSprite(E.color), -r * 1.6, -r * 1.6, r * 3.2, r * 3.2); c.fillStyle = E.core; c.beginPath(); c.arc(r * 0.15, 0, r * 0.6, 0, 6.283); c.fill(); break; }
          case 'crescent': { c.fillStyle = col; c.globalAlpha = 0.9; c.beginPath(); c.arc(0, 0, r * 1.4, -1.3, 1.3); c.arc(-r * 0.6, 0, r * 1.2, 1.1, -1.1, true); c.closePath(); c.fill(); c.fillStyle = E.core; c.beginPath(); c.arc(r * 0.2, 0, r * 1.1, -1.1, 1.1); c.arc(-r * 0.3, 0, r * 1.05, 0.95, -0.95, true); c.closePath(); c.fill(); c.globalAlpha = 1; break; }
          case 'lance5': case 'spear': { const L = b.style === 'lance5' ? 7 : 5; c.globalAlpha = 0.85; blitSized(c, beamSprite(E.color), -r * L * 1.1, -r * 1.6, r * L * 1.3, r * 3.2); c.globalAlpha = 1; c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(r * 1.6, 0); c.lineTo(-r * 0.3, -r * 0.55); c.lineTo(-r * L, 0); c.lineTo(-r * 0.3, r * 0.55); c.closePath(); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(r * 1.1, 0); c.lineTo(-r * 0.2, -r * 0.3); c.lineTo(-r * L * 0.9, 0); c.lineTo(-r * 0.2, r * 0.3); c.closePath(); c.fill(); if (b.style === 'lance5') { c.globalCompositeOperation = 'lighter'; blitSized(c, glowSprite('#FFFFFF'), -r * 2.5, -r * 2.5, r * 5, r * 5); } break; }
          case 'serpent': { c.rotate(-a); if (b.trail && b.trail.length > 1) { c.lineCap = 'round'; for (let k = 1; k < b.trail.length; k++) { const u = k / b.trail.length, p0 = b.trail[k - 1], p1 = b.trail[k]; c.strokeStyle = col; c.globalAlpha = u * 0.9; c.lineWidth = r * 2 * u; c.beginPath(); c.moveTo(sx(p0[0]) - X, sy(p0[1]) - Y); c.lineTo(sx(p1[0]) - X, sy(p1[1]) - Y); c.stroke(); } } c.globalAlpha = 1; c.rotate(a); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, r * 1.5, r, 0, 0, 6.283); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(r * 0.6, -r * 0.35, r * 0.25, 0, 6.283); c.arc(r * 0.6, r * 0.35, r * 0.25, 0, 6.283); c.fill(); c.strokeStyle = '#FF5C8A'; c.lineWidth = 2; c.beginPath(); c.moveTo(r * 1.4, 0); c.lineTo(r * 2.2, -r * 0.3); c.moveTo(r * 1.4, 0); c.lineTo(r * 2.2, r * 0.3); c.stroke(); break; }
          case 'shield': { c.fillStyle = col; c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.moveTo(r * 1.3, 0); c.lineTo(r * 0.4, -r); c.lineTo(-r * 0.9, -r * 0.8); c.lineTo(-r * 0.9, r * 0.8); c.lineTo(r * 0.4, r); c.closePath(); c.fill(); c.stroke(); break; }
          default: c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.fillStyle = E.core; c.beginPath(); c.arc(-r * 0.25, -r * 0.25, r * 0.45, 0, 6.283); c.fill();
        }
        c.restore();
      }
    }
    function drawEShots(c) {
      const T = Tz();
      for (const b of eshots) {
        const X = sx(b.x), Y = sy(b.y) - (b.z || 0) * T, r = Math.max(4, b.r * T), col = b.mine ? '#8FE3F0' : b.color;
        if (b.lob) { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, sy(b.y), r, r * 0.4, 0, 0, 6.283); c.fill(); }
        blitSized(c, glowSprite(col), X - r * 3, Y - r * 3, r * 6, r * 6);
        c.save(); c.translate(X, Y);
        const a = Math.atan2(b.vy, b.vx);
        switch (b.style) {
          case 'feather': c.rotate(a); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, r * 1.6, r * 0.55, 0, 0, 6.283); c.fill(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-r * 1.8, 0); c.lineTo(r * 1.4, 0); c.stroke(); break;
          case 'shard': c.rotate(a); c.fillStyle = '#E8F8FF'; c.beginPath(); c.moveTo(r * 1.8, 0); c.lineTo(-r, -r * 0.6); c.lineTo(-r * 0.6, 0); c.lineTo(-r, r * 0.6); c.closePath(); c.fill(); c.strokeStyle = '#7FD3F2'; c.lineWidth = 1.5; c.stroke(); break;
          case 'bone': c.rotate(b.t * 14); c.fillStyle = '#F4EEE0'; c.fillRect(-r * 1.2, -r * 0.25, r * 2.4, r * 0.5); [-1, 1].forEach(s => { c.beginPath(); c.arc(s * r * 1.2, -r * 0.3, r * 0.35, 0, 6.283); c.arc(s * r * 1.2, r * 0.3, r * 0.35, 0, 6.283); c.fill(); }); c.strokeStyle = GFX.line; c.lineWidth = 1.2; c.strokeRect(-r * 1.2, -r * 0.25, r * 2.4, r * 0.5); break;
          case 'halo': c.rotate(b.t * 10); c.lineWidth = r * 0.35; c.strokeStyle = '#FFE37A'; c.beginPath(); c.ellipse(0, 0, r, r * 0.45, 0, 0, 6.283); c.stroke(); c.lineWidth = r * 0.1; c.strokeStyle = '#FFFFFF'; c.stroke(); break;
          case 'fire': c.fillStyle = '#FF9F43'; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.55, 0, 6.283); c.fill(); if (Math.random() < 0.5) part({ kind: 'ember', x: b.x, y: b.y - (b.z || 0), vx: 0, vy: -1, life: 0.3, max: 0.3, size: 4, color: '#FF9F43' }); break;
          case 'spore': c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, 6.283); c.arc(r * 0.3, r * 0.2, r * 0.18, 0, 6.283); c.fill(); break;
          case 'bubble': c.fillStyle = 'rgba(191,239,255,.35)'; c.beginPath(); c.arc(0, 0, r * 1.1, 0, 6.283); c.fill(); c.strokeStyle = '#BFEFFF'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, 6.283); c.fill(); break;
          case 'gear': c.rotate(b.t * 12); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const aa = i / 8 * 6.283, a2 = aa + 0.39; c.lineTo(Math.cos(aa) * r * 1.3, Math.sin(aa) * r * 1.3); c.lineTo(Math.cos(a2) * r * 0.95, Math.sin(a2) * r * 0.95); } c.closePath(); c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.stroke(); c.fillStyle = '#5A4632'; c.beginPath(); c.arc(0, 0, r * 0.35, 0, 6.283); c.fill(); break;
          case 'yarn': c.rotate(b.t * 9); c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, r * 0.9, r * 0.35, 0.5, 0, 6.283); c.ellipse(0, 0, r * 0.9, r * 0.35, -0.9, 0, 6.283); c.stroke(); break;
          case 'bomb': c.fillStyle = '#2B2433'; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.strokeStyle = '#5E5A6A'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#7A7A8C'; c.fillRect(-r * 0.25, -r * 1.1, r * 0.5, r * 0.3); GFX.star(c, r * 0.4, -r * 1.4, r * 0.35 * (0.7 + 0.3 * Math.sin(g.t * 20)), '#FFE37A', 0); break;
          case 'rock': c.rotate(b.t * 5); c.fillStyle = col; c.beginPath(); c.moveTo(-r, -r * 0.4); c.lineTo(-r * 0.3, -r); c.lineTo(r * 0.7, -r * 0.7); c.lineTo(r, r * 0.2); c.lineTo(r * 0.3, r); c.lineTo(-r * 0.7, r * 0.6); c.closePath(); c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.stroke(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(-r * 0.3, -r * 0.35, r * 0.3, 0, 6.283); c.fill(); break;
          case 'arrow': c.rotate(a); c.strokeStyle = '#8C6450'; c.lineWidth = r * 0.5; c.beginPath(); c.moveTo(-r * 2.4, 0); c.lineTo(r * 1.2, 0); c.stroke(); c.fillStyle = '#E8EEF8'; c.beginPath(); c.moveTo(r * 2.2, 0); c.lineTo(r * 0.9, -r * 0.7); c.lineTo(r * 0.9, r * 0.7); c.closePath(); c.fill(); c.fillStyle = '#FF6F59'; c.beginPath(); c.moveTo(-r * 2.4, 0); c.lineTo(-r * 3, -r * 0.7); c.lineTo(-r * 1.8, 0); c.lineTo(-r * 3, r * 0.7); c.closePath(); c.fill(); break;
          default: c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.fillStyle = b.core || '#FFFFFF'; c.beginPath(); c.arc(-r * 0.25, -r * 0.25, r * 0.45, 0, 6.283); c.fill();
        }
        c.restore();
      }
    }
    function drawZones(c, enemyPass) {
      const T = Tz();
      for (const z of zones) {
        const X = sx(z.x), Y = sy(z.y), u = z.max ? clamp(1 - z.life / z.max, 0, 1) : 0;
        if (z.kind === 'warn') {
          if (enemyPass) continue;   // every warning is painted on the ground, under the pets and monsters, and kept faint
          if (z.own === 'pet') continue;   // (the pet's own attacks show no target marker: warnings are for dodging, and nobody dodges their own blow)
          const col = z.color || '#FF4D6D', pulse = 0.25 + 0.2 * Math.sin(g.t * 20);
          c.save(); c.globalAlpha = z.own === 'enemy' ? 0.4 : 0.6;
          if (z.shape === 'line') { c.translate(X, Y); c.rotate(z.a); c.fillStyle = hexA(col, 0.14 + u * 0.22); c.fillRect(0, -z.w * T / 2, z.len * T, z.w * T); c.strokeStyle = hexA(col, 0.6 + pulse); c.lineWidth = 2; c.setLineDash([8, 6]); c.strokeRect(0, -z.w * T / 2, z.len * T, z.w * T); c.setLineDash([]); c.fillStyle = hexA(col, 0.38); c.fillRect(0, -z.w * T / 2, z.len * T * u, z.w * T); for (let i = 1; i < 4; i++) { const ax = ((i / 4 + g.t * 0.8) % 1) * z.len * T; c.fillStyle = hexA('#FFFFFF', 0.35); c.beginPath(); c.moveTo(ax + 6, 0); c.lineTo(ax - 4, -z.w * T * 0.25); c.lineTo(ax - 4, z.w * T * 0.25); c.fill(); } }
          else if (z.shape === 'cone') { c.translate(X, Y); c.rotate(z.a); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, z.len * T, -z.spread, z.spread); c.closePath(); c.fillStyle = hexA(col, 0.15 + u * 0.28); c.fill(); c.strokeStyle = hexA(col, 0.75); c.lineWidth = 2; c.stroke(); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, z.len * T * u, -z.spread, z.spread); c.closePath(); c.fillStyle = hexA(col, 0.25); c.fill(); }
          else { c.beginPath(); c.arc(X, Y, z.r * T, 0, 6.283); c.fillStyle = hexA(col, 0.12 + u * 0.18); c.fill(); c.strokeStyle = hexA(col, 0.6 + pulse); c.lineWidth = 2.5; c.stroke(); c.beginPath(); c.arc(X, Y, z.r * T * u, 0, 6.283); c.fillStyle = hexA(col, 0.28); c.fill(); if (z.r > 1.6) { c.strokeStyle = hexA(col, 0.4); c.lineWidth = 1.5; c.beginPath(); c.arc(X, Y, z.r * T * 0.6, g.t * 3, g.t * 3 + 1.5); c.stroke(); c.beginPath(); c.arc(X, Y, z.r * T * 0.6, g.t * 3 + 3.14, g.t * 3 + 4.64); c.stroke(); } }
          c.restore();
          continue;
        }
        if (enemyPass) {
          if (z.kind === 'ring') { const seg = 6.283 / z.gaps; c.save(); c.globalAlpha = Math.min(1, z.life * 2); c.strokeStyle = z.color || '#FFB066'; c.lineWidth = z.w * 2 * T * 0.6; for (let i = 0; i < z.gaps; i++) { c.beginPath(); c.arc(X, Y, z.r * T, z.off + i * seg + seg * 0.3, z.off + (i + 1) * seg); c.stroke(); } c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; for (let i = 0; i < z.gaps; i++) { c.beginPath(); c.arc(X, Y, z.r * T, z.off + i * seg + seg * 0.3, z.off + (i + 1) * seg); c.stroke(); } c.restore(); }
          if (z.kind === 'sweep') { const age = z.max - z.life, on = age > z.warm; c.save(); c.translate(X, Y); c.rotate(z.a); const w = z.w * T; if (on) { softRay(c, 0, 0, z.len * T, 0, w * 2.6, '#FFE37A', 0.85); softRay(c, 0, 0, z.len * T, 0, w * 1.5, '#FFE37A', 1, 0.5); } else { c.fillStyle = hexA('#FFD447', 0.2 + age / z.warm * 0.25); c.fillRect(0, -w / 2, z.len * T, w); c.strokeStyle = hexA('#FFD447', 0.8); c.setLineDash([8, 6]); c.lineWidth = 2; c.strokeRect(0, -w / 2, z.len * T, w); c.setLineDash([]); } c.restore(); }
          if (z.kind === 'clone') { c.save(); c.globalAlpha = Math.min(1, z.life * 2) * 0.75; DunBoss.draw(c, Object.assign({}, g.boss || {}, { bk: F.bossKind, x: z.x, y: z.y, phase: 1, color: '#3B2F63' }), X, Y, (g.boss ? g.boss.r : 1) * T * 0.8, g.t, me, sx, sy, T); c.restore(); }
          continue;
        }
        if (z.kind === 'fire' || z.kind === 'efire') { const a2 = 0.32 * Math.min(1, z.life); c.save(); c.translate(X, Y); c.scale(1, 0.7); const gr = c.createRadialGradient(0, 0, 0, 0, 0, z.r * T); gr.addColorStop(0, z.kind === 'efire' ? `rgba(255,92,138,${a2})` : `rgba(255,190,90,${a2})`); gr.addColorStop(1, 'rgba(255,90,40,0)'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, z.r * T, 0, 6.283); c.fill(); c.restore(); }
        else if (z.kind === 'poison') { const pc = z.col ? hexRGB(z.col).join(',') : '155,224,122'; c.fillStyle = `rgba(${pc},${0.25 * Math.min(1, z.life)})`; c.beginPath(); c.ellipse(X, Y, z.r * T, z.r * T * 0.75, 0, 0, 6.283); c.fill(); c.strokeStyle = `rgba(${pc},.6)`; c.lineWidth = 2; c.stroke(); }
        else if (z.kind === 'stall') { const k = Math.min(1, z.life / 0.5, (z.max - z.life) / 0.25 + 0.2); c.save(); c.translate(X, Y); c.globalAlpha = 0.55 * k; c.fillStyle = 'rgba(169,181,197,.35)'; c.beginPath(); c.arc(0, 0, z.r * T, 0, 6.283); c.fill(); c.strokeStyle = '#E4EAF2'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(228,234,242,.8)'; for (let i = 0; i < 12; i++) { const aa = i / 12 * 6.283; c.beginPath(); c.moveTo(Math.cos(aa) * z.r * T * 0.82, Math.sin(aa) * z.r * T * 0.82); c.lineTo(Math.cos(aa) * z.r * T * 0.95, Math.sin(aa) * z.r * T * 0.95); c.stroke(); } c.lineWidth = 3; c.strokeStyle = '#8E6BD0'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -z.r * T * 0.6); c.moveTo(0, 0); c.lineTo(z.r * T * 0.4, 0); c.stroke(); c.restore(); }
        else if (z.kind === 'windlane') { const k = Math.min(1, z.life / 0.4, (z.max - z.life) / 0.3); c.save(); c.translate(X, Y); c.rotate(z.a); c.globalAlpha = 0.28 * k; c.fillStyle = '#CFF5E6'; c.fillRect(0, -z.w * T / 2, z.len * T, z.w * T); c.globalAlpha = 0.75 * k; c.strokeStyle = '#E8FFF6'; c.lineWidth = 2; const off = (g.t * 3) % 1.2; for (let d = off; d < z.len; d += 1.2) for (const yy of [-0.25, 0.25]) { c.beginPath(); c.moveTo(d * T, yy * z.w * T); c.lineTo((d + 0.5) * T, yy * z.w * T); c.lineTo((d + 0.35) * T, (yy - 0.12) * z.w * T); c.moveTo((d + 0.5) * T, yy * z.w * T); c.lineTo((d + 0.35) * T, (yy + 0.12) * z.w * T); c.stroke(); } c.restore(); }
        else if (z.kind === 'timefield') { const k = Math.min(1, z.life / 1.5, (z.max - z.life) / 0.3); c.save(); c.translate(X, Y); c.globalAlpha = 0.5 * k; const gr = c.createRadialGradient(0, 0, z.r * T * 0.2, 0, 0, z.r * T); gr.addColorStop(0, 'rgba(232,207,142,.05)'); gr.addColorStop(0.8, 'rgba(232,207,142,.22)'); gr.addColorStop(1, 'rgba(232,207,142,.45)'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, z.r * T, 0, 6.283); c.fill(); c.globalAlpha = 0.8 * k; c.strokeStyle = '#E8CF8E'; c.lineWidth = 3; c.stroke(); c.lineWidth = 2; for (let i = 0; i < 12; i++) { const aa = i / 12 * 6.283; c.beginPath(); c.moveTo(Math.cos(aa) * z.r * T * 0.88, Math.sin(aa) * z.r * T * 0.88); c.lineTo(Math.cos(aa) * z.r * T, Math.sin(aa) * z.r * T); c.stroke(); } c.strokeStyle = '#8E6BD0'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -z.r * T * 0.55); c.moveTo(0, 0); c.lineTo(z.r * T * 0.35, z.r * T * 0.1); c.stroke(); c.font = `800 ${Math.round(T * 0.5)}px ${arcFont}`; c.textAlign = 'center'; c.fillStyle = '#FFF4D0'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3; const s = Math.ceil(z.life) + 's'; c.strokeText(s, 0, -z.r * T * 0.7); c.fillText(s, 0, -z.r * T * 0.7); c.restore(); }
        else if (z.kind === 'ghost') { const k = Math.min(1, z.life / 0.3, (z.max - z.life) / 0.2); c.save(); c.globalAlpha = 0.45 * k; c.globalCompositeOperation = 'lighter'; blitSized(c, glowSprite(z.col || '#C9B0FF'), X - T * 0.9, Y - T * 1.6, T * 1.8, T * 1.8); c.restore(); c.save(); c.globalAlpha = (z.a || 0.4) * k; api.pet(c, X, Y + T * 0.18, TS * 0.9 * SIZE, { flip: (z.face || 1) < 0, face: 'normal' }); c.restore(); }
        else if (z.kind === 'web') { c.save(); c.translate(X, Y); c.globalAlpha = Math.min(1, z.life) * 0.85; c.strokeStyle = 'rgba(240,240,255,.8)'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i < 8; i++) { const aa = i / 8 * 6.283; c.moveTo(0, 0); c.lineTo(Math.cos(aa) * z.r * T, Math.sin(aa) * z.r * T * 0.8); } for (let k2 = 1; k2 <= 3; k2++) { c.moveTo(z.r * T * k2 / 3, 0); c.ellipse(0, 0, z.r * T * k2 / 3, z.r * T * 0.8 * k2 / 3, 0, 0, 6.283); } c.stroke(); c.fillStyle = 'rgba(240,240,255,.12)'; c.beginPath(); c.ellipse(0, 0, z.r * T, z.r * T * 0.8, 0, 0, 6.283); c.fill(); c.restore(); }
        else if (z.kind === 'evoid') { c.save(); c.translate(X, Y); c.fillStyle = `rgba(20,8,40,${0.6 * Math.min(1, z.life)})`; c.beginPath(); c.arc(0, 0, z.r * T, 0, 6.283); c.fill(); for (let i = 0; i < 3; i++) { c.rotate(-g.t * 3 + i); c.strokeStyle = 'rgba(176,124,240,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, (0.4 + i * 0.4) * T, 0, 3.5); c.stroke(); } c.restore(); }
        else if (z.kind === 'vortex') { c.save(); c.translate(X, Y); for (let i = 0; i < 3; i++) { c.rotate(g.t * 4 + i); c.strokeStyle = i % 2 ? 'rgba(176,124,240,.8)' : 'rgba(255,255,255,.6)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, (0.6 + i * 0.6) * T, 0, 4); c.stroke(); } c.fillStyle = '#0B0716'; c.beginPath(); c.arc(0, 0, 0.45 * T, 0, 6.283); c.fill(); c.restore(); }
      }
    }
    function drawLasers(c) {
      const T = Tz();
      for (const m of mons) {
        if (m.dead || !m.laser) continue;
        const L = m.laser, X = sx(m.x), Y = sy(m.y), len = L.len * T;
        c.save(); c.translate(X, Y); c.rotate(m.la);
        // (the aim's dashed line is the warning; the band round it, the lock's flashing and the fired ray are soft light)
        if (L.st === 'aim') { c.strokeStyle = 'rgba(255,77,109,.7)'; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke(); c.setLineDash([]); softRay(c, 0, 0, len, 0, 0.8 * T, '#FF4D6D', 0.22); }
        else if (L.st === 'lock') { const on = Math.floor(g.t * 20) % 2; softRay(c, 0, 0, len, 0, 0.8 * T, on ? '#FF4D6D' : '#FFFFFF', on ? 0.75 : 0.55); }
        else { c.globalCompositeOperation = 'lighter'; const w = 0.32 * T * (0.9 + 0.2 * Math.sin(g.t * 60)); softRay(c, 0, 0, len, 0, w * 3.4, '#FF5C8A', 0.75); softRay(c, 0, 0, len, 0, w * 1.7, '#FF5C8A', 1, 0.45); blitSized(c, glowSprite('#FF5C8A'), -w * 2, -w * 2, w * 4, w * 4); }
        c.restore();
      }
    }
    /* particles. The small, plain ones (sparks, stars, confetti, shards, petals, snow, bubbles) are gathered into batches
       by kind, colour and an alpha rounded to tenths (sparks by their width too, to half a pixel), and each batch is one
       path painted once; the rest are sprites
       or shapes of their own. Small particles off the screen are skipped. (Within the additive pass the order of drawing
       makes no difference; in the plain pass the batches simply land over the sprites.) */
    const ADD_PARTS = new Set(['spark', 'glow', 'ember', 'star', 'ghost', 'slash', 'meteorfall', 'pillar', 'beamfx', 'wind', 'flare']);
    const PX_PARTS = new Set(['spark', 'wind', 'ember', 'star', 'confetti', 'shard', 'petal', 'snow', 'bubble']), TILE_PARTS = new Set(['glow', 'ghost', 'smoke']);
    const STAR_U = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? 0.45 : 1; STAR_U.push([Math.cos(a) * k, Math.sin(a) * k]); }
    const partBatch = new Map();
    function drawParts(c, additive) {
      const T = Tz(), W = api.W, H = api.H, B = partBatch; B.clear();
      const put = (kind, color, w, a, item) => { const q = Math.round(a * 10) / 10; if (q <= 0) return; const key = kind + '|' + color + '|' + w + '|' + q; let b = B.get(key); if (!b) B.set(key, b = { kind, color, w, a: q, items: [] }); b.items.push(item); };
      for (const p of parts) {
        if (p.add == null) p.add = ADD_PARTS.has(p.kind);
        if (p.add !== additive) continue;
        const X = sx(p.x), Y = sy(p.y);
        if (PX_PARTS.has(p.kind) || TILE_PARTS.has(p.kind)) { const mg = T * 2 + (p.size || 0) * (TILE_PARTS.has(p.kind) ? T * 2 : 2); if (X < -mg || X > W + mg || Y < -mg || Y > H + mg) continue; }
        const a = clamp(p.life / p.max, 0, 1);
        switch (p.kind) {
          case 'spark': case 'wind': put('line', p.color, p.size == null ? null : Math.max(0.5, Math.round(p.size * 2) / 2), a, [X, Y, X - p.vx * T * 0.035, Y - p.vy * T * 0.035]); break;
          case 'star': put('star', p.color, 0, a, [X, Y, p.size]); break;
          case 'confetti': put('rect', p.color, 0, Math.min(1, a * 2), [X, Y, p.size, p.rot || 0]); break;
          case 'shard': put('shard', p.color, 0, a, [X, Y, p.size, p.rot || 0]); break;
          case 'petal': put('petal', p.color, 0, a, [X, Y, p.size, p.rot || 0]); break;
          case 'snow': put('dot', '#FFFFFF', 0, a, [X, Y, p.size]); break;
          case 'bubble': put('ring', p.color, 0, a, [X, Y, p.size]); break;
          case 'glow': { c.globalAlpha = a * (p.alpha || 1); const s = p.size * T * (1.4 - a * 0.4); blitSized(c, glowSprite(p.color), X - s, Y - s, s * 2, s * 2); break; }
          case 'ember': { c.globalAlpha = a; const s = p.size * (0.5 + a * 0.5); blitSized(c, glowSprite(p.color), X - s * 1.6, Y - s * 1.6, s * 3.2, s * 3.2); break; }
          case 'ghost': c.globalAlpha = a * 0.5; blitSized(c, glowSprite(p.color), X - T * 0.6, Y - T * 0.9, T * 1.2, T * 1.2); break;
          case 'slash': { c.globalAlpha = a; c.save(); c.translate(X, Y); c.rotate(p.a); c.strokeStyle = p.color; c.lineWidth = 7 * a + 2; c.beginPath(); c.arc(0, 0, p.r * T * 0.85, p.flip ? 0.9 : -0.9, p.flip ? -0.9 : 0.9, !!p.flip); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 3 * a; c.stroke(); c.restore(); break; }
          case 'beamfx': { c.globalAlpha = a; c.save(); c.translate(X, Y); c.rotate(p.a); const w = T * (p.w ? p.w * 0.45 : 0.5) * (0.4 + a * 0.6), col = p.color && p.color[0] === '#' ? p.color : '#FFFFFF'; blitSized(c, beamSprite(col), -w * 0.4, -w * 1.6, p.r * T + w, w * 3.2); blitSized(c, beamSprite('#FFFFFF'), -w * 0.2, -w * 0.45, p.r * T + w * 0.5, w * 0.9); c.restore(); break; }
          case 'pillar': { const w = p.size * T * (0.6 + (1 - a) * 0.4), col = p.color && p.color[0] === '#' ? p.color : '#FFE37A'; c.globalAlpha = a; c.save(); c.translate(X, Y + w * 0.3); c.rotate(-Math.PI / 2); blitSized(c, beamSprite(col), -w * 0.3, -w * 1.1, T * 8, w * 2.2); blitSized(c, beamSprite('#FFFFFF'), -w * 0.2, -w * 0.38, T * 7, w * 0.76); c.restore(); blitSized(c, glowSprite(col), X - w * 2, Y - w * 1.2, w * 4, w * 2.4); break; }
          case 'flare': { const s2 = p.size * T * (0.6 + (1 - a) * 0.6); c.globalAlpha = a; blitSized(c, flareSprite(p.color), X - s2, Y - s2, s2 * 2, s2 * 2); blitSized(c, glowSprite(p.color), X - s2 * 0.5, Y - s2 * 0.5, s2, s2); break; }
          case 'meteorfall': { const u = 1 - a, mx2 = X + (1 - u) * T * 3, my2 = Y - (1 - u) * T * 7, sz = Math.max(0.6, p.size); c.globalAlpha = 0.95; c.save(); c.translate(mx2, my2); c.rotate(Math.atan2(-7, 3)); blitSized(c, beamSprite('#FF7A3D'), -T * 0.25, -T * 0.55 * sz, T * 3.4, T * 1.1 * sz); blitSized(c, beamSprite('#FFE37A'), -T * 0.15, -T * 0.2 * sz, T * 2.2, T * 0.4 * sz); c.restore(); const s2 = T * (0.8 + sz * 0.5); blitSized(c, glowSprite('#FF9F43'), mx2 - s2, my2 - s2, s2 * 2, s2 * 2); const s3 = T * sz * 0.42; blitSized(c, glowSprite('#FFFFFF'), mx2 - s3, my2 - s3, s3 * 2, s3 * 2); break; }
          case 'smoke': { const s2 = p.size * T * (1.6 - a * 0.6) * 1.2; c.globalAlpha = a * a * 0.3; blitSized(c, puffSprite(p.color), X - s2, Y - s2, s2 * 2, s2 * 2); break; }
          case 'spike': { const u = 1 - a, h2 = p.size * T * Math.min(1, u * 5) * (u > 0.7 ? (1 - u) / 0.3 : 1);
            if (p.e8 && h2 > 1 && drawESpike(c, X, Y, T, h2, T * 0.46, p.e8, a, p.ph || 0, g.t)) { c.globalAlpha = 1; break; }   /* (Spike Bloom in its element's own material) */
            // every spike glows with its element at the root; fire ones burn: tongues of flame lick up the spike and off its tip
            c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * Math.min(1, a * 2); blitSized(c, glowSprite(p.color), X - T * 0.9, Y - T * 0.5, T * 1.8, T * 1.2); c.restore();
            c.globalAlpha = 1; c.fillStyle = p.el === 'fire' ? '#3A1A14' : p.color; c.strokeStyle = GFX.line; c.lineWidth = 2; c.beginPath(); c.moveTo(X - T * 0.18, Y); c.lineTo(X, Y - h2); c.lineTo(X + T * 0.18, Y); c.closePath(); c.fill(); c.stroke();
            if (p.el === 'fire' && h2 > 2) { const tt = g.t * 14 + (p.ph || 0); c.save(); c.globalCompositeOperation = 'lighter';
              for (let k = 0; k < 3; k++) { const fh = h2 * (0.9 + 0.35 * Math.sin(tt + k * 2.1)), fw = T * (0.22 - k * 0.05), sway = Math.sin(tt * 1.3 + k) * T * 0.08, col = k === 0 ? p.color : k === 1 ? '#FFB347' : '#FFF3B0'; c.globalAlpha = 0.85 - k * 0.15; c.fillStyle = col; c.beginPath(); c.moveTo(X - fw, Y); c.quadraticCurveTo(X - fw * 0.6 + sway, Y - fh * 0.55, X + sway * 1.6, Y - fh - T * 0.25 * (1 + k * 0.2)); c.quadraticCurveTo(X + fw * 0.6 + sway, Y - fh * 0.55, X + fw, Y); c.closePath(); c.fill(); }
              c.globalAlpha = 0.5; blitSized(c, glowSprite('#FFB347'), X - T * 0.5, Y - h2 - T * 0.6, T, T); c.restore(); }
            break; }
          case 'rockfall': case 'iciclefall': { const u = 1 - a, ry = Y - (1 - u) * T * 8; c.globalAlpha = 1; if (p.kind === 'iciclefall') { c.fillStyle = '#DDF6FF'; c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X - T * 0.15, ry - T * 0.5); c.lineTo(X + T * 0.15, ry - T * 0.5); c.lineTo(X, ry + T * 0.3); c.closePath(); c.fill(); c.stroke(); } else GFX.blob(c, X, ry, p.size * T * 0.6, p.color, 2); break; }
          case 'hand': { const u = 1 - a, h2 = T * Math.min(1, u * 4) * (u > 0.6 ? (1 - u) / 0.4 : 1); c.globalAlpha = 1; c.fillStyle = '#3B2F63'; c.strokeStyle = GFX.line; c.lineWidth = 2; c.beginPath(); c.moveTo(X - T * 0.3, Y); c.lineTo(X - T * 0.3, Y - h2 * 0.8); for (let i = 0; i < 4; i++) { const fx = X - T * 0.27 + i * T * 0.18; c.lineTo(fx, Y - h2 * (1 + (i === 1 || i === 2 ? 0.25 : 0.1))); c.lineTo(fx + T * 0.09, Y - h2 * 0.85); } c.lineTo(X + T * 0.3, Y); c.closePath(); c.fill(); c.stroke(); break; }
          case 'afterP': { c.globalAlpha = a * 0.45; c.save(); api.pet(c, X, Y + Tz() * 0.18, Tz() * 1.02 * SIZE, { flip: p.face < 0, alpha: a * 0.45, rot: p.rot }); c.restore(); break; }
          case 'afterM': { c.globalAlpha = a * 0.4; const s = DunArt.monSprite(p.m.type, p.m.r * TS * SK(), p.m.ph, p.m.color, '', false), k2 = g.zoom / SK(); c.drawImage(s.cv, X - s.half * k2, Y - s.half * k2, s.half * 2 * k2, s.half * 2 * k2); break; }
        }
      }
      // the batches: one path each
      B.forEach(b => {
        const it = b.items; c.globalAlpha = b.a; c.beginPath();
        switch (b.kind) {
          case 'line': for (const q of it) { c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); } c.strokeStyle = b.color; if (b.w != null) c.lineWidth = b.w; c.stroke(); break;
          case 'star': for (const q of it) { const s = q[2]; for (let i = 0; i < 10; i++) { const u = STAR_U[i]; i ? c.lineTo(q[0] + u[0] * s, q[1] + u[1] * s) : c.moveTo(q[0] + u[0] * s, q[1] + u[1] * s); } c.closePath(); } c.fillStyle = b.color; c.fill(); break;
          case 'rect': case 'shard': for (const q of it) { const s = q[2], co = Math.cos(q[3]), si = Math.sin(q[3]), P = b.kind === 'rect' ? [[-s / 2, -s / 4], [s / 2, -s / 4], [s / 2, s / 4], [-s / 2, s / 4]] : [[s, 0], [-s * 0.6, s * 0.5], [-s * 0.6, -s * 0.5]];
              P.forEach(([x, y], i) => { const X = q[0] + x * co - y * si, Y = q[1] + x * si + y * co; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); }
            c.fillStyle = b.color; c.fill(); break;
          case 'petal': for (const q of it) { const s = q[2]; c.moveTo(q[0] + Math.cos(q[3]) * s, q[1] + Math.sin(q[3]) * s); c.ellipse(q[0], q[1], s, s * 0.5, q[3], 0, 6.283); } c.fillStyle = b.color; c.fill(); break;
          case 'dot': for (const q of it) { c.moveTo(q[0] + q[2], q[1]); c.arc(q[0], q[1], q[2], 0, 6.283); } c.fillStyle = b.color; c.fill(); break;
          case 'ring': for (const q of it) { c.moveTo(q[0] + q[2], q[1]); c.arc(q[0], q[1], q[2], 0, 6.283); } c.strokeStyle = b.color; c.lineWidth = 1.5; c.stroke(); break;
        }
      });
      c.globalAlpha = 1;
    }
    /* the land's own drifting things (snow, leaves, sand, steam, embers, fireflies...): the plain ones gathered into a path
       for each colour and alpha (rounded to tenths), the glowing ones laid down as sprites together in one additive pass */
    const ambBatch = new Map();
    function drawAmbient(c) {
      const W = api.W, H = api.H, B = ambBatch; B.clear();
      const put = (kind, color, a, item) => { const q = Math.round(a * 10) / 10; if (q <= 0) return; const key = kind + '|' + color + '|' + q; let b = B.get(key); if (!b) B.set(key, b = { kind, color, a: q, items: [] }); b.items.push(item); };
      let glows = null;
      for (const p of amb) {
        const X = sx(p.x), Y = sy(p.y); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue;
        const a = clamp(Math.min(p.life, p.max - p.life) / 0.8, 0, 1);
        switch (p.kind) {
          case 'snow': put('dot', '#FFFFFF', 0.8 * a, [X, Y, p.size]); break;
          case 'leaf': case 'petal': put('ell', p.c, a, [X, Y, p.size, p.size * (p.kind === 'petal' ? 0.6 : 0.45), p.rot || 0]); break;
          case 'sand': case 'wind': put('line', p.kind === 'sand' ? '#FFF0C2' : '#FFFFFF', a * (p.kind === 'sand' ? 0.29 : 0.3), [X, Y, X - p.vx * 3, Y - p.vy * 3]); break;
          case 'steam': put('dot', '#F4F0E8', a * 0.22, [X, Y, p.size * (1 + (1 - a) * 0.8)]); break;
          case 'sparkles': put('star', '#FFE37A', a * (0.5 + 0.5 * Math.sin(g.t * 6 + p.ph)), [X, Y, p.size]); break;
          case 'embers': (glows = glows || []).push(['#FF9F43', a * (0.6 + 0.4 * Math.sin(g.t * 8 + p.ph)), X, Y, p.size * 2]); break;
          case 'goldmotes': (glows = glows || []).push(['#E8CF8E', a * (0.4 + 0.3 * Math.sin(g.t * 2 + p.ph)), X, Y, p.size * 2.4]); break;
          case 'greenflies': (glows = glows || []).push(['#7CFF6A', a * (0.55 + 0.45 * Math.sin(g.t * 2.6 + p.ph)), X, Y, p.size * 3.6]); break;
          case 'fireflies': (glows = glows || []).push(['#D8FF8A', a * (0.5 + 0.5 * Math.sin(g.t * 3 + p.ph)), X, Y, p.size * 3]); break;
          case 'wisps': (glows = glows || []).push(['#B07CF0', a * 0.6, X, Y, p.size * 2.5]); break;
          case 'motes': (glows = glows || []).push(['#7FD3F2', a * (0.4 + 0.4 * Math.sin(g.t * 4 + p.ph)), X, Y, p.size * 2.5]); break;
          default: put('dot', '#E8E0FF', a * 0.35, [X, Y, p.size]);
        }
      }
      B.forEach(b => {
        const it = b.items; c.globalAlpha = b.a; c.beginPath();
        if (b.kind === 'dot') { for (const q of it) { c.moveTo(q[0] + q[2], q[1]); c.arc(q[0], q[1], q[2], 0, 6.283); } c.fillStyle = b.color; c.fill(); }
        else if (b.kind === 'ell') { for (const q of it) { c.moveTo(q[0] + Math.cos(q[4]) * q[2], q[1] + Math.sin(q[4]) * q[2]); c.ellipse(q[0], q[1], q[2], q[3], q[4], 0, 6.283); } c.fillStyle = b.color; c.fill(); }
        else if (b.kind === 'line') { for (const q of it) { c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); } c.strokeStyle = b.color; c.lineWidth = 1.5; c.stroke(); }
        else if (b.kind === 'star') { for (const q of it) { const s2 = q[2]; for (let i = 0; i < 10; i++) { const u = STAR_U[i]; i ? c.lineTo(q[0] + u[0] * s2, q[1] + u[1] * s2) : c.moveTo(q[0] + u[0] * s2, q[1] + u[1] * s2); } c.closePath(); } c.fillStyle = b.color; c.fill(); }
      });
      if (glows) { c.globalCompositeOperation = 'lighter'; for (const [col, a, X, Y, s2] of glows) { if (a <= 0) continue; c.globalAlpha = a; blitSized(c, glowSprite(col), X - s2, Y - s2, s2 * 2, s2 * 2); } c.globalCompositeOperation = 'source-over'; }
      c.globalAlpha = 1;
      if (PB.storm && !F.fiend && !reduceMotion && (PB.storm !== 'sand' || g.stormK > 0.02)) drawStorm(c);
      else if (PB.haze && !F.fiend && !reduceMotion) drawStorm(c, PB.haze);   // (a land's own standing haze: the rift desert's warm dust)
    }
    /* the high lands' weather: a sandstorm or a whiteout drawn as drifting veils and long streaks over the whole screen */
    function drawStorm(c, haze) {
      const W = api.W, H = api.H, t = g.t, sand = !!haze || PB.storm === 'sand', col = haze ? haze.col : sand ? '201,160,90' : '225,235,245', dir = sand ? 1 : -1, SK = haze ? 1 : sand ? (g.stormK || 0) : 1;
      c.save(); c.globalAlpha = SK;
      // veils of blown dust or snow sweeping across (each painted only over the square it reaches)
      for (let i = 0; i < 4; i++) { const ph = ((t * (0.18 + i * 0.05) * dir) % 1 + 1) % 1, x = (ph * 1.6 - 0.3) * W, y = H * (0.15 + i * 0.22) + Math.sin(t * 0.7 + i) * H * 0.05, R = W * 0.5;
        const gr = c.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(${col},${haze ? haze.veil : sand ? 0.09 : 0.26})`); gr.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gr;
        const x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(W, x + R), y1 = Math.min(H, y + R); if (x1 > x0 && y1 > y0) c.fillRect(x0, y0, x1 - x0, y1 - y0); }
      // streaks along the wind
      c.strokeStyle = sand ? 'rgba(255,236,190,0.45)' : `rgba(${col},0.4)`; c.lineWidth = sand ? 1.3 : 1.6; c.lineCap = 'round'; c.beginPath();
      for (let i = 0; i < 22; i++) { const sp = 900 + (i % 5) * 160, x = (((i * 173) + t * sp * dir) % (W + 200) + W + 200) % (W + 200) - 100, y = (i * 97 + t * (sand ? 40 : 140)) % (H + 40) - 20, L = sand ? 70 + (i % 3) * 40 : 36 + (i % 3) * 20; c.moveTo(x, y); c.lineTo(x - L * dir, y + L * (sand ? 0.06 : 0.3)); }
      c.stroke();
      // the whole scene sits behind a thin tint and loses contrast at the edges (a picture at the screen's resolution)
      const dpr = arc.dpr || 1, fw = Math.round(W * dpr), fh = Math.round(H * dpr);
      if (stormHaze && stormHaze._col !== col) stormHaze = null; stormHaze = screenPic(stormHaze, fw, fh, (x, w, h) => { const vg = x.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.8); vg.addColorStop(0, `rgba(${col},0)`); vg.addColorStop(1, `rgba(${col},${haze ? haze.edge : sand ? 0.12 : 0.38})`); x.fillStyle = vg; x.fillRect(0, 0, w, h); });
      if (stormHaze) stormHaze._col = col; c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(stormHaze, 0, 0);
      if (haze && haze.tint) { c.fillStyle = `rgba(${col},${haze.tint})`; c.fillRect(0, 0, fw, fh); }   // (and a warm wash over all of it)
      c.restore();
    }
    /* one overlay, painted at half resolution and laid over the world in a single pass:
       darkness with holes for every light, fog over unexplored places, the land's colour grade, a vignette and red edges when hurt */
    let vig = null, vigFull = null, redFull = null, redHalf = null, feverFull = null, stormHaze = null;
    // a screen-sized picture at a given resolution, made once for that size and laid down as a plain copy
    // a Super Fiend fight on a device that has had to give up the fiend's light passes (its quality stepped down)
    const fiendLow = () => typeof DunFiend !== 'undefined' && DunFiend.KIT && DunFiend.KIT.qq() < 2;
    function screenPic(old, w, h, paint) { if (old && old.width === w && old.height === h) return old; const cv = old || document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d'), w, h); return cv; }
    const edgeGlow = (r, g2, b, k0, k1) => (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * (k0 || 0.3), w / 2, h / 2, Math.max(w, h) * (k1 || 0.75)); gr.addColorStop(0, `rgba(${r},${g2},${b},0)`); gr.addColorStop(1, `rgba(${r},${g2},${b},1)`); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
    // (a Super Fiend's arena brings its own light and colour: no land's colour grade over it)
    const vigPaint = (x, w, h) => { if (PB.grade && !F.fiend) { x.fillStyle = PB.grade; x.fillRect(0, 0, w, h); } const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${PB.out && !(F.dark > 0.3) ? 0.28 : 0.5})`); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
    // the holes the lights cut in the dark: a light's picture is made once at each size (sizes a fortieth apart, which the
    // eye cannot tell from the size asked for) and copied at whole pixels, several times cheaper than enlarging it each time
    const HOLES = new Map(); let holePx = 0;
    function holeSprite(s2) {
      // (sizes 4% apart: a flickering torch asks for few of them; one let go is emptied at once, not when the page next
      // tidies up: at the start of a floor these were tens of megabytes a second)
      const q = Math.round(Math.log(Math.max(1, s2)) / Math.log(1.04));
      let h = HOLES.get(q);
      if (h) { HOLES.delete(q); HOLES.set(q, h); return h; }
      const R = Math.max(1, Math.round(Math.pow(1.04, q))), cv = document.createElement('canvas'); cv.width = cv.height = R * 2;
      cv.getContext('2d').drawImage(lightSprite(), 0, 0, R * 2, R * 2);
      h = { cv, R }; HOLES.set(q, h); holePx += R * R * 4;
      while (holePx > 2.4e6 && HOLES.size > 1) { const k = HOLES.keys().next().value, o = HOLES.get(k); holePx -= o.R * o.R * 4; HOLES.delete(k); if (o !== h) o.cv.width = o.cv.height = 0; }
      return h;
    }
    const vigPaintD = (x, w, h) => { if (PB.grade) { x.fillStyle = PB.grade; x.fillRect(0, 0, w, h); } const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${PB.out && !(F.dark > 0.3) ? 0.28 : 0.5})`); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
    function drawOverlay(c) {
      const W = api.W, H = api.H, dpr = arc.dpr;
      const T = Tz(), hurtA = g.hurtV > 0 || (me.hp < ST.hp * 0.25 && !me.dead) ? Math.max(g.hurtV * 0.6, me.hp < ST.hp * 0.25 && !me.dead ? 0.22 + 0.1 * Math.sin(g.t * 6) : 0) : 0;
      // fog on screen?
      let fx0 = 1e9, fx1 = -1, fy0 = 1e9, fy1 = -1;
      if (!SKIP.fog) {
        const x0 = Math.max(0, Math.floor(cam.x - W / 2 / T) - 1), x1 = Math.min(MW - 1, Math.ceil(cam.x + W / 2 / T) + 1), y0 = Math.max(0, Math.floor(cam.y - H / 2 / T) - 1), y1 = Math.min(MH - 1, Math.ceil(cam.y + H / 2 / T) + 1);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!explored[ty * MW + tx]) { if (tx < fx0) fx0 = tx; if (tx > fx1) fx1 = tx; if (ty < fy0) fy0 = ty; if (ty > fy1) fy1 = ty; }
      }
      // in the open (an arena, a lit land) there is nothing to cut holes in: a little fog goes straight onto the screen,
      // and the vignette and the red edges are pictures at the screen's own resolution, copied straight over it. (A screen
      // much of it still in fog takes the half-resolution layer below instead: fog enlarged smoothly over most of the
      // screen costs more than that layer and its copy)
      const fogBig = fx1 >= 0 && !SKIP.fogDirect && (Math.min(MW - 1, fx1 + 1) - Math.max(0, fx0 - 1) + 1) * (Math.min(MH - 1, fy1 + 1) - Math.max(0, fy0 - 1) + 1) * T * T > W * H * 0.2;
      if (!(F.dark > 0 && !SKIP.light) && !fogBig) {
        if (fx1 >= 0) { fogSync(); const bx0 = Math.max(0, fx0 - 1), by0 = Math.max(0, fy0 - 1), bx1 = Math.min(MW - 1, fx1 + 1), by1 = Math.min(MH - 1, fy1 + 1);
          c.save(); c.imageSmoothingEnabled = true; c.globalAlpha = PB.out && !(F.dark > 0.3) ? 0.94 : 1;
          c.drawImage(fogC, bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1, sx(bx0), sy(by0), (bx1 - bx0 + 1) * T, (by1 - by0 + 1) * T); c.restore(); }
        const fw = Math.round(W * dpr), fh = Math.round(H * dpr);
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
        // (a Super Fiend's arena on a device that has had to give up the fiend's light passes goes without its vignette:
        // a copy of the whole screen every frame for a shadow in its corners)
        if (!SKIP.overlay && !(F.fiend && fiendLow())) { vigFull = screenPic(vigFull, fw, fh, vigPaint); c.drawImage(vigFull, 0, 0); }
        if (hurtA > 0) { redFull = screenPic(redFull, fw, fh, edgeGlow(255, 40, 70)); c.globalAlpha = Math.min(1, hurtA); c.drawImage(redFull, 0, 0); }
        c.restore(); return;
      }
      if (!lc) { lc = document.createElement('canvas'); lx = lc.getContext('2d'); }
      const cw = Math.ceil(W * dpr / 2), ch = Math.ceil(H * dpr / 2);
      if (lc.width !== cw || lc.height !== ch) { lc.width = cw; lc.height = ch; }
      const k3 = cw / W;
      lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.globalAlpha = 1;
      lx.clearRect(0, 0, cw, ch);
      if (F.dark > 0 && !SKIP.light) {
        lx.fillStyle = `rgba(${PB.darkRGB || DARK_COL[F.biome] || '4,3,12'},${F.dark})`; lx.fillRect(0, 0, cw, ch);
        lx.globalCompositeOperation = 'destination-out';
        const put = (x, y, r, a) => { const s2 = r * T * k3, X = sx(x) * k3, Y = sy(y) * k3; if (s2 < 1 || X + s2 < 0 || Y + s2 < 0 || X - s2 > cw || Y - s2 > ch) return; const h = holeSprite(s2); lx.globalAlpha = a; lx.drawImage(h.cv, dpr >= 1.5 ? Math.round(X - h.R) : X - h.R, dpr >= 1.5 ? Math.round(Y - h.R) : Y - h.R); };
        const pr = (g.phoenixT > 0 ? 7.5 : 6.2) * (0.92 + 0.08 * SIZE);
        put(me.x, me.y - 0.3, pr, 1); put(me.x, me.y - 0.3, 3, 0.6);
        for (const t of M.lights) { if (Math.abs(t.x - cam.x) > 14 || Math.abs(t.y - cam.y) > 18) continue; const f = 0.9 + 0.1 * Math.sin(g.t * 11 + t.ph); put(t.x, t.y + (t.kind === 'torch' ? 0.4 : -0.3), t.r * f, 0.85); }
        for (const l of lights) put(l.x, l.y, l.r, clamp(l.life / l.max, 0, 1));
        // (green fireflies light the night sand about them)
        for (const p of amb) if (p.kind === 'greenflies') { const a = clamp(Math.min(p.life, p.max - p.life) / 0.8, 0, 1) * (0.55 + 0.45 * Math.sin(g.t * 2.6 + p.ph)); if (a > 0.08) put(p.x, p.y, 1.7, 0.55 * a); }
        for (const s2 of shrines) if (!s2.used && Math.abs(s2.x - cam.x) < 14 && Math.abs(s2.y - cam.y) < 18) put(s2.x, s2.y - 1, 2.6, 0.7);
        if (g.boss && !g.boss.dead) put(g.boss.x, g.boss.y, 3.2, 0.7);
        // an Anima is a creature of the heavens: its own light keeps the whole of it out of the dark
        if (AN && AN.S && AN.S.list) for (const a of AN.S.list) if (a.alpha > 0.05 && !(a.delay > 0)) { const k = a.st === 'awaken' ? 3 : a.k, R = ANIMA_SIZE[k] * (a.id === 'ophiuchus' ? OPH_BIG * 1.9 : 1.2); put(a.x, a.y - R * 0.35, R, 0.8 * a.alpha); }
        for (const m of mons) if (!m.dead && m.laser && m.laser.st === 'fire') put(m.x + Math.cos(m.la) * 3, m.y + Math.sin(m.la) * 3, 4, 0.8);
        for (const s2 of stones) if (!s2.got && Math.abs(s2.x - cam.x) < 14 && Math.abs(s2.y - cam.y) < 18) put(s2.x, s2.y - 0.3, 2.2, 0.6);
        for (const t2 of traps) if (t2.kind === 'fence' && t2.on === 1 && Math.abs(t2.x - cam.x) < 14 && Math.abs(t2.y - cam.y) < 18) put((t2.x + t2.x1) / 2, (t2.y + t2.y1) / 2, 3, 0.5);
        lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over';
      }
      // fog over what hasn't been explored yet (only the part on screen)
      if (!SKIP.fog) {
        let bx0 = fx0, bx1 = fx1, by0 = fy0, by1 = fy1;
        if (bx1 >= 0) {
          fogSync();
          bx0 = Math.max(0, bx0 - 1); by0 = Math.max(0, by0 - 1); bx1 = Math.min(MW - 1, bx1 + 1); by1 = Math.min(MH - 1, by1 + 1);
          lx.imageSmoothingEnabled = true; lx.globalAlpha = PB.out && !(F.dark > 0.3) ? 0.94 : 1;
          lx.drawImage(fogC, bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1, sx(bx0) * k3, sy(by0) * k3, (bx1 - bx0 + 1) * T * k3, (by1 - by0 + 1) * T * k3);
          lx.globalAlpha = 1;
        }
      }
      // (the land's colour grade and the vignette: a picture at the layer's own resolution, laid down as a plain copy)
      if (!SKIP.overlay) { vig = screenPic(vig, cw, ch, F.fiend ? vigPaint : vigPaintD); lx.drawImage(vig, 0, 0); }
      if (hurtA > 0) { redHalf = screenPic(redHalf, cw, ch, edgeGlow(255, 40, 70)); lx.globalAlpha = Math.min(1, hurtA); lx.drawImage(redHalf, 0, 0); lx.globalAlpha = 1; }
      // the layer is all soft gradients, so on a sharp screen it is blown up to full size pixel for pixel, square by square
      // (each half-resolution pixel is a square of four, half a point across: a smoothed enlargement looks the same but
      // costs several times as much where the drawing is not done by the graphics chip)
      c.save(); if (dpr >= 1.5) c.imageSmoothingEnabled = false; c.drawImage(lc, 0, 0, W, H); c.restore();
    }
    // the HUD's parts that look the same frame after frame (a button's face, the stick, the glows round them), kept as
    // pictures at the screen's resolution and laid down at whole pixels: a gradient disc, a glyph or an enlarged glow costs
    // far more to paint than to copy
    const HUD_PICS = new Map();
    function hudPic(key, w, h, paint) {
      const k = arc.dpr || 1, kk = key + '@' + k; let p = HUD_PICS.get(kk);
      if (p) return p;
      const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k));
      const x = cv.getContext('2d'); x.scale(k, k); paint(x, cv.width / k, cv.height / k);
      p = { cv, w: cv.width / k, h: cv.height / k }; HUD_PICS.set(kk, p);
      if (HUD_PICS.size > 96) HUD_PICS.delete(HUD_PICS.keys().next().value);
      return p;
    }
    // a kept picture laid down with its centre at x, y, its pixels on the screen's
    function blitC(c, p, x, y) {
      const M = c.getTransform(), k = M.a;
      if (M.b || M.c || k !== M.d || !(k >= 1.5)) { c.drawImage(p.cv, x - p.w / 2, y - p.h / 2, p.w, p.h); return; }
      c.drawImage(p.cv, (Math.round((x - p.w / 2) * k + M.e) - M.e) / k, (Math.round((y - p.h / 2) * k + M.f) - M.f) / k, p.w, p.h);
    }
    // a glow (or a shockwave's ring) of a given size, kept: sizes that pulse are kept a twentieth of the button apart
    const glowPic = (sprite, col, s) => hudPic('glow|' + sprite.name + '|' + col + '|' + s, s * 2, s * 2, (x, w) => x.drawImage(sprite(col), 0, 0, w, w));
    function drawHUD(c) {
      const W = api.W, H = api.H, HPF = g.prof && g.profHud ? profPieces(c) : null;
      const x0 = 10, y0 = 10, bw = Math.min(150, W * 0.4);
      c.fillStyle = 'rgba(12,9,26,.72)'; GFX.rr(c, x0 - 4, y0 - 4, bw + 52, 52, 12); c.fill();
      // (the level's badge, a gradient disc and two words, kept as a picture for each level once the display font is in)
      { const lvl = P.dlv || 1, fs = lvl > 99 ? 11 : 15, badge = x => { GFX.blob(x, 22, 22, 18, '#FFD447', 2.5); x.fillStyle = '#2B2433'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 ${fs}px ${arcFont}`; x.fillText(String(lvl), 22, 19); x.font = `800 8px ${arcFont}`; x.fillText('LV', 22, 32); };
        if (GFX.fontIn(`800 ${fs}px ${arcFont}`) && GFX.fontIn(`800 8px ${arcFont}`)) blitC(c, hudPic('lvBadge|' + lvl, 44, 44, badge), x0 + 18, y0 + 22); else { c.save(); c.translate(x0 - 4, y0); badge(c); c.restore(); } }
      const bx = x0 + 42;
      const bar = (y, h, v, max, col, col2, label, trail) => { c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, bx, y, bw, h, h / 2); c.fill(); if (trail != null && trail > v / max) { c.fillStyle = 'rgba(255,255,255,.75)'; GFX.rr(c, bx, y, Math.max(h, bw * clamp(trail, 0, 1)), h, h / 2); c.fill(); } const w = Math.max(0, bw * clamp(v / max, 0, 1)); if (w > 1) { const gr = c.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, col2); gr.addColorStop(1, col); c.fillStyle = gr; GFX.rr(c, bx, y, Math.max(h, w), h, h / 2); c.fill(); } if (label) GFX.labelS(c, label, bx + 6, y + h / 2 + 0.5, 10, 800, '#FFFFFF', 'rgba(0,0,0,.6)', 3, 'left'); };
      bar(y0 + 1, 15, me.hp, ST.hp, '#E0344F', '#FF7A8A', `HP ${Math.ceil(me.hp)} / ${ST.hp}`, g.hpShow);
      if (g.guardHP > 0) { c.fillStyle = 'rgba(143,227,240,.85)'; GFX.rr(c, bx, y0 + 1, Math.max(6, bw * clamp(g.guardHP / ST.hp, 0, 1)), 4, 2); c.fill(); }
      bar(y0 + 20, 13, me.mp, ST.mp, '#2F6FE0', '#7FB6FF', `MP ${Math.floor(me.mp)} / ${ST.mp}`);
      bar(y0 + 37, 5, P.dxp || 0, dunXpNeed(P.dlv || 1), '#E8B425', '#FFE37A', '');
      drawParty(c, x0, y0, bw); if (HPF) HPF('hud:top');
      if (teamOk()) { const tb = btnTeam(); c.save(); c.fillStyle = 'rgba(12,9,26,.72)'; c.beginPath(); c.arc(tb.x, tb.y, tb.r, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke();
        // (two little figures, the party)
        c.fillStyle = '#FFFFFF'; [[-5, 0.85], [5, 1]].forEach(([dx, k]) => { c.globalAlpha = k; c.beginPath(); c.arc(tb.x + dx, tb.y - 4, 3.6, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(tb.x + dx, tb.y + 6, 5.6, 4.2, 0, Math.PI, 0); c.fill(); }); c.globalAlpha = 1;
        c.font = `800 8px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'top'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('TEAM', tb.x, tb.y + tb.r + 2); c.fillText('TEAM', tb.x, tb.y + tb.r + 2); c.restore(); }
      // power-ups from shrines and perfect dodges
      let bxx = x0 - 2; const py0 = party.length > 1 ? 40 : 0;
      const chip = (col, label, t, max) => { c.fillStyle = 'rgba(12,9,26,.72)'; GFX.rr(c, bxx, y0 + 52 + py0, 62, 18, 9); c.fill(); c.fillStyle = col; GFX.rr(c, bxx + 2, y0 + 64 + py0, 58 * clamp(t / max, 0, 1), 3, 1.5); c.fill(); c.font = `800 9px ${arcFont}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(label, bxx + 7, y0 + 59.5 + py0); bxx += 66; };
      for (const b of SHRINE_KEYS) if (g.buff[b] > 0) chip(SHRINES[b].color, SHRINES[b].name.toUpperCase(), g.buff[b], SHRINES[b].t);
      if (g.counterT > 0) chip('#FFE37A', 'COUNTER', g.counterT, 2.6);
      if (g.bloodT > 0) chip('#FF4D6D', 'BLOOD MOON', g.bloodT, 12);
      // power stones carried this floor
      { let px = x0 - 2, py = y0 + (bxx > x0 - 2 ? 76 : 52) + py0; const keys = Object.keys(g.pw); for (const k2 of keys) { const P = POWERS[k2]; if (px + 24 > W - 110) { px = x0 - 2; py += 26; } c.fillStyle = 'rgba(12,9,26,.72)'; GFX.rr(c, px, py, 22, 22, 7); c.fill(); c.strokeStyle = P.color; c.lineWidth = 1.5; c.stroke(); drawGlyph(c, P.glyph, px + 11, py + 11, 15, 1); if (g.pw[k2] > 1) { c.font = `800 8px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.color; c.fillText('×' + g.pw[k2], px + 17, py + 17); } px += 25; } }
      if (HPF) HPF('hud:chips');
      // minimap
      const mm = Math.min(88, W * 0.24), cell = mm / 26, mx0 = W - mm - 10, my0 = 10, cxm = Math.floor(me.x), cym = Math.floor(me.y);
      c.fillStyle = 'rgba(12,9,26,.72)'; GFX.rr(c, mx0 - 4, my0 - 4, mm + 8, mm + 8, 10); c.fill();
      c.save(); c.beginPath(); c.rect(mx0, my0, mm, mm); c.clip();
      // the explored ground: one picture of the whole floor, a cell a tile, added to as tiles are explored; the window round
      // the pet is cut out of it
      { const k = arc.dpr || 1, cpx = cell * k;
        const tile = i => { const t = G[i]; if (!T_WALK[t]) return; const tx = i % MW, ty = (i - tx) / MW, X0 = Math.round(tx * cpx), Y0 = Math.round(ty * cpx); miniMap.x.fillStyle = t === T_BRIDGE ? 'rgba(232,180,120,.6)' : 'rgba(200,190,240,.45)'; miniMap.x.fillRect(X0, Y0, Math.round((tx + 1) * cpx) - X0, Math.round((ty + 1) * cpx) - Y0); };
        if (!miniMap || miniMap.cpx !== cpx || miniNew.full) {
          const cv = (miniMap && miniMap.cv) || document.createElement('canvas'); cv.width = Math.ceil(MW * cpx); cv.height = Math.ceil(MH * cpx);
          miniMap = { cv, x: cv.getContext('2d'), cpx }; miniNew.length = 0; miniNew.full = false;
          for (let i = 0; i < MW * MH; i++) if (explored[i]) tile(i);
        } else if (miniNew.length) { for (const i of miniNew) tile(i); miniNew.length = 0; }
        // the window, clipped to the picture (a window reaching past the floor's edge shows nothing there)
        const sc = mm / (26 * cpx); let sx0 = (cxm - 13) * cpx, sy0 = (cym - 13) * cpx, sw = 26 * cpx, sh = 26 * cpx, dx = mx0, dy = my0;
        if (sx0 < 0) { dx -= sx0 * sc; sw += sx0; sx0 = 0; } if (sy0 < 0) { dy -= sy0 * sc; sh += sy0; sy0 = 0; }
        sw = Math.min(sw, miniMap.cv.width - sx0); sh = Math.min(sh, miniMap.cv.height - sy0);
        if (sw > 0 && sh > 0) c.drawImage(miniMap.cv, sx0, sy0, sw, sh, dx, dy, sw * sc, sh * sc); }
      const left = mons.filter(m => !m.dead);
      for (const s of shrines) if (!s.used && isExp(s.x, s.y)) { c.fillStyle = SHRINES[s.kind].color; c.beginPath(); c.arc(mx0 + (s.x - cxm + 13) * cell, my0 + (s.y - cym + 13) * cell, 3, 0, 6.283); c.fill(); }
      // the monsters within the map's window, a path for each kind of dot
      { const dots = new Map(), small = left.length <= 6;
        for (const m of left) { if (Math.abs(m.x - cxm) > 14 || Math.abs(m.y - cym) > 14) continue; const col = m.boss ? '#FF5C5C' : m.type === 'gremlin' ? '#9BD15E' : m.elite ? '#FFD447' : '#FF7A8A', r = m.boss ? 4 : m.type === 'gremlin' ? 3.4 : small ? 2.6 : 1.8, key = col + r;
          let d = dots.get(key); if (!d) dots.set(key, d = { col, r, pts: [] }); d.pts.push(mx0 + (m.x - cxm + 13) * cell, my0 + (m.y - cym + 13) * cell); }
        dots.forEach(d => { c.fillStyle = d.col; c.beginPath(); for (let i = 0; i < d.pts.length; i += 2) { c.moveTo(d.pts[i] + d.r, d.pts[i + 1]); c.arc(d.pts[i], d.pts[i + 1], d.r, 0, 6.283); } c.fill(); }); }
      if (RIFT) { const marks = []; if (RIFT.exit) marks.push([RIFT.exit.x, RIFT.exit.y, RIFT.done ? '#8FE0A6' : 'rgba(143,224,166,.45)', true]); const h = RIFT.hintObj && RIFT.hintObj(); if (h) marks.push([h.x, h.y, '#FFE37A', false]);
        marks.forEach(([wx, wy, col, door]) => { let px = (wx - cxm + 13) * cell, py = (wy - cym + 13) * cell; const edge = px < 4 || py < 4 || px > mm - 4 || py > mm - 4; px = Math.max(5, Math.min(mm - 5, px)); py = Math.max(5, Math.min(mm - 5, py)); c.save(); c.translate(mx0 + px, my0 + py); c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; if (door) { GFX.rr(c, -4, -5, 8, 10, 2); c.fill(); c.stroke(); } else { c.rotate(g.t * 3); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? 2 : 5; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); } if (edge) { c.globalAlpha = 0.5 + 0.5 * Math.sin(g.t * 8); c.beginPath(); c.arc(0, 0, 7, 0, 6.283); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke(); } c.restore(); }); }
      for (const s2 of stones) if (!s2.got && isExp(s2.x, s2.y)) { c.fillStyle = POWERS[s2.kind].color; c.beginPath(); c.arc(mx0 + (s2.x - cxm + 13) * cell, my0 + (s2.y - cym + 13) * cell, 2.6, 0, 6.283); c.fill(); }
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(mx0 + 13 * cell + (me.x - cxm) * cell, my0 + 13 * cell + (me.y - cym) * cell, 3, 0, 6.283); c.fill();
      c.restore(); if (HPF) HPF('hud:map');
      const bossUp = g.boss && !g.boss.dead, sleeping = bossUp && g.boss.act === 'sleep';
      if ((!bossUp || sleeping) && left.length && (sleeping || left.length <= 8) && !left.some(m => !m.boss && Math.abs(sx(m.x) - W / 2) < W / 2 && Math.abs(sy(m.y) - H / 2) < H / 2)) {
        const t = sleeping ? g.boss : g.gremlin && !g.gremlin.dead ? g.gremlin : nearestMon(me.x, me.y, 99); if (t) { const a = Math.atan2(t.y - me.y, t.x - me.x), rr = Math.min(W, H) * 0.36; c.save(); c.translate(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); c.rotate(a); c.globalAlpha = 0.65 + 0.3 * Math.sin(g.t * 6); c.fillStyle = t.boss ? '#FF5C5C' : t.type === 'gremlin' ? '#9BD15E' : '#FF7A8A'; c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -10); c.lineTo(-3, 0); c.lineTo(-8, 10); c.closePath(); c.fill(); c.restore(); c.globalAlpha = 1; }
      }
      if (FD) FD.drawHud(c, W);
      // (the bar follows the floor's boss once it is up; before that, a mini boss that has noticed the pet: a rift dungeon's
      // Rift-touched Cocopet, a key keeper, a roamer; the nearest of them. Brutes are monsters and have none)
      let BB = bossUp && !sleeping && g.bossIntro <= 2.2 ? g.boss : null;
      if (!BB && !bossUp) { let bd = 15; for (const m of mons) if (m.lesser && !m.brute && !m.dead && m.aggro) { const d = hyp(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; BB = m; } } }
      if (BB && !FD) {
        // the finale boss (or a mini boss): one slim strip under the pet HUD
        const bw2 = Math.min(140, W * 0.36), bx0 = W - 12 - bw2, by = 10 + Math.min(88, W * 0.24) + 14, yb = by + 7, bh = 5;
        c.save(); c.globalAlpha = 0.92;
        c.font = `900 8.5px ${arcFont}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineJoin = 'round';
        let label = BB.bname.toUpperCase() + (BB.phase === 3 ? ' · FRENZY' : BB.phase === 2 ? ' · ENRAGED' : ''); while (label.length > 6 && c.measureText(label).width > bw2 - 34) label = label.slice(0, -2) + '…'; c.strokeText(label, bx0, by); c.fillStyle = '#FFFFFF'; c.fillText(label, bx0, by);
        c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, bx0 - 1, yb - 1, bw2 + 2, bh + 2, 4); c.fill();
        const f2 = clamp(BB.hp / BB.maxhp, 0, 1); if (BB._show == null) BB._show = f2; BB._show += (f2 - BB._show) * 0.04;
        if (BB._show > f2) { c.fillStyle = 'rgba(255,255,255,.7)'; GFX.rr(c, bx0, yb, Math.max(6, bw2 * BB._show), bh, 3); c.fill(); }
        const gr = c.createLinearGradient(bx0, 0, bx0 + bw2, 0); gr.addColorStop(0, '#FF5C5C'); gr.addColorStop(1, BB.glow || '#FFE37A'); c.fillStyle = gr; if (f2 > 0) { GFX.rr(c, bx0, yb, Math.max(6, bw2 * f2), bh, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; GFX.rr(c, bx0, yb, Math.max(6, bw2 * f2), bh * 0.4, 2); c.fill(); }
        c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 3; i++) c.fillRect(bx0 + bw2 * i / 3, yb + 1, 1.5, bh - 2);
        c.font = `900 9px ${arcFont}`; c.textAlign = 'right'; const pct = `${Math.ceil(f2 * 100)}%`; c.strokeText(pct, bx0 + bw2, by); c.fillStyle = '#FFFFFF'; c.fillText(pct, bx0 + bw2, by);
        c.restore();
      }
      if (g.combo >= 3) { const s = 1 + Math.max(0, g.comboT - 2.3) * 1.2; c.save(); c.translate(W - 16, H * 0.36); c.scale(s, s); GFX.text(c, `${g.combo}`, 0, 0, 30, '#FF9BD2', 'right'); GFX.textS(c, 'COMBO', 0, 22, 12, '#FFFFFF', 'right'); c.restore(); }
      if (HPF) HPF('hud:boss');
      // buttons: Ult, Strong and Dodge (a rift stage may ask for its own single button instead: the Seedling March's Super Shot)
      const RH = RIFT && RIFT.hud ? RIFT.hud() : null;
      if (RH) { const b = btnU(), ready = RH.cd <= 0.01; c.save(); if (ready) { c.globalCompositeOperation = 'lighter'; blitC(c, glowPic(glowSprite, RH.col, b.r * 2.1), b.x, b.y); c.globalCompositeOperation = 'source-over'; }
        c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fillStyle = ready ? RH.col : 'rgba(30,24,56,.85)'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke();
        c.fillStyle = ready ? '#1E3A2E' : 'rgba(255,255,255,.6)'; c.beginPath(); for (let i = 0; i < 10; i++) { const a2 = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? b.r * 0.22 : b.r * 0.5; c.lineTo(b.x + Math.cos(a2) * rr, b.y + Math.sin(a2) * rr); } c.closePath(); c.fill();
        if (!ready) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + 6.283 * RH.cd / RH.max); c.closePath(); c.fillStyle = 'rgba(0,0,0,.5)'; c.fill(); GFX.textS(c, RH.cd.toFixed(1), b.x, b.y, 14, '#FFFFFF'); }
        GFX.labelS(c, RH.label, b.x, b.y + b.r + 9, 9, 800, '#CFFFE8', 'rgba(0,0,0,.7)', 3); c.restore(); }
      else {
      const sB = btnS(), uB = btnU(), dB = btnD();
      const drawBtn = (b, ab, cd, cdMax, ready, isUlt, num) => {
        const E = EL(ab.el), can = me.mp >= ab.cost;
        if (isUlt && ab.tier) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.2 * Math.sin(g.t * 3); blitC(c, glowPic(shockSprite, '#FFE37A', b.r * 1.9), b.x, b.y); c.restore(); }
        if (ready && isUlt) { c.save(); c.globalCompositeOperation = 'lighter'; blitC(c, glowPic(glowSprite, E.color, b.r * Math.round((2.2 + 0.2 * Math.sin(g.t * 6)) * 20) / 20), b.x, b.y); c.restore(); }
        { const gy = isUlt ? 3 : 2; blitC(c, hudPic(`btn|${ab.glyph}|${ready ? E.color : '-'}|${b.r}|${gy}`, b.r * 2 + 8, b.r * 2 + 8, (x, w, h) => { const cx = w / 2, cy = h / 2; x.beginPath(); x.arc(cx, cy, b.r, 0, 6.283); x.fillStyle = ready ? E.color : 'rgba(30,24,56,.85)'; x.fill(); x.lineWidth = 3; x.strokeStyle = ready ? '#FFFFFF' : 'rgba(255,255,255,.3)'; x.stroke(); drawGlyph(x, ab.glyph, cx, cy - gy, b.r * 1.05, ready ? 1 : 0.45); }), b.x, b.y); }
        if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + 6.283 * cd / cdMax); c.closePath(); c.fillStyle = 'rgba(0,0,0,.5)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 14, '#FFFFFF'); }
        const lab = isUlt ? `${ab.tier ? 'ULT+' : 'ULT'} · ${ab.cost} MP` : num ? `S${num}${ab.tier ? '+' : ''} · ${ab.cost}` : `STRONG${ab.tier ? '+' : ''} · ${ab.cost} MP`; GFX.labelS(c, lab, b.x, b.y + b.r + 9, 9, 800, can ? '#CFE2FF' : '#FF9AA8', 'rgba(0,0,0,.7)', 3);
      };
      btnSs().forEach((b, i) => { const ab = KIT[b.k], cd = g[CDK[b.k]]; drawBtn(b, ab, cd, ab.cd, me.mp >= ab.cost && cd <= 0, false, SSL.length > 1 ? i + 1 : 0); });
      drawBtn(uB, KIT.ult, g.cdU, KIT.ult.cd, me.mp >= KIT.ult.cost && g.cdU <= 0, true);
      { const ready = g.dodgeCd <= 0 && !me.dodge;
        blitC(c, hudPic(`dodge|${ready}|${dB.r}`, dB.r * 2 + 8, dB.r * 2 + 8, (x, w, h) => { const cx = w / 2, cy = h / 2; x.beginPath(); x.arc(cx, cy, dB.r, 0, 6.283); x.fillStyle = ready ? 'rgba(127,211,242,.9)' : 'rgba(30,24,56,.85)'; x.fill(); x.lineWidth = 3; x.strokeStyle = ready ? '#FFFFFF' : 'rgba(255,255,255,.3)'; x.stroke();
          x.save(); x.translate(cx, cy); x.strokeStyle = ready ? '#1F4E6B' : 'rgba(255,255,255,.5)'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.arc(0, 0, dB.r * 0.45, -2.6, 1.2); x.stroke(); x.beginPath(); x.moveTo(dB.r * 0.16, dB.r * 0.52); x.lineTo(dB.r * 0.16 + 6, dB.r * 0.52 - 1); x.lineTo(dB.r * 0.16 + 2, dB.r * 0.52 - 6); x.stroke(); x.restore(); }), dB.x, dB.y);
        if (g.dodgeCd > 0.05) { c.beginPath(); c.moveTo(dB.x, dB.y); c.arc(dB.x, dB.y, dB.r, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.min(1, g.dodgeCd / (0.85 * (g.dodgeK || 1)))); c.closePath(); c.fillStyle = 'rgba(0,0,0,.45)'; c.fill(); }
        GFX.labelS(c, 'DODGE', dB.x, dB.y + dB.r + 9, 9, 800, '#CFEFFF', 'rgba(0,0,0,.7)', 3); }
      if (party.length > 1) { const b = btnSw(), nxt = party[(cur + [1, 2, 3].find(k => !party[(cur + k) % party.length].down && (cur + k) % party.length !== cur) || 0) % party.length], EE = E8[nxt.el], ready = g.swapCd <= 0; c.save(); c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fillStyle = ready ? 'rgba(30,24,56,.9)' : 'rgba(30,24,56,.6)'; c.fill(); c.lineWidth = 3; c.strokeStyle = ready ? EE.color : 'rgba(255,255,255,.3)'; c.stroke(); const s0 = arc.sprites; arc.sprites = nxt.sprites; c.globalAlpha = ready ? 1 : 0.5; api.pet(c, b.x, b.y + b.r * 0.55, b.r * 1.15, {}); arc.sprites = s0; c.globalAlpha = 1; c.strokeStyle = '#FFFFFF'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.arc(b.x, b.y, b.r + 5, -2.4, -0.9); c.stroke(); c.beginPath(); c.moveTo(b.x + Math.cos(-0.9) * (b.r + 5) - 5, b.y + Math.sin(-0.9) * (b.r + 5) - 1); c.lineTo(b.x + Math.cos(-0.9) * (b.r + 5) + 1, b.y + Math.sin(-0.9) * (b.r + 5)); c.lineTo(b.x + Math.cos(-0.9) * (b.r + 5) - 1, b.y + Math.sin(-0.9) * (b.r + 5) - 6); c.stroke(); if (g.swapCd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + 6.283 * g.swapCd / 1.1); c.closePath(); c.fillStyle = 'rgba(0,0,0,.5)'; c.fill(); } c.font = `800 9px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText('SWITCH', b.x, b.y + b.r + 10); c.fillStyle = '#FFFFFF'; c.fillText('SWITCH', b.x, b.y + b.r + 10); c.restore(); }
      else { const nx = SSL.length > 1 ? W - 218 : W - 128, ny = SSL.length > 1 ? HB() - 10 : HB() - 96, E = EL(KIT.normal.el), ready = g.normalT <= 0.01; c.globalAlpha = 0.9;
        blitC(c, hudPic(`tapBtn|${KIT.normal.glyph}|${E.color}|${ready}`, 34, 34, (x, w, h) => { const cx = w / 2, cy = h / 2; x.beginPath(); x.arc(cx, cy, 13, 0, 6.283); x.fillStyle = ready ? hexA(E.color, 0.75) : 'rgba(30,24,56,.85)'; x.fill(); x.lineWidth = 2; x.strokeStyle = ready ? '#FFFFFF' : E.color; x.stroke(); drawGlyph(x, KIT.normal.glyph, cx, cy, 15, 0.9); }), nx, ny);
        GFX.labelS(c, touchUI ? 'TAP' : 'SPACE', nx, ny + 20, 7, 800, '#FFFFFF', null, 0); c.globalAlpha = 1; }
      }
      if (HPF) HPF('hud:btns'); if (AN && PI.anima && !RH) AN.drawBtn(c); if (HPF) HPF('hud:anima');
      // the move stick, resting faintly on the left until a thumb picks it up
      if (touchUI && !me.dead && !g.won) {
        const on = stick.id != null, hm = stickHome(), bx = on ? stick.ox : hm.x, by = on ? stick.oy : hm.y, E = EL(KIT.normal.el);
        let kx = bx, ky = by; if (on) { const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = hyp(dx, dy), k = d > STICK_R ? STICK_R / d : 1; kx = bx + dx * k; ky = by + dy * k; }
        c.save(); c.globalAlpha = on ? 0.95 : 0.4 + (g.movedOnce ? 0 : 0.18 * Math.sin(g.t * 4));
        // (the disc, then its ring and arrows, which do not overlap one another, so each laid down at the stick's alpha looks
        // as it did painted piece by piece)
        const SB = STICK_R * 2 + 6;
        blitC(c, hudPic('stickB|' + STICK_R, SB, SB, (x, w, h) => { const cx = w / 2, cy = h / 2, gb = x.createRadialGradient(cx, cy, STICK_R * 0.25, cx, cy, STICK_R); gb.addColorStop(0, 'rgba(18,12,38,.18)'); gb.addColorStop(1, 'rgba(18,12,38,.5)'); x.fillStyle = gb; x.beginPath(); x.arc(cx, cy, STICK_R, 0, 6.283); x.fill(); }), bx, by);
        blitC(c, hudPic('stickR|' + STICK_R, SB, SB, (x, w, h) => { const cx = w / 2, cy = h / 2; x.beginPath(); x.arc(cx, cy, STICK_R, 0, 6.283); x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,.6)'; x.stroke();
          x.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, r1 = STICK_R - 9; x.save(); x.translate(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.rotate(a); x.beginPath(); x.moveTo(4, 0); x.lineTo(-2.5, -4.5); x.lineTo(-2.5, 4.5); x.closePath(); x.fill(); x.restore(); } }), bx, by);
        if (on) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitC(c, glowPic(glowSprite, E.color, 40), kx, ky); c.restore(); }
        blitC(c, hudPic('knob|' + (on ? E.color : '-'), 50, 50, (x, w, h) => { const cx = w / 2, cy = h / 2, gk = x.createRadialGradient(cx - 6, cy - 7, 2, cx, cy, 22); gk.addColorStop(0, '#FFFFFF'); gk.addColorStop(0.55, on ? E.color : '#C9C0E8'); gk.addColorStop(1, on ? hexA(E.color, 0.85) : '#6E64A0');
          x.fillStyle = gk; x.beginPath(); x.arc(cx, cy, 21, 0, 6.283); x.fill(); x.lineWidth = 2.5; x.strokeStyle = '#FFFFFF'; x.stroke(); }), kx, ky);
        c.restore();
        if (!on) { c.globalAlpha = g.movedOnce ? 0.55 : 0.9; GFX.labelS(c, 'MOVE', bx, by + STICK_R + 10, 9, 800, '#CFE2FF', 'rgba(0,0,0,.7)', 3); c.globalAlpha = 1; }
      }
      if (HPF) HPF('hud:stick');
      if (nav.goal && !nav.mon && !me.dead) { const X = sx(nav.goal.x), Y = sy(nav.goal.y), k2 = 0.55 + 0.25 * Math.sin(g.t * 8), s = TS * (0.5 + 0.12 * Math.sin(g.t * 8)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k2; blitSized(c, shockSprite(EL(KIT.normal.el).color), X - s, Y - s * 0.5, s * 2, s); c.restore(); }
      if (!touchUI && g.t < 6 && !g.movedOnce) { c.globalAlpha = 0.35 + 0.2 * Math.sin(g.t * 4); c.beginPath(); c.arc(78, HB() - 52, 46, 0, 6.283); c.lineWidth = 2.5; c.strokeStyle = '#FFFFFF'; c.setLineDash([6, 6]); c.stroke(); c.setLineDash([]); c.globalAlpha = 0.8; c.font = `800 11px ${arcFont}`; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.fillText(touchUI ? 'Drag to move' : 'Arrow keys', 78, H - 82); if (!touchUI) { c.font = `800 9px ${arcFont}`; c.fillText('or WASD · Shift dodges', 78, H - 68); } c.globalAlpha = 1; }
      // until you've tapped a few times: a pulsing finger over the nearest monster
      if (g.taps < 4 && g.intro <= 0 && !me.dead && !g.won && F.k % ACT_LEN === 0) {
        const t = nearestMon(me.x, me.y, 9); const X = t ? sx(t.x) : W / 2 + 90, Y = t ? sy(t.y) - t.r * Tz() - 10 : H / 2 - 60, pulse = 0.5 + 0.5 * Math.sin(g.t * 5);
        c.save(); c.globalAlpha = 0.75 + 0.25 * pulse; c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.beginPath(); c.arc(X, Y + 26, 18 + pulse * 10, 0, 6.283); c.stroke();
        c.translate(X, Y - pulse * 6); c.fillStyle = '#FFE3C2'; c.strokeStyle = GFX.line; c.lineWidth = 2.2;
        c.beginPath(); GFX.rr(c, -6, -2, 12, 30, 6); c.fill(); c.stroke(); c.beginPath(); GFX.rr(c, -15, 12, 30, 20, 9); c.fill(); c.stroke();
        c.restore();
        GFX.text(c, touchUI ? 'TAP enemies to attack!' : 'Click enemies to attack!', X, Y + 64, 13, '#FFFFFF'); GFX.text(c, touchUI ? 'Drag the stick on the left to move' : 'Arrow keys or WASD to move', X, Y + 82, 11, '#CFE2FF');
      }
      // the tap ripple
      if (g.tapFx > 0 && g.tapScreen) { const u = 1 - g.tapFx / 0.3; c.globalAlpha = 1 - u; c.strokeStyle = '#FFFFFF'; c.lineWidth = 3 - u * 2; c.beginPath(); c.arc(g.tapScreen[0], g.tapScreen[1], 8 + u * 26, 0, 6.283); c.stroke(); c.globalAlpha = 1; }
      // combo fever: the edges glow pink on a long streak
      if (g.combo >= 15) { const a = Math.min(0.35, (g.combo - 15) / 60 + 0.12) * (0.75 + 0.25 * Math.sin(g.t * 8)), dpr = arc.dpr; feverFull = screenPic(feverFull, Math.round(W * dpr), Math.round(H * dpr), edgeGlow(255, 155, 210, 0.35, 0.72)); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.globalAlpha = a; c.drawImage(feverFull, 0, 0); c.restore(); }
    }
    function drawBanners(c) {
      const W = api.W, H = api.H;
      let si = 0;
      banners.forEach(b => {
        // an astral banner (an Awakening, a summoning) flashes up and is gone in a second and a half, over a band of sky so
        // faint the attack shows through it, just above the middle of the screen and clear of the summoning button below
        const ast = b.big && b.astral, u = b.t / b.life, inT = Math.min(1, b.t / 0.18), outA = ast ? Math.min(1, b.t / 0.1, (b.life - b.t) / 0.35) : u > 0.8 ? (1 - u) / 0.2 : 1;
        const y = ast ? Math.max(H * 0.3, Math.min(H * 0.45, H - 342)) : b.big ? H * 0.3 : H * 0.6 + (si++) * 46;
        if (outA <= 0) return;
        c.save(); c.globalAlpha = outA;
        if (ast) {   // a soft band of night sky, no hard edges
          const bh = 92, gr = c.createLinearGradient(0, y - bh / 2, 0, y + bh / 2); gr.addColorStop(0, 'rgba(8,5,26,0)'); gr.addColorStop(0.3, 'rgba(8,5,26,.2)'); gr.addColorStop(0.7, 'rgba(8,5,26,.2)'); gr.addColorStop(1, 'rgba(8,5,26,0)'); c.fillStyle = gr; c.fillRect(0, y - bh / 2, W, bh);
          c.save(); c.globalCompositeOperation = 'lighter';
          [-1, 1].forEach(sd => { const ly = y + sd * 27, lg = c.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, hexA(b.color, 0)); lg.addColorStop(0.5, hexA(b.color, 0.9)); lg.addColorStop(1, hexA(b.color, 0)); c.fillStyle = lg; c.fillRect(W / 2 - W / 2 * inT, ly - 1, W * inT, 2); c.globalAlpha = 0.5 * outA; blitSized(c, beamSprite(b.color), W / 2 - W * 0.45 * inT, ly - 7, W * 0.9 * inT, 14); c.globalAlpha = outA; });
          for (let i = 0; i < 9; i++) { const sx2 = (i * 97 + 31) % W, sy2 = y + ((i * 53) % 50) - 25, tw = 0.4 + 0.6 * Math.abs(Math.sin(g.t * 3 + i * 1.7)), s2 = 5 + (i % 3) * 3; c.globalAlpha = tw * outA; blitSized(c, glowSprite(b.color), sx2 - s2, sy2 - s2, s2 * 2, s2 * 2); }
          c.restore(); c.globalAlpha = outA;
        } else if (b.big) { const bh = 64; c.fillStyle = 'rgba(10,6,24,.66)'; c.fillRect(0, y - bh / 2, W, bh); c.save(); c.beginPath(); c.rect(0, y - bh / 2, W, bh); c.clip(); c.strokeStyle = hexA(b.color, 0.35); c.lineWidth = 10; for (let x = -bh + ((g.t * 140) % 40); x < W + bh; x += 40) { c.beginPath(); c.moveTo(x, y + bh / 2); c.lineTo(x + bh, y - bh / 2); c.stroke(); } c.restore(); c.fillStyle = b.color; c.fillRect(0, y - bh / 2, W * inT, 3); c.fillRect(W * (1 - inT), y + bh / 2 - 3, W * inT, 3); }
        const sc = ast ? 1 + Math.max(0, 0.2 - b.t) * 1.75 : b.big ? 1 + Math.max(0, 0.25 - b.t) * 2.4 : 1;
        c.translate(W / 2 + (ast ? 0 : (1 - inT) * -W * 0.4), y); c.scale(sc, sc);
        const fs = b.big ? 26 : 20; c.font = `800 ${fs}px ${arcFont}`; const tw = c.measureText(b.s).width, fit = Math.min(1, (W - 24) / Math.max(1, tw));
        c.scale(fit, fit);
        GFX.text(c, b.s, 0, b.sub ? -8 : 0, fs, b.color);
        if (b.sub) { c.scale(1 / fit, 1 / fit); c.font = `800 12px ${arcFont}`; const sw = c.measureText(b.sub).width, f2 = Math.min(1, (W - 24) / Math.max(1, sw)); c.scale(f2, f2); GFX.text(c, b.sub, 0, 16 / f2, 12, '#FFFFFF'); }
        c.restore();
      });
      if (g.intro > 0 && F.rift) { c.globalAlpha = Math.min(1, g.intro / 0.6); GFX.text(c, F.name.toUpperCase(), W / 2, H * 0.22, 24, PB.accent); GFX.text(c, F.rift.name.toUpperCase(), W / 2, H * 0.22 + 30, 15, '#FFFFFF'); GFX.text(c, F.rift.kind === 'boss' ? `${F.bossName} waits ahead` : RIFT ? RIFT.goal() : '', W / 2, H * 0.22 + 52, 11, '#FFE37A'); c.globalAlpha = 1; }
      else if (g.intro > 0) { c.globalAlpha = Math.min(1, g.intro / 0.6); GFX.text(c, `FLOOR ${F.n}`, W / 2, H * 0.22, 30, PB.accent); GFX.text(c, PB.name.toUpperCase(), W / 2, H * 0.22 + 30, 15, '#FFFFFF'); if (M.sec && M.sec !== F.biome) GFX.text(c, `with parts of ${BIOMES[M.sec].name}${M.ter ? ' and ' + BIOMES[M.ter].name : ''}`, W / 2, H * 0.22 + 50, 11, '#E8E0FF'); GFX.text(c, F.boss ? `Finale: ${F.bossName} waits in the arena` : `Guardian: ${F.bossName}`, W / 2, H * 0.22 + 68, 11, '#FFE37A'); c.globalAlpha = 1; }
    }
    // (a test can time the frame's pieces: with g.prof set, each piece is flushed and its time added there)
    function profPieces(c) { const P = g.prof, fl = g.profNoFlush ? () => {} : () => c.getImageData(0, 0, 1, 1); fl(); let t0 = performance.now(); return k => { fl(); const t = performance.now(); P[k] = (P[k] || 0) + t - t0; t0 = t; }; }
    function draw(c) {
      const W = api.W, H = api.H, PF = g.prof ? profPieces(c) : null;
      { const M = c.getTransform(); snOn = !M.b && !M.c && M.a === M.d && M.a >= 1.5; snK = M.a; snE = M.e; snF = M.f; }
      shX = cam.sm ? (Math.random() - 0.5) * cam.sm * 2 : 0; shY = cam.sm ? (Math.random() - 0.5) * cam.sm * 2 : 0;
      drawWorld(c); if (PF) PF('world');
      // fog over the unexplored
      drawZones(c, false);
      if (FD) FD.drawGround(c);
      if (RX) RX.drawGround(c); if (RES) RES.drawGround(c);
      // hazards and traps on the screen (a saw's track and a fence's span reach out from its anchor)
      { const T = Tz(), on = (x, y, m) => { const X = sx(x), Y = sy(y); return X > -m && X < W + m && Y > -m && Y < H + m; };
        const span = t => { const xs = [t.x, t.x0, t.x1].filter(v => v != null), ys = [t.y, t.y0, t.y1].filter(v => v != null), m = T * 2, X0 = sx(Math.min(...xs)), X1 = sx(Math.max(...xs)), Y0 = sy(Math.min(...ys)), Y1 = sy(Math.max(...ys)); return X1 > -m && X0 < W + m && Y1 > -m && Y0 < H + m; };
        for (const h of hazards) if (h.area || on(h.x, h.y, T * 2)) drawHazard(c, h);
        for (const t of traps) if (t.kind !== 'saw' && t.kind !== 'fence' && on(t.x, t.y, T * 2)) drawTrap(c, t);
        for (const t of traps) if ((t.kind === 'saw' || t.kind === 'fence') && span(t)) drawTrap(c, t); }
      if (PF) PF('ground');
      // pickups lie on the ground
      // (only what is on the screen: coins and drops can lie all over a floor)
      for (const p of picks) { const X = sx(p.x), Y = sy(p.y) - p.z * TS * 0.2, T = Tz(); if (X < -T * 2 || X > W + T * 2 || Y < -T * 3 || Y > H + T * 2) continue; if (p.kind === 'coin') { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, sy(p.y) + 3, 5, 2, 0, 0, 6.283); c.fill(); const w = Math.abs(Math.cos(g.t * 6 + p.x)) * T * 0.17 + 2; c.fillStyle = '#FFD447'; c.strokeStyle = '#A2680A'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(X, Y - 3, w, T * 0.17, 0, 0, 6.283); c.fill(); c.stroke(); } else if (p.kind === 'acc') { const Rr = ACC_R[p.acc.r], yy = Y - 9 + Math.sin(g.t * 3 + p.x) * 2.5; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.2 * Math.sin(g.t * 5 + p.y); const gs = T * (0.55 + 0.08 * p.acc.r); blitSized(c, glowSprite(Rr.c), X - gs, yy - gs, gs * 2, gs * 2); if (p.acc.r >= 3) { const bh = T * (1.6 + 0.4 * p.acc.r); c.globalAlpha = 0.5 + 0.12 * Math.sin(g.t * 4); blitSized(c, columnSprite(Rr.c), X - T * 0.18, yy - bh, T * 0.36, bh); } c.restore(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, sy(p.y) + 3, 7, 2.5, 0, 0, 6.283); c.fill(); accDraw(c, p.acc.t, p.acc.r, X, yy, T * 0.34); } else if (p.kind === 'gem') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; const s = T * 0.6; blitSized(c, glowSprite(GEMS[p.gem].color), X - s, Y - 6 - s, s * 2, s * 2); c.restore(); GFX.gem(c, X, Y - 6 + Math.sin(g.t * 4) * 2, T * 0.22, GEMS[p.gem].color); } else if (p.kind === 'food') { const col = { sunberry: '#FF6F59', carrot: '#FF9F43', pumpkin: '#F2A33A', starfruit: '#FFE37A', ambrosia: '#FFC45C', honeycomb: '#FFC23D', feast: '#D9772E', hearttart: '#FF6B9A', sundae: '#B8A3F2' }[p.food] || '#9BD178'; c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, sy(p.y) + 3, 6, 2.5, 0, 0, 6.283); c.fill(); GFX.blob(c, X, Y - 5, T * 0.19, col, 2); c.fillStyle = '#5DB36E'; c.beginPath(); c.ellipse(X + T * 0.06, Y - 5 - T * 0.2, T * 0.09, T * 0.045, -0.7, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(X - T * 0.06, Y - 5 - T * 0.07, T * 0.045, 0, 6.283); c.fill(); }
        else { GFX.blob(c, X, Y - 4, T * 0.17, p.kind === 'hp' ? '#FF5C8A' : '#5DA8F0', 2); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(X - T * 0.05, Y - 4 - T * 0.06, T * 0.05, 0, 6.283); c.fill(); } }
      if (PF) PF('picks');
      // everything that stands up, sorted by depth
      const ents = [];
      const vx0 = cam.x - W / 2 / Tz() - 2, vx1 = cam.x + W / 2 / Tz() + 2, vy0 = cam.y - H / 2 / Tz() - 1, vy1 = cam.y + H / 2 / Tz() + 3;
      const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
      for (const p of propList) if (!p.broken && vis(p.x, p.y) && (explored[p.k] || explored[Math.min(MH - 1, Math.floor(p.y) + 1) * MW + Math.floor(p.x)])) ents.push([p.y, 1, p]);
      for (const p of pots) if (!p.broken && vis(p.x, p.y) && isExp(p.x, p.y)) ents.push([p.y + 0.3, 2, p]);
      for (const s of shrines) if (vis(s.x, s.y) && isExp(s.x, s.y)) ents.push([s.y + 0.3, 3, s]);
      for (const m of mons) if (!m.dead && vis(m.x, m.y) && (isExp(m.x, m.y) || (m.boss && m.act !== 'sleep'))) ents.push([m.y + (m.boss ? 0.3 : 0), 4, m]);
      ents.push([me.y + 0.01, 5, null]);
      helpers.forEach(h => ents.push([h.y, 6, h]));
      for (const s of stones) if (!s.got && vis(s.x, s.y)) ents.push([s.y, 7, s]);
      if (AN) for (const [y, a] of AN.ents()) ents.push([y, 8, a]);
      if (RULES) for (const [y, kk] of RULES.ents()) ents.push([y, 10, kk]);
      if (RIFT) for (const [y, o] of RIFT.ents()) ents.push([y, 11, o]);
      if (FD) for (const p of FD.S.props) if (vis(p.x, p.y)) ents.push([p.y, 9, p]);
      ents.sort((a, b) => a[0] - b[0]);
      // copies of the pet out (Mirror Twins, Shadow Army, Mirror Image): the pet drawn in parts once, into one picture, and
      // it and every copy laid down from that, so the copies walk and move with it at no extra cost
      petSnapF = helpers.length && !me.dead ? api.petSnap(c, Tz() * 1.02 * SIZE * (g.pw.giant ? 1.35 : 1) * (g.petK || 1), petLook()) : null;
      if (AN) AN.drawGround(c);
      if (RULES) RULES.drawGround(c);
      if (RIFT) RIFT.drawGround(c);
      if (ELEM) ELEM.draw(c, true);
      for (const [, kind, e] of ents) {
        if (kind === 1) drawProp(c, e);
        else if (kind === 2) drawPot(c, e);
        else if (kind === 3) drawShrine(c, e);
        else if (kind === 4) drawMon(c, e);
        else if (kind === 5) drawPet(c);
        else if (kind === 7) drawStone(c, e);
        else if (kind === 8) AN.drawAnima(c, e);
        else if (kind === 9) FD.drawProp(c, e);
        else if (kind === 10) RULES.drawKey(c, e);
        else if (kind === 11) RIFT.drawObj(c, e);
        else { c.save(); c.globalAlpha = 0.6; blitSized(c, glowSprite(e.color), sx(e.x) - TS * 0.8, sy(e.y) - TS * 1.2, TS * 1.6, TS * 1.6); const br = Math.sin(g.t * 2.4 + e.s) * 0.025; api.pet(c, sx(e.x), sy(e.y) + TS * 0.18, TS * 0.9 * SIZE, petSnapF ? { flip: me.face < 0, snap: petSnapF, sx: 1 + br, sy: 1 - br } : { flip: me.face < 0, face: 'happy' }); c.restore(); }
      }
      petSnapF = null;
      if (PF) PF('ents');
      drawPowers(c);
      if (FD) FD.drawFx(c);
      if (RX) RX.drawFx(c); if (STAR) STAR.draw(c); if (ELEM) ELEM.draw(c);
      // wall torches and candle flames
      for (const t of M.lights) { if (Math.abs(t.x - cam.x) > 14 || Math.abs(t.y - cam.y) > 18 || !isExp(t.x, t.y + 1)) continue; const X = sx(t.x), Y = sy(t.y - (t.kind === 'torch' ? 0.1 : 0)), T = Tz(), f = Math.sin(g.t * 9 + t.ph) * 0.15; if (t.kind === 'torch') { c.fillStyle = '#5A4632'; c.fillRect(X - T * 0.05, Y, T * 0.1, T * 0.28); c.fillStyle = '#FF9F43'; c.beginPath(); c.ellipse(X, Y - T * 0.06, T * 0.1, T * (0.17 + f * 0.1), 0, 0, 6.283); c.fill(); c.fillStyle = '#FFE37A'; c.beginPath(); c.ellipse(X, Y - T * 0.02, T * 0.05, T * 0.09, 0, 0, 6.283); c.fill(); } else if (t.kind === 'neon') { c.fillStyle = '#1C2438'; c.fillRect(X - T * 0.3, Y - T * 0.02, T * 0.6, T * 0.12); c.fillStyle = `rgba(77,240,255,${0.75 + 0.25 * Math.sin(g.t * 6 + t.ph)})`; c.fillRect(X - T * 0.25, Y + T * 0.01, T * 0.5, T * 0.06); } else if (t.kind === 'brazier' || t.kind === 'candles') { const fy = Y - T * (t.kind === 'brazier' ? 0.62 : 0.98); [-1, 0, 1].forEach(i => { if (t.kind === 'brazier' && i) return; const fx = X + i * T * 0.3; c.fillStyle = '#FF9F43'; c.beginPath(); c.ellipse(fx, fy - T * 0.12, T * (t.kind === 'brazier' ? 0.22 : 0.06), T * ((t.kind === 'brazier' ? 0.3 : 0.1) + f * 0.08), 0, 0, 6.283); c.fill(); c.fillStyle = '#FFE37A'; c.beginPath(); c.ellipse(fx, fy - T * 0.06, T * (t.kind === 'brazier' ? 0.1 : 0.03), T * (t.kind === 'brazier' ? 0.15 : 0.05), 0, 0, 6.283); c.fill(); }); } }
      if (PF) PF('powers');
      drawOverlay(c); if (PF) PF('overlay');
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const m of mons) { if (m.dead || m.boss || hyp(m.x - me.x, m.y - me.y) < 6 || !isExp(m.x, m.y) || !(F.dark > 0.3)) continue; const X = sx(m.x), Y = sy(m.y) - m.r * TS * 0.15; c.fillStyle = '#FF5C5C'; c.globalAlpha = 0.85; c.beginPath(); c.arc(X - m.r * TS * 0.32, Y, 2.4, 0, 6.283); c.arc(X + m.r * TS * 0.32, Y, 2.4, 0, 6.283); c.fill(); c.globalAlpha = 1; }
      for (const t of M.lights) { if (Math.abs(t.x - cam.x) > 14 || Math.abs(t.y - cam.y) > 18 || !isExp(t.x, t.y + 1)) continue; const s = TS * (t.kind === 'torch' ? 0.55 : 0.75) * (1 + 0.1 * Math.sin(g.t * 13 + t.ph)); c.globalAlpha = 0.55; blitSized(c, glowSprite(t.color || '#FF9F43'), sx(t.x) - s, sy(t.y - (t.kind === 'torch' ? 0.2 : 0.7)) - s, s * 2, s * 2); }
      c.globalAlpha = 1;
      if (PF) PF('glows');
      drawShots(c); drawEShots(c); if (PF) PF('shots');
      if (AN) AN.drawFx(c);
      for (const r of rings) { const u = 1 - r.life / r.max, rr = lerp(r.r0, r.r1, 1 - Math.pow(1 - u, 2)) * Tz(), a = r.life / r.max; if (r.color && r.color[0] === '#') { const s2 = rr / 0.86; c.globalAlpha = a * Math.min(1, 0.55 + r.w * 1.4); blitSized(c, shockSprite(r.color), sx(r.x) - s2, sy(r.y) - s2, s2 * 2, s2 * 2); } else { c.globalAlpha = a; c.strokeStyle = r.color; c.lineWidth = Math.max(1.5, r.w * TS * (1 - u * 0.6)); c.beginPath(); c.arc(sx(r.x), sy(r.y), rr, 0, 6.283); c.stroke(); } }
      c.globalAlpha = 1;
      c.lineJoin = 'round'; c.lineCap = 'round';
      // lightning: a soft glow along the bolt (one ray from end to end, no banded edges), its crackling line crisp inside it
      for (const b of bolts) { const a = b.life / b.max, p0 = b.pts[0], p1 = b.pts[b.pts.length - 1]; if (!p0) continue;
        c.globalAlpha = 1; softRay(c, sx(p0[0]), sy(p0[1]), sx(p1[0]), sy(p1[1]), b.w * 7, b.color, a * 0.55);
        c.beginPath(); b.pts.forEach(([x, y], i) => i ? c.lineTo(sx(x), sy(y)) : c.moveTo(sx(x), sy(y))); c.strokeStyle = b.color; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = a * 0.3; c.lineWidth = b.w * 2; c.stroke(); c.globalAlpha = a; c.lineWidth = b.w; c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = b.w * 0.4; c.stroke(); }
      c.globalAlpha = 1;
      [me.beam, beamUlt].forEach(Bm => {
        if (!Bm) return;
        const E = EL(Bm.el), col = E.rainbow ? ['#FF7BB5', '#FFD447', '#6FE3A0', '#6FB6FF', '#B983F5'][Math.floor(g.t * 6) % 5] : E.color, T = Tz(), X = sx(me.x), Y = sy(me.y - 0.2);
        const fade = Math.min(1, Bm.t * 4, (Bm.max - Bm.t) * 8 + 0.25), bs = beamSprite(col), bw = beamSprite('#FFFFFF');
        (Bm.offs || [0]).forEach((o, oi) => {
          const len = (Bm.cur || Bm.len) * T * (o ? 0.85 : 1), w = Bm.w * T * (o ? 0.6 : 1) * (0.92 + 0.1 * Math.sin(g.t * 47 + oi * 2));
          c.save(); c.translate(X, Y); c.rotate(Bm.a + o);
          const many = (Bm.offs || [0]).length > 1, side = o ? 0.7 : 1; c.globalAlpha = (many ? 0.16 : 0.32) * fade * side; c.drawImage(bs, -w * 0.8, -w * 2.6, len + w * 2.2, w * 5.2);
          c.globalAlpha = (many ? 0.7 : 0.85) * fade * side; c.drawImage(bs, -w * 0.5, -w * 1.15, len + w * 1.4, w * 2.3);
          c.globalAlpha = (many ? 0.8 : 0.95) * fade * side; c.drawImage(bw, -w * 0.3, -w * 0.42, len + w * 0.9, w * 0.84);
          // energy filaments flowing out along the beam
          c.globalAlpha = 0.5 * fade; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1, w * 0.06);
          for (let k = 0; k < 3; k++) { c.beginPath(); for (let i = 0; i <= 28; i++) { const u = i / 28, x = u * len, env = Math.sin(Math.PI * Math.min(1, u * 1.1)), y = Math.sin(u * 14 - g.t * 26 + k * 2.1) * w * 0.55 * env; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
          // muzzle and impact
          c.globalAlpha = fade; const ms = w * 2.4; blitSized(c, glowSprite(col), -ms, -ms, ms * 2, ms * 2);
          if (!o) { const fs = w * (3 + 0.5 * Math.sin(g.t * 30)); c.save(); c.rotate(-Bm.a * 0.3 + g.t * 1.5); blitSized(c, flareSprite(col), -fs, -fs, fs * 2, fs * 2); c.restore(); }
          const is = w * 2.6; blitSized(c, glowSprite(col), len - is, -is, is * 2, is * 2); blitSized(c, glowSprite('#FFFFFF'), len - is * 0.4, -is * 0.4, is * 0.8, is * 0.8);
          c.restore();
        });
      });
      if (PF) PF('beams');
      drawParts(c, true); if (PF) PF('partsAdd');
      for (const Dg of dragons) {
        const T = Tz(), tr = Dg.trail; if (tr.length < 2) continue;
        for (let i = tr.length - 1; i >= 0; i--) { const u = 1 - i / tr.length, X = sx(tr[i][0]), Y = sy(tr[i][1]), s2 = T * (0.3 + 0.95 * u); c.globalAlpha = 0.3 + 0.55 * u; blitSized(c, glowSprite(Dg.col), X - s2, Y - s2, s2 * 2, s2 * 2); if (i % 3 === 1) { const s3 = s2 * 0.42; c.globalAlpha = 0.55 * u; blitSized(c, glowSprite(Dg.hot), X - s3, Y - s3, s3 * 2, s3 * 2); }
          if (i % 4 === 2 && i < tr.length - 3) { const [ax, ay] = tr[i + 1], ang = Math.atan2(tr[i][1] - ay, tr[i][0] - ax) - Math.PI / 2 * Dg.dir; c.save(); c.translate(X, Y); c.rotate(ang + Math.sin(g.t * 9 + i) * 0.3); c.globalAlpha = 0.5 * u; blitSized(c, beamSprite(Dg.hot), -T * 0.05, -T * 0.13, T * (0.5 + 0.5 * u), T * 0.26); c.restore(); } }
        const HX = sx(tr[0][0]), HY = sy(tr[0][1]);
        c.save(); c.translate(HX, HY); c.scale(Dg.dir, 1);
        c.globalAlpha = 0.85; blitSized(c, glowSprite(Dg.col), -T * 1.5, -T * 1.5, T * 3, T * 3);
        c.globalAlpha = 0.7; blitSized(c, beamSprite(Dg.col), T * 0.2, -T * 0.32, T * 2.6, T * 0.64); blitSized(c, beamSprite(Dg.hot), T * 0.3, -T * 0.12, T * 1.7, T * 0.24);
        for (const [lw2, al] of [[T * 0.24, 0.22], [T * 0.08, 0.85]]) { c.globalAlpha = al; c.strokeStyle = Dg.hot; c.lineWidth = lw2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-T * 0.05, -T * 0.3); c.quadraticCurveTo(-T * 0.45, -T * 0.9, -T * 1.0, -T * (1.0 + Math.sin(g.t * 12) * 0.1)); c.moveTo(T * 0.15, -T * 0.25); c.quadraticCurveTo(-T * 0.05, -T * 0.85, -T * 0.4, -T * 1.15); c.stroke(); }
        c.globalAlpha = 1; blitSized(c, glowSprite('#FFFFFF'), T * 0.3, -T * 0.38, T * 0.36, T * 0.36);
        c.restore();
      }
      c.restore();
      if (PF) PF('dragons');
      drawParts(c, false); if (PF) PF('parts');
      drawAmbient(c); if (PF) PF('ambient');
      drawLasers(c);
      drawZones(c, true); if (PF) PF('zones');
      if (me.lvFx > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = me.lvFx / 1.6; const X = sx(me.x), Y = sy(me.y); c.translate(X, Y + TS * 0.2); c.rotate(-Math.PI / 2); blitSized(c, beamSprite('#FFE37A'), 0, -TS * 0.6 * SIZE, TS * 4.4, TS * 1.2 * SIZE); blitSized(c, beamSprite('#FFFFFF'), 0, -TS * 0.18 * SIZE, TS * 3.4, TS * 0.36 * SIZE); c.restore(); }
      for (const t of texts) { const a = clamp(t.life / t.max * 1.6, 0, 1), sc = t.crit ? 1 + Math.max(0, t.life - t.max + 0.15) * 4 : 1; c.save(); c.globalAlpha = a; c.translate(sx(t.x), sy(t.y)); c.scale(sc, sc);
        // a number still climbing (hits landing on it) is written as it is; once it has held for a few frames it is a picture
        if (t._s !== t.s || t._z !== t.size) { t._s = t.s; t._z = t.size; t._n = 0; } (++t._n > 3 ? GFX.textS : GFX.text)(c, t.crit ? t.s + '!' : t.s, 0, 0, t.size, t.color); c.restore(); }
      if (g.eclipseT > 0) { const PX = sx(me.x), PY = sy(me.y - 0.3), a2 = Math.min(1, g.eclipseT * 2) * 0.5, gr = c.createRadialGradient(PX, PY, Math.min(W, H) * 0.12, PX, PY, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(10,4,24,0)'); gr.addColorStop(0.5, `rgba(10,4,24,${a2 * 0.6})`); gr.addColorStop(1, `rgba(4,2,12,${a2})`); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
      if (g.stopT > 0 || g.warpT > 0) { const PX = sx(me.x), PY = sy(me.y - 0.3), a2 = g.stopT > 0 ? 0.34 + 0.06 * Math.sin(g.t * 5) : 0.22, gr = c.createRadialGradient(PX, PY, Math.min(W, H) * 0.18, PX, PY, Math.max(W, H) * 0.8); gr.addColorStop(0, 'rgba(110,80,220,0)'); gr.addColorStop(0.55, `rgba(110,80,220,${a2 * 0.45})`); gr.addColorStop(1, `rgba(80,50,190,${a2})`); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 2; i++) { const ph = (g.t * 0.5 + i * 0.5) % 1, R3 = TS * (2 + ph * 5) / 0.86; c.globalAlpha = 0.35 * (1 - ph); blitSized(c, shockSprite('#B9A6FF'), PX - R3, PY - R3, R3 * 2, R3 * 2); } c.restore(); }
      if (g.slowT > 0 && g.perfects && me.dodge && me.dodge.perf) { c.fillStyle = 'rgba(255,227,122,.08)'; c.fillRect(0, 0, W, H); }
      if (g.flash > 0) { const PX = sx(me.x), PY = sy(me.y - 0.4), a2 = Math.min(0.85, g.flash), gr = c.createRadialGradient(PX, PY, 0, PX, PY, Math.max(W, H) * 0.85); gr.addColorStop(0, hexA(g.flashC, a2)); gr.addColorStop(0.4, hexA(g.flashC, a2 * 0.6)); gr.addColorStop(1, hexA(g.flashC, a2 * 0.2)); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
      if (AN) AN.drawCine(c, W, H);
      if (PF) PF('fx');
      drawHUD(c); if (PF) PF('hud');
      if (RIFT) RIFT.drawOver(c);
      drawBanners(c); if (PF) PF('banners');
    }
    prewarm();

    const toWorld = (x, y) => [(x - api.W / 2 - shX) / (TS * g.zoom) + cam.x, (y - api.H / 2 - shY) / (TS * g.zoom) + cam.y];
    function tapAt(x, y) {
      const [wx, wy] = toWorld(x, y);
      g.tapAim = aimTap(wx, wy); g.tapBuf = 0.35; g.tapFx = 0.3; g.tapScreen = [x, y];   // one tap, one attack: it waits a moment for the cooldown if it has to
      if (tryFire(g.tapAim)) { g.tapBuf = 0; g.tapAim = null; }
    }
    return {
      _dbg: { get cam() { return cam; }, get RULES() { return RULES; }, get RIFT() { return RIFT; }, RU, lesserBoss, makeBoss, SKIP, stick, steerTo: (x, y) => { goTo(null, x, y); const d = navDir(1 / 60); nav.goal = null; return d; }, g, me, mons, M, get ST() { return ST; }, KIT, AB, useStrong, useUlt, dodge, hitMon, shots, eshots, zones, parts, helpers, F, pots, picks, shrines, hazards, traps, stones, SIZE, chunks, walkAt, blocked, X, wakeBoss, takeStone, fireEvent, tapAt, toWorld, nav, holds, goTo, banners, get AN() { return AN; }, get FD() { return FD; }, get RX() { return RX; }, get STAR() { return STAR; }, get ELEM() { return ELEM; }, get RES() { return RES; }, propList, get KITR() { return KIT; }, setKit: (slot, a) => { KIT[slot] = a; }, party, cur: () => cur, switchTo, hurtPet, btnSw, setBoss: id => { if (BOSS_BY_ID[id]) { BOSS_KIND = BOSS_BY_ID[id]; F.bossName = BOSS_KIND.name; } } },
      resize() { layout(); stick.id = null; },
      /* a meal from the pantry while paused: heals the played pet and feeds it Tower experience */
      feed(k) {
        if (!SNACKS[k] || !(st.pantry[k] > 0) || me.dead) return false;
        st.pantry[k]--; const info = SNACKS[k], fx = info.bondLv ? 0 : foodXP(k, P);
        heal(ST.hp * (0.12 + info.food / 200)); me.mp = Math.min(ST.mp, me.mp + ST.mp * 0.15);
        if (info.bondLv) { addBondTo(P, bondFoodXP(P, info.bondLv)); text(me.x, me.y - 1.3, `${info.name} · +${info.bondLv} bond levels`, '#FF9BD2', 14); api.sfx.yum(); sparks(me.x, me.y - 0.5, '#FF9BD2', 12, 4); return true; }
        P.dxp = (P.dxp || 0) + fx; g.xp += fx; let up = 0;
        while (P.dxp >= dunXpNeed(P.dlv || 1) && (P.dlv || 1) < DLV_MAX) { P.dxp -= dunXpNeed(P.dlv || 1); P.dlv = (P.dlv || 1) + 1; g.lvls++; up++; }
        if (up) { const old = ST; ST = petCombat(P); party[cur].ST = ST; me.hp = Math.min(ST.hp, me.hp + (ST.hp - old.hp)); }
        // a grand feast says what it is: whole pet levels
        text(me.x, me.y - 1.3, info.lvAdd ? `${info.name} · +${up} pet levels!` : `${info.name} · +${fx} XP${up ? ' · LEVEL UP!' : ''}`, '#9BD178', 14); api.sfx.yum(); sparks(me.x, me.y - 0.5, '#9BD178', 10, 4);
        return true;
      },
      destroy() { if (AN) AN.stop(); }, reparty,
      start() { g.intro = 2.4; api.sfx.hum(); },
      down(x, y, id) {
        if (AN && AN.S.cine) return;
        const RHd = RIFT && RIFT.hud ? RIFT.hud() : null;   // (a rift stage with its own single button: only that, and the stick)
        if (RHd && onBtn(btnU(), x, y)) { RIFT.act(); return; }
        if (!RHd && AN && PI.anima && AN.onBtn(x, y)) return;
        if (teamOk()) { const tb = btnTeam(); if (hyp(x - tb.x, y - tb.y) < tb.r + 8) { openRunTeam(); return; } }
        if (RIFT && RIFT.tap(x, y)) return;   // (a rift stage that takes the whole screen's taps: the Sandstorm Flight)
        if (!RHd && party.length > 1) { if (x < 60 && y < 62) { switchNext(); return; } const b = btnSw(); if (hyp(x - b.x, y - b.y) < b.r + 8) { switchNext(); return; } if (y > 56 && y < 84 && x > 50 && x < 60 + party.length * 48) { const k = Math.floor((x - 52) / 48); let idx = -1, seen = 0; for (let i = 0; i < party.length; i++) { if (i === cur) continue; if (seen === k) { idx = i; break; } seen++; } if (idx >= 0) { if (!switchTo(idx)) text(me.x, me.y - 1.2, party[idx].down ? 'Knocked out' : 'Not yet', '#CFE2FF', 12); return; } } }
        if (!RHd) if (onBtn(btnU(), x, y)) { useUlt(); return; }
        if (!RHd) for (const b of btnSs()) if (hyp(x - b.x, y - b.y) < b.r + 6) { useStrong(b.k); return; }
        if (!RHd) if (onBtn(btnD(), x, y)) { dodge(); return; }
        // the left half picks up the move stick, unless the thumb lands right on a monster
        // (a stick already held when a new thumb lands in its zone is a stick whose up was lost: the new thumb takes it)
        if (inStickZone(x, y) && !me.dead) {
          const [wx, wy] = toWorld(x, y), onMon = stick.id == null && mons.some(m => !m.dead && !m.under && !m.falling && hyp(m.x - wx, m.y - (m.z || 0) * 0.5 - wy) < m.r + 0.6);
          if (!onMon) { Object.assign(stick, { id, ox: x, oy: y, x, y, t0: g.t, far: 0 }); nav.goal = null; nav.mon = null; g.movedOnce = true; return; }
        }
        // anywhere else: one attack toward the tap
        tapAt(x, y);
      },
      move(x, y, id) {
        if (id === stick.id) { stick.x = x; stick.y = y; const dx = x - stick.ox, dy = y - stick.oy, d = hyp(dx, dy); stick.far = Math.max(stick.far, d); if (d > STICK_R) { stick.ox = x - dx / d * STICK_R; stick.oy = y - dy / d * STICK_R; } return; }   // the base trails the thumb
        const h = holds.get(id); if (h) { h.x = x; h.y = y; } },
      up(x, y, id) {
        if (id === stick.id) { const quick = x >= 0 && stick.far < 12 && g.t - stick.t0 < 0.35, ox = stick.ox, oy = stick.oy; stick.id = null; if (quick) tapAt(ox, oy); return; }   // a quick tap there still attacks
        holds.delete(id); },
      key(kk, on) { if (!on) return; if (RIFT && (kk === 'tap' || kk === 'up' || kk === 'jump') && RIFT.tap(0, 0)) return; if (RIFT && RIFT.hud && RIFT.hud()) { if (kk === 'ab2' || kk === 'ab1') RIFT.act(); if (kk !== 'tap') return; } if (kk === 'swap') { switchNext(); return; } if (kk === 'ab2') useUlt(); else if (kk === 'dodge') dodge(); else if (kk === 'ab1' || kk === 'jump' || kk === 'drop') useStrong('strong'); else if (kk === 'ab3') useStrong('strong2'); else if (kk === 'ab4') useStrong('strong3'); else if (kk === 'ab5') { if (AN) AN.summon(); } else if (kk === 'tap') { g.tapAim = Object.assign(aim(), { key: true }); g.tapBuf = 0.3; if (tryFire(g.tapAim)) g.tapBuf = 0; } g.movedOnce = true; },
      update, draw,
      idle(dt) { update(dt * 0.5); },
    };
  },
};
