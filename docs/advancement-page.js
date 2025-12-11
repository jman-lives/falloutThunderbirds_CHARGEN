// Advancement Page Script
// Handles loading character data, managing advancement, and perks

function qs(id){return document.getElementById(id)}

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
  const tagSkillsList = Object.keys(tagSkills).filter(skill => tagSkills[skill]);
  const tagsDisplay = tagSkillsList.length > 0 ? tagSkillsList.join(', ') : 'None';
  
  // Get traits
  const traits = characterData.traits || [];
  const traitsDisplay = traits.length > 0 ? traits.join(', ') : 'None';
  
  // Find top skill
  const skills = characterData.skills || {};
  let topSkill = '-';
  let topValue = 0;
  for (const [skillName, skillValue] of Object.entries(skills)) {
    if (skillValue > topValue) {
      topValue = skillValue;
      topSkill = `${skillName} (${skillValue}%)`;
    }
  }
  
  // Update summary elements
  qs('char-name').textContent = name;
  qs('char-race').textContent = race;
  qs('char-level-xp').textContent = `${xpProgress.level} / ${totalXP} XP`;
  qs('char-hp').textContent = totalHP;
  
  // Update individual attributes
  qs('char-str').textContent = attributes.strength;
  qs('char-per').textContent = attributes.perception;
  qs('char-end').textContent = attributes.endurance;
  qs('char-chr').textContent = attributes.charisma;
  qs('char-int').textContent = attributes.intelligence;
  qs('char-agi').textContent = attributes.agility;
  qs('char-lck').textContent = attributes.luck;
  
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
  
  const currentLevel = xpProgress.level;
  const hpGain = calculateHPGain(attributes.endurance);
  const spGain = calculateSkillPointsGain(attributes.intelligence);
  const totalHP = calculateTotalHP(currentLevel, attributes);
  
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
  qs('perks_earned').textContent = perksEarned;
  
  // Build character object for perk eligibility checking
  const character = {
    level: currentLevel,
    race: race,
    attributes: attributes,
    skills: calculateFinalSkills(attributes, characterData.tagSkills || {}),
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

// Toggle perk selection
function togglePerkSelection(perkId) {
  const currentLevel = getLevelFromXP(characterData.totalXP || 0);
  const perksEarned = calculatePerksEarned(currentLevel, characterData.race || 'Human');
  let selectedPerks = characterData.selectedPerks || [];
  
  const isAlreadySelected = selectedPerks.some(p => p.id === perkId);
  
  if (isAlreadySelected) {
    selectedPerks = selectedPerks.filter(p => p.id !== perkId);
  } else {
    if (selectedPerks.length < perksEarned) {
      selectedPerks.push({ id: perkId, rank: 1 });
    } else {
      alert(`You can only select ${perksEarned} perk${perksEarned !== 1 ? 's' : ''} at this level.`);
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
