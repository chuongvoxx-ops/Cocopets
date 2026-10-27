/* ---------- Rift 06, the Yuggoth Engine: its war machines, its eggs, and the biomechanical heart ----------
   warmech    a giant walking war machine: a boxed hull on two thick legs, a glowing visor, missile pods on its
              shoulders. A salvo onto shown circles round you, and an arm cannon along a shown line.
   mechhound  a fast steel hound with a blade along its spine: it circles, then pounces on a shown circle.
   mechegg    giant eggs of metal and leathery hide in the Engine Heart: come close and one cracks, glowing, and bursts:
              little mechanical crawlers (egglings) skitter out. Break one early and only a couple escape.
   eggling    a small alien machine: a single glowing eye, a segmented tail, needle legs: it skitters and leaps.
   The Engine Heart is overgrown with biomechanical shapes: great ribbed tubes arching out of the floor, twisting
   spined spires, stacked vertebra columns, all glossy black metal. The Rift-touched there are giant mechas. */
(() => {
  const TAU = Math.PI * 2, { INK, VIOLET, VIOLET_HI, TEAL, TEAL_HI, AMBER } = YUG;
  const { PROPS } = DunWorld, { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const box = (c, x, y, w, h, col, lw) => { c.fillStyle = col; c.fillRect(x, y, w, h); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(x, y, w, h); };

  /* ---- biomechanical props: glossy black, ribbed, bone-like, lit by a sheen ---- */
  const CHROME = (c, x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#5A5E6E'); g.addColorStop(0.3, '#1C1E26'); g.addColorStop(0.55, '#3A3E4C'); g.addColorStop(0.62, '#8A90A2'); g.addColorStop(0.7, '#262832'); g.addColorStop(1, '#0E0F14'); return g; };
  window.PROP_EXT = window.PROP_EXT || {}; Object.assign(PROP_EXT, { biotube: [5.2, 4.6], xenospire: [3.0, 5.6], vertebra: [2.4, 4.6] });
  Object.assign(PROPS, {
    /* a great ribbed tube arching out of the floor and diving back in: a thick glossy hose ringed with ribs */
    biotube(c, T, v) { const lw = lw0(T), sd = v % 2 ? 1 : -1, H = T * (3.0 + (v % 3) * 0.4), W = T * (1.9 + (v % 2) * 0.3), R = T * (0.62 + (v % 3) * 0.08);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, T * 0.05, W * 1.25, T * 0.4, 0, 0, TAU); c.fill();
      const P = u => { const a = Math.PI * (1 - u); return [Math.cos(a) * W * sd, -Math.sin(a) * H + Math.sin(u * TAU) * T * 0.15]; };
      // the hose: drawn as overlapping discs along the curve so it reads round; rib rings over it
      const N = 34; for (let i = 0; i <= N; i++) { const u = i / N, [x, y] = P(u), r = R * (1 - 0.18 * Math.abs(u - 0.5)); c.fillStyle = CHROME(c, x - r, y - r, x + r, y + r); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = lw; for (let i = 0; i <= N; i++) { const u = i / N, [x, y] = P(u), r = R * (1 - 0.18 * Math.abs(u - 0.5)); if (i === 0 || i === N) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); } }
      for (let i = 1; i < 14; i++) { const u = i / 14, [x, y] = P(u), [x2, y2] = P(u + 0.01), a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2, r = R * 1.08 * (1 - 0.18 * Math.abs(u - 0.5)); c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.ellipse(0, 0, r, r * 0.32, 0, 0, TAU); c.fillStyle = '#262832'; c.fill(); c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.stroke(); c.strokeStyle = 'rgba(200,210,230,.45)'; c.lineWidth = lw * 0.6; c.beginPath(); c.ellipse(0, -r * 0.05, r * 0.85, r * 0.2, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.restore(); }
      // a glossy highlight running along its back, and a faint violet glow in its joints
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = lw * 1.2; c.lineCap = 'round'; c.beginPath(); for (let i = 2; i <= N - 2; i++) { const [x, y] = P(i / N); i === 2 ? c.moveTo(x - R * 0.35, y - R * 0.45) : c.lineTo(x - R * 0.35, y - R * 0.45); } c.stroke();
      for (const u of [0.04, 0.96]) { const [x, y] = P(u); glowIn(c, x, y, R * 1.6, VIOLET, 0.35); } },
    /* a tall twisting spire, ribbed like a spine, with curved spines along it and a glossy tip */
    xenospire(c, T, v) { const lw = lw0(T), H = T * (4.2 + (v % 3) * 0.4), tw = v % 2 ? 1 : -1;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, T * 0.05, T * 1.0, T * 0.32, 0, 0, TAU); c.fill();
      const N = 22; for (let i = 0; i < N; i++) { const u = i / N, y = -u * H, x = Math.sin(u * 5 + v) * T * 0.3 * tw * u, w = T * 0.55 * (1 - u * 0.8);
        c.fillStyle = CHROME(c, x - w, y, x + w, y - T * 0.2); c.beginPath(); c.ellipse(x, y, w, T * 0.16, Math.sin(u * 6) * 0.2, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.stroke();
        if (i % 3 === 1 && u < 0.85) for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * w * 0.8, y); c.quadraticCurveTo(x + sd * (w + T * 0.55), y - T * 0.1, x + sd * (w + T * 0.75), y - T * 0.55); c.quadraticCurveTo(x + sd * (w + T * 0.35), y - T * 0.15, x + sd * w * 0.6, y - T * 0.12); c.closePath(); c.fillStyle = '#1C1E26'; c.fill(); c.stroke(); c.strokeStyle = 'rgba(200,210,230,.4)'; c.lineWidth = lw * 0.5; c.beginPath(); c.moveTo(x + sd * w, y - T * 0.04); c.quadraticCurveTo(x + sd * (w + T * 0.45), y - T * 0.12, x + sd * (w + T * 0.68), y - T * 0.5); c.stroke(); c.strokeStyle = LN; c.lineWidth = lw * 0.8; } }
      const tx = Math.sin(5 + v) * T * 0.3 * tw; c.beginPath(); c.moveTo(tx - T * 0.13, -H); c.quadraticCurveTo(tx + T * 0.05, -H - T * 0.6, tx + T * 0.25 * tw, -H - T * 0.9); c.quadraticCurveTo(tx + T * 0.08, -H - T * 0.4, tx + T * 0.13, -H); c.closePath(); c.fillStyle = '#3A3E4C'; c.fill(); stroke(c, lw); glowIn(c, tx, -H * 0.5, T * 1.2, VIOLET, 0.22); },
    /* a column of stacked vertebrae, each a glossy black bone with a ridge and two short wings */
    vertebra(c, T, v) { const lw = lw0(T), n = 5 + (v % 3); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, T * 0.05, T * 0.8, T * 0.28, 0, 0, TAU); c.fill();
      for (let i = 0; i < n; i++) { const y = -T * (0.3 + i * 0.6), w = T * (0.55 - i * 0.03); c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(-w * 1.6, y - T * 0.25, -w * 1.3, y - T * 0.45); c.lineTo(-w * 0.5, y - T * 0.35); c.quadraticCurveTo(0, y - T * 0.6, w * 0.5, y - T * 0.35); c.lineTo(w * 1.3, y - T * 0.45); c.quadraticCurveTo(w * 1.6, y - T * 0.25, w, y); c.quadraticCurveTo(0, y + T * 0.15, -w, y); c.closePath(); c.fillStyle = CHROME(c, -w, y - T * 0.5, w, y); c.fill(); stroke(c, lw); c.strokeStyle = 'rgba(220,225,240,.45)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-w * 0.4, y - T * 0.33); c.quadraticCurveTo(0, y - T * 0.5, w * 0.4, y - T * 0.33); c.stroke(); }
      glowIn(c, 0, -T * (0.3 + n * 0.3), T * 0.9, '#FF6FB0', 0.25); },
  });
  BIOMES.engineheart.props = ['biotube', 'xenospire', 'vertebra', 'biotube', 'metalspike', 'xenospire', 'biotube', 'piston', 'vertebra']; BIOMES.engineheart.propN = [5, 3];

  /* ---- the war machines ---- */
  Object.assign(MON, {
    warmech: { name: 'War mech', from: 999, hp: 2100, spd: 0.8, r: 1.3, dmg: 26, xp: 46, coin: 2.4, color: '#4E5668', bio: ['wreckfield', 'coolant', 'engineheart'], tip: 'A giant walking war machine. It fires a missile salvo onto shown circles round you, and an arm cannon along a shown line. Its armour is thick: lead it into charge cells.', kit: [] },
    mechhound: { name: 'Mech hound', from: 999, hp: 460, spd: 2.5, r: 0.62, dmg: 18, xp: 18, coin: 1, color: '#5A6278', bio: ['wreckfield', 'coolant', 'engineheart'], tip: 'A steel hound with a blade along its spine. It circles you, then pounces onto a shown circle.', kit: [] },
    mechegg: { name: 'Engine egg', from: 999, hp: 300, spd: 0, r: 0.75, dmg: 0, xp: 6, coin: 0.4, color: '#3A3240', bio: ['engineheart'], still: true, tip: 'Come close and it cracks open: little mechanical crawlers pour out. Break it from a distance first and only a couple escape.', kit: [],
      onDeath(m, X) { hatch(m, X, m.opened ? 0 : 2); } },
    eggling: { name: 'Eggling', from: 999, hp: 110, spd: 2.7, r: 0.32, dmg: 11, xp: 5, coin: 0.25, color: '#6A7488', bio: ['engineheart'], tip: 'A little alien machine fresh out of an engine egg: it skitters and leaps at you.', kit: [] },
  });
  Object.assign(MP, {
    /* the war mech: two thick jointed legs, a boxed hull, a visor slit, shoulder missile pods, an arm cannon */
    warmech(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU), aim = o.mode === 'block' ? 1 : 0, fire = o.mode === 'fire' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, r * 1.05, r * 1.25, r * 0.32, 0, 0, TAU); c.fill();
      // legs: thigh, knee joint, shin, a splayed foot
      for (const sd of [-1, 1]) { const k = (sd < 0 ? run : -run) * r * 0.12, hx = sd * r * 0.42, kx = sd * r * 0.62 + k, fx = sd * r * 0.5 - k;
        limb(c, hx, r * 0.05, kx, r * 0.55, r * 0.26, '#3A4052'); limb(c, kx, r * 0.55, fx, r * 0.98, r * 0.2, '#4E5668'); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(hx - r * 0.06, r * 0.08); c.lineTo(kx - r * 0.06, r * 0.52); c.stroke(); c.fillStyle = '#2A2F3E'; c.beginPath(); c.arc(kx, r * 0.55, r * 0.17, 0, TAU); c.fill(); stroke(c, lw); glowIn(c, kx, r * 0.55, r * 0.2, o.mode ? '#FF5A4A' : TEAL, 0.6);
        c.fillStyle = '#2A2F3E'; c.beginPath(); c.moveTo(fx - r * 0.28, r * 1.02); c.lineTo(fx + r * 0.3, r * 1.02); c.lineTo(fx + r * 0.18, r * 0.88); c.lineTo(fx - r * 0.18, r * 0.88); c.closePath(); c.fill(); stroke(c, lw); }
      // hull
      const hy = -r * 0.55 + run * r * 0.03; c.beginPath(); c.moveTo(-r * 0.75, hy + r * 0.55); c.lineTo(-r * 0.85, hy - r * 0.2); c.lineTo(-r * 0.5, hy - r * 0.55); c.lineTo(r * 0.5, hy - r * 0.55); c.lineTo(r * 0.85, hy - r * 0.2); c.lineTo(r * 0.75, hy + r * 0.55); c.closePath(); c.fillStyle = shade(c, o.color, r, -r * 0.2, hy - r * 0.2, 0.4); c.fill(); stroke(c, lw * 1.2);
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-r * 0.8, hy); c.lineTo(r * 0.8, hy); c.moveTo(0, hy - r * 0.55); c.lineTo(0, hy + r * 0.55); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(-r * 0.8, hy - r * 0.2); c.lineTo(-r * 0.48, hy - r * 0.5); c.lineTo(r * 0.1, hy - r * 0.5); c.lineTo(-r * 0.2, hy - r * 0.2); c.closePath(); c.fill();
      // hazard stripes on the belly plate
      c.save(); c.beginPath(); c.rect(-r * 0.6, hy + r * 0.32, r * 1.2, r * 0.18); c.clip(); for (let i = -6; i < 7; i++) { c.fillStyle = i % 2 ? '#1A1A1A' : AMBER; c.beginPath(); c.moveTo(i * r * 0.14, hy + r * 0.32); c.lineTo(i * r * 0.14 + r * 0.07, hy + r * 0.32); c.lineTo(i * r * 0.14 - r * 0.07, hy + r * 0.5); c.lineTo(i * r * 0.14 - r * 0.14, hy + r * 0.5); c.closePath(); c.fill(); } c.restore();
      // the visor
      c.fillStyle = '#0A0C12'; c.fillRect(-r * 0.45, hy - r * 0.35, r * 0.9, r * 0.2); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-r * 0.45, hy - r * 0.35, r * 0.9, r * 0.2); const vc = aim || fire ? '#FF5A4A' : TEAL; glowIn(c, 0, hy - r * 0.25, r * 0.7, vc, 0.7); c.fillStyle = vc; c.fillRect(-r * 0.38 + (Math.sin(ph * TAU) * 0.5 + 0.5) * r * 0.5, hy - r * 0.31, r * 0.26, r * 0.12);
      // missile pods on its shoulders
      for (const sd of [-1, 1]) { const px = sd * r * 0.95, py = hy - r * 0.62; box(c, px - r * 0.28, py - r * 0.22, r * 0.56, r * 0.44, '#3A4052', lw); c.fillStyle = '#14161E'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.beginPath(); c.arc(px - r * 0.12 + i * r * 0.24, py - r * 0.08 + j * r * 0.18, r * 0.07, 0, TAU); c.fill(); if (fire) glowIn(c, px - r * 0.12 + i * r * 0.24, py - r * 0.08 + j * r * 0.18, r * 0.18, AMBER, 0.8); } }
      // the arm cannon
      const ax = r * 0.95, ay = hy + r * 0.05; box(c, ax - r * 0.12, ay - r * 0.12, r * 0.55, r * 0.26, '#2A2F3E', lw); box(c, ax + r * 0.4, ay - r * 0.07, r * 0.25, r * 0.16, '#5A6278', lw); if (aim) glowIn(c, ax + r * 0.7, ay, r * 0.45, '#FF5A4A', 0.85); },
    /* the hound: a low steel body on four needle legs, a blade fin down its spine, a slit of light for an eye */
    mechhound(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU * 1.5), crouch = o.mode === 'block' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.85, r * 1.0, r * 0.26, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, crouch * r * 0.15);
      for (const [x, k] of [[-0.55, 1], [-0.3, -1], [0.35, -1], [0.6, 1]]) limb(c, x * r, r * 0.1, x * r + run * k * r * 0.18, r * 0.82, lw * 1.2, '#2A2F3E');
      c.beginPath(); c.moveTo(-r * 0.85, r * 0.05); c.lineTo(-r * 0.6, -r * 0.3); c.lineTo(r * 0.45, -r * 0.32); c.lineTo(r * 0.95, -r * 0.1); c.lineTo(r * 1.0, r * 0.12); c.lineTo(r * 0.55, r * 0.25); c.lineTo(-r * 0.6, r * 0.22); c.closePath(); c.fillStyle = shade(c, o.color, r, 0, -r * 0.1, 0.4); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-r * 0.55, -r * 0.3); c.lineTo(-r * 0.2, -r * 0.85); c.lineTo(r * 0.05, -r * 0.32); c.lineTo(r * 0.15, -r * 0.7); c.lineTo(r * 0.35, -r * 0.32); c.closePath(); c.fillStyle = '#9AA4B8'; c.fill(); stroke(c, lw * 0.8);
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = VIOLET; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-r * 0.45, -r * 0.32); c.lineTo(-r * 0.2, -r * 0.75); c.stroke(); c.restore();
      c.fillStyle = '#0A0C12'; c.fillRect(r * 0.55, -r * 0.12, r * 0.38, r * 0.1); glowIn(c, r * 0.74, -r * 0.07, r * 0.35, crouch ? '#FF5A4A' : VIOLET_HI, 0.8); c.fillStyle = crouch ? '#FF5A4A' : VIOLET_HI; c.fillRect(r * 0.6, -r * 0.1, r * 0.28, r * 0.06);
      c.restore(); },
    /* the egg: a tall leathery shell of plated hide, four seams in its crown that glow and part as it opens */
    mechegg(c, r, ph, o) { const lw = lwOf(r), open = o.mode === 'block' ? 1 : 0, sh = open ? Math.sin(ph * TAU * 6) * r * 0.05 : 0;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, r * 0.8, r * 0.85, r * 0.26, 0, 0, TAU); c.fill();
      c.save(); c.translate(sh, 0);
      c.beginPath(); c.moveTo(-r * 0.62, r * 0.75); c.bezierCurveTo(-r * 0.95, r * 0.1, -r * 0.7, -r * 1.15, 0, -r * 1.25); c.bezierCurveTo(r * 0.7, -r * 1.15, r * 0.95, r * 0.1, r * 0.62, r * 0.75); c.closePath();
      const g = c.createRadialGradient(-r * 0.3, -r * 0.5, r * 0.1, 0, -r * 0.2, r * 1.2); g.addColorStop(0, '#7A6A80'); g.addColorStop(0.55, '#3A3240'); g.addColorStop(1, '#1A161E'); c.fillStyle = g; c.fill(); stroke(c, lw);
      c.save(); c.clip(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = lw * 0.8; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-r, -r * 0.9 + i * r * 0.32); c.quadraticCurveTo(0, -r * 0.7 + i * r * 0.32, r, -r * 0.9 + i * r * 0.32); c.stroke(); } c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = lw; c.beginPath(); c.moveTo(-r * 0.45, r * 0.4); c.quadraticCurveTo(-r * 0.62, -r * 0.4, -r * 0.2, -r * 1.0); c.stroke(); c.restore();
      // the crown seams: dull, then glowing and parting
      const k = open ? 1 : 0.35 + 0.15 * Math.sin(ph * TAU); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = open ? '#FFB23F' : '#C452FF'; c.globalAlpha = k; c.lineWidth = lw * (open ? 1.8 : 1); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; c.beginPath(); c.moveTo(0, -r * 1.05); c.quadraticCurveTo(Math.cos(a) * r * 0.25, -r * 1.05 + Math.sin(a) * r * 0.12 + r * 0.1, Math.cos(a) * r * 0.45, -r * 0.75 + Math.sin(a) * r * 0.1); c.stroke(); } if (open) glowIn(c, 0, -r * 1.0, r * 0.9, AMBER, 0.8); c.restore();
      c.restore(); },
    /* the eggling: a round metal body with one glowing eye, six needle legs, a curled segmented tail */
    eggling(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU * 2);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.85, r * 0.95, r * 0.25, 0, 0, TAU); c.fill();
      for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const x = (i - 1) * r * 0.35; limb(c, x, r * 0.1, x + sd * r * 0.7 + run * r * 0.12 * (i % 2 ? 1 : -1), r * 0.75, lw * 0.7, '#2A2F3E'); }
      c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(-r * 0.5, 0); c.quadraticCurveTo(-r * 1.2, -r * 0.3, -r * 0.9, -r * 0.9); c.stroke(); for (let i = 0; i < 4; i++) { const u = i / 4, x = -r * 0.5 - u * r * 0.55, y = -u * r * 0.75; c.fillStyle = '#4A5268'; c.beginPath(); c.arc(x, y, r * (0.16 - u * 0.02), 0, TAU); c.fill(); stroke(c, lw * 0.6); }
      c.beginPath(); c.ellipse(0, 0, r * 0.58, r * 0.45, 0, 0, TAU); c.fillStyle = shade(c, o.color, r * 0.6, -r * 0.15, -r * 0.15, 0.4); c.fill(); stroke(c, lw);
      glowIn(c, r * 0.25, -r * 0.08, r * 0.45, '#FFB23F', 0.75); c.fillStyle = '#FFE0A0'; c.beginPath(); c.arc(r * 0.25, -r * 0.08, r * 0.14, 0, TAU); c.fill(); },
  });
  Object.assign(EXT, { warmech: 3.0, mechhound: 2.4, mechegg: 3.0, eggling: 2.2 }); Object.assign(NF, { warmech: 6, mechhound: 6, mechegg: 6, eggling: 6 });
  const { mon, keepRange, startHop, hopTick } = DunAI;
  Object.assign(mon, {
    warmech(m, A, X) {
      if (m.fireT > 0) { m.fireT -= A.dt; m.mode = 'fire'; if (m.fireT <= 0) m.mode = null; return; }
      if (m.aimT > 0) { m.aimT -= A.dt; m.mode = 'block'; if (m.aimT <= 0) { m.mode = 'fire'; m.fireT = 0.4; if (X.inLine(m.x, m.y, m.ca, 10, 1.1)) X.hurtPet(m.dmg * 1.5, m); X.shake(5, 0.2); for (let i = 0; i < 10; i++) X.part({ kind: 'spark', x: m.x + Math.cos(m.ca) * i, y: m.y - 0.5 + Math.sin(m.ca) * i, vx: 0, vy: -1, life: 0.35, max: 0.35, size: 4, color: i % 2 ? '#FF5A4A' : '#FFFFFF' }); m.cd = 3 + Math.random(); } return; }
      m.mode = null; keepRange(m, A, X, 3.5, 7);
      if (m.cd <= 0 && A.d < 9) { if (Math.random() < 0.5 && A.los()) { m.aimT = 1.0; m.ca = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 10, w: 1.1, life: 1.0, max: 1.0, src: m, color: '#FF5A4A' }); }
        else { m.cd = 3.5 + Math.random(); m.fireT = 0.6; for (let i = 0; i < 4; i++) { const px = X.me.x + (Math.random() - 0.5) * 4, py = X.me.y + (Math.random() - 0.5) * 4; X.warn({ x: px, y: py, r: 1.2, life: 1.0 + i * 0.18, max: 1.0 + i * 0.18, src: m, color: AMBER, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.2 + X.me.r * 0.5) X.hurtPet(m.dmg, m); X.boom(px, py, 1.1, AMBER, '#FFFFFF', { n: 12, shake: 3 }); } }); } } }
    },
    mechhound(m, A, X) {
      if (m.hop) { m.mode = m.hop.t < m.hop.wind ? 'block' : null; hopTick(m, A, X, () => { m.mode = null; m.cd = 2.2 + Math.random(); }); return; }
      m.mode = null;
      if (m.cd <= 0 && A.d < 5.5 && A.d > 1.4) { startHop(m, X, X.me.x + (X.me.vx || 0) * 0.3, X.me.y + (X.me.vy || 0) * 0.3, { r: 1.2, h: 1.4, wind: 0.5, dur: 0.45, mul: 1.2 }); return; }
      // circling at a middle range
      const ca = A.a + Math.PI / 2 * (m.wob > 0.5 ? 1 : -1), want = A.d > 3.2 ? 1 : A.d < 2.2 ? -1 : 0; X.moveEnt(m, (Math.cos(ca) * 0.8 + A.ux * want) * A.sp * A.dt, (Math.sin(ca) * 0.8 + A.uy * want) * A.sp * A.dt);
    },
    mechegg(m, A, X) {
      if (m.opened) return;
      if (m.crackT > 0) { m.crackT -= A.dt; m.mode = 'block'; if (Math.random() < 0.3) X.part({ kind: 'spark', x: m.x + (Math.random() - 0.5) * 0.6, y: m.y - 1.0, vx: (Math.random() - 0.5) * 2, vy: -2, life: 0.4, max: 0.4, size: 2, color: AMBER }); if (m.crackT <= 0) { m.opened = true; hatch(m, X, 4 + Math.floor(Math.random() * 2)); X.killMon(m); } return; }
      if (A.d < 3.4) { m.crackT = 1.1; X.text(m.x, m.y - 2, 'It cracks…', AMBER, 13); X.sfx.crack && X.sfx.crack(); }
    },
    eggling(m, A, X) {
      if (m.hop) { hopTick(m, A, X); return; }
      if (m.cd <= 0 && A.d < 2.6) { startHop(m, X, X.me.x, X.me.y, { r: 0.8, h: 0.8, wind: 0.3, dur: 0.3, mul: 1 }); m.cd = 1.6 + Math.random(); return; }
      const zz = Math.sin(m.t * 9 + m.wob * 6) * 0.9; X.moveEnt(m, (A.ux - A.uy * zz) * A.sp * A.dt, (A.uy + A.ux * zz) * A.sp * A.dt);
    },
  });
  function hatch(m, X, n) { if (m._hatched) return; m._hatched = true; X.boom(m.x, m.y - 0.6, 1.4, AMBER, '#FFE0A0', { n: 18, shake: 4 }); X.sfx.crash && X.sfx.crash();
    for (let i = 0; i < n; i++) { const a = i / Math.max(1, n) * TAU + Math.random() * 0.5, q = X.freeSpot(m.x + Math.cos(a) * 0.9, m.y + Math.sin(a) * 0.9, 0.3) || { x: m.x, y: m.y }; const e = X.spawnMon('eggling', q.x, q.y, { pack: 870, rift: true, aggro: true }); X.g.total++; e.cd = 0.6 + Math.random() * 0.6; }
    if (n) X.text(m.x, m.y - 1.6, n >= 4 ? 'They pour out!' : 'Only a couple escape', AMBER, 13); }
  /* the Engine Heart's eggs: clutches of two or three in its rooms */
  function eggsExtra(X, self, H) { const M = X.M, list = [];
    for (const rm of M.rooms.slice(1)) { const n = 2 + (Math.random() < 0.5 ? 1 : 0), cx = rm.x + rm.w * (0.3 + Math.random() * 0.4), cy = rm.y + rm.h * (0.3 + Math.random() * 0.4); for (let k = 0; k < n; k++) { const q = X.freeSpot(cx + (k - 1) * 1.6, cy + (k % 2) * 1.2, 0.8); if (!q) continue; const m = X.spawnMon('mechegg', q.x, q.y, { pack: 860, rift: true }); m.aggro = true; m.optional = true; list.push(m); } }
    X.after(4.5, () => X.banner('ENGINE EGGS', 'Come close and they hatch: break them from a distance and fewer crawl out', AMBER, 3, true));
    return { list }; }
  /* the rift's sections: war machines in every dungeon, eggs in the Engine Heart, and its Rift-touched are mechas */
  const Rf = RIFT_BY_ID.yuggoth; Rf.mechaMinis = true;
  /* war mechs are placed, not rolled: five to ten on a floor, one to a room, never in the first room */
  function mechsExtra(X, self, H) { const M = X.M, rooms = M.rooms.slice(1).sort(() => Math.random() - 0.5), want = 5 + Math.floor(Math.random() * 6), list = [];
    for (const rm of rooms.concat(rooms)) { if (list.length >= want) break; const q = X.freeSpot(rm.x + rm.w * (0.3 + Math.random() * 0.4), rm.y + rm.h * (0.3 + Math.random() * 0.4), 1.2); if (!q) continue; const m = X.spawnMon('warmech', q.x, q.y, { pack: 850 + list.length, rift: true }); X.g.total++; list.push(m); }
    return { list }; }
  const both = (a, b) => (X, self, H) => { const A = a ? a(X, self, H) || {} : {}, B = b(X, self, H) || {}; return { update: dt => { if (A.update) A.update(dt); if (B.update) B.update(dt); }, drawGround: c => { if (A.drawGround) A.drawGround(c); if (B.drawGround) B.drawGround(c); }, drawOver: c => { if (A.drawOver) A.drawOver(c); if (B.drawOver) B.drawOver(c); }, list: (A.list || []).concat(B.list || []) }; };
  for (const s of Rf.stages) if (s.kind === 'fight') { s.mobs = s.biome === 'engineheart' ? ['sparkmite', 'coilsentry', 'mechhound', 'hullwing', 'sparkmite', 'hullwing'] : ['sparkmite', 'hullwing', 'coilsentry', 'mechhound', 'sparkmite', 'hullwing']; s.extra = both(s.biome === 'engineheart' ? eggsExtra : s.extra, mechsExtra); }
  for (const id of ['arcpet', 'coolpet', 'corepet']) { const B = BOSSES.find(b => b.id === id); if (B) { B.r = 1.75; B.hp = Math.round(B.hp * 1.15); } }
  YUG.hatch = hatch;
})();
