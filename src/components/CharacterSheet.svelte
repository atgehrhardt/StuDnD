<script>
  import { onMount, afterUpdate } from 'svelte';
  import { character, getAbilityModifier, updateAttribute, updateSkill, updateHitPoints, applyClassRecommendations } from '../stores/characterStore.js';
  import { startNewGame } from '../lib/contextManager.js';
  import { gameState } from '../stores/gameState.js';
  import { startingEquipment, pointBuyCosts, totalPointBuyPoints } from '../lib/dndRules.js';
  
  // Local state for character creation/editing
  let editMode = !$character.name;
  let tempCharacter = { ...$character };
  let activeTab = 'basic'; // basic, abilities, skills, equipment, inventory, spells
  let newItemName = '';
  
  // D&D races and classes for selection
  const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling', 'Dragonborn'];
  const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
  const backgrounds = ['Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero', 'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin'];
  const alignments = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
  
  $: isGameStarted = $gameState.isGameStarted;
  
  // Watch for changes to the character store
  $: {
    if ($character.name && !tempCharacter.name) {
      tempCharacter = { ...$character };
    }
  }
  
  // Save character changes
  function saveCharacter() {
    // Validate character before saving
    if (!tempCharacter.name.trim()) {
      alert('Character name is required');
      return;
    }
    
    if (!tempCharacter.race) {
      alert('Please select a race');
      return;
    }
    
    if (!tempCharacter.class) {
      alert('Please select a class');
      return;
    }
    
    // Calculate derived stats based on attributes, class, and level
    const strMod = getAbilityModifier(tempCharacter.attributes.strength);
    const dexMod = getAbilityModifier(tempCharacter.attributes.dexterity);
    const conMod = getAbilityModifier(tempCharacter.attributes.constitution);
    
    // Set AC if not already set
    if (!tempCharacter.ac) {
      tempCharacter.ac = 10 + dexMod;
    }
    
    // Set initiative if not already set
    tempCharacter.initiative = dexMod;
    
    // Set HP if not already set or changed
    if (!tempCharacter.hp || !tempCharacter.hp.max) {
      let baseHP = 0;
      
      // Calculate HP based on class hit die and con modifier
      switch (tempCharacter.class) {
        case 'Barbarian':
          baseHP = 12 + conMod;
          break;
        case 'Fighter':
        case 'Paladin':
        case 'Ranger':
          baseHP = 10 + conMod;
          break;
        case 'Sorcerer':
        case 'Wizard':
          baseHP = 6 + conMod;
          break;
        default:
          baseHP = 8 + conMod;
      }
      
      tempCharacter.hp = {
        max: Math.max(1, baseHP),
        current: Math.max(1, baseHP)
      };
    }
    
    // Set saving throw proficiencies based on class if not set
    if (!tempCharacter.savingThrows.strength && !tempCharacter.savingThrows.dexterity &&
        !tempCharacter.savingThrows.constitution && !tempCharacter.savingThrows.intelligence &&
        !tempCharacter.savingThrows.wisdom && !tempCharacter.savingThrows.charisma) {
      
      switch(tempCharacter.class) {
        case 'Barbarian':
          tempCharacter.savingThrows.strength = true;
          tempCharacter.savingThrows.constitution = true;
          break;
        case 'Bard':
          tempCharacter.savingThrows.dexterity = true;
          tempCharacter.savingThrows.charisma = true;
          break;
        case 'Cleric':
          tempCharacter.savingThrows.wisdom = true;
          tempCharacter.savingThrows.charisma = true;
          break;
        case 'Druid':
          tempCharacter.savingThrows.intelligence = true;
          tempCharacter.savingThrows.wisdom = true;
          break;
        case 'Fighter':
          tempCharacter.savingThrows.strength = true;
          tempCharacter.savingThrows.constitution = true;
          break;
        case 'Monk':
          tempCharacter.savingThrows.strength = true;
          tempCharacter.savingThrows.dexterity = true;
          break;
        case 'Paladin':
          tempCharacter.savingThrows.wisdom = true;
          tempCharacter.savingThrows.charisma = true;
          break;
        case 'Ranger':
          tempCharacter.savingThrows.strength = true;
          tempCharacter.savingThrows.dexterity = true;
          break;
        case 'Rogue':
          tempCharacter.savingThrows.dexterity = true;
          tempCharacter.savingThrows.intelligence = true;
          break;
        case 'Sorcerer':
          tempCharacter.savingThrows.constitution = true;
          tempCharacter.savingThrows.charisma = true;
          break;
        case 'Warlock':
          tempCharacter.savingThrows.wisdom = true;
          tempCharacter.savingThrows.charisma = true;
          break;
        case 'Wizard':
          tempCharacter.savingThrows.intelligence = true;
          tempCharacter.savingThrows.wisdom = true;
          break;
      }
    }
    
    character.set({ ...tempCharacter });
    editMode = false;
  }
  
  // Start editing character
  function editCharacter() {
    tempCharacter = { ...$character };
    editMode = true;
  }
  
  // Start a new game with this character
  async function startGame() {
    if (!tempCharacter.name) {
      // Make sure we have a character first
      alert('Please create a character first');
      return;
    }
    
    // Save character if in edit mode
    if (editMode) {
      saveCharacter();
    }
    
    // Start the game
    await startNewGame(tempCharacter);
  }
  
  // Format ability modifier for display
  function formatModifier(score) {
    const mod = getAbilityModifier(score);
    return mod >= 0 ? `+${mod}` : mod.toString();
  }
  
  // Handle ability score change with point buy
  function handleAbilityChange(ability, value) {
    value = Math.min(15, Math.max(8, parseInt(value) || 8));
    
    // Calculate point cost difference
    const oldValue = tempCharacter.attributes[ability];
    const oldCost = getCostForScore(oldValue);
    const newCost = getCostForScore(value);
    const costDifference = newCost - oldCost;
    
    // Check if enough points are available
    if (tempCharacter.pointBuyRemaining - costDifference < 0) {
      // Not enough points, revert to previous value
      tempCharacter.attributes[ability] = oldValue;
      return;
    }
    
    // Update the attribute and point buy remaining
    tempCharacter.attributes[ability] = value;
    tempCharacter.pointBuyRemaining -= costDifference;
  }
  
  // Get cost for an ability score in point buy
  function getCostForScore(score) {
    const scores = {
      8: 0,
      9: 1,
      10: 2,
      11: 3,
      12: 4,
      13: 5,
      14: 7,
      15: 9
    };
    return scores[score] || 0;
  }
  
  // Handle skill proficiency toggle
  function handleSkillToggle(skill) {
    tempCharacter.skillProficiencies[skill] = !tempCharacter.skillProficiencies[skill];
  }
  
  // Get total initiative bonus
  $: initiativeBonus = getAbilityModifier(tempCharacter.attributes.dexterity);
  
  // Get armor class based on dexterity
  $: armorClass = 10 + getAbilityModifier(tempCharacter.attributes.dexterity);
</script>

<div class="character-sheet">
  <div class="sheet-header">
    <h2>{editMode ? 'Character Builder' : 'Character Sheet'}</h2>
    
    <div class="sheet-actions">
      {#if editMode}
        <button class="action-button save" on:click={saveCharacter} disabled={!tempCharacter.name}>Save Character</button>
      {:else}
        <button class="action-button edit" on:click={editCharacter}>Edit Character</button>
      {/if}
      
      <button 
        class="action-button start" 
        on:click={startGame} 
        disabled={!tempCharacter.name || isGameStarted}
      >
        {isGameStarted ? 'Game In Progress' : 'Start New Game'}
      </button>
    </div>
  </div>
  
  {#if editMode}
    <div class="sheet-tabs">
      <button class={activeTab === 'basic' ? 'active' : ''} on:click={() => activeTab = 'basic'}>Basic</button>
      <button class={activeTab === 'abilities' ? 'active' : ''} on:click={() => activeTab = 'abilities'}>Abilities</button>
      <button class={activeTab === 'skills' ? 'active' : ''} on:click={() => activeTab = 'skills'}>Skills</button>
      <button class={activeTab === 'inventory' ? 'active' : ''} on:click={() => activeTab = 'inventory'}>Inventory</button>
      <button class={activeTab === 'equipment' ? 'active' : ''} on:click={() => activeTab = 'equipment'}>Equipment</button>
    </div>
    
    <div class="sheet-content">
      {#if activeTab === 'basic'}
        <div class="form-section">
          <div class="form-row">
            <div class="form-group">
              <label for="character-name">Character Name</label>
              <input type="text" id="character-name" bind:value={tempCharacter.name} placeholder="Enter name...">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="character-race">Race</label>
              <select id="character-race" bind:value={tempCharacter.race}>
                <option value="">Select Race...</option>
                {#each races as race}
                  <option value={race}>{race}</option>
                {/each}
              </select>
            </div>
            
            <div class="form-group">
              <label for="character-class">Class</label>
              <select id="character-class" bind:value={tempCharacter.class} on:change={() => {
                // Apply class recommendations when class changes
                if (tempCharacter.class) {
                  // Set starting equipment based on class
                  tempCharacter.inventory = [...startingEquipment[tempCharacter.class] || []];
                  
                  // Set hit die based on class
                  if (tempCharacter.class === 'Barbarian') {
                    tempCharacter.hitDice.value = 'd12';
                  } else if (['Fighter', 'Paladin', 'Ranger'].includes(tempCharacter.class)) {
                    tempCharacter.hitDice.value = 'd10';
                  } else if (['Wizard', 'Sorcerer'].includes(tempCharacter.class)) {
                    tempCharacter.hitDice.value = 'd6';
                  } else {
                    tempCharacter.hitDice.value = 'd8';
                  }
                }
              }}>
                <option value="">Select Class...</option>
                {#each classes as charClass}
                  <option value={charClass}>{charClass}</option>
                {/each}
              </select>
            </div>
            
            <div class="form-group">
              <label for="character-level">Level</label>
              <input type="number" id="character-level" bind:value={tempCharacter.level} min="1" max="20">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="character-background">Background</label>
              <select id="character-background" bind:value={tempCharacter.background}>
                <option value="">Select Background...</option>
                {#each backgrounds as background}
                  <option value={background}>{background}</option>
                {/each}
              </select>
            </div>
            
            <div class="form-group">
              <label for="character-alignment">Alignment</label>
              <select id="character-alignment" bind:value={tempCharacter.alignment}>
                <option value="">Select Alignment...</option>
                {#each alignments as alignment}
                  <option value={alignment}>{alignment}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="character-hp-max">Max HP</label>
              <input type="number" id="character-hp-max" bind:value={tempCharacter.hp.max} min="1">
            </div>
            
            <div class="form-group">
              <label for="character-hp-current">Current HP</label>
              <input type="number" id="character-hp-current" bind:value={tempCharacter.hp.current} min="0" max={tempCharacter.hp.max}>
            </div>
            
            <div class="form-group">
              <label for="character-ac">Armor Class</label>
              <input type="number" id="character-ac" value={armorClass} disabled>
            </div>
            
            <div class="form-group">
              <label for="character-initiative">Initiative</label>
              <input type="text" id="character-initiative" value={formatModifier(initiativeBonus)} disabled>
            </div>
            
            <div class="form-group">
              <label for="character-speed">Speed</label>
              <input type="number" id="character-speed" bind:value={tempCharacter.speed} min="0">
            </div>
          </div>
        </div>
      {:else if activeTab === 'abilities'}
        <div class="abilities-container">
          <div class="point-buy-tracker">
            <h4>Point Buy: {tempCharacter.pointBuyRemaining || 27} points remaining</h4>
            <p class="help-text">Standard D&D 5e Point Buy: 27 points total. Scores can range from 8 to 15 before racial modifiers.</p>
          </div>
          
          <div class="ability-score">
            <label for="str">Strength</label>
            <input type="number" id="str" bind:value={tempCharacter.attributes.strength} on:change={() => handleAbilityChange('strength', tempCharacter.attributes.strength)} min="8" max="15">
            <div class="ability-modifier">{formatModifier(tempCharacter.attributes.strength)}</div>
            <div class="ability-cost">Cost: {getCostForScore(tempCharacter.attributes.strength)}</div>
          </div>
          
          <div class="ability-score">
            <label for="dex">Dexterity</label>
            <input type="number" id="dex" bind:value={tempCharacter.attributes.dexterity} on:change={() => handleAbilityChange('dexterity', tempCharacter.attributes.dexterity)} min="8" max="15">
            <div class="ability-modifier">{formatModifier(tempCharacter.attributes.dexterity)}</div>
            <div class="ability-cost">Cost: {getCostForScore(tempCharacter.attributes.dexterity)}</div>
          </div>
          
          <div class="ability-score">
            <label for="con">Constitution</label>
            <input type="number" id="con" bind:value={tempCharacter.attributes.constitution} on:change={() => handleAbilityChange('constitution', tempCharacter.attributes.constitution)} min="8" max="15">
            <div class="ability-modifier">{formatModifier(tempCharacter.attributes.constitution)}</div>
            <div class="ability-cost">Cost: {getCostForScore(tempCharacter.attributes.constitution)}</div>
          </div>
          
          <div class="ability-score">
            <label for="int">Intelligence</label>
            <input type="number" id="int" bind:value={tempCharacter.attributes.intelligence} on:change={() => handleAbilityChange('intelligence', tempCharacter.attributes.intelligence)} min="8" max="15">
            <div class="ability-modifier">{formatModifier(tempCharacter.attributes.intelligence)}</div>
            <div class="ability-cost">Cost: {getCostForScore(tempCharacter.attributes.intelligence)}</div>
          </div>
          
          <div class="ability-score">
            <label for="wis">Wisdom</label>
            <input type="number" id="wis" bind:value={tempCharacter.attributes.wisdom} on:change={() => handleAbilityChange('wisdom', tempCharacter.attributes.wisdom)} min="8" max="15">
            <div class="ability-modifier">{formatModifier(tempCharacter.attributes.wisdom)}</div>
            <div class="ability-cost">Cost: {getCostForScore(tempCharacter.attributes.wisdom)}</div>
          </div>
          
          <div class="ability-score">
            <label for="cha">Charisma</label>
            <input type="number" id="cha" bind:value={tempCharacter.attributes.charisma} on:change={() => handleAbilityChange('charisma', tempCharacter.attributes.charisma)} min="8" max="15">
            <div class="ability-modifier">{formatModifier(tempCharacter.attributes.charisma)}</div>
            <div class="ability-cost">Cost: {getCostForScore(tempCharacter.attributes.charisma)}</div>
          </div>
        </div>
      {:else if activeTab === 'skills'}
        <div class="skills-container">
          <h3>Skill Proficiencies</h3>
          <p>Select the skills your character is proficient in:</p>
          
          <div class="skill-list">
            <div class="skill-item">
              <input type="checkbox" id="acrobatics" bind:checked={tempCharacter.skillProficiencies.acrobatics}>
              <label for="acrobatics">Acrobatics (DEX)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="animalHandling" bind:checked={tempCharacter.skillProficiencies.animalHandling}>
              <label for="animalHandling">Animal Handling (WIS)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="arcana" bind:checked={tempCharacter.skillProficiencies.arcana}>
              <label for="arcana">Arcana (INT)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="athletics" bind:checked={tempCharacter.skillProficiencies.athletics}>
              <label for="athletics">Athletics (STR)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="deception" bind:checked={tempCharacter.skillProficiencies.deception}>
              <label for="deception">Deception (CHA)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="history" bind:checked={tempCharacter.skillProficiencies.history}>
              <label for="history">History (INT)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="insight" bind:checked={tempCharacter.skillProficiencies.insight}>
              <label for="insight">Insight (WIS)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="intimidation" bind:checked={tempCharacter.skillProficiencies.intimidation}>
              <label for="intimidation">Intimidation (CHA)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="investigation" bind:checked={tempCharacter.skillProficiencies.investigation}>
              <label for="investigation">Investigation (INT)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="medicine" bind:checked={tempCharacter.skillProficiencies.medicine}>
              <label for="medicine">Medicine (WIS)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="nature" bind:checked={tempCharacter.skillProficiencies.nature}>
              <label for="nature">Nature (INT)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="perception" bind:checked={tempCharacter.skillProficiencies.perception}>
              <label for="perception">Perception (WIS)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="performance" bind:checked={tempCharacter.skillProficiencies.performance}>
              <label for="performance">Performance (CHA)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="persuasion" bind:checked={tempCharacter.skillProficiencies.persuasion}>
              <label for="persuasion">Persuasion (CHA)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="religion" bind:checked={tempCharacter.skillProficiencies.religion}>
              <label for="religion">Religion (INT)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="sleightOfHand" bind:checked={tempCharacter.skillProficiencies.sleightOfHand}>
              <label for="sleightOfHand">Sleight of Hand (DEX)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="stealth" bind:checked={tempCharacter.skillProficiencies.stealth}>
              <label for="stealth">Stealth (DEX)</label>
            </div>
            <div class="skill-item">
              <input type="checkbox" id="survival" bind:checked={tempCharacter.skillProficiencies.survival}>
              <label for="survival">Survival (WIS)</label>
            </div>
          </div>
        </div>
      {:else if activeTab === 'inventory'}
        <div class="inventory-container">
          <h3>Inventory</h3>
          
          <div class="inventory-section">
            <h4>Items</h4>
            {#if !tempCharacter.inventory || tempCharacter.inventory.length === 0}
              <p class="empty-inventory">No items in inventory yet.</p>
              
              {#if tempCharacter.class}
                <div class="recommended-items">
                  <p>Recommended starting items for {tempCharacter.class}:</p>
                  <ul>
                    {#each startingEquipment[tempCharacter.class] || [] as item}
                      <li>{item}</li>
                    {/each}
                  </ul>
                  <button class="add-recommended" on:click={() => {
                    tempCharacter.inventory = [...startingEquipment[tempCharacter.class] || []];
                  }}>Add Class Starting Items</button>
                </div>
              {/if}
            {:else}
              <div class="inventory-list">
                {#each tempCharacter.inventory as item, index}
                  <div class="inventory-item">
                    <span class="item-name">{item}</span>
                    <button class="remove-item" on:click={() => {
                      tempCharacter.inventory = tempCharacter.inventory.filter((_, i) => i !== index);
                    }}>✖</button>
                  </div>
                {/each}
              </div>
            {/if}
            
            <div class="add-item-form">
              <input type="text" bind:value={newItemName} placeholder="New item name">
              <button on:click={() => {
                if (newItemName.trim()) {
                  tempCharacter.inventory = [...tempCharacter.inventory || [], newItemName];
                  newItemName = '';
                }
              }}>Add Item</button>
            </div>
          </div>
          
          <div class="inventory-section">
            <h4>Currency</h4>
            <div class="currency-row">
              <div class="currency-item">
                <label for="cp">CP</label>
                <input type="number" id="cp" bind:value={tempCharacter.currency.cp} min="0">
              </div>
              <div class="currency-item">
                <label for="sp">SP</label>
                <input type="number" id="sp" bind:value={tempCharacter.currency.sp} min="0">
              </div>
              <div class="currency-item">
                <label for="ep">EP</label>
                <input type="number" id="ep" bind:value={tempCharacter.currency.ep} min="0">
              </div>
              <div class="currency-item">
                <label for="gp">GP</label>
                <input type="number" id="gp" bind:value={tempCharacter.currency.gp} min="0">
              </div>
              <div class="currency-item">
                <label for="pp">PP</label>
                <input type="number" id="pp" bind:value={tempCharacter.currency.pp} min="0">
              </div>
            </div>
          </div>
        </div>
      {:else if activeTab === 'equipment'}
        <div class="equipment-container">
          <h3>Equipment</h3>
          
          <div class="equipment-section">
            <h4>Currency</h4>
            <div class="currency-row">
              <div class="currency-item">
                <label for="cp">CP</label>
                <input type="number" id="cp" bind:value={tempCharacter.currency.cp} min="0">
              </div>
              <div class="currency-item">
                <label for="sp">SP</label>
                <input type="number" id="sp" bind:value={tempCharacter.currency.sp} min="0">
              </div>
              <div class="currency-item">
                <label for="ep">EP</label>
                <input type="number" id="ep" bind:value={tempCharacter.currency.ep} min="0">
              </div>
              <div class="currency-item">
                <label for="gp">GP</label>
                <input type="number" id="gp" bind:value={tempCharacter.currency.gp} min="0">
              </div>
              <div class="currency-item">
                <label for="pp">PP</label>
                <input type="number" id="pp" bind:value={tempCharacter.currency.pp} min="0">
              </div>
            </div>
          </div>
          
          <!-- Equipment list would go here, along with a way to add/remove items -->
          <div class="equipment-section">
            <h4>Items</h4>
            <p class="placeholder-text">Equipment management coming soon...</p>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Character sheet display mode -->
    <div class="character-display">
      <div class="char-header">
        <div class="char-name">{$character.name}</div>
        <div class="char-subtitle">Level {$character.level} {$character.race} {$character.class}</div>
      </div>
      
      <div class="char-details">
        <div class="char-core">
          <div class="core-stat">
            <span class="stat-label">HP</span>
            <div class="stat-value">{$character.hp.current} / {$character.hp.max}</div>
          </div>
          <div class="core-stat">
            <span class="stat-label">AC</span>
            <div class="stat-value">{$character.ac}</div>
          </div>
          <div class="core-stat">
            <span class="stat-label">Speed</span>
            <div class="stat-value">{$character.speed}</div>
          </div>
          <div class="core-stat">
            <span class="stat-label">Initiative</span>
            <div class="stat-value">{formatModifier(getAbilityModifier($character.attributes.dexterity))}</div>
          </div>
        </div>
        
        <div class="char-abilities">
          <div class="ability">
            <div class="ability-name">STR</div>
            <div class="ability-value">{$character.attributes.strength}</div>
            <div class="ability-mod">{formatModifier($character.attributes.strength)}</div>
          </div>
          <div class="ability">
            <div class="ability-name">DEX</div>
            <div class="ability-value">{$character.attributes.dexterity}</div>
            <div class="ability-mod">{formatModifier($character.attributes.dexterity)}</div>
          </div>
          <div class="ability">
            <div class="ability-name">CON</div>
            <div class="ability-value">{$character.attributes.constitution}</div>
            <div class="ability-mod">{formatModifier($character.attributes.constitution)}</div>
          </div>
          <div class="ability">
            <div class="ability-name">INT</div>
            <div class="ability-value">{$character.attributes.intelligence}</div>
            <div class="ability-mod">{formatModifier($character.attributes.intelligence)}</div>
          </div>
          <div class="ability">
            <div class="ability-name">WIS</div>
            <div class="ability-value">{$character.attributes.wisdom}</div>
            <div class="ability-mod">{formatModifier($character.attributes.wisdom)}</div>
          </div>
          <div class="ability">
            <div class="ability-name">CHA</div>
            <div class="ability-value">{$character.attributes.charisma}</div>
            <div class="ability-mod">{formatModifier($character.attributes.charisma)}</div>
          </div>
        </div>
      </div>
      
      <div class="char-proficiencies">
        <h3>Proficient Skills</h3>
        <div class="skill-tags">
          {#each Object.entries($character.skillProficiencies) as [skill, isProficient]}
            {#if isProficient}
              <span class="skill-tag">{skill}</span>
            {/if}
          {/each}
        </div>
      </div>
      
      <div class="char-inventory">
        <h3>Inventory</h3>
        {#if $character.inventory && $character.inventory.length > 0}
          <div class="inventory-list-display">
            {#each $character.inventory as item}
              <div class="inventory-item-display">{item}</div>
            {/each}
          </div>
        {:else}
          <p class="empty-inventory">No items in inventory.</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .character-sheet {
    background-color: #2a2a2a;
    border-radius: 6px;
    padding: 1rem;
  }
  
  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .sheet-header h2 {
    margin: 0;
  }
  
  .sheet-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .action-button.save {
    background-color: #4a6;
    color: white;
  }
  
  .action-button.edit {
    background-color: #46a;
    color: white;
  }
  
  .action-button.start {
    background-color: #a46;
    color: white;
  }
  
  .action-button:disabled {
    background-color: #555;
    color: #aaa;
    cursor: not-allowed;
  }
  
  .sheet-tabs {
    display: flex;
    margin-bottom: 1rem;
    border-bottom: 1px solid #444;
  }
  
  .sheet-tabs button {
    padding: 0.5rem 1rem;
    border: none;
    background: none;
    color: #ccc;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  
  .sheet-tabs button.active {
    color: #fff;
    border-bottom: 2px solid #a46;
  }
  
  .sheet-content {
    padding: 1rem 0;
  }
  
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .form-group {
    flex: 1;
    min-width: 200px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
    color: #ccc;
  }
  
  .form-group input, .form-group select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #444;
    background-color: #333;
    color: #f0f0f0;
  }
  
  .abilities-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .ability-score {
    background-color: #333;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
  }
  
  .point-buy-tracker {
    grid-column: 1 / -1;
    background-color: #2c3e50;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .point-buy-tracker h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  
  .ability-cost {
    font-size: 0.8rem;
    color: #aaa;
    margin-top: 0.25rem;
  }
  
  .ability-score label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  .ability-score input {
    width: 60px;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #444;
    background-color: #2a2a2a;
    color: #f0f0f0;
    text-align: center;
    font-size: 1.2rem;
  }
  
  .ability-modifier {
    margin-top: 0.5rem;
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .skills-container {
    padding: 1rem;
    background-color: #333;
    border-radius: 6px;
  }
  
  .skills-container h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  
  .skill-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .skill-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .equipment-container {
    padding: 1rem;
    background-color: #333;
    border-radius: 6px;
  }
  
  .equipment-container h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .equipment-section {
    margin-bottom: 2rem;
  }
  
  .equipment-section h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #444;
    padding-bottom: 0.25rem;
  }
  
  .currency-row {
    display: flex;
    gap: 1rem;
  }
  
  .currency-item {
    text-align: center;
  }
  
  .currency-item label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
    color: #ccc;
  }
  
  .currency-item input {
    width: 60px;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #444;
    background-color: #2a2a2a;
    color: #f0f0f0;
    text-align: center;
  }
  
  .placeholder-text {
    color: #888;
    font-style: italic;
  }
  
  .inventory-container {
    padding: 1rem;
    background-color: #333;
    border-radius: 6px;
  }
  
  .inventory-container h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .inventory-section {
    margin-bottom: 2rem;
  }
  
  .inventory-section h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #444;
    padding-bottom: 0.25rem;
  }
  
  .empty-inventory {
    color: #888;
    font-style: italic;
  }
  
  .recommended-items {
    background-color: #2a2a2a;
    padding: 1rem;
    border-radius: 4px;
    margin-top: 1rem;
  }
  
  .recommended-items ul {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .add-recommended {
    background-color: #4a6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .inventory-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .inventory-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: #2a2a2a;
    border-radius: 4px;
  }
  
  .item-name {
    flex: 1;
  }
  
  .remove-item {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .remove-item:hover {
    color: #e74c3c;
  }
  
  .add-item-form {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .add-item-form input {
    flex: 1;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #444;
    background-color: #2a2a2a;
    color: #f0f0f0;
  }
  
  .add-item-form button {
    padding: 0.5rem 1rem;
    background-color: #46a;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  /* Character display styling */
  .character-display {
    padding: 1rem;
    background-color: #333;
    border-radius: 6px;
  }
  
  .char-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .char-name {
    font-size: 2rem;
    font-weight: bold;
  }
  
  .char-subtitle {
    font-size: 1.2rem;
    color: #ccc;
  }
  
  .char-details {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .char-core {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .core-stat {
    text-align: center;
    min-width: 80px;
  }
  
  .stat-label {
    display: block;
    font-size: 0.9rem;
    color: #ccc;
    margin-bottom: 0.25rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .char-abilities {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .ability {
    text-align: center;
    background-color: #2a2a2a;
    padding: 1rem;
    border-radius: 6px;
    min-width: 80px;
  }
  
  .ability-name {
    font-weight: bold;
    color: #ccc;
  }
  
  .ability-value {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0.5rem 0;
  }
  
  .ability-mod {
    font-size: 1.2rem;
    color: #4a6;
  }
  
  .char-proficiencies, .char-inventory {
    margin-top: 2rem;
  }
  
  .char-proficiencies h3, .char-inventory h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #444;
    padding-bottom: 0.25rem;
  }
  
  .skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .skill-tag {
    background-color: #46a;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .inventory-list-display {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }
  
  .inventory-item-display {
    padding: 0.5rem;
    background-color: #2a2a2a;
    border-radius: 4px;
  }
</style>