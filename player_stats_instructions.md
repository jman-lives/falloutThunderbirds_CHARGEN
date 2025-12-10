# Fallout: Thunderbirds — Character Rules & Formulas

This document defines the core mechanical rules used by the Fallout: Thunderbirds character creator and web application.

All secondary statistics are derived from base attributes (SPECIAL), race, traits, and equipment using the formulas and tables defined below.

Unless explicitly stated otherwise, modifiers stack additively.

---

## Hit Points (HP)

Hit Points determine whether a character is alive or dead.

- Dead characters cannot be played or revived.
- Hit Points can be recovered through time, rest, chems, skills, or medical treatment.

### Base Hit Points (Level 1)

Let:
- `STR` = Strength
- `END` = Endurance

**Formula:**

BaseHP = 15 + (STR + 2 × END)

### Hit Points per Level

For each level beyond 1:

HPPerLevel = floor(3 + END / 2)

### Total Maximum Hit Points

Let:
- `LVL` = Character level (minimum 1)

MaxHP = BaseHP + (LVL − 1) × HPPerLevel

---

## Armor Class (AC)

Armor Class represents how difficult a character is to damage.

- Armor Class is measured as a **percentage (%)**.
- Higher Armor Class reduces incoming damage.

### Determining Armor Class

Let:
- `AGI` = Agility
- `ArmorAC` = Armor bonus

BaseAC = AGI  
TotalAC = AGI + ArmorAC

---

## Action Points (AP)

Action Points determine how many actions a character can take per combat turn.

### Common AP Costs

- Move 1 hex (1 meter): 1 AP  
- Reload weapon: 2 AP  
- Make an attack: 5 AP  

### Action Points by Agility

| Agility | AP |
|-------:|---:|
| 1 | 5 |
| 2–3 | 6 |
| 4–5 | 7 |
| 6–7 | 8 |
| 8–9 | 9 |
| 10+ | 10 |

---

## Carry Weight

Carry Weight determines how much equipment a character can carry.

Let:
- `STR` = Strength

CarryWeight = 25 + (25 × STR) lbs

---

## Melee Damage (MD)

Melee Damage applies to unarmed combat and melee weapons.

### Melee Damage by Strength

| Strength | MD |
|--------:|---:|
| 1–6 | 1 |
| 7 | 2 |
| 8 | 3 |
| 9 | 4 |
| 10 | 5 |
| 11 | 6 |
| 12+ | +1 per STR |

**Formula shortcut:**

MD = max(1, STR − 5)

---

## Poison Resistance (PR)

Poison Resistance represents a chance to completely negate poison effects.

Let:
- `END` = Endurance

PoisonResistance = 5 × END %

---

## Radiation Resistance (RR)

Radiation Resistance reduces incoming radiation exposure.

Let:
- `END` = Endurance

RadiationResistance = 2 × END %

Applied as a percentage reduction to incoming rads.

---

## Gas Resistance (GR)

Gas Resistance represents protection against chemical gas attacks.

- Derived exclusively from armor, race, and equipment.
- Attributes do not affect Gas Resistance.

### Gas Types

- **Inhaled Gasses** — must be breathed in
- **Contact Gasses** — affect exposed biological tissue

### Format

GR = Inhaled% / Contact%

Example:  
GR = 60 / 30

---

## Damage Resistance (DR)

Damage Resistance reduces damage by a percentage.

- Default value is 0%.
- Derived from armor, race, and perks.
- Tracked per damage type.

TotalDR = Sum of armor DR + racial DR

---

## Damage Threshold (DT)

Damage Threshold reduces damage by a flat amount before percentages apply.

- Characters have no DT unless wearing armor.
- Tracked per damage type.

### Damage Resolution Order

1. Apply Damage Threshold
2. Apply Damage Resistance
3. Apply remaining damage to HP

---

## Sequence

Sequence determines combat turn order.

Let:
- `PE` = Perception

Sequence = 2 × PE

Higher Sequence acts first.

---

## Healing Rate (HR)

Healing Rate determines natural HP recovery.

### Healing Rate by Endurance

| Endurance | HR |
|----------:|---:|
| 1–5 | 1 |
| 6–8 | 2 |
| 9–10 | 3 |
| 11+ | 4 |

### Healing Timing

- **Active:** HR HP per 24 hours
- **Resting:** HR HP per 6 hours

---

## Critical Chance (CC)

Critical Chance determines the base chance for a successful hit to become critical.

Let:
- `LUCK` = Luck

CriticalChance = LUCK %

Critical hits occur only on successful attacks.

---

## Calculating Secondary Statistics & Applying Modifiers

### Calculation Order

1. Assign base attributes (SPECIAL)
2. Calculate base secondary statistics
3. Apply racial modifiers
4. Apply trait modifiers
5. Apply equipment modifiers

Unless specified otherwise, all modifiers stack additively.

---

## Example: Applying Modifiers

Jack and Jane calculate secondary statistics for two characters: **Harry** and **Maverick**.

- HP: Harry 32, Maverick 27
- AC: Harry 8%, Maverick 5%
- AP: Harry 9, Maverick 7
- Carry Weight: Harry 200 lbs, Maverick 125 lbs
- Melee Damage: Harry 4 (Heavy-Handed), Maverick 1
- Poison Resistance: Harry 45%, Maverick 20%
- Radiation Resistance: Harry 60%, Maverick 8%
- Gas Resistance: Both 0 / 0
- Electricity Resistance: Maverick 30%, Harry 0%
- Sequence: Harry 10, Maverick 12
- Healing Rate: Both 1
- Critical Chance: Harry 6%, Maverick 7%

---

## Design Notes

- Percent-based and flat reductions are intentionally distinct.
- Resistances and thresholds are tracked per damage type.
- All derived stats should be recalculated immediately when attributes or modifiers change.

This document is the authoritative reference for the character creation system.
