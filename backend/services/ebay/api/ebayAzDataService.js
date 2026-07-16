const OfficialEbayDataService = require('./ebayOfficialDataService');

const safeNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const safeText = (value = '') => String(value || '').trim();

function normaliseKeyword(text = '') {
  return safeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function legacyItemId(itemId = '') {
  const raw = safeText(itemId);
  // Browse itemId often looks like v1|123456789012|0. Fulfillment legacyItemId is numeric.
  const parts = raw.split('|').filter(Boolean);
  const numeric = parts.find((p) => /^\d{9,}$/.test(p)) || raw.match(/\d{9,}/)?.[0];
  return numeric || raw;
}

function currencyOf(line, order = {}) {
  return (
    line.total?.currency ||
    line.lineItemCost?.currency ||
    order.pricingSummary?.total?.currency ||
    order.paymentSummary?.payments?.[0]?.amount?.currency ||
    ''
  );
}

function lineRevenue(line) {
  const total = safeNum(line.total?.value, NaN);
  if (Number.isFinite(total)) return total;
  const cost = safeNum(line.lineItemCost?.value, 0);
  const qty = safeNum(line.quantity, 0);
  return Number((cost * Math.max(qty, 1)).toFixed(2));
}

function normaliseOrderLine(order, line) {
  const itemId = legacyItemId(line.legacyItemId || line.itemId || line.listingMarketplaceId || '');
  const sku = safeText(line.sku || line.legacyVariationId || '');
  const qty = safeNum(line.quantity, 0);
  const revenue = lineRevenue(line);
  const title = safeText(line.title || line.lineItemFulfillmentStatus || '');
  return {
    orderId: order.orderId,
    creationDate: order.creationDate,
    orderFulfillmentStatus: order.orderFulfillmentStatus,
    itemId,
    sku,
    title,
    quantitySold: qty,
    revenue,
    currency: currencyOf(line, order),
    unitPrice: qty > 0 ? Number((revenue / qty).toFixed(2)) : revenue,
  };
}

function buildOrderIndexes(orders = [], keyword = '') {
  const keywordClean = normaliseKeyword(keyword);
  const byItemId = new Map();
  const bySku = new Map();
  const lines = [];

  const addToMap = (map, key, line) => {
    if (!key) return;
    const row = map.get(key) || {
      key,
      orders: new Set(),
      quantitySold: 0,
      revenue: 0,
      currency: line.currency || '',
      titles: new Set(),
      skus: new Set(),
      itemIds: new Set(),
      lines: [],
    };
    row.orders.add(line.orderId);
    row.quantitySold += line.quantitySold;
    row.revenue += line.revenue;
    row.currency = row.currency || line.currency || '';
    if (line.title) row.titles.add(line.title);
    if (line.sku) row.skus.add(line.sku);
    if (line.itemId) row.itemIds.add(line.itemId);
    row.lines.push(line);
    map.set(key, row);
  };

  orders.forEach((order) => {
    (order.lineItems || []).forEach((line) => {
      const normalised = normaliseOrderLine(order, line);
      if (!normalised.itemId && !normalised.sku && !normalised.title) return;
      lines.push(normalised);
      addToMap(byItemId, normalised.itemId, normalised);
      addToMap(bySku, normalised.sku, normalised);
    });
  });

  const keywordLines = keywordClean
    ? lines.filter((line) => normaliseKeyword(`${line.title} ${line.sku} ${line.itemId}`).includes(keywordClean))
    : lines;

  return { byItemId, bySku, lines, keywordLines };
}

function mapRow(row) {
  if (!row) return null;
  return {
    orders: row.orders.size,
    quantitySold: row.quantitySold,
    revenue: Number(row.revenue.toFixed(2)),
    currency: row.currency,
    titles: [...row.titles].filter(Boolean).slice(0, 5),
    skus: [...row.skus].filter(Boolean).slice(0, 20),
    itemIds: [...row.itemIds].filter(Boolean).slice(0, 20),
    lines: row.lines.slice(0, 20),
  };
}

function normaliseLiveItem(item, rank) {
  const itemId = legacyItemId(item.itemId || item.legacyItemId || '');
  const price = safeNum(item.price?.value, 0);
  const shipping = safeNum(item.shippingOptions?.[0]?.shippingCost?.value, 0);
  return {
    rank,
    itemId,
    browseItemId: item.itemId || '',
    title: safeText(item.title || 'Untitled'),
    seller: safeText(item.seller?.username || 'Unknown'),
    sellerFeedback: safeNum(item.seller?.feedbackScore, 0),
    price,
    currency: item.price?.currency || '',
    shippingCost: shipping,
    totalPrice: Number((price + shipping).toFixed(2)),
    condition: item.condition || 'N/A',
    category: item.categories?.[0]?.categoryName || 'Uncategorised',
    image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null,
    itemUrl: item.itemWebUrl || null,
    buyingOptions: item.buyingOptions || [],
    raw: item,
  };
}

function estimateCompetitorSales(row, marketMedianPrice = 0) {
  // Official eBay public Browse data does not expose competitor order history.
  // This is only a directional score, not exact sales.
  const sellerSignal = Math.min(Math.log10(row.sellerFeedback + 1) * 1.8, 12);
  const priceSignal = marketMedianPrice && row.totalPrice <= marketMedianPrice ? 8 : 4;
  const rankSignal = Math.max(0, 30 - row.rank) / 3;
  const optionSignal = row.buyingOptions?.includes('FIXED_PRICE') ? 4 : 1;
  return Math.max(0, Math.round((sellerSignal + priceSignal + rankSignal + optionSignal) / 3));
}

async function fetchAllLivePages({ keyword, market, limit, filters }) {
  const pageLimit = 200;
  const max = Math.min(Math.max(Number(limit) || 200, 1), 1000);
  const pages = Math.ceil(max / pageLimit);
  const items = [];
  let total = 0;

  for (let p = 0; p < pages; p += 1) {
    const page = await OfficialEbayDataService.liveBrowseSearch({
      keyword,
      market,
      limit: Math.min(pageLimit, max - items.length),
      offset: p * pageLimit,
      filters,
    });
    total = safeNum(page.total, total);
    items.push(...(page.items || []));
    if (!page.next || !page.items?.length || items.length >= max) break;
  }

  return { total, items };
}

async function getAllOrdersForDays({ days = 30, maxPages = 20, limit = 200 }) {
  const allOrders = [];
  let offset = 0;
  const pages = Math.max(Number(maxPages) || 1, 1);
  for (let page = 0; page < pages; page += 1) {
    const data = await OfficialEbayDataService.getFulfillmentOrders({ days, limit, offset });
    const orders = data.orders || [];
    allOrders.push(...orders);
    if (!data.next || !orders.length) break;
    offset += Number(limit) || 200;
  }
  return allOrders;
}

function buildSalesSummary(lines = []) {
  const orders = new Set();
  const byItemId = new Map();
  const bySku = new Map();
  let quantitySold = 0;
  let revenue = 0;
  let currency = '';

  lines.forEach((line) => {
    orders.add(line.orderId);
    quantitySold += safeNum(line.quantitySold, 0);
    revenue += safeNum(line.revenue, 0);
    currency = currency || line.currency || '';
    const add = (map, key, type) => {
      if (!key) return;
      const row = map.get(key) || { [type]: key, orders: new Set(), quantitySold: 0, revenue: 0, currency, titles: new Set() };
      row.orders.add(line.orderId);
      row.quantitySold += line.quantitySold;
      row.revenue += line.revenue;
      row.currency = row.currency || line.currency || '';
      if (line.title) row.titles.add(line.title);
      map.set(key, row);
    };
    add(byItemId, line.itemId, 'itemId');
    add(bySku, line.sku, 'sku');
  });

  const clean = (row) => ({
    ...row,
    orders: row.orders.size,
    revenue: Number(row.revenue.toFixed(2)),
    titles: [...row.titles].filter(Boolean).slice(0, 5),
  });

  return {
    orders: orders.size,
    quantitySold,
    revenue: Number(revenue.toFixed(2)),
    currency,
    byItemId: [...byItemId.values()].map(clean).sort((a, b) => b.quantitySold - a.quantitySold),
    bySku: [...bySku.values()].map(clean).sort((a, b) => b.quantitySold - a.quantitySold),
  };
}

async function getKeywordAzData({
  keyword,
  market = 'EBAY_GB',
  days = 30,
  limit = 400,
  filters = {},
  includeTraffic = true,
  includeTradingForMatchedItems = true,
  maxOrderPages = 20,
}) {
  if (!keyword) throw new Error('keyword is required');

  const diagnostics = [];
  const sources = {
    liveBrowse: { status: 'pending', exact: true },
    ownOrders: { status: 'pending', exact: true },
    traffic: { status: includeTraffic ? 'pending' : 'skipped', exact: true },
    tradingOwnItems: { status: includeTradingForMatchedItems ? 'pending' : 'skipped', exact: true },
    competitorSales: { status: 'estimated_only', exact: false },
  };

  let live;
  try {
    live = await fetchAllLivePages({ keyword, market, limit, filters });
    sources.liveBrowse = { status: 'ok', exact: true, rows: live.items.length, total: live.total };
  } catch (error) {
    sources.liveBrowse = { status: 'failed', exact: true, error: error.message, ebayError: error.response?.data };
    throw error;
  }

  const liveRows = live.items.map((item, idx) => normaliseLiveItem(item, idx + 1));
  const prices = liveRows.map((row) => row.totalPrice).filter((price) => price > 0).sort((a, b) => a - b);
  const medianPrice = prices.length ? prices[Math.floor(prices.length / 2)] : 0;

  let orders = [];
  let orderIndexes = { byItemId: new Map(), bySku: new Map(), lines: [], keywordLines: [] };
  try {
    orders = await getAllOrdersForDays({ days, maxPages: maxOrderPages, limit: 200 });
    orderIndexes = buildOrderIndexes(orders, keyword);
    sources.ownOrders = {
      status: 'ok',
      exact: true,
      ordersFetched: orders.length,
      totalLines: orderIndexes.lines.length,
      keywordMatchedLines: orderIndexes.keywordLines.length,
    };
  } catch (error) {
    sources.ownOrders = {
      status: 'failed',
      exact: true,
      error: error.message,
      setupRequired: 'Need EBAY_REFRESH_TOKEN or EBAY_USER_ACCESS_TOKEN with sell.fulfillment.readonly scope.',
      ebayError: error.response?.data,
    };
    diagnostics.push('Own exact sales failed. Check user OAuth token and sell.fulfillment.readonly scope.');
  }

  const rows = liveRows.map((row) => {
    const exactByItem = mapRow(orderIndexes.byItemId.get(row.itemId));
    const estimatedCompetitorSales = estimateCompetitorSales(row, medianPrice);
    const exactSales = exactByItem || null;
    return {
      ...row,
      exactOwnSales30d: exactSales?.quantitySold || 0,
      exactOwnRevenue30d: exactSales?.revenue || 0,
      exactOwnOrders30d: exactSales?.orders || 0,
      exactOwnSalesData: Boolean(exactSales),
      exactOwnSalesMatchedBy: exactSales ? 'itemId' : null,
      estimatedCompetitorSales30d: exactSales ? exactSales.quantitySold : estimatedCompetitorSales,
      estimatedCompetitorRevenue30d: Number(((exactSales ? exactSales.quantitySold : estimatedCompetitorSales) * row.totalPrice).toFixed(2)),
      dataType: exactSales ? 'Exact own-account sales' : 'Competitor estimate from live signals',
      ownSalesDetails: exactSales,
    };
  });

  const keywordSalesSummary = buildSalesSummary(orderIndexes.keywordLines);
  const exactMatchedRows = rows.filter((row) => row.exactOwnSalesData);

  let traffic = null;
  if (includeTraffic) {
    try {
      const matchedListingIds = exactMatchedRows.map((row) => row.itemId).filter(Boolean).slice(0, 200);
      traffic = await OfficialEbayDataService.getTrafficReport({
        marketplace: market,
        dimension: matchedListingIds.length ? 'LISTING' : 'DAY',
        listingIds: matchedListingIds.length ? matchedListingIds : undefined,
      });
      sources.traffic = { status: 'ok', exact: true, rows: Array.isArray(traffic.records) ? traffic.records.length : undefined };
    } catch (error) {
      sources.traffic = {
        status: 'failed',
        exact: true,
        error: error.message,
        setupRequired: 'Need sell.analytics.readonly scope and marketplace supported by Analytics Traffic Report.',
        ebayError: error.response?.data,
      };
      diagnostics.push('Traffic data failed. Sales can still show from Orders API.');
    }
  }

  const tradingRows = [];
  if (includeTradingForMatchedItems && exactMatchedRows.length) {
    const itemsToCheck = exactMatchedRows.slice(0, 25);
    for (const item of itemsToCheck) {
      try {
        const detail = await OfficialEbayDataService.tradingGetItem({ itemId: item.itemId, marketplace: market, includeWatchCount: true });
        tradingRows.push(detail);
      } catch (error) {
        tradingRows.push({ itemId: item.itemId, error: error.message, ebayError: error.response?.data });
      }
    }
    sources.tradingOwnItems = { status: 'ok', exact: true, checked: tradingRows.length };
  }

  const totalExactOwnQty = exactMatchedRows.reduce((s, row) => s + row.exactOwnSales30d, 0);
  const totalExactOwnRevenue = exactMatchedRows.reduce((s, row) => s + row.exactOwnRevenue30d, 0);
  const totalEstimatedQty = rows.reduce((s, row) => s + row.estimatedCompetitorSales30d, 0);
  const totalEstimatedRevenue = rows.reduce((s, row) => s + row.estimatedCompetitorRevenue30d, 0);

  if (!process.env.EBAY_REFRESH_TOKEN && !process.env.EBAY_USER_ACCESS_TOKEN && !process.env.EBAY_ACCESS_TOKEN) {
    diagnostics.push('No seller OAuth token found. Live search works, but exact own sales/traffic/PPC will not work.');
  }

  return {
    keyword,
    market,
    days: Number(days) || 30,
    generatedAt: new Date().toISOString(),
    summary: {
      liveTotalListings: live.total,
      liveRows: rows.length,
      exactOwnMatchedListings: exactMatchedRows.length,
      exactOwnSalesQty: totalExactOwnQty,
      exactOwnRevenue: Number(totalExactOwnRevenue.toFixed(2)),
      exactKeywordOrders: keywordSalesSummary.orders,
      exactKeywordSalesQty: keywordSalesSummary.quantitySold,
      exactKeywordRevenue: keywordSalesSummary.revenue,
      estimatedMarketSalesQty: totalEstimatedQty,
      estimatedMarketRevenue: Number(totalEstimatedRevenue.toFixed(2)),
      medianTotalPrice: Number(medianPrice.toFixed(2)),
    },
    rows,
    exactSales: {
      source: 'eBay Fulfillment Orders API',
      keywordSummary: keywordSalesSummary,
      byItemId: keywordSalesSummary.byItemId,
      bySku: keywordSalesSummary.bySku,
      rawKeywordLines: orderIndexes.keywordLines.slice(0, 300),
    },
    traffic,
    tradingOwnItems: tradingRows,
    sources,
    diagnostics,
    dataRules: {
      exactOwnSales: 'Available when seller OAuth token has sell.fulfillment.readonly scope.',
      exactOwnTraffic: 'Available when seller OAuth token has sell.analytics.readonly scope and marketplace/report is supported.',
      exactCompetitorSales: 'Not available from eBay Browse API. Competitor sales shown here are estimates unless you import sold reports or use an authorised historical data source.',
    },
  };
}

module.exports = {
  getKeywordAzData,
  _private: {
    legacyItemId,
    buildOrderIndexes,
    buildSalesSummary,
    normaliseLiveItem,
  },
};
