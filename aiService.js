// aiService.js
// Handles all AI-related API calls and logic

import { appSettings } from './settingsManager.js';
import { showNotification, showLoadingOverlay, hideLoadingOverlay } from './utils.js';
import { elements } from './domElements.js';

const API_PROXY_ENDPOINT = '/api/gemini'; // Local proxy endpoint for Gemini API

export async function callGeminiAPI(promptContent, persona = 'neutral') {
    // In a production environment, the API key should be handled server-side
    // via a proxy to prevent exposure. This client-side check is for development.
    if (!appSettings.geminiApiKey || appSettings.geminiApiKey === 'YOUR_GEMINI_API_KEY') {
        showNotification('Gemini API Key is not configured or is using a placeholder. For secure and functional AI features, please configure a backend proxy or set a valid key for development purposes.', 'error', 8000);
        elements.apiStatusIndicator.classList.remove('status-connected');
        elements.apiStatusIndicator.classList.add('status-disconnected');
        elements.apiStatusText.textContent = 'API Not Connected (Proxy Needed)';
        return null;
    }

    elements.apiStatusIndicator.classList.remove('status-disconnected');
    elements.apiStatusIndicator.classList.add('status-connected');
    elements.apiStatusText.textContent = 'API Connected (via Proxy)';

    showLoadingOverlay('AI Thinking', 'Generating response...');

    try {
        const response = await fetch(API_PROXY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Pass the API key via a custom header for the proxy to pick up
                // This is still client-side, so a proper backend proxy is crucial.
                'X-Gemini-Api-Key': appSettings.geminiApiKey 
            },
            body: JSON.stringify({
                model: appSettings.geminiModel || 'gemini-pro', // Allow model selection from settings
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
            elements.apiStatusIndicator.classList.remove('status-connected');
            elements.apiStatusIndicator.classList.add('status-disconnected');
            elements.apiStatusText.textContent = 'API Error';
            hideLoadingOverlay();
            return null;
        }

        const data = await response.json();
        hideLoadingOverlay();
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        showNotification(`Error calling Gemini API: ${error.message || 'An unexpected error occurred.'}`, 'error', 5000);
        elements.apiStatusIndicator.classList.remove('status-connected');
        elements.apiStatusIndicator.classList.add('status-disconnected');
        elements.apiStatusText.textContent = 'API Error';
        hideLoadingOverlay();
        return null;
    }
}

// Placeholder for parsedData, will be passed from dataHandler or app.js
let parsedData = null;

export function setParsedData(data) {
    parsedData = data;
}

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
        const isDate = nonNullValues.every(v => isDateLike(v)); // isDateLike from utils.js

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

export async function analyzeData() {
    if (!parsedData) {
        showNotification('Please process data first before analysis.', 'warning');
        return;
    }

    const analysisType = elements.analysisTypeSelect.value;
    const selectedPersona = elements.toneOfVoiceSelect.value;
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
            const customQuestion = elements.customQuestionTextarea.value.trim();
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

    const aiResponse = await callGeminiAPI(prompt, selectedPersona); // Use selected persona

    if (aiResponse) {
        elements.aiResponseArea.style.display = 'block';
        elements.responseTitle.textContent = responseTitleText;
        elements.aiResponseContent.innerHTML = `<p>${aiResponse.replace(/\n/g, '<br>')}</p>`;
        showNotification('AI analysis complete!', 'success');
    } else {
        showNotification('AI analysis failed. Please try again.', 'error');
    }
}

export async function generateStory() {
    if (!parsedData) {
        showNotification('Please process data first to generate a story.', 'warning');
        return;
    }

    const structuredSummary = generateStructuredSummary(parsedData);
    const currentAnalysis = elements.aiResponseContent.textContent; // Get current analysis if any
    const selectedPersona = elements.toneOfVoiceSelect.value; // Get selected persona

    let prompt = `Create a compelling data story based on the following information. Focus on narrative flow, engaging the reader, and explaining insights clearly.\n\n`;
    prompt += `Data Summary: ${structuredSummary}\n\n`;
    if (currentAnalysis && currentAnalysis !== '') {
        prompt += `Key Insights from Analysis: ${currentAnalysis}\n\n`;
    }
    prompt += `Please craft a narrative that is easy to understand and highlights the most important aspects of the data.`;

    const aiResponse = await callGeminiAPI(prompt, selectedPersona); // Use selected persona

    if (aiResponse) {
        elements.aiResponseArea.style.display = 'block';
        elements.responseTitle.textContent = 'Generated Data Story';
        elements.aiResponseContent.innerHTML = `<p>${aiResponse.replace(/\n/g, '<br>')}</p>`;
        showNotification('Data story generated!', 'success');
    } else {
        showNotification('Data story generation failed. Please try again.', 'error');
    }
}
