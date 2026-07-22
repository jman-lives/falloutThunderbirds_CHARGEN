/**
 * npc-generator.js — Fallout: Thunderbirds GM Screen
 *
 * Generates a mechanically valid NPC character sheet given:
 *   race, faction, archetype (class), level
 *
 * All formulas sourced directly from script.js and advancement.js to
 * guarantee accuracy with the rest of the chargen system.
 *
 * Exposes: window.generateNPC({ name, race, faction, archetype, level })
 * Returns: a full character JSON object matching the existing schema.
 */

'use strict';

// ─── Stat Calculation Functions ────────────────────────────────────────────────
// Exact copies of the implementations in script.js / advancement.js

function _calcBaseHp(str, end) {
  return 15 + str + 2 * end;
}
function _calcHpPerLevel(end) {
  return Math.floor(3 + end / 2);
}
function _calcMaxHp(str, end, level) {
  const base = _calcBaseHp(str, end);
  return level <= 1 ? base : base + (level - 1) * _calcHpPerLevel(end);
}
// AP lookup — matches script.js calculateActionPoints exactly
function _calcAP(agi) {
  if (agi <= 0) return 0;
  if (agi <= 3) return 6;
  if (agi <= 5) return 7;
  if (agi <= 7) return 8;
  if (agi <= 9) return 9;
  return 10;
}
// Healing Rate lookup — matches script.js calculateHealingRate exactly
function _calcHR(end) {
  if (end <= 5) return 1;
  if (end <= 8) return 2;
  if (end <= 10) return 3;
  return 4;
}

// All 18 skill formulas — exact match to script.js calculateBaseSkills
function _calcBaseSkills(a) {
  const str = a.strength, per = a.perception, end = a.endurance,
        ch  = a.charisma, int = a.intelligence, ag = a.agility, lk = a.luck;
  return {
    guns:           5  + 4 * ag,
    energy_weapons: 0  + 2 * ag,
    unarmed:        30 + 2 * (ag + str),
    melee_weapons:  20 + 2 * (ag + str),
    throwing:       0  + 4 * ag,
    first_aid:      0  + 2 * (per + end),
    doctor:         5  + per + int,
    sneak:          5  + 3 * ag,
    lockpick:       10 + per + ag,
    steal:          0  + 3 * ag,
    traps:          10 + per + ag,
    science:        0  + 4 * int,
    repair:         0  + 3 * int,
    pilot:          0  + 2 * ag,
    speech:         0  + 5 * ch,
    barter:         0  + 4 * ch,
    gambling:       0  + 5 * lk,
    outdoorsman:    0  + 2 * (end + int),
  };
}

// Apply tag +20 and trait skill mods, then clamp 0–100
// Matches calculateFinalSkills in both script.js and advancement.js
function _applyTagAndTraitSkillMods(baseSkills, tagSkills, traits) {
  const TRAIT_SKILL_MODS = {
    good_natured: { first_aid:20, doctor:20, speech:20, barter:20,
                    guns:-10, energy_weapons:-10, unarmed:-10, melee_weapons:-10 },
    skilled:      { guns:10, energy_weapons:10, unarmed:10, melee_weapons:10, throwing:10,
                    first_aid:10, doctor:10, sneak:10, lockpick:10, steal:10, traps:10,
                    science:10, repair:10, pilot:10, speech:10, barter:10, gambling:10, outdoorsman:10 },
    gifted:       { guns:-10, energy_weapons:-10, unarmed:-10, melee_weapons:-10, throwing:-10,
                    first_aid:-10, doctor:-10, sneak:-10, lockpick:-10, steal:-10, traps:-10,
                    science:-10, repair:-10, pilot:-10, speech:-10, barter:-10, gambling:-10, outdoorsman:-10 },
    tech_wizard:  { science:15, repair:15 },
  };
  const skills = {};
  for (const sk of Object.keys(baseSkills)) {
    let v = baseSkills[sk];
    if (tagSkills[sk]) v += 20;
    for (const t of traits) {
      const m = TRAIT_SKILL_MODS[t];
      if (m && m[sk] !== undefined) v += m[sk];
    }
    skills[sk] = Math.max(0, Math.min(100, Math.round(v)));
  }
  return skills;
}

// Trait → attribute modifiers — matches calculateTraitAttributeModifiers in script.js
function _traitAttrMods(traits) {
  const m = { strength:0, perception:0, endurance:0, charisma:0, intelligence:0, agility:0, luck:0 };
  for (const t of traits) {
    if (t === 'small_frame')  m.agility      += 1;
    if (t === 'gifted')       for (const k of Object.keys(m)) m[k] += 1;
    if (t === 'tech_wizard')  m.perception   -= 1;
  }
  return m;
}

// Skill point cost per 1% advance — matches getSkillProgressionCost in advancement.js
function _skillCost(currentPct, isTagged) {
  const next = currentPct + 1;
  if (isTagged) {
    if (next <= 100) return 1;
    if (next <= 125) return 1;
    if (next <= 150) return 2;
    if (next <= 175) return 3;
    if (next <= 200) return 4;
    return 5;
  }
  if (next <= 100) return 1;
  if (next <= 125) return 2;
  if (next <= 150) return 3;
  if (next <= 175) return 4;
  if (next <= 200) return 5;
  return 6;
}

// % gained per 1 SP spend — matches getSkillGainPerSP in advancement.js
function _skillGain(currentPct, isTagged) {
  return (isTagged && currentPct < 100) ? 2 : 1;
}

// ─── XP Table ─────────────────────────────────────────────────────────────────
// Exact copy from advancement.js XP_TABLE
const _XP = {
  1:0,2:1000,3:3000,4:6000,5:10000,6:15000,7:21000,8:28000,9:36000,10:45000,
  11:55000,12:66000,13:78000,14:91000,15:105000,16:120000,17:136000,18:153000,
  19:171000,20:190000,21:210000,
};
function _xpForLevel(level) {
  if (level <= 21) return _XP[level] || 0;
  let xp = _XP[21];
  for (let i = 22; i <= level; i++) xp += 40000;
  return xp;
}

// ─── Racial Limits ─────────────────────────────────────────────────────────────
// Exact match to RACIAL_LIMITS in advancement.js
const RACIAL_LIMITS_GEN = {
  Human: {
    strength:{min:1,max:10}, perception:{min:1,max:10}, endurance:{min:1,max:10},
    charisma:{min:1,max:10}, intelligence:{min:1,max:10}, agility:{min:1,max:10}, luck:{min:1,max:10},
  },
  Ghoul: {
    strength:{min:1,max:8},  perception:{min:4,max:13}, endurance:{min:1,max:10},
    charisma:{min:1,max:10}, intelligence:{min:2,max:10}, agility:{min:1,max:6}, luck:{min:5,max:12},
  },
  'Super Mutants': {
    strength:{min:5,max:13}, perception:{min:1,max:11}, endurance:{min:4,max:11},
    charisma:{min:1,max:7},  intelligence:{min:1,max:11}, agility:{min:1,max:8}, luck:{min:1,max:10},
  },
};

// ─── Archetypes ────────────────────────────────────────────────────────────────
// Base attributes total 40 (base 35 + 5 character points).
// Values are pre-trait; traits are applied separately.
const ARCHETYPE_ATTRS = {
  soldier:  { strength:7, perception:7, endurance:7, charisma:4, intelligence:5, agility:6, luck:4 },
  sniper:   { strength:4, perception:8, endurance:5, charisma:4, intelligence:6, agility:8, luck:5 },
  brawler:  { strength:8, perception:5, endurance:8, charisma:3, intelligence:4, agility:7, luck:5 },
  medic:    { strength:4, perception:7, endurance:5, charisma:6, intelligence:8, agility:5, luck:5 },
  tech:     { strength:4, perception:6, endurance:5, charisma:4, intelligence:9, agility:6, luck:6 },
  diplomat: { strength:3, perception:5, endurance:4, charisma:9, intelligence:8, agility:5, luck:6 },
  thief:    { strength:4, perception:7, endurance:4, charisma:5, intelligence:6, agility:9, luck:5 },
  raider:   { strength:8, perception:6, endurance:7, charisma:3, intelligence:3, agility:8, luck:5 },
  heavy:    { strength:9, perception:5, endurance:8, charisma:3, intelligence:4, agility:6, luck:5 },
  scout:    { strength:5, perception:8, endurance:6, charisma:5, intelligence:5, agility:8, luck:3 },
};

// Primary attributes per archetype (these won't be randomly varied)
const ARCHETYPE_PRIMARIES = {
  soldier:  ['strength', 'perception', 'endurance'],
  sniper:   ['perception', 'agility'],
  brawler:  ['strength', 'endurance', 'agility'],
  medic:    ['intelligence', 'perception'],
  tech:     ['intelligence'],
  diplomat: ['charisma', 'intelligence'],
  thief:    ['agility', 'perception'],
  raider:   ['strength', 'agility'],
  heavy:    ['strength', 'endurance'],
  scout:    ['perception', 'agility'],
};

// Tag skill assignments per archetype — faction may override one
const ARCHETYPE_TAG_SKILLS = {
  soldier:  ['guns',          'first_aid',  'outdoorsman'],
  sniper:   ['guns',          'sneak',      'outdoorsman'],
  brawler:  ['unarmed',       'melee_weapons', 'first_aid'],
  medic:    ['first_aid',     'doctor',     'speech'],
  tech:     ['science',       'repair',     'lockpick'],
  diplomat: ['speech',        'barter',     'first_aid'],
  thief:    ['sneak',         'lockpick',   'steal'],
  raider:   ['guns',          'melee_weapons', 'throwing'],
  heavy:    ['guns',          'energy_weapons', 'first_aid'],
  scout:    ['sneak',         'outdoorsman', 'traps'],
};

// SP spending weights (higher number = more points invested)
const ARCHETYPE_SKILL_WEIGHTS = {
  soldier:  { guns:5, first_aid:3, outdoorsman:2, sneak:2, traps:1, repair:1 },
  sniper:   { guns:5, sneak:3, outdoorsman:3, traps:2, lockpick:1 },
  brawler:  { unarmed:5, melee_weapons:4, first_aid:2, throwing:1 },
  medic:    { first_aid:5, doctor:5, speech:2, science:2, outdoorsman:1 },
  tech:     { science:5, repair:5, lockpick:3, doctor:1, pilot:1 },
  diplomat: { speech:5, barter:5, first_aid:2, gambling:2, lockpick:1 },
  thief:    { sneak:5, lockpick:4, steal:4, traps:2, pilot:1 },
  raider:   { guns:4, melee_weapons:3, unarmed:2, throwing:2, sneak:1 },
  heavy:    { guns:5, energy_weapons:4, first_aid:2, repair:1 },
  scout:    { sneak:4, outdoorsman:5, traps:3, pilot:2, lockpick:1 },
};

// Curated trait pools — traits that fit this archetype's playstyle
// Only traits valid under normal rules; race-specific exclusions applied at generation time
const ARCHETYPE_TRAITS = {
  soldier:  ['finesse', 'fast_shot', 'skilled', 'bloody_mess'],
  sniper:   ['finesse', 'night_person', 'one_hander'],
  brawler:  ['heavy_handed', 'kamikaze', 'fast_metabolism'],
  medic:    ['fast_metabolism', 'skilled', 'good_natured'],
  tech:     ['tech_wizard', 'skilled', 'night_person'],
  diplomat: ['good_natured', 'skilled', 'sex_appeal'],
  thief:    ['small_frame', 'finesse', 'night_person'],
  raider:   ['kamikaze', 'heavy_handed', 'bloody_mess', 'fast_shot'],
  heavy:    ['heavy_handed', 'fast_metabolism'],
  scout:    ['small_frame', 'night_person', 'fast_metabolism'],
};

// ─── Perks ─────────────────────────────────────────────────────────────────────
// Curated NPC perk pool per archetype.
// Requirements are minimum attribute values (from the PERKS database in advancement.js).
const ARCHETYPE_PERK_POOL = {
  soldier: [
    { id: 'awareness',        name: 'Awareness',           minLevel:  3, attrReq: { perception:5 } },
    { id: 'toughness',        name: 'Toughness',           minLevel:  3, attrReq: { endurance:6 } },
    { id: 'more_criticals',   name: 'More Criticals',      minLevel:  6, attrReq: { luck:6 } },
    { id: 'dodger',           name: 'Dodger',              minLevel:  9, attrReq: { agility:4 } },
    { id: 'better_criticals', name: 'Better Criticals',    minLevel:  9, attrReq: { perception:6, luck:6, agility:4 } },
    { id: 'die_hard',         name: 'Die Hard',            minLevel: 12, attrReq: { endurance:5 } },
    { id: 'action_boy_girl',  name: 'Action Boy/Girl',     minLevel: 12, attrReq: { agility:5 } },
  ],
  sniper: [
    { id: 'earlier_sequence', name: 'Earlier Sequence',    minLevel:  3, attrReq: { perception:6 } },
    { id: 'awareness',        name: 'Awareness',           minLevel:  3, attrReq: { perception:5 } },
    { id: 'more_criticals',   name: 'More Criticals',      minLevel:  6, attrReq: { luck:6 } },
    { id: 'bonus_ranged_damage', name: 'Bonus Ranged Damage', minLevel: 6, attrReq: { agility:6, perception:6 } },
    { id: 'better_criticals', name: 'Better Criticals',    minLevel:  9, attrReq: { perception:6, luck:6, agility:4 } },
    { id: 'sniper',           name: 'Sniper',              minLevel: 12, attrReq: { perception:8, agility:6 } },
  ],
  brawler: [
    { id: 'bonus_hth_damage', name: 'Bonus HtH Damage',    minLevel:  3, attrReq: { agility:6, strength:6 } },
    { id: 'toughness',        name: 'Toughness',           minLevel:  3, attrReq: { endurance:6 } },
    { id: 'more_criticals',   name: 'More Criticals',      minLevel:  6, attrReq: { luck:6 } },
    { id: 'better_criticals', name: 'Better Criticals',    minLevel:  9, attrReq: { perception:6, luck:6, agility:4 } },
    { id: 'bonus_hth_attacks',name: 'Bonus HtH Attacks',   minLevel: 15, attrReq: { agility:6 } },
  ],
  medic: [
    { id: 'healer',           name: 'Healer',              minLevel:  3, attrReq: { perception:7, intelligence:5 } },
    { id: 'awareness',        name: 'Awareness',           minLevel:  3, attrReq: { perception:5 } },
    { id: 'faster_healing',   name: 'Faster Healing',      minLevel:  3, attrReq: { endurance:4 } },
    { id: 'living_anatomy',   name: 'Living Anatomy',      minLevel:  9, attrReq: { doctor:60 } },
    { id: 'lifegiver',        name: 'Lifegiver',           minLevel: 12, attrReq: { endurance:4 } },
  ],
  tech: [
    { id: 'educated',         name: 'Educated',            minLevel:  3, attrReq: { intelligence:6 } },
    { id: 'awareness',        name: 'Awareness',           minLevel:  3, attrReq: { perception:5 } },
    { id: 'ghost',            name: 'Ghost',               minLevel:  6, attrReq: { agility:6 } },
    { id: 'mr_fixit',         name: 'Mr. Fixit',           minLevel: 12, attrReq: {} },
    { id: 'master_thief',     name: 'Master Thief',        minLevel: 12, attrReq: { agility:4 } },
  ],
  diplomat: [
    { id: 'awareness',        name: 'Awareness',           minLevel:  3, attrReq: { perception:5 } },
    { id: 'educated',         name: 'Educated',            minLevel:  3, attrReq: { intelligence:6 } },
    { id: 'gambler',          name: 'Gambler',             minLevel:  6, attrReq: { luck:5 } },
    { id: 'speaker',          name: 'Speaker',             minLevel:  9, attrReq: { charisma:4 } },
    { id: 'negotiator',       name: 'Negotiator',          minLevel:  9, attrReq: { charisma:4 } },
  ],
  thief: [
    { id: 'earlier_sequence', name: 'Earlier Sequence',    minLevel:  3, attrReq: { perception:6 } },
    { id: 'thief_perk',       name: 'Thief',               minLevel:  3, attrReq: {} },
    { id: 'ghost',            name: 'Ghost',               minLevel:  6, attrReq: { agility:6 } },
    { id: 'pickpocket',       name: 'Pickpocket',          minLevel:  6, attrReq: { agility:8 } },
    { id: 'harmless',         name: 'Harmless',            minLevel:  9, attrReq: { luck:6 } },
    { id: 'master_thief',     name: 'Master Thief',        minLevel: 12, attrReq: { agility:4 } },
  ],
  raider: [
    { id: 'earlier_sequence', name: 'Earlier Sequence',    minLevel:  3, attrReq: { perception:6 } },
    { id: 'toughness',        name: 'Toughness',           minLevel:  3, attrReq: { endurance:6 } },
    { id: 'more_criticals',   name: 'More Criticals',      minLevel:  6, attrReq: { luck:6 } },
    { id: 'bone_head',        name: 'Bone Head',           minLevel:  7, attrReq: { strength:7 } },
    { id: 'action_boy_girl',  name: 'Action Boy/Girl',     minLevel: 12, attrReq: { agility:5 } },
  ],
  heavy: [
    { id: 'toughness',        name: 'Toughness',           minLevel:  3, attrReq: { endurance:6 } },
    { id: 'bone_head',        name: 'Bone Head',           minLevel:  7, attrReq: { strength:7 } },
    { id: 'bonus_ranged_damage', name: 'Bonus Ranged Damage', minLevel: 6, attrReq: { agility:6, perception:6 } },
    { id: 'more_criticals',   name: 'More Criticals',      minLevel:  6, attrReq: { luck:6 } },
    { id: 'die_hard',         name: 'Die Hard',            minLevel: 12, attrReq: { endurance:5 } },
  ],
  scout: [
    { id: 'earlier_sequence', name: 'Earlier Sequence',    minLevel:  3, attrReq: { perception:6 } },
    { id: 'awareness',        name: 'Awareness',           minLevel:  3, attrReq: { perception:5 } },
    { id: 'ghost',            name: 'Ghost',               minLevel:  6, attrReq: { agility:6 } },
    { id: 'bonus_move',       name: 'Bonus Move',          minLevel:  6, attrReq: { agility:5 } },
    { id: 'animal_friend',    name: 'Animal Friend',       minLevel:  9, attrReq: { intelligence:5 } },
  ],
};

// Secondary stat bonuses granted by perks
const PERK_SECONDARY_EFFECTS = {
  lifegiver:          { hpBonusPerLevel:4 },
  educated:           { skillPointsPerLevel:2 },
  faster_healing:     { healingRateBonus:2 },
  toughness:          { damageResistance:10 },
  dodger:             { armorClassBonus:5 },
  action_boy_girl:    { actionPointBonus:1 },
  earlier_sequence:   { sequenceBonus:2 },
  more_criticals:     { criticalChanceBonus:5 },
  bonus_hth_damage:   { meleeDamageBonus:2 },
};

// ─── Faction Profiles ─────────────────────────────────────────────────────────
// faction.tagOverride: replace one archetype tag skill with a faction-specific one
// armorByTier[0-3]: armor for levels 1-4, 5-9, 10-14, 15+
// weaponByArchetype: weapon options per archetype key (or 'default')
const FACTION_PROFILES = {
  'NCR': {
    preferredArchetypes: ['soldier', 'sniper', 'medic', 'scout'],
    tagOverride: null,
    // Ranks by level bracket: 1-4, 5-9, 10-14, 15-19, 20+
    ranks: ['Trooper', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain'],
    armorByTier: ['Brahmin-Hide Armor', 'NCR Trooper Armor', 'NCR Ranger Combat Armor', 'NCR Ranger Combat Armor'],
    weaponByArchetype: {
      soldier:  ['Service Rifle', '.223 Pistol', '9mm Pistol'],
      sniper:   ['Hunting Rifle', 'Sniper Rifle', 'Anti-Materiel Rifle'],
      medic:    ['.223 Pistol', '9mm Pistol'],
      heavy:    ['Light Support Weapon', 'Minigun', 'Grenade Launcher'],
      scout:    ['Hunting Rifle', 'Service Rifle', '.357 Magnum'],
      default:  ['.223 Pistol', 'Service Rifle'],
    },
  },
  'Brotherhood of Steel': {
    preferredArchetypes: ['soldier', 'tech', 'heavy', 'medic'],
    tagOverride: { replaceTag: 'guns', withTag: 'energy_weapons' },
    ranks: ['Initiate', 'Squire', 'Knight', 'Paladin', 'Elder'],
    armorByTier: ['Brotherhood Scribe Robe', 'Combat Armor', 'Power Armor', 'T-51b Power Armor'],
    weaponByArchetype: {
      soldier:  ['Laser Rifle', 'Laser Pistol', 'Gatling Laser'],
      tech:     ['Laser Pistol', 'Plasma Pistol', 'Wattz 1000 Laser Pistol'],
      heavy:    ['Plasma Rifle', 'Gatling Laser', 'Plasma Caster'],
      medic:    ['Laser Pistol', '10mm Pistol'],
      default:  ['Laser Pistol', 'Laser Rifle'],
    },
  },
  'Raiders': {
    preferredArchetypes: ['raider', 'brawler', 'soldier', 'heavy'],
    tagOverride: null,
    ranks: ['Punk', 'Raider', 'Veteran Raider', 'Warlord', 'Raider Boss'],
    armorByTier: ['Leather Jacket', 'Raider Armor', 'Spiked Leather Armor', 'Metal Armor'],
    weaponByArchetype: {
      raider:   ['10mm Pistol', 'Knife', 'Pipe Rifle', 'Sawed-Off Shotgun'],
      brawler:  ['Brass Knuckles', 'Knife', 'Crowbar', 'Lead Pipe'],
      soldier:  ['Sawed-Off Shotgun', '10mm SMG', 'Combat Shotgun'],
      heavy:    ['Flamer', 'Minigun', 'Rocket Launcher'],
      default:  ['10mm Pistol', 'Knife', 'Tire Iron'],
    },
  },
  'Vault Dwellers': {
    preferredArchetypes: ['soldier', 'medic', 'tech', 'diplomat'],
    tagOverride: null,
    ranks: ['Resident', 'Overseer Aide', 'Security Officer', 'Chief Officer', 'Overseer'],
    armorByTier: ['Vault Suit', 'Vault Security Armor', 'Metal Armor', 'Combat Armor'],
    weaponByArchetype: {
      soldier:  ['10mm Pistol', '10mm SMG', '.223 Pistol'],
      medic:    ['10mm Pistol', '.32 Pistol'],
      tech:     ['Laser Pistol', '10mm Pistol'],
      diplomat: ['10mm Pistol', '.32 Pistol'],
      default:  ['10mm Pistol', '.223 Pistol'],
    },
  },
  'Super Mutants': {
    preferredArchetypes: ['brawler', 'heavy', 'raider', 'soldier'],
    tagOverride: null,
    ranks: ['Runt', 'Brute', 'Master Brute', 'Super Mutant Master', 'Overlord'],
    armorByTier: ['None', 'Torn Metal Plates', 'Metal Armor', 'Metal Armor Mk II'],
    weaponByArchetype: {
      brawler:  ['Super Sledge', 'Sledgehammer', 'Power Fist'],
      heavy:    ['Minigun', 'Rocket Launcher', 'Flamer', 'M60'],
      raider:   ['Hunting Rifle', '.308 Rifle', 'Assault Rifle'],
      soldier:  ['Assault Rifle', 'Combat Shotgun', 'Hunting Rifle'],
      default:  ['Super Sledge', 'Minigun'],
    },
  },
  'Enclave': {
    preferredArchetypes: ['soldier', 'heavy', 'tech', 'sniper'],
    tagOverride: { replaceTag: 'guns', withTag: 'energy_weapons' },
    ranks: ['Soldier', 'Sergeant', 'Captain', 'Colonel', 'President\'s Guard'],
    armorByTier: ['Enclave Officer Uniform', 'Enclave Power Armor', 'Advanced Power Armor', 'Advanced Power Armor Mk II'],
    weaponByArchetype: {
      soldier:  ['Plasma Pistol', 'Laser Rifle', 'Plasma Rifle'],
      heavy:    ['Plasma Rifle', 'Flamer', 'Gatling Laser'],
      tech:     ['Plasma Pistol', 'Laser Pistol', 'Mesmetron'],
      sniper:   ['Laser Rifle', 'Sniper Rifle', 'Plasma Rifle'],
      default:  ['Plasma Pistol', 'Laser Rifle'],
    },
  },
  'Followers of the Apocalypse': {
    preferredArchetypes: ['medic', 'diplomat', 'tech', 'scout'],
    tagOverride: null,
    ranks: ['Volunteer', 'Aid Worker', 'Field Medic', 'Doctor', 'Senior Physician'],
    armorByTier: ['Follower Robe', 'Leather Jacket', 'Leather Armor', 'Combat Leather Jacket'],
    weaponByArchetype: {
      medic:    ['10mm Pistol', '.32 Pistol', 'Needler Pistol'],
      diplomat: ['10mm Pistol', '.32 Pistol'],
      tech:     ['Laser Pistol', '10mm Pistol'],
      scout:    ['.32 Pistol', 'Hunting Rifle'],
      default:  ['10mm Pistol'],
    },
  },
  'Talon Company': {
    preferredArchetypes: ['soldier', 'sniper', 'heavy', 'brawler'],
    tagOverride: null,
    ranks: ['Mercenary', 'Talon Operative', 'Talon Veteran', 'Talon Commander', 'Talon Mastermind'],
    armorByTier: ['Leather Armor', 'Metal Armor', 'Combat Armor', 'Combat Armor Mk II'],
    weaponByArchetype: {
      soldier:  ['Assault Rifle', '10mm SMG', 'Combat Shotgun', '.308 Rifle'],
      sniper:   ['Hunting Rifle', 'Sniper Rifle', 'Anti-Materiel Rifle'],
      heavy:    ['Minigun', 'Rocket Launcher', 'Flamer'],
      brawler:  ['Brass Knuckles', 'Combat Knife', 'Ripper'],
      default:  ['Assault Rifle', 'Combat Shotgun'],
    },
  },
  'Gunners': {
    preferredArchetypes: ['soldier', 'heavy', 'sniper', 'thief'],
    tagOverride: null,
    ranks: ['Private', 'Corporal', 'Sergeant', 'Major', 'General'],
    armorByTier: ['Leather Armor', 'Metal Armor', 'Combat Armor', 'Combat Armor Mk II'],
    weaponByArchetype: {
      soldier:  ['Assault Rifle', '.44 Magnum', 'Combat Shotgun', '10mm SMG'],
      sniper:   ['Hunting Rifle', 'Sniper Rifle', '.308 Sniper Rifle'],
      heavy:    ['Minigun', 'Light Support Weapon', 'Fat Man'],
      thief:    ['.44 Magnum', '10mm Pistol', 'Silenced 10mm Pistol'],
      default:  ['Assault Rifle', '.44 Magnum'],
    },
  },
  'Institute': {
    preferredArchetypes: ['tech', 'medic', 'soldier', 'diplomat'],
    tagOverride: { replaceTag: 'guns', withTag: 'energy_weapons' },
    ranks: ['Division Scientist', 'Senior Scientist', 'Director\'s Aide', 'Division Director', 'Director'],
    armorByTier: ['Institute Division Coat', 'Institute Lab Coat', 'Institute Uniform', 'Institute Advanced Armor'],
    weaponByArchetype: {
      tech:     ['Synth Relay Grenade', 'Laser Pistol', 'Plasma Pistol'],
      soldier:  ['Laser Pistol', 'Institute Laser Rifle', 'Plasma Pistol'],
      medic:    ['Laser Pistol', 'Needler', '10mm Pistol'],
      diplomat: ['10mm Pistol', 'Laser Pistol'],
      default:  ['Laser Pistol', 'Plasma Pistol'],
    },
  },
  'Minutemen': {
    preferredArchetypes: ['soldier', 'scout', 'medic', 'heavy'],
    tagOverride: null,
    ranks: ['Settler', 'Minuteman', 'Corporal', 'Sergeant', 'General'],
    armorByTier: ['Leather Jacket', 'Leather Armor', 'Combat Leather Jacket', 'Combat Armor'],
    weaponByArchetype: {
      soldier:  ['Hunting Rifle', '.357 Magnum', 'Laser Musket', 'Pipe Rifle'],
      scout:    ['Hunting Rifle', 'Pipe Rifle', '.357 Magnum'],
      medic:    ['.357 Magnum', 'Hunting Rifle', '.32 Pistol'],
      heavy:    ['Minigun', 'Rocket Launcher', 'Laser Musket'],
      default:  ['Hunting Rifle', 'Laser Musket'],
    },
  },
  "Caesar's Legion": {
    preferredArchetypes: ['brawler', 'soldier', 'scout', 'heavy'],
    tagOverride: { replaceTag: 'guns', withTag: 'melee_weapons' },
    ranks: ['Recruit', 'Recruit Legionary', 'Legionary', 'Veteran Legionary', 'Centurion'],
    armorByTier: ['Recruit Armor', 'Legion Armor', 'Veteran Legion Armor', 'Centurion Armor'],
    weaponByArchetype: {
      brawler:  ['Machete', 'Gladius', 'Ripper', 'Bumper Sword'],
      soldier:  ['Machete', 'Spear', 'Throwing Knife', 'Ballistic Fist'],
      scout:    ['Throwing Knife', 'Spear', 'Hunting Rifle'],
      heavy:    ['Ballistic Fist', 'Ripper', 'Super Sledge'],
      default:  ['Machete', 'Spear'],
    },
  },
  'Custom': {
    preferredArchetypes: ['soldier'],
    tagOverride: null,
    ranks: ['Recruit', 'Member', 'Veteran', 'Officer', 'Leader'],
    armorByTier: ['Leather Jacket', 'Leather Armor', 'Metal Armor', 'Combat Armor'],
    weaponByArchetype: { default: ['10mm Pistol', 'Hunting Rifle'] },
  },
};

const DEFAULT_FACTION_PROFILE = {
  preferredArchetypes: ['soldier'],
  tagOverride: null,
  armorByTier: ['Leather Jacket', 'Leather Armor', 'Metal Armor', 'Combat Armor'],
  weaponByArchetype: { default: ['10mm Pistol', 'Hunting Rifle'] },
};

// ─── Name Generator ───────────────────────────────────────────────────────────
const _FIRST_NAMES = {
  m: ['Ace','Brock','Buck','Cage','Cole','Cutter','Dex','Dusty','Flint','Gage',
      'Grim','Gravel','Hawk','Jake','Kane','Mac','Nash','Reno','Rex','Rock',
      'Sal','Slade','Snake','Tex','Vic','Wade'],
  f: ['Ash','Cass','Cora','Dawn','Eve','Hope','Jesse','June','Kate','Lark',
      'Lea','Mira','Nova','Pearl','Ray','Ruby','Sage','Steel','Storm','Sunny',
      'Tess','Vera','Reed','Max'],
};
const _LAST_NAMES = [
  'Ash','Blake','Burns','Cole','Cross','Dart','Ford','Grim','Hart','Kane',
  'Kirk','Morse','Nash','Razor','Ridge','Rush','Sand','Slade','Stone','Storm',
  'Vale','Wade','Wolf','Holt','Pike','Cross','Cain',
];

function _rng(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _generateName() {
  const g = Math.random() < 0.5 ? 'm' : 'f';
  return `${_rng(_FIRST_NAMES[g])} ${_rng(_LAST_NAMES)}`;
}

// ─── Generation Helpers ───────────────────────────────────────────────────────

function _clampToRace(attrs, race) {
  const limits = RACIAL_LIMITS_GEN[race] || RACIAL_LIMITS_GEN.Human;
  const result = { ...attrs };
  for (const k of Object.keys(result)) {
    const l = limits[k];
    if (l) result[k] = Math.max(l.min, Math.min(l.max, result[k]));
  }
  return result;
}

function _buildAttributes(archetype, race) {
  const base = { ...(ARCHETYPE_ATTRS[archetype] || ARCHETYPE_ATTRS.soldier) };
  const primaries = ARCHETYPE_PRIMARIES[archetype] || [];

  // Apply small random ±1 variation to non-primary, non-critical attributes
  // This keeps NPCs feeling distinct while maintaining archetype identity
  for (const k of Object.keys(base)) {
    if (!primaries.includes(k) && base[k] >= 3 && base[k] <= 8) {
      const roll = Math.random();
      if (roll < 0.25)      base[k] += 1;
      else if (roll < 0.50) base[k] -= 1;
      // else: no change
    }
  }

  return _clampToRace(base, race);
}

function _selectTraits(archetype, race) {
  const pool = (ARCHETYPE_TRAITS[archetype] || []).filter(t => {
    // Exclude race-specific traits for wrong races
    if (race !== 'Ghoul' && ['glowing_one', 'fear_the_reaper'].includes(t)) return false;
    if (race === 'Ghoul'  && ['sex_appeal'].includes(t)) return false;
    return true;
  });
  // 35% = 0 traits, 45% = 1 trait, 20% = 2 traits
  const count = Math.random() < 0.35 ? 0 : Math.random() < 0.69 ? 1 : 2;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function _buildTagSkills(archetype, faction) {
  const tags = [...(ARCHETYPE_TAG_SKILLS[archetype] || ['guns', 'first_aid', 'outdoorsman'])];
  const profile = FACTION_PROFILES[faction] || DEFAULT_FACTION_PROFILE;
  if (profile.tagOverride) {
    const { replaceTag, withTag } = profile.tagOverride;
    const idx = tags.indexOf(replaceTag);
    // Only replace if we haven't already assigned this skill as a tag
    if (idx !== -1 && !tags.includes(withTag)) tags[idx] = withTag;
  }
  const obj = {};
  for (const sk of tags) obj[sk] = true;
  return obj;
}

// Count total perks earned up to given level
// Humans: every 3 levels (3,6,9...); Ghouls: every 4 levels (4,8,12...)
// Skilled trait delays perk gain by +1 to the frequency
function _countTotalPerks(level, race, traits) {
  let freq = race === 'Ghoul' ? 4 : 3;
  if (traits.includes('skilled')) freq += 1;
  let count = 0;
  for (let i = 1; i <= level; i++) {
    if (i % freq === 0) count++;
  }
  return count;
}

function _checkPerkEligible(perk, level, effectiveAttrs, finalSkills) {
  if (level < perk.minLevel) return false;
  for (const [attr, req] of Object.entries(perk.attrReq || {})) {
    // Attribute requirements
    const val = effectiveAttrs[attr] !== undefined
      ? effectiveAttrs[attr]
      : (finalSkills[attr] || 0); // fallback for skill-based requirements like doctor:60
    const reqVal = typeof req === 'object' ? (req.min || 0) : req;
    if (val < reqVal) return false;
  }
  return true;
}

function _selectPerks(level, race, archetype, effectiveAttrs, finalSkills, traits) {
  const totalPerks = _countTotalPerks(level, race, traits);
  if (totalPerks <= 0) return [];

  const pool = [...(ARCHETYPE_PERK_POOL[archetype] || ARCHETYPE_PERK_POOL.soldier)];
  const selected = [];
  const usedIds = new Set();

  for (const perk of pool) {
    if (selected.length >= totalPerks) break;
    if (usedIds.has(perk.id)) continue;
    if (_checkPerkEligible(perk, level, effectiveAttrs, finalSkills)) {
      selected.push({ id: perk.id, rank: 1, modifiedAtLevel: perk.minLevel });
      usedIds.add(perk.id);
    }
  }

  // Pad remaining slots with Awareness (universally accessible at level 3, PE 5)
  while (selected.length < totalPerks && !usedIds.has('awareness')) {
    if (level >= 3 && (effectiveAttrs.perception || 0) >= 5) {
      selected.push({ id: 'awareness', rank: 1, modifiedAtLevel: 3 });
      usedIds.add('awareness');
    } else {
      break;
    }
  }

  return selected;
}

function _buildPerkEffects(selectedPerks) {
  const effects = {
    hpBonusPerLevel:     0,
    skillPointsPerLevel: 0,
    skillBonuses:        {},
    attributeBonus:      {},
    damageResistance:    0,
    sequenceBonus:       0,
    actionPointBonus:    0,
    meleeDamageBonus:    0,
    criticalChanceBonus: 0,
    healingRateBonus:    0,
    armorClassBonus:     0,
  };
  for (const p of selectedPerks) {
    const eff = PERK_SECONDARY_EFFECTS[p.id];
    if (!eff) continue;
    for (const [k, v] of Object.entries(eff)) {
      if (typeof effects[k] === 'number') effects[k] += v * (p.rank || 1);
    }
  }
  return effects;
}

// Total accumulated skill points from level 2 through `level`
// Formula: (5 + 2×IN) per level, modified by traits
// Matches calculateSkillPointsGain in advancement.js
function _calcTotalSP(level, intelligence, traits) {
  let spPerLevel = 5 + 2 * intelligence;
  if (traits.includes('skilled')) spPerLevel += 5;
  if (traits.includes('gifted'))  spPerLevel -= 5;
  return Math.max(0, spPerLevel) * Math.max(0, level - 1);
}

// Simulate SP spending: randomly distribute available SP across archetype-priority skills
// Uses exact cost/gain functions from advancement.js to respect all brackets
function _spendSkillPoints(startingSkills, tagSkillObj, totalSP, archetype, level) {
  const skills = { ...startingSkills };
  const weights = { ...(ARCHETYPE_SKILL_WEIGHTS[archetype] || ARCHETYPE_SKILL_WEIGHTS.soldier) };
  const allSkills = Object.keys(skills);

  // Soft caps by level tier — prevents unrealistically high NPCs at low levels
  const levelCap = level <= 4 ? 100 : level <= 9 ? 130 : level <= 14 ? 160 : 200;

  let remaining = totalSP;

  while (remaining > 0) {
    // Build eligible skill list: only skills below the level cap that have weight
    const candidates = allSkills.filter(sk => {
      const cap = (weights[sk] || 0) > 0 ? levelCap : Math.min(levelCap, 90);
      return skills[sk] < cap;
    });
    if (!candidates.length) break;

    // Weighted random skill selection
    const totalW = candidates.reduce((s, sk) => s + (weights[sk] || 0.3), 0);
    let r = Math.random() * totalW;
    let chosen = candidates[0];
    for (const sk of candidates) {
      r -= (weights[sk] || 0.3);
      if (r <= 0) { chosen = sk; break; }
    }

    const isTagged = !!tagSkillObj[chosen];
    const cost     = _skillCost(skills[chosen], isTagged);
    const gain     = _skillGain(skills[chosen], isTagged);

    if (remaining >= cost) {
      skills[chosen] = Math.min(levelCap, skills[chosen] + gain);
      remaining -= cost;
    } else {
      break; // Can't afford any more increments
    }
  }

  // Final clamp
  for (const sk of allSkills) skills[sk] = Math.max(0, Math.min(200, skills[sk]));
  return skills;
}

// Armor pools by weight class
const ARMOR_BY_CLASS = {
  light:  ['Leather Armor', 'Leather Jacket', 'Road Leathers', 'Vault Suit'],
  medium: ['Metal Armor', 'Combat Armor', 'Leather Armor Mk II', 'Raider Armor'],
  heavy:  ['Combat Armor Mk II', 'Metal Armor Mk II', 'Tesla Armor', 'Power Armor'],
};

const ARMOR_AC_BONUS_BY_CLASS = {
  light: 2,
  medium: 4,
  heavy: 6,
};

function _armorClassFromArmor(armorName, armorType) {
  if (armorType && ARMOR_AC_BONUS_BY_CLASS[armorType]) {
    return ARMOR_AC_BONUS_BY_CLASS[armorType];
  }

  if (!armorName) return 0;
  if (ARMOR_BY_CLASS.light.includes(armorName)) return ARMOR_AC_BONUS_BY_CLASS.light;
  if (ARMOR_BY_CLASS.medium.includes(armorName)) return ARMOR_AC_BONUS_BY_CLASS.medium;
  if (ARMOR_BY_CLASS.heavy.includes(armorName)) return ARMOR_AC_BONUS_BY_CLASS.heavy;
  return 0;
}

function _buildEquipment(faction, archetype, level, armorType) {
  const profile = FACTION_PROFILES[faction] || DEFAULT_FACTION_PROFILE;
  const tier = level <= 4 ? 0 : level <= 9 ? 1 : level <= 14 ? 2 : 3;

  let armor;
  if (armorType && ARMOR_BY_CLASS[armorType]) {
    // Pick a random armor from the specified class
    armor = _rng(ARMOR_BY_CLASS[armorType]);
  } else {
    armor = profile.armorByTier[Math.min(tier, profile.armorByTier.length - 1)];
  }
  const wPool  = profile.weaponByArchetype[archetype] || profile.weaponByArchetype['default'] || ['10mm Pistol'];
  const weapon = _rng(wPool);

  const items = {};
  if (weapon && weapon !== 'Fist' && weapon !== 'None') items[weapon] = 1;
  if (armor  && armor  !== 'None') items[armor] = 1;

  // Basic medical supplies scaled to level
  items['Stimpak'] = Math.max(1, Math.floor(level / 4));
  if (level >= 5) items['Rad-Away'] = 1;

  const totalWeight = Object.keys(items).length * 6;
  const totalCost   = level * 120;

  return { items, totalCost, totalWeight };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Generate a mechanically valid NPC character sheet.
 * @param {object} config
 * @param {string} config.name      — NPC name (auto-generated if blank)
* @param {string} config.race      — 'Human' | 'Ghoul' | 'Super Mutants'
 * @param {string} config.faction   — faction name (see FACTION_PROFILES keys)
 * @param {string} config.archetype — archetype key (soldier, sniper, brawler, etc.)
 * @param {number} config.level     — character level (1–30)
 * @returns {object} Full character JSON matching the existing schema
 */
function generateNPC({ name, race, faction, archetype, level, sex, age, armor }) {
  race      = race      || 'Human';
  faction   = faction   || 'Custom';
  archetype = archetype || 'soldier';
  level     = Math.max(1, Math.min(30, parseInt(level, 10) || 5));

  // ── Step 1: Base attributes from archetype, with minor random variation ──
  const baseAttrs = _buildAttributes(archetype, race);

  // ── Step 2: Select traits ──
  const selectedTraits = _selectTraits(archetype, race);

  // ── Step 3: Apply trait attribute modifiers → effective attributes ──
  const traitMods = _traitAttrMods(selectedTraits);
  const effectiveAttrs = {};
  for (const k of Object.keys(baseAttrs)) {
    effectiveAttrs[k] = Math.max(1, baseAttrs[k] + (traitMods[k] || 0));
  }
  // Re-clamp to racial limits after trait mods
  const limits = RACIAL_LIMITS_GEN[race] || RACIAL_LIMITS_GEN.Human;
  for (const k of Object.keys(effectiveAttrs)) {
    const l = limits[k];
    if (l) effectiveAttrs[k] = Math.max(l.min, Math.min(l.max, effectiveAttrs[k]));
  }

  // ── Step 4: Tag skills (archetype + faction override) ──
  const tagSkills = _buildTagSkills(archetype, faction);

  // ── Step 5: Base skills → apply tag bonuses + trait skill mods ──
  const rawBase       = _calcBaseSkills(effectiveAttrs);
  const startSkills   = _applyTagAndTraitSkillMods(rawBase, tagSkills, selectedTraits);

  // ── Step 6: Spend accumulated skill points (randomised within archetype priorities) ──
  const totalSP       = _calcTotalSP(level, effectiveAttrs.intelligence, selectedTraits);
  const finalSkills   = _spendSkillPoints(startSkills, tagSkills, totalSP, archetype, level);

  // ── Step 7: Perks ──
  const selectedPerks = _selectPerks(level, race, archetype, effectiveAttrs, finalSkills, selectedTraits);
  const perkEffects   = _buildPerkEffects(selectedPerks);

  // ── Step 8: Secondary stats ──
  const str = effectiveAttrs.strength,    per = effectiveAttrs.perception;
  const end = effectiveAttrs.endurance,   agi = effectiveAttrs.agility;
  const lk  = effectiveAttrs.luck;

  // HP — uses exact calculateMaxHp formula from script.js, with perk Lifegiver bonus
  const baseHp      = _calcBaseHp(str, end);
  const hpPerLevel  = _calcHpPerLevel(end) + (perkEffects.hpBonusPerLevel || 0);
  const hitPoints   = baseHp + Math.max(0, level - 1) * hpPerLevel;

  // Sequence = 2×PE (+ Kamikaze +5) + Earlier Sequence perk
  let sequence = 2 * per;
  if (selectedTraits.includes('kamikaze')) sequence += 5;
  sequence += (perkEffects.sequenceBonus || 0);

  // AC — Kamikaze removes AGI contribution entirely
  let armorClass = selectedTraits.includes('kamikaze') ? 0 : agi;
  armorClass += (perkEffects.armorClassBonus || 0);

  // Melee Damage = max(1, STR-5) + Heavy Handed +4 + perk bonus
  let meleeDamage = Math.max(1, str - 5);
  if (selectedTraits.includes('heavy_handed')) meleeDamage += 4;
  meleeDamage += (perkEffects.meleeDamageBonus || 0);

  let actionPoints = _calcAP(agi) + (perkEffects.actionPointBonus || 0);

  let healingRate = _calcHR(end);
  if (selectedTraits.includes('fast_metabolism')) healingRate += 2;
  healingRate += (perkEffects.healingRateBonus || 0);

  let criticalChance = lk;
  if (selectedTraits.includes('finesse')) criticalChance += 10;
  criticalChance += (perkEffects.criticalChanceBonus || 0);

  const carryWeight = selectedTraits.includes('small_frame') ? 15 * str : 25 + 25 * str;

  // Resistances — base from attributes, then racial, then trait mods
  let poisonResist = 5 * end;
  let radResist    = 2 * end;
  let elecResist   = 0;

  if (race === 'Ghoul') {
    radResist    += 80;
    poisonResist += 30;
  } else {
    elecResist = 30; // Human: +30% Electricity Resist
  }

  if (selectedTraits.includes('fast_metabolism')) {
    poisonResist = race === 'Ghoul' ? 30 : 0;
    radResist    = race === 'Ghoul' ? 80 : 0;
  }
  if (selectedTraits.includes('glowing_one')) radResist = Math.min(100, radResist + 50);

  // ── Step 8b: Equipment and armor-derived defense bonus ──
  const equipment = _buildEquipment(faction, archetype, level, armor || null);
  const equippedArmorName = equipment?.items
    ? Object.keys(equipment.items).find(k =>
        k.toLowerCase().includes('armor') ||
        k.toLowerCase().includes('jacket') ||
        k.toLowerCase().includes('suit') ||
        k.toLowerCase().includes('robe')
      ) || ''
    : '';
  const armorClassBonusFromArmor = _armorClassFromArmor(equippedArmorName, armor || null);
  armorClass += armorClassBonusFromArmor;

  const stats = {
    Hit_Points:        hitPoints,
    Armor_Class:       Math.max(0, armorClass),
    Action_Points:     actionPoints,
    Carry_Weight:      carryWeight,
    Melee_Damage:      meleeDamage,
    Poison_Resist:     Math.max(0, Math.min(100, poisonResist)),
    Radiation_Resist:  Math.max(0, Math.min(100, radResist)),
    Sequence:          sequence,
    Healing_Rate:      healingRate,
    Critical_Chance:   Math.min(100, criticalChance),
    Gas_Resist:        0,
    Electricity_Resist: Math.max(0, Math.min(100, elecResist)),
  };

  // ── Step 9: Assemble final character object ──
  const npcName = name || _generateName();
  const archetypeLabel = archetype.charAt(0).toUpperCase() + archetype.slice(1);
  const resolvedGender = sex || (Math.random() < 0.5 ? 'Male' : 'Female');
  const resolvedAge    = (age && age >= 21) ? age : Math.floor(21 + Math.random() * 39);

  // Rank: index into ranks array by level tier
  const factionProfile = FACTION_PROFILES[faction] || DEFAULT_FACTION_PROFILE;
  const rankTier = level <= 4 ? 0 : level <= 9 ? 1 : level <= 14 ? 2 : level <= 19 ? 3 : 4;
  const rank = (factionProfile.ranks || [])[Math.min(rankTier, (factionProfile.ranks || []).length - 1)] || '';

  return {
    player: 'NPC',
    name:   npcName,
    race,
    age:    resolvedAge,
    gender: resolvedGender,
    level,
    totalXP: _xpForLevel(level),
    attributes: {
      strength:     effectiveAttrs.strength,
      perception:   effectiveAttrs.perception,
      endurance:    effectiveAttrs.endurance,
      charisma:     effectiveAttrs.charisma,
      intelligence: effectiveAttrs.intelligence,
      agility:      effectiveAttrs.agility,
      luck:         effectiveAttrs.luck,
    },
    tagSkills,
    skills: finalSkills,
    stats,
    selectedTraits,
    selectedPerks,
    perkEffects,
    equipment,
    money:      0,
    notes:      rank ? `${rank} · ${archetypeLabel} — ${faction}` : `${archetypeLabel} — ${faction}`,
    reputation: [],
    createdAt:  new Date().toISOString(),
    _isGeneratedNpc: true,
    _faction:        faction,
    _archetype:      archetype,
    _rank:           rank,
    _armorClassFromArmor: armorClassBonusFromArmor,
  };
}

window.generateNPC = generateNPC;
