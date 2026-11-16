// Final Eclipse (Dark ult, worker U1 v391): the GPU version (20k5g-dark-ult-6.js + the GLM demon 20k5g-dark-eclipse-demon.js)
// and the original 2D version (20k5g-dark-ult-6-2d.js, the fallback) cast in the Tower, the game loop stopped and stepped by
// hand in game time. Checks: each path runs (the GPU one draws its demon on GLM and its effects on its own painter), both
// hit at the same times with the same damage and radius (the impact, then the demon's burst), every effect is cleaned up,
// 0 page errors. SHEET=1 also photographs the key beats of both (before = the original 2D, after = the GPU) at phone size,
// into shots/fe/*.png, for tests/_ult-finaleclipse-sheet.py.
// usage: HTML=test-u1.html node tests/_ult-finaleclipse.js     env: EVO (1..7, default 1), SHEET=1, LOWFX=1
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && /Eclipse|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.addInitScript(() => { window.__FE_GL = 1; window.__FE_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 240000 }); await page.waitForTimeout(300);
  await page.evaluate(low => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.st.lowFx = !!low; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); }, !!process.env.LOWFX);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; const G = P.arc.game, D = G._dbg; window.__H = { P, G, D }; D.g.intro = 0; D.SKIP.fog = true; for (let k = 0; k < 120; k++) G.update(1 / 60); });
  const EVO = +(process.env.EVO || 1), SHEET = !!process.env.SHEET, out = path.resolve(__dirname, '../shots/fe'); if (SHEET && !fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const BEATS = [['form', 0.45], ['drop', 0.86], ['downbeat', 1.12], ['hover', 1.55], ['charge', 2.35], ['brace', null], ['hurl', null], ['impact', null], ['shock', null], ['dissolve', null], ['ash', null]];
  async function cast(gpu) {
    return page.evaluate(async ([gpu, evo, beats, sheet]) => {
      const { P, G, D } = window.__H, g = D.g, me = D.me; window.__FE_GL = gpu ? 1 : 0;
      // a cluster of sturdy monsters ahead of the pet
      let i = 0; for (const m of D.mons) { if (m.boss || m.dead) continue; m.hp = 1e7; m.maxhp = 1e7; m.still = true; if (i < 6) { const a = i * 1.05; let p = null; for (let k = 0; k < 20 && !p; k++) { const x = me.x + Math.cos(a) * (1 + (i % 2) * 0.8) + k * 0.05, y = me.y - 4 + Math.sin(a) * 0.9; if (D.walkAt(Math.floor(x), Math.floor(y))) p = { x, y }; } if (p) { m.x = p.x; m.y = p.y; } } i++; }
      me.hp = D.ST.hp; me.mp = 999; D.g.cdU = 0; me.dead = false;
      const L = P.ELEM_LIST.dark, ab = Object.assign(P.elemAbility(L.ey_finaleclipse, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo }); D.setKit('ult', ab);
      const E = D.ELEM, H = E.H, log = [], hit0 = H.hitArea; let t0 = null, Fr = null;
      H.hitArea = (x, y, r, dmg, o) => { log.push({ t: +(g.t - t0).toFixed(3), ft: Fr ? +Fr.t.toFixed(3) : null, r: +r.toFixed(3), dmg: +dmg.toFixed(2), kb: o && o.kb, stun: o && o.stun }); return hit0(x, y, r, dmg, o); };
      const n0 = E.fx.length; t0 = g.t; D.useUlt(); const fx = E.fx.slice(n0), F = fx[0], isGPU = !!(F && F.gpu); Fr = F;
      const dbg = P.ELEM_IMPL.dark.ult.finaleclipse.__dbg, CEL = evo >= 7, TB = CEL ? 2.85 : 2.6, IMP = TB + 0.72, EXP = IMP + (CEL ? 1.05 : 0.95), LIFE = EXP + (CEL ? 1.9 : 1.5);
      const times = { brace: TB + 0.28, hurl: TB + 0.42 + 0.17, impact: IMP + 0.04, shock: IMP + 0.3, dissolve: EXP + 0.25, ash: EXP + 0.9 };
      const want = beats.map(([n, t]) => [n, t == null ? times[n] : t]), shots = []; let w = 0, drawn = 0, demonGL = 0;
      const ctx = P.arc.ctx || document.getElementById('arcCanvas').getContext('2d');
      while (g.t - t0 < LIFE + 1.2) { me.hp = D.ST.hp; me.inv = 0.2; G.update(1 / 60); const tt = F && F.life > 0 ? F.t : g.t - t0;   /* (the beats in the effect's own time) */
        const shot = sheet && w < want.length && tt >= want[w][1];
        if (shot || drawn === 0 || (!sheet && Math.round(tt * 60) % 45 === 0)) { G.draw(ctx); drawn++; const last = dbg.DEMON.last; if (last && last.gl) demonGL++; }
        if (shot) { shots.push([want[w][0], +tt.toFixed(2)]); w++; await new Promise(r => setTimeout(r, 0)); window.__shotReady = want[w - 1][0]; await new Promise(r => { window.__shotGo = r; }); } }
      H.hitArea = hit0; for (let k = 0; k < 60; k++) G.update(1 / 60);
      return { isGPU, log, drawn, demonGL, left: E.fx.length, zones: D.zones.filter(z => z.own === 'pet').length, gfx: dbg.GFX.stats, glStats: dbg.DEMON.__dbg.glStats, shots, info: dbg.GFX.info() };
    }, [gpu, EVO, BEATS, SHEET]);
  }
  // (the photographer: while a cast waits at a beat, take the shot and let it go on)
  let stopShots = false;
  const photographer = async tag => { while (!stopShots) { const name = await page.evaluate(() => window.__shotReady || null).catch(() => null); if (name) { await page.evaluate(() => { window.__shotReady = null; }); await page.screenshot({ path: path.join(out, `${tag}-${name}.png`) }); await page.evaluate(() => window.__shotGo && window.__shotGo()); } else await new Promise(r => setTimeout(r, 40)); } };
  const res = {};
  for (const [tag, gpu] of [['gpu', true], ['2d', false]]) { stopShots = false; const ph = SHEET ? photographer(tag) : null; const t0 = Date.now(); res[tag] = await cast(gpu); stopShots = true; if (ph) await ph; console.log(tag, 'cast in', ((Date.now() - t0) / 1000).toFixed(0), 's', JSON.stringify({ hits: res[tag].log, drawn: res[tag].drawn, demonGL: res[tag].demonGL, gfx: res[tag].gfx, info: res[tag].info })); }
  const G = res.gpu, D2 = res['2d'];
  ok(G.isGPU && !D2.isGPU, 'the GPU version runs where the GPU is on, the original 2D version where it is off', { gpu: G.isGPU, d2: D2.isGPU });
  ok(G.demonGL > 0 && G.gfx.flush > 0, 'the GPU cast draws its demon on GLM and its effects through its painter', { demonGL: G.demonGL, flush: G.gfx.flush, dist: G.gfx.dist });
  ok(G.log.length === 2 && D2.log.length === 2, 'two hits each (the impact, the demon\'s burst)', { gpu: G.log.length, d2: D2.log.length });
  const same = G.log.length === D2.log.length && G.log.every((h, i) => Math.abs(h.t - D2.log[i].t) <= 1 / 30 + 1e-6 && Math.abs(h.dmg - D2.log[i].dmg) < 1e-6 && Math.abs(h.r - D2.log[i].r) < 1e-6 && h.kb === D2.log[i].kb && h.stun === D2.log[i].stun);
  ok(same, 'the same timing (within a frame), damage, radius, knockback and stun on both paths', { gpu: G.log, d2: D2.log });
  const CEL = EVO >= 7, IMP = (CEL ? 2.85 : 2.6) + 0.72, EXP = IMP + (CEL ? 1.05 : 0.95);
  ok(G.log.length === 2 && Math.abs(G.log[0].ft - IMP) < 0.04 && Math.abs(G.log[1].ft - EXP) < 0.04 && Math.abs(G.log[1].dmg / G.log[0].dmg - 0.4) < 1e-6 && Math.abs(G.log[1].r / G.log[0].r - 1.2) < 1e-6 && G.log[0].kb === 7 && G.log[0].stun === 0.5 && G.log[1].kb === 5, 'the contract: the impact at the original beat (kb 7, stun 0.5), the burst at 40 % and 1.2 R (kb 5) (the effect\'s own clock)', { IMP, EXP, ft: G.log.map(h => h.ft) });
  ok(G.left === 0 && D2.left === 0 && G.zones === 0 && D2.zones === 0, 'every effect and warning cleaned up', { gpu: [G.left, G.zones], d2: [D2.left, D2.zones] });
  ok(!errors.length, 'no page errors', errors.slice(0, 6));
  if (SHEET) fs.writeFileSync(path.join(out, 'shots.json'), JSON.stringify({ evo: EVO, gpu: G.shots, d2: D2.shots }));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})();
