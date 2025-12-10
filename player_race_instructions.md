# Fallout: Thunderbirds — Player Race Instructions

This document defines **playable races**, their attribute limits, baseline resistances, and perk progression.

Race affects:

- Minimum and maximum values for Primary Statistics
- Built-in resistances and other passive traits
- How often perks are gained
- Which traits and perks are allowed (see traits/perks documents)
- Some narrative and cosmetic details (height, weight, appearance)

The character creation system **must enforce** racial minimums and maximums for all Primary Statistics.

---

## Race: Human

Your basic human. Two arms, two legs, two eyes — you and me.

Humans are the baseline from which other races deviate. They are flexible, widespread, and capable of using all normal armor and equipment designed for humans.

### Mechanical Effects

- **Attribute modifiers:**  
  - No bonuses or penalties to Primary Statistics
- **Resistances:**  
  - +30% Electricity Resistance
- **Perk progression:**  
  - Gain **1 perk every 3 levels**

Humans can use any “normal” human armor.  
(Additional armor restrictions or options are defined elsewhere if needed.)

### Typical Size

- **Weight:** ~110–280 pounds  
- **Height:** ~1.5–2.5 meters

These values are descriptive only and do not affect mechanics unless a specific rule says otherwise.

### Attribute Limits

The following are the minimum and maximum values for a Human’s Primary Statistics:

| Statistic | Minimum | Maximum |
|----------|--------:|--------:|
| STR      | 1       | 10      |
| PE       | 1       | 10      |
| EN       | 1       | 10      |
| CH       | 1       | 10      |
| IN       | 1       | 10      |
| AG       | 1       | 10      |
| LK       | 1       | 10      |

The character creator must prevent allocation outside these ranges.

---

## Race: Ghoul

Ghouls are humans who survived the bombs and were radically altered by intense radiation at a cellular level.

They are:

- Functionally immune to aging (extremely slow cellular mitosis)
- Visibly deformed: hanging skin, sunken eyes, warped features
- Often discolored (white, brown, green, yellow, etc.)
- Sometimes partially merged with plant life (moss, shrubs, etc.)

Ghouls are outcasts in most societies and often form their own settlements or live with tolerant humans and mutants. They require **a steady trickle of radiation** to remain healthy, and are commonly found near reactors, craters, and other irradiated locations.

Despite their appearance, their minds remain intact — they remember the world before the bombs and know they can never truly return to it.

### Mechanical Effects

- **Resistances:**
  - +80% Radiation Resistance (natural)
  - +30% Poison Resistance (natural)
- **Perk progression:**
  - Gain **1 perk every 4 levels**
- **Armor compatibility:**
  - Can wear **any armor that normal humans can wear**

> Ghouls still take normal damage from most sources:  
> disease, falls, bullets, etc. They are not “unkillable,” just long-lived.

### Typical Size

- **Weight:** ~80–160 pounds  
- **Height:** ~1.5–2.5 meters  

These values are descriptive only.

### Attribute Limits

Ghouls have different racial minimums and maximums than humans:

| Statistic | Minimum | Maximum |
|----------|--------:|--------:|
| STR      | 1       | 8       |
| PE       | 4       | 13      |
| EN       | 1       | 10      |
| CH       | 1       | 10      |
| IN       | 2       | 10      |
| AG       | 1       | 6       |
| LK       | 5       | 12      |

The character creator must enforce these ranges when assigning Primary Statistics and when applying effects that raise or lower attributes (traits, perks, etc.).

---

## Implementation Notes

- Racial attribute limits apply to:
  - Initial attribute allocation
  - Trait effects (e.g., Gifted, Small Frame, Night Person)
  - Perk effects that raise stats (e.g., Gain Strength, Gain Agility)
- Racial resistances are applied:
  - As **base values** before traits, perks, armor, chems, etc.
- Perk frequency is race-dependent:
  - Humans: every 3 levels  
  - Ghouls: every 4 levels  
  - Other races define their own progression

This document is the authoritative reference for race-based rules used in character creation.
