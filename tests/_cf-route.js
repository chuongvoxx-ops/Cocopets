// v466 CF: the Blackfire Caldera (Rift 0) route, stage by stage, as a player goes through it.
//  1. the route: nine stages, Dungeon > Puzzle > Boss three times (the Cinder Galleries, the Ashen Hollows, Fire Flan, the Rimebound
//     Forge, the Runebound Foundry, the Bomb King, the Glass Heart, the Heartward Descent, Ifrit), labelled Section n · Dungeon/Puzzle/Boss
//  2. one complete run from a fresh save: "Enter" on the rift's card, each stage won the way it ends in play (a dungeon cleared and its
//     door walked into; the Ashen Hollows solved for real: the brood, the hatch, the frost released, the bridge set, its door walked
//     into; the other two puzzles finished and their door taken; a boss struck down), the end panel's next button TAPPED for the next
//     stage, its ready card's Start; the checkpoint after each; the seal once
//  3. Section 1 Puzzle 1 then Lobby, and a real save + reload: "Continue" takes the player to Fire Flan (not back to the puzzle)
//  4. a sealed rift played again: its replay checkpoint moves on with the run (v466 CF), so leaving after Puzzle 1 and coming back
//     does not start the player again at Dungeon 1; Start over still resets it; the seal's rewards are not given again
//  5. the save: an affected save (sealed, at the start) and an unsealed checkpoint survive sanitize and a reload; old saves without the
//     replay checkpoint load as before
// usage: HTML=test-cf.html node tests/_cf-route.js      (SKIP=run,seal,save to leave a part out)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let fails = 0, passes = 0; const ok = (c, s, d) => { if (c) passes++; else fails++; console.log((c ? 'ok   ' : 'FAIL ') + s + (d !== undefined && !c ? '  ' + JSON.stringify(d) : '')); };
const SKIP = (process.env.SKIP || '').split(',');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.setDefaultTimeout(600000);
  const URL = 'file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-cf.html');
  await page.goto(URL); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { localStorage.clear(); const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); });
  const E = (f, a) => page.evaluate(f, a);
  const waitState = s => page.waitForFunction(s => window.__pp.arc.state === s, s, { timeout: 300000 });
  const clearGift = () => E(() => { const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const start = async () => { await waitState('ready'); await clearGift(); await page.tap('#arcReady button.btn.primary'); await waitState('play'); await page.waitForTimeout(300); };
  // "Enter" / "Continue" / "Enter again" on the rift's card, as a player taps it
  const enterCard = async () => { await E(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.renderRift(); const b = document.querySelector('[data-rift="sel"][data-id="caldera"]'); if (b) b.click(); });
    const card = await E(() => ({ btn: (document.querySelector('[data-rift="enter"]') || {}).textContent, note: (document.querySelector('.rf-hero .note') || {}).textContent }));
    await page.tap('[data-rift="enter"]'); await start(); return card; };
  const here = () => E(() => { const D = window.__pp.arc.game._dbg; return { stage: D.F.rift.stage, kind: D.F.rift.kind, name: D.F.rift.name, biome: D.F.biome, boss: D.F.fiend ? D.F.fiend.id : null }; });
  const rs = () => E(() => { const R = window.__pp.riftState(); return JSON.parse(JSON.stringify({ prog: R.prog.caldera || 0, re: (R.replay || {}).caldera, sealed: !!R.seals.caldera, crystals: window.__pp.st.crystals || 0, accs: (window.__pp.st.accs || []).filter(a => a.sp === 'ember').length })); });
  const panel = () => E(() => { const p = document.getElementById('arcPanel'); const nx = p.querySelector('[data-arc="next"]'); return { h2: (p.querySelector('h2') || {}).textContent, eyebrow: (p.querySelector('.eyebrow') || {}).textContent, next: nx ? nx.textContent.trim() : null }; });
  // a stage won as a player ends it
  const win = async () => { const h = await here();
    if (h.kind === 'boss') await E(async () => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); const fr = () => new Promise(r => requestAnimationFrame(r));
      while (performance.now() - t0 < 60000 && !(D.g.boss && D.g.boss.act !== 'enter')) { await fr(); D.me.hp = D.ST.hp; }
      const b = D.g.boss; for (let k = 0; k < 80 && b && !b.dead && window.__pp.arc.state === 'play'; k++) { b.under = false; b.locked = false; b.stunT = 0; D.hitMon(b, 1e12, { pierce: true, flat: true }); D.me.hp = D.ST.hp; await new Promise(r => setTimeout(r, 250)); } });
    else if (h.kind === 'fight') await E(async () => { const D = window.__pp.arc.game._dbg; const t0 = performance.now();
      while (performance.now() - t0 < 120000 && !D.RIFT.done) { for (const m of D.mons) if (!m.dead) { m.guardFn = null; m.under = false; D.hitMon(m, 1e12, { flat: true, pierce: true }); } if (D.g.reserve) D.g.reserve.length = 0; D.me.hp = D.ST.hp; await new Promise(r => setTimeout(r, 250)); } });
    else if (h.name === 'The Ashen Hollows') await E(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const t0 = performance.now(), sleep = ms => new Promise(r => setTimeout(r, ms));
      while (performance.now() - t0 < 240000 && !mod.brood.done) { for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e12, { flat: true, pierce: true }); const R = mod.rooms[mod.brood.i]; if (R && mod.brood.wave < 0) { D.me.x = R.spots[0].x; D.me.y = R.spots[0].y; } D.me.hp = D.ST.hp; await sleep(200); }
      while (performance.now() - t0 < 260000 && !mod.hatch.open) await sleep(200);
      D.me.x = 15.5; D.me.y = 17; await sleep(800); mod.release(); while (performance.now() - t0 < 300000 && !mod.S.latched) { D.me.hp = D.ST.hp; await sleep(200); } });
    else await E(async () => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e12, { flat: true, pierce: true }); D.RIFT.finish(); await new Promise(r => setTimeout(r, 300)); if (!D.RIFT.exit) D.RIFT.self.amb.C.X.winStage(); });
    // the way on: walked into, as a player does (not for a boss: its fall ends the stage)
    if (h.kind !== 'boss') await E(async () => { const D = window.__pp.arc.game._dbg, ex = D.RIFT.exit; if (!ex || D.g.won) return; D.me.x = ex.x; D.me.y = ex.y + 2.2; const t0 = performance.now();
      while (performance.now() - t0 < 30000 && !D.g.won) { D.me.x += (ex.x - D.me.x) * 0.2; D.me.y += (ex.y - D.me.y) * 0.2; D.me.hp = D.ST.hp; await new Promise(r => requestAnimationFrame(r)); } });
    await waitState('end'); await page.waitForTimeout(h.kind === 'boss' ? 1400 : 900); return h; };

  // ---- 1. the route ----
  const R = await E(() => { const P = window.__pp, Rf = P.RIFT_BY_ID.caldera; return { kinds: Rf.stages.map(s => s.kind).join(','), names: Rf.stages.map(s => s.name), bosses: Rf.stages.filter(s => s.kind === 'boss').map(s => s.boss), seal: Rf.stages.map(s => !!s.seal), labels: Rf.stages.map((s, i) => P.riftStageLabel ? P.riftStageLabel(Rf, i) : null) }; });
  console.log('route', R.kinds, '|', R.names.join(' > '));
  ok(R.kinds === 'fight,puzzle,boss,fight,puzzle,boss,fight,puzzle,boss', 'nine stages: dungeon, puzzle, boss three times', R.kinds);
  ok(R.names[1] === 'The Ashen Hollows' && R.names[2] === 'Fire Flan' && R.names[4] === 'The Runebound Foundry' && R.names[7] === 'The Heartward Descent', 'Puzzle 1 the Ashen Hollows, then Fire Flan; the Runebound Foundry and the Heartward Descent', R.names);
  ok(R.bosses.join() === 'calflan,calbomb,califrit' && R.seal.join() === 'false,false,false,false,false,false,false,false,true', 'Fire Flan, the Bomb King, Ifrit; only Ifrit seals', R);

  // ---- 2. one complete run from a fresh save; 3. Puzzle 1 then Lobby, a real save and reload, Continue ----
  if (!SKIP.includes('run')) {
    let s = await rs(); ok(s.prog === 0 && !s.sealed, 'a fresh save: checkpoint stage 1', s);
    const played = []; let c0 = s.crystals;
    for (let step = 0; step < 9; step++) {
      if (step === 0) { const card = await enterCard(); ok(/Enter/.test(card.btn), 'the card says Enter', card); }
      const h = await here(); played.push(h);
      const cr0 = (await rs()).crystals;
      await win(); s = await rs(); const pn = await panel(); const last = step === 8;
      ok(last ? (s.sealed && s.prog === 0) : s.prog === step + 1, `stage ${step + 1} (${h.name}) won: ${last ? 'the rift sealed' : 'checkpoint stage ' + (step + 2)}`, { s, pn });
      if (last) { ok(s.crystals - cr0 === 300 && s.accs === 1, '  the seal: +300 crystals and the Ember Charm, once', { got: s.crystals - cr0, accs: s.accs }); break; }
      const nextName = R.names[step + 1]; ok(pn.next && pn.next.includes(nextName), `  the end panel offers the next stage: ${nextName}`, pn);
      if (step === 1) {   // 3. after Puzzle 1: the Lobby, a real save and reload, Continue → Fire Flan
        await page.tap('#arcPanel [data-arc="map"]'); await page.waitForTimeout(400);
        await E(() => window.__pp.saveLocalNow()); await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st && window.__pp.st.name === 'Bot', null, { timeout: 120000 }); await page.waitForTimeout(600);
        await E(() => { window.__pp.st.dun.god = true; }); await clearGift();
        s = await rs(); ok(s.prog === 2, '  Puzzle 1 won, Lobby, saved and reloaded: the checkpoint is Fire Flan (stage 3)', s);
        const card = await enterCard(); const h2 = await here();
        ok(/Continue/.test(card.btn) && /stage 3 of 9/.test(card.note) && h2.boss === 'calflan', '  Continue on the card: Fire Flan', { card, h2 });
        continue;
      }
      await page.tap('#arcPanel [data-arc="next"]'); await start();
      const h2 = await here(); ok(h2.stage === step + 1, `  next: stage ${step + 2} is playing (${h2.name})`, h2);
    }
    const seq = played.map(p => p.kind + ':' + (p.boss || p.name));
    console.log('played', seq.join(' > '));
    ok(played.length === 9 && played.map(p => p.stage).join() === '0,1,2,3,4,5,6,7,8', 'one complete run: nine stages played, in order, none skipped, none twice', seq);
  }

  // ---- 4. the sealed rift played again ----
  if (!SKIP.includes('seal')) {
    await E(() => { const P = window.__pp, R = P.riftState(); if (P.arc.open) P.closeArcade(true); R.seals.caldera = 1; R.prog.caldera = 0; if (R.replay) delete R.replay.caldera; P.st.dun.god = true; });
    const c0 = (await rs()).crystals, a0 = (await rs()).accs;
    let card = await enterCard(); let h = await here(); ok(/Enter again/.test(card.btn) && h.stage === 0, 'sealed: Enter again starts at Dungeon 1', { card, h });
    await win(); await page.tap('#arcPanel [data-arc="next"]'); await start(); h = await here(); ok(h.stage === 1, 'sealed: next, the Ashen Hollows', h);
    await win(); let pn = await panel(); ok(pn.next && /Fire Flan/.test(pn.next), 'sealed: Puzzle 1 solved, the panel offers Fire Flan', pn);
    let s = await rs(); ok(s.sealed && s.prog === 0 && s.re === 2, 'sealed: the seal kept, the replay checkpoint at Fire Flan (stage 3)', s);
    await page.tap('#arcPanel [data-arc="map"]'); await page.waitForTimeout(400);
    await E(() => window.__pp.saveLocalNow()); await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st && window.__pp.st.name === 'Bot', null, { timeout: 120000 }); await page.waitForTimeout(600); await E(() => { window.__pp.st.dun.god = true; }); await clearGift();
    s = await rs(); ok(s.re === 2 && s.sealed, 'sealed: the replay checkpoint survives a save and reload', s);
    card = await enterCard(); h = await here();
    ok(/Continue/.test(card.btn) && h.boss === 'calflan', 'sealed: the card now says Continue and goes on to Fire Flan (the player is no longer sent back to Dungeon 1)', { card, h });
    await win(); s = await rs(); ok(s.re === 3, 'sealed: Fire Flan won, the replay checkpoint moves on (stage 4)', s);
    // Start over clears it
    await page.tap('#arcPanel [data-arc="map"]'); await E(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); P.renderRift(); }); await page.waitForTimeout(300);
    await page.tap('[data-rift="restart"]'); s = await rs(); ok(!s.re && s.prog === 0 && s.sealed, 'Start over: the replay checkpoint cleared, the seal kept', s);
    // the last boss on a replay: the re-clear reward, never the seal's again; the replay checkpoint back to the start
    await E(() => { const P = window.__pp; P.riftState().replay = Object.assign(P.riftState().replay || {}, { caldera: 8 }); });
    card = await enterCard(); h = await here(); ok(h.boss === 'califrit', 'sealed: a replay checkpoint at Ifrit: Continue goes to Ifrit', { card, h });
    const cr = (await rs()).crystals; await win(); s = await rs(); pn = await panel();
    ok(s.crystals - cr === 60 && s.accs === a0 && /Sealed again/.test(pn.h2) && !s.re, 'Ifrit replayed: +60 crystals (no second seal, no second charm), the replay checkpoint back to the start', { got: s.crystals - cr, s, pn });
    await E(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); });
  }

  // ---- 5. the save ----
  if (!SKIP.includes('save')) {
    const M = await E(() => { const P = window.__pp, base = P.serialize(), out = {};
      const o1 = JSON.parse(JSON.stringify(base)); o1.rift.seals.caldera = 1; o1.rift.prog.caldera = 0; delete o1.rift.replay; out.old = P.sanitize(o1).rift;
      const o2 = JSON.parse(JSON.stringify(base)); o2.rift.seals.caldera = 1; o2.rift.replay = { caldera: 5, bogus: 'x', Bad: 3 }; out.kept = P.sanitize(o2).rift;
      const o3 = JSON.parse(JSON.stringify(base)); delete o3.rift.seals.caldera; o3.rift.prog.caldera = 2; out.unsealed = P.sanitize(o3).rift;
      const o4 = JSON.parse(JSON.stringify(base)); o4.rift.replay = { caldera: 99 }; out.big = P.sanitize(o4).rift;
      return JSON.parse(JSON.stringify(out)); });
    ok(M.old.seals.caldera === 1 && (M.old.prog.caldera || 0) === 0 && !(M.old.replay || {}).caldera, 'an older sealed save (no replay checkpoint) loads as before: sealed, Enter again at stage 1', M.old);
    ok(M.kept.replay.caldera === 5 && !('bogus' in M.kept.replay) && !('Bad' in M.kept.replay), 'a replay checkpoint is kept by sanitize; junk keys dropped', M.kept.replay);
    ok(M.unsealed.prog.caldera === 2, 'an unsealed checkpoint at Fire Flan is kept', M.unsealed.prog);
    ok(M.big.replay.caldera <= 31, 'a replay checkpoint is capped like the checkpoint', M.big.replay);
  }
  const er = errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e));
  console.log('page errors', er.length, er.slice(0, 4)); ok(er.length === 0, 'no page errors');
  console.log(`${passes} passed, ${fails} failed`); await browser.close(); process.exit(fails ? 1 : 0);
})().catch(async e => { console.error(e); process.exit(2); });
