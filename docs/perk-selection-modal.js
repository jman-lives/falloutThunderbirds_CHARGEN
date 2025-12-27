/**
 * Perk Selection Modal System
 * Handles modals for perks that require player selections (e.g., Tag! perk, Mutate! perk)
 */

// Global state for perk selection modal
const perkSelectionState = {
  isOpen: false,
  selectedOption: null,
  currentPerk: null,
  selectionType: null, // 'skill', 'trait', etc.
  options: null,  // Full options object from openPerkSelectionModal
};

// SKILLS object - defines available skills for Tag! perk
const SKILLS = {
  guns: { name: 'Guns', initial: 0 },
  energy_weapons: { name: 'Energy Weapons', initial: 0 },
  unarmed: { name: 'Unarmed', initial: 0 },
  melee_weapons: { name: 'Melee Weapons', initial: 0 },
  throwing: { name: 'Throwing', initial: 0 },
  first_aid: { name: 'First Aid', initial: 0 },
  doctor: { name: 'Doctor', initial: 0 },
  sneak: { name: 'Sneak', initial: 0 },
  lockpick: { name: 'Lockpick', initial: 0 },
  steal: { name: 'Steal', initial: 0 },
  traps: { name: 'Traps', initial: 0 },
  science: { name: 'Science', initial: 0 },
  repair: { name: 'Repair', initial: 0 },
  pilot: { name: 'Pilot', initial: 0 },
  speech: { name: 'Speech', initial: 0 },
  barter: { name: 'Barter', initial: 0 },
  gambling: { name: 'Gambling', initial: 0 },
  outdoorsman: { name: 'Outdoorsman', initial: 0 }
};

/**
 * Open the perk selection modal
 * @param {string} perkId - The ID of the perk requiring selection
 * @param {object} options - Configuration for the modal
 */
function openPerkSelectionModal(perkId, options = {}) {
  const perk = PERKS[perkId];
  if (!perk) {
    console.error(`[PERK MODAL] Perk not found: ${perkId}`);
    return;
  }

  perkSelectionState.currentPerk = perkId;
  perkSelectionState.selectedOption = null;
  perkSelectionState.selectionType = options.type || 'skill';
  perkSelectionState.options = options;  // Store full options object

  const modal = document.getElementById('perk-selection-modal');
  const title = document.getElementById('perk-selection-title');
  const description = document.getElementById('perk-selection-description');
  const optionsContainer = document.getElementById('perk-selection-options');
  const counter = document.getElementById('perk-selection-counter');

  // Set title and description
  title.textContent = perk.name;
  description.innerHTML = `<strong>${perk.effects}</strong><br><br>${options.prompt || 'Select from the options below:'}`;

  // Clear previous options
  optionsContainer.innerHTML = '';

  // Populate options based on selection type
  const optionsList = options.options || [];
  
  optionsList.forEach((option) => {
    const optionEl = document.createElement('div');
    optionEl.className = 'perk-option-item';
    optionEl.dataset.optionValue = option.id || option;
    
    optionEl.innerHTML = `
      <div class="perk-option-label">${option.name || option}</div>
      ${option.details ? `<div class="perk-option-details">${option.details}</div>` : ''}
    `;
    
    optionEl.addEventListener('click', () => selectPerkOption(option.id || option, optionEl));
    optionsContainer.appendChild(optionEl);
  });

  // Update counter if multiple selections are allowed
  if (options.count && options.count > 1) {
    counter.textContent = `Select ${options.count - 1} more`;
  } else {
    counter.textContent = '';
  }

  // Show modal
  modal.classList.add('active');
  perkSelectionState.isOpen = true;

  console.log(`%c[PERK MODAL OPENED]`, 'color: #FF9800; font-weight: bold;', { perkId, type: perkSelectionState.selectionType, options: optionsList });
}

/**
 * Close the perk selection modal
 */
function closePerkSelectionModal() {
  const modal = document.getElementById('perk-selection-modal');
  modal.classList.remove('active');
  perkSelectionState.isOpen = false;
  perkSelectionState.selectedOption = null;
  perkSelectionState.currentPerk = null;

  console.log('%c[PERK MODAL CLOSED]', 'color: #FF9800; font-weight: bold;');
}

/**
 * Select a perk option
 * @param {string} optionValue - The value of the selected option
 * @param {element} optionEl - The DOM element that was clicked
 */
function selectPerkOption(optionValue, optionEl) {
  // Remove previous selection
  const previousSelected = document.querySelector('.perk-option-item.selected');
  if (previousSelected) {
    previousSelected.classList.remove('selected');
  }

  // Mark as selected
  optionEl.classList.add('selected');
  perkSelectionState.selectedOption = optionValue;

  console.log('%c[PERK OPTION SELECTED]', 'color: #4CAF50; font-weight: bold;', optionValue);
}

/**
 * Confirm the perk selection in the modal
 */
function confirmModalPerkSelection() {
  console.log('%c[CONFIRM MODAL PERK SELECTION CALLED]', 'color: #4CAF50; font-weight: bold;');
  console.log('  perkSelectionState:', perkSelectionState);
  console.log('  perkSelectionState.selectedOption:', perkSelectionState.selectedOption);
  
  if (!perkSelectionState.selectedOption) {
    console.log('  ❌ No option selected, showing alert');
    alert('Please select an option first.');
    return;
  }

  const perkId = perkSelectionState.currentPerk;
  const selectedValue = perkSelectionState.selectedOption;

  console.log('%c[PERK SELECTION CONFIRMED]', 'color: #4CAF50; font-weight: bold;', {
    perk: perkId,
    selected: selectedValue,
    type: perkSelectionState.selectionType
  });

  // Handle specific perk selections
  // This function returns true if it handled a multi-step perk and we should NOT close the modal
  let shouldCloseModal;
  try {
    shouldCloseModal = handlePerkSelection(perkId, selectedValue, perkSelectionState.selectionType);
    console.log('  handlePerkSelection returned:', shouldCloseModal);
  } catch (e) {
    console.error('  ERROR in handlePerkSelection:', e);
    return;
  }
  
  console.log('  shouldCloseModal !== false?', shouldCloseModal !== false);

  // Only close and save if this is a single-step selection (or the last step of a multi-step)
  if (shouldCloseModal !== false) {
    console.log('  → Closing modal and saving');
    // Close modal
    closePerkSelectionModal();

    // Save character data
    if (typeof saveCharacterData === 'function') {
      saveCharacterData();
    }

    // Check if there are more perks requiring selection
    const nextIndex = window.nextPerkSelectionIndex || 0;
    const perksRequiringSelection = window.perksRequiringSelection || [];

    if (nextIndex < perksRequiringSelection.length && typeof handleNextPerkSelection === 'function') {
      // Show the next perk selection modal
      handleNextPerkSelection(perksRequiringSelection, nextIndex);
    } else {
      // All perk selections complete, finish the confirmation process
      console.log('  → All perk selections complete, finishing confirmation');
      if (typeof finishPerkConfirmation === 'function') {
        finishPerkConfirmation();
      }
    }
  } else {
    console.log('  → NOT closing modal (multi-step perk in progress)');
  }
}

/**
 * Process the perk selection based on perk type
 * @param {string} perkId - The perk ID
 * @param {string} selectedValue - The selected value
 * @param {string} selectionType - The type of selection (skill, trait, etc.)
 */
function handlePerkSelection(perkId, selectedValue, selectionType) {
  const character = characterData;
  if (!character) {
    console.error('[PERK SELECTION] Character data not found');
    return;
  }

  // Initialize perkSelections if it doesn't exist
  if (!character.perkSelections) {
    character.perkSelections = {};
  }

  switch (perkId) {
    case 'tag':
      // Tag! perk - add a new tag skill
      if (!character.tagSkills) {
        character.tagSkills = {};
      }
      character.tagSkills[selectedValue] = true;
      console.log(`%c[PERK EFFECT APPLIED]`, 'color: #4CAF50; font-weight: bold;', `Added tag skill: ${selectedValue}`);
      
      // Update display
      if (typeof updateCharacterSummary === 'function') {
        updateCharacterSummary();
      }
      break;

    case 'mutate':
      // Mutate! perk - two-step process: remove old trait, add new trait
      console.log(`%c[MUTATE PERK HANDLER]`, 'color: #FF9800; font-weight: bold;', `selectionType: ${perkSelectionState.selectionType}`);
      
      // Check which step we're in based on selection type
      if (perkSelectionState.selectionType === 'trait_removal') {
        // Step 1: User selected a trait to remove - now show the add dialog
        console.log(`%c[MUTATE STEP 1 - REMOVAL]`, 'color: #FF9800; font-weight: bold;', `Selected for removal: ${selectedValue}`);
        console.log('  Calling showNewTraitSelectionModal...');
        
        // Show the second modal for adding a new trait
        showNewTraitSelectionModal(selectedValue);
        
        console.log('  Returning false to prevent modal close');
        return false;  // Return false to keep modal open and not save yet
        
      } else if (perkSelectionState.selectionType === 'trait_addition') {
        // Step 2: User selected a new trait - actually apply the changes
        console.log(`%c[MUTATE STEP 2 - ADDITION]`, 'color: #FF9800; font-weight: bold;', `Selected for addition: ${selectedValue}`);
        
        const removedTraitId = perkSelectionState.options?.removedTraitId;
        
        if (!removedTraitId) {
          console.error('[MUTATE PERK] No removed trait ID found!');
          return true;
        }
        
        // Initialize selectedTraits if it doesn't exist
        if (!character.selectedTraits) {
          character.selectedTraits = [];
        }
        
        // Remove the old trait
        const removeIndex = character.selectedTraits.indexOf(removedTraitId);
        if (removeIndex > -1) {
          character.selectedTraits.splice(removeIndex, 1);
          console.log(`  → Removed trait: ${removedTraitId}`);
        }
        
        // Add the new trait
        if (!character.selectedTraits.includes(selectedValue)) {
          character.selectedTraits.push(selectedValue);
          console.log(`  → Added trait: ${selectedValue}`);
          console.log(`  → Character traits now:`, character.selectedTraits);
        }
        
        // Also store in perkSelections for tracking
        if (!character.perkSelections.mutate) {
          character.perkSelections.mutate = { remove: null, add: null };
        }
        character.perkSelections.mutate.remove = removedTraitId;
        character.perkSelections.mutate.add = selectedValue;
        
        // Update display
        if (typeof updateCharacterSummary === 'function') {
          updateCharacterSummary();
        }
        if (typeof updateSkillRanking === 'function') {
          updateSkillRanking();
        }
        if (typeof updateDisplay === 'function') {
          updateDisplay();
        }
        if (typeof renderOutput === 'function') {
          renderOutput(character);
        }
        
        console.log(`%c[MUTATE COMPLETE]`, 'color: #4CAF50; font-weight: bold;', `Swapped ${removedTraitId} for ${selectedValue}`);
        return true;  // Return true to close modal and save (this is the last step)
      }
      return true;  // Default: close modal

    case 'bend_the_rules':
      // Bend the Rules perk - flag for next perk choice
      character.perkSelections.bendTheRules = true;
      console.log(`%c[PERK EFFECT APPLIED]`, 'color: #4CAF50; font-weight: bold;', 'Bend the Rules activated - next perk choice ignores restrictions (except race)');
      break;

    case 'break_the_rules':
      // Break the Rules perk - flag for next perk choice
      character.perkSelections.breakTheRules = true;
      console.log(`%c[PERK EFFECT APPLIED]`, 'color: #4CAF50; font-weight: bold;', 'Break the Rules activated - next perk choice has no restrictions');
      break;

    default:
      console.warn(`[PERK SELECTION] No handler for perk: ${perkId}`);
  }
}

/**
 * Show tag skill selection modal (for Tag! perk)
 */
function showTagSkillModal() {
  const character = characterData;
  const currentTags = character.tagSkills || {};
  const characterSkills = character.skills || {};

  // Filter out already-tagged skills
  const availableSkills = Object.keys(characterSkills)
    .filter(skillId => !currentTags[skillId])
    .map(skillId => ({
      id: skillId,
      name: skillId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      details: `Current: ${characterSkills[skillId]}%`
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (availableSkills.length === 0) {
    alert('No more skills available to tag!');
    return;
  }

  console.log('%c[TAG SKILL MODAL]', 'color: #2196F3; font-weight: bold;', {
    currentTags: Object.keys(currentTags),
    availableSkills: availableSkills.map(s => s.id),
    totalAvailable: availableSkills.length
  });

  openPerkSelectionModal('tag', {
    type: 'skill',
    prompt: 'Choose a skill to add as your new tag skill:',
    options: availableSkills,
    count: 1
  });
}

/**
 * Show trait selection modal (for Mutate! perk)
 */
function showTraitSelectionModal() {
  const character = characterData;
  const currentTraits = character.selectedTraits || character.traits || [];

  console.log('%c[MUTATE PERK - TRAIT SELECTION]', 'color: #FF9800; font-weight: bold;');
  console.log('  Current traits:', currentTraits);
  
  // Step 1: Ask user which trait to REMOVE (if they have any)
  if (currentTraits.length === 0) {
    alert('You have no traits to remove! Cannot use Mutate perk without existing traits.');
    return;
  }

  // Show modal to select trait to remove
  const traits = TRAITS || {};
  const traitOptions = currentTraits.map(traitId => ({
    id: traitId,
    name: traits[traitId]?.name || traitId,
    details: traits[traitId]?.description || ''
  }));

  console.log('  Showing removal options:', traitOptions.map(t => t.id));

  openPerkSelectionModal('mutate', {
    type: 'trait_removal',
    prompt: '<strong>Step 1: Choose a trait to REMOVE:</strong><br>Select one of your current traits to replace.',
    options: traitOptions,
    count: 1
  });
}

/**
 * Show new trait selection after removal (second step of Mutate!)
 */
function showNewTraitSelectionModal(removedTraitId) {
  const traits = TRAITS || {};
  const character = characterData;
  const currentTraits = character.selectedTraits || character.traits || [];
  const race = character.race || 'Human';

  console.log('%c[MUTATE PERK - NEW TRAIT SELECTION]', 'color: #FF9800; font-weight: bold;');
  console.log('  Removed trait:', removedTraitId);
  console.log('  Remaining traits:', currentTraits.filter(t => t !== removedTraitId));

  // Filter new traits based on:
  // 1. Not already selected (excluding the one we just removed)
  // 2. Racial restrictions respected
  const availableTraits = Object.entries(traits)
    .filter(([traitId, trait]) => {
      // Already selected (and we're not removing it) - exclude
      if (currentTraits.includes(traitId) && traitId !== removedTraitId) {
        console.log(`  ✗ ${traitId}: Already selected`);
        return false;
      }

      // Check racial restrictions using same logic as chargen
      const isRestricted = trait.restrictions.length > 0 && 
        (trait.restrictions.includes(race) || 
         trait.restrictions.some(r => r.includes('only') && !r.toLowerCase().includes(race.toLowerCase())));

      if (isRestricted) {
        console.log(`  ✗ ${traitId}: Restricted for ${race} (restrictions: ${trait.restrictions.join(', ')})`);
        return false;
      }

      console.log(`  ✓ ${traitId}: Available for ${race}`);
      return true;
    })
    .map(([traitId, trait]) => ({
      id: traitId,
      name: trait.name || traitId,
      details: trait.description || ''
    }));

  console.log('  Available traits after filtering:', availableTraits.map(t => t.id));

  if (availableTraits.length === 0) {
    alert('No traits available for your race to replace with!');
    return;
  }

  // Show modal to select new trait
  openPerkSelectionModal('mutate', {
    type: 'trait_addition',
    prompt: `<strong>Step 2: Choose a new trait to ADD:</strong><br>You're replacing <strong>${traits[removedTraitId]?.name || removedTraitId}</strong> with a new trait.`,
    options: availableTraits,
    count: 1,
    removedTraitId: removedTraitId  // Pass the removed trait ID for processing
  });
}

// Initialize modal event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('perk-selection-modal');
  const closeBtn = document.getElementById('close-perk-modal');
  const confirmBtn = document.getElementById('confirm-perk-selection');
  const cancelBtn = document.getElementById('cancel-perk-selection');

  if (closeBtn) {
    closeBtn.addEventListener('click', closePerkSelectionModal);
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('%c[CONFIRM BUTTON CLICKED]', 'color: #4CAF50; font-weight: bold;');
      try {
        console.log('  About to call confirmModalPerkSelection()...');
        confirmModalPerkSelection();
        console.log('  confirmModalPerkSelection() completed');
      } catch (e) {
        console.error('  ERROR calling confirmModalPerkSelection():', e);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closePerkSelectionModal);
  }

  // Close modal when clicking outside of it
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closePerkSelectionModal();
      }
    });
  }

  console.log('%c[PERK SELECTION MODAL INITIALIZED]', 'color: #FF9800; font-weight: bold;');
});
