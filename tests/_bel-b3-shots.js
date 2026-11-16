// Kharrox the Bellback (worker B3): GPU screenshots at phone size (390 x 844, DPR 1): idle, the Bell Sweep's tell, the Tolling
// ring, the fall; then a contact sheet. The game is stepped to each moment without drawing (a software rasteriser on a busy
// machine can take many seconds a GPU frame), then one frame is drawn and shot.
// Writes shots/bel-b3-{idle,sweep,toll,fall}.png, shots/bel-b3-sheet.png (and bel-b3-close-*.png: the model up close).
// usage: HTML=test-belB3.html node tests/_bel-b3-shots.js     env: GL=0 for the 2D fallback (files bel-b3-2d-*), CLOSE=0
const { openBel } = require('./_bel-b3-lib');
const { execFileSync } = require('child_process');
const path = require('path');
(async () => {
  const GL = process.env.GL !== '0', pre = GL ? '' : '2d-';
  const T = await openBel({ gl: false }); const { errors, ev, shot } = T;   // (the GPU is switched on only for each shot)
  await T.start();
  const STEP = `window.__BELK_GL = 0; window.__NG_GL = 0; const step = s => { for (let i = 0; i < s / 0.05; i++) { U.update(0.05); me.hp = D.ST.hp; } };`;
  const settle = `D.banners.length = 0; if (${GL}) { window.__BELK_GL = 1; window.__NG_GL = 1; } await frame(); await frame();`;
  // through the intro and the rise; the crab stands near the font, the pet south of it
  await ev(STEP + `D.g.taps = 9; step(1); for (let i = 0; i < 400 && b.act !== 'fight'; i++) step(0.05);
    b.x = FX.C.x + 0.3; b.y = FX.C.y - 3.2; M.loco = null; DEF.BELK.test.endAct(FX, b); M.idleT = 99; me.x = FX.C.x - 1.4; me.y = FX.C.y + 2.6; me.vx = me.vy = 0; step(2.2);`, { gl: GL });
  const pose = `me.x = FX.C.x - 1.4; me.y = FX.C.y + 2.6; me.vx = me.vy = 0;`;
  if (process.env.CLOSE !== '0') { await ev(`window.__BELK_CAM = 1.25; ` + STEP + `step(0.6); ` + settle); await shot(pre + 'close-idle'); }
  await ev(`window.__BELK_CAM = 0; ` + STEP + pose + ` step(1.2); ` + settle); await shot(pre + 'idle');
  await ev(STEP + `M.idleT = 99; DEF.force(FX, 'sweep'); ${pose} for (let i = 0; i < 120 && !(M.A && M.A.phase === 'wind' && M.A.t > 1.6); i++) { step(0.05); ${pose} } ` + settle); await shot(pre + 'sweep');
  if (process.env.CLOSE !== '0') { await ev(`window.__BELK_CAM = 1.1; ` + STEP + `step(0.45); ${pose} ` + settle); await shot(pre + 'close-sweep'); await ev(`window.__BELK_CAM = 0;`); }
  await ev(STEP + `for (let i = 0; i < 120 && M.A; i++) step(0.05); M.idleT = 99; DEF.force(FX, 'toll'); ${pose} for (let i = 0; i < 200; i++) { step(0.05); ${pose} const z = FX.S.hz.find(q => q.kind === 'belkRing'); if (z && z.r > 5.2) break; } ` + settle); await shot(pre + 'toll');
  await ev(STEP + `for (let i = 0; i < 120 && M.A; i++) step(0.05); ${pose} D.hitMon(b, 1e12, { flat: true, pierce: true }); step(2.6); ` + settle); await shot(pre + 'fall');
  if (process.env.CLOSE !== '0') { await ev(`window.__BELK_CAM = 1.0; ` + STEP + `step(0.8); ` + settle); await shot(pre + 'close-fall'); }
  console.log('gl', JSON.stringify(await ev(`return DEF.MODEL.__dbg.glStats;`))); console.log('errors', JSON.stringify(errors.slice(0, 5)));
  await T.browser.close();
  const S = path.resolve(__dirname, '../shots');
  const py = `import sys\nfrom PIL import Image, ImageDraw\nS='${S}/'\nn=['idle','sweep','toll','fall']\nims=[Image.open(S+'bel-b3-${pre}'+k+'.png').convert('RGB') for k in n]\nw,h=ims[0].size\nsh=Image.new('RGB',(w*4+30,h+28),(16,20,24))\nfor i,(im,k) in enumerate(zip(ims,n)):\n  sh.paste(im,(i*(w+10),28)); ImageDraw.Draw(sh).text((i*(w+10)+6,8),'Kharrox: '+k+(' (2D)' if '${pre}' else ' (GPU)'),fill=(190,252,244))\nsh.save(S+'bel-b3-${pre}sheet.png'); print(sh.size)`;
  console.log(execFileSync('python3', ['-c', py]).toString().trim());
  process.exit(errors.length ? 1 : 0);
})();
