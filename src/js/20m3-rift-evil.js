/* ---------- the Rift-touched: the mini bosses of the rift dungeons ----------
   Cocopets the rift has got into: a pet born of a random seed, grown a few stages, then soured. Its fur gone dark, one
   sickly accent colour (eyes, gems, crest), angry brows, fangs or a monster mouth, horns more often than not. It is drawn
   by the very rig the player's own pets walk with (feet stepping, arms swinging and lifting to strike, wings beating),
   only three times the size, wreathed in rift smoke, its eyes burning.
   RiftEvil.make(seed) -> { form, name, acc, sprites (once loaded), ready }; RiftEvil.draw(c, m, X, Y, r, t, me) */
const RiftEvil = (() => {
  const ACC = ['#FF3B5C', '#B23CFF', '#7CFF4F', '#FF8A1F', '#39E0FF', '#FFE14D'];
  const NA = ['Gloom', 'Hex', 'Mire', 'Grim', 'Vile', 'Murk', 'Rot', 'Dread', 'Wrath', 'Bane', 'Blight', 'Spite', 'Scorn', 'Hollow', 'Rue', 'Sulk', 'Gnash', 'Ash'];
  const NB = ['fang', 'paw', 'tail', 'whisker', 'maw', 'claw', 'bun', 'puff', 'nib', 'mop', 'sprout', 'burr', 'fuzz', 'button', 'bean', 'muffin'];
  const TITLE = ['the Rift-Touched', 'the Hollowed', 'the Sour', 'the Gnawing', 'the Changeling', 'the Unkind', 'the Rotten Pet', 'the Lost One'];
  const pick = (R, L) => L[Math.floor(R() * L.length)];
  const MA = ['MK-II', 'Mk-IX', 'Unit 7', 'Model Zero', 'V-13', 'Prime'], MT = ['the Ironclad', 'the Engine-Born', 'the Thunder Frame', 'the Overclocked', 'the Steel Changeling', 'the Arc Titan'], MACC = ['#39E0FF', '#C452FF', '#FF3B5C', '#7CFF4F', '#FFB23F'];
  function form(seed, o) {
    const R = mulberry32((seed >>> 0) || 1); let f = makeForm(R); const top = 4 + Math.floor(R() * 2);
    for (let s = 2; s <= top; s++) f = evolveForm(f, R, s).form;
    f = JSON.parse(JSON.stringify(f));
    const h = R() * 360, acc = pick(R, ACC);
    f.pal = { id: 'evil', name: 'Rift-touched', r: 0, base: hsl2hex(h, 18 + R() * 20, 25 + R() * 9), dk: hsl2hex(h, 26, 13), lt: hsl2hex(h, 18, 38), belly: hsl2hex(h, 12, 44), sec: acc, inner: hsl2hex(h, 28, 26), cheek: mixHex(acc, '#000000', 0.45), iris: acc };
    if (!['fang', 'fangs', 'tusks', 'zigzag', 'grin'].includes(f.mouth)) f.mouth = pick(R, ['fangs', 'zigzag', 'grin', 'fangs', 'tusks']);
    if (['heart', 'star', 'sparkle', 'sleepy', 'button', 'dot', 'oval', 'big'].includes(f.eyes.t)) f.eyes.t = pick(R, ['fierce', 'glow', 'cat', 'fierce', 'cyclops', 'triple']);
    if (f.cheeks === 'blush' || f.cheeks === 'dots' || f.cheeks === 'swirl') f.cheeks = pick(R, ['marks', 'none', 'whiskers']);
    if (f.nose === 'heart') f.nose = 'tri';
    const X = f.x || (f.x = {}); delete X.gold; delete X.leg; delete X.aura; delete X.lights; delete X.halo;
    if (!X.horns && R() < 0.75) X.horns = { t: pick(R, ['devil', 'ram', 'goat', 'bull', 'devil']), size: 1 + R() * 0.25 };
    if (X.wings) X.wings.t = pick(R, ['bat', 'bat', 'flame', 'crystal']); else if (R() < 0.35) X.wings = { t: 'bat', size: 1, n: 1 };
    if (f.tail && R() < 0.5) f.tail.t = 'devil';
    if (o && o.mecha) { // a giant mecha of a pet: gunmetal plating, a neon accent, glowing eyes, spikes and lightning
      const a2 = o.acc || pick(R, MACC); const hue = pick(R, ['#5A6FA8', '#7A5AA8', '#4E8A8A', '#A85A6A', '#6A7A9A', '#8A7A5A']); f.pal = { id: 'mecha', name: 'Mecha', r: 0, base: hue, dk: mixHex(hue, '#10121A', 0.55), lt: mixHex(hue, '#E6ECF8', 0.45), belly: mixHex(hue, '#C8D0E0', 0.35), sec: a2, inner: mixHex(hue, '#10121A', 0.7), cheek: mixHex(a2, '#000000', 0.5), iris: a2 };
      if (!['fierce', 'glow', 'cyclops', 'triple'].includes(f.eyes.t)) f.eyes.t = pick(R, ['glow', 'cyclops', 'fierce', 'glow']);
      X.horns = { t: pick(R, ['devil', 'ram', 'bull']), size: 1.15 + R() * 0.2 }; if (X.wings) X.wings.t = 'crystal';
      return { form: f, acc: a2, mecha: true, name: `${pick(R, NA)}${pick(R, NB)} ${pick(R, MA)} ${pick(R, MT)}` }; }
    return { form: f, acc, name: `${pick(R, NA)}${pick(R, NB)} ${pick(R, TITLE)}` };
  }
  /* a Rift-touched pet for a mini boss; its pictures are made at once, in the background (a few frames) */
  function make(seed, o) {
    const E = Object.assign(form(seed, o), { sprites: null, ready: false, seed });
    loadSprites(E.form, { brows: 'angry' }).then(sp => { E.sprites = sp; return makeRig(E.form, { brows: 'angry' }).then(rg => { sp.rig = rg; E.ready = true; }, () => { E.ready = true; }); }, () => {});
    return E;
  }
  /* drawn over the boss's spot: its feet on the floor below its centre, its body about two and a half radii tall */
  function draw(c, m, X, Y, r, t, me) {
    const E = m.evil; if (!E) return false;
    const S = E.sprites, h = r * 2.5, foot = Y + r * 0.75, sleeping = m.act === 'sleep', stun = m.stunT > 0 && m.act === 'stunned';
    const vx = m._px != null ? (m.x - m._px) * 60 : 0, vy = m._py != null ? (m.y - m._py) * 60 : 0; m._px = m.x; m._py = m.y; const moving = Math.hypot(vx, vy) > 0.2 && !sleeping && !stun;
    m.ewalk = (m.ewalk || 0) + (moving ? 0.16 : 0.03); m.ewing = (m.ewing || 0) + (moving ? 0.22 : 0.09);
    if (Math.abs(vx) > 0.15) m.eface = vx < 0 ? -1 : 1; else if (me) m.eface = me.x < m.x ? -1 : 1;
    // an attack in progress lifts its arms (a wind-up, then the strike)
    const act = m.act || '', striking = !sleeping && !stun && act !== 'move' && act !== 'idle' && act !== 'enter' && act !== 'chase';
    m.ecast = striking ? Math.min(1, (m.ecast || 0) + 0.06) : Math.max(0, (m.ecast || 0) - 0.08);
    // the rift's smoke about it, and a dark pool under it
    c.save();
    const sm = glowSprite('#1A0A2A'); c.globalAlpha = 0.55; c.drawImage(sm, X - r * 1.9, foot - r * 0.9, r * 3.8, r * 1.5);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 + 0.08 * Math.sin(t * 3 + (m.seedT || 0)); blitSized(c, glowSprite(E.acc), X - r * 1.6, Y - r * 1.9, r * 3.2, r * 3.4);
    c.globalCompositeOperation = 'source-over'; c.restore();
    // the body
    const breathe = Math.sin(t * 2.2) * 0.03, step = moving ? Math.sin(m.ewalk * 2) * 0.05 : 0, hitSq = m.flash > 0 ? 0.08 : 0;
    let sxk = (1 + breathe + step + hitSq), syk = (1 - breathe - step * 0.8 - hitSq), rot = stun ? Math.sin(t * 5) * 0.12 : moving ? (vx > 0 ? 0.05 : vx < 0 ? -0.05 : 0) : 0;
    if (m.ecast > 0) { syk *= 1 + 0.06 * m.ecast; sxk *= 1 - 0.03 * m.ecast; }
    const bob = moving ? Math.abs(Math.sin(m.ewalk)) * r * 0.08 : 0;
    if (E.mecha) drawMechaBack(c, E, X, foot - bob, h, t, m);
    if (S && S.rig && S.rig.front && S.rig.front.normal) {
      c.save(); c.translate(X, foot - bob); if (rot) { c.translate(0, -h * 0.5); c.rotate(rot); c.translate(0, h * 0.5); } c.scale((m.eface < 0 ? -1 : 1) * sxk, syk);
      if (sleeping) c.globalAlpha = 0.85;
      drawPetRig(c, S.rig, S, h, { face: stun ? 'hurt' : 'normal', pose: { walk: m.ewalk, moving, t, cast: m.ecast > 0 ? 0.35 + 0.3 * m.ecast : 0, ult: m.ecast > 0.8, wingPh: m.ewing, wingAmp: moving ? 16 : 9 } });
      c.restore();
      if (E.mecha) { const sz = Math.ceil(h * 2.4), off = E.off && E.off.width === sz ? E.off : (E.off = Object.assign(document.createElement('canvas'), { width: sz, height: sz })), o2 = off.getContext('2d');
        o2.setTransform(1, 0, 0, 1, 0, 0); o2.globalAlpha = 1; o2.globalCompositeOperation = 'source-over'; o2.clearRect(0, 0, sz, sz); o2.save(); o2.translate(sz / 2, sz * 0.86); if (rot) { o2.translate(0, -h * 0.5); o2.rotate(rot); o2.translate(0, h * 0.5); } o2.scale((m.eface < 0 ? -1 : 1) * sxk, syk);
        drawPetRig(o2, S.rig, S, h, { face: stun ? 'hurt' : 'normal', pose: { walk: m.ewalk, moving, t, cast: m.ecast > 0 ? 0.35 + 0.3 * m.ecast : 0, ult: m.ecast > 0.8, wingPh: m.ewing, wingAmp: moving ? 16 : 9 } }); o2.restore();
        chrome(c, E, off, sz, h, t, X - sz / 2, foot - bob - sz * 0.86); }
    } else if (S && S.normal && S.normal.img) {
      c.save(); c.translate(X, foot - bob); c.scale((m.eface < 0 ? -1 : 1) * sxk, syk); const s = S.normal, [vx0, vy0, vw, vh] = s.vb, k = h / S.bodyTop; c.drawImage(s.img, vx0 * k, vy0 * k, vw * k, vh * k); c.restore();
    } else {
      // (its pictures still being made: a shape of shadow)
      c.save(); c.fillStyle = 'rgba(20,10,30,.85)'; c.beginPath(); c.ellipse(X, foot - h * 0.45, h * 0.38, h * 0.48, 0, 0, Math.PI * 2); c.fill(); c.restore();
    }
    // burning eyes: a glow of its accent over its face, brighter as it winds up
    c.save(); c.globalCompositeOperation = 'lighter'; const ey = foot - bob - h * 0.62, ek = 0.25 + 0.25 * Math.sin(t * 4) + 0.5 * (m.ecast || 0);
    c.globalAlpha = Math.min(1, ek); blitSized(c, glowSprite(E.acc), X - h * 0.32, ey - h * 0.14, h * 0.64, h * 0.28); c.restore();
    if (m.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; blitSized(c, glowSprite('#FFFFFF'), X - h * 0.5, foot - h * 1.05, h, h); c.restore(); }
    if (E.mecha) drawMechaFront(c, E, X, foot - bob, h, t, m);
    return true;
  }
  /* the mecha's plating, laid over the rig's silhouette only: a steel sheen, panel seams, rivets, a travelling glint */
  /* cel-shaded metal over the rig's silhouette, in the toon style of the rift's bosses: a flat steel base, a hard-edged
     shadow on the side away from the light and a hard-edged lit band on the side toward it (both cut from the
     silhouette shifted against itself), flat white glints, two plate seams, a neon seam */
  const cv2 = (E, k, sz) => { const o = E[k] && E[k].width === sz ? E[k] : (E[k] = Object.assign(document.createElement('canvas'), { width: sz, height: sz })); const x = o.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, sz, sz); return x; };
  const band = (E, key, off, sz, dx, dy, col) => { const x = cv2(E, key, sz); x.drawImage(off, 0, 0); x.globalCompositeOperation = 'destination-out'; x.drawImage(off, dx, dy); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, sz, sz); return E[key]; };
  function chrome(c, E, off, sz, h, t, ox, oy) { const acc = E.acc, bot = sz * 0.86, d = h * 0.09;
    // a light steel tint over the body (its own colours, eyes and gems show through)
    const L = cv2(E, 'ml', sz); L.drawImage(off, 0, 0); L.globalCompositeOperation = 'source-in'; L.fillStyle = '#A8B4CC'; L.fillRect(0, 0, sz, sz);
    // hard light and shadow bands (light from the upper left)
    const sh = band(E, 'sh', off, sz, -d, -d * 0.8, '#3C4458'), core = band(E, 'sc', off, sz, -d * 0.35, -d * 0.3, '#262B3A'), lt = band(E, 'lt', off, sz, d * 0.7, d * 0.6, '#C9D3E6'), rim = band(E, 'rm', off, sz, d * 0.2, d * 0.18, '#F4F8FF');
    // a bold ink outline round the whole silhouette, like the toon bosses
    const ink = cv2(E, 'ink', sz), q = Math.max(2, h * 0.016); for (let a = 0; a < 8; a++) ink.drawImage(off, Math.cos(a * Math.PI / 4) * q, Math.sin(a * Math.PI / 4) * q); ink.globalCompositeOperation = 'destination-out'; ink.drawImage(off, 0, 0); ink.globalCompositeOperation = 'source-in'; ink.fillStyle = '#14161E'; ink.fillRect(0, 0, sz, sz);
    c.save(); c.globalAlpha = 0.22; c.drawImage(E.ml, ox, oy); c.globalAlpha = 0.5; c.drawImage(sh, ox, oy); c.globalAlpha = 0.35; c.drawImage(core, ox, oy); c.globalAlpha = 0.55; c.drawImage(lt, ox, oy); c.globalAlpha = 0.85; c.drawImage(rim, ox, oy); c.globalAlpha = 1; c.drawImage(E.ink, ox, oy); c.restore(); }
  /* behind it: a crown of steel spikes fanning out from its back, a thruster glow under it */
  function drawMechaBack(c, E, X, foot, h, t, m) { c.save(); const cx = X, cy = foot - h * 0.6;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; blitSized(c, glowSprite(E.acc), cx - h * 0.9, foot - h * 0.2, h * 1.8, h * 0.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.3, L = h * (0.62 + (i % 2 ? 0.12 : 0.28)) * (1 + 0.03 * Math.sin(t * 3 + i)), w = h * 0.07, x0 = cx + Math.cos(a) * h * 0.25, y0 = cy + Math.sin(a) * h * 0.25, x1 = cx + Math.cos(a) * L, y1 = cy + Math.sin(a) * L, nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
      c.beginPath(); c.moveTo(x0 + nx, y0 + ny); c.lineTo(x1, y1); c.lineTo(x0 - nx, y0 - ny); c.closePath(); const gr = c.createLinearGradient(x0 + nx, y0 + ny, x0 - nx, y0 - ny); gr.addColorStop(0, '#B8C2D6'); gr.addColorStop(0.5, '#5A6278'); gr.addColorStop(1, '#2A2F3E'); c.fillStyle = gr; c.fill(); c.strokeStyle = '#14161E'; c.lineWidth = Math.max(1.5, h * 0.012); c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = E.acc; c.globalAlpha = 0.7; c.lineWidth = Math.max(1, h * 0.01); c.beginPath(); c.moveTo((x0 + x1) / 2, (y0 + y1) / 2); c.lineTo(x1, y1); c.stroke(); c.restore(); }
    c.restore(); }
  /* over it: shoulder spikes, lightning crawling over its plates and leaping off its spikes, burning eyes */
  function drawMechaFront(c, E, X, foot, h, t, m) { c.save(); const k = 0.6 + 0.4 * (m.ecast || 0);
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    const n = 3 + Math.floor((m.ecast || 0) * 3); for (let i = 0; i < n; i++) { const s = Math.floor(t * 12) + i * 17, rr = q => { const v = Math.sin(s * 12.9898 + q * 78.233) * 43758.5453; return v - Math.floor(v); };
      const a0 = rr(1) * 6.283, a1 = a0 + (rr(2) - 0.5) * 2.4, r0 = h * (0.2 + rr(3) * 0.25), r1 = h * (0.35 + rr(4) * 0.45), cy = foot - h * 0.5, x0 = X + Math.cos(a0) * r0, y0 = cy + Math.sin(a0) * r0 * 1.2, x1 = X + Math.cos(a1) * r1, y1 = cy + Math.sin(a1) * r1 * 1.2;
      for (const [w, col, a] of [[h * 0.05, E.acc, 0.35 * k], [h * 0.016, '#FFFFFF', 0.95 * k]]) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); for (let j = 1; j <= 5; j++) { const u = j / 5; c.lineTo(x0 + (x1 - x0) * u + (j < 5 ? (rr(10 + j) - 0.5) * h * 0.12 : 0), y0 + (y1 - y0) * u + (j < 5 ? (rr(20 + j) - 0.5) * h * 0.12 : 0)); } c.stroke(); } }
    // its eyes: twin hard beams of light
    const ey = foot - h * 0.62, ek = 0.3 + 0.2 * Math.sin(t * 6) + 0.4 * (m.ecast || 0); c.globalAlpha = Math.min(1, ek); blitSized(c, glowSprite(E.acc), X - h * 0.36, ey - h * 0.16, h * 0.72, h * 0.32); 
    c.restore(); }
  return { make, draw, form };
})();
