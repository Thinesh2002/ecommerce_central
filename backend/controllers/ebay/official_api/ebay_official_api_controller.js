const OfficialEbayDataService = require("../../../services/ebay/api/ebayOfficialDataService");
const { getEbayUserToken, refreshUserToken, DEFAULT_USER_SCOPES } = require("../../../config/ebay/ebayUserAuth");

function ok(res, data) {
  return res.json({ success: true, ...data });
}

function fail(res, error, status = 500) {
  const apiError = error?.response?.data || null;
  const message = apiError?.errors?.[0]?.message || apiError?.message || error.message || "eBay API error";
  return res.status(status).json({
    success: false,
    message,
    ebayError: apiError,
  });
}

exports.apiStatus = async (req, res) => {
  const checks = {
    appCredentials: Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
    tradingToken: Boolean(process.env.EBAY_TRADING_TOKEN),
    userAccessToken: Boolean(process.env.EBAY_USER_ACCESS_TOKEN || process.env.EBAY_ACCESS_TOKEN),
    refreshToken: Boolean(process.env.EBAY_REFRESH_TOKEN),
    geminiKey: Boolean(process.env.GEMINI_API_KEY),
  };

  return ok(res, {
    checks,
    recommendedEnv: [
      "EBAY_CLIENT_ID",
      "EBAY_CLIENT_SECRET",
      "EBAY_TRADING_TOKEN",
      "EBAY_REFRESH_TOKEN or EBAY_USER_ACCESS_TOKEN",
      "GEMINI_API_KEY",
    ],
    supportedSources: [
      "Browse API - live active listing search",
      "Trading API - own item watch count and listing transactions",
      "Fulfillment API - own order and 30-day sales summary",
      "Analytics API - traffic, impressions, views and purchases",
      "Marketing API - promoted listing and keyword PPC reports",
      "Inventory API - own SKU and offer data",
      "Finances API - fees, transactions and earnings data",
    ],
  });
};

exports.testUserToken = async (req, res) => {
  try {
    const token = await getEbayUserToken(DEFAULT_USER_SCOPES);
    return ok(res, { tokenReady: Boolean(token), tokenPreview: token ? `${token.slice(0, 8)}...` : null });
  } catch (error) {
    return fail(res, error, 400);
  }
};

exports.refreshUserTokenNow = async (req, res) => {
  try {
    const token = await refreshUserToken(req.body?.scopes || DEFAULT_USER_SCOPES);
    return ok(res, { refreshed: Boolean(token), tokenPreview: token ? `${token.slice(0, 8)}...` : null });
  } catch (error) {
    return fail(res, error, 400);
  }
};

exports.liveBrowseSearch = async (req, res) => {
  try {
    const { keyword, market, limit, offset, filters } = req.body;
    if (!keyword) return res.status(400).json({ success: false, message: "keyword is required" });
    const data = await OfficialEbayDataService.liveBrowseSearch({ keyword, market, limit, offset, filters });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.orderSalesSummary = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.getOrderSalesSummary({
      days: req.query.days || req.body?.days || 30,
      limit: req.query.limit || req.body?.limit || 200,
      maxPages: req.query.maxPages || req.body?.maxPages || 10,
      itemId: req.query.itemId || req.body?.itemId,
      sku: req.query.sku || req.body?.sku,
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.fulfillmentOrders = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.getFulfillmentOrders({
      days: req.query.days || 30,
      limit: req.query.limit || 200,
      offset: req.query.offset || 0,
      orderFulfillmentStatus: req.query.orderFulfillmentStatus,
      filter: req.query.filter,
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.inventoryItems = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.getInventoryItems({
      limit: req.query.limit || 200,
      offset: req.query.offset || 0,
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.trafficReport = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.getTrafficReport({
      marketplace: req.query.marketplace || req.query.market || req.body?.marketplace || req.body?.market || "EBAY_GB",
      dimension: req.query.dimension || req.body?.dimension || "LISTING",
      metric: req.query.metric || req.body?.metric,
      dateFrom: req.query.dateFrom || req.body?.dateFrom,
      dateTo: req.query.dateTo || req.body?.dateTo,
      listingIds: req.query.listingIds || req.body?.listingIds,
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.sellerStandardsProfile = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.getSellerStandardsProfile({
      program: req.query.program,
      cycle: req.query.cycle,
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.createMarketingReportTask = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.createMarketingReportTask(req.body || {});
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.marketingReportTasks = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.getMarketingReportTasks({
      limit: req.query.limit || 20,
      offset: req.query.offset || 0,
      reportType: req.query.reportType,
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.downloadMarketingReport = async (req, res) => {
  try {
    const report = await OfficialEbayDataService.downloadMarketingReport(req.params.reportId);
    res.setHeader("Content-Type", report.contentType);
    res.setHeader("Content-Disposition", report.disposition || `attachment; filename=ebay-marketing-report-${req.params.reportId}.tsv.gz`);
    return res.send(report.buffer);
  } catch (error) {
    return fail(res, error);
  }
};

exports.financesTransactions = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.getFinancesTransactions({
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      limit: req.query.limit || 200,
      offset: req.query.offset || 0,
      transactionType: req.query.transactionType,
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.tradingGetItem = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.tradingGetItem({
      itemId: req.params.itemId || req.query.itemId,
      marketplace: req.query.market || req.query.marketplace || "EBAY_GB",
      includeWatchCount: String(req.query.includeWatchCount || "true") !== "false",
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};

exports.tradingItemTransactions = async (req, res) => {
  try {
    const data = await OfficialEbayDataService.tradingGetItemTransactions({
      itemId: req.params.itemId || req.query.itemId,
      marketplace: req.query.market || req.query.marketplace || "EBAY_GB",
      days: req.query.days || 30,
      pageNumber: req.query.page || 1,
      entriesPerPage: req.query.limit || 200,
    });
    return ok(res, { data });
  } catch (error) {
    return fail(res, error);
  }
};
