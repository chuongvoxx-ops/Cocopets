/* ---------- Dungeon art: shaded monster sprites, props, tiles, backdrops and bosses.
   Everything that doesn't change frame to frame is painted once into small canvases and reused. ---------- */
const DunArt = (() => {
  const LN = '#2B2433';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const rgba = (hex, a) => { const [r, g, b] = hexRGB(hex); return `rgba(${r},${g},${b},${a})`; };
  const lwOf = r => Math.max(1.2, Math.min(3.2, r * 0.11));
  const th = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + (s | 0) * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function shade(c, base, r, ox, oy, k) {
    ox = ox || 0; oy = oy || 0; k = k == null ? 0.4 : k;
    const g = c.createRadialGradient(ox - r * 0.35, oy - r * 0.45, r * 0.06, ox, oy, r * 1.25);
    g.addColorStop(0, shadeC(base, k)); g.addColorStop(0.5, base); g.addColorStop(1, shadeC(base, -k)); return g;
  }
  const vgrad = (c, y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  function spec(c, x, y, rx, ry, a) { c.globalAlpha = a == null ? 0.45 : a; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), -0.6, 0, 6.283); c.fill(); c.globalAlpha = 1; }
  const stroke = (c, w) => { c.lineWidth = w; c.strokeStyle = LN; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  /* a scheming face: lidded eyes (the right brow cocked), and a crooked fanged grin. s ~ face width */
  function face(c, cx, cy, s, o) {
    o = o || {};
    const lw = Math.max(1.1, s * 0.09);
    [[cx - s * 0.34, cy - s * 0.08, s * 0.21, 0], [cx + s * 0.32, cy - s * 0.1, s * 0.19, 1]].forEach(([ex, ey, er, k]) => {
      c.beginPath(); c.ellipse(ex, ey, er, er * (o.tall || 1), 0, 0, 6.283); c.fillStyle = o.sclera || '#FFF4C2'; c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = LN; c.stroke();
      c.fillStyle = o.pupil || LN; c.beginPath(); c.arc(ex + er * 0.22, ey + er * 0.15, er * (o.pr || 0.5), 0, 6.283); c.fill();
      if (o.pupil && o.pupil !== LN) { c.fillStyle = LN; c.beginPath(); c.ellipse(ex + er * 0.22, ey + er * 0.15, er * 0.14, er * 0.38, 0, 0, 6.283); c.fill(); }
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex + er * 0.06, ey - er * 0.08, er * 0.17, 0, 6.283); c.fill();
      if (o.lid !== false) {
        const inX = ex + (k ? -1 : 1) * er * 1.3, outX = ex - (k ? -1 : 1) * er * 1.3, hi = k ? s * 0.06 : 0;
        c.save(); c.beginPath(); c.ellipse(ex, ey, er + 0.5, er * (o.tall || 1) + 0.5, 0, 0, 6.283); c.clip();
        c.beginPath(); c.moveTo(inX, ey - er * 1.7); c.lineTo(inX, ey - er * 0.05 - hi); c.lineTo(outX, ey - er * 0.72 - hi); c.lineTo(outX, ey - er * 1.7); c.closePath();
        c.fillStyle = o.lid || '#5A4E8C'; c.fill(); c.restore();
      }
    });
    if (!o.noBrow) { c.strokeStyle = LN; c.lineWidth = lw * 1.15; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - s * 0.6, cy - s * 0.36); c.lineTo(cx - s * 0.13, cy - s * 0.13); c.moveTo(cx + s * 0.56, cy - s * 0.45); c.lineTo(cx + s * 0.12, cy - s * 0.17); c.stroke(); }
    // rosy cheeks: even the troublemakers are cute
    if (!o.noBlush && s > 5) { c.fillStyle = 'rgba(255,120,160,.42)'; c.beginPath(); c.ellipse(cx - s * 0.52, cy + s * 0.14, s * 0.15, s * 0.085, 0, 0, 6.283); c.ellipse(cx + s * 0.5, cy + s * 0.12, s * 0.15, s * 0.085, 0, 0, 6.283); c.fill(); }
    if (o.noMouth) return;
    const mx = cx + s * 0.02, my = cy + s * (o.my || 0.27);
    c.beginPath(); c.moveTo(mx - s * 0.36, my - s * 0.03); c.quadraticCurveTo(mx, my + s * 0.06, mx + s * 0.42, my - s * 0.12);
    c.quadraticCurveTo(mx + s * 0.27, my + s * 0.36, mx - s * 0.02, my + s * 0.32); c.quadraticCurveTo(mx - s * 0.27, my + s * 0.28, mx - s * 0.36, my - s * 0.03); c.closePath();
    c.fillStyle = '#3A1830'; c.fill();
    c.save(); c.clip();
    c.fillStyle = '#FF7FA8'; c.beginPath(); c.ellipse(mx + s * 0.1, my + s * 0.33, s * 0.17, s * 0.11, -0.3, 0, 6.283); c.fill();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(mx - s * 0.25, my - s * 0.04); c.lineTo(mx - s * 0.16, my + s * 0.14); c.lineTo(mx - s * 0.08, my - s * 0.01); c.closePath();
    c.moveTo(mx + s * 0.16, my - s * 0.06); c.lineTo(mx + s * 0.24, my + s * 0.1); c.lineTo(mx + s * 0.31, my - s * 0.1); c.closePath(); c.fill();
    c.restore();
    c.lineWidth = lw * 0.75; c.strokeStyle = LN; c.stroke();
  }
  function crown(c, x, y, s) {
    c.beginPath(); c.moveTo(x - s * 0.5, y); c.lineTo(x - s * 0.62, y - s * 0.6); c.lineTo(x - s * 0.24, y - s * 0.32); c.lineTo(x, y - s * 0.74); c.lineTo(x + s * 0.24, y - s * 0.32); c.lineTo(x + s * 0.62, y - s * 0.6); c.lineTo(x + s * 0.5, y); c.closePath();
    c.fillStyle = vgrad(c, y - s * 0.7, y, '#FFF0A0', '#F2B61F'); c.fill(); stroke(c, Math.max(1.4, s * 0.1));
    c.fillStyle = '#FF5C8A'; c.beginPath(); c.arc(x, y - s * 0.16, s * 0.1, 0, 6.283); c.fill();
  }

  /* ---------- monster painters: drawn facing right, centred on the body, r = body radius in pixels ---------- */
  const MP = {
    blob(c, r, ph, o) { GFX.gloomy(c, 0, 0, r, { color: o.color, t: ph * 0.8976, lookX: 0.7, seed: 0 }); },
    bat(c, r, ph, o) {
      const lw = lwOf(r), fl = Math.sin(ph * 6.283), col = o.color;
      [-1, 1].forEach(s => {
        c.save(); c.scale(s, 1);
        const up = fl * 0.75, tx = r * 2.05, ty = -r * (0.5 + up);
        c.beginPath(); c.moveTo(r * 0.45, -r * 0.3);
        c.quadraticCurveTo(r * 1.1, -r * (1.05 + up * 0.8), tx, ty);
        const p1y = ty + r * 0.8, p2y = ty + r * 0.95 - up * r * 0.25;
        c.quadraticCurveTo(r * 1.9, ty + r * 0.5, r * 1.72, p1y);
        c.quadraticCurveTo(r * 1.45, p1y - r * 0.12, r * 1.15, p2y);
        c.quadraticCurveTo(r * 0.85, p2y - r * 0.12, r * 0.55, r * 0.3);
        c.closePath();
        c.fillStyle = vgrad(c, -r * 1.4, r * 0.5, shadeC(col, -0.05), shadeC(col, -0.5)); c.fill(); stroke(c, lw);
        c.lineWidth = lw * 0.55; c.strokeStyle = rgba('#000000', 0.35); c.beginPath(); c.moveTo(r * 0.6, -r * 0.2); c.lineTo(r * 1.72, p1y); c.moveTo(r * 0.6, -r * 0.2); c.lineTo(r * 1.15, p2y); c.stroke();
        c.restore();
      });
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * r * 0.22, -r * 0.62); c.lineTo(s * r * 0.5, -r * 1.28); c.lineTo(s * r * 0.72, -r * 0.42); c.closePath(); c.fillStyle = shadeC(col, -0.1); c.fill(); stroke(c, lw); c.beginPath(); c.moveTo(s * r * 0.36, -r * 0.62); c.lineTo(s * r * 0.5, -r * 1.02); c.lineTo(s * r * 0.6, -r * 0.6); c.closePath(); c.fillStyle = '#FF9BC8'; c.fill(); });
      c.beginPath(); c.arc(0, 0, r * 0.84, 0, 6.283); c.fillStyle = shade(c, col, r); c.fill(); stroke(c, lw);
      for (let i = 0; i < 5; i++) { const a = -2.5 + i * 0.25; c.beginPath(); c.moveTo(Math.cos(a - 0.1) * r * 0.8, Math.sin(a - 0.1) * r * 0.8); c.lineTo(Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0); c.lineTo(Math.cos(a + 0.1) * r * 0.8, Math.sin(a + 0.1) * r * 0.8); c.fillStyle = col; c.fill(); }
      spec(c, -r * 0.35, -r * 0.42, r * 0.16, r * 0.1);
      face(c, r * 0.04, r * 0.06, r * 0.9, { lid: shadeC(col, -0.15), sclera: '#FFE36B' });
    },
    spore(c, r, ph, o) {
      const lw = lwOf(r), bob = Math.sin(ph * 6.283) * r * 0.06, col = o.color;
      c.beginPath(); c.moveTo(-r * 0.62, -r * 0.05); c.quadraticCurveTo(-r * 0.8, r * 0.95, 0, r * 0.98); c.quadraticCurveTo(r * 0.8, r * 0.95, r * 0.62, -r * 0.05); c.closePath();
      c.fillStyle = shade(c, '#F2E6D8', r * 0.8, 0, r * 0.4, 0.25); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-r * 1.15, -r * 0.05 + bob); c.bezierCurveTo(-r * 1.2, -r * 1.25 + bob, r * 1.2, -r * 1.25 + bob, r * 1.15, -r * 0.05 + bob); c.quadraticCurveTo(0, r * 0.25 + bob, -r * 1.15, -r * 0.05 + bob); c.closePath();
      c.fillStyle = shade(c, col, r * 1.1, 0, -r * 0.4 + bob); c.fill(); stroke(c, lw);
      c.fillStyle = '#FFFFFF'; [[-0.55, -0.55, 0.16], [0.15, -0.78, 0.13], [0.62, -0.42, 0.14], [-0.15, -0.35, 0.09]].forEach(([a, b, s]) => { c.beginPath(); c.ellipse(a * r, b * r + bob, s * r, s * r * 0.8, 0, 0, 6.283); c.fill(); });
      spec(c, -r * 0.6, -r * 0.75 + bob, r * 0.18, r * 0.08, 0.35);
      face(c, r * 0.02, r * 0.4, r * 0.82, { lid: '#D9C7B3', my: 0.24 });
    },
    toad(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, pulse = 0.5 + 0.5 * Math.sin(ph * 6.283);
      [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * r * 0.85, r * 0.62, r * 0.42, r * 0.22, s * 0.3, 0, 6.283); c.fillStyle = shadeC(col, -0.2); c.fill(); stroke(c, lw); });
      c.beginPath(); c.ellipse(0, r * 0.12, r * 1.18, r * 0.84, 0, 0, 6.283); c.fillStyle = shade(c, col, r * 1.1, 0, r * 0.1); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(0, r * 0.48, r * 0.75, r * 0.38, 0, 0, 6.283); c.fillStyle = shadeC(col, 0.45); c.fill();
      c.beginPath(); c.ellipse(r * 0.05, r * 0.42, r * (0.32 + pulse * 0.14), r * (0.2 + pulse * 0.1), 0, 0, 6.283); c.fillStyle = '#F7E3B5'; c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = LN; c.stroke();
      c.fillStyle = shadeC(col, -0.3); [[-0.7, -0.15, 0.1], [-0.35, -0.42, 0.08], [0.6, -0.25, 0.09], [0.85, 0.15, 0.07], [-0.85, 0.3, 0.07]].forEach(([a, b, s]) => { c.beginPath(); c.arc(a * r, b * r, s * r, 0, 6.283); c.fill(); });
      [-1, 1].forEach(s => {
        const ex = s * r * 0.45, ey = -r * 0.62, er = r * 0.32;
        c.beginPath(); c.arc(ex, ey, er, 0, 6.283); c.fillStyle = shade(c, col, er, ex, ey); c.fill(); stroke(c, lw);
        c.beginPath(); c.arc(ex, ey + er * 0.05, er * 0.68, 0, 6.283); c.fillStyle = '#FFE36B'; c.fill(); c.lineWidth = lw * 0.5; c.stroke();
        c.fillStyle = LN; c.beginPath(); c.ellipse(ex + er * 0.15, ey + er * 0.1, er * 0.42, er * 0.2, 0, 0, 6.283); c.fill();
        c.save(); c.beginPath(); c.arc(ex, ey + er * 0.05, er * 0.7, 0, 6.283); c.clip(); c.fillStyle = shadeC(col, -0.1); c.fillRect(ex - er, ey - er, er * 2, er * (s < 0 ? 0.95 : 0.8)); c.restore();
        c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(ex - er * 0.75, ey - er * (s < 0 ? 0.05 : 0.2)); c.lineTo(ex + er * 0.75, ey + er * (s < 0 ? -0.2 : -0.05)); c.stroke();
      });
      c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(-r * 0.8, r * 0.05); c.quadraticCurveTo(0, r * 0.35, r * 0.85, -r * 0.08); c.stroke();
      c.beginPath(); c.ellipse(r * 0.7, r * 0.13, r * 0.16, r * 0.1, 0.4, 0, 6.283); c.fillStyle = '#FF7FA8'; c.fill(); c.lineWidth = lw * 0.6; c.stroke();
      spec(c, -r * 0.55, -r * 0.2, r * 0.2, r * 0.1, 0.3);
    },
    roller(c, r, ph, o) {
      const lw = lwOf(r), col = o.color;
      if (o.mode === 'ball') {
        c.beginPath();
        for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, a2 = a + 6.283 / 28; c.lineTo(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12); c.lineTo(Math.cos(a2) * r * 0.82, Math.sin(a2) * r * 0.82); }
        c.closePath(); c.fillStyle = shade(c, shadeC(col, -0.15), r); c.fill(); stroke(c, lw);
        c.beginPath(); c.arc(0, 0, r * 0.62, 0, 6.283); c.fillStyle = shade(c, shadeC(col, 0.2), r * 0.6); c.fill(); stroke(c, lw * 0.7);
        c.strokeStyle = rgba('#000000', 0.3); c.lineWidth = lw * 0.6; c.beginPath(); c.arc(0, 0, r * 0.4, 0.3, 2.6); c.stroke();
        return;
      }
      [-0.5, 0.15, 0.6].forEach(x => { c.beginPath(); c.ellipse(x * r, r * 0.72, r * 0.16, r * 0.12, 0, 0, 6.283); c.fillStyle = shadeC(col, -0.35); c.fill(); stroke(c, lw * 0.7); });
      c.beginPath();
      const n = 15;
      c.moveTo(-r * 1.05, r * 0.55);
      for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI, rr = i % 2 ? r * 0.9 : r * 1.32, wob = i % 2 ? 0 : 0.06; c.lineTo(Math.cos(a + wob) * rr * 1.02, Math.sin(a + wob) * rr * 0.95 + r * 0.3); }
      c.lineTo(r * 1.05, r * 0.55); c.closePath();
      c.fillStyle = shade(c, shadeC(col, -0.12), r * 1.1, 0, -r * 0.1); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(r * 0.62, r * 0.25, r * 0.48, r * 0.38, 0, 0, 6.283); c.fillStyle = shade(c, '#E9C9A0', r * 0.5, r * 0.62, r * 0.25, 0.25); c.fill(); stroke(c, lw * 0.8);
      c.fillStyle = LN; c.beginPath(); c.arc(r * 1.06, r * 0.26, r * 0.08, 0, 6.283); c.fill();
      face(c, r * 0.6, r * 0.18, r * 0.42, { lid: '#D9B48A', noMouth: true });
      c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(r * 0.5, r * 0.46); c.quadraticCurveTo(r * 0.75, r * 0.52, r * 0.92, r * 0.38); c.stroke();
    },
    bomb(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sp = 0.6 + 0.4 * Math.sin(ph * 6.283 * 2);
      c.strokeStyle = LN; c.lineWidth = lw * 1.4; c.beginPath(); c.moveTo(r * 0.2, -r * 0.85); c.quadraticCurveTo(r * 0.6, -r * 1.4, r * 0.35, -r * 1.65); c.stroke();
      c.strokeStyle = '#C9A27A'; c.lineWidth = lw * 0.7; c.stroke();
      c.fillStyle = '#FFE37A'; c.globalAlpha = 0.9; GFX.star(c, r * 0.35, -r * 1.68, r * 0.32 * sp, '#FFE37A', 0); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(r * 0.35, -r * 1.68, r * 0.09, 0, 6.283); c.fill(); c.globalAlpha = 1;
      c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fillStyle = shade(c, col, r); c.fill(); stroke(c, lw);
      c.beginPath(); c.rect(-r * 0.25, -r * 1.05, r * 0.5, r * 0.25); c.fillStyle = '#7A7A8C'; c.fill(); stroke(c, lw * 0.8);
      spec(c, -r * 0.4, -r * 0.45, r * 0.22, r * 0.12);
      face(c, r * 0.06, r * 0.12, r * 0.95, { lid: shadeC(col, -0.15) });
    },
    splitter(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, w = 1 + Math.sin(ph * 6.283) * 0.07, h = 1 - Math.sin(ph * 6.283) * 0.07;
      c.save(); c.scale(w, h);
      c.beginPath(); c.moveTo(-r * 1.05, r * 0.7); c.bezierCurveTo(-r * 1.15, -r * 0.5, -r * 0.6, -r * 1.05, 0, -r * 1.05); c.bezierCurveTo(r * 0.6, -r * 1.05, r * 1.15, -r * 0.5, r * 1.05, r * 0.7); c.quadraticCurveTo(0, r * 0.9, -r * 1.05, r * 0.7); c.closePath();
      c.globalAlpha = 0.85; c.fillStyle = shade(c, col, r * 1.05, 0, -r * 0.1, 0.35); c.fill(); c.globalAlpha = 1; stroke(c, lw);
      c.beginPath(); c.arc(-r * 0.35, r * 0.3, r * 0.28, 0, 6.283); c.fillStyle = rgba(shadeC(col, -0.35), 0.6); c.fill();
      c.beginPath(); c.arc(r * 0.45, r * 0.42, r * 0.13, 0, 6.283); c.fill();
      spec(c, -r * 0.5, -r * 0.6, r * 0.28, r * 0.13, 0.55); spec(c, r * 0.65, -r * 0.35, r * 0.07, r * 0.07, 0.6);
      face(c, r * 0.06, -r * 0.08, r * 0.86, { lid: shadeC(col, -0.05), sclera: '#FFFFFF' });
      c.restore();
    },
    harpy(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, fl = Math.sin(ph * 6.283);
      [-1, 1].forEach(s => {
        c.save(); c.scale(s, 1); c.translate(r * 0.55, -r * 0.2); c.rotate(-0.25 - fl * 0.55);
        for (let i = 2; i >= 0; i--) { c.beginPath(); c.ellipse(r * (0.55 + i * 0.32), r * (i * 0.12), r * (0.62 - i * 0.05), r * 0.22, 0.1 + i * 0.22, 0, 6.283); c.fillStyle = i === 2 ? '#FFFFFF' : i === 1 ? shadeC(col, 0.2) : col; c.fill(); stroke(c, lw * 0.85); }
        c.restore();
      });
      [-0.3, 0.3].forEach(x => { c.strokeStyle = '#E8A33D'; c.lineWidth = lw * 1.1; c.beginPath(); c.moveTo(x * r, r * 0.7); c.lineTo(x * r, r * 1.0); c.moveTo(x * r - r * 0.12, r * 1.05); c.lineTo(x * r, r * 0.98); c.lineTo(x * r + r * 0.12, r * 1.05); c.stroke(); });
      c.beginPath(); c.ellipse(0, r * 0.05, r * 0.85, r * 0.9, 0, 0, 6.283); c.fillStyle = shade(c, col, r); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(0, r * 0.38, r * 0.5, r * 0.45, 0, 0, 6.283); c.fillStyle = '#F4F7FF'; c.fill();
      [-0.25, 0, 0.25].forEach((x, i) => { c.save(); c.translate(x * r, -r * 0.8); c.rotate(x * 1.6 - 0.15); c.beginPath(); c.ellipse(0, -r * 0.28, r * 0.12, r * 0.34, 0, 0, 6.283); c.fillStyle = i === 1 ? '#FFE37A' : shadeC(col, -0.2); c.fill(); stroke(c, lw * 0.7); c.restore(); });
      face(c, r * 0.0, -r * 0.12, r * 0.8, { lid: shadeC(col, -0.1), noMouth: true, sclera: '#FFFFFF' });
      c.beginPath(); c.moveTo(r * 0.0, r * 0.08); c.lineTo(r * 0.42, r * 0.18); c.lineTo(r * 0.02, r * 0.34); c.closePath(); c.fillStyle = '#FFC24A'; c.fill(); stroke(c, lw * 0.8);
      c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(r * 0.05, r * 0.22); c.lineTo(r * 0.3, r * 0.2); c.stroke();
    },
    golem(c, r, ph, o) {
      const lw = lwOf(r) * 1.1, col = o.color, b = Math.sin(ph * 6.283) * r * 0.06;
      [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * r * 1.12, r * 0.15 + b * s, r * 0.36, r * 0.46, 0, 0, 6.283); c.fillStyle = shade(c, shadeC(col, -0.08), r * 0.45, s * r * 1.12, r * 0.15); c.fill(); stroke(c, lw); });
      c.beginPath(); c.moveTo(-r, r * 0.65); c.lineTo(-r * 1.05, -r * 0.3); c.lineTo(-r * 0.45, -r * 0.98); c.lineTo(r * 0.5, -r * 0.92); c.lineTo(r * 1.05, -r * 0.22); c.lineTo(r * 0.92, r * 0.72); c.closePath();
      c.fillStyle = shade(c, col, r * 1.1); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-r * 0.62, -r * 0.88); c.quadraticCurveTo(-r * 0.3, -r * 1.22, 0, -r * 0.98); c.quadraticCurveTo(r * 0.25, -r * 1.2, r * 0.52, -r * 0.9); c.lineTo(r * 0.45, -r * 0.72); c.quadraticCurveTo(0, -r * 0.82, -r * 0.55, -r * 0.7); c.closePath();
      c.fillStyle = shade(c, '#6CAF5A', r * 0.6, 0, -r * 0.9, 0.3); c.fill(); stroke(c, lw * 0.8);
      c.strokeStyle = shadeC(col, -0.45); c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-r * 0.6, r * 0.2); c.lineTo(-r * 0.25, r * 0.35); c.lineTo(-r * 0.05, r * 0.12); c.moveTo(r * 0.35, -r * 0.5); c.lineTo(r * 0.6, -r * 0.2); c.stroke();
      c.fillStyle = LN; c.beginPath(); c.ellipse(-r * 0.32, -r * 0.3, r * 0.2, r * 0.15, 0, 0, 6.283); c.ellipse(r * 0.34, -r * 0.32, r * 0.2, r * 0.15, 0, 0, 6.283); c.fill();
      c.fillStyle = '#FFB066'; c.beginPath(); c.arc(-r * 0.28, -r * 0.27, r * 0.1, 0, 6.283); c.arc(r * 0.38, -r * 0.29, r * 0.1, 0, 6.283); c.fill();
      c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(-r * 0.58, -r * 0.55); c.lineTo(-r * 0.12, -r * 0.4); c.moveTo(r * 0.62, -r * 0.6); c.lineTo(r * 0.14, -r * 0.42); c.stroke();
      c.beginPath(); c.moveTo(-r * 0.3, r * 0.15); c.lineTo(-r * 0.1, r * 0.25); c.lineTo(r * 0.1, r * 0.15); c.lineTo(r * 0.3, r * 0.25); c.stroke();
    },
    crab(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, snap = (Math.sin(ph * 6.283) * 0.5 + 0.5) * 0.5, blk = o.mode === 'block';
      [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { c.strokeStyle = LN; c.lineWidth = lw * 1.6; c.beginPath(); c.moveTo(s * r * 0.6, r * (0.15 + i * 0.2)); c.lineTo(s * r * 1.05, r * (0.3 + i * 0.25)); c.lineTo(s * r * 1.15, r * (0.62 + i * 0.2)); c.stroke(); c.strokeStyle = shadeC(col, -0.2); c.lineWidth = lw * 0.7; c.stroke(); } });
      c.beginPath(); c.ellipse(0, r * 0.2, r * 0.95, r * 0.7, 0, 0, 6.283); c.fillStyle = shade(c, col, r); c.fill(); stroke(c, lw);
      c.strokeStyle = shadeC(col, -0.3); c.lineWidth = lw * 0.6; c.beginPath(); c.arc(0, r * 0.5, r * 0.55, 3.6, 5.8); c.stroke(); c.beginPath(); c.arc(0, r * 0.62, r * 0.3, 3.7, 5.7); c.stroke();
      spec(c, -r * 0.4, -r * 0.1, r * 0.22, r * 0.1, 0.35);
      [-1, 1].forEach(s => { const ex = s * r * 0.3, ey = -r * 0.55; c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(ex * 0.7, -r * 0.2); c.lineTo(ex, ey); c.stroke(); });
      face(c, 0, -r * 0.62, r * 0.75, { lid: shadeC(col, -0.1), noMouth: true, sclera: '#FFFFFF' });
      c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-r * 0.25, r * 0.12); c.quadraticCurveTo(0, r * 0.28, r * 0.3, r * 0.05); c.stroke();
      [-1, 1].forEach(s => {
        const big = s > 0 ? 1.18 : 0.95, cx2 = s * r * (blk ? 0.55 : 1.15), cy2 = blk ? -r * 0.55 : -r * 0.1;
        c.save(); c.translate(cx2, cy2); c.scale(big, big);
        c.beginPath(); c.ellipse(0, 0, r * 0.38, r * 0.3, 0, 0, 6.283); c.fillStyle = shade(c, col, r * 0.4); c.fill(); stroke(c, lw / big);
        c.save(); c.rotate(-s * (0.25 + snap)); c.beginPath(); c.moveTo(s * r * 0.15, -r * 0.08); c.quadraticCurveTo(s * r * 0.55, -r * 0.45, s * r * 0.62, -r * 0.05); c.lineTo(s * r * 0.3, -r * 0.02); c.closePath(); c.fillStyle = shadeC(col, 0.15); c.fill(); stroke(c, lw * 0.8 / big); c.restore();
        c.save(); c.rotate(s * (0.15 + snap * 0.6)); c.beginPath(); c.moveTo(s * r * 0.15, r * 0.08); c.quadraticCurveTo(s * r * 0.5, r * 0.32, s * r * 0.58, r * 0.06); c.lineTo(s * r * 0.3, r * 0.04); c.closePath(); c.fillStyle = shadeC(col, 0.1); c.fill(); stroke(c, lw * 0.8 / big); c.restore();
        c.restore();
      });
    },
    frost(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, rot = ph * 6.283 / 6;
      c.save(); c.globalAlpha = 0.55;
      [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * r * 0.95, -r * 0.35, r * 0.6, r * 0.28, s * (0.5 + Math.sin(ph * 6.283) * 0.25), 0, 6.283); c.fillStyle = '#E8F8FF'; c.fill(); c.lineWidth = lw * 0.7; c.strokeStyle = '#9FD8F0'; c.stroke(); });
      c.restore();
      c.save(); c.rotate(rot);
      for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * 1.047); c.beginPath(); c.moveTo(-r * 0.14, -r * 0.7); c.lineTo(0, -r * 1.25); c.lineTo(r * 0.14, -r * 0.7); c.closePath(); c.fillStyle = i % 2 ? '#DDF6FF' : '#B8E8FF'; c.fill(); stroke(c, lw * 0.75); c.restore(); }
      c.restore();
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047 - Math.PI / 2; c.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); } c.closePath();
      c.fillStyle = shade(c, col, r * 0.9, 0, 0, 0.45); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(0, -r * 0.82); c.lineTo(0, -r * 0.3); c.moveTo(-r * 0.71, -r * 0.41); c.lineTo(-r * 0.3, -r * 0.15); c.stroke();
      face(c, r * 0.02, r * 0.08, r * 0.78, { lid: shadeC(col, -0.15), sclera: '#FFFFFF', pupil: '#2F80B7' });
    },
    imp(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, fl = Math.sin(ph * 6.283);
      c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.beginPath(); c.moveTo(-r * 0.6, r * 0.5); c.quadraticCurveTo(-r * 1.3, r * 0.6, -r * 1.25, -r * 0.1); c.stroke(); c.strokeStyle = shadeC(col, -0.2); c.lineWidth = lw * 1; c.stroke();
      c.beginPath(); c.moveTo(-r * 1.25, -r * 0.35); c.lineTo(-r * 1.08, -r * 0.05); c.lineTo(-r * 1.42, -r * 0.02); c.closePath(); c.fillStyle = shadeC(col, -0.2); c.fill(); stroke(c, lw * 0.7);
      [-1, 1].forEach(s => { c.save(); c.scale(s, 1); c.beginPath(); c.moveTo(r * 0.5, -r * 0.3); c.quadraticCurveTo(r * 1.0, -r * (0.95 + fl * 0.3), r * 1.45, -r * (0.6 + fl * 0.35)); c.quadraticCurveTo(r * 1.15, -r * 0.35, r * 1.2, -r * 0.1); c.quadraticCurveTo(r * 0.9, -r * 0.2, r * 0.6, r * 0.05); c.closePath(); c.fillStyle = shadeC(col, -0.35); c.fill(); stroke(c, lw * 0.85); c.restore(); });
      c.beginPath(); c.arc(0, 0, r * 0.88, 0, 6.283); c.fillStyle = shade(c, col, r); c.fill(); stroke(c, lw);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * r * 0.3, -r * 0.72); c.quadraticCurveTo(s * r * 0.4, -r * 1.15, s * r * 0.68, -r * 1.25); c.quadraticCurveTo(s * r * 0.58, -r * 0.92, s * r * 0.6, -r * 0.58); c.closePath(); c.fillStyle = '#3A2028'; c.fill(); stroke(c, lw * 0.8); });
      spec(c, -r * 0.35, -r * 0.42, r * 0.18, r * 0.1);
      face(c, r * 0.02, r * 0.06, r * 0.88, { lid: shadeC(col, -0.15), sclera: '#FFE36B' });
      const fx = r * 1.0, fy = r * 0.15, fs = r * (0.38 + fl * 0.06);
      c.beginPath(); c.arc(r * 0.78, r * 0.35, r * 0.17, 0, 6.283); c.fillStyle = col; c.fill(); stroke(c, lw * 0.7);
      c.beginPath(); c.moveTo(fx - fs * 0.6, fy + fs * 0.3); c.quadraticCurveTo(fx - fs * 0.5, fy - fs * 0.8, fx + fs * 0.1, fy - fs * 1.4); c.quadraticCurveTo(fx + fs * 0.25, fy - fs * 0.6, fx + fs * 0.6, fy - fs * 0.4); c.quadraticCurveTo(fx + fs * 0.7, fy + fs * 0.4, fx, fy + fs * 0.5); c.closePath();
      c.fillStyle = vgrad(c, fy - fs * 1.4, fy + fs * 0.5, '#FFE37A', '#FF6F3C'); c.fill(); stroke(c, lw * 0.7);
      c.beginPath(); c.ellipse(fx, fy + fs * 0.05, fs * 0.25, fs * 0.32, 0, 0, 6.283); c.fillStyle = '#FFF7D0'; c.fill();
    },
    nest(c, r, ph, o) {
      const lw = lwOf(r);
      c.beginPath(); c.ellipse(0, r * 0.2, r * 1.15, r * 0.82, 0, 0, 6.283); c.fillStyle = shade(c, '#4A3B5C', r * 1.1, 0, r * 0.2, 0.3); c.fill(); stroke(c, lw);
      c.strokeStyle = '#6B5A7A'; c.lineWidth = lw * 0.8; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.9, r * 0.2 + Math.sin(a) * r * 0.62); c.quadraticCurveTo(Math.cos(a + 0.5) * r * 1.2, r * 0.2 + Math.sin(a + 0.5) * r * 0.8, Math.cos(a + 0.9) * r * 0.95, r * 0.2 + Math.sin(a + 0.9) * r * 0.66); c.stroke(); }
      c.beginPath(); c.ellipse(0, r * 0.05, r * 0.82, r * 0.5, 0, 0, 6.283); c.fillStyle = '#21182E'; c.fill();
      [[-0.38, 0.05, 0], [0.32, -0.12, 1], [0.02, 0.22, 2]].forEach(([a, b, i]) => { const p = 0.5 + 0.5 * Math.sin(ph * 6.283 + i * 2); c.beginPath(); c.ellipse(a * r, b * r, r * (0.22 + p * 0.04), r * (0.28 + p * 0.05), 0, 0, 6.283); c.fillStyle = shade(c, '#FF5C8A', r * 0.3, a * r, b * r, 0.45); c.fill(); stroke(c, lw * 0.7); spec(c, a * r - r * 0.07, b * r - r * 0.1, r * 0.05, r * 0.08, 0.7); });
    },
    cherub(c, r, ph, o) {
      const lw = lwOf(r), fl = Math.sin(ph * 6.283);
      c.beginPath(); c.ellipse(0, -r * 1.22, r * 0.55, r * 0.16, 0, 0, 6.283); c.lineWidth = r * 0.14; c.strokeStyle = '#FFE37A'; c.stroke(); c.lineWidth = r * 0.04; c.strokeStyle = '#FFF7C2'; c.stroke();
      [-1, 1].forEach(s => { c.save(); c.scale(s, 1); c.translate(r * 0.6, -r * 0.1); c.rotate(-0.35 - fl * 0.45); for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(r * (0.35 + i * 0.22), -r * (0.08 * i), r * (0.42 - i * 0.07), r * 0.2, 0.25 + i * 0.25, 0, 6.283); c.fillStyle = i ? '#F4F7FF' : '#FFFFFF'; c.fill(); stroke(c, lw * 0.8); } c.restore(); });
      c.beginPath(); c.arc(0, 0, r * 0.88, 0, 6.283); c.fillStyle = shade(c, '#FFD9B8', r, 0, 0, 0.3); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-r * 0.45, r * 0.55); c.quadraticCurveTo(0, r * 1.05, r * 0.45, r * 0.55); c.quadraticCurveTo(0, r * 0.7, -r * 0.45, r * 0.55); c.fillStyle = '#FFFFFF'; c.fill(); stroke(c, lw * 0.7);
      [[-0.2, -0.78, 0.2], [0.08, -0.85, 0.22], [0.32, -0.74, 0.18]].forEach(([a, b, s]) => { c.beginPath(); c.arc(a * r, b * r, s * r, 0, 6.283); c.fillStyle = shade(c, '#FFE07A', s * r, a * r, b * r, 0.3); c.fill(); stroke(c, lw * 0.7); });
      c.fillStyle = 'rgba(255,120,140,.45)'; c.beginPath(); c.ellipse(-r * 0.55, r * 0.18, r * 0.16, r * 0.1, 0, 0, 6.283); c.ellipse(r * 0.55, r * 0.15, r * 0.16, r * 0.1, 0, 0, 6.283); c.fill();
      face(c, r * 0.02, -r * 0.05, r * 0.82, { lid: '#F2C7A5', sclera: '#FFFFFF', noMouth: true });
      c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(-r * 0.2, r * 0.38); c.quadraticCurveTo(0, r * 0.26, r * 0.22, r * 0.36); c.stroke();
    },
    wisp(c, r, ph, o) {
      const lw = lwOf(r), col = o.color;
      c.beginPath(); c.moveTo(-r * 0.95, 0); c.arc(0, 0, r * 0.95, Math.PI, 0);
      for (let i = 0; i <= 6; i++) { const x = r * 0.95 - i * r * 1.9 / 6, wv = Math.sin(ph * 6.283 + i * 1.2) * r * 0.14; c.lineTo(x, r * (0.75 + (i % 2 ? 0.28 : 0)) + wv); }
      c.closePath();
      c.globalAlpha = 0.88; c.fillStyle = shade(c, '#E8F8FF', r, 0, 0, 0.2); c.fill(); c.globalAlpha = 1; c.lineWidth = lwOf(r); c.strokeStyle = shadeC(col, -0.3); c.stroke();
      c.globalAlpha = 0.3; c.fillStyle = col; c.beginPath(); c.ellipse(0, r * 0.5, r * 0.75, r * 0.28, 0, 0, 6.283); c.fill(); c.globalAlpha = 1;
      face(c, r * 0.04, -r * 0.05, r * 0.85, { lid: '#C8EAF7', sclera: '#2B2433', pupil: '#7FD3F2', pr: 0.42 });
    },
    eye(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sw = Math.sin(ph * 6.283);
      [-1, 0, 1].forEach(d => { const x = d * r * 0.42, w2 = sw * r * 0.18; c.strokeStyle = LN; c.lineWidth = lw * 2.6; c.beginPath(); c.moveTo(x, r * 0.55); c.bezierCurveTo(x + d * r * 0.35 + w2, r * 0.95, x - d * r * 0.1 - w2, r * 1.1, x + d * r * 0.3 + w2, r * 1.32); c.stroke(); c.strokeStyle = '#A0587C'; c.lineWidth = lw * 1.3; c.stroke(); });
      [-1, 1].forEach(s => { c.save(); c.scale(s, 1); c.beginPath(); c.moveTo(r * 0.7, -r * 0.2); c.quadraticCurveTo(r * 1.3, -r * (0.9 + sw * 0.2), r * 1.65, -r * 0.35); c.quadraticCurveTo(r * 1.3, -r * 0.3, r * 1.35, -r * 0.05); c.quadraticCurveTo(r * 1.1, -r * 0.1, r * 0.8, r * 0.15); c.closePath(); c.fillStyle = '#5A2E4F'; c.fill(); stroke(c, lw * 0.85); c.restore(); });
      c.beginPath(); c.arc(0, 0, r * 0.92, 0, 6.283); c.fillStyle = shade(c, '#FFF4F0', r, 0, 0, 0.2); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(220,60,90,.45)'; c.lineWidth = lw * 0.5; [[-0.85, 0.2, -0.5, 0.1], [0.8, 0.35, 0.5, 0.25], [-0.5, 0.7, -0.3, 0.45]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a * r, b * r); c.quadraticCurveTo((a + d) * r / 2, (b + e) * r / 2 + r * 0.08, d * r, e * r); c.stroke(); });
      c.beginPath(); c.arc(r * 0.18, r * 0.05, r * 0.46, 0, 6.283); c.fillStyle = shade(c, col, r * 0.45, r * 0.18, r * 0.05, 0.4); c.fill(); c.lineWidth = lw * 0.7; c.stroke();
      c.fillStyle = LN; c.beginPath(); c.ellipse(r * 0.22, r * 0.05, r * 0.12, r * 0.3, 0, 0, 6.283); c.fill();
      spec(c, r * 0.02, -r * 0.15, r * 0.12, r * 0.09, 0.8);
      c.save(); c.beginPath(); c.arc(0, 0, r * 0.93, 0, 6.283); c.clip();
      c.beginPath(); c.moveTo(-r, -r * 1.2); c.lineTo(-r, -r * 0.15); c.quadraticCurveTo(0, -r * 0.48, r, -r * 0.42); c.lineTo(r, -r * 1.2); c.closePath(); c.fillStyle = shade(c, '#8C4A6B', r, 0, -r * 0.6, 0.3); c.fill();
      c.restore();
      c.beginPath(); c.moveTo(-r * 0.9, -r * 0.2); c.quadraticCurveTo(0, -r * 0.52, r * 0.92, -r * 0.44); c.lineWidth = lw; c.strokeStyle = LN; c.stroke();
      c.beginPath(); c.arc(0, 0, r * 0.92, 0, 6.283); stroke(c, lw);
    },
    knight(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sway = Math.sin(ph * 6.283) * 0.15;
      c.save(); c.translate(r * 0.15, -r * 0.95); c.rotate(-0.4 + sway); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-r * 0.2, -r * 0.65, -r * 0.85, -r * 0.55); c.quadraticCurveTo(-r * 0.45, -r * 0.3, -r * 0.15, r * 0.05); c.closePath(); c.fillStyle = shade(c, '#E0344F', r * 0.5, -r * 0.4, -r * 0.3, 0.35); c.fill(); stroke(c, lw * 0.8); c.restore();
      c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(r * 0.85, r * 0.25); c.lineTo(r * 1.3, -r * 0.85); c.stroke(); c.strokeStyle = '#E8EEF8'; c.lineWidth = lw * 1.1; c.stroke();
      c.strokeStyle = LN; c.lineWidth = lw * 1.4; c.beginPath(); c.moveTo(r * 0.68, r * 0.12); c.lineTo(r * 1.05, r * 0.28); c.stroke(); c.strokeStyle = '#F2C94C'; c.lineWidth = lw * 0.7; c.stroke();
      c.beginPath(); c.moveTo(-r * 0.8, r * 0.9); c.lineTo(-r * 0.75, r * 0.1); c.quadraticCurveTo(0, -r * 0.2, r * 0.75, r * 0.1); c.lineTo(r * 0.8, r * 0.9); c.closePath(); c.fillStyle = shade(c, col, r, 0, r * 0.4, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-r * 0.72, -r * 0.05); c.bezierCurveTo(-r * 0.78, -r * 1.25, r * 0.78, -r * 1.25, r * 0.72, -r * 0.05); c.quadraticCurveTo(0, r * 0.2, -r * 0.72, -r * 0.05); c.closePath();
      c.fillStyle = shade(c, shadeC(col, 0.15), r * 0.85, 0, -r * 0.55, 0.45); c.fill(); stroke(c, lw);
      c.beginPath(); c.rect(-r * 0.5, -r * 0.62, r * 1.0, r * 0.22); c.fillStyle = '#1A1426'; c.fill(); stroke(c, lw * 0.7);
      c.fillStyle = '#FFD447'; c.beginPath(); c.ellipse(-r * 0.2, -r * 0.5, r * 0.11, r * 0.06, 0.15, 0, 6.283); c.ellipse(r * 0.24, -r * 0.52, r * 0.11, r * 0.05, -0.2, 0, 6.283); c.fill();
      c.strokeStyle = shadeC(col, -0.35); c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(0, -r * 0.4); c.lineTo(0, r * 0.05); c.stroke();
      spec(c, -r * 0.35, -r * 0.82, r * 0.16, r * 0.08, 0.5);
      c.beginPath(); c.arc(-r * 0.58, r * 0.38, r * 0.52, 0, 6.283); c.fillStyle = shade(c, '#5B4FA8', r * 0.5, -r * 0.58, r * 0.38, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.arc(-r * 0.58, r * 0.38, r * 0.34, 0, 6.283); c.lineWidth = lw * 0.7; c.strokeStyle = '#F2C94C'; c.stroke();
      GFX.gloomy(c, -r * 0.58, r * 0.38, r * 0.16, { color: '#F2C94C', t: 0 });
    },
    skull(c, r, ph, o) {
      const lw = lwOf(r), chat = (Math.sin(ph * 6.283 * 2) * 0.5 + 0.5) * r * 0.12;
      if (o.mode === 'pile') {
        [[-0.6, 0.55, 0.4], [0.45, 0.6, -0.3], [0, 0.72, 0.1], [-0.2, 0.45, 1.2]].forEach(([x, y, a]) => { c.save(); c.translate(x * r, y * r); c.rotate(a); c.beginPath(); c.rect(-r * 0.45, -r * 0.07, r * 0.9, r * 0.14); c.fillStyle = '#EDE6D6'; c.fill(); stroke(c, lw * 0.7); [-1, 1].forEach(s => { c.beginPath(); c.arc(s * r * 0.45, -r * 0.06, r * 0.1, 0, 6.283); c.arc(s * r * 0.45, r * 0.06, r * 0.1, 0, 6.283); c.fill(); }); c.restore(); });
        c.beginPath(); c.ellipse(0, r * 0.2, r * 0.5, r * 0.42, 0, 0, 6.283); c.fillStyle = shade(c, '#EDE6D6', r * 0.5, 0, r * 0.2, 0.25); c.fill(); stroke(c, lw);
        c.fillStyle = LN; c.beginPath(); c.ellipse(-r * 0.17, r * 0.18, r * 0.12, r * 0.1, 0, 0, 6.283); c.ellipse(r * 0.17, r * 0.18, r * 0.12, r * 0.1, 0, 0, 6.283); c.fill();
        return;
      }
      c.strokeStyle = LN; c.lineWidth = lw * 1.8; c.beginPath(); c.moveTo(0, r * 0.35); c.lineTo(0, r * 1.0); c.moveTo(-r * 0.4, r * 0.55); c.lineTo(r * 0.4, r * 0.55); c.moveTo(-r * 0.35, r * 0.75); c.lineTo(r * 0.35, r * 0.75); c.stroke();
      c.strokeStyle = '#EDE6D6'; c.lineWidth = lw * 0.9; c.stroke();
      c.save(); c.translate(r * 0.85, r * 0.3); c.rotate(-0.7); c.beginPath(); c.rect(-r * 0.08, -r * 0.5, r * 0.16, r * 0.8); c.fillStyle = '#EDE6D6'; c.fill(); stroke(c, lw * 0.7); [-1, 1].forEach(s => { c.beginPath(); c.arc(-r * 0.07, s * r * 0.5, r * 0.11, 0, 6.283); c.arc(r * 0.07, s * r * 0.5, r * 0.11, 0, 6.283); c.fill(); stroke(c, lw * 0.6); }); c.restore();
      c.beginPath(); c.moveTo(-r * 0.5, r * 0.05 + chat); c.lineTo(-r * 0.42, r * 0.42 + chat); c.lineTo(r * 0.42, r * 0.42 + chat); c.lineTo(r * 0.5, r * 0.05 + chat); c.closePath(); c.fillStyle = '#E2D9C4'; c.fill(); stroke(c, lw * 0.8);
      c.beginPath(); c.moveTo(-r * 0.7, r * 0.0); c.bezierCurveTo(-r * 0.95, -r * 1.15, r * 0.95, -r * 1.15, r * 0.7, r * 0.0); c.quadraticCurveTo(r * 0.62, r * 0.22, r * 0.45, r * 0.18); c.lineTo(-r * 0.45, r * 0.18); c.quadraticCurveTo(-r * 0.62, r * 0.22, -r * 0.7, r * 0.0); c.closePath();
      c.fillStyle = shade(c, '#F4EEE0', r * 0.9, 0, -r * 0.35, 0.25); c.fill(); stroke(c, lw);
      c.fillStyle = '#FFFFFF'; for (let i = 0; i < 4; i++) { c.fillRect(-r * 0.32 + i * r * 0.17, r * 0.12, r * 0.12, r * 0.12); }
      c.fillStyle = LN; [[-1, 0.36, 0.25, 0.2], [1, 0.34, 0.22, 0.18]].forEach(([s, x, w, h]) => { c.beginPath(); c.moveTo(s * x * r - w * r, -r * 0.42 + (s < 0 ? h * r * 0.3 : -h * r * 0.1)); c.quadraticCurveTo(s * x * r, -r * 0.5, s * x * r + w * r, -r * 0.4); c.quadraticCurveTo(s * x * r + w * r * 0.6, -r * 0.1, s * x * r, -r * 0.08); c.quadraticCurveTo(s * x * r - w * r * 0.8, -r * 0.12, s * x * r - w * r, -r * 0.42 + (s < 0 ? h * r * 0.3 : -h * r * 0.1)); c.fill(); });
      c.fillStyle = '#FF5C5C'; c.beginPath(); c.arc(-r * 0.32, -r * 0.24, r * 0.07, 0, 6.283); c.arc(r * 0.37, -r * 0.24, r * 0.07, 0, 6.283); c.fill();
      c.beginPath(); c.moveTo(-r * 0.05, -r * 0.02); c.lineTo(r * 0.05, -r * 0.02); c.lineTo(0, -r * 0.12); c.closePath(); c.fillStyle = LN; c.fill();
      c.strokeStyle = 'rgba(80,60,50,.6)'; c.lineWidth = lw * 0.5; c.beginPath(); c.moveTo(r * 0.15, -r * 0.82); c.lineTo(r * 0.25, -r * 0.62); c.lineTo(r * 0.18, -r * 0.55); c.stroke();
      spec(c, -r * 0.4, -r * 0.62, r * 0.14, r * 0.08, 0.6);
    },
    totem(c, r, ph, o) {
      const lw = lwOf(r), glow = 0.5 + 0.5 * Math.sin(ph * 6.283), col = o.color;
      [-1, 1].forEach(s => { c.save(); c.translate(s * r * 0.62, -r * 1.55); c.rotate(s * 0.6); c.beginPath(); c.ellipse(0, -r * 0.3, r * 0.14, r * 0.42, 0, 0, 6.283); c.fillStyle = s < 0 ? '#FF6F59' : '#7FD3F2'; c.fill(); stroke(c, lw * 0.7); c.restore(); });
      c.beginPath(); c.rect(-r * 0.62, -r * 1.75, r * 1.24, r * 2.55); c.fillStyle = vgrad(c, -r * 1.75, r * 0.8, shadeC(col, 0.15), shadeC(col, -0.35)); c.fill(); stroke(c, lw);
      c.beginPath(); c.rect(-r * 0.75, -r * 0.5, r * 1.5, r * 0.2); c.fillStyle = shadeC(col, -0.25); c.fill(); stroke(c, lw * 0.8);
      c.beginPath(); c.moveTo(-r * 0.8, r * 0.8); c.lineTo(-r * 0.62, r * 0.45); c.lineTo(r * 0.62, r * 0.45); c.lineTo(r * 0.8, r * 0.8); c.closePath(); c.fillStyle = shadeC(col, -0.4); c.fill(); stroke(c, lw * 0.8);
      face(c, 0, -r * 1.2, r * 0.82, { lid: shadeC(col, -0.05), sclera: rgba('#B983F5', 0.6 + glow * 0.4), pupil: '#FFFFFF', pr: 0.35 });
      c.fillStyle = '#2A1A10'; c.beginPath(); c.ellipse(-r * 0.24, r * 0.0, r * 0.13, r * 0.08, 0.3, 0, 6.283); c.ellipse(r * 0.24, r * 0.0, r * 0.13, r * 0.08, -0.3, 0, 6.283); c.fill();
      c.beginPath(); c.moveTo(-r * 0.3, r * 0.22); c.lineTo(r * 0.3, r * 0.22); c.lineWidth = lw; c.strokeStyle = '#2A1A10'; c.stroke();
      c.globalAlpha = 0.5 + glow * 0.5; c.strokeStyle = '#D9A6FF'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-r * 0.45, -r * 0.2); c.lineTo(-r * 0.35, r * 0.35); c.moveTo(r * 0.45, -r * 0.2); c.lineTo(r * 0.35, r * 0.35); c.stroke(); c.globalAlpha = 1;
    },
    gremlin(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, run = Math.sin(ph * 6.283);
      [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * r * 0.35 + run * s * r * 0.2, r * 0.82, r * 0.2, r * 0.12, 0, 0, 6.283); c.fillStyle = shadeC(col, -0.35); c.fill(); stroke(c, lw * 0.7); });
      c.beginPath(); c.ellipse(-r * 0.55, -r * 0.15, r * 0.7, r * 0.75, -0.3, 0, 6.283); c.fillStyle = shade(c, '#B8864E', r * 0.7, -r * 0.55, -r * 0.15, 0.3); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-r * 0.8, -r * 0.8); c.quadraticCurveTo(-r * 0.55, -r * 1.05, -r * 0.3, -r * 0.82); c.lineWidth = lw * 1.4; c.strokeStyle = '#8C5A2B'; c.stroke();
      ['#FFD447', '#FFE37A', '#F2B61F'].forEach((cc, i) => { c.beginPath(); c.ellipse(-r * (0.75 - i * 0.2), -r * (0.95 + (i % 2) * 0.12), r * 0.16, r * 0.1, 0.2, 0, 6.283); c.fillStyle = cc; c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = '#A2680A'; c.stroke(); });
      c.beginPath(); c.arc(r * 0.2, r * 0.1, r * 0.72, 0, 6.283); c.fillStyle = shade(c, col, r * 0.75, r * 0.2, r * 0.1); c.fill(); stroke(c, lw);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(r * 0.2 + s * r * 0.45, -r * 0.25); c.lineTo(r * 0.2 + s * r * 1.15, -r * 0.65); c.lineTo(r * 0.2 + s * r * 0.55, r * 0.1); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, lw * 0.8); c.beginPath(); c.moveTo(r * 0.2 + s * r * 0.55, -r * 0.2); c.lineTo(r * 0.2 + s * r * 0.95, -r * 0.5); c.lineTo(r * 0.2 + s * r * 0.6, -r * 0.0); c.closePath(); c.fillStyle = '#FF9BC8'; c.fill(); });
      face(c, r * 0.26, r * 0.08, r * 0.72, { lid: shadeC(col, -0.12), sclera: '#FFF4C2' });
    },
  };
  MP.jelly = MP.splitter;
  /* a cute face: big round eyes with two highlights, pink cheeks, a tiny mouth. s ~ face width */
  function cuteFace(c, cx, cy, s, o) {
    o = o || {};
    const lw = Math.max(1, s * 0.08), er = s * (o.er || 0.2);
    [[cx - s * 0.3, cy], [cx + s * 0.3, cy]].forEach(([ex, ey]) => {
      c.beginPath(); c.arc(ex, ey, er, 0, 6.283); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = lw * 0.7; c.strokeStyle = LN; c.stroke();
      c.fillStyle = o.pupil || LN; c.beginPath(); c.arc(ex + er * 0.1, ey + er * 0.12, er * 0.62, 0, 6.283); c.fill();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex - er * 0.18, ey - er * 0.22, er * 0.26, 0, 6.283); c.fill(); c.beginPath(); c.arc(ex + er * 0.25, ey + er * 0.25, er * 0.12, 0, 6.283); c.fill();
      if (o.angry) { c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(ex - er * 1.1, ey - er * 1.25); c.lineTo(ex + er * 0.9, ey - er * 0.7); c.stroke(); }
    });
    c.fillStyle = o.cheek || 'rgba(255,120,150,.4)'; c.beginPath(); c.ellipse(cx - s * 0.52, cy + s * 0.2, s * 0.13, s * 0.08, 0, 0, 6.283); c.ellipse(cx + s * 0.52, cy + s * 0.2, s * 0.13, s * 0.08, 0, 0, 6.283); c.fill();
    if (!o.noMouth) { c.strokeStyle = LN; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); if (o.fang) { c.moveTo(cx - s * 0.12, cy + s * 0.28); c.quadraticCurveTo(cx, cy + s * 0.42, cx + s * 0.12, cy + s * 0.28); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(cx - s * 0.09, cy + s * 0.3); c.lineTo(cx - s * 0.05, cy + s * 0.42); c.lineTo(cx - s * 0.01, cy + s * 0.3); c.fill(); } else { c.moveTo(cx - s * 0.1, cy + s * 0.3); c.quadraticCurveTo(cx, cy + s * 0.4, cx + s * 0.1, cy + s * 0.3); c.stroke(); } }
  }
  Object.assign(MP, {
    scorpion(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sw = Math.sin(ph * 6.283);
      [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { c.strokeStyle = LN; c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(s * r * 0.5, r * (0.1 + i * 0.2)); c.lineTo(s * r * 1.0, r * (0.25 + i * 0.2) + sw * r * 0.05 * (i % 2 ? 1 : -1)); c.lineTo(s * r * 1.1, r * (0.55 + i * 0.2)); c.stroke(); c.strokeStyle = shadeC(col, -0.2); c.lineWidth = lw * 0.6; c.stroke(); } });
      c.strokeStyle = LN; c.lineWidth = lw * 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.8, r * 0.2); c.quadraticCurveTo(-r * 1.7, r * 0.1, -r * 1.6, -r * 0.8); c.quadraticCurveTo(-r * 1.55, -r * 1.3 + sw * r * 0.1, -r * 1.05, -r * 1.25); c.stroke(); c.strokeStyle = shadeC(col, -0.1); c.lineWidth = lw * 1.3; c.stroke();
      c.beginPath(); c.moveTo(-r * 1.0, -r * 1.3); c.lineTo(-r * 0.75, -r * 1.05); c.lineTo(-r * 1.15, -r * 1.0); c.closePath(); c.fillStyle = '#E86A5A'; c.fill(); stroke(c, lw * 0.7);
      c.beginPath(); c.ellipse(0, r * 0.15, r * 1.0, r * 0.65, 0, 0, 6.283); c.fillStyle = shade(c, col, r, 0, 0, 0.35); c.fill(); stroke(c, lw);
      c.strokeStyle = rgba(LN, 0.35); c.lineWidth = lw * 0.7; [-0.4, -0.1, 0.2].forEach(x => { c.beginPath(); c.moveTo(x * r, -r * 0.35); c.quadraticCurveTo(x * r - r * 0.05, r * 0.15, x * r, r * 0.65); c.stroke(); });
      [-1, 1].forEach(s => { c.save(); c.translate(r * 0.85, s * r * 0.45); c.rotate(s * (0.4 + sw * 0.2)); c.beginPath(); c.ellipse(r * 0.25, 0, r * 0.32, r * 0.22, 0, 0, 6.283); c.fillStyle = shadeC(col, 0.15); c.fill(); stroke(c, lw * 0.8); c.restore(); });
      cuteFace(c, r * 0.45, -r * 0.05, r * 0.6, { angry: true, fang: true, er: 0.19 });
    },
    cactus(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, bob = Math.sin(ph * 6.283) * r * 0.05;
      c.beginPath(); c.ellipse(0, r * 0.75, r * 0.75, r * 0.22, 0, 0, 6.283); c.fillStyle = '#C9A26B'; c.fill(); stroke(c, lw * 0.8);
      [-1, 1].forEach(s => { c.beginPath(); GFX.rr(c, s * r * 0.85 - r * 0.17, -r * 0.45 + bob * s, r * 0.34, r * 0.75, r * 0.17); c.fillStyle = shadeC(col, -0.1); c.fill(); stroke(c, lw); c.beginPath(); GFX.rr(c, s > 0 ? r * 0.5 : -r * 0.85, r * 0.05 + bob * s, r * 0.35, r * 0.3, r * 0.15); c.fill(); stroke(c, lw); });
      c.beginPath(); GFX.rr(c, -r * 0.55, -r * 1.05, r * 1.1, r * 1.9, r * 0.55); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.35); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(20,60,20,.3)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-r * 0.2, -r * 0.9); c.lineTo(-r * 0.2, r * 0.7); c.moveTo(r * 0.2, -r * 0.9); c.lineTo(r * 0.2, r * 0.7); c.stroke();
      c.strokeStyle = '#FFF8E0'; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 0; i < 5; i++) { const y = -r * 0.8 + i * r * 0.35; c.beginPath(); c.moveTo(-r * 0.55, y); c.lineTo(-r * 0.75, y - r * 0.12); c.moveTo(r * 0.55, y + r * 0.15); c.lineTo(r * 0.75, y + r * 0.03); c.stroke(); }
      c.fillStyle = '#FF6F9C'; c.beginPath(); c.arc(0, -r * 1.1, r * 0.2, 0, 6.283); c.fill(); stroke(c, lw * 0.7); c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(0, -r * 1.1, r * 0.08, 0, 6.283); c.fill();
      cuteFace(c, 0, -r * 0.25, r * 0.85, { angry: true, er: 0.18 });
    },
    penguin(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, wd = Math.sin(ph * 6.283);
      [-0.3, 0.3].forEach(x => { c.beginPath(); c.ellipse(x * r, r * 0.95, r * 0.26, r * 0.12, 0, 0, 6.283); c.fillStyle = '#FFB447'; c.fill(); stroke(c, lw * 0.8); });
      [-1, 1].forEach(s => { c.save(); c.translate(s * r * 0.75, -r * 0.1); c.rotate(s * (0.5 + wd * 0.35)); c.beginPath(); c.ellipse(0, r * 0.3, r * 0.2, r * 0.5, 0, 0, 6.283); c.fillStyle = shadeC(col, -0.1); c.fill(); stroke(c, lw * 0.8); c.restore(); });
      c.beginPath(); c.ellipse(0, 0, r * 0.82, r * 1.0, 0, 0, 6.283); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(0, r * 0.25, r * 0.55, r * 0.68, 0, 0, 6.283); c.fillStyle = '#F4F7FF'; c.fill();
      c.beginPath(); c.moveTo(-r * 0.02, -r * 0.22); c.lineTo(r * 0.38, -r * 0.12); c.lineTo(-r * 0.02, r * 0.0); c.closePath(); c.fillStyle = '#FFB447'; c.fill(); stroke(c, lw * 0.7);
      cuteFace(c, -r * 0.05, -r * 0.42, r * 0.72, { noMouth: true, er: 0.2 });
      c.fillStyle = '#E0344F'; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.7); c.quadraticCurveTo(0, -r * 1.25, r * 0.5, -r * 0.7); c.lineTo(r * 0.45, -r * 0.6); c.quadraticCurveTo(0, -r * 1.05, -r * 0.45, -r * 0.6); c.closePath(); c.fill(); stroke(c, lw * 0.7); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, -r * 1.15, r * 0.12, 0, 6.283); c.fill(); stroke(c, lw * 0.6);
    },
    magmite(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, p = Math.sin(ph * 6.283);
      c.beginPath(); c.moveTo(-r * 0.95, r * 0.6); c.quadraticCurveTo(-r * 1.1, -r * 0.3, -r * 0.5, -r * 0.85); c.quadraticCurveTo(0, -r * (1.2 + p * 0.05), r * 0.5, -r * 0.85); c.quadraticCurveTo(r * 1.1, -r * 0.3, r * 0.95, r * 0.6); c.quadraticCurveTo(0, r * 0.95, -r * 0.95, r * 0.6); c.closePath();
      c.fillStyle = shade(c, '#3A2A2A', r, 0, -r * 0.1, 0.3); c.fill(); stroke(c, lw);
      c.save(); c.clip();
      c.fillStyle = col; c.globalAlpha = 0.9; c.beginPath(); c.moveTo(-r * 0.7, -r * 0.3); c.lineTo(-r * 0.2, -r * 0.1); c.lineTo(-r * 0.45, r * 0.4); c.lineTo(-r * 0.05, r * 0.2); c.lineTo(r * 0.3, r * 0.6); c.lineTo(r * 0.5, -r * 0.1); c.lineTo(r * 0.15, -r * 0.4); c.lineTo(r * 0.45, -r * 0.7); c.lineWidth = lw * 1.3; c.strokeStyle = col; c.stroke(); c.globalAlpha = 1;
      c.fillStyle = `rgba(255,227,122,${0.5 + 0.3 * p})`; c.beginPath(); c.arc(-r * 0.3, r * 0.1, r * 0.1, 0, 6.283); c.arc(r * 0.35, r * 0.3, r * 0.08, 0, 6.283); c.fill();
      c.restore();
      cuteFace(c, 0, -r * 0.1, r * 0.8, { angry: true, pupil: '#FFE37A', er: 0.19, cheek: 'rgba(255,160,60,.45)' });
    },
    goat(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, st2 = Math.sin(ph * 6.283);
      [[-0.55, 0.9], [-0.2, 0.95], [0.35, 0.95], [0.7, 0.9]].forEach(([x, y], i) => { c.strokeStyle = LN; c.lineWidth = lw * 1.8; c.beginPath(); c.moveTo(x * r, r * 0.4); c.lineTo(x * r + (i % 2 ? st2 : -st2) * r * 0.08, y * r); c.stroke(); c.strokeStyle = shadeC(col, -0.25); c.lineWidth = lw * 0.9; c.stroke(); c.fillStyle = '#5E5A6A'; c.beginPath(); c.ellipse(x * r + (i % 2 ? st2 : -st2) * r * 0.08, y * r, r * 0.1, r * 0.06, 0, 0, 6.283); c.fill(); });
      c.beginPath(); c.ellipse(0, r * 0.15, r * 1.05, r * 0.6, 0, 0, 6.283); c.fillStyle = shade(c, col, r, 0, 0, 0.3); c.fill(); stroke(c, lw);
      c.fillStyle = shadeC(col, 0.2); for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-r * 0.6 + i * r * 0.3, -r * 0.25 + (i % 2) * r * 0.1, r * 0.18, 0, 6.283); c.fill(); }
      c.beginPath(); c.ellipse(r * 0.85, -r * 0.35, r * 0.5, r * 0.4, 0.2, 0, 6.283); c.fillStyle = shade(c, col, r * 0.5, r * 0.85, -r * 0.35, 0.3); c.fill(); stroke(c, lw);
      [-1, 1].forEach(s => { c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(r * 0.75 + s * r * 0.1, -r * 0.7); c.quadraticCurveTo(r * 0.7 + s * r * 0.4, -r * 1.3, r * 0.4 + s * r * 0.45, -r * 1.15); c.stroke(); c.strokeStyle = '#8A7A6A'; c.lineWidth = lw * 1.1; c.stroke(); });
      c.fillStyle = '#F4EEE0'; c.beginPath(); c.moveTo(r * 0.95, -r * 0.05); c.lineTo(r * 1.0, r * 0.45); c.lineTo(r * 0.8, r * 0.1); c.closePath(); c.fill(); stroke(c, lw * 0.6);
      cuteFace(c, r * 0.9, -r * 0.42, r * 0.55, { angry: true, er: 0.17, noMouth: true });
      c.fillStyle = '#FFB7C8'; c.beginPath(); c.arc(r * 1.3, -r * 0.2, r * 0.08, 0, 6.283); c.fill();
    },
    drone(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sp = ph * 6.283 * 2;
      [-1, 1].forEach(s => { c.strokeStyle = LN; c.lineWidth = lw * 1.4; c.beginPath(); c.moveTo(s * r * 0.5, -r * 0.3); c.lineTo(s * r * 1.15, -r * 0.75); c.stroke(); c.strokeStyle = '#8A94B0'; c.lineWidth = lw * 0.6; c.stroke(); c.save(); c.translate(s * r * 1.15, -r * 0.78); c.scale(1, 0.35); c.rotate(sp); c.fillStyle = 'rgba(200,210,230,.7)'; c.beginPath(); c.ellipse(0, 0, r * 0.55, r * 0.14, 0, 0, 6.283); c.ellipse(0, 0, r * 0.14, r * 0.55, 0, 0, 6.283); c.fill(); c.restore(); c.fillStyle = '#5E5A6A'; c.beginPath(); c.arc(s * r * 1.15, -r * 0.78, r * 0.09, 0, 6.283); c.fill(); });
      c.beginPath(); c.ellipse(0, 0, r * 0.85, r * 0.6, 0, 0, 6.283); c.fillStyle = shade(c, '#8A94B0', r, 0, -r * 0.1, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(0, r * 0.1, r * 0.55, r * 0.32, 0, 0, 6.283); c.fillStyle = '#1C2438'; c.fill(); stroke(c, lw * 0.7);
      c.fillStyle = col; c.beginPath(); c.arc(0, r * 0.1, r * 0.2, 0, 6.283); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-r * 0.06, r * 0.04, r * 0.07, 0, 6.283); c.fill();
      c.fillStyle = '#FF5C8A'; c.beginPath(); c.arc(r * 0.55, -r * 0.25, r * 0.07, 0, 6.283); c.fill();
      c.strokeStyle = LN; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(-r * 0.25, r * 0.55); c.lineTo(-r * 0.25, r * 0.85); c.moveTo(r * 0.25, r * 0.55); c.lineTo(r * 0.25, r * 0.85); c.stroke();
    },
    bot(c, r, ph, o) {
      const lw = lwOf(r) * 1.1, col = o.color, st2 = Math.sin(ph * 6.283);
      [-1, 1].forEach(s => { c.beginPath(); GFX.rr(c, s * r * 0.5 - r * 0.2, r * 0.45 + (s * st2) * r * 0.05, r * 0.4, r * 0.45, r * 0.08); c.fillStyle = shadeC(col, -0.2); c.fill(); stroke(c, lw); });
      [-1, 1].forEach(s => { c.save(); c.translate(s * r * 0.95, -r * 0.1); c.rotate(s * st2 * 0.3); c.beginPath(); GFX.rr(c, -r * 0.2, -r * 0.2, r * 0.4, r * 0.75, r * 0.1); c.fillStyle = shade(c, col, r * 0.4, 0, 0, 0.3); c.fill(); stroke(c, lw); c.fillStyle = '#FF7A3D'; c.beginPath(); c.arc(0, r * 0.55, r * 0.14, 0, 6.283); c.fill(); stroke(c, lw * 0.7); c.restore(); });
      c.beginPath(); GFX.rr(c, -r * 0.75, -r * 0.85, r * 1.5, r * 1.4, r * 0.18); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.35); c.fill(); stroke(c, lw);
      c.fillStyle = '#1C2438'; GFX.rr(c, -r * 0.55, -r * 0.65, r * 1.1, r * 0.55, r * 0.1); c.fill(); stroke(c, lw * 0.7);
      cuteFace(c, 0, -r * 0.37, r * 0.7, { pupil: '#4DF0FF', er: 0.17, noMouth: true, cheek: 'rgba(77,240,255,.25)' });
      c.strokeStyle = '#4DF0FF'; c.lineWidth = lw; c.beginPath(); c.moveTo(-r * 0.15, -r * 0.2); c.lineTo(r * 0.15, -r * 0.2); c.stroke();
      c.fillStyle = LN; c.fillRect(-r * 0.04, -r * 1.15, r * 0.08, r * 0.3); c.fillStyle = '#FF5C8A'; c.beginPath(); c.arc(0, -r * 1.2, r * 0.09, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)'; [[-0.45, 0.1], [0.45, 0.1], [-0.45, 0.4], [0.45, 0.4]].forEach(([x, y]) => { c.beginPath(); c.arc(x * r, y * r, r * 0.04, 0, 6.283); c.fill(); });
    },
    gearbug(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sp = ph * 6.283;
      [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { c.strokeStyle = LN; c.lineWidth = lw * 1.3; c.beginPath(); c.moveTo(s * r * 0.4, r * (0.1 + i * 0.22)); c.lineTo(s * r * 0.95, r * (0.2 + i * 0.22) + Math.sin(sp + i) * r * 0.08); c.stroke(); c.strokeStyle = '#8A6A4A'; c.lineWidth = lw * 0.5; c.stroke(); } });
      c.beginPath(); c.ellipse(0, r * 0.15, r * 0.85, r * 0.62, 0, 0, 6.283); c.fillStyle = shade(c, '#8A6A4A', r, 0, 0, 0.3); c.fill(); stroke(c, lw);
      c.save(); c.translate(0, -r * 0.15); c.rotate(sp); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, a2 = a + 0.39; c.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); c.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45); } c.closePath(); c.fillStyle = shade(c, col, r * 0.6, 0, 0, 0.35); c.fill(); stroke(c, lw * 0.8); c.restore();
      c.beginPath(); c.arc(0, -r * 0.15, r * 0.25, 0, 6.283); c.fillStyle = '#5A4632'; c.fill(); stroke(c, lw * 0.7);
      c.beginPath(); c.arc(r * 0.8, -r * 0.1, r * 0.3, 0, 6.283); c.fillStyle = shade(c, '#C9A24A', r * 0.3, r * 0.8, -r * 0.1, 0.3); c.fill(); stroke(c, lw * 0.8);
      cuteFace(c, r * 0.82, -r * 0.14, r * 0.38, { er: 0.2, noMouth: true });
      c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(r * 0.95, -r * 0.35); c.lineTo(r * 1.15, -r * 0.7); c.moveTo(r * 0.75, -r * 0.38); c.lineTo(r * 0.7, -r * 0.72); c.stroke();
    },
    spiderling(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sp = Math.sin(ph * 6.283);
      [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) { const y0 = -r * 0.3 + i * r * 0.25, wag = Math.sin(ph * 6.283 + i * 1.5) * r * 0.08; c.strokeStyle = LN; c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(s * r * 0.4, y0); c.lineTo(s * r * 1.05, y0 - r * 0.35 + wag); c.lineTo(s * r * 1.3, y0 + r * 0.35); c.stroke(); c.strokeStyle = shadeC(col, 0.1); c.lineWidth = lw * 0.6; c.stroke(); } });
      c.beginPath(); c.ellipse(-r * 0.35, r * 0.15, r * 0.72, r * 0.6, 0, 0, 6.283); c.fillStyle = shade(c, col, r * 0.7, -r * 0.35, r * 0.1, 0.35); c.fill(); stroke(c, lw);
      c.fillStyle = '#FF5C8A'; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.2); c.lineTo(-r * 0.2, r * 0.1); c.lineTo(-r * 0.5, r * 0.4); c.lineTo(-r * 0.8, r * 0.1); c.closePath(); c.fill(); stroke(c, lw * 0.6);
      c.beginPath(); c.arc(r * 0.45, -r * 0.05, r * 0.5, 0, 6.283); c.fillStyle = shade(c, shadeC(col, 0.1), r * 0.5, r * 0.45, -r * 0.1, 0.35); c.fill(); stroke(c, lw);
      cuteFace(c, r * 0.45, -r * 0.12, r * 0.62, { fang: true, er: 0.2, pupil: '#2B2433' });
      c.fillStyle = '#FFFFFF'; [[0.2, -0.45], [0.7, -0.45]].forEach(([x, y]) => { c.beginPath(); c.arc(x * r, y * r, r * 0.07, 0, 6.283); c.fill(); stroke(c, lw * 0.5); c.fillStyle = LN; c.beginPath(); c.arc(x * r, y * r, r * 0.035, 0, 6.283); c.fill(); c.fillStyle = '#FFFFFF'; });
    },
    wolf(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, st2 = Math.sin(ph * 6.283);
      [[-0.6, 0.85], [-0.25, 0.9], [0.3, 0.9], [0.65, 0.85]].forEach(([x, y], i) => { c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(x * r, r * 0.35); c.lineTo(x * r + (i % 2 ? st2 : -st2) * r * 0.12, y * r); c.stroke(); c.strokeStyle = shadeC(col, -0.15); c.lineWidth = lw * 1.1; c.stroke(); });
      c.strokeStyle = LN; c.lineWidth = lw * 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.9, 0); c.quadraticCurveTo(-r * 1.5, -r * 0.2 - st2 * r * 0.1, -r * 1.45, -r * 0.8); c.stroke(); c.strokeStyle = shadeC(col, 0.1); c.lineWidth = lw * 1.3; c.stroke();
      c.beginPath(); c.ellipse(-r * 0.1, r * 0.15, r * 1.0, r * 0.58, 0, 0, 6.283); c.fillStyle = shade(c, col, r, 0, 0, 0.3); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(-r * 0.1, r * 0.4, r * 0.6, r * 0.3, 0, 0, 6.283); c.fillStyle = shadeC(col, 0.4); c.fill();
      c.beginPath(); c.ellipse(r * 0.8, -r * 0.3, r * 0.55, r * 0.45, 0.1, 0, 6.283); c.fillStyle = shade(c, col, r * 0.5, r * 0.8, -r * 0.35, 0.3); c.fill(); stroke(c, lw);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(r * 0.55 + s * r * 0.2, -r * 0.6); c.lineTo(r * 0.5 + s * r * 0.35, -r * 1.05); c.lineTo(r * 0.75 + s * r * 0.25, -r * 0.65); c.closePath(); c.fillStyle = shadeC(col, -0.05); c.fill(); stroke(c, lw * 0.8); c.beginPath(); c.moveTo(r * 0.58 + s * r * 0.22, -r * 0.65); c.lineTo(r * 0.52 + s * r * 0.32, -r * 0.92); c.lineTo(r * 0.7 + s * r * 0.24, -r * 0.68); c.closePath(); c.fillStyle = '#FFB7C8'; c.fill(); });
      c.beginPath(); c.ellipse(r * 1.15, -r * 0.15, r * 0.3, r * 0.2, 0.2, 0, 6.283); c.fillStyle = shadeC(col, 0.35); c.fill(); stroke(c, lw * 0.7);
      c.fillStyle = LN; c.beginPath(); c.arc(r * 1.38, -r * 0.22, r * 0.08, 0, 6.283); c.fill();
      cuteFace(c, r * 0.8, -r * 0.42, r * 0.5, { angry: true, pupil: '#FFE37A', er: 0.17, noMouth: true });
    },
    bee(c, r, ph, o) {
      const lw = lwOf(r), fl = Math.sin(ph * 6.283);
      [-1, 1].forEach(s => { c.save(); c.translate(s * r * 0.25, -r * 0.55); c.rotate(s * (-0.3 + fl * 0.5)); c.beginPath(); c.ellipse(s * r * 0.45, 0, r * 0.55, r * 0.28, 0, 0, 6.283); c.fillStyle = 'rgba(230,243,255,.75)'; c.fill(); c.lineWidth = lw * 0.8; c.strokeStyle = '#9FB8F0'; c.stroke(); c.restore(); });
      c.beginPath(); c.ellipse(0, 0.1 * r, r * 1.0, r * 0.7, 0, 0, 6.283); c.fillStyle = shade(c, '#FFD447', r, 0, 0, 0.3); c.fill(); stroke(c, lw);
      c.save(); c.beginPath(); c.ellipse(0, 0.1 * r, r * 0.98, r * 0.68, 0, 0, 6.283); c.clip(); c.fillStyle = '#2B2433'; c.fillRect(-r * 0.25, -r, r * 0.3, r * 2); c.fillRect(-r * 0.75, -r, r * 0.28, r * 2); c.restore();
      c.beginPath(); c.moveTo(-r * 0.98, r * 0.1); c.lineTo(-r * 1.3, r * 0.12); c.lineTo(-r * 0.98, r * 0.25); c.closePath(); c.fillStyle = LN; c.fill();
      [-0.15, 0.25].forEach(x => { c.strokeStyle = LN; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(x * r + r * 0.4, -r * 0.5); c.quadraticCurveTo(x * r + r * 0.5, -r * 1.0, x * r + r * 0.75, -r * 1.0); c.stroke(); c.fillStyle = LN; c.beginPath(); c.arc(x * r + r * 0.75, -r * 1.0, r * 0.07, 0, 6.283); c.fill(); });
      cuteFace(c, r * 0.4, -r * 0.1, r * 0.6, { er: 0.2 });
    },
    tulip(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sw = Math.sin(ph * 6.283) * 0.08;
      c.beginPath(); c.ellipse(0, r * 0.95, r * 0.7, r * 0.2, 0, 0, 6.283); c.fillStyle = '#6B4E3A'; c.fill(); stroke(c, lw * 0.8);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(0, r * 0.75); c.quadraticCurveTo(s * r * 0.7, r * 0.6, s * r * 1.0, r * 0.1); c.quadraticCurveTo(s * r * 0.5, r * 0.3, 0, r * 0.75); c.closePath(); c.fillStyle = '#4E9E44'; c.fill(); stroke(c, lw * 0.8); });
      c.strokeStyle = LN; c.lineWidth = lw * 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, r * 0.85); c.quadraticCurveTo(sw * r, r * 0.2, sw * r * 2, -r * 0.3); c.stroke(); c.strokeStyle = '#4E9E44'; c.lineWidth = lw * 1.2; c.stroke();
      c.save(); c.translate(sw * r * 2, -r * 0.3); c.rotate(sw);
      c.beginPath(); c.moveTo(-r * 0.62, 0); c.quadraticCurveTo(-r * 0.7, -r * 1.1, -r * 0.25, -r * 0.95); c.lineTo(0, -r * 0.7); c.lineTo(r * 0.25, -r * 0.95); c.quadraticCurveTo(r * 0.7, -r * 1.1, r * 0.62, 0); c.quadraticCurveTo(0, r * 0.35, -r * 0.62, 0); c.closePath(); c.fillStyle = shade(c, col, r * 0.8, 0, -r * 0.4, 0.35); c.fill(); stroke(c, lw);
      c.fillStyle = shadeC(col, -0.25); c.beginPath(); c.moveTo(-r * 0.3, -r * 0.2); c.quadraticCurveTo(0, r * 0.05, r * 0.3, -r * 0.2); c.quadraticCurveTo(0, -r * 0.1, -r * 0.3, -r * 0.2); c.fill();
      c.fillStyle = '#FFFFFF'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * 0.12 - r * 0.05, -r * 0.2); c.lineTo(i * r * 0.12, -r * 0.05); c.lineTo(i * r * 0.12 + r * 0.05, -r * 0.2); c.fill(); }
      cuteFace(c, 0, -r * 0.5, r * 0.6, { angry: true, er: 0.17, noMouth: true });
      c.restore();
    },
    goblin(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, run = Math.sin(ph * 6.283);
      [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * r * 0.3 + run * s * r * 0.15, r * 0.85, r * 0.22, r * 0.12, 0, 0, 6.283); c.fillStyle = '#5A4632'; c.fill(); stroke(c, lw * 0.7); });
      c.beginPath(); GFX.rr(c, -r * 0.5, -r * 0.1, r * 1.0, r * 0.85, r * 0.25); c.fillStyle = shade(c, '#8A5A3C', r * 0.6, 0, r * 0.3, 0.3); c.fill(); stroke(c, lw);
      c.fillStyle = '#C9A24A'; c.fillRect(-r * 0.5, r * 0.35, r, r * 0.1); c.fillStyle = LN; c.fillRect(-r * 0.08, r * 0.32, r * 0.16, r * 0.16);
      c.save(); c.translate(-r * 0.75, r * 0.15); c.rotate(-0.5 + run * 0.2); c.beginPath(); c.arc(0, 0, r * 0.28, 0, 6.283); c.fillStyle = '#2B2433'; c.fill(); c.strokeStyle = '#5E5A6A'; c.lineWidth = lw; c.stroke(); c.fillStyle = '#7A7A8C'; c.fillRect(-r * 0.08, -r * 0.4, r * 0.16, r * 0.14); GFX.star(c, r * 0.1, -r * 0.5, r * 0.14, '#FFE37A', 0); c.restore();
      c.beginPath(); c.arc(0, -r * 0.45, r * 0.62, 0, 6.283); c.fillStyle = shade(c, col, r * 0.65, 0, -r * 0.5, 0.35); c.fill(); stroke(c, lw);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * r * 0.45, -r * 0.6); c.lineTo(s * r * 1.15, -r * 0.9); c.lineTo(s * r * 0.55, -r * 0.25); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, lw * 0.8); c.beginPath(); c.moveTo(s * r * 0.55, -r * 0.58); c.lineTo(s * r * 0.95, -r * 0.78); c.lineTo(s * r * 0.6, -r * 0.38); c.closePath(); c.fillStyle = '#FF9BC8'; c.fill(); });
      c.beginPath(); c.moveTo(-r * 0.5, -r * 0.95); c.lineTo(0, -r * 1.55); c.lineTo(r * 0.45, -r * 0.95); c.closePath(); c.fillStyle = '#5A4632'; c.fill(); stroke(c, lw * 0.8); c.fillStyle = '#C9A24A'; c.beginPath(); c.arc(0, -r * 1.5, r * 0.09, 0, 6.283); c.fill();
      cuteFace(c, 0, -r * 0.5, r * 0.7, { fang: true, er: 0.19, pupil: '#2B2433' });
      c.fillStyle = shadeC(col, -0.2); c.beginPath(); c.ellipse(r * 0.05, -r * 0.3, r * 0.12, r * 0.08, 0, 0, 6.283); c.fill();
    },
    kitten(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sw = Math.sin(ph * 6.283);
      c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.7, r * 0.3); c.quadraticCurveTo(-r * 1.4, r * 0.2, -r * 1.3, -r * 0.6 + sw * r * 0.2); c.stroke(); c.strokeStyle = col; c.lineWidth = lw * 1.1; c.stroke();
      [[-0.4, 0.82], [0.35, 0.82]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x * r, y * r, r * 0.22, r * 0.14, 0, 0, 6.283); c.fillStyle = shadeC(col, 0.2); c.fill(); stroke(c, lw * 0.7); });
      c.beginPath(); c.ellipse(0, r * 0.3, r * 0.75, r * 0.55, 0, 0, 6.283); c.fillStyle = shade(c, col, r * 0.8, 0, r * 0.2, 0.3); c.fill(); stroke(c, lw);
      c.beginPath(); c.ellipse(0, r * 0.45, r * 0.42, r * 0.3, 0, 0, 6.283); c.fillStyle = '#FFF4E6'; c.fill();
      c.beginPath(); c.arc(0, -r * 0.3, r * 0.72, 0, 6.283); c.fillStyle = shade(c, col, r * 0.75, 0, -r * 0.4, 0.3); c.fill(); stroke(c, lw);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * r * 0.3, -r * 0.85); c.lineTo(s * r * 0.6, -r * 1.35); c.lineTo(s * r * 0.72, -r * 0.6); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, lw * 0.8); c.beginPath(); c.moveTo(s * r * 0.4, -r * 0.85); c.lineTo(s * r * 0.58, -r * 1.18); c.lineTo(s * r * 0.65, -r * 0.7); c.closePath(); c.fillStyle = '#FFB7C8'; c.fill(); });
      c.fillStyle = shadeC(col, 0.35); [[-0.5, -0.25], [0.5, -0.25]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x * r - r * 0.12, y * r); c.lineTo(x * r, y * r - r * 0.2); c.lineTo(x * r + r * 0.12, y * r); c.fill(); });
      cuteFace(c, 0, -r * 0.35, r * 0.78, { er: 0.21, noMouth: true, pupil: '#2F80B7' });
      c.fillStyle = '#FFB7C8'; c.beginPath(); c.moveTo(-r * 0.08, -r * 0.08); c.lineTo(r * 0.08, -r * 0.08); c.lineTo(0, 0); c.closePath(); c.fill();
      c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-r * 0.1, r * 0.1, -r * 0.18, r * 0.05); c.moveTo(0, 0); c.quadraticCurveTo(r * 0.1, r * 0.1, r * 0.18, r * 0.05); c.moveTo(-r * 0.35, -r * 0.02); c.lineTo(-r * 0.75, -r * 0.08); c.moveTo(-r * 0.35, r * 0.06); c.lineTo(-r * 0.75, r * 0.12); c.moveTo(r * 0.35, -r * 0.02); c.lineTo(r * 0.75, -r * 0.08); c.moveTo(r * 0.35, r * 0.06); c.lineTo(r * 0.75, r * 0.12); c.stroke();
      c.fillStyle = '#FF5C8A'; c.beginPath(); c.arc(r * 0.95, -r * 0.95, r * 0.08, 0, 6.283); c.fill();
    },
  });
  const EXT = { bat: 2.3, harpy: 2.2, eye: 1.9, totem: 2.1, cherub: 1.9, imp: 1.8, knight: 1.6, golem: 1.7, crab: 1.9, toad: 1.6, frost: 1.6, blob: 1.6, gremlin: 1.6, roller: 1.5, bomb: 1.9, spore: 1.5, splitter: 1.4, jelly: 1.4, wisp: 1.4, nest: 1.4, skull: 1.5,
    scorpion: 1.9, cactus: 1.7, penguin: 1.5, magmite: 1.5, goat: 1.7, drone: 1.9, bot: 1.6, gearbug: 1.6, spiderling: 1.7, wolf: 1.8, bee: 1.6, tulip: 1.6, goblin: 1.8, kitten: 1.7 };
  const NF = { bat: 6, harpy: 6, cherub: 6, imp: 4, eye: 4, wisp: 6, toad: 4, drone: 6, bee: 6, penguin: 4, wolf: 4, goat: 4, gearbug: 6 };
  const monCache = new Map();
  /* one frame of a monster at body radius rpx (device pixels). Returns {cv, half} */
  function monSprite(type, rpx, ph, color, mode, flash) {
    const nf = NF[type] || 4, fi = Math.floor(((ph % 1) + 1) % 1 * nf), r = Math.max(4, Math.round(rpx));
    const key = type + '|' + r + '|' + fi + '|' + color + '|' + (mode || '') + (flash ? '|f' : '');
    let s = monCache.get(key);
    if (s) return s;
    if (flash) {
      const base = monSprite(type, rpx, ph, color, mode, false), cv = mk(base.cv.width, base.cv.height), c = cv.getContext('2d');
      c.drawImage(base.cv, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,255,255,.82)'; c.fillRect(0, 0, cv.width, cv.height);
      s = { cv, half: base.half };
    } else {
      const ext = EXT[type] || 1.6, half = Math.ceil(r * ext + 3), cv = mk(half * 2, half * 2), c = cv.getContext('2d');
      c.translate(half, half);
      try { (MP[type] || MP.blob)(c, r, fi / nf, { color, mode }); } catch (e) { console.error(e); }
      s = { cv, half };
    }
    if (monCache.size > 500) monCache.clear();
    monCache.set(key, s);
    return s;
  }
  return { LN, mk, rgba, shade, vgrad, spec, stroke, face, cuteFace, crown, th, lwOf, monSprite, MP, NF, EXT, monCache };
})();
