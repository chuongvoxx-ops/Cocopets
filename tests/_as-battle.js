// (v436 AS) Asmodeus in a fight: summons the Scorpio Anima, checks the 30 s rule (the entrance not counted), casts each power, lets the mind
// choose, checks Venom Debt (stacking, marks, detonation, decay, clean-up), runs The Seventh Sin (once, the Anima staying till it ends),
// checks the clean-up and a second summon, and photographs set moments on the GPU path (GLM + FGFX forced on the software rasteriser).
// usage: HTML=<test html> node tests/_as-battle.js [form 1|2|3] [shots 1|0] [dpr] [steps: summon,perd,lab,molt,rupt,debt,ai,auto,ult,again]
//   OUT=shots/v436-AS (where the photos go), TAG=name (their prefix), CEL=1 (photograph without WebGL: the existing art)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const K = +(process.argv[2] || 3), SHOTS = process.argv[3] !== '0', DPR = +(process.argv[4] || 1), ONLY = process.argv[5] ? process.argv[5].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Asmodeus|GFX|GLM|shader|FGFX/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 900)); });
  await page.addInitScript(v => { window.__NG_GL = 0; window.__AS_GL = 0; window.__AS_GLHQ = 1; window.__ASOFF = v === 'asoff'; window.__NGOFF = v === 'ngoff'; window.__VAR = v; }, process.env.VAR || '');   // (VAR=asoff | ngoff: photograph with the model or the painter off)
  await page.goto('file://' + path.resolve(process.cwd(), process.env.HTML || 'test-as.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K, LOW }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'scorpio'; P.st.animas.res = null; if (LOW) P.st.lowFx = true; P.openMap(); }, { K, LOW: !!process.env.LOW });   // (LOW=1: the low profile)
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const setup = await page.evaluate(({ K }) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    if (!AN.kit) return 'no kit'; AN.kit.main.id = 'scorpio'; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; if (!AN.as) return 'no AS';
    D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -7; dx <= 8 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 2.5; me.y = best.y + 1.5; }
    const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]];
    D.mons.filter(m => !m.boss).forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e7, maxhp: 1e7, still: false, spd: 0, atkCd: 99, dmg: 0, aggro: true }); else Object.assign(m, { dead: true, x: me.x + 200, y: me.y + 200 }); });
    me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
    { const v = window.__VAR; if (v && AN.as[v]) AN.as[v] = () => {}; }   // (VAR=drawBodyFx | drawFx | drawGround | drawCine: that hook left out, for a bisection)
    window.__ASB = { G, D, P, step(sec) { const n = Math.round(sec * 60); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (const m of D.mons) { m.atkCd = 99; } G.update(1 / 60); } } };
    const F = window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX;
    return { summon: AN.summon(), hp: D.ST.hp, place: !!best };
  }, { K });
  console.log('setup', JSON.stringify(setup)); if (!setup || !setup.summon) { console.log(errors); await browser.close(); return; }
  const out = [], tag = process.env.TAG || `as-k${K}-d${DPR}`, OUTD = process.env.OUT || 'shots/v436-AS';
  const state = () => page.evaluate(() => { const { D } = window.__ASB, AN = D.AN, a = AN.S.list[0], AS = AN.as, ms = D.mons.filter(m => !m.boss && !m.dead).slice(0, 8);
    return { list: AN.S.list.map(b => b.id + ':' + b.st).join(','), life: a && +a.life.toFixed(2), ready: a && a.as && a.as.ready, act: a && a.as && a.as.act && a.as.act.kind, hid: a && a.as && !!a.as.hidden,
      ul: AS.ul && +AS.ul.t.toFixed(2), dmg: Math.round(ms.reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0)), debt: ms.map(m => m.asDebt || 0).join(''), slowed: ms.filter(m => m.sandT > 0).length, venom: ms.filter(m => m.venom > 0).length, zoomP: +(D.g.zoomP || 1).toFixed(2), cineT: +(D.g.cineT || 0).toFixed(2), fx: AS.fx.length, gpu: window.ASMODEUS_GL.gpuCount() }; });
  const draw = async (name) => { if (!SHOTS) return null; const r = await page.evaluate((cel) => { const { G, P } = window.__ASB; window.__NG_GL = cel ? 0 : 1; window.__AS_GL = cel || window.__ASOFF ? 0 : 1; if (window.__NGOFF) window.__NG_GL = 0; const t0 = performance.now(); G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__NG_GL = 0; window.__AS_GL = 0; const S = window.ASMODEUS_GL.STATS, F = window.NIDHOGG_MOVES.FGFX.info(); return { ms: Math.round(performance.now() - t0), W: S.W, H: S.H, items: S.items, fg: F.ok, why: F.why }; }, !!process.env.CEL);
    const f = `${OUTD}/${tag}-${name}.png`; await page.screenshot({ path: path.resolve(process.cwd(), f), timeout: 300000 }); out.push(f); return r; };
  const beat = async (name, sec) => { await page.evaluate(s => window.__ASB.step(s), sec); const d = await draw(name); const s = await state(); console.log(name, JSON.stringify(s), d ? JSON.stringify(d) : ''); return s; };
  const want = n => !ONLY || ONLY.includes(n);
  const cast = (k, o) => page.evaluate(({ k, o }) => { const { D } = window.__ASB, a = D.AN.S.list[0]; a.life = Math.max(a.life, 20); return D.AN.as.cast(a, k, o); }, { k, o });
  const dmg0 = () => page.evaluate(() => { const { D } = window.__ASB; return Math.round(D.mons.filter(m => !m.boss && !m.dead).reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0)); });
  const report = {};
  if (want('summon')) { await beat('01-sigil', 0.7); await beat('02-cocoon', 0.8); await beat('03-unfold', 0.9); await beat('04-shatter', 0.5); await beat('05-rise', 0.5); await beat('06-crown', 0.6);
    report.timer = await page.evaluate(() => { const { D } = window.__ASB, a = D.AN.S.list[0]; window.__ASB.step(0.6); const r0 = { life: +a.life.toFixed(2), ready: a.as.ready }; window.__ASB.step(2); return { atReady: r0, after2s: +a.life.toFixed(2) }; }); console.log('timer', JSON.stringify(report.timer)); }
  else await page.evaluate(() => window.__ASB.step(5.5));
  const resetMons = () => page.evaluate(() => { const { D } = window.__ASB, me = D.me; const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]]; D.mons.filter(m => !m.boss && !m.dead).forEach((m, i) => { if (i < place.length) Object.assign(m, { x: me.x + place[i][0], y: me.y + place[i][1], kbx: 0, kby: 0 }); }); const a = D.AN.S.list[0]; a.x = me.x - 1.2; a.y = me.y - 0.4; a.dropZ = 0; });
  const clearDebt = () => page.evaluate(() => { const { D } = window.__ASB; for (const m of D.mons) { m.asDebt = 0; } D.AN.as.debt.clear(); });
  if (want('perd')) { await resetMons(); const d0 = await dmg0(); await cast('perd'); await beat('07-perd-rise', 0.55); await beat('07-perd-strike', 0.3); await beat('07-perd-strikes', 0.6); const s = await beat('07-perd-end', 1.4); report.perd = { dmg: s.dmg - d0, debt: s.debt }; }
  if (want('lab')) { await resetMons(); const d0 = await dmg0(); await cast('lab'); await beat('08-lab-cast', 0.7); await beat('08-lab-web', 0.9); await beat('08-lab-hold', 1.5); const s = await beat('08-lab-late', 2.0); report.lab = { dmg: s.dmg - d0, slowed: s.slowed, debt: s.debt }; }
  if (want('molt')) { await resetMons(); const d0 = await dmg0(); await cast('molt'); await beat('09-molt-fold', 0.6); await beat('09-molt-vanish', 0.3); await beat('09-molt-strike', 0.42); await beat('09-molt-blow', 0.8); const s = await beat('09-molt-end', 0.6); report.molt = { dmg: s.dmg - d0, debt: s.debt, hid: s.hid }; }
  if (want('rupt')) { await resetMons(); await page.evaluate(() => { const { D } = window.__ASB; D.mons.filter(m => !m.boss && !m.dead).slice(0, 3).forEach(m => D.AN.as.addDebt(m, 7)); }); const d0 = await dmg0(); const s0 = await state(); await cast('rupt'); await beat('10-rupt-conv', 0.6); await beat('10-rupt-crystal', 0.8); await beat('10-rupt-shatter', 0.3); await beat('10-rupt-waves', 0.6); const s = await beat('10-rupt-end', 1.6); report.rupt = { dmg: s.dmg - d0, debtBefore: s0.debt, debtAfter: s.debt }; }
  if (want('debt')) { report.debt = await page.evaluate(() => { const { D } = window.__ASB, AS = D.AN.as, ms = D.mons.filter(m => !m.boss && !m.dead), m = ms[0], out = {}; for (const q of ms) { q.asDebt = 0; } AS.debt.clear();
      for (let i = 0; i < 10; i++) AS.addDebt(m, 1); out.capped = m.asDebt; out.inSet = AS.debt.has(m); const h0 = m.hp; window.__ASB.step(1.05); out.ticked = Math.round(h0 - m.hp) > 0;
      window.__ASB.step(10); out.afterDecay = m.asDebt || 0; AS.addDebt(ms[1], 3); ms[1].dead = true; window.__ASB.step(0.1); out.deadRemoved = !AS.debt.has(ms[1]); ms[1].dead = false; AS.addDebt(ms[2], 4); D.AN.stop(); out.afterStop = { size: AS.debt.size, field: ms[2].asDebt || 0 }; return out; }); console.log('debt', JSON.stringify(report.debt)); }
  if (want('levels')) {   // the evolutions: each power cast at each form, its parts counted (strikes, shells, waves, the web's time, the defence cut)
    report.levels = await page.evaluate(() => { const { D } = window.__ASB, AS = D.AN.as, a = D.AN.S.list[0], me = D.me, out = {}; if (!a) return 'no anima'; const k0 = a.k;
      for (const k of [1, 2, 3]) { a.k = k; const r = {}; const seen = new Set(), count = (kind, sec) => { let n = 0; const A0 = a.as.act; for (let i = 0; i < sec * 60; i++) { if (a.as.act !== A0) break; window.__ASB.step(1 / 60); for (const f of AS.fx) if (f.kind === kind && !seen.has(f)) { seen.add(f); n++; } } return n; };
        const place = () => D.mons.filter(m => !m.boss && !m.dead).forEach((m, i) => Object.assign(m, { x: me.x + 2.5 + (i % 4) * 0.6, y: me.y + Math.floor(i / 4) * 0.8 - 0.4, kbx: 0, kby: 0 }));
        place(); a.x = me.x; a.y = me.y; a.life = 20; AS.cast(a, 'perd'); r.perdStrikes = count('strk', 3.2); r.perd7 = AS.fx.some(f => f.kind === 'imp7');
        place(); a.life = 20; AS.cast(a, 'molt'); r.moltShells = count('shell', 2.6);
        place(); a.life = 20; AS.cast(a, 'rupt'); r.ruptWaves = count('wave', 3.4); r.erupt = AS.fx.some(f => f.kind === 'pillar');
        place(); a.life = 20; AS.cast(a, 'lab'); window.__ASB.step(1.3); const L = AS.fx.find(f => f.kind === 'lab'); r.labLife = L ? L.life : 0; r.labR = L ? L.R0 : 0; window.__ASB.step(1.0); const m = D.mons.find(q => !q.boss && !q.dead && Math.hypot(q.x - L.x, q.y - L.y) < L.R); r.defK = m ? +AS.outK(m).toFixed(2) : null; window.__ASB.step(L.life);
        out['k' + k] = r; } a.k = k0; return out; });
    console.log('levels', JSON.stringify(report.levels)); }
  if (want('ai')) {
    report.ai = await page.evaluate(() => { const { D } = window.__ASB, me = D.me, a = D.AN.S.list[0], AS = D.AN.as, live = D.mons.filter(m => !m.boss && !m.dead), out = {};
      if (!a) return 'no anima'; const park = () => live.forEach((m, i) => Object.assign(m, { x: me.x - 30 - i, y: me.y - 30, asDebt: 0, atkCd: 99 })); AS.debt.clear();
      const tally = () => { const c = {}; for (let i = 0; i < 40; i++) { const q = AS.choose(a); const k = q ? q.kind : 'none'; c[k] = (c[k] || 0) + 1; } return c; };
      a.x = me.x + 1; a.y = me.y; a.as.act = null; a.life = 20;
      park(); Object.assign(live[0], { x: a.x + 5, y: a.y }); out.single = tally();
      park(); [[4.5, 0], [5, 0.6], [4.6, -0.6], [5.4, 0.2], [4.9, 1.0]].forEach(([dx, dy], i) => Object.assign(live[i], { x: a.x + dx, y: a.y + dy })); out.crowd = tally();
      live.slice(0, 5).forEach(m => AS.addDebt(m, 4)); out.debtCrowd = tally(); AS.addDebt(live[0], 3); out.sealed = tally();
      park(); Object.assign(live[0], { x: a.x + 1.2, y: a.y, atkCd: 0.2 }); out.closeThreat = tally(); for (const m of live) m.asDebt = 0; AS.debt.clear(); return out; });
    console.log('ai', JSON.stringify(report.ai)); }
  if (want('auto')) { await resetMons(); report.auto = await page.evaluate(() => { const { D } = window.__ASB, a = D.AN.S.list[0], seen = []; if (!a) return 'no anima'; let idle = 0; a.life = 25; for (let i = 0; i < 60 * 14; i++) { window.__ASB.step(1 / 60); const k = a.as.act && a.as.act.kind; if (k && seen[seen.length - 1] !== k) seen.push(k); if (!k) idle++; } return { seen, idleS: +(idle / 60).toFixed(2), debt: D.mons.filter(m => !m.boss && !m.dead).map(m => m.asDebt || 0).join('') }; }); console.log('auto', JSON.stringify(report.auto)); }
  if (want('ult')) {
    await resetMons(); await page.evaluate(() => { const { D } = window.__ASB; D.mons.filter(m => !m.boss && !m.dead).slice(0, 6).forEach((m, i) => D.AN.as.addDebt(m, 2 + i)); D.AN.S.list.forEach(b => { if (b.st === 'fight') b.life = 0.01; }); });
    await beat('11-awaken', 1.2); const d0 = await dmg0();
    for (const [n, s] of [['12-u1-seals', 1.4], ['13-u1-crown', 0.8], ['14-u2-cathedral', 1.4], ['15-u2-rings', 0.8], ['16-u3-bloom', 1.2], ['17-u3-flower', 0.8], ['18-u4-sting1', 0.55], ['19-u4-sting4', 1.05], ['20-u4-seventh', 1.1], ['21-u5-collapse', 0.5], ['22-u5-detonation', 0.25], ['23-u5-testament', 0.5], ['24-u6-whisper', 0.9], ['25-u6-dissolve', 1.2], ['26-after', 1.0]]) await beat(n, s);
    report.ult = (await dmg0()) - d0;
    report.once = await page.evaluate(() => { const { D } = window.__ASB; return { list: D.AN.S.list.length, ul: !!D.AN.as.ul, debtLeft: D.AN.as.debt.size }; });
  }
  const after = await page.evaluate(() => { const { D } = window.__ASB, AN = D.AN, r = { list: AN.S.list.length, zoomP: D.g.zoomP, cineT: D.g.cineT, fx: AN.as.fx.length, gpuBefore: window.ASMODEUS_GL.gpuCount(), hold: AN.S.list.some(a => a.hold || a.judg) };
    for (let i = 0; i < 240; i++) window.__ASB.step(1 / 60); r.gpuAfterIdle = window.ASMODEUS_GL.gpuCount(); r.idle = { list: AN.S.list.length, fx: AN.as.fx.length, debt: AN.as.debt.size, zoomP: +D.g.zoomP.toFixed(3) }; AN.stop(); r.gpuAfterStop = window.ASMODEUS_GL.gpuCount(); return r; });
  console.log('cleanup', JSON.stringify(after)); console.log('report', JSON.stringify(report));
  if (want('again')) {
    const r2 = await page.evaluate(() => { const { D } = window.__ASB, AN = D.AN; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); const ok = AN.summon(); window.__ASB.step(6); const a = AN.S.list[0]; const dr = () => { const { G, P } = window.__ASB; window.__NG_GL = 1; window.__AS_GL = 1; G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__NG_GL = 0; window.__AS_GL = 0; return window.ASMODEUS_GL.gpuCount(); }; const s1 = { ok, st: a && a.st, ready: a && a.as.ready, life: a && +a.life.toFixed(1), gpuDrawn: dr() }; if (a) a.life = 0.01; window.__ASB.step(17); s1.after = AN.S.list.length; window.__ASB.step(4); s1.gpu = window.ASMODEUS_GL.gpuCount(); s1.debt = AN.as.debt.size; return s1; });
    console.log('again', JSON.stringify(r2)); }
  require('fs').writeFileSync(path.resolve(process.cwd(), `${OUTD}/${tag}-list.json`), JSON.stringify(out));
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
