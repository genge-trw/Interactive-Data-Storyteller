// settingsManager.js
// Handles application settings, themes, and API key management

import { elements } from './domElements.js';
import { showNotification } from './utils.js';

export let appSettings = {};

const themesConfig = {
    'light': {
        '--color-primary': '#4285F4',
        '--color-secondary': '#34A853',
        '--color-accent': '#FBBC04',
        '--color-danger': '#EA4335',
        '--color-text-dark': '#202124',
        '--color-text-light': '#e8eaed',
        '--color-background-light': '#f8f9fa',
        '--color-background-dark': '#202124',
        '--color-card-light': '#ffffff',
        '--color-card-dark': '#2c2c2c',
        '--color-border-light': '#dadce0',
        '--color-border-dark': '#5f6368',
        '--color-shadow-light': 'rgba(0, 0, 0, 0.08)',
        '--color-shadow-dark': 'rgba(0, 0, 0, 0.3)',
    },
    'dark': {
        '--color-primary': '#8ab4f8',
        '--color-secondary': '#a8da8d',
        '--color-accent': '#fcd667',
        '--color-danger': '#f28b82',
        '--color-text-dark': '#e8eaed',
        '--color-text-light': '#202124',
        '--color-background-light': '#202124',
        '--color-background-dark': '#f8f9fa',
        '--color-card-light': '#2c2c2c',
        '--color-card-dark': '#ffffff',
        '--color-border-light': '#5f6368',
        '--color-border-dark': '#dadce0',
        '--color-shadow-light': 'rgba(0, 0, 0, 0.3)',
        '--color-shadow-dark': 'rgba(0, 0, 0, 0.08)',
    },
    'blue': {
        '--color-primary': '#1976D2',
        '--color-secondary': '#42A5F5',
        '--color-accent': '#90CAF9',
        '--color-danger': '#FF5252',
        '--color-text-dark': '#212121',
        '--color-text-light': '#E3F2FD',
        '--color-background-light': '#E3F2FD',
        '--color-background-dark': '#0D47A1',
        '--color-card-light': '#FFFFFF',
        '--color-card-dark': '#1565C0',
        '--color-border-light': '#BBDEFB',
        '--color-border-dark': '#1976D2',
        '--color-shadow-light': 'rgba(0, 0, 0, 0.08)',
        '--color-shadow-dark': 'rgba(0, 0, 0, 0.3)',
    },
    'green': {
        '--color-primary': '#388E3C',
        '--color-secondary': '#66BB6A',
        '--color-accent': '#A5D6A7',
        '--color-danger': '#FF5252',
        '--color-text-dark': '#212121',
        '--color-text-light': '#E8F5E9',
        '--color-background-light': '#E8F5E9',
        '--color-background-dark': '#1B5E20',
        '--color-card-light': '#FFFFFF',
        '--color-card-dark': '#2E7D32',
        '--color-border-light': '#C8E6C9',
        '--color-border-dark': '#388E3C',
        '--color-shadow-light': 'rgba(0, 0, 0, 0.08)',
        '--color-shadow-dark': 'rgba(0, 0, 0, 0.08)',
    }
};

export function applyTheme(themeName) {
    const root = document.documentElement;
    const selectedTheme = themesConfig[themeName] || themesConfig['light']; // Fallback to light

    for (const [property, value] of Object.entries(selectedTheme)) {
        root.style.setProperty(property, value);
    }
    document.body.className = `${themeName}-theme`; // Apply class for body-specific styles
    localStorage.setItem('selectedTheme', themeName); // Save preference
}

export function getDefaultSettings() {
    return {
        // WARNING: Storing API keys directly in client-side localStorage is not recommended for production applications.
        // For a more secure solution, consider using a backend proxy to handle API calls.
        geminiApiKey: 'AIzaSyBxMyl4vkmV3MUoAc_sOrhdB9aI3AMe9DM',
        theme: 'light',
        autoProcess: false,
        validateData: true,
        animateCharts: true,
        highContrast: false,
        autoAnalyze: false,
        maxTokens: '2000',
        showNotifications: true,
        compactMode: false,
    };
}

export function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    appSettings = { ...getDefaultSettings(), ...savedSettings };

    // Apply settings to UI elements
    elements.apiKeyInput.value = appSettings.geminiApiKey || '';
    elements.themeSelect.value = appSettings.theme;
    elements.settingAutoProcessCheckbox.checked = appSettings.autoProcess;
    elements.settingValidateDataCheckbox.checked = appSettings.validateData;
    elements.settingAnimateChartsCheckbox.checked = appSettings.animateCharts;
    elements.settingHighContrastCheckbox.checked = appSettings.highContrast;
    elements.settingAutoAnalyzeCheckbox.checked = appSettings.autoAnalyze;
    elements.settingMaxTokensSelect.value = appSettings.maxTokens;
    elements.settingNotificationsCheckbox.checked = appSettings.showNotifications;
    elements.settingCompactModeCheckbox.checked = appSettings.compactMode;

    applyTheme(appSettings.theme);
}

export function saveSettings() {
    appSettings.geminiApiKey = elements.apiKeyInput.value.trim();
    appSettings.theme = elements.themeSelect.value;
    appSettings.autoProcess = elements.settingAutoProcessCheckbox.checked;
    appSettings.validateData = elements.settingValidateDataCheckbox.checked;
    appSettings.animateCharts = elements.settingAnimateChartsCheckbox.checked;
    appSettings.highContrast = elements.settingHighContrastCheckbox.checked;
    appSettings.autoAnalyze = elements.settingAutoAnalyzeCheckbox.checked;
    appSettings.maxTokens = elements.settingMaxTokensSelect.value;
    appSettings.showNotifications = elements.settingNotificationsCheckbox.checked;
    appSettings.compactMode = elements.settingCompactModeCheckbox.checked;

    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    showNotification('Settings saved!', 'success');
    applyTheme(appSettings.theme); // Re-apply theme in case it changed
}

export function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        appSettings = getDefaultSettings();
        saveSettings(); // Save defaults
        loadSettings(); // Apply defaults to UI
        showNotification('Settings reset to default.', 'info');
    }
}
