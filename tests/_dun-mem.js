// Memory over a run of Tower floors, as a player climbing 7, 8, 9 and again: after each floor (played a while, then
// left), the live canvases (their pixels, as a phone holds them), the JS heap, the DOM and the pictures, after a
// collection. usage: node tests/_dun-mem.js [floors] [secs]   env: HTML, LEG=1 (a team of Celestial six-stars), DPR
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '7,8,9,7,8,9,7,8,9').split(',').map(Number), secs = +(process.argv[3] || 12);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: +(process.env.DPR || 3), hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('crash', () => errors.push('PAGE CRASHED'));
  await page.addInitScript(() => {
    // every canvas made is followed (weakly), so the ones still alive can be summed
    const live = window.__canv = [], mk = document.createElement.bind(document);
    // pixels given to canvases (each time one is made bigger): what the page asks of memory, garbage included
    window.__alloc = 0; ['width', 'height'].forEach(k => { const D = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k); Object.defineProperty(HTMLCanvasElement.prototype, k, { get() { return D.get.call(this); }, set(v) { const a0 = this.width * this.height; D.set.call(this, v); const a1 = this.width * this.height; if (a1 > a0) { window.__alloc += a1 - a0; const st = (window.__cw && window.__cw.get(this)) || (new Error().stack || '').split('\n').slice(2, 4).map(l => (l.match(/:(\d+):\d+\)?$/) || [])[1]).join('<'); (window.__as || (window.__as = {}))[st] = ((window.__as || {})[st] || 0) + (a1 - a0); } } }); });
    document.createElement = function (t, o) { const e = mk(t, o); if (String(t).toLowerCase() === 'canvas') { const st = (new Error().stack || '').split('\n').slice(2, 4).map(l => (l.match(/:(\d+):\d+\)?$/) || [])[1]).join('<'); live.push(new WeakRef(e)); (window.__made || (window.__made = {}))[st] = ((window.__made || {})[st] || 0) + 1; (window.__cw || (window.__cw = new WeakMap())).set(e, st); } return e; };
    if (window.OffscreenCanvas) { const OC = window.OffscreenCanvas; window.OffscreenCanvas = function (w, h) { const c = new OC(w, h); live.push(new WeakRef(c)); return c; }; window.OffscreenCanvas.prototype = OC.prototype; }
    let a = 99; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(leg => {
    const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    if (leg) {
      const mk = (sd) => { const g = P.summonGenome(6, P.mulberry32(sd)), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7)), p = P.newPetFields('L' + sd, g); p.forms = line; p.stage = 7; for (let n = 2; n <= 7; n++) p.paid[n] = true; p.rarity = 5; p.dlv = 40; return p; };
      P.st.others = [mk(11), mk(23), mk(47)]; P.switchPet(0); P.st.party = [P.st.uid || P.st.others[0].uid].concat(P.st.others.slice(0, 2).map(p => p.uid)).filter(Boolean);
    }
    P.openMap(); P.dun.setMapTab('dungeon', true);
  }, !!process.env.LEG);
  const cdp = await page.context().newCDPSession(page);
  const measure = async label => {
    await page.evaluate(() => { if (window.gc) { window.gc(); window.gc(); } });
    await page.waitForTimeout(200);
    const m = await page.evaluate(() => { let n = 0, px = 0, big = 0; const L = window.__canv; for (let i = L.length - 1; i >= 0; i--) { const c = L[i].deref(); if (!c) { L.splice(i, 1); continue; } n++; const p = c.width * c.height; px += p; if (p > 1e6) big++; }
      const tops = L.map(r => r.deref()).filter(Boolean).map(c => [c.width, c.height]).sort((a, b) => b[0] * b[1] - a[0] * a[1]).slice(0, 5).map(d => d.join('x')).join(' ');
      const by = {}; L.forEach(r => { const c = r.deref(); if (!c) return; const k = window.__cw && window.__cw.get(c) || '?'; const b = by[k] || (by[k] = [0, 0]); b[0]++; b[1] += c.width * c.height * 4 / 1048576; });
      window.__by = Object.entries(by).sort((a, b) => b[1][0] - a[1][0]).slice(0, 8).map(([k, v]) => `${k}:${v[0]}/${v[1].toFixed(1)}MB`).join(' ');
      const made = Object.entries(window.__made || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ':' + v).join(' '); window.__made = {};
      const allocMB = +(window.__alloc * 4 / 1048576).toFixed(0); window.__alloc = 0;
      const allocBy = Object.entries(window.__as || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ':' + (v * 4 / 1048576).toFixed(0)).join(' '); window.__as = {};
      return { allocMB, allocBy, made, by: window.__by, tops, canvases: n, canvasMB: +(px * 4 / 1048576).toFixed(1), big, dom: document.getElementsByTagName('*').length, imgs: document.images.length, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null }; });
    const hu = await cdp.send('Runtime.getHeapUsage'); m.heap = +(hu.usedSize / 1048576).toFixed(1);
    console.log(label.padEnd(16), JSON.stringify(m)); return m;
  };
  await measure('start');
  for (let i = 0; i < floors.length; i++) {
    const n = floors[i];
    await page.evaluate(n => { const P = window.__pp; P.st.energy = 100; P.dun.startDungeon(n, 1000 + n); }, n);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
    // play: walk about and attack, as the game runs in real time
    const t0 = Date.now();
    while (Date.now() - t0 < secs * 1000) {
      await page.evaluate(() => { const A = window.__pp.arc, G = A.game; if (!G || A.state !== 'play') return; const W = A.W, H = A.H; const x = W * (0.3 + Math.random() * 0.4), y = H * (0.3 + Math.random() * 0.4); G.down && G.down(x, y, 77); G.up && G.up(x, y, 77); const D = G._dbg; if (D) { if (D.me) { D.me.mp = 9999; } ['strong', 'strong2', 'strong3'].forEach(k => { try { D.useStrong(k); } catch (e) {} }); try { D.useUlt(); } catch (e) {} try { if (D.AN && D.AN.ready && D.AN.ready()) D.AN.summon(); } catch (e) {} } });
      await page.waitForTimeout(250);
      if (process.env.INPLAY && (Date.now() - t0) % 4000 < 260) await measure(`  in floor ${n}`);
    }
    await page.evaluate(() => { const P = window.__pp; P.closeArcade && P.closeArcade(true); });
    await page.waitForTimeout(400);
    await measure(`after floor ${n} (${i + 1})`);
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
