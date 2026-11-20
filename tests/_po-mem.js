// v434 PO: iPhone memory over a run of Rift 03 stages (as v406 measured the Tower and the Caldera): at DPR 3 (an iPhone's
// canvas), each stage played a while (frames drawn, the GPU paths on as a phone takes them), then left. After each stage, while
// it plays and after it is closed: the live canvases (their pixels x 4 bytes, as WebKit holds them; WeakRefs, after a full
// collection), the WebGL buffers and textures still alive (bytes given to bufferData / texImage2D, minus those deleted), the
// JS heap, and the dunes' picture caches. Nothing may pile up from stage to stage.
// usage: HTML=test-po.html node tests/_po-mem.js   env: STAGES (0,1,2,3,4,5,6,7,8,9,10,11,0,3,11), DPR (3), F (frames drawn a stage, 8)
process.env.RIFT = 'dunes';
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const STAGES = (process.env.STAGES || '0,1,2,3,4,5,6,7,8,9,10,11,0,3,11').split(',').map(Number), DPR = +(process.env.DPR || 3), F = +(process.env.F || 8);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true }); page.setDefaultTimeout(2400000);
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('crash', () => errors.push('PAGE CRASHED'));
  await page.addInitScript(() => {
    for (const f of ['__NG_GL', '__SAR_GL', '__DB_GL', '__SAR_GLHQ', '__DB_GLHQ', '__GLM_WARM']) window[f] = 1;
    const live = window.__canv = [], mk = document.createElement.bind(document), who = new WeakMap();
    document.createElement = function (t, o) { const e = mk(t, o); if (String(t).toLowerCase() === 'canvas') { live.push(new WeakRef(e)); const st = (new Error().stack || '').split('\n')[2] || ''; who.set(e, (st.match(/at ([^ ]+) /) || [])[1] || '?'); } return e; };
    window.__cwho = who;
    // the GPU's memory: bytes each live buffer and texture was given
    const GB = window.__glb = new Map(), GT = window.__glt = new Map();
    for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const P = G.prototype;
      const cur = new WeakMap(); const ob = P.bindBuffer, obd = P.bufferData, odb = P.deleteBuffer, obt = P.bindTexture, oti = P.texImage2D, odt = P.deleteTexture;
      P.bindBuffer = function (tg, b) { let m = cur.get(this); if (!m) cur.set(this, m = {}); m[tg] = b; return ob.apply(this, arguments); };
      P.bufferData = function (tg, d) { const m = cur.get(this), b = m && m[tg]; if (b) GB.set(b, typeof d === 'number' ? d : (d && d.byteLength) || 0); return obd.apply(this, arguments); };
      P.deleteBuffer = function (b) { GB.delete(b); return odb.apply(this, arguments); };
      P.bindTexture = function (tg, t) { let m = cur.get(this); if (!m) cur.set(this, m = {}); m['t' + tg] = t; return obt.apply(this, arguments); };
      P.texImage2D = function (tg) { const m = cur.get(this), t = m && m['t' + (tg === this.TEXTURE_2D ? tg : this.TEXTURE_CUBE_MAP)]; const a = arguments; let bytes = 0; if (a.length >= 9) bytes = a[3] * a[4] * 4; else { const s = a[a.length - 1]; bytes = s ? (s.width || 0) * (s.height || 0) * 4 : 0; } if (t) GT.set(t, (GT.get(t) || 0) + bytes); return oti.apply(this, arguments); };
      P.deleteTexture = function (t) { GT.delete(t); return odt.apply(this, arguments); }; }
  });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-po.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 900000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 40; P.st.unlockAll = true; P.st.dun.best = 120; for (const p of P.partyPets()) p.dlv = 40; P.openMap(); P.dun.setMapTab('rift', true); });
  const measure = async label => {
    await page.evaluate(() => { if (window.gc) { window.gc(); window.gc(); } }); await page.waitForTimeout(150);
    const m = await page.evaluate(() => { let n = 0, px = 0; const by = {}, L = window.__canv; for (let i = L.length - 1; i >= 0; i--) { const c = L[i].deref(); if (!c) { L.splice(i, 1); continue; } const p = c.width * c.height; if (p <= 1) continue; n++; px += p; const k = window.__cwho.get(c) || '?'; by[k] = (by[k] || 0) + p * 4 / 1048576; }
      const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + v.toFixed(1)).join(', ');
      let gb = 0; for (const v of window.__glb.values()) gb += v; let gt = 0; for (const v of window.__glt.values()) gt += v;
      const S = window.DUNE_SKY, PR = window.DUNE_PROPS, TR = window.DUNE_TRAPS; let pics = {};
      try { pics = { skyMB: +((S.stats.px || 0) * 4 / 1048576).toFixed(1), propMB: +((PR.stats.px || 0) * 4 / 1048576).toFixed(1), trapPics: TR && TR.PICS ? (TR.PICS.size != null ? TR.PICS.size : Object.keys(TR.PICS).length) : null }; } catch (e) {}
      return { canvases: n, canvasMB: +(px * 4 / 1048576).toFixed(1), glBufMB: +(gb / 1048576).toFixed(1), glTexMB: +(gt / 1048576).toFixed(1), heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null, pics, top }; });
    console.log(label.padEnd(26), JSON.stringify(m)); return m; };
  const out = { start: await measure('start') }, rows = [];
  for (const s of STAGES) {
    await page.evaluate(s => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; try { P.riftState().prog.dunes = s; } catch (e) {} P.openMap(); P.dun.setMapTab('rift', true); P.startRift('dunes', s); }, s);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 2400000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 120000 });
    // (played: the loop stopped and driven by hand, the boss fights woken, the pet walked about so the land's pictures are painted)
    await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; });
    for (let f = 0; f < F; f++) await page.evaluate(f => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, me = D.me, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'); const b = D.FD && (D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt)); if (b && f === 0) { me.x = b.x; me.y = b.y + 6; }
      for (let k = 0; k < 40; k++) { if (me && !me.dead) me.hp = D.ST.hp; if (!D.FD && k % 10 === 0) { const nx = me.x + (f % 2 ? 0.6 : -0.6); if (D.walkAt(Math.floor(nx), Math.floor(me.y))) me.x = nx; } G.update(1 / 60); } c.save(); G.draw(c); c.restore(); }, f);
    const play = await measure(`stage ${s} playing`);
    await page.evaluate(() => { const P = window.__pp; P.arc.open = true; P.closeArcade(true); }); await page.waitForTimeout(400);
    const after = await measure(`stage ${s} closed`); rows.push({ s, play, after });
  }
  out.rows = rows; console.log('\nRESULT ' + JSON.stringify(out));
  console.log('page errors', errors.length, errors.slice(0, 4)); await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
