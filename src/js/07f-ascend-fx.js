/* ---------- the Ascension ceremony ----------
   The Anima's constellation draws itself while light spirals in from every side. The old form rises, burns white and
   collapses into a single star; the star bursts in a flash and a shockwave, and the new form steps out of the light
   with god-rays turning behind it. Unsealing plays the same rite with only the star at its heart. Tap to close. */
let ascending = false;
function ascendCinematic(id, k, done) {
  const A = ANIMAS[id], heaven = A.realm === 'heaven', from = k - 1, calm = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const roman = ['', 'I', 'II', 'III'][k];
  ascending = true;
  const ov = document.createElement('div'); ov.className = `asc-ov ${A.realm}`; ov.style.setProperty('--ac', A.color); ov.style.setProperty('--ag', A.glow);
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', `${A.name} ${from ? 'ascends' : 'is unsealed'}: ${A.forms[k - 1]}`);
  ov.innerHTML = `<canvas aria-hidden="true"></canvas><div class="asc-cap">
    <p class="asc-eyebrow">${from ? `Ascension ${roman}` : 'Unsealed'} · ${esc(A.sign)}</p>
    <h2>${esc(A.forms[k - 1])}</h2>
    <p class="asc-sub">${k === 3 ? `${esc(A.name)}'s final form` : `${esc(A.name)} ${esc(A.title)}`}</p>
    <p class="asc-stars" aria-label="${k} of 3 stars">${[0, 1, 2].map(i => i < k ? `<span style="--i:${i}">★</span>` : '<i>★</i>').join('')}</p>
    <p class="asc-gain">${from ? `Power ×${ANIMA_POWER[from]} → ×${ANIMA_POWER[k]} · Summon ${ANIMA_DUR[from]}s → ${ANIMA_DUR[k]}s` : `Power ×${ANIMA_POWER[k]} · Summon ${ANIMA_DUR[k]}s`}</p>
    <p class="asc-tap">Tap to continue</p></div>`;
  document.body.appendChild(ov);
  const cv = ov.querySelector('canvas'), c = cv.getContext('2d'), oc = document.createElement('canvas'), o = oc.getContext('2d');
  let W = 0, H = 0, D = 1;
  const fit = () => { D = Math.min(2, window.devicePixelRatio || 1); W = ov.clientWidth || innerWidth; H = ov.clientHeight || innerHeight; [cv, oc].forEach(x => { x.width = Math.round(W * D); x.height = Math.round(H * D); }); };
  fit(); addEventListener('resize', fit);
  requestAnimationFrame(() => ov.classList.add('in'));
  // particles that spiral in, and others that burst out
  const R = mulberry32((Date.now() & 0xffff) + id.length), cols = [A.glow, A.color, '#FFFFFF'];
  const inflow = Array.from({ length: calm ? 30 : 80 }, () => ({ a: R() * Math.PI * 2, d: 0.55 + R() * 0.6, t0: R() * 1.7, dur: 0.7 + R() * 0.7, s: 1 + R() * 2.4, col: cols[Math.floor(R() * 3)], spin: (R() < 0.5 ? -1 : 1) * (0.8 + R()) }));
  const burst = Array.from({ length: calm ? 30 : 90 }, () => ({ a: R() * Math.PI * 2, v: 0.25 + R() * 0.9, s: 1 + R() * 3, col: cols[Math.floor(R() * 3)], life: 0.8 + R() * 1.2 }));
  const motes = Array.from({ length: 26 }, () => ({ x: R(), y: R(), s: 0.6 + R() * 1.8, sp: 0.03 + R() * 0.06, ph: R() * 6 }));
  const CON = CONSTELLATION[id];
  const T_BURST = 2.3, T_CAP = 2.75, T_TAP = 3.4;
  let t0 = performance.now(), last = t0, raf = 0, sounded = {}, closing = false, shown = false;
  const once = (key, f) => { if (!sounded[key]) { sounded[key] = true; try { f(); } catch (e) {} } };
  const glowAt = (x, y, r, col, a) => { if (r <= 0 || a <= 0) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  // draw an Anima with a white-hot overlay (the light it is made of)
  const creature = (form, x, y, size, t, white, alpha) => {
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, oc.width, oc.height); o.setTransform(D, 0, 0, D, 0, 0);
    AnimaArt.draw(o, id, form, x, y, size, t, { dpr: D, bloom: size * 0.06, yaw: 0.42 + Math.sin(t * 0.6) * 0.25 });
    if (white > 0) { o.save(); o.globalCompositeOperation = 'source-atop'; o.globalAlpha = Math.min(1, white); o.fillStyle = '#FFFFFF'; o.fillRect(0, 0, W, H); o.restore(); }
    c.save(); c.globalAlpha = alpha == null ? 1 : alpha; c.drawImage(oc, 0, 0, W, H); c.restore();
  };
  function frame(now) {
    const T = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    const S = Math.min(W, H), size = Math.min(S * 0.64, H * 0.42), cx = W / 2, fy = H * 0.56, hy = fy - size * 0.5;
    c.setTransform(D, 0, 0, D, 0, 0);
    // the sky of its realm
    const bg = c.createRadialGradient(cx, hy, 0, cx, hy, Math.max(W, H) * 0.75);
    if (heaven) { bg.addColorStop(0, '#3B2F80'); bg.addColorStop(0.45, '#17123A'); bg.addColorStop(1, '#06040F'); } else { bg.addColorStop(0, '#3A1030'); bg.addColorStop(0.45, '#170816'); bg.addColorStop(1, '#040205'); }
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    motes.forEach(m => { const y = ((m.y - T * m.sp) % 1 + 1) % 1; c.globalAlpha = 0.35 + 0.35 * Math.sin(T * 2 + m.ph); c.fillStyle = m.s > 1.6 ? A.glow : '#FFFFFF'; c.beginPath(); c.arc(m.x * W, y * H, m.s, 0, Math.PI * 2); c.fill(); });
    c.globalAlpha = 1;
    const pre = Math.min(1, T / T_BURST), post = Math.max(0, T - T_BURST);
    // shake as the power builds
    const sh = calm ? 0 : T < T_BURST ? Math.pow(pre, 3) * 4 : Math.max(0, 6 * (1 - post / 0.5));
    c.save(); c.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    // god-rays turning behind
    const rayA = T < T_BURST ? Math.max(0, (T - 0.8) / 1.5) * 0.16 : 0.32 * Math.max(0.45, 1 - post / 3) ;
    if (rayA > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.translate(cx, hy); c.rotate(T * 0.25); const n = 16; for (let i = 0; i < n; i++) { c.rotate(Math.PI * 2 / n); c.globalAlpha = rayA * (0.55 + 0.45 * Math.sin(T * 1.7 + i * 2.1)); blitSized(c, beamSprite(i % 2 ? A.glow : '#FFFFFF'), 0, -S * 0.035, S * (0.7 + 0.25 * Math.sin(i * 1.3)), S * 0.07); } c.restore(); }
    // the constellation draws itself, line by line
    if (CON) { const box = S * 0.78, ox = cx - box / 2, oy = hy - box / 2, P = p => [ox + p[0] * box, oy + p[1] * box], fade = T < T_BURST ? 1 : Math.max(0.25, 1 - post / 1.2);
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      CON.e.forEach(([a, b], i) => { const u = Math.max(0, Math.min(1, (T - 0.15 - i * 0.12) / 0.3)); if (!u) return; const p = P(CON.p[a]), q = P(CON.p[b]); [[5, 0.12], [1.6, 0.6]].forEach(([w, al]) => { c.globalAlpha = al * fade; c.strokeStyle = A.glow; c.lineWidth = w; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u); c.stroke(); }); });
      c.restore();
      CON.p.forEach((p, i) => { const u = Math.max(0, Math.min(1, (T - 0.1 - i * 0.1) / 0.25)); if (!u) return; const [x, y] = P(p); glowAt(x, y, 9 * u, A.glow, 0.9 * fade); glowAt(x, y, 3 * u, '#FFFFFF', fade); }); }
    // a ring of the sign's power under its feet
    { const rr = size * 0.62, al = Math.min(1, T / 0.6) * (T < T_BURST ? 0.5 + pre * 0.5 : 1); c.save(); c.translate(cx, fy); c.scale(1, 0.3); c.globalCompositeOperation = 'lighter'; c.strokeStyle = A.glow; [[6, 0.12], [2, 0.6]].forEach(([w, a2]) => { c.globalAlpha = a2 * al; c.lineWidth = w; c.beginPath(); c.arc(0, 0, rr, 0, Math.PI * 2); c.stroke(); }); c.rotate(T * 0.6); c.globalAlpha = 0.5 * al; c.lineWidth = 2; for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.beginPath(); c.moveTo(rr * 0.86, 0); c.lineTo(rr * 0.94, 0); c.stroke(); } c.restore(); }
    // light spiralling in
    if (T < T_BURST + 0.1) inflow.forEach(p => { const u = (T - p.t0) / p.dur; if (u <= 0 || u >= 1) return; const e = u * u, d = p.d * S * (1 - e), a = p.a + p.spin * e * 2.2, x = cx + Math.cos(a) * d, y = hy + Math.sin(a) * d * 0.8; glowAt(x, y, p.s * 4, p.col, 0.7 * Math.sin(u * Math.PI)); glowAt(x, y, p.s, '#FFFFFF', 0.9); });
    // the old form: rising, burning white, collapsing into a star
    if (T < T_BURST) {
      const lift = Math.sin(Math.min(1, T / 1.6) * Math.PI / 2) * size * 0.08, white = Math.max(0, (T - 1.1) / 0.9), implode = Math.max(0, (T - 2.0) / 0.3), sc = 1 - implode * 0.85;
      glowAt(cx, hy - lift, size * (0.7 + pre * 0.6), A.glow, 0.25 + pre * 0.45);
      if (from) { c.save(); c.translate(cx, hy - lift); c.scale(sc, sc); c.translate(-cx, -(hy - lift)); creature(from, cx, fy - lift, size, T * 1.6, white, 1); c.restore(); }
      glowAt(cx, hy - lift, size * (0.12 + pre * 0.35 + implode * 0.5), '#FFFFFF', from ? white * 0.9 : 0.4 + pre * 0.6);
      once('hum', () => sfx.hum()); if (T > 1.1) once('sp', () => sfx.sparkle());
    } else {
      once('boom', () => { sfx.crash(); sfx.fanfare(); });
      // shockwaves and a burst of light
      for (let i = 0; i < 3; i++) { const u = (post - i * 0.12) / 0.9; if (u <= 0 || u >= 1) continue; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u) * 0.8; c.strokeStyle = i === 1 ? A.glow : '#FFFFFF'; c.lineWidth = 10 * (1 - u) + 1; c.beginPath(); c.ellipse(cx, hy, S * 0.9 * u, S * 0.9 * u * (i === 2 ? 0.35 : 1), 0, 0, Math.PI * 2); c.stroke(); c.restore(); }
      burst.forEach(p => { const u = post / p.life; if (u >= 1) return; const d = p.v * S * (1 - Math.pow(1 - u, 2)) * 0.7, x = cx + Math.cos(p.a) * d, y = hy + Math.sin(p.a) * d + u * u * S * 0.1; glowAt(x, y, p.s * 4, p.col, (1 - u) * 0.8); glowAt(x, y, p.s, '#FFFFFF', 1 - u); });
      // the new form steps out of the light
      const pop = post < 0.3 ? 0.7 + post / 0.3 * 0.38 : post < 0.6 ? 1.08 - (post - 0.3) / 0.3 * 0.08 : 1, white = Math.max(0, 1 - post / 0.7), bob = Math.sin(T * 1.6) * size * 0.015;
      glowAt(cx, hy, size * (1.1 + 0.05 * Math.sin(T * 2)), A.glow, 0.35 + white * 0.4);
      c.save(); c.translate(cx, fy); c.scale(pop, pop); c.translate(-cx, -fy); creature(k, cx, fy + bob, size, T * 1.6, white, 1); c.restore();
      // rising sparks of its light
      if (!calm) for (let i = 0; i < 12; i++) { const ph = (T * 0.35 + i / 12) % 1, x = cx + Math.sin(i * 2.4 + T * 0.5) * size * 0.75, y = fy - ph * size * 1.5; glowAt(x, y, 4, i % 2 ? A.glow : '#FFFFFF', Math.sin(ph * Math.PI) * 0.8); }
    }
    c.restore();
    // the flash
    if (post > 0 && post < 0.8) { c.fillStyle = '#FFFFFF'; c.globalAlpha = Math.pow(1 - post / 0.8, 2); c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    else if (T > T_BURST - 0.25 && T <= T_BURST) { c.fillStyle = '#FFFFFF'; c.globalAlpha = (T - (T_BURST - 0.25)) / 0.25 * 0.7; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    if (T > T_CAP && !shown) { shown = true; ov.classList.add('show'); }
    if (T > T_TAP) ov.classList.add('tap');
    if (T > 14) close();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  function close() {
    if (closing) return; closing = true; ov.classList.remove('in'); ov.classList.add('out');
    setTimeout(() => { cancelAnimationFrame(raf); removeEventListener('resize', fit); ov.remove(); ascending = false; if (done) done(); }, 380);
  }
  ov.addEventListener('click', () => { const T = (performance.now() - t0) / 1000; if (T > T_CAP) close(); else if (T < T_BURST - 0.3) t0 = performance.now() - (T_BURST - 0.3) * 1000; });   // a tap skips ahead to the burst
  return { close };
}
