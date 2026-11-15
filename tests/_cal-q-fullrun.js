// Rift 0 QA (worker Q): the whole Blackfire Caldera played end to end the way a player would, through the real stage flow:
// the Rifts tab, the caldera's card and its Enter button, each stage's ready panel (Start), the stage played by a bot through
// the game's own controls (the stick, taps, the dodge, the strong skill), the end panel's next-stage button, and so on through
// all nine stages to the seal. God mode off. The game is stepped by hand at 1/60 s, so every time is game time.
// Per stage: game seconds, monsters killed, damage taken, rescues (health refilled at <15%: a player drinking a potion /
// kiting away; counted), knock-outs (a real wipe: the stage is retried from its own start), page errors, stalls (no progress
// for 60 s of game time; after 180 s the stage is forced on and marked STUCK), and at the end the seal and the reward.
// usage: HTML=test-calQ.html LVL=1 node tests/_cal-q-fullrun.js     env: LVL (1, or 44 the user's pet), STAGE (evolution
//   stage for LVL > 1, default 2), FROM / TO (stage range, default 0..8), SHOTS=1 (393x852 @2x pictures to shots/cal-q-*),
//   WIPE=n (a deliberate wipe at the start of stage n: checks that only that stage restarts), MAXT (game s per stage, 900)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
process.env.HTML = process.env.HTML || 'test-calQ.html';
const LVL = +(process.env.LVL || 1), SHOTS = !!process.env.SHOTS, FROM = +(process.env.FROM || 0), TO = process.env.TO != null ? +process.env.TO : 8;
const WIPE = process.env.WIPE != null ? +process.env.WIPE : -1, MAXT = +(process.env.MAXT || 900);
const tag = `L${LVL}`;

/* ---------------- the bots, installed in the page (window.__QB) ---------------- */
function installBots() {
  const QB = window.__QB = {};
  QB.begin = (opts) => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, kind = D.F.rift.kind, stage = D.F.rift.stage;
    const run = G.update; G.update = () => {};
    const Q = window.__Q = { P, A, G, D, g, me, kind, stage, run, opts, t0: g.t, kills0: g.kills || 0, dmg: 0, prevHp: me.hp, rescues: 0, kos: 0, minHp: 1,
      stalls: [], lastSig: '', lastProg: g.t, stuck: false, forced: null, marks: {}, lastTap: -9, banners: [], bannerN: 0, shotWant: null, hitsBy: {}, dodges: 0, strongs: 0 };
    QB.makeBot(Q);
    return { kind, stage, name: D.F.rift.name, hp: Math.round(D.ST.hp), atk: Math.round(D.ST.atk), L: D.ST.L, normal: D.KITR.normal && D.KITR.normal.key, strong: D.KITR.strong && D.KITR.strong.key, ult: D.KITR.ult && D.KITR.ult.key };
  };
  QB.end = () => { const Q = window.__Q; if (Q && Q.G.update !== Q.run) Q.G.update = Q.run; const D = Q.D; if (D.stick.id === 'bot' || D.stick.id === 88) { D.stick.id = null; D.stick.x = D.stick.y = 0; } };
  /* one chunk of play: up to `secs` of game time; returns early on the stage's end, a wipe, or a picture wanted */
  QB.step = async (secs) => {
    const Q = window.__Q, { D, g, me, A } = Q; const c0 = g.t; let i = 0;
    while (g.t - c0 < secs) {
      if (A.state !== 'play') return QB.report('ended');
      if (g.over) return QB.report('over');
      if (me.dead) { Q.kos++; return QB.report('wipe'); }
      if (!g.won) { try { Q.bot(1 / 60); } catch (e) { Q.botErr = (Q.botErr || '') + e.message + ' | '; } }
      Q.run(1 / 60);
      // bookkeeping
      if (me.hp < Q.prevHp - 0.01 && !me.dead) { const d = Q.prevHp - me.hp; Q.dmg += d; let src = 'other', bd = 4; for (const m of D.mons) { if (m.dead) continue; const dd = Math.hypot(m.x - me.x, m.y - me.y) - (m.r || 0); if (dd < bd) { bd = dd; src = (m.calChamp ? 'CHAMP:' : '') + (m.boss ? 'boss' : m.type); } } if (D.eshots.some(e => Math.hypot(e.x - me.x, e.y - me.y) < 1.2)) src = 'shot~' + src; Q.hitsBy[src] = Math.round((Q.hitsBy[src] || 0) + d); } Q.prevHp = me.hp;
      if (!me.dead) Q.minHp = Math.min(Q.minHp, me.hp / D.ST.hp);
      if (!me.dead && me.hp < D.ST.hp * 0.15 && !Q.opts.noRescue) { Q.rescues++; me.hp = D.ST.hp; Q.prevHp = me.hp; }
      for (const b of D.banners) if (!b.__q) { b.__q = 1; Q.bannerN++; Q.banners.push([+(g.t - Q.t0).toFixed(1), b.s, b.sub || '']); }
      // progress: kills, the boss's health, the goal, the stage's state
      if (i % 30 === 0) { const sig = QB.sig(Q); if (sig !== Q.lastSig) { Q.lastSig = sig; Q.lastProg = g.t; Q.stallOpen = null; }
        else { const idle = g.t - Q.lastProg; if (idle > 60 && !Q.stallOpen) { Q.stallOpen = { at: +(g.t - Q.t0).toFixed(0), pos: [+me.x.toFixed(1), +me.y.toFixed(1)], goal: QB.goal(), mons: D.mons.filter(m => !m.dead && !m.boss).length, reserve: (g.reserve || []).length, near: D.mons.filter(m => !m.dead && !m.boss).map(m => ({ t: m.type, x: +m.x.toFixed(1), y: +m.y.toFixed(1), d: +Math.hypot(m.x - me.x, m.y - me.y).toFixed(1), walk: !!D.walkAt(Math.floor(m.x), Math.floor(m.y)), st: m.state, aggro: !!m.aggro })).sort((a, b) => a.d - b.d).slice(0, 4) }; Q.stalls.push(Q.stallOpen); }
          if (idle > 180 && !g.won) { QB.force(Q); Q.lastProg = g.t; } } }
      if (g.t - Q.t0 > Q.opts.maxT && !g.won) { QB.force(Q, 'time cap'); }
      if (Q.shotWant && Q.shotWant()) { Q.shotWant = null; return QB.report('shot'); }
      if (++i % 300 === 0) await new Promise(r => setTimeout(r, 0));
    }
    return QB.report('chunk');
  };
  QB.goal = () => { const e = document.getElementById('arcGoal'); return e ? e.textContent : ''; };
  QB.sig = Q => { const { D, g } = Q, b = g.boss; let s = ''; try { const mod = D.RIFT && D.RIFT.self && D.RIFT.self.mod; if (mod && mod.S) s = JSON.stringify(mod.S, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) && k && (v.x != null || v.draw)) ? undefined : typeof v === 'number' ? Math.round(v * 2) / 2 : v).slice(0, 600); } catch (e) {}
    return [g.kills, b ? Math.round(b.hp / b.maxhp * 200) : -1, QB.goal(), D.RIFT && D.RIFT.done, D.RIFT && D.RIFT.exit ? 1 : 0, D.mons.filter(m => !m.dead).length, (D.RIFT ? D.RIFT.objs : []).map(o => o.used ? 1 : 0).join(''), s].join('|'); };
  /* a stuck stage forced on so the run can go on (marked) */
  QB.force = (Q, why) => { const { D, g } = Q; if (Q.stuck) return; Q.stuck = why || 'no progress 180 s'; Q.forced = { at: +(g.t - Q.t0).toFixed(0), pos: [+Q.me.x.toFixed(1), +Q.me.y.toFixed(1)], goal: QB.goal(), why: Q.stuck };
    for (const m of D.mons) if (!m.dead && !m.boss) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); }
    for (const m of g.reserve || []) m.hp = 0;
    const b = g.boss; if (b && !b.dead) { b.under = false; b.locked = false; b.guardA = null; D.hitMon(b, 1e12, { flat: true }); }
    const self = D.RIFT && D.RIFT.self; if (self && !self.done && Q.kind !== 'boss') { self.done = true; }
    Q.bot = () => { const e = D.RIFT && D.RIFT.exit; if (e) { Q.me.x = e.x; Q.me.y = e.y; } }; };
  QB.report = why => { const Q = window.__Q, { D, g, me } = Q, b = g.boss;
    return { why, t: +(g.t - Q.t0).toFixed(1), won: !!g.won, over: !!g.over, dead: !!me.dead, kills: (g.kills || 0) - Q.kills0, dmg: Math.round(Q.dmg), hp: Math.round(me.hp), maxHp: Math.round(D.ST.hp), minHp: +Q.minHp.toFixed(2), rescues: Q.rescues, kos: Q.kos,
      stalls: Q.stalls, forced: Q.forced, goal: QB.goal(), boss: b ? { hp: +(b.hp / b.maxhp).toFixed(3), dead: !!b.dead, maxhp: Math.round(b.maxhp) } : null, left: D.mons.filter(m => !m.dead && !m.boss).length + ((g.reserve && g.reserve.length) || 0),
      hitsBy: Q.hitsBy, banners: Q.bannerN, bannerList: Q.banners.slice(0, 40), botErr: Q.botErr || null, marks: Q.marks, dodges: Q.dodges, strongs: Q.strongs, L: D.ST.L, pos: [+me.x.toFixed(1), +me.y.toFixed(1)], extra: Q.extra ? Q.extra() : null }; };

  /* ---- controls: the stick (held at the bottom left, as a thumb), taps on the screen, the dodge ---- */
  QB.controls = Q => { const { G, D, g, me, A } = Q, W = A.W, H = A.H, hx = 72, hy = H - 100;
    const stop = () => { if (D.stick.id === 88) G.up(hx, hy, 88); };
    const push = (dx, dy) => { const l = Math.hypot(dx, dy); if (l < 1e-3) return stop(); if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + dx / l * 44, hy + dy / l * 44, 88); };
    // walk toward (tx, ty) along the floor's paths; true when within keep
    const steer = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y); if (d <= keep) { stop(); return true; } const sv = D.steerTo(tx, ty); if (!sv) { push(tx - me.x, ty - me.y); return false; } push(sv[0], sv[1]); return false; };
    // straight at it (open arenas)
    const go = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y); if (d <= (keep || 0.25)) { stop(); return true; } push(tx - me.x, ty - me.y); return false; };
    const tapW = (wx, wy) => { const X = Math.max(10, Math.min(W - 10, (wx - me.x) * 40 * g.zoom + W / 2)), Y = Math.max(10, Math.min(H - 10, (wy - me.y) * 40 * g.zoom + H / 2)); G.down(X, Y, 77); G.up(X, Y, 77); };
    // an aimed tap at a target (a weak point, a bomb): the game's own tap aim, as a tap on it sets
    const tapT = t => { if (!t) return; const dx = t.x - me.x, dy = t.y - me.y, d = Math.hypot(dx, dy) || 1; g.tapAim = { t, x: dx / d, y: dy / d, a: Math.atan2(dy, dx), tap: true, px: t.x, py: t.y }; g.tapBuf = 0.35; };
    const dodge = () => { if (g.dodgeCd <= 0 && !me.dodge) { D.dodge(); Q.dodges++; } };
    const strong = () => { if (g.cdS <= 0 && me.mp > 25 && D.useStrong) { try { const c0 = g.cdS; D.useStrong('strong'); if (g.cdS !== c0) Q.strongs++; } catch (e) {} } };
    return { stop, push, steer, go, tapW, tapT, dodge, strong }; };

  QB.makeBot = Q => {
    const { D, g, me, kind } = Q, C = QB.controls(Q), mark = (k, c) => { if (c && Q.marks[k] == null) Q.marks[k] = +(g.t - Q.t0).toFixed(1); };
    const exitWalk = () => { const e = D.RIFT && D.RIFT.exit; if (e) { mark('exitOpen', 1); C.steer(e.x, e.y, 0); return true; } return false; };
    const nearest = (range, filt) => { let best = null, bd = 1e9; for (const m of D.mons) { if (m.dead || m.boss || (filt && !filt(m))) continue; if (m.cal && (m.cal.st === 'red' || m.cal.st === 'hover' || m.cal.st === 'land')) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } } return best && bd <= range ? [best, bd] : null; };
    const fight = (range, filt) => { const n = nearest(range, filt); if (!n) return false; const [m, d] = n; C.steer(m.x, m.y, 1.6); if (g.t - Q.lastTap > 0.2 && d < 6) { Q.lastTap = g.t; C.tapW(m.x, m.y); } if (me.mp >= (D.KITR.ult ? D.KITR.ult.cost : 1e9) && g.cdU <= 0 && D.useUlt && d < 5) { try { D.useUlt(); } catch (e) {} } return true; };
    // a ticking bomb larva close by: step away (the careless player of C's bot does not; this one does, as the lesson says)
    const bombAway = () => { for (const m of D.mons) { if (m.dead || !m.cal) continue; if ((m.cal.st === 'red' || m.cal.st === 'armed') && Math.hypot(m.x - me.x, m.y - me.y) < 2.6) { C.push(me.x - m.x, me.y - m.y); return true; } } return false; };

    if (kind === 'fight') {
      // the generated dungeon: the nearest monster, all the way through, then the exit (the champion is one of them)
      Q.bot = () => { mark('champDead', D.RIFT.self.amb && D.RIFT.self.amb.C && D.RIFT.self.amb.C.champ && D.RIFT.self.amb.C.champ.dead);
        if (bombAway()) return; if (fight(1e9)) return; if (g.reserve && g.reserve.length) { C.stop(); return; } exitWalk(); };
      Q.extra = () => { const C2 = D.RIFT.self.amb && D.RIFT.self.amb.C, ch = C2 && C2.champ; return { champ: ch ? { name: ch.calChamp, dead: !!ch.dead, x: +ch.x.toFixed(1), y: +ch.y.toFixed(1) } : null, reserve: (g.reserve || []).length, exit: !!D.RIFT.exit }; };
      return; }
    if (kind === 'puzzle') return QB.puzzleBot(Q, C, mark, fight, exitWalk);
    if (kind === 'boss') { const b = g.boss || D.mons.find(m => m.boss); const id = D.F.fiend && D.F.fiend.id || (b && b.fiend) || ''; const S2 = Q.P.RIFT_BY_ID[D.F.rift.id].stages[D.F.rift.stage], bossKey = (S2 && S2.boss) || id;
      Q.bossKey = String(bossKey);
      // PLAIN=1: ordinary attacks only (no mechanics, no dodging): the hard-lock check
      if (Q.opts.plain) { Q.extra = () => { const M = D.FD && D.FD.FX.mem; return M && M.stat ? { phase: D.FD.S.phase } : null; }; Q.bot = () => { const b2 = g.boss; if (!b2 || b2.dead) return C.stop(); const d = Math.hypot(b2.x - me.x, b2.y - me.y); if (d > 5) C.go(b2.x, b2.y + 3.5, 0.3); else if (d < 3) C.push(me.x - b2.x, me.y - b2.y); else C.stop(); C.tapT(b2); }; return; }
      if (/flan/.test(Q.bossKey)) return QB.flanBot(Q, C, mark);
      if (/bomb/.test(Q.bossKey)) return QB.bombBot(Q, C, mark);
      return QB.ifritBot(Q, C, mark); }
  };

  /* ---- the trials (worker S's practiced-run bot, through the same controls) ---- */
  QB.puzzleBot = (Q, C, mark, fight, exitWalk) => {
    const { D, g, me } = Q, mod = D.RIFT.self.mod, B = mod.brood, objs = k => D.RIFT.objs.filter(o => o.kind === k), stage = D.F.rift.name;
    let away = null, lastCount = -1;
    const useAt = (o, count, side) => { if (away) { if (C.steer(away.x, away.y, 0.3) || Math.hypot(me.x - away.x, me.y - away.y) < 0.4) away = null; return; }
      if (lastCount >= 0 && count !== lastCount) { lastCount = -1; away = { x: o.x, y: o.y + 2.4 }; return; }
      const tx = o.x + (side || 0), ty = o.y + (side ? 0 : 0.2); if (C.steer(tx, ty, 0.25)) { me.vx = me.vy = 0; if (lastCount < 0) lastCount = count; } };
    const roomGo = () => { const R = B.room && B.room(); if (!R) return false; const p = R.spots[2] || R.spots[0]; return C.steer(p.x, (R.y0 + R.y1) / 2, 1); };
    const ventWait = () => { for (const v of mod.vents || []) { if (!v.live) continue; const ahead = v.y < me.y && v.y > me.y - 2.6 && Math.abs(v.x - me.x) < 2.2, inside = Math.hypot(v.x - me.x, v.y - me.y) < 1.9; if (ahead && !inside && (v.ph === 'warn' || v.ph === 'erupt' || (v.ph === 'idle' && v.t > 1.0))) { C.stop(); return true; } } return false; };
    const shrineThenExit = () => { const st = objs('calspring')[0] || objs('calshrine')[0]; mark('shrineSeen', !!st); if (st && mod.shrine && !mod.shrine.used) { Q.hpBeforeShrine = Q.hpBeforeShrine == null ? me.hp / D.ST.hp : Q.hpBeforeShrine; return useAt(st, 0, 1.2); } mark('shrineUsed', mod.shrine && mod.shrine.used); exitWalk(); };
    const W0 = window.__QB;
    Q.extra = () => ({ brood: B.total, killed: B.killed && B.killed(), S: (() => { const S = mod.S; return { latched: S.latched, solved: S.solved, opened: S.opened, demo: S.demo, falls: S.falls, court: S.court && { hits: S.court.hits, dodged: S.court.n, done: S.court.done } }; })(), shrine: mod.shrine && mod.shrine.used, hpBeforeShrine: Q.hpBeforeShrine != null ? +Q.hpBeforeShrine.toFixed(2) : null });
    if (/Hollows/.test(stage)) Q.bot = () => { const S = mod.S; mark('brood', B.done); mark('latched', S.latched); if (!B.done) { if (fight(30)) return; return roomGo(); }
      if (!S.latched) { if (!S.entered) return C.steer(16.5, 18.5, 0.5); if (S.surge > 0) return C.stop(); if (S.primed) return useAt(objs('calreservoir')[0], S.surge > 0 ? 1 : 0, 1.3); const pc = mod.missing(); if (pc) return useAt(pc.obj, S.turns); return C.steer(16.5, 16, 0.5); }
      shrineThenExit(); };
    else if (/Foundry/.test(stage)) Q.bot = () => { const S = mod.S, Bm = mod.bomb; mark('brood', B.done); mark('bomb', Bm && Bm.returned > 0); mark('solved', S.solved);
      if (Bm && Bm.m && Bm.safe && Bm.safe()) { C.steer(Bm.m.x, Bm.m.y, 1.2); if (g.t - Q.lastTap > 0.26) { Q.lastTap = g.t; C.tapW(Bm.m.x, Bm.m.y); } return; }
      if (!B.done) { if (fight(30)) return; return roomGo(); }
      if (!S.solved) { const plan = mod.ringsPlan(S.rings); const L = mod.levers.find(l => l.id === plan[0]); return useAt(L.obj, S.pulls); }
      if (!S.opened) return C.stop(); shrineThenExit(); };
    else Q.bot = () => { const S = mod.S; mark('brood', B.done); mark('demo', S.demo === 2); if (S.demo < 2) return C.stop();
      if (!B.done) { if (B.wave >= 0 && fight(30)) return; if (fight(2.5)) return; if (ventWait()) return; return roomGo(); }
      const Cc = mod.court; mark('court', Cc && Cc.on); mark('courtDone', Cc && Cc.done);
      if (Cc && !Cc.done) { if (!Cc.on) return C.steer(16.5, 26, 0.5);
        for (const b of Cc.balls) { if (b.res) continue; if (b.kind === 'lob') { const dd = Math.hypot(me.x - b.tx, me.y - b.ty); if (dd < b.R + 0.6) { const a = Math.atan2(me.y - b.ty, me.x - b.tx); return C.steer(b.tx + Math.cos(a) * (b.R + 1.2), b.ty + Math.sin(a) * (b.R + 1.2), 0.1); } continue; }
          const dd = Math.hypot(me.x - b.x, me.y - b.y); if (dd < b.r + 1.0 && !me.dodge) { const v = Math.hypot(b.vx, b.vy) || 1; C.push(-b.vy / v, b.vx / v); Q.G.key('dodge', true); Q.dodges++; return; } }
        return C.steer(16.5, 25.5, 1.2); }
      if (ventWait()) return; shrineThenExit(); };
  };

  /* ---- Fire Flan (after worker F's fight bot): lure into a cooling zone from its plate, strike it brittle, break the
     Crystal Breaker's glowing point, swat Cinderlings off the crystal, step out of marks, take the burst's gap ---- */
  QB.flanBot = (Q, C, mark) => {
    const { D, g, me } = Q; let react = 0, plan = null;
    const FXo = () => D.FD.FX, Mo = () => D.FD.FX.mem;
    Q.extra = () => { const M = Mo(); return M && M.stat ? { phase: D.FD.S.phase, brittle: M.stat.brittle, fields: M.stat.fields, interrupts: M.stat.interrupts, smashes: M.stat.smashes, adds: M.stat.adds } : null; };
    Q.bot = dt => { const b = g.boss; if (!b || !D.FD) { const s = D.M.bossAt || b; if (s) C.go(s.x, s.y + 4, 0.5); return; }
      const FX = FXo(), M = Mo(), A = M.A; if (b.act === 'enter') { C.stop(); return; }
      react -= dt; if (react > 0 && plan) { plan(); return; } react = 0.1;
      const inTele = () => { for (const s of D.FD.S.tele) { if (s.done) continue; if (FX.inShape(s, me.x, me.y, me.r + 0.25)) return s; } for (const z of D.FD.S.hz) if (z.dps && FX.inShape(z, me.x, me.y, me.r)) return z; return null; };
      const away = s => { if (s.shape === 'circle' || !s.shape) { const dx = me.x - s.x, dy = me.y - s.y, d = Math.hypot(dx, dy) || 1; return [s.x + dx / d * ((s.r || 1) + 1.2), s.y + dy / d * ((s.r || 1) + 1.2)]; }
        if (s.shape === 'cone') { const a = s.a + Math.PI; return [b.x + Math.cos(a) * 2.8, b.y + Math.sin(a) * 2.8]; }
        if (s.shape === 'line') { const nx = -Math.sin(s.a), ny = Math.cos(s.a), side = ((me.x - s.x) * nx + (me.y - s.y) * ny) >= 0 ? 1 : -1; return [me.x + nx * side * 2.5, me.y + ny * side * 2.5]; } return [me.x, me.y + 2]; };
      const W = A.wells, w = A.active(), Gp = M.act && M.act.grip, adds = D.mons.filter(m => m.type === 'cinderling' && !m.dead && !(m.born > 0));
      mark('brittle', M.brittle); mark('phase2', D.FD.S.phase >= 2); mark('phase3', D.FD.S.phase >= 3);
      const wave = M.waves && M.waves[0]; if (wave) { Q.br = 'wave'; const ga = wave.gap, R0 = Math.hypot(me.x - wave.x, me.y - wave.y), rr = Math.max(4, Math.min(9, R0)); const tx = wave.x + Math.cos(ga) * rr, ty = wave.y + Math.sin(ga) * rr; plan = () => C.go(tx, ty, 0.2); return plan(); }
      const s = inTele(); if (s) { Q.br = 'tele'; const [ax, ay] = away(s); plan = () => C.go(ax, ay, 0.2); return plan(); }
      if (Gp && Gp.on) { Q.br = 'grip'; const wk = D.mons.find(m => m.kind === 'weak' && !m.dead); plan = () => { const d = Math.hypot(Gp.x - me.x, Gp.y - me.y); if (d > 2.5) C.go(Gp.x, Gp.y + 1.2, 0.3); else C.stop(); C.tapT(wk || b); }; return plan(); }
      if (w && adds.length) { const q = adds.sort((p, q2) => Math.hypot(p.x - w.x, p.y - w.y) - Math.hypot(q2.x - w.x, q2.y - w.y))[0]; if (Math.hypot(q.x - w.x, q.y - w.y) < 3.5 || M.brittle === false) { Q.br = 'adds'; plan = () => { if (Math.hypot(q.x - me.x, q.y - me.y) > 2.2) C.go(q.x, q.y + 1, 0.3); else C.stop(); C.tapT(q); }; return plan(); } }
      if (M.brittle) { Q.br = 'brittle'; plan = () => { const d = Math.hypot(b.x - me.x, b.y - me.y); if (d > 3.0) C.go(b.x, b.y + 2.6, 0.3); else C.stop(); C.tapT(b); C.strong(); }; return plan(); }
      if (w) { Q.br = 'field'; plan = () => { const ax = w.zx - b.x, ay = w.zy - b.y, ad = Math.hypot(ax, ay) || 1, inZ = ad < w.zr; const tx = w.zx + ax / ad * 1.4, ty = w.zy + ay / ad * 1.4; if (!inZ) C.go(tx, ty, 0.3); else if (Math.hypot(b.x - me.x, b.y - me.y) > 3) C.go(b.x + (me.x - b.x) * 0.5, b.y + (me.y - b.y) * 0.5, 0.3); else C.stop(); C.tapT(adds[0] || b); }; return plan(); }
      let best = null, bd = 1e9; for (const q of W) if (A.canUse(q.i)) { const d = Math.hypot(q.zx - b.x, q.zy - b.y) + Math.hypot(q.px - me.x, q.py - me.y) * 0.4; if (d < bd) { bd = d; best = q; } }
      if (best) { Q.br = 'plate'; plan = () => { const onP = C.go(best.px, best.py, 0.12); if (onP) { me.vx = me.vy = 0; } else C.tapT(adds[0] || b); }; return plan(); }
      Q.br = 'wait'; plan = () => { const d = Math.hypot(b.x - me.x, b.y - me.y); C.tapT(adds[0] || b); if (d < 3.5) { const a = Math.atan2(me.y - b.y, me.x - b.x); C.go(b.x + Math.cos(a) * 5, b.y + Math.sin(a) * 5, 0.3); } else C.stop(); }; return plan(); };
  };

  /* ---- the Bomb King (after worker B's bot): return every bomb it can, keep clear of armed ones, take the volley's gap
     and the orbit's opening, strike the core when open, return the supplied bomb in a detonation (else shelter) ---- */
  QB.bombBot = (Q, C, mark) => {
    const { D, g, me } = Q, DEF = Q.P.FIEND_DEFS.calbomb;
    Q.extra = () => { const M = D.FD && D.FD.FX.mem; return M && M.stat ? Object.assign({ phase: D.FD.S.phase }, M.stat) : null; };
    Q.bot = () => { const b = g.boss; if (!b || !D.FD || !D.FD.S.started) { const s = D.M.bossAt || b; if (s) C.go(s.x, s.y + 4, 0.5); return; }
      const FX = D.FD.FX, M = FX.mem, TM = DEF.TM, SH = DEF.SHELTERS, CC = FX.C; if (b.act === 'enter') return C.stop();
      mark('phase2', D.FD.S.phase >= 2); mark('phase3', D.FD.S.phase >= 3);
      const A = M.ac, counting = A && A.k === 'charge' && A.phase === 'count'; if (counting) mark('detonation', 1);
      const core = () => FX.S.objs.find(o => o.isCore && !o.dead);
      let mv = null;
      for (const q of M.bombs) if (q.st === 'armed' && Math.hypot(me.x - q.x, me.y - q.y) < TM.larvaR + 1.1) mv = [me.x - q.x, me.y - q.y];
      const orb = FX.S.hz.find(z => z.kind === 'orbit'); if (!mv && orb) { const d = Math.hypot(me.x - orb.x, me.y - orb.y), a = Math.atan2(me.y - orb.y, me.x - orb.x), da = Math.atan2(Math.sin(orb.ga - a), Math.cos(orb.ga - a));
        if (d > orb.r - 0.6 && d < orb.r + 3.2 && Math.abs(da) > TM.orbitGap * 0.7) { mv = [-Math.sin(a) * Math.sign(da), Math.cos(a) * Math.sign(da)]; if (d - orb.r < 1.0) C.dodge(); } }
      if (!mv && M.ac && M.ac.lanes && M.ac.o) for (const k of M.ac.lanes) { const a = M.ac.a + k * TM.spread, s = { shape: 'line', x: M.ac.o.x, y: M.ac.o.y, a, len: 17, w: TM.volleyR * 2 }; if (FX.inShape(s, me.x, me.y, me.r + 0.3)) { const px = -Math.sin(a), py = Math.cos(a), side = (me.x - s.x) * px + (me.y - s.y) * py; mv = [px * Math.sign(side || 1), py * Math.sign(side || 1)]; } }
      if (!mv) for (const e of D.eshots) { if (!e.calFire) continue; const rx = me.x - e.x, ry = me.y - e.y, v = Math.hypot(e.vx, e.vy), al = (rx * e.vx + ry * e.vy) / v, of = Math.abs(-rx * e.vy + ry * e.vx) / v; if (al > 0 && al < 3 && of < 0.8) { mv = [-e.vy, e.vx]; if (al < 1.2) C.dodge(); } }
      const ret = M.bombs.filter(q => (q.o || (q.lm && !q.lm.dead)) && (q.st === 'supplied' || (q.st === 'safe' && q.ft < TM.safe - 0.25))).map(q => { q.tg = q.o || q.lm; return q; }).sort((p, q) => (q.sup ? 1 : 0) - (p.sup ? 1 : 0) || Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0];
      let target = null;
      if (counting) { const left = TM.charge - A.t, ns = SH.nearestShelter(CC, me.x, me.y), runT = ns.d / 4.2 + 0.6, useBomb = ret && ret.sup;
        if (!useBomb && left < runT + 1.5) { if (SH.safeOf(CC, me.x, me.y) < 0) C.go(ns.p.x, ns.p.y, 0.4); else C.stop(); C.tapT(core() || b); return; }
        if (useBomb) target = ret.tg; else target = core() || b; }
      else if (ret) target = ret.tg;
      else target = (M.exposed && core()) || b;
      if (mv) C.push(mv[0], mv[1]);
      else if (ret && target === ret.tg) C.go(ret.x, ret.y, 1.3);
      else { const cg = { x: b.x, y: b.y - M.zc * 0.695 }, d = Math.hypot(me.x - cg.x, me.y - cg.y); if (d > 5.5) C.go(cg.x, cg.y + 1, 4.5); else if (d < 3.2) C.push(me.x - cg.x, me.y - cg.y); else C.stop(); }
      C.tapT(target); C.strong(); };
  };

  /* ---- Ifrit (after worker I's bot): dodge every marked blow, strike the chest when open, break the crystal growths,
     shelter at a frost well from every Hellfire ---- */
  QB.ifritBot = (Q, C, mark) => {
    const { D, g, me } = Q; let esc = null;
    Q.extra = () => { const M = D.FD && D.FD.FX.mem; return M && M.stat ? Object.assign({ phase: D.FD.S.phase }, M.stat) : null; };
    Q.bot = () => { const b = g.boss; if (!b || !D.FD) { const s = D.M.bossAt || b; if (s) C.go(s.x, s.y + 4, 0.5); return; }
      const FX = D.FD.FX, S = D.FD.S, M = FX.mem, CC = FX.C; if (b.act === 'enter' || b.dead) return C.stop();
      mark('phase2', S.phase >= 2); mark('phase3', S.phase >= 3);
      const free = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.4, 0) && Math.hypot(x - CC.x, y - CC.y) < CC.R - 1.0;
      const pending = () => S.tele.filter(s => !s.done && s.age < s.t);
      const danger = (x, y, pad) => { for (const s of pending()) if (FX.inShape(s, x, y, me.r + (pad || 0.35))) return true; for (const z of S.hz) if (z.dps && FX.inShape(z, x, y, me.r + 0.2)) return true; if (Math.hypot(x - b.x, y - b.y) < 2.3) return true; return false; };
      const escape = () => { let best = null, bd = 1e9; for (const r of [1.2, 2.2, 3.4, 4.6, 6]) for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r; if (!free(x, y) || danger(x, y, 0.5)) continue; const c2 = r + Math.hypot(x - b.x, y - b.y) * 0.05; if (c2 < bd) { bd = c2; best = { x, y }; } } return best; };
      const A = M.A, hell = A && A.kind === 'hellfire'; if (hell) mark('hellfire', 1);
      if (!danger(me.x, me.y)) esc = null;
      const live = (M.crys || []).filter(c => c.alive && c.obj && !c.obj.dead), weak = S.weak && S.weak.chest && !S.weak.chest.dead ? S.weak.chest : null;
      let target = live.length ? live.sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0].obj : weak || b;
      const melee = (D.KITR.normal && D.KITR.normal.key) === 'shadowclaw';
      if (hell && A.phase !== 'over') { const ws = M.wells.slice().sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y)), w = ws.find(w2 => w2.on) || ws[0];
        if (w.on) { if (Math.hypot(me.x - w.x, me.y - w.y) > 1.3) C.go(w.x + 0.9, w.y - 0.6, 0.2); else C.stop(); }
        else { if (C.go(w.x + 0.9, w.y - 0.7, 0.15)) { me.vx = me.vy = 0; } }
        if (A.phase === 'charge' && (w.on || Math.hypot(me.x - w.x, me.y - w.y) > 2)) C.tapT(b); return; }
      if (danger(me.x, me.y)) { if (!esc || danger(esc.x, esc.y, 0.5)) esc = escape(); if (esc) C.go(esc.x, esc.y, 0.15); else C.dodge(); return; }
      const want = melee ? 1.6 : (target === b ? 5.2 : 4.0), d = Math.hypot(target.x - me.x, target.y - me.y);
      if (d > want + 0.6) { const a = Math.atan2(target.y - me.y, target.x - me.x), x = target.x - Math.cos(a) * want, y = target.y - Math.sin(a) * want; if (!danger(x, y)) C.go(x, y, 0.3); else C.stop(); }
      else if (d < want - 1.8 && target === b) { const a = Math.atan2(me.y - b.y, me.x - b.x), x = b.x + Math.cos(a) * want, y = b.y + Math.sin(a) * want; if (!danger(x, y)) C.go(x, y, 0.3); else C.stop(); }
      else C.stop();
      C.tapT(target); if (!pending().length && !S.hz.some(z => z.dps)) C.strong(); };
  };
}

/* ---------------- the run ---------------- */
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: true, isMobile: !!SHOTS });
  const errors = []; let stageErr = []; page.on('pageerror', e => { const s = e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' '); errors.push(s); stageErr.push(s); });
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) { errors.push('console: ' + m.text().slice(0, 200)); stageErr.push('console: ' + m.text().slice(0, 200)); } });
  await page.addInitScript(() => { window.__CAL_GL = 0; window.__DUN_GL = 0; window.__NG_GL = 0; window.__IFRIT_GL = 0; window.__CALFLAN_GL = 0; window.__CALBOMB_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  const setup = await page.evaluate(([L, stg]) => { const P = window.__pp; P.quickStart('Ember'); P.st.dun.god = false; P.st.energy = 100; P.st.dlv = L; P.st.dxp = 0; if (L > 1) P.st.stage = stg;
    const RS = P.riftState(); return { lvl: P.st.dlv, stage: P.st.stage, best: P.st.dun.best || 0, seals: Object.keys(RS.seals), belfryOpen: P.riftOpen('belfry'), calderaOpen: P.riftOpen('caldera'), accs: (P.st.accs || []).length, crystals: P.st.crystals || 0 }; }, [LVL, +(process.env.STAGE || 2)]);
  console.log(`[${tag}] setup`, JSON.stringify(setup));
  await page.evaluate(installBots);
  const shot = async name => { if (!SHOTS) return; await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-q-${tag}-${name}.png`) }); };
  // (a level gift's dialog, from setting the level by hand, would sit over the map: put it away)
  const clear = () => page.evaluate(() => { const g = document.getElementById('giftWrap'); if (g && !g.hidden) { g.hidden = true; window.__qGifts = (window.__qGifts || 0) + 1; } });
  const click = async sel => { await clear(); await page.click(sel); };
  const checks = []; const ok = (c, m, x) => { checks.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); };

  // the Rifts tab: the caldera card and its stage strip (Dungeon / Puzzle / Boss labels), then Enter
  await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); }); await page.waitForTimeout(600);
  const tab = await page.evaluate(() => { const P = window.__pp, Rf = P.RIFT_BY_ID.caldera; const hero = document.querySelector('.rf-hero'); return { hero: hero ? hero.textContent.replace(/\s+/g, ' ').slice(0, 300) : null, enter: !!document.querySelector('[data-rift="enter"]'), strip: [...document.querySelectorAll('.rf-stages .rf-st')].map(e => e.title + (e.classList.contains('boss') ? '[boss]' : '')), kinds: Rf.stages.map(s => s.kind + (s.trial ? '*' : '')) }; });
  console.log('tab', JSON.stringify(tab));
  await shot('00-tab');
  const table = [];
  let stage = FROM;
  if (FROM === 0) { await click('[data-rift="enter"]'); }
  else await page.evaluate(s => { const P = window.__pp; P.riftState().prog.caldera = s; P.startRift('caldera', s); }, FROM);
  let wiped = false;
  for (; stage <= TO; stage++) {
    let attempt = 0, res = null, info = null, w0 = Date.now(); stageErr = [];
    for (;;) {
      attempt++;
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 });
      const ready = await page.evaluate(() => { const r = document.getElementById('arcReady'); return r ? r.textContent.replace(/\s+/g, ' ').slice(0, 200) : ''; });
      if (attempt === 1) console.log(`stage ${stage} ready:`, ready);
      if (attempt === 1 && stage === FROM) await shot(`s${stage}-ready`);
      await click('#arcReady button.btn.primary');
      await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
      await page.waitForTimeout(200);
      const curStage = await page.evaluate(() => window.__pp.arc.game._dbg.F.rift.stage);
      if (curStage !== stage) ok(false, `stage ${stage}: the game started stage ${curStage}`);
      info = await page.evaluate(o => window.__QB.begin(o), { maxT: MAXT, noRescue: false, plain: !!process.env.PLAIN });
      if (attempt === 1) console.log(`stage ${stage} begin`, JSON.stringify(info));
      // a deliberate wipe: the party falls at the start of this stage; the checkpoint must hold this stage, not stage 0
      if (stage === WIPE && !wiped) { wiped = true;
        await page.evaluate(() => window.__QB.step(4));
        await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.hp = 1; D.hurtPet(1e6, { flat: true }); if (!D.me.dead) { D.me.hp = 0; } });
        await page.evaluate(() => window.__QB.step(3));
        await page.evaluate(() => window.__QB.end());
        await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 30000 }).catch(() => {});
        await page.waitForSelector('#arcPanel [data-arc="retry"]', { timeout: 30000 }).catch(() => {});
        const wp = await page.evaluate(() => { const P = window.__pp, p = document.getElementById('arcPanel'); return { state: P.arc.state, panel: p ? p.textContent.replace(/\s+/g, ' ').slice(0, 220) : '', prog: P.riftState().prog.caldera, sealed: !!P.riftState().seals.caldera }; });
        console.log('wipe', JSON.stringify(wp));
        ok(wp.state === 'end' && /fell/i.test(wp.panel), `wipe on stage ${stage}: "The party fell" panel`, wp.panel.slice(0, 80));
        ok(wp.prog === stage, `wipe on stage ${stage}: the checkpoint stays on this stage (prog ${wp.prog})`);
        await shot(`s${stage}-wipe`);
        // the map in between: the hero card says Continue at this stage
        await click('#arcPanel [data-arc="map"]'); await page.waitForTimeout(500);
        await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); }); await page.waitForTimeout(400);
        const hero = await page.evaluate(() => { const h = document.querySelector('.rf-hero'); return { text: h ? h.textContent.replace(/\s+/g, ' ').slice(0, 260) : '', btn: (document.querySelector('[data-rift="enter"]') || {}).textContent, done: document.querySelectorAll('.rf-stages .rf-st.done').length, now: [...document.querySelectorAll('.rf-stages .rf-st')].findIndex(e => e.classList.contains('now')) }; });
        console.log('hero after wipe', JSON.stringify(hero));
        ok(/Continue/.test(hero.btn || '') && hero.now === stage && hero.done === stage, `the map after a wipe: Continue, stage ${stage + 1} marked now, ${stage} done`, hero);
        await shot(`s${stage}-map-after-wipe`);
        await click('[data-rift="enter"]');
        continue; }
      // play it in chunks (pictures at the start, mid-way and at the exit)
      const shotsDone = {}; let last = null;
      const want = async () => page.evaluate(() => { const Q = window.__Q; Q.shotWant = null; });
      for (let k = 0; k < 400; k++) {
        if (SHOTS && !shotsDone.start) await page.evaluate(() => { const Q = window.__Q; Q.shotWant = () => Q.g.t - Q.t0 > 3; });
        else if (SHOTS && !shotsDone.mid) await page.evaluate(() => { const Q = window.__Q, D = Q.D, g = Q.g; Q.shotWant = () => { const b = g.boss; if (b && !b.dead && b.maxhp) return b.hp / b.maxhp < 0.6 && D.FD && (D.FD.S.tele.some(s => !s.done) || D.mons.some(m => !m.dead && !m.boss)); return (g.kills - Q.kills0) >= 12 && D.mons.some(m => !m.dead && !m.boss && Math.hypot(m.x - Q.me.x, m.y - Q.me.y) < 5); }; });
        else if (SHOTS && !shotsDone.exit) await page.evaluate(() => { const Q = window.__Q, D = Q.D; Q.shotWant = () => { const e = D.RIFT && D.RIFT.exit; return (e && Math.hypot(e.x - Q.me.x, e.y - Q.me.y) < 4) || (Q.g.boss && Q.g.boss.dead && Q.g.t - Q.t0 > 1); }; });
        last = await page.evaluate(() => window.__QB.step(30));
        if (last.why === 'shot') { const n = !shotsDone.start ? 'start' : !shotsDone.mid ? 'mid' : 'exit'; shotsDone[n] = 1; await shot(`s${stage}-${n}`); continue; }
        if (k % 4 === 0) console.log(`  [${stage}] t ${last.t} kills ${last.kills} left ${last.left} dmg ${last.dmg} resc ${last.rescues} goal "${last.goal}"${last.boss ? ' boss ' + last.boss.hp : ''}`);
        if (last.why === 'wipe' || last.why === 'over' || last.why === 'ended') break;
      }
      res = await page.evaluate(() => window.__QB.report('final'));
      await page.evaluate(() => window.__QB.end());
      if (last.why === 'wipe') { // a real knock-out: the end panel, Retry: the same stage again
        await page.waitForSelector('#arcPanel [data-arc="retry"]', { timeout: 30000 });
        console.log(`  stage ${stage}: KNOCKED OUT at ${res.t}s (attempt ${attempt}); retrying`, JSON.stringify(res).slice(0, 300));
        if (attempt >= 3) break; await click('#arcPanel [data-arc="retry"]'); continue; }
      break;
    }
    // the end panel
    await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 60000 }).catch(() => {});
    await page.waitForSelector('#arcPanel .dun-end', { timeout: 30000 }).catch(() => {});
    const endp = await page.evaluate(() => { const P = window.__pp, p = document.getElementById('arcPanel'); return { state: P.arc.state, h: (p.querySelector('h2') || {}).textContent, lines: [...p.querySelectorAll('.rewards li')].map(l => l.textContent.trim()), next: (p.querySelector('[data-arc="next"]') || {}).textContent || null, prog: P.riftState().prog.caldera, sealed: !!P.riftState().seals.caldera, lvl: P.st.dlv, energy: P.st.energy }; });
    if (SHOTS) await shot(`s${stage}-end`);
    const row = { hitsBy: res.hitsBy, bossMax: res.boss && res.boss.maxhp, stage, name: info.name, kind: info.kind, attempts: attempt, secs: res.t, wall: Math.round((Date.now() - w0) / 1000), kills: res.kills, dmg: res.dmg, petHp: res.maxHp, minHp: res.minHp, rescues: res.rescues, kos: res.kos, errors: stageErr.length, stalls: res.stalls.length, forced: res.forced, won: res.won, lvlAfter: endp.lvl, energy: endp.energy, banners: res.banners, marks: res.marks, extra: res.extra, botErr: res.botErr, end: endp.h, next: endp.next, prog: endp.prog };
    table.push(row);
    console.log(`stage ${stage} DONE`, JSON.stringify(row));
    if (res.stalls.length) console.log('   stalls', JSON.stringify(res.stalls));
    if (stageErr.length) console.log('   errors', stageErr.slice(0, 3));
    console.log('   banners', JSON.stringify(res.bannerList));
    console.log('   end panel', JSON.stringify(endp.lines));
    if (stage < 8) { ok(endp.next, `stage ${stage}: the end panel offers the next stage`, endp.next); ok(endp.prog === stage + 1, `stage ${stage}: checkpoint moves to ${stage + 1}`, endp.prog);
      if (!endp.next) break; await click('#arcPanel [data-arc="next"]'); }
  }
  // the seal, the reward, the map
  const fin = await page.evaluate(() => { const P = window.__pp, RS = P.riftState(), accs = (P.st.accs || []).concat(P.st.accBag || []); const em = []; const all = JSON.stringify(P.st).match(/"sp":"ember"/g);
    return { sealed: !!RS.seals.caldera, prog: RS.prog.caldera || 0, sealCount: P.RIFT_PLAN.filter(r => !r.final && !r.zero && RS.seals[r.id]).length, belfryOpen: P.riftOpen('belfry'), towerCap: P.towerCap ? P.towerCap() : null, ember: all ? all.length : 0, crystals: P.st.crystals || 0, pearls: P.st.pearls || 0, lvl: P.st.dlv }; });
  console.log('final', JSON.stringify(fin));
  if (TO === 8) { ok(fin.sealed, 'Rift 0 sealed'); ok(fin.ember >= 1, 'the Ember Charm (sp ember) is in the save', fin.ember); ok(!fin.belfryOpen || setup.belfryOpen, 'sealing Rift 0 does not open Rift 1 (Tower floor 10 not beaten)', fin.belfryOpen); ok(fin.sealCount === 0, 'the seal is kept apart from the twelve', fin.sealCount); ok(fin.prog === 0, 'the checkpoint resets after the seal', fin.prog); }
  // the save round trip: the sealed state and the charm survive a save and load
  if (TO === 8) { await page.evaluate(() => window.__pp.saveLocalNow()); await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st, null, { timeout: 60000 }); await page.waitForTimeout(1500);
    const sv = await page.evaluate(() => { const P = window.__pp, s = P.st; return { name: s && s.name, sealed: !!(s && s.rift && s.rift.seals.caldera), ember: (JSON.stringify(s && s.accs || []).match(/"sp":"ember"/g) || []).length, belfryOpen: P.riftOpen('belfry') }; });
    console.log('after reload', JSON.stringify(sv)); ok(sv.sealed && sv.ember >= 1 && !sv.belfryOpen, 'after a save and reload: sealed, the charm kept, Rift 1 still shut', sv); }
  console.log('\nTABLE ' + tag);
  console.log('stage | name | kind | att | game s | wall s | kills | dmg taken (pet hp) | min hp | rescues | KOs | errors | stalls | forced');
  for (const r of table) console.log(`${r.stage} | ${r.name} | ${r.kind} | ${r.attempts} | ${r.secs} | ${r.wall} | ${r.kills} | ${r.dmg} (${r.petHp}) | ${r.minHp} | ${r.rescues} | ${r.kos} | ${r.errors} | ${r.stalls} | ${r.forced ? JSON.stringify(r.forced) : '-'}${r.bossMax ? ' | boss hp ' + r.bossMax : ''}`);
  console.log('total game s', table.reduce((s, r) => s + r.secs, 0).toFixed(0), 'level after', fin.lvl);
  console.log('page errors', errors.length, errors.slice(0, 6));
  const bad = checks.filter(c => !c[0]).length; console.log(bad ? `${bad} FAILED` : 'all ok');
  await browser.close(); process.exit(bad || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
