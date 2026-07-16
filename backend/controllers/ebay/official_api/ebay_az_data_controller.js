const EbayAzDataService = require('../../../services/ebay/api/ebayAzDataService');

function fail(res, error, status = 500) {
  const apiError = error?.response?.data || null;
  const message = apiError?.errors?.[0]?.message || apiError?.message || error.message || 'A-Z eBay data failed';
  return res.status(status).json({
    success: false,
    message,
    ebayError: apiError,
    fix: {
      exactSales: 'Add EBAY_REFRESH_TOKEN or EBAY_USER_ACCESS_TOKEN with sell.fulfillment.readonly scope.',
      liveSearch: 'Check EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.',
      note: 'Competitor exact sales are not returned by official Browse API; use internal orders for exact own sales and estimates/snapshots for competitor sales.',
    },
  });
}

exports.keywordAzData = async (req, res) => {
  try {
    const body = req.body || {};
    const keyword = String(body.keyword || '').trim();
    if (!keyword) return res.status(400).json({ success: false, message: 'keyword is required' });

    const data = await EbayAzDataService.getKeywordAzData({
      keyword,
      market: body.market || 'EBAY_GB',
      days: body.days || 30,
      limit: body.limit || 400,
      filters: body.filters || {},
      includeTraffic: body.includeTraffic !== false,
      includeTradingForMatchedItems: body.includeTradingForMatchedItems !== false,
      maxOrderPages: body.maxOrderPages || 20,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error, error.statusCode || 500);
  }
};
