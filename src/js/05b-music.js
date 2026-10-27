/* ---------- music: the player's own songs, built into the game (MUSIC_DATA) and played through Web Audio ----------
   Carta Misteriosa plays over the world map on the Adventure screen, in rift puzzles and in the zodiac gates;
   Exploratory World plays in the house, with the pets; Champions Charge in the Tower's floors and the rifts' dungeons;
   Triumph of the Hero for every boss, the rifts' three and the Tower's. Each loops while the player stays, fades out on
   leaving, and crossfades into the next.
   Nothing is fetched: each song is decoded from the page itself when it is wanted (only the one playing is kept
   decoded, to spare a phone's memory). Phones let a page make sound only after a tap, so the sound engine starts (and
   resumes) on taps; an iPhone is told the page plays music, so its silent switch does not mute it. */
const music = (() => {
  const VOL = 0.6, FADE = 1.2;
  let ctx = null, master = null, cur = null, src = null, voice = null, buf = {}, decoding = null, forced, level = 0, err = '', primed = false;
  function make() {
    if (ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { err = 'no audio'; return; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    // (a 24 kHz engine: the songs are 24 kHz, and a decoded song then takes half the memory)
    try { ctx = EMBED ? new AC({ sampleRate: 24000 }) : new AC(); } catch (e) { try { ctx = new AC(); } catch (e2) { ctx = null; err = 'audio ' + e2.name; return; } }
    master = ctx.createGain(); master.gain.value = VOL; master.connect(ctx.destination);
  }
  function tap() { make(); if (!ctx) return; if (ctx.state !== 'running') ctx.resume().catch(e => { err = e.name; });
    // (an iPhone also wants a sound started inside the tap itself: a moment of silence does)
    if (!primed) { primed = true; try { const b = ctx.createBuffer(1, 1, ctx.sampleRate), s = ctx.createBufferSource(); s.buffer = b; s.connect(master); s.start(0); } catch (e) {} } }
  // (phones count a tap as leave to make sound when the finger lifts: touchend / pointerup / click, never pointerdown)
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, tap, { capture: true, passive: true }));
  // (the songs come either built into the page, compressed, for the Claude build, or as full-quality files beside the
  // page, for the website build, which leaves MUSIC_DATA out)
  const FILES = { carta: 'music/carta-misteriosa.mp3', explore: 'music/exploratory-world.mp3', triumph: 'music/triumph-of-the-hero.mp3', charge: 'music/champions-charge.mp3' };
  const EMBED = typeof MUSIC_DATA !== 'undefined';
  function bytes(k) { if (!EMBED) return fetch(FILES[k]).then(r => { if (!r.ok) throw new Error('song ' + r.status); return r.arrayBuffer(); });
    const s = atob(MUSIC_DATA[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return Promise.resolve(a.buffer); }
  function decode(k) {
    if (buf[k]) return Promise.resolve(buf[k]);
    return bytes(k).then(ab => new Promise((res, rej) => { try { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }))
      .then(b => { buf = { [k]: b }; return b; });   /* keep only this one */
  }
  /* which song this moment wants. Outside the games: the world map's, the house's, or none (the other map tabs).
     In the Tower and the rifts: a boss's song while a boss is fought (a rift's boss stage, a Tower guardian once woken, a
     Super Fiend floor), the dungeons' song on fighting floors and rift dungeons and trials, and the map's song in rift
     puzzles and the zodiac gates. The other arcade games keep their own sounds */
  function want() {
    if (forced !== undefined) return forced;
    if (typeof st === 'undefined' || !st || st.sound === false || document.hidden) return null;
    if (typeof arc !== 'undefined' && arc.open) {
      const D = arc.game && arc.game._dbg, F = D && D.F; if (!F || (arc.state !== 'play' && arc.state !== 'loading' && arc.state !== 'ready')) return null;
      const R = F.rift;
      if (R) { if (R.kind === 'boss') return 'triumph'; if (R.gate || R.kind === 'gate') return 'carta';
        let S = null; try { S = RIFT_BY_ID[R.id].stages[R.stage]; } catch (e) {}
        return R.kind === 'fight' || (S && S.trial) ? 'charge' : 'carta'; }
      return F.fiend || (D.g && D.g.boss && !D.g.won) ? 'triumph' : 'charge';
    }
    if (!introEl.hidden || !splashEl.hidden) return null;
    if (mapOpen) return mapTab === 'world' ? 'carta' : null;
    return 'explore';
  }
  function stop(fade) { if (!src) return; const s = src, v = voice, t = ctx.currentTime; try { v.gain.cancelScheduledValues(t); v.gain.setValueAtTime(v.gain.value, t); v.gain.linearRampToValueAtTime(0, t + fade); s.stop(t + fade + 0.05); } catch (e) {} src = voice = null; }
  function play(k) {
    cur = k; if (decoding === k) return; decoding = k;
    decode(k).then(b => { decoding = null; if (cur !== k || !ctx) return; stop(0.05);
      const s = ctx.createBufferSource(), v = ctx.createGain(), t = ctx.currentTime; s.buffer = b; s.loop = true; v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(1, t + FADE); s.connect(v); v.connect(master); s.start(t); src = s; voice = v; level = 1; })
      .catch(e => { decoding = null; err = 'decode ' + (e && e.name || e); });
  }
  function tick() {
    const w = want();
    if (w === cur) return;
    if (!w) { stop(FADE * 0.7); cur = null; level = 0; return; }
    make(); if (!ctx) return; stop(FADE * 0.7); level = 0; play(w);
  }
  setInterval(tick, 150);
  /* a song wanted but the sound engine not running yet (no tap since the page opened): a small chip asks for a tap */
  let chip = null, waitN = 0;
  setInterval(() => { const stuck = !!cur && (!ctx || ctx.state !== 'running' || (!src && !decoding)); waitN = stuck ? waitN + 1 : 0;
    const show = waitN >= 4;
    if (show && !chip) { chip = document.createElement('div'); chip.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);transform:translateX(-50%);z-index:9999;background:rgba(20,18,30,.82);color:#fff;font:600 13px system-ui,sans-serif;padding:6px 12px;border-radius:14px;pointer-events:none;text-align:center'; document.body.appendChild(chip); }
    if (chip) { if (!show) { chip.remove(); chip = null; } else chip.textContent = '♪ Tap for music' + (err ? '  ·  ' + err : ctx ? '  ·  ' + ctx.state : ''); } }, 500);
  return { get track() { return cur; }, get level() { return src ? level : 0; }, get playing() { return !!(src && ctx && ctx.state === 'running'); }, get err() { return err; }, get state() { return ctx ? ctx.state : 'none'; }, want, force(k) { forced = k; } };
})();
