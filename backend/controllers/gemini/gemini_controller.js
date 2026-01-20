const { response } = require("express");
const model=require("../../config/gemini/gemini_config");

exports.askGemini = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gemini API error"
    });
  }
};