const express = require("express");
const router = express.Router();
const accountController = require("../../../controllers/ebay/account/ebay_account_controller");
const authMiddleware = require("../../../middleware/auth_middleware");
const { requirePermission } = require("../../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../../config/permissions");

router.use(authMiddleware);
router.get("/", requirePermission(PERMISSIONS.ACCOUNT_READ), accountController.getAll);
router.post("/", requirePermission(PERMISSIONS.ACCOUNT_CREATE), accountController.create);
router.put("/:id", requirePermission(PERMISSIONS.ACCOUNT_UPDATE), accountController.update);
router.delete("/:id", requirePermission(PERMISSIONS.ACCOUNT_DELETE), accountController.delete);

module.exports = router;
