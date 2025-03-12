import { writable } from 'svelte/store';

// Default settings
const defaultSettings = {
  geminiApiKey: '',
  theme: 'dark',
  fontSize: 'medium',
  soundEffects: true,
  diceAnimations: true,
  autoSave: true, // Enable autosave by default
  autoSaveInterval: 5, // minutes
  maxContextLength: 10000,
  debugMode: false,
  studyMode: true // Study mode enabled by default
};

// Initialize with defaults or load from localStorage if available
let initialSettings = { ...defaultSettings };

// If in browser environment, try to load saved settings
if (typeof window !== 'undefined') {
  try {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Merge saved settings with defaults (in case new settings were added)
      initialSettings = { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage:', e);
  }
}

// Create writable store
export const settings = writable(initialSettings);

// Helper function to update a setting
export const updateSetting = (key, value) => {
  settings.update(state => {
    const newState = { ...state, [key]: value };
    saveToStorage(newState);
    return newState;
  });
};

// Helper function to toggle a boolean setting
export const toggleSetting = (key) => {
  settings.update(state => {
    const newState = { ...state, [key]: !state[key] };
    saveToStorage(newState);
    return newState;
  });
};

// Helper function to reset all settings to defaults
export const resetSettings = () => {
  settings.set(defaultSettings);
  saveToStorage(defaultSettings);
};

// Helper function to save settings to localStorage
function saveToStorage(settingsObj) {
  if (typeof window !== 'undefined') {
    try {
      // Create a copy of settings without sensitive data
      const sanitizedSettings = { ...settingsObj };
      
      // Don't save API key to localStorage for security
      delete sanitizedSettings.geminiApiKey;
      
      // Save the sanitized settings
      localStorage.setItem('app-settings', JSON.stringify(sanitizedSettings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }
}

// If using electron-store, sync settings changes with it
if (typeof window !== 'undefined' && window.api) {
  settings.subscribe(async ($settings) => {
    // Only update API key if it's set and different from what's already saved
    if ($settings.geminiApiKey) {
      const currentApiKey = await window.api.getApiKey();
      if (currentApiKey !== $settings.geminiApiKey) {
        window.api.setApiKey($settings.geminiApiKey);
      }
    }
    
    // Save all settings to localStorage
    saveToStorage($settings);
  });
}