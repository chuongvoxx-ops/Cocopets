// (v470 AB) The Pale Aurora's boss fights (tests/_boss-anim-aurora-<boss>.js) run with the GPU models and their light forced on a
// software rasteriser (window.__AUR_GL = 1, __NG_GL = 1), or kept off (GL=0: the 2D bosses, as without WebGL).
// usage: HTML=... [SHOTS=1] [GL=0] [LOW=1] node tests/_ab-anim.js thul|nivora|ahuul
const lib = require('./_rift-lib'), o0 = lib.open;
const gl = process.env.GL !== '0', low = process.env.LOW === '1';
lib.open = async opts => { const T = await o0(opts); await T.page.evaluate(([gl, low]) => { window.__AUR_GL = gl ? 1 : 0; if (gl) window.__NG_GL = 1; if (low) window.__pp.st.lowFx = true; }, [gl, low]);
  if (gl) { const t0 = Date.now(); await T.page.evaluate(() => { const P = window.__pp, D = P.FIEND_DEFS.thul, K = P.DunFiend.KIT, cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), m = { x: 0, y: 0, t: 1, flash: 0 }, FX = { K, mem: {}, m, S: { tele: [], weak: {} }, sx: v => v, sy: v => v };
      try { D.draw(c, FX, m, 32, 40, 4, 1); } catch (e) { } try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (F && F.usable()) { const Q = F.begin(c, null); Q.quad(540, 32, 32, 10, 0, 0, 10, '#FFFFFF', 1, 0.5, 1, 0); F.flush(c); } } catch (e) { } }); console.log('  (shaders warmed in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); }
  T.page.on('console', m => { if (/Thul|Nivora|Ahuul|AUR3|GLM|Nidhogg GFX/.test(m.text())) console.log('  console:', m.text().slice(0, 300)); }); return T; };
const id = process.argv[2] || 'thul'; process.argv.splice(2, 1);
require('./_boss-anim-aurora-' + id + '.js');
