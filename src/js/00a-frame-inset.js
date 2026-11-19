/* ---------- (v422 HD) framed pages ignore the top safe-area inset ----------
   Inside a frame (the artifact viewer below claude.ai's own bar) iOS still reports the phone's notch as the top inset, so
   the in-game header carried an empty band of about 60 px above it. A framed page never sits under the status bar: the
   top inset is taken as 0 there (--sat, read by the header's padding); a page of its own keeps the real inset. */
(() => { try { if (window.self !== window.top) document.documentElement.style.setProperty('--sat', '0px'); } catch (e) { try { document.documentElement.style.setProperty('--sat', '0px'); } catch (e2) {} } })();
