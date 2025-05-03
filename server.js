const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();

// ✅ Enable CORS for all origins
const corsOptions = {
  origin: "*",
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ POST /audit — performs accessibility audit using Gemini
app.post("/audit", async (req, res) => {
  const { html, url } = req.body;

  // 🧠 The prompt we'll send to Gemini
  const prompt = `
You are a web accessibility expert. Analyze the HTML below using WCAG 2.1 AA guidelines.
Return a structured report of accessibility issues including:
- Priority (critical, serious, moderate, minor)
- Type and summary of the issue
- Affected user type (e.g. screen reader users, keyboard-only users)
- HTML snippet or location if obvious
- WCAG reference (principle, number, and URL)
- Recommendation on how to fix the issue

HTML to analyze:
${html}
`;

  try {
    // ✅ Gemini API request
    const response = await axios({
      method: "post",
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }
    });

    // ✅ Return the structured audit response to the browser
    res.json({ report: response.data });
  } catch (e) {
    console.error("Gemini request failed:", e.message);
    res.status(500).json({ error: "Audit failed", details: e.message });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
