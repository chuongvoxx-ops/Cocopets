// (v435 SM) Samael in a fight: summons the Aries Anima, checks the 30 s rule (the entrance not counted), casts each power, lets the mind
// choose, checks Ruin Pressure and the Cataclysm State, runs Wrath of the Fallen (once, the Anima staying till it ends), checks the clean-up,
// and photographs set moments on the GPU path (GLM + FGFX forced on the software rasteriser). The loop is stepped by hand at 60 Hz.
// usage: HTML=test-sm.html node tests/_sm-battle.js [form 1|2|3] [shots 1|0] [dpr] [steps: summon,charge,perd,over,impact,cata,ai,auto,ult,again]
//   OUT=shots/v435-SM (where the photos go), TAG=name (the photos' prefix), CEL=1 (photograph without WebGL: the existing art)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const K = +(process.argv[2] || 3), SHOTS = process.argv[3] !== '0', DPR = +(process.argv[4] || 1), ONLY = process.argv[5] ? process.argv[5].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Samael|GFX|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 600)); });
  await page.addInitScript(() => { window.__NG_GL = 0; window.__SM_GL = 0; window.__SM_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sm.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'aries'; P.st.animas.res = null; P.openMap(); }, { K });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const setup = await page.evaluate(({ K }) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    if (!AN.kit) return 'no kit'; AN.kit.main.id = 'aries'; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; if (!AN.sm) return 'no SM';
    D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -7; dx <= 8 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 2.5; me.y = best.y + 1.5; }
    const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]];
    D.mons.filter(m => !m.boss).forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e7, maxhp: 1e7, still: false, spd: 0, atkCd: 99, dmg: 0, aggro: true }); else Object.assign(m, { dead: true, x: me.x + 200, y: me.y + 200 }); });
    me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
    window.__SMB = { G, D, P, step(sec) { const n = Math.round(sec * 60); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (const m of D.mons) { m.atkCd = 99; } G.update(1 / 60); } } };
    return { summon: AN.summon(), hp: D.ST.hp, place: !!best };
  }, { K });
  console.log('setup', JSON.stringify(setup)); if (!setup || !setup.summon) { console.log(errors); await browser.close(); return; }
  const out = [], tag = process.env.TAG || `sm-k${K}-d${DPR}`, OUTD = process.env.OUT || 'shots/v435-SM';
  const state = () => page.evaluate(() => { const { D } = window.__SMB, AN = D.AN, a = AN.S.list[0], SM = AN.sm, ms = D.mons.filter(m => !m.boss && !m.dead).slice(0, 8);
    return { list: AN.S.list.map(b => b.id + ':' + b.st).join(','), life: a && +a.life.toFixed(2), ready: a && a.sm && a.sm.ready, act: a && a.sm && a.sm.act && a.sm.act.kind, ruin: a && a.sm && Math.round(a.sm.ruin), cata: a && a.sm && +a.sm.cata.toFixed(1), over: a && a.sm && +a.sm.over.toFixed(1), z: a && +(a.dropZ || 0).toFixed(2),
      ul: SM.ul && +SM.ul.t.toFixed(2), dmg: Math.round(ms.reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0)), burn: ms.filter(m => m.burn > 0).length, ruinDebuff: ms.filter(m => m.smRuinT > D.g.t).length, zoomP: +(D.g.zoomP || 1).toFixed(2), cineT: +(D.g.cineT || 0).toFixed(2), fx: SM.fx.length, gpu: window.SAMAEL_GL.gpuCount(), zones: D.zones ? D.zones.filter(z => z.kind === 'fire' && z.own === 'pet').length : -1 }; });
  const draw = async (name) => { if (!SHOTS) return null; const r = await page.evaluate((cel) => { const { G, P } = window.__SMB; window.__NG_GL = cel ? 0 : 1; window.__SM_GL = cel ? 0 : 1; const t0 = performance.now(); G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__NG_GL = 0; window.__SM_GL = 0; const S = window.SAMAEL_GL.STATS; return { ms: Math.round(performance.now() - t0), W: S.W, H: S.H, items: S.items }; }, !!process.env.CEL);
    const f = `${OUTD}/${tag}-${name}.png`; await page.screenshot({ path: path.resolve(__dirname, '..', f), timeout: 300000 }); out.push(f); return r; };
  const beat = async (name, sec) => { await page.evaluate(s => window.__SMB.step(s), sec); const d = await draw(name); const s = await state(); console.log(name, JSON.stringify(s), d ? JSON.stringify(d) : ''); return s; };
  const want = n => !ONLY || ONLY.includes(n);
  const cast = (k, o) => page.evaluate(({ k, o }) => { const { D } = window.__SMB, a = D.AN.S.list[0]; a.life = Math.max(a.life, 20); return D.AN.sm.cast(a, k, o); }, { k, o });
  const dmg0 = () => page.evaluate(() => { const { D } = window.__SMB; return Math.round(D.mons.filter(m => !m.boss && !m.dead).reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0)); });
  const report = {};
  if (want('summon')) { await beat('1-sigil', 0.75); await beat('2-assemble', 0.75); await beat('3-landed', 0.7); await beat('4-roar', 0.9);
    // the 30 s rule: the timer still at 30 while the entrance plays; counting once it is ready
    report.timer = await page.evaluate(() => { const { D } = window.__SMB, a = D.AN.S.list[0], r0 = { life: +a.life.toFixed(2), ready: a.sm.ready }; window.__SMB.step(2); return { atReady: r0, after2s: +a.life.toFixed(2), ready: a.sm.ready }; }); console.log('timer', JSON.stringify(report.timer)); }
  else await page.evaluate(() => window.__SMB.step(4.5));
  const resetMons = () => page.evaluate(() => { const { D } = window.__SMB, me = D.me; const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]]; D.mons.filter(m => !m.boss && !m.dead).forEach((m, i) => { if (i < place.length) Object.assign(m, { x: me.x + place[i][0], y: me.y + place[i][1], kbx: 0, kby: 0 }); }); const a = D.AN.S.list[0]; a.x = me.x - 1.2; a.y = me.y - 0.4; a.dropZ = 0; });
  if (want('charge')) { await resetMons(); await page.evaluate(() => { const { D } = window.__SMB, a = D.AN.S.list[0]; a.x = D.me.x - 4; a.y = D.me.y; }); const d0 = await dmg0(); const far = await page.evaluate(() => { const { D } = window.__SMB, a = D.AN.S.list[0]; return D.mons.filter(m => !m.dead && !m.boss).sort((p, q) => Math.hypot(q.x - a.x, q.y - a.y) - Math.hypot(p.x - a.x, p.y - a.y))[0] ? 1 : 0; }); void far;
    await cast('charge'); await beat('5-charge-wind', 0.5); await beat('5-charge-run', 0.45); await beat('5-charge-impact', 0.4); const s = await beat('5-charge-after', 1.6); report.charge = s.dmg - d0; report.chargeZones = s.zones; }
  if (want('perd')) { await resetMons(); const d0 = await dmg0(); await cast('perd'); await beat('6-perd-open', 0.7); await beat('6-perd-slash', 0.5); await beat('6-perd-slashes', 0.9); const s = await beat('6-perd-end', 1.8); report.perd = s.dmg - d0; }
  if (want('over')) { await resetMons(); const d0 = await dmg0(); await cast('over'); await beat('7-over-brace', 0.7); await beat('7-over-ignite', 0.6); const s = await beat('7-over-corona', 1.6); report.over = { dmg: s.dmg - d0, left: s.over };
    report.overRefresh = await page.evaluate(() => { const { D } = window.__SMB, a = D.AN.S.list[0], b = a.sm.over; D.AN.sm.cast(a, 'over'); window.__SMB.step(1.5); return { before: +b.toFixed(1), after: +a.sm.over.toFixed(1) }; }); }
  if (want('impact')) { await resetMons(); const d0 = await dmg0(); await cast('impact'); await beat('8-impact-crouch', 0.42); await beat('8-impact-rise', 0.45); await beat('8-impact-hang', 0.4); await beat('8-impact-dive', 0.22); await beat('8-impact-hit', 0.12); const s = await beat('8-impact-after', 1.3); report.impact = s.dmg - d0; }
  if (want('cata')) { await resetMons(); const r = await page.evaluate(() => { const { D } = window.__SMB, a = D.AN.S.list[0]; a.sm.act = null; a.sm.cata = 0; a.sm.ruin = 98; a.life = 20; const life0 = a.life; D.AN.sm.cast(a, 'charge'); window.__SMB.step(1.4); return { cata: +a.sm.cata.toFixed(1), ruin: a.sm.ruin, lifeDrop: +(life0 - a.life).toFixed(2) }; }); console.log('cata', JSON.stringify(r)); report.cata = r; await beat('9-cataclysm', 0.3); }
  if (want('ai')) {
    report.ai = await page.evaluate(() => { const { D } = window.__SMB, me = D.me, a = D.AN.S.list[0], SM = D.AN.sm, live = D.mons.filter(m => !m.boss && !m.dead), out = {};
      const park = () => live.forEach((m, i) => Object.assign(m, { x: me.x - 30 - i, y: me.y - 30 }));
      const tally = () => { const c = {}; for (let i = 0; i < 40; i++) { const q = SM.choose(a); const k = q ? q.kind : 'none'; c[k] = (c[k] || 0) + 1; } return c; };
      a.x = me.x + 1; a.y = me.y; a.sm.act = null; a.sm.over = 0; a.life = 20; a.dropZ = 0;
      park(); Object.assign(live[0], { x: a.x + 6, y: a.y }); out.far = tally();
      park(); [[1.5, 0], [1.8, 0.8], [1.4, -0.9], [2.2, 0.3]].forEach(([dx, dy], i) => Object.assign(live[i], { x: a.x + dx, y: a.y + dy })); out.packed = tally();
      park(); [[5.5, 0], [6, 0.6], [5.6, -0.6], [6.4, 0.2], [5.9, 1.2]].forEach(([dx, dy], i) => Object.assign(live[i], { x: a.x + dx, y: a.y + dy })); out.crowdFar = tally();
      a.sm.over = 5; out.overActive = tally(); a.sm.over = 0; return out; });
    console.log('ai', JSON.stringify(report.ai)); }
  if (want('auto')) { await resetMons(); report.auto = await page.evaluate(() => { const { D } = window.__SMB, a = D.AN.S.list[0], seen = []; let idle = 0; a.life = 20; for (let i = 0; i < 60 * 12; i++) { window.__SMB.step(1 / 60); const k = a.sm.act && a.sm.act.kind; if (k && seen[seen.length - 1] !== k) seen.push(k); if (!k) idle++; } return { seen, idleS: +(idle / 60).toFixed(2) }; }); console.log('auto', JSON.stringify(report.auto)); }
  if (want('ult')) {
    await resetMons(); await page.evaluate(() => { const { D } = window.__SMB, a = D.AN.S.list[0]; a.sm.ruin = 100; a.sm.cata = 6; D.AN.S.list.forEach(b => { if (b.st === 'fight') b.life = 0.01; }); });
    await beat('10-awaken', 1.2); const d0 = await dmg0();
    for (const [n, s] of [['11-u1-awakening', 1.7], ['12-u2-seal', 1.1], ['13-u2-crown', 0.8], ['14-u3-launch', 1.35], ['15-u3-ascend', 0.65], ['16-u4-fallen-star', 0.9], ['17-u4-dive', 1.2], ['18-u5-impact', 0.85], ['19-u5-fireball', 0.4], ['20-u5-rings', 0.45], ['21-u5-burst', 0.6], ['22-u6-remains', 1.0], ['23-u6-roar', 0.6], ['24-u6-dissolve', 0.8], ['25-after', 0.9]]) await beat(n, s);
    report.ult = (await dmg0()) - d0;
    report.once = await page.evaluate(() => { const { D } = window.__SMB; return { list: D.AN.S.list.length, ul: !!D.AN.sm.ul }; });
  }
  const after = await page.evaluate(() => { const { D } = window.__SMB, AN = D.AN, r = { list: AN.S.list.length, ward: AN.sm.wardOn, zoomP: D.g.zoomP, cineT: D.g.cineT, fx: AN.sm.fx.length, gpuBefore: window.SAMAEL_GL.gpuCount(), hold: AN.S.list.some(a => a.hold || a.judg) };
    for (let i = 0; i < 240; i++) window.__SMB.step(1 / 60); r.gpuAfterIdle = window.SAMAEL_GL.gpuCount(); r.idle = { list: AN.S.list.length, ward: AN.sm.wardOn, fx: AN.sm.fx.length, zoomP: +D.g.zoomP.toFixed(3) }; AN.stop(); r.gpuAfterStop = window.SAMAEL_GL.gpuCount(); return r; });
  console.log('cleanup', JSON.stringify(after)); console.log('report', JSON.stringify(report));
  if (want('again')) {   // a second summon after the first has gone (no leak: the buffers come back and go again)
    const r2 = await page.evaluate(() => { const { D } = window.__SMB, AN = D.AN; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); const ok = AN.summon(); window.__SMB.step(5); const a = AN.S.list[0]; const s1 = { ok, st: a && a.st, ready: a && a.sm.ready, life: a && +a.life.toFixed(1) }; if (a) a.life = 0.01; window.__SMB.step(16.5); s1.after = AN.S.list.length; window.__SMB.step(4); s1.gpu = window.SAMAEL_GL.gpuCount(); return s1; });
    console.log('again', JSON.stringify(r2)); }
  require('fs').writeFileSync(path.resolve(__dirname, '..', `${OUTD}/${tag}-list.json`), JSON.stringify(out));
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
