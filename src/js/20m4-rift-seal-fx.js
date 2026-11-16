/* ---------- v388 R: the rift sealing, rebuilt as the party's combined ult (shared by every rift, coloured by its sigil) ----------
   riftSealing (20m) hands over to RiftSealFX.install(X, self, mod, o) with the same options { fall, sub, sigil, name, color,
   glow, wound, onFall }; it installs mod.onBossDeath, mod.cine, mod.drawCine, and wraps mod.drawGround, mod.tap and
   mod.cineCam (the camera; 20b's camPick asks for it first while the cinematic runs) and mod.hideHud.
   What plays, after the last boss falls (the fall banner, the stage's monsters die, o.onFall: each rift's calm hooks):
     0.0  the wound tears open where the rift is (o.wound): a jagged fissure of light in the air, a swirling vortex deep inside
          it, the ground and air round it rippling with heat haze, crackling arcs off its edges, debris and motes sucked in.
          "SEAL THE RIFT". The HUD steps aside and the frame letterboxes.
     0.0  the party gathers: the lead pet dashes to the middle of a half ring under the wound; the rest of the party (the
          benched pets, drawn with the game's pet renderer) leap out of it to their places.
     1.2  they raise their power: a rune circle turns on the ground under them, an aura pillar rises from each pet in its
          element's colour, its light rings rolling out over the floor.
     2.35 beams of energy shoot from each pet into the tear's edges, each in its pet's colour.
     3.0, 3.9, 4.8  three beats: the beams flare, seams of light lace across the tear, it contracts a step, the camera pushes in,
          the shake grows (all toned down under "Fewer effects").
     5.45 the tear implodes to a point, the beams drawn in with it; 6.0 a blinding flash, a shockwave across the arena, sparks
          and embers in the rift's colour.
     6.15 the rift's sigil forms in the light, turns, and (7.35) flies into the lead pet; 6.8 the sigil banner, "The rift is
          sealed!". 8.9 the end panel (finishWin), as before: the reward, the save, "Sealed again" replays, Rift 1's rules.
   A tap after the first second skips to just before the flash. Tests: window.__SEAL_HOLD = t holds the cinematic's clock at t.
   GPU: Nidhogg's painter (NIDHOGG_MOVES.FGFX) where a real GPU draws it: the vortex (clipped to the tear), the tear's rim of
   energy, crackle, beams, seams, pillars, floor rings, shockwave, sparks. window.__SEAL_GL = 0 (or __DUN_GL = 0) keeps the 2D
   fallback, which draws the same picture from pre-made sprites (soft rays, glows, a spiral). Particles live in one pool of
   typed arrays; colours and sprites are made once. st.lowFx thins decoration (particles, haze, shakes), never the timing. */
const RiftSealFX = (() => {
  const TAU = Math.PI * 2;
  const cl = v => (v < 0 ? 0 : v > 1 ? 1 : v), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, eo = u => { u = cl(u); return 1 - (1 - u) * (1 - u) * (1 - u); }, ei = u => { u = cl(u); return u * u * u; };
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const fg = () => { try { if (typeof window !== 'undefined' && (window.__SEAL_GL === 0 || (window.__DUN_GL === 0 && window.__SEAL_GL !== 1))) return null;   /* (__SEAL_GL = 1: this on the GPU even when the dungeon's own pass is off: tests) */ const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const rgb = h => { const n = parseInt(String(h || '#FFFFFF').slice(1, 7), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const hx = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, k) => { const p = rgb(a), q = rgb(b); return hx([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k]); };
  const hex6 = (h, d) => (typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h) ? h.toUpperCase() : d);
  /* the timeline (seconds of the cinematic) */
  const TL = { open: 0.55, gather: 1.25, power: 1.2, tether: 2.35, beats: [3.0, 3.9, 4.8], implode: 5.45, flash: 6.0, sigil: 6.15, banner: 6.8, fly: 7.35, land: 7.95, end: 8.9, skipAfter: 1 };
  const SHUT = [0.74, 0.5, 0.3];   // how open the tear stands after each beat
  /* sprites made once and shared: the soft mask the haze is laid through, the void's depth and a spiral for the 2D vortex */
  const SPR = new Map();
  function sprite(key, w, h, paint) { let s = SPR.get(key); if (s) return s; s = document.createElement('canvas'); s.width = w; s.height = h; paint(s.getContext('2d'), w, h); SPR.set(key, s); return s; }
  const maskSprite = () => sprite('mask', 128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const voidSprite = col => sprite('void|' + col, 96, 96, (g, w) => { const [r, gg, b] = rgb(col), gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgb(3,1,8)'); gr.addColorStop(0.5, `rgb(${Math.round(8 + r * 0.06)},${Math.round(3 + gg * 0.05)},${Math.round(16 + b * 0.08)})`); gr.addColorStop(0.85, `rgb(${Math.round(r * 0.32)},${Math.round(gg * 0.24)},${Math.round(b * 0.36 + 20)})`); gr.addColorStop(1, `rgb(${Math.round(r * 0.55)},${Math.round(gg * 0.42)},${Math.round(b * 0.5 + 25)})`); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const darkSprite = () => sprite('dark', 64, 64, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(6,2,14,.85)'); gr.addColorStop(0.5, 'rgba(6,2,14,.45)'); gr.addColorStop(1, 'rgba(6,2,14,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const spiralSprite = col => sprite('spiral|' + col, 128, 128, (g, w) => { const [r, gg, b] = rgb(col), im = g.createImageData(w, w), d = im.data;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const u = (x + 0.5) / w * 2 - 1, v = (y + 0.5) / w * 2 - 1, rr = Math.hypot(u, v), an = Math.atan2(v, u), sw = an + 2.4 * Math.log(rr + 0.08), arms = Math.pow(0.5 + 0.5 * Math.cos(3 * sw), 2.2);
      const fade = cl(1 - (rr - 0.45) / 0.55), heart = Math.exp(-rr * rr * 18), a = cl((arms * (0.35 + 0.65 * (1 - rr)) * fade + heart) * 0.95), wk = cl(heart * 1.2 + (1 - rr) * 0.35), i = (y * w + x) * 4;
      d[i] = r + (255 - r) * wk; d[i + 1] = gg + (255 - gg) * wk; d[i + 2] = b + (255 - b) * wk; d[i + 3] = Math.round(255 * a); }
    g.putImageData(im, 0, 0); });
  /* the sigil's glyphs, in a unit circle (y down), one per rift's sigil; a four-point star for any other */
  const GLYPH = {
    ember(c) { c.moveTo(0, -1); c.bezierCurveTo(0.42, -0.5, 0.78, -0.1, 0.62, 0.42); c.quadraticCurveTo(0.45, 0.98, 0, 0.98); c.quadraticCurveTo(-0.45, 0.98, -0.62, 0.42); c.bezierCurveTo(-0.72, 0.05, -0.42, -0.12, -0.3, -0.42); c.quadraticCurveTo(-0.12, -0.05, 0.02, -0.18); c.quadraticCurveTo(0.12, -0.55, 0, -1); c.closePath(); },
    tide(c) { c.moveTo(-0.95, 0.55); c.bezierCurveTo(-0.7, -0.1, -0.1, -0.85, 0.5, -0.6); c.bezierCurveTo(0.95, -0.42, 0.85, 0.15, 0.42, 0.12); c.bezierCurveTo(0.1, 0.1, 0.12, -0.25, 0.38, -0.25); c.bezierCurveTo(0.05, -0.45, -0.38, 0.05, -0.2, 0.55); c.closePath(); c.moveTo(-0.95, 0.72); c.lineTo(0.95, 0.72); c.lineTo(0.95, 0.9); c.lineTo(-0.95, 0.9); c.closePath(); },
    bloom(c) { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2, x = Math.cos(a) * 0.5, y = Math.sin(a) * 0.5; c.moveTo(x + Math.cos(a) * 0.45, y + Math.sin(a) * 0.45); c.ellipse(x, y, 0.45, 0.27, a, 0, TAU); } c.moveTo(0.26, 0); c.arc(0, 0, 0.26, 0, TAU); },
    echo(c) { c.moveTo(0.2, 0); c.arc(0, 0, 0.2, 0, TAU); for (const r of [0.48, 0.74, 0.98]) { c.moveTo(Math.cos(-0.9) * r, Math.sin(-0.9) * r); c.arc(0, 0, r, -0.9, 0.9); c.arc(0, 0, r - 0.12, 0.9, -0.9, true); c.closePath(); c.moveTo(Math.cos(Math.PI - 0.9) * r, Math.sin(Math.PI - 0.9) * r); c.arc(0, 0, r, Math.PI - 0.9, Math.PI + 0.9, true); c.arc(0, 0, r - 0.12, Math.PI + 0.9, Math.PI - 0.9); c.closePath(); } },
    memory(c) { c.moveTo(-0.62, -0.95); c.lineTo(0.62, -0.95); c.lineTo(0.62, -0.8); c.lineTo(0.1, 0); c.lineTo(0.62, 0.8); c.lineTo(0.62, 0.95); c.lineTo(-0.62, 0.95); c.lineTo(-0.62, 0.8); c.lineTo(-0.1, 0); c.lineTo(-0.62, -0.8); c.closePath(); },
    shelter(c) { c.moveTo(-0.95, 0.85); c.lineTo(-0.8, -0.05); c.quadraticCurveTo(0, -1.15, 0.8, -0.05); c.lineTo(0.95, 0.85); c.lineTo(0.48, 0.85); c.lineTo(0.42, 0.1); c.quadraticCurveTo(0, -0.42, -0.42, 0.1); c.lineTo(-0.48, 0.85); c.closePath(); },
    charge(c) { c.moveTo(0.2, -1); c.lineTo(-0.6, 0.12); c.lineTo(-0.05, 0.12); c.lineTo(-0.25, 1); c.lineTo(0.62, -0.18); c.lineTo(0.08, -0.18); c.closePath(); },
    truth(c) { c.moveTo(-1, 0); c.quadraticCurveTo(0, -0.95, 1, 0); c.quadraticCurveTo(0, 0.95, -1, 0); c.closePath(); c.moveTo(0.36, 0); c.arc(0, 0, 0.36, 0, TAU, true); c.moveTo(0.15, 0); c.arc(0, 0, 0.15, 0, TAU); },
    weight(c) { c.moveTo(0.35, -0.92); c.arc(0, 0, 0.98, -1.2, 1.2, true); c.bezierCurveTo(-0.2, 0.75, -0.45, 0.2, -0.32, -0.2); c.bezierCurveTo(-0.2, -0.62, 0.05, -0.85, 0.35, -0.92); c.closePath(); },
    balance(c) { c.moveTo(-0.06, -0.85); c.lineTo(0.06, -0.85); c.lineTo(0.06, 0.7); c.lineTo(0.4, 0.95); c.lineTo(-0.4, 0.95); c.lineTo(-0.06, 0.7); c.closePath(); c.moveTo(-0.9, -0.62); c.lineTo(0.9, -0.62); c.lineTo(0.9, -0.5); c.lineTo(-0.9, -0.5); c.closePath();
      for (const s of [-1, 1]) { c.moveTo(s * 0.98, 0.05); c.quadraticCurveTo(s * 0.7, 0.42, s * 0.42, 0.05); c.closePath(); c.moveTo(s * 0.72, -0.5); c.lineTo(s * 0.95, 0.05); c.lineTo(s * 0.9, 0.05); c.lineTo(s * 0.72, -0.4); c.lineTo(s * 0.54, 0.05); c.lineTo(s * 0.49, 0.05); c.closePath(); } },
    rhythm(c) { c.ellipse(-0.32, 0.6, 0.34, 0.25, -0.4, 0, TAU); c.moveTo(-0.02, 0.6); c.lineTo(-0.02, -0.95); c.lineTo(0.12, -0.95); c.quadraticCurveTo(0.2, -0.5, 0.7, -0.38); c.quadraticCurveTo(0.35, -0.2, 0.12, -0.52); c.lineTo(0.12, 0.6); c.closePath(); },
    key(c) { c.moveTo(0.95, -0.4); c.arc(0.45, -0.4, 0.5, 0, TAU); c.moveTo(0.67, -0.4); c.arc(0.45, -0.4, 0.22, 0, TAU, true); c.moveTo(0.1, -0.1); c.lineTo(-0.9, 0.9); c.lineTo(-0.75, 1); c.lineTo(-0.58, 0.83); c.lineTo(-0.42, 0.98); c.lineTo(-0.3, 0.86); c.lineTo(-0.46, 0.7); c.lineTo(-0.3, 0.55); c.lineTo(-0.14, 0.7); c.lineTo(-0.02, 0.58); c.lineTo(-0.18, 0.42); c.lineTo(0.25, 0.0); c.closePath(); },
    star(c) { c.moveTo(0, -1); c.quadraticCurveTo(0.12, -0.12, 1, 0); c.quadraticCurveTo(0.12, 0.12, 0, 1); c.quadraticCurveTo(-0.12, 0.12, -1, 0); c.quadraticCurveTo(-0.12, -0.12, 0, -1); c.closePath(); },
  };
  GLYPH.veil = GLYPH.truth; GLYPH.bell = GLYPH.rhythm;
  /* the sigil itself: a gold coin-like emblem, turning (turn: its angle about the upright axis), the rift's light in its face */
  function drawSigil(c, x, y, R, turn, a, glyph, P) { if (R < 1 || a <= 0.01) return; const k = Math.cos(turn), face = k >= 0, ak = Math.max(0.08, Math.abs(k));
    c.save(); c.translate(x, y); c.globalAlpha = cl(a);
    // the coin's edge, seen as it turns: a band of darker gold behind the face
    if (ak < 0.98) { c.fillStyle = '#7A520E'; c.beginPath(); c.ellipse(Math.sign(k || 1) * -R * 0.09 * (1 - ak), 0, R * ak + 1, R, 0, 0, TAU); c.fill(); }
    c.scale(ak, 1);
    const g1 = c.createLinearGradient(-R, -R, R, R); g1.addColorStop(0, '#FFF6CF'); g1.addColorStop(0.45, face ? '#F2C24C' : '#C9962E'); g1.addColorStop(1, face ? '#8A5E10' : '#5E3E0A');
    c.fillStyle = g1; c.strokeStyle = '#3A2608'; c.lineWidth = Math.max(1.2, R * 0.05); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.stroke();
    // the inner face: the rift's own light, deep at its rim
    const g2 = c.createRadialGradient(-R * 0.2, -R * 0.25, 0, 0, 0, R * 0.8); g2.addColorStop(0, P.light); g2.addColorStop(0.55, P.col); g2.addColorStop(1, P.deep);
    c.fillStyle = face ? g2 : P.col; c.beginPath(); c.arc(0, 0, R * 0.78, 0, TAU); c.fill(); c.strokeStyle = 'rgba(58,38,8,.9)'; c.lineWidth = Math.max(1, R * 0.035); c.stroke();
    // eight studs round the ring
    c.fillStyle = '#FFF3C4'; for (let i = 0; i < 8; i++) { const an = i / 8 * TAU, px = Math.cos(an) * R * 0.89, py = Math.sin(an) * R * 0.89, s = R * 0.065; c.beginPath(); c.moveTo(px, py - s); c.lineTo(px + s, py); c.lineTo(px, py + s); c.lineTo(px - s, py); c.closePath(); c.fill(); }
    // the glyph, raised in pale gold
    // (its back carries the glyph too, in darker gold, so a turning sigil never shows a blank face)
    c.save(); c.scale(R * 0.5, R * 0.5); c.beginPath(); (GLYPH[glyph] || GLYPH.star)(c); c.restore(); c.fillStyle = face ? '#FFF4D2' : '#C9962E'; c.fill('evenodd'); c.strokeStyle = '#4A300A'; c.lineWidth = Math.max(1, R * 0.04); c.lineJoin = 'round'; c.stroke();
    // a sheen across it
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = cl(a) * 0.35 * ak; c.strokeStyle = '#FFFFFF'; c.lineWidth = R * 0.09; c.beginPath(); c.arc(0, 0, R * 0.9, Math.PI * 1.08, Math.PI * 1.42); c.stroke();
    c.restore(); }

  function install(X, self, mod, o) {
    const me = X.me, gold = '#FFE37A', wound = o.wound || { x: X.M.MW / 2, y: 3.5 };
    let col = hex6(o.color, '#61D9D2'); const grey = (() => { const q = rgb(col), mx = Math.max(...q), mn = Math.min(...q); return mx - mn < 30; })();
    // (a white rift, the Sea of Fallen Colours: its light pale violet so the tear still has a hue)
    if (grey) col = '#D8CCFF';
    const P = { col, light: mix(col, '#FFFFFF', 0.55), pale: mix(col, '#FFFFFF', 0.82), deep: mix(col, '#12051E', 0.62), glow: hex6(o.glow, mix(col, '#FFFFFF', 0.35)) };
    const glyph = (String(o.sigil || '').match(/THE\s+(\w+)\s+SIGIL/i) || [, ''])[1].toLowerCase();
    // the tear's shape, seeded by the sigil so each rift's wound is its own
    let sd = 0; for (const ch of String(o.sigil || 'x')) sd = (sd * 31 + ch.charCodeAt(0)) >>> 0; sd = (sd % 2147483646) + 1;
    const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const N = 15, JL = new Float32Array(N), JR = new Float32Array(N), CO = new Float32Array(N), TILT = -0.16 + (R() - 0.5) * 0.12;
    for (let i = 0; i < N; i++) { JL[i] = (i % 2 ? 0.34 : -0.24) * (0.55 + 0.9 * R()); JR[i] = (i % 2 ? -0.24 : 0.34) * (0.55 + 0.9 * R()); CO[i] = (R() - 0.5); }
    const TP = new Float32Array(N * 6);   // per point: centre x, y, left x, y, right x, y (screen px, this frame)
    const CR = new Float32Array(48 * 4); let ncr = 0;   // this frame's crackle (segments)
    /* the particle pool: x, y in world tiles (air height folded into y), velocity, life, size; kind 0 debris, 1 mote, 2 spark, 3 ember */
    const NP = 220, px = new Float32Array(NP), py = new Float32Array(NP), pvx = new Float32Array(NP), pvy = new Float32Array(NP), pl = new Float32Array(NP), pm = new Float32Array(NP), ps = new Float32Array(NP), pk = new Uint8Array(NP), pc = new Uint8Array(NP); let pnext = 0;
    function spawn(kind, x, y, vx, vy, life, size, ci) { for (let k = 0; k < NP; k++) { const i = (pnext + k) % NP; if (pl[i] > 0) continue; pnext = i + 1; px[i] = x; py[i] = y; pvx[i] = vx; pvy[i] = vy; pl[i] = pm[i] = life; ps[i] = size; pk[i] = kind; pc[i] = ci || 0; return; } }
    // the party: the lead (the pet being played) in the middle of a half ring under the wound, the rest leaping out of it
    const party = (() => { try { return X.party ? X.party() : null; } catch (e) { return null; } })() || [], cur = (() => { try { return X.partyCur ? X.partyCur() : 0; } catch (e) { return 0; } })(), petK = (() => { try { return X.petK ? X.petK() : 1.035; } catch (e) { return 1.035; } })();
    const elCol = el => { const E = (typeof E8 !== 'undefined' && E8[el]) || (typeof ELEMENTS !== 'undefined' && ELEMENTS[el]); return hex6(E && E.color, col); };   // (a pet's element is an E8 key)
    const leadM = party[cur] || null, others = party.filter((m, i) => i !== cur && m && m.p);
    const nPets = 1 + others.length, CXg = wound.x, CYg = wound.y;   // (the ring's centre: the ground under the tear)
    const slots = []; for (let i = 0; i < nPets; i++) { const a = nPets === 1 ? Math.PI / 2 : Math.PI / 2 + (i / (nPets - 1) - 0.5) * (nPets === 2 ? 0.75 : nPets === 3 ? 1.5 : 1.75); slots.push({ x: CXg + Math.cos(a) * 3.0, y: CYg + 0.55 + Math.sin(a) * 2.6, a }); }
    // (the lead takes the middle slot, or the middle one nearer where it stands; the others the rest, nearest first)
    const pets = []; const mid = (nPets - 1) / 2;
    const leadSlot = nPets % 2 ? mid : (me.x < CXg ? Math.floor(mid) : Math.ceil(mid));
    pets.push({ lead: true, m: leadM, slot: slots[leadSlot], col: leadM ? elCol(leadM.el) : col, x: me.x, y: me.y, t0: 0 });
    let k2 = 0; slots.forEach((s, i) => { if (i === leadSlot) return; const m = others[k2]; pets.push({ lead: false, m, slot: s, col: elCol(m.el), x: me.x, y: me.y, t0: 0.12 + k2 * 0.12, z: 0, o: null, h: 0 }); k2++; });
    // (where each beam meets the tear: pets left of the middle on its left edge, right ones on its right, the middle one at its foot)
    pets.forEach(p => { const dx = p.slot.x - CXg; p.side = Math.abs(dx) < 0.6 ? 0 : dx < 0 ? -1 : 1; p.seed = 1.3 + pets.indexOf(p) * 2.17; });
    { const L = pets.filter(p => p.side < 0).sort((a, b) => a.slot.y - b.slot.y), Rr = pets.filter(p => p.side > 0).sort((a, b) => a.slot.y - b.slot.y); L.forEach((p, i) => { p.anc = 0.32 + i * 0.26; }); Rr.forEach((p, i) => { p.anc = 0.32 + i * 0.26; }); pets.forEach(p => { if (!p.side) p.anc = 0.9; }); }
    pets.forEach(p => { p.pale = mix(p.col, '#FFFFFF', 0.6); p.soft = mix(p.col, '#FFFFFF', 0.35); p.size = 1; try { if (p.m && p.m.p) p.size = dunPetSize(p.m.p, formOf(p.m.p)); } catch (e) {} });
    const hOf = p => X.Tz() * 1.02 * petK * p.size;
    const C0 = { x: 0, y: 0, set: false };
    const leadAt = t => { const u = sm(t / 1.05); return [C0.x + (pets[0].slot.x - C0.x) * u, C0.y + (pets[0].slot.y - C0.y) * u]; };
    /* the cinematic's state, all from its clock: how open the tear stands (0..1), its length (0..1), the push-in */
    const openAt = t => { if (t < TL.open) return eo(t / TL.open); let v = 1; for (let i = 0; i < 3; i++) { const b = TL.beats[i]; if (t > b) v = (i ? SHUT[i - 1] : 1) + (SHUT[i] - (i ? SHUT[i - 1] : 1)) * eo((t - b) / 0.35); } if (t > TL.implode) v *= 1 - ei((t - TL.implode) / (TL.flash - TL.implode)); return Math.max(0, v); };
    const lenAt = t => (t < TL.open ? 0.35 + 0.65 * eo(t / TL.open) : t < TL.implode ? 1 : Math.max(0, 1 - ei((t - TL.implode) / (TL.flash - TL.implode))));
    const powerAt = t => (t < TL.power ? 0 : t < TL.flash ? sm((t - TL.power) / 0.6) : 1 - sm((t - TL.flash) / 1.4));
    const beatK = t => { let k = 0; for (const b of TL.beats) if (t > b) k = Math.max(k, Math.exp(-(t - b) * 4.5)); return k; };
    const nBeats = t => TL.beats.filter(b => t > b).length;
    const pushAt = t => (t < TL.tether ? 0 : t < TL.flash ? sm((t - TL.tether) / (TL.flash - TL.tether)) : 1 - 0.45 * sm((t - TL.flash) / 1.4));
    const shotAt = t => cl((t - TL.tether) / 0.32);   // the beams' heads travelling out
    const lbAt = t => (t < TL.end - 0.4 ? sm(t / 0.5) : sm((TL.end - t) / 0.4));
    /* events: sounds, shakes, bursts, banners (pictures come from the clock alone, so a skip only drops these) */
    const shake = (m, d) => { try { X.shake(m * (lowFx() ? 0.4 : 1), d); } catch (e) {} };
    const sfx = (k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
    const EV = [
      [0, () => { X.banner('SEAL THE RIFT', 'Your party gathers round the wound', col, 1.7, true); sfx('hum'); sfx('crack'); shake(4, 0.3); }],
      [TL.power, () => { sfx('sparkle'); shake(2, 0.6); }],
      [TL.tether, () => { sfx('whoosh'); sfx('note', 330, 0.9, 'sine', 0.18, 660); shake(3, 0.3); }],
      [TL.beats[0], () => { sfx('chime', 523, 0.9); sfx('crack'); shake(3, 0.25); }],
      [TL.beats[1], () => { sfx('chime', 659, 1); sfx('crack'); shake(5, 0.3); }],
      [TL.beats[2], () => { sfx('chime', 784, 1.1); sfx('crack'); shake(7, 0.35); }],
      [TL.implode, () => { sfx('hollow', 180); sfx('whoosh'); shake(4, 0.5); }],
      [TL.flash, () => { sfx('crash'); sfx('thud'); shake(14, 0.6); burst(); }],
      [TL.banner, () => { X.banner(o.sigil, 'The rift is sealed!', gold, 3.2, true); sfx('fanfare'); }],
      [TL.land, () => { sfx('sparkle'); shake(3, 0.2); }],
    ];
    pets.forEach(p => { if (!p.lead) EV.push([p.t0 + 0.72, () => { sfx('thud'); }]); });
    function burst() { const n = lowFx() ? 0.4 : 1, cx = CXg, cy = CYg - 1.4;
      for (let i = 0; i < 80 * n; i++) { const a = Math.random() * TAU, v = 2.5 + Math.random() * 7; spawn(3, cx + Math.cos(a) * 0.2, cy + Math.sin(a) * 0.2, Math.cos(a) * v, Math.sin(a) * v * 0.75 - 1, 1.1 + Math.random() * 1.2, 0.6 + Math.random() * 0.8, Math.random() < 0.3 ? 1 : 0); }
      for (let i = 0; i < 40 * n; i++) { const a = Math.random() * TAU, v = 9 + Math.random() * 8; spawn(2, cx, cy, Math.cos(a) * v, Math.sin(a) * v * 0.8, 0.35 + Math.random() * 0.3, 1, Math.random() < 0.5 ? 1 : 0); } }
    /* ---- the update, every frame of the cinematic ---- */
    const allyObj = p => ({ x: p.x, y: p.y, kind: 'sealpet', r: 0, label: '', p, draw: (c, Xs, Ys, T, ob) => drawAlly(c, ob.p, T) });
    mod.cine = (dt, C) => {
      try { const hold = typeof window !== 'undefined' ? window.__SEAL_HOLD : null; if (hold != null && C.t > hold) C.t = hold; } catch (e) {}
      if (!C.fired) { C.fired = new Uint8Array(EV.length); C.step = 1; C0.x = me.x; C0.y = me.y; C0.set = true;
        for (const p of pets) if (!p.lead && p.m && p.m.sprites !== undefined) { p.o = allyObj(p); self.objs.push(p.o); } }
      const t = C.t;
      for (let i = 0; i < EV.length; i++) if (!C.fired[i] && t >= EV[i][0]) { C.fired[i] = 1; if (!C.quiet) try { EV[i][1](); } catch (e) {} }
      C.quiet = false;
      C.step = t < TL.power ? 1 : t < TL.flash ? 2 : t < TL.end ? 3 : 4;   // (1 gathering, 2 power and stitching, 3 the collapse and the sigil, 4 done: tests read it)
      // the lead: a dash to its place, then its arms raised while it pours its power in
      const [lx, ly] = leadAt(t), ddx = lx - me.x, ddy = ly - me.y, dd = Math.hypot(ddx, ddy);
      // (the engine zeroes the pet's velocity after this runs, so the dash shows as a lean, not a walk)
      if (t < 1.1 && dd > 0.004) { me.face = ddx >= 0 ? 1 : -1; me.hopLean = me.face * 0.3 * Math.min(1, dd / Math.max(dt, 1e-3) / 8); me.bob = (me.bob || 0) + dt * 12; C.dashing = true; }
      else { if (C.dashing) { me.hopLean = 0; C.dashing = false; } me.face = CXg >= me.x ? 1 : -1; }
      me.x = lx; me.y = ly;
      if (t > TL.power && t < TL.flash + 0.4) { me.castT = 0.5; me.castM = 1; me.castUlt = true; }
      // the others: a leap out of the lead to their places
      for (const p of pets) { if (p.lead) { p.x = me.x; p.y = me.y; continue; } const u = cl((t - p.t0) / 0.72), [sx0, sy0] = leadAt(p.t0), e = sm(u);
        p.x = sx0 + (p.slot.x - sx0) * e; p.y = sy0 + (p.slot.y - sy0) * e; p.z = Math.sin(Math.PI * u) * 2.4; p.u = u; p.face = u < 1 ? (p.slot.x >= sx0 ? 1 : -1) : (CXg >= p.x ? 1 : -1);
        if (p.o) { p.o.x = p.x; p.o.y = p.y; } }
      // particles: debris and motes drawn into the tear while it stands open; crackle sparks off its edges
      const op = openAt(t), cx = CXg, cy = CYg - 1.4, n = lowFx() ? 0.45 : 1;
      if (op > 0.05 && t < TL.flash) { C.acc = (C.acc || 0) + dt * (14 + 18 * op) * n;
        while (C.acc > 1) { C.acc -= 1; const a = Math.random() * TAU, r = 2.4 + Math.random() * 2.2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8, kind = Math.random() < 0.3 ? 0 : 1; spawn(kind, x, y, -Math.sin(a) * 1.4, Math.cos(a) * 1.4, 2.6, kind ? 0.6 + Math.random() * 0.6 : 0.5 + Math.random() * 0.7, Math.random() < 0.35 ? 1 : 0); } }
      for (let i = 0; i < NP; i++) { if (pl[i] <= 0) continue; pl[i] -= dt; const k = pk[i];
        if (k <= 1) { const dx = cx - px[i], dy = cy - py[i], d = Math.hypot(dx, dy) + 1e-3, pull = (3.5 + 6 * (t > TL.implode ? 2 : 1)) / (d + 0.5); pvx[i] += (dx / d * pull + dy / d * 1.6) * dt; pvy[i] += (dy / d * pull - dx / d * 1.6) * dt; pvx[i] *= 1 - dt * 0.9; pvy[i] *= 1 - dt * 0.9; if (d < 0.18 + 0.25 * op || (op < 0.02 && t > TL.flash)) pl[i] = 0; }
        else if (k === 2) { pvx[i] *= 1 - dt * 3.5; pvy[i] *= 1 - dt * 3.5; }
        else { pvx[i] *= 1 - dt * 1.6; pvy[i] = pvy[i] * (1 - dt * 1.6) - dt * 0.9; }
        px[i] += pvx[i] * dt; py[i] += pvy[i] * dt; }
      if (t >= TL.end && !C.done) { C.done = true; X.finishWin(); }   // (the party stays standing behind the end panel)
    };
    /* the camera: between the tear and the party, pushing in with the beats (20b camPick asks this first) */
    const prevCam = mod.cam;
    mod.cineCam = C => { if (!C) return null; const t = C.t, TS = X.Tz() / Math.max(0.05, X.g.zoom), W = X.W(), Hh = X.H(), Tw = Math.min(W / 8.4, Hh / 12.5) * (1 + 0.16 * pushAt(t)) * (1 + 0.03 * beatK(t));
      return { x: CXg, y: CYg - 0.95 - 0.2 * pushAt(t), k: 1, zoom: Math.max(0.4, Math.min(1.6, Tw / Math.max(1, TS))) }; };
    if (prevCam) mod.cam = () => (self.cine ? null : prevCam());
    mod.hideHud = () => !!self.cine;
    const prevTap = mod.tap;
    mod.tap = (x, y) => { const C = self.cine; if (!C || C.kind !== 'seal') return prevTap ? prevTap(x, y) : false;
      if (C.t > TL.skipAfter && C.t < TL.flash - 0.1) { C.t = TL.flash - 0.08; C.quiet = true; }   // (skipped: the gather, the power and the beats; the flash, the sigil and the end panel still come)
      return true; };
    mod.onBossDeath = m => { X.g.won = true; X.g.slowT = 1.2; X.flash(0.9, '#FFFFFF'); X.banner(o.fall, o.sub || '', gold, 2.6, true); X.sfx.fanfare();
      for (let i = 0; i < 8; i++) X.after(i * 0.13, () => X.boom(m.x + (Math.random() - 0.5) * m.r * 2, m.y + (Math.random() - 0.5) * m.r * 2, 1.4, i % 2 ? col : gold, '#FFFFFF', { n: 18, shake: 10 }));
      for (const q of X.mons) if (!q.dead && q !== m) X.killMon(q);
      if (o.onFall) o.onFall(m);
      X.after(2.6, () => { X.rift.startCine('seal'); }); return true; };

    /* ---------------- drawing ---------------- */
    const scr = (x, y) => [X.sx(x), X.sy(y)];
    // the tear's points this frame (screen px)
    function tearPts(cxs, cys, T, op, len, t) { const HL = T * 2.3 * len, W = T * 0.92 * op, ca = Math.cos(TILT), sa = Math.sin(TILT);
      for (let i = 0; i < N; i++) { const s = i / (N - 1), v = s * 2 - 1, bend = (Math.sin(s * Math.PI * 1.25 + 0.5) * 0.24 + CO[i] * 0.08) * T * len, lxx = bend, lyy = v * HL;
        const Cx = cxs + lxx * ca - lyy * sa, Cy = cys + lxx * sa + lyy * ca, env = Math.pow(Math.sin(Math.PI * s), 0.7), br = 1 + 0.07 * Math.sin(t * 3.1 + i * 1.7), wl = W * env * (1 + JL[i]) * br, wr = W * env * (1 + JR[i]) * br, o6 = i * 6;
        TP[o6] = Cx; TP[o6 + 1] = Cy; TP[o6 + 2] = Cx - ca * wl; TP[o6 + 3] = Cy - sa * wl; TP[o6 + 4] = Cx + ca * wr; TP[o6 + 5] = Cy + sa * wr; } }
    // a point on an edge (side -1 left, 1 right, 0 the centre line) at s (0 top .. 1 bottom)
    const edgeAt = (side, s, out) => { const f = cl(s) * (N - 1), i = Math.min(N - 2, Math.floor(f)), u = f - i, k = side < 0 ? 2 : side > 0 ? 4 : 0; out[0] = TP[i * 6 + k] + (TP[(i + 1) * 6 + k] - TP[i * 6 + k]) * u; out[1] = TP[i * 6 + k + 1] + (TP[(i + 1) * 6 + k + 1] - TP[i * 6 + k + 1]) * u; return out; };
    const E0 = [0, 0], E1 = [0, 0];
    const tearPath = c => { c.beginPath(); for (let i = 0; i < N; i++) { const x = TP[i * 6 + 2], y = TP[i * 6 + 3]; i ? c.lineTo(x, y) : c.moveTo(x, y); } for (let i = N - 1; i >= 0; i--) c.lineTo(TP[i * 6 + 4], TP[i * 6 + 5]); c.closePath(); };
    // the crackle: short forked arcs off the rim, re-struck twelve times a second
    function crackle(t, T, op) { ncr = 0; if (op < 0.04) return; const fr = Math.floor(t * 12), n = lowFx() ? 3 : 6;
      for (let k = 0; k < n; k++) { const h = Math.sin(fr * 12.9898 + k * 78.233) * 43758.5453, r1 = h - Math.floor(h), h2 = Math.sin(fr * 4.1 + k * 9.7) * 9631.17, r2 = h2 - Math.floor(h2);
        if (r2 < 0.25) continue; const side = r1 < 0.5 ? -1 : 1; edgeAt(side, 0.12 + 0.76 * ((r1 * 2) % 1), E0); const ca = Math.cos(TILT), sa = Math.sin(TILT); let x = E0[0], y = E0[1], dx = side * ca, dy = side * sa;
        for (let j = 0; j < 3 && ncr < 48; j++) { const L = T * (0.25 + 0.25 * r2) * (1 - j * 0.2), jit = (Math.sin(h * (j + 1.7)) * 0.9), nx = x + (dx + -dy * jit) * L, ny = y + (dy + dx * jit) * L; CR[ncr * 4] = x; CR[ncr * 4 + 1] = y; CR[ncr * 4 + 2] = nx; CR[ncr * 4 + 3] = ny; ncr++; x = nx; y = ny; } } }
    /* the tethers' living curve: a point at v (0 the pet .. 1 the tear) of a pet's beam from (x0, y0) to (x1, y1), pushed
       off the straight line by three slow sines with the pet's own phases, a lash travelling up it after each beat and now
       and then between them; nothing at either end, most in the middle; less as the tear implodes */
    function curveAt(p, x0, y0, x1, y1, v, T, tt, bk, imp, out) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ph = p.seed;
      const lash = Math.pow(Math.max(0, Math.sin(tt * 0.83 + ph * 1.7)), 8), A = Math.min(L * 0.2, T * 0.8) * (1 + 0.7 * bk + 0.5 * lash) * (1 - 0.85 * imp), env = Math.sin(Math.PI * v);
      const off = A * env * (0.5 * Math.sin(v * 5.6 + tt * 2.1 + ph) + 0.3 * Math.sin(v * 10.7 - tt * 3.4 + ph * 2.3) + 0.4 * Math.sin(tt * 1.3 + ph * 3.1) + (0.9 * bk + 0.5 * lash) * Math.sin(v * 8.2 - tt * 11 + ph * 0.7));
      out[0] = x0 + dx * v + nx * off; out[1] = y0 + dy * v + ny * off; return out; }
    const NC = 18, CV = new Float32Array(NC * 2), CP = [0, 0];
    // the curve's points up to u of its length, into CV; returns how many
    function curve(p, x0, y0, x1, y1, u, T, tt, bk, imp) { const n = Math.max(2, Math.round(2 + (NC - 2) * u)); for (let i = 0; i < n; i++) { curveAt(p, x0, y0, x1, y1, u * i / (n - 1), T, tt, bk, imp, CP); CV[i * 2] = CP[0]; CV[i * 2 + 1] = CP[1]; } return n; }
    // one layer of a tether on the GPU: gaussian beams along the curve, each reaching an eighth of its step past both ends,
    // where the painter's fade (flat to 0.6 of its half-length, then smoothly to nothing) meets its neighbour's: they sum to one
    function ribbon(Q, n, w, c0, a) { for (let i = 0; i < n - 1; i++) { const xa = CV[i * 2], ya = CV[i * 2 + 1], xb = CV[i * 2 + 2], yb = CV[i * 2 + 3], ex = (xb - xa) * 0.125, ey = (yb - ya) * 0.125; Q.beam(xa - ex, ya - ey, xb + ex, yb + ey, w, c0, a); } }
    // one soft width of a tether in 2D: the whole curve as one path
    function stroke(c, n, w, c0, a) { c.globalAlpha = cl(a); c.strokeStyle = c0; c.lineWidth = Math.max(1, w); c.beginPath(); c.moveTo(CV[0], CV[1]); for (let i = 1; i < n; i++) c.lineTo(CV[i * 2], CV[i * 2 + 1]); c.stroke(); c.globalAlpha = 1; }
    // a pet's chest (where its beam leaves) and its feet, on screen
    const PT = [0, 0, 0], petPt = p => { const h = hOf(p); p.h = h; PT[0] = X.sx(p.x); PT[1] = X.sy(p.y); PT[2] = h; return PT; };
    /* the benched pets, drawn as the game draws a pet (their own pictures, rig, glow), depth-sorted among the floor's things */
    function drawAlly(c, p, T) { const C = self.cine; if (!C || !p.m) return; const t = C.t; if (t < p.t0) return;
      const h = hOf(p), X0 = X.sx(p.x), Y0 = X.sy(p.y), u = p.u == null ? 1 : p.u, z = (p.z || 0) * T, form = formOf(p.m.p), land = u >= 1 ? Math.max(0, 1 - (t - p.t0 - 0.72) / 0.22) : 0;
      const cast = t > TL.power && t < TL.flash + 0.4 ? 0.5 : 0;
      try { drawPetFull(c, X0, Y0 + T * 0.18, h, Object.assign({ sprites: p.m.sprites, form, t: X.g.t + p.seed, unit: T * dunPetSize(p.m.p, form) * petK, tile: T, float: true, el: p.m.el, z, moving: u < 1, walk: X.g.t * 9, flip: p.face < 0, face: 'happy',
        pose: { walk: X.g.t * 9, moving: false, t: X.g.t + p.seed, cast, ult: cast > 0, wingPh: 0, wingAmp: u < 1 ? 14 : 8, hopArm: 0, hopFoot: 0, hopArmS: null, yaw: 0 },
        sx: 1 + land * 0.25 - (u < 1 ? 0.1 : 0), sy: 1 - land * 0.25 + (u < 1 ? 0.12 : 0), rot: u < 1 ? (p.face < 0 ? -1 : 1) * Math.sin(u * Math.PI) * 0.35 : 0, aurora: 1, alpha: cl(u * 4) }, typeof window !== 'undefined' && window.__SEAL_AOPT || null)); } catch (e) {} }
    /* the GPU or 2D strokes everything below shares */
    /* (beams laid end to end: each runs a fifth of its length past both ends, as the dungeon's dqChain does, since every beam
       picture fades to nothing toward its own ends; so a chain of them reads as one unbroken line, never dashes) */
    const chE = (Q, x0, y0, x1, y1, w, c0, heat, a, seed, scroll) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (L < 0.5) return; const k = 0.2 + w * 0.3 / L, ex = dx * k, ey = dy * k; Q.ebeam(x0 - ex, y0 - ey, x1 + ex, y1 + ey, w, c0, heat, a, seed, scroll || 6); };
    const chB = (Q, x0, y0, x1, y1, w, c0, a) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (L < 0.5) return; const k = 0.16 + w * 0.5 / L, ex = dx * k, ey = dy * k; Q.beam(x0 - ex, y0 - ey, x1 + ex, y1 + ey, w, c0, a); };
    const softBeam = (Q, x0, y0, x1, y1, w, c0, heat, a, seed, core) => { if (Q) { chE(Q, x0, y0, x1, y1, w, c0, heat, a, seed, 6); if (core) chB(Q, x0, y0, x1, y1, w * 0.16, '#FFFFFF', a * core); } else { softRay(CTX, x0, y0, x1, y1, w * 1.1, c0, a * 0.8, core ? 0.3 : 0); } };
    let CTX = null;
    const glow = (Q, x, y, r, c0, a, sy2) => { if (a <= 0.01 || r < 1) return; if (Q) Q.glow(x, y, r, c0, a, sy2); else { CTX.globalAlpha = cl(a); blitSized(CTX, glowSprite(c0), x - r, y - r * (sy2 || 1), r * 2, r * 2 * (sy2 || 1)); CTX.globalAlpha = 1; } };
    /* the floor layer (under the pets and props): the rune circle, aura pillars and their rings, the shockwave */
    const prevG = mod.drawGround;
    mod.drawGround = c => { if (prevG) prevG(c); const C = self.cine; if (!C || C.kind !== 'seal') return; try { ground(c, C); } catch (e) {} };
    function ground(c, C) { const t = C.t, T = X.Tz(), pw = powerAt(t), bk = beatK(t), F = fg(), Q = F ? F.begin(c, null) : null, low = lowFx(), tt = X.g.t;
      CTX = c; c.save(); if (!Q) c.globalCompositeOperation = 'lighter';
      const [gx, gy] = scr(CXg, CYg + 1.3), RX = T * 3.9, RY = RX * 0.46;
      // light pooling under the tear on the floor
      const op = openAt(t); glow(Q, X.sx(CXg), X.sy(CYg), T * 3.2, col, 0.32 * op + 0.25 * pw * (t < TL.flash ? 1 : 0), 0.5);
      // the aura pillars, rising from each pet's feet in its colour, their rings rolling out over the floor
      if (pw > 0.01) for (const p of pets) { if (!p.lead && (p.u || 0) < 1) continue; const [xs, ys, h] = petPt(p, T), grow = sm((t - TL.power - (p.lead ? 0 : 0.12 * pets.indexOf(p))) / 0.55) * pw, Hp = T * (2.3 + 0.7 * bk) * grow + h * 0.4;
        if (grow < 0.01) continue; const a = (0.5 + 0.35 * bk) * grow;
        if (Q) { Q.ebeam(xs, ys + T * 0.25, xs, ys - Hp, T * (0.6 + 0.15 * bk), p.col, 0.8 + 0.25 * bk, a, p.seed, 5); Q.ebeam(xs, ys, xs, ys - Hp * 0.8, T * 0.2, p.pale, 0.9, a * 0.35, p.seed + 3, 7);
          if (!low) for (let k = 0; k < 3; k++) Q.etongue(xs + (k - 1) * T * 0.28, ys + T * 0.05, T * 0.3, T * (0.9 + 0.35 * Math.sin(tt * 5 + k * 2 + p.seed)) * grow, (k - 1) * 0.22, p.col, 0.8, a * 0.6, p.seed + k * 1.7);
          Q.glow(xs, ys, T * 1.5, p.col, 0.45 * grow, 0.45);
          for (let k = 0; k < (low ? 1 : 2); k++) { const f = (tt * 0.9 + k * 0.5 + p.seed * 0.1) % 1; Q.ewave(xs, ys, T * (0.45 + 1.3 * f), p.col, 0.85, a * (1 - f) * 0.8, p.seed + k, 0.45, 0.22); } }
        else { softRay(c, xs, ys + T * 0.2, xs, ys - Hp, T * 1.15, p.col, a * 0.5, 0); softRay(c, xs, ys, xs, ys - Hp * 0.85, T * 0.4, p.pale, a * 0.45, 0); glow(null, xs, ys, T * 1.4, p.col, 0.4 * grow, 0.45); const f = (tt * 0.9 + p.seed * 0.1) % 1, rr = T * (0.45 + 1.3 * f); c.globalAlpha = a * (1 - f); blitSized(c, shockSprite(p.col), xs - rr, ys - rr * 0.45, rr * 2, rr * 0.9); c.globalAlpha = 1; } }
      // the shockwave: a rolling wave of the rift's light across the whole arena
      if (t > TL.flash && t < TL.flash + 1.4) { const u = (t - TL.flash) / 1.4, r = T * (0.8 + 13 * eo(u)), a = (1 - u) * (1 - u), [wx, wy] = scr(CXg, CYg);
        if (Q) { Q.ewave(wx, wy, r, col, 1, a, 2.7, 0.5, 0.2); Q.ring(wx, wy, r * 0.97, '#FFFFFF', a * 0.6, T * 0.25, 0.5); Q.ewave(wx, wy, r * 0.62, P.light, 0.9, a * 0.6, 5.1, 0.5, 0.28); }
        else { c.globalAlpha = a; blitSized(c, shockSprite(col), wx - r, wy - r * 0.5, r * 2, r); c.globalAlpha = a * 0.6; blitSized(c, shockSprite('#FFFFFF'), wx - r * 0.62, wy - r * 0.31, r * 1.24, r * 0.62); c.globalAlpha = 1; } }
      c.restore(); if (F) F.flush(c);
      // the rune circle on the floor under the party: crisp lines of light, turning (its own picture, as the ults' circles are)
      if (pw > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = P.light; c.lineCap = 'round'; const rot = tt * 0.35, a0 = pw * (0.5 + 0.4 * bk);
        c.globalAlpha = a0; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.ellipse(gx, gy, RX, RY, 0, 0, TAU); c.stroke(); c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.ellipse(gx, gy, RX * 0.86, RY * 0.86, 0, 0, TAU); c.stroke();
        c.globalAlpha = a0 * 0.85; c.beginPath(); for (let i = 0; i < 6; i++) { const an = rot + i / 6 * TAU, an2 = rot + (i + 2) / 6 * TAU; c.moveTo(gx + Math.cos(an) * RX * 0.86, gy + Math.sin(an) * RY * 0.86); c.lineTo(gx + Math.cos(an2) * RX * 0.86, gy + Math.sin(an2) * RY * 0.86); } c.stroke();
        c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); for (let i = 0; i < 24; i++) { const an = -rot * 1.4 + i / 24 * TAU, r0 = i % 3 ? 0.9 : 0.88, r1 = i % 3 ? 0.97 : 1.0; c.moveTo(gx + Math.cos(an) * RX * r0, gy + Math.sin(an) * RY * r0); c.lineTo(gx + Math.cos(an) * RX * r1, gy + Math.sin(an) * RY * r1); } c.stroke();
        c.globalAlpha = a0 * 0.5; c.lineWidth = Math.max(3, T * 0.22); c.strokeStyle = col; c.beginPath(); c.ellipse(gx, gy, RX * 0.93, RY * 0.93, 0, 0, TAU); c.stroke(); c.restore(); } }
    /* the haze: the floor and air round the tear rippling as heat does (the canvas under it copied, laid back in wavering
       strips through a soft mask); stronger as the tear implodes. Decoration: not under "Fewer effects" */
    let HA = null, HB = null;
    function haze(c, cxs, cys, rw, rh, amp, t) { if (lowFx() || amp < 0.3) return; const m = c.getTransform(), k = Math.hypot(m.a, m.b) || 1, cv = c.canvas;
      const dx0 = Math.max(0, Math.floor(m.a * (cxs - rw) + m.e)), dy0 = Math.max(0, Math.floor(m.d * (cys - rh) + m.f)), dx1 = Math.min(cv.width, Math.ceil(m.a * (cxs + rw) + m.e)), dy1 = Math.min(cv.height, Math.ceil(m.d * (cys + rh) + m.f)), w = dx1 - dx0, h = dy1 - dy0; if (w < 8 || h < 8) return;
      if (!HA) { HA = document.createElement('canvas'); HB = document.createElement('canvas'); }
      if (HA.width < w || HA.height < h) { HA.width = HB.width = Math.max(HA.width, w); HA.height = HB.height = Math.max(HA.height, h); }
      const a = HA.getContext('2d'), b = HB.getContext('2d'); a.clearRect(0, 0, w, h); a.drawImage(cv, dx0, dy0, w, h, 0, 0, w, h); b.clearRect(0, 0, w, h); b.globalCompositeOperation = 'source-over';
      const sh = Math.max(3, Math.round(3 * k)), A = amp * k; for (let y = 0; y < h; y += sh) { const v = (y / h) * 2 - 1, f = Math.max(0, 1 - v * v), off = Math.sin(y / k * 0.11 + t * 7) * A * f + Math.sin(y / k * 0.047 - t * 4.3) * A * 0.6 * f; b.drawImage(HA, 0, y, w, sh, off, y, w, sh); }
      b.globalCompositeOperation = 'destination-in'; b.drawImage(maskSprite(), 0, 0, w, h); b.globalCompositeOperation = 'source-over';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(HB, 0, 0, w, h, dx0, dy0, w, h); c.restore(); }
    /* ---- the air layer: everything over the floor's things ---- */
    mod.drawCine = (c, C) => { if (C.kind !== 'seal') return; try { air(c, C); } catch (e) { try { console.warn('seal fx: ' + (e && e.message)); } catch (e2) {} } };
    function air(c, C) { const t = C.t, T = X.Tz(), tt = X.g.t, op = openAt(t), len = lenAt(t), pw = powerAt(t), bk = beatK(t), low = lowFx(), W = X.W(), Hh = X.H();
      const cxs = X.sx(CXg), cys = X.sy(CYg) - T * 1.4, alive = len > 0.01 && t < TL.flash + 0.05;
      CTX = c;
      if (alive) { tearPts(cxs, cys, T, Math.max(op, 0.02), len, tt);
        // the haze round it (real distortion of what is behind), then a dark bed so it reads on a pale floor
        const imp = t > TL.implode && t < TL.flash ? (t - TL.implode) / (TL.flash - TL.implode) : 0;
        haze(c, cxs, cys, T * 2.6 * Math.max(0.5, len), T * 2.9 * Math.max(0.5, len), (2.5 + 3 * op + 9 * imp) * (0.6 + 0.4 * len), tt);
        c.save(); c.globalAlpha = 0.55 * Math.max(op, imp) * len; const dr = T * 2.4 * len; blitSized(c, darkSprite(), cxs - dr * 0.75, cys - dr, dr * 1.5, dr * 2); c.restore();
        // the void inside: depth going down into the dark
        c.save(); tearPath(c); c.clip(); const vr = T * 2.4 * len; c.drawImage(voidSprite(P.col), cxs - vr * 0.6, cys - vr, vr * 1.2, vr * 2);
        // the vortex deep inside it (on the GPU, clipped to the tear; else the spiral sprite turning, two layers)
        const F = fg(); let did = false;
        if (F) { const Q = F.begin(c, null), Wd = T * 0.92 * Math.max(op, 0.15), HL = T * 2.3 * len;
          Q.evortex(cxs, cys, Wd * 2.2, col, 0.85 + 0.2 * bk, 0.95, 1.7, 1.5 + imp * 4, HL / (Wd * 2.2) * 0.8); Q.evortex(cxs, cys, Wd * 1.4, P.light, 0.9, 0.7, 4.3, -2.2 - imp * 5, HL / (Wd * 1.4) * 0.5); Q.eorb(cxs, cys, Wd * 0.75, P.pale, 1.0, 0.6 + 0.3 * imp, 2.2, 3);
          for (let i = 0; i < (low ? 8 : 16); i++) { const u = (tt * 0.45 + i / 16) % 1, an = i * 2.39 + u * 3.5, rr = (1 - u), x = cxs + Math.cos(an) * Wd * 0.9 * rr, y = cys + Math.sin(an) * HL * 0.85 * rr; Q.star(x, y, T * (0.08 + 0.12 * u), u * 0.9, '#FFFFFF'); }
          F.flush(c); did = true; }
        if (!did) { c.globalCompositeOperation = 'lighter'; const Wd = T * 0.92 * Math.max(op, 0.15), HL = T * 2.3 * len; for (const [sgn, k, a] of [[1, 2.3, 0.85], [-1.6, 1.4, 0.55]]) { c.save(); c.translate(cxs, cys); c.scale(1, HL / (Wd * k) * 0.8); c.rotate(tt * sgn * (1 + imp * 3)); c.globalAlpha = a; c.drawImage(spiralSprite(k > 2 ? col : P.light), -Wd * k, -Wd * k, Wd * k * 2, Wd * k * 2); c.restore(); } }
        c.restore();
        // debris (solid shards) being pulled into it
        c.save(); for (let i = 0; i < NP; i++) { if (pl[i] <= 0 || pk[i] !== 0) continue; const x = X.sx(px[i]), y = X.sy(py[i]), s = ps[i] * T * 0.13 * cl(pl[i] / 0.4) * (0.5 + 0.5 * cl(Math.hypot(px[i] - CXg, py[i] - CYg + 1.4) / 1.2)), r0 = tt * 4 + i;
          if (s < 0.6) continue; c.fillStyle = '#1C1424'; c.strokeStyle = P.light; c.lineWidth = 1; c.beginPath(); c.moveTo(x + Math.cos(r0) * s, y + Math.sin(r0) * s); c.lineTo(x + Math.cos(r0 + 2.2) * s * 0.8, y + Math.sin(r0 + 2.2) * s * 0.8); c.lineTo(x + Math.cos(r0 + 4.1) * s * 0.9, y + Math.sin(r0 + 4.1) * s * 0.9); c.closePath(); c.fill(); c.globalAlpha = 0.7; c.stroke(); c.globalAlpha = 1; } c.restore(); }
      crackle(tt, T, alive ? op : 0);
      // ---- the light: rim, crackle, halo, beams, seams, sparks, the flash, the sigil's back light (one GPU pass, else 2D)
      const F = fg(), Q = F ? F.begin(c, null) : null; c.save(); if (!Q) c.globalCompositeOperation = 'lighter';
      if (alive) { const HL = T * 2.3 * len, rimA = Math.min(1, 0.55 + 0.25 * nBeats(t) + 0.4 * bk) * Math.min(1, len * 2);
        glow(Q, cxs, cys, HL * 1.25, col, (0.3 + 0.2 * bk) * len, 1.05); glow(Q, cxs, cys, HL * 0.7, P.light, 0.22 * len + 0.3 * bk * len, 1.2);
        if (Q && !low) Q.shimmer(cxs, cys, HL * 1.15, 0.3 * len, 1.1, col);
        // the tear's rim: a seam of energy down each edge, white-hot at its core
        for (const side of [2, 4]) for (let i = 0; i < N - 1; i++) { const x0 = TP[i * 6 + side], y0 = TP[i * 6 + side + 1], x1 = TP[(i + 1) * 6 + side], y1 = TP[(i + 1) * 6 + side + 1];
          if (Q) { if (!(i & 1)) { const j = Math.min(N - 1, i + 2); chE(Q, x0, y0, TP[j * 6 + side], TP[j * 6 + side + 1], T * (0.26 + 0.1 * bk), col, 1.05, rimA, i * 0.7 + side, 6); } chB(Q, x0, y0, x1, y1, T * 0.16, P.light, rimA * 0.6); chB(Q, x0, y0, x1, y1, T * 0.06, '#FFFFFF', rimA); }
          else { softRay(c, x0, y0, x1, y1, T * 0.22, col, rimA * 0.75); softRay(c, x0, y0, x1, y1, T * 0.09, '#FFFFFF', rimA * 0.8); } }
        // crackle
        for (let i = 0; i < ncr; i++) { const a = 0.8 * Math.min(1, op * 3); if (Q) { chB(Q, CR[i * 4], CR[i * 4 + 1], CR[i * 4 + 2], CR[i * 4 + 3], T * 0.1, col, a * 0.8); chB(Q, CR[i * 4], CR[i * 4 + 1], CR[i * 4 + 2], CR[i * 4 + 3], T * 0.025, '#FFFFFF', a); } else softRay(c, CR[i * 4], CR[i * 4 + 1], CR[i * 4 + 2], CR[i * 4 + 3], T * 0.08, P.pale, a); }
        // the seams the party stitches across it, three beats of them, each laced in from one edge to the other
        const GR = [[0.16, 0.84], [0.3, 0.7], [0.43, 0.57, 0.5]];
        for (let b = 0; b < 3; b++) { const tb = TL.beats[b]; if (t < tb) break; const drawIn = sm((t - tb) / 0.28), a = Math.min(1, 0.7 + 0.5 * Math.exp(-(t - tb) * 3)) * Math.min(1, len * 1.5);
          for (const s0 of GR[b]) for (const dir of [-1, 1]) { edgeAt(dir, s0, E0); edgeAt(-dir, s0 + 0.065, E1); const x1 = E0[0] + (E1[0] - E0[0]) * drawIn, y1 = E0[1] + (E1[1] - E0[1]) * drawIn;
            softBeam(Q, E0[0], E0[1], x1, y1, T * 0.2, gold, 1.05, a, s0 * 9 + dir, 1); glow(Q, x1, y1, T * 0.35, '#FFFFFF', a * 0.5); } } }
      // the beams: from each pet into the tear, in its own colour made soft and pale, as Catastrophe's columns of light are
      // (20k8f): smooth gaussian light (a wide faint halo, a soft body, a gentle core), never turbulent energy (it read as
      // beads). Each flows along a living curve, a loose stream the pets strain to hold: fixed at the pet and at the tear,
      // swaying most in its middle (three slow sines with the pet's own phases), lashing out on the beats and now and then
      // between them, then settling; drawn in to the tear's heart as it implodes. On the GPU each layer is one chain of
      // gaussian beams laid so their fades sum to one (each stretch reaches an eighth of a step past both ends), so it reads
      // as one ribbon, and only its last stretch carries the painter's far-end feather (v388 E) into the tear; in 2D the
      // curve is one path stroked in five stacked soft widths
      if (t > TL.tether && t < TL.flash) { const u = eo(shotAt(t)), imp = t > TL.implode ? sm((t - TL.implode) / (TL.flash - TL.implode)) : 0, fl = 1 + 0.25 * bk;
        for (const p of pets) { const [xs, ys, h] = petPt(p, T), x0 = xs, y0 = ys - h * 0.78; edgeAt(p.side, p.anc, E0); const ax = E0[0] + (cxs - E0[0]) * imp, ay = E0[1] + (cys - E0[1]) * imp;
          const n = curve(p, x0, y0, ax, ay, u, T, tt, bk, imp), w = T * 0.3 * (1 + 0.1 * bk), br = 0.92 + 0.08 * Math.sin(tt * 3.1 + p.seed);
          if (Q) { ribbon(Q, n, w * 2.6, p.col, 0.2 * fl * br); ribbon(Q, n, w, p.soft, 0.42 * fl * br); ribbon(Q, n, w * 0.3, p.pale, 0.5 * fl); }
          else { c.lineCap = 'round'; c.lineJoin = 'round'; stroke(c, n, w * 2.6, p.col, 0.06 * fl * br); stroke(c, n, w * 1.8, p.col, 0.07 * fl * br); stroke(c, n, w * 1.1, p.soft, 0.12 * fl * br); stroke(c, n, w * 0.6, p.soft, 0.16 * fl * br); stroke(c, n, w * 0.24, p.pale, 0.3 * fl); }
          // motes flowing up it
          if (!low) for (let k = 0; k < 4; k++) { const v = (tt * 0.7 + k / 4 + p.seed * 0.13) % 1; if (v > u) continue; curveAt(p, x0, y0, ax, ay, v, T, tt, bk, imp, E1); const ma = Math.sin(Math.PI * v) * 0.6; if (Q) Q.star(E1[0], E1[1], T * 0.13, ma, p.pale); else glow(null, E1[0], E1[1], T * 0.12, p.pale, ma); }
          // a soft light where it leaves the pet and where it reaches
          const hx = CV[(n - 1) * 2], hy = CV[(n - 1) * 2 + 1]; glow(Q, x0, y0, T * 0.42, p.col, 0.25); glow(Q, hx, hy, T * (0.5 + 0.15 * bk), p.soft, 0.34 * fl); if (u >= 1) glow(Q, hx, hy, T * 0.18, '#FFFFFF', 0.34 * fl); } }
      // the soft aura of each pet's power round its body (its pillar stands behind it, on the floor layer)
      if (pw > 0.01) for (const p of pets) { if (!p.lead && (p.u || 0) < 1) continue; const [xs, ys, h] = petPt(p, T); glow(Q, xs, ys - h * 0.5, h * (0.85 + 0.15 * bk), p.col, 0.22 * pw); }
      // the others' leaps: a streak of their light behind them
      for (const p of pets) { if (p.lead || p.u == null || p.u >= 1 || t < p.t0) continue; const xs = X.sx(p.x), ys = X.sy(p.y) - p.z * T - p.h * 0.5, u0 = Math.max(0, p.u - 0.3), [bx, by] = leadAt(p.t0), e0 = sm(u0), qx = bx + (p.slot.x - bx) * e0, qy = by + (p.slot.y - by) * e0, x1 = X.sx(qx), y1 = X.sy(qy) - Math.sin(Math.PI * u0) * 2.4 * T - p.h * 0.5;
        softBeam(Q, x1, y1, xs, ys, T * 0.55, p.col, 0.9, 0.75, p.seed, 0.6); glow(Q, xs, ys, T * 1.1, p.col, 0.4); }
      // the lead's dash: its streak
      if (t < 1.05 && C0.set && Math.hypot(pets[0].slot.x - C0.x, pets[0].slot.y - C0.y) > 1.5) { const [ax, ay] = leadAt(Math.max(0, t - 0.22)), xs = X.sx(me.x), ys = X.sy(me.y) - T * 0.5; softBeam(Q, X.sx(ax), X.sy(ay) - T * 0.5, xs, ys, T * 0.7, pets[0].col, 0.9, 0.6 * (1 - sm((t - 0.85) / 0.2)), 3.3, 0.5); }
      // particles
      for (let i = 0; i < NP; i++) { if (pl[i] <= 0 || pk[i] === 0) continue; const x = X.sx(px[i]), y = X.sy(py[i]), f = pl[i] / pm[i], c0 = pc[i] ? '#FFFFFF' : (pk[i] === 3 ? P.light : col);
        if (pk[i] === 1) { const a = Math.min(1, (1 - f) * 4) * 0.9; if (Q) { Q.star(x, y, T * 0.16 * ps[i], a, pc[i] ? '#FFFFFF' : P.pale); if (!(i % 3)) Q.glow(x, y, T * 0.3 * ps[i], col, a * 0.5); } else glow(null, x, y, T * 0.16 * ps[i], pc[i] ? '#FFFFFF' : P.light, a); }
        else if (pk[i] === 2) { const L = 0.045, x0 = x - pvx[i] * T * L, y0 = y - pvy[i] * T * L; if (Q) { Q.beam(x0, y0, x, y, T * 0.09, c0 === '#FFFFFF' ? col : c0, f); Q.beam(x0, y0, x, y, T * 0.03, '#FFFFFF', f); } else softRay(c, x0, y0, x, y, T * 0.09, c0, f, 0.4); }
        else { const a = Math.min(1, f * 1.6); if (Q) { Q.glow(x, y, T * 0.28 * ps[i], col, a * 0.7); if (!(i & 1)) Q.star(x, y, T * 0.2 * ps[i], a, c0); } else { glow(null, x, y, T * 0.3 * ps[i], col, a * 0.8); glow(null, x, y, T * 0.1 * ps[i], '#FFFFFF', a); } } }
      // the implosion's point, then the flash's bloom
      if (t > TL.implode - 0.1 && t < TL.flash + 0.9) { const u = t < TL.flash ? sm((t - TL.implode) / (TL.flash - TL.implode)) : 1 - eo((t - TL.flash) / 0.9), r = T * (0.4 + 2.6 * u) * (t < TL.flash ? 1 : 1.6);
        glow(Q, cxs, cys, r * 1.8, col, 0.7 * u); glow(Q, cxs, cys, r, '#FFFFFF', 0.9 * u); if (Q) { Q.star(cxs, cys, r * 2.2, u, '#FFFFFF'); if (t > TL.flash) Q.ring(cxs, cys, T * (1 + 9 * eo((t - TL.flash) / 0.9)), P.light, (1 - u) * 0 + u * 0.7, T * 0.5); } }
      // the sigil's back light
      const sg = sigilAt(t, T);
      if (sg) { glow(Q, sg.x, sg.y, sg.R * 3.2, col, 0.55 * sg.a); glow(Q, sg.x, sg.y, sg.R * 1.8, gold, 0.45 * sg.a); if (Q) { Q.star(sg.x, sg.y, sg.R * (2.6 + 0.4 * Math.sin(tt * 6)), 0.7 * sg.a, '#FFF6D8'); if (!low && sg.fly < 0.05) for (let k = 0; k < 8; k++) { const an = k / 8 * TAU + tt * 0.6; Q.beam(sg.x, sg.y, sg.x + Math.cos(an) * sg.R * 3.4, sg.y + Math.sin(an) * sg.R * 3.4, sg.R * 0.22, k % 2 ? gold : P.light, 0.35 * sg.a); } } }
      // the sigil, absorbed: a ring of its light round the lead
      if (t > TL.land && t < TL.land + 0.8) { const u = (t - TL.land) / 0.8, [xs, ys, h] = petPt(pets[0], T); glow(Q, xs, ys - h * 0.5, h * (1.2 + u), gold, 0.7 * (1 - u)); if (Q) Q.ring(xs, ys - h * 0.45, h * (0.6 + 1.6 * eo(u)), gold, 0.8 * (1 - u), T * 0.2); else { c.globalAlpha = 1 - u; const r = h * (0.6 + 1.6 * eo(u)); blitSized(c, shockSprite(gold), xs - r, ys - h * 0.45 - r, r * 2, r * 2); c.globalAlpha = 1; } }
      c.restore(); if (F) F.flush(c);
      // the sigil itself
      if (sg) drawSigil(c, sg.x, sg.y, sg.R, sg.turn, sg.a, glyph, P);
      // the blinding flash
      if (t > TL.flash - 0.04 && t < TL.flash + 0.8) { const u = (t - TL.flash) / 0.8, a = t < TL.flash ? 0.7 : 0.95 * Math.pow(1 - cl(u), 2); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = cl(a); c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.globalAlpha = cl(a) * 0.5; c.fillStyle = P.pale; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); }
      // the letterbox, and the way to skip
      const lb = lbAt(t) * Hh * 0.075; if (lb > 0.5) { c.save(); c.fillStyle = '#05030A'; c.fillRect(0, 0, W, lb); c.fillRect(0, Hh - lb, W, lb); if (t > TL.skipAfter && t < TL.flash - 0.1) { c.globalAlpha = 0.55 + 0.2 * Math.sin(tt * 3); c.font = `700 ${Math.round(Math.max(10, lb * 0.26))}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('Tap to skip', W - 16, Hh - lb / 2); } c.restore(); } }
    /* where the sigil is: formed in the light, turning, then flying into the lead */
    function sigilAt(t, T) { if (t < TL.sigil || t > TL.land + 0.02) return null; const cxs = X.sx(CXg), cys = X.sy(CYg) - T * 1.4, form = eo((t - TL.sigil) / 0.55), R0 = T * 0.95 * (form < 1 ? form * (1 + 0.15 * Math.sin(form * Math.PI)) : 1);
      const turn = (1 - eo((t - TL.sigil) / 1.1)) * TAU * 2.25 + Math.sin(t * 2.2) * 0.25, fly = sm((t - TL.fly) / (TL.land - TL.fly));
      if (fly <= 0) return { x: cxs, y: cys + Math.sin(t * 2.4) * T * 0.06, R: R0, turn, a: Math.min(1, form * 1.5), fly };
      const [xs, ys, h] = petPt(pets[0], T), tx = xs, ty = ys - h * 0.55, mx = (cxs + tx) / 2 + T * 1.2, my = Math.min(cys, ty) - T * 1.4, u = fly, a1 = (1 - u) * (1 - u), b1 = 2 * (1 - u) * u, c1 = u * u;
      return { x: a1 * cxs + b1 * mx + c1 * tx, y: a1 * cys + b1 * my + c1 * ty, R: R0 * (1 - 0.7 * u), turn: turn + u * TAU, a: 1 - 0.5 * sm((u - 0.7) / 0.3), fly }; }
    return mod;
  }
  return { install, TL };
})();
