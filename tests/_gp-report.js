// v453 GP: the before / after (separate builds) tables from tests/_gp-frame.js runs, with the Drowned Belfry's for reference, as markdown.
// usage: node tests/_gp-report.js before.json after.json belfry.json
const fs = require('fs');
const [B, A, R] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const NAME = { g1: 'S1 Egg Orchard, exploring', g1C: 'S1 Egg Orchard, crowd + traps', march: 'S1 puzzle: Seedling March', orrubel: 'S1 boss: Orrubel', g2: 'S2 Glassless Conservatory, exploring', g2C: 'S2 Conservatory, crowd + traps', starfall: 'S2 puzzle: Falling Nursery', ambrel: 'S2 boss: Ambrel', g3: 'S3 Thorn Walks, exploring', g3C: 'S3 Thorn Walks, crowd + traps', gallery: 'S3 puzzle: Seedshot Gallery', calyx: 'S3 boss: Calyx',
  b1: 'Belfry: Lower Church, exploring', b1C: 'Belfry: Lower Church, crowd', hall: 'Belfry: Hall of Three Tides', storm: 'Belfry: Storm Galleries, crowd', uldroth: 'Belfry boss: Uldroth' };
const f0 = v => v == null || isNaN(v) ? '–' : v >= 100 ? v.toFixed(0) : v.toFixed(1);
const row = (lab, s) => `| ${lab} | ${f0(s.tot)} | ${f0(s.med)} | ${f0(s.p99)} | ${f0(s.worst)} | ${f0((s.diGLr || 0) + (s.glmR || 0))} | ${f0(s.fgFlush)} / ${f0(s.fgLayers)} | ${(s.diGLA / 1e6).toFixed(2)} | ${(s.fgFillV / 1e6).toFixed(2)} | ${f0(s.glmN)} / ${f0(s.glmMs)} | ${f0(s.cvResize)} (${f0(s.cvResizeGLM)}) | ${f0(s.di)} (${(s.diA / 1e6).toFixed(2)}) | ${(s.lighterA / 1e6).toFixed(2)} | ${f0(s.grad)} | ${f0(s.cvNew)} | ${f0(s.x_propPaint || 0)}/${f0(s.x_trapPaint || 0)} | ${f0(s.glCompile)} / ${f0(s.glTex)} | ${f0(s.heapPos / 1e3)} | ${Object.entries(s.pr || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k + ' ' + f0(v)).join(', ')} |`;
const H = '| | frame avg ms | median | p99 | worst | GL copies | FGFX passes / layers laid | GL composite Mpx | GPU fill shaded Mpx | GLM passes / ms | canvas resizes (GLM) | 2D drawImage (Mpx) | lighter Mpx | gradients | canvases made | picture paints (props/traps) | shader compiles / tex uploads | heap+ kB | top pieces (ms) |\n|' + '---|'.repeat(19) + '\n';
let out = '';
for (const sc of Object.keys(B.scen)) { const b = B.scen[sc], a = A.scen[sc]; if (!a) continue; const i = b.info;
  out += `\n#### ${NAME[sc] || sc} (canvas ${i.cv.join('×')} @${i.dpr}, ${i.mons} monsters${i.traps ? ', ' + i.traps + ' traps in reach' : ''}${i.boss && i.fd ? ', ' + i.boss : ''})\n\n` + H;
  out += row('normal play v451a', b.base) + '\n' + row('normal play v453', a.base) + '\n';
  for (const u of Object.keys(b.ults || {})) { if (!a.ults[u]) continue; out += row(u + ' v451a', b.ults[u].busy) + '\n' + row(u + ' v453', a.ults[u].busy) + '\n'; }
  const fc = Object.keys(b.ults || {}).filter(u => a.ults[u]).map(u => `${u} v451a ${f0(b.ults[u].first.tot)} / ${f0(b.ults[u].first.worst)} (${b.ults[u].compiles.length}), v453 ${f0(a.ults[u].first.tot)} / ${f0(a.ults[u].first.worst)} (${a.ults[u].compiles.length})`);
  if (fc.length) out += `\nFirst frames of each cast (avg / worst ms, shader compiles): ${fc.join('; ')}\n`; }
if (R) { out += `\n#### The Drowned Belfry, the same counters and settings (v451a: the reference)\n\n` + H;
  for (const sc of Object.keys(R.scen)) { const r = R.scen[sc]; out += row(NAME[sc] || sc, r.base) + '\n'; for (const u of Object.keys(r.ults || {})) out += row((NAME[sc] || sc) + ', ' + u, r.ults[u].busy) + '\n'; } }
process.stdout.write(out);
