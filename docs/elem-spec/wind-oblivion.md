# Wind ultimate: Winds of Oblivion — the user's spec (verbatim, 2026-11-07)

Row: key `oblivion` replaces Wind `severance` (Horizon Severance), cost 100, cd 60, glyph 'feather'.

Winds of Oblivion — a sinister wind ultimate that strips enemies of their strength and leaves their attacks faltering.

The pet exhales a pale emerald breeze that expands into a vast, slowly rotating halo of wind chimes and spectral
feathers. As it passes through enemies, thin currents peel away glowing fragments of their protective magic. Broken wind
sigils appear above their heads, marking them as Windworn.

Afflicted enemies suffer:
* −25% attack power, reducing the damage they deal.
* −25% defense
* −20% attack speed, slowing their basic attacks.
* −30% movement speed, making it easier to reposition and escape.
* Dispel on activation: removes one removable beneficial effect per enemy, prioritising shields, then attack buffs, then
  speed buffs.

The debuff remains attached to enemies after the initial wave, so they cannot escape it by leaving the area. Bosses
retain their scripted movement and attack timings, but still suffer the attack-power reduction; only explicitly
removable buffs can be dispelled.

| Ultimate level | Debuff duration | Additional benefit |
|---|---|---|
| Base | 10 seconds | Effects above |
| Level 4 | 14 seconds | Removes up to two beneficial effects per enemy |
| Level 7 | 17 seconds | Prevents affected enemies from receiving new removable buffs for the first 5 seconds |

Suggested cooldown: 60 seconds. Repeated applications refresh the duration without stacking the reductions.

Signature visual: when a buff is stripped, its symbol is torn away from the enemy, suspended briefly inside a tiny wind
spiral, then shattered into luminous dust. Debuffed enemies trail tattered emerald ribbons, making their weakened state
immediately visible.
