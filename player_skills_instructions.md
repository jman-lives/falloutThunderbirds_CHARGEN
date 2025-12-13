# Fallout: Thunderbirds — Player Skills Instructions

This document defines how player skills work, how tag skills are applied, and how base skill values are calculated during character creation.

This file serves as the authoritative reference for skills used by the character creation web application.

---

## Tag Skills

Every character begins play with **three Tag Skills**.

- A character must take **exactly three** tag skills.
- No more and no fewer may be selected.
- Some traits may grant an additional tag skill; otherwise, the limit is strict.

Tag skills represent a character’s gifted or specialized areas.

### Effects of Tag Skills

Each tag skill receives:

- An **immediate +20% bonus** to its base value
- **Double advancement speed** when skill points are spent

When spending skill points:
- Normal skills increase by **1% per point**
- Tag skills increase by **2% per point**

---

## Skill List and Base Values

Each skill has a **base percentage value**.

Base skill percentages are calculated:

- **Before** tag skill bonuses
- **Before** traits
- **Before** adding skill points

Skill points are **not** applied during character creation.  
They are added only when a character gains a level (see Advancement rules).

For examples below, an “average” character has **5 in every Primary Statistic**.

---

## Skill Descriptions and Base Formulas

### Guns

Use of pistols, rifles, shotguns, SMGs, and bows.

**Base Skill:**

Guns = 5% + (4 × AG)

Average starting value: **25%**

---

### Energy Weapons

Use of laser and plasma weapons.

**Base Skill:**

Energy Weapons = 0% + (2 × AG)

Average starting value: **10%**

---

### Unarmed

Hand-to-hand combat using fists, feet, and unarmed weapons.

**Base Skill:**

Unarmed = 30% + (2 × (AG + STR))

Average starting value: **50%**

---

### Melee Weapons

Use of knives, spears, clubs, and other melee weapons.

**Base Skill:**

Melee Weapons = 20% + (2 × (AG + STR))

Average starting value: **40%**

---

### Throwing

Use of thrown weapons such as knives, rocks, and grenades.

**Base Skill:**

Throwing = 0% + (4 × AG)

Average starting value: **20%**

---

### First Aid

Minor healing of wounds, cuts, and bruises.

**Base Skill:**

First Aid = 0% + (2 × (PE + EN))

Average starting value: **20%**

**Usage Rules:**
- Takes **1d10 minutes**
- Heals **1d10 HP**
- May be used **3 times per day**

---

### Doctor

Advanced healing of serious injuries and crippled limbs.

**Base Skill:**

Doctor = 5% + (PE + IN)

Average starting value: **15%**

**Usage Rules:**
- Takes **1 hour**
- Heals **2d10 HP**
- Can heal crippled limbs
- Cannot heal poison or radiation damage
- May be used **2 times per day**

---

### Sneak

Moving quietly and staying hidden.

**Base Skill:**

Sneak = 5% + (3 × AG)

Average starting value: **20%**

- Rolled when sneaking begins
- Rolled once per minute while sneaking

---

### Lockpick

Opening locks without keys.

**Base Skill:**

Lockpick = 10% + (PE + AG)

Average starting value: **20%**

- Normal and electronic locks exist
- Electronic locks require an electronic lockpick

---

### Steal

Removing items from people or objects without being noticed.

**Base Skill:**

Steal = 0% + (3 × AG)

Average starting value: **15%**

- Larger items are harder to steal
- Items being actively used cannot be stolen

---

### Traps

Setting, disarming, and handling traps and explosives.

**Base Skill:**

Traps = 10% + (PE + AG)

Average starting value: **20%**

---

### Science

Working with computers, electronics, and technology.

**Base Skill:**

Science = 0% + (4 × IN)

Average starting value: **20%**

- Can also be used to repair robots

---

### Repair

Fixing, sabotaging, or disabling mechanical devices.

**Base Skill:**

Repair = 0% + (3 × IN)

Average starting value: **15%**

- Can be used to repair robots

---

### Speech

Persuasion, deception, and dialogue.

**Base Skill:**

Speech = 0% + (5 × CH)

Average starting value: **35%**

---

### Barter

Trading and negotiating prices.

**Base Skill:**

Barter = 0% + (4 × CH)

Average starting value: **20%**

---

### Gambling

Games of chance and detecting rigged games.

**Base Skill:**

Gambling = 0% + (5 × LK)

Average starting value: **25%**

---

### Outdoorsman

Survival skills in hostile environments.

**Base Skill:**

Outdoorsman = 0% + (2 × (EN + IN))

Average starting value: **20%**

---

## Example: Assigning Tag Skills and Calculating Skills

Jack and Jane assign tag skills to their characters, **Harry** and **Maverick**.

### Tag Skill Selection

- Harry tags: **Unarmed**, **Throwing**, **Guns**
- Maverick tags: **Speech**, **Barter**, **Gambling**

### Final Skill Values

**Harry:**

Guns 37%  
Energy Weapons 16%  
Unarmed (tag) 80%  
Melee Weapons 50%  
Throwing (tag) 52%  
First Aid 26%  
Doctor 15%  
Sneak 29%  
Lockpick 23%  
Steal 24%  
Traps 23%  
Science 20%  
Repair 15%  
Pilot 26%  
Speech 26%  
Barter 16%  
Gambling 24%  
Outdoorsman 20%

**Maverick:**

Guns 25%  
Energy Weapons 10%  
Unarmed 48%  
Melee Weapons 38%  
Throwing 20%  
First Aid 22%  
Doctor 16%  
Sneak 20%  
Lockpick 21%  
Steal 15%  
Traps 21%  
Science 28%  
Repair 21%  
Pilot 22%  
Speech (tag) 55%  
Barter (tag) 48%  
Gambling (tag) 48%  
Outdoorsman 22%

---

## Implementation Notes

- Base skills must be calculated **before** tag bonuses
- Tag bonuses apply **once**, immediately after base calculation
- Skill points are not spent during character creation
- All derived skill values should update immediately when attributes or tag selections change

This document is the authoritative reference for player skills.
