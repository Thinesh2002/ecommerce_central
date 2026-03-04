const express = require("express");
const router = express.Router();

const { auditListing } = require("../../../controllers/ebay/ListingAuditController/auditController");

router.post("/audit", auditListing);

module.exports = router;
