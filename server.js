// server.js
// Lightweight proxy for Gemini API (Express + node-fetch)

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("⚠️ Warning: No GEMINI_API_KEY found in .env file!");
}

const GEMINI_MODEL = "gemini-1.5-pro-latest"; // you can change to gemini-pro etc.
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Proxy endpoint
app.post("/api/gemini", async (req, res) => {
  try {
    const { promptContent, persona, maxTokens } = req.body;

    const body = {
      contents: [
        {
          parts: [{ text: `As a ${persona} AI, ${promptContent}` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: parseInt(maxTokens) || 1024,
      },
    };

    const apiRes = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      console.error("Gemini API error:", data);
      return res
        .status(apiRes.status)
        .json({ error: data.error?.message || "Unknown Gemini API error" });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text.";
    res.json({ text });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message || "Proxy server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gemini proxy running at http://localhost:${PORT}`);
});