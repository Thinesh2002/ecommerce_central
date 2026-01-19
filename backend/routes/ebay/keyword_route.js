const express = require("express");
const router = express.Router();
const {
  fetchKeywords
} = require("../../controllers/ebay/Keyword/keyword_controller");

router.post("/search", fetchKeywords);

module.exports = router;
