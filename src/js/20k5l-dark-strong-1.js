/* ---------- Dark Strong, reworked: Eclipse Disc ----------
   A violet seam opens in front of the pet and a great obsidian disc unfurls out of it (about 1.25x the old one, 1.3x at
   Celestial). It stands on its edge and slides along the aim as a real 3D coin: a thick plum side (stacked side layers
   offset by its yaw), a polished obsidian face (conchoidal facets, machined grooves, a raised inner lip, a void hub and
   violet energy veins spiralling inward) that spins in its own plane while the lighting stays fixed (a baked shade, a
   sheen band that sweeps across the face, a rim glint that runs round the lit edge), a hot #A55CFF rim, an eclipse corona
   of violet wisps turning the other way behind it, and a gentle wobble (yaw precession, roll leaning into the travel).
   It cuts through the monsters (one hit each), throwing rim sparks and leaving a violet light scar and pale smoke on the
   floor (light only, no stains). At the end of its run it brakes, swells for a beat, then contracts: the face goes
   face-on, the spin whips up, violet streaks and the corona are drawn inward and it shrinks to a white-violet point that
   bursts: a separate hit in a small radius, a flash, a standing ring, a floor shockwave, short rays and obsidian shards.
   Adept adds glinting fragments orbiting the rim; Celestial a second counter-turning corona and a bigger burst.
   Damage: the pass 1.3 x base x K and the burst 1.1 x base x K, both x evoK = 1 + 0.12 (evo - 1)
   (1.00 / 1.36 at Adept / 1.72 at Celestial; a little steeper than the ults' 0.08). Burst radius 1.45 + 0.05 (evo - 1).
   Sprites (face, side, shade, sheen, rim, corona, glint, ring) are baked once, lazily, a couple of ms per frame from the
   first cast (the warm hook only reaches the ults; S.eclipsedisc.warm bakes them all if anyone calls it). */
(() => {
  const S = ELEM_IMPL.dark.strong, TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const evoK = C => 1 + 0.12 * (evoOf(C) - 1);

  /* ---- cached sprites: SZ px, the disc's radius DR px, centred ---- */
  const SZ = 256, CC = 128, DR = 118;
  const disc = (g, r) => { g.beginPath(); g.arc(CC, CC, r, 0, TAU); };
  const BAKE = {
    // the polished obsidian face: the texture spins with it
    face: () => fxSprite('dsd_face', SZ, SZ, g => {
      let gr = g.createRadialGradient(CC, CC, 0, CC, CC, DR); gr.addColorStop(0, VOID); gr.addColorStop(0.35, '#100820'); gr.addColorStop(0.7, BODY); gr.addColorStop(0.93, PLUM); gr.addColorStop(1, '#3A1A58');
      g.fillStyle = gr; disc(g, DR); g.fill(); g.save(); disc(g, DR); g.clip();
      // conchoidal facets: soft lighter and darker shells of glass
      for (let i = 0; i < 46; i++) { const a = R1(i * 3.1) * TAU, d = Math.sqrt(R1(i * 5.7)) * DR * 0.95, s = 10 + R1(i * 7.3) * 26, x = CC + Math.cos(a) * d, y = CC + Math.sin(a) * d, lit = R1(i * 1.9) < 0.5;
        const g2 = g.createRadialGradient(x - s * 0.3, y - s * 0.3, 0, x, y, s); g2.addColorStop(0, lit ? 'rgba(120,90,170,0.16)' : 'rgba(0,0,0,0.3)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = g2;
        g.beginPath(); const k = 5 + (i % 3); for (let j = 0; j < k; j++) { const b = j / k * TAU + R1(i + j) * 0.6, rr = s * (0.6 + R1(i * 2 + j * 3) * 0.5); j ? g.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr) : g.moveTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); } g.closePath(); g.fill(); }
      // machined grooves
      for (let r = 20; r < DR; r += 5 + (r % 3)) { g.strokeStyle = (r / 5 | 0) % 2 ? 'rgba(165,92,255,0.05)' : 'rgba(0,0,0,0.22)'; g.lineWidth = 1; disc(g, r); g.stroke(); }
      // spiral energy veins running in to the hub (they make the spin readable)
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const a0 = i / 5 * TAU + 0.3; for (const [lw, col, al] of [[5, ENERGY, 0.22], [2.2, EDGE, 0.45], [0.9, ACC, 0.55]]) { g.strokeStyle = rgba(col, al); g.lineWidth = lw; g.beginPath(); for (let j = 0; j <= 30; j++) { const v = j / 30, r = DR * (0.9 - v * 0.72), b = a0 + v * 2.4 + Math.sin(v * 9 + i) * 0.05; j ? g.lineTo(CC + Math.cos(b) * r, CC + Math.sin(b) * r) : g.moveTo(CC + Math.cos(b) * r, CC + Math.sin(b) * r); } g.stroke(); } }
      // a fine crack web
      g.strokeStyle = 'rgba(208,174,255,0.18)'; g.lineWidth = 0.8;
      for (let i = 0; i < 9; i++) { let a = R1(i * 9.1) * TAU, r = DR * (0.3 + R1(i * 4.4) * 0.55), x = CC + Math.cos(a) * r, y = CC + Math.sin(a) * r; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { a += (R1(i * 7 + j) - 0.5) * 1.6; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); } g.stroke(); }
      g.globalCompositeOperation = 'source-over';
      // the raised inner lip (a groove then a lit edge) and the void hub
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 6; disc(g, DR * 0.6); g.stroke();
      g.strokeStyle = 'rgba(165,92,255,0.45)'; g.lineWidth = 1.6; disc(g, DR * 0.6 + 3.2); g.stroke();
      g.strokeStyle = 'rgba(208,174,255,0.25)'; g.lineWidth = 1; disc(g, DR * 0.6 - 3.5); g.stroke();
      gr = g.createRadialGradient(CC, CC, 0, CC, CC, DR * 0.2); gr.addColorStop(0, '#000000'); gr.addColorStop(0.7, VOID); gr.addColorStop(1, 'rgba(8,5,15,0)'); g.fillStyle = gr; disc(g, DR * 0.2); g.fill();
      g.strokeStyle = rgba(EDGE, 0.7); g.lineWidth = 1.4; disc(g, DR * 0.14); g.stroke();
      // six notches in the outer lip
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.save(); g.translate(CC + Math.cos(a) * DR * 0.9, CC + Math.sin(a) * DR * 0.9); g.rotate(a); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(-7, -3, 14, 6); g.fillStyle = 'rgba(165,92,255,0.5)'; g.fillRect(-7, -3, 14, 1.2); g.restore(); }
      g.restore(); }),
    // one slice of the thick side: plum body, a violet seam at its border
    side: () => fxSprite('dsd_side', SZ, SZ, g => { const gr = g.createRadialGradient(CC - 30, CC - 30, 10, CC, CC, DR); gr.addColorStop(0, '#6A5080'); gr.addColorStop(0.55, SMOKE); gr.addColorStop(1, PLUM); g.fillStyle = gr; disc(g, DR); g.fill(); g.strokeStyle = rgba(EDGE, 0.75); g.lineWidth = 3; disc(g, DR - 1.5); g.stroke(); g.strokeStyle = 'rgba(8,5,15,0.5)'; g.lineWidth = 2; disc(g, DR - 5); g.stroke(); }),
    // fixed lighting: lit upper left, deep lower right, a reflected violet bounce at the bottom
    shade: () => fxSprite('dsd_shade', SZ, SZ, g => { let gr = g.createRadialGradient(CC - DR * 0.4, CC - DR * 0.45, DR * 0.05, CC + DR * 0.1, CC + DR * 0.12, DR * 1.15);
      gr.addColorStop(0, 'rgba(208,174,255,0.22)'); gr.addColorStop(0.3, 'rgba(120,80,170,0.06)'); gr.addColorStop(0.62, 'rgba(8,5,15,0.1)'); gr.addColorStop(0.85, 'rgba(8,5,15,0.5)'); gr.addColorStop(1, 'rgba(8,5,15,0.75)'); g.fillStyle = gr; disc(g, DR); g.fill();
      g.save(); disc(g, DR); g.clip(); gr = g.createLinearGradient(0, CC + DR * 0.55, 0, CC + DR); gr.addColorStop(0, 'rgba(109,40,168,0)'); gr.addColorStop(1, 'rgba(109,40,168,0.35)'); g.fillStyle = gr; g.fillRect(0, CC + DR * 0.5, SZ, DR);
        // a hard specular: an oval window glint high on the lit side
        g.globalCompositeOperation = 'lighter'; g.translate(CC - DR * 0.42, CC - DR * 0.5); g.rotate(-0.7); gr = g.createRadialGradient(0, 0, 0, 0, 0, DR * 0.26); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.3, 'rgba(208,174,255,0.22)'); gr.addColorStop(1, 'rgba(208,174,255,0)'); g.fillStyle = gr; g.scale(1, 0.4); g.beginPath(); g.arc(0, 0, DR * 0.26, 0, TAU); g.fill(); g.restore(); }),
    // a diagonal sheen band, masked to the disc: swept across the face
    sheen: () => fxSprite('dsd_sheen', SZ, SZ, g => { const gr = g.createLinearGradient(CC - 40, 0, CC + 40, 0); gr.addColorStop(0, 'rgba(208,174,255,0)'); gr.addColorStop(0.35, 'rgba(208,174,255,0.18)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.42)'); gr.addColorStop(0.65, 'rgba(208,174,255,0.18)'); gr.addColorStop(1, 'rgba(208,174,255,0)'); g.fillStyle = gr; g.fillRect(CC - 40, 0, 80, SZ);
      g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(CC, CC, DR * 0.8, CC, CC, DR); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = m; disc(g, DR); g.fill(); }),
    // the hot rim: a feathered ring of energy
    rim: () => fxSprite('dsd_rim', SZ, SZ, g => { const gr = g.createRadialGradient(CC, CC, 0, CC, CC, CC);
      [[0, 'rgba(109,40,168,0)'], [0.78, 'rgba(109,40,168,0)'], [0.86, 'rgba(109,40,168,0.35)'], [0.905, 'rgba(165,92,255,0.95)'], [0.925, 'rgba(208,174,255,1)'], [0.945, 'rgba(165,92,255,0.7)'], [0.98, 'rgba(109,40,168,0.18)'], [1, 'rgba(109,40,168,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, SZ, SZ); }),
    // a glint arc on the rim (turned to wherever the light catches it)
    glint: () => fxSprite('dsd_glint', SZ, SZ, g => { g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; for (const [lw, al] of [[10, 0.12], [5, 0.3], [2, 0.9]]) { const gr = g.createLinearGradient(CC - DR, CC - DR, CC + DR * 0.2, CC + DR * 0.2); gr.addColorStop(0, `rgba(255,255,255,0)`); gr.addColorStop(0.5, `rgba(240,225,255,${al})`); gr.addColorStop(1, `rgba(255,255,255,0)`); g.strokeStyle = gr; g.lineWidth = lw; g.beginPath(); g.arc(CC, CC, DR * 0.935, Math.PI * 0.95, Math.PI * 1.55); g.stroke(); } }),
    // the eclipse corona: violet wisps round a dark core; drawn at twice the disc's size
    corona: () => fxSprite('dsd_corona', SZ, SZ, g => { const R0 = CC * 0.5; let gr = g.createRadialGradient(CC, CC, R0 * 0.9, CC, CC, CC); gr.addColorStop(0, 'rgba(165,92,255,0.55)'); gr.addColorStop(0.18, 'rgba(109,40,168,0.3)'); gr.addColorStop(0.5, 'rgba(70,48,82,0.08)'); gr.addColorStop(1, 'rgba(43,11,69,0)'); g.fillStyle = gr; g.fillRect(0, 0, SZ, SZ);
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + R1(i) * 0.15, L = R0 * (0.35 + R1(i * 3.3) * 0.62), w = 0.05 + R1(i * 7.7) * 0.06, curl = (R1(i * 1.3) - 0.5) * 0.5;
        const x0 = CC + Math.cos(a) * R0 * 0.95, y0 = CC + Math.sin(a) * R0 * 0.95, xm = CC + Math.cos(a + curl * 0.5) * (R0 + L * 0.55), ym = CC + Math.sin(a + curl * 0.5) * (R0 + L * 0.55), x1 = CC + Math.cos(a + curl) * (R0 + L), y1 = CC + Math.sin(a + curl) * (R0 + L);
        const g2 = g.createLinearGradient(x0, y0, x1, y1); g2.addColorStop(0, i % 3 ? 'rgba(165,92,255,0.55)' : 'rgba(208,174,255,0.7)'); g2.addColorStop(1, 'rgba(109,40,168,0)'); g.fillStyle = g2;
        g.beginPath(); g.moveTo(CC + Math.cos(a - w) * R0 * 0.9, CC + Math.sin(a - w) * R0 * 0.9); g.quadraticCurveTo(xm + Math.cos(a - 1.57) * 3, ym + Math.sin(a - 1.57) * 3, x1, y1); g.quadraticCurveTo(xm + Math.cos(a + 1.57) * 3, ym + Math.sin(a + 1.57) * 3, CC + Math.cos(a + w) * R0 * 0.9, CC + Math.sin(a + w) * R0 * 0.9); g.closePath(); g.fill(); } }),
    // a feathered shock ring (the burst's standing ring and its floor wave)
    ring: () => fxSprite('dsd_ring', SZ, SZ, g => { const gr = g.createRadialGradient(CC, CC, 0, CC, CC, CC);
      [[0, 'rgba(109,40,168,0)'], [0.6, 'rgba(109,40,168,0)'], [0.8, 'rgba(109,40,168,0.3)'], [0.9, 'rgba(165,92,255,0.85)'], [0.94, 'rgba(230,215,255,0.95)'], [0.97, 'rgba(165,92,255,0.45)'], [1, 'rgba(109,40,168,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, SZ, SZ); })
  };
  const SPR = {}, ORDER = ['side', 'face', 'shade', 'rim', 'sheen', 'glint', 'corona', 'ring'];   // (what the forming disc needs first)
  // bake the next sprites while under ms (each is about 0.2 - 3 ms; one at least per call)
  function bake(ms) { const t0 = performance.now(); for (const k of ORDER) { if (SPR[k]) continue; SPR[k] = BAKE[k](); if (performance.now() - t0 > ms * 0.5) return ready(); } return true; }
  const ready = () => ORDER.every(k => SPR[k]);

  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col, GY) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(glowSprite(col), X - r, Y - r * GY, r * 2, r * 2 * GY); c.restore(); }

  /* the disc in 3D: centre (x, y), radius r px; spin turns the face in its plane, yaw turns it about the vertical
     (cos(yaw) squashes it, sin(yaw) shows the side), roll leans it; en (0..1) its charge (the contraction) */
  function drawDisc(c, x, y, r, o) { if (r < 0.8 || !SPR.face) return; const { spin, yaw, roll, a, en, t, evo } = o, sq = Math.max(0.12, Math.cos(yaw)), sd = Math.sin(yaw), k = r / DR, th = r * 0.24;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(roll);
    // the eclipse corona behind (turning the other way)
    if (SPR.corona) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (0.75 + 0.25 * Math.sin(t * 9)) * (1 - en * 0.4); c.scale(sq * 0.5 + 0.5, 1); c.rotate(-spin * 0.35); const cr = r * 2.05 * (1 - en * 0.35); c.drawImage(SPR.corona, -cr, -cr, cr * 2, cr * 2);
      if (evo >= 7) { c.rotate(spin * 0.6 + 0.4); c.globalAlpha = a * 0.55; const c2 = cr * 0.86; c.drawImage(SPR.corona, -c2, -c2, c2 * 2, c2 * 2); } c.restore(); }
    c.scale(sq, 1);
    // the side: slices stacked from the far face to the near one
    if (SPR.side) { const n = Math.max(2, Math.min(6, Math.round(Math.abs(sd) * th / 1.6) + 2)), dx = -sd * th / sq; for (let i = n; i >= 1; i--) { const ox = dx * i / n; c.drawImage(SPR.side, ox - CC * k, -CC * k, SZ * k, SZ * k); } }
    // the face, spinning
    c.save(); c.rotate(spin); c.drawImage(SPR.face, -CC * k, -CC * k, SZ * k, SZ * k); c.restore();
    // fixed light over it: the shade, a sheen sweeping across, a glint running round the lit edge, the rim
    if (SPR.shade) c.drawImage(SPR.shade, -CC * k, -CC * k, SZ * k, SZ * k);
    c.globalCompositeOperation = 'lighter';
    if (SPR.sheen) { c.save(); c.beginPath(); c.arc(0, 0, r * 0.99, 0, TAU); c.clip(); c.globalAlpha = a * (0.7 + 0.3 * Math.abs(sd)); c.rotate(-0.75); c.drawImage(SPR.sheen, -CC * k + Math.sin(t * 2.3 + yaw * 2.5) * r * 0.8, -CC * k, SZ * k, SZ * k); c.restore(); }
    if (SPR.glint) { c.save(); c.globalAlpha = a * 0.9; c.rotate(Math.sin(t * 1.7) * 0.5 + sd * 0.6); c.drawImage(SPR.glint, -CC * k, -CC * k, SZ * k, SZ * k); c.restore(); }
    if (SPR.rim) { c.globalAlpha = a * (0.85 + en * 0.15); const rr = r * 1.06; c.drawImage(SPR.rim, -rr, -rr, rr * 2, rr * 2); }
    // the charge: energy floods the face as it contracts
    if (en > 0.01) { c.globalAlpha = a * en * 0.9; c.drawImage(glowSprite(EDGE), -r * 1.1, -r * 1.1, r * 2.2, r * 2.2); c.globalAlpha = a * en * en; c.drawImage(glowSprite(ACC), -r * 0.6, -r * 0.6, r * 1.2, r * 1.2); }
    c.restore(); }

  S.eclipsedisc = (C, h) => { const H = h, me = H.me, a = C.a, dir = [Math.cos(a), Math.sin(a)], V = 7, ev = evoOf(C), EK = evoK(C), GY = H.GY;
    const RW = 0.75 * (1.25 + 0.0083 * (ev - 1)), HITR = 1.0, BR = 1.45 + 0.05 * (ev - 1);   // disc radius (tiles), its hit radius, the burst's
    const sgn = Math.cos(a) >= 0 ? 1 : -1, CON = 0.36;   // (the contraction lasts CON s)
    bake(2); H.X.sfx.whoosh(); me.sq = 0.8;
    const f0 = H.add({ key: 'eclipsedisc', life: 2.0, x: me.x + dir[0] * 1.15, y: me.y + dir[1] * 1.15, hits: new Set(), cT: 1.0, bT: 0, v: 0, spin: 0, scar: [], burst: false, sparkT: 0,
      update(dt, f) { if (!ready()) bake(2.5);
        if (f.burst) return;
        // the run: accelerating out of the seam, braking into the contraction
        const run = f.t < f.cT; f.v = run ? V * sstep(0, 0.2, f.t) : f.v * Math.pow(0.0004, dt);
        const nx = f.x + dir[0] * f.v * dt, ny = f.y + dir[1] * f.v * dt; if (!H.X.blocked(nx, ny, 0.3, 0)) { f.x = nx; f.y = ny; } else if (run && f.t > 0.25) f.cT = f.t;
        f.spin += dt * (run ? 7 + 4 * sstep(0, 0.3, f.t) : 11 + 40 * sstep(f.cT, f.cT + CON, f.t)) * sgn;
        if (run && f.t > 0.08) { for (const m of H.near(f.x, f.y, HITR)) { if (f.hits.has(m)) continue; f.hits.add(m); H.X.hitMon(m, C.base * 1.3 * C.K * EK, C.dmgO({ kb: 1.2 }));
            H.burst(m.x, m.y - 0.5, 'spark', 6, { v: 6, life: 0.35, size: 1.8, color: [EDGE, ACC, '#FFFFFF'] }); H.burst(m.x, m.y - 0.5, 'shard', 3, { v: 5, up: 2, g: 9, life: 0.45, size: 3, color: [EDGE, SMOKE, ACC] }); H.X.ring(m.x, m.y, 0.15, 0.9, 0.25, EDGE, 0.5); H.X.sfx.crack && H.X.sfx.crack(); }
          // rim sparks thrown off tangentially at the bottom, pale smoke behind
          f.sparkT += dt; while (f.sparkT > 0.03) { f.sparkT -= 0.03; if (Math.random() < H.Q()) { const s = Math.random() < 0.5 ? 1 : -1; H.P({ kind: 'spark', x: f.x + s * 0.3, y: f.y - 0.05, vx: -dir[0] * 3 + s * 2.5 * Math.random(), vy: -dir[1] * 2 - 1.5 * Math.random(), g: 6, life: 0.3, max: 0.3, size: 1.5, color: Math.random() < 0.5 ? EDGE : ACC }); } }
          if (Math.random() < 0.35 * H.Q()) H.P({ kind: 'smoke', x: f.x - dir[0] * 0.4 + (Math.random() - 0.5) * 0.4, y: f.y - dir[1] * 0.4, vx: -dir[0] * 0.6, vy: -dir[1] * 0.4 - 0.3, life: 0.6, max: 0.6, size: 0.28, color: 'rgba(150,120,200,' }); }
        if (!run && f.t > f.cT + 0.1 && f.t < f.cT + CON - 0.03 && Math.random() < 0.8 * H.Q()) { const b = Math.random() * TAU, d = 1.3 + Math.random() * 0.8; H.P({ kind: 'spark', x: f.x + Math.cos(b) * d, y: f.y + Math.sin(b) * d * 0.6 - RW * 1.3, vx: -Math.cos(b) * d * 5, vy: -Math.sin(b) * d * 3, life: 0.18, max: 0.18, size: 1.6, color: Math.random() < 0.5 ? EDGE : ACC }); }
        // the scar: the path, kept for a moment
        if (f.t < f.cT + CON) { const L = f.scar[f.scar.length - 1]; if (!L || Math.hypot(L[0] - f.x, L[1] - f.y) > 0.3) f.scar.push([f.x, f.y, f.t]); }
        if (f.t >= f.cT + CON) { f.burst = true; f.bT = f.t; f.life = 0.65; const bx = f.x, by = f.y;
          H.hitArea(bx, by, BR, C.base * 1.1 * C.K * EK, C.dmgO({ kb: 3 }));
          H.burst(bx, by - RW * 1.3, 'shard', 10 + ev, { v: 7, up: 3, g: 10, life: 0.6, size: 4, color: [EDGE, PLUM, ACC, SMOKE] }); H.burst(bx, by - RW * 1.3, 'spark', 14, { v: 8, life: 0.4, size: 2, color: [EDGE, ACC, '#FFFFFF'] });
          for (let i = 0; i < H.n(7); i++) { const b = i / 7 * TAU; H.P({ kind: 'smoke', x: bx + Math.cos(b) * 0.4, y: by + Math.sin(b) * 0.3, vx: Math.cos(b) * 2.2, vy: Math.sin(b) * 1.3 - 0.3, life: 0.7, max: 0.7, size: 0.4, color: 'rgba(150,120,200,' }); }
          H.X.light(bx, by, BR * 2, 0.3); H.X.shake(6 + ev * 0.6, 0.2); H.X.sfx.crash(); H.X.hitstop(0.035); } },
      drawUnder(c, f, X, Y, T) { const k = f.burst ? 1 - cl((f.t - f.bT) / 0.55) : 1;
        // the scar: a violet light line along the path, fading from its tail
        if (f.scar.length > 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 1; i < f.scar.length; i++) { const p = f.scar[i - 1], q = f.scar[i], age = f.t - q[2], al = cl(1 - age / 0.7) * k; if (al <= 0.01) continue; for (const [w, col, m] of [[0.6, ENERGY, 0.2], [0.26, EDGE, 0.26], [0.06, ACC, 0.3]]) { c.globalAlpha = al * m; c.strokeStyle = col; c.lineWidth = T * w * (0.4 + 0.6 * al); c.beginPath(); c.moveTo(H.sx(p[0]), H.sy(p[1])); c.lineTo(H.sx(q[0]), H.sy(q[1])); c.stroke(); } } c.restore(); }
        if (!f.burst) { const form = sstep(0, 0.22, f.t), u = f.t > f.cT ? cl((f.t - f.cT) / CON) : 0; floorLight(c, X, Y, T * RW * 1.5 * form * (1 - u * 0.6), 0.45 + u * 0.4, EDGE, GY); }
        else { const u = cl((f.t - f.bT) / 0.5); floorLight(c, X, Y, T * BR * (0.8 + u * 0.8), 0.7 * (1 - u), EDGE, GY);
          if (SPR.ring) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9 * (1 - u); const rr = T * BR * (0.2 + 1.0 * Math.sqrt(u)) * 1.1; c.drawImage(SPR.ring, X - rr, Y - rr * GY, rr * 2, rr * 2 * GY); c.restore(); } } },
      draw(c, f, X, Y, T, gt) { const Hh = RW * 1.32, cy = Y - T * Hh;
        if (f.burst) { const u = cl((f.t - f.bT) / 0.55), r0 = T * RW;
          // the point flashes, a standing ring races out, short rays, a fading violet heart
          glow(c, X, cy, r0 * (2.4 + ev * 0.1) * (1 - u * 0.5), EDGE, 0.9 * (1 - u)); glow(c, X, cy, r0 * 1.1 * (1 - u), ACC, (1 - u) * (1 - u)); glow(c, X, cy, r0 * 0.5 * (1 - u), '#FFFFFF', (1 - u) * (1 - u));
          if (SPR.ring) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * (1 - u); const rr = T * BR * (0.15 + 0.85 * Math.sqrt(u)); c.drawImage(SPR.ring, X - rr, cy - rr, rr * 2, rr * 2); if (ev >= 7) { const r2 = rr * 0.7; c.globalAlpha = 0.6 * (1 - u); c.drawImage(SPR.ring, X - r2, cy - r2, r2 * 2, r2 * 2); } c.restore(); }
          if (u < 0.6) { const n = 8 + (ev >= 4 ? 2 : 0) + (ev >= 7 ? 2 : 0), w = 1 - u / 0.6; for (let i = 0; i < n; i++) { const b = i / n * TAU + 0.2 + R1(i) * 0.3, L = T * BR * (0.6 + R1(i * 3) * 0.6) * (0.4 + u); H.ray(c, X + Math.cos(b) * T * 0.15, cy + Math.sin(b) * T * 0.15, b, L, T * 0.12 * w, i % 2 ? EDGE : ACC, 0.7 * w); } }
          return; }
        const form = f.t < 0.24 ? H.ease.back(cl(f.t / 0.24)) : 1, u = f.t > f.cT ? cl((f.t - f.cT) / CON) : 0;
        // contraction: a beat of swelling, then an accelerating shrink to a point
        const swell = u < 0.25 ? 1 + 0.1 * Math.sin(u / 0.25 * Math.PI * 0.5) : 1.1 * (1 - Math.pow((u - 0.25) / 0.75, 1.6)), r = Math.max(0, T * RW * form * swell);
        const yaw = lerp(sgn * (0.68 + 0.2 * Math.sin(f.t * 3.1)), 0, sstep(0, 0.6, u)), roll = lerp(sgn * 0.12 + Math.sin(f.t * 4.3) * 0.05, 0, u);
        // the seam it unfurls from
        if (f.t < 0.3) { const s = 1 - f.t / 0.3; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = s; c.strokeStyle = rgba(EDGE, 0.9); c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(X, cy - T * 1.1 * (0.3 + form)); c.lineTo(X, cy + T * 1.1 * (0.3 + form)); c.stroke(); c.restore(); glow(c, X, cy, T * 1.2, EDGE, 0.6 * s); }
        if (!ready()) { glow(c, X, cy, Math.max(2, r * 1.5), EDGE, 0.6); return; }
        // near the pet the disc dims (it never covers the pet)
        const px = H.sx(me.x), py = H.sy(me.y) - T * 0.55, dp = Math.hypot(X - px, cy - py), dim = 0.35 + 0.65 * sstep(T * 0.3, T * 0.3 + r + T * 0.5, dp);
        // afterimages along the run
        if (u === 0 && f.v > 2 && SPR.rim) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 1; i <= 2; i++) { const bx = X - H.sx(f.x + dir[0] * 0.28 * i) + H.sx(f.x), by = cy - (H.sy(f.y + dir[1] * 0.28 * i) - H.sy(f.y)); c.globalAlpha = 0.28 / i * dim; const rr = r * 1.05; c.save(); c.translate(bx, by); c.scale(Math.max(0.15, Math.cos(yaw)), 1); c.drawImage(SPR.rim, -rr, -rr, rr * 2, rr * 2); c.restore(); } c.restore(); }
        glow(c, X, cy, r * 2.0, ENERGY, 0.35 * dim + u * 0.3);
        // contraction: streaks of violet drawn in from all round
        if (u > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const n = 14; for (let i = 0; i < n; i++) { const b = i / n * TAU + R1(i) * 0.4, ph = (u * 2.2 + R1(i * 5)) % 1, ro = T * (2.4 - ph * 1.9) , ri = Math.max(r * 1.05, ro - T * 0.5); c.globalAlpha = Math.sin(ph * Math.PI) * sstep(0.05, 0.3, u) * 0.85; c.strokeStyle = i % 2 ? EDGE : ACC; c.lineWidth = 1.6; c.beginPath(); c.moveTo(X + Math.cos(b) * ro, cy + Math.sin(b) * ro); c.lineTo(X + Math.cos(b) * ri, cy + Math.sin(b) * ri); c.stroke(); } c.restore(); }
        const frags = front => { if (ev < 4 || r <= 2) return; const n = ev >= 7 ? 7 : 4; for (let i = 0; i < n; i++) { const b = f.spin * 0.5 + i / n * TAU; if ((Math.sin(b) > 0) !== front) continue; const ox = Math.cos(b) * r * 1.3, oy = Math.sin(b) * r * 0.42, s = T * 0.08 * (1 - u * 0.7);
            c.save(); c.globalAlpha = dim * (front ? 1 : 0.5); c.translate(X + ox, cy + oy); c.rotate(b * 2); c.fillStyle = front ? '#3A1A58' : PLUM; c.beginPath(); c.moveTo(0, -s * 1.4); c.lineTo(s, 0); c.lineTo(0, s * 1.4); c.lineTo(-s, 0); c.closePath(); c.fill(); c.strokeStyle = rgba(front ? ACC : EDGE, 0.85); c.lineWidth = 1; c.stroke(); c.restore(); } };
        frags(false);
        drawDisc(c, X, cy, r, { spin: f.spin, yaw, roll, a: dim * Math.min(1, f.t / 0.08), en: sstep(0.2, 1, u), t: gt != null ? gt : f.t, evo: ev });
        frags(true);   // (Adept: glinting fragments orbiting the rim, a tilted ring round the disc)
        // the point it collapses to
        if (u > 0.6) glow(c, X, cy, T * (0.25 + (u - 0.6) * 1.2), '#FFFFFF', (u - 0.6) * 2.2); } });
    return f0; };
  S.eclipsedisc.warm = () => { while (!bake(4)); };
})();
