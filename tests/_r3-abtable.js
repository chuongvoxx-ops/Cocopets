// v460 R3: tables from tests/_r3-perf.js runs (markdown): each scenario's avg / p95 / worst frame, GLM passes and canvas
// reallocations, heap a frame, and for the summons the first frames after the cast (the spike) and the busy stretch.
// usage: node tests/_r3-abtable.js label=file.json [label=file.json ...]
const fs = require('fs');
const runs = process.argv.slice(2).map(a => { const i = a.indexOf('='); return [a.slice(0, i), JSON.parse(fs.readFileSync(a.slice(i + 1), 'utf8'))]; });
const p95 = L => { const v = L.slice().sort((a, b) => a - b); return v[Math.min(v.length - 1, Math.floor(v.length * 0.95))]; };
const f0 = x => x == null ? '–' : (+x).toFixed(0), f1 = x => x == null ? '–' : (+x).toFixed(1), f2 = x => x == null ? '–' : (+x).toFixed(2);
const NAME = { d1: 'D1 Buried Road, exploring', d1C: 'D1 Buried Road, crowd + traps', d2: 'D2 Rust Flats, exploring', d2C: 'D2 Rust Flats, crowd + traps', d3: 'D3 Moonlit Barrows, exploring', d3C: 'D3 Moonlit Barrows, crowd + traps', sarrukh: 'Boss 1 Sarrukh', oneira: 'Boss 2 Oneira', thul: 'Boss 3 Thul-Ammon' };
const out = [];
out.push('| scenario | build | avg ms | p95 ms | worst | GLM passes / f | GLM canvas reallocs / f | heap kB / f | monsters alive / awake | traps live / near | upd-only ms (traps) |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|');
const scen = Object.keys(runs[0][1].scen);
for (const sc of scen) for (const [lab, R] of runs) { const S = R.scen[sc]; if (!S) continue; const b = S.base, c = S.census || {};
  out.push(`| ${NAME[sc] || sc} | ${lab} | ${f0(b.tot)} | ${f0(p95(S.baseRows))} | ${f0(b.worst)} | ${f1(b.glmN)} | ${f2(b.cvResizeGLM / 2)} | ${f0(b.heapPos / 1024)} | ${c.alive} / ${c.awake} | ${c.traps} / ${c.trapsNear13} | ${S.upd ? S.upd.updMs + ' (' + S.upd.trapMs + ')' : '–'} |`); }
out.push('');
out.push('| boss + summon | build | first 6 frames after the cast: ms (max) | canvases made in them | busy avg ms | busy p95 | GLM passes / f | GLM canvas reallocs / f | heap kB / f | GL buffer upload kB / f |');
out.push('|---|---|---|---|---|---|---|---|---|---|');
for (const sc of scen) { const any = runs.find(r => r[1].scen[sc] && Object.keys(r[1].scen[sc].ults || {}).length); if (!any) continue;
  for (const u of Object.keys(any[1].scen[sc].ults)) for (const [lab, R] of runs) { const U = R.scen[sc] && R.scen[sc].ults[u]; if (!U) continue; const fr = U.firstRows, B = U.busy;
    out.push(`| ${NAME[sc] || sc} + ${u} | ${lab} | ${fr.map(r => r.tot).join(', ')} (${Math.max(...fr.map(r => r.tot))}) | ${fr.reduce((a, r) => a + r.cvNew, 0)} | ${f0(B.tot)} | ${f0(p95(U.busyRows))} | ${f1(B.glmN)} | ${f2(B.cvResizeGLM / 2)} | ${f0(B.heapPos / 1024)} | ${f0(B.glBufB / 1024)} |`); } }
console.log(out.join('\n'));
