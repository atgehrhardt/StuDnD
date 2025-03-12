import { writable } from 'svelte/store';

// Initial game state
const initialState = {
  campaignName: 'New Adventure',
  currentLocation: 'Starting Town',
  currentQuest: 'Begin your adventure',
  npcs: [],
  inventory: [],
  gameLog: [],
  currentRoll: null,
  studyCheckActive: false,
  studyCheckDie: null,
  isGameStarted: false
};

// Create writable store
export const gameState = writable(initialState);

// Helper functions to update game state
export const addToGameLog = (entry) => {
  gameState.update(state => {
    // Keep only the last 50 entries to prevent too much history
    const updatedLog = [...state.gameLog, entry].slice(-50);
    return { ...state, gameLog: updatedLog };
  });
};

export const setCurrentRoll = (roll) => {
  gameState.update(state => ({ ...state, currentRoll: roll }));
};

export const startStudyCheck = (dieType) => {
  gameState.update(state => ({
    ...state,
    studyCheckActive: true,
    studyCheckDie: dieType
  }));
};

export const completeStudyCheck = (correctAnswers, dieType) => {
  // Calculate maximum possible roll based on die type
  const dieMax = parseInt(dieType.substring(1));
  // Calculate questions wrong (half the max value of the die)
  const totalQuestions = Math.floor(dieMax / 2);
  const wrongAnswers = totalQuestions - correctAnswers;

  // Calculate modified max roll
  const modifiedMax = Math.max(1, dieMax - wrongAnswers);

  // Generate random roll between 1 and modified max
  const rollResult = Math.floor(Math.random() * modifiedMax) + 1;

  gameState.update(state => ({
    ...state,
    studyCheckActive: false,
    studyCheckDie: null,
    currentRoll: {
      dieType,
      result: rollResult,
      originalMax: dieMax,
      modifiedMax,
      correctAnswers,
      wrongAnswers
    }
  }));

  // Add roll to game log
  addToGameLog({
    type: 'roll',
    dieType,
    result: rollResult,
    modifiedMax,
    timestamp: new Date().toISOString()
  });

  return rollResult;
};

export const resetGame = () => {
  gameState.set(initialState);
};