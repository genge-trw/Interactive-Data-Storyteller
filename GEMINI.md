# Gemini API Integration and Security

This document outlines important considerations and steps for integrating with the Google Gemini API, especially regarding security and best practices for the `WebApp` project.

## 1. API Key Security - CRITICAL

**Current State:** The `WebApp` currently allows you to enter your Gemini API key directly into the client-side settings. While this works for local development and testing, it is a **major security vulnerability** for any production or publicly accessible deployment. Exposing your API key client-side allows anyone to steal and misuse it, potentially leading to unauthorized usage and unexpected costs.

**Recommended Solution: Backend Proxy**

For secure API key handling, you **MUST** implement a simple backend proxy server. This server will:
1.  Receive requests from the `WebApp`'s frontend.
2.  Add your Gemini API key (stored securely on the server, e.g., as an environment variable) to the request.
3.  Forward the request to the actual Gemini API endpoint.
4.  Return the Gemini API's response back to the frontend.

**How the `WebApp` is now configured for a proxy:**

*   `aiService.js` now sends requests to `/api/gemini` instead of directly to the Google Gemini API endpoint.
*   It also sends the API key (if configured client-side) in a custom header `X-Gemini-Api-Key`. This is a temporary measure for development and should ideally be removed once a proper backend proxy is in place that manages the key internally.

**Example Backend Proxy (Node.js with Express):**

```javascript
// server.js (or similar backend file)
const express = require('express');
const fetch = require('node-fetch'); // or use axios
const cors = require('cors'); // For handling CORS if your frontend is on a different origin

const app = express();
const PORT = process.env.PORT || 3000;

// Load API key from environment variables for security
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set!');
    process.exit(1);
}

app.use(cors()); // Enable CORS for all origins (adjust as needed for production)
app.use(express.json()); // To parse JSON request bodies

// Proxy endpoint for Gemini API calls
app.post('/api/gemini', async (req, res) => {
    try {
        const { model, contents, generationConfig } = req.body;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents, generationConfig }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error from proxy:', errorData);
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Proxy server error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
    console.log('Remember to set GEMINI_API_KEY environment variable!');
});
```

**To use the proxy:**
1.  Save the above code as `server.js` (or similar) in a new directory.
2.  Install dependencies: `npm init -y && npm install express node-fetch cors`.
3.  Set your Gemini API key as an environment variable: `export GEMINI_API_KEY='YOUR_ACTUAL_GEMINI_API_KEY'`.
4.  Run the server: `node server.js`.
5.  Ensure your `WebApp` is served from the same origin as the proxy, or configure CORS appropriately.

## 2. Gemini Model Selection

The `WebApp` now includes a `geminiModel` setting in `settingsManager.js`. This allows you to specify which Gemini model (e.g., `gemini-pro`, `gemini-1.5-pro-latest`) the application should use. This setting is passed in the request body to the proxy.

## 3. Client-Side API Key Input (Development Only)

For convenience during local development *without* a proxy, the `WebApp` still has an input field for the API key. If you enter a key here, `aiService.js` will include it in the `X-Gemini-Api-Key` header. Your proxy server can then optionally read this header. However, for production, the proxy should manage the key internally and this client-side input should be removed or disabled.
