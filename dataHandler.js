// dataHandler.js
// Handles all data loading, parsing, validation, and transformation logic

import { elements } from './domElements.js';
import { showNotification, showLoadingOverlay, hideLoadingOverlay, isDateLike, percentile, readFileAsBinaryString } from './utils.js';
import { appSettings } from './settingsManager.js';
import { setParsedData } from './aiService.js';
import { setParsedDataForCharts, updateChart } from './chartManager.js';
import { currentChart } from './chartManager.js'; // Import currentChart to reset it

let parsedData = null;
const dataWorker = new Worker('dataProcessor.js');

export function resetDataState() {
    parsedData = null;
    // Reset UI elements related to data
    elements.dataTextarea.value = '';
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
    if (currentChart) {
        currentChart.destroy();
    }
    elements.mainChartCanvas.style.display = 'none';
    elements.chartPlaceholder.style.display = 'block';
    elements.aiResponseArea.style.display = 'none';
    elements.aiResponseContent.innerHTML = '';
    elements.apiStatusIndicator.classList.remove('status-connected', 'status-disconnected');
    elements.apiStatusIndicator.classList.add('status-disconnected');
    elements.apiStatusText.textContent = 'API Not Connected';
    showNotification('Application state reset.', 'info');
}

export async function handleFileUpload(file, event) {
    if (event) event.preventDefault();
    elements.dropZone.classList.remove('drag-over');

    if (!file) {
        showNotification('No file selected or dropped.', 'warning');
        return;
    }

    // Check file type (basic)
    if (file.type.match('text/csv') || file.type.match('text/plain') || file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
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
    } else {
        showNotification('Unsupported file type. Please upload CSV, Excel, or plain text.', 'error');
    }
}


dataWorker.onmessage = async function(e) {
    const { status, parsedData: workerParsedData, message, errors, error } = e.data;

    if (status === 'success') {
        parsedData = workerParsedData;
        setParsedData(parsedData); // Update parsedData in aiService
        setParsedDataForCharts(parsedData); // Update parsedData in chartManager
        displayDataOverview(parsedData);
        renderDataTable(parsedData);
        populateChartSelectors(parsedData.headers);
        showNotification('Data processed successfully!', 'success');
        
        // Perform data validation after successful parsing
        if (appSettings.validateData) {
            const validationReport = validateData(parsedData);
            displayValidationReport(validationReport);
            highlightTableInsights(validationReport); // Highlight table cells based on validation
            if (validationReport.issues.length > 0) {
                suggestDataTransformations(validationReport);
            }
        }

        if (appSettings.autoAnalyze) {
            // analyzeData(); // This will be called from app.js after data is ready
        }

    } else if (status === 'error') {
        const errorMessage = `Error processing data: ${message || 'Unknown error'}. Details: ${JSON.stringify(errors || error)}`;
        showNotification(errorMessage, 'error', 5000);
        console.error('Web Worker Error:', errors || error);
    }
    hideLoadingOverlay();
};

export async function suggestDataTransformations(validationReport) {
    if (!parsedData || validationReport.issues.length === 0) {
        elements.aiCleaningSuggestions.style.display = 'none';
        return;
    }

    elements.aiCleaningSuggestions.style.display = 'block';
    elements.cleaningSuggestionsList.innerHTML = '';

    showLoadingOverlay('AI Suggestions', 'Generating data cleaning recommendations...');

    let prompt = `Given the following data quality issues in a dataset:\n\n`;
    validationReport.issues.forEach(issue => {
        prompt += `- Type: ${issue.type}, Column: ${issue.column || 'N/A'}, Description: ${issue.description}. Suggested action: ${issue.suggestion}\n`;
    });
    prompt += `\nBased on these issues, provide specific, actionable data cleaning or transformation suggestions. For each suggestion, explain why it's needed and how it can be applied. Focus on practical steps. Format your response as a list of suggestions.`;

    // Call Gemini API from aiService
    const { callGeminiAPI } = await import('./aiService.js');
    const aiResponse = await callGeminiAPI(prompt, 'data analyst');

    if (aiResponse) {
        const suggestions = aiResponse.split(/\n(?=- )/).filter(s => s.trim() !== ''); // Split by newline followed by '- '
        if (suggestions.length > 0) {
            suggestions.forEach(suggestionText => {
                const item = document.createElement('div');
                item.classList.add('quality-indicator-item', 'info');
                let htmlContent = `<p>${suggestionText.trim()}</p>`;

                // Attempt to parse specific transformation types from AI response
                let transformationType = '';
                let column = '';
                let value = '';

                if (suggestionText.includes('impute missing values') && suggestionText.includes('column')) {
                    const match = suggestionText.match(/column '([a-zA-Z0-9_]+)' with (mean|median|mode)/);
                    if (match) {
                        column = match[1];
                        transformationType = `impute_${match[2]}`;
                        htmlContent += `<button class="btn btn-primary btn-small apply-transform-btn" data-type="${transformationType}" data-column="${column}">Apply ${match[2]} Imputation</button>`;
                    }
                } else if (suggestionText.includes('convert column') && suggestionText.includes('to numeric')) {
                    const match = suggestionText.match(/column '([a-zA-Z0-9_]+)' to numeric/);
                    if (match) {
                        column = match[1];
                        transformationType = 'convert_to_numeric';
                        htmlContent += `<button class="btn btn-primary btn-small apply-transform-btn" data-type="${transformationType}" data-column="${column}">Convert to Numeric</button>`;
                    }
                } else if (suggestionText.includes('remove outliers') && suggestionText.includes('column')) {
                    const match = suggestionText.match(/column '([a-zA-Z0-9_]+)'/);
                    if (match) {
                        column = match[1];
                        transformationType = 'remove_outliers';
                        htmlContent += `<button class="btn btn-primary btn-small apply-transform-btn" data-type="${transformationType}" data-column="${column}">Remove Outliers</button>`;
                    }
                } else if (suggestionText.includes('remove rows with missing values') && suggestionText.includes('column')) {
                    const match = suggestionText.match(/column '([a-zA-Z0-9_]+)'/);
                    if (match) {
                        column = match[1];
                        transformationType = 'remove_rows_missing';
                        htmlContent += `<button class="btn btn-primary btn-small apply-transform-btn" data-type="${transformationType}" data-column="${column}">Remove Rows</button>`;
                    }
                }

                item.innerHTML = htmlContent;
                elements.cleaningSuggestionsList.appendChild(item);
            });

            // Add event listeners to the newly created buttons
            elements.cleaningSuggestionsList.querySelectorAll('.apply-transform-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const type = event.target.dataset.type;
                    const col = event.target.dataset.column;
                    applyTransformation(type, col);
                });
            });

        } else {
            elements.cleaningSuggestionsList.innerHTML = '<div class="quality-indicator-item info">AI generated suggestions, but they could not be parsed into actionable steps.</div>';
        }
        showNotification('AI cleaning suggestions generated.', 'success');
    } else {
        elements.cleaningSuggestionsList.innerHTML = '<div class="quality-indicator-item info">No AI suggestions could be generated at this time.</div>';
        showNotification('Failed to generate AI cleaning suggestions.', 'error');
    }
    hideLoadingOverlay();
}

export function applyTransformation(transformationType, column, value) {
    showLoadingOverlay('Applying Transformation', `Applying ${transformationType} to ${column}...`);
    let success = false;

    switch (transformationType) {
        case 'impute_mean':
            success = imputeMissingValues(column, 'mean');
            break;
        case 'impute_median':
            success = imputeMissingValues(column, 'median');
            break;
        case 'impute_mode':
            success = imputeMissingValues(column, 'mode');
            break;
        case 'convert_to_numeric':
            success = convertColumnToNumeric(column);
            break;
        case 'remove_outliers':
            success = removeOutliers(column);
            break;
        case 'remove_rows_missing':
            success = removeRowsWithMissingValues(column);
            break;
        default:
            showNotification(`Unknown transformation type: ${transformationType}`, 'error');
            hideLoadingOverlay();
            return;
    }

    if (success) {
        showNotification(`Transformation (${transformationType}) applied successfully to ${column}.`, 'success');
        // Re-render UI after transformation
        displayDataOverview(parsedData);
        renderDataTable(parsedData);
        updateChart();
        // Re-validate data to show new quality report
        if (appSettings.validateData) {
            const validationReport = validateData(parsedData);
            displayValidationReport(validationReport);
            highlightTableInsights(validationReport); // Re-highlight table after transformation
            // No need to suggest again immediately after applying
        }
    } else {
        showNotification(`Failed to apply transformation (${transformationType}) to ${column}.`, 'error');
    }
    hideLoadingOverlay();
}

function imputeMissingValues(column, method) {
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) return false;
    const columnValues = parsedData.data.map(row => row[column]);
    const nonNullNumerics = columnValues.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).map(Number);

    let fillValue;
    if (method === 'mean' && nonNullNumerics.length > 0) {
        fillValue = nonNullNumerics.reduce((sum, val) => sum + val, 0) / nonNullNumerics.length;
    } else if (method === 'median' && nonNullNumerics.length > 0) {
        nonNullNumerics.sort((a, b) => a - b);
        const mid = Math.floor(nonNullNumerics.length / 2);
        fillValue = nonNullNumerics.length % 2 === 0 ? (nonNullNumerics[mid - 1] + nonNullNumerics[mid]) / 2 : nonNullNumerics[mid];
    } else if (method === 'mode') {
        const counts = {};
        let maxCount = 0;
        let modeValue;
        columnValues.forEach(v => {
            if (v !== null && v !== undefined && String(v).trim() !== '') {
                counts[v] = (counts[v] || 0) + 1;
                if (counts[v] > maxCount) {
                    maxCount = counts[v];
                    modeValue = v;
                }
            }
        });
        fillValue = modeValue;
    } else {
        showNotification(`Imputation method '${method}' not applicable or no data for column '${column}'.`, 'warning');
        return false;
    }

    parsedData.data.forEach(row => {
        if (row[column] === null || row[column] === undefined || String(row[column]).trim() === '') {
            row[column] = fillValue;
        }
    });
    return true;
}

function convertColumnToNumeric(column) {
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) return false;
    let convertedCount = 0;
    parsedData.data.forEach(row => {
        const originalValue = row[column];
        const numericValue = parseFloat(originalValue);
        if (isNaN(numericValue) && (originalValue !== null && originalValue !== undefined && String(originalValue).trim() !== '')) {
            // If it's not numeric and not empty, set to NaN or 0, or keep original if preferred
            row[column] = NaN; // Or 0, or keep original if preferred
            convertedCount++;
        } else if (!isNaN(numericValue)) {
            row[column] = numericValue;
        }
    });
    if (convertedCount > 0) {
        showNotification(`Converted ${convertedCount} non-numeric values in column '${column}' to NaN.`, 'info');
    }
    return true;
}

function removeOutliers(column) {
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) return false;
    const columnValues = parsedData.data.map(row => parseFloat(row[column])).filter(v => !isNaN(v) && isFinite(v));

    if (columnValues.length < 5) {
        showNotification('Not enough data points to reliably detect outliers.', 'warning');
        return false;
    }

    const q1 = percentile(columnValues, 25);
    const q3 = percentile(columnValues, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const originalRowCount = parsedData.data.length;
    parsedData.data = parsedData.data.filter(row => {
        const value = parseFloat(row[column]);
        return isNaN(value) || (value >= lowerBound && value <= upperBound);
    });
    const removedCount = originalRowCount - parsedData.data.length;
    if (removedCount > 0) {
        showNotification(`Removed ${removedCount} rows containing outliers in column '${column}'.`, 'info');
    }
    return true;
}

function removeRowsWithMissingValues(column) {
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) return false;
    const originalRowCount = parsedData.data.length;
    parsedData.data = parsedData.data.filter(row => {
        return row[column] !== null && row[column] !== undefined && String(row[column]).trim() !== '';
    });
    const removedCount = originalRowCount - parsedData.data.length;
    if (removedCount > 0) {
        showNotification(`Removed ${removedCount} rows with missing values in column '${column}'.`, 'info');
    }
    return true;
}

export function processData() {
    showLoadingOverlay('Processing Data', 'Parsing and validating your dataset...');
    const dataToProcess = elements.dataTextarea.value.trim();
    const selectedDelimiter = elements.delimiterSelect.value;
    const hasHeaders = elements.hasHeadersCheckbox.checked;

    if (!dataToProcess) {
        hideLoadingOverlay();
        showNotification('Please paste or upload data to process.', 'warning');
        return;
    }

    // Send data to Web Worker for parsing
    dataWorker.postMessage({ dataToProcess, selectedDelimiter, hasHeaders });
}

export function displayDataOverview(data) {
    elements.rowCountSpan.textContent = data.data.length;
    elements.columnCountSpan.textContent = data.headers.length;

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

    elements.numericColumnsSpan.textContent = numericCols;
    elements.missingValuesSpan.textContent = missingValCount;
}

export function renderDataTable(data) {
    if (!data || !data.headers || !data.data || data.data.length === 0) {
        elements.dataPreviewTable.style.display = 'none';
        elements.noDataMessage.style.display = 'block';
        return;
    }

    elements.noDataMessage.style.display = 'none';
    elements.dataPreviewTable.style.display = 'table';

    elements.tableHead.innerHTML = '';
    elements.tableBody.innerHTML = '';

    let headerRow = '<tr>';
    data.headers.forEach(h => headerRow += `<th>${h}</th>`);
    headerRow += '</tr>';
    elements.tableHead.innerHTML = headerRow;

    data.data.slice(0, 100).forEach((row, rowIndex) => { // Display first 100 rows for preview
        let bodyRow = '<tr>';
        data.headers.forEach(h => bodyRow += `<td data-column="${h}" data-row-index="${rowIndex}">${row[h] || ''}</td>`);
        bodyRow += '</tr>';
        elements.tableBody.innerHTML += bodyRow;
    });
}

/**
 * Highlights cells in the data table based on validation issues.
 * @param {object} validationReport The report from validateData.
 */
function highlightTableInsights(validationReport) {
    // Clear previous highlights
    elements.tableBody.querySelectorAll('td').forEach(td => {
        td.classList.remove('table-highlight-missing', 'table-highlight-inconsistent', 'table-highlight-outlier');
    });

    if (!validationReport || validationReport.issues.length === 0) {
        return;
    }

    validationReport.issues.forEach(issue => {
        if (issue.type === 'missing_values' && issue.details && issue.details.missingRows) {
            issue.details.missingRows.forEach(rowNum => {
                // rowNum is 1-based, data-row-index is 0-based
                const rowIndex = rowNum - 1;
                const cell = elements.tableBody.querySelector(`td[data-column="${issue.column}"][data-row-index="${rowIndex}"]`);
                if (cell) {
                    cell.classList.add('table-highlight-missing');
                }
            });
        } else if (issue.type === 'inconsistent_type' && issue.column) {
            // For inconsistent types, we highlight all cells in the column that are not numeric
            // This requires re-checking the actual cell content, as the report only stores samples
            elements.tableBody.querySelectorAll(`td[data-column="${issue.column}"]`).forEach(cell => {
                const cellValue = cell.textContent;
                if (isNaN(parseFloat(cellValue)) && cellValue.trim() !== '') {
                    cell.classList.add('table-highlight-inconsistent');
                }
            });
        } else if (issue.type === 'outliers' && issue.column && issue.details) {
            const lowerBound = issue.details.lowerBound;
            const upperBound = issue.details.upperBound;

            elements.tableBody.querySelectorAll(`td[data-column="${issue.column}"]`).forEach(cell => {
                const cellValue = parseFloat(cell.textContent);
                if (!isNaN(cellValue) && (cellValue < lowerBound || cellValue > upperBound)) {
                    cell.classList.add('table-highlight-outlier');
                }
            });
        }
    });
}

export function populateChartSelectors(headers) {
    elements.xAxisSelect.innerHTML = '';
    elements.yAxisSelect.innerHTML = '';

    headers.forEach(h => {
        const optionX = document.createElement('option');
        optionX.value = h;
        optionX.textContent = h;
        elements.xAxisSelect.appendChild(optionX);

        const optionY = document.createElement('option');
        optionY.value = h;
        optionY.textContent = h;
        elements.yAxisSelect.appendChild(optionY);
    });

    // Attempt to pre-select sensible defaults
    if (headers.length > 0) elements.xAxisSelect.value = headers[0];
    if (headers.length > 1) elements.yAxisSelect.value = headers[1];
}

export function validateData(data) {
    const report = {
        issues: []
    };

    if (!data || !data.data || data.data.length === 0) {
        report.issues.push({
            type: 'no_data',
            description: 'No data available for validation.',
            suggestion: 'Please load data to perform validation.'
        });
        return report;
    }

    // Check for missing values
    data.headers.forEach(header => {
        let missingCount = 0;
        const missingRows = [];
        data.data.forEach((row, index) => {
            if (row[header] === null || row[header] === undefined || String(row[header]).trim() === '') {
                missingCount++;
                missingRows.push(index + 1); // +1 for 1-based indexing
            }
        });
        if (missingCount > 0) {
            const percentage = ((missingCount / data.data.length) * 100).toFixed(1);
            report.issues.push({
                type: 'missing_values',
                column: header,
                count: missingCount,
                percentage: percentage,
                description: `Column '${header}' has ${missingCount} missing values (${percentage}%).`,
                suggestion: `Consider imputing missing values in '${header}' (e.g., with mean, median, or a constant) or filtering rows with missing data.`,
                details: { missingRows: missingRows.slice(0, 10) } // Store up to 10 missing row indices
            });
        }
    });

    // Check for inconsistent data types in numeric columns
    data.headers.forEach(header => {
        const columnValues = data.data.map(row => row[header]);
        const nonNullValues = columnValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');

        if (nonNullValues.length > 0) {
            const firstValueIsNumeric = !isNaN(parseFloat(nonNullValues[0])) && isFinite(nonNullValues[0]);
            if (firstValueIsNumeric) {
                const nonNumericValues = nonNullValues.filter(v => isNaN(parseFloat(v)) || !isFinite(v));
                if (nonNumericValues.length > 0) {
                    report.issues.push({
                        type: 'inconsistent_type',
                        column: header,
                        count: nonNumericValues.length,
                        description: `Column '${header}' contains ${nonNumericValues.length} non-numeric values.`,
                        suggestion: `Ensure all values in '${header}' are consistently numeric if intended for calculations or charting. Consider converting or cleaning non-numeric entries.`,
                        details: { sampleNonNumeric: nonNumericValues.slice(0, 5) }
                    });
                }
            }
        }
    });

    // Basic Outlier Detection (for numeric columns only) using IQR method
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
                report.issues.push({
                    type: 'outliers',
                    column: header,
                    count: outliers.length,
                    description: `Column '${header}' has ${outliers.length} potential outliers.`,
                    suggestion: `Investigate outliers in '${header}' as they might skew analysis. Consider Winsorization, capping, or removal if appropriate.`,
                    details: { sampleOutliers: outliers.slice(0, 5), lowerBound, upperBound }
                });
            }
        }
    });

    // Check for categorical columns with too many unique values (high cardinality)
    data.headers.forEach(header => {
        const columnValues = data.data.map(row => row[header]);
        const nonNullValues = columnValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
        if (nonNullValues.length > 0) {
            const uniqueValues = [...new Set(nonNullValues)];
            const uniqueCount = uniqueValues.length;
            // Define a threshold for high cardinality, e.g., > 50% unique values or a fixed number like 50
            if (uniqueCount > (data.data.length * 0.5) && uniqueCount > 20) { // Adjust thresholds as needed
                report.issues.push({
                    type: 'high_cardinality',
                    column: header,
                    uniqueCount: uniqueCount,
                    description: `Column '${header}' has very high cardinality (${uniqueCount} unique values).`,
                    suggestion: `Consider grouping similar values, binning, or feature engineering for '${header}' if used in analysis or modeling.`,
                    details: { sampleUnique: uniqueValues.slice(0, 5) }
                });
            }
        }
    });

    return report;
}

export function displayValidationReport(report) {
    elements.qualityIndicatorsDiv.innerHTML = '';
    if (report.issues.length > 0) {
        elements.dataQualityDiv.style.display = 'block';
        report.issues.forEach((issue, index) => {
            const item = document.createElement('div');
            let issueClass = 'info';
            if (issue.type === 'missing_values' || issue.type === 'inconsistent_type' || issue.type === 'outliers') {
                issueClass = 'error';
            } else if (issue.type === 'high_cardinality') {
                issueClass = 'warning';
            }
            item.classList.add('quality-indicator-item', issueClass);
            item.innerHTML = `<strong>Issue ${index + 1}:</strong> ${issue.description}<br><em>Suggestion: ${issue.suggestion || 'No specific suggestion.'}</em>`;
            elements.qualityIndicatorsDiv.appendChild(item);
        });
    } else {
        elements.dataQualityDiv.style.display = 'block';
        elements.qualityIndicatorsDiv.innerHTML = '<div class="quality-indicator-item success">No major data quality issues detected.</div>';
    }
}

export function getParsedData() {
    return parsedData;
}
