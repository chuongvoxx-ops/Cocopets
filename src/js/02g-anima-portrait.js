/* ---------- Anima portraits: a small painting for each of the thirteen ----------
   A sky and a place that belong to that Anima (a volcanic plain, a golden canyon, a moonlit lotus lake, the galaxy...),
   the creature drawn large and lit into it (a back-light bloom and god rays from behind, a contact shadow or a reflection
   in the water), drifting particles in front, then a colour grade, a vignette and a fine grain. Each painting grows
   grander with every Ascension. Cached, as a canvas and as an image. */
const AnimaPortrait = (() => {
  const T = AnimaArt.T, TAU = Math.PI * 2, { rgba, mix, sh, glow, star4, ringLight, bolt, flame, rose, coin } = T;
  const lin = (c, x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const rad = (c, x, y, r, st) => { const g = c.createRadialGradient(x, y, 0, x, y, r); st.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const add = (c, f) => { c.save(); c.globalCompositeOperation = 'lighter'; f(); c.restore(); };
  const blot = (c, x, y, r, col, a) => { if (r <= 0) return; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; };
  function sky(c, w, h, st) { c.fillStyle = lin(c, 0, 0, 0, h, st); c.fillRect(0, 0, w, h); }
  function stars(c, w, h, n, R, o) {
    o = o || {}; const y1 = (o.y1 == null ? 0.7 : o.y1) * h, u = w / 300;
    for (let i = 0; i < n; i++) { const x = R() * w, y = R() * y1, r = (0.35 + R() * R() * 1.5) * u * (o.s || 1), a = (0.25 + R() * 0.75) * (o.a || 1); c.globalAlpha = a; c.fillStyle = o.col || '#FFFFFF'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); if (r > 1.15 * u) star4(c, x, y, r * 0.8, o.glow || '#BFD8FF', a * 0.75); }
    c.globalAlpha = 1;
  }
  // soft coloured clouds of light (nebulae, glows on the horizon)
  function nebula(c, x, y, rx, ry, cols, n, R, a) { add(c, () => { for (let i = 0; i < n; i++) { const px = x + (R() - 0.5) * rx * 2, py = y + (R() - 0.5) * ry * 2, r = (0.3 + R() * 0.7) * Math.max(rx, ry) * 0.8; blot(c, px, py, r, cols[i % cols.length], a * (0.4 + R() * 0.6)); } }); }
  // a band of nebula along a line (the milky way)
  function band(c, x0, y0, x1, y1, wd, cols, n, R, a) { add(c, () => { for (let i = 0; i < n; i++) { const u = R(), px = x0 + (x1 - x0) * u + (R() - 0.5) * wd, py = y0 + (y1 - y0) * u + (R() - 0.5) * wd * 0.6, r = wd * (0.25 + R() * 0.5); blot(c, px, py, r, cols[i % cols.length], a * (0.4 + R() * 0.6)); } }); }
  // painted clouds: many soft puffs, lit on top
  function clouds(c, x0, x1, y, th, n, R, top, bot, a) {
    for (let i = 0; i < n; i++) { const cx = x0 + R() * (x1 - x0), cy = y + (R() - 0.5) * th, r = th * (0.45 + R() * 0.75); const g = c.createRadialGradient(cx - r * 0.15, cy - r * 0.5, r * 0.05, cx, cy, r); g.addColorStop(0, rgba(top, a)); g.addColorStop(0.55, rgba(mix(top, bot, 0.6), a * 0.85)); g.addColorStop(1, rgba(bot, 0)); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); }
  }
  // a mountain or cliff silhouette with a lit rim
  function ridge(c, w, base, amp, n, R, top, bot, o) {
    o = o || {}; const pts = [[-10, base]]; for (let i = 0; i <= n; i++) { const x = -10 + (w + 20) * i / n, y = base - amp * (0.25 + R() * 0.75) * (o.shape ? o.shape(x / w) : 1); pts.push([x, y]); if (i < n && o.jag) pts.push([x + (w + 20) / n * 0.5, y + amp * 0.2 * R()]); } pts.push([w + 10, base]);
    const path = () => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.lineTo(w + 10, (o.floor || base) + 400); c.lineTo(-10, (o.floor || base) + 400); c.closePath(); };
    path(); c.fillStyle = lin(c, 0, base - amp, 0, base + amp * 0.3, [[0, top], [1, bot]]); c.fill();
    if (o.rim) add(c, () => { c.strokeStyle = o.rim; c.lineJoin = 'round'; [[4, 0.15], [1.4, 0.7]].forEach(([lw, al]) => { c.globalAlpha = al * (o.rimA || 1); c.lineWidth = lw * w / 300; c.beginPath(); pts.slice(1, -1).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }); });
    if (o.snow) { c.save(); path(); c.clip(); c.fillStyle = 'rgba(240,246,255,.85)'; pts.slice(1, -1).forEach(([x, y]) => { if (y < base - amp * 0.55) { c.beginPath(); c.moveTo(x - amp * 0.18, y + amp * 0.16); c.lineTo(x, y - 1); c.lineTo(x + amp * 0.16, y + amp * 0.14); c.closePath(); c.fill(); } }); c.restore(); }
    return pts;
  }
  function moon(c, x, y, r, R, o) {
    o = o || {}; add(c, () => { blot(c, x, y, r * 4, o.glow || '#BFD8FF', 0.4); blot(c, x, y, r * 2.2, '#FFFFFF', 0.35); });
    c.fillStyle = rad(c, x - r * 0.3, y - r * 0.3, r * 1.3, [[0, '#FFFFFF'], [0.55, o.col || '#E4ECFF'], [1, o.dk || '#9AA8D0']]); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); for (let i = 0; i < 14; i++) { const a = R() * TAU, d = R() * r * 0.85, cr = r * (0.06 + R() * 0.16), cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; c.fillStyle = 'rgba(90,100,150,.22)'; c.beginPath(); c.arc(cx, cy, cr, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(cx - cr * 0.25, cy - cr * 0.25, cr * 0.6, 0, TAU); c.fill(); } c.restore();
  }
  function crescent(c, x, y, r, col, dk, gl) {
    add(c, () => { blot(c, x, y, r * 3.5, gl, 0.45); });
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * 0.45, y - r * 0.22, r * 0.82, 0, TAU, true); c.fillStyle = rad(c, x - r * 0.4, y, r * 1.2, [[0, '#FFFFFF'], [0.6, col], [1, dk]]); c.fill('evenodd'); c.restore();
  }
  function sunDisc(c, x, y, r, col, o) {
    o = o || {}; add(c, () => { blot(c, x, y, r * 6, col, 0.3); blot(c, x, y, r * 3, col, 0.45); blot(c, x, y, r * 1.5, '#FFFFFF', 0.85); if (o.rays) for (let i = 0; i < o.rays; i++) { const a = i / o.rays * TAU + (o.rot || 0), L = r * (3 + (i % 2) * 2.5); c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = 0.35; blitSized(c, beamSprite(col), 0, -r * 0.35, L, r * 0.7); c.restore(); } });
  }
  // light shafts radiating from a point
  function rays(c, x, y, n, len, wd, col, a, R, a0, a1) { add(c, () => { for (let i = 0; i < n; i++) { const ang = a0 + (a1 - a0) * (n > 1 ? i / (n - 1) : 0.5) + (R() - 0.5) * 0.12, L = len * (0.55 + R() * 0.6), ww = wd * (0.4 + R() * 0.9); c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = a * (0.4 + R() * 0.6); blitSized(c, beamSprite(col), 0, -ww / 2, L, ww); c.restore(); } }); }
  function waterSurface(c, w, y0, h, top, bot, R, o) {
    o = o || {}; c.fillStyle = lin(c, 0, y0, 0, h, [[0, top], [1, bot]]); c.fillRect(0, y0, w, h - y0);
    add(c, () => { const n = o.n || 70; for (let i = 0; i < n; i++) { const yy = y0 + Math.pow(R(), 1.6) * (h - y0), x = R() * w, L = (8 + R() * 30) * w / 300 * (0.4 + (yy - y0) / (h - y0)), a = (o.a || 0.35) * (0.3 + R() * 0.7) * (1 - (yy - y0) / (h - y0) * 0.6); c.globalAlpha = a; c.fillStyle = o.col || '#BFE6FF'; c.fillRect(x, yy, L, Math.max(0.7, w / 300 * (0.6 + R()))); }
      if (o.rx != null) for (let i = 0; i < 26; i++) { const yy = y0 + i / 26 * (h - y0), L = (14 + R() * 26) * w / 300 * (1 - i / 40); c.globalAlpha = 0.5 * (1 - i / 30); c.fillStyle = o.rcol || '#FFFFFF'; c.fillRect(o.rx - L / 2 + (R() - 0.5) * 8, yy, L, 1.2 * w / 300); } });
  }
  // particles drifting in front of everything
  function particles(c, w, h, n, R, kind, cols, o) {
    o = o || {}; const u = w / 300;
    for (let i = 0; i < n; i++) {
      const x = R() * w, y = (o.y0 || 0) * h + R() * h * ((o.y1 || 1) - (o.y0 || 0)), s = (0.6 + R() * 1.4) * u * (o.s || 1), col = cols[i % cols.length], near = R() < 0.18;
      if (kind === 'ember' || kind === 'mote') add(c, () => { blot(c, x, y, s * (near ? 7 : 4), col, near ? 0.5 : 0.7); blot(c, x, y, s * 1.2, '#FFFFFF', 0.85); if (kind === 'ember' && R() < 0.5) { c.globalAlpha = 0.35; c.strokeStyle = col; c.lineWidth = s * 0.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 6 * u, y + s * 8); c.stroke(); } });
      else if (kind === 'petal') { c.save(); c.translate(x, y); c.rotate(R() * TAU); c.globalAlpha = 0.85; c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, s * (near ? 5 : 3), s * (near ? 2.6 : 1.6), 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-s * 0.6, -s * 0.4, s * 1.3, s * 0.5, 0, 0, TAU); c.fill(); c.restore(); }
      else if (kind === 'bubble') { c.save(); c.globalAlpha = 0.75; c.strokeStyle = col; c.lineWidth = Math.max(0.6, s * 0.4); c.beginPath(); c.arc(x, y, s * (near ? 5 : 2.6), 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - s, y - s, s * 0.7, 0, TAU); c.fill(); c.restore(); }
      else if (kind === 'spark') star4(c, x, y, s * (near ? 1.6 : 0.9), col, 0.5 + R() * 0.5);
      else if (kind === 'ash') { c.globalAlpha = 0.5; c.fillStyle = col; c.beginPath(); c.arc(x, y, s * 0.9, 0, TAU); c.fill(); c.globalAlpha = 1; }
      else if (kind === 'snow') add(c, () => blot(c, x, y, s * 3, col, 0.6));
      else if (kind === 'coin') { c.save(); c.translate(x, y); c.rotate(R() * TAU); c.scale(1, 0.3 + R() * 0.7); coin(c, 0, 0, s * (near ? 4 : 2.4)); c.restore(); add(c, () => star4(c, x + s, y - s, s * 0.6, '#FFF7C2', 0.7)); }
    }
    c.globalAlpha = 1;
  }
  function cracks(c, w, y0, h, n, R, col, a) { add(c, () => { for (let i = 0; i < n; i++) { let x = R() * w, y = y0 + R() * (h - y0); const pts = [[x, y]]; for (let j = 0; j < 5; j++) { x += (R() - 0.5) * 40 * w / 300; y += (R() - 0.3) * 10 * w / 300; pts.push([x, y]); } [[5, 0.12], [1.6, 0.8]].forEach(([lw, al]) => { c.globalAlpha = a * al; c.strokeStyle = col; c.lineWidth = lw * w / 300; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([px, py], j) => j ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); }); } }); }
  function rock(c, cx, top, wTop, wBot, hh, col, R, o) {
    o = o || {}; const pts = [[cx - wTop / 2, top], [cx - wTop * 0.2, top - hh * 0.05], [cx + wTop * 0.25, top - hh * 0.03], [cx + wTop / 2, top + hh * 0.04], [cx + wBot / 2, top + hh], [cx - wBot / 2, top + hh]];
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = lin(c, cx - wBot / 2, top, cx + wBot / 2, top + hh, [[0, sh(col, 0.35)], [0.45, col], [1, sh(col, -0.55)]]); c.fill();
    c.save(); c.clip(); c.strokeStyle = rgba(sh(col, -0.6), 0.5); c.lineWidth = 1.2 * wTop / 120; for (let i = 0; i < 9; i++) { const x = cx + (R() - 0.5) * wBot, y = top + R() * hh; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * wTop * 0.4, y + hh * (0.15 + R() * 0.25)); c.stroke(); }
    c.fillStyle = lin(c, 0, top - 4, 0, top + hh * 0.18, [[0, o.cap || rgba(sh(col, 0.5), 0.7)], [1, 'rgba(0,0,0,0)']]); c.fillRect(cx - wBot, top - 6, wBot * 2, hh * 0.2);
    c.restore();
  }
  function shadowAt(c, x, y, rx, a) { c.save(); c.translate(x, y); c.scale(1, 0.22); c.fillStyle = rad(c, 0, 0, rx, [[0, `rgba(5,2,12,${a})`], [1, 'rgba(5,2,12,0)']]); c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); }

  /* ---- the scenes: back() paints the place and returns where the creature stands; front() paints what drifts before it ---- */
  const SC = {
    // Samael: a burning plain under volcanoes, the sky full of embers
    aries: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#0E0205'], [0.4, '#36070E'], [0.66, '#8A2410'], [0.76, '#3A0A0A'], [1, '#0C0204']]);
        nebula(c, w * 0.5, h * 0.62, w * 0.75, h * 0.1, ['#FF5A2A', '#C2182E', '#FF9A3D'], 18, R, 0.22 + k * 0.08);
        stars(c, w, h, 30, R, { y1: 0.45, a: 0.4, glow: '#FF9A6A' });
        for (let i = 0; i < 9; i++) { const x = R() * w, y = h * (0.15 + R() * 0.4), s = w * (0.12 + R() * 0.15); c.globalAlpha = 0.5; blitSized(c, puffSprite('rgba(20,6,8,'), x - s, y - s, s * 2, s * 2); } c.globalAlpha = 1;
        ridge(c, w, h * 0.74, h * 0.3, 6, R, '#140608', '#2A0A0A', { rim: '#FF6A2A', rimA: 0.8, shape: x => 0.6 + 0.4 * Math.sin(x * Math.PI * 2.2) });
        add(c, () => { blot(c, w * 0.3, h * 0.48, w * 0.25, '#FF6A2A', 0.35); blot(c, w * 0.78, h * 0.5, w * 0.2, '#FF3A2A', 0.3); });
        c.fillStyle = lin(c, 0, h * 0.74, 0, h, [[0, '#1E0A0C'], [1, '#060203']]); c.fillRect(0, h * 0.74, w, h * 0.26);
        cracks(c, w, h * 0.78, h, 7 + k * 3, R, '#FF5A2A', 0.8);
        if (k === 3) add(c, () => { for (let i = 0; i < 6; i++) { const x = w * (0.08 + R() * 0.84); flame(c, x, h * 0.78, 0, w * 0.025, h * (0.18 + R() * 0.2), (R() - 0.5) * 10, 'rgba(200,30,60,.7)', '#FF7A3D', 'rgba(255,236,150,0)'); } });
        return { fy: h * 0.88, light: '#FF7A3D', grade: ['#FF6A2A', 0.12] };
      }, front(c, w, h, k, R) { particles(c, w, h, 30 + k * 18, R, 'ember', ['#FFB066', '#FF5A3C', '#FFE37A'], { s: 1 }); particles(c, w, h, 16, R, 'ash', ['#5A4A50'], { s: 1.2 }); } },
    // Belial: a golden canyon at dusk, a wet sand floor holding the light
    taurus: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#1E1428'], [0.35, '#6A3A3A'], [0.62, '#E0904A'], [0.74, '#FFD38A'], [1, '#3A2418']]);
        sunDisc(c, w * 0.5, h * 0.62, w * 0.05, '#FFC24D', { rays: k >= 2 ? 8 : 0 });
        clouds(c, -20, w + 20, h * 0.3, h * 0.08, 18, R, '#F2A86A', '#5A2E3A', 0.55);
        ridge(c, w, h * 0.78, h * 0.62, 4, R, '#3A2014', '#1A0E08', { rim: '#FFC24D', rimA: 0.9, shape: x => Math.pow(Math.abs(x - 0.5) * 2, 1.6) + 0.04 });
        c.fillStyle = lin(c, 0, h * 0.76, 0, h, [[0, '#C98A4A'], [0.3, '#7A4A2A'], [1, '#2A160C']]); c.fillRect(0, h * 0.76, w, h * 0.24);
        waterSurface(c, w, h * 0.78, h, 'rgba(255,210,140,.25)', 'rgba(40,20,10,0)', R, { n: 50, col: '#FFE3A8', a: 0.4, rx: w * 0.5, rcol: '#FFE9A8' });
        return { fy: h * 0.86, light: '#FFC24D', reflect: 0.25, grade: ['#FFB347', 0.12] };
      }, front(c, w, h, k, R) { particles(c, w, h, 24 + k * 10, R, 'mote', ['#FFE9A8', '#FFC24D'], { s: 0.7 }); } },
    // Raziel: the celestial sky at night above a sea of clouds, floating islands adrift in it, the sun on one side and the
    // moon on the other, gold and blue nebulae, and a round sky-platform inlaid with gold where the twin dragons coil
    gemini: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#060A1C'], [0.32, '#0E1530'], [0.58, '#1E2B5C'], [0.78, '#3A5AA8'], [1, '#9EC4F0']]);
        stars(c, w, h, 130, R, { y1: 0.78, a: 0.85, glow: '#CFE6FA' });
        nebula(c, w * 0.26, h * 0.34, w * 0.3, h * 0.2, ['#E4B76A', '#B88A3A', '#FFD98A'], 12, R, 0.1 + k * 0.03);
        nebula(c, w * 0.74, h * 0.3, w * 0.3, h * 0.2, ['#4A90E2', '#2A5CB4', '#8FD3FF'], 12, R, 0.13 + k * 0.03);
        sunDisc(c, w * 0.13, h * 0.15, w * 0.045, '#FFD98A', { rays: 12, rot: 0.2 }); crescent(c, w * 0.87, h * 0.15, w * 0.05, '#CFE6FA', '#2A5CB4', '#8FD3FF');
        // floating islands: rock hanging under a lit grassy top, a waterfall of mist from the biggest
        const isle = (x, y, iw, a) => { c.save(); c.globalAlpha = a; c.fillStyle = lin(c, 0, y - iw * 0.1, 0, y + iw * 0.9, [[0, '#24306A'], [1, 'rgba(14,21,48,0)']]); c.beginPath(); c.moveTo(x - iw / 2, y); for (let i = 0; i <= 6; i++) { const u = i / 6; c.lineTo(x - iw / 2 + iw * u, y + Math.sin(u * Math.PI) * iw * (0.55 + R() * 0.25) + (R() - 0.5) * iw * 0.06); } c.closePath(); c.fill();
          c.fillStyle = '#2E3C7A'; c.beginPath(); c.ellipse(x, y, iw / 2, iw * 0.07, 0, 0, TAU); c.fill(); add(c, () => { c.globalAlpha = a * 0.5; c.strokeStyle = '#8FD3FF'; c.lineWidth = Math.max(1, w / 300); c.beginPath(); c.ellipse(x, y - iw * 0.01, iw / 2, iw * 0.07, 0, Math.PI, TAU); c.stroke(); }); c.restore(); };
        isle(w * 0.12, h * 0.52, w * 0.16, 0.8); isle(w * 0.9, h * 0.46, w * 0.13, 0.75); isle(w * 0.28, h * 0.66, w * 0.1, 0.65); isle(w * 0.78, h * 0.62, w * 0.11, 0.7);
        add(c, () => { blot(c, w * 0.5, h * 0.62, w * 0.45, '#4A90E2', 0.18); blot(c, w * 0.5, h * 0.55, w * 0.25, '#FFD98A', 0.12 + k * 0.03); });
        clouds(c, -30, w + 30, h * 0.8, h * 0.1, 40, R, '#CFE6FA', '#2A3E80', 0.8);
        // the platform
        const py = h * 0.86, prx = w * 0.3, pry = h * 0.05;
        c.save(); c.translate(w * 0.5, py); c.scale(1, pry / prx);
        c.fillStyle = rad(c, 0, 0, prx, [[0, '#2E3C7A'], [0.75, '#1E2B5C'], [1, '#0E1530']]); c.beginPath(); c.arc(0, 0, prx, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(228,183,106,.9)'; c.lineWidth = w * 0.01; c.beginPath(); c.arc(0, 0, prx * 0.95, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(143,211,255,.7)'; c.lineWidth = w * 0.005; c.beginPath(); c.arc(0, 0, prx * 0.7, 0, TAU); c.stroke();
        c.restore();
        return { fy: py, light: '#5A8AE8', grade: ['#4A90E2', 0.08] };
      }, front(c, w, h, k, R) { clouds(c, -30, w + 30, h * 1.0, h * 0.07, 18, R, '#DDEBFF', '#3A5AA8', 0.85); particles(c, w, h, 18 + k * 8, R, 'spark', ['#FFE9A8', '#8FD3FF'], { y1: 0.85 }); } },
    // Abaddon: a black sea under an enormous moon, waves glowing with cyan light
    cancer: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#03050E'], [0.5, '#0A1430'], [0.66, '#16284A'], [1, '#050A16']]);
        stars(c, w, h, 90, R, { y1: 0.6, glow: '#8FFCFF' });
        moon(c, w * 0.5, h * 0.36, w * (0.24 + k * 0.03), R, { glow: '#BFEFFF' });
        clouds(c, -20, w + 20, h * 0.5, h * 0.05, 14, R, '#3A4A70', '#0A1020', 0.55);
        if (k >= 2) { const s = Math.floor(R() * 99); bolt(c, w * 0.1, h * 0.12, w * 0.24, h * 0.5, s, '#5DF2FF', 18 * w / 300); bolt(c, w * 0.92, h * 0.1, w * 0.78, h * 0.48, s + 4, '#5DF2FF', 18 * w / 300); }
        waterSurface(c, w, h * 0.64, h, '#0E2A48', '#02060E', R, { n: 110, col: '#8FFCFF', a: 0.35, rx: w * 0.5, rcol: '#DDF6FF' });
        add(c, () => { for (let i = 0; i < 7; i++) { const y = h * (0.66 + i * 0.045), x0 = R() * w * 0.4; c.globalAlpha = 0.25 + R() * 0.25; c.strokeStyle = '#5DF2FF'; c.lineWidth = 1.4 * w / 300; c.beginPath(); for (let x = -10; x < w + 10; x += 8) c.lineTo(x, y + Math.sin(x * 0.05 + i + x0) * 3 * w / 300); c.stroke(); } });
        return { fy: h * 0.8, light: '#8FFCFF', reflect: 0.32, grade: ['#3A8AFF', 0.12] };
      }, front(c, w, h, k, R) { particles(c, w, h, 14 + k * 8, R, 'mote', ['#5DF2FF', '#BFEFFF'], { y0: 0.55, s: 0.8 }); } },
    // Michael: above the clouds, a snowy peak in blinding holy light
    leo: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#24306E'], [0.4, '#5A68B8'], [0.64, '#E8A07A'], [0.8, '#FFD0A0'], [1, '#6A5A7A']]);
        sunDisc(c, w * 0.5, h * 0.5, w * 0.07, '#FFD38A', { rays: 10 });
        rays(c, w * 0.5, h * 0.5, 16, h * 0.8, w * 0.05, '#FFE0A8', 0.08 + k * 0.03, R, 0, TAU);
        clouds(c, -30, w + 30, h * 0.3, h * 0.06, 14, R, '#FFC9A8', '#5A5A9A', 0.5);
        ridge(c, w, h * 0.74, h * 0.22, 7, R, '#4A4A7A', '#7A7AA8', { snow: true, rim: '#FFD8A8', rimA: 0.7 });
        clouds(c, -30, w + 30, h * 0.8, h * 0.1, 30, R, '#FFE8D8', '#9A90C0', 0.8);
        return { fy: h * 0.84, light: '#FFD38A', float: true, grade: ['#FFB070', 0.12] };
      }, front(c, w, h, k, R) { clouds(c, -30, w + 30, h * 1.0, h * 0.08, 18, R, '#FFE8D8', '#9A90C0', 0.85); particles(c, w, h, 22 + k * 10, R, 'mote', ['#FFFFFF', '#FFE9A8'], { s: 0.8 }); } },
    // Gabriel: a moonlit lake of lotus flowers under hanging wisteria
    virgo: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#141E4A'], [0.45, '#3A4A9A'], [0.68, '#A898D8'], [0.74, '#5A5AA0'], [1, '#141838']]);
        stars(c, w, h, 50, R, { y1: 0.55 });
        moon(c, w * 0.74, h * 0.22, w * 0.1, R, { glow: '#FFE0F4' });
        for (let i = 0; i < 9; i++) { const x = w * (i + 0.3 + R() * 0.4) / 9, L = h * (0.15 + R() * 0.25); for (let j = 0; j < 14; j++) { const u = j / 14, yy = L * u, r = w * 0.022 * (1 - u * 0.6); c.fillStyle = rgba(j % 2 ? '#B98AE0' : '#E0A8F0', 0.8); c.beginPath(); c.arc(x + Math.sin(j * 1.7 + i) * w * 0.012, yy, r, 0, TAU); c.fill(); } }
        ridge(c, w, h * 0.7, h * 0.08, 8, R, '#2A2A5A', '#1A1A40', {});
        waterSurface(c, w, h * 0.7, h, '#4A4A9A', '#141838', R, { n: 80, col: '#FFE0F4', a: 0.3, rx: w * 0.74, rcol: '#FFF0FA' });
        return { fy: h * 0.82, light: '#FFE0F4', reflect: 0.3, float: true, grade: ['#FFB3D9', 0.1] };
      }, front(c, w, h, k, R) {
        const lotus = (x, y, s) => { c.fillStyle = rad(c, x, y, s * 2.2, [[0, '#3A8A6A'], [1, 'rgba(30,80,60,0)']]); c.beginPath(); c.ellipse(x, y + s * 0.3, s * 2, s * 0.6, 0, 0, TAU); c.fill(); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.fillStyle = lin(c, 0, 0, 0, -s * 1.4, [[0, '#FF8FC0'], [1, '#FFE4F2']]); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-s * 0.45, -s * 0.7, 0, -s * 1.4); c.quadraticCurveTo(s * 0.45, -s * 0.7, 0, 0); c.fill(); c.restore(); } add(c, () => blot(c, x, y - s * 0.4, s * 1.6, '#FFC2E2', 0.4)); };
        lotus(w * 0.14, h * 0.9, w * 0.05); lotus(w * 0.86, h * 0.88, w * 0.045); lotus(w * 0.3, h * 0.97, w * 0.04); if (k >= 2) lotus(w * 0.7, h * 0.97, w * 0.05);
        particles(c, w, h, 14 + k * 8, R, 'petal', ['#FFB3D9', '#FFE0EE'], { s: 0.9 }); particles(c, w, h, 12, R, 'mote', ['#FFE0F4', '#BFEFFF'], { s: 0.6 }); } },
    // Uriel: a storm of golden dust round a stone plinth, a sun of judgement behind
    libra: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#120A05'], [0.4, '#3A220C'], [0.62, '#A8661E'], [0.8, '#3A220C'], [1, '#0E0804']]);
        add(c, () => { blot(c, w * 0.5, h * 0.42, w * 0.6, '#FFB347', 0.3); });
        for (let i = 0; i < 14; i++) { const x = R() * w, y = h * (0.3 + R() * 0.55), s = w * (0.14 + R() * 0.16); c.globalAlpha = 0.45; blitSized(c, puffSprite('rgba(40,22,8,'), x - s, y - s, s * 2, s * 2); } c.globalAlpha = 1;
        add(c, () => { for (let i = 0; i < 10; i++) { const x = R() * w, y = h * (0.3 + R() * 0.55), s = w * (0.08 + R() * 0.1); blot(c, x, y, s, '#FFC24D', 0.12); } });
        rock(c, w * 0.5, h * 0.82, w * 0.62, w * 0.72, h * 0.22, '#6A5440', R, { cap: 'rgba(255,214,140,.5)' });
        c.fillStyle = '#FFD36B'; c.globalAlpha = 0.55; c.fillRect(w * 0.2, h * 0.82, w * 0.6, h * 0.006); c.globalAlpha = 1;
        return { fy: h * 0.83, light: '#FFC24D', grade: ['#FFB347', 0.14] };
      }, front(c, w, h, k, R) { particles(c, w, h, 30 + k * 12, R, 'ember', ['#FFE9A8', '#FFC24D', '#FF9A3D'], { s: 0.8 }); } },
    // Asmodeus: a black void veined with red smoke, a crimson glow rising from below
    scorpio: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#040103'], [0.55, '#120306'], [0.85, '#3A0610'], [1, '#100204']]);
        add(c, () => { blot(c, w * 0.5, h * 0.95, w * 0.8, '#C2182E', 0.5 + k * 0.08); });
        add(c, () => { for (let i = 0; i < 20 + k * 8; i++) { const x = R() * w, y = R() * h, s = w * (0.06 + R() * 0.14); c.globalAlpha = 0.22 + R() * 0.2; blitSized(c, puffSprite('rgba(200,20,40,'), x - s, y - s * 0.5, s * 2, s); } });
        add(c, () => { for (let i = 0; i < 8; i++) { let x = R() * w, y = h; c.strokeStyle = '#FF3B4E'; c.lineWidth = 1.2 * w / 300; c.globalAlpha = 0.35; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 8; j++) { x += (R() - 0.5) * 30 * w / 300; y -= h * 0.08; c.lineTo(x, y); } c.stroke(); } });
        c.fillStyle = lin(c, 0, h * 0.8, 0, h, [[0, '#14060A'], [1, '#050102']]); c.fillRect(0, h * 0.8, w, h * 0.2);
        cracks(c, w, h * 0.82, h, 8 + k * 3, R, '#FF3B4E', 0.85);
        return { fy: h * 0.88, light: '#FF3B4E', grade: ['#FF3B4E', 0.12] };
      }, front(c, w, h, k, R) { particles(c, w, h, 24 + k * 10, R, 'ember', ['#FF3B4E', '#FF8A8A'], { s: 0.8 }); } },
    // Raphael: the galaxy, a river of stars across the sky, spires far below, a ring of light
    sagittarius: { back(c, w, h, k, R) {
        // a moonlit meadow under the milky way, shooting stars falling like arrows
        sky(c, w, h, [[0, '#070620'], [0.45, '#17124A'], [0.72, '#34277A'], [0.84, '#5A46A6'], [1, '#120C34']]);
        band(c, -w * 0.1, h * 0.08, w * 1.1, h * 0.62, w * 0.4, ['#7A62D0', '#4A5AD8', '#B98AE8', '#BFA8FF'], 50, R, 0.2);
        stars(c, w, h, 170, R, { y1: 0.8, glow: '#E8E0FF' });
        band(c, -w * 0.1, h * 0.08, w * 1.1, h * 0.62, w * 0.1, ['#FFFFFF', '#E8E0FF'], 24, R, 0.16);
        crescent(c, w * 0.2, h * 0.16, Math.min(w, h) * 0.1, '#FFF0C0', '#C9A24A', '#FFE9A8');
        if (k >= 2) add(c, () => { const n = 3 + k * 3, u = w / 300; for (let i = 0; i < n; i++) { const x = w * 0.15 + R() * w, y = R() * h * 0.62, L = (30 + R() * 50) * u; c.save(); c.translate(x, y); c.rotate(0.95); c.globalAlpha = 0.3 + R() * 0.4; blitSized(c, beamSprite('#FFE9A8'), -L, -1.6 * u, L, 3.2 * u); c.restore(); star4(c, x, y, 0.9 * u, '#FFFFFF', 0.8); } });
        const hills = (base, amp, f, ph, top, bot, rim) => { c.beginPath(); c.moveTo(-10, h + 10); for (let x = -10; x <= w + 10; x += 6) c.lineTo(x, base - amp * (0.55 + 0.3 * Math.sin(x / w * f + ph) + 0.15 * Math.sin(x / w * f * 2.7 + ph * 2))); c.lineTo(w + 10, h + 10); c.closePath(); c.fillStyle = lin(c, 0, base - amp, 0, h, [[0, top], [1, bot]]); c.fill();
          add(c, () => { c.strokeStyle = rim; c.globalAlpha = 0.45; c.lineWidth = 1.2 * w / 300; c.beginPath(); for (let x = -10; x <= w + 10; x += 6) { const y = base - amp * (0.55 + 0.3 * Math.sin(x / w * f + ph) + 0.15 * Math.sin(x / w * f * 2.7 + ph * 2)); x > -10 ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }); };
        hills(h * 0.8, h * 0.14, 6, 1, '#0E0A30', '#040216', '#BFA8FF');
        hills(h * 0.87, h * 0.07, 9, 3, '#07051C', '#020110', '#E8E0FF');
        add(c, () => { for (let i = 0; i < 46; i++) { const x = R() * w, y = h * 0.84 + R() * h * 0.16; blot(c, x, y, (1.4 + R() * 2.4) * w / 300, i % 3 ? '#BFA8FF' : '#FFE9A8', 0.5); } });
        return { fy: h * 0.9, light: '#E8E0FF', grade: ['#7A62D0', 0.1], scale: k === 1 ? 1.08 : 0.94 };
      }, front(c, w, h, k, R) { particles(c, w, h, 22 + k * 10, R, 'spark', ['#E8E0FF', '#BFA8FF'], { s: 0.9 }); } },
    // Mammon: a storm over a dark sea, golden lightning and a rain of coins
    capricorn: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#060E14'], [0.45, '#18303C'], [0.66, '#7A6A3A'], [0.72, '#2A3A3A'], [1, '#060C10']]);
        for (let i = 0; i < 16; i++) { const x = R() * w, y = h * (0.05 + R() * 0.4), s = w * (0.15 + R() * 0.18); c.globalAlpha = 0.55; blitSized(c, puffSprite('rgba(10,22,30,'), x - s, y - s * 0.6, s * 2, s * 1.2); } c.globalAlpha = 1;
        const s0 = Math.floor(R() * 99); for (let i = 0; i < 1 + k; i++) bolt(c, w * (0.15 + R() * 0.7), 0, w * (0.1 + R() * 0.8), h * 0.68, s0 + i * 5, '#FFE37A', 30 * w / 300);
        add(c, () => blot(c, w * 0.5, h * 0.66, w * 0.6, '#FFD447', 0.25));
        waterSurface(c, w, h * 0.68, h, '#1E3A44', '#04080C', R, { n: 90, col: '#FFE37A', a: 0.3 });
        add(c, () => { for (let i = 0; i < 6; i++) { const y = h * (0.7 + i * 0.05); c.globalAlpha = 0.25; c.strokeStyle = '#BFE6F0'; c.lineWidth = 1.4 * w / 300; c.beginPath(); for (let x = -10; x < w + 10; x += 6) c.lineTo(x, y - Math.abs(Math.sin(x * 0.04 + i * 1.7)) * 6 * w / 300); c.stroke(); } });
        rock(c, w * 0.5, h * 0.84, w * 0.5, w * 0.62, h * 0.2, '#3A4A50', R, { cap: 'rgba(190,220,230,.4)' });
        return { fy: h * 0.85, light: '#FFE37A', grade: ['#FFD447', 0.1] };
      }, front(c, w, h, k, R) { particles(c, w, h, 10 + k * 8, R, 'coin', ['#FFD447'], { s: 0.8 }); particles(c, w, h, 14, R, 'spark', ['#FFF7C2'], { s: 0.8 }); } },
    // Zadkiel: a celestial waterfall pouring stars into a glowing sea, auroras above
    aquarius: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#040A2A'], [0.4, '#0E2A70'], [0.7, '#1F5AB0'], [1, '#04102A']]);
        stars(c, w, h, 90, R, { y1: 0.6, glow: '#C9F3FF' });
        add(c, () => { for (let j = 0; j < 3; j++) { const y0 = h * (0.12 + j * 0.07), col = ['#5FFFD8', '#5FD4FF', '#B983F5'][j]; for (let i = 0; i < 40; i++) { const x = i / 40 * w, y = y0 + Math.sin(i * 0.3 + j) * h * 0.04; c.globalAlpha = 0.12; blitSized(c, beamSprite(col), x - 4, y, 8, h * 0.16); } } });
        const fx = w * 0.5; add(c, () => { for (let i = 0; i < 26; i++) { const x = fx + (R() - 0.5) * w * 0.22; c.globalAlpha = 0.18 + R() * 0.2; c.save(); c.translate(x, h * 0.05); c.rotate(Math.PI / 2); blitSized(c, beamSprite(R() < 0.5 ? '#9FE8FF' : '#FFFFFF'), 0, -w * 0.012, h * 0.68, w * 0.024); c.restore(); } blot(c, fx, h * 0.72, w * 0.35, '#C9F3FF', 0.55); });
        ridge(c, w, h * 0.72, h * 0.3, 3, R, '#0A1A40', '#081430', { rim: '#5FD4FF', rimA: 0.5, shape: x => Math.pow(Math.abs(x - 0.5) * 2, 1.3) + 0.05 });
        waterSurface(c, w, h * 0.72, h, '#1F5AB0', '#041028', R, { n: 110, col: '#C9F3FF', a: 0.38, rx: fx, rcol: '#FFFFFF' });
        return { fy: h * 0.83, light: '#C9F3FF', reflect: 0.3, grade: ['#5FD4FF', 0.12] };
      }, front(c, w, h, k, R) { particles(c, w, h, 14 + k * 6, R, 'bubble', ['#DDF6FF'], { s: 0.8 }); particles(c, w, h, 14, R, 'spark', ['#C9F3FF'], { s: 0.7 }); } },
    // Leviathan: the deep, cosmic ocean: shafts of light from above, stars in the water, broken chains drifting
    pisces: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#4A3A9A'], [0.25, '#2A1E64'], [0.65, '#120C34'], [1, '#04020E']]);
        rays(c, w * 0.5, -h * 0.05, 12, h * 1.1, w * 0.07, '#BFB0FF', 0.12 + k * 0.03, R, Math.PI * 0.32, Math.PI * 0.68);
        stars(c, w, h, 110, R, { y1: 1, a: 0.7, glow: '#B9A6FF' });
        nebula(c, w * 0.5, h * 0.5, w * 0.45, h * 0.3, ['#6A5AB0', '#3A2E80', '#B983F5'], 16, R, 0.22);
        const link = (x, y, s, a) => { c.save(); c.translate(x, y); c.rotate(a); c.lineWidth = s * 0.45; c.strokeStyle = lin(c, -s, -s, s, s, [[0, '#E8E0FF'], [0.5, '#8A7AB8'], [1, '#3A2E5C']]); c.beginPath(); c.ellipse(0, 0, s * 1.2, s * 0.7, 0, 0.6, TAU - 0.4); c.stroke(); c.restore(); };
        for (let i = 0; i < 6 + k * 2; i++) link(R() * w, h * (0.1 + R() * 0.8), w * (0.012 + R() * 0.02), R() * TAU);
        return { fy: h * 0.8, light: '#EAF2FF', float: true, grade: ['#7A62D0', 0.12] };
      }, front(c, w, h, k, R) { particles(c, w, h, 20 + k * 8, R, 'bubble', ['#DDE6FF'], { s: 0.9 }); } },
    // Bahamut: the summit of the Tower of Oblivion, which has no ceiling: the whole night sky, the serpent-bearer's stars
    // drawn across it, and the round night-blue platform inlaid with gold far below
    ophiuchus: { back(c, w, h, k, R) {
        sky(c, w, h, [[0, '#010309'], [0.35, '#06112A'], [0.62, '#0E2050'], [0.78, '#1A2A5C'], [1, '#05060F']]);
        nebula(c, w * 0.5, h * 0.36, w * 0.62, h * 0.2, ['#2AD6C8', '#3F6FFF', '#B05CFF', '#FFD36B'], 22, R, 0.16 + k * 0.05);
        stars(c, w, h, 150, R, { y1: 0.82, a: 0.85, glow: '#BFF4FF' });
        // the constellation, faint, behind it
        const CS = CONSTELLATION.ophiuchus, cx0 = w * 0.18, cy0 = h * 0.06, cw = w * 0.64, chh = h * 0.6;
        add(c, () => { c.strokeStyle = 'rgba(255,233,168,.22)'; c.lineWidth = Math.max(1, w / 300); CS.e.forEach(([i, j]) => { c.beginPath(); c.moveTo(cx0 + CS.p[i][0] * cw, cy0 + CS.p[i][1] * chh); c.lineTo(cx0 + CS.p[j][0] * cw, cy0 + CS.p[j][1] * chh); c.stroke(); }); CS.p.forEach(([x, y]) => star4(c, cx0 + x * cw, cy0 + y * chh, w * 0.012, '#FFF4D0', 0.75)); });
        rays(c, w * 0.5, h * 0.42, 14, h * 0.95, w * 0.045, '#FFE9A8', 0.05 + k * 0.025, R, 0, TAU);
        // the platform: a broad disc of night-blue stone ringed in gold, seen from above the horizon
        const py = h * 0.84, prx = w * 0.62, pry = h * 0.1;
        c.save(); c.translate(w * 0.5, py); c.scale(1, pry / prx);
        c.fillStyle = rad(c, 0, 0, prx, [[0, '#2A2F5C'], [0.7, '#1C2046'], [1, '#0B0D22']]); c.beginPath(); c.arc(0, 0, prx, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(232,184,80,.85)'; c.lineWidth = w * 0.012; c.beginPath(); c.arc(0, 0, prx * 0.96, 0, TAU); c.stroke();
        c.lineWidth = w * 0.006; c.beginPath(); c.arc(0, 0, prx * 0.62, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, prx * 0.3, 0, TAU); c.stroke();
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; c.beginPath(); c.moveTo(Math.cos(a) * prx * 0.3, Math.sin(a) * prx * 0.3); c.lineTo(Math.cos(a) * prx * 0.96, Math.sin(a) * prx * 0.96); c.stroke(); }
        c.restore();
        add(c, () => { blot(c, w * 0.5, py, w * 0.4, '#5FFFE8', 0.12 + k * 0.04); });
        return { fy: h * 0.8, light: '#FFE9A8', float: true, grade: ['#5FFFE8', 0.08] };
      }, front(c, w, h, k, R) { particles(c, w, h, 16 + k * 8, R, 'spark', ['#FFF4D0', '#BFF4FF'], { s: 0.9 }); } },
  };

  /* ---- composition ---- */
  const canvases = new Map(), urls = new Map();
  function render(id, k, w, h, o) {
    o = o || {}; k = clamp(k | 0, 1, 3); const D = o.dpr || 2, cv = document.createElement('canvas'); cv.width = Math.round(w * D); cv.height = Math.round(h * D);
    const c = cv.getContext('2d'); c.scale(D, D);
    const A = ANIMAS[id], S = SC[id], R = mulberry32((id.length * 131 + k * 17) >>> 0);
    const lay = S.back(c, w, h, k, R);
    const size = Math.min(h * [0.42, 0.5, 0.56][k - 1], w * [0.62, 0.66, 0.66][k - 1]) * (o.zoom || 1) * (lay.scale || 1), cx = w / 2, fy = lay.float ? lay.fy - size * 0.08 : lay.fy;
    // the creature's light: a bloom behind it, and rays when it has ascended
    add(c, () => { blot(c, cx, fy - size * 0.55, size * (1.2 + k * 0.15), lay.light, 0.14 + k * 0.05); blot(c, cx, fy - size * 0.55, size * 0.6, A.glow, 0.16 + k * 0.06); });
    if (k >= 2) rays(c, cx, fy - size * 0.6, k === 3 ? 18 : 10, size * (k === 3 ? 1.9 : 1.4), size * 0.07, mix(lay.light, A.glow, 0.5), k === 3 ? 0.11 : 0.07, R, 0, TAU);
    if (!lay.float && !lay.reflect) shadowAt(c, cx, fy + size * 0.02, size * 0.5, 0.55);
    if (lay.reflect) { const tmp = document.createElement('canvas'); tmp.width = cv.width; tmp.height = cv.height; const tc = tmp.getContext('2d'); tc.scale(D, D); AnimaArt.draw(tc, id, k, cx, fy, size, 0.7, { dpr: D, aura: false, yaw: 0.42 }); c.save(); c.globalAlpha = lay.reflect; c.translate(0, fy * 2 + size * 0.04); c.scale(1, -1); c.drawImage(tmp, 0, 0, w, h); c.restore(); c.fillStyle = lin(c, 0, fy, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(4,6,20,.6)']]); c.fillRect(0, fy, w, h - fy); }
    AnimaArt.draw(c, id, k, cx, fy, size, 0.7, { dpr: D, bloom: size * 0.07, auraA: 0.6, yaw: 0.42 });
    S.front(c, w, h, k, mulberry32(id.length * 7 + k));
    // grade, vignette, grain
    if (lay.grade) { c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = rgba(lay.grade[0], lay.grade[1] * 1.4); c.fillRect(0, 0, w, h); c.restore(); }
    const vg = c.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.3, w / 2, h * 0.5, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(4,2,12,.6)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
    c.save(); c.globalAlpha = 0.045; c.globalCompositeOperation = 'overlay'; c.fillStyle = T.grain(c); c.fillRect(0, 0, w, h); c.restore();
    return cv;
  }
  function canvas(id, k, w, h, o) { const key = `${id}${k}|${w}x${h}|${(o && o.zoom) || 1}`; let cv = canvases.get(key); if (!cv) { cv = render(id, k, w, h, o); canvases.set(key, cv); } return cv; }
  function portrait(id, k, w, h, o) { const key = `${id}${k}|${w}x${h}|${(o && o.zoom) || 1}`; let u = urls.get(key); if (!u) { u = canvas(id, k, w, h, o).toDataURL('image/jpeg', 0.9); urls.set(key, u); } return u; }
  // a soft-edged version for the summoning cinematic
  function splash(id, k, w, h) { const key = `splash|${id}${k}|${w}x${h}`; let cv = canvases.get(key); if (cv) return cv; const src = render(id, k, w, h, { dpr: 1.5 }); cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; const c = cv.getContext('2d'); c.drawImage(src, 0, 0); c.globalCompositeOperation = 'destination-in'; const g = c.createRadialGradient(cv.width / 2, cv.height * 0.5, Math.min(cv.width, cv.height) * 0.18, cv.width / 2, cv.height * 0.5, Math.max(cv.width, cv.height) * 0.55); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height); canvases.set(key, cv); return cv; }
  return { render, canvas, portrait, splash };
})();
