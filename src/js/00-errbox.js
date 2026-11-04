/* ---------- a visible error box: any uncaught error shows its message on screen (so a phone without a console can report it) ---------- */
(() => {
  let box = null, n = 0;
  function show(msg, where) {
    n++; if (n > 6) return;
    if (!box) { box = document.createElement('div'); box.id = 'errbox';
      box.style.cssText = 'position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:2147483647;background:#2B1630;color:#FFE4F2;border:2px solid #FF5CCB;border-radius:10px;padding:10px 12px;font:12px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-word;max-height:45vh;overflow:auto;box-shadow:0 4px 18px rgba(0,0,0,.5)';
      box.addEventListener('click', () => { box.remove(); box = null; n = 0; });
      (document.body || document.documentElement).appendChild(box);
      box.textContent = 'Something went wrong (tap to close). Please screenshot this:\n'; }
    box.textContent += '\n• ' + String(msg).slice(0, 300) + (where ? '\n  ' + String(where).slice(0, 300) : '');
  }
  const loc = st => { const l = String(st || '').split('\n').find(s => /\d+:\d+/.test(s)); return l ? l.trim().replace(/^at /, '').replace(/https?:\/\/[^ )]*\//, '') : ''; };
  addEventListener('error', e => { if (!e || !e.message) return; show(e.message, (e.error && loc(e.error.stack)) || (e.lineno ? 'line ' + e.lineno + ':' + e.colno : '')); });
  addEventListener('unhandledrejection', e => { const r = e && e.reason; show('(async) ' + (r && r.message || r), r && loc(r.stack)); });
  globalThis.__errbox = show;
})();
