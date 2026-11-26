// v453 GP: the Garden bosses' GLM passes frame by frame: each GLM.render's size and the GLM canvas's size after it (resizes), with
// window.__GP_OFF = 1 (v451a) and without, over F frames each. usage: HTML=test-gpa.html STAGE=2 node tests/_gp-glm.js  env: F (6)
process.env.RIFT = 'garden';
const { open } = require('./_pf-lib');
(async () => {
  const T = await open({ html: process.env.HTML || 'test-gpa.html', dpr: +(process.env.DPR || 3), rift: 'garden', flags: { __ORB_GL: 1, __GB_GL: 1, __GB_GLHQ: 1 } }); const { page, errors, start, frames } = T;
  await page.evaluate(() => { window.__pp.st.gq = 'balanced'; });
  const STAGE = +(process.env.STAGE || 2); await start(STAGE);
  await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; const b = D.mons.find(m => m.boss && !m.dead); if (b) { me.x = b.x; me.y = b.y + 6; } D.g.intro = 0; for (let k = 0; k < 1100; k++) { me.hp = D.ST.hp; G.update(1 / 60); }
    window.__GL = []; for (const Gc of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!Gc) continue; const v0 = Gc.prototype.viewport; Gc.prototype.viewport = function (x, y, w, h) { if (this.canvas && this.canvas.__pfGL === 'glm') window.__GL.push([w, h, this.canvas.width, this.canvas.height]); return v0.apply(this, arguments); }; } });
  for (const off of [1, 0, 1, 0]) { await page.evaluate(o => { window.__GP_OFF = o; window.__GL.length = 0; }, off); const r = await frames(+(process.env.F || 6), { prof: false });
    const L = await page.evaluate(() => window.__GL.splice(0)); console.log(off ? 'v451a' : 'v453 ', 'GLM canvas resizes', r.rows.reduce((a, q) => a + q.cvResizeGLM, 0), 'in', r.rows.length, 'frames; GLM viewports [W, H, canvas W, H]:', JSON.stringify(L)); }
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
