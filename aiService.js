// aiService.js
// Gemini API service wrapper (via proxy)

import { appSettings } from "./settingsManager.js";
import { elements } from "./domElements.js";
import {
  showLoadingOverlay,
  hideLoadingOverlay,
  showNotification,
} from "./utils.js";

const USE_PROXY = true;
const API_PROXY_URL = `${window.API_BASE_URL}/api/gemini`;

export async function callGeminiAPI(promptContent, persona = "neutral") {
  showLoadingOverlay("AI Thinking", "Generating response...");

  try {
    if (USE_PROXY) {
      const response = await fetch(API_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptContent,
          persona,
          maxTokens: appSettings.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }

      const data = await response.json();
      hideLoadingOverlay();

      return data.text || JSON.stringify(data);
    } else {
      // fallback mock (dev mode without server)
      hideLoadingOverlay();
      return `(MOCK) As a ${persona} AI: ${promptContent}`;
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    showNotification(
      `Error calling Gemini API: ${error.message}`,
      "error",
      5000
    );
    hideLoadingOverlay();
    return null;
  }
}