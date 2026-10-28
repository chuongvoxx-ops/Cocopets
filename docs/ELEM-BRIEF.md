# Elemental moves: how to write an element file

Read first: `src/js/20k1-elem-core.js` (the data, the rules, the toolkit) and `src/js/20k2-elem-earth.js` (the finished
reference: 10 Strongs + 10 Ultimates, every pattern you need). Your element's creative spec is in `docs/elem-spec/<element>.md`.
Match the spec's choreography move by move; the names and keys are fixed in `ELEM_MOVES` (core) and must be used exactly.

## The file
`src/js/20kN-elem-<element>.js`, one IIFE: `ELEM_IMPL.<element> = (() => { ...; return { strong: S, ult: U }; })();`
Element keys: `wind`, `light`, `dark`, `fire`, `water`, `ice`, `thunder` (the game's Lightning is `thunder` internally).
`S.<key> = (C, h) => { H = h; ... }` for each of the 10 Strong keys, `U.<key>` for the 10 Ultimate keys, keys from `ELEM_MOVES.<element>`.
Only this file. Do not edit the core, the game, the tests, or any other element. Do not commit.

## The cast C
`C.a` aim angle (rad), `C.tx/C.ty` the aimed point (the aimed monster, else ~3-4 tiles ahead), `C.base` the damage unit,
`C.col / C.core / C.dark` the element's colours, `C.K` 1 (1.25 when the Ultimate is in its Celestial form, `C.up`),
`C.dmgO(extra)` the hit options: always pass it, it carries the element so reactions work (`extra`: `kb`, `stun`, `freeze`, `chill`, `burn`, `venom`, `dot`+`dotC`, `noText`).
`H.me` the pet (x, y, sq squash-to-pose: set `me.sq = 0.6` on a stamp/thrust), `H.g` the game, `H.X` the game context.

## Damage (Strong ≈ 2–3× base total; Ultimate ≈ 10–16× base total spread over its beats)
`H.hitArea(x, y, r, dmg, o)`, `H.hitLine(x, y, a, len, w, dmg, o)`, `H.hitCone(x, y, a, len, halfSpread, dmg, o)`, `H.hitRing(x, y, r0, r1, dmg, o)`;
`H.X.hitMon(m, dmg, o)` for one monster; `H.near(x, y, r)`, `H.living()`, `H.sortNear(x, y)`.
A hit lands exactly when its visible impact lands (`H.X.after(seconds, fn)` for timing). Repeating fields re-hit with a `hits` Map or a tick (see `quarry`, `sandglass`).
Control: `H.pull(m, x, y, step)`, `H.push(m, x, y, step)`, `H.slow(m, secs)`, `H.lift(m, secs, height)`, `H.bind(m, secs)` — all leave bosses in place (bosses still take the damage); never move a monster yourself.
Pet warnings for delayed areas: `H.warn(x, y, r, life, C.col, fn?)`, `H.warnLine(x, y, a, len, w, life, col, fn?)`, `H.warnCone(x, y, a, len, halfSpread, life, col, fn?)` — the element's colour, so they read as the pet's and not a monster's red. `H.fire(x, y, r, life, dps, el)` leaves a burning/elemental patch.

## Effects
`H.add({ life, x?, y?, update(dt, f), draw(c, f, X, Y, T, t), drawUnder(...) })` — an fx object; `X, Y` its screen point (the pet's when x/y are not set), `T` tile px, `t` game time.
`drawUnder` paints on the floor beneath monsters and pets (patterns, cracks, pools); `draw` paints above. Set `f.life = 0` to end early. `H.fade(f, inSecs, outSecs)` is a 0..1 envelope.
Screen space: the floor is seen from above-and-ahead, so a floor circle is an ellipse squashed by `H.GY` (0.55); height goes up the screen (`Y - z * T`).
Helpers: `H.floorEllipse, H.poly, H.block, H.spike, H.crystal, H.ribbon(pts, w, col, core, taper), H.arcRibbon, H.glow(c,x,y,r,col,a), H.ray(c,x,y,a,len,w,col,a), H.shadow, H.ease.{out,in,io,back,pop}, H.rgba(hex,a), H.line()` (the outline colour).
Particles: `H.P({kind, ...})` with kinds spark, shard (rot/vr), petal, snow, bubble, ember, star, glow, flare, smoke (`color: 'rgba(r,g,b,'`), beamfx (`a, r, w`), pillar, slash (`a, r, flip`), spike, wind; `H.burst(x, y, kind, count, {v, up, g, life, size, color|[colors]})`, `H.glowAt`, `H.flareAt`.
`H.X.ring(x, y, r0, r1, life, col, alpha)`, `H.X.boom(x, y, r, col, core, {n, shake, smoke})`, `H.X.zap(x1,y1,x2,y2,col,w)`, `H.X.bolt(x, y, col)` (a sky bolt), `H.X.flash(secs, col)`, `H.X.shake(amp, secs)`, `H.X.hitstop(secs)`, `H.X.light(x, y, r, secs)`, `H.X.sparks(x, y, col, n, v)`.
Projectiles: `H.X.shot({ x, y, vx, vy, dmg, r, life, pierce, style, el: C.el, src: 'strong'|'ult', onHit, onEnd, onTick })` (styles: bolt, orb, dart, needle, crescent, laser, comet, spear, crystal, lance5, serpent, bubble, leaf, star, diamond, boom).
Sounds: `H.X.sfx.whoosh/thud/crash/hum/sparkle/zap/crack/twang/chirp/wrong` (check with `&&` for the rarer ones).
Banner an Ultimate once: `H.X.banner('NAME', '', C.col, 1.4)`.

## Shading and rendering (required: the user asked for special, realistic shading on every attack)
Nothing is a flat shape. Every solid has a lit side, a core tone and a dark side with a rim of reflected light; every glassy
thing (ice, water, amber, light panels) is translucent with a highlight band, a specular point and a darker edge; every glowing
thing has an additive hot core inside a soft halo; floating things cast a soft shadow on the floor; moving things leave a
motion trail. The light is upper-left (`H.LX, H.LY`). Use the helpers: `H.sphere(c,x,y,r,col,lit,dark,{rim,spec})`,
`H.slab(c,pts,col,lit,dark)` (gradient polygon with a bevel), `H.glass(c,pts,tint,alpha,{lit,dark,edge})`, `H.core(c,x,y,r,col,hot,a)`,
`H.trail(c,pts,w,col,core)`, `H.softShadow(c,x,y,r,a)`, `H.mix(h1,h2,k)`; `H.block`, `H.spike`, `H.crystal` are already shaded.
Layer them: shadow → body gradient → highlight/rim → additive glow → outline (`H.line()`), the game's cel look with depth inside it.
Make gradients per draw only for hero shapes (a few dozen a frame is fine); particles stay flat.

## Rules
- Fewer effects: wrap decorative particle counts in `H.n(k)` and chance spawns in `Math.random() < p * H.Q()`. Shapes, warnings and hits never thin out.
- Everything you add ends: every fx has a finite `life`; nothing is left on the game or a monster (clear `m.z`, flags, etc. in `onEnd`).
- Draw cheaply: polygons, a few glow sprites; no per-frame gradients in loops, no huge particle counts (≤ ~40 per burst, ≤ ~3 random spawns per frame).
- No negative radii (`Math.max(1, ...)` when scaling in), no NaN positions. No camera moves.
- Keep each element's own vocabulary (see the spec's table); Water ≠ Ice, Light ≠ Lightning; Dark stays visible on dark floors (violet edges, pale highlights).
- Ultimates: 3.5–5 s of choreography with 3–6 damage beats and a readable climax; Strongs: 0.3–2.5 s.

## Test
```
python3 src/build.py --test-only test-<element>.html
HTML=test-<element>.html ELEM=<element> node tests/elem-moves.js            # all 20; add SHOTS=1 for a screenshot of each in shots/
HTML=test-<element>.html ELEM=<element> ONLY=key1,key2 SHOT_MS=1500 SHOTS=1 node tests/elem-moves.js
```
Syntax check before running: extract and `node --check` as in the repo notes, or just run the test (a syntax error shows as `__pp` never appearing).
Every move must: land damage, leave `fxLeft 0`, no ERRORS, and look like its spec in the screenshots (look at them: `shots/elem-<element>-<slot>-<key>.png`, taken SHOT_MS after the cast; take two or three at different SHOT_MS for the long ones).
