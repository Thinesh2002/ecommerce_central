const express = require("express");
const router = express.Router();
const { getSellerProfile } = require("../../controllers/ebay/seller_analysis");
const authMiddleware = require("../../middleware/auth_middleware");
const { requirePermission } = require("../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../config/permissions");

router.use(authMiddleware);
router.post("/profile", requirePermission(PERMISSIONS.SELLER_READ), getSellerProfile);

module.exports = router;
