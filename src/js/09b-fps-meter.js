/* ---------- v437 GR: the frame counter (Settings > Frame counter: st.fps, saved, off by default) ----------
   The user (v437): "I would also like a frame counter so I can see how fast it run on my phone." A small readout in a corner
   on every screen (the room, the town, the map, the Tower and the rifts, the Anima gates): frames a second (over the last
   half second), the time a frame takes (its mean over the same half second) and the slowest frame of the last second.
   Measured from the requestAnimationFrame timestamps of the game's own loop (10-main's frame, which runs on every screen:
   every frame of the page passes through it, whatever else draws in that frame). Cheap: the timestamps go into a fixed ring
   (no allocation a frame), the text is worked out and written four times a second, only when it changed, into one text node
   of a fixed-size, fixed-position box (contain: strict, pointer-events none: no layout of the page). It sits at the top edge
   in the middle, under the safe area (--sat) and clear of the HUD's corners. API (global FPSM): tick(ms), sync(), read() */
const FPSM = (() => {
  const N = 240, T = new Float64Array(N);
  let n = 0, head = 0, last = 0, el = null, txt = null, shown = false, nextUp = 0, said = '', band = '';
  const want = () => !!(typeof st !== 'undefined' && st && st.fps);
  function build() { el = document.createElement('div'); el.id = 'fpsMeter'; el.setAttribute('aria-hidden', 'true'); txt = document.createTextNode(''); el.appendChild(txt); document.body.appendChild(el); }
  function sync() { const w = want(); if (w === shown) return; shown = w;
    if (w) { if (!el) build(); el.hidden = false; n = 0; last = 0; nextUp = 0; said = ''; txt.nodeValue = '·· fps'; } else if (el) el.hidden = true; }
  // the numbers now: { fps, ms (the mean frame), worst (the slowest frame of the last second), n }
  function read(now) { if (!n) return null; now = now == null ? T[(head - 1 + N) % N] : now;
    let cnt = 0, sum = 0, worst = 0; for (let k = 1; k < n; k++) { const i = (head - k + N) % N, j = (i - 1 + N) % N, end = T[i], dt = end - T[j]; if (end < now - 1000) break;
      if (dt > worst) worst = dt; if (end >= now - 500) { cnt++; sum += dt; } }
    return cnt ? { fps: 1000 * cnt / sum, ms: sum / cnt, worst, n: cnt } : null; }
  function tick(ms, arcF) { if (want() !== shown) sync(); if (!shown) return;
    /* (v439 SP) while the Tower or a rift is open, the arcade's own drawn frames are counted (a paced 30 skips display frames;
       this loop would still read 60): 10-main's ticks are left out then. window.__SP_OFF = 1: as v438 */
    if (!arcF && typeof arc !== 'undefined' && arc.open && arc.state === 'play' && typeof GQ !== 'undefined' && window.__SP_OFF !== 1) return;
    if (last && ms - last > 1000) n = 0;   // (a pause: a hidden tab, a suspended page; start over)
    last = ms; T[head] = ms; head = (head + 1) % N; if (n < N) n++;
    if (ms < nextUp) return; nextUp = ms + 250;
    const R = read(ms); if (!R) return;
    let s = `${Math.round(R.fps)} fps · ${R.ms.toFixed(1)} ms · max ${Math.round(R.worst)}`;
    /* (v439 SP) Settings > Frame counter details (st.fpsD): the detailed readout under it (PERF.lines), and the quality in use */
    const det = !!(st && st.fpsD && typeof PERF !== 'undefined' && window.__SP_OFF !== 1); if (det !== (el.dataset.d === '1')) el.dataset.d = det ? '1' : '';
    if (det) s += '\n' + PERF.lines(); else if (typeof GQ !== 'undefined' && window.__SP_OFF !== 1 && typeof arc !== 'undefined' && arc.open && arc.mode === 'dungeon' && GQ.level() > 0) s += ' · ' + GQ.name().replace('Auto: ', 'A:').replace('Performance', 'Perf').replace('Balanced', 'Bal');
    if (s !== said) { said = s; txt.nodeValue = s; }
    const b = R.fps >= 50 ? 'ok' : R.fps >= 28 ? 'mid' : 'low'; if (b !== band) { band = b; el.dataset.b = b; } }
  return { tick, sync, read, get el() { return el; } };
})();
