// the path through the game: Tower 1-10 first; floor 10 beaten opens Rift 1; Rift 1 sealed opens floors 11-20; and so on.
// Rifts not built yet are stepped over; nothing reached is shut again. The Rifts list shows the Tower between the rifts.
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 393, height: 852 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await p.waitForFunction(() => window.__pp); await p.evaluate(() => window.__pp.quickStart('Bot'));
  const S = (best, seals, prog) => p.evaluate(([best, seals, prog]) => { const P = window.__pp; P.st.dun.best = best; const RS = P.riftState(); RS.seals = {}; RS.prog = prog || {}; for (const id of seals) RS.seals[id] = 1;
    return { open: Object.fromEntries(['belfry', 'garden', 'colours'].map(id => [id, P.riftOpen(id)])) }; }, [best, seals, prog]);
  // (floor openness, through the Tower tab's own rule)
  const open = n => p.evaluate(n => window.__pp.dunFloorOpen(n), n);
  let r = await S(0, []); ok(await open(1) && !(await open(2)) && !r.open.belfry, 'a new player: floor 1 open, floor 2 not yet, Rift 1 shut', r.open);
  r = await S(9, []); ok(await open(10) && !r.open.belfry, 'floors up to 10 open one by one; Rift 1 still shut before floor 10 is beaten', r.open);
  r = await S(10, []); ok(r.open.belfry && !(await open(11)), 'floor 10 beaten: Rift 1 opens, floor 11 stays shut', { r1: r.open.belfry, f11: await open(11) });
  r = await S(10, ['belfry']); ok(await open(11) && !(await open(21)) && !r.open.garden, 'Rift 1 sealed: floors 11-20 open (one by one), Rift 2 shut till floor 20', { f11: await open(11), garden: r.open.garden });
  r = await S(20, ['belfry']); ok(r.open.garden && !(await open(21)), 'floor 20 beaten: Rift 2 opens; floor 21 waits for its seal', r.open);
  r = await S(90, ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon']); ok(await open(91) && !r.open.colours, 'Rift 9 is not built: Rift 8 sealed opens floors 91-100 too; Rift 10 waits for floor 100', { f91: await open(91), colours: r.open.colours });
  r = await S(100, ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon']); ok(r.open.colours && !(await open(101)), 'floor 100 beaten: Rift 10 opens; floor 101 waits for its seal', r.open);
  r = await S(3, ['belfry', 'garden'], { dunes: 2 }); const d = await p.evaluate(() => window.__pp.riftOpen('dunes')); ok(r.open.belfry && r.open.garden && d, 'an old save keeps what it reached: sealed rifts and a rift with a checkpoint stay open', { ...r.open, dunes: d });
  r = await S(45, []); ok(await open(45) && await open(46) === false && await open(30), 'an old save past the new limits keeps its floors up to its best', { f30: await open(30), f45: await open(45), f46: await open(46) });
  // the Rifts list: Tower blocks between the rifts, in order
  await S(12, ['belfry']); await p.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); }); await p.waitForTimeout(300);
  const L = await p.evaluate(() => [...document.querySelectorAll('#riftInner .rf-grid > .rf-card')].slice(0, 5).map(e => e.querySelector('b').textContent + ' | ' + e.querySelector('small').textContent));
  ok(/Tower floors 1–10 \| Cleared/.test(L[0]) && /Drowned Belfry/.test(L[1]) && /Tower floors 11–20 \| Open · 2\/10/.test(L[2]) && /Garden/.test(L[3]) && /Tower floors 21–30 \| Locked/.test(L[4]), 'the list: Tower 1-10, Rift 1, Tower 11-20, Rift 2, Tower 21-30', L);
  await p.click('[data-rift="tower"][data-n="1"]'); await p.waitForTimeout(300); const tab = await p.evaluate(() => window.__pp.dun.tab); ok(tab === 'dungeon', 'tapping a Tower block opens the Tower', tab);
  ok(!errs.length, 'no page errors', errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await b.close(); process.exit(bad ? 1 : 0); })();
