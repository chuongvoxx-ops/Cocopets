// v430 BD: the Drowned Belfry's foe multipliers (riftDef's F.rift.foeK: monsters and elites 3.5x health, mini bosses 3.5x,
// the main bosses 3x effective health, every foe's blow 2x), measured in the running game. Run once on the HEAD build and
// once on the working build, then tests/_bd-table.js compares the two.
// env: HTML (test page), OUT (json path), ONLY (comma list of scenario keys to run).
// node tests/_bd-stats.js   ->  OUT json: { scenario: { values } }
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const HTML = process.env.HTML || 'test-bd.html', OUT = process.env.OUT || path.resolve(__dirname, '../shots/v430-BD/stats.json');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 240000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 10; for (const p of P.partyPets()) { p.dlv = 10; p.dxp = 0; } });
  // in-page helpers (defined once on window)
  await page.evaluate(() => {
    const H = window.__bd = {};
    H.frames = n => new Promise(r => { let k = 0; const f = () => { if (++k >= n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
    H.D = () => window.__pp.arc.game._dbg;
    H.prep = big => { const D = H.D(), me = D.me, g = D.g; me.inv = 0; me.dodge = null; me.dash = null; me.leap = null; if (me.spin) me.spin = null; g.shieldT = 0; g.phoenixT = 0; g.guardHP = 0; me.hp = big ? 1e6 : D.ST.hp; };
    // a direct hit: hurtPet(d, src) from outside any monster's turn (a trap's call when src is null)
    H.direct = (d, src) => { const D = H.D(); H.prep(true); const h0 = D.me.hp; D.hurtPet(d, src); const x = h0 - D.me.hp; D.me.hp = D.ST.hp; return x; };
    // an enemy shot on the pet: wby = the monster whose turn fired it (as byRun stamps it), or none (a stage hazard's)
    H.shot = async (d, wby) => { const D = H.D(), me = D.me; const out = []; for (let t = 0; t < 3; t++) { H.prep(false); const h0 = me.hp; const b = { x: me.x, y: me.y - 0.3, vx: 0, vy: 0, r: 1.4, dmg: d, life: 3, t: 0, color: '#FF5C9A', core: '#FFE3F0', style: 'orb' }; if (wby) b.wby = wby; D.eshots.push(b);
        for (let k = 0; k < 40 && b.life > 0; k++) await H.frames(1); out.push(h0 - me.hp); b.life = 0; await H.frames(2); }
      out.sort((a, b) => a - b); return out[1]; };
    // an enemy damage zone (a DoT: ticks of dps * 0.3) under the pet
    H.zone = async (dps, wby) => { const D = H.D(), me = D.me; const out = []; for (let t = 0; t < 3; t++) { H.prep(false); const h0 = me.hp; const z = { kind: 'pool', x: me.x, y: me.y, r: 2.2, life: 2, max: 2, dps, tick: 0, own: 'enemy', color: '#9BE07A' }; if (wby) z.wby = wby; D.zones.push(z);
        let k = 0; while (k++ < 40 && me.hp >= h0) await H.frames(1); z.life = 0; out.push(h0 - me.hp); await H.frames(2); }
      out.sort((a, b) => a - b); return out[1]; };
    // a fiend's own blow: FX.hurt (its tele, hazards and contact all go this way) and a timed tele circle on the pet
    H.fiendHurt = d => { const D = H.D(), FX = D.FD && D.FD.FX; if (!FX) return null; H.prep(true); const h0 = D.me.hp; FX.hurt(d); const x = h0 - D.me.hp; D.me.hp = D.ST.hp; return x; };
    H.fiendTele = async d => { const D = H.D(), FX = D.FD && D.FD.FX, me = D.me; if (!FX) return null; const out = []; for (let t = 0; t < 3; t++) { H.prep(false); const h0 = me.hp; FX.S.lastTeleHit = -9; FX.tele({ shape: 'circle', x: me.x, y: me.y, r: 3, t: 0.02, dmg: d });
        let k = 0; while (k++ < 30 && me.hp >= h0) await H.frames(1); out.push(h0 - me.hp); await H.frames(3); }
      out.sort((a, b) => a - b); return out[1]; };
    const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
    H.med = med;
    H.all = () => { const D = H.D(); return D.mons.concat(D.g.reserve || []); };
    // a fresh monster: made the engine's way, its health (optionally) set by hand as a stage does, then a few frames
    H.fresh = async (type, o, setHp) => { const D = H.D(), me = D.me, X = D.X; const m = X.spawnMon(type, me.x + 7, me.y + 7, Object.assign({ rift: true, pack: 9999 }, o || {})); if (setHp) { m.maxhp = m.hp = setHp; } m.aggro = false; m.cd = 99; const base = m.maxhp; await H.frames(4); const r = { base, maxhp: m.maxhp, hp: m.hp }; m.dead = true; m.hp = 0; return r; };
    H.freshLesser = async () => { const D = H.D(), me = D.me, B = window.__pp.BOSSES ? window.__pp.BOSSES.find(b => b.id === 'kharrox') : null; const m = D.lesserBoss(me.x + 7, me.y + 7, 0.35, '', B); if (!m) return null; m.aggro = false; const base = m.maxhp; await H.frames(4); const r = { base, maxhp: m.maxhp }; m.dead = true; m.hp = 0; return r; };
    H.formula = (type, el) => { const D = H.D(), F = D.F, MON = window.__pp.MON || null; return F ? { hpMul: F.hpMul, monHp: F.monHp, mHp: D.RU && D.RU.mHp } : null; };
  });
  const startRift = async (id, stage, gate) => { await page.evaluate(([id, stage, gate]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true);
      if (gate) P.startGate(id); else { const prog = P.riftState().prog; if (prog) prog[id] = Math.max(prog[id] || 0, stage); P.startRift(id, stage); } }, [id, stage, gate]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 300000 }); await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 300000 }); await page.evaluate(() => window.__bd.frames(6)); };
  const startTower = async n => { await page.evaluate(n => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.st.dun.best = Math.max(P.st.dun.best || 0, n); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(n, 7); }, n);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 300000 }); await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 300000 }); await page.evaluate(() => window.__bd.frames(6)); };
  const waitFiend = async () => { await page.waitForFunction(() => { const D = window.__pp.arc.game._dbg; return D.g.boss && D.FD && D.FD.S.started; }, null, { timeout: 300000 });
    await page.evaluate(async () => { const H = window.__bd, D = H.D(); for (let k = 0; k < 600 && D.g.boss && D.g.boss.act === 'enter'; k++) await H.frames(1); await H.frames(4); }); };

  // ---- measurements ----
  const fightStage = () => page.evaluate(async () => { const H = window.__bd, D = H.D(), P = window.__pp, all = H.all();
    const live = m => !m.dead && !m.fobj && !m.fiend;
    const crawl = all.filter(m => live(m) && m.type === 'crawler' && !m.elite && !m.calLeader && !m.boss).map(m => m.maxhp);
    const elites = all.filter(m => live(m) && m.elite && !m.calLeader && !m.boss).map(m => m.type + ':' + Math.round(m.maxhp));
    const leaders = all.filter(m => live(m) && m.calLeader).map(m => m.maxhp), guard = all.find(m => live(m) && (m.belGuard || m.calMini));
    const leech = all.filter(m => live(m) && m.type === 'leech' && !m.calLeader && !m.elite).map(m => m.maxhp);
    const r = { foeK: D.F.rift ? D.F.rift.foeK || null : 'tower', crawlerMed: H.med(crawl), crawlerN: crawl.length, leechMed: H.med(leech), leaderMed: H.med(leaders), leaderN: leaders.length, guard: guard ? guard.maxhp : null, guardBelHard: guard ? guard.belHard || 0 : null, guardName: guard ? guard.bname : null,
      elitesSample: elites.slice(0, 4) };
    // the same numbers after a long wait: never stamped twice
    r.fresh = await H.fresh('crawler'); r.freshElite = await H.fresh('crawler', { elite: true }); r.freshSet = await H.fresh('leech', null, 1234); r.lesser = await H.freshLesser();
    const keep = D.X.spawnMon('crawler', D.me.x + 6, D.me.y - 6, { rift: true, pack: 9998 }); keep.aggro = false; keep.cd = 99; await H.frames(4); r.keptAs = all.some(m => live(m) && m.type === 'crawler' && !m.elite && !m.calLeader) ? 'floor' : 'fresh';
    const c0 = all.find(m => live(m) && m.type === 'crawler' && !m.elite && !m.calLeader) || keep; const before = c0 ? c0.maxhp : null; await H.frames(60); r.noCompound = c0 ? { before, after: c0.maxhp, same: c0.maxhp === before } : null;
    // blows
    const src = c0 || all.find(m => live(m) && !m.boss);
    r.trap = H.direct(10, null); r.contact = H.direct(10, src); r.shot = await H.shot(10, src); r.hazardShot = await H.shot(10, null); r.zone = await H.zone(40, src); r.hazardZone = await H.zone(40, null);
    if (guard) r.guardHit = H.direct(10, guard);
    keep.dead = true; keep.hp = 0;
    return r; });
  const bossStage = () => page.evaluate(async () => { const H = window.__bd, D = H.D(), b = D.g.boss, FX = D.FD && D.FD.FX, M = FX && FX.mem, P = window.__pp; if (!b) return { err: 'no boss' };
    const id = b.fiend, DEF = P.FIEND_DEFS[id], T = DEF && DEF.TUNE;
    b.stunT = 0; let kState = 1;
    if (id === 'belkharrox') kState = M.A && M.A.exposed ? T.openK : T.closedK; else if (id === 'belnhalu') kState = M.beach ? T.kBeach : M.ac && (M.ac.k === 'hunt' || M.ac.k === 'hunt2') ? T.kRear : M.rest ? T.kRest : T.kSwim; else if (id === 'beluldroth') kState = 0.62;
    await H.frames(1); const din = D.FD.dmgIn(b, 1000, {}), k = din / 1000 / kState;   // (k: the blow factor with the state's armour taken out)
    const r = { id, foeK: D.F.rift && D.F.rift.foeK || null, maxhp: b.maxhp, bars: D.FD.S.bars, barHP: D.FD.barHP, effHpMem: M.effHp || null, amp: M.amp || M.hpAmp || null, k, effHp: b.maxhp / k, belHard: b.belHard || 0 };
    r.goal = D.FD.goal();
    r.trap = H.direct(10, null); r.contact = H.direct(10, b); r.fiendHurt = H.fiendHurt(10); r.tele = await H.fiendTele(10); r.bullet = await H.shot(10, b); r.hazardShot = await H.shot(10, null);
    r.add = await H.fresh('crawler');
    if (id === 'beluldroth') { for (let q = 0; q < 900 && b.act !== 'fight'; q++) await H.frames(1); r.act = b.act; b.stunT = 3; await H.frames(4); const w = D.FD.S.weak && D.FD.S.weak.throat; r.throat = w ? w.forward : null; b.stunT = 0; }
    return r; });
  const gateStage = () => page.evaluate(async () => { const H = window.__bd, D = H.D(); for (let k = 0; k < 900 && !D.g.boss; k++) await H.frames(1); const b = D.g.boss || D.mons.find(m => m.boss), me = D.me; const q = D.X.spawnMon('crawler', me.x + 7, me.y + 7, { pack: 9999 }); q.aggro = false; await H.frames(4);
    const r = { foeK: D.F.rift ? D.F.rift.foeK || null : null, boss: b ? b.bname : null, maxhp: b ? b.maxhp : null, belHard: b ? b.belHard : null };
    r.gate = !!(D.F.rift && D.F.rift.gate); r.trap = H.direct(10, null); r.contact = b ? H.direct(10, b) : null; r.monHit = H.direct(10, q); r.monShot = await H.shot(10, q); q.dead = true; q.hp = 0; r.fresh = await H.fresh('crawler'); return r; });

  const SC = {
    bel_d1: async () => { await startRift('belfry', 0); return fightStage(); },
    bel_d1_again: async () => { await startRift('belfry', 0); return fightStage(); },
    bel_hall: async () => { await startRift('belfry', 1); return fightStage(); },
    bel_clap: async () => { await startRift('belfry', 4); return fightStage(); },
    bel_kharrox: async () => { await startRift('belfry', 2); await waitFiend(); return bossStage(); },
    bel_kharrox_again: async () => { await startRift('belfry', 2); await waitFiend(); return bossStage(); },
    bel_d2: async () => { await startRift('belfry', 3); return fightStage(); },
    bel_nhalu: async () => { await startRift('belfry', 5); await waitFiend(); return bossStage(); },
    bel_d3: async () => { await startRift('belfry', 6); return fightStage(); },
    bel_uldroth: async () => { await startRift('belfry', 7); await waitFiend(); return bossStage(); },
    garden_f1: async () => { await startRift('garden', 0); return fightStage(); },
    tower_10: async () => { await startTower(10); return fightStage(); },
    gate_cancer: async () => { await startRift('belfry', 0, true); return gateStage(); },
  };
  const out = {};
  for (const k of Object.keys(SC)) { if (ONLY && !ONLY.includes(k)) continue; const t0 = Date.now();
    try { out[k] = await SC[k](); } catch (e) { out[k] = { err: String(e && e.message || e).slice(0, 300) }; }
    out[k].secs = Math.round((Date.now() - t0) / 1000); console.log(k, JSON.stringify(out[k])); }
  out.errors = errors.slice(0, 5);
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('page errors', JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})();
