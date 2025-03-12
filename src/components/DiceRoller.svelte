<script>
    import { diceTypes, initiateRollWithStudyCheck, completeStudyCheckAndRoll, getStudyQuestionCount } from '../lib/diceUtils.js';
    import { gameState } from '../stores/gameState.js';
    
    let showStudyCheck = false;
    let studyResult = '';
    let currentDieType = '';
    let questionCount = 0;
    let rollResult = null;
    
    $: isGameActive = $gameState.isGameStarted;
    $: studyCheckActive = $gameState.studyCheckActive;
    $: currentRoll = $gameState.currentRoll;
    $: requestedDieType = $gameState.requestedDiceType;
    
    // Watch for changes in the study check state
    $: if (studyCheckActive && $gameState.studyCheckDie) {
      showStudyCheck = true;
      currentDieType = $gameState.studyCheckDie;
      questionCount = getStudyQuestionCount(currentDieType);
    } else {
      if (showStudyCheck) {
        // We just completed a study check
        showStudyCheck = false;
      }
    }
    
    // Watch for changes in the current roll
    $: if (currentRoll && !studyCheckActive) {
      rollResult = {
        dieType: currentRoll.dieType,
        result: currentRoll.result,
        modifiedMax: currentRoll.modifiedMax,
        originalMax: currentRoll.originalMax,
        correctAnswers: currentRoll.correctAnswers,
        wrongAnswers: currentRoll.wrongAnswers,
        timestamp: new Date().toISOString()
      };
    }
    
    // Handle dice roll button click
    function handleRollClick(dieType) {
      // Start the study check process (or direct roll if study mode is disabled)
      const studyCheck = initiateRollWithStudyCheck(dieType);
      currentDieType = studyCheck.dieType;
      questionCount = studyCheck.questionCount;
      
      // If it's a direct roll (no study check), don't show the study check UI
      if (studyCheck.directRoll) {
        showStudyCheck = false;
        
        // The roll has already been processed, so no need for further action
        // Just update the UI
        rollResult = {
          dieType: studyCheck.dieType,
          result: studyCheck.result,
          modifiedMax: parseInt(dieType.substring(1)),
          originalMax: parseInt(dieType.substring(1)),
          correctAnswers: 0,
          wrongAnswers: 0,
          timestamp: new Date().toISOString()
        };
      } else {
        // Normal study check flow
        showStudyCheck = true;
        studyResult = '';
      }
    }
    
    // Handle study check completion
    async function handleStudyComplete() {
      // Ensure input is a number and within range
      let correct = parseInt(studyResult);
      if (isNaN(correct) || correct < 0) correct = 0;
      if (correct > questionCount) correct = questionCount;
      
      // Complete the study check and get roll result
      const result = await completeStudyCheckAndRoll(currentDieType, correct);
      
      // Reset study check UI
      studyResult = '';
      showStudyCheck = false;
    }
    
    // Format time for display
    function formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  </script>
  
  <div class="dice-roller">
    <div class="dice-header">
      <h3>Dice Roller</h3>
      {#if requestedDieType}
        <div class="requested-roll">
          GM requests a {requestedDieType} roll
        </div>
      {/if}
    </div>
    
    <div class="dice-buttons">
      {#each diceTypes as dieType}
        <button 
          class="die-button {requestedDieType === dieType ? 'requested' : ''}" 
          on:click={() => handleRollClick(dieType)}
          disabled={!isGameActive || studyCheckActive}
        >
          {dieType}
        </button>
      {/each}
    </div>
    
    {#if showStudyCheck}
      <div class="study-check">
        <h4>Study Check for {currentDieType}</h4>
        <p>Answer {questionCount} questions from your study materials.</p>
        <div class="study-form">
          <label for="correct-answers">How many questions did you answer correctly?</label>
          <input 
            type="number" 
            id="correct-answers" 
            bind:value={studyResult} 
            min="0" 
            max={questionCount}
          />
          <button on:click={handleStudyComplete}>Complete Study Check</button>
        </div>
      </div>
    {:else if rollResult}
      <div class="roll-result">
        <h4>Roll Result</h4>
        <div class="result-details">
          <div class="result-number">{rollResult.result}</div>
          <div class="result-info">
            <p>Die: {rollResult.dieType}</p>
            {#if rollResult.correctAnswers > 0 || rollResult.wrongAnswers > 0}
              <p>Correct answers: {rollResult.correctAnswers}/{rollResult.correctAnswers + rollResult.wrongAnswers}</p>
              <p>Modified max: {rollResult.modifiedMax} (from {rollResult.originalMax})</p>
            {:else}
              <p>Regular roll (Study Mode disabled)</p>
            {/if}
            <p class="timestamp">{formatTime(rollResult.timestamp)}</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .dice-roller {
      background: linear-gradient(135deg, var(--bg-secondary, rgba(42, 42, 63, 0.95)), var(--card-bg, rgba(26, 26, 46, 0.95)));
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 5px 20px var(--shadow-color, rgba(0, 0, 0, 0.2));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
      backdrop-filter: blur(10px);
    }
    
    .dice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.75rem;
    }
    
    .dice-header h3 {
      margin: 0;
      color: var(--accent-color, #7c5ce7);
      font-size: 1.2rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .requested-roll {
      background: linear-gradient(135deg, #7c5ce7, #a55eea);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
      animation: pulse 2s infinite;
      box-shadow: 0 2px 8px rgba(165, 94, 234, 0.3);
      font-weight: 500;
    }
    
    .dice-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .die-button {
      padding: 0.75rem;
      font-size: 1.1rem;
      background: linear-gradient(135deg, var(--bg-secondary, #3B3B5B), var(--card-bg, #2A2A3F));
      color: var(--text-color, white);
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px var(--shadow-color, rgba(0, 0, 0, 0.15));
      font-weight: 600;
      position: relative;
      overflow: hidden;
    }
    
    .die-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #5e60ce, #6930c3);
      opacity: 0;
      z-index: -1;
      transition: opacity 0.3s ease;
      border-radius: 7px;
    }
    
    .die-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(124, 92, 231, 0.3);
    }
    
    .die-button:hover::before {
      opacity: 1;
      z-index: 0;
    }
    
    .die-button.requested {
      background: linear-gradient(135deg, #a55eea, #5f27cd);
      box-shadow: 0 0 10px rgba(165, 94, 234, 0.5);
      animation: pulse 2s infinite;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
    
    .die-button.requested:hover {
      transform: translateY(-3px) scale(1.05);
    }
    
    .die-button:disabled {
      background: linear-gradient(135deg, #333, #222);
      color: #666;
      cursor: not-allowed;
      animation: none;
      box-shadow: none;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transform: none;
    }
    
    .die-button:disabled:hover {
      transform: none;
      box-shadow: none;
    }
    
    .die-button:disabled::before {
      display: none;
    }
    
    .study-check {
      background: linear-gradient(135deg, var(--bg-secondary, rgba(59, 59, 91, 0.9)), var(--card-bg, rgba(42, 42, 63, 0.9)));
      padding: 1.25rem;
      border-radius: 12px;
      margin-top: 1rem;
      box-shadow: 0 4px 16px var(--shadow-color, rgba(0, 0, 0, 0.2));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
      backdrop-filter: blur(5px);
    }
    
    .study-check h4 {
      margin-top: 0;
      margin-bottom: 0.75rem;
      color: var(--accent-color, #7c5ce7);
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .study-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    
    .study-form input {
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background-color: rgba(255, 255, 255, 0.05);
      color: white;
      font-size: 1rem;
      text-align: center;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    
    .study-form input:focus {
      outline: none;
      border-color: var(--accent-color, #7c5ce7);
      box-shadow: 0 0 0 2px rgba(124, 92, 231, 0.3);
    }
    
    .study-form button {
      background: linear-gradient(135deg, #7c5ce7, #5f27cd);
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 0.5rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 10px rgba(124, 92, 231, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .study-form button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #6930c3, #5e60ce);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .study-form button:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 15px rgba(124, 92, 231, 0.4);
    }
    
    .study-form button:hover::before {
      opacity: 1;
    }
    
    .roll-result {
      background: linear-gradient(135deg, var(--bg-secondary, rgba(59, 59, 91, 0.9)), var(--card-bg, rgba(42, 42, 63, 0.9)));
      padding: 1.25rem;
      border-radius: 12px;
      margin-top: 1rem;
      box-shadow: 0 4px 16px var(--shadow-color, rgba(0, 0, 0, 0.2));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
      animation: fade-in 0.5s ease;
      backdrop-filter: blur(5px);
    }
    
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .roll-result h4 {
      margin-top: 0;
      margin-bottom: 0.75rem;
      color: var(--accent-color, #7c5ce7);
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .result-details {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .result-number {
      font-size: 2.75rem;
      font-weight: bold;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #5f27cd, #a55eea);
      color: white;
      box-shadow: 0 4px 15px rgba(165, 94, 234, 0.4);
      position: relative;
      border: 2px solid rgba(255, 255, 255, 0.2);
      animation: result-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    @keyframes result-appear {
      from {
        transform: scale(0.5) rotate(-15deg);
        opacity: 0;
      }
      to {
        transform: scale(1) rotate(0);
        opacity: 1;
      }
    }
    
    .result-info {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .result-info p {
      margin: 0.3rem 0;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.85);
    }
    
    .timestamp {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.8rem;
      margin-top: 0.75rem !important;
      font-style: italic;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(160, 80, 192, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(160, 80, 192, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(160, 80, 192, 0);
      }
    }
  </style>