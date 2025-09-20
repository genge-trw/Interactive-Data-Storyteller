// dataProcessor.js - Web Worker for data processing

importScripts('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');

self.onmessage = function(e) {
    const { dataToProcess } = e.data;

    try {
        const result = Papa.parse(dataToProcess, {
            header: true,
            skipEmptyLines: true
        });

        if (result.errors.length > 0) {
            self.postMessage({ status: 'error', message: 'Error parsing CSV data.', errors: result.errors });
            return;
        }

        self.postMessage({ status: 'success', parsedData: { headers: result.meta.fields, data: result.data } });

    } catch (error) {
        self.postMessage({ status: 'error', message: 'An unexpected error occurred during parsing.', error: error.message });
    }
};
