const express = require("express");
const router = express.Router();

const {
  getSellerProfile
} = require("../../controllers/ebay/seller_analysis");

router.post("/profile", getSellerProfile);

module.exports = router;
