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
 * @param {number} intelligence - Intelligence attribute value
 * @returns {number} Skill points gained on level up
 */
function calculateSkillPointsGain(intelligence) {
  return 5 + (2 * intelligence);
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
 * @param {number} currentSkillPercent - Current skill percentage (1+)
 * @returns {number} Skill points required for +1%
 */
function getSkillProgressionCost(currentSkillPercent) {
  if (currentSkillPercent >= 1 && currentSkillPercent <= 100) return 1;
  if (currentSkillPercent >= 101 && currentSkillPercent <= 125) return 2;
  if (currentSkillPercent >= 126 && currentSkillPercent <= 150) return 3;
  if (currentSkillPercent >= 151 && currentSkillPercent <= 175) return 4;
  if (currentSkillPercent >= 176 && currentSkillPercent <= 200) return 5;
  if (currentSkillPercent >= 201) return 6;
  return 1; // Default for 0 or invalid
}

/**
 * Calculate total skill points needed to reach a target from current level
 * @param {number} currentPercent - Current skill percentage
 * @param {number} targetPercent - Target skill percentage
 * @returns {number} Total SP needed
 */
function calculateSPForSkillIncrease(currentPercent, targetPercent) {
  if (targetPercent <= currentPercent) return 0;
  
  let totalSP = 0;
  for (let i = currentPercent + 1; i <= targetPercent; i++) {
    totalSP += getSkillProgressionCost(i - 1);
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
 * Calculate final skill values with tag bonuses applied
 * @param {object} attributes - Character attributes
 * @param {object} tagSkills - Object with skill names as keys and boolean values
 * @returns {object} Final skill percentages with tag bonuses applied
 */
function calculateFinalSkills(attributes, tagSkills = {}) {
  const baseSkills = calculateBaseSkills(attributes);
  const finalSkills = {};

  Object.keys(baseSkills).forEach(skillKey => {
    let value = baseSkills[skillKey];
    // Apply tag bonus: +20% to base value
    if (tagSkills[skillKey]) {
      value += 20;
    }
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
function calculatePerksEarned(level, race) {
  if (level < 1) return 0;
  
  // Normalize race name (trim whitespace, case-sensitive comparison)
  const normalizedRace = (race || 'Human').trim();
  
  // Determine perk frequency based on race
  let perkFrequency = 3; // Default for Human
  
  if (normalizedRace === 'Ghoul') {
    perkFrequency = 4;
  }
  // Other races can be added here with their own frequencies
  
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
  
  'swift_learner': {
    name: 'Swift Learner',
    description: 'You gain more experience.',
    effects: '+5% XP gain per rank (rounded up)',
    ranks: 3,
    requirements: {
      attributes: { intelligence: 4 },
      level: 3,
      race: [],
      skills: {}
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
function checkPerkEligibility(perkId, character, ignoreRaceRestriction = false) {
  const perk = PERKS[perkId];
  if (!perk) {
    return { eligible: false, reason: 'Perk not found' };
  }
  
  // Robots never gain perks
  if (character.race === 'Robot') {
    return { eligible: false, reason: 'Robots cannot gain perks' };
  }
  
  // Check level
  if (character.level < perk.requirements.level) {
    return { eligible: false, reason: `Requires level ${perk.requirements.level}, you are level ${character.level}` };
  }
  
  // Check attribute requirements
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
      if (requirement.min !== undefined && charAttr < requirement.min) {
        return { 
          eligible: false, 
          reason: `Requires ${attr} at least ${requirement.min}, you have ${charAttr}` 
        };
      }
      if (requirement.max !== undefined && charAttr > requirement.max) {
        return { 
          eligible: false, 
          reason: `Requires ${attr} at most ${requirement.max}, you have ${charAttr}` 
        };
      }
      if (requirement.max === true) {
        // Check if at racial maximum
        const racialMax = RACIAL_LIMITS[character.race]?.max || 10;
        if (charAttr >= racialMax) {
          return { 
            eligible: false, 
            reason: `${attr.charAt(0).toUpperCase() + attr.slice(1)} is already at racial maximum` 
          };
        }
      }
    }
  }
  
  // Check skill requirements
  for (const [skill, requirement] of Object.entries(perk.requirements.skills)) {
    const charSkill = character.skills[skill] || 0;
    if (charSkill < requirement) {
      return { 
        eligible: false, 
        reason: `Requires ${skill.replace('_', ' ')} ${requirement}%, you have ${charSkill}%` 
      };
    }
  }
  
  // Check karma requirement if applicable
  if (perk.requirements.karma !== undefined) {
    if (character.karma < perk.requirements.karma) {
      return { 
        eligible: false, 
        reason: `Requires karma >= ${perk.requirements.karma}, you have ${character.karma}` 
      };
    }
  }
  
  // Check race restrictions
  if (!ignoreRaceRestriction) {
    // If perk has required races, check if character is one of them
    if (perk.requirements.race.length > 0) {
      if (!perk.requirements.race.includes(character.race)) {
        return { 
          eligible: false, 
          reason: `Only ${perk.requirements.race.join(', ')} can choose this perk` 
        };
      }
    }
    
    // Check excluded races
    if (perk.restrictions.excludeRace.includes(character.race)) {
      return { 
        eligible: false, 
        reason: `${character.race} cannot choose this perk` 
      };
    }
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
  for (const perkId in PERKS) {
    const check = checkPerkEligibility(perkId, character);
    if (check.eligible) {
      eligible.push(perkId);
    }
  }
  return eligible;
}

// #endregion

// #endregion
