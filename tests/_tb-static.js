// v429 TB: static checks on the boss file and its hooks: syntax, no debug hook text in production source, only existing painter kinds
// (every Q.quad kind in 20q2 must be one the FGFX shader already draws), no new GLM materials, no red in its colours, the 20g3 hooks
// tagged and additive. usage: node tests/_tb-static.js
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const R = f => fs.readFileSync(path.resolve(__dirname, '..', 'src', 'js', f), 'utf8');
let fails = 0; const ok = (c, m, v) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) fails++; };
const files = ['20q2-taurus-belial-boss.js', '20g3-belial-moves.js', '20q-rift-gate-taurus.js'];
for (const f of files) { let good = true; try { execSync('node --check ' + path.resolve(__dirname, '..', 'src', 'js', f)); } catch (e) { good = false; } ok(good, `node --check ${f}`); }
for (const f of files) ok(!R(f).includes('_' + '_pp'), `no debug hook text in ${f}`);
const B = R('20q2-taurus-belial-boss.js'), FX = R('20k6h-fire-nidhogg-moves.js');
const kinds = [...new Set([...B.matchAll(/Q\.quad\((\d+),/g)].map(m => +m[1]))].sort((a, b) => a - b);
const has = k => new RegExp(`// ${k} |v_k < ${k}\\.5|v_k > ${k - 1}\\.5`).test(FX);
ok(kinds.length > 0 && kinds.every(has), 'only existing painter kinds', kinds);
ok(!/\b(29[4-9])\b/.test(B.replace(/\/\*[\s\S]*?\*\//g, '')) && !/GLM\.(mat|addMat|material)/.test(B), 'no new GLM materials');
const reds = [...B.matchAll(/#([0-9A-Fa-f]{6})\b/g)].map(m => m[1]).filter(h => { const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return r > 150 && g < 110 && b < 110; });
ok(!reds.length, 'no red in its colours', reds);
const G = R('20g3-belial-moves.js'), tags = (G.match(/v429 TB/g) || []).length;
ok(tags >= 5 && /function domParts\(o\)/.test(G) && /S\.o && S\.o\.stand \? 0 : ein\(S\.p4\)/.test(G), '20g3: the boss\'s hooks are tagged and additive (o.stand, o.noPillars, domParts)', { tags });
const Q = R('20q-rift-gate-taurus.js'); ok(!/v429/.test(Q), '20q (the gate) untouched');
console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
