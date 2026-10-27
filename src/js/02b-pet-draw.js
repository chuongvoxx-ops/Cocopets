/* ---------- drawing a pet from its genes ---------- */
const LINE = 'var(--pet-line)';
const INK = `fill="${LINE}"`;
const HL = 'fill="#FFFFFF"';
const OLw = w => `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const OL = OLw(3), OL2 = OLw(2.2), OL15 = OLw(1.5);
const STRw = w => `fill="none" stroke="${LINE}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"`;
const STR2 = STRw(2.6);
let SVGUID = 0;
const pt = (x, y) => `${r1(x)} ${r1(y)}`;

function starPath(x, y, r) {
  const k = r * 0.32;
  return `M${pt(x, y - r)}L${pt(x + k, y - k)}L${pt(x + r, y)}L${pt(x + k, y + k)}L${pt(x, y + r)}L${pt(x - k, y + k)}L${pt(x - r, y)}L${pt(x - k, y - k)}Z`;
}
function starPath5(x, y, r) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + pt(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  return d + 'Z';
}
function heartPath(x, y, r) {
  return `M${pt(x, y + r * 0.9)}C${pt(x - r * 1.3, y - r * 0.1)} ${pt(x - r * 0.7, y - r * 1.1)} ${pt(x, y - r * 0.45)}C${pt(x + r * 0.7, y - r * 1.1)} ${pt(x + r * 1.3, y - r * 0.1)} ${pt(x, y + r * 0.9)}Z`;
}
/* a thick outlined line, like a tail or a limb */
function rope(d, w, fill, s) {
  s = s || 1;
  return `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="${r1(w * s + 5.2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${r1(w * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function flameShape(x, y, s) {
  const p = (a, b) => pt(x + a * s, y + b * s);
  return `<path d="M${p(0, 6)}C${p(-9, 4)} ${p(-10, -6)} ${p(-5, -12)}C${p(-4, -6)} ${p(-1, -6)} ${p(-1, -10)}C${p(-1, -16)} ${p(3, -20)} ${p(5, -24)}C${p(6, -16)} ${p(11, -10)} ${p(9, -2)}C${p(8, 4)} ${p(4, 6)} ${p(0, 6)}Z" fill="#FF8A3D" ${OL2}/><path d="M${p(0, 4)}C${p(-5, 3)} ${p(-5, -3)} ${p(-2, -6)}C${p(-1, -3)} ${p(1, -4)} ${p(2, -9)}C${p(5, -5)} ${p(6, 0)} ${p(4, 3)}Z" fill="#FFD447"/>`;
}
function flower(x, y, r) {
  let s = '';
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; s += `<circle cx="${r1(x + Math.cos(a) * r * 0.9)}" cy="${r1(y + Math.sin(a) * r * 0.9)}" r="${r1(r * 0.62)}" fill="#FFB3D1" ${OL15}/>`; }
  return s + `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 0.5)}" fill="#FFD447" ${OL15}/>`;
}

/* ---------- body outline: a head and a torso blended into one smooth shape ---------- */
function petGeom(f) {
  const b = f.body;
  const lt = f.legs && f.legs.t, lmax = (typeof LEG_LEN !== 'undefined' && LEG_LEN[(LEG_ALIAS[lt] || lt)] || [0, 6])[1], yb = -Math.min(lmax, (f.legs && f.legs.len) || 0) - 9;
  const h = b.h, bw = b.w, hw = bw * b.headW;
  // babies are one round blob; grown-ups get a head on a torso with a neck between them
  const blob = b.waist < 0.06;
  const hb = blob ? 0.5 : 0.42 - (b.waist - 0.06) * 0.3, fh = blob ? 0.5 : 1 - hb, ft = blob ? 0.5 : hb;
  const nUp = 1.7 + 1.1 * b.top, nDn = 2.1 + 1.4 * b.flat;
  const se = (u, n) => { const a = Math.abs(u); return a >= 1 ? 0 : Math.pow(1 - Math.pow(a, n), 1 / n); };
  const sstep = (a, c, x) => { const t = clamp((x - a) / (c - a), 0, 1); return t * t * (3 - 2 * t); };
  const halfW = blob
    ? fr => { const u = (fr - 0.5) / 0.5; return bw * lerp(1, b.headW, sstep(0.35, 0.95, fr)) * se(u, u > 0 ? nUp : nDn); }
    : fr => {
      const u = (fr - fh) / hb, v = (fr - ft) / hb;
      const H = hw * se(u, u > 0 ? nUp : 2.1), T = bw * se(v, v < 0 ? nDn : 2.1);
      return Math.pow(Math.pow(H, 8) + Math.pow(T, 8), 1 / 8);
    };
  const Y = fr => yb - h * fr;
  const N = 56, right = [];
  for (let i = 0; i <= N; i++) { const fr = (1 + Math.cos(Math.PI * i / N)) / 2; right.push([halfW(fr), Y(fr)]); }
  const poly = right.slice();
  for (let i = N - 1; i >= 1; i--) poly.push([-right[i][0], right[i][1]]);
  // smooth path from every second point
  const sub = poly.filter((p, i) => i % 2 === 0);
  const n = sub.length;
  let path = `M${pt(sub[0][0], sub[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = sub[(i - 1 + n) % n], p1 = sub[i], p2 = sub[(i + 1) % n], p3 = sub[(i + 2) % n];
    path += `C${pt(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)} ${pt(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)} ${pt(p2[0], p2[1])}`;
  }
  path += 'Z';
  const fF = blob ? 0.57 : fh - 0.03, faceY = Y(fF), faceHW = halfW(fF);
  const k = clamp(faceHW / 46, 0.72, 1.3);
  const neckF = blob ? fF - 0.2 : 0.5;
  const g = { f, poly, path, yb, h, bw, hw, fh, ft, hb, Y, halfW, k, faceY, faceHW, fF, neckF, blob, top: Y(1), N };
  g.headC = [0, blob ? Y(0.55) : Y(fh)];
  g.bellyF = blob ? 0.25 : ft * 0.62 + 0.02; g.bellyY = Y(g.bellyF); g.bellyRX = halfW(g.bellyF) * 0.55; g.bellyRY = h * (blob ? 0.15 : hb * 0.4);
  const armF = neckF - 0.05; g.ax = -halfW(armF) + 4 * k; g.ay = Y(armF);
  g.tx = -halfW(0.24) + 7; g.ty = Y(0.24);
  const wingF = neckF + 0.04; g.wx = -halfW(wingF) * 0.5; g.wy = Y(wingF);
  g.lx = clamp(halfW(0.06) * 0.5, 12, 26);
  // face
  const E = f.eyes;
  let r = 7.2 * E.size * k, gap = faceHW * E.gap;
  if (E.t !== 'cyclops') { if (gap + r * 0.95 > faceHW * 0.86) r = Math.max(4, (faceHW * 0.86 - gap) / 0.95); if (gap < r * 1.15) gap = r * 1.15; }
  const ey = faceY - 1.5 * k;
  let eyes;
  switch (E.t) {
    case 'cyclops': eyes = [[0, ey, Math.min(r * 1.55, faceHW * 0.55)]]; break;
    case 'triple': eyes = [[-gap, ey + r * 0.25, r * 0.92], [gap, ey + r * 0.25, r * 0.92], [0, ey - r * 1.6, r * 0.78]]; break;
    case 'quad': eyes = [[-gap, ey - r * 0.75, r * 0.72], [gap, ey - r * 0.75, r * 0.72], [-gap * 0.72, ey + r * 0.95, r * 0.6], [gap * 0.72, ey + r * 0.95, r * 0.6]]; break;
    default: eyes = [[-gap, ey, r], [gap, ey, r]];
  }
  g.eyes = eyes; g.er = r; g.gap = gap; g.ey = ey;
  g.my = E.t === 'cyclops' ? ey + eyes[0][2] + 8 * k : E.t === 'quad' ? ey + r * 2 : ey + 14 * k + r * 0.35;
  g.ny = ey + (g.my - ey) * 0.55;
  g.cx = Math.min(gap + r * 1.05, faceHW * 0.8); g.cy = g.my - 1.5 * k;
  return g;
}
function rayHit(poly, cx, cy, ang) {
  const dx = -Math.sin(ang * Math.PI / 180), dy = -Math.cos(ang * Math.PI / 180);
  let best = null, bt = -1;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], c = poly[(i + 1) % poly.length];
    const ex = c[0] - a[0], ey = c[1] - a[1];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - cx) * ey - (a[1] - cy) * ex) / den;
    const u = ((a[0] - cx) * dy - (a[1] - cy) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1 && t > bt) { bt = t; best = [cx + dx * t, cy + dy * t]; }
  }
  return best || [cx + dx * 30, cy + dy * 30];
}
/* fur turns the smooth outline into tufts, wool or spikes */
function furPath(g, fur, R) {
  const spec = { fluffy: [28, 3.4], woolly: [44, 2.3], shaggy: [22, 5], spiky: [18, 6.5] }[fur];
  if (!spec) return g.path;
  const poly = g.poly, n = poly.length, cum = [0];
  for (let i = 1; i <= n; i++) { const a = poly[i - 1], c = poly[i % n]; cum.push(cum[i - 1] + Math.hypot(c[0] - a[0], c[1] - a[1])); }
  const L = cum[n];
  const at = s => {
    s = ((s % L) + L) % L;
    let i = 1;
    while (i < n && cum[i] < s) i++;
    const a = poly[i - 1], c = poly[i % n], t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    return [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, c[0] - a[0], c[1] - a[1]];
  };
  const cnt = spec[0], amp = spec[1] * g.k, step = L / cnt, s0 = cum[g.N];
  let d = '';
  for (let kk = 0; kk <= cnt; kk++) {
    const s = s0 + kk * step, p = at(s);
    if (kk === 0) { d = `M${pt(p[0], p[1])}`; continue; }
    const m = at(s - step / 2), tl = Math.hypot(m[2], m[3]) || 1, nx = m[3] / tl, ny = -m[2] / tl;
    if (m[1] > g.yb - 5 || (fur === 'spiky' && m[1] > g.Y(0.45))) { d += `L${pt(p[0], p[1])}`; continue; }
    if (fur === 'spiky') { const a = amp * (0.8 + R() * 0.5); d += `L${pt(m[0] + nx * a, m[1] + ny * a)}L${pt(p[0], p[1])}`; }
    else {
      const a = amp * (fur === 'shaggy' ? 0.6 + R() * 0.8 : 1), sh = fur === 'shaggy' ? (R() - 0.5) * 0.5 : 0;
      d += `Q${pt(m[0] + nx * a * 2 + m[2] * sh, m[1] + ny * a * 2 + m[3] * sh)} ${pt(p[0], p[1])}`;
    }
  }
  return d + 'Z';
}

/* ---------- parts (drawn on the pet's left side, then mirrored) ---------- */
const EAR_PLACE = { nub: [44, 0, 3], round: [44, 0, 4], mouse: [50, -4, 5], cat: [36, 6, 4], fox: [32, 6, 5], lynx: [34, 6, 5], bunny: [20, 8, 4], lop: [58, 0, 3], bat: [34, 8, 4], fin: [78, 26, 3], antenna: [18, 0, 0], leaf: [8, -12, 1], bloom: [8, -12, 1], feather: [30, 8, 4], elf: [66, 40, 4], crystal: [30, 8, 4], flame: [32, 6, 4] };
const EAR_H = { nub: 11, round: 21, mouse: 31, cat: 27, fox: 40, lynx: 41, bunny: 54, lop: 0, bat: 42, fin: 32, antenna: 37, leaf: 36, bloom: 43, feather: 30, elf: 44, crystal: 36, flame: 36 };
function earShape(t, s, F, f, crys) {
  const pal = f.pal, I = pal.inner, D = pal.dk, S = pal.sec;
  const p = (x, y) => pt(x * s, y * s);
  switch (t) {
    case 'nub': return `<ellipse cx="0" cy="${r1(-4 * s)}" rx="${r1(8 * s)}" ry="${r1(7 * s)}" fill="${F}" ${OL}/>`;
    case 'round': return `<circle cx="0" cy="${r1(-8 * s)}" r="${r1(13 * s)}" fill="${F}" ${OL}/><circle cx="0" cy="${r1(-7 * s)}" r="${r1(7 * s)}" fill="${I}"/>`;
    case 'mouse': return `<circle cx="${r1(-3 * s)}" cy="${r1(-11 * s)}" r="${r1(15.5 * s)}" fill="${F}" ${OL}/><circle cx="${r1(-3 * s)}" cy="${r1(-10 * s)}" r="${r1(9.5 * s)}" fill="${I}"/>`;
    case 'cat': return `<path d="M${p(-12, 6)}Q${p(-12, -18)} ${p(-1, -27)}Q${p(9, -17)} ${p(12, 6)}Z" fill="${F}" ${OL}/><path d="M${p(-7, 3)}Q${p(-7, -12)} ${p(-1, -18)}Q${p(5, -11)} ${p(6, 3)}Z" fill="${I}"/>`;
    case 'fox': {
      const d = `M${p(-13, 6)}Q${p(-12, -26)} ${p(-1, -40)}Q${p(11, -24)} ${p(13, 6)}Z`;
      return `<path d="${d}" fill="${F}"/><path d="M${p(-7, 3)}Q${p(-7, -16)} ${p(-1, -27)}Q${p(6, -15)} ${p(7, 3)}Z" fill="${I}"/><path d="M${p(-8.2, -22)}Q${p(-5, -33)} ${p(-1, -40)}Q${p(5, -32)} ${p(8, -21)}Q${p(0, -25)} ${p(-8.2, -22)}Z" fill="${D}"/><path d="${d}" fill="none" ${OL}/>`;
    }
    case 'lynx': return `<path d="M${p(-12, 6)}Q${p(-12, -20)} ${p(-1, -30)}Q${p(9, -19)} ${p(12, 6)}Z" fill="${F}" ${OL}/><path d="M${p(-7, 3)}Q${p(-7, -13)} ${p(-1, -20)}Q${p(5, -12)} ${p(6, 3)}Z" fill="${I}"/><path d="M${p(-1, -29)}L${p(-5, -39)}M${p(-1, -29)}L${p(0, -41)}M${p(-1, -29)}L${p(4, -38)}" ${STRw(2.2)}/>`;
    case 'bunny': return `<path d="M${p(-8, 4)}C${p(-13, -28)} ${p(-8, -52)} ${p(0, -54)}C${p(8, -52)} ${p(12, -28)} ${p(8, 4)}Z" fill="${F}" ${OL}/><path d="M${p(-4, 0)}C${p(-7, -24)} ${p(-4, -44)} ${p(0, -46)}C${p(4, -44)} ${p(6, -24)} ${p(4, 0)}Z" fill="${I}"/>`;
    case 'lop': return `<path d="M${p(6, 4)}C${p(-8, -8)} ${p(-22, 2)} ${p(-22, 24)}C${p(-22, 42)} ${p(-15, 54)} ${p(-7, 52)}C${p(0, 50)} ${p(-4, 36)} ${p(-3, 24)}C${p(-2, 14)} ${p(3, 10)} ${p(9, 9)}Z" fill="${D}" ${OL}/>`;
    case 'bat': return `<path d="M${p(-13, 6)}L${p(-17, -30)}L${p(-7, -23)}L${p(-1, -42)}L${p(5, -21)}L${p(12, 6)}Z" fill="${F}" ${OL}/><path d="M${p(-8, 3)}L${p(-10, -18)}L${p(-4, -13)}L${p(-1, -27)}L${p(3, -12)}L${p(7, 3)}Z" fill="${I}"/>`;
    case 'fin': return `<path d="M${p(-6, 6)}Q${p(-22, -8)} ${p(-12, -32)}Q${p(-2, -18)} ${p(10, -20)}Q${p(8, -6)} ${p(8, 6)}Z" fill="${S}" ${OL}/><path d="M${p(-4, 1)}L${p(-11, -24)}M${p(1, 1)}L${p(3, -15)}" ${STRw(2)}/>`;
    case 'antenna': return `<path d="M0 ${r1(3 * s)}Q${p(-3, -14)} ${p(-6, -28)}" ${STRw(3.2)}/><circle cx="${r1(-6.5 * s)}" cy="${r1(-31 * s)}" r="${r1(6 * s)}" fill="${S}" ${OL}/><circle cx="${r1(-8.2 * s)}" cy="${r1(-33 * s)}" r="${r1(1.8 * s)}" fill="#FFFFFF" opacity=".8"/>`;
    case 'leaf': return `<path d="M${p(0, 4)}C${p(-14, -6)} ${p(-20, -24)} ${p(-12, -36)}C${p(-2, -28)} ${p(5, -14)} ${p(0, 4)}Z" fill="#7CC46E" ${OL}/><path d="M${p(-1, 0)}Q${p(-8, -16)} ${p(-11, -30)}" ${STRw(1.8)}/>`;
    case 'bloom': return earShape('leaf', s, F, f, crys) + flower(-12 * s, -38 * s, 5.5 * s);
    case 'feather': return `<path d="M${p(-8, 5)}L${p(-15, -22)}L${p(-7, -15)}L${p(-5, -30)}L${p(1, -15)}L${p(4, -24)}L${p(8, 5)}Z" fill="${F}" ${OL}/>`;
    case 'elf': return `<path d="M${p(-7, 6)}Q${p(-10, -22)} ${p(-3, -44)}Q${p(7, -18)} ${p(9, 6)}Z" fill="${F}" ${OL}/><path d="M${p(-3, 2)}Q${p(-5, -16)} ${p(-2, -30)}Q${p(4, -14)} ${p(5, 2)}Z" fill="${I}"/>`;
    case 'crystal': return `<path d="M${p(-9, 6)}L${p(-11, -16)}L${p(-2, -36)}L${p(7, -14)}L${p(8, 6)}Z" fill="${crys}" ${OL}/><path d="M${p(-2, -36)}L${p(-1, 4)}M${p(-11, -16)}L${p(-1, -10)}L${p(7, -14)}" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".65"/>`;
    case 'flame': return `<path d="M${p(-8, 6)}Q${p(-15, -12)} ${p(-6, -24)}Q${p(-6, -14)} ${p(-1, -12)}Q${p(-1, -26)} ${p(5, -36)}Q${p(15, -14)} ${p(9, 6)}Z" fill="#FF8A3D" ${OL}/><path d="M${p(-3, 4)}Q${p(-6, -6)} ${p(0, -14)}Q${p(1, -6)} ${p(4, -18)}Q${p(9, -6)} ${p(5, 4)}Z" fill="#FFD447"/>`;
    default: return '';
  }
}
function tailShape(t, s, F, f, crys) {
  const pal = f.pal, D = pal.dk, S = pal.sec, Bl = pal.belly;
  const p = (x, y) => pt(x * s, y * s);
  switch (t) {
    case 'nub': return `<circle cx="${r1(-5 * s)}" cy="${r1(-2 * s)}" r="${r1(7.5 * s)}" fill="${F}" ${OL}/>`;
    case 'puff': return `<circle cx="${r1(-8 * s)}" cy="${r1(-1 * s)}" r="${r1(10 * s)}" fill="${Bl}" ${OL}/><circle cx="${r1(-16 * s)}" cy="${r1(-9 * s)}" r="${r1(7 * s)}" fill="${Bl}" ${OL}/>`;
    case 'fluffy': return `<path d="M${p(2, 4)}C${p(-20, 6)} ${p(-31, -16)} ${p(-21, -34)}C${p(-15, -44)} ${p(-4, -39)} ${p(-8, -28)}C${p(-12, -18)} ${p(-6, -9)} ${p(4, -6)}Z" fill="${F}" ${OL}/>`;
    case 'fox': {
      const d = `M${p(2, 5)}C${p(-26, 8)} ${p(-42, -14)} ${p(-36, -38)}C${p(-32, -52)} ${p(-16, -55)} ${p(-13, -43)}C${p(-11, -27)} ${p(-6, -13)} ${p(4, -8)}Z`;
      return `<path d="${d}" fill="${F}"/><path d="M${p(-37, -34)}C${p(-34, -50)} ${p(-17, -56)} ${p(-13, -43)}C${p(-20, -42)} ${p(-30, -36)} ${p(-37, -34)}Z" fill="${Bl}"/><path d="${d}" fill="none" ${OL}/>`;
    }
    case 'cat': return rope(`M${p(2, -2)}C${p(-16, 2)} ${p(-30, -6)} ${p(-28, -24)}C${p(-27, -34)} ${p(-20, -38)} ${p(-16, -33)}`, 5, F, s);
    case 'curly': return rope(`M${p(4, -2)}c${p(-14, -2)} ${p(-21, -14)} ${p(-13, -22)}c${p(8, -8)} ${p(19, 0)} ${p(11, 8)}c${p(-5, 5)} ${p(-12, 0)} ${p(-8, -5)}`, 4.6, F, s);
    case 'lion': return rope(`M${p(2, -2)}Q${p(-22, -2)} ${p(-26, -26)}`, 3.6, F, s) + `<path d="M${p(-26, -40)}c${p(4, -2)} ${p(8, 2)} ${p(6, 6)}c${p(4, 0)} ${p(6, 6)} ${p(2, 8)}c${p(2, 4)} ${p(-3, 8)} ${p(-7, 5)}c${p(-3, 4)} ${p(-9, 2)} ${p(-8, -3)}c${p(-5, 0)} ${p(-6, -7)} ${p(-2, -9)}c${p(-2, -4)} ${p(3, -9)} ${p(9, -7)}z" fill="${D}" ${OL}/>`;
    case 'lizard': {
      let sp = '';
      for (let i = 0; i < 3; i++) { const x = -8 - i * 9, y = -6 - i * 2.5; sp += `<path d="M${p(x + 3, y)}L${p(x - 1, y - 8)}L${p(x - 4, y + 1)}Z" fill="${S}" ${OL2}/>`; }
      return sp + `<path d="M${p(3, 6)}Q${p(-18, 6)} ${p(-38, -14)}Q${p(-20, -7)} ${p(3, -9)}Z" fill="${F}" ${OL}/>`;
    }
    case 'fish': return `<path d="M${p(4, -2)}L${p(-22, -22)}Q${p(-15, -4)} ${p(-24, 14)}Z" fill="${S}" ${OL}/><path d="M${p(-4, -2)}L${p(-17, -14)}M${p(-4, -2)}L${p(-17, 7)}" ${STRw(2)}/>`;
    case 'devil': return rope(`M${p(2, -2)}C${p(-14, 0)} ${p(-22, -8)} ${p(-24, -24)}`, 3.6, F, s) + `<path d="M${p(-24, -38)}L${p(-16, -24)}L${p(-24, -27)}L${p(-32, -24)}Z" fill="${D}" ${OL}/>`;
    case 'leaf': return rope(`M${p(2, -2)}Q${p(-16, -2)} ${p(-20, -18)}`, 3, '#6BAE5E', s) + `<path d="M${p(-20, -16)}C${p(-34, -18)} ${p(-38, -34)} ${p(-30, -44)}C${p(-18, -38)} ${p(-14, -26)} ${p(-20, -16)}Z" fill="#7CC46E" ${OL}/><path d="M${p(-21, -19)}Q${p(-27, -30)} ${p(-29, -40)}" ${STRw(1.6)}/>`;
    case 'flame': return rope(`M${p(2, -2)}Q${p(-18, -2)} ${p(-22, -20)}`, 3.6, F, s) + flameShape(-22 * s, -22 * s, s * 1.1);
    case 'star': return rope(`M${p(2, -2)}Q${p(-18, -4)} ${p(-22, -22)}`, 3.4, F, s) + `<path d="${starPath5(-22 * s, -30 * s, 10 * s)}" fill="#FFD447" ${OL}/>`;
    case 'bolt': return `<path d="M${p(2, -12)}L${p(-12, -14)}L${p(-8, -22)}L${p(-28, -30)}L${p(-15, -17)}L${p(-19, -9)}L${p(3, -3)}Z" fill="#FFD447" ${OL}/>`;
    case 'feather': return [[-30, 0.95], [-55, 1.05], [-80, 0.9]].map(([a, q]) => `<g transform="rotate(${a})"><path d="M0 0C${p(-4 * q, -10 * q)} ${p(-8 * q, -26 * q)} ${p(0, -36 * q)}C${p(8 * q, -26 * q)} ${p(4 * q, -10 * q)} 0 0Z" fill="${S}" ${OL2}/><path d="M0 0L${p(0, -32 * q)}" ${STRw(1.4)}/></g>`).join('');
    case 'ribbon': return rope(`M${p(2, -2)}C${p(-14, -10)} ${p(-10, -22)} ${p(-24, -30)}C${p(-32, -34)} ${p(-36, -26)} ${p(-44, -32)}`, 4, S, s) + rope(`M${p(2, 0)}C${p(-12, 6)} ${p(-18, -4)} ${p(-30, -2)}C${p(-38, -1)} ${p(-40, 8)} ${p(-48, 4)}`, 3.4, pal.lt, s);
    case 'crystal': return rope(`M${p(2, -2)}Q${p(-16, -2)} ${p(-22, -16)}`, 3.6, F, s) + [[-12, -6, 6], [-22, -17, 7.5], [-27, -31, 9]].map(([x, y, r]) => `<path d="M${p(x, y - r)}L${p(x + r * 0.6, y)}L${p(x, y + r * 0.7)}L${p(x - r * 0.6, y)}Z" fill="${crys}" ${OL2}/>`).join('');
    default: return '';
  }
}
function armShape(t, s, F, f, crys) {
  const pal = f.pal, D = pal.dk, I = pal.inner;
  const p = (x, y) => pt(x * s, y * s);
  switch (t) {
    case 'nub': return `<ellipse cx="${r1(-3 * s)}" cy="${r1(7 * s)}" rx="${r1(6 * s)}" ry="${r1(9 * s)}" transform="rotate(26 ${r1(-3 * s)} ${r1(7 * s)})" fill="${F}" ${OL}/>`;
    case 'paw': return `<path d="M${p(4, -4)}Q${p(-9, -2)} ${p(-11, 12)}Q${p(-12, 22)} ${p(-4, 22)}Q${p(4, 22)} ${p(4, 10)}Z" fill="${F}" ${OL}/><ellipse cx="${r1(-4.5 * s)}" cy="${r1(17 * s)}" rx="${r1(3.6 * s)}" ry="${r1(2.6 * s)}" fill="${I}"/>`;
    case 'mitten': return `<path d="M${p(4, -4)}Q${p(-7, -2)} ${p(-8, 8)}L${p(2, 10)}Z" fill="${F}" ${OL}/><circle cx="${r1(-5 * s)}" cy="${r1(15 * s)}" r="${r1(9 * s)}" fill="${F}" ${OL}/><path d="M${p(-12, 12)}q${p(2, -5)} ${p(6, -4)}" ${STRw(1.8)}/>`;
    case 'claw': return armShape('paw', s, F, f, crys) + `<path d="M${p(-11, 20)}L${p(-13, 27)}L${p(-8, 22)}ZM${p(-6, 22)}L${p(-6, 29)}L${p(-3, 22)}ZM${p(-1, 21)}L${p(1, 27)}L${p(2, 20)}Z" fill="#FFFFFF" ${OL15}/>`;
    case 'flipper': return `<path d="M${p(4, -4)}Q${p(-12, 2)} ${p(-14, 22)}Q${p(-12, 29)} ${p(-6, 25)}Q${p(2, 14)} ${p(4, -4)}Z" fill="${D}" ${OL}/>`;
    case 'wingarm': return `<path d="M${p(3, -5)}Q${p(-16, -3)} ${p(-21, 14)}L${p(-15, 12)}L${p(-16, 21)}L${p(-10, 16)}L${p(-8, 23)}Q${p(-2, 12)} ${p(3, 6)}Z" fill="${pal.lt}" ${OL}/>`;
    case 'tentacle': return rope(`M${p(2, 0)}C${p(-10, 6)} ${p(-4, 14)} ${p(-12, 20)}S${p(-15, 31)} ${p(-6, 31)}`, 5, F, s) + `<circle cx="${r1(-7 * s)}" cy="${r1(15 * s)}" r="${r1(1.6 * s)}" fill="${I}"/><circle cx="${r1(-12.5 * s)}" cy="${r1(24 * s)}" r="${r1(1.5 * s)}" fill="${I}"/>`;
    case 'long': return rope(`M${p(2, 0)}Q${p(-12, 14)} ${p(-10, 34)}`, 7, F, s) + `<circle cx="${r1(-10 * s)}" cy="${r1(36 * s)}" r="${r1(6.5 * s)}" fill="${F}" ${OL}/>`;
    case 'crystal': return rope(`M${p(2, 0)}Q${p(-8, 8)} ${p(-8, 16)}`, 7, F, s) + `<path d="M${p(-8, 13)}L${p(-1, 18)}L${p(-3, 28)}L${p(-12, 30)}L${p(-16, 21)}Z" fill="${crys}" ${OL}/><path d="M${p(-8, 13)}L${p(-8, 29)}" stroke="#FFFFFF" stroke-width="1.5" opacity=".6"/>`;
    default: return '';
  }
}
function cuff(x, y, s, c) {
  let d = `M${pt(x - 9 * s, y)}`;
  for (let i = 0; i < 4; i++) d += `q${r1(2.25 * s)} ${r1(-3.5 * s)} ${r1(4.5 * s)} 0`;
  for (let i = 0; i < 4; i++) d += `q${r1(-2.25 * s)} ${r1(3.5 * s)} ${r1(-4.5 * s)} 0`;
  return `<path d="${d}Z" fill="${c}" ${OL2}/>`;
}
// where the body's outline is lowest straight above x (its underside there), or its bottom if x is past its sides
function bodyBottomAt(poly, x) {
  let y = null;
  for (let i = 0; i < poly.length; i++) { const a = poly[i], c = poly[(i + 1) % poly.length]; if ((a[0] - x) * (c[0] - x) > 0 || a[0] === c[0]) continue; const yy = a[1] + (c[1] - a[1]) * (x - a[0]) / (c[0] - a[0]); if (y === null || yy > y) y = yy; }
  return y;
}
function legShape(f, g, F, footC) {
  // round, stubby legs: short chunky shanks on big bean-shaped feet. Each shank starts inside the body, above its
  // underside where the leg is (the body is round, so that is higher than its bottom), so a leg never floats free of it
  const L = f.legs, s = L.size || 1, x = -g.lx, t = LEG_ALIAS[L.t] || L.t, ub = bodyBottomAt(g.poly, x), top = Math.min(g.yb + 6, (ub == null ? g.yb : ub) - 6);
  const hgt = v => r1(Math.max(2, v - top));
  const shank = (w, bottom) => `<rect x="${r1(x - w / 2 * s)}" y="${r1(top)}" width="${r1(w * s)}" height="${hgt(bottom)}" rx="${r1(w / 2 * s)}" fill="${F}" ${OL}/>`;
  const bean = (dx, rx, ry, c) => `<ellipse cx="${r1(x + dx)}" cy="-6.5" rx="${r1(rx * s)}" ry="${r1(ry * s)}" fill="${c}" ${OL}/>`;
  switch (t) {
    case 'paw': return shank(18, -7) + bean(-2, 13, 7.5, footC) + `<path d="M${pt(x - 8 * s, -8.2)}v3M${pt(x - 2.5 * s, -9)}v3.4" ${STRw(1.6)}/><ellipse cx="${r1(x + 4 * s)}" cy="-6" rx="${r1(3 * s)}" ry="${r1(2.2 * s)}" fill="#FFB3C6" opacity=".8"/>`;
    case 'stump': return shank(22, -5) + bean(0, 13.5, 6.5, footC) + `<circle cx="${r1(x - 6.5 * s)}" cy="-6.4" r="1.8" fill="#FFFFFF"/><circle cx="${r1(x)}" cy="-7" r="1.8" fill="#FFFFFF"/><circle cx="${r1(x + 6.5 * s)}" cy="-6.4" r="1.8" fill="#FFFFFF"/>`;
    case 'hoof': return shank(18, -9) + `<rect x="${r1(x - 9 * s)}" y="-12.5" width="${r1(18 * s)}" height="${r1(9.5)}" rx="${r1(4.5 * s)}" fill="#4A3B33" ${OL}/><path d="M${pt(x, -11.5)}V-4.5" stroke="#7A655A" stroke-width="1.6" stroke-linecap="round"/>`;
    case 'webbed': return shank(16, -8) + `<path d="M${pt(x + 5 * s, -10)}C${pt(x - 6 * s, -12)} ${pt(x - 16 * s, -9)} ${pt(x - 15 * s, -4.5)}Q${pt(x - 12 * s, -1.5)} ${pt(x - 8.5 * s, -3)}Q${pt(x - 5.5 * s, -0.5)} ${pt(x - 2.5 * s, -2.6)}Q${pt(x + 1 * s, -0.5)} ${pt(x + 4 * s, -2.8)}Q${pt(x + 8 * s, -5)} ${pt(x + 5 * s, -10)}Z" fill="#F2A93B" ${OL}/>`;
    case 'boots': return shank(17, -7) + bean(-1, 12.5, 7.5, footC) + cuff(x, Math.min(-11, top + (-6 - top) * 0.45), s, f.pal.belly);
    case 'tentacle': return rope(`M${pt(x + 3, top)}C${pt(x + 2, -12)} ${pt(x - 9, -13)} ${pt(x - 11, -6)}`, 6.5, F) + rope(`M${pt(x + 8, top)}C${pt(x + 8, -9)} ${pt(x + 3, -7)} ${pt(x + 2, -3)}`, 5.6, F);
    case 'float': return `<path d="M${pt(x + 10, g.yb + 2)}Q${pt(x + 8, -10)} ${pt(x - 3, -5)}Q${pt(x + 4, -12)} ${pt(x - 4, g.yb + 4)}Z" fill="${F}" ${OL}/>`;
    default: return (L.len > 1.2 || top < -18 ? shank(18, -6) : '') + bean(0, 13, 7.5, footC);
  }
}
function wingShape(t, s, f, crys) {
  const pal = f.pal;
  const p = (x, y) => pt(x * s, y * s);
  switch (t) {
    case 'bat': return `<path d="M${p(0, 0)}L${p(-18, -24)}L${p(-52, -16)}L${p(-47, 6)}Q${p(-41, 0)} ${p(-35, 10)}Q${p(-28, 2)} ${p(-21, 14)}Q${p(-12, 6)} ${p(0, 12)}Z" fill="${pal.dk}" ${OL}/><path d="M${p(-18, -24)}L${p(-35, 10)}M${p(-18, -24)}L${p(-21, 14)}M${p(-18, -24)}L${p(-47, 6)}" stroke="${LINE}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    case 'fairy': return `<ellipse cx="${r1(-22 * s)}" cy="${r1(-14 * s)}" rx="${r1(25 * s)}" ry="${r1(13 * s)}" transform="rotate(-28 ${r1(-22 * s)} ${r1(-14 * s)})" fill="#FFFFFF" fill-opacity=".62" ${OL2}/><ellipse cx="${r1(-17 * s)}" cy="${r1(9 * s)}" rx="${r1(15 * s)}" ry="${r1(8 * s)}" transform="rotate(22 ${r1(-17 * s)} ${r1(9 * s)})" fill="#FFFFFF" fill-opacity=".62" ${OL2}/><path d="M${p(-3, -2)}Q${p(-20, -10)} ${p(-38, -24)}M${p(-3, 1)}Q${p(-16, 6)} ${p(-26, 13)}" fill="none" stroke="${pal.sec}" stroke-width="1.6" opacity=".8"/>`;
    case 'butterfly': return `<path d="M${p(0, -2)}C${p(-10, -34)} ${p(-50, -40)} ${p(-46, -12)}C${p(-44, 2)} ${p(-20, 2)} ${p(0, 2)}Z" fill="${pal.sec}" ${OL}/><circle cx="${r1(-32 * s)}" cy="${r1(-18 * s)}" r="${r1(6 * s)}" fill="${pal.lt}" ${OL15}/><circle cx="${r1(-18 * s)}" cy="${r1(-24 * s)}" r="${r1(3.4 * s)}" fill="#FFFFFF" opacity=".85"/><path d="M${p(0, 2)}C${p(-18, 4)} ${p(-32, 14)} ${p(-26, 24)}C${p(-20, 32)} ${p(-6, 20)} ${p(0, 8)}Z" fill="${pal.base}" ${OL}/>`;
    case 'leaf': return `<path d="M${p(0, 0)}C${p(-16, -26)} ${p(-46, -30)} ${p(-56, -14)}C${p(-46, 4)} ${p(-20, 12)} ${p(0, 10)}Z" fill="#7CC46E" ${OL}/><path d="M${p(-2, 4)}Q${p(-26, -6)} ${p(-50, -14)}M${p(-18, 0)}l${p(-6, -9)}M${p(-30, -6)}l${p(-5, -9)}M${p(-18, 2)}l${p(-6, 6)}M${p(-32, -3)}l${p(-6, 6)}" ${STRw(1.6)}/>`;
    case 'cloud': {
      const C = [[-10, -4, 11], [-24, -12, 12], [-38, -6, 11], [-44, 6, 9], [-30, 8, 10], [-16, 9, 9]];
      return C.map(([x, y, r]) => `<circle cx="${r1(x * s)}" cy="${r1(y * s)}" r="${r1(r * s)}" fill="#FFFFFF" ${OL}/>`).join('') + C.map(([x, y, r]) => `<circle cx="${r1(x * s)}" cy="${r1(y * s)}" r="${r1(r * s - 1.6)}" fill="#FFFFFF"/>`).join('');
    }
    case 'crystal': return [[-6, -2, -24, -32, -14, 4], [-10, 2, -46, -18, -26, 10], [-8, 6, -40, 12, -20, 16]].map(([a, b2, c, d2, e, gg]) => `<path d="M${p(a, b2)}L${p(c, d2)}L${p(e, gg)}Z" fill="${crys}" fill-opacity=".88" ${OL2}/><path d="M${p(a, b2)}L${p((c + e) / 2, (d2 + gg) / 2)}" stroke="#FFFFFF" stroke-width="1.4" opacity=".7"/>`).join('');
    case 'flame': return `<path d="M${p(0, 0)}C${p(-16, -20)} ${p(-30, -26)} ${p(-44, -36)}C${p(-38, -24)} ${p(-42, -16)} ${p(-52, -10)}C${p(-40, -6)} ${p(-38, 4)} ${p(-46, 12)}C${p(-30, 10)} ${p(-16, 16)} ${p(0, 12)}Z" fill="#FF8A3D" ${OL}/><path d="M${p(-4, 3)}C${p(-14, -8)} ${p(-24, -14)} ${p(-32, -22)}C${p(-30, -12)} ${p(-34, -6)} ${p(-40, -2)}C${p(-28, 0)} ${p(-16, 8)} ${p(-4, 9)}Z" fill="#FFD447"/>`;
    default: {
      const d = `M${p(0, 0)}C${p(-26, -30)} ${p(-54, -16)} ${p(-52, 14)}C${p(-44, 10)} ${p(-40, 20)} ${p(-31, 18)}C${p(-27, 27)} ${p(-14, 23)} ${p(0, 14)}Z`;
      return `<path d="${d}" fill="#FFFFFF" ${OL}/><path d="M${p(-18, 2)}q${p(-8, 6)} ${p(-14, 14)}M${p(-31, -4)}q${p(-8, 6)} ${p(-14, 16)}" ${STRw(2)}/>`;
    }
  }
}
const HORN_PLACE = { goat: [24, 6], ram: [56, 0], devil: [26, 4], bull: [40, 0], crystal: [22, 4], antlers: [18, 4] };
const HORN_H = { goat: 30, ram: 10, devil: 22, bull: 22, crystal: 28, antlers: 44, uni: 38 };
function hornShape(t, s, crys) {
  const p = (x, y) => pt(x * s, y * s);
  const C = '#F3E3C3';
  switch (t) {
    case 'goat': return `<path d="M${p(-6, 5)}Q${p(-9, -16)} ${p(-22, -28)}Q${p(-8, -18)} ${p(6, 4)}Z" fill="${C}" ${OL}/><path d="M${p(-4, -4)}l${p(5, -2)}M${p(-7, -12)}l${p(5, -3)}" ${STRw(1.6)}/>`;
    case 'ram': return rope(`M${p(2, 2)}C${p(-10, -8)} ${p(-24, 0)} ${p(-21, 12)}C${p(-18, 22)} ${p(-6, 20)} ${p(-8, 11)}`, 6, C, s);
    case 'devil': return `<path d="M${p(-6, 4)}Q${p(-9, -10)} ${p(-3, -21)}Q${p(-1, -8)} ${p(6, 3)}Z" fill="#C9473A" ${OL}/>`;
    case 'bull': return `<path d="M${p(-3, 4)}Q${p(-22, 4)} ${p(-26, -18)}Q${p(-14, -8)} ${p(4, -4)}Z" fill="${C}" ${OL}/>`;
    case 'crystal': return `<path d="M${p(-7, 6)}L${p(-3, -26)}L${p(6, 5)}Z" fill="${crys}" ${OL2}/><path d="M${p(-3, -18)}L${p(-1, 3)}" stroke="#FFFFFF" stroke-width="1.6" opacity=".8"/>`;
    case 'antlers': {
      const d = `M${p(0, 4)}L${p(-4, -16)}L${p(-12, -36)}M${p(-4, -16)}L${p(-16, -22)}M${p(-8, -27)}L${p(-2, -40)}M${p(-12, -36)}L${p(-20, -42)}`;
      return `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="${r1(3.6 * s + 5.2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#B9875A" stroke-width="${r1(3.6 * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case 'uni': return `<path d="M${p(-6, 4)}L${p(0, -36)}L${p(6, 4)}Z" fill="#FFF3D9" ${OL}/><path d="M${p(-4.6, -4)}L${p(4.6, -8)}M${p(-3.2, -14)}L${p(3.4, -18)}M${p(-1.8, -24)}L${p(1.8, -27)}" stroke="#E0A82E" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  return '';
}

/* ---------- face ---------- */
function eyeNormal(t, x, y, r, f, idx, irisG) {
  const iris = idx === 1 && t === 'hetero' ? f.eyes.iris2 : f.pal.iris;
  const hl = (hx, hy, hr) => `<circle ${HL} cx="${r1(hx)}" cy="${r1(hy)}" r="${r1(hr)}"/>`;
  const E = (rx, ry, extra) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" ${extra}/>`;
  // a glassy depth gradient laid over any iris
  const ig = (rx, ry, dy) => irisG ? `<ellipse cx="${r1(x)}" cy="${r1(y + (dy || 0))}" rx="${r1(rx)}" ry="${r1(ry)}" fill="url(#${irisG})"/>` : '';
  const sw = r1(Math.max(1.6, r * 0.26));
  switch (t) {
    case 'dot': return E(r * 0.6, r * 0.6, INK) + hl(x + r * 0.2, y - r * 0.22, r * 0.2);
    case 'button': return E(r * 0.82, r * 0.82, INK) + hl(x + r * 0.28, y - r * 0.3, r * 0.3) + `<path d="M${pt(x - r * 0.52, y + r * 0.12)}A${r1(r * 0.55)} ${r1(r * 0.55)} 0 0 0 ${pt(x + r * 0.12, y + r * 0.55)}" fill="none" stroke="#FFFFFF" stroke-width="${r1(r * 0.12)}" stroke-linecap="round" opacity=".6"/>`;
    case 'big': return E(r, r * 1.2, INK) + `<ellipse fill="${iris}" opacity=".9" cx="${r1(x)}" cy="${r1(y + r * 0.5)}" rx="${r1(r * 0.66)}" ry="${r1(r * 0.48)}"/>` + ig(r * 0.66, r * 0.48, r * 0.5) + hl(x + r * 0.34, y - r * 0.48, r * 0.4) + hl(x - r * 0.36, y + r * 0.36, r * 0.17);
    case 'sparkle': return E(r * 0.84, r * 1.08, INK) + `<path ${HL} d="${starPath(x + r * 0.26, y - r * 0.36, r * 0.55)}"/>` + hl(x - r * 0.32, y + r * 0.46, r * 0.15);
    case 'oval': return E(r * 0.5, r * 1.05, INK) + hl(x + r * 0.12, y - r * 0.45, r * 0.2);
    case 'cat': return E(r * 0.86, r, `fill="${iris}" ${OLw(sw)}`) + ig(r * 0.86, r) + E(r * 0.22, r * 0.78, INK) + hl(x + r * 0.34, y - r * 0.42, r * 0.2);
    case 'hetero': return E(r * 0.82, r * 1.02, `fill="${iris}" ${OLw(sw)}`) + ig(r * 0.82, r * 1.02) + `<ellipse ${INK} cx="${r1(x)}" cy="${r1(y + r * 0.08)}" rx="${r1(r * 0.42)}" ry="${r1(r * 0.6)}"/>` + hl(x + r * 0.3, y - r * 0.45, r * 0.26);
    case 'sleepy': return `<path ${INK} d="M${pt(x - r * 0.88, y - r * 0.05)}A${r1(r * 0.88)} ${r1(r * 0.88)} 0 0 0 ${pt(x + r * 0.88, y - r * 0.05)}Z"/><path ${STRw(Math.max(2.2, r * 0.32))} d="M${pt(x - r * 1.05, y - r * 0.1)}H${r1(x + r * 1.05)}"/>`;
    case 'heart': return `<path d="${heartPath(x, y, r * 0.95)}" fill="#FF5C8A" ${OLw(sw)}/>` + hl(x - r * 0.3, y - r * 0.32, r * 0.2);
    case 'star': return E(r * 0.84, r * 1.04, INK) + `<path fill="${iris}" d="${starPath5(x, y + r * 0.05, r * 0.62)}"/>` + hl(x + r * 0.36, y - r * 0.5, r * 0.18);
    case 'fierce': {
      const s = x < 0 ? 1 : x > 0 ? -1 : 1;
      const O = [x - s * r, y - r * 0.35], I = [x + s * r, y + r * 0.1];
      return `<path d="M${pt(O[0], O[1])}L${pt(I[0], I[1])}Q${pt(x, y + r * 1.15)} ${pt(O[0], O[1])}Z" fill="${iris}" ${OLw(sw)}/><circle ${INK} cx="${r1(x + s * r * 0.12)}" cy="${r1(y + r * 0.28)}" r="${r1(r * 0.34)}"/>` + hl(x + s * r * 0.3, y + r * 0.12, r * 0.12);
    }
    case 'glow': return `<ellipse fill="${iris}" opacity=".35" cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r * 1.25)}" ry="${r1(r * 1.05)}"/>` + E(r * 0.85, r * 0.62, `fill="#FFFFFF" stroke="${iris}" stroke-width="${sw}"`);
    case 'compound': {
      let s2 = E(r, r * 1.15, `fill="#3A3354" ${OLw(sw)}`) + `<ellipse fill="${iris}" opacity=".55" cx="${r1(x - r * 0.15)}" cy="${r1(y - r * 0.2)}" rx="${r1(r * 0.6)}" ry="${r1(r * 0.7)}"/>`;
      [[-0.4, -0.4], [0.1, -0.5], [0.45, -0.1], [-0.2, 0.15], [0.3, 0.4]].forEach(([a, b2]) => { s2 += hl(x + a * r, y + b2 * r, r * 0.1); });
      return s2;
    }
    case 'cyclops': return E(r, r, `fill="#FFFFFF" ${OLw(sw * 1.1)}`) + E(r * 0.6, r * 0.62, `fill="${iris}"`) + ig(r * 0.6, r * 0.62) + E(r * 0.3, r * 0.32, INK) + hl(x + r * 0.25, y - r * 0.28, r * 0.15);
    default: return E(r * 0.8, r * 1.02, INK) + `<ellipse fill="${iris}" opacity=".6" cx="${r1(x)}" cy="${r1(y + r * 0.42)}" rx="${r1(r * 0.5)}" ry="${r1(r * 0.4)}"/>` + ig(r * 0.5, r * 0.4, r * 0.42) + hl(x + r * 0.3, y - r * 0.42, r * 0.34) + hl(x - r * 0.32, y + r * 0.42, r * 0.15);
  }
}
const eyeOther = {
  wide: (x, y, r) => `<ellipse ${INK} cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r)}" ry="${r1(r * 1.2)}"/><circle ${HL} cx="${r1(x + r * 0.3)}" cy="${r1(y - r * 0.48)}" r="${r1(r * 0.36)}"/><circle ${HL} cx="${r1(x - r * 0.35)}" cy="${r1(y + r * 0.42)}" r="${r1(r * 0.17)}"/>`,
  half: (x, y, r) => `<path ${INK} d="M${pt(x - r * 0.9, y)}A${r1(r * 0.9)} ${r1(r * 0.9)} 0 0 0 ${pt(x + r * 0.9, y)}Z"/><path ${STRw(Math.max(2.2, r * 0.3))} d="M${pt(x - r * 1.08, y - 0.5)}H${r1(x + r * 1.08)}"/>`,
  happy: (x, y, r) => `<path ${STRw(Math.max(2.6, r * 0.42))} d="M${pt(x - r, y + r * 0.3)}Q${pt(x, y - r * 1.25)} ${pt(x + r, y + r * 0.3)}"/>`,
  closed: (x, y, r) => `<path ${STRw(Math.max(2.6, r * 0.42))} d="M${pt(x - r, y)}Q${pt(x, y + r * 0.9)} ${pt(x + r, y)}"/>`,
  dizzy: (x, y, r) => `<path ${STRw(Math.max(2, r * 0.3))} d="M${pt(x - r * 0.75, y)}a${r1(r * 0.75)} ${r1(r * 0.75)} 0 1 1 ${pt(r * 0.75, r * 0.75)}a${r1(r * 0.5)} ${r1(r * 0.5)} 0 1 1 ${pt(-r * 0.5, -r * 0.5)}a${r1(r * 0.25)} ${r1(r * 0.25)} 0 1 1 ${pt(r * 0.25, r * 0.25)}"/>`,
};
function browsSVG(g, kind) {
  const k = g.k;
  return g.eyes.filter((e, i) => g.eyes.length === 1 || e[0] !== 0 || i < 2).slice(0, 2).map(([x, y, r]) => {
    const by = y - r * 1.25 - 3 * k;
    if (x === 0) return kind === 'sad' ? `<path ${STR2} d="M${pt(x - r, by + 2)}Q${pt(x, by - 3)} ${pt(x + r, by + 2)}"/>` : `<path ${STR2} d="M${pt(x - r, by - 2)}L${pt(x, by + 2)}L${pt(x + r, by - 2)}"/>`;
    const s = x < 0 ? 1 : -1, ox = x - s * r, ix = x + s * r * 0.75;
    return kind === 'sad' ? `<path ${STR2} d="M${pt(ox, by + 2)}L${pt(ix, by - 2)}"/>` : `<path ${STR2} d="M${pt(ox, by - 2)}L${pt(ix, by + 2)}"/>`;
  }).join('');
}
function mouthNormal(f, g) {
  const k = g.k, m = g.my, w = STRw(2.6 * clamp(k, 0.85, 1.2));
  const P = (x, y) => pt(x * k, m + y * k);
  const cat = `<path ${w} d="M${P(-7, -1)}Q${P(-3.5, 4)} ${P(0, -0.5)}Q${P(3.5, 4)} ${P(7, -1)}"/>`;
  const smile = `<path ${w} d="M${P(-6, 0)}Q${P(0, 5.5)} ${P(6, 0)}"/>`;
  const fang = x => `<path d="M${P(x - 1.6, 1.8)}L${P(x, 6.6)}L${P(x + 1.6, 1.5)}Z" fill="#FFFFFF" ${OL15}/>`;
  switch (f.mouth) {
    case 'cat': return cat;
    case 'blep': return cat + `<path d="M${P(-2.6, 0.8)}h${r1(5.2 * k)}v${r1(3.2 * k)}a${r1(2.6 * k)} ${r1(2.6 * k)} 0 0 1 ${r1(-5.2 * k)} 0z" fill="#FF8FA3" ${OL15}/>`;
    case 'o': return `<ellipse ${INK} cx="0" cy="${r1(m + 2 * k)}" rx="${r1(3.4 * k)}" ry="${r1(4 * k)}"/>`;
    case 'fang': return fang(3) + smile;
    case 'fangs': return fang(-3.4) + fang(3.4) + cat;
    case 'buck': return `<path d="M${P(-2.6, 1.4)}h${r1(5.2 * k)}v${r1(4.4 * k)}h${r1(-5.2 * k)}z" fill="#FFFFFF" ${OL15}/><path d="M${P(0, 1.6)}v${r1(4 * k)}" stroke="${LINE}" stroke-width="1.2"/>` + smile;
    case 'smirk': return `<path ${w} d="M${P(-5, 1)}Q${P(1, 4.5)} ${P(7, -2)}"/>`;
    case 'grin': return `<path d="M${P(-9, -1)}Q${P(0, 1)} ${P(9, -1)}Q${P(8, 9)} ${P(0, 9)}Q${P(-8, 9)} ${P(-9, -1)}Z" ${INK}/><path d="M${P(-7, 0.4)}Q${P(0, 2)} ${P(7, 0.4)}L${P(6.4, 3)}Q${P(0, 4.4)} ${P(-6.4, 3)}Z" fill="#FFFFFF"/>`;
    case 'tusks': return smile + `<path d="M${P(-6, 2)}Q${P(-6.6, -3.5)} ${P(-8.6, -6)}Q${P(-9.4, -1.5)} ${P(-8.2, 2.6)}Z" fill="#FFFBEA" ${OL15}/><path d="M${P(6, 2)}Q${P(6.6, -3.5)} ${P(8.6, -6)}Q${P(9.4, -1.5)} ${P(8.2, 2.6)}Z" fill="#FFFBEA" ${OL15}/>`;
    case 'zigzag': return `<path d="M${P(-9, 0)}L${P(-6, 3.5)}L${P(-3, 0.5)}L${P(0, 3.5)}L${P(3, 0.5)}L${P(6, 3.5)}L${P(9, 0)}Q${P(0, 10)} ${P(-9, 0)}Z" ${INK}/><path d="M${P(-6.5, 1.6)}L${P(-6, 3)}L${P(-5, 1.6)}ZM${P(5, 1.6)}L${P(6, 3)}L${P(6.5, 1.6)}Z" fill="#FFFFFF"/>`;
    case 'tongue': return `<path d="M${P(-7, -0.5)}Q${P(0, 1)} ${P(7, -0.5)}Q${P(6, 8)} ${P(0, 8)}Q${P(-6, 8)} ${P(-7, -0.5)}Z" ${INK}/><path d="M${P(-3.6, 4)}Q${P(0, 1.8)} ${P(3.6, 4)}Q${P(3.6, 9.5)} ${P(0, 9.5)}Q${P(-3.6, 9.5)} ${P(-3.6, 4)}Z" fill="#FF8FA3" ${OL15}/>`;
    case 'beak': return '';
    default: return smile;
  }
}
function mouthOther(kind, g, beak) {
  const k = g.k, m = g.my, w = STRw(2.6 * clamp(k, 0.85, 1.2));
  const P = (x, y) => pt(x * k, m + y * k);
  if (beak) return kind === 'open' || kind === 'o' ? `<path ${INK} d="M${P(-5, 2)}Q${P(0, 12)} ${P(5, 2)}Z"/>` : '';
  switch (kind) {
    case 'open': return `<path ${INK} d="M${P(-8, 0)}Q${P(0, 0)} ${P(8, 0)}Q${P(7, 12)} ${P(0, 12)}Q${P(-7, 12)} ${P(-8, 0)}Z"/><path fill="#FF8FA3" d="M${P(-4.5, 8.5)}Q${P(0, 4.5)} ${P(4.5, 8.5)}Q${P(3, 11)} ${P(0, 11)}Q${P(-3, 11)} ${P(-4.5, 8.5)}Z"/>`;
    case 'chew': return `<path ${w} d="M${P(-6, 1)}Q${P(0, 5)} ${P(6, 1)}"/>`;
    case 'o': return `<ellipse ${INK} cx="0" cy="${r1(m + 2 * k)}" rx="${r1(3.4 * k)}" ry="${r1(4 * k)}"/>`;
    case 'flat': return `<path ${w} d="M${P(-5, 2)}H${r1(5 * k)}"/>`;
    case 'frown': return `<path ${w} d="M${P(-6.5, 4.5)}Q${P(0, -1.5)} ${P(6.5, 4.5)}"/>`;
    case 'pout': return `<path ${w} d="M${P(-5, 2)}Q${P(-2.5, -1)} ${P(0, 2)}Q${P(2.5, 5)} ${P(5, 2)}"/>`;
  }
  return '';
}
function beakSVG(g) {
  const k = g.k, m = g.my - 3 * k;
  const P = (x, y) => pt(x * k, m + y * k);
  return `<path d="M${P(-7, -3)}Q${P(0, -6)} ${P(7, -3)}Q${P(3, 4)} ${P(0, 6)}Q${P(-3, 4)} ${P(-7, -3)}Z" fill="#FFB547" ${OL2}/><path d="M${P(-5, 0)}Q${P(0, 1.6)} ${P(5, 0)}" fill="none" stroke="#C9822A" stroke-width="1.4" stroke-linecap="round"/>`;
}
function noseSVG(f, g) {
  const k = g.k, y = g.ny, pal = f.pal;
  switch (f.nose) {
    case 'dot': return `<ellipse ${INK} cx="0" cy="${r1(y)}" rx="${r1(2.6 * k)}" ry="${r1(1.9 * k)}"/>`;
    case 'tri': return `<path ${INK} ${OLw(1.4)} d="M${pt(-3 * k, y - 1.6 * k)}H${r1(3 * k)}L0 ${r1(y + 2 * k)}Z"/>`;
    case 'heart': return `<path ${INK} d="${heartPath(0, y, 2.6 * k)}"/>`;
    case 'snout': return `<ellipse cx="0" cy="${r1(y + 1)}" rx="${r1(7.5 * k)}" ry="${r1(5 * k)}" fill="${pal.lt}" ${OL2}/><ellipse ${INK} cx="${r1(-2.4 * k)}" cy="${r1(y + 1)}" rx="${r1(1.2 * k)}" ry="${r1(1.8 * k)}"/><ellipse ${INK} cx="${r1(2.4 * k)}" cy="${r1(y + 1)}" rx="${r1(1.2 * k)}" ry="${r1(1.8 * k)}"/>`;
    case 'muzzle': return `<ellipse ${INK} cx="0" cy="${r1(y)}" rx="${r1(2.8 * k)}" ry="${r1(2 * k)}"/>`;
  }
  return '';
}
function cheeksSVG(f, g, stat) {
  const k = g.k, x = g.cx, y = g.cy, pal = f.pal, both = fn => fn(-x, -1) + fn(x, 1);
  const op = stat ? ' opacity=".55"' : '';
  switch (f.cheeks) {
    case 'blush': return `<g class="p-cheeks"${op}>${both(cx => `<ellipse cx="${r1(cx)}" cy="${r1(y)}" rx="${r1(7.5 * k)}" ry="${r1(4.8 * k)}" fill="${pal.cheek}" opacity=".9"/><ellipse cx="${r1(cx - 2 * k)}" cy="${r1(y - 1.4 * k)}" rx="${r1(2.4 * k)}" ry="${r1(1.3 * k)}" fill="#FFFFFF" opacity=".45"/>`)}</g>`;
    case 'dots': return `<g class="p-cheeks"${op}>${both(cx => [[0, -2], [-3, 1.5], [3, 1.5]].map(([a, b2]) => `<circle cx="${r1(cx + a * k)}" cy="${r1(y + b2 * k)}" r="${r1(1.6 * k)}" fill="${pal.cheek}"/>`).join(''))}</g>`;
    case 'swirl': return `<g class="p-cheeks"${op}>${both(cx => `<path d="M${pt(cx, y)}a${r1(3 * k)} ${r1(3 * k)} 0 1 1 ${r1(3 * k)} ${r1(-3 * k)}" fill="none" stroke="${pal.cheek}" stroke-width="2.2" stroke-linecap="round"/>`)}</g>`;
    case 'freckles': return `<g fill="#B4704A" opacity=".75">${both((cx, s) => [[-4, -3], [0, -5], [4, -2.5]].map(([a, b2]) => `<circle cx="${r1(cx + a * k * s)}" cy="${r1(y + b2 * k)}" r="1.4"/>`).join(''))}</g>`;
    case 'whiskers': return both((cx, s) => `<path d="M${pt(cx + s * 2 * k, y - 2 * k)}l${r1(s * 11 * k)} ${r1(-3 * k)}M${pt(cx + s * 2 * k, y + 1 * k)}l${r1(s * 12 * k)} 0M${pt(cx + s * 2 * k, y + 4 * k)}l${r1(s * 11 * k)} ${r1(3 * k)}" fill="none" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>`);
    case 'marks': return both((cx, s) => `<path d="M${pt(cx - s * 4 * k, y - 4 * k)}l${r1(s * 7 * k)} ${r1(2 * k)}M${pt(cx - s * 4 * k, y + 1 * k)}l${r1(s * 7 * k)} ${r1(2 * k)}" stroke="${pal.sec}" stroke-width="${r1(2.6 * k)}" stroke-linecap="round"/>`) + `<g class="p-cheeks"${op}>${both(cx => `<ellipse cx="${r1(cx)}" cy="${r1(y + 5 * k)}" rx="${r1(5 * k)}" ry="${r1(3 * k)}" fill="${pal.cheek}"/>`)}</g>`;
    case 'fluff': {
      const fy = g.faceY + 5 * k, fx = g.faceHW;
      const tuft = s => `<path d="M${pt(s * (fx - 4), fy - 8 * k)}L${pt(s * (fx + 7 * k), fy - 5 * k)}L${pt(s * (fx + 1), fy - 1 * k)}L${pt(s * (fx + 8 * k), fy + 3 * k)}L${pt(s * (fx - 3), fy + 7 * k)}Z" fill="${pal.belly}" ${OL2}/>`;
      return tuft(-1) + tuft(1) + `<g class="p-cheeks"${op}>${both(cx => `<ellipse cx="${r1(cx)}" cy="${r1(y)}" rx="${r1(6 * k)}" ry="${r1(4 * k)}" fill="${pal.cheek}"/>`)}</g>`;
    }
  }
  return '';
}
function faceSVG(f, g, o) {
  const stat = !!o.static, eyesSel = o.eyes || 'normal', mouthSel = o.mouth || 'smile', browSel = o.brows || 'none';
  const k = g.k, pal = f.pal, beak = f.mouth === 'beak';
  let s = '';
  if (f.nose === 'muzzle') s += `<ellipse cx="0" cy="${r1((g.ny + g.my) / 2 + 2 * k)}" rx="${r1(11 * k)}" ry="${r1(8 * k)}" fill="${pal.belly}"/>`;
  s += cheeksSVG(f, g, stat);
  s += noseSVG(f, g);
  const ok = (sel, v) => !stat || sel === v;
  let blink = '';
  if (ok(eyesSel, 'normal')) blink += `<g data-eye="normal">${g.eyes.map((e, i) => eyeNormal(f.eyes.t, e[0], e[1], e[2], f, i, o.irisG)).join('')}</g>`;
  ['wide', 'half'].forEach(kd => { if (ok(eyesSel, kd)) blink += `<g data-eye="${kd}">${g.eyes.map(e => eyeOther[kd](e[0], e[1], e[2])).join('')}</g>`; });
  s += `<g class="p-blink" data-ey="${r1(g.ey)}">${blink}</g>`;
  ['happy', 'closed', 'dizzy'].forEach(kd => { if (ok(eyesSel, kd)) s += `<g data-eye="${kd}">${g.eyes.map(e => eyeOther[kd](e[0], e[1], e[2])).join('')}</g>`; });
  ['sad', 'angry'].forEach(kd => { if (ok(browSel, kd)) s += `<g data-brow="${kd}">${browsSVG(g, kd)}</g>`; });
  if (ok(mouthSel, 'smile')) s += `<g data-mouth="smile">${mouthNormal(f, g)}</g>`;
  ['open', 'chew', 'o', 'flat', 'frown', 'pout'].forEach(kd => { if (ok(mouthSel, kd)) s += `<g data-mouth="${kd}">${mouthOther(kd, g, beak)}</g>`; });
  if (beak) s += beakSVG(g);
  return `<g class="p-face">${s}</g>`;
}

/* ---------- markings and extras ---------- */
function patternSVG(t, g, f, R) {
  const c = f.pal.sec, k = g.k, ey = g.ey;
  switch (t) {
    case 'spots': case 'freckled': {
      let s = '', n = 0, guard = 0;
      const many = t === 'freckled', want = many ? 22 : 7;
      while (n < want && guard++ < 120) {
        const fr = 0.08 + R() * 0.86, w = g.halfW(fr);
        const x = (R() * 2 - 1) * w * 0.92, y = g.Y(fr), r = (many ? 1.3 + R() * 1.2 : 4 + R() * 6) * k;
        if (Math.abs(x) < g.gap + g.er * 1.6 && y > ey - g.er * 2.2 && y < g.my + 8 * k) continue;
        s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${c}"${many ? ' opacity=".8"' : ''}/>`; n++;
      }
      return s;
    }
    case 'stripes': {
      let s = '';
      [0.95, 0.87].forEach(fr => { const w = g.halfW(fr) + 6, y = g.Y(fr); if (y < ey - g.er * 1.9) s += `<path d="M${pt(-w, y + 3)}Q0 ${r1(y - 4)} ${pt(w, y + 3)}" fill="none" stroke="${c}" stroke-width="${r1(5.5 * k)}" stroke-linecap="round"/>`; });
      [0.44, 0.32, 0.2].forEach(fr => { const w = g.halfW(fr), y = g.Y(fr); s += `<path d="M${pt(-w - 2, y)}l${r1(13 * k)} ${r1(-3 * k)}M${pt(w + 2, y)}l${r1(-13 * k)} ${r1(-3 * k)}" stroke="${c}" stroke-width="${r1(5.5 * k)}" stroke-linecap="round"/>`; });
      return s;
    }
    case 'tiger': return [0.8, 0.64, 0.48, 0.32, 0.17].map(fr => { const w = g.halfW(fr), y = g.Y(fr), L = 15 * k; return `<path d="M${pt(-w - 3, y - 4 * k)}L${pt(-w + L, y)}L${pt(-w - 3, y + 4 * k)}Z" fill="${c}"/><path d="M${pt(w + 3, y - 4 * k)}L${pt(w - L, y)}L${pt(w + 3, y + 4 * k)}Z" fill="${c}"/>`; }).join('');
    case 'cap': { const y = ey - g.er * 1.9; return `<path d="M-130 -280H130V${r1(y)}Q0 ${r1(y + 10 * k)} -130 ${r1(y)}Z" fill="${c}"/>`; }
    case 'mask': return g.eyes.map(([x, y, r]) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r * 1.7)}" ry="${r1(r * 1.45)}" fill="${c}"/>`).join('');
    case 'patch': { const e = g.eyes[g.eyes.length > 1 ? 1 : 0]; return `<ellipse cx="${r1(e[0] + e[2] * 0.4)}" cy="${r1(e[1] + 2)}" rx="${r1(e[2] * 2.2)}" ry="${r1(e[2] * 1.9)}" fill="${c}"/>`; }
    case 'socks': return `<path d="M-130 ${r1(g.yb - 9 * k)}Q-65 ${r1(g.yb - 15 * k)} 0 ${r1(g.yb - 9 * k)}T130 ${r1(g.yb - 9 * k)}V40H-130Z" fill="${c}"/>`;
    case 'split': return `<rect x="0" y="-280" width="140" height="320" fill="${c}" opacity=".85"/>`;
    case 'saddle': { const y = g.Y(0.38), w = g.halfW(0.38); return `<ellipse cx="${r1(-w)}" cy="${r1(y)}" rx="${r1(w * 0.42)}" ry="${r1(g.h * 0.14)}" fill="${c}"/><ellipse cx="${r1(w)}" cy="${r1(y)}" rx="${r1(w * 0.42)}" ry="${r1(g.h * 0.14)}" fill="${c}"/>`; }
    case 'diamond': return [[ey - g.er * 2.3, 6], [g.bellyY - g.bellyRY * 0.2, 7], [g.bellyY + g.bellyRY * 0.65, 5]].map(([y, r]) => { r *= k; return `<path d="M${pt(0, y - r)}L${pt(r * 0.7, y)}L${pt(0, y + r)}L${pt(-r * 0.7, y)}Z" fill="${c}"/>`; }).join('');
  }
  return '';
}
function bellySVG(t, g, f) {
  const x = 0, y = g.bellyY, rx = g.bellyRX, ry = g.bellyRY, c = f.pal.belly;
  switch (t) {
    case 'none': return '';
    case 'round': return `<circle cx="${x}" cy="${r1(y)}" r="${r1(Math.min(rx, ry * 1.2))}" fill="${c}"/>`;
    case 'heart': return `<path d="${heartPath(x, y - ry * 0.05, Math.min(rx, ry) * 0.95)}" fill="${c}"/>`;
    case 'chest': {
      let d = `M${pt(-rx, y + ry)}V${r1(y - ry * 0.4)}`;
      const n = 5, st2 = (2 * rx) / n;
      for (let i = 0; i < n; i++) d += `q${r1(st2 / 2)} ${r1(-ry * 0.7)} ${r1(st2)} 0`;
      return `<path d="${d}V${r1(y + ry * 1.6)}H${r1(-rx)}Z" fill="${c}"/>`;
    }
    default: return `<ellipse cx="${x}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${c}"/>`;
  }
}
function scalesSVG(g, f) {
  const step = 9 * g.k;
  let d = '';
  for (let y = g.top + 8, row = 0; y < g.yb - 3; y += step * 0.8, row++) {
    for (let x = -64 + (row % 2) * step / 2; x < 64; x += step) d += `M${pt(x - step / 2, y)}a${r1(step / 2)} ${r1(step / 2)} 0 0 0 ${r1(step)} 0`;
  }
  return `<path d="${d}" fill="none" stroke="${f.pal.dk}" stroke-width="1.6" opacity=".45"/>`;
}
function marksSVG(t, g, c) {
  const k = g.k;
  const st2 = d => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${r1(4.2 * k)}" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/><path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${r1(1.4 * k)}" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`;
  const ey = g.ey;
  if (t === 'chevron') return st2(`M${pt(-6 * k, ey - g.er - 12 * k)}L0 ${r1(ey - g.er - 7 * k)}L${pt(6 * k, ey - g.er - 12 * k)}`) + st2(`M${pt(-g.bellyRX * 0.6, g.bellyY - 6)}L0 ${r1(g.bellyY + 2)}L${pt(g.bellyRX * 0.6, g.bellyY - 6)}`);
  if (t === 'swirl') return st2(`M${pt(-g.gap - g.er - 9 * k, ey + 8 * k)}q${r1(-6 * k)} ${r1(-6 * k)} 0 ${r1(-11 * k)}`) + st2(`M${pt(g.gap + g.er + 9 * k, ey + 8 * k)}q${r1(6 * k)} ${r1(-6 * k)} 0 ${r1(-11 * k)}`) + st2(`M${pt(-8, g.bellyY)}a8 8 0 1 0 8 -8`);
  return st2(`M${pt(-g.halfW(0.32) + 2, g.Y(0.34))}l${r1(11 * k)} ${r1(-3 * k)}M${pt(-g.halfW(0.22) + 2, g.Y(0.24))}l${r1(13 * k)} ${r1(-2 * k)}M${pt(g.halfW(0.32) - 2, g.Y(0.34))}l${r1(-11 * k)} ${r1(-3 * k)}M${pt(g.halfW(0.22) - 2, g.Y(0.24))}l${r1(-13 * k)} ${r1(-2 * k)}`);
}
function ruffSVG(g, f) {
  const nf = g.blob ? g.neckF - 0.06 : g.neckF;
  let y = Math.max(g.Y(nf), g.my + 16 * g.k);
  const w = g.halfW(clamp((g.yb - y) / g.h, 0, 1)) + 4, n = 7, step = (2 * w) / n;
  let d = `M${pt(-w, y - 4)}Q0 ${r1(y - 11)} ${pt(w, y - 4)}L${pt(w, y + 2)}`;
  for (let i = 0; i < n; i++) d += `q${r1(-step / 2)} 9 ${r1(-step)} 0`;
  return `<path d="${d}Z" fill="${f.pal.belly}" ${OL2}/>`;
}
function lionManeSVG(g, f) {
  const cy = g.headC[1] + 4, Rr = g.faceHW * 1.32, n = 16;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, x = Math.cos(a) * Rr, y = cy + Math.sin(a) * Rr * 0.95;
    if (i === 0) { d = `M${pt(x, y)}`; continue; }
    const am = (i - 0.5) / n * Math.PI * 2;
    d += `Q${pt(Math.cos(am) * Rr * 1.22, cy + Math.sin(am) * Rr * 1.16)} ${pt(x, y)}`;
  }
  return `<path d="${d}Z" fill="${f.pal.dk}" ${OL}/>`;
}
function armorSVG(g, f, c, id) {
  const cy = g.bellyY - 2, w = g.bellyRX * 1.05;
  const hh = Math.max(10, Math.min(g.bellyRY * 1.5, (cy - (g.my + 9 * g.k)) / 0.85));
  const d = `M${pt(-w, cy - hh * 0.55)}Q0 ${r1(cy - hh * 0.85)} ${pt(w, cy - hh * 0.55)}L${pt(w * 0.8, cy + hh * 0.3)}Q0 ${r1(cy + hh * 0.9)} ${pt(-w * 0.8, cy + hh * 0.3)}Z`;
  return `<path d="${d}" fill="url(#${id}m)" ${OL}/><path d="M${pt(0, cy - hh * 0.5)}L${pt(5, cy - hh * 0.12)}L${pt(0, cy + hh * 0.25)}L${pt(-5, cy - hh * 0.12)}Z" fill="${c}" ${OL2}/>`;
}
function pauldronSVG(g, c, id, heavy) {
  const k = g.k, x = g.ax - 3 * k, y = g.ay - 5 * k, w = (12 + heavy * 2) * k, h = 9 * k;
  const plate = `<g transform="translate(${pt(x, y)})"><path d="M${pt(-w, h * 0.5)}Q${pt(-w * 1.05, -h * 0.8)} ${pt(0, -h)}Q${pt(w * 0.9, -h * 0.7)} ${pt(w * 0.75, h * 0.45)}Q${pt(0, h * 1.15)} ${pt(-w, h * 0.5)}Z" fill="url(#${id}m)" ${OL}/><path d="M${pt(-w * 0.62, h * 0.1)}Q${pt(-w * 0.6, -h * 0.45)} ${pt(0, -h * 0.6)}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".7"/><path d="M${pt(-2.6 * k, -2 * k)}L${pt(0, -6 * k)}L${pt(2.6 * k, -2 * k)}L${pt(0, 2 * k)}Z" fill="${c}" ${OL2}/></g>`;
  return `<g class="p-pauldron">${plate}<g transform="scale(-1 1)">${plate}</g></g>`;
}
function topSVG(t, g, F) {
  const T = g.top + 2;
  if (t === 'tuft') return `<path d="M${pt(-8, T + 4)}Q${pt(-8, T - 11)} ${pt(0, T - 4)}Q${pt(4, T - 15)} ${pt(10, T + 3)}Z" fill="${F}" ${OL}/>`;
  if (t === 'sprout') return `<path d="M0 ${r1(T + 3)}V${r1(T - 9)}" stroke="${LINE}" stroke-width="2.4"/><path d="M0 ${r1(T - 7)}C-4 ${r1(T - 15)} -12 ${r1(T - 15)} -14 ${r1(T - 9)}C-8 ${r1(T - 5)} -3 ${r1(T - 5)} 0 ${r1(T - 7)}Z" fill="#7CC46E" ${OL2}/><path d="M0 ${r1(T - 9)}C4 ${r1(T - 17)} 12 ${r1(T - 17)} 14 ${r1(T - 11)}C8 ${r1(T - 7)} 3 ${r1(T - 7)} 0 ${r1(T - 9)}Z" fill="#7CC46E" ${OL2}/>`;
  return rope(`M${pt(0, T + 4)}C${pt(-2, T - 10)} ${pt(10, T - 16)} ${pt(10, T - 8)}C${pt(10, T - 3)} ${pt(3, T - 4)} ${pt(4, T - 9)}`, 3.6, F);
}
/* the golden aura's sunburst behind the body: rays that turn with the aura's ring (8 at hatching, 16 at Celestial,
   longer as it grows), a second ring from Guardian on, and four-point sparkles from Junior on */
function haloSVG(t, g) {
  const T = g.top - (g.f.x.horns ? 14 : 0) - (g.f.ears.t === 'bunny' || g.f.ears.t === 'antenna' ? 14 : 0);
  if (t === 'crown') { const y = g.top + 3; return `<path d="M${pt(-14, y + 3)}L${pt(-17, y - 14)}L${pt(-7, y - 6)}L0 ${r1(y - 18)}L${pt(7, y - 6)}L${pt(17, y - 14)}L${pt(14, y + 3)}Z" fill="#FFD447" ${OL}/><circle cx="0" cy="${r1(y - 4)}" r="3" fill="#FF5C8A" ${OL15}/>`; }
  if (t === 'stars') return `<g class="p-halo">${[-18, 0, 18].map((x, i) => `<path d="${starPath5(x, T - (i === 1 ? 24 : 17), i === 1 ? 8 : 6)}" fill="#FFE37A" ${OL2}/>`).join('')}</g>`;
  return `<g class="p-halo"><ellipse cx="0" cy="${r1(T - 20)}" rx="24" ry="6.5" fill="none" stroke="${LINE}" stroke-width="7.5"/><ellipse cx="0" cy="${r1(T - 20)}" rx="24" ry="6.5" fill="none" stroke="#FFD447" stroke-width="3.6"/></g>`;
}
function gemMarkSVG(c, x, y, k) {
  return `<path d="M${pt(x, y - 7 * k)}L${pt(x + 6.5 * k, y - k)}L${pt(x, y + 6.5 * k)}L${pt(x - 6.5 * k, y - k)}Z" fill="${c}" ${OL2}/><path d="M${pt(x - 2.5 * k, y - 2.5 * k)}L${pt(x, y - 5 * k)}L${pt(x + 2 * k, y - 2.5 * k)}" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>`;
}

/* ---------- a six-star Legendary's wings, lights and aura ----------
   Its wings are its own colours (f.x.leg): angel wings, cel-shaded rows of feathers (long primaries fanning from the
   hand, secondaries hanging from the arm, two rows of coverts over their roots, each feather inked, its tip coloured),
   or dragon wings (a membrane between four fingers, shaded along its scalloped edge, the bones inked over it).
   One wing is drawn once per pet, for every size it is used at, and shown by <use> on both sides */
const mixHex = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), m = (x, y) => Math.round(x + (y - x) * t); return '#' + [16, 8, 0].map(sh => m(A >> sh & 255, B >> sh & 255).toString(16).padStart(2, '0')).join(''); };
const LEG_DRAW = [0, 0.9, 1.06, 1.22, 1.4, 1.6, 1.82, 2.05];   // the wings' drawn size at each stage (they start small)
// the pairs' sizes: the main pair always the biggest
const LEG_PAIR_SC = [1, 0.82, 0.72, 0.56], BF_PAIR_SC = [1, 0.92, 0.82, 0.72];   // (a butterfly's swallowtails: nearly as big as its great pair)
function legBone(v) {
  const P = [[0, 0], [0.85, 1.15], [1.85, 2.0], [3.0, 2.5], [4.1, 2.7], [4.8, 2.6]], k = clamp(v, 0, 1) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(k)), e = k - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)], e2 = e * e, e3 = e2 * e;
  return [0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * e + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * e2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * e3));
}
function legFeathers() {
  if (legFeathers.c) return legFeathers.c; const F = [], D = Math.PI / 180, lerp2 = (a, b, t) => a + (b - a) * t;
  for (let i = 0; i < 5; i++) { const k = i / 4, b = legBone(0.04 + 0.5 * k); F.push([b[0], b[1], lerp2(-102, -82, k) * D, lerp2(3.0, 3.5, k), 1.7, 0]); }
  for (let i = 5; i >= 0; i--) { const k = i / 5, b = legBone(0.55 + 0.45 * k); F.push([b[0], b[1], lerp2(-76, 6, Math.pow(k, 0.9)) * D, lerp2(3.8, 4.7, Math.sin(k * 2.2) * 0.7 + k * 0.3), 1.65, 1]); }
  for (let i = 6; i >= 0; i--) { const k = i / 6, b = legBone(0.05 + 0.9 * k); F.push([b[0], b[1] - 0.15, lerp2(-100, -18, Math.pow(k, 0.85)) * D, lerp2(2.0, 2.4, k), 1.4, 2]); }
  for (let i = 0; i < 6; i++) { const k = i / 5, b = legBone(0.02 + 0.9 * k); F.push([b[0], b[1] + 0.08, lerp2(-94, -38, k) * D, 1.2 + 0.1 * Math.sin(i * 1.7), 1.1, 3]); }
  return (legFeathers.c = F);
}
// a closed smooth path through points (curves between their midpoints)
function smoothD(P) {
  const n = P.length, M = i => { const a = P[i % n], b = P[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  let d = `M${pt(...M(0))}`; for (let i = 1; i <= n; i++) d += `Q${pt(...P[i % n])} ${pt(...M(i))}`; return d + 'Z';
}
const FEATHER = [[-0.04, 0], [0.12, 0.3], [0.42, 0.5], [0.74, 0.48], [0.92, 0.3], [1.02, 0.04], [0.94, -0.2], [0.72, -0.38], [0.4, -0.4], [0.12, -0.26]];
const FEATHER_TIP = [[0.6, 0.4], [0.75, 0.4], [0.9, 0.25], [0.97, 0.04], [0.9, -0.16], [0.73, -0.31], [0.6, -0.32], [0.67, 0.04]];
// one left wing at size s, its root at 0 0 (lw: ink width)
// (fo: how far the wing is drawn folded, its fingers or feathers closer together, for the extra pairs; PT: if given,
// the outline's points are gathered in it)
const LEG_MID = { angel: 12, dragon: 14, butterfly: -6, dragonfly: 4, crystal: 8 };
// how each kind beats: [speed, swing, close]. A butterfly slow and deep, closing its wings up; a dragonfly a quick shallow
// buzz, its clear blades barely narrowing
const LEG_BEAT = { butterfly: [0.55, 1.3, 1.5], dragonfly: [2.1, 0.5, 0.35], crystal: [0.75, 0.75, 0.25] }, legBeat = L => (L && LEG_BEAT[L.w]) || [1, 1, 1];
// a closed path through points, curving between their midpoints, sharp at the points marked (p[2])
function edgeD(P) {
  const n = P.length, M = i => { const a = P[i % n], b = P[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  let d = `M${pt(...M(0))}`; for (let i = 1; i <= n; i++) { const p = P[i % n]; d += p[2] ? `L${pt(p[0], p[1])}L${pt(...M(i))}` : `Q${pt(p[0], p[1])} ${pt(...M(i))}`; } return d + 'Z';
}
/* a butterfly's wing (the left; its root at 0 0): a forewing rising to its apex and a hindwing falling to its tail. Young,
   a plain rounded pair; each stage the points, the tail and the veins come on, and at Celestial great jewelled panes,
   shimmering from its colour to its light's, a dark glittering margin, veins in cells, filigree, eye-spots and sparkles */
/* a swallowtail: the extra wings tucked in below a butterfly's great pair (from Guardian). A broad scalloped lobe
   falling to a long tail: pale at its root, a band of soft spots, then dark to the edge with bright crescents in it,
   white veins running out through the dark */
function swallowtailWing(L, s, lw, fo, PT) {
  const sg = L.sg || 7, cel = sg >= 7, v = L.v == null ? 0.5 : L.v, em = LEG_MID.butterfly * Math.PI / 180, k = 0.95 * s, tl = 0.9 + 0.25 * (1 - v);
  const P = (x, y, sharp) => { const q = legFold(x * k, y * k, fo, em); return sharp ? [q[0], q[1], 1] : q; };
  const O = [P(0, -2), P(-14, -3), P(-30, 0), P(-42, 6, 1), P(-46, 14), P(-42, 19, 1), P(-45, 27), P(-40, 32, 1), P(-40, 40), P(-33, 44, 1), P(-31, 52 * tl), P(-27, 70 * tl, 1), P(-23, 52 * tl), P(-19, 44, 1), P(-13, 36), P(-6, 24), P(-2, 10)];
  if (PT) PT.push(...O);
  const gid = 'sw' + (++SVGUID), d0 = edgeD(O), deep = mixHex(L.b, '#2B2433', 0.35), pink = mixHex(L.c, '#FFFFFF', 0.5), red = L.c, base = mixHex(L.a, '#FFFFFF', 0.1);
  const V = [3, 4, 6, 8, 9, 11, 13].map(i => O[i]), at = (p, f2) => [p[0] * f2, p[1] * f2];
  let out = `<defs><clipPath id="${gid}"><path d="${d0}"/></clipPath></defs><path d="${d0}" fill="${deep}"/><g clip-path="url(#${gid})">`;
  // the pale root, out to about half way
  out += `<path d="${edgeD(O.map(p => at(p, 0.52)))}" fill="${base}" opacity=".95"/>`;
  // the soft spots between the veins, and the crescents beyond them
  for (let i = 0; i < V.length - 1; i++) { const a = V[i], b = V[i + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L2 = Math.hypot(m[0], m[1]) || 1, ang = Math.atan2(m[1], m[0]) * 180 / Math.PI, gap = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const c1 = at(m, 0.64), c2 = at(m, 0.86);
    out += `<ellipse cx="${r1(c1[0])}" cy="${r1(c1[1])}" rx="${r1(L2 * 0.13)}" ry="${r1(Math.max(1.5, gap * 0.3))}" transform="rotate(${r1(ang)} ${r1(c1[0])} ${r1(c1[1])})" fill="${pink}"/>`;
    out += `<ellipse cx="${r1(c2[0])}" cy="${r1(c2[1])}" rx="${r1(L2 * 0.05)}" ry="${r1(Math.max(1.2, gap * 0.34))}" transform="rotate(${r1(ang)} ${r1(c2[0])} ${r1(c2[1])})" fill="${red}"/>`; }
  // a little eye of colour by the tail at Celestial
  if (cel) { const e = at(O[11], 0.72); out += `<circle cx="${r1(e[0])}" cy="${r1(e[1])}" r="${r1(2.2 * s)}" fill="${pink}" stroke="#FFFFFF" stroke-width="${r1(0.6 * s)}"/>`; }
  // the veins: dark across the pale root, white out through the dark
  let vin = '', vout = ''; V.forEach(p => { vin += `M${pt(...at(p, 0.12))}L${pt(...at(p, 0.52))}`; vout += `M${pt(...at(p, 0.52))}L${pt(...at(p, 0.97))}`; });
  vout += `M${pt(...at(O[11], 0.5))}L${pt(...at(O[11], 0.95))}`;
  out += `<path d="${vin}" fill="none" stroke="${deep}" stroke-width="${r1(Math.max(0.6, 0.55 * s))}" stroke-linecap="round" opacity=".8"/><path d="${vout}" fill="none" stroke="#FFFFFF" stroke-width="${r1(Math.max(0.7, 0.65 * s))}" stroke-linecap="round" opacity=".9"/></g>`;
  return out + `<path d="${d0}" fill="none" stroke="${LINE}" stroke-width="${r1(lw * 0.9)}" stroke-linejoin="round"/>`;
}
function butterflyWing(L, s, lw, fo, PT) {
  if (L.pi) return swallowtailWing(L, s, lw, fo, PT);
  const sg = L.sg || 7, e = clamp((sg - 1) / 6, 0, 1), cel = sg >= 7, v = L.v == null ? 0.5 : L.v, em = LEG_MID.butterfly * Math.PI / 180;
  const k = 0.95 * s, ap = 0.92 + 0.16 * v, tl = 0.85 + 0.3 * (1 - v);
  const P = (a, b, c, d, sharp) => { const q = legFold((a + (c - a) * e) * k, (b + (d - b) * e) * k * (b < 0 ? ap : 0.8), fo, em); return sharp ? [q[0], q[1], 1] : q; };
  const pts = e > 0.3;
  // (each point: where it is on a young one, where at Celestial; the forewing traced from root up the leading edge to
  // its apex, down the outer margin to the point at its side and back; the hindwing out to its point, down its
  // scalloped margin to the tail and back up)
  const F = [P(0, -2, 0, -2), P(-8, -15, -9, -18), P(-21, -29, -27, -37), P(-34, -36, -47, -51), P(-43, -34, -60, -56), P(-46, -27, -61, -46), P(-45, -18, -58, -36), P(-43, -11, -55, -26), P(-41, -7, -52, -17), P(-41, -4, -60, -8, pts), P(-30, -3, -40, -4), P(-16, -1, -21, -2)];
  const H = [P(0, 2, 0, 2), P(-16, 3, -22, 4), P(-28, 5, -40, 7), P(-34, 8, -56, 11, pts), P(-36, 14, -50, 18), P(-33, 21, -49, 27 * tl, cel), P(-30, 26, -45, 34 * tl), P(-26, 30, -40, 41 * tl, cel), P(-20, 31, -33, 46 * tl), P(-14, 27, -28, 60 * tl, e > 0.5), P(-10, 22, -22, 44 * tl), P(-6, 16, -13, 31 * tl), P(-3, 9, -6, 17)];
  if (PT) PT.push(...F, ...H);
  const gid = 'bf' + (++SVGUID), deep = mixHex(L.b, '#2B2433', 0.25), pane = cel ? `url(#${gid})` : L.a, op = cel ? 0.86 : 0.94;
  const mw = (1.1 + 1.5 * e) * s + lw * 0.35, vw = Math.max(0.7, (0.6 + 0.45 * e) * s);
  let out = cel ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mixHex(L.a, '#FFFFFF', 0.35)}"/><stop offset=".55" stop-color="${L.a}"/><stop offset="1" stop-color="${mixHex(L.a, L.c, 0.45)}"/></linearGradient></defs>` : '';
  const dF = edgeD(F), dH = edgeD(H);
  // the panes, the hindwing behind the forewing
  out += `<path d="${dH}" fill="${pane}" opacity="${op}"/><path d="${dF}" fill="${pane}" opacity="${op}"/>`;
  // veins from the root out to the margin (more of them as it grows), and at Mythic on, cross-veins making cells
  // (they start a way out from the root, from the edge of the wing's inner cell, as a butterfly's do)
  const vein = (to, f2) => { const a0 = [to[0] * 0.3, to[1] * 0.3], m = [to[0] * 0.62, to[1] * 0.62 + (to[1] < 0 ? 2 : -2) * s]; return `M${pt(...a0)}Q${pt(...m)} ${pt(to[0] * f2, to[1] * f2)}`; };
  const fv = sg >= 3 ? [2, 3, 4, 5, 6, 7, 8, 9] : [3, 5, 8], hv = sg >= 3 ? [3, 4, 5, 6, 7, 8, 9, 10] : [3, 6, 9];
  let vd = fv.map(i => vein(F[i], 0.94)).join('') + hv.map(i => vein(H[i], 0.94)).join('');
  { const cell = (A, f2) => { let d2 = `M${pt(A[0][0] * f2, A[0][1] * f2)}`; for (let i = 1; i < A.length; i++) d2 += `L${pt(A[i][0] * f2, A[i][1] * f2)}`; return d2; }; vd += cell(fv.map(i => F[i]), 0.3) + cell(hv.map(i => H[i]), 0.3); }
  if (sg >= 5) { const cross = (A, f2) => { let d2 = ''; for (let i = 0; i < A.length - 1; i++) { const a = A[i], b = A[i + 1]; d2 += `M${pt(a[0] * f2, a[1] * f2)}Q${pt((a[0] + b[0]) * f2 * 0.52, (a[1] + b[1]) * f2 * 0.52)} ${pt(b[0] * f2, b[1] * f2)}`; } return d2; };
    vd += cross(fv.map(i => F[i]), 0.58) + cross(hv.map(i => H[i]), 0.58); if (cel) vd += cross(fv.map(i => F[i]), 0.8) + cross(hv.map(i => H[i]), 0.8); }
  out += `<path d="${vd}" fill="none" stroke="${deep}" stroke-width="${r1(vw)}" stroke-linecap="round" opacity=".9"/>`;
  // the margin: a dark glittering band round each wing, inked outside
  out += `<path d="${dH}" fill="none" stroke="${deep}" stroke-width="${r1(mw)}" stroke-linejoin="round"/><path d="${dF}" fill="none" stroke="${deep}" stroke-width="${r1(mw)}" stroke-linejoin="round"/>`;
  out += `<path d="${dH}${dF}" fill="none" stroke="${LINE}" stroke-width="${r1(lw * 0.9)}" stroke-linejoin="round"/>`;
  // spots inside the margin (Junior on), an eye on the hindwing (Guardian on), filigree flecks and sparkles at Celestial
  if (sg >= 3) { let dots = ''; [F[4], F[5], F[6], F[7], H[4], H[5], H[6]].forEach((q, i) => { const r = (0.9 + (i % 2) * 0.6) * s; dots += `<circle cx="${r1(q[0] * 0.86)}" cy="${r1(q[1] * 0.86)}" r="${r1(r)}" fill="#FFFFFF" opacity=".85"/>`; }); out += dots; }
  if (sg >= 5) { const c0 = [H[5][0] * 0.62, H[5][1] * 0.62], r = (2.4 + 1.6 * e) * s; out += `<circle cx="${r1(c0[0])}" cy="${r1(c0[1])}" r="${r1(r)}" fill="${L.c}" stroke="${deep}" stroke-width="${r1(Math.max(0.8, 0.9 * s))}"/><circle cx="${r1(c0[0] - r * 0.2)}" cy="${r1(c0[1] - r * 0.2)}" r="${r1(r * 0.38)}" fill="#FFFFFF"/>`; }
  if (cel) {
    let fl = ''; [[F[3], F[4]], [F[4], F[5]], [F[5], F[6]], [F[6], F[7]], [F[7], F[8]], [H[4], H[5]], [H[5], H[6]], [H[6], H[7]], [H[7], H[8]], [H[8], H[9]]].forEach(([a, b]) => { const m = [(a[0] + b[0]) / 2 * 0.84, (a[1] + b[1]) / 2 * 0.84], d = [m[0] * 0.1, m[1] * 0.1]; fl += `M${pt(m[0] - d[0], m[1] - d[1])}Q${pt(m[0] + d[1] * 0.6, m[1] - d[0] * 0.6)} ${pt(m[0] + d[0] * 1.6, m[1] + d[1] * 1.6)}Q${pt(m[0] - d[1] * 0.6, m[1] + d[0] * 0.6)} ${pt(m[0] - d[0], m[1] - d[1])}Z`; });
    out += `<path d="${fl}" fill="${deep}" opacity=".9"/>`;
    [[F[3], 0.6], [F[6], 0.66], [H[6], 0.6]].forEach(([q, f2]) => { out += `<path d="${starPath5(q[0] * f2, q[1] * f2, 2.6 * s)}" fill="#FFFFFF" opacity=".95"/>`; });
  }
  return out;
}
/* a crystal wing (the left; its root at 0 0): shards of crystal fanned like a wing's feathers, the longest above the
   middle, each faceted (a lit face and a shaded one, a bright edge, a deep rim), little shards over their roots, glints.
   Three shards young, seven at Celestial, longer each stage; at Celestial each catches its light's colour at the tip */
function crystalWing(L, s, lw, fo, PT) {
  const sg = L.sg || 7, cel = sg >= 7, v = L.v == null ? 0.5 : L.v, em = LEG_MID.crystal * Math.PI / 180, D = Math.PI / 180;
  const n = [3, 3, 4, 5, 5, 6, 7, 7][sg] - (L.pi ? L.pi + 1 : 0), grow = 0.72 + 0.04 * sg, lite = mixHex(L.a, '#FFFFFF', 0.5), deep = L.b, tip = cel ? mixHex(L.a, L.c, 0.55) : lite;
  const P = (x, y) => legFold(x * s, y * s, fo, em);
  let out = '', glints = '';
  const shard = (bx, by, ang, len, w, k) => {
    const d = [-Math.cos(ang), -Math.sin(ang)], nn = [-d[1], d[0]], at = (u, m) => P(bx + d[0] * len * u + nn[0] * w * m, by + d[1] * len * u + nn[1] * w * m);
    const A = at(0, -0.5), B = at(0, 0.5), C = at(0.72, 0.55), T = at(1, 0), E = at(0.72, -0.55), M0 = at(0.05, 0), M1 = at(0.72, 0.02);
    if (PT) PT.push(A, B, C, T, E);
    const face = (q, col, o) => `<path d="M${q.map(p => pt(...p)).join('L')}Z" fill="${col}" opacity="${o}"/>`;
    out += face([A, M0, M1, T, E], k ? mixHex(lite, '#FFFFFF', 0.2) : lite, 0.92) + face([M0, B, C, T, M1], k ? mixHex(L.a, '#FFFFFF', 0.15) : L.a, 0.9);
    if (cel) out += face([M1, C, T, E], tip, 0.55);
    out += `<path d="M${[A, B, C, T, E].map(p => pt(...p)).join('L')}Z" fill="none" stroke="${deep}" stroke-width="${r1(Math.max(0.9, (k ? 0.8 : 1.1) * s) + lw * 0.35)}" stroke-linejoin="round"/>`;
    out += `<path d="M${pt(...M0)}L${pt(...M1)}L${pt(...T)}" fill="none" stroke="#FFFFFF" stroke-width="${r1(Math.max(0.6, 0.55 * s))}" stroke-linecap="round" opacity=".85"/>`;
    if (!k) { const g = at(0.55, -0.22); glints += `<path d="${starPath5(g[0], g[1], (1.6 + (cel ? 1 : 0)) * s)}" fill="#FFFFFF" opacity=".9"/>`; }
  };
  // the shards, laid like a wing's feathers: their roots along an arm running up and out, the inner ones short and
  // hanging down from it, the outer ones longer, pointing out, the longest up from the tip (drawn outer first)
  for (let i = n - 1; i >= 0; i--) {
    const u = n === 1 ? 1 : i / (n - 1), ang = (-64 + u * 100) * D, len = (17 + 33 * Math.pow(u, 0.8)) * grow * (0.94 + 0.12 * v), w = (6 + 2.6 * u) * (0.9 + 0.2 * (1 - v));
    shard(-3 - 19 * u, 1 - 15 * u, ang, len, w, 0);
  }
  // little shards along the arm, over the roots
  const m = sg >= 4 ? 4 : 3; for (let i = 0; i < m; i++) { const u = (i + 0.5) / m; shard(-1 - 17 * u, 0 - 13 * u, (-40 + u * 75) * D, (11 + 6 * u) * grow, 5, 1); }
  return out + glints;
}
/* a dragonfly's wing (the left; its root at 0 0): a long clear blade, its leading edge a strong dark vein, veins running
   its length and cross-veins between them in a net of little cells (finer as it grows), a dark mark near its tip, a
   sheen across it, and at Celestial a shimmer from its colour to its light's */
function dragonflyWing(L, s, lw, fo, PT) {
  const sg = L.sg || 7, cel = sg >= 7, v = L.v == null ? 0.5 : L.v, em = LEG_MID.dragonfly * Math.PI / 180;
  const Lb = 62 * (0.92 + 0.16 * v), Wd = 10.5 * (0.88 + 0.28 * (1 - v));
  const at = (u, q) => { const h = Wd * Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.55) * (1 - 0.22 * u), x = -Lb * u, y = -2.5 * u + (q < 0 ? q * h * 0.5 : q * h); return legFold(x * s, y * s, fo, em); };
  const N = 14, lead = [], trail = []; for (let i = 0; i <= N; i++) { const u = i / N; lead.push(at(u, -1)); trail.push(at(u, 1)); }
  const outline = lead.concat(trail.slice(1, -1).reverse()); if (PT) PT.push(...outline);
  const d0 = smoothD(outline), gid = 'df' + (++SVGUID), ink = mixHex(L.b, '#2B2433', 0.2);
  let out = `<defs><linearGradient id="${gid}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${L.a}" stop-opacity=".5"/><stop offset=".6" stop-color="${L.a}" stop-opacity=".28"/><stop offset="1" stop-color="${cel ? L.c : L.a}" stop-opacity="${cel ? 0.42 : 0.22}"/></linearGradient></defs>`;
  out += `<path d="${d0}" fill="url(#${gid})"/>`;
  // a sheen along it
  const sh = [0.12, 0.3, 0.5, 0.7, 0.86].map(u => at(u, -0.15)), sh2 = [0.86, 0.7, 0.5, 0.3, 0.12].map(u => at(u, 0.2));
  out += `<path d="${smoothD(sh.concat(sh2))}" fill="#FFFFFF" opacity=".28"/>`;
  // veins down its length, and the net between them
  const rows = [-1, -0.45, 0.05, 0.5, 1], line = (q, u0, u1) => { let d2 = ''; for (let i = 0; i <= 10; i++) { const p = at(u0 + (u1 - u0) * i / 10, q); d2 += (i ? 'L' : 'M') + pt(...p); } return d2; };
  let vd = rows.slice(1, -1).map(q => line(q, 0.03, 0.97)).join('');
  const step = sg >= 7 ? 0.038 : sg >= 4 ? 0.055 : 0.08; let net = '', j = 0;
  for (let r = 0; r < rows.length - 1; r++) for (let u = 0.07 + (r % 2) * step * 0.5; u < 0.95; u += step) { j++; const w1 = ((j * 37) % 11) / 11 - 0.5, w2 = ((j * 53) % 13) / 13 - 0.5, a = at(u + w1 * step * 0.5, rows[r]), b = at(u + w2 * step * 0.5, rows[r + 1]); net += `M${pt(...a)}L${pt(...b)}`; }
  out += `<path d="${net}" fill="none" stroke="${ink}" stroke-width="${r1(Math.max(0.5, 0.42 * s))}" stroke-linecap="round" opacity=".7"/>`;
  out += `<path d="${vd}" fill="none" stroke="${ink}" stroke-width="${r1(Math.max(0.7, 0.75 * s))}" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`;
  // its edge: the leading vein strong, the rest fine
  out += `<path d="${d0}" fill="none" stroke="${ink}" stroke-width="${r1(Math.max(0.8, 0.8 * s) + lw * 0.25)}" stroke-linejoin="round"/>`;
  out += `<path d="${line(-1, 0, 0.98)}" fill="none" stroke="${ink}" stroke-width="${r1(Math.max(1.4, 1.7 * s) + lw * 0.3)}" stroke-linecap="round"/>`;
  // the mark near its tip (in its colour), and at Celestial a gleam on it
  const m0 = at(0.8, -1), m1 = at(0.87, -1), m2 = at(0.87, -0.45), m3 = at(0.8, -0.45);
  out += `<path d="M${pt(...m0)}L${pt(...m1)}L${pt(...m2)}L${pt(...m3)}Z" fill="${cel ? L.c : L.b}" stroke="${ink}" stroke-width="${r1(Math.max(0.6, 0.5 * s))}"/>`;
  if (cel) { const q = at(0.55, -0.3); out += `<path d="${starPath5(q[0], q[1], 2.2 * s)}" fill="#FFFFFF" opacity=".9"/>`; }
  return out;
}
function legFold(x, y, fo, em) {
  if (!fo) return [x, y];
  const r = Math.hypot(x, y), e = Math.atan2(-y, -x), e2 = em + (e - em) * (1 - fo);
  return [-r * Math.cos(e2), -r * Math.sin(e2)];
}
function legWing(L, s, lw, fo, PT) {
  fo = fo || 0; const em = (LEG_MID[L.w] || 12) * Math.PI / 180;
  if (L.w === 'butterfly') return butterflyWing(L, s, lw, fo, PT);
  if (L.w === 'dragonfly') return dragonflyWing(L, s, lw, fo, PT);
  if (L.w === 'crystal') return crystalWing(L, s, lw, fo, PT);
  if (L.w === 'dragon') {
    const P = (x, y) => legFold(x * s, y * s, fo, em), R0 = P(0, 0), E = P(-12, -15), W = P(-24, -28), T = [P(-50, -40), P(-63, -19), P(-57, 2), P(-40, 15)], B = P(-8, 13);
    const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ctl = (a, b, k) => lerpP(lerpP(a, b, 0.5), W, k);
    const edge = [T[0], T[1], T[2], T[3], B];
    if (PT) { PT.push(E, W, ...edge); for (let i = 0; i < 4; i++) PT.push(ctl(edge[i], edge[i + 1], 0.3)); }
    let d = `M${pt(...R0)}Q${pt(...E)} ${pt(...W)}Q${pt(...lerpP(W, T[0], 0.5).map((v, i) => v + (i ? -3 * s : 0)))} ${pt(...T[0])}`;
    for (let i = 0; i < 4; i++) d += `Q${pt(...ctl(edge[i], edge[i + 1], 0.3))} ${pt(...edge[i + 1])}`;
    d += `Q${pt(...P(-3, 7))} ${pt(...R0)}Z`;
    let band = '';
    for (let i = 0; i < 4; i++) { const a = edge[i], b = edge[i + 1], a2 = lerpP(a, W, 0.2), b2 = lerpP(b, W, i === 3 ? 0.1 : 0.2); band += `M${pt(...a)}Q${pt(...ctl(a, b, 0.3))} ${pt(...b)}L${pt(...b2)}Q${pt(...ctl(a2, b2, 0.42))} ${pt(...a2)}Z`; }
    const hi = `M${pt(...lerpP(W, T[0], 0.08))}Q${pt(...lerpP(W, T[0], 0.5).map((v, i) => v + (i ? -2 * s : 0)))} ${pt(...lerpP(W, T[0], 0.92))}Q${pt(...lerpP(lerpP(W, T[0], 0.5), T[1], 0.32))} ${pt(...lerpP(W, T[1], 0.32))}Z`;
    const bones = `M${pt(...R0)}Q${pt(...E)} ${pt(...W)}Q${pt(...lerpP(W, T[0], 0.5).map((v, i) => v + (i ? -3 * s : 0)))} ${pt(...T[0])}` + T.slice(1).map(t => `M${pt(...W)}L${pt(...t)}`).join('');
    const clawAt = W, cw = Math.max(0.7, s);
    const claw = `M${pt(clawAt[0] - 2 * cw, clawAt[1] + 1 * cw)}Q${pt(clawAt[0] - 3 * cw, clawAt[1] - 7 * cw)} ${pt(clawAt[0] + 3 * cw, clawAt[1] - 10 * cw)}Q${pt(clawAt[0] + 0.5 * cw, clawAt[1] - 5 * cw)} ${pt(clawAt[0] + 2.5 * cw, clawAt[1] + 0.5 * cw)}Z`;
    const memb = L.a, deep = mixHex(L.a, '#2B2433', 0.2), lite = mixHex(L.a, '#FFFFFF', 0.45);
    return `<path d="${d}" fill="${memb}" stroke="${LINE}" stroke-width="${r1(lw * 1.25)}" stroke-linejoin="round"/><path d="${band}" fill="${deep}"/><path d="${hi}" fill="${lite}" opacity=".85"/>`
      + `<path d="${bones}" fill="none" stroke="${LINE}" stroke-width="${r1(Math.max(2.2, 3.2 * s) + lw * 0.7)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${bones}" fill="none" stroke="${L.b}" stroke-width="${r1(Math.max(1.1, 3.2 * s - lw * 0.3))}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${claw}" fill="#FFF7EA" stroke="${LINE}" stroke-width="${r1(lw * 0.8)}" stroke-linejoin="round"/>`;
  }
  // angel: the plane's x runs out from the body (left on the page), its y up
  const u = 6 * s, toS = (x, y) => legFold(-x * u, -y * u, fo, em);
  const shade = mixHex(mixHex(L.a, L.b, 0.3), '#2B2433', 0.08), cov = mixHex(L.a, '#FFFFFF', 0.4), cov2 = mixHex(L.a, '#FFFFFF', 0.72), tip0 = mixHex(L.b, '#2B2433', 0.14);
  let out = '';
  legFeathers().forEach(([x, y, a, len, w, row]) => {
    const d = [Math.cos(a), Math.sin(a)], nn = [-d[1], d[0]], at = (k, m) => toS(x + d[0] * len * k + nn[0] * w * m, y + d[1] * len * k + nn[1] * w * m);
    const fill = row === 0 ? shade : row === 1 ? L.a : row === 2 ? cov : cov2;
    const O = FEATHER.map(([k, m]) => at(k, m)); if (PT) PT.push(...O);
    out += `<path d="${smoothD(O)}" fill="${fill}" stroke="${LINE}" stroke-width="${r1(row < 2 ? lw : lw * 0.85)}" stroke-linejoin="round"/>`;
    if (row < 2) out += `<path d="${smoothD(FEATHER_TIP.map(([k, m]) => at(k, m)))}" fill="${row ? L.b : tip0}"/>`;
  });
  // a gleam along the arm, where the light catches it
  const g0 = toS(...legBone(0.08)), g1 = toS(...legBone(0.45)), g2 = toS(...legBone(0.8));
  out += `<path d="M${pt(g0[0], g0[1] + 1.5 * s)}Q${pt(g1[0], g1[1] + 1.5 * s)} ${pt(g2[0], g2[1] + 1.8 * s)}" fill="none" stroke="#FFFFFF" stroke-width="${r1(Math.max(1.2, 2.2 * s))}" stroke-linecap="round" opacity=".85"/>`;
  return out;
}
// the angles (degrees above level) a wing spans, seen from its root, past the part the body hides
function legRange(L, sc, sy) {
  const P = []; legWing(L, sc, 1, sy, P); let md = 0; P.forEach(p => { md = Math.max(md, Math.hypot(p[0], p[1])); });
  let lo = 999, hi = -999; P.forEach(p => { if (Math.hypot(p[0], p[1]) < md * LEG_CUT) return; const e = Math.atan2(-p[1], -p[0]) * 180 / Math.PI; lo = Math.min(lo, e); hi = Math.max(hi, e); });
  return [lo, hi, md];
}
/* the pairs fanned round one root so that none overlaps another: the second pair above the main one, the third below
   it, a gap between each; the extra pairs (and, for dragons, the main one a little) drawn folded until the fan fits
   between low at the side and just short of upright. (The inner part of each wing, where it meets the back, may
   cross the next: the body covers it.) up, down: how far the whole fan may beat up and down and still not cross the
   other side's wings over the head or sweep the floor */
let LEG_CUT = 0.5; const LEG_GAP = 9, LEG_TOP = 80, LEG_BOT = -66, legLayouts = {};
function legLayout(L, n) {
  const key = L.w + n + (L.w === 'butterfly' || L.w === 'dragonfly' || L.w === 'crystal' ? '|' + (L.sg || 7) + '|' + (L.v == null ? 0.5 : L.v) : ''); if (legLayouts[key]) return legLayouts[key];
  // (a butterfly's swallowtails tuck in below its great pair and behind it, each lower and smaller than the last,
  // their tails hanging free below; they lie under the great pair, so they may meet it)
  if (L.w === 'butterfly' && n > 1) {
    const B = legLayout(L, 1), rot = [B.rot[0]], mid = [B.mid[0]];
    const dy = [0];
    for (let i = 1; i < n; i++) { const q = legRange(Object.assign({}, L, { pi: i }), BF_PAIR_SC[i], 0), r = B.rot[0] - 24 - 15 * (i - 1); rot.push(r); mid.push(Math.round(r + (q[0] + q[1]) / 2)); dy.push(5 + 5 * (i - 1)); }
    return (legLayouts[key] = Object.assign({}, B, { rot, mid, dy, fo: 0, f4: 0 }));
  }
  const pref = L.w === 'dragon' ? 10 : L.w === 'butterfly' ? 9 : L.w === 'dragonfly' ? 12 : L.w === 'crystal' ? 12 : 16, f0 = L.w === 'dragon' && n > 1 ? 0.22 : 0, D4 = 7;
  let best = null;
  for (const fo of [0, 0.12, 0.22, 0.32, 0.42, 0.5, 0.56]) {
    const R = [legRange(L, 1, f0)]; for (let i = 1; i < n; i++) R.push(legRange(Object.assign({}, L, { pi: i }), LEG_PAIR_SC[i], i === 3 ? Math.min(0.6, fo + 0.15) : fo));
    const rot = [0];
    if (n > 1) rot[1] = R[0][1] + LEG_GAP - R[1][0];
    if (n > 2) rot[2] = R[0][0] - LEG_GAP - R[2][1];
    // the fourth, the smallest, below the third; it holds still, so the gap leaves room for the third's downstroke
    if (n > 3) rot[3] = rot[2] + R[2][0] - (LEG_GAP + D4) - R[3][1];
    const top = Math.max(...rot.map((r, i) => r + R[i][1])), bot = Math.min(...rot.map((r, i) => r + R[i][0]));
    const lo = (n > 3 ? -88 : LEG_BOT) - bot, hi = LEG_TOP - top, sh = lo <= hi ? clamp(pref, lo, hi) : (lo + hi) / 2;
    const bot3 = Math.min(...rot.slice(0, 3).map((r, i) => r + R[i][0]));
    best = { f0, fo: n > 1 ? fo : 0, f4: Math.min(0.6, fo + 0.15), rot: rot.map(r => Math.round(r + sh)), mid: rot.map((r, i) => Math.round(r + sh + (R[i][0] + R[i][1]) / 2)),
      up: Math.max(3, Math.round(88 - (top + sh))), down: n > 3 ? D4 : Math.max(3, Math.round(bot3 + sh + 72)) };
    if (lo <= hi && sh >= pref - 14) break;
  }
  return (legLayouts[key] = best);
}

function legAuraSVG(cy, Rr, sg, L, parts) {
  const n = [8, 8, 10, 10, 12, 12, 14, 16][Math.max(1, Math.min(7, sg))], r0 = Rr * 0.5, r1x = Rr * (1.06 + 0.06 * sg), w = 0.15 - sg * 0.007;
  const cA = L ? L.c : '#FFC21A', cB = L ? mixHex(L.c, '#FFFFFF', 0.35) : '#FFD54A', cE = L ? mixHex(L.c, '#FFFFFF', 0.7) : '#FFF2B8';
  let rays = '';
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, l = i % 2 ? r1x * 0.8 : r1x; rays += `<path d="M${pt(Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0)}L${pt(Math.cos(a) * l, cy + Math.sin(a) * l)}L${pt(Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0)}Z" fill="${i % 2 ? cB : cA}" stroke="${cE}" stroke-width=".8" opacity="${i % 2 ? 0.5 : 0.72}"/>`; }
  let out = `<g class="p-aura-ring">${rays}</g>`, still = '';
  if (sg >= 5) out += `<circle class="p-aura-ring" cx="0" cy="${r1(cy)}" r="${r1(Rr + 4)}" fill="none" stroke="${cB}" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round" opacity=".85"/>`;
  { const m = sg >= 6 ? 6 : sg >= 3 ? 4 : 3; for (let i = 0; i < m; i++) { const a = i / m * Math.PI * 2 + 0.6, r = Rr * (0.82 + (i % 2) * 0.16), x = Math.cos(a) * r, y = cy + Math.sin(a) * r, q = 3.4 + (i % 2) * 1.4; still += `<path d="M${pt(x, y - q * 1.6)}Q${pt(x, y)} ${pt(x + q, y)}Q${pt(x, y)} ${pt(x, y + q * 1.6)}Q${pt(x, y)} ${pt(x - q, y)}Q${pt(x, y)} ${pt(x, y - q * 1.6)}Z" fill="#FFFFFF" stroke="${cA}" stroke-width=".7" opacity=".95"/>`; } }
  // (parts: the turning rays and ring, and the still sparkles, apart, for the room's layers)
  if (parts) return { rot: out.replace(/ class="p-aura-ring"/g, ''), still };
  return out + still;
}
/* the glowing magic circle a Celestial Legendary floats over, in its light's colour: two layers, each turned by CSS
   (whole pictures turning, so a phone only moves them, never repaints them), the outer one way and the inner the
   other. Outer: a soft glow, two rings with a band of made-up runes between them and an eight-pointed star; inner:
   a ring of dots, a six-pointed star of two triangles and a small star at the heart */
/* or, for some, a ring under its feet instead of the whole circle (L.ring): smooth light, spiked metal, or its element.
   Each again two layers turning opposite ways (the ring, and a fainter inner ring), whole pictures */
const RING_SPIN = { circle: 1, light: 1.5, metal: 2.1, element: 2.2 };
const ringSpin = (style, el) => style === 'element' && el === 'fire' ? 3.2 : style === 'element' && (el === 'wind' || el === 'thunder') ? 2.8 : RING_SPIN[style] || 1;
function ringSVG(style, c, layer, el) {
  const P = (r, a) => pt(Math.cos(a) * r, Math.sin(a) * r), TAU2 = Math.PI * 2, ring = r => `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
  const S = (d, w, col, o, x) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"${x || ''}/>`;
  const F = (d, col, o, x) => `<path d="${d}" fill="${col}" opacity="${o}"${x || ''}/>`;
  const gid = 'rg' + (++SVGUID), hi = mixHex(c, '#FFFFFF', 0.6);
  const band = (ra, rb, col, o) => `<defs><radialGradient id="${gid}"><stop offset="${(ra / 100 * 0.9).toFixed(3)}" stop-color="${col}" stop-opacity="0"/><stop offset="${((ra + rb) / 200).toFixed(3)}" stop-color="${col}" stop-opacity="${o}"/><stop offset="${Math.min(1, rb / 100 * 1.02).toFixed(3)}" stop-color="${col}" stop-opacity="0"/></radialGradient></defs><circle r="99" fill="url(#${gid})"/>`;
  // a ring of shapes round the circle: fn(i, a) gives each one's path
  const round = (n, fn) => { let d = ''; for (let i = 0; i < n; i++) d += fn(i, i / n * TAU2); return d; };
  const blade = (rIn, rOut, a, wA, hook) => `M${P(rIn, a - wA)}Q${P((rIn + rOut) / 2, a - wA * 0.6 + hook)} ${P(rOut, a + hook)}Q${P((rIn + rOut) / 2, a + wA * 0.6 + hook * 0.4)} ${P(rIn, a + wA)}Z`;
  if (style === 'light') {
    // smooth light: a soft band of glow, a bright ring, three comets of light running round it
    if (layer === 'outer') { let arcs = ''; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU2; arcs += S(`M${P(86, a)}A86 86 0 0 1 ${P(86, a + 0.9)}`, 9, c, 0.35) + S(`M${P(86, a + 0.3)}A86 86 0 0 1 ${P(86, a + 0.9)}`, 3.4, '#FFFFFF', 0.9); }
      return band(70, 98, c, 0.32) + S(ring(86), 10, c, 0.16) + S(ring(86), 3, c, 0.95) + S(ring(86), 1.1, '#FFFFFF', 0.85) + arcs; }
    return S(ring(72), 1.4, hi, 0.55) + S(`M${P(72, 0.4)}A72 72 0 0 1 ${P(72, 1.4)}M${P(72, 3.5)}A72 72 0 0 1 ${P(72, 4.5)}`, 3, '#FFFFFF', 0.8);
  }
  if (style === 'metal') {
    // spiked metal: a ring of hooked blades round a grooved band, studs; inside, a thin toothed ring of the same
    const tones = [['#FFF1B8', '#E2B23C', '#8A5A14'], ['#F4F7FF', '#AEB8C8', '#4E5668'], ['#FFD8C0', '#C77B52', '#6A3218'], ['#C9C2E0', '#6E6890', '#2A2440']], T = tones[parseInt(c.slice(1, 3), 16) % 4];
    const mg = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T[0]}"/><stop offset=".5" stop-color="${T[1]}"/><stop offset="1" stop-color="${T[2]}"/></linearGradient></defs>`;
    if (layer === 'outer') {
      const n = 18, spikes = round(n, (i, a) => blade(80, i % 2 ? 93 : 99, a, 0.12, 0.08));
      const studs = round(12, (i, a) => `M${P(83, a)}m2.2 0a2.2 2.2 0 1 0 -4.4 0a2.2 2.2 0 1 0 4.4 0Z`);
      return mg + S(ring(84), 14, c, 0.16) + `<path d="${spikes}" fill="url(#${gid})" stroke="#2B2433" stroke-width="1.6" stroke-linejoin="round"/>`
        + `<path d="${ring(86)}${ring(76)}" fill="url(#${gid})" fill-rule="evenodd" stroke="#2B2433" stroke-width="1.8"/>` + S(ring(81), 1.2, T[2], 0.8) + S(ring(84.5), 0.8, T[0], 0.9) + F(studs, T[0], 1, ' stroke="#2B2433" stroke-width=".8"');
    }
    const teeth = round(24, (i, a) => `M${P(62, a - 0.06)}L${P(55, a)}L${P(62, a + 0.06)}Z`);
    return mg + S(ring(64), 8, c, 0.18) + `<path d="${ring(66)}${ring(61)}" fill="url(#${gid})" fill-rule="evenodd" stroke="#2B2433" stroke-width="1.2"/>` + F(teeth, `url(#${gid})`, 1, ' stroke="#2B2433" stroke-width=".8" stroke-linejoin="round"');
  }
  // its element
  const E = (typeof E8 !== 'undefined' && E8[el]) || { color: c, dark: '#2B2433' }, ec = E.color, ed = E.dark, eh = mixHex(ec, '#FFFFFF', 0.55);
  if (layer === 'inner') {
    // (the inner ring: a fainter echo in the element's colour, with a few motes)
    const motes = round(8, (i, a) => `M${P(64, a)}m${i % 2 ? 1.6 : 2.6} 0a${i % 2 ? 1.6 : 2.6} ${i % 2 ? 1.6 : 2.6} 0 1 0 ${i % 2 ? -3.2 : -5.2} 0a${i % 2 ? 1.6 : 2.6} ${i % 2 ? 1.6 : 2.6} 0 1 0 ${i % 2 ? 3.2 : 5.2} 0Z`);
    return S(ring(64), 7, ec, 0.14) + S(ring(64), 1.3, eh, 0.6) + F(motes, eh, 0.9);
  }
  const glow = band(66, 99, ec, 0.3) + S(ring(84), 12, ec, 0.14);
  switch (el) {
    case 'fire': { // tongues of flame licking round the ring, three colours deep
      const tongue = (rIn, rOut, a, w) => `M${P(rIn, a - w)}Q${P(rIn + (rOut - rIn) * 0.55, a - w * 0.9)} ${P(rOut, a + w * 1.5)}Q${P(rIn + (rOut - rIn) * 0.45, a + w * 0.2)} ${P(rIn, a + w)}Z`;
      return glow + F(round(16, (i, a) => tongue(74, i % 2 ? 94 : 99, a, 0.2)), '#FF6A1E', 0.95) + F(round(16, (i, a) => tongue(76, i % 2 ? 89 : 93, a + 0.03, 0.14)), '#FFB347', 0.95)
        + F(round(16, (i, a) => tongue(78, i % 2 ? 84 : 87, a + 0.05, 0.08)), '#FFF0A0', 0.95) + S(ring(77), 3, '#FFE37A', 0.9); }
    case 'ice': { // shards of ice, each with a bright facet
      const sh = round(14, (i, a) => `M${P(76, a - 0.1)}L${P(i % 2 ? 92 : 99, a)}L${P(76, a + 0.1)}L${P(72, a)}Z`), fac = round(14, (i, a) => `M${P(76, a - 0.1)}L${P(i % 2 ? 92 : 99, a)}L${P(77, a)}Z`);
      return glow + F(sh, ec, 0.95, ' stroke="#2F80B7" stroke-width="1.2" stroke-linejoin="round"') + F(fac, '#FFFFFF', 0.8) + S(ring(76), 2.4, '#FFFFFF', 0.85); }
    case 'water': { // a curling wave running round the ring, foam on its crests
      let wv = ''; for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU2, r = 84 + Math.sin(a * 8) * 6; wv += (i ? 'L' : 'M') + P(r, a); }
      const crests = round(8, (i, a) => `M${P(88, a + 0.12)}Q${P(96, a + 0.2)} ${P(91, a + 0.3)}`);
      return glow + S(wv + 'Z', 9, ec, 0.9) + S(wv + 'Z', 3, eh, 0.9) + S(crests, 2.6, '#FFFFFF', 0.95); }
    case 'thunder': { // a ring of lightning, crackling, a white core
      let zz = ''; for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU2, r = i % 2 ? 80 : 92; zz += (i ? 'L' : 'M') + P(r, a); }
      return glow + S(zz + 'Z', 8, ec, 0.4) + S(zz + 'Z', 3.2, ec, 0.95) + S(zz + 'Z', 1.2, '#FFFFFF', 0.95); }
    case 'wind': { // gusts: crescent swirls chasing round
      const gust = round(7, (i, a) => `M${P(78, a)}Q${P(98, a + 0.35)} ${P(84, a + 0.75)}Q${P(90, a + 0.35)} ${P(78, a)}Z`);
      return glow + F(gust, ec, 0.85) + S(round(7, (i, a) => `M${P(86, a + 0.12)}Q${P(94, a + 0.38)} ${P(85, a + 0.62)}`), 1.6, '#FFFFFF', 0.85) + S(ring(80), 1.4, eh, 0.7); }
    case 'earth': { // a ring of rocks, lit on one face
      const rk = round(13, (i, a) => { const r0 = 76, r1x = 92 + (i % 3) * 2.5, w = 0.2; return `M${P(r0, a - w)}L${P(r1x - 4, a - w * 0.9)}L${P(r1x, a - w * 0.1)}L${P(r1x - 3, a + w * 0.8)}L${P(r0, a + w)}Z`; });
      const lit = round(13, (i, a) => `M${P(80, a - 0.14)}L${P(88 + (i % 3) * 2, a - 0.1)}L${P(86, a)}Z`);
      return glow + F(rk, ec, 1, ` stroke="${ed}" stroke-width="1.6" stroke-linejoin="round"`) + F(lit, eh, 0.85) + S(ring(76), 2, ed, 0.8); }
    case 'dark': { // thorns of shadow, violet light between them
      const th = round(20, (i, a) => blade(78, i % 2 ? 90 : 98, a, 0.09, 0.14));
      return glow + F(th, '#2A1E4A', 0.95, ` stroke="${ec}" stroke-width="1.4" stroke-linejoin="round"`) + S(ring(78), 3, ec, 0.9) + S(ring(78), 1, '#FFFFFF', 0.6); }
    default: { // light: rays like a sun's, and stars between them
      const rays = round(16, (i, a) => `M${P(78, a - 0.07)}L${P(i % 2 ? 92 : 99, a)}L${P(78, a + 0.07)}Z`), stars = round(8, (i, a) => starPath5(Math.cos(a + 0.2) * 88, Math.sin(a + 0.2) * 88, 3.2));
      return glow + F(rays, ec, 0.9, ` stroke="${ed}" stroke-width=".8"`) + F(stars, '#FFFFFF', 0.95) + S(ring(78), 2.4, '#FFFFFF', 0.9); }
  }
}
function magicCircleSVG(c, layer, style, el) {
  if (style && style !== 'circle') return `<svg viewBox="-100 -100 200 200" aria-hidden="true">${ringSVG(style, c, layer, el)}</svg>`;
  const hi = mixHex(c, '#FFFFFF', 0.55), deep = mixHex(c, '#2B2433', 0.15), P = (r, a) => pt(Math.cos(a) * r, Math.sin(a) * r);
  const glowS = (d, w, col, o) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;
  const ring = r => `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
  let out = '';
  if (layer === 'outer') {
    const gid = 'mc' + (++SVGUID);
    let runes = '';
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, k = i % 4, ca = Math.cos(a), sa = Math.sin(a), at = (u, v) => pt(ca * (88 + v) - sa * u, sa * (88 + v) + ca * u);
      runes += k === 0 ? `M${at(0, -3.4)}L${at(0, 3.4)}M${at(-2.2, 0)}L${at(2.2, 0)}` : k === 1 ? `M${at(-2.6, 2.6)}L${at(0, -3)}L${at(2.6, 2.6)}` : k === 2 ? `M${at(-2.4, -2)}Q${at(0, 3.6)} ${at(2.4, -2)}M${at(0, -3.2)}L${at(0, -1)}` : `M${at(-1.8, -2.8)}L${at(1.8, -2.8)}L${at(-1.8, 2.8)}L${at(1.8, 2.8)}`;
    }
    let star = ''; for (let i = 0; i <= 8; i++) star += (i ? 'L' : 'M') + P(80, ((i * 3) % 8) / 8 * Math.PI * 2 - Math.PI / 2);
    let ticks = ''; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; ticks += `M${P(80, a)}L${P(i % 2 ? 77.5 : 75.5, a)}`; }
    out = `<defs><radialGradient id="${gid}"><stop offset=".35" stop-color="${c}" stop-opacity="0"/><stop offset=".8" stop-color="${c}" stop-opacity=".22"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><circle r="99" fill="url(#${gid})"/>` + glowS(ring(92), 12, c, 0.16) + glowS(ring(88), 18, c, 0.08) + glowS(star + 'Z', 7, c, 0.14)
      + glowS(ring(92), 2.6, c, 0.95) + glowS(ring(84), 1.5, c, 0.9) + glowS(ring(80), 1, hi, 0.8) + glowS(runes, 1.6, hi, 0.95) + glowS(ticks, 1, c, 0.7)
      + glowS(star + 'Z', 1.8, c, 0.95) + glowS(star + 'Z', 0.7, '#FFFFFF', 0.8);
  } else {
    let hex = ''; [0, 1].forEach(t => { for (let i = 0; i <= 3; i++) hex += (i ? 'L' : 'M') + P(46, (i / 3 + t / 6) * Math.PI * 2 - Math.PI / 2); hex += 'Z'; });
    let dots = ''; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; dots += `<circle cx="${r1(Math.cos(a) * 54)}" cy="${r1(Math.sin(a) * 54)}" r="${i % 3 ? 1.6 : 2.8}" fill="${i % 3 ? c : hi}"/>`; }
    out = glowS(hex, 7, c, 0.16) + glowS(ring(54), 1.4, c, 0.85) + glowS(ring(46), 1.2, deep, 0.5) + glowS(hex, 1.6, c, 0.95) + glowS(hex, 0.6, '#FFFFFF', 0.8) + dots
      + glowS(ring(16), 1.4, c, 0.9) + `<path d="${starPath5(0, 0, 9)}" fill="${hi}" opacity=".9"/><circle r="22" fill="${c}" opacity=".12"/>`;
  }
  return `<svg viewBox="-100 -100 200 200" aria-hidden="true">${out}</svg>`;
}
/* the magic circle for a canvas (the Tower): each layer a picture, made once for each colour and size (a few kept) */
const MC_IMG = new Map(), MC_CV = new Map();
function magicCircleCanvas(col, layer, px, style, el) {
  const ik = col + layer + (style || '') + (el || ''); let im = MC_IMG.get(ik);
  if (!im) { im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(magicCircleSVG(col, layer, style, el).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" ')); MC_IMG.set(ik, im); }
  if (!im.complete || !im.naturalWidth) return null;
  const q = Math.min(1400, Math.max(32, Math.round(Math.pow(1.08, Math.round(Math.log(Math.max(32, px)) / Math.log(1.08)))))), k = ik + '|' + q;
  let cv = MC_CV.get(k);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = cv.height = q; cv.getContext('2d').drawImage(im, 0, 0, q, q); MC_CV.set(k, cv);
    if (MC_CV.size > 8) { const k0 = MC_CV.keys().next().value, o = MC_CV.get(k0); MC_CV.delete(k0); o.width = o.height = 0; }
  }
  return cv;
}
/* a Legendary's light for a canvas (the Tower): one picture for each colour and size, a few kept; where its lights
   circle in the pet's own units (cy, Rr), from its shape, worked out once for each form */
const LL_IMG = new Map(), LL_CV = new Map(), LL_GEO = new WeakMap();
function legLightCanvas(col, px) {
  let im = LL_IMG.get(col);
  if (!im) { const one = `<defs><radialGradient id="g"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".4" stop-color="${mixHex(col, '#FFFFFF', 0.3)}" stop-opacity=".7"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs><circle r="15" fill="url(#g)"/><circle r="6" fill="${col}"/><circle r="6" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".9"/><circle cx="-1.2" cy="-1.2" r="2.6" fill="#FFFFFF"/>`;
    im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="-16 -16 32 32">${one}</svg>`); LL_IMG.set(col, im); }
  if (!im.complete || !im.naturalWidth) return null;
  const q = Math.min(256, Math.max(8, Math.round(Math.pow(1.1, Math.round(Math.log(Math.max(8, px)) / Math.log(1.1)))))), k = col + '|' + q;
  let cv = LL_CV.get(k);
  if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = q; cv.getContext('2d').drawImage(im, 0, 0, q, q); LL_CV.set(k, cv); if (LL_CV.size > 8) { const k0 = LL_CV.keys().next().value, o = LL_CV.get(k0); LL_CV.delete(k0); o.width = o.height = 0; } }
  return cv;
}
function legLightGeo(f) { let r = LL_GEO.get(f); if (!r) { const g = petGeom(f); r = { cy: g.Y(0.5), Rr: Math.max(g.bw, g.h * 0.5) + 16 }; LL_GEO.set(f, r); } return r; }
// (L: the pet's Legendary colours and ring; f: its form, for its element)
const legRingOf = (L, f) => ({ style: L.ring || 'circle', el: L.ring === 'element' && f ? e8Of(abilityElement(f.pal)) : '' });
const magicCircleHTML = (L, f) => { const R = legRingOf(L, f), k = ringSpin(R.style, R.el), du = k === 1 ? '' : x => ` style="animation-duration:${r1(x / k)}s"`;
  return `<div class="pet-circle${R.style === 'circle' ? '' : ' pet-ring'}"><div class="mc-tilt"><div class="mc-spin mc-a"${du ? du(28) : ''}>${magicCircleSVG(L.c, 'outer', R.style, R.el)}</div><div class="mc-spin mc-b"${du ? du(16) : ''}>${magicCircleSVG(L.c, 'inner', R.style, R.el)}</div></div></div>`; };
// where a light is on its tilted ring at angle a, and which way it is moving (degrees)
// (ring 1: Celestial's two more, swirling the other way round a smaller ring tilted against the first, a little higher)
function legLightAt(a, cy, Rr, ring) {
  const R = ring ? Rr * 0.86 : Rr, tl = ring ? -0.2 : 0.16, c0 = ring ? cy - Rr * 0.12 : cy;
  const x = Math.cos(a) * R, y = c0 + Math.sin(a) * R * 0.32 - Math.cos(a) * R * tl;
  const dx = -Math.sin(a) * R, dy = Math.cos(a) * R * 0.32 + Math.sin(a) * R * tl, s = ring ? -1 : 1;
  return [x, y, Math.atan2(dy * s, dx * s) * 180 / Math.PI, Math.sin(a) > 0];
}
// where light i (of n) is at time t: the first two on the main ring, the next two swirling the other way, faster
const legLightPhase = (i, t) => i < 2 ? t * 1.6 + 0.6 + i * Math.PI : -t * 2.3 + 2.2 + (i - 2) * Math.PI;
/* ---------- the whole pet ----------
   petSVG(form, {eyes, mouth, brows, cheeks, cls, scale, dirt, static, frame:'room'|'fit', px}) */
function petSVG(f, o) {
  o = o || {};
  const id = 'pp' + (++SVGUID);
  const R = mulberry32(f.seed || 1);
  const g = petGeom(f);
  const pal = f.pal, X = f.x || {}, k = g.k;
  const gemKey = f.stage >= 2 ? STAGE_GEM[f.stage] : null;
  // (a golden Legendary's crystal parts, orbs and armour are gold)
  const LG = X.gold ? (X.leg || { w: 'angel', a: '#FFF4CF', b: '#FFC93C', c: '#FFD447' }) : null;
  const crys = LG ? LG.b : gemKey ? GEMS[gemKey].color : pal.sec;
  const F = pal.grad ? `url(#${id}g)` : pal.base;
  const body = furPath(g, f.body.fur, R);
  let defs = `<clipPath id="${id}c"><path d="${body}"/></clipPath>`;
  if (pal.grad) defs += `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">${pal.grad.map((c, i) => `<stop offset="${(i / (pal.grad.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  if (X.aura && !o.lite) { const A = { glow: ['#FFFFFF', '#C9B8FF'], flame: ['#FFE9A8', '#FF8A3D'], stars: ['#FFFFFF', '#9DB4E8'], gold: LG ? [mixHex(LG.c, '#FFFFFF', 0.7), LG.c] : ['#FFF4C2', '#FFB81C'] }[X.aura]; defs += `<radialGradient id="${id}a"><stop offset="0" stop-color="${A[0]}" stop-opacity=".9"/><stop offset=".5" stop-color="${A[1]}" stop-opacity=".42"/><stop offset="1" stop-color="${A[1]}" stop-opacity="0"/></radialGradient>`; }
  if (X.orbs && !o.lite) defs += `<radialGradient id="${id}o"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="${crys}" stop-opacity=".9"/><stop offset="1" stop-color="${crys}" stop-opacity="0"/></radialGradient>`;
  if (X.armor || X.pauldrons) defs += `<linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${LG ? mixHex(LG.c, '#FFFFFF', 0.65) : '#F4F8FF'}"/><stop offset="1" stop-color="${LG ? LG.b : '#A9B6CC'}"/></linearGradient>`;
  if (!o.flat) {
    const lr = Math.max(g.bw, g.h * 0.5) * 1.55;
    defs += `<radialGradient id="${id}sh" gradientUnits="userSpaceOnUse" cx="${r1(-g.bw * 0.32)}" cy="${r1(g.Y(0.74))}" r="${r1(lr)}"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".26"/><stop offset=".42" stop-color="#FFFFFF" stop-opacity="0"/><stop offset=".74" stop-color="${pal.dk}" stop-opacity="0"/><stop offset="1" stop-color="${pal.dk}" stop-opacity=".28"/></radialGradient>`;
    // the cel band: everything in the body that is not also inside the body nudged toward the light
    const dx = 5.5 * k, dy = 6.5 * k;
    defs += `<mask id="${id}k" maskUnits="userSpaceOnUse" x="-160" y="-320" width="320" height="380"><rect x="-160" y="-320" width="320" height="380" fill="#FFFFFF"/><path d="${g.path}" transform="translate(${r1(-dx)} ${r1(-dy)})" fill="#000000"/></mask>`;
    defs += `<radialGradient id="${id}ir" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".35" stop-color="${pal.iris}" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".35"/></radialGradient>`;
  }
  // bounds, so big features still fit the frame
  let minX = -g.bw * 1.1, maxX = g.bw * 1.1, minY = g.top;
  const grow = (x, y) => { if (x < minX) minX = x; if (-x < minX) minX = -x; if (x > maxX) maxX = x; if (-x > maxX) maxX = -x; if (y < minY) minY = y; };
  // a Legendary's wings and lights are not counted when the pet is fitted to the room's frame (they spread past it, so
  // it is not drawn smaller as they grow), only when a picture is framed to show all of it
  let wMinX = 0, wMaxX = 0, wMinY = 0;
  const growW = LG ? (x, y) => { wMinX = Math.min(wMinX, x, -x); wMaxX = Math.max(wMaxX, x, -x); wMinY = Math.min(wMinY, y); } : grow;
  // split (the room): a Legendary's aura, wings and lights are left out of the picture and handed back as layers of
  // their own (petSVG.split), which the browser turns and moves without painting them again
  // rig (the Tower): the pet in parts, so the game can move them: its feet, its arms and its wings left out of the
  // picture and handed back on their own (petSVG.rig), the picture itself in two (what lies behind the body, and the rest)
  const rig = !!o.rig, RG = rig ? {} : null;
  const split = !!(LG && (o.split || rig) && (!o.lite || rig)), SP = split ?  { aura: null, wings: [], lights: null, flap: null } : null;

  let back = '';
  if (X.aura && !o.lite) {
    const cy = g.Y(0.55), Rr = Math.max(g.bw, g.h * 0.5) + 20;
    const ringC = { glow: '#FFFFFF', flame: '#FFB35C', stars: '#FFE37A', gold: LG ? LG.c : '#FFD54A' }[X.aura];
    // a golden Legendary's aura is a sunburst, more rays and longer, and a second ring and sparkles, as it grows
    const ringE = `cx="0" cy="${r1(cy)}" r="${r1(Rr - 9)}" fill="none" stroke="${ringC}" stroke-width="2" stroke-dasharray="${X.aura === 'flame' ? '3 8' : '9 12'}" stroke-linecap="round" opacity=".55"/>`;
    if (split && X.aura === 'gold') {
      const A = legAuraSVG(cy, Rr, f.stage || 1, LG, true), gA = mixHex(LG.c, '#FFFFFF', 0.7);
      SP.aura = { cy, Rr, R1: Rr * (1.06 + 0.06 * (f.stage || 1)) + 6, rot: A.rot, still: A.still, ring: `<circle ${ringE}`, glowDef: `<radialGradient id="${id}aL"><stop offset="0" stop-color="${gA}" stop-opacity=".9"/><stop offset=".5" stop-color="${LG.c}" stop-opacity=".42"/><stop offset="1" stop-color="${LG.c}" stop-opacity="0"/></radialGradient>`, glow: `<circle cx="0" cy="${r1(cy)}" r="${r1(Rr)}" fill="url(#${id}aL)"/>` };
    } else {
      if (X.aura === 'gold') back += legAuraSVG(cy, Rr, f.stage || 1, LG);
      back += `<circle class="p-aura" cx="0" cy="${r1(cy)}" r="${r1(Rr)}" fill="url(#${id}a)"/>`;
      back += `<circle class="p-aura-ring" ${ringE}`;
    }
    if (X.aura === 'stars') for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.4; back += `<path d="${starPath5(Math.cos(a) * (Rr - 6), cy + Math.sin(a) * (Rr - 6), 3.2)}" fill="#FFE37A"/>`; }
    if (X.aura === 'flame') for (let i = 0; i < 5; i++) { const a = Math.PI + (i - 2) * 0.5; back += `<g opacity=".8">${flameShape(Math.cos(a) * (Rr - 8), cy + Math.sin(a) * (Rr - 8) * 0.9 + 8, 0.5 + (i % 2) * 0.18)}</g>`; }
  }
  if (X.mane === 'lion') back += lionManeSVG(g, f);
  if (X.wings && LG) {
    // a Legendary's wings: each pair drawn once (shown by <use> on both sides), fanned round one root so that they never
    // overlap; each pair beats on its own, a moment after the main one (see legFlap)
    // (a butterfly's great pair comes on smaller while young and opens out at Celestial)
    const sg = clamp(f.stage || 1, 1, 7), LGs = Object.assign({}, LG, { sg }), n = clamp(X.wings.n || 1, 1, 4), s = LEG_DRAW[sg] * k * (1 + 0.6 * (clamp(g.bw / 40, 1, 1.5) - 1)) * (LG.w === 'butterfly' ? [1, 0.82, 0.8, 0.78, 0.76, 0.74, 0.74, 0.8][sg] : 1), x0 = g.wx * 1.2, y0 = g.wy - 4 * k, LY = legLayout(LGs, n);
    const lag = [0, 0.28, 0.28, 0.28];
    let side = '';
    for (let i = n - 1; i >= 0; i--) {
      // (a butterfly's swallowtails come in small at Guardian and open out to nearly the great pair's size at Celestial)
      const si = s * (LG.w === 'butterfly' ? BF_PAIR_SC : LEG_PAIR_SC)[i] * (LG.w === 'butterfly' && i && sg < 7 ? 0.72 : 1), rot = LY.rot[i];
      // (the pairs behind are a little paler, so each reads apart from the one in front)
      const Li = i ? Object.assign({}, LGs, { a: mixHex(LG.a, '#FFFFFF', 0.1 + 0.08 * i), b: mixHex(LG.b, '#FFFFFF', 0.12 + 0.1 * i), pi: i }) : LGs;
      const PT = [], WG = legWing(Li, si, i ? 1.2 + (i < 3 ? 0.1 : 0) : 1.7, i === 3 ? LY.f4 : i ? LY.fo : LY.f0, PT);
      // (a butterfly's swallowtails hang from lower on its back: dy, in the picture's units)
      const y0i = y0 + (LY.dy ? LY.dy[i] * k : 0), WI = { x0, y0: y0i, rot, mid: LY.mid[i], lag: lag[i], k: i === 3 ? 0.35 : 1, g: WG, bb: [1e9, 1e9, -1e9, -1e9] };
      if (split) SP.wings.push(WI); else defs += `<g id="${id}w${i}">${WG}</g>`;
      // (the fourth pair holds still: it has no beat)
      // (the fourth pair beats too, gently: in time with the third, at a third of its swing, so it never meets it)
      side += `<g class="p-wp" data-lag="${lag[i]}" data-k="${i === 3 ? 0.35 : 1}" data-mid="${LY.mid[i]}" data-pivot="${pt(x0, y0i)}"><g transform="translate(${pt(x0, y0i)}) rotate(${rot})"><use href="#${id}w${i}"/></g></g>`;
      // bounds: the wing's outline, turned into place (and a little for its beat)
      const c = Math.cos(rot * Math.PI / 180), sn = Math.sin(rot * Math.PI / 180);
      PT.forEach(([x, y]) => { const X2 = x0 + x * c - y * sn, Y2 = y0i + x * sn + y * c; growW(X2 - 3, Y2 - 5); const B = WI.bb; B[0] = Math.min(B[0], X2); B[1] = Math.min(B[1], Y2); B[2] = Math.max(B[2], X2); B[3] = Math.max(B[3], Y2); });
    }
    if (split) { SP.flap = [LY.up, LY.down]; SP.beat = legBeat(LG); }
    else back += `<g class="p-wings" data-flap="${LY.up} ${LY.down}" data-beat="${legBeat(LG).join(' ')}">${side}<g transform="scale(-1 1)">${side}</g></g>`;
  } else if (X.wings) {
    const W = X.wings, s = (W.size || 1) * k, t2 = X.wings2 || W.t, wy = g.wy;
    let L = `<g transform="translate(${pt(g.wx, wy)})">${wingShape(W.t, s, f, crys)}</g>`;
    if (W.n >= 2) L = `<g transform="translate(${pt(g.wx * 0.9, wy + 15 * k)}) rotate(24)">${wingShape(t2, s * 0.62, f, crys)}</g>` + L;
    if (W.n >= 3) L = `<g transform="translate(${pt(g.wx * 1.1, wy - 13 * k)}) rotate(-22)">${wingShape(W.t, s * 0.46, f, crys)}</g>` + L;
    if (rig) { RG.wing = L; RG.wingPv = [g.wx, g.wy]; } else back += `<g class="p-wing-l" data-pivot="${pt(g.wx, g.wy)}">${L}</g><g transform="scale(-1 1)"><g class="p-wing-r" data-pivot="${pt(g.wx, g.wy)}">${L}</g></g>`;
    grow(g.wx - 56 * s, wy - 32 * s - (W.n >= 3 ? 14 * k : 0));
  }
  // a Legendary's two lights circle it on a tilted ring, passing behind it and in front (both layers hold both lights;
  // the room shows each in one layer at a time)
  let lightsF = '';
  if (LG && X.lights && !o.lite) {
    const cy = g.Y(0.5), Rr = Math.max(g.bw, g.h * 0.5) + 16;
    defs += `<radialGradient id="${id}l"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".4" stop-color="${mixHex(LG.c, '#FFFFFF', 0.3)}" stop-opacity=".7"/><stop offset="1" stop-color="${LG.c}" stop-opacity="0"/></radialGradient>`;
    const one = `<circle r="15" fill="url(#${id}l)"/><path d="M0 -4.6Q-16 -2.4 -31 0Q-16 2.4 0 4.6Z" fill="${LG.c}" opacity=".55"/><circle r="6" fill="${LG.c}"/><circle r="6" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".9"/><circle cx="-1.2" cy="-1.2" r="2.6" fill="#FFFFFF"/>`;
    const NL = X.lights >= 4 ? 4 : 2, small = `<g transform="scale(.78)">${one}</g>`;
    const layer = fr => Array.from({ length: NL }, (_, i) => { const [x, y, d, isF] = legLightAt(legLightPhase(i, 0), cy, Rr, i >= 2 ? 1 : 0); return `<g transform="translate(${pt(x, y)}) rotate(${Math.round(d)})"${isF === fr ? '' : ' opacity="0"'}>${i >= 2 ? small : one}</g>`; }).join('');
    if (split) SP.lights = { cy, Rr, n: NL, one: one.replace(`url(#${id}l)`, 'url(#LID)'), def: `<radialGradient id="LID"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".4" stop-color="${mixHex(LG.c, '#FFFFFF', 0.3)}" stop-opacity=".7"/><stop offset="1" stop-color="${LG.c}" stop-opacity="0"/></radialGradient>` };
    else { back += `<g class="p-lights p-lights-b" data-orbit="${pt(0, cy)} ${r1(Rr)}">${layer(false)}</g>`; lightsF = `<g class="p-lights p-lights-f">${layer(true)}</g>`; }
    growW(Rr + 16, cy - Rr * 0.5 - 16);
  }
  if (f.tail.t !== 'none') {
    const T = f.tail, s = (T.size || 1) * k, shape = tailShape(T.t, s, F, f, crys);
    const angs = T.n === 3 ? [-24, 0, 24] : T.n === 2 ? [-14, 14] : [0];
    back += `<g class="p-tail" data-pivot="${pt(g.tx, g.ty)}">${angs.map(a => `<g transform="translate(${pt(g.tx, g.ty)}) rotate(${a})">${shape}</g>`).join('')}</g>`;
    grow(g.tx - 46 * s, g.ty - 54 * s);
  }
  if (X.spikes) {
    const c0 = g.Y(0.5);
    let L = '';
    [62, 86, 110].forEach((a, i) => {
      const [x, y] = rayHit(g.poly, 0, c0, a), sz = (i === 1 ? 1 : 0.8) * k;
      L += `<g transform="translate(${pt(x + Math.sin(a * Math.PI / 180) * 3, y + Math.cos(a * Math.PI / 180) * 3)}) rotate(${r1(-a)})"><path d="M${pt(-6 * sz, 4)}L0 ${r1(-15 * sz)}L${pt(6 * sz, 4)}Z" fill="${pal.sec}" ${OL2}/></g>`;
    });
    back += L + `<g transform="scale(-1 1)">${L}</g>`;
  }
  if (X.crest) {
    const c = X.crest;
    [-34, -17, 0, 17, 34].forEach((a, i) => {
      const [x, y] = rayHit(g.poly, 0, g.headC[1], a);
      const sz = (c.size || 1) * (i === 2 ? 1 : i === 1 || i === 3 ? 0.85 : 0.68) * k;
      let shape;
      if (c.t === 'feather') shape = `<path d="M${pt(-4 * sz, 4)}Q${pt(-6 * sz, -14 * sz)} ${pt(0, -20 * sz)}Q${pt(6 * sz, -14 * sz)} ${pt(4 * sz, 4)}Z" fill="${pal.sec}" ${OL2}/>`;
      else if (c.t === 'flame') shape = flameShape(0, -2 * sz, sz * 0.9);
      else shape = `<path d="M${pt(-6 * sz, 4)}L0 ${r1(-16 * sz)}L${pt(6 * sz, 4)}Z" fill="${pal.sec}" ${OL2}/>`;
      back += `<g transform="translate(${pt(x, y)}) rotate(${r1(-a)})">${shape}</g>`;
      grow(x, y - 20 * sz);
    });
  }
  if (f.ears.t !== 'none') {
    const E = f.ears, P = EAR_PLACE[E.t] || [40, 0, 3];
    const [x0, y0] = rayHit(g.poly, 0, g.headC[1], P[0]);
    const a = P[0] * Math.PI / 180, inset = P[2] * k, s = (E.size || 1) * k;
    const ax = x0 + Math.sin(a) * inset, ay = y0 + Math.cos(a) * inset;
    const rot = E.t === 'lop' ? 0 : -(P[0] * 0.55 + P[1]);
    const inner = `<g transform="translate(${pt(ax, ay)}) rotate(${r1(rot)})">${earShape(E.t, s, F, f, crys)}</g>`;
    back += `<g class="p-ear p-ear-l" data-pivot="${pt(ax, ay)}">${inner}</g><g transform="scale(-1 1)"><g class="p-ear p-ear-r" data-pivot="${pt(ax, ay)}">${inner}</g></g>`;
    const ra = rot * Math.PI / 180, H = (EAR_H[E.t] || 20) * s;
    grow(ax + Math.sin(ra) * H - 8 * s, ay - Math.cos(ra) * H);
  }
  if (X.bud) {
    const [x0, y0] = rayHit(g.poly, 0, g.headC[1], 24);
    const L = `<g transform="translate(${pt(x0 + 1, y0 + 2)}) rotate(-14)"><path d="M${pt(-5 * k, 4)}L0 ${r1(-9 * k)}L${pt(5 * k, 4)}Z" fill="#FFF3D9" ${OL2}/></g>`;
    back += L + `<g transform="scale(-1 1)">${L}</g>`;
  }
  if (X.horns2 && X.horns) {
    const H2 = X.horns2, s = (H2.size || 0.75) * k;
    const P = HORN_PLACE[H2.t] || [24, 4];
    const ang = Math.min(70, P[0] + 18);
    const [x0, y0] = rayHit(g.poly, 0, g.headC[1], ang);
    const a = ang * Math.PI / 180, x = x0 + Math.sin(a) * 3 * k, y = y0 + Math.cos(a) * 3 * k;
    const rot = -(ang * 0.6 + P[1]) - 8;
    const L = `<g transform="translate(${pt(x, y)}) rotate(${r1(rot)})">${hornShape(H2.t, s, crys)}</g>`;
    back += L + `<g transform="scale(-1 1)">${L}</g>`;
    const ra = rot * Math.PI / 180, H = (HORN_H[H2.t] || 24) * s;
    grow(x + Math.sin(ra) * H - 10 * s, y - Math.cos(ra) * H);
  }
  if (X.horns) {
    const Hn = X.horns, s = (Hn.size || 1) * k;
    if (Hn.t === 'uni') {
      const [x, y] = rayHit(g.poly, 0, g.headC[1], 0);
      back += `<g transform="translate(${pt(x, y + 4 * k)})">${hornShape('uni', s, crys)}</g>`;
      grow(0, y - 36 * s);
    } else {
      const P = HORN_PLACE[Hn.t] || [24, 4];
      const [x0, y0] = rayHit(g.poly, 0, g.headC[1], P[0]);
      const a = P[0] * Math.PI / 180, x = x0 + Math.sin(a) * 3 * k, y = y0 + Math.cos(a) * 3 * k;
      const rot = -(P[0] * 0.6 + P[1]);
      const L = `<g transform="translate(${pt(x, y)}) rotate(${r1(rot)})">${hornShape(Hn.t, s, crys)}</g>`;
      back += L + `<g transform="scale(-1 1)">${L}</g>`;
      const ra = rot * Math.PI / 180, H = (HORN_H[Hn.t] || 24) * s;
      grow(x + Math.sin(ra) * H - (Hn.t === 'bull' || Hn.t === 'ram' ? 24 * s : 8 * s), y - Math.cos(ra) * H);
    }
  }
  if (X.top) { back += topSVG(X.top, g, F); grow(10, g.top - 17); }
  const footC = f.pattern === 'socks' ? pal.sec : pal.dk;
  const leg = legShape(f, g, F, footC);
  if (rig) RG.foot = leg; else back += `<g class="p-foot p-foot-l">${leg}</g><g class="p-foot p-foot-r"><g transform="scale(-1 1)">${leg}</g></g>`;

  // body, markings and dirt
  let clip = patternSVG(f.pattern, g, f, R);
  if (pal.stars) {
    for (let i = 0; i < 14; i++) clip += `<circle cx="${r1((R() * 2 - 1) * g.bw)}" cy="${r1(g.top + R() * (g.yb - g.top))}" r="${r1(0.8 + R() * 1.2)}" fill="#FFFFFF" opacity="${r1(0.6 + R() * 0.4)}"/>`;
    clip += `<ellipse cx="${r1(g.bw * 0.4)}" cy="${r1(g.Y(0.7))}" rx="18" ry="10" fill="${pal.sec}" opacity=".35"/><ellipse cx="${r1(-g.bw * 0.5)}" cy="${r1(g.Y(0.3))}" rx="14" ry="9" fill="#7FD3F2" opacity=".3"/>`;
  }
  clip += bellySVG(f.body.belly, g, f);
  if (f.body.fur === 'scaly') clip += scalesSVG(g, f);
  if (X.marks) clip += marksSVG(X.marks, g, crys);
  const dirt = clamp(o.dirt || 0, 0, 1);
  if (!o.flat) {
    clip += `<rect x="-160" y="-320" width="320" height="380" fill="url(#${id}sh)"/>`;
    clip += `<rect x="-160" y="-320" width="320" height="380" fill="${pal.dk}" opacity=".17" mask="url(#${id}k)"/>`;
    // the chin and neck sit in the head's shadow
    const ny = g.blob ? g.Y(g.fF - 0.26) : g.Y(g.neckF + 0.04), nw = g.halfW(g.blob ? g.fF - 0.26 : g.neckF + 0.04);
    if (g.blob) clip += `<ellipse cx="0" cy="${r1(ny)}" rx="${r1(nw * 0.78)}" ry="${r1(5 * k)}" fill="${pal.dk}" opacity=".12"/>`;
    else clip += `<ellipse cx="0" cy="${r1(ny)}" rx="${r1(nw * 1.1)}" ry="${r1(6 * k)}" fill="${pal.dk}" opacity=".2"/>`;
  }
  clip += `<g class="p-dirt" opacity="${dirt.toFixed(2)}">${[[-0.45, 0.25, 9, 6], [0.38, 0.75, 7, 5], [0.55, 0.15, 6, 4], [-0.6, 0.55, 4.5, 4.5], [0.1, 0.08, 3.5, 3.5]].map(([a, b2, rx, ry]) => `<ellipse cx="${r1(a * g.bw)}" cy="${r1(g.Y(b2))}" rx="${rx}" ry="${ry}" fill="#7A5A36" opacity=".6"/>`).join('')}</g>`;
  let front = `<path d="${body}" fill="${F}"/><g clip-path="url(#${id}c)">${clip}</g><path d="${body}" fill="none" ${OL}/>`;
  const sx = -g.hw * 0.5, sy = g.Y(0.86);
  front += `<ellipse cx="${r1(sx)}" cy="${r1(sy)}" rx="${r1(9 * k)}" ry="${r1(5.5 * k)}" fill="#FFFFFF" opacity="${pal.shine || f.body.fur === 'sleek' || f.body.fur === 'slime' ? 0.8 : 0.5}" transform="rotate(-32 ${r1(sx)} ${r1(sy)})"/><circle cx="${r1(sx + 11 * k)}" cy="${r1(sy + 5 * k)}" r="${r1(2.4 * k)}" fill="#FFFFFF" opacity=".5"/>`;
  if (f.body.fur === 'sleek') front += `<path d="M${pt(-g.hw * 0.72, g.Y(0.62))}Q${pt(-g.hw * 0.8, g.Y(0.4))} ${pt(-g.bw * 0.66, g.Y(0.22))}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
  if (f.body.fur === 'slime') front += [-0.5, 0.12, 0.58].map(a => { const x = a * g.bw; return `<path d="M${pt(x - 4, g.yb - 2)}Q${pt(x - 4, g.yb + 8)} ${pt(x, g.yb + 9)}Q${pt(x + 4, g.yb + 8)} ${pt(x + 4, g.yb - 2)}Z" fill="${F}" ${OL2}/>`; }).join('');
  if (X.mane === 'ruff') front += ruffSVG(g, f);
  if (X.armor) front += armorSVG(g, f, crys, id);
  if (X.pauldrons) front += pauldronSVG(g, crys, id, X.armor ? 1 : 0);
  if (f.arms.t !== 'none') {
    const s = (f.arms.size || 1) * k;
    const inner = `<g transform="translate(${pt(g.ax, g.ay)})">${armShape(f.arms.t, s, F, f, crys)}</g>`;
    if (rig) { RG.arm = inner; RG.armPv = [g.ax, g.ay]; } else front += `<g class="p-arm p-arm-l" data-pivot="${pt(g.ax, g.ay)}">${inner}</g><g transform="scale(-1 1)"><g class="p-arm p-arm-r" data-pivot="${pt(g.ax, g.ay)}">${inner}</g></g>`;
  }
  front += faceSVG(f, g, o.flat ? o : Object.assign({}, o, { irisG: id + 'ir' }));
  // a Legendary wears a jewel of its light on its brow (its stage's gem moves to its chest)
  if (LG) front += gemMarkSVG(LG.c, 0, g.ey - g.er * 1.15 - 9 * k, k * 1.15) + `<circle cx="${r1(-2 * k)}" cy="${r1(g.ey - g.er * 1.15 - 11 * k)}" r="${r1(1.2 * k)}" fill="#FFFFFF"/>`;
  if (gemKey && X.gem) {
    const c = GEMS[gemKey].color;
    if (X.gem === 'head' && !LG && f.eyes.t !== 'triple' && f.eyes.t !== 'quad') front += gemMarkSVG(c, 0, g.ey - g.er * 1.15 - 9 * k, k);
    // (on the chest: low enough to keep clear of the mouth, down on the belly if need be, and never off the body)
    else front += gemMarkSVG(c, 0, Math.min(Math.max(g.bellyY - g.bellyRY * 0.25, g.my + 17 * k), g.yb - 10 * k), k);
  }
  if (X.halo) { front += haloSVG(X.halo, g); grow(24, g.top - 36); }
  if (X.orbs && !o.lite) {
    const cy = g.Y(0.5), Rr = Math.max(g.bw, g.h * 0.5) + 9;
    const n = clamp(Math.round(X.orbs) || 3, 3, 6), orr = n > 3 ? 5.5 : 6.5;
    front += `<g class="p-orbs" data-orbit="${pt(0, cy)} ${r1(Rr)}">${Array.from({ length: n }, (_, i) => { const a = i * Math.PI * 2 / n; return `<g transform="translate(${pt(Math.cos(a) * Rr, cy + Math.sin(a) * Rr * 0.5)})"><circle r="${orr}" fill="url(#${id}o)"/><circle r="${r1(orr * 0.37)}" fill="#FFFFFF"/></g>`; }).join('')}</g>`;
    grow(Rr + 7, cy - Rr * 0.5 - 7);
  }
  front += lightsF;

  let inner = back + front;
  let fit = 1;
  // (a Legendary is never drawn smaller to fit the room's frame: what reaches past it spreads past it)
  if (o.frame !== 'fit' && minY < -165 && !LG) fit = Math.min(fit, 165 / -minY);
  const mx = Math.max(-minX, maxX);
  if (o.frame !== 'fit' && mx > 100 && !LG) fit = Math.min(fit, 100 / mx);
  const sc = (o.scale || 1) * fit;
  if (Math.abs(sc - 1) > 0.001) inner = `<g transform="scale(${(Math.round(sc * 1000) / 1000)})">${inner}</g>`;
  let vb = '-75 -150 150 150';
  if (o.frame === 'fit') {
    minX = Math.min(minX, wMinX); maxX = Math.max(maxX, wMaxX); minY = Math.min(minY, wMinY);
    const mx = Math.max(-minX, maxX);
    const top = Math.min(minY, X.aura && !o.lite ? g.Y(0.55) - Math.max(g.bw, g.h * 0.5) - 20 : minY) * sc - 6;
    const half = Math.max(mx * sc + 6, (4 - top) / 2);
    const size = Math.max(2 * half, 4 - top);
    vb = `${r1(-size / 2)} ${r1(4 - size)} ${r1(size)} ${r1(size)}`;
  }
  const attrs = o.static ? '' : ` data-eyes="${o.eyes || 'normal'}" data-mouth="${o.mouth || 'smile'}" data-brows="${o.brows || 'none'}" data-cheeks="${o.cheeks || 'normal'}"`;
  const size = o.px ? ` width="${o.px}" height="${o.px}"` : '';
  let svg = `<svg${o.static ? ' xmlns="http://www.w3.org/2000/svg"' : ''} class="${o.cls || 'pet-svg'}" viewBox="${vb}"${size} aria-hidden="true" focusable="false"${attrs}><defs>${defs}</defs>${inner}</svg>`;
  if (o.static) svg = svg.replace(/var\(--pet-line\)/g, '#2B2433');
  petSVG.split = split ? { vb, sc, SP, id } : null;
  if (rig) {
    const S2 = Math.round(sc * 1000) / 1000, wrapS = x => Math.abs(sc - 1) > 0.001 ? `<g transform="scale(${S2})">${x}</g>` : x, fix = x => o.static ? x.replace(/var\(--pet-line\)/g, '#2B2433') : x;
    petSVG.rig = { vb: vb.split(' ').map(Number), sc, defs: fix(defs), back: fix(wrapS(back)), front: fix(wrapS(front)), foot: RG.foot && fix(wrapS(RG.foot)), footPv: [-g.lx, -6],
      arm: RG.arm && fix(wrapS(RG.arm)), armPv: RG.armPv && RG.armPv.map(v => v * sc), wing: RG.wing && fix(wrapS(RG.wing)), wingPv: RG.wingPv && RG.wingPv.map(v => v * sc),
      leg: SP && SP.wings.length ? { wings: SP.wings.map(w => Object.assign({}, w, { g: fix(wrapS(`<g transform="translate(${pt(w.x0, w.y0)}) rotate(${w.rot})">${w.g}</g>`)), pv: [w.x0 * sc, w.y0 * sc] })), flap: SP.flap, beat: SP.beat } : null };
  } else petSVG.rig = null;
  return svg;
}
/* a Legendary in the room: its picture with the aura, the wings (a layer for each wing) and the lights as layers of
   their own around it, so the browser only turns and moves them (the room's legMove), never paints them again */
function petRigHTML(f, o) {
  const svg = petSVG(f, Object.assign({}, o, { split: true })), P = petSVG.split;
  if (!P) return svg;
  const { vb, sc, SP, id } = P, S = Math.round(sc * 1000) / 1000;
  // each layer is only as big as what it holds (bb: its box in the pet's units), so the browser has little empty
  // picture to move and lay over the room; o: the point it turns about
  const lay = (cls, bb, inner, defs, o, data) => {
    const P2 = 5, x0 = (bb[0] - P2) * sc, y0 = (bb[1] - P2) * sc, w = (bb[2] - bb[0] + 2 * P2) * sc, h = (bb[3] - bb[1] + 2 * P2) * sc;
    const st2 = `left:${r1((x0 + 75) / 1.5)}%;top:${r1((y0 + 150) / 1.5)}%;width:${r1(w / 1.5)}%;height:${r1(h / 1.5)}%` + (o ? `;transform-origin:${r1((o[0] * sc - x0) / w * 100)}% ${r1((o[1] * sc - y0) / h * 100)}%` : '');
    return `<div class="leg-l ${cls}"${data || ''} style="${st2}"><svg viewBox="${r1(x0)} ${r1(y0)} ${r1(w)} ${r1(h)}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${defs ? `<defs>${defs}</defs>` : ''}<g transform="scale(${S})">${inner}</g></svg></div>`;
  };
  let back = '', front = '';
  const A = SP.aura;
  if (A) { const sq = r => [-r, A.cy - r, r, A.cy + r], c0 = [0, A.cy];
    back += lay('leg-rot', sq(A.R1), A.rot, '', c0) + lay('', sq(A.Rr), A.still) + lay('leg-pulse', sq(A.Rr), A.glow, A.glowDef, c0) + lay('leg-rot', sq(A.Rr - 7), A.ring, '', c0); }
  if (SP.wings.length) {
    let L = '', Rt = '';
    SP.wings.forEach(w => {
      const g = `<g transform="translate(${pt(w.x0, w.y0)}) rotate(${w.rot})">${w.g}</g>`, d = ` data-lag="${w.lag}" data-k="${w.k}" data-mid="${w.mid}"`, B = w.bb;
      L += lay('leg-wp', B, g, '', [w.x0, w.y0], ' data-side="1"' + d);
      Rt += lay('leg-wp', [-B[2], B[1], -B[0], B[3]], `<g transform="scale(-1 1)">${g}</g>`, '', [-w.x0, w.y0], ' data-side="-1"' + d);
    });
    back += `<div class="leg-wings" data-flap="${SP.flap.join(' ')}" data-beat="${(SP.beat || [1, 1, 1]).join(' ')}">${L}${Rt}</div>`;
  }
  const Lt = SP.lights;
  if (Lt) {
    // one element for each light, passing behind the pet's picture and in front of it by its place in the stack (its
    // z-index), which the browser changes without painting anything: no second copy for each side
    const sz = r1(64 * sc / 150 * 100), lights = Array.from({ length: Lt.n }, (_, i) => { const ring = i >= 2 ? 1 : 0, [x, y, dg, isF] = legLightAt(legLightPhase(i, 0), Lt.cy, Lt.Rr, ring), lid = `${id}L${i}`, k = ring ? 0.78 : 1;
      return `<div class="leg-light" data-ring="${ring}" style="width:${sz}%;height:${sz}%;left:${r1(50 - sz / 2)}%;top:${r1(100 - sz / 2)}%;transform:translate(${r1(x / 64 * 100)}%, ${r1(y / 64 * 100)}%) rotate(${Math.round(dg)}deg) scale(${k});z-index:${isF ? 3 : 1}"><svg viewBox="-32 -32 64 64" aria-hidden="true" focusable="false"><defs>${Lt.def.replace('LID', lid)}</defs>${Lt.one.replace('LID', lid)}</svg></div>`; }).join('');
    front += `<div class="leg-lights" data-orbit="${r1(Lt.cy)} ${r1(Lt.Rr)}">${lights}</div>`;
  }
  return back + svg + front;
}
/* the pet as an image for games: resolves to {img, vb:[x, y, w, h]} */
const petImgCache = new Map();
function petImage(f, o) {
  o = Object.assign({ static: true, frame: 'fit', px: 256 }, o || {});
  const svg = petSVG(f, o);
  const key = o.eyes + '|' + o.mouth + '|' + svg.length + '|' + JSON.stringify(f).length + '|' + dnaCode(f);
  if (petImgCache.has(key)) return petImgCache.get(key);
  const vb = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const pr = new Promise(res => {
    const img = new Image();
    img.onload = () => res({ img, vb });
    img.onerror = () => res({ img: null, vb });
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  petImgCache.set(key, pr);
  return pr;
}

/* ---------- gemstones ---------- */
function gemSVG(key) {
  const g = GEMS[key], c = g.color, k = g.dark;
  const o = 'stroke="var(--pet-line)" stroke-width="2" stroke-linejoin="round"';
  let s;
  switch (key) {
    case 'quartz': s = `<path d="M20 34L6.5 19.5C3 15.5 4.5 8.5 11 8C15.5 7.6 18.5 10 20 13C21.5 10 24.5 7.6 29 8C35.5 8.5 37 15.5 33.5 19.5Z" fill="${c}" ${o}/><path d="M20 13L15.5 19.5L20 34L24.5 19.5Z" fill="${k}" opacity=".35"/><path d="M11 12.5Q9 14 9.5 17" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>`; break;
    case 'amethyst': s = `<path d="M20 3L31 12V28L20 37L9 28V12Z" fill="${c}" ${o}/><path d="M20 3V37M9 12L20 18L31 12M20 18V37" fill="none" stroke="${k}" stroke-width="1.6"/><path d="M13 14.5V24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`; break;
    case 'citrine': s = `<circle cx="20" cy="20" r="15" fill="${c}" ${o}/><path d="M20 8L28 13V27L20 32L12 27V13Z" fill="none" stroke="${k}" stroke-width="1.6"/><path d="M12 13L20 20L28 13M20 20V32" fill="none" stroke="${k}" stroke-width="1.3"/><path d="M11 15Q11 11 14 9" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>`; break;
    case 'emerald': s = `<path d="M12 5H28L34 11V29L28 35H12L6 29V11Z" fill="${c}" ${o}/><rect x="12.5" y="11.5" width="15" height="17" fill="none" stroke="${k}" stroke-width="1.6"/><path d="M12 5L12.5 11.5M28 5L27.5 11.5M12 35L12.5 28.5M28 35L27.5 28.5" stroke="${k}" stroke-width="1.3"/><path d="M9.5 13V22" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`; break;
    case 'sapphire': s = `<ellipse cx="20" cy="20" rx="12.5" ry="16" fill="${c}" ${o}/><path d="M20 4L26 20L20 36L14 20Z" fill="none" stroke="${k}" stroke-width="1.6"/><path d="M8 20H32" stroke="${k}" stroke-width="1.3"/><path d="M12.5 12Q13 9 15.5 7.5" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>`; break;
    default: s = `<path d="M20 3l4.6 10.4 11.4 1.2-8.6 7.6 2.5 11.2L20 27.6 10.1 33.4l2.5-11.2L4 14.6l11.4-1.2z" fill="${c}" ${o}/><path d="M20 9l2.4 7H18z" fill="#FF9BD2" opacity=".8"/><path d="M14 19l4 1-2 5z" fill="#7FD3F2" opacity=".8"/><path d="M26 19l-4 1 2 5z" fill="#FFE37A" opacity=".9"/>`;
  }
  return `<svg viewBox="0 0 40 40" aria-hidden="true">${s}</svg>`;
}
