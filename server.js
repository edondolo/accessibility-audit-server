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
You are a senior web accessibility auditor.

Analyze the following HTML according to **WCAG 2.1 AA** and return a JSON array of 3–5 **distinct** accessibility issues.

Each object in the array must include:

- "summary": short description of the issue (e.g., "Missing alt text")
- "priority": one of: "critical", "serious", "moderate", "minor"
- "selector": a valid CSS selector that matches the problem element(s)
- "fix": a specific, actionable recommendation
- "wcag": an object with:
  - "number": e.g. "1.1.1"
  - "name": e.g. "Non-text Content"
  - "link": e.g. "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content"

Respond ONLY with a clean JSON array.  
Do not include explanations, intros, or extra text.  
Avoid vague or overly generic issues — use real examples from the provided HTML.

HTML to audit:
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
    const parsed = JSON.parse(raw); // Ensure it's an array
    res.json(parsed); // Return directly to client
  } catch (e) {
    const status = e?.response?.status || 500;
    const msg = e?.response?.data?.error?.message || e.message;
    console.error("OpenAI error:", msg);
    res.status(status).json({ error: "Audit failed", details: msg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Accessibility audit server running on port ${PORT}`));
