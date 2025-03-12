import { writable } from 'svelte/store';
import { startingEquipment, calculateHitPoints, getHitDie } from '../lib/dndRules.js';

// Initial character state with D&D 5e basics
const initialCharacter = {
  name: '',
  race: '',
  class: '',
  level: 1,
  background: '',
  alignment: '',
  attributes: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  },
  skillProficiencies: {
    acrobatics: false,
    animalHandling: false,
    arcana: false,
    athletics: false,
    deception: false,
    history: false,
    insight: false,
    intimidation: false,
    investigation: false,
    medicine: false,
    nature: false,
    perception: false,
    performance: false,
    persuasion: false,
    religion: false,
    sleightOfHand: false,
    stealth: false,
    survival: false
  },
  savingThrows: {
    strength: false,
    dexterity: false,
    constitution: false,
    intelligence: false,
    wisdom: false,
    charisma: false
  },
  hp: {
    max: 10,
    current: 10
  },
  ac: 10,
  initiative: 0,
  speed: 30,
  hitDice: {
    total: 1,
    value: 'd8',
    used: 0
  },
  equipment: [],
  inventory: [],
  spells: {
    cantrips: [],
    level1: [],
    level2: [],
    level3: [],
    level4: [],
    level5: [],
    level6: [],
    level7: [],
    level8: [],
    level9: []
  },
  features: [],
  currency: {
    cp: 0,
    sp: 0,
    ep: 0,
    gp: 0,
    pp: 0
  },
  pointBuyRemaining: 27 // Points remaining for point buy system
};

// Create writable store
export const character = writable(initialCharacter);

// Helper function to calculate ability modifier
export const getAbilityModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

// Helper function to update character skills
export const updateSkill = (skillName, isProficient) => {
  character.update(char => {
    const updatedSkills = { ...char.skillProficiencies };
    updatedSkills[skillName] = isProficient;
    return { ...char, skillProficiencies: updatedSkills };
  });
};

// Helper function to update character attributes
export const updateAttribute = (attributeName, value) => {
  character.update(char => {
    const updatedAttributes = { ...char.attributes };
    const oldValue = updatedAttributes[attributeName];
    updatedAttributes[attributeName] = value;
    
    // Update point buy remaining
    const oldCost = getCostForAttribute(oldValue);
    const newCost = getCostForAttribute(value);
    const pointBuyRemaining = char.pointBuyRemaining - (newCost - oldCost);
    
    // Update derived stats based on attributes
    const derivedStats = recalculateDerivedStats({
      ...char,
      attributes: updatedAttributes
    });
    
    return { 
      ...char, 
      attributes: updatedAttributes,
      pointBuyRemaining,
      ...derivedStats
    };
  });
};

// Function to get cost for point buy
const getCostForAttribute = (value) => {
  const costs = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9
  };
  return costs[value] || 0;
};

// Helper function to recalculate all derived stats
export const recalculateDerivedStats = (char) => {
  const strMod = getAbilityModifier(char.attributes.strength);
  const dexMod = getAbilityModifier(char.attributes.dexterity);
  const conMod = getAbilityModifier(char.attributes.constitution);
  const intMod = getAbilityModifier(char.attributes.intelligence);
  const wisMod = getAbilityModifier(char.attributes.wisdom);
  const chaMod = getAbilityModifier(char.attributes.charisma);
  
  // Calculate HP based on class, level and constitution
  const maxHp = calculateHitPoints(char.class, char.level, conMod);
  
  // Get hit die based on class
  const hitDieValue = getHitDie(char.class);
  
  // Calculate AC (base 10 + DEX mod, can be modified by armor)
  const baseAC = 10 + dexMod;
  
  return {
    hp: {
      max: maxHp,
      current: char.hp?.current || maxHp
    },
    ac: char.ac || baseAC,
    initiative: dexMod,
    hitDice: {
      total: char.level,
      value: hitDieValue,
      used: char.hitDice?.used || 0
    }
  };
};

// Helper function to update hit points
export const updateHitPoints = (current, max = null) => {
  character.update(char => {
    const hp = { ...char.hp, current };
    if (max !== null) {
      hp.max = max;
    }
    return { ...char, hp };
  });
};

// Helper function to level up the character
export const levelUp = () => {
  character.update(char => {
    // Increase level
    const newLevel = char.level + 1;
    
    // Update hit dice
    const hitDice = { 
      ...char.hitDice, 
      total: newLevel
    };
    
    // Recalculate derived stats
    const derivedStats = recalculateDerivedStats({
      ...char,
      level: newLevel,
      hitDice
    });
    
    return { 
      ...char, 
      level: newLevel,
      ...derivedStats
    };
  });
};

// Helper function to add equipment
export const addEquipment = (item) => {
  character.update(char => {
    const equipment = [...char.equipment, item];
    return { ...char, equipment };
  });
};

// Helper function to add inventory item
export const addInventoryItem = (item) => {
  character.update(char => {
    const inventory = [...char.inventory, item];
    return { ...char, inventory };
  });
};

// Helper function to remove inventory item
export const removeInventoryItem = (itemIndex) => {
  character.update(char => {
    const inventory = [...char.inventory];
    inventory.splice(itemIndex, 1);
    return { ...char, inventory };
  });
};

// Helper function to add feature
export const addFeature = (feature) => {
  character.update(char => {
    const features = [...char.features, feature];
    return { ...char, features };
  });
};

// Helper function to set starting equipment based on class
export const setStartingEquipment = (characterClass) => {
  character.update(char => {
    // Get standard equipment for this class
    const classEquipment = startingEquipment[characterClass] || [];
    
    // Extract gold from equipment (last item usually)
    let currency = { ...char.currency };
    const goldItem = classEquipment.find(item => item.endsWith('gp'));
    
    if (goldItem) {
      const goldAmount = parseInt(goldItem);
      if (!isNaN(goldAmount)) {
        currency.gp = (currency.gp || 0) + goldAmount;
      }
    }
    
    // Add equipment items
    const inventory = [...classEquipment.filter(item => !item.endsWith('gp'))];
    
    return { ...char, inventory, currency };
  });
};

// Helper function to apply class recommendations
export const applyClassRecommendations = (characterClass) => {
  character.update(char => {
    // Set hit die based on class
    const hitDice = {
      ...char.hitDice,
      value: getHitDie(characterClass)
    };
    
    // Apply class starting equipment
    const inventory = [...startingEquipment[characterClass] || []];
    
    // Extract gold from equipment
    let currency = { ...char.currency };
    const goldItem = inventory.find(item => item.endsWith('gp'));
    
    if (goldItem) {
      // Remove gold item from inventory
      const filteredInventory = inventory.filter(item => !item.endsWith('gp'));
      
      // Parse gold amount
      const goldAmount = parseInt(goldItem);
      if (!isNaN(goldAmount)) {
        currency.gp = (currency.gp || 0) + goldAmount;
      }
      
      return { 
        ...char, 
        class: characterClass,
        hitDice,
        inventory: filteredInventory,
        currency
      };
    }
    
    return { 
      ...char, 
      class: characterClass,
      hitDice,
      inventory
    };
  });
};