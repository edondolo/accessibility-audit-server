const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.post("/audit", async (req, res) => {
  const { key, html, url } = req.body;
  const prompt = `You are an expert in accessibility and WCAG 2.1. Analyze the following HTML and provide a structured report of issues:\n\n${html}`;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );
    res.json({ report: response.data });
  } catch (e) {
    res.status(500).json({ error: "Audit failed", details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
