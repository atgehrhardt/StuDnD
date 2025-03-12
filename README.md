# DnD Learning Companion

A desktop application using Electron and Svelte for playing DnD 5e with an LLM-based Game Master. This application uses Google's Gemini Flash 2 model to provide an interactive DnD experience where dice rolls are influenced by study checks, encouraging learning while playing.

## Features

- **LLM-powered Game Master**: Dynamic storytelling and game management using Google Gemini Flash 2
- **Study-based Dice Mechanics**: Enhance dice rolls by completing study questions
- **Character Management**: Create and manage DnD 5e characters
- **Game State Tracking**: Keep track of your adventure progress, inventory, and more
- **Cross-platform**: Works on Windows, macOS (Intel & Apple Silicon), and Linux

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (v8 or later)
- [Google Gemini API key](https://ai.google.dev/)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/dnd-learning-companion.git
   cd dnd-learning-companion
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development version
   ```bash
   npm run dev
   ```

4. Build for your platform
   ```bash
   # For all platforms
   npm run dist
   
   # For specific platforms
   npm run dist:mac    # macOS (universal for both Intel and Apple Silicon)
   npm run dist:win    # Windows
   npm run dist:linux  # Linux
   ```

## How to Use

1. **First Launch**:
   - When you first launch the app, you'll be prompted to enter your Google Gemini API key
   - You can get a key from [Google AI Studio](https://ai.google.dev/)

2. **Creating a Character**:
   - Go to the Character tab
   - Fill in your character details
   - Save the character

3. **Starting a Game**:
   - After creating a character, click "Start New Game"
   - The LLM-based GM will introduce the campaign

4. **Playing the Game**:
   - Interact with the GM through the chat interface
   - When prompted to make a dice roll, use the dice roller
   - Complete study checks for each roll (answer questions from your study materials)
   - Your roll results will be modified based on how many questions you answer correctly

5. **Saving and Loading**:
   - Use the Save/Load buttons in the header to save your progress
   - You can resume your adventure later by loading a saved game

## How Study Checks Work

1. When you need to roll a die (e.g., d20 for an attack), the GM will request the roll
2. Click the corresponding die in the dice roller
3. A study check will appear, asking you to answer questions
4. The number of questions equals half the maximum value of the die (e.g., 10 questions for a d20)
5. Enter how many questions you answered correctly
6. The maximum possible roll is reduced by the number of questions you got wrong
7. For example, with a d20, if you answer 7 out of 10 questions correctly, your maximum roll becomes 17 instead of 20

## Development

- The application is built with Electron for the desktop framework
- The UI is built with Svelte
- State management is handled via Svelte stores
- The Google Gemini API is used for the LLM-based GM

### Project Structure

```
dnd-learning-companion/
├── main.js                   # Electron main process
├── preload.js                # Preload script for secure IPC
├── src/
│   ├── App.svelte            # Main Svelte component
│   ├── main.js               # Svelte entry point
│   ├── components/           # UI components
│   ├── stores/               # State management
│   └── lib/                  # Utility functions, API integration
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.