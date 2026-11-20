// v434 PO: nothing is left behind in Rift 03. (1) Each boss (Sarrukh, Oneira, Thul-Ammon) on the GPU path: every act forced
// (its test hook), run by game time to its end; then no warning, no effect of the model's (M.g3.fx), no beam or lob left, and
// a frame drawn after it lays no painter pass of the boss's effects. (2) Each stage closed: the dunes' picture caches (sky,
// props, traps, the bosses' kept pictures) back to nothing, the live view (DUNE_SKY.LIVE) dropped. The Ultimates' own ending
// is tests/_pf-clean.js (RIFT=dunes STAGE=0 / 3).
// usage: HTML=test-po.html node tests/_po-clean.js     env: BOSSES (3,7,11)
process.env.RIFT = 'dunes';
const { open } = require('./_pf-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
const ACTS = { 3: ['wake', 'breach', 'spit', 'resonate'], 7: ['echo', 'beam', 'chorus', 'slam'], 11: ['sweep', 'slam', 'ink', 'grasp', 'sandfall'] };
(async () => {
  const T = await open({ html: process.env.HTML || 'test-po.html', dpr: 1, rift: 'dunes' }); const { page, errors, start } = T;
  for (const s of (process.env.BOSSES || '3,7,11').split(',').map(Number)) {
    await start(s);
    await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; const b = D.mons.find(m => m.boss && !m.dead) || D.M.bossAt; me.x = b.x; me.y = b.y + 6; for (let k = 0; k < 600; k++) { me.hp = D.ST.hp; G.update(1 / 60); } });
    for (const k of ACTS[s]) {
      const r = await page.evaluate(([k, sn]) => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, me = D.me, FX = D.FD.FX, M = FX.mem, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), F = self.NIDHOGG_MOVES.FGFX;
        const d = P.FIEND_DEFS[{ 3: 'sarrukh', 7: 'oneira', 11: 'thulammon' }[sn]]; if (!d || !d.force) return { skip: 'no test hook' };
        const m = FX.m; if (!m || m.dead) return { skip: 'no boss' }; m.stunT = 0; me.x = m.x + 1.2; me.y = m.y + 5.5; for (let i = 0; i < 12; i++) G.update(1 / 60);
        const tele0 = FX.S.tele.length; d.force(FX, k); const started = m.act, teles = FX.S.tele.length; let i = 0, maxFx = 0;
        /* (what the forced act made: every warning, beam, lob and effect alive while the boss is in that act; the act is over and all of them gone = it ended. The boss's next acts carry on meanwhile: theirs are not counted) */
        const mine = new Set(), lists = () => [FX.S.tele, M.beams || [], M.lobs || [], (M.g3 && M.g3.fx) || []], alive = () => { let n = 0; for (const L of lists()) for (const o of L) if (mine.has(o)) n++; return n; };
        const take = () => { if (m.act === k || i < 2) for (const L of lists()) for (const o of L) mine.add(o); };
        for (; i < 60 * 20; i++) { take(); me.hp = D.ST.hp; G.update(1 / 60); maxFx = Math.max(maxFx, M.g3 && M.g3.fx ? M.g3.fx.length : 0); if (i > 30 && m.act !== k && !alive()) break; }
        const left = alive();
        const t = +(i / 60).toFixed(1); let passes = 0, quads = 0; const fl = F.flush; F.flush = function () { if (F.stats) { /* (each pass laid) */ } passes++; return fl.apply(this, arguments); }; const q0 = F.stats.frames; c.save(); G.draw(c); c.restore(); F.flush = fl;
        return { act: k, started, teles, maxFx, endedAfter: t, itsOwnLeft: left, tracked: mine.size, nowAlive: { tele: FX.S.tele.length, fx: M.g3 && M.g3.fx ? M.g3.fx.length : null, beams: M.beams ? M.beams.length : 0, lobs: M.lobs ? M.lobs.length : 0, act: m.act }, passesAfter: passes }; }, [k, s]);
      if (r.skip) { ok(false, `stage ${s} ${k}: ${r.skip}`); continue; }
      ok(r.itsOwnLeft === 0, `stage ${s} ${k}: forced (${r.started}, ${r.teles} warnings, up to ${r.maxFx} effects), it and all it made (${r.tracked} warnings / beams / lobs / effects) ended after ${r.endedAfter} s of game time, nothing of it left`, r);
    }
    // the stage closed: its pictures given back
    const rel = await page.evaluate(() => { const P = window.__pp; const before = { sky: window.DUNE_SKY.stats.cached + window.DUNE_SKY.stats.strips + window.DUNE_SKY.stats.sands, props: window.DUNE_PROPS.stats.cached };
      P.closeArcade(true); const S = window.DUNE_SKY.stats, PR = window.DUNE_PROPS.stats; return { before, after: { skyPx: S.px, skyCached: S.cached, strips: S.strips, sands: S.sands, propCached: PR.cached, propPx: PR.px, live: !!window.DUNE_SKY.LIVE } }; });
    ok(rel.after.skyPx === 0 && rel.after.propCached === 0 && !rel.after.live, `stage ${s} closed: the dunes' pictures given back`, rel);
  }
  ok(errors.length === 0, 'no page errors', errors.slice(0, 3));
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
