import { get } from 'svelte/store';
import { chatStore, llmContext } from '../stores/chatStore.js';
import { character } from '../stores/characterStore.js';
import { gameState } from '../stores/gameState.js';
import { settings } from '../stores/settingsStore.js';
import { generateGMResponse, summarizeConversation } from './geminiService.js';

// Helper to extract relevant dice roll information from a message
const extractDiceRollRequest = (message) => {
  // Common dice patterns in D&D
  const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
  const diceRegex = new RegExp(`\\b(${diceTypes.join('|')})\\b`, 'gi');
  
  // Check if message contains any dice references
  const diceMatches = message.match(diceRegex);
  if (!diceMatches) return null;
  
  // Common check/roll patterns
  const rollPatterns = [
    'roll',
    'make a',
    'perform a',
    'check',
    'saving throw',
    'attack roll',
    'skill check',
    'ability check'
  ];
  
  // Check if message contains roll instruction
  const hasRollInstruction = rollPatterns.some(pattern => 
    message.toLowerCase().includes(pattern)
  );
  
  if (hasRollInstruction) {
    return diceMatches[0].toLowerCase(); // Return the first dice type mentioned
  }
  
  return null;
};

// Process GM's response to check for dice roll requests
export const processGMResponse = (response) => {
  const diceRequest = extractDiceRollRequest(response);
  
  // If dice roll is requested, update the game state
  if (diceRequest) {
    gameState.update(state => ({
      ...state,
      needsDiceRoll: true,
      requestedDiceType: diceRequest
    }));
  } else {
    gameState.update(state => ({
      ...state,
      needsDiceRoll: false,
      requestedDiceType: null
    }));
  }
  
  return response;
};

// Send message to LLM and handle response
export const sendMessageToGM = async (userMessage) => {
  try {
    // Update chat store to show loading state
    chatStore.update(state => ({ ...state, isLoading: true }));
    
    // Add user message to chat history
    const timestamp = new Date().toISOString();
    chatStore.update(state => ({
      ...state,
      messages: [...state.messages, { role: 'user', content: userMessage, timestamp }]
    }));
    
    // Get current context
    const context = get(llmContext);
    
    // Send to LLM
    const response = await generateGMResponse(userMessage, context);
    
    // Process response for dice roll requests
    const processedResponse = processGMResponse(response);
    
    // Add GM response to chat history
    chatStore.update(state => ({
      ...state,
      messages: [...state.messages, { role: 'assistant', content: processedResponse, timestamp: new Date().toISOString() }],
      isLoading: false
    }));
    
    // Check if we need to summarize the conversation
    const chatHistory = get(chatStore).messages;
    if (chatHistory.length > 50 && !get(chatStore).conversationSummary) {
      // Summarize in the background without blocking
      summarizeConversation(chatHistory).then(summary => {
        if (summary && !summary.startsWith('Error:')) {
          chatStore.update(state => ({ ...state, conversationSummary: summary }));
        }
      });
    }
    
    return processedResponse;
  } catch (error) {
    console.error('Error sending message to GM:', error);
    
    // Update chat store with error
    chatStore.update(state => ({
      ...state,
      messages: [...state.messages, { 
        role: 'system', 
        content: `Error: ${error.message || 'Failed to get response from GM'}`, 
        timestamp: new Date().toISOString(),
        isError: true
      }],
      isLoading: false
    }));
    
    return null;
  }
};

// Handle dice roll results and communicate to the LLM
export const handleDiceRoll = async (dieType, result, modifiedMax, totalQuestions, correctAnswers) => {
  // Format a message about the dice roll
  const rollMessage = `I rolled a ${result} on a ${dieType}. (I answered ${correctAnswers} out of ${totalQuestions} study questions correctly, so my maximum possible roll was ${modifiedMax}.)`;
  
  // Send this as a message to the GM
  return await sendMessageToGM(rollMessage);
};

// Start a new game session
export const startNewGame = async (characterData, campaignName = 'New Adventure') => {
  // Update character
  character.set(characterData);
  
  // Update game state
  gameState.update(state => ({
    ...state,
    campaignName,
    isGameStarted: true,
    gameLog: [{
      type: 'system',
      content: `New game started: ${campaignName}`,
      timestamp: new Date().toISOString()
    }]
  }));
  
  // Clear chat history
  chatStore.set({
    messages: [],
    isLoading: false,
    conversationSummary: ''
  });
  
  // Send initial message to the GM
  const initialPrompt = `I'm playing as ${characterData.name}, a level ${characterData.level} ${characterData.race} ${characterData.class}. Please start our D&D 5e adventure with an engaging introduction to the world and my first scene.`;
  
  return await sendMessageToGM(initialPrompt);
};