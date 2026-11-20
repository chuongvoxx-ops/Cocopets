// v430 PF: the same-page A/B table (tests/_pf-same.js logs: one JSON line per case) as markdown.
// usage: node tests/_pf-abtable.js "crowd=ab-0.log" "hall=ab-1.log" ...
const fs = require('fs');
const pct = (a, b) => a > 0 ? `${b / a < 1 ? '−' : '+'}${Math.abs(100 * (b / a - 1)).toFixed(0)}%` : '';
let out = '| scenario | case | frame ms v429 → v430 | FGFX ms (passes, composites incl. GL read-back) | composites / frame | composite area Mpx | GPU fill Mpx | quads | same frame: px > 8 levels apart (max) | control (old painter redrawn) |\n|---|---|---|---|---|---|---|---|---|---|\n';
for (const arg of process.argv.slice(2)) { const [name, file] = arg.split('=');
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) { const m = line.match(/^([a-z]+) (\{.*\})$/); if (!m) continue; let J; try { J = JSON.parse(m[2]); } catch (e) { continue; }
    const a = J.ab.v429, b = J.ab.v430, s = J.same;
    out += `| ${name} | ${m[1]} | ${a.tot.toFixed(0)} → ${b.tot.toFixed(0)} (${pct(a.tot, b.tot)}) | ${a.fgMs.toFixed(0)} → ${b.fgMs.toFixed(0)} (${pct(a.fgMs, b.fgMs)}) | ${a.comp} → ${b.comp} | ${a.compMpx.toFixed(2)} → ${b.compMpx.toFixed(2)} (${pct(a.compMpx, b.compMpx)}) | ${a.fill.toFixed(2)} → ${b.fill.toFixed(2)} (${pct(a.fill, b.fill)}) | ${a.quads.toFixed(0)} → ${b.quads.toFixed(0)} | ${s.n8} (${s.max}) | ${s.ctrl8 != null ? `${s.ctrl8} (${s.ctrlMax})` : '–'} |\n`; } }
process.stdout.write(out);
