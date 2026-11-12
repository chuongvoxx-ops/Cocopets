// The damage-supremacy audit (Susano O spec §12): every Ultimate's full-cast damage to ONE neutral, very high-HP target, in
// the real game, at matched stats, and where Dark Messiah ranks.
// usage: HTML=test-susH.html node tests/ult-damage-rank.js        EVOS=1,4,7 (default)   ELEM=fire,dark   ONLY=key,key
//        OUT=path.json (also write the raw table)   CHECK=1 (fail unless Dark Messiah ranks first at every evo; on by
//        default once Susano O's moves exist)
// Method (state it when quoting the numbers):
// - one pet for every cast (same stats); its signature twist is a neutral one (chill, leech, pierce, knock or shock: no
//   extra damage on a single target); no accessories, no anima, no buffs; the cast's ability is the same for all
//   (star 6, mult 1.2, tier 1, so K = 1) with evo 1 / 4 / 7.
// - the target: one plain monster (type 'blob': no armour, no guard, no block, no shield), HP 1e9, rooted (`still`),
//   3 tiles in front of the pet, every other monster removed; a fresh target for every cast (no carried statuses).
// - no critical hits: Math.random is remapped to [0.08, 1) while a cast runs, so the 8% crit roll never passes (a few
//   decorative or proc rolls under 8% are suppressed too: conservative for the others, irrelevant for Messiah).
// - the cast's whole damage is counted: every tick, multi-hit, follow-up and finite damage over time (burns, poisons)
//   until all its effects have ended and the target has stopped losing HP for 2 s (cap 45 s of game time).
// - normalised by base = pet attack x mult (C.base): 'xB' is damage / base, comparable across evos.
// - Vehicle Ultimates (Sports Car, Beast Machine, Nidhogg, Susano O): their FINISHER is what is compared (Supernova,
//   Judgement Day, Ultima, Dark Messiah: the form is summoned and held still, the meter is filled, the finisher is pressed,
//   and only the finisher's damage is counted). A whole session's total is not comparable (it depends on how long and
//   how well the player rides), so it is not ranked.
// - Excluded from the ranking (listed separately): moves whose damage is a share of the target's HP (meaningless at 1e9),
//   moves that only echo the pet's own normal attacks (Thriller) and moves that need a downed teammate (Day of the Dead).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const EVOS = (process.env.EVOS || '1,4,7').split(',').map(Number), ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, ELEMS = process.env.ELEM ? process.env.ELEM.split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  if (process.env.DIAG) await page.addInitScript(() => { window.__DIAG = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);
  const NEUTRAL = ['chill', 'leech', 'pierce', 'knock', 'shock'];
  const setup = await page.evaluate(NEUTRAL => { const P = window.__pp; let tries = 0, tw = null;
    do { P.quickStart('Audit'); tw = P.dun.petKit(P.st).AB.twist; } while (!NEUTRAL.includes(tw) && ++tries < 200);
    P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11);
    const L = {}; for (const e in P.ELEM_IMPL) L[e] = Object.keys(P.ELEM_IMPL[e].ult || {}); return { tw, L }; }, NEUTRAL);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2500);
  console.log('pet twist', setup.tw);
  const VEH = { sportscar: { g: '_sportscar', ready: 'drive', fin: 'supernova' }, beastmachine: { g: '_beast', ready: 'ride', fin: 'judgement' }, nidhogg: { g: '_nidhogg', ready: 'fly', fin: 'ultima' }, susanoo: { g: '_susanoo', ready: 'air', fin: 'messiah', xform: true } };
  const SKIP = { thriller: 'echoes the pet\'s own normal attacks', dayofthedead: 'needs a downed teammate (raises allies)' };
  const rows = [];
  for (const evo of EVOS) for (const el of Object.keys(setup.L)) { if (ELEMS && !ELEMS.includes(el)) continue; for (const key of setup.L[el]) {
    if (ONLY && !ONLY.includes(key)) continue;
    if (SKIP[key]) { rows.push({ evo, el, key, skip: SKIP[key] }); continue; }
    const r = await cast(el, key, evo);
    const row = Object.assign({ evo, el, key, veh: !!VEH[key], n: 1 }, r, { xB: r.base ? +(r.dmg / r.base).toFixed(2) : null });
    rows.push(row); if (row.diag && row.diag.length) console.log('  diag', JSON.stringify(row.diag)); console.log(`evo ${evo}  ${el.padEnd(8)} ${key.padEnd(16)} ${row.err ? 'ERR ' + row.err : (row.xB + ' x base').padEnd(16)} ${row.veh ? '(finisher)' : ''}${row.flat ? ' (share of HP: excluded)' : ''}${row.t ? '  ' + row.t.toFixed(1) + ' s' : ''}`);
  } }
  // the leaders are cast REPS more times and averaged (some moves place their strikes at random round the target)
  const REPS = +(process.env.REPS || 3), TOPN = +(process.env.TOPN || 6);
  for (const evo of EVOS) { const L = rows.filter(r => r.evo === evo && !r.skip && !r.err && !r.flat && r.xB != null).sort((a, b) => b.xB - a.xB).slice(0, TOPN);
    for (const row of L) { const xs = [row.xB]; for (let k = 0; k < REPS; k++) { const r = await cast(row.el, row.key, evo); if (!r.err && r.base) xs.push(r.dmg / r.base); }
      row.runs = xs.map(x => +x.toFixed(2)); row.xB = +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2); row.n = xs.length; console.log(`evo ${evo}  ${row.key.padEnd(16)} runs ${JSON.stringify(row.runs)} -> mean ${row.xB}`); } }
  /* every cast gets a fresh floor (a run can leave state behind that a later cast would be credited with) */
  async function fresh() { await page.evaluate(() => { const P = window.__pp; window.__spot = null; P.arc.paused = false; try { P.closeArcade && P.arc.state !== 'idle' && P.closeArcade(); } catch (e) {} P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 }); await page.evaluate(() => { window.__pp.beginPlay(); const G = window.__pp.arc.game; window.__pp.arc.paused = true; for (let k = 0; k < 150; k++) G.update(1 / 60); }); }
  async function cast(el, key, evo) {
    await fresh();
    return page.evaluate(([el, key, evo, V]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; P.arc.paused = true;
      // clean slate: no lingering effects, the pet whole, every monster gone but one fresh plain target
      for (const f of D.ELEM.fx) f.life = 0; const Z = D.ELEM.H.X.zones; if (Z) Z.length = 0; for (let k = 0; k < 30; k++) G.update(1 / 60);   /* (and the previous cast's burning ground) */
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
      if (!window.__spot) { let best = null; for (let k = 0; k < 1500; k++) { const sx = me.x + (Math.random() - 0.5) * 34, sy = me.y + (Math.random() - 0.5) * 34; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; } window.__spot = best || { x: me.x, y: me.y }; }
      me.x = window.__spot.x; me.y = window.__spot.y; me.hp = D.ST.hp; me.dead = false; me.mp = 999; g.cdU = 0; g.cdS = 0; me.leap = me.dash = null; me.face = 1; g.intro = 0; g.bossIntro = 0; if (g.buff) for (const k in g.buff) g.buff[k] = 0;
      const live = D.mons.filter(m => !m.dead && !m.boss); if (!live.length) return { err: 'no monster' };
      for (const m of D.mons) if (!m.boss) { m.dead = true; m.x = me.x + 80; m.y = me.y + 80; }
      const T = live[0]; Object.assign(T, { dead: false, type: 'blob', x: me.x + 3, y: me.y, hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0, freeze: 0, stun: 0, chill: 0, burn: 0, burnD: 0, venom: 0, venomT: 0, falling: null, under: false, z: 0, lifted: false, kbx: 0, kby: 0, shield: 0, block: 0, guardFn: null, flash: 0, elite: false, affixes: null, brandDef: 0, wornUntil: 0, pandemUntil: 0, aquaCurse: null });
      for (const k of Object.keys(T)) if (/^(rx|mark|status|el[A-Z])/.test(k)) T[k] = null;
      const mv = P.ELEM_LIST[el]['ey_' + key], ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo, sig: false });
      D.setKit('ult', ab); const base = D.ST.atk * ab.mult;
      const R0 = Math.random; Math.random = () => 0.08 + 0.92 * R0();
      const step = (s, fn) => { const t1 = g.t + s; let n = 0; while (g.t < t1 - 1e-6 && n++ < 4000) { me.inv = 1; me.hp = Math.max(me.hp, D.ST.hp * 0.5); me.dead = false; if (T.dead) break; G.update(1 / 60); if (fn && fn()) break; } };
      let res;
      try {
        if (V) { // a vehicle: summon, hold still, (Susano O: Transform first), fill the meter, press the finisher; count only the finisher
          D.useUlt(); let S = null; step(12, () => { S = g[V.g]; return S && S.phase === (V.xform ? 'robot' : V.ready); });
          if (!S) { res = { err: 'no form' }; }
          else {
            if (V.xform) { D.useUlt(); step(12, () => S.phase === V.ready); step(0.5); }   /* (Transform, then a fresh press after the handover: 20k5w's freshGap) */
            T.hp = 1e9; T.x = me.x + 3; T.y = me.y; T.still = true; S.charge = 1; const hp0 = T.hp, t0 = g.t;
            let hpv = T.hp; const ST2 = {}; if (window.__DIAG) { delete T.hp; Object.defineProperty(T, 'hp', { get() { return hpv; }, set(v) { if (v < hpv) { const s = (new Error().stack || '').split('\n').slice(2, 5).map(l => l.trim().replace(/\(file.*?:(\d+):\d+\)/, '@$1').slice(0, 70)).join(' | '); ST2[s] = ST2[s] || [0, 0]; ST2[s][0]++; ST2[s][1] += hpv - v; } hpv = v; }, configurable: true }); }
            D.useUlt(); const started = S.phase !== V.ready;
            let quiet = 0, last = T.hp; step(30, () => { if (T.hp < last) { last = T.hp; quiet = 0; } else quiet += 1 / 60; return (S.released || S.ended || S.phase === 'gone' || S.phase === 'out') && quiet > 2; });
            res = { dmg: hp0 - T.hp, t: g.t - t0, started, diag: window.__DIAG ? Object.entries(ST2).map(([k, v]) => [k, v[0], Math.round(v[1] / (D.ST.atk * 1.2))]) : undefined }; if (window.__DIAG) { const v = hpv; delete T.hp; T.hp = v; }
            if (!S.released && !S.ended) { S.left = 0; step(8, () => S.released || S.ended || S.phase === 'gone'); }
          }
        } else {
          const hp0 = T.hp, t0 = g.t; let hpv = T.hp; const ST2 = {}; if (window.__DIAG) { delete T.hp; Object.defineProperty(T, 'hp', { get() { return hpv; }, set(v) { if (v < hpv && g.t - t0 > 15) { const s = (new Error().stack || '').split('\n').slice(2, 5).map(l => l.trim().slice(0, 80)).join(' | '); ST2[s] = (ST2[s] || 0) + 1; } hpv = v; }, configurable: true }); }
          D.useUlt(); let quiet = 0, last = T.hp;
          step(45, () => { if (T.hp < last) { last = T.hp; quiet = 0; } else quiet += 1 / 60; const Z = D.ELEM.H.X.zones, busy = D.ELEM.fx.length > 0 || T.burn > 0 || T.venom > 0 || (Z && Z.some(z => z.own === 'pet' && z.dps)); return g.t - t0 > 2 && !busy && quiet > 2; });
          res = { dmg: hp0 - T.hp, t: g.t - t0, fxLeft: D.ELEM.fx.length, diag: window.__DIAG ? Object.entries(ST2).sort((a, b) => b[1] - a[1]).slice(0, 2) : undefined }; if (window.__DIAG) { const v = hpv; delete T.hp; T.hp = v; }
        }
      } finally { Math.random = R0; }
      res.base = base; res.atk = D.ST.atk; res.flat = res.dmg > base * 2000; return res;
    }, [el, key, evo, VEH[key] || null]);
  }
  // the ranking per evo, Messiah's place and the coefficient it needs
  const out = { method: 'see header', twist: setup.tw, rows, rank: {} };
  let fail = 0; const hasMessiah = rows.some(r => r.key === 'susanoo' && !r.err && r.started !== false);
  for (const evo of EVOS) {
    const R = rows.filter(r => r.evo === evo && !r.skip && !r.err && !r.flat && r.xB != null).sort((a, b) => b.xB - a.xB), ek = 1 + 0.08 * (evo - 1);
    const others = R.filter(r => r.key !== 'susanoo'), best = others[0];
    console.log(`\n== evo ${evo}: top 8 (x base = damage / (pet attack x 1.2)) ==`); R.slice(0, 8).forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${r.el.padEnd(8)} ${r.key.padEnd(16)} ${String(r.xB).padStart(8)}  = ${(r.xB / ek).toFixed(2)} DK${r.veh ? '  (finisher)' : ''}`));
    const ms = R.find(r => r.key === 'susanoo');
    out.rank[evo] = { best: best && { key: best.key, xB: best.xB, DK: +(best.xB / ek).toFixed(2) }, messiah: ms ? { xB: ms.xB, place: R.indexOf(ms) + 1, lead: best ? +(ms.xB / best.xB).toFixed(3) : null } : null, need125DK: best ? +(1.25 * best.xB / ek).toFixed(2) : null };
    console.log(`best comparable: ${best ? best.key + ' ' + best.xB + ' x base (' + (best.xB / ek).toFixed(2) + ' DK)' : '-'};  Dark Messiah needs ${out.rank[evo].need125DK} DK in all for a 1.25x lead` + (ms ? `;  Dark Messiah: ${ms.xB} x base, place ${R.indexOf(ms) + 1}, lead ${out.rank[evo].messiah.lead}x` : ''));
    if (ms && R[0] !== ms) fail++;
  }
  const skipped = rows.filter(r => r.skip || r.flat || r.err); if (skipped.length) console.log('\nnot ranked:', skipped.map(r => `${r.key}@${r.evo}: ${r.skip || (r.flat ? 'share of HP' : r.err)}`).join('; '));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  if (errors.length) console.log('page errors', errors.slice(0, 5));
  const check = process.env.CHECK != null ? process.env.CHECK === '1' : hasMessiah;
  if (check) console.log(fail || !hasMessiah ? `FAIL: Dark Messiah does not rank first at ${fail} evo(s)${hasMessiah ? '' : ' (not measured)'}` : 'ok: Dark Messiah ranks first at every evo');
  await browser.close(); process.exit(check && (fail || !hasMessiah) ? 1 : 0);
})();
