/* ---------- Belladonna (11th Wind ult): the moves and effects (E) ----------
   BELLADONNA_MOVES, called by A's core (20k5yb) with one `ctx` per cast (the contract is in docs/WIND-BELLADONNA-BRIEF.md,
   Notes). Every function is optional to the core and guarded here.
   - BM.wildflowers(ctx): Strong 1. One bounded floral hurricane per caster (a recast refreshes it), ticking on the game clock.
   - BM.ringBlade(ctx): Strong 2. The model's own ring and eight swords are thrown (pose ringAway 1; drawn here with
     BELLADONNA_MODEL.drawRing), sweep + end flourish share one registry (one activation an enemy), the return is harmless.
     BM.ringState(ctx) is 'overhead' | 'outbound' | 'returning'; BM.recallRing(ctx) hurries it home.
   - BM.twister(ctx): the finisher. Six formation marks, exactly six tornadoes orbiting the flower, scheduled ticks with
     one shared per-enemy registry a tick, a last pulse, the unwind. noCharge.
   - BM.swoosh(ctx, D), BM.summon(ctx, D), BM.bloom(ctx, D), BM.exit(ctx, D): pictures and sound only (the core moves
     the flower and deals Swoosh's hit); D is the core's live info.
   - BM.GFX: every effect is real 3D geometry on one GPU layer (instanced blossom and petal meshes, instanced tornado
     funnels, wind ribbons as strips in the wind's plane, marks as quads on the ground; projected with the game's camera,
     depth-tested, valid premultiplied output); the same calls drawn flat in 2D otherwise. Gameplay never depends on the path.
   The wind's rule (the user's): a ribbon has a bright, sharp outer edge and fades gradually toward its inner edge.
   Blossoms are five-petal flowers. Damage only through ctx.hitArea / ctx.hit. No timers: deadlines on the game clock. */
(() => {
  const BM = (self.BELLADONNA_MOVES = self.BELLADONNA_MOVES || {});
  const TAU = Math.PI * 2, PI = Math.PI;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, eback = u => { u = cl(u); const s = 1.70158; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
  const rnd = (a, b) => a + Math.random() * (b - a), R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion, LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const P = { mint: '#8FE8C8', pale: '#F2FFF9', white: '#FFFFFF', deep: '#2E8C78', pink: '#FF6FA8', rose: '#E0457F', blush: '#FFD3E2', gold: '#FFE9A8', pearl: '#FFF4EA' };

  /* ================= tuning (x DK = the ult's base damage unit; provisional until H's audit) ================= */
  const stats = BM.stats = { wildTicks: 0, wildHits: 0, fields: 0, ringState: 'overhead', ringHits: 0, ringThrows: 0, twisters: 0, twisterTicks: 0, twisterHits: 0 };   /* (counters for tests/belladonna.js) */
  const TUNE = BM.TUNE = {
    wildCd: 3.5, ringCd: 4,   /* (the core reads these: Wildflowers from the cast, Ring Blade from the catch) */
    /* Wildflowers: `cast` s of casting recovery; the field (radius r, its centre at most `reach` tiles away) ticks every `every` s for `dur` s, `dmg` x DK a tick (10 x 0.9 = 9) */
    wild: { cast: 0.4, r: 3.0, reach: 5.5, dur: 3.0, every: 0.3, dmg: 0.9 },
    /* Ring Blade: `windup` s, out at `speed` tiles/s to at most `reach`; the sweep (radius r) and the end flourish (radius flourishR)
       are ONE activation of `dmg` x DK an enemy; `flourish` s at the end, `back` s to return (harmless), `recall` s when called home */
    ring: { windup: 0.3, speed: 15, reach: 8, r: 3.0, dmg: 10, flourishR: 4.2, flourish: 0.45, back: 0.6, recall: 0.25, low: 1.0 },
    /* Twister: `settle` s, `marks` s of formation marks, then n tornadoes (base radius r) orbiting at orbitR, `omega` rad/s, for
       `dur` s: `ticks` scheduled ticks; the first ticks - 1 deal `per` x DK (by tier), the LAST one is the final pulse and deals what is
       left of `total` (radius x lastR); `unwind` s. On one target: 19 x 4 / 5 / 5.5 + 19 / 20 / 20.5 = 95 / 115 / 125 */
    twister: { settle: 0.5, marks: 0.75, n: 6, r: 1.9, orbitR: 5.6, core: 3.8, omega: 0.9, dur: 5.0, ticks: 20, per: [4, 5, 5.5], total: [95, 115, 125], lastR: 1.3, unwind: 1.1, h: 5.0, top: 1.3, zoom: 0.7 },
    summon: { r: 2.6, dur: 1.6 },
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
    const D = { ring: [0, 4.6], center: [0, 1.4], seat: [0, 1.2], top: [0, 3.4] }[name] || [0, 1.4]; return { x: v.x || 0, y: v.y || 0, z: (v.z || 0) + D[1] }; }
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
  const tipR = () => { try { const q = self.BELLADONNA_MODEL.SIZE.swordSpan; if (q > 1 && q < 12) return q / 2; } catch (e) {} return 3.0; };   /* (the ring's sword tips: the model's own measure) */
  const STATE = new WeakMap(), SS = ctx => { const k = ctx.S || ctx.vehicle || ctx; let s = STATE.get(k); if (!s) { s = { ring: 'overhead', ringItem: null, wild: null }; STATE.set(k, s); } return s; };

  /* ================= BELLADONNA_GFX: the effects in 3D on the GPU =================
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
     Used on real-GPU WebGL with instancing; a software rasteriser or no WebGL draws the 2D path. window.__BM_GL = 1
     forces it, 0 forces 2D; a lost context falls back to 2D (rebuilt when restored). */
  const GFXM = (() => { let cv = null, gl = null, PQ = null, PR = null, PF = null, PM = null, bq = null, br = null, bfm = null, bfi = null, bmm = null, bmi = null, ok = null, soft = false, info = '', why = '', IA = null, NBV = 0, NPV = 0, NFV = 0;
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
  vec3 base = v_c.rgb, col = mix(base * vec3(0.78, 0.4, 0.56), base, smoothstep(0.0, 0.45, v_e.x)); col = mix(col, mix(base, vec3(1.0), 0.55), smoothstep(0.55, 1.0, v_e.x));
  if (v_e.y > 0.5) col = vec3(1.0, 0.84, 0.36);
  col = col * dif + vec3(1.0, 0.8, 0.88) * (rim * 0.25 + thru) + vec3(1.0) * spec * 0.14; gl_FragColor = vec4(min(col, vec3(1.0)) * v_c.a, v_c.a); }`;
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
      NBV = M.length / 8; petalMesh(M, 0, 0, 2, 0.62, 0.45, -1); NPV = M.length / 8 - NBV; gl.bindBuffer(gl.ARRAY_BUFFER, bmm); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(M), gl.STATIC_DRAW);
      const F = [], NS = 24, NH = 12; for (let j = 0; j < NH; j++) for (let i = 0; i < NS; i++) { const u0 = i / NS, u1 = (i + 1) / NS, v0 = j / NH, v1 = (j + 1) / NH; F.push(u0, v0, u1, v0, u0, v1, u0, v1, u1, v0, u1, v1); } NFV = F.length / 2; gl.bindBuffer(gl.ARRAY_BUFFER, bfm); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(F), gl.STATIC_DRAW);
      return true; }
    function usable() { let f = null; try { f = typeof window !== 'undefined' ? window.__BM_GL : null; } catch (e) {} if (f === 0 || ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Belladonna GFX: ' + why); } catch (e2) {} } } return !!ok && (!soft || f === 1); }
    const attr = (i, n, stride, off, d) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, stride * 4, off * 4); IA.div(i, d || 0); }, offA = n => { for (let i = n; i < 6; i++) { gl.disableVertexAttribArray(i); IA.div(i, 0); } };
    const cam = (P, F) => { gl.uniform4fv(P.U.u_px, F.px); gl.uniform4fv(P.U.u_py, F.py); gl.uniform4fv(P.U.u_pd, F.pd); gl.uniform3fv(P.U.u_pet, F.pet); gl.uniform2fv(P.U.u_pa, F.pa); };
    /* F: { W, H, t, px, py, pd, ps, v, l, ground (true: the floor marks alone), quads (15 a vertex), nq, rib (9), nr,
       fun (14 an instance), nf, flo (12 an instance: blossoms), nb, pet (12: petals), np } */
    function render(F) { if (!usable()) return null; try { const W = F.W, Hh = F.H; if (cv.width !== W * 2 || cv.height !== Hh) { cv.width = W * 2; cv.height = Hh; }
        gl.viewport(0, 0, W * 2, Hh); gl.depthMask(true); gl.colorMask(true, true, true, true); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); let draws = 0;
        const flowers = pass => { if (!(F.nb + F.np)) return; gl.useProgram(PM.p); cam(PM, F); gl.uniform3fv(PM.U.u_v, F.v); gl.uniform3fv(PM.U.u_l, F.l); gl.uniform1f(PM.U.u_pass, pass);
          for (const [A, n, first, cnt] of [[F.flo, F.nb, 0, NBV], [F.pet, F.np, NBV, NPV]]) { if (!n) continue; gl.bindBuffer(gl.ARRAY_BUFFER, bmm); attr(0, 3, 8, 0); attr(1, 3, 8, 3); attr(2, 2, 8, 6); gl.bindBuffer(gl.ARRAY_BUFFER, bmi); gl.bufferData(gl.ARRAY_BUFFER, A.subarray(0, n * 12), gl.DYNAMIC_DRAW); attr(3, 4, 12, 0, 1); attr(4, 4, 12, 4, 1); attr(5, 4, 12, 8, 1); IA.draw(first, cnt, n); draws++; } offA(0); };
        const funnels = pass => { if (!F.nf) return; gl.useProgram(PF.p); cam(PF, F); gl.uniform1f(PF.U.u_pass, pass); gl.uniform1f(PF.U.u_t, F.t); gl.uniform3fv(PF.U.u_v, F.v); gl.bindBuffer(gl.ARRAY_BUFFER, bfm); attr(0, 2, 2, 0); gl.bindBuffer(gl.ARRAY_BUFFER, bfi); gl.bufferData(gl.ARRAY_BUFFER, F.fun.subarray(0, F.nf * 14), gl.DYNAMIC_DRAW); attr(1, 4, 14, 0, 1); attr(2, 4, 14, 4, 1); attr(3, 4, 14, 8, 1); attr(4, 2, 14, 12, 1); offA(5); IA.draw(0, NFV, F.nf); draws++; offA(0); };
        const ribbons = pass => { if (!F.nr) return; gl.useProgram(PR.p); cam(PR, F); gl.uniform1f(PR.U.u_pass, pass); gl.bindBuffer(gl.ARRAY_BUFFER, br); gl.bufferData(gl.ARRAY_BUFFER, F.rib.subarray(0, F.nr * 9), gl.DYNAMIC_DRAW); attr(0, 3, 9, 0); attr(1, 2, 9, 3); attr(2, 4, 9, 5); offA(3); gl.drawArrays(gl.TRIANGLES, 0, F.nr); draws++; };
        if (!F.ground) { gl.viewport(0, 0, W, Hh); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); flowers(0); gl.depthMask(false); funnels(0); ribbons(0); gl.depthMask(true);   // the left half: the flowers, solid; then the wind's veils over them
          gl.viewport(W, 0, W, Hh); gl.colorMask(false, false, false, false); flowers(1); gl.colorMask(true, true, true, true); }   // the right half: their depth first
        gl.viewport(W, 0, W, Hh); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);                                             // then light alone, added
        if (F.nq) { gl.useProgram(PQ.p); cam(PQ, F); gl.uniform2fv(PQ.U.u_ps, F.ps); gl.uniform1f(PQ.U.u_t, F.t); gl.bindBuffer(gl.ARRAY_BUFFER, bq); gl.bufferData(gl.ARRAY_BUFFER, F.quads.subarray(0, F.nq * 15), gl.DYNAMIC_DRAW); attr(0, 3, 15, 0); attr(1, 2, 15, 3); attr(2, 2, 15, 5); attr(3, 1, 15, 7); attr(4, 4, 15, 8); attr(5, 3, 15, 12); gl.drawArrays(gl.TRIANGLES, 0, F.nq); draws++; }
        if (!F.ground) { funnels(1); ribbons(1); }
        gl.depthMask(true); offA(0);
        if (!F.ground) { stats.draws = draws + (stats.gDraws || 0); stats.quads = F.nq / 6; stats.ribbonTris = F.nr / 3; stats.blossoms = F.nb; stats.petals = F.np; stats.funnels = F.nf; stats.W = W; stats.H = Hh; stats.frames++;
          stats.maxDraws = Math.max(stats.maxDraws || 0, stats.draws); stats.maxQuads = Math.max(stats.maxQuads || 0, F.nq / 6); stats.maxRibbonTris = Math.max(stats.maxRibbonTris || 0, F.nr / 3); stats.maxBlossoms = Math.max(stats.maxBlossoms || 0, F.nb); stats.maxPetals = Math.max(stats.maxPetals || 0, F.np); stats.maxFunnels = Math.max(stats.maxFunnels || 0, F.nf); stats.gDraws = 0; }
        else stats.gDraws = draws;
        return cv; } catch (e) { ok = false; why = String(e && e.message || e); return null; } }
    function blit(c, W, Hh, dx, dy, dw, dh, lightOnly) { c.globalAlpha = 1; if (!lightOnly) { c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, W, Hh, dx, dy, dw, dh); } c.globalCompositeOperation = 'lighter'; c.drawImage(cv, W, 0, W, Hh, dx, dy, dw, dh); c.globalCompositeOperation = 'source-over'; }
    /* (tests) right after render: pixels that break rgb <= a */
    function check() { if (!gl) return null; const W = cv.width, Hh = cv.height, px = new Uint8Array(W * Hh * 4); gl.readPixels(0, 0, W, Hh, gl.RGBA, gl.UNSIGNED_BYTE, px); let bad = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3]; if (a) lit++; if (px[i] > a + 1 || px[i + 1] > a + 1 || px[i + 2] > a + 1) bad++; } return { bad, lit, px: W * Hh }; }
    return { usable, render, blit, check, stats, tris: () => ({ blossom: NBV / 3, petal: NPV / 3, funnel: NFV / 3 }), info: () => ({ ok, soft, renderer: info, why }) }; })();
  const gpuOn = () => { try { return GFXM.usable(); } catch (e) { return false; } };
  BM.GFX = GFXM;

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
    spark(x, y, z, s, col, a) { const X = this.sx(x), Y = this.sy(y, z); if (this.L && !this.off(X, Y)) D2.spark(X, Y, s * this.T, col, a); } };
  /* the GPU painter: the same calls batched as geometry in the world (a frame local to the caster: x east, y toward the
     camera, z up; a circle on the ground stays a circle there and the camera squashes it) */
  const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const q = hexRGB(h || P.mint); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGB.set(h, v); } return v; };
  const QV = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]], QA = [0, 0, 0, 0], QB = [0, 0, 0, 0];
  const grow = (A, need) => { if (need <= A.length) return A; const q = new Float32Array(Math.max(A.length * 2, need)); q.set(A); return q; };
  const PG = { quads: new Float32Array(15 * 6 * 300), nq: 0, rib: new Float32Array(9 * 6 * 14 * 150), nr: 0, fun: new Float32Array(14 * 24), nf: 0, flo: new Float32Array(12 * 300), nb: 0, pet: new Float32Array(12 * 300), np: 0,
    L: 1, ox: 0, oy: 0, ky: 1, Tx: 1, zk: 0.8, GY: 0.55, t: 0, c2: null, T: 1, Z: 1, kc: null, ka: 0, kk: 0, k0: 0, k1: 0, k2: 0,
    begin(o) { Object.assign(this, o); this.nq = this.nr = this.nf = this.nb = this.np = 0; },
    lx(x) { return x - this.ox; }, ly(y) { return (y - this.oy) * this.ky; },
    set(kind, col, al, q0, q1, q2) { this.kk = kind; this.kc = rgbOf(col); this.ka = al > 1 ? 1 : al; this.k0 = q0 || 0; this.k1 = q1 || 0; this.k2 = q2 || 0; this.quads = grow(this.quads, (this.nq + 6) * 15); },
    qv(x, y, z, ox, oy, u, v) { const A = this.quads, c = this.kc; let o = this.nq * 15; A[o++] = x; A[o++] = y; A[o++] = z; A[o++] = ox; A[o++] = oy; A[o++] = u; A[o++] = v; A[o++] = this.kk; A[o++] = c[0]; A[o++] = c[1]; A[o++] = c[2]; A[o++] = this.ka; A[o++] = this.k0; A[o++] = this.k1; A[o] = this.k2; this.nq++; },
    /* a quad lying flat at height z (radius r tiles), or facing the camera (half sizes in tiles) */
    flat(kind, x, y, z, r, col, al, q0, q1, q2) { if (!(al > 0.004) || !(r > 0.01)) return; this.set(kind, col, al, q0, q1, q2); const X = this.lx(x), Y = this.ly(y); for (let j = 0; j < 6; j++) this.qv(X + QV[j][0] * r, Y + QV[j][1] * r, z, 0, 0, QV[j][0], QV[j][1]); },
    bill(kind, x, y, z, r, col, al, q0, q1, q2) { if (!(al > 0.004) || !(r > 0.01)) return; this.set(kind, col, al, q0, q1, q2); const X = this.lx(x), Y = this.ly(y), k = r * this.Tx; for (let j = 0; j < 6; j++) this.qv(X, Y, z, QV[j][0] * k, QV[j][1] * k, QV[j][0], QV[j][1]); },
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
    inst(pet, x, y, z, s, rot, col, a, tilt, yaw) { if (!this.L || !(a > 0.02)) return; let A = pet ? this.pet : this.flo; const n = pet ? this.np : this.nb; A = grow(A, (n + 1) * 12); if (pet) { this.pet = A; this.np++; } else { this.flo = A; this.nb++; }
      const t2 = (tilt == null ? -0.9 : tilt) * 0.5, r2 = (rot || 0) * 0.5, y2 = (yaw || 0) * 0.5; QA[0] = Math.sin(t2) * Math.cos(r2); QA[1] = -Math.sin(t2) * Math.sin(r2); QA[2] = Math.cos(t2) * Math.sin(r2); QA[3] = Math.cos(t2) * Math.cos(r2);   /* (qx(tilt) * qz(rot)) */
      const sz = Math.sin(y2), cz = Math.cos(y2); QB[0] = cz * QA[0] - sz * QA[1]; QB[1] = cz * QA[1] + sz * QA[0]; QB[2] = cz * QA[2] + sz * QA[3]; QB[3] = cz * QA[3] - sz * QA[2];                                                          /* (qz(yaw) * that) */
      const c = rgbOf(col || P.pink); let o = n * 12; A[o++] = this.lx(x); A[o++] = this.ly(y); A[o++] = z; A[o++] = s; A[o++] = QB[0]; A[o++] = QB[1]; A[o++] = QB[2]; A[o++] = QB[3]; A[o++] = c[0]; A[o++] = c[1]; A[o++] = c[2]; A[o] = a > 1 ? 1 : a; },
    blossom(x, y, z, s, rot, col, a, tilt, yaw) { this.inst(false, x, y, z, s, rot, col, a, tilt, yaw); }, petal(x, y, z, s, rot, col, a, tilt, yaw) { this.inst(true, x, y, z, s * 0.62, rot, col, a, tilt, yaw); },
    spark(x, y, z, s, col, a) { if (this.L) { this.bill(0, x, y, z, s * 1.6, col || P.pale, a); this.bill(0, x, y, z, s * 0.6, P.white, a); } } };

  /* ================= the frame of a session: its effects (items) and particles, updated and painted in one fx =================
     Two layers a frame: the marks on the ground under the creatures (drawUnder), everything that stands or flies over them (draw). */
  const GS = { fx: null, ctx: null, items: [], parts: [] };
  function frame(ctx) { if (GS.fx && GS.fx.life > 0 && GS.ctx && GS.ctx.H === ctx.H) { GS.ctx = ctx; return GS; } GS.ctx = ctx; GS.items = []; GS.parts = []; const H = ctx.H, X = H.X;
    const pass = (c, layer) => { const T = X.Tz(), Z = T * zk(GS.ctx, T), t = GS.fx.t || 0, GY = H.GY || 0.55; let Q;
      const paint = () => { for (const it of GS.items) { try { it.paint(Q, it); } catch (e) { /* (one effect's picture) */ } }
        if (layer) for (const p of GS.parts) { const u = p.t / p.life, a = Math.min(1, (1 - u) * 3) * Math.min(1, p.t * 8) * p.a; if (p.kind === 0) Q.spark(p.x, p.y, p.z, p.size * (1 - 0.5 * u), p.col, a); else if (p.kind === 1) Q.blossom(p.x, p.y, p.z, p.size, p.rot, p.col, a, -0.9 + 0.7 * Math.sin(p.t * 2.3 + p.ph), p.ph + p.t * p.vr * 0.4); else Q.petal(p.x, p.y, p.z, p.size, p.rot, p.col, a, 1.2 * Math.sin(p.t * 3.1 + p.ph), p.ph + p.t * p.vr * 0.5); } };
      if (!GS.items.length && !GS.parts.length) return;
      if (gpuOn()) { const B = c.getTransform(), cv0 = c.canvas, G = TUNE.gpu, k0 = Math.min(LOW() ? G.resLow : G.res, G.maxSide / Math.max(cv0.width, cv0.height)), W = Math.max(8, Math.round(cv0.width * k0)), Hh = Math.max(8, Math.round(cv0.height * k0)), kx = W / cv0.width;
        const v = GS.ctx.vehicle || {}, ox = v.x || 0, oy = v.y || 0, SX0 = H.sx(ox), SY0 = H.sy(oy), Tx = (H.sx(ox + 1) - SX0) || T, Ty = (H.sy(oy + 1) - SY0) || T, A = B.a * kx, Bb = B.b * kx, Cc = B.c * kx, D = B.d * kx, E = B.e * kx, Ff = B.f * kx, zr = Z / Tx, nn = Math.hypot(zr, GY), cy = zr / nn, cz = GY / nn;
        PG.begin({ L: layer, ox, oy, ky: Ty / (Tx * GY), Tx, zk: zr, GY, t, c2: c, T, Z }); Q = PG; paint();
        const PX = [A * Tx * 2 / W, Cc * Tx * GY * 2 / W, -Cc * Z * 2 / W, (A * SX0 + Cc * SY0 + E) * 2 / W - 1], PY = [-Bb * Tx * 2 / Hh, -D * Tx * GY * 2 / Hh, D * Z * 2 / Hh, 1 - (Bb * SX0 + D * SY0 + Ff) * 2 / Hh];
        const st = anchor(GS.ctx, 'seat'), lx = PG.lx(st.x), ly = PG.ly(st.y), lz = st.z + 0.35, hole = 0.42 * Tx * Math.abs(A), bright = !layer || !v.x && !v.y || GS.items.some(it => it.bright);   /* (the pet's face: a soft hole about 0.8 tiles wide; not on the ground layer, which lies under the pet anyway) */
        const cvG = GFXM.render({ W, H: Hh, t, ground: !layer, px: PX, py: PY, pet: [PX[0] * lx + PX[1] * ly + PX[2] * lz + PX[3], PY[0] * lx + PY[1] * ly + PY[2] * lz + PY[3], bright ? 0 : 1], pa: [W / 2 / hole, Hh / 2 / hole], pd: [0, -cy / 60, -cz / 60, 0], ps: [A * 2 / W, -D * 2 / Hh], v: [0, cy, cz], l: [-0.34, 0.47, 0.81],
          quads: PG.quads, nq: PG.nq, rib: PG.rib, nr: PG.nr, fun: PG.fun, nf: PG.nf, flo: PG.flo, nb: PG.nb, pet: PG.pet, np: PG.np });
        if (cvG) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); GFXM.blit(c, W, Hh, 0, 0, cv0.width, cv0.height, !layer); c.restore(); } }
      else { D2.c = c; D2.GY = GY; D2.t = t; P2.H = H; P2.T = T; P2.Z = Z; P2.GY = GY; P2.t = t; P2.L = layer; P2.c2 = c; { const st = anchor(GS.ctx, 'seat'); P2.px = H.sx(st.x); P2.py = H.sy(st.y) - (st.z + 0.35) * Z; P2.pr = GS.items.some(it => it.bright) ? 0 : 0.75 * T; } Q = P2; c.save(); paint(); c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } };
    GS.fx = H.add({ key: 'belladonna-moves', life: 1e9, t: 0,
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

  /* ================= Wildflowers ================= */
  function wildflowers(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, tu = TUNE.wild, S = SS(ctx), aim = aimOf(ctx, tu.reach), L = LOW(), tC = now(ctx), nT = Math.round(tu.dur / tu.every), GY = H.GY || 0.55;
    sfx(X, 'whoosh'); sfx(X, 'hiss', 0.7, 0.22, 900); sfx(X, 'chime', 880, 1); sfx(X, 'note', 660, 0.5, 'triangle', 0.07, 990);
    { const p = anchor(ctx, 'center'); emit(ctx, 1, p.x, p.y, p.z, 10, { v: 6, dir: aim.a, spread: 0.7, up: 1 }); emit(ctx, 2, p.x, p.y, p.z, 14, { v: 7, dir: aim.a, spread: 0.8, up: 1 }); }
    // the casting recovery (its own little item, so a recast's recovery is its own too)
    add(ctx, { life: 5, abort() { done(); }, update(dt, it) { const u = cl((now(ctx) - tC) / tu.cast); clip(ctx, 'cast', u); if (u >= 1) { clip(ctx, 'rest'); it.life = 0; done(); } },
      paint(Q) { const p = anchor(ctx, 'center'), u = cl((now(ctx) - tC) / tu.cast); Q.glow(p.x, p.y, p.z, 1.5 + 2 * u, P.pink, 0.4 * (1 - u)); Q.halo(p.x, p.y, p.z, 3.2 * eout(u), 0.7 * (1 - u), P.blush, 0.5); } });
    // one field a caster: a recast moves and restarts the one that stands
    if (S.wild && S.wild.life > 0) { const F = S.wild; F.x = aim.x; F.y = aim.y; F.t0 = tC + tu.cast * 0.5; F.k = 0; F.ctx = ctx; F.born = F.t0; ctx.wildPlan = F.plan(); ctx.field = F; return; }
    // what the storm is made of: blossoms, petals and ribbons on their own orbits (radius as a share of r, height, speed)
    const NB = L ? 16 : 34, NP = L ? 10 : 22, NRB = L ? 5 : 9, fl = [], rb = [];
    for (let i = 0; i < NB + NP; i++) fl.push({ pet: i >= NB, r: 0.2 + 0.78 * Math.sqrt(R1(i * 3.1)), z: 0.35 + 0.95 * (i % 4) + 0.3 * R1(i * 5.3), ph: R1(i * 7.7) * TAU, w: 1.5 + 1.6 * R1(i * 2.9), s: 0.34 + 0.16 * R1(i * 9.1), col: PINKS[i % PINKS.length], vr: 2 + 4 * R1(i * 4.4) });
    for (let i = 0; i < NRB; i++) rb.push({ r: 0.36 + 0.64 * (i / (NRB - 1)), z: 0.2 + 2.4 * R1(i * 6.1 + 2), ph: i * 2.4, w: 2.6 - 1.2 * (i / NRB), span: 1.5 + 1.3 * R1(i * 3.3 + 1), wd: 0.5 + 0.35 * R1(i * 8.3), col: i % 3 === 2 ? P.blush : i % 3 ? P.mint : P.pale });
    stats.fields = 1;
    const F = S.wild = add(ctx, { life: 60, x: aim.x, y: aim.y, r: tu.r, t0: tC + tu.cast * 0.5, born: tC + tu.cast * 0.5, k: 0, tick: 0,
      plan() { return { x: this.x, y: this.y, r: tu.r, t0: this.t0, ticks: nT, tick: tu.every, every: tu.every, life: tu.dur, dmg: tu.dmg }; }, abort() { S.wild = null; stats.fields = 0; },
      update(dt, it) { const c2 = it.ctx, t = now(c2);
        while (it.k < nT && t >= it.t0 + (it.k + 1) * tu.every) { it.k++; it.tick = 1; stats.wildTicks++; stats.wildHits += hitA(c2, it.x, it.y, tu.r, dkOf(c2) * tu.dmg, { once: {}, el: 'wind', src: 'strong', kb: 0 }); sfx(X, 'hiss', 0.25, 0.1, 1400); if (it.k % 2) sfx(X, 'note', 1320 + 220 * (it.k % 3), 0.12, 'sine', 0.035, 1760);
          emit(c2, 2, it.x, it.y, 0.6, 4, { r: tu.r * 0.6, v: 3, up: 2 }); }
        it.tick = Math.max(0, it.tick - dt * 3.5); if (t >= it.t0 + nT * tu.every + 0.5) { it.life = 0; S.wild = null; stats.fields = 0; if (c2.field === it) c2.field = null; } },
      paint(Q, it) { const t = now(it.ctx), age = t - it.born, end = it.t0 + nT * tu.every, A = sm(age / 0.35) * (1 - sm((t - end) / 0.5)); if (A <= 0.01) return; const x = it.x, y = it.y, R = tu.r, grow = 0.55 + 0.45 * eout(age / 0.4), tt = Q.t;
        // the bounded footprint on the floor (light only): its sharp rim is the damage radius
        Q.floorGlow(x, y, 0.02, R * 1.05, 0.2 * A, P.pink); Q.ring(x, y, 0.03, R * grow, (0.55 + 0.4 * it.tick) * A, P.mint, 0.5); Q.air(x, y, 0.04, R * grow, 0.5 * A, 2);
        if (it.tick > 0.02) Q.ring(x, y, 0.05, R * (1 - 0.5 * it.tick), 0.5 * it.tick * A, P.blush, 0.4);
        // the ribbons: coherent currents all turning one way, each at its own height
        for (const q of rb) Q.arc(x, y, q.z, R * q.r * grow, q.ph + tt * q.w, q.span, q.wd, q.col, 0.8 * A, 0.3);
        for (let i = 0; i < (L ? 4 : 6); i++) Q.arc(x, y, 0.25 + 1.05 * (i >> 1), R * grow, tt * (1.9 - 0.25 * (i >> 1)) + (i & 1) * PI + i * 0.5, 2.7, 0.75, i % 3 ? P.mint : P.pale, 0.95 * A, 0.5);   /* (long currents right round the field's edge: its footprint) */
        // the flowers on their orbits at several heights: the far ones first (the 2D path has no depth of its own)
        for (let pass = 0; pass < 2; pass++) for (const q of fl) { const an = q.ph + tt * q.w / (0.5 + q.r), si = Math.sin(an); if ((si < 0) !== (pass === 0)) continue; const rr = R * q.r * grow, fx = x + Math.cos(an) * rr, fy = y + si * rr * GY, fz = q.z + 0.25 * Math.sin(tt * 2 + q.ph), a = A * (si < 0 ? 0.5 : 1);
          if (q.pet) Q.petal(fx, fy, fz, q.s, an * 2 + tt * q.vr, q.col, a, 1.1 * Math.sin(tt * 2.2 + q.ph), an); else Q.blossom(fx, fy, fz, q.s, tt * q.vr * 0.4 + q.ph, q.col, a, -0.9 + 0.5 * Math.sin(tt * 1.7 + q.ph), 0.6 * Math.sin(an)); } } });
    ctx.wildPlan = F.plan(); ctx.field = F; }

  /* ================= Ring Blade ================= */
  /* a stand-in for the model's ring (a core or a test without the model): the ring and eight radial swords */
  function ringPic(c, sx, sy, R, spin, glow, GY) { c.save(); c.translate(sx, sy); c.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = spin + i * TAU / 8, co = Math.cos(a), si = Math.sin(a) * GY; c.strokeStyle = '#E9F4F2'; c.lineWidth = Math.max(1.5, R * 0.05); c.beginPath(); c.moveTo(co * R * 0.42, si * R * 0.42); c.lineTo(co * R, si * R); c.stroke(); c.strokeStyle = '#E7C873'; c.lineWidth = Math.max(2, R * 0.07); c.beginPath(); c.moveTo(co * R * 0.36, si * R * 0.36); c.lineTo(co * R * 0.45, si * R * 0.45); c.stroke(); }
    c.strokeStyle = '#F4EBC8'; c.lineWidth = Math.max(2, R * 0.08); c.beginPath(); c.ellipse(0, 0, R * 0.34, R * 0.34 * GY, 0, 0, TAU); c.stroke(); c.strokeStyle = `rgba(143,232,200,${0.4 + 0.25 * glow})`; c.lineWidth = Math.max(1, R * 0.03); c.beginPath(); c.ellipse(0, 0, R * 0.34, R * 0.34 * GY, 0, 0, TAU); c.stroke(); c.restore(); }
  const ringSet = (ctx, S, s) => { S.ring = s; stats.ringState = s; try { if (typeof ctx.ringState === 'function') ctx.ringState(s); } catch (e) {} };
  const ringOf = (ctx, S) => { try { if (typeof ctx.ring === 'string') return ctx.ring; } catch (e) {} return S.ring; };
  function ringBlade(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return false; }
    const H = ctx.H, X = H.X, tu = TUNE.ring, S = SS(ctx); if ((S.ringItem && S.ringItem.life > 0) || ringOf(ctx, S) !== 'overhead') { done(); return false; }   /* (no recast while it is away) */
    const aim = aimOf(ctx, tu.reach), from = anchor(ctx, 'ring'), reg = {}, L = LOW(), NTR = 30, trail = new Float32Array(3 * NTR), pts = new Float32Array(3 * NTR), DK = dkOf(ctx), GY = H.GY || 0.55;
    const side = R1(aim.a * 7) < 0.5 ? -1 : 1, RT = tipR(); let ph = 0, t = 0, spin = 0, nT = 0, back = tu.back, tOut = 0.3, p = { x: from.x, y: from.y, z: from.z }, b0 = null, fl = 0;
    stats.ringThrows++; sfx(X, 'note', 520, tu.windup, 'triangle', 0.08, 1040); sfx(X, 'hiss', tu.windup, 0.12, 1800);
    const home = () => { ringSet(ctx, S, 'overhead'); S.ringItem = null; clip(ctx, 'rest'); };
    const hitAt = (x, y, r) => { stats.ringHits += hitA(ctx, x, y, r, DK * tu.dmg, { once: reg, el: 'wind', src: 'strong', kb: 3 }); };
    const wantBack = it => it.recall || !!ctx.recall;
    S.ringItem = add(ctx, { life: 30, recall: false, abort() { home(); done(); },
      update(dt, it) { t += dt; spin += (ph === 0 ? 8 + 26 * sm(t / tu.windup) : ph === 3 ? 14 : 30) * dt;
        if (ph === 0) { p = anchor(ctx, 'ring'); clip(ctx, 'ringWind', t / tu.windup); if (t >= tu.windup) { ph = 1; t = 0; ringSet(ctx, S, 'outbound'); clip(ctx, 'ringThrow', 1); sfx(X, 'whoosh'); sfx(X, 'note', 1400, 0.3, 'sawtooth', 0.04, 700); from.x = p.x; from.y = p.y; from.z = p.z; tOut = Math.max(0.12, Math.hypot(aim.x - p.x, aim.y - p.y) / tu.speed); done(); } }
        else if (ph === 1) { const u = cl(t / tOut); p.x = lerp(from.x, aim.x, u); p.y = lerp(from.y, aim.y, u); p.z = lerp(from.z, tu.low, sm(u * 1.6)); hitAt(p.x, p.y, tu.r);   /* (the sweep) */
          if (!L || Math.random() < 0.5) emit(ctx, 2, p.x, p.y, p.z, 1, { v: 2, up: 0.6, life: 0.7 });
          if (u >= 1 || wantBack(it)) { ph = 2; t = 0; if (u >= 1) { hitAt(p.x, p.y, tu.flourishR); fl = 1; sfx(X, 'whoosh'); sfx(X, 'hiss', 0.5, 0.25, 1200); sfx(X, 'chime', 1175, 1); shake(ctx, 4, 0.18); X.light && X.light(p.x, p.y, tu.flourishR * 1.3, 0.4); emit(ctx, 1, p.x, p.y, 0.8, 14, { v: 8, up: 2.5, r: 1 }); emit(ctx, 2, p.x, p.y, 0.8, 30, { v: 9, up: 2.5, r: 1 }); emit(ctx, 0, p.x, p.y, 0.8, 14, { v: 8 }); } } }   /* (the flourish: the same registry, so the whole throw is one activation an enemy) */
        else if (ph === 2) { if (t >= tu.flourish || wantBack(it)) { ph = 3; t = 0; ringSet(ctx, S, 'returning'); b0 = { x: p.x, y: p.y, z: p.z }; if (wantBack(it)) back = tu.recall; sfx(X, 'hiss', back, 0.1, 2000); } }
        else { if (wantBack(it) && back > tu.recall) { t = t / back * tu.recall; back = tu.recall; } const u = cl(t / back), e = sm(u), q = anchor(ctx, 'ring'), mx = (b0.x + q.x) / 2 - Math.sin(aim.a) * side * 2.6, my = (b0.y + q.y) / 2 + Math.cos(aim.a) * side * 2.6, mz = Math.max(b0.z, q.z) + 0.6, k0 = (1 - e) * (1 - e), k1 = 2 * e * (1 - e), k2 = e * e;
          p.x = k0 * b0.x + k1 * mx + k2 * q.x; p.y = k0 * b0.y + k1 * my + k2 * q.y; p.z = k0 * b0.z + k1 * mz + k2 * q.z; clip(ctx, 'ringCatch', u);   /* (the return: a harmless curve home) */
          if (u >= 1) { home(); sfx(X, 'chime', 1568, 1); emit(ctx, 0, q.x, q.y, q.z, 8, { v: 3 }); it.life = 0; } }
        fl = Math.max(0, fl - dt / 0.55);
        if (ph >= 1) { if (nT < NTR) nT++; trail.copyWithin(3, 0, (NTR - 1) * 3); trail[0] = p.x; trail[1] = p.y; trail[2] = p.z; } },
      paint(Q) { const away = ph >= 1, k = ph === 0 ? sm(t / tu.windup) : 1, R = RT;
        if (away) { // the translucent disc of turbulent air: on the ground (the sweep's reach) and under the ring itself
          if (ph < 3) { Q.air(p.x, p.y, 0.05, tu.r, 0.7, 1); Q.ring(p.x, p.y, 0.05, tu.r, 0.7, P.mint, 0.45); Q.air(p.x, p.y, Math.max(0.3, p.z - 0.08), R * 0.97, 0.55, 5); }
          // long trails off both rims of its path
          if (nT > 3) for (const sd of [-1, 1]) { for (let i = 0; i < nT; i++) { const i0 = Math.max(0, i - 1), i1 = Math.min(nT - 1, i + 1), dx = trail[i0 * 3] - trail[i1 * 3], dy = (trail[i0 * 3 + 1] - trail[i1 * 3 + 1]) / GY, d = Math.hypot(dx, dy) || 1; pts[i * 3] = trail[i * 3] - dy / d * R * sd * 0.95; pts[i * 3 + 1] = trail[i * 3 + 1] + dx / d * R * sd * 0.95 * GY; pts[i * 3 + 2] = trail[i * 3 + 2]; } Q.ribbon(pts, nT, 1.0, sd, sd < 0 ? P.mint : P.pale, ph === 3 ? 0.5 : 0.95); }
          // the ring itself: the model's own assembly (or its stand-in), drawn on the frame's 2D canvas under the light
          const c = Q.L ? Q.c2 : null, M = ctx.model || self.BELLADONNA_MODEL; let ok = false;
          if (c) { c.save(); try { if (M && typeof M.drawRing === 'function') { M.drawRing(c, p.x, p.y, p.z, Object.assign({}, ctx.poseObj || {}, { ring: 1, ringAway: 0, ringSpin: spin, ringGlow: 2, ringTilt: 0, alpha: 1 }), { T: Q.T, sx: H.sx, sy: H.sy, scale: 1 }); ok = true; } } catch (e) { ok = false; } c.restore();
            if (!ok) ringPic(c, H.sx(p.x), H.sy(p.y) - p.z * Q.Z, R * Q.T, spin, 2, GY * 0.75); } }
        // the luminous rim and the eight blade trails (each a short ribbon in the ring's plane behind its sword tip)
        const a = away ? 1 : 0.7 * k; Q.glow(p.x, p.y, p.z, R * 0.9, P.mint, 0.4 * a); Q.ring(p.x, p.y, Math.max(0.3, p.z), R * 0.36, a, P.pale, 0.25); Q.ring(p.x, p.y, Math.max(0.3, p.z), R, 0.75 * a, P.mint, 0.5);
        for (let i = 0; i < 8; i++) Q.arc(p.x, p.y, p.z, away ? R : R * 0.9, spin + i * TAU / 8, -(0.4 + 0.6 * k), 0.6, i % 2 ? P.pale : P.mint, 0.95 * a, 0);
        // the flourish at the end of its route: a broad spiral of wind thrown outward and upward
        if (fl > 0.01) { const u = 1 - fl, RF = tu.flourishR * (0.35 + 0.65 * eout(u)); Q.ring(p.x, p.y, 0.05, RF, fl, P.pale, 0.7); Q.air(p.x, p.y, 0.06, RF, 0.8 * fl, 4); Q.floorGlow(p.x, p.y, 0.02, RF * 1.1, 0.5 * fl, P.mint);
          for (let i = 0; i < 8; i++) Q.arc(p.x, p.y, 0.3 + 0.4 * i + 1.2 * u, RF * (0.45 + 0.08 * i), spin * 0.5 + i * 0.9, 2.6, 0.8, i % 3 === 2 ? P.blush : i % 3 ? P.mint : P.pale, fl, 0.6); } } });
    ctx.ringPlan = { from: { x: from.x, y: from.y }, to: { x: aim.x, y: aim.y }, r: tu.r, flourishR: tu.flourishR, dmg: tu.dmg }; return true; }
  BM.ringState = ctx => { try { return ringOf(ctx, SS(ctx)); } catch (e) { return 'overhead'; } };
  BM.recallRing = ctx => { try { const S = SS(ctx); if (S.ringItem && S.ringItem.life > 0) { S.ringItem.recall = true; return true; } } catch (e) {} return false; };

  /* ================= Twister ================= */
  function twister(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, tu = TUNE.twister, S = SS(ctx), tier = tierOf(ctx), DK = dkOf(ctx), L = LOW(), N = tu.n, x0 = v.x, y0 = v.y, th0 = R1(x0 + y0) * TAU, GY = H.GY || 0.55;
    const per = DK * tu.per[tier], fin = DK * (tu.total[tier] - tu.per[tier] * (tu.ticks - 1)), TA = tu.settle, TB = TA + tu.marks, tk = tu.dur / tu.ticks;
    let t = 0, ph = S.ringItem && S.ringItem.life > 0 ? -1 : 0, tS = 0, k = 0, pulse = 0, endT = 0, ret = false, finished = false, spin = 0; const plan = ctx.twisterPlan = { t0: null, t1: null, ticks: tu.ticks, tick: tk, tornadoes: N, n: N, r: tu.r, orbitR: tu.orbitR, core: tu.core, per, final: fin, at: [], fired: 0 };
    v.locked = true; if (ph < 0) BM.recallRing(ctx);   /* (a thrown ring is called home, visibly, before the finisher begins) */
    cam(ctx, { zoom: tu.zoom, x: x0, y: y0, k: 0.7 }); sfx(X, 'hum'); sfx(X, 'note', 196, TB, 'triangle', 0.1, 392);
    const pos = (i, ts) => { const a = th0 + i * TAU / N + tu.omega * Math.max(0, ts); return [x0 + Math.cos(a) * tu.orbitR, y0 + Math.sin(a) * tu.orbitR * GY, a]; };
    /* one scheduled tick: every funnel strikes on the same deadline through ONE registry, so an enemy is hit once however many funnels hold it */
    const tick = last => { const reg = {}, dmg = last ? fin : per, r = tu.r * (last ? tu.lastR : 1), ts = now(ctx) - plan.t0; let n = hitA(ctx, x0, y0, tu.core, dmg, { once: reg, noCharge: true, el: 'wind', src: 'ult', kb: 0 });   /* (the storm round the flower itself, inside the ring of funnels: the same tick, the same registry) */
      for (let i = 0; i < N; i++) { const q = pos(i, ts); n += hitA(ctx, q[0], q[1], r, dmg, { once: reg, noCharge: true, el: 'wind', src: 'ult', kb: last ? 5 : 0 }); } stats.twisterTicks++; stats.twisterHits += n; plan.fired++; return n; };
    add(ctx, { life: 60, keep: true, abort() { stats.twisters = 0; done(); },
      update(dt, it) { if (ph < 4 && !live(ctx)) { it.life = 0; stats.twisters = 0; cam(ctx, null); done(); return; } const tn = now(ctx);
        if (ph < 0) { if (!(S.ringItem && S.ringItem.life > 0)) { ph = 0; t = 0; } return; } t += dt;
        const build = ph === 2 ? cl((tn - plan.t0) / tu.dur) : ph >= 3 ? 1 : 0; spin += (6 + 16 * (ph >= 1 ? 0.4 + 0.6 * build : sm(t / TA))) * dt;
        if (ph < 2) clip(ctx, 'twisterOpen', t / TB); else if (ph === 2) clip(ctx, 'twisterHold', build);
        if (ph === 0 && t >= TA) { ph = 1; for (let i = 0; i < N; i++) sfx(X, 'note', 784 * Math.pow(1.122, i), 0.22, 'sine', 0.05, null, i * 0.09); sfx(X, 'hiss', tu.marks, 0.15, 700); }
        if (ph === 1 && t >= TB) { ph = 2; plan.t0 = tn; plan.t1 = tn + tu.dur; tS = tn; stats.twisters = N; for (let i = 0; i < tu.ticks; i++) plan.at.push(tn + (i + 1) * tk);   /* (every deadline of the storm; the last one is the final pulse) */ sfx(X, 'whoosh'); sfx(X, 'hiss', tu.dur, 0.3, 500); sfx(X, 'note', 110, tu.dur, 'sawtooth', 0.06, 220); shake(ctx, 5, 0.3);
          for (let i = 0; i < N; i++) { const q = pos(i, 0); emit(ctx, 2, q[0], q[1], 0.4, 6, { v: 4, up: 4 }); emit(ctx, 1, q[0], q[1], 0.4, 3, { v: 3, up: 4 }); } }
        if (ph === 2) { while (k < tu.ticks && tn >= plan.at[k]) { const last = k === tu.ticks - 1; k++; tick(last); pulse = Math.max(pulse, last ? 1 : 0.5); if (!last && (!L || k % 2)) { const ts2 = tn - plan.t0; for (let i = k % 2; i < N; i += 2) { const q = pos(i, ts2); emit(ctx, 2, q[0], q[1], 0.2, 2, { v: 4.5, up: 3.5, r: 0.5, life: 1.1 }); emit(ctx, 0, q[0], q[1], 0.2, 1, { v: 4, up: 2, col: P.gold }); } }
            if (!last) { if (k % 2 === 0) { sfx(X, 'hiss', 0.2, 0.12, 900 + 45 * k); sfx(X, 'note', 440 + 28 * k, 0.14, 'triangle', 0.045, 660 + 35 * k); shake(ctx, 2 + k * 0.15, 0.1); } if (k >= tu.ticks - 4) clip(ctx, 'twisterPulse', (k - (tu.ticks - 4)) / 3); }
            else { ph = 4; endT = tn;   /* (the final pulse: the last scheduled tick, through the same kind of registry) */
            sfx(X, 'crash'); sfx(X, 'whoosh'); sfx(X, 'sparkle'); sfx(X, 'chime', 1568, 2); sfx(X, 'note', 55, 1.6, 'sine', 0.7, 28); sfx(X, 'hiss', 1.4, 0.35, 2200); shake(ctx, 14, 0.5); X.flash && X.flash(RM() ? 0.08 : 0.2, '#EFFFF8'); X.hitstop && X.hitstop(0.08); X.light && X.light(x0, y0, tu.orbitR * 1.8, 1.2);
            const ts = tn - plan.t0; for (let i = 0; i < N; i++) { const q = pos(i, ts); emit(ctx, 1, q[0], q[1], 1.5, L ? 3 : 7, { v: 7, up: 5, rz: 1.5, life: 2.2 }); emit(ctx, 2, q[0], q[1], 1.5, L ? 5 : 11, { v: 8, up: 6, rz: 1.5, life: 2.4, col: i % 2 ? P.pearl : null }); emit(ctx, 0, q[0], q[1], 1.5, 5, { v: 7, up: 4 }); } } }
          if (ph === 2 && (!L || Math.random() < 0.4)) { const i = (Math.random() * N) | 0, q = pos(i, tn - plan.t0); emit(ctx, 2, q[0], q[1], rnd(0.3, tu.h), 1, { v: 2, up: 2, life: 1 }); } }
        pulse = Math.max(0, pulse - dt * 3);
        it.bright = ph === 4 && tn - endT < 0.3;
        if (ph === 4) { const u = tn - endT; clip(ctx, 'unwind', u / tu.unwind); if (u > 0.4) stats.twisters = 0;
          if (!finished && u >= tu.unwind) { finished = true; const p = anchor(ctx, 'center'); emit(ctx, 2, p.x, p.y, p.z, L ? 12 : 28, { v: 5, up: 2, r: 1.2, rz: 1, life: 2.6 }); emit(ctx, 1, p.x, p.y, p.z, L ? 4 : 10, { v: 4, up: 2, r: 1, life: 2.4 }); emit(ctx, 0, p.x, p.y, p.z, 12, { v: 4, up: 2 }); sfx(X, 'chime', 1046, 1);
            clip(ctx, 'rest'); if (!ret) { ret = true; try { ctx.returnPoint = ctx.safeReturn ? ctx.safeReturn() : null; } catch (e) {} } cam(ctx, null); done(); it.life = 0; } } },   /* (the safe return, then the core's exit: no damage there) */
      paint(Q) { if (ph < 0) return; const tt = Q.t, tn = now(ctx), hub = anchor(ctx, 'center'), R = tu.r, OR = tu.orbitR;
        const ts = ph >= 2 ? Math.min(tn - plan.t0, ph >= 4 ? endT - plan.t0 + (tn - endT) * 0.5 : 1e9) : 0, build = ph === 2 ? cl((tn - plan.t0) / tu.dur) : ph >= 3 ? 1 : 0, un = ph === 4 ? cl((tn - endT) / tu.unwind) : 0, rise = ph >= 2 ? eout((tn - tS) / 0.45) : 0, fade = 1 - sm(un * 1.15), tm = ph >= 2 ? TB : t;
        // the stage under the flower: the Wind seal, the storm's bounded reach
        const sa = sm(tm / TA) * fade; if (!(Q.lite2d && ph >= 2)) Q.seal(x0, y0, 0.02, OR + R, 0.5 * sa, tt * 0.25, tm / (TA + 0.3)); Q.floorGlow(x0, y0, 0.02, OR * 1.5, (0.12 + 0.14 * build) * sa, P.mint); if (ph >= 2) { Q.ring(x0, y0, 0.03, tu.core, (0.35 + 0.3 * pulse) * rise * fade, P.blush, 0.6); if (!Q.lite2d) Q.air(x0, y0, 0.03, tu.core, 0.3 * rise * fade, 7); }
        // six formation marks, lit one after another
        if (ph >= 1) for (let i = 0; i < N; i++) { const u = ph === 1 ? cl((t - TA - i * 0.09) / 0.3) : 1, q = pos(i, ts); if (u <= 0) continue; const ma = ph === 1 ? u : Math.max(0, 1 - (tn - tS) / 0.5);
          if (ma > 0.01) { Q.seal(q[0], q[1], 0.03, R * (1.4 - 0.4 * eout(u)), ma, -tt * 1.2 + i, u, P.pale); Q.floorGlow(q[0], q[1], 0.03, R * 1.3, (0.5 + (ph === 1 ? 0.9 * (1 - u) : 0)) * ma, P.blush); if (ph === 1 && u < 1) { Q.ring(q[0], q[1], 0.04, R * (0.3 + 1.2 * eout(u)), 1 - u, P.white, 0.5); Q.star(q[0], q[1], 0.3, 1.2 * (1 - u), 1 - u); } if (ph === 1) Q.beam(q[0], q[1], 0, q[0], q[1], tu.h * 0.6 * eout(u), 0.12, P.pale, 0.5 * u * (1 - u * 0.5)); } }
        // the storm round the flower: broad currents and blossoms sweeping with the funnels
        { const sa2 = (ph >= 2 ? 1 : sm((t - 0.15) / 0.5)) * fade, rt = ph >= 2 ? ts + TB : t, F2 = Q.lite2d, ns = F2 ? 9 : L ? 12 : 30; for (let i = 0; i < (F2 ? 2 : L ? 3 : 5); i++) Q.arc(x0, y0, 0.4 + 0.7 * i, OR * (0.42 + 0.13 * i), th0 + tu.omega * rt * (1.8 + 0.3 * i) + i * 1.9, 2.2, 0.8 + 0.1 * i, i % 2 ? P.blush : P.mint, (0.6 + 0.35 * build) * sa2, 0.6);
          for (let j = 0; j < ns; j++) { const an = j * 2.399 + tu.omega * rt * (1.6 + 0.8 * R1(j)), rr = OR * (0.4 + 0.5 * R1(j * 3.3)), si = Math.sin(an), fx = x0 + Math.cos(an) * rr, fy = y0 + si * rr * GY, fz = 0.4 + 3.0 * R1(j * 5.1); if (si > 0 && Math.abs(fx - hub.x) < 1.4) continue;
            if (j % 3) Q.blossom(fx, fy, fz, 0.38 + 0.14 * R1(j * 7.7), tt * 2 + j, j % 4 === 3 ? P.pearl : PINKS[j % 4], sa2 * (si < 0 ? 0.6 : 1), -0.9 + 0.5 * Math.sin(tt * 1.9 + j), 0.5 * Math.sin(an)); else Q.petal(fx, fy, fz, 0.34, tt * 3 + j, P.pearl, sa2, 1.2 * Math.sin(tt * 2.4 + j), an); } }
        // the six tornadoes (far ones first): each its base (the damage radius), the funnel's shells, ribbons climbing it, blossoms on a helix
        if (ph >= 2 && fade > 0.01) { const ord = []; for (let i = 0; i < N; i++) ord.push(pos(i, ts).concat(i)); ord.sort((p, q) => p[1] - q[1]);
          for (const q of ord) { const i = q[3], bx = q[0], by = q[1], hh = tu.h * rise * (1 + 0.9 * un), front = by > y0, near = front ? 0.35 + 0.65 * sm((Math.abs(bx - hub.x) - 0.6) / 1.6) : 1;   /* (a funnel passing in front of the pet thins, so its face stays in view) */
            const a = rise * fade * near * (0.8 + 0.2 * build + 0.7 * pulse), wT = tu.top * (1 + 0.25 * pulse), sp = 9 + 7 * build, lift = tu.h * 1.1 * un * un, F2 = Q.lite2d;
            if (!Q.lite2d) Q.floorGlow(bx, by, 0.03, R * 1.5, (0.3 + 0.4 * pulse) * rise * fade, i % 2 ? P.blush : P.mint); Q.ring(bx, by, 0.04, R * (1 + (ph === 4 ? (tu.lastR - 1) * eout(un * 3) : 0)), rise * fade, P.white, 0.55); Q.air(bx, by, 0.05, R, 0.45 * rise * fade, i);
            if (!F2) for (let j = 0; j < 3; j++) Q.arc(bx, by, 0.3, R, -tt * (3 + 2 * build) + j * TAU / 3 + i, 1.5, 0.5, j % 2 ? P.pale : P.mint, rise * fade * (0.8 + 0.2 * pulse), 0);   /* (the bright turning base ring: the damage radius) */
            Q.funnel(bx, by, lift, wT, hh, 0.24, 0.95 * a, sp, i, i % 2 ? P.pale : P.mint);
            const NA = F2 ? 2 : L ? 4 : 7; for (let j = 0; j < NA; j++) { const hq = ((j / NA + tt * (0.22 + 0.1 * build) + i * 0.13) % 1), rx = wT * lerp(0.36, 1.05, Math.pow(hq, 1.5)); Q.arc(bx, by, lift + hq * hh, rx, tt * sp * 0.5 + j * 2.1 + i, 2.3, rx * 0.32, j % 3 === 2 ? P.blush : j % 3 ? P.mint : P.pale, a * Math.sin(hq * PI) * 0.8, 0.35); }
            const NF = F2 ? 4 : L ? 8 : 16; for (let j = 0; j < NF; j++) { const hq = ((R1(i * 11 + j * 3) + tt * (0.3 + 0.12 * build)) % 1), an = j * 2.4 + tt * sp * 0.55 + i, rx = wT * lerp(0.4, 1.1, Math.pow(hq, 1.5)), fx = bx + Math.cos(an) * rx, fy = by + Math.sin(an) * rx * GY, fz = lift + hq * hh, al = rise * fade * near * Math.min(1, Math.sin(hq * PI) * 2.5);
              if (j % 3 === 2) Q.petal(fx, fy, fz, 0.3, an * 2, P.pearl, al, 1.2 * Math.sin(tt * 3 + j), an); else Q.blossom(fx, fy, fz, (F2 ? 0.5 : 0.36) + 0.08 * (j % 2), tt * 3 + j, PINKS[j % 3], al, -0.9 + 0.6 * Math.sin(tt * 2 + j), an + PI / 2); } } }
        // the build and the last pulse: the ring's eight arcs of light, the flower's light, the flash
        if (ph < 4 || un < 0.5) { const rg = anchor(ctx, 'ring'), a = sm(tm / TA) * (ph === 4 ? 1 - un * 2 : 1); Q.glow(rg.x, rg.y, rg.z, 2.3, P.mint, 0.25 * a * (0.5 + build)); for (let i = 0; i < 8; i++) Q.arc(rg.x, rg.y, rg.z, tipR(), spin + i * TAU / 8, -(0.35 + 0.4 * (0.3 + 0.7 * build)), 0.5, i % 2 ? P.pale : P.mint, 0.8 * a, 0); }
        Q.glow(hub.x, hub.y, hub.z, 2.2 + build, P.blush, 0.16 * sa * (0.6 + build));
        if (ph === 4 && un < 0.8) { const q = un / 0.8, rr = (OR + R) * (0.35 + 1.15 * eout(q)), nf = L || Q.lite2d ? 18 : 40; for (let j = 0; j < nf; j++) { const an = j / nf * TAU + q * 1.2 + (j % 2) * 0.08, si = Math.sin(an), k2 = 1 + 0.12 * R1(j * 3.7); Q.blossom(x0 + Math.cos(an) * rr * k2, y0 + si * rr * k2 * GY, 0.5 + 1.6 * R1(j * 9.1) + 1.2 * q, 0.42 + 0.14 * R1(j * 5.3), tt * 4 + j, PINKS[j % 5], Math.min(1, (1 - q) * 2.5), -0.9 + 0.8 * Math.sin(tt * 3 + j), an); }
          for (let i = 0; i < 6; i++) Q.arc(x0, y0, 0.4 + 0.5 * i + 1.5 * q, rr * (0.8 + 0.05 * i), i * 1.05 + q * 3, 1.6, 1.1, i % 2 ? P.blush : P.pale, (1 - q), 0.7); }
        if (ph === 4 && un < 0.45) { const f = 1 - un / 0.45, rm = RM() ? 0.5 : 1; Q.glow(x0, y0, 1.5, OR * 2.2, P.white, 0.8 * f * rm); for (const [d, kk] of [[0, 1.5], [0.08, 1.9]]) { const q = cl((un - d) / 0.6); if (q > 0 && q < 1) Q.ring(x0, y0, 0.06, (OR + R) * (0.4 + kk * eout(q)), 1 - q, P.pale, 0.9); } } } }); }

  /* ================= Swoosh, the summon and the exit: pictures and sound for the core ================= */
  /* D (the core's live ctx.swoosh): { x, y, z } the flower, { cx, cy, R, dir } the circle it sweeps, ph, u, dur */
  function swoosh(ctx, D) { if (!ctx.H) return null; const H = ctx.H, X = H.X, L = LOW(), NTR = 24, tr = new Float32Array(3 * NTR), pts = new Float32Array(3 * NTR), GY = H.GY || 0.55; let n = 0, t = 0, out = 0, spin = 0; D = D || {};
    sfx(X, 'whoosh'); sfx(X, 'hiss', 0.9, 0.2, 1500); sfx(X, 'note', 700, 0.6, 'sine', 0.05, 1400);
    return add(ctx, { life: 12, update(dt, it) { t += dt; spin += 9 * dt; const v = ctx.vehicle || {}, c0 = anchor(ctx, 'center'), hx = isFinite(D.x) ? D.x : v.x, hy = isFinite(D.y) ? D.y : v.y, hz = c0.z; let cur = D; try { if ('swoosh' in ctx) cur = ctx.swoosh; } catch (e) {}
        if (D.done || cur !== D || t > (D.dur || 1.5) + 0.6) { out += dt / 0.45; if (out >= 1) it.life = 0; } else { if (n < NTR) n++; tr.copyWithin(3, 0, (NTR - 1) * 3); tr[0] = hx; tr[1] = hy; tr[2] = hz; if (!L || Math.random() < 0.5) { emit(ctx, 2, hx, hy, hz, 1, { v: 1.5, up: 0.4, r: 0.8, rz: 0.6, life: 1.1 }); if (Math.random() < 0.25) emit(ctx, 1, hx, hy, hz, 1, { v: 1.5, up: 0.4, r: 0.8, life: 1.2 }); } } },
      paint(Q) { const a = (1 - out) * sm(t / 0.15); if (a <= 0.01) return;
        // mint-white ribbons off both sides of its path, a blush one inside
        if (n > 3) for (const [sd, off, col] of [[-1, 1.7, P.mint], [1, 1.7, P.pale], [1, 0.7, P.blush]]) { for (let i = 0; i < n; i++) { const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), dx = tr[i0 * 3] - tr[i1 * 3], dy = (tr[i0 * 3 + 1] - tr[i1 * 3 + 1]) / GY, d = Math.hypot(dx, dy) || 1; pts[i * 3] = tr[i * 3] - dy / d * off * sd; pts[i * 3 + 1] = tr[i * 3 + 1] + dx / d * off * sd * GY; pts[i * 3 + 2] = tr[i * 3 + 2]; } Q.ribbon(pts, n, 0.8, sd, col, 0.85 * a); }
        // the circular air distortion round the enemies it sweeps
        if (isFinite(D.cx) && D.R > 0) { const R = D.R + (D.hitR || 0) * 0.5, dir = D.dir || 1; Q.air(D.cx, D.cy, 0.05, R, 0.6 * a, 3); Q.ring(D.cx, D.cy, 0.05, R, 0.5 * a, P.mint, 0.4); for (let i = 0; i < 4; i++) Q.arc(D.cx, D.cy, 0.3 + 0.5 * i, R * (0.7 + 0.12 * i), spin * dir + i * 1.6, 2.1 * dir, 0.55, i % 2 ? P.pale : P.mint, 0.75 * a, 0.4); } } }); }
  /* the summon: a Wind seal beneath the pet, the wind rising off it; a burst of petals when the bloom opens. D { x, y, dur, stages } */
  function summon(ctx, D) { if (!ctx.H) return null; const H = ctx.H, X = H.X, tu = TUNE.summon; D = D || {}; const v = ctx.vehicle || {}, x = isFinite(D.x) ? D.x : v.x, y = isFinite(D.y) ? D.y : v.y, dur = D.dur || tu.dur, st = D.stages || {}, tb = st.bloom ? (Array.isArray(st.bloom) ? st.bloom[0] : +st.bloom) : dur * 0.4; let t = 0, bl = false;
    sfx(X, 'hum'); sfx(X, 'hiss', dur, 0.16, 800);
    return add(ctx, { life: 12, keep: true, update(dt, it) { t += dt; if (t < dur && Math.random() < (LOW() ? 0.25 : 0.6)) emit(ctx, 2, x, y, 0.2, 1, { r: tu.r * 0.7, v: 1, up: 3.5, g: -0.5, life: 1.2 }); if (!bl && isFinite(tb) && t >= tb) { bl = true; bloom(ctx, null); } if (t > dur + 0.6) it.life = 0; },
      paint(Q) { const a = sm(t / 0.3) * (1 - sm((t - dur) / 0.6)), R = tu.r; Q.seal(x, y, 0.02, R, a, t * 0.9, t / (dur * 0.4)); Q.floorGlow(x, y, 0.02, R * 1.2, 0.35 * a, P.mint);
        for (let i = 0; i < 4; i++) { const q = ((t * 0.7 + i * 0.25) % 1); Q.arc(x, y, q * 3.4, R * (0.9 - 0.4 * q), t * 4 + i * 1.7, 2.2, 0.5, i % 2 ? P.pale : P.mint, a * Math.sin(q * PI), 0.5); } } }); }
  /* the bloom: the flower bursts open; D { x, y, z } (or the model's centre) */
  function bloom(ctx, D) { if (!ctx.H) return null; const H = ctx.H, X = H.X; const p = D && isFinite(D.x) ? D : anchor(ctx, 'center'), z = p.z || 1.4; let t = 0;
    sfx(X, 'sparkle'); sfx(X, 'chime', 1318, 1); sfx(X, 'whoosh'); emit(ctx, 2, p.x, p.y, z, 22, { v: 6, up: 2.5, life: 1.8 }); emit(ctx, 1, p.x, p.y, z, 8, { v: 5, up: 2.5, life: 1.8 }); emit(ctx, 0, p.x, p.y, z, 12, { v: 5 });
    return add(ctx, { life: 5, keep: true, update(dt, it) { t += dt; if (t > 0.7) it.life = 0; }, paint(Q) { const u = t / 0.7, R = 4 * eout(u); Q.glow(p.x, p.y, z, 3, P.blush, 0.6 * (1 - u)); Q.halo(p.x, p.y, z, R, 1 - u, P.pale, 0.6); for (let i = 0; i < 5; i++) Q.arc(p.x, p.y, z, R * 0.8, i * TAU / 5 + u * 2, 0.9, 0.5, i % 2 ? P.mint : P.blush, 1 - u, 0.3); } }); }
  /* the exit: the form folds and dissolves into petals and light; D { x, y, glide, fold, how } */
  function exit(ctx, D) { if (!ctx.H) return null; const H = ctx.H, X = H.X, L = LOW(); D = D || {}; const c0 = anchor(ctx, 'center'), p = { x: isFinite(D.x) ? D.x : c0.x, y: isFinite(D.y) ? D.y : c0.y }, z = isFinite(D.z) ? D.z : c0.z || 1.4, dur = Math.max(0.8, (D.fold || 0) + 0.6); let t = 0;
    sfx(X, 'sparkle'); sfx(X, 'chime', 1046, 1); sfx(X, 'hiss', 0.9, 0.14, 1600); sfx(X, 'note', 880, 0.8, 'sine', 0.05, 440);
    emit(ctx, 2, p.x, p.y, z, L ? 18 : 40, { v: 4, up: 2, r: 2, rz: 1.6, life: 2.6 }); emit(ctx, 1, p.x, p.y, z, L ? 6 : 14, { v: 3, up: 2, r: 1.6, rz: 1.2, life: 2.4 }); emit(ctx, 0, p.x, p.y, z, L ? 8 : 18, { v: 4, up: 2.5, r: 1.5, life: 1.2 });
    return add(ctx, { life: 5, keep: true, update(dt, it) { t += dt; if (t > dur) it.life = 0; else if (Math.random() < (L ? 0.2 : 0.5)) { const q = anchor(ctx, 'center'); emit(ctx, 2, q.x, q.y, q.z, 1, { v: 2, up: 1, r: 1.6, rz: 1.2, life: 1.8 }); } },
      paint(Q) { const u = cl(t / dur); Q.glow(p.x, p.y, z, 2.5 + 2 * u, P.pale, 0.7 * (1 - u)); Q.glow(p.x, p.y, z, 3.5, P.pink, 0.3 * (1 - u)); for (let i = 0; i < 2; i++) { const q = cl(u * 1.4 - i * 0.25); if (q > 0 && q < 1) Q.halo(p.x, p.y, z, 3.6 * eout(q), 1 - q, i ? P.blush : P.mint, 0.5); }
        for (let i = 0; i < 4; i++) Q.arc(p.x, p.y, z - 1 + 2.4 * u + 0.3 * i, 2.6 * (1 - 0.5 * u), u * 5 + i * 1.6, 2, 0.5, i % 2 ? P.pale : P.blush, (1 - u) * 0.8, 0.5); Q.star(p.x, p.y, z, 1.6 * (1 - u), 1 - u); } }); }

  /* ================= the buttons' icons ================= */
  const icons = {
    swoosh(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; x.strokeStyle = rd ? P.mint : '#9AA'; x.lineWidth = r * 0.1; x.beginPath(); x.arc(0, 0, r * 0.48, PI * 0.2, PI * 1.6); x.stroke(); x.strokeStyle = rd ? P.pale : '#BBC'; x.lineWidth = r * 0.06; x.beginPath(); x.arc(0, 0, r * 0.28, PI * 1.1, PI * 2.4); x.stroke(); x.fillStyle = rd ? P.pink : '#AAB'; x.beginPath(); x.ellipse(r * 0.42, -r * 0.3, r * 0.14, r * 0.08, -0.6, 0, TAU); x.fill(); x.restore(); },
    wildflowers(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; for (const [ox, oy, s] of [[0, -0.05, 0.3], [-0.38, 0.28, 0.17], [0.4, 0.24, 0.19]]) { x.fillStyle = rd ? P.pink : '#AAB'; for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - PI / 2; x.beginPath(); x.ellipse(ox * r + Math.cos(a) * s * r * 0.6, oy * r + Math.sin(a) * s * r * 0.6, s * r * 0.55, s * r * 0.36, a, 0, TAU); x.fill(); } x.fillStyle = rd ? '#FFDB6B' : '#CCC'; x.beginPath(); x.arc(ox * r, oy * r, s * r * 0.24, 0, TAU); x.fill(); } x.restore(); },
    ringBlade(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; x.strokeStyle = rd ? '#E9F4F2' : '#9AA'; x.lineWidth = r * 0.07; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; x.beginPath(); x.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); x.lineTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66); x.stroke(); } x.strokeStyle = rd ? '#F0DC9A' : '#BBB'; x.lineWidth = r * 0.09; x.beginPath(); x.arc(0, 0, r * 0.24, 0, TAU); x.stroke(); x.restore(); },
    twister(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; for (let i = 0; i < 4; i++) { const q = i / 3, w = r * (0.16 + 0.42 * q), y = r * (0.5 - 1.0 * q); x.strokeStyle = rd ? (i % 2 ? P.pale : P.mint) : '#9AA'; x.lineWidth = r * 0.085; x.beginPath(); x.ellipse(0, y, w, w * 0.32, 0, PI * 0.1, PI * 1.5); x.stroke(); } x.fillStyle = rd ? P.pink : '#AAB'; x.beginPath(); x.arc(r * 0.4, -r * 0.1, r * 0.09, 0, TAU); x.fill(); x.beginPath(); x.arc(-r * 0.34, r * 0.22, r * 0.07, 0, TAU); x.fill(); x.restore(); },
  };

  BM.wildflowers = wildflowers; BM.ringBlade = ringBlade; BM.twister = twister; BM.swoosh = swoosh; BM.summon = summon; BM.bloom = bloom; BM.exit = exit; BM.icons = icons;
  BM.emit = emit;   /* (the core may throw petals of its own: emit(ctx, kind, x, y, z, n, o)) */
  BM.warm = () => { try { for (const c of [P.mint, P.pale, P.pink, P.blush, P.white]) glowSprite(c); beamSprite(P.white); beamSprite(P.pale); flowerSprite(P.pink, false); flowerSprite(P.pink, true); gpuOn(); } catch (e) {} return true; };
  BM.update = () => {};
})();
