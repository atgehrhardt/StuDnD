/**
 * D&D 5e Rules and Data for Character Creation and Management
 */

// Standard point buy system in D&D 5e costs
export const pointBuyCosts = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9
  };
  
  // Total points available in standard point buy
  export const totalPointBuyPoints = 27;
  
  // Starting equipment by class
  export const startingEquipment = {
    Barbarian: [
      "Greataxe",
      "Two handaxes",
      "Explorer's pack",
      "Four javelins",
      "Potion of healing",
      "10 gp"
    ],
    Bard: [
      "Rapier",
      "Entertainer's pack",
      "Lute",
      "Leather armor",
      "Dagger",
      "Potion of healing",
      "15 gp"
    ],
    Cleric: [
      "Mace",
      "Scale mail",
      "Light crossbow",
      "20 bolts",
      "Shield",
      "Holy symbol",
      "Priest's pack",
      "Potion of healing",
      "15 gp"
    ],
    Druid: [
      "Wooden shield",
      "Scimitar",
      "Leather armor",
      "Explorer's pack",
      "Druidic focus",
      "Herbalism kit",
      "Potion of healing",
      "10 gp"
    ],
    Fighter: [
      "Chain mail",
      "Longsword",
      "Shield",
      "Light crossbow",
      "20 bolts",
      "Dungeoneer's pack",
      "Potion of healing",
      "10 gp"
    ],
    Monk: [
      "Shortsword",
      "10 darts",
      "Explorer's pack",
      "Simple monk clothes",
      "Potion of healing",
      "5 gp"
    ],
    Paladin: [
      "Chain mail",
      "Longsword",
      "Shield",
      "5 javelins",
      "Priest's pack",
      "Holy symbol",
      "Potion of healing",
      "25 gp"
    ],
    Ranger: [
      "Scale mail",
      "Two shortswords",
      "Explorer's pack",
      "Longbow",
      "Quiver with 20 arrows",
      "Potion of healing",
      "10 gp"
    ],
    Rogue: [
      "Rapier",
      "Shortbow",
      "Quiver with 20 arrows",
      "Burglar's pack",
      "Leather armor",
      "Two daggers",
      "Thieves' tools",
      "Potion of healing",
      "20 gp"
    ],
    Sorcerer: [
      "Light crossbow",
      "20 bolts",
      "Arcane focus",
      "Dungeoneer's pack",
      "Two daggers",
      "Potion of healing",
      "15 gp"
    ],
    Warlock: [
      "Light crossbow",
      "20 bolts",
      "Arcane focus",
      "Scholar's pack",
      "Leather armor",
      "Dagger",
      "Potion of healing",
      "20 gp"
    ],
    Wizard: [
      "Quarterstaff",
      "Component pouch",
      "Scholar's pack",
      "Spellbook",
      "Potion of healing",
      "10 gp"
    ]
  };
  
  // Recommended skill proficiencies by class
  export const classSkillRecommendations = {
    Barbarian: ['Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    Bard: ['Any skill'], // Bards can choose any
    Cleric: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    Druid: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
    Fighter: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
    Monk: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    Paladin: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
    Ranger: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
    Rogue: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    Sorcerer: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    Warlock: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
    Wizard: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']
  };
  
  // Recommended ability scores by class
  export const classAbilityRecommendations = {
    Barbarian: { primary: 'strength', secondary: 'constitution' },
    Bard: { primary: 'charisma', secondary: 'dexterity' },
    Cleric: { primary: 'wisdom', secondary: 'constitution' },
    Druid: { primary: 'wisdom', secondary: 'constitution' },
    Fighter: { primary: 'strength', secondary: 'constitution' },
    Monk: { primary: 'dexterity', secondary: 'wisdom' },
    Paladin: { primary: 'strength', secondary: 'charisma' },
    Ranger: { primary: 'dexterity', secondary: 'wisdom' },
    Rogue: { primary: 'dexterity', secondary: 'intelligence' },
    Sorcerer: { primary: 'charisma', secondary: 'constitution' },
    Warlock: { primary: 'charisma', secondary: 'constitution' },
    Wizard: { primary: 'intelligence', secondary: 'constitution' }
  };
  
  // D&D 5e races with ability score modifications
  export const races = {
    Dragonborn: { strength: 2, charisma: 1 },
    Dwarf: { constitution: 2 },
    Elf: { dexterity: 2 },
    Gnome: { intelligence: 2 },
    'Half-Elf': { charisma: 2, other: 2 }, // +1 to two other abilities of choice
    'Half-Orc': { strength: 2, constitution: 1 },
    Halfling: { dexterity: 2 },
    Human: { all: 1 }, // +1 to all abilities
    Tiefling: { charisma: 2, intelligence: 1 }
  };
  
  // Calculate ability score cost for point buy
  export const calculatePointBuyCost = (scores) => {
    let totalCost = 0;
    
    for (const ability in scores) {
      const score = scores[ability];
      
      if (score < 8) {
        throw new Error(`Ability score cannot be less than 8 (${ability}: ${score})`);
      }
      
      if (score > 15) {
        throw new Error(`Ability score cannot be greater than 15 in point buy (${ability}: ${score})`);
      }
      
      if (!(score in pointBuyCosts)) {
        throw new Error(`Invalid ability score: ${score}`);
      }
      
      totalCost += pointBuyCosts[score];
    }
    
    return totalCost;
  };
  
  // Calculate hit points based on class and constitution
  export const calculateHitPoints = (characterClass, level, constitutionModifier) => {
    const hitDiceByClass = {
      Barbarian: 12,
      Fighter: 10,
      Paladin: 10,
      Ranger: 10,
      Bard: 8,
      Cleric: 8,
      Druid: 8,
      Monk: 8,
      Rogue: 8,
      Warlock: 8,
      Sorcerer: 6,
      Wizard: 6
    };
    
    const hitDie = hitDiceByClass[characterClass] || 8;
    
    // First level: full hit die + CON modifier
    let hp = hitDie + constitutionModifier;
    
    // Additional levels: average of hit die + CON modifier per level
    if (level > 1) {
      const averageHitDieRoll = Math.floor(hitDie / 2) + 1;
      hp += (averageHitDieRoll + constitutionModifier) * (level - 1);
    }
    
    return Math.max(1, hp); // Minimum 1 HP
  };
  
  // Get the hit die based on class
  export const getHitDie = (characterClass) => {
    const hitDiceByClass = {
      Barbarian: 'd12',
      Fighter: 'd10',
      Paladin: 'd10',
      Ranger: 'd10',
      Bard: 'd8',
      Cleric: 'd8',
      Druid: 'd8',
      Monk: 'd8',
      Rogue: 'd8',
      Warlock: 'd8',
      Sorcerer: 'd6',
      Wizard: 'd6'
    };
    
    return hitDiceByClass[characterClass] || 'd8';
  };
  
  // Calculate armor class based on attributes, class, and equipment
  export const calculateAC = (dexModifier, characterClass, hasArmor, armorType, hasShield) => {
    if (!hasArmor) {
      // Unarmored
      if (characterClass === 'Barbarian') {
        // Barbarian unarmored defense: 10 + DEX mod + CON mod
        return 10 + dexModifier + constitutionModifier;
      } else if (characterClass === 'Monk') {
        // Monk unarmored defense: 10 + DEX mod + WIS mod
        return 10 + dexModifier + wisdomModifier;
      } else {
        // Standard unarmored: 10 + DEX mod
        return 10 + dexModifier;
      }
    }
    
    // With armor
    let baseAC = 10;
    let maxDexBonus = null;
    
    switch (armorType) {
      // Light Armor
      case 'Padded':
      case 'Leather':
        baseAC = 11;
        break;
      case 'Studded leather':
        baseAC = 12;
        break;
        
      // Medium Armor
      case 'Hide':
        baseAC = 12;
        maxDexBonus = 2;
        break;
      case 'Chain shirt':
        baseAC = 13;
        maxDexBonus = 2;
        break;
      case 'Scale mail':
      case 'Breastplate':
        baseAC = 14;
        maxDexBonus = 2;
        break;
      case 'Half plate':
        baseAC = 15;
        maxDexBonus = 2;
        break;
        
      // Heavy Armor
      case 'Ring mail':
        baseAC = 14;
        maxDexBonus = 0;
        break;
      case 'Chain mail':
        baseAC = 16;
        maxDexBonus = 0;
        break;
      case 'Splint':
        baseAC = 17;
        maxDexBonus = 0;
        break;
      case 'Plate':
        baseAC = 18;
        maxDexBonus = 0;
        break;
    }
    
    // Apply DEX modifier up to the maximum allowed
    const effectiveDexMod = maxDexBonus !== null ? Math.min(dexModifier, maxDexBonus) : dexModifier;
    let totalAC = baseAC + effectiveDexMod;
    
    // Add shield bonus if applicable
    if (hasShield) {
      totalAC += 2;
    }
    
    return totalAC;
  };
  
  // Get skill ability mapping (which ability score is used for each skill)
  export const skillAbilityMapping = {
    athletics: 'strength',
    
    acrobatics: 'dexterity',
    sleightOfHand: 'dexterity',
    stealth: 'dexterity',
    
    arcana: 'intelligence',
    history: 'intelligence',
    investigation: 'intelligence',
    nature: 'intelligence',
    religion: 'intelligence',
    
    animalHandling: 'wisdom',
    insight: 'wisdom',
    medicine: 'wisdom',
    perception: 'wisdom',
    survival: 'wisdom',
    
    deception: 'charisma',
    intimidation: 'charisma',
    performance: 'charisma',
    persuasion: 'charisma'
  };
  
  // Calculate skill modifier based on attribute and proficiency
  export const calculateSkillModifier = (abilityModifier, isProficient, proficiencyBonus) => {
    return abilityModifier + (isProficient ? proficiencyBonus : 0);
  };
  
  // Calculate proficiency bonus based on level
  export const calculateProficiencyBonus = (level) => {
    return Math.floor((level - 1) / 4) + 2;
  };