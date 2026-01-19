const express = require("express");
const router = express.Router();

const {
  ebaySellerRoute
} = require("../../controllers/ebay/seller_analysis");

router.post("/profile", ebaySellerRoute);

module.exports = router;
