const express = require("express");
const router = express.Router();
const { auditListing } = require("../../../controllers/ebay/ListingAuditController/auditController");
const authMiddleware = require("../../../middleware/auth_middleware");
const { requirePermission } = require("../../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../../config/permissions");

router.use(authMiddleware);
router.post("/audit", requirePermission(PERMISSIONS.LISTING_AUDIT), auditListing);

module.exports = router;
