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

// Store character data
let characterData = {};

// Load character data from localStorage when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('advancement-page DOMContentLoaded fired');
  loadCharacterData();
  console.log('characterData after load:', characterData);
  
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

  // Initial display
  updateCharacterSummary();
  updateDisplay();
  renderOutput(characterData);
  console.log('Page initialization complete. Character data:', characterData);
});

// Load character data from localStorage
function loadCharacterData() {
  const stored = localStorage.getItem('falloutCharacter');
  console.log('Loading character data from localStorage:', stored);
  if (stored) {
    try {
      characterData = JSON.parse(stored);
      console.log('Loaded character data:', characterData);
    } catch (err) {
      console.error('Failed to load character data:', err);
      characterData = {};
    }
  } else {
    console.log('No character data found in localStorage');
  }
}

// Save character data to localStorage
function saveCharacterData() {
  localStorage.setItem('falloutCharacter', JSON.stringify(characterData));
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
  qs('char-name').textContent = name;
  qs('char-race').textContent = race;
  qs('char-level-xp').textContent = `${xpProgress.level} / ${totalXP} XP`;
  qs('char-hp').textContent = totalHP;
  
  // Apply trait modifiers to attributes for display
  const selectedTraits = characterData.selectedTraits || characterData.traits || [];
  const effectiveAttributes = getEffectiveAttributes(attributes, selectedTraits);
  
  // Update individual attributes with trait modifiers applied
  qs('char-str').textContent = effectiveAttributes.strength;
  qs('char-per').textContent = effectiveAttributes.perception;
  qs('char-end').textContent = effectiveAttributes.endurance;
  qs('char-chr').textContent = effectiveAttributes.charisma;
  qs('char-int').textContent = effectiveAttributes.intelligence;
  qs('char-agi').textContent = effectiveAttributes.agility;
  qs('char-lck').textContent = effectiveAttributes.luck;
  
  // Update additional info
  qs('char-tags').textContent = tagsDisplay;
  qs('char-traits').textContent = traitsDisplay;
  qs('char-top-skill').textContent = topSkill;
  
  console.log('Character summary updated');
}

// Update advancement display based on current XP and attributes
function updateDisplay() {
  const totalXP = characterData.totalXP || 0;
  const xpProgress = getXPProgress(totalXP);
  const attributes = characterData.attributes || {
    strength: 5,
    perception: 5,
    endurance: 5,
    charisma: 5,
    intelligence: 5,
    agility: 5,
    luck: 5
  };
  
  // Apply trait modifiers to attributes for calculations
  const selectedTraits = characterData.selectedTraits || characterData.traits || [];
  const effectiveAttributes = getEffectiveAttributes(attributes, selectedTraits);
  
  const currentLevel = xpProgress.level;
  const hpGain = calculateHPGain(effectiveAttributes.endurance);
  const spGain = calculateSkillPointsGain(effectiveAttributes.intelligence);
  const totalHP = calculateTotalHP(currentLevel, effectiveAttributes);
  
  // Update level display
  qs('current_level').textContent = currentLevel;
  qs('xp_to_next').textContent = xpProgress.needed - xpProgress.current;
  qs('current_level_xp').textContent = xpProgress.current;
  qs('needed_xp').textContent = xpProgress.needed;
  
  // Update per-level gains
  qs('hp_per_level').textContent = hpGain;
  qs('sp_per_level').textContent = spGain;
  qs('total_hp_projected').textContent = totalHP;
  
  // Calculate perks earned based on race and level
  const race = characterData.race || 'Human';
  const perksEarned = calculatePerksEarned(currentLevel, race);
  console.log(`DEBUG: Race="${race}", Level=${currentLevel}, PerksEarned=${perksEarned}`);
  qs('perks_earned').textContent = perksEarned;
  
  // Build character object for perk eligibility checking
  const character = {
    level: currentLevel,
    race: race,
    attributes: effectiveAttributes,
    skills: calculateFinalSkills(effectiveAttributes, characterData.tagSkills || {}, selectedTraits),
    karma: 0
  };
  
  // Get eligible perks and display them
  const eligiblePerkIds = getEligiblePerks(character);
  renderAvailablePerks(eligiblePerkIds);
  renderSelectedPerks(perksEarned);
  
  // Update notes field
  qs('notes').value = characterData.notes || '';
}

// Level up function
function levelUp() {
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  characterData.totalXP = nextLevelXP;
  
  // Lock in currently selected perks at this level (they become locked for future level-ups)
  const selectedPerks = characterData.selectedPerks || [];
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
  
  // Filter out perks that have reached maximum rank
  const availablePerkIds = eligiblePerkIds.filter(perkId => {
    const perk = PERKS[perkId];
    const selectedPerk = selectedPerks.find(p => p.id === perkId);
    const currentRank = selectedPerk ? selectedPerk.rank : 0;
    // Only show perks that haven't reached max rank, or perks not yet selected
    return currentRank < perk.ranks;
  });
  
  if (availablePerkIds.length === 0) {
    container.innerHTML = '';
    noPerksMsg.style.display = 'block';
    return;
  }
  
  noPerksMsg.style.display = 'none';
  
  container.innerHTML = availablePerkIds.map(perkId => {
    const perk = PERKS[perkId];
    if (!perk) return '';
    
    const selectedPerk = selectedPerks.find(p => p.id === perkId);
    const currentRank = selectedPerk ? selectedPerk.rank : 0;
    const rankDisplay = currentRank > 0 ? `${currentRank}/${perk.ranks}` : `0/${perk.ranks}`;
    const borderColor = currentRank > 0 ? '#4CAF50' : '#666';
    const bgColor = currentRank > 0 ? '#2a3a2a' : '#333';
    
    return `
      <div 
        class="perk-item" 
        data-perk-id="${perkId}"
        style="margin-bottom: 8px; padding: 8px; background-color: ${bgColor}; border-left: 3px solid ${borderColor}; border-radius: 2px; cursor: pointer; transition: all 0.2s;"
        onmouseenter="this.style.backgroundColor='${currentRank > 0 ? '#3a4a3a' : '#3a3a3a'}';"
        onmouseleave="this.style.backgroundColor='${bgColor}';"
      >
        <div style="font-weight: bold; color: #4CAF50;">${perk.name} <span style="color: #4CAF50; font-size: 0.9rem;">[${rankDisplay}]</span></div>
        <div style="font-size: 0.9rem; color: #ddd; margin: 4px 0;">${perk.description}</div>
        <div style="font-size: 0.85rem; color: #aaa;">${perk.effects}</div>
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

// Toggle perk selection
function togglePerkSelection(perkId) {
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  const perksEarned = calculatePerksEarned(currentLevel, characterData.race || 'Human');
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
  qs('selected_perks_count').textContent = totalRanksUsed;
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
    
    const isLocked = selection.lockedAtLevel && selection.lockedAtLevel < currentLevel;
    const isMaxRank = selection.rank >= perk.ranks;
    // Can remove rank only if the perk was modified at the current level (not locked in yet)
    const canRemoveRank = selection.modifiedAtLevel === currentLevel;
    
    return `
      <div 
        class="selected-perk-item" 
        data-perk-id="${selection.id}"
        style="margin-bottom: 8px; padding: 8px; background-color: ${isLocked ? '#2a3a2a' : '#3a3a3a'}; border-left: 3px solid ${isLocked ? '#8BC34A' : '#ff9800'}; border-radius: 2px; transition: all 0.2s;"
      >
        <div style="font-weight: bold; color: ${isLocked ? '#8BC34A' : '#ff9800'};">${perk.name} <span style="color: ${isMaxRank ? '#8BC34A' : '#aaa'}; font-size: 0.9rem;">[${selection.rank}/${perk.ranks}]</span></div>
        <div style="font-size: 0.9rem; color: #ddd; margin: 4px 0;">${perk.description}</div>
        <div style="font-size: 0.85rem; color: #aaa;">${perk.effects}</div>
        <div style="margin-top: 6px; display: flex; gap: 4px;">
          ${isLocked ? 
            `<div style="flex: 1; padding: 4px 8px; background-color: #1a4d1a; color: #8BC34A; border-radius: 2px; font-size: 0.85rem; text-align: center;">✓ Locked</div>` :
            canRemoveRank ?
            `<button 
              type="button"
              class="remove-rank-btn"
              data-perk-id="${selection.id}"
              style="flex: 1; padding: 4px 8px; background-color: #d32f2f; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 0.85rem;"
            >
              Remove Rank
            </button>` :
            ''
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
}

// Remove a rank from a perk
function removeRank(perkId) {
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  const selectedPerks = characterData.selectedPerks || [];
  const selectedPerkIndex = selectedPerks.findIndex(p => p.id === perkId);
  
  if (selectedPerkIndex === -1) return;
  
  const selectedPerk = selectedPerks[selectedPerkIndex];
  
  // Check if this perk is locked (cannot remove any ranks from locked perks)
  if (selectedPerk.lockedAtLevel !== undefined && selectedPerk.lockedAtLevel < currentLevel) {
    alert(`This perk was locked at level ${selectedPerk.lockedAtLevel} and cannot be removed or ranked down.`);
    return;
  }
  
  // Decrease rank
  if (selectedPerk.rank > 1) {
    selectedPerk.rank -= 1;
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
}

function renderOutput(obj){
  qs('output').textContent = JSON.stringify(obj,null,2)
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
