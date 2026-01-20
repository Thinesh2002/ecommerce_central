const express = require("express");
const router = express.Router();
const { askGemini } = require("../../controllers/gemini/gemini_controller");

router.post("/ask", askGemini);

module.exports = router;
