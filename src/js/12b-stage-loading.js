/* ---------- (v372) the loading screen before every stage ----------
   A full-screen picture (one per stage: a rift shows its own land, every other stage one of the six in turn) with the
   stage's name, a progress bar and a tip, shown from the moment a stage is chosen until it is ready to play. While it
   shows, the stage is built and everything its first seconds need is prepared ahead (StageLoad.warm):
     - the pet's sprites and rigs (launchArc's own loads),
     - the GPU painter every elemental move paints through (20k6h FGFX) and the 3D one: their programs compiled and one
       frame drawn with every kind of quad, so the first cast never stalls on a shader,
     - every elemental Strong and Ultimate in the party's kits that prepares itself ahead (their .warm: sprite atlases,
       models), started now so their bakes run behind the picture,
     - one full frame of the stage drawn behind it (its floor, props and monsters' pictures cached),
     - a moment of idle time for those bakes to finish.
   It stays at least MIN s (so the picture is seen; v373: 1.1 s, the start-up loading below having done most of the work), at most what the work takes, then fades to the stage's ready card.
   The pictures are files beside the page (loading/*.jpg: the website copies them from assets/loading; the Claude build
   publishes them with the page); if one cannot be loaded the screen shows a soft gradient instead. */
/* (v374) where the pictures are: beside the page on the website (loading/*.jpg), in the artifact's asset store in Claude
   (a page there cannot reach files beside it by a relative path); each is tried in turn and the first that loads is kept */
const LOAD_PICS = (() => {
  const BLOB = { meadow: '/_blob/223d2709282b2e7281fee8ac1bb2ad5d', belfry: '/_blob/7ee9ed5b07d7e5d6896117fdced7f7ce', dunes: '/_blob/56669318cb275f3621537511742ccbb5', yuggoth: '/_blob/07fd556e2efb38f1542322498dbb5cf0', garden: '/_blob/fd54a61c57e0daab7f8f7abfc882cf15', castle: '/_blob/f537597d2700136ad860dc97c59f2bca' };
  const got = {}, held = {}, web = (() => { try { return /github\.io$/.test(location.hostname); } catch (e) { return false; } })();
  /* resolves the URL that loaded (the image decoded and held), or null */
  function load(k) { if (got[k]) return got[k];
    const D = typeof LOAD_PICS_DATA !== 'undefined' ? LOAD_PICS_DATA : null;   /* (v375: the Claude build carries them inside the page) */
    const cands = D && D[k] ? [D[k]] : web ? ['loading/' + k + '.jpg', BLOB[k]] : [BLOB[k], 'loading/' + k + '.jpg'];
    got[k] = (async () => { for (const u of cands) { if (!u) continue; const ok = await new Promise(r => { const im = new Image(); im.decoding = 'async'; const to = setTimeout(() => r(false), 6000); im.onload = () => { clearTimeout(to); held[k] = im; (im.decode ? Promise.race([im.decode().catch(() => {}), new Promise(q => setTimeout(q, 2500))]) : Promise.resolve()).then(() => r(true)); };   /* (v404 IF: a decode that never settles, as WebKit's can under memory pressure, no longer holds the loading screen) */ im.onerror = () => { clearTimeout(to); r(false); }; im.src = u; }); if (ok) return held[k].src; } got[k] = null; return null; })();
    return got[k]; }
  return { load, BLOB };
})();
const StageLoad = (() => {
  const POOL = ['meadow', 'belfry', 'dunes', 'yuggoth', 'garden', 'castle'], BY_RIFT = { belfry: 'belfry', dunes: 'dunes', yuggoth: 'yuggoth', garden: 'garden' };
  const MIN = 1.1, CAP = 10, FADE = 0.4, BASE = 'loading/';   /* (v373: shorter now that the start-up loading prepares most of it) */
  const TIPS = ['Roll through a warning zone to take no damage from it.', 'Hits earn MP: keep attacking to charge your Strong and Ult.', 'Tap a party portrait to switch pets mid-fight.',
    'Elements react: try Fire after Ice, or Thunder on wet monsters.', 'Bosses resist slows and pushes, but not defence cuts.', 'Wind moves knock monsters around: herd them together.', 'A full combo meter pays out extra rewards.'];
  let el = null, bar = null, pic = null, tip = null, ttl = null, sub = null, lbl = null, t0 = 0, token = 0;
  const now = () => performance.now() / 1000, frame = () => new Promise(r => requestAnimationFrame(() => r()));
  function pick(mode, S, w, s) { const rid = S && S.rift && S.rift.id; if (rid && BY_RIFT[rid]) return BY_RIFT[rid];
    const n = mode === 'dungeon' ? (S && (S.n || s)) || s || 1 : (w || 1) * 7 + (s || 1); return POOL[(Math.abs(n | 0) + (rid ? 3 : 0)) % POOL.length]; }
  function build() { if (el) return el; el = document.createElement('div'); el.className = 'stage-load'; el.hidden = true;
    el.innerHTML = '<div class="sl-pic"></div><div class="sl-shade"></div><div class="sl-foot"><b class="sl-ttl"></b><span class="sl-sub"></span><div class="sl-bar"><i></i></div><small class="sl-lbl">Loading</small><p class="sl-tip"></p></div>';
    (document.getElementById('arcade') || document.body).appendChild(el); pic = el.querySelector('.sl-pic'); bar = el.querySelector('.sl-bar i'); tip = el.querySelector('.sl-tip'); ttl = el.querySelector('.sl-ttl'); sub = el.querySelector('.sl-sub'); lbl = el.querySelector('.sl-lbl'); return el; }
  /* shown at once; resolves when the picture is decoded (or failed) */
  function show(mode, S, w, s, title, subtitle) { build(); token++; t0 = now(); const k = pick(mode, S, w, s);
    el.classList.remove('out', 'noimg'); el.hidden = false; ttl.textContent = title || ''; sub.textContent = subtitle || ''; tip.textContent = TIPS[(Math.random() * TIPS.length) | 0];
    /* (v375) if this device cannot run the GPU effects, say so here (and why), so it can be reported */
    try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (F) { const on = F.usable(), I = F.info(); if (!on && I.why) tip.textContent = 'Effects are in simple mode on this device: ' + String(I.why).slice(0, 140); else if (on && !I.wind && I.whyW) tip.textContent = 'Wind effects are in simple mode on this device: ' + String(I.whyW).slice(0, 140); } } catch (e) {} set(0.04, 'Loading');
    pic.style.backgroundImage = ''; pic.classList.remove('in'); el.dataset.pic = k;
    return LOAD_PICS.load(k).then(u => { if (u) { pic.style.backgroundImage = `url("${u}")`; void pic.offsetWidth; pic.classList.add('in'); return true; } el.classList.add('noimg'); return false; }); }
  function set(u, what) { if (!el) return; bar.style.transform = `scaleX(${Math.max(0, Math.min(1, u)).toFixed(3)})`; if (what) lbl.textContent = what; }
  /* the work done behind the picture */
  async function warm(S, game, ctx) {
    // the GPU painters: compiled, and one frame drawn with every kind of quad
    set(0.62, 'Preparing effects');
    try { const NM = self.NIDHOGG_MOVES, F = NM && NM.FGFX; if (F && F.usable()) { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d'), Q = F.begin(c, null);
        if (Q && Q.quad) { for (let k = 0; k <= 39; k++) Q.quad(k, 32, 32, 8, 0, 0, 8, '#88CCAA', 0.01, 0.5, 0.5, 0.5); F.flush(c); } }
      } catch (e) {}
    await frame();
    // every move in the party's kits that prepares itself ahead (the Ultimates already began as the stage was made)
    set(0.72, 'Preparing moves');
    try { const T = () => (game && game.Tz ? game.Tz() : 48), party = (S && S.party) || [];
      for (const m of party) { const K = m.kit && m.kit.kit; if (!K) continue;
        for (const sl of Object.keys(K)) { const a = K[sl]; if (!a || !a.e8 || sl === 'ult') continue; const E = typeof ELEM_IMPL !== 'undefined' && ELEM_IMPL[a.e8], key = String(a.key || '').slice(3), I = E && E.strong && E.strong[key]; if (I && I.warm) try { I.warm({ evo: a.evo || 1, T }); } catch (e) {} } } } catch (e) {}
    await frame();
    // one whole frame of the stage, drawn behind the picture: its floor and the pictures of what is on it cached
    set(0.82, 'Building the stage');
    try { if (game && game.draw && ctx) { ctx.save(); game.draw(ctx); ctx.restore(); } } catch (e) {}
    await frame();
    // (v374) every party pet drawn as the fight draws it, every monster on the floor in every frame: the game's own list of
    // jobs, a few ms a frame, all of it unless the whole screen would pass CAP s
    try { const jobs = game && game.preloadJobs ? game.preloadJobs(ctx) : []; let j = 0; set(0.84, 'Getting your team ready');
      while (j < jobs.length && now() - t0 < CAP) { const f0 = performance.now(); while (j < jobs.length && performance.now() - f0 < 10) { try { jobs[j](); } catch (e) {} j++; } set(0.84 + 0.12 * j / jobs.length); await frame(); } } catch (e) {}
    // the first frames of the stage, drawn behind the picture (what was just made, now used once)
    try { if (game && game.draw && ctx) for (let k = 0; k < 3; k++) { ctx.save(); game.draw(ctx); ctx.restore(); await frame(); } } catch (e) {}
    // idle time for the bakes started above, and the picture shown at least MIN s
    const my = token; let u = 0.86; while (now() - t0 < MIN && my === token) { u = Math.min(0.98, u + 0.02); set(u, 'Almost ready'); await frame(); }
    set(1, 'Ready'); await frame(); }
  function hide(fast) { if (!el || el.hidden) return; token++; const my = token; if (fast) { el.hidden = true; return; } el.classList.add('out'); setTimeout(() => { if (my === token) el.hidden = true; }, FADE * 1000); }
  return { show, set, warm, hide, pick, POOL, get el() { return el; } };
})();

/* ---------- (v373) the loading screen as the game starts up ----------
   For a returning player (a save was found), before the town is handed over: the title picture, a progress bar, a tip,
   while the things every stage needs are made once for the whole session (they are all kept, so each stage's own loading
   screen then has little left to do):
     - every stage picture (decoded and held),
     - the party's sprites and rigs (petImage and loadRig keep them),
     - the GPU painters compiled and drawn once with every kind of quad,
     - every elemental Strong and Ultimate in the party's kits that prepares itself ahead (their .warm, at the Tower's
       tile size for this screen),
     - the monsters of the next Tower floor's lands and of the rifts now open, drawn frame by frame into DunArt's cache at
       the size the Tower will draw them (a few ms a frame, within a time budget).
   At least MIN s, at most what the work takes (the monster pictures stop at their budget; the rest are drawn as met). A
   new player (the egg) and the test harness (navigator.webdriver, unless window.__BOOT_LOAD) go straight in. */
const BootLoad = (() => {
  const MIN = 1.2, MON_BUDGET = 3.0, FRAME_MS = 9;
  let done = false, el = null, bar = null, lbl = null;
  const now = () => performance.now() / 1000, frame = () => new Promise(r => requestAnimationFrame(() => r())), held = [];
  function set(u, what) { if (!el) return; bar.style.transform = `scaleX(${Math.max(0, Math.min(1, u)).toFixed(3)})`; if (what) lbl.textContent = what; }
  function overlay() { el = document.createElement('div'); el.className = 'stage-load boot-load';
    el.innerHTML = '<div class="sl-pic"></div><div class="sl-shade"></div><div class="sl-foot"><div class="sl-bar"><i></i></div><small class="sl-lbl">Loading</small><p class="sl-tip"></p></div>';
    document.body.appendChild(el); bar = el.querySelector('.sl-bar i'); lbl = el.querySelector('.sl-lbl'); el.querySelector('.sl-tip').textContent = 'Getting every stage ready for you';
    const pic = el.querySelector('.sl-pic'); LOAD_PICS.load('meadow').then(u => { if (u) { pic.style.backgroundImage = `url("${u}")`; void pic.offsetWidth; pic.classList.add('in'); } else el.classList.add('noimg'); }); }
  /* the Tower's tile size on this screen (20b layout: min(W / 9.6, H / 12.5), 28..64) and its pixel scale */
  const tileT = () => Math.max(28, Math.min(64, Math.round(Math.min(innerWidth / 9.6, innerHeight / 12.5)))), pxK = () => Math.min(2, Math.max(1, devicePixelRatio || 1));
  async function run() { if (done) return; done = true;
    try { if (navigator.webdriver && !window.__BOOT_LOAD) return; } catch (e) {}
    if (typeof st === 'undefined' || !st) return;
    overlay(); const t0 = now(); set(0.03, 'Loading');
    try {
      // the stage pictures
      await Promise.all(StageLoad.POOL.map(k => LOAD_PICS.load(k)));
      set(0.15, 'Loading your pets');
      // the party's sprites and rigs
      const party = typeof partyPets === 'function' ? partyPets() : [st];
      for (const p of party) { try { const f = formOf(p); await loadSprites(f); await loadRig(f); } catch (e) {} }
      set(0.35, 'Preparing effects'); await frame();
      // the GPU painters
      try { const NM = self.NIDHOGG_MOVES, F = NM && NM.FGFX; if (F && F.usable()) { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d'), Q = F.begin(c, null);
          if (Q && Q.quad) { for (let k = 0; k <= 39; k++) Q.quad(k, 32, 32, 8, 0, 0, 8, '#88CCAA', 0.01, 0.5, 0.5, 0.5); F.flush(c); } }
        } catch (e) {}
      set(0.5, 'Preparing moves'); await frame();
      // the moves that prepare themselves ahead
      try { const T = () => tileT(); for (const p of party) { const K = petKit(p), kit = K && K.kit; if (!kit) continue;
          for (const sl of Object.keys(kit)) { const a = kit[sl]; if (!a || !a.e8 || !ELEM_IMPL[a.e8]) continue; const key = String(a.key || '').slice(3), I = (sl === 'ult' ? ELEM_IMPL[a.e8].ult : ELEM_IMPL[a.e8].strong)[key]; if (I && I.warm) try { I.warm({ evo: a.evo || 1, T }); } catch (e) {} } } } catch (e) {}
      set(0.6, 'Drawing the monsters'); await frame();
      // the monsters of the lands ahead
      try { const lands = new Set(); const n = Math.max(1, Math.min(typeof TOWER_TOP !== 'undefined' ? TOWER_TOP : 120, (st.dun && st.dun.best || 0) + 1)), F = floorDef(n); [F.biome, F.sec, F.ter].forEach(b => b && lands.add(b));
        if (typeof RIFT_PLAN !== 'undefined') for (const r of RIFT_PLAN) { try { if (!r.final && riftOpen(r.id) && !riftSealed(r.id)) lands.add(r.id); } catch (e) {} }
        const types = Object.keys(MON).filter(t => MON[t] && (MON[t].bio || []).some(b => lands.has(b))), jobs = [], rk = tileT() * pxK();
        for (const t of types) { const D = MON[t], nf = (DunArt.NF && DunArt.NF[t]) || 4; for (let i = 0; i < nf; i++) for (const el2 of [false, true]) jobs.push(() => DunArt.monSprite(t, D.r * (el2 ? 1.35 : 1) * rk, (i + 0.5) / nf, D.color, '', false)); }
        const tm = now(); let j = 0; while (j < jobs.length && now() - tm < MON_BUDGET) { const f0 = performance.now(); while (j < jobs.length && performance.now() - f0 < FRAME_MS) { try { jobs[j](); } catch (e) {} j++; } set(0.6 + 0.35 * j / jobs.length); await frame(); } } catch (e) {}
      try { if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 800))]); } catch (e) {}
      while (now() - t0 < MIN) { await frame(); }
    } catch (e) {}
    set(1, 'Ready'); await frame(); el.classList.add('out'); setTimeout(() => { el.remove(); }, 450); }
  return { run, get el() { return el; } };
})();
