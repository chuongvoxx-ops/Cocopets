// (v475 GM) Gabriel's model without a browser: builds both mesh sets (counts), solves poses (anchors finite, camera independent, petals
// home / free, the forms), checks the pose API's keys never throw. usage: node tests/_gm-model.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = ['20k5uz-gl-mesh.js', '02f7-raziel-model.js', '02f8-gabriel-model.js'].map(f => fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8')).join('\n');
const ctx = { console, Math, Float32Array, Float64Array, Uint16Array, Uint32Array, Int32Array, Set, Map, Object, Array, performance: { now: () => Date.now() } };
vm.createContext(ctx); vm.runInContext(src + '\nthis.G = GABRIEL_GL;', ctx);
const G = ctx.G; let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const t0 = Date.now(); G.step(1e9, true); const tL = Date.now() - t0; G.step(1e9, false); const tF = Date.now() - t0 - tL;
const M = G.meshes(false), ML = G.meshes(true); const cnt = m => { let n = 0, t = 0; for (const k in m) { const v = m[k], f = x => { if (x && x.pos) { n++; t += x.ntri; } }; if (Array.isArray(v)) v.forEach(a => Array.isArray(a) ? a.forEach(f) : f(a)); else f(v); } return [n, t]; };
console.log('build ms full', tF, 'lod', tL, 'meshes/tris full', cnt(M), 'lod', cnt(ML), 'nv', G.nv);
const fin = o => { const bad = []; const walk = (v, p) => { if (typeof v === 'number') { if (!isFinite(v)) bad.push(p); } else if (v && typeof v === 'object') for (const k in v) walk(v[k], p + '.' + k); }; walk(o, ''); return bad; };
for (const ev of [1, 4, 7]) {
  const S = G.idle(ev, 0); S.x = 10; S.y = 10; let a = null;
  for (let f = 0; f < 120; f++) { S.t = f / 60; a = G.solve(200, 300, 220, S, { tile: 70 }); }
  ok(a && a.heart && a.petals.length === 12 && a.slots.length === 12, 'anchors ev ' + ev); ok(fin(a).length === 0, 'finite ev ' + ev + ' ' + fin(a).slice(0, 5));
  // every pose key at once, extremes
  Object.assign(S, { fly: 1.4, speed: 1, bank: 1, dive: -1, wing: 1, wingBeat: 3, beat: 1, wingShape: 'ult', glow: 1, aim: { x: 14, y: 12 }, beakOpen: 1, cry: 1, tailSwish: 1, tailSpread: 1, heartPulse: 1, heartOpen: 1, heartSplit: 1, ringSpin: 4,
    orPose: 'raise1', orSide: 'L', orArmL: { up: 1, fwd: 0.4, el: 1, wr: 0.3, tw: 0.5 }, orHandR: { open: 1, g: 'point' }, orHead: { yaw: 0.4, pitch: 0.3, roll: 0.1 }, orTorso: { lean: 0.2, twist: 0.3, bend: 0.1 }, orStruggle: 1, orGlow: 2, orRise: 1, restraintsOpen: 1, wristOpen: 1, crownOpen: 1, ribbons: 1, haloSpin: 2, haloScale: 1.3, haloTilt: 0.3, enter: 0.6, dissolve: 0.4 });
  S.petals = S.petals.map((p, i) => ({ home: i % 2 ? 0 : 0.5, x: i - 6, y: 2, z: 1.5, ang: i, roll: i, open: i / 11, glow: 1, s: 1.5 }));
  for (let f = 120; f < 240; f++) { S.t = f / 60; a = G.solve(200, 300, 220, S, { tile: 70 }); }
  ok(a && fin(a).length === 0, 'finite all keys ev ' + ev + ' ' + (a ? fin(a).slice(0, 5) : 'null'));
  // a free petal lands where it was sent: home 0 at (x, y, z) tiles from S.x, S.y
  const S2 = G.idle(ev, 0); S2.x = 0; S2.y = 0; S2.petals[3] = { home: 0, x: 2, y: 1, z: 0, ang: 0 }; const b = G.solve(500, 400, 220, S2, { tile: 70, still: true });
  ok(Math.abs(b.petals[3].wx - 2) < 0.02 && Math.abs(b.petals[3].wy - 1) < 0.02 && Math.abs(b.petals[3].wz) < 0.02, 'free petal tiles ' + [b.petals[3].wx, b.petals[3].wy, b.petals[3].wz].map(v => v.toFixed(3)));
  // its root on screen: 2 tiles right, 1 down from the floor point
  const pr = b.petals[3]; const rx = pr.x - (pr.tx - pr.x), ry = pr.y - (pr.ty - pr.y); ok(Math.abs(rx - 640) < 1 && Math.abs(ry - 470) < 1, 'free petal screen ' + rx.toFixed(1) + ',' + ry.toFixed(1));
  // camera independence: a pan moves every anchor by the pan exactly
  const S3 = G.idle(ev, 0), S4 = G.idle(ev, 0); let d = 0; for (let f = 0; f < 60; f++) { S3.t = S4.t = f / 60; const p = G.solve(200, 300, 220, S3, { tile: 70 }), q = G.solve(260, 340, 220, S4, { tile: 70 }); d = Math.max(d, Math.abs(p.heart.x + 60 - q.heart.x), Math.abs(p.wingTipL.y + 40 - q.wingTipL.y), Math.abs(p.handR.x + 60 - q.handR.x)); }
  ok(d < 1e-6, 'pan independence ' + d);
  console.log('ev', ev, 'heart', a.heart.x.toFixed(0), a.heart.y.toFixed(0), 'tips', b.wingTipL.x.toFixed(0), b.wingTipR.x.toFixed(0), 'halo r', b.halo.r.toFixed(0), 'unit', b.unit.toFixed(2));
}
console.log(fails ? 'FAILED ' + fails : 'all ok');
process.exit(fails ? 1 : 0);
