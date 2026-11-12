/* ---------- Jaws (11th Water ult): the moves and effects (E) ----------
   JAWS_MOVES, called by A's core (20k7n) with one `ctx` per cast (the contract is in docs/WATER-JAWS-BRIEF.md, Notes).
   - JM.waterRay(ctx): the mouth charge, the beam, ONE explosion hit at the impact, then a Tidal Pool asked of the core.
   - JM.rollingWave(ctx): a rolling wave that hits each enemy once and carries movable ones toward the aim.
   - JM.depthCharge(ctx): the cannon's sphere; a plain blast, or (aimed at an available pool, claimed at the launch) one
     amplified blast with a towering geyser that consumes the pool.
   - JM.maelstrom(ctx): claims every available pool; each a whirlpool that pulls and ticks through one registry a tick;
     then all erupt together through a second registry. Returns false (and says why) with no pool.
   - JM.sharkAttack(ctx): the starry ocean, the dive, the sky beam (one hit an enemy), the spirit jaws, the snap (one
     colossal hit an enemy). noCharge.
   - Pictures and sound for the core: JM.maw, JM.hydrojet, JM.summon, JM.anchorHalo, JM.transform, JM.exit; JM.poolFx
     draws the Tidal Pools from the core's records (ctx.pools; a stand-in registry with the same rules without one).
   - JM.GFX: every effect is real 3D geometry on one GPU layer (instanced funnels for geysers, whirlpools and the sky
     beam; ribbons for waves, streams and the jaws' arcs; instanced crystal blades for teeth and droplets; marks as quads
     on the ground), projected with the game's camera and depth-tested, valid premultiplied output, the pet's face kept
     clear; the same calls drawn flat in 2D otherwise. Gameplay never depends on the path.
   Damage only through ctx.hitArea / ctx.hitOval / ctx.hit. No timers: deadlines on the game clock. */
(() => {
  const JM = (self.JAWS_MOVES = self.JAWS_MOVES || {});
  const TAU = Math.PI * 2, PI = Math.PI;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, eback = u => { u = cl(u); const s = 1.70158; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
  const rnd = (a, b) => a + Math.random() * (b - a), R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion, LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  /* (the palette keeps the layer's names: mint = cyan, pink = the water's blue, blush = light blue, rose = deep blue, pearl = foam) */
  const P = { mint: '#5FE3FF', pale: '#DDF6FF', white: '#FFFFFF', deep: '#0B2A6B', pink: '#2F7BFF', rose: '#123E9C', blush: '#9CCBFF', gold: '#FFE9A8', pearl: '#F2FBFF' };

  /* ================= tuning (x DK = the ult's base damage unit; provisional until H's audit) ================= */
  const stats = JM.stats = { rayHits: 0, pools: 0, waveHits: 0, depthHits: 0, depthBig: 0, claims: 0, maelTicks: 0, maelHits: 0, maelBursts: 0 };   /* (counters for tests/jaws.js) */
  const TUNE = JM.TUNE = {
    rayCd: 2, waveCd: 4,   /* (s, per slot, shared across the forms: the core reads these) */
    /* Water Ray: `charge` s, the beam for `beam` s reaching the impact `travel` s in; one explosion of `dmg` x DK within r; a pool of radius poolR */
    ray: { charge: 0.35, beam: 0.45, travel: 0.1, recover: 0.2, reach: 9, r: 2.2, dmg: 5, poolR: 2.2, poolAt: 0.5 },
    /* Rolling Wave: `windup` s, then `dist` tiles at `speed`; its crest (half-width `half`, `thick` deep) hits once for `dmg` x DK and carries movable enemies `push` tiles/s toward the aim */
    wave: { windup: 0.3, recover: 0.35, dist: 9, speed: 10, half: 2.6, thick: 0.9, dmg: 7, push: 9 },
    /* Depth Charge: `charge` s, `travel` s of flight; plain: `dmg` x DK within r; into a pool: `plunge` s, then `big` x DK within bigR (2.5 x) */
    depth: { charge: 0.35, travel: 0.45, reach: 10, r: 2.4, dmg: 6, plunge: 0.3, bigR: 4.4, big: 15 },
    /* Maelstrom: `windup` s; each whirlpool (the pool's radius + grow) pulls within `reach` beyond it at `pull` tiles/s and ticks `dmg` x DK every `every` s for `dur` s; `collapse` s later all burst for `burst` x DK within burstR */
    mael: { windup: 0.5, recover: 0.6, dur: 2.4, every: 0.3, dmg: 1.0, grow: 0.7, reach: 1.6, pull: 3.2, collapse: 0.35, burst: 8, burstR: 3.4 },
    /* Shark Attack: the ocean, the dive, the sky beam (beamShare of `total` x DK by tier, within beamR), the stars gathering, the jaws rising, the pause, the snap (the rest, within R), the aftermath */
    shark: { ocean: 0.9, dive: 1.0, beam: 0.8, gather: 1.1, rise: 0.9, pause: 0.4, snap: 0.14, after: 1.6, R: 7, beamR: 3.2, beamDmg: [30, 35, 40], bite: [65, 80, 85], zoom: 0.7 },
    gpu: { res: 0.8, resLow: 0.55, maxSide: 1400 },
  };

  /* ================= small shared bits ================= */
  const sfx = (X, k, ...a) => { try { const F = X.sfx; if (F && F[k]) F[k](...a); } catch (e) {} };
  const tierOf = ctx => ctx.tier != null ? ctx.tier : (ctx.evo >= 7 ? 2 : ctx.evo >= 4 ? 1 : 0);
  const dkOf = ctx => ctx.DK || ((ctx.C && ctx.C.base) || 20) * (1 + 0.08 * ((ctx.evo || 1) - 1));
  const live = ctx => { try { return !ctx.alive || !!ctx.alive(); } catch (e) { return false; } };
  const once = ctx => { let d = false; return () => { if (d) return; d = true; try { ctx.done && ctx.done(); } catch (e) {} }; };
  const now = ctx => { try { if (ctx.now) { const t = ctx.now(); if (isFinite(t)) return t; } if (ctx.g && isFinite(ctx.g.t)) return ctx.g.t; } catch (e) {} return (GS.fx && GS.fx.t) || 0; };
  const clip = (ctx, name, u) => { try { if (typeof ctx.clip === 'function') ctx.clip(name, name === 'rest' ? 0 : cl(u)); else if (typeof ctx.pose === 'function') ctx.pose(name, cl(u)); } catch (e) {} };
  const cam = (ctx, o) => { try { if (ctx.camera) ctx.camera(o); } catch (e) {} };
  const shake = (ctx, k, d) => { const X = ctx.H.X; if (RM()) k *= 0.35; try { if (ctx.camera) { ctx.camera({ shake: k, dur: d }); return; } } catch (e) {} if (X.shake) X.shake(k, d); };
  /* the model's anchors (world x, y and height z in tiles); a core without them gets places round the vehicle */
  function anchor(ctx, name) { try { const p = ctx.anchor && ctx.anchor(name); if (p && isFinite(p.x) && isFinite(p.y)) return { x: p.x, y: p.y, z: p.z || 0 }; } catch (e) {} const v = ctx.vehicle || {};
    const D = { center: [0, 1.2], seat: [0, 1.5], mouth: [0, 1.1], reactor: [0, 1.0], tailTip: [0, 1.4], jet: [0, 0.9] }[name] || [0, 1.2]; return { x: v.x || 0, y: v.y || 0, z: (v.z || 0) + D[1] }; }
  const zk = (ctx, T) => { try { if (ctx.scr && T > 0) { const a = ctx.scr(0, 0, 0), b = ctx.scr(0, 0, 1), k = (a[1] - b[1]) / T; if (k > 0.2 && k < 2) return k; } } catch (e) {} return 0.8; };
  const gone = m => !m || m.dead || m.under || m.falling;
  const monsOf = ctx => { try { if (ctx.mons) { const L = ctx.mons(); if (L) return L; } } catch (e) {} return ctx.H.living(); };
  /* the one damage path: the core's hitArea (it charges the gauge and smashes props); without it, its hit per monster */
  function hitA(ctx, x, y, r, dmg, o) { if (!live(ctx)) return 0; try { if (ctx.hitArea) return ctx.hitArea(x, y, r, dmg, o) || 0; } catch (e) { return 0; }
    let n = 0; const seen = o && o.once ? (o.once.__seen || (o.once.__seen = new Set())) : null; for (const m of monsOf(ctx)) { if (gone(m) || Math.hypot(m.x - x, m.y - y) >= r + (m.r || 0.4)) continue; if (seen) { if (seen.has(m)) continue; seen.add(m); } try { ctx.hit(m, dmg, o); n++; } catch (e) {} } return n; }
  const aimOf = (ctx, reach) => { const v = ctx.vehicle; let tg = null, x, y; try { tg = ctx.target && ctx.target(); } catch (e) {}
    if (tg && isFinite(tg.x)) { x = tg.x; y = tg.y; } else { let a = v.heading || 0; try { if (ctx.aimDir) { const d = ctx.aimDir(); if (isFinite(d)) a = d; } } catch (e) {} x = v.x + Math.cos(a) * reach * 0.75; y = v.y + Math.sin(a) * reach * 0.75; }
    const d = Math.hypot(x - v.x, y - v.y); if (d > reach) { x = v.x + (x - v.x) / d * reach; y = v.y + (y - v.y) / d * reach; } return { x, y, a: Math.atan2(y - v.y, x - v.x) }; };
  /* what lasts between casts of one caster (the ring's state, the one Wildflowers field) */
  const STATE = new WeakMap(), SS = ctx => { const k = ctx.S || ctx.vehicle || ctx; let s = STATE.get(k); if (!s) { s = { pools: null, poolItem: null }; STATE.set(k, s); } return s; };

  /* ================= JAWS_GFX: the effects in 3D on the GPU =================
     Everything is geometry in the world (x and y on the ground, z up, in tiles), projected by the game's camera in the
     vertex shader and depth-tested against itself:
     - blossoms and loose petals: small meshes (five cupped petals round a golden heart; one cupped petal), instanced,
       each with its own place, size, colour and rotation (a quaternion: they tumble for real), lit like the flower's
       own satin petals (deep rose root, pink, blush tip, a key light, a soft rim, light through the petal);
     - tornadoes: a funnel surface (24 x 12), instanced once per shell (two shells a tornado, turning against each
       other), tapered and bending in the vertex shader, shaded by its angle to the camera (bright limbs, dim far wall)
       with wind bands scrolling up it: each band a sharp bright edge fading gradually behind it;
     - wind ribbons: strips lying in the wind's plane (arcs round an axis, or along a path), u 0 at the inner edge and
       1 at the outer: a bright sharp outer edge, the body fading gradually inward (the user's rule);
     - marks and light: quads lying on the ground or at a height (rings, the turbulent air disc, the Wind seal, floor
       light) or facing the camera (glows, sparkles, beams), drawn from maths in the fragment shader.
     One offscreen WebGL canvas, twice the game canvas's width x `res`, with a depth buffer: the left half takes what
     is solid (the flowers, premultiplied, blended over), the right half takes light alone (alpha = its brightest
     channel, added) after the flowers have been laid into its depth, so wind behind a blossom is hidden by it.
     blit() lays the left half 'source-over' and the right 'lighter': valid premultiplied colour in every browser.
     Used on real-GPU WebGL with instancing; a software rasteriser or no WebGL draws the 2D path. window.__JAWS_FX_GL = 1
     forces it, 0 forces 2D; a lost context falls back to 2D (rebuilt when restored). */
  const GFXM = (() => { let cv = null, gl = null, PQ = null, PR = null, PF = null, PM = null, bq = null, br = null, bfm = null, bfi = null, bmm = null, bmi = null, ok = null, soft = false, info = '', why = '', IA = null, NBV = 0, NPV = 0, NFV = 0, NTV = 0;
    const stats = { draws: 0, quads: 0, ribbonTris: 0, blossoms: 0, petals: 0, funnels: 0, W: 0, H: 0, frames: 0 };
    const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
    const NOISE = `float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
float sq(float x){ return x * x; }
`;
    /* the camera: clip x, y and depth are each a dot with (x, y, z, 1) */
    const PROJ = 'uniform vec4 u_px, u_py, u_pd; vec4 proj(vec3 p){ vec4 q = vec4(p, 1.0); return vec4(dot(q, u_px), dot(q, u_py), dot(q, u_pd), 1.0); }\n';
    /* marks and light: a_p a point in the world, a_o an offset on the screen (px: camera-facing quads), a_uv -1..1 */
    const VS_Q = PROJ + `attribute vec3 a_p; attribute vec2 a_o, a_uv; attribute float a_k; attribute vec4 a_c; attribute vec3 a_q; uniform vec2 u_ps; varying vec2 v_uv; varying float v_k; varying vec4 v_c; varying vec3 v_q;
void main(){ vec4 p = proj(a_p); p.xy += a_o * u_ps; gl_Position = p; v_uv = a_uv; v_k = a_k; v_c = a_c; v_q = a_q; }`;
    const FS_Q = HDR + `uniform float u_t; varying vec2 v_uv; varying float v_k; varying vec4 v_c; varying vec3 v_q;
` + NOISE + `void main(){ vec2 u = v_uv; float r = length(u), m = 0.0, edge = 1.0 - smoothstep(0.86, 1.0, r), an = atan(u.y, u.x); vec3 col = v_c.rgb;
  if (v_k < 0.5) m = exp(-r * r * 4.2) * edge * 0.6;                                                       // a feathered glow
  else if (v_k < 1.5) { float d = max((v_q.x - r) / v_q.y, 0.0); m = (1.0 - smoothstep(v_q.x - 0.012, v_q.x + 0.008, r)) * (0.45 * exp(-d * 2.4) + 0.6 * exp(-d * 13.0)); col = mix(col, vec3(1.0), 0.7 * exp(-d * 13.0)); }   // a ring: sharp outside, fading inward
  else if (v_k < 2.5) m = exp(-u.y * u.y * 5.0) * (1.0 - smoothstep(0.55, 1.0, abs(u.x)));                 // a beam
  else if (v_k < 3.5) { float f = fbm(vec2(an * 1.6 + r * 3.2 - u_t * 2.2 + v_q.z, r * 4.0 - u_t * 0.6)), sk = smoothstep(0.45, 0.8, f); m = (0.07 + 0.5 * sk * r) * (1.0 - smoothstep(0.93, 0.99, r)) + 0.4 * exp(-sq((r - 0.93) / 0.03)) * (0.6 + 0.4 * sk); col = mix(col, vec3(1.0), 0.5 * sk); }   // a disc of turbulent air
  else if (v_k < 4.5) { float sh = step(r, v_q.y * 1.05), a1 = an + v_q.x, p1 = 0.52 + 0.34 * abs(cos(3.0 * a1)), p2 = 0.2 + 0.2 * abs(cos(2.5 * (an - v_q.x * 2.0)));
    m = exp(-sq((r - 0.95) / 0.012)) + 0.7 * exp(-sq((r - 0.87) / 0.008)) + 0.8 * exp(-sq((r - p1) / 0.016)) + 0.7 * exp(-sq((r - p2) / 0.014)) + 0.5 * step(0.5, fract(a1 * 3.8197)) * step(0.88, r) * step(r, 0.94) + 0.12 * (1.0 - smoothstep(0.0, 0.95, r));
    m *= sh * (1.0 - smoothstep(0.97, 1.0, r)); }                                                             // the Wind seal: rings, a six-petal rosette, a five-petal heart
  else { vec2 a = abs(u); m = (exp(-a.x * 2.5) * exp(-a.y * 30.0) + exp(-a.y * 2.5) * exp(-a.x * 30.0)) * edge; }   // a sparkle
  vec3 L = min(col * v_c.a * m, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
    /* ribbons: a_uv (across 0 inner..1 outer, along 0..1) */
    const VS_R = PROJ + `attribute vec3 a_p; attribute vec2 a_uv; attribute vec4 a_c; varying vec2 v_uv; varying vec4 v_c;
void main(){ gl_Position = proj(a_p); v_uv = a_uv; v_c = a_c; }`;
    const FS_R = HDR + `uniform float u_pass; varying vec2 v_uv; varying vec4 v_c;
void main(){ float u = v_uv.x, v = v_uv.y, ends = smoothstep(0.0, 0.2, v) * (1.0 - smoothstep(0.72, 1.0, v)), aa = 1.0 - smoothstep(0.94, 1.0, u);
  float body = pow(u, 1.5) * 0.95 * (0.8 + 0.2 * sin(v * 37.0 + u * 9.0)), line = smoothstep(0.8, 0.93, u);
  float k = v_c.a * ends * aa; if (u_pass < 0.5) { float a = clamp((body + line * 0.8) * k * 0.75, 0.0, 0.9); gl_FragColor = vec4(mix(v_c.rgb, vec3(1.0), 0.75 * line) * a, a); return; }   // its veil (solid, so it reads on a bright floor too), then its light
  vec3 L = (v_c.rgb * body + mix(v_c.rgb, vec3(1.0), 0.7) * line * 0.8) * k * 0.6; L = min(L, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
    /* a tornado's shell (instanced): a_uv (round 0..1, up 0..1); i_b (base x, y, z, top radius), i_s (height, base / top
       ratio, spin, seed), i_c (colour, alpha), i_m (shell scale, direction) */
    const VS_F = PROJ + `attribute vec2 a_uv; attribute vec4 i_b, i_s, i_c; attribute vec2 i_m; uniform float u_t; varying vec2 v_uv; varying vec3 v_n, v_s; varying vec4 v_c;
void main(){ float an = a_uv.x * 6.2832, hq = a_uv.y, rr = i_b.w * i_m.x * mix(i_s.y, 1.0, pow(hq, 1.5));
  vec2 bend = vec2(sin(hq * 3.0 + u_t * 1.7 + i_s.w * 5.0), cos(hq * 2.3 + u_t * 1.3 + i_s.w * 3.0)) * 0.16 * i_b.w * hq;
  gl_Position = proj(i_b.xyz + vec3(cos(an) * rr + bend.x, sin(an) * rr + bend.y, hq * i_s.x)); v_n = vec3(cos(an), sin(an), -0.3); v_uv = a_uv; v_c = i_c; v_s = vec3(i_s.z * i_m.y, i_s.w, i_m.x); }`;
    const FS_F = HDR + `uniform float u_t, u_pass; uniform vec3 u_v; varying vec2 v_uv; varying vec3 v_n, v_s; varying vec4 v_c;
` + NOISE + `void main(){ float ndv = dot(normalize(v_n), u_v), limb = 1.0 - abs(ndv), front = step(0.0, ndv), h = v_uv.y;
  float fr = fract(v_uv.x * 3.0 + h * 1.9 - u_t * v_s.x * 0.16 + v_s.y * 0.37), band = pow(fr, 2.6) * (1.0 - smoothstep(0.93, 1.0, fr)), line = smoothstep(0.78, 0.92, fr) * (1.0 - smoothstep(0.93, 1.0, fr));
  float wsp = fbm(vec2(v_uv.x * 9.0 - u_t * v_s.x * 0.2 + v_s.y, h * 5.0 - u_t * 0.9));
  float m = (0.1 + 0.8 * band + 0.6 * line + 0.3 * smoothstep(0.5, 0.8, wsp)) * (0.35 + 0.75 * pow(limb, 1.3)) * mix(0.5, 1.0, front) * smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.7, 1.0, h));
  vec3 col = mix(v_c.rgb, vec3(1.0), clamp(0.7 * line + 0.4 * limb * limb * limb, 0.0, 1.0)); if (u_pass < 0.5) { float a = clamp((m * 1.15 + 0.16 * (1.0 - h)) * v_c.a, 0.0, 0.92) * smoothstep(0.0, 0.05, h) * (1.0 - smoothstep(0.75, 1.0, h)); col = mix(vec3(0.07, 0.36, 0.36), col, clamp(smoothstep(0.0, 0.5, h) + 0.8 * line + 0.5 * band, 0.0, 1.0)); gl_FragColor = vec4(col * a, a); return; }   // the veil: a darker teal core at the base, mint to white above
  vec3 L = min(col * v_c.a * m * 0.55, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
    /* flowers (instanced): a_p, a_n the mesh; a_e (along the petal 0 root..1 tip, 1 for the golden heart); i_p (place, size),
       i_q (rotation, a quaternion), i_c (colour, alpha) */
    const VS_M = PROJ + `attribute vec3 a_p, a_n; attribute vec2 a_e; attribute vec4 i_p, i_q, i_c; varying vec3 v_n; varying vec2 v_e; varying vec4 v_c;
vec3 rot(vec3 v, vec4 q){ return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
void main(){ gl_Position = proj(i_p.xyz + rot(a_p * i_p.w, i_q)); v_n = rot(a_n, i_q); v_e = a_e; v_c = i_c; }`;
    const FS_M = HDR + `uniform vec3 u_v, u_l; uniform float u_pass; varying vec3 v_n; varying vec2 v_e; varying vec4 v_c;
void main(){ if (u_pass > 0.5) { if (v_c.a < 0.5) discard; gl_FragColor = vec4(0.0); return; }
  vec3 n0 = normalize(v_n), n = n0; float ndv = dot(n, u_v); if (ndv < 0.0) { n = -n; ndv = -ndv; }
  float dif = 0.56 + 0.44 * dot(n, u_l), thru = 0.22 * max(0.0, -dot(n, u_l)), rim = pow(1.0 - ndv, 3.0), spec = pow(max(dot(reflect(-u_l, n), u_v), 0.0), 14.0);
  vec3 base = v_c.rgb, col = mix(base * vec3(0.45, 0.6, 0.9), base, smoothstep(0.0, 0.45, v_e.x)); col = mix(col, mix(base, vec3(1.0), 0.55), smoothstep(0.55, 1.0, v_e.x));
  if (v_e.y > 0.5) col = vec3(1.0, 0.84, 0.36);
  col = col * dif + vec3(0.8, 0.95, 1.0) * (rim * 0.35 + thru) + vec3(1.0) * spec * 0.14; gl_FragColor = vec4(min(col, vec3(1.0)) * v_c.a, v_c.a); }`;
    /* the pet stays in view: every fragment fades in a soft hole round the pet's seat (u_pet: its place in clip space and how much
       to protect, 0 on the finisher's brightest beat; u_pa scales clip space to the hole's radius) */
    const PET = 'varying vec2 v_sc; uniform vec3 u_pet; uniform vec2 u_pa; float petK(){ float d = length((v_sc - u_pet.xy) * u_pa); return mix(1.0, 0.1 + 0.9 * smoothstep(0.55, 1.6, d), u_pet.z); }\n';
    function prog(vs, fs, attrs) { vs = 'varying vec2 v_sc;\n' + vs.replace('void main(){', 'void main0(){') + '\nvoid main(){ main0(); v_sc = gl_Position.xy; }'; fs = fs.replace('void main(){', PET + 'void main0(){') + '\nvoid main(){ main0(); gl_FragColor *= petK(); }';
      const sh = (ty, src) => { const q = gl.createShader(ty); gl.shaderSource(q, src); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(q)); return q; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
      const U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(p, i); U[u.name] = gl.getUniformLocation(p, u.name); } return { p, U }; }
    /* a cupped petal as a grid (5 along x 3 across), turned by rz about the flower's axis and lifted by tilt: 8 floats a vertex */
    function petalMesh(out, rz, tilt, len, wid, cup, x0) { const S = [0.04, 0.3, 0.58, 0.83, 1], Cc = [-1, 0, 1], ct = Math.cos(tilt), st = Math.sin(tilt), cz = Math.cos(rz), sz = Math.sin(rz);
      const at = (s, c) => { const w = wid * (0.1 + 0.9 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.7)) * (s > 0.99 ? 0.25 : 1), x = x0 + s * len, y = c * w, z = cup * (s * s * 0.45 + 0.5 * c * c * w / wid), x1 = x * ct - z * st, z1 = x * st + z * ct; return [x1 * cz - y * sz, x1 * sz + y * cz, z1]; };
      const nrm = (s, c) => { const a = at(Math.min(1, s + 0.02), c), b = at(Math.max(0, s - 0.02), c), d = at(s, Math.min(1, c + 0.05)), e = at(s, Math.max(-1, c - 0.05)), u = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], v = [d[0] - e[0], d[1] - e[1], d[2] - e[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l]; };
      const put = (s, c) => { const p = at(s, c), n = nrm(s, c); out.push(p[0], p[1], p[2], n[0], n[1], n[2], s, 0); };
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { put(S[i], Cc[j]); put(S[i + 1], Cc[j]); put(S[i], Cc[j + 1]); put(S[i], Cc[j + 1]); put(S[i + 1], Cc[j]); put(S[i + 1], Cc[j + 1]); } }
    function build() { if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; }); cv.addEventListener('webglcontextrestored', () => { ok = null; PQ = null; }); }
      const o = { alpha: true, premultipliedAlpha: true, antialias: true, depth: true, stencil: false }; let two = true; gl = gl || cv.getContext('webgl2', o); if (!gl) { two = false; gl = cv.getContext('webgl', o); } else two = typeof gl.drawArraysInstanced === 'function'; if (!gl) { why = 'no WebGL'; return false; }
      if (two) IA = { div: (i, d) => gl.vertexAttribDivisor(i, d), draw: (first, n, k) => gl.drawArraysInstanced(gl.TRIANGLES, first, n, k) }; else { const ex = gl.getExtension('ANGLE_instanced_arrays'); if (!ex) { why = 'no instancing'; return false; } IA = { div: (i, d) => ex.vertexAttribDivisorANGLE(i, d), draw: (first, n, k) => ex.drawArraysInstancedANGLE(gl.TRIANGLES, first, n, k) }; }
      try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; } soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
      PQ = prog(VS_Q, FS_Q, ['a_p', 'a_o', 'a_uv', 'a_k', 'a_c', 'a_q']); PR = prog(VS_R, FS_R, ['a_p', 'a_uv', 'a_c']); PF = prog(VS_F, FS_F, ['a_uv', 'i_b', 'i_s', 'i_c', 'i_m']); PM = prog(VS_M, FS_M, ['a_p', 'a_n', 'a_e', 'i_p', 'i_q', 'i_c']);
      bq = gl.createBuffer(); br = gl.createBuffer(); bfm = gl.createBuffer(); bfi = gl.createBuffer(); bmm = gl.createBuffer(); bmi = gl.createBuffer();
      // the meshes: a blossom (five petals and its heart), then one loose petal; the funnel's grid
      const M = []; for (let i = 0; i < 5; i++) petalMesh(M, i * TAU / 5, 0.42, 1, 0.46, 0.5, 0.06); for (let i = 0; i < 6; i++) { const a = i * TAU / 6, b = (i + 1) * TAU / 6; M.push(0, 0, 0.16, 0, 0, 1, 0, 1, Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.07, Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.7, 0, 1, Math.cos(b) * 0.17, Math.sin(b) * 0.17, 0.07, Math.cos(b) * 0.5, Math.sin(b) * 0.5, 0.7, 0, 1); }
      NBV = M.length / 8; petalMesh(M, 0, 0, 2, 0.62, 0.45, -1); NPV = M.length / 8 - NBV;
      { const B4 = [[0, 0.2, 0], [0, 0, 0.11], [0, -0.2, 0], [0, 0, -0.11]], tip = [1, 0, 0], back = [-0.12, 0, 0], tri = (a, b, c, ea, eb, ec) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(n[0], n[1], n[2]) || 1; for (const [q, e] of [[a, ea], [b, eb], [c, ec]]) M.push(q[0], q[1], q[2], n[0] / l, n[1] / l, n[2] / l, e, 0); };
        for (let i = 0; i < 4; i++) { tri(B4[i], B4[(i + 1) % 4], tip, 0.15, 0.15, 1); tri(B4[(i + 1) % 4], B4[i], back, 0.15, 0.15, 0); } NTV = M.length / 8 - NBV - NPV; }   /* (a crystal tooth: flat facets, so its edges catch the light) */ gl.bindBuffer(gl.ARRAY_BUFFER, bmm); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(M), gl.STATIC_DRAW);
      const F = [], NS = 24, NH = 12; for (let j = 0; j < NH; j++) for (let i = 0; i < NS; i++) { const u0 = i / NS, u1 = (i + 1) / NS, v0 = j / NH, v1 = (j + 1) / NH; F.push(u0, v0, u1, v0, u0, v1, u0, v1, u1, v0, u1, v1); } NFV = F.length / 2; gl.bindBuffer(gl.ARRAY_BUFFER, bfm); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(F), gl.STATIC_DRAW);
      return true; }
    function usable() { let f = null; try { f = typeof window !== 'undefined' ? window.__JAWS_FX_GL : null; } catch (e) {} if (f === 0 || ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Jaws GFX: ' + why); } catch (e2) {} } } return !!ok && (!soft || f === 1); }
    const attr = (i, n, stride, off, d) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, stride * 4, off * 4); IA.div(i, d || 0); }, offA = n => { for (let i = n; i < 6; i++) { gl.disableVertexAttribArray(i); IA.div(i, 0); } };
    const cam = (P, F) => { gl.uniform4fv(P.U.u_px, F.px); gl.uniform4fv(P.U.u_py, F.py); gl.uniform4fv(P.U.u_pd, F.pd); gl.uniform3fv(P.U.u_pet, F.pet); gl.uniform2fv(P.U.u_pa, F.pa); };
    /* F: { W, H, t, px, py, pd, ps, v, l, ground (true: the floor marks alone), quads (15 a vertex), nq, rib (9), nr,
       fun (14 an instance), nf, flo (12 an instance: blossoms), nb, pet (12: petals), np } */
    function render(F) { if (!usable()) return null; try { const W = F.W, Hh = F.H; if (cv.width !== W * 2 || cv.height !== Hh) { cv.width = W * 2; cv.height = Hh; }
        gl.viewport(0, 0, W * 2, Hh); gl.depthMask(true); gl.colorMask(true, true, true, true); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); let draws = 0;
        const flowers = pass => { if (!(F.nb + F.np + (F.nth || 0))) return; gl.useProgram(PM.p); cam(PM, F); gl.uniform3fv(PM.U.u_v, F.v); gl.uniform3fv(PM.U.u_l, F.l); gl.uniform1f(PM.U.u_pass, pass);
          for (const [A, n, first, cnt] of [[F.flo, F.nb, 0, NBV], [F.pet, F.np, NBV, NPV], [F.tth, F.nth || 0, NBV + NPV, NTV]]) { if (!n) continue; gl.bindBuffer(gl.ARRAY_BUFFER, bmm); attr(0, 3, 8, 0); attr(1, 3, 8, 3); attr(2, 2, 8, 6); gl.bindBuffer(gl.ARRAY_BUFFER, bmi); gl.bufferData(gl.ARRAY_BUFFER, A.subarray(0, n * 12), gl.DYNAMIC_DRAW); attr(3, 4, 12, 0, 1); attr(4, 4, 12, 4, 1); attr(5, 4, 12, 8, 1); IA.draw(first, cnt, n); draws++; } offA(0); };
        const funnels = pass => { if (!F.nf) return; gl.useProgram(PF.p); cam(PF, F); gl.uniform1f(PF.U.u_pass, pass); gl.uniform1f(PF.U.u_t, F.t); gl.uniform3fv(PF.U.u_v, F.v); gl.bindBuffer(gl.ARRAY_BUFFER, bfm); attr(0, 2, 2, 0); gl.bindBuffer(gl.ARRAY_BUFFER, bfi); gl.bufferData(gl.ARRAY_BUFFER, F.fun.subarray(0, F.nf * 14), gl.DYNAMIC_DRAW); attr(1, 4, 14, 0, 1); attr(2, 4, 14, 4, 1); attr(3, 4, 14, 8, 1); attr(4, 2, 14, 12, 1); offA(5); IA.draw(0, NFV, F.nf); draws++; offA(0); };
        const ribbons = pass => { if (!F.nr) return; gl.useProgram(PR.p); cam(PR, F); gl.uniform1f(PR.U.u_pass, pass); gl.bindBuffer(gl.ARRAY_BUFFER, br); gl.bufferData(gl.ARRAY_BUFFER, F.rib.subarray(0, F.nr * 9), gl.DYNAMIC_DRAW); attr(0, 3, 9, 0); attr(1, 2, 9, 3); attr(2, 4, 9, 5); offA(3); gl.drawArrays(gl.TRIANGLES, 0, F.nr); draws++; };
        if (!F.ground) { gl.viewport(0, 0, W, Hh); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); flowers(0); gl.depthMask(false); funnels(0); ribbons(0); gl.depthMask(true);   // the left half: the flowers, solid; then the wind's veils over them
          gl.viewport(W, 0, W, Hh); gl.colorMask(false, false, false, false); flowers(1); gl.colorMask(true, true, true, true); }   // the right half: their depth first
        gl.viewport(W, 0, W, Hh); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);                                             // then light alone, added
        if (F.nq) { gl.useProgram(PQ.p); cam(PQ, F); gl.uniform2fv(PQ.U.u_ps, F.ps); gl.uniform1f(PQ.U.u_t, F.t); gl.bindBuffer(gl.ARRAY_BUFFER, bq); gl.bufferData(gl.ARRAY_BUFFER, F.quads.subarray(0, F.nq * 15), gl.DYNAMIC_DRAW); attr(0, 3, 15, 0); attr(1, 2, 15, 3); attr(2, 2, 15, 5); attr(3, 1, 15, 7); attr(4, 4, 15, 8); attr(5, 3, 15, 12); gl.drawArrays(gl.TRIANGLES, 0, F.nq); draws++; }
        if (!F.ground) { funnels(1); ribbons(1); }
        gl.depthMask(true); offA(0);
        if (!F.ground) { stats.draws = draws + (stats.gDraws || 0); stats.quads = F.nq / 6; stats.ribbonTris = F.nr / 3; stats.blossoms = F.nb; stats.petals = F.np; stats.teeth = F.nth || 0; stats.maxTeeth = Math.max(stats.maxTeeth || 0, F.nth || 0); stats.funnels = F.nf; stats.W = W; stats.H = Hh; stats.frames++;
          stats.maxDraws = Math.max(stats.maxDraws || 0, stats.draws); stats.maxQuads = Math.max(stats.maxQuads || 0, F.nq / 6); stats.maxRibbonTris = Math.max(stats.maxRibbonTris || 0, F.nr / 3); stats.maxBlossoms = Math.max(stats.maxBlossoms || 0, F.nb); stats.maxPetals = Math.max(stats.maxPetals || 0, F.np); stats.maxFunnels = Math.max(stats.maxFunnels || 0, F.nf); stats.gDraws = 0; }
        else stats.gDraws = draws;
        return cv; } catch (e) { ok = false; why = String(e && e.message || e); return null; } }
    function blit(c, W, Hh, dx, dy, dw, dh, lightOnly) { c.globalAlpha = 1; if (!lightOnly) { c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, W, Hh, dx, dy, dw, dh); } c.globalCompositeOperation = 'lighter'; c.drawImage(cv, W, 0, W, Hh, dx, dy, dw, dh); c.globalCompositeOperation = 'source-over'; }
    /* (tests) right after render: pixels that break rgb <= a */
    function check() { if (!gl) return null; const W = cv.width, Hh = cv.height, px = new Uint8Array(W * Hh * 4); gl.readPixels(0, 0, W, Hh, gl.RGBA, gl.UNSIGNED_BYTE, px); let bad = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3]; if (a) lit++; if (px[i] > a + 1 || px[i + 1] > a + 1 || px[i + 2] > a + 1) bad++; } return { bad, lit, px: W * Hh }; }
    return { usable, render, blit, check, stats, tris: () => ({ blossom: NBV / 3, petal: NPV / 3, funnel: NFV / 3 }), info: () => ({ ok, soft, renderer: info, why }) }; })();
  const gpuOn = () => { try { return GFXM.usable(); } catch (e) { return false; } };
  JM.GFX = GFXM;

  /* ================= the painters: one set of calls (world coordinates, tiles), drawn in 2D or batched as 3D geometry =================
     glow, halo, floorGlow, ring, air, seal, star, beam, funnel, arc, ribbon, blossom, petal, spark. Q.L is the layer being
     painted (0 the marks on the ground, 1 everything over it); Q.c2 the frame's 2D canvas (the model's ring is drawn on it).
     First the 2D kit, in screen pixels: */
  const SPR = new Map();
  function flowerSprite(col, petal) { const key = col + (petal ? 'p' : 'b'); let s = SPR.get(key); if (s) return s; s = document.createElement('canvas'); s.width = s.height = 56; const c = s.getContext('2d'); c.translate(28, 28);
    const g = c.createRadialGradient(0, 0, 2, 0, 0, 26); g.addColorStop(0, col === P.pearl ? '#F1D9D2' : P.rose); g.addColorStop(0.55, col); g.addColorStop(1, col === P.pearl ? '#FFFFFF' : P.blush); c.fillStyle = g;
    if (petal) { c.beginPath(); c.ellipse(0, 0, 24, 12, 0, 0, TAU); c.fill(); }
    else { for (let i = 0; i < 5; i++) { c.save(); c.rotate(i * TAU / 5); c.beginPath(); c.ellipse(14, 0, 12, 8.4, 0, 0, TAU); c.fill(); c.restore(); } c.fillStyle = '#FFDB6B'; c.beginPath(); c.arc(0, 0, 4.2, 0, TAU); c.fill(); }
    SPR.set(key, s); return s; }
  const D2 = { c: null, GY: 0.55, t: 0,
    glow(x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; const c = this.c; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(glowSprite(col || P.mint), x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; },
    floorGlow(x, y, r, a, col) { if (r < 1 || !(a > 0.01)) return; const c = this.c, ry = r * this.GY; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(glowSprite(col || P.mint), x - r, y - ry, r * 2, ry * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; },
    ring(x, y, r, a, col, w, ry) { if (r < 1 || !(a > 0.01)) return; const c = this.c, ryy = ry == null ? r * this.GY : ry, W = w || Math.max(3, r * 0.12), k = ryy / r; c.save(); c.globalCompositeOperation = 'lighter';
      for (const [f, lw, al, cc] of [[0.3, W * 0.6, 0.22, col], [0, Math.max(1.2, W * 0.1), 0.95, P.white]]) { const rr = Math.max(0.5, r - W * f - lw * 0.5); c.strokeStyle = cc || P.mint; c.globalAlpha = Math.min(1, a * al); c.lineWidth = lw; c.beginPath(); c.ellipse(x, y, rr, rr * k, 0, 0, TAU); c.stroke(); } c.restore(); },
    beam(x0, y0, x1, y1, w, col, a) { const c = this.c, Ls = Math.hypot(x1 - x0, y1 - y0); if (Ls < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x0, y0); c.rotate(Math.atan2(y1 - y0, x1 - x0)); c.globalAlpha = Math.min(1, a); c.drawImage(beamSprite(col), 0, -w, Ls, w * 2); c.restore(); },
    air(x, y, rx, ry, a, seed) { if (rx < 2 || !(a > 0.01)) return; const c = this.c, t = this.t; c.save(); c.translate(x, y); c.scale(1, ry / rx); c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round'; c.lineWidth = Math.max(1, rx * 0.035); for (let i = 0; i < 2; i++) { const rr = rx * (0.45 + 0.3 * i), a0 = (seed || 0) + i * 2.6 - t * (2.6 - 0.6 * i); c.strokeStyle = i ? P.mint : P.pale; c.globalAlpha = Math.min(1, a * 0.4); c.beginPath(); c.arc(0, 0, rr, a0, a0 + 1.8); c.stroke(); }
      c.strokeStyle = P.pale; c.globalAlpha = Math.min(1, a * 0.55); c.beginPath(); c.arc(0, 0, rx * 0.93, 0, TAU); c.stroke(); c.restore(); },
    /* the Wind seal: painted once into a picture, then laid on the floor turned and squashed */
    seal(x, y, r, a, rot, u, col) { if (r < 2 || !(a > 0.01)) return; const c = this.c, key = 's' + (col || P.mint); let pic = SPR.get(key);
      if (!pic) { pic = document.createElement('canvas'); pic.width = pic.height = 256; const x2 = pic.getContext('2d'), R = 124; x2.translate(128, 128); x2.strokeStyle = col || P.mint; x2.lineCap = 'round'; x2.lineWidth = 3; x2.beginPath(); x2.arc(0, 0, R * 0.95, 0, TAU); x2.stroke(); x2.lineWidth = 1.6; x2.beginPath(); x2.arc(0, 0, R * 0.87, 0, TAU); x2.stroke();
        const rose = (n, r0, r1) => { x2.beginPath(); for (let i = 0; i <= 96; i++) { const an = i / 96 * TAU, rr = R * (r0 + r1 * Math.abs(Math.cos(n * 0.5 * an))); i ? x2.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : x2.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); } x2.stroke(); }; x2.lineWidth = 2.4; rose(6, 0.52, 0.34); x2.strokeStyle = P.pale; rose(5, 0.2, 0.2);
        for (let i = 0; i < 24; i++) { const an = i / 24 * TAU; x2.beginPath(); x2.moveTo(Math.cos(an) * R * 0.88, Math.sin(an) * R * 0.88); x2.lineTo(Math.cos(an) * R * 0.94, Math.sin(an) * R * 0.94); x2.stroke(); } SPR.set(key, pic); }
      c.save(); c.translate(x, y); c.scale(1, this.GY); c.rotate(rot || 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 0.85 * cl((u == null ? 1 : u) * 1.5)); const k = cl(0.4 + 0.6 * (u == null ? 1 : u)); c.drawImage(pic, -r * k, -r * k, r * 2 * k, r * 2 * k); c.restore(); },
    shade(x, y, rx, ry, a, col) { if (rx < 1 || !(a > 0.01)) return; const c = this.c; c.save(); c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); c.restore(); },
    star(x, y, s, a) { if (!(a > 0.02)) return; const c = this.c; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(beamSprite(P.white), x - s, y - s * 0.07, s * 2, s * 0.14); c.drawImage(beamSprite(P.white), x - s * 0.07, y - s, s * 0.14, s * 2); c.restore(); },
    /* a tornado's funnel: base centre (x, yb), half-width wTop at its top h above, ratio its base / top width */
    funnel(x, yb, wTop, h, ratio, a, spin, seed, col) { if (h < 4 || !(a > 0.01)) return; const c = this.c, t = this.t, key = 'f' + (col || P.mint) + ratio; let pic = SPR.get(key);
      if (!pic) { pic = document.createElement('canvas'); pic.width = 96; pic.height = 192; const x2 = pic.getContext('2d'), wid = q => 48 * lerp(ratio, 1, Math.pow(q, 1.5)), cc = hexRGB(col || P.mint), f = k => `rgba(${cc[0]},${cc[1]},${cc[2]},${k})`, g = x2.createLinearGradient(0, 0, 96, 0); g.addColorStop(0, f(0.6)); g.addColorStop(0.2, f(0.2)); g.addColorStop(0.5, f(0.1)); g.addColorStop(0.8, f(0.2)); g.addColorStop(1, f(0.6)); x2.fillStyle = g;
        x2.beginPath(); for (let i = 0; i <= 10; i++) { const q = i / 10; x2.lineTo(48 - wid(q), 192 - 192 * q); } for (let i = 10; i >= 0; i--) { const q = i / 10; x2.lineTo(48 + wid(q), 192 - 192 * q); } x2.closePath(); x2.fill(); const g2 = x2.createLinearGradient(0, 0, 0, 192); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(0.3, 'rgba(0,0,0,0)'); x2.globalCompositeOperation = 'destination-out'; x2.fillStyle = g2; x2.fillRect(0, 0, 96, 192); SPR.set(key, pic); }
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(pic, x - wTop, yb - h, wTop * 2, h); const wB = wTop * ratio, wid = q => lerp(wB, wTop, Math.pow(q, 1.5));
      c.lineCap = 'round'; c.strokeStyle = P.pale; c.lineWidth = Math.max(1.5, wTop * 0.05); for (let k = 0; k < 3; k++) { const q0 = ((k / 3 + t * spin * 0.035 + (seed || 0) * 0.37) % 1 + 1) % 1; c.globalAlpha = Math.min(1, a * 0.7 * Math.sin(q0 * PI)); c.beginPath(); for (let i = 0; i <= 4; i++) { const q = cl(q0 + (i / 4 - 0.5) * 0.2), xs = -Math.cos(i / 4 * PI); c.lineTo(x + xs * wid(q) * 0.96, yb - h * q); } c.stroke(); }
      c.restore(); },
    /* a wind ribbon round a centre: its outer edge on the ellipse (rx, ry), sharp and bright; its body fading inward over w */
    arcRibbon(cx, cy, rx, ry, a0, span, w, col, a) { if (rx < 2 || !(a > 0.02)) return; const c = this.c, k = ry / rx; c.save(); c.translate(cx, cy); c.scale(1, k); c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';
      for (const [f, lw, al, cc] of [[0.42, w * 0.5, 0.13, col], [0.12, w * 0.22, 0.32, col]]) { const rr = rx - w * f; if (rr < 1) continue; c.strokeStyle = cc || P.mint; c.globalAlpha = Math.min(1, a * al); c.lineWidth = lw; c.beginPath(); c.arc(0, 0, rr, a0 + span * 0.08, a0 + span * 0.92, span < 0); c.stroke(); }
      c.lineCap = 'round'; c.strokeStyle = P.white; c.globalAlpha = Math.min(1, a * 0.9); c.lineWidth = Math.max(1.2, w * 0.07); c.beginPath(); c.arc(0, 0, rx, a0 + span * 0.1, a0 + span * 0.9, span < 0); c.stroke(); c.restore(); },
    /* a wind ribbon along a path (flat x, y pairs: its outer edge); the body lies to `side` of it */
    ribbon(pts, n, w, side, col, a) { if (n < 2 || !(a > 0.02)) return; const c = this.c; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      const trace = off => { c.beginPath(); for (let i = 0; i < n; i++) { const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), dx = pts[i1 * 2] - pts[i0 * 2], dy = pts[i1 * 2 + 1] - pts[i0 * 2 + 1], d = Math.hypot(dx, dy) || 1, k = off * Math.sin(PI * i / (n - 1)) * side; const x = pts[i * 2] + dy / d * k, y = pts[i * 2 + 1] - dx / d * k; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
      for (const [f, lw, al] of [[0.6, w * 0.4, 0.07], [0.32, w * 0.3, 0.16], [0.12, w * 0.2, 0.3]]) { c.strokeStyle = col || P.mint; c.globalAlpha = Math.min(1, a * al); c.lineWidth = lw; trace(w * f); }
      c.strokeStyle = P.white; c.globalAlpha = Math.min(1, a * 0.9); c.lineWidth = Math.max(1.2, w * 0.07); trace(0); c.restore(); },
    blossom(x, y, s, rot, col, a) { if (!(a > 0.02)) return; const c = this.c; c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = Math.min(1, a); c.drawImage(flowerSprite(col || P.pink, false), -s, -s, s * 2, s * 2); c.restore(); },
    petal(x, y, s, rot, col, a) { if (!(a > 0.02)) return; const c = this.c; c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = Math.min(1, a); c.drawImage(flowerSprite(col || P.pink, true), -s, -s, s * 2, s * 2); c.restore(); },
    spark(x, y, s, col, a) { if (!(a > 0.02)) return; const c = this.c; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(glowSprite(col || P.pale), x - s, y - s, s * 2, s * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } };
  /* the 2D painter: the same calls (world coordinates, tiles), each laid on the screen with the kit of sprites above */
  const TMP = new Float32Array(2 * 40);
  const P2 = { H: null, T: 1, Z: 1, GY: 0.55, t: 0, L: 1, c2: null, lite2d: true, px: 0, py: 0, pr: 0,
    off(x, y) { return this.pr > 0 && Math.hypot(x - this.px, y - this.py) < this.pr; },   /* (the pet's face: sprites keep out of a hole round its seat) */
    sx(x) { return this.H.sx(x); }, sy(y, z) { return this.H.sy(y) - (z || 0) * this.Z; },
    shade(x, y, r, a, col) { if (!this.L) D2.shade(this.sx(x), this.sy(y, 0), r * this.T, r * this.T * this.GY, a, col); },   /* (the water's dark body on the floor: solid, under the creatures) */
    glow(x, y, z, r, col, a) { if (this.L) D2.glow(this.sx(x), this.sy(y, z), r * this.T, col, a); },
    halo(x, y, z, r, a, col, w) { if (this.L) D2.ring(this.sx(x), this.sy(y, z), r * this.T, a, col, (w || 0.4) * this.T, r * this.T); },
    floorGlow(x, y, z, r, a, col) { if (!this.L && r <= 4) D2.floorGlow(this.sx(x), this.sy(y, z), r * this.T, a, col); },
    ring(x, y, z, r, a, col, w) { if ((z < 0.25) !== !this.L) return; D2.ring(this.sx(x), this.sy(y, z), r * this.T, a, col, (w || 0.4) * this.T); },
    air(x, y, z, r, a, seed) { if ((z < 0.25) !== !this.L || r < 2.5) return; D2.air(this.sx(x), this.sy(y, z), r * this.T, r * this.T * this.GY, a, seed); },
    seal(x, y, z, r, a, rot, u, col) { if (!this.L) D2.seal(this.sx(x), this.sy(y, z), r * this.T, a, rot, u, col); },
    star(x, y, z, s, a) { if (this.L) D2.star(this.sx(x), this.sy(y, z), s * this.T, a); },
    beam(x0, y0, z0, x1, y1, z1, w, col, a) { if (this.L) D2.beam(this.sx(x0), this.sy(y0, z0), this.sx(x1), this.sy(y1, z1), w * this.T, col, a); },
    funnel(x, y, z, rTop, h, ratio, a, spin, seed, col) { if (this.L) D2.funnel(this.sx(x), this.sy(y, z), rTop * this.T, h * this.Z, ratio, a, spin, seed, col); },
    arc(x, y, z, r, a0, span, w, col, a, rise) { if (this.L) D2.arcRibbon(this.sx(x), this.sy(y, z + (rise || 0) * 0.5), r * this.T, r * this.T * this.GY, a0, span, w * this.T, col, a); },
    ribbon(pts, n, w, side, col, a) { if (!this.L) return; n = Math.min(n, 40); for (let i = 0; i < n; i++) { TMP[i * 2] = this.sx(pts[i * 3]); TMP[i * 2 + 1] = this.sy(pts[i * 3 + 1], pts[i * 3 + 2]); } D2.ribbon(TMP, n, w * this.T, side, col, a); },
    blossom(x, y, z, s, rot, col, a) { const X = this.sx(x), Y = this.sy(y, z); if (this.L && !this.off(X, Y)) D2.blossom(X, Y, s * this.T, rot, col, a); },
    petal(x, y, z, s, rot, col, a) { const X = this.sx(x), Y = this.sy(y, z); if (this.L && !this.off(X, Y)) D2.petal(X, Y, s * this.T, rot, col, a); },
    spark(x, y, z, s, col, a) { const X = this.sx(x), Y = this.sy(y, z); if (this.L && !this.off(X, Y)) D2.spark(X, Y, s * this.T, col, a); },
    tooth(x, y, z, len, el, col, a) { if (!this.L || !(a > 0.02)) return; const c = D2.c, X = this.sx(x), Y = this.sy(y, z), tx = X, ty = Y + (Math.cos(el) * this.GY * this.T - Math.sin(el) * this.Z) * len, w = 0.2 * len * this.T; c.save(); c.globalAlpha = Math.min(1, a * 0.8); const g = c.createLinearGradient(X, Y, tx, ty); g.addColorStop(0, P.blush); g.addColorStop(1, P.white); c.fillStyle = g; c.beginPath(); c.moveTo(X - w, Y); c.lineTo(tx, ty); c.lineTo(X + w, Y); c.closePath(); c.fill(); c.globalAlpha = Math.min(1, a); c.strokeStyle = P.white; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X - w, Y); c.lineTo(tx, ty); c.stroke(); c.restore(); } };
  /* the GPU painter: the same calls batched as geometry in the world (a frame local to the caster: x east, y toward the
     camera, z up; a circle on the ground stays a circle there and the camera squashes it) */
  const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const q = hexRGB(h || P.mint); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGB.set(h, v); } return v; };
  const QV = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]], QA = [0, 0, 0, 0], QB = [0, 0, 0, 0];
  const grow = (A, need) => { if (need <= A.length) return A; const q = new Float32Array(Math.max(A.length * 2, need)); q.set(A); return q; };
  const PG = { quads: new Float32Array(15 * 6 * 300), nq: 0, rib: new Float32Array(9 * 6 * 14 * 150), nr: 0, fun: new Float32Array(14 * 24), nf: 0, flo: new Float32Array(12 * 300), nb: 0, pet: new Float32Array(12 * 300), np: 0, tth: new Float32Array(12 * 64), nth: 0,
    L: 1, ox: 0, oy: 0, ky: 1, Tx: 1, zk: 0.8, GY: 0.55, t: 0, c2: null, T: 1, Z: 1, kc: null, ka: 0, kk: 0, k0: 0, k1: 0, k2: 0,
    begin(o) { Object.assign(this, o); this.nq = this.nr = this.nf = this.nb = this.np = this.nth = 0; },
    lx(x) { return x - this.ox; }, ly(y) { return (y - this.oy) * this.ky; },
    set(kind, col, al, q0, q1, q2) { this.kk = kind; this.kc = rgbOf(col); this.ka = al > 1 ? 1 : al; this.k0 = q0 || 0; this.k1 = q1 || 0; this.k2 = q2 || 0; this.quads = grow(this.quads, (this.nq + 6) * 15); },
    qv(x, y, z, ox, oy, u, v) { const A = this.quads, c = this.kc; let o = this.nq * 15; A[o++] = x; A[o++] = y; A[o++] = z; A[o++] = ox; A[o++] = oy; A[o++] = u; A[o++] = v; A[o++] = this.kk; A[o++] = c[0]; A[o++] = c[1]; A[o++] = c[2]; A[o++] = this.ka; A[o++] = this.k0; A[o++] = this.k1; A[o] = this.k2; this.nq++; },
    /* a quad lying flat at height z (radius r tiles), or facing the camera (half sizes in tiles) */
    flat(kind, x, y, z, r, col, al, q0, q1, q2) { if (!(al > 0.004) || !(r > 0.01)) return; this.set(kind, col, al, q0, q1, q2); const X = this.lx(x), Y = this.ly(y); for (let j = 0; j < 6; j++) this.qv(X + QV[j][0] * r, Y + QV[j][1] * r, z, 0, 0, QV[j][0], QV[j][1]); },
    bill(kind, x, y, z, r, col, al, q0, q1, q2) { if (!(al > 0.004) || !(r > 0.01)) return; this.set(kind, col, al, q0, q1, q2); const X = this.lx(x), Y = this.ly(y), k = r * this.Tx; for (let j = 0; j < 6; j++) this.qv(X, Y, z, QV[j][0] * k, QV[j][1] * k, QV[j][0], QV[j][1]); },
    shade(x, y, r, a, col) { if (this.L || !this.c2) return; D2.c = this.c2; D2.shade(this.H.sx(x), this.H.sy(y), r * this.T, r * this.T * this.GY, a, col); },
    glow(x, y, z, r, col, a) { if (this.L) this.bill(0, x, y, z, r, col || P.mint, a); },
    halo(x, y, z, r, a, col, w) { if (this.L) this.bill(1, x, y, z, r * 1.03, col || P.mint, a, 0.97, Math.max(0.02, (w || 0.4) / r * 0.5), 0); },
    floorGlow(x, y, z, r, a, col) { if (!this.L) this.flat(0, x, y, z, r, col || P.mint, a); },
    ring(x, y, z, r, a, col, w) { if ((z < 0.25) !== !this.L) return; this.flat(1, x, y, z, r * 1.03, col || P.mint, a, 0.97, Math.max(0.02, (w || 0.4) / r * 0.5), 0); },
    air(x, y, z, r, a, seed) { if ((z < 0.25) !== !this.L) return; this.flat(3, x, y, z, r, P.mint, a, 0, 0, (seed || 0) * 1.7); },
    seal(x, y, z, r, a, rot, u, col) { if (!this.L) this.flat(4, x, y, z, r, col || P.mint, a * 0.9, rot || 0, u == null ? 1 : cl(u), 0); },
    star(x, y, z, s, a) { if (this.L) this.bill(5, x, y, z, s, P.white, a); },
    beam(x0, y0, z0, x1, y1, z1, w, col, a) { if (!this.L || !(a > 0.004)) return; const X0 = this.lx(x0), Y0 = this.ly(y0), X1 = this.lx(x1), Y1 = this.ly(y1), dx = (X1 - X0), dy = (Y1 - Y0) * this.GY - (z1 - z0) * this.zk, d = Math.hypot(dx, dy); if (d < 1e-4) return;
      const px = -dy / d * w * this.Tx, py = dx / d * w * this.Tx; this.set(2, col, a); this.qv(X0, Y0, z0, -px, -py, -1, -1); this.qv(X1, Y1, z1, -px, -py, 1, -1); this.qv(X0, Y0, z0, px, py, -1, 1); this.qv(X0, Y0, z0, px, py, -1, 1); this.qv(X1, Y1, z1, -px, -py, 1, -1); this.qv(X1, Y1, z1, px, py, 1, 1); },
    /* a tornado: two shells of the funnel surface turning against each other */
    funnel(x, y, z, rTop, h, ratio, a, spin, seed, col) { if (!this.L || !(a > 0.01) || h < 0.05) return; this.fun = grow(this.fun, (this.nf + 2) * 14); const c = rgbOf(col || P.mint), X = this.lx(x), Y = this.ly(y);
      for (const [sc, dir, al] of [[0.6, -1, 0.7], [1, 1, 1]]) { const A = this.fun; let o = this.nf * 14; A[o++] = X; A[o++] = Y; A[o++] = z; A[o++] = rTop; A[o++] = h; A[o++] = ratio; A[o++] = spin; A[o++] = (seed || 0) + (dir < 0 ? 3.3 : 0); A[o++] = c[0]; A[o++] = c[1]; A[o++] = c[2]; A[o++] = Math.min(1, a * al); A[o++] = sc; A[o] = dir; this.nf++; } },
    rv(x, y, z, u, v, c, a) { const A = this.rib; let o = this.nr * 9; A[o++] = x; A[o++] = y; A[o++] = z; A[o++] = u; A[o++] = v; A[o++] = c[0]; A[o++] = c[1]; A[o++] = c[2]; A[o] = a; this.nr++; },
    /* a ribbon round a vertical axis, lying in the wind's plane at height z (rising `rise` over its length): its outer edge at r */
    arc(x, y, z, r, a0, span, w, col, a, rise) { if (!this.L || r < 0.05 || !(a > 0.02)) return; const N = 14, c = rgbOf(col || P.mint), al = a > 1 ? 1 : a, X = this.lx(x), Y = this.ly(y); this.rib = grow(this.rib, (this.nr + N * 6) * 9); let ox = 0, oy = 0, ix = 0, iy = 0, oz = 0;
      for (let i = 0; i <= N; i++) { const v = i / N, an = a0 + span * v, ri = Math.max(0, r - w * (0.3 + 0.7 * Math.sin(PI * v))), co = Math.cos(an), si = Math.sin(an), x1 = X + co * r, y1 = Y + si * r, x0 = X + co * ri, y0 = Y + si * ri, zz = z + (rise || 0) * v;
        if (i) { const v0 = (i - 1) / N; this.rv(ix, iy, oz, 0, v0, c, al); this.rv(ox, oy, oz, 1, v0, c, al); this.rv(x0, y0, zz, 0, v, c, al); this.rv(x0, y0, zz, 0, v, c, al); this.rv(ox, oy, oz, 1, v0, c, al); this.rv(x1, y1, zz, 1, v, c, al); } ox = x1; oy = y1; ix = x0; iy = y0; oz = zz; } },
    /* a ribbon along a path in the world (flat x, y, z: its outer edge); the band lies level, to `side` of it */
    ribbon(pts, n, w, side, col, a) { if (!this.L || n < 2 || !(a > 0.02)) return; const c = rgbOf(col || P.mint), al = a > 1 ? 1 : a; this.rib = grow(this.rib, (this.nr + n * 6) * 9); let ox = 0, oy = 0, ix = 0, iy = 0, oz = 0;
      for (let i = 0; i < n; i++) { const v = i / (n - 1), i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), dx = pts[i1 * 3] - pts[i0 * 3], dy = (pts[i1 * 3 + 1] - pts[i0 * 3 + 1]) * this.ky, d = Math.hypot(dx, dy) || 1, k = w * (0.3 + 0.7 * Math.sin(PI * v)) * side, x1 = this.lx(pts[i * 3]), y1 = this.ly(pts[i * 3 + 1]), zz = pts[i * 3 + 2], x0 = x1 + dy / d * k, y0 = y1 - dx / d * k;
        if (i) { const v0 = (i - 1) / (n - 1); this.rv(ix, iy, oz, 0, v0, c, al); this.rv(ox, oy, oz, 1, v0, c, al); this.rv(x0, y0, zz, 0, v, c, al); this.rv(x0, y0, zz, 0, v, c, al); this.rv(ox, oy, oz, 1, v0, c, al); this.rv(x1, y1, zz, 1, v, c, al); } ox = x1; oy = y1; ix = x0; iy = y0; oz = zz; } },
    /* a flower: turned by rot about its own axis, its face tipped by tilt (toward the camera for a negative tilt) and swung by yaw */
    inst(pet, x, y, z, s, rot, col, a, tilt, yaw) { if (!this.L || !(a > 0.02)) return; let A = pet === 2 ? this.tth : pet ? this.pet : this.flo; const n = pet === 2 ? this.nth : pet ? this.np : this.nb; A = grow(A, (n + 1) * 12); if (pet === 2) { this.tth = A; this.nth++; } else if (pet) { this.pet = A; this.np++; } else { this.flo = A; this.nb++; }
      const t2 = (tilt == null ? -0.9 : tilt) * 0.5, r2 = (rot || 0) * 0.5, y2 = (yaw || 0) * 0.5; QA[0] = Math.sin(t2) * Math.cos(r2); QA[1] = -Math.sin(t2) * Math.sin(r2); QA[2] = Math.cos(t2) * Math.sin(r2); QA[3] = Math.cos(t2) * Math.cos(r2);   /* (qx(tilt) * qz(rot)) */
      const sz = Math.sin(y2), cz = Math.cos(y2); QB[0] = cz * QA[0] - sz * QA[1]; QB[1] = cz * QA[1] + sz * QA[0]; QB[2] = cz * QA[2] + sz * QA[3]; QB[3] = cz * QA[3] - sz * QA[2];                                                          /* (qz(yaw) * that) */
      const c = rgbOf(col || P.pink); let o = n * 12; A[o++] = this.lx(x); A[o++] = this.ly(y); A[o++] = z; A[o++] = s; A[o++] = QB[0]; A[o++] = QB[1]; A[o++] = QB[2]; A[o++] = QB[3]; A[o++] = c[0]; A[o++] = c[1]; A[o++] = c[2]; A[o] = a > 1 ? 1 : a; },
    blossom(x, y, z, s, rot, col, a, tilt, yaw) { this.inst(false, x, y, z, s, rot, col, a, tilt, yaw); }, petal(x, y, z, s, rot, col, a, tilt, yaw) { this.inst(true, x, y, z, s * 0.62, rot, col, a, tilt, yaw); },
    /* a crystal tooth: its root at (x, y, z), `len` long, pointing along (0, cos el, sin el) (el: its elevation, toward the camera at 0) */
    tooth(x, y, z, len, el, col, a) { this.inst(2, x, y, z, len, PI / 2, col || P.pale, a, el, 0); },
    spark(x, y, z, s, col, a) { if (this.L) { this.bill(0, x, y, z, s * 1.6, col || P.pale, a); this.bill(0, x, y, z, s * 0.6, P.white, a); } } };

  /* ================= the frame of a session: its effects (items) and particles, updated and painted in one fx =================
     Two layers a frame: the marks on the ground under the creatures (drawUnder), everything that stands or flies over them (draw). */
  const GS = { fx: null, ctx: null, items: [], parts: [] };
  function frame(ctx) { if (GS.fx && GS.fx.life > 0 && GS.ctx && GS.ctx.H === ctx.H) { GS.ctx = ctx; return GS; } GS.ctx = ctx; GS.items = []; GS.parts = []; const H = ctx.H, X = H.X;
    const pass = (c, layer) => { const T = X.Tz(), Z = T * zk(GS.ctx, T), t = GS.fx.t || 0, GY = H.GY || 0.55; let Q;
      const paint = () => { for (const it of GS.items) { try { it.paint(Q, it); } catch (e) { /* (one effect's picture) */ } }
        if (layer) for (const p of GS.parts) { const u = p.t / p.life, a = Math.min(1, (1 - u) * 3) * Math.min(1, p.t * 8) * p.a; if (p.kind === 0) Q.spark(p.x, p.y, p.z, p.size * (1 - 0.5 * u), p.col, a); else if (p.kind === 1) Q.blossom(p.x, p.y, p.z, p.size, p.rot, p.col, a, -0.9 + 0.7 * Math.sin(p.t * 2.3 + p.ph), p.ph + p.t * p.vr * 0.4); else Q.petal(p.x, p.y, p.z, p.size, p.rot, p.col, a, 1.2 * Math.sin(p.t * 3.1 + p.ph), p.ph + p.t * p.vr * 0.5); } };
      if (!GS.items.length && !GS.parts.length) return;
      if (!layer) { let oc = 0; for (const it of GS.items) if (it.ocean > oc) oc = it.ocean; if (oc > 0.01) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(3,9,36,${(0.74 * Math.min(1, oc)).toFixed(3)})`; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); } }   /* (Shark Attack's midnight ocean: the floor darkens under the creatures) */
      if (gpuOn()) { const B = c.getTransform(), cv0 = c.canvas, G = TUNE.gpu, k0 = Math.min(LOW() ? G.resLow : G.res, G.maxSide / Math.max(cv0.width, cv0.height)), W = Math.max(8, Math.round(cv0.width * k0)), Hh = Math.max(8, Math.round(cv0.height * k0)), kx = W / cv0.width;
        const v = GS.ctx.vehicle || {}, ox = v.x || 0, oy = v.y || 0, SX0 = H.sx(ox), SY0 = H.sy(oy), Tx = (H.sx(ox + 1) - SX0) || T, Ty = (H.sy(oy + 1) - SY0) || T, A = B.a * kx, Bb = B.b * kx, Cc = B.c * kx, D = B.d * kx, E = B.e * kx, Ff = B.f * kx, zr = Z / Tx, nn = Math.hypot(zr, GY), cy = zr / nn, cz = GY / nn;
        PG.begin({ H, L: layer, ox, oy, ky: Ty / (Tx * GY), Tx, zk: zr, GY, t, c2: c, T, Z }); Q = PG; paint();
        const PX = [A * Tx * 2 / W, Cc * Tx * GY * 2 / W, -Cc * Z * 2 / W, (A * SX0 + Cc * SY0 + E) * 2 / W - 1], PY = [-Bb * Tx * 2 / Hh, -D * Tx * GY * 2 / Hh, D * Z * 2 / Hh, 1 - (Bb * SX0 + D * SY0 + Ff) * 2 / Hh];
        const st = anchor(GS.ctx, 'seat'), lx = PG.lx(st.x), ly = PG.ly(st.y), lz = st.z + 0.35, hole = 0.42 * Tx * Math.abs(A), bright = !layer || !v.x && !v.y || GS.items.some(it => it.bright);   /* (the pet's face: a soft hole about 0.8 tiles wide; not on the ground layer, which lies under the pet anyway) */
        const cvG = GFXM.render({ W, H: Hh, t, ground: !layer, px: PX, py: PY, pet: [PX[0] * lx + PX[1] * ly + PX[2] * lz + PX[3], PY[0] * lx + PY[1] * ly + PY[2] * lz + PY[3], bright ? 0 : 1], pa: [W / 2 / hole, Hh / 2 / hole], pd: [0, -cy / 60, -cz / 60, 0], ps: [A * 2 / W, -D * 2 / Hh], v: [0, cy, cz], l: [-0.34, 0.47, 0.81],
          quads: PG.quads, nq: PG.nq, rib: PG.rib, nr: PG.nr, fun: PG.fun, nf: PG.nf, flo: PG.flo, nb: PG.nb, pet: PG.pet, np: PG.np, tth: PG.tth, nth: PG.nth });
        if (cvG) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); GFXM.blit(c, W, Hh, 0, 0, cv0.width, cv0.height, !layer); c.restore(); } }
      else { D2.c = c; D2.GY = GY; D2.t = t; P2.H = H; P2.T = T; P2.Z = Z; P2.GY = GY; P2.t = t; P2.L = layer; P2.c2 = c; { const st = anchor(GS.ctx, 'seat'); P2.px = H.sx(st.x); P2.py = H.sy(st.y) - (st.z + 0.35) * Z; P2.pr = GS.items.some(it => it.bright) ? 0 : 0.75 * T; } Q = P2; c.save(); paint(); c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } };
    GS.fx = H.add({ key: 'jaws-moves', life: 1e9, t: 0,
      update(dt, ff) { const PA = GS.parts; ff.t = (ff.t || 0) + dt; for (let i = PA.length - 1; i >= 0; i--) { const p = PA[i]; p.t += dt; if (p.t >= p.life) { PA[i] = PA[PA.length - 1]; PA.pop(); continue; }
          const dr = Math.max(0, 1 - p.drag * dt); p.vx *= dr; p.vy *= dr; p.vz = p.vz * dr - p.g * dt; p.x += (p.vx + Math.sin(p.t * 3 + p.ph) * p.fl) * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0.05) { p.z = 0.05; p.vz = 0; p.vx *= 0.9; p.vy *= 0.9; p.vr *= 0.9; } }
        for (let i = GS.items.length - 1; i >= 0; i--) { const it = GS.items[i]; if (it.life > 0 && !it.keep && !live(it.ctx)) { it.life = 0; if (it.abort) try { it.abort(); } catch (e) {} } if (it.life > 0) { try { it.update(dt, it); } catch (e) { it.life = 0; if (it.abort) try { it.abort(); } catch (e2) {} } } if (!(it.life > 0)) GS.items.splice(i, 1); }
        if (!GS.items.length && !PA.length) ff.life = 0; },
      drawUnder(c) { pass(c, 0); }, draw(c) { pass(c, 1); } });
    return GS; }
  function add(ctx, it) { it.ctx = ctx; if (!(it.life > 0)) it.life = 60; frame(ctx).items.push(it); return it; }
  /* particles: kind 0 a spark, 1 a blossom, 2 a petal; thrown from (x, y, z) */
  const PINKS = [P.pink, P.pink, P.blush, P.rose, P.pearl];
  function emit(ctx, kind, x, y, z, n, o) { const G = frame(ctx); o = o || {}; const flat = !gpuOn(); n = Math.max(1, Math.round(n * (LOW() ? 0.5 : 1) * (flat ? 0.45 : 1))); if (G.parts.length > (flat ? 110 : 420)) return;   /* (the 2D path: fewer, larger) */
    while (n-- > 0) { const a = o.dir != null ? o.dir + rnd(-1, 1) * (o.spread != null ? o.spread : PI) : Math.random() * TAU, sp = (o.v != null ? o.v : 3) * (0.35 + 0.65 * Math.random());
      G.parts.push({ kind, x: x + rnd(-1, 1) * (o.r || 0), y: y + rnd(-1, 1) * (o.r || 0) * 0.6, z: Math.max(0.05, z + rnd(-1, 1) * (o.rz || 0)), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: (o.up != null ? o.up : 1.5) * (0.4 + 0.9 * Math.random()), g: o.g != null ? o.g : kind === 0 ? 0.5 : 1.6, drag: o.drag != null ? o.drag : 1.4, fl: kind === 0 ? 0 : 0.7, ph: Math.random() * TAU,
        rot: Math.random() * TAU, vr: rnd(-4, 4), t: 0, life: (o.life || (kind === 0 ? 0.6 : 1.5)) * (0.6 + 0.6 * Math.random()), size: (o.size || (kind === 0 ? 0.12 : kind === 1 ? 0.38 : 0.28)) * (0.8 + 0.4 * Math.random()) * (flat && kind ? 1.3 : 1), col: o.col || (kind === 0 ? (Math.random() < 0.5 ? P.pale : P.mint) : PINKS[(Math.random() * PINKS.length) | 0]), a: 1 }); } }

  /* ================= Tidal Pools: the core owns the records; this is their look (and a stand-in registry for a core without one) ================= */
  function localPools(ctx) { const L = []; let id = 0; const get = i => L.find(q => q.id === i);
    return { list: () => L.filter(p => p.state !== 'consumed'), at: (x, y) => L.find(p => p.state === 'available' && Math.hypot(p.x - x, p.y - y) < p.r) || null,
      create(x, y, r) { const near = L.find(p => p.state !== 'consumed' && Math.hypot(p.x - x, p.y - y) < Math.max(p.r, r)); if (near) { if (near.state === 'available') near.born = now(ctx); return near; }   /* (a hit on a pool refreshes it) */
        const lv = L.filter(p => p.state !== 'consumed'); if (lv.length >= 3) { const old = lv.filter(p => p.state === 'available').sort((a, b) => a.born - b.born)[0]; if (!old) return null; old.state = 'consumed'; }   /* (a fourth replaces the oldest available; claims hold their slots) */
        const p = { id: ++id, x, y, r, born: now(ctx), state: 'available' }; L.push(p); return p; },
      claim(i, owner) { const p = get(i); if (!p || p.state !== 'available') return false; p.state = 'claimed'; p.owner = owner; return true; }, release(i) { const p = get(i); if (p && p.state === 'claimed') { p.state = 'available'; p.owner = null; } },
      consume(i) { const p = get(i); if (p) p.state = 'consumed'; }, clear() { for (const p of L) p.state = 'consumed'; } }; }
  const poolsOf = ctx => { try { const p = ctx.pools; if (p && typeof p.list === 'function') return p; } catch (e) {} const S = SS(ctx); return S.pools || (S.pools = localPools(ctx)); };
  function poolFx(ctx) { const S = SS(ctx); if (S.poolItem && S.poolItem.life > 0) return S.poolItem; const seen = new Map();
    return S.poolItem = add(ctx, { life: 1e9, update(dt, it) { let L = []; try { L = poolsOf(ctx).list() || []; } catch (e) {} it.L = L; const t = now(ctx); for (const p of L) if (!seen.has(p.id)) seen.set(p.id, t); if (!L.length && it.idle++ > 120) { it.life = 0; S.poolItem = null; } else if (L.length) it.idle = 0; },
      paint(Q, it) { const t = now(ctx), tt = Q.t; for (const p of it.L || []) { if (p.hide) continue; const a = sm((t - (seen.get(p.id) || t)) / 0.35), cl2 = p.state === 'claimed', fr = Math.max(0, 1 - (t - p.born) / 0.5), r = p.r * (0.6 + 0.4 * eout((t - (seen.get(p.id) || t)) / 0.4));
          // depth (a darker body, deeper at its centre), currents, the luminous boundary, a little foam; a claimed pool runs faster and its rim turns pale gold
          Q.shade(p.x, p.y, r, 0.5 * a, '#0A2F7A'); Q.shade(p.x, p.y, r * 0.55, 0.38 * a, '#05163F'); Q.air(p.x, p.y, 0.03, r, (cl2 ? 0.75 : 0.5) * a, p.id * 1.3 + (cl2 ? tt * 2 : 0)); Q.floorGlow(p.x, p.y, 0.02, r * 1.15, (0.18 + 0.3 * fr) * a, P.pink);
          Q.ring(p.x, p.y, 0.04, r, (0.8 + 0.2 * fr) * a, cl2 ? P.gold : P.mint, 0.45); if (cl2) Q.ring(p.x, p.y, 0.05, r * (0.55 + 0.25 * Math.sin(tt * 6)), 0.6 * a, P.pale, 0.3);
          for (let i = 0; i < 3; i++) Q.arc(p.x, p.y, 0.06, r * (0.93 - 0.2 * i), tt * (cl2 ? 2.4 : 0.8) * (i % 2 ? -1 : 1) + i * 2.1 + p.id, 0.9, 0.22, P.pearl, 0.4 * a, 0); } } }); }

  /* displacement: bosses (lesser ones too), brutes and rooted enemies resist it; the rest are drawn toward a point */
  const carry = (ctx, m, x, y, step) => { if (!m || m.dead) return false; try { if (typeof ctx.movable === "function" && !ctx.movable(m)) return false; return ctx.H.pull(m, x, y, step); } catch (e) { return false; } };
  /* ================= shared water pictures ================= */
  /* a geyser at (x, y): a column of water of radius r rising h tiles, a pressure ring, sheets of spray */
  function geyser(ctx, x, y, r, h, o) { o = o || {}; const X = ctx.H.X, dur = o.dur || 0.9, L = LOW(); let t = 0;
    emit(ctx, 0, x, y, 0.3, L ? 8 : 18, { v: 3 + r * 2, up: 3 + h, life: 0.9 }); emit(ctx, 2, x, y, 0.3, L ? 6 : 14, { v: 2 + r * 2, up: 2 + h * 1.2, life: 1.1, size: 0.16 });
    return add(ctx, { life: 9, keep: true, update(dt, it) { t += dt; if (t > dur) it.life = 0; },
      paint(Q) { const u = t / dur, up = eout(u / 0.3), fall = sm((u - 0.5) / 0.5), a = 1 - sm((u - 0.6) / 0.4), hh = h * up * (1 - 0.35 * fall), tt = Q.t;
        Q.shade(x, y, r * 1.2, 0.3 * a, '#0A2F7A'); Q.floorGlow(x, y, 0.02, r * 2, 0.6 * (1 - u), P.pale); Q.ring(x, y, 0.04, r * (0.6 + (o.ring || 2.2) * eout(u)), 1 - u, P.pale, 0.6); Q.ring(x, y, 0.05, r * (0.3 + (o.ring || 2.2) * 0.6 * eout(u)), 0.7 * (1 - u), P.mint, 0.4);
        Q.funnel(x, y, 0, r * (0.75 + 0.5 * u), hh, 0.62, 0.95 * a, 14, x + y, P.pink); Q.funnel(x, y, 0, r * 0.45, hh * 1.12, 0.5, 0.9 * a, 20, x - y, P.pale);
        for (let i = 0; i < 5; i++) Q.arc(x, y, hh * (0.25 + 0.17 * i), r * (0.9 + 0.5 * u + 0.12 * i), tt * 5 + i * 1.7, 2.2, 0.5, i % 2 ? P.pearl : P.mint, a * 0.9, 0.5);
        Q.glow(x, y, hh * 0.5, r * 2.2, P.mint, 0.35 * a); if (u < 0.25) Q.glow(x, y, 0.8, r * 3, P.white, 0.7 * (1 - u / 0.25)); } }); }
  const boom = (ctx, x, y, r, big) => { const X = ctx.H.X; sfx(X, 'splash'); sfx(X, big ? 'crash' : 'thud'); sfx(X, 'hiss', big ? 1.1 : 0.6, 0.25, 900); sfx(X, 'note', big ? 55 : 90, big ? 1.2 : 0.5, 'sine', big ? 0.7 : 0.4, 30); shake(ctx, big ? 12 : 5, big ? 0.45 : 0.2); X.light && X.light(x, y, r * 1.6, 0.5); };
  /* an oval hit laid along `ang` (the core's hitOval; without it, its hit per monster) */
  function hitO(ctx, cx, cy, rx, ry, ang, dmg, o) { if (!live(ctx)) return 0; try { if (ctx.hitOval) return ctx.hitOval(cx, cy, rx, ry, ang, dmg, o) || 0; } catch (e) { return 0; }
    let n = 0; const ca = Math.cos(ang), sa = Math.sin(ang), seen = o && o.once ? (o.once.__seen || (o.once.__seen = new Set())) : null; for (const m of monsOf(ctx)) { if (gone(m)) continue; const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, w = -dx * sa + dy * ca, pr = m.r || 0.4; if ((u * u) / ((rx + pr) ** 2) + (w * w) / ((ry + pr) ** 2) >= 1) continue; if (seen) { if (seen.has(m)) continue; seen.add(m); } try { ctx.hit(m, dmg, o); n++; } catch (e) {} } return n; }

  /* ================= Water Ray ================= */
  function waterRay(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, tu = TUNE.ray, aim = aimOf(ctx, tu.reach), pts = new Float32Array(3 * 16); let t = 0, ph = 0, m0 = anchor(ctx, 'mouth'); poolFx(ctx);
    sfx(X, 'note', 220, tu.charge, 'sawtooth', 0.06, 880); sfx(X, 'hiss', tu.charge, 0.12, 2400); sfx(X, 'hum');
    add(ctx, { life: 9, abort() { clip(ctx, 'rest'); done(); },
      update(dt, it) { t += dt; m0 = anchor(ctx, 'mouth');
        if (it.poolT && now(ctx) >= it.poolT) { it.poolT = 0; try { const p = poolsOf(ctx).create(aim.x, aim.y, tu.poolR); if (p) stats.pools++; } catch (e) {} if (ph === 3) it.life = 0; }   /* (the pool forms as the geyser falls back: no damage, no charge of its own) */
        if (ph === 3) return;
        if (ph === 0) { clip(ctx, 'rayCharge', t / tu.charge); if (t >= tu.charge) { ph = 1; t = 0; sfx(X, 'whoosh'); sfx(X, 'note', 1200, tu.beam, 'sawtooth', 0.07, 500); sfx(X, 'hiss', tu.beam + 0.2, 0.3, 1600); shake(ctx, 3, 0.15); } }
        else if (ph === 1) { clip(ctx, 'rayFire', t / tu.beam); if (t >= tu.travel && !it.hit) { it.hit = true;   /* (ONE authored explosion at the impact; the beam itself deals nothing) */
            stats.rayHits += hitA(ctx, aim.x, aim.y, tu.r, dkOf(ctx) * tu.dmg, { once: {}, el: 'water', src: 'strong', kb: 3 }); boom(ctx, aim.x, aim.y, tu.r); geyser(ctx, aim.x, aim.y, tu.r * 0.55, 3.6); X.hitstop && X.hitstop(0.04); emit(ctx, 0, aim.x, aim.y, 0.4, 14, { v: 9, up: 2, life: 0.4, col: P.white }); it.poolT = now(ctx) + tu.poolAt; }
          if (t >= tu.beam) { ph = 2; t = 0; } }
        else { clip(ctx, 'rayFire', 1 - t / tu.recover); if (t >= tu.recover) { clip(ctx, 'rest'); done(); ph = 3; if (!it.poolT) it.life = 0; } } },
      paint(Q) { const tt = Q.t;
        if (ph === 0) { const u = cl(t / tu.charge); Q.glow(m0.x, m0.y, m0.z, 0.5 + 0.9 * u, P.mint, 0.7 * u); Q.spark(m0.x, m0.y, m0.z, 0.25 + 0.3 * u, P.white, u); for (let i = 0; i < 3; i++) Q.halo(m0.x, m0.y, m0.z, 1.6 * (1 - ((u * 2 + i / 3) % 1)), 0.6 * u, P.pale, 0.25);
          for (const g of ['gillL', 'gillR']) { const q = anchor(ctx, g); Q.glow(q.x, q.y, q.z, 0.5, P.mint, 0.5 * u); } }
        else if (ph === 1) { const u = t / tu.beam, a = Math.min(1, t / 0.05) * (1 - sm((u - 0.75) / 0.25)), k = Math.min(1, t / tu.travel), ex = lerp(m0.x, aim.x, k), ey = lerp(m0.y, aim.y, k), ez = lerp(m0.z, 0.1, k);
          // the body, the core, two helical streams round it, ripple rings travelling down it
          Q.beam(m0.x, m0.y, m0.z, ex, ey, ez, 0.4, P.pink, a); Q.beam(m0.x, m0.y, m0.z, ex, ey, ez, 0.2, P.mint, a); Q.beam(m0.x, m0.y, m0.z, ex, ey, ez, 0.1, P.white, a); Q.beam(m0.x, m0.y, m0.z, ex, ey, ez, 0.05, P.white, a);
          for (const s of [0, PI]) { for (let i = 0; i < 16; i++) { const q = i / 15 * k, an = q * 22 - tt * 26 + s; pts[i * 3] = lerp(m0.x, aim.x, q) + Math.cos(an) * 0.34; pts[i * 3 + 1] = lerp(m0.y, aim.y, q) + Math.sin(an) * 0.12; pts[i * 3 + 2] = Math.max(0.05, lerp(m0.z, 0.1, q) + Math.sin(an) * 0.34); } Q.ribbon(pts, 16, 0.3, 1, s ? P.white : P.mint, a); }
          for (let i = 0; i < 4; i++) { const q = ((tt * 2.5 + i / 4) % 1) * k; Q.halo(lerp(m0.x, aim.x, q), lerp(m0.y, aim.y, q), lerp(m0.z, 0.1, q), 0.55, 0.7 * a, P.pale, 0.2); }
          Q.glow(m0.x, m0.y, m0.z, 1.2, P.white, 0.6 * a); if (k >= 1) { Q.glow(aim.x, aim.y, 0.4, 1.8, P.white, 0.7 * a); Q.star(aim.x, aim.y, 0.5, 2.4, a); Q.halo(aim.x, aim.y, 0.5, 2.2 * cl((t - tu.travel) / 0.15), a * (1 - cl((t - tu.travel) / 0.2)), P.white, 0.4); Q.ring(aim.x, aim.y, 0.05, tu.r, 0.5 * a, P.mint, 0.5); } } } }); }

  /* ================= Rolling Wave ================= */
  function rollingWave(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, tu = TUNE.wave, aim = aimOf(ctx, tu.dist), ca = Math.cos(aim.a), sa = Math.sin(aim.a), reg = {}, x0 = v.x, y0 = v.y, z0 = Math.max(0, (anchor(ctx, 'tailTip').z || 0)), N = 13, pts = new Float32Array(3 * N), L = LOW(), DK = dkOf(ctx);
    let t = 0, ph = 0, s = 0; sfx(X, 'whoosh');
    add(ctx, { life: 9, abort() { clip(ctx, 'rest'); done(); },
      update(dt, it) { t += dt;
        if (ph === 0) { clip(ctx, 'tailFlick', t / tu.windup); if (t >= tu.windup) { ph = 1; t = 0; sfx(X, 'splash'); sfx(X, 'hiss', tu.dist / tu.speed + 0.3, 0.3, 500); sfx(X, 'note', 70, 0.9, 'sine', 0.4, 45); shake(ctx, 4, 0.2); } return; }
        if (ph === 1 && t >= tu.recover && !it.free) { it.free = true; clip(ctx, 'rest'); done(); }
        s = Math.min(tu.dist, t * tu.speed); const cx = x0 + ca * s, cy = y0 + sa * s, fade = s >= tu.dist;
        if (!fade) { // the crest: each enemy once; movable ones are carried toward the aim while it is on them
          stats.waveHits += hitO(ctx, cx, cy, tu.thick, tu.half, aim.a, DK * tu.dmg, { once: reg, el: 'water', src: 'strong', kb: 0.001 });
          for (const m of monsOf(ctx)) { if (gone(m)) continue; const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, w = -dx * sa + dy * ca; if (Math.abs(u) < tu.thick + 0.5 && Math.abs(w) < tu.half + (m.r || 0.4)) carry(ctx, m, aim.x, aim.y, tu.push * dt); }   /* (H.pull leaves bosses and rooted enemies where they are) */
          if (!L || Math.random() < 0.5) emit(ctx, 0, cx - sa * rnd(-tu.half, tu.half), cy + ca * rnd(-tu.half, tu.half), 1.2, 1, { v: 2, up: 2, life: 0.6 }); }
        else if ((it.out = (it.out || 0) + dt / 0.4) >= 1) it.life = 0; },
      paint(Q, it) { if (ph === 0) return; const a = 1 - (it.out || 0), tt = Q.t, grow = sm(t / 0.25), cx = x0 + ca * s, cy = y0 + sa * s, GY = Q.GY;
        // from height: a sheet of water falling from the tail to where the wave starts
        if (z0 > 0.8 && t < 0.5) { const tp = anchor(ctx, 'tailTip'), k = 1 - t / 0.5; for (const o of [-1, 0, 1]) Q.beam(tp.x - sa * o * 0.8, tp.y + ca * o * 0.8 * GY, tp.z, x0 - sa * o * tu.half * 0.7, y0 + ca * o * tu.half * 0.7 * GY, 0.1, 0.5, o ? P.pink : P.mint, 0.7 * k); }
        // the wave: its dark body on the floor, then bands of water stacked and curling forward to a white crest
        Q.shade(cx - ca * 0.5, cy - sa * 0.5, tu.half * 0.85 * grow, 0.4 * a, '#0A2F7A');
        for (let k = 0; k < 6; k++) { const q = k / 5, hz = 0.1 + 1.5 * q * grow, fwd = -0.9 + 1.5 * q * q + 0.25 * Math.sin(tt * 6 + k), col = k === 5 ? P.white : k >= 4 ? P.pearl : k >= 2 ? P.mint : P.pink;
          for (let i = 0; i < N; i++) { const w = (i / (N - 1) * 2 - 1), bow = -0.9 * w * w, al = fwd + bow, ac = w * tu.half * grow; pts[i * 3] = cx + ca * al - sa * ac; pts[i * 3 + 1] = cy + (sa * al + ca * ac) * GY; pts[i * 3 + 2] = hz * (1 - 0.5 * w * w) + (k === 5 ? 0.12 * Math.sin(i * 1.7 + tt * 9) : 0); }
          Q.ribbon(pts, N, 0.75 - 0.06 * k, -1, col, (0.95 - 0.06 * k) * a); }
        Q.glow(cx, cy, 0.8, tu.half, P.mint, 0.25 * a); Q.ring(cx, cy, 0.04, tu.half * 0.9 * grow, 0.3 * a, P.mint, 0.5); } }); }

  /* ================= Depth Charge ================= */
  function depthCharge(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, tu = TUNE.depth, PL = poolsOf(ctx), DK = dkOf(ctx), NT = 14, tr = new Float32Array(3 * NT); let aim = aimOf(ctx, tu.reach), pool = null, t = 0, ph = 0, n = 0, p = anchor(ctx, 'mouth'), from = null; poolFx(ctx);
    try { pool = PL.at(aim.x, aim.y); if (pool && PL.claim(pool.id, 'depthCharge')) { aim = { x: pool.x, y: pool.y, a: aim.a }; stats.claims++; } else pool = null; } catch (e) { pool = null; }   /* (aimed at an available pool: it is claimed at the launch, and nothing else can take it) */
    sfx(X, 'note', 110, tu.charge, 'sawtooth', 0.08, 330); sfx(X, 'hum');
    const blast = () => { if (pool) { stats.depthBig += hitA(ctx, aim.x, aim.y, tu.bigR, DK * tu.big, { once: {}, el: 'water', src: 'strong', kb: 6 }); boom(ctx, aim.x, aim.y, tu.bigR, true); geyser(ctx, aim.x, aim.y, 1.9, 11, { dur: 1.7, ring: 3.2 }); for (let i = 0; i < 6; i++) geyser(ctx, aim.x + Math.cos(i * TAU / 6) * tu.bigR * 0.6, aim.y + Math.sin(i * TAU / 6) * tu.bigR * 0.6 * 0.55, 0.8, 4.5, { dur: 1.1 }); emit(ctx, 0, aim.x, aim.y, 1, 30, { v: 10, up: 7, life: 1.2 }); X.hitstop && X.hitstop(0.07); pool.hide = false; X.flash && X.flash(RM() ? 0.05 : 0.12, '#DDF6FF'); try { PL.consume(pool.id); } catch (e) {} }   /* (ONE amplified blast; the pool is spent as it resolves) */
      else { stats.depthHits += hitA(ctx, aim.x, aim.y, tu.r, DK * tu.dmg, { once: {}, el: 'water', src: 'strong', kb: 4 }); boom(ctx, aim.x, aim.y, tu.r); geyser(ctx, aim.x, aim.y, tu.r * 0.5, 3); } };
    add(ctx, { life: 9, abort() { if (pool && ph < 3) { try { pool.hide = false; PL.release(pool.id); } catch (e) {} } clip(ctx, 'rest'); done(); },   /* (a shot that never resolves gives its claim back) */
      update(dt, it) { t += dt;
        if (ph === 0) { p = anchor(ctx, 'mouth'); clip(ctx, 'cannonCharge', t / tu.charge); if (t >= tu.charge) { ph = 1; t = 0; from = { x: p.x, y: p.y, z: p.z }; clip(ctx, 'cannonFire', 1); sfx(X, 'thud'); sfx(X, 'note', 60, 0.5, 'sine', 0.7, 35); sfx(X, 'hiss', 0.4, 0.25, 700); shake(ctx, 6, 0.2); done(); } }   /* (launched: it now finishes whatever the form does) */
        else if (ph === 1) { const u = cl(t / tu.travel); p = { x: lerp(from.x, aim.x, u), y: lerp(from.y, aim.y, u), z: lerp(from.z, 0.3, u * u) + 1.2 * Math.sin(u * PI) }; if (n < NT) n++; tr.copyWithin(3, 0, (NT - 1) * 3); tr[0] = p.x; tr[1] = p.y; tr[2] = p.z; if (Math.random() < 0.6) emit(ctx, 0, p.x, p.y, p.z, 1, { v: 1.5, up: 0.5, life: 0.5 });
          if (u >= 1) { if (pool) { ph = 2; t = 0; pool.hide = true; sfx(X, 'splash'); sfx(X, 'bubble'); sfx(X, 'note', 300, tu.plunge, 'sine', 0.2, 60); } else { ph = 3; blast(); it.life = 0; } } }
        else if (ph === 2) { if (t >= tu.plunge) { ph = 3; blast(); it.life = 0; } } },
      paint(Q) { const tt = Q.t;
        if (ph === 0) { const u = cl(t / tu.charge), rc = anchor(ctx, 'reactor'); Q.glow(rc.x, rc.y, rc.z, 1 + u, P.mint, 0.6 * u); Q.glow(p.x, p.y, p.z, 0.4 + 0.8 * u, P.pink, 0.8 * u); Q.halo(p.x, p.y, p.z, 1.4 * (1 - u), u, P.pale, 0.3); }
        else if (ph === 1) { // the sphere: a dense core, pressure bands, a curling trail of spray
          Q.glow(p.x, p.y, p.z, 1.3, P.pink, 0.8); Q.glow(p.x, p.y, p.z, 0.6, '#123E9C', 1); Q.spark(p.x, p.y, p.z, 0.3, P.white, 0.9); for (let i = 0; i < 3; i++) Q.halo(p.x, p.y, p.z, 0.4 + 0.22 * i + 0.08 * Math.sin(tt * 20 + i), 0.9 - 0.2 * i, i % 2 ? P.mint : P.pale, 0.14);
          if (n > 3) { Q.ribbon(tr, n, 0.5, 1, P.mint, 0.8); Q.ribbon(tr, n, 0.35, -1, P.pale, 0.7); } Q.ring(aim.x, aim.y, 0.05, pool ? tu.bigR : tu.r, 0.25, P.pale, 0.4); }
        else if (ph === 2) { const u = t / tu.plunge, r = pool.r * (1 - 0.55 * u), tt = Q.t; Q.shade(aim.x, aim.y, r, 0.6 + 0.35 * u, '#04123A'); Q.shade(aim.x, aim.y, r * 0.5, 0.7, '#01061A'); Q.air(aim.x, aim.y, 0.03, r, 1, tt * 6); Q.ring(aim.x, aim.y, 0.05, r, 1, P.white, 0.6); Q.ring(aim.x, aim.y, 0.05, tu.bigR, 0.5 * u, P.gold, 0.5); Q.floorGlow(aim.x, aim.y, 0.03, pool.r * 1.4, 0.9 * u, P.white);
          for (let i = 0; i < 6; i++) Q.arc(aim.x, aim.y, 0.1, r * (1.5 - 0.5 * u), -tt * 9 + i * TAU / 6, 1.2, 0.5, i % 2 ? P.pale : P.mint, u, -0.05); if (u < 0.5) Q.halo(aim.x, aim.y, 0.3, 1.5 * (1 - u * 2), 1, P.white, 0.3); } } });
    ctx.depthPlan = { x: aim.x, y: aim.y, empowered: !!pool, pool: pool ? pool.id : null, r: pool ? tu.bigR : tu.r, dmg: pool ? tu.big : tu.dmg }; return true; }

  /* ================= Maelstrom ================= */
  function maelstrom(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return false; }
    const H = ctx.H, X = H.X, tu = TUNE.mael, PL = poolsOf(ctx), DK = dkOf(ctx), L = LOW(), set = [], pts = new Float32Array(3 * 14);
    try { for (const p of PL.list()) if (p.state === 'available' && PL.claim(p.id, 'maelstrom')) set.push(p); } catch (e) {}   /* (every pool available NOW; pools made later are not this attack's) */
    if (!set.length) { try { if (ctx.notice) ctx.notice('Water Ray must make a Tidal Pool first'); else X.banner && X.banner('Needs a Tidal Pool'); } catch (e) {} sfx(X, 'wrong'); done(); return false; }
    stats.claims += set.length; poolFx(ctx); const t0 = now(ctx) + tu.windup, nT = Math.round(tu.dur / tu.every), tEnd = t0 + nT * tu.every, tBurst = tEnd + tu.collapse, R = p => p.r + tu.grow; let k = 0, ph = 0, freed = false;
    ctx.maelPlan = { t0, ticks: nT, tick: tu.every, at: Array.from({ length: nT }, (q, i) => t0 + (i + 1) * tu.every), burst: tBurst, pools: set.map(p => p.id), fired: 0 };
    sfx(X, 'hum'); sfx(X, 'note', 90, tu.windup + tu.dur, 'sawtooth', 0.07, 180); sfx(X, 'hiss', tu.windup + tu.dur, 0.28, 400);
    add(ctx, { life: 30, abort() { for (const p of set) { try { p.hide = false; ph < 2 ? PL.release(p.id) : PL.consume(p.id); } catch (e) {} } clip(ctx, 'rest'); done(); },
      update(dt, it) { const t = now(ctx); clip(ctx, 'maelstrom', (t - (t0 - tu.windup)) / tu.windup); if (!freed && t >= t0 + tu.recover) { freed = true; clip(ctx, 'rest'); done(); }
        if (t >= t0 && ph === 0) ph = 1;
        if (ph === 1) { for (const p of set) for (const m of monsOf(ctx)) { if (!gone(m) && Math.hypot(m.x - p.x, m.y - p.y) < R(p) + tu.reach) carry(ctx, m, p.x, p.y, tu.pull * dt); }   /* (bosses are not pulled; they are still hit inside the volume) */
          while (k < nT && t >= t0 + (k + 1) * tu.every) { k++; const reg = {}; let n = 0; for (const p of set) n += hitA(ctx, p.x, p.y, R(p), DK * tu.dmg, { once: reg, el: 'water', src: 'strong', kb: 0.001 }); stats.maelTicks++; stats.maelHits += n; ctx.maelPlan.fired++; if (k % 2) sfx(X, 'bubble'); }   /* (one registry a tick across the whirlpools) */
          if (!L || Math.random() < 0.5) { const p = set[(Math.random() * set.length) | 0], a = Math.random() * TAU; emit(ctx, 0, p.x + Math.cos(a) * R(p), p.y + Math.sin(a) * R(p) * 0.6, 0.2, 1, { v: 1, up: 3, life: 0.7 }); }
          if (k >= nT) { ph = 2; sfx(X, 'note', 500, tu.collapse, 'sine', 0.2, 80); } }
        if (ph === 2 && t >= tBurst) { ph = 3; const reg = {}; let n = 0; for (const p of set) { n += hitA(ctx, p.x, p.y, tu.burstR, DK * tu.burst, { once: reg, el: 'water', src: 'strong', kb: 5 }); geyser(ctx, p.x, p.y, 1.1, 6, { dur: 1.2 }); try { PL.consume(p.id); } catch (e) {} }   /* (all erupt together through a second registry; the pools are spent) */
          stats.maelBursts++; stats.maelHits += n; boom(ctx, set[0].x, set[0].y, tu.burstR, true); it.life = 0; } },
      paint(Q) { const t = now(ctx), tt = Q.t, w = sm((t - (t0 - tu.windup)) / tu.windup), col = ph === 2 ? cl((t - tEnd) / tu.collapse) : 0, rc = anchor(ctx, 'reactor'); Q.glow(rc.x, rc.y, rc.z, 1.2 + 0.4 * Math.sin(tt * 9), P.mint, 0.6 * w);
        for (const p of set) { const r = R(p) * (0.7 + 0.3 * w) * (1 - 0.55 * col);
          // the stream from the reactor to the pool
          for (let i = 0; i < 14; i++) { const q = i / 13; pts[i * 3] = lerp(rc.x, p.x, q) + 0.25 * Math.sin(q * 9 - tt * 8); pts[i * 3 + 1] = lerp(rc.y, p.y, q); pts[i * 3 + 2] = lerp(rc.z, 0.2, q * q) + 1.2 * Math.sin(q * PI); } Q.ribbon(pts, 14, 0.4, 1, P.mint, 0.8 * w * (1 - col)); Q.ribbon(pts, 14, 0.25, -1, P.pale, 0.7 * w * (1 - col));
          // the whirlpool: a dark depressed centre, a bright turning rim, layered currents, a low spinning cone of spray
          Q.shade(p.x, p.y, r, 0.55 * w, '#06224F'); Q.shade(p.x, p.y, r * 0.4, 0.6 * w, '#020A22'); Q.air(p.x, p.y, 0.03, r, 0.9 * w, tt * 3 + p.id); Q.ring(p.x, p.y, 0.04, r, w, P.white, 0.55); Q.floorGlow(p.x, p.y, 0.02, r * 1.3, 0.3 * w + 0.6 * col, P.mint);
          for (let i = 0; i < (L ? 4 : 7); i++) { const q = i / 6; Q.arc(p.x, p.y, 0.08 + 0.5 * q, r * (1 - 0.72 * q), -tt * (4 + 6 * q) + i * 1.9, 2.4, 0.45, i % 3 ? P.mint : P.pale, 0.9 * w, -0.1); }
          Q.funnel(p.x, p.y, 0, r * 0.95, 1.5 + 2.5 * col, 0.2, 0.7 * w, 16, p.id, P.pink); } } }); return true; }

  /* ================= Shark Attack ================= */
  function sharkAttack(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, tu = TUNE.shark, tier = tierOf(ctx), DK = dkOf(ctx), L = LOW(), x0 = v.x, y0 = v.y, GY = H.GY || 0.55, RJ = tu.R, NS = L ? 26 : 56, NTH = L ? 9 : 13, pts = new Float32Array(3 * 25);
    const T1 = tu.ocean, T2 = T1 + tu.dive, T3 = T2 + tu.beam, T4 = T3 + tu.gather, T5 = T4 + tu.rise, T6 = T5 + tu.pause, T7 = T6 + tu.snap, T8 = T7 + tu.after, dBeam = DK * tu.beamDmg[tier], dBite = DK * tu.bite[tier];
    const stars = []; for (let i = 0; i < NS; i++) { const a = R1(i * 3.3) * TAU, r = RJ * 1.25 * Math.sqrt(R1(i * 7.1)); stars.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: 0.3 + 1.4 * R1(i * 5.7), ph: R1(i) * TAU, ja: i / NS * TAU }); }
    let t = 0, beamHit = false, bit = false, ret = false, fin = false; v.locked = true; const plan = ctx.sharkPlan = { x: x0, y: y0, R: RJ, beamR: tu.beamR, beam: dBeam, bite: dBite, tBeam: null, tBite: null, hits: 0 }; JM.waterline = c2 => (c2 && c2.waterline != null ? c2.waterline : null);
    try { const PL = poolsOf(ctx); if (PL.clear) PL.clear(); else for (const p of PL.list()) PL.consume(p.id); } catch (e) {}   /* (the pools that remain merge into the ocean: no damage) */
    cam(ctx, { zoom: tu.zoom, x: x0, y: y0, k: 0.7 }); sfx(X, 'hum'); sfx(X, 'note', 60, T2, 'sine', 0.25, 40); sfx(X, 'hiss', T1, 0.12, 300);
    /* a jaw: half of a ring hinged on the east-west line through the centre, lifted by th (0 flat on the water, PI / 2 upright); front (toward the camera) is the lower jaw */
    const jawPt = (front, a, th, k) => { const sn = Math.sin(a) * RJ * k; return [x0 + Math.cos(a) * RJ * k, y0 + (front ? 1 : -1) * sn * Math.cos(th) * GY, sn * Math.sin(th) * 0.8]; };
    const jaw = (Q, front, th, al, mesh) => { if (al <= 0.01) return; const tt = Q.t;
      // the arc: three bands of flowing energy and water, stacked for thickness, a bright hinge at each side
      for (const [k, w, col, dz] of [[1, 1.0, P.mint, 0], [0.96, 0.7, P.white, 0.3], [0.86, 0.6, P.pink, -0.1]]) { for (let i = 0; i < 25; i++) { const q = jawPt(front, i / 24 * PI, th, k); pts[i * 3] = q[0]; pts[i * 3 + 1] = q[1]; pts[i * 3 + 2] = Math.max(0.05, q[2] + dz + 0.12 * Math.sin(i * 0.9 - tt * 5)); } Q.ribbon(pts, 25, w, front ? 1 : -1, col, al); }
      // the teeth: long crystal blades, largest at the front, smaller toward the hinges, pointing at the other jaw (the two rows offset, so they mesh)
      for (let i = 0; i < NTH; i++) { const a = (i + (front ? 0.5 : 1)) / (NTH + 0.5) * PI, q = jawPt(front, a, th, 0.93), len = 0.9 + 2.1 * Math.pow(Math.sin(a), 1.5), el = front ? th + PI / 2 : th - PI / 2; Q.tooth(q[0], q[1], Math.max(0.1, q[2]), len * (0.6 + 0.4 * mesh), el, i % 2 ? P.pale : P.white, al * 0.92); if (i % 3 === 1) Q.spark(q[0], q[1], Math.max(0.1, q[2]), 0.14, P.white, al * (0.5 + 0.5 * Math.sin(tt * 5 + i))); }
      for (const a of [0, PI]) { const q = jawPt(front, a, th, 1); Q.glow(q[0], q[1], 0.4, 1.8, P.white, 0.6 * al); Q.star(q[0], q[1], 0.4, 1.2, 0.7 * al); } };
    add(ctx, { life: 60, keep: true, ocean: 0, abort() { ctx.waterline = null; cam(ctx, null); done(); },
      update(dt, it) { if (!fin && !live(ctx)) { it.life = 0; ctx.waterline = null; cam(ctx, null); done(); return; } t += dt;
        it.ocean = sm(t / T1) * (1 - sm((t - T7 - 0.5) / (tu.after - 0.5))); it.bright = (t >= T2 && t < T2 + 0.3) || (t >= T6 && t < T7 + 0.3);
        ctx.waterline = t > T1 * 0.5 && t < T5 ? 0.05 : null;   /* (the model is hidden below this height while it is set: the dive's cut) */
        if (t < T2) { const du = (t - T1 * 0.5) / (T2 - T1 * 0.5), hd = v.heading || 0; for (let i = (it.spl || 0); i < 4; i++) if (du >= [0.12, 0.38, 0.6, 0.85][i]) { it.spl = i + 1; const o = [1.4, 0.4, -0.5, -1.6][i]; geyser(ctx, x0 + Math.cos(hd) * o, y0 + Math.sin(hd) * o * GY, [0.5, 0.75, 0.4, 0.55][i], [2, 2.8, 1.8, 2.4][i], { dur: 0.7, ring: 2.6 }); sfx(X, 'splash'); sfx(X, 'bubble'); }   /* (the snout, the body, the dorsal fin, the tail) */
          clip(ctx, 'dive', du); if (t > T1 * 0.5 && Math.random() < 0.6) emit(ctx, 0, x0, y0, 0.2, 1, { r: 1.2, v: 1, up: 2.5, g: -0.4, life: 0.8 }); }
        if (!beamHit && t >= T2) { beamHit = true; plan.tBeam = now(ctx); plan.hits += hitA(ctx, x0, y0, tu.beamR, dBeam, { once: {}, noCharge: true, el: 'water', src: 'ult', kb: 3 });   /* (the sky beam: ONE authored hit an enemy) */
          sfx(X, 'crash'); sfx(X, 'note', 900, tu.beam, 'sawtooth', 0.1, 200); sfx(X, 'note', 45, 1.4, 'sine', 0.8, 30); sfx(X, 'hiss', tu.beam, 0.35, 1800); shake(ctx, 12, 0.5); X.flash && X.flash(RM() ? 0.06 : 0.16, '#BFE4FF'); X.light && X.light(x0, y0, 8, 1); emit(ctx, 0, x0, y0, 0.5, 20, { v: 8, up: 6 }); }
        if (t >= T3 && t < T4 && !it.s1) { it.s1 = true; sfx(X, 'note', 80, tu.gather + tu.rise, 'sine', 0.3, 160); sfx(X, 'sparkle'); }
        if (t >= T4 && !it.s2) { it.s2 = true; sfx(X, 'hiss', tu.rise, 0.3, 500); sfx(X, 'splash'); geyser(ctx, x0, y0, 1.8, 7.5, { dur: 1.5, ring: 3.4 }); emit(ctx, 0, x0, y0, 1, L ? 14 : 30, { v: 8, up: 8, life: 1.3 }); shake(ctx, 8, 0.35); }
        if (t >= T4 && t < T6) clip(ctx, 'breach', (t - T4) / tu.rise);
        if (!bit && t >= T7) { bit = true; plan.tBite = now(ctx); plan.hits += hitA(ctx, x0, y0, RJ, dBite, { once: {}, noCharge: true, el: 'water', src: 'ult', kb: 7 });   /* (the jaws close: ONE colossal hit an enemy; teeth, spray and stars deal nothing) */
          sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'chomp'); sfx(X, 'sparkle'); sfx(X, 'note', 38, 2.2, 'sine', 0.9, 22); sfx(X, 'hiss', 1.8, 0.4, 2000); shake(ctx, 20, 0.7); X.flash && X.flash(RM() ? 0.1 : 0.26, '#EAF8FF'); X.hitstop && X.hitstop(0.1); X.light && X.light(x0, y0, RJ * 1.6, 1.4);
          for (let i = 0; i < (L ? 5 : 8); i++) { const a = i / (L ? 5 : 8) * TAU; geyser(ctx, x0 + Math.cos(a) * RJ * 0.72, y0 + Math.sin(a) * RJ * 0.72 * GY, 1.1, 6.5, { dur: 1.3 }); } for (const s of stars) if (!L || R1(s.ph) < 0.5) emit(ctx, 0, x0 + s.x * 0.8, y0 + s.y * 0.8 * GY, 2 + s.z, 1, { v: 7, up: 4, life: 1.2, col: P.white, size: 0.16 }); }
        if (t >= T7) clip(ctx, 'rest');
        if (!ret && t >= T7 + 0.4) { ret = true; try { ctx.returnPoint = ctx.safeReturn ? ctx.safeReturn() : null; } catch (e) {} }
        if (!fin && t >= T8) { fin = true; cam(ctx, null); done(); it.life = 0; } },
      paint(Q) { const tt = Q.t, oc = sm(t / T1), rec = 1 - sm((t - T7 - 0.5) / (tu.after - 0.5)), A = oc * rec, gather = sm((t - T3) / tu.gather), rise = sm((t - T4) / tu.rise), snap = cl((t - T6) / tu.snap), gone2 = sm((t - T7 - 0.15) / 0.6);
        // the midnight ocean: its ripple spreading, stars floating above it and mirrored in it
        for (let i = 0; i < 3; i++) { const q = cl(t / T1 - i * 0.18); if (q > 0 && q < 1) Q.ring(x0, y0, 0.03, RJ * 1.5 * eout(q), 0.8 * (1 - q), P.pink, 0.8); } Q.floorGlow(x0, y0, 0.02, RJ * 1.4, 0.16 * A, P.pink); Q.ring(x0, y0, 0.03, RJ, 0.3 * A * (1 - gone2), P.blush, 0.6); Q.air(x0, y0, 0.02, RJ * 1.7, 0.3 * A, 3 + tt * 0.1);
        for (let i = 0; i < (L ? 5 : 10); i++) { const rr = RJ * (0.25 + 0.14 * i), an = i * 2.4 + tt * (0.12 + 0.03 * (i % 3)) * (i % 2 ? 1 : -1); Q.arc(x0, y0, 0.04, rr, an, 0.7 + 0.5 * R1(i), 0.3, i % 2 ? P.blush : P.pink, 0.4 * A * (0.6 + 0.4 * Math.sin(tt * 1.3 + i)), 0); }   /* (slow swell highlights) */
        for (const s of stars) { const ja = s.ja, front = ja < PI, th = front ? 0.3 * rise : 1.15 * rise, jp = jawPt(front, front ? ja : ja - PI, th, 1), g = gather * (1 - gone2), sx = lerp(x0 + s.x, jp[0], g), sy = lerp(y0 + s.y * GY, jp[1], g), sz = lerp(s.z, jp[2] + 0.4, g), tw = 0.5 + 0.5 * Math.sin(tt * 3 + s.ph), a = A * (0.4 + 0.6 * tw) * (1 - 0.7 * gone2);
          Q.star(sx, sy, sz, 0.22 + 0.2 * tw + 0.15 * g, a); Q.spark(sx, sy, sz, 0.08, P.white, a); if (g < 0.5) Q.spark(sx, sy + 0.25, 0.05, 0.07, P.blush, 0.4 * a); }
        // the dive: ripples and bubbles where it went under
        if (t > T1 * 0.5 && t < T3) { for (let i = 0; i < 3; i++) { const q = ((t * 1.4 + i / 3) % 1); Q.ring(x0, y0, 0.04, 0.6 + 3 * q, (1 - q) * 0.8, P.pale, 0.3); } Q.ring(x0, y0, 0.05, 1.5, 0.9, P.pearl, 0.5); for (let i = 0; i < 5; i++) Q.arc(x0, y0, 0.12, 1.6, tt * 3 * (i % 2 ? 1 : -1) + i * 1.3, 0.9, 0.35, P.pearl, 0.8, 0); }   /* (the foam ring at the cut) */
        // the beam through the ground into the sky
        if (t >= T2 && t < T3 + 0.2) { const u = (t - T2) / tu.beam, a = Math.min(1, (t - T2) / 0.06) * (1 - sm((u - 0.7) / 0.4)), w = tu.beamR * 0.55 * (0.8 + 0.2 * Math.sin(tt * 30));
          Q.funnel(x0, y0, 0, w, 16, 0.85, a, 22, 1, P.pink); Q.funnel(x0, y0, 0, w * 0.55, 16, 0.9, a, 30, 2, P.pale); Q.beam(x0, y0, 0, x0, y0, 16, w * 1.3, P.pink, 0.8 * a); Q.beam(x0, y0, 0, x0, y0, 16, w * 0.5, P.white, a);
          Q.ring(x0, y0, 0.05, tu.beamR * (0.5 + 0.7 * eout(u)), a, P.white, 0.7); Q.floorGlow(x0, y0, 0.03, tu.beamR * 2, 0.9 * a, P.pale); for (let i = 0; i < 6; i++) Q.arc(x0, y0, ((tt * 3 + i * 1.5) % 9), w * 1.5, tt * 6 + i, 2.2, 0.5, i % 2 ? P.pale : P.mint, a, 0.6); Q.glow(x0, y0, 1, tu.beamR * 2.5, P.white, 0.6 * a); }
        // the huge shadow circling under the water
        if (t >= T3 && t < T5) { const an = (t - T3) * 2.2, k = 1 - rise; Q.shade(x0 + Math.cos(an) * RJ * 0.35 * k, y0 + Math.sin(an) * RJ * 0.35 * k * GY, 2.6 + 1.5 * gather, 0.5 * A, '#01040F'); }
        // the spirit jaws: the lower rises from the water in front, the upper arches over from behind; they hinge at the sides and snap shut
        if (t >= T4 - 0.2) { const al = sm((t - (T4 - 0.2)) / 0.4) * (1 - gone2), sn = snap * snap * (3 - 2 * snap), thL = lerp(0.3 * rise, PI / 2, sn), thU = lerp(1.15 * rise, PI / 2, sn); jaw(Q, false, thU, 0.9 * al, rise); jaw(Q, true, thL, 0.95 * al, rise); }
        // the bite: the flash, the pressure wave
        if (t >= T7) { const u = t - T7; if (u < 0.5) Q.glow(x0, y0, 2, RJ * 2.2, P.white, 0.9 * (RM() ? 0.5 : 1) * (1 - u / 0.5)); for (const [d, kk, w] of [[0, 1.6, 1.2], [0.08, 2.1, 0.7], [0.2, 2.6, 0.4]]) { const q = (u - d) / 0.8; if (q > 0 && q < 1) Q.ring(x0, y0, 0.05, RJ * (0.3 + kk * eout(q)), 1 - q, P.white, w); } } } }); }

  /* ================= pictures and sound for the core: Maw, Hydrojet, the summon, the anchor halo, the change of form, the exit ================= */
  /* Maw (D live: { x, y, z, a, ph, done }): the jaw's snap and a heavy splash along the thrash */
  function maw(ctx, D) { if (!ctx.H) return null; const X = ctx.H.X; D = D || {}; let t = 0; sfx(X, 'chomp'); sfx(X, 'splash'); sfx(X, 'whoosh');
    return add(ctx, { life: 4, update(dt, it) { t += dt; const m = anchor(ctx, 'mouth'); if (t < 0.5 && Math.random() < 0.7) emit(ctx, 0, m.x, m.y, m.z, 2, { v: 4, up: 1.5, life: 0.5 }); if (D.done || t > (D.dur || 0.7)) it.life = 0; },
      paint(Q) { const m = anchor(ctx, 'mouth'), u = cl(t / (D.dur || 0.7)), a = 1 - u; for (let i = 0; i < 4; i++) Q.arc(m.x, m.y, m.z - 0.3 + 0.25 * i, 1.6 + 0.5 * u, (ctx.vehicle.heading || 0) - 1.2 + i * 0.3 + u * 3 * (i % 2 ? 1 : -1), 2.4, 0.6, i % 2 ? P.pale : P.mint, a, 0.2); Q.glow(m.x, m.y, m.z, 1.4, P.pale, 0.5 * a); if (u < 0.3) Q.halo(m.x, m.y, m.z, 2.2 * u / 0.3, 1 - u / 0.3, P.white, 0.4); } }); }
  /* Hydrojet (D: { x, y, z, dx, dy } the jets' push direction): short violent jets from the stabilisers */
  function hydrojet(ctx, D) { if (!ctx.H) return null; const X = ctx.H.X; D = D || {}; let t = 0; sfx(X, 'hiss', 0.35, 0.4, 2600); sfx(X, 'thud'); sfx(X, 'note', 140, 0.3, 'sawtooth', 0.1, 60);
    return add(ctx, { life: 3, update(dt, it) { t += dt; const j = anchor(ctx, 'jet'); if (t < 0.3) emit(ctx, 0, j.x, j.y, j.z, 2, { v: 5, up: 0.5, life: 0.4, dir: Math.atan2(-(D.dy || 0), -(D.dx || 1)), spread: 0.4 }); if (t > 0.5) it.life = 0; },
      paint(Q) { const a = 1 - t / 0.5, an = Math.atan2(-(D.dy || 0), -(D.dx || 1)); for (const n of ['finL', 'finR', 'jet']) { const j = anchor(ctx, n), len = 2.6 * eout(t / 0.2); Q.beam(j.x, j.y, j.z, j.x + Math.cos(an) * len, j.y + Math.sin(an) * len * Q.GY, Math.max(0.2, j.z - 0.4), 0.4, P.mint, a); Q.beam(j.x, j.y, j.z, j.x + Math.cos(an) * len * 0.7, j.y + Math.sin(an) * len * 0.7 * Q.GY, j.z, 0.16, P.white, a); Q.halo(j.x, j.y, j.z, 0.5 + 1.2 * t, a, P.pale, 0.2); } } }); }
  /* the summon (D: { x, y, dur }): a ring of water on the ground, a spiral of bubbles the shark rises through snout first */
  function summon(ctx, D) { if (!ctx.H) return null; const X = ctx.H.X; D = D || {}; const v = ctx.vehicle || {}, x = isFinite(D.x) ? D.x : v.x, y = isFinite(D.y) ? D.y : v.y, dur = D.dur || 1.5; let t = 0; poolFx(ctx);
    sfx(X, 'splash'); sfx(X, 'bubble'); sfx(X, 'hiss', dur, 0.2, 600); sfx(X, 'note', 80, dur, 'sine', 0.3, 200);
    return add(ctx, { life: 9, keep: true, update(dt, it) { t += dt; if (t < dur) { const a = t * 9, r = 1.6 * (1 - 0.5 * t / dur); emit(ctx, 0, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.55, 0.2 + 3 * (t / dur), 1, { v: 0.5, up: 2.2, g: -0.6, life: 0.8, size: 0.1 }); } if (t > dur + 0.5) it.life = 0; },
      paint(Q) { const a = sm(t / 0.25) * (1 - sm((t - dur) / 0.5)), R = 2.4, tt = Q.t; Q.shade(x, y, R * eout(t / 0.4), 0.5 * a, '#0A2F7A'); Q.air(x, y, 0.03, R * eout(t / 0.4), 0.8 * a, tt * 2); Q.ring(x, y, 0.04, R * eout(t / 0.4), a, P.mint, 0.5); Q.floorGlow(x, y, 0.02, R * 1.3, 0.4 * a, P.pale);
        for (let i = 0; i < 5; i++) { const q = ((t * 0.8 + i * 0.2) % 1); Q.arc(x, y, q * 4, R * (0.8 - 0.4 * q), tt * 5 + i * 1.3, 2.3, 0.45, i % 2 ? P.pale : P.mint, a * Math.sin(q * PI), 0.5); } if (t < 0.4) Q.ring(x, y, 0.05, R * 2 * eout(t / 0.4), 1 - t / 0.4, P.white, 0.6); } }); }
  /* the anchor halo under Leviathan (D live: { on }): call once at Anchor; it follows the hull and ends when D.on is false */
  function anchorHalo(ctx, D) { if (!ctx.H) return null; const X = ctx.H.X; D = D || { on: true }; let t = 0, out = 0; sfx(X, 'thud'); sfx(X, 'note', 180, 0.25, 'square', 0.06, 90); sfx(X, 'crack');
    return add(ctx, { life: 1e9, update(dt, it) { t += dt; if (D.on === false || D.done) { out += dt / 0.4; if (out >= 1) it.life = 0; } },
      paint(Q) { const v = ctx.vehicle, a = sm(t / 0.3) * (1 - out), tt = Q.t; Q.seal(v.x, v.y, 0.02, 2.6, 0.6 * a, tt * 0.3, t / 0.4, P.mint); Q.ring(v.x, v.y, 0.03, 2.6, 0.7 * a, P.pale, 0.35); Q.floorGlow(v.x, v.y, 0.02, 3, 0.25 * a, P.pink); if (t < 0.5) Q.ring(v.x, v.y, 0.04, 2.6 + 3 * eout(t / 0.5), 1 - t / 0.5, P.white, 0.5);
        for (let i = 0; i < 4; i++) Q.beam(v.x + Math.cos(i * PI / 2 + 0.78) * 2.2, v.y + Math.sin(i * PI / 2 + 0.78) * 2.2 * Q.GY, 0, v.x + Math.cos(i * PI / 2 + 0.78) * 2.2, v.y + Math.sin(i * PI / 2 + 0.78) * 2.2 * Q.GY, 0.9 * a, 0.1, P.mint, 0.5 * a); } }); }
  /* the change of form (D: { to: 'leviathan' | 'shark' }): a pulse off the reactor and vented spray */
  function transform(ctx, D) { if (!ctx.H) return null; const X = ctx.H.X; let t = 0; sfx(X, 'hiss', 0.4, 0.2, 1800); sfx(X, 'note', D && D.to === 'shark' ? 300 : 150, 0.35, 'triangle', 0.08, D && D.to === 'shark' ? 600 : 75); sfx(X, 'crack');
    return add(ctx, { life: 3, update(dt, it) { t += dt; if (t < 0.3) { const c = anchor(ctx, 'center'); emit(ctx, 0, c.x, c.y, c.z, 2, { v: 3, up: 1, life: 0.5 }); } if (t > 0.6) it.life = 0; }, paint(Q) { const c = anchor(ctx, 'reactor'), u = t / 0.6; Q.halo(c.x, c.y, c.z, 3 * eout(u), 1 - u, P.mint, 0.4); Q.glow(c.x, c.y, c.z, 1.5, P.pale, 0.6 * (1 - u)); } }); }
  /* the exit (D: { x, y, z }): the form dissolves into rising bubbles and light */
  function exit(ctx, D) { if (!ctx.H) return null; const X = ctx.H.X, L = LOW(); D = D || {}; const c0 = anchor(ctx, 'center'), p = { x: isFinite(D.x) ? D.x : c0.x, y: isFinite(D.y) ? D.y : c0.y }, z = isFinite(D.z) ? D.z : c0.z || 1.2; let t = 0;
    sfx(X, 'bubble'); sfx(X, 'splash'); sfx(X, 'hiss', 0.9, 0.15, 1400); sfx(X, 'note', 660, 0.8, 'sine', 0.05, 330);
    emit(ctx, 0, p.x, p.y, z, L ? 16 : 40, { v: 2.5, up: 3, g: -0.8, r: 1.8, rz: 1, life: 1.6, size: 0.13 }); emit(ctx, 2, p.x, p.y, z, L ? 6 : 14, { v: 3, up: 2, r: 1.5, life: 1.4, size: 0.14 });
    return add(ctx, { life: 5, keep: true, update(dt, it) { t += dt; if (t > 1) it.life = 0; }, paint(Q) { const u = t; Q.glow(p.x, p.y, z, 2.5 + 2 * u, P.pale, 0.7 * (1 - u)); for (let i = 0; i < 2; i++) { const q = cl(u * 1.4 - i * 0.25); if (q > 0 && q < 1) Q.halo(p.x, p.y, z, 3.4 * eout(q), 1 - q, i ? P.pale : P.mint, 0.5); } Q.ring(p.x, p.y, 0.04, 1 + 3 * eout(u), 1 - u, P.mint, 0.4); } }); }

  /* ================= the buttons' icons ================= */
  const ic = (x, cx, cy, r, rd, f) => { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; x.lineJoin = 'round'; f(rd ? P.mint : '#9AA', rd ? P.pale : '#BBC', rd ? P.pink : '#889'); x.restore(); };
  const icons = {
    waterRay(x, cx, cy, r, rd) { ic(x, cx, cy, r, rd, (a, b, c) => { x.strokeStyle = c; x.lineWidth = r * 0.3; x.beginPath(); x.moveTo(-r * 0.55, r * 0.3); x.lineTo(r * 0.5, -r * 0.3); x.stroke(); x.strokeStyle = b; x.lineWidth = r * 0.1; x.stroke(); x.strokeStyle = a; x.lineWidth = r * 0.06; x.beginPath(); x.arc(r * 0.5, -r * 0.3, r * 0.22, 0, TAU); x.stroke(); }); },
    rollingWave(x, cx, cy, r, rd) { ic(x, cx, cy, r, rd, (a, b, c) => { x.strokeStyle = c; x.lineWidth = r * 0.14; x.beginPath(); x.moveTo(-r * 0.6, r * 0.35); x.quadraticCurveTo(-r * 0.1, -r * 0.7, r * 0.45, -r * 0.2); x.quadraticCurveTo(r * 0.55, r * 0.1, r * 0.2, r * 0.05); x.stroke(); x.strokeStyle = b; x.lineWidth = r * 0.07; x.beginPath(); x.moveTo(-r * 0.6, r * 0.45); x.lineTo(r * 0.6, r * 0.45); x.stroke(); }); },
    depthCharge(x, cx, cy, r, rd) { ic(x, cx, cy, r, rd, (a, b, c) => { x.fillStyle = c; x.beginPath(); x.arc(0, 0, r * 0.34, 0, TAU); x.fill(); x.strokeStyle = b; x.lineWidth = r * 0.06; for (const k of [0.34, 0.5, 0.64]) { x.beginPath(); x.arc(0, 0, r * k, -0.6, 0.9); x.stroke(); } }); },
    maelstrom(x, cx, cy, r, rd) { ic(x, cx, cy, r, rd, (a, b, c) => { x.lineWidth = r * 0.09; for (let i = 0; i < 3; i++) { x.strokeStyle = i % 2 ? b : a; x.beginPath(); x.arc(0, 0, r * (0.22 + 0.2 * i), i * 2.1, i * 2.1 + 4.2); x.stroke(); } }); },
    sharkAttack(x, cx, cy, r, rd) { ic(x, cx, cy, r, rd, (a, b, c) => { x.strokeStyle = a; x.lineWidth = r * 0.09; x.beginPath(); x.arc(0, r * 0.05, r * 0.6, PI * 1.08, PI * 1.92); x.stroke(); x.beginPath(); x.arc(0, -r * 0.05, r * 0.6, PI * 0.08, PI * 0.92); x.stroke(); x.fillStyle = b; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(i * r * 0.2 - r * 0.07, -r * 0.42); x.lineTo(i * r * 0.2, -r * 0.14); x.lineTo(i * r * 0.2 + r * 0.07, -r * 0.42); x.fill(); x.beginPath(); x.moveTo(i * r * 0.2 - r * 0.07, r * 0.42); x.lineTo(i * r * 0.2, r * 0.14); x.lineTo(i * r * 0.2 + r * 0.07, r * 0.42); x.fill(); } }); },
  };
  icons.maw = icons.sharkAttack; icons.hydrojet = icons.waterRay;

  JM.waterRay = waterRay; JM.rollingWave = rollingWave; JM.depthCharge = depthCharge; JM.maelstrom = maelstrom; JM.sharkAttack = sharkAttack; JM.maw = maw; JM.hydrojet = hydrojet; JM.summon = summon; JM.anchorHalo = anchorHalo; JM.transform = transform; JM.exit = exit;
  JM.poolFx = poolFx; JM.pools = poolsOf; JM.geyser = geyser; JM.icons = icons; JM.emit = emit;
  JM.warm = () => { try { for (const c of [P.mint, P.pale, P.pink, P.blush, P.white]) glowSprite(c); beamSprite(P.white); beamSprite(P.pale); flowerSprite(P.pearl, true); gpuOn(); } catch (e) {} return true; };
  JM.update = ctx => { try { if (ctx && ctx.H && poolsOf(ctx).list().length) poolFx(ctx); } catch (e) {} };   /* (the pools are drawn for as long as the core holds any) */
})();
