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
    const savedNarrativesList = document.getElementById('savedNarrativesList');
    const chartCategorySelect = document.getElementById('chartCategorySelect');
    const chartValueSelect = document.getElementById('chartValueSelect');
    const chartTypeSelect = document.getElementById('chartTypeSelect');
    const renderChartBtn = document.getElementById('renderChartBtn');

    const summaryLoading = summaryOutput.querySelector('.loading-indicator');
    const promptLoading = promptOutput.querySelector('.loading-indicator');
    const narrativeLoading = narrativeOutput.querySelector('.loading-indicator');

    let currentData = '';
    let parsedData = []; // To store parsed CSV data
    let currentSummary = '';
    let currentNarrative = '';
    let aiSession = null; // Placeholder for Chrome AI session
    let promptStage = 0; // 0: initial, 1: goal, 2: audience/tone, 3: emphasis
    let storytellingGoal = '';
    let audienceTone = '';
    let emphasisPoints = '';


    function showLoading(element) {
        element.style.display = 'inline';
    }

    function hideLoading(element) {
        element.style.display = 'none';
    }

    // --- Mock AI API Functions (Replace with actual Chrome Built-in AI API calls) ---

    async function mockSummarizerAPI(text) {
        console.log('Mock Summarizer API called with:', text);
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const firstFewWords = words.slice(0, Math.min(words.length, 10)).join(' ');
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`Mock Summary: Based on "${firstFewWords}"..., the data appears to cover [topic]. Key insights suggest [trend 1] and [trend 2]. Further details are available.`);
            }, 1500);
        });
    }

    async function mockPromptAPI(prompt, context) {
        console.log('Mock Prompt API called with:', prompt, 'Context:', context);
        return new Promise(resolve => {
            setTimeout(() => {
                let suggestedTrends = '';
                if (parsedData && parsedData.headers && parsedData.data && parsedData.data.length > 0) {
                    const numericalHeaders = parsedData.headers.filter(header => parsedData.data.every(row => !isNaN(parseFloat(row[header]))));
                    if (numericalHeaders.length > 0) {
                        suggestedTrends = `\n\nBased on the data, some numerical columns are: ${numericalHeaders.join(', ')}. You might want to focus on trends in these.`;
                    }
                }

                if (prompt.includes("storytelling goal")) {
                    storytellingGoal = prompt.split('User\'s storytelling goal: ')[1].split('. Based on the summary:')[0];
                    resolve("Understood. What audience are you targeting, and what tone should the story have? (e.g., 'Executives, formal', 'General public, engaging')" + suggestedTrends);
                } else if (prompt.includes("audience and tone")) {
                    audienceTone = prompt.split('User\'s audience and tone: ')[1].split('. Based on the summary:')[0];
                    resolve("Excellent. Now, what specific data points or trends from the summary do you want to emphasize in your narrative?" + suggestedTrends);
                } else if (prompt.includes("emphasis points")) {
                    emphasisPoints = prompt.split('User\'s emphasis points: ')[1].split('. Based on the summary:')[0];
                    resolve("Thank you for your input. Let's generate a narrative based on this.");
                }
            }, 1500);
        });
    }

    async function mockWriterAPI(prompt, context) {
        console.log('Mock Writer API called with:', prompt, 'Context:', context);
        return new Promise(resolve => {
            setTimeout(() => {
                const goal = storytellingGoal || '[your storytelling goal]';
                const audience = audienceTone.split(',')[0] || '[your audience]';
                const tone = audienceTone.split(',')[1] ? audienceTone.split(',')[1].trim() : '[your tone]';
                const emphasis = emphasisPoints || '[key data points]';

                resolve(`Mock Narrative: Here's a draft for your data story, aiming to ${goal} for ${audience} in a ${tone} manner, emphasizing ${emphasis}:\n\n"Our analysis of the data reveals a compelling story. The primary message, to ${goal}, is supported by key findings from the summary: ${currentSummary}. For our ${audience} audience, we've adopted a ${tone} approach. We particularly highlight ${emphasis} to underscore the narrative's core. This story aims to provide clear insights and drive understanding."\n\nFeel free to ask for a rewrite to refine the message.`);
            }, 2000);
        });
    }

    async function mockRewriterAPI(text, instruction) {
        console.log('Mock Rewriter API called with:', text, 'Instruction:', instruction);
        return new Promise(resolve => {
            setTimeout(() => {
                let rewrittenText = `Mock Rewritten Narrative: Here's a revised version based on your request to "${instruction}":\n\n`;
                if (instruction.toLowerCase().includes('simpler')) {
                    rewrittenText += "A simpler take: The main points are easy to see. We looked at the data and found some interesting things. This story is now easier to read and understand.";
                } else if (instruction.toLowerCase().includes('formal')) {
                    rewrittenText += "A more formal rendition: This document presents a refined narrative derived from the original data analysis. The objective is to convey information with enhanced professionalism and adherence to formal discourse standards.";
                } else if (instruction.toLowerCase().includes('growth')) {
                    rewrittenText += "Focusing on growth: The narrative has been adjusted to emphasize the significant growth observed within the dataset. Key metrics indicating expansion and development are now prominently featured.";
                } else {
                    rewrittenText += "This narrative has been subtly adjusted to reflect your instruction. It retains the core message but with a fresh perspective.";
                }
                return resolve(rewrittenText);
            }, 1800);
        });
    }

    // --- Event Listeners ---

    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
                let row = {};
                for (let j = 0; j < headers.length; j++) {
                    row[headers[j]] = values[j];
                }
                data.push(row);
            }
        }
        return { headers, data };
    }

    function renderDataTable(data) {
        if (!data || !data.headers || !data.data || data.data.length === 0) {
            dataPreviewSection.style.display = 'none';
            return;
        }

        let tableHTML = '<table><thead><tr>';
        data.headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        data.data.forEach(row => {
            tableHTML += '<tr>';
            data.headers.forEach(header => {
                tableHTML += `<td>${row[header] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';

        dataPreviewTable.innerHTML = tableHTML;
        dataPreviewSection.style.display = 'block';
    }

    function populateChartSelectors(headers) {
        chartCategorySelect.innerHTML = '';
        chartValueSelect.innerHTML = '';

        headers.forEach(header => {
            const option1 = document.createElement('option');
            option1.value = header;
            option1.textContent = header;
            chartCategorySelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = header;
            option2.textContent = header;
            chartValueSelect.appendChild(option2);
        });

        // Set default selections if available
        if (headers.length > 0) {
            chartCategorySelect.value = headers[0];
        }
        if (headers.length > 1) {
            chartValueSelect.value = headers[1];
        }
    }

    function renderBarChart(data, categoryKey, valueKey) {
        if (!data || !data.data || data.data.length === 0 || !categoryKey || !valueKey) {
            dataChart.innerHTML = '';
            return;
        }

        const values = data.data.map(row => parseFloat(row[valueKey])).filter(val => !isNaN(val));

        if (values.length === 0) {
            dataChart.innerHTML = '';
            return;
        }

        const maxValue = Math.max(...values);
        let chartHTML = '';

        data.data.forEach(row => {
            const category = row[categoryKey];
            const value = parseFloat(row[valueKey]);
            if (!isNaN(value)) {
                const barHeight = (value / maxValue) * 100; // Scale to 100% of chart height
                chartHTML += `
                    <div class="bar-container">
                        <div class="bar" style="height: ${barHeight}%;">
                            <span class="bar-value">${value}</span>
                        </div>
                        <span class="bar-label">${category}</span>
                    </div>
                `;
            }
        });
        dataChart.innerHTML = chartHTML;
    }

    function renderLineChart(data, categoryKey, valueKey) {
        if (!data || !data.data || data.data.length === 0 || !categoryKey || !valueKey) {
            dataChart.innerHTML = '';
            return;
        }

        const values = data.data.map(row => parseFloat(row[valueKey])).filter(val => !isNaN(val));
        const categories = data.data.map(row => row[categoryKey]);

        if (values.length === 0) {
            dataChart.innerHTML = '';
            return;
        }

        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue;

        let lineChartHTML = '<div class="line-chart-container" style="position: relative; width: 100%; height: 100%;">';
        let points = [];

        // Calculate points for the line
        for (let i = 0; i < values.length; i++) {
            const x = (i / (values.length - 1)) * 100; // X position as percentage
            const y = ((values[i] - minValue) / range) * 100; // Y position as percentage
            points.push({ x, y, value: values[i], category: categories[i] });
        }

        // Draw the line segments
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            // Using SVG for lines would be better, but for HTML/CSS only, we can use rotated divs
            // This is a very simplified representation and might not look perfect
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            lineChartHTML += `
                <div class="line-segment" style="
                    position: absolute;
                    left: ${p1.x}%;
                    bottom: ${p1.y}%;
                    width: ${length}%;
                    height: 2px; /* Line thickness */
                    background-color: var(--primary-color);
                    transform-origin: 0 0;
                    transform: rotate(${angle}deg);
                "></div>
            `;
        }

        // Draw points and labels
        points.forEach(p => {
            lineChartHTML += `
                <div class="line-point" style="
                    position: absolute;
                    left: ${p.x}%;
                    bottom: ${p.y}%;
                    transform: translate(-50%, -50%);
                    width: 8px; height: 8px; border-radius: 50%;
                    background-color: var(--primary-color);
                    border: 1px solid white;
                " title="${p.category}: ${p.value}"></div>
                <span class="line-label" style="
                    position: absolute;
                    left: ${p.x}%;
                    bottom: ${p.y + 5}%; /* Adjust label position */
                    transform: translateX(-50%);
                    font-size: 0.7em;
                    color: var(--text-color);
                    white-space: nowrap;
                ">${p.value}</span>
            `;
        });

        lineChartHTML += '</div>';
        dataChart.innerHTML = lineChartHTML;
    }

    // --- Local Storage Functions ---
    function saveNarrative(narrative) {
        const narratives = loadNarratives();
        const id = Date.now().toString();
        narratives.push({ id, narrative, timestamp: new Date().toLocaleString() });
        localStorage.setItem('savedNarratives', JSON.stringify(narratives));
        displaySavedNarratives();
    }

    function loadNarratives() {
        const narrativesJSON = localStorage.getItem('savedNarratives');
        return narrativesJSON ? JSON.parse(narrativesJSON) : [];
    }

    function deleteNarrative(id) {
        let narratives = loadNarratives();
        narratives = narratives.filter(n => n.id !== id);
        localStorage.setItem('savedNarratives', JSON.stringify(narratives));
        displaySavedNarratives();
    }

    function displaySavedNarratives() {
        savedNarrativesList.innerHTML = '';
        const narratives = loadNarratives();

        if (narratives.length === 0) {
            savedNarrativesList.innerHTML = '<p>No narratives saved yet.</p>';
            return;
        }

        narratives.forEach(n => {
            const narrativeDiv = document.createElement('div');
            narrativeDiv.className = 'output-box';
            narrativeDiv.innerHTML = `
                <h3>Saved Narrative (${n.timestamp})</h3>
                <p>${n.narrative.substring(0, 200)}...</p>
                <button class="view-narrative-btn" data-id="${n.id}">View</button>
                <button class="delete-narrative-btn secondary-btn" data-id="${n.id}">Delete</button>
            `;
            savedNarrativesList.appendChild(narrativeDiv);
        });

        document.querySelectorAll('.view-narrative-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                const narrative = loadNarratives().find(n => n.id === id);
                if (narrative) {
                    currentNarrative = narrative.narrative;
                    narrativeOutput.querySelector('p').textContent = currentNarrative;
                    narrativeOutput.style.display = 'block';
                    // Scroll to narrative output
                    narrativeOutput.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        document.querySelectorAll('.delete-narrative-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                if (confirm('Are you sure you want to delete this narrative?')) {
                    deleteNarrative(id);
                }
            });
        });
    }

    // --- Event Listeners ---

    processDataBtn.addEventListener('click', async () => {
        currentData = dataInput.value;
        if (!currentData.trim()) {
            alert('Please paste some data first!');
            return;
        }

        // Try to parse as CSV, otherwise treat as plain text
        try {
            parsedData = parseCSV(currentData);
            console.log('Parsed CSV Data:', parsedData);
            if (parsedData.data.length > 0) {
                renderDataTable(parsedData);
                populateChartSelectors(parsedData.headers); // Populate selectors after parsing
                // Initial chart render based on default selections
                const selectedCategory = chartCategorySelect.value;
                const selectedValue = chartValueSelect.value;
                const selectedChartType = chartTypeSelect.value;
                if (selectedChartType === 'bar') {
                    renderBarChart(parsedData, selectedCategory, selectedValue);
                } else if (selectedChartType === 'line') {
                    renderLineChart(parsedData, selectedCategory, selectedValue);
                }
            } else {
                dataPreviewSection.style.display = 'none';
            }
            // For summarization, we'll send the original text, but now we have structured data too
        } catch (e) {
            console.warn('Could not parse as CSV, treating as plain text.', e);
            parsedData = []; // Clear any previous parsed data
            dataPreviewSection.style.display = 'none';
        }

        summaryOutput.querySelector('p').textContent = 'Summarizing data...';
        showLoading(summaryLoading); // Show loading indicator
        try {
            // --- Actual Summarizer API Call ---
            if (window.ai && window.ai.createTextSession) {
                if (!aiSession) { // Initialize session only once
                    aiSession = await window.ai.createTextSession();
                }
                currentSummary = await aiSession.prompt(`Summarize the following data: ${currentData}`);
            } else {
                // Fallback to mock if AI API is not available
                currentSummary = await mockSummarizerAPI(currentData);
            }
            summaryOutput.querySelector('p').textContent = currentSummary;
        } catch (error) {
            console.error('Error summarizing data:', error);
            summaryOutput.querySelector('p').textContent = 'Error: Could not summarize data. Please try again or check your Chrome AI setup.';
        } finally {
            hideLoading(summaryLoading); // Hide loading indicator
        }

        promptStage = 1; // Set stage to 1 after data processing
        promptOutput.querySelector('p').textContent = 'AI: What is the main message or insight you want to convey with this data?';
        userResponse.value = '';
        promptOutput.style.display = 'block'; // Show prompt section
    });

    renderChartBtn.addEventListener('click', () => {
        if (parsedData.data.length > 0) {
            const selectedCategory = chartCategorySelect.value;
            const selectedValue = chartValueSelect.value;
            const selectedChartType = chartTypeSelect.value;

            if (selectedChartType === 'bar') {
                renderBarChart(parsedData, selectedCategory, selectedValue);
            } else if (selectedChartType === 'line') {
                renderLineChart(parsedData, selectedCategory, selectedValue);
            }
        } else {
            alert('Please process data first to render a chart.');
        }
    });

    sendResponseBtn.addEventListener('click', async () => {
        const response = userResponse.value;
        if (!response.trim()) {
            alert('Please enter your response!');
            return;
        }

        promptOutput.querySelector('p').textContent += `\nUser: ${response}\nAI: Thinking...`;
        userResponse.value = '';
        showLoading(promptLoading); // Show prompt loading indicator

        try {
            let aiPromptResponse = '';
            let promptText = '';

            switch (promptStage) {
                case 1: // User provides storytelling goal
                    promptText = `User's storytelling goal: ${response}. Based on the summary: ${currentSummary}. What audience are you targeting and what tone should the story have? (e.g., 'Executives, formal', 'General public, engaging')`;
                    break;
                case 2: // User provides audience and tone
                    promptText = `User's audience and tone: ${response}. Based on the summary: ${currentSummary} and previous goal. What specific data points or trends from the summary do you want to emphasize in your narrative?`;
                    break;
                case 3: // User provides emphasis points - ready to generate narrative
                    promptText = `User's emphasis points: ${response}. Based on the summary: ${currentSummary}, goal, audience, and tone. Please generate a narrative.`;
                    break;
                default:
                    promptText = `User response: ${response}. Current context: ${currentSummary}.`;
            }

            if (window.ai && window.ai.createTextSession && aiSession) {
                aiPromptResponse = await aiSession.prompt(promptText);
            } else {
                aiPromptResponse = await mockPromptAPI(promptText, currentSummary);
            }

            promptOutput.querySelector('p').textContent = `AI: ${aiPromptResponse}`;

            if (promptStage < 3) { // Continue prompting
                promptStage++;
            } else {
                narrativeOutput.querySelector('p').textContent = 'Generating narrative...';
                showLoading(narrativeLoading); // Show narrative loading indicator
                try {
                    // --- Actual Writer API Call ---
                    if (window.ai && window.ai.createTextSession && aiSession) {
                        currentNarrative = await aiSession.prompt(`Write a narrative based on the following summary: ${currentSummary}, user's goal: ${storytellingGoal}, audience and tone: ${audienceTone}, and emphasis points: ${emphasisPoints}. Full context: ${promptOutput.querySelector('p').textContent}`);
                    } else {
                        currentNarrative = await mockWriterAPI(`Write a narrative based on the full context.`, currentSummary + "\nUser's goal: " + storytellingGoal + "\nAudience/Tone: " + audienceTone + "\nEmphasis: " + emphasisPoints);
                    }
                    narrativeOutput.querySelector('p').textContent = currentNarrative;
                    narrativeOutput.style.display = 'block'; // Show narrative section
                    promptStage = 0; // Reset stage after narrative generation
                    saveNarrative(currentNarrative); // Save the generated narrative
                } catch (error) {
                    console.error('Error generating narrative:', error);
                    narrativeOutput.querySelector('p').textContent = 'Error: Could not generate narrative. Please try again.';
                } finally {
                    hideLoading(narrativeLoading); // Hide loading indicator
                }
            }
        } catch (error) {
            console.error('Error getting AI prompt response:', error);
            promptOutput.querySelector('p').textContent = 'Error: Could not get AI response. Please try again.';
        } finally {
            hideLoading(promptLoading); // Hide prompt loading indicator
        }
    });

    rewriteNarrativeBtn.addEventListener('click', async () => {
        if (!currentNarrative.trim()) {
            alert('No narrative to rewrite yet!');
            return;
        }

        const instruction = prompt('How would you like to rewrite this narrative? (e.g., "make it simpler", "more formal", "focus on growth")');
        if (!instruction) return;

        narrativeOutput.querySelector('p').textContent = 'Rewriting narrative...';
        showLoading(narrativeLoading); // Show loading indicator
        try {
            // --- Actual Rewriter API Call ---
            if (window.ai && window.ai.createTextSession && aiSession) {
                currentNarrative = await aiSession.prompt(`Rewrite the following text: ${currentNarrative}. Instruction: ${instruction}`);
            } else {
                currentNarrative = await mockRewriterAPI(currentNarrative, instruction);
            }
            narrativeOutput.querySelector('p').textContent = currentNarrative;
        } catch (error) {
            console.error('Error rewriting narrative:', error);
            narrativeOutput.querySelector('p').textContent = 'Error: Could not rewrite narrative. Please try again.';
        } finally {
            hideLoading(narrativeLoading); // Hide loading indicator
        }
    });

    function clearAll() {
        dataInput.value = '';
        userResponse.value = '';
        summaryOutput.querySelector('p').textContent = '<em>Summary will appear here after processing.</em>';
        promptOutput.querySelector('p').textContent = '<em>AI will ask questions to guide your story.</em>';
        narrativeOutput.querySelector('p').textContent = '<em>Your data story will be generated here.</em>';

        currentData = '';
        parsedData = [];
        currentSummary = '';
        currentNarrative = '';
        promptStage = 0; // Reset prompt stage
        storytellingGoal = '';
        audienceTone = '';
        emphasisPoints = '';
        predefinedGoal.value = ''; // Reset dropdown

        promptOutput.style.display = 'none';
        narrativeOutput.style.display = 'none';

        hideLoading(summaryLoading);
        hideLoading(promptLoading);
        hideLoading(narrativeLoading);
        dataPreviewTable.innerHTML = '';
        dataChart.innerHTML = ''; // Clear chart
        dataPreviewSection.style.display = 'none';

        // Reset chart selectors
        chartCategorySelect.innerHTML = '';
        chartValueSelect.innerHTML = '';
        chartTypeSelect.value = 'bar';
    }

    clearAllBtn.addEventListener('click', clearAll);

    // Call clearAll initially to set the default state
    clearAll();
    displaySavedNarratives(); // Display saved narratives on load

    copyNarrativeBtn.addEventListener('click', async () => {
        if (!currentNarrative.trim()) {
            alert('No narrative to copy yet!');
            return;
        }
        try {
            await navigator.clipboard.writeText(currentNarrative);
            alert('Narrative copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy narrative:', err);
            alert('Failed to copy narrative. Please try again or copy manually.');
        }
    });

    downloadNarrativeBtn.addEventListener('click', () => {
        if (!currentNarrative.trim()) {
            alert('No narrative to download yet!');
            return;
        }
        const filename = 'data_story.txt';
        const blob = new Blob([currentNarrative], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});