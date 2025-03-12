<script>
    import { gameState } from '../stores/gameState.js';
    import { completeStudyCheckAndRoll, getStudyQuestionCount } from '../lib/diceUtils.js';
    
    export let dieType;
    export let onComplete = () => {};
    
    let questionCount = getStudyQuestionCount(dieType);
    let correctAnswers = 0;
    let isSubmitting = false;
    
    async function handleSubmit() {
      if (isSubmitting) return;
      isSubmitting = true;
      
      try {
        // Ensure correctAnswers is within valid range
        correctAnswers = Math.max(0, Math.min(questionCount, correctAnswers));
        
        // Process the study check and get roll result
        const result = await completeStudyCheckAndRoll(dieType, correctAnswers);
        
        // Call the onComplete callback with the result
        onComplete(result);
      } catch (error) {
        console.error('Error processing study check:', error);
      } finally {
        isSubmitting = false;
      }
    }
  </script>
  
  <div class="study-check-modal">
    <div class="study-check-content">
      <h2>Study Check</h2>
      
      <div class="die-info">
        <span class="die-type">{dieType}</span> roll requires a study check
      </div>
      
      <p class="instructions">
        Answer {questionCount} questions from your study materials.
        This will determine the maximum possible value of your dice roll.
      </p>
      
      <div class="question-form">
        <label for="correct-answers">How many questions did you answer correctly?</label>
        <input 
          type="number" 
          id="correct-answers" 
          bind:value={correctAnswers} 
          min="0" 
          max={questionCount}
        />
        
        <div class="question-range">
          <span>0</span>
          <span>{questionCount}</span>
        </div>
      </div>
      
      <div class="result-preview">
        <p>
          You answered <strong>{correctAnswers}</strong> out of <strong>{questionCount}</strong> questions correctly.
        </p>
        
        <p>
          Your maximum possible roll will be <strong>{Math.max(1, parseInt(dieType.substring(1)) - (questionCount - correctAnswers))}</strong> 
          (from the original {dieType} maximum of {dieType.substring(1)}).
        </p>
      </div>
      
      <div class="actions">
        <button class="submit-button" on:click={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Roll the Die'}
        </button>
      </div>
    </div>
  </div>
  
  <style>
    .study-check-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .study-check-content {
      background-color: #2a2a2a;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      padding: 2rem;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    }
    
    h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      text-align: center;
      color: #f0f0f0;
    }
    
    .die-info {
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 1.2rem;
    }
    
    .die-type {
      display: inline-block;
      background-color: #553366;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      margin-right: 0.5rem;
      font-weight: bold;
    }
    
    .instructions {
      margin-bottom: 1.5rem;
      line-height: 1.5;
      color: #ccc;
    }
    
    .question-form {
      margin-bottom: 1.5rem;
    }
    
    .question-form label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }
    
    .question-form input {
      width: 100%;
      padding: 0.75rem;
      border-radius: 4px;
      border: 1px solid #444;
      background-color: #333;
      color: #f0f0f0;
      font-size: 1.2rem;
      text-align: center;
    }
    
    .question-range {
      display: flex;
      justify-content: space-between;
      margin-top: 0.25rem;
      font-size: 0.85rem;
      color: #aaa;
    }
    
    .result-preview {
      background-color: #333;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    
    .actions {
      display: flex;
      justify-content: center;
    }
    
    .submit-button {
      background-color: #4a6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: bold;
      transition: background-color 0.2s;
    }
    
    .submit-button:hover {
      background-color: #3a5;
    }
    
    .submit-button:disabled {
      background-color: #666;
      cursor: not-allowed;
    }
  </style>