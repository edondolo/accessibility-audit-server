const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();

// ✅ Enable CORS for all origins
app.use(cors({ origin: "*", methods: ["POST"] }));

// ✅ Support large HTML payloads
app.use(bodyParser.json({ limit: "5mb" }));

// ✅ Read OpenAI key from Render environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ✅ POST /audit: receive HTML, return accessibility audit from ChatGPT
app.post("/audit", async (req, res) => {
  const { html, url } = req.body;

  const prompt = `
You are a web accessibility expert. Analyze the following HTML and identify any accessibility issues based on WCAG 2.1 AA standards.

Return a structured report with:
- Priority level (critical, serious, moderate, minor)
- Issue type and short summary
- Affected user groups (e.g., screen reader, keyboard-only)
- HTML snippet (if applicable)
- WCAG reference (principle, criterion number, URL)
- Recommendation to fix each issue

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
        model: "gpt-3.5-turbo-1106", // ✅ Reliable, fast, good for large input
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      }
    });

    const result = response.data.choices[0].message.content;
    console.log("✅ ChatGPT audit result:\n", result);
    res.json({ report: result });
  } catch (e) {
    console.error("❌ OpenAI API error:", e.message);
    const status = e?.response?.status || 500;
    const msg = e?.response?.data?.error?.message || e.message;
    res.status(status).json({ error: "Audit failed", details: msg });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
