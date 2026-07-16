const express = require("express");
const router = express.Router();
const { askGemini } = require("../../controllers/gemini/gemini_controller");
const authMiddleware = require("../../middleware/auth_middleware");
const { requirePermission } = require("../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../config/permissions");

router.use(authMiddleware);
router.post("/ask", requirePermission(PERMISSIONS.AI_USE), askGemini);

module.exports = router;
