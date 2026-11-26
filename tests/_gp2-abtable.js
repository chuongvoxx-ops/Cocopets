// v459 GP (from v434 PO): the same-page A/B table (tests/_gp2-same.js writes shots/v459-GP/same-<tag>.json) as markdown.
// usage: node tests/_gp2-abtable.js "S2 crowd=shots/v459-GP/same-g2C.json" ...
const fs = require('fs');
const pct = (a, b) => a > 0 ? ` (${b / a < 1 ? '−' : '+'}${Math.abs(100 * (b / a - 1)).toFixed(0)}%)` : '';
let out = '| scenario | case | frame ms v458 → v459 | FGFX ms (passes incl. GL copy) | GLM ms | canvas resizes / frame (of them GLM) | GL copies | 2D drawImage Mpx | lighter Mpx | GL composite Mpx (laid) | same frame: px > 8 levels apart (max) | control (v458 redrawn) |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const arg of process.argv.slice(2)) { const [name, file] = arg.split('='); const J = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [cs, R] of Object.entries(J)) { const a = R.ab.v458, b = R.ab.v459, s = R.same;
    out += `| ${name} | ${cs} | ${a.tot.toFixed(0)} → ${b.tot.toFixed(0)}${pct(a.tot, b.tot)} | ${a.fgMs.toFixed(0)} → ${b.fgMs.toFixed(0)}${pct(a.fgMs, b.fgMs)} | ${a.glmMs.toFixed(0)} → ${b.glmMs.toFixed(0)}${pct(a.glmMs, b.glmMs)} | ${a.resize} (${a.glmResize}) → ${b.resize} (${b.glmResize}) | ${a.copies} → ${b.copies} | ${a.diMpx.toFixed(2)} → ${b.diMpx.toFixed(2)}${pct(a.diMpx, b.diMpx)} | ${a.lighterMpx.toFixed(2)} → ${b.lighterMpx.toFixed(2)}${pct(a.lighterMpx, b.lighterMpx)} | ${a.compMpx.toFixed(2)} → ${b.compMpx.toFixed(2)}${pct(a.compMpx, b.compMpx)} | ${s.n8} (${s.max}) | ${s.ctrl8} (${s.ctrlMax}) |\n`; } }
process.stdout.write(out);
