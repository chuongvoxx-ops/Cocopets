// v388 D: destruction effects (20b2 BREAK_FX): break a prop / pot in a running stage and take a frame strip at phone size
// (393x852, DPR 2), frozen frame by frame on the effect's own clock. Checks: the break spawns pieces, they settle, a rubble
// decal stays, nothing throws, the live-piece cap holds. GPU=0 for the 2D fallback (default: the GPU painter forced on).
// HTML=test-calD.html node tests/_cal-d-break.js [pot crystal column lavafall ice bigcrystal cap]
process.env.HTML = process.env.HTML || 'test.html';
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), { execFileSync } = require('child_process');
const SC = {
  pot: { stage: 0, pot: true },
  crystal: { stage: 0, kinds: ['blackcrystal'], dist: 2.4 },
  column: { stage: 0, kinds: ['basaltcol'] },
  lavafall: { stage: 0, kinds: ['lavafall'], dist: 2.6 },
  ice: { stage: 3, kinds: ['frostcluster', 'frostwell', 'icefall', 'rimevessel'], dist: 2.6 },
  bigcrystal: { stage: 6, kinds: ['bigcrystal', 'crystalforest', 'magmaglass'] },
  geode: { stage: 6, kinds: ['geode'], dist: 2.4 },
  mound: { stage: 0, kinds: ['ashmound'], dist: 2.4 },   // v466 CF: the remade ash mound (20zz5d)
  tower: { tower: true, kinds: null },
  paint: { stage: 0, kinds: ['ashmound', 'glassspire'], dist: 3.2, paint: true }   // the call shape S's furnace idols use (a painter, key, w, h, size, hot)
};
const FR = (process.env.FR || '0,0.08,0.2,0.4,0.7,1.1,1.8,2.8,4.5,7').split(',').map(Number);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: +(process.env.DPR || 2), hasTouch: true });   // (DPR=1 for GPU strips on a software rasteriser: a quarter of the pixels)
  page.setDefaultTimeout(400000); const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 12; P.st.dun.best = 10; P.openMap(); P.dun.setMapTab('rift', true); }); if (process.env.LOW) await page.evaluate(() => { window.__pp.st.lowFx = true; });
  const sfx = (process.env.GPU === '0' ? '-2d' : '') + (process.env.LOW ? '-low' : '');
  const gpu = process.env.GPU !== '0';
  const run = secs => page.evaluate(async secs => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, secs);
  const want = process.argv.slice(2).length ? process.argv.slice(2) : ['pot', 'crystal', 'column', 'lavafall', 'ice', 'cap'];
  let bad = 0; const out = [];
  if (want.includes('map')) {
    // the material every prop kind breaks as (Rift 0's explicit map checked)
    const r = await page.evaluate(() => { const B = self.BREAK_FX, ks = Object.keys(window.__pp.DunWorld.PROPS), by = {}; for (const k of ks) (by[B.matOf(k, window.__pp.PROP_EL[k])] = by[B.matOf(k, window.__pp.PROP_EL[k])] || []).push(k); return by; });
    const want0 = { blackcrystal: 'blackfire', bigcrystal: 'blackfire', basaltcol: 'basalt', frostwell: 'ice', lavafall: 'lava', glassspire: 'glass', ashmound: 'basalt', forge: 'iron', vessel: 'iron', chains: 'iron', metalring: 'iron', anvil: 'iron', slabhang: 'glass', frostcluster: 'ice', icechains: 'ice', rimevessel: 'iron', icefall: 'ice', crystalforest: 'crystal', geode: 'crystal', magmaglass: 'glass' };
    for (const [m, ks] of Object.entries(r)) console.log('map', m.padEnd(10), ks.length, ks.join(' '));
    const miss = Object.entries(want0).filter(([k, m]) => !(r[m] || []).includes(k)); if (miss.length) { bad++; console.log('map FAIL', JSON.stringify(miss)); } else console.log('map OK (Rift 0: ' + Object.keys(want0).length + ' kinds)');
  }
  for (const name of want) {
    if (name === 'cap' || name === 'map') continue;
    const S = SC[name]; if (!S) { console.log('unknown', name); continue; }
    await page.evaluate(([stage, tower]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); if (tower) { P.dun.setMapTab('tower', true); P.dun.startDungeon(1); } else { P.dun.setMapTab('rift', true); P.startRift('caldera', stage); } }, [S.stage, !!S.tower]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
    await page.evaluate(gpu => { window.__NG_GL = gpu ? 1 : 0; window.__bfxWait = gpu ? 900000 : 20000; }, gpu);
    await run(0.6);
    // pick the target: one with open floor in front of it, and clear the monsters away
    const tg = await page.evaluate(([kinds, pot, dist]) => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.boss && !m.dead) { m.freeze = 1e9; m.x = D.me.x + 40; m.y = D.me.y + 40; } D.g.taps = 9;
      const ok = (x, y) => [1.2, 2, 3, 4].every(d => D.walkAt(Math.floor(x), Math.floor(y + d)) && D.walkAt(Math.floor(x - 1), Math.floor(y + d)) && D.walkAt(Math.floor(x + 1), Math.floor(y + d)));
      let list = pot ? D.pots.filter(p => !p.broken) : D.propList.filter(p => !p.broken && (!kinds || kinds.includes(p.kind)));
      if (!list.length && kinds) list = D.propList.filter(p => !p.broken);
      list.sort((a, b) => (ok(b.x, b.y) ? 1 : 0) - (ok(a.x, a.y) ? 1 : 0));
      const p = list[0]; if (!p) return null; D.me.x = p.x + 0.6; D.me.y = p.y + (dist || (pot ? 2.2 : 3.6)); D.g.intro = 0; D.me.vx = D.me.vy = 0;
      window.__bfxT = p; return { kind: p.kind, x: p.x, y: p.y, n: list.length }; }, [S.kinds, !!S.pot, S.dist || 0]);
    if (!tg) { console.log(name, 'no target'); bad++; continue; }
    await run(+(process.env.WAIT || 9));
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.vx = D.me.vy = 0; D.g.hitStop = 1e9; });
    await run(0.3);
    // break it
    await page.evaluate(v => { window.__bfxPaint = v; }, !!S.paint);
    const t0 = await page.evaluate(pot => { const D = window.__pp.arc.game._dbg, p = window.__bfxT; D.g.hitStop = 0; if (window.__bfxPaint) { p.broken = true; self.BREAK_FX.burst(null, p.x, p.y, { kind: 'furnaceidol', mat: 'basalt', hot: '#FF6A1F', size: 2.8, w: 2.4, h: 3.4, key: 'testidol', paint(c, P) { const g = c.createLinearGradient(-P, -P * 3, P, 0); g.addColorStop(0, '#5E5456'); g.addColorStop(1, '#1A1416'); c.fillStyle = g; c.beginPath(); c.moveTo(-P * 0.9, 0); c.lineTo(-P * 0.7, -P * 2.2); c.lineTo(-P * 0.35, -P * 3.1); c.lineTo(P * 0.35, -P * 3.1); c.lineTo(P * 0.7, -P * 2.2); c.lineTo(P * 0.9, 0); c.closePath(); c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = P * 0.05; c.stroke(); c.fillStyle = '#FF8A3D'; c.beginPath(); c.arc(0, -P * 1.9, P * 0.3, 0, 6.283); c.fill(); } }); } else if (pot) { const B = window.__pp.BIOMES, kind = p.kind === 'pot' && B[p.biome] && B[p.biome].out ? 'urn' : p.kind === 'pot' && (p.v % 3 === 0) ? 'crate' : p.kind === 'barrel' ? 'xbarrel' : p.kind; p.broken = true; self.BREAK_FX.burst(null, p.x, p.y + 0.3, { kind, biome: p.biome || D.F.biome }); } else D.RES.hitProp(p, 'light', 99); return self.BREAK_FX.stats().t; }, !!S.pot);
    const crop = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, p = window.__bfxT, X = D.X; const sy = X.sy ? X.sy(p.y) : 600; return { y: sy }; });
    const frames = [], stats = [];
    for (let i = 0; i < FR.length; i++) {
      await page.evaluate(async ([t0, dt]) => { const D = window.__pp.arc.game._dbg; D.g.hitStop = 0; const t1 = performance.now(); while (self.BREAK_FX.stats().t - t0 < dt && performance.now() - t1 < +(window.__bfxWait || 20000)) { await new Promise(r => requestAnimationFrame(r)); if (D.g.hitStop > 1e6) D.g.hitStop = 0; } D.g.hitStop = 1e9; D.me.hp = D.ST.hp; D.banners.length = 0; D.g.intro = 0; }, [t0, FR[i]]);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const f = path.resolve(__dirname, `../shots/d-${name}${sfx}-${i}.png`);
      const y0 = 0;
      await page.screenshot({ path: f });  frames.push(f);
      stats.push(await page.evaluate(t0 => { const s = self.BREAK_FX.stats(); return (s.t - t0).toFixed(2) + ':' + s.shards + '/' + s.parts + '/' + s.decals; }, t0));
    }
    await page.evaluate(() => { window.__pp.arc.game._dbg.g.hitStop = 0; });
    const fin = await page.evaluate(() => self.BREAK_FX.stats());
    const strip = path.resolve(__dirname, `../shots/d-${name}${sfx}.png`);
    execFileSync('python3', ['-c', `import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f) for f in fs]; w,h=ims[0].size; k=0.5 if w>500 else 1.0
cols=5; rows=(len(ims)+cols-1)//cols; S=Image.new('RGB',(int(w*k)*cols,int(h*k)*rows),(0,0,0))
for i,im in enumerate(ims): S.paste(im.resize((int(w*k),int(h*k))),((i%cols)*int(w*k),(i//cols)*int(h*k)))
S.save(sys.argv[1])`, strip, ...frames]);
    const ok = fin.decals >= 1 || S.kinds && ['cloud'].includes(tg.kind);
    if (!ok) bad++;
    console.log(name, JSON.stringify(tg), 'frames', stats.join(' '), 'final', JSON.stringify(fin), ok ? 'OK' : 'FAIL', '->', path.relative(process.cwd(), strip));
  }
  if (want.includes('cap')) {
    // the cap: smash every prop on the floor at once (as a vehicle would) and run; pieces never exceed 300
    const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; let max = 0, n = 0; for (const p of D.propList) if (!p.broken) { D.RES.hitProp(p, 'light', 99, { quiet: n % 3 !== 0 }); n++; } const t0 = performance.now(); while (performance.now() - t0 < 3000) { await new Promise(r => requestAnimationFrame(r)); const s = self.BREAK_FX.stats(); if (s.shards > max) max = s.shards; } return { n, max, s: self.BREAK_FX.stats() }; });
    const ok = r.max <= 300; if (!ok) bad++;
    console.log('cap', JSON.stringify(r), ok ? 'OK' : 'FAIL');
  }
  console.log('errors', errors.length, errors.slice(0, 5)); await browser.close(); process.exit(bad || errors.length ? 1 : 0);
})();
