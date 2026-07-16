const express = require("express");
const router = express.Router();
const controller = require("../../controllers/permission/permission_controller");
const authMiddleware = require("../../middleware/auth_middleware");
const { requireRole } = require("../../middleware/permission_middleware");
const { ROLE } = require("../../config/permissions");

router.use(authMiddleware);

router.get("/mine", controller.getMine);
router.get("/matrix", requireRole([ROLE.ADMIN]), controller.getMatrix);
router.put("/role/:role", requireRole([ROLE.ADMIN]), controller.updateRolePermissions);

module.exports = router;
