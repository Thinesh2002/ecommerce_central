const express = require("express");
const router = express.Router();
const taskController = require("../../controllers/task/ebay_eod_task_controller");
const authMiddleware = require("../../middleware/auth_middleware");
const { requirePermission } = require("../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../config/permissions");

router.use(authMiddleware);

router.get("/", requirePermission(PERMISSIONS.TASK_READ), taskController.getAllTasks);
router.get("/master", requirePermission(PERMISSIONS.TASK_READ), taskController.getTaskMaster);
router.get("/summary", requirePermission(PERMISSIONS.TASK_READ), taskController.getTaskSummary);
router.get("/filters", requirePermission(PERMISSIONS.TASK_READ), taskController.getFilterOptions);
router.get("/department", requirePermission(PERMISSIONS.TASK_READ), taskController.getTasksByDepartment);
router.get("/staff", requirePermission(PERMISSIONS.TASK_READ), taskController.getTasksByStaff);
router.get("/:id", requirePermission(PERMISSIONS.TASK_READ), taskController.getTaskById);
router.post("/", requirePermission(PERMISSIONS.TASK_CREATE), taskController.createTask);
router.put("/:id", requirePermission(PERMISSIONS.TASK_UPDATE), taskController.updateTask);
router.put("/:id/verify", requirePermission(PERMISSIONS.TASK_VERIFY), taskController.markVerified);
router.put("/:id/unverify", requirePermission(PERMISSIONS.TASK_VERIFY), taskController.markUnverified);
router.delete("/:id", requirePermission(PERMISSIONS.TASK_DELETE), taskController.deleteTask);
router.delete("/", requirePermission(PERMISSIONS.TASK_DELETE), taskController.bulkDeleteTasks);

module.exports = router;
