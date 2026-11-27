// (v464 RZ-A) Raziel's fight: summons the Gemini Anima, checks the 30.0 s rule (the entrance not counted), casts each power at each form
// (1 / 4 / 7) and measures it against eight dummies, checks Thermal Shock (pairing, lock-out, boss cap, no loop, no Melt), no cooldowns,
// Dual Alignment's hysteresis, dt independence, the ultimate firing once and the clean-up, and compares the powers' damage with Samael,
// Asmodeus and Belial on the same dummies. Shots (SHOTS=1) on the GPU path (FGFX + RAZIEL_GL forced on the software rasteriser).
// usage: HTML=<test html> node tests/_rz-moves.js [steps: life,powers,shock,nocd,mode,dt,ult,clean,compare,shots]   OUT=shots/v464-RZA
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const ID = process.env.ID || 'gemini', ONLY = process.argv[2] ? process.argv[2].split(',') : null, want = n => !ONLY || ONLY.includes(n), SHOTS = !!process.env.SHOTS, OUTD = process.env.OUT || 'shots/v464-RZA', DPR = +(process.env.DPR || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Raziel|GFX|GLM|shader|FGFX/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(v => { window.__NOUL = v; window.__NG_GL = 0; window.__RZ_GL = 0; let sd = 424242; window.__seed = v => { sd = v; }; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; }, process.env.NOUL || '');
  await page.goto('file://' + path.resolve(process.cwd(), process.env.HTML || 'test-rza.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(ID => { window.__seed(424242); const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = ID; P.st.animas.res = null; }, ID);
  if (process.env.LOW) await page.evaluate(() => { window.__pp.st.lowFx = true; });
  await page.evaluate(() => { window.__seed(5151); window.__pp.dun.startDungeon(3, 5); });   // (v465 RZ-A: the game's own dice seeded at each step of the setup: the same pet, floor and monsters every run)
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => { window.__seed(6161); window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const setup = await page.evaluate(ID => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); window.__seed(7171); P.arc.open = false; P.arc.paused = false;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    if (!AN.kit) return 'no kit'; AN.kit.main.id = ID; AN.kit.main.k = 3; AN.kit.res = null; AN.kit.resonance = null; const MK = { gemini: 'rz', aries: 'sm', scorpio: 'as', taurus: 'bl' }[ID]; if (!AN[MK]) return 'no module ' + MK;
    D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -6; dx <= 7 && ok; dx++) for (let dy = -4; dy <= 4 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 3; me.y = best.y + 1.5; }
    const LAY = [[4.2, -0.4], [4.9, 0.3], [4.4, 0.9], [5.3, -0.6], [3.8, 0.4], [2.2, -2.4], [6.6, 2.0], [1.6, 2.2]];
    const mons = D.mons.filter(m => !m.boss).slice(0, 8); D.mons.filter(m => !mons.includes(m)).forEach(m => Object.assign(m, { dead: true, x: me.x + 300, y: me.y + 300 }));
    const LS = [[1.6, 2.4], [2.3, 2.9], [1.2, 3.1], [2.6, 2.2], [0.8, 2.6], [-2.4, 1.6], [3.4, 3.6], [-1.6, 3.2]], LY = i => (window.__RZB && window.__RZB.shotLay ? LS : LAY)[i];
    const place = (ax, ay) => mons.forEach((m, i) => Object.assign(m, { dead: false, x: (ax == null ? me.x : ax) + LY(i)[0], y: (ay == null ? me.y : ay) + LY(i)[1], hp: 1e7, maxhp: 1e7, still: false, spd: 0, atkCd: 99, dmg: 0, aggro: true, boss: false, burn: 0, chill: 0, freeze: 0, rzF: 0, rzI: 0, rzTS: 0, rzDefT: 0, kbx: 0, kby: 0, mark: null, hx: (ax == null ? me.x : ax) + LY(i)[0], hy: (ay == null ? me.y : ay) + LY(i)[1] }));
    const mx0 = me.x, my0 = me.y; place(); me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
    const step = (sec, h) => { h = h || 1 / 60; const n = Math.round(sec / h); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (const m of D.mons) m.atkCd = 99; me.hp = D.ST.hp; if (!window.__RZB.petOn) { D.g.normalT = 99; D.g.cdS = D.g.cdS2 = D.g.cdS3 = D.g.cdU = 99; } G.update(h); for (const m of mons) if (m.hx != null && !window.__RZB.free) { m.x = m.hx; m.y = m.hy; } if (!window.__RZB.free) { me.x = mx0; me.y = my0; me.vx = me.vy = 0; } } };   // (the pet held too: the same field every run)   // (dummies held on their spots and the pet's own attacks held: every Anima measured alone, on the same targets)
    const dmg = () => mons.filter(m => !m.dead).reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0);
    window.__RZB = { G, D, P, AN, me, mons, place, step, dmg, atk: () => D.ST.atk, MK, KEY: MK };
    return { summon: AN.summon(), atk: D.ST.atk, place: !!best };
  }, ID);
  console.log('setup', JSON.stringify(setup)); if (!setup || !setup.summon) { console.log(errors); await browser.close(); process.exit(1); }
  // (the model's meshes are built in idle time: wait for them, so every measurement solves the same geometry)
  console.log('model', await page.evaluate(() => { const G = window.RAZIEL_GL; if (!G) return 'none'; try { G.warm(); } catch (e) {} for (let i = 0; i < 400 && !G.ready(); i++) try { G.step(60); } catch (e) { return 'step error ' + e.message; } return G.ready() ? 'ready' : 'not ready'; })); await page.waitForFunction(() => !window.RAZIEL_GL || window.RAZIEL_GL.ready(), null, { timeout: 120000 }).catch(() => console.log('model not ready'));
  const report = {}, fails = [], ok = (c, msg) => { if (!c) fails.push(msg); };
  fs.mkdirSync(path.resolve(process.cwd(), OUTD), { recursive: true });
  const shot = async (name, prep) => { if (!SHOTS) return null; const r = await page.evaluate(() => { const { G, P } = window.__RZB; window.__NG_GL = 1; window.__RZ_GL = 1; const F = window.NIDHOGG_MOVES.FGFX, fs = F.stats || {}; fs.maxQuads = 0; fs.maxDraws = 0; const t0 = performance.now(); try { G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); } catch (e) { return { err: e.message }; } window.__NG_GL = 0; window.__RZ_GL = 0; const RS = window.RAZIEL_GL && window.RAZIEL_GL.STATS; return { ms: Math.round(performance.now() - t0), fgMaxQuadsPerPass: fs.maxQuads, fgMaxDrawsPerPass: fs.maxDraws, rzGL: RS ? { items: RS.items, W: RS.W, H: RS.H, calls: RS.calls } : null, steam: window.__RZB.AN.rz.fx.filter(f => f.kind === 'steam').length, fx: window.__RZB.AN.rz.fx.length }; });
    const f = `${OUTD}/rza-${name}${process.env.LOW ? '-low' : ''}.png`; await page.screenshot({ path: path.resolve(process.cwd(), f), timeout: 300000 }); console.log('shot', f, JSON.stringify(r)); return r; };

  // ---- the 30.0 s rule, the entrance not counted ----
  if (want('life')) {
    report.life = await page.evaluate(() => { const { AN, step } = window.__RZB, a = AN.S.list[0]; let t = 0; const h = 1 / 60;
      while (!(a.rz && a.rz.ready) && t < 12) { step(h); t += h; }
      const atReady = +a.life.toFixed(3), entr = +t.toFixed(2), g0 = window.__RZB.D.g.t; let f = 0, hs = 0; while (a.st === 'fight' && f < 40) { if ((window.__RZB.D.g.hitStop || 0) > 0) hs += h; step(h); f += h; }
      // (the game's clock: time stands still in a hit-stop, as for every Anima; the wall clock adds those frames)
      return { entrance: entr, lifeAtReady: atReady, activeSec: +(a.rz.fightT || 0).toFixed(3), clockSec: +(window.__RZB.D.g.t - g0).toFixed(3), wallSec: +f.toFixed(3), hitStopSec: +hs.toFixed(2), st: a.st }; });
    console.log('life', JSON.stringify(report.life)); ok(Math.abs(report.life.activeSec - 30) <= 1 / 60 + 1e-6, 'active time not 30.0 s: ' + report.life.activeSec); ok(report.life.lifeAtReady === 30, 'life at ready not 30');
    // a fresh summon for the rest
    await page.evaluate(() => { const { AN, step, place } = window.__RZB; AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); place(); AN.summon(); step(6); });
  } else await page.evaluate(() => window.__RZB.step(6));

  // ---- each power at each form: damage (x P), its parts ----
  /* one power at one form against the eight dummies, measured from the cast to the end of its own effects (the mind held off: nothing else
     is started while it plays out), in units of the Anima's power P = the pet's attack x ANIMA_POWER[form] */
  const castOne = (kind, k, h, opt) => page.evaluate(({ kind, k, h, opt }) => { const { AN, D, me, place, step, dmg, atk, MK } = window.__RZB;
    // (opt.fresh: a new summon for this measurement, the random seeded before it: nothing carried over from the casts before)
    if (opt && opt.hold) for (const m of window.__RZB.mons) Object.assign(m, { block: 0, blockCd: 1e9, noBuffUntil: 1e9, shield: 0, shieldT: 0, stunT: 0, act: m.act === 'dizzy' ? null : m.act, pandemUntil: 0, wornUntil: 0, brandDef: 0, ffDef: 0, aquaCurse: null, brittle: 0, rxCd: 0, electro: 0, stagger: 0, staggerT: 0, prism: 0, deathfrost: 0, rooted: 0, curse: 0, frozenBy: null, burnD: 0, el: null, elT: 0, slowT: 0 });
    if (opt && opt.hold) { Object.assign(D.g, { eventT: 1e9, bloodT: 0, counterT: 0, stopT: 0 }); if (D.g.buff) D.g.buff.fury = 0; }   /* (and the dungeon's own random events, a Blood Moon's x1.15 on every blow among them) */   /* (v465 RZ-A: the dt check holds the monsters' own dice and states: no crab blocks, no shields) */
    if (opt && opt.fresh) { AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); D.g.hitStop = 0; D.g.slowT = 0; place(); window.__seed(99 + k); AN.summon(); step(6); }
    const a = AN.S.list[0], M = AN[MK]; if (!a) return 'no anima';
    const st = () => a[MK]; a.k = k; a.x = me.x + 0.5; a.y = me.y; a.life = 25; if (st()) { st().act = null; st().buffT = 0; } if (M.fx) M.fx.length = 0; if (M.marks) M.marks.clear(); if (a.rz) { a.rz.face = Math.PI / 2 + 0.35; a.rz.faceT = null; a.rz.vx = a.rz.vy = 0; a.rz.alt = a.rz.altV = 0; a.rz.bank = a.rz.beat = 0; a.rz.hd = null; a.rz.strT = null; a.rz.clock = 0; a.rz.soarT = null; a.rz.landing = false; a.rz.hop = null; a.rz.hopT = null; a.rz.blockT = 0; a.rz.lc = null; a.rz.evalT = 0; a.rz.recL = a.rz.recR = 0; a.rz.shocks = 0; if (a.rzS) delete a.rzS._rz; a.rzOut = null; if (M.pend) M.pend.length = 0; } D.g.hitStop = 0; D.g.slowT = 0; D.AN.S.q.length = 0;   // (v465 RZ-A: every cast from the same state, the random seeded: the dt check is deterministic) place(); window.__seed(777 + k * 13); if (M.setMode) { M.setMode(a, (opt && opt.mode) || 'concord'); a.rz.modeT = a.rz.clock; } for (const m of D.mons) { m.burn = 0; m.burnD = 0; m.chill = 0; m.freeze = 0; }
    const own0 = (a.rz && a.rz.dealt) || 0, hp0 = window.__RZB.mons.map(m => m.hp), d0 = dmg(), sh0 = (a.rz && a.rz.shocks) || 0, P = atk() * [0, 1.6, 2.5, 3.6][k]; window.__seed(777 + k * 13); if (M.seed) M.seed(777 + k * 13); M.cast(a, kind, opt && opt.o); const A = st().act, seen = {}, fzSet = new Set(); let n = 0, len = 0, end = -1;
    while (n++ < Math.round(16 / h)) { step(h, h); len += h; if (!st().act) st().gap = 1e9; if (M.fx) for (const f of M.fx) seen[f.kind] = (seen[f.kind] || 0) + 1; for (const m of D.mons) if (m.freeze > 0 && !m.dead) fzSet.add(m);
      const busy = st().act === A || (M.fx && M.fx.some(f => f.kind === 'domF' || f.kind === 'domI')); if (!busy && end < 0) end = len; if (end >= 0 && len > end + 1.0) break; }
    if (st()) st().gap = 0;
    const ms = D.mons.filter(m => !m.boss && !m.dead).slice(0, 8);
    return { per: window.__RZB.mons.map((m, i) => +((hp0[i] - m.hp) / P).toFixed(1)).join(' '), k, xP: +((dmg() - d0) / P).toFixed(2), ownP: a.rz ? +((a.rz.dealt - own0) / P).toFixed(2) : null, perTgtMax: +(Math.max(...window.__RZB.mons.map((m, i) => hp0[i] - m.hp)) / P).toFixed(2), go: A && A.go ? { gt: +(A.gt || 0).toFixed(2), went: !!A.went, air: !!A.air, x: +(a.x - me.x).toFixed(1), y: +(a.y - me.y).toFixed(1) } : null, sec: +end.toFixed(2), n: A && A.n, shocks: ((a.rz && a.rz.shocks) || 0) - sh0, burned: ms.filter(m => m.burn > 0).length, chilled: ms.filter(m => m.chill > 0).length, froze: fzSet.size, buff: a.rz ? +Math.max(0, a.rz.buffT - D.g.t).toFixed(1) : 0, fx: Object.keys(seen).join(',') }; }, { kind, k, h: h || 1 / 60, opt });
  if (want('powers')) { report.powers = {};
    for (const kind of { gemini: ['fang', 'divide', 'circuit', 'cata'], aries: ['charge', 'perd', 'over', 'impact'], scorpio: ['perd', 'lab', 'molt', 'rupt'], taurus: ['rush', 'crown', 'carapace', 'stamp'] }[ID]) { report.powers[kind] = []; for (const k of [1, 2, 3]) report.powers[kind].push(await castOne(kind, k)); console.log(kind, JSON.stringify(report.powers[kind])); }
    if (ID === 'gemini') { const P2 = report.powers; ok(P2.fang[0].n === 1 && P2.fang[1].n === 2 && P2.fang[2].n === 3, 'fang sweeps 1/2/3'); ok(P2.cata[0].n === 1 && P2.cata[1].n === 2 && P2.cata[2].n === 3, 'cata pairs 1/2/3');
    ok(P2.cata[2].xP > P2.fang[2].xP && P2.cata[2].perTgtMax > P2.fang[2].perTgtMax * 0.9, 'cata the strongest burst'); ok(P2.circuit.every(r => r.buff > 0), 'circuit buff'); ok(P2.fang.every(r => r.burned > 0 && r.chilled > 0), 'fang applies burning and chill');
    report.dissonance = await castOne('fang', 2, null, { mode: 'dissonance' }); report.strafe = []; for (const k of [1, 2, 3]) report.strafe.push(await castOne('fang', k, null, { o: { air: true } })); console.log('fang strafe', JSON.stringify(report.strafe)); console.log('fang dissonance', JSON.stringify(report.dissonance)); } }

  // ---- Thermal Shock: pairing, lock-out, boss cap, no loop, no Melt ----
  if (want('shock')) {
    report.shock = await page.evaluate(() => { const { AN, D, step, place, atk } = window.__RZB, a = AN.S.list[0], RZ = AN.rz, out = {}; a.k = 3; a.rz.act = null; a.rz.gap = 1e9; a.life = 25; place(); const m = window.__RZB.mons[0], sh = () => a.rz.shocks || 0;
      let s0 = sh(); RZ.fireHit(a, m, 10, {}); out.fireOnly = sh() - s0; RZ.iceHit(a, m, 10, {}); out.thenIce = sh() - s0; out.defBreak = m.rzDefT > D.g.t; out.chillKept = m.chill > 0;
      s0 = sh(); RZ.fireHit(a, m, 10, {}); RZ.iceHit(a, m, 10, {}); out.lockedAgain = sh() - s0; step(2.1); s0 = sh(); RZ.fireHit(a, m, 10, {}); RZ.iceHit(a, m, 10, {}); out.afterLock = sh() - s0;
      // a loop: alternating fire / ice ticks at 10 Hz for 3 s on one monster
      step(1.5); s0 = sh(); for (let i = 0; i < 30; i++) { (i % 2 ? RZ.iceHit : RZ.fireHit)(a, m, 5, { tick: true }); step(0.1); } out.in3s = sh() - s0;
      // a stale pairing (fire, then ice after the window): nothing
      step(2); m.rzF = m.rzI = 0; m.rzTS = 0; s0 = sh(); RZ.fireHit(a, m, 5, {}); step(2.8); RZ.iceHit(a, m, 5, {}); out.stale = sh() - s0;
      // a boss: the cap
      const b = window.__RZB.mons[1]; Object.assign(b, { boss: true, maxhp: 2000, hp: 2000, rzTS: 0, act: 'move', under: false, shield: 0, block: 0 }); RZ.fireHit(a, b, 1, { noShock: true }); RZ.iceHit(a, b, 1, { noShock: true }); const h0 = b.hp; out.bossFired = RZ.thermalShock(a, b, 1, false); out.bossShockShare = +((h0 - b.hp) / b.maxhp).toFixed(4); out.bossOutK = +RZ.outK(b).toFixed(3); b.boss = false; b.maxhp = b.hp = 1e7;
      out.outK = +RZ.outK(m).toFixed(3); a.rz.gap = 0; return out; });
    console.log('shock', JSON.stringify(report.shock)); const s = report.shock;
    ok(s.fireOnly === 0 && s.thenIce === 1, 'shock pairing'); ok(s.lockedAgain === 0 && s.afterLock === 1, 'shock lock-out'); ok(s.in3s <= 3, 'shock loop bounded: ' + s.in3s); ok(s.stale === 0, 'stale pairing'); ok(s.bossFired && s.bossShockShare <= 0.012 * 1.25 * 1.6 + 1e-4, 'boss cap ' + s.bossShockShare); ok(s.chillKept, 'Melt did not thaw'); }

  // ---- Thermal Shock pictures: at most 4 new bursts a frame (the rest queued or merged), damage per monster unchanged ----
  if (want('burst')) { report.burst = await page.evaluate(() => { const { AN, step, place, mons } = window.__RZB, a = AN.S.list[0], RZ = AN.rz; a.rz.act = null; a.rz.gap = 1e9; place(); RZ.fx.length = 0; mons.forEach((m, i) => { m.x = m.hx = a.x + 3 + (i % 4) * 1.6; m.y = m.hy = a.y + Math.floor(i / 4) * 1.6; });
      const nS = () => RZ.fx.filter(f => f.kind === 'shock').length, sh0 = a.rz.shocks || 0; step(1 / 60); const s0 = nS(); for (const m of mons) { RZ.fireHit(a, m, 5, { noShock: true }); RZ.iceHit(a, m, 5, {}); }
      const sameFrame = nS() - s0, shocks = (a.rz.shocks || 0) - sh0, queued = RZ.pend.length; const per = []; for (let i = 0; i < 3; i++) { const b = nS(); step(1 / 60); per.push(nS() - b); } a.rz.gap = 0; return { shocks, sameFrame, queued, nextFrames: per }; });
    console.log('burst', JSON.stringify(report.burst)); ok(report.burst.shocks === 8 && report.burst.sameFrame <= 4, 'burst cap'); }
  // ---- (v465 RZ-A) lively movement over a whole 30 s: time in the air, take-offs and landings, distance covered, how far from the pet, on
  //      floor whenever grounded, no jitter (the ground speed's frame-to-frame change), the powers cast from the air ----
  if (want('move')) { report.move = await page.evaluate((MS) => { const { AN, D, step, place, me } = window.__RZB, a = AN.S.list[0], RZ = AN.rz; window.__RZB.free = false; place(); a.rz.act = null; a.rz.gap = 0; a.k = 3; a.life = 31; window.__seed(MS); if (RZ.seed) RZ.seed(MS);
      let air = 0, lifts = 0, lands = 0, path = 0, maxPet = 0, offFloor = 0, jerk = 0, px = a.x, py = a.y, pvx = 0, pvy = 0, wasAir = false, maxAlt = 0; const kinds = [], airKinds = {}, h = 1 / 60, pk = {};
      for (let i = 0; i < 60 * 29.5 && a.st === 'fight'; i++) { const hs = (D.g.hitStop || 0) > 0 || (D.g.slowT || 0) > 0; step(h); const al = a.rz.alt, isAir = al > 0.12; if (isAir) air += h; if (isAir && !wasAir) lifts++; if (!isAir && wasAir) lands++; wasAir = isAir; maxAlt = Math.max(maxAlt, al);
        const vx = (a.x - px) / h, vy = (a.y - py) / h; path += Math.hypot(a.x - px, a.y - py); const hsNow = hs || D.g.hitStop > 0; if (i > 2 && !hsNow && !window.__phs) { const jj = Math.hypot(vx - pvx, vy - pvy); if (jj > jerk) { jerk = jj; window.__jk = { i, act: a.rz.act && a.rz.act.kind, went: a.rz.act && a.rz.act.went, alt: +a.rz.alt.toFixed(2), v: [+vx.toFixed(2), +vy.toFixed(2)], pv: [+pvx.toFixed(2), +pvy.toFixed(2)], st: a.st }; } } pvx = vx; pvy = vy; px = a.x; py = a.y; window.__phs = (D.g.hitStop || 0) > 0 || hs;
        maxPet = Math.max(maxPet, Math.hypot(a.x - me.x, a.y - me.y)); if (!isAir && al < 0.01 && !D.walkAt(Math.floor(a.x), Math.floor(a.y))) offFloor++;
        const A = a.rz.act, k = A && (A.kind + (A.air ? '-air' : '')); if (k && k !== kinds[kinds.length - 1]) kinds.push(k); if (A && isAir) airKinds[A.kind + (A.air ? '-air' : '')] = 1; const S5 = a.rzS || {}, O5 = a.rzOut || {}; for (const q of ['speed', 'glide', 'dive', 'fly']) { pk[q] = Math.max(pk[q] || 0, Math.abs(S5[q] || 0)); } if (O5.shadow) pk.shadow = (pk.shadow || 0) + 1; if (O5.flyH != null) pk.flyH = Math.max(pk.flyH || 0, O5.flyH); }
      return { airSec: +air.toFixed(1), lifts, lands, pathTiles: +path.toFixed(1), maxFromPet: +maxPet.toFixed(1), maxAlt: +maxAlt.toFixed(2), offFloorFrames: offFloor, maxDeltaV: +jerk.toFixed(2), seq: kinds.join(' '), castInAir: Object.keys(airKinds).join(','), pose: pk, jk: window.__jk }; }, +(process.env.MSEED || 4242));
    console.log('move', JSON.stringify(report.move)); const M = report.move; ok(M.airSec > 4 && M.lifts >= 1 && M.pathTiles > 20, 'lively: ' + JSON.stringify(M)); ok(M.maxDeltaV < 1.0, 'smooth'); ok(M.offFloorFrames === 0, 'grounded on floor'); ok(M.maxFromPet < 5.5, 'near the pet'); }
  // ---- no cooldowns: the same power back to back, the mind never idle while monsters are near ----
  if (want('nocd')) {
    report.nocd = await page.evaluate(() => { const { AN, step, place, me } = window.__RZB, a = AN.S.list[0], RZ = AN.rz, out = {}; a.k = 3; a.life = 25; a.rz.act = null; a.rz.gap = 0; place(); a.x = me.x + 0.5; a.y = me.y;
      RZ.cast(a, 'fang'); let n = 0; while (a.rz.act && n++ < 1200) step(1 / 60); out.again = RZ.cast(a, 'fang') && a.rz.act && a.rz.act.kind === 'fang'; while (a.rz.act && n++ < 2400) step(1 / 60);
      const seq = []; let idle = 0, last = null; a.life = 28; for (let i = 0; i < 60 * 22; i++) { step(1 / 60); const k = a.rz.act && a.rz.act.kind; if (k && k !== last) seq.push(k); last = k; if (!k) idle += 1 / 60; }
      out.seq = seq.join(' '); out.idleSec = +idle.toFixed(2); out.kinds = [...new Set(['fang'].concat(seq))].length; return out; });   /* (v467 RZ-A: the two Fangs cast first count too: a tight cluster at form 7 gives long Cataclysms, 22 s may hold only two other kinds) */
    console.log('nocd', JSON.stringify(report.nocd)); ok(report.nocd.again, 'same power back to back'); ok(report.nocd.kinds >= 3, 'variety'); }

  // ---- the mind: what it picks in set situations (40 draws each) ----
  if (want('ai')) {
    report.ai = await page.evaluate(() => { const { AN, D, place, me, mons } = window.__RZB, a = AN.S.list[0], RZ = AN.rz, out = {}; a.life = 25; a.rz.act = null; a.rz.buffT = 0; a.rz.last = a.rz.last2 = null; RZ.fx.length = 0;
      const tally = () => { const c = {}; for (let i = 0; i < 40; i++) { const q = RZ.choose(a); const k = q ? q.kind : 'none'; c[k] = (c[k] || 0) + 1; } return c; }, park = () => mons.forEach((m, i) => Object.assign(m, { x: a.x - 40 - i, y: a.y - 40 }));
      a.x = me.x + 0.5; a.y = me.y; park(); Object.assign(mons[0], { x: a.x + 5, y: a.y }); out.single = tally();
      park(); Object.assign(mons[0], { x: a.x + 5, y: a.y, boss: true }); out.boss = tally(); mons[0].boss = false;
      place(); out.crowd = tally();
      park(); [[-5, 0], [-5.4, 0.5], [-4.8, -0.4], [5, 0.2], [5.5, -0.4], [5.2, 0.7]].forEach(([dx, dy], i) => Object.assign(mons[i], { x: a.x + dx, y: a.y + dy })); out.split = tally();
      place(); a.rz.buffT = D.g.t + 8; out.buffed = tally(); a.rz.buffT = 0;
      place(); a.life = 2.0; out.lastSecs = tally(); a.life = 25; place(); return out; });
    console.log('ai', JSON.stringify(report.ai)); }
  // ---- Dual Alignment: the field decides, never flickering ----
  if (want('mode')) {
    report.mode = await page.evaluate(() => { const { AN, step, place, me, mons } = window.__RZB, a = AN.S.list[0], RZ = AN.rz, out = {}; a.life = 25; a.rz.act = null; a.rz.buffT = 0;
      const near = (x, y, r) => mons.filter(m => !m.dead && Math.hypot(m.x - x, m.y - y) < r + m.r);
      // one tight group -> concord; two groups far apart -> dissonance; then jitter at the border: count flips
      place(); mons.forEach((m, i) => Object.assign(m, { x: a.x + 4 + (i % 3) * 0.4, y: a.y + Math.floor(i / 3) * 0.4 })); a.rz.mode = 'dissonance'; a.rz.modeT = -99; RZ.evalMode(a, near(a.x, a.y, 11)); out.tight = a.rz.mode;
      mons.forEach((m, i) => Object.assign(m, { x: a.x + (i < 4 ? -5 : 5) + (i % 2) * 0.4, y: a.y + (i % 4) * 0.4 })); a.rz.modeT = -99; RZ.evalMode(a, near(a.x, a.y, 11)); out.apart = a.rz.mode;
      const f0 = a.rz.flips || 0; for (let i = 0; i < 100; i++) { const apart = i % 2; mons.forEach((m, j) => Object.assign(m, { x: a.x + (apart ? (j < 4 ? -5 : 5) : 4) + (j % 2) * 0.4, y: a.y + (j % 4) * 0.4 })); a.rz.clock += 0.1; RZ.evalMode(a, near(a.x, a.y, 11)); }
      out.flipsIn10s = (a.rz.flips || 0) - f0; return out; });
    console.log('mode', JSON.stringify(report.mode)); ok(report.mode.tight === 'concord' && report.mode.apart === 'dissonance', 'alignment from the field'); ok(report.mode.flipsIn10s <= 4, 'alignment hysteresis'); }

  // ---- dt independence: the same power at 30, 60 and 144 frames a second ----
  // (each power's dt check on a fresh page of its own, the random seeded, crits off: nothing carried over from another power)
  if (want('dt') && !process.env.DTK) { report.dt = {}; for (const kind of ['fang', 'strafe', 'cata', 'divide']) { let o = ''; try { o = require('child_process').execFileSync(process.execPath, [__filename, 'dt'], { env: Object.assign({}, process.env, { DTK: kind }), encoding: 'utf8', timeout: 900000 }); } catch (e) { o = String(e.stdout || ''); }
      const m = o.match(new RegExp('^dt ' + kind + ' (\\[.*\\])$', 'm')); const v = m ? JSON.parse(m[1]) : []; report.dt[kind] = v; console.log('dt', kind, JSON.stringify(v)); const mx = Math.max(...v), mn = Math.min(...v); ok(v.length === 4 && mn > 0 && (mx - mn) / mx < 0.06, 'dt independence ' + kind + ' ' + v); } }
  else if (want('dt')) { report.dt = {}; await page.evaluate(() => { const S2 = window.__RZB.D.ST; S2.acc = Object.assign({}, S2.acc || {}, { crit: -1 }); });   // (no crits while it is measured: they are the game's own dice, not the frame rate's)
 for (const kind of (process.env.DTK ? process.env.DTK.split(',') : ['fang', 'strafe', 'cata', 'divide'])) { report.dt[kind] = []; for (const h of (process.env.DTH ? process.env.DTH.split(',').map(v => 1 / +v) : [1 / 30, 1 / 60, 1 / 120, 1 / 144])) { const r = await castOne(kind === 'strafe' ? 'fang' : kind, 3, h, kind === 'strafe' ? { o: { air: true }, fresh: true, hold: true } : { fresh: true, hold: true }); report.dt[kind].push(r.ownP);   /* (its own blows only: the pet's trait and the game's reactions roll their own dice) */ if (process.env.DTV) console.log('dtv', kind, h, JSON.stringify(r), await page.evaluate(() => { const B = window.__RZB, D = B.D; return { extra: D.mons.filter(m => !m.dead && !B.mons.includes(m)).map(m => m.type + '@' + (m.x - B.me.x).toFixed(1) + ',' + (m.y - B.me.y).toFixed(1) + ' hp' + Math.round(m.maxhp - m.hp)), t: +D.g.t.toFixed(1), ST: [D.ST.atk, D.g.buff && D.g.buff.fury, D.g.stopT, D.g.counterT, D.g.bloodT] }; })); } console.log('dt', kind, JSON.stringify(report.dt[kind]));
    const v = report.dt[kind], mx = Math.max(...v), mn = Math.min(...v); ok(mn > 0 && (mx - mn) / mx < 0.06, 'dt independence ' + kind + ' ' + v); } }

  if (want('repeat')) { await page.evaluate(() => { const S2 = window.__RZB.D.ST; S2.acc = Object.assign({}, S2.acc || {}, { crit: -1 }); }); const r = []; for (const h of [1 / 60, 1 / 60, 1 / 60]) { const q = await castOne(process.env.KIND || 'cata', 3, h, { fresh: true }); r.push([q.xP, q.shocks, JSON.stringify(q.go)]); } console.log('repeat', JSON.stringify(r)); }
  // ---- shots on the GPU path ----
  if (want('shots') && SHOTS) {
    const prep = (kind, k, sec) => page.evaluate(({ kind, k, sec }) => { const { AN, me, place, step } = window.__RZB, a = AN.S.list[0], RZ = AN.rz; window.__NG_GL = 1; window.__RZB.shotLay = true; if (window.__NOUL === 'fx') { RZ.drawFx = RZ.drawGround = RZ.drawBodyFx = () => {}; } if (window.__NOUL === 'body') RZ.drawBodyFx = () => {}; if (window.__NOUL === 'air') RZ.drawFx = () => {}; if (window.__NOUL === 'ground') RZ.drawGround = () => {}; if (window.__NOUL && RZ.ul) { RZ.ul.drawFx = RZ.ul.drawGround = RZ.ul.drawCine = () => {}; } a.k = k; a.x = me.x + 0.5; a.y = me.y; a.life = 25; a.rz.act = null; a.rz.gap = 1e9; RZ.fx.length = 0; place(); RZ.setMode(a, 'concord'); RZ.cast(a, kind); const n = Math.round(sec / (1 / 60)); for (let i = 0; i < n; i++) { step(1 / 60); if (!a.rz.act) a.rz.gap = 1e9; if (i % 6 === 0 && i < n - 6) { window.__RZ_GL = 1; window.__RZB.G.draw(window.__RZB.P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__RZ_GL = 0; } } window.__NG_GL = 0; return a.rz.act && a.rz.act.kind; }, { kind, k, sec });
    for (const [kind, k, sec, nm] of (process.env.SHOTLIST ? JSON.parse(process.env.SHOTLIST) : [['fang', 3, 1.2, 'fang-cross'], ['fang', 3, 1.52, 'fang-meet'], ['divide', 3, 2.6, 'divide'], ['circuit', 3, 1.2, 'circuit'], ['cata', 3, 1.4, 'cata-form'], ['cata', 3, 2.2, 'cata-fly'], ['cata', 3, 2.75, 'cata-boom']])) { await prep(kind, k, sec); await shot(nm); }
  }

  // ---- the ultimate: once, the Anima staying till its last frame; then the clean-up ----
  if (want('ult')) {
    report.ult = await page.evaluate(() => { const { AN, step, place, D } = window.__RZB, a = AN.S.list[0], RZ = AN.rz, out = {}; if (!a) return 'no anima'; place(); a.rz.act = null; RZ.cast(a, 'fang'); step(1.0);
      let starts = 0; const UL = RZ.ul; if (UL) { const s0 = UL.start; UL.start = function (x) { starts++; return s0.apply(this, arguments); }; }
      a.life = 0.01; let t = 0, st = []; while (AN.S.list.includes(a) && t < 30) { step(1 / 60); t += 1 / 60; if (st[st.length - 1] !== a.st) st.push(a.st); if (a.st === 'awaken' && a.rz.act) out.actDuringAwaken = true; }
      out.states = st.join('>'); out.secToGone = +t.toFixed(2); out.starts = starts; out.hasUL = !!UL; out.rzUlt = !!a.rzUlt; out.cineT = D.g.cineT; out.zoomP = D.g.zoomP; return out; });
    console.log('ult', JSON.stringify(report.ult)); ok(report.ult.starts <= 1 && (report.ult.hasUL ? report.ult.starts === 1 : true), 'ultimate once'); ok(!report.ult.actDuringAwaken, 'no power after the 30 s'); }
  if (want('clean')) {
    report.clean = await page.evaluate(() => { const { AN, step } = window.__RZB, RZ = AN.rz, r = {}; step(4); r.list = AN.S.list.length; r.fx = RZ.fx.length; r.marks = RZ.marks.size; r.gpu = window.RAZIEL_GL ? window.RAZIEL_GL.gpuCount() : -1; AN.stop(); r.gpuAfterStop = window.RAZIEL_GL ? window.RAZIEL_GL.gpuCount() : -1; return r; });
    console.log('clean', JSON.stringify(report.clean)); ok(report.clean.fx === 0 && report.clean.marks === 0 && report.clean.gpuAfterStop <= 0, 'clean-up'); }

  // ---- (v465 RZ-A) a whole 30 s on the GPU path, the mind free: a picture every 2.5 s (its movement and flight over the fight) ----
  if (want('seq') && SHOTS) { await page.evaluate(() => { const { AN, place } = window.__RZB; AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); window.__RZB.shotLay = true; place(); window.__NG_GL = 1; window.__seed(31); if (AN.rz.seed) AN.rz.seed(31); AN.summon(); });
    await page.evaluate(() => { const { step } = window.__RZB; step(5.6); }); const log = [];
    for (let i = 0; i < 12; i++) { const info = await page.evaluate(() => { const { AN, step, G, P, me } = window.__RZB, a = AN.S.list[0]; for (let f = 0; f < 150; f++) { step(1 / 60); if (f % 10 === 0 && f < 140) { window.__RZ_GL = 1; G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__RZ_GL = 0; } } if (!a) return null; return { life: +a.life.toFixed(1), act: a.rz.act ? a.rz.act.kind + (a.rz.act.air ? '-air' : '') : '-', alt: +a.rz.alt.toFixed(2), bank: +a.rz.bank.toFixed(2), x: +(a.x - me.x).toFixed(1), y: +(a.y - me.y).toFixed(1), st: a.st }; });
      log.push(info); await shot('seq-' + String(i).padStart(2, '0')); console.log('seq', i, JSON.stringify(info)); }
    report.seq = log; await page.evaluate(() => { window.__NG_GL = 0; window.__RZB.shotLay = false; }); }
  // ---- the entrance on the GPU path: seals, cores, assembly, the heads' bursts, the wings' two waves meeting in steam, the roar ----
  if (want('entrance') && SHOTS) { await page.evaluate(() => { const { AN, place } = window.__RZB; AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); window.__RZB.shotLay = true; place(); window.__NG_GL = 1; AN.summon(); });
    let tt = 0; for (const at of [1.2, 2.0, 3.0, 3.5, 4.05, 4.5]) { await page.evaluate(({ d }) => { const { step, G, P } = window.__RZB; const n = Math.round(d * 60); for (let i = 0; i < n; i++) { step(1 / 60); if (i % 8 === 0 && i < n - 8) { window.__RZ_GL = 1; G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__RZ_GL = 0; } } }, { d: at - tt }); tt = at; await shot('enter-' + at.toFixed(1)); }
    await page.evaluate(() => { window.__NG_GL = 0; window.__RZB.shotLay = false; }); }
  // ---- without WebGL: the same powers drawn with the game's own particles (a 2D Raziel, not a crash) ----
  if (want('cel')) { for (const [kind, sec, nm] of [['fang', 1.2, 'cel-fang'], ['cata', 2.6, 'cel-cata']]) { const r = await page.evaluate(({ kind, sec }) => { const { AN, me, place, step, G, P } = window.__RZB, RZ = AN.rz; if (!AN.S.list.length) { AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); AN.summon(); step(6); } const a = AN.S.list[0]; if (!a) return 'no anima'; window.__NG_GL = 0; window.__RZ_GL = 0; window.__RZB.shotLay = true; a.x = me.x + 0.5; a.y = me.y; a.life = 25; a.rz.act = null; place(); RZ.cast(a, kind);
        for (let i = 0; i < Math.round(sec * 60); i++) { step(1 / 60); if (!a.rz.act) a.rz.gap = 1e9; if (i % 10 === 0) G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); } try { G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); } catch (e) { return 'draw error ' + e.message; } return 'ok'; }, { kind, sec });
      await page.screenshot({ path: path.resolve(process.cwd(), `${OUTD}/rza-${nm}.png`) }); console.log('cel', nm, r); ok(r === 'ok', 'cel draw ' + nm); } }
  // ---- repeated summons: GPU buffers back to 0, the heap not growing ----
  if (want('again')) { report.again = [];
    for (let i = 0; i < 3; i++) { const r = await page.evaluate(() => { const { AN, step, place } = window.__RZB; AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); place(); AN.summon(); step(8); const a = AN.S.list[0]; if (a) a.life = 0.01; let t = 0; while (AN.S.list.length && t < 25) { step(1 / 30, 1 / 30); t += 1 / 30; } step(3); if (window.gc) window.gc();
        return { gone: !AN.S.list.length, fx: AN.rz.fx.length, gpu: window.RAZIEL_GL ? window.RAZIEL_GL.gpuCount() : -1, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : -1 }; }); report.again.push(r); console.log('again', i, JSON.stringify(r)); ok(r.gone && r.fx === 0 && r.gpu <= 0, 'again ' + i); } }
  console.log('report', JSON.stringify(report));
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 6)));
  console.log(fails.length ? 'FAILS ' + JSON.stringify(fails) : 'rz-moves OK');
  fs.writeFileSync(path.resolve(process.cwd(), `${OUTD}/rza-report-${ID}.json`), JSON.stringify({ report, fails, errors }, null, 1));
  await browser.close(); process.exit(fails.length || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
