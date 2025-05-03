const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();

// ✅ Allow requests from any origin
app.use(cors({ origin: "*", methods: ["POST"] }));

// ✅ Allow large HTML payloads
app.use(bodyParser.json({ limit: "5mb" }));

// ✅ OpenAI API Key from Render environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ✅ POST /audit: receives page HTML and returns accessibility report
app.post("/audit", async (req, res) => {
  const { html, url } = req.body;

  const prompt = `
You are a senior accessibility expert. Review the following HTML and identify any accessibility issues following WCAG 2.1 AA. 
Return a structured, human-readable report with:

- Priority level (critical, serious, moderate, minor)
- Description of each issue
- Affected user groups (e.g., screen reader, keyboard-only)
- WCAG reference (principle, criterion number, link)
- A small HTML snippet if relevant
- Clear recommendation to fix

HTML content:
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
    console.log("ChatGPT response:", result); // ✅ Debugging log
    res.json({ report: result });
  } catch (e) {
    console.error("OpenAI API error:", e.message);
    res.status(500).json({ error: "Audit failed", details: e.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
