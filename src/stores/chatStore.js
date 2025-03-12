import { writable, derived } from 'svelte/store';
import { character } from './characterStore.js';
import { gameState } from './gameState.js';
import { settings } from './settingsStore.js';

// Initial chat state
const initialChatState = {
  messages: [],
  isLoading: false,
  conversationSummary: ''
};

// Create writable store
export const chatStore = writable(initialChatState);

// Derived store for context management (what gets sent to the LLM)
export const llmContext = derived(
  [chatStore, character, gameState],
  ([$chatStore, $character, $gameState]) => {
    // Get last 15 user messages
    const lastUserMessages = $chatStore.messages
      .filter(m => m.role === 'user')
      .slice(-15);
    
    // Get last 15 GM messages
    const lastGmMessages = $chatStore.messages
      .filter(m => m.role === 'assistant')
      .slice(-15);
    
    // Format the context object
    return {
      conversationSummary: $chatStore.conversationSummary,
      lastUserMessages,
      lastGmMessages,
      characterState: $character,
      gameState: {
        campaignName: $gameState.campaignName,
        currentLocation: $gameState.currentLocation,
        currentQuest: $gameState.currentQuest,
        npcs: $gameState.npcs,
        inventory: $gameState.inventory,
        currentRoll: $gameState.currentRoll
      }
    };
  }
);

// Helper functions to update chat store
export const addMessage = (role, content) => {
  const timestamp = new Date().toISOString();
  
  chatStore.update(state => {
    const newMessages = [...state.messages, { role, content, timestamp }];
    
    // If we have more than 50 messages, we should probably summarize older ones
    if (newMessages.length > 50 && !state.conversationSummary) {
      // We would need to call the LLM to generate a summary
      // For now, just note that we have older messages
      return {
        ...state,
        messages: newMessages,
        conversationSummary: 'The conversation began with the party meeting in a tavern...'
      };
    }
    
    return {
      ...state,
      messages: newMessages
    };
  });
};

// Helper function to set loading state
export const setLoading = (isLoading) => {
  chatStore.update(state => ({ ...state, isLoading }));
};

// Function to clear chat history
export const clearChat = () => {
  chatStore.set(initialChatState);
};

// Function to summarize conversation (would use LLM)
export const summarizeConversation = async () => {
  // This would call the LLM API to generate a summary
  // For now, set a placeholder
  chatStore.update(state => ({
    ...state,
    conversationSummary: 'The party has been exploring the forest and encountered several challenges...'
  }));
};