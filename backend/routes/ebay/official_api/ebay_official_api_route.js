const express = require("express");
const router = express.Router();
const authMiddleware = require("../../../middleware/auth_middleware");
const { requirePermission } = require("../../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../../config/permissions");
const controller = require("../../../controllers/ebay/official_api/ebay_official_api_controller");
const azController = require("../../../controllers/ebay/official_api/ebay_az_data_controller");

const keywordPermission = requirePermission(PERMISSIONS.KEYWORD_ADVANCED || PERMISSIONS.KEYWORD_READ);

router.use(authMiddleware);

router.get("/status", keywordPermission, controller.apiStatus);
router.get("/oauth/test-user-token", keywordPermission, controller.testUserToken);
router.post("/oauth/refresh-user-token", keywordPermission, controller.refreshUserTokenNow);

router.post("/browse/live-search", keywordPermission, controller.liveBrowseSearch);

// A-Z keyword data: live listings + exact own sales + traffic diagnostics + competitor estimates
router.post("/keyword/az-data", keywordPermission, azController.keywordAzData);

router.get("/orders", keywordPermission, controller.fulfillmentOrders);
router.get("/orders/sales-summary", keywordPermission, controller.orderSalesSummary);
router.post("/orders/sales-summary", keywordPermission, controller.orderSalesSummary);

router.get("/inventory/items", keywordPermission, controller.inventoryItems);

router.get("/analytics/traffic", keywordPermission, controller.trafficReport);
router.post("/analytics/traffic", keywordPermission, controller.trafficReport);
router.get("/analytics/seller-standards", keywordPermission, controller.sellerStandardsProfile);

router.post("/marketing/report-task", keywordPermission, controller.createMarketingReportTask);
router.get("/marketing/report-tasks", keywordPermission, controller.marketingReportTasks);
router.get("/marketing/report/:reportId", keywordPermission, controller.downloadMarketingReport);

router.get("/finances/transactions", keywordPermission, controller.financesTransactions);

router.get("/trading/item/:itemId", keywordPermission, controller.tradingGetItem);
router.get("/trading/item/:itemId/transactions", keywordPermission, controller.tradingItemTransactions);

module.exports = router;
