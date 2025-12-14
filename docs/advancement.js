// #region ADVANCEMENT SYSTEM
// Handles character leveling, experience points, perks, and progression

// #region XP & LEVEL TABLE
const XP_TABLE = {
  1: 0,
  2: 1000,
  3: 3000,
  4: 6000,
  5: 10000,
  6: 15000,
  7: 21000,
  8: 28000,
  9: 36000,
  10: 45000,
  11: 55000,
  12: 66000,
  13: 78000,
  14: 91000,
  15: 105000,
  16: 120000,
  17: 136000,
  18: 153000,
  19: 171000,
  20: 190000,
  21: 210000
};

/**
 * Get XP required for a specific level
 * @param {number} level - The level (1+)
 * @returns {number} Total XP required to reach that level
 */
function getXPForLevel(level) {
  if (level <= 21) {
    return XP_TABLE[level] || 0;
  }
  // For levels 22+: each new level requires 40,000 more XP than the previous
  let xp = XP_TABLE[21]; // 210,000
  for (let i = 22; i <= level; i++) {
    xp += 40000;
  }
  return xp;
}

/**
 * Calculate the current level based on total XP
 * @param {number} totalXP - Total experience points accumulated
 * @returns {number} Current level
 */
function getLevelFromXP(totalXP) {
  let level = 1;
  for (let i = 2; i <= 1000; i++) {
    const xpRequired = getXPForLevel(i);
    if (totalXP >= xpRequired) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Calculate XP towards the next level
 * @param {number} totalXP - Total experience points
 * @returns {object} {current: xp towards next level, needed: xp needed for next level, level: current level}
 */
function getXPProgress(totalXP) {
  const currentLevel = getLevelFromXP(totalXP);
  const nextLevel = currentLevel + 1;
  
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(nextLevel);
  
  const xpTowardsNext = totalXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  
  return {
    level: currentLevel,
    current: xpTowardsNext,
    needed: xpNeededForNext,
    totalXP: totalXP
  };
}

// #endregion

// #region HP & SKILL POINTS GAIN
/**
 * Calculate HP gained on level up
 * Formula: 3 + floor(END / 2)
 * @param {number} endurance - Endurance attribute value
 * @returns {number} HP gained on level up
 */
function calculateHPGain(endurance) {
  return 3 + Math.floor(endurance / 2);
}

/**
 * Calculate skill points gained on level up
 * Formula: 5 + (2 × IN)
 * This is the base function without perk effects
 * @param {number} intelligence - Intelligence attribute value
 * @returns {number} Skill points gained on level up (base, no perks)
 */
function calculateSkillPointsGain(intelligence) {
  return 5 + (2 * intelligence);
}

/**
 * Calculate skill points with perk effects (wrapper for consistency)
 * @param {number} intelligence - Intelligence attribute value
 * @param {object} perkEffects - Perk effects object
 * @returns {number} Skill points gained on level up (with perks)
 */
function calculateSkillPointsGainWithPerks(intelligence, perkEffects = {}) {
  const baseSkillPoints = calculateSkillPointsGain(intelligence);
  const bonusSkillPoints = perkEffects.skillPointsPerLevel || 0;
  return baseSkillPoints + bonusSkillPoints;
}

/**
 * Calculate total HP at a given level
 * @param {number} currentLevel - Character's current level
 * @param {object} attributes - Character attributes {strength, perception, endurance, ...}
 * @returns {number} Total maximum HP
 */
function calculateTotalHP(currentLevel, attributes) {
  const baseHP = 15; // Starting HP at level 1
  const endurance = attributes.endurance || 5;
  
  let totalHP = baseHP;
  for (let i = 2; i <= currentLevel; i++) {
    totalHP += calculateHPGain(endurance);
  }
  
  return totalHP;
}

// #endregion

// #region SKILL PROGRESSION COSTS
/**
 * Get the cost in skill points to increase a skill by 1%
 * Cost is based on the NEXT skill value (what you'll reach after spending 1 SP).
 * This ensures the cost reflects the bracket you're entering.
 * 
 * For tagged skills:
 * - 1-100%: 0.5 SP per 1% (equals +2% per SP spent)
 * - 101-125%: 1 SP per 1% (equals +1% per SP spent)
 * - 126-150%: 2 SP per 1%
 * - 151-175%: 3 SP per 1%
 * - 176-200%: 4 SP per 1%
 * - 201+%: 5 SP per 1%
 * 
 * For non-tagged skills:
 * - 1-100%: 1 SP per 1% (equals +1% per SP spent)
 * - 101-125%: 2 SP per 1%
 * - 126-150%: 3 SP per 1%
 * - 151-175%: 4 SP per 1%
 * - 176-200%: 5 SP per 1%
 * - 201+%: 6 SP per 1%
 * 
 * @param {number} currentSkillPercent - Current skill percentage (1+)
 * @param {boolean} isTagged - Whether this is a tagged skill
 * @returns {number} Skill points required for +1%
 */
function getSkillProgressionCost(currentSkillPercent, isTagged = false) {
  // Check the NEXT skill value (what you'll reach after spending 1 SP)
  // This ensures the cost reflects the bracket you're entering
  const nextSkillPercent = currentSkillPercent + 1;
  
  const result = (() => {
    if (isTagged) {
      // Tagged skills: cost per 1% of progression
      if (nextSkillPercent <= 100) return 1;
      if (nextSkillPercent >= 101 && nextSkillPercent <= 125) return 1;
      if (nextSkillPercent >= 126 && nextSkillPercent <= 150) return 2;
      if (nextSkillPercent >= 151 && nextSkillPercent <= 175) return 3;
      if (nextSkillPercent >= 176 && nextSkillPercent <= 200) return 4;
      if (nextSkillPercent >= 201) return 5;
    } else {
      // Non-tagged skills: full progression costs
      if (nextSkillPercent >= 1 && nextSkillPercent <= 100) return 1;
      if (nextSkillPercent >= 101 && nextSkillPercent <= 125) return 2;
      if (nextSkillPercent >= 126 && nextSkillPercent <= 150) return 3;
      if (nextSkillPercent >= 151 && nextSkillPercent <= 175) return 4;
      if (nextSkillPercent >= 176 && nextSkillPercent <= 200) return 5;
      if (nextSkillPercent >= 201) return 6;
    }
    return 1; // Default for 0 or invalid
  })();
  
  if (currentSkillPercent === 104) {
    console.log(`[getSkillProgressionCost] DEBUG: currentSkillPercent=${currentSkillPercent}, nextSkillPercent=${nextSkillPercent}, isTagged=${isTagged}, result=${result}`);
  }
  
  return result;
}

/**
 * Calculate the percentage gain when spending 1 SP on a skill at a given value
 * This properly respects all skill brackets (100%, 125%, 150%, 175%, 200%)
 * @param {number} currentSkillPercent - Current skill percentage
 * @param {boolean} isTagged - Whether this is a tagged skill
 * @returns {number} Percentage gain per 1 SP
 */
function getSkillGainPerSP(currentSkillPercent, isTagged = false) {
  // Both tagged and non-tagged skills gain 1% per SP at 100%+
  // Tagged skills get 2% per SP below 100%, non-tagged always get 1%
  if (isTagged && currentSkillPercent < 100) {
    return 2;  // Tagged skill below 100%: +2% per SP
  }
  return 1;    // All other cases: +1% per SP (includes tagged at 100%+, and all non-tagged)
}

/**
 * Calculate total skill points needed to reach a target from current level
 * @param {number} currentPercent - Current skill percentage
 * @param {number} targetPercent - Target skill percentage
 * @param {boolean} isTagged - Whether this is a tagged skill
 * @returns {number} Total SP needed
 */
function calculateSPForSkillIncrease(currentPercent, targetPercent, isTagged = false) {
  if (targetPercent <= currentPercent) return 0;
  
  let totalSP = 0;
  for (let i = currentPercent + 1; i <= targetPercent; i++) {
    totalSP += getSkillProgressionCost(i - 1, isTagged);
  }
  return totalSP;
}

// #endregion

// #region RACIAL LIMITS AND SKILLS
const RACIAL_LIMITS = {
  Human: {
    strength: { min: 1, max: 10 },
    perception: { min: 1, max: 10 },
    endurance: { min: 1, max: 10 },
    charisma: { min: 1, max: 10 },
    intelligence: { min: 1, max: 10 },
    agility: { min: 1, max: 10 },
    luck: { min: 1, max: 10 }
  },
  Ghoul: {
    strength: { min: 1, max: 8 },
    perception: { min: 4, max: 13 },
    endurance: { min: 1, max: 10 },
    charisma: { min: 1, max: 10 },
    intelligence: { min: 2, max: 10 },
    agility: { min: 1, max: 6 },
    luck: { min: 5, max: 12 }
  }
};

/**
 * Calculate base skill values from attributes
 * @param {object} attributes - Character attributes
 * @returns {object} Base skill values
 */
function calculateBaseSkills(attributes) {
  const str = attributes.strength || 0;
  const per = attributes.perception || 0;
  const end = attributes.endurance || 0;
  const ch = attributes.charisma || 0;
  const in_ = attributes.intelligence || 0;
  const ag = attributes.agility || 0;
  const lk = attributes.luck || 0;

  return {
    guns: 5 + (4 * ag),
    energy_weapons: 0 + (2 * ag),
    unarmed: 30 + (2 * (ag + str)),
    melee_weapons: 20 + (2 * (ag + str)),
    throwing: 0 + (4 * ag),
    first_aid: 0 + (2 * (per + end)),
    doctor: 5 + (per + in_),
    sneak: 5 + (3 * ag),
    lockpick: 10 + (per + ag),
    steal: 0 + (3 * ag),
    traps: 10 + (per + ag),
    science: 0 + (4 * in_),
    repair: 0 + (3 * in_),
    pilot: 0 + (2 * ag),
    speech: 0 + (5 * ch),
    barter: 0 + (4 * ch),
    gambling: 0 + (5 * lk),
    outdoorsman: 0 + (2 * (end + in_))
  };
}

/**
 * Calculate final skill values with tag bonuses and trait effects applied
 * @param {object} attributes - Character attributes
 * @param {object} tagSkills - Object with skill names as keys and boolean values
 * @param {array} selectedTraits - Array of selected trait IDs
 * @returns {object} Final skill percentages with tag bonuses and trait effects applied
 */
function calculateFinalSkills(attributes, tagSkills = {}, selectedTraits = []) {
  const baseSkills = calculateBaseSkills(attributes);
  const finalSkills = {};

  // Define trait skill modifiers
  const traitModifiers = {
    'good_natured': {
      first_aid: 20,
      doctor: 20,
      speech: 20,
      barter: 20,
      guns: -10,
      energy_weapons: -10,
      unarmed: -10,
      melee_weapons: -10
    },
    'skilled': {
      // +10% to all skills
      guns: 10,
      energy_weapons: 10,
      unarmed: 10,
      melee_weapons: 10,
      throwing: 10,
      first_aid: 10,
      doctor: 10,
      sneak: 10,
      lockpick: 10,
      steal: 10,
      traps: 10,
      science: 10,
      repair: 10,
      pilot: 10,
      speech: 10,
      barter: 10,
      gambling: 10,
      outdoorsman: 10
    },
    'gifted': {
      // -10% to all skills
      guns: -10,
      energy_weapons: -10,
      unarmed: -10,
      melee_weapons: -10,
      throwing: -10,
      first_aid: -10,
      doctor: -10,
      sneak: -10,
      lockpick: -10,
      steal: -10,
      traps: -10,
      science: -10,
      repair: -10,
      pilot: -10,
      speech: -10,
      barter: -10,
      gambling: -10,
      outdoorsman: -10
    },
    'tech_wizard': {
      science: 15,
      repair: 15
    }
  };

  Object.keys(baseSkills).forEach(skillKey => {
    let value = baseSkills[skillKey];
    
    // Apply tag bonus: +20% to base value
    if (tagSkills[skillKey]) {
      value += 20;
    }
    
    // Apply trait modifiers
    selectedTraits.forEach(traitId => {
      if (traitModifiers[traitId] && traitModifiers[traitId][skillKey] !== undefined) {
        value += traitModifiers[traitId][skillKey];
      }
    });
    
    finalSkills[skillKey] = Math.max(0, Math.min(100, Math.round(value))); // Clamp to 0-100
  });

  return finalSkills;
}

/**
 * Calculate total perks earned by a character at their current level
 * Respects race-specific perk progression:
 * - Human: 1 perk every 3 levels (3, 6, 9, 12, 15, 18, 21, 24...)
 * - Ghoul: 1 perk every 4 levels (4, 8, 12, 16, 20, 24...)
 * @param {number} level - Character's current level
 * @param {string} race - Character's race (Human, Ghoul, etc.)
 * @returns {number} Total number of perks earned so far
 */
function calculatePerksEarned(level, race, selectedTraits = []) {
  if (level < 1) return 0;
  
  // Normalize race name (trim whitespace, case-sensitive comparison)
  const normalizedRace = (race || 'Human').trim();
  
  // Determine perk frequency based on race
  let perkFrequency = 3; // Default for Human
  
  if (normalizedRace === 'Ghoul') {
    perkFrequency = 4;
  }
  // Other races can be added here with their own frequencies
  
  // Check if character has Skilled trait - if so, delay perk gain by 1 level
  const hasSkilled = selectedTraits && selectedTraits.some(trait => 
    (typeof trait === 'string' ? trait.toLowerCase() === 'skilled' : trait.name && trait.name.toLowerCase() === 'skilled')
  );
  
  if (hasSkilled) {
    perkFrequency += 1; // Increase frequency (delay perk gain) by 1 level
    console.log(`[calculatePerksEarned] Skilled trait detected - perk frequency increased to ${perkFrequency}`);
  }
  
  // Calculate how many perks have been earned
  // A character gets their first perk at level equal to perkFrequency
  // Then another every perkFrequency levels after that
  const perksEarned = Math.floor(level / perkFrequency);
  
  console.log(`[calculatePerksEarned] race="${race}" normalized="${normalizedRace}" frequency=${perkFrequency} level=${level} result=${perksEarned}`);
  
  return perksEarned;
}

// #endregion

// #region PERKS DATABASE
const PERKS = {
  'action_boy_girl': {
    name: 'Action Boy / Action Girl',
    description: 'Make the most of every moment in combat.',
    effects: '+1 Action Point per rank, each combat turn',
    ranks: 2,
    requirements: {
      attributes: { agility: 5 },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: {
      excludeRace: []
    }
  },
  
  'adrenaline_rush': {
    name: 'Adrenaline Rush',
    description: 'Fear of death makes you stronger when wounded.',
    effects: 'When HP < 50% of maximum, +1 Strength (up to racial max)',
    ranks: 1,
    requirements: {
      attributes: { strength: { min: 1, max: 9 } },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'animal_friend': {
    name: 'Animal Friend',
    description: 'Animals see you as one of their own.',
    effects: 'Animals will not attack unless threatened or attacked first',
    ranks: 1,
    requirements: {
      attributes: { intelligence: 5 },
      level: 9,
      race: [],
      skills: { outdoorsman: 25 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'awareness': {
    name: 'Awareness',
    description: 'You always know what\'s going on in a fight.',
    effects: 'On examining a critter, you see its exact Hit Points and equipped weapon',
    ranks: 1,
    requirements: {
      attributes: { perception: 5 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'bend_the_rules': {
    name: 'Bend the Rules',
    description: 'Next time, you get to ignore the rules.',
    effects: 'On your next perk choice, you may ignore all perk restrictions except race',
    ranks: 1,
    requirements: {
      attributes: { luck: 6 },
      level: 16,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'better_criticals': {
    name: 'Better Criticals',
    description: 'Your critical hits are especially brutal.',
    effects: 'Critical hits deal 150% damage; chance to damage a limb increased by 50%',
    ranks: 1,
    requirements: {
      attributes: { perception: 6, luck: 6, agility: 4 },
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Mutant'] }
  },
  
  'bluff_master': {
    name: 'Bluff Master',
    description: 'You can talk your way out of trouble.',
    effects: 'When caught stealing, you automatically talk your way out',
    ranks: 1,
    requirements: {
      attributes: { charisma: 3 },
      level: 8,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'bone_head': {
    name: 'Bone Head',
    description: 'Your skull is remarkably hard.',
    effects: 'Rank 1: 50% chance to avoid KO; Rank 2: 75% chance to avoid KO',
    ranks: 2,
    requirements: {
      attributes: { strength: 7 },
      level: 7,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'bonsai': {
    name: 'Bonsai',
    description: 'You have a fruit tree growing from your head.',
    effects: 'Steady supply of fruit (GM details)',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 12,
      race: ['Ghoul'],
      skills: { outdoorsman: 50, science: 40 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'bonus_hth_attacks': {
    name: 'Bonus HtH Attacks',
    description: 'You can make more melee attacks per turn.',
    effects: 'HtH and melee attacks cost 1 less AP',
    ranks: 1,
    requirements: {
      attributes: { agility: 6 },
      level: 15,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'bonus_hth_damage': {
    name: 'Bonus HtH Damage',
    description: 'You hit harder in close combat.',
    effects: '+2 Melee Damage per rank',
    ranks: 3,
    requirements: {
      attributes: { agility: 6, strength: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'bonus_move': {
    name: 'Bonus Move',
    description: 'You move farther for free.',
    effects: 'Per rank, first 2 hexes of movement each turn cost 0 AP',
    ranks: 2,
    requirements: {
      attributes: { agility: 5 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'bonus_ranged_damage': {
    name: 'Bonus Ranged Damage',
    description: 'You do extra damage with ranged weapons.',
    effects: '+2 damage per bullet for each rank',
    ranks: 2,
    requirements: {
      attributes: { agility: 6, luck: 6 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'bonus_rate_of_fire': {
    name: 'Bonus Rate of Fire',
    description: 'Your trigger finger is fast.',
    effects: 'All ranged weapon attacks cost 1 less AP',
    ranks: 1,
    requirements: {
      attributes: { agility: 7, intelligence: 6, perception: 6 },
      level: 15,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'bracing': {
    name: 'Bracing',
    description: 'You know how to brace big weapons.',
    effects: 'Gain bonus when bracing large weapons while standing',
    ranks: 1,
    requirements: {
      attributes: { strength: 7 },
      level: 4,
      race: [],
      skills: { guns: 80 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'break_the_rules': {
    name: 'Break the Rules',
    description: 'Next time, no rules apply.',
    effects: 'On your next perk choice, choose any perk regardless of requirements or race',
    ranks: 1,
    requirements: {
      attributes: { luck: 6 },
      level: 20,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'brown_noser': {
    name: 'Brown Noser',
    description: 'You\'re good at sucking up to authority.',
    effects: '+1 Charisma for reaction rolls with authority figures, per rank',
    ranks: 2,
    requirements: {
      attributes: { charisma: 5, intelligence: 6 },
      level: 2,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Dog', 'Deathclaw'] }
  },
  
  'brutish_hulk': {
    name: 'Brutish Hulk',
    description: 'You gain extra HP per level.',
    effects: 'Double the normal HP gained per level',
    ranks: 1,
    requirements: {
      attributes: { strength: 7, endurance: 5 },
      level: 8,
      race: ['Deathclaw'],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'cancerous_growth': {
    name: 'Cancerous Growth',
    description: 'Radiation has made you hardy.',
    effects: '+2 Healing Rate; Regenerate crippled limb in 48 hours',
    ranks: 1,
    requirements: {
      attributes: { strength: { min: 1, max: 6 } },
      level: 6,
      race: ['Ghoul'],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'cautious_nature': {
    name: 'Cautious Nature',
    description: 'You\'re careful in strange situations.',
    effects: '+3 Perception when determining starting position in random encounters',
    ranks: 1,
    requirements: {
      attributes: { perception: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'comprehension': {
    name: 'Comprehension',
    description: 'You get more out of reading.',
    effects: 'Books grant +50% more skill points',
    ranks: 1,
    requirements: {
      attributes: { intelligence: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Dog'] }
  },
  
  'crazy_bomber': {
    name: 'Crazy Bomber',
    description: 'You\'re unnaturally safe with explosives.',
    effects: 'If you fail to set explosive, you know instantly and can reset',
    ranks: 1,
    requirements: {
      attributes: { intelligence: 6 },
      level: 9,
      race: [],
      skills: { traps: 60 }
    },
    restrictions: { excludeRace: ['Dog', 'Deathclaw'] }
  },
  
  'cult_of_personality': {
    name: 'Cult of Personality',
    description: 'Everyone likes you, regardless of karma.',
    effects: 'Karma modifiers for reactions are always positive',
    ranks: 1,
    requirements: {
      attributes: { charisma: 10 },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'death_sense': {
    name: 'Death Sense',
    description: 'You see well in darkness and sense danger.',
    effects: '+2 Perception in dark; Light penalties reduced 50%; +25% detecting sneaking',
    ranks: 1,
    requirements: {
      attributes: { intelligence: 5 },
      level: 4,
      race: ['Deathclaw'],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'demolition_expert': {
    name: 'Demolition Expert',
    description: 'You\'re a professional with explosives.',
    effects: 'Explosives deal +50% damage; always detonate on time',
    ranks: 1,
    requirements: {
      attributes: { agility: 4 },
      level: 9,
      race: [],
      skills: { traps: 90 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'die_hard': {
    name: 'Die Hard',
    description: 'You stay up when others drop.',
    effects: 'When HP < 20%, +10% Damage Resistance to all damage types',
    ranks: 1,
    requirements: {
      attributes: { endurance: 6 },
      level: 2,
      race: [],
      skills: { first_aid: 40 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'divine_favor': {
    name: 'Divine Favor',
    description: 'A higher power watches over you.',
    effects: 'Once per 24 hours, re-roll any failed roll (accept second result)',
    ranks: 1,
    requirements: {
      attributes: { charisma: 8 },
      level: 14,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'dodger': {
    name: 'Dodger',
    description: 'You\'re harder to hit.',
    effects: '+5 Armor Class per rank',
    ranks: 2,
    requirements: {
      attributes: { agility: 6 },
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'drunken_master': {
    name: 'Drunken Master',
    description: 'You fight better when drunk.',
    effects: '+20% Unarmed when under the influence of alcohol',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 3,
      race: [],
      skills: { unarmed: 60 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'earlier_sequence': {
    name: 'Earlier Sequence',
    description: 'You move earlier in combat rounds.',
    effects: '+2 Sequence per rank',
    ranks: 3,
    requirements: {
      attributes: { perception: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'educated': {
    name: 'Educated',
    description: 'You learn more per level.',
    effects: '+2 skill points per level, per rank',
    ranks: 3,
    requirements: {
      attributes: { intelligence: 6 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'empathy': {
    name: 'Empathy',
    description: 'You get a read on people.',
    effects: 'GM must warn you when dialogue choice will be interpreted negatively',
    ranks: 1,
    requirements: {
      attributes: { perception: 7, intelligence: 5 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'explorer': {
    name: 'Explorer',
    description: 'You find strange and interesting things.',
    effects: 'Increases chance to find special encounters and items',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'faster_healing': {
    name: 'Faster Healing',
    description: 'You heal more quickly.',
    effects: '+2 Healing Rate per rank',
    ranks: 3,
    requirements: {
      attributes: { endurance: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'flexible': {
    name: 'Flexible',
    description: 'You change stances quickly.',
    effects: 'Changing combat stance costs 1 AP',
    ranks: 1,
    requirements: {
      attributes: { agility: 6 },
      level: 4,
      race: [],
      skills: { sneak: 60 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'flower_child': {
    name: 'Flower Child',
    description: 'You\'re less affected by chems.',
    effects: '50% less likely to become addicted; Withdrawal time is half normal',
    ranks: 1,
    requirements: {
      attributes: { endurance: 5 },
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'fortune_finder': {
    name: 'Fortune Finder',
    description: 'You find more money.',
    effects: 'Random encounters yield more currency',
    ranks: 1,
    requirements: {
      attributes: { luck: 8 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'gain_agility': {
    name: 'Gain Agility',
    description: 'You permanently increase Agility.',
    effects: '+1 Agility (permanently)',
    ranks: 1,
    requirements: {
      attributes: { agility: { max: true } },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'gain_charisma': {
    name: 'Gain Charisma',
    description: 'You permanently increase Charisma.',
    effects: '+1 Charisma (permanently)',
    ranks: 1,
    requirements: {
      attributes: { charisma: { max: true } },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'gain_endurance': {
    name: 'Gain Endurance',
    description: 'You permanently increase Endurance.',
    effects: '+1 Endurance (permanently)',
    ranks: 1,
    requirements: {
      attributes: { endurance: { max: true } },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'gain_intelligence': {
    name: 'Gain Intelligence',
    description: 'You permanently increase Intelligence.',
    effects: '+1 Intelligence (permanently)',
    ranks: 1,
    requirements: {
      attributes: { intelligence: { max: true } },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'gain_luck': {
    name: 'Gain Luck',
    description: 'You permanently increase Luck.',
    effects: '+1 Luck (permanently)',
    ranks: 1,
    requirements: {
      attributes: { luck: { max: true } },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'gain_perception': {
    name: 'Gain Perception',
    description: 'You permanently increase Perception.',
    effects: '+1 Perception (permanently)',
    ranks: 1,
    requirements: {
      attributes: { perception: { max: true } },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'gain_strength': {
    name: 'Gain Strength',
    description: 'You permanently increase Strength.',
    effects: '+1 Strength (permanently)',
    ranks: 1,
    requirements: {
      attributes: { strength: { max: true } },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'gambler': {
    name: 'Gambler',
    description: 'You\'re notably good at games of chance.',
    effects: 'One-time +20% to Gambling',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 6,
      race: [],
      skills: { gambling: 50 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'ghost': {
    name: 'Ghost',
    description: 'You\'re nearly invisible in the dark.',
    effects: '+20% Sneak in darkness or at night',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 6,
      race: [],
      skills: { sneak: 60 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'gunner': {
    name: 'Gunner',
    description: 'You\'re good at firing from moving vehicles.',
    effects: 'No 10% penalty for shooting from a moving vehicle',
    ranks: 1,
    requirements: {
      attributes: { agility: 6 },
      level: 3,
      race: [],
      skills: { guns: 40 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'harmless': {
    name: 'Harmless',
    description: 'You look too innocent to be a thief.',
    effects: '+20% Steal',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 6,
      race: [],
      skills: { steal: 50 },
      karma: 50
    },
    restrictions: { excludeRace: ['Deathclaw'] }
  },
  
  'healer': {
    name: 'Healer',
    description: 'You heal more HP with medical skills.',
    effects: 'Rank 1: +1d6+4 HP; Rank 2: +2×(1d6+4) HP',
    ranks: 2,
    requirements: {
      attributes: { perception: 7, agility: 6, intelligence: 5 },
      level: 3,
      race: [],
      skills: { first_aid: 40 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'heave_ho': {
    name: 'Heave Ho!',
    description: 'You throw weapons farther.',
    effects: 'For thrown weapon range, Strength treated as +2 per rank',
    ranks: 3,
    requirements: {
      attributes: {},
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'here_and_now': {
    name: 'Here and Now',
    description: 'You level up immediately.',
    effects: 'Gain enough XP to reach the next level immediately',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'hide_of_scars': {
    name: 'Hide of Scars',
    description: 'Your scarred hide is its own armor.',
    effects: '+15% to all resistances except fire',
    ranks: 2,
    requirements: {
      attributes: { endurance: 6 },
      level: 10,
      race: ['Deathclaw'],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'hit_the_deck': {
    name: 'Hit the Deck!',
    description: 'You react quickly to explosives.',
    effects: 'Take half damage from ranged explosive weapons',
    ranks: 1,
    requirements: {
      attributes: { agility: 6 },
      level: 4,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'hth_evade': {
    name: 'HtH Evade',
    description: 'Your unarmed stance improves your defense.',
    effects: 'If not holding weapons at end of turn, gain 3 AC per unused AP',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 12,
      race: [],
      skills: { unarmed: 75 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'kama_sutra_master': {
    name: 'Kama Sutra Master',
    description: 'You are exceptionally skilled in intimate matters.',
    effects: 'Great stamina and skill (roleplay effect)',
    ranks: 1,
    requirements: {
      attributes: { endurance: 5, agility: 5 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'karma_beacon': {
    name: 'Karma Beacon',
    description: 'Your karma radiates outward.',
    effects: 'Karma is doubled for reaction purposes',
    ranks: 1,
    requirements: {
      attributes: { charisma: 6 },
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'leadfoot': {
    name: 'Leadfoot',
    description: 'You drive faster.',
    effects: 'Vehicle maximum speed increased by 25%',
    ranks: 1,
    requirements: {
      attributes: { perception: 6, agility: 6 },
      level: 3,
      race: [],
      skills: { pilot: 60 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'leader': {
    name: 'Leader',
    description: 'You inspire your party.',
    effects: 'Party members within 10 hexes: +1 Agility, +5 AC (not leader)',
    ranks: 1,
    requirements: {
      attributes: { charisma: 6 },
      level: 4,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'lifegiver': {
    name: 'Lifegiver',
    description: 'You gain extra HP on level up.',
    effects: '+4 HP per level per rank',
    ranks: 2,
    requirements: {
      attributes: { endurance: 4 },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'light_step': {
    name: 'Light Step',
    description: 'You avoid triggers and traps.',
    effects: '+4 effective Agility for trap triggering checks',
    ranks: 1,
    requirements: {
      attributes: { agility: 5, luck: 5 },
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'living_anatomy': {
    name: 'Living Anatomy',
    description: 'You understand where to hurt people.',
    effects: '+10% Doctor; +5 damage vs. living creatures on every attack',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 12,
      race: [],
      skills: { doctor: 60 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'loner': {
    name: 'Loner',
    description: 'You operate better alone.',
    effects: '+10% to all skill rolls when 10+ hexes from party members',
    ranks: 1,
    requirements: {
      attributes: { charisma: { max: 4 } },
      level: 4,
      race: [],
      skills: { outdoorsman: 50 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'master_thief': {
    name: 'Master Thief',
    description: 'You are a consummate thief.',
    effects: 'One-time +15% to Lockpick and Steal',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 12,
      race: [],
      skills: { lockpick: 50, steal: 50 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'master_trader': {
    name: 'Master Trader',
    description: 'You are exceptionally good at trading.',
    effects: 'One-time +30% to Barter',
    ranks: 1,
    requirements: {
      attributes: { charisma: 7 },
      level: 9,
      race: [],
      skills: { barter: 60 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'medic': {
    name: 'Medic',
    description: 'You are well-trained in medicine.',
    effects: 'One-time +10% to First Aid and Doctor',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 12,
      race: [],
      skills: { first_aid: 40 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'mental_block': {
    name: 'Mental Block',
    description: 'You can tune out unwanted mental interference.',
    effects: 'For combat range and trap detection, Perception treated as +1',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 15,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'more_criticals': {
    name: 'More Criticals',
    description: 'You cause critical hits more often.',
    effects: '+5% Critical Chance per rank',
    ranks: 3,
    requirements: {
      attributes: { luck: 6 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Mutant'] }
  },
  
  'mr_fixit': {
    name: 'Mr. (or Ms.) Fixit',
    description: 'You excel at technical work.',
    effects: 'One-time +10% to Repair and Science',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 12,
      race: [],
      skills: { repair: 40 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'mutate': {
    name: 'Mutate!',
    description: 'Your genetic profile changes.',
    effects: 'Remove one existing Trait; Choose a new Trait',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'mysterious_stranger': {
    name: 'Mysterious Stranger',
    description: 'A strange ally sometimes appears.',
    effects: '30% + (2 × Luck)% chance to gain temporary ally in random encounters',
    ranks: 1,
    requirements: {
      attributes: { luck: 4 },
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'negotiator': {
    name: 'Negotiator',
    description: 'You\'re better at getting deals and persuading.',
    effects: 'One-time +10% to Speech and Barter',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 6,
      race: [],
      skills: { barter: 50, speech: 50 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'night_vision': {
    name: 'Night Vision',
    description: 'You see better in the dark.',
    effects: 'Light penalties in darkness reduced by 50%',
    ranks: 1,
    requirements: {
      attributes: { perception: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'pack_rat': {
    name: 'Pack Rat',
    description: 'You can carry more gear.',
    effects: '+10 lbs Carry Weight per rank',
    ranks: 2,
    requirements: {
      attributes: {},
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'pathfinder': {
    name: 'Pathfinder',
    description: 'You travel more efficiently.',
    effects: 'Overland travel time reduced by 25%',
    ranks: 1,
    requirements: {
      attributes: { endurance: 6 },
      level: 6,
      race: [],
      skills: { outdoorsman: 60 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'pickpocket': {
    name: 'Pickpocket',
    description: 'You\'re very skilled at lifting items.',
    effects: '+25% Steal when stealing from characters/NPCs',
    ranks: 1,
    requirements: {
      attributes: { agility: 8 },
      level: 15,
      race: [],
      skills: { steal: 80 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'presence': {
    name: 'Presence',
    description: 'Your presence influences reactions.',
    effects: '+1 Charisma for reaction rolls per rank',
    ranks: 3,
    requirements: {
      attributes: { charisma: 6 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'psychotic': {
    name: 'Psychotic',
    description: 'You\'ve adapted to Psycho.',
    effects: 'Positive effects of Psycho doubled; Addiction rate halved',
    ranks: 1,
    requirements: {
      attributes: { endurance: 5 },
      level: 8,
      race: ['Mutant'],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'pyromaniac': {
    name: 'Pyromaniac',
    description: 'You do terrible things with fire.',
    effects: '+5 damage with fire-based weapons',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 9,
      race: [],
      skills: { guns: 75 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'quick_pockets': {
    name: 'Quick Pockets',
    description: 'You swap gear faster.',
    effects: 'Swapping equipment in combat costs 2 AP instead of 4',
    ranks: 1,
    requirements: {
      attributes: { agility: 5 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'quick_recovery': {
    name: 'Quick Recovery',
    description: 'You get up faster.',
    effects: 'Standing up from knockdown costs 1 AP',
    ranks: 1,
    requirements: {
      attributes: { agility: 5 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'rad_child': {
    name: 'Rad Child',
    description: 'Radiation heals you instead of harming you.',
    effects: 'When in 10+ rads/hour source, +5 Healing Rate',
    ranks: 1,
    requirements: {
      attributes: { endurance: 6 },
      level: 3,
      race: ['Ghoul'],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'rad_resistance': {
    name: 'Rad Resistance',
    description: 'You resist radiation better.',
    effects: '+15% Radiation Resistance per rank',
    ranks: 2,
    requirements: {
      attributes: { endurance: 6, intelligence: 4 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'ranger': {
    name: 'Ranger',
    description: 'You\'re a seasoned wanderer.',
    effects: '+15% Outdoorsman; Special encounters easier to find',
    ranks: 1,
    requirements: {
      attributes: { perception: 6 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'road_warrior': {
    name: 'Road Warrior',
    description: 'You can drive and fight at the same time.',
    effects: 'No penalties when driving and attacking simultaneously',
    ranks: 1,
    requirements: {
      attributes: { intelligence: 6 },
      level: 12,
      race: [],
      skills: { pilot: 60 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'salesman': {
    name: 'Salesman',
    description: 'You\'re good at selling things.',
    effects: 'One-time +20% to Barter',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 6,
      race: [],
      skills: { barter: 50 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'scout': {
    name: 'Scout',
    description: 'You see farther and find more.',
    effects: 'Increased world map vision and clarity; Special items easier to find',
    ranks: 1,
    requirements: {
      attributes: { perception: 7 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'scrounger': {
    name: 'Scrounger',
    description: 'You find more ammunition.',
    effects: 'Always find double the normal ammo in random encounters',
    ranks: 1,
    requirements: {
      attributes: { luck: 8 },
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'sharpshooter': {
    name: 'Sharpshooter',
    description: 'You\'re better at long-range shooting.',
    effects: 'For range modifiers, Perception treated as +2',
    ranks: 1,
    requirements: {
      attributes: { perception: 7, intelligence: 6 },
      level: 9,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'silent_death': {
    name: 'Silent Death',
    description: 'You excel at killing from the shadows.',
    effects: 'While sneaking and attacking from behind with HtH/melee, deal double damage',
    ranks: 1,
    requirements: {
      attributes: { agility: 10 },
      level: 18,
      race: [],
      skills: { sneak: 80, unarmed: 80 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'silent_running': {
    name: 'Silent Running',
    description: 'You can run while sneaking.',
    effects: 'Can run and sneak at the same time',
    ranks: 1,
    requirements: {
      attributes: { agility: 6 },
      level: 6,
      race: [],
      skills: { sneak: 50 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'slayer': {
    name: 'Slayer',
    description: 'You are a walking melee death machine.',
    effects: 'In HtH/melee, successful attack + successful Luck check = critical hit',
    ranks: 1,
    requirements: {
      attributes: { agility: 8, strength: 8 },
      level: 24,
      race: [],
      skills: { unarmed: 80 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'smooth_talker': {
    name: 'Smooth Talker',
    description: 'You sound smarter than you are (for talking).',
    effects: '+1 Intelligence for "smooth-talking" rolls per rank',
    ranks: 3,
    requirements: {
      attributes: { intelligence: 4 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Dog'] }
  },
  
  'snakeater': {
    name: 'Snakeater',
    description: 'You shrug off poison.',
    effects: '+25% Poison Resistance',
    ranks: 1,
    requirements: {
      attributes: { endurance: 3 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'sniper': {
    name: 'Sniper',
    description: 'Your shots tend to be critical.',
    effects: 'With ranged weapons, successful attack + successful Luck check = critical hit',
    ranks: 1,
    requirements: {
      attributes: { agility: 8, perception: 8 },
      level: 24,
      race: [],
      skills: { guns: 80 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'speaker': {
    name: 'Speaker',
    description: 'You\'re especially persuasive.',
    effects: 'One-time +20% to Speech',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 9,
      race: [],
      skills: { speech: 50 }
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'stat': {
    name: 'Stat!',
    description: 'You\'re faster at battlefield medicine.',
    effects: 'Using First Aid/Doctor to help in combat costs 5 AP',
    ranks: 1,
    requirements: {
      attributes: { agility: 6 },
      level: 3,
      race: [],
      skills: { first_aid: 75, doctor: 50 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'steady_arm': {
    name: 'Steady Arm',
    description: 'You handle burst fire better.',
    effects: 'Burst attacks cost 1 less AP',
    ranks: 1,
    requirements: {
      attributes: { strength: 6 },
      level: 4,
      race: ['Mutant'],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'stonewall': {
    name: 'Stonewall',
    description: 'You are hard to knock down.',
    effects: '50% chance to avoid being knocked down in combat',
    ranks: 1,
    requirements: {
      attributes: { strength: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'strong_back': {
    name: 'Strong Back',
    description: 'You can carry significantly more.',
    effects: '+50 lbs Carry Weight per rank',
    ranks: 2,
    requirements: {
      attributes: { strength: 6, endurance: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'stunt_devil': {
    name: 'Stunt Devil',
    description: 'You handle impacts better.',
    effects: '25% less damage from falls/vehicle wrecks; +10% Pilot',
    ranks: 2,
    requirements: {
      attributes: { strength: 6, endurance: 6, agility: 6 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Dog'] }
  },
  
  'survivalist': {
    name: 'Survivalist',
    description: 'You\'re excellent at survival.',
    effects: '+25% Outdoorsman per rank',
    ranks: 3,
    requirements: {
      attributes: { endurance: 6, intelligence: 6 },
      level: 3,
      race: [],
      skills: { outdoorsman: 40 }
    },
    restrictions: { excludeRace: [] }
  },
  

  
  'tag': {
    name: 'Tag!',
    description: 'You get an extra tag skill.',
    effects: 'Choose one additional Tag Skill',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'talon_of_fear': {
    name: 'Talon of Fear',
    description: 'Your claws are venomous.',
    effects: 'All unarmed attacks inflict Type B poison',
    ranks: 1,
    requirements: {
      attributes: { strength: 6 },
      level: 12,
      race: ['Deathclaw'],
      skills: { unarmed: 60 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'team_player': {
    name: 'Team Player',
    description: 'You work best with the group.',
    effects: 'When all party members within 10 hexes, +10% to all skills',
    ranks: 1,
    requirements: {
      attributes: { charisma: 4 },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'thief': {
    name: 'Thief',
    description: 'You are broadly skilled in thievery.',
    effects: 'One-time +10% to Sneak, Lockpick, Steal, and Traps',
    ranks: 1,
    requirements: {
      attributes: {},
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Dog', 'Deathclaw'] }
  },
  
  'tough_hide': {
    name: 'Tough Hide',
    description: 'Your hide is hardened by the wastes.',
    effects: '+15 Armor Class; +10% to all resistances',
    ranks: 2,
    requirements: {
      attributes: { endurance: { max: 7 } },
      level: 12,
      race: ['Mutant'],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'toughness': {
    name: 'Toughness',
    description: 'You are naturally more resilient.',
    effects: '+10% Damage Resistance to all damage types',
    ranks: 1,
    requirements: {
      attributes: { endurance: 6, luck: 6 },
      level: 3,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  },
  
  'tunnel_rat': {
    name: 'Tunnel Rat',
    description: 'You move quickly while low.',
    effects: 'Move at normal rate (1 AP per hex) while crouching or prone',
    ranks: 1,
    requirements: {
      attributes: { agility: 6 },
      level: 4,
      race: [],
      skills: { sneak: 60 }
    },
    restrictions: { excludeRace: [] }
  },
  
  'way_of_the_fruit': {
    name: 'Way of the Fruit',
    description: 'Fruit has mystical effects on you.',
    effects: 'For 24 hours after eating fruit, +1 Perception and +1 Agility',
    ranks: 1,
    requirements: {
      attributes: { charisma: 6 },
      level: 6,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: ['Deathclaw', 'Dog'] }
  },
  
  'weapon_handling': {
    name: 'Weapon Handling',
    description: 'You handle heavy weapons more easily.',
    effects: '+3 effective Strength for meeting weapon Strength requirements',
    ranks: 1,
    requirements: {
      attributes: { agility: 5 },
      level: 12,
      race: [],
      skills: {}
    },
    restrictions: { excludeRace: [] }
  }
};

// #endregion

// #region PERK REQUIREMENT CHECKING
/**
 * Check if a character meets the requirements for a specific perk
 * @param {string} perkId - The perk ID key
 * @param {object} character - Character object with attributes, skills, level, race, karma
 * @param {boolean} ignoreRaceRestriction - If true, ignore race restrictions (for Break the Rules perk)
 * @returns {object} {eligible: boolean, reason: string}
 */
function checkPerkEligibility(perkId, character, ignoreRaceRestriction = false, ignoreAllRestrictions = false) {
  const perk = PERKS[perkId];
  if (!perk) {
    return { eligible: false, reason: 'Perk not found' };
  }
  
  // Log Gain Attribute perks for debugging
  const gainAttributePerks = ['gain_strength', 'gain_perception', 'gain_endurance', 'gain_charisma', 'gain_intelligence', 'gain_agility', 'gain_luck'];
  if (gainAttributePerks.includes(perkId)) {
    console.log(`[checkPerkEligibility] Checking ${perkId}:`);
    console.log(`  - Level: ${character.level} >= ${perk.requirements.level} ? ${character.level >= perk.requirements.level}`);
    console.log(`  - Attributes:`, character.attributes);
    console.log(`  - Attribute requirements:`, perk.requirements.attributes);
  }
  
  // Robots never gain perks
  if (character.race === 'Robot') {
    return { eligible: false, reason: 'Robots cannot gain perks' };
  }
  
  // If Break the Rules is active, bypass all restrictions
  if (ignoreAllRestrictions) {
    return { eligible: true, reason: 'Break the Rules active' };
  }
  
  // Check level
  if (character.level < perk.requirements.level) {
    return { eligible: false, reason: `Requires level ${perk.requirements.level}, you are level ${character.level}` };
  }
  
  // Check attribute requirements (skip if Bend the Rules is active)
  if (!ignoreRaceRestriction) {
    for (const [attr, requirement] of Object.entries(perk.requirements.attributes)) {
      const charAttr = character.attributes[attr];
      
      if (typeof requirement === 'number') {
        // Simple minimum requirement
        if (charAttr < requirement) {
          return { 
            eligible: false, 
            reason: `Requires ${attr} ${requirement}, you have ${charAttr}` 
          };
        }
      } else if (typeof requirement === 'object') {
        // Range or special requirement
        // Check if below racial maximum FIRST (before numeric comparison)
        if (requirement.max === true) {
          // Check if below racial maximum (can still gain the attribute)
          const racialMax = RACIAL_LIMITS[character.race]?.[attr]?.max || 10;
          if (gainAttributePerks.includes(perkId)) {
            console.log(`  - Checking max for ${attr}: charAttr=${charAttr}, racialMax=${racialMax}`);
          }
          if (charAttr >= racialMax) {
            if (gainAttributePerks.includes(perkId)) {
              console.log(`  - INELIGIBLE: ${attr} at max (${charAttr} >= ${racialMax})`);
            }
            return { 
              eligible: false, 
              reason: `${attr.charAt(0).toUpperCase() + attr.slice(1)} is already at racial maximum` 
            };
          }
        } else {
          // Numeric comparison for other max values
          if (requirement.max !== undefined && charAttr > requirement.max) {
            return { 
              eligible: false, 
              reason: `Requires ${attr} at most ${requirement.max}, you have ${charAttr}` 
            };
          }
        }
        
        if (requirement.min !== undefined && charAttr < requirement.min) {
          return { 
            eligible: false, 
            reason: `Requires ${attr} at least ${requirement.min}, you have ${charAttr}` 
          };
        }
      }
    }
  }
  
  // Check skill requirements (skip if Bend the Rules is active)
  if (!ignoreRaceRestriction) {
    for (const [skill, requirement] of Object.entries(perk.requirements.skills)) {
      const charSkill = character.skills[skill] || 0;
      if (charSkill < requirement) {
        return { 
          eligible: false, 
          reason: `Requires ${skill.replace('_', ' ')} ${requirement}%, you have ${charSkill}%` 
        };
      }
    }
  }
  
  // Check karma requirement if applicable (always check unless Break the Rules)
  if (perk.requirements.karma !== undefined && !ignoreAllRestrictions) {
    if (character.karma < perk.requirements.karma) {
      return { 
        eligible: false, 
        reason: `Requires karma >= ${perk.requirements.karma}, you have ${character.karma}` 
      };
    }
  }
  
  // Check race restrictions
  if (!ignoreRaceRestriction) {
    // Ghouls with "Fear the Reaper" trait are treated as Human for perk purposes
    // However, they cannot access Ghoul-exclusive perks
    const hasFearTheReaper = character.traits && character.traits.includes('Fear the Reaper');
    const isGhoulWithFTR = character.race === 'Ghoul' && hasFearTheReaper;
    
    // Determine the effective race for perk eligibility
    let effectiveRace = character.race;
    if (isGhoulWithFTR && perk.requirements.race.length > 0 && !perk.requirements.race.includes('Ghoul')) {
      // Treat as Human for perks that don't require Ghoul
      effectiveRace = 'Human';
    }
    
    // Cannot use Fear the Reaper to access Ghoul-exclusive perks
    if (isGhoulWithFTR && perk.requirements.race.includes('Ghoul') && perk.requirements.race.length === 1) {
      // This is a Ghoul-exclusive perk; Ghouls with Fear the Reaper cannot choose it
      return { 
        eligible: false, 
        reason: `Ghoul-exclusive perks cannot be chosen with "Fear the Reaper"` 
      };
    }
    
    // If perk has required races, check if character (with effective race) is one of them
    if (perk.requirements.race.length > 0) {
      if (!perk.requirements.race.includes(effectiveRace)) {
        return { 
          eligible: false, 
          reason: `Only ${perk.requirements.race.join(', ')} can choose this perk` 
        };
      }
    }
    
    // Check excluded races (using actual race, not effective)
    if (perk.restrictions.excludeRace.includes(character.race)) {
      return { 
        eligible: false, 
        reason: `${character.race} cannot choose this perk` 
      };
    }
  }
  
  if (gainAttributePerks.includes(perkId)) {
    console.log(`  - ELIGIBLE for ${perkId}`);
  }
  
  return { eligible: true, reason: '' };
}

/**
 * Get list of eligible perks for a character
 * @param {object} character - Character object
 * @returns {array} Array of perk IDs that character is eligible for
 */
function getEligiblePerks(character) {
  const eligible = [];
  const gainAttributePerks = ['gain_strength', 'gain_perception', 'gain_endurance', 'gain_charisma', 'gain_intelligence', 'gain_agility', 'gain_luck'];
  
  for (const perkId in PERKS) {
    const check = checkPerkEligibility(perkId, character);
    
    if (gainAttributePerks.includes(perkId)) {
      console.log(`[getEligiblePerks] ${perkId}: eligible=${check.eligible}, reason="${check.reason}"`);
    }
    
    if (check.eligible) {
      eligible.push(perkId);
    }
  }
  
  console.log('[getEligiblePerks] Final eligible perks:', eligible);
  return eligible;
}

// #endregion

// #region PERK MECHANICAL EFFECTS
/**
 * Apply mechanical effects of perks to character data
 * Should be called when confirming perk selection
 * 
 * IMPLEMENTED MECHANICAL PERKS:
 * - Lifegiver (1-2 ranks): +4 HP/level per rank
 * - Educated (1-3 ranks): +2 SP/level per rank
 * - Faster Healing (1-3 ranks): +2 healing rate per rank
 * - Brutish Hulk (1 rank): Double HP/level (Deathclaw only)
 * - Gain X Attribute (1 rank each): +1 to permanent attribute
 * - Cancerous Growth (1 rank): +2 healing rate (Ghoul only)
 * - Toughness (1 rank): +10% damage resistance
 * - Rad Resistance (1-2 ranks): +15% radiation resistance per rank
 * - Comprehension (1 rank): +50% book skill point bonus
 * 
 * IMMEDIATE SKILL BONUSES (10 perks):
 * - Speaker, Salesman, Negotiator, Medic, Master Thief, Master Trader
 * - Mr. Fixit, Thief, Gambler, Living Anatomy
 * 
 * CONDITIONAL SKILL BONUSES (HELD FOR LATER - 7 perks):
 * - Smooth Talker, Survivalist, Ranger, Ghost, Pickpocket, Harmless, Drunken Master
 * 
 * UNCONDITIONAL STAT/SEQUENCE BOOSTERS (2 perks):
 * - Earlier Sequence (1-3 ranks): +2 sequence per rank
 * - Presence (1-3 ranks): +1 CHA for all reaction rolls per rank
 * - Tag! (1 rank): +1 additional tag skill
 * 
 * CONDITIONAL STAT BOOSTERS (HELD FOR LATER - 1 perk):
 * - Brown Noser (1-2 ranks): +1 CHA for reactions with authority figures only
 * 
 * DEFENSIVE/DAMAGE PERKS:
 * - Die Hard: +10% damage resistance (when HP < 20%)
 * - Healer (1-2 ranks): Increased healing effectiveness
 * - Tough Hide (1-2 ranks): +15 AC, +10% resistances per rank
 * - Hide of Scars (1-2 ranks): +15% resistances per rank
 * - Rad Child: +5 healing rate (in radiation)
 * - Pyromaniac: +5 fire damage
 * - Better Criticals: 1.5x crit damage, +50% limb damage
 * - More Criticals (1-3 ranks): +5% crit chance per rank
 * 
 * RULE-BREAKING PERKS:
 * - Bend the Rules: Ignore attribute/skill/level restrictions (next perk)
 * - Break the Rules: Ignore ALL restrictions (next perk)
 * 
 * @param {object} characterData - Character data object
 */
function applyPerkEffects(characterData) {
  // Store original HP before applying perk effects
  characterData.perkEffects = characterData.perkEffects || {};
  
  const selectedPerks = characterData.selectedPerks || [];
  const attributes = characterData.attributes || {};
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  
  // Reset perk effects to baseline
  characterData.perkEffects.hpBonusPerLevel = 0;
  characterData.perkEffects.skillPointsPerLevel = 0;
  characterData.perkEffects.healingRate = 0;
  characterData.perkEffects.attributeBonus = {};
  characterData.perkEffects.damageResistance = 0;
  characterData.perkEffects.radiationResistance = 0;
  characterData.perkEffects.bookSkillBonus = 0;
  characterData.perkEffects.skillBonuses = {};  // One-time skill bonuses from perks like Speaker, Mechanic, etc.
  characterData.perkEffects.additionalTagSkills = 0;  // Extra tag skills from Tag! perk
  characterData.perkEffects.sequenceBonus = 0;  // Bonus to Sequence from Earlier Sequence perk
  characterData.perkEffects.charismaBonus = 0;  // Temporary CHA bonus for reactions
  characterData.perkEffects.ignoreRestrictions = false;  // Bend the Rules: ignore perk restrictions except race
  characterData.perkEffects.ignoreAllRestrictions = false;  // Break the Rules: ignore ALL perk restrictions
  
  // Apply each selected perk's mechanical effects
  for (const selectedPerk of selectedPerks) {
    const perk = PERKS[selectedPerk.id];
    if (!perk) continue;
    
    const rank = selectedPerk.rank || 1;
    
    // Lifegiver: +4 HP per level per rank
    if (selectedPerk.id === 'lifegiver') {
      characterData.perkEffects.hpBonusPerLevel = (characterData.perkEffects.hpBonusPerLevel || 0) + (4 * rank);
    }
    
    // Educated: +2 skill points per level per rank
    if (selectedPerk.id === 'educated') {
      characterData.perkEffects.skillPointsPerLevel = (characterData.perkEffects.skillPointsPerLevel || 0) + (2 * rank);
    }
    
    // Faster Healing: +2 healing rate per rank
    if (selectedPerk.id === 'faster_healing') {
      characterData.perkEffects.healingRate = (characterData.perkEffects.healingRate || 0) + (2 * rank);
    }
    
    // Brutish Hulk: Double HP per level (rank 1 means double)
    if (selectedPerk.id === 'brutish_hulk') {
      characterData.perkEffects.hpBonusPerLevel = (characterData.perkEffects.hpBonusPerLevel || 0) + calculateHPGain(attributes.endurance || 5);
    }
    
    // Gain Attribute Perks: +1 to permanent attribute
    const attributePerks = ['gain_strength', 'gain_perception', 'gain_endurance', 'gain_charisma', 'gain_intelligence', 'gain_agility', 'gain_luck'];
    const attributeMap = {
      'gain_strength': 'strength',
      'gain_perception': 'perception',
      'gain_endurance': 'endurance',
      'gain_charisma': 'charisma',
      'gain_intelligence': 'intelligence',
      'gain_agility': 'agility',
      'gain_luck': 'luck'
    };
    
    if (attributePerks.includes(selectedPerk.id)) {
      const attrName = attributeMap[selectedPerk.id];
      characterData.perkEffects.attributeBonus = characterData.perkEffects.attributeBonus || {};
      characterData.perkEffects.attributeBonus[attrName] = (characterData.perkEffects.attributeBonus[attrName] || 0) + rank;
    }
    
    // Faster Healing / Cancerous Growth: +2 healing rate per rank
    if (selectedPerk.id === 'faster_healing') {
      characterData.perkEffects.healingRate = (characterData.perkEffects.healingRate || 0) + (2 * rank);
    }
    
    // Cancerous Growth: +2 Healing Rate (Ghoul only)
    if (selectedPerk.id === 'cancerous_growth') {
      characterData.perkEffects.healingRate = (characterData.perkEffects.healingRate || 0) + 2;
    }
    
    // Toughness: +10% Damage Resistance
    if (selectedPerk.id === 'toughness') {
      characterData.perkEffects.damageResistance = (characterData.perkEffects.damageResistance || 0) + 10;
    }
    
    // Rad Resistance: +15% Radiation Resistance per rank
    if (selectedPerk.id === 'rad_resistance') {
      characterData.perkEffects.radiationResistance = (characterData.perkEffects.radiationResistance || 0) + (15 * rank);
    }
    
    // Comprehension: +50% book skill point bonus
    if (selectedPerk.id === 'comprehension') {
      characterData.perkEffects.bookSkillBonus = 50;
    }
    
    // IMMEDIATE SKILL BONUS PERKS (always apply)
    // Speaker: +20% Speech (one-time)
    if (selectedPerk.id === 'speaker') {
      characterData.perkEffects.skillBonuses.speech = (characterData.perkEffects.skillBonuses.speech || 0) + 20;
    }
    
    // Salesman: +20% Barter (one-time)
    if (selectedPerk.id === 'salesman') {
      characterData.perkEffects.skillBonuses.barter = (characterData.perkEffects.skillBonuses.barter || 0) + 20;
    }
    
    // Negotiator: +10% Speech and Barter (one-time)
    if (selectedPerk.id === 'negotiator') {
      characterData.perkEffects.skillBonuses.speech = (characterData.perkEffects.skillBonuses.speech || 0) + 10;
      characterData.perkEffects.skillBonuses.barter = (characterData.perkEffects.skillBonuses.barter || 0) + 10;
    }
    
    // Medic: +10% First Aid and Doctor (one-time)
    if (selectedPerk.id === 'medic') {
      characterData.perkEffects.skillBonuses.first_aid = (characterData.perkEffects.skillBonuses.first_aid || 0) + 10;
      characterData.perkEffects.skillBonuses.doctor = (characterData.perkEffects.skillBonuses.doctor || 0) + 10;
    }
    
    // Master Thief: +15% Lockpick and Steal (one-time)
    if (selectedPerk.id === 'master_thief') {
      characterData.perkEffects.skillBonuses.lockpick = (characterData.perkEffects.skillBonuses.lockpick || 0) + 15;
      characterData.perkEffects.skillBonuses.steal = (characterData.perkEffects.skillBonuses.steal || 0) + 15;
    }
    
    // Master Trader: +30% Barter (one-time)
    if (selectedPerk.id === 'master_trader') {
      characterData.perkEffects.skillBonuses.barter = (characterData.perkEffects.skillBonuses.barter || 0) + 30;
    }
    
    // Mr. Fixit: +10% Repair and Science (one-time)
    if (selectedPerk.id === 'mr_fixit') {
      characterData.perkEffects.skillBonuses.repair = (characterData.perkEffects.skillBonuses.repair || 0) + 10;
      characterData.perkEffects.skillBonuses.science = (characterData.perkEffects.skillBonuses.science || 0) + 10;
    }
    
    // Thief: +10% Sneak, Lockpick, Steal, and Traps (one-time)
    if (selectedPerk.id === 'thief') {
      characterData.perkEffects.skillBonuses.sneak = (characterData.perkEffects.skillBonuses.sneak || 0) + 10;
      characterData.perkEffects.skillBonuses.lockpick = (characterData.perkEffects.skillBonuses.lockpick || 0) + 10;
      characterData.perkEffects.skillBonuses.steal = (characterData.perkEffects.skillBonuses.steal || 0) + 10;
      characterData.perkEffects.skillBonuses.traps = (characterData.perkEffects.skillBonuses.traps || 0) + 10;
    }
    
    // Pickpocket: +25% Steal (one-time)
    if (selectedPerk.id === 'pickpocket') {
      characterData.perkEffects.skillBonuses.steal = (characterData.perkEffects.skillBonuses.steal || 0) + 25;
    }
    
    // Harmless: +20% Steal (one-time)
    if (selectedPerk.id === 'harmless') {
      characterData.perkEffects.skillBonuses.steal = (characterData.perkEffects.skillBonuses.steal || 0) + 20;
    }
    
    // Gambler: +20% Gambling (one-time)
    if (selectedPerk.id === 'gambler') {
      characterData.perkEffects.skillBonuses.gambling = (characterData.perkEffects.skillBonuses.gambling || 0) + 20;
    }
    
    // Living Anatomy: +10% Doctor (one-time); stores combat bonus separately
    if (selectedPerk.id === 'living_anatomy') {
      characterData.perkEffects.skillBonuses.doctor = (characterData.perkEffects.skillBonuses.doctor || 0) + 10;
      characterData.perkEffects.livingCreatureDamageBonus = 5; // Combat integration needed
    }
    
    // Tag! perk: +1 additional tag skill
    if (selectedPerk.id === 'tag') {
      characterData.perkEffects.additionalTagSkills = (characterData.perkEffects.additionalTagSkills || 0) + 1;
    }
    
    // Earlier Sequence: +2 Sequence per rank (unconditional bonus in combat)
    if (selectedPerk.id === 'earlier_sequence') {
      characterData.perkEffects.sequenceBonus = (characterData.perkEffects.sequenceBonus || 0) + (2 * rank);
    }
    
    // NOTE: Presence is conditional (+1 CHA only during reaction/dialogue rolls)
    // NOTE: Brown Noser is conditional (+1 CHA only with authority figures)
    // Both will be implemented later when dialogue system can apply conditional bonuses
    
    // Die Hard: +10% Damage Resistance (always apply, condition-based application in combat)
    // NOTE: Die Hard is conditional (+10% DR only when HP < 20%)
    // Will be added when combat system can check HP threshold
    
    // NOTE: Healer is conditional (healing bonus only when performing healing actions)
    // Requires integration with healing/medical item system
    
    // Tough Hide: +15 AC and +10% to all resistances per rank (UNCONDITIONAL)
    if (selectedPerk.id === 'tough_hide') {
      characterData.perkEffects.armorBonus = (characterData.perkEffects.armorBonus || 0) + (15 * rank);
      characterData.perkEffects.damageResistance = (characterData.perkEffects.damageResistance || 0) + (10 * rank);
    }
    
    // Dodger: +5 Armor Class per rank (UNCONDITIONAL)
    if (selectedPerk.id === 'dodger') {
      characterData.perkEffects.armorBonus = (characterData.perkEffects.armorBonus || 0) + (5 * rank);
    }
    
    // Hide of Scars: +15% to all resistances except fire per rank (UNCONDITIONAL)
    if (selectedPerk.id === 'hide_of_scars') {
      characterData.perkEffects.damageResistance = (characterData.perkEffects.damageResistance || 0) + (15 * rank);
    }
    
    // NOTE: Rad Child is conditional (+5 Healing Rate only when in 10+ rads/hour source)
    // Requires integration with radiation exposure system
    
    // NOTE: Pyromaniac is conditional (+5 damage only with fire-based weapons)
    // Requires combat system to track weapon types and apply conditional damage bonus
    
    // Better Criticals: Critical hits deal 150% damage; +50% limb damage (UNCONDITIONAL)
    if (selectedPerk.id === 'better_criticals') {
      characterData.perkEffects.criticalDamageMultiplier = 1.5;
      characterData.perkEffects.limbDamageBonus = 0.5; // +50%
    }
    
    // More Criticals: +5% Critical Chance per rank (UNCONDITIONAL)
    if (selectedPerk.id === 'more_criticals') {
      characterData.perkEffects.criticalChanceBonus = (characterData.perkEffects.criticalChanceBonus || 0) + (5 * rank);
    }
    
    // Action Boy / Action Girl: +1 Action Point per rank (UNCONDITIONAL, combat stat)
    if (selectedPerk.id === 'action_boy_girl') {
      characterData.perkEffects.actionPointBonus = (characterData.perkEffects.actionPointBonus || 0) + rank;
    }
    
    // Rule-Breaking Perks
    // Bend the Rules: Next perk choice ignores restrictions except race
    if (selectedPerk.id === 'bend_the_rules') {
      characterData.perkEffects.ignoreRestrictions = true;
    }
    
    // Break the Rules: Next perk choice ignores ALL restrictions including race
    if (selectedPerk.id === 'break_the_rules') {
      characterData.perkEffects.ignoreAllRestrictions = true;
    }
    
    // Lifegiver and Brutish Hulk both add to HP bonus
    // No additional action needed as they stack
  }
  
  // Retroactively recalculate skills if any attribute bonuses were added
  // This ensures skills reflect the new attribute-based base values
  const attributeBonus = characterData.perkEffects.attributeBonus || {};
  if (Object.keys(attributeBonus).length > 0) {
    recalculateSkillsWithNewAttributes(characterData);
  }
}

/**
 * Recalculate all skill increases retroactively when attributes change
 * This is called when Gain X perks are applied to recalculate base skills
 * @param {object} characterData - Character data object
 */
function recalculateSkillsWithNewAttributes(characterData) {
  // Get the new attributes with perk bonuses applied
  const baseAttributes = characterData.attributes || {};
  const perkEffects = characterData.perkEffects || {};
  const attributesWithPerks = getAttributesWithPerkBonuses(baseAttributes, perkEffects);
  
  const selectedTraits = characterData.selectedTraits || characterData.traits || [];
  const tagSkills = characterData.tagSkills || {};
  
  // Get the original base skills (without perks)
  const originalBaseSkills = calculateBaseSkills(baseAttributes);
  
  // Get the new base skills (with perk attribute bonuses)
  const newBaseSkills = calculateBaseSkills(attributesWithPerks);
  
  // Calculate how much each base skill changed
  const baseDifferences = {};
  for (const skillKey in originalBaseSkills) {
    baseDifferences[skillKey] = newBaseSkills[skillKey] - originalBaseSkills[skillKey];
  }
  
  // For each skill, recalculate what the total should be
  const skillPointsSpent = characterData.skillPointsSpent || {};
  const skillIncreases = characterData.skillIncreases || {};
  
  // Reset skill increases and rebuild them based on new base skills
  characterData.skillIncreases = {};
  
  for (const skillKey in tagSkills) {
    const isTag = tagSkills[skillKey];
    const pointsSpent = skillPointsSpent[skillKey] || 0;
    
    if (pointsSpent > 0) {
      // Simulate spending the same number of points with the new base skill value
      let simValue = newBaseSkills[skillKey];
      let tempSPSpent = 0;
      
      while (tempSPSpent < pointsSpent) {
        const costThisSP = getSkillProgressionCost(simValue, isTag);
        const gainThisSP = getSkillGainPerSP(simValue, isTag);
        
        if (tempSPSpent + costThisSP <= pointsSpent) {
          simValue += gainThisSP;
          tempSPSpent += costThisSP;
        } else {
          break;
        }
      }
      
      // Store the increase from the new base value
      characterData.skillIncreases[skillKey] = simValue - newBaseSkills[skillKey];
    }
  }
  
  console.log('[recalculateSkillsWithNewAttributes] Skills recalculated');
  console.log('Base skill differences:', baseDifferences);
  console.log('New skill increases:', characterData.skillIncreases);
}

/**
 * Calculate total HP with perk bonuses applied
 * @param {number} currentLevel - Character's current level
 * @param {object} attributes - Character attributes
 * @param {object} perkEffects - Perk effects object (from characterData.perkEffects)
 * @returns {number} Total maximum HP
 */
function calculateTotalHPWithPerks(currentLevel, attributes, perkEffects = {}) {
  const baseHP = 15; // Starting HP at level 1
  const endurance = attributes.endurance || 5;
  const hpBonusPerLevel = perkEffects.hpBonusPerLevel || 0;
  
  let totalHP = baseHP;
  for (let i = 2; i <= currentLevel; i++) {
    const gainPerLevel = calculateHPGain(endurance) + hpBonusPerLevel;
    totalHP += gainPerLevel;
  }
  
  return totalHP;
}

/**
 * Get attributes with perk bonuses applied
 * @param {object} baseAttributes - Base character attributes
 * @param {object} perkEffects - Perk effects object
 * @returns {object} Attributes with perk bonuses applied
 */
function getAttributesWithPerkBonuses(baseAttributes, perkEffects = {}) {
  const attributeBonus = perkEffects.attributeBonus || {};
  return {
    strength: (baseAttributes.strength || 5) + (attributeBonus.strength || 0),
    perception: (baseAttributes.perception || 5) + (attributeBonus.perception || 0),
    endurance: (baseAttributes.endurance || 5) + (attributeBonus.endurance || 0),
    charisma: (baseAttributes.charisma || 5) + (attributeBonus.charisma || 0),
    intelligence: (baseAttributes.intelligence || 5) + (attributeBonus.intelligence || 0),
    agility: (baseAttributes.agility || 5) + (attributeBonus.agility || 0),
    luck: (baseAttributes.luck || 5) + (attributeBonus.luck || 0)
  };
}

/**
 * Get skill value with perk bonuses applied
 * @param {string} skillName - Name of the skill
 * @param {number} baseValue - Base skill value before perks
 * @param {object} perkEffects - Perk effects object containing skillBonuses
 * @returns {number} Skill value with perk bonuses applied
 */
function getSkillWithPerkBonus(skillName, baseValue, perkEffects = {}) {
  const skillBonuses = perkEffects.skillBonuses || {};
  const bonus = skillBonuses[skillName] || 0;
  return baseValue + bonus;
}

/**
 * Get all skills with perk bonuses applied
 * @param {object} baseSkills - Object mapping skill names to values
 * @param {object} perkEffects - Perk effects object containing skillBonuses
 * @returns {object} Skills object with perk bonuses applied
 */
function getSkillsWithPerkBonuses(baseSkills, perkEffects = {}) {
  const skillBonuses = perkEffects.skillBonuses || {};
  const result = {};
  
  for (const [skillName, baseValue] of Object.entries(baseSkills)) {
    result[skillName] = baseValue + (skillBonuses[skillName] || 0);
  }
  
  return result;
}

// #endregion

// #endregion
