<script>
  import { onMount } from 'svelte';
  import { gameState } from './stores/gameState.js';
  import { chatStore } from './stores/chatStore.js';
  import { settings } from './stores/settingsStore.js';
  import { character } from './stores/characterStore.js';
  
  import CharacterSheet from './components/CharacterSheet.svelte';
  import ChatInterface from './components/ChatInterface.svelte';
  import DiceRoller from './components/DiceRoller.svelte';
  import GameLog from './components/GameLog.svelte';
  import Settings from './components/Settings.svelte';
  
  let currentTab = 'character'; // game, character, settings
  let showApiKeyPrompt = false;
  let isLoading = true;
  let saveMessage = '';
  let saveMessageType = 'info';
  let showMessage = false;
  
  // Watch for game state changes to automatically switch to game tab when a new game starts
  $: if ($gameState.isGameStarted) {
    currentTab = 'game';
  }
  
  function showSaveMessage(message, type = 'info') {
    saveMessage = message;
    saveMessageType = type;
    showMessage = true;
    
    // Hide message after 3 seconds
    setTimeout(() => {
      showMessage = false;
    }, 3000);
  }
  
  // Apply theme and font size based on settings
  $: {
    // Get the HTML element
    if (typeof document !== 'undefined') {
      // Apply theme
      if ($settings.theme === 'light') {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
      } else {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
      }
      
      // Apply font size
      document.documentElement.style.setProperty('--base-font-size', 
        $settings.fontSize === 'small' ? '14px' : 
        $settings.fontSize === 'large' ? '18px' : '16px');
    }
  }

  // Setup autosave functionality
  let autosaveInterval;
  
  $: {
    // Update autosave interval when settings change
    clearInterval(autosaveInterval);
    if ($settings.autoSave && $gameState.isGameStarted) {
      autosaveInterval = setInterval(() => {
        if ($gameState.isGameStarted) {
          handleAutoSave();
        }
      }, $settings.autoSaveInterval * 60 * 1000); // Convert minutes to milliseconds
    }
  }
  
  function handleAutoSave() {
    // Create sanitized versions of state objects to prevent sensitive data from being saved
    const sanitizedGameState = { ...$gameState };
    
    // Ensure we don't save any API keys in game saves
    if (sanitizedGameState.settings) {
      delete sanitizedGameState.settings.geminiApiKey;
    }
    
    const gameData = {
      gameState: sanitizedGameState,
      characterState: $character,
      chatHistory: {
        messages: $chatStore.messages.slice(-30), // Save last 30 messages
        conversationSummary: $chatStore.conversationSummary
      }
    };
    
    // Save game data
    if (window.api) {
      window.api.saveGame(gameData);
      console.log(`Game auto-saved at ${new Date().toLocaleTimeString()}`);
      
      // Show brief notification
      saveMessage = `Game auto-saved at ${new Date().toLocaleTimeString()}`;
      saveMessageType = 'info';
      showMessage = true;
      
      // Hide message after a short time
      setTimeout(() => {
        showMessage = false;
      }, 2000);
    }
  }
  
  onMount(async () => {
    console.log('App mounting...');
    
    // Set loading to false after a short delay regardless of what happens
    // This ensures the app doesn't get stuck on loading screen
    setTimeout(() => {
      if (isLoading) {
        console.log('Forcing loading to false after timeout');
        isLoading = false;
        showApiKeyPrompt = true;
      }
    }, 3000);
    
    // Check if window.api exists before trying to use it
    if (!window.api) {
      console.error('window.api is undefined - app may be running outside of Electron context');
      isLoading = false;
      showApiKeyPrompt = true;
      return;
    }
    
    try {
      console.log('Trying to get API key...');
      // Check if API key is set
      try {
        const apiKey = await window.api.getApiKey();
        // Only log whether key exists, not the key itself
        console.log('API key status:', apiKey ? 'exists' : 'not found');
        
        if (!apiKey) {
          showApiKeyPrompt = true;
        } else {
          $settings.geminiApiKey = apiKey;
        }
      } catch (error) {
        console.error('Failed to get API key, showing prompt:', error);
        showApiKeyPrompt = true; // Fall back to prompt on any error
      }
    } catch (error) {
      console.error('Error retrieving API key:', error);
      // If we can't get the API key, assume we need to prompt for it
      showApiKeyPrompt = true;
    } finally {
      // Always set loading to false, even if there's an error
      console.log('Setting isLoading to false');
      isLoading = false;
    }
    
    // Clean up autosave interval on component unmount
    return () => {
      if (autosaveInterval) {
        clearInterval(autosaveInterval);
      }
    };
  });
  
  function handleSaveGame() {
    // Create sanitized versions of state objects to prevent sensitive data from being saved
    const sanitizedGameState = { ...$gameState };
    
    // Ensure we don't save any API keys in game saves
    if (sanitizedGameState.settings) {
      delete sanitizedGameState.settings.geminiApiKey;
    }
    
    const gameData = {
      gameState: sanitizedGameState,
      characterState: $character,
      chatHistory: {
        messages: $chatStore.messages.slice(-30), // Save last 30 messages (15 user + 15 GM)
        conversationSummary: $chatStore.conversationSummary
      }
    };
    
    window.api.saveGame(gameData);
    showSaveMessage('Game saved successfully', 'success');
  }
  
  async function handleLoadGame() {
    const gameData = await window.api.loadGame();
    if (gameData) {
      // Restore game state
      gameState.set(gameData.gameState);
      
      // Restore character state
      character.set(gameData.characterState);
      
      // Restore chat history
      if (gameData.chatHistory) {
        chatStore.update(state => ({
          ...state,
          messages: gameData.chatHistory.messages || [],
          conversationSummary: gameData.chatHistory.conversationSummary || ''
        }));
      }
      
      showSaveMessage('Game loaded successfully', 'success');
    }
  }
  
  function handleApiKeySave(apiKey) {
    window.api.setApiKey(apiKey);
    $settings.geminiApiKey = apiKey;
    showApiKeyPrompt = false;
  }
</script>

<main class="app-container">
  {#if isLoading}
    <div class="loading">
      <p>Loading application...</p>
    </div>
  {:else if showApiKeyPrompt}
    <div class="api-key-prompt">
      <h2>Welcome to DnD Learning Companion</h2>
      <p>To use this application, you need to provide a Google Gemini API key.</p>
      
      <div class="api-instructions">
        <ol>
          <li>Visit <a href="https://ai.google.dev" target="_blank">https://ai.google.dev</a> to create a free Gemini API key</li>
          <li>After creating an API key, copy it to your clipboard</li>
          <li>Paste your API key in the field below</li>
          <li>The key will be securely stored on your device only</li>
        </ol>
      </div>
      
      <div class="api-form">
        <input 
          type="password" 
          bind:value={$settings.geminiApiKey} 
          placeholder="Enter your Gemini API key" 
          on:keydown={(e) => e.key === 'Enter' && handleApiKeySave($settings.geminiApiKey)}
        />
        <button on:click={() => handleApiKeySave($settings.geminiApiKey)}>Save API Key</button>
      </div>
      
      <div class="api-security-note">
        <p>Your API key is stored securely and never shared. This app uses the key to communicate with Google's Gemini API.</p>
      </div>
    </div>
  {:else}
    <header class="app-header">
      <h1>DnD Learning Companion</h1>
      <div class="tabs">
        <button class={currentTab === 'game' ? 'active' : ''} on:click={() => currentTab = 'game'}>Game</button>
        <button class={currentTab === 'character' ? 'active' : ''} on:click={() => currentTab = 'character'}>Character</button>
        <button class={currentTab === 'settings' ? 'active' : ''} on:click={() => currentTab = 'settings'}>Settings</button>
      </div>
      <div class="actions">
        <button on:click={handleSaveGame}>Save Game</button>
        <button on:click={handleLoadGame}>Load Game</button>
      </div>
    </header>
    
    {#if showMessage}
      <div class="message {saveMessageType}">
        {saveMessage}
      </div>
    {/if}
    
    <div class="content">
      {#if currentTab === 'game'}
        <!-- Desktop layout -->
        <div class="game-container desktop-only">
          <div class="game-left">
            <GameLog />
            <DiceRoller />
          </div>
          <div class="game-right">
            <ChatInterface />
          </div>
        </div>
        
        <!-- Mobile layout with reordered components -->
        <div class="mobile-layout">
          <div class="mobile-chat">
            <ChatInterface />
          </div>
          <div class="mobile-dice">
            <DiceRoller />
          </div>
          <div class="mobile-log">
            <GameLog />
          </div>
        </div>
      {:else if currentTab === 'character'}
        <CharacterSheet />
      {:else if currentTab === 'settings'}
        <Settings />
      {/if}
    </div>
  {/if}
</main>

<style>
  :root {
    --base-font-size: 16px;
    --small-font-size: calc(var(--base-font-size) * 0.875);
    --large-font-size: calc(var(--base-font-size) * 1.125);
    --heading-font-size: calc(var(--base-font-size) * 1.5);
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    color: var(--text-color, #f0f0f0);
    background-color: var(--bg-color, #2a2a2a);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: var(--base-font-size);
  }
  
  /* Theme styles */
  :root {
    /* Default to dark theme */
    --bg-color: #1e1e2f;
    --bg-secondary: #2d2d44;
    --text-color: #f0f0f0;
    --text-secondary: #ccc;
    --accent-color: #7c5ce7;
    --accent-secondary: #a55eea;
    --border-color: #3a3a5c;
    --gradient-primary: linear-gradient(135deg, #4834d4, #686de0);
    --gradient-secondary: linear-gradient(135deg, #7c5ce7, #a55eea);
    --shadow-color: rgba(0, 0, 0, 0.3);
    --header-bg: linear-gradient(135deg, #2c3e50, #4834d4);
    --card-bg: rgba(26, 26, 46, 0.8);
    --success-color: #0be881;
    --info-color: #48dbfb;
    --warning-color: #feca57;
    --danger-color: #ff6b6b;
  }
  
  /* Dark theme (default) */
  :global(.dark-theme) {
    --bg-color: #1e1e2f;
    --bg-secondary: #2d2d44;
    --text-color: #f0f0f0;
    --text-secondary: #ccc;
    --accent-color: #7c5ce7;
    --accent-secondary: #a55eea;
    --border-color: #3a3a5c;
    --gradient-primary: linear-gradient(135deg, #4834d4, #686de0);
    --gradient-secondary: linear-gradient(135deg, #7c5ce7, #a55eea);
    --shadow-color: rgba(0, 0, 0, 0.3);
    --header-bg: linear-gradient(135deg, #2c3e50, #4834d4);
    --card-bg: rgba(26, 26, 46, 0.8);
    --success-color: #0be881;
    --info-color: #48dbfb;
    --warning-color: #feca57;
    --danger-color: #ff6b6b;
  }
  
  /* Light theme */
  :global(.light-theme) {
    --bg-color: #f5f6fa;
    --bg-secondary: #ffffff;
    --text-color: #2c3a47;
    --text-secondary: #57606f;
    --accent-color: #5f27cd;
    --accent-secondary: #341f97;
    --border-color: #dfe4ea;
    --gradient-primary: linear-gradient(135deg, #c8d6e5, #dfe4ea);
    --gradient-secondary: linear-gradient(135deg, #a55eea, #6c5ce7);
    --shadow-color: rgba(0, 0, 0, 0.1);
    --header-bg: linear-gradient(135deg, #a55eea, #6c5ce7);
    --card-bg: rgba(255, 255, 255, 0.9);
    --success-color: #2ed573;
    --info-color: #1e90ff;
    --warning-color: #ffa502;
    --danger-color: #ff4757;
  }
  
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 2px 10px var(--shadow-color);
    border-radius: 0 0 10px 10px;
  }
  
  .app-header h1 {
    margin: 0;
    font-size: var(--heading-font-size, 1.5rem);
    color: white;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  
  .tabs {
    display: flex;
    gap: 0.5rem;
  }
  
  .tabs button {
    background-color: rgba(255, 255, 255, 0.15);
    border: none;
    color: white;
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    border-radius: 6px;
    font-size: var(--base-font-size);
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tabs button:hover {
    background-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
  
  .tabs button.active {
    background: var(--gradient-secondary);
    box-shadow: 0 4px 10px rgba(123, 92, 231, 0.3);
  }
  
  .actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .actions button {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    border-radius: 6px;
    font-size: var(--base-font-size);
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px var(--shadow-color);
  }
  
  .actions button:hover {
    background-color: var(--accent-color);
    color: white;
    transform: translateY(-2px);
  }
  
  .content {
    flex: 1;
    padding: 1.5rem;
    overflow: auto;
    font-size: var(--base-font-size);
    background-color: var(--bg-color);
    background-image: radial-gradient(
      circle at 10% 10%, 
      rgba(123, 92, 231, 0.1), 
      transparent 40%
    ), 
    radial-gradient(
      circle at 90% 90%, 
      rgba(165, 94, 234, 0.1), 
      transparent 40%
    );
  }
  
  .game-container {
    display: flex;
    height: 100%;
    gap: 1.5rem;
  }
  
  .game-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .game-right {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  /* Desktop/mobile display control */
  .desktop-only {
    display: flex;
  }
  
  .mobile-layout {
    display: none;
  }
  
  /* Responsive layout for smaller screens */
  @media (max-width: 768px) {
    .desktop-only {
      display: none;
    }
    
    .mobile-layout {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: 1.5rem;
    }
    
    .app-header {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .app-header h1 {
      font-size: 1.2rem;
    }
    
    .tabs button {
      padding: 0.4rem 0.75rem;
      font-size: 0.9rem;
    }
    
    .actions button {
      padding: 0.4rem 0.75rem;
      font-size: 0.9rem;
    }
    
    /* Mobile component order and sizing */
    .mobile-chat {
      order: 1;
      height: auto;
      min-height: 300px;
    }
    
    .mobile-dice {
      order: 2;
    }
    
    .mobile-log {
      order: 3;
    }
  }
  
  /* Even smaller screens (mobile) */
  @media (max-width: 480px) {
    .content {
      padding: 0.75rem;
    }
    
    .tabs {
      width: 100%;
      justify-content: center;
    }
    
    .actions {
      width: 100%;
      justify-content: center;
    }
  }
  
  .loading, .api-key-prompt {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    background: var(--gradient-primary);
    background-size: 200% 200%;
    animation: gradient-shift 15s ease infinite;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .api-instructions {
    margin: 1.5rem 0;
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem 1.5rem;
    border-radius: 8px;
    border-left: 4px solid var(--accent-color);
  }
  
  .api-instructions ol {
    padding-left: 1.5rem;
    margin: 0;
  }
  
  .api-instructions li {
    margin: 0.5rem 0;
    color: var(--text-color);
  }
  
  .api-instructions a {
    color: var(--accent-color);
    text-decoration: none;
    font-weight: bold;
  }
  
  .api-instructions a:hover {
    text-decoration: underline;
  }
  
  .api-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
    width: 100%;
    max-width: 500px;
  }
  
  .api-form input {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background-color: rgba(255, 255, 255, 0.08);
    color: white;
    font-size: 1rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .api-form input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(124, 92, 231, 0.3);
  }
  
  .api-form button {
    padding: 0.75rem 1rem;
    background: var(--gradient-secondary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: 0.5px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 10px rgba(124, 92, 231, 0.3);
  }
  
  .api-form button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(124, 92, 231, 0.4);
  }
  
  .api-security-note {
    margin-top: 1.5rem;
    padding: 0.75rem 1rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    border-left: 4px solid var(--info-color);
  }
  
  .api-security-note p {
    margin: 0;
  }
  
  .message {
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    margin: 0.75rem 1rem;
    font-size: 0.95rem;
    text-align: center;
    animation: slide-in 0.3s ease;
    box-shadow: 0 4px 12px var(--shadow-color);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  @keyframes slide-in {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .message.info {
    background-color: rgba(72, 219, 251, 0.15);
    border-left: 4px solid var(--info-color);
    color: var(--info-color);
  }
  
  .message.success {
    background-color: rgba(14, 233, 134, 0.15);
    border-left: 4px solid var(--success-color);
    color: var(--success-color);
  }
  
  .message.error {
    background-color: rgba(255, 107, 107, 0.15);
    border-left: 4px solid var(--danger-color);
    color: var(--danger-color);
  }
</style>