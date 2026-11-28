// (v475d GA) Gabriel's motion strips at fight scale (GPU path forced on SwiftShader): N frames over each action, cropped round Gabriel and
// laid side by side, to judge the animation (anticipation, follow-through, easing, pops). usage:
//   HTML=<test html> OUT=shots/v475d-GA TAG=before node tests/_ga-strip.js [actions: idle,fly,bloom,harv,sanct,thr,enter,ult,diss]  N=10
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const OUT = process.env.OUT || 'shots/v475d-GA', TAG = process.env.TAG || 'strip', N = +(process.env.N || 10), ACTS = (process.argv[2] || 'idle,fly,bloom,harv,sanct,thr,enter,ult,diss').split(',');
  const SPAN = { idle: [0, 2.0], fly: [0, 2.0], bloom: [0, 2.6], harv: [0, 2.6], sanct: [0, 2.3], thr: [0, 5.2], enter: [0, 4.4], ult: [0, 13.0], diss: [12.6, 14.2] };
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__NG_GL = 0; window.__GB_GL = 0; let sd = 424242; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; });
  await page.goto('file://' + path.resolve(process.env.HTML || 'test.html')); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'virgo'; P.st.animas.res = null; P.dun.startDungeon(3, 5); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 300000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 300000 });
  await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; for (let k = 0; k < 60; k++) G.update(1 / 60);
    AN.kit.main.k = 3; D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 8000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 60, sy = me.y + (Math.random() - 0.5) * 60; let ok = true; for (let dx = -5; dx <= 5 && ok; dx++) for (let dy = -4; dy <= 4 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 1; me.y = best.y + 1.2; }
    const LS = [[2.6, -1.0], [3.4, -0.2], [2.9, 0.8], [3.8, 1.2], [-3.2, -0.6], [-3.6, 0.6]], mons = D.mons.filter(m => !m.boss).slice(0, 6); D.mons.filter(m => !mons.includes(m)).forEach(m => Object.assign(m, { dead: true, x: me.x + 300, y: me.y + 300 }));
    const place = () => mons.forEach((m, i) => Object.assign(m, { dead: false, x: me.x + LS[i][0], y: me.y + LS[i][1], hx: me.x + LS[i][0], hy: me.y + LS[i][1], hp: 1e7, maxhp: 1e7, spd: 0, atkCd: 99, dmg: 0 }));
    place(); const B = window.__GA = { G, D, P, AN, me, mons, place };
    B.step = (sec, h) => { h = h || 1 / 30; const n = Math.round(sec / h); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (let i = D.zones.length - 1; i >= 0; i--) if (D.zones[i].own === 'enemy') D.zones.splice(i, 1); for (const m of D.mons) m.atkCd = 99; me.hp = D.ST.hp; D.g.normalT = 99; D.g.cdS = D.g.cdS2 = D.g.cdS3 = D.g.cdU = 99; G.update(h); for (const m of mons) if (m.hx != null) { m.x = m.hx; m.y = m.hy; } } };
    B.fresh = () => { AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [], cine: null }); D.g.hitStop = 0; place(); AN.summon(); }; });
  console.log('model', await page.evaluate(() => { const G = window.GABRIEL_GL; if (!G) return 'none'; window.__GB_GL = 1; try { G.warm(); for (let i = 0; i < 600 && !G.ready(); i++) G.step && G.step(60); } catch (e) { return 'err ' + e.message; } window.__GB_GL = 0; return G.ready(); }));
  fs.mkdirSync(path.resolve(OUT), { recursive: true });
  const { execFileSync } = require('child_process');
  for (const act of ACTS) {
    const [t0, t1] = SPAN[act] || [0, 2]; const frames = [];
    await page.evaluate(([act, t0]) => { const { AN, step, fresh, me } = window.__GA; window.__NG_GL = 0; window.__GB_GL = 0; fresh(); const M = AN.gb;
      if (act === 'enter') { step(0.62); return; } step(6.5); const a = AN.S.list[0]; a.x = me.x - 1.4; a.y = me.y - 0.6; a.gb.vx = a.gb.vy = 0; if (a.gb.tr) a.gb.tr.n = 0; step(0.6);
      if (act === 'idle') { a.gb.act = null; a.gb.gap = 99; for (const m of window.__GA.mons) { m.dead = true; m.x += 300; } step(1); }
      else if (act === 'fly') { a.gb.act = null; a.gb.gap = 99; for (const m of window.__GA.mons) { m.dead = true; m.x += 300; } me.x += 5; a.gb.strT = null; }
      else if (act === 'ult' || act === 'diss') { for (const m of window.__GA.mons) M.addMark(m, 2); a.life = 0.05; step(0.1 + t0); }
      else { a.life = 25; M.cast(a, act); } }, [act, t0]);
    for (let i = 0; i < N; i++) {
      const r = await page.evaluate(([dt]) => { const { G, P, AN, step, D } = window.__GA; if (dt > 0) step(dt); const a = AN.S.list[0]; window.__NG_GL = 1; window.__GB_GL = 1; try { G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); } catch (e) { return { e: e.message }; } window.__NG_GL = 0; window.__GB_GL = 0;
        if (!a) return { gone: 1 }; const o = a.gbOut, sh = o && (o.shadow || o.body); return { x: sh ? sh.x : 195, y: sh ? sh.y : 520, act: a.gb && a.gb.act ? a.gb.act.kind : null, st: a.st, t: AN.gb.ul && AN.gb.ul.ul ? +AN.gb.ul.ul.t.toFixed(2) : null }; }, [i === 0 ? 0 : (t1 - t0) / (N - 1)]);
      const cx = Math.max(110, Math.min(280, r.x || 195)), cy = Math.max(160, Math.min(684, (r.y || 420) - 110)), f = path.resolve(OUT, `_f${i}.png`);
      await page.screenshot({ path: f, clip: { x: cx - 110, y: cy - 160, width: 220, height: 320 }, timeout: 300000 }); frames.push(f);
      if (i === 0 || i === N - 1) console.log(act, i, JSON.stringify(r));
    }
    const out = path.resolve(OUT, `${TAG}-${act}.png`);
    execFileSync('python3', ['-c', `import sys\nfrom PIL import Image\nfs=sys.argv[2:]\nims=[Image.open(f) for f in fs]\nW=Image.new('RGB',(220*len(ims),320))\nfor i,im in enumerate(ims): W.paste(im,(i*220,0))\nW.save(sys.argv[1])`, out, ...frames]);
    for (const f of frames) fs.unlinkSync(f); console.log('strip', out);
  }
  console.log('errors', JSON.stringify(errors.slice(0, 5))); await browser.close(); })();
