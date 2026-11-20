// v430 PF: the look is kept. The same frame of the game (same state, the clock and the dice held) drawn twice in one page:
// with the v430 PF painter changes off (window.__PF_OFF = 1: every quad whole, one program, whole-layer composites, as
// v429) twice (a control: what a second draw changes by itself) and on; the two pictures compared pixel by pixel and saved side by side. Then the cost of each, alternating
// frames in the same page (so the machine's load is the same for both): median ms, the GPU fill and the composites.
// usage: HTML=test-pf.html node tests/_pf-same.js    env: STAGE (0), ULT (sunflare,armageddon,titan,worldshaking,deadscream
//        or none), AT (seconds into the cast, comma list per ult), N (timed frames per side, 8), OUTDIR (shots/v430-PF)
const { open } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
(async () => {
  const T = await open({ html: process.env.HTML }); const { page, errors, start, frames } = T;
  const STAGE = +(process.env.STAGE || 0), ULTS = (process.env.ULT || 'sunflare').split(','), ATS = (process.env.AT || '').split(',').map(Number), N = +(process.env.N || 8);
  const OUT = path.resolve(__dirname, '..', process.env.OUTDIR || 'shots/v430-PF'); fs.mkdirSync(OUT, { recursive: true });
  await start(STAGE);
  await page.evaluate(sc => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; for (let k = 0; k < 90; k++) G.update(1 / 60);
    if (sc === 1) { me.x = 52.5; me.y = 59.5; } else { const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null; for (let k = 0; k < 3000; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; } const boss = D.mons.find(m => m.boss && !m.dead); if (sc === 7 && boss) { me.x = boss.x; me.y = boss.y + 4.5; try { D.wakeBoss(); } catch (e) {} } else if (best) { me.x = best.x; me.y = best.y + 2; } }
    D.mons.filter(m => !m.boss && !m.dead).slice(0, 16).forEach((m, i) => { const b = i / 16 * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); });
    D.g.intro = 0; D.banners.length = 0; for (let k = 0; k < 120 || (D.g.bossIntro > 0 && k < 900); k++) { me.hp = D.ST.hp; G.update(1 / 60); } }, STAGE);
  await frames(30, { prof: false });   // (the ground's chunks painted)
  const same = async name => {
    const r = await page.evaluate(async () => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), cv = c.canvas;
      const pn = performance.now.bind(performance), mr = Math.random, dn = Date.now, T0 = pn(), D0 = dn(); D.g.negT = 0; D.g.negF = 0; if (D.cam) D.cam.sm = 0;
      const draw = off => { window.__PF_OFF = off; performance.now = () => T0; Date.now = () => D0; let s = 777; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; try { c.save(); G.draw(c); c.restore(); } finally { performance.now = pn; Math.random = mr; Date.now = dn; } return c.getImageData(0, 0, cv.width, cv.height); };
      const a = draw(1), b = draw(0), a0 = draw(1); window.__PF_OFF = 0; let n2 = 0, n8 = 0, mx = 0, sum = 0, c8 = 0, cmx = 0; const d = new Uint8ClampedArray(a.data.length);
      /* (the control: the old painter again after the new one (a, b, a0): what drawing again changes by itself, a HUD bar easing, a picture's own counter; a difference the control also shows is not the painter's) */
      for (let i = 0; i < a.data.length; i += 4) { let m = 0; for (let k = 0; k < 3; k++) m = Math.max(m, Math.abs(a0.data[i + k] - a.data[i + k])); if (m > 8) c8++; if (m > cmx) cmx = m; }
      for (let i = 0; i < a.data.length; i += 4) { let m = 0; for (let k = 0; k < 3; k++) { const v = Math.abs(a.data[i + k] - b.data[i + k]); if (v > m) m = v; } sum += m; if (m > 2) n2++; if (m > 8) n8++; if (m > mx) mx = m; const e = Math.min(255, m * 16); d[i] = e; d[i + 1] = e; d[i + 2] = e; d[i + 3] = 255; }
      const sheet = document.createElement('canvas'), w = cv.width, h = cv.height; sheet.width = w * 3 + 16; sheet.height = h; const x = sheet.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, sheet.width, h);
      x.putImageData(a, 0, 0); x.putImageData(b, w + 8, 0); x.putImageData(new ImageData(d, w, h), w * 2 + 16, 0);
      return { px: a.data.length / 4, n2, n8, max: mx, ctrl8: c8, ctrlMax: cmx, mean: +(sum / (a.data.length / 4)).toFixed(4), png: sheet.toDataURL('image/png') }; });
    fs.writeFileSync(path.join(OUT, `same-${name}.png`), Buffer.from(r.png.split(',')[1], 'base64')); delete r.png; return r; };
  const ab = async () => { const on = [], off = []; for (let k = 0; k < N; k++) for (const o of k % 2 ? [0, 1] : [1, 0]) { const r = (await frames(1, { prof: false, off: o })).rows[0]; (o ? off : on).push(r); }
    const med = (L, k) => { const v = L.map(r => r[k]).sort((a, b) => a - b); return +v[v.length >> 1].toFixed(2); }, mean = (L, k) => +(L.reduce((a, r) => a + r[k], 0) / L.length).toFixed(2);
    const S = L => ({ tot: med(L, 'tot'), draw: med(L, 'draw'), fgMs: med(L, 'fgMs'), diGLms: med(L, 'diGLms'), glmMs: med(L, 'glmMs'), glm: mean(L, 'glmN'), resize: mean(L, 'cvResize'), fill: +(mean(L, 'fgFill') / 1e6).toFixed(3), compMpx: +(mean(L, 'diGLA') / 1e6).toFixed(2), comp: mean(L, 'fgComp'), flushes: mean(L, 'fgFlush'), quads: mean(L, 'fgQuads') });
    return { v429: S(off), v430: S(on) }; };
  const res = {};
  res.base = { same: await same(`s${STAGE}-base`), ab: await ab() }; console.log('base', JSON.stringify(res.base));
  for (let i = 0; i < ULTS.length; i++) { const u = ULTS[i]; if (u === 'none') continue;
    const at = ATS[i] || { sunflare: 2.6, armageddon: 1.6, titan: 2.2, worldshaking: 1.2, deadscream: 2.0 }[u];
    await page.evaluate(([u, el, at]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.me.mp = 999; D.g.cdU = 0; D.g.intro = 0; D.g.bossIntro = 0; const bs = D.mons.find(m => m.boss && !m.dead); if (bs && D.FD) { D.me.x = bs.x + 0.5; D.me.y = bs.y + 3.2; D.me.vx = D.me.vy = 0; } D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const n0 = D.ELEM.fx.length; const f = D.ELEM.fx[D.ELEM.fx.length - 1]; if (!f) throw new Error('the Ultimate did not fire: ' + u); let k = 0; while (f && f.t < at && k++ < 900) { D.me.hp = D.ST.hp; G.update(1 / 60); } }, [u, EL[u], at]);
    res[u] = { same: await same(`s${STAGE}-${u}`), ab: await ab() }; console.log(u, JSON.stringify(res[u]));
    await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 60 * 14; k++) { D.me.hp = D.ST.hp; G.update(1 / 60); if (!D.ELEM || !D.ELEM.fx.length) break; } if (D.helpers) D.helpers.length = 0; });
  }
  fs.writeFileSync(path.join(OUT, `same-s${STAGE}.json`), JSON.stringify(res, null, 1));
  console.log('page errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
