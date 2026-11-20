// v434 PO: the same-page A/B table (tests/_po-same.js writes shots/v434-PO/same-<tag>.json) as markdown.
// usage: node tests/_po-abtable.js "dunes=shots/v434-PO/same-s0.json" "crowd=shots/v434-PO/same-s1c.json" ...
const fs = require('fs');
const pct = (a, b) => a > 0 ? ` (${b / a < 1 ? '−' : '+'}${Math.abs(100 * (b / a - 1)).toFixed(0)}%)` : '';
let out = '| scenario | case | frame ms v433 → v434 | FGFX ms (passes incl. GL copy) | GLM ms | canvas resizes / frame | composite area Mpx | GPU fill submitted Mpx | heap kB / frame | same frame: px > 8 levels apart (max) | control (v433 redrawn) |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const arg of process.argv.slice(2)) { const [name, file] = arg.split('='); const J = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [cs, R] of Object.entries(J)) { const a = R.ab.v433, b = R.ab.v434, s = R.same;
    out += `| ${name} | ${cs} | ${a.tot.toFixed(0)} → ${b.tot.toFixed(0)}${pct(a.tot, b.tot)} | ${a.fgMs.toFixed(0)} → ${b.fgMs.toFixed(0)}${pct(a.fgMs, b.fgMs)} | ${a.glmMs.toFixed(0)} → ${b.glmMs.toFixed(0)}${pct(a.glmMs, b.glmMs)} | ${a.resize} → ${b.resize} | ${a.compMpx.toFixed(2)} → ${b.compMpx.toFixed(2)}${pct(a.compMpx, b.compMpx)} | ${a.fill.toFixed(2)} → ${b.fill.toFixed(2)} | ${a.heapKB} → ${b.heapKB} | ${s.n8} (${s.max}) | ${s.ctrl8} (${s.ctrlMax}) |\n`; } }
process.stdout.write(out);
