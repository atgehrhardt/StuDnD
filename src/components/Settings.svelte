<script>
  import { settings, updateSetting, toggleSetting, resetSettings } from '../stores/settingsStore.js';
  import { onMount } from 'svelte';
  import { initGemini } from '../lib/geminiService.js';
  
  let apiKeyStatus = 'unknown'; // unknown, valid, invalid
  let saveMessage = '';
  let saveMessageType = 'info';
  let showMessage = false;
  let apiKeyTemp = '';
  
  onMount(async () => {
    apiKeyTemp = $settings.geminiApiKey;
    if (apiKeyTemp) {
      checkApiKey(apiKeyTemp);
    }
  });
  
  async function saveSettings() {
    // Save API key
    if (apiKeyTemp !== $settings.geminiApiKey) {
      if (await checkApiKey(apiKeyTemp)) {
        updateSetting('geminiApiKey', apiKeyTemp);
        if (window.api) {
          await window.api.setApiKey(apiKeyTemp);
        }
      } else {
        // Don't save invalid API key
        return;
      }
    }
    
    // Sync debug mode with main process
    if (window.api && window.api.setDebugMode) {
      await window.api.setDebugMode($settings.debugMode);
    }
    
    // All other settings are automatically saved when they change
    // via the bind:value and bind:checked directives
    
    // Show success message
    showSaveMessage('Settings saved successfully!', 'success');
  }
  
  function handleResetSettings() {
    resetSettings();
    apiKeyTemp = $settings.geminiApiKey;
    showSaveMessage('Settings reset to defaults', 'info');
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
  
  async function checkApiKey(apiKey) {
    if (!apiKey) {
      apiKeyStatus = 'invalid';
      showSaveMessage('API Key cannot be empty', 'error');
      return false;
    }
    
    try {
      // Security: Don't log API key operations
      const initialized = initGemini(apiKey);
      if (initialized) {
        apiKeyStatus = 'valid';
        showSaveMessage('API Key validated successfully', 'success');
        return true;
      } else {
        apiKeyStatus = 'invalid';
        showSaveMessage('Invalid API Key format', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error checking API key:', error);
      apiKeyStatus = 'invalid';
      showSaveMessage('Error validating API Key: ' + error.message, 'error');
      return false;
    }
  }
</script>

<div class="settings-container">
  <h2>Settings</h2>
  
  {#if showMessage}
    <div class="message {saveMessageType}">
      {saveMessage}
    </div>
  {/if}
  
  <div class="settings-section">
    <h3>API Configuration</h3>
    <div class="form-group">
      <label for="api-key">Google Gemini API Key</label>
      <div class="api-key-input">
        <input 
          type="password" 
          id="api-key" 
          bind:value={apiKeyTemp} 
          placeholder="Enter your Google Gemini API key"
        />
        {#if apiKeyStatus === 'valid'}
          <span class="api-status valid">✓</span>
        {:else if apiKeyStatus === 'invalid'}
          <span class="api-status invalid">✗</span>
        {/if}
      </div>
      <p class="help-text">
        A Google Gemini API key is required to use the LLM-based Game Master.
        <a href="https://ai.google.dev/" target="_blank">Get an API key here</a>
      </p>
    </div>
  </div>
  
  <div class="settings-section">
    <h3>Appearance</h3>
    <div class="form-group">
      <label for="theme">Theme</label>
      <select id="theme" bind:value={$settings.theme}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="font-size">Font Size</label>
      <select id="font-size" bind:value={$settings.fontSize}>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </div>
  </div>
  
  <div class="settings-section">
    <h3>Game Options</h3>
    <div class="toggle-group">
      <div class="toggle-switch">
        <span class="toggle-label">Study Mode</span>
        <label class="switch">
          <input type="checkbox" bind:checked={$settings.studyMode} />
          <span class="slider round"></span>
        </label>
      </div>
      <p class="help-text">
        When enabled, dice rolls will trigger study checks to test your D&D knowledge. Answering questions correctly gives you better rolls.
      </p>
    </div>
    
    <div class="toggle-group">
      <div class="toggle-switch">
        <span class="toggle-label">Sound Effects</span>
        <label class="switch">
          <input type="checkbox" bind:checked={$settings.soundEffects} />
          <span class="slider round"></span>
        </label>
      </div>
    </div>
    
    <div class="toggle-group">
      <div class="toggle-switch">
        <span class="toggle-label">Dice Animations</span>
        <label class="switch">
          <input type="checkbox" bind:checked={$settings.diceAnimations} />
          <span class="slider round"></span>
        </label>
      </div>
    </div>
    
    <div class="toggle-group">
      <div class="toggle-switch">
        <span class="toggle-label">Auto-save Game</span>
        <label class="switch">
          <input type="checkbox" bind:checked={$settings.autoSave} />
          <span class="slider round"></span>
        </label>
      </div>
      <p class="help-text">
        Automatically saves your game progress every {$settings.autoSaveInterval} minutes while playing.
      </p>
    </div>
    
    {#if $settings.autoSave}
      <div class="form-group">
        <label for="autosave-interval">Auto-save Interval (minutes)</label>
        <input 
          type="number" 
          id="autosave-interval" 
          bind:value={$settings.autoSaveInterval} 
          min="1" 
          max="60"
        />
      </div>
    {/if}
  </div>
  
  <div class="settings-section">
    <h3>Advanced</h3>
    <div class="form-group">
      <label for="max-context">Max Context Length</label>
      <input 
        type="number" 
        id="max-context" 
        bind:value={$settings.maxContextLength} 
        min="1000" 
        max="30000"
      />
      <p class="help-text">
        Maximum number of characters to include in the LLM context window.
      </p>
    </div>
    
    <div class="toggle-group">
      <div class="toggle-switch">
        <span class="toggle-label">Debug Mode</span>
        <label class="switch">
          <input type="checkbox" bind:checked={$settings.debugMode} />
          <span class="slider round"></span>
        </label>
      </div>
    </div>
  </div>
  
  <div class="settings-actions">
    <button class="save-button" on:click={saveSettings}>Save Settings</button>
    <button class="reset-button" on:click={handleResetSettings}>Reset to Defaults</button>
  </div>
  
  <div class="app-info">
    <p>DnD Learning Companion v{window.api ? window.api.getVersion() : '1.0.0'}</p>
    <p>Platform: {window.api ? window.api.getPlatform() : 'browser'}</p>
  </div>
</div>

<style>
  .settings-container {
    padding: 1.5rem;
    background-color: var(--bg-secondary, #2a2a2a);
    border-radius: 12px;
    box-shadow: 0 8px 30px var(--shadow-color);
    border: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
  }
  
  .settings-container h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.75rem;
    color: var(--accent-color);
    font-size: 1.5rem;
    letter-spacing: 0.5px;
  }
  
  .settings-section {
    margin-bottom: 2.5rem;
    background-color: var(--card-bg);
    padding: 1.25rem;
    border-radius: 10px;
    box-shadow: 0 4px 12px var(--shadow-color);
    border: 1px solid var(--border-color);
  }
  
  .settings-section h3 {
    margin-top: 0;
    margin-bottom: 1.25rem;
    font-size: 1.2rem;
    color: var(--accent-color);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
    font-weight: 600;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #444;
    background-color: #333;
    color: #f0f0f0;
  }
  
  .form-group input[type="number"] {
    width: 150px;
  }
  
  .help-text {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #aaa;
  }
  
  .help-text a {
    color: #7af;
    text-decoration: none;
  }
  
  .help-text a:hover {
    text-decoration: underline;
  }
  
  .toggle-group {
    margin-bottom: 1.5rem;
  }
  
  .toggle-switch {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .toggle-label {
    font-weight: bold;
  }
  
  /* The switch container */
  .switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }
  
  /* Hide default HTML checkbox */
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  /* The slider */
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #555;
    transition: .3s;
    border-radius: 24px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }
  
  /* The thumb (circle) */
  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  
  /* Checked state */
  input:checked + .slider {
    background: linear-gradient(135deg, #7c5ce7, #a55eea);
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
  
  /* Rounded sliders */
  .slider.round {
    border-radius: 24px;
  }
  
  .slider.round:before {
    border-radius: 50%;
  }
  
  .api-key-input {
    position: relative;
  }
  
  .api-status {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .api-status.valid {
    color: #4a6;
  }
  
  .api-status.invalid {
    color: #a64;
  }
  
  .settings-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
  
  .save-button {
    background: linear-gradient(135deg, #7c5ce7, #a55eea);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 10px rgba(124, 92, 231, 0.3);
    transition: all 0.2s ease;
  }
  
  .save-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(124, 92, 231, 0.4);
  }
  
  .reset-button {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .reset-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .app-info {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #444;
    font-size: 0.85rem;
    color: #888;
  }
  
  .app-info p {
    margin: 0.25rem 0;
  }
  
  .message {
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .message.info {
    background-color: #2c3e50;
    color: #3498db;
  }
  
  .message.success {
    background-color: #2c5036;
    color: #4a6;
  }
  
  .message.error {
    background-color: #502c2c;
    color: #e74c3c;
  }
</style>