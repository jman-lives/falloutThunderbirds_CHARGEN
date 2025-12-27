function qs(id){return document.getElementById(id)}

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

// Log chargen start and set the flag
function logChargenStart() {
  console.log('%c[CHARGEN START - NAVIGATION TO ADVANCEMENT]', 'color: #FF9800; font-weight: bold;');
  console.log('  Setting fromChargen = true');
  localStorage.setItem('fromChargen', 'true');
  console.log('  Clearing isLevelUpSession flag');
  localStorage.removeItem('isLevelUpSession');
  console.log('  Flags set:', {
    fromChargen: localStorage.getItem('fromChargen'),
    isLevelUpSession: localStorage.getItem('isLevelUpSession')
  });
  // Detect if we're on debug page and navigate to corresponding advancement page
  const currentPage = window.location.pathname;
  const target = currentPage.includes('debug') ? 'advancement-debug.html' : 'advancement.html';
  // Use absolute path from root to handle GitHub Pages correctly
  const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  window.location.href = basePath + target;
}

// RACIAL_LIMITS is defined in advancement.js
const BASE_ATTRIBUTE_VALUE = 5;
const CHARACTER_POINTS_POOL = 5;
const ATTRIBUTE_NAMES = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];

// #region TRAITS DEFINITION
const TRAITS = {
  fast_metabolism: {
    name: 'Fast Metabolism',
    description: 'Your metabolic rate is twice normal.',
    effects: '+2 Healing Rate, Rad/Poison Resist reset to 0%',
    restrictions: ['Robots'],
    briefDescription: 'Faster healing, lower poison/rad resistance'
  },
  small_frame: {
    name: 'Small Frame',
    description: 'You are smaller than average, but more agile.',
    effects: '+1 Agility, Carry Weight = 15 × STR',
    restrictions: [],
    briefDescription: 'More agile, reduced carrying capacity'
  },
  one_hander: {
    name: 'One Hander',
    description: 'You favor single-handed weapons.',
    effects: '+20% to hit with one-handed weapons, −40% with two-handed',
    restrictions: ['Animals'],
    briefDescription: 'Better with one-handed weapons'
  },
  finesse: {
    name: 'Finesse',
    description: 'Your attacks favor precision over raw power.',
    effects: '30% less damage, +10% Critical Chance',
    restrictions: [],
    briefDescription: 'Precise attacks, lower damage'
  },
  kamikaze: {
    name: 'Kamikaze',
    description: 'You sacrifice defense for speed.',
    effects: 'No natural Armor Class, +5 Sequence',
    restrictions: [],
    briefDescription: 'Faster but vulnerable'
  },
  heavy_handed: {
    name: 'Heavy Handed',
    description: 'You hit harder, but lack finesse.',
    effects: '+4 Melee Damage, Critical hits 30% weaker and less likely',
    restrictions: [],
    briefDescription: 'More damage, weaker criticals'
  },
  fast_shot: {
    name: 'Fast Shot',
    description: 'You attack faster but less precisely.',
    effects: 'Ranged attacks cost 1 less AP, no targeted shots allowed',
    restrictions: ['Animals'],
    briefDescription: 'Faster ranged attacks, no targeting'
  },
  bloody_mess: {
    name: 'Bloody Mess',
    description: 'Violence follows you everywhere.',
    effects: 'No mechanical effect (flavor trait)',
    restrictions: [],
    briefDescription: 'More dramatic deaths (flavor)'
  },
  jinxed: {
    name: 'Jinxed',
    description: 'Bad luck spreads around you.',
    effects: 'Combat failures 50% more likely to crit fail',
    restrictions: [],
    briefDescription: 'Bad luck affects you and allies'
  },
  good_natured: {
    name: 'Good Natured',
    description: 'You focused on people, not violence.',
    effects: '+20% to First Aid/Doctor/Speech/Barter, −10% to combat skills',
    restrictions: ['Animals', 'Robots'],
    briefDescription: 'Better at social skills, worse at combat'
  },
  chem_reliant: {
    name: 'Chem Reliant',
    description: 'You become addicted more easily, but recover faster.',
    effects: 'Double addiction chance, halved recovery time',
    restrictions: ['Robots'],
    briefDescription: 'Easier addiction, faster recovery'
  },
  chem_resistant: {
    name: 'Chem Resistant',
    description: 'Chems affect you less.',
    effects: 'Chem effects half as long, 50% less addiction chance',
    restrictions: ['Robots'],
    briefDescription: 'Drugs less effective, less addictive'
  },
  night_person: {
    name: 'Night Person',
    description: 'You function better at night.',
    effects: 'Day: −1 INT/PE; Night: +1 INT/PE',
    restrictions: ['Robots'],
    briefDescription: 'Better at night, worse during day'
  },
  skilled: {
    name: 'Skilled',
    description: 'You focus on skills rather than perks.',
    effects: '+5 Skill Points/level, +10% all skills, Perks one level later',
    restrictions: ['Animals', 'Robots'],
    briefDescription: 'More skills, fewer perks'
  },
  gifted: {
    name: 'Gifted',
    description: 'You are naturally talented but undertrained.',
    effects: '+1 to all attributes, −10% to all skills, −5 Skill Points/level',
    restrictions: ['Robots'],
    briefDescription: 'Higher attributes, lower skills'
  },
  sex_appeal: {
    name: 'Sex Appeal',
    description: 'You are desirable to the opposite sex.',
    effects: '+1 CHA opposite sex, +40% Speech/Barter opposite sex, −1 CHA same sex',
    restrictions: ['Humans only'],
    briefDescription: 'Attractive to opposite sex'
  },
  glowing_one: {
    name: 'Glowing One',
    description: 'Radiation has permanently altered you.',
    effects: '+50% Radiation Resistance, nearby characters take 10 rads/hour',
    restrictions: ['Ghouls only'],
    briefDescription: 'Radiation resistance, radiation aura'
  },
  tech_wizard: {
    name: 'Tech Wizard',
    description: 'You are technologically gifted but visually impaired.',
    effects: '+15% to Science/Repair/Lockpick, −1 Perception',
    restrictions: ['Deathclaws', 'Dogs'],
    briefDescription: 'Better at tech, worse vision'
  },
  fear_the_reaper: {
    name: 'Fear the Reaper',
    description: 'You have escaped death… temporarily.',
    effects: 'Perks as if Human, 1/month death roll vs Luck',
    restrictions: ['Ghouls only'],
    briefDescription: 'Monthly death risk'
  }
};

const MAX_TRAITS = 2;

/**
 * Get selected traits from checkboxes
 * @returns {array} Array of selected trait IDs
 */
function getSelectedTraits() {
  const checkboxes = document.querySelectorAll('.trait-checkbox');
  return Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.trait);
}

/**
 * Update trait selection counter and validation
 */
function updateTraitSelectionDisplay() {
  const selectedTraits = getSelectedTraits();
  const countEl = qs('traits-count');
  const warningEl = qs('traits-warning');
  
  if (countEl) {
    countEl.textContent = selectedTraits.length;
  }
  
  if (warningEl) {
    if (selectedTraits.length > MAX_TRAITS) {
      warningEl.textContent = `⚠️ Too many traits selected. Maximum is ${MAX_TRAITS}. Current: ${selectedTraits.length}`;
      warningEl.style.display = 'block';
    } else {
      warningEl.style.display = 'none';
    }
  }
  
  updateAttributeDisplay();
  updateSkillDisplay();
  updateSecondaryStats();
  renderAttributeButtons();
  renderOutput(getFormData());
}

/**
 * Update attribute display with trait modifier indicators
 */
function updateAttributeDisplay() {
  const formData = getFormData();
  const traitMods = calculateTraitAttributeModifiers(formData.selectedTraits);
  
  const attributeNames = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
  
  attributeNames.forEach(attr => {
    const input = qs(attr);
    if (input) {
      const baseValue = Number(input.value) || 0;
      const traitMod = traitMods[attr] || 0;
      const effectiveValue = baseValue + traitMod;
      
      // Update the input visual to show trait modifiers
      if (traitMod > 0) {
        input.style.borderColor = '#34d399';
        input.style.borderWidth = '2px';
        input.title = `Base: ${baseValue}, Trait Bonus: +${traitMod}, Effective: ${effectiveValue}`;
      } else if (traitMod < 0) {
        input.style.borderColor = '#ff6b6b';
        input.style.borderWidth = '2px';
        input.title = `Base: ${baseValue}, Trait Penalty: ${traitMod}, Effective: ${effectiveValue}`;
      } else {
        input.style.borderColor = '';
        input.style.borderWidth = '';
        input.title = '';
      }
      
      // Update the effective value display
      const effectiveEl = qs(`${attr}-effective`);
      if (effectiveEl) {
        if (traitMod !== 0) {
          const sign = traitMod > 0 ? '+' : '';
          effectiveEl.textContent = `→ ${effectiveValue} (${sign}${traitMod})`;
          effectiveEl.style.color = traitMod > 0 ? '#34d399' : '#ff6b6b';
          effectiveEl.style.fontWeight = 'bold';
        } else {
          effectiveEl.textContent = '';
          effectiveEl.style.color = '#999';
          effectiveEl.style.fontWeight = 'normal';
        }
      }
    }
  });
}

/**
 * Check if adding a trait would violate racial attribute maximums
 * @param {string} traitId - The trait ID to check
 * @returns {boolean} True if trait can be safely added, false if it violates limits
 */
function canAddTraitWithoutViolatingLimits(traitId) {
  const race = qs('race')?.value || 'Human';
  const raceLimits = RACIAL_LIMITS[race] || RACIAL_LIMITS.Human;
  
  // Get current selected traits and add the new one
  const selectedTraits = getSelectedTraits();
  if (!selectedTraits.includes(traitId)) {
    selectedTraits.push(traitId);
  }
  
  // Get trait modifiers with the new trait included
  const traitMods = calculateTraitAttributeModifiers(selectedTraits);
  
  // Check each attribute against racial limits
  const attributes = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
  for (const attr of attributes) {
    const baseValue = Number(qs(attr)?.value) || BASE_ATTRIBUTE_VALUE;
    const effectiveValue = baseValue + (traitMods[attr] || 0);
    const limits = raceLimits[attr];
    
    // If effective value exceeds racial maximum, trait cannot be added
    if (effectiveValue > limits.max) {
      return false;
    }
  }
  
  return true;
}

/**
 * Handle trait checkbox change
 */
function handleTraitChange(traitId) {
  const selectedTraits = getSelectedTraits();
  const checkbox = document.querySelector(`input[data-trait="${traitId}"]`);
  
  // If trying to select more than MAX_TRAITS, prevent it
  if (selectedTraits.length > MAX_TRAITS) {
    if (checkbox) {
      checkbox.checked = false;
    }
    return;
  }
  
  // If checkbox is being checked, validate that traits won't exceed racial limits
  if (checkbox && checkbox.checked) {
    if (!canAddTraitWithoutViolatingLimits(traitId)) {
      checkbox.checked = false;
      const warningEl = qs('traits-warning');
      if (warningEl) {
        warningEl.textContent = '⚠️ This trait would push attributes beyond racial maximums';
        warningEl.style.display = 'block';
        // Auto-hide the warning after 4 seconds
        setTimeout(() => {
          if (warningEl.style.display === 'block') {
            warningEl.style.display = 'none';
          }
        }, 4000);
      }
      return;
    }
  }
  
  renderTraits();
  updateTraitSelectionDisplay();
}

/**
 * Render traits selection UI
 */
function renderTraits() {
  const container = qs('traits-container');
  if (!container) return;
  
  const race = qs('race')?.value || 'Human';
  const selectedTraits = getSelectedTraits();
  
  let html = '';
  for (const [traitId, trait] of Object.entries(TRAITS)) {
    const isRestricted = trait.restrictions.length > 0 && 
      (trait.restrictions.includes(race) || 
       trait.restrictions.some(r => r.includes('only') && !r.toLowerCase().includes(race.toLowerCase())));
    
    const isSelected = selectedTraits.includes(traitId);
    
    html += `<div class="trait-card ${isSelected ? 'selected' : ''} ${isRestricted ? 'restricted' : ''}" 
         ${isRestricted ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''}>
      <label class="trait-card-label" ${isRestricted ? 'style="cursor: not-allowed;"' : ''}>
        <input 
          type="checkbox" 
          class="trait-checkbox trait-card-checkbox"
          data-trait="${traitId}"
          ${isRestricted ? 'disabled' : ''}
          ${isSelected ? 'checked' : ''}
        >
        <span class="trait-card-name">${trait.name}</span>
      </label>
      <div class="trait-card-description">${trait.briefDescription}</div>
      <div class="trait-card-description" style="font-size: 0.75rem; color: #aaa;">${trait.effects}</div>
      ${isRestricted ? `<div class="trait-card-restrictions">Not available for ${race}</div>` : ''}
    </div>`;
  }
  
  console.log('Generated HTML length:', html.length, 'Num traits:', Object.keys(TRAITS).length);
  container.innerHTML = html;
  
  const checkboxes = document.querySelectorAll('.trait-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      handleTraitChange(e.target.dataset.trait);
    });
  });
}

/**
 * Render attribute buttons as a button-based interface
 * Replaces the old number input system with +/- buttons for better UX
 */
function renderAttributeButtons() {
  const container = qs('attribute-buttons');
  if (!container) return;
  
  const race = qs('race')?.value || 'Human';
  const raceLimits = RACIAL_LIMITS[race] || RACIAL_LIMITS.Human;
  const formData = getFormData();
  const traitMods = calculateTraitAttributeModifiers(formData.selectedTraits);
  
  const attributeLabels = {
    strength: 'Strength (STR)',
    perception: 'Perception (PE)',
    endurance: 'Endurance (EN)',
    charisma: 'Charisma (CH)',
    intelligence: 'Intelligence (IN)',
    agility: 'Agility (AG)',
    luck: 'Luck (LK)'
  };
  
  let html = '';
  ATTRIBUTE_NAMES.forEach(attrName => {
    const currentValue = Number(qs(attrName).value) || BASE_ATTRIBUTE_VALUE;
    const traitMod = traitMods[attrName] || 0;
    const effectiveValue = currentValue + traitMod;
    const limits = raceLimits[attrName];
    const canDecrease = currentValue > limits.min;
    const canIncrease = currentValue < limits.max;
    
    const pointsAllocated = calculatePointsAllocated();
    const pointsRemaining = CHARACTER_POINTS_POOL - pointsAllocated;
    
    // Only allow increase if we have points remaining (unless it's to decrease)
    const canIncreaseWithPoints = canIncrease && pointsRemaining > 0;
    
    const modColor = traitMod > 0 ? '#34d399' : (traitMod < 0 ? '#ff6b6b' : 'var(--muted)');
    const modDisplay = traitMod !== 0 
      ? `<div class="attribute-info" style="color: ${modColor}; font-weight: bold;">${traitMod > 0 ? '+' : ''}${traitMod}</div>` 
      : '';
    
    html += `
      <div class="attribute-button-item">
        <div class="attribute-name">${attributeLabels[attrName]}</div>
        <div class="attribute-controls">
          <button type="button" class="attribute-btn" data-attr="${attrName}" data-action="decrease" 
            ${!canDecrease ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>−</button>
          <div class="attribute-value">${effectiveValue}</div>
          <button type="button" class="attribute-btn" data-attr="${attrName}" data-action="increase" 
            ${!canIncreaseWithPoints ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>+</button>
        </div>
        ${modDisplay}
        <div class="attribute-info">${limits.min}–${limits.max}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// #endregion TRAITS DEFINITION

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
  
  // Allow going above racial maximum (traits can push attributes higher)
  // But warn if exceeding point pool
  
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
  // Collect tag skills from checkboxes if they exist (chargen.html)
  // Otherwise, preserve from loaded character data (advancement.html)
  let tagSkills = {};
  const checkboxes = document.querySelectorAll('.tag-checkbox');
  
  if (checkboxes.length > 0) {
    // We're on chargen.html with checkboxes
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

  const selectedTraits = getSelectedTraits();
  const effectiveAttributes = getEffectiveAttributes(attributes, selectedTraits);

  return {
    player: qs('player').value||null,
    name: qs('name').value||null,
    race: qs('race').value||null,
    age: parseInt(qs('age').value)||null,
    gender: qs('gender').value||null,
    attributes: attributes,
    tagSkills: tagSkills,
    skills: calculateFinalSkills(effectiveAttributes, tagSkills, selectedTraits),
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
    selectedTraits: getSelectedTraits(),
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
  // Only restore tag checkbox states if checkboxes exist (chargen.html)
  const checkboxes = document.querySelectorAll('.tag-checkbox');
  if (checkboxes.length > 0) {
    checkboxes.forEach(checkbox => {
      checkbox.checked = tagSkills[checkbox.dataset.skill] || false;
    });
  }
  
  // Restore selected traits
  const loadedTraits = data.selectedTraits || [];
  const traitCheckboxes = document.querySelectorAll('.trait-checkbox');
  if (traitCheckboxes.length > 0) {
    traitCheckboxes.forEach(checkbox => {
      checkbox.checked = loadedTraits.includes(checkbox.dataset.trait) || false;
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
  updateAttributeDisplay()
  updateTraitSelectionDisplay()
  updateSkillDisplay()
  updateSecondaryStats()
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
  // Clear any old characterData from previous uploads to avoid conflicts
  localStorage.removeItem('characterData');
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

// #region TRAIT ATTRIBUTE MODIFIERS
/**
 * Calculate attribute modifiers from selected traits
 * @param {array} selectedTraits - Array of selected trait IDs
 * @returns {object} Trait modifiers for each attribute
 */
function calculateTraitAttributeModifiers(selectedTraits = []) {
  const modifiers = {
    strength: 0,
    perception: 0,
    endurance: 0,
    charisma: 0,
    intelligence: 0,
    agility: 0,
    luck: 0
  };

  // Define trait attribute modifiers
  const traitAttributeEffects = {
    'small_frame': {
      agility: 1
    },
    'gifted': {
      strength: 1,
      perception: 1,
      endurance: 1,
      charisma: 1,
      intelligence: 1,
      agility: 1,
      luck: 1
    },
    'tech_wizard': {
      perception: -1
    }
  };

  selectedTraits.forEach(traitId => {
    if (traitAttributeEffects[traitId]) {
      Object.keys(traitAttributeEffects[traitId]).forEach(attr => {
        modifiers[attr] += traitAttributeEffects[traitId][attr];
      });
    }
  });

  return modifiers;
}

/**
 * Get effective attributes including trait modifiers
 * @param {object} baseAttributes - Base character attributes from input
 * @param {array} selectedTraits - Array of selected trait IDs
 * @returns {object} Effective attributes with trait bonuses applied
 */
function getEffectiveAttributes(baseAttributes, selectedTraits = []) {
  const traitMods = calculateTraitAttributeModifiers(selectedTraits);
  const effective = {};

  Object.keys(baseAttributes).forEach(attr => {
    effective[attr] = (baseAttributes[attr] || 0) + (traitMods[attr] || 0);
  });

  return effective;
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
function calculateSecondaryStats(attributes, race = 'Human', selectedTraits = []) {
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

  // Calculate carry weight (can be modified by Small Frame trait)
  let carryWeight = calculateCarryWeight(str);
  if (selectedTraits.includes('small_frame')) {
    // Small Frame changes formula to 15 × STR instead of 25 × STR
    carryWeight = 15 * str;
  }

  // Calculate armor class (can be affected by Kamikaze trait)
  let armorClass = calculateArmorClass(agi, 0);
  if (selectedTraits.includes('kamikaze')) {
    // Kamikaze: No natural AC, Agility does not contribute
    armorClass = 0;
  }

  // Calculate base stats
  let stats = {
    Hit_Points: calculateMaxHp(str, end, 1),
    Armor_Class: armorClass,
    Action_Points: calculateActionPoints(agi),
    Carry_Weight: carryWeight,
    Melee_Damage: calculateMeleeDamage(str),
    Poison_Resist: basePoisonResist + (racialResistances.Poison_Resist || 0),
    Radiation_Resist: baseRadiationResist + (racialResistances.Radiation_Resist || 0),
    Sequence: calculateSequence(per),
    Healing_Rate: calculateHealingRate(end),
    Critical_Chance: calculateCriticalChance(luck),
    Gas_Resist: 0,
    Electricity_Resist: racialResistances.Electricity_Resist || 0,
  };

  // Apply trait modifiers to secondary stats
  if (selectedTraits.includes('fast_metabolism')) {
    stats.Healing_Rate += 2; // +2 Healing Rate
    stats.Radiation_Resist = 0; // Reset to 0%
    stats.Poison_Resist = 0; // Reset to 0%
    // Racial modifiers applied AFTER reset
    if (race === 'Ghoul') {
      stats.Radiation_Resist += 80;
      stats.Poison_Resist += 30;
    }
  }

  if (selectedTraits.includes('finesse')) {
    stats.Critical_Chance += 10; // +10% Critical Chance
  }

  if (selectedTraits.includes('kamikaze')) {
    stats.Sequence += 5; // +5 Sequence
  }

  if (selectedTraits.includes('heavy_handed')) {
    stats.Melee_Damage += 4; // +4 Melee Damage
  }

  if (selectedTraits.includes('fast_shot')) {
    // Note: This affects Action Points for ranged attacks, but we'll note it in AP for now
    // In actual gameplay, this would be handled during combat
    // For display purposes, we could mark it somehow, but it's a combat rule not a stat change
  }

  if (selectedTraits.includes('glowing_one')) {
    stats.Radiation_Resist += 50; // +50% Radiation Resistance
  }

  // Clamp all resistance values to reasonable ranges (0-100%)
  stats.Poison_Resist = Math.max(0, Math.min(100, stats.Poison_Resist));
  stats.Radiation_Resist = Math.max(0, Math.min(100, stats.Radiation_Resist));
  stats.Gas_Resist = Math.max(0, Math.min(100, stats.Gas_Resist));
  stats.Electricity_Resist = Math.max(0, Math.min(100, stats.Electricity_Resist));

  return stats;
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
    pilot: 0 + (2 * ag), // Note: Not in instructions, but in form
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
  const effectiveAttributes = getEffectiveAttributes(formData.attributes, formData.selectedTraits);
  const baseSkills = calculateBaseSkills(effectiveAttributes);
  const finalSkills = calculateFinalSkills(effectiveAttributes, formData.tagSkills, formData.selectedTraits);
  
  // Load skill increases from localStorage (applied during leveling)
  let characterData = {};
  try {
    const stored = localStorage.getItem('falloutCharacter');
    if (stored) {
      characterData = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not load character data from localStorage:', e);
  }
  const skillIncreases = characterData.skillIncreases || {};
  
  // Define trait skill modifiers for display purposes
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
      guns: 10, energy_weapons: 10, unarmed: 10, melee_weapons: 10,
      throwing: 10, first_aid: 10, doctor: 10, sneak: 10,
      lockpick: 10, steal: 10, traps: 10, science: 10,
      repair: 10, pilot: 10, speech: 10, barter: 10,
      gambling: 10, outdoorsman: 10
    },
    'gifted': {
      guns: -10, energy_weapons: -10, unarmed: -10, melee_weapons: -10,
      throwing: -10, first_aid: -10, doctor: -10, sneak: -10,
      lockpick: -10, steal: -10, traps: -10, science: -10,
      repair: -10, pilot: -10, speech: -10, barter: -10,
      gambling: -10, outdoorsman: -10
    },
    'tech_wizard': {
      science: 15,
      repair: 15
    }
  };
  
  // Update base skill display and final values
  Object.keys(baseSkills).forEach(skillKey => {
    const baseEl = qs(`base_${skillKey}`);
    if (baseEl) {
      const baseValue = baseSkills[skillKey];
      const finalValue = finalSkills[skillKey];
      const isTagged = formData.tagSkills[skillKey];
      
      // Add skill increases from leveling
      const skillIncrease = skillIncreases[skillKey] || 0;
      const totalValue = Math.min(finalValue + skillIncrease, 100); // Cap at 100 for display on main sheet
      
      // Calculate trait modifier for this skill
      let traitModifier = 0;
      formData.selectedTraits.forEach(traitId => {
        if (traitModifiers[traitId] && traitModifiers[traitId][skillKey] !== undefined) {
          traitModifier += traitModifiers[traitId][skillKey];
        }
      });
      
      // Build display text with modifiers
      let displayText = `${totalValue}%`;
      let indicators = [];
      
      // Add skill increase indicator if there are increases
      if (skillIncrease > 0) {
        indicators.push(`leveling +${skillIncrease}%`);
      }
      
      // Add tag modifier (always +20 if tagged)
      if (isTagged) {
        indicators.push('tag +20%');
      }
      
      // Add trait modifier with sign
      if (traitModifier !== 0) {
        const sign = traitModifier > 0 ? '+' : '';
        indicators.push(`trait ${sign}${traitModifier}%`);
      }
      
      if (indicators.length > 0) {
        displayText += ` (${indicators.join(', ')})`;
      }
      
      baseEl.textContent = displayText;
      
      // Color based on modifications - prioritize negative traits
      if (skillIncrease > 0) {
        baseEl.style.color = '#FFD700'; // Gold for leveling increases
      } else if (traitModifier < 0) {
        baseEl.style.color = '#ff6b6b'; // Red for negative traits
      } else if (isTagged || traitModifier > 0) {
        baseEl.style.color = '#34d399'; // Green for tags or positive traits
      } else {
        baseEl.style.color = 'inherit';
      }
      
      baseEl.style.fontWeight = (isTagged || traitModifier !== 0 || skillIncrease > 0) ? 'bold' : 'normal';
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
  const allSkills = ['guns', 'energy_weapons', 'unarmed', 'melee_weapons', 'throwing', 'first_aid', 'doctor', 'sneak', 'lockpick', 'steal', 'traps', 'science', 'repair', 'pilot', 'speech', 'barter', 'gambling', 'outdoorsman']
  
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
  
  // Select up to 2 random traits (respecting race restrictions)
  const traitRaceLimits = RACIAL_LIMITS[selectedRace];
  const availableTraits = Object.entries(TRAITS)
    .filter(([traitId, trait]) => {
      // Check if trait is restricted for this race
      if (trait.restrictions.length === 0) return true; // No restrictions
      
      // Check for "only" restrictions (e.g., "Humans only", "Ghouls only")
      const onlyRestrictions = trait.restrictions.filter(r => r.includes('only'));
      if (onlyRestrictions.length > 0) {
        // Must match at least one "only" restriction
        return onlyRestrictions.some(r => r.toLowerCase().includes(selectedRace.toLowerCase()));
      }
      
      // Check for race exclusions (e.g., "Robots", "Animals")
      return !trait.restrictions.includes(selectedRace);
    })
    .map(([traitId]) => traitId);
  
  // Randomly select 0, 1, or 2 traits from available traits
  const numTraits = randInt(0, Math.min(2, availableTraits.length));
  const selectedTraits = [];
  if (numTraits > 0) {
    const shuffledTraits = availableTraits.sort(() => Math.random() - 0.5);
    for (let i = 0; i < numTraits; i++) {
      selectedTraits.push(shuffledTraits[i]);
    }
  }
  
  const char = {
    name: sampleNames[randInt(0,sampleNames.length-1)],
    race: selectedRace,
    age: randInt(16, selectedRace === 'Ghoul' ? 236 : 80),
    gender: genders[randInt(0,genders.length-1)],
    attributes: attributes,
    tagSkills: tagSkills,
    selectedTraits: selectedTraits,
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
  renderTraits();
  renderOutput(getFormData());
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
}

function renderOutput(obj){
  const outputEl = qs('output');
  if (outputEl) {
    outputEl.textContent = JSON.stringify(obj,null,2);
  }
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
    // Log character data from storage at page load
    logCharacterFromStorage();
    
    console.log('DOMContentLoaded fired, setting up event listeners');
    
    // Skip character creation UI setup if we're on the game page
    if (document.title === 'Play Game - Fallout Character Generator') {
      return;
    }
    
    // Try to load dev config for local development
    fetch('dev-config.json')
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('dev-config.json not found');
      })
      .then(config => {
        if (config.playerName) {
          const playerField = qs('player');
          if (playerField && !playerField.value) {
            playerField.value = config.playerName;
            console.log('Loaded player name from dev-config:', config.playerName);
          }
        }
      })
      .catch(err => {
        // Silently fail if dev-config doesn't exist (production environment)
        console.log('dev-config.json not available (this is normal in production)');
      });
    
    const randomBtn = qs('randomize');
    if (randomBtn) {
      randomBtn.addEventListener('click', randomizeCharacter);
      console.log('Attached randomize handler');
    } else {
      console.warn('randomize button not found');
    }
    
    const randomAgeBtn = qs('random-age-btn');
    if (randomAgeBtn) {
      randomAgeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const randomAge = Math.floor(Math.random() * (39 - 21 + 1)) + 21; // Random between 21-39
        qs('age').value = randomAge;
        console.log('Random age set to:', randomAge);
      });
      console.log('Attached random-age handler');
    } else {
      console.warn('random-age-btn button not found');
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

    // Advancement button handler - save and navigate
    const advBtn = qs('go-advancement');
    console.log('Looking for go-advancement button:', advBtn);
    if (advBtn) {
      // CRITICAL: Remove any existing onclick attributes that may be in cached HTML
      advBtn.onclick = null;
      advBtn.removeAttribute('onclick');
      
      // Remove any existing listeners first by cloning
      const newAdvBtn = advBtn.cloneNode(true);
      newAdvBtn.onclick = null;
      newAdvBtn.removeAttribute('onclick');
      advBtn.parentNode.replaceChild(newAdvBtn, advBtn);
      const advBtnFresh = qs('go-advancement');
      
      advBtnFresh.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('%c[ADVANCEMENT BUTTON CLICKED]', 'color: #FF9800; font-weight: bold;');
        const playerField = qs('player');
        const nameField = qs('name');
        const playerName = playerField ? playerField.value.trim() : '';
        const characterName = nameField ? nameField.value.trim() : '';
        
        console.log('  Player Name:', JSON.stringify(playerName), 'Length:', playerName.length);
        console.log('  Character Name:', JSON.stringify(characterName), 'Length:', characterName.length);
        
        // Check if Player field is filled
        if (!playerName) {
          console.warn('  ❌ Player field is EMPTY - blocking navigation');
          alert('Please enter a Player name before accessing Advancement & Perks');
          console.log('  ❌ Blocked - returning early');
          return false;
        }
        console.log('  ✓ Player name OK');
        
        // Check if Character Name field is filled
        if (!characterName) {
          console.warn('  ❌ Character Name field is EMPTY - blocking navigation');
          alert('Please enter a Character Name before accessing Advancement & Perks');
          console.log('  ❌ Blocked - returning early');
          return false;
        }
        console.log('  ✓ Character name OK');
        
        console.log('  ✅ All validations passed - proceeding with navigation');
        const formData = getFormData();
        console.log('Current form data:', formData);
        saveCharacterData();
        console.log('Data saved, navigating to advancement page');
        // Call logChargenStart to set flags and navigate
        logChargenStart();
        return false;
      }, true); // Use capture phase
      console.log('Event listener attached to advancement button');
    } else {
      console.warn('WARNING: go-advancement button not found in DOM');
    }

  // Only set up chargen.html-specific handlers if we're on chargen.html
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
      
      // Unselect traits that are no longer valid for the new race
      const traitCheckboxes = document.querySelectorAll('.trait-checkbox');
      traitCheckboxes.forEach(checkbox => {
        const traitId = checkbox.dataset.trait;
        const trait = TRAITS[traitId];
        
        if (trait) {
          const isRestricted = trait.restrictions.length > 0 && 
            (trait.restrictions.includes(selectedRace) || 
             trait.restrictions.some(r => r.includes('only') && !r.toLowerCase().includes(selectedRace.toLowerCase())));
          
          if (isRestricted && checkbox.checked) {
            checkbox.checked = false;
            console.log(`Unselected trait "${trait.name}" - not available for ${selectedRace}`);
          }
        }
      });
      
      // Re-render traits when race changes
      renderTraits();
      
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
      renderTraits();
      updateTraitSelectionDisplay();
      renderAttributeButtons();
      renderOutput(getFormData())
    })

    // Attribute button click handlers - handle +/- button interactions
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.attribute-btn');
      if (!btn) return;
      
      const attrName = btn.dataset.attr;
      const action = btn.dataset.action;
      const input = qs(attrName);
      
      if (!input) return;
      
      let currentValue = Number(input.value) || BASE_ATTRIBUTE_VALUE;
      const race = qs('race')?.value || 'Human';
      const raceLimits = RACIAL_LIMITS[race] || RACIAL_LIMITS.Human;
      const limits = raceLimits[attrName];
      
      if (action === 'increase' && currentValue < limits.max) {
        const pointsAllocated = calculatePointsAllocated();
        const pointsRemaining = CHARACTER_POINTS_POOL - pointsAllocated;
        
        // Only allow increase if we have points remaining
        if (pointsRemaining > 0) {
          input.value = currentValue + 1;
        }
      } else if (action === 'decrease' && currentValue > limits.min) {
        input.value = currentValue - 1;
      }
      
      // Trigger updates
      updateAttributeDisplay();
      updateSecondaryStats();
      updateSkillDisplay();
      updatePointsPoolDisplay();
      renderAttributeButtons();
      renderOutput(getFormData());
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

    // Initialize stats on page load (only on chargen.html)
    updateAttributeDisplay();
    updateSecondaryStats();
    updateSkillDisplay();
    updatePointsPoolDisplay();
    updateAdvancementDisplay();
    renderTraits();
    renderAttributeButtons();
    
    // initial render
    renderOutput(getFormData())
  }

  // Level up button handler (only on advancement page)
  const levelUpBtn = qs('level-up-btn');
  if (levelUpBtn) {
    levelUpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentLevelEl = qs('current_level');
      const currentLevel = currentLevelEl ? Number(currentLevelEl.textContent) || 1 : 1;
      const nextLevelXP = getXPForLevel(currentLevel + 1);
      const totalXpEl = qs('total_xp');
      if (totalXpEl) totalXpEl.textContent = nextLevelXP;
      
      // If we're on the advancement page, use updateDisplay() from advancement-page.js
      // Otherwise use updateAdvancementDisplay()
      if (typeof updateDisplay === 'function' && qs('char-form')) {
        updateDisplay();
        renderOutput(characterData || {});
      } else {
        updateAdvancementDisplay();
        renderOutput(getFormData());
      }
    });
    console.log('Attached level-up button handler');
  }

  } catch(err) {
    console.error('Error during DOMContentLoaded setup:', err.message, err.stack);
  }
})

// Refresh skills when page becomes visible (returns from another page)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page is now visible - refresh skill display in case data was modified
    const skillDisplayEl = qs('base_guns');
    if (skillDisplayEl) {
      // Only on main character sheet (index.html), not on advancement page
      updateSkillDisplay();
      console.log('Page visibility: refreshed skill display');
    }
  }
});

// Update secondary statistics based on current attribute values
function updateSecondaryStats() {
  const formData = getFormData();
  const race = qs('race').value || 'Human';
  
  // Get effective attributes with trait modifiers applied
  const effectiveAttributes = getEffectiveAttributes(formData.attributes, formData.selectedTraits);
  
  // Calculate stats using effective attributes and trait modifiers
  const stats = calculateSecondaryStats(effectiveAttributes, race, formData.selectedTraits);
  
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
  
  // On advancement page, attributes come from localStorage character data
  // On main character page, they come from form fields
  let attributes = {
    strength: 5,
    perception: 5,
    endurance: 5,
    charisma: 5,
    intelligence: 5,
    agility: 5,
    luck: 5,
  };
  
  // Try to get attributes from form fields (main character page)
  const strengthInput = qs('strength');
  if (strengthInput) {
    attributes = {
      strength: Number(strengthInput.value) || 5,
      perception: Number(qs('perception').value) || 5,
      endurance: Number(qs('endurance').value) || 5,
      charisma: Number(qs('charisma').value) || 5,
      intelligence: Number(qs('intelligence').value) || 5,
      agility: Number(qs('agility').value) || 5,
      luck: Number(qs('luck').value) || 5,
    };
  }
  
  const totalXP = Number(qs('total_xp').textContent) || 0;
  const xpProgress = getXPProgress(totalXP);
  
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
  // On advancement pages, race comes from localStorage via advancement-page.js
  // On main character page, race comes from form field
  const raceElement = qs('race');
  const race = raceElement ? (raceElement.value || 'Human') : 'Human';
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
  const currentLevelEl = qs('current_level');
  const currentLevel = currentLevelEl ? Number(currentLevelEl.textContent) || 1 : 1;
  const raceEl = qs('race');
  const race = raceEl ? (raceEl.value || 'Human') : 'Human';
  const perksEarned = calculatePerksEarned(currentLevel, race);
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


