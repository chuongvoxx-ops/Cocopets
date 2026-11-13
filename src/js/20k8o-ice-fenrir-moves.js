/* ---------- Ice's Fenrir (11th Ice ult): the attacks and their effects (worker E) ----------
   The model is 20k8m (FENRIR_MODEL), the session, both forms, Drift, menus, timers and the gauge are 20k8n (U.fenrir).
   This file adds the FENRIR_MOVES contract (docs/ICE-FENRIR-BRIEF.md, Notes):
   - FM.iceCannon(ctx): Ice Cannon, both forms. 1 / 2 / 3 paired volleys (one projectile from each cannon: 2 / 4 / 6),
     fired in rhythm after the chambers charge. Each projectile (a bright ice core, a frost stream behind it) raises a
     giant crystal formation where it lands: the impact and the growth are ONE hit; after a short pause cracks spread and
     the formation shatters, a second AoE.
   - FM.somersault(ctx): the motorcycle's vertical somersault. As it rises a giant crystal thrusts up under it (growth
     hit), holds, then shatters (a second hit); a stable landing. Stays a motorcycle.
   - FM.spinningWheel(ctx): the wolf somersaults forward, curls and rolls across the field like a wheel (a swept hit,
     once per enemy), leaving frost and curved streaks, then unfolds onto four paws. Stays a wolf.
   - FM.diamondDust(ctx): the motorcycle's finisher (not Ice's old Diamond Dust ult). A burnout spin; concentric rings of
     enormous crystals erupt outward in layers, freezing everything inside by the Ice rules (H.bind: bosses are only
     chilled); luminous fractures spread and everything shatters at once (ONE massive hit, noCharge), leaving sparkling
     dust in the air. Then ctx.safeReturn() and ctx.done(); the exit deals nothing.
   - FM.frozen(ctx): the wolf's finisher. A backflip, the paws lock, the cannons load and charge, then one enormous beam
     for exactly TUNE.frozen.dur (5.00 s) of the game clock: `ticks` fixed combat ticks at deadlines on ctx.now(), one
     shared volume (ctx.hitOval), whatever the frame rate. Frost cracks, safeReturn, a burst of ice dust, done.
   - FM.driftSweep(ctx, D) and FM.driftSpikes(ctx, D): the pictures of the Drift's two damage phases (the frost sweep
     following the core's live info D, the big spikes at the destination). The core deals both hits itself.
   - FM.GFX (FENRIR_GFX): every effect on the GPU (crystals as shaded triangles, lights as shader quads, particles as
     points, the Frozen beam's own shader; valid premultiplied output); the same pictures in 2D otherwise.
   Every damaging phase of E's goes through ctx.hitArea / ctx.hitOval (the core's one path: it charges the gauge and smashes the
   scenery). Crystals are the Ice kit's faceted shards (IK); particles are the game's pooled bursts. Low effects reduce
   decoration only. Nothing here uses timers: each effect is an fx that checks ctx.alive() every frame. */
(() => {
  const FM = (self.FENRIR_MOVES = self.FENRIR_MOVES || {});
  const TAU = Math.PI * 2, P = IK.P;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, eback = u => { u = cl(u); const s = 1.70158; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
  const rnd = (a, b) => a + Math.random() * (b - a), R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion, LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;

  /* ================= tuning (x DK = the ult's base damage unit; H's suggested numbers, brief Notes) ================= */
  const stats = FM.stats = { shots: 0, shatters: 0, frozenTicks: 0, dustHits: 0, wheelHits: 0 };   /* (counters for tests/fenrir.js) */
  const TUNE = FM.TUNE = {
    /* Ice Cannon: volleys by tier, `load` s of charging, a paired volley every `every` s; a projectile flies at `speed`
       tiles/s to its spot (at most `reach` tiles); impact + growth is one hit (r impactR), the shatter a second (r shatterR) */
    cannon: { volleys: [1, 2, 3], load: 0.3, every: 0.38, speed: 17, reach: 9, pair: 0.75, impact: 2.0, impactR: 1.15, shatter: 1.5, shatterR: 1.6, grow: 0.16, hold: 0.42, crack: 0.26, size: 1.0, recover: 0.25, freeze: 0.6 },
    /* Drift: fallback radii and how long the endpoint spikes stand */
    drift: { sweepR: 1.7, spikeR: 2.3, spikeHold: 0.9 },   /* (pictures only: the core deals the Drift's sweep 3 x DK and spikes 4 x DK; its info carries the real radii) */
    /* Somersault: rise + flip `air` s to height `h`; the crystal's growth hit (r growR) at `growAt`, its shatter (r shatterR) at `shatterAt` */
    somersault: { air: 0.9, h: 2.4, grow: 5.0, growR: 2.4, growAt: 0.16, shatter: 5.0, shatterR: 2.8, shatterAt: 0.72, land: 0.22, size: 2.1 },
    /* Spinning Wheel: `curl` s of forward somersault, a roll of `dist` tiles at `speed`, `land` s to unfold; one hit per enemy within r of the route */
    wheel: { curl: 0.26, dist: 6.5, speed: 13, land: 0.28, dmg: 10, r: 1.5, kb: 4 },
    /* Diamond Dust: `burnout` s, then `rings` beats `every` s apart (radius and number of ice masses per beat; a mass is
       `tall` tiles high and `wide` tiles in half-width), each freezing within its `reach` for `freeze` s as it rises (the
       camera pulls back by `pull` a beat); fractures for `crack` s; one shatter of `blast` x DK (by tier) within R; dust for `dust` s */
    dust: { burnout: 0.8, rings: [[2.3, 3], [4.3, 3], [5.7, 4]], reach: [3.3, 5.3, 7.1], tall: [3.6, 4.9, 6.2], wide: [1.0, 1.3, 1.6], every: 0.55, grow: 0.45, crack: 0.76, hold: 0.2, pull: 0.045, blast: [95, 115, 125], R: 6.6, freeze: 3, dust: 3.2, settle: 0.6, zoom: 0.8 },
    /* Frozen: backflip, lock, load, charge; the beam for exactly `dur` s: `ticks` ticks at equal deadlines, total x DK by tier */
    frozen: { flip: 0.6, back: 1.5, flipH: 2.0, lock: 0.3, load: 0.6, charge: 0.5, dur: 5.0, ticks: 20, total: [95, 115, 125], len: 10, half: 1.3, nose: 0.8, turn: 0.7, end: 0.45, cracks: 0.7, zoom: 0.82 },
  };

  /* ================= small shared bits ================= */
  const sfx = (X, k, ...a) => { try { const F = X.sfx; if (F && F[k]) F[k](...a); } catch (e) {} };
  const tierOf = ctx => ctx.tier != null ? ctx.tier : (ctx.evo >= 7 ? 2 : ctx.evo >= 4 ? 1 : 0);
  const dkOf = ctx => ctx.DK || ((ctx.C && ctx.C.base) || 20) * (1 + 0.08 * ((ctx.evo || 1) - 1));
  const live = ctx => { try { return !ctx.alive || !!ctx.alive(); } catch (e) { return false; } };
  const once = ctx => { let d = false; return () => { if (d) return; d = true; try { ctx.done && ctx.done(); } catch (e) {} }; };
  /* E's named poses on the core's clips (20k8n CLIPS: cannon, somersault, wheel, burnout, backflip, lock, load, beam, crack);
     a core without clips (the stub) gets the names as they are */
  const POSE = { cannonLoad: ['cannon', 0, 0.35], cannonFire: ['cannon', 1, 0.35], somersault: ['somersault', 0, 1], wheelCurl: ['wheel', 0, 0.14], wheelRoll: ['wheel', 0.14, 0.86], wheelLand: ['wheel', 0.86, 1], burnout: ['burnout', 0, 1], backflip: ['backflip', 0, 1], pawLock: ['lock', 0, 1], frozenLoad: ['load', 0, 1], frozenCharge: ['load', 1, 1], frozenFire: ['beam', 0, 1], frostCracks: ['crack', 0, 1] };
  const pose = (ctx, name, u, extra) => { try { if (typeof ctx.clip === 'function') { const m = POSE[name]; if (m) ctx.clip(m[0], lerp(m[1], m[2], cl(u)), extra); } else if (typeof ctx.pose === 'function') ctx.pose(name, u, extra); } catch (e) {} };
  const ownZ = ctx => typeof ctx.clip !== 'function';   /* (the core's clips lift the body themselves: only a stub needs vehicle.z written) */
  const cam = (ctx, o) => { try { if (ctx.camera) ctx.camera(o); } catch (e) {} };
  const shake = (ctx, k, d) => { const X = ctx.H.X; if (RM()) k *= 0.35; try { if (ctx.camera) { ctx.camera({ shake: k, dur: d }); return; } } catch (e) {} if (X.shake) X.shake(k, d); };
  /* the game clock (deadlines): the core's ctx.now(); without one, a clock summed from the fx's own dt */
  function clock(ctx) { let acc = 0; return { step(dt) { acc += dt; }, now() { try { if (ctx.now) { const t = ctx.now(); if (isFinite(t)) return t; } if (ctx.g && isFinite(ctx.g.t)) return ctx.g.t; } catch (e) {} return acc; } }; }
  function anchor(ctx, name) { try { const p = ctx.anchor && ctx.anchor(name); if (p && isFinite(p.x) && isFinite(p.y)) return { x: p.x, y: p.y, z: p.z || 0 }; } catch (e) {} const v = ctx.vehicle || {}, a = v.heading || 0, wolf = ctx.form === 'wolf';
    const D = { muzzleL: [wolf ? 1.9 : 2.2, -0.45, wolf ? 1.55 : 0.6], muzzleR: [wolf ? 1.9 : 2.2, 0.45, wolf ? 1.55 : 0.6], wheelF: [1.1, 0, 0.5], wheelR: [-1.1, 0, 0.5], pawFL: [1.0, -0.5, 0], pawFR: [1.0, 0.5, 0], pawRL: [-1.0, -0.5, 0], pawRR: [-1.0, 0.5, 0], seat: [0, 0, 1.3], center: [0, 0, 0.8], head: [1.6, 0, 1.3], tailTip: [-2.0, 0, 1.0] }[name] || [0, 0, 0.8];
    return { x: (v.x || 0) + Math.cos(a) * D[0] - Math.sin(a) * D[1], y: (v.y || 0) + Math.sin(a) * D[0] + Math.cos(a) * D[1], z: (v.z || 0) + D[2] }; }
  const zk = (ctx, T) => { try { if (ctx.scr && T > 0) { const a = ctx.scr(0, 0, 0), b = ctx.scr(0, 0, 1), k = (a[1] - b[1]) / T; if (k > 0.2 && k < 2) return k; } } catch (e) {} return 0.8; };
  const gone = m => !m || m.dead || m.under || m.falling;
  const monsOf = ctx => { try { if (ctx.mons) { const L = ctx.mons(); if (L) return L; } } catch (e) {} return ctx.H.living(); };
  /* the damage paths: the core's hitArea / hitOval (they charge and smash); without them, its hit per monster */
  function hitA(ctx, x, y, r, dmg, o) { if (!live(ctx)) return 0; try { if (ctx.hitArea) return ctx.hitArea(x, y, r, dmg, o) || 0; } catch (e) { return 0; }
    let n = 0; const seen = o && o.once ? (o.once.__seen || (o.once.__seen = new Set())) : null; for (const m of monsOf(ctx)) { if (gone(m) || Math.hypot(m.x - x, m.y - y) >= r + (m.r || 0.4)) continue; if (seen) { if (seen.has(m)) continue; seen.add(m); } try { ctx.hit(m, dmg, o); n++; } catch (e) {} } return n; }
  function hitO(ctx, cx, cy, rx, ry, ang, dmg, o) { if (!live(ctx)) return 0; try { if (ctx.hitOval) return ctx.hitOval(cx, cy, rx, ry, ang, dmg, o) || 0; } catch (e) { return 0; }
    let n = 0; const ca = Math.cos(ang), sa = Math.sin(ang); for (const m of monsOf(ctx)) { if (gone(m)) continue; const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, w = -dx * sa + dy * ca, pr = m.r || 0.4; if ((u * u) / ((rx + pr) ** 2) + (w * w) / ((ry + pr) ** 2) >= 1) continue; try { ctx.hit(m, dmg, o); n++; } catch (e) {} } return n; }
  const stand = (ctx, x, y) => { try { if (ctx.canStand) return !!ctx.canStand(x, y); } catch (e) { return false; } try { return !ctx.H.X.blocked(x, y, 0.5, 0); } catch (e) { return true; } };
  const wall = (ctx, x, y) => { try { return !!ctx.H.X.blocked(x, y, 0.2, 1); } catch (e) { return false; } };
  const aimOf = ctx => { const v = ctx.vehicle; let tg = null; try { tg = ctx.target && ctx.target(); } catch (e) {} if (tg && isFinite(tg.x) && Math.hypot(tg.x - v.x, tg.y - v.y) > 0.3) return { a: Math.atan2(tg.y - v.y, tg.x - v.x), x: tg.x, y: tg.y, m: tg.m || null };
    let a = v.heading || 0; try { if (ctx.aimDir) { const d = ctx.aimDir(); if (isFinite(d)) a = d; } } catch (e) {} return { a, x: v.x + Math.cos(a) * 5, y: v.y + Math.sin(a) * 5, m: null }; };
  /* ================= FENRIR_GFX: every Fenrir effect on the GPU =================
     One offscreen WebGL canvas (WebGL2, else WebGL1), twice the width of the game canvas x `res`: the left half takes
     what is solid (the crystals' translucent bodies, premultiplied, blended over), the right half takes light alone
     (alpha = its brightest channel, added). blit() lays the left half 'source-over' and the right half 'lighter', so
     every output is valid premultiplied colour and adds the same in every browser (WebKit included).
     Each frame the moves paint through one painter (the same calls the 2D path makes) and this layer batches them:
     - crystals: real triangles, two facets a shard (a lit face and a shaded face meeting on a bright ridge), shaded in
       the fragment shader: sapphire-to-cyan depth, translucent body, a cyan rim, internal fractures from noise that
       light up white as the formation cracks, a glint sliding up the lit face;
     - lights: one batch of quads whose shader draws each kind from maths and noise (soft glows, floor light, ice rings,
       frost veins, the frozen pool, mist, beams and trails, curved streaks, star sparkles);
     - particles: one batch of points (frost, glitter, ice chips, Diamond Dust's twinkling sparkle);
     - the Frozen beam: its own shader quad (core, layers, filaments, vapour, muzzle streams, impact).
     - Diamond Dust's ice masses: thick curved slabs as triangle strips with their own shader (a body pass and a light pass).
     At most 7 draw calls and one clear a frame, two drawImage calls to composite.
     Used on real-GPU WebGL; a software rasteriser or no WebGL draws the 2D path. window.__FM_GL = 1 forces it, 0
     forces 2D; a lost context falls back to 2D (rebuilt when restored). */
  const GFXM = (() => { let cv = null, gl = null, PQ = null, PC = null, PP = null, PB = null, PM = null, bq = null, bc = null, bp = null, bf = null, bm = null, ok = null, soft = false, info = '', why = '';
    const stats = { draws: 0, quads: 0, tris: 0, points: 0, W: 0, H: 0, frames: 0 };
    const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
    const NOISE = `float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
`;
    const POS = 'gl_Position = vec4(a_p.x / u_res.x * 2.0 - 1.0, 1.0 - a_p.y / u_res.y * 2.0, 0.0, 1.0);';
    /* lights: a_k the kind, a_uv -1..1 across the quad, a_c colour and alpha, a_q three parameters */
    const VS_Q = `attribute vec2 a_p, a_uv; attribute float a_k; attribute vec4 a_c; attribute vec3 a_q; uniform vec2 u_res; varying vec2 v_uv; varying float v_k; varying vec4 v_c; varying vec3 v_q;
void main(){ ${POS} v_uv = a_uv; v_k = a_k; v_c = a_c; v_q = a_q; }`;
    const FS_Q = HDR + `uniform float u_t; varying vec2 v_uv; varying float v_k; varying vec4 v_c; varying vec3 v_q;
` + NOISE + `void main(){ vec2 u = v_uv; float r = length(u), m = 0.0, edge = 1.0 - smoothstep(0.86, 1.0, r); vec3 col = v_c.rgb;
  if (v_k < 0.5) m = exp(-r * r * 4.2) * edge * 0.6;                                                    // a soft glow / floor light
  else if (v_k < 1.5) { float w = v_q.y; m = exp(-pow((r - v_q.x) / w, 2.0)) * (0.8 + 0.3 * n2(vec2(atan(u.y, u.x) * 5.0, u_t * 3.0))) + 0.25 * exp(-pow((r - v_q.x) / (w * 3.5), 2.0)); m *= edge; }   // an ice ring
  else if (v_k < 2.5) m = exp(-u.y * u.y * 5.0) * (1.0 - smoothstep(0.55, 1.0, abs(u.x)));              // a beam / trail segment
  else if (v_k < 3.5) { float an = atan(u.y, u.x), nn = n2(vec2(an * 2.0 + v_q.z, r * 3.0)), v1 = pow(0.5 + 0.5 * sin(an * v_q.y + nn * 4.0 + v_q.z), 14.0), v2 = pow(0.5 + 0.5 * sin(an * v_q.y * 2.3 - nn * 5.0 + v_q.z * 2.0), 22.0) * 0.6;
    m = (v1 + v2 * smoothstep(0.25, 0.6, r)) * (1.0 - smoothstep(v_q.x * 0.75, v_q.x, r)) * (0.5 + 0.5 * smoothstep(0.0, 0.2, r)) * edge; }                                                             // frost veins spreading to v_q.x
  else if (v_k < 4.5) { float f = fbm(u * 3.0 + v_q.z), sp = pow(n2(u * 22.0 + v_q.z), 9.0); m = (0.2 + 0.25 * f + 0.9 * sp + 0.35 * exp(-pow((r - 0.9) / 0.06, 2.0))) * (1.0 - smoothstep(0.88, 1.0, r)); }       // the frozen pool
  else if (v_k < 5.5) m = smoothstep(0.35, 0.8, fbm(u * 2.2 + vec2(0.0, -u_t * 0.6) + v_q.z)) * exp(-r * r * 2.2) * edge;                                                                              // mist
  else if (v_k < 6.5) { float an = atan(u.y, u.x), da = mod(an - v_q.x + 6.2832 * 4.0, 6.2832), k = da / v_q.y; m = exp(-pow((r - 0.8) / v_q.z, 2.0)) * smoothstep(0.0, 0.25, k) * (1.0 - smoothstep(0.6, 1.0, k)) * step(da, v_q.y); }   // a curved streak
  else { vec2 a = abs(u); m = (exp(-a.x * 2.5) * exp(-a.y * 30.0) + exp(-a.y * 2.5) * exp(-a.x * 30.0)) * edge; }                                                                                     // a star sparkle
  vec3 L = min(col * v_c.a * m, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
    /* crystals: a_b barycentric (x: away from the ridge, y: away from the outer edge, z: toward the base), a_l local
       (across -1..1, along 0..1), a_f (face, seed, alpha, crack) */
    const VS_C = `attribute vec2 a_p, a_l; attribute vec3 a_b; attribute vec4 a_f; uniform vec2 u_res; varying vec2 v_l, v_p; varying vec3 v_b; varying vec4 v_f;
void main(){ ${POS} v_l = a_l; v_b = a_b; v_f = a_f; v_p = a_p; }`;
    const FS_C = HDR + `uniform float u_t, u_pass, u_prot, u_pr; uniform vec2 u_pet; varying vec2 v_l, v_p; varying vec3 v_b; varying vec4 v_f;
` + NOISE + `void main(){ float lit = 1.0 - v_f.x, seed = v_f.y, al = v_f.z, crack = v_f.w, ly = v_l.y, lx = v_l.x;
  if (u_prot > 0.0) al *= mix(1.0, 0.22 + 0.78 * smoothstep(0.3, 1.9, length((v_p - u_pet) * vec2(1.0, 0.85)) / u_pr), u_prot);
  al *= smoothstep(0.0, 0.07, v_b.y) * smoothstep(0.0, 0.03, v_b.z);   // feathered outer edge and root (no stair-steps at half size)
  float fac = n2(vec2(lx * 2.0 + seed, ly * 5.0 + seed * 1.3));
  vec3 body = mix(mix(vec3(0.06, 0.16, 0.42), vec3(0.20, 0.52, 0.90), ly * 0.8 + 0.2 * fac), mix(vec3(0.36, 0.68, 0.93), vec3(0.78, 0.93, 1.0), ly * 0.75 + 0.25 * fac), lit);
  float bodyA = mix(0.84, 0.74, lit) * (0.85 + 0.15 * fac);
  if (u_pass < 0.5) { gl_FragColor = vec4(body * bodyA * al, bodyA * al); return; }
  // light: the bright ridge, the cyan rim, fractures inside (white-hot as the formation cracks), depth glow from the root, a glint
  float ridge = exp(-v_b.x * 16.0), rim = exp(-v_b.y * 24.0), fr = 1.0 - smoothstep(0.0, 0.05, abs(n2(vec2(lx * 2.6 + seed * 3.1, ly * 6.5 + seed)) - 0.5)), fr2 = 1.0 - smoothstep(0.0, 0.035, abs(n2(vec2(lx * 5.0 - seed, ly * 11.0 + seed * 2.0)) - 0.5));
  float reach = step(ly, crack * 1.25), glint = exp(-pow((ly - fract(u_t * 0.45 + seed * 0.37) * 1.7) / 0.06, 2.0)) * lit;
  vec3 L = vec3(1.0) * ridge * 0.55 + vec3(0.37, 0.91, 1.0) * exp(-v_b.y * 14.0) * 0.5 + vec3(0.37, 0.91, 1.0) * (fr * 0.2 + fr2 * 0.1) * (1.0 - v_b.x * 0.4)
    + mix(vec3(0.55, 0.9, 1.0), vec3(1.0), crack) * (fr + fr2 * 0.6) * reach * (0.3 + 0.55 * crack) + vec3(0.2, 0.55, 1.0) * (1.0 - ly) * 0.12 + vec3(0.8, 0.75, 1.0) * glint * 0.35 + vec3(0.6, 0.9, 1.0) * crack * crack * 0.08;
  L = min(L * al, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
    /* ice masses (Diamond Dust): a thick curved slab as a strip; a_l (across -1..1, along 0..1), a_f (seed, alpha,
       fracture, charge), a_g its length in widths. Three wandering facets (lit, mid, shaded), milky cloud inside, darker
       blue-grey depth where the ice is thickest; the light pass adds the rim, the facet ridges, veins, fractures that
       climb and whiten, lightning flickering inside, a sliding glint, sparkle and frost at the base */
    const VS_M = `attribute vec2 a_p, a_l; attribute vec4 a_f; attribute float a_g; uniform vec2 u_res; varying vec2 v_l; varying vec4 v_f; varying float v_g;
void main(){ ${POS} v_l = a_l; v_f = a_f; v_g = a_g; }`;
    const FS_M = HDR + `uniform float u_t, u_pass; varying vec2 v_l; varying vec4 v_f; varying float v_g;
` + NOISE + `void main(){ float u = v_l.x, v = v_l.y, au = abs(u), seed = v_f.x, al = v_f.y, crack = v_f.z, el = v_f.w, w = v * v_g;
  al *= (1.0 - smoothstep(0.88, 1.0, au)) * smoothstep(0.0, 0.03, v);
  float r1 = -0.36 + 0.3 * (n2(vec2(w * 0.9 + seed, seed * 1.3)) - 0.5), r2 = 0.34 + 0.3 * (n2(vec2(w * 0.8 - seed, seed * 2.1)) - 0.5);
  float face = step(r1, u) + step(r2, u), lit = face < 0.5 ? 1.0 : (face < 1.5 ? 0.6 : 0.26);
  float blk = h1(vec2(face * 7.0 + seed, floor(w * 0.9 + 0.7 * n2(vec2(u * 1.5 + seed, face))))), cloud = fbm(vec2(u * 1.7 + seed, w * 0.8 - seed));
  float sh = clamp(lit * 0.78 + (blk - 0.5) * 0.14 + (cloud - 0.5) * 0.3 + 0.14 * v, 0.0, 1.0), depth = 1.0 - au * au;
  vec3 body = mix(vec3(0.11, 0.23, 0.44), vec3(0.38, 0.60, 0.82), smoothstep(0.0, 0.55, sh)); body = mix(body, vec3(0.80, 0.93, 1.0), smoothstep(0.5, 1.0, sh));
  body *= 1.0 - 0.3 * smoothstep(0.5, 0.75, fbm(vec2(u * 2.6 + seed * 2.0, w * 0.45 + 3.0))) * depth;
  float bodyA = mix(0.95, 0.8, v);
  if (u_pass < 0.5) { gl_FragColor = vec4(body * bodyA * al, bodyA * al); return; }
  float rim = pow(au, 5.0), rd = exp(-pow((u - r1) / 0.04, 2.0)) * 0.5 + exp(-pow((u - r2) / 0.04, 2.0)) * 0.22;
  float vein = 1.0 - smoothstep(0.0, 0.035, abs(fbm(vec2(u * 2.2 + seed * 3.1, w * 0.9 + seed)) - 0.5));
  float fr = 1.0 - smoothstep(0.0, 0.035, abs(n2(vec2(u * 2.8 + seed, w * 1.9 - seed * 2.0)) - 0.5)), fr2 = 1.0 - smoothstep(0.0, 0.04, abs(n2(vec2(u * 5.5 - seed, w * 3.4 + seed)) - 0.5));
  float reach = 1.0 - smoothstep(crack * 1.3 - 0.12, crack * 1.3, v);
  float tk = floor(u_t * 17.0), on = step(1.0 - el * 0.75, h1(vec2(tk, seed * 3.7))), jag = (n2(vec2(w * 1.6 + seed * 5.0, tk * 1.37)) - 0.5) * 1.2;
  float bolt = (exp(-pow((u - jag) / 0.05, 2.0)) + 0.35 * exp(-pow((u - jag) / 0.2, 2.0))) * on * el;
  float glint = exp(-pow((v - fract(u_t * 0.3 + seed * 0.37) * 1.7) / 0.035, 2.0)) * (1.0 - step(0.5, face));
  float spk = pow(n2(vec2(u * 9.0 + seed, w * 9.0)), 12.0) * (0.5 + 0.5 * sin(u_t * 3.0 + seed * 9.0 + w * 5.0));
  vec3 cy = vec3(0.37, 0.91, 1.0), wh = vec3(1.0);
  vec3 L = vec3(0.72, 0.94, 1.0) * rim * 0.4 + wh * rd * (0.35 + 0.3 * cloud) + cy * vein * 0.1 * depth + mix(cy, wh, crack) * (fr + 0.6 * fr2) * reach * (0.18 + 0.34 * crack)
    + mix(cy, wh, 0.6) * bolt * 0.8 + wh * glint * 0.3 + wh * spk * 0.5 + wh * exp(-v * 10.0) * 0.16 * (0.5 + cloud) + vec3(0.6, 0.9, 1.0) * (crack * crack * 0.05 + el * 0.04 * on);
  L = min(L * al, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
    /* particles: a_s (size px, twinkle phase, twinkle speed) */
    const VS_P = `attribute vec2 a_p; attribute vec3 a_s; attribute vec4 a_c; uniform vec2 u_res; uniform float u_t; varying vec4 v_c;
void main(){ ${POS} float tw = a_s.z > 0.0 ? pow(0.5 + 0.5 * sin(a_s.y + u_t * a_s.z), 6.0) : 1.0; gl_PointSize = clamp(a_s.x * (0.7 + 0.6 * tw), 1.0, 64.0); v_c = vec4(a_c.rgb, a_c.a * (a_s.z > 0.0 ? 0.25 + 0.75 * tw : 1.0)); }`;
    const FS_P = HDR + `varying vec4 v_c; void main(){ vec2 d = gl_PointCoord - 0.5; float m = exp(-dot(d, d) * 14.0) + 0.6 * exp(-dot(d, d) * 90.0); vec3 L = min(v_c.rgb * v_c.a * m, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
    /* the Frozen beam (u_off: it is drawn in the right, light half) */
    const VS_B = 'attribute vec2 a_p; void main(){ gl_Position = vec4(a_p, 0.0, 1.0); }';
    const FS_B = HDR + `uniform vec2 u_res, u_o, u_e, u_ml, u_mr; uniform float u_w, u_t, u_a, u_off;
` + NOISE + `float seg(vec2 p, vec2 a, vec2 b){ vec2 ab = b - a; float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1.0), 0.0, 1.0); return length(p - a - ab * h); }
void main(){ vec2 p = vec2(gl_FragCoord.x - u_off, u_res.y - gl_FragCoord.y); vec2 d = u_e - u_o; float Ls = max(length(d), 1.0); vec2 ax = d / Ls, ay = vec2(-ax.y, ax.x);
  float a = dot(p - u_o, ax) / u_w, b = dot(p - u_o, ay) / u_w, La = Ls / u_w, t = u_t; vec3 L = vec3(0.0);
  float inb = smoothstep(-0.4, 0.5, a) * (1.0 - smoothstep(La - 0.3, La + 0.9, a)), open = 0.45 + 0.55 * smoothstep(0.0, 2.2, a), flick = 1.0 + 0.07 * sin(t * 61.0) + 0.05 * sin(t * 37.0);
  float bb = b / (open * flick), fl = fbm(vec2(a * 0.7 - t * 9.0, b * 1.6)), fl2 = fbm(vec2(a * 1.6 - t * 15.0, b * 3.0 + 4.0));
  float core = exp(-bb * bb / 0.045) * (0.85 + 0.3 * fl2), mid = exp(-bb * bb / 0.3) * (0.55 + 0.75 * fl), outer = exp(-bb * bb / 1.3) * (0.3 + 0.7 * fl) * 0.6;
  L += (vec3(1.0) * core * 1.3 + vec3(0.37, 0.91, 1.0) * mid * 0.9 + vec3(0.12, 0.38, 0.95) * outer) * inb;
  for (int k = 0; k < 3; k++) { float ph = float(k) * 2.094, y = sin(a * 1.15 - t * 12.0 + ph) * (0.82 + 0.15 * sin(a * 0.7 + t * 3.0 + ph)) * open, dz = cos(a * 1.15 - t * 12.0 + ph);
    L += vec3(0.8, 0.97, 1.0) * exp(-pow((b - y) / 0.075, 2.0)) * (0.35 + 0.45 * (0.5 + 0.5 * dz)) * inb; }   // twisting frost filaments
  float vap = fbm(vec2(a * 0.9 - t * 3.5, abs(b) * 1.3 - t * 1.2) + 7.0), band = smoothstep(0.7, 1.3, abs(bb)) * (1.0 - smoothstep(1.6, 3.2, abs(bb)));
  L += vec3(0.55, 0.82, 1.0) * band * smoothstep(0.45, 0.8, vap) * 0.4 * inb;                                    // cold vapour off the edges
  vec2 j = u_o + ax * u_w * 0.9; float s1 = seg(p, u_ml, j) / u_w, s2 = seg(p, u_mr, j) / u_w, sm2 = min(s1, s2);
  L += vec3(0.37, 0.91, 1.0) * exp(-sm2 * sm2 / 0.03) * 0.8 + vec3(1.0) * exp(-sm2 * sm2 / 0.006) * 0.9;        // the two muzzle streams converging
  float ro = length(p - u_o) / u_w, re = length((p - u_e) * vec2(1.0, 1.25)) / u_w, ang = atan(p.y - u_e.y, p.x - u_e.x);
  L += vec3(0.37, 0.91, 1.0) * exp(-ro * ro / 1.1) * 0.7 + vec3(1.0) * exp(-ro * ro / 0.2) * 0.9;
  float rays = pow(0.5 + 0.5 * sin(ang * 9.0 + t * 7.0 + 3.0 * n2(vec2(ang * 3.0, t * 2.0))), 3.0);
  L += vec3(0.37, 0.91, 1.0) * exp(-re * re / 3.2) * (0.55 + 0.5 * rays) * flick + vec3(1.0) * exp(-re * re / 0.7) * 1.1 + vec3(0.6, 0.85, 1.0) * smoothstep(0.5, 0.85, fbm(vec2(ang * 2.0, re * 1.2 - t * 2.5))) * exp(-re * re / 9.0) * 0.5;   // the heavy impact
  L = min(L * u_a, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
    function prog(vs, fs, attrs) { const sh = (ty, src) => { const q = gl.createShader(ty); gl.shaderSource(q, src); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(q)); return q; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
      const U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(p, i); U[u.name] = gl.getUniformLocation(p, u.name); } return { p, U }; }
    function build() { if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; }); cv.addEventListener('webglcontextrestored', () => { ok = null; PQ = null; }); }
      const o = { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false }; gl = gl || cv.getContext('webgl2', o) || cv.getContext('webgl', o); if (!gl) { why = 'no WebGL'; return false; }
      try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; } soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
      PQ = prog(VS_Q, FS_Q, ['a_p', 'a_uv', 'a_k', 'a_c', 'a_q']); PC = prog(VS_C, FS_C, ['a_p', 'a_l', 'a_b', 'a_f']); PP = prog(VS_P, FS_P, ['a_p', 'a_s', 'a_c']); PB = prog(VS_B, FS_B, ['a_p']); PM = prog(VS_M, FS_M, ['a_p', 'a_l', 'a_f', 'a_g']);
      bq = gl.createBuffer(); bc = gl.createBuffer(); bp = gl.createBuffer(); bf = gl.createBuffer(); bm = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW); return true; }
    function usable() { let f = null; try { f = typeof window !== 'undefined' ? window.__FM_GL : null; } catch (e) {} if (f === 0 || ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Fenrir GFX: ' + why); } catch (e2) {} } } return !!ok && (!soft || f === 1); }
    const attr = (i, n, stride, off) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, stride * 4, off * 4); }, offA = n => { for (let i = n; i < 5; i++) gl.disableVertexAttribArray(i); };
    /* F: { W, H, t, quads (Float32Array, 12 a vertex), nq, tris (11 a vertex), nt, pts (9 a point), np, beam (uniforms or null), pet [x, y], pr, prot } */
    function render(F) { if (!usable()) return null; try { const W = F.W, Hh = F.H; if (cv.width !== W * 2 + 4 || cv.height !== Hh) { cv.width = W * 2 + 4; cv.height = Hh; }   /* (4 px of nothing between the halves) */
        gl.viewport(0, 0, W * 2 + 4, Hh); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST); let draws = 0;
        const crystals = pass => { if (!F.nt) return; gl.useProgram(PC.p); gl.uniform2f(PC.U.u_res, W, Hh); gl.uniform1f(PC.U.u_t, F.t); gl.uniform1f(PC.U.u_pass, pass); gl.uniform1f(PC.U.u_prot, F.prot); gl.uniform1f(PC.U.u_pr, F.pr); gl.uniform2f(PC.U.u_pet, F.pet[0], F.pet[1]);
          gl.bindBuffer(gl.ARRAY_BUFFER, bc); if (!pass) gl.bufferData(gl.ARRAY_BUFFER, F.tris.subarray(0, F.nt * 11), gl.DYNAMIC_DRAW); attr(0, 2, 11, 0); attr(1, 2, 11, 2); attr(2, 3, 11, 4); attr(3, 4, 11, 7); offA(4); gl.drawArrays(gl.TRIANGLES, 0, F.nt); draws++; };
        const masses = pass => { if (!F.nm) return; gl.useProgram(PM.p); gl.uniform2f(PM.U.u_res, W, Hh); gl.uniform1f(PM.U.u_t, F.t); gl.uniform1f(PM.U.u_pass, pass);
          gl.bindBuffer(gl.ARRAY_BUFFER, bm); if (!pass) gl.bufferData(gl.ARRAY_BUFFER, F.mass.subarray(0, F.nm * 9), gl.DYNAMIC_DRAW); attr(0, 2, 9, 0); attr(1, 2, 9, 2); attr(2, 4, 9, 4); attr(3, 1, 9, 8); offA(4); gl.drawArrays(gl.TRIANGLES, 0, F.nm); draws++; };
        // the left half: what is solid
        gl.viewport(0, 0, W, Hh); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); masses(0); crystals(0);
        // the right half: light alone, added
        gl.viewport(W + 4, 0, W, Hh); gl.blendFunc(gl.ONE, gl.ONE);
        if (F.nq) { gl.useProgram(PQ.p); gl.uniform2f(PQ.U.u_res, W, Hh); gl.uniform1f(PQ.U.u_t, F.t); gl.bindBuffer(gl.ARRAY_BUFFER, bq); gl.bufferData(gl.ARRAY_BUFFER, F.quads.subarray(0, F.nq * 12), gl.DYNAMIC_DRAW); attr(0, 2, 12, 0); attr(1, 2, 12, 2); attr(2, 1, 12, 4); attr(3, 4, 12, 5); attr(4, 3, 12, 9); gl.drawArrays(gl.TRIANGLES, 0, F.nq); draws++; }
        masses(1); crystals(1);
        if (F.np) { gl.useProgram(PP.p); gl.uniform2f(PP.U.u_res, W, Hh); gl.uniform1f(PP.U.u_t, F.t); gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferData(gl.ARRAY_BUFFER, F.pts.subarray(0, F.np * 9), gl.DYNAMIC_DRAW); attr(0, 2, 9, 0); attr(1, 3, 9, 2); attr(2, 4, 9, 5); offA(3); gl.drawArrays(gl.POINTS, 0, F.np); draws++; }
        if (F.beam) { const b = F.beam, U = PB.U; gl.useProgram(PB.p); gl.uniform2f(U.u_res, W, Hh); gl.uniform1f(U.u_off, W); gl.uniform2f(U.u_o, b.o[0], b.o[1]); gl.uniform2f(U.u_e, b.e[0], b.e[1]); gl.uniform2f(U.u_ml, b.ml[0], b.ml[1]); gl.uniform2f(U.u_mr, b.mr[0], b.mr[1]); gl.uniform1f(U.u_w, b.w); gl.uniform1f(U.u_t, F.t); gl.uniform1f(U.u_a, b.a);
          gl.bindBuffer(gl.ARRAY_BUFFER, bf); attr(0, 2, 2, 0); offA(1); gl.drawArrays(gl.TRIANGLES, 0, 6); draws++; }
        stats.draws = draws; stats.quads = F.nq / 6; stats.tris = F.nt / 3; stats.points = F.np; stats.massTris = (F.nm || 0) / 3; stats.maxMassTris = Math.max(stats.maxMassTris || 0, stats.massTris); stats.W = W; stats.H = Hh; stats.frames++; stats.maxDraws = Math.max(stats.maxDraws || 0, draws); stats.maxTris = Math.max(stats.maxTris || 0, F.nt / 3); stats.maxPoints = Math.max(stats.maxPoints || 0, F.np); stats.maxQuads = Math.max(stats.maxQuads || 0, F.nq / 6);
        return cv; } catch (e) { ok = false; why = String(e && e.message || e); return null; } }
    function blit(c, W, Hh, dx, dy, dw, dh) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, W, Hh, dx, dy, dw, dh); c.globalCompositeOperation = 'lighter'; c.drawImage(cv, W + 4, 0, W, Hh, dx, dy, dw, dh); c.globalCompositeOperation = 'source-over'; }
    /* (tests) right after render: pixels that break rgb <= a */
    function check() { if (!gl) return null; const W = cv.width, Hh = cv.height, px = new Uint8Array(W * Hh * 4); gl.readPixels(0, 0, W, Hh, gl.RGBA, gl.UNSIGNED_BYTE, px); let bad = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3]; if (a) lit++; if (px[i] > a + 1 || px[i + 1] > a + 1 || px[i + 2] > a + 1) bad++; } return { bad, lit, px: W * Hh }; }
    return { usable, render, blit, check, stats, info: () => ({ ok, soft, renderer: info, why }) }; })();
  const gpuOn = () => { try { return GFXM.usable(); } catch (e) { return false; } };
  FM.GFX = GFXM;

  /* ================= the painters: one set of calls, drawn in 2D (the Ice kit) or batched for the GPU =================
     Every effect paints through Q: glow, floorLight, iceRing, frostVeins, frozenPool, mist, beam, arc, shard, spark
     (coordinates on the screen as the kit takes them). Q.c is the 2D canvas (2D only), Q.fbeam the GPU's Frozen beam. */
  /* an ice mass's slab: a spine from its base that turns by `curl` over its length, thick at the base and tapering to
     a blunt point, its two edges chiselled a little (SG: left edge, right edge, centre line, N + 1 points each) */
  const SG = { L: new Float32Array(40), R: new Float32Array(40), C: new Float32Array(40) };
  function slabGeo(bx, by, a0, curl, len, W0, seed, N) { let x = bx, y = by; const ds = len / N;
    for (let i = 0; i <= N; i++) { const v = i / N, a = a0 + curl * v, wv = W0 * ((1 - 0.42 * v) * Math.pow(Math.max(0, 1 - v * v * v * v), 0.55) + 0.14 * Math.exp(-v * 7)), px = -Math.sin(a), py = Math.cos(a), jl = 1 + 0.16 * (R1(seed * 5 + i * 3) - 0.5), jr = 1 + 0.16 * (R1(seed * 7 + i * 5 + 2) - 0.5);
      SG.C[i * 2] = x; SG.C[i * 2 + 1] = y; SG.L[i * 2] = x - px * wv * jl; SG.L[i * 2 + 1] = y - py * wv * jl; SG.R[i * 2] = x + px * wv * jr; SG.R[i * 2 + 1] = y + py * wv * jr;
      if (i < N) { const am = a0 + curl * (v + 0.5 / N); x += Math.cos(am) * ds; y += Math.sin(am) * ds; } } }
  /* a lightning path: n segments from one point to another, each joint thrown sideways by a hash of the seed */
  const BP = new Float32Array(24);
  function boltPts(x0, y0, x1, y1, seed, n, amp) { const dx = x1 - x0, dy = y1 - y0, Ls = Math.hypot(dx, dy) || 1, nx = -dy / Ls, ny = dx / Ls;
    for (let i = 0; i <= n; i++) { const u = i / n, o = i === 0 || i === n ? 0 : (R1(seed * 3.1 + i * 7.7) - 0.5) * 2 * amp * Ls * (0.6 + 0.4 * Math.sin(u * Math.PI)); BP[i * 2] = x0 + dx * u + nx * o; BP[i * 2 + 1] = y0 + dy * u + ny * o; } }
  const P2 = { c: null, K: null,
    /* an ice mass's slab in 2D: the same silhouette, a pale body darkening to the base, a lit facet and a shaded one,
       a bright rim and ridge, its fractures and the lightning inside as lines */
    slab(bx, by, a0, curl, len, W0, seed, a, crack, el, t) { if (len < 2 || !(a > 0.01)) return; const c = this.c, N = 8; slabGeo(bx, by, a0, curl, len, W0, seed, N); const Lp = SG.L, Rp = SG.R, Cp = SG.C, A = Math.min(1, a);
      const edge = (E, k, back) => { for (let j = 0; j <= N; j++) { const i = back ? N - j : j, x = Cp[i * 2] + (E[i * 2] - Cp[i * 2]) * k, y = Cp[i * 2 + 1] + (E[i * 2 + 1] - Cp[i * 2 + 1]) * k; c.lineTo(x, y); } };
      c.save(); const g = c.createLinearGradient(bx, by, Cp[N * 2], Cp[N * 2 + 1]); g.addColorStop(0, '#54799F'); g.addColorStop(0.4, '#9CC4E0'); g.addColorStop(1, '#E6F6FF'); c.fillStyle = g; c.globalAlpha = A * 0.93;
      c.beginPath(); c.moveTo(Lp[0], Lp[1]); edge(Lp, 1, false); edge(Rp, 1, true); c.closePath(); c.fill();
      c.globalAlpha = A * 0.42; c.fillStyle = '#264A78'; c.beginPath(); c.moveTo(Cp[0], Cp[1]); edge(Rp, 0.3, false); edge(Rp, 1, true); c.closePath(); c.fill();
      c.globalAlpha = A * 0.5; c.fillStyle = '#F2FBFF'; c.beginPath(); c.moveTo(Lp[0], Lp[1]); edge(Lp, 1, false); edge(Lp, 0.38, true); c.closePath(); c.fill();
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = P.pale; c.lineWidth = Math.max(1, W0 * 0.07); c.globalAlpha = A * 0.6; c.beginPath(); c.moveTo(Lp[0], Lp[1]); edge(Lp, 1, false); c.stroke();
      c.strokeStyle = P.white; c.lineWidth = Math.max(1, W0 * 0.04); c.globalAlpha = A * 0.45; c.beginPath(); c.moveTo(Lp[0], Lp[1]); edge(Lp, 0.38, false); c.stroke();
      const jag = (sd, upTo, amp) => { c.beginPath(); c.moveTo(Cp[0], Cp[1]); const n = Math.max(1, Math.round(N * upTo)); for (let i = 1; i <= n; i++) { const o = (R1(sd + i * 3.3) - 0.5) * amp, E = o < 0 ? Lp : Rp, k = Math.abs(o); c.lineTo(Cp[i * 2] + (E[i * 2] - Cp[i * 2]) * k, Cp[i * 2 + 1] + (E[i * 2 + 1] - Cp[i * 2 + 1]) * k); } c.stroke(); };
      if (crack > 0.01) { c.strokeStyle = P.cyan; c.lineWidth = Math.max(2, W0 * 0.14); c.globalAlpha = A * 0.3 * (0.5 + 0.5 * crack); jag(seed * 3, cl(crack * 1.2), 1.3); c.strokeStyle = P.white; c.lineWidth = Math.max(1, W0 * 0.045); c.globalAlpha = A * (0.5 + 0.4 * crack); jag(seed * 3, cl(crack * 1.2), 1.3); }
      if (el > 0.05) { const tk = Math.floor(t * 17); if (R1(tk * 1.3 + seed * 3.7) < el * 0.75) { c.strokeStyle = P.pale; c.lineWidth = Math.max(1, W0 * 0.05); c.globalAlpha = A * el; jag(tk * 7.1 + seed, 1, 1.1); } }
      c.restore(); },
    bolt(x0, y0, x1, y1, seed, a, w, br) { if (!(a > 0.02)) return; const c = this.c, n = 7; boltPts(x0, y0, x1, y1, seed, n, 0.13); const mx = BP[6], my = BP[7];
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(BP[0], BP[1]); for (let i = 1; i <= n; i++) c.lineTo(BP[i * 2], BP[i * 2 + 1]);
      c.strokeStyle = P.cyan; c.lineWidth = w * 4.5; c.globalAlpha = Math.min(1, a * 0.3); c.stroke(); c.strokeStyle = P.white; c.lineWidth = Math.max(1, w * 1.3); c.globalAlpha = Math.min(1, a); c.stroke(); c.restore();
      if (br) { const an = Math.atan2(y1 - y0, x1 - x0) + (R1(seed * 9.1) - 0.5) * 2.2, Ls = Math.hypot(x1 - x0, y1 - y0) * (0.25 + 0.2 * R1(seed * 4.3)); this.bolt(mx, my, mx + Math.cos(an) * Ls, my + Math.sin(an) * Ls, seed + 17.3, a * 0.6, w * 0.7, 0); } },
    glow(x, y, r, col, a) { this.K.glow(this.c, x, y, r, col, a); }, floorLight(x, y, r, a, col) { this.K.floorLight(this.c, x, y, r, a, col); }, iceRing(x, y, r, a, ry, t, w) { this.K.iceRing(this.c, x, y, r, a, ry, t, w); },
    frostVeins(x, y, r, u, a, s, n) { this.K.frostVeins(this.c, x, y, r, u, a, s, n); }, frozenPool(x, y, r, a, t) { this.K.frozenPool(this.c, x, y, r, a, t); }, mist(x, y, r, a, t) { this.K.mist(this.c, x, y, r, a, t); },
    beam(x0, y0, x1, y1, w, col, a) { const c = this.c, Ls = Math.hypot(x1 - x0, y1 - y0); if (Ls < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x0, y0); c.rotate(Math.atan2(y1 - y0, x1 - x0)); c.globalAlpha = Math.min(1, a); c.drawImage(beamSprite(col), 0, -w, Ls, w * 2); c.restore(); },
    arc(x, y, r, a0, span, w, col, a) { const c = this.c; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = w; c.globalAlpha = Math.min(1, a); c.beginPath(); c.arc(x, y, r, a0, a0 + span); c.stroke(); c.restore(); },
    /* one kit shard at any size without baking a sprite per size (ONE standard shard per seed, scaled in its own axes); its fractures as lines */
    shard(x, y, w, h, ang, seed, a, t, T, crack, lite) { if (h < 2 || !(a > 0.01)) return; const c = this.c;
      if (lite !== 2) { const T4 = Math.max(16, Math.round(T / 8) * 8), W0 = T4 * 0.5, H0 = T4 * 2.4, r = (ang == null ? -Math.PI / 2 : ang) + Math.PI / 2; c.save(); c.translate(x, y); c.rotate(r); c.scale(w / W0, h / H0); c.rotate(-r); this.K.shard(c, 0, 0, W0, H0, ang, seed, a, lite ? null : t); c.restore(); }
      if (crack > 0.01) { const ca = Math.cos(ang), sa = Math.sin(ang), L = h * cl(crack * 1.25); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const [lw, col, al] of (lite ? [[Math.max(1.5, w * 0.1), P.white, 0.85]] : [[w * 0.2, P.cyan, 0.3], [Math.max(1, w * 0.06), P.white, 0.9]])) { c.strokeStyle = col; c.lineWidth = lw; c.globalAlpha = Math.min(1, al * a * (0.6 + 0.4 * crack)); c.beginPath(); c.moveTo(x, y);
          for (let j = 1; j <= 5; j++) { const u = j / 5, off = (R1(seed * 3 + j) - 0.5) * w * 0.55; c.lineTo(x + ca * L * u - sa * off, y + sa * L * u + ca * off); } c.stroke(); } c.restore(); } },
    spark(x, y, s, a, tw) { const c = this.c; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 0.7); c.drawImage(glowSprite(P.cyan), x - s * 1.6, y - s * 1.6, s * 3.2, s * 3.2); c.globalAlpha = Math.min(1, a); c.drawImage(glowSprite(P.white), x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
      if (tw > 0.7) { c.globalAlpha = (tw - 0.7) / 0.3 * a; c.drawImage(beamSprite(P.white), x - s * 2.4, y - s * 0.16, s * 4.8, s * 0.32); c.drawImage(beamSprite(P.white), x - s * 0.16, y - s * 2.4, s * 0.32, s * 4.8); } c.restore(); } };
  const p2d = (c, K) => { P2.c = c; P2.K = K; return P2; };
  /* the GPU painter: batches into typed arrays (GL px) for one frame */
  const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const q = hexRGB(h || P.cyan); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGB.set(h, v); } return v; };
  const PG = { quads: new Float32Array(12 * 6 * 400), nq: 0, tris: new Float32Array(11 * 6 * 500), nt: 0, pts: new Float32Array(9 * 2600), np: 0, mass: new Float32Array(54 * 12 * 36), nm: 0, sl: [], beamU: null, sh: [], a: 1, b: 0, c0: 0, d: 1, e: 0, f: 0, k: 1, GY: 0.55, t: 0,
    begin(B, kx, GY, t) { this.a = B.a * kx; this.b = B.b * kx; this.c0 = B.c * kx; this.d = B.d * kx; this.e = B.e * kx; this.f = B.f * kx; this.k = (Math.sqrt(Math.abs(B.a * B.d - B.b * B.c)) || 1) * kx; this.GY = GY; this.t = t; this.nq = this.nt = this.np = this.nm = 0; this.beamU = null; this.sh.length = 0; this.sl.length = 0; },
    X(x, y) { return this.a * x + this.c0 * y + this.e; }, Y(x, y) { return this.b * x + this.d * y + this.f; },
    /* a quad: centre, half-axes (ux, uy) and (vx, vy) on the screen */
    quad(kind, x, y, ux, uy, vx, vy, col, al, q0, q1, q2) { if (!(al > 0.004)) return; if ((this.nq + 6) * 12 > this.quads.length) { const n = new Float32Array(this.quads.length * 2); n.set(this.quads); this.quads = n; }
      const A = this.quads, cx = this.X(x, y), cy = this.Y(x, y), k = this.k, c = rgbOf(col); ux *= k; uy *= k; vx *= k; vy *= k; let o = this.nq * 12;
      for (const [su, sv] of [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]]) { A[o++] = cx + ux * su + vx * sv; A[o++] = cy + uy * su + vy * sv; A[o++] = su; A[o++] = sv; A[o++] = kind; A[o++] = c[0]; A[o++] = c[1]; A[o++] = c[2]; A[o++] = al > 1 ? 1 : al; A[o++] = q0 || 0; A[o++] = q1 || 0; A[o++] = q2 || 0; } this.nq += 6; },
    glow(x, y, r, col, a) { if (r < 1) return; this.quad(0, x, y, r, 0, 0, r, col || P.cyan, a); }, floorLight(x, y, r, a, col) { if (r < 1) return; this.quad(0, x, y, r, 0, 0, r * this.GY, col || P.ice, a); },
    iceRing(x, y, r, a, ry, t, w) { if (r < 1) return; const ryy = ry == null ? r * this.GY : ry, wf = Math.max(0.03, (w || Math.max(2, r * 0.08)) / r * 0.7); this.quad(1, x, y, r * 1.25, 0, 0, ryy * 1.25, P.cyan, a * 0.9, 0.8, wf, 0); this.quad(1, x, y, r * 1.25, 0, 0, ryy * 1.25, P.white, a * 0.5, 0.8, wf * 0.4, 0); },
    frostVeins(x, y, r, u, a, s, n) { if (u <= 0) return; this.quad(3, x, y, r, 0, 0, r * this.GY, P.pale, a * 0.9, cl(u), n || 7, (s || 0) * 1.7); },
    frozenPool(x, y, r, a, t) { if (r < 1) return; this.quad(4, x, y, r, 0, 0, r * this.GY, P.pale, a * 0.55, 0, 0, 3.1); }, mist(x, y, r, a, t) { this.quad(5, x, y, r * 1.3, 0, 0, r * 1.3, P.frost, a * 0.8, 0, 0, 1.3); },
    beam(x0, y0, x1, y1, w, col, a) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(2, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, col, a); },
    arc(x, y, r, a0, span, w, col, a) { this.quad(6, x, y, r * 1.25, 0, 0, r * 1.25, col, a * 1.6, a0, span, Math.max(0.02, w / r * 0.45)); },
    spark(x, y, s, a, tw) { this.point(x, y, s * 3.2, P.pale, a); if (tw > 0.7) this.quad(7, x, y, s * 3, 0, 0, s * 3, P.white, (tw - 0.7) / 0.3 * a); },
    point(x, y, size, col, a, ph, sp) { if (!(a > 0.01)) return; if ((this.np + 1) * 9 > this.pts.length) { const n = new Float32Array(this.pts.length * 2); n.set(this.pts); this.pts = n; } const A = this.pts, c = rgbOf(col); let o = this.np * 9; A[o++] = this.X(x, y); A[o++] = this.Y(x, y); A[o++] = size * this.k; A[o++] = ph || 0; A[o++] = sp || 0; A[o++] = c[0]; A[o++] = c[1]; A[o++] = c[2]; A[o++] = a > 1 ? 1 : a; this.np++; },
    /* a shard: two facets from one root (kept aside and laid back to front when the frame ends) */
    shard(x, y, w, h, ang, seed, a, t, T, crack, lite) { if (h < 2 || !(a > 0.01)) return; this.sh.push(y, x, w, h, ang == null ? -Math.PI / 2 : ang, seed || 0, a, (crack || 0) * (lite ? 0.45 : 1)); },   /* (lite: one of a whole field, so its fractures glow less) */
    /* an ice mass's slab (kept aside, tessellated back to front when the frame ends) and a lightning bolt (beam quads) */
    slab(bx, by, a0, curl, len, W0, seed, a, crack, el, t) { if (len < 2 || !(a > 0.01)) return; this.sl.push(by, bx, a0, curl, len, W0, seed || 0, a > 1 ? 1 : a, crack || 0, el || 0); },
    bolt(x0, y0, x1, y1, seed, a, w, br) { if (!(a > 0.02)) return; const n = 7; boltPts(x0, y0, x1, y1, seed, n, 0.13); const mx = BP[6], my = BP[7];
      for (let i = 0; i < n; i++) { const ax = BP[i * 2], ay = BP[i * 2 + 1], ex = (BP[i * 2 + 2] - ax) * 0.4, ey = (BP[i * 2 + 3] - ay) * 0.4, bx = BP[i * 2 + 2]; const by = BP[i * 2 + 3]; this.beam(ax - ex, ay - ey, bx + ex, by + ey, w * 7, P.cyan, a * 0.65); this.beam(ax - ex, ay - ey, bx + ex, by + ey, w * 1.6, P.white, a); }
      if (br) { const an = Math.atan2(y1 - y0, x1 - x0) + (R1(seed * 9.1) - 0.5) * 2.2, Ls = Math.hypot(x1 - x0, y1 - y0) * (0.25 + 0.2 * R1(seed * 4.3)); this.bolt(mx, my, mx + Math.cos(an) * Ls, my + Math.sin(an) * Ls, seed + 17.3, a * 0.6, w * 0.7, 0); } },
    fbeam(u) { this.beamU = u; },
    end() { const S = this.sh, n = S.length / 8, idx = []; for (let i = 0; i < n; i++) idx.push(i); idx.sort((p, q) => S[p * 8] - S[q * 8]);
      if (n * 6 * 11 > this.tris.length) this.tris = new Float32Array(n * 6 * 11 * 2); const A = this.tris; let o = 0;
      for (const i of idx) { const j = i * 8, y = S[j], x = S[j + 1], w = S[j + 2], h = S[j + 3], an = S[j + 4], sd = (S[j + 5] % 37) * 0.73, al = S[j + 6], cr = S[j + 7], ca = Math.cos(an), sa = Math.sin(an), px = -sa, py = ca;   /* (ca, sa: along the shard; px, py: across it) */
        const P4 = [[x - px * w * 0.5, y - py * w * 0.5], [x + px * w * 0.08, y + py * w * 0.08 + w * 0.16], [x + px * w * 0.5, y + py * w * 0.5], [x + ca * h, y + sa * h]], Lc = [[-1, 0], [0.16, 0], [1, 0], [0, 1]], BA = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const G = P4.map(p => [this.X(p[0], p[1]), this.Y(p[0], p[1])]);
        // the lit face (L, F, tip) and the shaded face (R, F, tip): barycentric x is 0 on the ridge F-tip, y is 0 on the outer edge, z is 0 on the base
        for (const [face, tri] of [[0, [0, 1, 3]], [1, [2, 1, 3]]]) for (let v = 0; v < 3; v++) { const q = tri[v], b = BA[v]; A[o++] = G[q][0]; A[o++] = G[q][1]; A[o++] = Lc[q][0]; A[o++] = Lc[q][1]; A[o++] = b[0]; A[o++] = b[1]; A[o++] = b[2]; A[o++] = face; A[o++] = sd; A[o++] = al; A[o++] = cr; } }
      this.nt = n * 6;
      { const M = this.sl, nm = M.length / 10, N = 12, id = []; for (let i = 0; i < nm; i++) id.push(i); id.sort((p, q) => M[p * 10] - M[q * 10]);
        if (nm * N * 54 > this.mass.length) this.mass = new Float32Array(nm * N * 54 * 2); const B = this.mass; let ob = 0;
        for (const i of id) { const j = i * 10, len = M[j + 4], W0 = M[j + 5], sd = (M[j + 6] % 37) * 0.73, al = M[j + 7], cr = M[j + 8], el = M[j + 9], asp = len / Math.max(1, W0); slabGeo(M[j + 1], M[j], M[j + 2], M[j + 3], len, W0, M[j + 6], N);
          const put = (E, k, u) => { B[ob++] = this.X(E[k * 2], E[k * 2 + 1]); B[ob++] = this.Y(E[k * 2], E[k * 2 + 1]); B[ob++] = u; B[ob++] = k / N; B[ob++] = sd; B[ob++] = al; B[ob++] = cr; B[ob++] = el; B[ob++] = asp; };
          for (let k = 0; k < N; k++) { put(SG.L, k, -1); put(SG.R, k, 1); put(SG.L, k + 1, -1); put(SG.L, k + 1, -1); put(SG.R, k, 1); put(SG.R, k + 1, 1); } }
        this.nm = nm * N * 6; }
      } };

  /* the GPU frame of a session: every effect registered with it paints into the one batch, which is drawn and laid over
     the game once; its own particles (frost, glitter, chips) are simulated here and drawn as points */
  const GS = { fx: null, ctx: null, items: [], parts: [] };
  function frame(ctx) { if (GS.fx && GS.fx.life > 0 && GS.ctx === ctx) return GS; GS.ctx = ctx; GS.items = []; GS.parts = []; const H = ctx.H, X = H.X;
    GS.fx = H.add({ key: 'fenrir-moves', life: 1e9,
      update(dt, ff) { const PA = GS.parts; for (let i = PA.length - 1; i >= 0; i--) { const p = PA[i]; p.t += dt; if (p.t >= p.life) { PA[i] = PA[PA.length - 1]; PA.pop(); continue; } p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6; } }
        for (let i = GS.items.length - 1; i >= 0; i--) if (!(GS.items[i].life > 0)) GS.items.splice(i, 1); if (!GS.items.length && !PA.length) ff.life = 0; },
      draw(c) { if (!gpuOn()) return; const T = X.Tz(), Z = T * zk(ctx, T), B = c.getTransform(), cv0 = c.canvas, L = LOW(), k0 = Math.min(L ? 0.4 : 0.6, 1200 / Math.max(cv0.width, cv0.height)), W = Math.max(8, Math.round(cv0.width * k0)), Hh = Math.max(8, Math.round(cv0.height * k0)), kx = W / cv0.width, t = GS.fx.t || 0;
        PG.begin(B, kx, H.GY || 0.55, t); let cover = false;
        for (const f of GS.items) { if (f.cover) cover = true; const D = f._p; try { if (D[0]) D[0].call(f, PG, f); if (D[1]) D[1].call(f, PG, f); if (D[2]) D[2].call(f, PG, f); } catch (e) { /* (one effect's picture) */ } }
        for (const p of GS.parts) { const u = p.t / p.life; PG.point(H.sx(p.x), H.sy(p.y) - p.z * Z, p.size * T * (p.kind === 2 ? 1 : 1 - 0.5 * u), p.col, (1 - u * u) * p.a, p.ph, p.kind === 1 ? 14 : 0); }
        PG.end(); const s = anchor(ctx, 'seat'), sx = H.sx(s.x), sy = H.sy(s.y) - s.z * Z, cvG = GFXM.render({ W, H: Hh, t, quads: PG.quads, nq: PG.nq, tris: PG.tris, nt: PG.nt, pts: PG.pts, np: PG.np, mass: PG.mass, nm: PG.nm, beam: PG.beamU, pet: [PG.X(sx, sy), PG.Y(sx, sy)], pr: T * 0.8 * PG.k, prot: cover ? 0 : 1 });
        if (cvG) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); GFXM.blit(c, W, Hh, 0, 0, cv0.width, cv0.height); c.restore(); } } });
    return GS; }
  /* particles: on the GPU path this file's own (drawn as points); in 2D the Ice kit's bursts */
  const COLS = [P.white, P.frost, P.pale, P.cyan, P.ice];
  function emit(ctx, kind, x, y, k, v, o) { const G = frame(ctx), q = LOW() ? 0.5 : 1; let n = Math.max(1, Math.round(k * (kind === 1 ? 1.6 : 1.3) * q)); if (G.parts.length > 1400) return; o = o || {};
    while (n-- > 0) { const a = Math.random() * TAU, sp = (o.v != null ? o.v : v || 3) * (0.3 + 0.7 * Math.random()), up = (o.up != null ? o.up : kind === 0 ? 0.8 : 2.6) * (0.4 + 0.9 * Math.random());
      G.parts.push({ kind, x, y, z: (o.z || 0) + 0.1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.8, vz: up, g: kind === 0 ? 1.2 : kind === 1 ? 7 : 10, t: 0, life: (o.life || (kind === 0 ? 1.1 : kind === 1 ? 0.55 : 0.75)) * (0.6 + 0.6 * Math.random()), size: kind === 0 ? 0.12 : kind === 1 ? 0.1 : 0.16, col: kind === 2 ? COLS[2 + ((Math.random() * 3) | 0)] : COLS[(Math.random() * 4) | 0], a: kind === 0 ? 0.8 : 1, ph: Math.random() * TAU }); } }
  /* the emitters the moves call (kinds: 0 frost / snow, 1 glitter, 2 ice chips) */
  const snowE = (ctx, K, x, y, k, o) => gpuOn() ? emit(ctx, 0, x, y, k, 1.2, o) : K.snow(x, y, k, o);
  const glitE = (ctx, K, x, y, k, v, o) => gpuOn() ? emit(ctx, 1, x, y, k, v || 5, o) : K.glitter(x, y, k, v, o);
  const fragE = (ctx, K, x, y, k, v) => gpuOn() ? emit(ctx, 2, x, y, k, v || 5) : K.fragments(x, y, k, v);
  const shatE = (ctx, K, x, y, r) => { if (!gpuOn()) { K.shatterAt(x, y, r); return; } const X = ctx.H.X; X.light && X.light(x, y, r * 1.6, 0.22); emit(ctx, 1, x, y, 10, 5); emit(ctx, 2, x, y, 6, 5); emit(ctx, 0, x, y, 6, 1.2); };
  /* an fx of this file: tagged for cleanup checks, ended (no further damage) when the session ends. Its pictures
     (drawUnder / drawEnt / draw, written against a painter Q) are drawn in 2D through the Ice kit, or handed to the
     session's GPU frame */
  function add(ctx, f) { f.key = f.key || 'fenrir-moves'; const up = f.update; f.update = function (dt, ff) { if (!f.keep && !live(ctx)) { ff.life = 0; if (f.abort) try { f.abort(); } catch (e) {} return; } if (up) up.call(f, dt, ff); };
    const dU = f.drawUnder, dE = f.drawEnt, dD = f.draw;
    if (gpuOn()) { f._p = [dU, dE, dD]; f.drawUnder = f.drawEnt = f.draw = undefined; const r = ctx.H.add(f) || f; frame(ctx).items.push(r); return r; }
    const K = IK.bind(ctx.H); if (dU) f.drawUnder = (c, ff) => dU.call(f, p2d(c, K), ff); if (dE) f.drawEnt = (c, ff) => dE.call(f, p2d(c, K), ff); if (dD) f.draw = (c, ff) => dD.call(f, p2d(c, K), ff);
    return ctx.H.add(f); }

  /* ================= crystal formations (the Ice kit's faceted shards) =================
     A formation: a fan of shards from one root, the tall centre last; `grow` 0..1 thrusts them up (each a little after the
     last, with an overshoot), `crack` 0..1 runs luminous fractures up them, `a` fades. Sizes in tiles (size 1: ~2.4 tall). */
  const FORM = new Map();
  function formOf(seed, n) { const key = (seed % 9) + ':' + n; let F = FORM.get(key); if (F) return F; F = []; for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0.5, side = (u - 0.5) * 2, r1 = R1(seed * 7 + i), r2 = R1(seed * 13 + i * 3);
      F.push({ ang: -Math.PI / 2 + side * (0.62 + 0.2 * r1), h: (1 - 0.5 * Math.abs(side)) * (0.75 + 0.35 * r2), w: 0.4 + 0.16 * r1, dx: side * 0.34, d: Math.abs(side) * 0.3 + 0.1 * r1, s: (seed + i * 5) | 0, front: false }); }
    F.sort((p, q) => Math.abs(q.ang + Math.PI / 2) - Math.abs(p.ang + Math.PI / 2)); F[F.length - 1].h = 1.12; F[F.length - 1].w = 0.56; F[F.length - 1].d = 0;
    for (let i = 0; i < 2; i++) F.push({ ang: -Math.PI / 2 + (i ? 0.3 : -0.36), h: 0.42 + 0.1 * R1(seed + i), w: 0.26, dx: i ? 0.2 : -0.24, d: 0.25, s: (seed + 40 + i) | 0, front: true });
    FORM.set(key, F); return F; }
  function drawForm(Q, X0, Y0, T, size, seed, grow, crack, a, t, n, lite) { if (!(a > 0.01) || grow <= 0) return; const F = formOf(seed | 0, n || 5), Hh = T * 2.4 * size;   /* (lite: one of many, e.g. Diamond Dust's field: no light of its own; lite 2 (2D): the cracks alone, over a cached picture) */
    if (!lite) { Q.floorLight(X0, Y0, T * size * 1.7, 0.4 * a * cl(grow * 2)); Q.glow(X0, Y0 - Hh * 0.4 * grow, T * size * 1.5, P.cyan, 0.22 * a * (1 + crack)); }
    for (const s of F) { const g = eback(cl((grow - s.d) / 0.7)); if (g <= 0.01) continue; const h = Hh * s.h * g, w = T * size * s.w * (0.7 + 0.3 * cl(g)), x = X0 + s.dx * T * size, y = Y0 + (s.front ? T * 0.12 * size : 0);
      Q.shard(x, y, w, h, s.ang, s.s, a, t, T, crack, lite); } }
  /* a formation's burst: the kit's shatter, fragments and glitter thrown out, a ring of ice light on the floor */
  function shatterFx(ctx, K, x, y, r, big) { const H = ctx.H, X = H.X, q = LOW() ? 0.45 : 1; shatE(ctx, K, x, y, r); fragE(ctx, K, x, y, Math.round((big ? 22 : 10) * q), big ? 8 : 6); glitE(ctx, K, x, y, Math.round((big ? 26 : 12) * q), big ? 8 : 6); snowE(ctx, K, x, y, Math.round((big ? 14 : 6) * q));
    add(ctx, { life: 0.5, x, y, keep: true, drawUnder(Q, f) { const T = X.Tz(), u = f.t / 0.5; Q.iceRing(H.sx(x), H.sy(y), T * r * (0.35 + 0.8 * eout(u)), 1 - u, null, f.t); Q.floorLight(H.sx(x), H.sy(y), T * r * 1.3, 0.6 * (1 - u), P.pale); } }); }
  /* one standing formation as its own fx (drawn among the monsters): grow -> hold -> crack -> onShatter (or crumble) */
  function formation(ctx, K, o) { const H = ctx.H, X = H.X; let t = 0, fired = false, burst = false; const T0 = o.grow, T1 = T0 + o.hold, T2 = T1 + (o.crack || 0);
    return add(ctx, { life: T2 + 0.6, entY: o.y - 0.05, x: o.x, y: o.y,
      update(dt, f) { t += dt; if (!fired && t >= (o.hitAt || 0)) { fired = true; if (o.onGrow) o.onGrow(); } if (!burst && t >= T2) { burst = true; if (o.onShatter) { o.onShatter(); f.life = 0; } else f.life = 0.35; } },
      drawEnt(Q, f) { const T = X.Tz(), a = burst ? cl(f.life / 0.35) : 1; drawForm(Q, H.sx(o.x), H.sy(o.y), T, o.size, o.seed, cl(t / T0), o.crack ? cl((t - T1) / o.crack) : 0, a, t, o.n); } }); }

  /* ================= Ice Cannon ================= */
  function iceCannon(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, K = IK.bind(H), tu = TUNE.cannon, DK = dkOf(ctx), NV = tu.volleys[tierOf(ctx)], L = LOW();
    let t = 0, fired = 0, finished = false, recoil = 0; const shots = [], used = new Set();
    sfx(X, 'hum'); sfx(X, 'note', 520, tu.load, 'sine', 0.05, 1040);
    /* the spot for volley k: the aimed enemy first, then the next nearest unused ones; else along the aim */
    const spot = k => { const A = aimOf(ctx); let m = A.m && !used.has(A.m) && !gone(A.m) ? A.m : null; if (!m) { let bd = 1e9; for (const q of monsOf(ctx)) { if (gone(q) || used.has(q)) continue; const d = Math.hypot(q.x - v.x, q.y - v.y); if (d > tu.reach) continue; const off = Math.abs(Math.atan2(Math.sin(Math.atan2(q.y - v.y, q.x - v.x) - A.a), Math.cos(Math.atan2(q.y - v.y, q.x - v.x) - A.a))), sc = d + (off > 1.1 ? 20 : off * 2); if (sc < bd) { bd = sc; m = q; } } }   /* (ahead of the aim first, then anyone in reach) */
      if (m) { used.add(m); return { x: m.x, y: m.y }; } const d = Math.min(tu.reach, 4.5 + k * 1.4); return { x: v.x + Math.cos(A.a) * d, y: v.y + Math.sin(A.a) * d }; };
    function volley(k) { const tg = spot(k), a = Math.atan2(tg.y - v.y, tg.x - v.x); recoil = 1; sfx(X, 'zap'); sfx(X, 'whoosh'); sfx(X, 'note', 180 - 20 * k, 0.18, 'square', 0.06, 70); shake(ctx, 2.5, 0.1);
      for (const side of [-1, 1]) { const mz = anchor(ctx, side < 0 ? 'muzzleL' : 'muzzleR'); let ex = tg.x - Math.sin(a) * side * tu.pair, ey = tg.y + Math.cos(a) * side * tu.pair; const d0 = Math.hypot(ex - mz.x, ey - mz.y), dd = Math.min(d0, tu.reach), ux = (ex - mz.x) / (d0 || 1), uy = (ey - mz.y) / (d0 || 1); let d1 = dd;
        for (let s = 0.4; s <= dd; s += 0.3) if (wall(ctx, mz.x + ux * s, mz.y + uy * s)) { d1 = Math.max(0.3, s - 0.3); break; }   /* (a wall on the way: it lands there) */
        ex = mz.x + ux * d1; ey = mz.y + uy * d1; stats.shots++; shots.push({ x0: mz.x, y0: mz.y, z0: mz.z, x1: ex, y1: ey, t: 0, T: Math.max(0.08, d1 / tu.speed), seed: (Math.random() * 90) | 0 });
        glitE(ctx, K, mz.x, mz.y, L ? 3 : 7, 4, { z: mz.z }); snowE(ctx, K, mz.x, mz.y, L ? 2 : 5, { z: mz.z }); } }
    function land(s) { // impact + growth: one hit; then the pause, the cracks and the shatter: the second AoE
      const hitSet = {}; sfx(X, 'crash'); sfx(X, 'note', 900, 0.25, 'triangle', 0.05, 300); X.light && X.light(s.x1, s.y1, 2.2, 0.3); glitE(ctx, K, s.x1, s.y1, L ? 4 : 9, 5); snowE(ctx, K, s.x1, s.y1, L ? 3 : 6);
      hitA(ctx, s.x1, s.y1, tu.impactR, DK * tu.impact, { once: hitSet, el: 'ice', src: 'strong', freeze: tu.freeze, kb: 1 });
      formation(ctx, K, { x: s.x1, y: s.y1, size: tu.size, seed: s.seed, grow: tu.grow, hold: tu.hold, crack: tu.crack, n: 5,
        onShatter() { stats.shatters++; sfx(X, 'crash'); sfx(X, 'sparkle'); shake(ctx, 3.5, 0.14); shatterFx(ctx, K, s.x1, s.y1, tu.shatterR, false); hitA(ctx, s.x1, s.y1, tu.shatterR, DK * tu.shatter, { once: {}, el: 'ice', src: 'strong', kb: 3 }); } }); }
    add(ctx, { life: 30, abort() { done(); },
      update(dt, f) { t += dt; recoil = Math.max(0, recoil - dt / 0.22);
        if (t < tu.load) { pose(ctx, 'cannonLoad', t / tu.load, { glow: sm(t / tu.load) }); if (Math.random() < (L ? 0.3 : 0.8)) { const mz = anchor(ctx, Math.random() < 0.5 ? 'muzzleL' : 'muzzleR'); snowE(ctx, K, mz.x, mz.y, 1, { z: mz.z, v: 0.5 }); } }
        else { while (fired < NV && t >= tu.load + fired * tu.every) volley(fired++); if (!finished) pose(ctx, 'cannonFire', recoil, { glow: 0.5 + 0.5 * recoil }); }
        for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; if (s.t >= s.T) { shots.splice(i, 1); land(s); } else if (Math.random() < (L ? 0.4 : 0.9)) { const u = s.t / s.T; snowE(ctx, K, lerp(s.x0, s.x1, u), lerp(s.y0, s.y1, u), 1, { z: lerp(s.z0, 0.3, u), v: 0.4, life: 0.5 }); } }
        if (fired >= NV && !finished && t >= tu.load + (NV - 1) * tu.every + tu.recover) { finished = true; done(); }
        if (finished && !shots.length) f.life = 0; },
      draw(Q) { const T = X.Tz(), Z = T * zk(ctx, T);
        // the chambers' glow while loading, the muzzle flash on a volley
        const g = t < tu.load ? sm(t / tu.load) * 0.6 : recoil; if (g > 0.02) for (const n of ['muzzleL', 'muzzleR']) { const mz = anchor(ctx, n), x = H.sx(mz.x), y = H.sy(mz.y) - mz.z * Z; Q.glow(x, y, T * (0.35 + 0.5 * g), P.cyan, 0.7 * g); Q.glow(x, y, T * 0.2 * (1 + g), P.white, 0.8 * g); }
        // the projectiles: a bright ice core, a frost stream trailing
        for (const s of shots) { const u = s.t / s.T, x = H.sx(lerp(s.x0, s.x1, u)), y = H.sy(lerp(s.y0, s.y1, u)) - lerp(s.z0, 0.3, u) * Z, u0 = Math.max(0, u - 0.28), xb = H.sx(lerp(s.x0, s.x1, u0)), yb = H.sy(lerp(s.y0, s.y1, u0)) - lerp(s.z0, 0.3, u0) * Z, Ls = Math.hypot(x - xb, y - yb), an = Math.atan2(y - yb, x - xb);
          Q.beam(xb, yb, x, y, T * 0.34, P.blue, 0.6); Q.beam(lerp(xb, x, 0.3), lerp(yb, y, 0.3), x, y, T * 0.18, P.cyan, 0.85); Q.beam(lerp(xb, x, 0.6), lerp(yb, y, 0.6), x, y, T * 0.07, P.white, 0.95);
          Q.glow(x, y, T * 0.55, P.cyan, 0.8); Q.glow(x, y, T * 0.24, P.white, 1); Q.shard(x, y, T * 0.2, T * 0.5, an, s.seed, 0.9, t, T, 0); } } }); }

  /* ================= Drift: the pictures of its two damage phases =================
     The core (20k8n) owns the Drift and BOTH its hits; it calls these with its live info object D ({ x, y, dir, ph:
     'sweep' | 'spikes' | 'xform', r, spikeR, from, to, ... }): driftSweep(ctx, D) when the slide starts (it follows D
     until the phase leaves 'sweep'), driftSpikes(ctx, D) at the destination. Neither deals damage. */
  function driftSweep(ctx, D) { const H = ctx.H, X = H.X, K = IK.bind(H), tu = TUNE.drift, v = ctx.vehicle, L = LOW(), trail = []; let t = 0; D = D || {};
    const pos = () => ({ x: isFinite(D.x) ? D.x : v.x, y: isFinite(D.y) ? D.y : v.y }), R = D.r || tu.sweepR, on = () => (D.ph ? D.ph === 'sweep' : t < 0.45);
    sfx(X, 'hiss', 0.5, 0.2, 900);
    add(ctx, { life: 6,
      update(dt, ff) { t += dt; if (on()) { const p = pos(); trail.push({ x: p.x, y: p.y, t: 0 }); if (trail.length > 30) trail.shift();
          let k = (L ? 10 : 28) * dt + Math.random(); while (k-- >= 1) { const q = anchor(ctx, ctx.form === 'wolf' ? ['pawFL', 'pawFR', 'pawRL', 'pawRR'][(Math.random() * 4) | 0] : (Math.random() < 0.6 ? 'wheelR' : 'wheelF')); snowE(ctx, K, q.x, q.y, 1, { v: 2.2, up: 1.2, life: 0.6 }); if (Math.random() < 0.4) glitE(ctx, K, q.x, q.y, 1, 4); } }
        for (const p of trail) p.t += dt; while (trail.length && trail[0].t > 0.7) trail.shift(); if (!on() && !trail.length) ff.life = 0; },
      drawUnder(Q) { const T = X.Tz(), p = pos(); // the frost trail (light on the floor, fading) and the sweep's ring round the sliding body
        for (const q of trail) { const a = 1 - q.t / 0.7; Q.floorLight(H.sx(q.x), H.sy(q.y), T * 0.9, 0.3 * a, P.ice); }
        if (on()) { Q.iceRing(H.sx(p.x), H.sy(p.y), T * R * (0.8 + 0.15 * Math.sin(t * 20)), 0.55, null, t); Q.frostVeins(H.sx(p.x), H.sy(p.y), T * R, cl(t / 0.25), 0.5, 3, 7); } } }); }
  function driftSpikes(ctx, D) { const H = ctx.H, X = H.X, K = IK.bind(H), tu = TUNE.drift, L = LOW(); D = D || {}; const x = isFinite(D.x) ? D.x : ctx.vehicle.x, y = isFinite(D.y) ? D.y : ctx.vehicle.y, R = D.spikeR || tu.spikeR;
    sfx(X, 'crash'); sfx(X, 'sparkle'); glitE(ctx, K, x, y, L ? 8 : 18, 7); snowE(ctx, K, x, y, L ? 5 : 10); fragE(ctx, K, x, y, L ? 4 : 8, 6);
    // a ring of large spikes round the stop; they hold through the transformation, then crumble
    const N = L ? 5 : 8; for (let i = 0; i < N; i++) { const a = i / N * TAU + 0.3, r = R * 0.74; formation(ctx, K, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.8, size: 0.75 + 0.25 * R1(i * 7.1), seed: i * 3 + 1, grow: 0.14 + 0.02 * i, hold: tu.spikeHold, crack: 0, n: 3 }); }
    add(ctx, { life: 0.6, keep: true, drawUnder(Q, f) { const T = X.Tz(), u = f.t / 0.6; Q.iceRing(H.sx(x), H.sy(y), T * R * (0.4 + 0.7 * eout(u)), 1 - u, null, f.t); Q.frostVeins(H.sx(x), H.sy(y), T * R * 1.1, cl(u * 2), 0.8 * (1 - u), 5, 9); } }); }

  /* ================= Somersault (motorcycle) ================= */
  function somersault(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, K = IK.bind(H), tu = TUNE.somersault, DK = dkOf(ctx), L = LOW(), x0 = v.x, y0 = v.y, seed = (Math.random() * 90) | 0, z0 = v.z || 0, OZ = ownZ(ctx);
    let t = 0, grew = false, burst = false, landed = false, finished = false; v.locked = true;
    sfx(X, 'whoosh'); sfx(X, 'note', 240, 0.4, 'sawtooth', 0.05, 520);
    add(ctx, { life: 10, entY: y0 - 0.1, abort() { if (OZ) v.z = z0; done(); },
      update(dt, f) { t += dt; const u = cl(t / tu.air);
        const TT = tu.air + tu.land; if (!finished) pose(ctx, 'somersault', cl(t / TT), { h: tu.h });
        if (t < tu.air) { if (OZ) v.z = z0 + tu.h * 4 * u * (1 - u); }
        else if (!landed) { landed = true; if (OZ) v.z = z0; sfx(X, 'thud'); shake(ctx, 4, 0.14); snowE(ctx, K, x0, y0, L ? 4 : 10); }
        if (landed && !finished) { const q = cl((t - tu.air) / tu.land); if (q >= 1) { finished = true; done(); } }
        if (!grew && t >= tu.growAt) { grew = true; sfx(X, 'crash'); sfx(X, 'note', 600, 0.3, 'triangle', 0.06, 180); shake(ctx, 4, 0.14); X.light && X.light(x0, y0, tu.growR * 1.4, 0.4); glitE(ctx, K, x0, y0, L ? 6 : 14, 7); fragE(ctx, K, x0, y0, L ? 3 : 7, 5);
          hitA(ctx, x0, y0, tu.growR, DK * tu.grow, { once: {}, el: 'ice', src: 'strong', kb: 2, freeze: 0.6 }); }
        if (!burst && t >= tu.shatterAt) { burst = true; sfx(X, 'crash'); sfx(X, 'sparkle'); sfx(X, 'note', 90, 0.5, 'sine', 0.2, 40); shake(ctx, 7, 0.22); shatterFx(ctx, K, x0, y0, tu.shatterR, true);
          hitA(ctx, x0, y0, tu.shatterR, DK * tu.shatter, { once: {}, el: 'ice', src: 'strong', kb: 4 }); }
        if (finished && burst) f.life = 0; },
      drawUnder(Q) { const T = X.Tz(); if (grew && !burst) Q.frostVeins(H.sx(x0), H.sy(y0), T * tu.growR, cl((t - tu.growAt) / 0.2), 0.7, seed, 9); },
      drawEnt(Q) { if (!grew || burst) return; const T = X.Tz(), g = cl((t - tu.growAt) / 0.2), hold = tu.shatterAt - 0.2, cr = cl((t - hold) / 0.2); drawForm(Q, H.sx(x0), H.sy(y0), T, tu.size, seed, g, cr, 1, t, 7); } }); }

  /* ================= Spinning Wheel (wolf) ================= */
  function spinningWheel(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, K = IK.bind(H), tu = TUNE.wheel, DK = dkOf(ctx), L = LOW(), A = aimOf(ctx), ang = A.a, ca = Math.cos(ang), sa = Math.sin(ang), z0 = v.z || 0, hitSet = {}, trail = [], OZ = ownZ(ctx);
    let t = 0, gone2 = 0, stopped = false, finished = false, roll = 0, tLand = -1; v.locked = true; v.heading = ang;
    sfx(X, 'whoosh'); sfx(X, 'note', 150, tu.curl + tu.dist / tu.speed, 'sawtooth', 0.07, 320);
    add(ctx, { life: 10, abort() { if (OZ) v.z = z0; done(); },
      update(dt, f) { t += dt;
        if (t < tu.curl) { const u = t / tu.curl; if (OZ) v.z = z0 + 1.0 * Math.sin(Math.PI * u) + 0.25 * u; pose(ctx, 'wheelCurl', u, { spin: 0 }); }
        else if (!stopped) { // the roll: forward until the distance is done or something refuses the next step
          let step = tu.speed * dt; roll += step / 0.9; if (OZ) v.z = z0 + 0.25;
          while (step > 0 && !stopped) { const s = Math.min(0.2, step); if (gone2 + s > tu.dist) { stopped = true; break; }
            if (typeof ctx.move === 'function') { const bx = v.x, by = v.y, hitW = ctx.move(ca * s, sa * s); if (hitW || Math.hypot(v.x - bx, v.y - by) < s * 0.4) { stopped = true; break; } }   /* (the core's own step: walls stop it, props in the way are smashed) */
            else { const nx = v.x + ca * s, ny = v.y + sa * s; if (!stand(ctx, nx, ny)) { stopped = true; break; } v.x = nx; v.y = ny; }
            gone2 += s; step -= s; }
          pose(ctx, 'wheelRoll', cl(gone2 / tu.dist), { roll, spin: roll });
          stats.wheelHits += hitA(ctx, v.x, v.y, tu.r, DK * tu.dmg, { once: hitSet, el: 'ice', src: 'strong', kb: tu.kb });
          trail.push({ x: v.x, y: v.y, t: 0 }); if (trail.length > 40) trail.shift();
          let k = (L ? 10 : 30) * dt + Math.random(); while (k-- >= 1) { snowE(ctx, K, v.x - ca * 0.6 + rnd(-0.4, 0.4), v.y - sa * 0.6 + rnd(-0.3, 0.3), 1, { v: 2.5, up: 1.6, life: 0.6 }); if (Math.random() < 0.35) glitE(ctx, K, v.x, v.y, 1, 5); }
          if (stopped) { tLand = t; sfx(X, 'thud'); shake(ctx, 5, 0.16); snowE(ctx, K, v.x, v.y, L ? 5 : 12); glitE(ctx, K, v.x, v.y, L ? 4 : 10, 6); X.light && X.light(v.x, v.y, 2.2, 0.3); } }
        else if (!finished) { const q = cl((t - tLand) / tu.land); if (OZ) v.z = z0 + 0.25 * (1 - q); pose(ctx, 'wheelLand', q, { spin: roll }); if (q >= 1) { finished = true; if (OZ) v.z = z0; done(); } }
        for (const p of trail) p.t += dt; while (trail.length && trail[0].t > 0.9) trail.shift(); if (finished && !trail.length) f.life = 0; },
      drawUnder(Q) { const T = X.Tz(); for (const p of trail) { const a = 1 - p.t / 0.9; Q.floorLight(H.sx(p.x), H.sy(p.y), T * 0.85, 0.34 * a, P.ice); } },
      draw(Q) { if (stopped || t < tu.curl * 0.6) return; const T = X.Tz(), Z = T * zk(ctx, T), X0 = H.sx(v.x), Y0 = H.sy(v.y) - (v.z + 0.9) * Z;
        // curved streaks round the rolling body (feathered arcs trailing the spin), a soft cyan halo
        // (the GPU draws each streak once, soft; the 2D path strokes three widths)
        for (let i = 0; i < 3; i++) { const a0 = -roll * 1.0 + i * TAU / 3, r = T * (1.25 + 0.12 * i); for (const [lw, col, al] of (Q.c ? [[T * 0.3, P.blue, 0.18], [T * 0.12, P.cyan, 0.5], [T * 0.04, P.white, 0.8]] : [[T * 0.3, P.cyan, 0.5], [T * 0.1, P.white, 0.6]])) Q.arc(X0, Y0, r, a0, 1.5, lw, col, al); }
        Q.glow(X0, Y0, T * 1.9, P.cyan, 0.22); } }); }

  /* ================= Diamond Dust (motorcycle finisher) ================= */
  function diamondDust(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, K = IK.bind(H), tu = TUNE.dust, tier = tierOf(ctx), DK = dkOf(ctx), L = LOW(), x0 = v.x, y0 = v.y, h0 = v.heading || 0;
    const TB = tu.burnout, NR = tu.rings.length, TR = TB + (NR - 1) * tu.every + tu.grow, TC = TR + tu.hold, TS = TC + tu.crack, TD = TS + tu.settle;
    // the ice masses: a few colossal ones, staggered around the bike, each beat's larger than the last; those in front of
    // the bike stand lower and every one leans outward, so the field opens like a crown around it. Sorted by depth once.
    const MS = []; tu.rings.forEach(([r, n], k) => { for (let i = 0; i < n; i++) { const a = (i + 0.5 * (k % 2)) / n * TAU + 0.55 + 0.4 * k, ca = Math.cos(a), sa = Math.sin(a), sd = k * 17 + i * 5 + 3, rr = r * (0.94 + 0.12 * R1(sd));
      MS.push({ x: x0 + ca * rr, y: y0 + sa * rr * 0.86, k, seed: sd, h: tu.tall[k] * (0.88 + 0.24 * R1(sd + 1)) * (1 - 0.36 * Math.max(0, sa)), w: tu.wide[k] * (0.9 + 0.2 * R1(sd + 2)), lean: ca * 0.36 + (R1(sd + 3) - 0.5) * 0.16, dir: R1(sd + 4) < 0.5 ? -1 : 1, t0: TB + k * tu.every + 0.06 * i, up: false, tx: 0, ty: 0 }); } });
    MS.sort((p, q) => p.y - q.y);
    let t = 0, ring = 0, burst = false, ret = false, finished = false, spin = 0, zapT = 0; const dust = [], chunks = []; v.locked = true;
    const chunk = (x, y, z, sp, up, s, out) => { const a = out != null ? out + rnd(-0.7, 0.7) : Math.random() * TAU; if (chunks.length < 90) chunks.push({ x, y, z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.8, vz: up, rot: Math.random() * TAU, vr: rnd(-8, 8), s, seed: (Math.random() * 30) | 0, t: 0, life: rnd(0.9, 1.7) }); };
    ctx.dustPlan = { x: x0, y: y0, R: tu.R, blast: tu.blast[tier], tShatter: TS };   /* (read-only, for tests) */
    cam(ctx, { zoom: tu.zoom, x: x0, y: y0, k: 0.7 }); sfx(X, 'hum'); sfx(X, 'hiss', TB, 0.3, 500); sfx(X, 'note', 80, TB + 0.3, 'sawtooth', 0.12, 160);
    /* one mass: its great curving tusk, a second slab curling away behind it and a short thick one in front */
    const mass = (Q, m, T, Z, g, crk, el, a) => { const bx = H.sx(m.x), by = H.sy(m.y), len = m.h * Z * (0.12 + 0.88 * eback(g)), w = m.w * T * (0.5 + 0.5 * sm(g)), up = -Math.PI / 2 + m.lean, s = m.seed;
      if (!L) Q.slab(bx - w * 0.62 * m.dir, by - T * 0.1, up - (0.42 + 0.1 * R1(s)) * m.dir, -0.7 * m.dir, len * 0.62, w * 0.78, s + 11, a, crk, el, t);
      Q.slab(bx, by, up, m.dir * 0.55 - m.lean * 0.9, len, w, s, a, crk, el, t);
      Q.slab(bx + w * 0.66 * m.dir, by + T * 0.1, up + 0.5 * m.dir, 0.7 * m.dir, len * 0.46, w * 0.72, s + 23, a, crk, el, t);
      slabGeo(bx, by, up, m.dir * 0.55 - m.lean * 0.9, len, w, s, 6); m.tx = SG.C[12]; m.ty = SG.C[13]; };
    add(ctx, { life: 60, keep: true, cover: true, abort() { done(); },
      update(dt, f) { if (!burst && !live(ctx)) { f.life = 0; done(); return; } t += dt;
        // the burnout: the rear wheel breaks loose and the bike spins on the spot (no Drift, no transform); the spin
        // throws a blizzard outward in a widening ring
        if (t < TS) { const w = t < TB ? 9 * sm(t / TB) : 9 * (1 - 0.6 * sm((t - TB) / (TR - TB))); spin += w * dt; v.heading = h0 + spin; pose(ctx, 'burnout', cl(t / TB), { spin }); if (!L || Math.random() < 0.4) { const p = anchor(ctx, 'wheelR'); snowE(ctx, K, p.x, p.y, 1, { v: 3, up: 1.4, life: 0.7 }); if (Math.random() < 0.5) glitE(ctx, K, p.x, p.y, 1, 5); } }
        if (t < TB + 0.35) { const rr = 0.6 + 5.6 * eout(t / (TB + 0.35)); for (let j = L ? 1 : 3; j > 0; j--) { const a = Math.random() * TAU; snowE(ctx, K, x0 + Math.cos(a) * rr, y0 + Math.sin(a) * rr * 0.86, 1, { v: 4, up: 1.3, life: 0.8 }); } }
        // the beats: each freezes what stands inside its reach (the Ice rules: H.bind; a boss is only chilled), the camera pulls back
        while (ring < NR && t >= TB + ring * tu.every) { const R = tu.reach[ring]; sfx(X, 'crash'); sfx(X, 'grumble'); sfx(X, 'note', 150 - 30 * ring, 0.7, 'sine', 0.5, 40); sfx(X, 'note', 520 - 70 * ring, 0.5, 'triangle', 0.08, 120); shake(ctx, 5 + 3 * ring, 0.28); X.light && X.light(x0, y0, R * 1.3, 0.6);
          if (!RM()) cam(ctx, { zoom: tu.zoom - tu.pull * (ring + 1), x: x0, y: y0, k: 0.7 });
          for (const m of monsOf(ctx)) if (!gone(m) && Math.hypot(m.x - x0, m.y - y0) < R + (m.r || 0.4)) { try { ctx.freeze ? ctx.freeze(m, tu.freeze) : H.bind(m, tu.freeze); } catch (e) {} }
          ring++; }
        // each mass erupts: the ground cracks, ice chunks fly, frost bursts
        for (const m of MS) if (!m.up && t >= m.t0) { m.up = true; fragE(ctx, K, m.x, m.y, L ? 4 : 9, 9); snowE(ctx, K, m.x, m.y, L ? 3 : 8, { v: 3, up: 2 }); glitE(ctx, K, m.x, m.y, 4, 6); for (let j = L ? 2 : 4; j > 0; j--) chunk(m.x, m.y, 0.3, rnd(2, 5), rnd(4, 8), rnd(0.35, 0.7) * (1 + 0.2 * m.k)); sfx(X, 'thud'); X.light && X.light(m.x, m.y, 3, 0.35); shake(ctx, 2 + m.k, 0.12); }
        // the charge: the ice crackles with lightning, faster as the fractures spread
        if (t >= TB && t < TS) { zapT -= dt; if (zapT <= 0) { const crk = cl((t - TC) / tu.crack); zapT = lerp(0.24, 0.06, crk) * rnd(0.6, 1.4); sfx(X, 'note', (crk > 0 ? 1200 : 700) + 900 * Math.random(), 0.06, crk > 0 && Math.random() < 0.5 ? 'square' : 'sawtooth', 0.025 + 0.02 * crk, 300); } }
        if (!burst && t >= TS) { burst = true; // ONE coordinated release
          sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'sparkle'); sfx(X, 'note', 40, 2.2, 'sine', 0.9, 20); sfx(X, 'note', 2400, 0.5, 'triangle', 0.1, 600); sfx(X, 'hiss', 2, 0.35, 2400); shake(ctx, 20, 0.7); X.flash && X.flash(RM() ? 0.1 : 0.24, '#E8FBFF'); X.hitstop && X.hitstop(0.1); X.light && X.light(x0, y0, tu.R * 1.6, 1.4);
          stats.dustHits += hitA(ctx, x0, y0, tu.R, DK * tu.blast[tier], { once: {}, noCharge: true, el: 'ice', src: 'ult', kb: 6, freeze: tu.freeze, chill: true });
          for (const m of MS) { fragE(ctx, K, m.x, m.y, L ? 5 : 10, 10); glitE(ctx, K, m.x, m.y, L ? 3 : 6, 8); snowE(ctx, K, m.x, m.y, L ? 2 : 5, { v: 3, up: 2.2, life: 1.4 }); const out = Math.atan2(m.y - y0, m.x - x0); for (let j = L ? 2 : 5; j > 0; j--) chunk(m.x, m.y, rnd(0.4, m.h * 0.75), rnd(3, 8), rnd(2, 7), rnd(0.5, 1.05) * (1 + 0.15 * m.k), out); }
          const nd = L ? 80 : 210; for (let i = 0; i < nd; i++) { const a = Math.random() * TAU, r = tu.R * 1.1 * Math.sqrt(Math.random()); dust.push({ x: x0 + Math.cos(a) * r, y: y0 + Math.sin(a) * r * 0.86, z: rnd(0.3, 5), ph: Math.random() * TAU, sp: rnd(1.1, 3.6), s: rnd(0.5, 1.4), vz: rnd(-0.22, 0.12), vx: rnd(-0.2, 0.2) }); }
          }
        for (let i = chunks.length - 1; i >= 0; i--) { const q = chunks[i]; q.t += dt; if (q.t >= q.life) { chunks[i] = chunks[chunks.length - 1]; chunks.pop(); continue; } q.vz -= 15 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.rot += q.vr * dt; if (q.z < 0) { q.z = 0; q.vz *= -0.35; q.vx *= 0.55; q.vy *= 0.55; q.vr *= 0.5; } }
        if (burst) { for (const d of dust) { d.z = Math.max(0.05, d.z + d.vz * dt); d.x += d.vx * dt; }
          if (!ret && t >= TS + 0.25) { ret = true; try { ctx.returnPoint = ctx.safeReturn ? ctx.safeReturn() : null; } catch (e) {} }
          if (!finished && t >= TD) { finished = true; const p = anchor(ctx, 'center'); shatE(ctx, K, p.x, p.y, 1.8); glitE(ctx, K, p.x, p.y, L ? 10 : 24, 7); snowE(ctx, K, p.x, p.y, L ? 6 : 16); try { ctx.vanish && ctx.vanish(); } catch (e) {} cam(ctx, null); done(); }   /* (the bike dissolves into the aftermath: no damage) */
          if (t > TS + tu.dust) f.life = 0; } },
      drawUnder(Q) { const T = X.Tz(), X0 = H.sx(x0), Y0 = H.sy(y0);
        if (!burst) { const crk = cl((t - TC) / tu.crack), ub = t / (TB + 0.35), u2 = (t - 0.25) / TB;
          // the blizzard ring off the burnout and the frost racing over the floor
          if (ub < 1) Q.iceRing(X0, Y0, T * tu.R * 0.95 * eout(ub), 0.8 * (1 - ub), null, t, T * 0.5); if (u2 > 0 && u2 < 1) Q.iceRing(X0, Y0, T * tu.R * 0.7 * eout(u2), 0.6 * (1 - u2), null, t);
          Q.frostVeins(X0, Y0, T * tu.R * 1.05, cl(t / (TB + 0.5)), 0.32, 11, 14);
          Q.frozenPool(X0, Y0, T * Math.min(tu.R + 0.3, ring ? tu.reach[ring - 1] : 1.4) * sm((t - TB * 0.5) / 0.5), 0.5, t);
          for (let k = 0; k < ring; k++) { const u = (t - TB - k * tu.every) / 0.6; if (u < 1) Q.iceRing(X0, Y0, T * tu.reach[k] * eout(u), 1 - u, null, t, T * 0.35); }
          // under each mass: the cracked ground, its shock ring, the light it throws on the floor
          for (const m of MS) { if (!m.up) continue; const ag = t - m.t0, mx = H.sx(m.x), my = H.sy(m.y), ww = m.w * T; Q.frostVeins(mx, my, ww * 2.6, cl(ag / 0.22), 0.22 + 0.5 * (1 - cl(ag / 0.6)), m.seed, 6);
            if (ag < 0.5) { Q.iceRing(mx, my, ww * 3.4 * eout(ag / 0.5), 1 - ag / 0.5, null, t); Q.floorLight(mx, my, ww * 2.6, 0.55 * (1 - ag / 0.5), P.white); } Q.floorLight(mx, my, ww * 2, 0.1 + 0.14 * crk, P.cyan); }
          if (t > TC) Q.floorLight(X0, Y0, T * tu.R, 0.3 * sm(crk), P.pale); }
        else { const u = t - TS;   // the shockwave: three rings at their own speeds, the floor lit white
          for (const [d, dur, k, w] of [[0, 0.6, 1.25, 0.8], [0.07, 0.85, 1.6, 0.45], [0.18, 1.15, 1.95, 0.25]]) { const q = (u - d) / dur; if (q > 0 && q < 1) Q.iceRing(X0, Y0, T * tu.R * (0.25 + k * eout(q)), 1 - q, null, t, T * w); }
          if (u < 0.55) Q.floorLight(X0, Y0, T * tu.R * 1.4, 0.6 * (1 - u / 0.55), P.white); Q.frozenPool(X0, Y0, T * tu.R, Math.max(0, 0.6 * (1 - u / tu.dust)), t); } },
      draw(Q) { const T = X.Tz(), Z = T * zk(ctx, T), X0 = H.sx(x0), Y0 = H.sy(y0), crk = burst ? 1 : cl((t - TC) / tu.crack);
        if (!burst || t - TS < 0.14) { const fa = burst ? 1 - (t - TS) / 0.14 : 1;
          for (const m of MS) { if (!m.up) continue; const g = cl((t - m.t0) / tu.grow); mass(Q, m, T, Z, g, crk, g < 1 ? 0.5 * g : 0.3 + 0.7 * crk, fa); }
          // cold mist pooling round the bases
          for (let j = 0; j < MS.length; j += L || Q.c ? 2 : 1) { const m = MS[j]; if (m.up) Q.mist(H.sx(m.x), H.sy(m.y) - T * 0.25, m.w * T * 2.2, 0.2 * cl((t - m.t0) / 0.4) * fa, t); }
          Q.glow(X0, Y0 - T, T * (ring ? tu.reach[ring - 1] : 1), P.cyan, 0.1);
          if (crk > 0) Q.glow(X0, Y0 - T, T * tu.R * 0.9, P.white, 0.12 * crk * crk * fa); }
        if (!burst) { // ice-lightning: arcs up from the tips and from mass to mass, re-struck 18 times a second
          const slot = Math.floor(t * 18), pz = 0.22 + 0.5 * crk, maxB = L ? 3 : 8; let nb = 0;
          for (let j = 0; j < MS.length && nb < maxB; j++) { const m = MS[j]; if (!m.up || t < m.t0 + tu.grow) continue;
            if (R1(slot * 7.3 + j * 13.1) < pz * 0.8) { const hh = T * (1.6 + 3.2 * R1(slot + j * 1.7)), ox = (R1(slot * 3.1 + j) - 0.5) * T * 2.4; Q.bolt(m.tx, m.ty, m.tx + ox, m.ty - hh, slot * 1.7 + j, 0.7 + 0.3 * crk, T * 0.08, 1); Q.glow(m.tx, m.ty, T * 0.7, P.pale, 0.4); nb++; }
            const o = MS[(j + 1 + (slot % 3)) % MS.length]; if (o !== m && o.up && t >= o.t0 + tu.grow && R1(slot * 5.9 + j * 29.3) < pz * 0.6 && Math.hypot(o.tx - m.tx, o.ty - m.ty) < T * 8.5) { Q.bolt(m.tx, m.ty, o.tx, o.ty, slot * 2.3 + j * 3, 0.65 + 0.35 * crk, T * 0.085, 1); Q.glow(o.tx, o.ty, T * 0.6, P.pale, 0.35); nb++; } } }
        else { const u = t - TS, fade = 1 - sm((u - (tu.dust - 1.2)) / 1.2), cy = Y0 - T * 1.2, rm = RM() ? 0.5 : 1;
          // the blinding flash, light shafts thrown outward, lightning let go in every direction
          if (u < 0.34) { Q.glow(X0, cy, T * tu.R * 1.9, P.white, 0.95 * rm * (1 - u / 0.34)); Q.glow(X0, cy, T * tu.R * 1.1, P.cyan, 0.7 * rm * (1 - u / 0.34)); }
          if (u < 1.2) { const n = L ? 8 : 16, k = 1 - u / 1.2; for (let i = 0; i < n; i++) { const an = i / n * TAU + R1(i * 3.7) * 0.35 + u * 0.12, len = T * tu.R * (0.75 + 0.8 * R1(i + 5.5)) * (0.35 + 0.65 * eout(u / 0.3)), ca = Math.cos(an), sa = Math.sin(an) * 0.8; Q.beam(X0 - ca * len * 0.35, cy - sa * len * 0.35, X0 + ca * len, cy + sa * len, T * (0.22 + 0.34 * R1(i + 2.1)), i % 3 ? P.pale : P.white, k * k * (0.3 + 0.4 * R1(i + 9.3)) * rm); } }
          if (u < 0.32) { const slot = Math.floor(t * 18), n = L ? 4 : 8; for (let i = 0; i < n; i++) { const an = i / n * TAU + R1(slot + i * 2.9) * 0.7, len = T * tu.R * (0.7 + 0.5 * R1(slot * 1.3 + i)); Q.bolt(X0, cy, X0 + Math.cos(an) * len, cy + Math.sin(an) * len * 0.7, slot * 3.3 + i, 1 - u / 0.32, T * 0.1, 1); } }
          // mist left pooling where the masses stood
          if (u < 2) for (let j = 0; j < MS.length; j += L || Q.c ? 3 : 2) { const m = MS[j]; Q.mist(H.sx(m.x), H.sy(m.y) - T * 0.3, m.w * T * (2.6 + u), 0.4 * (1 - u / 2), t); }
          // fine sparkling particles hanging in the air: each glints slowly on its own phase
          for (const d of dust) { const tw = Math.pow(0.5 + 0.5 * Math.sin(d.ph + t * d.sp), 6), a = (0.25 + 0.75 * tw) * fade; if (a < 0.03) continue; Q.spark(H.sx(d.x), H.sy(d.y) - d.z * Z, T * 0.15 * d.s * (0.7 + 0.9 * tw), a, tw); } }
        // big tumbling chunks of ice (thrown up as each mass erupts, and everywhere at the shatter)
        for (const q of chunks) { const a = cl((q.life - q.t) / 0.3), hh = T * 0.95 * q.s, cx = H.sx(q.x), cy2 = H.sy(q.y) - q.z * Z; Q.shard(cx - Math.cos(q.rot) * hh * 0.5, cy2 - Math.sin(q.rot) * hh * 0.5, T * 0.55 * q.s, hh, q.rot, q.seed, a, t, T, 0, true); } } }); }
  /* ================= Frozen (wolf finisher) ================= */
  function frozen(ctx) { const done = once(ctx), v = ctx.vehicle; if (!ctx.H || !v) { done(); return; }
    const H = ctx.H, X = H.X, K = IK.bind(H), tu = TUNE.frozen, tier = tierOf(ctx), DK = dkOf(ctx), L = LOW(), CK = clock(ctx), z0 = v.z || 0, OZ = ownZ(ctx);
    let lockM = null;
    /* where the beam should point: the stick when it is held, else the core's target, else the nearest enemy, else ahead */
    const aimF = () => { try { const st2 = ctx.stick && ctx.stick(); if (st2 && st2.mag > 0.2) return Math.atan2(st2.y, st2.x); } catch (e) {} let m = lockM && !gone(lockM) ? lockM : null; if (!m) try { const tg = ctx.target && ctx.target(); if (tg && tg.m && !gone(tg.m)) m = tg.m; } catch (e) {}
      if (!m) { let bd = 13; for (const q of monsOf(ctx)) { if (gone(q)) continue; const d = Math.hypot(q.x - v.x, q.y - v.y); if (d < bd) { bd = d; m = q; } } } lockM = m;   /* (it stays on one enemy while that one lives) */ return m && Math.hypot(m.x - v.x, m.y - v.y) > 0.2 ? Math.atan2(m.y - v.y, m.x - v.x) : null; };
    const A = { a: (() => { const a = aimF(); return a == null ? aimOf(ctx).a : a; })() }, xs = v.x, ys = v.y; let ang = A.a, ca = Math.cos(ang), sa = Math.sin(ang); v.locked = true; v.heading = ang;
    // the backflip carries it back a little, where it can stand
    let back = 0; for (let s = 0.25; s <= tu.back; s += 0.25) { if (!stand(ctx, xs - ca * s, ys - sa * s)) break; back = s; }
    const T1 = tu.flip, T2 = T1 + tu.lock, T3 = T2 + tu.load, T4 = T3 + tu.charge, per = DK * tu.total[tier] / tu.ticks, tickDt = tu.dur / tu.ticks;
    let t = 0, ph = 'flip', tBeam = -1, nTick = 0, tEnd = -1, beamU = 0, len = tu.len, finished = false, ret = false, lastNow = CK.now();
    ctx.frozenPlan = { ticks: tu.ticks, tick: tickDt, dur: tu.dur, per, fired: 0, t0: null, t1: null };   /* (for tests: the beam's window on the game clock and its ticks) */
    cam(ctx, { zoom: tu.zoom, x: xs + ca * 3, y: ys + sa * 3, k: 0.6 }); sfx(X, 'whoosh'); sfx(X, 'note', 200, tu.flip, 'sawtooth', 0.05, 420);
    const origin = () => { const a = anchor(ctx, 'muzzleL'), b = anchor(ctx, 'muzzleR'); return { x: (a.x + b.x) / 2 + ca * 0.3, y: (a.y + b.y) / 2 + sa * 0.3, z: (a.z + b.z) / 2 }; };
    /* the beam's length from its start (`nose` ahead of the body): to the first real wall along it */
    const reach = () => { let d = tu.len; for (let q = 0.5; q <= tu.len + tu.nose; q += 0.25) if (wall(ctx, v.x + ca * q, v.y + sa * q)) { d = Math.max(3, q - tu.nose); break; } return Math.min(tu.len, d); };
    add(ctx, { life: 90, keep: true, cover: true, abort() { if (OZ) v.z = z0; done(); },
      update(dt, f) { if (!finished && !live(ctx)) { f.life = 0; if (OZ) v.z = z0; done(); return; }   /* (the session ended, e.g. the pet fell: the beam and its damage stop at once) */
        CK.step(dt); t += dt; const now = CK.now(); lastNow = now;
        if (ph === 'flip') { const u = cl(t / T1); v.x = xs - ca * back * sm(u); v.y = ys - sa * back * sm(u); if (OZ) v.z = z0 + tu.flipH * 4 * u * (1 - u); pose(ctx, 'backflip', u, { h: tu.flipH }); if (u >= 1) { ph = 'lock'; if (OZ) v.z = z0; sfx(X, 'thud'); sfx(X, 'crash'); shake(ctx, 6, 0.2); for (const n of ['pawFL', 'pawFR', 'pawRL', 'pawRR']) { const p = anchor(ctx, n); glitE(ctx, K, p.x, p.y, L ? 2 : 5, 4); snowE(ctx, K, p.x, p.y, L ? 1 : 3); } } }
        else if (ph === 'lock') { pose(ctx, 'pawLock', sm((t - T1) / tu.lock)); if (t >= T2) { ph = 'load'; sfx(X, 'note', 300, 0.12, 'square', 0.06, 300); sfx(X, 'thud'); } }
        else if (ph === 'load') { const u = (t - T2) / tu.load; pose(ctx, 'frozenLoad', cl(u), { pawLock: 1 }); if (Math.floor(u * 3) !== Math.floor((u - dt / tu.load) * 3)) sfx(X, 'note', 340 + 60 * Math.floor(u * 3), 0.08, 'square', 0.06, 200);   /* (receivers cycling) */ if (t >= T3) { ph = 'charge'; sfx(X, 'hum'); sfx(X, 'note', 300, tu.charge, 'sine', 0.12, 1500); } }
        else if (ph === 'charge') { const u = (t - T3) / tu.charge; pose(ctx, 'frozenCharge', cl(u), { pawLock: 1, glow: cl(u) }); if (!L || Math.random() < 0.4) { const o = origin(), a2 = Math.random() * TAU; snowE(ctx, K, o.x + Math.cos(a2) * 1.2, o.y + Math.sin(a2) * 0.9, 1, { z: o.z, v: 0.3, life: 0.35 }); }
          if (t >= T4) { const a2 = aimF(); if (a2 != null) { ang = a2; ca = Math.cos(ang); sa = Math.sin(ang); v.heading = ang; }   /* (it fires facing its target as it stands now) */ ph = 'beam'; tBeam = now; ctx.frozenPlan.t0 = now; ctx.frozenPlan.t1 = now + tu.dur; sfx(X, 'crash'); sfx(X, 'zap'); sfx(X, 'hiss', tu.dur, 0.4, 1800); sfx(X, 'note', 55, tu.dur, 'sawtooth', 0.28, 50); sfx(X, 'note', 880, tu.dur, 'sine', 0.05, 990); shake(ctx, 8, 0.3); X.flash && X.flash(RM() ? 0.05 : 0.1, '#DDF6FF'); } }
        else if (ph === 'beam') { // exactly `dur` s of the game clock; the ticks are deadlines on it (as many as are due, never more than `ticks`; the first at 0.125 s, the last at 4.875 s)
          { const a2 = aimF(), da = a2 == null ? 0 : Math.atan2(Math.sin(a2 - ang), Math.cos(a2 - ang)), lim = tu.turn * dt; ang += Math.max(-lim, Math.min(lim, da)); ca = Math.cos(ang); sa = Math.sin(ang); v.heading = ang; }   /* (the locked wolf swings the beam slowly after its aim: the stick, else its target) */
          const o = origin(); len = reach(); beamU = cl((now - tBeam) / 0.12); pose(ctx, 'frozenFire', cl((now - tBeam) / tu.dur), { pawLock: 1, recoil: 0.6 + 0.4 * Math.sin(t * 38), glow: 1 });
          while (nTick < tu.ticks && now >= tBeam + (nTick + 0.5) * tickDt - 1e-9) {   /* (tick k lands at the middle of its slice: all `ticks` fall inside the window at any frame rate) */ nTick++; stats.frozenTicks++; ctx.frozenPlan.fired = nTick; hitO(ctx, v.x + ca * (tu.nose + len / 2), v.y + sa * (tu.nose + len / 2), len / 2, tu.half, ang, per,   /* (the volume is laid from the body, not from the model's anchors: those are only as fresh as the last drawn frame) */ { noCharge: true, el: 'ice', src: 'ult', kb: 0, freeze: 0.4 }); }
          if (Math.random() < dt * 9) shake(ctx, 2.5, 0.1); if (!(f.lt > t) && X.light) { f.lt = t + 0.12; X.light(o.x + ca * len * 0.5, o.y + sa * len * 0.5, 4, 0.25); X.light(o.x + ca * len, o.y + sa * len, 3, 0.25); }
          let k = (L ? 8 : 26) * dt + Math.random(); while (k-- >= 1) { const u = Math.random(), px = o.x + ca * len * u, py = o.y + sa * len * u; if (Math.random() < 0.5) snowE(ctx, K, px + rnd(-0.6, 0.6), py + rnd(-0.5, 0.5), 1, { v: 1.2, up: 1.0, life: 0.6 }); else glitE(ctx, K, o.x + ca * len, o.y + sa * len, 1, 7); }
          if (now >= tBeam + tu.dur - 1e-9 && nTick >= tu.ticks) { ph = 'end'; tEnd = t; ctx.frozenPlan.t1 = tBeam + tu.dur;   /* (the window is its deadlines: t0 .. t0 + dur) */ sfx(X, 'note', 500, 0.4, 'sine', 0.1, 120); } }
        else if (ph === 'end') { beamU = 1 - cl((t - tEnd) / 0.2); const q = (t - tEnd - tu.end) / tu.cracks; pose(ctx, q < 0 ? 'frozenFire' : 'frostCracks', q < 0 ? 1 : cl(q), { pawLock: 1 - cl(q), recoil: 0, glow: 1 - cl((t - tEnd) / tu.end) });
          if (q > 0 && Math.floor(q * 6) !== Math.floor((q - dt / tu.cracks) * 6)) sfx(X, 'note', 1400 + 500 * Math.random(), 0.07, 'square', 0.03, 500);
          if (!ret && q >= 0.75) { ret = true; try { ctx.returnPoint = ctx.safeReturn ? ctx.safeReturn() : null; } catch (e) {} }
          if (!finished && q >= 1) { finished = true; // the wolf shatters into ice dust: an exit effect, no damage
            const p = anchor(ctx, 'center'); sfx(X, 'crash'); sfx(X, 'sparkle'); shatE(ctx, K, p.x, p.y, 2.2); fragE(ctx, K, p.x, p.y, L ? 10 : 26, 8); glitE(ctx, K, p.x, p.y, L ? 12 : 30, 8); snowE(ctx, K, p.x, p.y, L ? 8 : 20); try { ctx.vanish && ctx.vanish(); } catch (e) {} cam(ctx, null); done(); f.life = 0.05; } } },
      drawUnder(Q) { if (beamU <= 0.01) return; const T = X.Tz(), o = origin(), ex = o.x + ca * len, ey = o.y + sa * len; // frost light along the floor under the beam, the pool at its end
        for (let i = 0; i <= 5; i++) { const u = i / 5; Q.floorLight(H.sx(lerp(o.x, ex, u)), H.sy(lerp(o.y, ey, u)), T * 1.9, 0.3 * beamU, P.ice); } Q.frozenPool(H.sx(ex), H.sy(ey), T * 2.2, 0.8 * beamU, t); Q.frostVeins(H.sx(ex), H.sy(ey), T * 2.6, 1, 0.6 * beamU, 7, 9); },
      draw(Q) { const T = X.Tz(), Z = T * zk(ctx, T), o = origin(), OX = H.sx(o.x), OY = H.sy(o.y) - o.z * Z;
        // loading and charging: cyan energy gathering along the two barrels
        if (ph === 'load' || ph === 'charge') { const u = ph === 'load' ? 0.35 * cl((t - T2) / tu.load) : 0.35 + 0.65 * cl((t - T3) / tu.charge); for (const n of ['muzzleL', 'muzzleR']) { const mz = anchor(ctx, n), x = H.sx(mz.x), y = H.sy(mz.y) - mz.z * Z; Q.glow(x, y, T * (0.3 + 0.9 * u), P.cyan, 0.75 * u); Q.glow(x, y, T * 0.2 * (1 + u), P.white, 0.9 * u); } }
        if (beamU <= 0.01) return;
        const ex = o.x + ca * len, ey = o.y + sa * len, EX = H.sx(ex), EY = H.sy(ey) - 0.5 * Z, Ls = Math.hypot(EX - OX, EY - OY), an = Math.atan2(EY - OY, EX - OX), fl = 1 + 0.06 * Math.sin(t * 61) + 0.04 * Math.sin(t * 37), W = T * tu.half * 1.25 * beamU * fl;
        if (Q.fbeam) { const mL = anchor(ctx, 'muzzleL'), mR = anchor(ctx, 'muzzleR'), g2 = (x, y) => [Q.X(x, y), Q.Y(x, y)];   /* (the GPU's beam shader: core, layers, filaments, vapour, muzzle streams, impact) */
          Q.fbeam({ o: g2(OX, OY), e: g2(EX, EY), ml: g2(H.sx(mL.x), H.sy(mL.y) - mL.z * Z), mr: g2(H.sx(mR.x), H.sy(mR.y) - mR.z * Z), w: T * tu.half * 1.25 * Q.k, a: beamU });
          for (let i = 0; i < 4; i++) Q.shard(EX, EY + T * 0.3, T * 0.3, T * (0.9 + 0.5 * Math.sin(t * 9 + i * 2)) * beamU, -Math.PI / 2 + (i - 1.5) * 0.5, i + 3, 0.85 * beamU, t, T, 0); return; }
        const c = Q.c;
        // (2D fallback) the two short muzzle streams converging into the one beam
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const n of ['muzzleL', 'muzzleR']) { const mz = anchor(ctx, n), x = H.sx(mz.x), y = H.sy(mz.y) - mz.z * Z, jx = OX + Math.cos(an) * T * 1.1, jy = OY + Math.sin(an) * T * 1.1, l2 = Math.hypot(jx - x, jy - y); c.save(); c.translate(x, y); c.rotate(Math.atan2(jy - y, jx - x)); c.globalAlpha = 0.8 * beamU; c.drawImage(beamSprite(P.cyan), 0, -T * 0.3, l2, T * 0.6); c.globalAlpha = beamU; c.drawImage(beamSprite(P.white), 0, -T * 0.12, l2, T * 0.24); c.restore(); }
        // the beam: blue and cyan outer layers, a brilliant white core
        c.translate(OX, OY); c.rotate(an);
        c.globalAlpha = 0.45 * beamU; c.drawImage(beamSprite(P.deep), -W * 0.3, -W * 1.5, Ls + W * 0.8, W * 3); c.globalAlpha = 0.7 * beamU; c.drawImage(beamSprite(P.blue), -W * 0.2, -W * 1.05, Ls + W * 0.6, W * 2.1);
        c.globalAlpha = 0.9 * beamU; c.drawImage(beamSprite(P.cyan), 0, -W * 0.68, Ls + W * 0.3, W * 1.36); c.globalAlpha = beamU; c.drawImage(beamSprite(P.white), 0, -W * 0.32, Ls + W * 0.15, W * 0.64);
        // twisting frost filaments round it
        c.lineCap = 'round'; c.lineJoin = 'round'; const NS = 72, cyc = Math.max(1, Ls / (T * 2.6)) * TAU; for (let s2 = 0; s2 < (L ? 2 : 3); s2++) { c.beginPath(); for (let i = 0; i <= NS; i++) { const u = i / NS, x = u * Ls, y = Math.sin(u * cyc - t * 13 + s2 * TAU / 3) * W * (0.75 + 0.2 * Math.sin(u * 9 + t * 3)); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.globalAlpha = 0.22 * beamU; c.strokeStyle = P.cyan; c.lineWidth = T * 0.22; c.stroke(); c.globalAlpha = 0.6 * beamU; c.strokeStyle = P.frost; c.lineWidth = Math.max(1, T * 0.05); c.stroke(); }
        c.restore();
        // the muzzle bloom, the heavy impact at the far end, cold vapour
        Q.glow(OX, OY, T * 1.6 * fl, P.cyan, 0.8 * beamU); Q.glow(OX, OY, T * 0.8, P.white, beamU);
        Q.glow(EX, EY, T * 2.6 * fl, P.cyan, 0.75 * beamU); Q.glow(EX, EY, T * 1.3 * fl, P.white, 0.95 * beamU); Q.mist(EX, EY, T * 2.4, 0.5 * beamU, t);
        for (let i = 0; i < 4; i++) Q.shard(EX, EY + T * 0.3, T * 0.3, T * (0.9 + 0.5 * Math.sin(t * 9 + i * 2)) * beamU, -Math.PI / 2 + (i - 1.5) * 0.5, i + 3, 0.85 * beamU, t, T, 0); } }); }

  /* ================= the button glyphs (drawn between the core's button face and rim; rd: ready) ================= */
  const icons = {
    iceCannon(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; for (const dy of [-0.2, 0.2]) { x.strokeStyle = rd ? '#C8D4E4' : '#8A8F9A'; x.lineWidth = r * 0.12; x.beginPath(); x.moveTo(-r * 0.6, dy * r + r * 0.12); x.lineTo(r * 0.15, dy * r - r * 0.1); x.stroke(); x.fillStyle = rd ? P.cyan : '#9AA'; x.beginPath(); x.arc(r * 0.42, dy * r - r * 0.18, r * 0.13, 0, TAU); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(r * 0.42, dy * r - r * 0.18, r * 0.06, 0, TAU); x.fill(); } x.restore(); },
    somersault(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.strokeStyle = rd ? P.cyan : '#9AA'; x.lineWidth = r * 0.09; x.lineCap = 'round'; x.beginPath(); x.arc(0, -r * 0.12, r * 0.42, Math.PI * 0.9, Math.PI * 2.35); x.stroke(); x.fillStyle = rd ? P.pale : '#AAB'; x.beginPath(); x.moveTo(-r * 0.18, r * 0.62); x.lineTo(0, -r * 0.05); x.lineTo(r * 0.18, r * 0.62); x.closePath(); x.fill(); x.restore(); },
    spinningWheel(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; x.strokeStyle = rd ? '#C8D4E4' : '#8A8F9A'; x.lineWidth = r * 0.14; x.beginPath(); x.arc(0, 0, r * 0.36, 0, TAU); x.stroke(); x.strokeStyle = rd ? P.cyan : '#9AA'; x.lineWidth = r * 0.07; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(0, 0, r * 0.6, i * TAU / 3, i * TAU / 3 + 1.2); x.stroke(); } x.restore(); },
    diamondDust(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, px = Math.cos(a) * r * 0.45, py = Math.sin(a) * r * 0.3 + r * 0.15, h = r * (0.35 + 0.12 * (i % 2)); x.fillStyle = rd ? (i % 2 ? P.pale : P.ice) : '#9AA'; x.beginPath(); x.moveTo(px - r * 0.09, py); x.lineTo(px, py - h); x.lineTo(px + r * 0.09, py); x.closePath(); x.fill(); } x.fillStyle = '#FFFFFF'; for (const [a, b] of [[-0.3, -0.5], [0.25, -0.62], [0, -0.3]]) { x.beginPath(); x.arc(a * r, b * r, r * 0.05, 0, TAU); x.fill(); } x.restore(); },
    frozen(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; x.strokeStyle = rd ? 'rgba(95,232,255,0.5)' : 'rgba(150,160,170,0.4)'; x.lineWidth = r * 0.34; x.beginPath(); x.moveTo(-r * 0.55, r * 0.3); x.lineTo(r * 0.55, -r * 0.3); x.stroke(); x.strokeStyle = rd ? '#FFFFFF' : '#BBC'; x.lineWidth = r * 0.12; x.stroke(); x.restore(); },
  };

  FM.iceCannon = iceCannon; FM.somersault = somersault; FM.spinningWheel = spinningWheel; FM.diamondDust = diamondDust; FM.fenrirDust = diamondDust;   /* (the core asks for fenrirDust: Ice's old Diamond Dust ult is another move) */ FM.frozen = frozen;
  FM.driftSweep = driftSweep; FM.driftSpikes = driftSpikes; FM.icons = icons;
  FM.warm = () => { try { glowSprite(P.cyan); glowSprite(P.white); glowSprite(P.ice); glowSprite(P.pale); beamSprite(P.cyan); beamSprite(P.white); beamSprite(P.blue); beamSprite(P.deep); } catch (e) {} return true; };
  FM.update = () => {};
})();
