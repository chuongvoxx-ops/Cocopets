Implement Fenrir, an Ice transformation ultimate in my existing Cocopets game. Fenrir is one giant mechanical summon with two physically connected configurations: an armoured crystalline wolf and a futuristic ice motorcycle.

The player’s actual pet rides and controls both forms. Match the high-quality 3D modelling, materials, advanced shading, textures, animation and effects of Beast Machine and Sports Car.

Inspect the existing transformation framework before implementation. Deliver a complete playable ability with a shared mechanical rig, contextual commands, effects, sound, finisher gauge and reliable restoration of normal combat.

Shared visual identity

Use polished silver armour, dark mechanical recesses, cobalt and sapphire ice crystals, cyan energy channels and a black riding saddle.

The ice needs genuine faceted volume, reflective edges, internal cracks, frost accumulation and controlled translucency. Preserve the distinction between reflective metal, rough rubber, dark machinery and crystalline ice.

Both forms retain:

* Exactly two oversized, wide tyres with substantial tread and cyan-lit hubs.
* Exactly two long, thin cannons.
* The same saddle and rider.
* The same wolf head, articulated legs, tail and crystal armour.
* A particularly large, bulky and spiky rear silhouette in motorcycle form.

Wolf form

Create a powerful mechanical wolf with a long armoured muzzle, pointed ears, narrow cyan eyes, deep chest, strong shoulders and haunches, four articulated legs, broad clawed paws and a segmented tail.

Use angular metal construction rather than soft fur. A swept-back crystalline mane runs from the head across the shoulders.

The two actual tyres remain intact along the body’s longitudinal centreline: one inside the chest between the front legs, the other within the pelvis between the rear legs. Their sidewalls and glowing hubs remain partly visible, raised above the ground while the paws support the wolf.

The pet sits securely on the middle of the back. The two slender cannons face forward above the shoulders. The tail carries connected ice-armoured segments with a clear folding path.

Motorcycle form

Create a heavy futuristic motorcycle with two huge wheels, a low central saddle, a wolf-faced front fairing and an oversized rear cowl covered in long crystalline spikes.

The folded wolf head forms the front fairing, retaining its muzzle shape, cyan eyes and swept ears. The four legs fold into visible braces around the frame, fork and rear suspension.

The tail and rear armour fold into the bulky spiked backside. Leave enough clearance for the rider, steering and suspension.

The same two cannons pivot downward to the bike’s sides, with their long thin barrels extending forward beside the front wheel.

Connected transformation

Build both forms from one persistent collection of parts.

Component	Wolf form	Motorcycle form
Two tyres	Raised inside chest and pelvis	Front and rear ground contact
Four legs	Extended walking supports	Folded structural braces
Head and neck	Extended wolf head	Front fairing
Saddle	Mid-back rider seat	Motorcycle seat
Two cannons	Above the shoulders	Along the sides
Segmented tail	Extended behind the body	Folded rear cowl
Crystal armour	Mane and body armour	Front and rear fairings

Use real pivots, connected support arms, sliding pistons and locking points. Keep component sizes consistent.

Show the transformation clearly. Armour opens for clearance, joints rotate and parts lock together. Keep the pet on the same supported seat throughout. Check the entire motion path for intersections, especially the cannons, wheels, legs and rear spikes.

Commands

Control	Motorcycle form	Wolf form
Movement	Drive	Run
Dodge	Drift, then transform into wolf	Sliding spin, then transform into motorcycle
Strong attack 1	Ice Cannon	Ice Cannon
Strong attack 2	Somersault	Spinning Wheel
Ultimate	Diamond Dust	Frozen

Use one summon timer, one shared finisher gauge and one outer ultimate cooldown. Switching form preserves all three.

Drift — Attack first, transform at the end

Every completed Drift changes Fenrir into the opposite form exactly once, at the end of the attack.

In motorcycle form, lean into a sharp spinning drift similar to Sports Car. Show wheel rotation, broken traction, frost spray and a sweeping Ice attack through nearby enemies.

At the destination, large ice spikes erupt from the ground. The bike then unfolds into the wolf: legs extend, wheels lift, the head moves forward, cannons rise and the tail opens.

In wolf form, perform a low sliding pivot and spinning skid, using claw contact, frost spray and the same sweeping attack. At the destination, erupt the ice spikes and fold into motorcycle form.

The important crystal formation appears where Fenrir finishes drifting. A frost trail can mark the route, but it must not replace the destination spikes.

Use separate, deliberate damage phases for the moving sweep and endpoint eruption. Update the form and command menu only after the opposite configuration is ready.

Only Drift performs this form switch. Somersault, Spinning Wheel, Diamond Dust and Frozen must not invoke it accidentally.

Ice Cannon — Shared strong attack 1

Interpret the requested two cannon rounds as one paired volley: one projectile from each of the two cannons.

Skill level	Paired volleys	Total projectiles
Base	1	2
Level 4 — Adept	2	4
Level 7 — Celestial	3	6

Fire successive volleys with a clear rhythm. The same cannons fire from their side positions in motorcycle form and shoulder positions in wolf form.

Show chambers charging, cold vapour venting and controlled recoil. Each projectile has a bright Ice core and a trailing stream of frost.

At each impact point, a giant ice crystal formation erupts. After a short readable pause, cracks spread across it and the formation shatters.

Use an impact/growth damage phase followed by a shatter AoE. Avoid accidentally counting projectile impact and crystal creation as two separate initial hits.

Share the cooldown across both forms. Transforming must not reset it or replay unfinished volleys.

Spinning Wheel — Wolf strong attack 2

Fenrir performs a forward somersault, curls into a rolling configuration and travels diagonally across the battlefield like a spinning wheel.

Keep its limbs and cannons in mechanically valid positions. Leave a visible frost trail, ice spray and curved streaks behind the rolling body.

Use a swept attack volume along the route and controlled damage registration. Finish with the wolf unfolding into a stable four-paw landing.

Remain in wolf form.

Somersault — Motorcycle strong attack 2

The motorcycle performs a dramatic vertical somersault.

As it rises, a giant ice crystal thrusts upward from the ground, damaging enemies within its growth area. Hold the crystal briefly, then shatter it for a second distinct damage event.

Keep the rider attached, wheel motion visible and cannons clear of the ground. Finish with a stable landing and suspension compression.

Remain in motorcycle form. Share the contextual second strong-attack cooldown with Spinning Wheel.

Finisher gauge

Charge one shared gauge from actual enemy damage caused by Fenrir. Preserve charge when Drift switches forms.

At full charge, the available finisher depends on the current form. The player chooses which one to use by changing form before activation. Permit only one finisher per summon.

Diamond Dust — Motorcycle finisher

The bike performs a powerful burnout and controlled spinning manoeuvre.

Stacks of enormous ice crystals erupt in expanding circular formations around it. Build several concentric layers with staggered heights, spreading frost and deep cracking sounds.

Freeze every valid enemy within the affected area using the existing Ice status rules. Respect established boss and freeze-resistance behaviour.

After the final crystal layer rises, luminous fractures spread through the formation. Everything shatters in one coordinated release, dealing massive Ice damage and leaving fine sparkling particles suspended in the air like diamond dust.

This burnout does not trigger Drift’s transformation. End the summon after the shatter, safely dismount the pet and dissolve the bike into the icy aftermath without adding another damage event.

Frozen — Wolf finisher

The wolf backflips backward and lands facing the target. Lock all four paws firmly onto the ground, with claws digging in and leg pistons compressing.

The two existing shoulder cannons visibly load their cartridges. Receivers cycle, chambers lock and concentrated cyan energy gathers along the barrels.

Release one enormous combined beam of ice-cold energy. Two short muzzle streams may converge into the main beam, but they must share one coherent damage volume.

The damaging beam lasts exactly five seconds, excluding the backflip, loading, charge and ending animations.

Use a brilliant white core, cyan outer layers, twisting frost filaments, cold vapour and heavy Ice impact effects. Apply sustained damage through fixed combat ticks, independent of frame rate.

After the beam stops, frost cracks spread across Fenrir. Safely release the pet, then shatter the wolf into ice dust. Its disappearance is an exit effect, without an additional damage burst.

Timing, cleanup and verification

Preserve existing Fenrir balance configuration. If none exists, 20/25/35-second summon durations and a 120-second cooldown after exit may serve as provisional inherited defaults. They remain configurable.

Starting in motorcycle form is also a configurable default.

Changing forms must never restart the timer, refill the gauge or clear cooldowns. Both forms use the pet’s existing HP and status systems.

On timeout, safely dismount and dissolve the current form without granting a free finisher. Let an already committed finisher complete its finite sequence unless defeat or an encounter reset requires cancellation.

Verify transformation clearances, endpoint ice spikes, 2/4/6 projectile totals, shared cooldowns, correct contextual commands and Frozen’s exact five-second damage window.