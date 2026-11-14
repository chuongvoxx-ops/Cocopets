// The GPU path stays alive: with the GPU forced (software GL in the test browser), every shader the game compiles
// compiles and links with no info-log error, GLM is up, and each GPU model (Nidhogg, Susano O, Fenrir, Belladonna, Jaws) reports
// `gl` true and draws at least one GPU frame in play. A broken edit to the shared GLM shader (20k5uz) otherwise drops all
// GPU models to their 2D fallbacks silently, and smoke still passes. Run it beside smoke.
// usage: HTML=test-xyz.html node tests/gl.js        BREAK=1 injects a syntax error into GLM's fragment shader, to see it fail
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  /* before any game script: force every GPU path, and record every shader compile and program link that fails, with its log */
  await page.addInitScript(brk => {
    for (const f of ['__SUSANO_GL', '__FENRIR_GL', '__BELLA_GL', '__JAWS_GL', '__SM_GL', '__BM_GL', '__JAWS_FX_GL', '__NIDHOGG_GL', '__NG_GL', '__BEAST_GL', '__BM_GL', '__SC_GL', '__GENBU_GL', '__X_GL']) window[f] = 1;
    const fails = window.__glFails = [], seen = window.__glSeen = { shaders: 0, programs: 0 };
    for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const P = C.prototype, cs = P.compileShader, lp = P.linkProgram, ss = P.shaderSource;
      P.shaderSource = function (o, src) { o.__src = src; if (brk && /frostFx/.test(src) && /gl_FragColor/.test(src)) src = src.replace('gl_FragColor', 'gl_FragColor = ;'); return ss.call(this, o, src); };
      P.compileShader = function (o) { cs.call(this, o); seen.shaders++; if (!this.getShaderParameter(o, this.COMPILE_STATUS)) fails.push({ kind: 'compile', log: String(this.getShaderInfoLog(o)).slice(0, 400), head: String(o.__src || '').slice(0, 80) }); };
      P.linkProgram = function (p) { lp.call(this, p); seen.programs++; if (!this.getProgramParameter(p, this.LINK_STATUS)) fails.push({ kind: 'link', log: String(this.getProgramInfoLog(p)).slice(0, 400) }); }; }
  }, process.env.BREAK === '1');
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);

  const glm = await page.evaluate(() => { const P = window.__pp, S = P.susano, G = S && S.__dbg && S.__dbg.GLM; if (!G) return null; const up = G.ok(); return { up, stats: G.stats, soft: G.soft }; });
  ok(!!glm && glm.up && !glm.stats.failed && !glm.stats.lost, 'GLM is up: its program compiled and linked', glm);

  /* each GPU model, cast in play: it reports gl, and GLM renders at least one frame for it */
  const ULTS = [['genbu', 'earth', 'genbu', '_genbu'], ['nidhogg', 'fire', 'nidhogg', '_nidhogg'], ['beastmachine', 'thunder', 'beast', '_beast'], ['sportscar', 'light', null, '_sportscar'], ['susanoo', 'dark', 'susano', '_susanoo'], ['fenrir', 'ice', 'fenrir', '_fenrir'], ['belladonna', 'wind', 'belladonna', '_belladonna'], ['jaws', 'water', 'jaws', '_jaws']];
  const ONLY = process.env.KEYS ? process.env.KEYS.split(',') : null;   /* KEYS=nidhogg,beastmachine: one run per model when all of them together are too slow under software GL */
  for (const [key, el, mk, gk] of ULTS.filter(u => !ONLY || ONLY.includes(u[0]))) {
    await page.evaluate(() => { const P = window.__pp; P.arc.paused = false; P.quickStart('GL'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 180000 });   /* (a heavy GPU model under software GL makes every load slow) */ await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(1500);
    const r = await page.evaluate(async ([key, el, mk, gk]) => { const P = window.__pp, D = P.arc.game._dbg, G = P.susano.__dbg.GLM, M = mk === 'beast' ? (P.ELEM_IMPL.thunder.ult.beastmachine.__dbg || {}).GL : mk === 'genbu' ? ((P.ELEM_IMPL.earth.ult.genbu || {}).__dbg || {}).MODEL : mk ? P[mk] : null;
      if ((mk && !M) || !P.ELEM_LIST[el] || !P.ELEM_LIST[el]['ey_' + key]) return { missing: true };
      for (const m of D.mons) { m.hp = 1e9; m.dmg = 0; m.atkCd = 99; }
      D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + key], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 4 })); D.me.mp = 999; D.g.cdU = 0;
      if (!G.__wrapped) { const r0 = G.render; let n = 0; G.render = function () { const c = r0.apply(this, arguments); if (c) n++; return c; }; G.__wrapped = true; G.__n = () => n; }
      const n0 = G.__n(); D.useUlt(); const t0 = performance.now(); let S = null;
      /* (counted in frames, not wall time: under software GL a heavy model's first frames take seconds each, and the first one
         also builds its meshes, so a wall-clock cap let a cold first run end before any GPU frame; the cap is generous) */
      let f = 0; while (f < 900 && performance.now() - t0 < 300000) { await new Promise(res => requestAnimationFrame(res)); f++; D.me.inv = 1; D.me.hp = D.ST.hp; S = D.g[gk]; if (S && G.__n() - n0 >= 2) break; }
      /* the moves' own GPU effect layers too: once ridden, a Strong of each kind */
      const t1 = performance.now(); let k = 0, rd = null; while (k < 400 && performance.now() - t1 < 600000) { await new Promise(res => requestAnimationFrame(res)); D.me.inv = 1; D.me.hp = D.ST.hp; const S2 = D.g[gk]; if (rd == null && S2 && !/summon|build|assemble/.test(S2.phase)) rd = k; if (rd != null) { if (k - rd === 5) D.useStrong('strong'); if (k - rd === 25) D.useStrong('strong2'); if (k - rd > 50) break; } k++; }
      const glOn = !M ? null : typeof M.on === 'function' ? M.on() : M.gl != null ? M.gl : M.__dbg && M.__dbg.gl;
      return { session: !!S, phase: S && S.phase, gl: !!glOn, frames: G.__n() - n0, failed: G.stats.failed }; }, [key, el, mk, gk]);
    if (r.missing) { console.log('skip  ' + key + ' (not in this build)'); continue; }
    if (!mk) ok(r.session && !r.failed, `${key}: rides with its GPU effects forced (no GPU model yet: the shader check below covers its effects)`, r);
    else ok(r.session && r.gl && r.frames > 0 && !r.failed, `${key}: the model reports gl and draws GPU frames in play`, r);
    /* end the ride before the next floor, so a still-running GPU session cannot slow the next load (the first-run failures) */
    await page.evaluate(async gk => { const D = window.__pp.arc.game._dbg, S = D.g[gk]; if (S && !S.released) { if (S.left != null) S.left = 0; if (S.endT != null) S.endT = D.g.t; } let f = 0; while (S && !S.released && f++ < 600) await new Promise(res => requestAnimationFrame(res)); }, gk); await page.waitForTimeout(400);
  }

  const F = await page.evaluate(() => ({ fails: window.__glFails, seen: window.__glSeen }));
  ok(F.fails.length === 0 && F.seen.shaders > 0, `no shader compile or program link error (${F.seen.shaders} shaders, ${F.seen.programs} programs)`, F.fails);
  ok(!errors.length, 'no page errors', errors.slice(0, 3));
  await browser.close();
  console.log(bad ? `FAILED ${bad}` : 'all passed'); process.exit(bad ? 1 : 0);
})();
