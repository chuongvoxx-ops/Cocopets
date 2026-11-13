Implement a Wind-element flying transformation ultimate in my existing Cocopets game. Use Belladonna as its working name and Twister as the finisher.

The pet floats visibly at the centre of an enormous three-layer flower behind its back. Above the flower, a glowing ring spins with eight long swords pointing outward. Green and white tentacles extend from behind the specified flower layers.

Match Beast Machine's high-quality 3D modelling, shading, textures and animation, translated into a beautiful botanical design. Adapt Nidhogg's flight system.

Inspect the existing project and build the complete model, flight behaviour, command replacements, attacks, effects, sound and return to normal combat.

Main flower structure

The flower sits mostly vertically behind the pet, forming a broad botanical backdrop. Preserve its impressive scale: the pet is small compared with the enormous pink bloom.

Use exactly three layers:

Layer	Design
Outermost	Exactly four large green leaves
Middle	One enormous pink flower
Inner	One smaller pearl-white flower framing the pet

Keep the four outer leaves in their established positions. Give them broad curved surfaces, visible thickness, strong central veins, gently curled edges and tapered tips.

The pink flower must remain the dominant bloom. Use large sculpted petals with folded roots, gently ruffled edges and an outward sweep. Blend deep rose near the bases into rich pink and soft blush highlights.

The smaller white flower opens around and behind the pet, framing its body without obscuring its face. Use pearl-white surfaces, subtle ivory warmth and soft pink reflected light.

Place the actual pet on a discreet botanical support integrated into the central blossom.

Six green tentacles

Add exactly six long green plant tentacles originating from behind the outer leaves.

The leaves remain separate and keep their original shape. The tentacles emerge from concealed roots behind them, rather than replacing the leaves or growing from their tips.

Arrange three tentacles on each side. Give them long tapered bodies, flexible curves, subtle veins and controlled secondary movement.

Their paths should broaden the silhouette while avoiding the pet, halo and sword assembly.

Eight white tentacles

Add exactly eight thinner, long white tentacles growing from behind the small inner white flower.

These tentacles extend forward into the space in front of the flower. Their depth must be obvious from side and three-quarter views.

Use four on each side, with slender pearl-white bodies and pointed tips. Keep them visibly thinner than the green tentacles, but long enough to project well forward.

Preserve an open central corridor around the pet's face and body. Animate gentle forward-reaching curves and small responses to acceleration.

The tentacles are part of the visual design and secondary animation. Do not add automatic tentacle attacks or extra damage phases.

Glowing ring and eight swords

Position one large, dimensional glowing ring above the flower with a clear gap between them.

Use the approved ring proportions, incorporating the earlier 25% reduction from the oversized version. Match the latest concept rather than repeatedly applying another size reduction.

Give the ring a polished pale-metal rim, botanical engravings and flowing white-green energy.

Arrange exactly eight long swords evenly around it. Their points face radially outward, away from the centre. Use elongated blades with real thickness, refined surfaces and luminous edges.

The swords orbit with the ring in a coherent formation. Preserve eight swords during idle, flight, attacks and the finisher.

Keep one physical ring assembly throughout the ability. Ring Blade throws this same ring and its eight swords.

Materials and animation

Model important petal folds, leaf curves, tentacles and weapon silhouettes as real geometry.

Use subtle translucency or the renderer's supported equivalent for thin petals and leaves. Apply fine vein detail, roughness variation, contact shadows and soft colour gradients.

The leaves have a waxier response than the satin petals. The metal ring and swords use reflective materials with controlled emission.

Animate petals and tentacles through a lightweight rig with delayed movement toward the tips. Keep the pet's support stable and avoid expensive simulation where authored motion will achieve the intended result.

Wind ribbons should have a bright, sharp outer edge and a gradual opacity fade toward their inner edge.

Summoning and flight

A Wind seal appears beneath the pet. The botanical hub unfolds behind it: four outer leaves, the large pink flower, then the small white flower.

The green and white tentacles unfurl from their correct roots. The ring forms overhead and its eight swords settle into orbit.

Raise the pet into controlled flight.

Adapt Nidhogg's movement, hovering, altitude changes, banking, targeting and camera behaviour. Allow travel over cliffs, gaps and beyond the land's outline within the encounter flight volume. Maintain stable altitude over empty space and a valid safe return location.

Normal control	Flower form
Movement	Airborne steering
Dodge	Swoosh
Strong attack 1	Wildflowers
Strong attack 2	Ring Blade
Ultimate	Twister gauge, then finisher

Swoosh — Dodge replacement

Use Dive Bomb's targeting and committed movement structure, adapted into a swooping, spinning pass around enemies.

The flower banks toward the target, partially folds for speed and curves into a tight circling sweep. It spins through the air around the enemy group, releasing a broad spiral of Wind.

Finish by opening the petals and returning smoothly to normal flight. Maintain clearance above the ground.

Trace the movement with mint-white ribbons, pink petals and circular air distortion. Use a swept damage volume and one intended hit per enemy per activation.

Keep the camera stable. Validate the full approach and circling route against obstacles.

Wildflowers — Strong attack 1

The pet casts as the enormous pink bloom opens wider.

A hurricane of pink flowers bursts across the battlefield: recognisable miniature blossoms, loose petals and coherent ribbons of Wind sweep through enemies.

Create one broad floral hurricane with a clear, bounded footprint. Give the effect depth, layered motion and enough gaps to keep enemies visible.

Apply repeated Wind damage at a configured cadence over a finite duration. Decorative flowers do not generate individual damage events.

Allow normal flight after the casting recovery. Default to one active Wildflowers field per caster, refreshing it on recast rather than silently stacking unlimited storms.

Ring Blade — Strong attack 2

The ring brightens and all eight outward-facing swords accelerate.

The pet hurls the entire overhead assembly toward the target area. The swords travel with it, maintaining their arrangement.

Use a luminous rim, long blade trails and a translucent disc of turbulent air to communicate its AoE.

The weapon sweeps through enemies and releases a broad Wind flourish at the end of its route. Treat the sweep and flourish as one damage activation per enemy.

The same ring then curves back overhead. Its return is harmless by default.

Maintain explicit overhead, outbound and returning states. Prevent recasting while it is away. If Twister activates during a throw, recall the ring visibly before beginning the finisher.

Twister gauge

Start empty and charge from actual enemy damage dealt by Swoosh, Wildflowers and Ring Blade.

At full charge, brighten the ring and display Twister. Activation is manual. Permit one finisher per summon.

Twister — Finisher

Stabilise above the targeted combat area and begin a finite finishing sequence.

The flower opens fully. The outer leaves brace, the pink petals spread, the white blossom glows around the pet and both tentacle groups take controlled flowing poses.

The ring spins rapidly, with all eight swords forming long arcs of light. Build intensity through motion and glow while retaining the weapon's readable shape.

A broad storm orbits the central flower. Pink blossoms and white petals sweep around it in coherent currents.

Mark six formation points, then create exactly six simultaneous tornadoes of Wind and flowers.

Each tornado has a tapered funnel, layered translucent wind, rising spirals of pink blossoms and a visible base aligned with its damage volume.

The six tornadoes orbit around the flower in a broad, bounded formation. Each funnel spins internally while its centre travels around the formation. Keep enough separation to identify all six.

Apply massive Wind damage on fixed scheduled ticks. Use one shared per-enemy damage registry per storm tick across the six funnels, preventing accidental overlap from multiplying damage.

Build toward the last scheduled pulse. The six tornadoes brighten together, release a final sweep of flowers and unwind upward into drifting petals.

Timing and restoration

Keep form duration, strong-attack cooldowns, storm timings and damage configurable. No level-based increase to sword, leaf, tentacle or tornado counts has been specified.

As inherited defaults only, Swoosh may use Dive Bomb's zero-extra-cooldown cadence, and the outer ultimate cooldown may use Nidhogg's 120 seconds after exit.

After Twister, safely return the pet to valid ground. Fold and dissolve the flower, tentacles, ring and swords into petals and light.

Restore normal controls and start the configured outer cooldown once. Handle offshore expiry, interruptions and defeat safely.

Verify exactly four outer leaves, eight outward-pointing swords, six green rear tentacles, eight long white forward-reaching tentacles and six Twister tornadoes.

Update (v321, the user's later changes, recorded by the team; they take precedence over the text above where they differ)

* Duration: 45 seconds at every level (was 20 / 25 / 35).
* Cooldowns: Wildflowers 1.0 second, Ring Blade 1.5 seconds (from the catch).
* Swoosh: the bloom closes into a bud as it rises, dives and swoops through the enemies as a bud, then bursts into bloom, spins in place and slams its six green tentacles on the ground around it one after another, then all together. Each tentacle slam is a small Wind hit at its spot (about 1.2 DK within 1.2 tiles); the final slam about 3 DK within 3 tiles; every slam charges the gauge and breaks props.
* The pet is hidden inside the closed bud and reappears as it bursts open.
