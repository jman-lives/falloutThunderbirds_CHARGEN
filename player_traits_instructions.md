# Fallout: Thunderbirds — Player Traits Instructions

This document defines character traits, how they are selected during character creation, and how they modify a character’s statistics, skills, and gameplay behavior.

Traits are optional, but they provide powerful benefits paired with meaningful drawbacks.

This document is the authoritative reference for traits.

---

## Traits Overview

Traits describe notable aspects of a character’s personality, physiology, or background.

- A character may select **two traits**, **one trait**, or **no traits**
- A character may **never have more than two traits**
- Trait effects are applied **after** Primary Statistics are assigned
- Trait effects may modify:
  - Primary Statistics
  - Secondary Statistics
  - Skills
  - Combat rules
  - Game behavior

Unless explicitly stated otherwise, trait modifiers stack additively.

---

## Trait Restrictions

Some traits are restricted by race or character type.

Examples:
- Some traits cannot be chosen by **Animals**
- Some traits cannot be chosen by **Robots**
- Some traits may only be chosen by **Ghouls**

The character creation system must enforce all trait restrictions.

---

## Trait Descriptions

### Fast Metabolism

Your metabolic rate is twice normal.

**Effects:**
- +2 to Healing Rate
- Radiation Resistance starts at **0%**
- Poison Resistance starts at **0%**
- Racial modifiers are applied after this reset

**Restrictions:**
- Robots cannot choose this trait

---

### Small Frame

You are smaller than average, but more agile.

**Effects:**
- +1 Agility
- Carry Weight formula changes to:

  CarryWeight = 15 × STR

**Restrictions:**
- None

---

### One Hander

You favor single-handed weapons.

**Effects:**
- +20% chance to hit with one-handed weapons
- −40% chance to hit with two-handed weapons

**Restrictions:**
- Animals cannot choose this trait

---

### Finesse

Your attacks favor precision over raw power.

**Effects:**
- All attacks deal **30% less damage**
  - Applied after Damage Threshold and Damage Resistance
- +10% Critical Chance

**Restrictions:**
- None

---

### Kamikaze

You sacrifice defense for speed.

**Effects:**
- No natural Armor Class
  - Armor Class = armor only
  - Agility does not contribute to Armor Class
- +5 Sequence

**Restrictions:**
- None

---

### Heavy Handed

You hit harder, but lack finesse.

**Effects:**
- +4 Melee Damage
- Critical hits:
  - Deal 30% less damage
  - Are 30% less likely to cripple a limb or cause unconsciousness

**Restrictions:**
- None

---

### Fast Shot

You attack faster but less precisely.

**Effects:**
- All ranged weapon attacks cost **1 less Action Point**
- Targeted shots are not allowed
- No effect on Unarmed or Melee attacks

**Restrictions:**
- Animals cannot choose this trait

---

### Bloody Mess

Violence follows you everywhere.

**Effects:**
- No mechanical effect on combat outcomes
- Deaths around the character are dramatically violent

**Restrictions:**
- None

---

### Jinxed

Bad luck spreads around you.

**Effects:**
- Combat failures are **50% more likely** to become critical failures
- Affects:
  - The character
  - Party members
  - NPCs involved in combat

**Restrictions:**
- None

---

### Good Natured

You focused on people, not violence.

**Effects:**
- +20% to:
  - First Aid
  - Doctor
  - Speech
  - Barter
- −10% to starting combat skills:
  - Guns
  - Energy Weapons
  - Unarmed
  - Melee Weapons

**Notes:**
- This is a **one-time adjustment** during character creation

**Restrictions:**
- Animals and Robots cannot choose this trait

---

### Chem Reliant

You become addicted more easily, but recover faster.

**Effects:**
- Chance to become addicted is **doubled**
- Recovery time from chem effects is **halved**

**Restrictions:**
- Robots cannot choose this trait

---

### Chem Resistant

Chems affect you less.

**Effects:**
- Chem effects last **half as long**
- Chance of addiction is **reduced by 50%**

**Restrictions:**
- Robots cannot choose this trait

---

### Night Person

You function better at night.

**Effects:**
- From 0601–1800:
  - −1 Intelligence
  - −1 Perception
- From 1801–0600:
  - +1 Intelligence
  - +1 Perception

**Notes:**
- Bonuses and penalties cannot exceed racial maximums or minimums

- Roleplay effect: the character may feel more alert and energetic during night hours, less so during day
- The character keeps track of time of day and GM-adjudicated effects
**Restrictions:**
- Robots cannot choose this trait

---

### Skilled

You focus on improving skills rather than perks.

**Effects:**
- +5 Skill Points per level
- One-time +10% bonus to all skills at game start
- Perks are gained **one level later** than normal

**Restrictions:**
- Animals and Robots cannot choose this trait

---

### Gifted

You are naturally talented but undertrained.

**Effects:**
- +1 to all Primary Statistics
- −10% to all skills
- −5 Skill Points per level

**Restrictions:**
- Robots cannot choose this trait

---

### Sex Appeal

You are considered desirable to the opposite sex, but and envied by the same sex.

**Effects:**
- +1 Charisma when talking to the opposite sex
- +40% to Speech and barter when talking to the opposite sex
- -1 Charisma when talking to the same sex
- -40% to Speech and barter when talking to the same sex
- Roleplay effect
- The GM keeps track of interaction bonuses/defecits
**Restrictions:**
- Only Humans can choose this trait

---

### Glowing One

Radiation has permanently altered you.

**Effects:**
- +50% Radiation Resistance
- Light level modifiers in combat are ignored for:
  - The character
  - Enemies
- All nearby characters take **10 rads per hour**

**Restrictions:**
- Only Ghouls may choose this trait

---

### Tech Wizard

You are technologically gifted but visually impaired.

**Effects:**
- +15% to:
  - Science
  - Repair
  - Lockpick
- −1 Perception

**Restrictions:**
- Deathclaws and Dogs cannot choose this trait

---

### Fear the Reaper

You have escaped death… temporarily.

**Effects:**
- Perks are gained as if the character were Human
- Once per month:
  - Roll against Luck
  - Failure results in immediate death

**Restrictions:**
- Only Ghouls may choose this trait

---

## Implementation Notes

- Trait effects are applied **after** Primary Statistics and base skills are calculated
- Trait-based overrides (such as resetting resistances or AC behavior) must be enforced strictly
- Trait restrictions must be validated during character creation
- Some traits modify rules rather than numbers and require special handling in gameplay logic

This document is the authoritative reference for player traits.
