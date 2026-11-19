// v423 GB: Ambrel and Calyx Astrum, each fight run through every attack, a hit, its stun mechanic, phase two and its
// minions, to the defeat, on the GPU path (forced on the software rasteriser) and on the 2D fallback; 0 page errors; the
// tells light only on the GPU (no filled engine shapes); the stage's pointers and kept pictures let go when the next stage is
// made. The game is stepped (its update, 0.05 s a step) with real frames drawn between, so every draw path runs.
// usage: HTML=test-gb.html node tests/_gb-fight.js [ambrel|calyx] [gl|2d]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const ACTS = { ambrel: ['veil', 'dive', 'beam', 'storm'], calyx: ['whips', 'rain', 'bloom', 'constrict'] }, MIN = { ambrel: 'pollenmoth', calyx: 'thornling' };
(async () => { const bosses = process.argv[2] && process.argv[2] !== 'all' ? [process.argv[2]] : ['ambrel', 'calyx'], modes = process.argv[3] ? [process.argv[3]] : ['gl', '2d'];
  for (const mode of modes) { const GL = mode === 'gl', T0 = Date.now();
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
    const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }); const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await page.addInitScript(gl => { window.__GB_GL = gl ? 1 : 0; window.__NG_GL = gl ? 1 : 0; }, GL);
    await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-gb.html')); await page.waitForFunction(() => window.__pp, null, { timeout: 300000 });
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 22; P.riftState().seals.belfry = 1; P.st.dun.best = 120; });
    const step = (secs, keep) => page.evaluate(([secs, keep]) => { const P = window.__pp, D = P.arc.game._dbg; for (let i = 0; i < Math.round(secs / 0.05); i++) { if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } if (keep && D.g.boss && !D.g.boss.dead) { D.me.x = D.g.boss.x + keep[0]; D.me.y = D.g.boss.y + keep[1]; } if (P.arc.state !== 'play') break; P.arc.game.update(0.05); } if (P.arc.frames) P.arc.frames.length = 0; }, [secs, keep || null]);
    const frame = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    const run = async (secs, keep, n) => { for (let i = 0; i < (n || 2); i++) { await step(secs / (n || 2), keep); await frame(); } };
    for (const id of bosses) { const e0 = errors.length;
      const idx = await page.evaluate(id => window.__pp.RIFT_BY_ID.garden.stages.findIndex(s => s.boss === id), id);
      await page.evaluate(([idx]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('garden', idx); }, [idx]);
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000, polling: 1000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000, polling: 1000 });
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 4.5; });
      await run(6, null, 3);
      let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, FD = D.FD, G = FD.S.D.GB && FD.S.D.GB.gl; return { act: D.g.boss.act, gl: !!(G && G.on()), keep: !!FD.S.D.keep, fd: FD.S.FD.name }; });
      console.log(` ${mode} ${id}`, JSON.stringify(r)); ok(r.act && r.act !== 'enter', `${mode} ${id}: awake (${r.act})`); ok(r.gl === GL && r.keep === !GL, `${mode} ${id}: ${GL ? 'the GPU model and painter on, drawn live' : 'the 2D fallback, kept layers'}`);
      // every attack, begun through the fight's own hook, through its wind-up and strike
      for (const k of ACTS[id]) { await step(1.2, [0.5, 4.6]);
        const s0 = await page.evaluate(k => { const D = window.__pp.arc.game._dbg, FD = D.FD, b = D.g.boss; b.stunT = 0; FD.S.D.GB.act(FD.FX, k); const tl = FD.S.tele.map(s => s.shape + (s.gb ? ':' + s.gb : '')); return { act: b.act, tele: tl, ban: D.banners.map(x => x.s).slice(-1)[0] }; }, k);
        await run(1.0, [0.6, 4.4], 2); const mid = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { act: D.g.boss.act, hz: D.FD.S.hz.map(z => z.kind || z.shape), shots: D.eshots.length, tele: D.FD.S.tele.length }; });
        await run(2.0, [0.6, 4.4], 2);
        const filled = s0.tele.filter(x => /^(line|circle|ring|cone)/.test(x)).length;
        console.log(`   ${k}`, JSON.stringify(s0), JSON.stringify(mid)); ok(s0.act === k, `${mode} ${id}: ${k} fires`);
        if (s0.tele.length) ok(GL ? filled === 0 : true, `${mode} ${id}: ${k}'s tells ${GL ? 'light only (no engine-filled shapes)' : 'as before'} (${s0.tele.join(' ')})`); }
      // a hit; the stun mechanic (all four lures snuffed / the lit star blossom broken)
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.hitMon(D.g.boss, 1000, { flat: true }); }); await run(0.3, null, 1);
      const stun = await page.evaluate(async id => { const P = window.__pp, D = P.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem;
        if (id === 'ambrel') { for (const o of D.mons.filter(m => m.fobj && m.kind === 'lantern' && !m.dead)) D.hitMon(o, 1e12, { flat: true }); }
        else { for (let i = 0; i < 300 && M.lit < 0; i++) { D.me.hp = D.ST.hp; P.arc.game.update(0.05); } const o = D.mons.find(m => m.fobj && m.kind === 'blossom' && m.idx === M.lit && !m.dead); if (o) D.hitMon(o, 1e12, { flat: true }); }
        for (let i = 0; i < 20; i++) { D.me.hp = D.ST.hp; P.arc.game.update(0.05); } return { stun: +b.stunT.toFixed(2), weak: Object.keys(D.FD.S.weak).filter(k => D.FD.S.weak[k] && !D.FD.S.weak[k].dead) }; }, id);
      await run(1.0, [0.6, 3.6], 2); console.log('   stun', JSON.stringify(stun)); ok(stun.stun > 0 && stun.weak.length > 0, `${mode} ${id}: the stun and its weak point`);
      // phase two and its minions
      const p2 = await page.evaluate(async t => { const P = window.__pp, D = P.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; let seen = false; for (let i = 0; i < 400; i++) { D.me.hp = D.ST.hp; P.arc.game.update(0.05); if (D.mons.some(m => !m.dead && m.type === t)) { seen = true; if (D.FD.S.phase >= 2) break; } } return { phase: D.FD.S.phase, minion: seen }; }, MIN[id]);
      await run(1.0, [0.5, 4.6], 2); console.log('   phase2', JSON.stringify(p2)); ok(p2.phase >= 2 && p2.minion, `${mode} ${id}: phase two with its minions`);
      for (const k of ACTS[id]) { await page.evaluate(k => { const D = window.__pp.arc.game._dbg, FD = D.FD; D.g.boss.stunT = 0; FD.S.D.GB.act(FD.FX, k); }, k); await run(1.6, [0.6, 4.4], 1); }
      // the defeat: it falls (on the GPU, its corpse kept while it dissolves) and the stage ends
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.hitMon(D.g.boss, 1e12, { pierce: true }); });
      const dd = []; for (let i = 0; i < 4; i++) { await run(0.6, null, 1); dd.push(await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { end: M.gbEnd ? +M.gbEnd.t.toFixed(2) : null, corpse: D.FD.S.props.some(p => p.kind === 'gbcorpse') }; })); }
      console.log('   defeat', JSON.stringify(dd)); if (GL) ok(dd.some(x => x.corpse) && dd[dd.length - 1].end > 1.5, `${mode} ${id}: it falls on the GPU (its corpse dissolving)`);
      const end = await page.evaluate(async () => { const P = window.__pp; for (let i = 0; i < 1200 && P.arc.state === 'play'; i++) { P.arc.game.update(0.05); if (i % 40 === 0) await new Promise(r => setTimeout(r, 0)); } return P.arc.state; });
      ok(end === 'end' || end === 'play' && false, `${mode} ${id}: the defeat ends the stage (${end})`);
      const e1 = errors.length; ok(e1 === e0, `${mode} ${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
      // letting go: a new stage made (any) drops the last stage's pointers and kept pictures
      await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.startRift('garden', 0); });
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000, polling: 1000 });
      const rel = await page.evaluate(id => { const G = window.__pp.FIEND_DEFS[id].GB.gl; return { last: !!G.last, pics: G.__dbg.stats.pics }; }, id);
      ok(!rel.last && rel.pics === 0, `${mode} ${id}: released on the next stage (${JSON.stringify(rel)})`); await page.waitForTimeout(1500); ok(errors.length === e1, `${mode} ${id}: no page errors through the next stage (${errors.length - e1})`); if (errors.length > e1) console.log(errors.slice(e1, e1 + 3).join('\n'));
      await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); });
    }
    console.log(`${mode}: ${((Date.now() - T0) / 1000).toFixed(0)} s, errors ${errors.length}`); await b.close(); }
  console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0); })();
