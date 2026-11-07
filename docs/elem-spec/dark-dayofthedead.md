# Dark ultimate: Day of the Dead — the user's spec (verbatim, 2026-11-07)

The user: "Day of the Dead can be the 11th Dark Ult." Row: key `dayofthedead`, ADDED as an 11th Dark ultimate (no replacement), cost 100, cd 120, glyph 'flower'.

Implement Day of the Dead, a spectacular Dark-element ultimate for my existing Cocopets game.

The pet temporarily revives every defeated teammate on the current battlefield simultaneously. Upon revival, all spirits unleash their equipped ultimates together, then each performs both equipped strong attacks. They continue fighting temporarily before dissolving and returning to their defeated state.

Inspect the existing project first. Preserve its engine, art direction, controls, save data and working features. Integrate this fully with the party, ultimate, targeting, animation and combat systems.

Build the complete ability, including gameplay, animation, materials, visual effects, sound and UI.

Core attack sequence

Mass revival → synchronized ultimates → first strong attack → second strong attack → temporary spirit combat → departure.

The simultaneous ultimate release is the defining moment. Do not stagger the spirits’ ultimate activations.

Progression

Use these starting balance values, keeping them configurable:

Ultimate level	HP on revival	Additional spirit duration after its combo
Base	40% maximum HP	8 seconds
Level 4	50% maximum HP	11 seconds
Level 7 — Celestial	60% maximum HP	14 seconds

Suggested cooldown: 120 seconds.

Calculate revival HP from each teammate’s own maximum HP.

Each spirit’s duration begins after that spirit finishes its ultimate and both strong-attack attempts. Spirits can still take damage and be defeated during this sequence.

1. The summoning ritual

The caster raises its head or performs an appropriate existing casting gesture. A huge marigold-shaped magic circle unfolds beneath it.

Build the circle from layered petal shapes, delicate rune rings and glowing golden lines. Keep its interior dark and translucent so the battlefield remains visible.

Small violet candles ignite around its perimeter. Golden-orange petals lift from the ground and spiral around the caster as a wave of warm light travels toward every fallen teammate.

Use a distinctive palette of deep violet, warm candlelight and brilliant orange marigolds. The atmosphere should feel haunting, beautiful and triumphant.

2. All fallen teammates rise together

At every eligible teammate’s fall position, a smaller flower-shaped seal opens. A slender pillar of violet flame rises through swirling marigold petals.

All selected teammates materialise simultaneously, their original forms appearing progressively from their feet upward.

Reuse their existing models and animations. Apply:

* Translucent violet spectral shading.
* Warm gold rim highlights.
* Stylised luminous skeletal markings.
* Soft smoky edges and drifting marigold petals.

Keep faces, silhouettes and identifying features recognisable. Use emissive markings or simple attached ribbons rather than modelling new skeletons.

Connect the revival circles to the caster with curved golden threads.

Use valid nearby ground positions if the original fall positions are obstructed.

3. Synchronized ultimate release

Once all spirits have materialised, the golden threads flare together and a giant spectral marigold opens beneath the formation.

On that exact combat update, every revived teammate activates its equipped eligible ultimate.

Use the real abilities, including their damage, healing, buffs, animations and effects. Do not replace them with generic explosions.

Synchronize the start of the casts. Different abilities should retain their normal wind-ups, projectile speeds and impact timings.

Attack abilities use valid enemy targets through the existing targeting system. Support abilities select appropriate allied recipients.

Preserve each ultimate’s elemental identity, adding only subtle violet-and-gold spectral accents around the spirit casting it.

4. Both strong attacks follow

As soon as a spirit finishes its ultimate action:

1. Cast its first equipped strong attack.
2. When that action finishes, cast its second equipped strong attack.
3. Begin its additional spirit-duration timer.

Each spirit follows this sequence independently. A teammate with a short ultimate can begin its strong attacks while another teammate is still performing a longer ultimate.

Use actual action-completion events rather than guessed delays. Persistent projectiles or fields can continue while the next action begins when the existing ability system permits it.

Skip empty slots, forbidden abilities or abilities without valid targets. An interrupted attempt is not automatically repeated.

5. Free spectral activations

Each revived teammate receives exactly:

* One ultimate activation.
* One activation of strong attack slot 1.
* One activation of strong attack slot 2.

These granted activations bypass cooldown readiness and ordinary energy or ultimate-charge requirements.

Do not consume the teammate’s stored ultimate charge, reset its normal cooldowns or overwrite its persistent resources. Use a separate temporary casting context.

Preserve intrinsic ability mechanics, such as a strong attack’s self-HP sacrifice, using the spirit’s temporary health.

Prevent resurrection loops: spirits cannot activate Day of the Dead or another resurrection ultimate. Skip that ultimate and proceed to their strong attacks. Also block nested resurrection effects from granted abilities or triggered passives.

Overlapping casts must not duplicate an active spirit or stack additional free-action sequences onto it.

6. Remaining spirit combat

After the opening sequence, spirits fight autonomously using normal attacks and existing movement and targeting behaviour.

They receive no additional ultimate or strong-attack activations from this cast.

Show their temporary HP and a discreet countdown. As time runs down, gradually soften their outer glow and increase the drifting petals.

Healing can restore temporary HP but cannot extend their duration or turn them into permanently revived teammates.

7. Departure

When a spirit’s timer expires, immediately end its combat actions.

Its fading image briefly turns toward the caster and releases a small golden flame. The body dissolves into marigold petals while the flame rises above the battlefield.

Use a shorter violet fracture and petal dissolve if the spirit is defeated early.

Return the teammate to its defeated state. This is a temporary resurrection, not a permanent revival.

High-quality graphics and animation

Create the spectacle through strong composition, materials, lighting and choreography.

Build marigolds from repeated curved petal meshes, candles from simple geometry and connecting threads from animated ribbons. Animate scale, rotation, opacity and shader parameters instead of relying on complex organic simulation.

Use textured petals, selective emissive runes, soft flame edges and dimensional spectral shading. Keep the spirits visible against their own attacks.

When several ultimates overlap:

* Coordinate camera impulses rather than stacking full-strength shakes.
* Control combined bloom and temporary lights.
* Reduce redundant decorative particles where necessary.
* Keep enemies, telegraphs and UI readable.
* Preserve simultaneous activation and every intended gameplay effect.

Respect existing reduced-motion and camera-shake settings.

Sound design

Begin with a low chime and a rising spectral choir texture. Use one unified resonant accent when the spirits rise and activate their ultimates.

Retain each ability’s recognisable sounds, mixing them to avoid clipping or overwhelming the scene.

Finish departures with soft bells and drifting-petal sounds.

State handling and verification

Select eligible defeated teammates from the caster’s active team at cast commitment. Exclude enemies, reserves, living teammates and temporary summons. Teammates defeated afterward are not added to that cast.

If no eligible teammates exist, make the ultimate unavailable with clear feedback and consume no charge or cooldown.

Cancel pending actions when a spirit falls or expires. Remove temporary state cleanly, without duplicating death rewards or unintended death-triggered effects. Clean up all spirits and queued actions when the encounter ends or resets.

Verify:

* Simultaneous revival and ultimate activation.
* Exactly one attempt per granted ability.
* Correct strong-attack order.
* Independent post-combo timers.
* Correct HP and duration at every progression tier.
* Target death, missing skills, interruption and early spirit defeat.
* No resurrection loops or duplicate spirits.
* Correct preservation of normal resources and cooldowns.
* No permanent resurrection or bypass of the normal party-defeat condition.

Update the tooltip to explain the complete sequence and temporary nature of the revival.

Complete the implementation, run the relevant project checks and report any remaining limitations.