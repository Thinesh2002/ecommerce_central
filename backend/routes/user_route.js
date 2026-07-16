const express = require("express");
const router = express.Router();
const controller = require("../controllers/user_controllers/user_controller");
const authMiddleware = require("../middleware/auth_middleware");
const { requirePermission } = require("../middleware/permission_middleware");
const { PERMISSIONS } = require("../config/permissions");

router.post("/login", controller.login);
// Keep this route only if you want public self-signup. The admin panel uses /register below.
router.post("/public-register", controller.publicRegister);

router.use(authMiddleware);

router.get("/me", controller.me);
router.post("/register", requirePermission(PERMISSIONS.USER_CREATE), controller.register);
router.get("/users", requirePermission(PERMISSIONS.USER_READ), controller.listUsers);
router.get("/stats", requirePermission(PERMISSIONS.USER_READ), controller.stats);
router.get("/:id", requirePermission(PERMISSIONS.USER_READ), controller.getUser);
router.put("/:id", requirePermission(PERMISSIONS.USER_UPDATE), controller.update);
router.delete("/:id", requirePermission(PERMISSIONS.USER_DELETE), controller.delete);

module.exports = router;
