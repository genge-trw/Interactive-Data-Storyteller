// exportManager.js
// Handles all data export functionalities.

import { elements } from './domElements.js';
import { showNotification, htmlToMarkdown, downloadFile, showLoadingOverlay, hideLoadingOverlay } from './utils.js';
import { getParsedData } from './dataHandler.js';
import { currentChart } from './chartManager.js';

export function exportData(format) {
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

export async function exportReport() {
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

    reportContent += `## 3. Visualizations\n\n`;
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