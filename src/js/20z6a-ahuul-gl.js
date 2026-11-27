/* ---------- (v470b AH) AHUUL THE WHITE HORIZON in three dimensions (Rift 05, the Pale Aurora's last boss: the Broad Summit) ----------
   Rebuilt from scratch (v470's model was a smooth tube with flat plates): the 2D Ahuul of 20z6-rift-fiend-aurora-3.js as a sculpted,
   textured and lit GPU model, the same creature (the sky whale hanging over the summit: a broad blunt skull, a navy back and a white
   belly and throat, five vents down each flank, two bands of seven green lights behind the jaw in place of eyes, a ridge of ice down
   its spine, two enormous fins tapering into three squared tips, the fluke, six thin tendrils under the chin), posed every frame on
   the fight's own spine (its build(): twenty-one frames from the snout to the tail stock, each its width and upper and lower heights),
   so it hangs exactly where its head's hit areas are and its fight is untouched.
   THE BODY: one dense hide (128 rings x 114 round it; 64 x 76 on the lighter level) rewritten every frame along a smooth curve through
   the spine's frames (C1 in the spine's own length, the profile tables eased, a rounded blunt snout, a closed tail stock pressed flat
   from the sides with a keel), sculpted: a flatter, broader crown over the skull, a low dorsal crest rising toward the tail, the
   mouth's long line cut in with a lip over it, fourteen throat pleats from the chin to the navel cut with real depth (the grid laid
   four vertices to a pleat so each groove is the same; they open out as it draws in the cold), the profile kept to the 2D's.
   Its hide (GLM 770, AH-AHU-MAT in 20k5uz, from the surface's own coordinates so it never swims): a mottled navy back with frost
   freckles and a few pale rake scars, a wavy countershaded border with white blotches up the flank and navy islands down the white,
   a white belly finely speckled, the pleats' grooves blue-grey; a wet clear coat over the back reflecting the night sky and the
   aurora's band; normal detail; the eye bands' sockets and the vents' light glowing up through the skin round them (subsurface),
   pulsing in a wave down each flank; the bared throat lit mint from inside, brightest down its grooves; aurora light drifting
   along the back; rime crust on the chin.
   ON THE HIDE (many copies of one small mesh, one draw each): tubercles in rows over the crown and along the lower jaw (770.2);
   barnacle clusters with rime shards on the chin, the snout, the fins' leading edges and tips and the fluke (774, 773.2); the five
   vents a side as lipped slits, a glowing core in each (776); the fourteen eye lights as lenses (775); the dorsal ridge as eleven
   clusters of faceted ice crystal (a tall crystal tilted tailward, two flanking shards, a small one before), light running along them
   head to tail, aurora green rising inside (773).
   THE FINS (771): each a closed airfoil surface over the 2D fin's outline (its leading and trailing edges, the three squared tips
   with notches between): thick and scalloped with tubercles along the leading edge, three bones running from the root into the three
   tips raised through the skin, thin membrane between them (light through it, fine veins), navy at the root to pale ice above, white
   beneath; bent by the fight's sweep (flex) and rippling at the trailing edge.
   THE FLUKE (772): a real fluke: two swept lobes from a thick root, pointed tips, a notch at the middle, a scalloped trailing edge,
   navy above, white with navy markings beneath; beating as the fight beats it, its trailing edge lagging the beat.
   THE TENDRILS (777): six translucent tubes from the chin, each a chain that trails behind the head as it moves (a rope following the
   2D's drifting pose), light pulses running down them to glowing tips (775), their glow trailing behind on the painter.
   LIGHT: one GPU pass in the summit's light (a moon-white key from the upper left, the night's navy above, the snow's light bounced up
   under it, the aurora's green rim from the sky behind); soft shadows and occlusion from six spheres posed along the body (the fins
   darken under it). The 2D's glow halos on the FGFX painter (no extra pass in a fight: laid in the boss's own light pass): round the
   head, at each eye light, each vent (pulsing), each tendril tip and its trail, the bared throat, the lifted fin's edge.
   LEVELS: full detail at High; Balanced, Performance and Fewer effects take the lighter level (fewer rings, pleats three vertices
   apart, fewer barnacles and tubercles), the pass at the quality's resolution. GPU buffers freed when the stage is let go (AUR3's
   release; every mesh lives in the model's MESH). Without WebGL (or on a software rasteriser, unless window.__AUR_GL), or without the
   painter, the 2D whale and its effects are drawn as before. window.__AH_LOD = 0 | 1 forces a level (tests). */
const AHUUL_GL = (() => {
  const A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3 } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const win = k => { try { return typeof window !== 'undefined' ? window[k] : undefined; } catch (e) { return undefined; } };
  const M_HIDE = 770, M_KNOB = 770.2, M_FIN = 771, M_FLUKE = 772, M_ICE = 773, M_RIME = 773.2, M_BARN = 774, M_BRIM = 774.2, M_BIN = 774.4, M_LENS = 775, M_VENT = 776, M_TEND = 777;
  const GREEN = '#78D7B2', GREEN_HI = '#B8F5DA', ICE_HI = '#CFE8F4', EMBER = '#FFC46B', WHITE = '#FFFFFF', MINT = '#7CFFC4';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.ahuul ? FIEND_DEFS.ahuul.RIG : null; } catch (e) { return null; } };
  const G = A.model('Ahuul', () => ({}));   // (the meshes are made per detail level on first use: set(L))
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const ss = x => { x = cl(x); return x * x * (3 - 2 * x); };
  const inFight = () => { try { return typeof arc !== 'undefined' && !!arc.game && arc.mode === 'dungeon'; } catch (e) { return false; } };
  const gqL = () => { try { return typeof GQ !== 'undefined' && inFight() ? GQ.level() : 0; } catch (e) { return 0; } };
  const gqK = () => { try { return typeof GQ !== 'undefined' && inFight() && GQ.glK ? GQ.glK() : 1; } catch (e) { return 1; } };
  const lodOf = () => { const f = win('__AH_LOD'); if (f === 0 || f === 1) return f; return lowFx() || gqL() >= 1 ? 1 : 0; };
  /* the two levels: rings along, the angle table round (coarse, the mouth's side, the pleats), fins (along x round), fluke, tendrils,
     how many barnacle clusters (body, each fin, each lobe), how much of the tubercles, crystal facets, lens segments */
  const CFG = [{ nu: 100, ac: 14, am: 9, ap: 56, fa: 46, fv: 38, ka: 56, kv: 20, tn: 18, tr: 7, crust: [14, 5, 2], knob: 0.4, xf: 6, ls: 10, vs: 16 },
    { nu: 56, ac: 8, am: 6, ap: 42, fa: 26, fv: 22, ka: 30, kv: 12, tn: 10, tr: 5, crust: [8, 3, 1], knob: 0.22, xf: 5, ls: 7, vs: 10 }];
  const NPL = 14;   // (the throat's pleats across its +-1 radian)
  const lin = (tab, s) => { if (s <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (s <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; return lerp(a[1], b[1], (s - a[0]) / (b[0] - a[0])); } return tab[tab.length - 1][1]; };
  // a monotone cubic through a table's points (Fritsch-Carlson): the 2D's profiles without their kinks
  function herm(tab, s) { const n = tab.length; if (s <= tab[0][0]) return tab[0][1]; if (s >= tab[n - 1][0]) return tab[n - 1][1]; let k = 0; while (k < n - 2 && tab[k + 1][0] < s) k++;
    const x0 = tab[k][0], x1 = tab[k + 1][0], y0 = tab[k][1], y1 = tab[k + 1][1], h = x1 - x0, t = (s - x0) / h, d = (y1 - y0) / h;
    const sl = i => i <= 0 ? (tab[1][1] - tab[0][1]) / (tab[1][0] - tab[0][0]) : i >= n - 1 ? (tab[n - 1][1] - tab[n - 2][1]) / (tab[n - 1][0] - tab[n - 2][0]) : (tab[i + 1][1] - tab[i - 1][1]) / (tab[i + 1][0] - tab[i - 1][0]);
    let m0 = sl(k), m1 = sl(k + 1); if (d === 0) m0 = m1 = 0; else { if (m0 * d < 0) m0 = 0; if (m1 * d < 0) m1 = 0; const al = m0 / d, be = m1 / d, r = al * al + be * be; if (r > 9) { const tau = 3 / Math.sqrt(r); m0 = tau * al * d; m1 = tau * be * d; } }
    const t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1; }
  // a table of n + 1 values 0..1 spaced by a density (more where it is higher)
  function table(n, dens) { const N = 2048, cdf = new Float64Array(N + 1); for (let i = 1; i <= N; i++) cdf[i] = cdf[i - 1] + dens((i - 0.5) / N); const out = new Float32Array(n + 1); let k = 0;
    for (let i = 0; i <= n; i++) { const tg = cdf[N] * i / n; while (k < N - 1 && cdf[k + 1] < tg) k++; out[i] = Math.min(1, (k + cl((tg - cdf[k]) / Math.max(1e-12, cdf[k + 1] - cdf[k]))) / N); } out[0] = 0; out[n] = 1; return out; }

  /* ---------- the body's shape ---------- */
  // the eased profiles (width, upper and lower heights along s), a rounded blunt snout, the tail stock pressed flat and closed
  const NP = 1024; let PROF = null;
  function profiles() { if (PROF) return PROF; const R0 = RIG(), PW = new Float32Array(NP + 1), PU = new Float32Array(NP + 1), PL = new Float32Array(NP + 1), S0 = 0.045;
    const f = (tab, s) => herm(tab, s), w0 = f(R0.WT, S0), u0 = f(R0.HUT, S0), l0 = f(R0.HLT, S0);
    for (let i = 0; i <= NP; i++) { const s = i / NP; let w, u, l; if (s < S0) { const k = Math.sqrt(Math.max(0, 1 - (1 - s / S0) * (1 - s / S0))); w = w0 * k; u = u0 * k; l = l0 * k; } else { w = f(R0.WT, s); u = f(R0.HUT, s); l = f(R0.HLT, s); }
      const tk = ss((s - 0.7) / 0.22); w *= 1 - 0.2 * tk; u *= 1 + 0.08 * tk; l *= 1 + 0.18 * tk;
      if (s > 0.972) { const k = Math.sqrt(Math.max(0, 1 - ((s - 0.972) / 0.028) ** 2)); w *= k; u *= k; l *= k; }
      PW[i] = w; PU[i] = u; PL[i] = l; }
    return (PROF = { PW, PU, PL }); }
  const pAt = (P, s) => { const x = cl(s) * NP, i = Math.min(NP - 1, Math.floor(x)), f = x - i; return P[i] + (P[i + 1] - P[i]) * f; };
  // the sculpt at (s, a) (a the angle round from the middle of the belly: 0 the belly, +-pi the back): the crown's squareness, the
  // fixed relief (the mouth cut in, its lip, the dorsal crest) and the pleats' relief (opened by the in-drawn breath)
  const RL = { sef: 1, dS: 0, dP: 0 };
  function relief(s, a) { const ph = a - Math.PI / 2, cp = Math.cos(ph), sp = Math.sin(ph); let sef = 1;
    if (sp > 0 && s < 0.24) { const n = 2 + 0.75 * (1 - ss((s - 0.05) / 0.17)); sef = Math.pow(Math.pow(Math.abs(cp), n) + Math.pow(sp, n), -1 / n); }
    const q = Math.atan2(sp, Math.abs(cp)); let dS = 0;
    { const me = ss((s - 0.004) / 0.016) * (1 - ss((s - 0.18) / 0.025)); if (me > 0) { const phm = -0.34 - Math.max(0, s - 0.15) * 9, dq = q - phm; dS += me * (-0.065 * Math.exp(-((dq / 0.028) ** 2)) + 0.03 * Math.exp(-(((dq - 0.065) / 0.045) ** 2)) + 0.012 * Math.exp(-(((dq + 0.06) / 0.04) ** 2))); } }
    { const cr = 0.09 * ss((s - 0.17) / 0.12) * (1 + 1.4 * ss((s - 0.65) / 0.3)) * (1 - ss((s - 0.95) / 0.04)), dt = Math.PI - Math.abs(a); if (cr > 0) dS += cr * Math.exp(-((dt / 0.2) ** 2)); }
    let dP = 0; { const pe = ss((s - 0.012) / 0.03) * (1 - ss((s - 0.3) / 0.12)) * (1 - ss((Math.abs(a) - 0.78) / 0.24)); if (pe > 0) { const f = (a + 1) * NPL / 2, g = 0.5 - 0.5 * Math.cos(TAU * f); dP = -0.075 * g * g * g * pe; } }
    RL.sef = sef; RL.dS = dS; RL.dP = dP; return RL; }
  // the angles round a ring: the coarse back, finer down the mouth's side, four (three) to a pleat across the throat; the seam on top
  function angles(C) { const seg = [[-Math.PI, -1.45, C.ac], [-1.45, -1.0, C.am], [-1.0, 1.0, C.ap], [1.0, 1.45, C.am], [1.45, Math.PI, C.ac]], out = [];
    for (const [a0, a1, n] of seg) for (let i = 0; i < n; i++) out.push(a0 + (a1 - a0) * i / n); out.push(Math.PI); return out; }

  /* ---------- the fins and the fluke: the 2D outlines split into their edges ---------- */
  const FIN_LE = [[0, -0.55], [0.1, -0.66], [0.3, -0.6], [0.55, -0.5], [0.78, -0.42], [0.9, -0.4], [1.06, -0.4]];
  const FIN_TE = [[0, 0.78], [0.14, 0.92], [0.36, 0.74], [0.62, 0.56], [0.86, 0.44], [0.975, 0.4], [1.06, 0.4]];
  const FIN_TIP = [[-0.4, 0.995], [-0.2, 0.995], [-0.135, 0.912], [-0.1, 1.045], [0.1, 1.045], [0.135, 0.922], [0.17, 0.975], [0.4, 0.975], [0.42, 0.88]];
  const BONE_R = [0.17, 0.3, 0.43], BONE_T = [0.14, 0.488, 0.835];   // (the three bones' places across the chord, at the root and at the tips)
  const boneW = (k, t) => lerp(BONE_R[k], BONE_T[k], ss(t));
  const FL_LE = [[0, -0.15], [0.7, 0.15], [1.7, 0.42], [2.7, 0.85], [3.25, 1.3]], FL_TE = [[0, 0.88], [0.75, 1.2], [1.7, 1.32], [2.75, 1.45], [3.25, 1.3]];
  const naca = w => 5 * (0.2969 * Math.sqrt(Math.max(0, w)) - 0.126 * w - 0.3516 * w * w + 0.2843 * w * w * w - 0.1036 * w * w * w * w);

  /* ---------- mesh making ---------- */
  // a grid (nu + 1 by nv + 1 vertices) whose points are written every frame; att(i, j) its fixed attributes
  function mkGrid(nu, nv, att, m) { const n1 = nu + 1, nvx = n1 * (nv + 1), pos = new Float32Array(nvx * 3), nrm = new Float32Array(nvx * 3), at = new Float32Array(nvx * 3), I = nvx > 65535 ? new Uint32Array(nu * nv * 6) : new Uint16Array(nu * nv * 6);
    let o = 0; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = att(i, j); at[o] = q[2] == null ? m : q[2]; at[o + 1] = q[0]; at[o + 2] = q[1]; nrm[o + 2] = 1; o += 3; }
    o = 0; for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * n1 + i; I[o++] = a; I[o++] = a + 1; I[o++] = a + n1 + 1; I[o++] = a; I[o++] = a + n1 + 1; I[o++] = a + n1; }
    return { pos, nrm, att: at, idx: I, nv: nvx, ntri: nu * nv * 2, gl: null, nu, nvv: nv, bb: [[0, 0, 0], 1] }; }
  // its normals from the grid (j wrapping round: a closed section), turned the way flip says
  function gridNormals(M, flip) { const nu = M.nu, nv = M.nvv, n1 = nu + 1, P = M.pos, N = M.nrm;
    for (let j = 0; j <= nv; j++) { const jp = j === nv ? 1 : j + 1, jm = j === 0 ? nv - 1 : j - 1;
      for (let i = 0; i <= nu; i++) { const ip = Math.min(nu, i + 1), im = Math.max(0, i - 1), a = (j * n1 + ip) * 3, b = (j * n1 + im) * 3, c = (jp * n1 + i) * 3, d = (jm * n1 + i) * 3, o = (j * n1 + i) * 3;
        const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (l < 1e-9) continue; const k = (flip ? -1 : 1) / l; N[o] = nx * k; N[o + 1] = ny * k; N[o + 2] = nz * k; } } }
  // which way a grid's normals face at one vertex, against a direction that should be outward there
  function faceSign(M, i, j, out) { const nu = M.nu, nv = M.nvv, n1 = nu + 1, P = M.pos, ip = Math.min(nu, i + 1), im = Math.max(0, i - 1), jp = j === nv ? 1 : j + 1, jm = j === 0 ? nv - 1 : j - 1, a = (j * n1 + ip) * 3, b = (j * n1 + im) * 3, c = (jp * n1 + i) * 3, d = (jm * n1 + i) * 3;
    const u = [P[a] - P[b], P[a + 1] - P[b + 1], P[a + 2] - P[b + 2]], v = [P[c] - P[d], P[c + 1] - P[d + 1], P[c + 2] - P[d + 2]]; return vdot(vcross(u, v), out) < 0; }
  // many copies (k) of one small mesh; each copy's third attribute carries its index (4 k + its own value)
  function copies(base, n) { const M = K.multi(base, n), nv = base.nv; for (let k = 0; k < n; k++) for (let i = 0; i < nv; i++) M.att[(k * nv + i) * 3 + 2] = k * 4 + base.att[i * 3 + 2]; for (let i = 0; i < M.pos.length; i++) M.pos[i] = 0; M.bb = [[0, 0, 0], 1]; return M; }
  // a seeded random
  const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

  /* the meshes of one level (made once, on first use; kept in the model's MESH as '<part><level>' so letting go frees them all) */
  const SETS = [null, null];
  function set(L) { if (SETS[L] && G.MESH && G.MESH['body' + L]) return SETS[L]; const t0 = nowMs(), C = CFG[L], R0 = RIG(), out = {}, prof = profiles();
    // the hide
    const sT = table(C.nu, s => 0.55 + 2.4 * Math.exp(-(((s - 0.02) / 0.1) ** 2)) + 0.9 * Math.exp(-(((s - 0.3) / 0.15) ** 2)) + 1.5 * Math.exp(-(((s - 1) / 0.03) ** 2))), aT = angles(C), NV = aT.length - 1;
    const body = mkGrid(C.nu, NV, (i, j) => [(aT[j] + Math.PI) / TAU, sT[i]], M_HIDE), nb = (C.nu + 1) * (NV + 1), SEF = new Float32Array(nb), DS = new Float32Array(nb), DPL = new Float32Array(nb), CA = new Float32Array(NV + 1), SA = new Float32Array(NV + 1);
    for (let j = 0; j <= NV; j++) { CA[j] = Math.cos(aT[j] - Math.PI / 2); SA[j] = Math.sin(aT[j] - Math.PI / 2); }
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= C.nu; i++) { const r = relief(sT[i], aT[j]), o = j * (C.nu + 1) + i; SEF[o] = r.sef; DS[o] = r.dS; DPL[o] = r.dP; }
    out['body' + L] = body;
    // a fin: a closed airfoil surface (i along, j round its section from the leading edge over the top and back under)
    const FA = C.fa, FV = C.fv, nf1 = (FA + 1) * (FV + 1), FT = new Float32Array(nf1), FY = new Float32Array(nf1), FZ = new Float32Array(nf1), FW = new Float32Array(nf1);
    for (let j = 0; j <= FV; j++) for (let i = 0; i <= FA; i++) { const a = i / FA, v = j / FV, w = 0.5 - 0.5 * Math.cos(TAU * v), sg = v <= 0.5 ? 1 : -1, o = j * (FA + 1) + i;
      const te = lin(FIN_TIP, lerp(-0.4, 0.42, w)), t = a * te, tub = 0.032 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 10)), 2) * ss((t - 0.12) / 0.08) * (1 - ss((t - 0.88) / 0.08));
      const qL = herm(FIN_LE, t) - tub, qT = herm(FIN_TE, t), q = lerp(qL, qT, w), ch = (qT - qL) * R0.CF * (1 - 0.12 * t), tc = lerp(0.2, 0.085, Math.min(1, t));
      let bb = 0; for (let k = 0; k < 3; k++) bb = Math.max(bb, Math.exp(-(((w - boneW(k, t)) / 0.05) ** 2))); bb *= 0.05 * (1 - 0.45 * Math.min(1, t)) * ss((t - 0.02) / 0.1);
      let h = naca(w) * tc * ch * (1 - 0.3 * ss((w - 0.5) / 0.4)) + bb * Math.sin(Math.PI * Math.min(1, w * 1.05)); if (a > 0.9) h *= Math.sqrt(Math.max(0, 1 - ((a - 0.9) / 0.1) ** 2));
      FT[o] = t; FY[o] = q * R0.CF * (1 - 0.12 * t); FZ[o] = sg * h; FW[o] = w; }
    for (const sd of [-1, 1]) out['fin' + (sd > 0 ? 'E' : 'W') + L] = mkGrid(FA, FV, (i, j) => [j / FV, FT[j * (FA + 1) + i]], M_FIN);
    // the fluke: across its span (i, the left tip to the right), round its section (j)
    const KA = C.ka, KV = C.kv, nk1 = (KA + 1) * (KV + 1), KX = new Float32Array(nk1), KY = new Float32Array(nk1), KZ = new Float32Array(nk1), KC = new Float32Array(nk1);
    for (let j = 0; j <= KV; j++) for (let i = 0; i <= KA; i++) { const xa = -1 + 2 * i / KA, v = j / KV, w = 0.5 - 0.5 * Math.cos(TAU * v), sg = v <= 0.5 ? 1 : -1, o = j * (KA + 1) + i, X = 3.25 * xa, ax = Math.abs(X);
      const yL = herm(FL_LE, ax), yT = herm(FL_TE, ax) + 0.035 * (0.5 + 0.5 * Math.cos(ax * 10)) * ss((ax - 0.35) / 0.5) * (1 - ss((ax - 2.85) / 0.3)), chd = Math.max(0, yT - yL), y = lerp(yL, yT, w);
      const tc = lerp(0.15, 0.07, ax / 3.25), bulge = 0.2 * Math.exp(-((X / 0.5) ** 2)) * Math.sqrt(Math.max(0, w)) * Math.pow(1 - w, 1.5) / 0.21;
      KX[o] = X; KY[o] = y; KZ[o] = sg * (naca(w) * tc * chd + bulge); KC[o] = w * chd; }
    out['fluke' + L] = mkGrid(KA, KV, (i, j) => [j / KV, i / KA], M_FLUKE);
    // the six tendrils: one mesh, six tubes (i along, j round), the third attribute 4 x its index + its place along
    { const TN = C.tn, TR = C.tr, per = (TN + 1) * (TR + 1), n = per * 6, pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), at = new Float32Array(n * 3), I = new Uint16Array(TN * TR * 6 * 6); let o = 0, q = 0;
      for (let k = 0; k < 6; k++) { for (let j = 0; j <= TR; j++) for (let i = 0; i <= TN; i++) { at[o] = M_TEND; at[o + 1] = j / TR; at[o + 2] = k * 4 + i / TN; o += 3; }
        const b = k * per; for (let j = 0; j < TR; j++) for (let i = 0; i < TN; i++) { const a = b + j * (TN + 1) + i; I[q++] = a; I[q++] = a + 1; I[q++] = a + TN + 2; I[q++] = a; I[q++] = a + TN + 2; I[q++] = a + TN + 1; } }
      out['tend' + L] = { pos, nrm, att: at, idx: I, nv: n, ntri: TN * TR * 12, gl: null, bb: [[0, 0, 0], 1], TN, TR }; }
    // the ridge: a cluster of faceted ice (x tailward along the spine, y across, z up out of the back)
    { const B = GLM.builder(1), xf = C.xf; B.crystal([-0.05, 0, -0.25], [0.42, 0, 1.0], 0.36, M_ICE, { n: xf + 1, belly: 0.3, seed: 1, jit: 0.18, base: 0.8, thin: 0.75 });
      B.crystal([0.05, 0.2, -0.2], [0.34, 0.5, 0.56], 0.17, M_ICE, { n: xf, belly: 0.35, seed: 2, jit: 0.25 }); B.crystal([0.1, -0.2, -0.2], [0.4, -0.46, 0.48], 0.15, M_ICE, { n: xf, belly: 0.35, seed: 3, jit: 0.25 });
      B.crystal([-0.28, 0.02, -0.15], [-0.16, 0.05, 0.3], 0.08, M_ICE, { n: Math.max(4, xf - 1), belly: 0.4, seed: 4 }); out['ridge' + L] = copies(B.done(), 11); }
    // a barnacle cluster with rime shards (z out of the hide): three volcano-shaped shells (774 outside, .2 the rim, .4 inside)
    { const B = GLM.builder(1), ns = L ? 5 : 7, shell = (cx, cy, r, hgt) => { const prof = [[1, 0, M_BARN], [0.92, 0.45, M_BARN], [0.62, 0.9, M_BARN], [0.5, 1.0, M_BRIM], [0.38, 0.92, M_BIN], [0.22, 0.55, M_BIN]];
        B.surf((u, v) => { const k = Math.min(prof.length - 1, Math.round(v * (prof.length - 1))), p = prof[k], th = u * TAU, wob = 1 + 0.08 * Math.sin(th * 6); return [cx + Math.cos(th) * p[0] * r * wob, cy + Math.sin(th) * p[0] * r * wob, p[1] * hgt]; }, ns, prof.length - 1,
          (u, v) => prof[Math.min(prof.length - 1, Math.round(v * (prof.length - 1)))][2], { e: (u, v) => v, a: u => u }); };
      shell(0, 0, 0.5, 0.42); shell(0.62, 0.25, 0.34, 0.3); shell(-0.35, 0.55, 0.28, 0.24);
      B.crystal([-0.42, -0.3, 0], [-0.52, -0.42, 0.34], 0.13, M_RIME, { n: 4, seed: 5 }); B.crystal([0.5, -0.32, 0], [0.6, -0.36, 0.28], 0.11, M_RIME, { n: 4, seed: 6 }); if (!L) B.crystal([-0.1, 0.72, 0], [-0.08, 0.84, 0.24], 0.09, M_RIME, { n: 3, seed: 7 });
      const nc = C.crust[0] + C.crust[1] * 2 + C.crust[2] * 2; out['crust' + L] = copies(B.done(), nc); }
    // a tubercle: a low dome (e its height)
    { const B = GLM.builder(1), ns = L ? 6 : 9; B.surf((u, v) => { const th = u * TAU, r = Math.cos(v * Math.PI / 2); return [Math.cos(th) * r, Math.sin(th) * r, Math.sin(v * Math.PI / 2)]; }, ns, 3, () => M_KNOB, { e: (u, v) => v, a: u => u });
      out['knob' + L] = copies(B.done(), knobList(L).length); }
    // a vent: a lipped slit (x along it, y across; e 0 its core .. 1 its outer edge where it meets the hide)
    { const B = GLM.builder(1), PR = [[0, -0.45], [0.3, -0.4], [0.55, -0.15], [0.66, 0.35], [0.8, 0.42], [0.92, 0.0], [1, -0.6]];
      B.surf((u, v) => { const th = u * TAU, k = Math.round(v * (PR.length - 1)), p = PR[k]; return [Math.cos(th) * p[0] * 0.5, Math.sin(th) * p[0] * 0.5, p[1]]; }, C.vs, PR.length - 1, () => M_VENT, { e: (u, v) => PR[Math.round(v * (PR.length - 1))][0], a: u => u });
      out['vents' + L] = copies(B.done(), 10); }
    // the lenses: fourteen eye lights, six tendril tips
    { const B = GLM.builder(1); B.sph([0, 0, 0], 1, M_LENS, C.ls); out['lens' + L] = copies(B.done(), 20); }
    Object.assign(G.MESH, out);
    SETS[L] = { jSide: aT.findIndex(a => a > -Math.PI / 2), C, sT, aT, NV, SEF, DS, DPL, CA, SA, FT, FY, FZ, FW, KX, KY, KZ, KC, ms: nowMs() - t0, crustAt: crustList(L), knobAt: knobList(L) };
    return SETS[L]; }
  // where the barnacle clusters sit: [where ('b' body (s, a), 'f' a fin (side, t, w), 'k' the fluke (x, chord share)), ..., size, turn]
  function crustList(L) { const C = CFG[L], R = rng(4711 + L), out = [];
    for (let i = 0; i < C.crust[0]; i++) { const top = i % 5 === 4, s = top ? 0.008 + R() * 0.045 : 0.006 + R() * 0.085, a = top ? (R() < 0.5 ? -1 : 1) * (2.5 + R() * 0.6) : (R() * 2 - 1) * (s < 0.03 ? 2.2 : 1.35); out.push(['b', s, a, 0.13 + R() * 0.1, R() * TAU]); }
    for (const sd of [-1, 1]) for (let i = 0; i < C.crust[1]; i++) { const last = i === C.crust[1] - 1; out.push(['f', sd, last ? 0.9 + R() * 0.05 : 0.18 + (i + R() * 0.6) / Math.max(1, C.crust[1] - 1) * 0.7, last ? 0.08 + R() * 0.1 : 0.02 + R() * 0.05, 0.14 + R() * 0.08, R() * TAU]); }
    for (const sd of [-1, 1]) for (let i = 0; i < C.crust[2]; i++) out.push(['k', sd * (i === 0 ? 2.75 + R() * 0.25 : 1.2 + R() * 1.2), i === 0 ? 0.5 : 0.75 + R() * 0.2, 0.12 + R() * 0.06, R() * TAU]);
    return out; }
  // the tubercles: rows over the crown and along the lower jaw [s, a, radius]
  const KNOBS = [[], []];
  function knobList(L) { if (KNOBS[L].length) return KNOBS[L]; const R = rng(9001), k = CFG[L].knob, out = [];
    for (const da of [0, 0.3, -0.3, 0.58, -0.58]) for (let s = 0.016; s < 0.12; s += 0.019) { if (R() > k) continue; out.push([s + (R() - 0.5) * 0.006, Math.PI - da * (1 + 0.6 * s) + (R() - 0.5) * 0.05, 0.11 + R() * 0.06]); }
    for (const sg of [-1, 1]) for (let s = 0.035; s < 0.165; s += 0.022) { if (R() > k) continue; const phm = -0.34 - Math.max(0, s - 0.15) * 9, q = phm - 0.11, ph = sg > 0 ? q : Math.PI - q; out.push([s, ph + Math.PI / 2, 0.09 + R() * 0.04]); }
    for (const o of out) { o[1] = ((o[1] + Math.PI) % TAU + TAU) % TAU - Math.PI; } return (KNOBS[L] = out); }

  /* ---------- posing: everything written in the fight's world, relative to the head's point (ox, oy) ---------- */
  const SP = { k: [], m: [], rw: [], ru: [], rl: [] };
  function prepSpine(G2) { const F = G2.frs, n = F.length, R0 = RIG(); SP.F = F; SP.n = n;
    for (let k = 0; k < n; k++) { const a = F[Math.max(0, k - 1)], b = F[Math.min(n - 1, k + 1)], ds = Math.max(1e-6, b.s - a.s); SP.m[k] = [(b.c[0] - a.c[0]) / ds, (b.c[1] - a.c[1]) / ds, (b.c[2] - a.c[2]) / ds];
      const lw = lin(R0.WT, F[k].s), lu = lin(R0.HUT, F[k].s), ll = lin(R0.HLT, F[k].s); SP.rw[k] = lw > 1e-4 ? F[k].w / lw : null; SP.ru[k] = lu > 1e-4 ? F[k].hU / lu : null; SP.rl[k] = ll > 1e-4 ? F[k].hL / ll : null; }
    for (const key of ['rw', 'ru', 'rl']) { const r = SP[key]; for (let k = 0; k < n; k++) if (r[k] == null) r[k] = r[k + 1] != null ? r[k + 1] : 1; } }
  const SS = { c: [0, 0, 0], d: [0, 0, 0], v: [0, 0, 0], u: [0, 0, 0], w: 0, hU: 0, hL: 0 };
  function spineAt(s, ox, oy, O) { O = O || SS; const F = SP.F, n = SP.n; let k = 0; while (k < n - 2 && F[k + 1].s < s) k++;
    const A0 = F[k], B0 = F[k + 1], ds = Math.max(1e-6, B0.s - A0.s), t = cl((s - A0.s) / ds), t2 = t * t, t3 = t2 * t, ma = SP.m[k], mb = SP.m[k + 1];
    const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2, g00 = 6 * t2 - 6 * t, g10 = 3 * t2 - 4 * t + 1, g01 = -g00, g11 = 3 * t2 - 2 * t;
    for (let i = 0; i < 3; i++) { O.c[i] = h00 * A0.c[i] + h10 * ds * ma[i] + h01 * B0.c[i] + h11 * ds * mb[i]; O.d[i] = (g00 * A0.c[i] + g10 * ds * ma[i] + g01 * B0.c[i] + g11 * ds * mb[i]) / ds; }
    O.c[0] -= ox; O.c[1] -= oy; let l = Math.hypot(O.d[0], O.d[1], O.d[2]); if (l < 1e-6) { O.d[0] = A0.d[0]; O.d[1] = A0.d[1]; O.d[2] = A0.d[2]; l = 1; } O.d[0] /= l; O.d[1] /= l; O.d[2] /= l;
    let vx = lerp(A0.v[0], B0.v[0], t), vy = lerp(A0.v[1], B0.v[1], t), vz = lerp(A0.v[2], B0.v[2], t); const dv = vx * O.d[0] + vy * O.d[1] + vz * O.d[2]; vx -= O.d[0] * dv; vy -= O.d[1] * dv; vz -= O.d[2] * dv; l = Math.hypot(vx, vy, vz) || 1;
    O.v[0] = vx / l; O.v[1] = vy / l; O.v[2] = vz / l; O.u[0] = O.d[1] * O.v[2] - O.d[2] * O.v[1]; O.u[1] = O.d[2] * O.v[0] - O.d[0] * O.v[2]; O.u[2] = O.d[0] * O.v[1] - O.d[1] * O.v[0];
    const e = t * t * (3 - 2 * t), P = PROF; O.w = pAt(P.PW, s) * lerp(SP.rw[k], SP.rw[k + 1], e); O.hU = pAt(P.PU, s) * lerp(SP.ru[k], SP.ru[k + 1], e); O.hL = pAt(P.PL, s) * lerp(SP.rl[k], SP.rl[k + 1], e); return O; }
  // a point on the hide at (s, a) and its outward normal (from two neighbours): for the things set on it
  const SQ = { c: [0, 0, 0], d: [0, 0, 0], v: [0, 0, 0], u: [0, 0, 0] };
  function hideAt(s, a, ox, oy, kp, out) { const S = spineAt(s, ox, oy, SQ), r = relief(s, a), ph = a - Math.PI / 2, cp = Math.cos(ph) * r.sef, sp = Math.sin(ph) * r.sef, h = sp > 0 ? S.hU : S.hL, w = Math.max(0.05, S.w), hh = Math.max(0.05, h);
    const ne = vnrm([S.v[0] * Math.cos(ph) / w + S.u[0] * Math.sin(ph) / hh, S.v[1] * Math.cos(ph) / w + S.u[1] * Math.sin(ph) / hh, S.v[2] * Math.cos(ph) / w + S.u[2] * Math.sin(ph) / hh]), dr = r.dS + r.dP * kp + (out || 0);
    return { p: [S.c[0] + S.v[0] * cp * S.w + S.u[0] * sp * h + ne[0] * dr, S.c[1] + S.v[1] * cp * S.w + S.u[1] * sp * h + ne[1] * dr, S.c[2] + S.v[2] * cp * S.w + S.u[2] * sp * h + ne[2] * dr], n: ne, d: S.d.slice() }; }
  function frameN(n, d) { const z = vnrm(n); let x = vsub(d, vmul(z, vdot(d, z))); if (vlen(x) < 1e-5) x = Math.abs(z[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; x = vnrm(vsub(x, vmul(z, vdot(x, z)))); return M3(x, vcross(z, x), z); }
  const rot2 = (R, th) => { const c = Math.cos(th), s = Math.sin(th); return M3(vadd(vmul(R.x, c), vmul(R.y, s)), vsub(vmul(R.y, c), vmul(R.x, s)), R.z); };

  /* everything posed for one frame: the meshes written, the box round them, the occluders, the halos' places; o: { flash, dead, live } */
  const BB = [0, 0, 0, 0], OCC = new Float32Array(48), I3K = M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const boxPt = (p, r) => { const x = p[0], sy = p[1] - p[2]; if (x - r < BB[0]) BB[0] = x - r; if (x + r > BB[2]) BB[2] = x + r; if (sy - r < BB[1]) BB[1] = sy - r; if (sy + r > BB[3]) BB[3] = sy + r; };
  // the hide's points along the spine (its normals from the grid; the snout's and the tail's poles along the spine); the box round each ring
  function writeBody(body, S, C, ox, oy, kp) { const nu = C.nu, NV = S.NV, n1 = nu + 1, PB = body.pos, NB = body.nrm, CA = S.CA, SA = S.SA, SEF = S.SEF, DS = S.DS, DPL = S.DPL, sT = S.sT, RC = RCB;
    for (let i = 0; i <= nu; i++) { const Sp = spineAt(sT[i], ox, oy), c = Sp.c, v = Sp.v, u = Sp.u, d = Sp.d, w = Sp.w, hU = Sp.hU, hL = Sp.hL, iw = 1 / Math.max(0.05, w), iu = 1 / Math.max(0.05, hU), il = 1 / Math.max(0.05, hL);
      const cx = c[0], cy = c[1], cz = c[2], v0 = v[0], v1 = v[1], v2 = v[2], u0 = u[0], u1 = u[1], u2 = u[2]; RC[i * 6] = cx; RC[i * 6 + 1] = cy; RC[i * 6 + 2] = cz; RC[i * 6 + 3] = d[0]; RC[i * 6 + 4] = d[1]; RC[i * 6 + 5] = d[2];
      const rr = Math.max(w, hU, hL) * 1.25 + 0.3, sy = cy - cz; if (cx - rr < BB[0]) BB[0] = cx - rr; if (cx + rr > BB[2]) BB[2] = cx + rr; if (sy - rr * 1.42 < BB[1]) BB[1] = sy - rr * 1.42; if (sy + rr * 1.42 > BB[3]) BB[3] = sy + rr * 1.42;
      for (let j = 0; j <= NV; j++) { const o2 = j * n1 + i, ca = CA[j], sa = SA[j], sef = SEF[o2], up = sa > 0, h = up ? hU : hL, a1 = ca * iw, b1 = sa * (up ? iu : il), cw = ca * sef * w, sh = sa * sef * h;
        const nx = v0 * a1 + u0 * b1, ny = v1 * a1 + u1 * b1, nz = v2 * a1 + u2 * b1, dr = (DS[o2] + DPL[o2] * kp) / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1), o3 = o2 * 3;
        PB[o3] = cx + v0 * cw + u0 * sh + nx * dr; PB[o3 + 1] = cy + v1 * cw + u1 * sh + ny * dr; PB[o3 + 2] = cz + v2 * cw + u2 * sh + nz * dr; } }
    const im = nu >> 1, jt = S.jSide, o2 = (jt * n1 + im) * 3; gridNormals(body, faceSign(body, im, jt, [PB[o2] - RC[im * 6], PB[o2 + 1] - RC[im * 6 + 1], PB[o2 + 2] - RC[im * 6 + 2]]));
    for (let e = 0; e < 2; e++) { const i = e ? nu : 0, sg = e ? 1 : -1; for (let j = 0; j <= NV; j++) { const o3 = (j * n1 + i) * 3; NB[o3] = RC[i * 6 + 3] * sg; NB[o3 + 1] = RC[i * 6 + 4] * sg; NB[o3 + 2] = RC[i * 6 + 5] * sg; } } }   // (the snout's and the tail's poles)
  const RCB = new Float32Array(6 * 160);
  // a fin's points: its root's frame, bent by the sweep (flex), its trailing edge rippling
  function writeFin(Mf, Fn, S, C, R0, P, bt, sd, ox, oy) { const PF = Mf.pos, FT = S.FT, FY = S.FY, FZ = S.FZ, FW = S.FW, n = FT.length, r0 = Fn.root[0] - ox, r1 = Fn.root[1] - oy, r2 = Fn.root[2], ax = Fn.a, chd = Fn.ch, nf = Fn.nf, fx = P.flex || 0, fl = 0.06 * Math.sin(bt * 2.6 + sd), LF = R0.LF;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let k = 0; k < n; k++) { const t = FT[k], y = FY[k], w = FW[k], z = FZ[k] + fx * t * t * 2.2 + fl * w * w * t * Math.sin(bt * 2.6 - t * 5 + w * 2) * 1.6, xl = t * LF;
      const X = r0 + ax[0] * xl + chd[0] * y + nf[0] * z, Y = r1 + ax[1] * xl + chd[1] * y + nf[1] * z, Z = r2 + ax[2] * xl + chd[2] * y + nf[2] * z, k3 = k * 3; PF[k3] = X; PF[k3 + 1] = Y; PF[k3 + 2] = Z;
      if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y - Z < y0) y0 = Y - Z; if (Y - Z > y1) y1 = Y - Z; }
    if (x0 < BB[0]) BB[0] = x0; if (x1 > BB[2]) BB[2] = x1; if (y0 < BB[1]) BB[1] = y0; if (y1 > BB[3]) BB[3] = y1;
    gridNormals(Mf, faceSign(Mf, C.fa >> 1, C.fv >> 2, nf)); K.commit(Mf); return { ro: [r0, r1, r2], ax, chd, nf, fx, fl }; }
  // the fluke's points: beating as the fight beats it, its trailing edge lagging, its span curling
  function writeFluke(Mk, G2, S, C, bt, ox, oy) { const Fe = G2.frs[G2.frs.length - 1], ph = bt * 0.72 - 4.6, beat = 0.4 * Math.sin(ph), bv = Math.cos(ph), side = Fe.v, dd = vnrm(vadd(vmul(Fe.d, Math.cos(beat)), vmul(Fe.u, Math.sin(beat))));
    let n = vnrm(vcross(side, dd)); if (vdot(n, Fe.u) < 0) n = vmul(n, -1); const o2 = [Fe.c[0] - ox, Fe.c[1] - oy, Fe.c[2]], PK = Mk.pos, curl = 0.06 * Math.sin(ph), KX = S.KX, KY = S.KY, KZ = S.KZ, KC = S.KC;
    for (let k = 0; k < KX.length; k++) { const X = KX[k], y = KY[k], wc = KC[k], z = KZ[k] - bv * 0.16 * wc * wc + curl * X * X / 10.6, k3 = k * 3; PK[k3] = o2[0] + side[0] * X + dd[0] * y + n[0] * z; PK[k3 + 1] = o2[1] + side[1] * X + dd[1] * y + n[1] * z; PK[k3 + 2] = o2[2] + side[2] * X + dd[2] * y + n[2] * z; }
    boxPt(o2, 4.2); gridNormals(Mk, faceSign(Mk, C.ka >> 2, C.kv >> 2, n)); K.commit(Mk); return { o2, side, dd, n, bv, curl }; }
  // a tendril's tube along its chain (a Catmull-Rom curve through its six points, its frames carried along it), normals straight out
  const TP = new Float32Array(3 * 64), TF = new Float32Array(6 * 64);
  function writeTend(MT, k, ch) { const TN = MT.TN, TR = MT.TR, per = (TN + 1) * (TR + 1), PT = MT.pos, NT = MT.nrm, m = ch.length - 1;
    for (let i = 0; i <= TN; i++) { const f = i / TN * m, q = Math.min(m - 1, Math.floor(f)), t = f - q, p0 = ch[Math.max(0, q - 1)], p1 = ch[q], p2 = ch[q + 1], p3 = ch[Math.min(m, q + 2)], t2 = t * t, t3 = t2 * t;
      for (let a = 0; a < 3; a++) TP[i * 3 + a] = 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3); }
    let nx = 0, ny = 1, nz = 0;
    for (let i = 0; i <= TN; i++) { const a = Math.max(0, i - 1) * 3, b = Math.min(TN, i + 1) * 3; let tx = TP[b] - TP[a], ty = TP[b + 1] - TP[a + 1], tz = TP[b + 2] - TP[a + 2]; const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const dn = nx * tx + ny * ty + nz * tz; nx -= tx * dn; ny -= ty * dn; nz -= tz * dn; let nl = Math.sqrt(nx * nx + ny * ny + nz * nz); if (nl < 1e-5) { nx = 1; ny = 0; nz = 0; nl = 1; } nx /= nl; ny /= nl; nz /= nl;
      TF[i * 6] = nx; TF[i * 6 + 1] = ny; TF[i * 6 + 2] = nz; TF[i * 6 + 3] = ty * nz - tz * ny; TF[i * 6 + 4] = tz * nx - tx * nz; TF[i * 6 + 5] = tx * ny - ty * nx; }
    for (let i = 0; i <= TN; i++) { const u = i / TN, r = 0.06 * (1 - 0.66 * u) * (1 + 0.25 * Math.exp(-((u / 0.08) ** 2))), px = TP[i * 3], py = TP[i * 3 + 1], pz = TP[i * 3 + 2];
      for (let j = 0; j <= TR; j++) { const th = j / TR * TAU, c = Math.cos(th), s = Math.sin(th), o3 = (k * per + j * (TN + 1) + i) * 3, ex = TF[i * 6] * c + TF[i * 6 + 3] * s, ey = TF[i * 6 + 1] * c + TF[i * 6 + 4] * s, ez = TF[i * 6 + 2] * c + TF[i * 6 + 5] * s;
        PT[o3] = px + ex * r; PT[o3 + 1] = py + ey * r; PT[o3 + 2] = pz + ez * r; NT[o3] = ex; NT[o3 + 1] = ey; NT[o3 + 2] = ez; } }
    boxPt(ch[0], 0.3); boxPt(ch[m], 0.4); }
  function pose(M, ox, oy, o) { const R0 = RIG(), G2 = M.G, P = G2.P, bt = M.bt || 0, L = lodOf(), S = set(L), C = S.C, ME = G.MESH, thr = P.throat || 0, inh = P.inhale || 0, kp = 1 - 0.6 * inh, halo = [];
    profiles(); prepSpine(G2); BB[0] = BB[1] = 1e9; BB[2] = BB[3] = -1e9;
    // ---- the hide
    const body = ME['body' + L]; writeBody(body, S, C, ox, oy, kp); K.commit(body);
    // ---- the fins
    const finInfo = {}; for (const sd of [-1, 1]) finInfo[sd] = writeFin(ME['fin' + (sd > 0 ? 'E' : 'W') + L], G2.fins[sd], S, C, R0, P, bt, sd, ox, oy);
    // ---- the fluke (beating; its trailing edge lags)
    const flk = writeFluke(ME['fluke' + L], G2, S, C, bt, ox, oy);
    // ---- the ridge of ice crystals down the spine
    { const MS = ME['ridge' + L]; for (let i = 0; i < 11; i++) { const s = 0.22 + i * 0.048, H = hideAt(s, Math.PI, ox, oy, kp, -0.08), hgt = 0.62 + 0.26 * Math.sin(i * 1.7 + 0.4) + 0.3 * Math.exp(-(((i - 4.5) / 2.6) ** 2)) - (i > 8 ? 0.15 : 0), wid = 0.85 + 0.2 * Math.sin(i * 2.3);
        K.place(MS, i, rot2(frameN(H.n, H.d), Math.sin(i * 1.9) * 0.25), H.p, [hgt * 1.1, wid * (0.55 + 0.6 * hgt), hgt * 0.92]); boxPt(H.p, 1.4); }
      K.commit(MS); }
    // ---- the barnacle clusters
    { const MS = ME['crust' + L]; S.crustAt.forEach((c2, k) => { let p, n, d;
        if (c2[0] === 'b') { const H = hideAt(c2[1], c2[2], ox, oy, kp, -0.03); p = H.p; n = H.n; d = H.d; }
        else if (c2[0] === 'f') { const F = finInfo[c2[1]], t = c2[2], w = c2[3], y = lerp(herm(FIN_LE, t), herm(FIN_TE, t), w) * R0.CF * (1 - 0.12 * t), z = naca(w) * lerp(0.2, 0.085, t) * (herm(FIN_TE, t) - herm(FIN_LE, t)) * R0.CF + F.fx * t * t * 2.2 - 0.02, xl = t * R0.LF;
          p = [F.ro[0] + F.ax[0] * xl + F.chd[0] * y + F.nf[0] * z, F.ro[1] + F.ax[1] * xl + F.chd[1] * y + F.nf[1] * z, F.ro[2] + F.ax[2] * xl + F.chd[2] * y + F.nf[2] * z]; n = vnrm(vsub(F.nf, vmul(F.chd, 0.6))); d = F.ax; }
        else { const X = c2[1], ax = Math.abs(X), y = lerp(herm(FL_LE, ax), herm(FL_TE, ax), c2[2]), f = flk; p = [f.o2[0] + f.side[0] * X + f.dd[0] * y + f.n[0] * 0.02, f.o2[1] + f.side[1] * X + f.dd[1] * y + f.n[1] * 0.02, f.o2[2] + f.side[2] * X + f.dd[2] * y + f.n[2] * 0.02]; n = f.n; d = f.dd; }
        const r = c2[c2.length - 2]; K.place(MS, k, rot2(frameN(n, d), c2[c2.length - 1]), p, [r, r, r * 1.1]); }); K.commit(MS); }
    // ---- the tubercles
    { const MS = ME['knob' + L]; S.knobAt.forEach((kb, k) => { const H = hideAt(kb[0], kb[1], ox, oy, kp, -0.025); K.place(MS, k, frameN(H.n, H.d), H.p, [kb[2], kb[2], kb[2] * 0.26]); }); K.commit(MS); }
    // ---- the vents (five a side, pulsing in a wave from head to tail; all flaring when it breathes)
    const vk = M.ventK || 0; { const MS = ME['vents' + L]; let k = 0; for (const sd of [1, -1]) for (let i = 0; i < 5; i++) { const s = 0.3 + i * 0.065, ph = sd > 0 ? 0.62 : Math.PI - 0.62, H = hideAt(s, ph + Math.PI / 2, ox, oy, kp, 0.0);
        K.place(MS, k, frameN(H.n, H.d), vadd(H.p, vmul(H.n, 0.055)), [1.3, 0.3, 0.1]); const lv = 0.35 + 0.65 * Math.max(0, Math.sin(bt * 1.5 - i * 0.85)) + vk * 0.6 + inh * 0.3;
        if (vdot(H.n, A.PD) > 0.05) { const e0 = vadd(H.p, vmul(H.d, -0.34)), e1 = vadd(H.p, vmul(H.d, 0.34)); halo.push([0, H.p, 1.0 + lv * 0.6, GREEN, 0.55 * Math.min(1.4, lv)]); halo.push([1, e0, e1, 0.3, GREEN_HI, 0.95 * Math.min(1.3, lv)]); halo.push([1, e1, e0, 0.3, GREEN_HI, 0.7 * Math.min(1.3, lv)]); } k++; }
      K.commit(MS); }
    // ---- the eye lights (lenses 0..13) and the tendril tips (14..19)
    const ek = M.eyeK == null ? 1 : M.eyeK, LS = ME['lens' + L]; { let k = 0; for (const sd of [1, -1]) for (let i = 0; i < 7; i++) { const s = 0.128 + i * 0.005 + i * i * 0.0014, ph0 = 0.36 - i * 0.16, ph = sd > 0 ? ph0 : Math.PI - ph0, H = hideAt(s, ph + Math.PI / 2, ox, oy, kp, 0.0);
        const rr = 0.1 + 0.012 * (3 - Math.abs(i - 3)); K.place(LS, k++, frameN(H.n, H.d), vadd(H.p, vmul(H.n, rr * 0.25)), [rr, rr, rr * 0.75]); if (vdot(H.n, A.PD) > 0.02) halo.push([0, H.p, 0.6, GREEN, 0.55 * ek * (0.7 + 0.3 * Math.sin(bt * 3 + i * 0.9 + sd))]); } }
    // ---- the tendrils: each a chain trailing behind the head (a rope after the 2D's drifting pose); o.live: it moves with time
    const TD = tendrils(M, ox, oy, kp, thr, o.live), MT = ME['tend' + L];
    { for (let k = 0; k < 6; k++) { const ch = TD.rel[k]; writeTend(MT, k, ch);
        const tip = ch[ch.length - 1]; K.place(LS, 14 + k, I3K, tip, [0.075, 0.075, 0.075]); halo.push([0, tip, 0.55, GREEN, 0.6 + 0.3 * Math.sin(bt * 2 + k)]);
        const hs2 = TD.hist[k]; for (let q = 1; q < hs2.length; q++) { const u = q / hs2.length; halo.push([1, [hs2[q - 1][0] - ox, hs2[q - 1][1] - oy, hs2[q - 1][2]], [hs2[q][0] - ox, hs2[q][1] - oy, hs2[q][2]], 0.09 * (1 - u * 0.6), GREEN_HI, 0.5 * (1 - u)]); } }
      K.commit(MT); K.commit(LS); }
    // ---- the glow round the head, the bared throat's, the lifted fin's edge
    { const hd = hideAt(0.1, Math.PI, ox, oy, kp, 0); halo.push([0, hd.p, 4.6, MINT, 0.07 + 0.05 * Math.sin(bt * 0.9)]);
      if (thr > 0.05) { const H = hideAt(0.14, 0, ox, oy, kp, 0.1); halo.push([0, H.p, 3.4, GREEN, thr * 0.55 * (0.6 + 0.4 * Math.sin(bt * 5))]); halo.push([0, H.p, 1.6, GREEN_HI, thr * 0.35]); }
      for (const sd of [-1, 1]) { const gw = M.finGlow ? M.finGlow[String(sd)] || 0 : 0; if (gw < 0.02) continue; const lead = G2.fins[sd].lead, fl = 0.6 + 0.4 * Math.sin(bt * 12); lead.forEach((q, i) => { if (i % 2) return; halo.push([0, [q[0] - ox, q[1] - oy, q[2]], 1.2, GREEN, gw * 0.5 * fl]); }); } }
    // the occluders: six spheres down the body (the fins darken under it)
    let no = 0; if (!lowFx()) for (const s of [0.07, 0.17, 0.29, 0.41, 0.53, 0.66]) { const Sp = spineAt(s, ox, oy), r = 0.84 * Math.min(Sp.w, (Sp.hU + Sp.hL) / 2), up = (Sp.hU - Sp.hL) * 0.5;
      OCC[no * 4] = (Sp.c[0] + Sp.u[0] * up) / ZS; OCC[no * 4 + 1] = (Sp.c[1] + Sp.u[1] * up) / ZS; OCC[no * 4 + 2] = (Sp.c[2] + Sp.u[2] * up) / ZS; OCC[no * 4 + 3] = r / ZS; no++; }
    const fl2 = o.flash ? 1 : 0, dead = o.dead || 0, items = [
      { mesh: body, glow: thr * (0.6 + 0.4 * Math.sin(bt * 5)), spill: vk * 0.6 + inh * 0.3, kind: ek, glow2: fl2, fx: dead, wear: 0.37 },
      { mesh: ME['finW' + L], glow: (M.finGlow ? M.finGlow['-1'] || 0 : 0) * (0.6 + 0.4 * Math.sin(bt * 12)), glow2: fl2, fx: dead, wear: 0.21 },
      { mesh: ME['finE' + L], glow: (M.finGlow ? M.finGlow['1'] || 0 : 0) * (0.6 + 0.4 * Math.sin(bt * 12)), glow2: fl2, fx: dead, wear: 0.63 },
      { mesh: ME['fluke' + L], glow2: fl2, fx: dead, wear: 0.5 },
      { mesh: ME['ridge' + L], glow: 0.3 + 0.4 * thr + vk * 0.3, glow2: fl2, fx: dead, wear: 0.11 },
      { mesh: ME['crust' + L], glow2: fl2, fx: dead, wear: 0.77, outline: false },
      { mesh: ME['knob' + L], glow2: fl2, fx: dead, wear: 0.29, outline: false },
      { mesh: ME['vents' + L], glow: vk * 0.6 + inh * 0.3, glow2: fl2, fx: dead, wear: 0.4, outline: false },
      { mesh: LS, glow: ek, spill: thr, glow2: fl2, fx: dead, outline: false },
      { mesh: MT, glow: 1 + thr * 0.6, glow2: fl2, fx: dead, outline: false }];
    return { items, bb: BB, occ: OCC, nocc: no, halo, L }; }
  /* the tendrils: the 2D's drifting chain as the target; the drawn chain a rope trailing it (each link follows, the tips the slowest,
     kept at its length), its tip's path kept for the glow's trail. Without time (a still preview) the target itself */
  function tendrils(M, ox, oy, kp, thr, live) { const bt = M.bt || 0, out = { rel: [], hist: [] }; let st = live ? M.ahTd : null; const dt = st ? cl(bt - st.bt, 0, 0.1) : 0;
    if (live && !st) st = M.ahTd = { bt, P: null, hist: [[], [], [], [], [], []] };
    for (let i = 0; i < 6; i++) { const ph = -Math.PI / 2 + (i - 2.5) * 0.3, H = hideAt(0.055 + Math.abs(i - 2.5) * 0.008, ph + Math.PI / 2, ox, oy, kp, -0.05), root = [H.p[0] + ox, H.p[1] + oy, H.p[2]], tg = [root];
      for (let k = 1; k <= 5; k++) { const pr = tg[k - 1], sw = Math.sin(bt * 0.8 + i * 1.3 + k * 0.5) * 0.12 * k, sw2 = Math.cos(bt * 0.6 + i * 0.7 + k * 0.4) * 0.08 * k; tg.push([pr[0] + sw * 0.45 + (i - 2.5) * 0.03, pr[1] + 0.06 + sw2 * 0.6 + (thr ? 0.2 : 0), pr[2] - 0.36 * (1 - thr * 0.4)]); }
      let ch = tg; if (st) { if (!st.P) st.P = []; if (!st.P[i]) st.P[i] = tg.map(p => p.slice());
        const Pc = st.P[i]; Pc[0] = root; for (let k = 1; k <= 5; k++) { const rate = 9 / Math.pow(k, 0.8), f = 1 - Math.exp(-dt * rate), p = Pc[k], q = tg[k]; for (let a = 0; a < 3; a++) p[a] += (q[a] - p[a]) * f;
          const seg = vsub(p, Pc[k - 1]), L0 = vlen(vsub(tg[k], tg[k - 1])), l = vlen(seg) || 1; if (l > L0 * 1.15) { const nn = vmul(seg, L0 * 1.15 / l); Pc[k] = vadd(Pc[k - 1], nn); } }
        ch = Pc; const hs2 = st.hist[i], tp = Pc[5]; if (!hs2.length || vlen(vsub(hs2[0], tp)) > 0.06) { hs2.unshift(tp.slice()); if (hs2.length > 9) hs2.pop(); } else hs2[0] = tp.slice();
        out.hist.push(hs2); } else out.hist.push([]);
      out.rel.push(ch.map(p => [p[0] - ox, p[1] - oy, p[2]])); }
    if (st) st.bt = bt; return out; }

  /* ---------- the pass: one GPU pass in the summit's light into the box round it, laid down at once ---------- */
  const PX = [1, 0, 0], PY = [0, 1, -1], PD = vnrm([0, 1, 1]), UPW = [0, 0, 1], ZS = 3, GLCAP = 1600, OUTC = [0.02, 0.04, 0.09], GI = [], SO = {}, INFO = { lod: 0, calls: 0, tris: 0, W: 0, H: 0, ms: 0, poseMs: 0 };
  function pass(c, X0, Y0, k, R, o) { const LT = A.LIGHT.summit, bb = R.bb; if (!(bb[2] > bb[0])) return false; let bx0 = X0 + bb[0] * k - 4, by0 = Y0 + bb[1] * k - 4, bx1 = X0 + bb[2] * k + 4, by1 = Y0 + bb[3] * k + 4;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__AUR_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (lowFx() ? 0.8 : 1) * gqK();
    if (m) { const inv = 1 / Math.max(1e-6, Math.hypot(m.a, m.b)), vx0 = -m.e * inv - 8, vy0 = -m.f * inv - 8, vx1 = vx0 + c.canvas.width * inv + 16, vy1 = vy0 + c.canvas.height * inv + 16; bx0 = Math.max(bx0, vx0); by0 = Math.max(by0, vy0); bx1 = Math.min(bx1, vx1); by1 = Math.min(by1, vy1); if (!(bx1 > bx0) || !(by1 > by0)) return true; }
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl)); const bw = bx1 - bx0, bh = by1 - by0;
    Object.assign(SO, { px: PX, py: PY, pd: PD, cl: [2 * k * ZS / bw, 2 * (X0 - bx0) / bw - 1, -2 * k * ZS / bh, 1 - 2 * (Y0 - by0) / bh], v: PD, lk: LT.lk, ls: LT.ls, lr: LT.lr, up: UPW, low: lowFx(), rim: LT.rim, amb: LT.key, t: (o.t || 0) % 600,
      outline: Math.max(1, 1.05 * (W / bw)), outlineCol: OUTC, keep: 1, occ: R.nocc ? R.occ : null, nocc: R.nocc });
    const items = []; R.items.forEach((it, n) => { if (!it.mesh) return; const g = GI[n] || (GI[n] = { R0: new Float32Array([1 / ZS, 0, 0]), R1: new Float32Array([0, 1 / ZS, 0]), R2: new Float32Array([0, 0, 1 / ZS]), T: new Float32Array(3) });
      g.mesh = it.mesh; g.alpha = 1; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.first = 0; g.cnt = 0; items.push(g); });
    const t0 = nowMs(), cvs = GLM.render(W, H, SO, items); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); if (o.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= Math.min(1, o.flash) * 0.3; c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
    G.ms = G.ms * 0.9 + (nowMs() - t0) * 0.1; G.n++; G.box = [W, H]; try { const st = GLM.stats; G.calls = st.calls; G.drawTris = st.tris; Object.assign(INFO, { lod: R.L, calls: st.calls, tris: st.tris, W, H, ms: +G.ms.toFixed(2) }); } catch (e) { /* (no stats) */ } return true; }
  // the halos on the painter: [0, p, r (tiles), col, a] a glow; [1, p0, p1, w (tiles), col, a] a fading streak (p relative to the origin)
  function halos(Q, list, X0, Y0, T, al) { if (!list) return; const sx = p => X0 + p[0] * T, sy = p => Y0 + (p[1] - p[2]) * T;
    for (const h of list) { if (h[0] === 0) Q.glow(sx(h[1]), sy(h[1]), h[2] * T, h[3], h[4] * al); else Q.rbeam(sx(h[1]), sy(h[1]), sx(h[2]), sy(h[2]), h[3] * T, h[4], h[5] * al, 1, 0.4); } }

  /* the whale: one pass over the summit (faded high overhead so the summit reads through it); its halos laid by the light pass after */
  function drawWhale(c, FX, m, T, t) { if (!gpu()) return false; const M = FX.mem, P = M.G && M.G.P; if (!P) return false; if (P.alpha < 0.02) { M.ahHalo = null; return true; }
    const a = cl(P.alpha) * (1 - 0.4 * cl(P.over || 0)), fl = m.flash > 0, ox = m.x, oy = m.y; let R;
    try { const t0 = nowMs(); R = pose(M, ox, oy, { flash: fl, dead: m.dead ? 1 - cl(P.alpha) : 0, live: true }); INFO.poseMs = +(INFO.poseMs * 0.9 + (nowMs() - t0) * 0.1).toFixed(2); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Ahuul: pose', e); return false; }
    c.save(); c.globalAlpha *= a; let ok = false; try { ok = pass(c, FX.sx(ox), FX.sy(oy), T, R, { t: M.bt || t, flash: fl ? 1 : 0 }); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Ahuul: draw', e); } c.restore();
    M.ahHalo = ok ? { list: R.halo, X0: FX.sx(ox), Y0: FX.sy(oy), T, a } : null; return ok; }
  /* previews and the art sheet: the fight-less pose (the 2D demoPaint's), on the GPU, its halos after */
  function demo(c, FX, m, X, Y, T, t) { if (!gpu()) return false; const R0 = RIG(), M = FX.mem || {}; if (!R0.demoPose(FX, m, M)) return false; let R;
    try { const t0 = nowMs(); R = pose(M, m.x, m.y, {}); INFO.poseMs = +(INFO.poseMs * 0.9 + (nowMs() - t0) * 0.1).toFixed(2); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Ahuul: pose', e); return false; }
    let ok = false; try { ok = pass(c, X, Y, T, R, { t: M.bt || t }); } catch (e) { G.fail(); return false; }
    if (ok) { const F = A.fg(); if (F) { const Q = F.begin(c, null); try { halos(Q, R.halo, X, Y, T, 1); } finally { F.flush(c); } } } return ok; }

  /* ---- its light on the summit (as v470: the sweep's half, the wave, the breath's frost, the lit shelter, the warnings) ---- */
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); if (FX.__aurHz) return; FX.__aurHz = 1; const h0 = FX.hz;
    FX.hz = q2 => { const z = h0(q2); if (z && z.kind === 'frost' && z.draw) { const d0 = z.draw; z.draw = (c, z2, F2, T, t) => { if (!frostGL(c, z2, F2, T, t)) d0(c, z2, F2, T, t); }; } return z; }; }
  // the breath's frost over the open summit: a pale crust advancing from the north rim, crystals glinting in it (the warm bubble left clear)
  function frostGL(c, z, FX, T, t) { const F = A.fg(); if (!F) return false; const M = FX.mem, C = FX.C, R0 = RIG(), fade = Math.min(1, z.age / 0.3, Math.max(0, z.life - z.age) / 0.8); if (fade <= 0) return true; const front = -1 + Math.min(1, z.age / 0.7) * 2.2, B = M.bubble, Q = F.begin(c, null);
    try { Q.quad(552, FX.sx(C.x), FX.sy(C.y), R0.RX * T, 0, 0, R0.RY * T, ICE_HI, fade, front, B ? (B.x - C.x) / R0.RX + 5 : 0, B ? Math.round(((B.y - C.y) / R0.RY + 2) * 100) * 1000 + Math.round(Math.min(0.999, B.r / R0.RX) * 1000) : 0); } finally { F.flush(c); } return true; }
  /* the floor's light: the sweep's half, the wave of snow, the lit shelter, the warnings (the starfall's rings among them) */
  function overlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m; if (!M || !M.G) return false; const F = A.fg(), marked = FX.S.tele.filter(s => s.aur);
    if (!F || !G.on() || !RIG()) { M.aurGL = false; if (!marked.length) return false; for (const s of marked) A.tele2D(c, FX, s, T, t); return false; }
    M.aurGL = true; const R0 = RIG(), RX = R0.RX, RY = R0.RY, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), Q = F.begin(c, null);
    try {
      if (M.sw && !(M.sw.k > 0)) { const S2 = M.sw, u = cl((FX.S.t - (S2.t0 || (S2.t0 = FX.S.t))) / S2.W), sd = S2.side; Q.quad(551, X0 + sd * RX * T / 2, Y0, sd * RX * T / 2, 0, 0, RY * T, ICE_HI, 1, u * 0.999, 0, 0); }
      if (M.wave) { const W2 = M.wave, u = cl(W2.t / 0.6), sd = W2.side; Q.quad(551, X0 + sd * RX * T / 2, Y0, sd * RX * T / 2, 0, 0, RY * T, WHITE, 1 - cl((W2.t - 0.6) / 0.3), -1 + u * 2.1, 1, 0); }
      const lit = M.br && (M.br.st === 'inhale' || M.br.st === 'exhale') ? { k: M.br.k, col: EMBER, u: M.br.st === 'inhale' ? cl((FX.S.t - M.br.t0) / M.br.INH) : 1 } : M.rs && m && m.act === 'rise' ? { k: M.rs.k, col: GREEN_HI, u: cl((FX.S.t - M.rs.t0) / 6.6) } : null;
      if (lit) { const N = R0.nookAt(C, lit.k), X = FX.sx(N[0]), Y = FX.sy(N[1]), pu = 0.5 + 0.5 * Math.sin(t * 5); Q.glow(X, Y, T * 2.8, lit.col, 0.3 + 0.2 * pu, 0.7); Q.quad(547, X, Y, T * (R0.NOOK + 0.5) * 1.25, 0, 0, T * (R0.NOOK + 0.5) * 0.9, lit.col, 1, 0.9 + 0.3 * (1 - lit.u), 4.4); }
      { const px = FX.sx(C.x + R0.PED[0]), py = FX.sy(C.y + R0.PED[1]); Q.glow(px, py, T * 1.7, EMBER, M.ember && M.ember.st === 'rest' ? 0.4 + 0.15 * Math.sin(t * 2) : 0.12, 0.56); }
      for (const s of marked) A.tell(Q, FX, s, T, t, { mode: s.mote ? 2 : 0 });
    } finally { F.flush(c); }
    return false; }   // (the 2D overlay still lays the whale's shadow, the horde's count; it leaves what is drawn here: M.aurGL)
  /* the light in the air: the whale's halos (laid here, in this pass), the starfall's motes coming down, the breath's stream, the bared throat's mark */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, C = FX.C; if (!m || !M.G || !M.aurGL) return false; const F = A.fg(); if (!F) return false; const Q = F.begin(c, null);
    try {
      if (M.ahHalo) { const H = M.ahHalo; halos(Q, H.list, H.X0, H.Y0, H.T, H.a); M.ahHalo = null; }
      for (const s of FX.S.tele) { if (s.done || !s.mote) continue; const u = cl(s.age / s.t), X = FX.sx(s.x), Y = FX.sy(s.y) - (1 - u * u) * T * 12; Q.beam(X, Y - T * 1.6, X, Y - T * 0.2, T * 0.1, ICE_HI, 0.5); Q.glow(X, Y, T * 0.9, ICE_HI, 0.6); Q.star(X, Y, T * 0.35, 0.95, WHITE); }
      if (M.br && M.br.st === 'exhale' && M.frost) { const sn = M.G.snout, X0 = FX.sx(sn[0]), Y0 = FX.sy(sn[1]) - sn[2] * T, tx = FX.sx(C.x), ty = FX.sy(C.y + 3), Z = M.frost, fade = cl(Z.age / 0.3) * cl((Z.life - Z.age) / 0.8), n = lowFx() ? 10 : 21;
        for (let k = 0; k < n; k++) { const u = (t * 0.8 + k / n) % 1, sp = ((k % 3) - 1) * u * T * 6, x = lerp(X0, tx, u) + sp, y = lerp(Y0, ty, u) + Math.sin(k * 2.1 + t * 3) * T * 0.5, r = T * (0.5 + u * 2.3);
          Q.glow(x, y, r * 1.5, '#96C3E1', 0.35 * (1 - u * 0.7) * fade); Q.glow(x - r * 0.12, y - r * 0.1, r * 0.9, '#ECF6FC', 0.45 * (1 - u * 0.7) * fade); if (k % 4 === 0) Q.star(x + r * 0.3, y - r * 0.2, T * 0.25, 0.8 * (1 - u) * fade, WHITE); } }
      if (m.stunT > 0 && FX.S.weak.throat && !FX.S.weak.throat.dead) { const w = FX.S.weak.throat, X = FX.sx(w.x), Y = FX.sy(w.y), pu = 0.5 + 0.5 * Math.sin(t * 7); Q.ring(X, Y, T * (1.5 + pu * 0.3), GREEN_HI, 0.6 + 0.4 * pu, T * 0.14); Q.glow(X, Y, T * 2.2, GREEN, 0.3); }
      else if (m.act === 'bow' && M.headC) { const h = M.headC, X = FX.sx(h[0]), Y = FX.sy(h[1]) - h[2] * T; Q.quad(547, X, Y, T * 3.4, 0, 0, T * 2.5, GREEN_HI, 0.8, 1, 2.2); }
    } finally { F.flush(c); }
    return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { if (G.on() && RIG()) set(lodOf()); }]; }
  /* what it costs: each level's triangles (made so far), the last pass's draw calls, triangles drawn, picture size, ms */
  function info() { const t = L => { if (!SETS[L] || !G.MESH) return null; let n = 0; for (const k in G.MESH) if (k.endsWith(String(L)) && G.MESH[k]) n += G.MESH[k].ntri; return n; }; return Object.assign({}, INFO, { trisFull: t(0), trisLod: t(1), buildMs: [SETS[0] && Math.round(SETS[0].ms), SETS[1] && Math.round(SETS[1].ms)] }); }
  return { G, gpu, drawWhale, demo, overlay, drawFx, init, preload, info, lodOf, get kit() { return A; } };
})();
