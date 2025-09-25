// modalManager.js
// Handles opening, closing, and managing modal windows.

import { elements } from './domElements.js';
import { loadSettings } from './settingsManager.js';

export function openSettingsModal() {
    loadSettings(); // Load current settings into the modal form
    elements.settingsModal.style.display = 'flex';
}

export function closeSettingsModal() {
    elements.settingsModal.style.display = 'none';
}

export function openHelpModal() {
    elements.helpModal.style.display = 'flex';
    showHelpTab('quickstart'); // Show quickstart by default
}

export function closeHelpModal() {
    elements.helpModal.style.display = 'none';
}

export function showHelpTab(tabId) {
    elements.helpTabs.forEach(tab => {
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    elements.helpContents.forEach(content => {
        if (content.id === `${tabId}Tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

export function setupGlobalModalCloseListeners() {
    // Close modals if user clicks outside
    window.addEventListener('click', (event) => {
        if (event.target === elements.settingsModal) {
            closeSettingsModal();
        }
        if (event.target === elements.helpModal) {
            closeHelpModal();
        }
        if (event.target === elements.progressModal) {
            // Allow clicking outside progress modal to close it, but also hide overlay
            elements.progressModal.style.display = 'none';
        }
    });
}