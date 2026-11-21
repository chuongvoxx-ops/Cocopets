/* ---------- v443 SB: the dungeons' saw traps, spike plates and loot boxes, repainted in 2.5D ----------
   (the user, v443: "Can you remake these saw traps and treasure boxes on the battlefield on the gpu? I want it to be same
   quality as the props graphics". The green dotted squares in that picture are the spike plates of the thorn hazard
   (20b drawHazard: spikes, icespikes, thorns), so they are rebuilt here too, with every loot breakable: chest, crate,
   explosive barrel, pot and urn, and the wooden barrel prop that stands beside them.)
   Every picture is painted once, on the loading screen, by the Drowned Belfry's software shading pass (BELPROPS.kit, 20n9:
   each pixel of a solid gets a normal and a material and is lit) in the light of the land it stands in (the Belfry's sea
   light and bronze, the Garden's three sections, the Dunes' dusk / noon / night, the Caldera's ember light and iron, the
   Rimebound Forge's cold, and a neutral, cold, warm or green light for the Tower's lands and the other rifts), then finished
   with 2D detail and a soft ink edge. Nothing is painted per frame:
   - the saw: a circular blade (bevelled hooked teeth with carbide tips, a brushed steel body with expansion slots and a
     temper-coloured rim, a bolted flange and arbor nut, wear and grime; a dark steel face, bright ground edges on the teeth
     and a dark outline, so it reads on any floor), painted once with a light rotational smear on its teeth band only and
     spun by rotating that picture; it rises out of a slotted metal track (one picture per track: a bolted bed plate, a dark
     groove between two polished rails, scuffs, two end stops) and is cut by the slot's lip. Its live light: sparks thrown from the slot, a hot glow where it bites, a trailing glow while it glides,
     and, when the pet is close, a red-orange glow round the teeth (glow only: no circle);
   - the spike plates: a riveted plate with nine collared sockets (a frosted one for ice spikes, a root-woven one for
     thorns), and its spikes (steel, ice shards or curved thorns) rising row by row out of the sockets; the tell is glow
     only (the sockets kindle; the red circle it had is not drawn);
   - the loot boxes (through the engine's prop cache, DunWorld.propSprite, so BREAK_FX shatters the new pictures in their
     own materials): a treasure chest (oak planks, a rounded lid, metal bands and corner brackets, a gold lock plate, gold
     light leaking from the lid's seam), a crate (pine boards, a brace, nails), an explosive barrel (red-painted staves,
     hoops, a hazard diamond, a fuse), a pot and an urn (terracotta, painted bands, an urn's handles), a wooden barrel.
     The chest breathes a soft gold light; a hit flashes; a chest broken open throws gold sparkle and coins of light.
   The live light is queued while the things are drawn and laid by lay() in the dungeon's own GPU pass (20b dqBegin ..
   dqEnd, through NIDHOGG_MOVES.FGFX) when that pass has light of its own this frame; when it would otherwise be empty the
   same light is laid from a cached 2D picture of the painter's own falloff, so no WebGL copy is ever added for it. Without
   the GPU painter (no WebGL, __DUN_GL = 0) the pictures draw and there is no live light (a spike plate's tell is then the
   old circle, so the warning is never lost). lowFx: fewer sparks.
   Gameplay is untouched: timing, damage, hit areas, the boxes' hit points, drops and positions are 20b's as before.
   Memory: the pictures are kept per land, kind and sharpness (the floor's TS x SK) and all let go when the stage closes
   (DunWorld.dropProps, chained). window.__TRAPART = 0 (or __BELP = 0) brings back the old 2D art.
   API (global TRAP_ART): saw(c, t, sx, sy, T, gt, near, bio) / spikes(c, h, X, Y, T, gt, up, bio) draw one (false: the old
   art draws it); pot(c, p, kind, X, Y, T, gt) its live light; hit(p) / broke(p) on a box's hit and break; tell() whether a spike plate's tell is its glow (else 20b draws the old circle); lay(c, Q,
   sx, sy, T, gt) once a frame in the dungeon's GPU pass; warm(P) -> jobs (the loading screen); release(); on(); pic(name,
   v, P, light) a picture (tests); lightOf(biome); stats. */
var TRAP_ART = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__TRAPART === 0 || window.__BELP === 0);
  const BP = () => (!off() && HAS_W && window.BELPROPS && window.BELPROPS.kit) ? window.BELPROPS : null;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const R1 = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, gpuOps: 0, d2Ops: 0, laidGPU: 0, laid2D: 0 };

  /* ======================= the lights of the lands ======================= */
  const LT = {
    neutral: { a0: [0.2, 0.19, 0.2], a1: [0.08, 0.08, 0.12], e0: [0.12, 0.11, 0.12], e1: [0.46, 0.46, 0.52], k: [1.22, 1.14, 1.02], rim: [0.34, 0.34, 0.38], bo: [0.07, 0.06, 0.05] },
    bel: { a0: [0.08, 0.25, 0.27], a1: [0.2, 0, 0.11], e0: [0.04, 0.15, 0.18], e1: [0.42, 0.4, 0.55], k: [1.08, 1.12, 1.24], rim: [0.12, 0.48, 0.46], bo: [0.03, 0.16, 0.15] },
    grove: { a0: [0.13, 0.08, 0.17], a1: [0.07, 0.1, 0.11], e0: [0.08, 0.05, 0.11], e1: [0.42, 0.36, 0.56], k: [1.16, 1.08, 1.02], rim: [0.5, 0.22, 0.42], bo: [0.05, 0.14, 0.1] },
    grove2: { a0: [0.06, 0.13, 0.13], a1: [0.05, 0.11, 0.1], e0: [0.04, 0.1, 0.1], e1: [0.3, 0.5, 0.5], k: [1.1, 1.12, 1.06], rim: [0.24, 0.52, 0.46], bo: [0.04, 0.15, 0.11] },
    grove3: { a0: [0.06, 0.08, 0.18], a1: [0.05, 0.07, 0.13], e0: [0.04, 0.06, 0.13], e1: [0.3, 0.38, 0.62], k: [1.08, 1.08, 1.14], rim: [0.22, 0.32, 0.62], bo: [0.04, 0.1, 0.14] },
    dusk: { a0: [0.17, 0.09, 0.13], a1: [0.1, 0.06, 0.1], e0: [0.14, 0.08, 0.07], e1: [0.52, 0.32, 0.42], k: [1.32, 1.02, 0.74], rim: [0.55, 0.32, 0.16], bo: [0.17, 0.11, 0.06] },
    noon: { a0: [0.21, 0.13, 0.1], a1: [0.12, 0.1, 0.1], e0: [0.2, 0.1, 0.06], e1: [0.46, 0.48, 0.58], k: [1.4, 1.27, 1.08], rim: [0.46, 0.3, 0.24], bo: [0.22, 0.1, 0.05] },
    night: { a0: [0.07, 0.09, 0.17], a1: [0.05, 0.07, 0.14], e0: [0.05, 0.06, 0.12], e1: [0.26, 0.34, 0.56], k: [0.7, 0.84, 1.16], rim: [0.14, 0.42, 0.22], bo: [0.04, 0.06, 0.12] },
    ember: { a0: [0.1, 0.07, 0.07], a1: [0.1, 0.08, 0.1], e0: [0.24, 0.08, 0.03], e1: [0.34, 0.28, 0.36], k: [1.22, 1.06, 0.98], rim: [0.42, 0.18, 0.1], bo: [0.32, 0.1, 0.03] },
    ice: { a0: [0.05, 0.08, 0.12], a1: [0.1, 0.15, 0.22], e0: [0.16, 0.08, 0.05], e1: [0.5, 0.64, 0.8], k: [1.0, 1.08, 1.22], rim: [0.3, 0.62, 0.88], bo: [0.16, 0.07, 0.03] },
    cold: { a0: [0.1, 0.13, 0.18], a1: [0.08, 0.1, 0.14], e0: [0.1, 0.11, 0.14], e1: [0.5, 0.58, 0.72], k: [1.05, 1.12, 1.25], rim: [0.3, 0.45, 0.6], bo: [0.06, 0.08, 0.1] },
    warm: { a0: [0.2, 0.12, 0.09], a1: [0.1, 0.06, 0.05], e0: [0.18, 0.09, 0.05], e1: [0.5, 0.38, 0.32], k: [1.3, 1.06, 0.82], rim: [0.5, 0.26, 0.14], bo: [0.2, 0.08, 0.03] },
    green: { a0: [0.1, 0.14, 0.1], a1: [0.06, 0.1, 0.07], e0: [0.07, 0.1, 0.07], e1: [0.4, 0.5, 0.42], k: [1.18, 1.14, 0.98], rim: [0.3, 0.42, 0.26], bo: [0.06, 0.12, 0.05] } };
  /* each light's metal (the chest's bands, the crate's brackets, the barrels' hoops, the saw's flange and track, the spike
     plate): the Belfry's bronze, the Caldera's blackened iron, the Garden's dark iron, steel elsewhere; its ink; its moss */
  const LOOK = { neutral: { trim: 'steel', ink: [20, 16, 22] }, bel: { trim: 'bronze', ink: [14, 22, 24] }, grove: { trim: 'darkiron', ink: [22, 10, 26], moss: 0.5 }, grove2: { trim: 'darkiron', ink: [8, 22, 22], moss: 0.5 },
    grove3: { trim: 'darkiron', ink: [8, 12, 30], moss: 0.4 }, dusk: { trim: 'steel', ink: [44, 18, 30], dust: 1 }, noon: { trim: 'steel', ink: [56, 18, 10], dust: 1 }, night: { trim: 'steel', ink: [6, 10, 28], dust: 0.6 },
    ember: { trim: 'blackiron', ink: [20, 8, 6], soot: 1 }, ice: { trim: 'blackiron', ink: [8, 14, 24], rime: 1 }, cold: { trim: 'steel', ink: [10, 16, 26], rime: 0.5 }, warm: { trim: 'iron', ink: [34, 14, 8] }, green: { trim: 'iron', ink: [12, 20, 12], moss: 0.6 } };
  const BIO = { garden: 'grove', garden2: 'grove2', garden3: 'grove3', nursery: 'grove', lunarfloor: 'grove3', meadow: 'grove2', taurcourt: 'grove', dunes: 'dusk', mesa: 'noon', nightdune: 'night', vigil: 'night',
    ashen: 'ember', foundry: 'ember', heartward: 'ember', calderapit: 'ember', glassheart: 'ember', agyard: 'ember', agaltar: 'ember', rimeforge: 'ice',
    frost: 'cold', icefield: 'cold', blizzard: 'cold', glacier: 'cold', whiteout: 'cold', observatory: 'cold', coolant: 'cold', mare: 'cold', shafts: 'cold', innertide: 'cold', greyshore: 'cold',
    hell: 'warm', volcano: 'warm', desert: 'warm', sandstorm: 'warm', crag: 'warm', mountain: 'warm', engineheart: 'warm', wreckfield: 'warm', autumn: 'warm', scorehall: 'warm', breathworks: 'warm', resonance: 'warm',
    forest: 'green', jungle: 'green', swamp: 'green', bloom: 'green', glassgarden: 'green', ruins: 'green', courtyard: 'green' };
  const lightOf = b => { b = String(b || ''); if (BIO[b]) return BIO[b]; if (/^bel/.test(b)) return 'bel'; return 'neutral'; };
  /* the kit's light is the Belfry's own object (BELPROPS.kit.LIGHTS.bel, its painter's default): set to a land's for one
     painting and put back (as the Dunes' props do) */
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LT[name] || LT.neutral); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }

  /* ======================= materials ======================= (each sets K.M; u, v surface coordinates in tiles) */
  function steelM(K, u, v, sd, wear) { const M = K.M, s = K.vn(u * 9 + sd, v * 9), sc = K.vn(u * 47 + sd, v * 4.1), g = ss(0.58, 0.86, K.vn(u * 3.3 + sd * 2, v * 3.3)) * (1 - (wear || 0));
    M.mt = 1 - g * 0.6; M.fr = 0.56 + 0.1 * s; M.fg = 0.58 + 0.1 * s; M.fb = 0.62 + 0.1 * s; M.rg = 0.28 + 0.16 * s + (sc > 0.72 ? -0.08 : 0); M.r = 0.1; M.g = 0.09; M.b = 0.08; if (g > 0) M.rg = lerp(M.rg, 0.8, g); }
  function goldM(K, u, v, sd) { const M = K.M, s = K.vn(u * 21 + sd, v * 21); M.mt = 1; M.fr = 0.98; M.fg = 0.72 + 0.06 * s; M.fb = 0.3; M.rg = 0.16 + 0.12 * s; }
  /* the land's metal (see LOOK) */
  function trimM(K, L, u, v, ao, sd, wear) { const M = K.M, tr = (LOOK[L] || LOOK.neutral).trim;
    if (tr === 'bronze') K.bronze(u, v, ao, sd, wear == null ? 0.35 : wear);
    else if (tr === 'darkiron' || tr === 'blackiron') { K.iron(u, v, ao, sd); M.r *= 0.55; M.g *= 0.6; M.b *= 0.7; M.fr *= 0.85; M.fg *= 0.85; M.fb *= 0.9; if (tr === 'blackiron') { M.rg = Math.max(M.rg, 0.55); M.r *= 0.6; M.g *= 0.6; M.b *= 0.6; } if (wear) { M.mt = lerp(M.mt, 1, wear * 0.6); M.fr = lerp(M.fr, 0.6, wear * 0.5); M.fg = lerp(M.fg, 0.6, wear * 0.5); M.fb = lerp(M.fb, 0.62, wear * 0.5); M.rg = lerp(M.rg, 0.3, wear * 0.5); } }
    else if (tr === 'iron') { K.iron(u, v, ao, sd); if (wear) { M.mt = lerp(M.mt, 1, wear * 0.6); M.fr = lerp(M.fr, 0.6, wear * 0.5); M.fg = lerp(M.fg, 0.6, wear * 0.5); M.fb = lerp(M.fb, 0.62, wear * 0.5); M.rg = lerp(M.rg, 0.3, wear * 0.5); } }
    else steelM(K, u, v, sd, 0); }
  /* oak (warm, close-grained; the planks' grain runs along u), pine (paler), and a land's grime: moss, sand dust, soot, rime */
  function woodM(K, u, v, sd, tone, pale) { const M = K.M, gr = K.vn(u * 1.7 + sd, v * 28) * 0.62 + K.vn(u * 6.3 + sd, v * 64) * 0.38, kn = K.vn(u * 4.1 + 3 + sd, v * 4.1), t = (tone || 1) * (0.74 + 0.5 * gr);
    if (pale) { M.r = 0.62 * t; M.g = 0.43 * t; M.b = 0.24 * t; } else { M.r = 0.44 * t; M.g = 0.24 * t; M.b = 0.11 * t; } if (kn > 0.82) { const q = ss(0.82, 0.9, kn); M.r *= 1 - 0.4 * q; M.g *= 1 - 0.45 * q; M.b *= 1 - 0.5 * q; }
    M.rg = 0.62 - 0.12 * gr; M.cc = 0.1; }
  function grime(K, L, u, v, ao, top) { const M = K.M, O = LOOK[L] || LOOK.neutral, n = K.vn(u * 5.3 + 11, v * 5.3 + 3);
    if (O.moss) { const m = O.moss * ss(0.55, 0.8, n * 0.8 + (top ? 0.25 : 0) + (1 - ao) * 0.3); if (m > 0) { const m2 = K.vn(u * 19, v * 19); M.mt *= 1 - m; M.r = lerp(M.r, 0.1 + m2 * 0.05, m); M.g = lerp(M.g, 0.24 + m2 * 0.08, m); M.b = lerp(M.b, 0.1, m); M.rg = lerp(M.rg, 0.95, m); } }
    if (O.dust) { const d = O.dust * ss(0.5, 0.85, n + (top ? 0.3 : 0)) * 0.7; if (d > 0) { M.mt *= 1 - d; M.r = lerp(M.r, 0.62, d); M.g = lerp(M.g, 0.46, d); M.b = lerp(M.b, 0.3, d); M.rg = lerp(M.rg, 0.95, d); } }
    if (O.soot) { const d = O.soot * ss(0.45, 0.8, n + (1 - ao) * 0.4) * 0.75; if (d > 0) { M.r *= 1 - d * 0.7; M.g *= 1 - d * 0.72; M.b *= 1 - d * 0.7; M.fr *= 1 - d * 0.5; M.fg *= 1 - d * 0.5; M.fb *= 1 - d * 0.5; M.rg = lerp(M.rg, 0.9, d); } }
    if (O.rime) { const d = O.rime * ss(0.66, 0.9, n + (top ? 0.22 : 0) + (1 - ao) * 0.15) * 0.65; if (d > 0) { M.mt *= 1 - d; M.r = lerp(M.r, 0.78, d); M.g = lerp(M.g, 0.86, d); M.b = lerp(M.b, 0.94, d); M.rg = lerp(M.rg, 0.5, d); M.cc = Math.max(M.cc, d * 0.6); } } }
  function clayM(K, u, v, sd, tone) { const M = K.M, w = K.fbm(u * 4 + sd, v * 4), t = (tone || 1) * (0.78 + 0.36 * w); M.r = 0.56 * t; M.g = 0.3 * t; M.b = 0.17 * t; M.rg = 0.82; M.cc = 0.08; if (K.vn(u * 31 + sd, v * 31) > 0.8) M.ao *= 0.8; }

  /* ======================= the pictures ======================= */
  /* (feet at 0, 0, tiles, y down; the box [x0, y0, x1, y1] about the feet) */
  const DEF = {};
  // the treasure chest: oak planks, a rounded lid, metal bands over both, corner brackets, a gold lock plate; gold light at the seam
  DEF.chest = { box: () => [-0.56, -0.92, 0.56, 0.3], paint(K, S, v, L) { const { rbox, M } = K, c = S.c, HW = 0.37, HD = 0.25, ZB = 0.37;
    const band = u => Math.abs(Math.abs(u) - 0.235) < 0.042, corner = (u, hw) => Math.abs(u) > hw - 0.05;
    rbox(S, 0, 0, HW, HD, 0, ZB, 0.03, (f, u, v2, ao, e) => { const top = f === 't';
      if (!top && (band(u) || corner(u, HW) && (v2 < 0.1 || v2 > ZB - 0.08) || v2 < 0.035)) { trimM(K, L, u * 2, v2 * 2, ao, 3, e > 0.5 ? 0.8 : 0.25); grime(K, L, u, v2, ao, false); return; }
      if (!top && Math.abs(u) < 0.085 && v2 > ZB - 0.16) { goldM(K, u, v2, 4); if (Math.abs(u) < 0.013 && v2 > ZB - 0.11 && v2 < ZB - 0.05) { M.mt = 0; M.r = M.g = M.b = 0.01; M.rg = 0.9; } return; }   // (the lock's hasp, its keyhole)
      woodM(K, u, v2, 1.3, 1, false); const sm = ((v2 % 0.125) + 0.125) % 0.125; if (!top && sm < 0.012) M.ao *= 0.45; if (e > 0.5) { M.r *= 1.12; M.g *= 1.1; M.b *= 1.08; } grime(K, L, u, v2, ao, top); });
    S.unlock();
    // the lid: a barrel top lying along the chest (a cylinder across it, its ends cut square), bands over it, a rim of metal
    const LR = 0.215, LY = -ZB - LR + 0.005;
    K.tube(S, [[-HW - 0.1, LY], [HW + 0.1, LY]], LR, LR, (t, s2, ao) => { const u = -HW - 0.1 + t * (HW * 2 + 0.2), as = Math.abs(s2);
      if (band(u) || as > 0.9 || corner(u, HW + 0.02)) { trimM(K, L, u * 2, s2 + 5, ao, 5, as > 0.6 ? 0.7 : 0.3); grime(K, L, u, s2, ao, true); return; }
      woodM(K, u, s2 * 0.25 + 2, 2.1, 1.04, false); const sm = ((u % 0.13) + 0.13) % 0.13; if (sm < 0.01) M.ao *= 0.55; grime(K, L, u, s2, ao, true); });
    S.unlock(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); for (const sx of [-1, 1]) { const x0 = S.ax + sx * (HW + 0.022) * S.P, y0 = S.ay + (LY - LR - 0.02) * S.P; c.clearRect(sx < 0 ? 0 : x0, y0, sx < 0 ? x0 : S.w - x0, (LR * 2 + 0.03) * S.P); } c.restore();
    c.save(); c.globalCompositeOperation = 'destination-over'; K.contact(S, 0, 0.03, 0.6, 0.24, 0.55); c.restore();
    // the seam's gold light (the chest's own: the GPU breathes it live), rivets, a glint on the lock
    c.save(); c.globalCompositeOperation = 'lighter'; const sg = c.createLinearGradient(0, -ZB - 0.03, 0, -ZB + 0.03); sg.addColorStop(0, 'rgba(255,200,90,0)'); sg.addColorStop(0.5, 'rgba(255,206,110,.55)'); sg.addColorStop(1, 'rgba(255,200,90,0)'); c.fillStyle = sg; c.fillRect(-HW + 0.06, -ZB - 0.03, HW * 2 - 0.12, 0.06); c.restore();
    c.save(); c.fillStyle = 'rgba(14,8,4,.85)'; c.fillRect(-HW - 0.01, -ZB - 0.006, HW * 2 + 0.02, 0.01); c.restore();
    const riv = []; for (const sx of [-1, 1]) for (const z of [0.07, 0.3]) riv.push([sx * 0.235, -z]); for (const z of [0.07, 0.3]) for (const sx of [-1, 1]) riv.push([sx * (HW - 0.025), -z]);
    for (const [x, y] of riv) K.ball(S, x, y, 0.017, 0.017, (dx, dy, ao) => { trimM(K, L, dx, dy, ao, 7, 0.9); });
    S.unlock(); K.ink(S, (LOOK[L] || LOOK.neutral).ink, 0.55); K.glint(c, -0.05, -ZB - 0.07, 0.09, 0.75); grainIn(K, S, 0.06); } };
  // the crate: pine boards in a frame, a diagonal brace, nails, small metal brackets at its corners
  DEF.crate = { box: () => [-0.5, -0.82, 0.5, 0.3], paint(K, S, v, L) { const { rbox, M } = K, c = S.c, HW = 0.31, HD = 0.27, H = 0.57;
    K.contact(S, 0, 0.03, 0.52, 0.22, 0.55);
    rbox(S, 0, 0, HW, HD, 0, H, 0.022, (f, u, v2, ao, e) => { const top = f === 't', a = top ? u : u, b = top ? v2 + HD : v2, hb = top ? HD * 2 : H, fr = Math.abs(a) > HW - 0.065 || b < 0.06 || b > hb - 0.06;
      const dg = Math.abs((a + HW) / (HW * 2) - b / hb) * Math.min(HW * 2, hb), br = !fr && dg < 0.045;
      if (Math.abs(a) > HW - 0.045 && (b < 0.07 || b > hb - 0.07) && !top) { trimM(K, L, u * 3, v2 * 3, ao, 2, 0.6); return; }
      woodM(K, fr || br ? a + 7 : a, fr || br ? b * 0.3 : b, top ? 4.2 : 2.6, fr || br ? 1.08 : 0.92, true);
      if (!fr && !br) { const pl = ((a % 0.124) + 0.124) % 0.124; if (pl < 0.01) M.ao *= 0.5; M.ao *= 0.82; }
      if (fr && (Math.abs(Math.abs(a) - (HW - 0.065)) < 0.008 || Math.abs(b - 0.06) < 0.008 || Math.abs(b - (hb - 0.06)) < 0.008)) M.ao *= 0.55;
      if (br && dg > 0.036) M.ao *= 0.6; if (e > 0.5) { M.r *= 1.1; M.g *= 1.1; M.b *= 1.08; } grime(K, L, u, v2, ao, top); });
    S.unlock(); c.save(); c.fillStyle = 'rgba(20,14,10,.85)'; for (const [x, y] of [[-0.25, -0.03], [0.25, -0.03], [-0.25, -0.54], [0.25, -0.54], [-0.27, -0.29], [0.27, -0.29], [0, -0.285]]) { c.beginPath(); c.arc(x, y, 0.011, 0, TAU); c.fill(); } c.restore();
    K.ink(S, (LOOK[L] || LOOK.neutral).ink, 0.55); grainIn(K, S, 0.07); } };
  // the barrels: staves bulging round two hoops; the explosive one red-painted (chipped to the wood) with a hazard diamond and a fuse
  function paintBarrel(K, S, L, x) { const { M } = K, c = S.c, R0 = x ? 0.25 : 0.29, H = x ? 0.74 : 0.82, prof = h => R0 + (x ? 0.045 : 0.05) * Math.sin(Math.PI * clamp(h / H, 0, 1));
    K.contact(S, 0, 0.03, R0 * 1.75, R0 * 0.7, 0.55);
    const hoop = h => (h > H * 0.1 && h < H * 0.18) || (h > H * 0.8 && h < H * 0.88) || h > H - 0.02;
    K.rev(S, 0, 0, prof, 0, H, { mat: (u, h, ao) => { const st2 = ((u / 0.088) % 1 + 1) % 1;
        if (hoop(h)) { trimM(K, L, u * 2, h * 2, ao, 4, 0.35); grime(K, L, u, h, ao, false); return; }
        woodM(K, h * 0.5 + 9, u, 5.1, 1, false); if (st2 < 0.07) M.ao *= 0.5;
        if (x) { const chip = ss(0.7, 0.78, K.vn(u * 7 + 2, h * 7) * 0.7 + K.vn(u * 23, h * 23) * 0.4) * (0.4 + 0.6 * ss(0.3, 0.9, K.vn(u * 2.3, h * 2.3)));
          if (chip < 0.5) { M.r = 0.5 + 0.06 * K.vn(u * 9, h * 9); M.g = 0.07; M.b = 0.05; M.rg = 0.5; M.cc = 0.35; }
          const dx = Math.abs(u) / 0.12, dy = Math.abs(h - H * 0.5) / 0.13;   // (the hazard diamond, and a flame cut in it)
          if (dx + dy < 1) { const fy = (h - H * 0.5 + 0.09) / 0.18, fw = 0.055 * Math.sin(Math.PI * clamp(fy, 0, 1)) * (1 - 0.35 * fy) * (1 + 0.25 * Math.sin(fy * 9)); if (dx + dy > 0.86) { M.r = 0.04; M.g = 0.03; M.b = 0.02; M.rg = 0.6; } else if (fy > 0 && fy < 1 && Math.abs(u + 0.012 * Math.sin(fy * 7)) < fw) { M.r = 0.12; M.g = 0.04; M.b = 0.02; M.rg = 0.7; } else { M.r = 0.92; M.g = 0.68; M.b = 0.1; M.rg = 0.5; M.cc = 0.3; } } }
        grime(K, L, u, h, ao, false); },
      top: true, capMat: (cx, h, ao, ins, phi, x2, ey) => { woodM(K, cx * 2 + 4, (ey || 0) * 0.2, 6.3, 0.92, false); const r = Math.hypot(cx / R0, ey || 0); if (r > 0.86) trimM(K, L, cx, ey || 0, 1, 8, 0.4); if (Math.hypot(cx - 0.08, (ey || 0) * R0 * 0.34 + 0.0) < 0.035) { M.r *= 0.4; M.g *= 0.4; M.b *= 0.4; } grime(K, L, cx, ey || 0, 1, true); } });
    S.unlock();
    if (x) { K.tube(S, [[0.08, -H - 0.01], [0.1, -H - 0.07], [0.06, -H - 0.13], [0.11, -H - 0.17]], 0.016, 0.012, (t, s2, ao) => { M.r = 0.36; M.g = 0.27; M.b = 0.16; M.rg = 0.9; if (t > 0.86) { M.r = 0.08; M.g = 0.06; M.b = 0.05; } }); S.unlock(); }
    K.ink(S, (LOOK[L] || LOOK.neutral).ink, 0.55); K.glint(c, -R0 * 0.55, -H * 0.62, 0.07, 0.4); grainIn(K, S, 0.06); }
  DEF.xbarrel = { box: () => [-0.52, -1.04, 0.52, 0.3], paint(K, S, v, L) { paintBarrel(K, S, L, true); } };
  DEF.barrel = { box: () => [-0.56, -1.0, 0.56, 0.3], paint(K, S, v, L) { paintBarrel(K, S, L, false); } };
  // a pot: a round terracotta pot, a narrow neck and lip, a painted band on its shoulder; an urn: taller, a flared lip, handles
  function paintPot(K, S, L, urn) { const { M } = K, c = S.c, P = urn ? [[0, 0.11], [0.05, 0.17], [0.25, 0.235], [0.42, 0.205], [0.52, 0.14], [0.58, 0.085], [0.65, 0.085], [0.7, 0.13], [0.72, 0.13]] : [[0, 0.15], [0.05, 0.21], [0.22, 0.3], [0.38, 0.27], [0.47, 0.18], [0.52, 0.13], [0.56, 0.14], [0.6, 0.165], [0.62, 0.16]];
    const H = P[P.length - 1][0], prof = h => { let i = 0; while (i < P.length - 2 && P[i + 1][0] < h) i++; const a = P[i], b = P[i + 1], t = clamp((h - a[0]) / (b[0] - a[0] || 1), 0, 1), q = t * t * (3 - 2 * t); return lerp(a[1], b[1], q); };
    K.contact(S, 0, 0.03, 0.5, 0.2, 0.55);
    if (urn) { for (const sx of [-1, 1]) { K.tube(S, [[sx * 0.18, -0.47], [sx * 0.26, -0.52], [sx * 0.245, -0.62], [sx * 0.1, -0.645]], 0.021, 0.018, (t, s2, ao) => { clayM(K, t * 2, s2, 7, 0.95); grime(K, L, t, s2, ao, false); }); } S.unlock(); }
    const b0 = urn ? 0.38 : 0.3, b1 = urn ? 0.47 : 0.4;
    K.rev(S, 0, 0, prof, 0, H, { mat: (u, h, ao) => { clayM(K, u, h, urn ? 3 : 1, urn ? 0.92 : 1);
        if (h > b0 && h < b1) { const zz = Math.abs(((u * (urn ? 9 : 11) + 0.5) % 1 + 1) % 1 - 0.5) * 2, mid = b0 + (b1 - b0) * (0.25 + 0.5 * zz); if (Math.abs(h - mid) < 0.016) { M.r = 0.93; M.g = 0.82; M.b = 0.62; M.rg = 0.6; } else { M.r = urn ? 0.12 : 0.2; M.g = urn ? 0.17 : 0.09; M.b = urn ? 0.22 : 0.05; M.rg = 0.55; M.cc = 0.25; } }
        if (Math.abs(h - b0) < 0.008 || Math.abs(h - b1) < 0.008) { M.r = 0.1; M.g = 0.05; M.b = 0.03; }
        if (h > H - 0.1) M.cc = 0.25; grime(K, L, u, h, ao, false); },
      top: true, capMat: (cx, h, ao, ins, phi, x2, ey) => { const r = Math.hypot(cx / P[P.length - 1][1], ey || 0); if (r < 0.72) { M.r = M.g = M.b = 0.012; M.rg = 1; M.ao = 0.3; } else clayM(K, cx, ey || 0, 2, 1.05); } });
    S.unlock(); K.ink(S, (LOOK[L] || LOOK.neutral).ink, 0.55); K.glint(c, -0.12, -H * 0.62, 0.07, 0.3); grainIn(K, S, 0.06); }
  DEF.pot = { box: () => [-0.5, -0.88, 0.5, 0.3], paint(K, S, v, L) { paintPot(K, S, L, false); } };
  DEF.urn = { box: () => [-0.48, -0.95, 0.48, 0.3], paint(K, S, v, L) { paintPot(K, S, L, true); } };

  /* the saw blade, face on, its centre at 0, 0 (tiles; radius 0.5): lit as if every tooth were at the top (the picture turns:
     no highlight may turn with it); hooked teeth with carbide tips, a temper-coloured rim, a brushed body with four
     expansion slots, a bolted flange (the land's metal) and an arbor nut. v 1: the same with a touch of motion blur */
  const SAW_R = 0.5, SAW_N = 14;
  function paintBlade(K, S, L) { const { M } = K, P = S.P, CX = S.ax, CY = S.ay, fn = [0, 0.95, 0.31];
    S.lock();
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - CX) / P, y = (py + 0.5 - CY) / P, r = Math.hypot(x, y); if (r > SAW_R + 1 / P) continue;
      const th = Math.atan2(y, x), fe = ((th / TAU * SAW_N) % 1 + 1) % 1, rim = 0.392 + 0.108 * (fe < 0.78 ? Math.pow(fe / 0.78, 0.8) : Math.pow((1 - fe) / 0.22, 1.6));
      if (r > rim + 0.6 / P) continue; let a = clamp((rim - r) * P + 0.55, 0, 1);
      // the expansion slots: four short curved cuts in from the rim's gullets, a round hole at their ends (open: the floor shows)
      for (let k = 0; k < 4; k++) { const ak = k / 4 * TAU + 0.18 + (r - 0.3) * 0.9, d = Math.abs(((th - ak + Math.PI) % TAU + TAU) % TAU - Math.PI) * r; if (r > 0.29 && r < 0.4 && d < 0.008) a = 0; if (Math.hypot(x - Math.cos(k / 4 * TAU + 0.18) * 0.29, y - Math.sin(k / 4 * TAU + 0.18) * 0.29) < 0.016) a = 0; }
      if (a <= 0) continue;
      K.M0(); M.ao = 1; let n = fn;
      if (r < 0.06) { K.iron(x * 3, y * 3, 1, 2); M.ao = 0.7; }   // (the arbor: the nut is laid on after)
      else if (r < 0.165) { trimM(K, L, r * 3, th * 0.3, 1, 3, 0.25); if (r > 0.148) { const b = (r - 0.148) / 0.017; n = [0, 0.95 * (1 - b * 0.55), 0.31 + b * 0.9]; } if (r < 0.072) M.ao *= 0.6; }
      else { steelM(K, r * 7, th * 0.6, 5, 0); M.rg = 0.42 + 0.14 * K.vn(r * 90, 2.5) + 0.1 * K.vn(th * 3 + r * 40, r * 9); M.mt = 1; M.fr *= 0.46; M.fg *= 0.47; M.fb *= 0.5;   /* v443 SB (lead review): a dark steel face, so the bright edges and the outline carry the silhouette */
        // brushed rings, a laser-etched dashed ring, grime and wear, the temper colours toward the teeth
        if (Math.abs(r - 0.255) < 0.004 && ((th / TAU * 36) % 1 + 1) % 1 < 0.6) { M.fr *= 0.55; M.fg *= 0.55; M.fb *= 0.58; }
        const gm = ss(0.6, 0.85, K.vn(x * 6 + 9, y * 6) * 0.8 + K.vn(x * 21, y * 21) * 0.35); if (gm > 0) { M.mt = lerp(1, 0.4, gm); M.r = 0.08; M.g = 0.07; M.b = 0.06; M.rg = lerp(M.rg, 0.8, gm); }
        const tp = ss(0.33, 0.4, r) * (1 - ss(0.4, 0.43, r)); if (tp > 0) { const q = (r - 0.33) / 0.1; M.fr = lerp(M.fr, q < 0.5 ? 0.5 : 0.22, tp * 0.6); M.fg = lerp(M.fg, q < 0.5 ? 0.38 : 0.26, tp * 0.6); M.fb = lerp(M.fb, q < 0.5 ? 0.2 : 0.46, tp * 0.6); }
        if (r > rim - 0.04) { const b = clamp(1 - (rim - r) / 0.04, 0, 1), k = ss(0, 0.35, b); n = [0, 0.95 * (1 - b * 0.5), 0.31 + b * 0.85]; M.rg = lerp(M.rg, 0.1, k); M.fr = lerp(M.fr, 0.95, k); M.fg = lerp(M.fg, 0.96, k); M.fb = lerp(M.fb, 0.98, k); M.er = M.eg = M.eb = 0.16 * k; M.ao = 1; }   /* (the ground bevel: bright in every land's light) */
        if (r > 0.42 && r < rim - 0.04 && fe > 0.58 && fe < 0.8) { M.fr = 0.2; M.fg = 0.21; M.fb = 0.24; M.rg = 0.4; }   // (the carbide tip on each tooth's face)
        if (r > rim - 0.05 && r < rim - 0.035) M.ao *= 0.85; }
      const l = Math.hypot(n[0], n[1], n[2]); K.shade(n[0] / l, n[1] / l, n[2] / l); K.put(S, px, py, a); }
    S.unlock();
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5; K.ball(S, Math.cos(a) * 0.112, Math.sin(a) * 0.112, 0.019, 0.019, (dx, dy, ao) => { K.iron(dx, dy, ao, 6); K.M.mt = 0.85; K.M.fr = K.M.fg = K.M.fb = 0.55; K.M.rg = 0.35; }); }
    S.unlock(); const c = S.c; c.save(); c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.26; c.lineTo(Math.cos(a) * 0.05, Math.sin(a) * 0.05); } c.closePath(); c.fillStyle = '#3A3A40'; c.fill(); c.strokeStyle = 'rgba(210,214,222,.55)'; c.lineWidth = 0.008; c.stroke();
    c.beginPath(); c.arc(0, 0, 0.022, 0, TAU); c.fillStyle = '#0C0C10'; c.fill(); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,250,.55)'; for (let k = 0; k < SAW_N; k++) { const a = (k + 0.78) / SAW_N * TAU; c.beginPath(); c.arc(Math.cos(a) * 0.49, Math.sin(a) * 0.49, 0.012, 0, TAU); c.fill(); } c.restore();
    K.ink(S, [6, 6, 9], 0.95); if (S.P > 56) K.ink(S, [6, 6, 9], 0.75); }   /* v443 SB (lead review): a dark outline, so the blade stands out on any floor */
  DEF.blade = { box: () => [-0.56, -0.56, 0.56, 0.56], paint(K, S, v, L) { paintBlade(K, S, L);
    /* v 1 (lead review): the crisp blade with a light rotational smear on its teeth band only (never over the body or the hub) */
    if (v === 1) { const w = S.w, h = S.h, src = mkc(w, h); src.getContext('2d').drawImage(S.cv, 0, 0); const bl = mkc(w, h), x = bl.getContext('2d'), n = 6; x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 0.14; x.globalAlpha = 1 / n; x.setTransform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), S.ax - Math.cos(a) * S.ax + Math.sin(a) * S.ay, S.ay - Math.sin(a) * S.ax - Math.cos(a) * S.ay); x.drawImage(src, 0, 0); }
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in'; const g = x.createRadialGradient(S.ax, S.ay, 0.37 * S.P, S.ax, S.ay, 0.45 * S.P); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const c = S.c; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(bl, 0, 0); c.restore(); src.width = src.height = 1; bl.width = bl.height = 1; } } };
  /* (v 0 not drawn in play since the lead's review: it washed the blade out; kept for the studio) the blade's fixed light (not turned with it): the radial highlight a spinning, circularly ground blade shows toward the
     key light, both sides of the hub; and its lower part darkened where it sinks into the slot. 2D, tinted by the land's key */
  DEF.sheen = { flat: true, box: () => [-0.56, -0.56, 0.56, 0.56], paint(K, S, v, L) { const P = S.P, w = S.w, h = S.h, im = S.c.createImageData(w, h), d = im.data, k = (LT[L] || LT.neutral).k, km = Math.max(k[0], k[1], k[2]), thL = Math.atan2(-0.64, -0.62);
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, r = Math.hypot(x, y); if (r > 0.395 || r < 0.06) continue; const th = Math.atan2(y, x), i = (py * w + px) * 4;
      if (v === 0) { const cs = Math.abs(Math.cos(th - thL)), q = Math.pow(cs, 14) * ss(0.06, 0.14, r) * (1 - ss(0.34, 0.395, r)) * (0.6 + 0.4 * (Math.cos(th - thL) > 0 ? 1 : 0.55)); const a = q * 0.85 + Math.pow(cs, 3) * 0.06 * ss(0.15, 0.38, r);
        d[i] = 255 * k[0] / km; d[i + 1] = 255 * k[1] / km; d[i + 2] = 255 * k[2] / km; d[i + 3] = 255 * clamp(a, 0, 1); }
      else { const a = ss(0.05, 0.36, y) * 0.55 * (1 - ss(0.37, 0.395, r)); d[i] = 4; d[i + 1] = 4; d[i + 2] = 8; d[i + 3] = 255 * a; } }
    S.c.setTransform(1, 0, 0, 1, 0, 0); S.c.putImageData(im, 0, 0); } };
  /* the saw's track, seen from above on the floor: a bolted bed plate (the land's metal), its slot, scuffs and oil, an end
     stop at each end (a block with a rubber buffer); v: '<length>h' or '<length>v' (tiles between the blade's two ends) */
  function field(K, S, fh, fm) { const P = S.P, e = 0.5 / P; S.lock();
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, a = fm(x, y, true); if (!(a > 0.003)) continue;
      const hx = (fh(x + e, y) - fh(x - e, y)) / (2 * e), hy = (fh(x, y + e) - fh(x, y - e)) / (2 * e), l = Math.hypot(hx, hy, 1); K.M0(); K.M.ao = 1; fm(x, y, false); K.shade(-hx / l, -hy / l, 1 / l); K.put(S, px, py, a); }
    S.unlock(); }
  DEF.rail = { box: v => { const L = parseFloat(v), hz = /h$/.test(v); return hz ? [-0.78, -0.5, L + 0.78, 0.36] : [-0.42, -0.95, 0.42, L + 0.9]; }, paint(K, S, v, L) { const len = parseFloat(v), hz = /h$/.test(v), { M } = K, c = S.c;
    const A = (x, y) => hz ? [x, y] : [y, x];   // (along, across)
    const HWD = 0.2, SL = 0.05, E0 = -0.62, E1 = len + 0.62;
    const sdf = (x, y) => { const [s, q] = A(x, y), dx = Math.max(E0 - s, s - E1, 0), dq = Math.abs(q) - HWD; return dx > 0 ? Math.hypot(dx, Math.max(dq, 0)) : dq; };
    const fh = (x, y) => { const [s, q] = A(x, y), aq = Math.abs(q); let h = 0.03 * ss(0, 0.03, -sdf(x, y)); if (aq < SL + 0.012) h -= 0.09 * ss(SL + 0.012, SL - 0.004, aq);
      const bs = ((s - 0.25) % 0.75 + 0.75) % 0.75 - 0.375, bd = Math.hypot(bs, aq - 0.142); if (bd < 0.032) h += 0.022 * Math.sqrt(1 - (bd / 0.032) ** 2); return h; };
    const fm = (x, y, cover) => { const sd = sdf(x, y); if (cover) return clamp(-sd * S.P + 0.5, 0, 1); const [s, q] = A(x, y), aq = Math.abs(q);
      if (aq < SL) { M.r = M.g = M.b = 0.006; M.rg = 0.95; M.ao = 0.15 + 0.25 * ss(0, SL, aq); return; }
      if (aq < SL + 0.035) { steelM(K, s * 3, q, 9, 0); M.mt = 1; M.fr = 0.9; M.fg = 0.91; M.fb = 0.93; M.rg = 0.16; M.er = M.eg = M.eb = 0.07; M.ao = 1; return; }   /* v443 SB (lead review): the rails either side of the groove, polished bright */
      trimM(K, L, s, q * 3, 1, 9, aq < SL + 0.02 ? 0.9 : 0.15); const sc = K.vn(s * 2 + 4, q * 60); if (aq < 0.12 && sc > 0.62) { M.rg *= 0.7; M.fr *= 1.1; M.fg *= 1.1; M.fb *= 1.1; }
      const oil = ss(0.62, 0.8, K.vn(s * 1.3 + 7, q * 4)); if (oil > 0) { M.r *= 1 - oil * 0.6; M.g *= 1 - oil * 0.6; M.b *= 1 - oil * 0.55; M.cc = oil * 0.7; }
      grime(K, L, s, q, 1, true); if (sd > -0.02) M.ao *= 0.8; };
    if (hz) K.contact(S, len / 2, 0.02, len / 2 + 0.9, 0.34, 0.4); else K.contact(S, 0, len / 2, 0.34, len / 2 + 0.9, 0.4);
    field(K, S, fh, fm);
    // the end stops: a block of the land's metal with a dark rubber buffer facing the blade
    const stop = (s, dir) => { const mat = (f, u, v2, ao, e) => { const buf = hz ? (u * dir > 0.05) : false; if (buf && f === 'f') { M.r = 0.035; M.g = 0.032; M.b = 0.03; M.rg = 0.85; return; } trimM(K, L, u * 2 + s, v2 * 2, ao, 11, e > 0.5 ? 0.8 : 0.2); grime(K, L, u, v2, ao, f === 't'); };
      if (hz) K.rbox(S, s, 0.17, 0.1, 0.17, 0, 0.17, 0.03, mat); else K.rbox(S, 0, s + 0.12, 0.2, 0.09, 0, 0.15, 0.03, mat); S.unlock(); };
    stop(-0.56, 1); stop(len + 0.56, -1);
    const rd = (LOOK[L] || LOOK.neutral).ink; K.ink(S, rd, 0.75); grainIn(K, S, 0.05); } };
  /* the spike plates, flat on the floor (0.84 tiles): v 'spikes' a riveted plate of the land's metal; 'icespikes' the same
     frosted over, its sockets rimed; 'thorns' a mat of woven root and bark, its sockets knot holes. Nine sockets 0.24 apart */
  DEF.plate = { box: () => [-0.5, -0.5, 0.5, 0.5], paint(K, S, v, L) { const { M } = K, ice = v === 'icespikes', thorn = v === 'thorns', HW = 0.41, RC = 0.08;
    const sdf = (x, y) => { const qx = Math.abs(x) - (HW - RC), qy = Math.abs(y) - (HW - RC); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - RC; };
    const hole = (x, y) => { const ix = Math.round(x / 0.24), iy = Math.round(y / 0.24); if (Math.abs(ix) > 1 || Math.abs(iy) > 1) return 9; return Math.hypot(x - ix * 0.24, y - iy * 0.24); };
    const fh = (x, y) => { const sd = sdf(x, y), d = hole(x, y); let h = 0.028 * ss(0, 0.035, -sd); if (!thorn && sd > -0.07 && sd < -0.035) h += 0.012; if (d < 0.1) { h += 0.018 * ss(0.1, 0.082, d) * ss(0.055, 0.075, d); h -= 0.07 * ss(0.068, 0.05, d); }
      if (thorn) h += 0.012 * (K.vn(x * 14 + y * 3, y * 4) - 0.5) + 0.01 * Math.sin((x * 0.4 + y) * 38 + K.vn(x * 5, y * 5) * 3);
      if (!thorn) { const rx = Math.abs(Math.abs(x) - 0.36), ry = Math.abs(Math.abs(y) - 0.36), rv = Math.min(Math.hypot(rx, ry), Math.hypot(rx, y), Math.hypot(x, ry)); if (rv < 0.024) h += 0.014 * Math.sqrt(1 - (rv / 0.024) ** 2); } return h; };
    const fm = (x, y, cover) => { const sd = sdf(x, y); if (cover) return clamp(-sd * S.P + 0.5, 0, 1); const d = hole(x, y);
      if (d < 0.055) { M.r = M.g = M.b = 0.01; M.rg = 1; M.ao = 0.2 + 0.6 * ss(0.02, 0.055, d); if (ice) { M.r = 0.05; M.g = 0.1; M.b = 0.14; } return; }
      if (thorn) { const f = K.vn(x * 4 + y * 22, y * 3) * 0.6 + K.vn(x * 31, y * 31) * 0.4; M.r = 0.22 * (0.7 + 0.5 * f); M.g = 0.15 * (0.7 + 0.5 * f); M.b = 0.08 * (0.7 + 0.5 * f); M.rg = 0.8;
        const m = ss(0.55, 0.78, K.vn(x * 6 + 3, y * 6)); M.r = lerp(M.r, 0.12, m); M.g = lerp(M.g, 0.26, m); M.b = lerp(M.b, 0.1, m); if (d < 0.09) { M.r *= 0.7; M.g *= 0.7; M.b *= 0.7; } }
      else { trimM(K, L, x * 2, y * 2, 1, 12, d < 0.09 || sd > -0.03 ? 0.7 : 0.15); grime(K, L, x, y, 1, true);
        if (ice) { const fr = ss(0.45, 0.72, K.vn(x * 9 + 2, y * 9) * 0.7 + (d < 0.11 ? 0.35 : 0) + K.vn(x * 37, y * 37) * 0.25); if (fr > 0) { M.mt *= 1 - fr; M.r = lerp(M.r, 0.78, fr); M.g = lerp(M.g, 0.9, fr); M.b = lerp(M.b, 0.98, fr); M.rg = lerp(M.rg, 0.42, fr); M.cc = fr * 0.7; } } }
      if (sd > -0.02) M.ao *= 0.8; };
    K.contact(S, 0, 0.04, 0.6, 0.6, 0.45); field(K, S, fh, fm); K.ink(S, (LOOK[L] || LOOK.neutral).ink, 0.45); grainIn(K, S, 0.05); } };
  /* a row of three spikes standing on their feet (x -0.24, 0, 0.24): steel cones with a bright point, ice shards, curved thorns */
  DEF.pins = { box: () => [-0.36, -0.46, 0.36, 0.06], paint(K, S, v, L) { const { M } = K, c = S.c;
    for (let i = -1; i <= 1; i++) { const x = i * 0.24, sd = i * 3.7 + 5;
      if (v === 'thorns') { K.tube(S, [[x, 0.01], [x - 0.012, -0.1], [x + 0.006, -0.22], [x + 0.05, -0.32], [x + 0.085, -0.37]], 0.042, 0.004, (t, s2, ao) => { const f = K.vn(t * 9 + sd, s2 * 3); M.r = lerp(0.3, 0.62, t) * (0.8 + 0.3 * f); M.g = lerp(0.24, 0.5, t) * (0.8 + 0.3 * f); M.b = lerp(0.1, 0.24, t); M.rg = 0.42; M.cc = 0.35; if (t < 0.25) { M.r = lerp(0.16, M.r, t * 4); M.g = lerp(0.26, M.g, t * 4); M.b = lerp(0.1, M.b, t * 4); } }); S.unlock(); continue; }
      if (v === 'icespikes') { K.rev(S, x, 0, h => 0.058 * Math.pow(1 - h / 0.4, 0.85) * (1 + 0.12 * Math.sin(h * 40 + sd)), 0, 0.4, { mat: (u, h, ao) => { const q = h / 0.4, f = K.vn(u * 30 + sd, h * 12); M.r = 0.5 + 0.3 * q; M.g = 0.78 + 0.16 * q; M.b = 0.92 + 0.06 * q; M.rg = 0.08 + 0.12 * f; M.cc = 1; M.sh = 0.7; M.er = 0.04 * q; M.eg = 0.12 * q; M.eb = 0.18 * q; if (((u * 14 + h * 3) % 1 + 1) % 1 < 0.08) M.ao *= 0.8; } }); S.unlock(); continue; }
      K.rev(S, x, 0, h => (h < 0.035 ? 0.064 : 0.052 * Math.pow(1 - (h - 0.035) / 0.335, 0.92)), 0, 0.37, { mat: (u, h, ao) => { if (h < 0.035) { trimM(K, L, u * 4, h, ao, 13, 0.4); return; } steelM(K, u * 3 + sd, h * 2, sd, 0); M.mt = 1; M.rg = lerp(0.34, 0.1, h / 0.37); M.fr = lerp(0.56, 0.82, h / 0.37); M.fg = lerp(0.58, 0.84, h / 0.37); M.fb = lerp(0.62, 0.88, h / 0.37); grime(K, L, u, h, ao, false); } }); S.unlock(); }
    K.ink(S, (LOOK[L] || LOOK.neutral).ink, 0.45); if (v !== 'thorns') for (let i = -1; i <= 1; i++) K.glint(c, i * 0.24 - 0.008, -0.33, 0.045, 0.5); } };

  /* ======================= the cache ======================= */
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  function paint(name, v, P, L) { const B = BP(); if (!B) return null; const K = B.kit, D = DEF[name]; if (!D) return null; const b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); if (D.flat) D.paint(K, S, v, L); else lit(K, L, () => { D.paint(K, S, v, L); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('TRAP_ART', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas, read back often, given back at once: a plain copy is kept)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  function sprite(name, v, P, L, force) { if (!DEF[name] || !BP()) return null; P = Math.max(8, Math.round(P)); L = LT[L] ? L : 'neutral'; const key = name + '|' + v + '|' + L + '|' + P; let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 10) { STATS.misses++; return null; }   // (a painting budget: what does not fit waits a frame, the old art drawn meanwhile)
    s = paint(name, v, P, L); if (s) { if (CACHE.size > 90) release(); CACHE.set(key, s); } return s; }
  /* the kit's grain (an overlay of fine noise), kept to what is painted: the kit's own fills the whole canvas (its pictures
     clip it), which would lay a faint square round a small picture */
  function grainIn(K, S, a) { const w = S.cv.width, h = S.cv.height, t = mkc(w, h), x = t.getContext('2d'); K.grain(x, 1, 'source-over'); x.globalCompositeOperation = 'destination-in'; x.drawImage(S.cv, 0, 0);
    const c = S.c; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'overlay'; c.globalAlpha = a; c.drawImage(t, 0, 0); c.restore(); t.width = t.height = 1; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  const PCAP = 96;   // (a picture's sharpness, px a tile, at most)
  function pxOf(c, T) { const m = c.getTransform ? c.getTransform() : null, dpr = Math.min(2, m ? Math.max(0.5, Math.hypot(m.a, m.b)) : 1); let P = Math.min(PCAP, qP(T * dpr)); if (BASE && P <= BASE * 1.1 && P >= BASE * 0.5) P = BASE; return P; }
  function release() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); G2.forEach(cv => { cv.width = cv.height = 1; }); G2.clear(); }
  const railKey = t => { const len = Math.hypot(t.x1 - t.x0, t.y1 - t.y0); return len.toFixed(2) + (Math.abs(t.x1 - t.x0) >= Math.abs(t.y1 - t.y0) ? 'h' : 'v'); };

  /* ======================= the engine's loot boxes, repainted through its prop cache ======================= */
  const OLD = {}, BOX = ['chest', 'crate', 'xbarrel', 'barrel', 'pot', 'urn'], EXT = { chest: [0.02, 0.72], crate: [0, 0.6], xbarrel: [0, 0.82], barrel: [0, 0.78], pot: [0, 0.66], urn: [0, 0.88] };
  let bioByObj = null; const bioName = B => { if (typeof BIOMES === 'undefined' || !B) return ''; if (!bioByObj) { bioByObj = new Map(); for (const k of Object.keys(BIOMES)) bioByObj.set(BIOMES[k], k); } return bioByObj.get(B) || ''; };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, X = (HAS_W && (window.PROP_EXT = window.PROP_EXT || {})) || {};
    for (const k of BOX) { if (!PR[k] || PR[k].__sb) continue; const old = OLD[k] = PR[k];
      /* (painted straight into the engine's picture: the prop cache keeps the only copy, and lets it go with the stage) */
      const f = function (c, P, v, B) { if (off() || !BP()) return old.apply(this, arguments); const s = paint(k, 0, Math.max(8, Math.min(PCAP * 1.25, Math.round(P))), lightOf(bioName(B))); if (!s) return old.apply(this, arguments); const q = P / s.P; c.drawImage(s.cv, -s.ax * q, -s.ay * q, s.cv.width * q, s.cv.height * q); s.cv.width = s.cv.height = 1; };
      f.__sb = 1; PR[k] = f; const E = X[k]; X[k] = E ? [Math.max(E[0], EXT[k][0]), Math.max(E[1], EXT[k][1])] : EXT[k]; }
    // (a break in their own materials: oak splinters and the metal of its bands; the explosive barrel's paint and hoops)
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) { const KD = BREAK_FX.KIND; KD.chest = { mat: 'wood', mix: 'iron' }; KD.crate = { mat: 'wood', mix: 'iron' }; KD.xbarrel = { mat: 'wood', mix: 'iron', hot: '#FF7A3D' }; KD.barrel = { mat: 'wood', mix: 'iron' }; }
  }
  install();
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__sb) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); BASE = 0; LIVE = new WeakMap(); BURSTS.length = 0; OPS.length = 0; } }; f.__sb = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();

  /* ======================= the live light ======================= (queued while drawn; laid once a frame by lay) */
  const OPS = []; let opsT = -1;
  const q = (gt, x, y, r, col, a, sy) => { if (gt !== opsT) { OPS.length = 0; opsT = gt; } if (a > 0.004 && r > 0.6 && OPS.length < 2400) OPS.push(x, y, r, col, a, sy || 1); };
  /* the painter's glow (FGFX Q.glow: light = colour x a x 0.6 x exp(-4.2 d^2), d the distance over its radius), as a 2D picture */
  const G2 = new Map();
  function glowPic(col) { let cv = G2.get(col); if (cv) return cv; cv = mkc(64, 64); const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32), n = parseInt(col.slice(1, 7), 16), r = n >> 16 & 255, gg = n >> 8 & 255, b = n & 255;
    for (let i = 0; i <= 12; i++) { const d = i / 12; g.addColorStop(d, `rgba(${r},${gg},${b},${(0.6 * Math.exp(-4.2 * d * d) * (1 - ss(0.9, 1, d))).toFixed(4)})`); } c.fillStyle = g; c.fillRect(0, 0, 64, 64); G2.set(col, cv); return cv; }
  let gpuF = null, gpuAt = -1e9;
  const gpuOK = () => { const t = now(); if (t - gpuAt > 500) { gpuAt = t; try { gpuF = !(HAS_W && (window.__DUN_GL === 0 || window.__TRAPART_GL === 0)) && !!(self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX && self.NIDHOGG_MOVES.FGFX.usable()); } catch (e) { gpuF = false; } } return gpuF; };
  /* once a frame, in the dungeon's own GPU pass Q (20b, before dqEnd): into it when the pass has light of its own (no copy is
     added), else from the 2D picture of the same falloff; nothing without the GPU painter */
  function lay(c, Q, sx, sy, T, gt) { burstsQueue(sx, sy, T, gt); if (gt !== opsT) { OPS.length = 0; return; } const n = OPS.length / 6; if (!n) return;
    if (!Q || !gpuOK() || off()) { OPS.length = 0; return; }
    if (Q.nl || Q.ns || Q.nwl || Q.nws) { for (let i = 0; i < OPS.length; i += 6) Q.glow(OPS[i], OPS[i + 1], OPS[i + 2], OPS[i + 3], OPS[i + 4], OPS[i + 5]); STATS.gpuOps += n; STATS.laidGPU++; }
    else { c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < OPS.length; i += 6) { const x = OPS[i], y = OPS[i + 1], r = OPS[i + 2], ry = r * OPS[i + 5]; c.globalAlpha = Math.min(1, OPS[i + 4]); c.drawImage(glowPic(OPS[i + 3]), x - r, y - ry, r * 2, ry * 2); }
      c.restore(); STATS.d2Ops += n; STATS.laid2D++; }
    OPS.length = 0; }

  /* ======================= the saw ======================= */
  let LIVE = new WeakMap();   // (each saw's sparks: cosmetic, its own dice, never the game's)
  function saw(c, t, sx, sy, T, gt, near, bio) { if (off() || !BP() || t.px == null) return false; const L = lightOf(bio), P = pxOf(c, T);
    const rail = sprite('rail', railKey(t), P, L), bl = sprite('blade', 1, P, L), sd = sprite('sheen', 1, P, L); if (!rail || !bl || !sd) return false;
    STATS.draws++; const f = T / P, hz = /h$/.test(railKey(t)), X0 = sx(t.x0), Y0 = sy(t.y0) + T * 0.06, bx = sx(t.px), by = sy(t.py) - T * 0.16, cut = sy(t.py) + T * 0.115;
    c.drawImage(rail.cv, X0 - rail.ax * f, Y0 - rail.ay * f, rail.cv.width * f, rail.cv.height * f);
    // the slot's mouth darkened under the blade, then the blade (turned, cut by the slot's lip), its fixed sheen and shade
    c.save(); c.beginPath(); c.rect(bx - T * 0.7, by - T * 0.7, T * 1.4, cut - (by - T * 0.7)); c.clip();
    c.translate(bx, by); c.rotate(t.spin || 0); c.drawImage(bl.cv, -bl.ax * f, -bl.ay * f, bl.cv.width * f, bl.cv.height * f); c.rotate(-(t.spin || 0));
    c.drawImage(sd.cv, -sd.ax * f, -sd.ay * f, sd.cv.width * f, sd.cv.height * f); c.restore();   /* v443 SB (lead review): no additive sheen over the disc */
    { const g = c.createLinearGradient(0, cut - T * 0.05, 0, cut + T * 0.02); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(bx - T * 0.42, cut - T * 0.05, T * 0.84, T * 0.07); }
    if (!gpuOK()) return true;
    // the live light: sparks from the bite (the blade turns clockwise: its foot runs left), the bite's glow, a trailing glow
    // while it glides, and the warning (the pet close): a red-orange glow round the teeth
    let S = LIVE.get(t); if (!S) { S = { t: gt, sp: [], acc: 0, R: R1(Math.round((t.x0 * 131 + t.y0 * 71) * 10) + 7), px: t.px, py: t.py, v: 0 }; LIVE.set(t, S); }
    const dt = clamp(gt - S.t, 0, 0.05); S.t = gt; const vx = dt > 0 ? (t.px - S.px) / dt : 0, vy = dt > 0 ? (t.py - S.py) / dt : 0; S.px = t.px; S.py = t.py; const spd = Math.hypot(vx, vy); S.v = lerp(S.v, spd, clamp(dt * 8, 0, 1));
    const lf = lowFx(), R = S.R; S.acc += dt * (lf ? 9 : 22) * (0.55 + 0.45 * clamp(S.v / 3, 0, 1));
    while (S.acc >= 1 && S.sp.length < (lf ? 10 : 26)) { S.acc -= 1; const a = Math.PI + 0.25 + R() * 0.9; S.sp.push({ x: t.px - 0.22 - R() * 0.1, y: t.py + 0.1, vx: Math.cos(a) * (3 + R() * 4) + vx * 0.4, vy: -Math.abs(Math.sin(a)) * (2.5 + R() * 3.5) - R() * 1.5 + vy * 0.4, life: 0.25 + R() * 0.3, t: 0 }); } if (S.acc > 1) S.acc = 1;
    for (let i = S.sp.length - 1; i >= 0; i--) { const p = S.sp[i]; p.t += dt; if (p.t >= p.life) { S.sp.splice(i, 1); continue; } p.vy += 14 * dt; p.x += p.vx * dt; p.y += p.vy * dt; const u = p.t / p.life, X = sx(p.x), Y = sy(p.y), k = 1 - u;
      q(gt, X, Y, T * 0.1 * (0.6 + 0.4 * k), '#FFB347', 0.55 * k); q(gt, X, Y, T * 0.035, '#FFF4D0', 0.9 * k); if (!lf) q(gt, X - p.vx * T * 0.012, Y - p.vy * T * 0.012, T * 0.05, '#FFD27A', 0.45 * k); }
    const fl = 0.75 + 0.25 * Math.sin(gt * 37 + t.x0);
    q(gt, bx - T * 0.2, cut - T * 0.02, T * 0.34, '#FFB060', 0.32 * fl, 0.6); q(gt, bx - T * 0.2, cut - T * 0.02, T * 0.12, '#FFF0C8', 0.45 * fl);
    const w = clamp(1 - ((near == null ? 9 : near) - 0.7) / 2.0, 0, 1); if (w > 0) { const pu = 0.8 + 0.2 * Math.sin(gt * 12); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + (t.spin || 0) * 0.15; if (by + Math.sin(a) * T * 0.5 > cut) continue; q(gt, bx + Math.cos(a) * T * 0.5, by + Math.sin(a) * T * 0.5, T * 0.22, '#FF5A3A', 0.32 * w * pu); } }   /* (the warning: the teeth glow, not the face) */
    return true; }

  /* ======================= the spike plates ======================= */
  const SPK_COL = { spikes: '#FF7A4D', icespikes: '#BFEFFF', thorns: '#9CFF7A' };
  function spikes(c, h, X, Y, T, gt, up, bio) { if (off() || !BP()) return false; const kind = h.kind === 'icespikes' || h.kind === 'thorns' ? h.kind : 'spikes', L = lightOf(bio), P = pxOf(c, T);
    const pl = sprite('plate', kind, P, L), pn = sprite('pins', kind, P, L); if (!pl || !pn) return false; STATS.draws++; const f = T / P;
    c.drawImage(pl.cv, X - pl.ax * f, Y - pl.ay * f, pl.cv.width * f, pl.cv.height * f);
    if (up > 0.01) for (let j = -1; j <= 1; j++) { const yb = Y + j * T * 0.24 + T * 0.012, k = Math.min(1, up); c.drawImage(pn.cv, X - pn.ax * f, yb - pn.ay * f * k, pn.cv.width * f, pn.cv.height * f * k); }
    if (!gpuOK()) return true;
    // the tell (glow only): the sockets kindle, the plate's light swells; as they strike, a flash on the points
    const col = SPK_COL[kind], warn = h.st === 'warn' && !(h.pop > 0);
    if (warn) { const pu = 0.65 + 0.35 * Math.sin(gt * 26 + (h.ph || 0)); q(gt, X, Y, T * 0.66, col, 0.3 * pu, 0.62); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) q(gt, X + i * T * 0.24, Y + j * T * 0.24, T * 0.14, col, 0.55 * pu); }
    else if (h.pop > 0.3) { const k = (h.pop - 0.3) / 0.15; q(gt, X, Y - T * 0.15, T * 0.7, col, 0.28 * k, 0.7); if (kind !== 'thorns') for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) q(gt, X + i * T * 0.24, Y + j * T * 0.24 - T * 0.33, T * 0.07, '#FFFFFF', 0.5 * k); }
    return true; }

  /* ======================= the loot boxes' light ======================= */
  const BURSTS = [];
  function pot(c, p, kind, X, Y, T, gt) { if (off() || !BP() || !gpuOK()) return; const chest = p.kind === 'chest';
    if (chest) { const br = 0.75 + 0.25 * Math.sin(gt * 1.9 + p.x * 3); q(gt, X, Y - T * 0.39, T * 0.58, '#FFC35A', 0.2 * br, 0.5); q(gt, X, Y - T * 0.38, T * 0.22, '#FFE9B0', 0.22 * br, 0.45); q(gt, X, Y + T * 0.02, T * 0.95, '#FFB347', 0.07 * br, 0.4);
      const tw = Math.pow(Math.max(0, Math.sin(gt * 1.3 + p.y * 5)), 24); if (tw > 0.03) q(gt, X - T * 0.05, Y - T * 0.45, T * 0.16, '#FFFFFF', 0.7 * tw); }
    if (p.flash > 0) q(gt, X, Y - T * 0.32, T * 0.62, chest ? '#FFD36B' : '#FFFFFF', Math.min(0.55, p.flash * 5.5)); }
  function hit(p) { if (off() || !p) return; if (p.kind === 'chest' && BURSTS.length < 24) BURSTS.push({ x: p.x, y: p.y + 0.3, kind: 'hit', t0: null, s: (p.x * 97 + p.y * 31) | 0 }); }
  function broke(p) { if (off() || !p) return; if (p.kind === 'chest' && BURSTS.length < 24) BURSTS.push({ x: p.x, y: p.y + 0.3, kind: 'chest', t0: null, s: (p.x * 131 + p.y * 17) | 0 }); }
  /* (the bursts' light, queued at lay: a chest struck throws a few gold glints; broken open, a gold flash and a fountain of
     gold motes, coins of light that arc out and fall; lowFx: half of them) */
  function burstsQueue(sx, sy, T, gt) { if (!BURSTS.length) return; if (off()) { BURSTS.length = 0; return; } const lf = lowFx();
    for (let i = BURSTS.length - 1; i >= 0; i--) { const b = BURSTS[i]; if (b.t0 == null) b.t0 = gt; const life = b.kind === 'chest' ? 1.4 : 0.45, u = (gt - b.t0) / life; if (u >= 1 || u < 0) { BURSTS.splice(i, 1); continue; }
      const X = sx(b.x), Y = sy(b.y), e = 1 - u, R = R1(b.s + 3), n = b.kind === 'chest' ? (lf ? 9 : 18) : (lf ? 3 : 6), tt = gt - b.t0;
      if (b.kind === 'chest') { q(gt, X, Y - T * 0.4, T * (0.9 + 1.4 * Math.sqrt(u)), '#FFD36B', 0.5 * e * e); q(gt, X, Y - T * 0.4, T * 0.4, '#FFFFFF', 0.45 * Math.max(0, 1 - u * 4)); q(gt, X, Y, T * 1.6, '#FFB347', 0.12 * e, 0.42); }
      for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (R() - 0.5) * (b.kind === 'chest' ? 2.2 : 3), v = (b.kind === 'chest' ? 3.2 : 2.2) * (0.5 + R()), l = (b.kind === 'chest' ? 0.7 : 0.3) + R() * 0.6; if (tt > l) continue;
        const x = b.x + Math.cos(a) * v * tt * 0.6, y = b.y - 0.4 + Math.sin(a) * v * tt + 4.5 * tt * tt, k2 = 1 - tt / l, tw = 0.6 + 0.4 * Math.sin(tt * 30 + k);
        q(gt, sx(x), sy(y), T * 0.11, '#FFD36B', 0.6 * k2 * tw); q(gt, sx(x), sy(y), T * 0.04, '#FFFBEA', 0.9 * k2 * tw); } } }

  /* ======================= the loading screen ======================= */
  /* P: { T (tile px), k (sharpness), traps, hazards, pots, bioAt(x, y) } -> jobs: every saw's track, the blades and sheens,
     every spike plate and its spikes, in their lands' lights (the boxes are warmed through the engine's prop cache) */
  function warm(P) { if (off() || !BP() || !P || !(P.T > 0)) return []; BASE = Math.min(PCAP, Math.round(P.T * (P.k || 1))); const jobs = [], seen = new Set(), job = (n, v, L) => { const key = n + '|' + v + '|' + L; if (seen.has(key)) return; seen.add(key); jobs.push(() => { try { sprite(n, v, BASE, L, true); } catch (e) {} }); };
    const bio = (x, y) => { try { return P.bioAt ? P.bioAt(x, y) : ''; } catch (e) { return ''; } };
    for (const t of P.traps || []) if (t.kind === 'saw' && t.x0 != null) { const L = lightOf(bio(t.x, t.y)); job('rail', railKey(t), L); job('blade', 1, L); job('sheen', 1, L); }
    for (const h of P.hazards || []) if (!h.area && (h.fam === 'spikes' || /spikes|thorns/.test(h.kind))) { const L = lightOf(bio(h.x, h.y)), k = h.kind === 'icespikes' || h.kind === 'thorns' ? h.kind : 'spikes'; job('plate', k, L); job('pins', k, L); }
    return jobs; }

  const API = { saw, spikes, pot, hit, broke, lay, warm, release, install, lightOf, OLD, DEF, LT, LOOK,
    on: () => !off() && !!BP(), tell: () => !off() && !!BP() && gpuOK() /* (a spike plate's tell is its glow: without the GPU painter the old circle stays) */, pic: (name, v, P, L) => sprite(name, v, P, L, true), railKey,
    get base() { return BASE; }, get stats() { return Object.assign({ cached: CACHE.size, px: [...CACHE.values()].reduce((a, s) => a + s.cv.width * s.cv.height, 0), glowPics: G2.size, bursts: BURSTS.length }, STATS); } };
  if (HAS_W) window.TRAP_ART = API;
  return API;
})();
