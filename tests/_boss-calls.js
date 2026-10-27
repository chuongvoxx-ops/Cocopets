// A Super Fiend's own drawing as the game does it over a run of frames (its kept pictures repainted in their turn, lit and
// laid down), every drawing call on any canvas flushed and timed, summed by kind and by the line that made it, per frame.
// usage: node tests/_boss-calls.js floor [frames] [top]   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 10), NF = +(process.argv[3] || 12), top = +(process.argv[4] || 20);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 777);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(([n, cap]) => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(n, 7); }, [fl0, +(process.env.CAP || 0)]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60); });
  const r = await page.evaluate(([NF, top, EX]) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = window.__run; if (EX) Object.assign(M, EX);
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
    step(5);
    const c0 = document.getElementById('arcCanvas').getContext('2d');
    for (let i = 0; i < 70; i++) { const a = i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; c0.save(); G.draw(c0); c0.restore(); }
    const Pr = CanvasRenderingContext2D.prototype, names = ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'strokeText', 'clearRect', 'putImageData', 'getImageData'];
    const orig = {}; names.forEach(n => { orig[n] = Pr[n]; });
    const byKind = {}, bySite = {}; let on = false, tot = 0, calls = 0;
    const flushOf = ctx => orig.getImageData.call(ctx, 0, 0, 1, 1);
    const kindOf = (ctx, n, args) => { const fs = n.startsWith('stroke') ? ctx.strokeStyle : ctx.fillStyle, st = typeof fs === 'string' ? 'col' : fs instanceof CanvasGradient ? 'grad' : fs instanceof CanvasPattern ? 'pat' : '?';
      const tr = ctx.getTransform(), sk = Math.abs(tr.b) > 1e-6 || Math.abs(tr.c) > 1e-6 ? ' turned' : '', tgt = ctx.canvas === c0.canvas ? 'screen' : `${ctx.canvas.width}x${ctx.canvas.height}`;
      let extra = ''; if (n === 'drawImage') { const img = args[0], dw = args.length >= 5 ? args[args.length - 2] : img.width, sw = args.length === 9 ? args[3] : img.width; extra = ` ${Math.abs(dw * tr.a / sw - 1) < 0.01 ? '1:1' : 'scaled'} ${img.width}x${img.height}`; }
      return `${n}${n === 'drawImage' || n === 'clearRect' || n === 'getImageData' ? '' : ' ' + st} ${ctx.globalCompositeOperation}${extra}${sk} → ${tgt}`; };
    const siteOf = () => { const s = (new Error().stack || '').split('\n'); const L = s.slice(3, 5).map(x => { const m2 = x.match(/at (\S+) .*:(\d+):\d+\)?$/) || x.match(/:(\d+):\d+$/); return m2 ? (m2[2] ? m2[1] + ':' + m2[2] : 'L' + m2[1]) : x.trim().slice(0, 30); }); return L.join(' < '); };
    names.forEach(n => { if (n === 'getImageData') return; Pr[n] = function (...a) { if (!on) return orig[n].apply(this, a); flushOf(this); const kd = kindOf(this, n, a), site = siteOf(); const t0 = performance.now(); const res = orig[n].apply(this, a); flushOf(this); const dt = performance.now() - t0; tot += dt; calls++;
      (byKind[kd] = byKind[kd] || [0, 0]); byKind[kd][0] += dt; byKind[kd][1]++; (bySite[site] = bySite[site] || [0, 0]); bySite[site][0] += dt; bySite[site][1]++; return res; }; });
    const db = FD.drawBoss; FD.drawBoss = function (...a) { on = true; try { return db.apply(this, a); } finally { on = false; } };
    for (let i = 0; i < NF; i++) { const a = 3.5 + i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; c0.save(); G.draw(c0); c0.restore(); }
    FD.drawBoss = db; names.forEach(n => { Pr[n] = orig[n]; });
    const srt = o => Object.entries(o).sort((a, b) => b[1][0] - a[1][0]).slice(0, top).map(([k2, v]) => `${(v[0] / NF).toFixed(2).padStart(6)} ms/frame ${String((v[1] / NF).toFixed(1)).padStart(6)}×  ${k2}`);
    return { tot: +(tot / NF).toFixed(1), calls: +(calls / NF).toFixed(0), kinds: srt(byKind), sites: srt(bySite) };
  }, [NF, top, process.env.EXTRA ? JSON.parse(process.env.EXTRA) : null]);
  console.log(`floor ${fl0}: its own drawing, timed call by call: ${r.tot} ms a frame over ${r.calls} calls a frame (the flushes make each call dearer than in play)`);
  console.log('-- by kind'); r.kinds.forEach(l => console.log(l)); console.log('-- by site'); r.sites.forEach(l => console.log(l));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
