/* ---------- the Tower's floor rules, by band (never on a Super Fiend's floor) ----------
   21-39  keys: four keys lie about the floor, each behind a challenge of its own (hold a ward for a minute, slay a keeper
          and its mob, gather five shards against the clock, close a rift's waves); the boss comes only once all four are
          held and the monsters are down.
   41-59  four guardians: when the monsters are down, four floor bosses drop in; all four must fall.
   61-79  a curse on the party for the floor, one of: withering (HP and MP drain), no healing, no skills, no Ultimates,
          no summons, bare (accessories do nothing), bound (no switching), barren (no power stones).
   81-99  a boon for the monsters (twice the health, blows half again as hard, twice as fast, or twice as many), and four
          lesser bosses roam the floor on top of its boss.
   101-119 chaos: a curse and a boon together, and the keys; one time in ten the fortune turns: the party gets a boon
          (fury, haste, surge, regeneration or iron skin) and the monsters a bane (frail, weak, slow or thinned).
   Everything rolled from the floor's seed, so a floor is the same floor if it is played again from its seed */
const DUN_CURSES = [
  { id: 'drain', name: 'WITHERING', sub: 'HP and MP drain away', short: 'Withering' },
  { id: 'noheal', name: 'NO HEALING', sub: 'Nothing restores HP', short: 'No healing' },
  { id: 'noskill', name: 'NO SKILLS', sub: 'Strong attacks are sealed', short: 'No skills' },
  { id: 'noult', name: 'NO ULTIMATES', sub: 'Ultimates are sealed', short: 'No ults' },
  { id: 'nosummon', name: 'NO SUMMONS', sub: 'Animas cannot answer', short: 'No summons' },
  { id: 'noacc', name: 'BARE', sub: 'Accessories do nothing', short: 'Bare' },
  { id: 'noswitch', name: 'BOUND', sub: 'No switching pets', short: 'Bound' },
  { id: 'nostone', name: 'BARREN', sub: 'No power stones drop', short: 'Barren' },
];
const DUN_BOONS_M = [
  { id: 'tough', name: 'HARDY MONSTERS', sub: 'Twice the health', short: 'Hardy', hp: 2 },
  { id: 'fierce', name: 'FIERCE MONSTERS', sub: 'Blows half again as hard', short: 'Fierce', dmg: 1.5 },
  { id: 'swift', name: 'SWIFT MONSTERS', sub: 'Twice as fast', short: 'Swift', spd: 2 },
  { id: 'horde', name: 'A HORDE', sub: 'Twice as many', short: 'Horde', count: 2 },
];
const DUN_BANES_M = [
  { id: 'frail', name: 'FRAIL MONSTERS', sub: 'Half the health', short: 'Frail', hp: 0.5 },
  { id: 'weak', name: 'WEAK MONSTERS', sub: 'Blows at half strength', short: 'Weak', dmg: 0.5 },
  { id: 'slow', name: 'SLOW MONSTERS', sub: 'Half as fast', short: 'Slow', spd: 0.5 },
  { id: 'thinned', name: 'THINNED RANKS', sub: 'Half as many', short: 'Thinned', count: 0.5 },
];
const DUN_BOONS_P = [
  { id: 'fury', name: 'FURY', sub: 'Blows hit half again as hard', short: 'Fury', dmg: 1.5 },
  { id: 'haste', name: 'HASTE', sub: 'Move a third faster', short: 'Haste', spd: 1.3 },
  { id: 'surge', name: 'SURGE', sub: 'Cooldowns twice as quick', short: 'Surge', cd: 2 },
  { id: 'regen', name: 'REGENERATION', sub: 'HP and MP return over time', short: 'Regen', regen: 1 },
  { id: 'ironskin', name: 'IRON SKIN', sub: 'Blows taken do 40% less', short: 'Iron skin', def: 0.4 },
];
const KEY_KINDS = [
  { id: 'ward', name: 'HOLD THE WARD', sub: 'Keep the ward whole for 60 seconds', t: 60 },
  { id: 'keeper', name: 'SLAY THE KEEPER', sub: 'The keeper and its mob hold the key' },
  { id: 'shards', name: 'GATHER THE SHARDS', sub: 'Five shards, 45 seconds', t: 45, n: 5 },
  { id: 'rift', name: 'CLOSE THE RIFT', sub: 'Beat back three waves' },
];
/* what a floor rolls: its band's picks (R: the floor's seeded random) */
function rollFloorRules(F, R) {
  const pick = L => L[Math.floor(R() * L.length)], out = { band: F.band, curse: null, mboon: null, mbane: null, pboon: null, reversed: false, keys: false, four: false, minis: false, mHp: 1, mDmg: 1, mSpd: 1, mCount: 1 };
  if (!F.band) return out;
  if (F.band === 'keys') out.keys = true;
  else if (F.band === 'four') out.four = true;
  else if (F.band === 'curse' || F.band === 'rcurse') out.curse = pick(DUN_CURSES);
  else if (F.band === 'rboon') out.mboon = pick(DUN_BOONS_M);   // (a rift's third section: the boon alone, no lesser bosses)
  else if (F.band === 'rrand') {   // (a rift floor of surprises: one of seven hands, for the pets or the monsters or both)
    const k = Math.floor(R() * 7);
    if (k === 0) out.curse = pick(DUN_CURSES); else if (k === 1) out.mboon = pick(DUN_BOONS_M); else if (k === 2) out.pboon = pick(DUN_BOONS_P); else if (k === 3) out.mbane = pick(DUN_BANES_M);
    else if (k === 4) { out.curse = pick(DUN_CURSES); out.mboon = pick(DUN_BOONS_M); } else if (k === 5) { out.reversed = true; out.pboon = pick(DUN_BOONS_P); out.mbane = pick(DUN_BANES_M); } else { out.pboon = pick(DUN_BOONS_P); out.curse = pick(DUN_CURSES); }
  }
  else if (F.band === 'boon') { out.mboon = pick(DUN_BOONS_M); out.minis = true; }
  else if (F.band === 'chaos') {
    out.keys = true;
    if (R() < 0.1) { out.reversed = true; out.pboon = pick(DUN_BOONS_P); out.mbane = pick(DUN_BANES_M); }
    else { out.curse = pick(DUN_CURSES); out.mboon = pick(DUN_BOONS_M); }
  }
  const B = out.mboon || out.mbane; if (B) { out.mHp = B.hp || 1; out.mDmg = B.dmg || 1; out.mSpd = B.spd || 1; out.mCount = B.count || 1; }
  return out;
}

const DunRules = (() => {
  function create(X) {
    const { F, M, me, g, mons, R } = X, RU = F.rules || rollFloorRules(F, R), keys = [], S = { keys, shown: false, regenT: 0, drainT: 0 };
    const cur = id => !!(RU.curse && RU.curse.id === id), pb = RU.pboon || {};
    // the keys: one in each of four rooms, far from the start, each with its challenge
    if (RU.keys) {
      const rooms = (M.rooms || []).map((r, i) => ({ r, i })).filter(o => o.i !== 0 && !o.r.arena && o.r.w * o.r.h >= 20);
      rooms.sort((a, b) => dist(b.r) - dist(a.r));
      const picks = []; for (const o of rooms) { if (picks.length >= 4) break; picks.push(o); }
      // (fewer rooms than keys on a small floor: the rest share rooms)
      while (picks.length < 4 && rooms.length) picks.push(rooms[picks.length % rooms.length]);
      picks.forEach((o, i) => { const cx0 = o.r.x + o.r.w / 2, cy0 = o.r.y + o.r.h / 2, c = X.freeSpot(cx0 + (R() - 0.5) * 2, cy0 + (R() - 0.5) * 2, 0.5) || { x: cx0 + 0.5, y: cy0 + 0.5 }, kind = KEY_KINDS[(Math.floor(R() * KEY_KINDS.length) + i) % KEY_KINDS.length];
        keys.push({ i, x: c.x, y: c.y, room: o.i, kind, st: 'idle', t: 0, hp: 0, maxhp: 1, waves: 0, spawned: [], shards: [], keeper: null, ph: R() * 6.283, failT: 0 }); });
    }
    function dist(r) { return Math.hypot(r.x + r.w / 2 - M.start.x, r.y + r.h / 2 - M.start.y); }
    const held = () => keys.filter(k => k.st === 'done').length;
    const keysDone = () => !RU.keys || held() >= 4;
    const col = '#FFE37A', KC = '#FFD447';
    /* the floor's cards at its start: what the floor holds, one after another */
    function announce() {
      if (S.shown) return; S.shown = true; let at = 0.3;
      const card = (a, b, c2) => { X.after(at, () => X.banner(a, b, c2, 3, true, true)); at += 2.2; };
      if (RU.reversed) card('FORTUNE REVERSED', 'The tide turns in your favour', '#FFE37A');
      if (RU.curse) card('CURSE: ' + RU.curse.name, RU.curse.sub, '#E07BF0');
      if (RU.mboon) card(RU.mboon.name, RU.mboon.sub, '#FF5C5C');
      if (RU.pboon) card('BOON: ' + RU.pboon.name, RU.pboon.sub, '#8FE0A6');
      if (RU.mbane) card(RU.mbane.name, RU.mbane.sub, '#8FE0A6');
      if (RU.keys) card('FIND THE FOUR KEYS', 'Each is held by a challenge', KC);
      if (RU.four) card('FOUR GUARDIANS', 'All four must fall to climb', '#FF9F43');
      if (RU.minis) card('LESSER BOSSES ROAM', 'Four hunt the floor with the monsters', '#FF9F43');
    }
    /* a key's challenge begins when the pet reaches it */
    function begin(k) {
      k.st = 'active'; k.t = 0; k.waves = 0; k.spawned = []; k.failT = 0;
      X.banner('KEY ' + (held() + 1) + ' · ' + k.kind.name, k.kind.sub, KC, 2.4, true); X.flash(0.25, KC); X.sfx.hum();
      X.ring(k.x, k.y, 0.3, 4, 0.8, KC, 0.4);
      if (k.kind.id === 'ward') { k.maxhp = 10; k.hp = 10; }
      if (k.kind.id === 'keeper') { k.keeper = X.lesserBoss(k.x, k.y, 0.5, 'Keeper'); k.spawned.push(k.keeper); wave(k, 6, 2.5); }
      // (the shards scattered about the key, each a few tiles off and apart from the others; in a cramped room, as far as
      // the floor allows)
      if (k.kind.id === 'shards') { k.shards = []; for (let i = 0; i < k.kind.n; i++) { let best = null, bd = -1;
        for (let tr = 0; tr < 10; tr++) { const a = i / k.kind.n * 6.283 + k.ph + (R() - 0.5) * 0.8, d = 2.5 + R() * 4.5, p = X.freeSpot(k.x + Math.cos(a) * d, k.y + Math.sin(a) * d, 0.3) || { x: k.x, y: k.y }; const dd = Math.min(Math.hypot(p.x - k.x, p.y - k.y), ...k.shards.map(q => Math.hypot(p.x - q.x, p.y - q.y))); if (dd > bd) { bd = dd; best = p; } if (dd >= 2) break; }
        k.shards.push({ x: best.x, y: best.y, got: false, ph: R() * 6 }); } }
      if (k.kind.id === 'rift') wave(k, 5, 3);
    }
    function wave(k, n, d) {
      const types = F.types.filter(t => !MON[t].still && t !== 'nest'); if (!types.length) return;
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R() * 0.5, p = X.freeSpot(k.x + Math.cos(a) * d, k.y + Math.sin(a) * d, 0.4) || { x: k.x, y: k.y }, m = X.spawnMon(types[Math.floor(R() * types.length)], p.x, p.y, { aggro: true, pack: 700 + k.i, elite: i === 0 && n >= 5 && k.waves > 0, flank: a }); g.total++; k.spawned.push(m); X.sparks(p.x, p.y, '#E07BF0', 8, 5); }
      k.waves++; X.ring(k.x, k.y, 0.3, d + 0.5, 0.5, '#E07BF0', 0.3);
    }
    function fail(k, why) { k.st = 'idle'; k.failT = 1.2; k.shards = []; X.banner('KEY LOST', why, '#FF5C5C', 1.8); X.sfx.wrong(); }
    function done(k) { k.st = 'done'; X.banner(`KEY ${held()} OF 4`, held() >= 4 ? 'The way to the boss is open' : k.kind.name + ' complete', KC, 2.2, true); X.flash(0.3, KC); X.sfx.fanfare(); X.boom(k.x, k.y, 1.6, KC, '#FFFFFF', { n: 20, shake: 6 }); for (let i = 0; i < 4; i++) X.drop(i ? 'coin' : 'mp', k.x, k.y); }
    function update(dt) {
      if (g.intro <= 0 && !S.shown) announce();
      if (me.dead || g.won) return;
      // the curses and boons that act over time
      if (cur('drain')) { S.drainT += dt; if (S.drainT >= 0.5) { S.drainT -= 0.5; const ST = X.ST(); me.hp = Math.max(1, me.hp - ST.hp * 0.0025); me.mp = Math.max(0, me.mp - ST.mp * 0.0025); } }
      if (pb.regen) { S.regenT += dt; if (S.regenT >= 1) { S.regenT -= 1; const ST = X.ST(); X.heal(ST.hp * 0.01, true); X.gainMP(ST.mp * 0.01); } }
      for (const k of keys) {
        if (k.failT > 0) k.failT -= dt;
        if (k.st === 'idle') { if (k.failT <= 0 && g.intro <= 0 && Math.hypot(me.x - k.x, me.y - k.y) < 1.1) begin(k); continue; }
        if (k.st !== 'active') continue;
        k.t += dt;
        const K = k.kind.id;
        if (K === 'ward') {
          if (k.t >= k.kind.t) { done(k); continue; }
          if (k.t - k.waves * 8 >= 0.5) wave(k, Math.min(6, 3 + Math.floor(F.n / 12)), 6.5);
          // monsters at the ward chip at it
          k.hitT = (k.hitT || 0) - dt; if (k.hitT <= 0) { k.hitT = 0.5; for (const m of mons) if (!m.dead && !m.boss && Math.hypot(m.x - k.x, m.y - k.y) < m.r + 0.9) { k.hp -= 1; X.sparks(k.x, k.y, '#FF5C5C', 6, 4); X.shake(3, 0.1); break; } }
          if (k.hp <= 0) { fail(k, 'The ward was broken'); X.boom(k.x, k.y, 1.4, '#FF5C5C', '#FFFFFF', { n: 16, shake: 6 }); }
        } else if (K === 'keeper') {
          if (k.keeper && k.keeper.dead) done(k);
        } else if (K === 'shards') {
          for (const s of k.shards) if (!s.got && Math.hypot(me.x - s.x, me.y - s.y) < 0.9) { s.got = true; X.sparks(s.x, s.y, KC, 10, 5); X.text(s.x, s.y - 0.6, `${k.shards.filter(q => q.got).length}/${k.kind.n}`, KC, 14); X.sfx.chirp(); }
          if (k.shards.every(s => s.got)) { done(k); continue; }
          if (k.t >= k.kind.t) fail(k, 'The shards faded');
        } else if (K === 'rift') {
          const alive = k.spawned.filter(m => !m.dead).length;
          if (k.waves < 3 && alive <= 1 && k.t - (k.lastW || 0) > 2) { k.lastW = k.t; wave(k, 5, 3); }
          if (k.waves >= 3 && alive === 0) done(k);
        }
      }
    }
    /* drawing on the floor (under the monsters): the keys, wards, shards and rifts */
    function drawGround(c) {
      const T = X.Tz();
      for (const k of keys) {
        const Xs = X.sx(k.x), Ys = X.sy(k.y);
        if (k.st === 'done') continue;
        const pulse = 0.5 + 0.5 * Math.sin(g.t * 3 + k.ph);
        c.save(); c.globalCompositeOperation = 'lighter';
        if (k.st === 'active' && k.kind.id === 'ward') { c.globalAlpha = 0.25 + 0.15 * pulse; blitSized(c, shockSprite('#8FE3F0'), Xs - T * 1.6, Ys - T * 1.6 * 0.5, T * 3.2, T * 3.2 * 0.5); }
        if (k.st === 'active' && k.kind.id === 'rift') { c.globalAlpha = 0.5; blitSized(c, glowSprite('#E07BF0'), Xs - T * 1.5, Ys - T * 1.5, T * 3, T * 3); }
        c.globalAlpha = 0.35 + 0.25 * pulse; blitSized(c, glowSprite(KC), Xs - T * 0.9, Ys - T * 0.9, T * 1.8, T * 1.8);
        c.restore();
        if (k.st === 'active' && k.kind.id === 'shards') for (const s of k.shards) { if (s.got) continue; const xs = X.sx(s.x), ys = X.sy(s.y) - T * 0.25 - Math.sin(g.t * 4 + s.ph) * T * 0.08; c.save(); c.translate(xs, ys); c.rotate(g.t * 1.5 + s.ph); c.fillStyle = '#FFF4C0'; c.strokeStyle = '#2B2433'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -T * 0.22); c.lineTo(T * 0.13, 0); c.lineTo(0, T * 0.22); c.lineTo(-T * 0.13, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }
      }
    }
    /* the keys themselves, among the things on the floor (sorted by y): a key standing on a small plinth, lifting a little */
    function drawKey(c, k) {
      const T = X.Tz(), Xs = X.sx(k.x), Ys = X.sy(k.y), lift = T * (0.35 + 0.06 * Math.sin(g.t * 2.2 + k.ph)), r = T * 0.26;
      c.save();
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, r * 1.1, r * 0.4, 0, 0, 6.283); c.fill();
      c.fillStyle = '#3A4466'; c.strokeStyle = '#2B2433'; c.lineWidth = 1.5; GFX.rr(c, Xs - r * 1.1, Ys - T * 0.12, r * 2.2, T * 0.22, 3); c.fill(); c.stroke();
      c.translate(Xs, Ys - lift); c.rotate(Math.sin(g.t * 1.3 + k.ph) * 0.2);
      c.fillStyle = k.st === 'active' ? '#FFFFFF' : KC; c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1.5, T * 0.05);
      c.beginPath(); c.arc(0, -r * 0.55, r * 0.5, 0, 6.283); c.fill(); c.stroke(); c.fillStyle = '#2B2433'; c.beginPath(); c.arc(0, -r * 0.55, r * 0.18, 0, 6.283); c.fill();
      c.fillStyle = k.st === 'active' ? '#FFFFFF' : KC; GFX.rr(c, -r * 0.14, -r * 0.1, r * 0.28, r * 1.1, 2); c.fill(); c.stroke(); c.fillRect(0, r * 0.45, r * 0.4, r * 0.16); c.fillRect(0, r * 0.75, r * 0.3, r * 0.16);
      c.restore();
      if (k.st === 'active' && (k.kind.id === 'ward' || k.kind.id === 'shards')) {
        const left = Math.max(0, k.kind.t - k.t), w = T * 1.6; c.save(); c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText(Math.ceil(left) + 's', Xs, Ys - T * 1.2); c.fillText(Math.ceil(left) + 's', Xs, Ys - T * 1.2);
        if (k.kind.id === 'ward') { c.fillStyle = 'rgba(0,0,0,.45)'; GFX.rr(c, Xs - w / 2, Ys - T * 1.05, w, 6, 3); c.fill(); c.fillStyle = '#8FE3F0'; GFX.rr(c, Xs - w / 2, Ys - T * 1.05, w * Math.max(0, k.hp / k.maxhp), 6, 3); c.fill(); }
        c.restore();
      }
    }
    const label = () => { const L = []; if (RU.keys) L.push(`Keys ${held()}/4`); if (RU.curse) L.push(RU.curse.short); if (RU.mboon) L.push(RU.mboon.short); if (RU.pboon) L.push(RU.pboon.short); if (RU.mbane) L.push(RU.mbane.short); return L.join(' · '); };
    return { RU, keys, keysDone, held, update, drawGround, drawKey, label,
      blocks: id => cur(id), dmgK: () => pb.dmg || 1, spdK: () => pb.spd || 1, cdK: () => pb.cd || 1, defK: () => pb.def || 0,
      ents: () => keys.filter(k => k.st !== 'done').map(k => [k.y, k]) };
  }
  return { create, roll: rollFloorRules };
})();
