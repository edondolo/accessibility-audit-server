const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/audit", async (req, res) => {
  const { html, url } = req.body;
  const prompt = `You are an expert in accessibility and WCAG 2.1. Analyze the following HTML and provide a structured list of accessibility issues:\n\n${html}`;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    res.json({ report: response.data });
  } catch (e) {
    res.status(500).json({ error: "Audit failed", details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
