// (v418 AB) Abaddon in a fight: summons the Cancer Anima, casts each power, the Ninth Tide, checks the combat effects, and
// photographs set moments on the GPU path (GLM + FGFX forced on the software rasteriser). The game loop is stopped and stepped
// by hand at 60 Hz (a software GPU frame takes seconds), each photo is one drawn frame.
// usage: HTML=test-ab.html node tests/_ab-battle.js [form 1|2|3] [shots 1|0] [dpr] [steps: summon,reavers,tide,eclipse,swipe,t9,auto]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const K = +(process.argv[2] || 3), SHOTS = process.argv[3] !== '0', DPR = +(process.argv[4] || 1), ONLY = process.argv[5] ? process.argv[5].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Abaddon|GFX|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(rs => { window.__NG_GL = 0; window.__AB_GL = 0; window.__AB_GLHQ = 1; window.__ABRES = rs || null; }, process.env.RES || '');
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ab.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'cancer'; P.st.animas.res = null; P.openMap(); }, { K });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const setup = await page.evaluate(({ K }) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    if (!AN.kit) return 'no kit'; AN.kit.main.id = 'cancer'; AN.kit.main.k = K; const RS = window.__ABRES; AN.kit.res = RS ? { id: RS, k: K } : null; AN.kit.resonance = RS ? P.pairResonance('cancer', RS) : null; if (!AN.ab) return 'no AB';
    D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 4000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 40, sy = me.y + (Math.random() - 0.5) * 40; let ok = true; for (let dx = -4; dx <= 6 && ok; dx++) for (let dy = -4; dy <= 4 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 1.5; me.y = best.y + 1.2; }
    const place = [[2.2, -0.4], [3.4, 0.6], [2.6, 1.6], [4.4, -0.8], [1.2, -1.6], [3.6, 2.4], [5.0, 1.0], [0.6, 2.2]];
    D.mons.filter(m => !m.boss).forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e7, maxhp: 1e7, still: true, spd: 0, atkCd: 99, dmg: 0, aggro: true }); else Object.assign(m, { dead: true, x: me.x + 200, y: me.y + 200 }); });
    me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
    window.__AB = { G, D, P, t0: D.g.t, step(sec) { const n = Math.round(sec * 60); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (const m of D.mons) { m.atkCd = 99; } G.update(1 / 60); } } };
    return { summon: AN.summon(), hp: D.ST.hp, place: !!best };
  }, { K });
  console.log('setup', JSON.stringify(setup)); if (!setup || !setup.summon) { console.log(errors); await browser.close(); return; }
  const out = [], tag = `ab-k${K}-d${DPR}`;
  const state = () => page.evaluate(() => { const { D } = window.__AB, AN = D.AN, a = AN.S.list[0], AB = AN.ab, ms = D.mons.filter(m => !m.boss && !m.dead).slice(0, 8);
    return { list: AN.S.list.map(b => b.id + ':' + b.st).join(','), st: a && a.st, life: a && +a.life.toFixed(2), act: a && a.ab && a.ab.act && a.ab.act.kind, store: a && a.ab && Math.round(a.ab.store), sh: AB.shield && { pool: Math.round(AB.shield.pool), max: Math.round(AB.shield.max), src: AB.shield.src }, seal: !!AB.seal, t9: AB.t9 && +AB.t9.t.toFixed(2),
      dmg: Math.round(ms.reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0)), lifted: ms.filter(m => m.liftZ > 0.2).length, weak: ms.filter(m => m.lunarT > D.g.t).length, zoom: +D.g.zoom.toFixed(2), cineT: +(D.g.cineT || 0).toFixed(2), fx: AB.fx.length, pet: Math.round(D.me.hp) }; });
  const draw = async (name) => { if (!SHOTS) return null; const r = await page.evaluate(() => { const { G, P } = window.__AB; window.__NG_GL = 1; window.__AB_GL = 1; const t0 = performance.now(); G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__NG_GL = 0; window.__AB_GL = 0; const S = window.ABADDON_GL.STATS; return { ms: Math.round(performance.now() - t0), W: S.W, H: S.H, items: S.items }; });
    const f = `shots/v418-AB/${tag}-${name}.png`; await page.screenshot({ path: path.resolve(__dirname, '..', f) }); out.push(f); return r; };
  const beat = async (name, sec) => { await page.evaluate(s => window.__AB.step(s), sec); const d = await draw(name); const s = await state(); console.log(name, JSON.stringify(s), d ? JSON.stringify(d) : ''); return s; };
  const want = n => !ONLY || ONLY.includes(n);
  const cast = (k) => page.evaluate(k => { const { D } = window.__AB, a = D.AN.S.list[0]; a.ab.first = true; a.life = Math.max(a.life, 9); return D.AN.ab.cast(a, k); }, k);
  if (want('summon')) { await beat('1-seal', 0.75); await beat('2-descend', 0.55); await beat('3-bloom', 0.7); }
  else await page.evaluate(() => window.__AB.step(2.4));
  await beat('4-carapace', 1.0);
  // a blow at the pet: the carapace's ward takes it
  const hitRes = await page.evaluate(() => { const { D } = window.__AB, me = D.me, m = D.mons.find(q => !q.dead && !q.boss); const h0 = me.hp; me.inv = 0; const r = D.X.hurtPet(D.ST.hp * 0.2, m); const AB = D.AN.ab; return { landed: r, lost: Math.round(h0 - me.hp), pool: AB.shield && Math.round(AB.shield.pool), store: Math.round(D.AN.S.list[0].ab.store) }; });
  console.log('shield-hit', JSON.stringify(hitRes));
  if (want('reavers')) { await cast('reavers'); await beat('5-reavers-a', 0.55); await beat('5-reavers-b', 0.35); await beat('5-reavers-c', 0.6); await beat('5-reavers-d', 0.6); }
  if (want('tide')) { await cast('tide'); await beat('6-tide-a', 0.4); await beat('6-tide-b', 0.9); await beat('6-tide-c', 1.0); await beat('6-tide-end', 1.3); }
  if (want('eclipse')) { await cast('eclipse'); await beat('7-eclipse-seal', 0.7);
    const ecl = await page.evaluate(() => { const { D } = window.__AB, me = D.me; const h0 = me.hp; for (let i = 0; i < 3; i++) { me.inv = 0; D.X.hurtPet(D.ST.hp * 0.15, D.mons.find(q => !q.dead)); } return { lost: Math.round(h0 - me.hp), store: Math.round(D.AN.S.list[0].ab.store) }; });
    console.log('eclipse-absorb', JSON.stringify(ecl)); await beat('7-eclipse-hold', 0.6); await beat('7-eclipse-open', 0.35); await beat('7-eclipse-wave', 0.3); }
  if (want('swipe')) { await cast('swipe'); await beat('8-swipe', 0.28); }
  if (want('auto')) { await page.evaluate(() => { const { D } = window.__AB, a = D.AN.S.list[0]; a.life = 12; a.ab.eclDone = false; for (const k in a.ab.cd) a.ab.cd[k] = 0; }); for (let i = 0; i < 6; i++) await beat('auto-' + i, 1.5); }
  if (want('t9')) {
    await page.evaluate(() => { const { D } = window.__AB; D.AN.S.list.forEach(a => { if (a.st === 'fight') a.life = 0.01; }); });
    await beat('9-awaken', 1.5);
    for (const [n, s] of [['10-t9-eclipse', 0.5], ['11-t9-moon', 0.9], ['12-t9-ocean', 1.0], ['13-t9-compress', 0.9], ['14-t9-tide', 0.25], ['15-t9-blast', 0.35], ['16-t9-recover', 0.9], ['17-after', 1.6]]) await beat(n, s);
  }
  const after = await page.evaluate(() => { const { D } = window.__AB, AN = D.AN; const lifted = D.mons.filter(m => m.liftZ > 0).length; AN.stop(); return { list: AN.S.list.length, lifted, liftedAfterStop: D.mons.filter(m => m.liftZ > 0).length, shield: !!AN.ab.shield, zoomP: D.g.zoomP, cineT: D.g.cineT }; });
  console.log('cleanup', JSON.stringify(after));
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/v418-AB/${tag}-list.json`), JSON.stringify(out));
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
