# Interactive Data Storyteller (Patched Version)

This is a web application designed to help users transform raw data into compelling narratives with the assistance of AI. It allows users to input data, visualize it, and then use AI to guide them through the process of crafting a story around their insights. Currently, the AI functionality is mocked for demonstration purposes. Future versions may integrate with actual AI APIs (e.g., Chrome Built-in AI APIs or Gemini API).

## Features

*   **Data Input:** Paste CSV or plain text data directly, or upload `.csv` and `.txt` files.
    <!-- Screenshot: Show the 'Input Your Data' section with sample data in the textarea or a file selected. -->
*   **Basic Data Visualization:** View your parsed data in a table format. Generate simple **bar charts**, **line charts**, or **pie charts** by selecting relevant columns.
    <!-- Screenshot: Show the 'Data Preview' table and a generated chart (e.g., a bar chart). -->
*   **Export Chart:** Download any generated chart as a **PNG image**.
    <!-- Screenshot: Show the 'Download Chart' button and perhaps a small visual of a downloaded chart. -->
*   **AI-Guided Storytelling:** Engage in a multi-stage conversation with AI to define your storytelling goal, target audience, tone, and key emphasis points.
    <!-- Screenshot: Show the 'AI Prompts' section with an ongoing conversation. -->
*   **AI-Powered Narrative Generation:** Generate initial narrative drafts based on your data and storytelling parameters using AI (mock AI included if Chrome AI is not available).
    <!-- Screenshot: Show the 'Generated Narrative' section with a generated narrative. -->
*   **AI-Powered Narrative Rewriting:** Refine and rephrase generated narratives with specific instructions (e.g., "make it simpler," "more formal").
*   **Persistent Storage:** Save your generated narratives locally in your browser's storage for future access.
    <!-- Screenshot: Show the 'Saved Narratives' section with a few saved narratives listed. -->
*   **Export Options:** Copy narratives to your clipboard or download them as a `.txt` file.
*   **Clear All Functionality:** Easily reset the application to its initial state.
*   **Responsive UI:** Designed to be usable across various screen sizes.
*   **Accessibility Enhancements:** Includes skip links, ARIA attributes, and visually hidden labels for improved screen reader compatibility.

## How to Run Locally

To run this application on your local machine, you need a simple web server. Python's built-in HTTP server is a convenient option.

```bash
cd /path/to/webapp_patched
python3 -m http.server 8000
```

Then open your browser and go to:  
👉 `http://localhost:8000`

### Configuring Gemini API (Optional)

To enable the full AI-powered storytelling features, you'll need a Google Gemini API key.

1.  **Obtain an API Key:** Visit the [Google AI Studio](https://aistudio.google.com/) to get your API key.
2.  **Update `script.js`:** Open `script.js` and replace `'YOUR_GEMINI_API_KEY'` with your actual API key:
    ```javascript
    const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace this!
    ```
    Without a valid API key, the AI features will remain in a mocked state.

## What's New in This Patched Version

* Fixed CSV parsing (using **PapaParse**) for more reliable data import.
* Fixed **Clear All** bug (now resets content properly with HTML formatting).
* Fixed chart selectors when CSV has only one column.
* Fixed line chart scaling bug (no divide-by-zero errors).
* Added **Pie Chart visualization** option.
* Added **Download Chart as PNG** feature using `html2canvas`.
* Small style tweaks for pie chart slices.

## Adding Screenshots to this README

To make this README even more helpful, you can add screenshots to illustrate the features. Here's how:

1.  **Take Screenshots:** Capture relevant screenshots of the application in action. Ensure they clearly demonstrate the feature described.
2.  **Upload Images:** Upload your screenshots to an image hosting service (e.g., GitHub, Imgur, Cloudinary) or place them in a `docs/img` folder within your repository.
3.  **Embed in README:** Replace the `<!-- Screenshot: ... -->` comments with Markdown image syntax, like this:
    ```markdown
    ![Alt text for the image](link/to/your/image.png)
    ```
    Make sure the `Alt text` accurately describes the image for accessibility.

Enjoy creating data-driven stories 🎉
