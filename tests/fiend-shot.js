// Starts a Super Fiend floor and photographs the fight. usage: node tests/fiend-shot.js [floor] [seconds] [bot]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floor = +(process.argv[2] || 10), secs = +(process.argv[3] || 12), bot = process.argv[4] !== 'idle';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([dlv, god, hpf]) => { window.__dlv = dlv; window.__god = god; window.__hpf = hpf; }, [+(process.env.DLV || 40), !!process.env.GOD, +(process.env.HPF || 0)]);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = !!window.__god; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = window.__dlv || 40; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(q => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = q; }, process.env.FQ == null ? 2 : +process.env.FQ);   // pinned: the software renderer here is slow
  const t0 = Date.now(); let shotN = 0, last = 0;
  while (Date.now() - t0 < secs * 1000) {
    const r = await page.evaluate(bot => {
      const P = window.__pp, A = P.arc, G = A.game; if (!G || A.state !== 'play') return { state: A.state };
      const D = G._dbg, me = D.me, g = D.g, m = g.boss, W = A.W, H = A.H;
      if (bot && m && !m.dead && m.act !== 'enter') {
        // the bot reads the fight a little: it goes for the objects that turn a mechanic (anchors, sluices, eggs, vents) and for open weak points
        const FDo = D.FD, objs = FDo ? FDo.S.objs.filter(o => !o.dead && o.kind !== 'part' && o.hp < 1e11 && !o.invuln) : [], wk = FDo ? Object.values(FDo.S.weak).find(w => w && !w.dead) : null;
        const obj = objs.sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0], tgt = obj || wk || m;
        const d = Math.hypot(tgt.x - me.x, tgt.y - me.y), a = Math.atan2(tgt.y - me.y, tgt.x - me.x), want = obj ? 2.5 : 6.5;
        // keep a fighting distance, strafing around it
        const dir = d > want + 1 ? a : d < want - 1 ? a + Math.PI : a + Math.PI / 2, hx = 72, hy = H - 100;
        if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + Math.cos(dir) * 44, hy + Math.sin(dir) * 44, 88);
        if (!g._bt || g.t - g._bt > 0.3) { g._bt = g.t; const T = 40 * g.zoom, tx = W / 2 + (tgt.x - me.x) * T, ty = H / 2 + (tgt.y - (tgt === m ? 1.5 : 0) - me.y) * T; G.down(Math.max(200, Math.min(W - 10, tx)), Math.max(130, Math.min(H - 200, ty)), 77); G.up(tx, ty, 77); }
        if (me.mp >= D.KIT.ult.cost && g.cdU <= 0) D.useUlt();
        ['strong', 'strong2', 'strong3'].forEach((k, i) => { const ab = D.KIT[k], cd = g[['cdS', 'cdS2', 'cdS3'][i]]; if (ab && me.mp > ab.cost && cd <= 0) D.useStrong(k); });
        if (Math.random() < 0.04) D.dodge();
      }
      const FD = D.FD; if (FD && m && window.__hpf && !m._hpf && m.act !== 'enter') { m._hpf = 1; m.hp = m.maxhp * window.__hpf; }
      if (FD && m) { window.__acts = window.__acts || {}; window.__acts[m.act] = (window.__acts[m.act] || 0) + 1; } return { acts: window.__acts, state: A.state, t: +g.t.toFixed(1), hp: Math.round(me.hp), boss: m ? { hp: Math.round(m.hp), max: Math.round(m.maxhp), act: m.act, ph: FD && FD.S.phase, tele: FD && FD.S.tele.length, hz: FD && FD.S.hz.length, objs: FD && FD.S.objs.length } : null, won: g.won, mons: D.mons.filter(x => !x.dead).length };
    }, bot);
    if (r.state !== 'play') { console.log('state', r.state); break; }
    if (Date.now() - last > (+process.env.SHOT_MS || 2000)) { last = Date.now(); console.log(JSON.stringify(r)); await page.screenshot({ path: path.resolve(__dirname, `../shots/fiend-${floor}-${shotN++}.png`) }); }
    await page.waitForTimeout(80);
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
