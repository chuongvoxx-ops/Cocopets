// Bahamut's attacks one by one, each frozen mid-play and photographed on a phone screen. usage: node tests/_inf-scenes.js [from] [to]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const from = +(process.argv[2] || 0), to = +(process.argv[3] || 99);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(120, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(q => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = q; }, process.env.FQ == null ? 2 : +process.env.FQ);
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  // from here the real-time loop only draws; the test steps the world itself
  await page.evaluate(() => { window.__pp.arc.paused = true; const G = window.__pp.arc.game; for (let i = 0; i < 60 * 6; i++) G.update(1 / 60); });
  const CLEAR = `if (M.job && M.job.stop) M.job.stop(FX, M.job); M.job = null; FD.S.hz.forEach(z => { if (z.bw) z.life = 0; }); M.gap = 0; M.sealCd = 99; M.sancCd = 99; M.recCd = 99; M.expose = 0;`;
  const PET = (dx, dy) => `me.x = C.x + ${dx}; me.y = C.y + ${dy};`;
  const STAGE = hp => `m.hp = m.maxhp * ${hp};`;
  const scenes = [
    ['I-lash', CLEAR + 'M.cyc = 0; M.lastLash = 0;' + PET(2, 7), 1.6],
    ['I-lash2', CLEAR + 'M.cyc = 0;' + PET(-2, 7), 1.5],
    ['I-wheel', CLEAR + 'M.cyc = 1;' + PET(3, 7), 1.7],
    ['I-breath', CLEAR + 'M.cyc = 2;' + PET(0, 7), 2.1],
    ['I-seal', CLEAR + 'M.sealCd = 0;' + PET(4, 6), 4.0],
    ['II-scythe', STAGE(0.74) + PET(0, 7), 5.5, CLEAR + 'M.cyc = 0;' + PET(1, 9), 2.4],
    ['II-firmament', CLEAR + 'M.cyc = 1;' + PET(-2, 7), 1.6],
    ['II-halo', CLEAR + 'M.cyc = 2;' + PET(2, 8), 2.0],
    ['II-sanct', CLEAR + 'M.sancCd = 0;' + PET(3, 7), 5.0],
    ['III-pain', STAGE(0.49) + PET(0, 7), 5.5, CLEAR + 'M.cyc = 0;' + PET(2, 7), 2.6],
    ['III-yesterday', CLEAR + 'M.cyc = 1;' + PET(-3, 7), 4.5],
    ['III-borrowed', CLEAR + 'M.cyc = 2;' + PET(0, 8), 3.3],
    ['III-record', CLEAR + 'M.recCd = 0;' + PET(2, 7), 10.4],
    ['IV-ruin', STAGE(0.24) + PET(0, 7), 6, CLEAR + 'M.cyc = 2;' + PET(1, 8), 2.8],
    ['IV-horizon', CLEAR + 'M.cyc = 1;' + PET(-2, 7), 1.9],
    ['IV-procession', CLEAR + 'M.cyc = 0;' + PET(2, 8), 6.0],
    ['IV-idle', CLEAR + 'M.gap = 99;' + PET(0, 7), 3.0],
    ['FJ-cast', CLEAR + STAGE(0.055) + PET(0, 8), 3.2],
    ['FJ-corridor', `for (let p = 0; p < 4; p++) { for (let i = 0; i < 400 && !(M.obl && M.obl.objs.length && M.obl.objs.every(o => !o.dead) && M.obl.wait <= 0 && M.obl.pair === p); i++) G.update(1 / 60); M.obl.objs.forEach(o => { if (!o.dead) D.hitMon(o, o.hp + 10, {}); }); }` + PET(0, 7), 3.6],
    ['END-1', `const w = FD.S.weak.jewel; if (w && !w.dead) D.hitMon(w, 50, {});`, 1.4],
    ['END-2', ``, 2.8],
    ['END-3', ``, 2.4],
  ];
  for (let i = 0; i < scenes.length; i++) {
    const [name, a, sa, b, sb] = scenes[i];
    const steps = [[a, sa]].concat(b != null ? [[b, sb]] : []);
    for (const [code, secs] of steps) {
      const r = await page.evaluate(([code, secs]) => { try { const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, FX = FD.FX, M = FX.mem, C = FX.C, me = D.me, m = D.g.boss; new Function('G', 'D', 'FD', 'FX', 'M', 'C', 'me', 'm', code)(G, D, FD, FX, M, C, me, m); for (let k = 0; k < secs * 60; k++) { G.update(1 / 60); me.hp = D.ST.hp; } return { job: M.job && M.job.name, lv: FD.S.lv, hz: FD.S.hz.length }; } catch (e) { return { err: e.message + ' ' + (e.stack || '').split('\n')[1] }; } }, [code, secs]);
      if (r.err) console.log(name, 'ERR', r.err);
      if (i < from || i > to) continue;
      if (code === steps[steps.length - 1][0]) { await page.waitForTimeout(350); await page.screenshot({ path: path.resolve(__dirname, `../shots/inf-${String(i).padStart(2, '0')}-${name}.png`) }); console.log(name, JSON.stringify(r)); }
    }
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
