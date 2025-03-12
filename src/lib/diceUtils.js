import { gameState, addToGameLog, setCurrentRoll, startStudyCheck, completeStudyCheck } from '../stores/gameState.js';
import { settings } from '../stores/settingsStore.js';
import { get } from 'svelte/store';
import { handleDiceRoll } from './contextManager.js';

// Available dice types in D&D
export const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

// Roll a die of the specified type without study check
export const rollDie = (dieType) => {
  const max = parseInt(dieType.substring(1));
  const result = Math.floor(Math.random() * max) + 1;
  return result;
};

// Calculate number of study questions for a die type
export const getStudyQuestionCount = (dieType) => {
  const max = parseInt(dieType.substring(1));
  return Math.floor(max / 2);
};

// Initiate a dice roll with study check (if study mode is enabled)
export const initiateRollWithStudyCheck = (dieType) => {
  // Check if study mode is enabled
  const studyModeEnabled = get(settings).studyMode;
  
  if (studyModeEnabled) {
    // Start the study check process
    startStudyCheck(dieType);
    
    // Log this in the game log
    addToGameLog({
      type: 'system',
      content: `Study check started for ${dieType} roll. (Answer ${getStudyQuestionCount(dieType)} questions)`,
      timestamp: new Date().toISOString()
    });
    
    return {
      dieType,
      questionCount: getStudyQuestionCount(dieType)
    };
  } else {
    // If study mode is disabled, perform a direct roll without study check
    const result = rollDie(dieType);
    const dieMax = parseInt(dieType.substring(1));
    
    // Set the roll result directly
    setCurrentRoll({
      dieType,
      result,
      originalMax: dieMax,
      modifiedMax: dieMax,
      correctAnswers: 0,
      wrongAnswers: 0
    });
    
    // Log the roll in the game log
    addToGameLog({
      type: 'roll',
      dieType,
      result,
      timestamp: new Date().toISOString()
    });
    
    // Send the roll result to the GM
    handleDiceRoll(dieType, result, dieMax, 0, 0);
    
    // Return an object indicating no study check
    return {
      dieType,
      questionCount: 0,
      directRoll: true,
      result
    };
  }
};

// Complete a study check and calculate the modified roll
export const completeStudyCheckAndRoll = async (dieType, correctAnswers) => {
  // Ensure correct answers is a number and within valid range
  correctAnswers = parseInt(correctAnswers);
  const totalQuestions = getStudyQuestionCount(dieType);
  
  if (isNaN(correctAnswers) || correctAnswers < 0) {
    correctAnswers = 0;
  } else if (correctAnswers > totalQuestions) {
    correctAnswers = totalQuestions;
  }
  
  // Complete the study check to get the roll result
  const rollResult = completeStudyCheck(correctAnswers, dieType);
  
  // Get the current game state to access the roll details
  const currentState = get(gameState);
  const { modifiedMax } = currentState.currentRoll;
  
  // Notify the LLM of the roll result
  await handleDiceRoll(
    dieType,
    rollResult,
    modifiedMax,
    totalQuestions,
    correctAnswers
  );
  
  return {
    dieType,
    result: rollResult,
    modifiedMax,
    totalQuestions,
    correctAnswers
  };
};

// Check if a given string contains a dice roll request
export const containsDiceRequest = (text) => {
  for (const dieType of diceTypes) {
    if (text.includes(dieType)) {
      // Look for common roll phrases around the die type
      const rollPhrases = ['roll', 'rolling', 'make a', 'perform a', 'check'];
      return rollPhrases.some(phrase => 
        text.toLowerCase().includes(`${phrase} ${dieType}`) || 
        text.toLowerCase().includes(`${dieType} ${phrase}`)
      );
    }
  }
  return false;
};

// Extract die type from text
export const extractDieType = (text) => {
  for (const dieType of diceTypes) {
    if (text.includes(dieType)) {
      return dieType;
    }
  }
  return null;
};

// Format roll result for display
export const formatRollResult = (rollData) => {
  if (!rollData) return '';
  
  const { dieType, result, modifiedMax, totalQuestions, correctAnswers } = rollData;
  const wrongAnswers = totalQuestions - correctAnswers;
  const originalMax = parseInt(dieType.substring(1));
  
  return `Rolled ${result} on ${dieType} (answered ${correctAnswers}/${totalQuestions} correctly, reduced max from ${originalMax} to ${modifiedMax})`;
};