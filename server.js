const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();

// ✅ Allow cross-origin requests from any website
app.use(cors({ origin: "*", methods: ["POST"] }));

// ✅ Support large HTML payloads
app.use(bodyParser.json({ limit: "5mb" }));

// ✅ Read your OpenAI API key from environment (Render → Environment)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ✅ Accessibility audit endpoint
app.post("/audit", async (req, res) => {
  const { html, url } = req.body;

  const prompt = `
You are a web accessibility expert. Analyze the HTML below and return a structured accessibility audit using WCAG 2.1 AA guidelines. 
The report should include:
- Priority level (critical, serious, moderate, minor)
- Description of the issue
- Affected user groups (e.g. screen reader, keyboard-only)
- WCAG reference (principle, criterion number, and URL)
- HTML snippet if relevant
- Recommendation to fix the issue

HTML:
${html}
`;

  try {
    const response = await axios({
      method: "post",
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      data: {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      }
    });

    const result = response.data.choices[0].message.content;
    console.log("ChatGPT audit result:", result); // For Render logs
    res.json({ report: result });
  } catch (e) {
    console.error("OpenAI API error:", e.message);
    res.status(500).json({ error: "Audit failed", details: e.message });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
