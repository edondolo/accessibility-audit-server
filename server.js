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

Analyze the following HTML according to **WCAG 2.1 AA**. Return your response as a **JSON array** of accessibility issues.

For each issue, include:

- "summary": Short description of the issue (e.g., "Missing alt text")
- "priority": One of: "critical", "serious", "moderate", or "minor"
- "selector": A simple CSS selector to identify the element(s)
- "fix": A clear, specific recommendation
- "wcag": an object with:
  - "number": WCAG success criterion (e.g., "1.1.1")
  - "name": Criterion name (e.g., "Non-text Content")
  - "link": Full WCAG documentation link (e.g., "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content")

Group similar issues when possible, but preserve useful selectors.  
⚠️ Return **only a raw JSON array**. Do NOT include any explanation or commentary.

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
    const parsed = JSON.parse(raw); // ensure array format
    res.json(parsed); // send plain array to the client
  } catch (e) {
    const status = e?.response?.status || 500;
    const msg = e?.response?.data?.error?.message || e.message;
    console.error("OpenAI error:", msg);
    res.status(status).json({ error: "Audit failed", details: msg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
