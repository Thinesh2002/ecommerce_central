const { ebayGet, ebayPost } = require("../../../config/ebay/ebayRestClient");
const {
  escapeXml,
  xmlValue,
  xmlValues,
  callTradingApi,
  authRequesterCredentialsXml,
} = require("../../../config/ebay/ebayTradingClient");

const SELL_FULFILLMENT_SCOPE = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
];

const SELL_ANALYTICS_SCOPE = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.analytics.readonly",
];

const SELL_MARKETING_SCOPE = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.marketing",
];

const SELL_INVENTORY_SCOPE = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
];

const SELL_FINANCES_SCOPE = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.finances.readonly",
];

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function isoDaysAgo(days = 30) {
  const date = new Date(Date.now() - Number(days || 30) * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function toDateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dateOnlyDaysAgo(days = 30) {
  return toDateOnly(new Date(Date.now() - Number(days || 30) * 24 * 60 * 60 * 1000));
}

function extractItemId(itemId = "") {
  const raw = String(itemId || "");
  const match = raw.match(/\d{9,}/);
  return match ? match[0] : raw;
}

async function liveBrowseSearch({ keyword, market = "EBAY_GB", limit = 100, offset = 0, filters = {} }) {
  const params = {
    q: keyword,
    limit: Math.min(Math.max(Number(limit) || 100, 1), 200),
    offset: Math.max(Number(offset) || 0, 0),
    fieldgroups: "MATCHING_ITEMS,EXTENDED",
  };

  const filterParts = [];
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice || "";
    const max = filters.maxPrice || "";
    filterParts.push(`price:[${min}..${max}]`);
  }
  if (filters.conditionIds) filterParts.push(`conditionIds:{${filters.conditionIds}}`);
  if (filters.buyingOptions) filterParts.push(`buyingOptions:{${filters.buyingOptions}}`);
  if (filterParts.length) params.filter = filterParts.join(",");

  const { data } = await ebayGet("/buy/browse/v1/item_summary/search", {
    tokenType: "app",
    marketplace: market,
    params,
  });

  return {
    keyword,
    market,
    total: safeNum(data.total, 0),
    limit: safeNum(data.limit, limit),
    offset: safeNum(data.offset, offset),
    items: data.itemSummaries || [],
    href: data.href,
    next: data.next,
  };
}

async function getFulfillmentOrders({ days = 30, limit = 200, offset = 0, orderFulfillmentStatus, filter }) {
  const creationFrom = isoDaysAgo(days);
  const creationTo = new Date().toISOString();
  const filterParts = filter ? [filter] : [`creationdate:[${creationFrom}..${creationTo}]`];
  if (orderFulfillmentStatus) filterParts.push(`orderfulfillmentstatus:{${orderFulfillmentStatus}}`);

  const { data } = await ebayGet("/sell/fulfillment/v1/order", {
    tokenType: "user",
    scopes: SELL_FULFILLMENT_SCOPE,
    params: {
      limit: Math.min(Math.max(Number(limit) || 200, 1), 200),
      offset: Math.max(Number(offset) || 0, 0),
      filter: filterParts.join(","),
    },
  });

  return data;
}

function summarizeOrders(orders = []) {
  const byItemId = new Map();
  const bySku = new Map();
  let totalOrders = orders.length;
  let totalQty = 0;
  let totalRevenue = 0;

  orders.forEach((order) => {
    (order.lineItems || []).forEach((line) => {
      const itemId = line.legacyItemId || line.itemId || line.listingMarketplaceId || "UNKNOWN";
      const sku = line.sku || line.legacyVariationId || "NO_SKU";
      const qty = safeNum(line.quantity, 0);
      const revenue = safeNum(line.total?.value || line.lineItemCost?.value, 0);
      const currency = line.total?.currency || line.lineItemCost?.currency || order.pricingSummary?.total?.currency || "";
      totalQty += qty;
      totalRevenue += revenue;

      const itemRow = byItemId.get(itemId) || { itemId, orders: 0, quantitySold: 0, revenue: 0, currency, titles: new Set(), skus: new Set() };
      itemRow.orders += 1;
      itemRow.quantitySold += qty;
      itemRow.revenue += revenue;
      itemRow.titles.add(line.title || "");
      itemRow.skus.add(sku);
      byItemId.set(itemId, itemRow);

      const skuRow = bySku.get(sku) || { sku, orders: 0, quantitySold: 0, revenue: 0, currency, itemIds: new Set(), titles: new Set() };
      skuRow.orders += 1;
      skuRow.quantitySold += qty;
      skuRow.revenue += revenue;
      skuRow.itemIds.add(itemId);
      skuRow.titles.add(line.title || "");
      bySku.set(sku, skuRow);
    });
  });

  const normalize = (row) => ({
    ...row,
    revenue: Number(row.revenue.toFixed(2)),
    titles: [...row.titles].filter(Boolean).slice(0, 3),
    skus: row.skus ? [...row.skus].filter(Boolean).slice(0, 10) : undefined,
    itemIds: row.itemIds ? [...row.itemIds].filter(Boolean).slice(0, 10) : undefined,
  });

  return {
    totalOrders,
    totalQuantitySold: totalQty,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    byItemId: [...byItemId.values()].map(normalize).sort((a, b) => b.quantitySold - a.quantitySold),
    bySku: [...bySku.values()].map(normalize).sort((a, b) => b.quantitySold - a.quantitySold),
  };
}

async function getOrderSalesSummary({ days = 30, limit = 200, maxPages = 10, itemId, sku }) {
  const allOrders = [];
  let offset = 0;
  let page = 0;

  while (page < Math.max(Number(maxPages) || 1, 1)) {
    const data = await getFulfillmentOrders({ days, limit, offset });
    const orders = data.orders || [];
    allOrders.push(...orders);
    if (!data.next || !orders.length) break;
    offset += Number(limit) || 200;
    page += 1;
  }

  const filteredOrders = !itemId && !sku ? allOrders : allOrders
    .map((order) => ({
      ...order,
      lineItems: (order.lineItems || []).filter((line) => {
        const lineItemId = String(line.legacyItemId || line.itemId || "");
        const lineSku = String(line.sku || "");
        if (itemId && !lineItemId.includes(String(itemId))) return false;
        if (sku && lineSku !== String(sku)) return false;
        return true;
      }),
    }))
    .filter((order) => order.lineItems.length);

  return {
    days: Number(days) || 30,
    fetchedOrders: allOrders.length,
    matchedOrders: filteredOrders.length,
    summary: summarizeOrders(filteredOrders),
    orders: filteredOrders,
  };
}

async function getInventoryItems({ limit = 200, offset = 0 }) {
  const { data } = await ebayGet("/sell/inventory/v1/inventory_item", {
    tokenType: "user",
    scopes: SELL_INVENTORY_SCOPE,
    params: {
      limit: Math.min(Math.max(Number(limit) || 200, 1), 200),
      offset: Math.max(Number(offset) || 0, 0),
    },
  });
  return data;
}

async function getTrafficReport({ marketplace = "EBAY_GB", dimension = "LISTING", metric, dateFrom, dateTo, listingIds }) {
  const params = {
    marketplace_id: marketplace,
    dimension,
    date_range: `${dateFrom || dateOnlyDaysAgo(30)}..${dateTo || toDateOnly(new Date())}`,
  };

  if (metric) params.metric = metric;
  if (listingIds) params.listing_ids = Array.isArray(listingIds) ? listingIds.join(",") : listingIds;

  const { data } = await ebayGet("/sell/analytics/v1/traffic_report", {
    tokenType: "user",
    scopes: SELL_ANALYTICS_SCOPE,
    params,
  });
  return data;
}

async function getSellerStandardsProfile({ program = "PROGRAM_GLOBAL", cycle = "CURRENT" } = {}) {
  const { data } = await ebayGet(`/sell/analytics/v1/seller_standards_profile/${program}/${cycle}`, {
    tokenType: "user",
    scopes: SELL_ANALYTICS_SCOPE,
  });
  return data;
}

async function createMarketingReportTask({
  marketplace = "EBAY_GB",
  reportType = "LISTING_PERFORMANCE_REPORT",
  dateFrom,
  dateTo,
  listingIds,
  campaignIds,
  dimensions,
  metricKeys,
  fundingModels,
  channels,
}) {
  const body = {
    marketplaceId: marketplace,
    reportType,
    reportFormat: "TSV_GZIP",
    dateFrom: dateFrom || dateOnlyDaysAgo(30),
    dateTo: dateTo || toDateOnly(new Date()),
  };

  if (listingIds) body.listingIds = Array.isArray(listingIds) ? listingIds : String(listingIds).split(",").map((s) => s.trim()).filter(Boolean);
  if (campaignIds) body.campaignIds = Array.isArray(campaignIds) ? campaignIds : String(campaignIds).split(",").map((s) => s.trim()).filter(Boolean);
  if (dimensions) body.dimensions = dimensions;
  if (metricKeys) body.metricKeys = metricKeys;
  if (fundingModels) body.fundingModels = fundingModels;
  if (channels) body.channels = channels;

  const { data, headers } = await ebayPost("/sell/marketing/v1/ad_report_task", body, {
    tokenType: "user",
    scopes: SELL_MARKETING_SCOPE,
  });

  return {
    data,
    location: headers.location,
    message: "Report task created. Check report tasks until status is SUCCESS, then download reportHref/reportId.",
  };
}

async function getMarketingReportTasks({ limit = 20, offset = 0, reportType }) {
  const params = { limit, offset };
  if (reportType) params.report_type = reportType;
  const { data } = await ebayGet("/sell/marketing/v1/ad_report_task", {
    tokenType: "user",
    scopes: SELL_MARKETING_SCOPE,
    params,
  });
  return data;
}

async function downloadMarketingReport(reportId) {
  const response = await ebayGet(`/sell/marketing/v1/ad_report/${encodeURIComponent(reportId)}`, {
    tokenType: "user",
    scopes: SELL_MARKETING_SCOPE,
    responseType: "arraybuffer",
  });
  return {
    contentType: response.headers["content-type"] || "application/octet-stream",
    disposition: response.headers["content-disposition"],
    buffer: Buffer.from(response.data),
  };
}

async function getFinancesTransactions({ dateFrom, dateTo, limit = 200, offset = 0, transactionType }) {
  const filterParts = [`transactionDate:[${dateFrom || dateOnlyDaysAgo(30)}..${dateTo || toDateOnly(new Date())}]`];
  if (transactionType) filterParts.push(`transactionType:{${transactionType}}`);

  const { data } = await ebayGet("/sell/finances/v1/transaction", {
    tokenType: "user",
    scopes: SELL_FINANCES_SCOPE,
    params: {
      limit: Math.min(Math.max(Number(limit) || 200, 1), 200),
      offset: Math.max(Number(offset) || 0, 0),
      filter: filterParts.join(","),
    },
  });
  return data;
}

async function tradingGetItem({ itemId, marketplace = "EBAY_GB", includeWatchCount = true }) {
  const cleanItemId = extractItemId(itemId);
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  ${authRequesterCredentialsXml()}
  <ItemID>${escapeXml(cleanItemId)}</ItemID>
  <DetailLevel>ReturnAll</DetailLevel>
  <IncludeWatchCount>${includeWatchCount ? "true" : "false"}</IncludeWatchCount>
</GetItemRequest>`;

  const responseXml = await callTradingApi("GetItem", xml, { marketplace });
  return {
    itemId: cleanItemId,
    ack: xmlValue(responseXml, "Ack"),
    title: xmlValue(responseXml, "Title"),
    currentPrice: safeNum(xmlValue(responseXml, "CurrentPrice"), 0),
    quantity: safeNum(xmlValue(responseXml, "Quantity"), 0),
    quantitySold: safeNum(xmlValue(responseXml, "QuantitySold"), 0),
    watchCount: safeNum(xmlValue(responseXml, "WatchCount"), 0),
    hitCount: safeNum(xmlValue(responseXml, "HitCount"), 0),
    listingStatus: xmlValue(responseXml, "ListingStatus"),
    startTime: xmlValue(responseXml, "StartTime"),
    endTime: xmlValue(responseXml, "EndTime"),
    rawXml: responseXml,
  };
}

async function tradingGetItemTransactions({ itemId, marketplace = "EBAY_GB", days = 30, pageNumber = 1, entriesPerPage = 200 }) {
  const cleanItemId = extractItemId(itemId);
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<GetItemTransactionsRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  ${authRequesterCredentialsXml()}
  <ItemID>${escapeXml(cleanItemId)}</ItemID>
  <NumberOfDays>${Math.min(Math.max(Number(days) || 30, 1), 30)}</NumberOfDays>
  <DetailLevel>ReturnAll</DetailLevel>
  <Pagination>
    <EntriesPerPage>${Math.min(Math.max(Number(entriesPerPage) || 200, 1), 200)}</EntriesPerPage>
    <PageNumber>${Math.max(Number(pageNumber) || 1, 1)}</PageNumber>
  </Pagination>
</GetItemTransactionsRequest>`;

  const responseXml = await callTradingApi("GetItemTransactions", xml, { marketplace });
  const transactionBlocks = xmlValues(responseXml, "Transaction");
  const transactions = transactionBlocks.map((block) => {
    const quantityPurchased = safeNum(xmlValue(block, "QuantityPurchased"), 0);
    const transactionPrice = safeNum(xmlValue(block, "TransactionPrice"), 0);
    return {
      transactionId: xmlValue(block, "TransactionID"),
      buyerUserId: xmlValue(block, "UserID"),
      quantityPurchased,
      transactionPrice,
      revenue: Number((quantityPurchased * transactionPrice).toFixed(2)),
      createdDate: xmlValue(block, "CreatedDate"),
      status: xmlValue(block, "CheckoutStatus"),
    };
  });

  const totalQuantity = transactions.reduce((sum, t) => sum + safeNum(t.quantityPurchased), 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + safeNum(t.revenue), 0);

  return {
    itemId: cleanItemId,
    days: Math.min(Math.max(Number(days) || 30, 1), 30),
    ack: xmlValue(responseXml, "Ack"),
    hasMoreTransactions: xmlValue(responseXml, "HasMoreTransactions") === "true",
    returnedTransactionCount: safeNum(xmlValue(responseXml, "ReturnedTransactionCountActual"), transactions.length),
    totalQuantitySold: totalQuantity,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    transactions,
    rawXml: responseXml,
  };
}

module.exports = {
  liveBrowseSearch,
  getFulfillmentOrders,
  getOrderSalesSummary,
  getInventoryItems,
  getTrafficReport,
  getSellerStandardsProfile,
  createMarketingReportTask,
  getMarketingReportTasks,
  downloadMarketingReport,
  getFinancesTransactions,
  tradingGetItem,
  tradingGetItemTransactions,
  scopes: {
    SELL_FULFILLMENT_SCOPE,
    SELL_ANALYTICS_SCOPE,
    SELL_MARKETING_SCOPE,
    SELL_INVENTORY_SCOPE,
    SELL_FINANCES_SCOPE,
  },
};
