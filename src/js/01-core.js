/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const hyp = Math.hypot;
const now = () => performance.now() / 1000;
let reduceMotion = false;
try { reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
const dayKey = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dayGap = (a, b) => {
  if (!a || !b) return Infinity;
  const p = a.split('-').map(Number), q = b.split('-').map(Number);
  return Math.round((Date.UTC(q[0], q[1] - 1, q[2]) - Date.UTC(p[0], p[1] - 1, p[2])) / 864e5);
};
const isNightAt = t => { const h = new Date(t).getHours(); return h >= 22 || h < 7; };
const isNight = () => isNightAt(Date.now());
const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtNum = n => { n = Math.floor(n); return n >= 100000 ? Math.round(n / 1000) + 'k' : n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n); };
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function wpick(rng, list) {
  let tot = 0;
  for (const o of list) tot += o.w;
  let r = rng() * tot;
  for (const o of list) { r -= o.w; if (r < 0) return o; }
  return list[list.length - 1];
}
const byId = (list, id) => list.find(o => o.id === id) || list[0];
const r1 = v => Math.round(v * 10) / 10;
const FAST = 240; // fast-forward: 1 real minute = 4 pet hours
