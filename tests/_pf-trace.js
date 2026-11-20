// v430 PF: where the per-frame Canvas2D allocations come from (gradients, patterns, canvases made each frame), by the page's
// line, mapped back to the source file. usage: HTML=test-pf.html STAGE=0 ULT=sunflare node tests/_pf-trace.js
const { open } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
(async () => {
  const html = process.env.HTML || 'test.html', T = await open({ html }); const { page, errors, start, frames } = T;
  await start(+(process.env.STAGE || 0));
  await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 120; k++) G.update(1 / 60); const me = D.me; D.mons.filter(m => !m.boss && !m.dead).slice(0, 16).forEach((m, i) => Object.assign(m, { x: me.x + Math.cos(i) * 3, y: me.y + 2 + Math.sin(i) * 2, hp: 1e9, maxhp: 1e9, aggro: true })); });
  await frames(3, { prof: false });
  const run = async label => { await page.evaluate(() => { window.__PFC.trace = {}; }); await frames(6, { prof: false }); const tr = await page.evaluate(() => { const t = window.__PFC.trace; window.__PFC.trace = null; return t; });
    const lines = fs.readFileSync(path.resolve(__dirname, '..', html), 'utf8').split('\n'), srcs = fs.readdirSync(path.resolve(__dirname, '../src/js')).map(f => [f, fs.readFileSync(path.resolve(__dirname, '../src/js', f), 'utf8')]);
    console.log('\n' + label + ' (per frame)');
    for (const [k, n] of Object.entries(tr).sort((a, b) => b[1] - a[1]).slice(0, 25)) { const ln = +k.split(' ')[1], text = (lines[ln - 1] || '').trim().slice(0, 80), f = srcs.find(([, s]) => text.length > 20 && s.includes(text)); console.log(`  ${(n / 6).toFixed(1).padStart(6)}  ${k.padEnd(40)} ${f ? f[0] : '?'}  ${text.slice(0, 60)}`); } };
  await run('stage ' + (process.env.STAGE || 0));
  if (process.env.ULT) { await page.evaluate(u => { const P = window.__pp, D = P.arc.game._dbg; const el = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' }[u]; D.me.mp = 999; D.g.cdU = 0; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); for (let k = 0; k < 150; k++) P.arc.game.update(1 / 60); }, process.env.ULT); await run(process.env.ULT); }
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
