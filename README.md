# Interactive Data Storyteller

This is a web application designed to help users transform raw data into compelling narratives with the assistance of AI, leveraging the experimental Chrome Built-in AI APIs. It allows users to input data, visualize it, and then use AI to guide them through the process of crafting a story around their insights.

## Features

*   **Data Input:** Paste CSV or plain text data directly, or upload `.csv` and `.txt` files.
*   **Basic Data Visualization:** View your parsed data in a table format. Generate simple bar charts or line charts by selecting relevant columns.
*   **AI-Guided Storytelling:** Engage in a multi-stage conversation with AI to define your storytelling goal, target audience, tone, and key emphasis points.
*   **AI-Powered Narrative Generation:** Generate initial narrative drafts based on your data and storytelling parameters using AI.
*   **AI-Powered Narrative Rewriting:** Refine and rephrase generated narratives with specific instructions (e.g., "make it simpler," "more formal").
*   **Persistent Storage:** Save your generated narratives locally in your browser's storage for future access.
*   **Export Options:** Copy narratives to your clipboard or download them as a `.txt` file.
*   **Clear All Functionality:** Easily reset the application to its initial state.
*   **Responsive UI:** Designed to be usable across various screen sizes.
*   **Accessibility Enhancements:** Includes skip links, ARIA attributes, and visually hidden labels for improved screen reader compatibility.

## How to Run Locally

To run this application on your local machine, you need a simple web server. Python's built-in HTTP server is a convenient option.

1.  **Navigate to the project directory:**
    ```bash
    cd /data/data/com.termux/files/home/Desktop/WebApp
    ```
2.  **Start the local web server:**
    ```bash
    python3 -m http.server 8000 &
    ```
    This command starts a server on port 8000 in the background.
3.  **Open in your browser:**
    Open your web browser and go to `http://localhost:8000`.

## Chrome Built-in AI APIs (Experimental)

This application is designed to work with the experimental Chrome Built-in AI APIs (e.g., Gemini Nano). These APIs allow AI models to run directly on the user's device, offering benefits like privacy, offline access, and reduced cost.

**To enable the actual Chrome Built-in AI APIs:**

1.  **Ensure you are using Google Chrome M127 or newer.**
2.  **Enable Chrome Flags:**
    *   Open `chrome://flags` in your browser.
    *   Search for and enable:
        *   `#enable-on-device-model`
        *   `#optimization-guide-on-device-model`
3.  **Restart Chrome.**
4.  You might also need to be part of the **Chrome Built-in AI Early Preview Program** for full access to all features.

**Note:** If these APIs are not enabled or available, the application will gracefully fall back to using mock AI responses, allowing you to still test the application's flow and features.

## Usage

1.  **Input Data:**
    *   Paste your CSV or plain text data into the large text area.
    *   Alternatively, click "Choose File" to upload a `.csv` or `.txt` file.
2.  **Process Data:** Click the "Process Data" button. The application will display a table preview of your data and populate the chart selection dropdowns.
3.  **Visualize Data (Optional):**
    *   Select a "Category" and "Value" column from the dropdowns.
    *   Choose "Bar Chart" or "Line Chart" from the "Chart Type" dropdown.
    *   Click "Update Chart" to visualize your data.
4.  **Engage with AI:**
    *   The AI will prompt you with questions to guide your storytelling. Type your responses in the "Your response to AI prompts" text area and click "Send Response."
    *   You can also select a "Predefined Goal" from the dropdown to fast-track the initial prompting.
5.  **Generate & Refine Narrative:** Once enough information is gathered, the AI will generate a narrative. You can then use the "Rewrite Narrative" button to refine it with specific instructions.
6.  **Save & Manage Narratives:**
    *   Generated narratives are automatically saved locally.
    *   View your saved narratives in the "Saved Narratives" section.
    *   Click "View" to load a saved narrative into the main output.
    *   Click "Delete" to remove a narrative from local storage.
7.  **Export Narrative:** Use "Copy Narrative" to copy the text to your clipboard or "Download Narrative" to save it as a `.txt` file.
8.  **Clear All:** Click "Clear All" to reset the application.

## Future Enhancements

*   **More Advanced Chart Types:** Implement additional chart types (e.g., pie charts, scatter plots) and more sophisticated customization options.
*   **Contextual AI Prompts (Deeper Integration):** Further enhance AI prompts to analyze data patterns and suggest more specific insights or storytelling angles.
*   **Export Chart as Image:** Allow users to download the generated charts as image files.
*   **User Feedback Mechanism:** Implement a system for users to rate or provide comments on AI-generated content.
*   **Cloud Integration (Hybrid AI):** For very large datasets or more complex AI tasks, integrate with cloud-based AI services (e.g., Firebase AI Logic, Gemini Developer API) while still leveraging on-device AI for privacy and efficiency.
