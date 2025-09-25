// chartManager.js
// Handles all charting logic using Chart.js

import { elements } from './domElements.js';
import { showNotification, isDateLike, percentile, showLoadingOverlay, hideLoadingOverlay } from './utils.js';
import { appSettings } from './settingsManager.js';
import { callGeminiAPI } from './aiService.js';

export let currentChart = null;
let parsedData = null; // Will be set by dataHandler or app.js

export function setParsedDataForCharts(data) {
    parsedData = data;
}

const CHART_COLORS = {
    default: ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#42b6f4', '#8e42f4', '#f442b6', '#f48e42'],
    viridis: ['#440154', '#482858', '#3e4989', '#31688e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b'],
    spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#e6f598', '#abdda4', '#66c2a5'],
    coolwarm: ['#b2182b', '#d6604d', 'f4a582', 'fddbc7', 'f7f7f7', 'd1e5f0', '92c5de', '4393c3']
};

export function updateChart() {
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) {
        showNotification('No data available to render chart.', 'warning');
        elements.mainChartCanvas.style.display = 'none';
        elements.heatmapContainer.style.display = 'none';
        elements.chartPlaceholder.style.display = 'block';
        elements.chartPromptContainer.innerHTML = ''; // Clear prompts
        return;
    }

    const chartType = elements.chartTypeSelect.value;
    const xAxisKey = elements.xAxisSelect.value;
    const yAxisKey = elements.yAxisSelect.value;
    const chartTitle = elements.chartTitleInput.value;
    const colorScheme = elements.colorSchemeSelect.value;
    const colors = CHART_COLORS[colorScheme] || CHART_COLORS.default;

    if (currentChart) {
        currentChart.destroy();
    }
    elements.mainChartCanvas.style.display = 'block';
    elements.heatmapContainer.style.display = 'none';
    elements.chartPlaceholder.style.display = 'none';
    elements.chartPromptContainer.innerHTML = ''; // Clear prompts before drawing new chart

    const ctx = elements.mainChartCanvas.getContext('2d');

    let labels = [];
    let dataValues = [];
    let datasets = [];
    let chartConfig = {};

    if (chartType === 'heatmap') {
        showNotification('Heatmap visualization is not yet fully implemented.', 'info');
        elements.mainChartCanvas.style.display = 'none';
        elements.heatmapContainer.style.display = 'block';
        elements.heatmapContainer.innerHTML = '<p>Heatmap placeholder. Feature coming soon!</p>';
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

    // Add contextual prompts after chart is updated
    addContextualPromptsToChart(currentChart, parsedData, chartType, xAxisKey, yAxisKey);
}

/**
 * Detects interesting insights from the chart data.
 * @param {Chart} chartInstance The Chart.js instance.
 * @param {object} data The parsed data object.
 * @param {string} chartType The type of chart.
 * @param {string} xAxisKey The key for the X-axis.
 * @param {string} yAxisKey The key for the Y-axis.
 * @returns {Array<object>} An array of insight objects.
 */
function detectChartInsights(chartInstance, data, chartType, xAxisKey, yAxisKey) {
    const insights = [];
    const yValues = data.data.map(row => parseFloat(row[yAxisKey])).filter(v => !isNaN(v) && isFinite(v));

    if (yValues.length < 5) {
        return insights; // Not enough data for meaningful analysis
    }

    // Outlier detection using IQR for the y-axis values
    const q1 = percentile(yValues, 25);
    const q3 = percentile(yValues, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    data.data.forEach((row, index) => {
        const yValue = parseFloat(row[yAxisKey]);
        if (!isNaN(yValue) && (yValue < lowerBound || yValue > upperBound)) {
            insights.push({
                type: 'outlier',
                xValue: row[xAxisKey],
                yValue: yValue,
                dataIndex: index,
                description: `Potential outlier: ${yAxisKey} is ${yValue} at ${xAxisKey} ${row[xAxisKey]}.`,
                fullDescription: `The value of ${yAxisKey} (${yValue}) at ${xAxisKey} (${row[xAxisKey]}) appears to be an outlier, falling outside the typical range of ${lowerBound.toFixed(2)} to ${upperBound.toFixed(2)}. This could indicate an unusual event or data error.`
            });
        }
    });

    // Spike/Drop detection for line charts
    if (chartType === 'line') {
        for (let i = 1; i < yValues.length; i++) {
            const prevY = yValues[i - 1];
            const currentY = yValues[i];

            if (prevY === 0) continue; // Avoid division by zero

            const percentageChange = ((currentY - prevY) / prevY) * 100;
            const threshold = 50; // Flag changes greater than 50%

            if (Math.abs(percentageChange) > threshold) {
                const changeType = percentageChange > 0 ? 'spike' : 'drop';
                insights.push({
                    type: changeType,
                    xValue: data.data[i][xAxisKey],
                    yValue: currentY,
                    dataIndex: i,
                    description: `Significant ${changeType}: ${yAxisKey} changed by ${percentageChange.toFixed(2)}% at ${xAxisKey} ${data.data[i][xAxisKey]}.`,
                    fullDescription: `A significant ${changeType} of ${percentageChange.toFixed(2)}% was observed in ${yAxisKey} at ${xAxisKey} (${data.data[i][xAxisKey]}). This could represent a critical event or trend shift.`
                });
            }
        }
    }

    return insights;
}

/**
 * Adds interactive contextual prompts to the chart.
 * @param {Chart} chartInstance The Chart.js instance.
 * @param {object} parsedData The parsed data object.
 * @param {string} chartType The type of chart.
 * @param {string} xAxisKey The key for the X-axis.
 * @param {string} yAxisKey The key for the Y-axis.
 */
function addContextualPromptsToChart(chartInstance, parsedData, chartType, xAxisKey, yAxisKey) {
    elements.chartPromptContainer.innerHTML = ''; // Clear existing prompts

    const insights = detectChartInsights(chartInstance, parsedData, chartType, xAxisKey, yAxisKey);

    if (insights.length === 0) {
        return;
    }

    // Ensure the chart has rendered and has meta data
    if (!chartInstance.getDatasetMeta(0) || !chartInstance.getDatasetMeta(0).data) {
        console.warn('Chart meta data not available for adding prompts.');
        return;
    }

    insights.forEach(insight => {
        const dataPoint = chartInstance.getDatasetMeta(0).data[insight.dataIndex];

        if (!dataPoint) {
            console.warn(`Data point not found for insight at index ${insight.dataIndex}.`);
            return;
        }

        const x = dataPoint.x;
        const y = dataPoint.y;

        const promptElement = document.createElement('div');
        promptElement.classList.add('chart-prompt');
        promptElement.style.left = `${x}px`;
        promptElement.style.top = `${y}px`;

        promptElement.innerHTML = `
            <p>${insight.description}</p>
            <button class="generate-story-btn">Generate Story</button>
        `;

        elements.chartPromptContainer.appendChild(promptElement);

        // Position adjustment (e.g., move above the point)
        // This might need more sophisticated logic based on chart type and point position
        const promptWidth = promptElement.offsetWidth;
        const promptHeight = promptElement.offsetHeight;
        promptElement.style.transform = `translate(-${promptWidth / 2}px, -${promptHeight + 10}px)`; // Center above point

        // Show the prompt after a short delay to allow positioning
        setTimeout(() => {
            promptElement.classList.add('show');
        }, 100);

        promptElement.querySelector('.generate-story-btn').addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent chart click event if any
            generateStoryFromInsight(insight, parsedData, xAxisKey, yAxisKey);
        });
    });
}

/**
 * Generates a story using AI based on a specific chart insight.
 * @param {object} insight The insight object.
 * @param {object} parsedData The full parsed data.
 * @param {string} xAxisKey The key for the X-axis.
 * @param {string} yAxisKey The key for the Y-axis.
 */
async function generateStoryFromInsight(insight, parsedData, xAxisKey, yAxisKey) {
    showLoadingOverlay('Generating AI Story', 'Crafting a narrative based on the detected insight...');

    const relevantDataSample = parsedData.data.slice(
        Math.max(0, insight.dataIndex - 5),
        insight.dataIndex + 5
    );

    let prompt = `You are a data storyteller. Analyze the following data and focus on the specific insight provided.
    
    Dataset Headers: ${parsedData.headers.join(', ')}
    Relevant Data Sample (around the insight):
    ${JSON.stringify(relevantDataSample, null, 2)}
    
    Insight: ${insight.fullDescription}
    
    Please generate a concise story or explanation (around 100-150 words) about this insight. Explain what it means in the context of the data, potential reasons for it, and its implications. Use a 'storyteller' tone.`;

    try {
        const aiResponse = await callGeminiAPI(prompt, 'storyteller');
        if (aiResponse) {
            elements.aiResponseArea.style.display = 'block';
            elements.responseTitle.textContent = `AI Story: ${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} at ${xAxisKey} ${insight.xValue}`;
            elements.aiResponseContent.innerHTML = aiResponse;
            showNotification('AI story generated!', 'success');
        } else {
            showNotification('Failed to generate AI story for insight.', 'error');
        }
    } catch (error) {
        console.error('Error generating AI story from insight:', error);
        showNotification('An error occurred while generating the AI story.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}


export function exportChart() {
    if (!currentChart) {
        showNotification('No chart to export.', 'warning');
        return;
    }

    // Use html2canvas to capture the chart canvas
    html2canvas(elements.mainChartCanvas).then(canvas => {
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