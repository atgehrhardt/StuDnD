<script>
    import { onMount, afterUpdate } from 'svelte';
    import { chatStore } from '../stores/chatStore.js';
    import { sendMessageToGM } from '../lib/contextManager.js';
    import { gameState } from '../stores/gameState.js';
    import { character } from '../stores/characterStore.js';
    import { extractDieType } from '../lib/diceUtils.js';
    
    let userMessage = '';
    let chatContainer;
    let isSubmitting = false;
    
    $: isGameActive = $gameState.isGameStarted;
    $: isLoading = $chatStore.isLoading;
    
    // Scroll to the bottom of the chat when new messages are added
    afterUpdate(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
    
    // Handle message submission
    async function handleSubmit() {
      if (!userMessage.trim() || isSubmitting || !isGameActive) return;
      
      isSubmitting = true;
      
      try {
        // Check if message contains dice roll request
        const dieType = extractDieType(userMessage);
        if (dieType && $gameState.requestedDiceType === dieType) {
          // If user is trying to roll dice through text, nudge them to use the dice roller
          // This ensures the study check mechanism is properly triggered
          userMessage += " (I'll use the dice roller to make this roll)";
        }
        
        await sendMessageToGM(userMessage);
        userMessage = '';
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        isSubmitting = false;
      }
    }
    
    // Format timestamp
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  </script>
  
  <div class="chat-container">
    <div class="chat-header">
      <h2>Game Master Chat</h2>
      {#if $character.name}
        <div class="character-info">
          Playing as: {$character.name} - Level {$character.level} {$character.race} {$character.class}
        </div>
      {/if}
    </div>
    
    <div class="chat-messages" bind:this={chatContainer}>
      {#if !isGameActive}
        <div class="system-message">
          <p>Start a new game to begin your adventure!</p>
        </div>
      {:else if $chatStore.messages.length === 0}
        <div class="system-message">
          <p>Your adventure is about to begin...</p>
        </div>
      {:else}
        {#each $chatStore.messages as message}
          <div class="message {message.role}">
            <div class="message-header">
              <span class="role">{message.role === 'user' ? 'You' : 'Game Master'}</span>
              <span class="timestamp">{formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content">
              {#if message.isError}
                <div class="error-message">{message.content}</div>
              {:else}
                {message.content}
              {/if}
            </div>
          </div>
        {/each}
        
        {#if isLoading}
          <div class="message assistant">
            <div class="message-header">
              <span class="role">Game Master</span>
            </div>
            <div class="message-content loading">
              <div class="dot-typing"></div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
    
    <div class="chat-input">
      <textarea 
        bind:value={userMessage} 
        on:keypress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
        placeholder={isGameActive ? "What do you want to do?" : "Start a game to begin..."}
        disabled={!isGameActive || isLoading}
      ></textarea>
      <button 
        on:click={handleSubmit} 
        disabled={!userMessage.trim() || !isGameActive || isLoading}
      >
        Send
      </button>
    </div>
  </div>
  
  <style>
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--bg-secondary, #2a2a2a);
      border-radius: 6px;
      overflow: hidden;
    }
    
    /* Mobile adjustments */
    @media (max-width: 768px) {
      .chat-container {
        height: auto;
        min-height: 400px;
      }
    }
    
    .chat-header {
      padding: 0.5rem 1rem;
      background-color: var(--card-bg, #1a1a1a);
      border-bottom: 1px solid var(--border-color, #444);
    }
    
    .chat-header h2 {
      margin: 0 0 0.25rem 0;
      font-size: 1.2rem;
    }
    
    .character-info {
      font-size: 0.9rem;
      color: #aaa;
    }
    
    .chat-messages {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .message {
      padding: 0.75rem;
      border-radius: 6px;
      max-width: 85%;
    }
    
    .message.user {
      align-self: flex-end;
      background-color: var(--accent-color, #2c3e50);
      color: var(--text-color, white);
    }
    
    .message.assistant {
      align-self: flex-start;
      background-color: var(--accent-secondary, #3c2c50);
      color: var(--text-color, white);
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      color: #ccc;
    }
    
    .message-content {
      white-space: pre-wrap;
      line-height: 1.5;
    }
    
    .system-message {
      text-align: center;
      color: #999;
      margin: 2rem 0;
    }
    
    .chat-input {
      display: flex;
      padding: 0.75rem;
      background-color: var(--card-bg, #1a1a1a);
      border-top: 1px solid var(--border-color, #444);
    }
    
    textarea {
      flex: 1;
      padding: 0.75rem;
      border-radius: 4px;
      border: 1px solid var(--border-color, #444);
      background-color: var(--bg-color, #333);
      color: var(--text-color, #f0f0f0);
      resize: none;
      min-height: 2.5rem;
      max-height: 8rem;
    }
    
    button {
      margin-left: 0.5rem;
      padding: 0 1rem;
      background: var(--gradient-secondary, linear-gradient(135deg, #7c5ce7, #a55eea));
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.1s ease;
    }
    
    button:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    button:disabled {
      background: #444;
      cursor: not-allowed;
    }
    
    .error-message {
      color: #e74c3c;
    }
    
    .loading {
      display: flex;
      align-items: center;
    }
    
    .dot-typing {
      position: relative;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: #9880ff;
      animation: dot-typing 1.5s infinite linear;
    }
    
    .dot-typing::before,
    .dot-typing::after {
      content: '';
      position: absolute;
      top: 0;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: #9880ff;
      animation-duration: 1.5s;
      animation-iteration-count: infinite;
      animation-timing-function: linear;
    }
    
    .dot-typing::before {
      left: -8px;
      animation-name: dot-typing-before;
    }
    
    .dot-typing::after {
      left: 8px;
      animation-name: dot-typing-after;
    }
    
    @keyframes dot-typing {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    
    @keyframes dot-typing-before {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
      25%, 75% { transform: translateY(0); }
    }
    
    @keyframes dot-typing-after {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
      25%, 75% { transform: translateY(0); }
    }
  </style>