/* ---------- the high tower (floors 101 to 120): the creatures of the ten high lands, how they fight, and how they look ----------
   Shadows and small things out of old stories. Painted in the same inked, shaded hand as the rest of the monster book. */
(() => {
  const { LN, lwOf, shade, stroke, cuteFace, vgrad, spec, MP, NF, EXT } = DunArt;
  const TAU = Math.PI * 2;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const eye = (c, x, y, r, col) => { glowAt(c, x, y, r * 3, col, 0.7); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); c.fill(); };
  /* a leg or arm as two inked strokes */
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  /* ---------- painters ---------- */
  Object.assign(MP, {
    /* a living shadow: a torn dark body that frays into smoke, two violet lamps for eyes */
    shade(c, r, ph, o) {
      const lw = lwOf(r), fl = Math.sin(ph * TAU), col = o.color;
      c.save(); c.globalAlpha = 0.35; for (let i = 0; i < 5; i++) { const a = ph * TAU + i * 1.26, x = -r * 0.9 - i * r * 0.22 + Math.cos(a) * r * 0.15, y = Math.sin(a) * r * 0.5 - r * 0.1; c.fillStyle = shadeC(col, 0.15 - i * 0.05); c.beginPath(); c.arc(x, y, r * (0.42 - i * 0.06), 0, TAU); c.fill(); } c.restore();
      c.beginPath(); c.moveTo(r * 0.9, -r * 0.2); c.quadraticCurveTo(r * 1.0, r * 0.6, r * 0.3, r * 0.75); c.lineTo(r * 0.05, r * 0.5); c.lineTo(-r * 0.2, r * 0.9); c.lineTo(-r * 0.4, r * 0.45); c.lineTo(-r * 0.75, r * 0.8); c.lineTo(-r * 0.7, r * 0.2); c.quadraticCurveTo(-r * 1.1, -r * 0.4 + fl * r * 0.08, -r * 0.4, -r * 0.85); c.quadraticCurveTo(r * 0.3, -r * 1.15, r * 0.9, -r * 0.2); c.closePath();
      c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.5); c.fill(); stroke(c, lw);
      c.save(); c.clip(); c.fillStyle = 'rgba(185,131,245,.14)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(-r * 0.2 + i * r * 0.25, r * 0.2 - i * r * 0.1, r * 0.35, r * 0.12, -0.5, 0, TAU); c.fill(); } c.restore();
      eye(c, r * 0.1, -r * 0.3, r * 0.14, '#B983F5'); eye(c, r * 0.5, -r * 0.35, r * 0.12, '#B983F5');
      c.strokeStyle = '#B983F5'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(r * 0.05, r * 0.1); c.quadraticCurveTo(r * 0.35, r * 0.25, r * 0.6, r * 0.05); c.stroke();
    },
    /* a hound of smoke: the wolf's bones under a body that frays away behind it, ember eyes */
    umbra(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, st2 = Math.sin(ph * TAU);
      c.save(); c.globalAlpha = 0.4; for (let i = 0; i < 4; i++) { c.fillStyle = shadeC(col, 0.2); c.beginPath(); c.arc(-r * 1.1 - i * r * 0.3, -r * 0.1 + Math.sin(ph * TAU + i) * r * 0.2, r * (0.4 - i * 0.07), 0, TAU); c.fill(); } c.restore();
      [[-0.35, 0.9], [0.4, 0.9]].forEach(([x, y], i) => limb(c, x * r, r * 0.3, x * r + (i % 2 ? st2 : -st2) * r * 0.15, y * r, lw * 1.4, shadeC(col, -0.1)));
      c.beginPath(); c.moveTo(-r * 1.2, r * 0.1); c.quadraticCurveTo(-r * 0.6, -r * 0.7, r * 0.5, -r * 0.55); c.quadraticCurveTo(r * 1.0, -r * 0.3, r * 0.9, r * 0.3); c.quadraticCurveTo(r * 0.3, r * 0.75, -r * 0.5, r * 0.6); c.quadraticCurveTo(-r * 1.0, r * 0.6, -r * 1.2, r * 0.1); c.closePath();
      c.fillStyle = shade(c, col, r, 0, 0, 0.45); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(r * 0.9, -r * 0.4, r * 0.5, r * 0.38, 0.15, 0, TAU); c.fillStyle = shade(c, col, r * 0.5, r * 0.9, -r * 0.45, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(r * 1.1, -r * 0.3); c.lineTo(r * 1.6, -r * 0.15); c.lineTo(r * 1.15, -r * 0.05); c.closePath(); c.fillStyle = shadeC(col, 0.15); c.fill(); stroke(c, lw * 0.8);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(r * 0.7 + s * r * 0.15, -r * 0.7); c.lineTo(r * 0.6 + s * r * 0.3, -r * 1.15); c.lineTo(r * 0.9 + s * r * 0.2, -r * 0.75); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, lw * 0.8); });
      eye(c, r * 0.85, -r * 0.5, r * 0.1, '#FF7A2E'); eye(c, r * 1.1, -r * 0.45, r * 0.08, '#FF7A2E');
      c.fillStyle = '#FFFFFF'; [[1.2, -0.08], [1.35, -0.12]].forEach(([x, y]) => { c.beginPath(); c.moveTo(r * x, r * y); c.lineTo(r * x + r * 0.06, r * y + r * 0.14); c.lineTo(r * x + r * 0.12, r * y); c.fill(); });
    },
    /* a fox with a fan of flame-tipped tails */
    kitsune(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, fl = Math.sin(ph * TAU), BLUE = '#5FD4FF';
      for (let i = 0; i < 5; i++) { const a = -2.2 + i * 0.45 + fl * 0.08, L = r * 1.35, x0 = -r * 0.6, y0 = r * 0.1, x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L;
        c.strokeStyle = LN; c.lineWidth = lw * 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 - r * 0.2, (y0 + y1) / 2, x1, y1); c.stroke(); c.strokeStyle = shadeC(col, 0.05); c.lineWidth = lw * 1.7; c.stroke();
        glowAt(c, x1, y1, r * 0.45, BLUE, 0.8); c.fillStyle = BLUE; c.beginPath(); c.moveTo(x1 - r * 0.14, y1 + r * 0.1); c.quadraticCurveTo(x1 - r * 0.05, y1 - r * 0.35, x1 + r * 0.05, y1 - r * 0.45); c.quadraticCurveTo(x1 + r * 0.1, y1 - r * 0.2, x1 + r * 0.14, y1 + r * 0.1); c.closePath(); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x1, y1 - r * 0.08, r * 0.07, 0, TAU); c.fill(); }
      [[-0.4, 0.85], [0.3, 0.85]].forEach(([x, y], i) => limb(c, x * r, r * 0.3, x * r + (i % 2 ? fl : -fl) * r * 0.12, y * r, lw * 1.4, shadeC(col, -0.12)));
      c.beginPath(); c.ellipse(-r * 0.05, r * 0.15, r * 0.85, r * 0.5, 0, 0, TAU); c.fillStyle = shade(c, col, r, 0, 0, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(r * 0.2, r * 0.35, r * 0.45, r * 0.25, 0, 0, TAU); c.fillStyle = '#FFF4E0'; c.fill();
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(r * 0.55 + s * r * 0.25, -r * 0.55); c.lineTo(r * 0.5 + s * r * 0.4, -r * 1.25); c.lineTo(r * 0.8 + s * r * 0.3, -r * 0.6); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, lw * 0.8); c.beginPath(); c.moveTo(r * 0.58 + s * r * 0.3, -r * 0.65); c.lineTo(r * 0.55 + s * r * 0.38, -r * 1.05); c.lineTo(r * 0.72 + s * r * 0.3, -r * 0.68); c.closePath(); c.fillStyle = '#FFB7C8'; c.fill(); });
      c.beginPath(); c.ellipse(r * 0.75, -r * 0.35, r * 0.55, r * 0.45, 0, 0, TAU); c.fillStyle = shade(c, col, r * 0.55, r * 0.75, -r * 0.4, 0.3); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(r * 1.05, -r * 0.3); c.quadraticCurveTo(r * 1.45, -r * 0.2, r * 1.2, 0); c.quadraticCurveTo(r * 0.95, -r * 0.05, r * 1.05, -r * 0.3); c.fillStyle = '#FFF4E0'; c.fill(); stroke(c, lw * 0.7);
      c.fillStyle = LN; c.beginPath(); c.arc(r * 1.36, -r * 0.18, r * 0.07, 0, TAU); c.fill();
      cuteFace(c, r * 0.72, -r * 0.45, r * 0.5, { angry: false, pupil: '#5FD4FF', er: 0.16, noMouth: true });
      c.fillStyle = '#FF4F7A'; c.beginPath(); c.arc(r * 0.78, -r * 0.95, r * 0.06, 0, TAU); c.fill();   // a flame mark on the brow
    },
    /* a young griffin: eagle in front, lion behind, wings beating */
    gryphling(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, fl = Math.sin(ph * TAU), GOLD = '#E8C96A';
      [-1, 1].forEach(s => { c.save(); c.translate(-r * 0.1, -r * 0.5); c.rotate(s * (-0.5 + fl * 0.55)); c.scale(1, s);
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-r * 0.5, -r * 1.3, -r * 1.7, -r * 1.25); c.lineTo(-r * 1.35, -r * 0.85); c.lineTo(-r * 1.55, -r * 0.6); c.lineTo(-r * 1.1, -r * 0.45); c.lineTo(-r * 1.2, -r * 0.15); c.quadraticCurveTo(-r * 0.5, -r * 0.25, 0, 0); c.closePath();
        c.fillStyle = vgrad(c, -r * 1.3, 0, '#F2E2B8', '#C9A24A'); c.fill(); stroke(c, lw); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw * 0.6; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-r * 0.3, -r * 0.1); c.lineTo(-r * (1.2 + k * 0.15), -r * (0.5 + k * 0.3)); c.stroke(); } c.restore(); });
      c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.85, r * 0.1); c.quadraticCurveTo(-r * 1.5, r * 0.0, -r * 1.45, -r * 0.6); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = lw * 1.2; c.stroke(); c.fillStyle = '#5A3A22'; c.beginPath(); c.arc(-r * 1.45, -r * 0.62, r * 0.14, 0, TAU); c.fill();
      [[-0.55, 0.85], [-0.1, 0.9], [0.45, 0.9]].forEach(([x, y], i) => limb(c, x * r, r * 0.3, x * r + (i % 2 ? fl : -fl) * r * 0.1, y * r, lw * 1.5, i < 2 ? '#D9B36B' : '#F2E2B8'));
      c.beginPath(); c.ellipse(-r * 0.15, r * 0.15, r * 0.9, r * 0.55, 0, 0, TAU); c.fillStyle = shade(c, col, r, 0, 0, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(r * 0.45, 0, r * 0.55, r * 0.5, 0, 0, TAU); c.fillStyle = shade(c, '#F2E2B8', r * 0.5, r * 0.45, 0, 0.3); c.fill(); stroke(c, lw);   // feathered chest
      c.beginPath(); c.ellipse(r * 0.75, -r * 0.5, r * 0.5, r * 0.45, 0, 0, TAU); c.fillStyle = shade(c, '#F7EFD8', r * 0.5, r * 0.75, -r * 0.55, 0.3); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(r * 1.1, -r * 0.6); c.quadraticCurveTo(r * 1.65, -r * 0.5, r * 1.5, -r * 0.2); c.quadraticCurveTo(r * 1.3, -r * 0.3, r * 1.1, -r * 0.35); c.closePath(); c.fillStyle = vgrad(c, -r * 0.6, -r * 0.2, '#FFD447', '#E09A2E'); c.fill(); stroke(c, lw * 0.8);
      c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(r * 1.12, -r * 0.42); c.lineTo(r * 1.45, -r * 0.35); c.stroke();
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(r * (0.45 + k * 0.15), -r * 0.9); c.lineTo(r * (0.5 + k * 0.15), -r * 1.2 - (k === 1 ? r * 0.1 : 0)); c.lineTo(r * (0.6 + k * 0.15), -r * 0.9); c.closePath(); c.fillStyle = '#F7EFD8'; c.fill(); stroke(c, lw * 0.7); }
      cuteFace(c, r * 0.8, -r * 0.6, r * 0.42, { angry: true, pupil: '#C9A24A', er: 0.17, noMouth: true });
    },
    /* a gargoyle: crouched grey stone, bat wings, horns, cracks with light in them */
    gargoyle(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, fl = Math.sin(ph * TAU) * 0.3, EMB = '#FF9F43';
      [-1, 1].forEach(s => { c.save(); c.translate(-r * 0.2, -r * 0.45); c.rotate(s * (-0.35 + fl * 0.3)); c.scale(1, s);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * 0.5, -r * 1.1); c.lineTo(-r * 1.0, -r * 1.25); c.quadraticCurveTo(-r * 1.3, -r * 0.7, -r * 1.55, -r * 0.5); c.quadraticCurveTo(-r * 1.2, -r * 0.35, -r * 1.3, -r * 0.05); c.quadraticCurveTo(-r * 0.8, -r * 0.1, -r * 0.6, r * 0.15); c.closePath();
        c.fillStyle = shade(c, shadeC(col, -0.15), r, -r * 0.6, -r * 0.5, 0.3); c.fill(); stroke(c, lw); c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * 1.0, -r * 1.2); c.moveTo(-r * 0.3, 0); c.lineTo(-r * 1.5, -r * 0.5); c.stroke(); c.restore(); });
      [[-0.55, 0.9], [0.45, 0.9]].forEach(([x, y]) => limb(c, x * r, r * 0.4, x * r - r * 0.05, y * r, lw * 2, shadeC(col, -0.05)));
      c.beginPath(); c.moveTo(-r * 1.0, r * 0.3); c.quadraticCurveTo(-r * 0.9, -r * 0.6, r * 0.1, -r * 0.65); c.quadraticCurveTo(r * 0.9, -r * 0.6, r * 0.95, r * 0.2); c.quadraticCurveTo(r * 0.6, r * 0.75, -r * 0.2, r * 0.7); c.quadraticCurveTo(-r * 0.9, r * 0.7, -r * 1.0, r * 0.3); c.closePath();
      c.fillStyle = shade(c, col, r, 0, -r * 0.1, 0.4); c.fill(); stroke(c, lw);
      c.save(); c.clip(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-r * 0.5, r * 0.1); c.lineTo(-r * 0.2, r * 0.35); c.lineTo(-r * 0.3, r * 0.6); c.moveTo(r * 0.3, -r * 0.3); c.lineTo(r * 0.5, 0); c.stroke(); c.strokeStyle = EMB; c.lineWidth = lw * 0.5; c.beginPath(); c.moveTo(-r * 0.5, r * 0.1); c.lineTo(-r * 0.2, r * 0.35); c.stroke(); c.restore();
      c.beginPath(); c.ellipse(r * 0.6, -r * 0.55, r * 0.55, r * 0.45, 0, 0, TAU); c.fillStyle = shade(c, col, r * 0.55, r * 0.6, -r * 0.6, 0.35); c.fill(); stroke(c, lw);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(r * 0.45 + s * r * 0.25, -r * 0.85); c.quadraticCurveTo(r * 0.4 + s * r * 0.45, -r * 1.3, r * 0.65 + s * r * 0.5, -r * 1.35); c.quadraticCurveTo(r * 0.55 + s * r * 0.45, -r * 1.05, r * 0.75 + s * r * 0.25, -r * 0.85); c.closePath(); c.fillStyle = shadeC(col, -0.25); c.fill(); stroke(c, lw * 0.8); });
      c.fillStyle = shadeC(col, -0.1); c.beginPath(); c.moveTo(r * 0.85, -r * 0.4); c.lineTo(r * 1.25, -r * 0.3); c.lineTo(r * 0.9, -r * 0.15); c.closePath(); c.fill(); stroke(c, lw * 0.8);
      eye(c, r * 0.5, -r * 0.6, r * 0.11, EMB); eye(c, r * 0.85, -r * 0.62, r * 0.1, EMB);
      c.fillStyle = '#FFFFFF'; [[0.7, -0.22], [0.85, -0.2], [1.0, -0.25]].forEach(([x, y]) => { c.beginPath(); c.moveTo(r * x, r * y); c.lineTo(r * x + r * 0.05, r * y + r * 0.13); c.lineTo(r * x + r * 0.1, r * y); c.fill(); });
    },
    /* a cinder salamander: a low lizard with embers in its hide and a crest of flame */
    salamander(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, st2 = Math.sin(ph * TAU);
      c.strokeStyle = LN; c.lineWidth = lw * 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.9, r * 0.2); c.quadraticCurveTo(-r * 1.6, r * 0.3 + st2 * r * 0.15, -r * 1.9, -r * 0.2); c.stroke(); c.strokeStyle = shadeC(col, -0.1); c.lineWidth = lw * 1.6; c.stroke();
      [[-0.6, 0.75], [0.5, 0.75]].forEach(([x, y], i) => { const s = i ? st2 : -st2; limb(c, x * r, r * 0.3, x * r - r * 0.35 + s * r * 0.15, y * r, lw * 1.3, shadeC(col, -0.1)); limb(c, x * r, r * 0.3, x * r + r * 0.35 - s * r * 0.15, y * r, lw * 1.3, shadeC(col, -0.1)); });
      c.beginPath(); c.ellipse(-r * 0.1, r * 0.2, r * 1.0, r * 0.5, 0, 0, TAU); c.fillStyle = shade(c, col, r, 0, 0, 0.35); c.fill(); stroke(c, lw);
      c.save(); c.clip(); for (let i = 0; i < 6; i++) { const x = -r * 0.8 + i * r * 0.3, y = r * (0.1 + (i % 2) * 0.25); glowAt(c, x, y, r * 0.3, '#FFD447', 0.5); c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(x, y, r * 0.07, 0, TAU); c.fill(); } c.restore();
      for (let i = 0; i < 5; i++) { const x = -r * 0.7 + i * r * 0.32, h = r * (0.35 + 0.15 * Math.sin(ph * TAU * 2 + i)); glowAt(c, x, -r * 0.4, r * 0.4, '#FF7A2E', 0.5); c.fillStyle = i % 2 ? '#FFB347' : '#FF6F3C'; c.beginPath(); c.moveTo(x - r * 0.12, -r * 0.25); c.quadraticCurveTo(x - r * 0.02, -r * 0.3 - h, x + r * 0.05, -r * 0.3 - h * 1.1); c.quadraticCurveTo(x + r * 0.08, -r * 0.5, x + r * 0.12, -r * 0.25); c.closePath(); c.fill(); }
      c.beginPath(); c.ellipse(r * 0.85, -r * 0.05, r * 0.6, r * 0.42, 0, 0, TAU); c.fillStyle = shade(c, col, r * 0.6, r * 0.85, -r * 0.1, 0.3); c.fill(); stroke(c, lw);
      c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(r * 0.95, r * 0.15); c.lineTo(r * 1.4, r * 0.1); c.stroke(); c.fillStyle = LN; c.beginPath(); c.arc(r * 1.35, -r * 0.1, r * 0.06, 0, TAU); c.fill();
      cuteFace(c, r * 0.8, -r * 0.2, r * 0.45, { angry: true, pupil: '#FFD447', er: 0.17, noMouth: true });
    },
    /* a sand naga: a hooded sorceress above, a coiled serpent below */
    naga(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sw = Math.sin(ph * TAU), SKIN = '#D9B37A', HOOD = '#8E3F68';
      // the coils
      c.strokeStyle = LN; c.lineWidth = lw * 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.1, r * 0.55); c.bezierCurveTo(-r * 1.2, r * 0.3, -r * 1.3, r * 1.1 + sw * r * 0.05, -r * 0.2, r * 0.95); c.bezierCurveTo(r * 0.6, r * 0.85, r * 0.9, r * 0.5, r * 1.4, r * 0.25 + sw * r * 0.1); c.stroke(); c.strokeStyle = shadeC(col, -0.05); c.lineWidth = lw * 2.4; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw * 0.6; for (let i = 0; i < 7; i++) { const x = -r * 1.0 + i * r * 0.38; c.beginPath(); c.moveTo(x, r * 0.75); c.lineTo(x + r * 0.1, r * 1.05); c.stroke(); }
      c.fillStyle = shadeC(col, 0.25); c.beginPath(); c.moveTo(r * 1.4, r * 0.25 + sw * r * 0.1); c.lineTo(r * 1.75, r * 0.05 + sw * r * 0.1); c.lineTo(r * 1.5, r * 0.4 + sw * r * 0.1); c.closePath(); c.fill(); stroke(c, lw * 0.7);
      // torso and arms
      c.beginPath(); c.ellipse(0, -r * 0.05, r * 0.42, r * 0.62, 0, 0, TAU); c.fillStyle = shade(c, SKIN, r * 0.5, 0, -r * 0.1, 0.3); c.fill(); stroke(c, lw);
      c.fillStyle = HOOD; c.beginPath(); c.ellipse(0, r * 0.25, r * 0.45, r * 0.3, 0, 0, TAU); c.fill(); stroke(c, lw * 0.8);
      limb(c, -r * 0.3, -r * 0.35, -r * 0.75, r * 0.1 + sw * r * 0.05, lw * 1.3, SKIN); limb(c, r * 0.3, -r * 0.35, r * 0.8, -r * 0.55 - sw * r * 0.1, lw * 1.3, SKIN);
      glowAt(c, r * 0.85, -r * 0.7 - sw * r * 0.1, r * 0.4, '#9BE07A', 0.8); c.fillStyle = '#C8F05A'; c.beginPath(); c.arc(r * 0.85, -r * 0.7 - sw * r * 0.1, r * 0.12, 0, TAU); c.fill();
      // the hood and face
      c.beginPath(); c.moveTo(-r * 0.75, -r * 0.5); c.quadraticCurveTo(-r * 0.6, -r * 1.5, 0, -r * 1.4); c.quadraticCurveTo(r * 0.6, -r * 1.5, r * 0.75, -r * 0.5); c.quadraticCurveTo(r * 0.3, -r * 0.3, 0, -r * 0.3); c.quadraticCurveTo(-r * 0.3, -r * 0.3, -r * 0.75, -r * 0.5); c.closePath(); c.fillStyle = shade(c, HOOD, r * 0.7, 0, -r * 0.9, 0.35); c.fill(); stroke(c, lw);
      c.fillStyle = '#FFE37A'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-r * 0.4 + i * r * 0.2, -r * 1.15 + Math.abs(i - 2) * r * 0.08, r * 0.045, 0, TAU); c.fill(); }
      c.beginPath(); c.ellipse(r * 0.05, -r * 0.75, r * 0.32, r * 0.3, 0, 0, TAU); c.fillStyle = SKIN; c.fill(); stroke(c, lw * 0.8);
      cuteFace(c, r * 0.08, -r * 0.8, r * 0.34, { angry: false, pupil: '#C8F05A', er: 0.18, noMouth: true }); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-r * 0.05, -r * 0.6); c.lineTo(r * 0.12, -r * 0.6); c.stroke();
    },
    /* a prism sprite: a tiny fairy with wings of cut glass that split the light */
    prism(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, fl = Math.sin(ph * TAU);
      [-1, 1].forEach(s => { c.save(); c.translate(-r * 0.15, -r * 0.2); c.scale(1, s); c.rotate(-0.2 + fl * 0.35);
        [['#FF9BD2', -1.5, -0.9, 0.9], ['#5FD4FF', -1.4, -0.1, 0.6], ['#FFE37A', -1.1, -1.3, 0.5]].forEach(([cc, x, y, k]) => { c.globalAlpha = 0.65; c.beginPath(); c.moveTo(0, 0); c.lineTo(r * x, r * y); c.lineTo(r * (x + k * 0.6), r * (y + k * 0.7)); c.closePath(); c.fillStyle = cc; c.fill(); c.globalAlpha = 1; c.lineWidth = lw * 0.6; c.strokeStyle = 'rgba(255,255,255,.7)'; c.stroke(); });
        c.restore(); });
      glowAt(c, 0, 0, r * 1.4, col, 0.5);
      c.beginPath(); c.ellipse(0, r * 0.1, r * 0.52, r * 0.6, 0, 0, TAU); c.fillStyle = shade(c, col, r * 0.6, 0, 0, 0.4); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-r * 0.3, r * 0.45); c.lineTo(0, r * 0.95); c.lineTo(r * 0.3, r * 0.45); c.closePath(); c.fillStyle = shadeC(col, 0.2); c.fill(); stroke(c, lw * 0.8);   // a crystal skirt
      c.beginPath(); c.arc(r * 0.05, -r * 0.5, r * 0.5, 0, TAU); c.fillStyle = shade(c, '#FFF4E0', r * 0.5, r * 0.05, -r * 0.55, 0.25); c.fill(); stroke(c, lw);
      c.fillStyle = shadeC(col, -0.1); c.beginPath(); c.moveTo(-r * 0.45, -r * 0.6); c.quadraticCurveTo(-r * 0.2, -r * 1.3, r * 0.3, -r * 1.05); c.lineTo(r * 0.15, -r * 1.3); c.lineTo(r * 0.45, -r * 0.9); c.quadraticCurveTo(r * 0.5, -r * 0.6, r * 0.45, -r * 0.55); c.quadraticCurveTo(0, -r * 0.75, -r * 0.45, -r * 0.6); c.closePath(); c.fill(); stroke(c, lw * 0.8);
      cuteFace(c, r * 0.1, -r * 0.45, r * 0.42, { angry: false, pupil: '#B983F5', er: 0.19, noMouth: false });
      for (let i = 0; i < 3; i++) { const a = ph * TAU + i * 2.1, x = Math.cos(a) * r * 1.1, y = Math.sin(a) * r * 0.5 - r * 0.3; c.fillStyle = ['#FF9BD2', '#5FD4FF', '#FFE37A'][i]; c.beginPath(); c.moveTo(x, y - r * 0.12); c.lineTo(x + r * 0.1, y); c.lineTo(x, y + r * 0.12); c.lineTo(x - r * 0.1, y); c.closePath(); c.fill(); }
    },
    /* a frost wendigo: gaunt, antlered, too tall, with a hunger that shows */
    wendigo(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, st2 = Math.sin(ph * TAU), ICE = '#8FE8FF';
      [[-0.35, 1.0], [0.3, 1.0]].forEach(([x, y], i) => limb(c, x * r, r * 0.25, x * r + (i % 2 ? st2 : -st2) * r * 0.18, y * r, lw * 1.3, shadeC(col, -0.2)));
      limb(c, -r * 0.45, -r * 0.55, -r * 1.05, r * 0.4 - st2 * r * 0.1, lw * 1.2, shadeC(col, -0.15)); limb(c, r * 0.45, -r * 0.55, r * 1.15, r * 0.35 + st2 * r * 0.1, lw * 1.2, shadeC(col, -0.15));
      c.fillStyle = LN; [[-1.05, 0.4 - st2 * 0.1], [1.15, 0.35 + st2 * 0.1]].forEach(([x, y]) => { for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(r * x, r * y); c.lineTo(r * x + k * r * 0.12, r * y + r * 0.3); c.lineTo(r * x + k * r * 0.12 + r * 0.05, r * y + r * 0.05); c.fill(); } });
      c.beginPath(); c.moveTo(-r * 0.55, -r * 0.75); c.quadraticCurveTo(-r * 0.75, r * 0.2, -r * 0.3, r * 0.5); c.lineTo(r * 0.3, r * 0.5); c.quadraticCurveTo(r * 0.75, r * 0.2, r * 0.55, -r * 0.75); c.quadraticCurveTo(0, -r * 0.95, -r * 0.55, -r * 0.75); c.closePath(); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.3); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw * 0.7; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-r * 0.4, -r * 0.4 + i * r * 0.2); c.quadraticCurveTo(0, -r * 0.3 + i * r * 0.2, r * 0.4, -r * 0.4 + i * r * 0.2); c.stroke(); }   // ribs
      // antlers
      [-1, 1].forEach(s => { c.strokeStyle = LN; c.lineWidth = lw * 1.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(s * r * 0.25, -r * 1.15); c.lineTo(s * r * 0.55, -r * 1.6); c.lineTo(s * r * 0.95, -r * 1.75); c.moveTo(s * r * 0.55, -r * 1.6); c.lineTo(s * r * 0.5, -r * 2.0); c.moveTo(s * r * 0.75, -r * 1.68); c.lineTo(s * r * 0.9, -r * 2.05); c.stroke(); c.strokeStyle = '#D8C8A8'; c.lineWidth = lw * 0.9; c.stroke(); });
      c.beginPath(); c.ellipse(0, -r * 1.0, r * 0.45, r * 0.5, 0, 0, TAU); c.fillStyle = shade(c, shadeC(col, -0.05), r * 0.5, 0, -r * 1.05, 0.3); c.fill(); stroke(c, lw);
      c.fillStyle = '#2B2433'; c.beginPath(); c.ellipse(0, -r * 0.72, r * 0.26, r * 0.12, 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * r * 0.1, -r * 0.8); c.lineTo(k * r * 0.1 + r * 0.04, -r * 0.65); c.lineTo(k * r * 0.1 + r * 0.08, -r * 0.8); c.fill(); }
      eye(c, -r * 0.17, -r * 1.08, r * 0.1, ICE); eye(c, r * 0.17, -r * 1.08, r * 0.1, ICE);
      c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(-r * 0.32, -r * 1.3); c.lineTo(-r * 0.05, -r * 1.2); c.moveTo(r * 0.32, -r * 1.3); c.lineTo(r * 0.05, -r * 1.2); c.stroke();
    },
    /* a mimic: a treasure chest with a tongue, teeth and far too many eyes */
    mimic(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, op = 0.55 + 0.45 * Math.sin(ph * TAU) * 0.5, WOOD = col, BRASS = '#E8C96A';
      [[-0.55, 0.95], [0.5, 0.95]].forEach(([x, y]) => limb(c, x * r, r * 0.5, x * r, y * r, lw * 1.4, '#5A3A2A'));
      // the box
      c.beginPath(); c.rect(-r * 0.95, -r * 0.2, r * 1.9, r * 0.95); c.fillStyle = shade(c, WOOD, r, 0, r * 0.2, 0.3); c.fill(); stroke(c, lw);
      c.fillStyle = BRASS; c.fillRect(-r * 0.95, -r * 0.2, r * 1.9, r * 0.12); c.fillRect(-r * 0.95, r * 0.6, r * 1.9, r * 0.12); c.fillRect(-r * 0.12, -r * 0.2, r * 0.24, r * 0.95); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(-r * 0.12, -r * 0.2, r * 0.24, r * 0.95);
      // the mouth: dark inside, a tongue, teeth along both jaws
      c.fillStyle = '#3A1830'; c.beginPath(); c.moveTo(-r * 0.9, -r * 0.2); c.lineTo(r * 0.9, -r * 0.2); c.lineTo(r * 0.85, -r * 0.2 - r * 0.45 * op); c.lineTo(-r * 0.85, -r * 0.2 - r * 0.45 * op); c.closePath(); c.fill();
      c.fillStyle = '#FF5C8A'; c.beginPath(); c.moveTo(r * 0.1, -r * 0.2); c.quadraticCurveTo(r * 0.7, -r * 0.1, r * 1.1, r * 0.2); c.quadraticCurveTo(r * 0.8, r * 0.25, r * 0.5, -r * 0.05); c.closePath(); c.fill(); stroke(c, lw * 0.7);
      c.fillStyle = '#FFFFFF'; for (let i = 0; i < 7; i++) { const x = -r * 0.8 + i * r * 0.27; c.beginPath(); c.moveTo(x, -r * 0.2); c.lineTo(x + r * 0.08, -r * 0.42); c.lineTo(x + r * 0.16, -r * 0.2); c.fill(); }
      // the lid, open
      c.save(); c.translate(0, -r * 0.2 - r * 0.45 * op); c.beginPath(); c.moveTo(-r * 0.95, 0); c.lineTo(r * 0.95, 0); c.lineTo(r * 0.95, -r * 0.3); c.quadraticCurveTo(0, -r * 0.7, -r * 0.95, -r * 0.3); c.closePath(); c.fillStyle = shade(c, WOOD, r, 0, -r * 0.3, 0.3); c.fill(); stroke(c, lw);
      c.fillStyle = BRASS; c.fillRect(-r * 0.95, -r * 0.08, r * 1.9, r * 0.08); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 6; i++) { const x = -r * 0.7 + i * r * 0.28; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + r * 0.08, r * 0.22); c.lineTo(x + r * 0.16, 0); c.fill(); }
      [[-0.5, -0.32, 0.11], [0, -0.42, 0.14], [0.5, -0.32, 0.11], [-0.25, -0.2, 0.07], [0.3, -0.2, 0.07]].forEach(([x, y, er]) => { c.fillStyle = '#FFF4C2'; c.beginPath(); c.arc(r * x, r * y, r * er, 0, TAU); c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = LN; c.stroke(); c.fillStyle = '#C8352E'; c.beginPath(); c.arc(r * x + r * er * 0.2, r * y + r * er * 0.1, r * er * 0.55, 0, TAU); c.fill(); c.fillStyle = LN; c.beginPath(); c.arc(r * x + r * er * 0.2, r * y + r * er * 0.1, r * er * 0.25, 0, TAU); c.fill(); });
      c.restore();
      // a few coins spilling out
      c.fillStyle = '#FFD447'; [[-0.6, -0.3], [0.7, -0.35], [0.2, -0.5]].forEach(([x, y]) => { c.beginPath(); c.ellipse(r * x, r * y, r * 0.11, r * 0.07, 0, 0, TAU); c.fill(); c.lineWidth = lw * 0.5; c.strokeStyle = '#B88A1E'; c.stroke(); });
    },
  });
  Object.assign(EXT, { shade: 1.7, umbra: 1.9, kitsune: 2.0, gryphling: 2.0, gargoyle: 1.9, salamander: 2.0, naga: 1.9, prism: 1.8, wendigo: 2.3, mimic: 1.6 });
  Object.assign(NF, { shade: 6, umbra: 4, kitsune: 4, gryphling: 6, gargoyle: 4, salamander: 4, naga: 6, prism: 6, wendigo: 4, mimic: 6 });

  /* ---------- behaviour ---------- */
  const { mon, keepRange, chaseHit } = DunAI;
  Object.assign(mon, {
    shade(m, A, X) {
      // drifts through walls, fades out and reappears behind you, then bursts
      if (m.charge > 0) { m.charge -= A.dt; if (m.charge <= 0) { for (let i = 0; i < 7; i++) X.eshot(m.x, m.y, i / 7 * TAU + m.t, 3.4, { dmg: m.dmg, color: '#B983F5', core: '#FFFFFF' }); X.ring(m.x, m.y, 0.2, 1.4, 0.3, '#B983F5'); } return; }
      A.steer(A.sp * (0.75 + 0.25 * Math.sin(m.t * 2.3)));
      if (m.cd <= 0 && A.d < 7 && A.los()) { m.cd = 3.2 + Math.random(); m.charge = 0.55; X.warn({ x: m.x, y: m.y, r: 0.95, life: 0.55, max: 0.55, src: m, follow: m, color: '#B983F5' }); }
    },
    umbra: mon.wolf,
    kitsune(m, A, X) {
      keepRange(m, A, X, 3.2, 6.5);
      if (m.cd <= 0 && A.d < 9 && A.los()) { m.cd = 2.4 + Math.random(); for (let i = 0; i < 2; i++) X.lob(m.x, m.y - 0.3, X.me.x + (i ? (Math.random() - 0.5) * 2.6 : 0), X.me.y + (i ? (Math.random() - 0.5) * 2.6 : 0), { dur: 0.9, r: 1.0, dmg: m.dmg * 0.9, kind: 'fire', fire: 2.4, src: m }); }
    },
    gryphling: mon.harpy,
    gargoyle(m, A, X) {
      // stone until you come near; then a golem's charge and slam, with a leap to close the gap
      if (!m.woke) { if (A.d < 4.2 && A.los()) { m.woke = true; m.cd = 0.6; X.text(m.x, m.y - m.r - 0.6, 'It wakes!', '#CFC6E0', 12); X.shake(3, 0.1); } else { m.face = A.dx >= 0 ? 1 : -1; return; } }
      mon.golem(m, A, X);
    },
    salamander(m, A, X) {
      A.steer(A.sp * (A.d < 3.5 ? 1.35 : 1)); chaseHit(m, A, X, 1.1);
      m.trailT = (m.trailT || 0) - A.dt; if (m.trailT <= 0 && m.moved) { m.trailT = 0.42; X.zone({ kind: 'efire', x: m.x, y: m.y, r: 0.55, life: 2.0, max: 2.0, dps: m.dmg * 0.6, tick: 0, own: 'enemy' }); }
    },
    naga(m, A, X) {
      keepRange(m, A, X, 2.6, 5.5);
      if (m.cd <= 0 && A.d < 8 && A.los()) { m.cd = 2.8 + Math.random(); X.lob(m.x, m.y - 0.5, X.me.x, X.me.y, { dur: 0.85, r: 1.1, dmg: m.dmg * 0.9, kind: 'poison', src: m }); }
    },
    prism: mon.frost,
    wendigo(m, A, X) { A.steer(A.sp * (A.d < 4 ? 1.25 : 1)); chaseHit(m, A, X, 1.25); if (A.d < 1.6 && Math.random() < 0.01) X.say(m, 'hungry...'); },
    mimic(m, A, X) {
      if (!m.woke) { if (A.d < 2.6 || m.hp < m.maxhp) { m.woke = true; m.cd = 0.4; X.text(m.x, m.y - m.r - 0.6, 'A MIMIC!', '#FFD447', 13); X.shake(3, 0.1); } else { m.face = A.dx >= 0 ? 1 : -1; return; } }
      A.steer(A.sp * 1.1); chaseHit(m, A, X, 1.3);
    },
  });
})();
