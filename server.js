const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const corsOptions = {
  origin: "*", // allow all origins
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
};

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/audit", async (req, res) => {
  const { html, url } = req.body;

  const prompt = `
You are a web accessibility expert. Analyze the HTML below for accessibility issues using WCAG 2.1 AA.
Return a structured report with:
- Priority (critical, serious, moderate, minor)
- Issue type & summary
- Affected user type (e.g. screen reader users, low vision, keyboard-only)
- CSS selector or XPath (if obvious)
- HTML snippet of the problematic code
- WCAG reference with principle, number, and URL
- Recommendation to fix

HTML to analyze:
${html}`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }
    );
    res.json({ report: response.data });
  } catch (e) {
    res.status(500).json({ error: "Audit failed", details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
