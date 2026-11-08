Nidhogg should look like a living crimson dragon fused with an infernal war machine: a long, predatory head crowned with backward-sweeping horns, an arched muscular neck, enormous veined wings and a whip-like armoured tail. Scarlet metal scales overlap its living hide, while dark mechanical joints, pistons and glowing furnace vents appear between the plates. Its belly glows like a fire burning beneath translucent armour.

I’ve left flight duration configurable, since you haven’t specified it.

Implement Nidhogg, a spectacular Fire-element transformation ultimate for my existing Cocopets game.

The pet summons and rides an enormous red dragon that is half organic and half machine. It flies freely across the battlefield and beyond the edges of the land, using replacement combat commands to build charge for Ultima.

Match the graphical fidelity, model detail, advanced shading and animation quality of Beast Machine and Sports Car.

Inspect the existing project first. Preserve its engine, art direction, controls, combat systems and save data. Reuse the existing transformation and temporary-command systems while implementing genuine aerial movement.

Build the complete creature, flight controls, animation, materials, abilities, effects, sound and UI.

1. Creature design

Use the supplied references for the dragon’s proportions and powerful flying silhouette:

* A long, narrow predatory head.
* Swept-back horns and a crown of sharp spikes.
* A long muscular neck.
* Enormous bat-like wings with articulated fingers.
* Powerful clawed hind legs.
* A long tapering tail.
* Prominent dorsal spikes running from the head to the tail.

Use a coherent wyvern-like structure, with its forelimbs incorporated into the wings.

The organic half must remain visible through living scales, flexible throat tissue, muscles, tendons, expressive jaws and veined wing membranes.

Integrate the mechanical half through articulated red armour scales, dark steel joints, recessed pistons, mechanical wing braces and glowing heat vents.

Make these parts feel grown and engineered together. The dragon should breathe, flex and react like a living creature while its armour shifts and its mechanisms move.

Use deep crimson and scarlet, burgundy wing membranes, blackened metal recesses and orange furnace light within the body.

Place the pet in a secure riding position behind the neck, integrated into the back armour without obstructing the wings.

2. Advanced materials and animation

Give important scales, spikes and armour plates actual thickness and bevelled edges. Use fine surface textures for smaller scales, scratches, pores and heat damage.

Differentiate the materials:

* Living scales: softer highlights and subtle colour variation.
* Metal armour: controlled reflections, worn edges and dark seams.
* Wing membranes: visible veins, wrinkles and restrained red light transmission.
* Mechanical joints: dark metal, moving pistons and recessed detail.
* Belly: segmented surfaces that reveal increasing internal light during Ultima.

At rest, the internal glow is restrained. During charging, it becomes intense.

Animate wing roots, elbows, wing fingers and membranes together. Wings flex during downstrokes, spread while braking and partially fold during dives. Add natural neck motion, banking, body pitch and tail counterbalance.

Keep the dragon’s silhouette, face and material detail readable through its fire effects.

3. Commands and progression

Normal command	Nidhogg command
Movement	Fly and steer
Dodge	Dive Bomb
Strong attack 1	Fireballs
Strong attack 2	Flare
Ultimate	Ultima meter and activation button
Progression	Fireballs per activation	Flare projectiles
Base	1	10
Level 4 — Adept	2	20
Level 7 — Celestial	3	30

Exact cooldowns:

* Dive Bomb: 0 seconds.
* Fireballs: 2 seconds.
* Flare: 4 seconds.
* Nidhogg: 120 seconds after the form ends and normal controls return.

Apply Fireballs and Flare cooldowns once per complete activation, not per projectile.

Flight duration has not been specified. Keep it configurable, using the existing transformation system’s duration provisionally.

Preserve the pet’s original loadout and normal cooldown behaviour for restoration.

4. Summoning and free flight

A fiery summoning seal opens. Embers rise as Nidhogg emerges through heat haze, revealing living crimson scales, mechanical armour and glowing vents.

The pet mounts its back. Nidhogg spreads its wings and rises with a powerful downstroke.

Implement real three-dimensional flight, including banking, climbing, descending and hovering.

Nidhogg must be able to fly:

* Across the battlefield.
* Over cliffs and gaps.
* Above water.
* Beyond the land’s outline.
* Through the open air surrounding islands.

Use an aerial movement volume independent of the ground navigation mesh. Do not snap the dragon back when it crosses the land boundary.

Keep stable altitude above empty space. Respect actual solid structures while allowing flight over obstacles when there is sufficient clearance.

Adapt the existing input scheme for flight, with compact altitude controls if needed. Keep all combat commands available.

The camera must follow the dragon offshore and allow attacks aimed back toward the battlefield.

Use the pet’s existing HP and defensive systems. Flight does not automatically grant invulnerability or a separate dragon health bar.

5. Dive Bomb — Replaces Dodge

Nidhogg partially folds its wings and plunges toward a selected enemy or aimed ground location.

Stretch the neck forward, pitch the body downward and let the tail follow in a sweeping arc. Fire streams from the armour seams as it descends.

Immediately before impact, flare the wings to brake. Slam into the target area, releasing a powerful AoE Fire shockwave, embers and temporary glowing cracks.

Deal one damage event at impact. Nidhogg then pushes upward and returns smoothly to flight.

There is no cooldown and no charge limit. Once the current dive-and-recovery animation finishes, the player can immediately dive again. Do not inherit the normal Dodge cooldown or add a hidden delay.

Allow the player to aim at battlefield ground while flying outside the land boundary.

If there is no valid impact surface, retain flight or show invalid targeting. Never crash the dragon into empty space or create a ground explosion where no ground exists.

6. Fireballs — Strong attack 1

Nidhogg fires one large fireball downward at base, two at Adept and three at Celestial.

Cooldown: 2 seconds.

Animate the throat and jaw, a brief internal flare and visible recoil as each fireball leaves its mouth. Upgraded shots fire in a quick connected sequence.

Give every fireball:

* A white-yellow core.
* A dense orange body.
* Rolling red flame.
* A tapered smoky trail.
* Animated surface turbulence.

Each follows an aimed downward trajectory and explodes on contact, dealing AoE Fire damage.

Use a dimensional expanding fire burst, embers and a brief ground-light flash.

Each fireball produces one explosion damage event. Do not double-hit the primary target with separate direct-impact and explosion calculations. Different fireballs can each damage the same enemy.

7. Flare — Strong attack 2

Nidhogg releases a barrage of 10 fire projectiles at base, 20 at Adept and 30 at Celestial.

Cooldown: 4 seconds.

Armoured vents around the wing roots and upper back open, exposing the orange fire inside.

Launch the projectiles in rapidly spreading fans around the dragon, descending toward enemy positions or aimed ground points. Make it feel as though immense internal pressure is erupting through its body.

Each projectile resembles a bright fire lance or molten ember with a red-orange comet trail.

Use a brief stagger within the barrage so individual projectiles remain visible, preserving the exact count.

Animate subtle wing recoil, opening vents and a spreading wave of heat distortion.

Use actual projectile collision and individual hit tracking. Decorative sparks must not add damage, and the barrage must not be replaced by one generic area-damage pulse.

8. Building Ultima

The ultimate icon becomes an Ultima meter, starting empty.

Fill it from actual enemy damage dealt by the current form’s:

* Dive Bomb.
* Fireballs.
* Flare.

Count each damage event once, after mitigation and excluding overkill. Misses, scenery, invulnerable targets and decorative effects generate no charge.

Fill the icon with molten orange-red energy. At full charge, pulse the button and display ULTIMA.

Activation is manual. Permit one Ultima per transformation. Its own damage does not refill the meter.

9. Ultima — Charging sequence

Nidhogg rises into a dramatic hovering pose and spreads its wings.

Long red spikes grow outward from its back, extending progressively through articulated armour seams.

A huge red-orange magic ring forms on and above its back, centred over the dorsal spine. Keep the ring visibly associated with the back rather than placing it on the ground.

Construct it from concentric luminous bands, intricate runes and floating angular segments. Accelerate its rotation until it spins furiously, with counter-rotating inner layers and circular trails of embers.

The dragon’s throat, chest and belly begin glowing red from within. Light escapes between scales, armour segments and vents.

Energy travels from the dorsal spikes through the body and gathers in the mouth, forming a compressed white-hot orange core between its jaws.

Show the charging progression clearly:

Spikes extend → dorsal ring appears and accelerates → body and belly illuminate → energy concentrates in the mouth.

Keep the body readable and the camera controlled. Use smooth rotation rather than strobing effects.

10. Ultima — Fire beam and colossal explosion

Nidhogg unleashes a massive orange fire beam downward into the ground.

Give it a brilliant white-yellow centre, dense orange flame, turbulent red edges and spiralling streams of molten light.

The beam must connect continuously from the mouth to the impact point. Animate the dragon bracing against its recoil.

At the ground, an intensely glowing impact sphere expands under the beam’s pressure. Circular pressure waves and fiery cracks spread outward.

Then release a colossal explosion with the visual scale of a nuclear blast:

* An immense orange fire dome.
* A broad expanding shockwave.
* A towering rolling fire-and-smoke column.
* A mushroom-shaped cloud illuminated from within.
* Flying embers and temporary glowing ground fractures.

Make it feel overwhelmingly powerful while preserving enough visibility to read the battlefield.

Use explicit damage events:

* The beam deals damage at a controlled fixed cadence.
* The final explosion deals one enormous AoE Fire hit per affected enemy.

Do not multiply damage through overlapping particles or shockwave meshes. Match the damaging area to the visible explosion.

The dragon and allied teammates are not harmed by its own finisher.

11. Ending the ultimate

After Ultima, the dorsal ring breaks into embers, the spikes settle and the internal glow dims.

Return the pet safely to valid land, dismiss Nidhogg in fire and embers, and restore the normal battle commands.

Begin the 120-second cooldown when the finishing sequence ends and normal controls return.

Because Nidhogg can fly outside the land, maintain and revalidate a safe return position. Never eject the pet into empty space, below the map or inside terrain.

If the existing transformation timer expires before Ultima is used, perform a safe exit without granting Ultima damage. If Ultima starts before expiry, allow its finite finishing sequence to complete.

On pet defeat, cancel the transformation without reviving it. Clean up temporary flight controls, effects, hitboxes and queued attacks correctly.

Sound and verification

Use deep dragon growls, powerful wingbeats, subtle mechanical movement, armour clicks and vent pressure.

Give Ultima a rising internal rumble, accelerating magical-ring resonance, a fierce beam roar and one decisive explosive impact.

Use detailed shading, selective local lighting, soft smoke edges, heat distortion and controlled bloom. Reduce decorative effects on lower settings without reducing projectile counts or gameplay hits.

Verify:

* Exactly 1/2/3 Fireballs.
* Exactly 10/20/30 Flare projectiles.
* Correct 2-second and 4-second cooldowns.
* Genuinely zero-cooldown Dive Bomb.
* Free flight beyond the land boundary.
* Correct aerial aiming and safe ground impacts.
* Safe return from offshore positions.
* Correct Ultima charging and manual activation.
* Growing dorsal spikes and the rapidly spinning ring on the back.
* One final explosion damage event.
* Complete control restoration and cooldown beginning after exit.

Complete the implementation, run the relevant project checks and report any remaining limitations.

Cocopets_Nidhogg_Fire_Ultimate_Claude_Prompt.md⁠￼