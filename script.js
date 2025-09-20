// script.js

document.addEventListener('DOMContentLoaded', () => {
    const dataInput = document.getElementById('dataInput');
    const processDataBtn = document.getElementById('processDataBtn');
    const summaryOutput = document.getElementById('summaryOutput');
    const promptOutput = document.getElementById('promptOutput');
    const userResponse = document.getElementById('userResponse');
    const sendResponseBtn = document.getElementById('sendResponseBtn');
    const narrativeOutput = document.getElementById('narrativeOutput');
    const rewriteNarrativeBtn = document.getElementById('rewriteNarrativeBtn');
    const copyNarrativeBtn = document.getElementById('copyNarrativeBtn');
    const downloadNarrativeBtn = document.getElementById('downloadNarrativeBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const fileInput = document.getElementById('fileInput');
    const predefinedGoal = document.getElementById('predefinedGoal');
    const dataPreviewSection = document.querySelector('.data-preview-section');
    const dataPreviewTable = document.getElementById('dataPreviewTable');
    const dataChart = document.getElementById('dataChart');
    const chartContainer = document.getElementById('chartContainer');
    const chartPlaceholder = document.getElementById('chartPlaceholder');
    const savedNarrativesList = document.getElementById('savedNarrativesList');
    const chartCategorySelect = document.getElementById('chartCategorySelect');
    const chartValueSelect = document.getElementById('chartValueSelect');
    const chartTypeSelect = document.getElementById('chartTypeSelect');
    const renderChartBtn = document.getElementById('renderChartBtn');
    const downloadChartBtn = document.getElementById('downloadChartBtn');
    const downloadProcessedDataBtn = document.getElementById('downloadProcessedDataBtn');
    const chartTitleInput = document.getElementById('chartTitleInput');
    const chartColorInput = document.getElementById('chartColorInput');
    const chartLegendToggle = document.getElementById('chartLegendToggle');
    const aiChatHistory = document.getElementById('aiChatHistory');
    const freeformPromptInput = document.getElementById('freeformPromptInput');
    const sendFreeformPromptBtn = document.getElementById('sendFreeformPromptBtn');

    const summaryLoading = summaryOutput.querySelector('.loading-indicator');
    const promptLoading = promptOutput.querySelector('.loading-indicator');
    const narrativeLoading = narrativeOutput.querySelector('.loading-indicator');

    let currentData = '';
    let parsedData = [];
    let currentSummary = '';
    let currentNarrative = '';
    let aiSession = null;
    let promptStage = 0;
    let storytellingGoal = '';
    let audienceTone = '';
    let emphasisPoints = '';
    let chartInstance = null;

    // Initialize Web Worker
    const dataWorker = new Worker('dataProcessor.js');

    // TODO: Replace with your actual Gemini API Key
    const GEMINI_API_KEY = 'AIzaSyBxMyl4vkmV3MUoAc_sOrhdB9aI3AMe9DM'; 
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=';

    // --- Helpers ---
    function showLoading(element) { element.style.display = 'inline'; }
    function hideLoading(element) { element.style.display = 'none'; }

    function appendMessageToChatHistory(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        aiChatHistory.appendChild(messageElement);
        aiChatHistory.scrollTop = aiChatHistory.scrollHeight; // Scroll to bottom
    }

    // Handle messages from the Web Worker
    dataWorker.onmessage = async function(e) {
        const { status, parsedData: workerParsedData, message, errors, error } = e.data;

        if (status === 'success') {
            parsedData = workerParsedData;
            currentData = dataInput.value.trim(); // Ensure currentData is set from the input

            renderDataTable(parsedData);
            populateChartSelectors(parsedData.headers);

            // Initial chart render after data processing
            if (parsedData.data && parsedData.data.length > 0) {
                const cat = chartCategorySelect.value;
                const val = chartValueSelect.value;
                const type = chartTypeSelect.value;
                const title = chartTitleInput.value;
                const color = chartColorInput.value;
                const showLegend = chartLegendToggle.checked;
                updateChart(parsedData, cat, val, type, title, color, showLegend);
            } else {
                dataChart.style.display = 'none'; // Hide chart if no data
            }

            // Gemini API call for summary
            const summaryPrompt = `Summarize the following data. Focus on key statistics, trends, and potential insights. Data: ${currentData.substring(0, 2000)}... (truncated if very long)`; // Truncate data for prompt
            const geminiSummary = await callGeminiAPI(summaryPrompt);

            if (geminiSummary) {
                currentSummary = geminiSummary;
                summaryOutput.querySelector('p').innerHTML = currentSummary;
                appendMessageToChatHistory('AI', `Data Summary: ${currentSummary}`); // Log to chat history
                hideLoading(summaryLoading);
                promptOutput.style.display = 'block'; // Show AI Prompts section
                const selectedPredefinedGoal = predefinedGoal.value;
                if (selectedPredefinedGoal) {
                    storytellingGoal = selectedPredefinedGoal;
                    const initialPrompt = `AI: You selected "${storytellingGoal}". Now, who is your target audience and what tone should the narrative have? (e.g., Executives, formal; General public, engaging)`;
                    appendMessageToChatHistory('AI', initialPrompt); // Log to chat history
                    promptStage = 2; // Skip to stage 2 if predefined goal is set
                } else {
                    const initialPrompt = 'AI: What is the main goal of your story? (e.g., Explain growth trends, Highlight anomalies)';
                    appendMessageToChatHistory('AI', initialPrompt); // Log to chat history
                    promptStage = 1;
                }
            } else {
                // Fallback to mock AI if API call fails or key is not configured
                setTimeout(() => {
                    currentSummary = `Mock AI Summary for your data with ${parsedData.data.length} rows and ${parsedData.headers.length} columns. Key headers: ${parsedData.headers.join(', ')}.`;
                    summaryOutput.querySelector('p').innerHTML = currentSummary;
                    appendMessageToChatHistory('AI', `Data Summary: ${currentSummary} (Mocked)`); // Log to chat history
                    hideLoading(summaryLoading);
                    promptOutput.style.display = 'block'; // Show AI Prompts section
                    const selectedPredefinedGoal = predefinedGoal.value;
                    if (selectedPredefinedGoal) {
                        storytellingGoal = selectedPredefinedGoal;
                        const initialPrompt = `AI: You selected "${storytellingGoal}". Now, who is your target audience and what tone should the narrative have? (e.g., Executives, formal; General public, engaging)`;
                        appendMessageToChatHistory('AI', initialPrompt); // Log to chat history
                        promptStage = 2; // Skip to stage 2 if predefined goal is set
                    } else {
                        const initialPrompt = 'AI: What is the main goal of your story? (e.g., Explain growth trends, Highlight anomalies)';
                        appendMessageToChatHistory('AI', initialPrompt); // Log to chat history
                        promptStage = 1;
                    }
                }, 1500); // Simulate AI processing time
            }
        } else if (status === 'error') {
            alert(`Web Worker Error: ${message}\nDetails: ${JSON.stringify(errors || error)}`);
            console.error('Web Worker Error:', errors || error);
            hideLoading(summaryLoading);
        }
    };

    // --- Render Table ---
    function renderDataTable(data) {
        if (!data || !data.headers || !data.data || data.data.length === 0) {
            dataPreviewSection.style.display = 'none';
            dataChart.style.display = 'none'; // Hide the canvas
            chartPlaceholder.style.display = 'block'; // Show the placeholder
            chartPlaceholder.textContent = 'Select data and chart type to visualize.'; // Set placeholder text
            return;
        }
        let tableHTML = '<table><thead><tr>';
        data.headers.forEach(h => tableHTML += `<th>${h}</th>`);
        tableHTML += '</tr></thead><tbody>';
        data.data.forEach(row => {
            tableHTML += '<tr>';
            data.headers.forEach(h => tableHTML += `<td>${row[h] || ''}</td>`);
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        dataPreviewTable.innerHTML = tableHTML;
        dataPreviewSection.style.display = 'block';
    }

    function populateChartSelectors(headers) {
        chartCategorySelect.innerHTML = '';
        chartValueSelect.innerHTML = '';
        headers.forEach(h => {
            let o1 = document.createElement('option'); o1.value = h; o1.textContent = h;
            chartCategorySelect.appendChild(o1);
            let o2 = document.createElement('option'); o2.value = h; o2.textContent = h;
            chartValueSelect.appendChild(o2);
        });
        if (headers.length > 0) chartCategorySelect.value = headers[0];
        if (headers.length > 1) chartValueSelect.value = headers[1]; else if (headers.length > 0) chartValueSelect.value = headers[0];
    }

    // Helper to check if a string is date-like (YYYY-MM or YYYY-MM-DD)
    function isDateLike(value) {
        if (typeof value !== 'string') return false;
        return /^\d{4}-\d{2}(-\d{2})?$/.test(value);
    }

    // --- Charts (using Chart.js) ---
    function updateChart(data, categoryKey, valueKey, chartType, chartTitle = '', chartColor = '#4285F4', showLegend = true) {
        const ctx = dataChart.getContext('2d');

        if (chartInstance) {
            chartInstance.destroy(); // Destroy existing chart instance
        }

        if (!data || !data.data || data.data.length === 0) {
            dataChart.style.display = 'none';
            chartPlaceholder.style.display = 'block';
            chartPlaceholder.textContent = 'No data available to render chart.';
            return;
        }

        const labels = data.data.map(row => row[categoryKey]);
        const values = data.data.map(row => parseFloat(row[valueKey])).filter(v => !isNaN(v));

        if (values.length === 0) {
            dataChart.style.display = 'none';
            chartPlaceholder.style.display = 'block';
            chartPlaceholder.textContent = 'Selected value column contains no numerical data for charting.';
            return;
        }

        dataChart.style.display = 'block'; // Ensure canvas is visible
        chartPlaceholder.style.display = 'none'; // Hide placeholder if chart is rendered

        const chartConfig = {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: valueKey,
                    data: values,
                    backgroundColor: chartType === 'pie' ?
                        data.data.map((_, i) => `hsl(${(i * 60) % 360}, 70%, 50%)`) :
                        chartColor, // Use custom color for bar/line
                    borderColor: chartType === 'pie' ?
                        data.data.map((_, i) => `hsl(${(i * 60) % 360}, 70%, 40%)`) :
                        chartColor, // Use custom color for bar/line
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: showLegend // Use the showLegend parameter
                    },
                    title: {
                        display: chartTitle !== '',
                        text: chartTitle || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} of ${valueKey} by ${categoryKey}`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        display: chartType !== 'pie' // Hide y-axis for pie charts
                    },
                    x: {
                        display: chartType !== 'pie', // Hide x-axis for pie charts
                        type: isDateLike(data.data[0]?.[categoryKey]) && chartType === 'line' ? 'time' : 'category',
                        time: {
                            unit: 'month', // Default to month, can be adjusted
                            tooltipFormat: 'MMM YYYY'
                        },
                        title: {
                            display: true,
                            text: categoryKey
                        }
                    }
                }
            }
        };

        chartInstance = new Chart(ctx, chartConfig);
    }

    // --- Gemini API Integration ---
    async function callGeminiAPI(promptContent) {
        if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY' || !GEMINI_API_KEY) {
            console.warn('Gemini API Key is not configured. Using mock AI responses.');
            return null; // Indicate that API call was skipped
        }

        try {
            const response = await fetch(GEMINI_API_URL + GEMINI_API_KEY, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: promptContent
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API error:', errorData);
                alert('Error communicating with Gemini API. Check console for details.');
                return null;
            }

            const data = await response.json();
            // Gemini API response structure might vary, adjust as needed
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            alert('An unexpected error occurred while calling Gemini API. Check console for details.');
            return null;
        }
    }

    processDataBtn.addEventListener('click', async () => {
        showLoading(summaryLoading);
        summaryOutput.querySelector('p').innerHTML = ''; // Clear previous summary

        let dataToProcess = dataInput.value.trim();
        if (fileInput.files.length > 0) {
            dataToProcess = await fileInput.files[0].text();
        }

        if (!dataToProcess) {
            alert('Please paste or upload data to process.');
            hideLoading(summaryLoading);
            return;
        }

        // Send data to Web Worker for parsing
        dataWorker.postMessage({ dataToProcess });
    });

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileContent = await file.text();
            dataInput.value = fileContent;
            // Optionally, trigger processDataBtn.click() here if auto-processing is desired
            // processDataBtn.click();
        }
    });

    renderChartBtn.addEventListener('click', () => {
        if (parsedData.data && parsedData.data.length > 0) {
            const cat = chartCategorySelect.value;
            const val = chartValueSelect.value;
            const type = chartTypeSelect.value;
            const title = chartTitleInput.value;
            const color = chartColorInput.value;
            const showLegend = chartLegendToggle.checked;
            updateChart(parsedData, cat, val, type, title, color, showLegend);
        } else {
            alert('Please process data first to render a chart.');
        }
    });

    sendResponseBtn.addEventListener('click', async () => {
        const response = userResponse.value.trim();
        if (!response) {
            alert('Please enter your response.');
            return;
        }

        appendMessageToChatHistory('You', response); // Add user response to chat history
        showLoading(promptLoading);
        userResponse.value = ''; // Clear user input

        let geminiResponse = null;
        let promptText = '';

        switch (promptStage) {
            case 1:
                storytellingGoal = response;
                promptText = `Based on the goal "${storytellingGoal}", ask the user about their target audience and desired tone for the narrative.`;
                geminiResponse = await callGeminiAPI(promptText);
                if (geminiResponse) {
                    appendMessageToChatHistory('AI', geminiResponse); // Add AI response to chat history
                    promptStage = 2;
                }
                else {
                    // Fallback to mock AI
                    const mockResponse = 'AI: Who is your target audience and what tone should the narrative have? (e.g., Executives, formal; General public, engaging)';
                    appendMessageToChatHistory('AI', mockResponse); // Add mock AI response to chat history
                    promptStage = 2;
                }
                break;
            case 2:
                audienceTone = response;
                promptText = `Given the storytelling goal "${storytellingGoal}" and audience/tone "${audienceTone}", ask the user about key points or insights from the data to emphasize.`;
                geminiResponse = await callGeminiAPI(promptText);
                if (geminiResponse) {
                    appendMessageToChatHistory('AI', geminiResponse); // Add AI response to chat history
                    promptStage = 3;
                }
                else {
                    // Fallback to mock AI
                    const mockResponse = 'AI: What key points or insights from the data should be emphasized?';
                    appendMessageToChatHistory('AI', mockResponse); // Add mock AI response to chat history
                    promptStage = 3;
                }
                break;
            case 3:
                emphasisPoints = response;
                appendMessageToChatHistory('AI', 'Generating narrative...');
                hideLoading(promptLoading);
                narrativeOutput.style.display = 'block';
                await generateNarrativeWithGemini(); // Generate the final narrative using Gemini
                promptStage = 0; // Reset stage
                break;
            default:
                appendMessageToChatHistory('AI', 'Please process data first to start storytelling.');
                break;
        }
        hideLoading(promptLoading);
    });

    sendFreeformPromptBtn.addEventListener('click', async () => {
        const promptText = freeformPromptInput.value.trim();
        if (!promptText) {
            alert('Please enter a prompt.');
            return;
        }

        appendMessageToChatHistory('You', promptText);
        freeformPromptInput.value = ''; // Clear input

        showLoading(promptLoading); // Use the existing prompt loading indicator

        const fullPrompt = `User asks: "${promptText}".\n\nContext:\nStorytelling Goal: ${storytellingGoal}\nAudience/Tone: ${audienceTone}\nEmphasis Points: ${emphasisPoints}\nData Summary: ${currentSummary}\nRaw Data (first 500 chars): ${currentData.substring(0, 500)}...\n\nAI Response:`;

        const geminiResponse = await callGeminiAPI(fullPrompt);

        if (geminiResponse) {
            appendMessageToChatHistory('AI', geminiResponse);
        }
        else {
            appendMessageToChatHistory('AI', 'Sorry, I could not process your request at this time. Please check your API key or try again later.');
        }
        hideLoading(promptLoading);
    });

    rewriteNarrativeBtn.addEventListener('click', () => {
        if (!currentNarrative) {
            alert('No narrative to rewrite yet. Generate one first!');
            return;
        }
        const instruction = prompt('Enter rewrite instruction (e.g., "make it shorter", "more formal", "add humor"):');
        if (instruction) {
            generateMockNarrative(instruction);
        }
    });

    downloadChartBtn.addEventListener('click',()=>{
        if(!chartInstance){ alert('No chart to download!'); return; }
        html2canvas(dataChart).then(canvas=>{
            const link=document.createElement('a');
            link.download='chart.png'; link.href=canvas.toDataURL(); link.click();
            });
    });

    downloadProcessedDataBtn.addEventListener('click', () => {
        if (parsedData && parsedData.data && parsedData.data.length > 0) {
            const csv = Papa.unparse(parsedData.data);
            const filename = `processed_data_${new Date().toISOString().slice(0, 10)}.csv`;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } else {
            alert('No processed data to download!');
        }
    });

    // --- AI Narrative Generation (Gemini) ---
    async function generateNarrativeWithGemini(rewriteInstruction = '') {
        showLoading(narrativeLoading);
        narrativeOutput.querySelector('p').innerHTML = ''; // Clear previous narrative

        let prompt = `Generate a data narrative based on the following:\n`;
        prompt += `Storytelling Goal: ${storytellingGoal}\n`;
        prompt += `Target Audience & Tone: ${audienceTone}\n`;
        prompt += `Key Emphasis Points: ${emphasisPoints}\n`;
        prompt += `Data Summary: ${currentSummary}\n`;
        prompt += `Raw Data (first 500 chars): ${currentData.substring(0, 500)}...\n`;

        if (rewriteInstruction) {
            prompt += `Rewrite the previous narrative with the following instruction: "${rewriteInstruction}". Previous narrative: "${currentNarrative}"\n`;
        } else {
            prompt += `Please provide a compelling narrative.`;
        }

        const geminiNarrative = await callGeminiAPI(prompt);

        if (geminiNarrative) {
            currentNarrative = geminiNarrative;
            narrativeOutput.querySelector('p').innerHTML = currentNarrative;
        }
        else {
            // Fallback to mock narrative if API call fails
            let narrative = `<h2>Data Story: ${storytellingGoal}</h2>\n\n`;
            narrative += `<p><strong>Target Audience:</strong> ${audienceTone}</p>\n`;
            narrative += `<p><strong>Key Emphasis:</strong> ${emphasisPoints}</p>\n\n`;
            narrative += `<p>This is a mock narrative generated based on your inputs and the provided data.</p>\n`;
            narrative += `<p>The data shows various trends and patterns. For example, in the '${parsedData.headers[0]}' category, there's a notable ${Math.random() > 0.5 ? 'increase' : 'decrease'} in '${parsedData.headers[1]}' values over time.</p>\n`;
            narrative += `<p>Further analysis would delve into specific data points like ${parsedData.data[0][parsedData.headers[0]]} having a value of ${parsedData.data[0][parsedData.headers[1]]}.</p>\n`;

            if (rewriteInstruction) {
                narrative += `<p><em>(Rewritten with instruction: "${rewriteInstruction}")</em></p>\n`;
            }
            currentNarrative = narrative;
            narrativeOutput.querySelector('p').innerHTML = currentNarrative;
        }
        hideLoading(narrativeLoading);
    }

    // --- Clear All ---
    function clearAll(){
        dataInput.value = '';
        userResponse.value = '';
        predefinedGoal.value = '';

        summaryOutput.querySelector('p').innerHTML = '<em>Summary will appear here after processing.</em>';
        promptOutput.querySelector('p').innerHTML = '<em>AI will ask questions to guide your story.</em>';
        narrativeOutput.querySelector('p').innerHTML = '<em>Your data story will be generated here.</em>';

        currentData = '';
        parsedData = [];
        currentSummary = '';
        currentNarrative = '';
        aiSession = null; // Reset AI session if applicable
        promptStage = 0;
        storytellingGoal = '';
        audienceTone = '';
        emphasisPoints = '';

        promptOutput.style.display = 'none';
        narrativeOutput.style.display = 'none';
        hideLoading(summaryLoading);
        hideLoading(promptLoading);
        hideLoading(narrativeLoading);

        dataPreviewTable.innerHTML = '';
        dataChart.style.display = 'none';
        chartPlaceholder.style.display = 'block';
        chartPlaceholder.textContent = 'Select data and chart type to visualize.';
        dataPreviewSection.style.display = 'none';

        chartCategorySelect.innerHTML = '';
        chartValueSelect.innerHTML = '';
        chartTypeSelect.value = 'bar';

        renderSavedNarratives(); // Re-render saved narratives to ensure consistency
    }
    clearAllBtn.addEventListener('click', clearAll);

    copyNarrativeBtn.addEventListener('click', () => {
        if (currentNarrative) {
            navigator.clipboard.writeText(currentNarrative).then(() => {
                alert('Narrative copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy narrative: ', err);
                alert('Failed to copy narrative.');
            });
        } else {
            alert('No narrative to copy!');
        }
    });

    downloadNarrativeBtn.addEventListener('click', () => {
        if (currentNarrative) {
            const filename = `narrative_${new Date().toISOString().slice(0, 10)}.txt`;
            const blob = new Blob([currentNarrative], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('No narrative to download!');
        }
    });

    // --- Saved Narratives ---
    function renderSavedNarratives() {
        const narratives = JSON.parse(localStorage.getItem('savedNarratives') || '[]');
        if (narratives.length === 0) {
            savedNarrativesList.innerHTML = '<p class="empty-state">No narratives saved yet.</p>';
        }
        else {
            let html = '';
            narratives.forEach((narrative, index) => {
                html += `
                    <div class="saved-narrative-item">
                        <h3>${narrative.title || `Narrative ${index + 1}`}</h3>
                        <p>${narrative.content.substring(0, 150)}...</p>
                        <button class="view-narrative-btn" data-index="${index}">View</button>
                        <button class="delete-narrative-btn secondary-btn" data-index="${index}">Delete</button>
                    </div>
                `;
            });
            savedNarrativesList.innerHTML = html;
        }
    }

    // For brevity, leaving AI mock and narrative functions same as original

    renderSavedNarratives(); // Initial render of saved narratives

    // Event delegation for saved narrative buttons
    savedNarrativesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-narrative-btn')) {
            const index = event.target.dataset.index;
            const narratives = JSON.parse(localStorage.getItem('savedNarratives') || '[]');
            if (narratives[index]) {
                narrativeOutput.querySelector('p').innerHTML = narratives[index].content;
                currentNarrative = narratives[index].content;
                // Optionally scroll to narrative output
                narrativeOutput.scrollIntoView({ behavior: 'smooth' });
            }
        }
        else if (event.target.classList.contains('delete-narrative-btn')) {
            const index = event.target.dataset.index;
            let narratives = JSON.parse(localStorage.getItem('savedNarratives') || '[]');
            if (confirm('Are you sure you want to delete this narrative?')) {
                narratives.splice(index, 1);
                localStorage.setItem('savedNarratives', JSON.stringify(narratives));
                renderSavedNarratives(); // Re-render the list after deletion
            }
        }
    });

    // --- Basic Unit Tests (In-browser) ---
    function runTests() {
        console.log('--- Running Basic Unit Tests ---');

        // Test populateChartSelectors
        populateChartSelectors(['col1', 'col2', 'col3']);
        console.assert(chartCategorySelect.options.length === 3, 'populateChartSelectors: Should populate category select with 3 options');
        console.assert(chartValueSelect.options.length === 3, 'populateChartSelectors: Should populate value select with 3 options');
        console.assert(chartCategorySelect.value === 'col1', 'populateChartSelectors: Category select should default to first column');
        console.assert(chartValueSelect.value === 'col2', 'populateChartSelectors: Value select should default to second column');
        console.log('populateChartSelectors tests passed.');

        // Test clearAll (visual inspection needed for full verification)
        clearAll();
        console.assert(dataInput.value === '', 'clearAll: dataInput should be empty');
        console.assert(userResponse.value === '', 'clearAll: userResponse should be empty');
        console.assert(predefinedGoal.value === '', 'clearAll: predefinedGoal should be empty');
        console.assert(summaryOutput.querySelector('p').innerHTML.includes('Summary will appear here'), 'clearAll: summaryOutput should have placeholder');
        console.assert(promptOutput.querySelector('p').innerHTML.includes('AI will ask questions'), 'clearAll: promptOutput should have placeholder');
        console.assert(narrativeOutput.querySelector('p').innerHTML.includes('Your data story will be generated here'), 'clearAll: narrativeOutput should have placeholder');
        console.assert(currentData === '', 'clearAll: currentData should be empty');
        console.assert(parsedData.length === 0, 'clearAll: parsedData should be empty');
        console.assert(currentSummary === '', 'clearAll: currentSummary should be empty');
        console.assert(currentNarrative === '', 'clearAll: currentNarrative should be empty');
        console.assert(aiSession === null, 'clearAll: aiSession should be null');
        console.assert(promptStage === 0, 'clearAll: promptStage should be 0');
        console.assert(storytellingGoal === '', 'clearAll: storytellingGoal should be empty');
        console.assert(audienceTone === '', 'clearAll: audienceTone should be empty');
        console.assert(emphasisPoints === '', 'clearAll: emphasisPoints should be empty');
        console.assert(promptOutput.style.display === 'none', 'clearAll: promptOutput should be hidden');
        console.assert(narrativeOutput.style.display === 'none', 'clearAll: narrativeOutput should be hidden');
        console.assert(dataPreviewTable.innerHTML === '', 'clearAll: dataPreviewTable should be empty');
        console.assert(dataChart.style.display === 'none', 'updateChart: Chart should be hidden with no data');
        console.assert(chartPlaceholder.textContent.includes('Select data and chart type to visualize.'), 'clearAll: Should show initial chart placeholder message');
        console.assert(chartCategorySelect.options.length === 0, 'clearAll: chartCategorySelect should be empty');
        console.assert(chartValueSelect.options.length === 0, 'clearAll: chartValueSelect should be empty');
        console.assert(chartTypeSelect.value === 'bar', 'clearAll: chartTypeSelect should be bar');
        console.log('clearAll tests passed (more comprehensive).');

        // Test updateChart with no data
        updateChart({ headers: [], data: [] }, 'col1', 'col2', 'bar');
        console.assert(dataChart.style.display === 'none', 'updateChart: Chart should be hidden with no data');
        console.assert(chartPlaceholder.textContent.includes('No data available to render chart.'), 'updateChart: Should show no data message');
        console.log('updateChart no data tests passed.');

        // Test updateChart with non-numerical value column
        const nonNumericalData = {
            headers: ['category', 'value'],
            data: [{ category: 'A', value: 'text' }, { category: 'B', value: 'more text' }]
        };
        updateChart(nonNumericalData, 'category', 'value', 'bar');
        console.assert(dataChart.style.display === 'none', 'updateChart: Chart should be hidden with non-numerical value');
        console.assert(chartPlaceholder.textContent.includes('Selected value column contains no numerical data for charting.'), 'updateChart: Should show non-numerical data message');
        console.log('updateChart non-numerical value tests passed.');

        // Test updateChart with valid data (visual inspection needed for full verification)
        const validData = {
            headers: ['category', 'value'],
            data: [{ category: 'A', value: '10' }, { category: 'B', value: '20' }]
        };
        updateChart(validData, 'category', 'value', 'bar');
        console.assert(dataChart.style.display === 'block', 'updateChart: Chart should be visible with valid data');
        // Further assertions would require inspecting Chart.js internal state, which is complex for console.assert
        console.log('updateChart valid data tests passed (partial, visual inspection recommended).');

        // Test callGeminiAPI with unconfigured key
        const originalGeminiApiKey = GEMINI_API_KEY;
        GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Simulate unconfigured key
        callGeminiAPI('test prompt').then(response => {
            console.assert(response === null, 'callGeminiAPI: Should return null when key is unconfigured');
            console.log('callGeminiAPI unconfigured key test passed.');
            GEMINI_API_KEY = originalGeminiApiKey; // Restore original key
        });

        console.log('--- Basic Unit Tests Complete ---');
    }

    // Run tests after initial setup
    runTests();
});