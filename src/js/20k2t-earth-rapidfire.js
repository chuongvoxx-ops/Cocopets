/* ---------- (v417 BR) Earth Strong: Rapid Fire (replaces Boulder Rosary; key 'rapidfire', the old 'rosary' aliased to it) ----------
   Sharp stone shards form beside the pet, left and right in turn (stone flecks drawn in, a growing amber glint), and fire
   at the selected monster in a fast sequence: rapid stone gunfire. Each shard is compacted basalt and sandstone with an
   uneven, chipped silhouette and a small amber mineral core, spinning about its axis; a dusty muzzle pulse as it leaves,
   a tight trail of stone flecks behind it; on impact it shatters into chips and dust.
     shards     exactly 6 / 8 / 10 (Base / Adept / Celestial)
     cadence    one every 0.13 / 0.105 / 0.085 s, the first 0.24 s after the cast (a short barrage at every tier)
     damage     0.75 / 0.72 / 0.7 x base x K a shard that hits
   Aim: the selected monster (the game's aim: the nearest within 8.5 tiles), else the nearest within the aiming cone
   (+-0.62 rad round the cast's aim, 9 tiles: the reach of the other ranged Strongs). If it dies during the barrage, the
   shots left (and the shards in flight) turn to another valid monster near it inside the cone; with none, they fly on
   along the aim. Each shard may hit one monster once (a swept segment against every monster each slice of at most
   1/120 s, so a fast shard never passes through one and a long frame lands the same hits), then shatters; a wall
   shatters it harmlessly. A lone boss takes every shard. Muzzle pulses, trails and chips never deal damage.
   Each shot nudges the pet back a little (0.05 tile), the last one more (0.13) with a small shake. Everything is updated by
   dt in the cast's effect; defeat (the pet down) or a won stage ends it at once, a party swap stops the shots not yet fired.
   Tunables: EARTH_STRONG_TUNE.rapidfire. Cost 22, cooldown 6 s (20k1, from the commit of the cast).
   The picture: the shards real 3D meshes on GLM (20k2r EARTH_BR_GPU); muzzle pulses, trails, chips and dust on the shared
   painter (20k6h FGFX, kinds 84, 105, 106). Without the GPU, a plain 2D picture. */
(() => {
  const S = ELEM_IMPL.earth.strong; delete S.rosary;
  const TAU = Math.PI * 2, cl = u => Math.max(0, Math.min(1, u)), sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const GT = typeof globalThis !== 'undefined' ? globalThis : self, TT = GT.EARTH_STRONG_TUNE || (GT.EARTH_STRONG_TUNE = {});
  const TUNE = TT.rapidfire = Object.assign({
    count: [6, 8, 10], gap: [0.13, 0.105, 0.085], dmg: [0.75, 0.72, 0.7],   // (Base / Adept / Celestial)
    form: 0.24, speed: 24, range: 9, cone: 0.62, hitR: 0.16, life: 0.75, turn: 10, recoil: 0.05, recoilEnd: 0.13, kb: 0.8, z: 0.85, side: 0.74, fwd: 0.3, trail: 1.1, size: 0.62 }, TT.rapidfire || {});
  const tierOf = C => { const ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))); return ev >= 7 ? 2 : ev >= 4 ? 1 : 0; };
  const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
  const SE = 0.55, CE = Math.sqrt(1 - SE * SE), DUSTC = '#8F7A60', AMBER = '#FFB84D', PALE = '#FFF1D6';
  const GPU = () => (typeof EARTH_BR_GPU !== 'undefined' ? EARTH_BR_GPU : null);
  const gfx = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX, G = GPU(); return F && F.usable() && G && G.usable() ? F : null; } catch (e) { return null; } };
  const wrap = d => Math.atan2(Math.sin(d), Math.cos(d));

  S.rapidfire = (C, h) => { const H = h, me = H.me, X = H.X, tier = tierOf(C), N = TUNE.count[tier], GAP = TUNE.gap[tier], DMG = C.base * C.K * TUNE.dmg[tier], a0 = C.a, P0 = X.pet ? X.pet() : null;
    try { if (gfx()) GPU().warm(); } catch (e) { /* (drawn in 2D) */ }
    const inCone = m => { const d = Math.hypot(m.x - me.x, m.y - me.y); return d < TUNE.range + (m.r || 0.4) && (d < 0.6 || Math.abs(wrap(Math.atan2(m.y - me.y, m.x - me.x) - a0)) < TUNE.cone); };
    // another valid monster in the cone, nearest the point (x, y)
    const pickNear = (x, y, skip) => { let best = null, bd = 1e9; for (const m of H.living()) { if (!valid(m) || m === skip || !inCone(m)) continue; const d = Math.hypot(m.x - x, m.y - y); if (d < bd) { bd = d; best = m; } } return best; };
    let tgt = C.A && valid(C.A.t) && Math.hypot(C.A.t.x - me.x, C.A.t.y - me.y) < TUNE.range + (C.A.t.r || 0.4) ? C.A.t : pickNear(me.x + Math.cos(a0) * 3, me.y + Math.sin(a0) * 3, null);
    const F = H.add({ key: 'rapidfire', life: 999, t: 0, N, fired: 0, shots: [], puffs: [], chips: [], dust: [], tgt, first: tgt, lx: tgt ? tgt.x : me.x + Math.cos(a0) * 5, ly: tgt ? tgt.y : me.y + Math.sin(a0) * 5, retargets: 0, dmgEvents: [], cancelled: 0, stopped: false,
      update(dt, f) { step(f, dt); }, draw(c, f, X0, Y0, T) { draw(c, f, T); } });
    me.sq = 0.75; X.sfx.hum && X.sfx.hum();
    const fireT = i => TUNE.form + i * GAP, sideOf = i => (i % 2 ? -1 : 1);
    const aimA = () => (F.tgt && valid(F.tgt) ? Math.atan2(F.tgt.y - me.y, F.tgt.x - me.x) : Math.atan2(F.ly - me.y, F.lx - me.x));
    const muzzle = (i, a) => [me.x + Math.cos(a) * TUNE.fwd + TUNE.side * sideOf(i), me.y + Math.sin(a) * TUNE.fwd * 0.6 - 0.12, TUNE.z + 0.08 * (i % 3 === 2 ? 1 : 0)];   // (left and right of the pet as seen, at its shoulders: clear of its face)

    function chips(x, y, z, ux, uy, k, big) { for (let j = 0; j < H.n(k); j++) { if (F.chips.length > 70) break; const an = Math.random() * TAU, sp = 1.2 + Math.random() * 3.2; F.chips.push({ x, y, z, vx: Math.cos(an) * sp - ux * 1.5, vy: Math.sin(an) * sp * 0.8 - uy * 1.5, vz: 1 + Math.random() * 2.6, t: 0, life: 0.45 + Math.random() * 0.4, s: (big ? 0.07 : 0.045) + Math.random() * 0.05, rot: Math.random() * TAU, md: Math.random() < 0.45 ? 2 : Math.random() < 0.6 ? 0 : Math.random() < 0.5 ? 1 : 3, sd: 1 + Math.random() * 30 }); }
      for (let j = 0; j < H.n(2); j++) F.dust.push({ x, y, z, vx: -ux * 0.6 + (Math.random() - 0.5), vy: -uy * 0.6 + (Math.random() - 0.5) * 0.6, vz: 0.3, t: 0, life: 0.45 + Math.random() * 0.25, s: 0.32 + Math.random() * 0.15, sd: 1 + Math.random() * 9 }); }
    function shatter(s, hit) { s.ph = 'gone'; s.gt = 0; const v = Math.hypot(s.vx, s.vy) || 1; chips(s.x, s.y, s.z, s.vx / v, s.vy / v, hit ? 7 : 4, hit); F.puffs.push({ x: s.x, y: s.y, z: s.z, ux: -s.vx / v, uy: -s.vy / v, t: 0, life: 0.22, hit: hit ? 1 : 0 }); }
    function fire(i) { const prev = F.tgt;
      if (!valid(F.tgt)) { F.tgt = pickNear(F.lx, F.ly, null); if (F.tgt && prev) F.retargets++; }
      if (F.tgt) { F.lx = F.tgt.x; F.ly = F.tgt.y; }
      const a = aimA(), [mx, my, mz] = muzzle(i, a), tx = F.tgt ? F.tgt.x : F.lx, ty = F.tgt ? F.tgt.y : F.ly, an = Math.atan2(ty - my, tx - mx);
      F.shots.push({ i, x: mx, y: my, z: mz, vx: Math.cos(an) * TUNE.speed, vy: Math.sin(an) * TUNE.speed, tgt: F.tgt, t: 0, dist: 0, ph: 'fly', roll: Math.random() * TAU, rw: 22 + Math.random() * 10, v: i % 3, hit: null, gt: 0 });
      F.puffs.push({ x: mx + Math.cos(an) * 0.2, y: my + Math.sin(an) * 0.2, z: mz, ux: Math.cos(an), uy: Math.sin(an), t: 0, life: 0.28, hit: 0, muzzle: 1 });
      const last = i === N - 1, rc = last ? TUNE.recoilEnd : TUNE.recoil; X.moveEnt(me, -Math.cos(an) * rc, -Math.sin(an) * rc); me.sq = last ? 0.72 : 0.86; me.castT = me.castM = last ? 0.4 : 0.2; if (last) X.shake(3, 0.12);
      const sf = X.sfx; if (sf.crack) sf.crack(); else if (sf.blip) sf.blip(); else sf.thud(); }
    function step(f, dt) { if (!(dt > 0)) return;
      const dead = me.dead || H.g.won || H.g.over, swapped = P0 && X.pet && X.pet() !== P0;
      if (!f.stopped && (dead || swapped)) { f.stopped = true; f.cancelled = N - f.fired; f.fired = N; if (dead) for (const s of f.shots) if (s.ph === 'fly') shatter(s, false); }
      const n = Math.min(1200, Math.max(1, Math.ceil(dt * 120))), hdt = dt / n;
      for (let k = 0; k < n; k++) { f.t += hdt;
        while (f.fired < N && f.t >= fireT(f.fired)) fire(f.fired++);
        for (const s of f.shots) { if (s.ph !== 'fly') continue; s.t += hdt;
          if (s.tgt && !valid(s.tgt)) { const nt = pickNear(s.tgt.x, s.tgt.y, s.tgt); s.tgt = nt; if (nt) f.retargets++; }   // (its target died in flight: another in the cone, near it)
          if (s.tgt) { const want = Math.atan2(s.tgt.y - s.y, s.tgt.x - s.x), cur = Math.atan2(s.vy, s.vx), d = wrap(want - cur), tr = Math.max(-TUNE.turn * hdt, Math.min(TUNE.turn * hdt, d)), na = cur + tr; s.vx = Math.cos(na) * TUNE.speed; s.vy = Math.sin(na) * TUNE.speed; }
          const x1 = s.x + s.vx * hdt, y1 = s.y + s.vy * hdt; let hm = null, hs = 2;
          for (const m of H.living()) { if (!valid(m)) continue; const dx = x1 - s.x, dy = y1 - s.y, ll = dx * dx + dy * dy, u = ll > 1e-9 ? cl(((m.x - s.x) * dx + (m.y - s.y) * dy) / ll) : 0, dd = Math.hypot(m.x - s.x - dx * u, m.y - s.y - dy * u); if (dd < (m.r || 0.4) + TUNE.hitR && u < hs) { hs = u; hm = m; } }
          if (hm) { s.x += (x1 - s.x) * hs; s.y += (y1 - s.y) * hs; s.dist += TUNE.speed * hdt * hs; s.hit = hm; const dmg = X.hitMon(hm, DMG, C.dmgO({ kb: TUNE.kb })); f.dmgEvents.push({ i: s.i, m: hm, dmg, boss: !!hm.boss, t: f.t }); shatter(s, true); X.shake(1.5, 0.05); continue; }
          if (X.blocked(x1, y1, 0.06, 1)) { shatter(s, false); continue; }
          s.x = x1; s.y = y1; s.dist += TUNE.speed * hdt; s.z += (TUNE.z * 0.85 - s.z) * Math.min(1, hdt * 3); s.roll += s.rw * hdt;
          if (s.t > TUNE.life || s.dist > TUNE.range + 1.5) { s.ph = 'gone'; s.gt = 0; s.fizz = 1; chips(s.x, s.y, s.z, s.vx / TUNE.speed, s.vy / TUNE.speed, 2, false); } }
      }
      // the cosmetic bits (they never hit)
      const cdt = Math.min(dt, 0.1);
      for (const s of f.shots) if (s.ph === 'gone') s.gt += cdt;
      for (let i = f.chips.length - 1; i >= 0; i--) { const p = f.chips[i]; p.t += cdt; if (p.z > 0 || p.vz > 0) { p.vz -= 14 * cdt; p.x += p.vx * cdt; p.y += p.vy * cdt; p.z = Math.max(0, p.z + p.vz * cdt); p.rot += cdt * 12; if (p.z <= 0) { p.vz = 0; p.vx *= 0.3; p.vy *= 0.3; } } if (p.t >= p.life) f.chips.splice(i, 1); }
      for (let i = f.dust.length - 1; i >= 0; i--) { const p = f.dust[i]; p.t += cdt; const q = Math.exp(-2 * cdt); p.vx *= q; p.vy *= q; p.x += p.vx * cdt; p.y += p.vy * cdt; p.z += p.vz * cdt; if (p.t >= p.life) f.dust.splice(i, 1); }
      for (let i = f.puffs.length - 1; i >= 0; i--) { const p = f.puffs[i]; p.t += cdt; if (p.t >= p.life) f.puffs.splice(i, 1); }
      if (f.fired >= N && f.shots.every(s => s.ph === 'gone' && s.gt > 0.25) && !f.chips.length && !f.dust.length && !f.puffs.length) f.life = 0;
    }

    /* ---------- drawing ---------- */
    function draw(c, f, T) { const FG = gfx(), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45, SY = (y, z) => H.sy(y) - z * CE * T, a = aimA();
      // the shards still forming beside the pet (the next few), the ones in flight
      const L = [];
      for (let i = f.fired; i < N; i++) { const t0 = fireT(i) - Math.min(0.24, GAP * 2.2); if (f.t < t0) break; const q = sm((f.t - t0) / (fireT(i) - t0)), [mx, my, mz] = muzzle(i, a), M = GPU() ? GPU().aim(Math.cos(a), Math.sin(a), 0, f.t * 9 + i) : null;
        L.push({ mesh: 'shard', v: i % 3, X: H.sx(mx), Y: H.sy(my), z: mz + 0.05 * Math.sin(f.t * 20 + i), M, s: TUNE.size * (0.25 + 0.75 * q), glow: 0.7 + 0.8 * q, alpha: 1, form: q, x: mx, y: my }); }
      for (const s of f.shots) if (s.ph === 'fly') L.push({ mesh: 'shard', v: s.v, X: H.sx(s.x), Y: H.sy(s.y), z: s.z, M: GPU() ? GPU().aim(s.vx, s.vy, 0, s.roll) : null, s: TUNE.size, glow: 1.1, alpha: 1, x: s.x, y: s.y });
      if (FG) { const Q = FG.begin(c, [PX, PY, T * 0.55]);
        for (const s of f.shots) { const fa = s.ph === 'fly' ? 1 : 1 - cl(s.gt / 0.18); if (fa <= 0 || s.dist < 0.05) continue; const v = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / v, uy = s.vy / v, Lt = Math.min(s.dist, TUNE.trail);
          const Xh = H.sx(s.x), Yh = SY(s.y, s.z), Xt = H.sx(s.x - ux * Lt), Yt = SY(s.y - uy * Lt, s.z), dx = Xh - Xt, dy = Yh - Yt, ll = Math.hypot(dx, dy) || 1, hw = 0.14 * T;
          Q.quad(106, (Xh + Xt) / 2, (Yh + Yt) / 2, dx / 2, dy / 2, -dy / ll * hw, dx / ll * hw, DUSTC, fa, s.dist, Lt, s.i * 3.7 + 1); }
        for (const p of f.puffs) { const q = p.t / p.life, X0 = H.sx(p.x + p.ux * q * 0.35), Y0 = SY(p.y + p.uy * q * 0.35, p.z), r = T * (p.hit ? 0.36 : 0.34) * (0.6 + 1.1 * q);
          Q.quad(84, X0, Y0, r, 0, 0, r * 0.8, DUSTC, (1 - q) * 0.75, q, 3 + p.x * 2.3 % 7, 0); if (q < 0.5) { Q.glow(X0, Y0, T * 0.42 * (1 + q), AMBER, (1 - q * 2) * (p.muzzle ? 0.8 : 0.5)); Q.star(X0, Y0, T * 0.34, (1 - q * 2) * 0.85, PALE); } }
        for (const p of f.dust) { const q = p.t / p.life, r = T * p.s * (0.6 + 0.9 * q); Q.quad(84, H.sx(p.x), SY(p.y, p.z), r, 0, 0, r * 0.8, DUSTC, Math.sin(Math.min(1, q * 2.5) * Math.PI / 2) * (1 - q) * 0.55, q, p.sd, 0); }
        for (const p of f.chips) { const s = p.s * T; Q.rq(105, H.sx(p.x), SY(p.y, p.z), s, s * 0.8, p.rot, '#FFFFFF', 1 - sm((p.t - p.life + 0.15) / 0.15), p.rot, p.sd, p.md); }
        for (const q of L) if (q.form != null && q.form < 1) { const Y0 = q.Y - q.z * CE * T; Q.glow(q.X, Y0, T * 0.35, AMBER, 0.35 * (1 - q.form)); for (let j = 0; j < 3; j++) { const an = f.t * 7 + j * 2.1, rr = T * 0.4 * (1 - q.form); Q.star(q.X + Math.cos(an) * rr, Y0 + Math.sin(an) * rr * 0.6, T * 0.06, 0.6 * (1 - q.form), PALE); } }
        FG.flush(c);
        if (!L.length || GPU().draw(c, L, { k: T, pet: [PX, PY, T * 0.5] })) return; }
      // (2D) plain shards: a dark wedge, a sandstone side, an amber dot; trails as short lines; chips as dots
      c.save(); c.lineCap = 'round';
      for (const s of f.shots) { if (s.ph !== 'fly' || s.dist < 0.05) continue; const v = Math.hypot(s.vx, s.vy) || 1, Lt = Math.min(s.dist, TUNE.trail); c.strokeStyle = 'rgba(140,118,92,0.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(H.sx(s.x), SY(s.y, s.z)); c.lineTo(H.sx(s.x - s.vx / v * Lt), SY(s.y - s.vy / v * Lt, s.z)); c.stroke(); }
      for (const q of L) { const X0 = q.X, Y0 = q.Y - q.z * CE * T, an = q.M ? Math.atan2(q.M[1] * SE, q.M[0]) : a, Ls = q.s * T * 0.55; c.save(); c.translate(X0, Y0); c.rotate(an); H.poly(c, [[Ls, 0], [Ls * 0.1, -Ls * 0.38], [-Ls * 0.9, -Ls * 0.22], [-Ls, Ls * 0.15], [Ls * 0.05, Ls * 0.34]]); c.fillStyle = '#3A322C'; c.fill(); c.strokeStyle = H.line(); c.lineWidth = 1.2; c.stroke();
        H.poly(c, [[Ls * 0.1, -Ls * 0.38], [-Ls * 0.9, -Ls * 0.22], [-Ls * 0.3, 0]]); c.fillStyle = '#C9A577'; c.fill(); c.fillStyle = AMBER; c.beginPath(); c.arc(-Ls * 0.1, Ls * 0.05, Math.max(1, Ls * 0.12), 0, TAU); c.fill(); c.restore(); }
      for (const p of f.chips) { c.fillStyle = p.md === 2 ? '#2E2A27' : '#C9A577'; c.beginPath(); c.arc(H.sx(p.x), SY(p.y, p.z), Math.max(1, p.s * T * 0.6), 0, TAU); c.fill(); }
      for (const p of f.puffs) { const q = p.t / p.life; c.globalAlpha = (1 - q) * 0.4; c.fillStyle = '#A08A6C'; c.beginPath(); c.arc(H.sx(p.x), SY(p.y, p.z), T * 0.22 * (0.6 + q), 0, TAU); c.fill(); }
      c.restore(); }
  };
  S.rapidfire.warm = () => { setTimeout(() => { try { if (gfx()) GPU().warm(); } catch (e) { /* (built on the cast instead) */ } }, 400); };
  S.rapidfire.TUNE = TUNE;
})();
