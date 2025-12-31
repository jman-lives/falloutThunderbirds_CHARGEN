// Advancement Page Script
// Handles loading character data, managing advancement, and perks

function qs(id){return document.getElementById(id)}

// Skill display name mappings
const SKILL_DISPLAY_NAMES = {
  guns: 'Guns',
  energy_weapons: 'Energy Weapons',
  unarmed: 'Unarmed',
  melee_weapons: 'Melee Weapons',
  throwing: 'Throwing',
  first_aid: 'First Aid',
  doctor: 'Doctor',
  sneak: 'Sneak',
  lockpick: 'Lockpick',
  steal: 'Steal',
  traps: 'Traps',
  science: 'Science',
  repair: 'Repair',
  pilot: 'Pilot',
  speech: 'Speech',
  barter: 'Barter',
  gambling: 'Gambling',
  outdoorsman: 'Outdoorsman'
}

// Skill descriptions
const SKILL_DESCRIPTIONS = {
  guns: 'Use of pistols, rifles, shotguns, SMGs, and bows.',
  energy_weapons: 'Use of laser and plasma weapons.',
  unarmed: 'Hand-to-hand combat using fists, feet, and unarmed weapons.',
  melee_weapons: 'Use of knives, spears, clubs, and other melee weapons.',
  throwing: 'Use of thrown weapons such as knives, rocks, and grenades.',
  first_aid: 'Minor healing of wounds, cuts, and bruises. Takes 1d10 minutes, heals 1d10 HP, max 3 times per day.',
  doctor: 'Advanced healing of serious injuries and crippled limbs. Takes 1 hour, heals 2d10 HP, max 2 times per day.',
  sneak: 'Moving quietly and staying hidden. Rolled when sneaking begins and once per minute while sneaking.',
  lockpick: 'Opening locks without keys. Both normal and electronic locks exist.',
  steal: 'Removing items from people or objects without being noticed.',
  traps: 'Setting, disarming, and handling traps and explosives.',
  science: 'Understanding and using science to solve problems.',
  repair: 'Fixing and maintaining weapons, armor, and other equipment.',
  pilot: 'Operating various vehicles and flying craft.',
  speech: 'Convincing others through dialogue and persuasion.',
  barter: 'Negotiating prices and trading goods.',
  gambling: 'Games of chance and probability assessment.',
  outdoorsman: 'Survival, tracking, and navigation in the wilderness.'
}

// Store character data
let characterData = {};

// Store production config
let prodConfig = {};

// Log character data from localStorage at page load
function logCharacterFromStorage() {
  const character = localStorage.getItem('falloutCharacter');
  if (character) {
    try {
      const charData = JSON.parse(character);
      console.log('%c[CHARACTER DATA LOADED]', 'color: #4CAF50; font-weight: bold;', charData);
    } catch (e) {
      console.warn('Failed to parse character data from localStorage:', e);
    }
  } else {
    console.log('%c[NO CHARACTER IN STORAGE]', 'color: #FF9800; font-weight: bold;');
  }
}

// Load character data from localStorage when page loads
document.addEventListener('DOMContentLoaded', async () => {
  // Log character data from storage at page load
  logCharacterFromStorage();
  
  await loadProdConfig();
  await loadCharacterData();
  
  // Check if this is a level up session (character uploaded from levelup.html)
  const isLevelUpSession = localStorage.getItem('isLevelUpSession') === 'true';
  const fromChargen = localStorage.getItem('fromChargen') === 'true';
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  
  console.log('%c[ADVANCEMENT PAGE INIT]', 'color: #FF9800; font-weight: bold;');
  console.log('  isLevelUpSession:', isLevelUpSession);
  console.log('  fromChargen:', fromChargen);
  console.log('  currentLevel:', currentLevel);
  console.log('  totalXP:', characterData.totalXP);
  console.log('  prodConfig BEFORE:', prodConfig);
  
  // Level-up sessions override the max level to only allow one level-up (or two with Here and Now)
  // Chargen sessions use the fixed chargenMaxLevel from config
  if (isLevelUpSession && !fromChargen) {
    console.log('  → Using LEVEL-UP SESSION logic');
    // For level up sessions, calculate the maximum level based on current level + increment
    const levelupIncrement = prodConfig.levelupMaxLevelIncrement || 1;
    
    // Check if character has Here and Now perk that can be used
    const selectedPerks = characterData.selectedPerks || [];
    const hereAndNowPerk = selectedPerks.find(p => p.id === 'here_and_now');
    const canUseHereAndNow = hereAndNowPerk && !hereAndNowPerk.hasIncreasedMaxLevel;
    
    if (canUseHereAndNow) {
      // Here and Now perk allows leveling up twice (overrides the levelupMaxLevelIncrement)
      prodConfig.chargenMaxLevel = currentLevel + 2;
      console.log('    Here and Now active: chargenMaxLevel =', prodConfig.chargenMaxLevel);
    } else {
      // Normal level up - can advance by levelupMaxLevelIncrement levels
      prodConfig.chargenMaxLevel = currentLevel + levelupIncrement;
      console.log('    Normal level-up: chargenMaxLevel =', prodConfig.chargenMaxLevel);
    }
  } else {
    // This is a chargen session - use the configured chargenMaxLevel (default 4)
    // Don't override it - characters should reach max level 4 during chargen
    console.log('  → Using CHARGEN SESSION logic');
    prodConfig.chargenMaxLevel = prodConfig.chargenMaxLevel || 4;
    console.log('    chargenMaxLevel =', prodConfig.chargenMaxLevel);
  }
  
  console.log('  prodConfig AFTER:', prodConfig);
  
  // Set up event listeners (only if elements exist)
  const levelUpBtn = qs('level-up-btn');
  if (levelUpBtn) {
    levelUpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      levelUp();
    });
  }

  const downloadBtn = qs('download');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      // Create a complete character sheet JSON with all data - same format as review.html
      const characterSheet = {
        // Include all character data
        player: characterData.player || '',
        name: characterData.name || '',
        race: characterData.race || '',
        age: characterData.age || '',
        gender: characterData.gender || '',
        attributes: characterData.attributes || {},
        tagSkills: characterData.tagSkills || {},
        skills: characterData.skills || {},
        level: characterData.level || 1,
        totalXP: characterData.totalXP || 0,
        selectedPerks: characterData.selectedPerks || [],
        stats: characterData.stats || {},
        notes: characterData.notes || null,
        selectedTraits: characterData.selectedTraits || [],
        createdAt: characterData.createdAt || new Date().toISOString(),
        equipment: characterData.equipment || null,
        money: characterData.money !== undefined ? characterData.money : 80000,
        skillIncreases: characterData.skillIncreases || {},
        skillPointsSpent: characterData.skillPointsSpent || {},
        skillsConfirmed: characterData.skillsConfirmed || false,
        perksConfirmed: characterData.perksConfirmed || false,
        perkEffects: characterData.perkEffects || {},
        // Add metadata
        savedAt: new Date().toISOString(),
        version: '1.0'
      };
      // Generate filename - same format as review.html for consistency
      const charName = characterData.name || 'character';
      const dateStamp = new Date().toISOString().split('T')[0];
      const filename = `${charName.toLowerCase().replace(/\s+/g, '_')}_${dateStamp}.json`;
      downloadJSON(characterSheet, filename);
    });
  }

  const loadFile = qs('load-file');
  if (loadFile) {
    loadFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if(file) handleFileLoad(file);
      e.target.value = '';
    });
  }

  const fillSampleBtn = qs('fill-sample');
  if (fillSampleBtn) {
    fillSampleBtn.addEventListener('click', () => {
      const sample = {
        name: 'Sample Vault Dweller',
        age: 28,
        gender: 'Male',
        attributes: {strength:6,perception:7,endurance:5,charisma:4,intelligence:8,agility:6,luck:3},
        occupation: 'Vault Technician',
        notes: 'Ready for adventure.'
      };
      characterData = sample;
      saveCharacterData();
      updateDisplay();
    });
  }

  // Initialize skill ranking system
  initializeSkillRanking();

  // Initial display
  updateCharacterSummary();
  updateDisplay();
  updateSkillRanking();
  renderOutput(characterData);
});

// Load production configuration
async function loadProdConfig() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`prod-config.json?t=${timestamp}`);
    prodConfig = await response.json();
    
    console.log('  prodConfig loaded from prod-config.json:', prodConfig);
    
    // Handle legacy config values for backwards compatibility
    if (prodConfig.levelsForchargen && !prodConfig.chargenMaxLevel) {
      prodConfig.chargenMaxLevel = prodConfig.levelsForchargen;
    }
    if (prodConfig.levelsForLevelUp && !prodConfig.levelupMaxLevelIncrement) {
      prodConfig.levelupMaxLevelIncrement = prodConfig.levelsForLevelUp;
    }
    
    // Try to load dev-config for development overrides
    try {
      const devResponse = await fetch(`dev-config.json?t=${timestamp}`);
      const devConfig = await devResponse.json();
      console.log('  dev-config.json loaded:', devConfig);
      
      // Override with dev config values if present
      if (devConfig.chargenMaxLevel) {
        console.log('  → Overriding chargenMaxLevel to', devConfig.chargenMaxLevel, '(from dev-config)');
        prodConfig.chargenMaxLevel = devConfig.chargenMaxLevel;
      }
      if (devConfig.levelupMaxLevelIncrement) {
        prodConfig.levelupMaxLevelIncrement = devConfig.levelupMaxLevelIncrement;
      }
      // Handle legacy dev-config values
      if (devConfig.levelsForchargen && !devConfig.chargenMaxLevel) {
        console.log('  → Legacy: Overriding chargenMaxLevel to', devConfig.levelsForchargen, '(from dev-config legacy value)');
        prodConfig.chargenMaxLevel = devConfig.levelsForchargen;
      }
      if (devConfig.levelsForLevelUp && !devConfig.levelupMaxLevelIncrement) {
        prodConfig.levelupMaxLevelIncrement = devConfig.levelsForLevelUp;
      }
    } catch (devErr) {
      console.log('  dev-config.json not found or failed to load (OK for production)');
    }
  } catch (e) {
    prodConfig = { chargenMaxLevel: 4, levelupMaxLevelIncrement: 1 }; // Default fallback
  }
}

// Load character data from localStorage
async function loadCharacterData() {
  
  // First, check if we have stored character data from levelup session
  let stored = localStorage.getItem('characterData');
  
  // If not from levelup, check for normal chargen stored data
  if (!stored) {
    stored = localStorage.getItem('falloutCharacter');
  }
  
  if (stored) {
    // We have stored data, use it
    try {
      characterData = JSON.parse(stored);
      
      // Recalculate level from totalXP if it exists
      if (characterData.totalXP !== undefined && typeof getLevelFromXP === 'function') {
        const calculatedLevel = getLevelFromXP(characterData.totalXP || 0);
        characterData.level = calculatedLevel;
      }
      
      // Recalculate Sequence to ensure perk/trait bonuses are applied
      if (typeof recalculateSequence === 'function') {
        recalculateSequence(characterData);
      }
    } catch (err) {
      characterData = {};
    }
  } else {
    // No stored data - check if we should generate a test character
    try {
      const response = await fetch('dev-config.json');
      const devConfig = await response.json();
      
      if (devConfig.autoLoadTestCharacter) {
        characterData = generateTestCharacter();
        localStorage.setItem('falloutCharacter', JSON.stringify(characterData));
      } else {
        characterData = {};
      }
    } catch (e) {
      characterData = {};
    }
  }
  
}

// This function is no longer used - kept for reference
// Load test character if autoLoadTestCharacter is enabled in dev-config
async function loadTestCharacterIfConfigured_DEPRECATED() {
  try {
    const response = await fetch('dev-config.json');
    const devConfig = await response.json();
    
    if (devConfig.autoLoadTestCharacter) {
      characterData = generateTestCharacter();
      localStorage.setItem('falloutCharacter', JSON.stringify(characterData));
    } else {
    }
  } catch (e) {
  }
}

// Generate a random test character
function generateTestCharacter() {
  const sampleNames = ['Alex', 'Riley', 'Mack', 'Nova', 'Harper', 'Jules', 'Casey', 'Rowan', 'Rex', 'Ivy'];
  const genders = ['Male', 'Female'];
  const races = ['Human', 'Ghoul'];
  const allSkills = ['guns', 'energy_weapons', 'unarmed', 'melee_weapons', 'throwing', 'first_aid', 'doctor', 'sneak', 'lockpick', 'steal', 'traps', 'science', 'repair', 'pilot', 'speech', 'barter', 'gambling', 'outdoorsman'];
  
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Select random race
  const selectedRace = races[randInt(0, races.length - 1)];
  const raceLimits = RACIAL_LIMITS[selectedRace];
  
  // Generate attributes respecting racial limits
  const attributes = {
    strength: 5,
    perception: 5,
    endurance: 5,
    charisma: 5,
    intelligence: 5,
    agility: 5,
    luck: 5,
  };
  
  let pointsAvailable = 5;
  const attributeNames = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
  
  while (pointsAvailable > 0) {
    const shuffledAttributes = attributeNames.sort(() => Math.random() - 0.5);
    let allocated = false;
    
    for (const attrName of shuffledAttributes) {
      const limits = raceLimits[attrName];
      const currentValue = attributes[attrName];
      const maxValue = limits.max;
      
      if (currentValue < maxValue) {
        attributes[attrName] += 1;
        pointsAvailable -= 1;
        allocated = true;
        break;
      }
    }
    
    if (!allocated) break;
  }
  
  // Select 3 random tag skills
  const tagSkills = {};
  const shuffledSkills = allSkills.sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3; i++) {
    tagSkills[shuffledSkills[i]] = true;
  }
  for (const skill of allSkills) {
    if (!tagSkills[skill]) {
      tagSkills[skill] = false;
    }
  }
  
  return {
    player: 'test',
    name: sampleNames[randInt(0, sampleNames.length - 1)],
    race: selectedRace,
    age: randInt(16, selectedRace === 'Ghoul' ? 236 : 80),
    gender: genders[randInt(0, genders.length - 1)],
    attributes: attributes,
    tagSkills: tagSkills,
    skills: {
      guns: randInt(20, 80),
      energy_weapons: randInt(10, 70),
      unarmed: randInt(30, 90),
      melee_weapons: randInt(25, 85),
      throwing: randInt(15, 75),
      first_aid: randInt(20, 70),
      doctor: randInt(10, 60),
      sneak: randInt(15, 70),
      lockpick: randInt(15, 70),
      steal: randInt(10, 65),
      traps: randInt(15, 70),
      science: randInt(20, 75),
      repair: randInt(25, 80),
      pilot: randInt(10, 60),
      speech: randInt(25, 80),
      barter: randInt(20, 75),
      gambling: randInt(15, 70),
      outdoorsman: randInt(15, 70),
    },
    level: 1,
    totalXP: 1000,
    selectedPerks: [],
    stats: {
      Hit_Points: 21,
      Carry_Weight: 150,
      Action_Points: 7,
      Sequence: 12,
      Melee_Damage: 1,
      Critical_Chance: 5,
      Healing_Rate: 2,
      Poison_Resist: 60,
      Radiation_Resist: 92,
      Gas_Resist: 0,
      Electricity_Resist: 0,
      Armor_Class: 5,
      DT: {
        Normal: 18,
        Laser: 2,
        Fire: 23,
        Plasma: 28,
        Explode: 24
      },
      DR: {
        Normal: 7,
        Laser: 20,
        Fire: 25,
        Plasma: 1,
        Explode: 5
      }
    },
    notes: null,
    selectedTraits: ['chem_resistant'],
    createdAt: new Date().toISOString(),
    skillIncreases: {},
    skillPointsSpent: {},
    skillsConfirmed: false,
    perksConfirmed: false
  };
}

// Save character data to localStorage
function saveCharacterData() {
  localStorage.setItem('falloutCharacter', JSON.stringify(characterData));
  
  // If this was a level up session, clear the temporary characterData key
  if (localStorage.getItem('isLevelUpSession') === 'true') {
    localStorage.removeItem('characterData');
    localStorage.removeItem('isLevelUpSession');
  }
}

// Update character summary display
function updateCharacterSummary() {
  const name = characterData.name || 'Unknown';
  const race = characterData.race || 'Human';
  const attributes = characterData.attributes || {
    strength: 5,
    perception: 5,
    endurance: 5,
    charisma: 5,
    intelligence: 5,
    agility: 5,
    luck: 5
  };
  const totalXP = characterData.totalXP || 0;
  const xpProgress = getXPProgress(totalXP);
  const occupation = characterData.occupation || '-';
  const karma = characterData.karma || 0;
  
  // Calculate total HP
  const totalHP = calculateTotalHP(xpProgress.level, attributes);
  
  // Get tag skills - stored as tagSkills object with boolean values
  const tagSkills = characterData.tagSkills || {};
  const tagSkillsList = Object.keys(tagSkills)
    .filter(skill => tagSkills[skill])
    .map(skill => SKILL_DISPLAY_NAMES[skill] || skill);
  const tagsDisplay = tagSkillsList.length > 0 ? tagSkillsList.join(', ') : 'None';
  
  // Get traits - note: saved as selectedTraits from form data
  const traits = characterData.selectedTraits || characterData.traits || [];
  // Convert trait IDs to display names
  const traitsDisplay = traits.length > 0 ? traits.map(traitId => {
    // Get the trait name from TRAITS object (defined in script.js)
    const traitObj = typeof TRAITS !== 'undefined' && TRAITS[traitId];
    return traitObj ? traitObj.name : traitId;
  }).join(', ') : 'None';
  
  // Find top skill
  const skills = characterData.skills || {};
  let topSkill = '-';
  let topValue = 0;
  let topSkillKey = '';
  for (const [skillName, skillValue] of Object.entries(skills)) {
    if (skillValue > topValue) {
      topValue = skillValue;
      topSkillKey = skillName;
      const displayName = SKILL_DISPLAY_NAMES[skillName] || skillName;
      topSkill = `${displayName} (${skillValue}%)`;
    }
  }
  
  // Update summary elements
  if (qs('char-name')) qs('char-name').textContent = name;
  if (qs('char-race')) qs('char-race').textContent = race;
  if (qs('char-level')) qs('char-level').textContent = xpProgress.level;
  if (qs('char-xp')) qs('char-xp').textContent = `${totalXP} XP`;
  if (qs('char-hp')) qs('char-hp').textContent = totalHP;
  
  // Apply trait modifiers to attributes for display
  const selectedTraits = characterData.selectedTraits || characterData.traits || [];
  const effectiveAttributes = getEffectiveAttributes(attributes, selectedTraits);
  
  // Apply perk bonuses to attributes if available
  const perkEffects = characterData.perkEffects || {};
  const attributesWithPerks = getAttributesWithPerkBonuses(effectiveAttributes, perkEffects);
  
  // Update individual attributes with trait modifiers and perk bonuses applied
  if (qs('char-str')) qs('char-str').textContent = attributesWithPerks.strength;
  if (qs('char-per')) qs('char-per').textContent = attributesWithPerks.perception;
  if (qs('char-end')) qs('char-end').textContent = attributesWithPerks.endurance;
  if (qs('char-chr')) qs('char-chr').textContent = attributesWithPerks.charisma;
  if (qs('char-int')) qs('char-int').textContent = attributesWithPerks.intelligence;
  if (qs('char-agi')) qs('char-agi').textContent = attributesWithPerks.agility;
  if (qs('char-lck')) qs('char-lck').textContent = attributesWithPerks.luck;
  
  // Update additional info
  if (qs('char-tags')) qs('char-tags').textContent = tagsDisplay;
  if (qs('char-traits')) qs('char-traits').textContent = traitsDisplay;
  if (qs('char-top-skill')) qs('char-top-skill').textContent = topSkill;
  
}

// Update advancement display based on current XP and attributes
function updateDisplay() {
  const totalXP = characterData.totalXP || 0;
  const xpProgress = getXPProgress(totalXP);
  
  // Ensure attributes exist and are valid
  let attributes = characterData.attributes || {};
  
  // If attributes is empty or missing required fields, use defaults
  if (!attributes.intelligence || !attributes.strength || !attributes.perception || !attributes.endurance || !attributes.charisma || !attributes.agility || !attributes.luck) {
    attributes = {
      strength: attributes.strength || 5,
      perception: attributes.perception || 5,
      endurance: attributes.endurance || 5,
      charisma: attributes.charisma || 5,
      intelligence: attributes.intelligence || 5,
      agility: attributes.agility || 5,
      luck: attributes.luck || 5
    };
  }
  
  // Apply trait modifiers to attributes for calculations
  const selectedTraits = characterData.selectedTraits || characterData.traits || [];
  const effectiveAttributes = getEffectiveAttributes(attributes, selectedTraits);
  
  const currentLevel = xpProgress.level;
  const perkEffects = characterData.perkEffects || {};
  
  // Apply perk bonuses to attributes for HP/SP calculations
  const attributesWithPerks = getAttributesWithPerkBonuses(effectiveAttributes, perkEffects);
  
  // Calculate HP and skill points with perk bonuses
  const hpGain = calculateHPGain(attributesWithPerks.endurance);
  const hpGainWithPerks = hpGain + (perkEffects.hpBonusPerLevel || 0);
  const spGain = calculateSkillPointsGain(attributesWithPerks.intelligence);
  const spGainWithPerks = spGain + (perkEffects.skillPointsPerLevel || 0);
  const totalHP = calculateTotalHPWithPerks(currentLevel, attributesWithPerks, perkEffects);
  
  // Update level display
  if (qs('current_level')) qs('current_level').textContent = currentLevel;
  if (qs('xp_to_next')) qs('xp_to_next').textContent = xpProgress.needed - xpProgress.current;
  if (qs('current_level_xp')) qs('current_level_xp').textContent = xpProgress.current;
  if (qs('needed_xp')) qs('needed_xp').textContent = xpProgress.needed;
  
  // Update per-level gains (show perk bonuses if applicable)
  if (qs('hp_per_level')) {
    if (hpGainWithPerks !== hpGain) {
      qs('hp_per_level').textContent = `${hpGain} + ${perkEffects.hpBonusPerLevel} (perks) = ${hpGainWithPerks}`;
    } else {
      qs('hp_per_level').textContent = hpGain;
    }
  }
  if (qs('sp_per_level')) {
    if (spGainWithPerks !== spGain) {
      qs('sp_per_level').textContent = `${spGain} + ${perkEffects.skillPointsPerLevel} (perks) = ${spGainWithPerks}`;
    } else {
      qs('sp_per_level').textContent = spGain;
    }
  }
  if (qs('total_hp_projected')) qs('total_hp_projected').textContent = totalHP;
  
  // Calculate perks earned based on race, level, and traits
  const race = characterData.race || 'Human';
  const perksEarned = calculatePerksEarned(currentLevel, race, selectedTraits);
  if (qs('perks_earned')) qs('perks_earned').textContent = perksEarned;
  
  // Build character object for perk eligibility checking
  const character = {
    level: currentLevel,
    race: race,
    attributes: effectiveAttributes,
    skills: calculateFinalSkills(attributes, characterData.tagSkills || {}, selectedTraits),
    karma: 0,
    traits: selectedTraits,
    selectedPerks: characterData.selectedPerks || []
  };
  
  // Get eligible perks and display them
  const eligiblePerkIds = getEligiblePerks(character);
  renderAvailablePerks(eligiblePerkIds);
  // Pass perksEarned for both max perks available and for the button state logic
  renderSelectedPerks(perksEarned, perksEarned);
  
  // Update notes field
  if (qs('notes')) qs('notes').value = characterData.notes || '';
  
  // Update skill ranking display
  updateSkillRanking();
  
  // Update perks section visibility based on skill confirmation state AND available perk ranks
  const perksSection = qs('perks-section');
  const skillsConfirmed = characterData.skillsConfirmed || false;
  const perksConfirmed = characterData.perksConfirmed || false;
  const selectedPerks = characterData.selectedPerks || [];
  
  // Count perks locked at previous levels (not available for new selections)
  const lockedRanks = selectedPerks
    .filter(p => p.lockedAtLevel && p.lockedAtLevel < currentLevel)
    .reduce((sum, p) => sum + p.rank, 0);
  
  // Count NEWLY SELECTED perks at this level (not rank-ups to existing perks)
  // A perk counts as "newly selected this level" if it either:
  // - Was first added at this level (modifiedAtLevel === currentLevel AND didn't exist before)
  // - OR doesn't have a lockedAtLevel (was added this level for the first time)
  const newlySelectedThisLevel = selectedPerks
    .filter(p => {
      // If perk has lockedAtLevel, it was selected in a previous level
      if (p.lockedAtLevel !== undefined && p.lockedAtLevel < currentLevel) return false;
      // Only count if modified at this level AND wasn't locked in a previous level
      return p.modifiedAtLevel === currentLevel && (!p.lockedAtLevel || p.lockedAtLevel >= currentLevel);
    })
    .length; // Count number of newly selected perks, not total ranks
  
  const totalRanksUsedThisLevel = newlySelectedThisLevel; // One rank per newly selected perk
  
  // New available ranks = perks earned this level minus what we've already used this level
  const newAvailableRanks = perksEarned - totalRanksUsedThisLevel;
  console.log(`[PERKS DISPLAY] Level ${currentLevel}: perksEarned=${perksEarned}, newlySelectedThisLevel=${newlySelectedThisLevel}, totalRanksUsedThisLevel=${totalRanksUsedThisLevel}, newAvailableRanks=${newAvailableRanks}`);
  const hasAvailablePerkRanks = totalRanksUsedThisLevel < newAvailableRanks && newAvailableRanks > 0;
  
  // Check if there are actually eligible perks that can be selected
  const hasEligiblePerks = eligiblePerkIds.some(perkId => {
    const perk = PERKS[perkId];
    const selectedPerk = selectedPerks.find(p => p.id === perkId);
    const currentRank = selectedPerk ? selectedPerk.rank : 0;
    return currentRank < perk.ranks;
  });
  
  if (perksSection) {
    // Perks section is shown only if:
    // 1. Skills are confirmed AND
    // 2. Perks are not confirmed AND
    // 3. Either there are perk slots available this level OR perks have been selected/modified at this level
    const hasSelectedPerksThisLevel = selectedPerks.some(p => p.modifiedAtLevel === currentLevel);
    const shouldShowPerks = skillsConfirmed && !perksConfirmed && (newAvailableRanks > 0 || hasSelectedPerksThisLevel);
    
    perksSection.style.display = shouldShowPerks ? '' : 'none';
  }
  
  // Update level up button visibility
  // Show only if all available allocations have been confirmed
  // At each level, only require confirmation for sections that have items to allocate
  const levelUpBtn = qs('level-up-btn');
  const downloadBtn = qs('download');
  if (levelUpBtn) {
    // Check if character has reached maximum level
    const maxLevel = prodConfig.chargenMaxLevel || 4;
    const isMaxLevel = currentLevel >= maxLevel;
    
    // Calculate if there are actually skill points available to spend at this level
    let hasSkillsToConfirm = false;
    if (currentLevel > 1) {
      const skillPointsSpent = Object.values(characterData.skillPointsSpent || {}).reduce((sum, val) => sum + val, 0);
      const perkEffects = characterData.perkEffects || {};
      const spPerLevel = calculateSkillPointsGainWithPerks(effectiveAttributes.intelligence, perkEffects);
      const availableSkillPoints = spPerLevel - skillPointsSpent;
      hasSkillsToConfirm = availableSkillPoints > 0;
    }
    
    // Calculate if there are actually perk ranks available to spend at this level
    // Check if perks are earned this level (perksEarned > 0), which means player must confirm
    const hasPerksToConfirm = perksEarned > 0;
    
    // Check if unconfirmed items that need confirmation still exist
    const skillsNeedConfirmation = hasSkillsToConfirm && !skillsConfirmed;
    const perksNeedConfirmation = hasPerksToConfirm && !perksConfirmed;
    
    
    // Calculate if all confirmations are done (no pending confirmations)
    const allConfirmed = !skillsNeedConfirmation && !perksNeedConfirmation;
    
    // Level Up button: visible only if not max level and all confirmations are done
    levelUpBtn.style.display = (isMaxLevel || skillsNeedConfirmation || perksNeedConfirmation) ? 'none' : '';
    
    const downloadBtn = qs('download');
    const equipmentBtn = qs('equipment-choice-btn');
    
    // Determine which button to show based on character source
    const showEquipmentBtn = window.showEquipmentButton === true;
    const showDownloadBtn = window.showEquipmentButton === false;
    
    
    // Download button: visible ONLY if character was loaded from file (not from chargen) AND max level reached AND confirmed
    if (downloadBtn) {
      const shouldShowDownload = isMaxLevel && allConfirmed && showDownloadBtn;
      downloadBtn.style.display = shouldShowDownload ? '' : 'none';
    }
    
    // Equipment button: visible ONLY if coming from chargen AND max level reached AND confirmed
    if (equipmentBtn) {
      const shouldShowEquipment = isMaxLevel && allConfirmed && showEquipmentBtn;
      equipmentBtn.style.display = shouldShowEquipment ? '' : 'none';
    }
  }
}

// Level up function
function levelUp() {
  console.log('%c[LEVEL UP BUTTON CLICKED]', 'color: #4CAF50; font-weight: bold;');
  
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  const maxLevel = prodConfig.chargenMaxLevel || 4;
  
  console.log('  currentLevel:', currentLevel);
  console.log('  maxLevel:', maxLevel);
  console.log('  currentLevel >= maxLevel?', currentLevel >= maxLevel);
  console.log('  prodConfig.chargenMaxLevel:', prodConfig.chargenMaxLevel);
  console.log('  characterData.totalXP:', characterData.totalXP);
  
  // Check if character has reached the maximum allowed level
  // chargenMaxLevel represents the maximum level the character can reach
  if (currentLevel >= maxLevel) {
    console.log('  ✗ BLOCKED: Cannot level up beyond', maxLevel);
    alert(`Character has reached the maximum level of ${maxLevel}!`);
    return;
  }
  
  console.log('  ✓ Passed max level check, continuing level up...');
  
  // Ensure attributes exist and are valid
  let attributes = characterData.attributes || {};
  
  // If attributes is empty or missing required fields, use defaults
  if (!attributes.intelligence || !attributes.strength || !attributes.perception || !attributes.endurance || !attributes.charisma || !attributes.agility || !attributes.luck) {
    attributes = {
      strength: attributes.strength || 5,
      perception: attributes.perception || 5,
      endurance: attributes.endurance || 5,
      charisma: attributes.charisma || 5,
      intelligence: attributes.intelligence || 5,
      agility: attributes.agility || 5,
      luck: attributes.luck || 5
    };
  }
  const selectedTraits = characterData.selectedTraits || characterData.traits || [];
  const effectiveAttributes = getEffectiveAttributes(attributes, selectedTraits);
  
  // Check if player is level 1 and needs to spend skill points
  if (currentLevel > 1 && !characterData.skillsConfirmed) {
    // Calculate available skill points for current level (with perk effects)
    const perkEffects = characterData.perkEffects || {};
    const spPerLevel = calculateSkillPointsGainWithPerks(effectiveAttributes.intelligence, perkEffects);
    const totalUsed = Object.values(characterData.skillPointsSpent).reduce((sum, val) => sum + val, 0);
    const availablePoints = spPerLevel - totalUsed;
    
    // Check if all skill points are spent
    if (availablePoints > 0) {
      alert('You must spend all available skill points before leveling up!');
      return;
    }
  }
  
  // Check if perks are available and if player has selected enough
  const perksEarned = calculatePerksEarned(currentLevel, characterData.race || 'Human', characterData.selectedTraits || []);
  
  // Calculate how many perk ranks are actually available to spend at this level
  const selectedPerks = characterData.selectedPerks || [];
  const lockedRanks = selectedPerks
    .filter(p => p.lockedAtLevel && p.lockedAtLevel < currentLevel)
    .reduce((sum, p) => sum + p.rank, 0);
  const newAvailableRanks = perksEarned - lockedRanks;
  
  // Only require confirmation if there are new ranks available to spend
  if (newAvailableRanks > 0 && !characterData.perksConfirmed) {
    alert(`You must select and confirm ${newAvailableRanks} perk rank${newAvailableRanks !== 1 ? 's' : ''} before leveling up!`);
    return;
  }
  
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  characterData.totalXP = nextLevelXP;
  
  console.log('  XP for next level:', nextLevelXP);
  console.log('  Updated totalXP:', characterData.totalXP);
  
  // Recalculate perksEarned for the NEW level (now that we've updated totalXP)
  const newLevelCalculated = getLevelFromXP(characterData.totalXP);
  const perksEarnedAtNewLevel = calculatePerksEarned(newLevelCalculated, characterData.race || 'Human', characterData.selectedTraits || []);
  console.log(`  perksEarned recalculated for new level ${newLevelCalculated}: ${perksEarnedAtNewLevel}`);
  
  // Lock in currently selected perks at this level (they become locked for future level-ups)
  console.log(`%c[LOCKING PERKS AT LEVEL ${currentLevel}]`, 'color: #FF5722; font-weight: bold;');
  selectedPerks.forEach(perk => {
    // Mark perks as locked at current level if not already locked
    // This means these perks can't be changed once we level up past this level
    const wasLocked = !!perk.lockedAtLevel;
    if (!perk.lockedAtLevel) {
      console.log(`  → Perk ${perk.id}:`);
      console.log(`      BEFORE: rank=${perk.rank}, lockedAtLevel=${perk.lockedAtLevel}, lockedRank=${perk.lockedRank}, modifiedAtLevel=${perk.modifiedAtLevel}`);
      perk.lockedAtLevel = currentLevel;
      perk.lockedRank = perk.rank; // Store what rank it was when locked
      console.log(`      AFTER:  rank=${perk.rank}, lockedAtLevel=${perk.lockedAtLevel}, lockedRank=${perk.lockedRank}, modifiedAtLevel=${perk.modifiedAtLevel}`);
    } else {
      console.log(`  → Perk ${perk.id}: Already locked at level ${perk.lockedAtLevel}, NOT locking again`);
    }
    // Clear the modifiedAtLevel so they can't be removed after level up
    if (perk.modifiedAtLevel !== undefined) {
      console.log(`      Clearing modifiedAtLevel (was ${perk.modifiedAtLevel})`);
      perk.modifiedAtLevel = undefined;
    }
    // NOTE: Do NOT clear rankedUpAtLevel - it tracks when this perk was ranked up after locking
    // This allows us to later remove just the ranks added after the lock
  });
  console.log(`%c[PERKS LOCKED - FINAL STATE]`, 'color: #FF5722; font-weight: bold;');
  selectedPerks.forEach((p, idx) => {
    console.log(`  [${idx}] ${p.id}: rank=${p.rank}, lockedAtLevel=${p.lockedAtLevel}, lockedRank=${p.lockedRank}`);
  });
  
  characterData.selectedPerks = selectedPerks;
  
  // Apply skill points spent to permanent character skill increases, respecting tag skill bonus
  const tagSkills = characterData.tagSkills || {};
  const pointsSpent = characterData.skillPointsSpent || {};
  
  if (!characterData.skillIncreases) {
    characterData.skillIncreases = {};
  }
  
  // Add spent points to each skill (tag skills gain 2% per point UNTIL 100%, then 1% per point)
  Object.keys(pointsSpent).forEach(skillKey => {
    const points = pointsSpent[skillKey];
    if (points > 0) {
      const isTag = tagSkills[skillKey];
      let percentGain = 0;
      
      if (isTag) {
        // For tagged skills, use bracket-aware gain calculation
        const baseSkills = calculateBaseSkills(characterData.attributes || {});
        const allSkills = calculateFinalSkills(characterData.attributes || {}, tagSkills, characterData.selectedTraits || characterData.traits || []);
        const baseSkillValue = allSkills[skillKey] || 0;  // Base from character creation
        const accumulatedIncrease = characterData.skillIncreases[skillKey] || 0;  // Increases from previous levels
        
        // Simulate spending the SP to find the correct gain
        let simValue = baseSkillValue + accumulatedIncrease;
        let tempSPSpent = 0;
        
        while (tempSPSpent < points) {
          const costThisSP = getSkillProgressionCost(simValue, true);
          const gainThisSP = getSkillGainPerSP(simValue, true);
          
          // Only advance if we have enough SP left to spend
          if (tempSPSpent + costThisSP <= points) {
            percentGain += gainThisSP;
            simValue += gainThisSP;
            tempSPSpent += costThisSP;
          } else {
            // We've spent all available SP, stop
            break;
          }
        }
        
        if (skillKey === 'barter') {
        }
      } else {
        // Non-tagged skills: each SP gives 1% gain, but cost per SP varies
        let simValue = (characterData.skillIncreases[skillKey] || 0);
        let tempSPSpent = 0;
        
        while (tempSPSpent < points) {
          const costThisSP = getSkillProgressionCost(simValue, false);
          const gainThisSP = getSkillGainPerSP(simValue, false);
          
          // Only advance if we have enough SP left to spend
          if (tempSPSpent + costThisSP <= points) {
            percentGain += gainThisSP;
            simValue += gainThisSP;
            tempSPSpent += costThisSP;
          } else {
            // We've spent all available SP, stop
            break;
          }
        }
      }
      
      const newIncrease = (characterData.skillIncreases[skillKey] || 0) + percentGain;
      if (skillKey === 'barter') {
      }
      characterData.skillIncreases[skillKey] = newIncrease;
      // NOTE: Do NOT cap at 100% here - skills can exceed 100% through skill point spending
    }
  });
  
  // Reset skill points spent so they can be re-allocated for the new level
  characterData.skillPointsSpent = {};
  
  // Reset skill confirmation so the skill section shows for the new level
  characterData.skillsConfirmed = false;
  
  // Reset perk confirmation for the new level
  // If we earned perks THIS NEW LEVEL, the player must select them (perksConfirmed = false)
  // If we didn't earn perks (perksEarnedAtNewLevel === 0), auto-confirm since there's nothing to select
  characterData.perksConfirmed = (perksEarnedAtNewLevel === 0);
  console.log(`  → Reset perksConfirmed to ${characterData.perksConfirmed} (perksEarnedAtNewLevel=${perksEarnedAtNewLevel})`);
  
  // After leveling up during chargen, clear the fromChargen flag so next page load
  // treats this as a normal session (character can only level up 1 more time if loaded from levelup.html)
  const fromChargen = localStorage.getItem('fromChargen') === 'true';
  console.log('  fromChargen flag before cleanup:', fromChargen);
  
  const newLevel = getLevelFromXP(characterData.totalXP);
  console.log('  newLevel (calculated after XP update):', newLevel);
  console.log('  maxLevel:', maxLevel);
  console.log('  newLevel >= maxLevel?', newLevel >= maxLevel);
  
  if (fromChargen && newLevel < maxLevel) {
    // Still in chargen phase - keep the flag
    console.log('  → Keeping fromChargen flag (still leveling up)');
    localStorage.setItem('fromChargen', 'true');
  } else if (fromChargen && newLevel >= maxLevel) {
    // Chargen is complete (reached max level) - clear the flag
    console.log('  → Clearing fromChargen flag (chargen complete, reached max level)');
    localStorage.removeItem('fromChargen');
  }
  
  console.log('  Flags after cleanup:', {
    fromChargen: localStorage.getItem('fromChargen'),
    isLevelUpSession: localStorage.getItem('isLevelUpSession')
  });
  
  saveCharacterData();
  updateCharacterSummary();
  updateDisplay();
  renderOutput(characterData);
}

// Render list of available perks
function renderAvailablePerks(eligiblePerkIds) {
  const container = qs('available-perks-container');
  const noPerksMsg = qs('no-perks-msg');
  const selectedPerks = characterData.selectedPerks || [];
  
  // DEBUG: Check if Gain X perks exist in PERKS object
  
  // Filter out perks that have reached maximum rank
  const availablePerkIds = eligiblePerkIds.filter(perkId => {
    const perk = PERKS[perkId];
    const selectedPerk = selectedPerks.find(p => p.id === perkId);
    const currentRank = selectedPerk ? selectedPerk.rank : 0;
    // Only show perks that haven't reached max rank, or perks not yet selected
    const isAvailable = perk && currentRank < perk.ranks;
    
    // Always log Gain X perks for debugging
    if (['gain_strength', 'gain_perception', 'gain_endurance', 'gain_charisma', 'gain_intelligence', 'gain_agility', 'gain_luck'].includes(perkId)) {
    }
    return isAvailable;
  });
  
  
  if (!container) return;
  
  if (availablePerkIds.length === 0) {
    container.innerHTML = '';
    if (noPerksMsg) noPerksMsg.style.display = 'block';
    return;
  }
  
  if (noPerksMsg) noPerksMsg.style.display = 'none';
  
  container.innerHTML = availablePerkIds.map(perkId => {
    const perk = PERKS[perkId];
    if (!perk) return '';
    
    const selectedPerk = selectedPerks.find(p => p.id === perkId);
    const currentRank = selectedPerk ? selectedPerk.rank : 0;
    const rankDisplay = currentRank > 0 ? `${currentRank}/${perk.ranks}` : `0/${perk.ranks}`;
    const borderColor = currentRank > 0 ? '#4CAF50' : '#666';
    const bgColor = currentRank > 0 ? '#2a3a2a' : '#333';
    
    // Determine button text: "Select Perk" for new, "Rank Up" for already selected
    const buttonText = currentRank > 0 ? 'Rank Up' : 'Select Perk';
    const buttonColor = currentRank > 0 ? '#4CAF50' : '#2196F3';
    
    return `
      <div 
        class="perk-item" 
        data-perk-id="${perkId}"
        style="margin-bottom: 8px; padding: 8px; background-color: ${bgColor}; border-left: 3px solid ${borderColor}; border-radius: 2px; transition: all 0.2s;"
      >
        <div style="font-weight: bold; color: #4CAF50;">${perk.name} <span style="color: #4CAF50; font-size: 0.9rem;">[${rankDisplay}]</span></div>
        <div style="font-size: 0.9rem; color: #ddd; margin: 4px 0;">${perk.description}</div>
        <div style="font-size: 0.85rem; color: #aaa; margin-bottom: 6px;">${perk.effects}</div>
        <button 
          type="button"
          class="select-perk-btn" 
          data-perk-id="${perkId}"
          style="width: 100%; padding: 6px 8px; background-color: ${buttonColor}; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 0.9rem; font-weight: bold; transition: all 0.2s;"
          onmouseover="this.style.opacity='0.8';"
          onmouseout="this.style.opacity='1';"
        >
          ${buttonText}
        </button>
      </div>
    `;
  }).join('');
  
  // Attach click handlers to select perk buttons
  document.querySelectorAll('.select-perk-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const perkId = btn.dataset.perkId;
      togglePerkSelection(perkId);
    });
  });
}

// Toggle perk selection
function togglePerkSelection(perkId) {
  console.log(`%c[TOGGLE PERK] Clicked perk: ${perkId}`, 'color: #FF9800; font-weight: bold;');
  
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  const race = characterData.race || 'Human';
  const selectedTraits = characterData.selectedTraits || [];
  const perksEarned = calculatePerksEarned(currentLevel, race, selectedTraits);
  let selectedPerks = characterData.selectedPerks || [];
  const perk = PERKS[perkId];
  
  console.log(`  currentLevel: ${currentLevel}, race: ${race}, traits: ${selectedTraits.join(', ') || 'none'}`);
  console.log(`  perksEarned THIS level: ${perksEarned}, perk: ${perk?.name || 'NOT FOUND'}`);
  console.log(`  → This level allows ${perksEarned} perk selection${perksEarned !== 1 ? 's' : ''}`);
  
  if (!perk) {
    console.log('  ✗ Perk not found in PERKS object');
    return;
  }
  
  const selectedPerkIndex = selectedPerks.findIndex(p => p.id === perkId);
  const selectedPerk = selectedPerkIndex !== -1 ? selectedPerks[selectedPerkIndex] : null;
  
  console.log(`  selectedPerk exists: ${!!selectedPerk}${selectedPerk ? ` (rank ${selectedPerk.rank}/${perk.ranks})` : ''}`);
  
  // Count how many NEW perk SELECTIONS are used at THIS LEVEL ONLY
  // Only count perks that were newly selected at this level (not rank-ups to locked perks)
  const newlySelectedCount = selectedPerks
    .filter(p => {
      // Don't count if perk was locked in a previous level (those are rank-ups)
      if (p.lockedAtLevel !== undefined && p.lockedAtLevel < currentLevel) return false;
      // Only count if it's being modified at this level
      return p.modifiedAtLevel === currentLevel;
    })
    .length; // Count individual selections, not total ranks
  
  console.log(`  usedSlots (newly selected this level): ${newlySelectedCount}/${perksEarned}`);
  
  if (selectedPerk) {
    // Perk is already selected
    // If at max rank, clicking again will decrease the rank (toggle)
    console.log(`  Rank check: selectedPerk.rank=${selectedPerk.rank} (${typeof selectedPerk.rank}), perk.ranks=${perk.ranks} (${typeof perk.ranks})`);
    console.log(`  Perk state BEFORE toggle:`);
    console.log(`    - rank: ${selectedPerk.rank}`);
    console.log(`    - modifiedAtLevel: ${selectedPerk.modifiedAtLevel}`);
    console.log(`    - lockedAtLevel: ${selectedPerk.lockedAtLevel}`);
    
    if (selectedPerk.rank >= perk.ranks) {
      // At max rank - decrease the rank
      selectedPerk.rank -= 1;
      console.log(`  ✓ Decreased perk to rank ${selectedPerk.rank}`);
      
      // If rank drops to 0, remove the perk entirely
      if (selectedPerk.rank <= 0) {
        selectedPerks.splice(selectedPerkIndex, 1);
        console.log(`  ✓ Removed perk (rank 0)`);
      }
    } else {
      // Below max rank - try to rank it up
      // Check if there's a perk slot available to rank it up
      // Allow ranking up locked perks if they have available rank-up slots
      if (newlySelectedCount < perksEarned) {
        // Rank up the perk directly
        selectedPerk.rank += 1;
        
        // CRITICAL FIX: If this perk is locked, we need to track when the rank-up happened
        // so that when we later level up, we know this rank is a rank-up and not part of the locked selection
        if (selectedPerk.lockedAtLevel !== undefined) {
          // This is a locked perk - track/update its rank-up level
          const previousRankUpLevel = selectedPerk.rankedUpAtLevel;
          selectedPerk.rankedUpAtLevel = currentLevel;
          
          console.log(`  ✓ Ranked up LOCKED perk to rank ${selectedPerk.rank}`);
          console.log(`  Perk state AFTER rank-up:`);
          console.log(`    - rank: ${selectedPerk.rank} (increased from ${selectedPerk.rank - 1})`);
          console.log(`    - lockedAtLevel: ${selectedPerk.lockedAtLevel} (original lock level)`);
          console.log(`    - lockedRank: ${selectedPerk.lockedRank} (rank when locked)`);
          console.log(`    - rankedUpAtLevel: ${selectedPerk.rankedUpAtLevel} (rank-ups tracked from level ${currentLevel})`);
          if (previousRankUpLevel !== undefined && previousRankUpLevel !== currentLevel) {
            console.log(`    ⚠️  NOTE: Previous rank-ups were tracked at level ${previousRankUpLevel}, now updating to ${currentLevel}`);
          }
        } else {
          // New perk (not locked yet) - just increased rank
          console.log(`  ✓ Ranked up UNLOCKED perk to rank ${selectedPerk.rank}`);
          console.log(`  Perk state AFTER rank-up:`);
          console.log(`    - rank: ${selectedPerk.rank} (increased from ${selectedPerk.rank - 1})`);
          console.log(`    - modifiedAtLevel: ${selectedPerk.modifiedAtLevel} (selection tracking)`);
          console.log(`    - lockedAtLevel: ${selectedPerk.lockedAtLevel || 'not yet locked'}`);
        }
      } else {
        console.log(`  ✗ No slots available for rank-up`);
        alert(`You can only select ${perksEarned} perk rank${perksEarned !== 1 ? 's' : ''} at this level.`);
        return;
      }
    }
  } else {
    // Perk not selected yet, add it with rank 1
    if (newlySelectedCount < perksEarned) {
      selectedPerks.push({ id: perkId, rank: 1, modifiedAtLevel: currentLevel });
      console.log(`  ✓ Added new perk at rank 1`);
      console.log(`    - modifiedAtLevel: ${currentLevel}`);
    } else {
      console.log(`  ✗ No slots for new perk`);
      alert(`You can only select ${perksEarned} perk rank${perksEarned !== 1 ? 's' : ''} at this level.`);
      return;
    }
  }
  
  characterData.selectedPerks = selectedPerks;
  saveCharacterData();
  
  console.log(`  Calling updateDisplay()...`);
  // Re-render entire display to ensure all UI elements are properly updated
  updateDisplay();
}

// Render selected perks
function renderSelectedPerks(maxPerks, perksEarned) {
  console.log(`%c[RENDER SELECTED PERKS]`, 'color: #4CAF50; font-weight: bold;');
  
  const container = qs('selected-perks-container');
  const noSelectedMsg = qs('no-selected-perks-msg');
  const selectedPerks = characterData.selectedPerks || [];
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  
  console.log(`  maxPerks: ${maxPerks}, currentLevel: ${currentLevel}, selectedPerks.length: ${selectedPerks.length}`);
  console.log(`  PERK STATE BEFORE LOCKING LOGIC:`);
  selectedPerks.forEach((p, idx) => {
    const perk = PERKS[p.id];
    console.log(`    [${idx}] ${p.id}: rank=${p.rank}, modifiedAtLevel=${p.modifiedAtLevel}, lockedAtLevel=${p.lockedAtLevel}, lockedRank=${p.lockedRank}`);
  });
  
  // Count total perk ranks used
  const totalRanksUsed = selectedPerks.reduce((sum, p) => sum + p.rank, 0);
  console.log(`  totalRanksUsed before display: ${totalRanksUsed}`);
  
  // Calculate new available ranks (not counting locked perks)
  // Only count the ranks that were locked (not new ranks added after locking)
  const lockedRanks = selectedPerks
    .filter(p => p.lockedAtLevel && p.lockedAtLevel <= currentLevel)
    .reduce((sum, p) => {
      // For old data that has lockedAtLevel but no lockedRank, initialize to 1
      if (!p.lockedRank && p.lockedAtLevel) {
        console.log(`  → Perk ${p.id}: Initializing lockedRank=1 (was undefined, lockedAtLevel=${p.lockedAtLevel})`);
        p.lockedRank = 1;
      }
      const perkLocked = p.lockedRank || 0;
      console.log(`  → Perk ${p.id}: rank=${p.rank}, lockedRank=${perkLocked}, adding ${perkLocked} to locked total`);
      return sum + perkLocked;
    }, 0);
  console.log(`  lockedRanks final total: ${lockedRanks}`);
  
  // Calculate rank-up slots available on locked perks
  // For each locked perk, you can earn: (max ranks - locked ranks) more ranks
  const rankUpSlotsAvailable = selectedPerks
    .filter(p => p.lockedAtLevel && p.lockedAtLevel < currentLevel)
    .reduce((sum, p) => {
      const perk = PERKS[p.id];
      if (!perk) return sum;
      const lockedRank = p.lockedRank || 1;
      const availableSlots = Math.max(0, perk.ranks - lockedRank);
      console.log(`  → Perk ${p.id}: max=${perk.ranks}, locked=${lockedRank}, available=${availableSlots}`);
      return sum + availableSlots;
    }, 0);
  console.log(`  rankUpSlotsAvailable: ${rankUpSlotsAvailable}`);
  
  const newAvailableRanks = maxPerks - lockedRanks;
  const totalAvailableSlots = maxPerks + rankUpSlotsAvailable;
  
  // Unlocked ranks = new ranks added after locking (total - locked)
  const unlockedRanksUsed = totalRanksUsed - lockedRanks;
  
  console.log(`  totalRanksUsed: ${totalRanksUsed}, lockedRanks: ${lockedRanks}, newAvailableRanks: ${newAvailableRanks}, rankUpSlotsAvailable: ${rankUpSlotsAvailable}, totalAvailableSlots: ${totalAvailableSlots}, unlockedRanksUsed: ${unlockedRanksUsed}`);
  
  if (qs('selected_perks_count')) {
    qs('selected_perks_count').textContent = totalRanksUsed;
    console.log(`  → Set selected_perks_count to ${totalRanksUsed}`);
  }
  if (qs('max_selectable_perks')) {
    // Count perks that aren't newly selected at this level (were carried forward from before)
    const preexistingPerks = selectedPerks
      .filter(p => p.modifiedAtLevel !== currentLevel)
      .length;
    // Denominator: perks from before this level + new slots earned this level
    const totalCapacity = preexistingPerks + perksEarned;
    qs('max_selectable_perks').textContent = totalCapacity;
    console.log(`  → Set max_selectable_perks to ${totalCapacity} (${preexistingPerks} preexisting + ${perksEarned} new)`);
  }
  
  if (!container || selectedPerks.length === 0) {
    if (container) container.innerHTML = '';
    if (noSelectedMsg) noSelectedMsg.style.display = 'block';
    // Update button state even when no perks selected, pass total available slots
    updateConfirmPerkButtonState(0, totalAvailableSlots);
    return;
  }
  
  if (noSelectedMsg) noSelectedMsg.style.display = 'none';
  
  const perksConfirmed = characterData.perksConfirmed || false;
  
  container.innerHTML = selectedPerks.map((selection) => {
    const perk = PERKS[selection.id];
    if (!perk) return '';
    
    // SIMPLE: Perk is LOCKED if it was locked at any previous level
    // Once locked, it cannot be modified at all—no exceptions for rank-ups
    const isLocked = selection.lockedAtLevel !== undefined && selection.lockedAtLevel < currentLevel;
    
    console.log(`  [RENDER PERK] ${selection.id}:`);
    console.log(`    - rank: ${selection.rank}`);
    console.log(`    - lockedAtLevel: ${selection.lockedAtLevel}`);
    console.log(`    - lockedRank: ${selection.lockedRank}`);
    console.log(`    - rankedUpAtLevel: ${selection.rankedUpAtLevel}`);
    console.log(`    - modifiedAtLevel: ${selection.modifiedAtLevel}`);
    console.log(`    - currentLevel: ${currentLevel}`);
    console.log(`    - isLocked calculation: lockedAtLevel (${selection.lockedAtLevel}) !== undefined AND lockedAtLevel (${selection.lockedAtLevel}) < currentLevel (${currentLevel}) = ${isLocked}`);
    
    const isMaxRank = selection.rank >= perk.ranks;
    // Can remove ranks if:
    // 1. Newly selected at current level (not locked)
    // 2. OR locked perk that was ranked up at current level (can remove back to lockedRank)
    const canRemoveRank = (
      (selection.modifiedAtLevel === currentLevel && !isLocked) || // New perk
      (selection.rankedUpAtLevel === currentLevel && selection.rank > selection.lockedRank) // Ranked-up locked perk
    ) && !characterData.perksConfirmed;
    
    console.log(`    - isMaxRank: ${isMaxRank}`);
    console.log(`    - perksConfirmed: ${characterData.perksConfirmed}`);
    console.log(`    - modifiedAtLevel: ${selection.modifiedAtLevel}`);
    console.log(`    - rankedUpAtLevel: ${selection.rankedUpAtLevel}`);
    console.log(`    - isLocked: ${isLocked}`);
    console.log(`    - canRemoveRank (will show button): ${canRemoveRank}`);
    
    return `
      <div 
        class="selected-perk-item" 
        data-perk-id="${selection.id}"
        style="margin-bottom: 8px; padding: 8px; background-color: ${isLocked ? '#2a3a2a' : '#3a3a3a'}; border-left: 3px solid ${isLocked ? '#8BC34A' : '#ff9800'}; border-radius: 2px; transition: all 0.2s;"
      >
        <div style="font-weight: bold; color: ${isLocked ? '#8BC34A' : '#ff9800'};">
          ${perk.name} 
          <span style="color: ${isMaxRank ? '#8BC34A' : '#aaa'}; font-size: 0.9rem;">[${selection.rank}/${perk.ranks}]</span>
          ${isLocked ? '<span style="color: #8BC34A; font-size: 0.85rem; margin-left: 8px;">✓ LOCKED</span>' : ''}
        </div>
        <div style="font-size: 0.9rem; color: #ddd; margin: 4px 0;">${perk.description}</div>
        <div style="font-size: 0.85rem; color: #aaa; margin-bottom: 6px;">${perk.effects}</div>
        <div style="margin-top: 6px; display: flex; gap: 4px;">
          ${!canRemoveRank ? 
            `<div style="flex: 1; padding: 6px 8px; background-color: #1a4d1a; color: #8BC34A; border-radius: 2px; font-size: 0.85rem; text-align: center; font-weight: bold;">Locked - No Rank-Ups</div>` :
            `<button 
              type="button"
              class="remove-rank-btn"
              data-perk-id="${selection.id}"
              style="flex: 1; padding: 6px 8px; background-color: #d32f2f; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: all 0.2s;"
              onmouseover="this.style.opacity='0.8';"
              onmouseout="this.style.opacity='1';"
            >
              Remove Rank
            </button>`
          }
        </div>
      </div>
    `;
  }).join('');
  
  // Attach remove handlers
  const removeButtons = document.querySelectorAll('.remove-rank-btn');
  console.log(`  → Found ${removeButtons.length} remove-rank buttons to attach handlers`);
  removeButtons.forEach((btn, idx) => {
    const perkId = btn.dataset.perkId;
    console.log(`    [${idx}] Attaching click handler for perk: ${perkId}`);
    btn.addEventListener('click', (e) => {
      console.log(`%c[REMOVE RANK BUTTON CLICKED]`, 'color: #FF6B6B; font-weight: bold;', `perkId=${perkId}`);
      e.stopPropagation();
      removeRank(perkId);
    });
  });
  
  // Update confirm button state (only pass NEW perk slots earned this level, not rank-up slots)
  console.log(`  → Calling updateConfirmPerkButtonState(${unlockedRanksUsed}, ${perksEarned})`);
  updateConfirmPerkButtonState(unlockedRanksUsed, perksEarned);
}

// Remove a rank from a perk
function removeRank(perkId) {
  console.log('%c[REMOVE RANK FUNCTION CALLED]', 'color: #FF6B6B; font-weight: bold;', `perkId=${perkId}`);
  
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  console.log(`  → currentLevel from XP: ${currentLevel}`);
  
  const selectedPerks = characterData.selectedPerks || [];
  console.log(`  → selectedPerks array length: ${selectedPerks.length}`);
  
  const selectedPerkIndex = selectedPerks.findIndex(p => p.id === perkId);
  console.log(`  → selectedPerkIndex: ${selectedPerkIndex}`);
  
  if (selectedPerkIndex === -1) {
    console.log(`  ✗ PERK NOT FOUND in selectedPerks array! Returning early.`);
    return;
  }
  
  const selectedPerk = selectedPerks[selectedPerkIndex];
  const perksConfirmed = characterData.perksConfirmed || false;
  
  // EARLY GUARD: If perk is locked AND at or below locked rank, block removal
  // (But allow removal of rank-ups added above the locked rank)
  if (selectedPerk.lockedAtLevel !== undefined && selectedPerk.rank <= selectedPerk.lockedRank) {
    console.log(`%c[REMOVE RANK BLOCKED]`, 'color: #ff0000; font-weight: bold;', `Perk is at or below its locked rank ${selectedPerk.lockedRank}`);
    alert('Cannot remove rank: This perk is at its locked rank from level ' + selectedPerk.lockedAtLevel + '. You can only add ranks to locked perks, not remove them below the locked rank.');
    return;
  }
  
  console.log(`[REMOVE RANK] ${perkId}:`);
  console.log(`  Current state:`);
  console.log(`    - rank: ${selectedPerk.rank}`);
  console.log(`    - lockedAtLevel: ${selectedPerk.lockedAtLevel}`);
  console.log(`    - lockedRank: ${selectedPerk.lockedRank}`);
  console.log(`    - rankedUpAtLevel: ${selectedPerk.rankedUpAtLevel}`);
  console.log(`    - modifiedAtLevel: ${selectedPerk.modifiedAtLevel}`);
  console.log(`    - perksConfirmed: ${perksConfirmed}`);
  console.log(`    - currentLevel: ${currentLevel}`);
  
  // Determine the removal floor and what's allowed
  const isNewlySelectedThisLevel = selectedPerk.modifiedAtLevel === currentLevel;
  const isLockedPerk = selectedPerk.lockedAtLevel !== undefined;
  const wasRankedUpThisLevel = selectedPerk.rankedUpAtLevel === currentLevel;
  const aboveLockedRank = selectedPerk.rank > (selectedPerk.lockedRank || 1);
  
  console.log(`  Analysis:`);
  console.log(`    - isNewlySelectedThisLevel (modifiedAtLevel=${selectedPerk.modifiedAtLevel} === currentLevel=${currentLevel}): ${isNewlySelectedThisLevel}`);
  console.log(`    - isLockedPerk (lockedAtLevel=${selectedPerk.lockedAtLevel} !== undefined): ${isLockedPerk}`);
  console.log(`    - wasRankedUpThisLevel (rankedUpAtLevel=${selectedPerk.rankedUpAtLevel} === currentLevel=${currentLevel}): ${wasRankedUpThisLevel}`);
  console.log(`    - aboveLockedRank (rank=${selectedPerk.rank} > lockedRank=${selectedPerk.lockedRank}): ${aboveLockedRank}`);
  console.log(`    - perksConfirmed: ${perksConfirmed}`);
  
  // Determine if removal is allowed and what the floor is
  let canRemove = false;
  let removalFloor = 1;
  let removalReason = '';
  
  if (isNewlySelectedThisLevel) {
    console.log(`  → CASE 1: Newly selected this level`);
    console.log(`    Setting: canRemove=true, removalFloor=0`);
    canRemove = true;
    removalFloor = 0;
  } else if (isLockedPerk && perksConfirmed) {
    console.log(`  → CASE 4: Locked at level ${selectedPerk.lockedAtLevel} AND perks CONFIRMED`);
    console.log(`    ✗ BLOCKING removal - alert user`);
    alert(`This perk was locked and confirmed. You can only rank it up further at future levels.`);
    return;
  } else if (isLockedPerk && aboveLockedRank) {
    console.log(`  → CASE 2/3: Locked perk with ranks above locked rank`);
    console.log(`    rank=${selectedPerk.rank}, lockedRank=${selectedPerk.lockedRank}`);
    console.log(`    Setting: canRemove=true, removalFloor=${selectedPerk.lockedRank || 1}`);
    canRemove = true;
    removalFloor = selectedPerk.lockedRank || 1;
  } else if (isLockedPerk && !aboveLockedRank) {
    console.log(`  → CASE LOCKED AT FLOOR: Locked perk at exactly locked rank`);
    console.log(`    rank=${selectedPerk.rank}, lockedRank=${selectedPerk.lockedRank}`);
    console.log(`    ✗ BLOCKING removal - alert user`);
    alert(`This perk is locked at rank ${selectedPerk.lockedRank}. You can only rank it up further.`);
    return;
  } else {
    console.log(`  → UNKNOWN CASE: No conditions matched`);
    console.log(`    isNewlySelectedThisLevel=${isNewlySelectedThisLevel}, isLockedPerk=${isLockedPerk}, perksConfirmed=${perksConfirmed}, aboveLockedRank=${aboveLockedRank}`);
  }
  
  if (!canRemove) {
    console.log(`  ✗ Cannot remove: canRemove is false, unknown state`);
    return;
  }
  
  console.log(`  ✓ Removal is ALLOWED`);
  console.log(`  Checking removal conditions:`);
  console.log(`    - rank (${selectedPerk.rank}) === 1? ${selectedPerk.rank === 1}`);
  console.log(`    - removalFloor (${removalFloor}) === 0? ${removalFloor === 0}`);
  console.log(`    - rank (${selectedPerk.rank}) > removalFloor (${removalFloor})? ${selectedPerk.rank > removalFloor}`);
  
  // Perform the removal
  if (selectedPerk.rank === 1 && removalFloor === 0) {
    console.log(`  → REMOVE ENTIRELY: rank=1 AND floor=0 (newly selected)`);
    console.log(`    Splicing perk from selectedPerks array at index ${selectedPerkIndex}`);
    selectedPerks.splice(selectedPerkIndex, 1);
    console.log(`  ✓ REMOVED entirely (newly selected, rank was 1)`);
    console.log(`    selectedPerks length is now: ${selectedPerks.length}`);
  } else if (selectedPerk.rank > removalFloor) {
    console.log(`  → DECREASE RANK: rank (${selectedPerk.rank}) > floor (${removalFloor})`);
    selectedPerk.rank -= 1;
    console.log(`  ✓ DECREASED rank to ${selectedPerk.rank} (floor was ${removalFloor})`);
    
    if (selectedPerk.rankedUpAtLevel !== undefined && selectedPerk.rank === selectedPerk.lockedRank) {
      console.log(`    → Rank now equals lockedRank, clearing rankedUpAtLevel`);
      selectedPerk.rankedUpAtLevel = undefined;
      console.log(`    → Cleared rankedUpAtLevel (back to lockedRank)`);
    } else {
      console.log(`    → NOT clearing rankedUpAtLevel: rankedUpAtLevel=${selectedPerk.rankedUpAtLevel}, lockedRank=${selectedPerk.lockedRank}`);
    }
  } else {
    console.log(`  ✗ CANNOT DECREASE: rank (${selectedPerk.rank}) NOT > floor (${removalFloor})`);
    console.log(`    Condition: ${selectedPerk.rank} > ${removalFloor} = ${selectedPerk.rank > removalFloor}`);
    alert(`Cannot rank down below ${removalFloor}. This perk is locked to that rank.`);
    return;
  }
  
  console.log(`  → Saving characterData to localStorage`);
  characterData.selectedPerks = selectedPerks;
  saveCharacterData();
  console.log(`  ✓ Character data saved`);
  
  console.log(`  → Re-rendering UI`);
  // Re-render
  const perksEarned = calculatePerksEarned(currentLevel, characterData.race || 'Human', characterData.selectedTraits || []);
  console.log(`  → perksEarned recalculated: ${perksEarned}`);
  
  const attributes = characterData.attributes || {};
  const character = {
    level: currentLevel,
    race: characterData.race || 'Human',
    attributes: attributes,
    skills: calculateFinalSkills(attributes, characterData.tagSkills || {}),
    karma: 0,
    selectedPerks: characterData.selectedPerks || []
  };
  
  const eligiblePerkIds = getEligiblePerks(character);
  console.log(`  → Rendering available perks`);
  renderAvailablePerks(eligiblePerkIds);
  console.log(`  → Rendering selected perks`);
  renderSelectedPerks(perksEarned, perksEarned);
  console.log(`%c[REMOVE RANK COMPLETE]`, 'color: #4CAF50; font-weight: bold;');
}

function getTimestamp() {
  // Returns YYYY-MM-DD format for consistency across all screens
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const timestamp = getTimestamp();
  a.download = filename || `${obj.name || 'characterSheet'}_${timestamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  
  // After downloading, redirect to home page
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

function renderOutput(obj){
  if (qs('output')) {
    // Create a display copy with calculated final skills that include leveling increases
    const displayObj = JSON.parse(JSON.stringify(obj)); // Deep copy
    
    // If we have skill increases, apply them to the display skills
    if (displayObj.skillIncreases && displayObj.skills) {
      const updatedSkills = { ...displayObj.skills };
      Object.keys(displayObj.skillIncreases).forEach(skillKey => {
        const increase = displayObj.skillIncreases[skillKey];
        if (updatedSkills[skillKey] !== undefined) {
          updatedSkills[skillKey] = Math.min(updatedSkills[skillKey] + increase, 100);
        }
      });
      displayObj.skills = updatedSkills;
    }
    
    qs('output').textContent = JSON.stringify(displayObj, null, 2)
  }
}

function handleFileLoad(file){
  const reader = new FileReader()
  reader.onload = e => {
    try{
      characterData = JSON.parse(e.target.result)
      saveCharacterData();
      updateDisplay();
      renderOutput(characterData);
      alert('Loaded character JSON')
    }catch(err){
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(file)
}

// #region SKILL RANKING SYSTEM

/**
 * Initialize skill ranking section with event listeners
 */
function initializeSkillRanking() {
  const resetBtn = qs('reset-skill-points-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSkillPoints);
  }

  const confirmBtn = qs('confirm-skill-allocation-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmSkillAllocation);
  }

  const unconfirmBtn = qs('unconfirm-skill-allocation-btn');
  if (unconfirmBtn) {
    unconfirmBtn.addEventListener('click', unconfirmSkillAllocation);
  }

  const confirmPerkBtn = qs('confirm-perk-selection-btn');
  if (confirmPerkBtn) {
    confirmPerkBtn.addEventListener('click', confirmPerkSelection);
  }

  const unconfirmPerkBtn = qs('unconfirm-perk-selection-btn');
  if (unconfirmPerkBtn) {
    unconfirmPerkBtn.addEventListener('click', unconfirmPerkSelection);
  }
}

/**
 * Update the skill ranking display
 */
function updateSkillRanking() {
  const totalXP = characterData.totalXP || 0;
  const xpProgress = getXPProgress(totalXP);
  const currentLevel = xpProgress.level;
  
  // Ensure attributes exist and are valid
  let attributes = characterData.attributes || {};
  
  // If attributes is empty or missing required fields, use defaults
  if (!attributes.intelligence || !attributes.strength || !attributes.perception || !attributes.endurance || !attributes.charisma || !attributes.agility || !attributes.luck) {
    attributes = {
      strength: attributes.strength || 5,
      perception: attributes.perception || 5,
      endurance: attributes.endurance || 5,
      charisma: attributes.charisma || 5,
      intelligence: attributes.intelligence || 5,
      agility: attributes.agility || 5,
      luck: attributes.luck || 5
    };
  }
  
  // Apply trait modifiers
  const selectedTraits = characterData.selectedTraits || characterData.traits || [];
  const effectiveAttributes = getEffectiveAttributes(attributes, selectedTraits);
  
  
  // No skill points at level 1
  if (currentLevel === 1) {
    if (qs('skill_points_available')) qs('skill_points_available').textContent = '0';
    if (qs('skill_points_used')) qs('skill_points_used').textContent = '0';
    const container = qs('skills-container');
    const noSkillsMsg = qs('no-skills-msg');
    if (container) container.innerHTML = '';
    if (noSkillsMsg) {
      noSkillsMsg.textContent = 'Skill points available at level 2 and beyond.';
      noSkillsMsg.style.display = 'block';
    }
    
    // Hide confirmation buttons at level 1
    const confirmBtn = qs('confirm-skill-allocation-btn');
    const unconfirmBtn = qs('unconfirm-skill-allocation-btn');
    if (confirmBtn) confirmBtn.style.display = 'none';
    if (unconfirmBtn) unconfirmBtn.style.display = 'none';
    
    // Update confirm button state to handle skills section visibility (no available points)
    updateConfirmButtonState(0);
    return;
  }
  
  // Calculate available skill points for THIS LEVEL ONLY (with perk effects)
  const perkEffects = characterData.perkEffects || {};
  const spPerLevel = calculateSkillPointsGainWithPerks(effectiveAttributes.intelligence, perkEffects);
  
  // Initialize skill tracking if needed
  if (!characterData.skillPointsSpent) {
    characterData.skillPointsSpent = {};
  }
  if (!characterData.skillIncreases) {
    characterData.skillIncreases = {};
  }
  
  // Get base attributes for skill calculations
  const baseAttributes = attributes;
  const tagSkills = characterData.tagSkills || {};
  
  
  // Calculate actual SP spent THIS LEVEL (not just count of increases)
  // Use perk-adjusted attributes for skill calculations
  const attributesWithPerks = getAttributesWithPerkBonuses(effectiveAttributes, perkEffects);
  const baseSkills = calculateBaseSkills(attributesWithPerks);
  const allSkills = calculateFinalSkills(attributesWithPerks, tagSkills, selectedTraits);
  const skillIncreases = characterData.skillIncreases || {};
  
  // Each click/SP spent = 1 whole SP, no fractional costs
  let totalSPSpent = 0;
  for (const skillKey of Object.keys(characterData.skillPointsSpent || {})) {
    const clicksThisLevel = characterData.skillPointsSpent[skillKey] || 0;
    // Each click = 1 SP, so total SP = number of clicks
    totalSPSpent += clicksThisLevel;
  }
  
  const availablePoints = spPerLevel - totalSPSpent;
  
  // Update display - values are already whole numbers now
  if (qs('skill_points_available')) qs('skill_points_available').textContent = Math.max(0, availablePoints);
  if (qs('skill_points_used')) qs('skill_points_used').textContent = totalSPSpent;
  
  // Update confirm button state and visibility of skills section
  updateConfirmButtonState(availablePoints);
  
  // Render skills list - pass BOTH base and effective attributes
  renderSkillsList(availablePoints > 0, attributes, effectiveAttributes);
}

/**
 * Render the list of available skills with +/- buttons
 * @param {boolean} hasPointsAvailable - Whether skill points are available to spend
 * @param {object} baseAttributes - Base character attributes (before trait mods)
 * @param {object} effectiveAttributes - Effective attributes (with trait mods applied)
 */
function renderSkillsList(hasPointsAvailable, baseAttributes, effectiveAttributes) {
  const container = qs('skills-container');
  const noSkillsMsg = qs('no-skills-msg');
  const tagSkills = characterData.tagSkills || {};
  
  if (!container) return;
  
  // Apply perk bonuses to effective attributes for skill calculations
  const perkEffects = characterData.perkEffects || {};
  const attributesWithPerks = getAttributesWithPerkBonuses(effectiveAttributes, perkEffects);
  
  // Get base skills calculated with perk-adjusted attributes
  // This ensures skills reflect all modifiers: base + traits + perks
  const baseSkills = calculateBaseSkills(attributesWithPerks);
  const allSkills = calculateFinalSkills(attributesWithPerks, tagSkills, characterData.selectedTraits || characterData.traits || []);
  
  if (Object.keys(allSkills).length === 0) {
    container.innerHTML = '';
    if (noSkillsMsg) noSkillsMsg.style.display = 'block';
    return;
  }
  
  if (noSkillsMsg) noSkillsMsg.style.display = 'none';
  
  // Calculate available points for THIS LEVEL ONLY using EFFECTIVE intelligence with perk bonuses
  const spPerLevel = calculateSkillPointsGainWithPerks(attributesWithPerks.intelligence, perkEffects);
  
  // Get accumulated skill increases from previous levels
  const skillIncreases = characterData.skillIncreases || {};
  
  // Calculate total SP spent THIS LEVEL (each click = 1 whole SP, no fractions)
  let totalSPSpent = 0;
  for (const skillKey of Object.keys(characterData.skillPointsSpent || {})) {
    const clicksThisLevel = characterData.skillPointsSpent[skillKey] || 0;
    // Each click = 1 SP, so total SP = number of clicks
    totalSPSpent += clicksThisLevel;
  }
  
  const availablePoints = spPerLevel - totalSPSpent;
  
  
  // Build header with SP usage info
  const headerHtml = ``;
  
  let skillsHtml = headerHtml;
  
  // Sort skills by display name
  const sortedSkills = Object.keys(allSkills).sort((a, b) => {
    const nameA = SKILL_DISPLAY_NAMES[a] || a;
    const nameB = SKILL_DISPLAY_NAMES[b] || b;
    return nameA.localeCompare(nameB);
  });
  
  container.innerHTML = skillsHtml + sortedSkills.map(skillKey => {
    const baseSkillValue = allSkills[skillKey];
    const displayName = SKILL_DISPLAY_NAMES[skillKey] || skillKey;
    const isTag = tagSkills[skillKey];
    const skillPointsSpent = characterData.skillPointsSpent[skillKey] || 0;
    const accumulatedIncrease = skillIncreases[skillKey] || 0;
    const borderColor = isTag ? '#8BC34A' : '#666';
    const backgroundColor = isTag ? '#2a3a2a' : '#333';
    
    if (skillKey === 'barter') {
      // Also log to localStorage for debugging
      localStorage.setItem('barter_debug_before', JSON.stringify({baseSkillValue, accumulatedIncrease, skillPointsSpent, tagSkills_barter: tagSkills['barter']}));
    }
    
    // Calculate current skill value:
    // Use proper skill bracket transitions (100%, 125%, 150%, 175%, 200%)
    let currentSkillValue;
    let currentLevelGain;
    
    if (isTag) {
      // Tagged skill: calculate with proper bracket transitions
      const baseWithAccumulated = baseSkillValue + accumulatedIncrease;
      
      // Simulate applying SP spent on this skill to find where we end up
      let simValue = baseWithAccumulated;
      let tempSPSpent = 0;
      
      // Keep spending SP until we've spent skillPointsSpent
      while (tempSPSpent < skillPointsSpent) {
        const costThisSP = getSkillProgressionCost(simValue, isTag);
        const gainThisSP = getSkillGainPerSP(simValue, isTag);
        
        // Only advance if we have enough SP left to spend
        if (tempSPSpent + costThisSP <= skillPointsSpent) {
          simValue += gainThisSP;
          tempSPSpent += costThisSP;
        } else {
          // We've spent all available SP, stop
          break;
        }
      }
      currentLevelGain = simValue - baseWithAccumulated;
      currentSkillValue = simValue;
      
      if (skillKey === 'barter') {
        localStorage.setItem('barter_debug_after', JSON.stringify({baseSkillValue, accumulatedIncrease, baseWithAccumulated, skillPointsSpent, currentSkillValue, currentLevelGain, isTag}));
      }
    } else {
      // Non-tagged skill: 1% gain per SP always, but cost in SP varies by bracket
      const baseWithAccumulated = baseSkillValue + accumulatedIncrease;
      let simValue = baseWithAccumulated;
      let tempSPSpent = 0;
      
      // Keep spending SP until we've spent skillPointsSpent
      while (tempSPSpent < skillPointsSpent) {
        const costThisSP = getSkillProgressionCost(simValue, isTag);
        const gainThisSP = getSkillGainPerSP(simValue, isTag);
        
        // Only advance if we have enough SP left to spend
        if (tempSPSpent + costThisSP <= skillPointsSpent) {
          simValue += gainThisSP;
          tempSPSpent += costThisSP;
        } else {
          // We've spent all available SP, stop
          break;
        }
      }
      currentLevelGain = simValue - baseWithAccumulated;
      currentSkillValue = simValue;
    }
    
    // Calculate cost for next increase
    const costForNext = getSkillProgressionCost(currentSkillValue, isTag);
    
    // For display purposes, show what the player actually gains per SP spent
    // Gain varies based on current skill bracket
    let displayGain = getSkillGainPerSP(currentSkillValue, isTag) + '%';
    
    // DEBUG
    if (skillKey === 'barter') {
    }
    
    return `
      <div 
        class="skill-item" 
        data-skill-key="${skillKey}"
        style="margin-bottom: 8px; padding: 8px; background-color: ${backgroundColor}; border-left: 3px solid ${borderColor}; border-radius: 2px; transition: all 0.2s;"
      >
        <div style="font-weight: bold; color: ${isTag ? '#8BC34A' : '#fff'};">${displayName} ${isTag ? '<span style="font-size: 0.75rem; margin-left: 4px; color: #8BC34A;">[TAG]</span>' : ''}</div>
        <div style="font-size: 0.9rem; color: #4CAF50; margin: 4px 0;">
          Value: <span style="font-weight: bold;">${currentSkillValue}%</span>${skillPointsSpent > 0 ? ` <span style="color: #FF9800;">(+${currentLevelGain}%)</span>` : ''}
        </div>
        <div style="display: flex; gap: 4px; margin-top: 6px;">
          <button 
            type="button"
            class="skill-decrease-btn" 
            data-skill-key="${skillKey}"
            style="flex: 1; padding: 6px 8px; background-color: #d32f2f; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 1.2rem; font-weight: bold; transition: all 0.2s; display: flex; align-items: center; justify-content: center;"
            title="Decrease skill"
            ${skillPointsSpent === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
            onmouseover="!this.disabled && (this.style.opacity='0.8')"
            onmouseout="!this.disabled && (this.style.opacity='1')"
          >
            ▼
          </button>
          <button 
            type="button"
            class="skill-increase-btn" 
            data-skill-key="${skillKey}"
            style="flex: 1; padding: 6px 8px; background-color: #4CAF50; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 1.2rem; font-weight: bold; transition: all 0.2s; display: flex; align-items: center; justify-content: center;"
            title="Increase skill (1 SP for ${displayGain})"
            ${availablePoints < 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
            onmouseover="!this.disabled && (this.style.opacity='0.8')"
            onmouseout="!this.disabled && (this.style.opacity='1')"
          >
            ▲
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Attach increase handlers
  document.querySelectorAll('.skill-increase-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const skillKey = btn.dataset.skillKey;
      if (skillKey === 'barter') {
      }
      increaseSkillPoints(skillKey);
    });
  });
  
  // Attach decrease handlers
  document.querySelectorAll('.skill-decrease-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const skillKey = btn.dataset.skillKey;
      decreaseSkillPoints(skillKey);
    });
  });
}

/**
 * Increase points spent on a skill by 1
 */
function increaseSkillPoints(skillKey) {
  const attributes = characterData.attributes || {};
  const effectiveAttributes = getEffectiveAttributes(attributes, characterData.selectedTraits || characterData.traits || []);
  const baseAttributes = characterData.attributes || { strength: 5, perception: 5, endurance: 5, charisma: 5, intelligence: 5, agility: 5, luck: 5 };
  const tagSkills = characterData.tagSkills || {};
  const isTaggedSkill = tagSkills[skillKey] || false;
  
  const perkEffects = characterData.perkEffects || {};
  const spPerLevel = calculateSkillPointsGainWithPerks(effectiveAttributes.intelligence, perkEffects);
  
  // Calculate total SP actually spent THIS LEVEL (sum of actual SP costs, not clicks)
  const allSkills = calculateFinalSkills(baseAttributes, tagSkills, characterData.selectedTraits || characterData.traits || []);
  const skillIncreases = characterData.skillIncreases || {};
  
  let totalSPSpent = 0;
  for (const sk of Object.keys(characterData.skillPointsSpent || {})) {
    totalSPSpent += (characterData.skillPointsSpent[sk] || 0);
  }
  
  const availablePoints = spPerLevel - totalSPSpent;
  
  // Calculate current skill value to determine cost of next increase
  const currentSkillBase = allSkills[skillKey] || 0;
  const accumulatedIncrease = skillIncreases[skillKey] || 0;
  const spAlreadySpentThisLevel = characterData.skillPointsSpent[skillKey] || 0;
  
  // Simulate where the skill is after all the SP already spent this level on this skill
  let currentSkillValue = currentSkillBase + accumulatedIncrease;
  let tempValue = currentSkillValue;
  let tempSPSpent = 0;
  
  // Rebuild skill value from accumulated increases + SP already spent this level
  // We need to figure out what the skill is NOW after applying the SP spent
  // by simulating backwards from SP spent
  while (tempSPSpent < spAlreadySpentThisLevel) {
    const costThisSP = getSkillProgressionCost(tempValue, isTaggedSkill);
    const gainThisSP = getSkillGainPerSP(tempValue, isTaggedSkill);
    tempValue += gainThisSP;
    tempSPSpent += costThisSP;
  }
  currentSkillValue = tempValue;
  
  // Calculate cost to advance by 1% from current position
  const costForNextGain = getSkillProgressionCost(currentSkillValue, isTaggedSkill);
  
  // Check if we have enough SP available for the next increase
  if (availablePoints < costForNextGain) {
    alert(`Not enough skill points! This increase costs ${costForNextGain}, you have ${availablePoints}.`);
    return;
  }
  
  if (!characterData.skillPointsSpent) {
    characterData.skillPointsSpent = {};
  }
  
  // Increase SP spent by the actual cost (not a simple click counter)
  characterData.skillPointsSpent[skillKey] = (characterData.skillPointsSpent[skillKey] || 0) + costForNextGain;
  saveCharacterData();
  
  // Refresh displays
  updateSkillRanking();
}

/**
 * Decrease points spent on a skill by 1 percentage point (removes last +1%)
 */
function decreaseSkillPoints(skillKey) {
  if (!characterData.skillPointsSpent || !characterData.skillPointsSpent[skillKey] || characterData.skillPointsSpent[skillKey] <= 0) {
    return;
  }
  
  const baseAttributes = characterData.attributes || { strength: 5, perception: 5, endurance: 5, charisma: 5, intelligence: 5, agility: 5, luck: 5 };
  const tagSkills = characterData.tagSkills || {};
  const isTaggedSkill = tagSkills[skillKey] || false;
  
  const allSkills = calculateFinalSkills(baseAttributes, tagSkills, characterData.selectedTraits || characterData.traits || []);
  const skillIncreases = characterData.skillIncreases || {};
  
  // Calculate current skill value considering base + accumulated + SP spent this level
  const currentSkillBase = allSkills[skillKey] || 0;
  const accumulatedIncrease = skillIncreases[skillKey] || 0;
  const spAlreadySpentThisLevel = characterData.skillPointsSpent[skillKey] || 0;
  
  // Rebuild skill value by simulating the SP already spent
  let currentSkillValue = currentSkillBase + accumulatedIncrease;
  let tempSPSpent = 0;
  
  while (tempSPSpent < spAlreadySpentThisLevel) {
    const costThisSP = getSkillProgressionCost(currentSkillValue, isTaggedSkill);
    const gainThisSP = getSkillGainPerSP(currentSkillValue, isTaggedSkill);
    currentSkillValue += gainThisSP;
    tempSPSpent += costThisSP;
  }
  
  // Now work backwards: what was the skill value before the last increase?
  // The last increase cost us some amount, we need to subtract that
  let previousSkillValue = currentSkillValue - 1; // Go back 1%
  const lastIncreaseCost = getSkillProgressionCost(previousSkillValue, isTaggedSkill);
  
  // Subtract the last increase cost from SP spent
  characterData.skillPointsSpent[skillKey] -= lastIncreaseCost;
  
  // Remove the skill entirely if no points spent
  if (characterData.skillPointsSpent[skillKey] <= 0) {
    delete characterData.skillPointsSpent[skillKey];
  }
  
  saveCharacterData();
  updateSkillRanking();
}

/**
 * Reset all skill points spent
 */
function resetSkillPoints() {
  if (confirm('Are you sure you want to reset all skill point allocations?')) {
    characterData.skillPointsSpent = {};
    saveCharacterData();
    updateSkillRanking();
    renderSkillsList();
  }
}

/**
 * Update confirm button state based on whether all points are allocated
 */
function updateConfirmButtonState(availablePoints) {
  const confirmBtn = qs('confirm-skill-allocation-btn');
  const unconfirmBtn = qs('unconfirm-skill-allocation-btn');
  const skillsSection = qs('skills-section');
  const isConfirmed = characterData.skillsConfirmed || false;
  const hasAvailablePoints = availablePoints > 0;
  const totalPoints = Object.values(characterData.skillPointsSpent || {}).reduce((sum, val) => sum + val, 0);
  const allPointsSpent = totalPoints > 0 && availablePoints === 0;
  
  if (confirmBtn) {
    if (isConfirmed) {
      confirmBtn.style.display = 'none';
    } else {
      // Only show confirm button if all points have been spent
      confirmBtn.style.display = allPointsSpent ? '' : 'none';
      confirmBtn.disabled = availablePoints > 0;
      confirmBtn.style.opacity = availablePoints > 0 ? '0.5' : '1';
      confirmBtn.style.cursor = availablePoints > 0 ? 'not-allowed' : 'pointer';
    }
  }

  if (unconfirmBtn) {
    unconfirmBtn.style.display = isConfirmed ? '' : 'none';
  }

  // Update visibility of skills section
  // Hide if: confirmed OR (no available points AND no points have been spent)
  if (skillsSection) {
    const shouldHide = isConfirmed || (availablePoints === 0 && totalPoints === 0);
    skillsSection.style.display = shouldHide ? 'none' : '';
  }
}

/**
 * Confirm skill allocation and hide the skills section
 */
function confirmSkillAllocation() {
  characterData.skillsConfirmed = true;
  saveCharacterData();
  
  // Hide the entire skills section
  const skillsSection = qs('skills-section');
  if (skillsSection) skillsSection.style.display = 'none';
  
  // Update button states for skill confirm buttons
  const confirmBtn = qs('confirm-skill-allocation-btn');
  const unconfirmBtn = qs('unconfirm-skill-allocation-btn');
  if (confirmBtn) confirmBtn.style.display = 'none';
  if (unconfirmBtn) unconfirmBtn.style.display = '';
  
  // Call updateDisplay to refresh all sections (skills, perks, level up button)
  // This will use the same visibility logic and show perks only if applicable
  updateDisplay();
  
  // Update JSON output display
  renderOutput(characterData);
}

/**
 * Unconfirm skill allocation and show the skills section
 */
function unconfirmSkillAllocation() {
  characterData.skillsConfirmed = false;
  saveCharacterData();
  
  // Show the entire skills section
  const skillsSection = qs('skills-section');
  if (skillsSection) skillsSection.style.display = '';
  
  // Hide the perks section since skills are no longer confirmed
  const perksSection = qs('perks-section');
  if (perksSection) perksSection.style.display = 'none';
  
  // Update button states
  const confirmBtn = qs('confirm-skill-allocation-btn');
  const unconfirmBtn = qs('unconfirm-skill-allocation-btn');
  if (confirmBtn) confirmBtn.style.display = '';
  if (unconfirmBtn) unconfirmBtn.style.display = 'none';
  
  // Trigger update to re-enable/disable confirm button based on available points
  updateSkillRanking();
  
  // Update JSON output display
  renderOutput(characterData);
}

/**
 * Update confirm perk button state based on whether all perks are selected
 */
function updateConfirmPerkButtonState(selectedRanks, maxPerks) {
  console.log(`%c[UPDATE CONFIRM PERK BTN]`, 'color: #FF9800; font-weight: bold;', {selectedRanks, maxPerks});
  
  const confirmBtn = qs('confirm-perk-selection-btn');
  const unconfirmBtn = qs('unconfirm-perk-selection-btn');
  const isConfirmed = characterData.perksConfirmed || false;
  const skillsConfirmed = characterData.skillsConfirmed || false;
  const allRanksSpent = selectedRanks >= maxPerks && maxPerks > 0;
  
  // Log perk state for debugging
  const selectedPerks = characterData.selectedPerks || [];
  console.log(`  PERK STATE AT BUTTON UPDATE:`);
  selectedPerks.forEach((p, idx) => {
    console.log(`    [${idx}] ${p.id}: rank=${p.rank}, modifiedAtLevel=${p.modifiedAtLevel}, lockedAtLevel=${p.lockedAtLevel}, lockedRank=${p.lockedRank}`);
  });
  
  console.log(`  isConfirmed=${isConfirmed}, skillsConfirmed=${skillsConfirmed}`);
  console.log(`  selectedRanks (${selectedRanks}) >= maxPerks (${maxPerks})? ${selectedRanks >= maxPerks}`);
  console.log(`  maxPerks > 0? ${maxPerks > 0}`);
  console.log(`  allRanksSpent=${allRanksSpent}`);
  console.log(`  Button exists: ${!!confirmBtn}`);
  console.log(`  → Should show? ${!isConfirmed && skillsConfirmed && allRanksSpent}`);
  
  if (confirmBtn) {
    // Only show confirm button if:
    // 1. Perks are not yet confirmed
    // 2. Skills ARE confirmed
    // 3. All available perk ranks have been spent
    const shouldHide = isConfirmed || !skillsConfirmed || !allRanksSpent;
    
    if (shouldHide) {
      console.log(`  ✗ HIDING button (${isConfirmed ? 'perks confirmed' : !skillsConfirmed ? 'skills NOT confirmed' : 'not all ranks spent'})`);
      confirmBtn.style.display = 'none';
    } else {
      console.log(`  ✓ SHOWING button`);
      confirmBtn.style.display = '';
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
      confirmBtn.style.cursor = 'pointer';
    }
  }

  if (unconfirmBtn) {
    unconfirmBtn.style.display = isConfirmed ? '' : 'none';
  }
}

/**
 * Confirm perk selection
 */
function confirmPerkSelection() {
  console.log(`%c[CONFIRM PERK SELECTION CLICKED]`, 'color: #4CAF50; font-weight: bold;');
  
  characterData.perksConfirmed = true;
  
  // Check if Here and Now perk is being confirmed for the first time
  const selectedPerks = characterData.selectedPerks || [];
  const hereAndNowPerk = selectedPerks.find(p => p.id === 'here_and_now');
  
  if (hereAndNowPerk && !hereAndNowPerk.hasIncreasedMaxLevel) {
    // Increase max level by 1
    prodConfig.chargenMaxLevel = (prodConfig.chargenMaxLevel || 99) + 1;
    hereAndNowPerk.hasIncreasedMaxLevel = true;
  }
  
  // Get current level for checking which perks need selection
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  
  console.log(`%c[CONFIRM PERK SELECTION - FULL STATE]`, 'color: #4CAF50; font-weight: bold;');
  console.log(`  currentLevel=${currentLevel}`);
  console.log(`  PERK STATE BEING CONFIRMED (about to lock at next level-up):`);
  selectedPerks.forEach((p, idx) => {
    const perk = PERKS[p.id];
    console.log(`    [${idx}] ${p.id}: rank=${p.rank}, modifiedAtLevel=${p.modifiedAtLevel}, lockedAtLevel=${p.lockedAtLevel}, lockedRank=${p.lockedRank}, maxRanks=${perk?.ranks}`);
  });
  console.log(`  ⚠️  On next level-up, these perks will be locked with these ranks!`);
  console.log(`%c[CONFIRM PERK SELECTION - ANALYSIS]`, 'color: #4CAF50; font-weight: bold;');
  console.log(`  selectedPerks count=${selectedPerks.length}`);
  selectedPerks.forEach((p, idx) => {
    console.log(`    [${idx}] ${p.id}: rank=${p.rank}, modifiedAtLevel=${p.modifiedAtLevel}`);
  });
  
  // Check if any perks require selections (only those just selected at this level)
  const perksRequiringSelection = selectedPerks.filter(perk => {
    const result = requiresPerkSelection(perk, currentLevel);
    console.log(`    → Filter ${perk.id}: ${result}`);
    return result;
  });
  
  if (perksRequiringSelection.length > 0) {
    // Hide the main confirm button while handling modal selections
    const confirmBtn = qs('confirm-perk-selection-btn');
    if (confirmBtn) confirmBtn.style.display = 'none';
    
    // Show the first perk selection modal
    handleNextPerkSelection(perksRequiringSelection, 0);
    return; // Don't proceed with the rest until selections are made
  }
  
  // Apply mechanical effects of selected perks
  applyPerkEffects(characterData);
  
  saveCharacterData();
  
  // Finish the perk confirmation process
  finishPerkConfirmation();
}

/**
 * Complete the perk confirmation process and clean up the UI
 */
function finishPerkConfirmation() {
  console.log('[FINISH PERK CONFIRMATION]');
  
  // Recalculate Sequence to include perk bonuses
  if (typeof recalculateSequence === 'function') {
    recalculateSequence(characterData);
  }
  
  // Hide the entire perks section
  const perksSection = qs('perks-section');
  if (perksSection) perksSection.style.display = 'none';
  
  // Update button states
  const confirmBtn = qs('confirm-perk-selection-btn');
  const unconfirmBtn = qs('unconfirm-perk-selection-btn');
  if (confirmBtn) confirmBtn.style.display = 'none';
  if (unconfirmBtn) unconfirmBtn.style.display = '';
  
  // Call updateDisplay to refresh level up button visibility
  updateDisplay();
  
  // Update character summary with new attribute bonuses
  updateCharacterSummary();
  
  // Update skill ranking to reflect attribute bonuses
  updateSkillRanking();
  
  // Update JSON output display
  renderOutput(characterData);
}

/**
 * Check if a perk requires player selection
 * @param {object} perk - The perk object with id and modifiedAtLevel
 * @param {number} currentLevel - Current character level
 * @returns {boolean} Whether the perk requires a selection now
 */
function requiresPerkSelection(perk, currentLevel) {
  const selectablePerkIds = ['tag', 'mutate'];
  
  // Only require selection if:
  // 1. Perk is a selectable type (tag, mutate)
  // 2. Perk was modified at the current level (just selected)
  if (!selectablePerkIds.includes(perk.id)) {
    return false;
  }
  
  // If modifiedAtLevel doesn't exist, this is a legacy perk from before tracking was added
  // Mark it as -1 (handled but not at any specific level) so we never show modal for it
  if (!perk.modifiedAtLevel) {
    console.log(`    [requiresPerkSelection] ${perk.id}: No modifiedAtLevel found (legacy perk), marking as -1`);
    perk.modifiedAtLevel = -1;  // -1 means "legacy perk, don't show modal"
    return false;
  }
  
  // Don't show modal for legacy perks (marked with -1)
  if (perk.modifiedAtLevel === -1) {
    return false;
  }
  
  // Only require selection if it was modified at this level
  const result = perk.modifiedAtLevel === currentLevel;
  console.log(`    [requiresPerkSelection] ${perk.id}: modifiedAtLevel=${perk.modifiedAtLevel}, currentLevel=${currentLevel}, result=${result}`);
  return result;
}

/**
 * Handle perk selection sequentially
 * @param {array} perksRequiringSelection - Array of perks that need selections
 * @param {number} index - Current index in the array
 */
function handleNextPerkSelection(perksRequiringSelection, index) {
  if (index >= perksRequiringSelection.length) {
    // All selections made, complete the confirmation
    applyPerkEffects(characterData);
    saveCharacterData();
    
    const perksSection = qs('perks-section');
    if (perksSection) perksSection.style.display = 'none';
    
    const confirmBtn = qs('confirm-perk-selection-btn');
    const unconfirmBtn = qs('unconfirm-perk-selection-btn');
    if (confirmBtn) confirmBtn.style.display = 'none';
    if (unconfirmBtn) unconfirmBtn.style.display = '';
    
    updateDisplay();
    updateCharacterSummary();
    updateSkillRanking();
    renderOutput(characterData);
    return;
  }

  const currentPerk = perksRequiringSelection[index];
  const perkId = currentPerk.id;

  console.log(`%c[HANDLE NEXT PERK SELECTION]`, 'color: #FF9800; font-weight: bold;', {
    index,
    perkId,
    perkName: currentPerk.name,
    totalPerks: perksRequiringSelection.length
  });

  // Show appropriate modal based on perk type
  if (perkId === 'tag' && typeof showTagSkillModal === 'function') {
    console.log(`  → Showing Tag! modal (showTagSkillModal)`);
    showTagSkillModal();
    // Store callback for after selection
    window.nextPerkSelectionIndex = index + 1;
    window.perksRequiringSelection = perksRequiringSelection;
  } else if (perkId === 'mutate' && typeof showTraitSelectionModal === 'function') {
    console.log(`  → Showing Mutate! modal (showTraitSelectionModal)`);
    showTraitSelectionModal();
    window.nextPerkSelectionIndex = index + 1;
    window.perksRequiringSelection = perksRequiringSelection;
  } else {
    console.log(`  → No modal handler for perk: ${perkId}`);
  }
}

/**
 * Unconfirm perk selection
 */
function unconfirmPerkSelection() {
  characterData.perksConfirmed = false;
  
  // Reset Here and Now flag if it was used
  const selectedPerks = characterData.selectedPerks || [];
  const hereAndNowPerk = selectedPerks.find(p => p.id === 'here_and_now');
  if (hereAndNowPerk && hereAndNowPerk.hasIncreasedMaxLevel) {
    hereAndNowPerk.hasIncreasedMaxLevel = false;
    prodConfig.chargenMaxLevel = (prodConfig.chargenMaxLevel || 99) - 1;
  }
  
  // Reset perk effects
  characterData.perkEffects = {
    hpBonusPerLevel: 0,
    skillPointsPerLevel: 0,
    healingRate: 0,
    attributeBonus: {},
    damageResistance: 0,
    radiationResistance: 0,
    bookSkillBonus: 0
  };
  
  saveCharacterData();
  
  // Show the entire perks section
  const perksSection = qs('perks-section');
  if (perksSection) perksSection.style.display = '';
  
  // Update button states
  const confirmBtn = qs('confirm-perk-selection-btn');
  const unconfirmBtn = qs('unconfirm-perk-selection-btn');
  if (confirmBtn) confirmBtn.style.display = '';
  if (unconfirmBtn) unconfirmBtn.style.display = 'none';
  
  // Trigger update to re-enable/disable confirm button based on selected perks
  updateDisplay();
  
  // Update character summary to reset attribute display
  updateCharacterSummary();
  
  // Update skill ranking to reflect attribute bonuses reset
  updateSkillRanking();
  
  // Update JSON output display
  renderOutput(characterData);
}

// #endregion SKILL RANKING SYSTEM

