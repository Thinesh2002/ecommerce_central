const express = require("express");
const router = express.Router();
const { fetchKeywords } = require("../../controllers/ebay/Keyword/keyword_controller");
const {
  advancedResearch,
  bulkKeywordResearch,
  keywordHistory,
  latestResearch,
  getResearchRun,
  exportResearch,
  titleBuilder,
} = require("../../controllers/ebay/Keyword/advanced_keyword_controller");
const authMiddleware = require("../../middleware/auth_middleware");
const { requirePermission } = require("../../middleware/permission_middleware");
const { PERMISSIONS } = require("../../config/permissions");

router.use(authMiddleware);

// Existing API kept unchanged
router.post("/search", requirePermission(PERMISSIONS.KEYWORD_READ), fetchKeywords);
router.post("/advanced-research", requirePermission(PERMISSIONS.KEYWORD_ADVANCED), advancedResearch);

// Pro research APIs added on top of the current structure
router.post("/pro/research", requirePermission(PERMISSIONS.KEYWORD_ADVANCED), advancedResearch);
router.post("/pro/bulk-compare", requirePermission(PERMISSIONS.KEYWORD_ADVANCED), bulkKeywordResearch);
router.post("/pro/title-builder", requirePermission(PERMISSIONS.KEYWORD_ADVANCED), titleBuilder);
router.get("/pro/history", requirePermission(PERMISSIONS.KEYWORD_ADVANCED), keywordHistory);
router.get("/pro/latest", requirePermission(PERMISSIONS.KEYWORD_ADVANCED), latestResearch);
router.get("/pro/run/:runId", requirePermission(PERMISSIONS.KEYWORD_ADVANCED), getResearchRun);
router.get("/pro/export/:runId", requirePermission(PERMISSIONS.KEYWORD_ADVANCED), exportResearch);

module.exports = router;
