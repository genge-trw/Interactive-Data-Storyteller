// eventListeners.js
// Centralized event listener registrations

import { elements } from './domElements.js';
import { showNotification, readFileAsBinaryString, htmlToMarkdown, downloadFile } from './utils.js';
import { processData, displayDataOverview, renderDataTable, populateChartSelectors, validateData, displayValidationReport, getParsedData } from './dataHandler.js';
import { loadSettings, saveSettings, resetSettings, applyTheme, appSettings } from './settingsManager.js';
import { callGeminiAPI, analyzeData, generateStory } from './aiService.js';
import { updateChart, exportChart, currentChart } from './chartManager.js';

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

    // Close modals if user clicks outside
    window.addEventListener('click', (event) => {
        if (event.target === elements.settingsModal) {
            closeSettingsModal();
        }
        if (event.target === elements.helpModal) {
            closeHelpModal();
        }
        if (event.target === elements.progressModal) { // Allow clicking outside progress modal to close it
            hideLoadingOverlay();
        }
    });

    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('drag-over');
    });

    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.classList.remove('drag-over');
    });

    elements.dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            // Check file type (basic)
            if (file.type.match('text/csv') || file.type.match('text/plain') || file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    showNotification('Excel file detected. Processing...', 'info');
                    // Placeholder for Excel processing
                    showLoadingOverlay('Processing Excel', 'Converting Excel to CSV format...');
                    try {
                        const data = await readFileAsBinaryString(file);
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
                        elements.dataTextarea.value = csv;
                        showNotification('Excel file converted to CSV in textarea.', 'success');
                    } catch (excelError) {
                        showNotification(`Error processing Excel file: ${excelError.message}`, 'error');
                        console.error('Excel processing error:', excelError);
                    } finally {
                        hideLoadingOverlay();
                    }
                } else {
                    const fileContent = await file.text();
                    elements.dataTextarea.value = fileContent;
                    showNotification('File loaded into textarea.', 'success');
                }

                if (appSettings.autoProcess) {
                    processData();
                }
            } else {
                showNotification('Unsupported file type. Please upload CSV, Excel, or plain text.', 'error');
            }
        }
    });

    elements.fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                showNotification('Excel file detected. Processing...', 'info');
                showLoadingOverlay('Processing Excel', 'Converting Excel to CSV format...');
                try {
                    const data = await readFileAsBinaryString(file);
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
                    elements.dataTextarea.value = csv;
                    showNotification('Excel file converted to CSV in textarea.', 'success');
                } catch (excelError) {
                    showNotification(`Error processing Excel file: ${excelError.message}`, 'error');
                    console.error('Excel processing error:', excelError);
                } finally {
                    hideLoadingOverlay();
                }
            } else {
                const fileContent = await file.text();
                elements.dataTextarea.value = fileContent;
                showNotification('File loaded into textarea.', 'success');
            }

            if (appSettings.autoProcess) {
                processData();
            }
        }
    });

    elements.processDataBtn.addEventListener('click', processData);
    elements.clearAllBtn.addEventListener('click', () => {
        elements.dataTextarea.value = '';
        // Reset parsedData in dataHandler
        // parsedData = null; // This needs to be handled by dataHandler
        // currentChart = null; // This needs to be handled by chartManager
        elements.rowCountSpan.textContent = '0';
        elements.columnCountSpan.textContent = '0';
        elements.numericColumnsSpan.textContent = '0';
        elements.missingValuesSpan.textContent = '0';
        elements.qualityIndicatorsDiv.innerHTML = '';
        elements.dataQualityDiv.style.display = 'none';
        elements.aiCleaningSuggestions.style.display = 'none';
        elements.cleaningSuggestionsList.innerHTML = '';
        elements.dataPreviewTable.style.display = 'none';
        elements.noDataMessage.style.display = 'block';
        elements.tableHead.innerHTML = '';
        elements.tableBody.innerHTML = '';
        elements.xAxisSelect.innerHTML = '';
        elements.yAxisSelect.innerHTML = '';
        elements.chartTitleInput.value = '';
        elements.mainChartCanvas.style.display = 'none';
        elements.chartPlaceholder.style.display = 'block';
        elements.aiResponseArea.style.display = 'none';
        elements.aiResponseContent.innerHTML = '';
        elements.apiStatusIndicator.classList.remove('status-connected', 'status-disconnected');
        elements.apiStatusIndicator.classList.add('status-disconnected');
        elements.apiStatusText.textContent = 'API Not Connected';
        showNotification('All cleared!', 'info');
    });

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

    // Helper functions for modals (could be moved to a separate modalManager.js if more complex)
    function openSettingsModal() {
        loadSettings(); // Load current settings into the modal form
        elements.settingsModal.style.display = 'flex';
    }

    function closeSettingsModal() {
        elements.settingsModal.style.display = 'none';
    }

    function openHelpModal() {
        elements.helpModal.style.display = 'flex';
        showHelpTab('quickstart'); // Show quickstart by default
    }

    function closeHelpModal() {
        elements.helpModal.style.display = 'none';
    }

    function showHelpTab(tabId) {
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

    // Export functions (could be moved to a separate exportManager.js if more complex)
    function exportData(format) {
        const parsedData = getParsedData();
        if (!parsedData || !parsedData.data || parsedData.data.length === 0) {
            showNotification('No data to export.', 'warning');
            return;
        }

        let content = '';
        let filename = 'data';
        let type = '';

        switch (format) {
            case 'csv':
                content = Papa.unparse(parsedData.data);
                filename += '.csv';
                type = 'text/csv;charset=utf-8;';
                break;
            case 'json':
                content = JSON.stringify(parsedData.data, null, 2);
                filename += '.json';
                type = 'application/json;charset=utf-8;';
                break;
            case 'excel':
                // This is a simplified example. Real Excel export is complex.
                // For actual Excel export, you'd typically use a library like SheetJS (XLSX.js)
                // For now, we'll export as CSV with an .xls extension as a workaround.
                content = Papa.unparse(parsedData.data);
                filename += '.xls'; // Or .xlsx if using a full library
                type = 'application/vnd.ms-excel'; // Or 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                showNotification('Exporting as basic Excel (CSV format). For full Excel features, a dedicated library is needed.', 'info', 5000);
                break;
            default:
                showNotification('Unsupported export format.', 'error');
                return;
        }

        downloadFile(content, filename, type);
        showNotification(`Data exported as ${format.toUpperCase()}.`, 'success');
    }

    async function exportReport() {
        showLoadingOverlay('Generating Report', 'Compiling data, charts, and AI insights...');
        const parsedData = getParsedData();

        let reportContent = `# Data Storyteller Report\n\n`;
        reportContent += `## 1. Raw Data Preview\n\n`;
        reportContent += `\`\`\`csv\n${elements.dataTextarea.value.substring(0, 1000)}...\n\`\`\`\n\n`; // Limit raw data

        reportContent += `## 2. Data Overview\n\n`;
        reportContent += `* Total Rows: ${elements.rowCountSpan.textContent}\n`;
        reportContent += `* Total Columns: ${elements.columnCountSpan.textContent}\n`;
        reportContent += `* Numeric Columns: ${elements.numericColumnsSpan.textContent}\n`;
        reportContent += `* Missing Values: ${elements.missingValuesSpan.textContent}\n\n`;

        if (elements.qualityIndicatorsDiv.innerHTML !== '') {
            reportContent += `### Data Quality Report\n\n`;
            reportContent += elements.qualityIndicatorsDiv.innerText.replace(/\n\n/g, '\n') + '\n\n'; // Basic conversion
        }

        reportContent += `## 3. Visualizations

`;
        if (currentChart) {
            try {
                const canvas = await html2canvas(elements.mainChartCanvas);
                const imageDataURL = canvas.toDataURL('image/png');
                reportContent += `![Chart: ${elements.chartTitleInput.value || 'Data Chart'}](${imageDataURL})\n\n`;
            } catch (error) {
                console.error('Error capturing chart for report:', error);
                reportContent += `<!-- Error embedding chart: ${error.message} -->\n`;
                reportContent += `No chart image embedded due to an error. Please export chart separately if needed.\n\n`;
            }
        } else {
            reportContent += `No chart generated.\n\n`;
        }

        reportContent += `## 4. AI Insights & Storytelling\n\n`;
        if (elements.aiResponseContent.innerHTML !== '') {
            reportContent += `### ${elements.responseTitle.textContent}\n\n`;
            reportContent += htmlToMarkdown(elements.aiResponseContent.innerHTML) + '\n\n';
        } else {
            reportContent += `No AI analysis or story generated.\n\n`;
        }

        const filename = `data_report_${dayjs().format('YYYY-MM-DD')}.md`;
        downloadFile(reportContent, filename, 'text/markdown');
        hideLoadingOverlay();
        showNotification('Full report generated as Markdown.', 'success');
    }

    function shareReport() {
        showNotification('Share functionality is not yet implemented.', 'info');
        // In a real application, this would involve backend integration
        // to save the report and generate a shareable URL.
    }
}
