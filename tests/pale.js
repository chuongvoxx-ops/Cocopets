// The Pale Intellect, stepped fast without drawing. A bot that walks at the pet's speed and reads the floor plays each
// attack: played properly it takes no blow (and standing still it does). Nerve Lash, Intrusive Thought, Cerebral Tide,
// Thought Conductor baited onto two obelisks; the lie (harmless), False Awakening both ways, Recurring Thought, Neural
// Stitch (out through the opened link; the walls hold), the double lash, Sever the Delusion (a wrong touch, then the
// right one); Premonition, Unwanted Memory, Synaptic Collapse; the Unspoken Name let run (the wave) and answered (four
// bonds broken, the core bare), the health it will not lose before that, and the end.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(100, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; for (let i = 0; i < 60 * 5; i++) G.update(1 / 60); });
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  const play = (name, opts) => page.evaluate(([name, opts]) => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me, C = FX.C, T = window.__pp.FIEND_DEFS.pale._t, GK = T.GK;
    let m = D.g.boss, hurts = 0, big = 0, late = 0; const banners = [], seen = {};
    const hu = FX.hurt, log = []; FX.hurt = function (d, o) { hurts++; if (d > m.dmg * 2.5) big++; if (log.length < 4) log.push({ t: +(frames / 60).toFixed(2), d: +(d / m.dmg).toFixed(2), me: [+(me.x - C.x).toFixed(1), +(me.y - C.y).toFixed(1)], hz: FD.S.hz.filter(z => z.gw && z.fired && z.age - z.t < 0.05).map(z => z.shape + ':' + (z.r || z.hw || '') + '@' + (+(z.x - C.x).toFixed(1)) + ',' + (+(z.y - C.y).toFixed(1))) }); return hu.apply(this, arguments); };
    const ban = FX.H.banner; FX.H.banner = function (a) { banners.push(a); return ban.apply(this, arguments); };
    const put = (x, y) => { me.x = x; me.y = y; M._prev = { x, y }; };
    const posts = () => M.ob.filter(o => o.sink < 0.6);
    const okAt = (x, y) => Math.hypot(x - C.x, y - C.y) < T.R - 0.8 && posts().every(o => Math.hypot(x - o.x, y - o.y) > 1.45);
    const warns = () => FD.S.hz.filter(z => z.gw && !z.fired && !z.cut && z.solid !== false && z.dmg > 0 && !(opts.dodge === 'stitch' && z.shape === 'poly'));
    // what is coming: the warnings out, and the next future a premonition has shown
    const zones = () => { const Z = warns(); if (M.pre && opts.dodge === 'safe') { const i = M.pre.done + 1; if (i < M.pre.shown && i < M.pre.seq.length) Z.push(T.patZone(C, M.pre.seq[i])); } return Z; };
    const danger = (x, y, pad) => zones().some(z => GK.inZone(z, x, y, me.r + (pad == null ? 0.35 : pad)));
    // the nearest safe place: on the pet's side of a stitch, unless it has crossed
    const side = (x, y) => { const S = M.stitch; if (!S) return 0; const L = S.links[0], dx = L.x1 - L.x0, dy = L.y1 - L.y0; return Math.sign((x - L.x0) * -dy + (y - L.y0) * dx); };
    const safeNear = () => { const s0 = side(me.x, me.y); for (let r = 0.4; r < 18; r += 0.4) for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2, x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r; if (okAt(x, y) && !danger(x, y) && (!M.stitch || !M.stitch.on || side(x, y) === s0)) return [x, y]; } return null; };
    let goal = null;
    if (opts.at) put(C.x + opts.at[0], C.y + opts.at[1]);
    M.job = null; M.gap = 99; M.sigCd = 99; FD.S.hz.length = 0; M.thoughts = []; M.tides = []; M.ghost = null; M.pre = null; M.stitch = null; D.eshots && (D.eshots.length = 0);
    // walk a while first, so it has a path to remember
    if (opts.walk) { const [wx, wy] = opts.walk; for (let i = 0; i < 180; i++) { me.x += wx / 180; me.y += wy / 180; G.update(1 / 60); M.gap = 99; me.hp = D.ST.hp; } }
    const J = T[name](FX, m, opts.o || {}); J.name = name; M.job = J;
    let frames = 0, stunned = 0, opened = 0, revealed = 0, bare = 0, crossed = 0, waved = 0;
    while ((M.job === J || (opts.extra && frames < opts.extra * 60)) && frames < 60 * 40) {
      const D2 = opts.dodge;
      if (D2) {
        // out of any real mark the pet stands in (or will, where it is heading)
        if (danger(me.x, me.y, 0.15) || (goal && danger(goal[0], goal[1]))) { if (!seen.fleeT || frames - seen.fleeT > 6) { goal = safeNear(); seen.fleeT = frames; } }
        else if (D2 === 'tide' && M.tides.length) { const T2 = M.tides[0], d = Math.hypot(me.x - T2.x, me.y - T2.y); goal = [T2.x + Math.cos(T2.ga) * d, T2.y + Math.sin(T2.ga) * d]; }
        else if (D2 === 'bait') { const th = M.thoughts.find(q => q.real); const want = M.ob.filter(o => o.sink < 0.4 && (opts.bind ? o.bound : o.lit > 0.5 && o.charge < 0.5)); if (th && want.length) { const o = want.sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0], a = Math.atan2(C.y - o.y, C.x - o.x); goal = [o.x + Math.cos(a) * 1.55, o.y + Math.sin(a) * 1.55]; } }
        else if (D2 === 'sever' && M.sev) { const i = opts.wrong && !seen.wrong ? M.sev.lie : M.sev.real, o = M.ob[i]; if (M.sev.touched[i]) seen.wrong = 1; const a = Math.atan2(C.y - o.y, C.x - o.x); if (frames > 30) goal = [o.x + Math.cos(a) * 1.6, o.y + Math.sin(a) * 1.6]; }
        else if (D2 === 'stitch' && M.stitch && M.stitch.exit >= 0 && !seen.cross) { const L = M.stitch.links[M.stitch.exit], mx = (L.x0 + L.x1) / 2, my = (L.y0 + L.y1) / 2, dx = L.x1 - L.x0, dy = L.y1 - L.y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, sd = Math.sign((me.x - mx) * nx + (me.y - my) * ny) || 1;
          seen.sd = seen.sd || sd; const near = Math.abs((me.x - mx) * dx / l + (me.y - my) * dy / l) < l / 2 - 0.8; goal = near ? [mx - nx * seen.sd * 2.6, my - ny * seen.sd * 2.6] : [mx + nx * seen.sd * 1.2, my + ny * seen.sd * 1.2]; if (Math.sign((me.x - mx) * nx + (me.y - my) * ny) === -seen.sd && Math.abs((me.x - mx) * nx + (me.y - my) * ny) > 1.6) { seen.cross = 1; crossed = 1; goal = null; } }
        else if (D2 === 'mem' && M.ghost) { const G2 = M.ghost; if (!seen.memGoal) { seen.memGoal = 1; let best = null, bd = 1e9; for (let r = 1; r < 10 && !best; r += 0.5) for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2, x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r; if (!okAt(x, y)) continue; const dmin = Math.min(...G2.route.map(p => Math.hypot(p[0] - x, p[1] - y))); if (dmin > 2.4 && r < bd) { bd = r; best = [x, y]; } } goal = best; } }
        // walk there at the pet's speed
        if (goal) { const dx = goal[0] - me.x, dy = goal[1] - me.y, d = Math.hypot(dx, dy), v = 4.3 / 60; if (d > 0.02) { const s = Math.min(v, d); me.x += dx / d * s; me.y += dy / d * s; } }
      }
      G.update(1 / 60); frames++; m = D.g.boss; if (!m || m.dead) break;
      if (m.stunT > 0) stunned = 1; if (M.open > 0) opened = 1; if (M.F && M.F.aTo === 0 && M.F.gone) revealed = 1; if (M.bare) bare = 1; me.hp = D.ST.hp; M.gap = 99;
    }
    FX.hurt = hu; FX.H.banner = ban; M.gap = 99;
    return { name, hurts, big, log, banners, secs: +(frames / 60).toFixed(1), stunned, opened, revealed, bare, crossed, charged: M.ob.filter(o => o.charge > 0.5).length, phase: FD.S.phase, side: M.stitch ? 1 : 0, hp: +(m.hp / m.maxhp).toFixed(3) };
  }, [name, opts]);
  const setHp = k => page.evaluate(k => { const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, m = D.g.boss; m.hp = m.maxhp * k; for (let i = 0; i < 60 * 4.5; i++) { G.update(1 / 60); M.gap = 99; D.me.hp = D.ST.hp; } M.job = null; return { phase: FD.S.phase, lie: !!M.F, lieA: M.F ? +M.F.a.toFixed(2) : 0, sky: +M.skyK.toFixed(2), sunk: M.ob.slice(0, 6).filter(o => o.sink > 0.9).length, spider: M.B.tents.every(N => N.mode === 'spider'), white: +M.B.white.toFixed(2) }; }, k);
  const out = {};
  out.lash = await play('nerveLash', { at: [0, 6], dodge: 'safe' }); out.lashHit = await play('nerveLash', { at: [0, 6] });
  check(out.lash.hurts === 0 && out.lashHit.hurts >= 1, 'Nerve Lash: stepping out of the lanes is safe, standing still is not');
  out.thought = await play('intrusive', { at: [2, 6], dodge: 'safe' }); out.thoughtHit = await play('intrusive', { at: [2, 6] });
  check(out.thought.hurts === 0 && out.thoughtHit.hurts >= 1, 'Intrusive Thought: leaving the mark once it locks is safe');
  out.tide = await play('tide', { at: [0, 6], dodge: 'tide' }); out.tideHit = await play('tide', { at: [0, 6] });
  check(out.tide.hurts === 0 && out.tideHit.hurts >= 1, 'Cerebral Tide: its gap lets the pet through');
  out.cond = await play('conductor', { at: [0, 6], dodge: 'bait' });
  check(out.cond.hurts === 0 && out.cond.stunned && out.cond.opened && out.cond.banners.includes('THE CIRCUIT CLOSES'), 'Thought Conductor: two thoughts led onto the lit obelisks close the circuit');
  out.toII = await setHp(0.69);
  check(out.toII.phase === 2 && out.toII.lie && out.toII.lieA > 0.6, 'at 70% a second, false mind opens');
  out.lie = await play('lieAlone', { at: [1, 6] });
  check(out.lie.hurts === 0 && out.lie.banners.includes('A LIE'), 'the first lie comes alone and does no harm');
  out.faReal = await play('falseAwakening', { at: [1, 6], dodge: 'safe', o: { realOn: true } }); out.faRealHit = await play('falseAwakening', { at: [1, 6], o: { realOn: true } }); out.faLie = await play('falseAwakening', { at: [1, 6], o: { realOn: false } });
  check(out.faReal.hurts === 0 && out.faRealHit.hurts >= 1 && out.faLie.hurts === 0, 'False Awakening: the real mark is the one to leave; the lie under the pet is harmless');
  out.rec = await play('recurring', { at: [2, 5], dodge: 'safe' }); out.recHit = await play('recurring', { at: [2, 5] });
  check(out.rec.hurts === 0 && out.recHit.hurts >= 1, 'Recurring Thought: dodged, and its mended mark avoided');
  out.st = await play('stitch', { at: [1, 6], dodge: 'stitch' }); out.stHit = await play('stitch', { at: [1, 6] });
  check(out.st.hurts === 0 && out.st.crossed && out.stHit.hurts >= 1, 'Neural Stitch: out through the opened link before its half is struck');
  out.wall = await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me, C = FX.C, T = window.__pp.FIEND_DEFS.pale._t, m = D.g.boss; me.x = C.x; me.y = C.y + 5; M._prev = { x: me.x, y: me.y }; FD.S.hz.length = 0; M.job = T.stitch(FX, m, { phi: 0 }); let s0 = null;
    for (let i = 0; i < 60 * 1.1; i++) { G.update(1 / 60); M.gap = 99; D.me.hp = D.ST.hp; } const L = M.stitch.links[1]; s0 = Math.sign(me.y - C.y); me.x = (L.x0 + L.x1) / 2; for (let i = 0; i < 80; i++) { me.y -= 0.08 * s0; G.update(1 / 60); M.gap = 99; D.me.hp = D.ST.hp; } const s1 = Math.sign(me.y - C.y); for (let i = 0; i < 60 * 3; i++) { G.update(1 / 60); M.gap = 99; D.me.hp = D.ST.hp; } M.job = null; return { held: s0 === s1, open: M.stitch ? M.stitch.open : -1 }; });
  check(out.wall.held, 'the stitched nerves hold the pet back');
  out.dl = await play('doubleLash', { at: [1, 6], dodge: 'safe' });
  check(out.dl.hurts === 0, 'the double lash: the real lanes read and left; the lie\'s ignored');
  out.sev = await play('sever', { at: [0, 6], dodge: 'sever', wrong: true, extra: 2 });
  check(out.sev.hurts === 0 && out.sev.revealed && out.sev.stunned && out.sev.opened && out.sev.banners.includes('THE DELUSION IS SEVERED'), 'Sever the Delusion: the wrong obelisk only flares; the right one severs the lie');
  out.back = await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg, M = D.FD.FX.mem; for (let i = 0; i < 60 * 9.5; i++) { G.update(1 / 60); M.gap = 99; D.me.hp = D.ST.hp; } return { lieA: M.F ? +M.F.a.toFixed(2) : -1, z: +M.B.zb.toFixed(2) }; });
  check(out.back.lieA > 0.6 && out.back.z > 4.5, 'after the window the lie returns and the mind rises');
  out.toIII = await setHp(0.34);
  check(out.toIII.phase === 3 && !out.toIII.lie && out.toIII.sky > 0.9 && out.toIII.sunk === 6 && out.toIII.spider && out.toIII.white > 0.9, 'at 35% the cathedral goes, the obelisks sink, the nerves rise, the fissure burns white');
  out.pre = await play('premonition', { at: [0, 0], dodge: 'safe', o: { seq: ['inner', 'cross', 'outer'] } }); out.preHit = await play('premonition', { at: [0, 0], o: { seq: ['inner', 'cross', 'outer'] } });
  check(out.pre.hurts === 0 && out.preHit.hurts >= 1, 'Premonition: three futures, each left in its turn');
  out.mem = await play('memory', { at: [-4, 6], walk: [7, -1], dodge: 'mem' }); out.memHit = await play('memory', { at: [-4, 6], walk: [7, -1] });
  check(out.mem.hurts === 0 && out.memHit.hurts >= 1, 'Unwanted Memory: off the remembered path, the ghost passes by');
  out.col = await play('collapse', { at: [0, 6], dodge: 'safe' }); out.colHit = await play('collapse', { at: [0, 6] });
  check(out.col.hurts === 0 && out.colHit.hurts >= 1, 'Synaptic Collapse: from one set of sectors to the other');
  out.wave = await play('unspokenName', { at: [0, 6], o: { castT: 7 }, dodge: 'safe' });
  check(out.wave.big >= 1 && out.wave.banners.includes('IT SPEAKS ITS NAME') && !out.wave.bare, 'the Unspoken Name let run: the wave');
  out.hold = await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, m = D.g.boss; M.nameCd = 0; m.hp = m.maxhp * 0.12; for (let i = 0; i < 30; i++) { G.update(1 / 60); D.me.hp = D.ST.hp; } FD.FX.H.hitMon(m, m.maxhp, {}); for (let i = 0; i < 30; i++) { G.update(1 / 60); D.me.hp = D.ST.hp; } return { dead: !!m.dead, hp: +(m.hp / m.maxhp).toFixed(3), name: !!M.name, job: M.job && M.job.name }; });
  check(!out.hold.dead && out.hold.hp >= 0.029 && out.hold.name, 'below 15% the name begins, and it will not fall before the name goes unspoken');
  out.name = await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg, M = D.FD.FX.mem; return { job: M.job && M.job.name }; });
  out.ans = await play('unspokenName', { at: [0, 6], dodge: 'bait', bind: true, extra: 1 });
  check(out.ans.bare && out.ans.hurts === 0 && out.ans.banners.includes('THE NAME GOES UNSPOKEN'), 'the Unspoken Name answered: four bonds broken, the core bare');
  out.end = await page.evaluate(() => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem; let m = D.g.boss; FD.FX.H.hitMon(m, m.hp * 3 + 1e6, {});
    let sh = 0, s = 1, curl = 0; for (let i = 0; i < 60 * 9; i++) { G.update(1 / 60); D.me.hp = D.ST.hp; if (M.end) { s = Math.min(s, M.B.s); if (M.end.sh && M.end.sh.k > 0.5) sh = 1; if (M.B.tents.every(N => N.mode === 'curl')) curl = 1; } }
    return { end: !!M.end, s: +s.toFixed(2), sh, curl, won: D.g.won };
  });
  check(out.end.end && out.end.s < 0.1 && out.end.sh && out.end.curl && out.end.won, 'the end: its nerves curl, it shrinks to a pearl, the shadow faces it and turns back');
  for (const k in out) console.log(k, JSON.stringify(out[k]));
  console.log(fails.length ? 'pale FAIL: ' + fails.join('; ') : 'pale OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
