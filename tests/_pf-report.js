// v430 PF: the before / after table from two tests/_pf-frame.js runs (OUT=... json each), as markdown.
// usage: node tests/_pf-report.js before-crowd.json,before-hall.json after-crowd.json,after-hall.json > table.md
const fs = require('fs');
const [A, B] = process.argv.slice(2).map(L => { const o = { scen: {} }; for (const f of L.split(',')) Object.assign(o.scen, JSON.parse(fs.readFileSync(f, 'utf8')).scen); return o; });   /* (each side: a comma list of runs, one scenario or more each) */
const f1 = v => v == null || isNaN(v) ? '–' : v >= 100 ? v.toFixed(0) : v.toFixed(1), mp = v => v == null ? '–' : (v / 1e6).toFixed(2), r = (a, b) => a > 0 ? ` (${b / a < 1 ? '−' : '+'}${Math.abs(100 * (b / a - 1)).toFixed(0)}%)` : '';
const COLS = [['frame avg ms', s => s.tot, f1, 1], ['median', s => s.med, f1, 1], ['p99', s => s.p99, f1, 1], ['worst', s => s.worst, f1, 1], ['update', s => s.upd, f1], ['FGFX ms', s => s.fgMs, f1, 1], ['flushes', s => s.fgFlush, f1], ['composites', s => s.fgComp, f1], ['composite Mpx', s => s.diGLA, mp, 1], ['GPU fill Mpx', s => s.fgFill, mp, 1], ['quads', s => s.fgQuads + s.fgSmoke, f1], ['GL draws', s => s.glDraw, f1], ['GLM layers / ms', s => s.glmN, (v, s) => `${f1(v)} / ${f1(s.glmMs)}`], ['2D drawImage (Mpx)', s => s.di, (v, s) => `${f1(v)} (${mp(s.diA)})`], ['gradients', s => s.grad, f1], ['canvases made', s => s.cvNew, f1], ['heap growth kB', s => s.heapPos / 1e3, f1]];
let out = '';
for (const sc of Object.keys(B.scen)) { const a = A.scen[sc], b = B.scen[sc]; if (!a) continue;
  out += `\n### ${sc} — ${b.info.name || ''} (canvas ${b.cv ? b.cv.join('×') : '?'}, ${b.info.mons} monsters)\n\n| | ${COLS.map(c => c[0]).join(' | ')} |\n|${'---|'.repeat(COLS.length + 1)}\n`;
  const rows = [['normal play', a.base, b.base]].concat(Object.keys(b.ults).filter(u => a.ults[u]).map(u => [u, a.ults[u].busy, b.ults[u].busy]));
  for (const [nm, x, y] of rows) for (const [tag, s, o] of [['v429', x, null], ['v430', y, x]]) out += `| ${nm} ${tag} | ${COLS.map(([, g, fm, rel]) => { const v = g(s); return fm(v, s) + (o && rel ? r(g(o), v) : ''); }).join(' | ')} |\n`;
  out += `\nFirst frames of each cast (avg / worst ms, shader compiles): ${Object.keys(b.ults).filter(u => a.ults[u]).map(u => `${u} v429 ${f1(a.ults[u].first.tot)} / ${f1(a.ults[u].first.worst)} (${a.ults[u].compiles.length}), v430 ${f1(b.ults[u].first.tot)} / ${f1(b.ults[u].first.worst)} (${b.ults[u].compiles.length})`).join('; ')}\n`;
  const pr = (s) => Object.entries(s.pr || {}).sort((p, q) => q[1] - p[1]).slice(0, 7).map(([k, v]) => `${k} ${f1(v)}`).join(', ');
  out += `\nPer-stage breakdown (ms, the engine's g.prof pieces, each synced):\n\n${rows.map(([nm, x, y]) => `- ${nm}: v429 ${pr(x)} · v430 ${pr(y)}`).join('\n')}\n`; }
process.stdout.write(out);
