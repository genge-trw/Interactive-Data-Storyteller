// eventListeners.js
// Centralized event listener registrations

import { elements } from './domElements.js';
import { showNotification, htmlToMarkdown, downloadFile } from './utils.js';
import { processData, getParsedData, resetDataState, handleFileUpload } from './dataHandler.js';
import { loadSettings, saveSettings, resetSettings, applyTheme, appSettings } from './settingsManager.js';
import { callGeminiAPI, analyzeData, generateStory } from './aiService.js';
import { updateChart, exportChart } from './chartManager.js';
import { openSettingsModal, closeSettingsModal, openHelpModal, closeHelpModal, showHelpTab, setupGlobalModalCloseListeners } from './modalManager.js';
import { exportData, exportReport, shareReport } from './exportManager.js';

export function setupEventListeners() {
    elements.themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    elements.apiKeyInput.addEventListener('change', () => {
        appSettings.geminiApiKey = elements.apiKeyInput.value.trim();
        saveSettings();
    });
    elements.testApiBtn.addEventListener('click', async () => {
        showLoadingOverlay('Testing API', 'Checking connection to Gemini API...');
        const testPrompt = 'Hello';
        const response = await callGeminiAPI(testPrompt, 'neutral');
        if (response) {
            showNotification('API Test Successful!', 'success');
        } else {
            showNotification('API Test Failed. Check console for details.', 'error');
        }
        hideLoadingOverlay();
    });

    elements.settingsBtn.addEventListener('click', openSettingsModal);
    elements.closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);

    elements.helpBtn.addEventListener('click', openHelpModal);
    elements.closeHelpModalBtn.addEventListener('click', closeHelpModal);
    elements.helpTabs.forEach(tab => {
        tab.addEventListener('click', () => showHelpTab(tab.dataset.tab));
    });

    setupGlobalModalCloseListeners();

    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('drag-over');
    });

    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.classList.remove('drag-over');
    });

    elements.dropZone.addEventListener('drop', (e) => handleFileUpload(e.dataTransfer.files[0], e));
    elements.fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0], e));

    elements.processDataBtn.addEventListener('click', processData);
    elements.clearAllBtn.addEventListener('click', resetDataState);

    elements.updateChartBtn.addEventListener('click', updateChart);

    elements.analyzeBtn.addEventListener('click', analyzeData);
    elements.generateStoryBtn.addEventListener('click', generateStory);

    elements.copyResponseBtn.addEventListener('click', () => {
        if (elements.aiResponseContent.textContent) {
            navigator.clipboard.writeText(elements.aiResponseContent.textContent).then(() => {
                showNotification('Response copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy text:', err);
                showNotification('Failed to copy response.', 'error');
            });
        } else {
            showNotification('No content to copy.', 'warning');
        }
    });

    elements.regenerateBtn.addEventListener('click', () => {
        // Re-run the last analysis or story generation
        const currentAnalysisType = elements.analysisTypeSelect.value;
        if (currentAnalysisType === 'story') {
            generateStory();
        } else {
            analyzeData();
        }
    });

    elements.exportChartBtn.addEventListener('click', exportChart);
    elements.exportCsvBtn.addEventListener('click', () => exportData('csv'));
    elements.exportJsonBtn.addEventListener('click', () => exportData('json'));
    elements.exportExcelBtn.addEventListener('click', () => exportData('excel'));
    elements.exportReportBtn.addEventListener('click', exportReport);
    elements.shareReportBtn.addEventListener('click', shareReport);

    elements.analysisTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            elements.customQuestionGroup.style.display = 'block';
        } else {
            elements.customQuestionGroup.style.display = 'none';
        }
    });
}