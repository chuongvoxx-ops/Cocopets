// Abaddon, the Final Division, stepped fast without drawing. Each attack played properly lands no blow (and standing
// in it does): Bisection, Cross Examination (the corners), Pinpoint (its opening), Fault Lines (lane by lane),
// Contradiction (and the fissures it leaves bar the way), Closing Argument (the gap), Reassembly (the open core),
// the stage changes, Final Proof failed and then broken through the core, and the end in eight pieces.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(70, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; for (let i = 0; i < 60 * 5; i++) G.update(1 / 60); });
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  // play one attack: the pet is placed, then moved by a strategy each frame; blows that would land are counted
  const play = (name, opts) => page.evaluate(([name, opts]) => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me, C = FX.C, Dd = window.__pp.FIEND_DEFS.abaddon, T = Dd._t, HS = T.HS;
    let m = D.g.boss, hurts = 0, big = 0; const banners = [], seen = {};
    const hu = FX.hurt; FX.hurt = function (d, o) { hurts++; if (d > m.dmg * 2.5) big++; return hu.apply(this, arguments); };
    const ban = FX.H.banner; FX.H.banner = function (a) { banners.push(a); return ban.apply(this, arguments); };
    const put = (x, y) => { me.x = Math.max(C.x - HS + 0.6, Math.min(C.x + HS - 0.6, x)); me.y = Math.max(C.y - HS + 0.6, Math.min(C.y + HS - 0.6, y)); };
    if (opts.at) put(C.x + opts.at[0], C.y + opts.at[1]);
    M.job = null; M.gap = 99; M.sigCd = 99; FD.S.hz.length = 0; M.mark = null; M.sq = null;
    const J = T[name](FX, m, opts.o || {}); J.name = name; M.job = J;
    const warns = () => FD.S.hz.filter(z => z.gw && !z.fired && !z.cut);
    let frames = 0, minHz = 99, coreSeen = false, wallHeld = null, laneMoves = 0;
    while (M.job === J && frames < 60 * 30) {
      const W = warns();
      if (opts.dodge === 'perp') { for (const z of W) if (z.shape === 'band' && !z._dodged && FX.inShape ? true : true) { if (z._dodged || z.shape !== 'band') continue; z._dodged = 1; const dx = z.x1 - z.x0, dy = z.y1 - z.y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, s = (me.x - z.x0) * nx + (me.y - z.y0) * ny, k = s >= 0 ? 1 : -1; let tx = me.x + nx * k * (z.hw + 2.2 - Math.abs(s)), ty = me.y + ny * k * (z.hw + 2.2 - Math.abs(s)); if (Math.abs(tx - C.x) > HS - 0.7 || Math.abs(ty - C.y) > HS - 0.7) { tx = me.x - nx * k * (z.hw + 2.2 + Math.abs(s)); ty = me.y - ny * k * (z.hw + 2.2 + Math.abs(s)); } put(tx, ty); } }
      if (opts.dodge === 'away' && M.mark && M.mark.lock && !seen.away) { seen.away = 1; put(M.mark.x + 4, M.mark.y + 3); }
      if (opts.dodge === 'lanes') {
        // stand outside whichever lane strikes next: a lane that has already struck is safe, so cross into it
        const next = W.slice().sort((a, b) => (a.t - a.age) - (b.t - b.age))[0];
        if (next && window.__pp.FIEND_DEFS && FX.inShape) { const inNext = Math.abs(next.x0 === next.x1 ? me.x - next.x0 : me.y - next.y0) < next.hw + me.r; if (inNext) { const done = FD.S.hz.filter(z => z.gw && z.fired && z.shape === 'band' && z.hw > 3); const tgt = done.length ? done[done.length - 1] : W.slice().sort((a, b) => (b.t - b.age) - (a.t - a.age))[0]; if (tgt.x0 === tgt.x1) put(tgt.x0, me.y); else put(me.x, tgt.y0); laneMoves++; } }
      }
      if (opts.dodge === 'gap' && M.sq && !seen.gap) { seen.gap = 1; const d = [[0, -1], [1, 0], [0, 1], [-1, 0]][M.sq.q]; put(C.x + d[0] * M.sq.stop * 0.6, C.y + d[1] * M.sq.stop * 0.6); }
      if (opts.dodge === 'corridor' && W.some(z => z.label === 'CORRIDOR') && !seen.cor) { seen.cor = 1; const z = W.find(q => q.label === 'CORRIDOR'); if (z.y0 === z.y1) put(me.x, z.y0 + (z.y0 > C.y ? -6.5 : 6.5)); else put(z.x0 + (z.x0 > C.x ? -6.5 : 6.5), me.y); }
      if (opts.hitCore && M.coreK > 0.5 && FD.S.weak.core && !FD.S.weak.core.dead) { coreSeen = true; FX.H.hitMon(FD.S.weak.core, opts.hitCore, {}); }
      G.update(1 / 60); frames++; m = D.g.boss; if (!m || m.dead) break;
      minHz = Math.min(minHz, M.hz); if (M.coreK > 0.5) coreSeen = true; me.hp = D.ST.hp;
    }
    FX.hurt = hu; FX.H.banner = ban; M.gap = 99;
    return { name, hurts, big, banners, secs: +(frames / 60).toFixed(1), minHz: +minHz.toFixed(2), coreSeen, fis: M.fis.filter(f => !f.gone).length, stun: m ? +(m.stunT || 0).toFixed(1) : 0, laneMoves, phase: FD.S.phase };
  }, [name, opts]);
  const setHp = k => page.evaluate(k => { const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, m = D.g.boss; m.hp = m.maxhp * k; for (let i = 0; i < 60 * 4.5; i++) { G.update(1 / 60); M.gap = 99; } M.job = null; return { phase: FD.S.phase, lv: FD.S.lv, split: +M.split.toFixed(2), silver: +M.silver.toFixed(2), form: M.form, trans: !!M.trans }; }, k);
  const out = {};
  // stage I
  out.bis = await play('bisection', { at: [3, 4], dodge: 'perp' });
  out.bisHit = await play('bisection', { at: [3, 4] });
  out.cross = await play('crossExam', { at: [-7.5, -7.5] });
  out.crossHit = await play('crossExam', { at: [0.5, 0.5] });
  out.pin = await play('pinpoint', { at: [2, 3], dodge: 'away' });
  out.fault = await play('faultLines', { at: [1, 1], dodge: 'lanes' });
  check(out.bis.hurts === 0 && out.bisHit.hurts >= 1, 'Bisection: stepping aside is safe, standing in it is not');
  check(out.cross.hurts === 0 && out.crossHit.hurts >= 1, 'Cross Examination: the corners are safe, the middle is not');
  check(out.pin.hurts === 0 && out.pin.minHz < 4, 'Pinpoint: it drops (and misses a pet that moved)');
  check(out.fault.hurts === 0 && out.fault.laneMoves >= 1 && out.fault.banners.includes('FAULT LINES'), 'Fault Lines: crossing into each cleared lane is safe');
  // stage II
  out.toII = await setHp(0.69);
  check(out.toII.phase === 2 && out.toII.split > 0.9, 'at 70% it parts into two halves');
  out.contra = await play('contradiction', { at: [2, 2], dodge: 'perp' });
  check(out.contra.hurts === 0 && out.contra.fis >= 1, 'Contradiction: both cuts can be dodged, and they leave fissures');
  // a fissure bars the way: walk at it from one side and the pet stays on that side
  out.wall = await page.evaluate(() => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me; const f = M.fis.find(q => !q.gone); if (!f) return null;
    const mx = (f.x0 + f.x1) / 2, my = (f.y0 + f.y1) / 2, L = Math.hypot(f.x1 - f.x0, f.y1 - f.y0), nx = -(f.y1 - f.y0) / L, ny = (f.x1 - f.x0) / L;
    me.x = mx + nx * 1.5; me.y = my + ny * 1.5; M._prev = { x: me.x, y: me.y }; G.update(1 / 60);
    for (let i = 0; i < 60; i++) { me.x -= nx * 0.06; me.y -= ny * 0.06; G.update(1 / 60); }
    const side = (me.x - mx) * nx + (me.y - my) * ny; return { side: +side.toFixed(2), held: side > 0 };
  });
  check(out.wall && out.wall.held, 'a fissure bars the way');
  out.closing = await play('closing', { at: [0, 6], dodge: 'gap' });
  out.closingHit = await play('closing', { at: [0, 6] });
  check(out.closing.hurts === 0 && out.closingHit.hurts >= 1, 'Closing Argument: the gap is safe, staying put is not');
  out.re = await play('reassembly', { at: [1, 1], dodge: 'corridor', hitCore: 1 });
  check(out.re.hurts === 0 && out.re.coreSeen, 'Reassembly: leaving the corridor is safe, and the core opens');
  // stage III
  out.toIII = await setHp(0.34);
  check(out.toIII.phase === 3 && out.toIII.silver > 0.9 && out.toIII.form === 'crown', 'at 35% it turns silver and crowns its blades');
  out.proofFail = await play('finalProof', { at: [-7.5, -7.5], dodge: 'perp' });
  check(out.proofFail.big === 1 && out.proofFail.stun > 0, 'Final Proof unbroken: one heavy blow, then it is spent');
  out.proofWin = await play('finalProof', { at: [-7.5, -7.5], dodge: 'perp', hitCore: 3000 });
  check(out.proofWin.big === 0 && out.proofWin.banners.includes('PROOF REFUTED') && out.proofWin.stun > 2, 'Final Proof broken through the core');
  // the end
  out.end = await page.evaluate(() => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem; let m = D.g.boss; FD.FX.H.hitMon(m, m.hp + 10, {});
    let maxP = 0, rested = 0; for (let i = 0; i < 60 * 9; i++) { G.update(1 / 60); if (M.end && M.end.pieces) { maxP = M.end.pieces.length; rested = M.end.pieces.filter(p => p.rest).length; } }
    return { end: !!M.end, pieces: maxP, rested, state: window.__pp.arc.state, won: D.g.won };
  });
  check(out.end.end && out.end.pieces === 8 && out.end.rested >= 6 && out.end.won, 'the end: eight pieces fall and come to rest');
  console.log(JSON.stringify(out, null, 1));
  console.log(fails.length ? 'abaddon FAIL: ' + fails.join('; ') : 'abaddon OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
