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

// Load character data from localStorage when page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('advancement-page DOMContentLoaded fired');
  await loadProdConfig();
  await loadCharacterData();
  console.log('characterData after load:', characterData);
  
  // Check if this is a level up session (character uploaded from levelup.html)
  const isLevelUpSession = localStorage.getItem('isLevelUpSession') === 'true';
  console.log('[DOMContentLoaded] isLevelUpSession:', isLevelUpSession);
  
  if (isLevelUpSession) {
    // For level up sessions, get current level and set max to current + 1 (unless Here and Now applies)
    const currentLevel = getLevelFromXP(characterData.totalXP || 0);
    console.log('[DOMContentLoaded] Current level:', currentLevel);
    
    // Check if character has Here and Now perk that can be used
    const selectedPerks = characterData.selectedPerks || [];
    const hereAndNowPerk = selectedPerks.find(p => p.id === 'here_and_now');
    const canUseHereAndNow = hereAndNowPerk && !hereAndNowPerk.hasIncreasedMaxLevel;
    
    if (canUseHereAndNow) {
      // Here and Now perk allows leveling up twice
      prodConfig.levelsForchargen = currentLevel + 2;
      console.log('[DOMContentLoaded] Here and Now available - max level set to:', prodConfig.levelsForchargen);
    } else {
      // Normal level up - can only go up one level
      prodConfig.levelsForchargen = currentLevel + 1;
      console.log('[DOMContentLoaded] Normal level up - max level set to:', prodConfig.levelsForchargen);
    }
  }
  
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
      downloadJSON(characterData, (characterData.name || 'character') + '.json');
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
  console.log('Page initialization complete. Character data:', characterData);
});

// Load production configuration
async function loadProdConfig() {
  try {
    const response = await fetch('prod-config.json');
    prodConfig = await response.json();
    console.log('[loadProdConfig] Loaded prod-config:', prodConfig);
  } catch (e) {
    console.warn('[loadProdConfig] Could not load prod-config:', e);
    prodConfig = { levelsForchargen: 99 }; // Default fallback
  }
}

// Load character data from localStorage
async function loadCharacterData() {
  console.log('[loadCharacterData] Starting...');
  
  // First, check if we have stored character data from levelup session
  let stored = localStorage.getItem('characterData');
  console.log('[loadCharacterData] Level up session character exists:', !!stored);
  
  // If not from levelup, check for normal chargen stored data
  if (!stored) {
    stored = localStorage.getItem('falloutCharacter');
    console.log('[loadCharacterData] Chargen stored character exists:', !!stored);
  }
  
  if (stored) {
    // We have stored data, use it
    try {
      characterData = JSON.parse(stored);
      console.log('[loadCharacterData] Successfully parsed stored data:', characterData);
      
      // Recalculate level from totalXP if it exists
      if (characterData.totalXP !== undefined && typeof getLevelFromXP === 'function') {
        const calculatedLevel = getLevelFromXP(characterData.totalXP || 0);
        console.log(`[loadCharacterData] Recalculating level from totalXP: ${characterData.totalXP} -> Level ${calculatedLevel} (was ${characterData.level})`);
        characterData.level = calculatedLevel;
      }
    } catch (err) {
      console.error('[loadCharacterData] Failed to parse stored data:', err);
      characterData = {};
    }
  } else {
    // No stored data - check if we should generate a test character
    console.log('[loadCharacterData] No stored character, checking dev-config...');
    try {
      const response = await fetch('dev-config.json');
      const devConfig = await response.json();
      console.log('[loadCharacterData] devConfig:', devConfig);
      
      if (devConfig.autoLoadTestCharacter) {
        console.log('[loadCharacterData] autoLoadTestCharacter is true, generating test character...');
        characterData = generateTestCharacter();
        console.log('[loadCharacterData] Generated test character:', characterData);
        localStorage.setItem('falloutCharacter', JSON.stringify(characterData));
      } else {
        console.log('[loadCharacterData] autoLoadTestCharacter is false or not set');
        characterData = {};
      }
    } catch (e) {
      console.warn('[loadCharacterData] Could not load dev-config:', e);
      characterData = {};
    }
  }
  
  console.log('[loadCharacterData] Finished. characterData:', characterData);
}

// This function is no longer used - kept for reference
// Load test character if autoLoadTestCharacter is enabled in dev-config
async function loadTestCharacterIfConfigured_DEPRECATED() {
  console.log('[loadTestCharacterIfConfigured] Starting...');
  try {
    console.log('[loadTestCharacterIfConfigured] Fetching dev-config.json...');
    const response = await fetch('dev-config.json');
    console.log('[loadTestCharacterIfConfigured] Response status:', response.status);
    const devConfig = await response.json();
    console.log('[loadTestCharacterIfConfigured] devConfig loaded:', devConfig);
    console.log('[loadTestCharacterIfConfigured] autoLoadTestCharacter:', devConfig.autoLoadTestCharacter);
    
    if (devConfig.autoLoadTestCharacter) {
      console.log('[loadTestCharacterIfConfigured] Auto-generating test character...');
      characterData = generateTestCharacter();
      console.log('[loadTestCharacterIfConfigured] Generated test character:', characterData);
      localStorage.setItem('falloutCharacter', JSON.stringify(characterData));
      console.log('[loadTestCharacterIfConfigured] Saved to localStorage');
    } else {
      console.log('[loadTestCharacterIfConfigured] autoLoadTestCharacter is false or not set');
    }
  } catch (e) {
    console.warn('[loadTestCharacterIfConfigured] Error:', e);
  }
  console.log('[loadTestCharacterIfConfigured] Finished');
}

// Generate a random test character
function generateTestCharacter() {
  console.log('[generateTestCharacter] Starting...');
  const sampleNames = ['Alex', 'Riley', 'Mack', 'Nova', 'Harper', 'Jules', 'Casey', 'Rowan', 'Rex', 'Ivy'];
  const genders = ['Male', 'Female'];
  const races = ['Human', 'Ghoul'];
  const allSkills = ['guns', 'energy_weapons', 'unarmed', 'melee_weapons', 'throwing', 'first_aid', 'doctor', 'sneak', 'lockpick', 'steal', 'traps', 'science', 'repair', 'pilot', 'speech', 'barter', 'gambling', 'outdoorsman'];
  
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Select random race
  const selectedRace = races[randInt(0, races.length - 1)];
  console.log('[generateTestCharacter] Selected race:', selectedRace);
  const raceLimits = RACIAL_LIMITS[selectedRace];
  console.log('[generateTestCharacter] raceLimits:', raceLimits);
  
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
    console.log('[saveCharacterData] Cleared level up session flags');
  }
}

// Update character summary display
function updateCharacterSummary() {
  console.log('updateCharacterSummary called with data:', characterData);
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
  
  console.log('Character summary updated');
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
  console.log(`DEBUG: Race="${race}", Level=${currentLevel}, PerksEarned=${perksEarned}`);
  if (qs('perks_earned')) qs('perks_earned').textContent = perksEarned;
  
  // Build character object for perk eligibility checking
  const character = {
    level: currentLevel,
    race: race,
    attributes: effectiveAttributes,
    skills: calculateFinalSkills(attributes, characterData.tagSkills || {}, selectedTraits),
    karma: 0,
    traits: selectedTraits
  };
  
  // Get eligible perks and display them
  console.log('[updateDisplay] Character object for perk eligibility check:', character);
  const eligiblePerkIds = getEligiblePerks(character);
  console.log('[updateDisplay] Eligible perk IDs:', eligiblePerkIds);
  renderAvailablePerks(eligiblePerkIds);
  renderSelectedPerks(perksEarned);
  
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
  
  // Only count perks selected/modified at THIS level when determining available ranks
  const totalRanksUsedThisLevel = selectedPerks
    .filter(p => p.modifiedAtLevel === currentLevel)
    .reduce((sum, p) => sum + p.rank, 0);
  
  // New available ranks = perks earned this level minus locked perks from previous levels
  const newAvailableRanks = perksEarned - lockedRanks;
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
    // 3. There are new available perk ranks to spend THIS LEVEL AND
    // 4. There are eligible perks to select
    perksSection.style.display = (skillsConfirmed && !perksConfirmed && hasAvailablePerkRanks && hasEligiblePerks) ? '' : 'none';
  }
  
  // Update level up button visibility
  // Show only if all available allocations have been confirmed
  // At each level, only require confirmation for sections that have items to allocate
  const levelUpBtn = qs('level-up-btn');
  const downloadBtn = qs('download');
  if (levelUpBtn) {
    // Check if character has reached maximum level
    const maxLevel = prodConfig.levelsForchargen || 7;
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
    const hasPerksToConfirm = hasAvailablePerkRanks;
    
    // Check if unconfirmed items that need confirmation still exist
    const skillsNeedConfirmation = hasSkillsToConfirm && !skillsConfirmed;
    const perksNeedConfirmation = hasPerksToConfirm && !perksConfirmed;
    
    console.log('=== LEVEL UP BUTTON DEBUG ===');
    console.log('currentLevel:', currentLevel);
    console.log('maxLevel:', maxLevel);
    console.log('isMaxLevel:', isMaxLevel);
    console.log('hasSkillsToConfirm:', hasSkillsToConfirm);
    console.log('skillsConfirmed:', skillsConfirmed);
    console.log('hasPerksToConfirm:', hasPerksToConfirm);
    console.log('perksConfirmed:', perksConfirmed);
    console.log('skillsNeedConfirmation:', skillsNeedConfirmation);
    console.log('perksNeedConfirmation:', perksNeedConfirmation);
    console.log('button should be visible?', !(skillsNeedConfirmation || perksNeedConfirmation) && !isMaxLevel);
    
    // Calculate if all confirmations are done (no pending confirmations)
    const allConfirmed = !skillsNeedConfirmation && !perksNeedConfirmation;
    
    // Level Up button: visible only if not max level and all confirmations are done
    levelUpBtn.style.display = (isMaxLevel || skillsNeedConfirmation || perksNeedConfirmation) ? 'none' : '';
    
    const downloadBtn = qs('download');
    const equipmentBtn = qs('equipment-choice-btn');
    
    // Determine which button to show based on character source
    const showEquipmentBtn = window.showEquipmentButton === true;
    const showDownloadBtn = window.showEquipmentButton === false;
    
    console.log('[updateUI] window.showEquipmentButton:', window.showEquipmentButton, 'showEquipmentBtn:', showEquipmentBtn, 'showDownloadBtn:', showDownloadBtn);
    console.log('[updateUI] equipmentBtn element:', equipmentBtn, 'downloadBtn element:', downloadBtn);
    console.log('[updateUI] isMaxLevel:', isMaxLevel, 'allConfirmed:', allConfirmed);
    console.log('[updateUI] Equipment visibility calc:', isMaxLevel && allConfirmed && showEquipmentBtn);
    console.log('[updateUI] Download visibility calc:', isMaxLevel && allConfirmed && showDownloadBtn);
    
    // Download button: visible ONLY if character was loaded from file (not from chargen) AND max level reached AND confirmed
    if (downloadBtn) {
      const shouldShowDownload = isMaxLevel && allConfirmed && showDownloadBtn;
      console.log('[updateUI] Setting downloadBtn display to:', shouldShowDownload ? '' : 'none');
      downloadBtn.style.display = shouldShowDownload ? '' : 'none';
    }
    
    // Equipment button: visible ONLY if coming from chargen AND max level reached AND confirmed
    if (equipmentBtn) {
      const shouldShowEquipment = isMaxLevel && allConfirmed && showEquipmentBtn;
      console.log('[updateUI] Setting equipmentBtn display to:', shouldShowEquipment ? '' : 'none');
      equipmentBtn.style.display = shouldShowEquipment ? '' : 'none';
    }
  }
}

// Level up function
function levelUp() {
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  console.log('levelUp called, currentLevel:', currentLevel);
  
  // Check if character has reached the maximum allowed level
  const maxLevel = prodConfig.levelsForchargen || 7;
  if (currentLevel >= maxLevel) {
    alert(`Character has reached the maximum level of ${maxLevel}!`);
    return;
  }
  
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
  console.log('perksEarned:', perksEarned);
  
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
  
  console.log('Proceeding with level up');
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  console.log('nextLevelXP:', nextLevelXP);
  characterData.totalXP = nextLevelXP;
  
  // Lock in currently selected perks at this level (they become locked for future level-ups)
  selectedPerks.forEach(perk => {
    // Mark perks as locked at current level if not already locked
    // This means these perks can't be changed once we level up past this level
    if (!perk.lockedAtLevel) {
      perk.lockedAtLevel = currentLevel;
    }
    // Clear the modifiedAtLevel so they can't be removed after level up
    perk.modifiedAtLevel = undefined;
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
          console.log(`[levelUp BARTER] baseSkillValue=${baseSkillValue}, accumulatedIncrease=${accumulatedIncrease}, points=${points}, percentGain=${percentGain}`);
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
        console.log(`[levelUp BARTER] percentGain=${percentGain}, old=${characterData.skillIncreases[skillKey] || 0}, new=${newIncrease}`);
      }
      characterData.skillIncreases[skillKey] = newIncrease;
      // NOTE: Do NOT cap at 100% here - skills can exceed 100% through skill point spending
    }
  });
  
  // Reset skill points spent so they can be re-allocated for the new level
  characterData.skillPointsSpent = {};
  
  // Reset skill confirmation so the skill section shows for the new level
  characterData.skillsConfirmed = false;
  
  // Reset perk confirmation so the perk section shows for the new level
  characterData.perksConfirmed = false;
  
  // Auto-confirm perks if there are no perks to confirm at this level
  // Note: perksEarned, selectedPerks, lockedRanks, and newAvailableRanks already calculated above
  // If no perk ranks are available to spend, auto-confirm
  console.log('[levelUp] newAvailableRanks:', newAvailableRanks, 'perksEarned:', perksEarned, 'lockedRanks:', lockedRanks);
  if (newAvailableRanks === 0) {
    characterData.perksConfirmed = true;
    console.log('[levelUp] Auto-confirmed perks because no ranks available (newAvailableRanks === 0)');
  } else {
    console.log('[levelUp] NOT auto-confirming perks because newAvailableRanks =', newAvailableRanks);
  }
  
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
  console.log('[renderAvailablePerks] PERKS object keys sample:', Object.keys(PERKS).slice(0, 5), '... gain_strength exists?', 'gain_strength' in PERKS);
  console.log('[renderAvailablePerks] Eligible perk IDs:', eligiblePerkIds);
  
  // Filter out perks that have reached maximum rank
  const availablePerkIds = eligiblePerkIds.filter(perkId => {
    const perk = PERKS[perkId];
    const selectedPerk = selectedPerks.find(p => p.id === perkId);
    const currentRank = selectedPerk ? selectedPerk.rank : 0;
    // Only show perks that haven't reached max rank, or perks not yet selected
    const isAvailable = perk && currentRank < perk.ranks;
    
    // Always log Gain X perks for debugging
    if (['gain_strength', 'gain_perception', 'gain_endurance', 'gain_charisma', 'gain_intelligence', 'gain_agility', 'gain_luck'].includes(perkId)) {
      console.log(`[renderAvailablePerks FILTER] ${perkId}:`);
      console.log(`  - perk object: ${perk ? JSON.stringify(perk) : 'NULL'}`);
      console.log(`  - selectedPerk: ${selectedPerk ? JSON.stringify(selectedPerk) : 'NOT SELECTED'}`);
      console.log(`  - currentRank: ${currentRank}, perk.ranks: ${perk?.ranks}`);
      console.log(`  - currentRank < perk.ranks? ${currentRank} < ${perk?.ranks} = ${currentRank < perk?.ranks}`);
      console.log(`  - perk && (currentRank < perk.ranks)? ${isAvailable}`);
      console.log(`  - RESULT: ${isAvailable ? 'INCLUDED' : 'FILTERED OUT'}`);
    }
    return isAvailable;
  });
  
  console.log('[renderAvailablePerks] Available perk IDs after rank filter:', availablePerkIds);
  
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
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  const perksEarned = calculatePerksEarned(currentLevel, characterData.race || 'Human', characterData.selectedTraits || []);
  let selectedPerks = characterData.selectedPerks || [];
  const perk = PERKS[perkId];
  
  if (!perk) return;
  
  const selectedPerkIndex = selectedPerks.findIndex(p => p.id === perkId);
  const selectedPerk = selectedPerkIndex !== -1 ? selectedPerks[selectedPerkIndex] : null;
  
  // Count how many perk selections are used (each rank takes one slot)
  const usedPerkSlots = selectedPerks.reduce((sum, p) => sum + p.rank, 0);
  
  if (selectedPerk) {
    // Perk is already selected, try to add another rank
    if (selectedPerk.rank >= perk.ranks) {
      alert(`${perk.name} is already at maximum rank (${perk.ranks}).`);
      return;
    }
    
    // Check if there's a perk slot available
    if (usedPerkSlots < perksEarned) {
      selectedPerk.rank += 1;
      // Mark when this perk was last modified
      selectedPerk.modifiedAtLevel = currentLevel;
    } else {
      alert(`You can only select ${perksEarned} perk rank${perksEarned !== 1 ? 's' : ''} at this level.`);
      return;
    }
  } else {
    // Perk not selected yet, add it with rank 1
    if (usedPerkSlots < perksEarned) {
      selectedPerks.push({ id: perkId, rank: 1, modifiedAtLevel: currentLevel });
    } else {
      alert(`You can only select ${perksEarned} perk rank${perksEarned !== 1 ? 's' : ''} at this level.`);
      return;
    }
  }
  
  characterData.selectedPerks = selectedPerks;
  saveCharacterData();
  
  // Re-render
  const attributes = characterData.attributes || {};
  const character = {
    level: currentLevel,
    race: characterData.race || 'Human',
    attributes: attributes,
    skills: calculateFinalSkills(attributes, characterData.tagSkills || {}),
    karma: 0
  };
  
  const eligiblePerkIds = getEligiblePerks(character);
  renderAvailablePerks(eligiblePerkIds);
  renderSelectedPerks(perksEarned);
}

// Render selected perks
function renderSelectedPerks(maxPerks) {
  const container = qs('selected-perks-container');
  const noSelectedMsg = qs('no-selected-perks-msg');
  const selectedPerks = characterData.selectedPerks || [];
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  
  // Count total perk ranks used
  const totalRanksUsed = selectedPerks.reduce((sum, p) => sum + p.rank, 0);
  if (qs('selected_perks_count')) qs('selected_perks_count').textContent = totalRanksUsed;
  if (qs('max_selectable_perks')) qs('max_selectable_perks').textContent = maxPerks;
  
  // Calculate new available ranks (not counting locked perks)
  const lockedRanks = selectedPerks
    .filter(p => p.lockedAtLevel && p.lockedAtLevel <= currentLevel)
    .reduce((sum, p) => sum + p.rank, 0);
  const newAvailableRanks = maxPerks - lockedRanks;
  
  // Count only unlocked ranks
  const unlockedRanksUsed = selectedPerks
    .filter(p => !p.lockedAtLevel || p.lockedAtLevel > currentLevel)
    .reduce((sum, p) => sum + p.rank, 0);
  
  if (!container || selectedPerks.length === 0) {
    if (container) container.innerHTML = '';
    if (noSelectedMsg) noSelectedMsg.style.display = 'block';
    // Update button state even when no perks selected, pass new available ranks
    updateConfirmPerkButtonState(0, newAvailableRanks);
    return;
  }
  
  if (noSelectedMsg) noSelectedMsg.style.display = 'none';
  
  container.innerHTML = selectedPerks.map((selection) => {
    const perk = PERKS[selection.id];
    if (!perk) return '';
    
    // Perk is locked ONLY if it was locked at a previous level AND hasn't been modified at current level
    const isLocked = selection.lockedAtLevel && selection.lockedAtLevel < currentLevel && selection.modifiedAtLevel !== currentLevel;
    const isMaxRank = selection.rank >= perk.ranks;
    // Can remove rank if NOT locked (can remove any time before lock is applied)
    const canRemoveRank = !isLocked;
    
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
          ${isLocked ? 
            `<div style="flex: 1; padding: 6px 8px; background-color: #1a4d1a; color: #8BC34A; border-radius: 2px; font-size: 0.85rem; text-align: center; font-weight: bold;">Locked After Level Up</div>` :
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
  document.querySelectorAll('.remove-rank-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const perkId = btn.dataset.perkId;
      removeRank(perkId);
    });
  });
  
  // Update confirm button state (pass only unlocked ranks and new available ranks)
  updateConfirmPerkButtonState(unlockedRanksUsed, newAvailableRanks);
}

// Remove a rank from a perk
function removeRank(perkId) {
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  const selectedPerks = characterData.selectedPerks || [];
  const selectedPerkIndex = selectedPerks.findIndex(p => p.id === perkId);
  
  if (selectedPerkIndex === -1) return;
  
  const selectedPerk = selectedPerks[selectedPerkIndex];
  
  // Check if this perk is locked at a previous level AND hasn't been modified at the current level
  // If modifiedAtLevel === currentLevel, it means we just ranked it up and can still remove that rank
  const isCurrentlyLocked = selectedPerk.lockedAtLevel !== undefined && 
                           selectedPerk.lockedAtLevel < currentLevel && 
                           selectedPerk.modifiedAtLevel !== currentLevel;
  
  if (isCurrentlyLocked) {
    alert(`This perk was locked at level ${selectedPerk.lockedAtLevel} and cannot be removed or ranked down.`);
    return;
  }
  
  // Decrease rank
  if (selectedPerk.rank > 1) {
    selectedPerk.rank -= 1;
    // If we've decreased the rank back to where it was locked, clear modifiedAtLevel
    if (selectedPerk.lockedAtLevel && selectedPerk.modifiedAtLevel === currentLevel) {
      // Keep modifiedAtLevel cleared since we're back to the locked state
      selectedPerk.modifiedAtLevel = undefined;
    }
  } else {
    // Remove the perk entirely if it's the last rank
    selectedPerks.splice(selectedPerkIndex, 1);
  }
  
  characterData.selectedPerks = selectedPerks;
  saveCharacterData();
  
  // Re-render
  const perksEarned = calculatePerksEarned(currentLevel, characterData.race || 'Human');
  const attributes = characterData.attributes || {};
  const character = {
    level: currentLevel,
    race: characterData.race || 'Human',
    attributes: attributes,
    skills: calculateFinalSkills(attributes, characterData.tagSkills || {}),
    karma: 0
  };
  
  const eligiblePerkIds = getEligiblePerks(character);
  renderAvailablePerks(eligiblePerkIds);
  renderSelectedPerks(perksEarned);
}

function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `characterSheet_${obj.name || 'characterSheet'}.json`
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
  
  console.log('=== updateSkillRanking DEBUG ===');
  console.log('currentLevel:', currentLevel, 'totalXP:', totalXP);
  console.log('effectiveAttributes.intelligence:', effectiveAttributes.intelligence);
  
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
  console.log('spPerLevel:', spPerLevel, '(formula: 5 + (2 * ' + effectiveAttributes.intelligence + ') + ' + (perkEffects.skillPointsPerLevel || 0) + ' from perks)');
  
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
  
  console.log(`[updateSkillRanking] characterData.tagSkills:`, characterData.tagSkills);
  console.log(`[updateSkillRanking] tagSkills object:`, tagSkills);
  console.log(`[updateSkillRanking] tagSkills.unarmed:`, tagSkills.unarmed, 'type:', typeof tagSkills.unarmed);
  
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
  console.log('[updateSkillRanking FINAL] totalSPSpent:', totalSPSpent, 'availablePoints:', availablePoints);
  
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
  
  console.log(`[renderSkillsList DEBUG] totalSPSpent=${totalSPSpent}, availablePoints=${availablePoints}, skillPointsSpent=`, characterData.skillPointsSpent);
  
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
      console.log(`[BARTER_BEFORE_CALC]`, {baseSkillValue, accumulatedIncrease, skillPointsSpent, tagSkills_barter: tagSkills['barter']});
      console.log(`[BARTER_BEFORE_CALC] allSkills[barter]=${allSkills['barter']}, skillIncreases[barter]=${skillIncreases['barter']}, skillPointsSpent['barter']=${characterData.skillPointsSpent['barter']}`);
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
        console.log(`[BARTER_AFTER_CALC]`, {baseSkillValue, accumulatedIncrease, baseWithAccumulated, skillPointsSpent, currentSkillValue, currentLevelGain, isTag});
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
      console.log(`[BARTER DEBUG] skillKey=${skillKey}, baseSkillValue=${baseSkillValue}, currentSkillValue=${currentSkillValue}, isTag=${isTag}, availablePoints=${availablePoints}, displayGain=${displayGain}`);
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
      console.log(`[INCREASE CLICK] Clicked skill-increase-btn for ${skillKey}, disabled=${btn.disabled}`);
      if (skillKey === 'barter') {
        console.log(`[BARTER CLICK] increaseSkillPoints called for barter`);
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
    console.log('[resetSkillPoints] Resetting skill points');
    characterData.skillPointsSpent = {};
    saveCharacterData();
    updateSkillRanking();
    renderSkillsList();
    console.log('[resetSkillPoints] Reset complete');
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
  const confirmBtn = qs('confirm-perk-selection-btn');
  const unconfirmBtn = qs('unconfirm-perk-selection-btn');
  const isConfirmed = characterData.perksConfirmed || false;
  const skillsConfirmed = characterData.skillsConfirmed || false;
  const allRanksSpent = selectedRanks >= maxPerks && maxPerks > 0;
  
  if (confirmBtn) {
    // Only show confirm button if:
    // 1. Perks are not yet confirmed
    // 2. Skills ARE confirmed
    // 3. All available perk ranks have been spent
    if (isConfirmed || !skillsConfirmed || !allRanksSpent) {
      confirmBtn.style.display = 'none';
    } else {
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
  characterData.perksConfirmed = true;
  
  // Check if Here and Now perk is being confirmed for the first time
  const selectedPerks = characterData.selectedPerks || [];
  const hereAndNowPerk = selectedPerks.find(p => p.id === 'here_and_now');
  
  if (hereAndNowPerk && !hereAndNowPerk.hasIncreasedMaxLevel) {
    // Increase max level by 1
    prodConfig.levelsForchargen = (prodConfig.levelsForchargen || 99) + 1;
    hereAndNowPerk.hasIncreasedMaxLevel = true;
    console.log('[confirmPerkSelection] Here and Now activated! New max level:', prodConfig.levelsForchargen);
  }
  
  // Apply mechanical effects of selected perks
  applyPerkEffects(characterData);
  
  saveCharacterData();
  
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
 * Unconfirm perk selection
 */
function unconfirmPerkSelection() {
  characterData.perksConfirmed = false;
  
  // Reset Here and Now flag if it was used
  const selectedPerks = characterData.selectedPerks || [];
  const hereAndNowPerk = selectedPerks.find(p => p.id === 'here_and_now');
  if (hereAndNowPerk && hereAndNowPerk.hasIncreasedMaxLevel) {
    hereAndNowPerk.hasIncreasedMaxLevel = false;
    prodConfig.levelsForchargen = (prodConfig.levelsForchargen || 99) - 1;
    console.log('[unconfirmPerkSelection] Here and Now bonus reset. Max level:', prodConfig.levelsForchargen);
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

