/* app.js */

import { loadSettings } from './settingsManager.js';
import { setupEventListeners } from './eventListeners.js';
import { setupGlobalModalCloseListeners } from './modalManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initial load of settings
    loadSettings();
    // Setup all event listeners
    setupEventListeners();
    // Setup global modal close listeners
    setupGlobalModalCloseListeners();
});
