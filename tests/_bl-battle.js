// (v426 BL) Belial in a fight: summons the Taurus Anima, casts each power, lets the mind choose, runs Dominion of the World Pillar,
// checks the combat effects and the clean-up, and photographs set moments on the GPU path (GLM + FGFX forced on the software rasteriser).
// The game loop is stopped and stepped by hand at 60 Hz; each photo is one drawn frame.
// usage: HTML=test-bl.html node tests/_bl-battle.js [form 1|2|3] [shots 1|0] [dpr] [steps: summon,rush,crown,carapace,stamp,auto,ult]
//   OUT=shots/v426-BL (where the photos go), TAG=name (the photos' prefix), CEL=1 (photograph the cel-shaded fallback, no WebGL)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const K = +(process.argv[2] || 3), SHOTS = process.argv[3] !== '0', DPR = +(process.argv[4] || 1), ONLY = process.argv[5] ? process.argv[5].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Belial|GFX|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 400)); });
  await page.addInitScript(() => { window.__NG_GL = 0; window.__BL_GL = 0; window.__BL_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-bl.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'taurus'; P.st.animas.res = null; P.openMap(); }, { K });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const setup = await page.evaluate(({ K }) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    if (!AN.kit) return 'no kit'; AN.kit.main.id = 'taurus'; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; if (!AN.bl) return 'no BL';
    D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -6; dx <= 7 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 2.5; me.y = best.y + 1.5; }
    const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]];
    D.mons.filter(m => !m.boss).forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e7, maxhp: 1e7, still: false, spd: 0, atkCd: 99, dmg: 0, aggro: true }); else Object.assign(m, { dead: true, x: me.x + 200, y: me.y + 200 }); });
    me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
    window.__BL = { G, D, P, step(sec) { const n = Math.round(sec * 60); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (const m of D.mons) { m.atkCd = 99; } G.update(1 / 60); } } };
    return { summon: AN.summon(), hp: D.ST.hp, place: !!best };
  }, { K });
  console.log('setup', JSON.stringify(setup)); if (!setup || !setup.summon) { console.log(errors); await browser.close(); return; }
  const out = [], tag = process.env.TAG || `bl-k${K}-d${DPR}`, OUTD = process.env.OUT || 'shots/v426-BL';
  const state = () => page.evaluate(() => { const { D } = window.__BL, AN = D.AN, a = AN.S.list[0], BL = AN.bl, ms = D.mons.filter(m => !m.boss && !m.dead).slice(0, 8);
    return { list: AN.S.list.map(b => b.id + ':' + b.st).join(','), life: a && +a.life.toFixed(2), act: a && a.bl && a.bl.act && a.bl.act.kind, pos: a && [+a.x.toFixed(1), +a.y.toFixed(1)], bar: BL.barrier && { store: Math.round(BL.barrier.store) }, ul: BL.ul && +BL.ul.t.toFixed(2),
      dmg: Math.round(ms.reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0)), slow: ms.filter(m => m.sandT > 0).length, weak: ms.filter(m => m.belT > D.g.t).length, zoomP: +(D.g.zoomP || 1).toFixed(2), cineT: +(D.g.cineT || 0).toFixed(2), fx: BL.fx.length, gpu: window.BELIAL_GL.gpuCount(), pet: Math.round(D.me.hp) }; });
  const draw = async (name) => { if (!SHOTS) return null; const r = await page.evaluate((cel) => { const { G, P } = window.__BL; window.__NG_GL = cel ? 0 : 1; window.__BL_GL = cel ? 0 : 1; const t0 = performance.now(); G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__NG_GL = 0; window.__BL_GL = 0; const S = window.BELIAL_GL.STATS; return { ms: Math.round(performance.now() - t0), W: S.W, H: S.H, items: S.items }; }, !!process.env.CEL);
    const f = `${OUTD}/${tag}-${name}.png`; await page.screenshot({ path: path.resolve(__dirname, '..', f) }); out.push(f); return r; };
  const beat = async (name, sec) => { await page.evaluate(s => window.__BL.step(s), sec); const d = await draw(name); const s = await state(); console.log(name, JSON.stringify(s), d ? JSON.stringify(d) : ''); return s; };
  const want = n => !ONLY || ONLY.includes(n);
  const cast = (k) => page.evaluate(k => { const { D } = window.__BL, a = D.AN.S.list[0]; a.bl.first = true; a.life = Math.max(a.life, 12); return D.AN.bl.cast(a, k); }, k);
  const dmg0 = () => page.evaluate(() => { const { D } = window.__BL; return Math.round(D.mons.filter(m => !m.boss && !m.dead).reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0)); });
  const report = {};
  if (want('summon')) { await beat('1-sigil', 0.75); await beat('2-assemble', 0.45); await beat('3-landed', 0.55); await beat('4-roar', 1.2); }
  else await page.evaluate(() => window.__BL.step(3.2));
  const resetMons = () => page.evaluate(() => { const { D } = window.__BL, me = D.me; const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]]; D.mons.filter(m => !m.boss && !m.dead).forEach((m, i) => { if (i < place.length) Object.assign(m, { x: me.x + place[i][0], y: me.y + place[i][1], kbx: 0, kby: 0 }); }); const a = D.AN.S.list[0]; a.x = me.x - 1.2; a.y = me.y - 0.4; });
  if (want('rush')) { await resetMons(); await page.evaluate(() => { const { D } = window.__BL, a = D.AN.S.list[0]; a.x = D.me.x - 4; a.y = D.me.y; }); const d0 = await dmg0(); await cast('rush'); await beat('5-rush-wind', 0.7); await beat('5-rush-charge', 0.55); await beat('5-rush-impact', 0.5); const s = await beat('5-rush-after', 0.8); report.rush = s.dmg - d0; }
  if (want('crown')) { await resetMons(); const d0 = await dmg0(); await cast('crown'); await beat('6-crown-rise', 0.8); await beat('6-crown-rings', 1.0); const s1 = await beat('6-crown-press', 1.2); await beat('6-crown-end', 1.6); report.crown = (await dmg0()) - d0; report.crownSlow = s1.slow; }
  if (want('carapace')) { await resetMons(); await cast('carapace'); await beat('7-carapace-rise', 0.9);
    const hr = await page.evaluate(() => { const { D } = window.__BL, me = D.me; me.hp = D.ST.hp; const h0 = me.hp; let land = 0; for (let i = 0; i < 3; i++) { me.inv = 0; if (D.X.hurtPet(D.ST.hp * 0.1, D.mons.find(q => !q.dead))) land++; } return { lost: Math.round(h0 - me.hp), raw: Math.round(D.ST.hp * 0.3), store: Math.round(D.AN.bl.barrier ? D.AN.bl.barrier.store : -1), land }; });
    console.log('carapace-hit', JSON.stringify(hr)); report.carapace = hr; await beat('7-carapace-hold', 1.4); const d0 = await dmg0(); await beat('7-carapace-wave', 3.1); report.retaliation = (await dmg0()) - d0; }
  if (want('stamp')) { await resetMons(); await page.evaluate(() => { const { D } = window.__BL, a = D.AN.S.list[0]; a.x = D.me.x + 2.0; a.y = D.me.y; }); const d0 = await dmg0(); await cast('stamp'); await beat('8-stamp-1', 0.5); await beat('8-stamp-2', 0.6); await beat('8-stamp-3', 0.9); const s = await beat('8-stamp-end', 2.6); report.stamp = s.dmg - d0; }
  if (want('auto')) { await resetMons(); const picks = await page.evaluate(() => { const { D } = window.__BL, a = D.AN.S.list[0], seen = []; a.life = 20; for (let i = 0; i < 60 * 14; i++) { window.__BL.step(1 / 60); const k = a.bl.act && a.bl.act.kind; if (k && seen[seen.length - 1] !== k) seen.push(k); } return seen; }); console.log('auto picks', JSON.stringify(picks)); report.auto = picks; }
  if (want('ai')) {   // what the mind picks: one far monster -> the charge; a crowd round a point -> the crown; the pet hurt and swarmed -> the carapace; packed on it -> the stampede
    report.ai = await page.evaluate(() => { const { D } = window.__BL, me = D.me, a = D.AN.S.list[0], BL = D.AN.bl, live = D.mons.filter(m => !m.boss && !m.dead), out = {};
      const park = () => live.forEach((m, i) => Object.assign(m, { x: me.x - 30 - i, y: me.y - 30 }));
      const tally = (n) => { const c = {}; for (let i = 0; i < 40; i++) { const q = BL.choose(a); const k = q ? q.kind : 'none'; c[k] = (c[k] || 0) + 1; } return c; };
      a.x = me.x + 1; a.y = me.y; a.bl.act = null; a.bl.hurt = 0; me.hp = D.ST.hp; a.life = 8;
      park(); Object.assign(live[0], { x: a.x + 6, y: a.y }); out.far = tally();
      park(); [[4.5, 0], [5, 0.6], [4.6, -0.6], [5.4, 0.2]].forEach(([dx, dy], i) => Object.assign(live[i], { x: a.x + dx, y: a.y + dy })); out.crowd = tally();
      park(); me.hp = D.ST.hp * 0.4; a.bl.hurt = D.ST.hp * 0.15; [[0.8, 0.5], [-0.6, 0.7], [0.4, -0.8]].forEach(([dx, dy], i) => Object.assign(live[i], { x: me.x + dx, y: me.y + dy })); a.x = me.x + 7; out.petHurt = tally();
      me.hp = D.ST.hp; a.bl.hurt = 0; park(); a.x = me.x + 1; [[1.2, 0], [1.4, 0.8], [1.0, -0.9], [2.0, 0.3]].forEach(([dx, dy], i) => Object.assign(live[i], { x: a.x + dx, y: a.y + dy })); out.packed = tally();
      out.k = a.k; out.atk = D.ST.atk; return out; });
    console.log('ai', JSON.stringify(report.ai));
  }
  if (want('ult')) {
    await resetMons(); await page.evaluate(() => { const { D } = window.__BL; D.AN.S.list.forEach(a => { if (a.st === 'fight') a.life = 0.01; }); });
    await beat('9-awaken', 1.4); const d0 = await dmg0();
    for (const [n, s] of [['10-u1-silence', 1.4], ['11-u2-pillars', 1.6], ['12-u2-pillars-up', 0.9], ['13-u3-heaven', 1.5], ['14-u4-compress', 1.4], ['15-u4-silence', 0.55], ['16-u5-slam', 0.25], ['17-u5-pulse2', 0.65], ['18-u5-column', 0.6], ['19-u6-fall', 1.0], ['20-u6-dissolve', 0.9], ['21-after', 1.2]]) await beat(n, s);
    report.ult = (await dmg0()) - d0;
  }
  const after = await page.evaluate(() => { const { D } = window.__BL, AN = D.AN, r = { list: AN.S.list.length, ward: AN.bl.wardOn, held: AN.bl.held.size, zoomP: D.g.zoomP, cineT: D.g.cineT, fx: AN.bl.fx.length, gpuBefore: window.BELIAL_GL.gpuCount(), hold: AN.S.list.some(a => a.hold || a.judg) };
    for (let i = 0; i < 180; i++) window.__BL.step(1 / 60); r.gpuAfterIdle = window.BELIAL_GL.gpuCount(); r.idle = { list: AN.S.list.length, ward: AN.bl.wardOn, held: AN.bl.held.size, hold: AN.S.list.some(a => a.hold || a.judg), zoomP: +D.g.zoomP.toFixed(3), cineT: D.g.cineT, fx: AN.bl.fx.length }; AN.stop(); r.gpuAfterStop = window.BELIAL_GL.gpuCount(); r.zoomAfterStop = D.g.zoomP; return r; });
  console.log('cleanup', JSON.stringify(after)); console.log('report', JSON.stringify(report));
  require('fs').writeFileSync(path.resolve(__dirname, '..', `${OUTD}/${tag}-list.json`), JSON.stringify(out));
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
