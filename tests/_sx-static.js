// v445 SB: static checks on the boss file: syntax, no debug hook text in production source, only existing painter kinds (every Q.quad kind
// in 20s2-scorpio-asmodeus-boss.js must be one the FGFX shader already draws: no new shader code), no new GLM materials, no red in its
// tells' colours, the Asmodeus hooks it calls exist in 20g5 / 02f6 (untouched by this release). usage: node tests/_sx-static.js
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const R = f => fs.readFileSync(path.resolve(__dirname, '..', 'src', 'js', f), 'utf8');
let fails = 0; const ok = (c, m, v) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) fails++; };
const F0 = '20s2-scorpio-asmodeus-boss.js';
let good = true; try { execSync('node --check ' + path.resolve(__dirname, '..', 'src', 'js', F0)); } catch (e) { good = false; } ok(good, `node --check ${F0}`);
const B = R(F0), FX = R('20k6h-fire-nidhogg-moves.js');
ok(!B.includes('_' + '_pp'), 'no debug hook text in the boss file');
const kinds = [...new Set([...B.matchAll(/Q\.quad\((\d+),/g)].map(m => +m[1]))].sort((a, b) => a - b);
const has = k => new RegExp(`// ${k} |v_k < ${k}\\.5|v_k > ${k - 1}\\.5`).test(FX);
ok(kinds.length > 0 && kinds.every(has), 'only existing painter kinds', kinds);
ok(!/GLM\.(mat|addMat|material)/.test(B), 'no new GLM materials');
const reds = [...B.matchAll(/#([0-9A-Fa-f]{6})\b/g)].map(m => m[1]).filter(h => { const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return r > 150 && g < 110 && b < 110; });
ok(!reds.length, 'no red in its colours', reds);
const M = R('20g5-asmodeus-moves.js'), G = R('02f6-asmodeus-model.js');
ok(/return \{ create, CFG, UT, BIG, poseFor, easePose, ultPose, strikeE \}/.test(M) && /drawFxList, drawSin, bodyLight, burstFx, waveFx/.test(M), '20g5: the hooks it calls are there (poseFor, easePose, ultPose, strikeE, UT, CFG, create: drawFxList, drawFx, bodyLight, burstFx, waveFx, stop)');
ok(/return \{ toTail, US, usable, warm, ensure, step, release, gpuCount, draw, drawAnima, drawParts/.test(G) && /idlePose, life, footfalls/.test(G) && /homeOf/.test(G), '02f6: toTail, draw, drawAnima, idlePose, footfalls, homeOf, HEIGHT, STRIDE are there');
ok(!/v445 SB/.test(M) && !/v445 SB/.test(G), '20g5 and 02f6 untouched by this release');
ok(/const SCORPIO_BOSS = /.test(B) && /self\.SCORPIO_BOSS = SCORPIO_BOSS/.test(B) && /return \{ begin, active, stop, update, drawGround\(\) \{\}, drawOver\(\) \{\}, cam, goal, hideHud, onBossDeath, TUNE, test \}/.test(B), 'SCORPIO_BOSS: the same contract as ARIES_BOSS');
console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
