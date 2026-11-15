# Cocopets — Rift 0: The Blackfire Caldera

## Claude build prompt

Develop this specification into the existing Cocopets game. Inspect the project first and use its actual engine, controls, combat, pet commands, progression, saves and rendering systems. Implement the playable dungeon and its interactions, encounters, rewards and recovery states; do not stop at an outline or decorative scene.

This brief defines Rift 0 as the first available rift: a level-1 volcanic starter dungeon that precedes Rift 1, The Drowned Belfry. Add it as the introductory entry while preserving the existing numbering, designs and campaign identifiers for Rifts 1–13. Give Rift 0 its own map landmark, entry requirement and completion flag. Its local seal is separate from the twelve main campaign seals required to unlock Rift 13. Preserve the twelve existing constellation-gate pairings; completing Rift 0 must not award Rift 1’s seal or unlock Rift 1’s paired gate. Do not add a separate constellation gate for Rift 0 unless requested.

All timings and percentages below are proposed initial tuning values, subject to playtesting with ordinary starting pets.

## Core requirements

- Available from level 1 once the game’s normal introduction allows dungeon travel.
- Exactly three connected sub-dungeons, each ending in one boss.
- Exactly two standalone puzzles: one in sub-dungeon 1 and one in sub-dungeon 2.
- The third sub-dungeon uses traversal and combat, without adding a third puzzle.
- Boss order: Fire Flan, Bomb King, Ifrit.
- Exactly three health-based phases per boss: phase 1 above 70% HP, phase 2 at 70–35%, phase 3 at 35% and below.
- Ifrit is the hardest and longest encounter.
- Any ordinary starting Cocopet must be able to complete the dungeon. Supply all cold, rune and bomb interactions through the environment; do not require an Ice pet, rare skill, ultimate, mount, elemental resistance item or second player.
- Target approximately 15 minutes for a successful practiced clear; allow around 18–22 minutes for a first visit with exploration and learning.
- Award ordinary combat and completion XP on replays. Give the additional first-clear bonus and Rift 0 completion reward once. Keep its local seal separate from the main campaign’s twelve-seal counter. Tune XP against the existing progression curve so this is useful for the first few levels; do not invent a separate levelling system.
- Teach readable combat decisions. High boss durability must create opportunities for mechanics, rather than long stretches of ineffective attacks.

## Identity, atmosphere and visual direction

The rift opens inside an active volcano. Its outer tunnels are natural basalt caverns, its middle chambers contain an ancient runic forge, and its deepest chamber is a colossal caldera surrounding Ifrit’s throne.

Build a convincing three-dimensional environment using the established Cocopets art direction: fractured volcanic rock, cooled lava crust, glowing seams, soot, weathered metal, black glass and drifting embers. Contrast enormous distant lavafalls with compact, readable playable spaces.

Dark fire crystals grow from the walls and arena foundations. They are glossy black or deep violet outside, with smouldering red-orange fractures and slowly circulating light inside. Occasional pulses move toward the volcano’s heart, suggesting they feed Ifrit. Their silhouettes should remain recognisable in low light.

Ancient frost crystals were installed in protected stone wells to regulate the forge. This explains the cold machinery inside the volcano. They are environmental tools that any pet can activate. Use white-blue facets, frost patterns, a snowflake emblem and a distinct chime so they remain legible without relying on colour.

Keep hazard indicators visible over glowing lava and particle effects. Use rim lighting on pets and enemies, uncluttered arena floors, restrained bloom and an opaque or simplified mode where transparency is costly. Distant eruptions and camera effects must not conceal a dodge cue.

The mood progresses from dangerous discovery, through an inhabited furnace, to a confrontation with the living heart of the volcano.

## Route and pacing

|Order|Area or encounter          |Practiced time|Purpose                                             |
|-----|---------------------------|-------------:|----------------------------------------------------|
|1    |The Ashen Hollows          |2 min 30 sec  |Introductory combat and coolant-routing puzzle      |
|2    |Fire Flan                  |2 min         |Lure, weaken and defend                             |
|3    |The Runebound Foundry      |2 min 30 sec  |Stronger enemies and coupled-rune puzzle            |
|4    |Bomb King                  |2 min 30 sec  |Read openings, return bombs and use cover           |
|5    |The Heartward Descent      |2 min         |Traverse erupting passages and fight the final packs|
|6    |Ifrit, Heart of the Volcano|3 min 30 sec  |Combine dodging, target priority and frost shelter  |
|     |Total                      |15 min        |Includes brief transitions and the seal animation   |

Place a checkpoint and small recovery station before each boss. A boss defeat permanently opens the next area for the current run. Reset only the active encounter after a wipe; preserve completed puzzles, defeated bosses and collected unique rewards. Provide an immediate retry and a return-to-hub option.

Keep all mandatory paths wide enough for the pet, camera and existing movement controls. Side alcoves can contain small loot caches, but do not disguise additional mandatory puzzles or bosses as optional rooms.

## Sub-dungeon 1 — The Ashen Hollows

### Environment and encounters

Begin on a sheltered basalt ledge with a panoramic view across lava streams and dark fire crystal clusters. Descend through two compact chambers into a cooler maintenance cavern.

Introduce enemies separately before mixing them:

- Cinder Slugs: slow movement, one short-range fire spit with a clear wind-up.
- Basalt Crawlers: tough frontal plates and an exposed glowing rear.
- Ember Wisps: a single visible projectile followed by a long recovery.

Use two or three small finite packs. Initial lava contact deals modest damage and returns the player to a nearby safe edge rather than killing them instantly. Do not place hazards directly beneath spawn or checkpoint positions.

### Puzzle 1 — The Frozen Causeway

A lava channel blocks the way. An ancient frost reservoir feeds a set of rotatable floor conduits. The player must supply two cooling basins simultaneously so both halves of an obsidian bridge solidify.

Use five rotatable pieces: a central T-junction, two elbows and two straight channels. Interact rotates one piece 90 degrees. Show the actual frost flow moving through every connected piece. A disconnected outlet releases harmless mist and stops that branch.

Concrete authored layout:

- Reservoir north of the T-junction.
- Left and right elbows immediately west and east of the T-junction.
- One north-south straight channel immediately south of each elbow.
- A cooling basin immediately south of each straight.
- The solidified crossing has two visible halves, each connected to its own basin.

Correct connections:

|Piece             |Required connected directions|
|------------------|-----------------------------|
|Central T-junction|North, west, east            |
|West elbow        |East, south                  |
|East elbow        |West, south                  |
|West straight     |North, south                 |
|East straight     |North, south                 |

Randomise only the starting rotations, using this fixed solvable layout. Both basins need continuous flow at the same time; the bridge latches permanently once both are cooled.

The challenge is understanding the split flow and maintaining two branches, rather than finding an invisible switch. Make the controls operable from solid ground. Do not spawn enemies during the player’s first puzzle attempt. After a delay, offer a hint that traces the missing connection.

The pet visibly triggers the frost reservoir during completion. This is part of the same puzzle, not another gate or a required special pet ability. The far door opens into Fire Flan’s chamber.

## Boss 1 — Fire Flan

### Appearance and arena

Fire Flan is a large, heavy jelly creature: translucent amber-red gel, trapped black ash, rising internal bubbles and a molten core that moves inside its body. Its outline compresses and wobbles with real weight. It should look strange, hot and resilient.

Its circular basalt arena contains three frost crystals in protective wells around the perimeter. Each has a clearly marked cooling zone and an adjacent interaction plate. The central space is open, leaving room to lure the creature without getting caught in corners.

### Shared mechanic — lure, chill, defend, punish

In its molten state, Fire Flan has approximately 80% damage reduction. Show “Molten armour” and visibly muted hit feedback so players understand that ordinary attacks alone are inefficient.

1. Lead the flan into a marked cooling zone. Its pursuit target follows the controllable combat actor using the game’s existing aggro rules. Provide a visible lure-target icon so the handler/pet control scheme remains clear.
2. Activate that crystal using the ordinary interact command. The field starts promptly, slows the flan and chills it over approximately 3 seconds.
3. Defend the crystal while it operates. Fire Flan can telegraph Crystal Breaker, and later small creatures attack the crystal.
4. After sufficient chilling, its surface becomes pale, brittle and cracked. Remove its molten damage reduction for an approximately 8-second damage window. Its core becomes easy to see through the fractured shell.
5. The crystal then recharges, and the cycle can be repeated at the same or another well.

Initial tuning: one active crystal at a time; a field lasts about 12 seconds, with an 8-second recharge after it ends. If the flan leaves the field or the crystal breaks, allow roughly 2 seconds before its molten armour returns. Do not stack overlapping fields.

Crystal Breaker has a long wind-up and a glowing interrupt point. A short ordinary attack sequence can interrupt it, without a specific skill or difficult damage check. One successful smash damages a crystal substantially but does not destroy a full-health crystal. Let the crystal survive at least three mistakes before breaking.

Broken crystals regrow automatically after approximately 10 seconds. Crystal destruction never permanently blocks the fight and never restores boss HP. Display integrity and recharge progress only when relevant.

### Phase 1 — Molten Mantle: 100–70% HP

Teach the complete core interaction without adds.

- Jelly Slam: the flan swells, then drops into a clearly marked circle.
- Magma Spit: one slow glob aimed at the player’s previous position, creating a brief small hot patch.
- Crystal Breaker: it turns toward the active crystal, stretches one heavy pseudopod and exposes the interrupt point.

The first active crystal receives a generous delay before the first Crystal Breaker attempt. Give the player time to recognise the defence task and land meaningful damage during the brittle window.

### Phase 2 — Boiling Brood: 70–35% HP

The flan develops several bubbling lobes and sheds two small Cinderlings. These are ordinary adds, not new boss encounters.

- Cinderlings move toward the active crystal and chip its integrity.
- Cap them at two alive at once; do not spawn endlessly increasing waves.
- They die quickly to ordinary attacks.
- Fire Flan uses a slower, broad Body Sweep while the player chooses between protecting the crystal and attacking its exposed core.

The tactical question is whether to finish a damage opportunity or remove the creatures threatening to end it. Do not overlap an add attack, Crystal Breaker and an unavoidable arena-wide attack.

### Phase 3 — Pressure Heart: 35–0% HP

The flan becomes taller and more transparent. Its core shines intensely and steam escapes through fractures.

- Pressure Burst: an expanding ring with one broad, clearly shown safe gap.
- Crystal Rush: a straight charge toward the active crystal. Its path is marked early; lure it into the cooling field and interrupt the wind-up.
- Keep the two-add cap from phase 2. Do not introduce a larger wave.

The flan takes slightly greater damage during its brittle state in this phase, creating a satisfying finish. The added pressure is movement and defence, not a new resistance wall.

On defeat, it collapses into harmless glowing jelly and cooling obsidian fragments. Restore the arena crystals and open the foundry gate.

## Sub-dungeon 2 — The Runebound Foundry

### Environment and encounters

The route enters a gigantic forge built into the volcano’s inner wall. Use suspended metal rings, broken chains, engraved pressure vessels and enormous runic machinery. Lava powers the mechanisms below grated paths. Make the forge visibly older than the rift.

Enemies:

- Furnace Imps: throw slow ember projectiles and briefly retreat.
- Runic Sentinels: expose a rune after a shielded frontal attack.
- Bomb Larvae: small levitating metal creatures that land, flash and explode after a readable countdown.

Provide a safe, low-damage introduction to returning a grounded bomb with the normal interaction or attack command. It is a combat tutorial within an ordinary pack, not a third puzzle. Use the same bomb cue and input in Bomb King’s arena.

### Puzzle 2 — The Three Rune Rings

A sealed door has three rotating rings. Each ring cycles through Eye, Chain and Crown. Above them, an unchanging inscription shows the target: Eye — Chain — Crown.

There are three levers:

- Lever A rotates the left and middle rings one step.
- Lever B rotates the middle and right rings one step.
- Lever C rotates the left and right rings one step.

Show physical connecting lines from each lever to both affected rings. Hovering or focusing a lever highlights the two rings it changes. Make the glyphs distinct by shape and label.

All rings begin at Eye. Every activation cycles Eye → Chain → Crown → Eye.

One valid solution from the initial state is:

1. Activate A once: Chain — Chain — Eye.
2. Activate C once: Crown — Chain — Chain.
3. Activate C again: Eye — Chain — Crown.

The puzzle asks players to plan coupled changes: fixing one ring can move another. It has only 27 visible states and remains a short introductory reasoning challenge.

Provide a Reset action and unlimited experimentation. Wrong states have no health or inventory penalty. Solve the current state when generating hints, rather than showing the original sequence after the player has moved the rings. A “Show next move” option can calculate a shortest route through the small state graph.

When solved, the rings align into a huge iris, the pressure door opens, and a bass heartbeat becomes audible from Bomb King’s chamber.

## Boss 2 — Bomb King

### Appearance and arena

Bomb King is an enormous floating, living metallic bomb. Its body is dark, weathered iron with engraved runes, riveted segments, heat-discoloured edges and thin seams glowing from within. Give it a crown-like arrangement of short metal projections around a thick, ember-filled fuse.

Make its life visible through motion: the shell subtly expands with each breath, plates contract around a central molten eye, runes tighten during anger, and a deep heartbeat accelerates before explosions. Avoid a painted smile or a flat cartoon sphere. Its metal must feel heavy even while it levitates.

The arena is a broad foundry floor with three permanent basalt blast shelters around its edge. Each shelter has a visibly marked safe side. Keep safe approaches clear. The camera must show the boss, ground bombs and nearest shelter together.

### Shared combat rules

Bomb King has moderate shell protection, approximately 40% damage reduction, but remains damageable throughout the fight. Vulnerable venting windows remove that protection.

Grounded minion bombs use the previously taught return interaction. Give a generous return window, an aim guide and assistance toward the boss. A returned bomb bursts on contact with Bomb King and cannot unexpectedly damage its sender. Bombs left on the floor show an obvious shrinking timer and damage circle.

Cover and returned bombs are tactical combat tools; do not turn the arena into another standalone puzzle.

### Phase 1 — The Living Furnace: 100–70% HP

Teach movement and the boss’s rhythm.

- Royal Volley: three fireballs in a wide fan with visible gaps.
- Iron Orbit: a slow, low circular sweep with a generous opening.
- Furnace Vent: after its attack sequence, metal plates separate for approximately 5 seconds, exposing the incandescent core.

The boss briefly settles lower while venting so any starting attack type can reach its weak point. The pet should not require a jump or ranged skill.

### Phase 2 — Royal Procession: 70–35% HP

The etched runes brighten and two Bomb Larvae descend into the arena.

- Larvae land with a fuse of approximately 6 seconds.
- The first approximately 3 seconds provide a safe return prompt; the late red-flashing stage is a dodge cue.
- Returning one bomb into Bomb King cracks its shell and causes an approximately 4-second stagger.
- Cap grounded live bombs at two and allow ordinary attacks to keep progressing the fight.

Use the same cue, input and trajectory behaviour as the foundry introduction. The player learns to create an opening instead of waiting for one.

### Phase 3 — Royal Detonation: 35–0% HP

Bomb King’s plates pull apart, showing a pulsing internal furnace. It rises above the arena and begins a clearly visible 7-second detonation countdown.

There are two readable responses:

- Offensive: return a supplied grounded bomb into the exposed core, or deal an achievable amount of direct core damage, to interrupt the charge.
- Defensive: reach the marked safe side of any basalt blast shelter.

Spawn a returnable bomb in an accessible position at the start of the charge. Guarantee at least one clear route to permanent cover. Shelters survive every detonation. Failed interruption must not be an unavoidable wipe.

After an interrupted charge, the boss falls into a long stagger. After a sheltered blast, it vents and offers a shorter but still useful damage window. Repeat at a comfortable interval if needed.

There is no surprise damaging death explosion. On defeat, the fuse burns out and the shell cracks into inert pieces, revealing the passage down toward Ifrit.

## Sub-dungeon 3 — The Heartward Descent

### Environment and challenge

The forge gives way to a vertical volcanic cathedral: huge natural stone columns, suspended obsidian slabs, rivers of lava descending through the walls, and black fire crystals growing toward a central throne.

This is traversal and combat, without a third puzzle. The objective is to reach the crucible through two short hazard lanes and two finite enemy groups.

- Vents glow and hiss before erupting. Present one safe demonstration before using them near combat.
- Broad cooling ledges separate the lanes. Falling returns the player to the most recent ledge with a modest penalty.
- Ashen Knights use one slow melee combo.
- Crystal Wisps fire a single marked beam.
- Combine only a few enemies at once, with at most one major environmental hazard needing immediate attention.

The final approach overlooks Ifrit seated inside a cracked ring of basalt. His chest looks like a distant furnace until he breathes and the light swells.

Restore health through the normal recovery system and establish the last checkpoint before entering.

## Boss 3 — Ifrit, Heart of the Volcano

### Appearance and arena

Ifrit is a huge humanoid rock-and-fire demon with two prominent obsidian horns, thick stone limbs, clawed hands and a blazing molten core beneath overlapping basalt plates. Make the anatomy powerful and readable. Heat escapes from the jaw, shoulders and cracks between armour plates. His horns have rough black surfaces with red-hot edges.

He rises from a throne that is initially almost indistinguishable from the surrounding rock. The arena sits on a broad circular basalt platform surrounded by lavafalls. Distant eruptions provide scale without covering the floor indicators.

Two black fire crystal growths sit near the perimeter. Protected frost wells are also visible from the start, with the same snowflake emblem used in Fire Flan’s arena. Their purpose becomes active in phase 3.

### Phase 1 — Basalt Tyrant: 100–70% HP

Teach deliberate dodging against a heavy humanoid opponent.

- Titan Fist: a high arm lift followed by one ground slam. Mark the impact and give a long recovery.
- Cinder Breath: a frontal cone that slowly tracks during its wind-up, then locks direction.
- Fault Line: a glowing crack travels in a straight line before a narrow eruption follows.

Keep the opening rhythm spacious. Ifrit briefly exposes his chest while recovering from a slam or breath. These are the first major punish windows.

### Phase 2 — Crown of Blackfire: 70–35% HP

Ifrit’s horns flare and the two perimeter crystal growths connect to him through visible energy tethers.

- Each living growth supplies approximately 20% damage reduction, capped at 40%.
- The player can break them using ordinary attacks; no elemental requirement.
- Breaking a growth removes its contribution and staggers Ifrit briefly.
- Defeated growths do not immediately respawn.
- Ifrit gains one broad Burning Cleave and a small set of marked falling lava rocks.

The correct target priority is visible: destroying a crystal cuts its tether and visibly dims part of his armour. The boss remains damageable so the mechanic never becomes a hidden hard lock.

Limit simultaneous demands. Do not combine a crystal interaction with a full-arena attack. Breaking crystals should feel useful and quick with starter damage.

### Phase 3 — Heart of the Volcano: 35–0% HP

Ifrit’s outer armour fractures away, his molten chest becomes fully exposed, and fire streams upward from his shoulders. Any remaining protective crystal links collapse at this transition.

His normal attacks become slightly faster, then he periodically begins Hellfire:

1. Ifrit plants both hands into the platform and charges for approximately 8 seconds.
2. Lava climbs the arena walls. The whole floor warns of the approaching blast.
3. The frost wells visibly awaken, refresh their charges and display the familiar interaction cue.
4. Activating either well creates a marked cold refuge large enough for the handler and pet.
5. Hellfire crosses the arena as a huge wall of flame. The frost refuge protects both.
6. Ifrit overheats and kneels for approximately 6 seconds, exposing his core for heavy damage.

Supply the same environmental interaction used earlier. No player-owned Ice skill is needed. Guarantee a reachable refuge and pause other major attacks during the charge. Follow or recall behaviour must bring a companion pet into shelter with the player.

A missed shelter is a heavy, readable hit, not an automatic full-health kill on the introductory difficulty. Do not create a late unavoidable burn effect after the blast. Wells are ready for every scheduled Hellfire, including repeated casts.

The climax reuses the lesson from the first boss: cold machinery changes an apparently overwhelming fire encounter into a clear opportunity.

### Defeat and rift sealing

Ifrit’s core dims and his basalt body settles into a dark, inert statue. Lava motion becomes calmer and the black fire crystals lose their hostile glow.

The active Cocopet approaches the rift and performs the established sealing animation with the handler. Record Rift 0’s completion and local seal, provide the first-clear rewards once, and open access to Rift 1, The Drowned Belfry, using the existing entry and level rules. Keep Rift 0’s completion separate from the twelve main campaign seals and their constellation-gate unlocks.

Do not promise that the player reaches the next dungeon’s recommended level in one run. Preserve current progression rules and tune replay rewards to support continued levelling here.

## Rewards and replay appeal

Use the existing item and XP systems. Suggested reward themes:

- Fire Flan: cooling fragments or a modest defensive material.
- Bomb King: runic metal crafting components.
- Ifrit: a beginner fire-themed accessory or cosmetic material, without a compulsory rare power spike.

Small optional treasure alcoves reward looking behind basalt columns and exploring side ledges. Keep these as discovery rewards rather than extra puzzle gates.

If the game already supports clear medals, recognise defending every crystal, returning a bomb and sheltering from Hellfire. Do not add a new medal system solely for this dungeon.

## Combat readability, accessibility and recovery

- Provide approximately 1.5–2.5 seconds of warning for early heavy attacks and longer warnings for the signature blasts.
- Use shape, animation and sound alongside colour.
- Cap early simultaneous threats: one main boss action plus, at most, the small specified add group.
- Avoid forced jumping if the existing controls do not support it.
- Prevent arena boundaries, camera collision and companion pathfinding from trapping the player behind cover.
- Tutorial text should be short and contextual: “Lure it into the cold”, “Protect the crystal”, “Return the bomb”, and “Take shelter”.
- Preserve completed puzzle states and boss flags on the current run’s retry. Save campaign completion and rewards through the existing persistent systems.
- Skip or shorten introductions on retries. Pausing in solo play pauses puzzle interactions, countdowns and combat according to the game’s existing pause rules.
- Decorative effects may simplify on lower settings, but hazard areas, timers, weak points and interaction cues must remain accurate.
- Every reset restores a valid boss, crystal, bomb and shelter state. Nothing requires leaving the dungeon to repair a broken encounter.

## Acceptance checks

Verify with a level-1 starter setup and default controls:

1. Entry is available without a later-level requirement.
2. The full route has three playable areas, exactly two standalone puzzles and exactly three bosses.
3. The authored coolant layout supplies both basins and permanently opens its bridge.
4. The rune-ring solution works, and hints remain valid after arbitrary lever inputs.
5. Fire Flan can be lured, chilled, interrupted and killed; all broken crystals recover.
6. One player can defend the crystal while controlling their ordinary pet.
7. Bomb return targeting works for the actual control scheme, and permanent cover always provides a safe option.
8. All nine boss phases occur at the intended starter tuning; no extra boss phase or surprise death attack is added.
9. Ifrit’s crystal tethers affect protection correctly, and Hellfire always has a reachable charged refuge.
10. The pet survives sheltering with the player and is not stranded by navigation.
11. Wipes preserve completed sections and prevent duplicate unique rewards.
12. Practice-clear duration is close to 15 minutes while the first clear permits learning.