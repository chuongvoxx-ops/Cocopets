// Rift 0 (v390 M) pictures at phone size (390 x 844) into shots/: each corrupted Cocopet at its gate and mid-attack (GPU:
// PetGL body, FGFX corruption; DPR 1, swiftshader is slow at 2), a pack with its leader, a fall, GPU close-ups read straight
// from the canvas the GPU frames are copied into, and the no-WebGL fallback (RiftEvil.draw) for comparison (DPR 2); each
// frame's path (PetGL / FGFX / 2D) is recorded in shots/cal-m-status.json and printed under it on shots/cal-m-sheet.png.
// HTML=test-calM.html node tests/_cal-m-shots.js [job ...]   jobs: g0 g3 g6 leader fall close 2d sheet (default: all; each in
// a browser of its own, so one crash costs one job)
process.env.HTML = process.env.HTML || 'test.html';   // (GPU frames at DPR 1: swiftshader is slow at 2; the 2D frame at DPR 2)
const path = require('path'), { execFileSync } = require('child_process');
const { open } = require('./_rift-lib');
const DIR = path.resolve(__dirname, '../shots');
(async () => {
  const fs = require('fs'), SF = path.join(DIR, 'cal-m-status.json'); let status = {}; try { status = JSON.parse(fs.readFileSync(SF, 'utf8')); } catch (e) {}
  const jobs = process.argv.slice(2).length ? process.argv.slice(2) : ['g0', 'g3', 'g6', 'leader', 'fall', 'close0', 'close3', 'close6', '2d', 'sheet'];
  let allErr = [];
  for (const job of jobs) { if (job === 'sheet') continue;
    const twoD = job === '2d'; if (twoD) process.env.SHOTS = '1'; else delete process.env.SHOTS;
    const T = await open({ lvl: 10 }); const page = T.page, errors = T.errors;
    const start = async (id, stage) => { await page.evaluate(([id, stage]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift(id, stage); }, [id, stage]); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 300000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 300000 }); await page.waitForTimeout(400); };
    await page.evaluate(() => { const P = window.__pp; P.st.dun.seen = P.st.dun.seen || {}; for (const t in P.MON) P.st.dun.seen[t] = 1; });
    const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
      else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
    const path2 = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, G = D.RIFT && D.RIFT.self.amb.C.guard, S = G && G.m.calMini; return S ? (S.gl ? 'GPU: PetGL 2.5D' : '2D: RiftEvil.draw') + (S.gpuFx ? ' + FGFX fx' : '') + ` (PetGL frames ${S.glHit || 0}/${(S.glHit || 0) + (S.glMiss || 0)})` : ''; });
    const shot = async name => { const st2 = await path2(); await freeze(true); try { await page.screenshot({ path: path.join(DIR, name + '.png'), timeout: 300000 }); } finally { await freeze(false); } status[name] = st2; console.log('shot', name, st2); return name; };
    // (game time stepped through the game's own update without drawing: GPU frames are slow under swiftshader; then two
    // drawn frames for the camera and the picture)
    const runG = (secs, each) => page.evaluate(async ([secs, each]) => { const P = window.__pp, D = P.arc.game._dbg, U = P.arc.game, f = new Function('D', 't', each || 'return false'); let t = 0;
      while (t < secs) { U.update(0.05); t += 0.05; D.me.hp = D.ST.hp; D.g.taps = 9; if (f(D, t) === true) break; }
      for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r)); return +t.toFixed(2); }, [secs, each || null]);
    await page.evaluate(gpu => { if (gpu) { window.__NG_GL = 1; window.__forcePetGL = 1; window.__CAL_GL = 1; window.__calMini2D = 0; } else { window.__NG_GL = 0; window.__CAL_GL = 0; window.__calMini2D = 1; } }, !twoD);
    const ready = () => page.evaluate(() => new Promise(r => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.amb.C.guard.m; let n = 0; const w = () => (m.evil.ready || n++ > 100 ? r() : setTimeout(w, 100)); w(); }));
    // (its GPU layers: PetGL builds them in the background the first time the form is drawn; draw until they are in)
    const glIn = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.amb.C.guard.m.calMini; for (let i = 0; i < 80 && !S.gl; i++) await new Promise(r => setTimeout(() => requestAnimationFrame(r), 60)); return !!S.gl; });
    const place = (dy, dx) => page.evaluate(([dy, dx]) => { const D = window.__pp.arc.game._dbg, G = D.RIFT.self.amb.C.guard, X = D.RIFT.self.amb.C.X; for (const m of (D.g.reserve || [])) m.dead = true; D.g.reserve.length = 0; for (const m of D.mons) if (!m.dead && !m.boss && Math.hypot(m.x - G.home.x, m.y - G.home.y) < 12) m.dead = true;   // (quietly: no numbers, no confetti in the pictures)
      // (a floor tile about dy tiles from its post, in sight of it, south of it if it can be: the camera frames both)
      let best = null, bs = 1e9; for (let ty = Math.floor(G.home.y - dy - 2); ty <= G.home.y + dy + 2; ty++) for (let tx = Math.floor(G.home.x - dy - 2); tx <= G.home.x + dy + 2; tx++) { if (!D.walkAt(tx, ty)) continue; const x = tx + 0.5, y = ty + 0.5, d = Math.hypot(x - G.home.x, y - G.home.y); if (Math.abs(d - dy) > 1.2 || !D.X.los(x, y, G.home.x, G.home.y)) continue; const s2 = Math.abs(d - dy) + Math.abs(x - G.home.x - (dx || 0)) * 0.5 + (y < G.home.y ? 3 : 0); if (s2 < bs) { bs = s2; best = { x, y }; } }
      const p = best || X.walkPoint(G.home.x, G.home.y + dy, null); D.me.x = p.x; D.me.y = p.y; D.me.vx = D.me.vy = 0; }, [dy, dx]);
    try {
      if (/^g\d$/.test(job)) { const st = +job.slice(1);
        await start('caldera', st); await runG(6); await ready();
        // at its gate, held at its post for the picture (no wake, no banner)
        await page.evaluate(() => { const G = window.__pp.arc.game._dbg.RIFT.self.amb.C.guard; G.m.aggro = false; G.m.calMini.hold = true; G.m.brute = true; });
        await place(3.6); await runG(3.4); if (!twoD) console.log('gl in', await glIn()); await shot(`cal-m-${st}-gate`);
        // awake, mid-attack: its ranged move or its signature's tell (a lunge only late)
        await page.evaluate(() => { const G = window.__pp.arc.game._dbg.RIFT.self.amb.C.guard; G.m.calMini.hold = false; G.m.brute = false; G.m.aggro = false; G.m.calMini.woke = false; });
        await place(4.0); const got = await runG(30, "const m = D.RIFT.self.amb.C.guard.m; return m.aggro && ((m.act === 'lunge' && m.actT > 0.35 && m.actT < 0.9 && t > 16) || (m.act === 'pounce' && m.actT > 0.7 && m.actT < 1.1) || (m.act === 'howl' && m.actT > 0.8) || (m.act === 'rain' && m.actT > 0.6) || ((m.act === 'fire' || m.act === 'ice') && m.actT > 0.6) || (m.act === 'beam' && m.actT > 0.9 && m.actT < 1.2)) && t > 2.5;");
        console.log(st, 'attack at', got, await page.evaluate(() => window.__pp.arc.game._dbg.RIFT.self.amb.C.guard.m.act)); await shot(`cal-m-${st}-attack`); }
      if (job === 'leader') { await start('caldera', 0); await runG(5.2);
        const L = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, G = D.RIFT.self.amb.C.guard, X = D.RIFT.self.amb.C.X; const open = q => { let n = 0; for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (D.walkAt(Math.floor(q.x) + xx, Math.floor(q.y) + yy)) n++; return n - (D.propList || []).filter(p => !p.broken && Math.hypot(p.x - q.x, p.y - q.y) < 2.5).length * 6; }, L = G.leaders.filter(q => !q.dead && D.mons.includes(q)).sort((a, b) => open(b) - open(a))[0] || G.leaders[0]; let best = null, bs = 1e9; for (let ty = Math.floor(L.y); ty <= L.y + 6; ty++) for (let tx = Math.floor(L.x - 3); tx <= L.x + 3; tx++) { if (!D.walkAt(tx, ty)) continue; const d = Math.hypot(tx + 0.5 - L.x, ty + 0.5 - L.y); if (d < 2) continue; const s2 = Math.abs(d - 2.8); if (s2 < bs) { bs = s2; best = { x: tx + 0.5, y: ty + 0.5 }; } } const p = best || X.walkPoint(L.x, L.y + 4, null); D.me.x = p.x; D.me.y = p.y; window.__hold = [p.x, p.y]; return { type: L.type, hp: L.maxhp }; });
        await runG(2.6, "D.me.x = window.__hold[0]; D.me.y = window.__hold[1];"); console.log('leader', JSON.stringify(L)); await shot('cal-m-0-leader'); status['cal-m-0-leader'] = 'GPU: FGFX ring, aura, gem'; }
      if (job === 'fall') { await start('caldera', 0); await runG(0.6); await ready(); await place(3.6); await runG(6); console.log('gl in', await glIn());
        await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.amb.C.guard.m; D.hitMon(m, 1e9, { flat: true }); });
        await runG(0.75); await shot('cal-m-0-fall'); await runG(0.6); await shot('cal-m-0-fall-burst'); }
      if (/^close/.test(job) || job === '2d') {
        if (job === '2d') { await start('caldera', 3); await runG(1); await place(4); await runG(4); await shot('cal-m-3-2d'); }
        // close-ups read straight from a canvas: each guardian drawn by the game's own call (RiftEvil.draw -> its GPU path, or
        // the 2D fallback), idle and in a tell, on a dark floor and a light one
        const keys = job === '2d' ? [3] : /^close\d$/.test(job) ? [+job.slice(5)] : [0, 3, 6], urls = [];
        for (const st of keys) { await start('caldera', st); await runG(1); await ready();
          const r = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, m = D.RIFT.self.amb.C.guard.m, S = m.calMini; const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 420; const c = cv.getContext('2d'); S.hit0 = S.glHit || 0;
            const frame = () => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1000, 420); c.fillStyle = '#2B2627'; c.fillRect(0, 0, 500, 420); c.fillStyle = '#D8D2CC'; c.fillRect(500, 0, 500, 420); const r = 54, save = { aggro: m.aggro, act: m.act, ecast: m.ecast }, t = performance.now() / 1000;
              m.aggro = false; m.act = 'move'; S.tell = 0; P.RiftEvil.draw(c, m, 130, 300, r, t, D.me); m.aggro = true; m.act = S.def.sig; m.ecast = 1; S.tell = 1; P.RiftEvil.draw(c, m, 370, 300, r, t + 0.7, D.me);
              S.tell = 0; m.aggro = false; m.act = 'move'; m.ecast = 0; P.RiftEvil.draw(c, m, 630, 300, r, t, D.me); m.aggro = true; m.act = S.def.volley; m.ecast = 1; P.RiftEvil.draw(c, m, 870, 300, r, t + 1.3, D.me); Object.assign(m, save); S.tell = 0; };
            for (let i = 0; i < 40; i++) { frame(); await new Promise(r => setTimeout(r, 50)); }
            return { url: cv.toDataURL(), path: (S.gl ? 'GPU: PetGL 2.5D' : '2D: RiftEvil.draw') + (S.gpuFx ? ' + FGFX fx' : '') + ` (PetGL frames ${(S.glHit || 0) - S.hit0}/160)`, species: m.evil.species }; });
          const nm = `cal-m-${st}-closeup${job === '2d' ? '-2d' : ''}`; fs.writeFileSync(path.join(DIR, nm + '.png'), Buffer.from(r.url.split(',')[1], 'base64')); status[nm] = r.path; console.log('closeup', nm, r.path, r.species); } }
    } catch (e) { console.error(job, e.message); allErr.push(job + ': ' + e.message); }
    allErr = allErr.concat(errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)));
    fs.writeFileSync(SF, JSON.stringify(status, null, 1)); await T.browser.close(); }
  // the sheet: the frames in a 4-wide grid, 260 px wide each (the close-ups across two cells), each one's path under it
  const order = ['cal-m-0-gate', 'cal-m-0-attack', 'cal-m-3-gate', 'cal-m-3-attack', 'cal-m-6-gate', 'cal-m-6-attack', 'cal-m-0-leader', 'cal-m-0-fall', 'cal-m-0-fall-burst', 'cal-m-3-2d', 'cal-m-0-closeup', 'cal-m-3-closeup', 'cal-m-6-closeup', 'cal-m-3-closeup-2d'].filter(n => fs.existsSync(path.join(DIR, n + '.png')));
  const py = `
import sys, json
from PIL import Image, ImageDraw
d = sys.argv[1]; st = json.load(open(sys.argv[2])); names = sys.argv[3:]; W = 260; H = int(844 * W / 390); cols = 4
cells = []
for n in names:
    cells.append((n, 2 if 'closeup' in n else 1))
x = y = 0; pos = []
for n, w in cells:
    if x + w > cols: x = 0; y += 1
    pos.append((n, w, x, y)); x += w
    if 'closeup' in n and x >= cols: x = 0; y += 1
rowsH = {}
for n, w, cx, cy in pos: rowsH[cy] = max(rowsH.get(cy, 0), (int(420 * (W * 2) / 1000) if 'closeup' in n else H) + 34)
ys = {}; acc = 0
for r in sorted(rowsH): ys[r] = acc; acc += rowsH[r]
sheet = Image.new('RGB', (cols * W, acc), (18, 14, 20)); dr = ImageDraw.Draw(sheet)
for n, w, cx, cy in pos:
    im = Image.open(f'{d}/{n}.png').convert('RGB'); h = int(im.height * (W * w) / im.width); im = im.resize((W * w, h)); px, py = cx * W, ys[cy]; sheet.paste(im, (px, py))
    dr.text((px + 6, py + h + 4), n, fill=(255, 220, 200)); dr.text((px + 6, py + h + 18), st.get(n, ''), fill=(170, 230, 190))
sheet.save(f'{d}/cal-m-sheet.png')`;
  if (jobs.includes('sheet')) { execFileSync('python3', ['-c', py, DIR, SF, ...order]); console.log('sheet', path.join(DIR, 'cal-m-sheet.png')); }
  console.log('errors', allErr.length, allErr.slice(0, 4)); process.exit(allErr.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
