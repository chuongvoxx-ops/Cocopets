// (v463 SK) where the white wash on Khyros's entry and the pink/cyan band at the bottom of the arena come from: one page with the GPU path
// forced (as _sk-fight), the same frame shot with each layer's switch turned off in turn. -> shots/v463-SK/diag-*.png and a sheet.
const { openSK } = require('./_sk-lib');
const path = require('path');
(async () => {
  const G = await openSK({ gl: true }); const { ev } = G; const shots = [];
  const shot = async (n, cap) => { const f = await G.shot('diag-' + (process.env.SSKY0 ? 'ssky0-' : '') + n); shots.push(`${f}=${cap || n}`); };
  await G.start();
  const info = () => ev(`const g = D.g; return { flash: +(g.flash || 0).toFixed(2), flashC: g.flashC, bossIntro: +(g.bossIntro || 0).toFixed(2), enterT: +(FX && FX.S.enterT || 0).toFixed(2), act: b && b.act, ng: window.__NG_GL, hud: [...document.querySelectorAll('#arcDodge, #arcUlt, .arc-btn, button')].filter(e => e.offsetParent).length };`);
  await ev(`const bb = b || D.M.bossAt; me.x = bb.x + 1; me.y = bb.y + 5; let i = 0; while (!b && i++ < 200) adv(0.05); adv(0.9); for (let k = 0; k < 2; k++) await frame();`);
  console.log('entry', JSON.stringify(await info())); await shot('a-all', 'entry: all on');
  const variants = [['b-sk-off', 'window.__SK_GL = 0; window.__SK_FX = 0;', 'Khyros GPU off'], ['c-sky-off', 'window.__SSKY_GL = 0;', '+ sky GPU off'], ['d-traps-off', 'window.__SEPT_GL = 0;', '+ traps GPU off'], ['e-props-off', 'window.__SEPP_GL = 0; window.__SB_GL = 0;', '+ props, brood GPU off'], ['f-ng-off', 'window.__NG_GL = 0;', '+ FGFX painter off']];
  if (!process.env.QUICK) for (const [n, js, cap] of variants) { await ev(js + ` for (let k = 0; k < 2; k++) await frame();`); console.log(n, JSON.stringify(await info())); await shot(n, 'entry: ' + cap); }
  // a later frame (the band at the bottom), all back on
  await ev(`window.__SK_GL = 1; window.__SK_FX = 1; window.__SSKY_GL = 1; window.__SEPT_GL = 1; window.__SEPP_GL = 1; window.__SB_GL = 1; window.__NG_GL = 1; adv(4); me.x = C.x + 10.6; me.y = C.y + 10.6; adv(0.3); for (let k = 0; k < 2; k++) await frame();`);
  console.log('later', JSON.stringify(await info())); await shot('g-later-all', 'later: all on');
  if (!process.env.QUICK) for (const [n, js, cap] of variants) { await ev(js + ` for (let k = 0; k < 2; k++) await frame();`); console.log(n, JSON.stringify(await info())); await shot('h' + n, 'later: ' + cap); }
  console.log('errors', G.errors.length, G.errors.slice(0, 3));
  require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(G.OUT, process.env.SSKY0 ? 'diag-ssky0-sheet.png' : 'diag-sheet.png'), ...shots], { stdio: 'inherit' });
  await G.browser.close();
})();
