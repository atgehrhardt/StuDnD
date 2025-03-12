import { GoogleGenerativeAI } from '@google/generative-ai';
import { settings } from '../stores/settingsStore.js';
import { get } from 'svelte/store';

// Initialize Gemini API client
let genAI = null;
let geminiModel = null;

// Function to initialize Gemini
export const initGemini = (apiKey) => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      console.warn('Empty API key provided - not initializing Gemini');
      return false;
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Alternatively we can try these model names if the above doesn't work
    // Possible alternatives:
    // - "gemini-1.5-flash"
    // - "gemini-1.0-pro"
    // - "gemini-pro"
    // - "gemini-pro-latest"
    
    // Test if the API key format is valid (this doesn't guarantee it works)
    if (apiKey.length < 10) {
      console.warn('API key seems too short to be valid');
      return false;
    }
    
    console.log('Gemini initialized successfully with API key');
    return true;
  } catch (error) {
    console.error('Error initializing Gemini:', error);
    return false;
  }
};

// Check if Gemini is initialized, if not initialize it
const ensureGeminiInitialized = () => {
  if (!genAI || !geminiModel) {
    const apiKey = get(settings).geminiApiKey;
    if (!apiKey) {
      throw new Error('No API key provided for Gemini.');
    }
    
    const initialized = initGemini(apiKey);
    if (!initialized) {
      throw new Error('Failed to initialize Gemini.');
    }
  }
};

// Create system prompt for the GM
const createSystemPrompt = (context) => {
  return `You are the Game Master (GM) for a Dungeons & Dragons 5th Edition game. You will provide immersive, engaging narration and handle game mechanics according to D&D 5e rules.

CONTEXT (Only use this information, do not repeat it back to the player):
Character: ${JSON.stringify(context.characterState, null, 2)}
Location: ${context.gameState.currentLocation}
Current Quest: ${context.gameState.currentQuest}
${context.gameState.currentRoll ? `Latest Dice Roll: ${context.gameState.currentRoll.dieType} rolled ${context.gameState.currentRoll.result}` : ''}

CRITICAL RULES:
1. NEVER make actions or decisions for the player. The player controls ALL character actions.
2. If the player tries to roll a dice at an inappropriate time, explain why a roll isn't needed right now.
3. Do not take any action on behalf of the player character - always wait for explicit player instructions.
4. Track the player's inventory, health, and resources based on their actions. Remind them to update their character sheet.
5. Track location changes, combat status, quest progress, and NPCs interactions.

GAMEPLAY GUIDELINES:
1. Narrate the game world vividly, describing scenes, NPCs, and consequences of player actions.
2. When a check, save, or attack roll is needed, tell the player to roll the appropriate die and explain why.
3. For dice rolls, specify exactly which die should be rolled (d4, d6, d8, d10, d12, d20) and what type of check it is.
4. Respond to the player's actions in character as the GM, NPCs, and environment.
5. Keep track of significant narrative events and maintain world consistency.
6. Balance challenge with fun - create obstacles but allow player agency.
7. If the player does something impossible by D&D rules, gently explain why it doesn't work.
8. Notice when the player uses items or takes damage and remind them to update their character sheet.

${context.conversationSummary ? `CONVERSATION SUMMARY: ${context.conversationSummary}` : ''}

Now, continue the game based on the player's latest input, maintaining an engaging and immersive D&D experience.`;
};

// Function to generate response from Gemini
export const generateGMResponse = async (userMessage, context) => {
  try {
    ensureGeminiInitialized();
    
    // Create chat history in the format expected by the Gemini API
    // Note: Gemini expects "parts" not "content" in each message
    const systemMessage = {
      role: 'user',
      parts: [{ text: createSystemPrompt(context) }]
    };
    
    // Format the user messages correctly
    const userMessages = context.lastUserMessages.map(msg => ({
      role: 'user',
      parts: [{ text: msg.content }]
    }));
    
    // Format the GM (assistant) messages correctly
    const gmMessages = context.lastGmMessages.map(msg => ({
      role: 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Current user message
    const currentUserMessage = {
      role: 'user',
      parts: [{ text: userMessage }]
    };
    
    // Combine all messages
    const contents = [
      systemMessage,
      ...userMessages,
      ...gmMessages,
      currentUserMessage
    ];
    
    // Filter out any empty messages
    const validContents = contents.filter(msg => 
      msg.parts && 
      msg.parts.length > 0 && 
      msg.parts[0].text && 
      msg.parts[0].text.trim() !== ''
    );
    
    // Check if we're in development mode without a valid API key
    if (!genAI || !geminiModel) {
      console.log('Using mock response in development mode');
      // Return a mock response for development
      return `[GM Mock Response] I am the Game Master. You are in a tavern in the town of Faerun. 
      What would you like to do? If you want to explore the town, please roll a d20 for perception.`;
    }
    
    console.log('Sending request to Gemini API...');
    
    // Generate response
    const result = await geminiModel.generateContent({
      contents: validContents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1500,
      },
    });
    
    console.log('Received response from Gemini API');
    
    // Extract and return the response text
    return result.response.text();
  } catch (error) {
    console.error('Error generating GM response:', error);
    // Return a more user-friendly error during development
    if (!get(settings).geminiApiKey || get(settings).geminiApiKey.trim() === '') {
      return `The Dungeon Master needs a valid Google Gemini API key to continue. Please add your API key in the Settings tab.`;
    }
    return `Error: ${error.message || 'Failed to generate response'}. Please check your API key and internet connection.`;
  }
};

// Function to summarize conversation
export const summarizeConversation = async (messages) => {
  try {
    ensureGeminiInitialized();
    
    // Extract message contents
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'Player' : 'GM'}: ${msg.content}`)
      .join('\n\n');
    
    // Create prompt for summarization
    const prompt = `Summarize the following D&D game conversation into a brief summary that captures the key plot points, character decisions, and significant events. Focus on narrative progression rather than mechanics.

Conversation to summarize:
${conversationText}

Summary:`;
    
    // Generate summary using the correct format
    const result = await geminiModel.generateContent({
      contents: [{ 
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 500,
      },
    });
    
    // Extract and return the summary text
    return result.response.text();
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return `Error: ${error.message || 'Failed to generate summary'}`;
  }
};