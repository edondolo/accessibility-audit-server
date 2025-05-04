const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*", methods: ["POST"] }));
app.use(bodyParser.json({ limit: "5mb" }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/audit", async (req, res) => {
  const { html, url } = req.body;

  const prompt = `
You are a web accessibility expert. Analyze the HTML below and return a JSON array of accessibility issues following WCAG 2.1 AA. For each issue, include:

- "summary": short label of the issue (e.g., "Missing alt text")
- "priority": one of "critical", "serious", "moderate", or "minor"
- "selector": a CSS selector or matching hint like "img", "button[aria-label='']", etc.
- "htmlSnippet": the related HTML line
- "wcag": the WCAG reference (e.g. "1.1.1 Non-text Content")
- "fix": a brief recommendation

Respond with **only** the JSON array. No intro text.

HTML to analyze:
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
        model: "gpt-3.5-turbo-1106",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      }
    });

    const result = response.data.choices[0].message.content;
    console.log("ChatGPT structured issues:\n", result);
    res.json({ issues: result });
  } catch (e) {
    const status = e?.response?.status || 500;
    const msg = e?.response?.data?.error?.message || e.message;
    res.status(status).json({ error: "Audit failed", details: msg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
