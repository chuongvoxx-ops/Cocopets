/* ---------- The world map: a painted chart of Gaia ----------
   A large chart (1200 x 1500 map units, panned and pinched on the Adventure screen) drawn once on a canvas in the
   manner of an illustrated travellers' map: parchment, a hand-inked coastline, cel-shaded land with stepped cliffs,
   rivers as flat blue strips, clustered cone trees, inked peaks, and a miniature model at every place worth going:
   Pocket Town, the Tower of Oblivion, the twelve rift dungeons (each with the landmark that names it, a violet rift
   curling behind it until it is sealed, its golden sigil after), the twelve Anima gates beside them (two stone uprights,
   an incomplete golden ring, a constellation inside), the Great Rift's wound over the centre and, once the twelve seals
   are set, R'lyeh raised above it. Villages, lighthouses, lakes and passes fill the roads between. Routes join the
   dungeons in order, and each dungeon to its gate. WorldMap.PLACES holds every destination's position. */
const WorldMap = (() => {
  const TAU = Math.PI * 2, L = '#3A2A1E', GOLD = '#D9B35F', VIOLET = '#B983F5';
  const W = 1200, H = 1500;
  let baked = null, bakedKey = '';
  const rr = (c, x, y, w, h, r) => GFX.rr(c, x, y, w, h, r);
  const shade = (h, k) => { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  /* ---- where everything is ---- */
  const PLACES = {
    town: { x: 400, y: 825, name: 'Pocket Town' }, tower: { x: 868, y: 540, name: 'Tower of Oblivion' }, great: { x: 600, y: 62, name: 'The Great Rift' },
    rifts: { caldera: { x: 820, y: 190 }, belfry: { x: 176, y: 748 }, garden: { x: 520, y: 1040 }, dunes: { x: 850, y: 1000 }, sepulchre: { x: 985, y: 760 }, aurora: { x: 262, y: 330 }, yuggoth: { x: 900, y: 300 }, library: { x: 250, y: 1000 }, moon: { x: 1080, y: 1180 }, basilica: { x: 700, y: 420 }, colours: { x: 1050, y: 170 }, choir: { x: 560, y: 230 }, threshold: { x: 480, y: 92 }, rlyeh: { x: 600, y: 28 } },
    gates: { belfry: { x: 244, y: 800 }, garden: { x: 604, y: 1112 }, dunes: { x: 924, y: 1080 }, sepulchre: { x: 1004, y: 846 }, aurora: { x: 336, y: 404 }, yuggoth: { x: 964, y: 382 }, library: { x: 326, y: 1066 }, moon: { x: 1014, y: 1262 }, basilica: { x: 768, y: 486 }, colours: { x: 1100, y: 98 }, choir: { x: 646, y: 294 }, threshold: { x: 394, y: 126 }, caldera: { x: 728, y: 150 } /* v435 AG: the Gate of Aries, beside Rift 0 */ },
    extras: [
      { name: 'Harborlight', x: 300, y: 610, kind: 'port', note: 'a fishing port on the bay' }, { name: 'Fernway', x: 570, y: 900, kind: 'village', note: 'a village in the hollow' }, { name: 'Cinderpass', x: 740, y: 300, kind: 'pass', note: 'the high road north' },
      { name: 'Mirrorlake', x: 760, y: 695, kind: 'lakeName', note: 'a still lake that shows the stars by day' }, { name: 'Saltreach', x: 170, y: 840, kind: 'hamlet', note: 'a hamlet on the salt flats' }, { name: 'The Old Lighthouse', x: 70, y: 330, kind: 'lighthouse', note: 'dark these hundred years' },
      { name: 'Starfall Quarry', x: 905, y: 885, kind: 'quarry', note: 'where the stones fell' }, { name: 'Whistling Cliffs', x: 1000, y: 540, kind: 'cliffs', note: 'the wind sings here' }, { name: "Hermit's Bridge", x: 640, y: 760, kind: 'bridge', note: 'a crossing of the Silverrun' },
      { name: 'Dusk Orchard', x: 450, y: 1180, kind: 'orchard', note: 'plum trees and bees' }, { name: 'Thornmere', x: 330, y: 1190, kind: 'marsh', note: 'reeds and will-o-wisps' },
      { name: 'Greywatch', x: 690, y: 1160, kind: 'tower', note: 'an old watchtower' }, { name: 'Coral Shallows', x: 980, y: 1340, kind: 'reef', note: 'bright water' },
    ],
  };
  const ORDER = ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'basilica', 'colours', 'choir', 'threshold'];
  const COAST = [[150, 470], [190, 360], [150, 290], [220, 230], [330, 200], [430, 170], [520, 150], [600, 130], [700, 150], [770, 120], [850, 160], [930, 250], [990, 320], [1040, 420], [1020, 520], [1060, 600], [1090, 700], [1050, 800], [1070, 880], [1020, 960], [960, 1010], [940, 1090], [880, 1150], [800, 1210], [720, 1200], [660, 1260], [560, 1280], [470, 1250], [400, 1290], [330, 1230], [270, 1140], [230, 1040], [250, 960], [180, 900], [120, 820], [150, 760], [220, 720], [270, 660], [240, 610], [170, 590], [120, 560], [90, 500]];
  const ISLE_NE = [[960, 80], [1040, 50], [1120, 80], [1140, 180], [1090, 240], [1010, 220], [960, 150]];
  const ISLE_W = [[40, 300], [90, 280], [110, 340], [70, 380], [30, 350]];
  const REGIONS = [
    { col: '#D7E6F2', pts: [[150, 290], [220, 230], [330, 200], [430, 170], [450, 300], [390, 380], [290, 420], [190, 400]] },
    { col: '#B9B2CC', pts: [[440, 170], [520, 150], [600, 130], [700, 150], [760, 220], [700, 300], [600, 330], [500, 300]] },
    { col: '#B9A98A', pts: [[770, 120], [850, 160], [930, 250], [990, 320], [950, 400], [860, 400], [800, 330], [760, 220]] },
    { col: '#A89A8C', pts: [[600, 330], [700, 300], [800, 330], [860, 400], [820, 500], [700, 520], [620, 460]] },
    { col: '#C9C1D6', pts: [[940, 620], [1040, 640], [1090, 700], [1050, 800], [1070, 880], [980, 900], [900, 820], [920, 700]] },
    { col: '#E8C98A', pts: [[740, 880], [900, 860], [1020, 960], [960, 1010], [940, 1090], [880, 1150], [800, 1210], [740, 1180], [700, 1050], [700, 950]] },
    { col: '#7E9A6E', pts: [[150, 900], [260, 880], [330, 960], [360, 1060], [300, 1150], [230, 1120], [180, 1040], [130, 960]] },
    { col: '#4A2A5A', pts: [[400, 940], [560, 920], [660, 1000], [640, 1120], [560, 1180], [440, 1160], [380, 1060]] },
    { col: '#C8CCBC', pts: [[100, 620], [200, 640], [260, 700], [240, 820], [160, 860], [110, 800]] },
  ];
  const LAKE = [[700, 660], [760, 640], [820, 670], [830, 720], [780, 750], [720, 740], [690, 700]];
  const ISLE_SE = [[1030, 1120], [1100, 1110], [1150, 1170], [1130, 1250], [1070, 1290], [1000, 1280], [970, 1210], [990, 1150]];
  const ISLET = [[1000, 1240], [1040, 1235], [1050, 1280], [1010, 1300], [985, 1275]];
  /* a wobbly closed coastline around control points */
  function coast(c, pts, R, amp) { const n = pts.length; c.beginPath(); for (let i = 0; i < n; i++) { const p0 = pts[i], p1 = pts[(i + 1) % n], steps = 12; for (let k = 0; k < steps; k++) { const u = k / steps, x = p0[0] + (p1[0] - p0[0]) * u, y = p0[1] + (p1[1] - p0[1]) * u, nx = -(p1[1] - p0[1]), ny = p1[0] - p0[0], nl = Math.hypot(nx, ny) || 1, w = Math.sin(u * Math.PI * 3 + i * 1.7) * amp * 0.5 + (R() - 0.5) * amp * 0.6; if (i === 0 && k === 0) c.moveTo(x + nx / nl * w, y + ny / nl * w); else c.lineTo(x + nx / nl * w, y + ny / nl * w); } } c.closePath(); }
  const inPoly = (pts, x, y) => { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
  /* ---- the little models ---- */
  function tree(c, x, y, s, col) { s = s || 1; const base = col || '#3F7A40', dk = shade(base, 0.72), lt = shade(base, 1.3); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 2 * s, y + 1.5 * s, 6 * s, 2 * s, 0, 0, TAU); c.fill(); c.fillStyle = dk; c.beginPath(); c.moveTo(x, y - 14 * s); c.lineTo(x + 6.5 * s, y - 1 * s); c.lineTo(x - 6.5 * s, y - 1 * s); c.closePath(); c.fill(); c.fillStyle = base; c.beginPath(); c.moveTo(x, y - 14 * s); c.lineTo(x + 6.5 * s, y - 1 * s); c.lineTo(x, y - 1 * s); c.closePath(); c.fill(); c.fillStyle = lt; c.beginPath(); c.moveTo(x - 0.5 * s, y - 12 * s); c.lineTo(x + 2.5 * s, y - 4 * s); c.lineTo(x - 2.5 * s, y - 4 * s); c.closePath(); c.fill(); c.fillStyle = '#5E4630'; c.fillRect(x - 1 * s, y - 1.5 * s, 2 * s, 3 * s); c.strokeStyle = 'rgba(40,30,20,.55)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 6.5 * s, y - 1 * s); c.lineTo(x, y - 14 * s); c.lineTo(x + 6.5 * s, y - 1 * s); c.stroke(); }
  /* (v381) a low hill: a lit mound with an inked crest and a few strokes of shade */
  function hill(c, x, y, s, col) { const base = col || '#8DB86A', w = 24 * s, h = 11 * s; c.save(); c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(x + 3 * s, y + 1, w * 1.05, 3.5 * s, 0, 0, TAU); c.fill();
    c.fillStyle = shade(base, 1.08); c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.35, y - h * 1.5, x + w * 0.1, y - h); c.quadraticCurveTo(x + w * 0.6, y - h * 0.6, x + w, y); c.closePath(); c.fill();
    c.fillStyle = shade(base, 0.82); c.beginPath(); c.moveTo(x + w * 0.1, y - h); c.quadraticCurveTo(x + w * 0.6, y - h * 0.6, x + w, y); c.lineTo(x + w * 0.05, y); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(58,42,30,.75)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.35, y - h * 1.5, x + w * 0.1, y - h); c.quadraticCurveTo(x + w * 0.6, y - h * 0.6, x + w, y); c.stroke();
    c.strokeStyle = 'rgba(58,42,30,.35)'; c.lineWidth = 0.8; for (let i = 0; i < 3; i++) { const xx = x + w * (0.25 + i * 0.22); c.beginPath(); c.moveTo(xx, y - h * (0.75 - i * 0.22)); c.lineTo(xx + 3 * s, y - 1); c.stroke(); } c.restore(); }
  /* (v382) a mountain drawn as an illustrated peak: a jagged silhouette of a main peak and a shoulder, each split along its
     ridge into a face lit from the top left and one in shadow (cool, darker toward the foot), strata and gullies running
     down the faces, flecks of rock, a snow cap with a ragged foot that runs down the gullies (white where it is lit, blue
     in shadow), shade gathering at the foot, its shadow on the ground, an inked outline and a rim of light. Each peak its
     own shape (seeded by where it stands) */
  function mountain(c0, x, y, s, snow, col) {
    // (drawn on a little canvas of its own, its foot then faded out, so the range rises from the land with no hard edge at its base)
    const kz = Math.max(1, Math.hypot(c0.getTransform().a, c0.getTransform().b)), bx0 = x - 34 * s, by0 = y - 52 * s, bw = 74 * s, bh = 58 * s, oc = document.createElement('canvas'); oc.width = Math.ceil(bw * kz); oc.height = Math.ceil(bh * kz); const c = oc.getContext('2d'); c.setTransform(kz, 0, 0, kz, -bx0 * kz, -by0 * kz);
    const R = mulberry32(((Math.round(x * 7.13) * 131 + Math.round(y * 3.71) * 977) >>> 0) || 1), base = col || '#8A7E98';
    const H = 38 * s * (0.9 + R() * 0.25), pkx = x + (R() * 8 - 2) * s, pky = y - H, w0 = 27 * s, w1 = 31 * s, J = (a) => (R() - 0.5) * a * s;
    const sh = [x + (15 + R() * 5) * s, y - H * (0.6 + R() * 0.12)], cp = [(pkx + sh[0]) / 2 + 1.5 * s, Math.max(pky + H * 0.3, sh[1] + H * (0.08 + R() * 0.06))];
    const left = [[x - w0, y]]; for (let i = 1; i <= 4; i++) { const u = i / 5; left.push([x - w0 + (pkx - x + w0) * u + J(3), y - H * (u * u * 0.25 + u * 0.75) + J(3)]); } left.push([pkx, pky]);
    const right = [[pkx + 2.5 * s, pky + H * (0.12 + R() * 0.06)], cp, [sh[0] - 2 * s, sh[1] + 2 * s], sh, [sh[0] + 4 * s, sh[1] + H * 0.12 + J(2)], [x + w1 - 5 * s, y - H * 0.12 + J(2)], [x + w1, y]];
    const ridge = [[pkx, pky], [pkx + 2 * s + J(2), pky + H * 0.3], [pkx + J(3), pky + H * 0.62], [x + 3 * s, y]], ridge2 = [sh, [sh[0] - 2.5 * s, sh[1] + (y - sh[1]) * 0.5], [sh[0] + 1 * s, y]];
    const sil = left.concat(right), path = pts => { c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); };
    c.save();
    // its shadow on the ground
    c0.save(); { const ax = x + 3 * s, ay = y - 3 * s, ar = w1 * 1.45, g = c0.createRadialGradient(ax, ay, 1, ax, ay, ar); g.addColorStop(0, shade(base, 0.9).replace('rgb', 'rgba').replace(')', ',.5)')); g.addColorStop(0.55, shade(base, 1.0).replace('rgb', 'rgba').replace(')', ',.22)')); g.addColorStop(1, shade(base, 1.0).replace('rgb', 'rgba').replace(')', ',0)')); c0.translate(0, ay); c0.scale(1, 0.34); c0.translate(0, -ay); c0.fillStyle = g; c0.beginPath(); c0.arc(ax, ay, ar, 0, TAU); c0.fill(); } c0.restore();
    c0.save(); { const ax = x + 9 * s, ay = y - 2 * s, ar = w1 * 1.1, g = c0.createRadialGradient(ax, ay, 1, ax, ay, ar); g.addColorStop(0, 'rgba(30,30,40,.24)'); g.addColorStop(1, 'rgba(30,30,40,0)'); c0.translate(0, ay); c0.scale(1, 0.2); c0.translate(0, -ay); c0.fillStyle = g; c0.beginPath(); c0.arc(ax, ay, ar, 0, TAU); c0.fill(); } c0.restore();
    path(sil); c.closePath(); c.fillStyle = base; c.fill(); c.save(); path(sil); c.closePath(); c.clip();
    // the lit faces and the shaded ones
    const lit = left.concat(ridge.slice(1).reverse()); path(lit); c.closePath(); { const g = c.createLinearGradient(x - w0, pky, pkx + 4 * s, y); g.addColorStop(0, shade(base, 1.38)); g.addColorStop(0.55, shade(base, 1.12)); g.addColorStop(1, shade(base, 0.92)); c.fillStyle = g; c.fill(); }
    path(ridge.concat([[x + w1, y], [x + w1, pky]])); c.closePath(); { const g = c.createLinearGradient(pkx, pky, x + w1, y); g.addColorStop(0, shade(base, 0.74)); g.addColorStop(1, shade(base, 0.5)); c.fillStyle = g; c.fill(); }
    path([sh, [sh[0] - 6 * s, sh[1] + 4 * s], ridge2[1], ridge2[2], [x + w1 - 6 * s, y], [x + w1 - 6 * s, sh[1]]]); c.closePath(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill();
    path(ridge2.concat([[x + w1 + 2, y], [x + w1 + 2, sh[1]]])); c.closePath(); c.fillStyle = 'rgba(25,20,45,.22)'; c.fill();
    // strata and gullies, flecks of rock
    c.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const u = 0.15 + i * 0.09, py = pky + H * u, px = pkx + (x + 3 * s - pkx) * u; c.strokeStyle = 'rgba(20,14,34,.26)'; c.lineWidth = 0.7 + 0.4 * R(); c.beginPath(); c.moveTo(px + 1 * s, py); c.quadraticCurveTo(px + (5 + R() * 4) * s, py + (3 + R() * 2) * s, px + (9 + R() * 8) * s, py + (7 + R() * 5) * s); c.stroke(); }
    for (let i = 0; i < 6; i++) { const u = 0.25 + i * 0.12, py = pky + H * u, px = pkx - (pkx - x + w0) * u * 0.55; c.strokeStyle = 'rgba(255,250,235,.22)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px - 3 * s, py + 5 * s, px - (5 + R() * 5) * s, py + (9 + R() * 4) * s); c.stroke(); c.strokeStyle = 'rgba(30,20,40,.18)'; c.beginPath(); c.moveTo(px + 1.2, py + 1); c.quadraticCurveTo(px - 2 * s, py + 6 * s, px - (4 + R() * 4) * s, py + (10 + R() * 4) * s); c.stroke(); }
    for (let i = 0; i < 26; i++) { const px = x - w0 + R() * (w0 + w1), py = pky + R() * H; c.fillStyle = R() < 0.5 ? 'rgba(20,14,30,.16)' : 'rgba(255,255,240,.14)'; c.fillRect(px, py, 1 + R() * 1.6 * s, 0.8 + R() * s); }
    // the snow: a ragged foot running down the gullies; white in the light, blue in shadow
    if (snow) { const yS = pky + H * (0.46 + R() * 0.08), snowP = [[x - w0 - 4, pky - 6]]; for (let i = 0; i <= 14; i++) { const u = i / 14, xx = x - w0 + (w0 + w1) * u, drip = (i % 2 ? 1 : 0.2) * (2 + R() * 7) * s; snowP.push([xx, yS + drip + J(3) + (Math.abs(xx - pkx) / (w0 + w1)) * -H * 0.12]); } snowP.push([x + w1 + 4, pky - 6]);
      c.save(); path(snowP); c.closePath(); c.clip();
      path(lit); c.closePath(); { const g = c.createLinearGradient(x - w0, pky, pkx, yS); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E6EAF6'); c.fillStyle = g; c.fill(); }
      path(ridge.concat([[x + w1 + 4, y], [x + w1 + 4, pky - 6]])); c.closePath(); { const g = c.createLinearGradient(pkx, pky, x + w1, yS); g.addColorStop(0, '#C6D0EC'); g.addColorStop(1, '#98A4CC'); c.fillStyle = g; c.fill(); }
      c.strokeStyle = 'rgba(120,135,180,.45)'; c.lineWidth = 0.7; for (let i = 0; i < 4; i++) { const u = 0.1 + i * 0.07, py = pky + H * u, px = pkx + (x + 3 * s - pkx) * u; c.beginPath(); c.moveTo(px + 1, py); c.lineTo(px + (6 + i) * s, py + (4 + i) * s); c.stroke(); }
      c.restore(); }
    // shade gathering at the foot
    { const g = c.createLinearGradient(0, y - H * 0.35, 0, y); g.addColorStop(0, 'rgba(30,22,40,0)'); g.addColorStop(1, 'rgba(30,22,40,.32)'); c.fillStyle = g; c.fillRect(x - w0 - 2, y - H * 0.35, w0 + w1 + 4, H * 0.35 + 1); }
    c.restore();
    // ink: the outline (open at the foot), the ridges; a rim of light down the lit side
    c.lineJoin = 'round'; c.strokeStyle = L; c.lineWidth = 1.25; path(sil); c.stroke();
    c.strokeStyle = 'rgba(40,28,24,.5)'; c.lineWidth = 0.8; path(ridge.slice(0, 3)); c.stroke(); path(ridge2.slice(0, 2)); c.stroke();
    c.strokeStyle = 'rgba(255,252,236,.55)'; c.lineWidth = 0.8; c.save(); c.translate(1.1, 1.1); path(left.slice(1)); c.stroke(); c.restore();
    c.restore();
    c.globalCompositeOperation = 'destination-in'; { const g = c.createLinearGradient(0, y - H * 0.34, 0, y + 1); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(bx0, by0, bw, bh); }
    c0.drawImage(oc, bx0, by0, bw, bh); }
  function house(c, x, y, s, wall, roof) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 2 * s, y + 4 * s, 10 * s, 3 * s, 0, 0, TAU); c.fill(); c.fillStyle = wall; c.fillRect(x - 7 * s, y - 6 * s, 14 * s, 10 * s); c.fillStyle = shade(wall, 0.75); c.fillRect(x + 7 * s, y - 6 * s, 3 * s, 10 * s); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 9 * s, y - 6 * s); c.lineTo(x, y - 14 * s); c.lineTo(x + 9 * s, y - 6 * s); c.closePath(); c.fill(); c.fillStyle = shade(roof, 0.75); c.beginPath(); c.moveTo(x, y - 14 * s); c.lineTo(x + 9 * s, y - 6 * s); c.lineTo(x + 12 * s, y - 7 * s); c.lineTo(x + 3 * s, y - 15 * s); c.closePath(); c.fill(); c.fillStyle = '#4A3A2A'; c.fillRect(x - 1.5 * s, y - 1 * s, 3 * s, 5 * s); c.fillStyle = '#FFE9A8'; c.fillRect(x - 5.5 * s, y - 4 * s, 2.5 * s, 2.5 * s); c.fillRect(x + 3 * s, y - 4 * s, 2.5 * s, 2.5 * s); c.strokeStyle = L; c.lineWidth = 0.9; c.strokeRect(x - 7 * s, y - 6 * s, 14 * s, 10 * s); c.beginPath(); c.moveTo(x - 9 * s, y - 6 * s); c.lineTo(x, y - 14 * s); c.lineTo(x + 9 * s, y - 6 * s); c.stroke(); }
  function boat(c, x, y, flip) { c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.fillStyle = '#7A5230'; c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(0, 7, 12, 0); c.lineTo(10, -3.5); c.lineTo(-11, -3.5); c.closePath(); c.fill(); c.strokeStyle = L; c.lineWidth = 1; c.stroke(); c.fillStyle = '#5E4630'; c.fillRect(-0.8, -19, 1.6, 15.5); c.fillStyle = '#FFF6E6'; c.beginPath(); c.moveTo(0, -19); c.lineTo(10, -6); c.lineTo(0, -6); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#D9483B'; c.beginPath(); c.moveTo(0, -19); c.lineTo(5, -17); c.lineTo(0, -15); c.fill(); c.restore(); }
  function serpent(c, x, y) { c.save(); c.translate(x, y); c.strokeStyle = '#2E7A6E'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-36, 4); c.quadraticCurveTo(-24, -19, -10, 0); c.moveTo(5, 0); c.quadraticCurveTo(17, -22, 31, -2); c.stroke(); c.strokeStyle = '#5FC2B0'; c.lineWidth = 3; c.beginPath(); c.moveTo(-34, 2); c.quadraticCurveTo(-24, -15, -12, -1); c.moveTo(7, -1); c.quadraticCurveTo(17, -18, 29, -3); c.stroke(); c.fillStyle = '#2E7A6E'; c.beginPath(); c.ellipse(36, -9, 9, 7, -0.4, 0, TAU); c.fill(); c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(38, -11, 1.8, 0, TAU); c.fill(); c.strokeStyle = L; c.lineWidth = 1; c.beginPath(); c.ellipse(36, -9, 9, 7, -0.4, 0, TAU); c.stroke(); c.restore(); }
  function whale(c, x, y) { c.save(); c.translate(x, y); c.fillStyle = '#4A6FA8'; c.beginPath(); c.ellipse(0, 0, 19, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(17, -2); c.lineTo(29, -11); c.lineTo(26, 0); c.lineTo(29, 9); c.closePath(); c.fill(); c.fillStyle = '#C7D8F0'; c.beginPath(); c.ellipse(-2, 3.5, 13, 4, 0, 0, TAU); c.fill(); c.strokeStyle = L; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 19, 8, 0, 0, TAU); c.stroke(); c.fillStyle = L; c.beginPath(); c.arc(-11, -2, 1.3, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-5, -8); c.quadraticCurveTo(-10, -19, -14, -23); c.moveTo(-5, -8); c.quadraticCurveTo(-2, -19, 1, -24); c.stroke(); c.restore(); }
  function compass(c, x, y, r) { c.save(); c.translate(x, y); c.fillStyle = 'rgba(255,250,230,.6)'; c.beginPath(); c.arc(0, 0, r + 8, 0, TAU); c.fill(); c.strokeStyle = L; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, r + 8, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.62, 0, TAU); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, big = i % 2 === 0, len = big ? r : r * 0.6; c.save(); c.rotate(a); c.fillStyle = big ? '#C9302C' : GOLD; c.beginPath(); c.moveTo(0, -len); c.lineTo(4, 0); c.lineTo(0, 0); c.closePath(); c.fill(); c.fillStyle = big ? '#FFF6E6' : '#F4E6C0'; c.beginPath(); c.moveTo(0, -len); c.lineTo(-4, 0); c.lineTo(0, 0); c.closePath(); c.fill(); c.strokeStyle = L; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -len); c.lineTo(4, 0); c.lineTo(-4, 0); c.closePath(); c.stroke(); c.restore(); } c.fillStyle = L; c.font = `italic 700 ${Math.round(r * 0.5)}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', 0, -r - 15); c.fillStyle = '#C9302C'; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill(); c.restore(); }
  function label(c, x, y, text, o) { o = o || {}; c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); c.font = `${o.italic === false ? '' : 'italic '}${o.w || 700} ${o.size || 15}px Georgia, "Times New Roman", serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; if (o.spacing) { try { c.letterSpacing = o.spacing + 'px'; } catch (e) {} } c.lineWidth = o.lw || 4; c.strokeStyle = o.halo || 'rgba(245,236,210,.85)'; c.lineJoin = 'round'; c.strokeText(text, 0, 0); c.fillStyle = o.color || L; c.fillText(text, 0, 0); c.restore(); }
  /* a name plaque: dark, rounded, pale lettering, readable over any ground */
  function plaque(c, x, y, text, o) { o = o || {}; c.save(); c.font = `700 ${o.size || 15}px Georgia, "Times New Roman", serif`; const tw = c.measureText(text).width + 22, h = (o.size || 15) + 12; c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, x - tw / 2 + 2, y - h / 2 + 3, tw, h, h / 2); c.fill(); c.fillStyle = o.bg || 'rgba(46,40,52,.92)'; c.strokeStyle = o.border || 'rgba(255,245,220,.45)'; c.lineWidth = 1.2; rr(c, x - tw / 2, y - h / 2, tw, h, h / 2); c.fill(); c.stroke(); c.fillStyle = o.color || '#FFF8E8'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 0.5); c.restore(); return { w: tw, h }; }
  function cartouche(c, x, y, w, h, title, sub, color) { c.save(); c.fillStyle = 'rgba(0,0,0,.18)'; rr(c, x - w / 2 + 3, y - h / 2 + 4, w, h, 8); c.fill(); const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, '#FFF8E8'); g.addColorStop(1, '#EADFC4'); c.fillStyle = g; c.strokeStyle = L; c.lineWidth = 2; rr(c, x - w / 2, y - h / 2, w, h, 8); c.fill(); c.stroke(); c.strokeStyle = 'rgba(58,42,30,.45)'; c.lineWidth = 1; rr(c, x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8, 5); c.stroke(); c.fillStyle = color || L; c.font = `700 ${sub ? 20 : 22}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(title, x, sub ? y - 8 : y); if (sub) { c.fillStyle = '#6E5A40'; c.font = 'italic 600 13px Georgia, serif'; c.fillText(sub, x, y + 13); } c.restore(); }
  /* a stepped cliff: a band of cel-shaded ledges along a path */
  function cliffBand(c, pts, w, col) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; [[w * 1.0, shade(col, 0.55)], [w * 0.72, shade(col, 0.8)], [w * 0.45, col]].forEach(([lw, cc]) => { c.strokeStyle = cc; c.lineWidth = lw; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }); c.strokeStyle = 'rgba(40,30,20,.45)'; c.lineWidth = 1; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 9); for (let k = 0; k < n; k++) { const u = k / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; c.beginPath(); c.moveTo(x, y - w * 0.3); c.lineTo(x + 3, y + w * 0.25); c.stroke(); } } c.restore(); }
  function river(c, pts, w) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(40,80,90,.35)'; c.lineWidth = w + 4; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.strokeStyle = '#4F93A8'; c.lineWidth = w; c.stroke(); c.strokeStyle = '#8FD0DC'; c.lineWidth = Math.max(1.5, w * 0.35); c.stroke(); c.restore(); }
  function road(c, pts, o) { o = o || {}; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = o.shadow || 'rgba(90,70,40,.45)'; c.lineWidth = o.w || 5; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.strokeStyle = o.col || '#E8D6A8'; c.lineWidth = (o.w || 5) * 0.55; c.setLineDash(o.dash || [7, 6]); c.stroke(); c.restore(); }
  function bez(pts) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let k = 0; k < 10; k++) { const t = k / 10, t2 = t * t, t3 = t2 * t; out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[pts.length - 1]); return out; }
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  /* ---- the landmarks: the rift dungeons' miniatures ---- */
  /* (v383) the twelve rifts' landmarks and R'lyeh, drawn as illustrated models: every part shaded from a light at the top
     left (a lit face, a shaded face, round things shaded round), with highlights, shade where parts meet, a shadow on the
     ground and an inked outline; glass, metal, water and light each painted as such */
  const IP = (c, pts) => { c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); };
  const ILG = (c, x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const IRG = (c, x, y, r0, x1, y1, r1, st) => { const g = c.createRadialGradient(x, y, r0, x1, y1, r1); st.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const IINK = (c, w) => { c.strokeStyle = L; c.lineWidth = w || 1.2; c.lineJoin = 'round'; c.stroke(); };
  const ISH = (c, x, y, rx, ry, a) => { c.fillStyle = `rgba(25,18,36,${a || 0.28})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
  const ICYL = (c, x0, x1, base) => ILG(c, x0, 0, x1, 0, [[0, shade(base, 1.4)], [0.28, shade(base, 1.1)], [0.68, shade(base, 0.72)], [1, shade(base, 0.48)]]);
  const IHL = (c, x0, y0, x1, y1, a) => { c.strokeStyle = `rgba(255,252,238,${a || 0.55})`; c.lineWidth = 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  /* (v383) ground under a landmark feathered out into the map: a radial fade of its colour, no inked rim */
  const IGND = (c, x, y, rx, ry, col, a) => { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx); const rgb = shade(col, 1).replace('rgb(', '').replace(')', ''); g.addColorStop(0, `rgba(${rgb},${a == null ? 1 : a})`); g.addColorStop(0.62, `rgba(${rgb},${(a == null ? 1 : a) * 0.85})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); };
  const ICONS = {
    // the Drowned Belfry: a leaning stone bell tower sunk to its knees in a tidal pool, a bronze bell in its open top, a roof gone green
    belfry(c, x, y) { c.save(); c.translate(x, y);
      c.fillStyle = IRG(c, -4, 4, 2, 0, 6, 38, [[0, 'rgba(120,200,210,.85)'], [0.7, 'rgba(60,140,160,.7)'], [1, 'rgba(40,110,130,0)']]); c.beginPath(); c.ellipse(0, 6, 40, 13, 0, 0, TAU); c.fill();
      c.save(); c.rotate(-0.2);
      const W = 11, D = 6, top = -52;
      IP(c, [[-W, 4], [-W + 2, top], [W - 1, top], [W, 4]]); c.fillStyle = ILG(c, -W, 0, W, 0, [[0, '#E2E4D6'], [0.55, '#B4BCAE'], [1, '#8E9A92']]); c.fill(); IINK(c, 1.3);
      IP(c, [[W, 4], [W - 1, top], [W - 1 + D, top - 3], [W + D, 2]]); c.fillStyle = ILG(c, W, 0, W + D, 0, [[0, '#6E7C7A'], [1, '#4A5858']]); c.fill(); IINK(c, 1.1);
      c.strokeStyle = 'rgba(40,50,48,.35)'; c.lineWidth = 0.7; for (let yy = 0; yy > top + 4; yy -= 5) { c.beginPath(); c.moveTo(-W + 0.5, yy); c.lineTo(W - 0.5, yy); c.stroke(); const o = (yy / 5) % 2 ? 0 : 3; for (let xx = -W + 3 + o; xx < W - 1; xx += 6) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy - 5); c.stroke(); } }
      c.strokeStyle = 'rgba(70,110,70,.55)'; c.lineWidth = 1.6; [[-7, -6, -6, -20], [4, -4, 5, -14], [-2, -30, -1, -38]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(a + 2, (b + e) / 2, d, e); c.stroke(); });
      // the belfry: an arched opening with the bell
      c.fillStyle = '#1A2E36'; c.beginPath(); c.moveTo(-6, top + 16); c.lineTo(-6, top + 7); c.arc(0, top + 7, 6, Math.PI, 0); c.lineTo(6, top + 16); c.closePath(); c.fill(); IINK(c, 0.9);
      c.fillStyle = ILG(c, -4, 0, 4, 0, [[0, '#F2D58A'], [0.45, '#C7943E'], [1, '#6E4E18']]); c.beginPath(); c.moveTo(-4.5, top + 15); c.quadraticCurveTo(-4, top + 6, 0, top + 5); c.quadraticCurveTo(4, top + 6, 4.5, top + 15); c.closePath(); c.fill(); IINK(c, 0.8); c.fillStyle = '#5A3E14'; c.beginPath(); c.arc(0, top + 15.5, 1.2, 0, TAU); c.fill();
      // the roof, gone green
      IP(c, [[-W - 2, top], [0.5, top - 20], [W + 1, top]]); c.fillStyle = ILG(c, -W, top - 20, W, top, [[0, '#8FD0BE'], [0.6, '#4E9A8A'], [1, '#2E6A64']]); c.fill(); IINK(c, 1.2);
      IP(c, [[W + 1, top], [0.5, top - 20], [W + D, top - 3]]); c.fillStyle = '#245450'; c.fill(); IINK(c, 1);
      IHL(c, -W + 1, top - 1, -0.5, top - 18, 0.5); c.strokeStyle = L; c.lineWidth = 1; c.beginPath(); c.moveTo(0.5, top - 20); c.lineTo(0.5, top - 27); c.moveTo(-3, top - 25); c.lineTo(4, top - 25); c.stroke();
      IHL(c, -W + 1.2, 2, -W + 2.8, top + 2, 0.45);
      c.restore();
      // the water over its foot: a lighter skin, rings, foam
      c.fillStyle = 'rgba(150,220,225,.55)'; c.beginPath(); c.ellipse(0, 6, 24, 6, 0, 0, Math.PI); c.fill(); c.strokeStyle = 'rgba(240,252,250,.85)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(1, 3, 17, 4.5, 0, 0.1, Math.PI - 0.1); c.stroke(); c.lineWidth = 0.8; c.strokeStyle = 'rgba(240,252,250,.55)'; c.beginPath(); c.ellipse(0, 6, 28, 8, 0, 0.2, Math.PI - 0.2); c.stroke(); c.beginPath(); c.ellipse(0, 7, 36, 11, 0, 0.35, Math.PI - 0.35); c.stroke();
      c.restore(); },
    // the Garden of Unborn Stars: a great star lily, glowing, over a bed of buds
    garden(c, x, y) { c.save(); c.translate(x, y); glowAt(c, 0, -30, 46, '#F2D8A1', 0.55); ISH(c, 2, 4, 30, 7);
      IGND(c, 0, 2, 38, 11, '#3A1E48', 0.95);
      [[-20, -1], [-11, 3], [14, 2], [22, -1], [4, 4]].forEach(([bx, by], i) => { glowAt(c, bx, by - 3, 7, i % 2 ? '#FF9BD2' : '#BFE6FF', 0.6); c.fillStyle = IRG(c, bx - 1, by - 4, 0.3, bx, by - 3, 3, [[0, '#FFFFFF'], [1, i % 2 ? '#D86AA8' : '#7FB8E8']]); c.beginPath(); c.ellipse(bx, by - 3, 2.4, 3.2, 0, 0, TAU); c.fill(); });
      // the stem and its leaves
      c.fillStyle = ILG(c, -3, 0, 3, 0, [[0, '#7FC9A8'], [0.5, '#3E8A70'], [1, '#1E5444']]); c.beginPath(); c.moveTo(-3, 2); c.quadraticCurveTo(-5, -18, -1.5, -30); c.lineTo(1.5, -30); c.quadraticCurveTo(1, -16, 3, 2); c.closePath(); c.fill(); IINK(c, 1.1);
      [[-1, -10, -16, -20], [1, -14, 15, -22]].forEach(([a, b, d, e]) => { c.fillStyle = ILG(c, a, b, d, e, [[0, '#5EB088'], [1, '#2A6A54']]); c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo((a + d) / 2, e + 2, d, e); c.quadraticCurveTo((a + d) / 2 + (d > 0 ? -2 : 2), b + 2, a, b + 3); c.closePath(); c.fill(); IINK(c, 0.9); IHL(c, a, b, (a + d) * 0.6, (b + e) * 0.55, 0.4); });
      // the petals: a back ring dark, a front ring lit, each shaded along its length
      const P2 = (a, len, wd, c0, c1) => { const tx = Math.cos(a) * len, ty = -34 + Math.sin(a) * len * 0.8; c.fillStyle = ILG(c, 0, -34, tx, ty, [[0, c1], [0.6, c0], [1, shade(c0, 1.25)]]); c.beginPath(); c.moveTo(0, -34); c.quadraticCurveTo(Math.cos(a - wd) * len * 0.7, -34 + Math.sin(a - wd) * len * 0.6, tx, ty); c.quadraticCurveTo(Math.cos(a + wd) * len * 0.7, -34 + Math.sin(a + wd) * len * 0.6, 0, -34); c.fill(); IINK(c, 1); c.strokeStyle = 'rgba(255,230,245,.5)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, -34); c.lineTo(tx * 0.8, -34 + (ty + 34) * 0.8); c.stroke(); };
      for (let i = 0; i < 7; i++) P2(-Math.PI / 2 + (i - 3) * 0.48 + 0.24, 24, 0.32, '#8A3E74', '#4A1A3E');
      for (let i = 0; i < 6; i++) P2(-Math.PI / 2 + (i - 2.5) * 0.52, 21, 0.3, '#E08AB8', '#9A4A80');
      glowAt(c, 0, -35, 16, '#FFF2B8', 0.9); c.fillStyle = IRG(c, -1.5, -36.5, 0.5, 0, -35, 6, [[0, '#FFFFFF'], [0.5, '#FFE9A8'], [1, '#D9A848']]); c.beginPath(); c.arc(0, -35, 5.5, 0, TAU); c.fill(); IINK(c, 1);
      c.fillStyle = '#FFFFFF'; [[-8, -52], [6, -56], [12, -46], [-13, -44], [0, -60]].forEach(([a, b], i) => { c.globalAlpha = 0.6 + 0.4 * (i % 2); c.beginPath(); for (let k = 0; k < 8; k++) { const q = k * Math.PI / 4, r2 = k % 2 ? 0.7 : 2.2; c.lineTo(a + Math.cos(q) * r2, b + Math.sin(q) * r2); } c.closePath(); c.fill(); }); c.globalAlpha = 1;
      [[-26, 1], [24, 0]].forEach(([tx, ty]) => tree(c, tx, ty, 1.2, '#2F183A')); c.restore(); },
    // the Mouth Beneath the Dunes: a sand crater, its throat falling into dark, stone teeth round its lip
    dunes(c, x, y) { c.save(); c.translate(x, y); ISH(c, 4, 6, 46, 12, 0.22);
      IGND(c, 0, 0, 54, 19, '#D9AE68', 1); IGND(c, -6, -2, 30, 10, '#F2D296', 0.6);
      c.strokeStyle = 'rgba(140,96,40,.45)'; c.lineWidth = 0.8; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.2; c.beginPath(); c.moveTo(Math.cos(a) * 38, Math.sin(a) * 13.5); c.quadraticCurveTo(Math.cos(a + 0.15) * 32, Math.sin(a + 0.15) * 11, Math.cos(a + 0.05) * 25, Math.sin(a + 0.05) * 8.5); c.stroke(); }
      c.fillStyle = IRG(c, 3, 2, 0, 2, 1, 24, [[0, '#050308'], [0.55, '#1C1424'], [0.85, '#4A3428'], [1, '#8A6236']]); c.beginPath(); c.ellipse(1, 0, 24, 8.5, 0, 0, TAU); c.fill(); IINK(c, 1.1);
      c.fillStyle = 'rgba(240,210,150,.55)'; c.beginPath(); c.ellipse(1, 0, 24, 8.5, 0, Math.PI * 1.05, Math.PI * 1.95); c.ellipse(1, 1.8, 20, 6.5, 0, Math.PI * 1.95, Math.PI * 1.05, true); c.fill();
      c.strokeStyle = 'rgba(230,200,140,.6)'; c.lineWidth = 0.7; for (let i = 0; i < 6; i++) { const xx = -16 + i * 6; c.beginPath(); c.moveTo(xx, -6); c.quadraticCurveTo(xx + 2, -2, xx + 3, 2); c.stroke(); }
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.35, bx = Math.cos(a) * 25, by = Math.sin(a) * 9, hgt = 8 + 5 * Math.max(0, -Math.sin(a)) + (i % 3) * 2, front = Math.sin(a) > 0;
        if (front) continue; c.fillStyle = ILG(c, bx - 3, by - hgt, bx + 3, by, [[0, '#F4EAD0'], [0.5, '#D4C29A'], [1, '#8E7A58']]); IP(c, [[bx - 3, by + 1], [bx - 0.5, by - hgt], [bx + 3, by + 1]]); c.fill(); IINK(c, 0.9); }
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.35, bx = Math.cos(a) * 25, by = Math.sin(a) * 9, hgt = 9 + (i % 3) * 2; if (Math.sin(a) <= 0) continue;
        c.fillStyle = ILG(c, bx - 3.5, by - hgt, bx + 3.5, by, [[0, '#FFF6E2'], [0.45, '#E2D2AC'], [1, '#9A8662']]); IP(c, [[bx - 3.5, by + 2], [bx - 0.5, by - hgt], [bx + 3.5, by + 2]]); c.fill(); IINK(c, 1); IHL(c, bx - 2, by, bx - 0.6, by - hgt + 2, 0.5); }
      c.restore(); },
    // the Sepulchre of Borrowed Hours: a pillared tomb on steps, a great hourglass on its roof
    sepulchre(c, x, y) { c.save(); c.translate(x, y); IGND(c, 0, 5, 44, 12, '#9A90AC', 0.55); ISH(c, 6, 6, 36, 8);
      [[30, 6, 4], [26, 2, 4], [22, -2, 4]].forEach(([w, yy, h]) => { c.fillStyle = ILG(c, 0, yy - h, 0, yy, [[0, '#E2DCEA'], [1, '#9A90AC']]); c.fillRect(-w, yy - h, w * 2, h); c.fillStyle = '#7A7090'; c.fillRect(w - 3, yy - h, 3, h); c.strokeStyle = L; c.lineWidth = 1; c.strokeRect(-w, yy - h, w * 2, h); });
      c.fillStyle = ILG(c, -20, 0, 20, 0, [[0, '#C9C1D6'], [1, '#8A809C']]); c.fillRect(-20, -26, 40, 20); c.fillStyle = '#2A2238'; c.beginPath(); c.moveTo(-5, -6); c.lineTo(-5, -16); c.arc(0, -16, 5, Math.PI, 0); c.lineTo(5, -6); c.closePath(); c.fill(); IINK(c, 0.9); glowAt(c, 0, -12, 8, '#F2D8A1', 0.35);
      [-17, -10, 10, 17].forEach(px => { c.fillStyle = ICYL(c, px - 2.6, px + 2.6, '#D8D0E4'); c.fillRect(px - 2.6, -26, 5.2, 20); c.strokeStyle = L; c.lineWidth = 0.9; c.strokeRect(px - 2.6, -26, 5.2, 20); c.fillStyle = '#EDE8F4'; c.fillRect(px - 3.5, -28, 7, 2.2); c.fillRect(px - 3.5, -7.5, 7, 1.8); });
      IP(c, [[-24, -27], [0, -40], [24, -27]]); c.fillStyle = ILG(c, -24, -40, 24, -27, [[0, '#EAE4F2'], [0.5, '#C9C1D6'], [1, '#8E84A2']]); c.fill(); IINK(c, 1.2); c.fillStyle = '#B4AAC6'; c.fillRect(-24, -28, 48, 3); c.strokeStyle = L; c.lineWidth = 1; c.strokeRect(-24, -28, 48, 3);
      // the hourglass: wooden ends, two bulbs of glass, golden sand
      c.fillStyle = ILG(c, -8, 0, 8, 0, [[0, '#B88A52'], [1, '#6A4422']]); c.fillRect(-8, -43, 16, 3); c.fillRect(-8, -66, 16, 3); c.strokeStyle = L; c.lineWidth = 0.9; c.strokeRect(-8, -43, 16, 3); c.strokeRect(-8, -66, 16, 3);
      const glass = () => { c.beginPath(); c.moveTo(-6, -63); c.quadraticCurveTo(-6, -55, -1, -53); c.quadraticCurveTo(-6, -51, -6, -43); c.lineTo(6, -43); c.quadraticCurveTo(6, -51, 1, -53); c.quadraticCurveTo(6, -55, 6, -63); c.closePath(); };
      glass(); c.fillStyle = 'rgba(210,230,250,.35)'; c.fill(); c.save(); glass(); c.clip(); c.fillStyle = ILG(c, -6, 0, 6, 0, [[0, '#FFE9A8'], [1, '#C7943E']]); c.beginPath(); c.moveTo(-6, -43); c.quadraticCurveTo(0, -50, 6, -43); c.fill(); c.fillRect(-6, -63, 12, 4); c.fillRect(-0.5, -56, 1, 10); c.restore(); glass(); IINK(c, 1); IHL(c, -4.5, -61, -4.6, -56, 0.7); IHL(c, -4.5, -50, -4.4, -45, 0.6);
      glowAt(c, 0, -53, 14, '#F2D8A1', 0.35); c.restore(); },
    // the Pale Aurora: an arch of ice blocks hung with icicles under ribbons of the aurora
    aurora(c, x, y) { c.save(); c.translate(x, y); c.save(); c.globalCompositeOperation = 'lighter'; ['#8FE0A6', '#B983F5', '#7FD3F2'].forEach((col, i) => { for (let k = 0; k < 2; k++) { c.strokeStyle = col; c.globalAlpha = k ? 0.6 : 0.25; c.lineWidth = k ? 2 : 9; c.beginPath(); c.moveTo(-44, -52 + i * 6); c.quadraticCurveTo(-10, -74 + i * 8, 20, -54 + i * 6); c.quadraticCurveTo(40, -44 + i * 6, 50, -60 + i * 6); c.stroke(); } }); c.restore();
      ISH(c, 4, 5, 32, 7);
      const N = 9; for (let i = 0; i < N; i++) { const a0 = Math.PI + i / N * Math.PI, a1 = Math.PI + (i + 1) / N * Math.PI, ro = 26, ri = 15, cx = 0, cy = 2, p = [[cx + Math.cos(a0) * ro, cy + Math.sin(a0) * ro * 1.15], [cx + Math.cos(a1) * ro, cy + Math.sin(a1) * ro * 1.15], [cx + Math.cos(a1) * ri, cy + Math.sin(a1) * ri * 1.15], [cx + Math.cos(a0) * ri, cy + Math.sin(a0) * ri * 1.15]];
        const lit = i < N / 2; IP(c, p); c.fillStyle = ILG(c, p[0][0], p[0][1], p[2][0], p[2][1], lit ? [[0, '#FFFFFF'], [0.5, '#D8F2FF'], [1, '#9ED4EE']] : [[0, '#C6E8F8'], [0.6, '#8EC4E0'], [1, '#5E98BC']]); c.fill(); IINK(c, 1); IHL(c, p[0][0] + 1, p[0][1] + 1, p[1][0] - 1, p[1][1] + 1, 0.6); }
      [[-26, 2], [26, 2]].forEach(([px]) => { c.fillStyle = ILG(c, px - 6, 0, px + 6, 0, px < 0 ? [[0, '#FFFFFF'], [1, '#A6D8F0']] : [[0, '#A6D8F0'], [1, '#5E98BC']]); c.fillRect(px - 6, -2, 12, 6); c.strokeStyle = L; c.lineWidth = 1; c.strokeRect(px - 6, -2, 12, 6); });
      c.fillStyle = 'rgba(30,70,110,.55)'; c.beginPath(); c.moveTo(-15, 4); c.lineTo(-15, 2); c.ellipse(0, 2, 15, 17, 0, Math.PI, 0); c.lineTo(15, 4); c.closePath(); c.fill(); glowAt(c, 0, -6, 12, '#BFE6FF', 0.45);
      for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI, px = Math.cos(a) * 15, py = 2 + Math.sin(a) * 17.2, L2 = 3 + (i % 3) * 2; c.fillStyle = ILG(c, px - 1, py, px + 1, py, [[0, '#FFFFFF'], [1, '#8EC4E0']]); IP(c, [[px - 1.3, py], [px, py + L2], [px + 1.3, py]]); c.fill(); }
      c.restore(); },
    // the Yuggoth Engine: a fallen saucer of dark metal half buried in a crater, its dome lit, its lights blue, steam rising
    yuggoth(c, x, y) { c.save(); c.translate(x, y); ISH(c, 4, 9, 48, 12, 0.25);
      IGND(c, 0, 6, 58, 17, '#5A5250', 0.95); IGND(c, -8, 3, 30, 9, '#8A8078', 0.55);
      [[-34, 4, 5], [-24, 12, 4], [30, 10, 5], [38, 2, 3.5], [10, 15, 4]].forEach(([a, b, r]) => { c.fillStyle = ILG(c, a - r, b - r, a + r, b + r, [[0, '#B0A69C'], [1, '#4A4240']]); c.beginPath(); c.ellipse(a, b, r, r * 0.7, 0, 0, TAU); c.fill(); IINK(c, 0.8); });
      c.save(); c.rotate(-0.32);
      c.fillStyle = IRG(c, -2, -26, 1, 0, -22, 14, [[0, '#FFFFFF'], [0.35, '#BFE6FF'], [1, '#3E6E98']]); c.beginPath(); c.ellipse(0, -18, 13, 12, 0, Math.PI, 0); c.fill(); IINK(c, 1.1); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.2; c.beginPath(); c.arc(-3, -21, 7, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
      c.fillStyle = ILG(c, 0, -22, 0, -6, [[0, '#D4DAE4'], [0.35, '#8A96A8'], [0.6, '#4A5468'], [1, '#222838']]); c.beginPath(); c.ellipse(0, -14, 32, 10, 0, 0, TAU); c.fill(); IINK(c, 1.3);
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, -15.5, 29, 7.5, 0, Math.PI * 1.08, Math.PI * 1.7); c.stroke(); c.strokeStyle = 'rgba(20,24,36,.6)'; c.beginPath(); c.ellipse(0, -13, 26, 6, 0, 0.2, Math.PI - 0.2); c.stroke();
      for (let i = -3; i <= 3; i++) { const px = i * 8, py = -12 + Math.abs(i) * -0.6; glowAt(c, px, py, 5, '#9FD8FF', 0.7); c.fillStyle = '#E8F8FF'; c.beginPath(); c.arc(px, py, 1.7, 0, TAU); c.fill(); }
      c.restore();
      c.save(); c.globalAlpha = 0.6; [[-18, -32, 6], [-24, -42, 8], [-14, -50, 7]].forEach(([a, b, r]) => { c.fillStyle = IRG(c, a - 2, b - 2, 1, a, b, r, [[0, 'rgba(255,255,255,.9)'], [1, 'rgba(220,226,236,0)']]); c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); }); c.restore();
      c.restore(); },
    // the Library of Unwritten Lives: a great open book on a lectern of stone, its pages fanned, a flame of light rising from it
    library(c, x, y) { c.save(); c.translate(x, y); ISH(c, 4, 8, 44, 8);
      c.fillStyle = ILG(c, 0, -2, 0, 10, [[0, '#8A6A44'], [1, '#4A3420']]); c.beginPath(); c.moveTo(-42, 2); c.quadraticCurveTo(-21, -6, 0, 2); c.quadraticCurveTo(21, -6, 42, 2); c.lineTo(42, 9); c.quadraticCurveTo(21, 3, 0, 9); c.quadraticCurveTo(-21, 3, -42, 9); c.closePath(); c.fill(); IINK(c, 1.3);
      c.fillStyle = '#C7943E'; [[-38, 4], [38, 4]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b + 1, 2, 0, TAU); c.fill(); });
      for (let k = 4; k >= 0; k--) { const o = k * 1.1; [-1, 1].forEach(sd => { c.fillStyle = k ? (k % 2 ? '#E8DCC2' : '#D4C6A8') : '#FFF8E8'; c.beginPath(); c.moveTo(sd * 2, 1 - o); c.quadraticCurveTo(sd * 18, -12 - o, sd * 38, -1 - o * 0.5); c.lineTo(sd * 38, 3 - o * 0.5); c.quadraticCurveTo(sd * 18, -6 - o, sd * 2, 5 - o); c.closePath(); c.fill(); c.strokeStyle = 'rgba(58,42,30,.55)'; c.lineWidth = 0.6; c.stroke(); }); }
      [-1, 1].forEach(sd => { c.fillStyle = ILG(c, sd * 2, 0, sd * 38, 0, [[0, 'rgba(120,96,60,.35)'], [0.3, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); c.beginPath(); c.moveTo(sd * 2, -4.5); c.quadraticCurveTo(sd * 18, -17.5, sd * 38, -6.5); c.lineTo(sd * 38, -2.5); c.quadraticCurveTo(sd * 18, -11.5, sd * 2, -0.5); c.closePath(); c.fill(); });
      c.strokeStyle = 'rgba(58,42,30,.45)'; c.lineWidth = 0.8; for (let i = 0; i < 4; i++) { [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(sd * 8, -6 - i * 2.4 + 0.5); c.quadraticCurveTo(sd * 18, -12.5 - i * 2.2, sd * 32, -5 - i * 2.2); c.stroke(); }); }
      glowAt(c, 0, -22, 26, '#FFE9A8', 0.7); c.fillStyle = IRG(c, 0, -14, 1, 0, -18, 12, [[0, '#FFFFFF'], [0.4, '#FFE9A8'], [1, 'rgba(255,190,90,0)']]); c.beginPath(); c.moveTo(0, -38); c.quadraticCurveTo(5, -24, 3.5, -16); c.quadraticCurveTo(0, -11, -3.5, -16); c.quadraticCurveTo(-5, -24, 0, -38); c.fill();
      c.fillStyle = 'rgba(90,64,30,.8)'; c.font = 'italic 700 7px Georgia, serif'; [['a', -14, -30], ['ω', 12, -34], ['ψ', -8, -44], ['§', 16, -24]].forEach(([t, a, b]) => c.fillText(t, a, b));
      c.restore(); },
    // the Hollow Moon: a stone moon fallen into a cradle of rock, cratered and lit from the top left, a hollow of night and stars in its face
    moon(c, x, y) { c.save(); c.translate(x, y); glowAt(c, 0, -24, 48, '#DCEFFF', 0.45); IGND(c, 0, 4, 40, 11, '#6E6488', 0.6); ISH(c, 6, 4, 30, 7);
      [[-22, 2, 9], [20, 3, 8], [-10, 5, 6], [10, 6, 6]].forEach(([a, b, r]) => { c.fillStyle = ILG(c, a - r, b - r, a + r, b + r, [[0, '#A89CB8'], [1, '#4E4462']]); c.beginPath(); c.ellipse(a, b, r, r * 0.6, 0, 0, TAU); c.fill(); IINK(c, 0.9); });
      c.fillStyle = IRG(c, -10, -34, 3, 0, -22, 28, [[0, '#FFFFFF'], [0.45, '#E2DEEE'], [0.8, '#A8A0C0'], [1, '#6E6688']]); c.beginPath(); c.arc(0, -22, 26, 0, TAU); c.fill(); IINK(c, 1.3);
      [[-12, -32, 5.5], [10, -10, 4], [-14, -12, 3], [12, -36, 2.5], [-2, -42, 2.2]].forEach(([a, b, r]) => { c.fillStyle = IRG(c, a + r * 0.3, b + r * 0.3, 0.2, a, b, r, [[0, '#B4ACC8'], [1, '#8E86A6']]); c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 0.8; c.beginPath(); c.arc(a, b, r, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke(); c.strokeStyle = 'rgba(70,60,96,.5)'; c.beginPath(); c.arc(a, b, r, 1.1 * Math.PI, 1.9 * Math.PI); c.stroke(); });
      c.fillStyle = IRG(c, 6, -18, 1, 5, -20, 13, [[0, '#0E0A22'], [0.8, '#2A1F44'], [1, '#4A3E6E']]); c.beginPath(); c.ellipse(5, -20, 11, 13, 0.3, 0, TAU); c.fill(); IINK(c, 1.1); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(5, -20, 11, 13, 0.3, 0.1 * Math.PI, 0.7 * Math.PI); c.stroke();
      c.fillStyle = '#FFFFFF'; [[2, -24, 1.2], [8, -16, 1], [1, -14, 0.8], [7, -27, 0.7], [10, -21, 0.6]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); }); glowAt(c, 5, -20, 8, '#B983F5', 0.4);
      c.restore(); },
    // the Basilica of the Veiled Eye: a nave and two bell towers of pale stone, a rose window that is an eye, veiled
    basilica(c, x, y) { c.save(); c.translate(x, y); IGND(c, 0, 5, 46, 12, '#A6A096', 0.5); ISH(c, 6, 6, 40, 8);
      IP(c, [[-18, 4], [-18, -18], [18, -18], [18, 4]]); c.fillStyle = ILG(c, -18, 0, 18, 0, [[0, '#D8D2C4'], [1, '#9A948A']]); c.fill(); IINK(c, 1.2);
      IP(c, [[18, 4], [18, -18], [28, -22], [28, 0]]); c.fillStyle = ILG(c, 18, 0, 28, 0, [[0, '#7A746C'], [1, '#55504A']]); c.fill(); IINK(c, 1);
      IP(c, [[-20, -18], [0, -36], [20, -18]]); c.fillStyle = ILG(c, -20, -36, 20, -18, [[0, '#E8E2D4'], [1, '#A6A096']]); c.fill(); IINK(c, 1.2); IP(c, [[20, -18], [0, -36], [10, -40], [30, -22]]); c.fillStyle = '#6E6860'; c.fill(); IINK(c, 1);
      [-26, 26].forEach(px => { const w = 6; c.fillStyle = ICYL(c, px - w, px + w, '#C8C2B4'); c.fillRect(px - w, -30, w * 2, 34); c.strokeStyle = L; c.lineWidth = 1.1; c.strokeRect(px - w, -30, w * 2, 34); IP(c, [[px - w - 1, -30], [px, -50], [px + w + 1, -30]]); c.fillStyle = ILG(c, px - w, -50, px + w, -30, [[0, '#8A9AB8'], [0.5, '#5E6E8E'], [1, '#3A4660']]); c.fill(); IINK(c, 1.1); c.fillStyle = '#2A2433'; c.beginPath(); c.moveTo(px - 2, -16); c.lineTo(px - 2, -22); c.arc(px, -22, 2, Math.PI, 0); c.lineTo(px + 2, -16); c.closePath(); c.fill(); c.fillStyle = '#C7943E'; c.fillRect(px - 0.6, -56, 1.2, 6); });
      c.fillStyle = '#2A2433'; c.beginPath(); c.moveTo(-4, 4); c.lineTo(-4, -4); c.arc(0, -4, 4, Math.PI, 0); c.lineTo(4, 4); c.closePath(); c.fill();
      c.fillStyle = IRG(c, -2, -24, 1, 0, -22, 9, [[0, '#FFFFFF'], [1, '#D8CCE8']]); c.beginPath(); c.ellipse(0, -22, 9, 6, 0, 0, TAU); c.fill(); IINK(c, 1); c.fillStyle = IRG(c, -1, -23, 0.5, 0, -22, 4, [[0, '#C8A8FF'], [1, '#5A2E9A']]); c.beginPath(); c.arc(0, -22, 3.8, 0, TAU); c.fill(); c.fillStyle = '#1A1024'; c.beginPath(); c.arc(0, -22, 1.6, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-1, -23.2, 0.8, 0, TAU); c.fill();
      c.fillStyle = 'rgba(185,131,245,.4)'; c.beginPath(); c.moveTo(-12, -31); c.quadraticCurveTo(-4, -26, 0, -27); c.quadraticCurveTo(4, -26, 12, -31); c.lineTo(11, -14); c.quadraticCurveTo(6, -19, 0, -16); c.quadraticCurveTo(-6, -19, -11, -14); c.closePath(); c.fill(); c.strokeStyle = 'rgba(230,210,255,.6)'; c.lineWidth = 0.7; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 4, -28); c.quadraticCurveTo(i * 4.4, -22, i * 4.2, -16); c.stroke(); }
      c.restore(); },
    // the Sea of Fallen Colours: a deep pool ringed with dark rock, shards of colour fallen into it, glowing
    colours(c, x, y) { c.save(); c.translate(x, y); ISH(c, 4, 6, 44, 11);
      IGND(c, 0, 1, 52, 19, '#4A4258', 0.95);
      c.fillStyle = IRG(c, 4, 2, 2, 0, 0, 36, [[0, '#2A3A8A'], [0.6, '#1B1F4A'], [1, '#0C0E26']]); c.beginPath(); c.ellipse(0, 0, 36, 12.5, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(160,190,255,.4)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 33, 11, 0, Math.PI * 1.1, Math.PI * 1.75); c.stroke();
      ['#FF6F59', '#FFE37A', '#7FD3F2', '#FF9BD2', '#8FE0A6', '#B983F5'].forEach((col, i) => { const a = i / 6 * TAU + 0.4, px = Math.cos(a) * 21, py = Math.sin(a) * 6.5; glowAt(c, px, py, 11, col, 0.75); c.fillStyle = ILG(c, px - 4, py - 7, px + 4, py + 2, [[0, '#FFFFFF'], [0.4, col], [1, shade(col, 0.55)]]); IP(c, [[px - 3, py + 1], [px - 1, py - 7 - (i % 2) * 2], [px + 3, py - 2], [px + 2, py + 2]]); c.fill(); IINK(c, 0.8); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(px, py + 2.5, 4, 1.2, 0, 0, TAU); c.fill(); });
      [[-36, -6], [-28, 10], [34, -8], [30, 9], [0, 13], [-6, -13]].forEach(([a, b], i) => { c.fillStyle = ILG(c, a - 4, b - 4, a + 4, b + 3, [[0, '#9A90AA'], [1, '#3A3446']]); c.beginPath(); c.ellipse(a, b, 4 + (i % 2), 2.6, 0, 0, TAU); c.fill(); IINK(c, 0.7); });
      c.restore(); },
    // the Choir Before Creation: organ-pipe spires of pale stone banded with gold, light at their mouths, rising from one plinth
    choir(c, x, y) { c.save(); c.translate(x, y); IGND(c, 0, 3, 38, 11, '#A8A090', 0.55); ISH(c, 6, 6, 30, 7);
      c.fillStyle = ILG(c, 0, -4, 0, 6, [[0, '#E2DAC8'], [1, '#8E8A80']]); c.beginPath(); c.ellipse(0, 2, 26, 7, 0, 0, TAU); c.fill(); IINK(c, 1.1);
      [[-14, 34, 4.5], [14, 40, 4.5], [-7, 52, 5.2], [7, 58, 5.2], [0, 72, 6]].forEach(([px, h, w]) => { const top = -h; c.fillStyle = ICYL(c, px - w, px + w, '#E6DCC8'); c.fillRect(px - w, top, w * 2, h + 2); c.strokeStyle = L; c.lineWidth = 1.1; c.strokeRect(px - w, top, w * 2, h + 2);
        c.fillStyle = '#2A2433'; c.beginPath(); c.moveTo(px - w * 0.6, top + 12); c.lineTo(px, top + 7); c.lineTo(px + w * 0.6, top + 12); c.closePath(); c.fill(); glowAt(c, px, top + 10, 6, '#FFE37A', 0.6);
        [0.35, 0.7].forEach(u => { const yy = top + h * u; c.fillStyle = ILG(c, px - w, 0, px + w, 0, [[0, '#FFF2B8'], [0.5, '#D9A848'], [1, '#7A5418']]); c.fillRect(px - w - 0.8, yy, w * 2 + 1.6, 2.2); c.strokeStyle = L; c.lineWidth = 0.6; c.strokeRect(px - w - 0.8, yy, w * 2 + 1.6, 2.2); });
        c.fillStyle = ICYL(c, px - w - 1, px + w + 1, '#F2EAD6'); c.beginPath(); c.ellipse(px, top, w + 1, 1.8, 0, 0, TAU); c.fill(); IINK(c, 0.8); });
      glowAt(c, 0, -76, 16, '#FFE37A', 0.85); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,230,140,.6)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -76, 6 + i * 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); } c.restore();
      c.restore(); },
    // the Threshold of All Doors: a ring of standing doors on a round stone dais, each door open on a light of its own
    threshold(c, x, y) { c.save(); c.translate(x, y); IGND(c, 0, 8, 62, 20, '#2E3058', 0.7); ISH(c, 6, 9, 50, 12);
      c.fillStyle = ILG(c, 0, -12, 0, 20, [[0, '#4A4C78'], [1, '#1E2040']]); c.beginPath(); c.ellipse(0, 6, 48, 16, 0, 0, TAU); c.fill(); IINK(c, 1.2); c.fillStyle = ILG(c, 0, -10, 0, 14, [[0, '#6A6C9E'], [1, '#2E3058']]); c.beginPath(); c.ellipse(0, 3, 44, 13.5, 0, 0, TAU); c.fill(); IINK(c, 0.9);
      c.strokeStyle = 'rgba(200,210,255,.45)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(0, 3, 22, 6.5, 0, 0, TAU); c.stroke(); glowAt(c, 0, 2, 18, '#BFE6FF', 0.4);
      const doors = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.26; doors.push([Math.cos(a) * 33, Math.sin(a) * 9.5, a]); } doors.sort((p, q) => p[1] - q[1]);
      const LIT = ['#A8DEF2', '#FFD27A', '#FF9BD2', '#8FE0A6', '#C8A8FF', '#FFFFFF'];
      doors.forEach(([px, py, a], i) => { const sw = 0.55 + 0.45 * Math.abs(Math.cos(a)) * 0 + 0.45, w = 6.2, h = 24;
        c.fillStyle = ILG(c, px - w, 0, px + w, 0, [[0, '#F0F2F8'], [0.6, '#B8BCD0'], [1, '#7A7E98']]); c.beginPath(); c.moveTo(px - w, py); c.lineTo(px - w, py - h + 5); c.quadraticCurveTo(px - w, py - h, px, py - h - 1); c.quadraticCurveTo(px + w, py - h, px + w, py - h + 5); c.lineTo(px + w, py); c.closePath(); c.fill(); IINK(c, 1);
        const col = LIT[Math.round((a / TAU) * 6) % 6]; glowAt(c, px, py - 10, 9, col, 0.6); c.fillStyle = ILG(c, px, py - h + 3, px, py, [[0, '#FFFFFF'], [0.5, col], [1, shade(col, 0.6)]]); c.beginPath(); c.moveTo(px - w + 2.2, py); c.lineTo(px - w + 2.2, py - h + 6); c.quadraticCurveTo(px - w + 2.2, py - h + 2.5, px, py - h + 2); c.quadraticCurveTo(px + w - 2.2, py - h + 2.5, px + w - 2.2, py - h + 6); c.lineTo(px + w - 2.2, py); c.closePath(); c.fill();
        c.fillStyle = 'rgba(40,30,60,.55)'; IP(c, [[px + w - 2.2, py], [px + w - 2.2, py - h + 6], [px + w + 3, py - h + 4], [px + w + 3, py - 1]]); c.fill(); IINK(c, 0.6); c.fillStyle = '#C7943E'; c.beginPath(); c.arc(px + w + 1.8, py - 11, 0.8, 0, TAU); c.fill(); });
      c.restore(); },
    // (v386) the Blackfire Caldera: a broken volcanic cone of black basalt, its crater a lake of molten light, lava running
    // down its flanks in glowing seams, dark fire crystals breaking from its sides, smoke and embers over it
    caldera(c, x, y) { c.save(); c.translate(x, y); glowAt(c, 0, -30, 70, '#FF6A1E', 0.4); ISH(c, 6, 6, 52, 12, 0.3);
      IGND(c, 0, 4, 66, 20, '#3A2C2A', 0.85);
      const cone = [[-50, 6], [-36, -12], [-24, -30], [-15, -40], [15, -40], [24, -31], [37, -12], [52, 6]];
      IP(c, cone); c.fillStyle = ILG(c, -50, -40, 52, 6, [[0, '#6E5E5A'], [0.35, '#4A3C3A'], [0.7, '#2C2224'], [1, '#18121A']]); c.fill(); IINK(c, 1.3);
      IP(c, [[0, -38], [15, -40], [24, -31], [37, -12], [52, 6], [10, 6]]); c.fillStyle = 'rgba(14,8,14,.38)'; c.fill();
      c.strokeStyle = 'rgba(20,12,16,.5)'; c.lineWidth = 0.8; for (let i = 0; i < 8; i++) { const a = -40 + i * 11; c.beginPath(); c.moveTo(a * 0.4, -36); c.quadraticCurveTo(a * 0.7, -16, a, 4); c.stroke(); }
      // lava down the flanks
      c.save(); c.globalCompositeOperation = 'lighter'; [[-8, -36, -18, 2], [10, -36, 22, 0], [-2, -36, 4, 4]].forEach(([a, b, d, e], i) => { for (let k = 0; k < 2; k++) { c.strokeStyle = k ? 'rgba(255,214,120,.9)' : 'rgba(255,90,20,.6)'; c.lineWidth = k ? 1.1 : 3.4; c.beginPath(); c.moveTo(a, b); c.bezierCurveTo(a + (i - 1) * 4, b + 12, d - (i - 1) * 3, e - 14, d, e); c.stroke(); } }); c.restore();
      // the crater: a lip of lit rock round a lake of molten light
      c.fillStyle = ILG(c, -16, -46, 16, -36, [[0, '#8A7470'], [1, '#3A2C2E']]); c.beginPath(); c.ellipse(0, -40, 17, 6, 0, 0, TAU); c.fill(); IINK(c, 1.1);
      c.fillStyle = IRG(c, -2, -41, 1, 0, -40, 13, [[0, '#FFF2B0'], [0.35, '#FFB040'], [0.75, '#E8481A'], [1, '#7A1A0C']]); c.beginPath(); c.ellipse(0, -40, 13, 4.2, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(60,14,8,.6)'; c.lineWidth = 0.7; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-10 + i * 6, -41); c.lineTo(-7 + i * 6, -39); c.stroke(); }
      glowAt(c, 0, -42, 26, '#FF7A2E', 0.7);
      // dark fire crystals on its flanks: glossy black, red fractures
      [[-34, -6, 1], [30, -4, -1], [-22, 2, 1]].forEach(([px, py, sd], i) => { const h = 14 + i * 3; c.fillStyle = ILG(c, px - 3, py - h, px + 4, py, [[0, '#5A3A6E'], [0.5, '#22162E'], [1, '#0C0812']]); IP(c, [[px - 4, py], [px - 1 + sd * 2, py - h], [px + 4, py]]); c.fill(); IINK(c, 0.9); c.strokeStyle = 'rgba(255,90,30,.85)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px - 0.5, py - 2); c.lineTo(px + sd, py - h * 0.6); c.stroke(); glowAt(c, px, py - h * 0.4, 7, '#FF4A1E', 0.4);
        const q = px + sd * 6; c.fillStyle = ILG(c, q - 2, py - h * 0.6, q + 3, py, [[0, '#4A2E5E'], [1, '#0C0812']]); IP(c, [[q - 2.5, py + 1], [q + sd * 2, py - h * 0.6], [q + 2.5, py + 1]]); c.fill(); IINK(c, 0.8); });
      // smoke and embers
      c.save(); c.globalAlpha = 0.55; [[-4, -58, 9], [6, -70, 12], [-2, -84, 14]].forEach(([a, b, r]) => { c.fillStyle = IRG(c, a - 2, b - 3, 1, a, b, r, [[0, 'rgba(90,80,86,.9)'], [1, 'rgba(60,54,60,0)']]); c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); }); c.restore();
      c.fillStyle = '#FFC860'; [[-10, -54], [8, -60], [3, -66], [-6, -72], [12, -50]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 0.9, 0, TAU); c.fill(); });
      c.restore(); },
    // R'lyeh: a drowned city risen, black-green spires leaning, wet with light, its windows lit sea green
    rlyeh(c, x, y) { c.save(); c.translate(x, y); glowAt(c, 0, -14, 66, '#5FE8C8', 0.32); c.fillStyle = 'rgba(30,80,70,.55)'; c.beginPath(); c.ellipse(0, 2, 46, 10, 0, 0, TAU); c.fill();
      [[-32, 0, 12, 30, -0.1], [-15, 0, 15, 50, 0.05], [3, 0, 11, 38, -0.08], [17, 0, 13, 28, 0.12], [30, 0, 9, 20, -0.15]].forEach(([px, py, w, h, lean]) => { const tx = px + w * 0.35 + lean * h;
        IP(c, [[px, py], [tx, -h], [tx + w * 0.4, -h * 0.85], [px + w * 0.62, py]]); c.fillStyle = ILG(c, px, -h, px + w * 0.6, 0, [[0, '#4E7A6E'], [0.5, '#24443C'], [1, '#132622']]); c.fill(); IINK(c, 1.1);
        IP(c, [[px + w * 0.62, py], [tx + w * 0.4, -h * 0.85], [px + w, py]]); c.fillStyle = ILG(c, px + w * 0.6, 0, px + w, 0, [[0, '#14241F'], [1, '#08120F']]); c.fill(); IINK(c, 0.9);
        IHL(c, px + 1, py - 2, tx + 0.5, -h + 3, 0.35); for (let k = 0; k < 3; k++) { const yy = -h * (0.3 + k * 0.18), xx = px + w * 0.32 + lean * h * (0.3 + k * 0.18); glowAt(c, xx, yy, 4, '#5FE8C8', 0.6); c.fillStyle = '#B8FFEC'; c.fillRect(xx - 0.8, yy - 1.6, 1.6, 3.2); } });
      c.strokeStyle = 'rgba(200,255,240,.55)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 3, 40, 7, 0, 0.1, Math.PI - 0.1); c.stroke();
      c.restore(); },
  };
  /* (v382) the Tower of Oblivion, an illustrated model: a faceted crag of violet stone (each face lit from the top left,
     cracks, moss, pebbles, shade at its foot); the shaft a tapering stone cylinder shaded round (a cool rim of light on
     its left, night on its right), stone courses curving round it, buttress ribs, arched windows glowing pink; two
     balconies ringed with crenels and glowing runes; a corbelled crown; a tiled conical spire with a gold finial, an orb
     and a crescent; a violet ribbon of magic spiralling round it (behind, then in front), motes, and shaded clouds
     wrapping its middle */
  function towerOfOblivion(c, Tx, Ty) {
    const R = mulberry32(868), cyl = (y0, y1, w0, w1, stops) => { const g = c.createLinearGradient(Tx - Math.max(w0, w1), 0, Tx + Math.max(w0, w1), 0); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.beginPath(); c.moveTo(Tx - w0, y0); c.lineTo(Tx - w1, y1); c.quadraticCurveTo(Tx, y1 + w1 * 0.28, Tx + w1, y1); c.lineTo(Tx + w0, y0); c.quadraticCurveTo(Tx, y0 + w0 * 0.3, Tx - w0, y0); c.closePath(); c.fill(); };
    const STONE = [[0, '#8C7CC8'], [0.18, '#5E4E9A'], [0.5, '#3A2E6A'], [0.8, '#221A44'], [0.94, '#17102E'], [1, '#2C2356']];
    const wAt = yy => 17 - (Ty - 8 - yy) / 88 * 4.5;   // the shaft's half width at height yy
    const helix = (front) => { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? 'rgba(255,214,250,.85)' : 'rgba(185,131,245,.45)'; c.lineWidth = pass ? 1.4 : 5.5; c.beginPath(); let on = false;
        for (let i = 0; i <= 90; i++) { const u = i / 90, a = u * Math.PI * 4.2 + 0.6, yy = Ty - 14 - u * 100, r = wAt(yy) + 9 + 3 * Math.sin(u * 9), xx = Tx + Math.cos(a) * r, isF = Math.sin(a) > 0;
          if (isF === front) { if (!on) { c.moveTo(xx, yy + Math.sin(a) * 4); on = true; } else c.lineTo(xx, yy + Math.sin(a) * 4); } else on = false; }
        c.stroke(); } c.restore(); };
    const cloud = (cx, cy, w, k) => { c.save(); c.globalAlpha = k; [[-0.6, 0.2, 0.42], [-0.2, -0.15, 0.55], [0.25, -0.05, 0.5], [0.62, 0.22, 0.38]].forEach(([dx, dy, r]) => { const X = cx + dx * w, Y = cy + dy * w * 0.5, rr2 = r * w * 0.55, g = c.createRadialGradient(X - rr2 * 0.3, Y - rr2 * 0.4, rr2 * 0.1, X, Y, rr2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.7, '#EEE8FA'); g.addColorStop(1, 'rgba(206,196,236,0)'); c.fillStyle = g; c.beginPath(); c.arc(X, Y, rr2, 0, TAU); c.fill(); }); c.fillStyle = 'rgba(150,135,200,.35)'; c.beginPath(); c.ellipse(cx, cy + w * 0.14, w * 0.75, w * 0.1, 0, 0, TAU); c.fill(); c.restore(); };
    // its light over the land
    { const g = c.createRadialGradient(Tx, Ty - 70, 6, Tx, Ty - 70, 120); g.addColorStop(0, 'rgba(185,131,245,.45)'); g.addColorStop(1, 'rgba(185,131,245,0)'); c.fillStyle = g; c.fillRect(Tx - 120, Ty - 190, 240, 240); }
    // the crag: faces lit from the top left; (v383) drawn on a canvas of its own and faded at its foot over a soft apron of
    // scree and shade, so it rises out of the land rather than sitting on it
    { const g = c.createRadialGradient(Tx + 4, Ty + 8, 4, Tx + 4, Ty + 8, 66); g.addColorStop(0, 'rgba(70,58,96,.55)'); g.addColorStop(0.45, 'rgba(90,80,110,.3)'); g.addColorStop(1, 'rgba(90,80,110,0)'); c.save(); c.translate(0, Ty + 8); c.scale(1, 0.32); c.translate(0, -(Ty + 8)); c.fillStyle = g; c.beginPath(); c.arc(Tx + 4, Ty + 8, 66, 0, TAU); c.fill(); c.restore(); }
    { const g = c.createRadialGradient(Tx + 8, Ty + 10, 2, Tx + 8, Ty + 10, 50); g.addColorStop(0, 'rgba(25,20,40,.34)'); g.addColorStop(1, 'rgba(25,20,40,0)'); c.save(); c.translate(0, Ty + 10); c.scale(1, 0.22); c.translate(0, -(Ty + 10)); c.fillStyle = g; c.beginPath(); c.arc(Tx + 8, Ty + 10, 50, 0, TAU); c.fill(); c.restore(); }
    for (let i = 0; i < 22; i++) { const a = R() * TAU, r = 44 + R() * 16, px = Tx + 2 + Math.cos(a) * r, py = Ty + 9 + Math.sin(a) * r * 0.28; c.fillStyle = shade('#6E6290', 0.65 + R() * 0.55); c.globalAlpha = 0.5 + R() * 0.4; c.beginPath(); c.ellipse(px, py, 1.2 + R() * 1.8, 0.8 + R() * 0.9, 0, 0, TAU); c.fill(); } c.globalAlpha = 1;
    const c0T = c, ocT = document.createElement('canvas'), kzT = Math.max(1, Math.hypot(c.getTransform().a, c.getTransform().b)); ocT.width = Math.ceil(110 * kzT); ocT.height = Math.ceil(40 * kzT);
    { const c = ocT.getContext('2d'); c.setTransform(kzT, 0, 0, kzT, -(Tx - 55) * kzT, -(Ty - 24) * kzT);
    c.save();
    c.save(); c.fillStyle = 'rgba(25,20,40,.3)'; c.beginPath(); c.ellipse(Tx + 8, Ty + 13, 52, 8, 0, 0, TAU); c.fill();
    const crag = [[Tx - 48, Ty + 12], [Tx - 40, Ty - 4], [Tx - 28, Ty - 16], [Tx - 14, Ty - 10], [Tx - 2, Ty - 20], [Tx + 14, Ty - 14], [Tx + 30, Ty - 18], [Tx + 40, Ty - 4], [Tx + 50, Ty + 12]];
    const faces = [[[Tx - 48, Ty + 12], [Tx - 40, Ty - 4], [Tx - 28, Ty - 16], [Tx - 22, Ty + 2], [Tx - 30, Ty + 12]], [[Tx - 28, Ty - 16], [Tx - 14, Ty - 10], [Tx - 8, Ty + 4], [Tx - 22, Ty + 2]], [[Tx - 14, Ty - 10], [Tx - 2, Ty - 20], [Tx + 4, Ty + 2], [Tx - 8, Ty + 4]], [[Tx - 2, Ty - 20], [Tx + 14, Ty - 14], [Tx + 18, Ty + 4], [Tx + 4, Ty + 2]], [[Tx + 14, Ty - 14], [Tx + 30, Ty - 18], [Tx + 32, Ty + 6], [Tx + 18, Ty + 4]], [[Tx + 30, Ty - 18], [Tx + 40, Ty - 4], [Tx + 50, Ty + 12], [Tx + 32, Ty + 12], [Tx + 32, Ty + 6]], [[Tx - 30, Ty + 12], [Tx - 22, Ty + 2], [Tx - 8, Ty + 4], [Tx + 4, Ty + 2], [Tx + 18, Ty + 4], [Tx + 32, Ty + 6], [Tx + 32, Ty + 12]]];
    const fk = [1.35, 1.05, 1.2, 0.85, 0.72, 0.55, 0.62];
    faces.forEach((f, i) => { const g = c.createLinearGradient(f[0][0], f[0][1] - 8, f[2][0], f[2][1] + 10); g.addColorStop(0, shade('#6E6290', fk[i] * 1.12)); g.addColorStop(1, shade('#6E6290', fk[i] * 0.82)); c.fillStyle = g; c.beginPath(); f.forEach(([a, b], k) => k ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.fill(); c.strokeStyle = 'rgba(30,22,48,.45)'; c.lineWidth = 0.7; c.stroke(); });
    c.strokeStyle = 'rgba(20,14,30,.45)'; c.lineWidth = 0.8; [[Tx - 36, Ty - 2, Tx - 32, Ty + 8], [Tx + 22, Ty - 8, Tx + 26, Ty + 2], [Tx - 6, Ty - 8, Tx - 3, Ty]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo((a + d) / 2 + 2, (b + e) / 2); c.lineTo(d, e); c.stroke(); });
    [[Tx - 34, Ty - 8], [Tx - 20, Ty - 12], [Tx + 36, Ty - 8], [Tx + 8, Ty - 15]].forEach(([a, b]) => { c.fillStyle = '#6E9A58'; c.beginPath(); c.ellipse(a, b, 4, 1.8, -0.2, 0, TAU); c.fill(); c.fillStyle = '#9CC27A'; c.beginPath(); c.ellipse(a - 1, b - 0.6, 2.2, 0.9, -0.2, 0, TAU); c.fill(); });
    for (let i = 0; i < 12; i++) { const a = Tx - 44 + R() * 92, b = Ty + 8 + R() * 5; c.fillStyle = shade('#6E6290', 0.7 + R() * 0.6); c.beginPath(); c.ellipse(a, b, 1.6 + R() * 1.6, 1 + R(), 0, 0, TAU); c.fill(); }
    c.strokeStyle = L; c.lineWidth = 1.2; c.beginPath(); crag.forEach(([a, b], k) => k ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke(); c.restore();
    c.globalCompositeOperation = 'destination-in'; { const g = c.createLinearGradient(0, Ty - 4, 0, Ty + 14); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(Tx - 55, Ty - 24, 110, 40); }
    c0T.drawImage(ocT, Tx - 55, Ty - 24, 110, 40); }
    helix(false);
    cloud(Tx + 26, Ty - 64, 40, 0.75);
    // the shaft: a stone cylinder shaded round, its courses, ribs and glowing windows
    c.save(); cyl(Ty - 6, Ty - 96, 17, 12.5, STONE);
    c.save(); c.beginPath(); c.moveTo(Tx - 17, Ty - 6); c.lineTo(Tx - 12.5, Ty - 96); c.lineTo(Tx + 12.5, Ty - 96); c.lineTo(Tx + 17, Ty - 6); c.quadraticCurveTo(Tx, Ty - 1, Tx - 17, Ty - 6); c.closePath(); c.clip();
    for (let yy = Ty - 10; yy > Ty - 96; yy -= 6) { const w = wAt(yy); c.strokeStyle = 'rgba(12,8,26,.42)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(Tx - w, yy); c.quadraticCurveTo(Tx, yy + w * 0.3, Tx + w, yy); c.stroke(); c.strokeStyle = 'rgba(190,170,255,.12)'; c.beginPath(); c.moveTo(Tx - w, yy - 0.9); c.quadraticCurveTo(Tx, yy + w * 0.3 - 0.9, Tx + w, yy - 0.9); c.stroke();
      const row = Math.round((Ty - yy) / 6); for (let j = -2; j <= 2; j++) { const u = (j + (row % 2 ? 0.5 : 0)) / 3, xx = Tx + Math.sin(u * 1.3) * w; c.strokeStyle = 'rgba(12,8,26,.3)'; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy - 6); c.stroke(); } }
    [-0.62, 0.62].forEach(u => { const g = c.createLinearGradient(Tx + u * 15 - 2, 0, Tx + u * 15 + 2, 0); g.addColorStop(0, u < 0 ? 'rgba(200,185,255,.45)' : 'rgba(120,100,190,.25)'); g.addColorStop(1, 'rgba(10,6,24,.35)'); c.fillStyle = g; c.beginPath(); c.moveTo(Tx + u * 17 - 1.6, Ty - 6); c.lineTo(Tx + u * 12.5 - 1.2, Ty - 96); c.lineTo(Tx + u * 12.5 + 1.2, Ty - 96); c.lineTo(Tx + u * 17 + 1.6, Ty - 6); c.closePath(); c.fill(); });
    c.restore();
    [[Ty - 24, -3], [Ty - 34, 4], [Ty - 54, -4], [Ty - 62, 3], [Ty - 82, -2], [Ty - 88, 5]].forEach(([yy, dx]) => { const X = Tx + dx; glowAt(c, X, yy, 7, '#FF9BD2', 0.55); c.fillStyle = '#2A1838'; c.beginPath(); c.moveTo(X - 2, yy + 4); c.lineTo(X - 2, yy - 2); c.arc(X, yy - 2, 2, Math.PI, 0); c.lineTo(X + 2, yy + 4); c.closePath(); c.fill(); c.fillStyle = '#FFB8E2'; c.beginPath(); c.moveTo(X - 1.2, yy + 3.4); c.lineTo(X - 1.2, yy - 1.8); c.arc(X, yy - 1.8, 1.2, Math.PI, 0); c.lineTo(X + 1.2, yy + 3.4); c.closePath(); c.fill(); });
    c.strokeStyle = L; c.lineWidth = 1.2; c.beginPath(); c.moveTo(Tx - 17, Ty - 6); c.lineTo(Tx - 12.5, Ty - 96); c.moveTo(Tx + 12.5, Ty - 96); c.lineTo(Tx + 17, Ty - 6); c.stroke(); c.restore();
    // the balconies: rings with crenels and runes
    [[Ty - 42, 23], [Ty - 74, 20]].forEach(([yy, w]) => { c.save(); cyl(yy + 3, yy - 3, w, w, STONE); c.fillStyle = 'rgba(10,6,22,.5)'; c.beginPath(); c.ellipse(Tx, yy + 3.5, w, w * 0.22, 0, 0, Math.PI); c.fill();
      c.fillStyle = '#A898E0'; c.beginPath(); c.ellipse(Tx, yy - 3, w, w * 0.22, 0, Math.PI, TAU); c.fill(); c.strokeStyle = L; c.lineWidth = 1; c.beginPath(); c.ellipse(Tx, yy - 3, w, w * 0.22, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(Tx - w, yy - 3); c.lineTo(Tx - w, yy + 3); c.ellipse(Tx, yy + 3, w, w * 0.22, 0, Math.PI, 0, true); c.lineTo(Tx + w, yy - 3); c.stroke();
      for (let k = 0; k < 7; k++) { const a = Math.PI * (0.1 + k * 0.8 / 6), xx = Tx - Math.cos(a) * w, y2 = yy - 3 + Math.sin(a) * w * 0.22, sh2 = 0.6 + 0.6 * Math.sin(a); c.fillStyle = shade('#5E4E9A', sh2 + (xx < Tx ? 0.35 : 0)); c.fillRect(xx - 1.8, y2 - 4.5, 3.6, 4.5); c.strokeStyle = 'rgba(20,14,40,.7)'; c.lineWidth = 0.6; c.strokeRect(xx - 1.8, y2 - 4.5, 3.6, 4.5); }
      c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const a = Math.PI * (0.2 + k * 0.6 / 4), xx = Tx - Math.cos(a) * w * 0.98, y2 = yy + 0.5 + Math.sin(a) * w * 0.2; c.fillStyle = 'rgba(255,155,210,.9)'; c.fillRect(xx - 1, y2 - 1, 2, 2); } c.restore(); c.restore(); });
    // the crown: a corbelled cornice, then the tiled spire, its finial
    c.save(); cyl(Ty - 96, Ty - 104, 15, 19, STONE); for (let k = 0; k < 7; k++) { const u = -0.85 + k * 0.283, xx = Tx + u * 15.5; c.fillStyle = 'rgba(15,10,30,.55)'; c.beginPath(); c.moveTo(xx - 1.4, Ty - 96 + 2); c.lineTo(xx + 1.4, Ty - 96 + 2); c.lineTo(xx + 1.8, Ty - 102); c.lineTo(xx - 1.8, Ty - 102); c.closePath(); c.fill(); }
    c.strokeStyle = L; c.lineWidth = 1; c.beginPath(); c.moveTo(Tx - 15, Ty - 96); c.lineTo(Tx - 19, Ty - 104); c.moveTo(Tx + 15, Ty - 96); c.lineTo(Tx + 19, Ty - 104); c.stroke();
    { const g = c.createLinearGradient(Tx - 20, 0, Tx + 20, 0); g.addColorStop(0, '#7E6CC4'); g.addColorStop(0.25, '#4E3E8E'); g.addColorStop(0.6, '#2A2058'); g.addColorStop(1, '#130C28'); c.fillStyle = g; c.beginPath(); c.moveTo(Tx - 20, Ty - 104); c.quadraticCurveTo(Tx - 8, Ty - 122, Tx, Ty - 152); c.quadraticCurveTo(Tx + 8, Ty - 122, Tx + 20, Ty - 104); c.quadraticCurveTo(Tx, Ty - 99, Tx - 20, Ty - 104); c.closePath(); c.fill();
      c.save(); c.clip(); for (let r2 = 0; r2 < 9; r2++) { const yy = Ty - 106 - r2 * 5, w = 20 * (1 - (r2 * 5 + 2) / 48) * 1.02; for (let k = -4; k <= 4; k++) { const xx = Tx + k / 4.5 * w; c.strokeStyle = 'rgba(10,6,22,.45)'; c.lineWidth = 0.6; c.beginPath(); c.arc(xx, yy, w / 4.5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); } }
      c.strokeStyle = 'rgba(220,205,255,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(Tx - 14, Ty - 105); c.quadraticCurveTo(Tx - 5, Ty - 124, Tx - 1, Ty - 148); c.stroke(); c.restore();
      c.strokeStyle = L; c.lineWidth = 1.2; c.beginPath(); c.moveTo(Tx - 20, Ty - 104); c.quadraticCurveTo(Tx - 8, Ty - 122, Tx, Ty - 152); c.quadraticCurveTo(Tx + 8, Ty - 122, Tx + 20, Ty - 104); c.quadraticCurveTo(Tx, Ty - 99, Tx - 20, Ty - 104); c.stroke(); }
    // a dormer, the finial
    c.fillStyle = '#2A1838'; c.beginPath(); c.moveTo(Tx - 3, Ty - 108); c.lineTo(Tx - 3, Ty - 113); c.lineTo(Tx, Ty - 117); c.lineTo(Tx + 3, Ty - 113); c.lineTo(Tx + 3, Ty - 108); c.closePath(); c.fill(); glowAt(c, Tx, Ty - 111, 6, '#FF9BD2', 0.6); c.fillStyle = '#FFB8E2'; c.fillRect(Tx - 1.3, Ty - 113, 2.6, 4);
    glowAt(c, Tx, Ty - 160, 16, '#FFE37A', 0.55); { const g = c.createLinearGradient(Tx - 3, 0, Tx + 3, 0); g.addColorStop(0, '#FFF3B8'); g.addColorStop(0.5, '#E8B640'); g.addColorStop(1, '#8A6210'); c.fillStyle = g; c.fillRect(Tx - 1, Ty - 162, 2, 12); c.beginPath(); c.arc(Tx, Ty - 163, 3.2, 0, TAU); c.fill(); c.strokeStyle = L; c.lineWidth = 0.7; c.stroke(); }
    c.strokeStyle = '#E8B640'; c.lineWidth = 1.6; c.beginPath(); c.arc(Tx, Ty - 170, 4, 0.25 * Math.PI, 1.75 * Math.PI, true); c.stroke(); c.restore();
    helix(true);
    cloud(Tx - 30, Ty - 50, 44, 0.85); cloud(Tx + 34, Ty - 30, 30, 0.6);
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const a = R() * TAU, r = 22 + R() * 30, xx = Tx + Math.cos(a) * r, yy = Ty - 30 - R() * 110; c.fillStyle = R() < 0.5 ? 'rgba(255,190,240,.8)' : 'rgba(200,170,255,.8)'; c.beginPath(); c.arc(xx, yy, 0.7 + R() * 1.1, 0, TAU); c.fill(); } c.restore();
  }
  /* a rift curling behind a landmark, violet, with motes; after sealing its sigil instead */
  function riftCurl(c, x, y, sealed, sigil) {
    c.save(); c.translate(x, y);
    if (sealed) { glowAt(c, 0, -40, 26, GOLD, 0.7); c.fillStyle = GOLD; c.strokeStyle = L; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -56); c.quadraticCurveTo(14, -40, 0, -24); c.quadraticCurveTo(-14, -40, 0, -56); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-3, -44, 2.5, 0, TAU); c.fill(); c.font = '700 10px Georgia, serif'; c.textAlign = 'center'; c.fillStyle = '#6E5A40'; c.fillText(sigil || '', 0, -12); c.restore(); return; }
    glowAt(c, 0, -34, 48, VIOLET, 0.45); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#E8C8FF'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-6, -70); c.bezierCurveTo(16, -58, -12, -40, 8, -14); c.stroke(); c.strokeStyle = VIOLET; c.lineWidth = 8; c.globalAlpha = 0.45; c.stroke(); c.restore();
    c.fillStyle = '#E8C8FF'; for (let i = 0; i < 5; i++) { const a = i * 1.3; c.beginPath(); c.arc(Math.cos(a) * 18, -40 + Math.sin(a) * 22, 1.5 + (i % 2), 0, TAU); c.fill(); } c.restore();
  }
  /* an Anima gate: two pale uprights, an incomplete golden ring, the constellation inside (dark nodes when dormant) */
  function gateIcon(c, x, y, state, sign) {
    c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 4, 26, 8, 0, 0, TAU); c.fill();
    const col = state === 'done' ? GOLD : state === 'open' ? '#E8C8FF' : '#8E8A80';
    [-1, 1].forEach(s => { const g = c.createLinearGradient(s * 12, 0, s * 20, 0); g.addColorStop(0, '#EFE6D6'); g.addColorStop(1, '#B9B2A8'); c.fillStyle = g; c.strokeStyle = L; c.lineWidth = 1.2; rr(c, s * 16 - 4, -34, 8, 38, 2); c.fill(); c.stroke(); });
    if (state !== 'locked') glowAt(c, 0, -22, 30, state === 'done' ? GOLD : VIOLET, 0.5);
    c.strokeStyle = state === 'locked' ? '#7A6A48' : GOLD; c.lineWidth = 3.5; c.beginPath(); c.arc(0, -22, 18, Math.PI * 0.75, Math.PI * 2.55); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.beginPath(); c.arc(0, -22, 20, Math.PI * 0.75, Math.PI * 2.55); c.stroke();
    const pts = STAR_PTS[sign] || STAR_PTS.default; c.strokeStyle = state === 'locked' ? 'rgba(80,70,90,.6)' : 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px * 11, -22 + py * 11) : c.moveTo(px * 11, -22 + py * 11)); if (state === 'done') c.closePath(); c.stroke();
    pts.forEach(([px, py], i) => { c.fillStyle = state === 'locked' ? '#3A3040' : i === 0 && state !== 'done' ? '#FFFFFF' : state === 'done' ? '#FFE37A' : '#FFFFFF'; c.beginPath(); c.arc(px * 11, -22 + py * 11, state === 'locked' ? 1.6 : 2.2, 0, TAU); c.fill(); if (state !== 'locked') glowAt(c, px * 11, -22 + py * 11, 5, '#FFFFFF', 0.5); });
    if (state === 'locked') { c.fillStyle = '#3A3040'; c.strokeStyle = '#EFE6D6'; c.lineWidth = 1; rr(c, -5, -14, 10, 8, 2); c.fill(); c.stroke(); c.beginPath(); c.arc(0, -14, 3.5, Math.PI, TAU); c.stroke(); }
    c.restore();
  }
  const STAR_PTS = { default: [[-0.8, 0.5], [-0.3, -0.6], [0.4, -0.2], [0.9, 0.4]], cancer: [[-0.9, 0.2], [-0.3, -0.5], [0.4, -0.4], [0.9, 0.3], [0.2, 0.6]], taurus: [[-0.9, -0.6], [-0.3, 0], [0.3, 0.2], [0.9, -0.5], [0.5, 0.7]], scorpio: [[-0.9, -0.3], [-0.4, 0.1], [0.1, 0.4], [0.6, 0.2], [0.9, -0.4], [0.7, -0.8]], gemini: [[-0.6, -0.7], [-0.6, 0.7], [0.6, -0.7], [0.6, 0.7]], capricorn: [[-0.8, 0.6], [-0.2, -0.3], [0.5, -0.6], [0.9, 0.2], [0.3, 0.7]], aquarius: [[-0.9, 0], [-0.4, -0.5], [0.1, 0], [0.6, -0.5], [0.9, 0.2]], virgo: [[-0.9, 0.5], [-0.3, -0.2], [0.2, -0.7], [0.6, 0], [0.9, 0.6]], pisces: [[-0.9, 0.5], [-0.2, 0.2], [0.5, 0.5], [0.8, -0.4]], libra: [[-0.8, 0.4], [-0.3, -0.5], [0.3, -0.5], [0.8, 0.4], [0, 0.7]], sagittarius: [[-0.8, 0.6], [-0.2, 0], [0.5, -0.6], [0.9, -0.8], [0.2, 0.6]], leo: [[-0.9, 0.4], [-0.5, -0.2], [0, -0.7], [0.5, -0.5], [0.7, 0.1], [0.9, 0.6]], aries: [[-0.9, 0.3], [-0.3, -0.5], [0.4, -0.6], [0.9, 0]] };
  function extraIcon(c, e) {
    const { x, y, kind } = e; c.save(); c.strokeStyle = L; c.lineWidth = 1.1;
    if (kind === 'village' || kind === 'hamlet') { house(c, x - 10, y, 0.9, '#FFF6E6', '#5A3F2B'); house(c, x + 8, y + 4, 0.8, '#FFE9A8', '#D9483B'); }
    else if (kind === 'port') { house(c, x - 8, y - 2, 0.9, '#DCEBFF', '#4F8FD6'); c.fillStyle = '#7A5230'; c.fillRect(x + 4, y - 2, 26, 4); for (let i = 0; i < 4; i++) c.fillRect(x + 6 + i * 7, y + 2, 2, 6); boat(c, x + 30, y + 8); }
    else if (kind === 'lighthouse') { c.fillStyle = '#FFF6E6'; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 4, y - 28); c.lineTo(x + 4, y - 28); c.lineTo(x + 6, y); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#D9483B'; c.fillRect(x - 5, y - 12, 10, 5); c.fillStyle = '#4A3A2A'; c.fillRect(x - 5, y - 33, 10, 5); c.fillStyle = '#FFE9A8'; c.fillRect(x - 3, y - 31, 6, 3); }
    else if (kind === 'lakeName') { }
    else if (kind === 'lake') { c.fillStyle = '#4F93A8'; c.beginPath(); c.ellipse(x, y, 34, 16, 0.2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,80,90,.6)'; c.stroke(); c.fillStyle = '#8FD0DC'; c.beginPath(); c.ellipse(x - 6, y - 4, 18, 7, 0.2, 0, TAU); c.fill(); }
    else if (kind === 'pass') { c.fillStyle = '#B9A98A'; c.fillRect(x - 3, y - 26, 6, 26); c.fillStyle = '#D9483B'; c.beginPath(); c.moveTo(x + 3, y - 26); c.lineTo(x + 18, y - 22); c.lineTo(x + 3, y - 18); c.closePath(); c.fill(); c.stroke(); c.strokeRect(x - 3, y - 26, 6, 26); }
    else if (kind === 'quarry') { c.fillStyle = '#8E8A80'; c.beginPath(); c.moveTo(x - 24, y + 4); c.lineTo(x - 16, y - 10); c.lineTo(x - 4, y - 6); c.lineTo(x + 6, y - 16); c.lineTo(x + 20, y - 4); c.lineTo(x + 24, y + 4); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#FFE37A'; [[-8, -2], [6, -6], [14, 0]].forEach(([px, py]) => { c.beginPath(); c.arc(x + px, y + py, 2, 0, TAU); c.fill(); }); }
    else if (kind === 'cliffs') { cliffBand(c, [[x - 30, y + 6], [x - 10, y - 4], [x + 12, y - 2], [x + 30, y - 10]], 10, '#B9A98A'); }
    else if (kind === 'bridge') { c.strokeStyle = '#7A5230'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 18, y); c.quadraticCurveTo(x, y - 14, x + 18, y); c.stroke(); c.strokeStyle = L; c.lineWidth = 1; c.stroke(); c.fillStyle = '#7A5230'; c.fillRect(x - 20, y - 4, 4, 8); c.fillRect(x + 16, y - 4, 4, 8); }
    else if (kind === 'orchard') { for (let i = 0; i < 6; i++) { const px = x - 20 + (i % 3) * 20, py = y - 6 + Math.floor(i / 3) * 12; c.fillStyle = '#5E4630'; c.fillRect(px - 1, py - 2, 2, 6); c.fillStyle = i % 2 ? '#A85E87' : '#C97AA3'; c.beginPath(); c.arc(px, py - 6, 6, 0, TAU); c.fill(); c.stroke(); } }
    else if (kind === 'marsh') { c.strokeStyle = '#2E5A33'; c.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const px = x - 24 + i * 6; c.beginPath(); c.moveTo(px, y + 4); c.lineTo(px + 2, y - 10 - (i % 3) * 3); c.stroke(); } c.fillStyle = 'rgba(79,147,168,.5)'; c.beginPath(); c.ellipse(x, y + 4, 30, 6, 0, 0, TAU); c.fill(); }
    else if (kind === 'volcano') { mountain(c, x, y, 1.1, false, '#6A4A42'); c.fillStyle = '#FF6F59'; c.beginPath(); c.moveTo(x + 6, y - 38); c.lineTo(x + 14, y - 42); c.lineTo(x + 12, y - 32); c.closePath(); c.fill(); for (let i = 0; i < 3; i++) { c.fillStyle = `rgba(120,110,120,${0.5 - i * 0.12})`; c.beginPath(); c.arc(x + 12 + i * 6, y - 50 - i * 9, 5 + i * 3, 0, TAU); c.fill(); } }
    else if (kind === 'tower') { c.fillStyle = '#8E8A80'; c.fillRect(x - 6, y - 30, 12, 30); c.stroke(); c.strokeRect(x - 6, y - 30, 12, 30); for (let i = 0; i < 3; i++) c.fillRect(x - 7 + i * 5, y - 34, 3, 4); c.fillStyle = '#2B2433'; c.fillRect(x - 2, y - 22, 4, 5); }
    else if (kind === 'reef') { ['#FF9BD2', '#FFE37A', '#7FD3F2'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(x - 14 + i * 14, y + (i % 2) * 4, 5, 0, TAU); c.fill(); c.stroke(); }); }
    c.restore();
  }
  /* ---- the chart ---- */
  /* (v381) the ranges (each peak x, y, size), shared by the 2D peaks and the GPU's relief; more of them in each range */
  const MTNS = [
    { snow: true, col: '#7E8AA2', pk: [[200, 280, 1.2], [250, 250, 1.4], [320, 240, 1.3], [380, 260, 1.1], [180, 350, 0.9], [420, 300, 0.9], [225, 315, 0.75], [290, 300, 0.8], [350, 300, 0.7], [160, 300, 0.8], [400, 225, 0.85]] },
    { snow: true, col: '#7E7494', pk: [[460, 220, 1.1], [520, 180, 1.3], [600, 190, 1.4], [660, 230, 1.2], [720, 250, 1.0], [500, 270, 0.8], [560, 210, 0.9], [640, 270, 0.75], [690, 200, 0.8], [440, 260, 0.7]] },
    { snow: false, col: '#8A7E98', pk: [[940, 460, 1.0], [980, 420, 1.1], [1010, 480, 0.9], [890, 410, 0.8], [960, 500, 0.7], [1000, 380, 0.75], [920, 380, 0.65]] },
    { snow: false, col: '#9A8A70', pk: [[700, 1130, 0.8], [760, 1180, 0.9], [820, 1150, 0.8], [730, 1170, 0.65], [790, 1120, 0.6]] },
  ];
  /* (v381) the woods: every tree's place, made once (their own random numbers), so the GPU's canopy lies under the drawn trees */
  const FORESTS = [[300, 650, 320, 320, 150, '#3F7A40', 0.85], [430, 930, 220, 200, 110, '#5A3A6A', 0.95], [620, 760, 200, 160, 70, '#3F7A40', 0.85], [760, 440, 240, 160, 80, '#5E7A6A', 0.8], [160, 880, 220, 200, 80, '#2E5A33', 0.8], [220, 420, 180, 160, 50, '#2E5A33', 0.85], [560, 1150, 260, 100, 60, '#3F7A40', 0.85], [480, 560, 160, 120, 40, '#4A8A48', 0.75], [860, 690, 120, 90, 25, '#4A7A50', 0.75]];
  let TREES = null, HILLS = null;
  function hills() { if (HILLS) return HILLS; const R = mulberry32(777), RP = PLACES.rifts, out = [], T = trees();
    [[140, 430, 200, 200, 26, '#8DB86A'], [380, 330, 300, 220, 30, '#93B870'], [560, 560, 260, 200, 18, '#8DB86A'], [180, 980, 160, 160, 12, '#7E9A6E'], [620, 1180, 200, 90, 10, '#93B870'], [880, 600, 140, 100, 8, '#9DB87A'], [1020, 1150, 120, 120, 6, '#93B870']].forEach(([x0, y0, w, h, n, col]) => {
      for (let i = 0; i < n * 3 && out.length < 400; i++) { const x = x0 + R() * w, y = y0 + R() * h; if (!inPoly(COAST, x, y) && !inPoly(ISLE_SE, x, y)) continue; let near = false; for (const id in RP) if (Math.hypot(x - RP[id].x, y - RP[id].y) < 70) near = true; for (const id in PLACES.gates) if (Math.hypot(x - PLACES.gates[id].x, y - PLACES.gates[id].y) < 50) near = true; for (const e of PLACES.extras) if (Math.hypot(x - e.x, y - e.y) < 40) near = true; for (const t of T) if (Math.hypot(x - t[0], y - t[1]) < 20) { near = true; break; } for (const q of out) if (Math.hypot(x - q[0], y - q[1]) < 34) { near = true; break; }
        if (Math.hypot(x - 400, y - 825) < 90 || (Math.abs(x - 868) < 80 && y > 400 && y < 624) || inPoly(LAKE, x, y) || near) continue; out.push([x, y, 0.7 + R() * 0.5, col]); if (out.filter(q => q[3] === col).length >= n) break; } });
    out.sort((a, b) => a[1] - b[1]); return (HILLS = out); }
  function trees() { if (TREES) return TREES; const R = mulberry32(4242), RP = PLACES.rifts, out = [];
    FORESTS.forEach(([x0, y0, w, h, n, col, s]) => { for (let i = 0; i < n; i++) { const x = x0 + R() * w, y = y0 + R() * h, sc = s * (0.8 + R() * 0.5); if (!inPoly(COAST, x, y)) continue; let near = false; for (const id in RP) if (Math.hypot(x - RP[id].x, y - RP[id].y) < 60) near = true; for (const id in PLACES.gates) if (Math.hypot(x - PLACES.gates[id].x, y - PLACES.gates[id].y) < 44) near = true; for (const e of PLACES.extras) if (Math.hypot(x - e.x, y - e.y) < 30) near = true; if (Math.hypot(x - 400, y - 825) < 80 || (Math.abs(x - 868) < 74 && y > 400 && y < 618) || inPoly(LAKE, x, y) || near) continue; out.push([x, y, sc, col]); } });
    out.sort((a, b) => a[1] - b[1]); return (TREES = out); }
  /* (v381) the plain pictures the GPU paints the ground from (WorldMapGL): where the land is, its regions' colours, its relief, its woods */
  function gpuGround(data, K) {
    if (typeof WorldMapGL === 'undefined') return null; try { if (window.__WMAP_GL === 0) return null; } catch (e) {}
    const mk = s => { const cv = document.createElement('canvas'); cv.width = Math.round(W * s); cv.height = Math.round(H * s); const c = cv.getContext('2d'); c.scale(s, s); return [cv, c]; };
    const lands = [[COAST, 9], [ISLE_NE, 5], [ISLE_SE, 5], [ISLET, 3], [ISLE_W, 3]];
    const [mask, cm] = mk(K); cm.fillStyle = '#000'; cm.fillRect(0, 0, W, H); cm.fillStyle = '#FFF'; lands.forEach(([pts, amp]) => { coast(cm, pts, mulberry32(9), amp); cm.fill(); }); cm.fillStyle = '#000'; coast(cm, LAKE, mulberry32(12), 6); cm.fill();
    const S = K * 0.5;
    const [reg, cr] = mk(S); { const g = cr.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#A6C47A'); g.addColorStop(0.5, '#86B066'); g.addColorStop(1, '#93B870'); cr.fillStyle = g; cr.fillRect(0, 0, W, H);
      REGIONS.forEach((rg, ri) => { cr.save(); cr.globalAlpha = 0.9; cr.fillStyle = rg.col; coast(cr, rg.pts, mulberry32(31 + ri), 26); cr.fill(); cr.globalAlpha = 0.35; cr.lineWidth = 14; cr.strokeStyle = shade(rg.col, 1.12); cr.lineJoin = 'round'; coast(cr, rg.pts, mulberry32(31 + ri), 26); cr.stroke(); cr.restore(); });
      cr.fillStyle = '#D9D2BC'; coast(cr, ISLE_NE, mulberry32(9), 5); cr.fill(); }
    const blob = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    const [rel, cl] = mk(S); cl.fillStyle = '#000'; cl.fillRect(0, 0, W, H); cl.globalCompositeOperation = 'lighter';
    MTNS.forEach(R0 => R0.pk.forEach(([x, y, s]) => blob(cl, x, y - 8 * s, 46 * s, 'rgba(255,0,0,A)', 0.55 + 0.35 * s)));
    [1, 2, 3].forEach(ri => { cl.save(); cl.globalAlpha = 0.28; cl.fillStyle = '#F00'; coast(cl, REGIONS[ri].pts, mulberry32(31 + ri), 26); cl.fill(); cl.restore(); });
    cl.save(); cl.fillStyle = '#0F0'; coast(cl, REGIONS[5].pts, mulberry32(36), 26); cl.fill(); cl.restore();
    cl.save(); cl.globalAlpha = 0.8; cl.fillStyle = '#00F'; coast(cl, REGIONS[0].pts, mulberry32(31), 26); cl.fill(); coast(cl, ISLE_NE, mulberry32(9), 5); cl.fill(); cl.restore();
    const [fo, cf] = mk(S); cf.fillStyle = '#000'; cf.fillRect(0, 0, W, H); cf.globalCompositeOperation = 'lighter';
    trees().forEach(([x, y, sc]) => blob(cf, x, y - 4, 22 * sc, 'rgba(255,0,0,A)', 0.5));
    [[330, 1190, 70], [300, 1240, 80], [380, 1215, 50], [170, 840, 45]].forEach(([x, y, r]) => blob(cf, x, y, r, 'rgba(0,255,0,A)', 0.9));
    const out = WorldMapGL.terrain({ W, H, K, mask, reg, rel, forest: fo });
    [mask, reg, rel, fo].forEach(cv => { cv.width = cv.height = 1; });
    return out; }
  function bake(data) {
    const key = JSON.stringify([data.best, data.stars, data.pets, data.seals, data.gates, data.open, data.rlyeh]); if (baked && bakedKey === key) return baked;
    const dpr = window.devicePixelRatio || 1, K = dpr >= 2 ? 2 : 1.4, cv = document.createElement('canvas'); cv.width = Math.round(W * K); cv.height = Math.round(H * K); const c = cv.getContext('2d'); c.scale(K, K); const R = mulberry32(2024);
    // (v381) the ground painted on the GPU when it can be (WorldMapGL), else in 2D as before
    const GG = gpuGround(data, K);
    if (GG) c.drawImage(GG, 0, 0, W, H);
    else {
    // the sea: deep teal, swells, shallows along every shore
    const sea = c.createLinearGradient(0, 0, W, H); sea.addColorStop(0, '#6FA7A4'); sea.addColorStop(0.5, '#5F9A97'); sea.addColorStop(1, '#4F8C8C'); c.fillStyle = sea; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) { const x = R() * W, y = R() * H, r = 60 + R() * 160; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, R() < 0.5 ? 'rgba(170,215,205,.22)' : 'rgba(30,80,90,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    c.strokeStyle = 'rgba(235,250,245,.32)'; c.lineWidth = 0.9; for (let i = 0; i < 3200; i++) { const x = R() * W, y = R() * H, w = 7 + R() * 12; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 2.5, x + w, y); c.stroke(); }
    const lands = [[COAST, 9], [ISLE_NE, 5], [ISLE_SE, 5], [ISLET, 3], [ISLE_W, 3]];
    lands.forEach(([pts, amp]) => { for (let k = 5; k >= 1; k--) { c.save(); c.lineWidth = k * 9; c.strokeStyle = `rgba(200,235,225,${0.08 + (5 - k) * 0.05})`; c.lineJoin = 'round'; coast(c, pts, mulberry32(9), amp); c.stroke(); c.restore(); } });
    lands.forEach(([pts, amp]) => { c.save(); c.shadowColor = 'rgba(20,40,40,.5)'; c.shadowBlur = 10; c.shadowOffsetX = 3; c.shadowOffsetY = 5; c.fillStyle = '#C9B98A'; coast(c, pts, mulberry32(9), amp); c.fill(); c.restore(); });
    // the land: cel-shaded regions laid over a green base, each a soft field of colour
    lands.forEach(([pts, amp], li) => { c.save(); coast(c, pts, mulberry32(9), amp); c.clip();
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#A6C47A'); g.addColorStop(0.5, '#86B066'); g.addColorStop(1, '#93B870'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (li === 0) REGIONS.forEach((rg, ri) => { c.save(); c.globalAlpha = 0.9; c.fillStyle = rg.col; coast(c, rg.pts, mulberry32(31 + ri), 26); c.fill(); c.globalAlpha = 0.35; c.lineWidth = 14; c.strokeStyle = shade(rg.col, 1.12); c.lineJoin = 'round'; coast(c, rg.pts, mulberry32(31 + ri), 26); c.stroke(); c.restore(); });
      if (li === 1) { c.fillStyle = '#D9D2BC'; coast(c, ISLE_NE, mulberry32(9), 5); c.fill(); }
      for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H, r = 18 + R() * 60; const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, R() < 0.5 ? 'rgba(220,240,160,.2)' : 'rgba(50,100,50,.18)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      c.lineWidth = 9; c.strokeStyle = 'rgba(214,196,140,.85)'; coast(c, pts, mulberry32(9), amp); c.stroke(); c.lineWidth = 2.2; c.strokeStyle = 'rgba(70,50,30,.6)'; coast(c, pts, mulberry32(9), amp); c.stroke();
      c.restore(); });
    // the lake
    c.save(); c.shadowColor = 'rgba(20,40,40,.4)'; c.shadowBlur = 6; c.fillStyle = '#4F93A8'; coast(c, LAKE, mulberry32(12), 6); c.fill(); c.restore(); c.save(); coast(c, LAKE, mulberry32(12), 6); c.clip(); c.fillStyle = '#8FD0DC'; c.beginPath(); c.ellipse(750, 690, 40, 18, 0.2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(235,250,245,.5)'; c.lineWidth = 0.9; for (let i = 0; i < 40; i++) { const x = 690 + R() * 140, y = 640 + R() * 110, w = 6 + R() * 8; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 2, x + w, y); c.stroke(); } c.restore(); c.strokeStyle = 'rgba(40,80,90,.6)'; c.lineWidth = 1.5; coast(c, LAKE, mulberry32(12), 6); c.stroke();
    }
    // the salt flats of the coast, the recovery of a sealed region shown as a bloom of green
    const recover = id => data.seals && data.seals[id]; const RP = PLACES.rifts;
    Object.keys(RP).forEach(id => { if (id === 'rlyeh' || !recover(id)) return; const p = RP[id]; const gg = c.createRadialGradient(p.x, p.y, 10, p.x, p.y, 120); gg.addColorStop(0, 'rgba(160,220,120,.45)'); gg.addColorStop(1, 'rgba(160,220,120,0)'); c.fillStyle = gg; c.fillRect(p.x - 120, p.y - 120, 240, 240); });
    // cliffs: stepped ledges along the plateaus
    cliffBand(c, bez([[900, 640], [940, 690], [980, 720], [1040, 760]]), 14, '#B9A98A'); cliffBand(c, bez([[880, 820], [940, 850], [1000, 880]]), 12, '#B9A98A'); cliffBand(c, bez([[600, 320], [660, 350], [720, 340], [790, 370], [850, 360]]), 12, '#A89A8C'); cliffBand(c, bez([[180, 250], [240, 240], [300, 260], [360, 240], [420, 220]]), 12, '#C9D6E8'); cliffBand(c, bez([[380, 1060], [440, 1120], [520, 1150]]), 10, '#8E7A9A');
    // rivers: the Silverrun from the heights past the town to the south sea; the Cold Run from the polar peaks to the west coast
    river(c, bez([[600, 280], [640, 420], [680, 560], [720, 660]]), 7); river(c, bez([[720, 740], [660, 800], [600, 840], [560, 900], [540, 980], [580, 1100], [620, 1200], [660, 1260]]), 9); river(c, bez([[300, 320], [290, 420], [260, 500], [280, 580], [270, 650]]), 6); river(c, bez([[860, 560], [830, 620], [810, 660]]), 5);
    // forests: cone trees in clusters, each region in its own green
    if (GG) hills().forEach(([x, y, sc, col]) => hill(c, x, y, sc, col));   /* (v381) rolling hills over the open country */
    trees().forEach(([x, y, sc, col]) => tree(c, x, y, sc, col));   /* (v381: the woods' trees placed once, denser) */
    // the deserts: dunes drawn as soft arcs
    if (!GG) { c.save(); c.strokeStyle = 'rgba(160,120,60,.45)'; c.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = 740 + R() * 300, y = 880 + R() * 250, w = 20 + R() * 40; if (!inPoly(COAST, x, y) || Math.hypot(x - 850, y - 1000) < 55 || Math.hypot(x - 924, y - 1080) < 40) continue; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 7, x + w, y); c.stroke(); } c.restore(); }
    // ice and snow: the polar mountains
    if (!GG) { c.save(); c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 40; i++) { const x = 160 + R() * 300, y = 200 + R() * 250, r = 6 + R() * 18; if (!inPoly(COAST, x, y)) continue; c.beginPath(); c.ellipse(x, y, r, r * 0.5, 0, 0, TAU); c.fill(); } c.restore(); }
    // the peaks: the polar range, the Skyreach, the heights, the eastern spine
    MTNS.forEach(R0 => R0.pk.slice().sort((a, b) => a[1] - b[1]).forEach(([x, y, s]) => mountain(c, x, y, s, R0.snow, R0.col)));
    // farmland and Pocket Town
    const tx = PLACES.town.x, ty = PLACES.town.y;
    [[-54, -8], [-16, 28], [30, 26], [52, -10]].forEach(([dx, dy]) => { c.save(); c.translate(tx + dx, ty + dy); c.rotate(-0.15); c.fillStyle = '#B99A5C'; c.fillRect(-18, -10, 36, 20); for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#8FB36B' : '#A98A4C'; c.fillRect(-18, -10 + k * 4, 36, 2.5); } c.strokeStyle = L; c.lineWidth = 0.7; c.strokeRect(-18, -10, 36, 20); c.restore(); });
    c.fillStyle = '#D9C9A3'; c.beginPath(); c.ellipse(tx, ty, 40, 18, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(90,70,40,.5)'; c.lineWidth = 0.9; c.stroke();
    [[-28, -14, '#DCEBFF', '#4F8FD6'], [0, -22, '#FFE9A8', '#D9483B'], [28, -12, '#F4A1C6', '#8C7BE0'], [-14, 6, '#E8FFC2', '#6CC15A'], [16, 8, '#F2C98A', '#B5803F'], [-38, 12, '#FFF6E6', '#5A3F2B'], [40, 10, '#E6DCC8', '#2E6B3A']].forEach(([dx, dy, w, r], i) => house(c, tx + dx, ty + dy, 1.1 + (i % 3) * 0.1, w, r));
    c.fillStyle = '#4FA8F0'; c.beginPath(); c.arc(tx, ty - 2, 4.5, 0, TAU); c.fill(); c.strokeStyle = '#9A8FA8'; c.lineWidth = 1.4; c.stroke();
    // the roads: town to tower; the discreet route from dungeon to dungeon; each dungeon to its gate
    road(c, bez([[tx + 36, ty - 4], [500, 790], [600, 760], [700, 700], [790, 640], [850, 580]]));
    const open = id => data.open && data.open[id];
    for (let i = 0; i < ORDER.length - 1; i++) { const a = RP[ORDER[i]], b = RP[ORDER[i + 1]], mid = [(a.x + b.x) / 2 + (i % 2 ? 40 : -40), (a.y + b.y) / 2 + (i % 3 ? -30 : 30)]; road(c, bez([[a.x, a.y + 10], mid, [b.x, b.y + 10]]), { w: 3, col: open(ORDER[i + 1]) ? 'rgba(255,227,122,.9)' : 'rgba(185,131,245,.55)', shadow: 'rgba(40,30,60,.3)', dash: [4, 7] }); }
    const GORDER = ORDER.concat(RIFT_PLAN.some(r => r.id === 'caldera' && r.gate) ? ['caldera'] : []);   // v435 AG: the twelve gates and Rift 0's
    GORDER.forEach(id => { const a = RP[id], b = PLACES.gates[id]; road(c, [[a.x, a.y + 8], [b.x, b.y + 6]], { w: 3, col: data.gates && data.gates[id] ? GOLD : data.seals && data.seals[id] ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.3)', shadow: 'rgba(40,30,60,.25)', dash: [3, 5] }); });
    // the Tower of Oblivion on its crag
    const Tx = PLACES.tower.x, Ty = PLACES.tower.y + 42;
    towerOfOblivion(c, Tx, Ty);   /* (v382) drawn as an illustrated model */
    // the places on the roads
    PLACES.extras.forEach(e => { extraIcon(c, e); });
    // the twelve rifts and their landmarks, their gates
    ORDER.forEach(id => { const p = RP[id], pl = RIFT_PLAN.find(r => r.id === id), sealed = recover(id), isOpen = open(id); if (!sealed) riftCurl(c, p.x, p.y, false); ICONS[id](c, p.x, p.y); if (sealed) riftCurl(c, p.x, p.y, true, pl.sigil + ' Sigil'); if (!isOpen && !sealed) { c.save(); c.globalAlpha = 0.5; c.fillStyle = '#2A1F44'; c.beginPath(); c.arc(p.x + 30, p.y - 48, 9, 0, TAU); c.fill(); c.globalAlpha = 1; c.strokeStyle = '#EFE6D6'; c.lineWidth = 1.2; rr(c, p.x + 26, p.y - 50, 8, 7, 1.5); c.stroke(); c.beginPath(); c.arc(p.x + 30, p.y - 50, 3, Math.PI, TAU); c.stroke(); c.restore(); } });
    { const p = RP.caldera, sealed = recover('caldera'); if (!sealed) riftCurl(c, p.x, p.y - 8, false); ICONS.caldera(c, p.x, p.y); if (sealed) riftCurl(c, p.x, p.y - 8, true, 'Ember Sigil'); }
    /* v435 AG */ GORDER.forEach(id => { const g = PLACES.gates[id], pl = RIFT_PLAN.find(r => r.id === id), state = data.gates && data.gates[id] ? 'done' : recover(id) ? 'open' : 'locked'; gateIcon(c, g.x, g.y, state, pl.gate.anima); });
    // the Great Rift: a thin violet wound over the centre of the chart; R'lyeh above it once the twelve seals are set
    { const p = PLACES.great; glowAt(c, p.x, p.y, 120, VIOLET, 0.35); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#E8C8FF'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x - 90, p.y + 4); c.quadraticCurveTo(p.x - 30, p.y - 10, p.x, p.y); c.quadraticCurveTo(p.x + 40, p.y + 10, p.x + 90, p.y - 4); c.stroke(); c.strokeStyle = VIOLET; c.lineWidth = 12; c.globalAlpha = 0.35; c.stroke(); c.restore();
      if (data.rlyeh) { ICONS.rlyeh(c, PLACES.rifts.rlyeh.x, PLACES.rifts.rlyeh.y + 10); c.save(); c.strokeStyle = 'rgba(217,179,95,.7)'; c.lineWidth = 1; ORDER.forEach(id => { const q = RP[id]; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y - 40); c.stroke(); }); c.restore(); } }
    // sea life, boats
    serpent(c, 1000, 1420); whale(c, 60, 1300); whale(c, 1130, 640); boat(c, 60, 480); boat(c, 1140, 900, true); boat(c, 700, 1400); boat(c, 960, 60, true);
    // labels: seas and regions in italic, places on plaques
    label(c, 60, 1000, 'Rose Sea', { size: 24, color: '#1F4F4A', halo: 'rgba(200,235,225,.6)', rot: -1.2 }); label(c, 180, 520, 'Harbor Bay', { size: 15, color: '#1F4F4A', halo: 'rgba(200,235,225,.6)', rot: -0.5 }); label(c, 1140, 760, 'Endless Ocean', { size: 22, color: '#1F4F4A', halo: 'rgba(200,235,225,.6)', rot: 1.3 }); label(c, 600, 1440, 'The Tides of Time', { size: 22, color: '#1F4F4A', halo: 'rgba(200,235,225,.6)' }); label(c, 980, 1440, 'The Stellar Sea', { size: 18, color: '#1F4F4A', halo: 'rgba(200,235,225,.6)' });
    [['Greenhollow', 480, 700], ['Mossgrove', 700, 860], ['Skyreach Peaks', 560, 380], ['The Polar Range', 280, 200], ['The Sunscorch', 920, 940], ['The Temporal Ruins', 980, 665], ['The Dream Archive', 240, 940], ['The Petrified Sanctuary', 730, 365], ['The Lunar Isles', 1080, 1100], ['The Crash Steppe', 900, 230], ['The Primordial Heights', 560, 160], ['The Final Threshold', 480, 40], ['Southern Marsh', 320, 1240], ['The Drowned Coast', 170, 690]].forEach(([t, x, y]) => label(c, x, y, t, { size: 15, w: 600, color: '#2E3A28', spacing: 1 }));
    { const p = RP.caldera; plaque(c, p.x, p.y + 26, 'The Blackfire Caldera', { size: 14, bg: recover('caldera') ? 'rgba(90,70,20,.92)' : 'rgba(46,40,52,.92)', color: recover('caldera') ? '#FFE9A8' : '#FFF8E8' }); plaque(c, p.x, p.y + 46, recover('caldera') ? 'Sealed' : 'Rift 0 · Lv 1', { size: 10, bg: 'rgba(0,0,0,.35)', border: 'rgba(0,0,0,0)', color: '#FFF8E8' }); }
    ORDER.forEach(id => { const p = RP[id], pl = RIFT_PLAN.find(r => r.id === id); plaque(c, p.x, p.y + 26, pl.name, { size: 14, bg: recover(id) ? 'rgba(90,70,20,.92)' : open(id) ? 'rgba(46,40,52,.92)' : 'rgba(40,36,46,.75)', color: recover(id) ? '#FFE9A8' : open(id) ? '#FFF8E8' : '#B9B2CC' }); plaque(c, p.x, p.y + 46, recover(id) ? 'Sealed' : open(id) ? `Rift ${pl.n} · Lv ${pl.lvl}` : `Seal rift ${pl.n - 1} first`, { size: 10, bg: 'rgba(0,0,0,.35)', border: 'rgba(0,0,0,0)', color: '#FFF8E8' }); });
    /* v435 AG */ GORDER.forEach(id => { const g = PLACES.gates[id], pl = RIFT_PLAN.find(r => r.id === id), done = data.gates && data.gates[id], av = recover(id); plaque(c, g.x, g.y + 22, pl.gate.name, { size: 11, bg: done ? 'rgba(90,70,20,.92)' : av ? 'rgba(60,40,90,.92)' : 'rgba(40,36,46,.75)', color: done ? '#FFE9A8' : '#FFF8E8' }); plaque(c, g.x, g.y + 40, done ? 'Anima unlocked' : av ? 'Trial available' : `Clear ${pl.name.replace(/^The /, '')}`, { size: 9, bg: 'rgba(0,0,0,.35)', border: 'rgba(0,0,0,0)', color: '#FFF8E8' }); });
    PLACES.extras.forEach(e => plaque(c, e.x, e.y + 20, e.name, { size: 11, bg: 'rgba(245,236,210,.9)', color: L, border: 'rgba(58,42,30,.5)' }));
    cartouche(c, tx, ty + 56, 170, 40, 'Pocket Town', `${data.pets} pet${data.pets === 1 ? '' : 's'} · ${data.stars} ★`);
    cartouche(c, Tx, Ty + 44, 200, 40, 'Tower of Oblivion', data.best ? `Floor ${data.best} of ${TOWER_TOP}` : 'Unclimbed', '#3A2A5E');
    plaque(c, PLACES.great.x, PLACES.great.y + 24, data.rlyeh ? "R'lyeh Above the World" : 'The Great Rift', { size: 13, bg: 'rgba(60,40,90,.92)', color: '#E8C8FF' });
    compass(c, 1100, 1400, 34);
    cartouche(c, 230, 56, 300, 52, 'Gaia', 'a chart of the known lands and the twelve rifts');
    // parchment grain, vignette and the border
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.45; const nz = document.createElement('canvas'); nz.width = nz.height = 128; const nc = nz.getContext('2d'), im = nc.createImageData(128, 128); const RN = mulberry32(77); for (let i = 0; i < im.data.length; i += 4) { const v = 205 + RN() * 50; im.data[i] = v; im.data[i + 1] = v - 6; im.data[i + 2] = v - 18; im.data[i + 3] = 255; } nc.putImageData(im, 0, 0); c.fillStyle = c.createPattern(nz, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); vg.addColorStop(0, 'rgba(60,40,20,0)'); vg.addColorStop(1, 'rgba(60,40,20,.4)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    c.strokeStyle = L; c.lineWidth = 5; c.strokeRect(8, 8, W - 16, H - 16); c.lineWidth = 1.5; c.strokeRect(16, 16, W - 32, H - 32); c.fillStyle = L; [[8, 8], [W - 8, 8], [8, H - 8], [W - 8, H - 8]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill(); c.fillStyle = GOLD; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill(); c.fillStyle = L; });
    baked = cv; bakedKey = key; return cv;
  }
  return { W, H, bake, PLACES, ORDER, spots: { town: PLACES.town, tower: PLACES.tower } };
})();
