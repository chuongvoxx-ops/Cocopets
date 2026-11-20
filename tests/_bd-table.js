// v430 BD: the table of tests/_bd-stats.js runs: HEAD build vs the working build, with ratios (new / HEAD) and the in-run
// ratios (a foe's blow / a trap's blow of the same size).  node tests/_bd-table.js head.json new.json [more pairs...]
const fs = require('fs');
const args = process.argv.slice(2), H = {}, N = {};
for (let i = 0; i < args.length; i += 2) { Object.assign(H, JSON.parse(fs.readFileSync(args[i]))); Object.assign(N, JSON.parse(fs.readFileSync(args[i + 1]))); }
const f = v => (v == null ? '-' : typeof v === 'number' ? (Math.abs(v) >= 100 ? Math.round(v).toString() : (+v.toFixed(3)).toString()) : String(v));
const rat = (a, b) => (a > 0 && b != null ? b / a : null);
const rows = [];
const row = (sc, what, h, n, want) => { if (h == null && n == null) return; const r = rat(h, n); rows.push([sc, what, f(h), f(n), r == null ? '-' : r.toFixed(3), want == null ? '' : want, r == null || want == null ? '' : Math.abs(r - want) < 0.02 * want ? 'ok' : 'FAIL']); };
for (const sc of Object.keys(N)) { if (sc === 'errors') continue; const h = H[sc] || {}, n = N[sc] || {}; const bel = /^bel_/.test(sc);
  if (n.err || h.err) { rows.push([sc, 'error', h.err || '', n.err || '', '', '', 'FAIL']); continue; }
  const wHp = bel ? 3.5 : 1, wDmg = bel ? 2 : 1;
  if ('crawlerMed' in n) {
    row(sc, 'normal crawler maxhp (median on the floor)', h.crawlerMed, n.crawlerMed, wHp);
    if (n.leechMed) row(sc, 'normal leech maxhp (median)', h.leechMed, n.leechMed, wHp);
    row(sc, 'fresh crawler maxhp', h.fresh && h.fresh.maxhp, n.fresh && n.fresh.maxhp, wHp);
    row(sc, 'fresh elite crawler maxhp', h.freshElite && h.freshElite.maxhp, n.freshElite && n.freshElite.maxhp, wHp);
    row(sc, 'monster with stage-set hp 1234', h.freshSet && h.freshSet.maxhp, n.freshSet && n.freshSet.maxhp, wHp);
    row(sc, 'lesser boss (mini) maxhp', h.lesser && h.lesser.maxhp, n.lesser && n.lesser.maxhp, wHp);
    if (n.leaderMed) row(sc, 'pack leader maxhp (median)', h.leaderMed, n.leaderMed, wHp);
    if (n.guard) row(sc, `guardian maxhp (${n.guardName})`, h.guard, n.guard, wHp);
    rows.push([sc, 'after 60 frames: same maxhp (no re-stamp)', f(h.noCompound && h.noCompound.same), f(n.noCompound && n.noCompound.same), '', '', n.noCompound && n.noCompound.same ? 'ok' : 'FAIL']);
    row(sc, 'trap/terrain hit (10)', h.trap, n.trap, 1);
    row(sc, 'contact hit (10, src monster)', h.contact, n.contact, wDmg);
    row(sc, 'monster shot (10, wby monster)', h.shot, n.shot, wDmg);
    row(sc, 'hazard shot (10, no source)', h.hazardShot, n.hazardShot, 1);
    row(sc, 'monster DoT zone tick (40 dps)', h.zone, n.zone, wDmg);
    row(sc, 'hazard DoT zone tick (40 dps)', h.hazardZone, n.hazardZone, 1);
    if (n.guardHit != null) row(sc, 'guardian hit (10, belHard 5)', h.guardHit, n.guardHit, wDmg);
  } else if ('effHp' in n) {
    row(sc, 'boss maxhp (shown bar size)', h.maxhp, n.maxhp, 1);
    rows.push([sc, 'goal line', h.goal, n.goal, '', '', h.goal === n.goal ? 'ok' : '?']);
    row(sc, 'boss effective hp (damage to kill, base armour)', h.effHp, n.effHp, bel ? 3 : 1);
    if (n.throat != null) row(sc, 'throat weak point factor', h.throat, n.throat, bel ? 1 / 3 : 1);
    row(sc, 'trap hit (10)', h.trap, n.trap, 1);
    row(sc, 'boss contact (10, src boss)', h.contact, n.contact, wDmg);
    row(sc, 'fiend FX.hurt (10)', h.fiendHurt, n.fiendHurt, wDmg);
    row(sc, 'fiend tele circle (10)', h.tele, n.tele, wDmg);
    row(sc, 'fiend bullet (10, wby boss)', h.bullet, n.bullet, wDmg);
    row(sc, 'hazard shot (10)', h.hazardShot, n.hazardShot, 1);
    row(sc, 'add crawler maxhp (fresh)', h.add && h.add.maxhp, n.add && n.add.maxhp, wHp);
  } else {
    row(sc, `boss maxhp (${n.boss})`, h.maxhp, n.maxhp, 1);
    row(sc, 'trap hit (10)', h.trap, n.trap, 1);
    row(sc, 'boss contact (10)', h.contact, n.contact, 1);
    row(sc, 'monster contact (10)', h.monHit, n.monHit, 1);
    row(sc, 'monster shot (10, wby monster)', h.monShot, n.monShot, 1);
    row(sc, 'fresh crawler maxhp', h.fresh && h.fresh.maxhp, n.fresh && n.fresh.maxhp, 1);
    rows.push([sc, 'F.rift.foeK', JSON.stringify(h.foeK), JSON.stringify(n.foeK), '', '', n.foeK == null ? 'ok' : 'FAIL']);
  }
}
// re-entry: the second visit's numbers equal the first's
for (const [a, b] of [['bel_d1', 'bel_d1_again'], ['bel_kharrox', 'bel_kharrox_again']]) if (N[a] && N[b]) { const x = N[a], y = N[b];
  const pairs = 'crawlerMed' in x ? [['guard', x.guard, y.guard], ['leaderMed', x.leaderMed, y.leaderMed], ['fresh', x.fresh && x.fresh.maxhp, y.fresh && y.fresh.maxhp]] : [['effHp', x.effHp, y.effHp], ['maxhp', x.maxhp, y.maxhp]];
  for (const [k, u, v] of pairs) rows.push([b, `re-entry: ${k} first / again`, f(u), f(v), u ? (v / u).toFixed(3) : '-', 1, u && Math.abs(v / u - 1) < 0.001 ? 'ok' : 'FAIL']); }
const head = ['scenario', 'measure', 'HEAD', 'v430', 'ratio', 'want', ''];
const w = head.map((_, i) => Math.max(...[head].concat(rows).map(r => String(r[i]).length)));
const line = r => r.map((c, i) => String(c).padEnd(w[i])).join('  ').trimEnd();
console.log(line(head)); console.log(w.map(n => '-'.repeat(n)).join('  '));
for (const r of rows) console.log(line(r));
console.log(`\n${rows.filter(r => r[6] === 'FAIL').length} FAIL of ${rows.length}; page errors HEAD ${JSON.stringify(H.errors || [])} v430 ${JSON.stringify(N.errors || [])}`);
