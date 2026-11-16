/* ---------- Dark, reworked: Annihilation ----------
   Dark's supreme finisher. Six concentrated purple lights erupt across the field, narrow pillars with brilliant cores and
   dark energy curling round their edges; their bases spread into six ritual circles (one giant over the aim, five smaller
   of visibly different sizes round it): the outer arcs trace themselves across the floor, concentric rings turn in
   opposite directions, gothic glyphs light in sequence, fine spokes run to bright central seals, sparks crawl round the
   inscriptions and jump between them, and shards of shadow rise and hang over them. Then exactly one missile bursts up
   from each circle (the giant one launches the largest, last): brilliant violet cores, deep-purple outer layers, pointed
   heads and long spiralling tails; they rise, then curve to a shared point high over the aim on different arcs, the
   central one climbing through the middle, and their lingering trails briefly draw a colossal ritual pattern from the
   floor to the sky. Each arrival feeds an immense sphere (a ripple races across it, it swells): a lavender core inside
   swirling violet currents and counter-rotating bands, under a darker translucent shell, sparks leaving its surface and
   curving back. It holds at full charge while the six circles pulse together and feed their remaining light upward; it
   compresses, its underside blazing; then it empties into a thick downward strike (a violet-white spearhead, twisting
   streams) into the giant circle, whose inscriptions flare outward just before the impact.
   The impact: H.X.negative(0.12) once and ONE authoritative Dark hit (24 x base x K x evoK, R = 4.4 K .. 6 K at
   Celestial, kb 7, stun 0.6) -- nothing before it, nothing after. A tight violet-white flash, an enormous expanding blast
   shell, a broad purple shockwave throwing out dark fragments, low rolling mist and luminous pressure streaks; a towering
   column rising into a rolling mushroom crown of purple-black energy, lit from within (violet underside, dark folds
   rolling over the top, sparks flickering inside); the six circles fracture into glowing segments, their glyphs lift
   and disintegrate, temporary violet cracks spread under the blast; a long aftermath of falling fragments, drifting ash,
   curling clouds and a slowly dying central glow. Light-only floor traces; nothing stays.
   Adept: wider coverage, more intricate circles, layered missile trails, richer movement inside the sphere. Celestial: a
   monumental formation with raised rotating rings over the giant circle, six coordinated spiralling trails, an immense
   layered core and the largest explosion. Six circles and six missiles at every level.
   Near the pet everything over it dims smoothly (never a cut-out). Built for the phone: the circles, glyphs, missiles,
   sphere layers, swirl, beam and cloud puffs are cached sprites; no per-frame gradients, no shadowBlur, no filters.
   (v391 U3) Rebuilt on the GPU: where WebGL runs (ANNIH_GFX below; window.__ANN_GL = 0 forces the 2D picture), the same
   timeline, aim, damage and beats are painted by its own shader: the ritual circles as smooth glowing runes and rings
   (soft falloff, slowly turning, layered: the outer arcade, the counter-turning hexagram, the glyph band lighting in turn,
   the seal, and a raised ghost of the rings for depth), the six pillars as soft volumetric columns (a halo, a body and a
   white core, one seamless ribbon each, feathered into the sky), the missiles with soft trails and spiralling strands,
   the overhead light as a growing star (corona, spikes, lens halo and streak, a ripple at each arrival), a massive soft
   strike, and the strongest blast of the element: a layered soft flash, a dome shockwave, a violet column rising into a
   rolling mushroom of light and smoke, glowing ground cracks, fractured circles, lifting glyphs, rich pooled particles
   (sparks, embers, obsidian shards, ash) and screen distortion (the frame refracted round the front, a shimmer over the
   heart), with the same shakes and hitstop. Where the GPU cannot run (no WebGL, a lost context) the 2D picture above
   plays unchanged (drawUnder2D / draw2D). */
/* ---------- ANNIH_GFX: Annihilation's own GPU painter (v391 U3) ----------
   One offscreen WebGL canvas (WebGL2, else WebGL1) at the game canvas's size x res, twice as wide plus a 4 px gap: the left
   half takes what is solid (shade, smoke, the cloud's body, dark debris, the screen distortion: premultiplied, laid over),
   the right half light alone (alpha = its brightest channel, screened in GL and added to the game with 'lighter'), so every
   output is valid premultiplied colour and composites the same in every browser (WebKit included).
   Quads (17 floats a vertex: screen px, uv, kind, rgba, two vec4 of parameters) and ribbons (strips with uv.y running along
   them, so a trail or a column has no joins) are drawn by one shader whose kinds are all smooth maths: every picture fades to
   nothing well inside its own quad (no straight cut, no cropped layer). Particles are one batch of point sprites (soft
   dots, motion streaks, faceted shards). The distortion samples a snapshot of the frame drawn so far.
   Kinds: 0 glow (soft bloom) · 1 ribbon (gaussian across, feathered ends) · 2 ring (gaussian band; arcs) · 3 ritual
   circle (layers: 0 outer, 1 inner, 2 seal, 3 glyph band, 4 raised ghost) · 4 star (core, corona, spikes, lens halo,
   ripples) · 5 dome shockwave · 6 glowing ground cracks · 7 the mushroom cloud (both passes) · 9 one glyph (lifting and
   dissolving) · 10 shade (a soft dark disc) · 14 smoke puff · 15 distortion · 16 an obsidian shard (facets, violet rim).
   Only where WebGL runs on real hardware (a software rasteriser keeps the 2D version) unless window.__ANN_GL = 1;
   window.__ANN_GL = 0 forces the 2D version. A lost context falls back to 2D and is rebuilt a moment later. */
self.ANNIH_GFX = self.ANNIH_GFX || (() => {
  const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  const VS = `attribute vec2 a_p, a_uv; attribute float a_k; attribute vec4 a_c, a_q, a_r; uniform vec2 u_res; varying vec2 v_uv, v_px; varying float v_k; varying vec4 v_c, v_q, v_r;
void main(){ gl_Position = vec4(a_p.x / u_res.x * 2.0 - 1.0, 1.0 - a_p.y / u_res.y * 2.0, 0.0, 1.0); v_uv = a_uv; v_k = a_k; v_c = a_c; v_q = a_q; v_r = a_r; v_px = a_p; }`;
  const FS = HDR + `uniform float u_t, u_pass, u_gy; uniform vec2 u_res; uniform vec3 u_pet; uniform sampler2D u_tex; uniform int u_oct;
varying vec2 v_uv, v_px; varying float v_k; varying vec4 v_c, v_q, v_r;
const vec3 ENERGY = vec3(0.427, 0.157, 0.659), EDGE = vec3(0.647, 0.361, 1.0), ACC = vec3(0.816, 0.682, 1.0), WHITE = vec3(1.0), PLUM = vec3(0.169, 0.043, 0.271), VOIDC = vec3(0.031, 0.02, 0.059);
float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { if (i >= u_oct) break; s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s + a * 0.5; }
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float fbm3(vec3 p){ return 0.55 * n3(p) + 0.3 * n3(p * 2.07 + 3.1) + 0.15 * n3(p * 4.13 + 7.7); }
float sq(float x){ return x * x; }
vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
/* a glowing line at distance d (core width w): accumulates a bright core and a soft halo, no edge anywhere */
vec2 lnI(float d, float w){ float x = d / w; return vec2(exp(-x * x), 0.42 * exp(-x * x / 10.0) + 0.1 * exp(-abs(x) / 9.0)); }
/* the same at a pixel size px: a line thinner than a pixel widens to one and dims to keep its weight (no fill at small sizes) */
vec2 lnP(float d, float w, float px){ float we = max(w, px * 0.75), x = d / we, wh = max(w * 3.2, px * 1.6), y = d / wh; return vec2(exp(-x * x) * w / we, (0.42 * exp(-y * y) + 0.08 * exp(-d / (w * 9.0 + px * 2.5))) * min(1.0, w * 3.2 / wh)); }
/* the eight gothic glyphs (units of a 24 px cell, y down), as distance fields */
float glyph(vec2 p, float id){ float d = 1e3;
  if (id < 0.5) { d = min(sdSeg(p, vec2(-8.0, 10.0), vec2(-7.4, -2.5)), sdSeg(p, vec2(-7.4, -2.5), vec2(0.0, -13.0))); d = min(d, min(sdSeg(p, vec2(8.0, 10.0), vec2(7.4, -2.5)), sdSeg(p, vec2(7.4, -2.5), vec2(0.0, -13.0)))); d = min(d, sdSeg(p, vec2(0.0, -5.0), vec2(0.0, 10.0))); }
  else if (id < 1.5) { d = min(min(sdSeg(p, vec2(-9.0, -8.0), vec2(9.0, -8.0)), sdSeg(p, vec2(9.0, -8.0), vec2(0.0, 11.0))), min(sdSeg(p, vec2(0.0, 11.0), vec2(-9.0, -8.0)), sdSeg(p, vec2(-5.0, -1.0), vec2(5.0, -1.0)))); }
  else if (id < 2.5) { vec2 q = p - vec2(1.0, 0.0); float an = abs(atan(q.y, q.x)); d = an > 0.7 ? abs(length(q) - 9.0) : min(length(q - 9.0 * vec2(cos(0.7), sin(0.7))), length(q - 9.0 * vec2(cos(0.7), -sin(0.7)))); d = min(d, sdSeg(p, vec2(-4.0, -12.0), vec2(-4.0, 12.0))); }
  else if (id < 3.5) { d = min(sdSeg(p, vec2(0.0, 12.0), vec2(0.0, -4.0)), min(min(sdSeg(p, vec2(-8.0, -12.0), vec2(-6.8, -5.4)), sdSeg(p, vec2(-6.8, -5.4), vec2(0.0, -4.0))), min(sdSeg(p, vec2(8.0, -12.0), vec2(6.8, -5.4)), sdSeg(p, vec2(6.8, -5.4), vec2(0.0, -4.0))))); }
  else if (id < 4.5) { d = min(min(sdSeg(p, vec2(0.0, -12.0), vec2(0.0, 12.0)), sdSeg(p, vec2(-9.0, -3.0), vec2(9.0, -3.0))), min(sdSeg(p, vec2(9.0, -3.0), vec2(9.0, 4.0)), sdSeg(p, vec2(-9.0, -3.0), vec2(-9.0, -10.0)))); }
  else if (id < 5.5) { vec2 q = p / vec2(11.0, 5.5); d = abs(length(q) - 1.0) * 5.5; d = min(d, abs(length(p) - 3.0)); }
  else if (id < 6.5) { d = min(min(sdSeg(p, vec2(-9.0, -10.0), vec2(0.0, -2.0)), sdSeg(p, vec2(0.0, -2.0), vec2(9.0, -10.0))), min(sdSeg(p, vec2(-9.0, 0.0), vec2(0.0, 8.0)), sdSeg(p, vec2(0.0, 8.0), vec2(9.0, 0.0)))); }
  else { d = min(abs(length(p - vec2(0.0, -4.0)) - 6.0), min(sdSeg(p, vec2(0.0, 2.0), vec2(0.0, 12.0)), sdSeg(p, vec2(-6.0, 12.0), vec2(6.0, 12.0)))); }
  return d; }
/* a glyph's light: core + violet mid + energy halo (d in glyph units) */
vec3 glyphL(float d, float ws){ float a = d / (0.85 * ws), b = d / (1.9 * ws), c = d / (4.2 * ws); return mix(ACC, WHITE, 0.35) * exp(-a * a) + EDGE * 0.55 * exp(-b * b) + ENERGY * 0.4 * exp(-c * c); }
void main(){
  vec2 u = v_uv; float r = length(u), k = v_k, t = u_t, al = v_c.a; vec3 col = v_c.rgb; vec4 Q = v_q, R4 = v_r;
  float pk = 1.0; if (u_pet.z > 0.0 && R4.w > 0.0) pk = mix(1.0, 0.18 + 0.82 * smoothstep(0.45, 1.7, length(v_px - u_pet.xy) / u_pet.z), R4.w);
  float s = 0.0; vec3 L = vec3(0.0); vec4 S = vec4(0.0); bool gen = true;   /* (gen: a plain shape s in its colour, for either pass) */
  if (k < 0.5) { // a soft glow: a gaussian core (Q.x its tightness) and a long bloom tail (Q.y), windowed to nothing at the rim
    float c = Q.x > 0.0 ? Q.x : 4.0; s = (exp(-r * r * c) + Q.y * 0.35 * exp(-r * r * 1.3)) * (1.0 - smoothstep(0.5, 1.0, r)); if (Q.z > 0.0) L = mix(col, WHITE, Q.z * exp(-r * r * c * 3.0)) * s; }
  else if (k < 1.5) { // a ribbon: uv.x across (-1..1), uv.y along (0..1); Q.x across sharpness, Q.y start feather, Q.z white core, Q.w end feather; R4.x flow
    float x = abs(u.x), y = u.y, sh = Q.x > 0.0 ? Q.x : 3.2, body = exp(-x * x * sh) * (1.0 - smoothstep(0.6, 1.0, x));
    float ea = Q.y > 0.0 ? smoothstep(0.0, Q.y, y) : 1.0, eb = Q.w > 0.0 ? 1.0 - smoothstep(1.0 - Q.w, 1.0, y) : 1.0, along = ea * ea * (3.0 - 2.0 * ea) * eb;
    float flow = 1.0 + R4.x * sin(y * R4.y * 6.2832 - t * 3.0), core = exp(-x * x * sh * 7.0) * Q.z;
    s = body * along * flow; L = mix(col, WHITE, min(1.0, core * 0.9)) * (body + core * 0.8) * along * flow; }
  else if (k < 2.5) { // a ring: radius Q.x, width Q.y (uv units), soft inner fill Q.z; Q.w arcs (0: whole), R4.x arc phase, R4.y gap
    float d = (r - Q.x) / max(Q.y, 0.002), m = 1.0;
    if (Q.w > 0.5) { float f = fract((atan(u.y, u.x) / 6.2832 + 0.5) * Q.w + R4.x), gp = R4.y; m = smoothstep(0.0, 0.08, f) * (1.0 - smoothstep(1.0 - gp - 0.08, 1.0 - gp, f)); }
    float band = exp(-d * d) * (0.85 + 0.15 * n2(vec2(atan(u.y, u.x) * 4.0 + R4.z, t * 0.7)));
    s = (band * m + Q.z * smoothstep(Q.x, 0.0, r) * 0.35) * (1.0 - smoothstep(0.88, 1.0, r)); L = mix(col, WHITE, 0.55 * exp(-d * d * 5.0) * m) * s; }
  else if (k < 3.5) { // a ritual circle (layer Q.x), seen from above in its own frame: Q.y its turn; R4.x line width scale, R4.y circle units a GL px
    gen = false; float lay = Q.x; vec2 p = rot(u * 1.12, -Q.y); float rr = length(p), an = atan(p.y, p.x), ws = R4.x, px = R4.y; vec2 A = vec2(0.0);
    float w5 = 0.0055 * ws, lod = smoothstep(0.22, 0.75, w5 / px);   /* (lnP keeps each line's weight at any size; the finest detail fades out where it cannot be drawn) */
    if (lay < 0.5 || lay > 3.5) { // the outer layer (4: its raised ghost, rings only)
      float tier = Q.w, tr = lay > 3.5 ? 1.0 : Q.z, a01 = fract(an / 6.2832), m = tr >= 1.0 ? 1.0 : 1.0 - smoothstep(tr - 0.02, tr, a01);
      A += lnP(abs(rr - 0.975), w5 * 3.0, px) * 1.0 + lnP(abs(rr - 0.917), w5 * 1.2, px) * 0.7;
      if (lay < 3.5) {
        float tc = an * 96.0 / 6.2832, ti = floor(tc + 0.5), tk = abs(tc - ti) * 6.2832 / 96.0 * rr, big = 1.0 - step(0.5, mod(ti + 96.0, 8.0)), L0 = mix(0.021, 0.046, big);
        A += lnP(tk, w5, px) * 0.75 * smoothstep(0.967 - L0 - 0.004, 0.967 - L0 + 0.006, rr) * (1.0 - smoothstep(0.963, 0.973, rr)) * lod;
        float NA = 16.0 + tier * 4.0, ra = 0.9, rb = 0.79, cc = an * NA / 6.2832, uu = fract(cc) - 0.5, v = abs(uu * 2.0), f = rb + (ra - rb) * (1.0 - sq(1.0 - v));
        float fd = (ra - rb) * 2.0 * (1.0 - v) * 2.0 / (6.2832 / NA * rr), dA = abs(rr - f) / sqrt(1.0 + fd * fd);
        A += lnP(dA, w5, px) * 0.7 * smoothstep(0.76, 0.79, rr) * (1.0 - smoothstep(0.9, 0.93, rr)) * lod;
        vec2 dc = vec2((rr - (ra - 0.0375)), uu * 6.2832 / NA * rr); A += vec2(exp(-dot(dc, dc) / sq(max(0.011, px * 1.2))) * min(1.0, sq(0.011 / max(0.011, px * 1.2))), 0.0) * 0.85;
        A += lnP(abs(rr - 0.775), w5, px) * 0.55;
        if (tier > 0.5) { float dash = smoothstep(0.1, 0.35, abs(fract(an * 40.0 / 6.2832) - 0.5)); A += lnP(abs(rr - 0.733), w5 * 1.3, px) * 0.6 * dash;
          vec2 dq = vec2(rr - 0.683, uu * 6.2832 / NA * rr); float dd = abs(abs(dq.x) / 0.021 + abs(dq.y) / 0.017 - 1.0) * 0.017; A += lnP(dd, w5 * 0.8, px) * 0.6 * lod; }
        if (tier > 1.5) { A += lnP(abs(rr - 1.017), w5, px) * 0.5; float cu = fract(an * 24.0 / 6.2832) - 0.5; vec2 dq = vec2(rr - 0.946, cu * 6.2832 / 24.0 * rr); float dd = min(max(abs(dq.x), abs(dq.y) - 0.0125), max(abs(dq.y), abs(dq.x) - 0.0125)); A += lnP(max(dd, 0.0), w5 * 0.8, px) * 0.55 * lod; }
        L += ENERGY * (0.05 + 0.2 * smoothstep(0.55, 0.95, rr)) * (1.0 - smoothstep(0.96, 1.07, rr)) * m;   /* (a soft violet wash, strongest at the rim) */ }
      A *= m; }
    else if (lay < 1.5) { // the inner layer: a ring pair, the hexagram (two at Celestial), spokes, small rings at its points
      float tier = Q.w, b01 = fract(-an / 6.2832), m = Q.z >= 1.0 ? 1.0 : 1.0 - smoothstep(Q.z - 0.02, Q.z, b01), R2 = 0.558;
      A += lnP(abs(rr - 0.625), w5 * 1.6, px) * 0.9 + lnP(abs(rr - R2), w5 * 0.8, px) * 0.6;
      float dh = 1e3, dh2 = 1e3; for (int i = 0; i < 6; i++) { float th = 1.5708 + float(i) * 1.0472; vec2 n = vec2(cos(th), sin(th)), tg = vec2(-n.y, n.x); float al2 = dot(p, tg), pe = dot(p, n) - R2 * 0.5; dh = min(dh, length(vec2(pe, al2 - clamp(al2, -0.866 * R2, 0.866 * R2))));
        if (tier > 1.5) { vec2 n2v = rot(n, 0.5236), tg2 = vec2(-n2v.y, n2v.x); float b2 = dot(p, tg2), pe2 = dot(p, n2v) - R2 * 0.5; dh2 = min(dh2, length(vec2(pe2, b2 - clamp(b2, -0.866 * R2, 0.866 * R2)))); } }
      A += lnP(dh, w5 * 1.1, px) * 0.85 + lnP(dh2, w5 * 0.8, px) * 0.5;
      float NS = tier > 0.5 ? 24.0 : 12.0, sc = an * NS / 6.2832 - 0.13 * NS / 6.2832, si = floor(sc + 0.5), sd = abs(sc - si) * 6.2832 / NS * rr, rTop = (tier > 0.5 && mod(si, 2.0) > 0.5) ? R2 * 0.72 : R2;
      A += lnP(sd, w5 * 0.6, px) * 0.5 * smoothstep(0.2, 0.235, rr) * (1.0 - smoothstep(rTop - 0.01, rTop + 0.005, rr)) * lod;
      float ka = floor((an + 1.5708) / 1.0472 + 0.5), ca = ka * 1.0472 - 1.5708; vec2 cp = R2 * vec2(cos(ca), sin(ca)); float dcp = length(p - cp);
      A += lnP(abs(dcp - 0.0375), w5 * 0.9, px) * 0.85; A.x += exp(-sq(dcp / max(0.014, px * 1.3))) * min(1.0, sq(0.014 / max(0.014, px * 1.3))) * 0.95;
      A += lnP(abs(rr - 0.217), w5 * 0.9, px) * 0.7;
      if (tier > 0.5) { float sc2 = fract(an * 40.0 / 6.2832) - 0.5; A += lnP(abs(sc2) * 6.2832 / 40.0 * rr + max(0.0, abs(rr - 0.585) - 0.012), w5 * 0.7, px) * 0.55; A += lnP(abs(rr - 0.4), w5 * 0.8, px) * 0.5 * smoothstep(0.15, 0.4, abs(fract(an * 30.0 / 6.2832) - 0.5)); }
      A *= m; }
    else if (lay < 2.5) { // the central seal (its own quad: units of the seal's half size): a hot core, a pointed quatrefoil, a ring, a hexagon
      vec2 ps = rot(u * 1.3, -Q.y); float d = length(ps), an2 = atan(ps.y, ps.x), e = 0.75, c2 = cos(2.0 * an2), f = 0.625 * pow(abs(c2), e), fp = 0.625 * e * pow(max(abs(c2), 0.02), e - 1.0) * 2.0 * abs(sin(2.0 * an2));
      float dq = abs(d - f) / sqrt(1.0 + sq(fp / max(d, 0.05))); A += lnP(dq, w5 * 2.0, px) * 0.9 * smoothstep(0.12, 0.2, d);
      A += lnP(abs(d - 0.6875), w5 * 2.0, px) * 0.85; float hx = abs(ps.x), hy = abs(ps.y), hexd = max(hx * 0.866 + hy * 0.5, hy) - 0.2; A += lnP(abs(hexd), w5 * 1.6, px) * 0.9;
      L += WHITE * exp(-d * d * 60.0) * 0.95 + ACC * exp(-d * d * 14.0) * 0.6 + EDGE * exp(-d * d * 4.0) * 0.3 + ENERGY * exp(-d * d * 1.6) * 0.18; }
    else { // the glyph band: Q.z = count + seed (fraction), Q.w seconds since it began lighting; R4.z the glyph's half size (circle units)
      float n = floor(Q.z), sd = fract(Q.z), gs = R4.z, rg = 0.71, a01 = fract(an / 6.2832), j = floor(a01 * n), ac = (j + 0.5) / n * 6.2832;
      vec2 lp = rot(p, -ac); vec2 gp = vec2(lp.y, rg - lp.x) * (24.0 / gs);
      float id = floor(h1(vec2(j * 1.37 + sd * 91.0, sd * 17.0)) * 8.0), dt = Q.w - j / n * 0.8, b = clamp(dt / 0.06, 0.0, 1.0) * (0.62 + 0.5 * exp(-max(dt, 0.0) * 6.0) + 0.08 * sin(t * 9.0 + j * 2.1));
      float gw = max(1.0, px * 0.9 * (24.0 / gs)); L += glyphL(glyph(gp, id), gw) * b / gw * (1.0 - smoothstep(0.85, 1.0, length(gp) / 17.0)); }
    float edgeW = 1.0 - smoothstep(0.9, 1.0, r);
    L = (L * 0.8 + EDGE * A.y * 0.85 + mix(ACC, WHITE, 0.25) * A.x * 0.9) * edgeW; }
  else if (k < 4.5) { // the overhead star (quad 3.4 x its radius): Q.x charge, Q.y compression, Q.z ripple (0..1, or < 0), Q.w seed
    gen = false; float d = r * 3.4, an = atan(u.y, u.x), ch = Q.x, cm = Q.y, cr = (0.55 + 0.45 * ch) * (1.0 - 0.35 * cm);
    float nA = fbm3(vec3(cos(an) * 1.6 + Q.w, sin(an) * 1.6, d * 0.8 - t * 0.5)), nB = n3(vec3(cos(an) * 3.6, sin(an) * 3.6 + Q.w, d * 1.5 - t * 0.9));
    float core = exp(-sq(d / (cr * 0.42))), body = exp(-sq(d / (cr * 1.05))), out0 = max(d - cr * 0.75, 0.0);
    float corona = exp(-out0 * (3.0 - 1.4 * nA)) * (0.55 + 0.45 * nA), stream = pow(nA, 2.0) * exp(-out0 * 1.1) * 0.9 + pow(nB, 3.0) * exp(-out0 * 1.8) * 0.6;
    float sp = pow(abs(cos(3.0 * (an - 0.26 + t * 0.03))), 90.0) * exp(-d * 0.75) * smoothstep(0.15, 0.9, d) * 1.1 + pow(abs(cos(2.0 * (an - 0.785))), 160.0) * exp(-d * 1.1) * smoothstep(0.15, 0.9, d) * 0.6;
    float halo = exp(-sq((d - 2.45) / 0.26)) * 0.05; vec3 hc = vec3(exp(-sq((d - 2.52) / 0.22)), exp(-sq((d - 2.45) / 0.22)), exp(-sq((d - 2.38) / 0.22))) * 0.045;
    float rip = Q.z >= 0.0 ? exp(-sq((d - cr * (0.55 + 1.7 * Q.z)) / (0.1 + 0.15 * Q.z))) * sq(1.0 - Q.z) : 0.0;
    float und = exp(-sq(u.x * 3.4 / (cr * 0.95)) - sq((u.y * 3.4 - cr * 0.45) / (cr * 0.42))) * cm;
    L = WHITE * core * 1.1 + ACC * body * 0.5 + EDGE * stream * (0.4 + 0.35 * ch) + ENERGY * corona * 0.5 + mix(ACC, WHITE, 0.4) * sp * (0.3 + 0.5 * ch) + (EDGE * halo + hc * vec3(0.9, 0.7, 1.0)) * ch + mix(ACC, WHITE, 0.4) * rip * 0.9 + mix(ACC, WHITE, 0.6) * und * 1.2;
    L *= (1.0 - smoothstep(0.62, 1.0, r)); }
  else if (k < 5.5) { // the dome shockwave over the floor (quad: 1.15 x its radius across, m = max(zk, gy) of that up and down): Q.x zk, Q.y gy, Q.z shell width, Q.w haze
    gen = false; float m = max(Q.x, Q.y); vec2 e = vec2(u.x * 1.15, u.y * 1.15 * m); float dn = e.y < 0.0 ? length(vec2(e.x, e.y / Q.x)) : length(vec2(e.x, e.y / Q.y));
    float nz = n2(e * 3.0 + vec2(t * 1.5, -t)), sh = exp(-sq((dn - 1.0) / Q.z)) * (0.75 + 0.4 * nz), fr = smoothstep(0.35, 1.0, dn) * (1.0 - smoothstep(0.98, 1.02, dn)) * (0.12 + 0.1 * nz) * Q.w, back = mix(1.0, 0.55, smoothstep(-0.08, 0.12, e.y));
    float win = 1.0 - smoothstep(0.9, 1.0, max(abs(u.x), abs(u.y)));
    if (u_pass < 0.5) { float a = smoothstep(1.02, 0.6, dn) * 0.16 * Q.w * al * win * pk; S = vec4(PLUM * 0.5 * a, a); }
    else L = (mix(EDGE, ACC, 0.6) * sh * 0.75 + EDGE * fr) * back * win; }
  else if (k < 6.5) { // glowing ground cracks (floor quad; uv units of the blast radius x 1.1): Q.x the front (radius), Q.y glow, Q.z seed, Q.w pulse
    gen = false; vec2 g = u * 1.1; float rr = length(g), an = atan(g.y, g.x), fr = Q.x, sd = Q.z;
    float N = 9.0, cc0 = an * N / 6.2832 + sd * 3.0, ci0 = floor(cc0 + 0.5), x1 = rr * 7.0 + ci0 * 3.7, x2 = rr * 17.0 + ci0 * 1.3;
    float wob = (mix(h1(vec2(floor(x1), ci0 + sd)), h1(vec2(floor(x1) + 1.0, ci0 + sd)), fract(x1)) - 0.5) * 0.7 + (mix(h1(vec2(floor(x2), ci0 * 2.0 + sd)), h1(vec2(floor(x2) + 1.0, ci0 * 2.0 + sd)), fract(x2)) - 0.5) * 0.22, cc = cc0 + wob * smoothstep(0.0, 0.3, rr);   /* (a piecewise-straight wander: cracks, not lightning) */
    float ci = floor(cc + 0.5), dr = abs(cc - ci) * 6.2832 / N * rr, len = 0.45 + 0.45 * h1(vec2(ci, sd)), lm = 1.0 - smoothstep(len * 0.75, len, rr);
    float br = n2(vec2(an * 5.0 + sd, rr * 9.0)), web = abs(br - 0.5) * 0.12 * rr;   /* (a finer branching web near the middle) */
    vec2 Ad = lnI(dr, 0.005 + 0.003 * rr) * lm * smoothstep(0.06, 0.2, rr) + lnI(web, 0.008) * 0.55 * (1.0 - smoothstep(0.15, 0.6, rr)) * smoothstep(0.05, 0.15, rr);
    float reveal = 1.0 - smoothstep(fr - 0.05, fr + 0.02, rr), glow = Q.y * (0.8 + 0.2 * sin(t * 6.0 + rr * 10.0) * Q.w) * (1.0 - smoothstep(0.5, 1.05, rr));
    L = (mix(ACC, WHITE, 0.3) * Ad.x * 0.8 + EDGE * Ad.y * 0.45) * reveal * glow + ENERGY * 0.2 * exp(-rr * rr * 4.0) * Q.y * reveal;
    L *= 1.0 - smoothstep(0.88, 1.0, r); }
  else if (k < 7.5) { // the column and the mushroom crown (both passes): e in tiles from the ground point, zz the height; Q = (half w, half h, centre height, seconds since the blast) tiles; R4 = (cap height, cap ring radius, cap tube radius, column half-width)
    gen = false; float bt = Q.w, ex = u.x * Q.x, zz = Q.z - u.y * Q.y, hc = R4.x, Rr = R4.y, rt = R4.z, wb = R4.w, late = clamp((bt - 1.1) / 2.8, 0.0, 1.0);
    float nn = fbm(vec2(ex * 1.15, zz * 1.15 - bt * 0.7) + 4.0), nl = fbm(vec2(ex * 1.15 + 0.16, zz * 1.15 - bt * 0.7 + 0.2) + 4.0), lit = clamp((nn - nl) * 5.0 + 0.45, 0.0, 1.0);
    float zv = clamp(zz / max(hc, 0.1), 0.0, 1.2), n2c = fbm(vec2(ex * 2.4, zz * 1.9 - bt * 1.1) + 9.0), cw = wb * 1.6 * (1.15 - 0.42 * sin(3.14159 * min(zv, 1.0) * 0.85)) * (0.78 + 0.5 * n2c) * (1.0 + 0.7 * smoothstep(0.7, 0.0, zz)), sw = 0.18 * wb * sin(zz * 1.3 + bt * 1.2);
    float colD = (1.0 - smoothstep(cw * 0.3, cw, abs(ex - sw))) * smoothstep(-0.5, 0.2, zz) * (1.0 - smoothstep(hc - rt * 0.1, hc + rt * 0.45, zz));
    vec2 tq = vec2(abs(ex) - Rr, (zz - hc) / 0.7); float td = length(tq) / max(rt, 0.05), ps = atan(tq.y, tq.x) - bt * 1.3;
    float rl = fbm3(vec3(cos(ps) * td * 1.6, sin(ps) * td * 1.6, ex * 0.6 + bt * 0.1)), tor = 1.0 - smoothstep(0.55, 1.08, td + (rl - 0.5) * 0.6);
    float dm = length(vec2(ex / (Rr + rt * 0.75), (zz - hc - rt * 0.15) / (rt * 1.15))), dome = (1.0 - smoothstep(0.55, 1.05, dm + (nn - 0.5) * 0.4)) * smoothstep(hc - rt * 0.6, hc + rt * 0.2, zz);
    float rb = wb * (1.6 + 2.6 * (1.0 - exp(-bt * 1.6)) + 1.2 * late), th = wb * (0.85 + 0.3 * late), el = length(vec2(ex / rb, (zz - th * 0.45) / (rb * u_gy + th * 0.6))), sk = (1.0 - smoothstep(0.6, 1.05, el + (n2c - 0.5) * 0.55)) * (0.3 + 0.7 * smoothstep(0.05, 0.8, el)) * (0.55 + 0.55 * nn) * (1.0 - 0.45 * late);
    float D = max(max(colD * (0.6 + 0.55 * n2c), tor * (0.6 + 0.5 * rl)), max(dome * (0.55 + 0.55 * nn), sk * 0.85)) * smoothstep(0.0, 0.12, bt);
    float win = (1.0 - smoothstep(0.86, 1.0, abs(u.x))) * (1.0 - smoothstep(0.86, 1.0, abs(u.y)));
    if (u_pass < 0.5) { vec3 sc = mix(vec3(0.07, 0.03, 0.12), vec3(0.46, 0.35, 0.6), lit * 0.65 * smoothstep(-0.2, 0.6, (zz - hc) / max(rt, 0.1) + 0.3) + 0.08 * tor) * (0.75 + 0.5 * nn);
      float a = clamp(D * 1.08, 0.0, 1.0) * al * win * pk; S = vec4(sc * a, a); }
    else { float under = max(max(tor, dome) * smoothstep(0.35, -0.9, (zz - hc) / max(rt, 0.1)) * (1.0 - smoothstep(0.9, 1.25, td)), colD * exp(-sq((ex - sw) / (cw * 0.42))) * 0.75);
      float heat = exp(-bt * 1.1), gp = 0.75 + 0.25 * sin(bt * 6.0 + nn * 4.0);
      float fbR = 0.38 * Rr * (1.0 - pow(1.0 - min(bt / 0.3, 1.0), 3.0)) + 0.4, fbZ = 0.5 + hc * 0.55 * smoothstep(0.05, 1.3, bt); vec2 fq = vec2(ex, (zz - fbZ) * 1.1) / fbR; float fd = length(fq), fire = (1.0 - smoothstep(0.25, 1.0, fd + (fbm(fq * 2.1 + bt * 1.8) - 0.5) * 0.7)) * (1.0 - smoothstep(0.7, 2.2, bt));
      float rimT = smoothstep(0.55, 0.95, td) * (1.0 - smoothstep(0.95, 1.2, td)) * tor;
      vec3 em = mix(EDGE, ACC, 0.3 + 0.5 * heat) * under * (1.0 + 0.9 * heat) * gp * (1.0 - 0.45 * late) + mix(EDGE, mix(ACC, WHITE, 0.4), heat) * fire * (0.35 + 0.9 * heat) + ENERGY * 0.5 * D * gp * (1.0 - late * 0.55) * (0.6 + 0.6 * nn) + EDGE * rimT * (0.8 - 0.45 * late) * gp + ACC * colD * exp(-sq((ex - sw) / (cw * 0.22))) * 0.3 * (1.0 - late) + EDGE * sk * smoothstep(0.9, 0.3, el) * 0.22 * (0.4 + heat) * gp;
      L = em * win * (1.0 - 0.45 * clamp(D - under, 0.0, 1.0)); } }
  else if (k < 9.5) { // one glyph (lifting off and coming apart): Q.x its kind, Q.y dissolve 0..1, Q.z line width (glyph units)
    gen = false; vec2 gp = u * 17.0; float dz = Q.y, nz = n2(gp * 0.45 + Q.x * 7.0 + t * 0.5), d = glyph(gp, Q.x) + dz * 6.0 * nz;
    L = glyphL(d, Q.z * (1.0 + dz * 1.6)) * (1.0 - dz * 0.7) * smoothstep(dz * 1.05 - 0.05, dz * 1.05 + 0.15, nz + 0.2) * (1.0 - smoothstep(0.8, 1.0, r)); }
  else if (k < 10.5) { // shade: a soft dark disc (Q.x how flat its middle is)
    s = (1.0 - smoothstep(Q.x, 1.0, r)) * (1.0 - smoothstep(0.75, 1.0, r) * 0.0); s = s * s * (3.0 - 2.0 * s); }
  else if (k < 14.5) { // a puff of smoke: billowing, darker below, its top lit faintly (Q.y seed, Q.x roll)
    float f = fbm(u * 1.7 + vec2(Q.y * 3.1, Q.y - t * 0.25 + Q.x)), d = clamp((1.0 - r * r) * (0.5 + 0.95 * f) - 0.22, 0.0, 1.0) * (1.0 - smoothstep(0.8, 1.0, r));
    s = smoothstep(0.0, 0.55, d); col = mix(col * 0.55, col * 1.25 + vec3(0.04, 0.03, 0.06), smoothstep(-0.6, 0.6, -u.y + (f - 0.5))); }
  else if (k < 15.5) { // the distortion (solid pass, first): the frame drawn so far, refracted round a front (Q.x radius, Q.y width, uv units) and shimmering in a haze (Q.w); Q.z strength (GL px)
    gen = false; vec2 dir = r > 0.001 ? u / r : vec2(0.0); float d = (r - Q.x) / Q.y, lens = d * exp(-d * d), hz = Q.w * (1.0 - smoothstep(0.2, 0.75, r));
    vec2 hn = vec2(fbm(u * 5.0 + vec2(0.0, -t * 2.2)), fbm(u * 5.0 + vec2(4.3, -t * 2.0))) - 0.5, off = dir * lens * Q.z + hn * hz * Q.z * 0.9;
    float ol = length(off), mk = clamp(ol / 1.2, 0.0, 1.0) * (1.0 - smoothstep(0.85, 1.0, r)) * al;
    vec3 c = texture2D(u_tex, (v_px + off) / u_res).rgb; S = vec4(c * mk, mk); }
  else if (k < 16.5) { // an obsidian shard: a faceted kite pointing +x (Q.x its turn, Q.y a GL px in uv), black glass with a violet rim
    gen = false; vec2 p = rot(u, -Q.x); float px = Q.y;
    float e1 = dot(p - vec2(0.95, 0.0), normalize(vec2(0.4, 0.85))), e2 = dot(p - vec2(0.95, 0.0), normalize(vec2(0.4, -0.85))), e3 = dot(p - vec2(-0.6, 0.0), normalize(vec2(-0.45, 0.7))), e4 = dot(p - vec2(-0.6, 0.0), normalize(vec2(-0.45, -0.7)));
    float dd = max(max(e1, e2), max(e3, e4)), a = 1.0 - smoothstep(-px, px, dd), rim = 1.0 - smoothstep(px * 0.5, px * 3.5, -dd), top = smoothstep(-px, px, -p.y);
    vec3 c = mix(vec3(0.04, 0.025, 0.07), vec3(0.2, 0.15, 0.3), top * 0.8) + EDGE * rim * 0.65 * Q.z;
    if (u_pass > 0.5) L = EDGE * rim * a * 0.35 * Q.z; a *= al * pk; S = vec4(min(c, vec3(1.0)) * a, a); }
  if (gen) { if (u_pass < 0.5) { float a = clamp(s * al * pk, 0.0, 1.0); S = vec4(col * a, a); } else if (L == vec3(0.0)) L = col * s; }
  if (u_pass < 0.5) { S.rgb = min(S.rgb, vec3(S.a)); gl_FragColor = S; }
  else { L *= al * pk; L = min(L, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }
}`;
  /* the particles: point sprites. a_s = (size px, type 0 a soft dot · 1 a streak along ang · 2 a shard turned by ang, ang, stretch) */
  const VSP = `attribute vec2 a_p; attribute vec4 a_c, a_s; uniform vec2 u_res; uniform float u_maxps; varying vec4 v_c, v_s;
void main(){ gl_Position = vec4(a_p.x / u_res.x * 2.0 - 1.0, 1.0 - a_p.y / u_res.y * 2.0, 0.0, 1.0); gl_PointSize = clamp(a_s.x, 1.0, u_maxps); v_c = a_c; v_s = vec4(min(a_s.x, u_maxps), a_s.yzw); }`;
  const FSP = HDR + `uniform float u_pass; varying vec4 v_c, v_s;
void main(){ vec2 d = (gl_PointCoord - 0.5) * 2.0; float c = cos(v_s.z), s = sin(v_s.z); vec2 q = vec2(c * d.x + s * d.y, -s * d.x + c * d.y); float ty = v_s.y, sh = 0.0; vec3 col = v_c.rgb;
  if (ty < 0.5) sh = exp(-dot(q, q) * 4.5) * (1.0 - smoothstep(0.6, 1.0, length(q)));
  else if (ty < 1.5) { vec2 e = vec2(q.x, q.y * v_s.w); sh = exp(-dot(e, e) * 3.6) * (1.0 - smoothstep(0.6, 1.0, length(e))) * (0.55 + 0.45 * smoothstep(-1.0, 0.8, q.x)); col = mix(col, vec3(1.0), 0.45 * exp(-dot(e, e) * 14.0)); }
  else { float px = 2.6 / max(v_s.x, 2.0); vec2 p = q * 1.08;
    float e1 = dot(p - vec2(0.95, 0.0), normalize(vec2(0.4, 0.85))), e2 = dot(p - vec2(0.95, 0.0), normalize(vec2(0.4, -0.85))), e3 = dot(p - vec2(-0.6, 0.0), normalize(vec2(-0.45, 0.7))), e4 = dot(p - vec2(-0.6, 0.0), normalize(vec2(-0.45, -0.7)));
    float dd = max(max(e1, e2), max(e3, e4)); sh = 1.0 - smoothstep(-px, px, dd); float rim = 1.0 - smoothstep(px * 0.5, px * 3.0, -dd), top = smoothstep(-px, px, -p.y);
    col = mix(vec3(0.035, 0.02, 0.065), vec3(0.22, 0.16, 0.32), top * 0.75) + vec3(0.647, 0.361, 1.0) * rim * 0.6 * v_s.w; }
  float a = clamp(sh * v_c.a, 0.0, 1.0);
  if (u_pass < 0.5) gl_FragColor = vec4(min(col, vec3(1.0)) * a, a); else { vec3 L = min(col * a, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); } }`;
  let cv = null, gl = null, PR = null, PP = null, bq = null, bp = null, tex = null, snap = null, ok = null, soft = false, info = '', why = '', lostAt = 0, fails = 0, maxPS = 64, noSnap = false;
  const stats = { frames: 0, draws: 0, quads: 0, smoke: 0, pts: 0, W: 0, H: 0, snaps: 0 };
  const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const n = parseInt(String(h || '#FFFFFF').slice(1, 7), 16) || 0; v = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; RGB.set(h, v); } return v; };
  function prog(vs, fs, attrs) { const sh = (ty, src) => { const q = gl.createShader(ty); gl.shaderSource(q, src); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(q)); return q; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    const U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const q = gl.getActiveUniform(p, i); U[q.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, q.name); } return { p, U }; }
  function build() { if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; lostAt = performance.now(); }); cv.addEventListener('webglcontextrestored', () => { ok = null; PR = PP = null; }); }
    const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false }; gl = gl || cv.getContext('webgl2', o) || cv.getContext('webgl', o); if (!gl) { why = 'no WebGL'; return false; }
    try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; } soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
    PR = prog(VS, FS, ['a_p', 'a_uv', 'a_k', 'a_c', 'a_q', 'a_r']); PP = prog(VSP, FSP, ['a_p', 'a_c', 'a_s']); bq = gl.createBuffer(); bp = gl.createBuffer();
    try { const rg = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); maxPS = Math.max(16, Math.min(96, rg ? rg[1] : 64)); } catch (e) { maxPS = 64; }
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return true; }
  const flag = () => { try { return typeof window !== 'undefined' ? window.__ANN_GL : null; } catch (e) { return null; } };
  function usable() { const f = flag(); if (f === 0) return false;
    if (ok === false && why === 'context lost' && performance.now() - lostAt > 1500) { cv = null; gl = null; PR = PP = null; ok = null; why = ''; }
    if (ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Annihilation GFX: ' + why); } catch (e2) {} } }
    return !!ok && (!soft || f === 1); }
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const NF = 17, QV = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]];
  const Q = { lit: new Float32Array(NF * 6 * 400), nl: 0, smk: new Float32Array(NF * 6 * 160), ns: 0, plit: new Float32Array(10 * 1500), npl: 0, psmk: new Float32Array(10 * 600), nps: 0,
    a: 1, b: 0, c0: 0, d: 1, e: 0, f: 0, k: 1, t: 0, W: 0, Hh: 0, pet: [0, 0, 0], snap: false, low: false,
    X(x, y) { return this.a * x + this.c0 * y + this.e; }, Y(x, y) { return this.b * x + this.d * y + this.f; },
    _room(solid, nv) { const ka = solid ? 'smk' : 'lit', kn = solid ? 'ns' : 'nl'; let A = this[ka]; if ((this[kn] + nv) * NF > A.length) { const q = new Float32Array(Math.max(A.length * 2, (this[kn] + nv) * NF)); q.set(A); A = q; this[ka] = q; } return A; },
    _v(A, o, x, y, su, sv, kind, C, al, q, r) { A[o] = x; A[o + 1] = y; A[o + 2] = su; A[o + 3] = sv; A[o + 4] = kind; A[o + 5] = C[0]; A[o + 6] = C[1]; A[o + 7] = C[2]; A[o + 8] = al;
      A[o + 9] = q[0] || 0; A[o + 10] = q[1] || 0; A[o + 11] = q[2] || 0; A[o + 12] = q[3] || 0; A[o + 13] = r[0] || 0; A[o + 14] = r[1] || 0; A[o + 15] = r[2] || 0; A[o + 16] = r[3] || 0; },
    /* one quad: centre (x, y) in the game canvas's coordinates, half axes (ux, uy) and (vx, vy); solid: the left (laid over) half */
    quad(kind, x, y, ux, uy, vx, vy, col, al, q, r, solid) { if (!(al > 0.003)) return; const A = this._room(solid, 6), kn = solid ? 'ns' : 'nl', C = rgbOf(col), cx = this.X(x, y), cy = this.Y(x, y), a = this.a, b = this.b, c = this.c0, d = this.d;
      const Ux = a * ux + c * uy, Uy = b * ux + d * uy, Vx = a * vx + c * vy, Vy = b * vx + d * vy; q = q || Z4; r = r || Z4; let o = this[kn] * NF; al = al > 1 ? 1 : al;
      for (let j = 0; j < 6; j++) { const su = QV[j][0], sv = QV[j][1]; this._v(A, o, cx + Ux * su + Vx * sv, cy + Uy * su + Vy * sv, su, sv, kind, C, al, q, r); o += NF; } this[kn] += 6; },
    glow(x, y, r, col, a, sy, core, tail, white, prot) { if (r > 0.5) this.quad(0, x, y, r, 0, 0, r * (sy || 1), col, a, [core || 4, tail == null ? 0.6 : tail, white || 0, 0], [0, 0, 0, prot == null ? 1 : prot]); },
    shade(x, y, rx, ry, col, a, flat) { if (rx > 0.5) this.quad(10, x, y, rx, 0, 0, ry || rx, col, a, [flat == null ? 0.25 : flat, 0, 0, 0], [0, 0, 0, 0], true); },
    /* a ribbon through points P ([x, y, half width, alpha] in canvas coords), uv.y the arc length 0..1 along it */
    strip(P, col, al, q, r, solid) { const n = P.length; if (n < 2 || !(al > 0.003)) return; const kn = solid ? 'ns' : 'nl', A = this._room(solid, (n - 1) * 6), C = rgbOf(col); q = q || Z4; r = r || Z4;
      const sx = this._sx || (this._sx = []), sy = this._sy || (this._sy = []), nx = this._nx || (this._nx = []), ny = this._ny || (this._ny = []), ln = this._ln || (this._ln = []); let tot = 0;
      for (let i = 0; i < n; i++) { sx[i] = this.X(P[i][0], P[i][1]); sy[i] = this.Y(P[i][0], P[i][1]); if (i) tot += Math.hypot(sx[i] - sx[i - 1], sy[i] - sy[i - 1]); ln[i] = tot; }
      if (tot < 0.5) return;
      for (let i = 0; i < n; i++) { const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1); let dx = sx[i1] - sx[i0], dy = sy[i1] - sy[i0]; const l = Math.hypot(dx, dy) || 1; nx[i] = -dy / l; ny[i] = dx / l; }
      let o = this[kn] * NF; const kk = this.k;
      for (let i = 0; i < n - 1; i++) { const w0 = P[i][2] * kk, w1 = P[i + 1][2] * kk, a0 = Math.min(1, al * (P[i][3] == null ? 1 : P[i][3])), a1 = Math.min(1, al * (P[i + 1][3] == null ? 1 : P[i + 1][3])), u0 = ln[i] / tot, u1 = ln[i + 1] / tot;
        const V = [[sx[i] - nx[i] * w0, sy[i] - ny[i] * w0, -1, u0, a0], [sx[i + 1] - nx[i + 1] * w1, sy[i + 1] - ny[i + 1] * w1, -1, u1, a1], [sx[i] + nx[i] * w0, sy[i] + ny[i] * w0, 1, u0, a0], [sx[i] + nx[i] * w0, sy[i] + ny[i] * w0, 1, u0, a0], [sx[i + 1] - nx[i + 1] * w1, sy[i + 1] - ny[i + 1] * w1, -1, u1, a1], [sx[i + 1] + nx[i + 1] * w1, sy[i + 1] + ny[i + 1] * w1, 1, u1, a1]];
        for (const v of V) { this._v(A, o, v[0], v[1], v[2], v[3], 1, C, v[4], q, r); o += NF; } }
      this[kn] += (n - 1) * 6; },
    /* a particle: (x, y) canvas coords, size (canvas px across), type 0 dot · 1 streak (ang, stretch) · 2 shard (ang, rim) */
    pt(x, y, size, col, a, type, ang, str, solid) { if (!(a > 0.004)) return; const ka = solid ? 'psmk' : 'plit', kn = solid ? 'nps' : 'npl'; let A = this[ka]; if ((this[kn] + 1) * 10 > A.length) { const q = new Float32Array(A.length * 2); q.set(A); A = q; this[ka] = q; }
      const C = rgbOf(col), o = this[kn] * 10; A[o] = this.X(x, y); A[o + 1] = this.Y(x, y); A[o + 2] = C[0]; A[o + 3] = C[1]; A[o + 4] = C[2]; A[o + 5] = a > 1 ? 1 : a; A[o + 6] = size * this.k; A[o + 7] = type || 0; A[o + 8] = (ang || 0) + Math.atan2(this.b, this.a); A[o + 9] = str || 1; this[kn]++; } };
  const Z4 = [0, 0, 0, 0];
  /* begin a layer on the game canvas c (its transform is the camera); pet: [x, y, tile] in canvas coords, to keep its face clear */
  function begin(c, pet, t) { const B = c.getTransform(), cv0 = c.canvas, L = LOW(), k0 = Math.min(L ? 0.5 : 1, 1600 / Math.max(cv0.width, cv0.height));   /* (fine runes want the full resolution: 1600 px on the long side at most) */ Q.W = Math.max(8, Math.round(cv0.width * k0)); Q.Hh = Math.max(8, Math.round(cv0.height * k0)); const kx = Q.W / cv0.width;
    Q.a = B.a * kx; Q.b = B.b * kx; Q.c0 = B.c * kx; Q.d = B.d * kx; Q.e = B.e * kx; Q.f = B.f * kx; Q.k = (Math.sqrt(Math.abs(B.a * B.d - B.b * B.c)) || 1) * kx; Q.nl = Q.ns = Q.npl = Q.nps = 0; Q.t = (t || 0) % 1000; Q.snap = false; Q.low = L;
    if (pet) { Q.pet[0] = Q.X(pet[0], pet[1]); Q.pet[1] = Q.Y(pet[0], pet[1]); Q.pet[2] = pet[2] * Q.k; } else Q.pet[2] = 0; return Q; }
  /* draw the layer into c: the GL canvas rendered, then its halves laid over and added */
  function flush(c, gy) { if (!Q.nl && !Q.ns && !Q.npl && !Q.nps) return true; if (!usable()) return false;
    try { const W = Q.W, Hh = Q.Hh, cv0 = c.canvas; if (cv.width !== W * 2 + 4 || cv.height !== Hh) { cv.width = W * 2 + 4; cv.height = Hh; }
      if (Q.snap && !noSnap) { try { if (!snap) snap = document.createElement('canvas'); if (snap.width !== W || snap.height !== Hh) { snap.width = W; snap.height = Hh; } const sc = snap.getContext('2d'); sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = 'copy'; sc.drawImage(cv0, 0, 0, W, Hh);
        gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snap); stats.snaps++; } catch (e) { noSnap = true; } }
      gl.viewport(0, 0, cv.width, Hh); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST); let draws = 0;
      const quads = (A, n, pass) => { if (!n) return; gl.useProgram(PR.p); const U = PR.U; gl.uniform2f(U.u_res, W, Hh); gl.uniform1f(U.u_t, Q.t); gl.uniform1f(U.u_pass, pass); gl.uniform1f(U.u_gy, gy || 0.55); gl.uniform3f(U.u_pet, Q.pet[0], Q.pet[1], Q.pet[2]); gl.uniform1i(U.u_oct, Q.low ? 3 : 5); gl.uniform1i(U.u_tex, 0);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.bindBuffer(gl.ARRAY_BUFFER, bq); gl.bufferData(gl.ARRAY_BUFFER, A.subarray(0, n * NF), gl.DYNAMIC_DRAW);
        const at = (i, m, off) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, m, gl.FLOAT, false, NF * 4, off * 4); }; at(0, 2, 0); at(1, 2, 2); at(2, 1, 4); at(3, 4, 5); at(4, 4, 9); at(5, 4, 13); gl.drawArrays(gl.TRIANGLES, 0, n); draws++; for (let i = 3; i < 6; i++) gl.disableVertexAttribArray(i); };
      const pts = (A, n, pass) => { if (!n) return; gl.useProgram(PP.p); const U = PP.U; gl.uniform2f(U.u_res, W, Hh); gl.uniform1f(U.u_pass, pass); gl.uniform1f(U.u_maxps, maxPS); gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferData(gl.ARRAY_BUFFER, A.subarray(0, n * 10), gl.DYNAMIC_DRAW);
        const at = (i, m, off) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, m, gl.FLOAT, false, 40, off * 4); }; at(0, 2, 0); at(1, 4, 2); at(2, 4, 6); gl.drawArrays(gl.POINTS, 0, n); draws++; gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); };
      gl.viewport(0, 0, W, Hh); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); quads(Q.smk, Q.ns, 0); pts(Q.psmk, Q.nps, 0);
      gl.viewport(W + 4, 0, W, Hh); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR); quads(Q.lit, Q.nl, 1); pts(Q.plit, Q.npl, 1);
      if (typeof window !== 'undefined' && window.__ANN_CHECK) api.lastCheck = check();
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      if (Q.ns || Q.nps) { c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, W, Hh, 0, 0, cv0.width, cv0.height); }
      if (Q.nl || Q.npl) { c.globalCompositeOperation = 'lighter'; c.drawImage(cv, W + 4, 0, W, Hh, 0, 0, cv0.width, cv0.height); }
      c.restore(); stats.frames++; stats.draws = draws; stats.quads = Q.nl / 6; stats.smoke = Q.ns / 6; stats.pts = Q.npl + Q.nps; stats.W = W; stats.H = Hh; fails = 0; return true;
    } catch (e) { why = String(e && e.message || e); if (++fails >= 3 || (gl && gl.isContextLost && gl.isContextLost())) { ok = false; if (gl && gl.isContextLost && gl.isContextLost()) { why = 'context lost'; lostAt = performance.now(); } } return false; } }
  /* (tests) pixels breaking rgb <= a in the last frame */
  function check() { if (!gl) return null; const W = cv.width, Hh = cv.height, px = new Uint8Array(W * Hh * 4); gl.readPixels(0, 0, W, Hh, gl.RGBA, gl.UNSIGNED_BYTE, px); let bad = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3]; if (a) lit++; if (px[i] > a + 1 || px[i + 1] > a + 1 || px[i + 2] > a + 1) bad++; } return { bad, lit }; }
  const api = { usable, begin, flush, check, stats, lastCheck: null, info: () => ({ ok, soft, renderer: info, why, maxPS, noSnap }) };
  return api;
})();

(() => {
  const U = ELEM_IMPL.dark.ult; delete U.abyssorrery;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF', WHITE = '#FFFFFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  let H, GY = 0.55;
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), X - r, Y - r * GY, r * 2, r * 2 * GY); c.restore(); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }
  /* how much a thing drawn at screen (sx, sy) of radius rad px fades near the pet: a smooth dip, never a hole */
  function petDist(sx, sy, T, rad) { const px = H.sx(H.me.x), py = H.sy(H.me.y) - T * 0.45; return Math.max(0, Math.hypot(sx - px, sy - py) - (rad || 0)); }
  const dimAt = (sx, sy, T, rad) => 0.18 + 0.82 * sstep(T * 0.45, T * 1.7, petDist(sx, sy, T, rad));
  function segD(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, u = L > 0 ? cl(((px - ax) * dx + (py - ay) * dy) / L) : 0; return Math.hypot(px - ax - dx * u, py - ay - dy * u); }
  const dimSeg = (ax, ay, bx, by, T, w) => { const px = H.sx(H.me.x), py = H.sy(H.me.y) - T * 0.45; return 0.18 + 0.82 * sstep(T * 0.45, T * 1.7, segD(px, py, ax, ay, bx, by) - (w || 0)); };

  /* ================= cached pictures ================= */
  // a stroke with its glow baked in: a wide faint energy band, a mid violet one, the bright line
  function gs(g, w, col, a, gw) { g.strokeStyle = rgba(ENERGY, a * 0.22); g.lineWidth = w * (gw || 4.5); g.stroke(); g.strokeStyle = rgba(EDGE, a * 0.35); g.lineWidth = w * 2.2; g.stroke(); g.strokeStyle = rgba(col, a); g.lineWidth = w; g.stroke(); }
  const pol = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
  function ringP(g, r) { g.beginPath(); g.arc(0, 0, r, 0, TAU); }
  /* the outer layer of a circle, seen from above (Rr = 240 in a 512 box is the circle's radius): a soft violet wash
     strongest at the rim, a heavy double ring with ticks between, a gothic arcade of pointed arches inside it; more
     rings, dots and crosses with the tier */
  const outerSpr = tier => fxSprite('da8outer' + tier, 512, 512, (g, w) => {
    const c0 = w / 2, Rr = 240; g.translate(c0, c0); g.lineCap = 'round'; g.lineJoin = 'round';
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, Rr + 14); [[0, rgba(ENERGY, 0.04)], [0.6, rgba(ENERGY, 0.07)], [0.86, rgba(ENERGY, 0.2)], [0.95, rgba(EDGE, 0.16)], [1, rgba(ENERGY, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w);
    ringP(g, Rr - 6); gs(g, 4, EDGE, 0.95); ringP(g, Rr - 20); gs(g, 1.6, EDGE, 0.7);
    g.beginPath(); for (let k = 0; k < 96; k++) { const a = k / 96 * TAU, L = k % 8 === 0 ? 11 : 5; g.moveTo(...pol(Rr - 8, a)); g.lineTo(...pol(Rr - 8 - L, a)); } gs(g, 1.2, ACC, 0.75, 3);
    const NA = 16 + tier * 4, ra = Rr - 24, rb = Rr - 50;
    g.beginPath(); for (let k = 0; k < NA; k++) { const a0 = k / NA * TAU, a1 = (k + 1) / NA * TAU, am = (a0 + a1) / 2, rm = rb + (ra - rb) * 0.45; g.moveTo(...pol(ra, a0)); g.quadraticCurveTo(...pol(rm, a0 + (am - a0) * 0.12), ...pol(rb, am)); g.quadraticCurveTo(...pol(rm, a1 - (a1 - am) * 0.12), ...pol(ra, a1)); } gs(g, 1.4, EDGE, 0.7);
    g.beginPath(); for (let k = 0; k < NA; k++) { const am = (k + 0.5) / NA * TAU, p = pol(ra - 9, am); g.moveTo(p[0] + 2.4, p[1]); g.arc(p[0], p[1], 2.4, 0, TAU); } g.fillStyle = rgba(ACC, 0.85); g.fill();
    ringP(g, rb - 4); gs(g, 1.2, EDGE, 0.55);
    if (tier >= 1) { g.setLineDash([3, 9]); ringP(g, rb - 14); gs(g, 1.6, ACC, 0.6, 3); g.setLineDash([]); g.beginPath(); for (let k = 0; k < NA; k++) { const a = k / NA * TAU, p = pol(rb - 26, a); g.moveTo(p[0], p[1] - 5); g.lineTo(p[0] + 4, p[1]); g.lineTo(p[0], p[1] + 5); g.lineTo(p[0] - 4, p[1]); g.closePath(); } gs(g, 1, EDGE, 0.6, 3); }
    if (tier >= 2) { ringP(g, Rr + 4); gs(g, 1, ACC, 0.5, 3); g.beginPath(); for (let k = 0; k < 24; k++) { const a = (k + 0.5) / 24 * TAU, p = pol(Rr - 13, a); g.moveTo(p[0] - 3, p[1]); g.lineTo(p[0] + 3, p[1]); g.moveTo(p[0], p[1] - 3); g.lineTo(p[0], p[1] + 3); } gs(g, 1, WHITE, 0.6, 3); }
  });
  /* the inner layer (the same scale): a ring pair, a hexagram (a second at Celestial), fine spokes from the seal to the
     ring, small rings at the star's points, dashes of script between the rings from Adept */
  const innerSpr = tier => fxSprite('da8inner' + tier, 512, 512, (g, w) => {
    const c0 = w / 2, r1 = 150, r2 = 134, rs = 46; g.translate(c0, c0); g.lineCap = 'round'; g.lineJoin = 'round';
    ringP(g, r1); gs(g, 2.6, EDGE, 0.9); ringP(g, r2); gs(g, 1.2, EDGE, 0.6);
    const star = (off, col, lw, a) => { g.beginPath(); for (let s = 0; s < 2; s++) { for (let k = 0; k < 3; k++) { const p = pol(r2, off + s * Math.PI / 3 + k * TAU / 3 - Math.PI / 2); k ? g.lineTo(...p) : g.moveTo(...p); } g.closePath(); } gs(g, lw, col, a); };
    star(0, EDGE, 1.6, 0.85); if (tier >= 2) star(Math.PI / 6, ACC, 1, 0.55);
    const NS = tier >= 1 ? 24 : 12; g.beginPath(); for (let k = 0; k < NS; k++) { const a = k / NS * TAU + 0.13, r0 = rs + 4, rr = k % 2 && tier >= 1 ? r2 * 0.72 : r2; g.moveTo(...pol(r0, a)); g.lineTo(...pol(rr, a)); } gs(g, 0.8, ACC, 0.5, 3.5);
    g.beginPath(); for (let k = 0; k < 6; k++) { const p = pol(r2, k * TAU / 6 - Math.PI / 2); g.moveTo(p[0] + 9, p[1]); g.arc(p[0], p[1], 9, 0, TAU); } gs(g, 1.3, EDGE, 0.85);
    g.beginPath(); for (let k = 0; k < 6; k++) { const p = pol(r2, k * TAU / 6 - Math.PI / 2); g.moveTo(p[0] + 3, p[1]); g.arc(p[0], p[1], 3, 0, TAU); } g.fillStyle = rgba(ACC, 0.95); g.fill();
    ringP(g, rs + 6); gs(g, 1.4, EDGE, 0.7);
    if (tier >= 1) { g.beginPath(); for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, d = (k * 7) % 3; g.moveTo(...pol(r2 + 4, a)); g.lineTo(...pol(r2 + 8 + d * 2, a + 0.03)); } gs(g, 1, ACC, 0.6, 3); g.setLineDash([2, 6]); ringP(g, 96); gs(g, 1.2, EDGE, 0.55, 3); g.setLineDash([]); }
  });
  /* the central seal: a hot core, a pointed quatrefoil, a ring, a small hexagon (r 44 in a 128 box) */
  const sealSpr = () => fxSprite('da8seal', 128, 128, (g, w) => {
    const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round'; g.lineJoin = 'round';
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 62); [[0, 'rgba(255,255,255,0.95)'], [0.1, rgba(ACC, 0.9)], [0.28, rgba(EDGE, 0.5)], [0.6, rgba(ENERGY, 0.18)], [1, rgba(ENERGY, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w);
    g.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, b = a + Math.PI / 4; g.moveTo(...pol(10, a - Math.PI / 4)); g.quadraticCurveTo(...pol(30, a - 0.3), ...pol(40, a)); g.quadraticCurveTo(...pol(30, a + 0.3), ...pol(10, b)); } gs(g, 1.4, ACC, 0.9, 3.5);
    ringP(g, 44); gs(g, 1.4, EDGE, 0.85, 3); g.beginPath(); for (let k = 0; k < 6; k++) { const p = pol(13, k * TAU / 6); k ? g.lineTo(...p) : g.moveTo(...p); } g.closePath(); gs(g, 1, WHITE, 0.9, 3);
  });
  /* eight gothic glyphs (48 px): pointed arch, barred triangle, crescent, fork, hooked cross, vesica, chevrons, orb */
  const GLYPHS = [
    g => { g.moveTo(-8, 10); g.quadraticCurveTo(-8, -6, 0, -13); g.quadraticCurveTo(8, -6, 8, 10); g.moveTo(0, -5); g.lineTo(0, 10); },
    g => { g.moveTo(-9, -8); g.lineTo(9, -8); g.lineTo(0, 11); g.closePath(); g.moveTo(-5, -1); g.lineTo(5, -1); },
    g => { g.arc(1, 0, 9, 0.7, TAU - 0.7); g.moveTo(-4, -12); g.lineTo(-4, 12); },
    g => { g.moveTo(0, 12); g.lineTo(0, -4); g.moveTo(-8, -12); g.quadraticCurveTo(-8, -2, 0, -4); g.quadraticCurveTo(8, -2, 8, -12); },
    g => { g.moveTo(0, -12); g.lineTo(0, 12); g.moveTo(-9, -3); g.lineTo(9, -3); g.lineTo(9, 4); g.moveTo(-9, -3); g.lineTo(-9, -10); },
    g => { g.moveTo(-11, 0); g.quadraticCurveTo(0, -11, 11, 0); g.quadraticCurveTo(0, 11, -11, 0); g.moveTo(3, 0); g.arc(0, 0, 3, 0, TAU); },
    g => { g.moveTo(-9, -10); g.lineTo(0, -2); g.lineTo(9, -10); g.moveTo(-9, 0); g.lineTo(0, 8); g.lineTo(9, 0); },
    g => { g.arc(0, -4, 6, 0, TAU); g.moveTo(0, 2); g.lineTo(0, 12); g.moveTo(-6, 12); g.lineTo(6, 12); },
  ];
  const glyphSpr = k => fxSprite('da8glyph' + k, 48, 48, (g, w) => { g.translate(w / 2, w / 2); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); GLYPHS[k](g); g.strokeStyle = rgba(ENERGY, 0.35); g.lineWidth = 7; g.stroke(); g.strokeStyle = rgba(EDGE, 0.75); g.lineWidth = 3.4; g.stroke(); g.strokeStyle = rgba(ACC, 1); g.lineWidth = 1.6; g.stroke(); });
  // a soft dark disc (the floor darkened a little under each circle, so its light reads on a bright floor)
  const markSpr = () => fxSprite('da8mark', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 'rgba(8,5,15,0.5)'], [0.62, 'rgba(8,5,15,0.34)'], [0.86, 'rgba(24,11,46,0.1)'], [1, 'rgba(24,11,46,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // the missile, pointing +x, its head at x = 176 of 192: a deep-purple pointed outer layer (drawn normally) ...
  function teardrop(g, x0, x1, hw) { const xm = x0 + (x1 - x0) * 0.62; g.beginPath(); g.moveTo(x1, 32); g.quadraticCurveTo(xm + (x1 - xm) * 0.4, 32 - hw, xm, 32 - hw * 0.92); g.quadraticCurveTo(x0 + (xm - x0) * 0.4, 32 - hw * 0.5, x0, 32); g.quadraticCurveTo(x0 + (xm - x0) * 0.4, 32 + hw * 0.5, xm, 32 + hw * 0.92); g.quadraticCurveTo(xm + (x1 - xm) * 0.4, 32 + hw, x1, 32); g.closePath(); }
  const missDSpr = () => fxSprite('da8missD', 192, 64, g => {
    const gr = g.createLinearGradient(0, 0, 192, 0); gr.addColorStop(0, rgba(PLUM, 0)); gr.addColorStop(0.4, rgba(PLUM, 0.55)); gr.addColorStop(0.8, rgba(BODY, 0.85)); gr.addColorStop(1, rgba(BODY, 0.9));
    for (const [hw, a] of [[27, 0.22], [24, 0.4], [21, 1]]) { teardrop(g, 4, 188, hw); g.globalAlpha = a; g.fillStyle = gr; g.fill(); } g.globalAlpha = 1;
    teardrop(g, 30, 186, 19); g.strokeStyle = rgba(EDGE, 0.5); g.lineWidth = 1.4; g.stroke(); });
  // ... and its light (drawn additively): violet body, a brilliant violet-white spear core, the hot tip
  const missLSpr = () => fxSprite('da8missL', 192, 64, g => {
    let gr = g.createLinearGradient(0, 0, 192, 0); gr.addColorStop(0, rgba(ENERGY, 0)); gr.addColorStop(0.45, rgba(ENERGY, 0.5)); gr.addColorStop(0.85, rgba(EDGE, 0.75)); gr.addColorStop(1, rgba(EDGE, 0.6));
    for (const [hw, a] of [[16, 0.3], [13, 0.5], [10, 0.9]]) { teardrop(g, 36, 184, hw); g.globalAlpha = a; g.fillStyle = gr; g.fill(); } g.globalAlpha = 1;
    gr = g.createLinearGradient(60, 0, 186, 0); gr.addColorStop(0, rgba(ACC, 0)); gr.addColorStop(0.55, rgba(ACC, 0.85)); gr.addColorStop(1, 'rgba(255,255,255,1)'); teardrop(g, 64, 186, 5); g.fillStyle = gr; g.fill();
    const rg = g.createRadialGradient(162, 32, 0, 162, 32, 22); rg.addColorStop(0, 'rgba(255,255,255,0.9)'); rg.addColorStop(0.3, rgba(ACC, 0.6)); rg.addColorStop(1, rgba(EDGE, 0)); g.fillStyle = rg; g.fillRect(140, 10, 44, 44); });
  /* the sphere's layers (r = 120 in a 256 box): the darker translucent shell, the luminous rim, the air darkened round it */
  const shellSpr = () => fxSprite('da8shell', 256, 256, g => { const gr = g.createRadialGradient(118, 114, 0, 128, 128, 128);
    [[0, 'rgba(52,16,84,0.78)'], [0.45, 'rgba(36,14,62,0.82)'], [0.75, 'rgba(20,9,38,0.9)'], [0.88, 'rgba(8,5,15,0.93)'], [0.95, 'rgba(8,5,15,0.6)'], [1, 'rgba(8,5,15,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const rimSpr = () => fxSprite('da8rim', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, rgba(ENERGY, 0)], [0.74, rgba(ENERGY, 0)], [0.86, rgba(ENERGY, 0.3)], [0.92, rgba(EDGE, 0.7)], [0.945, rgba(ACC, 0.65)], [0.975, rgba(EDGE, 0.25)], [1, rgba(EDGE, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = rgba(ACC, 0.5); g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 113, Math.PI * 1.02, Math.PI * 1.62); g.stroke(); g.strokeStyle = rgba(WHITE, 0.45); g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 114, Math.PI * 1.12, Math.PI * 1.48); g.stroke(); });
  // the sphere's lavender core: a hot white heart, lavender, violet, fading
  const coreSpr = () => fxSprite('da8core', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 'rgba(255,255,255,1)'], [0.16, rgba(ACC, 0.95)], [0.4, rgba(EDGE, 0.6)], [0.68, rgba(ENERGY, 0.26)], [1, rgba(ENERGY, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const haloSpr = () => fxSprite('da8halo', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 'rgba(8,5,15,0.7)'], [0.45, 'rgba(14,8,26,0.42)'], [0.75, 'rgba(24,11,46,0.14)'], [1, 'rgba(24,11,46,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // swirling currents seen face on: three spiral arms, violet with pale cores (squashed into a tilted disc when drawn)
  const swirlSpr = () => fxSprite('da8swirl', 192, 192, (g, w) => {
    const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) for (const [col, lw] of [[rgba(ENERGY, 0.4), 13], [rgba(EDGE, 0.55), 6], [rgba(ACC, 0.8), 2]]) { g.strokeStyle = col; for (let i = 1; i <= 36; i++) { const u0 = (i - 1) / 36, u = i / 36, b0 = arm * TAU / 3 + u0 * 4.4, b = arm * TAU / 3 + u * 4.4; g.lineWidth = lw * (0.25 + 0.75 * Math.sin(u * Math.PI)); g.beginPath(); g.moveTo(Math.cos(b0) * c0 * 0.94 * u0, Math.sin(b0) * c0 * 0.94 * u0); g.lineTo(Math.cos(b) * c0 * 0.94 * u, Math.sin(b) * c0 * 0.94 * u); g.stroke(); } }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, c0); gr.addColorStop(0, rgba(ACC, 0.55)); gr.addColorStop(0.35, rgba(EDGE, 0.18)); gr.addColorStop(1, rgba(EDGE, 0)); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w); });
  // vertical beams (64 x 256), gaussian across: the strike's dark outer layer, its violet body with a white core
  function vbeam(key, stops, top) { return fxSprite(key, 64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(top, 'rgba(0,0,0,1)'); gv.addColorStop(0.94, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0.4)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); }); }
  const beamDSpr = () => vbeam('da8beamD', [[0, 'rgba(24,11,46,0)'], [0.2, 'rgba(24,11,46,0.5)'], [0.38, 'rgba(43,11,69,0.85)'], [0.62, 'rgba(43,11,69,0.85)'], [0.8, 'rgba(24,11,46,0.5)'], [1, 'rgba(24,11,46,0)']], 0.12);
  const beamLSpr = () => vbeam('da8beamL', [[0, rgba(ENERGY, 0)], [0.22, rgba(ENERGY, 0.35)], [0.36, rgba(EDGE, 0.75)], [0.45, rgba(ACC, 0.95)], [0.5, 'rgba(255,255,255,1)'], [0.55, rgba(ACC, 0.95)], [0.64, rgba(EDGE, 0.75)], [0.78, rgba(ENERGY, 0.35)], [1, rgba(ENERGY, 0)]], 0.12);
  // a pillar of the awakening: the same light, feathered over its upper half
  const pillarSpr = () => vbeam('da8pillar', [[0, rgba(ENERGY, 0)], [0.25, rgba(ENERGY, 0.4)], [0.4, rgba(EDGE, 0.8)], [0.5, 'rgba(255,255,255,1)'], [0.6, rgba(EDGE, 0.8)], [0.75, rgba(ENERGY, 0.4)], [1, rgba(ENERGY, 0)]], 0.55);
  // the column of the blast: dark, soft at both sides
  const colSpr = () => vbeam('da8col', [[0, 'rgba(24,11,46,0)'], [0.2, 'rgba(24,11,46,0.65)'], [0.42, 'rgba(8,5,15,0.92)'], [0.6, 'rgba(24,11,46,0.88)'], [0.8, 'rgba(43,11,69,0.55)'], [1, 'rgba(43,11,69,0)']], 0.1);
  // bands round a circle (shockwaves and the blast shell): dark body + violet edge, and light only
  const bandSpr = () => fxSprite('da8band', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(24,11,46,0)'], [0.7, 'rgba(24,11,46,0)'], [0.79, 'rgba(24,11,46,0.45)'], [0.86, 'rgba(43,11,69,0.7)'], [0.91, 'rgba(109,40,168,0.8)'], [0.95, 'rgba(165,92,255,0.95)'], [0.98, 'rgba(208,174,255,0.5)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const bandLSpr = () => fxSprite('da8bandL', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, rgba(ENERGY, 0)], [0.66, rgba(ENERGY, 0)], [0.84, rgba(ENERGY, 0.35)], [0.93, rgba(EDGE, 0.8)], [0.965, rgba(ACC, 0.9)], [1, rgba(ACC, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // the blast shell: a faint violet haze inside a luminous skin
  const shellBSpr = () => fxSprite('da8shellB', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, rgba(ACC, 0.08)], [0.5, rgba(EDGE, 0.07)], [0.8, rgba(ENERGY, 0.2)], [0.92, rgba(EDGE, 0.6)], [0.965, rgba(ACC, 0.8)], [1, rgba(ACC, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // cloud puffs: dark (the folds on top), smoky violet, and the dark puff's lit twin for the underside (additive)
  const dpuffSpr = () => fxSprite('da8dpuff', 96, 96, g => { const gr = g.createRadialGradient(42, 40, 0, 48, 48, 48); [[0, 'rgba(30,14,52,0.95)'], [0.4, 'rgba(18,9,34,0.85)'], [0.72, 'rgba(24,11,46,0.4)'], [1, 'rgba(24,11,46,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const puffSpr = () => fxSprite('da8puff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); [[0, 'rgba(70,48,82,0.6)'], [0.5, 'rgba(43,11,69,0.34)'], [1, 'rgba(24,11,46,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  /* a shaded cloud ball (128): a dense dark body with a feathered edge and a faint smoky lift high on it; v 1: its
     underside lit violet from within (the light painted only where the ball is); v 2: a plum-tinted middle variant */
  const ballSpr = v => fxSprite('da8ball' + v, 128, 128, g => {
    const gr = g.createRadialGradient(56, 50, 0, 64, 64, 64); [[0, v === 2 ? 'rgba(62,30,90,1)' : 'rgba(44,24,66,1)'], [0.35, v === 2 ? 'rgba(40,16,66,1)' : 'rgba(26,12,46,1)'], [0.62, 'rgba(16,8,30,0.98)'], [0.8, 'rgba(12,6,22,0.75)'], [0.92, 'rgba(12,6,22,0.3)'], [1, 'rgba(12,6,22,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.globalCompositeOperation = 'source-atop'; const hl = g.createRadialGradient(46, 34, 0, 46, 34, 40); hl.addColorStop(0, 'rgba(110,80,130,0.45)'); hl.addColorStop(1, 'rgba(110,80,130,0)'); g.fillStyle = hl; g.fillRect(0, 0, 128, 128);
    const rl = g.createRadialGradient(44, 40, 0, 44, 40, 92); rl.addColorStop(0, 'rgba(165,92,255,0)'); rl.addColorStop(0.62, 'rgba(165,92,255,0)'); rl.addColorStop(0.76, 'rgba(165,92,255,0.32)'); rl.addColorStop(0.9, 'rgba(165,92,255,0)'); g.fillStyle = rl; g.fillRect(0, 0, 128, 128);
    if (v === 1) { const lg = g.createRadialGradient(64, 104, 0, 64, 96, 70); lg.addColorStop(0, 'rgba(208,174,255,0.95)'); lg.addColorStop(0.25, 'rgba(165,92,255,0.85)'); lg.addColorStop(0.55, 'rgba(109,40,168,0.55)'); lg.addColorStop(1, 'rgba(109,40,168,0)'); g.fillStyle = lg; g.fillRect(0, 0, 128, 128); } });
  const lpuffSpr = () => fxSprite('da8lpuff', 96, 96, g => { const gr = g.createRadialGradient(48, 56, 0, 48, 52, 48); [[0, rgba(EDGE, 0.75)], [0.35, rgba(ENERGY, 0.5)], [0.7, rgba(ENERGY, 0.15)], [1, rgba(ENERGY, 0)]].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });

  /* a small dark fragment: a triangle with a violet edge */
  function frag(c, x, y, s, rot, a, sq) { if (!(a > 0.01) || s < 0.5) return; c.save(); c.translate(x, y); if (sq) c.scale(1, sq); c.rotate(rot); c.globalAlpha = Math.min(1, a); c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, s * 0.55); c.lineTo(-s * 0.35, -s * 0.5); c.closePath(); c.fillStyle = BODY; c.fill(); c.strokeStyle = rgba(EDGE, 0.75); c.lineWidth = 1; c.stroke(); c.restore(); }
  function growPath(c, pts, g, T) { const n = pts.length - 1; if (n < 1 || g <= 0) return; const k = g * n, m = Math.min(n, Math.floor(k)); c.moveTo(pts[0][0] * T, pts[0][1] * T); for (let i = 1; i <= m; i++) c.lineTo(pts[i][0] * T, pts[i][1] * T); if (m < n) { const e = k - m, a = pts[m], b = pts[m + 1]; c.lineTo(lerp(a[0], b[0], e) * T, lerp(a[1], b[1], e) * T); } }
  function makeFractures(n, L, seed) { const out = []; for (let i = 0; i < n; i++) { let a = i / n * TAU + (R1(seed + i * 3.3) - 0.5) * 0.45, r = 0.3 + 0.3 * R1(seed + i), len = L * (0.6 + 0.5 * R1(seed + i * 5.1)); const pts = [[Math.cos(a) * r, Math.sin(a) * r]]; for (let k = 1; k <= 7; k++) { a += (R1(seed + i * 11 + k) - 0.5) * 0.42; r += len / 7 * (0.7 + 0.6 * R1(seed + i * 7 + k)); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const q = pts[2 + Math.floor(R1(seed + i * 17) * 3)], ba = Math.atan2(q[1], q[0]) + (R1(seed + i * 19) < 0.5 ? 0.7 : -0.7), br = [q]; for (let k = 1; k <= 3; k++) { const aa = ba + (R1(seed + i * 23 + k) - 0.5) * 0.4, rr = len * 0.32 * k / 3; br.push([q[0] + Math.cos(aa) * rr, q[1] + Math.sin(aa) * rr]); }
    out.push({ pts, br, d: R1(seed + i * 31) * 0.15 }); } return out; }
  // a polyline drawn in nCh chunks, each styled by sty(u along 0..1, its middle point) (a fading, tapering trail in few strokes)
  function chunked(c, pts, nCh, sty) { const n = pts.length; if (n < 2) return; for (let q = 0; q < nCh; q++) { const i0 = Math.floor(q * (n - 1) / nCh), i1 = Math.floor((q + 1) * (n - 1) / nCh); if (i1 <= i0) continue; if (sty((q + 0.5) / nCh, pts[(i0 + i1) >> 1]) === false) continue; c.beginPath(); c.moveTo(pts[i0][0], pts[i0][1]); for (let i = i0 + 1; i <= i1; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); } }
  // 3D helpers for the sphere (view space: x right, y down, z toward the viewer)
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function basis(n) { const e1 = nrm(Math.abs(n[2]) > 0.9 ? crs(n, [1, 0, 0]) : crs(n, [0, 0, 1])); return [e1, crs(n, e1)]; }
  /* a small circle on the unit sphere round axis n at latitude lat, as 3D points (k segments, rotated by ph) */
  function smallCircle(n, lat, k, ph) { const [e1, e2] = basis(n), cL = Math.cos(lat), sL = Math.sin(lat), out = []; for (let i = 0; i <= k; i++) { const a = i / k * TAU + ph, ca = Math.cos(a) * cL, sa = Math.sin(a) * cL; out.push([ca * e1[0] + sa * e2[0] + sL * n[0], ca * e1[1] + sa * e2[1] + sL * n[1], ca * e1[2] + sa * e2[2] + sL * n[2]]); } return out; }
  // stroke the front (or back) part of a 3D polyline on a sphere of radius r
  function sphPath(c, pts, r, front) { c.beginPath(); let pen = false; for (const p of pts) { const vis = front ? p[2] > 0 : p[2] <= 0; if (vis) { if (pen) c.lineTo(p[0] * r, p[1] * r); else c.moveTo(p[0] * r, p[1] * r); pen = true; } else pen = false; } }

  /* ================= D-U08 Annihilation ================= */
  U.annihilation = (C, h) => {
    H = h; GY = H.GY; const me = H.me, x = C.tx, y = C.ty, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, tier = CEL ? 2 : ADE ? 1 : 0, K = C.K, evoK = 1 + 0.08 * (ev - 1);
    const R = (4.4 + 1.6 * (ev - 1) / 6) * K, DMG = C.base * 24 * K * evoK, seed = Math.floor(Math.random() * 1000);
    const RS = (1.65 + 0.14 * (ev - 1)) * Math.sqrt(K), LR = Math.min(R, (4.2 + 0.12 * (ev - 1)) * Math.sqrt(K));
    /* the timeline */
    const TR0 = 0.35, TR1 = 1.2, IN0 = 0.6, IN1 = 1.4, GL0 = 0.9, GL1 = 1.85, SE0 = 1.45, HOLD0 = 3.55, STK = 4.4 + (CEL ? 0.3 : ADE ? 0.12 : 0), IMP = STK + 0.3, LIFE = IMP + 4.6;
    /* the six circles: the giant over the aim, five smaller of different sizes round it */
    const SF = [0.21, 0.16, 0.25, 0.18, 0.23], circ = [];
    circ.push({ i: 0, wx: 0, wy: 0, r: LR * 0.42, dir: 1, a0: R1(seed) * TAU, d: 0 });
    const th0 = -Math.PI / 2 + (R1(seed + 2) - 0.5) * 0.5;
    for (let i = 0; i < 5; i++) { const r = LR * SF[i], th = th0 + i * TAU / 5 + (R1(seed + i * 3.7) - 0.5) * 0.3, D = LR * 0.42 + r + LR * (0.07 + 0.05 * R1(seed + i * 5.3)); circ.push({ i: i + 1, wx: Math.cos(th) * D, wy: Math.sin(th) * D, th, D, r, dir: i % 2 ? 1 : -1, a0: R1(seed + i * 9) * TAU, d: 0.06 * (i + 1) }); }
    for (const ci of circ) { const gsz = Math.max(0.2, ci.r * 0.13), n = Math.max(6, Math.round(TAU * ci.r * 0.71 / (gsz * 1.7))) + tier * 2; ci.gsz = gsz; ci.gl = []; for (let j = 0; j < n; j++) ci.gl.push({ k: Math.floor(R1(seed + ci.i * 31 + j * 7) * 8), a: j / n * TAU, z: 0.6 + 1.6 * R1(seed + ci.i * 13 + j), rv: (R1(seed + ci.i * 3 + j * 11) - 0.5) * 4, dust: false }); }
    /* the six missiles: satellites launch in turn, the giant circle's (the largest) last; spirals all turning one way */
    const MS = []; const SPIN = 1.9 * (R1(seed + 5) < 0.5 ? 1 : -1);
    for (let i = 1; i <= 5; i++) { const ci = circ[i]; MS.push({ ci, L: 2.05 + (i - 1) * 0.1, FT: 1.0 + 0.04 * (i % 2), rho: ci.D, th: ci.th, s: 0.62 + 0.9 * SF[i - 1], central: false }); }
    MS.push({ ci: circ[0], L: 2.62, FT: 0.88, rho: 0, th: R1(seed + 8) * TAU, s: 1.15, central: true });
    for (const m of MS) { m.arr = m.L + m.FT; m.w = m.central ? 2 : 1; }
    const ARR_END = Math.max(...MS.map(m => m.arr));
    /* a missile's position (floor offset wx, wy in tiles about the aim; height z) along its flight u 0..1 */
    function mpos(m, u, ZC) { const e = sstep(0.18, 1, u), z = ZC * (1 - Math.pow(1 - u, 1.55));
      if (m.central) { const rr = 0.28 * (1 - e) * Math.sin(Math.PI * Math.min(1, u * 1.2)), b = m.th + u * 7; return [Math.cos(b) * rr, Math.sin(b) * rr, z]; }
      const rho = m.rho * (1 + 0.28 * Math.sin(Math.PI * Math.min(1, u / 0.55))) * (1 - e), b = m.th + SPIN * sstep(0.05, 1, u); return [Math.cos(b) * rho, Math.sin(b) * rho, z]; }
    // bands inside the sphere (counter-rotating), escaping sparks
    const NB = CEL ? 5 : ADE ? 4 : 3, bands = []; for (let i = 0; i < NB; i++) bands.push({ tilt: 0.35 + 0.9 * R1(seed + i * 4.1), b0: R1(seed + i * 6.3) * TAU, w: (0.5 + 0.4 * R1(seed + i)) * (i % 2 ? -1 : 1), lat: (R1(seed + i * 2.9) - 0.5) * 0.7, sp: (1.4 + R1(seed + i * 8) * 1.2) * (i % 2 ? 1 : -1) });
    const NSP = CEL ? 16 : ADE ? 12 : 9;
    // shadow shards hanging over the circles
    const shards = []; for (const ci of circ) for (let k = 0; k < H.n(3 + (ev >> 1) + (ci.i ? 0 : 2)); k++) shards.push({ ci, a: R1(seed + ci.i * 17 + k * 3) * TAU, rr: 0.25 + 0.6 * R1(seed + ci.i * 5 + k * 7), z0: 0.35 + 1.1 * R1(seed + ci.i * 9 + k * 13), t0: 0.7 + 0.9 * R1(seed + ci.i + k * 19), s: 0.07 + 0.07 * R1(seed + k * 23 + ci.i), rot: R1(seed + k * 29) * TAU, ph: R1(seed + k * 31 + ci.i) * TAU });
    const FR = makeFractures(8 + ev, R * 1.0, seed), NPF = H.n(CEL ? 32 : ADE ? 26 : 20), crown = [];
    for (let j = 0; j < NPF; j++) crown.push({ phi: j / NPF * TAU + (R1(seed + j * 2.3) - 0.5) * 0.35, psi: R1(seed + j * 4.7) * TAU, s: 0.8 + 0.4 * R1(seed + j * 6.1), v: 1.1 + 0.5 * R1(seed + j * 7.9) });
    const deb = [], fall = [], segs = [];
    const CROWN = CEL ? 1.18 : ADE ? 1.08 : 1;
    H.X.banner('ANNIHILATION', '', C.col, 1.6); H.X.sfx.hum();
    const F = H.add({ life: LIFE, x, y, ZC: 0, rip: [], fed: 0, crH: 1, crR: 1,
      update(dt, f) {
        const t = f.t, ZC = f.ZC || 6, Q = H.Q(), D2 = !f.gpu;   /* (v391 U3: the GPU path paints its own particles) */
        if (f.gpu) gpuEmit(f, dt);
        // the awakening: sparks climbing each pillar; the tracing pens shedding sparks
        if (D2 && t < 0.8) for (const ci of circ) if (Math.random() < 9 * dt * Q) H.P({ kind: 'spark', x: x + ci.wx + (Math.random() - 0.5) * 0.3, y: y + ci.wy * GY, vx: (Math.random() - 0.5) * 1.5, vy: -5 - Math.random() * 4, g: 0, life: 0.4 + Math.random() * 0.3, max: 0.7, size: 1.5 + Math.random() * 1.5, color: Math.random() < 0.5 ? EDGE : ACC });
        if (D2 && t > TR0 && t < TR1) for (const ci of circ) if (Math.random() < 5 * dt * Q) { const a = ci.a0 + t * 0.2 * ci.dir + cl((t - TR0 - ci.d) / (TR1 - TR0)) * TAU; H.P({ kind: 'spark', x: x + ci.wx + Math.cos(a) * ci.r, y: y + (ci.wy + Math.sin(a) * ci.r) * GY, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 2, g: 2, life: 0.35, max: 0.35, size: 1.6, color: ACC }); }
        // launches and arrivals
        for (const m of MS) {
          if (!m.go && t >= m.L) { m.go = true; const ci = m.ci; if (D2) H.burst(x + ci.wx, y + ci.wy * GY, 'spark', m.central ? 18 : 10, { v: 5, up: 3, life: 0.5, size: 2, color: [EDGE, ACC, ENERGY] }); if (D2) for (let j = 0; j < H.n(m.central ? 6 : 3); j++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: x + ci.wx + Math.cos(b) * ci.r * 0.5, y: y + ci.wy * GY + Math.sin(b) * ci.r * 0.3, vx: Math.cos(b) * 1.2, vy: Math.sin(b) * 0.6 - 0.8, life: 0.8, max: 0.8, size: 0.5 + 0.3 * ci.r, color: 'rgba(58,36,96,' }); } H.X.sfx.whoosh(); if (m.central) H.X.shake(5, 0.25); }
          const u = (t - m.L) / m.FT;
          if (D2 && u > 0 && u < 1 && Math.random() < 16 * dt * Q) { const p = mpos(m, u, ZC); H.P({ kind: Math.random() < 0.6 ? 'spark' : 'ember', x: x + p[0] + (Math.random() - 0.5) * 0.2, y: y + p[1] * GY - p[2], vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6, g: 1, life: 0.35 + Math.random() * 0.3, max: 0.65, size: 1.4 + Math.random() * 1.6, color: Math.random() < 0.5 ? EDGE : Math.random() < 0.5 ? ACC : ENERGY }); }
          if (!m.hit && u >= 1) { m.hit = true; const p = mpos(m, 0.9, ZC), d = nrm([p[0], p[1] * GY - (p[2] - ZC), p[1] * 0.9 + (m.central ? 0.25 : 0)]); f.rip.push({ t0: t, d, w: m.w }); H.X.shake(m.central ? 7 : 3, 0.2); H.X.sfx.thud(); if (m.central) H.X.sfx.hum(); }
        }
        // how much the sphere has been fed (each arrival eased in; the central counts double)
        let fed = 0; for (const m of MS) fed += m.w * sstep(m.arr - 0.04, m.arr + 0.3, t); f.fed = fed / 7;
        // the hold: motes pulled up from the floor toward the sphere
        if (D2 && t > ARR_END && t < STK && Math.random() < 10 * dt * Q) { const ci = circ[Math.floor(Math.random() * 6)], b = Math.random() * TAU, rr = Math.random() * ci.r, life = 0.7; H.P({ kind: 'spark', x: x + ci.wx + Math.cos(b) * rr, y: y + (ci.wy + Math.sin(b) * rr) * GY, vx: -(ci.wx + Math.cos(b) * rr) / life * 0.7, vy: -ZC * 0.75 / life, g: 0, life, max: life, size: 1.8, color: Math.random() < 0.5 ? ACC : EDGE }); }
        // after the impact: debris, the slow rain of fragments from the cloud, glyph dust, ash
        const post = t - IMP;
        if (post > 0) {
          for (const d of deb) { d.age += dt; if (d.rest) continue; d.wx += d.vx * dt; d.wy += d.vy * dt; d.z += d.vz * dt; d.vz -= d.g * dt; d.rot += d.vr * dt; d.vx *= 1 - dt * 0.4; d.vy *= 1 - dt * 0.4; if (d.z <= 0 && d.vz < 0) { d.z = 0; if (d.bn++ < 1 && d.g > 3) { d.vz *= -0.3; d.vx *= 0.5; d.vy *= 0.5; } else { d.rest = true; } } }
          if (post > 0.7 && post < 3.4 && Math.random() < 7 * dt * Q) { const b = Math.random() * TAU, rr = (0.3 + Math.random()) * f.crR, hz = f.crH; fall.push({ wx: Math.cos(b) * rr, wy: Math.sin(b) * rr * 0.8, z: hz + (Math.random() - 0.3) * f.crR * 0.4, vx: Math.cos(b) * (0.3 + Math.random() * 0.6), vy: Math.sin(b) * 0.3, vz: -(0.5 + Math.random() * 0.8), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, s: 0.06 + Math.random() * 0.08, age: 0 }); }
          for (const p of fall) { p.age += dt; p.wx += p.vx * dt; p.wy += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.rot += p.vr * dt; p.wx += Math.sin(t * 1.3 + p.rot) * 0.25 * dt; }
          if (D2) for (const ci of circ) for (const gl of ci.gl) if (!gl.dust && gl.fx != null && post > 0.6 + gl.z * 0.35) { gl.dust = true; if (Math.random() < 0.6 * Q) { const zz = gl.z * 0.9; H.burst(x + gl.fx, y + gl.fy * GY - zz, 'spark', 3, { v: 1.6, life: 0.5, size: 1.4, color: [EDGE, ACC] }); } }
          if (D2 && post > 0.3 && post < 4 && Math.random() < 12 * dt * Q * (1 - post / 4)) { const b = Math.random() * TAU, rr = Math.random() * R * 0.9, hz = Math.random() * f.crH; H.P({ kind: Math.random() < 0.55 ? 'ember' : 'smoke', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * GY - hz, vx: (Math.random() - 0.5) * 0.8, vy: 0.25 + Math.random() * 0.5, g: 0.15, life: 1.2 + Math.random() * 0.8, max: 2, size: Math.random() < 0.5 ? 1.4 + Math.random() : 0.35 + 0.2 * Math.random(), color: Math.random() < 0.5 ? (Math.random() < 0.5 ? EDGE : SMOKE) : 'rgba(40,25,60,' }); }
        }
      },
      annih: { STK, IMP, LIFE },
      /* (v391 U3) the GPU layers where they run, else the 2D picture (the same frame never mixes the two) */
      drawUnder(c, f, X, Y, T, gt) { f.gpu = gpuLayer(c, f, X, Y, T, gt, false); if (!f.gpu) f.drawUnder2D(c, f, X, Y, T, gt); },
      draw(c, f, X, Y, T, gt) { f.lastM = c.getTransform ? c.getTransform() : null;   /* (tests: where the camera put it) */ if (f.gpu) { c.save(); const okG = gpuLayer(c, f, X, Y, T, gt, true); c.restore(); if (okG) return; f.gpu = false; } f.draw2D(c, f, X, Y, T, gt); },
      drawUnder2D(c, f, X, Y, T, gt) {
        const t = f.t, post = t - IMP, endK = cl((LIFE - t) / 0.8);
        /* --- the six circles (before the impact; a quick fade into their fractured segments at it) --- */
        const gone = post > 0 ? cl(post / 0.18) : 0, holdK = sstep(ARR_END - 0.1, STK, t), flare = sstep(IMP - 0.18, IMP, t);
        if (gone < 1) for (const ci of circ) {
          const ap = sstep(0.05 + ci.d, 0.35 + ci.d, t) * (1 - gone), tr = cl((t - TR0 - ci.d) / (TR1 - TR0)), inn = cl((t - IN0 - ci.d) / (IN1 - IN0)), m = MS.find(q => q.ci === ci), fl = t > m.L ? Math.exp(-(t - m.L) * 5) : 0;
          const pulse = holdK * (0.5 + 0.5 * Math.sin((t - ARR_END) * TAU * 2.2)), feedDim = 1 - 0.4 * sstep(ARR_END + 0.2, STK, t), fk = ci.i === 0 ? flare : 0;
          drawCircle(c, X, Y, T, ci, t, { ap, tr, inn, lit: (0.7 + 0.3 * pulse) * feedDim + fl * 0.8 + fk, fl, pulse, flare: fk });
        }
        if (post > 0) {
          /* --- the fractured circles: glowing arcs flung outward, fading; temporary cracks; the shockwaves --- */
          const q = cl(post / 1.5), sa = (1 - q) * (1 - q) * endK;
          if (sa > 0.01) for (const ci of circ) { const cx = X + ci.wx * T, cy = Y + ci.wy * T * GY; c.save(); c.translate(cx, cy); c.scale(1, GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
            const path = () => { c.beginPath(); for (let L = 0; L < 3; L++) { const rr0 = ci.r * T * [0.97, 0.71, 0.6][L], n = 5 + L + (ci.i ? 0 : 3); for (let k = 0; k < n; k++) { const s = R1(seed + ci.i * 41 + L * 13 + k), a0 = ci.a0 + (k + 0.1 + 0.15 * s) / n * TAU, a1 = ci.a0 + (k + 0.8 + 0.1 * s) / n * TAU, rr = rr0 + (0.6 + 1.6 * s) * T * H.ease.out(cl(post / 1.2)) * (1 + ci.r * 0.3); c.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr); c.arc(0, 0, Math.max(1, rr), a0, a1); } } };
            path(); c.globalAlpha = sa * 0.45; c.strokeStyle = ENERGY; c.lineWidth = Math.max(3, T * 0.16); c.stroke(); c.globalAlpha = sa * 0.9; c.strokeStyle = EDGE; c.lineWidth = Math.max(1.5, T * 0.05); c.stroke(); c.globalAlpha = sa * Math.max(0, 1 - post / 0.5); c.strokeStyle = ACC; c.lineWidth = 1.2; c.stroke(); c.restore(); }
          // the cracks: light only, racing out, glowing, gone within ~2.5 s
          const fg = H.ease.out(cl(post / 0.5)), fk = (1 - cl((post - 0.7) / 1.8)) * endK;
          if (fk > 0.01) { c.save(); c.translate(X, Y); c.scale(1, GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
            for (const [col, lw, al] of [[ENERGY, Math.max(3, T * 0.24), 0.4], [EDGE, Math.max(1.5, T * 0.075), 0.85], [ACC, 1.2, 0.6]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (const k of FR) { const gg = cl((fg - k.d) / (1 - k.d)); growPath(c, k.pts, gg, T); growPath(c, k.br, cl(gg * 1.6 - 0.5), T); } c.globalAlpha = al * fk * (0.75 + 0.25 * Math.sin(gt * 6)); c.stroke(); }
            c.restore(); }
          // the floor flash, then a slowly dying violet glow at the centre
          floorLight(c, X, Y, R * T * 1.2, 0.7 * Math.max(0, 1 - post / 0.4), ACC);
          floorLight(c, X, Y, R * T * (0.7 + 0.3 * cl(post / 1.5)), (0.45 * Math.exp(-post / 1.6) + 0.05) * endK, ENERGY); floorLight(c, X, Y, R * T * 0.3, 0.5 * Math.exp(-post / 1.2) * endK, EDGE);
          // the broad shockwave (dark body, violet edge), a light ring after it, the widest last; luminous pressure streaks
          const waves = CEL ? [[0, 1.0, 1, 0], [0.1, 1.2, 0.7, 1], [0.26, 1.5, 0.5, 1]] : ADE ? [[0, 1.0, 1, 0], [0.12, 1.25, 0.7, 1], [0.3, 1.4, 0.35, 1]] : [[0, 1.0, 1, 0], [0.12, 1.25, 0.7, 1]];
          for (const [d, sc, w, L] of waves) { const qq = cl((post - d) / 0.85); if (qq > 0 && qq < 1) { const rr = R * T * 1.2 * sc * H.ease.out(qq); c.save(); c.globalAlpha = (1 - qq) * w; c.drawImage(L ? bandLSpr() : bandSpr(), X - rr, Y - rr * GY, rr * 2, rr * 2 * GY); c.restore(); } }
          const qs = cl(post / 0.8); if (qs < 1) { const rr = R * T * 1.2 * H.ease.out(qs), NS = 22 + 3 * ev; c.save(); c.translate(X, Y); c.scale(1, GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < NS; i++) { const a = i / NS * TAU + R1(seed + i * 3) * 0.2, l = rr * (0.18 + 0.2 * R1(seed + i * 7)); c.moveTo(Math.cos(a) * (rr - l), Math.sin(a) * (rr - l)); c.lineTo(Math.cos(a) * rr * 0.99, Math.sin(a) * rr * 0.99); } c.globalAlpha = (1 - qs) * 0.5; c.strokeStyle = EDGE; c.lineWidth = Math.max(2, T * 0.08); c.stroke(); c.globalAlpha = (1 - qs) * 0.8; c.strokeStyle = ACC; c.lineWidth = 1.1; c.stroke(); c.restore(); }
          // low rolling mist from the centre outward, thinning
          const mk = (1 - cl((post - 0.6) / 2.6)) * endK; if (mk > 0.01) { const sp = dpuffSpr(), N = H.n(14 + 2 * ev); c.save(); for (let i = 0; i < N; i++) { const a = i / N * TAU + R1(seed + i) * 0.4, d = R * (0.12 + 0.15 * R1(seed + i * 2)) + R * (0.5 + 0.45 * R1(seed + i * 3)) * H.ease.out(cl(post / 1.6)), px = X + Math.cos(a) * d * T, py = Y + Math.sin(a) * d * T * GY, pr = T * (0.6 + 0.5 * R1(seed + i * 5)) * (0.8 + 0.9 * cl(post / 1)) * (1 + 0.1 * Math.sin(gt * 1.7 + i)); c.globalAlpha = mk * 0.7 * cl(post / 0.2) * (0.35 + 0.65 * dimAt(px, py - pr * 0.3, T, pr * 0.5)); c.drawImage(sp, px - pr, py - pr * 0.6, pr * 2, pr * 1.2); } c.restore(); }
        }
      },
      draw2D(c, f, X, Y, T, gt) {
        const t = f.t, post = t - IMP, SC = scr(c);
        // the convergence height: the sphere's top inside the play area (never under the HUD), 4.5..8 tiles up
        if (!f.ZC) { const room = Y - (SC.y0 + T * 4.4) - RS * T; f.ZC = Math.max(4.2, Math.min(6.6, room / T)); }
        const ZC = f.ZC, SX = X, SY = Y - ZC * T, P3 = (wx, wy, z) => [X + wx * T, Y + wy * T * GY - z * T];
        /* --- the six lights awakening: narrow pillars with brilliant cores, dark energy curling round their edges --- */
        if (t < TR1 + 0.3) for (const ci of circ) { const u = t - ci.d * 0.5, k = sstep(0, 0.12, u) * (1 - sstep(TR0 + 0.2, TR1 + 0.25, t)); if (k <= 0.01) continue;
          const bx = X + ci.wx * T, by = Y + ci.wy * T * GY, hp = T * (2.4 + 1.6 * ci.r) * (0.4 + 0.6 * H.ease.out(cl(u / 0.25))), w = T * (0.16 + 0.1 * ci.r) * (1 + 0.6 * sstep(TR0, TR1, t)), AL = k * dimSeg(bx, by, bx, by - hp, T, w);
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL; c.drawImage(pillarSpr(), bx - w * 1.6, by - hp, w * 3.2, hp); c.restore();
          c.save(); c.lineCap = 'round'; for (let s = 0; s < 2; s++) { c.beginPath(); for (let j = 0; j <= 12; j++) { const v = j / 12, yy = by - hp * v * 0.85, xx = bx + Math.sin(v * 7 - t * 7 + s * Math.PI + ci.i) * w * (0.55 + 0.5 * v); j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.globalAlpha = AL * 0.3; c.strokeStyle = PLUM; c.lineWidth = Math.max(2, w * 0.5); c.stroke(); c.globalAlpha = AL * 0.35; c.strokeStyle = VOID; c.lineWidth = Math.max(1, w * 0.12); c.stroke(); } c.restore();
          glow(c, bx, by - T * 0.1, w * 3, EDGE, AL * 0.6); glow(c, bx, by - T * 0.1, w * 1.2, WHITE, AL * 0.5); }
        /* --- shadow shards hanging over the circles (pulled up into the light at the launch) --- */
        if (t < IMP + 0.05) for (const s of shards) { const m = MS[s.ci.i === 0 ? 5 : s.ci.i - 1], up = sstep(m.L - 0.05, m.L + 0.5, t), a = sstep(s.t0, s.t0 + 0.5, t) * (1 - up); if (a <= 0.01) continue; const z = s.z0 * sstep(s.t0, s.t0 + 1.2, t) + 0.08 * Math.sin(gt * 1.6 + s.ph) + up * 2.5, rr = s.ci.r * s.rr * (1 - up * 0.6), p = P3(s.ci.wx + Math.cos(s.a + gt * 0.2) * rr, s.ci.wy + Math.sin(s.a + gt * 0.2) * rr, z); frag(c, p[0], p[1], T * s.s, s.rot + gt * 0.8, a * dimAt(p[0], p[1], T), 0); }
        /* --- Celestial: two raised rings turning over the giant circle, threads of light to the floor --- */
        if (CEL && t < IMP + 0.3) { const k = sstep(1.0, 1.8, t) * (1 - sstep(IMP, IMP + 0.3, t)), G = circ[0]; if (k > 0.01) for (let j = 0; j < 2; j++) { const z = (0.9 + 0.75 * j) * sstep(1.0, 2.0, t) + 0.05 * Math.sin(gt * 2 + j) + post * (post > 0 ? 3 : 0), rr = G.r * T * (0.78 - 0.2 * j) * (1 + 0.3 * Math.max(0, post) / 0.3), cy = Y - z * T, AL = k * dimAt(X, cy, T, rr * 0.9) * (0.8 + 0.4 * flareOf(t));
            c.save(); c.translate(X, cy); c.scale(1, GY); c.rotate(gt * (j ? -0.5 : 0.35)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL * 0.8; const s = rr * 256 / 240; c.drawImage(outerSpr(2), -s, -s, s * 2, s * 2); c.restore();
            c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = EDGE; c.lineWidth = 1; c.globalAlpha = AL * 0.35; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + gt * (j ? -0.5 : 0.35); c.moveTo(X + Math.cos(a) * rr, cy + Math.sin(a) * rr * GY); c.lineTo(X + Math.cos(a) * G.r * T * 0.97, Y + Math.sin(a) * G.r * T * 0.97 * GY); } c.stroke(); c.restore(); } }
        /* --- the missiles, their spiralling tails and the lingering ritual pattern --- */
        const strand = CEL ? 3 : ADE ? 2 : 1;
        if (t > 2 && t < STK + 0.3) for (const m of MS) { const ur = (t - m.L) / m.FT; if (ur <= 0) continue; const u = Math.min(1, ur);
          const sz = T * (1.0 + 0.07 * (ev - 1)) * m.s, lw = sz * 0.34;
          // the lingering pattern: the whole path so far, faint, fading during the hold
          const lk = ur < 1 ? 1 : 1 - sstep(0.25, 1.3, t - m.arr); if (lk > 0.01) { const N = 26, pts = []; for (let j = 0; j <= N; j++) { const p = mpos(m, u * j / N, ZC); pts.push(P3(p[0], p[1], p[2])); }
            c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
            c.strokeStyle = ENERGY; c.lineWidth = lw * 1.4; chunked(c, pts, 4, (v, p) => { c.globalAlpha = lk * 0.22 * dimAt(p[0], p[1], T); });
            c.strokeStyle = EDGE; c.lineWidth = Math.max(1, lw * 0.25); chunked(c, pts, 4, (v, p) => { c.globalAlpha = lk * 0.55 * dimAt(p[0], p[1], T); }); c.restore(); }
          // the tail: dark wide body, violet, a bright thread, and helical strands round it (layered from Adept)
          if (ur < 1.35) { const u1 = u, u0 = Math.max(0, Math.min(1, ur) - 0.42) + Math.max(0, ur - 1) * 1.5, N = 18; if (u1 - u0 > 0.01) { const pts = []; for (let j = 0; j <= N; j++) { const p = mpos(m, lerp(u0, u1, j / N), ZC); pts.push(P3(p[0], p[1], p[2])); } const hd = pts[N], AL = dimAt(hd[0], hd[1], T, sz * 0.5) * (ur > 1 ? 1 - cl((ur - 1) / 0.35) : 1);
            c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = PLUM; chunked(c, pts, 4, v => { c.globalAlpha = AL * 0.5 * v; c.lineWidth = lw * 2.4 * (0.35 + 0.65 * v); });
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = ENERGY; chunked(c, pts, 4, v => { c.globalAlpha = AL * 0.7 * v; c.lineWidth = lw * 1.3 * (0.3 + 0.7 * v); }); c.strokeStyle = EDGE; chunked(c, pts, 4, v => { c.globalAlpha = AL * 0.85 * v; c.lineWidth = lw * 0.45 * (0.3 + 0.7 * v); }); c.strokeStyle = ACC; chunked(c, pts, 3, v => { if (v < 0.5) return false; c.globalAlpha = AL * v; c.lineWidth = Math.max(1, lw * 0.18); });
            for (let s = 0; s < strand; s++) { const sp = []; for (let j = 0; j <= N; j++) { const a = pts[Math.max(0, j - 1)], b = pts[Math.min(N, j + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, v = j / N, off = lw * (0.6 + 1.4 * (1 - v)) * (CEL ? 1.2 : 1) * Math.sin(j * 0.75 - gt * 11 + s * TAU / strand); sp.push([pts[j][0] - dy / l * off, pts[j][1] + dx / l * off]); }
              c.strokeStyle = s % 2 ? ACC : EDGE; chunked(c, sp, 4, v => { c.globalAlpha = AL * 0.75 * v; c.lineWidth = Math.max(1, lw * 0.2); }); }
            c.restore(); } }
          // the head: deep-purple pointed body, brilliant core, a halo
          if (ur < 1) { const p1 = mpos(m, u, ZC), p0 = mpos(m, Math.max(0, u - 0.03), ZC), a = P3(p1[0], p1[1], p1[2]), b = P3(p0[0], p0[1], p0[2]), ang = Math.atan2(a[1] - b[1], a[0] - b[0]), AL = dimAt(a[0], a[1], T, sz * 0.4) * sstep(0, 0.06, ur);
            glow(c, a[0], a[1], sz * 1.6, ENERGY, AL * 0.5); c.save(); c.translate(a[0], a[1]); c.rotate(ang); const L = sz * 2.4, Hh = L / 3; c.globalAlpha = AL; c.drawImage(missDSpr(), -L * 176 / 192, -Hh / 2, L, Hh); c.globalCompositeOperation = 'lighter'; c.drawImage(missLSpr(), -L * 176 / 192, -Hh / 2, L, Hh); c.restore(); glow(c, a[0], a[1], sz * 0.55, WHITE, AL * 0.5); }
        }
        /* --- the hold: the six circles feed their remaining light upward --- */
        const fd = sstep(ARR_END - 0.05, ARR_END + 0.3, t) * (1 - sstep(STK - 0.1, STK + 0.15, t));
        if (fd > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; for (const ci of circ) { const bx = X + ci.wx * T, by = Y + ci.wy * T * GY, ang = Math.atan2(SY - by, SX - bx), len = Math.hypot(SX - bx, SY - by) - RS * T * 0.6, AL = fd * dimSeg(bx, by, SX, SY, T, T * 0.1);
            H.ray(c, bx, by, ang, Math.max(1, len), T * (ci.i ? 0.12 : 0.22), EDGE, AL * (0.35 + 0.15 * Math.sin(gt * 14 + ci.i)));
            for (let j = 0; j < 3; j++) { const v = ((gt * 0.9 + j / 3 + ci.i * 0.17) % 1), px = bx + Math.cos(ang) * len * v, py = by + Math.sin(ang) * len * v, gsz = T * 0.14; c.globalAlpha = AL * Math.sin(v * Math.PI) * 0.9; blitSized(c, glowSprite(ACC), px - gsz, py - gsz, gsz * 2, gsz * 2); } } c.restore(); }
        /* --- the sphere --- */
        if (t > 2.2 && t < IMP + 0.2) { const fed = f.fed, grow = 0.16 + 0.84 * H.ease.out(fed), empty = sstep(STK, IMP + 0.04, t), hold = sstep(ARR_END + 0.2, STK, t);
          let jolt = 0; for (const rp of f.rip) { const q = (t - rp.t0) / 0.5; if (q > 0 && q < 1) jolt = Math.max(jolt, (1 - q) * (1 - q) * rp.w); }
          const r = RS * T * grow * (1 + 0.06 * jolt) * (1 - 0.88 * empty) * (1 + 0.025 * Math.sin(gt * 9) * hold), sq = 1 - 0.12 * hold + 0.1 * empty, AL = dimAt(SX, SY, T, r * 0.85) * sstep(2.2, 2.7, t) * (1 - sstep(IMP - 0.02, IMP + 0.12, t));
          drawSphere(c, SX, SY, r, sq, gt, t, f, { AL, fed, hold, empty, T });
          // the seed of light before the first arrival: a gathering glow at the convergence point
          if (fed < 0.2) { const k = sstep(2.2, 2.9, t) * (1 - fed / 0.2); glow(c, SX, SY, T * (0.6 + 0.4 * Math.sin(gt * 12)), ACC, AL * k * 0.8); glow(c, SX, SY, T * 1.6, ENERGY, AL * k * 0.6); } }
        /* --- the downward strike --- */
        if (t > STK && t < IMP + 0.4) { const k = cl((t - STK) / (IMP - STK)), r0 = RS * T, top = SY + r0 * 0.55 * (1 - 0.6 * k), tip = lerp(top, Y - T * 0.15, H.ease.in(k)), af = 1 - cl((t - IMP) / 0.4), bw = T * (0.5 + 0.06 * (ev - 1)) * (1 - 0.5 * cl((t - IMP) / 0.4)), AL = af * dimSeg(X, top, X, tip, T, bw * 0.6), len = Math.max(1, tip - top);
          c.save(); c.globalAlpha = AL * 0.9; c.drawImage(beamDSpr(), X - bw * 1.6, top, bw * 3.2, len); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL; c.drawImage(beamLSpr(), X - bw, top, bw * 2, len); c.globalAlpha = AL * 0.6; c.drawImage(beamLSpr(), X - bw * 0.45, top, bw * 0.9, len);
            // twisting streams round it
            c.lineCap = 'round'; const NSt = CEL ? 5 : ADE ? 4 : 3; for (let s = 0; s < NSt; s++) { c.beginPath(); for (let j = 0; j <= 16; j++) { const v = j / 16, yy = top + len * v, ph = v * 9 - gt * 16 + s * TAU / NSt, xx = X + Math.sin(ph) * bw * (1.1 + 0.3 * Math.sin(v * 5 + s)); j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.globalAlpha = AL * 0.35; c.strokeStyle = ENERGY; c.lineWidth = Math.max(2, bw * 0.3); c.stroke(); c.globalAlpha = AL * 0.75; c.strokeStyle = s % 2 ? ACC : EDGE; c.lineWidth = Math.max(1, bw * 0.08); c.stroke(); }
            c.restore();
          if (t < IMP) { glow(c, X, tip, bw * 3.4, EDGE, AL * 0.7); glow(c, X, tip, bw * 1.5, WHITE, AL * 0.8); c.save(); c.translate(X, tip); c.rotate(Math.PI / 2); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL; const L = bw * 4.4, Hh = L / 3; c.drawImage(missLSpr(), -L * 176 / 192, -Hh / 2, L, Hh); c.restore(); } }
        if (post < 0) return;
        /* ================= the annihilation blast ================= */
        const endK = cl((LIFE - t) / 0.8), RT = R * T;
        // the concentrated flash
        { const fl = Math.max(0, 1 - post / 0.32); if (fl > 0) { const AL = 0.4 + 0.6 * dimAt(X, Y - T * 0.6, T, T); glow(c, X, Y - T * 0.6, T * (1.0 + 2.6 * H.ease.out(cl(post / 0.12))), WHITE, AL * fl); glow(c, X, Y - T * 0.6, RT * 0.6 * (0.5 + 0.5 * H.ease.out(cl(post / 0.12))), ACC, AL * fl * 0.6); } }
        // the enormous expanding blast shell: a purple-black skin over a violet haze, rising off the floor
        { const q = cl(post / 0.8); if (q < 1) { const rr = RT * 1.15 * H.ease.out(q) * CROWN, ry = rr * 0.72, cy = Y - rr * 0.32, AL = (1 - q) * (0.55 + 0.45 * dimAt(X, Y - T * 0.5, T, T)); c.save(); c.globalAlpha = AL * 0.75; c.drawImage(bandSpr(), X - rr, cy - ry, rr * 2, ry * 2); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL; c.drawImage(shellBSpr(), X - rr, cy - ry, rr * 2, ry * 2); c.restore(); } }
        // rays thrown up out of the impact
        { const ra = Math.max(0, 1 - post / 0.7); if (ra > 0) { const NR = 9 + ev, AL = 0.4 + 0.6 * dimAt(X, Y - T, T, T); for (let i = 0; i < NR; i++) { const b = -Math.PI + (i + 0.5) / NR * Math.PI + Math.sin(i * 7.3) * 0.12, L = RT * (0.8 + 0.5 * R1(seed + i * 3)) * H.ease.out(cl(post / 0.25)); H.ray(c, X, Y - T * 0.3, b, L, T * (0.35 + 0.3 * R1(seed + i)), i % 3 ? EDGE : ACC, 0.5 * ra * AL); } } }
        // the column and the mushroom crown
        drawCloud(c, f, X, Y, T, gt, post, endK);
        // the glyphs lifting off the floor and coming apart
        { const N = []; for (const ci of circ) for (const gl of ci.gl) { if (gl.fx == null) { const a = ci.a0 - IMP * 0.14 * ci.dir + gl.a, rg = ci.r * 0.71; gl.fx = ci.wx + Math.cos(a) * rg; gl.fy = ci.wy + Math.sin(a) * rg; gl.ang = a; } const q = cl(post / (1.0 + gl.z * 0.45)); if (q >= 1) continue; const z = gl.z * H.ease.out(q) * (1 + 0.25 * ci.r), p = P3(gl.fx + Math.cos(gl.ang) * q * 0.5, gl.fy + Math.sin(gl.ang) * q * 0.5, z), sz = T * ci.gsz * 1.25 * (1 - 0.6 * q), a = sstep(0, 0.08, post) * (1 - q) * (1 - q) * dimAt(p[0], p[1], T); if (a <= 0.01) continue; c.save(); c.translate(p[0], p[1]); c.rotate(gl.rv * q); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 1.2); c.drawImage(glyphSpr(gl.k), -sz, -sz, sz * 2, sz * 2); c.restore(); } }
        // the debris: dark fragments thrown out, then the slow rain falling from the cloud
        for (const d of deb) { const a = (1 - cl((d.age - 1.4) / 0.7)) * endK; if (a <= 0.01) continue; const p = P3(d.wx, d.wy, d.z); frag(c, p[0], p[1], T * d.s, d.rot, a * dimAt(p[0], p[1], T), d.rest ? GY : 0); }
        for (const p of fall) { const a = sstep(0, 0.3, p.age) * (1 - cl((p.age - 2.4) / 0.8)) * cl(p.z / 0.4 + 0.2) * endK; if (a <= 0.01) continue; const s = P3(p.wx, p.wy, p.z); frag(c, s[0], s[1], T * p.s, p.rot, a * dimAt(s[0], s[1], T), 0); }
      } });
    function flareOf(t) { return sstep(IMP - 0.18, IMP, t) * (t < IMP ? 1 : 0); }
    /* one circle on the floor: dark under-disc, floor light, the traced outer layer, the counter-turning inner layer, the
       glyph band lighting in sequence, the seal, crawling sparks and sparks jumping between the rings */
    function drawCircle(c, X, Y, T, ci, t, S) {
      if (S.ap <= 0.01) return; const cx = X + ci.wx * T, cy = Y + ci.wy * T * GY, rp = ci.r * T * (1 + 0.12 * S.flare), a = S.ap, L = Math.min(1.6, S.lit), s = rp * 256 / 240;
      c.save(); c.translate(cx, cy); c.scale(1, GY);
      c.globalAlpha = a * 0.55; c.drawImage(markSpr(), -rp * 1.25, -rp * 1.25, rp * 2.5, rp * 2.5);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, a * (0.22 + 0.18 * S.pulse + 0.6 * S.fl + 0.5 * S.flare)); blitSized(c, glowSprite(ENERGY), -rp * 1.15, -rp * 1.15, rp * 2.3, rp * 2.3);
      if (S.tr > 0) { const ra = ci.a0 + t * 0.2 * ci.dir; c.save(); c.rotate(ra); if (S.tr < 1) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s * 1.5, 0, S.tr * TAU); c.closePath(); c.clip(); } c.globalAlpha = Math.min(1, a * L); c.drawImage(outerSpr(tier), -s, -s, s * 2, s * 2); c.restore();
        if (S.tr < 1) { const ha = ra + S.tr * TAU, hx = Math.cos(ha) * rp * 0.96, hy = Math.sin(ha) * rp * 0.96, gsz = T * 0.5; c.globalAlpha = a; blitSized(c, glowSprite(ACC), hx - gsz, hy - gsz, gsz * 2, gsz * 2); blitSized(c, glowSprite(WHITE), hx - gsz * 0.35, hy - gsz * 0.35, gsz * 0.7, gsz * 0.7); } }
      if (S.inn > 0) { const e = H.ease.out(S.inn); c.save(); c.rotate(ci.a0 * 0.7 - t * 0.34 * ci.dir); c.scale(0.75 + 0.25 * e, 0.75 + 0.25 * e); if (S.inn < 1) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s * 1.5, 0, -S.inn * TAU, true); c.closePath(); c.clip(); } c.globalAlpha = Math.min(1, a * L * e); c.drawImage(innerSpr(tier), -s, -s, s * 2, s * 2); c.restore(); }
      // the glyph band (turning against the outer ring), each glyph lighting in turn with a flash; they flare outward before the impact
      const gr = rp * 0.71 * (1 + 0.35 * S.flare), gsz = ci.gsz * T * (1 + 0.4 * S.flare), n = ci.gl.length, ga = ci.a0 - t * 0.14 * ci.dir;
      for (let j = 0; j < n; j++) { const gl = ci.gl[j], dt = t - (GL0 + ci.d + j / n * (GL1 - GL0) * 0.85); if (dt <= 0) continue; const b = Math.min(1, dt / 0.06) * (0.62 + 0.5 * Math.exp(-dt * 6) + 0.08 * Math.sin(t * 9 + j * 2.1)); c.save(); c.rotate(ga + gl.a); c.translate(gr, 0); c.rotate(Math.PI / 2); c.globalAlpha = Math.min(1, a * b * L); c.drawImage(glyphSpr(gl.k), -gsz, -gsz, gsz * 2, gsz * 2); c.restore(); }
      // the seal
      const sk = cl((t - SE0 - ci.d) / 0.25); if (sk > 0) { const ss = rp * 0.42 * (1 + 0.25 * Math.exp(-(t - SE0 - ci.d) * 5)); c.save(); c.rotate(t * 0.6 * ci.dir); c.globalAlpha = Math.min(1, a * sk * (0.75 + 0.25 * S.pulse + S.fl + S.flare)); c.drawImage(sealSpr(), -ss, -ss, ss * 2, ss * 2); c.restore(); }
      // sparks crawling round the inscriptions, and now and then one jumping between the rings
      if (S.tr >= 1) { for (let k = 0; k < 2; k++) { const b = ci.a0 + t * (1.4 + k * 0.5) * (k ? -ci.dir : ci.dir) + k * 2, rr = rp * (k ? 0.625 : 0.965), gsz = T * 0.16; c.globalAlpha = a * 0.9; blitSized(c, glowSprite(ACC), Math.cos(b) * rr - gsz, Math.sin(b) * rr - gsz, gsz * 2, gsz * 2); }
        const bk = Math.floor(t * 7 + ci.i * 3.1); if (R1(seed + bk * 7.7 + ci.i) < 0.45) { const b = R1(seed + bk * 3.3 + ci.i) * TAU, r0 = rp * 0.96, r1 = rp * 0.62; c.beginPath(); for (let j = 0; j <= 4; j++) { const v = j / 4, rr = lerp(r0, r1, v), bb = b + (j % 2 ? 1 : -1) * 0.05 * (j > 0 && j < 4 ? 1 : 0); j ? c.lineTo(Math.cos(bb) * rr, Math.sin(bb) * rr) : c.moveTo(Math.cos(bb) * rr, Math.sin(bb) * rr); } c.lineCap = 'round'; c.globalAlpha = a * 0.5; c.strokeStyle = EDGE; c.lineWidth = Math.max(2, T * 0.07); c.stroke(); c.globalAlpha = a; c.strokeStyle = ACC; c.lineWidth = 1.1; c.stroke(); } }
      c.restore();
    }
    /* the sphere: the air darkened round it, the bloom, the darker translucent shell; inside, counter-rotating bands
       (their far halves first), turning spiral currents and a lavender core; the near halves of the bands, the luminous
       rim, a specular, ripples racing across it from each arrival; sparks leaving its surface and curving back */
    function drawSphere(c, X0, Y0, r, sq, gt, t, f, P) {
      if (r < 2 || P.AL <= 0.01) return; const AL = P.AL, T = P.T, ch = 0.5 * P.fed + 0.5 * P.hold;
      c.save(); c.globalAlpha = AL * 0.75; c.drawImage(haloSpr(), X0 - r * 2.1, Y0 - r * 2.1 * sq, r * 4.2, r * 4.2 * sq); c.restore();
      glow(c, X0, Y0, r * 2.7, ENERGY, AL * (0.3 + 0.3 * ch)); glow(c, X0, Y0, r * 1.7, EDGE, AL * (0.08 + 0.2 * ch));
      c.save(); c.translate(X0, Y0); c.scale(1, sq);
      c.globalAlpha = AL * 0.95; c.drawImage(shellSpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
      const bandPts = bands.map(b => { const pr = b.b0 + gt * b.w, n = nrm([Math.sin(b.tilt) * Math.cos(pr), -Math.cos(b.tilt), Math.sin(b.tilt) * Math.sin(pr)]); return { b, n, pts: smallCircle(n, b.lat, 30, 0) }; });
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const B of bandPts) { sphPath(c, B.pts, r * 0.9, false); c.globalAlpha = AL * 0.12; c.strokeStyle = ENERGY; c.lineWidth = Math.max(2, r * 0.06); c.stroke(); c.globalAlpha = AL * 0.18; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, r * 0.015); c.stroke(); }
      // the currents: spiral arms turning in tilted planes (a counter-turning layer from Adept, a third at Celestial)
      const sw = swirlSpr(); for (let L = 0; L < (CEL ? 3 : ADE ? 2 : 1); L++) { c.save(); c.rotate([0.25, -0.5, 1.1][L]); c.scale(1, [0.55, 0.4, 0.75][L]); c.rotate(gt * [1.0, -1.5, 0.7][L]); const rr = r * [0.9, 0.78, 0.66][L]; c.globalAlpha = AL * [0.8, 0.6, 0.5][L] * (0.6 + 0.4 * ch); c.drawImage(sw, -rr, -rr, rr * 2, rr * 2); c.restore(); }
      // the lavender core (immense and layered at Celestial)
      const pu = 0.9 + 0.1 * Math.sin(gt * 7), cr = r * (0.42 + 0.16 * ch + (CEL ? 0.06 : 0));
      c.globalAlpha = AL * 0.7; blitSized(c, glowSprite(ENERGY), -r * 1.05, -r * 1.05, r * 2.1, r * 2.1);
      c.globalAlpha = AL * 0.75 * pu; blitSized(c, glowSprite(EDGE), -cr * 1.9, -cr * 1.9, cr * 3.8, cr * 3.8);
      c.globalAlpha = AL * 0.95 * pu; blitSized(c, glowSprite(ACC), -cr * 1.25, -cr * 1.25, cr * 2.5, cr * 2.5);
      c.globalAlpha = AL * 0.8 * pu; blitSized(c, glowSprite(WHITE), -cr * 0.6, -cr * 0.6, cr * 1.2, cr * 1.2); c.globalAlpha = AL * 0.9 * pu; blitSized(c, coreSpr(), -cr * 1.15, -cr * 1.15, cr * 2.3, cr * 2.3);
      if (CEL) { c.globalAlpha = AL * 0.5; c.strokeStyle = ACC; c.lineWidth = Math.max(1, r * 0.012); for (let k = 0; k < 3; k++) { const rr = cr * (0.55 + 0.2 * k); c.beginPath(); c.ellipse(0, 0, rr, rr * 0.35, gt * (k % 2 ? -1.6 : 1.2) + k, 0, TAU); c.stroke(); } }
      // the near halves of the bands, a bead running each
      for (const B of bandPts) { sphPath(c, B.pts, r * 0.9, true); c.globalAlpha = AL * 0.2; c.strokeStyle = ENERGY; c.lineWidth = Math.max(2, r * 0.06); c.stroke(); c.globalAlpha = AL * 0.5; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, r * 0.014); c.stroke();
        const bp = smallCircle(B.n, B.b.lat, 1, gt * B.b.sp)[0]; if (bp[2] > 0) { const gsz = r * 0.09; c.globalAlpha = AL * 0.9; blitSized(c, glowSprite(ACC), bp[0] * r * 0.9 - gsz, bp[1] * r * 0.9 - gsz, gsz * 2, gsz * 2); } }
      // the ripples of the arrivals
      for (const rp of f.rip) { const q = (t - rp.t0) / 0.7; if (q <= 0 || q >= 1) continue; const pts = smallCircle(rp.d, Math.PI / 2 - q * 1.9, 32, 0); sphPath(c, pts, r * 1.0, true); c.globalAlpha = AL * (1 - q) * 0.5 * rp.w; c.strokeStyle = EDGE; c.lineWidth = Math.max(2, r * 0.06 * (1 - q * 0.5)); c.stroke(); c.globalAlpha = AL * (1 - q) * 0.9; c.strokeStyle = ACC; c.lineWidth = Math.max(1, r * 0.015); c.stroke();
        if (q < 0.4 && rp.d[2] > -0.2) { const gsz = r * 0.5 * (1 - q / 0.4); c.globalAlpha = AL * (1 - q / 0.4); blitSized(c, glowSprite(WHITE), rp.d[0] * r - gsz, rp.d[1] * r - gsz, gsz * 2, gsz * 2); } }
      // the rim and a specular
      c.globalAlpha = AL * (0.65 + 0.35 * ch); c.drawImage(rimSpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
      c.globalAlpha = AL * 0.3; blitSized(c, glowSprite(ACC), -r * 0.66, -r * 0.7, r * 0.6, r * 0.6);
      // the underside blazing as it compresses
      if (P.hold > 0.01) { c.globalAlpha = AL * P.hold * 0.85; blitSized(c, glowSprite(ACC), -r * 0.8, r * 0.25, r * 1.6, r * 0.9); c.globalAlpha = AL * P.hold * 0.6; blitSized(c, glowSprite(WHITE), -r * 0.4, r * 0.5, r * 0.8, r * 0.45); }
      c.restore();
      // sparks escaping its surface and curving back in
      if (P.fed > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < NSP; k++) { const per = 1.1 + 0.4 * R1(seed + k), tk = gt + k * 0.37, cyc = Math.floor(tk / per), u = tk / per - cyc, a0 = R1(seed + k * 3.1 + cyc * 1.7) * TAU, dir = k % 2 ? 1 : -1;
          for (let j = 0; j < 3; j++) { const v = u - j * 0.05; if (v <= 0) continue; const ang = a0 + 0.9 * v * dir, d = r * (0.98 + 0.42 * Math.sin(Math.PI * v)), gsz = T * (0.09 - j * 0.022); c.globalAlpha = AL * Math.sin(Math.PI * v) * (1 - j * 0.3); blitSized(c, glowSprite(j ? EDGE : ACC), X0 + Math.cos(ang) * d - gsz, Y0 + Math.sin(ang) * d * sq - gsz, gsz * 2, gsz * 2); } } c.restore(); }
    }
    /* the column and the mushroom crown: a dark billowing column with violet light up its heart and a skirt rolling out at
       its foot; at its top a torus of puffs rolling outward over the top (dark folds above, violet-lit underneath), a
       dark cap, light inside it, sparks flickering through it; it rises, widens, darkens and thins away */
    function drawCloud(c, f, X, Y, T, gt, post, endK) {
      const ZC = f.ZC, rise = H.ease.out(cl(post / 1.2)), late = cl((post - 1.1) / 2.8), fadeK = sstep(0, 0.1, post) * (1 - sstep(2.6, 4.4, post)) * endK;
      const hcr = Math.min(ZC * 0.78, (1.2 + (ZC * 0.62 - 1.2) * rise) * CROWN) + late * 0.7, Rr = R * 0.3 * CROWN * (0.4 + 0.6 * rise) * (1 + 0.3 * late), rt = Rr * 0.52, wb = R * 0.085 * CROWN * (1 + 0.35 * late);
      f.crH = hcr; f.crR = Rr;
      if (fadeK <= 0.01) return;
      const B0 = ballSpr(0), B1 = ballSpr(1), B2 = ballSpr(2), PX = H.sx(H.me.x), PY = H.sy(H.me.y) - T * 0.45, dim = (px, py, pr) => 0.22 + 0.78 * sstep(T * 0.4, T * 1.6, Math.hypot(px - PX, py - PY) - pr * 0.75);
      const ball = (S, px, py, pr, a, sy) => { if (a <= 0.01 || pr < 1) return; c.globalAlpha = Math.min(1, a); c.drawImage(S, px - pr, py - pr * (sy || 1), pr * 2, pr * 2 * (sy || 1)); };
      c.save();
      // the skirt at its foot: dark balls rolling out along the floor, violet light under them
      { const N = H.n(12 + ev), rb = wb * T * (1.4 + 2.2 * rise + 1.2 * late); for (let i = 0; i < N; i++) { const a = i / N * TAU + post * 0.25, px = X + Math.cos(a) * rb, py = Y - T * 0.1 + Math.sin(a) * rb * 0.38, pr = wb * T * (1.0 + 0.35 * R1(seed + i * 3)) * (0.6 + 0.6 * rise); ball(i % 2 ? B1 : B0, px, py, pr, fadeK * 0.9 * dim(px, py, pr), 0.75); } }
      // the column: stacked billows (narrow at the waist, wider at the foot), the violet light up its heart, currents climbing it
      const topY = Y - hcr * T, hp = Y - topY, w = wb * T * (1 - 0.2 * late);
      { const NB = 11; for (let i = 0; i < NB; i++) { const v = (i + 0.5) / NB, roll = (post * 0.5 + i * 0.37) % 1, yy = Y - hp * v, wv = w * (1.15 - 0.45 * Math.sin(Math.PI * v * 0.85)), side = (i % 2 ? 1 : -1) * wv * 0.28 * Math.sin(roll * TAU), pr = wv * (0.95 + 0.15 * R1(seed + i)); ball(i % 3 === 1 ? B2 : B0, X + side, yy, pr, fadeK * dim(X, yy, pr) * (v > 0.85 ? 1 - (v - 0.85) / 0.3 : 1)); }
        c.globalCompositeOperation = 'lighter'; const NS = 5; for (let k = 0; k < NS; k++) { const y0 = Y - hp * k / NS, y1 = Y - hp * (k + 1) / NS, a = fadeK * (0.7 + 0.3 * (1 - cl(post / 0.8))) * (1 - late * 0.5) * dim(X, (y0 + y1) / 2, w * 0.4); c.globalAlpha = a; c.drawImage(beamLSpr(), X - w * 0.55, y1 - 1, w * 1.1, y0 - y1 + 2); }
        c.lineCap = 'round'; for (let i = 0; i < 2 + (ev >> 1); i++) { c.beginPath(); for (let k = 0; k <= 10; k++) { const u = k / 10, xx = X + Math.sin(u * 6 + post * 6 + i * 2.1) * w * (0.3 + 0.35 * u), yy = Y - hp * u; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.globalAlpha = fadeK * 0.5 * (1 - late) * dim(X, Y - hp * 0.5, hp * 0.3); c.strokeStyle = EDGE; c.lineWidth = Math.max(1, T * 0.05); c.stroke(); }
        c.globalCompositeOperation = 'source-over'; }
      // the crown: balls on a rolling torus (outward over the top, down the outside, in underneath): back half, the light
      // inside, the front half, then the dark cap whose folds roll over the top
      const items = []; for (const p of crown) { const psi = p.psi - post * p.v * 1.2, d = Rr + rt * Math.cos(psi), hh = hcr + rt * 0.66 * Math.sin(psi), px = X + Math.cos(p.phi) * d * T, py = Y - hh * T + Math.sin(p.phi) * d * T * 0.42; items.push({ px, py, top: Math.sin(psi), dep: Math.sin(p.phi) - 0.35 * Math.sin(psi), pr: rt * T * p.s * (0.85 + 0.25 * rise) }); }
      items.sort((a, b) => a.dep - b.dep);
      const lit = 1 - late * 0.65, drawI = it => ball(it.top < 0.15 ? B1 : it.top < 0.6 ? B2 : B0, it.px, it.py, it.pr, fadeK * dim(it.px, it.py, it.pr) * (it.top < 0.15 ? 0.6 + 0.4 * lit : 1));
      let i = 0; for (; i < items.length && items[i].dep < 0; i++) drawI(items[i]);
      const iy = Y - hcr * T, ir = (Rr + rt * 0.4) * T, da = dim(X, iy, ir); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fadeK * da * (0.6 + 0.2 * Math.sin(gt * 5)) * lit; blitSized(c, glowSprite(ENERGY), X - ir * 1.3, iy - ir * 0.75, ir * 2.6, ir * 1.5); c.globalAlpha = fadeK * da * 0.55 * lit; blitSized(c, glowSprite(EDGE), X - ir * 0.8, iy - ir * 0.25, ir * 1.6, ir * 0.7); c.globalCompositeOperation = 'source-over';
      for (; i < items.length; i++) drawI(items[i]);
      { const uy = iy + rt * T * 0.45, ux = (Rr + rt * 0.9) * T, ua = fadeK * dim(X, uy, ux * 0.5) * lit; c.globalCompositeOperation = 'lighter'; c.globalAlpha = ua * 0.55; blitSized(c, glowSprite(EDGE), X - ux, uy - rt * T * 0.45, ux * 2, rt * T * 0.9); c.globalAlpha = ua * 0.4; blitSized(c, glowSprite(ACC), X - ux * 0.55, uy - rt * T * 0.2, ux * 1.1, rt * T * 0.4); c.globalCompositeOperation = 'source-over'; }
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + post * 0.35, d = Rr * (k % 2 ? 0.25 : 0.6) * T, px = X + Math.cos(a) * d, py = Y - (hcr + rt * 0.85) * T + Math.sin(a) * d * 0.4 - (k % 2 ? rt * T * 0.2 : 0), pr = rt * T * (0.95 + 0.2 * R1(seed + k)) * (0.75 + 0.25 * rise); ball(k % 2 ? B0 : B2, px, py, pr, fadeK * dim(px, py, pr), 0.85); }
      // fine sparks flickering through the layers
      c.globalCompositeOperation = 'lighter'; const bk = Math.floor(gt * 12); for (let k = 0; k < 10 + ev; k++) { const a = R1(seed + bk * 3.1 + k * 7.7) * TAU, d = (Rr + rt * (R1(seed + bk + k * 5.3) - 0.5) * 1.6) * T, hh = hcr + rt * (R1(seed + bk * 1.7 + k) - 0.5) * 1.4, gsz = T * (0.07 + 0.06 * R1(k + bk)), px = X + Math.cos(a) * d, py = Y - hh * T + Math.sin(a) * d * 0.42; c.globalAlpha = fadeK * 0.9 * lit * dim(px, py, 0); blitSized(c, glowSprite(k % 3 ? EDGE : ACC), px - gsz, py - gsz, gsz * 2, gsz * 2); }
      c.restore();
    }
    /* ================= (v391 U3) the GPU picture: the same timeline, numbers and choreography, painted by ANNIH_GFX =================
       The floor layer (drawUnder) and the air layer (draw) are each one GL frame laid into the game canvas. Particles are
       pooled objects stepped in update() and drawn as one batch of point sprites. */
    const PMAX = H.n(1400), pool = [], live = [];
    for (let i = 0; i < PMAX; i++) pool.push({ wx: 0, wy: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, dr: 0, age: 0, life: 1, s: 1, col: EDGE, ty: 0, dark: false, a: 1, rot: 0, vr: 0, up: 0 });
    function emit(o) { const p = pool.pop(); if (!p) return null; p.wx = o.wx || 0; p.wy = o.wy || 0; p.z = o.z || 0; p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0; p.g = o.g || 0; p.dr = o.dr || 0; p.age = 0; p.life = o.life || 0.6; p.s = o.s || 0.08;
      p.col = o.col || EDGE; p.ty = o.ty || 0; p.dark = !!o.dark; p.a = o.a == null ? 1 : o.a; p.rot = o.rot || 0; p.vr = o.vr || 0; p.up = o.up || 0; live.push(p); return p; }
    function stepPool(dt) { for (let i = live.length - 1; i >= 0; i--) { const p = live[i]; p.age += dt; if (p.age >= p.life) { live[i] = live[live.length - 1]; live.pop(); pool.push(p); continue; }
      const dk = Math.max(0, 1 - p.dr * dt); p.vx *= dk; p.vy *= dk; p.vz = p.vz * dk - p.g * dt + p.up * dt; p.wx += p.vx * dt; p.wy += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.25; p.vx *= 0.6; p.vy *= 0.6; } } }
    const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
    /* the GPU path's particles (the 2D path keeps the game's own) */
    function gpuEmit(f, dt) { const t = f.t, ZC = f.ZC || 6, Q = H.Q(), post = t - IMP;
      if (t < 0.8) for (const ci of circ) if (Math.random() < 14 * dt * Q) emit({ wx: ci.wx + rnd(-0.15, 0.15) * (1 + ci.r * 0.3), wy: ci.wy, z: rnd(0, 0.4), vx: rnd(-0.4, 0.4), vz: rnd(5, 9.5), life: rnd(0.35, 0.7), s: rnd(0.05, 0.1), col: pick([EDGE, ACC, ACC]), ty: 1, dr: 0.6 });
      if (t > TR0 && t < TR1) for (const ci of circ) if (Math.random() < 9 * dt * Q) { const a = ci.a0 + t * 0.2 * ci.dir + cl((t - TR0 - ci.d) / (TR1 - TR0)) * TAU; emit({ wx: ci.wx + Math.cos(a) * ci.r, wy: ci.wy + Math.sin(a) * ci.r, z: 0.05, vx: rnd(-1, 1), vy: rnd(-1, 1), vz: rnd(1.5, 3.2), g: 3, life: 0.4, s: 0.06, col: ACC, ty: 1, dr: 1.5 }); }
      for (const m of MS) { if (m.gpuGo == null && t >= m.L) { m.gpuGo = 1; const ci = m.ci, n = H.n(m.central ? 34 : 18); for (let j = 0; j < n; j++) { const b = Math.random() * TAU, v = rnd(2, 6) * (m.central ? 1.3 : 1); emit({ wx: ci.wx, wy: ci.wy, z: 0.1, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: rnd(1, 5), g: 6, life: rnd(0.35, 0.7), s: rnd(0.06, 0.11), col: pick([EDGE, ACC, WHITE]), ty: 1, dr: 2.2 }); } }
        const u = (t - m.L) / m.FT; if (u > 0 && u < 1 && Math.random() < 30 * dt * Q) { const p = mpos(m, u, ZC); emit({ wx: p[0] + rnd(-0.12, 0.12), wy: p[1] + rnd(-0.12, 0.12), z: p[2], vx: rnd(-1, 1), vy: rnd(-1, 1), vz: rnd(-1, 1), g: 1, life: rnd(0.35, 0.7), s: rnd(0.05, 0.1), col: pick([EDGE, ACC, ENERGY]), ty: Math.random() < 0.5 ? 1 : 0, dr: 1.4 }); } }
      if (t > ARR_END && t < STK && Math.random() < 18 * dt * Q) { const ci = circ[Math.floor(Math.random() * 6)], b = Math.random() * TAU, rr = Math.random() * ci.r, life = 0.75; emit({ wx: ci.wx + Math.cos(b) * rr, wy: ci.wy + Math.sin(b) * rr, z: 0, vx: -(ci.wx + Math.cos(b) * rr) / life * 0.75, vy: -(ci.wy + Math.sin(b) * rr) / life * 0.75, vz: ZC * 0.8 / life, life, s: 0.07, col: pick([ACC, EDGE]), ty: 1 }); }
      if (post >= 0 && !f.gpuBoom) { f.gpuBoom = 1; const n = H.n(90 + 8 * ev);
        for (let j = 0; j < n; j++) { const b = Math.random() * TAU, v = rnd(4, 13) + 0.3 * ev, el = rnd(0.1, 1.2); emit({ wx: Math.cos(b) * 0.3, wy: Math.sin(b) * 0.3, z: 0.4, vx: Math.cos(b) * v * Math.cos(el), vy: Math.sin(b) * v * Math.cos(el), vz: Math.sin(el) * v * 0.9 + 2, g: 9, life: rnd(0.5, 1.2), s: rnd(0.06, 0.13), col: pick([EDGE, ACC, ACC, WHITE]), ty: 1, dr: 1.2 }); }
        for (let j = 0; j < H.n(40 + 3 * ev); j++) { const b = Math.random() * TAU, rr = Math.random() * R * 0.5; emit({ wx: Math.cos(b) * rr, wy: Math.sin(b) * rr, z: rnd(0.2, 1.5), vx: Math.cos(b) * rnd(0.3, 1.5), vy: Math.sin(b) * rnd(0.3, 1.5), vz: rnd(0.5, 2.5), up: 0.6, life: rnd(1.4, 3.2), s: rnd(0.05, 0.1), col: pick([EDGE, ACC, ENERGY]), ty: 0, dr: 0.8 }); }
        for (let j = 0; j < H.n(26 + 2 * ev); j++) { const b = Math.random() * TAU, v = rnd(3, 9); emit({ wx: Math.cos(b) * 0.4, wy: Math.sin(b) * 0.4, z: 0.5, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: rnd(3, 9), g: 13, life: rnd(1.2, 2.2), s: rnd(0.12, 0.24) + 0.01 * ev, col: VOID, ty: 2, dark: true, rot: Math.random() * TAU, vr: rnd(-12, 12), dr: 0.5 }); } }
      if (post > 0.3 && post < 4 && Math.random() < 26 * dt * Q * (1 - post / 4)) { const b = Math.random() * TAU, rr = Math.random() * R * 0.9, hz = Math.random() * f.crH, ash = Math.random() < 0.45;
        emit({ wx: Math.cos(b) * rr, wy: Math.sin(b) * rr, z: hz, vx: rnd(-0.4, 0.4), vy: rnd(-0.2, 0.2), vz: ash ? rnd(-0.6, -0.2) : rnd(0.2, 0.9), life: rnd(1.4, 2.4), s: ash ? rnd(0.05, 0.09) : rnd(0.04, 0.08), col: ash ? '#1A0F28' : pick([EDGE, ACC]), ty: 0, dark: ash, dr: 0.4, a: ash ? 0.7 : 1 }); }
      for (const ci of circ) for (const gl of ci.gl) if (!gl.gdust && gl.fx != null && post > 0.6 + gl.z * 0.35) { gl.gdust = 1; if (Math.random() < 0.8 * Q) for (let j = 0; j < 4; j++) { const b = Math.random() * TAU; emit({ wx: gl.fx, wy: gl.fy, z: gl.z * 0.9 * (1 + 0.25 * ci.r), vx: Math.cos(b) * 1.2, vy: Math.sin(b) * 0.6, vz: rnd(-0.5, 1), life: 0.6, s: 0.05, col: pick([EDGE, ACC]), ty: 0, dr: 1.5 }); } }
      stepPool(dt); }
    /* the pool into the batch (screen streaks follow each spark's motion) */
    function gpuParts(Q, X, Y, T, endK) { for (const p of live) { const u = p.age / p.life, k = Math.min(1, p.age / 0.05) * (1 - u) * (1 - u * 0.3) * endK * p.a; if (k < 0.01) continue; const sx = X + p.wx * T, sy = Y + p.wy * T * GY - p.z * T;
        if (p.ty === 1) { const vx = p.vx * T, vy = p.vy * T * GY - p.vz * T, sp = Math.hypot(vx, vy), L = Math.min(T * 0.9, sp * 0.05) + T * p.s; Q.pt(sx, sy, Math.max(L * 2, T * p.s * 2), p.col, k, 1, Math.atan2(vy, vx), Math.max(1, L / (T * p.s * 0.75))); }
        else if (p.ty === 2) Q.pt(sx, sy, T * p.s * 2, p.col, Math.min(1, k * 1.6), 2, p.rot, 1, true);
        else Q.pt(sx, sy, T * p.s * 2.6, p.col, k * (p.dark ? 0.8 : 0.9), 0, 0, 1, p.dark); } }
    const ribbon = (Q, pts, col, al, sh, f0, core, f1, flow, solid) => Q.strip(pts, col, al, [sh || 3.2, f0 || 0, core || 0, f1 || 0], [flow || 0, 2, 0, 1], solid);
    /* a soft column of light from (x0, y0) to (x1, y1), built like the cast beam: a wide faint halo, a paler body and a near-white core, each one ribbon; it sways (sw px) */
    function column(Q, x0, y0, x1, y1, w, al, o) { o = o || {}; const n = 12, P0 = [], P1 = [], P2 = [], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, tt = o.t || 0;
      for (let i = 0; i <= n; i++) { const v = i / n, sw = (o.sw || 0) * Math.sin(v * 2.4 + tt * 1.3) * v, x = x0 + dx * v + nx * sw, y = y0 + dy * v + ny * sw, wk = 1 - (o.taper || 0) * v; P0.push([x, y, w * 2.8 * wk, 1]); P1.push([x, y, w * 1.45 * wk, 1]); P2.push([x, y, w * 0.38 * wk, 1]); }
      const fs = o.f0 == null ? 0.05 : o.f0, fe = o.f1 == null ? 0.6 : o.f1;
      ribbon(Q, P0, o.c0 || ENERGY, al * 0.7, 3.0, fs, 0, fe, 0.06); ribbon(Q, P1, o.c1 || EDGE, al * 0.95, 3.2, fs, 0.35, fe * 0.92, 0.05); ribbon(Q, P2, o.c2 || ACC, al * 0.8, 2.6, fs, 1, fe * 0.85, 0.04);
      if (o.dark) ribbon(Q, P1, PLUM, al * o.dark, 2.4, fs, 0, fe, 0, true); }
    function circleQ(Q, ci, cx, cy, rp, lay, rotA, q2, q3, al, ws, extra) { const s = rp * 1.12, pxu = 1 / Math.max(1, rp * GY * Q.k); Q.quad(3, cx, cy, s, 0, 0, s * GY, EDGE, al, [lay, rotA, q2, q3], [ws || 1, pxu, extra || 0, 0]); }
    function gpuUnder(Q, f, X, Y, T, gt) {
      const t = f.t, post = t - IMP, endK = cl((LIFE - t) / 0.8);
      const gone = post > 0 ? cl(post / 0.18) : 0, holdK = sstep(ARR_END - 0.1, STK, t), flare = sstep(IMP - 0.18, IMP, t);
      if (gone < 1) for (const ci of circ) {
        const ap = sstep(0.05 + ci.d, 0.35 + ci.d, t) * (1 - gone); if (ap <= 0.01) continue;
        const tr = cl((t - TR0 - ci.d) / (TR1 - TR0)), inn = cl((t - IN0 - ci.d) / (IN1 - IN0)), m = MS.find(q => q.ci === ci), fl = t > m.L ? Math.exp(-(t - m.L) * 5) : 0;
        const pulse = holdK * (0.5 + 0.5 * Math.sin((t - ARR_END) * TAU * 2.2)), feedDim = 1 - 0.4 * sstep(ARR_END + 0.2, STK, t), fk = ci.i === 0 ? flare : 0, lit = Math.min(1.6, (0.7 + 0.3 * pulse) * feedDim + fl * 0.8 + fk);
        const cx = X + ci.wx * T, cy = Y + ci.wy * T * GY, rp = ci.r * T * (1 + 0.12 * fk), a = ap;
        Q.shade(cx, cy, rp * 1.32, rp * 1.32 * GY, VOID, a * 0.5, 0.35);
        Q.glow(cx, cy, rp * 1.3, ENERGY, a * (0.3 + 0.2 * pulse + 0.6 * fl + 0.5 * fk), GY, 2.2, 0.9, 0, 0);
        Q.glow(cx, cy, rp * 0.55, EDGE, a * (0.18 + 0.4 * fl + 0.4 * fk) * sstep(SE0, SE0 + 0.4, t), GY, 3, 0.6, 0, 0);
        const ra = ci.a0 + t * 0.2 * ci.dir;
        if (tr > 0) { circleQ(Q, ci, cx, cy, rp, 0, ra, tr, tier, Math.min(1, a * lit), 1);
          if (tr < 1) { const ha = ra + tr * TAU, hx = cx + Math.cos(ha) * rp * 0.96, hy = cy + Math.sin(ha) * rp * 0.96 * GY; Q.glow(hx, hy, T * 0.6, ACC, a * 0.9, 1, 5, 0.8, 0, 0); Q.glow(hx, hy, T * 0.2, WHITE, a, 1, 4, 0, 0.5, 0); }
          if (tr > 0.3) circleQ(Q, ci, cx, cy - T * (0.1 + 0.12 * ci.r), rp * 0.94, 4, -ra * 0.6, 1, tier, a * lit * 0.32 * sstep(0.3, 1, tr), 2.8); }
        if (inn > 0) { const e = H.ease.out(inn); circleQ(Q, ci, cx, cy, rp * (0.75 + 0.25 * e), 1, ci.a0 * 0.7 - t * 0.34 * ci.dir, inn, tier, Math.min(1, a * lit * e), 1); }
        const g0 = GL0 + ci.d; if (t > g0) circleQ(Q, ci, cx, cy, rp * (1 + 0.35 * fk), 3, ci.a0 - t * 0.14 * ci.dir, ci.gl.length + (seed % 97) / 100, t - g0, Math.min(1, a * lit), 1, ci.gsz / ci.r);
        const sk = cl((t - SE0 - ci.d) / 0.25); if (sk > 0) { const ss = rp * 0.42 * (1 + 0.25 * Math.exp(-(t - SE0 - ci.d) * 5)), s13 = ss * 1.3; Q.quad(3, cx, cy, s13, 0, 0, s13 * GY, EDGE, Math.min(1, a * sk * (0.75 + 0.25 * pulse + fl + fk)), [2, t * 0.6 * ci.dir, 0, 0], [1, 1 / Math.max(1, ss * GY * Q.k), 0, 0]); }
        if (tr >= 1) { for (let k = 0; k < 2; k++) { const b = ci.a0 + t * (1.4 + k * 0.5) * (k ? -ci.dir : ci.dir) + k * 2, rr = rp * (k ? 0.625 : 0.965); Q.glow(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr * GY, T * 0.22, ACC, a * 0.85, 1, 5, 0.6, 0.4, 0); }
          const bk = Math.floor(t * 7 + ci.i * 3.1); if (R1(seed + bk * 7.7 + ci.i) < 0.45) { const b = R1(seed + bk * 3.3 + ci.i) * TAU, P = []; for (let j = 0; j <= 6; j++) { const v = j / 6, rr = lerp(rp * 0.96, rp * 0.62, v), bb = b + Math.sin(v * 9 + bk) * 0.04; P.push([cx + Math.cos(bb) * rr, cy + Math.sin(bb) * rr * GY, T * 0.07, 1]); } ribbon(Q, P, ACC, a * 0.8, 3, 0.2, 0.8, 0.2); } } }
      if (post <= 0) return;
      const RT = R * T;
      // the fractured circles: glowing arcs flung outward, fading
      { const q = cl(post / 1.5), sa = (1 - q) * (1 - q) * endK; if (sa > 0.01) for (const ci of circ) { const cx = X + ci.wx * T, cy = Y + ci.wy * T * GY;
          for (let L2 = 0; L2 < 3; L2++) { const rr0 = ci.r * T * [0.97, 0.71, 0.6][L2], ex = (0.6 + 1.6 * R1(seed + ci.i * 41 + L2 * 13)) * T * H.ease.out(cl(post / 1.2)) * (1 + ci.r * 0.3), rr = rr0 + ex, Rq = rr * 1.25, n = 5 + L2 + (ci.i ? 0 : 3);
            Q.quad(2, cx, cy, Rq, 0, 0, Rq * GY, EDGE, sa * (L2 ? 0.75 : 1), [0.8, Math.max(0.012, T * 0.06 / Rq), 0, n], [R1(seed + ci.i + L2), 0.28, seed % 7, 0]); } } }
      // the cracks: light only, racing out, glowing, gone within ~2.5 s
      { const fg = H.ease.out(cl(post / 0.5)), fk = (1 - cl((post - 0.7) / 1.8)) * endK; if (fk > 0.01) Q.quad(6, X, Y, RT * 1.1, 0, 0, RT * 1.1 * GY, EDGE, fk, [fg * 1.05, 1, (seed % 89) / 89, 1], [0, 0, 0, 0]); }
      // the floor flash, then a slowly dying violet glow at the centre
      Q.glow(X, Y, RT * 1.25, ACC, 0.75 * Math.max(0, 1 - post / 0.45), GY, 2.2, 0.8, 0.3, 0);
      Q.glow(X, Y, RT * (0.75 + 0.3 * cl(post / 1.5)), ENERGY, (0.5 * Math.exp(-post / 1.6) + 0.06) * endK, GY, 2, 1, 0, 0); Q.glow(X, Y, RT * 0.35, EDGE, 0.55 * Math.exp(-post / 1.2) * endK, GY, 3, 0.5, 0.2, 0);
      // the shockwaves along the floor: a dark band with a violet edge, light rings after it, the widest last
      const waves = CEL ? [[0, 1.0, 1, 0], [0.1, 1.2, 0.7, 1], [0.26, 1.5, 0.5, 1]] : ADE ? [[0, 1.0, 1, 0], [0.12, 1.25, 0.7, 1], [0.3, 1.4, 0.35, 1]] : [[0, 1.0, 1, 0], [0.12, 1.25, 0.7, 1]];
      for (const [d, sc, w, L2] of waves) { const qq = cl((post - d) / 0.85); if (qq > 0 && qq < 1) { const rr = RT * 1.2 * sc * H.ease.out(qq), Rq = rr * 1.2, a = (1 - qq) * w;
          if (!L2) Q.quad(2, X, Y, Rq, 0, 0, Rq * GY, '#1E0C36', a * 0.7, [0.79, 0.07, 0.15, 0], [0, 0, 1, 0], true);
          Q.quad(2, X, Y, Rq, 0, 0, Rq * GY, L2 ? ACC : EDGE, a * (L2 ? 0.8 : 1), [0.83, L2 ? 0.025 : 0.035, 0, 0], [0, 0, 2, 0]); } }
      { const qs = cl(post / 0.8); if (qs < 1) { const rr = RT * 1.2 * H.ease.out(qs), NS = 22 + 3 * ev; for (let i = 0; i < NS; i++) { const a = i / NS * TAU + R1(seed + i * 3) * 0.2, l = rr * (0.18 + 0.2 * R1(seed + i * 7)), c = Math.cos(a), s = Math.sin(a);
          ribbon(Q, [[X + c * (rr - l), Y + s * (rr - l) * GY, T * 0.05, 0.5], [X + c * rr * 0.99, Y + s * rr * 0.99 * GY, T * 0.07, 1]], ACC, (1 - qs) * 0.75, 3, 0.35, 0.6, 0.25); } } }
      // low rolling mist from the centre outward, thinning
      { const mk = (1 - cl((post - 0.6) / 2.6)) * endK; if (mk > 0.01) { const N = H.n(14 + 2 * ev); for (let i = 0; i < N; i++) { const a = i / N * TAU + R1(seed + i) * 0.4, d = R * (0.12 + 0.15 * R1(seed + i * 2)) + R * (0.5 + 0.45 * R1(seed + i * 3)) * H.ease.out(cl(post / 1.6)), px = X + Math.cos(a) * d * T, py = Y + Math.sin(a) * d * T * GY, pr = T * (0.75 + 0.6 * R1(seed + i * 5)) * (0.8 + 0.9 * cl(post / 1));
          Q.quad(14, px, py - pr * 0.15, pr * 1.2, 0, 0, pr * 0.72, '#2A1640', mk * 0.75 * cl(post / 0.2), [post * 0.3, R1(seed + i * 9) * 10, 0, 0], [0, 0, 0, 0.5], true); } } }
    }
    function gpuOver(Q, f, X, Y, T, gt, c) {
      const t = f.t, post = t - IMP, SC = scr(c), ZC = f.ZC, SX = X, SY = Y - ZC * T, P3 = (wx, wy, z) => [X + wx * T, Y + wy * T * GY - z * T], endK = cl((LIFE - t) / 0.8), RT = R * T;
      // the screen distortion: the frame refracted round the blast's front, shimmering over its heart (drawn first, under the light)
      if (post > 0 && post < 1.6 && !Q.low) { const q = cl(post / 0.8), Rd = RT * 1.15 * H.ease.out(q) * CROWN, Hd = RT * 1.9 * CROWN, k = (1 - cl(post / 1.6)); Q.snap = true;
        Q.quad(15, X, Y - RT * 0.25, Hd, 0, 0, Hd, '#FFFFFF', 1, [Math.max(0.02, Rd / Hd), 0.07 + 0.05 * q, 16 * Q.k * (1 - q) * (q < 1 ? 1 : 0), 0.55 * k], [0, 0, 0, 0], true);
        Q.quad(15, X, Y - f.crH * T * 0.55, RT * 0.8, 0, 0, RT * 1.1, '#FFFFFF', sstep(0.15, 0.5, post) * k, [0.01, 0.01, 7 * Q.k, 1], [0, 0, 0, 0], true); }
      // the six lights awakening: soft volumetric columns, dark energy curling round their edges
      if (t < TR1 + 0.3) for (const ci of circ) { const u = t - ci.d * 0.5, k = sstep(0, 0.12, u) * (1 - sstep(TR0 + 0.2, TR1 + 0.25, t)); if (k <= 0.01) continue;
        const bx = X + ci.wx * T, by = Y + ci.wy * T * GY, hp = T * (2.8 + 1.8 * ci.r) * (0.4 + 0.6 * H.ease.out(cl(u / 0.25))), w = T * (0.16 + 0.1 * ci.r) * (1 + 0.6 * sstep(TR0, TR1, t));
        column(Q, bx, by + w * 0.2, bx, by - hp, w, k * 0.5, { t: gt + ci.i, sw: T * 0.08, f0: 0.04, f1: 0.62, taper: 0.25, dark: 0.3 });
        for (let s = 0; s < 2; s++) { const P = []; for (let j = 0; j <= 14; j++) { const v = j / 14; P.push([bx + Math.sin(v * 7 - t * 7 + s * Math.PI + ci.i) * w * (0.75 + 0.6 * v), by - hp * v * 0.85, w * 0.2, 1]); } ribbon(Q, P, '#1A0A2E', k * 0.45, 2.6, 0.1, 0, 0.5, 0, true); ribbon(Q, P, EDGE, k * 0.35, 3, 0.1, 0.3, 0.5); }
        Q.glow(bx, by - T * 0.1, w * 3.2, EDGE, k * 0.35, 1, 3, 0.6); Q.glow(bx, by - T * 0.1, w * 1.1, WHITE, k * 0.4, 1, 4, 0.2); Q.glow(bx, by, w * 4, ENERGY, k * 0.4, GY, 2.5, 0.6); }
      // shadow shards rising and hanging over the circles: obsidian, a violet rim (pulled up into the light at the launch)
      if (t < IMP + 0.05) for (const s of shards) { const m = MS[s.ci.i === 0 ? 5 : s.ci.i - 1], up = sstep(m.L - 0.05, m.L + 0.5, t), a = sstep(s.t0, s.t0 + 0.5, t) * (1 - up); if (a <= 0.01) continue;
        const z = s.z0 * sstep(s.t0, s.t0 + 1.2, t) + 0.08 * Math.sin(gt * 1.6 + s.ph) + up * 2.5, rr = s.ci.r * s.rr * (1 - up * 0.6), p = P3(s.ci.wx + Math.cos(s.a + gt * 0.2) * rr, s.ci.wy + Math.sin(s.a + gt * 0.2) * rr, z), hs = T * s.s * 1.25;
        Q.quad(16, p[0], p[1], hs, 0, 0, hs, VOID, a, [s.rot + gt * 0.8, 1 / Math.max(1, hs * Q.k), 1, 0], [0, 0, 0, 1], true); Q.quad(16, p[0], p[1], hs, 0, 0, hs, EDGE, a, [s.rot + gt * 0.8, 1 / Math.max(1, hs * Q.k), 1, 0], [0, 0, 0, 1]); Q.glow(p[0], p[1] + hs * 0.3, hs * 2.2, ENERGY, a * 0.25, 1, 3, 0.5); }
      // Celestial: two raised rings turning over the giant circle, threads of light to the floor
      if (CEL && t < IMP + 0.3) { const k = sstep(1.0, 1.8, t) * (1 - sstep(IMP, IMP + 0.3, t)), G0 = circ[0]; if (k > 0.01) for (let j = 0; j < 2; j++) { const z = (0.9 + 0.75 * j) * sstep(1.0, 2.0, t) + 0.05 * Math.sin(gt * 2 + j) + (post > 0 ? post * 3 : 0), rr = G0.r * T * (0.78 - 0.2 * j) * (1 + 0.3 * Math.max(0, post) / 0.3), cy = Y - z * T, AL = k * (0.8 + 0.4 * flareOf(t)), ra = gt * (j ? -0.5 : 0.35);
          circleQ(Q, G0, X, cy, rr, 0, ra, 1, 2, AL * 0.75, 1.3); Q.glow(X, cy, rr * 1.2, ENERGY, AL * 0.25, GY, 2, 0.6);
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + ra; ribbon(Q, [[X + Math.cos(a) * rr, cy + Math.sin(a) * rr * GY, T * 0.04, 1], [X + Math.cos(a) * G0.r * T * 0.97, Y + Math.sin(a) * G0.r * T * 0.97 * GY, T * 0.03, 0.6]], EDGE, AL * 0.45, 3, 0.15, 0.4, 0.15); } } }
      // the missiles: soft trails (a dark body under a violet light, a pale thread, spiralling strands), the lingering pattern, pointed heads
      const strand = CEL ? 3 : ADE ? 2 : 1;
      if (t > 2 && t < STK + 0.3) for (const m of MS) { const ur = (t - m.L) / m.FT; if (ur <= 0) continue; const u = Math.min(1, ur), sz = T * (1.0 + 0.07 * (ev - 1)) * m.s, lw = sz * 0.34;
        const lk = ur < 1 ? 1 : 1 - sstep(0.25, 1.3, t - m.arr); if (lk > 0.01) { const N = 18, P = []; for (let j = 0; j <= N; j++) { const p = mpos(m, u * j / N, ZC), s = P3(p[0], p[1], p[2]); P.push([s[0], s[1], lw * 0.55, 1]); } ribbon(Q, P, ENERGY, lk * 0.35, 3, 0.08, 0, 0.04); ribbon(Q, P.map(q => [q[0], q[1], lw * 0.18, 1]), EDGE, lk * 0.55, 3, 0.08, 0.5, 0.04); }
        if (ur < 1.35) { const u1 = u, u0 = Math.max(0, Math.min(1, ur) - 0.42) + Math.max(0, ur - 1) * 1.5, N = 16; if (u1 - u0 > 0.01) { const pts = []; for (let j = 0; j <= N; j++) { const p = mpos(m, lerp(u0, u1, j / N), ZC); pts.push(P3(p[0], p[1], p[2])); } const AL = ur > 1 ? 1 - cl((ur - 1) / 0.35) : 1;
            const tw = (sc, pw) => pts.map((p, j) => { const v = j / N; return [p[0], p[1], lw * sc * (0.3 + 0.7 * v), Math.pow(v, pw)]; });
            ribbon(Q, tw(1.5, 1.2), PLUM, AL * 0.55, 2.6, 0, 0, 0.04, 0, true); ribbon(Q, tw(1.9, 1.4), ENERGY, AL * 0.75, 2.8, 0, 0, 0.03, 0.08); ribbon(Q, tw(0.8, 1.2), EDGE, AL * 0.9, 3, 0, 0.6, 0.03); ribbon(Q, tw(0.28, 2), ACC, AL, 3, 0, 1, 0.03);
            for (let s = 0; s < strand; s++) { const sp = []; for (let j = 0; j <= N; j++) { const a = pts[Math.max(0, j - 1)], b = pts[Math.min(N, j + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, v = j / N, off = lw * (0.6 + 1.4 * (1 - v)) * (CEL ? 1.2 : 1) * Math.sin(j * 0.6 - gt * 11 + s * TAU / strand); sp.push([pts[j][0] - dy / l * off, pts[j][1] + dx / l * off, lw * 0.16, Math.pow(v, 1.3)]); }
              ribbon(Q, sp, s % 2 ? ACC : EDGE, AL * 0.8, 3, 0, 0.5, 0.05); } } }
        if (ur < 1) { const p1 = mpos(m, u, ZC), p0 = mpos(m, Math.max(0, u - 0.03), ZC), a = P3(p1[0], p1[1], p1[2]), b = P3(p0[0], p0[1], p0[2]), ang = Math.atan2(a[1] - b[1], a[0] - b[0]), AL = sstep(0, 0.06, ur), c0 = Math.cos(ang), s0 = Math.sin(ang), L = sz * 1.15, Hh = sz * 0.36;
          Q.quad(10, a[0] - c0 * L * 0.25, a[1] - s0 * L * 0.25, c0 * L * 1.1, s0 * L * 1.1, -s0 * Hh * 1.4, c0 * Hh * 1.4, BODY, AL * 0.75, [0.1, 0, 0, 0], [0, 0, 0, 1], true);
          Q.glow(a[0], a[1], sz * 1.8, ENERGY, AL * 0.5, 1, 2.5, 0.7); Q.quad(0, a[0] - c0 * L * 0.3, a[1] - s0 * L * 0.3, c0 * L, s0 * L, -s0 * Hh, c0 * Hh, EDGE, AL, [3.5, 0.4, 0.3, 0], [0, 0, 0, 1]);
          Q.quad(0, a[0] - c0 * L * 0.05, a[1] - s0 * L * 0.05, c0 * L * 0.55, s0 * L * 0.55, -s0 * Hh * 0.4, c0 * Hh * 0.4, ACC, AL, [3, 0, 0.9, 0], [0, 0, 0, 1]); Q.glow(a[0] + c0 * sz * 0.15, a[1] + s0 * sz * 0.15, sz * 0.5, WHITE, AL * 0.8, 1, 4, 0.3, 0.6); } }
      // the hold: the six circles feed their remaining light upward
      const fd = sstep(ARR_END - 0.05, ARR_END + 0.3, t) * (1 - sstep(STK - 0.1, STK + 0.15, t));
      if (fd > 0.01) for (const ci of circ) { const bx = X + ci.wx * T, by = Y + ci.wy * T * GY, ang = Math.atan2(SY - by, SX - bx), len = Math.hypot(SX - bx, SY - by) - RS * T * 0.5, ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len, w = T * (ci.i ? 0.1 : 0.17), fl = 0.75 + 0.25 * Math.sin(gt * 14 + ci.i);
        column(Q, bx, by, ex, ey, w, fd * fl * 0.75, { f0: 0.08, f1: 0.25 }); for (let j = 0; j < 3; j++) { const v = (gt * 0.9 + j / 3 + ci.i * 0.17) % 1; Q.glow(bx + (ex - bx) * v, by + (ey - by) * v, T * 0.2, ACC, fd * Math.sin(v * Math.PI) * 0.9, 1, 5, 0.5, 0.4); } }
      // the overhead light: a star growing as it is fed (a ripple at each arrival), a soft corona, lens bloom; it compresses and empties down
      if (t > 2.2 && t < IMP + 0.2) { const fed = f.fed, grow = 0.16 + 0.84 * H.ease.out(fed), empty = sstep(STK, IMP + 0.04, t), hold = sstep(ARR_END + 0.2, STK, t);
        let jolt = 0, rip = -1; for (const rp of f.rip) { const q = (t - rp.t0) / 0.5; if (q > 0 && q < 1) jolt = Math.max(jolt, (1 - q) * (1 - q) * rp.w); const q2 = (t - rp.t0) / 0.7; if (q2 > 0 && q2 < 1) rip = q2; }
        const r = RS * T * grow * (1 + 0.08 * jolt) * (1 - 0.82 * empty) * (1 + 0.025 * Math.sin(gt * 9) * hold), AL = sstep(2.2, 2.7, t) * (1 - sstep(IMP - 0.02, IMP + 0.12, t)), ch = Math.min(1, 0.35 * fed + 0.5 * hold + 0.4 * jolt), su = r * 0.78;
        if (AL > 0.01 && r > 1) { Q.shade(SX, SY, r * 2.4, r * 2.4, VOID, AL * 0.5 * (0.4 + 0.6 * fed), 0.2);
          Q.glow(SX, SY, r * 4.6, ENERGY, AL * (0.32 + 0.28 * ch), 1, 1.6, 1, 0, 0.6); Q.glow(SX, SY, r * 2.2, EDGE, AL * (0.25 + 0.3 * ch), 1, 2.4, 0.8, 0, 0.6);
          Q.quad(4, SX, SY, su * 3.4, 0, 0, su * 3.4, EDGE, AL, [ch, hold * 0.6 + empty * 0.4, rip, (seed % 13) / 13], [0, 0, 0, 0.35]);
          Q.quad(0, SX, SY, r * 5.5, 0, 0, r * 0.14, ACC, AL * (0.25 + 0.35 * ch), [5, 0.4, 0.6, 0], [0, 0, 0, 0.3]); Q.quad(0, SX, SY, r * 2.8, 0, 0, r * 0.07, WHITE, AL * 0.35 * ch, [6, 0, 0, 0], [0, 0, 0, 0.3]);
          const cxs = SC.x0 + SC.w / 2, cys = SC.y0 + SC.h / 2; for (const [kk, sz, cc, aa] of [[0.55, 0.35, EDGE, 0.07], [1.35, 0.22, ACC, 0.06], [1.75, 0.55, ENERGY, 0.05]]) Q.glow(SX + (cxs - SX) * kk * 2, SY + (cys - SY) * kk * 2, r * sz, cc, AL * aa * ch, 1, 2.5, 0.5, 0, 0);
          if (fed > 0.2) for (let k = 0; k < NSP; k++) { const per = 1.1 + 0.4 * R1(seed + k), tk = gt + k * 0.37, cyc = Math.floor(tk / per), uu = tk / per - cyc, a0 = R1(seed + k * 3.1 + cyc * 1.7) * TAU, dir = k % 2 ? 1 : -1;
            const P = []; for (let j = 0; j < 6; j++) { const v = uu - j * 0.035; if (v <= 0) break; const ang = a0 + 0.9 * v * dir, d = r * (0.9 + 0.5 * Math.sin(Math.PI * v)); P.unshift([SX + Math.cos(ang) * d, SY + Math.sin(ang) * d, T * 0.05, 1 - j / 6]); }
            if (P.length > 1) ribbon(Q, P, ACC, AL * Math.sin(Math.PI * uu) * 0.9, 3, 0.4, 0.7, 0.1); } } }
      // the downward strike: a massive soft beam (a dark sheath under it for pale floors), twisting streams round it, a spearhead
      if (t > STK && t < IMP + 0.45) { const k = cl((t - STK) / (IMP - STK)), r0 = RS * T, top = SY + r0 * 0.4 * (1 - 0.6 * k), tip = lerp(top, Y - T * 0.15, H.ease.in(k)), af = 1 - cl((t - IMP) / 0.45), bw = T * (0.5 + 0.06 * (ev - 1)) * (1 - 0.45 * cl((t - IMP) / 0.45)), len = Math.max(1, tip - top);
        if (len > 2) { const fe = Math.min(0.5, bw * 1.1 / len) * (t < IMP ? 1 : 0.2);
          column(Q, X, top, X, tip, bw, af * 0.75, { f0: 0.06, f1: fe, c0: ENERGY, c1: EDGE, c2: ACC, dark: 0.45, sw: 0 });
          ribbon(Q, [[X, top, bw * 0.2, 1], [X, tip, bw * 0.2, 1]], WHITE, af * 0.35, 3, 0.1, 1, fe);
          const NSt = CEL ? 5 : ADE ? 4 : 3; for (let s = 0; s < NSt; s++) { const P = []; for (let j = 0; j <= 20; j++) { const v = j / 20, ph = v * 9 - gt * 16 + s * TAU / NSt; P.push([X + Math.sin(ph) * bw * (1.15 + 0.3 * Math.sin(v * 5 + s)), top + len * v, bw * 0.09 * (0.6 + 0.4 * (Math.cos(ph) + 1) / 2), 0.5 + 0.5 * Math.cos(ph)]); } ribbon(Q, P, s % 2 ? ACC : EDGE, af * 0.7, 3, 0.1, 0.5, 0.15); } }
        if (t < IMP) { Q.glow(X, tip, bw * 4, EDGE, af * 0.75, 1, 2.5, 0.8); Q.glow(X, tip, bw * 1.6, WHITE, af * 0.85, 1, 4, 0.3, 0.6); Q.quad(0, X, tip + bw * 0.9, bw * 0.55, 0, 0, bw * 2.4, ACC, af, [3, 0.3, 0.7, 0], [0, 0, 0, 1]); } }
      if (post < 0) return;
      /* ================= the annihilation blast ================= */
      { const fl = Math.max(0, 1 - post / 0.32), e = H.ease.out(cl(post / 0.12)); if (fl > 0) { Q.glow(X, Y - T * 0.6, T * (1.4 + 3.2 * e), WHITE, fl, 1, 2.6, 1, 1, 0.45); Q.glow(X, Y - T * 0.6, RT * 0.75 * (0.5 + 0.5 * e), ACC, fl * 0.75, 1, 2, 1, 0.2, 0.45);
          Q.glow(SC.x0 + SC.w / 2, SC.y0 + SC.h / 2, Math.max(SC.w, SC.h) * 0.95, EDGE, 0.3 * fl * fl, 1, 0.6, 0.4, 0, 0); }
        const ag = sstep(0.06, 0.2, post) * (1 - sstep(0.3, 1.3, post)); if (ag > 0) Q.glow(X, Y - T * 1.2, RT * 1.1, EDGE, ag * 0.45, 0.8, 1.8, 1, 0, 0.5); }
      { const q = cl(post / 0.85); if (q < 1) { const Rd = RT * 1.15 * H.ease.out(q) * CROWN, zk = 0.74, m = Math.max(zk, GY), a = Math.pow(1 - q, 1.2); if (Rd > 2) { Q.quad(5, X, Y, Rd * 1.15, 0, 0, Rd * 1.15 * m, EDGE, a, [zk, GY, 0.045 + 0.03 * q, 1], [0, 0, 0, 0.5], true); Q.quad(5, X, Y, Rd * 1.15, 0, 0, Rd * 1.15 * m, EDGE, a, [zk, GY, 0.045 + 0.03 * q, 1], [0, 0, 0, 0.5]); } } }
      { const ra = Math.max(0, 1 - post / 0.7); if (ra > 0) { const NR = 9 + ev; for (let i = 0; i < NR; i++) { const b = -Math.PI + (i + 0.5) / NR * Math.PI + Math.sin(i * 7.3) * 0.12, L = RT * (0.8 + 0.5 * R1(seed + i * 3)) * H.ease.out(cl(post / 0.25)), w = T * (0.18 + 0.16 * R1(seed + i));
          ribbon(Q, [[X, Y - T * 0.3, w * 0.5, 1], [X + Math.cos(b) * L * 0.5, Y - T * 0.3 + Math.sin(b) * L * 0.5, w, 0.8], [X + Math.cos(b) * L, Y - T * 0.3 + Math.sin(b) * L, w * 1.2, 0.3]], i % 3 ? EDGE : ACC, 0.55 * ra, 2.6, 0.05, 0.4, 0.6); } } }
      // the column and the mushroom crown (one volume: body laid over, its light added)
      { const ZC2 = f.ZC, rise = H.ease.out(cl(post / 1.2)), late = cl((post - 1.1) / 2.8), fadeK = sstep(0, 0.1, post) * (1 - sstep(2.6, 4.4, post)) * endK;
        const hcr = Math.min(ZC2 * 0.78, (1.2 + (ZC2 * 0.62 - 1.2) * rise) * CROWN) + late * 0.7, Rr = R * 0.3 * CROWN * (0.4 + 0.6 * rise) * (1 + 0.3 * late), rt = Rr * 0.52, wb = R * 0.085 * CROWN * (1 + 0.35 * late); f.crH = hcr; f.crR = Rr;
        if (fadeK > 0.01) { const rb = wb * (1.6 + 2.6 * (1 - Math.exp(-post * 1.6)) + 1.2 * late), HX = Math.max(Rr + rt * 1.35, rb * 1.3 + 0.4) * 1.1, zT = hcr + rt * 1.7, zB = -(rb * GY + wb * 1.3) - 0.5, HY = (zT - zB) / 2, zc = (zT + zB) / 2;
          const q = [HX, HY, zc, post], rr = [hcr, Rr, rt, wb]; Q.quad(7, X, Y - zc * T, HX * T, 0, 0, HY * T, EDGE, fadeK, q, rr, true); Q.quad(7, X, Y - zc * T, HX * T, 0, 0, HY * T, EDGE, fadeK, q, rr);
          Q.glow(X, Y - hcr * T, (Rr + rt) * T * 1.5, ENERGY, fadeK * 0.45 * (1 - late * 0.6), 0.55, 2, 0.8, 0, 0.5); Q.glow(X, Y - (hcr - rt * 0.45) * T, (Rr + rt * 0.5) * T, EDGE, fadeK * 0.35 * (1 - late * 0.7) * (0.8 + 0.2 * Math.sin(gt * 5)), 0.35, 2.4, 0.5, 0, 0.5); } }
      // the glyphs lifting off the floor and coming apart
      for (const ci of circ) for (const gl of ci.gl) { if (gl.fx == null) { const a = ci.a0 - IMP * 0.14 * ci.dir + gl.a, rg = ci.r * 0.71; gl.fx = ci.wx + Math.cos(a) * rg; gl.fy = ci.wy + Math.sin(a) * rg; gl.ang = a; } const q = cl(post / (1.0 + gl.z * 0.45)); if (q >= 1) continue;
        const z = gl.z * H.ease.out(q) * (1 + 0.25 * ci.r), p = P3(gl.fx + Math.cos(gl.ang) * q * 0.5, gl.fy + Math.sin(gl.ang) * q * 0.5, z), sz = T * ci.gsz * 1.25 * (1 - 0.5 * q), hs = sz * 17 / 24, a = sstep(0, 0.08, post) * (1 - q) * (1 - q * 0.5); if (a <= 0.01) continue;
        const rr = gl.rv * q, c0 = Math.cos(rr), s0 = Math.sin(rr); Q.quad(9, p[0], p[1], c0 * hs, s0 * hs, -s0 * hs, c0 * hs, EDGE, Math.min(1, a * 1.2), [gl.k, q, Math.max(1, 17 / Math.max(1, hs * Q.k)), 0], [0, 0, 0, 1]); }
      // the debris: dark shards thrown out, then the slow rain from the cloud (the pool's shards and sparks with them)
      for (const d of deb) { const a = (1 - cl((d.age - 1.4) / 0.7)) * endK; if (a <= 0.01) continue; const p = P3(d.wx, d.wy, d.z); Q.pt(p[0], p[1], T * d.s * 2.4, VOID, a, 2, d.rot, 1, true); }
      for (const p of fall) { const a = sstep(0, 0.3, p.age) * (1 - cl((p.age - 2.4) / 0.8)) * cl(p.z / 0.4 + 0.2) * endK; if (a <= 0.01) continue; const s = P3(p.wx, p.wy, p.z); Q.pt(s[0], s[1], T * p.s * 2.4, VOID, a, 2, p.rot, 1, true); }
    }
    // each frame: the GPU painter where it runs (one layer under the pets, one over), else the 2D picture
    const gfx = () => { try { const G = self.ANNIH_GFX; return G && G.usable() ? G : null; } catch (e) { return null; } };
    function gpuLayer(c, f, X, Y, T, gt, over) { const G = gfx(); if (!G) return false; const me2 = H.me, Q = G.begin(c, over ? [H.sx(me2.x), H.sy(me2.y) - T * 0.45, T] : null, gt);
      if (over) { if (!f.ZC) { const SC = scr(c), m = c.getTransform(), cw = c.canvas.clientWidth || c.canvas.width, hud = 118 * (c.canvas.width / cw) / (m.d || 1), room = Y - (SC.y0 + hud) - RS * T * 0.55; f.ZC = Math.max(3.3, Math.min(6.6, room / T)); }   /* (the star just under the HUD's real height, its core always on screen) */ gpuOver(Q, f, X, Y, T, gt, c); gpuParts(Q, X, Y, T, cl((LIFE - f.t) / 0.8)); } else gpuUnder(Q, f, X, Y, T, gt);
      return G.flush(c, GY); }
    /* the timeline: the warning, the impact */
    H.X.after(TR0, () => H.X.sfx.sparkle && H.X.sfx.sparkle()); H.X.after(SE0, () => { H.X.sfx.chime && H.X.sfx.chime(); H.X.shake(2, 0.3); });
    H.X.after(ARR_END + 0.05, () => { H.X.sfx.hollow && H.X.sfx.hollow(); H.X.shake(3, 0.8); });
    H.X.after(STK - 0.4, () => H.warn(x, y, R, IMP - STK + 0.4, C.col));
    H.X.after(STK, () => { H.X.sfx.whoosh(); H.X.shake(6, 0.3); });
    H.X.after(IMP, () => {
      if (H.X.negative) H.X.negative(0.12);
      H.hitArea(x, y, R, DMG, C.dmgO({ kb: 7, stun: 0.6 }));
      H.X.flash(0.2, ACC); H.X.hitstop(0.12); H.X.sfx.crash(); H.X.shake(24 + 2 * ev, 0.55); H.X.light(x, y, R * 1.4, 0.5);
      if (F.gpu) { H.X.shake(22, 0.22); H.X.light(x, y, R * 1.44, 0.4); } else H.X.boom(x, y, R * 0.6, EDGE, ACC, { n: 30 + 3 * ev, shake: 22, smoke: 8 });   /* (v391 U3: on the GPU its sparks and smoke are the painter's) */
      for (let i = 0; i < H.n(20 + 3 * ev); i++) { const b = Math.random() * TAU, v = 4 + Math.random() * 5 + 0.3 * ev; deb.push({ wx: Math.cos(b) * 0.4, wy: Math.sin(b) * 0.3, z: 0.3 + Math.random() * 0.8, vx: Math.cos(b) * v, vy: Math.sin(b) * v / GY * 0.55, vz: 3 + Math.random() * 5, g: 12, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, s: 0.09 + Math.random() * 0.13 + 0.01 * ev, age: 0, bn: 0 }); }
      if (!F.gpu) for (let j = 0; j < H.n(30 + 3 * ev); j++) { const b = Math.random() * TAU, v = 5 + Math.random() * 8; H.P({ kind: 'spark', x, y: y - 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 2, g: 4, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 2 + Math.random() * 1.5, color: j % 3 ? EDGE : ACC }); }
      if (!F.gpu) for (let j = 0; j < H.n(14); j++) { const b = Math.random() * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * 0.4, y: y - 0.3, vx: Math.cos(b) * (3 + Math.random() * 5), vy: Math.sin(b) * 2.5 - 3 - Math.random() * 3, g: 9, life: 0.7 + Math.random() * 0.4, max: 1.1, size: 3 + Math.random() * 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, color: j % 2 ? PLUM : SMOKE }); }
      if (CEL && !F.gpu) H.burst(x, y - 1.5, 'spark', 24, { v: 7, life: 0.6, size: 2, color: [EDGE, ACC] });
    });
    H.X.after(IMP + 0.12, () => H.X.sfx.thud()); H.X.after(IMP + 0.35, () => { H.X.sfx.hum(); H.X.shake(8, 0.4); }); H.X.after(IMP + 1.0, () => H.X.shake(3, 0.6));
    void F;
  };
})();
