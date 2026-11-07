Implement Sports Car, a spectacular Light-element transformation ultimate in my existing Cocopets game.

The pet summons and drives a giant pink magical-girl sports car decorated with love hearts. Driving through enemies deals Light damage. While driving, Dodge and both strong attacks temporarily become vehicle abilities. Dealing damage charges Supernova, a finishing attack involving multiple burnouts, waves of hearts and stars, and a final explosion that ejects the pet.

Inspect the project first. Preserve its engine, art direction, controls, save data and working features. Implement the complete vehicle, transformation, controls, attacks, effects, UI and return to normal combat.

Duration and cooldown

Ultimate level	Vehicle duration
Base	20 seconds
Level 4	25 seconds
Level 7 — Celestial	35 seconds

Start the duration when the car becomes controllable.

The cooldown is 120 seconds, beginning after vehicle mode ends and normal battle controls return. Do not start it when the car is summoned.

Temporary battle controls

Normal control	Vehicle control
Movement	Drive and steer
Dodge	Drift
Strong attack 1	Shooting Star
Strong attack 2	Love Sensation
Ultimate	Supernova charge meter and activation button

Keep the car pink. Make the Drift button beautiful scarlet red, with a bright curved tyre-track symbol and delicate pale-pink or gold trim.

Temporarily suppress the pet’s ordinary attacks while driving. Preserve its original loadout for restoration afterward.

1. Summoning and car design

A luminous heart-shaped seal opens beneath the pet. Pink ribbons of light spiral upward, tracing the wheels, bonnet and spoiler before the car becomes solid.

The pet enters the driver’s seat as heart-shaped headlights ignite and stars scatter across the ground.

Build a detailed, dimensional sports car with:

* A low aerodynamic body and sculpted bonnet.
* Pronounced wheel arches and rotating wheels.
* A curved windscreen and rear spoiler.
* Heart-shaped headlights and sculpted heart emblems.
* Star-shaped wheel hubs.
* Pink-white accent lights.

Use glossy candy-pink paint, pearlescent highlights, pearl-white accents and small gold details. Give the paint convincing reflections and roughness variation. Use darker textured tyres, reflective trim and slightly tinted glass.

Make it substantially larger than the pet while keeping its collision footprint practical for the battlefield. Keep the pet visible in the driver’s seat using its existing model.

2. Driving and impact damage

Driving should feel responsive and playful, with quick acceleration, readable steering, wheel rotation and restrained body lean.

Use the existing movement input to drive and steer. Support the project’s existing keyboard, controller and touch controls.

Driving through enemies deals Light damage, accompanied by heart-shaped flashes, luminous stars and sparkling impact trails.

Use swept collision and per-enemy hit gating. Repeated passes can damage enemies again, but contact must not deal damage every rendered frame. Parking against an enemy must not generate unlimited damage or Supernova charge.

Respect walls and battlefield boundaries. Follow existing boss-displacement rules.

The car uses the pet’s existing HP and defensive systems. Do not introduce a separate vehicle health bar or automatic permanent invulnerability.

3. Drift — Replaces Dodge

Pressing the scarlet Drift button makes the car perform a controllable sideways powerslide.

The front turns into the slide while the rear swings outward. Two curling trails of pink-white light follow the tyres, accompanied by soft luminous smoke.

The sliding car deals massive AoE Light damage through a broad swept area. Each enemy takes this drift damage once per activation.

At contact, burst layered love hearts, star-shaped sparks and curved ribbons of light around the enemies. Briefly brighten the headlights and wheel hubs.

Give the drift a clear beginning, sliding phase and recovery. Use the existing dodge cadence as a starting point for its configurable cooldown.

Avoid accidentally duplicating drift damage with ordinary driving-contact damage from the same impact.

4. Shooting Star — Replaces Strong Attack 1

The car unleashes a barrage of star missiles in every direction.

Small star-shaped launch sigils appear around the vehicle. Fire several rapid radial volleys, rotating the launch angles slightly between volleys to create an expanding starburst with full 360-degree coverage.

Each missile should be a dimensional five-pointed star with:

* A brilliant gold-white core.
* Rose-pink edges.
* Gentle rotation.
* A long, tapered comet trail fading into transparency.

Missiles burst into compact flashes and smaller fading stars when they strike enemies.

Use real projectile hit detection. Decorative fragments and trails must not generate additional damage.

Keep volley count, missile count, speed, damage and cooldown configurable according to the game’s strong-attack balance.

5. Love Sensation — Replaces Strong Attack 2

The car jumps into the air and slams down onto enemies, creating a powerful heart-shaped Light explosion.

First compress the suspension and gather a glowing heart beneath the chassis. Launch the car into a short graceful arc, with ribbons and stars curling behind it.

Use the existing targeting system to choose a valid landing point. Show a clear pink-gold landing marker and a moving ground shadow.

On landing:

* Compress the suspension visibly.
* Deal one large AoE Light damage event.
* Expand a luminous heart outline across the ground.
* Release layered stars, rose-pink mist and glittering rays.

Synchronise damage with actual ground contact. The take-off, expanding decorative heart and lingering particles must not cause unintended extra hits.

Prevent landing through walls or outside playable terrain.

6. Building Supernova

During vehicle mode, the ultimate icon becomes a Supernova meter, starting empty.

Fill it from actual enemy damage caused by:

* Driving impacts.
* Drift.
* Shooting Star.
* Love Sensation.

Use a configurable damage-to-charge conversion. Count each damage event once, after mitigation and excluding overkill. Misses, invulnerable targets, scenery and decorative collisions generate no charge.

Visually fill the icon’s circular border with pink-gold light. Its central emblem combines a star and a heart.

When full, give it a clear ready pulse and display SUPERNOVA.

The player must activate Supernova manually. Reaching full charge does not automatically trigger it. Pressing the icon before it is ready must not resummon the car.

7. Supernova — Burnout barrage

Activating Supernova commits the car to its finishing sequence and temporarily ends free driving.

The car brakes into a dramatic sideways pose. Its wheels spin furiously, producing luminous pink tyre smoke and interlocking glowing rings on the ground.

Perform multiple consecutive burnouts, with the car pivoting through connected, readable poses.

Each burnout releases an expanding wave of Light containing:

* Large translucent love hearts.
* Radiant spinning stars.
* Gold-white ribbons.
* A bright leading rim fading into soft pink smoke.

Each pulse deals one AoE Light hit per enemy within its actual radius. Successive pulses can hit the same enemy again.

Disable ordinary driving-contact damage during this sequence to prevent accidental additional damage ticks.

8. Supernova — Final explosion and ejection

After the final burnout, pull the surrounding light inward.

The headlights, heart emblems and wheel hubs shine intensely. A large star-shaped aura forms around the car as the sound rises toward its climax.

The car explodes into a brilliant pink-gold supernova, dealing one additional large burst of AoE Light damage.

Release layered heart silhouettes, spinning stars and sweeping rays. Keep the pet and enemies readable through the effects.

At the explosion, eject the pet upward along a short arc, trailing ribbons and stars. The explosion does not damage its owner or allies.

Land the pet safely on nearby navigable ground, remove the car and restore normal battle controls.

Supernova can occur only once per transformation. Its own damage does not refill its meter.

9. Timeout and restoration

If the vehicle timer expires before Supernova is activated, safely return the pet to the ground and dissolve the car into hearts and stars. Do not trigger an unearned Supernova.

If Supernova was activated before expiry, allow its finite finishing sequence to complete.

After normal expiry or Supernova completion:

* Restore normal movement and attacks.
* Restore Dodge.
* Restore both original strong attacks.
* Restore the Sports Car ultimate icon.
* Begin the 120-second cooldown.

Restore the original skill identities without resetting their normal cooldowns or changing saved equipment.

If the pet is defeated during vehicle mode, cancel the remaining sequence and remove the car. Do not revive the pet through the ejection animation. Begin the ultimate cooldown once when the form terminates.

Clean up temporary controls, effects and queued actions on encounter end or reset.

High-quality graphics and sound

Prioritise detailed car geometry, beautiful paint shading, layered translucent effects and expressive vehicle animation.

Make hearts and stars visibly dimensional using curved or bevelled meshes where appropriate. Use textured smoke, soft particle edges, selective local lighting and restrained bloom.

The car must remain readable through its own effects. Pool repeated particles and missiles, and reduce decorative density on lower settings without changing gameplay.

Use a sparkling summoning chime, playful engine hum, rising tyre squeal, crystalline missile sounds and a resonant heart-slam impact.

Supernova should build through increasingly powerful burnout pulses before one decisive explosion.

Coordinate camera shake and flashes, respecting existing accessibility settings.

Verification

Verify:

* Exact 20/25/35-second durations.
* The 120-second cooldown starts only after exit.
* Correct temporary controls and scarlet Drift icon.
* Both vehicle strong attacks work correctly.
* Damage fills Supernova once per valid event.
* Supernova activates only when full and manually triggered.
* Its final explosion damages enemies once.
* Timeout, defeat and encounter reset restore state correctly.
* No duplicate damage, stuck driving controls or accidental ordinary-skill cooldown resets.

Complete the implementation, run the relevant project checks and report any remaining limitations.