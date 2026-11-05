/* ---------- Dark, reworked: Umbra Heart ----------
   A massive heart of glossy shadow hovers over the aim, dripping liquid darkness into a damaging pool, then ruptures.
   Formation (1.4 s, outside the window): the floor darkens and several streams of shadow rise from it, swirling up into
   one point; from there the outline climbs both sides round the lobes and the volume closes. The sustained window (7 s
   at level 1, 7.5, 8, 9 at Adept, 10, 11, 12 at Celestial): the heart turns slowly and beats (a deliberate squeeze, then a
   swell); every beat lights its fissures, its inner depth and the veins of the pool below, sends a ring of light across
   the pool, and deals one Dark hit over the pool (ticks total 10 x base x K x evoK x W / 7: the tick holds, the longer
   window adds ticks). Thick drops gather on its lower edge, stretch into long strands, detach (the upper strand snapping
   back) and fall; their landings ripple and merge into a broad glistening pool (a dark translucent surface with
   light-only rims, a violet reflection of the heart, sliding glints) with mist rising at its boundary and dark fragments
   drifting up into the heart. In the last part of the window the fissures widen, the inner light shows through and the
   strands draw back in; at expiry it contracts once and bursts (one hit, 6 x base x K x evoK, kb 6, stun 0.5, R x 1.15):
   curved pieces of dark glass, liquid shadow flung out, a violet-black shockwave in the air and on the floor, the pool
   surging outward and breaking into mist. Adept: a larger heart and field, travelling light in the fissures, currents
   under the surface, fine streams among the drops. Celestial: the largest heart, layered currents, three independently
   travelling bands of light through the cracks, large drops with several fine streams, the widest shockwave and a slow
   trailing fall of glass and mist.
   The heart is a thick, rounded heart symbol: a cached glossy face (near-black, plum lobes lit from the upper left, a
   puffy falloff to the contour, a reflected violet rim low right, ink), a cached side silhouette stacked for the
   thickness band (squashed by |cos| as it turns, like LU1's), a separate cached specular layer that shifts with the turn,
   eight moving sheen frames, a cached inner-light layer; the fissures are polylines in the heart's own coordinates.
   No per-frame gradients, no shadowBlur; near the pet everything in the air dims smoothly (never a cut-out). */
(() => {
  const U = ELEM_IMPL.dark.ult; delete U.inkpalace;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF', WHITE = '#FFFFFF', INK = '#06040A';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  let H;
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function blit(c, img, x, y, w, h, a, add) { if (!(a > 0.01) || w < 0.5 || h < 0.5) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - w / 2, y - h / 2, w, h); c.restore(); }
  // a floor sprite (squashed onto the ground)
  function floorSpr(c, img, X, Y, r, a, add) { if (r < 1 || !(a > 0.01)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }

  /* ---- the heart curve (as LU1's): lobes up, point down; x in [-0.94, 0.94], y in [-0.56, 1.15], the cleft at y -0.144 ---- */
  const HP = (() => { const N = 120, pts = []; for (let i = 0; i <= N; i++) { const t = i / N * TAU, s = Math.sin(t); pts.push([16 * s * s * s / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]); } return pts; })();
  const HN = HP.length - 1, HHALF = HN / 2, HMID = 0.295;   // index 0 the cleft, HHALF the point; HMID the visual centre
  function heartPath(g, s, ox, oy) { g.beginPath(); for (let i = 0; i < HN; i++) { const p = HP[i], x = (ox || 0) + p[0] * s, y = (oy || 0) + p[1] * s; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
  // part of the contour (indices as fractions of the loop), scaled by k about the visual centre
  function contour(g, s, f0, f1, k) { g.beginPath(); const i0 = Math.round(f0 * HN), i1 = Math.round(f1 * HN); for (let i = i0; i <= i1; i++) { const p = HP[((i % HN) + HN) % HN], x = p[0] * s * k, y = (HMID + (p[1] - HMID) * k) * s; i === i0 ? g.moveTo(x, y) : g.lineTo(x, y); } }
  function inHeart(x, y, k) { let ins = false; for (let i = 0, j = HN - 1; i < HN; j = i++) { const xi = HP[i][0] * k, yi = HMID + (HP[i][1] - HMID) * k, xj = HP[j][0] * k, yj = HMID + (HP[j][1] - HMID) * k; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }

  /* ---- cached sprites: 320 px square, heart unit 128 px, the curve's origin at (160, 150) ---- */
  const SW = 320, SU = 128, SCX = 160, SCY = 150;
  function ellipseGlow(g, x, y, rx, ry, rot, stops) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(rx, ry); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore(); }
  // the glossy face: near-black body, plum lobes lit from the upper left, a puffy falloff, a reflected violet rim, ink
  const faceSpr = () => fxSprite('du7face', SW, SW, g => {
    g.translate(SCX, SCY);
    heartPath(g, SU); g.fillStyle = BODY; g.fill();
    g.save(); heartPath(g, SU); g.clip();
    // the lobes swell toward the light
    for (const [lx, a] of [[-0.47, 1], [0.47, 0.6]]) ellipseGlow(g, (lx - 0.1) * SU, -0.2 * SU, 0.62 * SU, 0.66 * SU, 0, [[0, `rgba(118,90,148,${a})`], [0.2, `rgba(86,60,108,${0.92 * a})`], [0.5, `rgba(52,18,82,${0.75 * a})`], [1, 'rgba(43,11,69,0)']]);
    // the plum depth in the body, low and central
    ellipseGlow(g, 0, 0.38 * SU, 0.55 * SU, 0.5 * SU, 0, [[0, 'rgba(58,20,92,0.55)'], [0.6, 'rgba(43,11,69,0.25)'], [1, 'rgba(43,11,69,0)']]);
    // the shadow side, low right
    let gr = g.createLinearGradient(-0.7 * SU, -0.6 * SU, 0.8 * SU, 1.15 * SU); gr.addColorStop(0, 'rgba(8,5,15,0)'); gr.addColorStop(0.45, 'rgba(8,5,15,0.12)'); gr.addColorStop(1, 'rgba(8,5,15,0.8)'); g.fillStyle = gr; g.fillRect(-SU * 1.2, -SU, SU * 2.4, SU * 2.4);
    // the crease below the cleft
    g.lineCap = 'round'; for (const [w, a] of [[0.2, 0.12], [0.11, 0.2], [0.05, 0.3]]) { g.strokeStyle = `rgba(8,5,15,${a})`; g.lineWidth = w * SU; g.beginPath(); g.moveTo(0, -0.16 * SU); g.quadraticCurveTo(0.02 * SU, 0.05 * SU, 0, 0.22 * SU); g.stroke(); }
    // the puffy falloff toward the contour (a rounded volume, not a flat cut-out)
    for (const [w, a] of [[0.46, 0.1], [0.3, 0.14], [0.18, 0.2], [0.08, 0.32]]) { heartPath(g, SU); g.strokeStyle = `rgba(8,5,15,${a})`; g.lineWidth = w * SU; g.stroke(); }
    // reflected violet rim along the lower right and round the point (the pool's light), a cold rim top left
    g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
    contour(g, SU, 0.2, 0.52, 0.955); g.strokeStyle = 'rgba(109,40,168,0.32)'; g.lineWidth = 0.13 * SU; g.stroke(); g.strokeStyle = 'rgba(165,92,255,0.42)'; g.lineWidth = 0.035 * SU; g.stroke();
    contour(g, SU, 0.5, 0.64, 0.955); g.strokeStyle = 'rgba(109,40,168,0.2)'; g.lineWidth = 0.09 * SU; g.stroke();
    contour(g, SU, 0.74, 0.94, 0.97); g.strokeStyle = 'rgba(208,174,255,0.16)'; g.lineWidth = 0.03 * SU; g.stroke();
    g.globalCompositeOperation = 'source-over'; g.restore();
    heartPath(g, SU); g.strokeStyle = INK; g.lineWidth = 0.032 * SU; g.lineJoin = 'round'; g.stroke();
    contour(g, SU, 0.24, 0.5, 0.985); g.strokeStyle = 'rgba(165,92,255,0.45)'; g.lineWidth = 0.012 * SU; g.stroke(); });
  // the falloff alone (laid back over the moving currents so the volume stays)
  const shadeSpr = () => fxSprite('du7shade', SW, SW, g => { g.translate(SCX, SCY); g.save(); heartPath(g, SU); g.clip();
    const gr = g.createLinearGradient(-0.7 * SU, -0.6 * SU, 0.8 * SU, 1.15 * SU); gr.addColorStop(0, 'rgba(8,5,15,0)'); gr.addColorStop(0.5, 'rgba(8,5,15,0.08)'); gr.addColorStop(1, 'rgba(8,5,15,0.6)'); g.fillStyle = gr; g.fillRect(-SU * 1.2, -SU, SU * 2.4, SU * 2.4);
    for (const [w, a] of [[0.46, 0.1], [0.3, 0.14], [0.18, 0.2], [0.08, 0.3]]) { heartPath(g, SU); g.strokeStyle = `rgba(8,5,15,${a})`; g.lineWidth = w * SU; g.stroke(); } g.restore(); });
  // the gloss: highlights on the lobes, a window streak along the upper left, a glint low on the point
  const specSpr = () => fxSprite('du7spec', SW, SW, g => { g.translate(SCX, SCY); g.save(); heartPath(g, SU); g.clip();
    ellipseGlow(g, -0.42 * SU, -0.24 * SU, 0.44 * SU, 0.26 * SU, -0.6, [[0, 'rgba(208,174,255,0.3)'], [0.6, 'rgba(208,174,255,0.1)'], [1, 'rgba(208,174,255,0)']]);
    ellipseGlow(g, -0.5 * SU, -0.33 * SU, 0.27 * SU, 0.11 * SU, -0.62, [[0, 'rgba(246,240,255,0.95)'], [0.35, 'rgba(220,200,255,0.6)'], [1, 'rgba(208,174,255,0)']]);
    ellipseGlow(g, 0.4 * SU, -0.37 * SU, 0.15 * SU, 0.06 * SU, -0.35, [[0, 'rgba(240,232,255,0.85)'], [0.4, 'rgba(208,174,255,0.35)'], [1, 'rgba(208,174,255,0)']]);
    ellipseGlow(g, -0.2 * SU, 0.74 * SU, 0.08 * SU, 0.03 * SU, -0.9, [[0, 'rgba(208,174,255,0.45)'], [1, 'rgba(208,174,255,0)']]);
    g.lineCap = 'round'; contour(g, SU, 0.1, 0.22, 0.8); g.strokeStyle = 'rgba(208,174,255,0.22)'; g.lineWidth = 0.05 * SU; g.stroke(); contour(g, SU, 0.79, 0.9, 0.84); g.strokeStyle = 'rgba(236,226,255,0.55)'; g.lineWidth = 0.024 * SU; g.stroke(); contour(g, SU, 0.8, 0.86, 0.76); g.strokeStyle = 'rgba(236,226,255,0.3)'; g.lineWidth = 0.014 * SU; g.stroke();
    g.restore(); });
  // the side of the thickness band: lit smoky violet on top, plum, void, a violet bounce from the pool at the bottom
  const sideSpr = o => fxSprite('du7side' + (o ? 'o' : ''), SW, SW, g => { g.translate(SCX, SCY); const gr = g.createLinearGradient(0, -0.56 * SU, 0, 1.15 * SU); gr.addColorStop(0, '#3E2C52'); gr.addColorStop(0.3, PLUM); gr.addColorStop(0.68, BODY); gr.addColorStop(0.88, '#1C0B33'); gr.addColorStop(1, '#3A1764'); heartPath(g, SU); g.fillStyle = gr; g.fill(); if (o) { g.strokeStyle = INK; g.lineWidth = 0.032 * SU; g.lineJoin = 'round'; g.stroke(); } });
  // a moving sheen: a broad soft lavender band across the face at one of eight positions (added)
  const NSH = 8;
  const sheenSpr = i => fxSprite('du7sheen' + i, SW, SW, g => { g.translate(SCX, SCY); heartPath(g, SU); g.clip(); const p = (i / (NSH - 1) * 2 - 1) * SU * 0.95; g.rotate(0.45); const gr = g.createLinearGradient(p - SU * 0.26, 0, p + SU * 0.26, 0); gr.addColorStop(0, 'rgba(208,174,255,0)'); gr.addColorStop(0.5, 'rgba(208,174,255,0.3)'); gr.addColorStop(1, 'rgba(208,174,255,0)'); g.fillStyle = gr; g.fillRect(-SW, -SW, SW * 2, SW * 2); });
  // the inner light (added): violet depth glowing through from inside
  const innerSpr = () => fxSprite('du7inner', SW, SW, g => { g.translate(SCX, SCY); heartPath(g, SU); g.clip();
    ellipseGlow(g, 0, 0.32 * SU, 0.8 * SU, 0.78 * SU, 0, [[0, 'rgba(165,92,255,0.75)'], [0.3, 'rgba(109,40,168,0.5)'], [0.7, 'rgba(43,11,69,0.2)'], [1, 'rgba(43,11,69,0)']]);
    for (const lx of [-0.46, 0.46]) ellipseGlow(g, lx * SU, -0.15 * SU, 0.4 * SU, 0.38 * SU, 0, [[0, 'rgba(109,40,168,0.35)'], [1, 'rgba(109,40,168,0)']]); });
  // a glowing violet heart outline (its reflection on the pool)
  const lineSpr = () => fxSprite('du7line', SW, SW, g => { g.translate(SCX, SCY); g.lineJoin = 'round'; for (const [col, lw] of [['rgba(109,40,168,0.25)', 0.22], ['rgba(109,40,168,0.45)', 0.11], ['rgba(165,92,255,0.75)', 0.045], ['rgba(208,174,255,0.8)', 0.016]]) { heartPath(g, SU * 0.9, 0, SU * 0.03); g.strokeStyle = col; g.lineWidth = lw * SU; g.stroke(); } });
  // a dark halo (the air darkened round the heart, so it reads on a bright floor)
  const haloSpr = () => fxSprite('du7halo', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(8,5,15,0.55)'); gr.addColorStop(0.45, 'rgba(14,8,26,0.32)'); gr.addColorStop(0.75, 'rgba(24,11,46,0.1)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // the pool: a dark translucent surface, feathered at its edge
  const poolSpr = () => fxSprite('du7pool', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(8,5,15,0.82)'); gr.addColorStop(0.55, 'rgba(14,7,26,0.76)'); gr.addColorStop(0.78, 'rgba(24,11,46,0.6)'); gr.addColorStop(0.9, 'rgba(43,11,69,0.3)'); gr.addColorStop(1, 'rgba(43,11,69,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // a glint sliding on the pool (added)
  const glintSpr = () => fxSprite('du7glint', 128, 32, g => { const gr = g.createRadialGradient(64, 16, 0, 64, 16, 64); gr.addColorStop(0, 'rgba(208,174,255,0.75)'); gr.addColorStop(0.2, 'rgba(165,92,255,0.35)'); gr.addColorStop(0.6, 'rgba(109,40,168,0.08)'); gr.addColorStop(1, 'rgba(109,40,168,0)'); g.save(); g.scale(1, 0.25); g.translate(0, 48); g.fillStyle = gr; g.fillRect(0, -48, 128, 128); g.restore(); });
  // a band round a circle: dark body, violet luminous edge, feathered both sides (ripples, the shockwave)
  const bandSpr = () => fxSprite('du7band', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(24,11,46,0)'], [0.66, 'rgba(24,11,46,0)'], [0.78, 'rgba(14,7,26,0.5)'], [0.87, 'rgba(43,11,69,0.7)'], [0.92, 'rgba(109,40,168,0.75)'], [0.955, 'rgba(165,92,255,0.9)'], [0.98, 'rgba(208,174,255,0.45)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // the same in light only (added): rims, beat rings
  const bandLSpr = () => fxSprite('du7bandL', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(109,40,168,0)'], [0.72, 'rgba(109,40,168,0)'], [0.86, 'rgba(109,40,168,0.3)'], [0.94, 'rgba(165,92,255,0.75)'], [0.97, 'rgba(208,174,255,0.8)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // mist (smoky violet) and a darker smoke
  const puffSpr = () => fxSprite('du7puff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(98,70,128,0.45)'); gr.addColorStop(0.45, 'rgba(70,48,82,0.26)'); gr.addColorStop(1, 'rgba(43,11,69,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const dpuffSpr = () => fxSprite('du7dpuff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(14,7,26,0.7)'); gr.addColorStop(0.45, 'rgba(43,11,69,0.38)'); gr.addColorStop(0.8, 'rgba(70,48,82,0.08)'); gr.addColorStop(1, 'rgba(70,48,82,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });

  /* ---- the fissures: polylines in heart units, half radiating from the core, half wandering; each with a branch ---- */
  function makeCracks(n, seed) { const out = []; let s = seed;
    for (let i = 0; i < n; i++) { let x, y, tries = 0; const radial = i % 2 === 0;
      do { s += 1.7; if (radial) { const b = R1(s) * TAU, r = 0.05 + 0.12 * R1(s + 0.3); x = Math.cos(b) * r; y = 0.32 + Math.sin(b) * r; } else { x = (R1(s) - 0.5) * 1.5; y = -0.35 + R1(s + 0.5) * 1.2; } } while (!inHeart(x, y, 0.8) && ++tries < 30);
      const pts = [[x, y]]; let b = radial ? Math.atan2(y - 0.32, x) : R1(s + 2.1) * TAU;
      for (let k = 0; k < 7; k++) { b += (R1(s + k * 3.3) - 0.5) * 1.0; const st = 0.08 + 0.06 * R1(s + k * 5.1), nx = x + Math.cos(b) * st, ny = y + Math.sin(b) * st; if (!inHeart(nx, ny, 0.9)) break; x = nx; y = ny; pts.push([x, y]); }
      if (pts.length < 3) { i--; s += 9; if (s > seed + 4000) break; continue; }
      const q = pts[Math.min(2, pts.length - 1)], br = [q]; let bb = b + (R1(s + 7) < 0.5 ? 1.2 : -1.2), bx = q[0], by = q[1]; for (let k = 0; k < 3; k++) { bb += (R1(s + k * 9.1) - 0.5) * 0.8; const nx = bx + Math.cos(bb) * 0.07, ny = by + Math.sin(bb) * 0.07; if (!inHeart(nx, ny, 0.9)) break; bx = nx; by = ny; br.push([bx, by]); }
      let L = 0; for (let k = 1; k < pts.length; k++) L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      out.push({ pts, br, my: pts.reduce((a, p) => a + p[1], 0) / pts.length, ph: R1(s + 11) * TAU, sp: 0.35 + 0.4 * R1(s + 13), L, radial }); }
    return out; }
  // the pool's veins (the surface patterns beneath the heart): floor polylines in pool radii
  function makeVeins(n, seed) { const out = []; for (let i = 0; i < n; i++) { let a = i / n * TAU + (R1(seed + i * 3.3) - 0.5) * 0.5, r = 0.12 + 0.1 * R1(seed + i); const pts = [[Math.cos(a) * r, Math.sin(a) * r]]; for (let k = 1; k <= 6; k++) { a += (R1(seed + i * 11 + k) - 0.5) * 0.5; r += 0.13 * (0.7 + 0.6 * R1(seed + i * 7 + k)); pts.push([Math.cos(a) * Math.min(r, 0.92), Math.sin(a) * Math.min(r, 0.92)]); } out.push(pts); } return out; }

  /* ---- the heart's placement for one frame: centre (cx, cy) px, height hp px, turn th, lean, beat scales kx, ky ---- */
  function geom(cx, cy, hp, th, lean, kx, ky) { const u = hp / 1.71, cs = Math.cos(th), sn = Math.sin(th), d = hp * 0.32; return { cx, cy, hp, u, cs, sn, ws: Math.max(0.08, Math.abs(cs)), d, near: (cs >= 0 ? 1 : -1) * d / 2 * sn, lean, cL: Math.cos(lean), sL: Math.sin(lean), kx, ky }; }
  // a point given in heart units on the near face (screen px)
  function hpt(G, ux, uy) { const lx = G.near + ux * G.u * G.ws * G.kx, ly = (uy - HMID) * G.u * G.ky; return [G.cx + lx * G.cL - ly * G.sL, G.cy + lx * G.sL + ly * G.cL]; }
  function hptI(G, i) { const p = HP[((Math.round(i) % HN) + HN) % HN]; return hpt(G, p[0], p[1]); }
  // the heart's outline drawn partway: from the point up both sides by u (1 = joined at the cleft)
  function partHeart(c, G, u) { const k = Math.round(HHALF * cl(u)); if (k < 1) return null; c.beginPath(); for (let i = HHALF - k; i <= HHALF + k; i++) { const p = hptI(G, i); i === HHALF - k ? c.moveTo(p[0], p[1]) : c.lineTo(p[0], p[1]); } return [hptI(G, HHALF - k), hptI(G, HHALF + k)]; }

  /* the thick heart. S: { a, inner 0..1, crack 0..1 (base light), flash 0..1 (the beat), wide 0..1 (widening), bands [0..1
     positions of travelling light], beads, currents (count), t, cracks } */
  function drawHeart(c, G, S) {
    const a = S.a; if (!(a > 0.01)) return;
    const sc = G.u / SU, w = SW * sc * G.ws * G.kx, h = SW * sc * G.ky, ox = -SCX * sc * G.ws * G.kx, oy = -(SCY + HMID * SU) * sc * G.ky;
    c.save(); c.translate(G.cx, G.cy); c.rotate(G.lean);
    // the air darkened round it; a restrained violet bloom behind
    c.globalAlpha = a * 0.85; c.drawImage(haloSpr(), -G.hp * 0.95, -G.hp * 0.9, G.hp * 1.9, G.hp * 1.8);
    c.globalAlpha = 1; glow(c, 0, G.hp * 0.08, G.hp * 0.85, ENERGY, a * (0.16 + 0.22 * S.flash + 0.25 * S.wide)); glow(c, 0, G.hp * 0.1, G.hp * 0.45, EDGE, a * (0.05 + 0.14 * S.flash + 0.2 * S.wide));
    // the thickness band: side copies from the far face to the near one
    c.globalAlpha = a; const NK = Math.max(4, Math.min(9, Math.round(G.d * Math.abs(G.sn) / 3)));
    for (let k = 0; k <= NK; k++) { const xo = lerp(-G.near, G.near, k / NK) * 0.999; c.drawImage(sideSpr(k ? 0 : 1), xo + ox, oy, w, h); }
    // the face
    c.drawImage(faceSpr(), G.near + ox, oy, w, h);
    c.restore();
    // the currents beneath the surface (Adept: two; Celestial: four layered, crossing), then the falloff back over them
    if (S.currents) { c.save(); c.beginPath(); for (let i = 0; i < HN; i++) { const p = hptI(G, i); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.closePath(); c.clip(); c.lineCap = 'round';
      for (let j = 0; j < S.currents; j++) { const y0 = -0.3 + j * (1.1 / S.currents) + 0.06 * Math.sin(S.t * 0.4 + j * 1.7), dir = j % 2 ? -1 : 1, ph = S.t * (0.5 + 0.18 * j) * dir + j * 2.3; c.beginPath();
        for (let k = 0; k <= 14; k++) { const ux = -1 + k / 7, uy = y0 + 0.08 * Math.sin(ux * 3.1 + ph) + 0.03 * Math.sin(ux * 7 - ph * 1.6), p = hpt(G, ux, uy); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
        c.globalAlpha = a * 0.5; c.strokeStyle = j % 2 ? '#3B2350' : '#33204A'; c.lineWidth = G.u * 0.09; c.stroke(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (0.16 + 0.2 * S.flash); c.strokeStyle = ENERGY; c.lineWidth = G.u * 0.025; c.stroke(); c.globalCompositeOperation = 'source-over'; }
      c.restore(); c.save(); c.translate(G.cx, G.cy); c.rotate(G.lean); c.globalAlpha = a * 0.85; c.drawImage(shadeSpr(), G.near + ox, oy, w, h); c.restore(); }
    c.save(); c.translate(G.cx, G.cy); c.rotate(G.lean);
    // the inner light, through the depth
    const inn = S.inner; if (inn > 0.01) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * inn); c.drawImage(innerSpr(), G.near + ox, oy, w, h); c.globalCompositeOperation = 'source-over'; }
    c.restore();
    // the fissures
    drawCracks(c, G, S);
    c.save(); c.translate(G.cx, G.cy); c.rotate(G.lean);
    // the gloss: shifted against the turn (the highlights slide over the lobes), and the moving sheen
    c.globalAlpha = a * 0.95; c.drawImage(specSpr(), G.near + ox - G.sn * G.u * 0.07, oy, w, h);
    const si = Math.max(0, Math.min(NSH - 1, Math.round(((G.sn * (G.cs >= 0 ? 1 : -1)) * 0.6 + 0.5 + 0.12 * Math.sin(S.t * 0.5)) * (NSH - 1))));
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.55; c.drawImage(sheenSpr(si), G.near + ox, oy, w, h);
    c.restore();
  }
  function drawCracks(c, G, S) {
    const a = S.a, wide = S.wide, lwU = G.u, list = S.cracks; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const k of list) {
      // brightness: a breath of its own, the beat, the travelling bands (Adept/Celestial), the widening at the end
      let br = S.crack * (0.55 + 0.45 * Math.sin(S.t * 1.7 + k.ph)) + S.flash * 0.85 + wide * 0.9;
      for (const b of S.bands) { const yb = -0.6 + b * 1.9, dd = Math.abs(k.my - yb); br += Math.max(0, 1 - dd / 0.22) * 0.7; }
      br = Math.min(1.6, br); if (br < 0.03) continue;
      const P = k.pts.map(p => hpt(G, p[0], p[1])), B = k.br.map(p => hpt(G, p[0], p[1]));
      const path = () => { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); if (B.length > 1) { c.moveTo(B[0][0], B[0][1]); for (let i = 1; i < B.length; i++) c.lineTo(B[i][0], B[i][1]); } };
      const wk = 1 + 1.6 * wide; path();
      c.globalAlpha = Math.min(1, a * 0.22 * br); c.strokeStyle = ENERGY; c.lineWidth = Math.max(2, lwU * 0.05 * wk); c.stroke();
      c.globalAlpha = Math.min(1, a * 0.6 * br); c.strokeStyle = EDGE; c.lineWidth = Math.max(1, lwU * 0.016 * wk); c.stroke();
      if (br > 0.7) { c.globalAlpha = Math.min(0.7, a * (br - 0.7) * 0.8); c.strokeStyle = ACC; c.lineWidth = Math.max(0.7, lwU * 0.005 * (1 + wide)); c.stroke(); }
      // a bead of light running along it (Adept and up)
      if (S.beads) { const u = (S.t * k.sp + k.ph) % 1, f = u * (P.length - 1), i0 = Math.floor(f), e = f - i0, p0 = P[i0], p1 = P[Math.min(P.length - 1, i0 + 1)], bx = lerp(p0[0], p1[0], e), by = lerp(p0[1], p1[1], e); c.globalAlpha = Math.min(1, a * (0.5 + 0.3 * S.flash)); blitSized(c, glowSprite(ACC), bx - lwU * 0.08, by - lwU * 0.08, lwU * 0.16, lwU * 0.16); }
    }
    c.restore();
  }

  /* a hanging strand: from the attach point (ax, ay) to a bulb at (bx, by) of radius rb, the neck wn wide, the root wt */
  function strand(c, ax, ay, bx, by, rb, wn, wt, a) {
    if (!(a > 0.01)) return; const my = (ay + by) / 2, mx = (ax + bx) / 2;
    c.save(); c.globalAlpha = Math.min(1, a);
    c.beginPath(); c.moveTo(ax - wt, ay - wt * 0.4); c.quadraticCurveTo(mx - wn, my, bx - rb * 0.6, by - rb * 0.8); c.arc(bx, by, rb, Math.PI + 0.927, -0.927, true); c.quadraticCurveTo(mx + wn, my, ax + wt, ay - wt * 0.4); c.closePath();
    c.fillStyle = BODY; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    // the gloss: a lit line down its left side, a violet rim low right on the bulb, a specular point
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(110,80,150,0.5)'; c.lineWidth = Math.max(0.8, wn * 0.5); c.beginPath(); c.moveTo(ax - wt * 0.55, ay); c.quadraticCurveTo(mx - wn * 0.55, my, bx - rb * 0.55, by - rb * 0.55); c.stroke();
    if (rb > 1.5) { c.strokeStyle = 'rgba(165,92,255,0.55)'; c.lineWidth = Math.max(0.8, rb * 0.22); c.beginPath(); c.arc(bx, by, rb * 0.82, 0.1, 1.9); c.stroke();
      c.fillStyle = 'rgba(230,218,255,0.8)'; c.beginPath(); c.ellipse(bx - rb * 0.38, by - rb * 0.32, rb * 0.24, rb * 0.13, -0.7, 0, TAU); c.fill(); }
    c.restore();
  }
  /* a falling drop, stretched along its fall, a thin trailing strand above it */
  function drop(c, x, y, rb, stretch, tail, a) {
    if (!(a > 0.01) || rb < 0.6) return; c.save(); c.globalAlpha = Math.min(1, a);
    if (tail > 1) { c.strokeStyle = BODY; c.lineCap = 'round'; c.lineWidth = Math.max(0.8, rb * 0.35); c.beginPath(); c.moveTo(x, y - rb); c.lineTo(x, y - rb - tail); c.stroke(); c.lineWidth = Math.max(0.6, rb * 0.15); c.strokeStyle = 'rgba(14,7,26,1)'; c.beginPath(); c.moveTo(x, y - rb - tail); c.lineTo(x, y - rb - tail * 1.15); c.stroke(); }
    const ry = rb * (1 + stretch); c.beginPath(); c.moveTo(x, y - ry * 1.5); c.bezierCurveTo(x + rb * 0.6, y - ry * 0.7, x + rb * 1.05, y - ry * 0.05, x + rb * 0.95, y + ry * 0.25); c.arc(x, y + ry * 0.2, rb * 0.95, 0.05, Math.PI - 0.05); c.bezierCurveTo(x - rb * 1.05, y - ry * 0.05, x - rb * 0.6, y - ry * 0.7, x, y - ry * 1.5); c.closePath();
    c.fillStyle = BODY; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.globalCompositeOperation = 'lighter'; if (rb > 1.5) { c.strokeStyle = 'rgba(165,92,255,0.5)'; c.lineWidth = Math.max(0.8, rb * 0.2); c.beginPath(); c.arc(x, y + ry * 0.2, rb * 0.78, 0.2, 1.8); c.stroke(); }
    c.fillStyle = 'rgba(230,218,255,0.75)'; c.beginPath(); c.ellipse(x - rb * 0.35, y - ry * 0.15, rb * 0.2, rb * 0.32, 0.2, 0, TAU); c.fill();
    c.restore();
  }
  /* a curved piece of dark glass (a sliver of the heart's shell): length L, width wd px; flip -1..1 turns it (its back shows) */
  function glassShard(c, x, y, L, wd, ang, flip, a, glint) {
    if (!(a > 0.01) || L < 1) return; c.save(); c.translate(x, y); c.rotate(ang); c.scale(1, Math.max(0.12, Math.abs(flip)) * (flip < 0 ? -1 : 1)); c.globalAlpha = Math.min(1, a);
    c.beginPath(); c.moveTo(-L / 2, 0); c.quadraticCurveTo(0, -wd * 1.7, L / 2, 0); c.quadraticCurveTo(L * 0.05, -wd * 0.45, -L / 2, 0); c.closePath();
    c.fillStyle = flip >= 0 ? BODY : PLUM; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.beginPath(); c.moveTo(-L * 0.42, -wd * 0.12); c.quadraticCurveTo(0, -wd * 1.5, L * 0.42, -wd * 0.12);
    c.strokeStyle = `rgba(165,92,255,${0.35 + 0.4 * glint})`; c.lineWidth = Math.max(1, wd * 0.2); c.stroke(); if (glint > 0.4) { c.strokeStyle = `rgba(232,222,255,${glint - 0.3})`; c.lineWidth = Math.max(0.7, wd * 0.08); c.stroke(); }
    c.restore();
  }
  // a small dark fragment: a triangle with a violet edge
  function frag(c, x, y, s, rot, a) { if (!(a > 0.01)) return; c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = Math.min(1, a); c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, s * 0.5); c.lineTo(-s * 0.4, -s * 0.45); c.closePath(); c.fillStyle = BODY; c.fill(); c.strokeStyle = 'rgba(165,92,255,0.75)'; c.lineWidth = 1; c.stroke(); c.restore(); }

  /* ================= D-U07 Umbra Heart ================= */
  U.umbraheart = (C, h) => {
    H = h; const me = H.me, x = C.tx, y = C.ty, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const W = [7, 7.5, 8, 9, 10, 11, 12][ev - 1], FORM = 1.4, TE = FORM + W, TCON = 0.3, TB = TE + TCON, LIFE = TB + (CEL ? 2.5 : 2.3), TW = TE - Math.max(1.6, 0.22 * W);
    const R = (2.8 + 0.15 * (ev - 1)) * K, RB = R * 1.15, HT = (2.2 + 0.17 * (ev - 1)) * Math.sqrt(K);
    const BEAT = 0.75, B0 = FORM + 0.35, NT = Math.floor((W - 0.35 - 0.15) / BEAT) + 1, TICK = 10 * DK * (W / 7) / NT, BURST = 6 * DK;
    const seed = Math.floor(Math.random() * 1000), CR = makeCracks(CEL ? 15 : ADE ? 11 : 8, seed), VE = makeVeins(CEL ? 11 : ADE ? 9 : 7, seed + 50);
    const NSTR = [5, 5, 6, 7, 7, 8, 9][ev - 1], DRIP = [2.1, 2.3, 2.5, 2.9, 3.1, 3.3, 3.7][ev - 1], NFINE = CEL ? 3 : ADE ? 1 : 0, NSHARD = CEL ? 28 : ADE ? 20 : 14, NLIQ = CEL ? 20 : ADE ? 14 : 10;
    const BANDS = CEL ? 3 : ADE ? 1 : 0, CUR = CEL ? 4 : ADE ? 2 : 0;
    const streams = []; for (let i = 0; i < NSTR; i++) streams.push({ a: i / NSTR * TAU + (R1(seed + i * 2.2) - 0.5) * 0.6, r: R * (0.62 + 0.25 * R1(seed + i * 3.7)), d: R1(seed + i * 5.1) * 0.15, sw: (R1(seed + i * 7.3) < 0.5 ? 1 : -1) * (0.6 + 0.5 * R1(seed + i)) });
    const lobes = []; for (let i = 0; i < 5; i++) lobes.push({ a: i / 5 * TAU + R1(seed + i * 9.1), r: 0.72 + 0.14 * R1(seed + i * 4.4), s: 0.32 + 0.12 * R1(seed + i * 6.6), ph: R1(seed + i) * TAU });
    const glints = []; for (let i = 0; i < (CEL ? 4 : 3); i++) glints.push({ ph: R1(seed + i * 8.8) * TAU, r: 0.3 + 0.45 * R1(seed + i * 2.9), sp: (0.12 + 0.1 * R1(seed + i * 1.3)) * (i % 2 ? -1 : 1), w: 0.5 + 0.3 * R1(seed + i * 3.1) });
    const drips = [], drops = [], fines = [], ripples = [], blobs = [], beads = [], mist = [], frags = [], shards = [], liq = [], smoke = [];
    H.X.banner('UMBRA HEART', '', C.col, 1.4); H.X.sfx.hum(); H.warn(x, y, R, FORM + 0.3, C.col);
    // the beat at time t: pre (the squeeze before it), post (the swell after it), k (its index)
    const beatAt = t => { const k = Math.floor((t - B0 + 0.2) / BEAT); if (k < 0 || k >= NT) return { pre: 0, post: 0, k: -1, d: 9 }; const d = t - (B0 + k * BEAT); return { pre: d < 0 ? sm((d + 0.2) / 0.2) : 0, post: d >= 0 ? (d < 0.1 ? sm(d / 0.1) : Math.exp(-(d - 0.1) * 4.5)) : 0, k, d }; };
    const turnAt = t => 0.62 * Math.sin(t * 0.33 + seed) + 0.14 * Math.sin(t * 0.81 + seed * 0.3);
    // the pool's radius (tiles) and the heart's fade
    const poolR = t => t < TB ? R * (0.65 * sm((t - 0.1) / (FORM - 0.1)) + 0.35 * sm((t - FORM + 0.2) / 1.6)) : R * lerp(1, 1.24, H.ease.out(cl((t - TB) / 0.45)));
    const poolA = t => t < TB + 0.25 ? 1 : 1 - sm((t - TB - 0.25) / 1.5);
    const heartA = t => sm((t - 0.85) / 0.55) * (t < TB ? 1 : 0);
    // the pet: everything in the air dims smoothly near it
    const pfAt = (px, py, T, PX, PY) => 0.25 + 0.75 * sstep(0.45 * T, 1.5 * T, Math.hypot(px - PX, py - PY));
    // the heart's geometry in tiles (T = 1) relative to the floor point under it, at time t (for the simulation)
    const geoT = (f, t) => { const b = beatAt(t), con = t > TE ? H.ease.in(cl((t - TE) / TCON)) : 0, sc = (1 - 0.05 * b.pre + 0.075 * b.post) * (1 - 0.2 * con) * (t < FORM ? 0.85 + 0.15 * sm((t - 0.85) / 0.55) : 1);
      return geom(0, -(f.HZ || 3.5), HT, turnAt(t), 0.035 * Math.sin(t * 0.6), sc * (1 + 0.03 * b.pre), sc * (1 - 0.035 * b.pre)); };
    let nextTick = 0, burst = false, dripAcc = 0;
    const F = H.add({ life: LIFE, x, y, HZ: 0,
      update(dt, f) {
        const t = f.t, HZ = f.HZ || (HT * 0.5 + 1.9 + 0.1 * (ev - 1)); if (!f.HZ) f.HZ = HZ;
        // the damage beats: one Dark hit over the pool on each visible beat, inside the window only
        while (nextTick < NT && t >= B0 + nextTick * BEAT) { nextTick++; H.hitArea(x, y, R, TICK, C.dmgO({})); for (const m of H.near(x, y, R)) H.slow(m, 0.5); H.X.sfx.thud(); H.X.shake(1.5, 0.1); }
        if (!burst && t >= TB) { burst = true; doBurst(f); }
        const G = geoT(f, t);
        // drops gather on the lower edge, stretch and fall (not in the last part, when the strands draw back)
        if (t > FORM - 0.15 && t < TW) { dripAcc += DRIP * dt * (0.6 + 0.4 * H.Q()); while (dripAcc >= 1 && drips.length < 7) { dripAcc -= 1; const q = Math.random(), idx = HHALF + (Math.random() < 0.5 ? -1 : 1) * Math.round(HN * (0.02 + 0.2 * q * q)), big = Math.random();
          drips.push({ idx, age: 0, tg: 0.45 + 0.4 * Math.random(), ts: 0.45 + 0.5 * Math.random(), rb: (0.06 + 0.09 * big * big + (CEL && big > 0.8 ? 0.04 : 0)) * HT / 2.2, Lm: (0.35 + 0.75 * Math.random()) * HT / 2.2, ret: -1, L: 0, dy: (Math.random() - 0.5) * 1.5 * R * H.GY }); } if (dripAcc > 1) dripAcc = 1; }
        // fine streams (Adept and up)
        if (NFINE && t > FORM + 0.5 && t < TW && fines.length < NFINE && Math.random() < dt * 1.2) fines.push({ idx: HHALF + Math.round((Math.random() - 0.5) * HN * 0.3), age: 0, life: 1.6 + Math.random() * 1.4, dy: (Math.random() - 0.5) * R * H.GY, ph: Math.random() * TAU, rt: 0 });
        for (let i = drips.length - 1; i >= 0; i--) { const d = drips[i]; d.age += dt;
          if (d.ret < 0 && t >= TW) d.ret = 0;   // the end: drawn back in
          if (d.ret >= 0) { d.ret += dt; if (d.ret > 0.45) drips.splice(i, 1); continue; }
          if (d.age >= d.tg + d.ts) { // detach: the bulb falls; the strand snaps back up
            const p = hptI(G, d.idx), hb = -(p[1]) - d.Lm - d.rb; drops.push({ wx: x + p[0], wy: y + d.dy / 1, z: Math.max(0.3, hb + d.dy), vz: -1.2, rb: d.rb, t: 0, tl: d.Lm * 0.6 });
            d.ret = 0; d.snap = d.Lm * 0.75; }
        }
        for (let i = fines.length - 1; i >= 0; i--) { const s = fines[i]; s.age += dt; if (t >= TW && s.age < s.life - 0.4) s.age = s.life - 0.4; if (s.age >= s.life) { fines.splice(i, 1); continue; } s.rt -= dt; if (s.rt <= 0 && s.age > 0.3 && s.age < s.life - 0.2) { s.rt = 0.28; const p = hptI(G, s.idx); ripples.push({ x: x + p[0], y: y + s.dy, t: 0, life: 0.8, rm: 0.35 + 0.2 * Math.random(), w: 0.5 }); } }
        // falling drops: heavy, accelerating; a landing ripples, splashes, spreads a puddle
        for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.t += dt; d.vz -= 11 * dt; d.z += d.vz * dt;
          if (d.z <= 0) { drops.splice(i, 1); const big = d.rb / (HT / 2.2); ripples.push({ x: d.wx, y: d.wy, t: 0, life: 1.0 + big * 4, rm: 0.6 + big * 5, w: 1 }); if (ripples.length > 46) ripples.shift();
            blobs.push({ x: d.wx, y: d.wy, r: 0.35 + big * 3.5, t: 0 }); if (blobs.length > 16) blobs.shift();
            for (let q = 0; q < H.n(3 + Math.round(big * 20)); q++) { const b = Math.random() * TAU, v = 0.8 + Math.random() * 1.6; beads.push({ x: d.wx, y: d.wy, z: 0.05, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: 1.5 + Math.random() * 2.2, r: 0.025 + Math.random() * 0.035, t: 0 }); }
            if (Math.random() < 0.35 && H.X.sfx.bubble) H.X.sfx.bubble(); } }
        for (let i = beads.length - 1; i >= 0; i--) { const b = beads[i]; b.t += dt; b.vz -= 12 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; if (b.z <= 0 || b.t > 1.2) beads.splice(i, 1); }
        for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].t += dt; if (ripples[i].t >= ripples[i].life) ripples.splice(i, 1); }
        for (const b of blobs) b.t += dt;
        // mist at the pool's boundary; fragments drifting up into the heart
        const pr = poolR(t), live = t > 0.4 && t < TB;
        if (live && Math.random() < dt * (5 + ev) * H.Q()) { const b = Math.random() * TAU, rr = pr * (0.82 + 0.25 * Math.random()); mist.push({ x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * H.GY, z: 0, vz: 0.25 + Math.random() * 0.3, vx: Math.cos(b) * 0.15, t: 0, life: 1.6 + Math.random() * 1.2, s: 0.45 + Math.random() * 0.35 }); }
        if (live && t > FORM - 0.2 && Math.random() < dt * (2.2 + 0.5 * ev + (t > TW ? 4 : 0)) * H.Q()) { const b = Math.random() * TAU, rr = pr * Math.sqrt(Math.random()) * 0.9; frags.push({ x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * H.GY, z: 0.1, t: 0, sp: 0.6 + Math.random() * 0.6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, s: 0.05 + Math.random() * 0.06, sw: Math.random() * TAU }); }
        for (let i = mist.length - 1; i >= 0; i--) { const m = mist[i]; m.t += dt; m.z += m.vz * dt; m.x += m.vx * dt; if (m.t >= m.life) mist.splice(i, 1); }
        const tipZ = HZ - 0.5 * HT * 0.95;
        for (let i = frags.length - 1; i >= 0; i--) { const q = frags[i]; q.t += dt; q.sp += dt * (t > TW ? 2.2 : 0.8); q.rot += q.vr * dt; const dx = x - q.x, dy = (y - q.y), dz = tipZ - q.z, d = Math.hypot(dx, dy, dz) || 1, v = q.sp * dt; q.x += dx / d * v * 0.6 + Math.cos(q.t * 3 + q.sw) * 0.2 * dt; q.y += dy / d * v * 0.6; q.z += dz / d * v + 0.15 * dt; if (d < 0.25 || q.t > 6) frags.splice(i, 1); }
        // the burst's pieces
        for (let i = shards.length - 1; i >= 0; i--) { const s = shards[i]; s.t += dt; if (s.rest) { if (s.t > s.life) shards.splice(i, 1); continue; } const k = Math.exp(-s.drag * dt); s.vx *= k; s.vy *= k; s.vz = s.vz * k - s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.ang += s.w * dt; s.fl += s.fw * dt; if (s.z <= 0) { s.z = 0; s.rest = true; s.life = s.t + 0.7; } else if (s.t > s.life) shards.splice(i, 1); }
        for (let i = liq.length - 1; i >= 0; i--) { const d = liq[i]; d.t += dt; d.vz -= 10 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; if (d.z <= 0) { liq.splice(i, 1); if (ripples.length < 60) ripples.push({ x: d.x, y: d.y, t: 0, life: 0.9, rm: 0.4 + d.r * 4, w: 1 }); blobs.push({ x: d.x, y: d.y, r: 0.3 + d.r * 3, t: 0 }); if (blobs.length > 24) blobs.shift(); } }
        for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vx *= Math.exp(-1.6 * dt); s.vy *= Math.exp(-1.6 * dt); s.vz = s.vz * Math.exp(-1.2 * dt) + 0.12 * dt; if (s.t >= s.life) smoke.splice(i, 1); }
        // formation: smoke where the streams leave the floor
        if (t < 0.9 && Math.random() < dt * 14 * H.Q()) { const s = streams[Math.floor(Math.random() * NSTR)]; H.P({ kind: 'smoke', x: x + Math.cos(s.a) * s.r, y: y + Math.sin(s.a) * s.r * H.GY - 0.2, vx: (Math.random() - 0.5) * 0.4, vy: -0.4 - Math.random() * 0.4, life: 0.7, max: 0.7, size: 0.35, color: 'rgba(43,25,66,' }); }
        // the end: sparks spat from the widening fissures
        if (t > TW && t < TB && Math.random() < dt * 10 * H.Q()) { const p = hptI(G, Math.random() * HN); H.P({ kind: 'spark', x: x + p[0] * 0.7, y: y + p[1] * 0.7 + 0.3, vx: p[0] * 1.5, vy: -0.5 - Math.random(), g: 2, life: 0.4, max: 0.4, size: 1.5, color: Math.random() < 0.5 ? EDGE : ACC }); }
      },
      drawUnder(c, f, X, Y, T, t) {
        t = f.t; const pr = poolR(t) * T, pa = poolA(t), b = beatAt(t), fl = b.post * (t < TE ? 1 : 0), wide = t > TW ? sm((t - TW) / (TE - TW)) : 0, endK = cl((LIFE - t) / 0.4);
        if (pa * endK < 0.01) return;
        const A = pa * endK;
        // the pool: a dark translucent surface, its edge breathing in lobes; the puddles where drops landed
        const ps = poolSpr();
        floorSpr(c, ps, X, Y, pr * 1.05, 0.9 * A);
        for (const l of lobes) { const rr = pr * l.r * (1 + 0.04 * Math.sin(t * 1.3 + l.ph)), lx = X + Math.cos(l.a) * rr, ly = Y + Math.sin(l.a) * rr * H.GY; floorSpr(c, ps, lx, ly, pr * l.s, 0.55 * A); }
        for (const q of blobs) { const g2 = H.ease.out(cl(q.t / 0.45)), fa = t < TB ? 1 : 1; floorSpr(c, ps, H.sx(q.x), H.sy(q.y), q.r * T * (0.4 + 0.6 * g2), 0.5 * A * fa * cl(1.2 - q.t / 14)); }
        // the glow of the heart on its surface and the heart's violet reflection, flipped, beating with it
        const hA = heartA(t);
        if (hA > 0.01 || t < TB + 0.4) { floorSpr(c, glowSprite(ENERGY), X, Y, pr * 0.9, A * (0.06 + 0.18 * fl + 0.18 * wide + (t > TE && t < TB + 0.4 ? 0.6 * (1 - cl((t - TB) / 0.4)) : 0)), true);
          if (hA > 0.01) { const G = geoT(f, t), s = HT * T / 1.71 / SU * 0.95; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, A * hA * (0.18 + 0.3 * fl + 0.3 * wide)); c.translate(X + G.near * T * 0.3, Y + pr * H.GY * 0.12); c.scale(G.ws * G.kx, -H.GY * 0.62 * G.ky); c.drawImage(lineSpr(), -SCX * s, -(SCY + HMID * SU) * s, SW * s, SW * s); c.restore(); } }
        // glints sliding over the surface
        c.save(); c.globalCompositeOperation = 'lighter'; for (const gq of glints) { const b2 = gq.ph + t * gq.sp, gx = X + Math.cos(b2) * pr * gq.r, gy = Y + Math.sin(b2) * pr * gq.r * H.GY, gw = pr * gq.w * 0.5; c.globalAlpha = A * (0.32 + 0.12 * Math.sin(t * 2 + gq.ph)) * cl(t / 1.0); c.drawImage(glintSpr(), gx - gw, gy - gw * 0.12, gw * 2, gw * 0.24); } c.restore();
        // the veins beneath the surface, lit by each beat (light only)
        const va = A * (0.03 + 0.42 * fl + 0.3 * wide) * cl((t - FORM + 0.3) / 0.6); if (va > 0.01) { c.save(); c.translate(X, Y); c.scale(1, H.GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
          for (const [col, lw, al] of [[ENERGY, Math.max(2.5, T * 0.16), 0.4], [EDGE, Math.max(1, T * 0.05), 0.8]]) { c.beginPath(); for (const v of VE) { c.moveTo(v[0][0] * pr, v[0][1] * pr); for (let k = 1; k < v.length; k++) c.lineTo(v[k][0] * pr, v[k][1] * pr); } c.globalAlpha = Math.min(1, va * al); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); } c.restore(); }
        // the rim: light only, brighter on the beat; during formation the converging inflow rings
        floorSpr(c, bandLSpr(), X, Y, pr * 1.04, A * (0.26 + 0.25 * fl + 0.15 * wide), true);
        if (t < FORM) for (let i = 0; i < 3; i++) { const q = ((t * 1.2 + i / 3) % 1), rr = R * T * (1.15 - 0.8 * q); floorSpr(c, bandLSpr(), X, Y, rr, 0.4 * Math.sin(q * Math.PI) * cl(t / 0.3), true); }
        // the beat's ring of light racing across the pool
        if (b.k >= 0 && b.d >= 0 && b.d < 0.6) { const q = b.d / 0.6; floorSpr(c, bandLSpr(), X, Y, pr * (0.25 + 0.85 * H.ease.out(q)), A * 0.7 * (1 - q), true); if (ADE) floorSpr(c, bandSpr(), X, Y, pr * (0.15 + 0.7 * H.ease.out(q)), A * 0.35 * (1 - q)); }
        // ripples: a dark ring with a violet edge, then a light ring
        for (const r of ripples) { const q = r.t / r.life, rr = r.rm * T * H.ease.out(q) + 2, rx = H.sx(r.x), ry = H.sy(r.y); floorSpr(c, bandSpr(), rx, ry, rr, A * 0.55 * (1 - q) * r.w); floorSpr(c, bandLSpr(), rx, ry, rr * 0.92, A * 0.45 * (1 - q) * r.w, true); }
        // the burst on the floor: the flash, the violet-black shockwave, a light one after it, the surge's bright edge
        if (t >= TB) { const p = t - TB; floorSpr(c, glowSprite(ACC), X, Y, RB * T * 1.1, 0.55 * Math.max(0, 1 - p / 0.35), true);
          const waves = CEL ? [[0, 1.0, 1, 0], [0.1, 1.25, 0.7, 1], [0.24, 1.5, 0.5, 1]] : ADE ? [[0, 1.0, 1, 0], [0.12, 1.25, 0.7, 1]] : [[0, 1.0, 1, 0], [0.14, 1.15, 0.6, 1]];
          for (const [d, sc, w, L] of waves) { const q = cl((p - d) / 0.7); if (q > 0 && q < 1) floorSpr(c, L ? bandLSpr() : bandSpr(), X, Y, RB * T * 1.25 * sc * H.ease.out(q), (1 - q) * w * endK, !!L); }
          const q = cl(p / 0.5); if (q < 1) floorSpr(c, bandLSpr(), X, Y, pr * 1.03, (1 - q) * 0.9, true); }
      },
      draw(c, f, X, Y, T, t) {
        t = f.t; const SC = scr(c), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5;
        // the heart's height: its top below the HUD (the top band of the screen)
        if (!f.Z) { const want = HT * 0.5 + 1.9 + 0.1 * (ev - 1), room = (Y - (SC.y0 + T * 3.0)) / T - HT * 0.55; f.HZ = Math.max(HT * 0.5 + 1.2, Math.min(want, room)); f.Z = 1; }
        const b = beatAt(t), fl = b.post * (t < TE ? 1 : 0) + b.pre * 0.25 * (t < TE ? 1 : 0), wide = t >= TE ? 1 : t > TW ? sm((t - TW) / (TE - TW)) : 0, con = t > TE ? cl((t - TE) / TCON) : 0;
        const Gt = geoT(f, t), tr = con > 0 ? (Math.random() - 0.5) * T * 0.08 * con : 0;
        const G = geom(X + tr, Y - f.HZ * T + Gt.cy * 0 + tr * 0.5, HT * T, turnAt(t), Gt.lean, Gt.kx, Gt.ky);
        G.cy = Y - f.HZ * T; const hA = heartA(t), hpf = 0.25 + 0.75 * sstep(0.2 * T, 1.4 * T, Math.hypot(PX - G.cx, (PY - G.cy) * 1.15) - HT * T * 0.55);
        const AIR = cl((LIFE - t) / 0.5);
        // mist at the boundary, rising (behind everything above it)
        { const sp = puffSpr(); c.save(); for (const m of mist) { const u = m.t / m.life, a = Math.sin(u * Math.PI) * 0.75, mx = H.sx(m.x), my = H.sy(m.y) - m.z * T, r = T * m.s * (0.7 + 0.6 * u); c.globalAlpha = a * pfAt(mx, my, T, PX, PY) * AIR; c.drawImage(sp, mx - r, my - r * 0.75, r * 2, r * 1.5); } c.restore(); }
        // fragments drifting up into the heart
        for (const q of frags) { const qx = H.sx(q.x), qy = H.sy(q.y) - q.z * T, a = cl(q.t / 0.4) * cl((q.z - 0.1) < 0 ? 0 : 1) * (1 - sstep(f.HZ - 0.5 * HT - 0.8, f.HZ - 0.5 * HT, q.z) * 0.9) * pfAt(qx, qy, T, PX, PY); frag(c, qx, qy, q.s * T, q.rot, a); if (a > 0.05) glow(c, qx, qy, T * 0.12, EDGE, a * 0.35); }
        // formation: streams of shadow rise from the floor, swirling, into the point; the outline climbs; the volume closes
        if (t < FORM + 0.2) { const tip = hpt(G, 0, 1.12);
          c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
          for (let i = 0; i < NSTR; i++) { const s = streams[i], uh = H.ease.out(cl((t - s.d) / 0.8)), ut = H.ease.in(cl((t - 0.75 - s.d * 0.5) / 0.55)); if (uh <= ut + 0.01) continue;
            const p0 = [X + Math.cos(s.a) * s.r * T, Y + Math.sin(s.a) * s.r * T * H.GY], p3 = tip, p1 = [p0[0] + Math.cos(s.a + s.sw) * T * 0.9, p0[1] - T * 1.4], p2 = [p3[0] + Math.cos(s.a) * T * 1.1 * s.sw, p3[1] + T * 0.9];
            const N = 18, pts = []; for (let k = 0; k <= N; k++) { const u = lerp(ut, uh, k / N), m = 1 - u, bx = m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0], by = m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1], sw = Math.sin(u * 9 - t * 7 + i) * T * 0.1 * (1 - u); pts.push([bx + sw, by, u]); }
            const pf = pfAt(pts[N >> 1][0], pts[N >> 1][1], T, PX, PY);
            for (let k = 1; k <= N; k++) { const u = pts[k][2], e = Math.min(1, (k / N) * 4, (N - k + 1) / N * 5), w = T * (0.26 - 0.14 * u); c.globalAlpha = 0.75 * e * pf; c.strokeStyle = k % 2 ? BODY : '#1E0E38'; c.lineWidth = w; c.beginPath(); c.moveTo(pts[k - 1][0], pts[k - 1][1]); c.lineTo(pts[k][0], pts[k][1]); c.stroke(); }
            c.globalCompositeOperation = 'lighter'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k <= N; k++) c.lineTo(pts[k][0], pts[k][1]); c.globalAlpha = 0.5 * pf; c.strokeStyle = ENERGY; c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); c.globalAlpha = 0.7 * pf; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, T * 0.025); c.stroke();
            const hd = pts[N]; if (uh < 0.99) glow(c, hd[0], hd[1], T * 0.35, EDGE, 0.6 * pf); c.globalCompositeOperation = 'source-over'; }
          c.restore();
          const uo = sm((t - 0.6) / 0.5), fo = 1 - sm((t - 1.15) / 0.35);
          if (uo > 0 && fo > 0) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; const ends = partHeart(c, G, uo); if (ends) { c.globalAlpha = 0.85 * fo * hpf; c.strokeStyle = BODY; c.lineWidth = G.u * 0.14; c.stroke(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * fo * hpf; c.strokeStyle = EDGE; c.lineWidth = Math.max(1.2, G.u * 0.025); c.stroke(); if (uo < 1) for (const p of ends) glow(c, p[0], p[1], T * 0.45, ACC, 0.8 * fo * hpf); } c.restore(); }
          glow(c, tip[0], tip[1], T * 0.8, ENERGY, 0.5 * Math.sin(cl(t / FORM) * Math.PI) * hpf); }
        // fine streams falling from the edge into the pool
        for (const s of fines) { const p = hptI(G, s.idx), gx = p[0], gy0 = p[1] + G.u * 0.02, floorY = Y + s.dy * T, head = H.ease.in(cl(s.age / 0.35)), top = cl((s.age - s.life + 0.4) / 0.4), y0 = lerp(gy0, floorY, top * top), y1 = lerp(gy0, floorY, head); if (y1 - y0 < 2) continue; const pf = pfAt(gx, (y0 + y1) / 2, T, PX, PY) * hA;
          c.save(); c.lineCap = 'round'; c.beginPath(); for (let k = 0; k <= 10; k++) { const u = k / 10, yy = lerp(y0, y1, u), xx = gx + Math.sin(u * 6 + t * 5 + s.ph) * T * 0.035 * u; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
          c.globalAlpha = 0.9 * pf; c.strokeStyle = BODY; c.lineWidth = Math.max(1.2, T * 0.05); c.stroke(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * pf; c.strokeStyle = SMOKE; c.lineWidth = Math.max(0.6, T * 0.015); c.stroke();
          for (let k = 0; k < 3; k++) { const u = ((t * 1.6 + k / 3 + s.ph) % 1), yy = lerp(y0, y1, u); if (yy > y1) continue; c.globalAlpha = 0.6 * pf; blitSized(c, glowSprite(EDGE), gx - T * 0.06, yy - T * 0.06, T * 0.12, T * 0.12); } c.restore(); }
        // the heart
        if (hA > 0.01) { const formK = t < FORM ? 1 - sm((t - 0.85) / 0.55) : 0;
          drawHeart(c, G, { a: hA * hpf, inner: 0.16 + 0.35 * fl + 0.75 * wide + 0.5 * formK + 0.6 * con, crack: 0.22 + 0.25 * formK, flash: fl, wide, bands: BANDS ? Array.from({ length: BANDS }, (_, i) => ((t * (0.22 + 0.09 * i) + i * 0.37) % 1)) : [], beads: ADE, currents: CUR, t, cracks: CR });
          if (con > 0) glow(c, G.cx, G.cy + G.hp * 0.1, G.hp * (0.5 - 0.3 * con), ACC, 0.5 * con * hpf); }
        // the hanging strands (over the heart's lower edge): gather, stretch, snap back
        for (const d of drips) { const p = hptI(G, d.idx), ax = p[0], ay = p[1] - G.u * 0.02, pf = pfAt(ax, ay, T, PX, PY) * hA; let L, rb, wn;
          if (d.ret < 0) { const g1 = sm(d.age / d.tg), v = cl((d.age - d.tg) / d.ts); rb = d.rb * T * Math.pow(g1, 0.7) * (1 + 0.1 * v); L = (0.05 * g1 + (d.Lm - 0.05) * Math.pow(v, 1.6)) * T; wn = rb * (0.6 - 0.42 * v); }
          else if (d.snap) { const q = d.ret; L = d.snap * T * Math.exp(-q * 5) * Math.abs(Math.cos(q * 9)); rb = d.rb * T * 0.3 * Math.exp(-q * 3); wn = rb * 0.5; }
          else { const q = cl(d.ret / 0.45); rb = d.rb * T * (1 - q); L = d.Lm * T * 0.4 * (1 - q) * (1 - q); wn = rb * 0.5; }
          if (rb < 0.5) continue; strand(c, ax, ay, ax + Math.sin(t * 2 + d.idx) * rb * 0.15, ay + L + rb, rb, Math.max(0.6, wn), rb * 0.95, pf); }
        // the falling drops and their splashes
        for (const d of drops) { const dx = H.sx(d.wx), dy = H.sy(d.wy) - d.z * T, rb = d.rb * T, sp = Math.min(1.4, -d.vz * 0.18); drop(c, dx, dy, rb, sp, Math.max(0, d.tl * T * Math.exp(-d.t * 4) + rb * sp * 1.2), pfAt(dx, dy, T, PX, PY) * AIR); }
        if (beads.length) { c.save(); c.fillStyle = BODY; for (const q of beads) { const bx = H.sx(q.x), by = H.sy(q.y) - q.z * T, r = Math.max(0.8, q.r * T); c.globalAlpha = pfAt(bx, by, T, PX, PY) * (1 - cl((q.t - 0.6) / 0.6)); c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill(); } c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(208,174,255,0.7)'; for (const q of beads) { const bx = H.sx(q.x), by = H.sy(q.y) - q.z * T, r = Math.max(0.8, q.r * T); if (r < 1.2) continue; c.globalAlpha = pfAt(bx, by, T, PX, PY); c.fillRect(bx - r * 0.5, by - r * 0.6, r * 0.45, r * 0.45); } c.restore(); }
        // the burst in the air
        if (t >= TB) { const p = t - TB, bx = X, by = Y - f.HZ * T, bpf = 0.3 + 0.7 * sstep(0.2 * T, 1.4 * T, Math.hypot(PX - bx, PY - by) - HT * T * 0.4);
          const fl2 = Math.max(0, 1 - p / 0.3); if (fl2 > 0) { glow(c, bx, by, HT * T * (0.9 + 0.5 * H.ease.out(cl(p / 0.12))), ACC, 0.75 * fl2 * bpf); glow(c, bx, by, HT * T * 0.35, WHITE, 0.8 * fl2 * bpf); glow(c, bx, by, HT * T * 1.6, ENERGY, 0.5 * fl2 * bpf); }
          // the shockwave in the air: a violet-black band racing out, a light one inside it
          for (const [d, sc, L] of CEL ? [[0, 1, 0], [0.06, 0.85, 1], [0.16, 1.3, 1]] : [[0, 1, 0], [0.08, 0.85, 1]]) { const q = cl((p - d) / 0.6); if (q > 0 && q < 1) { const rr = RB * T * 1.15 * sc * H.ease.out(q), ry = rr * 0.38; c.save(); if (L) c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - q) * 0.95 * bpf; c.drawImage(L ? bandLSpr() : bandSpr(), bx - rr, by - ry, rr * 2, ry * 2); c.restore(); } }
          const ra = Math.max(0, 1 - p / 0.5); if (ra > 0) { const NR = 8 + ev; for (let i = 0; i < NR; i++) { const b = i / NR * TAU + R1(seed + i * 3) * 0.5, L = HT * T * (0.9 + 0.7 * R1(seed + i * 5)) * H.ease.out(cl(p / 0.25)); H.ray(c, bx, by, b, L, T * (0.25 + 0.25 * R1(seed + i)), i % 3 ? EDGE : ACC, 0.5 * ra * bpf); } }
          // liquid shadow and smoke where the heart was
          const sp = dpuffSpr(); c.save(); for (const s of smoke) { const u = s.t / s.life, sx = H.sx(s.x), sy = H.sy(s.y) - s.z * T, r = T * s.s * (0.6 + 0.9 * H.ease.out(u)); c.globalAlpha = Math.sin(Math.min(1, u * 3) * Math.PI / 2) * (1 - u) * 0.85 * pfAt(sx, sy, T, PX, PY); c.drawImage(s.d ? sp : puffSpr(), sx - r, sy - r, r * 2, r * 2); } c.restore(); }
        for (const d of liq) { const dx = H.sx(d.x), dy = H.sy(d.y) - d.z * T, rb = d.r * T, a = pfAt(dx, dy, T, PX, PY); c.save(); c.translate(dx, dy); const vx = d.vx * T, vy = d.vy * T - d.vz * T; c.rotate(Math.atan2(vy, vx) - Math.PI / 2); drop(c, 0, 0, rb, Math.min(1.5, Math.hypot(vx, vy) / T * 0.12), 0, a); c.restore(); }
        for (const s of shards) { const sx = H.sx(s.x), sy = H.sy(s.y) - s.z * T, a = (s.rest ? 1 - cl((s.t - s.life + 0.7) / 0.7) : 1) * (1 - cl((s.t - s.maxT) / 0.5)) * pfAt(sx, sy, T, PX, PY); glassShard(c, sx, sy, s.L * T, s.wd * T, s.ang, s.rest ? 0.3 : Math.cos(s.fl), a, 0.5 + 0.5 * Math.sin(s.fl * 1.3 + s.ang)); }
      } });
    function doBurst(f) {
      H.hitArea(x, y, RB, BURST, C.dmgO({ kb: 6, stun: 0.5 }));
      H.X.flash(0.2, ACC); H.X.hitstop(0.08); H.X.sfx.crash(); H.X.shake(16 + 2 * ev, 0.4); H.X.light(x, y, RB * 1.3, 0.4);
      H.burst(x, y - 0.4, 'spark', 22 + 2 * ev, { v: 7, up: 2, g: 4, life: 0.55, size: 2.2, color: [EDGE, ACC, ENERGY] });
      const HZ = f.HZ, G = geom(0, -HZ, HT, turnAt(f.t), 0, 0.82, 0.82);
      // curved dark glass: slivers of the shell flung out from its surface, tumbling (Celestial: a slow trailing fall)
      for (let i = 0; i < H.n(NSHARD); i++) { const p = hptI(G, i / NSHARD * HN + Math.random() * 3), ox = p[0] * 0.8, oz = -p[1], dz = oz - HZ, dd = Math.hypot(ox, dz) || 1, v = 2.8 + Math.random() * 3.2 + 0.15 * ev, slow = CEL && i % 3 === 0;
        shards.push({ x: x + ox, y: y + (Math.random() - 0.5) * 0.4, z: oz, vx: ox / dd * v * (slow ? 0.5 : 1), vy: (Math.random() - 0.5) * 2.5, vz: dz / dd * v * (slow ? 0.4 : 1) + 2.2, g: slow ? 1.4 : 9, drag: slow ? 1.4 : 0.3, ang: Math.random() * TAU, w: (Math.random() - 0.5) * (slow ? 2 : 9), fl: Math.random() * TAU, fw: (Math.random() - 0.5) * (slow ? 3 : 12), L: (0.42 + 0.5 * Math.random()) * HT / 2.2, wd: (0.09 + 0.08 * Math.random()) * HT / 2.2, t: 0, life: slow ? 2.4 : 2.0, maxT: slow ? 2.0 : 1.6, rest: false }); }
      // liquid shadow flung out in arcs, landing in the surging pool
      for (let i = 0; i < H.n(NLIQ); i++) { const b = i / NLIQ * TAU + Math.random() * 0.4, v = 2 + Math.random() * 2.6; liq.push({ x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.2, z: HZ - 0.2, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.55, vz: 1 + Math.random() * 2.5, r: (0.05 + 0.06 * Math.random()) * HT / 2.2, t: 0 }); }
      // smoke where it was; mist as the pool's surface breaks
      for (let i = 0; i < H.n(9 + ev); i++) { const b = Math.random() * TAU, v = 1 + Math.random() * 1.6; smoke.push({ x: x + Math.cos(b) * 0.3, y: y, z: HZ + Math.sin(b) * 0.4, vx: Math.cos(b) * v, vy: 0, vz: Math.sin(b) * v * 0.6, s: 0.5 + 0.4 * Math.random() + 0.04 * ev, t: 0, life: 1.0 + Math.random() * 0.6 + (CEL ? 0.6 : 0), d: i % 2 }); }
      for (let i = 0; i < H.n(16 + 3 * ev); i++) { const b = Math.random() * TAU, rr = R * (0.2 + 1.0 * Math.sqrt(Math.random())); mist.push({ x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * H.GY, z: 0, vz: 0.2 + Math.random() * 0.35, vx: Math.cos(b) * 0.3, t: -Math.random() * 0.5, life: 1.3 + Math.random() * (CEL ? 0.9 : 0.6), s: 0.5 + Math.random() * 0.45 }); }
      for (const m of mist) if (m.t < 0) m.t = 0;
      drips.length = 0; fines.length = 0;
    }
    void F;
    H.X.after(TW, () => { H.X.sfx.crack(); H.X.shake(3, 0.3); });
    H.X.after(TE - 0.6, () => H.warn(x, y, RB, 0.6 + TCON, C.col));
    H.X.after(TE, () => { H.X.sfx.whoosh(); H.X.shake(4, TCON); });
    H.X.after(TB + 0.12, () => H.X.sfx.thud());
  };
})();
