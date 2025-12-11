function qs(id){return document.getElementById(id)}

// RACIAL_LIMITS is defined in advancement.js
const BASE_ATTRIBUTE_VALUE = 5;
const CHARACTER_POINTS_POOL = 5;
const ATTRIBUTE_NAMES = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];

// #region CHARACTER POINT VALIDATION
/**
 * Calculate the total character points allocated (sum of adjustments from base value)
 * @returns {number} Total points allocated (can be positive or negative)
 */
function calculatePointsAllocated() {
  let totalAllocated = 0;
  ATTRIBUTE_NAMES.forEach(attrName => {
    const currentValue = Number(qs(attrName).value) || BASE_ATTRIBUTE_VALUE;
    totalAllocated += (currentValue - BASE_ATTRIBUTE_VALUE);
  });
  return totalAllocated;
}

/**
 * Validate character point allocation against rules
 * @returns {object} Validation result with isValid flag and message
 */
function validateAttributeAllocation() {
  const race = qs('race').value || 'Human';
  const raceLimits = RACIAL_LIMITS[race] || RACIAL_LIMITS.Human;
  let message = '';
  let hasWarning = false;
  
  const pointsAllocated = calculatePointsAllocated();
  const pointsRemaining = CHARACTER_POINTS_POOL - pointsAllocated;
  
  // Check if points allocated exceed pool (remaining cannot go below 0)
  if (pointsRemaining < 0) {
    message = `⚠️ Too many points allocated. Remaining pool: ${pointsRemaining}. Reduce attribute values.`;
    hasWarning = true;
  }
  
  // Check racial limits for each attribute
  ATTRIBUTE_NAMES.forEach(attrName => {
    const currentValue = Number(qs(attrName).value) || BASE_ATTRIBUTE_VALUE;
    const limits = raceLimits[attrName];
    
    if (limits) {
      if (currentValue < limits.min) {
        message = `⚠️ ${attrName.toUpperCase()} (${currentValue}) below ${race} minimum (${limits.min}).`;
        hasWarning = true;
      }
      if (currentValue > limits.max) {
        message = `⚠️ ${attrName.toUpperCase()} (${currentValue}) exceeds ${race} maximum (${limits.max}).`;
        hasWarning = true;
      }
    }
  });
  
  return {
    isValid: !hasWarning,
    message: message
  };
}

/**
 * Update the character points pool display
 */
function updatePointsPoolDisplay() {
  const pointsAllocated = calculatePointsAllocated();
  const pointsRemaining = CHARACTER_POINTS_POOL - pointsAllocated;
  const validation = validateAttributeAllocation();
  
  const allocatedEl = qs('points-allocated');
  const remainingEl = qs('points-remaining');
  const poolEl = qs('points-pool');
  
  if (allocatedEl) allocatedEl.textContent = pointsAllocated >= 0 ? `+${pointsAllocated}` : pointsAllocated;
  if (remainingEl) remainingEl.textContent = pointsRemaining;
  if (poolEl) poolEl.textContent = pointsRemaining;
  
  const warningEl = qs('points-warning');
  if (warningEl) {
    if (validation.message) {
      warningEl.textContent = validation.message;
      warningEl.style.display = 'block';
    } else {
      warningEl.style.display = 'none';
    }
  }
}

/**
 * Handle attribute input changes with validation
 * Prevents changes that violate racial limits or exceed point pool
 */
function handleAttributeChange(attrId, previousValue) {
  const currentValue = Number(qs(attrId).value) || BASE_ATTRIBUTE_VALUE;
  const race = qs('race').value || 'Human';
  const raceLimits = RACIAL_LIMITS[race];
  const attributeLimits = raceLimits[attrId];
  
  // Check racial minimum
  if (attributeLimits && currentValue < attributeLimits.min) {
    qs(attrId).value = previousValue;
    updatePointsPoolDisplay();
    return;
  }
  
  // Check racial maximum
  if (attributeLimits && currentValue > attributeLimits.max) {
    qs(attrId).value = previousValue;
    updatePointsPoolDisplay();
    return;
  }
  
  const pointsAllocated = calculatePointsAllocated();
  const pointsRemaining = CHARACTER_POINTS_POOL - pointsAllocated;
  
  // If this change would make remaining points negative, revert it
  if (pointsRemaining < 0) {
    qs(attrId).value = previousValue;
    updatePointsPoolDisplay();
    return;
  }
  
  updateSecondaryStats();
  updatePointsPoolDisplay();
}
// #endregion

function getFormData(){
  console.log('getFormData() called');
  // Collect tag skills from checkboxes if they exist (index.html)
  // Otherwise, preserve from loaded character data (advancement.html)
  let tagSkills = {};
  const checkboxes = document.querySelectorAll('.tag-checkbox');
  
  if (checkboxes.length > 0) {
    // We're on index.html with checkboxes
    checkboxes.forEach(checkbox => {
      tagSkills[checkbox.dataset.skill] = checkbox.checked;
    });
  } else {
    // We're on advancement.html without checkboxes - preserve from localStorage
    const stored = localStorage.getItem('falloutCharacter');
    if (stored) {
      try {
        const savedData = JSON.parse(stored);
        tagSkills = savedData.tagSkills || {};
      } catch (err) {
        console.warn('Could not parse saved character data for tagSkills');
      }
    }
  }

  // Get current attributes to calculate skills
  const attributes = {
    strength: Number(qs('strength').value)||0,
    perception: Number(qs('perception').value)||0,
    endurance: Number(qs('endurance').value)||0,
    charisma: Number(qs('charisma').value)||0,
    intelligence: Number(qs('intelligence').value)||0,
    agility: Number(qs('agility').value)||0,
    luck: Number(qs('luck').value)||0,
  };

  return {
    player: qs('player').value||null,
    name: qs('name').value||null,
    race: qs('race').value||null,
    age: parseInt(qs('age').value)||null,
    gender: qs('gender').value||null,
    attributes: attributes,
    tagSkills: tagSkills,
    skills: calculateFinalSkills(attributes, tagSkills),
    level: Number((qs('current_level')?.textContent)) || 1,
    totalXP: Number((qs('total_xp')?.textContent)) || 0,
    selectedPerks: getSelectedPerks(),
    stats: {
      Hit_Points: Number(qs('hit_points')?.textContent)||0,
      Carry_Weight: Number(qs('carry_weight')?.textContent)||0,
      Action_Points: Number(qs('action_points')?.textContent)||0,
      Sequence: Number(qs('sequence')?.textContent)||0,
      Melee_Damage: Number(qs('melee_damage')?.textContent)||0,
      Critical_Chance: Number(qs('critical_chance')?.textContent)||0,
      Healing_Rate: Number(qs('healing_rate')?.textContent)||0,
      Poison_Resist: Number(qs('poison_resist')?.textContent)||0,
      Radiation_Resist: Number(qs('radiation_resist')?.textContent)||0,
      Gas_Resist: Number(qs('gas_resist')?.textContent)||0,
      Electricity_Resist: Number(qs('electricity_resist')?.textContent)||0,
      Armor_Class: Number(qs('armor_class')?.textContent)||0,
      DT: {
        Normal: Number(qs('dt_normal')?.textContent)||0,
        Laser: Number(qs('dt_laser')?.textContent)||0,
        Fire: Number(qs('dt_fire')?.textContent)||0,
        Plasma: Number(qs('dt_plasma')?.textContent)||0,
        Explode: Number(qs('dt_explode')?.textContent)||0,
      },
      DR: {
        Normal: Number(qs('dr_normal')?.textContent)||0,
        Laser: Number(qs('dr_laser')?.textContent)||0,
        Fire: Number(qs('dr_fire')?.textContent)||0,
        Plasma: Number(qs('dr_plasma')?.textContent)||0,
        Explode: Number(qs('dr_explode')?.textContent)||0,
      }
    },
    notes: (qs('notes')?.value)||null,
    createdAt: new Date().toISOString()
  }
}

function setFormData(data){
  console.log('setFormData called', data);
  if(!data) return
  console.log('Setting name to:', data.name);
  qs('name').value = data.name||''
  console.log('Setting race to:', data.race);
  qs('race').value = data.race||''
  qs('age').value = data.age==null? '': data.age
  qs('gender').value = data.gender||''
  const a = data.attributes||{}
  qs('strength').value = a.strength||5
  qs('perception').value = a.perception||5
  qs('endurance').value = a.endurance||5
  qs('charisma').value = a.charisma||5
  qs('intelligence').value = a.intelligence||5
  qs('agility').value = a.agility||5
  qs('luck').value = a.luck||5
  
  // Restore tag skills
  const tagSkills = data.tagSkills||{}
  // Only restore tag checkbox states if checkboxes exist (index.html)
  const checkboxes = document.querySelectorAll('.tag-checkbox');
  if (checkboxes.length > 0) {
    checkboxes.forEach(checkbox => {
      checkbox.checked = tagSkills[checkbox.dataset.skill] || false;
    });
  }
  
  // Restore selected perks
  const loadedPerks = data.selectedPerks||[]
  selectedPerksData = loadedPerks;
  
  const st = data.stats||{}
  if (qs('hit_points')) qs('hit_points').textContent = st.Hit_Points||0
  if (qs('carry_weight')) qs('carry_weight').textContent = st.Carry_Weight||0
  if (qs('action_points')) qs('action_points').textContent = st.Action_Points||0
  if (qs('sequence')) qs('sequence').textContent = st.Sequence||0
  if (qs('melee_damage')) qs('melee_damage').textContent = st.Melee_Damage||0
  if (qs('critical_chance')) qs('critical_chance').textContent = st.Critical_Chance||0
  if (qs('healing_rate')) qs('healing_rate').textContent = st.Healing_Rate||0
  if (qs('poison_resist')) qs('poison_resist').textContent = st.Poison_Resist||0
  if (qs('radiation_resist')) qs('radiation_resist').textContent = st.Radiation_Resist||0
  if (qs('gas_resist')) qs('gas_resist').textContent = st.Gas_Resist||0
  if (qs('electricity_resist')) qs('electricity_resist').textContent = st.Electricity_Resist||0
  if (qs('armor_class')) qs('armor_class').textContent = st.Armor_Class||0
  const dt = st.DT||{}
  if (qs('dt_normal')) qs('dt_normal').textContent = dt.Normal||0
  if (qs('dt_laser')) qs('dt_laser').textContent = dt.Laser||0
  if (qs('dt_fire')) qs('dt_fire').textContent = dt.Fire||0
  if (qs('dt_plasma')) qs('dt_plasma').textContent = dt.Plasma||0
  if (qs('dt_explode')) qs('dt_explode').textContent = dt.Explode||0
  const dr = st.DR||{}
  if (qs('dr_normal')) qs('dr_normal').textContent = dr.Normal||0
  if (qs('dr_laser')) qs('dr_laser').textContent = dr.Laser||0
  if (qs('dr_fire')) qs('dr_fire').textContent = dr.Fire||0
  if (qs('dr_plasma')) qs('dr_plasma').textContent = dr.Plasma||0
  if (qs('dr_explode')) qs('dr_explode').textContent = dr.Explode||0
  const notesEl = qs('notes');
  if (notesEl) notesEl.value = data.notes||''
  updatePointsPoolDisplay()
  updateSkillDisplay()
  updateAdvancementDisplay()
  renderOutput(getFormData())
}

function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}

// Save character data to localStorage for use on advancement page
function saveCharacterData() {
  const formData = getFormData();
  console.log('saveCharacterData() called');
  console.log('Form data to save:', formData);
  if (!formData || !formData.name) {
    console.warn('WARNING: Form data is invalid or has no name!', formData);
  }
  localStorage.setItem('falloutCharacter', JSON.stringify(formData));
  console.log('Saved to localStorage. Retrieving to verify:', localStorage.getItem('falloutCharacter'));
}

// #region Stats Calculations

// #region HP FORMULAS
// STR: Strength (number), END: Endurance (number), level: character level (>= 1)
function calculateBaseHp(str, end) {
  return 15 + (str + 2 * end);
}

function calculateHpPerLevel(end) {
  // 3 + 1/2 END, rounded down
  return Math.floor(3 + end / 2);
}

function calculateMaxHp(str, end, level = 1) {
  const baseHp = calculateBaseHp(str, end);
  const hpPerLevel = calculateHpPerLevel(end);

  if (level <= 1) return baseHp;

  return baseHp + (level - 1) * hpPerLevel;
}
// #endregion

// #region ARMOR CLASS FORMULAS
// AGI: Agility (number), ArmorAC: armor bonus (default 0)
function calculateArmorClass(agi, armorAC = 0) {
  return agi + armorAC;
}
// #endregion

// #region ACTION POINTS FORMULAS
// AGI: Agility (number)
function calculateActionPoints(agi) {
  if (agi <= 0) return 0;
  if (agi <= 3) return 6;
  if (agi <= 5) return 7;
  if (agi <= 7) return 8;
  if (agi <= 9) return 9;
  return 10;
}
// #endregion

// #region CARRY WEIGHT FORMULAS
// STR: Strength (number)
function calculateCarryWeight(str) {
  return 25 + (25 * str);
}
// #endregion

// #region MELEE DAMAGE FORMULAS
// STR: Strength (number)
function calculateMeleeDamage(str) {
  return Math.max(1, str - 5);
}
// #endregion

// #region POISON RESISTANCE FORMULAS
// END: Endurance (number)
function calculatePoisonResistance(end) {
  return 5 * end;
}
// #endregion

// #region RADIATION RESISTANCE FORMULAS
// END: Endurance (number)
function calculateRadiationResistance(end) {
  return 2 * end;
}
// #endregion

// #region SEQUENCE FORMULAS
// PE: Perception (number)
function calculateSequence(pe) {
  return 2 * pe;
}
// #endregion

// #region HEALING RATE FORMULAS
// END: Endurance (number)
function calculateHealingRate(end) {
  if (end <= 5) return 1;
  if (end <= 8) return 2;
  if (end <= 10) return 3;
  return 4;
}
// #endregion

// #region CRITICAL CHANCE FORMULAS
// LUCK: Luck (number)
function calculateCriticalChance(luck) {
  return luck;
}
// #endregion

// #region RACIAL RESISTANCE FORMULAS
/**
 * Apply racial base resistances
 * @param {string} race - The character's race (Human, Ghoul, etc.)
 * @returns {object} Base resistances from race
 */
function getRacialBaseResistances(race) {
  switch(race) {
    case 'Ghoul':
      return {
        Radiation_Resist: 80,  // +80% Radiation Resistance (natural)
        Poison_Resist: 30,     // +30% Poison Resistance (natural)
      };
    case 'Human':
    default:
      return {
        Electricity_Resist: 30 // +30% Electricity Resistance
      };
  }
}

/**
 * Get perk progression frequency for a race
 * @param {string} race - The character's race (Human, Ghoul, etc.)
 * @returns {number} Levels between perks
 */
function getPerkProgressionFrequency(race) {
  switch(race) {
    case 'Ghoul':
      return 4; // Gain 1 perk every 4 levels
    case 'Human':
    default:
      return 3; // Gain 1 perk every 3 levels
  }
}

/**
 * Calculate perks earned at current level based on race
 * @param {number} currentLevel - Character's current level
 * @param {string} race - Character's race
 * @returns {number} Number of perks earned
 */
function calculatePerksEarned(currentLevel, race) {
  const frequency = getPerkProgressionFrequency(race);
  // Perks start at level 3 for all races
  if (currentLevel < 3) return 0;
  // Calculate number of times the frequency divides into (currentLevel - 3) plus the initial perk at level 3
  return Math.floor((currentLevel - 3) / frequency) + 1;
}
// #endregion

// #region MAIN CALCULATION FUNCTION
function calculateSecondaryStats(attributes, race = 'Human') {
  const str = attributes.strength || 0;
  const per = attributes.perception || 0;
  const end = attributes.endurance || 0;
  const agi = attributes.agility || 0;
  const luck = attributes.luck || 0;

  // Get base racial resistances
  const racialResistances = getRacialBaseResistances(race);

  // Calculate base resistances from attributes
  const basePoisonResist = calculatePoisonResistance(end);
  const baseRadiationResist = calculateRadiationResistance(end);

  return {
    Hit_Points: calculateMaxHp(str, end, 1),
    Armor_Class: calculateArmorClass(agi, 0),
    Action_Points: calculateActionPoints(agi),
    Carry_Weight: calculateCarryWeight(str),
    Melee_Damage: calculateMeleeDamage(str),
    Poison_Resist: basePoisonResist + (racialResistances.Poison_Resist || 0),
    Radiation_Resist: baseRadiationResist + (racialResistances.Radiation_Resist || 0),
    Sequence: calculateSequence(per),
    Healing_Rate: calculateHealingRate(end),
    Critical_Chance: calculateCriticalChance(luck),
    Gas_Resist: 0, // Derived from armor, race, and equipment only
    Electricity_Resist: racialResistances.Electricity_Resist || 0, // Derived from armor, race, and equipment only
  };
}
// #endregion
// #endregion

// #region SKILL CALCULATIONS

/**
 * Calculate base skill values before tag bonuses
 * @param {object} attributes - Character attributes object with str, per, end, ch, in, ag, lk
 * @returns {object} Base skill percentages for all skills
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
    small_guns: 5 + (4 * ag),
    big_guns: 0 + (2 * ag),
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
    pilot: 0 + (2 * ag), // Note: Not in instructions, but in form
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
 * Validate tag skill selection (must be exactly 3)
 * @returns {object} Validation result with isValid flag and message
 */
function validateTagSkills() {
  const tagCheckboxes = document.querySelectorAll('.tag-checkbox:checked');
  const count = tagCheckboxes.length;
  let message = '';
  let isValid = count <= 3;
  
  if (count > 3) {
    message = `⚠️ Only 3 tag skills allowed. Currently selected: ${count}`;
  }
  
  return { isValid, message, count };
}

/**
 * Update tag skill count and validation display
 */
function updateTagSkillDisplay() {
  const validation = validateTagSkills();
  const tagCountEl = qs('tag-count');
  if (tagCountEl) tagCountEl.textContent = validation.count;
  
  const warningEl = qs('tag-warning');
  if (warningEl) {
    if (validation.message) {
      warningEl.textContent = validation.message;
      warningEl.style.display = 'block';
    } else {
      warningEl.style.display = 'none';
    }
  }
}

/**
 * Update all skill base values and tag indicators
 */
function updateSkillDisplay() {
  const formData = getFormData();
  const baseSkills = calculateBaseSkills(formData.attributes);
  const finalSkills = calculateFinalSkills(formData.attributes, formData.tagSkills);
  
  // Update base skill display and final values
  Object.keys(baseSkills).forEach(skillKey => {
    const baseEl = qs(`base_${skillKey}`);
    if (baseEl) {
      const baseValue = baseSkills[skillKey];
      const finalValue = finalSkills[skillKey];
      const isTagged = formData.tagSkills[skillKey];
      
      // Display final value with tag indicator
      if (isTagged) {
        baseEl.textContent = `${finalValue}% (tag)`;
        baseEl.style.color = '#34d399';
        baseEl.style.fontWeight = 'bold';
      } else {
        baseEl.textContent = `${finalValue}%`;
        baseEl.style.color = 'inherit';
        baseEl.style.fontWeight = 'normal';
      }
    }
  });
  
  updateTagSkillDisplay();
}

// #endregion

function randomizeCharacter(){
  console.log('randomizeCharacter called');
  const sampleNames = ['Alex','Riley','Mack','Nova','Harper','Jules','Casey','Rowan','Rex','Ivy']
  const genders = ['Male','Female']
  const races = ['Human','Ghoul']
  const occupation = ['Scavenger','Engineer','Trader','Medic','Soldier','Mechanic','Scientist']
  const allSkills = ['small_guns', 'big_guns', 'energy_weapons', 'unarmed', 'melee_weapons', 'throwing', 'first_aid', 'doctor', 'sneak', 'lockpick', 'steal', 'traps', 'science', 'repair', 'pilot', 'speech', 'barter', 'gambling', 'outdoorsman']
  
  // Select random race first
  const selectedRace = races[randInt(0,races.length-1)];
  const raceLimits = RACIAL_LIMITS[selectedRace];
  
  // Generate attributes respecting racial limits AND character point pool
  // Start with base values (5 each)
  const attributes = {
    strength: BASE_ATTRIBUTE_VALUE,
    perception: BASE_ATTRIBUTE_VALUE,
    endurance: BASE_ATTRIBUTE_VALUE,
    charisma: BASE_ATTRIBUTE_VALUE,
    intelligence: BASE_ATTRIBUTE_VALUE,
    agility: BASE_ATTRIBUTE_VALUE,
    luck: BASE_ATTRIBUTE_VALUE,
  };
  
  // Available points to allocate (can be negative, meaning we use "pool" in reverse)
  let pointsAvailable = CHARACTER_POINTS_POOL;
  
  // Randomly allocate points to attributes while respecting racial limits and point pool
  const attributeNames = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
  
  // Allocate all available points to random attributes
  while (pointsAvailable > 0) {
    // Shuffle to get random allocation order
    const shuffledAttributes = attributeNames.sort(() => Math.random() - 0.5);
    let allocated = false;
    
    for (const attrName of shuffledAttributes) {
      const limits = raceLimits[attrName];
      const currentValue = attributes[attrName];
      const maxValue = limits.max;
      
      // Can this attribute accept a point?
      if (currentValue < maxValue) {
        attributes[attrName] += 1;
        pointsAvailable -= 1;
        allocated = true;
        break;
      }
    }
    
    // If nothing could be allocated, we're done
    if (!allocated) break;
  }
  
  // Handle negative points (remove from attributes if needed - rare edge case)
  while (pointsAvailable < 0) {
    const shuffledAttributes = attributeNames.sort(() => Math.random() - 0.5);
    let allocated = false;
    
    for (const attrName of shuffledAttributes) {
      const limits = raceLimits[attrName];
      const currentValue = attributes[attrName];
      const minValue = limits.min;
      
      // Can this attribute lose a point?
      if (currentValue > minValue) {
        attributes[attrName] -= 1;
        pointsAvailable += 1;
        allocated = true;
        break;
      }
    }
    
    // If nothing could be deallocated, we're done
    if (!allocated) break;
  }
  
  // Select 3 random tag skills
  const tagSkills = {};
  const shuffledSkills = allSkills.sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3; i++) {
    tagSkills[shuffledSkills[i]] = true;
  }
  
  const char = {
    name: sampleNames[randInt(0,sampleNames.length-1)],
    race: selectedRace,
    age: randInt(16, selectedRace === 'Ghoul' ? 236 : 80),
    gender: genders[randInt(0,genders.length-1)],
    attributes: attributes,
    tagSkills: tagSkills,
    skills: {
      guns: randInt(0,100),
      energy_weapons: randInt(0,100),
      unarmed: randInt(0,100),
      melee_weapons: randInt(0,100),
      throwing: randInt(0,100),
      first_aid: randInt(0,100),
      doctor: randInt(0,100),
      sneak: randInt(0,100),
      lockpick: randInt(0,100),
      steal: randInt(0,100),
      traps: randInt(0,100),
      science: randInt(0,100),
      repair: randInt(0,100),
      pilot: randInt(0,100),
      speech: randInt(0,100),
      barter: randInt(0,100),
      gambling: randInt(0,100),
      outdoorsman: randInt(0,100),
    },
    stats: {
      Hit_Points: randInt(15,50),
      Carry_Weight: randInt(150,300),
      Action_Points: randInt(6,10),
      Sequence: randInt(1,20),
      Melee_Damage: randInt(1,10),
      Critical_Chance: randInt(0,50),
      Healing_Rate: randInt(0,5),
      Poison_Resist: randInt(0,50),
      Radiation_Resist: randInt(0,50),
      Gas_Resist: randInt(0,50),
      Electricity_Resist: randInt(0,50),
      Armor_Class: randInt(0,10),
      DT: {
        Normal: randInt(0,30),
        Laser: randInt(0,30),
        Fire: randInt(0,30),
        Plasma: randInt(0,30),
        Explode: randInt(0,30),
      },
      DR: {
        Normal: randInt(0,30),
        Laser: randInt(0,30),
        Fire: randInt(0,30),
        Plasma: randInt(0,30),
        Explode: randInt(0,30),
      }
    },
    occupation: occupation[randInt(0,occupation.length-1)],
    notes: ''
  }
  console.log('About to call setFormData with char:', char);
  setFormData(char)
  console.log('setFormData completed');
  // Save the randomized character to localStorage
  renderOutput(getFormData());
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
}

function renderOutput(obj){
  qs('output').textContent = JSON.stringify(obj,null,2)
  saveCharacterData()
}

function handleFileLoad(file){
  const reader = new FileReader()
  reader.onload = e => {
    try{
      const data = JSON.parse(e.target.result)
      setFormData(data)
      alert('Loaded character JSON')
    }catch(err){
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(file)
}

document.addEventListener('DOMContentLoaded', ()=>{
  try {
    console.log('DOMContentLoaded fired, setting up event listeners');
    
    const randomBtn = qs('randomize');
    if (randomBtn) {
      randomBtn.addEventListener('click', randomizeCharacter);
      console.log('Attached randomize handler');
    } else {
      console.warn('randomize button not found');
    }
    
    const downloadBtn = qs('download');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', ()=>{
        const obj = getFormData()
        downloadJSON(obj, (obj.name||'character') + '.json')
      });
      console.log('Attached download handler');
    } else {
      console.warn('download button not found');
    }
    
    const loadFile = qs('load-file');
    if (loadFile) {
      loadFile.addEventListener('change', (e)=>{
        const f = e.target.files && e.target.files[0]
        if(f) handleFileLoad(f)
        e.target.value = ''
      });
      console.log('Attached load-file handler');
    } else {
      console.warn('load-file input not found');
    }
    
    const fillSampleBtn = qs('fill-sample');
    if (fillSampleBtn) {
      fillSampleBtn.addEventListener('click', ()=>{
        const sample = {
          name: 'Sample Vault Dweller',
          age: 28,
          gender: 'Male',
          attributes: {strength:6,perception:7,endurance:5,charisma:4,intelligence:8,agility:6,luck:3},
          occupation: 'Vault Technician',
          notes: 'Ready for adventure.'
        }
        setFormData(sample)
      });
      console.log('Attached fill-sample handler');
    } else {
      console.warn('fill-sample button not found');
    }

    // Advancement button handler - save and navigate
    const advBtn = qs('go-advancement');
    console.log('Looking for go-advancement button:', advBtn);
    if (advBtn) {
      advBtn.addEventListener('click', ()=>{
        console.log('Go to advancement button clicked');
        const formData = getFormData();
        console.log('Current form data:', formData);
        saveCharacterData();
        console.log('Data saved, navigating to advancement page');
        // Detect if we're on debug page and navigate to corresponding advancement page
        const currentPage = window.location.pathname;
        const target = currentPage.includes('debug') ? 'advancement-debug.html' : 'advancement.html';
        // Use absolute path from root to handle GitHub Pages correctly
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        window.location.href = basePath + target;
      })
      console.log('Event listener attached to advancement button');
    } else {
      console.warn('WARNING: go-advancement button not found in DOM');
    }

  // Only set up index.html-specific handlers if we're on index.html
  if (qs('gender')) {
    // Dropdown change handlers
    qs('gender').addEventListener('change', (e) => {
      const selectedGender = e.target.value
      console.log('Gender selected:', selectedGender)
      renderOutput(getFormData())
    })

    qs('race').addEventListener('change', (e) => {
      const selectedRace = e.target.value
      console.log('Race selected:', selectedRace)
      
      const ageInput = qs('age')
      const currentAge = parseInt(ageInput.value) || 0
      
      if(selectedRace === 'Ghoul') {
        ageInput.max = '236'
      } else {
        ageInput.max = '80'
        // Clamp age to max if it exceeds the new max
        if(currentAge > 80) {
          ageInput.value = '80'
        }
      }
      
      // Update attribute input min/max constraints based on race
      const raceLimits = RACIAL_LIMITS[selectedRace];
      ATTRIBUTE_NAMES.forEach(attrName => {
        const limits = raceLimits[attrName];
        const input = qs(attrName);
        const currentValue = Number(input.value) || BASE_ATTRIBUTE_VALUE;
        
        input.min = limits.min;
        input.max = limits.max;
        
        // Clamp current value to new limits if needed
        if (currentValue < limits.min) {
          input.value = limits.min;
        } else if (currentValue > limits.max) {
          input.value = limits.max;
        }
      });
      
      updatePointsPoolDisplay();
      renderOutput(getFormData())
    })

    // Attribute change handlers - auto-calculate secondary stats and update points pool
    const attributeInputs = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
    
    attributeInputs.forEach(attrId => {
      qs(attrId).addEventListener('change', () => {
        updateSecondaryStats();
        updateSkillDisplay();
        updatePointsPoolDisplay();
      });
      qs(attrId).addEventListener('input', function() {
        const previousValue = this.previousValue || BASE_ATTRIBUTE_VALUE;
        handleAttributeChange(attrId, previousValue);
        this.previousValue = this.value;
      });
      // Store initial value
      qs(attrId).previousValue = qs(attrId).value;
    });

    // Tag skill checkbox change handlers
    document.querySelectorAll('.tag-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const tagCheckboxes = document.querySelectorAll('.tag-checkbox:checked');
        const count = tagCheckboxes.length;
        
        // Prevent checking if already at 3 tags
        if (checkbox.checked && count > 3) {
          checkbox.checked = false;
          return;
        }
        
        updateSkillDisplay();
        updateAdvancementDisplay();
        renderOutput(getFormData());
      });
    });

    // Initialize stats on page load (only on index.html)
    updateSecondaryStats();
    updateSkillDisplay();
    updatePointsPoolDisplay();
    updateAdvancementDisplay();
    
    // initial render
    renderOutput(getFormData())
  }

  // Level up button handler (only on advancement page)
  const levelUpBtn = qs('level-up-btn');
  if (levelUpBtn) {
    levelUpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentLevel = Number(qs('current_level').textContent) || 1;
      const nextLevelXP = getXPForLevel(currentLevel + 1);
      qs('total_xp').textContent = nextLevelXP;
      updateAdvancementDisplay();
      renderOutput(getFormData());
    });
    console.log('Attached level-up button handler');
  }

  } catch(err) {
    console.error('Error during DOMContentLoaded setup:', err.message, err.stack);
  }
})

// Update secondary statistics based on current attribute values
function updateSecondaryStats() {
  const formData = getFormData();
  const race = qs('race').value || 'Human';
  const stats = calculateSecondaryStats(formData.attributes, race);
  
  // Update stat fields with calculated values (only if elements exist)
  if (qs('hit_points')) qs('hit_points').textContent = stats.Hit_Points;
  if (qs('armor_class')) qs('armor_class').textContent = stats.Armor_Class;
  if (qs('action_points')) qs('action_points').textContent = stats.Action_Points;
  if (qs('carry_weight')) qs('carry_weight').textContent = stats.Carry_Weight;
  if (qs('melee_damage')) qs('melee_damage').textContent = stats.Melee_Damage;
  if (qs('poison_resist')) qs('poison_resist').textContent = stats.Poison_Resist;
  if (qs('radiation_resist')) qs('radiation_resist').textContent = stats.Radiation_Resist;
  if (qs('sequence')) qs('sequence').textContent = stats.Sequence;
  if (qs('healing_rate')) qs('healing_rate').textContent = stats.Healing_Rate;
  if (qs('critical_chance')) qs('critical_chance').textContent = stats.Critical_Chance;
  if (qs('gas_resist')) qs('gas_resist').textContent = stats.Gas_Resist;
  if (qs('electricity_resist')) qs('electricity_resist').textContent = stats.Electricity_Resist;
  
  renderOutput(getFormData());
}

// Update advancement display based on current XP and attributes
function updateAdvancementDisplay() {
  // Skip if we're on the main character creation page (no total_xp element)
  if (!qs('total_xp')) return;
  
  const totalXP = Number(qs('total_xp').textContent) || 0;
  const xpProgress = getXPProgress(totalXP);
  const attributes = {
    strength: Number(qs('strength').value) || 5,
    perception: Number(qs('perception').value) || 5,
    endurance: Number(qs('endurance').value) || 5,
    charisma: Number(qs('charisma').value) || 5,
    intelligence: Number(qs('intelligence').value) || 5,
    agility: Number(qs('agility').value) || 5,
    luck: Number(qs('luck').value) || 5,
  };
  
  const currentLevel = xpProgress.level;
  const hpGain = calculateHPGain(attributes.endurance);
  const spGain = calculateSkillPointsGain(attributes.intelligence);
  const totalHP = calculateTotalHP(currentLevel, attributes);
  
  // Update level display (only if advancement elements exist)
  if (qs('current_level')) qs('current_level').textContent = currentLevel;
  if (qs('xp_to_next')) qs('xp_to_next').textContent = xpProgress.needed - xpProgress.current;
  if (qs('current_level_xp')) qs('current_level_xp').textContent = xpProgress.current;
  if (qs('needed_xp')) qs('needed_xp').textContent = xpProgress.needed;
  
  // Update per-level gains (only if advancement elements exist)
  if (qs('hp_per_level')) qs('hp_per_level').textContent = hpGain;
  if (qs('sp_per_level')) qs('sp_per_level').textContent = spGain;
  if (qs('total_hp_projected')) qs('total_hp_projected').textContent = totalHP;
  
  // Calculate perks earned based on race and level
  const race = qs('race').value || 'Human';
  const perksEarned = calculatePerksEarned(currentLevel, race);
  if (qs('perks_earned')) qs('perks_earned').textContent = perksEarned;
  
  // Build character object for perk eligibility checking
  const character = {
    level: currentLevel,
    race: race,
    attributes: attributes,
    skills: calculateFinalSkills(attributes, {}),
    karma: 0 // Default karma, could be extended
  };
  
  // Get eligible perks and display them
  const eligiblePerkIds = getEligiblePerks(character);
  renderAvailablePerks(eligiblePerkIds);
  renderSelectedPerks(perksEarned);
}

// Render list of available perks
function renderAvailablePerks(eligiblePerkIds) {
  const container = qs('available-perks-container');
  const noPerksMsg = qs('no-perks-msg');
  
  // Skip if perk containers don't exist (e.g., on main character creation page)
  if (!container || !noPerksMsg) return;
  
  const selectedPerks = getSelectedPerks();
  
  if (eligiblePerkIds.length === 0) {
    container.innerHTML = '';
    noPerksMsg.style.display = 'block';
    return;
  }
  
  noPerksMsg.style.display = 'none';
  
  container.innerHTML = eligiblePerkIds.map(perkId => {
    const perk = PERKS[perkId];
    if (!perk) return '';
    
    const isSelected = selectedPerks.some(p => p.id === perkId);
    const borderColor = isSelected ? '#4CAF50' : '#666';
    const bgColor = isSelected ? '#2a3a2a' : '#333';
    
    return `
      <div 
        class="perk-item" 
        data-perk-id="${perkId}"
        style="margin-bottom: 8px; padding: 8px; background-color: ${bgColor}; border-left: 3px solid ${borderColor}; border-radius: 2px; cursor: pointer; transition: all 0.2s;"
        onmouseenter="this.style.backgroundColor='${isSelected ? '#3a4a3a' : '#3a3a3a'}';"
        onmouseleave="this.style.backgroundColor='${bgColor}';"
      >
        <div style="font-weight: bold; color: #4CAF50;">${perk.name}</div>
        <div style="font-size: 0.9rem; color: #ddd; margin: 4px 0;">${perk.description}</div>
        <div style="font-size: 0.85rem; color: #aaa;">Ranks: ${perk.ranks} | ${perk.effects}</div>
      </div>
    `;
  }).join('');
  
  // Attach click handlers to perk items
  document.querySelectorAll('.perk-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const perkId = item.dataset.perkId;
      togglePerkSelection(perkId);
    });
  });
}

// Track selected perks
let selectedPerksData = [];

// Get selected perks
function getSelectedPerks() {
  return selectedPerksData;
}

// Toggle perk selection
function togglePerkSelection(perkId) {
  const currentLevel = Number(qs('current_level').textContent) || 1;
  const perksEarned = calculatePerksEarned(currentLevel, qs('race').value || 'Human');
  const selectedPerks = getSelectedPerks();
  
  const isAlreadySelected = selectedPerks.some(p => p.id === perkId);
  
  if (isAlreadySelected) {
    // Remove the perk
    selectedPerksData = selectedPerks.filter(p => p.id !== perkId);
  } else {
    // Add the perk (if we haven't hit the limit)
    if (selectedPerks.length < perksEarned) {
      selectedPerksData.push({ id: perkId, rank: 1 });
    } else {
      alert(`You can only select ${perksEarned} perk${perksEarned !== 1 ? 's' : ''} at this level.`);
      return;
    }
  }
  
  // Re-render
  const character = {
    level: currentLevel,
    race: qs('race').value || 'Human',
    attributes: {
      strength: Number(qs('strength').value) || 0,
      perception: Number(qs('perception').value) || 0,
      endurance: Number(qs('endurance').value) || 0,
      charisma: Number(qs('charisma').value) || 0,
      intelligence: Number(qs('intelligence').value) || 0,
      agility: Number(qs('agility').value) || 0,
      luck: Number(qs('luck').value) || 0
    },
    skills: calculateFinalSkills({
      strength: Number(qs('strength').value) || 0,
      perception: Number(qs('perception').value) || 0,
      endurance: Number(qs('endurance').value) || 0,
      charisma: Number(qs('charisma').value) || 0,
      intelligence: Number(qs('intelligence').value) || 0,
      agility: Number(qs('agility').value) || 0,
      luck: Number(qs('luck').value) || 0
    }, {}),
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
  
  // Skip if perk containers don't exist (e.g., on main character creation page)
  if (!container || !noSelectedMsg) return;
  
  const selectedPerks = getSelectedPerks();
  
  qs('selected_perks_count').textContent = selectedPerks.length;
  qs('max_selectable_perks').textContent = maxPerks;
  
  if (selectedPerks.length === 0) {
    container.innerHTML = '';
    noSelectedMsg.style.display = 'block';
    return;
  }
  
  noSelectedMsg.style.display = 'none';
  
  container.innerHTML = selectedPerks.map((selection) => {
    const perk = PERKS[selection.id];
    if (!perk) return '';
    
    return `
      <div 
        class="selected-perk-item" 
        data-perk-id="${selection.id}"
        style="margin-bottom: 8px; padding: 8px; background-color: #3a3a3a; border-left: 3px solid #ff9800; border-radius: 2px; cursor: pointer; transition: all 0.2s;"
        onmouseenter="this.style.backgroundColor='#4a4a3a';"
        onmouseleave="this.style.backgroundColor='#3a3a3a';"
      >
        <div style="font-weight: bold; color: #ff9800;">${perk.name}</div>
        <div style="font-size: 0.9rem; color: #ddd; margin: 4px 0;">${perk.description}</div>
        <div style="font-size: 0.85rem; color: #aaa;">Ranks: ${perk.ranks}</div>
        <button 
          type="button"
          class="remove-perk-btn"
          data-perk-id="${selection.id}"
          style="margin-top: 6px; padding: 4px 8px; background-color: #d32f2f; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 0.85rem;"
        >
          Remove
        </button>
      </div>
    `;
  }).join('');
  
  // Attach remove handlers
  document.querySelectorAll('.remove-perk-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const perkId = btn.dataset.perkId;
      togglePerkSelection(perkId);
    });
  });
}


