// (v435 AN) Every Zodiac Anima to the summon rule: 30 s of active time from combat-ready, no cooldowns, skills firing all the while,
// the Astral Awakening exactly once at the end, then it leaves (only after the finale is done); 0 page errors.
// Each Anima is summoned on a fresh stage (Tower floor 3, stage 5) with eight monsters held round the pet (their health kept topped up
// far above their real health, their real maxhp kept for the share-of-health blows), the game stepped by hand. It measures the
// damage the Anima deals in its fight and in its finale.
// usage: HTML=test-an.html node tests/_an-all.js [form 1|2|3] [ids comma list | all] [pairs 1|0]
//   prints one JSON line per Anima ("run ...") and a summary table; OUT=file.json writes the runs.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const K = +(process.argv[2] || 3), IDS0 = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : null, PAIRS = process.argv[4] !== '0', DT = +(process.env.DT || 1 / 30);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__NG_GL = 0; window.__BL_GL = 0; window.__AB_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-an.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.res = null; }, { K });
  const IDS = IDS0 || await page.evaluate(() => window.__pp.ANIMA_ORDER.filter(a => a !== 'aries'));
  const runs = [];
  async function one(id, res) {
    await page.evaluate(({ id }) => { const P = window.__pp; try { P.closeArcade && P.arc.state !== 'idle' && P.closeArcade(); } catch (e) {} P.st.energy = 100; P.st.animas.eq = id; P.st.animas.res = null; P.openMap(); }, { id });
    await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    const r = await page.evaluate(({ id, res, K, DT }) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
      for (let k = 0; k < 30; k++) G.update(1 / 30);
      if (!AN.kit) return { err: 'no kit' };
      AN.kit.main.id = id; AN.kit.main.k = K; AN.kit.res = res ? { id: res, k: K } : null; AN.kit.resonance = res ? P.pairResonance(id, res) : null;
      if (id === 'cancer' && !AN.ab) return { err: 'no AB' }; if (id === 'taurus' && !AN.bl) return { err: 'no BL' };
      D.SKIP.fog = true; D.g.intro = 0;
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
      let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);   // (the same open spot search every run)
      for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (rnd() - 0.5) * 50, sy = me.y + (rnd() - 0.5) * 50; let ok = true; for (let dx = -7; dx <= 8 && ok; dx++) for (let dy = -6; dy <= 6 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
      if (best) { me.x = best.x - 2.5; me.y = best.y + 1.5; }
      const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]];
      const tm = [], HP = 1e9; let mh = 0;
      D.mons.filter(m => !m.boss).forEach((m, i) => { if (i < place.length) { if (!mh) mh = m.maxhp; Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hx: place[i][0], hy: place[i][1], hp: HP, maxhp: mh, still: false, spd: 0, atkCd: 99, dmg: 0, aggro: true }); tm.push(m); } else Object.assign(m, { dead: true, x: me.x + 200, y: me.y + 200 }); });
      D.mons.filter(m => m.boss).forEach(m => Object.assign(m, { dead: true, x: me.x + 300, y: me.y + 300 }));
      me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
      // the finales: counted by their banners, and Abaddon's / Belial's own fin calls
      const fins = { ab: 0, bl: 0 }; if (AN.ab) { const f0 = AN.ab.fin; AN.ab.fin = a => { fins.ab++; return f0(a); }; } if (AN.bl) { const f0 = AN.bl.fin; AN.bl.fin = a => { fins.bl++; return f0(a); }; }
      const seenB = new Set(), bann = [];
      if (!AN.summon()) return { err: 'no summon' };
      const S = AN.S, A0 = S.list[0], out = { id, res: res || null, k: K, maxhp: mh, atk: D.ST.atk, picks: [], petHp: D.ST.hp };
      let t = 0, readyT = -1, fightT = 0, awT = -1, leaveT = -1, goneT = -1, dFight = 0, dFin = 0, dEnter = 0, lastHit = -1, maxGap = 0, gapAt = 0, lifeAtReady = null, sec = [], hits = 0, idleFoes = 0, stStates = [];
      const ids = [id].concat(res ? [res] : []);
      for (let n = 0; n < Math.round(80 / DT); n++) {
        D.eshots.length = 0; for (const m of D.mons) m.atkCd = 99; me.hp = Math.max(me.hp, D.ST.hp * 0.5);
        G.update(DT); t += DT;
        let d = 0; for (const m of tm) { if (m.dead) { m.dead = false; } d += Math.max(0, HP - m.hp); m.hp = HP; }
        if (n % Math.round(1.5 / DT) === 0) for (const m of tm) { if (Math.hypot(m.x - me.x - m.hx, m.y - me.y - m.hy) > 3) { m.x = me.x + m.hx; m.y = me.y + m.hy; m.kbx = m.kby = 0; } }
        for (const b of D.banners) if (!seenB.has(b)) { seenB.add(b); bann.push([+t.toFixed(2), b.s]); }
        const a = S.list.find(q => q.id === id), stA = a ? a.st : 'gone';
        if (stStates[stStates.length - 1] !== stA) stStates.push(stA);
        if (a && a.st === 'fight' && readyT < 0) { readyT = t; lifeAtReady = +(a.life + DT).toFixed(2); }
        if (a && a.st === 'fight') { fightT += DT; dFight += d; if (d > 0) { hits++; if (lastHit >= 0 && t - lastHit > maxGap) { maxGap = t - lastHit; gapAt = +(t - readyT).toFixed(1); } lastHit = t; } const si = Math.floor(t - readyT); sec[si] = (sec[si] || 0) + d;
          const k2 = (a.ab && a.ab.act && a.ab.act.kind) || (a.bl && a.bl.act && a.bl.act.kind); if (k2 && out.picks[out.picks.length - 1] !== k2) out.picks.push(k2);
          if (!k2 && (a.ab || a.bl) && t - readyT > 1) idleFoes += DT; }
        else if (a && (a.st === 'awaken' || a.st === 'leave')) { if (awT < 0) awT = t; dFin += d; if (a.st === 'leave' && leaveT < 0) leaveT = t; }
        else if (!a && readyT >= 0) { dFin += d; if (goneT < 0) goneT = t; }
        else dEnter += d;
        if (goneT >= 0 && t - goneT > 3 && !S.list.length) break;
      }
      const finNames = ids.map(q => P.ANIMAS[q].finisher.toUpperCase());
      Object.assign(out, { readyT: +readyT.toFixed(2), lifeAtReady, fightT: +fightT.toFixed(2), awakenAt: +(awT - readyT).toFixed(2), leaveAfterAwaken: +(leaveT - awT).toFixed(2), goneAfterAwaken: +(goneT - awT).toFixed(2), listLeft: S.list.length,
        dmgFight: Math.round(dFight), dmgFin: Math.round(dFin), dmgEnter: Math.round(dEnter), dps: Math.round(dFight / Math.max(0.1, fightT)), maxGap: +maxGap.toFixed(2), gapAt, hits, idleWithFoes: +idleFoes.toFixed(2),
        perSec: sec.map(v => Math.round(v || 0)), finBanners: bann.filter(b => finNames.includes(b[1]) || /RESONANCE|HARMONY/i.test(b[1]) || (res && b[1] === (AN.kit.resonance && AN.kit.resonance.name || '').toUpperCase())).map(b => b[1]), fins, states: stStates.join('>'),
        cineT: D.g.cineT, zoomP: D.g.zoomP, judg: S.list.some(q => q.judg) });
      try { AN.stop(); } catch (e) { out.stopErr = String(e); }
      P.closeArcade && P.closeArcade();
      return out;
    }, { id, res, K, DT });
    r.errors = errors.length; console.log('run', JSON.stringify(Object.assign({}, r, { perSec: undefined }))); runs.push(r); return r;
  }
  for (const id of IDS) await one(id, null);
  if (PAIRS) { await one('cancer', 'capricorn'); await one('taurus', 'leo'); await one('gemini', 'sagittarius'); }
  console.log('\nid            k  ready  life  fight  awaken@  leave+  gone+  dmgFight   dmgFin   dps    gap   fins');
  for (const r of runs) console.log(`${(r.id + (r.res ? '+' + r.res : '')).padEnd(13)} ${r.k}  ${String(r.readyT).padStart(5)} ${String(r.lifeAtReady).padStart(5)} ${String(r.fightT).padStart(6)} ${String(r.awakenAt).padStart(8)} ${String(r.leaveAfterAwaken).padStart(7)} ${String(r.goneAfterAwaken).padStart(6)} ${String(r.dmgFight).padStart(9)} ${String(r.dmgFin).padStart(8)} ${String(r.dps).padStart(5)} ${String(r.maxGap).padStart(6)}   ${JSON.stringify(r.finBanners)} ${r.fins.ab || r.fins.bl ? JSON.stringify(r.fins) : ''}`);
  if (process.env.OUT) require('fs').writeFileSync(process.env.OUT, JSON.stringify(runs));
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
