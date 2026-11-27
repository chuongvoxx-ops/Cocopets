// v472 YE: the three Yuggoth arenas' painted pieces: Kh'aal's cells, Ix-Vorra's pylons, Nyar'zhul's capacitors are drawn as the
// painted pictures (YUG_ARENA counts them, no fallback), with the pet stood by each in turn; shots to shots/v472-YE/arena-<id>-<i>.png
// env: HTML; MODE gl | nogl | lowfx; SHOTS=1
const { open } = require('./_ye-lib');
const MODE = process.env.MODE || 'gl';
(async () => {
  const T = await open({ noGL: MODE === 'nogl', noWebGL: MODE === 'nogl', lowFx: MODE === 'lowfx', fast: true, dpr: +(process.env.DPR || 1) }), res = [];
  const ok = (n, p, i) => { res.push(!!p); console.log(`${p ? 'OK  ' : 'FAIL'} ${n}${i ? ' · ' + i : ''}`); };
  for (const [si, id] of [[2, 'khaal'], [5, 'ixvorra'], [8, 'nyarzhul']]) { const e0 = T.errors.length;
    await T.stage(si); await T.run(4, 30);
    const list = await T.M(() => { const S = window.__pp.arc.game._dbg.FD.S; return [...(S.props || []).map((p, i) => ['p', i, p.kind]), ...(S.objs || []).filter(o => o.kind === 'cell' || o.kind === 'cap').map((o, i) => ['o', i, o.kind])]; });
    const s0 = await T.M(() => window.YUG_ARENA.stats); let k = 0;
    for (const [w, i] of list) { await T.M(([w, i]) => { const D = window.__pp.arc.game._dbg, S = D.FD.S, q = w === 'p' ? S.props[i] : (S.objs || []).filter(o => o.kind === 'cell' || o.kind === 'cap')[i]; if (q) { D.me.x = q.x + 0.5; D.me.y = q.y + 2.4; } for (const m of D.mons) m.frozen = 99; }, [w, i]); await T.run(0.6, 30);
      if (process.env.SHOTS && k++ < 2) await T.shot('v472-YE', `arena-${id}-${MODE}-${k}`); }
    const s1 = await T.M(() => window.YUG_ARENA.stats);
    ok(`${id}: ${list.length} pieces (${[...new Set(list.map(q => q[2]))].join(',')}) drawn painted (${s1[id] - s0[id]} draws, fallback ${s1.fallback - s0.fallback})`, list.length > 0 && s1[id] > s0[id] && s1.fallback === s0.fallback);
    ok(`${id}: no page errors`, T.errors.length === e0, JSON.stringify(T.errors.slice(e0, e0 + 3)));
    await T.M(() => window.__pp.closeArcade(true)); await T.page.waitForTimeout(400); }
  const nf = res.filter(r => !r).length; console.log(`${res.length - nf}/${res.length} passed (${MODE})`); await T.browser.close(); process.exit(nf ? 1 : 0);
})();
