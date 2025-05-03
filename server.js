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
You are a web accessibility expert. Analyze the following HTML and identify all accessibility issues based on WCAG 2.1 AA. Return a structured report with:

- Priority (critical, serious, moderate, minor)
- Issue type and summary
- Affected user group (e.g. screen reader, keyboard-only)
- Short HTML snippet if relevant
- WCAG reference (principle, number, and link)
- Recommendation to fix

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
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      }
    });

    const result = response.data.choices[0].message.content;
    res.json({ report: result });
  } catch (e) {
    console.error("OpenAI API error:", e.message);
    res.status(500).json({ error: "Audit failed", details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
