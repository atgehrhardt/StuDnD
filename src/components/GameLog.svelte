<script>
    import { onMount, afterUpdate } from 'svelte';
    import { gameState } from '../stores/gameState.js';
    
    let logContainer;
    
    // Always scroll to the bottom when new logs are added
    afterUpdate(() => {
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    });
    
    // Format timestamp
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Get icon for log entry type
    function getLogIcon(type) {
      switch (type) {
        case 'roll':
          return '🎲';
        case 'system':
          return '⚙️';
        case 'combat':
          return '⚔️';
        case 'reward':
          return '💰';
        case 'quest':
          return '📜';
        case 'character':
          return '👤';
        default:
          return '📝';
      }
    }
  </script>
  
  <div class="game-log">
    <div class="log-header">
      <h3>Game Log</h3>
      <div class="log-controls">
        <button class="clear-button">Clear</button>
      </div>
    </div>
    
    <div class="log-entries" bind:this={logContainer}>
      {#if $gameState.gameLog.length === 0}
        <div class="empty-log">
          <p>No events have been logged yet.</p>
        </div>
      {:else}
        {#each $gameState.gameLog as entry}
          <div class="log-entry {entry.type}">
            <span class="entry-icon">{getLogIcon(entry.type)}</span>
            <div class="entry-content">
              <div class="entry-time">{formatTime(entry.timestamp)}</div>
              <div class="entry-text">
                {#if entry.type === 'roll'}
                  Rolled <strong>{entry.result}</strong> on {entry.dieType} (max: {entry.modifiedMax})
                {:else}
                  {entry.content}
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
  
  <style>
    .game-log {
      background-color: var(--bg-secondary, #2a2a2a);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      height: 300px;
    }
    
    /* Mobile adjustments */
    @media (max-width: 768px) {
      .game-log {
        height: auto;
        min-height: 200px;
        max-height: 300px;
      }
    }
    
    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background-color: var(--card-bg, #1a1a1a);
      border-bottom: 1px solid var(--border-color, #444);
      border-radius: 6px 6px 0 0;
    }
    
    .log-header h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    
    .log-controls {
      display: flex;
      gap: 0.5rem;
    }
    
    .clear-button {
      background-color: #444;
      border: none;
      color: #f0f0f0;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    
    .log-entries {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }
    
    .empty-log {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #888;
      font-style: italic;
    }
    
    .log-entry {
      display: flex;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      border-radius: 4px;
      background-color: var(--bg-color, #333);
      font-size: 0.9rem;
      color: var(--text-color, white);
    }
    
    .log-entry.roll {
      background-color: var(--accent-color, #2c3e50);
    }
    
    .log-entry.system {
      background-color: var(--bg-secondary, #3c3c3c);
    }
    
    .log-entry.combat {
      background-color: var(--danger-color, #4c3030);
    }
    
    .log-entry.reward {
      background-color: var(--success-color, #3c4c30);
    }
    
    .log-entry.quest {
      background-color: var(--info-color, #30304c);
    }
    
    .entry-icon {
      margin-right: 0.5rem;
      font-size: 1.2rem;
    }
    
    .entry-content {
      flex: 1;
    }
    
    .entry-time {
      font-size: 0.8rem;
      color: #aaa;
      margin-bottom: 0.25rem;
    }
    
    .entry-text {
      line-height: 1.4;
    }
  </style>