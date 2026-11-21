/* ---------- v388 D: BREAK_FX — the shared destruction effect for every destructible object ----------
   Whatever breaks (a dungeon prop, a pot, a crate, a crystal, a basalt column, a lavafall slab, a frost well, a furnace
   idol...) goes through one effect, scaled by the object's size: a pre-crack (the object flashes, shakes, and glowing
   cracks run across it from the side it was hit), then its own silhouette shatters into real pieces cut from its sprite
   (Voronoi cells, so the cracks are exactly where it splits), with physics (outward and upward, gravity onto the floor,
   spin and tumble, bounce, slide, settle) plus material-coloured debris, dust and smoke, sparks, embers or flame wisps, a
   ground shockwave, a camera shake and a deep crunch for big things. Settled pieces near the spot are baked into a rubble
   decal that stays on the floor (scorched / frosted / splintered / glittering by material); the rest fade.

   ======================= API =======================
   BREAK_FX.burst(X, x, y, o) -> true      x, y: the object's FEET in world tiles (where it stands on the floor).
                                           X: the dungeon's X / a rift helper X / null — the effect uses the running
                                           dungeon it is bound to (20b binds it each floor); X is only a fallback
                                           (needs sx, sy, Tz).
     o.sprite  { cv, ax, ay }              the object's own picture (feet at ax, ay in its pixels), as DunWorld.propSprite
                                           returns; drawn at o.spriteK canvas units per sprite px (default zoom / SK)
     o.kind, o.v, o.biome                  or a DunWorld.PROPS kind: its sprite is fetched (and o.mat/o.size inferred
                                           from BREAK_FX.KIND / matOf(kind) when not given)
     o.paint(c, P)                         or a painter: draws the object with its feet at (0, 0), P px per tile (as the
                                           PROPS painters do); o.w, o.h (tiles) its box (default 2 x 3). Cached by o.key.
     (none of these: a rough boulder in the material's colours, o.w x o.h tiles)
     o.mat     'stone' | 'basalt' | 'crystal' | 'blackfire' | 'glass' | 'ice' | 'wood' | 'foliage' | 'pottery' | 'iron' |
               'lava' | 'bone' | 'coral' | 'cloud'   (default from the kind, else 'stone')
     o.size    tiles (about the object's height); default from the sprite's opaque box. >= 2.5 is "big" (shake, crunch,
               long collapse, big dust cloud), >= 4 huge.
     o.cols    [mid, dark, light] debris colours (default sampled from the sprite, else the material's)
     o.hot     a glow colour for hot cores / cracks (basalt and lava default '#FF6A1F')
     o.lava    true: a molten splash and burning ground (lavafalls, forges, magma glass)
     o.steam   true: a burst of steam (pressure vessels)
     o.mix     a second material for extra debris (a frost well: 'stone')
     o.rubble  true | false | 'scorch' — leave a decal (default by material: yes, except cloud)
     o.from    { x, y } the hitter: pieces fly away from it (default the pet)
     o.quiet   one of many smashed at once (a vehicle): fewer pieces, no shake, sound throttled
     o.shake   multiplier on the camera shake (0 = none); o.delay overrides the pre-crack time (s); o.sound false: silent
   BREAK_FX.prop(X, p, o)       a DunResidue prop { kind, v, biome, x, y }: kind map, sprite, burst (20l calls it)
   BREAK_FX.matOf(kind, el)     the material a prop kind breaks as;  BREAK_FX.KIND[kind] = { mat, ... } the explicit map
   BREAK_FX.bind(ctx) / update(dt) / drawGround(c) / drawWorld(c) / drawFx(c, Q) / reset()   (20b's hooks)
   BREAK_FX.stats() -> { shards, parts, decals, ghosts, t }   (tests; also on self.BREAK_FX)
   Wired (v388 D): every prop (20l breakProp, so shots, areas, ults and the vehicles' smashes), pots/crates/chests/barrels
   (20b breakPot), smashed shrines (20b), Rift 4's hourglass (20s2) and wall growths (20s1); S's furnace idols (20zz4) call
   burst with a painter. Live props never block: the tile is floor the moment it breaks, the pre-crack is only a picture.

   Budget: at most 300 live pieces (sprite shards + debris) overall, oldest shed first; 420 particles; 16 rubble decals;
   8 shard atlases; at most 48 GPU smoke volumes a frame (24 lowFx). All pooled: no allocation per frame (a break allocates
   its cut and atlas once; the first break of a kind also reads its sprite once, cached). st.lowFx: ~55% of the pieces and
   smoke, no glints, half the shake — the break still reads. reduceMotion: no shake.
   GPU: glows, sparks, embers, smoke and dust, flame wisps, the shockwave and burning ground go through Nidhogg's painter
   (20b's dungeon pass, X.gq / dqBegin); without it the same in 2D sprites. Pieces are 2D in the world layer. */
const BREAK_FX = (() => {
  const TAU = Math.PI * 2, MAXS = 300, MAXP = 420, MAXD = 16, NATL = 8;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const noMotion = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const R = Math.random;
  const rr = (a, b) => a + (b - a) * R();
  let C = null, clock = 0, lastSnd = -1, gpuMemo = 0, gpuMemoT = -1;

  /* ---------------- materials ---------------- */
  // cols: [mid, dark, light]; dust: smoke colour; style: debris shape; spd: burst speed; bounce; spark: spark colour (n per size)
  const MAT = {
    stone:     { cols: ['#8C8279', '#5A524C', '#BDB2A6'], dust: '#A99C8C', style: 'chunk', spd: 2.4, bounce: 0.3, spin: 7, edge: 'rgba(30,22,28,.75)', ring: '#D8CCBC', snd: 'stone', rubble: 'rubble', smoke: 1 },
    basalt:    { cols: ['#3A3234', '#1A1416', '#5E5456'], dust: '#4A4040', style: 'chunk', spd: 2.3, bounce: 0.26, spin: 6, edge: '#FF6A1F', hot: '#FF6A1F', embers: 1, ring: '#FF9A4A', snd: 'stone', rubble: 'scorch', smoke: 1.2 },
    crystal:   { cols: ['#B9A6F0', '#6A54B8', '#FFFFFF'], dust: '#D8CCFF', style: 'sharp', spd: 4.0, bounce: 0.45, spin: 13, edge: 'rgba(255,255,255,.85)', flash: '#FFFFFF', glint: 1, ring: '#E6DCFF', snd: 'glass', rubble: 'glitter', smoke: 0.35 },
    blackfire: { cols: ['#2A1C38', '#0E0914', '#6A44A0'], dust: '#3A2A4A', style: 'sharp', spd: 3.6, bounce: 0.42, spin: 12, edge: '#FF5A2A', hot: '#FF5A2A', flash: '#B892FF', glint: 1, wisps: '#8A4CFF', ring: '#A070FF', snd: 'glass', low: 1, rubble: 'scorch', smoke: 0.7 },
    glass:     { cols: ['#2A2236', '#0A080C', '#5A4C70'], dust: '#3A3040', style: 'sharp', spd: 3.4, bounce: 0.4, spin: 12, edge: 'rgba(255,190,140,.8)', flash: '#FFE2C8', glint: 1, ring: '#FFB070', snd: 'glass', rubble: 'glitter', smoke: 0.5 },
    ice:       { cols: ['#CFEFFF', '#86BCE8', '#FFFFFF'], dust: '#E4F6FF', style: 'sharp', spd: 3.4, bounce: 0.4, spin: 11, edge: 'rgba(255,255,255,.9)', flash: '#E8FAFF', glint: 1, mist: '#DDF3FF', ring: '#CFEFFF', snd: 'ice', rubble: 'frost', smoke: 0.6 },
    wood:      { cols: ['#A0703F', '#5E3B1E', '#D2A26A'], dust: '#B39A7C', style: 'splinter', spd: 3.0, bounce: 0.35, spin: 12, edge: 'rgba(50,28,12,.8)', ring: '#D8C2A0', snd: 'wood', rubble: 'splinters', smoke: 0.8 },
    foliage:   { cols: ['#6CC15A', '#3E8A44', '#A8DA84'], dust: '#B8D8A0', style: 'leaf', spd: 2.6, bounce: 0.2, spin: 9, edge: 'rgba(30,60,30,.7)', leaves: 1, ring: '#CFE8B8', snd: 'wood', rubble: 'leaf', smoke: 0.5 },
    pottery:   { cols: ['#C9825B', '#8A4C34', '#ECB48C'], dust: '#CDB094', style: 'sherd', spd: 3.0, bounce: 0.38, spin: 12, edge: 'rgba(70,30,20,.8)', ring: '#E8D2BC', snd: 'pot', rubble: 'sherds', smoke: 0.7 },
    iron:      { cols: ['#5E5C64', '#2C2A31', '#A29FA8'], dust: '#6C6670', style: 'plate', spd: 2.8, bounce: 0.32, spin: 9, edge: 'rgba(255,200,120,.65)', spark: '#FFD27A', ring: '#FFC88A', snd: 'iron', rubble: 'rubble', smoke: 0.8 },
    lava:      { cols: ['#3A3234', '#1A1416', '#5E5456'], dust: '#4A3C3A', style: 'chunk', spd: 2.4, bounce: 0.25, spin: 6, edge: '#FF6A1F', hot: '#FF6A1F', embers: 1, lava: 1, ring: '#FF8A3D', snd: 'stone', rubble: 'scorch', smoke: 1.3 },
    bone:      { cols: ['#E6DECB', '#A99E86', '#FFFFFF'], dust: '#D8D0BE', style: 'chunk', spd: 2.8, bounce: 0.35, spin: 10, edge: 'rgba(60,50,40,.75)', ring: '#EDE6D6', snd: 'wood', rubble: 'rubble', smoke: 0.6 },
    coral:     { cols: ['#E9D8D0', '#B0A098', '#FFFFFF'], dust: '#E8E0DA', style: 'chunk', spd: 2.8, bounce: 0.35, spin: 9, edge: 'rgba(60,50,60,.6)', ring: '#F2EAE6', snd: 'pot', rubble: 'rubble', smoke: 0.6 },
    cloud:     { cols: ['#FFFFFF', '#DDE6F2', '#FFFFFF'], dust: '#FFFFFF', style: 'chunk', spd: 1.8, bounce: 0.2, spin: 4, edge: 'rgba(160,180,210,.5)', ring: '#FFFFFF', snd: 'pot', rubble: false, smoke: 1.6, poof: 1 }
  };
  // explicit kinds (Rift 0 first; size in tiles only where the sprite's box misleads)
  const KIND = {
    blackcrystal: { mat: 'blackfire' }, bigcrystal: { mat: 'blackfire' }, basaltcol: { mat: 'basalt' }, frostwell: { mat: 'ice', mix: 'stone' },
    lavafall: { mat: 'lava', lava: true }, glassspire: { mat: 'glass', hot: '#FF7A3A' }, ashmound: { mat: 'basalt', ash: true }, forge: { mat: 'iron', lava: true, hot: '#FF6A1F' },
    vessel: { mat: 'iron', steam: true }, chains: { mat: 'iron' }, metalring: { mat: 'iron' }, anvil: { mat: 'iron' }, slabhang: { mat: 'glass', hot: '#FF5A2A' },
    frostcluster: { mat: 'ice' }, icechains: { mat: 'ice', mix: 'iron' }, rimevessel: { mat: 'iron', mix: 'ice', steam: true }, icefall: { mat: 'ice', lava: true, mix: 'basalt' },
    crystalforest: { mat: 'crystal', hot: '#FF7A3A' }, geode: { mat: 'crystal', mix: 'basalt' }, magmaglass: { mat: 'glass', lava: true },
    // furnace idols (worker S, Ember Court) and the Ifrit / Flan arena pieces may pass these names
    furnaceidol: { mat: 'basalt', hot: '#FF6A1F' }, idol: { mat: 'basalt', hot: '#FF6A1F' },
    // the rest of the game where the name alone would guess wrong
    pot: { mat: 'pottery' }, urn: { mat: 'pottery' }, silverurn: { mat: 'pottery' }, crate: { mat: 'wood' }, chest: { mat: 'wood' }, xbarrel: { mat: 'wood' }, barrel: { mat: 'wood' },
    crystal: { mat: 'crystal' }, pinkcrystal: { mat: 'crystal' }, obsidian: { mat: 'glass' }, volcrock: { mat: 'basalt', hot: '#FF6A1F' }, brazier: { mat: 'iron', hot: '#FF9F43' },
    candles: { mat: 'pottery' }, lamp: { mat: 'iron' }, lantern: { mat: 'glass', hot: '#FFD27A' }, mirror: { mat: 'glass' }, statue: { mat: 'stone' }, snowman: { mat: 'ice' },
    igloo: { mat: 'ice' }, frozentree: { mat: 'ice' }, icetree: { mat: 'ice' }, cloudbush: { mat: 'cloud' }, cloudbank: { mat: 'cloud' }, server: { mat: 'iron' }, console: { mat: 'iron' },
    hourglass: { mat: 'glass' }, orrery: { mat: 'iron' }, telescope: { mat: 'iron' }, harp: { mat: 'wood' }, bookcase: { mat: 'wood' }, bookstack: { mat: 'wood' }, libladder: { mat: 'wood' }, lectern: { mat: 'wood' },
    driftwood: { mat: 'wood' }, ashtree: { mat: 'wood' }, eggtree: { mat: 'foliage' }, weepwillow: { mat: 'foliage' }, thornpine: { mat: 'foliage' }, bulbtree: { mat: 'foliage' },
    voidpearl: { mat: 'crystal' }, moonstone: { mat: 'crystal' }, geodecleft: { mat: 'crystal' }, meteorshard: { mat: 'glass' }, veilshard: { mat: 'glass' }, eyespire: { mat: 'glass' },
    hullshard: { mat: 'iron' }, pearlcoral: { mat: 'coral' }, shellspire: { mat: 'coral' }, jali: { mat: 'stone' }, marblebench: { mat: 'stone' }, fungusstalk: { mat: 'foliage' }, wreckrib: { mat: 'iron' },
    biotube: { mat: 'glass' }, xenospire: { mat: 'glass' }, vertebra: { mat: 'bone' }, bonehorn: { mat: 'bone' }, greathorn: { mat: 'bone' }, hornpillar: { mat: 'bone' }, skullpile: { mat: 'bone' }, bones: { mat: 'bone' }
  };
  const RX = [
    [/lava|magma/, 'lava'], [/blackfire/, 'blackfire'],
    [/crystal|prism|glass|gem|geode|quartz|pearl|mirror|jali|shard|spire/, 'crystal'],
    [/ice|frost|snow|rime|igloo|glacier/, 'ice'],
    [/flower|tulip|lily|shroom|caps|bloom|fern|bush|shrub|reed|kelp|plant|bulb|lotus|cypress|mangrove|cactus|pine|palm|oak|willow|tree|fungus/, 'foliage'],
    [/bone|skull|horn|vertebra|wreckrib/, 'bone'],
    [/coral|urchin|shell/, 'coral'],
    [/cloud/, 'cloud'],
    [/log|stump|wood|crate|barrel|book|shelf|ladder|lectern|bench|harp|bellframe/, 'wood'],
    [/pot\b|urn|vase|jar|censer|inkwell|candle/, 'pottery'],
    [/pipe|gear|server|console|drum|valve|piston|tank|pylon|metal|anvil|chain|ring|iron|bell|gauge|conduit|bellows|tuning|telescope|orrery|neon|lamp|candel|hull|mech|boiler|cable|spike|forge|vessel|post|lantern/, 'iron']
  ];
  const EL_MAT = { frost: 'ice', fire: 'basalt', bubble: 'foliage', leaf: 'foliage', spark: 'iron', gold: 'stone', shadow: 'stone', prism: 'crystal' };
  function matOf(kind, el) {
    const K = KIND[kind]; if (K && K.mat) return K.mat;
    const k = String(kind || '');
    for (let i = 0; i < RX.length; i++) if (RX[i][0].test(k)) return RX[i][1];
    return EL_MAT[el] || 'stone';
  }

  /* ---------------- pools ---------------- */
  const shards = new Array(MAXS), parts = new Array(MAXP), decals = [], ghosts = [];
  for (let i = 0; i < MAXS; i++) shards[i] = { on: false, born: 0, cv: null, atl: null, gen: 0, ax: 0, ay: 0, aw: 0, ah: 0, cx: 0, cy: 0, tpp: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ang: 0, va: 0, ph: 0, vph: 0, life: 0, rest: 0, fade: 0, heat: 0, glint: 0, bounce: 0.3, dec: null, sink: 0, landed: 0, big: 0, hotc: '#FF6A1F', r: 0.1, dust: '#A99C8C' };
  for (let i = 0; i < MAXP; i++) parts[i] = { on: false, k: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, grav: 0, drag: 0, life: 0, max: 1, r: 0, r1: 0, a: 1, col: '#FFFFFF', col2: '#FFFFFF', seed: 0, rot: 0, vr: 0, lit: 0, heat: 0 };
  let nS = 0, nP = 0;
  function takeShard() {
    for (let i = 0; i < MAXS; i++) if (!shards[i].on) { nS++; return shards[i]; }
    let o = shards[0];   // full: shed the oldest
    for (let i = 1; i < MAXS; i++) if (shards[i].born < o.born) o = shards[i];
    kill(o); nS++; return o;
  }
  function takePart() {
    for (let i = 0; i < MAXP; i++) if (!parts[i].on) { nP++; return parts[i]; }
    let o = parts[0];
    for (let i = 1; i < MAXP; i++) if (parts[i].max - parts[i].life > o.max - o.life) o = parts[i];
    return o;
  }
  // particle kinds
  const P_SMOKE = 1, P_SPARK = 2, P_EMBER = 3, P_GLOW = 4, P_RING = 5, P_WISP = 6, P_BLOB = 7, P_LEAF = 8, P_GLINT = 9, P_BURN = 10, P_FIRE = 11, P_STEAM = 12;
  function part(k, x, y, z, vx, vy, vz, life, r, r1, col, a, o) {
    const p = takePart(); p.on = true; p.k = k; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.max = life; p.r = r; p.r1 = r1 == null ? r : r1; p.col = col; p.a = a == null ? 1 : a;
    p.grav = 0; p.drag = 0; p.col2 = col; p.seed = R() * 50; p.rot = R() * TAU; p.vr = 0; p.lit = 0; p.heat = 0.8;
    if (o) { if (o.grav != null) p.grav = o.grav; if (o.drag != null) p.drag = o.drag; if (o.col2) p.col2 = o.col2; if (o.vr != null) p.vr = o.vr; if (o.lit != null) p.lit = o.lit; if (o.heat != null) p.heat = o.heat; }
    return p;
  }

  /* ---------------- atlases (one per break, recycled round-robin; shards of a recycled atlas die with it) ---------------- */
  const atl = [];
  for (let i = 0; i < NATL; i++) atl.push({ cv: null, gen: 0 });
  let atlNext = 0;
  function takeAtlas(w, h) {
    const A = atl[atlNext]; atlNext = (atlNext + 1) % NATL; A.gen++;
    if (!A.cv) A.cv = document.createElement('canvas');
    const W = Math.max(8, Math.ceil(w)), H = Math.max(8, Math.ceil(h));
    if (A.cv.width !== W || A.cv.height !== H) { A.cv.width = W; A.cv.height = H; } else A.cv.getContext('2d').clearRect(0, 0, W, H);
    return A;
  }

  /* ---------------- a sprite read once: a solid copy (soft shadow and haze cut away), its white silhouette, an alpha mask,
     its opaque box and three colours ---------------- */
  const sprInfo = new Map();
  function spriteInfo(sp, key) {
    const k = key || sp; let I = sprInfo.get(k);
    if (I && I.src === sp.cv) { sprInfo.delete(k); sprInfo.set(k, I); return I; }
    const sw = sp.cv.width, sh = sp.cv.height, as = Math.min(1, 900 / Math.max(sw, sh)), W = Math.max(4, Math.round(sw * as)), H = Math.max(4, Math.round(sh * as));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.drawImage(sp.cv, 0, 0, W, H);
    let id; try { id = c.getImageData(0, 0, W, H); } catch (e) { id = null; }
    const CELL = Math.max(2, Math.round(Math.max(W, H) / 160)), mw = Math.ceil(W / CELL), mh = Math.ceil(H / CELL), mask = new Uint8Array(mw * mh);
    let x0 = W, y0 = H, x1 = 0, y1 = 0, nOp = 0; const samp = [];
    if (id) {
      const d = id.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, a = d[i + 3];
        if (a < 118) { d[i + 3] = 0; continue; }
        d[i + 3] = Math.min(255, a * 1.25);
        mask[Math.floor(y / CELL) * mw + Math.floor(x / CELL)]++; nOp++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (((x * 7 + y * 13) % 29) === 0) samp.push([d[i], d[i + 1], d[i + 2], 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]]); }
      c.putImageData(id, 0, 0);
    } else { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; nOp = W * H * 0.5; mask.fill(CELL * CELL); }
    const full = CELL * CELL * 0.35; for (let i = 0; i < mask.length; i++) mask[i] = mask[i] >= full ? 1 : 0;
    const wh = document.createElement('canvas'); wh.width = W; wh.height = H; const g2 = wh.getContext('2d'); g2.drawImage(cv, 0, 0); g2.globalCompositeOperation = 'source-in'; g2.fillStyle = '#FFFFFF'; g2.fillRect(0, 0, W, H);
    let cols = null;
    if (samp.length > 8) { samp.sort((a, b) => a[3] - b[3]); const avg = (u0, u1) => { const i0 = Math.floor(samp.length * u0), i1 = Math.max(i0 + 1, Math.floor(samp.length * u1)); let r = 0, g = 0, b = 0; for (let i = i0; i < i1; i++) { r += samp[i][0]; g += samp[i][1]; b += samp[i][2]; } const n = i1 - i0; return '#' + [r, g, b].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join(''); }; cols = [avg(0.35, 0.65), avg(0.05, 0.3), avg(0.75, 0.97)]; }
    I = { src: sp.cv, cv, wh, as, W, H, ax: sp.ax * as, ay: sp.ay * as, mask, mw, mh, CELL, x0, y0, x1: Math.max(x0 + 1, x1), y1: Math.max(y0 + 1, y1), nOp, cols };
    sprInfo.set(k, I); if (sprInfo.size > 14) sprInfo.delete(sprInfo.keys().next().value);
    return I;
  }

  /* ---------------- debris sprites (material-coloured chunks), 12 variants per palette ---------------- */
  const debCache = new Map(), DS = 40;
  function debrisSheet(style, cols, edge) {
    const key = style + '|' + cols.join(',');
    let s = debCache.get(key); if (s) return s;
    const cv = document.createElement('canvas'); cv.width = DS * 12; cv.height = DS; const c = cv.getContext('2d');
    c.lineJoin = 'round'; c.lineCap = 'round';
    const [mid, dark, light] = cols;
    for (let v = 0; v < 12; v++) {
      c.save(); c.translate(DS * v + DS / 2, DS / 2); c.rotate(v * 0.9);
      const q = []; let n;
      if (style === 'sharp') { const L = DS * rr(0.36, 0.46), w = DS * rr(0.1, 0.2); q.push([-L, rr(-0.2, 0.2) * w], [-L * 0.1, -w], [L, rr(-0.3, 0.3) * w], [L * 0.2, w * rr(0.6, 1.1)]); }
      else if (style === 'splinter') { const L = DS * rr(0.38, 0.47), w = DS * rr(0.05, 0.1); q.push([-L, -w * 0.4], [-L * 0.3, -w], [L, -w * 0.2], [L * 0.85, w * 0.5], [-L * 0.5, w]); }
      else if (style === 'plate') { const a = DS * rr(0.26, 0.38), b = DS * rr(0.18, 0.3); q.push([-a, -b], [a * 0.3, -b * 1.1], [a, -b * 0.5], [a * 0.9, b], [-a * 0.2, b * 0.8], [-a * 1.05, b * 0.3]); }
      else if (style === 'sherd') { const a = DS * rr(0.3, 0.4), b = DS * rr(0.14, 0.22); n = 7; for (let i = 0; i <= n; i++) { const u = i / n, an = -0.9 + 1.8 * u; q.push([Math.sin(an) * a, -Math.cos(an) * a * 0.55 + a * 0.35]); } for (let i = n; i >= 0; i--) { const u = i / n, an = -0.9 + 1.8 * u; q.push([Math.sin(an) * (a - b) * 0.95, -Math.cos(an) * (a - b) * 0.5 + a * 0.35 + b * 0.4]); } }
      else if (style === 'leaf') { const a = DS * rr(0.3, 0.42), b = DS * rr(0.12, 0.18); n = 10; for (let i = 0; i < n; i++) { const an = i / n * TAU; q.push([Math.cos(an) * a, Math.sin(an) * b * (Math.cos(an) > 0 ? 0.8 : 1.1)]); } }
      else { n = 5 + (v % 3); const rad = DS * rr(0.28, 0.42); for (let i = 0; i < n; i++) { const an = i / n * TAU + rr(-0.25, 0.25); q.push([Math.cos(an) * rad * rr(0.7, 1.05), Math.sin(an) * rad * rr(0.62, 0.95)]); } }
      c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      const gr = c.createLinearGradient(-DS * 0.35, -DS * 0.35, DS * 0.35, DS * 0.35); gr.addColorStop(0, light); gr.addColorStop(0.45, mid); gr.addColorStop(1, dark);
      c.fillStyle = gr; c.fill();
      c.save(); c.clip();
      if (style === 'chunk' || style === 'plate') { c.fillStyle = dark; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(DS, -DS * 0.1); c.lineTo(DS * 0.05, DS * 0.08); c.lineTo(-DS * 0.3, DS); c.lineTo(DS, DS); c.fill(); c.globalAlpha = 1; }
      if (style === 'splinter') { c.strokeStyle = dark; c.globalAlpha = 0.6; c.lineWidth = 1; c.beginPath(); c.moveTo(-DS * 0.45, 0); c.lineTo(DS * 0.45, -DS * 0.02); c.stroke(); c.globalAlpha = 1; }
      if (style === 'sharp') { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[2][0], q[2][1]); c.stroke(); }
      if (style === 'plate') { c.fillStyle = light; c.beginPath(); c.arc(-DS * 0.12, -DS * 0.06, DS * 0.035, 0, TAU); c.fill(); }
      if (style === 'leaf') { c.strokeStyle = dark; c.lineWidth = 1; c.beginPath(); c.moveTo(-DS * 0.4, 0); c.lineTo(DS * 0.4, 0); c.stroke(); }
      if (style === 'sherd') { c.strokeStyle = light; c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 7; i++) { const p = q[i]; i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
      c.restore();
      c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      c.strokeStyle = 'rgba(30,22,30,.85)'; c.lineWidth = 1.6; c.stroke();
      c.restore();
    }
    s = { cv, gen: 1 };
    debCache.set(key, s); if (debCache.size > 40) debCache.delete(debCache.keys().next().value);
    return s;
  }

  /* ---------------- geometry for the cut ---------------- */
  function clipHalf(poly, nx, ny, d) {
    const out = [], n = poly.length;
    for (let i = 0; i < n; i++) { const p = poly[i], q = poly[(i + 1) % n], dp = nx * p[0] + ny * p[1] - d, dq = nx * q[0] + ny * q[1] - d;
      if (dp <= 0) out.push(p);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const u = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]); } }
    return out;
  }
  function inPoly(poly, x, y) { let s = 0; const n = poly.length; for (let i = 0; i < n; i++) { const p = poly[i], q = poly[(i + 1) % n], cr = (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]); if (cr !== 0) { const sg = cr > 0 ? 1 : -1; if (s === 0) s = sg; else if (sg !== s) return false; } } return true; }

  /* ---------------- the effect ---------------- */
  function ctxOf(X) { if (C && C.alive()) return C; if (X && X.sx && X.sy && X.Tz) return X; return C; }
  function gpuOn() {
    if (gpuMemoT === clock) return gpuMemo;
    gpuMemoT = clock; gpuMemo = 0;
    try { if (typeof window !== 'undefined' && window.__DUN_GL === 0) return 0; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; gpuMemo = F && F.usable() ? 1 : 0; } catch (e) { gpuMemo = 0; }
    return gpuMemo;
  }
  const PT = X => { const ts = X.TS ? X.TS() : 40, sk = X.SK ? X.SK() : 1; return ts * sk; };   // sprite px per tile
  function spriteFor(X, o) {
    if (o.sprite && o.sprite.cv) return o.sprite;
    const DW = typeof DunWorld !== 'undefined' ? DunWorld : null;
    if (o.kind && DW && !o.paint && DW.PROPS && DW.PROPS[o.kind]) try { return DW.propSprite(o.kind, X.TS ? X.TS() : 40, X.SK ? X.SK() : 1, o.v | 0, o.biome || 'halls'); } catch (e) {}
    // a painter, or a rough boulder in the material's colours
    const P = PT(X), w = (o.w || (o.paint ? 2 : Math.max(0.6, (o.size || 1) * 0.9))), h = (o.h || (o.paint ? 3 : Math.max(0.5, (o.size || 1) * 0.8)));
    const key = 'paint|' + (o.key || (o.paint ? 'fn' : (o.mat || 'stone') + '|' + w.toFixed(1) + '|' + h.toFixed(1))) + '|' + P;
    const keep = !o.paint || !!o.key; let s = keep ? paintCache.get(key) : null; if (s) return s;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(P * (w + 1)); cv.height = Math.ceil(P * (h + 0.6)); const c = cv.getContext('2d');
    c.translate(cv.width / 2, cv.height - P * 0.3);
    if (o.paint) { try { o.paint(c, P); } catch (e) {} }
    else { const M = MAT[o.mat] || MAT.stone, cols = o.cols || M.cols, n = 9; c.beginPath(); for (let i = 0; i < n; i++) { const an = Math.PI + i / (n - 1) * Math.PI, rx = w * P * 0.5 * (0.85 + 0.15 * Math.sin(i * 2.3)), ry = h * P * (0.85 + 0.15 * Math.cos(i * 1.7)); const x = Math.cos(an) * rx, y = Math.sin(an) * ry; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); const g = c.createLinearGradient(-w * P * 0.4, -h * P, w * P * 0.4, 0); g.addColorStop(0, cols[2]); g.addColorStop(0.5, cols[0]); g.addColorStop(1, cols[1]); c.fillStyle = g; c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1.3, P * 0.05); c.stroke(); }
    s = { cv, ax: cv.width / 2, ay: cv.height - P * 0.3 };
    if (keep) paintCache.set(key, s); if (paintCache.size > 24) paintCache.delete(paintCache.keys().next().value);
    return s;
  }
  const paintCache = new Map();

  function burst(Xa, x, y, o) {
    o = o || {};
    const X = ctxOf(Xa); if (!X || !isFinite(x) || !isFinite(y)) return false;
    try { return burst0(X, x, y, o); } catch (e) { try { console.warn('BREAK_FX', e); } catch (e2) {} return false; }
  }
  function burst0(X, x, y, o) {
    const K = o.kind ? KIND[o.kind] || null : null;
    const mat = o.mat || (K && K.mat) || (o.kind ? matOf(o.kind, o.el) : 'stone'), M = MAT[mat] || MAT.stone;
    const sp = spriteFor(X, Object.assign({}, o, { mat })), P = PT(X);
    const I = spriteInfo(sp, o.sprite ? null : o.paint ? (o.key ? 'p|' + o.key + '|' + P : null) : o.kind ? 'k|' + o.kind + '|' + (o.v | 0) + '|' + (o.biome || '') + '|' + P : null);
    const tpw = 1 / (P * I.as);   // tiles per work px
    const ow = (I.x1 - I.x0) * tpw, oh = (I.ay - I.y0) * tpw;   // opaque box in tiles (height above the feet)
    const size = o.size || Math.max(0.45, Math.sqrt(Math.max(0.2, ow) * Math.max(0.2, oh)));
    const big = clamp((size - 0.6) / 3.2, 0, 1), low = lowFx(), quiet = !!o.quiet;
    const cols = o.cols || (I.cols && mat !== 'cloud' ? blend3(I.cols, M.cols) : M.cols);
    const hot = o.hot || (K && K.hot) || M.hot || null, lava = !!(o.lava || (K && K.lava) || M.lava), steam = !!(o.steam || (K && K.steam)), mix = o.mix || (K && K.mix) || null;
    const from = o.from || (X.me ? { x: X.me.x, y: X.me.y } : null);
    let dirx = 0, diry = 0; if (from) { const dx = x - from.x, dy = y - from.y, L = Math.hypot(dx, dy) || 1; dirx = dx / L; diry = dy / L; }
    const pre = o.delay != null ? o.delay : quiet ? 0.04 : 0.07 + 0.3 * big;
    // the cut: Voronoi cells over the opaque silhouette, finer near the hit
    const area = I.nOp * tpw * tpw;
    let N = Math.round(clamp(5 + area * 2.6, 6, 34) * (low ? 0.55 : 1) * (quiet ? 0.6 : 1)); N = Math.max(4, N);
    const bw = I.x1 - I.x0, bh = I.y1 - I.y0, ix = I.x0 + bw * (0.5 - dirx * 0.22), iy = I.y0 + bh * 0.42;
    const seeds = []; let guard = 0;
    while (seeds.length < N && guard++ < N * 60) {
      let sx, sy; if (seeds.length < N * 0.4) { sx = ix + gauss() * bw * 0.22; sy = iy + gauss() * bh * 0.2; } else { sx = I.x0 + R() * bw; sy = I.y0 + R() * bh; }
      const mx = Math.floor(sx / I.CELL), my = Math.floor(sy / I.CELL); if (mx < 0 || my < 0 || mx >= I.mw || my >= I.mh || !I.mask[my * I.mw + mx]) continue;
      seeds.push([sx, sy]);
    }
    const TH = Math.max(1.5, Math.round(P * I.as * 0.045));   // the pieces' thickness: a dark side under each, in atlas px
    const box = [[I.x0 - 2, I.y0 - 2], [I.x1 + 2, I.y0 - 2], [I.x1 + 2, I.y1 + 2], [I.x0 - 2, I.y1 + 2]], cells = [];
    for (let i = 0; i < seeds.length; i++) { let poly = box; const a = seeds[i];
      for (let j = 0; j < seeds.length && poly.length > 2; j++) { if (j === i) continue; const b = seeds[j], nx = b[0] - a[0], ny = b[1] - a[1], d = (b[0] * b[0] + b[1] * b[1] - a[0] * a[0] - a[1] * a[1]) / 2; poly = clipHalf(poly, nx, ny, d); }
      if (poly.length < 3) continue;
      let px0 = 1e9, py0 = 1e9, px1 = -1e9, py1 = -1e9; for (const p of poly) { if (p[0] < px0) px0 = p[0]; if (p[0] > px1) px1 = p[0]; if (p[1] < py0) py0 = p[1]; if (p[1] > py1) py1 = p[1]; }
      // coverage from the mask
      let cov = 0, cx = 0, cy = 0; const c0 = Math.max(0, Math.floor(px0 / I.CELL)), c1 = Math.min(I.mw - 1, Math.floor(px1 / I.CELL)), r0 = Math.max(0, Math.floor(py0 / I.CELL)), r1 = Math.min(I.mh - 1, Math.floor(py1 / I.CELL));
      for (let my = r0; my <= r1; my++) for (let mx = c0; mx <= c1; mx++) if (I.mask[my * I.mw + mx]) { const qx = (mx + 0.5) * I.CELL, qy = (my + 0.5) * I.CELL; if (inPoly(poly, qx, qy)) { cov++; cx += qx; cy += qy; } }
      if (cov < 2) continue;
      cells.push({ poly, x0: Math.floor(px0), y0: Math.floor(py0), w: Math.ceil(px1 - px0) + 1, h: Math.ceil(py1 - py0) + 1 + TH, cx: cx / cov, cy: cy / cov, cov });
    }
    // pack the pieces into an atlas (shelves), each clipped from the solid copy with its broken edge drawn in
    cells.sort((a, b) => b.h - a.h);
    let tot = 0; for (const c2 of cells) tot += (c2.w + 6) * (c2.h + 6);
    const AW = Math.min(2048, Math.max(64, Math.ceil(Math.sqrt(tot * 1.3)), cells.length ? cells[0].w + 8 : 64));
    let px = 2, py = 2, rowH = 0; for (const c2 of cells) { if (px + c2.w + 4 > AW) { px = 2; py += rowH + 4; rowH = 0; } c2.ax = px; c2.ay = py; px += c2.w + 4; if (c2.h > rowH) rowH = c2.h; }
    const AH = Math.min(2048, py + rowH + 4), A = takeAtlas(AW, AH), ac = A.cv.getContext('2d');
    // shards of the atlas being recycled die with it
    for (let i = 0; i < MAXS; i++) { const s = shards[i]; if (s.on && s.atl === A && s.gen !== A.gen) kill(s); }
    const elw = Math.max(1.2, P * I.as * 0.022);
    for (const c2 of cells) { if (c2.ay + c2.h > AH) { c2.skip = 1; continue; }
      ac.save(); ac.translate(c2.ax - c2.x0, c2.ay - c2.y0);
      // its broken side: the same cut, a little lower, darkened
      ac.save(); ac.translate(0, TH); ac.beginPath(); c2.poly.forEach((p, i) => i ? ac.lineTo(p[0], p[1]) : ac.moveTo(p[0], p[1])); ac.closePath(); ac.clip(); ac.drawImage(I.cv, c2.x0 - 1, c2.y0 - 1, c2.w + 2, c2.h + 2 - TH, c2.x0 - 1, c2.y0 - 1, c2.w + 2, c2.h + 2 - TH); ac.globalCompositeOperation = 'source-atop'; ac.fillStyle = hot ? 'rgba(70,18,6,.88)' : 'rgba(14,10,16,.82)'; ac.fillRect(c2.x0 - 2, c2.y0 - 2, c2.w + 4, c2.h + 4); ac.restore();
      ac.beginPath(); c2.poly.forEach((p, i) => i ? ac.lineTo(p[0], p[1]) : ac.moveTo(p[0], p[1])); ac.closePath(); ac.save(); ac.clip();
      ac.drawImage(I.cv, c2.x0 - 1, c2.y0 - 1, c2.w + 2, c2.h + 2, c2.x0 - 1, c2.y0 - 1, c2.w + 2, c2.h + 2);
      ac.globalCompositeOperation = 'source-atop';
      const gr = ac.createLinearGradient(c2.x0, c2.y0, c2.x0 + c2.w, c2.y0 + c2.h); gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.22)'); ac.fillStyle = gr; ac.fillRect(c2.x0, c2.y0, c2.w, c2.h);
      ac.strokeStyle = M.edge; ac.lineWidth = elw * (hot ? 1.5 : 1.2); ac.stroke();
      if (hot) { ac.strokeStyle = 'rgba(255,220,150,.75)'; ac.lineWidth = elw * 0.5; ac.stroke(); }
      ac.restore(); ac.restore();
    }
    // the pre-crack: the object stays, shaking and flashing, while its cracks (the cells' borders) run out from the hit
    const segs = [], dmax = Math.hypot(bw, bh) * 0.75;
    for (const c2 of cells) { const q = c2.poly; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, gx = Math.floor(mx / I.CELL), gy = Math.floor(my / I.CELL); if (gx < 0 || gy < 0 || gx >= I.mw || gy >= I.mh || !I.mask[gy * I.mw + gx]) continue; if (b[0] < a[0] || (b[0] === a[0] && b[1] < a[1])) continue;   /* (each shared border once) */ segs.push(a[0], a[1], b[0], b[1], Math.hypot(mx - ix, my - iy) / dmax); } }
    const G = { on: true, sp, I, x, y, t: 0, dur: pre, segs: new Float32Array(segs), hot: hot || M.flash || M.edge, crackC: crackColour(mat, hot), big, mat, M, cells, A, gen: A.gen, tpw, size, cols, lava, steam, mix, dirx, diry, quiet, low, o, from };
    ghosts.push(G);
    if (pre <= 0.001) shatter(X, G);
    else if (!quiet && o.sound !== false) sound(X, 'crack', M, big);
    if (!quiet && big > 0.3 && X.shake && !noMotion()) X.shake((1 + 2 * big) * (low ? 0.5 : 1), pre);   // a tremor while it gives
    return true;
  }
  const gauss = () => (R() + R() + R() - 1.5) * 0.9;
  function crackColour(mat, hot) { return mat === 'ice' ? '#3E78B8' : mat === 'crystal' ? '#FFFFFF' : mat === 'wood' || mat === 'foliage' ? '#2A1A10' : mat === 'pottery' ? '#3A1E14' : hot || (mat === 'iron' ? '#FFD27A' : '#F2E6D6'); }
  function blend3(a, b) { return [mix2(a[0], b[0], 0.3), mix2(a[1], b[1], 0.3), mix2(a[2], b[2], 0.3)]; }
  function mix2(h1, h2, u) { const A = hexRGB(h1), B = hexRGB(h2); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * u).toString(16).padStart(2, '0')).join(''); }

  /* the moment it goes */
  function shatter(X, G) {
    G.on = false;
    const { I, x, y, M, big, size, cells, A, tpw, low, quiet, dirx, diry, mat } = G, k = low ? 0.55 : 1, T = X.Tz();
    const spd = M.spd * (0.7 + 0.45 * Math.sqrt(size)), hz = (I.ay - I.y0) * tpw * 0.5, cxs = ((I.x0 + I.x1) / 2 - I.ax) * tpw;
    const flying = !quiet || nS < MAXS * 0.7;
    // a decal that will catch the rubble
    const rub = G.o.rubble != null ? G.o.rubble : M.rubble;
    const dec = rub && !quiet || (rub && quiet && size > 1.2) ? decal(X, x, y, 0.55 + size * 0.42, G, rub === true ? M.rubble || 'rubble' : rub) : null;
    // the silhouette's pieces (unless its atlas was taken by later breaks during the pre-crack: a vehicle smashing many)
    if (flying && G.gen === A.gen) for (const c2 of cells) { if (c2.skip) continue;
      const s = takeShard(); s.on = true; s.born = clock; s.cv = A.cv; s.atl = A; s.gen = A.gen;
      s.ax = c2.ax; s.ay = c2.ay; s.aw = c2.w; s.ah = c2.h; s.cx = c2.cx - c2.x0; s.cy = c2.cy - c2.y0; s.tpp = tpw;
      const lx = (c2.cx - I.ax) * tpw, lz = (I.ay - c2.cy) * tpw;   // relative to the feet, z up
      s.x = x + lx; s.y = y + rr(-0.06, 0.06); s.z = Math.max(0, lz);
      const ux = lx - cxs, uz = lz - hz, L = Math.hypot(ux, uz) || 1, v = spd * rr(0.45, 1.05) * (0.6 + 0.6 * Math.min(1, L / Math.max(0.4, hz)));
      s.vx = ux / L * v * 0.9 + dirx * spd * rr(0.2, 0.6); s.vy = rr(-0.5, 0.5) * spd * 0.7 + diry * spd * rr(0.15, 0.5) + 0.25 * spd * (R() - 0.3);
      s.vz = Math.max(-1, uz / L * v * 0.7) + rr(0.6, 2.2) * (1 - 0.5 * big) + (lz < 0.35 ? rr(0.3, 1.2) : 0) + (M.style === 'sharp' ? rr(0.8, 2.2) : 0);
      if (big > 0.3) { const lev = clamp(lz / Math.max(0.5, hz * 2), 0, 1); s.vx = s.vx * (1 - 0.3 * lev) + (dirx || (R() < 0.5 ? -1 : 1) * 0.6) * lev * (1.2 + 2.2 * big) * rr(0.6, 1.2); s.vy += (diry * 0.6 + 0.5) * lev * (0.8 + 1.4 * big) * rr(0.5, 1.2); s.vz *= 1 - 0.45 * lev; }   // a tall thing's upper part topples away from the hit and lands further out
      const pr = Math.sqrt(c2.cov) * I.CELL * tpw; s.r = pr;
      s.va = rr(-1, 1) * M.spin / Math.max(0.6, Math.sqrt(pr * 6)); s.ang = 0; s.ph = 0; s.vph = rr(-1, 1) * M.spin * 0.5 / Math.max(0.6, Math.sqrt(pr * 6));
      s.life = 0; s.rest = rr(2.2, 3.6) + big * 1.5; s.fade = 0; s.heat = G.lava || M.hot || G.o.hot ? rr(0.6, 1) : 0; s.hotc = G.o.hot || M.hot || '#FF6A1F';
      s.glint = M.glint && !low ? 1 : 0; s.bounce = M.bounce; s.dec = dec; s.sink = 0; s.landed = 0; s.big = pr > 0.35 ? 1 : 0; s.dust = M.dust;
    }
    // debris: the material's own chunks (and a second material's, a frost well's stone)
    const nd = Math.round((quiet ? 4 : 8 + 26 * big) * k);
    debris(X, G, x, y, nd, MAT[mat] || MAT.stone, G.cols, spd, hz, dec);
    if (G.mix && MAT[G.mix]) debris(X, G, x, y, Math.round(nd * 0.6), MAT[G.mix], MAT[G.mix].cols, spd * 0.9, hz, dec);
    // the flash
    const fc = M.flash || G.hot || '#FFF2DC', sz = Math.min(size, 3.2);   // (light and smoke grow with the object up to a point: a huge one must not white out its own pieces)
    part(P_GLOW, x, y, hz, 0, 0, 0, 0.14 + 0.16 * big, 0.7 + sz * 0.5, 0.5 + sz * 0.7, '#FFFFFF', 0.7);
    part(P_GLOW, x, y, hz * 0.8, 0, 0, 0, 0.35 + 0.3 * big, 1 + sz * 0.6, 1.4 + sz * 0.8, fc, 0.45);
    if (G.o.hot || M.hot) part(P_GLOW, x, y, 0.1, 0, 0, 0, 0.9 + big, 0.8 + sz * 0.5, 1 + sz * 0.6, G.o.hot || M.hot, 0.4);
    // the ground shockwave (two for big things)
    part(P_RING, x, y, 0, 0, 0, 0, 0.38 + 0.25 * big, 0.3, 1.0 + sz * 0.75, M.ring, 0.6);
    if (big > 0.3) part(P_RING, x, y, 0, 0, 0, 0, 0.75 + 0.4 * big, 0.2, 1.6 + sz * 1.15, G.lava ? '#FF7A3D' : M.dust, 0.45);
    // dust and smoke: a burst that rolls out along the floor, then billows that rise and spread
    const ash = !!G.o.ash, ns = Math.round((4 + 18 * big) * M.smoke * k * (quiet ? 0.5 : 1) * (ash ? 2.2 : 1)), dustC = ash ? '#8C837E' : M.dust;
    for (let i = 0; i < ns; i++) { const a = R() * TAU, v = rr(1.2, 3.2) * (0.7 + size * 0.35), ground = i % 3 !== 0;
      part(P_SMOKE, x + Math.cos(a) * size * 0.25, y + Math.sin(a) * size * 0.12, ground ? rr(0.05, 0.3) : rr(0.2, hz * 1.6 + 0.3), Math.cos(a) * v, Math.sin(a) * v * 0.55, ground ? rr(0.1, 0.5) : rr(0.4, 1.2), rr(1.0, 1.8) + big * 1.6, rr(0.18, 0.32) * (0.6 + sz * 0.35), rr(0.5, 0.95) * (0.7 + sz * 0.5) * (ash ? 1.3 : 1), dustC, rr(0.45, 0.75), { drag: 2.2, lit: G.o.hot || M.hot ? 0.4 : 0 }); }
    if (big > 0.35) for (let i = 0; i < Math.round(6 * big * k); i++) part(P_SMOKE, x + rr(-0.5, 0.5) * size * 0.4, y + rr(-0.15, 0.15), rr(0.3, hz * 1.8), rr(-0.4, 0.4), rr(-0.2, 0.2), rr(0.6, 1.4), rr(2.6, 3.8), sz * 0.25, sz * rr(0.55, 0.85), mat === 'basalt' || mat === 'lava' || mat === 'blackfire' ? '#2E2626' : M.dust, rr(0.35, 0.55), { drag: 0.8, lit: G.lava ? 0.6 : 0 });
    // sparks, embers, glints, wisps, mist, leaves, steam, the molten splash
    const spc = M.spark || (M.hot ? '#FFB060' : mat === 'crystal' || mat === 'glass' || mat === 'ice' ? M.cols[2] : null);
    if (spc) { const n = Math.round((6 + 22 * big) * k * (mat === 'iron' ? 1.6 : 1) * (quiet ? 0.5 : 1)); for (let i = 0; i < n; i++) { const a = R() * TAU, v = rr(3, 9) * (0.8 + big * 0.5); part(P_SPARK, x + rr(-0.2, 0.2) * size, y, rr(0.1, hz * 1.5 + 0.2), Math.cos(a) * v, Math.sin(a) * v * 0.5, rr(1, 6), rr(0.3, 0.75), 0.05, 0.05, i % 3 ? spc : '#FFFFFF', 1, { grav: 14, drag: 1.2 }); } }
    if (M.embers || G.o.hot) for (let i = 0; i < Math.round((6 + 24 * big) * k); i++) part(P_EMBER, x + rr(-0.5, 0.5) * size * 0.6, y + rr(-0.2, 0.2), rr(0, hz * 2), rr(-1.2, 1.2), rr(-0.5, 0.5), rr(0.8, 2.8), rr(1.0, 2.6), rr(0.04, 0.08), 0.02, i % 3 ? (G.o.hot || M.hot || '#FF8A3D') : '#FFD27A', 1, { grav: -0.4, drag: 0.6 });
    if (M.glint && !low) for (let i = 0; i < Math.round(4 + 10 * big); i++) part(P_GLINT, x + rr(-0.6, 0.6) * size * 0.6, y + rr(-0.2, 0.2), rr(0.2, hz * 2), rr(-1.5, 1.5), 0, rr(0.5, 2.5), rr(0.4, 0.9), rr(0.12, 0.22) * (0.8 + size * 0.2), 0.02, '#FFFFFF', 1, { grav: 3, drag: 1 });
    if (M.wisps) for (let i = 0; i < Math.round((5 + 12 * big) * k); i++) part(P_WISP, x + rr(-0.6, 0.6) * size * 0.5, y + rr(-0.2, 0.2), rr(0, hz * 1.4), rr(-0.6, 0.6), rr(-0.2, 0.2), rr(1.2, 2.6), rr(0.9, 1.8), rr(0.12, 0.2) * (0.7 + size * 0.3), rr(0.4, 0.7) * (0.7 + size * 0.3), M.wisps, 0.95, { drag: 0.8, vr: rr(-1, 1), heat: 0.75 });
    if (M.mist) for (let i = 0; i < Math.round((5 + 12 * big) * k); i++) { const a = R() * TAU, v = rr(0.6, 2.2); part(P_SMOKE, x + Math.cos(a) * 0.3, y + Math.sin(a) * 0.15, rr(0.05, hz + 0.2), Math.cos(a) * v, Math.sin(a) * v * 0.5, rr(-0.1, 0.3), rr(1.6, 2.8), 0.25 * (0.7 + size * 0.3), rr(0.7, 1.2) * (0.7 + size * 0.4), M.mist, rr(0.4, 0.65), { drag: 1.4, lit: 1 }); }
    if (M.leaves) for (let i = 0; i < Math.round((8 + 14 * big) * k); i++) { const a = R() * TAU, v = rr(1, 3.5); part(P_LEAF, x + rr(-0.4, 0.4) * size, y + rr(-0.1, 0.1), rr(0.3, hz * 2), Math.cos(a) * v, Math.sin(a) * v * 0.5, rr(1, 3), rr(1.6, 2.8), rr(0.07, 0.11), 0, i % 2 ? M.cols[0] : M.cols[2], 1, { grav: 2.2, drag: 1.8, vr: rr(-6, 6), col2: M.cols[1] }); }
    if (G.steam) for (let i = 0; i < Math.round((6 + 10 * big) * k); i++) part(P_STEAM, x + rr(-0.3, 0.3), y + rr(-0.1, 0.1), rr(0.2, hz * 1.4), rr(-1.5, 1.5), rr(-0.4, 0.4), rr(1.5, 4), rr(0.9, 1.6), 0.2, rr(0.6, 1.1) * (0.8 + size * 0.2), '#F4F2EE', 0.6, { drag: 1.6, lit: 1 });
    if (G.lava) {
      for (let i = 0; i < Math.round((8 + 22 * big) * k); i++) { const a = R() * TAU, v = rr(1.5, 5) * (0.8 + big * 0.5); part(P_BLOB, x + rr(-0.3, 0.3) * size * 0.4, y + rr(-0.1, 0.1), rr(0.1, hz * 1.2), Math.cos(a) * v, Math.sin(a) * v * 0.5, rr(2, 6.5), rr(0.9, 1.6), rr(0.05, 0.11) * (0.8 + size * 0.15), 0, '#FFB347', 1, { grav: 16, col2: '#FF5A1E' }); }
      part(P_FIRE, x, y, 0, 0, 0, 0, 0.6 + 0.4 * big, 0.35 + sz * 0.15, 0.6 + sz * 0.3, '#FF6A1F', 0.6, { heat: 0.85 });
      part(P_BURN, x, y + 0.05, 0, 0, 0, 0, 3.5 + 2 * big, 0.7 + sz * 0.35, 0.8 + sz * 0.45, '#FF6A1F', 0.8, { heat: 0.85 });
    }
    // feel: shake, a beat of hitstop, light, sound
    if (!quiet) {
      const shk = (G.o.shake == null ? 1 : G.o.shake) * (low ? 0.5 : 1) * (noMotion() ? 0 : 1);
      if (shk > 0 && X.shake) X.shake((2 + 9 * big * big + 2 * big) * shk, 0.14 + 0.32 * big);
      if (big > 0.55 && X.hitstop) X.hitstop(0.03 + 0.03 * big);
      if (X.light) X.light(x, y, 2 + size * 1.4, 0.35 + 0.3 * big);
    }
    if (G.o.sound !== false) sound(X, 'break', M, big, quiet, mat, G.lava, G.steam);
  }
  function debris(X, G, x, y, n, M, cols, spd, hz, dec) {
    if (n <= 0) return;
    const sh = debrisSheet(M.style, cols, M.edge), big = G.big, tp = 1 / DS;
    for (let i = 0; i < n; i++) {
      const s = takeShard(); s.on = true; s.born = clock; s.cv = sh.cv; s.atl = null; s.gen = 0;
      const v = (i * 7 + Math.floor(R() * 12)) % 12; s.ax = v * DS; s.ay = 0; s.aw = DS; s.ah = DS; s.cx = DS / 2; s.cy = DS / 2;
      const sz = rr(0.12, 0.3) * (0.7 + G.size * 0.22) * (M.style === 'splinter' ? 1.5 : 1) * (M.style === 'plate' ? 1.3 : 1); s.tpp = sz * tp * 1.25; s.r = sz * 0.5;
      const a = R() * TAU, vv = spd * rr(0.5, 1.4);
      s.x = x + rr(-0.35, 0.35) * Math.min(2.5, G.size); s.y = y + rr(-0.12, 0.12); s.z = rr(0, hz * 1.6 + 0.1);
      s.vx = Math.cos(a) * vv + G.dirx * spd * 0.4; s.vy = Math.sin(a) * vv * 0.6 + G.diry * spd * 0.3; s.vz = rr(1.5, 5) * (0.8 + 0.3 * big);
      s.va = rr(-1, 1) * M.spin * 1.4; s.ang = R() * TAU; s.ph = R() * TAU; s.vph = rr(-1, 1) * M.spin;
      s.life = 0; s.rest = rr(1.6, 3.2) + big; s.fade = 0; s.heat = (M.hot || G.lava) && R() < 0.5 ? rr(0.5, 1) : 0; s.hotc = G.o.hot || M.hot || '#FF6A1F';
      s.glint = M.glint && !G.low && R() < 0.5 ? 1 : 0; s.bounce = M.bounce; s.dec = dec; s.sink = 0; s.landed = 0; s.big = 0; s.dust = M.dust;
    }
  }
  function kill(s) { if (s.on) { s.on = false; nS--; s.cv = null; s.atl = null; s.dec = null; } }

  /* ---------------- rubble decals: a scorch / dust stain, pebbles, and the settled pieces baked in ---------------- */
  const decPool = [];
  function decal(X, x, y, Rt, G, kind) {
    const P = Math.min(PT(X) * 0.8, 96), W = Math.ceil(Rt * 2 * P), H = Math.ceil(Rt * 1.4 * P);
    let D = decals.length >= MAXD ? decals.shift() : decPool.pop() || { cv: document.createElement('canvas') };
    for (let i = 0; i < MAXS; i++) if (shards[i].on && shards[i].dec === D) shards[i].dec = null;
    if (D.cv.width !== W || D.cv.height !== H) { D.cv.width = W; D.cv.height = H; } else D.cv.getContext('2d').clearRect(0, 0, W, H);
    Object.assign(D, { x, y, R: Rt, P, W, H, t: 0, kind, glow: G.lava || G.M.hot ? (G.o.hot || G.M.hot || '#FF6A1F') : null, glowT: G.lava ? 7 : G.M.hot ? 3.5 : 0, seed: R() * 50 });
    const c = D.cv.getContext('2d'), cx = W / 2, cy = H / 2, M = G.M;
    c.save(); c.translate(cx, cy); c.scale(1, 0.62);
    const stain = kind === 'scorch' ? (G.mat === 'blackfire' ? '24,10,34' : '16,10,10') : kind === 'frost' ? '230,246,255' : kind === 'glitter' ? '40,30,60' : kind === 'leaf' ? '60,90,40' : '40,32,26';
    const sa = kind === 'scorch' ? 0.55 : kind === 'frost' ? 0.5 : 0.28;
    const gr = c.createRadialGradient(0, 0, 0, 0, 0, Rt * P * 0.95); gr.addColorStop(0, `rgba(${stain},${sa})`); gr.addColorStop(0.55, `rgba(${stain},${sa * 0.6})`); gr.addColorStop(1, `rgba(${stain},0)`);
    c.fillStyle = gr; c.beginPath(); c.arc(0, 0, Rt * P, 0, TAU); c.fill();
    if (kind === 'scorch' && D.glow) { c.strokeStyle = D.glow; c.globalAlpha = 0.5; c.lineWidth = Math.max(1, P * 0.025); for (let i = 0; i < 7; i++) { let a = D.seed + i * 0.9, r0 = Rt * P * 0.12; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); for (let j = 0; j < 4; j++) { r0 += Rt * P * rr(0.12, 0.2); a += rr(-0.35, 0.35); c.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); } c.stroke(); } c.globalAlpha = 1; }
    if (kind === 'frost') { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(1, P * 0.02); for (let i = 0; i < 8; i++) { const a = D.seed + i * TAU / 8, r1 = Rt * P * rr(0.5, 0.85); c.beginPath(); c.moveTo(Math.cos(a) * r1 * 0.2, Math.sin(a) * r1 * 0.2); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.moveTo(Math.cos(a) * r1 * 0.6, Math.sin(a) * r1 * 0.6); c.lineTo(Math.cos(a + 0.25) * r1 * 0.75, Math.sin(a + 0.25) * r1 * 0.75); c.stroke(); } }
    c.restore();
    // pebbles and grit in the debris colours
    const pc = G.cols, nPeb = Math.round(8 + Rt * 10);
    for (let i = 0; i < nPeb; i++) { const a = R() * TAU, d = Math.pow(R(), 0.7) * Rt * 0.8, px = cx + Math.cos(a) * d * P, py = cy + Math.sin(a) * d * P * 0.62, s = P * rr(0.025, 0.07) * (kind === 'glitter' || kind === 'frost' ? 0.8 : 1);
      c.fillStyle = i % 3 === 0 ? pc[2] : i % 3 === 1 ? pc[0] : pc[1]; c.beginPath();
      if (kind === 'glitter' || kind === 'frost') { c.moveTo(px - s, py); c.lineTo(px, py - s * 1.7); c.lineTo(px + s, py); c.lineTo(px, py + s * 0.5); }
      else if (kind === 'splinters') { c.save(); c.translate(px, py); c.rotate(a * 3); c.rect(-s * 2.2, -s * 0.35, s * 4.4, s * 0.7); c.restore(); }
      else c.ellipse(px, py, s, s * 0.72, a, 0, TAU);
      c.fill(); if (kind !== 'leaf') { c.strokeStyle = 'rgba(20,14,20,.55)'; c.lineWidth = Math.max(0.8, P * 0.012); c.stroke(); } }
    decals.push(D);
    return D;
  }
  function bake(s) {
    const D = s.dec; if (!D || decals.indexOf(D) < 0) return false;
    const dx = (s.x - D.x) * D.P + D.W / 2, dy = (s.y - D.y) * D.P + D.H / 2, k = s.tpp * D.P;
    if (dx < 0 || dy < 0 || dx > D.W || dy > D.H) return false;
    const c = D.cv.getContext('2d'), fy = flipY(s);
    c.setTransform(Math.cos(s.ang) * k, Math.sin(s.ang) * k, -Math.sin(s.ang) * k * fy, Math.cos(s.ang) * k * fy, dx, dy);
    c.globalAlpha = 0.95; c.drawImage(s.cv, s.ax, s.ay, s.aw, s.ah, -s.cx, -s.cy, s.aw, s.ah);
    c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0);
    return true;
  }
  const flipY = s => { const f = Math.cos(s.ph); return f < 0 ? Math.min(-0.22, f) : Math.max(0.22, f); };

  /* ---------------- update ---------------- */
  function update(dt) {
    if (!(dt > 0)) return; dt = Math.min(dt, 0.05); clock += dt;
    const X = C; if (!X) return;
    for (let i = ghosts.length - 1; i >= 0; i--) { const G = ghosts[i]; G.t += dt;
      if (G.on && G.big > 0.3 && R() < dt * 30 * G.big && nP < MAXP - 60) { const w = (G.I.x1 - G.I.x0) * G.tpw; part(P_SMOKE, G.x + rr(-0.5, 0.5) * w, G.y + rr(-0.1, 0.15), rr(0, 0.25), rr(-0.6, 0.6), rr(-0.2, 0.3), rr(0.2, 0.6), rr(0.6, 1.1), 0.12 + 0.1 * G.big, 0.3 + 0.35 * G.big, G.M.dust, 0.55, { drag: 2 }); }   // dust shaken loose at its foot
      if (G.on && G.t >= G.dur) shatter(X, G); if (!G.on) ghosts.splice(i, 1); }
    const tile = X.tile, solidT = typeof T_SOLID !== 'undefined' ? T_SOLID : 0, gapT = typeof T_GAP !== 'undefined' ? T_GAP : 2;
    for (let i = 0; i < MAXS; i++) { const s = shards[i]; if (!s.on) continue;
      if (s.atl && s.atl.gen !== s.gen) { kill(s); continue; }
      s.life += dt; if (s.heat > 0) s.heat = Math.max(0, s.heat - dt * 0.35);
      if (s.sink > 0) { s.sink += dt; s.z -= dt * 1.2; if (s.sink > 0.6) kill(s); continue; }
      if (s.landed < 2) {
        s.vz -= 26 * dt; const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
        if (tile && s.z < 1.2) { const t2 = tile(Math.floor(nx), Math.floor(ny)); if (t2 === solidT) { if (tile(Math.floor(nx), Math.floor(s.y)) === solidT) s.vx = -s.vx * 0.4; if (tile(Math.floor(s.x), Math.floor(ny)) === solidT) s.vy = -s.vy * 0.4; } else { s.x = nx; s.y = ny; } }
        else { s.x = nx; s.y = ny; }
        s.z += s.vz * dt; s.ang += s.va * dt; s.ph += s.vph * dt;
        if (s.z <= 0) {
          s.z = 0;
          if (tile && tile(Math.floor(s.x), Math.floor(s.y)) === gapT) { s.sink = 0.001; if (R() < 0.4) part(P_GLOW, s.x, s.y, 0, 0, 0, 0, 0.3, 0.2, 0.4, '#FF8A3D', 0.5); continue; }
          if (s.vz < -2.2) { s.vz = -s.vz * s.bounce; s.vx *= 0.55; s.vy *= 0.55; s.va *= 0.5; s.vph *= 0.4;
            if (s.big && s.landed === 0 && nP < MAXP - 40) part(P_SMOKE, s.x, s.y, 0.05, s.vx * 0.3, s.vy * 0.3, 0.3, 0.9, s.r * 0.6, s.r * 1.6 + 0.2, s.dust, 0.5, { drag: 2.5 });
            s.landed = 1; }
          else { s.vz = 0; s.landed = 2; s.ph = Math.round(s.ph / Math.PI) * Math.PI; }
        }
      } else {
        const f = Math.exp(-7 * dt); s.vx *= f; s.vy *= f; s.va *= f; s.x += s.vx * dt; s.y += s.vy * dt; s.ang += s.va * dt;
        s.rest -= dt;
        if (s.rest <= 0) { if (s.fade === 0 && s.dec && bake(s)) { kill(s); continue; } s.fade += dt; if (s.fade > 0.7) kill(s); }
      }
    }
    for (let i = 0; i < MAXP; i++) { const p = parts[i]; if (!p.on) continue;
      p.life -= dt; if (p.life <= 0) { p.on = false; nP--; continue; }
      if (p.drag) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; if (p.k !== P_SPARK && p.k !== P_BLOB) p.vz *= f; }
      p.vz -= p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt;
      if (p.z < 0) { if (p.k === P_BLOB) { if (nP < MAXP - 4) part(P_BURN, p.x, p.y, 0, 0, 0, 0, rr(1.2, 2.4), p.r * 1.6, p.r * 2.4, '#FF6A1F', 0.8, { heat: 0.7 }); p.on = false; nP--; continue; }
        if (p.k === P_SPARK) { p.z = 0; p.vz = -p.vz * 0.35; p.vx *= 0.6; p.vy *= 0.6; } else if (p.k === P_LEAF || p.k === P_GLINT) { p.z = 0; p.vz = 0; p.vx *= 0.5; p.vy *= 0.5; p.vr *= 0.8; } else p.z = 0; }
      if (p.k === P_LEAF) { p.vx += Math.sin(clock * 5 + p.seed) * 3 * dt; }
    }
    for (let i = 0; i < decals.length; i++) decals[i].t += dt;
  }

  /* ---------------- drawing ---------------- */
  function drawPiece(c, s, B, T, alpha) {
    const X = C.sx(s.x), Y = C.sy(s.y) - s.z * T, k = s.tpp * T, ca = Math.cos(s.ang) * k, sa = Math.sin(s.ang) * k, fy = flipY(s);
    const ma = ca, mb = sa, mc = -sa * fy, md = ca * fy;
    c.setTransform(B.a * ma + B.c * mb, B.b * ma + B.d * mb, B.a * mc + B.c * md, B.b * mc + B.d * md, B.a * X + B.c * Y + B.e, B.b * X + B.d * Y + B.f);
    c.globalAlpha = alpha; c.drawImage(s.cv, s.ax, s.ay, s.aw, s.ah, -s.cx, -s.cy, s.aw, s.ah);
  }
  function drawGround(c) {
    const X = C; if (!X || (!decals.length && !nS)) return;
    const T = X.Tz(), W = X.W ? X.W() : 2000, H = X.H ? X.H() : 2000;
    // decals
    for (let i = 0; i < decals.length; i++) { const D = decals[i], k = T / D.P, w = D.W * k, h = D.H * k, sx = X.sx(D.x) - w / 2, sy = X.sy(D.y) - h / 2; if (sx > W || sy > H || sx + w < 0 || sy + h < 0) continue; c.globalAlpha = Math.min(1, D.t * 6); c.drawImage(D.cv, sx, sy, w, h); }
    c.globalAlpha = 1;
    if (!nS) return;
    // shadows under the flying pieces, one path
    c.fillStyle = 'rgba(10,6,8,.32)'; c.beginPath(); let any = false;
    for (let i = 0; i < MAXS; i++) { const s = shards[i]; if (!s.on || s.landed === 2 || s.sink) continue; const rx = Math.max(1.5, s.r * T * 0.55 / (1 + s.z * 0.35)), X0 = X.sx(s.x), Y0 = X.sy(s.y); c.moveTo(X0 + rx, Y0); c.ellipse(X0, Y0, rx, rx * 0.4, 0, 0, TAU); any = true; }
    if (any) c.fill();
    // the settled pieces lie on the floor, under everything that stands
    const B = c.getTransform();
    for (let i = 0; i < MAXS; i++) { const s = shards[i]; if (!s.on || s.landed !== 2) continue; drawPiece(c, s, B, T, s.fade > 0 ? Math.max(0, 1 - s.fade / 0.7) : 1); }
    c.setTransform(B); c.globalAlpha = 1;
  }
  function drawWorld(c) {
    const X = C; if (!X || (!ghosts.length && !nS && !nP)) return;
    const T = X.Tz(), B = c.getTransform();
    // the pre-crack: the object itself, shaking, flashing white, its cracks running out from the hit
    for (let gi = 0; gi < ghosts.length; gi++) { const G = ghosts[gi]; if (!G.on) continue;
      const u = clamp(G.t / Math.max(0.001, G.dur), 0, 1), sk = X.SK ? X.SK() : 1, k2 = (X.g ? X.g.zoom : 1) / sk, jx = Math.sin(clock * 90 + gi) * T * (0.03 + 0.07 * G.big) * (0.4 + u), jy = Math.cos(clock * 77) * T * 0.02 * G.big * u;
      const sp = G.sp, X0 = X.sx(G.x) - sp.ax * k2 + jx, Y0 = X.sy(G.y) - sp.ay * k2 + jy, sw = sp.cv.width * k2, sh = sp.cv.height * k2;
      c.globalAlpha = 1; c.drawImage(sp.cv, X0, Y0, sw, sh);
      c.globalAlpha = 0.5 * u * u * u + (G.t < 0.05 ? 0.35 * (1 - G.t / 0.05) : 0); if (c.globalAlpha > 0.01) c.drawImage(G.I.wh, X0, Y0, sw, sh);
      // cracks
      const kk = sw / G.I.W; c.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? '#FFFFFF' : G.crackC; c.lineWidth = Math.max(1, T * (pass ? 0.02 : 0.05) * (0.7 + G.big * 0.6)); c.globalAlpha = pass ? 0.35 + 0.6 * u : 0.95; c.beginPath();
        const sg = G.segs, rev = 0.18 + u * 1.1;
        for (let j = 0; j < sg.length; j += 5) { const d = sg[j + 4]; if (d > rev) continue; const f = clamp((rev - d) * 5, 0, 1); const ax = X0 + sg[j] * kk, ay = Y0 + sg[j + 1] * kk, bx = X0 + sg[j + 2] * kk, by = Y0 + sg[j + 3] * kk; c.moveTo(ax, ay); c.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f); }
        c.stroke(); }
      c.globalAlpha = 1;
    }
    // the flying pieces
    if (nS) { for (let i = 0; i < MAXS; i++) { const s = shards[i]; if (!s.on || s.landed === 2) continue; drawPiece(c, s, B, T, s.sink ? Math.max(0, 1 - s.sink / 0.6) : 1); } c.setTransform(B); c.globalAlpha = 1; }
    if (!nP) return;
    // molten blobs and leaves: solid
    for (let i = 0; i < MAXP; i++) { const p = parts[i]; if (!p.on || (p.k !== P_BLOB && p.k !== P_LEAF)) continue;
      const X0 = X.sx(p.x), Y0 = X.sy(p.y) - p.z * T, r = Math.max(1.2, p.r * T);
      if (p.k === P_BLOB) { const sp = Math.min(3, Math.hypot(p.vx, p.vz) * 0.12); c.fillStyle = p.col2; c.beginPath(); c.ellipse(X0, Y0, r, r * (1 + sp * 0.5), Math.atan2(-p.vz, p.vx) + Math.PI / 2, 0, TAU); c.fill(); c.fillStyle = p.col; c.beginPath(); c.arc(X0 - r * 0.2, Y0 - r * 0.25, r * 0.55, 0, TAU); c.fill(); }
      else { c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.col; c.beginPath(); c.ellipse(X0, Y0, r, r * 0.45 * Math.abs(Math.cos(p.rot * 0.7)) + 0.5, p.rot, 0, TAU); c.fill(); c.globalAlpha = 1; }
    }
    // smoke and dust in 2D when there is no GPU pass
    if (!gpuOn()) for (let i = 0; i < MAXP; i++) { const p = parts[i]; if (!p.on || (p.k !== P_SMOKE && p.k !== P_STEAM)) continue;
      const u = 1 - p.life / p.max, r = (p.r + (p.r1 - p.r) * (1 - (1 - u) * (1 - u))) * T, a = p.a * Math.min(1, u * 6) * (1 - u) * 0.85;
      if (a < 0.01) continue; c.globalAlpha = a; blitSized(c, shadeSprite(p.col), X.sx(p.x) - r, X.sy(p.y) - p.z * T - r * 0.85, r * 2, r * 1.7); }
    c.globalAlpha = 1;
  }
  /* the light: on the GPU pass (Q, 20b's DQ) when there is one, else additive 2D (20b calls this inside its 'lighter' block) */
  function drawFx(c, Q) {
    const X = C; if (!X || (!nP && !ghosts.length && !nS)) return;
    const T = X.Tz(), K = 1;
    // glowing cracks of a pre-crack
    for (let gi = 0; gi < ghosts.length; gi++) { const G = ghosts[gi]; if (!G.on) continue;
      const u = clamp(G.t / Math.max(0.001, G.dur), 0, 1), sk = X.SK ? X.SK() : 1, k2 = (X.g ? X.g.zoom : 1) / sk, sp = G.sp, X0 = X.sx(G.x) - sp.ax * k2, Y0 = X.sy(G.y) - sp.ay * k2, kk = sp.cv.width * k2 / G.I.W, hc = hx(G.hot);
      if (Q) { const sg = G.segs, rev = 0.18 + u * 1.1, w = T * (0.12 + 0.12 * G.big); let n = 0; for (let j = 0; j < sg.length && n < 60; j += 5) { if (sg[j + 4] > rev) continue; n++; Q.beam(X0 + sg[j] * kk, Y0 + sg[j + 1] * kk, X0 + sg[j + 2] * kk, Y0 + sg[j + 3] * kk, w, hc, 0.3 + 0.4 * u); } Q.glow(X.sx(G.x), X.sy(G.y) - (G.I.ay - G.I.y0) * G.tpw * 0.5 * T, T * (0.6 + G.size * 0.5), hc, 0.4 * u * u); }
      else { const sg = G.segs, rev = 0.18 + u * 1.1; c.strokeStyle = hc; c.lineCap = 'round'; c.lineWidth = Math.max(2, T * (0.1 + 0.08 * G.big)); c.globalAlpha = 0.18 + 0.25 * u; c.beginPath(); for (let j = 0; j < sg.length; j += 5) { if (sg[j + 4] > rev) continue; c.moveTo(X0 + sg[j] * kk, Y0 + sg[j + 1] * kk); c.lineTo(X0 + sg[j + 2] * kk, Y0 + sg[j + 3] * kk); } c.stroke();
        c.globalAlpha = 0.45 * u * u; const r = T * (0.6 + G.size * 0.5); blitSized(c, glowSprite(hc), X.sx(G.x) - r, X.sy(G.y) - (G.I.ay - G.I.y0) * G.tpw * 0.5 * T - r, r * 2, r * 2); }
    }
    // hot cores and glints on the pieces
    for (let i = 0; i < MAXS; i++) { const s = shards[i]; if (!s.on) continue;
      const X0 = X.sx(s.x), Y0 = X.sy(s.y) - s.z * T;
      if (s.heat > 0.05) { const r = Math.max(3, s.r * T * 0.85), hh = s.heat * s.heat; if (Q) Q.glow(X0, Y0, r, hx(s.hotc), 0.26 * hh); else { c.globalAlpha = 0.3 * hh; blitSized(c, glowSprite(s.hotc), X0 - r, Y0 - r, r * 2, r * 2); } }
      if (s.glint) { const gq = Math.sin(clock * 9 + i * 1.7) * Math.sin(s.ang * 2 + i); if (gq > 0.82) { const a = (gq - 0.82) / 0.18 * (s.fade ? Math.max(0, 1 - s.fade / 0.7) : 1), r = T * (0.14 + s.r * 0.5); if (Q) Q.star(X0, Y0, r, a, '#FFFFFF'); else { c.globalAlpha = a; blitSized(c, glowSprite('#FFFFFF'), X0 - r * 0.6, Y0 - r * 0.6, r * 1.2, r * 1.2); } } }
    }
    let nSm = 0; const SMOKE_CAP = lowFx() ? 24 : 48;   // (a bound on the GPU's smoke volumes per frame, whatever is breaking)
    const FXq = typeof FXB !== 'undefined' && FXB.on;   /* (v440 SQ) the shared cosmetic budget: sparks, glints and embers of debris (its second tier); their hash from their slot and seed */
    for (let i = 0; i < MAXP; i++) { const p = parts[i]; if (!p.on) continue;
      const u = 1 - p.life / p.max, X0 = X.sx(p.x), Y0 = X.sy(p.y) - p.z * T, r = (p.r + (p.r1 - p.r) * (1 - (1 - u) * (1 - u))) * T;
      if (FXq && (p.k === P_SPARK || p.k === P_GLINT || p.k === P_EMBER)) { const rr = Math.max(3, p.r * T) * (p.k === P_EMBER ? 6 : 2); if (!FXB.keepH(((i * 0.6180339 + (p.seed || 0) * 0.1373) % 1 + 1) % 1, 1, rr * rr, X0, Y0)) continue; }
      switch (p.k) {
        case P_GLOW: { const a = p.a * (1 - u) * (1 - u); if (Q) Q.glow(X0, Y0, r, hx(p.col), a); else { c.globalAlpha = a * 0.85; blitSized(c, glowSprite(p.col), X0 - r, Y0 - r, r * 2, r * 2); } break; }
        case P_RING: { const a = p.a * (1 - u); if (Q) { Q.ring(X0, Y0, r, hx(p.col), a * 0.55, r * 0.12, 0.5); Q.ewave(X0, Y0, r, hx(p.col), 0.45, a * 0.3, p.seed, 0.5, 0.1); } else { c.globalAlpha = a * 0.42; const s2 = r / 0.86; blitSized(c, shockSprite(p.col), X0 - s2, Y0 - s2 * 0.5, s2 * 2, s2); } break; }
        case P_SPARK: { const a = Math.min(1, p.life * 4), L = 0.035; const x1 = X0 - p.vx * L * T, y1 = Y0 - (p.vy - p.vz) * L * T; if (Q) Q.beam(X0, Y0, x1, y1, Math.max(1.4, T * 0.04), hx(p.col), a * 0.9); else { c.globalAlpha = a; c.strokeStyle = p.col; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(X0, Y0); c.lineTo(x1, y1); c.stroke(); } break; }
        case P_EMBER: { const a = p.a * Math.min(1, p.life * 1.5) * (0.7 + 0.3 * Math.sin(clock * 20 + p.seed)), rr2 = Math.max(1.5, p.r * T); if (Q) { Q.glow(X0, Y0, rr2 * 3, hx(p.col), a * 0.7); Q.star(X0, Y0, rr2 * 1.2, a * 0.6, '#FFE6B0'); } else { c.globalAlpha = a; blitSized(c, glowSprite(p.col), X0 - rr2 * 2, Y0 - rr2 * 2, rr2 * 4, rr2 * 4); } break; }
        case P_GLINT: { const a = p.a * Math.sin(Math.PI * Math.min(1, u * 1.2)), s2 = Math.max(3, p.r * T); if (Q) Q.star(X0, Y0, s2, a, '#FFFFFF'); else { c.globalAlpha = a; blitSized(c, glowSprite('#FFFFFF'), X0 - s2 * 0.5, Y0 - s2 * 0.5, s2, s2); } break; }
        case P_WISP: { const a = p.a * Math.sin(Math.PI * Math.min(1, u * 1.1)), w = Math.max(2, p.r * T), h = Math.max(4, r * 1.6); if (Q) { Q.etongue(X0, Y0 + h * 0.3, w, h, Math.sin(clock * 3 + p.seed) * 0.35 + p.rot * 0.05, hx(p.col), p.heat, a, p.seed); Q.glow(X0, Y0, w * 2.2, '#2A0C40', a * 0.3); } else { c.globalAlpha = a * 0.8; blitSized(c, glowSprite(p.col), X0 - w * 1.5, Y0 - h, w * 3, h * 1.6); } break; }
        case P_SMOKE: case P_STEAM: { if (!Q || nSm >= SMOKE_CAP) break; const a = p.a * Math.min(1, u * 6) * (1 - u); if (a > 0.01) { nSm++; Q.smoke(X0, Y0, r, a, p.seed, hx(p.col), p.lit); } break; }
        case P_FIRE: { const a = p.a * Math.sin(Math.PI * Math.min(1, u * 1.15)); if (Q) { Q.fire(X0, Y0 - r * 0.6, r, p.heat, a, p.seed, 1.2); Q.glow(X0, Y0, r * 1.8, '#FF6A1F', a * 0.6); } else { c.globalAlpha = a; blitSized(c, glowSprite('#FF8A3D'), X0 - r * 1.4, Y0 - r * 2, r * 2.8, r * 2.6); } break; }
        case P_BURN: { const a = p.a * Math.min(1, u * 8) * (1 - u * u); if (Q) Q.ground(X0, Y0, r, p.heat * (1 - u * 0.6), a, p.seed, 0.5, 1); else { c.globalAlpha = a * 0.6; blitSized(c, glowSprite('#FF6A1F'), X0 - r, Y0 - r * 0.5, r * 2, r); } break; }
        case P_BLOB: { const g2 = Math.max(3, p.r * T * 2.1); if (Q) Q.glow(X0, Y0, g2, '#FF5A1E', 0.32); else { c.globalAlpha = 0.35; blitSized(c, glowSprite('#FF7A2A'), X0 - g2, Y0 - g2, g2 * 2, g2 * 2); } break; }
      }
    }
    // the rubble's last heat
    for (let i = 0; i < decals.length; i++) { const D = decals[i]; if (!D.glow || D.t > D.glowT) continue; const a = (1 - D.t / D.glowT) * 0.5, r = D.R * T * 0.8; if (Q) Q.glow(X.sx(D.x), X.sy(D.y), r, hx(D.glow), a * 0.6, 0.55); else { c.globalAlpha = a * 0.5; blitSized(c, glowSprite(D.glow), X.sx(D.x) - r, X.sy(D.y) - r * 0.55, r * 2, r * 1.1); } }
    c.globalAlpha = 1;
  }
  const hx = col => (typeof col === 'string' && col[0] === '#' && col.length === 7 ? col : '#FFFFFF');

  /* ---------------- sound ---------------- */
  function sound(X, what, M, big, quiet, mat, lava, steam) {
    const S = (X && X.sfx) || (typeof sfx !== 'undefined' ? sfx : null); if (!S) return;
    try {
      if (what === 'crack') { if (S.crack) S.crack(); if (big > 0.4 && S.note) S.note(95, 0.25, 'sine', 0.35, 70); return; }
      if (quiet && clock - lastSnd < 0.09) return; lastSnd = clock;
      const note = S.note || (() => {}), hiss = S.hiss || (() => {}), k = quiet ? 0.5 : 1;
      if (big > 0.35) { note(68, 0.7, 'sine', 0.75 * k, 32); note(45, 0.9, 'triangle', 0.35 * k, 28, 0.03); hiss(0.55, 0.6 * k, 230); hiss(0.8, 0.35 * k, 120, 0.08); hiss(0.25, 0.25 * k, 900, 0.4); hiss(0.2, 0.18 * k, 1300, 0.7); }
      switch (M.snd) {
        case 'glass': if (S.crack) S.crack(); note(1760, 0.5, 'sine', 0.22 * k, 1320); note(2349, 0.35, 'triangle', 0.1 * k, 0, 0.04); note(3136, 0.14, 'sine', 0.08 * k, 0, 0.22); note(2637, 0.12, 'sine', 0.07 * k, 0, 0.38); if (M.low) note(120, 0.4, 'sawtooth', 0.08 * k, 70); break;
        case 'ice': if (S.crack) S.crack(); note(1975, 0.32, 'sine', 0.2 * k, 1480); hiss(0.45, 0.22 * k, 3200); note(2960, 0.12, 'sine', 0.06 * k, 0, 0.3); break;
        case 'wood': if (S.thud) S.thud(); hiss(0.2, 0.42 * k, 700); if (S.crack) S.crack(); break;
        case 'pot': if (S.crash) S.crash(); note(880, 0.09, 'triangle', 0.18 * k, 620); hiss(0.12, 0.25 * k, 2400, 0.05); break;
        case 'iron': note(180, 0.45, 'square', 0.09 * k, 120); note(523, 0.7, 'triangle', 0.14 * k, 500); note(1046, 0.4, 'sine', 0.06 * k, 1000, 0.02); hiss(0.22, 0.3 * k, 2600); break;
        default: if (S.crash) S.crash(); if (big <= 0.35) note(110, 0.22, 'sine', 0.4 * k, 70);
      }
      if (lava) { if (S.splash) S.splash(); hiss(0.9, 0.3 * k, 600, 0.12); }
      if (steam) hiss(1.1, 0.35 * k, 1800, 0.05);
    } catch (e) {}
  }

  /* ---------------- glue ---------------- */
  function reset() { for (let i = 0; i < MAXS; i++) shards[i].on = false; for (let i = 0; i < MAXP; i++) parts[i].on = false; nS = 0; nP = 0; while (decals.length) decPool.push(decals.pop()); ghosts.length = 0; }
  function bind(ctx) { reset(); C = ctx; if (!C.alive) C.alive = () => true; }
  function prop(Xa, p, o) {
    if (!p) return false; o = o || {};
    const K = KIND[p.kind] || null;
    return burst(Xa, p.x, p.y, Object.assign({ kind: p.kind, v: p.v, biome: p.biome, el: p.el, mat: (K && K.mat) || matOf(p.kind, p.el) }, K || {}, o));
  }
  const stats = () => ({ shards: nS, parts: nP, decals: decals.length, ghosts: ghosts.length, t: clock });
  return { burst, prop, matOf, MAT, KIND, bind, update, drawGround, drawWorld, drawFx, reset, stats };
})();
try { self.BREAK_FX = BREAK_FX; } catch (e) {}   // (for tests and for code outside the bundle's scope)
