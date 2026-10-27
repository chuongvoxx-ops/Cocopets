// The Starseed Conservatory (Virgo gate): one of each seed in every row and column; clashes refused; weevils eat
// sprouts; three by three, then four by four
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library'] }); const { page, errors, shot, start, run } = T;
  const M = (f, a) => page.evaluate(f, a);
  await start('library', 'gate'); await run(2.6);
  let r = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; return { n: S.n, beds: S.beds.length, ward: S.beds.filter(b => b.ward).length }; });
  ok(r.n === 3 && r.beds === 9 && r.ward === 3, 'round one: nine beds, three warded ' + JSON.stringify(r)); await shot('lib-gate-a');
  const visit = (x, y) => M(async ([x, y]) => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 6; i++) { D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); } D.me.x = x; D.me.y = y + 3; for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r)); }, [x, y]);
  const basket = i => M(i => { const mk = window.__pp.arc.game._dbg.M.marks; const p = mk[String(i + 1)][0]; return [p.x, p.y]; }, i);
  // a clash is refused
  const clash = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S, w = S.beds.find(b => b.ward), b = S.beds.find(q => q.s == null && q.r === w.r); return { s: w.s, x: b.x, y: b.y }; });
  let bk = await basket(clash.s); await visit(bk[0], bk[1]); await visit(clash.x, clash.y);
  r = await M(([x, y]) => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S, b = S.beds.find(q => Math.hypot(q.x - x, q.y - y) < 0.1); return { s: b.s, red: b.red > 0, carry: S.carry }; }, [clash.x, clash.y]);
  ok(r.s == null && r.red && r.carry != null, 'a seed that would clash in its row is refused (red cross) ' + JSON.stringify(r));
  // solve a round: fill every empty bed with a seed that completes a Latin square
  const solve = async () => { const plan = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S, n = S.n, grid = Array.from({ length: n }, () => Array(n).fill(null)); for (const b of S.beds) grid[b.r][b.c] = b.s;
      const okAt = (r, c, s) => grid[r].every((v, j) => j === c || v !== s) && grid.every((row, i) => i === r || row[c] !== s);
      const cells = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] == null) cells.push([r, c]);
      const bt = k => { if (k >= cells.length) return true; const [r, c] = cells[k]; for (let s = 0; s < n; s++) if (okAt(r, c, s)) { grid[r][c] = s; if (bt(k + 1)) return true; grid[r][c] = null; } return false; };
      bt(0); return cells.map(([r, c]) => { const b = S.beds.find(q => q.r === r && q.c === c); return [b.x, b.y, grid[r][c]]; }); });
    for (const [x, y, s] of plan) { const p = await basket(s); await visit(p[0], p[1]); await visit(x, y); } };
  await M(() => { window.__pp.arc.game._dbg.RIFT.self.mod.S.spawnT = 99; });
  await solve(); await run(0.4);
  r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.S.round); ok(r === 1, 'every row and column holds one of each: the beds bloom, round two');
  await run(2.0);
  r = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; return { n: S.n, beds: S.beds.length, ward: S.beds.filter(b => b.ward).length }; });
  ok(r.n === 4 && r.beds === 16 && r.ward === 6, 'round two: sixteen beds, a fourth seed ' + JSON.stringify(r));
  // a weevil eats one of your sprouts
  { const b = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S, n = S.n, b = S.beds.find(q => q.s == null); const used = new Set(S.beds.filter(q => q.s != null && (q.r === b.r || q.c === b.c)).map(q => q.s)); let s = 0; while (used.has(s)) s++; return [b.x, b.y, s]; });
    const p = await basket(b[2]); await visit(p[0], p[1]); await visit(b[0], b[1]);
    r = await M(async ([x, y]) => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, bed = S.beds.find(q => Math.hypot(q.x - x, q.y - y) < 0.1); const had = bed.s; const m = D.X.spawnMon('weevil', x + 2, y, { pack: 960, rift: true, aggro: true }); S.weevils.push(m); D.me.x = x + 8; D.me.y = y + 6; for (let i = 0; i < 300 && bed.s != null; i++) await new Promise(r => requestAnimationFrame(r)); D.hitMon(m, 1e9, { flat: true }); return { had, now: bed.s }; }, b);
    ok(r.had != null && r.now == null, 'a seed weevil crawls to a sprout and eats it ' + JSON.stringify(r)); }
  await shot('lib-gate-b');
  await solve(); await run(0.6);
  r = await T.state(); ok(r.banners.some(b => /VIRGO/.test(b)) || /Virgo/i.test(r.goal), 'four by four in flower: Virgo wakes · ' + r.goal); await shot('lib-gate-c');
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }).catch(() => {}); ok(await page.evaluate(() => window.__pp.arc.state) === 'end', 'the trial ends');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
