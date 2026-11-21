// v435 SB: static checks on the boss file: syntax, no debug hook text in production source, only existing painter kinds (every
// Q.quad kind in 20zza2 must be one the FGFX shader already draws), no red in its tells' colours, the hooks it calls exist in
// 20g4 / 02f5 (untouched). usage: node tests/_sb-static.js
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const R = f => fs.readFileSync(path.resolve(__dirname, '..', 'src', 'js', f), 'utf8');
let fails = 0; const ok = (c, m, v) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) fails++; };
const F0 = '20zza2-aries-samael-boss.js';
let good = true; try { execSync('node --check ' + path.resolve(__dirname, '..', 'src', 'js', F0)); } catch (e) { good = false; } ok(good, `node --check ${F0}`);
const B = R(F0), FX = R('20k6h-fire-nidhogg-moves.js');
ok(!B.includes('_' + '_pp'), 'no debug hook text in the boss file');
const kinds = [...new Set([...B.matchAll(/Q\.quad\((\d+),/g)].map(m => +m[1]))].sort((a, b) => a - b);
const has = k => new RegExp(`// ${k} |v_k < ${k}\\.5|v_k > ${k - 1}\\.5`).test(FX);
ok(kinds.length > 0 && kinds.every(has), 'only existing painter kinds', kinds);
ok(!/GLM\.(mat|addMat|material)/.test(B), 'no new GLM materials');
const reds = [...B.matchAll(/#([0-9A-Fa-f]{6})\b/g)].map(m => m[1]).filter(h => { const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return r > 150 && g < 110 && b < 110; });
ok(!reds.length, 'no red in its colours', reds);
const M = R('20g4-samael-moves.js'), G = R('02f5-samael-model.js');
ok(/return \{ create, CFG, UT, BIG, poseFor, easePose, ultPose[ ,}]/.test(M) /* (v444 SL: pawEv may follow) */ && /drawFxList, drawWrath, bodyLight, slashOf, impactFx, waveFx/.test(M), '20g4: the hooks it calls are there (poseFor, easePose, ultPose, UT, create: bodyLight, slashOf, impactFx)');
ok(/idlePose, life, gait, footfalls, springs, motion/.test(G) && /drawAnima/.test(G), '02f5: idlePose, footfalls, springs, drawAnima are there');
ok(!/v435 SB/.test(M) && !/v435 SB/.test(G) && !/v435 SB/.test(R('20zza-rift-gate-aries.js')), '20g4, 02f5 and the gate (20zza) untouched by this release');
console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
