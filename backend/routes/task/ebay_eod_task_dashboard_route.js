const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/task/task_dashboard_controller");
const authMiddleware = require("../../middleware/auth_middleware");
const { requirePermission } = require("../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../config/permissions");

router.use(authMiddleware);
router.get("/summary", requirePermission(PERMISSIONS.TASK_READ), dashboardController.getSummary);

module.exports = router;
