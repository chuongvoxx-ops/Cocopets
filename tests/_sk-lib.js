// (v463 SK) Khyros, the Hound Beyond the Angles (Rift 04's last boss): a page with the hook and the Sepulchre's boss stage, the fight driven
// by game updates without drawing (adv), real frames only where a shot is wanted.
// opts: { gl (default true: window.__SK_GL forced on a software rasteriser; false: the 2D fallback, the painter off too), dpr, html, out }
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../shots/v463-SK');
async function openSK(opts) {
  opts = opts || {}; const gl = opts.gl !== false, out = opts.out || OUT; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: opts.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Khyros|GLM|GFX|KHY/.test(m.text())) errors.push('console: ' + m.text()); });
  const html = opts.html || process.env.HTML || 'test-sk.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 300000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 42; P.st.unlockAll = true; P.st.dun.best = Math.max(P.st.dun.best || 0, 120);
    for (const id of ['belfry', 'garden', 'dunes']) P.riftState().seals[id] = 1;
    if (o.gl) { window.__SK_GL = 1; window.__NG_GL = 1; if (o.hq) { window.__DB_GLHQ = 1; window.__SK_GLHQ = 1; } } if (o.ssky0) window.__SSKY = 0; else { window.__SK_GL = 0; window.__SK_FX = 0; } P.openMap(); P.dun.setMapTab('rift', true); }, { gl, hq: !!(opts.hq || process.env.HQ), ssky0: !!process.env.SSKY0 });
  const start = async () => { await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); const R = P.RIFT_BY_ID.sepulchre, i = R.stages.findIndex(s => s.boss === 'khyros'); window.__skStage = i; P.startRift('sepulchre', i); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 2400000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 2400000 }); await page.evaluate(() => { window.__pp.arc.paused = true; }); };
  // in the page: P, U (the game), D (its debug), b (the boss), FX, M (its memory), me, DEF, O (its GPU model or null), C (the arena's centre)
  const PRE = `const P = window.__pp, U = P.arc.game, D = U && U._dbg; let b = D && (D.g.boss || D.mons.find(q => q.boss)); const FX = D && D.FD && D.FD.FX, M = FX && FX.mem, me = D && D.me, DEF = P.FIEND_DEFS.khyros, O = DEF && DEF.MODEL || null, C = FX && FX.C;
    const top = () => { if (me && !me.dead) { me.hp = D.ST.hp; me.mp = 999; } };
    const adv = (secs, each) => { const n = Math.max(1, Math.round(secs / 0.05)); for (let i = 0; i < n; i++) { top(); if (each) each(i); U.update(0.05); if (!b || b.dead && D.g.boss && D.g.boss !== b) b = D.g.boss || D.mons.find(q => q.boss); } top(); };
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));
    const until = (k, n) => { for (let i = 0; i < (n || 4000) && b.act !== k; i++) { top(); FX.S.tele.length = 0; M.q.length = 0; M.lg = null; b.stunT = 0; b.act = 'prowl'; b.actT = 99; M.fade = M.fadeTo = 0; U.update(0.001); } return b.act === k; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const shot = async name => { const f = path.join(out, name + '.png'); await page.screenshot({ path: f, timeout: 0 }); return f; };
  return { browser, page, errors, start, ev, shot, OUT: out };
}
module.exports = { openSK, OUT };
