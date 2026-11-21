// v443 SB: in-game sheets of the saws, spike plates and loot boxes (works on the v442 build too: the old art).
// In each stage a test set is laid on open floor beside the pet (a saw on a 4-tile track, a chest, a crate, an explosive
// barrel, a pot or urn as the land has it, the three spike plates) next to whatever the stage has of its own, and drawn:
// still, moving (later), hit (the boxes flashing, the plates' tell), striking (the spikes up) and breaking (every box broken
// open a few frames in). Each is a crop round the set; the strip per stage is saved as <OUTDIR>/<tag>-<stage>-dpr<D>.png.
// usage: HTML=<test html> TAG=after node tests/_sbx-sheet.js   env: SPECS (comma list), DPR (2), OUTDIR (shots/v443-SB)
const { open } = require('./_sbx-lib');
const fs = require('fs'), path = require('path');
(async () => {
  const DPR = +(process.env.DPR || 2), T = await open({ dpr: DPR }); const { page, errors } = T;
  const OUT = path.resolve(__dirname, '..', process.env.OUTDIR || 'shots/v443-SB'); fs.mkdirSync(OUT, { recursive: true });
  const specs = (process.env.SPECS || 'rift:garden:3').split(','), tag = process.env.TAG || 'after';
  for (const sp of specs) { let info; try { info = await T.go(sp); } catch (e) { console.log(sp, 'failed', e.message); continue; }
    const r = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, M = D.M, X = D.X, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), FG = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX;
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)); let best = null, R = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(99);
      /* the window of 8 x 5 tiles with the most open floor (a thicket's paths are narrow), nearest the start on a tie */
      let bs = -1; for (let y = 2; y < M.MH - 3; y++) for (let x = 3; x < M.MW - 5; x++) { if (!W(x + 0.5, y + 0.5)) continue; let n = 0; for (let dx = -3; dx <= 4; dx++) for (let dy = -2; dy <= 2; dy++) if (W(x + dx + 0.5, y + dy + 0.5)) n++; const sc = n - Math.hypot(x - me.x, y - me.y) * 0.01; if (sc > bs) { bs = sc; best = { x: x + 0.5, y: y + 0.5 }; } }
      if (!best) return { err: 'no open floor' }; const ax = best.x, ay = best.y, bi = P.BIOME_ORDER[M.BI[Math.floor(ay) * M.MW + Math.floor(ax)]] || D.F.biome;
      const used = new Set(), spot = (x, y) => { let q = null, qd = 9; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) { const tx = Math.floor(x) + dx, ty = Math.floor(y) + dy, d = Math.hypot(dx, dy); if (W(tx + 0.5, ty + 0.5) && !used.has(tx + ',' + ty) && d < qd) { qd = d; q = [tx, ty]; } } if (!q) return [x, y]; used.add(q[0] + ',' + q[1]); return [q[0] + 0.5 + (x - Math.floor(x) - 0.5), q[1] + 0.5 + (y - Math.floor(y) - 0.5)]; };
      for (const m of D.mons) if (!m.boss) { m.x = ax + 300; m.y = ay + 300; m.spd = 0; m.atkCd = 99; m.aggro = false; m.hp = m.maxhp = 1e9; }
      D.g.intro = 0; D.banners.length = 0; D.SKIP.fog = true; const [PX, PY] = spot(ax + 3.6, ay + 0.9); me.x = PX; me.y = PY; used.add(Math.floor(ax) + ',' + Math.floor(ay - 1.3)); for (let i = -2; i <= 2; i++) used.add((Math.floor(ax) + i) + ',' + Math.floor(ay - 1.3));
      D.traps.push({ kind: 'saw', x: ax, y: ay - 1.3, x0: ax - 2, y0: ay - 1.3, x1: ax + 2, y1: ay - 1.3, room: -1, ph: 0, spd: 2.6, t: 0.3 });
      const mk = (o, x0, y0) => { const [x, y] = spot(x0, y0), p = Object.assign({ hp: o.kind === 'chest' ? 3 : 1, flash: 0, v: 1, x, y, biome: bi }, o); D.pots.push(p); return p; };
      const boxes = [mk({ kind: 'chest' }, ax - 2.4, ay + 0.1), mk({ kind: 'pot', v: 0 }, ax - 1.2, ay + 0.1), mk({ kind: 'barrel' }, ax, ay + 0.1), mk({ kind: 'pot', v: 1 }, ax + 1.2, ay + 0.1), mk({ kind: 'chest' }, ax + 2.4, ay + 0.1)];
      const hz = ['spikes', 'icespikes', 'thorns'].map((k, i) => { const [hx, hy] = spot(ax - 1.3 + i * 1.3, ay + 1.9), h = { kind: k, fam: 'spikes', x: hx, y: hy, room: -1, ph: 0, t: 0, st: 'idle', pop: 0 }; D.hazards.push(h); return h; });
      for (let n = 0; n < 30; n++) { me.hp = D.ST.hp; G.update(1 / 60); me.x = PX; me.y = PY; } D.cam.x = ax + 0.3; D.cam.y = ay + 0.2; for (const h of hz) { h.t = 0; h.st = 'idle'; h.pop = 0; }
      const crop = () => { const k = c.getTransform().a || 1, o0 = D.toWorld(0, 0), o1 = D.toWorld(1, 1), Tz = 1 / (o1[0] - o0[0]), scx = wx => (wx - o0[0]) * Tz, scy = wy => (wy - o0[1]) * Tz, x0 = scx(ax - 3.4) * k, y0 = scy(ay - 2.5) * k, w = Tz * 7.4 * k, h = Tz * 5.2 * k, o = document.createElement('canvas'); o.width = Math.round(w); o.height = Math.round(h); o.getContext('2d').drawImage(cv, x0, y0, w, h, 0, 0, w, h); return o.toDataURL('image/png'); };
      const draw = () => { D.banners.length = 0; D.g.shownTips = D.g.shownTips || {}; D.cam.x = ax + 0.3; D.cam.y = ay + 0.2; c.save(); G.draw(c); c.restore(); if (FG && FG.frameEnd) FG.frameEnd(); if (P.retro) P.retro.post(cv, c); };
      const step = (n, f) => { for (let i = 0; i < n; i++) { me.hp = D.ST.hp; if (f) f(); G.update(1 / 60); me.x = PX; me.y = PY; } };
      for (const q of D.propList) if (q.x > ax - 6 && q.x < ax + 6 && q.y > ay - 3.5 && q.y < ay + 8) q.broken = true;   // (the props standing in front of the set out of the picture)
      const shots = {}; for (let i = 0; i < 14; i++) draw();   // (what is painted lazily, painted)
      shots.still = (draw(), crop());
      step(20); draw(); shots.moving = crop();
      /* (the same frame with the dungeon's GPU pass holding light of its own (a ring far off the screen): the live light laid on the GPU, not from 2D pictures) */
      D.rings.push({ x: ax + 200, y: ay + 200, r0: 0.2, r1: 1.4, life: 9, max: 9, color: '#FFE37A', w: 0.12 }); draw(); shots.gpu = crop(); D.rings.length = 0; draw(); shots.moving2d = crop();
      for (const p of boxes) p.flash = 0.1; for (const h of hz) { h.st = 'warn'; h.pop = 0; } draw(); shots.hit = crop();
      for (const h of hz) { h.st = 'idle'; h.pop = 0.4; } step(2, () => { for (const h of hz) h.pop = 0.42; }); draw(); shots.strike = crop();
      for (const p of boxes) { if (p.kind === 'barrel') continue; let n = 0; while (!p.broken && n++ < 4) X.smashPots({ x: p.x, y: p.y, r: 0.05 }); } step(9); draw(); shots.breaking = crop();
      return { shots, biome: bi, light: self.TRAP_ART ? TRAP_ART.lightOf(bi) : '-', stats: self.TRAP_ART ? TRAP_ART.stats : null }; });
    if (r.err) { console.log(sp, r.err); continue; }
    const name = sp.replace(/:/g, '-'), files = [];
    for (const k of ['still', 'moving', 'gpu', 'moving2d', 'hit', 'strike', 'breaking']) { const f = path.join(OUT, `${tag}-${name}-dpr${DPR}-${k}.png`); fs.writeFileSync(f, Buffer.from(r.shots[k].split(',')[1], 'base64')); files.push(f); }
    console.log('==', sp, info.name, 'biome', r.biome, 'light', r.light, r.stats ? JSON.stringify({ painted: r.stats.painted, misses: r.stats.misses, gpuOps: r.stats.gpuOps, d2Ops: r.stats.d2Ops, laidGPU: r.stats.laidGPU, laid2D: r.stats.laid2D }) : '');
  }
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
