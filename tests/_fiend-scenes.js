// Photographs a Super Fiend's attacks at chosen moments: each scene sets the stage (its health), places the pet,
// starts one attack from the fiend's test hooks and steps to each moment. usage: node tests/_fiend-scenes.js <floor> <id> <scene,...>
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const SCENES = {
  abaddon: {
    rest: { hp: 1, at: [0, 5], steps: [0.6] },
    bisection: { hp: 1, job: 'bisection', at: [2, 4], steps: [0.9, 1.75] },
    cross: { hp: 1, job: 'crossExam', at: [-7, -7], steps: [1.2, 2.05, 2.95] },
    pinpoint: { hp: 1, job: 'pinpoint', at: [2, 4], steps: [1.0, 2.35, 3.2] },
    fault: { hp: 1, job: 'faultLines', at: [0, 5], steps: [1.4, 2.7, 3.9] },
    contra: { hp: 0.69, job: 'contradiction', at: [2, 3], steps: [0.9, 2.0, 3.0] },
    closing: { hp: 0.69, job: 'closing', at: [0, 5], steps: [1.0, 2.6, 3.9] },
    reassembly: { hp: 0.69, job: 'reassembly', at: [0, 5], steps: [1.2, 2.1, 3.4] },
    zero: { hp: 0.34, at: [0, 5], steps: [1.0] },
    proof: { hp: 0.34, job: 'finalProof', at: [-6, 6], steps: [2.0, 3.6, 7.0] },
    end: { hp: 0.34, kill: true, at: [0, 6], steps: [1.0, 1.4, 2.6, 4.0] },
  },
  choronzon: {
    crown: { hp: 1, at: [0, 6], steps: [0.6] },
    impale: { hp: 1, job: 'impalement', at: [0, 5], steps: [1.2, 2.7, 3.6] },
    decree: { hp: 1, job: 'decree', at: [3, 5], steps: [0.9, 1.6, 1.95] },
    refl: { hp: 1, job: 'decree', at: [0, 12.3], steps: [1.5, 2.15, 2.6] },
    fan: { hp: 1, job: 'fan', at: [0, 6], steps: [1.2, 1.75] },
    cage: { hp: 0.69, at: [0, 3], steps: [0.5] },
    open: { hp: 0.69, job: 'openSentence', at: [0, 3], steps: [1.0, 2.0, 2.95] },
    exchange: { hp: 0.69, job: 'exchange', at: [2, 3], steps: [1.0, 1.75] },
    law: { hp: 0.69, job: 'contracting', at: [0, 2], steps: [0.8, 2.4] },
    weapon: { hp: 0.34, at: [0, 6], steps: [0.6] },
    verdicts: { hp: 0.34, job: 'verdicts', at: [2, 6], steps: [1.0, 1.8] },
    crownfall: { hp: 0.34, job: 'crownfall', at: [0, 5], steps: [1.0, 1.75] },
    silence: { hp: 0.34, job: 'silence', at: [1, 6], steps: [1.0, 2.1, 3.0] },
    command: { hp: 0.34, job: 'lastCommand', at: [0, 12.3], steps: [1.2, 2.5, 6.0, 7.2] },
    end: { hp: 0.34, kill: true, at: [0, 6], steps: [1.3, 3.2, 4.4, 6.0] },
  },
  pale: {
    rest: { hp: 1, at: [0, 6], steps: [0.6] },
    lash: { hp: 1, job: 'nerveLash', at: [0, 6], steps: [0.9, 1.3, 1.7] },
    thought: { hp: 1, job: 'intrusive', at: [2, 6], steps: [1.0, 2.1] },
    tide: { hp: 1, job: 'tide', at: [0, 6], steps: [0.8, 1.7, 2.6] },
    conductor: { hp: 1, job: 'conductor', at: [0, 6], steps: [1.0, 4.4] },
    split: { hp: 0.69, hold: 0.4, at: [0, 6], steps: [0.6, 1.8, 3.4] },
    lie: { hp: 0.69, job: 'lieAlone', at: [1, 6], steps: [1.2] },
    fa: { hp: 0.69, job: 'falseAwakening', at: [1, 6], steps: [0.9, 1.5] },
    recur: { hp: 0.69, job: 'recurring', at: [2, 5], steps: [1.0, 2.6, 4.6] },
    stitch: { hp: 0.69, job: 'stitch', at: [1, 6], steps: [0.9, 1.8, 3.0] },
    sever: { hp: 0.69, job: 'sever', at: [0, 6], steps: [1.0, 3.0] },
    wake: { hp: 0.34, hold: 0.5, at: [0, 6], steps: [0.4, 1.4, 3.0] },
    pre: { hp: 0.34, job: 'premonition', at: [0, 6], steps: [1.2, 2.2, 3.4] },
    memory: { hp: 0.34, job: 'memory', at: [-4, 6], steps: [0.8, 2.0] },
    collapse: { hp: 0.34, job: 'collapse', at: [0, 6], steps: [1.0, 2.1] },
    name: { hp: 0.14, at: [0, 6], steps: [1.6, 5.0] },
    end: { hp: 0.34, kill: true, mem: { bare: true }, at: [0, 6], steps: [1.0, 2.6, 4.0, 5.3] },
  },
};
(async () => {
  const floor = +process.argv[2], id = process.argv[3], want = (process.argv[4] || '').split(',').filter(Boolean);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  // (the dice seeded, so two builds play a scene alike; TAG names the pictures)
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 9001);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const S = SCENES[id], names = want.length ? want : Object.keys(S);
  for (const nm of names) {
    const sc = S[nm];
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(q => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = q; }, 2);
    await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
    // freeze the real-time loop while we step: the game is advanced only by hand
    await page.evaluate(([sc, id]) => {
      const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C; window.__hold = G.update; G.update = () => {};
      const step = s => { for (let i = 0; i < s * 60; i++) { window.__hold(1 / 60); M.gap = 99; me.hp = D.ST.hp; } };
      step(5); const m = D.g.boss; if (sc.hp < 1) { m.hp = m.maxhp * sc.hp; step(sc.hold == null ? 4.5 : sc.hold); }
      M.job = null; FD.S.hz.length = 0; M.vfx = []; me.x = C.x + sc.at[0]; me.y = C.y + sc.at[1];
      if (sc.job) { const J = window.__pp.FIEND_DEFS[id]._t[sc.job](FD.FX, m, {}); J.name = sc.job; M.job = J; }
      if (sc.mem) Object.assign(M, sc.mem);
      if (sc.kill) { m.hp = 5; m.stunT = 1; FD.FX.H.hitMon(m, 1e7, {}); }
      window.__step = step; window.__t = 0;
    }, [sc, id]);
    for (let i = 0; i < sc.steps.length; i++) {
      await page.evaluate(t => { const d = t - window.__t; window.__step(d); window.__t = t; }, sc.steps[i]);
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.resolve(__dirname, `../shots/scene-${process.env.TAG ? process.env.TAG + '-' : ''}${id}-${nm}-${i}.png`) });
    }
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__hold; window.__pp.closeArcade && window.__pp.closeArcade(true); });
    await page.waitForTimeout(200);
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
