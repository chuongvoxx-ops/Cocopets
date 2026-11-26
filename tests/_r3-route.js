// v460 R3: Rift 03 (The Mouth Beneath the Dunes) route, checkpoints, rewards and boss balance.
//  1. the route: exactly 8 stages, Dungeon 1 > Puzzle 1 > Boss 1 > Dungeon 2 > Puzzle 2 > Boss 2 > Dungeon 3 > Boss 3; three distinct
//     dungeons (their own names, lands, broods, mini bosses), two puzzles, three main bosses, the last one sealing; the labels
//  2. one complete run through the normal flow: entered at the checkpoint ("Continue"), each stage won, the end panel's next button
//     pressed for the next stage; the checkpoint after each; the seal and its rewards once; a stage cannot be finished twice
//  3. checkpoint resume and retry: a real save and page reload mid-run resumes at the same stage; a loss keeps the checkpoint; retry
//     replays the same stage; a replay of the sealed rift's last boss gives the re-clear reward, not the seal's again
//  4. the save migration: every old twelve-stage checkpoint (0..11) maps once to its new stage (never past a required stage), a new
//     save is not migrated, a migrated save loaded again is not moved again; through a real reload of an old-format save too
//  5. the three main bosses at exactly 3x v458's health and blows: the same stage started with the rift's v458 numbers (bossHpK 2,
//     no bossDmgK) and with v460's, in the same page: m.dmg x3, a blow on the pet x3, every hit (body and weak point) on the boss
//     1/3 (its effective health x3), the bar and phase cuts unchanged; a retry and a phase change do not lay it again; the brood
//     it calls, the mini bosses, the monsters and the traps unchanged
// usage: HTML=test-r3.html node tests/_r3-route.js      (SKIP=run,mig,boss to leave a part out)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let fails = 0, passes = 0; const ok = (c, s, d) => { if (c) passes++; else fails++; console.log((c ? 'ok   ' : 'FAIL ') + s + (d !== undefined && !c ? '  ' + JSON.stringify(d) : '')); };
const SKIP = (process.env.SKIP || '').split(',');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.setDefaultTimeout(600000);
  const URL = 'file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-r3.html');
  await page.goto(URL); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { localStorage.clear(); const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 32; P.riftState().seals.belfry = 1; P.riftState().seals.garden = 1; P.st.dun.best = 120; P.openMap(); P.dun.setMapTab('rift', true); });
  const E = (f, a) => page.evaluate(f, a);
  const waitState = s => page.waitForFunction(s => window.__pp.arc.state === s, s, { timeout: 120000 });
  const run = secs => page.evaluate(async secs => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, secs);
  const enter = async stage => { await page.evaluate(stage => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); if (stage == null) { P.renderRift(); const b = document.querySelector('[data-rift="sel"][data-id="dunes"]'); if (b) b.click(); document.querySelector('[data-rift="enter"]').click(); } else P.startRift('dunes', stage); }, stage); await waitState('ready'); await E(() => window.__pp.beginPlay()); await waitState('play'); await page.waitForTimeout(300); };
  const here = () => E(() => { const D = window.__pp.arc.game._dbg; return { stage: D.F.rift.stage, kind: D.F.rift.kind, name: D.F.rift.name, biome: D.F.biome, boss: D.F.fiend ? D.F.fiend.id : null }; });
  // a stage won as a player would end it: a dungeon cleared (every monster and the mini boss) and its door walked into; a puzzle's
  // rule met (the hook marks it solved) and its way on taken; a boss struck down (the last one through its sealing)
  const win = async () => { const k = (await here()).kind;
    if (k === 'boss') { await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const t0 = performance.now();   // (the fiend up and out of its entrance, then struck down)
        while (performance.now() - t0 < 60000 && !(D.g.boss && D.g.boss.act !== 'enter')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (D.M.bossAt) { D.me.x = D.M.bossAt.x; D.me.y = D.M.bossAt.y + 4; } }
        const b = D.g.boss; for (let k = 0; k < 40 && b && !b.dead && window.__pp.arc.state === 'play'; k++) { b.under = false; b.locked = false; b.stunT = 0; D.hitMon(b, 1e12, { pierce: true }); await new Promise(r => setTimeout(r, 250)); } }); }
    else { await page.evaluate(async k => { const D = window.__pp.arc.game._dbg; if (k === 'fight') { for (let j = 0; j < 4; j++) { for (const m of D.mons) if (!m.dead) { m.guardFn = null; m.under = false; m.act = m.act === 'guard' ? 'move' : m.act; D.hitMon(m, 1e12, { flat: true, pierce: true }); } if (D.g.reserve) D.g.reserve.length = 0; await new Promise(r => setTimeout(r, 250)); } } else D.RIFT.finish(); await new Promise(r => setTimeout(r, 300)); const e = D.RIFT.exit; if (e) { D.me.x = e.x; D.me.y = e.y; } else D.X.winStage(); }, k); }
    await waitState('end'); await page.waitForTimeout(k === 'boss' ? 1200 : 900); };
  const rs = () => E(() => JSON.parse(JSON.stringify({ prog: window.__pp.riftState().prog.dunes || 0, sealed: !!window.__pp.riftState().seals.dunes, ver: window.__pp.riftState().ver.dunes, crystals: window.__pp.st.crystals || 0, pearls: window.__pp.st.pearls || 0, gate: window.__pp.gateOpen('dunes') })));
  const panel = () => E(() => { const p = document.getElementById('arcPanel'); const nx = p.querySelector('[data-arc="next"]'); return { h2: (p.querySelector('h2') || {}).textContent, eyebrow: (p.querySelector('.eyebrow') || {}).textContent, next: nx ? nx.textContent.trim() : null, rewards: [...p.querySelectorAll('.rewards li span')].map(s => s.textContent) }; });

  // ---- 1. the route ----
  const R = await E(() => { const P = window.__pp, Rf = P.RIFT_BY_ID.dunes; return { kinds: Rf.stages.map(s => s.kind).join(','), names: Rf.stages.map(s => s.name), biomes: Rf.stages.map(s => s.biome || Rf.biome), minis: Rf.stages.map(s => s.mini || null), mobs: Rf.stages.map(s => (s.mobs || Rf.mons).join('+')), bosses: Rf.stages.filter(s => s.kind === 'boss').map(s => s.boss), seal: Rf.stages.map(s => !!s.seal), labels: Rf.stages.map((s, i) => P.__extra ? null : null), ver: Rf.VER }; });
  // the labels as the game shows them: the stage's line under its name as it loads (launchArc: riftStageLabel · name)
  const labelsOf = async id => { const out = []; const n = await E(id => window.__pp.RIFT_BY_ID[id].stages.length, id);
    for (let i = 0; i < n; i++) { await page.evaluate(([id, i]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.st.unlockAll = true; P.startRift(id, i); }, [id, i]); await waitState('ready');
      out.push(await E(() => document.getElementById('arcGoal').textContent.split(' · ').slice(0, 2).join(' · '))); }
    await E(() => { const P = window.__pp; P.closeArcade(true); P.st.unlockAll = false; }); return out; };
  const labels = await labelsOf('dunes');
  console.log('route', R.kinds, '|', R.names.join(' > ')); console.log('labels', labels.join(' > '));
  ok(R.kinds === 'fight,puzzle,boss,fight,puzzle,boss,fight,boss', 'eight stages: dungeon, puzzle, boss, dungeon, puzzle, boss, dungeon, boss', R.kinds);
  const fi = [0, 3, 6]; ok(R.kinds.split(',').filter(k => k === 'fight').length === 3 && R.kinds.split(',').filter(k => k === 'puzzle').length === 2 && R.bosses.length === 3, 'exactly three dungeons, two puzzles, three main bosses');
  ok(new Set(fi.map(i => R.names[i])).size === 3 && new Set(fi.map(i => R.biomes[i])).size === 3 && new Set(fi.map(i => R.minis[i])).size === 3, 'the three dungeons are distinct: names, lands (dunes, mesa, nightdune), mini bosses', fi.map(i => [R.names[i], R.biomes[i], R.minis[i], R.mobs[i]]));
  ok(R.names[0] === 'The Buried Road' && R.names[1] === 'The Sandstorm Flight' && R.names[3] === 'The Rust Flats' && R.names[4] === 'The Echo Chamber' && R.names[6] === 'The Moonlit Barrows', 'the stages in order: the Buried Road, the Sandstorm Flight, Sarrukh, the Rust Flats, the Echo Chamber, Oneira, the Moonlit Barrows, Thul-Ammon', R.names);
  ok(R.bosses.join() === 'sarrukh,oneira,thulammon' && R.seal.join() === 'false,false,false,false,false,false,false,true', 'Sarrukh, Oneira, Thul-Ammon; only the last seals the rift');
  ok(labels.join('|') === 'Section 1 · Dungeon 1|Section 1 · Puzzle 1|Section 1 · Boss 1|Section 2 · Dungeon 2|Section 2 · Puzzle 2|Section 2 · Boss 2|Section 3 · Dungeon 3|Section 3 · Boss 3', 'labels: Dungeon 1, Puzzle 1, Boss 1, Dungeon 2, Puzzle 2, Boss 2, Dungeon 3, Boss 3', labels);
  const other = (await labelsOf('garden')).join('|');
  ok(/Section 2 · Dungeon 1/.test(other), 'the other rifts keep their per-section labels (the Garden: Section 2 · Dungeon 1)', other);

  // ---- 2. one complete run, 3. resume / retry ----
  if (!SKIP.includes('run')) {
    let s = await rs(); ok(s.prog === 0 && !s.sealed && s.ver === 2, 'a new save: checkpoint stage 1, layout version 2 (not migrated)', s);
    const played = [], c0 = s.crystals;
    for (let step = 0; step < 8; step++) {
      if (step === 0) await enter(null);   // ("Enter" on the rift's card: its checkpoint)
      const h = await here(); played.push(h);
      if (step === 1) {   // a loss keeps the checkpoint; retry replays the same stage
        await E(() => { const P = window.__pp; P.arcFinish(false, 0, 0, 'test loss', {}); }); await page.waitForTimeout(900);
        s = await rs(); const pn = await panel(); ok(s.prog === 1 && /fell/.test(pn.h2) && pn.next === null, 'a loss on stage 2: the checkpoint stays at stage 2, no next button', { s, pn });
        await E(() => document.querySelector('#arcPanel [data-arc="retry"]').click()); await waitState('ready'); await E(() => window.__pp.beginPlay()); await waitState('play'); await page.waitForTimeout(300);
        const h2 = await here(); ok(h2.stage === 1 && h2.name === h.name, 'retry: the same stage again (the Sandstorm Flight)', h2);
      }
      if (step === 3) {   // a real save and reload in the middle of the run: "Continue" resumes at the checkpoint
        await E(() => { const P = window.__pp; P.closeArcade(true); P.saveLocalNow(); });
        await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st && window.__pp.st.name === 'Bot', null, { timeout: 120000 }); await page.waitForTimeout(500);
        await E(() => { const P = window.__pp; P.st.dun.god = true; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
        s = await rs(); ok(s.prog === 3 && s.ver === 2, 'saved and reloaded after Sarrukh: the checkpoint is stage 4 (the Rust Flats), not moved by the migration', s);
        await enter(null); const h3 = await here(); ok(h3.stage === 3 && h3.name === 'The Rust Flats', 'Continue after the reload: the Rust Flats', h3); played[played.length - 1] = h3;
      }
      const cr0 = (await rs()).crystals;
      await win(); s = await rs(); const pn = await panel();
      const last = step === 7;
      ok(last ? (s.sealed && s.prog === 0) : s.prog === step + 1, `stage ${step + 1} (${played[step].name}) won: checkpoint ${last ? 'reset, the rift sealed' : 'stage ' + (step + 2)}`, { s, pn });
      if (!last) { const nextName = await E(i => window.__pp.RIFT_BY_ID.dunes.stages[i].name, step + 1); ok(pn.next && pn.next.includes(nextName), `  the end panel offers the next stage: ${nextName}`, pn); }
      // the same stage cannot be finished twice (a second finish call is ignored: no second reward, no second checkpoint step)
      const before2 = await rs(); await E(() => { const P = window.__pp; P.arcFinish(true, 3, 0, '', { coins: 0 }); }); await page.waitForTimeout(200); const after2 = await rs();
      ok(JSON.stringify(before2) === JSON.stringify(after2), '  a second finish for the same stage changes nothing', { before2, after2 });
      if (last) { ok(s.crystals - cr0 === 300 && s.gate, '  the seal: +300 crystals once, the Amber Vigil open', { got: s.crystals - cr0, gate: s.gate }); break; }
      await E(() => document.querySelector('#arcPanel [data-arc="next"]').click()); await waitState('ready'); await E(() => window.__pp.beginPlay()); await waitState('play'); await page.waitForTimeout(300);
    }
    const seq = played.map(p => p.kind + ':' + (p.boss || p.name));
    console.log('played', seq.join(' > '));
    ok(played.length === 8 && played.map(p => p.stage).join() === '0,1,2,3,4,5,6,7', 'one complete run: eight stages played, in order, none skipped, none twice', seq);
    ok(played.filter(p => p.kind === 'fight').length === 3 && played.filter(p => p.kind === 'puzzle').length === 2 && played.filter(p => p.kind === 'boss').length === 3, '  three dungeons, two puzzles, three bosses played');
    ok(new Set(played.filter(p => p.kind === 'fight').map(p => p.biome)).size === 3, '  the three dungeons in their three lands', played.filter(p => p.kind === 'fight').map(p => p.biome));
    // the sealed rift's last boss replayed: the re-clear reward (+60), never the seal's again
    await E(() => document.querySelector('#arcPanel [data-arc="retry"]').click()); await waitState('ready'); await E(() => window.__pp.beginPlay()); await waitState('play'); await page.waitForTimeout(300);
    const cr1 = (await rs()).crystals; const hh = await here(); await win(); const s2 = await rs(); const pn2 = await panel();
    ok(hh.boss === 'thulammon' && s2.crystals - cr1 === 60 && s2.sealed && /Sealed again/.test(pn2.h2), 'Thul-Ammon replayed after the seal: +60 crystals (already sealed), not the seal\'s +300', { hh, got: s2.crystals - cr1, pn2 });
    await E(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); });
  }

  // ---- 4. the migration ----
  if (!SKIP.includes('mig')) {
    const M = await E(() => { const P = window.__pp, base = P.serialize(), out = [];
      for (let k = 0; k < 12; k++) { const o = JSON.parse(JSON.stringify(base)); o.rift.prog.dunes = k; o.rift.ver = { belfry: 4, garden: 2 }; delete o.rift.seals.dunes; const s = P.sanitize(o); out.push([k, s.rift.prog.dunes, s.rift.ver.dunes]); }
      const o2 = JSON.parse(JSON.stringify(base)); o2.rift.prog.dunes = 3; o2.rift.ver.dunes = 2; const s2 = P.sanitize(o2);
      const o3 = JSON.parse(JSON.stringify(base)); o3.rift.prog.dunes = 9; o3.rift.ver = { belfry: 4, garden: 2 }; const s3 = P.sanitize(o3); const s4 = P.sanitize(JSON.parse(JSON.stringify(Object.assign({}, s3))));
      const o5 = JSON.parse(JSON.stringify(base)); delete o5.rift; const s5 = P.sanitize(o5);
      const o6 = JSON.parse(JSON.stringify(base)); o6.rift.prog.dunes = 7; o6.rift.ver = {}; o6.rift.prog.garden = 5; const s6 = P.sanitize(o6);
      return { out, keep: s2.rift.prog.dunes, twice: [s3.rift.prog.dunes, s4.rift.prog.dunes], norift: [s5.rift.prog.dunes || 0, s5.rift.ver.dunes], garden: s6.rift.prog.garden, dunes6: s6.rift.prog.dunes }; });
    console.log('migration (old -> new):', M.out.map(r => r[0] + '->' + r[1]).join(' '));
    const want = [0, 1, 1, 2, 3, 3, 5, 5, 6, 7, 7, 7];
    ok(M.out.every(r => r[1] === want[r[0]] && r[2] === 2), 'every old checkpoint 0..11 moves once to 0,1,1,2,3,3,5,5,6,7,7,7 (version 2 set)', M.out);
    // never past a required stage: each new checkpoint's earlier stages were all done in the old route (by what each stage is)
    const OLD = ['f:Buried Road', 'f:Tooth Courts', 'p:Flight', 'b:sarrukh', 'p:Echo', 'f:Rust Flats', 'f:Crystal Scar', 'b:oneira', 'f:Moonlit Barrows', 'p:Mounds', 'f:Throat', 'b:thulammon'], NEW = ['f:Buried Road', 'p:Flight', 'b:sarrukh', 'f:Rust Flats', 'p:Echo', 'b:oneira', 'f:Moonlit Barrows', 'b:thulammon'];
    ok(want.every((n, k) => NEW.slice(0, n).every(x => OLD.slice(0, k).includes(x))), 'no old checkpoint skips a stage it had not done (each new checkpoint\'s earlier stages were all played)');
    ok(M.keep === 3, 'a v460 save (version 2) keeps its checkpoint (3 stays 3)', M.keep);
    ok(M.twice[0] === 7 && M.twice[1] === 7, 'a migrated save loaded again is not moved again (9 -> 7, then 7)', M.twice);
    ok(M.norift[0] === 0 && M.norift[1] === 2, 'a save with no rift data: stage 1, version 2', M.norift);
    ok(M.dunes6 === 5, 'an old save at Oneira (7) goes to Oneira (5)', M.dunes6);
    // through a real reload of an old-format save
    // (the live state put back to how a v458 save holds it, then saved and reloaded: the boot's own load path, sanitize and its migration)
    await E(() => { const P = window.__pp, r = P.riftState(); r.prog.dunes = 6; delete r.seals.dunes; r.ver = { belfry: 4, garden: 2 }; P.saveLocalNow(); });
    await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st && window.__pp.st.name === 'Bot', null, { timeout: 120000 }); await page.waitForTimeout(500);
    const s7 = await rs(); ok(s7.prog === 5 && s7.ver === 2 && !s7.sealed, 'a real reload of an old save at the Crystal Scar (6): Oneira (5), version 2', s7);
  }

  // ---- 5. the bosses: exactly 3x ----
  if (!SKIP.includes('boss')) {
    await E(() => { const P = window.__pp; P.st.dun.god = false; /* (the pet must take the blow: its health is topped up while waiting) */ P.st.energy = 100; P.st.dlv = 32; P.st.unlockAll = true; });
    const probe = async (stage, v458) => { await page.evaluate(([stage, v458]) => { const Rf = window.__pp.RIFT_BY_ID.dunes; window.__r3keep = window.__r3keep || { hp: Rf.bossHpK, dmg: Rf.bossDmgK }; if (v458) { Rf.bossHpK = 2; delete Rf.bossDmgK; } else { Rf.bossHpK = window.__r3keep.hp; Rf.bossDmgK = window.__r3keep.dmg; } }, [stage, v458]);
      await enter(stage);
      return page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, me = D.me; const t0 = performance.now(); while (performance.now() - t0 < 60000 && !(D.g.boss && D.g.boss.act !== 'enter')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (D.M.bossAt) { D.me.x = D.M.bossAt.x; D.me.y = D.M.bossAt.y + 4; } }
        const b = D.g.boss, FX = D.FD.FX, FD = D.F.fiend, cuts = [0.5, 0.75, 0.25];
        // a blow on the boss's body and on a weak point (the 1/foeK.boss the fight applies to every hit)
        b.stunT = 0; b.under = false; const hp0 = b.hp; D.hitMon(b, 10000, { flat: true }); const body = hp0 - b.hp; b.hp = b.maxhp;
        const w = FX.weak('r3probe', b.x, b.y, 1, 2.4 / (D.F.rift.foeK.boss || 1), true); const hp1 = b.hp; if (w) D.hitMon(w, 10000, { flat: true }); const weak = hp1 - b.hp; FX.weak('r3probe', 0, 0, 0, 0, false); b.hp = b.maxhp;
        // a blow of its own on the pet (god off for it, the pet's guards cleared)
        const god = P.st.dun.god; D.g.god = false; P.st.dun.god = false; me.inv = 0; me.dodge = null; me.dash = null; D.g.shieldT = 0; D.g.guardHP = 0; me.hp = 1e7; /* (a deep pool: the blow measured whole, not stopped at the pet's health) */ const ph0 = me.hp; const landed = D.FD.FX.hurt(b.dmg); const onPet = ph0 - me.hp, petMax = D.ST.hp; me.hp = D.ST.hp; P.st.dun.god = god;
        // a minion it calls (as its own act does) and a shot of its own
        const mn = FX.minion(D.F.fiend.id === 'sarrukh' ? 'skitter' : 'grub', b.x + 3, b.y + 3); const minion = mn ? { hp: mn.maxhp, dmg: mn.dmg } : null; if (mn) mn.dead = true;
        // a phase change: the phase's cut and m.dmg after it
        const d0 = b.dmg, ph = D.FD.S.phase; b.hp = b.maxhp * 0.49; for (let k = 0; k < 120; k++) { me.hp = D.ST.hp; P.arc.game.update(1 / 60); } const phase2 = D.FD.S.phase, d1 = b.dmg;
        return { boss: FD.id, maxhp: b.maxhp, bars: FD.bars, dmgK: FD.dmgK, mdmg: d0, foeK: D.F.rift.foeK, body, weak, onPet, petMax, landed, minion, phase: [ph, phase2], dmgAfterPhase: d1, ease: window.__pp.RIFT_BY_ID.dunes.ease }; }); };
    for (const [stage, nm] of [[2, 'Sarrukh'], [5, 'Oneira'], [7, 'Thul-Ammon']]) {
      const a = await probe(stage, true), b = await probe(stage, false), b2 = await probe(stage, false);
      console.log(`  ${nm} v458 ${JSON.stringify(a)}\n  ${nm} v460 ${JSON.stringify(b)}`);
      const r3 = (x, y) => Math.abs(x / y - 3) < 1e-9;
      ok(r3(b.mdmg, a.mdmg) && r3(b.dmgK, a.dmgK), `${nm}: its blow (m.dmg) exactly 3x v458's (${a.mdmg.toFixed(2)} -> ${b.mdmg.toFixed(2)})`);
      ok(b.landed && a.landed && Math.abs(b.onPet / a.onPet - 3) < 1e-6, `${nm}: a blow of its own on the pet 3x (${a.onPet.toFixed(1)} -> ${b.onPet.toFixed(1)}; the rift's x2 foe blow on both)`, { a: a.onPet, b: b.onPet });
      ok(Math.abs(a.body / b.body - 3) < 1e-6 && Math.abs(a.weak / b.weak - 3) < 1e-6, `${nm}: every hit counts 1/3 (body ${a.body.toFixed(1)} -> ${b.body.toFixed(1)}, weak point ${a.weak.toFixed(1)} -> ${b.weak.toFixed(1)}): its effective health exactly 3x`, { a, b });
      ok(b.foeK.boss === 3 * a.foeK.boss && b.maxhp === a.maxhp && b.bars === a.bars, `${nm}: foeK.boss ${a.foeK.boss} -> ${b.foeK.boss}; the bar (${b.bars} bars, ${b.maxhp}) and so the phase cuts unchanged`);
      ok(b.phase[1] === a.phase[1] && b.phase[1] > b.phase[0] && b.dmgAfterPhase === b.mdmg && a.dmgAfterPhase === a.mdmg, `${nm}: at 49% it enters phase ${b.phase[1]} as before; its blow not raised again by the phase`, { a: [a.phase, a.dmgAfterPhase], b: [b.phase, b.dmgAfterPhase] });
      ok(b2.mdmg === b.mdmg && b2.foeK.boss === b.foeK.boss, `${nm}: a retry starts it at the same numbers (not stacked)`, { b: b.mdmg, b2: b2.mdmg });
      ok(JSON.stringify(a.minion) === JSON.stringify(b.minion) && a.foeK.mon === b.foeK.mon && a.foeK.mini === b.foeK.mini && a.foeK.dmg === b.foeK.dmg, `${nm}: the brood it calls (${JSON.stringify(b.minion)}), the monsters, mini bosses and the rift's foe blow unchanged`, { a: [a.minion, a.foeK], b: [b.minion, b.foeK] });
    }
    // a dungeon: monsters, the mini boss and the traps the same with the v458 and the v460 boss numbers
    const dprobe = async v458 => { await page.evaluate(v458 => { const Rf = window.__pp.RIFT_BY_ID.dunes; if (v458) { Rf.bossHpK = 2; delete Rf.bossDmgK; } else { Rf.bossHpK = window.__r3keep.hp; Rf.bossDmgK = window.__r3keep.dmg; } Rf.stages[0].__mod = Rf.stages[0].__mod || Rf.stages[0].mod; Rf.stages[0].mod = null; /* (no rolled hand of rules: the same floor numbers both times) */ }, v458); await enter(0); await run(1.5);
      return E(() => { const D = window.__pp.arc.game._dbg, TR = window.DUNE_TRAPS, Fs = TR ? TR.fields() : [], F = Fs[Fs.length - 1]; const mon = D.mons.find(m => m.type === 'skitter' && !m.dead && !m.elite && !(m.affixes && m.affixes.length)), mini = D.mons.find(m => m.lesser && !m.dead);
        return { monHp: mon && mon.maxhp, monDmg: mon && mon.dmg, miniHp: mini && mini.maxhp, miniDmg: mini && mini.dmg, trap: F && TR.dmg ? ['sink', 'tooth', 'res'].map(k => +TR.dmg(F, k).toFixed(3)) : null, foeK: D.F.rift.foeK }; }); };
    const da = await dprobe(true), db = await dprobe(false);
    ok(da.monHp === db.monHp && da.monDmg === db.monDmg && da.miniHp === db.miniHp && da.miniDmg === db.miniDmg && JSON.stringify(da.trap) === JSON.stringify(db.trap) && da.trap, 'the Buried Road: a skitter, the mini boss and the traps hit and last exactly as before', { da, db });
    await E(() => { const Rf = window.__pp.RIFT_BY_ID.dunes; Rf.bossHpK = window.__r3keep.hp; Rf.bossDmgK = window.__r3keep.dmg; Rf.stages[0].mod = Rf.stages[0].__mod; delete Rf.stages[0].__mod; const P = window.__pp; if (P.arc.open) P.closeArcade(true); });
  }
  console.log('page errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(`${passes} passed, ${fails} failed`); await browser.close(); process.exit(fails ? 1 : 0);
})().catch(async e => { console.error(e); process.exit(2); });
