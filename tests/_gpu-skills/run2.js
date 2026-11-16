// Worker P: cast every Strong / Ult a 1-4 star pet can use in the Tower, on the forced GPU path (swiftshader, __NG_GL = 1),
// measure per frame how many GPU quads the move's own drawing queues (ELEM.draw / STAR.draw), how many the Tower's shared
// GPU pass queues, the 2D calls of the move's own drawing, and keep a JPEG of every sampled frame.
// usage: node run.js <outdir> [group,...]   groups: innate cards star4 elem:<el>   env ONLY=key,key
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = process.argv[2], GROUPS = (process.argv[3] || 'innate,cards,star4,elem:earth,elem:wind,elem:light,elem:dark,elem:fire,elem:water,elem:ice,elem:thunder').split(',');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, EVO = +(process.env.EVO || 4);
const MODE = process.env.MODE || 'measure', PICK = process.env.PICK ? JSON.parse(fs.readFileSync(process.env.PICK)) : null;
const STEP = +(process.env.STEP || 0.2), WIN = { strong: 2.0, ult: 3.2 };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
    const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
    await page.addInitScript(() => { window.__NG_GL = 1; window.__NOFLUSH = 0; });
    await page.goto('file:///home/claude/cocopets/test-calP.html');
    await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
    // instrumentation: phases, FGFX quads, 2D calls, GL draws
    await page.evaluate(() => {
      window.__PH = 'dun'; window.__C = null;
      const bump = k => { const C = window.__C; if (C) C[window.__PH + k] = (C[window.__PH + k] || 0) + 1; };
      const F = self.NIDHOGG_MOVES.FGFX, ob = F.begin, ofl = F.flush; F.flush = function () { if (window.__NOFLUSH) return; return ofl.apply(this, arguments); };
      F.begin = function () { const Q = ob.apply(this, arguments); if (Q && !Q.__hk) { const oq = Q.quad; Q.quad = function (kind, x, y, ux, uy, vx, vy, col, al) { if (al > 0.004) bump('Q'); return oq.apply(this, arguments); }; Q.__hk = 1; } return Q; };
      const P2 = CanvasRenderingContext2D.prototype;
      for (const m of ['fill', 'stroke', 'drawImage', 'fillRect', 'strokeRect']) { const o = P2[m]; P2[m] = function () { if (window.__PH === 'own') bump('2D'); return o.apply(this, arguments); }; }
      for (const G of [WebGLRenderingContext, WebGL2RenderingContext]) for (const m of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) { const o = G.prototype[m]; if (!o) continue; G.prototype[m] = function () { bump('GL'); return o.apply(this, arguments); }; }
    });
    const startFloor = async () => {
      await page.evaluate(() => { const P = window.__pp; try { if (P.arc.state !== 'idle') P.closeArcade(); } catch (e) {} if (!window.__qs) { const R0 = Math.random; Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(+(window.__PETSEED || 4242)); P.quickStart('Pip'); Math.random = R0; window.__qs = 1; } P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000 });
      await page.evaluate(() => window.__pp.beginPlay());
      await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 400000 });
      return page.evaluate(() => {
        const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
        const G = P.arc.game, D = G._dbg, me = D.me;
        for (let k = 0; k < 200; k++) G.update(1 / 60);
        const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(12345);
        let best = null; for (let k = 0; k < 3000; k++) { const sx = me.x + (Math.random() - 0.5) * 40, sy = me.y + (Math.random() - 0.5) * 40; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
        window.__HOME = best ? { x: best.x - 1.5, y: best.y + 0.6 } : { x: me.x, y: me.y };
        // phase hooks on this game's move runners
        for (const k of ['ELEM', 'STAR']) { const R = D[k]; if (!R || R.__hk) continue; const od = R.draw; R.draw = function () { const p = window.__PH; window.__PH = 'own'; try { return od.apply(this, arguments); } finally { window.__PH = p; } }; R.__hk = 1; }
        const AB = D.AB; return { home: window.__HOME, L: best && best.L, el: AB.el, mons: D.mons.length };
      });
    };
    const info = await startFloor(); console.log('floor', JSON.stringify(info));
    // the move list
    const moves = await page.evaluate(() => {
      const P = window.__pp, out = [], AB = P.arc.game._dbg.AB;
      const INN_S = { rush: 'Horn Rush', gust: 'Gale Slash', whip: 'Tail Cyclone', fury: 'Claw Fury', eyebeam: 'Eye Laser', slam: 'Belly Slam', orbs: 'Orb Barrage', burst: 'Element Bomb', spikes: 'Spike Bloom' };
      const INN_U = { nova: 'Nova Blast', shield: 'Bubble Fortress', meteor: 'Meteor Rain', clone: 'Mirror Twins', warp: 'Time Warp', beam: 'Mega Beam', swarm: 'Star Swarm' };
      for (const k in INN_S) out.push({ group: 'innate', slot: 'strong', key: 's_' + k, name: INN_S[k], el: AB.el });
      for (const k in INN_U) out.push({ group: 'innate', slot: 'ult', key: 'u_' + k, name: INN_U[k], el: AB.el });
      const C = P.dun.CARDS; for (const id of P.dun.CARD_IDS) if (C[id].slot !== 'normal') out.push({ group: 'cards', slot: C[id].slot, key: id, name: C[id].name, el: C[id].el, rarity: C[id].r });
      for (const tier of [4, 5, 6]) for (const s of ['strong', 'ult']) for (const [k, v] of Object.entries(P.STAR_POOLS[tier][s])) out.push({ group: 'star' + tier, tier, slot: s, key: (s === 'ult' ? 'y_' : 'x_') + k, name: v.name, el: AB.el });
      for (const e in P.ELEM_MOVES) P.ELEM_MOVES[e].strong.forEach(r => out.push({ group: 'elem:' + e, slot: 'strong', key: 'ex_' + r[0], name: r[1], e8: e }));
      return out;
    });
    fs.mkdirSync(OUT, { recursive: true });
    const res = [];
    let n = 0;
    for (const grp of ['baseline'].concat(GROUPS)) {
      const list = (grp === 'baseline' && MODE === 'capture') ? [] : grp === 'baseline' ? [{ group: 'baseline', slot: 'strong', key: 'none_s', name: 'idle' }, { group: 'baseline', slot: 'ult', key: 'none_u', name: 'empty ult cast' }] : moves.filter(m => m.group === grp && (!ONLY || ONLY.includes(m.key.replace(/^(ex_|x_|y_|s_|u_)/, '')) || ONLY.includes(m.key)));
      if (!list.length) continue;
      if (n++ > 0) await startFloor(); else if (MODE === 'capture' && n === 1 && grp !== GROUPS[0]) {}   // a fresh floor for each group: nothing lingers from the last one
      for (const mv of list) {
        const id = `${grp.replace(':', '-')}__${mv.slot}__${mv.key}`, dir = path.join(OUT, 'raw', id); fs.mkdirSync(dir, { recursive: true });
        const before = errors.length, t0 = Date.now();
        const cast = await page.evaluate(([mv, evo]) => {
          const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g, H = window.__HOME;
          // settle anything from the last move (up to 30 s of game time, without drawing)
          for (let k = 0; k < 1800; k++) { const busy = (D.ELEM && D.ELEM.fx.length) || (D.STAR && D.STAR.fx.length) || D.zones.some(z => z.own === 'pet') || D.helpers.length || g.phoenixT > 0 || g.shieldT > 0 || g.warpT > 0 || g.stopT > 0; if (!busy && k > 120) break; me.inv = 1; me.hp = D.ST.hp; G.update(1 / 60); }
          D.parts.length = 0; D.shots.length = 0; if (D.banners) D.banners.length = 0;
          me.x = H.x; me.y = H.y; me.vx = me.vy = 0; me.dash = null; me.leap = null; me.spin = null; me.beam = null; me.dead = false; me.hp = D.ST.hp;
          const place = [[2.3, -0.9], [3.4, 0.1], [1.9, -2.0], [3.8, -1.6], [2.8, 1.0]];
          const live = D.mons.filter(m => !m.boss); live.forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0, freeze: 0, stun: 0, z: 0 }); else Object.assign(m, { dead: true, x: me.x + 90 }); });
          D.eshots.length = 0; g.intro = 0; g.bossIntro = 0; me.face = 1; D.SKIP.fog = true;
          if (P.st.dun.seen) D.mons.forEach(m => { P.st.dun.seen[m.type] = 0; }); for (let k = 0; k < 40; k++) { me.inv = 1; G.update(1 / 60); if (k % 10 === 0) { const nf = window.__NOFLUSH; window.__NOFLUSH = 1; G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__NOFLUSH = nf; } } if (D.banners) D.banners.length = 0;
          me.x = H.x; me.y = H.y;
          let ab;
          if (mv.key.slice(0, 3) === 'ex_') ab = Object.assign(P.elemAbility(P.ELEM_LIST[mv.e8][mv.key], 'strong', P.st), { star: 4, mult: 1.2, cost: 0, cd: 0, tier: 1, evo });
          else ab = { slot: mv.slot, own: mv.group !== 'cards', tier: 1, key: mv.key, name: mv.name, glyph: 'orb', el: mv.el || D.AB.el, mult: 1.2, cost: 0, cd: 0, star: mv.tier || undefined };
          D.setKit(mv.slot === 'ult' ? 'ult' : 'strong', ab);
          me.mp = 999; g.cdS = 0; g.cdU = 0; window.__T0 = g.t; Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(777);
          if (mv.key === 'none_s') { /* idle baseline */ } else if (mv.slot === 'ult') D.useUlt(); else D.useStrong('strong');
          return { mp: me.mp, castT: me.castT };
        }, [mv, EVO]);
        const samples = [], W = WIN[mv.slot];
        const TS = MODE === 'capture' ? ((PICK && PICK[id]) || []) : (() => { const a = []; for (let t = STEP; t <= W + 1e-6; t += STEP) a.push(+t.toFixed(2)); return a; })();
        if (MODE === 'capture' && !TS.length) continue;
        await page.evaluate(nf => { window.__NOFLUSH = nf; }, MODE === 'capture' ? 0 : 1);
        for (const t of TS) {
          const s = await page.evaluate(([t]) => {
            const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g; let k = 0;
            while (g.t - window.__T0 < t - 1e-4 && k++ < 600) { D.me.inv = 1; D.me.hp = D.ST.hp; G.update(1 / 60); }
            if (D.ELEM) for (const f of D.ELEM.fx) if (f.drawEnt && !f.__hk) { const od = f.drawEnt; f.drawEnt = function () { const p = window.__PH; window.__PH = 'own'; try { return od.apply(this, arguments); } finally { window.__PH = p; } }; f.__hk = 1; }
            window.__C = {}; const t1 = performance.now(); G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); const C = window.__C; window.__C = null;
            return { t: +(g.t - window.__T0).toFixed(2), ms: Math.round(performance.now() - t1), ownQ: C.ownQ || 0, dunQ: C.dunQ || 0, own2D: C.own2D || 0, ownGL: C.ownGL || 0, dunGL: C.dunGL || 0, fx: (D.ELEM ? D.ELEM.fx.length : 0) + (D.STAR ? D.STAR.fx.length : 0) };
          }, [t]);
          if (MODE === 'capture') { const f = path.join(dir, t.toFixed(2) + '.png'); await page.screenshot({ path: f }); s.file = f; } samples.push(s);
        }
        const errs = errors.slice(before);
        const r = Object.assign({}, mv, { id, cast, samples, errs, secs: Math.round((Date.now() - t0) / 1000) });
        res.push(r);
        const sum = k => samples.reduce((a, s) => a + s[k], 0), mx = k => Math.max(...samples.map(s => s[k]));
        console.log(`${id.padEnd(44)} ownQ ${String(sum('ownQ')).padStart(6)} (max ${mx('ownQ')})  dunQ ${String(sum('dunQ')).padStart(6)} (max ${mx('dunQ')})  own2D ${String(sum('own2D')).padStart(6)}  ownGL ${sum('ownGL')}  ms/frame ${Math.round(sum('ms') / samples.length)}  ${r.secs}s ${errs.length ? 'ERR ' + errs[0].slice(0, 120) : ''}`);
        fs.writeFileSync(path.join(OUT, MODE + '-' + GROUPS.join('+').replace(/:/g, '-') + '.json'), JSON.stringify(res, null, 1));
      }
    }
    console.log('page errors', errors.length, errors.slice(0, 5));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
