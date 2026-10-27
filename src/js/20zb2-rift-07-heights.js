/* ---------- Rift 07, the upper lands: the Silver Bindery and the Ascent of Light ----------
   II  The Silver Bindery: the library made posh: white marble, white-lacquered shelves bound in silver, a slate void with
       a silver moon and drifting white pages.
   III The Ascent of Light: a stair of marble and gold rising through clouds towards heaven; platinum furniture, angel
       statues, haloed arches, censers of white fire, harps; great ribbons of light swirling in the air. Its brood is
       angelic: seraphlings (they rain holy fire on shown circles), halo guards (platinum knights who lunge with a spear
       along a shown line), and ophan wheels (wheels of eyes that burst light all round them). */
(() => {
  const TAU = Math.PI * 2, { PROPS } = DunWorld, { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, rx, ry, a || 0, 0, TAU); };
  const ink = (c, lw) => { c.strokeStyle = LN; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(120,100,60,${a || 0.22})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  const GOLD = '#E2B64A', GOLD_HI = '#FFF1B8', PLAT = '#E9EEF5', PLAT_D = '#B9C2D0', MARBLE = '#FBF8F0', MARBLE_D = '#DCD3BE', HOLY = '#FFF6D6', SKY = '#CFE2FF';
  const halo = (c, x, y, rx, lw, a) => { c.save(); glowIn(c, x, y, rx * 2.2, GOLD_HI, 0.5 * (a == null ? 1 : a)); c.strokeStyle = LN; c.lineWidth = lw * 2.4; ell(c, x, y, rx, rx * 0.32); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = lw * 1.4; c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = lw * 0.5; c.stroke(); c.restore(); };
  // a feathered wing: layered white blades fanning from the root
  function wing(c, x, y, a, len, n, lw, tint) { c.save(); c.translate(x, y); c.rotate(a);
    for (let i = n - 1; i >= 0; i--) { const u = i / Math.max(1, n - 1), L = len * (0.55 + 0.45 * (1 - u * 0.6)), w = len * 0.16; c.save(); c.rotate(-0.55 + u * 1.0);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -w, L, -w * 0.2); c.quadraticCurveTo(L * 0.55, w * 0.7, 0, w * 0.35); c.closePath(); c.fillStyle = i % 2 ? (tint || '#FFFFFF') : '#F1EEFF'; c.fill(); ink(c, lw * 0.7); c.restore(); }
    c.restore(); }

  /* ---- the voids ---- */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.silvervoid = { base: '#151A28',
    paint(c, S, R) { c.fillStyle = '#151A28'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 14; i++) { const x = R() * S, y = R() * S, w = 14 + R() * 26; c.strokeStyle = `rgba(190,205,235,${0.08 + R() * 0.14})`; c.lineWidth = 1.5 + R() * 2; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.bezierCurveTo(x + ox - w * 0.3, y + oy - 8, x + ox + w * 0.3, y + oy + 8, x + ox + w, y + oy); c.stroke(); } }
      for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(235,242,255,${0.25 + R() * 0.55})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.15 ? 1.4 : 0.7, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, P, W, H, t, wx, wy, bigGlow } = o;
      pat(pattern('silvervoid', k), 0.5, t * 2, t * 1.2);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 + 0.04 * Math.sin(t * 0.9); bigGlow(c, P, '#8FA0C8', W * 0.25 - (wx * 0.04) % W, H * 0.45, W * 1.0); c.restore();
      const mx = W * 0.72 - ((wx * 0.02) % (W * 2)), my = H * 0.16 - ((wy * 0.015) % H), mr = Math.min(W, H) * 0.12;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; blitSized(c, glowSprite('#DDE6FF'), mx - mr * 2.6, my - mr * 2.6, mr * 5.2, mr * 5.2); c.restore();
      const g = c.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#C9D2E6'); c.fillStyle = g; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
      c.fillStyle = 'rgba(150,165,195,.35)'; for (const [x, y, r] of [[-0.3, -0.1, 0.18], [0.25, 0.3, 0.12], [0.1, -0.4, 0.09]]) { c.beginPath(); c.arc(mx + x * mr, my + y * mr, r * mr, 0, TAU); c.fill(); }
      for (let i = 0; i < 7; i++) { const sp = 6 + (i % 3) * 5, px = ((i * 137 + t * sp - wx * 0.25) % (W + 80) + W + 80) % (W + 80) - 40, py = ((i * 211 + Math.sin(t * 0.4 + i) * 30 - wy * 0.25) % (H + 80) + H + 80) % (H + 80) - 40, a = Math.sin(t * 0.7 + i * 2) * 0.6;
        c.save(); c.translate(px, py); c.rotate(a); c.scale(1, 0.6 + 0.4 * Math.abs(Math.sin(t * 0.9 + i))); c.globalAlpha = 0.6; c.fillStyle = '#FFFFFF'; c.fillRect(-9, -12, 18, 24); c.strokeStyle = 'rgba(120,135,170,.5)'; c.lineWidth = 1; c.beginPath(); for (let j = 0; j < 4; j++) { c.moveTo(-6, -7 + j * 5); c.lineTo(5, -7 + j * 5); } c.stroke(); c.restore(); } },
  };
  GAP_EXT.celestial = { base: '#E3EEFF',
    paint(c, S, R) { const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#E9F1FF'); g.addColorStop(1, '#DCE8FF'); c.fillStyle = g; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 9; i++) { const x = R() * S, y = R() * S, r = 10 + R() * 16; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const gg = c.createRadialGradient(x + ox, y + oy, 1, x + ox, y + oy, r); gg.addColorStop(0, 'rgba(255,255,255,.85)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.beginPath(); c.arc(x + ox, y + oy, r, 0, TAU); c.fill(); } }
      for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(255,236,170,${0.3 + R() * 0.5})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.2 ? 1.3 : 0.7, 0, TAU); c.fill(); } },
    back(c, o) { const { grad, P, k, W, H, t, wx, wy, bigGlow } = o;
      grad('#FFF1D6', '#CFE2FF');
      // the light of heaven above: a radiant glow and slow god rays
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; bigGlow(c, P, '#FFE9A8', W * 0.5 - W * 0.6, -H * 0.35, W * 1.2); c.globalAlpha = 0.045; c.fillStyle = '#FFF6D0';
      // (no rays: just the soft glow of heaven above)
      c.restore();
      const span = 520;
      for (let layer = 0; layer < 2; layer++) { const par = layer ? 0.55 : 0.3, sc = layer ? 1.1 : 0.7, cv = DunWorld.cloud(layer ? '#F2EEFF' : '#E6ECFF', k, sc), cw = cv.width / k, chh = cv.height / k; c.globalAlpha = layer ? 0.95 : 0.7;
        for (let i = -1; i < 4; i++) for (let j = -1; j < 4; j++) { const gx = i * span + ((t * (layer ? 7 : 4) - wx * par) % span + span) % span - span * 0.5, gy = j * span * 0.6 + ((-wy * par) % (span * 0.6) + span * 0.6) % (span * 0.6) - span * 0.3, jit = hh(i + 7 * layer, j, 3) * 160;
          if (gx + jit > W + 50 || gy > H + 50 || gx + jit < -280 || gy < -160) continue; c.drawImage(cv, P.x(gx + jit), P.y(gy + hh(i, j + layer, 9) * 120), cw, chh); } }
      c.globalAlpha = 1; },
  };
  window.DECAL_EXT = window.DECAL_EXT || {};
  DECAL_EXT.silverleaf = (c, d, s) => { c.strokeStyle = 'rgba(150,165,195,.75)'; c.lineWidth = Math.max(1, s * 0.2); c.lineCap = 'round'; c.rotate(d.rot * 0.3); c.beginPath(); if (d.v % 2) { c.arc(0, 0, s * 0.8, 0, TAU); c.moveTo(0, -s * 0.5); c.lineTo(0, s * 0.5); } else { c.moveTo(-s, 0); c.lineTo(s, 0); c.moveTo(0, -s); c.lineTo(0, s); c.moveTo(-s * 0.6, -s * 0.6); c.lineTo(s * 0.6, s * 0.6); c.moveTo(s * 0.6, -s * 0.6); c.lineTo(-s * 0.6, s * 0.6); } c.stroke(); };

  /* ---- holy furniture: platinum and gold ---- */
  window.PROP_EXT = window.PROP_EXT || {};
  Object.assign(PROP_EXT, { platpillar: [2.0, 4.6], angelstatue: [3.4, 4.6], haloarch: [3.4, 4.4], censer: [2.2, 3.0], cloudbank: [3.4, 2.4], harp: [2.2, 3.4] });
  Object.assign(PROPS, {
    /* a fluted platinum pillar with a gilded capital and base; a halo floats above it */
    platpillar(c, T, v) { const lw = lw0(T), H = T * 3.1, w = T * 0.36; shadowEll(c, T, 0.6);
      c.beginPath(); c.rect(-T * 0.5, -T * 0.32, T, T * 0.32); c.fillStyle = shade(c, GOLD, T * 0.6, -T * 0.2, -T * 0.3, 0.35); c.fill(); ink(c, lw);
      c.beginPath(); c.rect(-w, -H, w * 2, H - T * 0.32); const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, PLAT); g.addColorStop(1, PLAT_D); c.fillStyle = g; c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(120,135,160,.4)'; c.lineWidth = lw * 0.7; c.beginPath(); for (const u of [-0.55, -0.18, 0.18, 0.55]) { c.moveTo(u * w, -H + T * 0.1); c.lineTo(u * w, -T * 0.42); } c.stroke();
      c.beginPath(); c.moveTo(-T * 0.58, -H); c.lineTo(T * 0.58, -H); c.lineTo(T * 0.46, -H - T * 0.28); c.lineTo(-T * 0.46, -H - T * 0.28); c.closePath(); c.fillStyle = shade(c, GOLD, T * 0.6, -T * 0.2, -H, 0.35); c.fill(); ink(c, lw);
      for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * T * 0.42, -H - T * 0.08, T * 0.1, 0, TAU); c.fillStyle = GOLD_HI; c.fill(); ink(c, lw * 0.7); }
      halo(c, 0, -H - T * 0.75 - (v % 2) * T * 0.1, T * 0.42, lw); },
    /* a celestial monument (not a figure): a stepped marble plinth, and above it either a faceted crystal of white
       gold turning inside a tilted golden ring (even variants), or a pearl orb inside an armillary of rings (odd) */
    angelstatue(c, T, v) { const lw = lw0(T); shadowEll(c, T, 1.0);
      // the plinth: two steps, each a lit top ellipse over a shaded front
      for (const [y, rw, h] of [[0, 0.95, 0.32], [-0.32, 0.7, 0.3]]) { const top = y * T - h * T;
        c.beginPath(); c.moveTo(-rw * T, y * T); c.lineTo(-rw * T, top); c.ellipse(0, top, rw * T, rw * T * 0.3, 0, Math.PI, 0, false); c.lineTo(rw * T, y * T); c.ellipse(0, y * T, rw * T, rw * T * 0.3, 0, 0, Math.PI, false); c.closePath();
        const g = c.createLinearGradient(-rw * T, 0, rw * T, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, MARBLE); g.addColorStop(1, MARBLE_D); c.fillStyle = g; c.fill(); ink(c, lw);
        ell(c, 0, top, rw * T, rw * T * 0.3); c.fillStyle = '#FFFFFF'; c.fill(); ink(c, lw); c.strokeStyle = GOLD; c.lineWidth = lw * 1.2; ell(c, 0, top, rw * T * 0.82, rw * T * 0.24); c.stroke(); }
      const cy = -T * 2.45; glowIn(c, 0, cy, T * 2.1, '#FFF1C8', 0.55);
      const ring = (front) => { c.save(); c.translate(0, cy); c.rotate(-0.35); c.beginPath(); c.ellipse(0, 0, T * 1.45, T * 0.46, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.lineWidth = T * 0.11 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.11; c.strokeStyle = GOLD; c.stroke(); c.lineWidth = T * 0.03; c.strokeStyle = GOLD_HI; c.stroke();
        for (const a of front ? [0.7, 2.2] : [3.9, 5.3]) { c.beginPath(); c.arc(Math.cos(a) * T * 1.45, Math.sin(a) * T * 0.46, T * 0.11, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill(); ink(c, lw * 0.7); } c.restore(); };
      if (v % 2 === 0) { ring(false);
        // the crystal: a bipyramid seen a little from above; six faces lit from the upper left
        const R = T * 0.88, top = cy - T * 1.35, bot = cy + T * 1.05, P = [0, 1, 2, 3, 4, 5].map(k => { const a = -Math.PI / 2 + k / 6 * TAU + 0.3; return [Math.cos(a) * R, cy + Math.sin(a) * R * 0.32]; });
        const face = (a, b, apex, col) => { c.beginPath(); c.moveTo(P[a][0], P[a][1]); c.lineTo(P[b][0], P[b][1]); c.lineTo(0, apex); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(160,130,60,.55)'; c.lineWidth = lw * 0.6; c.stroke(); };
        // lower faces (front three), then upper faces: far ones first, near ones last
        [[1, 2, '#E9D9A6'], [2, 3, '#D8C285'], [3, 4, '#C9AE6A']].forEach(([a, b, col]) => face(a, b, bot, col));
        [[4, 5, '#FFF6D8'], [5, 0, '#FFFFFF'], [0, 1, '#FFF1C4']].forEach(([a, b, col]) => face(a, b, top, col));
        [[1, 2, '#F6E7B8'], [2, 3, '#EAD597'], [3, 4, '#DCC27E']].forEach(([a, b, col]) => face(a, b, top, col));
        c.beginPath(); c.moveTo(0, top); P.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(0, top); c.moveTo(P[1][0], P[1][1]); c.lineTo(0, bot); c.lineTo(P[4][0], P[4][1]); c.moveTo(P[2][0], P[2][1]); c.lineTo(0, bot); c.lineTo(P[3][0], P[3][1]); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-R * 0.5, cy - T * 0.55); c.lineTo(-R * 0.15, top + T * 0.2); c.stroke();
        glowIn(c, 0, cy, T * 0.7, '#FFFFFF', 0.5); ring(true); }
      else { // a pearl orb inside two crossing rings
        c.save(); c.translate(0, cy); c.rotate(0.6); c.beginPath(); c.ellipse(0, 0, T * 1.2, T * 0.36, 0, Math.PI, TAU); c.lineWidth = T * 0.08 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.08; c.strokeStyle = GOLD; c.stroke(); c.restore(); ring(false);
        const g = c.createRadialGradient(-T * 0.25, cy - T * 0.3, T * 0.05, 0, cy, T * 0.95); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, '#F3EDFF'); g.addColorStop(1, '#C8BCE8'); c.beginPath(); c.arc(0, cy, T * 0.92, 0, TAU); c.fillStyle = g; c.fill(); ink(c, lw);
        c.strokeStyle = 'rgba(207,180,110,.55)'; c.lineWidth = lw; ell(c, 0, cy, T * 0.92, T * 0.26); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; ell(c, -T * 0.36, cy - T * 0.4, T * 0.2, T * 0.12, -0.5); c.fill();
        c.save(); c.translate(0, cy); c.rotate(0.6); c.beginPath(); c.ellipse(0, 0, T * 1.2, T * 0.36, 0, 0, Math.PI); c.lineWidth = T * 0.08 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.08; c.strokeStyle = GOLD; c.stroke(); c.restore(); ring(true); }
    },
    /* a golden arch with a halo hung in it and light filling it */
    haloarch(c, T, v) { const lw = lw0(T), w = T * 1.15, H = T * 2.6; shadowEll(c, T, 1.3);
      glowIn(c, 0, -H * 0.7, T * 1.8, HOLY, 0.6);
      c.save(); c.globalAlpha = 0.5; c.fillStyle = '#FFF6D6'; c.beginPath(); c.moveTo(-w * 0.78, 0); c.lineTo(-w * 0.78, -H); c.arc(0, -H, w * 0.78, Math.PI, 0); c.lineTo(w * 0.78, 0); c.closePath(); c.fill(); c.restore();
      for (const sd of [-1, 1]) { c.beginPath(); c.rect(sd * w - (sd < 0 ? 0 : T * 0.36), -H, T * 0.36, H); c.fillStyle = shade(c, GOLD, T * 0.6, sd * w, -H * 0.6, 0.35); c.fill(); ink(c, lw); }
      c.beginPath(); c.arc(0, -H, w, Math.PI, 0); c.arc(0, -H, w - T * 0.36, 0, Math.PI, true); c.closePath(); c.fillStyle = shade(c, GOLD, T, -T * 0.3, -H - T * 0.6, 0.35); c.fill(); ink(c, lw);
      c.fillStyle = GOLD_HI; c.beginPath(); c.arc(0, -H - w + T * 0.18, T * 0.12, 0, TAU); c.fill(); ink(c, lw * 0.6);
      halo(c, 0, -H * 0.62 + Math.sin(v) * T * 0.05, T * 0.5, lw, 1); },
    /* a golden censer on three legs, a white-gold holy flame */
    censer(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.55);
      c.strokeStyle = LN; c.lineWidth = T * 0.07 + lw * 2; c.lineCap = 'round'; c.beginPath(); for (const sd of [-1, 0, 1]) { c.moveTo(sd * T * 0.35, 0); c.lineTo(sd * T * 0.18, -T * 0.7); } c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.07; c.stroke();
      c.beginPath(); c.moveTo(-T * 0.55, -T * 0.95); c.quadraticCurveTo(0, -T * 0.4, T * 0.55, -T * 0.95); c.closePath(); c.fillStyle = shade(c, GOLD, T * 0.6, -T * 0.2, -T * 0.8, 0.35); c.fill(); ink(c, lw);
      ell(c, 0, -T * 0.95, T * 0.55, T * 0.14); c.fillStyle = '#FFF1B8'; c.fill(); ink(c, lw * 0.8);
      glowIn(c, 0, -T * 1.5, T * 1.3, '#FFE9A8', 0.8);
      c.beginPath(); c.moveTo(-T * 0.32, -T * 0.98); c.quadraticCurveTo(-T * 0.4, -T * 1.55, 0, -T * 2.1); c.quadraticCurveTo(T * 0.4, -T * 1.55, T * 0.32, -T * 0.98); c.closePath(); c.fillStyle = '#FFF6D6'; c.fill();
      c.beginPath(); c.moveTo(-T * 0.16, -T * 1.0); c.quadraticCurveTo(-T * 0.18, -T * 1.4, 0, -T * 1.75); c.quadraticCurveTo(T * 0.18, -T * 1.4, T * 0.16, -T * 1.0); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill(); },
    /* a bank of cloud resting on the stair */
    cloudbank(c, T, v) { const puffs = [[-0.9, -0.35, 0.5], [-0.35, -0.6, 0.62], [0.3, -0.55, 0.58], [0.85, -0.3, 0.45], [0, -0.25, 0.5], [-0.55, -0.15, 0.4], [0.55, -0.12, 0.4]];
      c.fillStyle = 'rgba(150,140,200,.18)'; ell(c, 0, T * 0.02, T * 1.3, T * 0.32); c.fill();
      for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x * T, y * T, r * T, 0, TAU); c.fillStyle = '#D9DAF2'; c.fill(); }
      for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x * T - r * T * 0.08, y * T - r * T * 0.12, r * T * 0.86, 0, TAU); const g = c.createRadialGradient(x * T - r * T * 0.3, y * T - r * T * 0.4, 1, x * T, y * T, r * T); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#EEF0FF'); c.fillStyle = g; c.fill(); } },
    /* a golden harp with shining strings */
    harp(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.5);
      c.beginPath(); c.rect(-T * 0.4, -T * 0.25, T * 0.8, T * 0.25); c.fillStyle = shade(c, GOLD, T * 0.5, 0, -T * 0.2, 0.35); c.fill(); ink(c, lw);
      c.beginPath(); c.moveTo(-T * 0.3, -T * 0.25); c.lineTo(-T * 0.3, -T * 2.3); c.quadraticCurveTo(T * 0.2, -T * 2.6, T * 0.55, -T * 2.0); c.quadraticCurveTo(T * 0.35, -T * 1.1, T * 0.3, -T * 0.25);
      c.lineWidth = T * 0.14 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.14; c.strokeStyle = GOLD; c.stroke(); c.lineWidth = T * 0.04; c.strokeStyle = GOLD_HI; c.stroke();
      c.strokeStyle = 'rgba(255,250,230,.9)'; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < 7; i++) { const u = i / 7, x = -T * 0.3 + u * T * 0.62, top = -T * 2.3 + (Math.sin(u * Math.PI) * -0.25 + u * 0.5) * T; c.moveTo(x, -T * 0.3); c.lineTo(x, top); } c.stroke();
      glowIn(c, 0, -T * 1.4, T * 1.0, GOLD_HI, 0.35); },
  });
  /* the Bindery's finery: a silver urn of white lilies, a tall oval mirror in a silver frame */
  Object.assign(PROP_EXT, { silverurn: [2.0, 2.8], mirror: [2.0, 3.8] });
  Object.assign(PROPS, {
    silverurn(c, T, v) { const lw = lw0(T); c.fillStyle = 'rgba(60,70,100,.25)'; ell(c, 0, T * 0.03, T * 0.5, T * 0.16); c.fill();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42, L = T * (0.9 + (i % 2) * 0.25), x1 = Math.cos(a) * L * 0.55, y1 = -T * 1.05 + Math.sin(a) * L;
        c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(0, -T * 1.0); c.quadraticCurveTo(x1 * 0.4, -T * 1.3, x1, y1); c.stroke(); c.strokeStyle = '#5E9A6A'; c.lineWidth = lw; c.stroke();
        for (let k = 0; k < 5; k++) { const b = k / 5 * TAU; c.beginPath(); c.ellipse(x1 + Math.cos(b) * T * 0.1, y1 + Math.sin(b) * T * 0.1, T * 0.12, T * 0.05, b, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill(); ink(c, lw * 0.5); } c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(x1, y1, T * 0.04, 0, TAU); c.fill(); }
      c.beginPath(); c.moveTo(-T * 0.22, 0); c.quadraticCurveTo(-T * 0.5, -T * 0.45, -T * 0.25, -T * 0.9); c.lineTo(-T * 0.32, -T * 1.05); c.lineTo(T * 0.32, -T * 1.05); c.lineTo(T * 0.25, -T * 0.9); c.quadraticCurveTo(T * 0.5, -T * 0.45, T * 0.22, 0); c.closePath();
      const g = c.createLinearGradient(-T * 0.5, 0, T * 0.5, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.35, '#DCE2EC'); g.addColorStop(0.7, '#9AA4B8'); g.addColorStop(1, '#C9D0DC'); c.fillStyle = g; c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(60,74,106,.5)'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-T * 0.4, -T * 0.5); c.quadraticCurveTo(0, -T * 0.4, T * 0.4, -T * 0.5); c.stroke(); c.fillStyle = 'rgba(255,255,255,.8)'; ell(c, -T * 0.2, -T * 0.55, T * 0.05, T * 0.18, 0.2); c.fill(); },
    mirror(c, T, v) { const lw = lw0(T), H = T * 2.6; c.fillStyle = 'rgba(60,70,100,.25)'; ell(c, 0, T * 0.03, T * 0.6, T * 0.18); c.fill();
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * T * 0.15, 0); c.lineTo(sd * T * 0.45, -T * 0.25); c.lineWidth = T * 0.07 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.07; c.strokeStyle = '#C9D0DC'; c.stroke(); }
      ell(c, 0, -H * 0.55, T * 0.62, H * 0.42); const fr = c.createLinearGradient(-T * 0.6, 0, T * 0.6, 0); fr.addColorStop(0, '#FFFFFF'); fr.addColorStop(0.5, '#C9D0DC'); fr.addColorStop(1, '#8E98AA'); c.fillStyle = fr; c.fill(); ink(c, lw);
      ell(c, 0, -H * 0.55, T * 0.5, H * 0.36); const gl = c.createLinearGradient(-T * 0.5, -H, T * 0.5, 0); gl.addColorStop(0, '#E6EEFF'); gl.addColorStop(0.5, '#9FB2D8'); gl.addColorStop(1, '#5A6A92'); c.fillStyle = gl; c.fill(); ink(c, lw * 0.7);
      c.save(); ell(c, 0, -H * 0.55, T * 0.5, H * 0.36); c.clip(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = T * 0.12; c.beginPath(); c.moveTo(-T * 0.45, -H * 0.4); c.lineTo(T * 0.1, -H * 0.95); c.stroke(); c.lineWidth = T * 0.05; c.beginPath(); c.moveTo(-T * 0.2, -H * 0.3); c.lineTo(T * 0.35, -H * 0.85); c.stroke(); c.restore();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, -H * 0.97, T * 0.1, 0, TAU); c.fill(); ink(c, lw * 0.6); },
  });
  BIOMES.binding.props = ['bookcase', 'mirror', 'bookcase', 'silverurn', 'candelabra', 'bookstack', 'lectern', 'bookcase', 'silverurn', 'libladder'];
  BIOMES.binding.rim = ['bookcase', 'bookcase', 'mirror', 'silverurn', 'bookcase', 'candelabra'];
  // marble veining on the Bindery's floor
  DECAL_EXT.vein = (c, d, s) => { c.strokeStyle = 'rgba(120,132,160,.28)'; c.lineWidth = Math.max(1, s * 0.12); c.rotate(d.rot); c.beginPath(); c.moveTo(-s * 3, 0); c.bezierCurveTo(-s, -s * 1.2, s * 0.5, s, s * 3, -s * 0.4); c.moveTo(-s * 0.5, s * 0.1); c.quadraticCurveTo(0, s * 0.9, s * 0.9, s * 1.4); c.stroke(); };
  if (typeof DECALS !== 'undefined') DECALS.binding = [['vein', 0.12], ['silverleaf', 0.05], ['page', 0.04], ['quillmark', 0.02]];
  BIOMES.archive.rim = ['platpillar', 'bookcase', 'angelstatue', 'platpillar', 'haloarch', 'bookcase', 'cloudbank'];

  /* ---- the angelic brood ---- */
  Object.assign(MON, {
    seraphling: { name: 'Seraphling', from: 999, hp: 250, spd: 1.5, r: 0.42, dmg: 17, xp: 17, coin: 1.0, color: '#FFF6E0', bio: ['archive'], fly: true, tip: 'A little six-winged angel. It raises its wings and calls down HOLY FIRE on shown circles round you: step out before it falls.', kit: [] },
    haloguard: { name: 'Halo guard', from: 999, hp: 330, spd: 1.6, r: 0.5, dmg: 19, xp: 19, coin: 1.1, color: PLAT, bio: ['archive'], tip: 'A platinum knight of heaven. It lowers its spear (a shown line), then lunges along it: step aside.', kit: [] },
    ophanwheel: { name: 'Ophan wheel', from: 999, hp: 300, spd: 0.9, r: 0.55, dmg: 15, xp: 18, coin: 1.0, color: GOLD, bio: ['archive'], fly: true, tip: 'A wheel within a wheel, full of eyes. Its rings flare, then it bursts bolts of light all round it: stand between them.', kit: [] },
  });
  Object.assign(MP, {
    /* a round robed body, a pale gold mask with one great eye, six white wings, a halo; wings rise when it casts */
    seraphling(c, r, ph, o) { const lw = lwOf(r), bob = Math.sin(ph * TAU) * r * 0.12, cast = o.mode === 'block' ? 1 : 0, fl = Math.sin(ph * TAU * 2) * 0.18;
      c.fillStyle = 'rgba(120,100,60,.2)'; ell(c, 0, r * 1.15, r * 0.6, r * 0.18); c.fill();
      c.save(); c.translate(0, -r * 0.35 + bob);
      if (cast) glowIn(c, 0, -r * 0.2, r * 2.4, '#FFE9A8', 0.6);
      for (const [a, L, n] of [[-0.35 - cast * 0.5, 1.5, 5], [0.1, 1.15, 4], [0.55, 0.8, 3]]) for (const sd of [-1, 1]) wing(c, sd * r * 0.3, -r * 0.1, sd < 0 ? Math.PI - (a + fl) : a + fl, r * L, n, lw);
      c.beginPath(); c.moveTo(-r * 0.42, r * 0.1); c.quadraticCurveTo(-r * 0.5, r * 0.8, 0, r * 0.95); c.quadraticCurveTo(r * 0.5, r * 0.8, r * 0.42, r * 0.1); c.closePath(); c.fillStyle = shade(c, '#FFFFFF', r, -r * 0.2, r * 0.3, 0.25); c.fill(); stroke(c, lw);
      c.beginPath(); c.arc(0, -r * 0.25, r * 0.5, 0, TAU); c.fillStyle = shade(c, '#F7E2A8', r * 0.5, -r * 0.15, -r * 0.4, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(0, -r * 0.25, r * 0.3, r * (0.14 + cast * 0.08), 0, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill(); stroke(c, lw * 0.8); c.fillStyle = cast ? '#FF9A3C' : '#6A8AD8'; c.beginPath(); c.arc(0, -r * 0.25, r * 0.11, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-r * 0.04, -r * 0.29, r * 0.035, 0, TAU); c.fill();
      halo(c, 0, -r * 0.95, r * 0.42, lw * 0.8, 0.8 + cast * 0.6);
      c.restore(); },
    /* a platinum knight with folded wings, a T-visored helm glowing gold, a halo and a long spear */
    haloguard(c, r, ph, o) { const lw = lwOf(r), lunge = o.mode === 'dash' ? 1 : 0, aim = o.mode === 'block' ? 1 : 0, st2 = Math.sin(ph * TAU);
      c.fillStyle = 'rgba(120,100,60,.22)'; ell(c, 0, r * 0.85, r * 0.85, r * 0.25); c.fill();
      for (const sd of [-1, 1]) wing(c, sd * r * 0.25, -r * 0.55, sd < 0 ? Math.PI + 0.9 : -0.9, r * 1.3, 4, lw);
      for (const sd of [-1, 1]) { c.beginPath(); c.rect(sd * r * 0.28 - r * 0.13, r * 0.25, r * 0.26, r * 0.55 + (sd < 0 ? st2 : -st2) * r * 0.06); c.fillStyle = PLAT_D; c.fill(); stroke(c, lw * 0.8); }
      c.beginPath(); c.moveTo(-r * 0.6, -r * 0.45); c.lineTo(r * 0.6, -r * 0.45); c.lineTo(r * 0.45, r * 0.35); c.lineTo(-r * 0.45, r * 0.35); c.closePath(); const g = c.createLinearGradient(-r * 0.6, 0, r * 0.6, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, PLAT); g.addColorStop(1, PLAT_D); c.fillStyle = g; c.fill(); stroke(c, lw);
      c.strokeStyle = GOLD; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(0, -r * 0.4); c.lineTo(0, r * 0.3); c.moveTo(-r * 0.3, -r * 0.1); c.lineTo(r * 0.3, -r * 0.1); c.stroke();
      c.beginPath(); c.ellipse(0, -r * 0.8, r * 0.36, r * 0.4, 0, 0, TAU); c.fillStyle = shade(c, PLAT, r * 0.4, -r * 0.1, -r * 0.95, 0.35); c.fill(); stroke(c, lw);
      c.fillStyle = aim ? '#FFFFFF' : GOLD_HI; c.fillRect(-r * 0.22, -r * 0.86, r * 0.44, r * 0.08); c.fillRect(-r * 0.04, -r * 0.86, r * 0.08, r * 0.3); glowIn(c, 0, -r * 0.8, r * 0.6, GOLD_HI, 0.5 + aim * 0.4);
      halo(c, 0, -r * 1.35, r * 0.36, lw * 0.8);
      // the spear: held up, lowered to aim, thrust forward in the lunge
      c.save(); c.translate(r * 0.55, -r * 0.1); c.rotate(aim || lunge ? 0 : -1.2); const L = r * (1.9 + lunge * 0.4);
      c.strokeStyle = LN; c.lineWidth = r * 0.12 + lw * 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.4, 0); c.lineTo(L, 0); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = r * 0.12; c.stroke();
      c.beginPath(); c.moveTo(L, -r * 0.14); c.lineTo(L + r * 0.45, 0); c.lineTo(L, r * 0.14); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill(); stroke(c, lw * 0.8); c.restore(); },
    /* two golden rings turning through each other, studded with eyes, light at the hub */
    ophanwheel(c, r, ph, o) { const lw = lwOf(r), flare = o.mode === 'block' ? 1 : 0, sp = ph * TAU, bob = Math.sin(ph * TAU) * r * 0.1;
      c.fillStyle = 'rgba(120,100,60,.2)'; ell(c, 0, r * 1.1, r * 0.8, r * 0.22); c.fill();
      c.save(); c.translate(0, -r * 0.4 + bob); glowIn(c, 0, 0, r * (1.8 + flare), '#FFE9A8', 0.5 + flare * 0.4);
      for (const [rot, sq] of [[sp * 0.5, 0.35], [-sp * 0.35 + 1.2, 0.9]]) { c.save(); c.rotate(rot); c.scale(1, sq);
        c.lineWidth = r * 0.22 + lw * 2; c.strokeStyle = LN; c.beginPath(); c.arc(0, 0, r * 0.9, 0, TAU); c.stroke(); c.lineWidth = r * 0.22; c.strokeStyle = GOLD; c.stroke(); c.lineWidth = r * 0.06; c.strokeStyle = GOLD_HI; c.stroke();
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + sp * 0.2, ex = Math.cos(a) * r * 0.9, ey = Math.sin(a) * r * 0.9; c.save(); c.translate(ex, ey); c.scale(1, 1 / sq); c.beginPath(); c.ellipse(0, 0, r * 0.15, r * 0.1, 0, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = LN; c.stroke(); c.fillStyle = flare ? '#FF9A3C' : '#4A6AC8'; c.beginPath(); c.arc(0, 0, r * 0.055, 0, TAU); c.fill(); c.restore(); }
        c.restore(); }
      c.beginPath(); c.arc(0, 0, r * 0.28, 0, TAU); c.fillStyle = flare ? '#FFFFFF' : GOLD_HI; c.fill(); stroke(c, lw); c.restore(); },
  });
  Object.assign(EXT, { seraphling: 3.6, haloguard: 3.4, ophanwheel: 3.0 }); Object.assign(NF, { seraphling: 6, haloguard: 6, ophanwheel: 6 });

  // holy fire: columns of light that fall from the sky onto a shown circle (drawn over the stage by everyStage)
  const PILLARS = [];
  function holyFire(X, x, y, r, dmg, src, delay) {
    X.warn({ x, y, r, life: delay, max: delay, src, color: '#FFB23F', fn: () => {
      PILLARS.push({ x, y, r, t: 0, life: 0.55 });
      if (!X.me.dodge && Math.hypot(X.me.x - x, X.me.y - y) < r + X.me.r * 0.5) { X.hurtPet(dmg, src); X.text(X.me.x, X.me.y - 1.4, 'Holy fire!', '#FFB23F', 13); }
      X.boom(x, y, r * 0.9, '#FFD36B', '#FFFFFF', { n: 14, shake: 3 });
      for (let i = 0; i < 8; i++) X.part({ kind: 'spark', x: x + (Math.random() - 0.5) * r, y, vx: (Math.random() - 0.5) * 2, vy: -3 - Math.random() * 3, life: 0.7, max: 0.7, size: 3, color: Math.random() < 0.5 ? '#FFFFFF' : '#FFD36B' }); } }); }
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    seraphling(m, A, X) {
      if (m.castT > 0) { m.castT -= A.dt; m.mode = 'block'; if (m.castT <= 0) m.mode = null; return; }
      m.mode = null; keepRange(m, A, X, 4.5, 7.5);
      if (m.cd <= 0 && A.d < 9) { m.cd = 5.2 + Math.random() * 2.2; m.castT = 0.9; const px = X.me.x + (X.me.vx || 0) * 0.5, py = X.me.y + (X.me.vy || 0) * 0.5;
        holyFire(X, px, py, 1.25, m.dmg * 1.2, m, 1.15); for (let i = 0; i < 1; i++) { const a = Math.random() * TAU, d = 1.8 + Math.random() * 1.6; holyFire(X, px + Math.cos(a) * d, py + Math.sin(a) * d, 1.1, m.dmg, m, 1.15 + 0.25 * (i + 1)); } X.say(m, '✦'); }
    },
    haloguard(m, A, X) {
      if (m.dashT > 0) { m.dashT -= A.dt; m.mode = 'dash'; X.moveEnt(m, Math.cos(m.da) * 13 * A.dt, Math.sin(m.da) * 13 * A.dt); if (!m.dhit && A.d < m.r + X.me.r + 0.3) { m.dhit = true; X.hurtPet(m.dmg * 1.35, m); X.push(m.da, 1.6); } if (m.dashT <= 0) { m.mode = null; m.cd = 2.6 + Math.random() * 1.2; } return; }
      if (m.aimT > 0) { m.aimT -= A.dt; m.mode = 'block'; m.face = Math.cos(m.da) >= 0 ? 1 : -1; if (m.aimT <= 0) { m.dashT = 0.4; m.dhit = false; } return; }
      m.mode = null; if (A.d > 2.2) A.steer(A.sp); m.face = A.dx >= 0 ? 1 : -1;
      if (m.cd <= 0 && A.d < 5.5 && A.los()) { m.aimT = 0.65; m.da = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 5.8, w: 0.9, life: 0.65, max: 0.65, src: m, color: GOLD_HI }); }
    },
    ophanwheel(m, A, X) {
      if (m.flareT > 0) { m.flareT -= A.dt; m.mode = 'block'; if (m.flareT <= 0) { m.mode = null; const off = (m.burst = (m.burst || 0) + 1) % 2 ? Math.PI / 8 : 0; for (let i = 0; i < 8; i++) X.eshot(m.x, m.y - 0.4, off + i / 8 * TAU, 6, { dmg: m.dmg, color: '#FFE9A8', core: '#FFFFFF', r: 0.18, style: 'orb', src: m }); } return; }
      m.mode = null; keepRange(m, A, X, 3, 6);
      if (m.cd <= 0 && A.d < 7) { m.cd = 2.8 + Math.random(); m.flareT = 0.7; X.warn({ x: m.x, y: m.y, r: 2.0, life: 0.7, max: 0.7, src: m, color: '#FFE9A8' }); }
    },
  });

  /* ---- over every stage of the Ascent: ribbons of light swirling in the air, rising motes, the falling holy fire ---- */
  const Rf = RIFT_BY_ID.library, prevEvery = Rf.everyStage;
  Rf.everyStage = (X, self, H) => { const base = prevEvery ? prevEvery(X, self, H) || {} : {}, holy = X.F.biome === 'archive' && X.F.rift && X.F.rift.kind !== 'boss';
    PILLARS.length = 0; const motes = [], threads = []; let threadT = 0.5;
    const TALL = { platpillar: 3.9, angelstatue: 3.0, haloarch: 2.7, censer: 1.9, harp: 2.4, bookcase: 3.7, cloudbank: 0.8 };
    function spawnThread() { const W = X.W(), Hh = X.H ? X.H() : 900, T = X.Tz(), on = p => { const xs = X.sx(p.x), ys = X.sy(p.y); return xs > -T * 2 && xs < W + T * 2 && ys > -T * 2 && ys < Hh + T * 4; };
      const tall = (X.props || []).filter(p => TALL[p.kind] && on(p)), r = Math.random(), col = Math.random() < 0.6 ? '#FFE9A8' : '#CFE2FF', base = { t: 0, max: 1.8 + Math.random() * 1.2, seed: Math.random() * 9, bow: (Math.random() - 0.5) * 1.2, col };
      if (tall.length >= 2 && r < 0.6) { const a = tall[Math.floor(Math.random() * tall.length)], near = tall.filter(b => b !== a && Math.hypot(b.x - a.x, b.y - a.y) < 8); if (near.length) { const b = near[Math.floor(Math.random() * near.length)]; threads.push(Object.assign(base, { ax: a.x, ay: a.y, ah: TALL[a.kind], bx: b.x, by: b.y, bh: TALL[b.kind] })); return; } }
      if (tall.length && r < 0.85) { const a = tall[Math.floor(Math.random() * tall.length)]; threads.push(Object.assign(base, { ax: a.x, ay: a.y, ah: TALL[a.kind], bx: a.x, by: a.y, bh: 0, sky: true, skx: (Math.random() - 0.5) * 6 })); return; }
      const x = X.me.x + (Math.random() - 0.5) * 10, y = X.me.y + (Math.random() - 0.5) * 12, a = Math.random() * TAU, d = 2.5 + Math.random() * 3; threads.push(Object.assign(base, { ax: x, ay: y, ah: 1.5 + Math.random(), bx: x + Math.cos(a) * d, by: y + Math.sin(a) * d * 0.6, bh: 1.5 + Math.random() })); }
    return {
      update(dt) { if (base.update) base.update(dt); for (const p of PILLARS) p.t += dt; for (let i = PILLARS.length - 1; i >= 0; i--) if (PILLARS[i].t > PILLARS[i].life) PILLARS.splice(i, 1);
        if (holy) { threadT -= dt; for (const th of threads) th.t += dt; for (let i = threads.length - 1; i >= 0; i--) if (threads[i].t >= threads[i].max) threads.splice(i, 1);
          if (threadT <= 0 && threads.length < 6) { threadT = 0.35 + Math.random() * 0.45; spawnThread(); }
          if (motes.length < 12 && Math.random() < 0.25) motes.push({ x: Math.random(), y: 1.05, v: 0.04 + Math.random() * 0.06, s: 1 + Math.random() * 2, ph: Math.random() * 6 }); for (const q of motes) q.y -= q.v * dt; for (let i = motes.length - 1; i >= 0; i--) if (motes[i].y < -0.05) motes.splice(i, 1); } },
      drawGround(c) { if (base.drawGround) base.drawGround(c); },
      drawOver(c) { if (base.drawOver) base.drawOver(c); const T = X.Tz(), t = X.g.t, W = X.W(), Hh = X.H ? X.H() : 900;
        // the holy fire: a column of white-gold light falling onto its circle
        // (feathered all round: a stretched soft glow for the column, a softer core, a pool of light where it lands)
        for (const p of PILLARS) { const k = Math.sin(Math.PI * Math.min(1, p.t / p.life)) * 0.9, Xs = X.sx(p.x), Ys = X.sy(p.y), w = p.r * T * 0.85, top = Ys - Math.min(Hh * 0.8, T * 9);
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * k; blitSized(c, glowSprite('#FFD36B'), Xs - w * 1.6, top, w * 3.2, (Ys - top) * 1.25); c.globalAlpha = 0.5 * k; blitSized(c, glowSprite('#FFFFFF'), Xs - w * 0.55, top + (Ys - top) * 0.15, w * 1.1, (Ys - top) * 1.0); c.restore();
          glowIn(c, Xs, Ys, w * 2.4, '#FFD36B', 0.8 * k); glowIn(c, Xs, Ys, w * 1.2, '#FFFFFF', 0.6 * k); }
        if (!holy) return;
        // thin threads of soft light weaving between the holy things (and down from the sky), fading in and out
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (const th of threads) { const k = Math.sin(Math.PI * Math.min(1, th.t / th.max)), ax = X.sx(th.ax), ay = X.sy(th.ay) - th.ah * T, bx = th.sky ? X.sx(th.bx) + th.skx * T : X.sx(th.bx), by = th.sky ? -20 : X.sy(th.by) - th.bh * T;
          const mx = (ax + bx) / 2, my = (ay + by) / 2, nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1, bend = Math.sin(t * 1.3 + th.seed) * T * 0.9 + th.bow * T;
          const cx = mx + nx / L * bend, cy = my + ny / L * bend;
          c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(cx, cy, bx, by);
          c.globalAlpha = 0.16 * k; c.strokeStyle = th.col; c.lineWidth = Math.max(3, T * 0.12); c.stroke();
          c.globalAlpha = 0.5 * k; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.3; c.stroke();
          // a bead of light running along it
          const u = (th.t / th.max * 1.4) % 1, px = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx, py = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by; c.globalAlpha = 0.7 * k; c.fillStyle = '#FFF6D0'; c.beginPath(); c.arc(px, py, 2.2, 0, TAU); c.fill(); }
        c.restore();
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const q of motes) { const x = q.x * W + Math.sin(t + q.ph) * 12, y = q.y * Hh; c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3 + q.ph); c.fillStyle = '#FFF6D0'; c.beginPath(); c.arc(x, y, q.s, 0, TAU); c.fill(); }
        c.restore(); },
    }; };
  LIB.holyFire = holyFire;
})();
