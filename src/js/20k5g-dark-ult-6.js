/* ---------- Dark, reworked: Final Eclipse ----------
   A black sphere forms high over the aim; its underside tears open and a raven-winged apparition drops out, wings folded,
   and one decisive downbeat stops its fall beneath the sphere. Hovering, it raises both hands: violet streams run up its
   arms into the sphere, motes and fragments draw up from the ground, the sphere swells and its currents quicken. Then
   shoulders back, wings braced, both arms drive down: the sphere tears free and plunges, stretching, with a smoky wake,
   and strikes the ground: a disc, ONE Dark AoE hit (14 x base x K x evoK, kb 7, stun 0.5, R = 3.2 K .. 4.4 K), a huge low
   shockwave and a rising wall of violet-black energy. The apparition folds its wings and dissolves into black feathers
   and smoke. The old Night Without Reflection is replaced (same cost and cooldown: 100 / 22; its row is in 20k1).
   The demon is a real posed 3D figure built on Anima3D (oriented ellipsoids, capsule limbs and blobs placed in model
   space, posed per keyframe with eased blends, depth-sorted, cel-shaded with ink, a violet rim wash and gloss): not a
   person but an apparition: an elongated faceted body of layered dark plates, a void head with one violet crescent slit
   and a crown of spines, broad shoulders, overly long tapering arms ending in claw fingers (they read as hands raised
   overhead, then thrown down), legs that taper to points and trail smoke, violet light at every joint seam. The raven
   wings are feathered: a plan of primaries, secondaries and coverts (more rows by level) hung from a three-jointed arm
   whose joints take the pose a few frames apart (delayed mid-wing and tips), each feather a cached cel-shaded sprite laid
   over its true 3D quad by an affine map (the camera is orthographic, so the fit is exact). Pose keys: fall (folded),
   downbeat, hover (slow cycle), raise (palms up), brace, throw, dissolve. The sphere is a shaded black globe (cached lit
   body and shade, latitude currents and cells, inward-curling shadow streams, a thin #A55CFF limb; Celestial: a second
   counter-moving current layer and fragments orbiting just inside the shell). Normal camera, combat never paused, the
   warning and the monsters visible; near the pet everything dims smoothly (never a cut-out). No per-frame gradients, no
   shadowBlur: the soft pieces and the feathers are cached sprites. */
(() => {
  const U = ELEM_IMPL.dark.ult; delete U.noreflection;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF', WHITE = '#FFFFFF', INK = '#06040A';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const CE = GeoKit.CE;
  let H;
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  // a picture laid over a parallelogram: o its first corner, u and v its sides
  function quad(c, img, ox, oy, ux, uy, vx, vy) { c.save(); c.transform(ux, uy, vx, vy, ox, oy); c.drawImage(img, 0, 0, 1, 1); c.restore(); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }
  const v3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], mix: (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)], norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] };

  /* ---- cached sprites (every edge soft) ---- */
  const haloSpr = () => fxSprite('du6halo', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(8,5,15,0.72)'); gr.addColorStop(0.42, 'rgba(14,8,26,0.42)'); gr.addColorStop(0.74, 'rgba(24,11,46,0.15)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const bodySpr = () => fxSprite('du6body', 256, 256, g => { const x = 128, y = 128, r = 120, gr = g.createRadialGradient(x - r * 0.32, y - r * 0.36, r * 0.04, x + r * 0.06, y + r * 0.08, r * 1.02);
    gr.addColorStop(0, '#54406A'); gr.addColorStop(0.14, SMOKE); gr.addColorStop(0.4, PLUM); gr.addColorStop(0.72, BODY); gr.addColorStop(1, VOID); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); g.strokeStyle = rgba(ENERGY, 0.28); g.lineWidth = r * 0.16; g.beginPath(); g.arc(x + r * 0.08, y + r * 0.1, r * 0.9, 0.25, 1.95); g.stroke(); g.strokeStyle = rgba(EDGE, 0.14); g.lineWidth = r * 0.06; g.beginPath(); g.arc(x + r * 0.08, y + r * 0.1, r * 0.95, 0.45, 1.75); g.stroke(); g.restore(); });
  const shadeSpr = () => fxSprite('du6shade', 256, 256, g => { const x = 128, y = 128, r = 120, gr = g.createRadialGradient(x - r * 0.28, y - r * 0.32, r * 0.1, x + r * 0.04, y + r * 0.06, r * 1.08);
    gr.addColorStop(0, 'rgba(8,5,15,0)'); gr.addColorStop(0.42, 'rgba(8,5,15,0.06)'); gr.addColorStop(0.72, 'rgba(8,5,15,0.4)'); gr.addColorStop(0.9, 'rgba(8,5,15,0.74)'); gr.addColorStop(1, 'rgba(8,5,15,0.9)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
  const bandSpr = () => fxSprite('du6band', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(24,11,46,0)'], [0.7, 'rgba(24,11,46,0)'], [0.79, 'rgba(24,11,46,0.45)'], [0.87, 'rgba(43,11,69,0.7)'], [0.92, 'rgba(109,40,168,0.8)'], [0.955, 'rgba(165,92,255,0.95)'], [0.98, 'rgba(208,174,255,0.5)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const bandLSpr = () => fxSprite('du6bandL', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(109,40,168,0)'], [0.68, 'rgba(109,40,168,0)'], [0.85, 'rgba(109,40,168,0.35)'], [0.94, 'rgba(165,92,255,0.8)'], [0.97, 'rgba(208,174,255,0.9)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const puffSpr = () => fxSprite('du6puff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(70,48,82,0.6)'); gr.addColorStop(0.5, 'rgba(43,11,69,0.32)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const dpuffSpr = () => fxSprite('du6dpuff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(24,11,46,0.72)'); gr.addColorStop(0.45, 'rgba(43,11,69,0.4)'); gr.addColorStop(0.8, 'rgba(70,48,82,0.1)'); gr.addColorStop(1, 'rgba(70,48,82,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  // a streak: strongest at its left end (the wake behind the plunging sphere)
  const streakSpr = () => fxSprite('du6streak', 256, 64, g => { const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(8,5,15,0.92)'); gr.addColorStop(0.4, 'rgba(24,11,46,0.6)'); gr.addColorStop(1, 'rgba(43,11,69,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, 64); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.5, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, 256, 64); });
  // the rising wall: a slice of dark energy, violet at its foot, feathered to nothing at its top and at both sides
  const wallSpr = () => fxSprite('du6wall', 64, 128, g => { const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(165,92,255,0.9)'); gr.addColorStop(0.08, 'rgba(109,40,168,0.8)'); gr.addColorStop(0.25, 'rgba(24,11,46,0.85)'); gr.addColorStop(0.6, 'rgba(24,11,46,0.5)'); gr.addColorStop(1, 'rgba(43,11,69,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
    g.globalCompositeOperation = 'destination-in'; const gh = g.createLinearGradient(0, 0, 64, 0); gh.addColorStop(0, 'rgba(0,0,0,0.2)'); gh.addColorStop(0.5, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0.2)'); g.fillStyle = gh; g.fillRect(0, 0, 64, 128); });
  /* a feather: the shaft along +x from the root (0) to the tip (W), vanes across y; cel-shaded (a darker outer vane, a
     lighter band beside the shaft, ink outline), a violet rim at the tip for the luminous variants. kind 0 primary (long,
     narrow, hooked tip), 1 secondary (broad), 2 covert (short, rounded) */
  const FW = 192, FH = 48;
  function featherSpr(kind, tone) { return fxSprite('du6fe' + kind + tone, FW, FH, g => {
    const col = tone === 1 ? '#151018' : '#0E0A10', sh = '#050306', hi = tone === 1 ? '#3A3042' : '#2A2230';
    const W = FW - 6, cy = FH / 2, w = kind === 2 ? FH * 0.46 : kind === 1 ? FH * 0.42 : FH * 0.34, x0 = 4;
    const path = () => { g.beginPath(); g.moveTo(x0, cy); if (kind === 2) { g.bezierCurveTo(x0 + W * 0.1, cy - w, x0 + W * 0.7, cy - w * 1.05, x0 + W, cy - w * 0.1); g.bezierCurveTo(x0 + W * 0.7, cy + w * 1.05, x0 + W * 0.1, cy + w, x0, cy); }
      else { g.bezierCurveTo(x0 + W * 0.08, cy - w * 0.9, x0 + W * 0.7, cy - w * 1.1, x0 + W, cy - w * (kind ? 0.1 : 0.25)); g.quadraticCurveTo(x0 + W * 0.96, cy + w * 0.3, x0 + W * 0.86, cy + w * (kind ? 0.75 : 0.5)); g.bezierCurveTo(x0 + W * 0.55, cy + w * (kind ? 1.0 : 0.7), x0 + W * 0.1, cy + w * (kind ? 0.9 : 0.8), x0, cy); } g.closePath(); };
    path(); g.fillStyle = col; g.fill();
    g.save(); path(); g.clip();
    // the outer vane darker, the inner vane with a light band beside the shaft, barbs as faint strokes
    g.fillStyle = sh; g.fillRect(0, 0, FW, cy - w * 0.3); g.fillStyle = rgba(sh, 0.5); g.fillRect(0, cy + w * 0.55, FW, FH);
    g.fillStyle = hi; g.beginPath(); g.moveTo(x0 + W * 0.05, cy + 1); g.quadraticCurveTo(x0 + W * 0.5, cy + w * 0.55, x0 + W * 0.95, cy + 1); g.quadraticCurveTo(x0 + W * 0.5, cy + w * 0.2, x0 + W * 0.05, cy + 1); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 0.8; for (let i = 1; i < 14; i++) { const x = x0 + W * (0.08 + i * 0.065); g.beginPath(); g.moveTo(x, cy); g.lineTo(x + W * 0.1, cy - w * 1.1); g.moveTo(x, cy); g.lineTo(x + W * 0.1, cy + w * 1.1); g.stroke(); }
    if (tone === 2) { g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(x0 + W * 0.55, 0, x0 + W, 0); gr.addColorStop(0, 'rgba(90,74,102,0)'); gr.addColorStop(1, 'rgba(90,74,102,0.6)'); g.fillStyle = gr; g.fillRect(0, 0, FW, FH); }
    g.restore();
    // the shaft and the ink outline
    g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x0 + 2, cy); g.lineTo(x0 + W * 0.92, cy - (kind ? 0 : w * 0.12)); g.stroke(); g.strokeStyle = rgba(hi, 0.7); g.lineWidth = 0.9; g.beginPath(); g.moveTo(x0 + 2, cy - 0.8); g.lineTo(x0 + W * 0.9, cy - 0.8 - (kind ? 0 : w * 0.12)); g.stroke();
    path(); g.strokeStyle = INK; g.lineWidth = 2.4; g.lineJoin = 'round'; g.stroke();
    path(); g.strokeStyle = rgba('#5A4A66', tone === 2 ? 0.8 : 0.45); g.lineWidth = 1; g.stroke();
    // the gloss: a pale streak along the inner vane
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(150,140,170,0.22)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0 + W * 0.2, cy + w * 0.32); g.quadraticCurveTo(x0 + W * 0.55, cy + w * 0.48, x0 + W * 0.85, cy + w * 0.2); g.stroke(); }); }

  const voidSpr = () => fxSprite('du6void', 64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,1)'); gr.addColorStop(0.8, 'rgba(10,2,6,0.75)'); gr.addColorStop(1, 'rgba(40,6,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const CPa = Math.cos(0.38), SPa = Math.sin(0.38), LW = v3.norm([-0.55, -0.35, 0.78]);   // Anima3D's camera pitch; the key light in its world
  /* ================= the demon: an Anima3D model ================= */
  /* the poses: the body's lean (+ forward), the head's nod, the arms (upper and forearm directions in the torso's frame
     for the right arm: f, s, h; the left is mirrored), the palm normal and finger direction, the legs, the wings (elevation,
     sweep back, fold 0..1, fan of the primaries), the hover cycle's weight */
  const POSE = {
    fall: { lean: 0.55, headP: -0.35, armU: [-0.25, 0.3, -0.92], armF: [0.1, 0.15, -1], palmN: [0, -1, 0], fing: [0.2, 0, -1], legU: [-0.6, 0.15, -0.8], legL: [-0.5, 0.1, -0.85], wEl: 1.25, wSw: 0.7, wFold: 0.3, wFan: 0, hov: 0 },
    beat: { lean: 0.12, headP: 0, armU: [0.1, 0.75, -0.65], armF: [0.3, 0.35, -0.9], palmN: [0, -1, 0], fing: [0.3, 0.1, -1], legU: [-0.2, 0.2, -0.95], legL: [-0.1, 0.05, -1], wEl: -0.75, wSw: 0.05, wFold: 0, wFan: 1, hov: 0 },
    hover: { lean: 0.05, headP: 0.05, armU: [0.1, 0.4, -0.9], armF: [0.5, 0.05, -0.8], palmN: [0, -1, 0.2], fing: [0.6, 0, -0.8], legU: [0.05, 0.15, -1], legL: [-0.25, 0.05, -0.97], wEl: 0.35, wSw: 0.3, wFold: 0, wFan: 0.6, hov: 1 },
    raise: { lean: -0.1, headP: 0.5, armU: [0.12, 0.42, 0.9], armF: [0.05, -0.2, 0.98], palmN: [0, 0, 1], fing: [-0.25, 0.3, 0.92], legU: [0.05, 0.12, -1], legL: [-0.2, 0.05, -0.98], wEl: 0.55, wSw: 0.25, wFold: 0, wFan: 0.8, hov: 0.7 },
    brace: { lean: -0.32, headP: 0.55, armU: [-0.3, 0.48, 0.82], armF: [-0.25, -0.2, 0.95], palmN: [0.25, 0, 1], fing: [-0.35, 0.25, 0.9], legU: [-0.15, 0.12, -0.98], legL: [-0.3, 0.05, -0.95], wEl: 0.9, wSw: -0.1, wFold: 0, wFan: 1, hov: 0 },
    throw: { lean: 0.55, headP: -0.45, armU: [0.62, 0.3, -0.72], armF: [0.75, 0.05, -0.65], palmN: [0.6, 0, -0.8], fing: [0.85, 0.1, -0.55], legU: [-0.45, 0.15, -0.88], legL: [-0.5, 0.05, -0.85], wEl: -0.2, wSw: -0.3, wFold: 0, wFan: 1, hov: 0.3 },
    gather: { lean: -0.18, headP: 0.6, armU: [0.35, 0.55, -0.55], armF: [0.55, -0.7, 0.35], palmN: [-0.3, -0.8, 0], fing: [0.3, -0.8, 0.4], legU: [0.1, 0.18, -0.98], legL: [-0.15, 0.06, -0.99], wEl: 1.15, wSw: 0.55, wFold: 0.75, wFan: 0.1, hov: 0 },
    dissolve: { lean: 0.2, headP: -0.2, armU: [0.05, 0.3, -0.95], armF: [0.2, 0.1, -0.97], palmN: [0, -1, 0], fing: [0.2, 0, -1], legU: [0, 0.12, -1], legL: [-0.1, 0.03, -1], wEl: 1.0, wSw: 0.45, wFold: 0.35, wFan: 0.2, hov: 0.3 },
  };
  const PKEYS = Object.keys(POSE.fall);
  function blendPose(a, b, u) { const o = {}; for (const k of PKEYS) { const A = a[k], B = b[k]; o[k] = Array.isArray(A) ? v3.mix(A, B, u) : lerp(A, B, u); } return o; }
  // the pose at time t from a keyframe list [[t, name], ...] (eased between neighbours)
  function poseAt(KF, t) { if (t <= KF[0][0]) return POSE[KF[0][1]]; for (let i = 0; i < KF.length - 1; i++) { if (t < KF[i + 1][0]) { const u = (t - KF[i][0]) / (KF[i + 1][0] - KF[i][0]); return blendPose(POSE[KF[i][1]], POSE[KF[i + 1][1]], u * u * (3 - 2 * u)); } } return POSE[KF[KF.length - 1][1]]; }
  /* the wing plan, in the wing's own plane (x out along the arm in body units, y up): the arm's joints and every feather
     [x, y, angle (radians; 0 = out along the arm, -pi/2 = straight down/back), length, width, kind, row]; more rows by level */
  const XE = 15, XW = 31, XT = 52;
  function wingPlan(ev) {
    const F = [], D = Math.PI / 180, np = 9 + (ev >= 7 ? 2 : 0), prL = 1 + 0.08 * (ev - 1) / 6 * 6;
    // primaries: fan from the hand, the outermost pointing nearly along it; longest in the middle
    for (let i = np - 1; i >= 0; i--) { const k = i / (np - 1); F.push([XW + 1 + k * (XT - XW - 2), 1.5 + k * 1.2, lerp(-82, -4, Math.pow(k, 0.85)) * D, lerp(25, 30, Math.sin(k * 2.4) * 0.6 + k * 0.45) * prL, 4.8, 0, 0]); }
    // secondaries: broad, hanging from the forearm and the upper arm
    for (let i = 7; i >= 0; i--) { const k = i / 7; F.push([2 + k * (XW - 3), 0.5 + k * 1.0, lerp(-96, -82, k) * D, lerp(17, 21, k), 5.4, 1, 1]); }
    // greater coverts over their roots (Adept and up), median coverts over the wrist and hand (Celestial)
    if (ev >= 4) for (let i = 8; i >= 0; i--) { const k = i / 8; F.push([1 + k * (XT - 6), 1.6 + k * 1.3, lerp(-98, -24, Math.pow(k, 0.85)) * D, lerp(11, 13, k), 4.0, 1, 2]); }
    if (ev >= 7) for (let i = 5; i >= 0; i--) { const k = i / 5; F.push([XW - 4 + k * (XT - XW), 3.2 + k * 0.8, lerp(-60, -12, k) * D, 9.5, 2.8, 2, 3]); }
    // lesser coverts: short, lying along the bone
    for (let i = 0; i < 9; i++) { const k = i / 8; F.push([1 + k * (XT - 4), 2.4 + k * 1.2, lerp(-100, -40, k) * D, 7 + 0.5 * Math.sin(i * 1.7), 2.8, 2, 4]); }
    return F;
  }
  const PLANS = {};
  const planOf = ev => PLANS[ev] || (PLANS[ev] = wingPlan(ev));
  /* a wing's frames: three segments (upper arm, forearm, hand) each with its own elevation and sweep (the mid-wing and tip
     take the pose a little late), folded by a Z (upper arm back, forearm forward, hand back). W(i, x, y) maps a plan
     point through segment i's frame; seg(x) picks the segment a root lies in */
  function wingFrames(root, side, PZ, fold, sc) {
    sc = sc || 1;
    const up0 = v3.norm([0.35, 0, 0.94]), out0 = [0, side, 0];
    const rotF = (v, a) => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)], rotH = (v, b) => [v[0] * Math.cos(b) - v[1] * Math.sin(b), v[0] * Math.sin(b) + v[1] * Math.cos(b), v[2]];
    const segs = [], J = [root], XS = [0, XE, XW, XT];
    for (let i = 0; i < 3; i++) { const el = PZ[i].el + fold * [0.25, 0.1, -0.3][i], sw = PZ[i].sw + fold * [0.9, -1.0, 1.8][i]; const ex = rotH(rotF(out0, el * side), sw * side), ey = rotH(rotF(up0, el * side), sw * side); segs.push({ ex, ey, J: J[i], x0: XS[i] }); J.push(v3.add(J[i], v3.mul(ex, (XS[i + 1] - XS[i]) * sc))); }
    return { J, segs, W: (i, x, y) => { const s = segs[i]; return v3.add(s.J, v3.add(v3.mul(s.ex, (x - s.x0) * sc), v3.mul(s.ey, y * sc))); }, seg: x => x < XE ? 0 : x < XW ? 1 : 2 };
  }
  /* the model. o: pose (the blended pose), wz (wing poses per segment, lagged: [{el, sw}, ...]), t, ev, out (filled with
     screen points: hands, head, wing tips), dis (dissolving 0..1), feOff (feather fall-off offsets set as it dissolves),
     seam (violet seams 0..1), glowK (joint light) */
  Anima3D.MODELS.fedemon = (k, t, o) => {
    const A = Anima3D.H, R = A.R, u = R.u, P = o.pose, ev = o.ev, CEL = ev >= 7, ADE = ev >= 4, out = o.out, dis = o.dis || 0, seamK = o.seam || 0;
    const GK = o.glowK == null ? 1 : o.glowK, sk = 0.35 + 0.65 * seamK, LOW = typeof st !== 'undefined' && st && st.lowFx;
    /* materials: the body is obsidian (polished volcanic glass: a purple-tinted mid tone, near-black shadow, a violet lit
       band, a violet rim on the shadow side and a hard white glint); the armour, horns, claws and spikes a cooler, greyer
       black with a grey-violet rim, so the plates read over the glass */
    const SK = { col: '#2A1840', shade: '#0E0A14', hi: '#6D28A8', line: INK, glowCol: '#A55CFF', glowA: 0.32, d2: 0.34, d1: 0.22, shade2: false, spec: 0.7, specR: 0.13 };
    const SKs = { ...SK, glowCol: null, spec: false };   // (small masses: no rim pass, so the round ones use the cached sprites)
    const RK = { col: '#14121C', shade: '#07060C', hi: '#3A3648', line: INK, glowCol: '#6A6078', glowA: 0.5, d2: 0.26, d1: 0.18, shade2: false };
    const SV = { col: '#14121C', shade: '#050408', hi: '#3A3648', line: INK, glowCol: '#6A6078', glowA: 0.45, d2: 0.32, d1: 0.16, shade2: false };
    /* the torso frame: hips at h 30, leaning; small sways in the hover */
    const HIP = [0, 0, 30 + Math.sin(t * 2.6) * 0.4], TF = A.frame(HIP, Math.sin(t * 0.9) * 0.04, -P.lean, Math.sin(t * 1.3) * 0.03), at = TF.at, dir = TF.dir;
    // a joint: a rounded knot of glass
    const joint = (p, r) => A.sphere(p, r * 1.2, { ...SKs, z: -0.2 });
    /* an armour plate: a jagged faceted slab of glossy black (a sharp blob, cel-shaded), creases from its centre to its
       points, violet energy along its first edge (the seam where it meets the next plate; brighter by level) */
    const plate = (pts, o2) => { o2 = o2 || {}; const it = A.blob(pts, { ...RK, sharp: true, z: o2.z || 0, col: o2.col || RK.col, specAt: null, spec: false }); if (LOW) return; const n = o2.seams == null ? 1 : o2.seams;
      A.decal(pts.reduce((m, p) => v3.add(m, v3.mul(p, 1 / pts.length)), [0, 0, 0]), c => { const sp = it.sp, cx = sp.reduce((q, p) => q + p[0], 0) / sp.length, cy = sp.reduce((q, p) => q + p[1], 0) / sp.length; c.lineCap = 'round'; c.strokeStyle = 'rgba(90,74,102,0.5)'; c.lineWidth = Math.max(0.6, u * 0.4); c.beginPath(); for (let i = 0; i < sp.length; i += 2) { c.moveTo(cx, cy); c.lineTo(sp[i][0] * 0.9 + cx * 0.1, sp[i][1] * 0.9 + cy * 0.1); } c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(cx - u * 0.9, cy - u * 0.9, u * 0.8, u * 0.35, -0.7, 0, TAU); c.fill();
        if (n > 0) { c.globalCompositeOperation = 'lighter'; c.lineWidth = Math.max(0.8, u * 0.6); c.strokeStyle = rgba(EDGE, 0.45 * sk); c.beginPath(); for (let i = 0; i < n; i++) { const p0 = sp[i], p1 = sp[i + 1]; c.moveTo(p0[0] * 0.9 + cx * 0.1, p0[1] * 0.9 + cy * 0.1); c.lineTo(p1[0] * 0.9 + cx * 0.1, p1[1] * 0.9 + cy * 0.1); } c.stroke(); if (seamK > 0.5) { c.lineWidth = Math.max(0.5, u * 0.25); c.strokeStyle = rgba(ACC, 0.35 * seamK); c.stroke(); } } }, (o2.z || 0) - 0.05); };
    /* a spike: a real 3D cone of glossy black from base b along d, L long, r wide at its foot; six facets, each lit by its
       true normal (shadow, base, lit bands), the faces turned away culled, an ink silhouette, a grey-violet rim on its
       shaded edge and a pale glint down its lit one; it turns with the body */
    let nSp = 0; const spike = (b, d, L, r, z) => { if (LOW && (nSp++ % 2)) return; const dn = v3.norm(d), tip = v3.add(b, v3.mul(dn, L)), e1 = v3.norm(v3.cross(dn, Math.abs(dn[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), e2 = v3.cross(dn, e1), N = 6, ring = [];
      for (let i = 0; i < N; i++) { const a = i / N * TAU; ring.push(v3.add(b, v3.add(v3.mul(e1, Math.cos(a) * r), v3.mul(e2, Math.sin(a) * r)))); }
      A.decal(v3.mix(b, tip, 0.35), c => { const RR = A.R, tp = A.P(tip), S = ring.map(A.P), fr = [], band = [];
        for (let i = 0; i < N; i++) { const j = (i + 1) % N, mid = v3.mix(ring[i], ring[j], 0.5); let n = v3.norm(v3.cross(v3.sub(ring[j], tip), v3.sub(ring[i], tip))); if (n[0] * (mid[0] - b[0]) + n[1] * (mid[1] - b[1]) + n[2] * (mid[2] - b[2]) < 0) n = v3.mul(n, -1);
          const w = [n[0] * RR.sy + n[1] * RR.cy, -n[0] * RR.cy + n[1] * RR.sy, n[2]]; fr.push(-w[1] * CPa + w[2] * SPa > 0); const l = w[0] * LW[0] + w[1] * LW[1] + w[2] * LW[2]; band.push(l > 0.5 ? 2 : l > 0.05 ? 1 : 0); }
        const COL = ['#050408', '#14121C', '#3E3A4E'];
        for (let bd = 0; bd < 3; bd++) { let any = false; c.beginPath(); for (let i = 0; i < N; i++) { if (!fr[i] || band[i] !== bd) continue; const j = (i + 1) % N; c.moveTo(tp[0], tp[1]); c.lineTo(S[i][0], S[i][1]); c.lineTo(S[j][0], S[j][1]); c.closePath(); any = true; } if (any) { c.fillStyle = COL[bd]; c.fill(); } }
        c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = Math.max(1, u * 0.9); c.beginPath();
        for (let i = 0; i < N; i++) { const h = (i + N - 1) % N; if (fr[i] !== fr[h]) { c.moveTo(tp[0], tp[1]); c.lineTo(S[i][0], S[i][1]); } if (fr[i]) { const j = (i + 1) % N; c.moveTo(S[i][0], S[i][1]); c.lineTo(S[j][0], S[j][1]); } } c.stroke();
        // the glint down the edge between a lit facet and a darker one; the rim on the shaded silhouette
        c.lineWidth = Math.max(0.6, u * 0.35); for (let i = 0; i < N; i++) { const h = (i + N - 1) % N; if (fr[i] && fr[h] && band[i] !== band[h] && Math.max(band[i], band[h]) === 2) { c.strokeStyle = 'rgba(170,160,190,0.4)'; c.beginPath(); c.moveTo(tp[0], tp[1]); c.lineTo(S[i][0], S[i][1]); c.stroke(); } else if (fr[i] !== fr[h] && band[fr[i] ? i : h] === 0) { c.strokeStyle = 'rgba(90,74,102,0.8)'; c.beginPath(); c.moveTo(tp[0], tp[1]); c.lineTo(S[i][0] * 0.85 + tp[0] * 0.15, S[i][1] * 0.85 + tp[1] * 0.15); c.stroke(); } } }, z || 0); };
    if (o.dbgNoBody) { out.head = [0, 0]; } else {
    /* ---- the body: an obsidian core sheathed in abstract armour: a faceted breastplate of four layered wedges, a
       segmented carapace down the belly, shards over the flanks, jagged plates over the back between the wings; violet
       energy in the seams between them, spikes rising from their edges ---- */
    A.ell(at(0, 0, 0.5), [4.6, 6.4, 4.4], { B: TF.B, ...SK });                                    // the pelvis
    A.ell(at(0.3, 0, 14), [5.4, 9.0, 13.5], { B: TF.B, ...SK });                                   // the core
    for (let i = 3; i >= 0; i--) { const h = 26.5 - i * 4.0, w = 12.5 - i * 2.0, x = 6.0 + i * 0.2; plate([at(x - 0.6, -w, h + 1.6), at(x - 0.6, w, h + 1.6), at(x, w * 0.62, h - 3.0), at(x + 0.4, 0, h - 6.4), at(x, -w * 0.62, h - 3.0)], { z: -1.0 - (3 - i) * 0.12 }); }   // the breastplate
    for (let i = 2; i >= 0; i--) { const h = 9.5 - i * 3.4, w = 6.4 - i * 0.6, x = 5.4 - i * 0.2; plate([at(x - 0.3, -w, h + 1.6), at(x - 0.3, w, h + 1.6), at(x, w * 0.8, h - 1.4), at(x + 0.3, 0, h - 2.2), at(x, -w * 0.8, h - 1.4)], { z: -0.7 - (2 - i) * 0.08 }); }   // the belly carapace
    for (const q of [-1, 1]) { plate([at(3, q * 9.5, 21), at(-0.5, q * 11, 15), at(0.5, q * 9, 6), at(3.5, q * 7.5, 12)], { z: -0.4 }); plate([at(-1.5, q * 10.5, 22), at(-4.5, q * 9, 17), at(-3.5, q * 7.5, 9), at(-1, q * 9.5, 14)], { z: 0.2, seams: 0 }); }   // the flank shards
    for (let i = 0; i < 3; i++) { const h = 25 - i * 6, w = 8.5 - i * 1.2; plate([at(-5.6, -w, h + 2.4), at(-5.6, w, h + 2.4), at(-6.4, w * 0.5, h - 2.4), at(-6.9, 0, h - 3.8), at(-6.4, -w * 0.5, h - 2.4)], { z: 0.4 + i * 0.05 }); }   // the back plates
    // spikes rising from the plate edges: the breastplate's top corners, the carapace's sides
    for (const q of [-1, 1]) { spike(at(5.0, q * 11.5, 27.5), dir(0.35, q * 0.55, 0.8), 4.4, 0.95, -1.5); spike(at(5.2, q * 6.2, 10.5), dir(0.6, q * 0.75, 0.1), 2.8, 0.7, -1.0); }
    for (const q of [-1, 1]) plate([at(2.5, q * 2.5, 2.5), at(1.0, q * 7.8, 3.0), at(0.0, q * 8.0, -3.5), at(2.0, q * 4.0, -4.5)], { z: -0.6 });   // the hip plates
    for (const q of [-1, 1]) plate([at(4.5, q * 3.0, 27.5), at(2.0, q * 12.5, 27.0), at(3.5, q * 9.0, 24.0), at(5.5, q * 3.5, 24.5)], { z: -0.8 });   // the gorget
    // the pauldrons: a great jagged plate on each shoulder, a second under it, three spikes raking up and out
    for (const q of [-1, 1]) { plate([at(2, q * 9, 29), at(0, q * 13.5, 33.5), at(-1, q * 18, 31.5), at(-3, q * 22, 28.0), at(-2.5, q * 21, 23.5), at(1.5, q * 12, 24)], { z: -1.2 }); plate([at(3.5, q * 12, 24.5), at(1, q * 21, 26), at(0.5, q * 20.5, 21), at(3.5, q * 13.5, 20)], { z: -0.7 });
      for (let k = 0; k < 3; k++) spike(at(-0.5 - k * 0.6, q * (13.5 + k * 3), 31.5 - k * 1.8), dir(-0.3, q * (0.4 + k * 0.2), 0.88 - k * 0.12), 10 - k * 2, 1.9 - k * 0.25, -1.4); }
    if (CEL) { for (const q of [-1, 1]) { for (let k = 0; k < 3; k++) spike(at(5.9 - k * 0.2, q * (4 + k * 2.6), 23.5 - k * 2.2), dir(0.75, q * 0.6, 0.35), 3.4 - k * 0.5, 0.85, -1.3); for (let k = 0; k < 4; k++) spike(at(-4.6 + k * 0.4, q * 3.6, 24 - k * 5), dir(-0.75, q * 0.45, 0.8), 5.4 - k * 0.8, 1.15 - k * 0.12, 0.25); } }
    // the spine: a row of spikes down the back, raked back and up
    for (let k = 0; k < 5; k++) spike(at(-5.6 + k * 0.4, 0, 27 - k * 5), dir(-0.75, 0, 1 - k * 0.12), 8 - k * 1.0, 1.7 - k * 0.18, 0.2);
    /* ---- the head: a heavy skull, a black brow plate, two long backswept horns, and for a face an empty black hole
       with a violet light deep inside it ---- */
    const HC = at(2.5, 0, 34.5), HF = A.frame(HC, Math.sin(t * 0.7) * 0.06, P.headP - P.lean * 0.6, 0), hat = HF.at;
    A.tube([at(1.5, 0, 27), at(2.2, 0, 31.5)], v => 3.4 - v * 0.6, { ...SKs });
    A.ell(HC, [5.0, 4.6, 5.4], { B: HF.B, ...SK, spec: 0.25, specR: 0.08 });
    A.ell(hat(2.8, 0, -2.4), [3.2, 3.2, 2.4], { B: HF.B, ...SKs, z: -0.3 });                                   // the jaw
    plate([hat(4.2, -3.6, 2.4), hat(4.4, 3.6, 2.4), hat(2.0, 4.8, 5.0), hat(-2.5, 0, 6.2), hat(2.0, -4.8, 5.0)], { z: -0.9, seams: 0 });   // the brow and crown plate
    const hk = CEL ? 1.45 : 1; for (const q of [-1, 1]) { const hp = A.bez3(hat(0.5, q * 2.8, 4.0), hat(-3 * hk, q * 5.6 * hk, 8.8 * hk), hat(-9 * hk, q * 6.4 * hk, 10.8 * hk), hat(-15 * hk, q * 4.8 * hk, 13.8 * hk), 7); A.tube(hp, v => (1.5 - v * 1.3) * (CEL ? 1.2 : 1), { ...SV, z: 0.6, spec: 0.5, specAt: A.P(hp[2]) });
      if (CEL) { const h2 = A.bez3(hat(-1.0, q * 3.8, 1.2), hat(-4.5, q * 7.5, 2.8), hat(-9, q * 8.6, 3.4), hat(-12.5, q * 7.6, 6.4), 6); A.tube(h2, v => 1.2 - v * 1.05, { ...SV, z: 0.9 }); } }
    { const fK = 0.75 + 0.25 * Math.sin(t * 3.2) + 0.7 * (o.charge || 0) + 0.9 * (o.flare || 0);
      A.mark(hat(4.95, 0, -0.4), HF.B[0], 3.9, (c, r, face) => {
        // the hole: where a face should be, a void that falls off softly into black (no lip, no eyes)
        c.drawImage(voidSpr(), -r * 1.0, -r * 1.25, r * 2.0, r * 2.5); c.drawImage(voidSpr(), -r * 0.7, -r * 0.95, r * 1.4, r * 1.9);
        // the light deep inside: a soft violet glow, a small pale centre; it breathes, and flares with the charge and the throw
        c.globalCompositeOperation = 'lighter'; c.globalAlpha *= Math.min(1, 0.4 + 0.6 * face);
        const gr = r * (0.42 + 0.2 * fK); c.globalAlpha *= 0.85; c.drawImage(glowSprite(EDGE), -gr, -gr * 1.1 + r * 0.1, gr * 2, gr * 2.2);
        const gc = r * (0.15 + 0.1 * fK); c.drawImage(glowSprite(ACC), -gc, -gc + r * 0.1, gc * 2, gc * 2); }, -0.3);
      A.glowAt(hat(4.6, 0, -0.2), 4 + 4 * fK, EDGE, (0.18 + 0.25 * fK) * GK); }
    out.head = A.P(HC);
    /* ---- the arms: deltoids, heavy biceps, forearm bracers with spikes, an elbow spike, long black claws ---- */
    const LU = 17, LF = 16, LH = 5.5;
    for (const q of [-1, 1]) {
      const sh = at(0, q * 14.5, 25), du = v3.norm(dir(P.armU[0], q * P.armU[1], P.armU[2])), df = v3.norm(dir(P.armF[0], q * P.armF[1], P.armF[2]));
      const el = v3.add(sh, v3.mul(du, LU)), wr = v3.add(el, v3.mul(df, LF)), pn = v3.norm(dir(P.palmN[0], q * P.palmN[1], P.palmN[2])), fd = v3.norm(dir(P.fing[0], q * P.fing[1], P.fing[2]));
      const side = v3.norm(v3.cross(pn, df)), up = v3.norm(v3.cross(du, v3.norm(v3.cross(du, [0, q, 0]))));
      A.sphere(v3.add(sh, v3.mul(du, 2)), 4.0, { ...SKs, z: -0.3 });                                            // the deltoid
      A.tube([sh, v3.mix(sh, el, 0.5), el], v => 3.0 - v * 1.0, { ...SK });
      { const ob = v3.norm(v3.add(v3.mul(side, -q), v3.mul(up, 0.3))), a0 = v3.mix(sh, el, 0.2), a1 = v3.mix(sh, el, 0.8); A.ell(v3.mix(sh, el, 0.45), [2.6, 2.4, 4.0], { B: [up, side, du], ...SKs, z: -0.2 }); plate([v3.add(a0, v3.mul(ob, 2.6)), v3.add(v3.mix(a0, a1, 0.5), v3.add(v3.mul(ob, 3.4), v3.mul(up, 1.4))), v3.add(a1, v3.mul(ob, 2.4)), v3.add(v3.mix(a0, a1, 0.55), v3.add(v3.mul(ob, 1.6), v3.mul(up, -1.8)))], { z: -0.6 }); }   // the upper arm: a mass of glass under a crystal plate
      if (CEL) { for (let k = 0; k < 2; k++) { const ob = v3.mul(side, -q), bp = v3.add(v3.mix(sh, el, 0.35 + k * 0.3), v3.mul(v3.norm(v3.add(ob, v3.mul(up, -0.2))), 2.6)); spike(bp, v3.add(v3.norm(v3.add(ob, v3.mul(up, -0.2))), v3.mul(du, -0.4)), 4.2 - k * 0.6, 0.95, -0.7); } }
      joint(el, 1.6);
      A.tube([el, v3.mix(el, wr, 0.5), wr], v => 2.3 - v * 0.8, { ...SK });
      A.ell(v3.mix(el, wr, 0.3), [2.3, 2.3, 3.8], { B: [v3.norm(v3.cross(df, side)), side, df], ...SKs, z: -0.2 });   // the forearm's mass
      // the bracer: jagged plates along the outside of the forearm, a row of spikes along its ridge
      const fs = v3.norm(v3.cross(df, du[2] > 0.9 ? [1, 0, 0] : [0, 0, 1])), fo = v3.norm(v3.cross(fs, df)), b0 = v3.mix(el, wr, 0.18), b1 = v3.mix(el, wr, 0.62), b2 = v3.mix(el, wr, 0.98);
      plate([v3.add(b0, v3.mul(fo, 2.0)), v3.add(b1, v3.add(v3.mul(fo, 2.8), v3.mul(fs, 1.6))), v3.add(b1, v3.add(v3.mul(fo, 1.2), v3.mul(fs, 2.6))), v3.add(b0, v3.add(v3.mul(fo, 0.6), v3.mul(fs, 2.4)))], { z: -0.6 });
      plate([v3.add(b1, v3.mul(fo, 2.6)), v3.add(b2, v3.add(v3.mul(fo, 2.0), v3.mul(fs, 1.4))), v3.add(b2, v3.add(v3.mul(fo, 0.4), v3.mul(fs, 2.0))), v3.add(b1, v3.add(v3.mul(fo, 0.8), v3.mul(fs, 2.6)))], { z: -0.7 });
      plate([v3.add(b0, v3.mul(fo, -1.8)), v3.add(b1, v3.add(v3.mul(fo, -2.4), v3.mul(fs, -1.4))), v3.add(b1, v3.add(v3.mul(fo, -0.8), v3.mul(fs, -2.4))), v3.add(b0, v3.add(v3.mul(fo, -0.4), v3.mul(fs, -2.2)))], { z: -0.6, seams: 0 });
      for (let k = 0; k < 3; k++) spike(v3.add(v3.mix(el, wr, 0.22 + k * 0.26), v3.mul(fo, 2.2)), v3.add(fo, v3.mul(df, -0.6)), 5.5 - k * 0.8, 1.25 - k * 0.1, -0.9);
      spike(v3.add(el, v3.mul(du, 0.5)), v3.add(du, v3.mul(df, -0.8)), 6.5, 1.5, -0.5);                         // the elbow spike
      // the hand: a palm, three long black claws and a thumb, curling toward the palm's normal
      const pc = v3.add(wr, v3.mul(df, LH * 0.5));
      A.ell(pc, [LH * 0.55, 2.0, 0.9], { B: [df, side, pn], ...SKs, z: -0.2 });
      const pe = v3.add(wr, v3.mul(df, LH));
      for (let i = 0; i < 3; i++) { const b = v3.add(pe, v3.mul(side, (i - 1) * 1.4)), m = v3.add(b, v3.add(v3.mul(fd, 4.0), v3.mul(side, (i - 1) * 1.4))), tp = v3.add(m, v3.add(v3.mul(fd, 4.2), v3.add(v3.mul(side, (i - 1) * 0.8), v3.mul(pn, -2.6)))); A.tube([b, m], v => 0.85 - v * 0.15, { ...SKs, z: -0.4 }); A.tube([m, v3.mix(m, tp, 0.5), tp], v => 0.7 - v * 0.6, { ...SV, z: -0.45 }); }
      { const b = v3.add(wr, v3.add(v3.mul(df, LH * 0.3), v3.mul(side, -2.0))), tp = v3.add(b, v3.add(v3.mul(side, -2.6), v3.add(v3.mul(fd, 3.8), v3.mul(pn, -1.8)))); A.tube([b, v3.mix(b, tp, 0.5), tp], v => 0.7 - v * 0.5, { ...SV, z: -0.4 }); }
      out[q > 0 ? 'handR' : 'handL'] = A.P(pe);
    }
    /* ---- the legs: quads and calves, plated thighs, jagged greaves, a knee spike, black talons ---- */
    for (const q of [-1, 1]) {
      const hp = at(-0.5, q * 4.4, -1), du = v3.norm(dir(P.legU[0], q * P.legU[1], P.legU[2])), dl = v3.norm(dir(P.legL[0], q * P.legL[1], P.legL[2]));
      const kn = v3.add(hp, v3.mul(du, 15)), an = v3.add(kn, v3.mul(dl, 15));
      const ts = v3.norm(v3.cross(du, [0, q, 0])), to = v3.norm(v3.cross(ts, du)), tf = v3.norm([to[0], to[1], 0]);
      A.tube([hp, v3.mix(hp, kn, 0.5), kn], v => 3.2 - v * 1.2, { ...SK, z: 0.4 });
      A.ell(v3.mix(hp, kn, 0.4), [3.4, 3.2, 5.6], { B: [tf, v3.norm(v3.cross(du, tf)), du], ...SK, z: 0.3 });   // the quadriceps
      if (CEL) for (let k = 0; k < 2; k++) { const og = v3.norm(v3.add(v3.mul(ts, q), v3.mul(tf, 0.4))); spike(v3.add(v3.mix(hp, kn, 0.3 + k * 0.32), v3.mul(og, 2.9)), v3.add(og, v3.mul(du, 0.5)), 4.2 - k * 0.5, 0.95, -0.4); }
      { const b0 = v3.mix(hp, kn, 0.15), b1 = v3.mix(hp, kn, 0.75); plate([v3.add(b0, v3.add(v3.mul(tf, 3.0), v3.mul(ts, -q * 0.5))), v3.add(b1, v3.add(v3.mul(tf, 2.6), v3.mul(ts, -q * 1.6))), v3.add(b1, v3.add(v3.mul(tf, 1.4), v3.mul(ts, q * 1.8))), v3.add(b0, v3.add(v3.mul(tf, 2.0), v3.mul(ts, q * 2.4)))], { z: -0.2 }); }
      joint(kn, 1.5);
      spike(v3.add(kn, v3.mul(tf, 1.4)), v3.add(tf, v3.mul(du, 0.45)), 6, 1.5, -0.6);                           // the knee spike
      A.tube([kn, v3.mix(kn, an, 0.5), an], v => 2.2 - v * 0.9, { ...SK, z: 0.4 });
      A.ell(v3.mix(kn, an, 0.32), [2.4, 2.3, 4.0], { B: [v3.mul(tf, -1), v3.norm(v3.cross(dl, tf)), dl], ...SKs, z: 0.45 });   // the calf
      { const ss = v3.norm(v3.cross(dl, [0, q, 0])), so = v3.norm(v3.cross(ss, dl)), sf = v3.norm([so[0], so[1], 0]), b0 = v3.mix(kn, an, 0.1), b1 = v3.mix(kn, an, 0.9); plate([v3.add(b0, v3.add(v3.mul(sf, 1.9), v3.mul(ss, -q * 0.8))), v3.add(v3.mix(kn, an, 0.5), v3.add(v3.mul(sf, 2.7), v3.mul(ss, -q * 1.4))), v3.add(b1, v3.add(v3.mul(sf, 1.4), v3.mul(ss, -q * 0.6))), v3.add(b1, v3.add(v3.mul(sf, 1.0), v3.mul(ss, q * 1.4))), v3.add(b0, v3.add(v3.mul(sf, 1.2), v3.mul(ss, q * 1.6)))], { z: -0.3, seams: 2 }); }
      // the foot: a long foot bone forward and down, three black talons
      const ff = v3.norm(v3.add(dir(1, 0, 0), v3.mul(dl, 0.5))), ft = v3.add(an, v3.mul(ff, 4.5));
      A.tube([an, ft], v => 1.5 - v * 0.3, { ...SKs, z: 0.3 });
      for (let i = 0; i < 3; i++) { const sd = v3.mul(ts, (i - 1) * 1.6), b = v3.add(ft, sd), tp = v3.add(b, v3.add(v3.mul(ff, 3.6), v3.add(v3.mul(sd, 0.4), v3.mul(dl, 1.2)))); A.tube([b, v3.mix(b, tp, 0.5), tp], v => 0.85 - v * 0.7, { ...SV, z: 0.2 }); }
      out[q > 0 ? 'footR' : 'footL'] = A.P(ft);
    }
    /* ---- the tail: a long whip from the pelvis, trailing through the poses, black spikes along it, a barbed tip ---- */
    { const lift = 0.3 + P.lean * 0.9 + (P.wFold || 0) * 0.3, sw = 0.6 + Math.sin(t * 1.9) * 0.5, sw2 = 0.8 + Math.sin(t * 1.9 - 1.1) * 0.9;
      const tp = A.bez3(at(-4, 0, -1), at(-12, sw * 7, -7 + lift * 8), at(-18, sw2 * 14, -12 + lift * 22), at(-16 + lift * 6, sw2 * 20, -16 + lift * 36), 10);
      A.tube(tp, v => 2.1 - v * 1.6, { ...SK, z: 1.0 });
      for (let i = 2; i < 10; i += 2) { const d = v3.norm(v3.sub(tp[i + 1], tp[i - 1])), up = v3.norm(v3.sub([0, 0, 1], v3.mul(d, d[2]))); spike(tp[i], v3.add(up, v3.mul(d, -0.5)), 4.6 - i * 0.25, 1.2 - i * 0.07, 0.9); }
      const e = tp[10], d = v3.norm(v3.sub(tp[10], tp[9])), sd = v3.norm(v3.cross(d, [0, 0, 1])); plate([v3.add(e, v3.mul(d, 5.5)), v3.add(e, v3.add(v3.mul(sd, 2.4), v3.mul(d, -0.8))), v3.add(e, v3.mul(d, -1.5)), v3.add(e, v3.add(v3.mul(sd, -2.4), v3.mul(d, -0.8)))], { z: 0.9, seams: 1 }); }
    }
    /* ---- the wings: feathers as cached sprites laid over their true quads, the arm as tubes, joints lit ---- */
    if (o.dbgNoWings) { out.tips = []; return; }
    const plan = planOf(ev), tipsOut = out.tips = [];
    for (const q of [-1, 1]) {
     for (let pk = (o.wzs || [o.wz]).length - 1; pk >= 0; pk--) {
      const wsc = [1, 0.8, 0.64][pk], root = at(-6 - pk * 1.8, q * (9.0 - pk * 1.4), 25 - pk * 8), WF = wingFrames(root, q, (o.wzs || [o.wz])[pk], P.wFold, wsc), fan = P.wFan, zp = pk * 0.9;
      plan.forEach((fe, j) => {
        let [x, y, a, L, w, kind, row] = fe; if ((LOW && row >= 3) || (pk > 0 && row >= 2) || (pk > 1 && row <= 1 && j % 2)) return; const i = WF.seg(x);
        // the primaries spread apart as the wing fans; a dissolving feather falls away and fades
        if (row === 0) a += (fe[0] - XW) / (XT - XW) * (0.2 - 0.3 * fan) - 0.1 * (1 - fan);
        let off = null, al = 1; if (dis > 0) { const st = 0.05 + R1(j * 1.7 + (q > 0 ? 0.3 : 0)) * 0.6, s = Math.max(0, (dis - st) / 0.35); if (s > 0) { al = 1 - cl(s); if (al <= 0.02) return; a += s * (j % 2 ? 0.6 : -0.6); off = [-s * 6, q * s * 4, -s * s * 14 - s * 3]; } }
        const rt = WF.W(i, x, y), ex = [Math.cos(a), Math.sin(a)], tp = WF.W(i, x + ex[0] * L, y + ex[1] * L), sd = WF.W(i, x - ex[1] * w, y + ex[0] * w);
        const r3 = off ? v3.add(rt, off) : rt, t3 = off ? v3.add(tp, off) : tp, s3 = off ? v3.add(sd, off) : sd, mid = v3.mix(r3, t3, 0.5);
        if (pk === 0 && row === 0 && j < 3) tipsOut.push(A.P(t3));
        const tone = (CEL && row === 0 && j % 2 === 0) || (seamK > 0 && row === 2 && j % 2) ? 2 : row === 1 ? 1 : 0, spr = featherSpr(kind, tone), zr = [0.6, 0.35, 0.1, -0.1, -0.3][row] + zp;
        A.decal(mid, (c, p) => { const b = A.P(r3), e = A.P(t3), s = A.P(s3); const ax = (e[0] - b[0]) / FW, ay = (e[1] - b[1]) / FW, bx = (s[0] - b[0]) / (FH / 2), by = (s[1] - b[1]) / (FH / 2); if (Math.abs(ax * by - ay * bx) < 1e-5) return; c.globalAlpha = R.alpha * al; c.transform(ax, ay, bx, by, b[0] - bx * FH / 2, b[1] - by * FH / 2); c.drawImage(spr, 0, 0); }, zr);
      });
      // the arm: shoulder to elbow to wrist to the hand's tip, thinning; lit joints
      const J = WF.J; A.tube([J[0], v3.mix(J[0], J[1], 0.5), J[1]], v => (2.4 - v * 0.5) * wsc, { ...SV, z: -0.2 + zp }); A.tube([J[1], v3.mix(J[1], J[2], 0.5), J[2]], v => (1.9 - v * 0.5) * wsc, { ...SV, z: -0.25 + zp }); A.tube([J[2], v3.mix(J[2], J[3], 0.5), J[3]], v => (1.3 - v * 1.0) * wsc, { ...SV, z: -0.3 + zp });
     }
    }
    // a violet aura of energy behind the body (it lifts the dark silhouette off a dark floor)
    A.glowAt(at(0, 0, 14), 30, ENERGY, (0.22 + 0.15 * (o.charge || 0)) * GK, true);
  };
  Anima3D.MODELS.fedemon.yaw = 0.3;
  /* draw the demon: at screen (X, Y) (its hips' floor point, feet at h 0), hgt tiles tall (its body, hips to crown), at
     game time t; S = { KF (keyframes), ev, alpha, dis, seam, charge, yaw, hovK } */
  function drawDemon(c, X, Y, T, hgt, t, S) {
    const pose = poseAt(S.KF, t), ev = S.ev || 1, NP = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, wzs = [];
    for (let k = 0; k < NP; k++) { const wz = [], tk = t - 0.13 * k; for (let i = 0; i < 3; i++) { const p = poseAt(S.KF, tk - 0.055 * i), hv = p.hov * (S.hovK == null ? 1 : S.hovK); wz.push({ el: p.wEl - 0.55 * k + Math.sin(tk * 5.2 - i * 0.7) * 0.2 * hv + Math.sin(tk * 2.3) * 0.04 * hv, sw: p.wSw + 0.3 * k + Math.sin(tk * 5.2 - i * 0.7 - 1.2) * 0.06 * hv }); } wzs.push(wz); }
    const wz = wzs[0];
    const out = {}, size = hgt * T * 110 / 62;
    Anima3D.draw(c, 'fedemon', 1, X, Y, size, t, { yaw: S.yaw == null ? 0.3 : S.yaw, alpha: S.alpha == null ? 1 : S.alpha, pose, wz, wzs, ev, out, dis: S.dis || 0, seam: S.seam || 0, charge: S.charge || 0, flare: S.flare || 0, glowK: S.glowK, dbgNoBody: S.dbgNoBody, dbgNoWings: S.dbgNoWings });
    return out;
  }

  /* ================= the sphere ================= */
  const TILT = 0.55, CT = Math.cos(TILT), STt = Math.sin(TILT);
  function proj(lon, lat) { const cL = Math.cos(lat), X = cL * Math.sin(lon), Y = Math.sin(lat), Z = cL * Math.cos(lon); return [X, -(Y * CT + Z * STt), Z * CT - Y * STt]; }
  /* the globe at (x, y), radius r px, squashed by sy (the compression) and stretched by sx; rot the currents' turn, spd
     their quickening 0..1, tear 0..1 the opening in the underside, AL alpha; S the cast's state (lats, curls, orbiters) */
  function drawSphere(c, x, y, r, sx, sy, t, S, AL, ev) {
    if (r < 2 || AL <= 0.01) return; const CEL = ev >= 7, rot = S.rot, lats = S.lats;
    c.save(); c.translate(x, y); c.scale(sx, sy);
    c.globalAlpha = AL; c.drawImage(bodySpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
    c.save(); c.beginPath(); c.arc(0, 0, r * 0.995, 0, TAU); c.clip(); c.lineCap = 'round';
    // the currents: latitude bands each turning at its own rate (Celestial: a second set turning against them), dark cells riding them
    const band = (L, ro, w, col, a2) => { c.beginPath(); let pen = false; for (let k = 0; k <= 28; k++) { const p = proj(k / 28 * TAU + ro, L + Math.sin(k * 0.9 + L * 4 + t * 0.3) * 0.04); if (p[2] > 0.03) { if (pen) c.lineTo(p[0] * r, p[1] * r); else c.moveTo(p[0] * r, p[1] * r); pen = true; } else pen = false; } c.strokeStyle = rgba(VOID, 0.42); c.lineWidth = r * w; c.stroke(); c.strokeStyle = rgba(col, a2); c.lineWidth = r * 0.025; c.stroke(); };
    for (let i = 0; i < lats.length; i++) band(lats[i], rot * (1 + 0.35 * Math.sin(i * 2.3)) + i * 1.1, 0.07 + 0.03 * (i % 2), i % 2 ? ENERGY : SMOKE, 0.16);
    if (CEL) for (let i = 0; i < 3; i++) band(lats[i * 2] + 0.12, -rot * 1.3 + i * 2.0, 0.04, EDGE, 0.14);
    c.fillStyle = rgba(VOID, 0.55); c.beginPath(); for (let i = 0; i < 9; i++) { const L = lats[i % lats.length] + 0.06 * (i % 3 - 1), p = proj(rot * (1 + 0.35 * Math.sin((i % lats.length) * 2.3)) + i * 2.1, L); if (p[2] <= 0.08) continue; const s = r * (0.09 + 0.05 * R1(i)) * Math.min(1, p[2] + 0.3); c.moveTo(p[0] * r + s, p[1] * r); c.ellipse(p[0] * r, p[1] * r, s, s * (0.45 + 0.4 * p[2]), 0, 0, TAU); } c.fill();
    // inward-curling streams of shadow: spirals drawn on the surface that wind in toward a point, turning with the globe
    c.strokeStyle = rgba(VOID, 0.6); c.lineWidth = Math.max(1, r * 0.035); for (const cu of S.curls) { c.beginPath(); let pen = false; for (let k = 0; k <= 22; k++) { const v = k / 22, ang = v * 4.2 + t * cu.sp, rr = 0.42 * (1 - v * 0.9), p = proj(cu.lon + rot * 0.7 + Math.cos(ang) * rr, cu.lat + Math.sin(ang) * rr * 0.8); if (p[2] > 0.05) { if (pen) c.lineTo(p[0] * r, p[1] * r); else c.moveTo(p[0] * r, p[1] * r); pen = true; } else pen = false; } c.stroke(); }
    c.drawImage(shadeSpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
    // Celestial: fragments orbiting just inside the shell (hidden round the back, dim at the limb)
    if (CEL) for (const ob of S.orb) { const ang = t * ob.sp + ob.ph, p = proj(ang, ob.lat + Math.sin(t * 0.7 + ob.ph) * 0.1); if (p[2] < 0.05) continue; const s = r * 0.07 * ob.s, px = p[0] * r * 0.9, py = p[1] * r * 0.9; c.save(); c.translate(px, py); c.rotate(ang * 2); c.globalAlpha = AL * Math.min(1, p[2] * 2); c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, s * 0.5); c.lineTo(-s * 0.4, -s * 0.45); c.closePath(); c.fillStyle = PLUM; c.fill(); c.strokeStyle = rgba(EDGE, 0.75); c.lineWidth = 1; c.stroke(); c.restore(); }
    // the tear in the underside: a vertical rift of void with a violet rim, opening and closing
    if (S.tear > 0.01) { const tw = r * 0.16 * S.tear, th = r * 0.55 * Math.sqrt(S.tear); c.save(); c.translate(0, r * 0.62); c.fillStyle = VOID; c.beginPath(); c.moveTo(0, -th); c.quadraticCurveTo(tw * 1.3, 0, 0, th * 0.75); c.quadraticCurveTo(-tw * 1.3, 0, 0, -th); c.fill(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, r * 0.02); c.globalAlpha = AL * 0.9; c.stroke(); c.globalAlpha = AL * 0.5; c.lineWidth = Math.max(2, r * 0.06); c.stroke(); c.restore(); glow(c, 0, r * 0.62, r * 0.5, EDGE, AL * 0.5 * S.tear); }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = AL * 0.5; c.drawImage(shadeSpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
    c.globalAlpha = AL * 0.22; blitSized(c, glowSprite(ACC), -r * 0.62, -r * 0.66, r * 0.7, r * 0.7); c.globalAlpha = AL * 0.5; c.fillStyle = ACC; c.beginPath(); c.ellipse(-r * 0.36, -r * 0.4, r * 0.14, r * 0.07, -0.65, 0, TAU); c.fill();
    c.restore();
    // the thin violet limb, brighter toward the lit side
    c.globalAlpha = AL * 0.55; c.strokeStyle = EDGE; c.lineWidth = Math.max(1.2, r * 0.018); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.globalAlpha = AL * 0.6; c.strokeStyle = ACC; c.lineWidth = Math.max(1, r * 0.012); c.beginPath(); c.arc(0, 0, r, Math.PI * 1.05, Math.PI * 1.7); c.stroke();
    c.restore();
  }
  // a feather in the air (the fragments drifting from the wing tips, the dissolving body, the Celestial rain)
  function drawFeather(c, x, y, s, rot, a, kind) { if (a <= 0.01) return; const spr = featherSpr(kind || 0, 0); c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = a; c.drawImage(spr, -s * 0.3, -s * FH / FW / 2, s, s * FH / FW); c.restore(); }

  /* ================= D-U09 Final Eclipse ================= */
  U.finaleclipse = (C, h) => {
    H = h; const g = GeoKit, me = H.me, x = C.tx, y = C.ty, ev = evoOf(C), CEL = ev >= 7, ADE = ev >= 4, evoK = 1 + 0.08 * (ev - 1), K = C.K;
    const R = (3.2 + 0.2 * (ev - 1)) * K, DMG = C.base * 14 * K * evoK, seed = Math.floor(Math.random() * 1000);
    // the beats: the sphere forms, the drop and the downbeat, the raise (held a beat longer at Celestial), brace, throw, impact
    const T_DROP = 0.6, T_BEAT = 1.05, T_RAISE = 1.6, TB = CEL ? 2.85 : 2.6, T_THROW = TB + 0.42, IMP = T_THROW + 0.3, GATH = IMP + 0.45, EXP = IMP + (CEL ? 1.05 : 0.95), LIFE = EXP + (CEL ? 1.9 : 1.5);
    const KF = [[T_DROP, 'fall'], [T_BEAT - 0.1, 'fall'], [T_BEAT, 'beat'], [T_BEAT + 0.14, 'beat'], [T_BEAT + 0.42, 'hover'], [T_RAISE, 'hover'], [T_RAISE + 0.5, 'raise'], [TB, 'raise'], [TB + 0.22, 'brace'], [TB + 0.32, 'brace'], [T_THROW, 'throw'], [T_THROW + 0.35, 'throw'], [IMP + 0.12, 'throw'], [GATH, 'hover'], [EXP - 0.12, 'gather'], [EXP, 'gather']];
    const SZ = ev <= 4 ? 1 + 0.5 * (ev - 1) / 3 : 1.5 + (ev - 4) / 3, HB0 = 1.6 * SZ, RB = (ev <= 4 ? 0.95 + 0.45 * (ev - 1) / 3 : 1.4 + (ev - 4) / 3) * Math.sqrt(K);   // the demon's height and the sphere's radius (tiles), fixed per level
    // fixed heights: the demon hangs a little toward the camera (its feet 0.35 of its height below the aim on screen), the
    // sphere's centre just above its raised hands, so the hands sink into its underside
    const ZH0 = -0.35 * HB0 / CE, ZS0 = (ZH0 * CE + 1.55 * HB0 + 0.35 * RB) / CE;
    H.X.banner('FINAL ECLIPSE', '', C.col, 1.5); H.X.sfx.hum(); H.warn(x, y, R, IMP, C.col);
    for (let k = 0; k < 3; k++) for (let tn = 0; tn < 3; tn++) featherSpr(k, tn); bodySpr(); shadeSpr(); haloSpr(); bandSpr(); bandLSpr(); puffSpr(); dpuffSpr(); streakSpr(); wallSpr();
    const lats = [-0.95, -0.55, -0.2, 0.15, 0.5, 0.85], curls = [], orb = [];
    for (let i = 0; i < 3; i++) curls.push({ lon: i * 2.1 + R1(seed + i), lat: (i - 1) * 0.5, sp: 0.6 + 0.3 * R1(seed + i * 3) });
    for (let i = 0; i < 7; i++) orb.push({ ph: R1(seed + i * 5) * TAU, sp: (0.9 + 0.6 * R1(seed + i * 7)) * (i % 2 ? 1 : -1), lat: (R1(seed + i * 9) - 0.5) * 1.4, s: 0.7 + 0.6 * R1(seed + i * 11) });
    const feathers = [], mist = []; for (let i = 0; i < H.n(9 + ev); i++) mist.push({ a: i / (9 + ev) * TAU + R1(seed + i) * 0.5, r0: R * (0.1 + 0.2 * R1(seed + i * 2)), v: R * (0.5 + 0.5 * R1(seed + i * 3)), s: 0.55 + 0.45 * R1(seed + i * 5), ph: R1(seed + i * 7) * TAU });
    const SPH = { rot: 0, lats, curls, orb, tear: 0 };
    // the layout (set at the first draw from the room on screen): the sphere's height ZS and the demon's hover height ZH
    // and size HB, so the sphere's top stays under the HUD and the raised hands reach toward its underside
    const F = H.add({ life: LIFE, x, y, shards: [], ZS: ZS0, ZH: ZH0, HB: HB0, RB, swell: 0, fe: feathers, shed: new Set(), lastOut: null,
      // the sphere's centre height and radius at time t: it swells through the charge, tears free and plunges at the throw
      sph(t) { const sw = cl((t - T_RAISE - 0.3) / (TB - T_RAISE - 0.3)), swell = H.ease.out(sw) * 0.3, br = cl((t - TB) / 0.3) * 0.06; let z = this.ZS + Math.sin(t * 1.8) * 0.04 - br * 2, rr = this.RB * (1 + swell + br), sx = 1, sy = 1; if (t >= T_THROW) { const u = cl((t - T_THROW) / (IMP - T_THROW)), e = u * u; z = this.ZS * (1 - e) + rr * 0.9 * e; sx = 1 - 0.14 * Math.sin(u * Math.PI); sy = 1 + 0.22 * Math.sin(u * Math.PI); } return { z, r: rr, sx, sy, swell }; },
      // the demon's feet height: dropped out of the sphere, caught by the downbeat, hovering, dipping with the throw, lifting as it dissolves
      dz(t) { const ZH = this.ZH; if (t < T_BEAT) { const u = cl((t - T_DROP) / (T_BEAT - T_DROP)); return lerp(this.ZS - (this.HB + this.RB * 0.3) / CE, ZH - 0.45, Math.pow(u, 1.6)); } if (t < T_BEAT + 0.4) { const u = cl((t - T_BEAT) / 0.4); return lerp(ZH - 0.45, ZH, H.ease.out(u)) + Math.sin(u * Math.PI) * 0.12; } let z = ZH + Math.sin(t * 3) * 0.05; if (t > T_THROW) z -= Math.sin(cl((t - T_THROW) / 0.5) * Math.PI) * 0.2; if (t > GATH) z += Math.sin(cl((t - GATH) / (EXP - GATH)) * Math.PI * 0.5) * 0.3; return z; },
      update(dt, f) {
        const t = f.t; SPH.rot += dt * (0.14 + 0.5 * cl((t - T_RAISE) / (TB - T_RAISE)) + (t > T_THROW ? 0.8 : 0));
        SPH.tear = t < T_DROP - 0.1 ? 0 : t < T_DROP + 0.1 ? cl((t - T_DROP + 0.1) / 0.2) : t < T_BEAT ? 1 : 1 - cl((t - T_BEAT) / 0.5);
        // the charge: shadow motes and loose fragments drawn up from the ground to the sphere
        if (t > T_RAISE + 0.3 && t < T_THROW) { const S = f.sph(t), k = (6 + 3 * ev) * dt * H.Q() * cl((t - T_RAISE - 0.3) / 0.5); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, d = R * (0.5 + Math.random() * 0.6), sx = x + Math.cos(b) * d, sy = y + Math.sin(b) * d * 0.6, life = 0.6 + Math.random() * 0.4, tx = x - sx + Math.cos(b + 1.3) * 0.5, ty = (y - S.z * CE) - sy; H.P({ kind: Math.random() < 0.55 ? 'spark' : Math.random() < 0.5 ? 'ember' : 'shard', x: sx, y: sy, vx: tx / life, vy: ty / life, g: 0, life, max: life, size: 1.6 + Math.random() * 1.8, rot: Math.random() * TAU, vr: 4, color: Math.random() < 0.45 ? EDGE : Math.random() < 0.5 ? ENERGY : SMOKE }); } }
        // smoke trailing from the legs' points, and from the whole body as it dissolves
        if (f.lastOut && t > T_BEAT && t < EXP && Math.random() < dt * 6 * H.Q()) { const O = f.lastOut, dis = 0, T = H.X.Tz(), pick = dis > 0 ? [O.head, O.handL, O.handR, O.footL, O.footR][Math.floor(Math.random() * 5)] : (Math.random() < 0.5 ? O.footL : O.footR); if (pick) { const wx = x + (pick[0] - H.sx(x)) / T, wy = y + (pick[1] - H.sy(y)) / T; H.P({ kind: 'smoke', x: wx + (Math.random() - 0.5) * 0.2, y: wy, vx: (Math.random() - 0.5) * 0.5, vy: -0.4 - Math.random() * 0.5, life: 0.6 + Math.random() * 0.4, max: 1, size: 0.22 + 0.1 * ev / 7 + dis * 0.25, color: 'rgba(36,20,56,' }); } }
        // the feathers in the air: drift, sway, settle
        for (let i = feathers.length - 1; i >= 0; i--) { const p = feathers[i]; p.life -= dt; if (p.life <= 0) { feathers.splice(i, 1); continue; } p.vz -= 2.2 * dt; p.vz *= 1 - 1.6 * dt; p.vx *= 1 - 0.8 * dt; p.vy *= 1 - 0.8 * dt; p.x += (p.vx + Math.sin(t * 3 + p.ph) * 0.5) * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += (p.vr + Math.sin(t * 4 + p.ph) * 1.5) * dt; if (p.z < 0) { p.z = 0; p.vz = 0; p.vr *= 0.5; } }
      },
      drawUnder(c, f, X, Y, T, t) {
        const tt = f.t, RT = R * T;
        if (tt < IMP) {
          // the mark on the floor under the sphere: a violet-lit ring (light only), ticks converging, an inner turning arc
          const k = cl(tt / 0.4), ch = cl((tt - T_RAISE) / (TB - T_RAISE));
          floorLight(c, X, Y, RT * 1.05, (0.12 + 0.22 * ch) * k, ENERGY); floorLight(c, X, Y, RT * 0.5, (0.08 + 0.2 * ch) * k, EDGE);
          c.save(); c.translate(X, Y); c.scale(1, H.GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          c.globalAlpha = (0.16 + 0.14 * ch) * k; c.strokeStyle = EDGE; c.lineWidth = Math.max(3, T * 0.12); c.beginPath(); c.arc(0, 0, RT, 0, TAU); c.stroke(); c.globalAlpha = (0.4 + 0.4 * ch) * k; c.lineWidth = 1.5; c.stroke();
          c.globalAlpha = 0.55 * k; c.lineWidth = 1.3; c.beginPath(); for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + t * 0.25, r1 = RT * (1.3 - 0.25 * ch), r0 = RT * (1.12 - 0.1 * ch); c.moveTo(Math.cos(b) * r1, Math.sin(b) * r1); c.lineTo(Math.cos(b) * r0, Math.sin(b) * r0); } c.stroke();
          c.globalAlpha = 0.4 * k; c.strokeStyle = ACC; c.lineWidth = 1.2; for (let i = 0; i < 2; i++) { const b = t * 0.5 * (i ? -1 : 1) + i * 2; c.beginPath(); c.arc(0, 0, RT * (0.7 - i * 0.2), b, b + 2.4); c.stroke(); }
          c.restore();
          // the sphere's shadow, and the demon's smaller one (denser as the sphere nears the ground)
          const S = f.sph(tt); g.shadow(c, X, Y, T * S.r * 1.1 * S.sx, T * S.r * 1.1 * S.sx * H.GY, S.z * 1.4, 0.18 + 0.4 * (tt > T_THROW ? cl((tt - T_THROW) / (IMP - T_THROW)) : 0));
          if (tt > T_DROP) g.shadow(c, X, Y + T * 0.1, T * f.HB * 0.5, T * f.HB * 0.5 * H.GY, Math.max(0, f.dz(tt)) * 1.5 + f.HB, 0.22 * cl((tt - T_DROP) / 0.3));
          return;
        }
        const post = tt - IMP, endK = cl((LIFE - tt) / 0.5);
        floorLight(c, X, Y, RT * 1.1, 0.5 * Math.max(0, 1 - post / 0.35), ACC); floorLight(c, X, Y, RT * 1.1, (0.22 * Math.max(0, 1 - post / 1.6) + 0.08) * endK, ENERGY);
        // the huge low shockwave over the floor: a thick violet-black band, a light-only one after it (Celestial: a third, widest)
        for (const [d, sc, w, L] of CEL ? [[0, 1.0, 1, 0], [0.1, 1.25, 0.7, 1], [0.26, 1.55, 0.5, 1]] : [[0, 1.0, 1, 0], [0.12, 1.3, 0.7, 1]]) { const q = cl((post - d) / 0.75); if (q > 0 && q < 1) { const rr = R * 1.35 * T * sc * H.ease.out(q); c.save(); c.globalAlpha = (1 - q) * w; c.drawImage(L ? bandLSpr() : bandSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); c.restore(); } }
        // low mist rolling out, thinning; Celestial: an outward-moving ring of dark fragments
        const mk = (1 - cl((post - 0.4) / 1.6)) * endK; if (mk > 0.01) { const sp = dpuffSpr(); c.save(); for (const m of mist) { const d = m.r0 + m.v * H.ease.out(cl(post / 1.2)), px = X + Math.cos(m.a) * d * T, py = Y + Math.sin(m.a) * d * T * H.GY - post * T * 0.1, pr = T * m.s * (0.7 + 0.8 * cl(post / 0.8)) * (1 + 0.1 * Math.sin(t * 2 + m.ph)); c.globalAlpha = mk * 0.7 * cl(post / 0.2); c.drawImage(sp, px - pr, py - pr * 0.55, pr * 2, pr * 1.1); } c.restore(); }
        if (tt > EXP) { const p2 = tt - EXP, R2 = R * 1.2;
          floorLight(c, X, Y, R2 * T, 0.5 * Math.max(0, 1 - p2 / 0.3), ACC);
          for (const [d, sc, w, L] of [[0, 1.0, 1, 0], [0.08, 1.15, 0.8, 0], [0.18, 1.35, 0.6, 1]]) { const q = cl((p2 - d) / 0.8); if (q > 0 && q < 1) { const rr = R2 * 1.2 * T * sc * H.ease.out(q); c.save(); c.globalAlpha = (1 - q) * w; c.drawImage(L ? bandLSpr() : bandSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); c.restore(); } }
          const q = cl(p2 / 1.2); if (q < 1) { const sp = dpuffSpr(), rr = R2 * T * (0.3 + 0.95 * H.ease.out(q)); c.save(); for (let i = 0; i < 14; i++) { const b = i / 14 * TAU + R1(seed + i * 17) * 0.3, pr = T * (0.6 + 0.4 * R1(seed + i * 19)) * (0.6 + 0.8 * q) * Math.sqrt(SZ); c.globalAlpha = (1 - q) * 0.8; c.drawImage(sp, X + Math.cos(b) * rr - pr, Y + Math.sin(b) * rr * H.GY - pr * 0.6 - q * T * 0.3, pr * 2, pr * 1.2); } c.restore(); } }
        if (tt > EXP) { const q = cl((tt - EXP - 0.05) / 1.1); if (q > 0 && q < 1) { const rr = R * 1.2 * T * (0.3 + 1.1 * H.ease.out(q)); c.save(); c.globalAlpha = (1 - q * q) * 0.9; for (let i = 0; i < (CEL ? 20 : 12); i++) { const b = i / 16 * TAU + R1(seed + i * 3) * 0.3, s = T * (0.1 + 0.1 * R1(seed + i * 5)), px = X + Math.cos(b) * rr, py = Y + Math.sin(b) * rr * H.GY - Math.sin(q * Math.PI) * T * (0.2 + 0.4 * R1(seed + i)); c.save(); c.translate(px, py); c.rotate(q * 7 + i); c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, s * 0.5); c.lineTo(-s * 0.4, -s * 0.45); c.closePath(); c.fillStyle = BODY; c.fill(); c.strokeStyle = rgba(EDGE, 0.7); c.lineWidth = 1; c.stroke(); c.restore(); } c.restore(); } }
      },
      draw(c, f, X, Y, T, t) {
        const tt = f.t, SC = scr(c), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5;
        const S = f.sph(tt), cy = Y - S.z * CE * T, r = T * S.r, dP = Math.hypot(PX - X, PY - cy);
        // near the pet the whole effect dims smoothly (never a cut-out): by the pet's distance to the sphere and to the demon
        const dz = f.dz(tt), DY = Y - dz * CE * T, dD = g.segD(PX, PY, X, DY - T * f.HB * 1.1, X, DY + T * 0.2), AL = 0.3 + 0.7 * Math.min(sstep(r * 0.6, r + T * 0.9, dP), sstep(T * 0.4, T * 1.3, dD));
        const form = H.ease.out(cl(tt / 0.6));
        if (tt < IMP + 0.08) {
          const comp = tt > IMP - 0.06 ? cl((tt - IMP + 0.06) / 0.14) : 0, fall = tt > T_THROW ? cl((tt - T_THROW) / (IMP - T_THROW)) : 0;
          // the air darkened round the sphere, the violet glow through it (brighter as it charges and as it falls)
          const ch = cl((tt - T_RAISE - 0.3) / (TB - T_RAISE - 0.3));
          c.save(); c.globalAlpha = AL * 0.8 * form; const hr = r * 2.1; c.drawImage(haloSpr(), X - hr, cy - hr, hr * 2, hr * 2); c.restore();
          glow(c, X, cy, r * 2.3, ENERGY, AL * form * (0.22 + 0.25 * ch + 0.3 * fall)); glow(c, X, cy, r * 1.4, EDGE, AL * form * (0.08 + 0.2 * ch + 0.35 * fall));
          // the wake of the plunge: a column of shadow and violet streamers torn off above the falling sphere
          if (fall > 0.05 && comp < 1) { const Lb = r * (1.5 + 3 * fall), spr = streakSpr(); c.save(); c.translate(X, cy); c.rotate(-Math.PI / 2); c.globalAlpha = AL * 0.8; c.drawImage(spr, -r * 0.2, -r * 1.0 * S.sx, Lb, r * 2 * S.sx); for (let j = 0; j < 4; j++) { const o = (j - 1.5) * r * 0.45; c.globalAlpha = AL * 0.75; c.drawImage(spr, -r * 0.3, o - r * 0.16, Lb * (0.7 + 0.3 * R1(seed + j)), r * 0.32); } c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, T * 0.04); for (let j = 0; j < 3 + (ADE ? 2 : 0); j++) { const o = Math.sin(j * 2.1 + 0.4) * r * 0.75, L = Lb * (0.6 + 0.5 * R1(seed + j * 7)); c.globalAlpha = AL * (0.35 + 0.4 * fall); c.beginPath(); c.moveTo(-r * 0.2, o); c.quadraticCurveTo(L * 0.5, o + Math.sin(t * 9 + j) * r * 0.15, L, o * 0.6); c.stroke(); } c.restore(); }
          /* ---- the demon, beneath the sphere (drawn before the sphere while it drops out of it, after once it is below) ---- */
          const demonFirst = tt < T_BEAT - 0.05;
          const demon = () => { if (tt < T_DROP) return; const dis = 0, fa = cl((tt - T_DROP) / 0.15);
            const out = drawDemon(c, X, DY, T, f.HB, tt, { KF, ev, alpha: AL * fa, dis, seam: CEL ? 1 : ADE ? 0.4 : 0, charge: ch * (tt < T_THROW ? 1 : 0.3), flare: tt > TB && tt < IMP + 0.3 ? Math.sin(cl((tt - TB) / (IMP + 0.3 - TB)) * Math.PI) : 0, yaw: 0.3, hovK: 1 }); f.lastOut = out;
            // the streams: violet light flowing up from the hands into the sphere's underside, beads travelling them
            if (ch > 0 && tt < T_THROW + 0.1 && out.handL && out.handR) { const k = ch * (tt > T_THROW ? 1 - (tt - T_THROW) / 0.1 : 1) * AL; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const ends = [out.handL, out.handR], bot = [X, cy + r * 0.85 * S.sy];
              for (let i = 0; i < ends.length; i++) { const hpx = ends[i], n = ADE ? 3 : 2; for (let j = 0; j < n; j++) { const wob = (j - (n - 1) / 2) * T * 0.12, mx = (hpx[0] + bot[0]) / 2 + wob + Math.sin(t * 6 + j * 2 + i) * T * 0.08, my = (hpx[1] + bot[1]) / 2 + Math.cos(t * 5 + j) * T * 0.06; c.globalAlpha = k * 0.35; c.strokeStyle = ENERGY; c.lineWidth = Math.max(2, T * 0.09); c.beginPath(); c.moveTo(hpx[0], hpx[1]); c.quadraticCurveTo(mx, my, bot[0] + wob * 0.5, bot[1]); c.stroke(); c.globalAlpha = k * 0.8; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, T * 0.03); c.stroke();
                  for (let b = 0; b < 3; b++) { const uu = ((t * (1.6 + 0.3 * j) + b / 3 + i * 0.17 + j * 0.3) % 1), q = 1 - uu, bx = q * q * hpx[0] + 2 * q * uu * mx + uu * uu * (bot[0] + wob * 0.5), by = q * q * hpx[1] + 2 * q * uu * my + uu * uu * bot[1], gs = T * 0.12; c.globalAlpha = k * 0.8; blitSized(c, glowSprite(ACC), bx - gs, by - gs, gs * 2, gs * 2); } }
                glow(c, hpx[0], hpx[1], T * 0.45, EDGE, k * 0.6); }
              c.restore(); }
            };
          if (demonFirst) demon();
          /* ---- the sphere (crushed to a disc at the impact) ---- */
          c.save(); if (comp > 0) { c.translate(X, cy + r * 0.5 * comp); c.scale(1 + 0.45 * comp, 1 - 0.55 * comp); c.translate(-X, -cy); }
          drawSphere(c, X, cy, r * form, S.sx, S.sy, t, SPH, AL * form * (1 - cl((tt - IMP) / 0.08)), ev);
          c.restore();
          if (comp > 0) { glow(c, X, cy + r * 0.5 * comp, r * (0.8 + 1.2 * comp), ACC, AL * comp * 0.7); }
          if (!demonFirst) demon();
          if (tt < IMP) return;
        }
        const post = tt - IMP, ALw = 0.2 + 0.8 * sstep(T * 0.8, T * 2.2, Math.hypot(PX - X, (PY - Y) / H.GY));
        // the impact: the core flash and rays, a low shockwave in the air
        const fl = Math.max(0, 1 - post / 0.3); if (fl > 0) { glow(c, X, Y - T * 0.4, R * T * 0.7 * (0.6 + 0.4 * H.ease.out(cl(post / 0.1))), ACC, ALw * fl * 0.8); glow(c, X, Y - T * 0.3, R * T * 0.28, WHITE, ALw * fl * 0.7); }
        const ra = Math.max(0, 1 - post / 0.7); if (ra > 0) { const NR = 6 + (ev >> 1); for (let i = 0; i < NR; i++) { const b = -Math.PI + (i + 0.5) / NR * Math.PI + Math.sin(i * 7.3) * 0.1, L = R * T * (0.8 + 0.6 * R1(seed + i * 3)) * H.ease.out(cl(post / 0.3)); H.ray(c, X, Y - T * 0.3, b, L, T * (0.3 + 0.3 * R1(seed + i)), i % 3 ? EDGE : ACC, 0.5 * ra * ALw); } }
        { const q = cl(post / 0.55); if (q > 0 && q < 1) { const rr = R * T * 1.3 * H.ease.out(q), ry = rr * 0.42; c.save(); c.globalAlpha = (1 - q) * 0.7 * ALw; c.drawImage(bandLSpr(), X - rr, Y - T * 0.5 - ry, rr * 2, ry * 2); c.restore(); } }
        // the rising wall of violet-black energy: a ring that climbs as it spreads, in slices (the far half first), fading at its top
        { const q = cl(post / 1.1); if (q > 0 && q < 1) { const rr = R * T * (0.35 + 0.75 * H.ease.out(q)), hgt = T * (1.6 + 0.4 * (ev - 1) / 6) * Math.sin(Math.min(1, q * 1.15) * Math.PI) * (1 + q), N = 28, spr = wallSpr(), wk = (1 - q * q) * 0.95;
            for (const half of [0, 1]) for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, back = Math.sin((a0 + a1) / 2) < 0; if ((half === 0) !== back) continue; const x0 = X + Math.cos(a0) * rr, y0 = Y + Math.sin(a0) * rr * H.GY, x1 = X + Math.cos(a1) * rr, y1 = Y + Math.sin(a1) * rr * H.GY, dPet = g.segD(PX, PY, x0, y0, x1, y1), aw = wk * (back ? 0.6 : 0.95) * (0.2 + 0.8 * sstep(T * 0.3, T * 1.3, dPet));
              c.save(); c.globalAlpha = aw; quad(c, spr, x0, y0 - hgt, x1 - x0, y1 - y0, 0, hgt); c.restore(); }
            c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = wk * 0.6; c.strokeStyle = EDGE; c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.ellipse(X, Y, rr, rr * H.GY, 0, 0, TAU); c.stroke(); c.restore(); } }
        // the smoke left hanging over the impact, thinning
        const sm = Math.max(0, 1 - post / 1.5) * ALw; if (sm > 0) { const sp = puffSpr(); c.save(); for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + R1(seed + i * 5) * 0.9, dd = R * T * (0.25 + 0.6 * H.ease.out(cl(post / 0.9))) * (0.7 + 0.5 * R1(seed + i * 2)), pr = R * T * (0.28 + 0.2 * R1(seed + i * 9)) * (0.6 + 0.6 * cl(post / 0.5)); c.globalAlpha = sm * sm * 0.8; c.drawImage(sp, X + Math.cos(b) * dd - pr, Y + Math.sin(b) * dd * 0.5 - pr - post * T * 0.35, pr * 2, pr * 2); } c.restore(); }
        // the demon above the aftermath: it hovers, gathers (its seams and void face flare, the wings snap in, a core of
        // light swells in its chest, the body trembles) and explodes; then the blast: a core flash, rays, a ring of smoke
        if (tt < EXP) { const gk = cl((tt - GATH) / (EXP - GATH)), sh = gk * gk * T * 0.06, jx = Math.sin(tt * 63) * sh, jy = Math.cos(tt * 51) * sh;
          const out = drawDemon(c, X + jx, DY + jy, T, f.HB, tt, { KF, ev, alpha: AL, dis: 0, seam: Math.max(CEL ? 1 : ADE ? 0.4 : 0, gk), charge: 0.2 + 0.8 * gk, flare: Math.max(post < 0.3 ? 1 - post / 0.3 : 0, gk * 1.4), glowK: 1 + gk, yaw: 0.3, hovK: 1 }); f.lastOut = out;
          if (gk > 0) { const cx = X + jx, cyD = DY - T * f.HB * 0.62 + jy; glow(c, cx, cyD, T * f.HB * (0.3 + 0.8 * gk), ENERGY, AL * gk * 0.6); glow(c, cx, cyD, T * f.HB * 0.35 * gk, ACC, AL * gk * 0.8); }
        } else { const p2 = tt - EXP, cx = X, cyD = DY - T * f.HB * 0.62, HBp = T * f.HB;
          const fl2 = Math.max(0, 1 - p2 / 0.35); if (fl2 > 0) { glow(c, cx, cyD, HBp * (1.0 + 1.4 * H.ease.out(cl(p2 / 0.12))), ACC, ALw * fl2 * 0.9); glow(c, cx, cyD, HBp * 0.5, WHITE, ALw * fl2 * 0.8); }
          const ra2 = Math.max(0, 1 - p2 / 0.6); if (ra2 > 0) for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.2, L = HBp * (1.2 + 0.8 * R1(seed + i * 13)) * H.ease.out(cl(p2 / 0.25)); H.ray(c, cx, cyD, b, L, HBp * 0.18, i % 3 ? EDGE : ACC, 0.5 * ra2 * ALw); }
          { const q = cl(p2 / 0.6); if (q > 0 && q < 1) { const rr = HBp * (0.4 + 1.6 * H.ease.out(q)); c.save(); c.globalAlpha = (1 - q) * 0.85 * ALw; c.drawImage(bandSpr(), cx - rr, cyD - rr, rr * 2, rr * 2); c.restore(); } }
          const sm2 = Math.max(0, 1 - p2 / 1.3) * ALw; if (sm2 > 0) { const sp = dpuffSpr(); c.save(); for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + R1(seed + i * 7) * 0.5, dd = HBp * (0.3 + 1.3 * H.ease.out(cl(p2 / 0.8))), pr = HBp * (0.35 + 0.2 * R1(seed + i * 3)) * (0.6 + 0.7 * cl(p2 / 0.5)); c.globalAlpha = sm2 * 0.85; c.drawImage(sp, cx + Math.cos(b) * dd - pr, cyD + Math.sin(b) * dd * 0.8 - pr - p2 * T * 0.3, pr * 2, pr * 2); } c.restore(); }
          // the armour blasted outward: tumbling obsidian shards with a violet edge, falling
          for (const s2 of f.shards) { const a = cl(1 - (p2 - 0.7) / 0.6) * ALw; if (a <= 0.01) continue; const px = cx + s2.vx * p2 * T, py = cyD + (s2.vy * p2 + 4 * p2 * p2) * T, sz = T * s2.s; c.save(); c.translate(px, py); c.rotate(s2.r + s2.w * p2); c.globalAlpha = a; c.beginPath(); c.moveTo(sz, 0); c.lineTo(-sz * 0.4, sz * 0.55); c.lineTo(-sz * 0.7, -sz * 0.1); c.lineTo(-sz * 0.2, -sz * 0.5); c.closePath(); c.fillStyle = '#14121C'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(EDGE, 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(sz, 0); c.lineTo(-sz * 0.2, -sz * 0.5); c.stroke(); c.restore(); } }
      },
    });
    // the feathers: a second, later effect so they draw over the demon and the sphere (and outlive nothing: same life)
    H.add({ life: LIFE, x, y, draw(c, f, X, Y, T, t) { const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5; for (const p of feathers) { const sx2 = H.sx(p.x), sy2 = H.sy(p.y) - p.z * CE * T, a = Math.min(1, p.life / 0.5) * (0.3 + 0.7 * sstep(T * 0.3, T * 1.0, Math.hypot(PX - sx2, PY - sy2))); drawFeather(c, sx2, sy2, T * p.s, p.rot, a, p.k || 0); } } });
    void F;
    /* ---- the timeline ---- */
    H.X.after(T_DROP, () => { H.X.sfx.whoosh(); });
    // the downbeat: the fall stops, a gust, feather fragments drift from the wing tips
    H.X.after(T_BEAT + 0.05, () => { H.X.sfx.thud(); H.X.shake(3, 0.2); H.X.ring(x, y, 0.2, R * 0.5, 0.35, EDGE, 0.25); const O = F.lastOut, T = H.X.Tz(); const tips = O && O.tips && O.tips.length ? O.tips : null; for (let j = 0; j < H.n(6 + 2 * ev); j++) { let px = x + (Math.random() - 0.5) * 2.4, pz = F.dz(F.t) + 0.8; if (tips) { const p = tips[j % tips.length]; px = x + (p[0] - H.sx(x)) / T + (Math.random() - 0.5) * 0.3; pz = (H.sy(y) - p[1]) / (CE * T); } feathers.push({ x: px, y, z: pz, vx: (px - x) * 1.2 + (Math.random() - 0.5), vy: (Math.random() - 0.5) * 0.5, vz: -0.5 + Math.random() * 0.8, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, s: 0.2 + Math.random() * 0.12, life: 1.8 + Math.random(), ph: Math.random() * TAU }); } });
    H.X.after(T_RAISE + 0.4, () => H.X.sfx.hum());
    H.X.after(TB + 0.2, () => H.X.shake(2, 0.2));
    H.X.after(T_THROW, () => { H.X.sfx.whoosh(); H.X.shake(4, 0.3); });
    H.X.after(IMP, () => {
      if (H.X.negative) H.X.negative(0.08);
      H.hitArea(x, y, R, DMG, C.dmgO({ kb: 7, stun: 0.5 }));
      H.X.flash(0.2, ACC); H.X.hitstop(0.1); H.X.sfx.crash(); H.X.shake(20 + 2 * ev, 0.45); H.X.light(x, y, R * 1.4, 0.4);
      H.X.boom(x, y, R * 0.8, EDGE, ACC, { n: 28 + 2 * ev, shake: 18, smoke: 8 }); H.X.ring(x, y, 0.4, R * 1.35, 0.6, EDGE, 0.5); H.X.ring(x, y, 0.3, R * 0.8, 0.45, ACC, 0.3);
      for (let j = 0; j < H.n(24 + 3 * ev); j++) { const b = Math.random() * TAU, v = 4 + Math.random() * 7; H.P({ kind: 'spark', x, y: y - 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 2, g: 4, life: 0.45 + Math.random() * 0.3, max: 0.75, size: 2 + Math.random() * 1.5, color: j % 3 ? EDGE : ACC }); }
      for (let j = 0; j < H.n(12); j++) { const b = Math.random() * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * 0.4, y: y - 0.3, vx: Math.cos(b) * (3 + Math.random() * 4), vy: Math.sin(b) * 2.5 - 3 - Math.random() * 3, g: 9, life: 0.6 + Math.random() * 0.4, max: 1, size: 3 + Math.random() * 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, color: j % 2 ? PLUM : SMOKE }); }
      for (let j = 0; j < H.n(8); j++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: x + Math.cos(b) * 0.5, y: y - 0.4 + Math.sin(b) * 0.3, vx: Math.cos(b) * 1.6, vy: Math.sin(b) * 0.9 - 0.7, life: 1.2, max: 1.2, size: 0.6 + 0.4 * Math.random() + 0.05 * ev, color: 'rgba(70,48,82,' }); }
    });
    H.X.after(IMP + 0.12, () => H.X.sfx.thud()); H.X.after(IMP + 0.35, () => { H.X.sfx.hum(); H.X.shake(5, 0.3); });
    H.X.after(GATH, () => { H.X.sfx.hum(); H.X.shake(2, EXP - GATH); });
    // the demon explodes: the second burst (40% of the impact, kb 5, 1.2 x its radius), shards and feathers blasted out
    H.X.after(EXP, () => {
      H.hitArea(x, y, R * 1.2, DMG * 0.4, C.dmgO({ kb: 5 }));
      H.X.flash(0.22, EDGE); H.X.hitstop(0.06); H.X.sfx.crash(); H.X.shake(14 + 2 * ev, 0.4); H.X.light(x, y, R * 1.5, 0.35);
      H.X.ring(x, y, 0.4, R * 1.45, 0.7, EDGE, 0.5); H.X.ring(x, y, 0.3, R * 1.0, 0.5, ACC, 0.3);
      const T = H.X.Tz(), O = F.lastOut, zc = Math.max(0.5, F.dz(F.t) + F.HB * 0.62 / CE);
      for (let j = 0; j < 10 + 3 * ev; j++) { const b = j / (10 + 3 * ev) * TAU + Math.random() * 0.4, v = (3 + Math.random() * 4) * Math.sqrt(SZ); F.shards.push({ vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.8 - 1.5, r: Math.random() * TAU, w: (Math.random() - 0.5) * 14, s: (0.16 + Math.random() * 0.18) * Math.sqrt(SZ) }); }
      for (let j = 0; j < H.n(16 + 3 * ev); j++) { const b = Math.random() * TAU, v = (2.5 + Math.random() * 3.5) * Math.sqrt(SZ); feathers.push({ x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.2, z: zc + (Math.random() - 0.5) * F.HB * 0.6, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: 1 + Math.random() * 2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, s: (0.2 + Math.random() * 0.14) * Math.sqrt(SZ), life: 1.2 + Math.random() * 0.6, ph: Math.random() * TAU }); }
      for (let j = 0; j < H.n(20 + 2 * ev); j++) { const b = Math.random() * TAU, v = 4 + Math.random() * 6; H.P({ kind: 'spark', x, y: y - zc * CE, vx: Math.cos(b) * v, vy: Math.sin(b) * v - 1, g: 3, life: 0.4 + Math.random() * 0.3, max: 0.7, size: 2 + Math.random() * 1.5, color: j % 3 ? EDGE : ACC }); }
      for (let j = 0; j < H.n(10); j++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: x + Math.cos(b) * R * 0.6, y: y + Math.sin(b) * R * 0.35, vx: Math.cos(b) * 2.2, vy: Math.sin(b) * 1.2 - 0.4, life: 1.1, max: 1.1, size: 0.7 + 0.5 * Math.random() + 0.06 * ev, color: 'rgba(36,20,56,' }); }
      void O; void T;
    });
    // Celestial: a slow rain of dissolving feathers after
    if (CEL) H.X.after(EXP + 0.3, () => { for (let j = 0; j < H.n(22); j++) feathers.push({ x: x + (Math.random() - 0.5) * R * 1.6, y: y + (Math.random() - 0.5) * R * 0.8, z: F.ZS * 0.5 + Math.random() * F.ZS * 0.7, vx: (Math.random() - 0.5) * 0.6, vy: 0, vz: -0.2 - Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, s: 0.18 + Math.random() * 0.14, life: 1.4 + Math.random() * 0.8, ph: Math.random() * TAU, k: j % 3 === 0 ? 1 : 0 }); });
  };
  // the debug door for the harness: the demon alone, the sphere alone
  U.finaleclipse.__dbg = { drawDemon, drawSphere, poseAt, POSE, featherSpr, wingPlan };
})();
