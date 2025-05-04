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
You are a senior accessibility expert.

Analyze the following HTML and return a JSON array of accessibility issues using **WCAG 2.1 AA** standards. For each issue, return an object with:

- "summary": short label (e.g., "Missing alt text")
- "priority": "critical", "serious", "moderate", or "minor"
- "selector": a simple CSS selector that identifies the element(s)
- "wcag": include both the number and full name (e.g., "1.1.1 Non-text Content") and the official WCAG link
- "fix": clear, specific recommendation for how to fix the issue

Group similar issues (e.g., multiple images without alt text) where possible to reduce length.

Respond ONLY with the raw JSON array. Do not include intro or explanation.

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
        model: "gpt-3.5-turbo-1106",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      }
    });

    const raw = response.data.choices[0].message.content;
    const parsed = JSON.parse(raw); // converts JSON string into real JS array
    res.json(parsed); // send the array directly to the client
  } catch (e) {
    const status = e?.response?.status || 500;
    const msg = e?.response?.data?.error?.message || e.message;
    console.error("OpenAI error:", msg);
    res.status(status).json({ error: "Audit failed", details: msg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
