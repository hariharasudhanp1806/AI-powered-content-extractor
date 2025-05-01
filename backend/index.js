const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");
require("dotenv").config();
const port = process.env.port || 3000;
const HuggingFace_API_Key = process.env.HuggingFace_API_Key;

const app = express();
app.use(express.json());
app.use(cors());

const Huggingface_Headers = {
  headers: {
    Authorization: `Bearer ${HuggingFace_API_Key}`,
  },
};

async function summarizetext(chunk) {
  const response = await axios.post(
    "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
    { inputs: chunk },
    Huggingface_Headers
  );

  return response.data[0].summary_text;
}

async function extractkeypoints(summary) {
  const response = await axios.post(
    "https://api-inference.huggingface.co/models/ml6team/keyphrase-extraction-distilbert-inspec",
    { inputs: summary },
    Huggingface_Headers
  );
  return response.data.map((item) => item?.word);
}

function createchunks(text) {
  const chunkSize = 1000;
  const chunks = [];
  for (let i = 0; i < 10000; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

app.post("/summarize", async (req, res) => {
  const url = req.body?.url;

  if (!url) {
    console.error("url required");
    return res.status(500).send("url required");
  }
  try {
    const { data, status } = await axios.get(url);
    if (status !== 200) {
      return res
        .status(status)
        .json({ error: "Failed to fetch content from the URL" });
    }
    const $ = cheerio.load(data);
    const text = $("p").text().replace(/\s+/g, " ").trim();
    if (!text || text.length < 50) {
      return res
        .status(400)
        .json({ error: "Could not extract meaningful content from URL" });
    }
    const chunks = createchunks(text);

    const result = [];
    for (const chunk of chunks) {
      const summary = await summarizetext(chunk);
      const keypoints = await extractkeypoints(summary);
      result.push({
        chunk,
        summary,
        keypoints,
      });
    }

    return res.status(200).json({
      url,
      result,
    });
  } catch (e) {
    console.error("Error summarizing text:", e.response?.data || e.message);
    res.status(500).send("Failed to summarize content");
  }
});

app.listen(port, () => console.log(`Server running on ${port}`));
