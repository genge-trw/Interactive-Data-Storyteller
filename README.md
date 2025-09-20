# Interactive Data Storyteller

This is a web application designed to help users transform raw data into compelling narratives with the assistance of AI. It allows users to input data, visualize it, and then use AI to guide them through the process of crafting a story around their insights.

## Features

*   **Data Input:** Paste CSV or plain text data directly, or use the **Drag-and-Drop** functionality to upload `.csv` and `.txt` files. You can also manually select a **Delimiter** for parsing.
*   **Enhanced Data Visualization:** View your parsed data in a table format. Generate **bar charts**, **line charts**, **pie charts**, and **scatter plots** by selecting relevant columns. Customize **Chart Titles**, **Colors**, and **X/Y Axis Labels**.
*   **Export Chart:** Download any generated chart as a **PNG image**.
*   **AI-Guided Storytelling:** Engage in a multi-stage conversation with AI to define your storytelling goal, target audience, tone, and key emphasis points. Select an **AI Persona/Tone** (e.g., Formal Analyst, Engaging Storyteller) to influence the narrative style.
*   **AI-Powered Narrative Generation:** Generate initial narrative drafts based on your data and storytelling parameters.
*   **AI-Powered Narrative Rewriting:** Refine and rephrase generated narratives with specific instructions (e.g., "make it simpler," "more formal").
*   **Persistent Storage:** Save your generated narratives locally in your browser's storage for future access.
*   **Export Narrative Options:** Copy narratives to your clipboard or download them as a **`.txt` file** or a **`.md` (Markdown) file**.
*   **Clear All Functionality:** Easily reset the application to its initial state.
*   **Theme Switching:** Choose between different visual themes (Default, Dark, Blue, Green) to customize the application's appearance. Your preference is saved locally.
*   **Enhanced Loading Indicators:** Provides clearer visual feedback during data processing and AI interactions.
*   **Responsive UI:** Designed to be usable across various screen sizes.
*   **Accessibility Enhancements:** Includes skip links, ARIA attributes, and visually hidden labels for improved screen reader compatibility.
*   **Interactive Tutorial:** A step-by-step guide to help new users get started with the application.

## How to Run Locally

To run this application on your local machine, you need a simple web server. Python's built-in HTTP server is a convenient option.

```bash
cd /data/data/com.termux/files/home/Desktop/WebApp
python3 -m http.server 8000
```

Then open your browser and go to:  
👉 `http://localhost:8000`

### Configuring Gemini API

To enable the full AI-powered storytelling features, you'll need a Google Gemini API key.

1.  **Obtain an API Key:** Visit the [Google AI Studio](https://aistudio.google.com/) to get your API key.
2.  **Update `script.js`:** Open `script.js` and replace the placeholder with your actual API key:
    ```javascript
    const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace this!
    ```
    Without a valid API key, the AI features will remain in a mocked state.

## Recent Improvements

*   **Improved Data Truncation for Gemini API:** AI now receives a more comprehensive structured summary of the data, leading to better insights and narratives.
*   **Web Worker Delimiter Auto-detection:** The data processor now intelligently detects the delimiter in CSV files, with an option for manual override.
*   **Enhanced User Feedback for Parsing Errors:** Error messages from the Web Worker are now displayed directly in the UI for better user experience.
*   **Removed Unused `aiSession` Variable:** Cleaned up the codebase by removing an unnecessary variable.
*   **Added Tutorial Content and Navigation:** The in-app tutorial is now functional with step-by-step guidance.
*   **Implemented Theme Switching:** Users can now select from multiple themes (Default, Dark, Blue, Green) with their preference saved locally.
*   **Added Scatter Plot Chart Type:** Expanded visualization options to include scatter plots for numerical data analysis.
*   **Interactive Axis Label Customization:** Users can now define custom labels for X and Y axes in charts.
*   **Added Markdown Narrative Export:** Narratives can now be downloaded as `.md` files for easier sharing and integration.
*   **Implemented AI Persona/Tone Selection:** Users can guide the AI's narrative style by choosing a persona.
*   **Added Drag-and-Drop File Upload:** A more intuitive way to input data by dragging files directly into the text area.
*   **Enhanced Loading Indicators:** More prominent visual feedback during data processing and AI calls.

## Future Enhancements

Based on ongoing development and user feedback, here are some ideas for future improvements:

### I. Data Input & Processing:
1.  **Data Validation & Cleaning Suggestions:** Analyze data for issues (missing values, inconsistent types, outliers) and suggest cleaning/transformation.
2.  **Support for Other Data Formats:** Extend parsing to JSON or Excel files.

### II. Charting & Visualization:
1.  **More Chart Types:** Add heatmaps and stacked bar/area charts.
2.  **Multiple Chart Views/Dashboards:** Enable creation and arrangement of multiple charts from the same dataset.

### III. AI Insights & Storytelling:
1.  **More Granular AI Prompts/Guidance:** Allow AI to ask more specific questions based on data for deeper narratives.
2.  **AI-Driven Data Transformation Suggestions:** AI could suggest data transformations based on user goals.
3.  **Narrative Export Formats:** Allow export to PDF or other rich text formats.

### IV. User Experience & Interface:
1.  **Responsive Design Refinements:** Further optimize for various screen sizes.
2.  **"Save Project" Functionality:** Allow saving and reloading entire sessions.

## License

This project is licensed under the terms specified in the `LICENSE` file.