/* ---------- Destructible scenery and elemental residue ----------
   Every prop on a floor can be smashed. Breaking one leaves a patch of its element on the ground (ice shards, embers,
   a puddle, leaf litter, sparks, rubble, miasma, light motes). Monsters standing in a patch pick up that element as a
   mark, and a pet attack of another element that touches the patch sets off the matching reaction on everything
   nearby. One patch, one reaction: it is spent when it fires. */
const PROP_EL = {
  iceblock: 'frost', icespike: 'frost', snowman: 'frost', frozentree: 'frost', igloo: 'frost',
  brazier: 'fire', candles: 'fire', lamp: 'fire', boiler: 'fire', volcrock: 'fire', ashtree: 'fire',
  mangrove: 'bubble', reeds: 'bubble', cloudbush: 'bubble',
  pine: 'leaf', bush: 'leaf', oak: 'leaf', fern: 'leaf', shroom: 'leaf', log: 'leaf', stump: 'leaf', palm: 'leaf', bigflower: 'leaf', tulips: 'leaf', pinkshroom: 'leaf', cactus: 'leaf',
  server: 'spark', console: 'spark', neonpillar: 'spark', drum: 'spark', gear: 'spark',
  rock: 'gold', boulder: 'gold', stalag: 'gold', peakrock: 'gold', dunerock: 'gold', cairn: 'gold', pipe: 'gold', crate: 'gold', pillar: 'gold', brokenpillar: 'gold', marble: 'gold',
  bones: 'shadow', obsidian: 'shadow', statue: 'shadow', barrel: 'fire',
  lantern: 'prism', crystal: 'prism',
};
const RESIDUE_NAME = { fire: 'Embers', frost: 'Frost', bubble: 'Puddle', leaf: 'Leaf litter', spark: 'Live sparks', gold: 'Rubble', shadow: 'Miasma', prism: 'Light motes' };
const DunResidue = (() => {
  const TAU = Math.PI * 2;
  function create(X) {
    const { me, g, mons, props, M } = X, zones = [], byTile = new Map();
    props.forEach(p => { p.hp = p.kind === 'pillar' || p.kind === 'marble' || p.kind === 'boulder' || p.kind === 'peakrock' ? 3 : 2; p.el = PROP_EL[p.kind] || 'gold'; p.flash = 0; byTile.set(p.k, p); });
    const propAt = (tx, ty) => { const p = byTile.get(ty * M.MW + tx); return p && !p.broken ? p : null; };
    const col = el => el === 'prism' ? '#FFE9A8' : (X.EL(el) || X.EL('gold')).color;
    function hitProp(p, el, n) {
      if (!p || p.broken) return false;
      p.hp -= n || 1; p.flash = 0.12;
      X.sparks(p.x, p.y - 0.4, col(p.el), 5, 4);
      if (p.hp > 0) { X.sfx.thud(); return true; }
      breakProp(p); return true;
    }
    function breakProp(p) {
      p.broken = true; byTile.delete(p.k);
      M.G[p.k] = X.T_FLOOR;
      const c = col(p.el);
      for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 3.5; X.part({ kind: 'shard', x: p.x, y: p.y - 0.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: 9, life: 0.75, max: 0.75, size: 4 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, color: i % 3 ? c : '#FFFFFF' }); }
      X.boom(p.x, p.y - 0.2, 0.9, c, '#FFFFFF', { n: 8, shake: 3, smoke: p.el === 'fire' || p.el === 'shadow' ? 4 : 1 });
      X.sfx.crash();
      if (Math.random() < 0.35) X.drop('coin', p.x, p.y);
      zones.push({ x: p.x, y: p.y - 0.3, el: p.el, r: 1.45, life: 16, max: 16, t: Math.random() * 6, tk: 0, seed: Math.random() * 99 });
      X.text(p.x, p.y - 1.2, RESIDUE_NAME[p.el] || 'Residue', c, 12, { life: 0.9, max: 0.9 });
    }
    /* an attack of element `el` touching a patch of another element sets off the reaction */
    function touch(z, el, dmg, o) {
      const a = X.e8Of(z.el), b = X.e8Of(el);
      if (!a || !b || a === b) return false;
      z.life = 0;
      const rr = z.r + 0.9, hit = mons.filter(m => !m.dead && !m.fobj && !m.under && Math.hypot(m.x - z.x, m.y - z.y) < rr + m.r);
      hit.forEach(m => { m.mark = { el: a, t: 9 }; m.rxCd = 0; X.hitMon(m, Math.max(1, dmg * 0.6), { el, src: o && o.src || 'strong', kb: 2 }); });
      X.ring(z.x, z.y, 0.3, rr, 0.4, col(el), 0.3); X.ring(z.x, z.y, 0.2, rr * 0.7, 0.3, col(z.el), 0.2);
      for (let i = 0; i < 14; i++) { const ang = Math.random() * TAU, v = 2 + Math.random() * 4; X.part({ kind: 'spark', x: z.x, y: z.y - 0.2, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 1, life: 0.4, max: 0.4, size: 2.5, color: i % 2 ? col(el) : col(z.el) }); }
      if (!hit.length) X.text(z.x, z.y - 1, (X.REACT_NAME(a, b) || 'Reaction') + '!', '#FFFFFF', 13, { life: 0.9, max: 0.9 });
      X.light(z.x, z.y, 4, 0.4); X.sfx.pop();
      return true;
    }
    const at = (x, y, r) => zones.filter(z => z.life > 0 && Math.hypot(z.x - x, z.y - y) < z.r + (r || 0));
    function shotAt(b) { if (!b.el) return; for (const z of at(b.x, b.y, b.r)) if (touch(z, b.el, b.dmg, b)) return; }
    function areaHit(x, y, r, dmg, o) {
      // props in the blast break, patches in it react
      for (const p of props) if (!p.broken && Math.hypot(p.x - x, p.y - (y + 0.3)) < r + 0.4) hitProp(p, o && o.el, o && (o.src === 'ult') ? 3 : 1);
      if (o && o.el && !o.react && !o.dot) for (const z of at(x, y, r)) touch(z, o.el, dmg, o);
    }
    function update(dt) {
      for (let i = zones.length - 1; i >= 0; i--) {
        const z = zones[i]; z.life -= dt; z.t += dt; z.tk -= dt;
        if (z.life <= 0) { zones.splice(i, 1); continue; }
        if (z.tk <= 0) { z.tk = 0.7; const a = X.e8Of(z.el); for (const m of mons) if (!m.dead && !m.fobj && Math.hypot(m.x - z.x, m.y - z.y) < z.r + m.r * 0.5) { if (!m.mark || m.mark.el === a) m.mark = { el: a, t: 9 }; if (z.el === 'fire') X.hitMon(m, X.ST().atk * 0.25, { el: 'fire', dot: true, dotC: '#FFB066', react: true }); } }
        if (Math.random() < 0.25) ambient(z);
      }
      for (const p of props) if (p.flash > 0) p.flash -= dt;
    }
    function ambient(z) {
      const a = Math.random() * TAU, d = Math.random() * z.r * 0.8, x = z.x + Math.cos(a) * d, y = z.y + Math.sin(a) * d * 0.7;
      switch (z.el) {
        case 'fire': X.part({ kind: 'ember', x, y, vx: 0, vy: -1.5 - Math.random(), life: 0.6, max: 0.6, size: 3 + Math.random() * 3, color: Math.random() < 0.5 ? '#FF9F43' : '#FFE37A' }); break;
        case 'frost': X.part({ kind: 'snow', x, y: y - 0.6, vx: 0, vy: 0.5, life: 1, max: 1, size: 2, color: '#FFFFFF' }); break;
        case 'bubble': X.part({ kind: 'bubble', x, y, vx: 0, vy: -0.8, life: 0.8, max: 0.8, size: 3, color: '#CFF6FF' }); break;
        case 'leaf': X.part({ kind: 'petal', x, y: y - 0.5, vx: 0.4, vy: 0.5, life: 1.4, max: 1.4, size: 4, rot: Math.random() * 6, vr: 3, color: '#9BD178', drag: 0 }); break;
        case 'spark': X.part({ kind: 'spark', x, y: y - 0.2, vx: (Math.random() - 0.5) * 4, vy: -2, life: 0.25, max: 0.25, size: 2, color: '#FFE37A' }); break;
        case 'gold': if (Math.random() < 0.3) X.part({ kind: 'smoke', x, y, vx: 0, vy: -0.4, life: 1, max: 1, size: 0.4, color: 'rgba(170,150,120,' }); break;
        case 'shadow': X.part({ kind: 'ghost', x, y, vx: 0, vy: -0.6, life: 1, max: 1, size: 0.7, color: '#8A5FD6' }); break;
        case 'prism': X.part({ kind: 'glow', x, y: y - 0.3, vx: 0, vy: -0.7, life: 1.2, max: 1.2, size: 1.2, color: '#FFF4B0', alpha: 0.6 }); break;
      }
    }
    function drawGround(c) {
      const T = X.Tz();
      for (const z of zones) {
        const Xs = X.sx(z.x), Ys = X.sy(z.y), R = z.r * T, fade = Math.min(1, z.life / 2) * Math.min(1, z.t * 3), cc = col(z.el);
        c.save(); c.translate(Xs, Ys); c.globalAlpha = 0.38 * fade;
        // (the gradient squashed with the patch, so it fades to nothing all the way round)
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, cc); gr.addColorStop(0.7, cc + '88'); gr.addColorStop(1, cc + '00');
        c.save(); c.scale(1, 0.62); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.restore();
        c.globalAlpha = 0.85 * fade;
        if (z.el === 'frost') { c.fillStyle = '#E8F8FF'; c.strokeStyle = '#7FD3F2'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a = z.seed + i * 1.05, d = R * (0.25 + 0.5 * ((i * 7 + 3) % 5) / 5), h = T * (0.25 + 0.2 * (i % 3)); c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d * 0.62); c.beginPath(); c.moveTo(-T * 0.12, 0); c.lineTo(0, -h); c.lineTo(T * 0.12, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); } }
        else if (z.el === 'bubble') { c.globalAlpha = 0.35 * fade; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(-R * 0.3, -R * 0.15, R * 0.3, R * 0.1, -0.4, 0, TAU); c.fill(); }
        else if (z.el === 'leaf') { c.fillStyle = '#6CC15A'; for (let i = 0; i < 7; i++) { const a = z.seed + i * 0.9, d = R * (0.2 + 0.6 * ((i * 5 + 1) % 4) / 4); c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d * 0.62); c.rotate(a); c.fillStyle = i % 2 ? '#6CC15A' : '#9BD178'; c.beginPath(); c.ellipse(0, 0, T * 0.14, T * 0.07, 0, 0, TAU); c.fill(); c.restore(); } }
        else if (z.el === 'gold') { c.fillStyle = '#9A8A70'; for (let i = 0; i < 6; i++) { const a = z.seed + i * 1.1, d = R * (0.2 + 0.6 * ((i * 3 + 2) % 4) / 4); c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d * 0.62, T * (0.06 + 0.05 * (i % 3)), 0, TAU); c.fill(); } }
        else if (z.el === 'spark') { c.strokeStyle = '#FFE37A'; c.lineWidth = 2; c.globalAlpha = (0.4 + 0.5 * Math.abs(Math.sin(z.t * 17 + z.seed))) * fade; for (let i = 0; i < 3; i++) { const a = z.seed + i * 2.1 + z.t * 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.3); c.lineTo(Math.cos(a + 0.4) * R * 0.9, Math.sin(a + 0.4) * R * 0.55); c.stroke(); } }
        else if (z.el === 'fire') { c.globalAlpha = (0.5 + 0.3 * Math.sin(z.t * 9)) * fade; c.fillStyle = '#FFE37A'; for (let i = 0; i < 5; i++) { const a = z.seed + i * 1.3, d = R * (0.15 + 0.5 * ((i * 7) % 5) / 5); c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d * 0.62, T * 0.07, 0, TAU); c.fill(); } }
        else if (z.el === 'shadow') { c.globalAlpha = 0.5 * fade; c.strokeStyle = '#B07CF0'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, R * (0.5 + 0.1 * Math.sin(z.t * 2)), R * 0.3, z.t * 0.5, 0, TAU); c.stroke(); }
        else if (z.el === 'prism') { c.globalAlpha = 0.9 * fade; c.fillStyle = '#FFFFFF'; for (let i = 0; i < 5; i++) { const a = z.seed + i * 1.25 + z.t * 0.6, d = R * 0.6; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d * 0.62, T * 0.05 + T * 0.03 * Math.sin(z.t * 5 + i), 0, TAU); c.fill(); } }
        c.restore();
      }
    }
    return { zones, propAt, hitProp, shotAt, areaHit, update, drawGround };
  }
  return { create };
})();
