// Choronzon, the Sovereign of Thorns, stepped fast without drawing. Each attack played properly lands no blow (and
// standing in it does): Royal Impalement (and its shafts bar the way), Needle Decree (and turned back by a lit pillar,
// its ward falls), Fan of Ruin; the cage (its walls hold, Open Sentence's way out, a weak spike broken and the cage
// re-formed), Contracting Law, Thorn Exchange; the Perfect Weapon's Verdicts, Crownfall and Piercing Silence (its rest),
// The Last Command baited into two pillars (and not), and the end.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(90, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; for (let i = 0; i < 60 * 5; i++) G.update(1 / 60); });
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  const play = (name, opts) => page.evaluate(([name, opts]) => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me, C = FX.C, T = window.__pp.FIEND_DEFS.choronzon._t;
    let m = D.g.boss, hurts = 0, big = 0; const banners = [], seen = {};
    const hu = FX.hurt; FX.hurt = function (d, o) { hurts++; if (d > m.dmg * 2.2) big++; return hu.apply(this, arguments); };
    const ban = FX.H.banner; FX.H.banner = function (a) { banners.push(a); return ban.apply(this, arguments); };
    const put = (x, y) => { const dx = x - C.x, dy = y - C.y, d = Math.hypot(dx, dy), k = d > 12.6 ? 12.6 / d : 1; me.x = C.x + dx * k; me.y = C.y + dy * k; M._prev = { x: me.x, y: me.y }; };
    const behind = i => { const p = M.pil[i], dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy); return [p.x + dx / d * 2.3, p.y + dy / d * 2.3]; };
    if (opts.at) put(C.x + opts.at[0], C.y + opts.at[1]);
    M.job = null; M.gap = 99; M.sigCd = 99; FD.S.hz.length = 0; M.aim = null; M.way = null; D.eshots && (D.eshots.length = 0);
    const J = T[name](FX, m, opts.o || {}); J.name = name; M.job = J;
    let frames = 0, disrupted = 0, posted = 0, shattered = 0, opened = 0, vulBroken = 0, inside = true, stunned = 0;
    const warns = () => FD.S.hz.filter(z => z.gw && !z.fired && !z.cut);
    while ((M.job === J || opts.extra && frames < opts.extra * 60) && frames < 60 * 30) {
      const W = warns();
      if (opts.dodge === 'perp') for (const z of W) { if (z._dodged || z.shape !== 'band') continue; z._dodged = 1; const dx = z.x1 - z.x0, dy = z.y1 - z.y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, s = (me.x - z.x0) * nx + (me.y - z.y0) * ny, k = s >= 0 ? 1 : -1; put(me.x + nx * k * (z.hw + 1.9 - Math.abs(s)), me.y + ny * k * (z.hw + 1.9 - Math.abs(s))); }
      if (opts.dodge === 'circles') for (const z of W) { if (z._dodged || z.shape !== 'circle' || z.dmg <= 0) continue; z._dodged = 1; if (Math.hypot(me.x - z.x, me.y - z.y) < z.r + 0.6) { const a = Math.atan2(C.y - me.y, C.x - me.x); put(me.x + Math.cos(a) * 3, me.y + Math.sin(a) * 3); } }
      if (opts.dodge === 'behind') { const lit = M.pil.map((p, i) => i).filter(i => M.pil[i].lit > 0.5); if (M.aim && !M.aim.lock && lit.length) { const i = lit.sort((a, b) => Math.hypot(M.pil[a].x - me.x, M.pil[a].y - me.y) - Math.hypot(M.pil[b].x - me.x, M.pil[b].y - me.y))[0], b = behind(i); put(b[0], b[1]); } }
      if (opts.dodge === 'gap' && M.cage && M.cage.off.some(x => x) && !seen.gap) { seen.gap = 1; const w = M.cage.off.indexOf(1), o = M.cage.order, a = M.plant[o[w]], b = M.plant[o[(w + 1) % 6]], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = mx - m.x, dy = my - m.y, d = Math.hypot(dx, dy); put(mx - dx / d * 0.4, my - dy / d * 0.4); for (let s = 0; s < 30; s++) { me.x += dx / d * 0.1; me.y += dy / d * 0.1; G.update(1 / 60); frames++; } }
      if (opts.breakVul) { const o = FD.S.objs.find(q => q.kind === 'cspike' && !q.dead); if (o) { FX.H.hitMon(o, o.maxhp * 0.2, {}); if (o.dead || o.hp <= 0) vulBroken = 1; } }
      if (opts.dodge === 'way' && M.way && !seen.way) { seen.way = 1; const a = Math.atan2(M.way.y - me.y, M.way.x - me.x); put(me.x + Math.cos(a) * 4.2, me.y + Math.sin(a) * 4.2); }
      G.update(1 / 60); frames++; m = D.g.boss; if (!m || m.dead) break;
      if (M.disrupt > 0) disrupted = 1; if (M.posts.length) posted = 1; if (M.shattered) shattered = 1; if (M.open > 0) opened = 1; if (m.stunT > 0) stunned = 1; me.hp = D.ST.hp;
    }
    if (M.cage && M.plant) { const P = M.cage.order.map(i => [M.plant[i].x, M.plant[i].y]); let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i][1] > me.y) !== (P[j][1] > me.y)) && me.x < (P[j][0] - P[i][0]) * (me.y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) ins = !ins; } inside = ins; }
    FX.hurt = hu; FX.H.banner = ban; M.gap = 99;
    return { name, hurts, big, banners, secs: +(frames / 60).toFixed(1), disrupted, posted, shattered, opened, vulBroken, stunned, inside, lit: M.pil.filter(p => p.lit > 0.5).length, shield: M.shield, phase: FD.S.phase, cage: !!M.cage };
  }, [name, opts]);
  const setHp = k => page.evaluate(k => { const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, m = D.g.boss; m.hp = m.maxhp * k; for (let i = 0; i < 60 * 4.5; i++) { G.update(1 / 60); M.gap = 99; } M.job = null; return { phase: FD.S.phase, form: M.form, cage: !!M.cage, plant: M.plant ? M.plant.length : 0, lit: M.pil.filter(p => p.lit > 0.5).length }; }, k);
  const out = {};
  out.imp = await play('impalement', { at: [0, 6], dodge: 'circles' });
  out.impHit = await play('impalement', { at: [0, 6] });
  check(out.imp.hurts === 0 && out.impHit.hurts >= 1 && out.imp.posted, 'Royal Impalement: moving off each mark is safe; its shafts stand');
  out.dec = await play('decree', { at: [3, 6], dodge: 'perp' });
  out.decHit = await play('decree', { at: [3, 6] });
  check(out.dec.hurts === 0 && out.decHit.hurts >= 1, 'Needle Decree: a sidestep is safe, standing still is not');
  out.refl = await play('decree', { at: [3, 6], dodge: 'behind', extra: 2 });
  check(out.refl.hurts === 0 && out.refl.disrupted && out.refl.lit === 5, 'Reflected Command: a lit pillar turns the Decree back, its ward falls, that diamond goes dark');
  out.fan = await play('fan', { at: [0, 7.5], dodge: 'perp' });
  check(out.fan.hurts === 0, 'Fan of Ruin: its paths can be stepped out of');
  out.toII = await setHp(0.69);
  check(out.toII.phase === 2 && out.toII.cage && out.toII.plant === 6, 'at 70% it plants the cage');
  out.open = await play('openSentence', { at: [1, 1], dodge: 'gap', breakVul: true, extra: 9 });
  check(out.open.hurts === 0 && out.open.vulBroken && out.open.stunned && out.open.opened, 'Open Sentence: out through the gap; the weak spike broken, it reels');
  out.reform = await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg, M = D.FD.FX.mem; for (let i = 0; i < 60 * 3; i++) { G.update(1 / 60); M.gap = 99; } return { cage: !!M.cage, off: M.cage ? M.cage.off.reduce((a, b) => a + b, 0) : -1 }; });
  check(out.reform.cage && out.reform.off === 0, 'the cage re-forms whole');
  out.wallsHold = await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, m = D.g.boss; me.x = m.x; me.y = m.y + 2; M._prev = { x: me.x, y: me.y }; for (let i = 0; i < 160; i++) { me.y += 0.08; G.update(1 / 60); M.gap = 99; } return { d: +Math.hypot(me.x - m.x, me.y - m.y).toFixed(2) }; });
  check(out.wallsHold.d < 8.6, 'the cage walls hold the pet in');
  out.law = await play('contracting', { at: [0, 0.6] });
  check(out.law.hurts === 0 && out.law.banners.includes('CONTRACTING LAW'), 'Contracting Law: the middle stays safe');
  out.ex = await play('exchange', { at: [0, 0.4] });
  check(out.ex.banners.includes('THORN EXCHANGE'), 'Thorn Exchange plays');
  out.toIII = await setHp(0.34);
  check(out.toIII.phase === 3 && out.toIII.form === 'arrows' && !out.toIII.cage && out.toIII.lit === 6, 'at 35% the arrowheads form and the pillars recharge');
  out.ver = await play('verdicts', { at: [2, 6], dodge: 'perp' });
  check(out.ver.hurts === 0, 'Opposing Verdicts: both can be dodged in turn');
  out.cf = await play('crownfall', { at: [0, 5], dodge: 'way' });
  check(out.cf.hurts === 0, 'Crownfall: the way to a lit pillar is clear');
  out.sil = await play('silence', { at: [1, 6], dodge: 'perp' });
  check(out.sil.hurts === 0 && out.sil.stunned && out.sil.opened, 'Piercing Silence: dodged, then it rests');
  out.lcFail = await play('lastCommand', { at: [2, 6], dodge: 'perp' });
  check(!out.lcFail.shattered && out.lcFail.shield === 0, 'The Last Command not baited: the shield holds, then lifts');
  out.lc = await play('lastCommand', { at: [2, 6], dodge: 'behind' });
  check(out.lc.shattered && out.lc.hurts === 0 && out.lc.opened, 'The Last Command baited into two lit pillars: the shield breaks');
  out.end = await page.evaluate(() => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem; let m = D.g.boss; m.stunT = 1; FD.FX.H.hitMon(m, m.hp * 3 + 1e6, {});
    let bits = 0, grey = 0; for (let i = 0; i < 60 * 9; i++) { G.update(1 / 60); if (M.end) { grey = Math.max(grey, M.grey); if (M.end.bits) bits = M.end.bits.length; } }
    return { end: !!M.end, grey, bits, form: M.form, won: D.g.won };
  });
  check(out.end.end && out.end.grey > 0.99 && out.end.bits > 10 && out.end.form === 'monument' && out.end.won, 'the end: a monument; grey, cracked, dust');
  for (const k in out) console.log(k, JSON.stringify(out[k]));
  console.log(fails.length ? 'choronzon FAIL: ' + fails.join('; ') : 'choronzon OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
