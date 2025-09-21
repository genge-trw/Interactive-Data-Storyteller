// chartManager.js
// Handles all charting logic using Chart.js

import { elements } from './domElements.js';
import { showNotification, isDateLike } from './utils.js';
import { appSettings } from './settingsManager.js';

export let currentChart = null;
let parsedData = null; // Will be set by dataHandler or app.js

export function setParsedDataForCharts(data) {
    parsedData = data;
}

const CHART_COLORS = {
    default: ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#42b6f4', '#8e42f4', '#f442b6', '#f48e42'],
    viridis: ['#440154', '#482858', '#3e4989', '#31688e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b'],
    spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#e6f598', '#abdda4', '#66c2a5'],
    coolwarm: ['#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3']
};

export function updateChart() {
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) {
        showNotification('No data available to render chart.', 'warning');
        elements.mainChartCanvas.style.display = 'none';
        elements.heatmapContainer.style.display = 'none';
        elements.chartPlaceholder.style.display = 'block';
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
