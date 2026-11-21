// v439 SP: Auto quality's stepping (09c-perf-quality.js GQ) against simulated devices in node: each frame's interval comes from a model of
// the device at the level GQ has chosen (so a step's effect shows in the next frames, as on a phone). Checks: no step on a spike or a
// resume gap; sustained slowness steps down one level at a time; a step that did not make frames quicker (a CPU-bound device) is taken
// back and not retried for a minute; the paced 30 fallback only when Performance still cannot hold ~49 fps; steps up only after long
// headroom; held during the benchmark; fixed modes never change. usage: node tests/_sp-gq.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.resolve(__dirname, '../src/js/09c-perf-quality.js'), 'utf8');
let t = 0; const ctx = { window: {}, st: { gq: 'auto' }, performance: { now: () => t }, Math, console, self: {} };
vm.createContext(ctx); vm.runInContext(src + '\nthis.GQ = GQ;', ctx);
const G = ctx.GQ; let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + m); };
/* run secs of play on a device: dev(level) -> [interval ms, JS ms] (at the paced level the interval is at least 33.3) */
const run = (secs, dev) => { const end = t + secs * 1000, seen = [G.level()]; while (t < end) { const L = G.level(); let [iv, js] = dev(L); if (L === 3) iv = Math.max(iv, 33.3); t += iv; G.tick(iv, js, true); if (G.level() !== seen[seen.length - 1]) seen.push(G.level()); } return seen; };
const gpuBound = ms => L => [ms[L], 5];                       // (fewer pixels: quicker frames)
const cpuBound = ms => () => [ms, ms - 2];                    // (the same whatever the resolution)
G.reset(); run(30, gpuBound([16.7, 16.7, 16.7, 16.7])); ok(G.level() === 0, 'a device at 60 fps: stays High');
G.reset(); run(30, () => [t % 10000 < 1000 ? 40 : 16.7, 5]); ok(G.level() === 0, 'one slow second in ten (a spike): stays High');
G.reset(); run(5, () => [2000, 5]); ok(G.level() === 0, 'resume gaps (2 s frames): ignored');
G.reset(); let s = run(20, gpuBound([26, 18, 15, 15])); ok(G.level() === 1, `fill-bound at 38 fps, 55 fps a step lower: one step, kept: ${s.join(' > ')}`);
G.reset(); s = run(30, gpuBound([30, 24, 22, 22])); ok(G.level() === 3, `slow at every resolution: down to Performance, then paced 30: ${s.join(' > ')}`);
s = run(25, gpuBound([30, 24, 14, 14])); ok(G.level() === 3, `paced, light frames for 25 s: not up yet (${s.join(' > ')})`);
s = run(30, gpuBound([30, 24, 14, 14])); ok(G.level() === 2, `light frames for ~50 s in all: up to Performance (${s.join(' > ')})`);
G.reset(); s = run(20, cpuBound(26)); ok(G.level() === 0, `CPU-bound at 38 fps: the lower resolution helped nothing, taken back to High (${s.join(' > ')})`);
s = run(40, cpuBound(26)); ok(G.level() === 0, '... and not retried within the minute');
G.reset(); s = run(12, gpuBound([24, 15, 15, 15])); const s1 = s.join(' > '); s = run(40, gpuBound([24, 15, 15, 15])); ok(G.level() <= 1 && s.length <= 3, `no back-and-forth (${s1}; then ${s.join(' > ')})`);
G.hold = true; G.A = 0; run(20, gpuBound([40, 40, 40, 40])); ok(G.level() === 0, 'held during the benchmark: no change'); G.hold = false;
ctx.st.gq = 'high'; run(20, gpuBound([40, 40, 40, 40])); ok(G.level() === 0 && G.name() === 'High', 'fixed High: never stepped');
ctx.st.gq = 'balanced'; ok(G.level() === 1 && G.cap() === 1.5, 'fixed Balanced: cap 1.5');
ctx.st.gq = 'perf'; ok(G.level() === 2 && G.cap() === 1.25 && !G.pace(t + 5, t), 'fixed Performance: cap 1.25, not paced');
ctx.st.gq = 'auto'; G.A = 3; ok(G.pace(t + 10, t) && !G.pace(t + 30, t), 'paced 30: a display frame 10 ms after the last drawn one is skipped, 30 ms after is drawn');
ctx.window.__SP_OFF = 1; ok(G.level() === 0 && G.animaK() === 1 && G.partsK() === 1 && !G.pace(t + 10, t), '__SP_OFF: High, factors 1, no pacing');
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
