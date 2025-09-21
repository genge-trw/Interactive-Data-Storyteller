// utils.js
// General utility functions

import { elements } from './domElements.js';

export function showLoadingOverlay(title = 'Processing...', message = 'Please wait...') {
    elements.progressTitle.textContent = title;
    elements.progressMessage.textContent = message;
    elements.progressFill.style.width = '0%';
    elements.progressModal.style.display = 'flex';
}

export function hideLoadingOverlay() {
    elements.progressModal.style.display = 'none';
}

export function updateProgressBar(percentage) {
    elements.progressFill.style.width = `${percentage}%`;
}

export function showNotification(message, type = 'info', duration = 3000) {
    // appSettings will be passed from app.js
    // if (!appSettings.showNotifications) return;
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    elements.notificationContainer.appendChild(notification);

    // Trigger reflow to enable transition
    void notification.offsetWidth;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove());
    }, duration);
}

export function isDateLike(value) {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}(-\d{2})?$/.test(value);
}

export function htmlToMarkdown(html) {
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

export function downloadFile(content, filename, type) {
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

export function readFileAsBinaryString(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsBinaryString(file);
    });
}

export function percentile(arr, p) {
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
