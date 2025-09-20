// dataProcessor.js - Web Worker for data processing

importScripts('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');

self.onmessage = function(e) {
    const { dataToProcess, selectedDelimiter } = e.data; // Destructure selectedDelimiter

    try {
        const parseConfig = {
            header: true,
            skipEmptyLines: true,
            fastMode: true, // Enable fast mode for potentially faster and more lenient parsing
            dynamicTyping: true, // Attempt to convert numbers and booleans
            trimHeaders: true // Trim whitespace from header fields
        };

        // Use selectedDelimiter if provided and not 'auto', otherwise use 'auto'
        if (selectedDelimiter && selectedDelimiter !== 'auto') {
            parseConfig.delimiter = selectedDelimiter;
        } else {
            parseConfig.delimiter = 'auto';
        }

        const result = Papa.parse(dataToProcess, parseConfig);

        if (result.errors.length > 0) {
            self.postMessage({ status: 'error', message: 'Error parsing CSV data.', errors: result.errors });
            return;
        }

        self.postMessage({ status: 'success', parsedData: { headers: result.meta.fields, data: result.data } });

    } catch (error) {
        self.postMessage({ status: 'error', message: 'An unexpected error occurred during parsing.', error: error.message });
    }
};