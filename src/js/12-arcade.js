/* ---------- arcade: plays the mini-games full screen ---------- */
const GAMES = {};
const arcEl = $('#arcade'), arcCanvas = $('#arcCanvas'), arcCtx = arcCanvas.getContext('2d');
const arcHud = $('#arcHud'), arcCtrl = $('#arcControls'), arcReady = $('#arcReady'), arcPanel = $('#arcPanel');
const arc = { open: false, state: 'off', paused: false, game: null, api: null, w: 0, s: 0, W: 0, H: 0, dpr: 1, t: 0, last: 0, fx: [], shakeT: 0, shakeM: 0, sprites: null, keys: {}, score: 0, hearts: 0, maxHearts: 0, ptr: new Map(), raf: 0, dunCap: 2, frames: [],
  combo: 0, comboT: 0, comboWin: 3, comboBest: 0, mult: 1, fever: 0, fevers: 0, feverT: 0, stop: 0, flash: 0, flashC: '#FFFFFF', hitT: 0 };

/* the pet as game sprites: normal, happy and hurt faces */
async function loadSprites(f, extra) {
  f = f || curForm(); const X0 = extra || {};
  const [normal, happy, hurt] = await Promise.all([
    petImage(f, Object.assign({ eyes: 'normal', mouth: 'smile', lite: true }, X0)),
    petImage(f, Object.assign({ eyes: 'happy', mouth: 'open', lite: true }, X0)),
    petImage(f, Object.assign({ eyes: 'dizzy', mouth: 'o', lite: true }, X0)),
  ]);
  return { normal, happy, hurt, bodyTop: (f.legs.len || 0) + 9 + f.body.h, form: f };
}
/* the pet in parts, for the Tower, where it walks and fights: what lies behind its body, its body and face (one for
   each face), a foot, an arm and a wing (the other side's drawn as their mirror). Each part is its own small picture,
   cut to what it holds, so the game can step the feet, swing the arms (and lift them for a skill), and beat the wings */
const RIGS = new WeakMap();   // (a pet's parts are made once and kept while its form lasts: the next floor starts at once)
async function loadRig(f) {
  f = f || curForm();
  if (RIGS.has(f)) return RIGS.get(f);
  const pr = makeRig(f); RIGS.set(f, pr); return pr;
}
async function makeRig(f, extra) {
  const make = o => { const sv = petSVG(f, Object.assign({ static: true, frame: 'fit', lite: true, rig: true }, o, extra || {})); return petSVG.rig; };
  const R0 = make({ eyes: 'normal', mouth: 'smile' }), Rh = make({ eyes: 'happy', mouth: 'open' }), Rd = make({ eyes: 'dizzy', mouth: 'o' });
  // each part's box, measured in a hidden copy of the picture
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-4000px;top:0;width:400px;height:400px;visibility:hidden;pointer-events:none';
  document.body.appendChild(box);
  const vbS = R0.vb.join(' ');
  // (each face is its own picture with its own shading, mask and clip, named apart: a part keeps the defs it was drawn with)
  const bboxOf = (content, defs) => { box.innerHTML = `<svg viewBox="${vbS}" width="400" height="400"><defs>${defs}</defs><g id="rigbb">${content}</g></svg>`; try { const b = box.querySelector('#rigbb').getBBox(); return b.width > 0 ? [b.x - 12, b.y - 12, b.width + 24, b.height + 24] : null; } catch (e) { return null; } };
  const img = (content, bb, defs) => new Promise(res => {
    const w = Math.max(1, Math.round(bb[2] * 2)), h = Math.max(1, Math.round(bb[3] * 2));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bb.map(v => +v.toFixed(2)).join(' ')}" width="${w}" height="${h}"><defs>${defs}</defs>${content}</svg>`;
    const im = new Image(); im.onload = () => res({ img: im, vb: bb }); im.onerror = () => res(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  // (the box the picture reports can be far bigger than what shows: the body's shading is a mask over a large square.
  // So each part is drawn once small and cut to the pixels it really paints)
  const tight = async (content, bb, defs) => {
    const first = await img(content, bb, defs); if (!first) return null;
    const W = first.img.naturalWidth, H = first.img.naturalHeight, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); g.drawImage(first.img, 0, 0, W, H); const d = g.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    cv.width = cv.height = 0;
    if (x1 < 0) return null;
    const ux = bb[2] / W, uy = bb[3] / H, nb = [bb[0] + (x0 - 2) * ux, bb[1] + (y0 - 2) * uy, (x1 - x0 + 5) * ux, (y1 - y0 + 5) * uy];
    return (nb[2] < bb[2] * 0.98 || nb[3] < bb[3] * 0.98) ? img(content, nb, defs) : first;
  };
  try {
    // (the boxes are measured one after another, in the hidden copy; the pictures are then all made at once)
    const L = R0.leg ? R0.leg.wings : [], jobs = [[R0.back, R0], [R0.front, R0], [Rh.front, Rh], [Rd.front, Rd], [R0.foot, R0], [R0.arm, R0], [R0.wing, R0]].concat(L.map(w => [w.g, R0])).map(([ct, R]) => ct ? [ct, bboxOf(ct, R.defs), R.defs] : null);
    const got = await Promise.all(jobs.map(j => j && j[1] ? tight(j[0], j[1], j[2]) : null));
    const out = { back: got[0], front: { normal: got[1], happy: got[2], hurt: got[3] }, foot: got[4], footPv: R0.footPv, arm: got[5], armPv: R0.armPv, wing: got[6], wingPv: R0.wingPv, legW: null, flap: null };
    if (R0.leg) { out.legW = L.map((w, i) => Object.assign(got[7 + i] || {}, { pv: w.pv, lag: w.lag, k: w.k, th: 180 + w.mid })); out.flap = R0.leg.flap; out.beat = R0.leg.beat || [1, 1, 1]; }
    return out;
  } finally { box.remove(); }
}
/* a pet's picture is an SVG image, and an SVG drawn at a size that changes from frame to frame (the pet breathes and
   squashes as it moves) is painted afresh by the browser every time: in a Tower fight that cost more than the whole of the
   fiend's arena. So it is copied once into a canvas at about the size it is drawn (device pixels per unit of the
   picture: ppu), and that copy is drawn instead; it is copied again only if the pet comes to be drawn much larger or
   smaller than that */
function petRaster(s, ppu, exact) {
  const r = s.ras;
  if (r && (exact ? ppu <= r.k * 1.12 && ppu >= r.k * 0.89 : ppu <= r.k * 1.4 && ppu >= r.k * 0.6)) return r;
  if (!s.img || !(s.img.naturalWidth > 0)) return null;
  const [, , vw, vh] = s.vb, k = Math.min(8, Math.max(0.25, ppu * (exact ? 1 : 1.15))), cv = (r && r.cv) || document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(vw * k)); cv.height = Math.max(1, Math.ceil(vh * k));
  const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(s.img, 0, 0, cv.width, cv.height);
  return (s.ras = { cv, k });
}
/* the pet in parts (o.pose: its walk's phase and how far it walks, a skill's lift of the arms, the wings' beat): the
   wings, what lies behind the body, the feet, the body and face, the arms. Falls back to the whole picture */
function drawPetRig(c, RG, S, h, o) {
  const k = h / S.bodyTop, m = c.getTransform(), ppu = k * Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d), 0.5), P = o.pose || {};
  const put = (pt2, side) => { if (!pt2 || !pt2.img) return; const R = petRaster(pt2, ppu, true), [vx, vy, vw, vh] = pt2.vb; if (side < 0) { c.save(); c.scale(-1, 1); c.drawImage(R ? R.cv : pt2.img, vx * k, vy * k, vw * k, vh * k); c.restore(); } else c.drawImage(R ? R.cv : pt2.img, vx * k, vy * k, vw * k, vh * k); };
  const about = (pv, f2) => { c.translate(pv[0] * k, pv[1] * k); f2(); c.translate(-pv[0] * k, -pv[1] * k); };
  const turned = (pt2, pv, ang, side, extra) => { if (!pt2 || !pt2.img) return; c.save(); if (side < 0) c.scale(-1, 1); c.translate(pv[0] * k, pv[1] * k); c.rotate(ang); if (extra) extra(); c.translate(-pv[0] * k, -pv[1] * k); put(pt2, 1); c.restore(); };
  // a part turned about a pivot, drawn ahead for each turn (to 3 degrees) and laid down as a plain copy
  const baked = (pt2, pv, deg) => { const R = petRaster(pt2, ppu, true); if (!R) return null; if (pt2.bk !== R) { pt2.bk = R; pt2.turns = new Map(); }
    const q = Math.round(deg / 3), hit = pt2.turns.get(q); if (hit) return hit;
    const [vx, vy, vw, vh] = pt2.vb, M = new DOMMatrix().translate(pv[0], pv[1]).rotate(q * 3).translate(-pv[0], -pv[1]);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; [[vx, vy], [vx + vw, vy], [vx, vy + vh], [vx + vw, vy + vh]].forEach(([x, y]) => { const P2 = M.transformPoint({ x, y }); x0 = Math.min(x0, P2.x); y0 = Math.min(y0, P2.y); x1 = Math.max(x1, P2.x); y1 = Math.max(y1, P2.y); });
    const kz = R.k, cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil((x1 - x0) * kz)); cv.height = Math.max(1, Math.ceil((y1 - y0) * kz));
    const g2 = cv.getContext('2d'); g2.setTransform(kz, 0, 0, kz, -x0 * kz, -y0 * kz); g2.transform(M.a, M.b, M.c, M.d, M.e, M.f); g2.drawImage(R.cv, vx, vy, vw, vh);
    const F2 = { cv, x0, y0, w: x1 - x0, h: y1 - y0 }; pt2.turns.set(q, F2);
    if (pt2.turns.size > 60) { const k0 = pt2.turns.keys().next().value, o0 = pt2.turns.get(k0); pt2.turns.delete(k0); o0.cv.width = o0.cv.height = 0; }
    return F2; };
  const lay = (F2, side) => { if (!F2) return; if (side < 0) { c.save(); c.scale(-1, 1); } c.drawImage(F2.cv, F2.x0 * k, F2.y0 * k, F2.w * k, F2.h * k); if (side < 0) c.restore(); };
  const D2R = Math.PI / 180, ph = P.walk || 0, mv = P.moving ? 1 : 0, cast = P.cast || 0, castUlt = !!P.ult;
  // wings: a Legendary's pairs beat as they do in the room (rise and close, sweep down and open; each a moment after
  // the main one); an ordinary pet's wings flutter
  if (RG.legW) {
    // (each pair's beat is drawn ahead as 16 still pictures, the turn and the close already in them, so a frame lays down
    // plain copies, the far side's flipped: a turned copy costs a phone's painter several times a plain one)
    const [up, down] = RG.flap || [8, 8], BT = RG.beat || [1, 1, 1], wph = (P.wingPh || 0) * BT[0], NB = 16, TAU = Math.PI * 2;
    RG.legW.forEach(w => { if (!w.img) return; const R = petRaster(w, ppu, true); if (!R) return;
      if (w.bk !== R) { w.bk = R; w.frames = []; }
      const u = (((wph - w.lag) % TAU) + TAU) % TAU, j = Math.floor(u / TAU * NB) % NB;
      let F2 = w.frames[j];
      if (!F2) {
        const q = Math.sin((j + 0.5) / NB * TAU), amp = 12 * BT[1], fold = Math.min(0.5, 0.24 * BT[2]), a = clamp(q * amp, -down, up) * w.k * D2R, kk = (0.5 + 0.5 * q) * w.k, sp = 1 - fold * kk, su = 1 - fold * 0.25 * kk, th = w.th * D2R;
        // the wing's corners (pet units) through the beat's turn about its root, to size the still
        const [vx, vy, vw, vh] = w.vb, pv = w.pv, M = new DOMMatrix().translate(pv[0], pv[1]).rotate(a / D2R).rotate(th / D2R).scale(su, sp).rotate(-th / D2R).translate(-pv[0], -pv[1]);
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; [[vx, vy], [vx + vw, vy], [vx, vy + vh], [vx + vw, vy + vh]].forEach(([x, y]) => { const P2 = M.transformPoint({ x, y }); x0 = Math.min(x0, P2.x); y0 = Math.min(y0, P2.y); x1 = Math.max(x1, P2.x); y1 = Math.max(y1, P2.y); });
        const kz = R.k, cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil((x1 - x0) * kz)); cv.height = Math.max(1, Math.ceil((y1 - y0) * kz));
        const g2 = cv.getContext('2d'); g2.setTransform(kz, 0, 0, kz, -x0 * kz, -y0 * kz); g2.transform(M.a, M.b, M.c, M.d, M.e, M.f); g2.drawImage(R.cv, vx, vy, vw, vh);
        F2 = w.frames[j] = { cv, x0, y0, w: x1 - x0, h: y1 - y0 };
      }
      c.drawImage(F2.cv, F2.x0 * k, F2.y0 * k, F2.w * k, F2.h * k);
      c.save(); c.scale(-1, 1); c.drawImage(F2.cv, F2.x0 * k, F2.y0 * k, F2.w * k, F2.h * k); c.restore();
    });
  } else if (RG.wing) { const F2 = baked(RG.wing, RG.wingPv, Math.sin(P.wingPh || 0) * (P.wingAmp || 8)); lay(F2, 1); lay(F2, -1); }
  put(RG.back, 1);
  // feet: stepping, one up as the other comes down, and shuffled a little; still, they rest
  if (RG.foot) [1, -1].forEach(sd => { const q = Math.sin(ph + (sd < 0 ? Math.PI : 0)), lift = mv * Math.max(0, q) * 5.2, sh = mv * Math.cos(ph + (sd < 0 ? Math.PI : 0)) * 1.8;
    c.save(); if (sd < 0) c.scale(-1, 1); c.translate(sh * k, -lift * k); put(RG.foot, 1); c.restore(); });
  put(RG.front[o.face || 'normal'] || RG.front.normal, 1);
  // arms: swinging opposite the feet as it walks, breathing at rest; a skill lifts them forward, an Ultimate high overhead
  if (RG.arm) [1, -1].forEach(sd => {
    const sw = mv ? Math.sin(ph + (sd < 0 ? 0 : Math.PI)) * 26 : Math.sin((P.t || 0) * 2.2) * 3;
    const env = cast > 0 ? Math.max(0, Math.min(1, cast * 5, (1 - cast) * 3)) : 0, lift = env * (castUlt ? 112 : -62);
    lay(baked(RG.arm, RG.armPv, sw * (1 - Math.min(1, Math.abs(lift) / 55)) + lift), sd);
  });
}
/* the pet in parts drawn once into a picture of its own, for a frame where copies of it walk the floor too (Mirror
   Twins, Shadow Army, Mirror Image): the pet and every copy are then laid down from that one picture, so each copy steps,
   swings its arms and beats its wings with the pet for the price of a plain picture (one canvas, kept and reused).
   h: the pet's height on the target canvas, ppx: the target's device pixels per unit */
const PET_SNAP = { cv: null, g: null, box: null, dirty: null };
function petSnap(h, o, ppx) {
  const S = arc.sprites, s = S && S.normal, N = PET_SNAP;
  if (!(S && S.rig && S.rig.front && S.rig.front.normal && s && s.vb)) return null;
  // (a canvas with room round the whole picture for an arm raised overhead and the wings at the top of their beat; only
  // what is painted in it each frame is cleared and copied out, so a copy costs what the plain picture did)
  const k = h / S.bodyTop, [vx, vy, vw, vh] = s.vb, mx = vw * 0.3, my = vh * 0.32;
  const x0 = (vx - mx) * k, y0 = (vy - my) * k, W = Math.max(1, Math.ceil((vw + mx * 2) * k * ppx)), H = Math.max(1, Math.ceil((vh + my * 2) * k * ppx));
  if (W * H > 4e6) return null;
  let cv = N.cv; if (!cv) cv = N.cv = document.createElement('canvas');
  if (cv.width < W || cv.height < H || cv.width > W * 1.4 || cv.height > H * 1.4) { cv.width = W; cv.height = H; N.g = null; N.dirty = null; }
  let g = N.g;
  if (!g) {
    g = N.g = cv.getContext('2d');
    // (every picture laid down here widens the box of what was painted)
    const di = CanvasRenderingContext2D.prototype.drawImage;
    g.drawImage = function (im, a1, a2, a3, a4) {
      if (N.box && arguments.length === 5) { const m = this.getTransform(), B = N.box;
        for (let i = 0; i < 4; i++) { const px = a1 + (i & 1 ? a3 : 0), py = a2 + (i & 2 ? a4 : 0), X = m.a * px + m.c * py + m.e, Y = m.b * px + m.d * py + m.f;
          if (X < B[0]) B[0] = X; if (Y < B[1]) B[1] = Y; if (X > B[2]) B[2] = X; if (Y > B[3]) B[3] = Y; } }
      return di.apply(this, arguments); };
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  if (N.dirty) { const d = N.dirty; g.clearRect(d[0], d[1], d[2] - d[0], d[3] - d[1]); } else g.clearRect(0, 0, cv.width, cv.height);
  g.setTransform(ppx, 0, 0, ppx, -x0 * ppx, -y0 * ppx);
  N.box = [1e9, 1e9, -1e9, -1e9];
  drawPetRig(g, S.rig, S, h, o);
  const B = N.box; N.box = null;
  if (!(B[2] > B[0])) { N.dirty = null; return null; }
  const sx = Math.max(0, Math.floor(B[0]) - 1), sy = Math.max(0, Math.floor(B[1]) - 1), ex = Math.min(cv.width, Math.ceil(B[2]) + 1), ey = Math.min(cv.height, Math.ceil(B[3]) + 1);
  N.dirty = [sx, sy, ex, ey];
  return { cv, sx, sy, sw: ex - sx, sh: ey - sy, x0: x0 + sx / ppx, y0: y0 + sy / ppx, w: (ex - sx) / ppx, h: (ey - sy) / ppx, ph: h };
}
/* draw the pet with its feet at (x, y) and its body h pixels tall */
function drawPetSprite(c, x, y, h, o) {
  o = o || {};
  const S = arc.sprites, s = S && S[o.face || 'normal'];
  c.save();
  c.translate(x, y);
  if (o.rot) { c.translate(0, -h * 0.5); c.rotate(o.rot); c.translate(0, h * 0.5); }
  c.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
  if (o.alpha != null) c.globalAlpha = o.alpha;
  if (o.snap) { const N = o.snap, q = h / N.ph; c.drawImage(N.cv, N.sx, N.sy, N.sw, N.sh, N.x0 * q, N.y0 * q, N.w * q, N.h * q); }
  else if (o.rig && S.rig && S.rig.front && S.rig.front.normal) drawPetRig(c, S.rig, S, h, o);
  else if (s && s.img) {
    const [vx, vy, vw, vh] = s.vb, k = h / S.bodyTop, m = c.getTransform(), R = petRaster(s, k * Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d), 0.5));
    c.drawImage(R ? R.cv : s.img, vx * k, vy * k, vw * k, vh * k);
  } else {
    c.fillStyle = '#FFB0C8'; c.strokeStyle = '#2B2433'; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(0, -h / 2, h * 0.45, h / 2, 0, 0, 7); c.fill(); c.stroke();
  }
  c.restore();
}

function arcLayout() {
  const r = arcEl.getBoundingClientRect();
  const top = arcHud.offsetHeight, ch = arcCtrl.hidden ? 0 : arcCtrl.offsetHeight;
  const W = Math.max(200, Math.round(r.width)), H = Math.max(200, Math.round(r.height - top - ch));
  const resized = W !== arc.W || H !== arc.H;
  arc.W = W; arc.H = H;
  arcCanvas.style.top = top + 'px';
  arcCanvas.style.width = W + 'px'; arcCanvas.style.height = H + 'px';
  arc.dpr = Math.min(arc.mode === 'dungeon' ? arc.dunCap : 2.5, window.devicePixelRatio || 1);
  // (a pixel budget: a big screen, a 5K iMac's window say, would otherwise get a canvas of fifteen million pixels, more
  // than ten times a phone's; with the old-film look on, the budget is tighter, as its passes go over every pixel, and
  // the softness of the enlarged canvas is part of that look)
  { const budget = typeof st !== 'undefined' && st && st.retro !== false ? 4.2e6 : 8.3e6; if (W * H * arc.dpr * arc.dpr > budget) arc.dpr = Math.max(1, Math.sqrt(budget / (W * H))); }
  arcCanvas.width = Math.round(W * arc.dpr); arcCanvas.height = Math.round(H * arc.dpr);
  arcCtx.setTransform(arc.dpr, 0, 0, arc.dpr, 0, 0);
  if (resized && arc.game && arc.game.resize) arc.game.resize(W, H);
}
const CONTROLS = {
  maze: [['left', '◀'], ['up', '▲'], ['down', '▼'], ['right', '▶']],
  blocks: [['left', '◀'], ['right', '▶'], ['rotate', '⟳'], ['soft', '▼'], ['drop', '⤓']],
  platform: [['left', '◀'], ['right', '▶'], ['gap'], ['jump', 'Jump']],
};
function setControls(key) {
  const list = CONTROLS[key];
  arcCtrl.hidden = !list;
  arcCtrl.dataset.game = key;
  arcCtrl.innerHTML = list ? list.map(([k, label]) => k === 'gap' ? '<span class="ab-gap"></span>' : `<button class="ab ab-${k}" type="button" data-k="${k}" aria-label="${k}">${label}</button>`).join('') : '';
}
function keyDown(k) { if (!arc.keys[k]) { arc.keys[k] = true; if (arc.state === 'play' && !arc.paused && arc.game && arc.game.key) arc.game.key(k, true); } }
function keyUp(k) { if (arc.keys[k]) { arc.keys[k] = false; if (arc.game && arc.game.key) arc.game.key(k, false); } }
arcCtrl.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-k]');
  if (!b) return;
  e.preventDefault(); sfx.unlock();
  try { b.setPointerCapture(e.pointerId); } catch (_) {}
  b.classList.add('on'); keyDown(b.dataset.k);
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => arcCtrl.addEventListener(ev, e => {
  const b = e.target.closest('[data-k]');
  if (!b) return;
  b.classList.remove('on'); keyUp(b.dataset.k);
}));
arcCtrl.addEventListener('contextmenu', e => e.preventDefault());
const KEYMAP = { Tab: 'swap', r: 'swap', ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', ' ': 'space', z: 'rotate', x: 'rotate', Enter: 'space', 1: 'ab1', q: 'ab1', j: 'ab1', 2: 'ab2', e: 'ab2', k: 'ab2', Shift: 'dodge', l: 'dodge', c: 'dodge', 3: 'dodge', 4: 'ab3', r: 'ab3', 5: 'ab4', t: 'ab4', 6: 'ab5', f: 'ab5' };
document.addEventListener('keydown', e => {
  if (!arc.open) return;
  if (e.key === 'Escape') { if (arc.state === 'play') togglePause(); else closeArcade(); e.stopImmediatePropagation(); return; }
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  if (arc.state === 'ready' && (k === 'space' || k === 'up')) { beginPlay(); return; }
  if (arc.mode === 'dungeon') { keyDown(k === 'space' ? 'tap' : k); return; }
  if (k === 'space') { keyDown('jump'); keyDown('drop'); keyDown('tap'); }
  else if (k === 'up') { keyDown('up'); keyDown('rotate'); keyDown('jump'); keyDown('tap'); }
  else if (k === 'down') { keyDown('down'); keyDown('soft'); }
  else keyDown(k);
}, true);
document.addEventListener('keyup', e => {
  if (!arc.open) return;
  const k = KEYMAP[e.key];
  if (!k) return;
  if (arc.mode === 'dungeon') { keyUp(k === 'space' ? 'tap' : k); return; }
  if (k === 'space') { keyUp('jump'); keyUp('drop'); keyUp('tap'); }
  else if (k === 'up') { keyUp('up'); keyUp('rotate'); keyUp('jump'); keyUp('tap'); }
  else if (k === 'down') { keyUp('down'); keyUp('soft'); }
  else keyUp(k);
});
/* touches on the play area go to the game */
const arcPt = e => { const r = arcCanvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
arcCanvas.addEventListener('pointerdown', e => {
  sfx.unlock();
  e.preventDefault();
  if (arc.state === 'ready') { beginPlay(); return; }
  if (arc.state !== 'play' || arc.paused) return;
  try { arcCanvas.setPointerCapture(e.pointerId); } catch (_) {}
  const [x, y] = arcPt(e);
  arc.ptr.set(e.pointerId, [x, y]);
  if (arc.game.down) arc.game.down(x, y, e.pointerId);
});
arcCanvas.addEventListener('pointermove', e => {
  if (!arc.ptr.has(e.pointerId)) return;
  // a mouse button let go outside the window never sends its up: a move with no button down releases it
  if (e.pointerType === 'mouse' && e.buttons === 0) { arcUp(e); return; }
  if (arc.state !== 'play' || arc.paused) return;
  const [x, y] = arcPt(e); arc.ptr.set(e.pointerId, [x, y]);
  if (arc.game.move) arc.game.move(x, y, e.pointerId);
});
const arcUp = e => {
  if (!arc.ptr.has(e.pointerId)) return;
  arc.ptr.delete(e.pointerId);
  const [x, y] = arcPt(e);
  if (arc.game && arc.game.up) arc.game.up(x, y, e.pointerId);
};
arcCanvas.addEventListener('pointerup', arcUp);
arcCanvas.addEventListener('pointercancel', arcUp);
arcCanvas.addEventListener('lostpointercapture', arcUp);
/* the safety net: a pointer whose up or cancel never reached the canvas (the system took the touch: an app switch,
   a notification, a control-centre pull, a multi-finger gesture) would leave the move stick held for good. So: any up
   or cancel anywhere on the page releases that pointer; no fingers left on the screen releases every pointer; and the
   page going hidden, losing focus or ending releases everything (pointers and keys) */
function arcReleaseAll() {
  for (const [id, at] of [...arc.ptr.entries()]) { arc.ptr.delete(id); if (arc.game && arc.game.up) arc.game.up(at ? at[0] : -1, at ? at[1] : -1, id); }
  Object.keys(arc.keys).forEach(k => keyUp(k));
}
['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, e => { if (arc.ptr.has(e.pointerId)) arcUp(e); }, true));
['touchend', 'touchcancel'].forEach(ev => document.addEventListener(ev, e => { if (arc.ptr.size && e.touches && e.touches.length === 0) arcReleaseAll(); }, { capture: true, passive: true }));
window.addEventListener('blur', arcReleaseAll);
window.addEventListener('pagehide', arcReleaseAll);
arcCanvas.addEventListener('contextmenu', e => e.preventDefault());
arcReady.addEventListener('click', () => { if (arc.state === 'ready') beginPlay(); });

/* HUD */
function arcHudSet(o) {
  if (o.score != null && o.score !== arc.score) {
    const up = o.score > arc.score; arc.score = o.score; const el = $('#arcScore'); el.textContent = fmtNum(o.score);
    if (up) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    if (arc.best > 0 && o.score > arc.best && !arc.beat && arc.state === 'play') { arc.beat = true; const b = $('#arcBest'); b.textContent = '★ New best!'; b.classList.add('beat'); arc.fx.push({ kind: 'text', x: arc.W / 2, y: arc.H * 0.28, vy: -24, life: 1.4, max: 1.4, text: 'NEW BEST!', color: '#FFE37A', size: 30, pulse: 1 }); confetti(36); sfx.sparkle(); }
  }
  if (o.hearts != null && (o.hearts !== arc.hearts || o.max != null)) {
    arc.hearts = o.hearts; if (o.max != null) arc.maxHearts = o.max;
    $('#arcHearts').innerHTML = arc.maxHearts ? Array.from({ length: arc.maxHearts }, (_, i) => `<i class="${i < arc.hearts ? 'on' : ''}">${ICON.heart}</i>`).join('') : '';
  }
  if (o.goal != null) $('#arcGoal').textContent = o.goal;
  if (o.prog != null) { $('#arcProg').style.width = (clamp(o.prog, 0, 1) * 100).toFixed(1) + '%'; $('#arcProg').parentNode.hidden = false; }
}
/* ---------- combo, fever and juice: shared by every mini-game ----------
   Games call api.hit(x, y, points) for every good thing and api.miss() when they get hurt. Chains raise a
   multiplier (×1.5 at 4, ×2 at 8, ×2.5 at 14); ten in a row starts Fever, which doubles everything for a while. */
const COMBO_WIN = { flappy: 3.6, maze: 2.6, shooter: 2.6, blocks: 10, sling: 5, platform: 3.2 };
const comboMult = n => n >= 14 ? 2.5 : n >= 8 ? 2 : n >= 4 ? 1.5 : 1;
const MULT_C = { 1: '#FFFFFF', 1.5: '#FFE37A', 2: '#FF9F43', 2.5: '#FF5C8A' };
function comboReset() { arc.combo = 0; arc.comboT = 0; arc.comboBest = 0; arc.mult = 1; arc.fever = 0; arc.fevers = 0; arc.feverT = 0; arc.stop = 0; arc.flash = 0; arc.hitT = 0; }
function arcHit(x, y, base, noPop) {
  if (arc.state !== 'play') return base || 0;
  arc.combo++; arc.comboT = arc.comboWin * (arc.fever > 0 ? 1.6 : 1); arc.hitT = 0.18;
  if (arc.combo > arc.comboBest) arc.comboBest = arc.combo;
  const m0 = arc.mult, m = comboMult(arc.combo);
  arc.mult = m;
  const lit = arc.combo === 10 && arc.fever <= 0;
  if (lit) feverStart(x, y);
  const total = m * (arc.fever > 0 ? 2 : 1);
  const pts = Math.round((base || 0) * total);
  if (m > m0 && !lit) { arc.fx.push({ kind: 'text', x, y: y - 26, vy: -30, life: 1.1, max: 1.1, text: `COMBO ×${m}`, color: MULT_C[m], size: 24, pulse: 1 }); sfx.sparkle(); }
  else if (!noPop && base >= 20 && arc.combo >= 3) arc.fx.push({ kind: 'text', x, y, vy: -46, life: 0.8, max: 0.8, text: '+' + pts, color: MULT_C[m], size: 16 });
  return pts;
}
function arcMiss() {
  if (arc.combo >= 4) arc.fx.push({ kind: 'text', x: arc.W / 2, y: arc.H * 0.3, vy: -20, life: 0.9, max: 0.9, text: 'Combo lost', color: '#C9C2F2', size: 16 });
  arc.combo = 0; arc.comboT = 0; arc.mult = 1;
}
function feverStart(x, y) {
  arc.fever = 7; arc.feverT = 0; arc.fevers++; arc.stop = Math.max(arc.stop, 0.35); arc.flash = 0.5; arc.flashC = '#FFD9F0';
  arc.fx.push({ kind: 'text', x: arc.W / 2, y: arc.H * 0.36, vy: -14, life: 1.6, max: 1.6, text: 'FEVER!', color: '#FF5C8A', size: 40, pulse: 1 });
  arc.fx.push({ kind: 'text', x: arc.W / 2, y: arc.H * 0.36 + 34, vy: -14, life: 1.6, max: 1.6, text: 'Everything ×2', color: '#FFE37A', size: 18 });
  for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, v = 120 + Math.random() * 260; arc.fx.push({ kind: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.8 + Math.random() * 0.6, max: 1.2, color: ARC_GEMS[i % ARC_GEMS.length], r: 2.5 + Math.random() * 3 }); }
  sfx.fanfare(); arc.shakeM = 6; arc.shakeT = 0.3;
}
function comboTick(dt) {
  if (arc.comboT > 0) { arc.comboT -= dt; if (arc.comboT <= 0) { arc.combo = 0; arc.mult = 1; } }
  if (arc.hitT > 0) arc.hitT -= dt;
  if (arc.fever > 0) {
    arc.fever -= dt; arc.feverT += dt;
    if (Math.random() < dt * 14) arc.fx.push({ kind: 'dot', x: Math.random() * arc.W, y: -6, vx: rand(-20, 20), vy: 60 + Math.random() * 80, life: 1.4, max: 1.4, color: ARC_GEMS[Math.floor(Math.random() * ARC_GEMS.length)], r: 2 + Math.random() * 2.5, star: 1 });
    if (arc.fever <= 0) { arc.fever = 0; arc.fx.push({ kind: 'text', x: arc.W / 2, y: arc.H * 0.3, vy: -20, life: 1, max: 1, text: 'Fever over', color: '#FFE37A', size: 16 }); }
  }
  if (arc.flash > 0) arc.flash -= dt;
}
/* the combo pill, the fever glow and screen flashes, drawn over the game */
let vigCache = null;
function drawJuice(c) {
  const W = arc.W, H = arc.H;
  // a soft vignette gives every stage a little depth
  if (!vigCache || vigCache.W !== W || vigCache.H !== H) { const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.8); g.addColorStop(0, 'rgba(20,14,40,0)'); g.addColorStop(1, 'rgba(20,14,40,.26)'); vigCache = { W, H, g }; }
  c.fillStyle = vigCache.g; c.fillRect(0, 0, W, H);
  if (arc.fever > 0) {
    const k = 0.55 + 0.45 * Math.sin(arc.feverT * 7);
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(255,92,138,0)'); g.addColorStop(1, `rgba(255,92,138,${(0.22 + 0.16 * k).toFixed(3)})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, 24); c.scale(1 + 0.06 * k, 1 + 0.06 * k);
    c.font = `800 15px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = '#2B2433'; c.strokeText('FEVER ×2', 0, 0); c.fillStyle = '#FF9BD2'; c.fillText('FEVER ×2', 0, 0);
    c.restore();
    c.fillStyle = 'rgba(43,36,51,.35)'; c.fillRect(W * 0.25, 38, W * 0.5, 5); c.fillStyle = '#FF9BD2'; c.fillRect(W * 0.25, 38, W * 0.5 * clamp(arc.fever / 7, 0, 1), 5);
  }
  if (arc.combo >= 2 && arc.comboT > 0) {
    const m = arc.mult, col = MULT_C[m], y = arc.fever > 0 ? 62 : 24, pw = 118, ph = 26;
    const pop = arc.hitT > 0 ? 1 + 0.18 * (arc.hitT / 0.18) : 1;
    c.save(); c.translate(W / 2, y); c.scale(pop, pop);
    c.fillStyle = 'rgba(43,36,51,.78)'; GFX.rr(c, -pw / 2, -ph / 2, pw, ph, 13); c.fill();
    c.lineWidth = 2; c.strokeStyle = col; c.stroke();
    c.font = `800 13px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col;
    c.fillText(`${arc.combo} combo  ×${m}`, 0, 0);
    c.restore();
    const frac = clamp(arc.comboT / (arc.comboWin * (arc.fever > 0 ? 1.6 : 1)), 0, 1);
    c.fillStyle = 'rgba(43,36,51,.5)'; c.fillRect(W / 2 - pw / 2, y + ph / 2 + 3, pw, 3); c.fillStyle = col; c.fillRect(W / 2 - pw / 2, y + ph / 2 + 3, pw * frac, 3);
  }
  if (arc.flash > 0) { c.globalAlpha = clamp(arc.flash / 0.5, 0, 1) * 0.7; c.fillStyle = arc.flashC; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}
function makeApi(W, S) {
  arc.comboWin = COMBO_WIN[W.key] || 3; comboReset();
  return {
    get W() { return arc.W; }, get H() { return arc.H; }, get t() { return arc.t; },
    def: S, world: W, stageNo: arc.s, keys: arc.keys, form: curForm(), stage: st.stage, sfx,
    hud: arcHudSet,
    hit: arcHit, miss: arcMiss, get combo() { return arc.combo; }, get mult() { return arc.mult * (arc.fever > 0 ? 2 : 1); }, get fever() { return arc.fever > 0; },
    hitstop: t => { arc.stop = Math.max(arc.stop, t || 0.1); },
    flash: (col, t) => { arc.flash = t || 0.3; arc.flashC = col || '#FFFFFF'; },
    win: (stars, score) => arcFinish(true, stars, score),
    lose: (msg, score) => arcFinish(false, 0, score, msg),
    finish: (win, data) => arcFinish(win, (data && data.stars) || 1, data && data.score, data && data.msg, data),
    shake: (m, t) => { arc.shakeM = m; arc.shakeT = t || 0.25; },
    pop: (x, y, text, color, size) => { arc.fx.push({ kind: 'text', x, y, vy: -46, life: 0.9, max: 0.9, text, color: color || '#FFFFFF', size: size || 18 }); },
    burst: (x, y, color, n, sp) => {
      for (let i = 0; i < (n || 10); i++) { const a = Math.random() * 6.283, v = (sp || 140) * (0.4 + Math.random() * 0.8); arc.fx.push({ kind: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, max: 0.9, color: color || '#FFE37A', r: 2 + Math.random() * 3 }); }
    },
    pet: (c, x, y, h, o) => drawPetSprite(c, x, y, h, o),
    petSnap: (c, h, o) => { const m = c.getTransform(); return petSnap(h, o, Math.max(0.5, Math.hypot(m.a, m.b))); },
  };
}
function drawFx(c, dt) {
  arc.fx = arc.fx.filter(p => (p.life -= dt) > 0);
  for (const p of arc.fx) {
    const a = clamp(p.life / p.max, 0, 1);
    if (p.kind === 'text') {
      p.y += p.vy * dt;
      const sz = p.pulse ? p.size * (1 + 0.25 * Math.max(0, (p.life / p.max - 0.7) / 0.3)) : p.size;
      c.globalAlpha = a; c.font = `800 ${sz.toFixed(1)}px ${arcFont}`;
      c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#2B2433'; c.strokeText(p.text, p.x, p.y); c.fillStyle = p.color; c.fillText(p.text, p.x, p.y);
    } else {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.star ? 40 : 260) * dt; p.vx *= 0.98;
      c.globalAlpha = a; c.fillStyle = p.color; c.beginPath();
      if (p.star) { const r = p.r * 1.6, t = p.life * 6; for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, an = t + i * Math.PI / 5; c.lineTo(p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr); } c.closePath(); }
      else c.arc(p.x, p.y, p.r, 0, 6.283);
      c.fill();
    }
  }
  c.globalAlpha = 1;
}

/* ---------- starting, pausing and finishing a stage ---------- */
let arcFont = 'sans-serif';
function tiredToast() {
  const d = Object.keys(DRINKS).find(k => st.pantry[k]);
  toast(d ? `${st.name} is too tired. Drink a ${DRINKS[d].name.toLowerCase()} (Feed menu or the Tower tab), or let them nap.` : `${st.name} is too tired for an adventure. Let them nap, or use Fill needs in developer tools.`, 4200);
}
async function startStage(w, s) {
  const W = WORLDS[w - 1], S = W.stages[s - 1];
  if (!stageOpen(w, s)) return;
  if (!st.unlockAll && st.energy < 8) { tiredToast(); return; }
  if (!GAMES[W.key]) { toast('This world is still being built'); return; }
  launchArc(W, S, w, s, 'map', `${W.game} ${w}-${s}`, S.name);
}
async function launchArc(W, S, w, s, mode, title, sub) {
  if (st.asleep) { st.asleep = false; pet.awakeUntil = now() + 300; if (pet.mode === 'sleep') setMode('idle'); }
  mapCard.hidden = true;
  arc.mode = mode; arc.w = w; arc.s = s; arc.open = true; arc.state = 'loading'; arc.paused = false; arc.fx = []; arc.t = 0; arc.score = -1; arc.hearts = -1; arc.maxHearts = 0;
  arc.best = mode === 'map' ? (st.map.best[skey(w, s)] || 0) : 0; arc.beat = false;
  { const b = $('#arcBest'); b.classList.remove('beat'); b.hidden = !arc.best; if (arc.best) b.textContent = `best ${fmtNum(arc.best)}`; }
  Object.keys(arc.keys).forEach(k => { arc.keys[k] = false; });
  arcEl.hidden = false; arcEl.dataset.world = W.key; document.body.classList.add('in-arcade');
  arcPanel.hidden = true; arcReady.hidden = true; $$('.rift-match', arcEl).forEach(e => e.remove());
  $('#arcName').textContent = title;
  $('#arcGoal').textContent = sub;
  $('#arcProg').parentNode.hidden = true;
  arcHudSet({ score: 0, hearts: 0, max: 0 });
  setControls(W.key);
  arcLayout();
  arcFont = (getComputedStyle(document.body).getPropertyValue('--f-display') || 'sans-serif').trim();
  arc.sprites = await loadSprites();
  if (mode === 'dungeon') { try { arc.sprites.rig = await loadRig(); } catch (e) { arc.sprites.rig = null; } }
  arc.partySprites = null;
  if (mode === 'dungeon' && S.party && S.party.length > 1) arc.partySprites = await Promise.all(S.party.map(async m => { if (m.p === st && arc.sprites) return arc.sprites; const sp = await loadSprites(formOf(m.p)); sp.rig = null; loadRig(formOf(m.p)).then(r => { sp.rig = r; }, () => {}); return sp; }));   // (the others' parts are made while the floor is played: until then a switched-in pet is drawn whole)
  if (!arc.open) return;
  arc.api = makeApi(W, S);
  try { arc.game = GAMES[W.key].create(arc.api); }
  catch (err) { console.error(err); closeArcade(); toast('That stage failed to load'); return; }
  arc.state = 'ready';
  if (mode === 'dungeon') arcReady.innerHTML = S.rift ? (S.rift.gate ? gateReadyHTML(S) : riftReadyHTML(S)) : dunReadyHTML(S);
  else {
    const extra = W.key === 'shooter' ? `<div class="ar-ability"><p class="eyebrow">${esc(st.name)}'s ability</p>${abilityHTML(applyAbOv(petAbility(curForm(), st.dna.seed), st))}</div>` : '';
    arcReady.innerHTML = `<div class="ar-card"><p class="eyebrow">${esc(W.name)}</p><h2>${w}-${s} ${esc(S.name)}</h2><p class="ar-goal">${esc(stageGoalText(W, S))}</p>${extra}<p class="note">${esc(W.how)}</p><button class="btn primary" type="button">${ICON.play}Start</button></div>`;
  }
  arcReady.hidden = false;
  arc.last = performance.now();
  cancelAnimationFrame(arc.raf);
  arc.raf = requestAnimationFrame(arcFrame);
  saveSoon();
}
function beginPlay() {
  if (arc.state !== 'ready') return;
  if (!st.unlockAll) { st.energy = Math.max(0, st.energy - 3); updateHud(); }
  arcReady.hidden = true;
  arc.state = 'play'; arc.last = performance.now();
  if (arc.game.start) arc.game.start();
  sfx.chirp();
}
function arcFrame(ms) {
  if (!arc.open) return;
  arc.raf = requestAnimationFrame(arcFrame);
  let dt = (ms - arc.last) / 1000;
  arc.last = ms;
  if (!(dt > 0)) return;
  if (dt > 0.05) dt = 0.05;
  if (!arc.game) return;
  const live = arc.state === 'play' && !arc.paused;
  if (live && arc.stop > 0) { arc.stop -= dt; dt *= 0.22; }
  if (live) { arc.t += dt; arc.game.update(dt); comboTick(dt); }
  // the Tower draws a lot: if this device is struggling, drop to a slightly lower resolution for the rest of the session;
  // if it still runs at half speed or worse there, once a Super Fiend has given up all its light passes, a little lower again
  if (live && arc.mode === 'dungeon' && arc.dpr > 1.25) {
    arc.frames.push(dt);
    if (arc.frames.length >= 120) { const f = arc.frames.slice().sort((a, b) => a - b), med = f[f.length >> 1], first = arc.dpr > 1.5; arc.frames.length = 0;
      const lit = typeof DunFiend !== 'undefined' && DunFiend.KIT && DunFiend.KIT.qq() > 0;
      if (first ? med > 0.021 : med > 0.026 && !lit) { arc.dunCap = first ? 1.5 : 1.25; arcLayout(); } }
  } else if (!live) arc.frames.length = 0;
  else if (arc.state === 'end' && arc.game.idle) arc.game.idle(dt);
  const c = arcCtx;
  c.save();
  if (arc.shakeT > 0 && live) { arc.shakeT -= dt; const m = arc.shakeM * clamp(arc.shakeT / 0.25, 0, 1); c.translate(rand(-m, m), rand(-m, m)); }
  arc.game.draw(c);
  if (arc.mode !== 'dungeon' && (live || arc.state === 'end')) drawJuice(c);
  drawFx(c, live || arc.state === 'end' ? dt : 0);
  c.restore();
  if (typeof retro !== 'undefined') retro.post(arcCanvas, c);   /* the old-film lens: a touch of chromatic aberration */
}
function togglePause(force) {
  if (arc.state !== 'play') return;
  arc.paused = force != null ? force : !arc.paused;
  if (arc.paused) {
    Object.keys(arc.keys).forEach(k => keyUp(k));
    const feed = arc.mode === 'dungeon' ? feedMenuHTML() : '';
    arcPanel.innerHTML = `<div class="ar-card"><h2>Paused</h2>${feed}<div class="ar-row"><button class="btn primary" type="button" data-arc="resume">${ICON.play}Resume</button><button class="btn" type="button" data-arc="retry">Restart</button><button class="btn" type="button" data-arc="quit">Quit</button></div></div>`;
    arcPanel.hidden = false;
  } else { arcPanel.hidden = true; arc.last = performance.now(); }
}
$('#arcPauseBtn').addEventListener('click', () => { sfx.unlock(); if (arc.state === 'play') togglePause(); else if (arc.state === 'ready' || arc.state === 'loading') closeArcade(); });
arcPanel.addEventListener('click', e => {
  const b = e.target.closest('[data-arc]');
  if (!b) return;
  const k = b.dataset.arc;
  if (k === 'resume') togglePause(false);
  else if (k === 'feed') { if (arc.game && arc.game.feed && arc.game.feed(b.dataset.k)) { sfx.yum(); const m = document.querySelector('#arcPanel .ar-feed'); if (m) m.outerHTML = feedMenuHTML(); } }
  else if ((k === 'retry' || k === 'next') && arc.mode === 'dungeon' && arc.api && arc.api.def && arc.api.def.rift) { const R = arc.api.def.rift; closeArcade(true); if (R.gate) startGate(R.id); else startRift(R.id, k === 'next' ? R.stage + 1 : R.stage); }
  else if (k === 'retry' && arc.mode === 'dungeon') { const n = arc.s; closeArcade(true); startDungeon(n); }
  else if (k === 'next' && arc.mode === 'dungeon') { const n = arc.s + 1; closeArcade(true); if (dunFloorOpen(n)) { dunSel = n; startDungeon(n); } else renderDungeon(); }
  else if (k === 'retry') { const w = arc.w, s = arc.s; closeArcade(true); startStage(w, s); }
  else if (k === 'next') { const w = arc.w, s = arc.s; closeArcade(true); const n = s < stageCount(w) ? [w, s + 1] : [w + 1, 1]; if (n[0] <= WORLDS.length && stageOpen(n[0], n[1])) { mapSel = n; startStage(n[0], n[1]); } else renderMap(); }
  else if (k === 'quit' || k === 'map') closeArcade();
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { arcReleaseAll(); if (arc.open && arc.state === 'play' && !arc.paused) togglePause(true); } });
window.addEventListener('resize', () => { if (arc.open) requestAnimationFrame(arcLayout); });
function arcFinish(win, stars, score, msg, data) {
  if (arc.state !== 'play') return;
  arc.state = 'end';
  Object.keys(arc.keys).forEach(k => keyUp(k));
  if (arc.mode === 'dungeon') { dunFinish(win, msg, data || {}); return; }
  score = Math.max(0, Math.floor(score || arc.score || 0));
  const W = WORLDS[arc.w - 1], k = skey(arc.w, arc.s);
  const prevBest = st.map.best[k] || 0;
  st.map.plays = (st.map.plays || 0) + 1;
  let lines = [];
  if (win) { stars = clamp(Math.round(stars), 1, 3); lines = stageRewards(arc.w, arc.s, stars, score); sfx.fanfare(); confetti(stars === 3 || score > prevBest ? 90 : 40); }
  else { const xp = bondLevelOf(st); addXP(xp); lines = [[ICON.heart, `+1 bond level for playing (${fmtNum(xp)} bond)`]]; sfx.wrong(); }
  if (arc.comboBest >= 4) lines.push([ICON.sparkle, `Best combo ${arc.comboBest}${arc.fevers ? ` · Fever ×${arc.fevers}` : ''}`]);
  saveSoon(); updateHud();
  const nextOpen = win && (arc.s < stageCount(arc.w) ? stageOpen(arc.w, arc.s + 1) : arc.w < WORLDS.length && stageOpen(arc.w + 1, 1));
  setTimeout(() => {
    if (!arc.open) return;
    const starRow = win ? `<div class="big-stars">${[1, 2, 3].map(n => `<i class="${n <= stars ? 'on' : ''}" style="animation-delay:${0.15 + n * 0.22}s"></i>`).join('')}</div>` : '';
    arcPanel.innerHTML = `<div class="ar-card end"><p class="eyebrow">${esc(W.game)} ${arc.w}-${arc.s}</p><h2>${win ? (stars === 3 ? 'Perfect!' : 'Stage clear!') : 'Oh no!'}</h2>${starRow}${win ? '' : `<p class="ar-goal">${esc(msg || 'Try again!')}</p>`}
      <p class="mono ar-score">Score ${fmtNum(score)}${score > prevBest && prevBest ? ' · New best!' : prevBest ? ` · Best ${fmtNum(Math.max(prevBest, score))}` : ''}</p>
      <ul class="rewards">${lines.map(l => `<li>${l[0] || ''}<span>${esc(l[1])}</span></li>`).join('')}</ul>
      <div class="ar-row"><button class="btn" type="button" data-arc="map">${ICON.map}Map</button><button class="btn" type="button" data-arc="retry">Retry</button>${nextOpen ? `<button class="btn primary" type="button" data-arc="next">Next${ICON.play}</button>` : ''}</div></div>`;
    arcPanel.hidden = false;
  }, win ? 650 : 900);
}
/* confetti from the top of the play area, for stage clears and new bests */
function confetti(n) {
  for (let i = 0; i < n; i++) arc.fx.push({ kind: 'dot', x: Math.random() * arc.W, y: -10 - Math.random() * 80, vx: rand(-40, 40), vy: 90 + Math.random() * 120, life: 1.6 + Math.random() * 0.8, max: 2.4, color: ARC_GEMS[i % ARC_GEMS.length], r: 2.5 + Math.random() * 3, star: i % 3 === 0 ? 1 : 0 });
}
function closeArcade(quiet) {
  $$('.rift-match', arcEl).forEach(e => e.remove());
  arc.open = false; arc.state = 'off'; arc.paused = false;
  cancelAnimationFrame(arc.raf);
  try { if (arc.game && arc.game.destroy) arc.game.destroy(); } catch (e) {}
  arc.game = null; arc.ptr.clear();
  arcEl.hidden = true; arcPanel.hidden = true; arcReady.hidden = true; document.body.classList.remove('in-arcade');
  arcCtx.setTransform(1, 0, 0, 1, 0, 0); arcCtx.clearRect(0, 0, arcCanvas.width, arcCanvas.height);
  lastStatAt = Date.now();
  if (!quiet && mapOpen) { renderMapTab(); if (mapTab === 'town' && mapSel) renderStageCard(); }
  if (arc.mode === 'dungeon') saveSoon();
  arc.mode = null;
}

/* ---------- shared drawing helpers for games ---------- */
/* lighten (k > 0) or darken (k < 0) a #rrggbb colour; cached because games call it every frame */
const shadeCache = new Map();
function shadeC(hex, k) {
  const key = hex + '|' + k;
  let v = shadeCache.get(key);
  if (v) return v;
  const n = parseInt(String(hex).slice(1, 7), 16) || 0, to = k < 0 ? 0 : 255, a = Math.min(1, Math.abs(k));
  v = '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(ch => Math.round(ch + (to - ch) * a).toString(16).padStart(2, '0')).join('');
  if (shadeCache.size > 600) shadeCache.clear();
  shadeCache.set(key, v);
  return v;
}
/* a gloomy's spikes: [angle, length (× r), half width], in drawing order; the first three are the mohawk */
const GLOOMY_SPIKES = [[-1.9, 1.2, 0.14], [-1.57, 1.4, 0.16], [-1.24, 1.2, 0.14], [-0.72, 1.14, 0.17], [-0.2, 1.16, 0.18], [0.3, 1.08, 0.17], [0.8, 1.06, 0.17], [1.3, 0.94, 0.16], [1.84, 0.94, 0.16], [2.34, 1.06, 0.17], [2.84, 1.08, 0.17], [3.34, 1.16, 0.18], [3.86, 1.14, 0.17]];
const TEXT_PICS = new Map(), FONTS_IN = new Set();
const GFX = {
  line: '#2B2433',
  rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); },
  /* a round shaded thing with a glint: lit from the top left like everything else in the game */
  blob(c, x, y, r, fill, lw) {
    c.beginPath(); c.arc(x, y, r, 0, 6.283);
    if (r > 6 && typeof fill === 'string' && fill.charAt(0) === '#') { const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.15); g.addColorStop(0, shadeC(fill, 0.34)); g.addColorStop(0.55, fill); g.addColorStop(1, shadeC(fill, -0.3)); c.fillStyle = g; }
    else c.fillStyle = fill;
    c.fill(); c.lineWidth = lw || 2.5; c.strokeStyle = GFX.line; c.stroke();
    if (r > 6) { c.globalAlpha = 0.45; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(x - r * 0.36, y - r * 0.42, r * 0.22, r * 0.13, -0.6, 0, 6.283); c.fill(); c.globalAlpha = 1; }
  },
  star(c, x, y, r, fill, lw) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = fill; c.fill(); if (lw !== 0) { c.lineWidth = lw || 2; c.strokeStyle = GFX.line; c.stroke(); }
  },
  gem(c, x, y, r, color) {
    c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.85, y - r * 0.15); c.lineTo(x, y + r); c.lineTo(x - r * 0.85, y - r * 0.15); c.closePath();
    if (r > 5 && typeof color === 'string' && color.charAt(0) === '#') { const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, shadeC(color, 0.3)); g.addColorStop(0.5, color); g.addColorStop(1, shadeC(color, -0.3)); c.fillStyle = g; } else c.fillStyle = color;
    c.fill(); c.lineWidth = 2; c.strokeStyle = GFX.line; c.stroke();
    if (r > 5) { c.beginPath(); c.moveTo(x - r * 0.85, y - r * 0.15); c.lineTo(x, y - r * 0.05); c.lineTo(x + r * 0.85, y - r * 0.15); c.lineTo(x, y + r); c.closePath(); c.fillStyle = 'rgba(43,36,51,.14)'; c.fill(); }
    c.beginPath(); c.moveTo(x - r * 0.35, y - r * 0.3); c.lineTo(x, y - r * 0.65); c.lineTo(x + r * 0.3, y - r * 0.3); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.6; c.stroke();
  },
  /* a gloomy: the spiky little troublemaker in every world. Horns, a mohawk of spikes, a scheming squint
     and a fanged grin. o: color, scared, crown, lookX, lookY, rot, t (time, for the wiggle), seed */
  gloomy(c, x, y, r, o) {
    o = o || {};
    if (!(r > 0.6)) return;
    const sc = !!o.scared, base = sc ? '#B8C4FF' : (o.color || '#6E5A9E');
    const t = o.t != null ? o.t : (reduceMotion ? 0 : performance.now() / 1000), ph = o.seed || 0;
    const tiny = r < 9, lw = clamp(r * 0.11, 1.3, 2.8), ln = GFX.line;
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
    c.lineJoin = 'round'; c.lineCap = 'round';
    // a devil tail flicking behind
    if (!tiny) {
      const wag = Math.sin(t * 5.5 + ph) * 0.3, tx = r * (1.08 + wag * 0.25), ty = r * (0.2 - wag * 0.5);
      c.beginPath(); c.moveTo(r * 0.45, r * 0.55); c.quadraticCurveTo(r * 1.05, r * 0.85, tx, ty);
      c.lineWidth = Math.max(2, r * 0.13) + lw * 2; c.strokeStyle = ln; c.stroke();
      c.lineWidth = Math.max(2, r * 0.13); c.strokeStyle = shadeC(base, -0.2); c.stroke();
      c.save(); c.translate(tx, ty); c.rotate(-0.9 + wag);
      c.beginPath(); c.moveTo(0, -r * 0.2); c.lineTo(r * 0.16, r * 0.06); c.lineTo(0, r * 0.01); c.lineTo(-r * 0.16, r * 0.06); c.closePath();
      c.fillStyle = shadeC(base, -0.2); c.fill(); c.lineWidth = lw * 0.8; c.strokeStyle = ln; c.stroke();
      c.restore();
    }
    // the spiky body: curved spikes around a round core, a mohawk on top
    const rb = r * 0.76, wig = tiny ? 0 : 0.035, droop = sc ? 0.84 : 1, mohawk = o.crown ? 0.8 : 1;
    const SP = GLOOMY_SPIKES;
    c.beginPath();
    for (let i = 0; i < SP.length; i++) {
      const [a, len, w] = SP[i], L = r * len * droop * (i < 3 ? mohawk : 1) * (1 + Math.sin(t * 7 + i * 1.9 + ph) * wig), bend = sc ? -0.16 : 0.14;
      const a0 = a - w, a1 = a + w;
      if (i === 0) c.moveTo(Math.cos(a0) * rb, Math.sin(a0) * rb);
      else c.arc(0, 0, rb, SP[i - 1][0] + SP[i - 1][2], a0);
      const ma = a - w * 0.1, mr = rb + (L - rb) * 0.42, mb = a + w * 0.45, mr2 = rb + (L - rb) * 0.36;
      c.quadraticCurveTo(Math.cos(ma) * mr, Math.sin(ma) * mr, Math.cos(a + bend) * L, Math.sin(a + bend) * L);
      c.quadraticCurveTo(Math.cos(mb) * mr2, Math.sin(mb) * mr2, Math.cos(a1) * rb, Math.sin(a1) * rb);
    }
    c.arc(0, 0, rb, SP[SP.length - 1][0] + SP[SP.length - 1][2], SP[0][0] - SP[0][2] + 6.2832);
    c.closePath();
    if (tiny) c.fillStyle = base;
    else { const gr = c.createRadialGradient(-r * 0.32, -r * 0.42, r * 0.08, 0, 0, r * 1.2); gr.addColorStop(0, shadeC(base, 0.38)); gr.addColorStop(0.5, base); gr.addColorStop(1, shadeC(base, -0.38)); c.fillStyle = gr; }
    c.fill(); c.lineWidth = lw; c.strokeStyle = ln; c.stroke();
    // little horns (a crown replaces them)
    if (!o.crown && !tiny) {
      [-1, 1].forEach(s => {
        c.beginPath(); c.moveTo(s * r * 0.28, -r * 0.7); c.quadraticCurveTo(s * r * 0.4, -r * 1.0, s * r * 0.72, -r * 1.1);
        c.quadraticCurveTo(s * r * 0.56, -r * 0.86, s * r * 0.54, -r * 0.6); c.closePath();
        c.fillStyle = '#F4E9FF'; c.fill(); c.lineWidth = lw * 0.85; c.strokeStyle = ln; c.stroke();
      });
    }
    if (!tiny) { c.globalAlpha = 0.4; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(-r * 0.38, -r * 0.42, r * 0.15, r * 0.09, -0.6, 0, 6.283); c.fill(); c.globalAlpha = 1; }
    // the face
    const lx = clamp(o.lookX || 0, -1, 1) * r * 0.07, ly = clamp(o.lookY || 0, -1, 1) * r * 0.06;
    const eyes = [[-r * 0.3, -r * 0.06, r * 0.21], [r * 0.3, -r * 0.08, r * 0.185]];
    eyes.forEach(([ex, ey, er], k) => {
      c.beginPath(); c.ellipse(ex, ey, er, er * (sc ? 1.15 : 1), 0, 0, 6.283); c.fillStyle = sc ? '#FFFFFF' : '#FFF4C2'; c.fill();
      if (!tiny) { c.lineWidth = lw * 0.6; c.strokeStyle = ln; c.stroke(); }
      c.fillStyle = ln; c.beginPath(); c.arc(ex + lx, ey + ly + er * 0.12, er * (sc ? 0.32 : 0.5), 0, 6.283); c.fill();
      if (!tiny) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex + lx - er * 0.18, ey + ly - er * 0.08, er * 0.16, 0, 6.283); c.fill(); }
      if (!sc) {
        // a scheming squint: the lid slants down toward the middle, and one brow is cocked higher
        const inX = ex + (k ? -1 : 1) * er * 1.3, outX = ex - (k ? -1 : 1) * er * 1.3, hi = k ? r * 0.07 : 0;
        c.save(); c.beginPath(); c.ellipse(ex, ey, er + 0.5, er + 0.5, 0, 0, 6.283); c.clip();
        c.beginPath(); c.moveTo(inX, ey - er * 1.6); c.lineTo(inX, ey - er * 0.05 - hi); c.lineTo(outX, ey - er * 0.72 - hi); c.lineTo(outX, ey - er * 1.6);
        c.closePath(); c.fillStyle = shadeC(base, -0.12); c.fill(); c.restore();
      }
    });
    // brows
    c.strokeStyle = ln; c.lineWidth = Math.max(1.5, r * 0.1);
    c.beginPath();
    if (sc) { c.moveTo(-r * 0.48, -r * 0.34); c.lineTo(-r * 0.16, -r * 0.44); c.moveTo(r * 0.47, -r * 0.36); c.lineTo(r * 0.15, -r * 0.45); }
    else { c.moveTo(-r * 0.56, -r * 0.33); c.lineTo(-r * 0.08, -r * 0.1); c.moveTo(r * 0.54, -r * 0.42); c.lineTo(r * 0.09, -r * 0.15); }
    c.stroke();
    // the mouth: a crooked fanged grin (or a wobbly scared one)
    if (sc) {
      c.lineWidth = Math.max(1.4, r * 0.08); c.beginPath(); c.moveTo(-r * 0.32, r * 0.42);
      for (let i = 1; i <= 6; i++) c.lineTo(-r * 0.32 + i * r * 0.107, r * (i % 2 ? 0.34 : 0.42));
      c.stroke();
      if (!tiny) { c.fillStyle = '#9FD8F0'; c.beginPath(); c.moveTo(r * 0.62, -r * 0.62); c.quadraticCurveTo(r * 0.76, -r * 0.38, r * 0.64, -r * 0.32); c.quadraticCurveTo(r * 0.5, -r * 0.38, r * 0.62, -r * 0.62); c.fill(); }
    } else {
      c.beginPath(); c.moveTo(-r * 0.4, r * 0.2); c.quadraticCurveTo(0, r * 0.3, r * 0.46, r * 0.1);
      c.quadraticCurveTo(r * 0.3, r * 0.6, -r * 0.02, r * 0.56); c.quadraticCurveTo(-r * 0.3, r * 0.52, -r * 0.4, r * 0.2); c.closePath();
      c.fillStyle = '#3A1830'; c.fill();
      if (!tiny) {
        c.save(); c.clip();
        c.fillStyle = '#FF7FA8'; c.beginPath(); c.ellipse(r * 0.12, r * 0.56, r * 0.18, r * 0.12, -0.3, 0, 6.283); c.fill();
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(-r * 0.27, r * 0.2); c.lineTo(-r * 0.17, r * 0.39); c.lineTo(-r * 0.09, r * 0.24); c.closePath(); c.moveTo(r * 0.17, r * 0.2); c.lineTo(r * 0.25, r * 0.36); c.lineTo(r * 0.32, r * 0.16); c.closePath(); c.fill();
        c.restore();
      }
      c.lineWidth = Math.max(1.3, r * 0.075); c.strokeStyle = ln; c.stroke();
    }
    if (o.crown) { c.beginPath(); c.moveTo(-r * 0.45, -r * 0.72); c.lineTo(-r * 0.58, -r * 1.28); c.lineTo(-r * 0.22, -r * 1.02); c.lineTo(0, -r * 1.44); c.lineTo(r * 0.22, -r * 1.02); c.lineTo(r * 0.58, -r * 1.28); c.lineTo(r * 0.45, -r * 0.72); c.closePath(); c.fillStyle = '#FFD447'; c.fill(); c.lineWidth = Math.max(1.5, lw * 0.85); c.strokeStyle = ln; c.stroke(); c.fillStyle = '#FF5C8A'; c.beginPath(); c.arc(0, -r * 0.92, r * 0.08, 0, 6.283); c.fill(); }
    c.restore();
  },
  heart(c, x, y, r, fill) {
    c.beginPath(); c.moveTo(x, y + r * 0.9);
    c.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.45);
    c.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.3, y - r * 0.1, x, y + r * 0.9);
    c.fillStyle = fill || '#FF5C8A'; c.fill(); c.lineWidth = 2; c.strokeStyle = GFX.line; c.stroke();
  },
  text(c, s, x, y, size, color, align) {
    c.font = `800 ${size}px ${arcFont}`; c.textAlign = align || 'center'; c.textBaseline = 'middle';
    c.lineWidth = Math.max(3, size / 5); c.strokeStyle = GFX.line; c.lineJoin = 'round'; c.strokeText(s, x, y); c.fillStyle = color || '#FFFFFF'; c.fillText(s, x, y);
  },
  /* the same text kept as a picture: what is written over a fight is mostly the same words and numbers frame after
     frame, and an outline round every glyph is slow to paint. (Until the display font is in, it is written as it is, so
     no picture keeps a stand-in font) */
  textS(c, s, x, y, size, color, align) { GFX.labelS(c, s, x, y, size, 800, color || '#FFFFFF', GFX.line, Math.max(3, size / 5), align); },
  /* any one-line label kept as a picture: its weight, fill, outline (or none) and the outline's width, centred on its line
     (as textBaseline 'middle' sets it) and aligned left, centre or right on x, as the canvas would write it */
  // whether the display font is in at this weight and size (asked of the page only until it is: asking costs a little)
  fontIn(font) { if (FONTS_IN.has(font)) return true; if (!(document.fonts && document.fonts.check && document.fonts.check(font))) return false; FONTS_IN.add(font); return true; },
  labelS(c, s, x, y, size, weight, fill, stroke, lw, align) {
    const font = `${weight} ${size}px ${arcFont}`;
    if (!FONTS_IN.has(font)) { if (!GFX.fontIn(font)) { c.font = font; c.textAlign = align || 'center'; c.textBaseline = 'middle'; if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.strokeText(s, x, y); } c.fillStyle = fill; c.fillText(s, x, y); return; } FONTS_IN.add(font); }
    const k = Math.min(3, (typeof arc !== 'undefined' && arc.dpr) || 1), key = s + '|' + font + '|' + fill + '|' + (stroke || '') + '|' + lw + '|' + k;
    let sp = TEXT_PICS.get(key);
    if (sp) { TEXT_PICS.delete(key); TEXT_PICS.set(key, sp); }
    else {
      const ow = stroke ? lw : 0, pad = ow + 2, cv = document.createElement('canvas'), g = cv.getContext('2d'); g.font = font;
      const w = Math.ceil(g.measureText(s).width + pad * 2), h = Math.ceil(size * 1.5 + ow * 2);
      cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k));
      g.setTransform(k, 0, 0, k, 0, 0); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(s, w / 2, h / 2); }
      g.fillStyle = fill; g.fillText(s, w / 2, h / 2);
      sp = { cv, w, h, pad }; TEXT_PICS.set(key, sp); if (TEXT_PICS.size > 320) { const k0 = TEXT_PICS.keys().next().value, o0 = TEXT_PICS.get(k0); TEXT_PICS.delete(k0); o0.cv.width = o0.cv.height = 0; }   // (its picture let go at once, not when the page next tidies up)
    }
    // laid down pixel for pixel, on the screen's own pixels (sharper, and cheaper to draw than between them)
    const x0 = align === 'left' ? x - sp.pad : align === 'right' ? x + sp.pad - sp.w : x - sp.w / 2, y0 = y - sp.h / 2, M = c.getTransform(), q = M.a;
    if (!M.b && !M.c && q === M.d && q >= 1.5) c.drawImage(sp.cv, (Math.round(x0 * q + M.e) - M.e) / q, (Math.round(y0 * q + M.f) - M.f) / q, sp.cv.width / k, sp.cv.height / k);
    else c.drawImage(sp.cv, x0, y0, sp.w, sp.h);
  },
};
const ARC_GEMS = ['#F7A8C4', '#A77BE8', '#F5C542', '#3FC48A', '#4F8FF0', '#EAF2FF'];

/* the pantry while paused in the Tower: tap a food to feed the played pet (heals, restores a little MP, gives level XP) */
function feedMenuHTML() {
  const keys = Object.keys(SNACKS).filter(k => (st.pantry[k] || 0) > 0 && !SNACKS[k].drink);
  const who = arc.game && arc.game._dbg ? arc.game._dbg.party[arc.game._dbg.cur()].p : st;
  return `<div class="ar-feed"><p class="eyebrow">Feed ${esc(who.name)} · level ${who.dlv || 1}</p>${keys.length ? `<div class="ar-feed-row">${keys.map(k => `<button class="btn small" type="button" data-arc="feed" data-k="${k}">${SNACK_SVG[k] || ''}${esc(SNACKS[k].name)} <span class="mono">×${st.pantry[k]}</span><small>${foodEffect(k, who)}</small></button>`).join('')}</div>` : '<p class="note">No food in the pantry. Monsters drop some; the farm grows more; the Shop sells the rest.</p>'}</div>`;
}
