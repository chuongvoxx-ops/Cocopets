// v468b: walk into the Gemini Gate's sanctum with the keyboard (no teleport), from the checkpoint and after the puzzle's open
// usage: HTML=test.html node tests/_gg-walk.js
const { open } = require('./_gp-lib.js');
(async () => {
  const H = await open({ gl: !!process.env.GL }); const { page, ev, M, errors } = H; let bad = 0;
  await M(() => { const P = window.__pp, r = P.riftState(); r.gck = { sepulchre: 1 }; });
  await H.start();
  let r = await ev(`return { phase: S.phase, x: +me.x.toFixed(2), y: +me.y.toFixed(2) };`); console.log('start', JSON.stringify(r));
  await M(() => { window.__pp.arc.paused = false; });
  const trace = [];
  for (const k of ['ArrowUp']) { await page.keyboard.down(k);
    for (let i = 0; i < 24; i++) { await page.waitForTimeout(400); trace.push(await ev(`return [+me.x.toFixed(2), +me.y.toFixed(2), S.phase, me.vy ? +me.vy.toFixed(2) : 0];`)); if (trace[trace.length - 1][2] === 'boss') break; }
    await page.keyboard.up(k); }
  console.log('trace', JSON.stringify(trace));
  r = await ev(`const G = D.M.G, MW = D.M.MW, row = y => { let s = ''; for (let x = 17; x <= 26; x++) s += G[y * MW + x]; return s; }; const out = {}; for (let y = 24; y <= 33; y++) out[y] = row(y) + ' ' + [17,18,19,20,21,22,23,24,25,26].map(x => D.M.props.get(y * MW + x) ? 'P' : '.').join(''); return { phase: S.phase, rows: out };`);
  console.log(JSON.stringify(r, null, 1));
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowDown');
  const after = await ev(`return { y: +me.y.toFixed(2), phase: S.phase, sealed: [[20, 27], [21, 27], [22, 27]].map(([x, y]) => D.M.G[y * D.M.MW + x]).join(''), gb: !!(window.GEMINI_BOSS && GEMINI_BOSS.active()) };`);
  console.log('inside', JSON.stringify(after));
  const ok = r.phase === 'boss' && after.gb && after.y < 26.9 && after.y > 3; console.log(ok ? 'WALK OK' : 'WALK FAIL', 'errors', errors.slice(0, 3)); await H.browser.close(); process.exit(ok ? 0 : 1);
})();
