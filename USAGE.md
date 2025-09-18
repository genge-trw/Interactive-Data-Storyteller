### Recommended Tests

To ensure your application is robust and performs as expected, consider the following tests:

1.  **Core Functionality Tests:**
    *   **Data Input:**
        *   Paste valid CSV data (e.g., `Header1,Header2\nValue1,10\nValue2,20`).
        *   Paste plain text (non-CSV).
        *   Upload a valid `.csv` file.
        *   Upload a valid `.txt` file.
        *   Try with empty input.
    *   **AI Interaction:**
        *   Follow the full prompting flow (Goal -> Audience/Tone -> Emphasis).
        *   Try different "Predefined Goals."
        *   Test the "Rewrite Narrative" with various instructions (e.g., "make it shorter," "more formal," "add humor").
    *   **Chart Visualization:**
        *   Process data with at least two columns (one categorical, one numerical).
        *   Select different category and value columns.
        *   Switch between "Bar Chart" and "Line Chart."
        *   Test with data that has zero values, negative values (if applicable), or very large/small values.
        *   Test with data where the selected "value" column is not numerical.
    *   **Saving & Loading:**
        *   Generate a narrative and verify it appears in "Saved Narratives."
        *   "View" a saved narrative.
        *   "Delete" a saved narrative and confirm it's removed.
        *   Test saving multiple narratives.
    *   **Export:**
        *   "Copy Narrative" to clipboard and paste it elsewhere.
        *   "Download Narrative" and verify the `.txt` file content.
    *   **Clear All:** Verify all inputs and outputs are reset.

2.  **Edge Case & Error Handling Tests:**
    *   **Empty Inputs:** What happens if you click buttons with empty text areas?
    *   **Malformed CSV:** Paste CSV with uneven rows, missing headers, or extra commas.
    *   **Non-Numerical Data for Charts:** Select a text column as the "Value" for a chart.
    *   **Very Large Data:** Test with a CSV file containing hundreds or thousands of rows to check performance.
    *   **AI API Errors:** (If you have the Chrome flags enabled) Simulate network issues or unexpected AI responses (this might require dev tools manipulation or a custom mock layer).

3.  **Browser & Device Compatibility:**
    *   Test on different browsers (Chrome, Firefox, Edge, Safari) to ensure consistent behavior (note: Chrome Built-in AI APIs are Chrome-specific).
    *   Test on various screen sizes (desktop, tablet, mobile) to check responsiveness.

4.  **Accessibility Testing:**
    *   Navigate the entire application using only the keyboard (Tab, Shift+Tab, Enter, Spacebar).
    *   Use a screen reader (e.g., NVDA, JAWS, VoiceOver) to ensure all elements are correctly announced and interactive.
    *   Verify the "Skip to main content" link works.

### Recommended Uses & Best Practices

To get the most out of your application:

1.  **Data Preparation:**
    *   **Clean Data:** Ensure your CSV data is clean and well-formatted. The simpler the CSV, the better the parsing and AI results.
    *   **Meaningful Headers:** Use clear and descriptive headers for your columns, as the AI might use them for context.
    *   **Focus on Key Data:** For summarization and narrative generation, provide data that is relevant to the story you want to tell.

2.  **Effective AI Prompting:**
    *   **Be Specific:** When the AI asks for your storytelling goal, audience, or emphasis points, be as specific as possible. The more detail you provide, the better the AI can tailor the narrative.
    *   **Iterate with Rewriting:** Don't expect a perfect narrative on the first try. Use the "Rewrite Narrative" feature with clear instructions to refine the output.
    *   **Leverage Context:** Remember the AI uses the summary and previous conversation turns. Build on the AI's responses.

3.  **Chart Selection:**
    *   **Understand Your Data:** Before selecting columns for charting, understand which columns represent categories and which represent numerical values you want to visualize.
    *   **Experiment:** Try different combinations of category and value columns to see what insights emerge visually.

4.  **Chrome Built-in AI APIs:**
    *   **Enable Flags:** For the best experience, ensure you have the necessary Chrome flags enabled as described in the `README.md`. This allows the AI to run on-device, offering speed and privacy benefits.
    *   **Provide Feedback:** As these are experimental APIs, consider providing feedback to Google if you encounter issues or have suggestions for improvement.
