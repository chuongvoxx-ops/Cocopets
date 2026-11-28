// (v475 GA) Gabriel in the fight on the GPU path (FGFX + GABRIEL_GL forced on SwiftShader): shots of the entrance, each power at a form,
// the ultimate's phases. usage: HTML=test-ga.html node tests/_ga-shots.js "<spec>;<spec>..."  with spec = name:kind:k:t (kind enter | bloom |
// harv | sanct | thr | ult; t seconds into it). OUT=shots/v475-GA DPR=1 LOW=1
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const OUTD = process.env.OUT || 'shots/v475-GA', DPR = +(process.env.DPR || 1), SPECS = (process.argv[2] || 'enter:enter:3:2.2;harv:harv:3:1.2').split(';').map(s => { const [n, kind, k, t] = s.split(':'); return { n, kind, k: +k, t: +t }; });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: [...(process.env.NOWEBGL ? ['--disable-3d-apis', '--disable-webgl'] : []), '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Gabriel|GFX|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(o => { window.__ONLY = o; window.__NOTRAPS = !!o && o.includes && o.includes('notraps'); window.__NOTELL = !!o && o.includes && o.includes('notell'); window.__NOFG = o === "nofg"; window.__NG_GL = 0; window.__GB_GL = 0; let sd = 424242; window.__seed = v => { sd = v; }; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; }, process.env.ONLY || null);
  await page.goto('file://' + path.resolve(process.env.HTML || 'test-ga.html')); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  await page.evaluate(low => { window.__seed(424242); const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'virgo'; P.st.animas.res = null; if (low) P.st.lowFx = true; P.dun.startDungeon(3, 5); }, !!process.env.LOW);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; for (let k = 0; k < 60; k++) G.update(1 / 60);
    AN.kit.main.k = 3; D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 8000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 60, sy = me.y + (Math.random() - 0.5) * 60; let ok = true; for (let dx = -5; dx <= 5 && ok; dx++) for (let dy = -4; dy <= 4 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 1; me.y = best.y + 1.2; }
    const LS = [[1.6, -1.2], [2.6, -0.4], [2.0, 0.6], [3.0, 1.2], [-2.2, -1.0], [-2.8, 0.3]], mons = D.mons.filter(m => !m.boss).slice(0, 6); D.mons.filter(m => !mons.includes(m)).forEach(m => Object.assign(m, { dead: true, x: me.x + 300, y: me.y + 300 }));
    const place = () => mons.forEach((m, i) => Object.assign(m, { dead: false, x: me.x + LS[i][0], y: me.y + LS[i][1], hx: me.x + LS[i][0], hy: me.y + LS[i][1], hp: 1e7, maxhp: 1e7, spd: 0, atkCd: 99, dmg: 0 }));
    place(); const B = window.__GA = { G, D, P, AN, me, mons, place };
    B.step = (sec, h) => { h = h || 1 / 30; const n = Math.round(sec / h); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (const m of D.mons) m.atkCd = 99; me.hp = D.ST.hp; D.g.normalT = 99; D.g.cdS = D.g.cdS2 = D.g.cdS3 = D.g.cdU = 99; G.update(h); for (const m of mons) if (m.hx != null) { m.x = m.hx; m.y = m.hy; } if (window.__NOTELL) for (let i = D.zones.length - 1; i >= 0; i--) if (D.zones[i].kind === "warn" && D.zones[i].own === "enemy") D.zones.splice(i, 1); } };
    B.fresh = () => { AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [], cine: null }); D.g.hitStop = 0; place(); AN.summon(); }; });
  fs.mkdirSync(path.resolve(OUTD), { recursive: true });
  const GLm = await page.evaluate(() => { const G = window.GABRIEL_GL; if (!G) return 'none'; window.__GB_GL = 1; try { G.warm(); for (let i = 0; i < 600 && !G.ready(); i++) G.step && G.step(60); } catch (e) { return 'err ' + e.message; } return G.ready() ? 'ready' : 'not ready'; });
  console.log('model', GLm);
  for (const S of SPECS) {
    const info = await page.evaluate(S => { const { AN, step, fresh, me, D } = window.__GA; window.__NG_GL = 0; window.__GB_GL = 0; fresh(); const M = AN.gb;
      if (S.kind === 'none') { AN.stop(); AN.S.list.length = 0; step(S.t); } else if (S.kind === 'enter') step(0.62 + S.t); else { step(6.5); const a = AN.S.list[0]; a.k = S.k; a.x = me.x - 1.4; a.y = me.y - 0.5;
        if (S.kind === 'ult') { for (const m of window.__GA.mons) M.addMark(m, 2); a.life = 0.05; step(0.1 + S.t); } else { if (S.kind === 'bloom') me.chill = 3; M.cast(a, S.kind); step(S.t); } }
      const a = AN.S.list[0], tr = (D.traps || []).filter(q => Math.hypot((q.x || 0) - me.x, (q.y || 0) - me.y) < 9).map(q => q.kind || q.type || '?').join(','); if (window.__NOTRAPS && D.traps) D.traps.length = 0; return a ? { traps: tr, st: a.st, act: a.gb && a.gb.act ? a.gb.act.kind : null, en: a.gb ? +a.gb.en.toFixed(2) : null, ult: M.ul && M.ul.ul ? +M.ul.ul.t.toFixed(2) : null } : 'gone'; }, S);
    const r = await page.evaluate(GBv => { const process_GB = GBv; const { G, P } = window.__GA; window.__NG_GL = window.__NOFG ? 0 : 1; window.__GB_GL = process_GB; const t0 = performance.now(); try { const cx = P.arc.ctx || document.getElementById('arcCanvas').getContext('2d'); if (window.__ONLY && window.__GA.AN.gb[window.__ONLY]) { G.draw(cx); cx.save(); cx.setTransform(1,0,0,1,0,0); cx.fillStyle = '#000'; cx.fillRect(0, 0, 4000, 4000); cx.restore(); const D = window.__GA.D; cx.save(); cx.setTransform(P.arc.dpr || 1, 0, 0, P.arc.dpr || 1, 0, 0); window.__GA.AN.gb[window.__ONLY](cx); cx.restore(); } else G.draw(cx); } catch (e) { return { e: e.message }; } const ms = performance.now() - t0; window.__NG_GL = 0; window.__GB_GL = 0; return { ms: Math.round(ms) }; }, process.env.NOGB ? 0 : 1);
    const f = `${OUTD}/ga-${S.n}${process.env.LOW ? '-low' : ''}${DPR > 1 ? '-dpr' + DPR : ''}.png`; await page.screenshot({ path: path.resolve(f), timeout: 300000 }); console.log('shot', f, JSON.stringify(info), JSON.stringify(r));
  }
  console.log('errors', JSON.stringify(errors.slice(0, 6))); await browser.close(); })();
