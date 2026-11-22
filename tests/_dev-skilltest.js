// v451 K: the developer's skill tester (Developer tools > Skill tester): pick any Strong/Strong 2/Ultimate for the lead pet,
// set its stage, free casts, try it in the Tower; picking turns on "Unlock all skills (dev)"; "Back to its own skills".
// HTML=<test build> node tests/_dev-skilltest.js   (SHOT=dir: screenshots of the panel)
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(process.env.HTML || path.resolve(__dirname, '..', 'test.html')));
  await page.waitForFunction(() => window.__pp, null, { timeout: 20000 }); await page.evaluate(() => window.__pp.quickStart('Kay')); await page.waitForTimeout(400);
  let r = await page.evaluate(() => { const P = window.__pp; P.st.devMoves = false; P.openDev(); const sels = [...document.querySelectorAll('select[data-dev-skill]')]; return { n: sels.length, opts: sels.map(s => s.options.length), dis: sels.map(s => s.disabled), sec: !!document.querySelector('[data-go="dev-try"]') }; });
  ok(r.n === 3 && r.opts.every(n => n > 50) && r.sec, 'the panel: three pickers (Strong, Strong 2, Ultimate) with every pool, a Try button', r);
  if (process.env.SHOT) { await page.evaluate(() => document.querySelector('.dev-sk').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300); await page.screenshot({ path: process.env.SHOT + '/panel.png' }); }
  // pick an Ultimate through the select, as a player would
  r = await page.evaluate(() => { const P = window.__pp, s = document.querySelector('select[data-dev-skill="ult"]'), want = [...s.options].map(o => o.value).find(v => /^e:fire:/.test(v) && /apocalypse|snakeflame/.test(v)) || s.options[5].value; s.value = want; s.dispatchEvent(new Event('change')); const k = P.dun.petKit(P.st).kit; return { want, got: k.ult.id, devMoves: P.st.devMoves, sel: document.querySelector('select[data-dev-skill="ult"]').value }; });
  ok(r.got === r.want && r.devMoves && r.sel === r.want, 'picking an Ultimate equips it on the lead pet and turns on the developer unlock', r);
  r = await page.evaluate(() => { const P = window.__pp, s = document.querySelector('select[data-dev-skill="strong"]'), want = [...s.options].map(o => o.value).find(v => /^e:water:/.test(v)); s.value = want; s.dispatchEvent(new Event('change')); return { want, got: P.dun.petKit(P.st).kit.strong.id }; });
  ok(r.got === r.want, 'picking a Strong attack equips it', r);
  // stage buttons: Celestial, then Strong 2 opens
  r = await page.evaluate(() => { const P = window.__pp; document.querySelector('[data-go="dev-jump"][data-n="7"]').click(); const s2 = document.querySelector('select[data-dev-skill="strong2"]'); const want = [...s2.options].map(o => o.value).find(v => /^e:thunder:/.test(v)); s2.value = want; s2.dispatchEvent(new Event('change')); const k = P.dun.petKit(P.st).kit; return { stage: P.st.stage, dis: s2.disabled, want, got: k.strong2 && k.strong2.id, ultTier: k.ult.tier }; });
  ok(r.stage === 7 && !r.dis && r.got === r.want && r.ultTier === 2, 'Celestial (stage 7): Strong 2 opens and takes a pick, the Ultimate in its Celestial form', r);
  // free casts in the Tower
  await page.evaluate(() => { const P = window.__pp; document.querySelector('[data-go="dev-free"]').click(); P.st.unlockAll = true; document.querySelector('[data-go="dev-try"]').click(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2500);
  r = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, me = D.me; D.g.intro = 0; D.g.bossIntro = 0; const mp0 = me.mp; D.useUlt(); const cd1 = D.g.cdU; await new Promise(r => setTimeout(r, 600)); return { free: P.st.devFree, mp0, mp: me.mp, max: D.ST.mp, cd1, cd: D.g.cdU, ult: D.KITR ? D.KITR.ult.name : null }; });
  ok(r.free && r.cd === 0 && Math.abs(r.mp - r.max) < 1e-6, 'free casts: after an Ultimate the cooldown is 0 and MP full again', r);
  await page.waitForTimeout(4000);
  await page.evaluate(() => { const P = window.__pp; if (P.closeArcade) P.closeArcade(true); P.openDev(); document.querySelector('[data-go="dev-skclear"]').click(); });
  r = await page.evaluate(() => { const P = window.__pp, k = P.dun.petKit(P.st).kit; return { ult: k.ult.id, own: P.skillsK.petSkills(P.st).ult.id, deck: P.st.deck }; });
  ok(r.ult === r.own, '"Back to its own skills" puts the pet\'s own skills back', r);
  r = await page.evaluate(() => { const P = window.__pp, o = JSON.parse(JSON.stringify(P.st)); const s = P.sanitize ? P.sanitize(o) : o; return { free: s.devFree, moves: s.devMoves }; });
  ok(r.free === true && r.moves === true, 'the switches are kept in the save', r);
  ok(errors.length === 0, 'no page errors', errors.slice(0, 3));
  console.log(bad ? `${bad} FAILED` : 'ALL OK'); await b.close(); process.exit(bad ? 1 : 0);
})();
