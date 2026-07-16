const express = require("express");
const router = express.Router();
const staffController = require("../../controllers/team/team_controller");
const authMiddleware = require("../../middleware/auth_middleware");
const { requirePermission } = require("../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../config/permissions");

router.use(authMiddleware);

router.get("/teams", requirePermission(PERMISSIONS.TEAM_READ), staffController.listTeams);
router.post("/teams", requirePermission(PERMISSIONS.TEAM_CREATE), staffController.createTeam);

router.get("/", requirePermission(PERMISSIONS.TEAM_READ), staffController.getAll);
router.get("/search", requirePermission(PERMISSIONS.TEAM_READ), staffController.search);
router.get("/:id", requirePermission(PERMISSIONS.TEAM_READ), staffController.getById);
router.post("/", requirePermission(PERMISSIONS.TEAM_CREATE), staffController.create);
router.put("/:id", requirePermission(PERMISSIONS.TEAM_UPDATE), staffController.update);
router.patch("/:id/status", requirePermission(PERMISSIONS.TEAM_UPDATE), staffController.changeStatus);
router.delete("/:id", requirePermission(PERMISSIONS.TEAM_DELETE), staffController.delete);

module.exports = router;
