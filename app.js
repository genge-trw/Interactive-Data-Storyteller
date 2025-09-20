/* app.js */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loadingOverlay = document.getElementById('loadingOverlay');
    const notificationContainer = document.getElementById('notificationContainer');

    const themeSelect = document.getElementById('themeSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const testApiBtn = document.getElementById('testApiBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const helpBtn = document.getElementById('helpBtn');

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const dataTextarea = document.getElementById('dataTextarea');
    const delimiterSelect = document.getElementById('delimiterSelect');
    const hasHeadersCheckbox = document.getElementById('hasHeadersCheckbox');
    const autoProcessCheckbox = document.getElementById('autoProcessCheckbox');
    const processDataBtn = document.getElementById('processDataBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    const rowCountSpan = document.getElementById('rowCount');
    const columnCountSpan = document.getElementById('columnCount');
    const numericColumnsSpan = document.getElementById('numericColumns');
    const missingValuesSpan = document.getElementById('missingValues');
    const dataQualityDiv = document.getElementById('dataQuality');
    const qualityIndicatorsDiv = document.getElementById('qualityIndicators');
    const dataPreviewTable = document.getElementById('dataPreviewTable');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const noDataMessage = document.getElementById('noDataMessage');

    const exportChartBtn = document.getElementById('exportChartBtn');
    const chartTypeSelect = document.getElementById('chartTypeSelect');
    const xAxisSelect = document.getElementById('xAxisSelect');
    const yAxisSelect = document.getElementById('yAxisSelect');
    const chartTitleInput = document.getElementById('chartTitleInput');
    const colorSchemeSelect = document.getElementById('colorSchemeSelect');
    const updateChartBtn = document.getElementById('updateChartBtn');
    const mainChartCanvas = document.getElementById('mainChart');
    const heatmapContainer = document.getElementById('heatmapContainer');
    const chartPlaceholder = document.getElementById('chartPlaceholder');

    const apiStatusIndicator = document.querySelector('#apiStatus .status-indicator');
    const apiStatusText = document.querySelector('#apiStatus .status-text');
    const analysisTypeSelect = document.getElementById('analysisTypeSelect');
    const customQuestionGroup = document.getElementById('customQuestionGroup');
    const customQuestionTextarea = document.getElementById('customQuestion');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const generateStoryBtn = document.getElementById('generateStoryBtn');
    const exportAnalysisBtn = document.getElementById('exportAnalysisBtn');
    const aiResponseArea = document.getElementById('aiResponseArea');
    const responseTitle = document.getElementById('responseTitle');
    const aiResponseContent = document.getElementById('aiResponse');
    const copyResponseBtn = document.getElementById('copyResponseBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');

    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportPngBtn = document.getElementById('exportPngBtn');
    const exportSvgBtn = document.getElementById('exportSvgBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const shareReportBtn = document.getElementById('shareReportBtn');

    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModal');
    const settingAutoProcessCheckbox = document.getElementById('settingAutoProcess');
    const settingValidateDataCheckbox = document.getElementById('settingValidateData');
    const settingAnimateChartsCheckbox = document.getElementById('settingAnimateCharts');
    const settingHighContrastCheckbox = document.getElementById('settingHighContrast');
    const settingAutoAnalyzeCheckbox = document.getElementById('settingAutoAnalyze');
    const settingMaxTokensSelect = document.getElementById('settingMaxTokens');
    const settingNotificationsCheckbox = document.getElementById('settingNotifications');
    const settingCompactModeCheckbox = document.getElementById('settingCompactMode');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    const helpModal = document.getElementById('helpModal');
    const closeHelpModalBtn = document.getElementById('closeHelpModal');
    const helpTabs = document.querySelectorAll('.help-tab');
    const helpContents = document.querySelectorAll('.help-content');

    const progressModal = document.getElementById('progressModal');
    const progressTitle = document.getElementById('progressTitle');
    const progressMessage = document.getElementById('progressMessage');
    const progressFill = document.getElementById('progressFill');

    // --- Global Variables ---
    let parsedData = null;
    let currentChart = null;
    let appSettings = {};
    const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1/models/';
    const API_MODEL = 'gemini-pro'; // Or gemini-1.5-pro-latest, etc.

    // --- Helper Functions ---

    function showLoadingOverlay(title = 'Processing...', message = 'Please wait...') {
        progressTitle.textContent = title;
        progressMessage.textContent = message;
        progressFill.style.width = '0%';
        progressModal.style.display = 'flex';
    }

    function hideLoadingOverlay() {
        progressModal.style.display = 'none';
    }

    function updateProgressBar(percentage) {
        progressFill.style.width = `${percentage}%`;
    }

    function showNotification(message, type = 'info', duration = 3000) {
        if (!appSettings.showNotifications) return;
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;
        notificationContainer.appendChild(notification);

        // Trigger reflow to enable transition
        void notification.offsetWidth;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, duration);
    }

    // Function to generate a structured summary of the parsed data
    function generateStructuredSummary(data) {
        if (!data || !data.headers || !data.data || data.data.length === 0) {
            return "No data available for summary.";
        }

        let summary = `Data Summary:\n`;
        summary += `Total Rows: ${data.data.length}\n`;
        summary += `Total Columns: ${data.headers.length}\n`;
        summary += `Headers: ${data.headers.join(', ')}\n\n`;

        data.headers.forEach(header => {
            const columnValues = data.data.map(row => row[header]);
            const nonNullValues = columnValues.filter(v => v !== null && v !== undefined && v !== '');

            if (nonNullValues.length === 0) {
                summary += `Column '${header}': (Empty)\n`;
                return;
            }

            // Attempt to determine type and statistics
            const isNumeric = nonNullValues.every(v => !isNaN(parseFloat(v)) && isFinite(v));
            const isDate = nonNullValues.every(v => isDateLike(v));

            if (isNumeric) {
                const numbers = nonNullValues.map(Number);
                const min = Math.min(...numbers);
                const max = Math.max(...numbers);
                const avg = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
                summary += `Column '${header}': Numeric (Min: ${min.toFixed(2)}, Max: ${max.toFixed(2)}, Avg: ${avg.toFixed(2)})\n`;
            } else if (isDate) {
                const dates = nonNullValues.map(v => new Date(v));
                const minDate = new Date(Math.min(...dates));
                const maxDate = new Date(Math.max(...dates));
                summary += `Column '${header}': Date (Range: ${minDate.toISOString().slice(0, 10)} to ${maxDate.toISOString().slice(0, 10)})\n`;
            } else {
                const uniqueValues = [...new Set(nonNullValues)];
                const uniqueCount = uniqueValues.length;
                const sampleValues = uniqueValues.slice(0, 5).join(', '); // Show up to 5 unique values
                summary += `Column '${header}': Categorical (${uniqueCount} unique values. Sample: ${sampleValues}${uniqueCount > 5 ? '...' : ''})\n`;
            }
        });

        return summary;
    }

    async function callGeminiAPI(promptContent, persona = 'neutral') {
        if (!appSettings.geminiApiKey || appSettings.geminiApiKey === 'YOUR_GEMINI_API_KEY') {
            showNotification('Gemini API Key is not configured. Please set it in settings.', 'error');
            apiStatusIndicator.classList.remove('status-connected');
            apiStatusIndicator.classList.add('status-disconnected');
            apiStatusText.textContent = 'API Not Connected';
            return null;
        }

        apiStatusIndicator.classList.remove('status-disconnected');
        apiStatusIndicator.classList.add('status-connected');
        apiStatusText.textContent = 'API Connected';

        showLoadingOverlay('AI Thinking', 'Generating response...');

        try {
            const response = await fetch(API_BASE_URL + API_MODEL + '?key=' + appSettings.geminiApiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `As a ${persona} AI, ${promptContent}`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: parseInt(appSettings.maxTokens)
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API error:', errorData);
                showNotification(`Gemini API Error: ${errorData.error.message || 'Unknown API error'}`, 'error', 5000);
                apiStatusIndicator.classList.remove('status-connected');
                apiStatusIndicator.classList.add('status-disconnected');
                apiStatusText.textContent = 'API Error';
                hideLoadingOverlay();
                return null;
            }

            const data = await response.json();
            hideLoadingOverlay();
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            showNotification(`Error calling Gemini API: ${error.message || 'An unexpected error occurred.'}`, 'error', 5000);
            apiStatusIndicator.classList.remove('status-connected');
            apiStatusIndicator.classList.add('status-disconnected');
            apiStatusText.textContent = 'API Error';
            hideLoadingOverlay();
            return null;
        }
    }

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
            '--color-shadow-dark': 'rgba(0, 0, 0, 0.3)',
        }
    };

    function applyTheme(themeName) {
        const root = document.documentElement;
        const selectedTheme = themesConfig[themeName] || themesConfig['light']; // Fallback to light

        for (const [property, value] of Object.entries(selectedTheme)) {
            root.style.setProperty(property, value);
        }
        document.body.className = `${themeName}-theme`; // Apply class for body-specific styles
        localStorage.setItem('selectedTheme', themeName); // Save preference
    }

    function isDateLike(value) {
        if (typeof value !== 'string') return false;
        return /^\d{4}-\d{2}(-\d{2})?$/.test(value);
    }

    function htmlToMarkdown(html) {
        let markdown = html;
        markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n');
        markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n');
        markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
        markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
        markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
        markdown = markdown.replace(/<br\s*\/?>/g, '\n');
        markdown = markdown.replace(/<[^>]*>/g, '');
        markdown = markdown.replace(/\n\s*\n/g, '\n\n').trim();
        return markdown;
    }

    // --- Data Processing & Validation ---
    const dataWorker = new Worker('dataProcessor.js');

    dataWorker.onmessage = async function(e) {
        const { status, parsedData: workerParsedData, message, errors, error } = e.data;

        if (status === 'success') {
            parsedData = workerParsedData;
            displayDataOverview(parsedData);
            renderDataTable(parsedData);
            populateChartSelectors(parsedData.headers);
            showNotification('Data processed successfully!', 'success');
            
            // Perform data validation after successful parsing
            if (appSettings.validateData) {
                const validationReport = validateData(parsedData);
                displayValidationReport(validationReport);
            }

            if (appSettings.autoAnalyze) {
                analyzeData();
            }

        } else if (status === 'error') {
            const errorMessage = `Error processing data: ${message || 'Unknown error'}. Details: ${JSON.stringify(errors || error)}`;
            showNotification(errorMessage, 'error', 5000);
            console.error('Web Worker Error:', errors || error);
        }
        hideLoadingOverlay();
    };

    function processData() {
        showLoadingOverlay('Processing Data', 'Parsing and validating your dataset...');
        const dataToProcess = dataTextarea.value.trim();
        const selectedDelimiter = delimiterSelect.value;
        const hasHeaders = hasHeadersCheckbox.checked;

        if (!dataToProcess) {
            hideLoadingOverlay();
            showNotification('Please paste or upload data to process.', 'warning');
            return;
        }

        // Send data to Web Worker for parsing
        dataWorker.postMessage({ dataToProcess, selectedDelimiter, hasHeaders });
    }

    function displayDataOverview(data) {
        rowCountSpan.textContent = data.data.length;
        columnCountSpan.textContent = data.headers.length;

        let numericCols = 0;
        let missingValCount = 0;

        data.headers.forEach(header => {
            const columnValues = data.data.map(row => row[header]);
            const nonNullValues = columnValues.filter(v => v !== null && v !== undefined && v !== '');
            missingValCount += (columnValues.length - nonNullValues.length);

            const isNumeric = nonNullValues.every(v => !isNaN(parseFloat(v)) && isFinite(v));
            if (isNumeric) {
                numericCols++;
            }
        });

        numericColumnsSpan.textContent = numericCols;
        missingValuesSpan.textContent = missingValCount;
    }

    function renderDataTable(data) {
        if (!data || !data.headers || !data.data || data.data.length === 0) {
            dataPreviewTable.style.display = 'none';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';
        dataPreviewTable.style.display = 'table';

        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        let headerRow = '<tr>';
        data.headers.forEach(h => headerRow += `<th>${h}</th>`);
        headerRow += '</tr>';
        tableHead.innerHTML = headerRow;

        data.data.slice(0, 100).forEach(row => { // Display first 100 rows for preview
            let bodyRow = '<tr>';
            data.headers.forEach(h => bodyRow += `<td>${row[h] || ''}</td>`);
            bodyRow += '</tr>';
            tableBody.innerHTML += bodyRow;
        });
    }

    function populateChartSelectors(headers) {
        xAxisSelect.innerHTML = '';
        yAxisSelect.innerHTML = '';

        headers.forEach(h => {
            const optionX = document.createElement('option');
            optionX.value = h;
            optionX.textContent = h;
            xAxisSelect.appendChild(optionX);

            const optionY = document.createElement('option');
            optionY.value = h;
            optionY.textContent = h;
            yAxisSelect.appendChild(optionY);
        });

        // Attempt to pre-select sensible defaults
        if (headers.length > 0) xAxisSelect.value = headers[0];
        if (headers.length > 1) yAxisSelect.value = headers[1];
    }

    function validateData(data) {
        const report = {
            issues: [],
            suggestions: []
        };

        if (!data || !data.data || data.data.length === 0) {
            report.issues.push('No data available for validation.');
            return report;
        }

        // Check for missing values
        data.headers.forEach(header => {
            let missingCount = 0;
            data.data.forEach(row => {
                if (row[header] === null || row[header] === undefined || String(row[header]).trim() === '') {
                    missingCount++;
                }
            });
            if (missingCount > 0) {
                const percentage = ((missingCount / data.data.length) * 100).toFixed(1);
                report.issues.push(`Column '${header}' has ${missingCount} missing values (${percentage}%).`);
                report.suggestions.push(`Consider imputing missing values in '${header}' (e.g., with mean, median, or a constant) or filtering rows with missing data.`);
            }
        });

        // Check for inconsistent data types in numeric columns (basic check)
        data.headers.forEach(header => {
            const columnValues = data.data.map(row => row[header]);
            const nonNullValues = columnValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');

            if (nonNullValues.length > 0) {
                const firstValueIsNumeric = !isNaN(parseFloat(nonNullValues[0])) && isFinite(nonNullValues[0]);
                if (firstValueIsNumeric) {
                    const hasNonNumeric = nonNullValues.some(v => isNaN(parseFloat(v)) || !isFinite(v));
                    if (hasNonNumeric) {
                        report.issues.push(`Column '${header}' contains mixed data types (numeric and non-numeric).`);
                        report.suggestions.push(`Ensure all values in '${header}' are consistently numeric if intended for calculations or charting.`);
                    }
                }
            }
        });

        // Basic Outlier Detection (for numeric columns only)
        data.headers.forEach(header => {
            const columnValues = data.data.map(row => parseFloat(row[header])).filter(v => !isNaN(v) && isFinite(v));
            if (columnValues.length > 5) { // Need enough data points for outlier detection
                const q1 = percentile(columnValues, 25);
                const q3 = percentile(columnValues, 75);
                const iqr = q3 - q1;
                const lowerBound = q1 - 1.5 * iqr;
                const upperBound = q3 + 1.5 * iqr;

                const outliers = columnValues.filter(v => v < lowerBound || v > upperBound);
                if (outliers.length > 0) {
                    report.issues.push(`Column '${header}' has ${outliers.length} potential outliers.`);
                    report.suggestions.push(`Investigate outliers in '${header}' as they might skew analysis. Consider Winsorization or removal if appropriate.`);
                }
            }
        });

        return report;
    }

    function percentile(arr, p) {
        if (arr.length === 0) return 0;
        arr.sort((a, b) => a - b);
        const index = (p / 100) * (arr.length - 1);
        if (index % 1 === 0) {
            return arr[index];
        } else {
            const lower = arr[Math.floor(index)];
            const upper = arr[Math.ceil(index)];
            return lower + (upper - lower) * (index % 1);
        }
    }

    function displayValidationReport(report) {
        qualityIndicatorsDiv.innerHTML = '';
        if (report.issues.length > 0) {
            dataQualityDiv.style.display = 'block';
            report.issues.forEach((issue, index) => {
                const item = document.createElement('div');
                item.classList.add('quality-indicator-item', 'error'); // Use 'error' class for issues
                item.innerHTML = `<strong>Issue ${index + 1}:</strong> ${issue}<br><em>Suggestion: ${report.suggestions[index] || 'No specific suggestion.'}</em>`;
                qualityIndicatorsDiv.appendChild(item);
            });
        } else {
            dataQualityDiv.style.display = 'block';
            qualityIndicatorsDiv.innerHTML = '<div class="quality-indicator-item success">No major data quality issues detected.</div>';
        }
    }

    // --- Charting ---
    const CHART_COLORS = {
        default: ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#42b6f4', '#8e42f4', '#f442b6', '#f48e42'],
        viridis: ['#440154', '#482858', '#3e4989', '#31688e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b'],
        spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#e6f598', '#abdda4', '#66c2a5'],
        coolwarm: ['#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3']
    };

    function updateChart() {
        if (!parsedData || !parsedData.data || parsedData.data.length === 0) {
            showNotification('No data available to render chart.', 'warning');
            mainChartCanvas.style.display = 'none';
            heatmapContainer.style.display = 'none';
            chartPlaceholder.style.display = 'block';
            return;
        }

        const chartType = chartTypeSelect.value;
        const xAxisKey = xAxisSelect.value;
        const yAxisKey = yAxisSelect.value;
        const chartTitle = chartTitleInput.value;
        const colorScheme = colorSchemeSelect.value;
        const colors = CHART_COLORS[colorScheme] || CHART_COLORS.default;

        if (currentChart) {
            currentChart.destroy();
        }
        mainChartCanvas.style.display = 'block';
        heatmapContainer.style.display = 'none
        chartPlaceholder.style.display = 'none';

        const ctx = mainChartCanvas.getContext('2d');

        let labels = [];
        let dataValues = [];
        let datasets = [];
        let chartConfig = {};

        if (chartType === 'heatmap') {
            showNotification('Heatmap visualization is not yet fully implemented.', 'info');
            mainChartCanvas.style.display = 'none';
            heatmapContainer.style.display = 'block';
            heatmapContainer.innerHTML = '<p>Heatmap placeholder. Feature coming soon!</p>';
            return;
        }

        // Prepare data for Chart.js
        if (chartType === 'scatter') {
            const scatterData = parsedData.data.map(row => ({
                x: parseFloat(row[xAxisKey]),
                y: parseFloat(row[yAxisKey])
            })).filter(point => !isNaN(point.x) && !isNaN(point.y));

            datasets.push({
                label: `${yAxisKey} vs ${xAxisKey}`,
                data: scatterData,
                backgroundColor: colors[0],
                borderColor: colors[0],
                pointBackgroundColor: colors[0],
                pointBorderColor: colors[0],
                pointRadius: 5
            });

            chartConfig = {
                type: 'scatter',
                data: { datasets: datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: appSettings.animateCharts,
                    plugins: {
                        title: {
                            display: true,
                            text: chartTitle || `${yAxisKey} vs ${xAxisKey}`
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: { display: true, text: xAxisKey }
                        },
                        y: {
                            title: { display: true, text: yAxisKey }
                        }
                    }
                }
            };
        } else {
            // For bar, line, pie
            const groupedData = {};
            parsedData.data.forEach(row => {
                const category = row[xAxisKey];
                const value = parseFloat(row[yAxisKey]);
                if (!isNaN(value)) {
                    if (!groupedData[category]) {
                        groupedData[category] = 0;
                    }
                    groupedData[category] += value;
                }
            });

            labels = Object.keys(groupedData);
            dataValues = Object.values(groupedData);

            datasets.push({
                label: yAxisKey,
                data: dataValues,
                backgroundColor: chartType === 'pie' ? labels.map((_, i) => colors[i % colors.length]) : colors[0],
                borderColor: chartType === 'pie' ? labels.map((_, i) => colors[i % colors.length]) : colors[0],
                borderWidth: 1
            });

            chartConfig = {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: appSettings.animateCharts,
                    plugins: {
                        title: {
                            display: true,
                            text: chartTitle || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} of ${yAxisKey} by ${xAxisKey}`
                        },
                        legend: {
                            display: chartType === 'pie' ? true : false // Only show legend for pie charts by default
                        }
                    },
                    scales: {
                        x: {
                            display: chartType !== 'pie',
                            title: { display: true, text: xAxisKey }
                        },
                        y: {
                            display: chartType !== 'pie',
                            beginAtZero: true,
                            title: { display: true, text: yAxisKey }
                        }
                    }
                }
            };

            // Special handling for line chart with date-like x-axis
            if (chartType === 'line' && parsedData.data.length > 0 && isDateLike(parsedData.data[0][xAxisKey])) {
                chartConfig.options.scales.x = {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'MMM YYYY',
                        displayFormats: { month: 'MMM YYYY' }
                    },
                    title: { display: true, text: xAxisKey }
                };
            }
        }

        currentChart = new Chart(ctx, chartConfig);
        showNotification('Chart updated.', 'success');
    }

    // --- AI Analysis ---
    async function analyzeData() {
        if (!parsedData) {
            showNotification('Please process data first before analysis.', 'warning');
            return;
        }

        const analysisType = analysisTypeSelect.value;
        let prompt = '';
        let responseTitleText = '';

        const structuredSummary = generateStructuredSummary(parsedData);

        switch (analysisType) {
            case 'summary':
                prompt = `Provide a comprehensive summary of the following data, highlighting key statistics, trends, and potential insights. Data: ${structuredSummary}`;
                responseTitleText = 'Data Summary';
                break;
            case 'trends':
                prompt = `Analyze the following data for significant trends, patterns, or changes over time. Data: ${structuredSummary}`;
                responseTitleText = 'Trend Analysis';
                break;
            case 'anomalies':
                prompt = `Identify any anomalies, outliers, or unusual data points in the following dataset and explain their potential significance. Data: ${structuredSummary}`;
                responseTitleText = 'Anomaly Detection';
                break;
            case 'correlations':
                prompt = `Examine the relationships and correlations between different columns in the following data. Data: ${structuredSummary}`;
                responseTitleText = 'Correlation Analysis';
                break;
            case 'custom':
                const customQuestion = customQuestionTextarea.value.trim();
                if (!customQuestion) {
                    showNotification('Please enter your custom question.', 'warning');
                    return;
                }
                prompt = `Based on the following data, answer this question: "${customQuestion}". Data: ${structuredSummary}`;
                responseTitleText = 'Custom Analysis';
                break;
            default:
                prompt = `Analyze the following data. Data: ${structuredSummary}`;
                responseTitleText = 'AI Analysis';
        }

        const aiResponse = await callGeminiAPI(prompt, 'analyst'); // Use an 'analyst' persona

        if (aiResponse) {
            aiResponseArea.style.display = 'block';
            responseTitle.textContent = responseTitleText;
            aiResponseContent.innerHTML = `<p>${aiResponse.replace(/\n/g, '<br>')}</p>`;
            showNotification('AI analysis complete!', 'success');
        } else {
            showNotification('AI analysis failed. Please try again.', 'error');
        }
    }

    async function generateStory() {
        if (!parsedData) {
            showNotification('Please process data first to generate a story.', 'warning');
            return;
        }

        const structuredSummary = generateStructuredSummary(parsedData);
        const currentAnalysis = aiResponseContent.textContent; // Get current analysis if any

        let prompt = `Create a compelling data story based on the following information. Focus on narrative flow, engaging the reader, and explaining insights clearly.\n\n`;
        prompt += `Data Summary: ${structuredSummary}\n\n`;
        if (currentAnalysis && currentAnalysis !== '') {
            prompt += `Key Insights from Analysis: ${currentAnalysis}\n\n`;
        }
        prompt += `Please craft a narrative that is easy to understand and highlights the most important aspects of the data.`;

        const aiResponse = await callGeminiAPI(prompt, 'storyteller'); // Use a 'storyteller' persona

        if (aiResponse) {
            aiResponseArea.style.display = 'block';
            responseTitle.textContent = 'Generated Data Story';
            aiResponseContent.innerHTML = `<p>${aiResponse.replace(/\n/g, '<br>')}</p>`;
            showNotification('Data story generated!', 'success');
        } else {
            showNotification('Data story generation failed. Please try again.', 'error');
        }
    }

    // --- Export & Share ---
    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportData(format) {
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

    function exportChart() {
        if (!currentChart) {
            showNotification('No chart to export.', 'warning');
            return;
        }

        // Use html2canvas to capture the chart canvas
        html2canvas(mainChartCanvas).then(canvas => {
            const link = document.createElement('a');
            link.download = 'chart.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showNotification('Chart exported as PNG.', 'success');
        }).catch(err => {
            console.error('Error exporting chart:', err);
            showNotification('Failed to export chart.', 'error');
        });
    }

    async function exportReport() {
        showLoadingOverlay('Generating Report', 'Compiling data, charts, and AI insights...');

        let reportContent = `# Data Storyteller Report\n\n`;
        reportContent += `## 1. Raw Data Preview\n\n`;
        reportContent += ````csv\n${dataTextarea.value.substring(0, 1000)}...\n````\n\n`; // Limit raw data

        reportContent += `## 2. Data Overview\n\n`;
        reportContent += `* Total Rows: ${rowCountSpan.textContent}\n`;
        reportContent += `* Total Columns: ${columnCountSpan.textContent}\n`;
        reportContent += `* Numeric Columns: ${numericColumnsSpan.textContent}\n`;
        reportContent += `* Missing Values: ${missingValuesSpan.textContent}\n\n`;

        if (qualityIndicatorsDiv.innerHTML !== '') {
            reportContent += `### Data Quality Report\n\n`;
            reportContent += qualityIndicatorsDiv.innerText.replace(/\n\n/g, '\n') + '\n\n'; // Basic conversion
        }

        reportContent += `## 3. Visualizations\n\n`;
        if (currentChart) {
            // For charts, we can embed a base64 image or just note its presence
            reportContent += `![Chart: ${chartTitleInput.value || 'Data Chart'}](chart.png)\n\n`; // Placeholder for image
        } else {
            reportContent += `No chart generated.\n\n`;
        }

        reportContent += `## 4. AI Insights & Storytelling\n\n`;
        if (aiResponseContent.innerHTML !== '') {
            reportContent += `### ${responseTitle.textContent}\n\n`;
            reportContent += htmlToMarkdown(aiResponseContent.innerHTML) + '\n\n';
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

    // --- Settings Modal ---
    function openSettingsModal() {
        loadSettings(); // Load current settings into the modal form
        settingsModal.style.display = 'flex';
    }

    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }

    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        appSettings = { ...getDefaultSettings(), ...savedSettings };

        // Apply settings to UI elements
        apiKeyInput.value = appSettings.geminiApiKey || '';
        themeSelect.value = appSettings.theme;
        settingAutoProcessCheckbox.checked = appSettings.autoProcess;
        settingValidateDataCheckbox.checked = appSettings.validateData;
        settingAnimateChartsCheckbox.checked = appSettings.animateCharts;
        settingHighContrastCheckbox.checked = appSettings.highContrast;
        settingAutoAnalyzeCheckbox.checked = appSettings.autoAnalyze;
        settingMaxTokensSelect.value = appSettings.maxTokens;
        settingNotificationsCheckbox.checked = appSettings.showNotifications;
        settingCompactModeCheckbox.checked = appSettings.compactMode;

        applyTheme(appSettings.theme);
        // Apply other settings that affect UI directly
        // e.g., document.body.classList.toggle('compact-mode', appSettings.compactMode);
    }

    function saveSettings() {
        appSettings.geminiApiKey = apiKeyInput.value.trim();
        appSettings.theme = themeSelect.value;
        appSettings.autoProcess = settingAutoProcessCheckbox.checked;
        appSettings.validateData = settingValidateDataCheckbox.checked;
        appSettings.animateCharts = settingAnimateChartsCheckbox.checked;
        appSettings.highContrast = settingHighContrastCheckbox.checked;
        appSettings.autoAnalyze = settingAutoAnalyzeCheckbox.checked;
        appSettings.maxTokens = settingMaxTokensSelect.value;
        appSettings.showNotifications = settingNotificationsCheckbox.checked;
        appSettings.compactMode = settingCompactModeCheckbox.checked;

        localStorage.setItem('appSettings', JSON.stringify(appSettings));
        showNotification('Settings saved!', 'success');
        applyTheme(appSettings.theme); // Re-apply theme in case it changed
        // Re-process data or update charts if settings affect them
    }

    function getDefaultSettings() {
        return {
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

    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            appSettings = getDefaultSettings();
            saveSettings(); // Save defaults
            loadSettings(); // Apply defaults to UI
            showNotification('Settings reset to default.', 'info');
        }
    }

    // --- Help Modal ---
    function openHelpModal() {
        helpModal.style.display = 'flex';
        showHelpTab('quickstart'); // Show quickstart by default
    }

    function closeHelpModal() {
        helpModal.style.display = 'none';
    }

    function showHelpTab(tabId) {
        helpTabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        helpContents.forEach(content => {
            if (content.id === `${tabId}Tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    // --- Event Listeners ---
    themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    apiKeyInput.addEventListener('change', () => {
        appSettings.geminiApiKey = apiKeyInput.value.trim();
        saveSettings();
    });
    testApiBtn.addEventListener('click', async () => {
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

    settingsBtn.addEventListener('click', openSettingsModal);
    closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    saveSettingsBtn.addEventListener('click', saveSettings);
    resetSettingsBtn.addEventListener('click', resetSettings);

    helpBtn.addEventListener('click', openHelpModal);
    closeHelpModalBtn.addEventListener('click', closeHelpModal);
    helpTabs.forEach(tab => {
        tab.addEventListener('click', () => showHelpTab(tab.dataset.tab));
    });

    // Close modals if user clicks outside
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
        if (event.target === helpModal) {
            closeHelpModal();
        }
        if (event.target === progressModal) { // Allow clicking outside progress modal to close it
            hideLoadingOverlay();
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

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
                        dataTextarea.value = csv;
                        showNotification('Excel file converted to CSV in textarea.', 'success');
                    } catch (excelError) {
                        showNotification(`Error processing Excel file: ${excelError.message}`, 'error');
                        console.error('Excel processing error:', excelError);
                    } finally {
                        hideLoadingOverlay();
                    }
                } else {
                    const fileContent = await file.text();
                    dataTextarea.value = fileContent;
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

    // Helper to read file as binary string for XLSX
    function readFileAsBinaryString(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsBinaryString(file);
        });
    }

    fileInput.addEventListener('change', async (e) => {
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
                    dataTextarea.value = csv;
                    showNotification('Excel file converted to CSV in textarea.', 'success');
                } catch (excelError) {
                    showNotification(`Error processing Excel file: ${excelError.message}`, 'error');
                    console.error('Excel processing error:', excelError);
                } finally {
                    hideLoadingOverlay();
                }
            } else {
                const fileContent = await file.text();
                dataTextarea.value = fileContent;
                showNotification('File loaded into textarea.', 'success');
            }

            if (appSettings.autoProcess) {
                processData();
            }
        }
    });

    processDataBtn.addEventListener('click', processData);
    clearAllBtn.addEventListener('click', () => {
        dataTextarea.value = '';
        parsedData = null;
        currentChart = null;
        rowCountSpan.textContent = '0';
        columnCountSpan.textContent = '0';
        numericColumnsSpan.textContent = '0';
        missingValuesSpan.textContent = '0';
        qualityIndicatorsDiv.innerHTML = '';
        dataQualityDiv.style.display = 'none';
        dataPreviewTable.style.display = 'none';
        noDataMessage.style.display = 'block';
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
        xAxisSelect.innerHTML = '';
        yAxisSelect.innerHTML = '';
        chartTitleInput.value = '';
        mainChartCanvas.style.display = 'none';
        chartPlaceholder.style.display = 'block';
        aiResponseArea.style.display = 'none';
        aiResponseContent.innerHTML = '';
        apiStatusIndicator.classList.remove('status-connected', 'status-disconnected');
        apiStatusIndicator.classList.add('status-disconnected');
        apiStatusText.textContent = 'API Not Connected';
        showNotification('All cleared!', 'info');
    });

    updateChartBtn.addEventListener('click', updateChart);

    analyzeBtn.addEventListener('click', analyzeData);
    generateStoryBtn.addEventListener('click', generateStory);

    copyResponseBtn.addEventListener('click', () => {
        if (aiResponseContent.textContent) {
            navigator.clipboard.writeText(aiResponseContent.textContent).then(() => {
                showNotification('Response copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy text:', err);
                showNotification('Failed to copy response.', 'error');
            });
        } else {
            showNotification('No content to copy.', 'warning');
        }
    });

    regenerateBtn.addEventListener('click', () => {
        // Re-run the last analysis or story generation
        const currentAnalysisType = analysisTypeSelect.value;
        if (currentAnalysisType === 'story') {
            generateStory();
        } else {
            analyzeData();
        }
    });

    exportChartBtn.addEventListener('click', exportChart);
    exportCsvBtn.addEventListener('click', () => exportData('csv'));
    exportJsonBtn.addEventListener('click', () => exportData('json'));
    exportExcelBtn.addEventListener('click', () => exportData('excel'));
    exportReportBtn.addEventListener('click', exportReport);
    shareReportBtn.addEventListener('click', shareReport);

    analysisTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            customQuestionGroup.style.display = 'block';
        } else {
            customQuestionGroup.style.display = 'none';
        }
    });

    // Initial load of settings
    loadSettings();
});