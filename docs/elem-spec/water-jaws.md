(The user's spec, sent 2026-11-13 with a two-form concept sheet. Their covering note: "Once do that, move onto building Jaws, use the same team and method as belladonna. Included a reference concept art for both forms.")

Implement the updated Jaws, a Water-element transformation ultimate, in my existing Cocopets game.

The pet rides one mechanical summon with two connected configurations: Jaws, a fast flying shark, and Leviathan, an anchored flying siege submarine.

The gameplay loop is: create Tidal Pools in shark form, gather enemies, transform into Leviathan, use the pools for powerful water artillery, then return to the shark to prepare another attack.

Inspect the existing project first. Reuse its combat architecture, Nidhogg-style flight, targeting, transformation lifecycle, pet models, damage-charged finisher system and input support. Update the existing Jaws ability and preserve its stable identity and saved progression.

Use the supplied Jaws-to-Leviathan concept sheet as the visual target. Match Beast Machine, Nidhogg and Sports Car in model detail, texture quality, animation and effects, rendered with premium 3D cel shading.

Required duration and cooldown

Setting	Requirement
Celestial, level 7	60 seconds shared across both forms
Outer ultimate cooldown	2 minutes 30 seconds / 150 seconds
Maximum Tidal Pools	Three per summon session
Finisher	One Shark Attack per summon session

Start the shared duration when shark form becomes controllable. Anchor, Release and their transformation animations use the same running timer. Switching form never restarts it or grants additional time.

Start the 150-second cooldown once, when the summon ends and normal pet control returns. This replaces the earlier inherited 120-second cooldown.

Base and Adept durations retain their existing configured values. If no values exist, use 30 seconds at base and 45 seconds at level 4 as provisional starting values. Only Celestial's 60 seconds and the 150-second outer cooldown are fixed by this update.

Show remaining summon time separately from the shared finisher gauge.

Shark form: appearance

Create a large, powerful mechanical shark, approximately the overall scale of Sports Car. Give it a broad predatory snout, a substantial hinged jaw, dimensional triangular teeth, a tall dorsal fin, wide pectoral fins and a segmented sweeping tail.

Use cobalt-blue armour, polished silver chrome, dark recessed machinery and restrained cyan energy channels.

Build curved armour plates with thickness and bevelled edges. Model the jaw hinges, selected pistons, fin roots, gill vents and important structural details as geometry.

Place the player's actual pet in a secure cockpit immediately behind the head and ahead of the dorsal fin. Keep the rider visible and attached to the same supported seat in both configurations.

A water-pressure cannon already exists inside the shark's mouth and forward body. It is packed into its resting configuration while the shark bites and fires Water Ray.

Leviathan form: appearance

Leviathan is a broad, low, heavy flying submarine retaining the shark's head, teeth, fins, cockpit and identifiable armour.

The flank plates slide outward on connected supports to form wider side hull sections. This exposes a recessed cyan water-energy reactor and its structural frame.

The shark's head remains the armoured prow. Its jaws open around the deployed circular pressure cannon, with the same teeth framing the muzzle.

The pectoral fins unfold into broad stabilising surfaces. The dorsal fin becomes the raised spine behind the cockpit. The seat lowers into a protected upper-deck position while keeping the pet upright.

The segmented tail folds beneath the rear hull. Its lobes rotate into stern control surfaces around the existing rear propulsion assembly.

Preserve matching panel markings, gill-vent placement, chrome borders and component dimensions. The lower silhouette comes from folding and repositioning the same parts.

One connected transformation rig

Build both configurations from a persistent set of parts.

Component	Jaws	Leviathan
Head and jaws	Predatory shark head	Armoured cannon prow
Mouth cannon	Packed within the forward body	Extended firing position
Flank armour	Streamlined body covering	Broader hull sections on captive rails
Pectoral fins	Swimming and steering fins	Stabilising wings
Dorsal fin	Shark silhouette	Command spine
Segmented tail	Extended swimming tail	Folded stern and control surfaces
Cockpit and seat	Raised riding position	Lowered protected position
Central reactor	Covered by body armour	Exposed between the hull sections

Block out the full transformation before polishing the model.

On Anchor, the shark slows, braces its fins and unfolds its hull. The cannon advances on its mount, the cockpit lowers, and the tail folds along its connected joints. Show the major locks seating before handing over siege controls.

Release reverses those movements into the same shark.

Maintain clearance around the rider, jaws, fins and tail throughout the transition. Keep the cannon, reactor and support mechanisms accounted for in both forms. Effects should accent the movement while leaving the mechanism visible.

Cel shading, textures and lighting

Use carefully designed light, midtone and shadow bands with subtle gradients that preserve curved volume.

Differentiate blue painted armour, reflective chrome, dark steel and luminous reactor surfaces through their material response.

Apply fine scratches, machining detail, selective edge wear, panel variation and recessed shading. Use controlled reflections, contact shadows and restrained rim lighting.

Keep outline thickness stable at gameplay distance. Cyan emission should reveal the reactor's structure rather than obscure it.

Water effects need layered blue depth, translucent edges, readable foam, shaped highlights and dimensional spray. Maintain clear enemy silhouettes and boss telegraphs beneath all water effects.

Movement and commands

Control	Jaws	Leviathan
Movement	Free flight and steering	Hold position; turn to aim
Dodge	Maw	Hydrojet
Strong attack 1	Water Ray	Depth Charge
Strong attack 2	Water Bombs	Maelstrom
Ultimate	Shark Attack gauge and activation	The same gauge and activation
Additional form command	Anchor	Release

Add a small, clearly labelled Anchor/Release control beside the combat menu, with keyboard, controller and touch support. Keep Dodge and the finisher as separate commands.

Both configurations use the pet's existing HP, defensive rules and status effects.

Preserve the ordinary loadout while the temporary commands are active. Switching forms preserves the summon timer, finisher charge, Tidal Pools and cooldown progression.

Use shared cooldown tracking for the corresponding strong-attack slots and Dodge. A form change must not make the replacement ability immediately ready after its paired ability was just used.

Free flight and anchoring

In shark form, adapt Nidhogg's flight volume, altitude control, banking, camera and aerial targeting. Allow travel across the battlefield and beyond the land's outline within the permitted encounter space.

Animate air-swimming through tail strokes, body flexion and fin adjustments.

Anchor can be used at a valid airborne position without requiring or consuming a Tidal Pool. A thin rotating water halo beneath Leviathan visually stabilises it. This halo is distinct from the ground pools and is not ammunition.

Leviathan holds its position and altitude while the player turns the hull to aim. Hydrojet repositions it; Release restores free flight.

Validate the transformation's occupied space before committing it. Retain a safe return location throughout offshore flight.

Summoning

A rotating ring of water forms around the pet. The chrome snout and teeth emerge first, followed by the blue body, fins and tail through a spiral of bubbles.

The pet settles into the cockpit, the gill vents illuminate, and the shark levels into controllable flight.

Begin in Jaws form with an empty Shark Attack gauge and zero Tidal Pools.

Tidal Pools: the central mechanic

Water Ray creates persistent pools of magical water on valid battlefield surfaces. Leviathan uses those pools to strengthen its artillery.

Maintain a maximum of three pools, shared between both forms and fixed at every level for this version.

Each pool has visible depth, swirling currents, a luminous blue boundary, restrained foam and a clear connection to the ground. Use a temporary surface effect that preserves terrain, navigation and collision.

Pools remain until consumed, replaced or the summon ends. Switching forms preserves them.

If Water Ray hits an existing pool, refresh that pool rather than stacking another at the same position. Creating a fourth distinct pool replaces the oldest available one.

Show three small pool indicators beside the summon UI. Distinguish available pools from those already committed to an attack.

Creating or refreshing a pool does not itself produce an additional damage event or charge the finisher.

A pool can fuel only one attack. Claim the relevant pools when an attack commits, and consume them through that attack's resolution. Prevent Depth Charge, Maelstrom and replacement logic from claiming the same pool simultaneously.

Claims count toward the three-pool limit. If all slots are claimed, Water Ray still deals its normal damage but cannot create an extra pool. A cancelled cast that never launches releases its claims.

Maw: shark Dodge

The shark rolls slightly, opens its jaws and dives toward the selected enemy or aimed valid surface.

At contact, it bites and performs a forceful ground-skimming thrash, bending its body and sweeping its tail along a curved route similar to Sports Car's Drift.

Use water sheets, foam and chrome-blue motion trails. Allow limited steering during the sweep, then pull back into stable flight.

Use a swept damage volume. Each enemy receives one intended Water hit across the combined bite-and-thrash action.

Preserve the existing Maw cadence. If no configuration exists, retain the inherited zero-extra-cooldown behaviour after the full action and recovery complete. Prevent overlapping activations and apply the normal dodge-protection rules.

Maw leaves the summon in shark form.

Water Ray: shark strong attack 1

Blue-white energy gathers inside the mouth while the gills brighten.

Fire a concentrated water-energy beam toward the aimed impact point. Use a bright cyan-white core, a blue outer body, helical water streams and travelling ripple rings.

At impact, release a powerful Water explosion with a rising geyser, pressure ring and sheets of spray.

Apply one authored primary explosion damage event. The beam and decorative effects do not introduce extra frame-by-frame hits.

Leave a Tidal Pool at the valid impact surface, subject to the three-pool rules.

Preserve existing tuning. If no value exists, the earlier two-second cooldown remains a provisional starting point.

Water Bombs: shark strong attack 2

(Changed by the user: "Change Rolling Wave to Water Bombs: Jaws will throw 7 water bombs at enemies, the bomb explode into water splash dealing water damages.")

Jaws lobs 7 water bombs in a quick volley from its mouth. Each targets an enemy in range, spread round-robin over the nearest enemies (one enemy takes all seven; seven enemies take one each); with no enemy in range they land in a fan ahead of the shark.

Each bomb is a tumbling glowing blue-white sphere of water with a short trail on an arcing lob, leading a moving target slightly.

Each bomb bursts into a water splash (a crown of spray, a ring wave on the floor, droplets, a brief flash) and deals one Water damage event to every enemy inside its splash. Bombs charge the finisher and break props like the other attacks. It can be cast while flying.

Preserve existing tuning. If no value exists, the earlier four-second cooldown remains a provisional starting point.

Hydrojet: Leviathan Dodge

The gill vents and steering outlets release a violent burst of water, propelling Leviathan a short distance in the chosen direction.

Tilt the stabilisers into the movement, show a strong jet plume and let the hull settle into a new anchored position afterward.

Maintain responsive directional control, collision checks and the game's normal dodge-protection conventions.

Hydrojet is an evasive movement action. It stays in Leviathan form and does not consume pools.

Keep its range and recovery configurable. Switching between Maw and Hydrojet must not reset their shared recovery.

Depth Charge: Leviathan strong attack 1

The reactor brightens and channels water pressure into the deployed mouth cannon.

Fire a substantial sphere of compressed water toward the target. Show a dense blue core, concentric pressure bands and a curling trail of spray.

On ordinary ground, the sphere explodes for substantial Water AoE damage.

When aimed at an available Tidal Pool, claim that pool for the shot. At impact, the sphere plunges beneath its surface, compresses the water and triggers a much larger explosion followed by a towering geyser.

Consume the pool as the empowered blast resolves.

Make the empowered hit substantially stronger than the ordinary impact. Resolve it as one authored amplified blast per affected enemy, with the geyser included in its visual delivery.

Use a bounded projectile path and coherent recoil. A valid launched shot may finish after Release according to the existing combat lifecycle, but it must retain its original pool claim and damage ownership.

Configure the shot's damage, radius, travel time and cooldown in ability data.

Maelstrom: Leviathan strong attack 2

Maelstrom requires at least one available Tidal Pool. If none exists, show that Water Ray must create one before the skill can be used.

On activation, claim every currently available pool belonging to this summon.

Leviathan's reactor intensifies. Water streams connect its energy discharge visually to the claimed pools, which become violent whirlpools.

Each whirlpool pulls nearby movable enemies inward and applies repeated Water damage over a finite duration. Give it a clearly visible rotating rim, depressed centre, rising spray and layered currents.

After the sustained phase, all claimed pools collapse and erupt together in a coordinated Water burst. Consume those pools.

More prepared pools provide greater battlefield coverage. Bosses that resist pulling still receive damage when within the valid volumes.

Use a shared per-enemy registry for each scheduled damage tick across the whirlpools, and another for the final burst, so accidental overlap does not multiply the full attack repeatedly.

The attack affects its captured pool set. It must not consume new pools created later.

Keep the channel duration, tick rate, pull strength, burst damage and cooldown configurable.

Shared Shark Attack gauge

Use one continuous finisher gauge for the entire summon.

Charge it from actual enemy damage dealt by Maw, Water Ray, Water Bombs, Depth Charge, empowered geysers and Maelstrom.

Count each resolved damage event once after mitigation and exclude overkill. Movement, Anchor, Release, pool creation and cosmetic effects grant no charge.

Switching forms preserves all accumulated charge.

At full charge, display SHARK ATTACK with a luminous jaw icon. The player activates it manually from either form.

The finisher works with zero, one, two or three remaining pools. Pool availability does not change its readiness.

Permit one Shark Attack per summon session. Its own damage cannot recharge the gauge.

Shark Attack: the starry ocean

On activation, commit to a finite finishing sequence. Stop ordinary commands, settle or cancel unfinished attacks, and prevent pending pool effects from adding unintended finisher hits.

A midnight-blue ripple spreads across the active battlefield. The ground visually becomes a glossy dark ocean, with stars floating just above its surface and reflecting beneath it.

Preserve the underlying terrain, navigation and combat positions.

If starting in Leviathan form, visibly fold back into the shark during the approach and beginning of the dive. Keep the pet supported in the original cockpit and show the important connected motions before submersion.

The shark and pet dive beneath the magical water. Show the snout, body, dorsal fin and tail entering in sequence, leaving concentric ripples and bubbles. A blue thick huge beam of light shoot through the ground, creating a massive sky beam causing massive damage.

Animate this through a controlled visual submersion rather than dropping the gameplay actor beneath the map.

Remaining Tidal Pools merge into the ocean visually and are cleared without additional damage.

Shark Attack: colossal spirit jaws

A huge shadow moves beneath the water, and stars gather along two enormous curved outlines.

Raise a translucent spirit shark jaw as large as the active battlefield. Build distinct upper and lower arcs from blue-white energy, flowing water and enormous crystalline teeth.

Keep the jaw spiritual and transparent, with open spaces that preserve enemy visibility.

The lower jaw rises from the water while the upper jaw arches above the combat area. Their movement uses coherent hinge positions at the sides.

The real mechanical shark and its rider breach through the centre as the giant jaws frame the battlefield.

Pause briefly with the jaws open, then snap them shut.

Deliver one colossal AoE Water damage event per eligible enemy at closure. Teeth, jaw meshes, spray and stars must not produce duplicate damage.

Release a huge pressure shockwave, exploding stars and curtains of water while keeping the bite readable.

Return and dismissal

The spirit jaws dissolve into stars and bubbles. The mechanical shark completes its breach, then dissolves into thin shimmering bubbles from tail to head.

Safely dismount the pet onto valid terrain before removing its support. Let the midnight ocean recede to reveal the unchanged battlefield.

Restore ordinary movement, Dodge, strong attacks, basic attacks, ultimate controls, targeting and camera behaviour.

Remove the Anchor/Release control and temporary pool UI.

Start the 150-second outer cooldown once normal control returns.

Timeouts, interruptions and cleanup

If the shared duration expires before Shark Attack is committed, safely dismiss whichever form is active without granting finisher damage.

If Shark Attack was validly committed before expiry, let its finite sequence complete. Ordinary form switching does not suspend or extend the summon timer.

Handle expiry during transformation, Maw, Hydrojet or a projectile deliberately. Resolve a safe exit and cancel future damage from cancelled actions.

On defeat or encounter reset, stop attacks, temporary visual effects, projectile callbacks, Maelstrom ticks and pending transformations. Preserve the pet's correct defeat state.

Clear every pool, reservation, anchor halo, spirit jaw, underwater visual and temporary input handler through one guarded cleanup path.

Preserve normal cooldown progression. Keep encounter clocks independent of summon UI and form changes.

Sound, performance and verification

Use distinct sound identities: mechanical air-swimming, a jaw snap and heavy splash for Maw, pressure charging for Water Ray, a volley of lobbed splashes for Water Bombs, locking mechanisms for Anchor, short violent jets for Hydrojet, a deep cannon discharge for Depth Charge and spiralling suction for Maelstrom.

Shark Attack should build from an underwater hush into a huge surge and decisive bite.

Pool repeated spray, foam, bubbles and stars. Share materials and repeated geometry while preserving both hero silhouettes, cockpit detail and transformation readability.

Verify the complete ability:

* Connected shark and submarine forms with the same rider and major parts.
* Premium 3D cel shading and detailed blue/chrome materials.
* Free flight, anchored aiming and reliable Hydrojet recovery.
* Exactly one shared timer, including 60 seconds at Celestial.
* Exactly one 150-second cooldown after exit.
* Correct Anchor/Release and contextual commands.
* At most three pools, preserved through form changes.
* Clear creation, refresh, replacement, reservation and consumption behaviour.
* Ordinary and pool-empowered Depth Charge impacts.
* Maelstrom's finite ticks, resisted pulls, final burst and pool consumption.
* Shared cooldowns that survive switching forms.
* One shared finisher gauge and one Shark Attack per session.
* Finisher availability from both forms even with no pools.
* One intended jaw-closure damage event per enemy.
* Safe offshore return, timeout, defeat, reset and full cleanup.

Implement the complete updated ability, run appropriate project checks and inspect gameplay captures. Report the chosen provisional balance values and any actual remaining limitations.

Update (v321, the user's later changes, recorded by the team; they take precedence over the text above where they differ)

* Duration: 60 seconds at every level. Outer cooldown unchanged (150 seconds).
* Shark commands: Strong attack 1 is Water Bombs (1.0 second cooldown), Strong attack 2 is Water Ray (1.5 seconds). Leviathan: Strong attack 1 is Depth Charge (1.0 second), Strong attack 2 is Maelstrom (1.5 seconds). Each slot keeps one cooldown across the forms.
* Tidal Pools: at most three at once, five at Celestial.
* There is no Anchor command any more. After the fifth Water Ray cast that makes or refreshes a pool, Jaws transforms into Leviathan by itself (the same transformation animation). In Leviathan a Transform command (the former Anchor/Release button, available only in Leviathan form) transforms it back to the shark; the pool cast count then restarts, so five more pool casts transform it again. Existing pools stay. A short lockout (about one second) follows either transformation.
* Leviathan is no longer anchored: it flies like the shark, a little slower, and Hydrojet remains its Dodge.
