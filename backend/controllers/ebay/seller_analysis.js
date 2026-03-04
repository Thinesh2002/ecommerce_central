const axios = require("axios");
const getEbayToken = require("../../config/ebay/ebayAuth");
const tradingConfig = require("../../config/ebay/tradingAuth");
const { estimateSales } = require("../../utils/ebay/seller_analysis/seller_analysis");

const REQUEST_TIMEOUT = 12000;
const PAGE_LIMIT = 50;
const MAX_PAGES = 3;

/* ═══════════════════════════════════════════════════
   XML PARSING UTILITIES
═══════════════════════════════════════════════════ */

const xmlText = (xml, tag) =>
  xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? null;

const xmlAll = (xml, tag) =>
  [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g"))].map(m => m[1].trim());

const parseVariations = (xml) => {
  const blocks = [...xml.matchAll(/<Variation>([\s\S]*?)<\/Variation>/g)];
  if (!blocks.length) return [];

  return blocks.map((v, index) => {
    const block = v[1];

    const price  = Number(block.match(/<StartPrice[^>]*>([\d.]+)<\/StartPrice>/)?.[1] ?? 0);
    const stock  = Number(block.match(/<Quantity>([\d]+)<\/Quantity>/)?.[1] ?? 0);
    const sold   = Number(block.match(/<QuantitySold>([\d]+)<\/QuantitySold>/)?.[1] ?? 0);
    const total  = stock + sold;

    // Sell-through rate — how well this variation converts stock to sales
    const sellThroughRate = total > 0 ? +(( sold / total) * 100).toFixed(1) : 0;

    // Revenue estimate per variation
    const estimatedRevenue = +(price * sold).toFixed(2);

    // Variation attributes (Size, Color, Style, etc.)
    const attrMatches = [...block.matchAll(
      /<NameValueList>[\s\S]*?<Name>(.*?)<\/Name>[\s\S]*?<Value>(.*?)<\/Value>[\s\S]*?<\/NameValueList>/g
    )];
    const attributes = attrMatches.map(m => ({ name: m[1].trim(), value: m[2].trim() }));

    // Velocity tier: classify each variation by sales performance
    let velocityTier;
    if      (sold === 0)   velocityTier = "dead";
    else if (sold < 5)     velocityTier = "slow";
    else if (sold < 25)    velocityTier = "moderate";
    else if (sold < 100)   velocityTier = "strong";
    else                   velocityTier = "top-seller";

    // Stock health: how long until stock runs out at current sell rate
    const daysToStockout = sold > 0 && stock > 0
      ? Math.round((stock / (sold / 90)) )  // assumes ~90-day window
      : stock > 0 ? null : 0;

    return {
      key: `var_${index + 1}`,
      price,
      stock,
      sold,
      total,
      sellThroughRate,
      estimatedRevenue,
      velocityTier,
      daysToStockout,
      attributes
    };
  });
};

/* ═══════════════════════════════════════════════════
   SALES ESTIMATION ENGINE
   Multi-signal approach: combines sold count (Trading API),
   watchCount, reviewCount, and listing age signals
═══════════════════════════════════════════════════ */

const SALES_CONFIDENCE = { HIGH: "high", MEDIUM: "medium", LOW: "low", INFERRED: "inferred" };

const estimateSalesEnhanced = (item, tradingVariations = []) => {
  // Priority 1: Hard sold data from Trading API variations
  if (tradingVariations.length > 0) {
    const totalSold = tradingVariations.reduce((s, v) => s + v.sold, 0);
    if (totalSold > 0) {
      return {
        value: totalSold,
        confidence: SALES_CONFIDENCE.HIGH,
        source: "trading_api_variations"
      };
    }
  }

  // Priority 2: estimateSales utility (existing logic)
  const baseSales = estimateSales(item);
  if (baseSales > 0) {
    return {
      value: baseSales,
      confidence: SALES_CONFIDENCE.MEDIUM,
      source: "sales_utility"
    };
  }

  // Priority 3: Infer from watch count + review signals
  const watchers  = Number(item.watchCount ?? 0);
  const reviews   = Number(item.reviewCount ?? 0);

  if (watchers > 0 || reviews > 0) {
    // Conservative conversion heuristics based on eBay norms
    const fromWatchers = Math.round(watchers * 0.15);  // ~15% of watchers convert
    const fromReviews  = Math.round(reviews  * 3.5);   // reviews represent ~1 in 3.5 buyers
    const inferred     = Math.max(fromWatchers, fromReviews);

    return {
      value: inferred,
      confidence: SALES_CONFIDENCE.INFERRED,
      source: "watch_review_signals",
      signals: { watchers, reviews }
    };
  }

  return { value: 0, confidence: SALES_CONFIDENCE.LOW, source: "no_data" };
};

/* ═══════════════════════════════════════════════════
   VARIATION ANALYTICS SUMMARY
═══════════════════════════════════════════════════ */

const analyzeVariations = (variations) => {
  if (!variations.length) return null;

  const totalStock    = variations.reduce((s, v) => s + v.stock, 0);
  const totalSold     = variations.reduce((s, v) => s + v.sold, 0);
  const totalRevenue  = +variations.reduce((s, v) => s + v.estimatedRevenue, 0).toFixed(2);
  const overallSellThrough = (totalStock + totalSold) > 0
    ? +((totalSold / (totalStock + totalSold)) * 100).toFixed(1)
    : 0;

  // Top performers by sold count
  const sorted         = [...variations].sort((a, b) => b.sold - a.sold);
  const topVariations  = sorted.slice(0, 3).map(v => ({
    key: v.key,
    attributes: v.attributes,
    sold: v.sold,
    sellThroughRate: v.sellThroughRate,
    velocityTier: v.velocityTier
  }));

  // Dead stock: variations with stock but zero sales
  const deadStock = variations.filter(v => v.stock > 0 && v.sold === 0);

  // Price spread across variations
  const prices     = variations.map(v => v.price).filter(p => p > 0);
  const priceRange = prices.length > 1
    ? { min: Math.min(...prices), max: Math.max(...prices), spread: +(Math.max(...prices) - Math.min(...prices)).toFixed(2) }
    : null;

  // Velocity distribution
  const velocityDist = variations.reduce((acc, v) => {
    acc[v.velocityTier] = (acc[v.velocityTier] ?? 0) + 1;
    return acc;
  }, {});

  // Health score for the variation lineup (0–100)
  const sellThroughScore  = Math.min(overallSellThrough, 100) * 0.4;
  const topSellerBonus    = (velocityDist["top-seller"] ?? 0) > 0 ? 20 : 0;
  const strongBonus       = Math.min((velocityDist["strong"]   ?? 0) * 5, 15);
  const deadPenalty       = Math.min((deadStock.length / variations.length) * 30, 30);
  const variationHealth   = Math.round(sellThroughScore + topSellerBonus + strongBonus - deadPenalty + 15);

  return {
    count: variations.length,
    totalStock,
    totalSold,
    totalRevenue,
    overallSellThrough,
    variationHealthScore: Math.min(Math.max(variationHealth, 0), 100),
    topVariations,
    deadStockCount: deadStock.length,
    priceRange,
    velocityDistribution: velocityDist
  };
};

/* ═══════════════════════════════════════════════════
   SELLER STRENGTH SCORE (0–100)
   6 weighted pillars with transparent breakdown
═══════════════════════════════════════════════════ */

const calcStrengthScore = ({
  topRated, feedbackPct, feedbackVolume,
  estimatedSales, activeListings, successRate,
  variationHealth
}) => {
  // Pillar 1: Trust & reputation (max 30)
  const topRatedPts    = topRated ? 12 : 0;
  const feedbackPctPts = feedbackPct >= 99.5 ? 12
    : feedbackPct >= 99 ? 10
    : feedbackPct >= 97 ? 6
    : feedbackPct >= 95 ? 2 : 0;
  // Log-scaled: 10 reviews = 2pts, 1k = 4pts, 100k = 6pts
  const feedbackVolPts = Math.min(
    Math.round(Math.log10(feedbackVolume + 1) / Math.log10(100000) * 6), 6
  );
  const trustScore = topRatedPts + feedbackPctPts + feedbackVolPts; // max 30

  // Pillar 2: Sales momentum (max 30)
  const salesPts       = Math.min(Math.round(Math.log10(estimatedSales + 1) / Math.log10(5000) * 30), 30);

  // Pillar 3: Listing portfolio (max 20)
  const listingsPts    = Math.min(Math.round(activeListings / 2), 10);
  const successPts     = Math.round((successRate / 100) * 10);
  const portfolioScore = listingsPts + successPts; // max 20

  // Pillar 4: Product quality bonus from variation health (max 20)
  const qualityScore   = variationHealth != null ? Math.round(variationHealth * 0.2) : 10; // max 20

  const total = Math.min(trustScore + salesPts + portfolioScore + qualityScore, 100);

  const tier =
    total >= 80 ? "Elite"
    : total >= 60 ? "Strong"
    : total >= 40 ? "Established"
    : total >= 20 ? "Growing"
    : "New";

  return {
    total,
    tier,
    pillars: {
      trust:     { score: trustScore,    max: 30, breakdown: { topRatedPts, feedbackPctPts, feedbackVolPts } },
      momentum:  { score: salesPts,      max: 30 },
      portfolio: { score: portfolioScore,max: 20, breakdown: { listingsPts, successPts } },
      quality:   { score: qualityScore,  max: 20 }
    }
  };
};

/* ═══════════════════════════════════════════════════
   PRICE POSITION ANALYSIS
═══════════════════════════════════════════════════ */

const calcPricePosition = (itemPrice, comparables) => {
  const prices = comparables
    .map(i => Number(i.price?.value ?? i.price))
    .filter(p => p > 0)
    .sort((a, b) => a - b);

  if (!prices.length) return { label: "unknown", percentile: null, marketAvg: null, marketMedian: null };

  const marketAvg    = +(prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2);
  const mid          = Math.floor(prices.length / 2);
  const marketMedian = prices.length % 2 !== 0
    ? prices[mid]
    : +((prices[mid - 1] + prices[mid]) / 2).toFixed(2);

  const rank       = prices.filter(p => p < itemPrice).length;
  const percentile = Math.round((rank / prices.length) * 100);

  const pctFromAvg = +(((itemPrice - marketAvg) / marketAvg) * 100).toFixed(1);

  const label =
    itemPrice < marketAvg * 0.85 ? "significantly below market"
    : itemPrice < marketAvg * 0.95 ? "below market"
    : itemPrice <= marketAvg * 1.05 ? "at market"
    : itemPrice <= marketAvg * 1.15 ? "above market"
    : "significantly above market";

  return { label, percentile, pctFromAvg, marketAvg, marketMedian, sampleSize: prices.length };
};

/* ═══════════════════════════════════════════════════
   COMPETITION ANALYSIS
═══════════════════════════════════════════════════ */

const analyzeCompetition = (allItems, sellerUsername) => {
  if (!allItems.length) return { level: "unknown", score: 0 };

  const sellerCounts = {};
  for (const item of allItems) {
    const u = item.seller?.username;
    if (u) sellerCounts[u] = (sellerCounts[u] ?? 0) + 1;
  }

  const uniqueSellers = Object.keys(sellerCounts).length;

  // Market share: what % of visible listings does our seller own?
  const sellerListingCount = sellerCounts[sellerUsername] ?? 0;
  const marketSharePct     = allItems.length > 0
    ? +((sellerListingCount / allItems.length) * 100).toFixed(1)
    : 0;

  // Top competitors by listing count (excluding our seller)
  const competitors = Object.entries(sellerCounts)
    .filter(([u]) => u !== sellerUsername)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([username, listings]) => ({ username, listings }));

  // Concentration: are listings dominated by a few sellers or spread thin?
  const top3Share = competitors.slice(0, 3).reduce((s, c) => s + c.listings, 0);
  const concentration = allItems.length > 0
    ? +((top3Share / allItems.length) * 100).toFixed(1)
    : 0;

  // Competition score 0–100: higher = more competitive market
  const densityScore = Math.min(Math.round((uniqueSellers / 40) * 60), 60);
  const concScore    = Math.round(concentration * 0.4);
  const score        = Math.min(densityScore + concScore, 100);

  const level =
    score >= 70 ? "High"
    : score >= 40 ? "Medium"
    : "Low";

  return {
    level,
    score,
    uniqueSellers,
    marketSharePct,
    topCompetitors: competitors,
    marketConcentration: concentration,
    totalListingsSampled: allItems.length
  };
};

/* ═══════════════════════════════════════════════════
   MULTI-PAGE PARALLEL FETCH
═══════════════════════════════════════════════════ */

const fetchMarketItems = async (token, market, query) => {
  const offsets  = Array.from({ length: MAX_PAGES }, (_, i) => i * PAGE_LIMIT);
  const requests = offsets.map(offset =>
    axios.get("https://api.ebay.com/buy/browse/v1/item_summary/search", {
      params:  { q: query, limit: PAGE_LIMIT, offset },
      headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": market },
      timeout: REQUEST_TIMEOUT
    }).catch(() => null)
  );

  const results   = await Promise.allSettled(requests);
  const allItems  = [];
  let totalCount  = 0;

  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const body = r.value.data;
    totalCount = body.total ?? totalCount;
    allItems.push(...(body.itemSummaries || []));
  }

  return { allItems, totalCount };
};

/* ═══════════════════════════════════════════════════
   MAIN CONTROLLER
═══════════════════════════════════════════════════ */

exports.getSellerProfile = async (req, res) => {
  const { itemId, market } = req.body;

  if (!itemId || !market) {
    return res.status(400).json({ message: "itemId and market required" });
  }

  const siteIdMap = { EBAY_GB: "3", EBAY_US: "0", EBAY_DE: "77", EBAY_FR: "71" };
  const currentSiteId = siteIdMap[market] ?? "3";

  try {
    /* ── PARALLEL INIT: Trading API + OAuth token ── */
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
      <GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <RequesterCredentials>
          <eBayAuthToken>${tradingConfig.authToken}</eBayAuthToken>
        </RequesterCredentials>
        <ItemID>${itemId}</ItemID>
        <DetailLevel>ReturnAll</DetailLevel>
        <IncludeVariations>true</IncludeVariations>
      </GetItemRequest>`;

    const [tradingResult, tokenResult] = await Promise.allSettled([
      axios.post(tradingConfig.endpoint, xmlBody, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "X-EBAY-API-CALL-NAME":             "GetItem",
          "X-EBAY-API-SITEID":                currentSiteId,
          "X-EBAY-API-COMPATIBILITY-LEVEL":   "1085",
          "Content-Type":                     "text/xml"
        }
      }),
      getEbayToken()
    ]);

    /* ── Parse Trading API ── */
    let tradingVariations = [];
    let tradingTitle      = null;

    if (tradingResult.status === "fulfilled") {
      const xml      = tradingResult.value.data;
      tradingTitle   = xmlText(xml, "Title");
      tradingVariations = parseVariations(xml);
    } else {
      console.warn("[Trading API] Failed:", tradingResult.reason?.message);
    }

    if (tokenResult.status === "rejected") {
      console.error("[Auth] Token fetch failed:", tokenResult.reason?.message);
      return res.status(502).json({ message: "eBay authentication failed" });
    }

    const token = tokenResult.value;

    /* ── Fetch core item via Browse API ── */
    const restItemId = itemId.includes("|") ? itemId : `v1|${itemId}|0`;
    let item;

    try {
      const itemRes = await axios.get(
        `https://api.ebay.com/buy/browse/v1/item/${restItemId}`,
        {
          timeout: REQUEST_TIMEOUT,
          headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": market }
        }
      );
      item = itemRes.data;
    } catch {
      // Fallback: search by itemId string
      const fallback = await axios.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        {
          params:  { q: itemId, limit: 1 },
          headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": market },
          timeout: REQUEST_TIMEOUT
        }
      );
      item = fallback.data.itemSummaries?.[0];
    }

    if (!item) return res.status(404).json({ message: "Product not found on eBay" });

    const seller    = item.seller;
    const itemPrice = Number(item.price?.value ?? 0);

    /* ── Market-wide fetch (parallel pages) ── */
    // Use first 4 words for a broad but relevant query
    const searchQuery = (tradingTitle || item.title).split(" ").slice(0, 4).join(" ");
    const { allItems, totalCount } = await fetchMarketItems(token, market, searchQuery);

    /* ── Split items: seller-owned vs market comparables ── */
    const sellerItems      = allItems.filter(i => i.seller?.username === seller.username);
    const comparableItems  = allItems.filter(i => i.seller?.username !== seller.username);

    /* ── Sales metrics ── */
    let sellerEstimatedSales = 0;
    let itemsWithSales       = 0;

    for (const si of sellerItems) {
      const sales = estimateSales(si);
      sellerEstimatedSales += sales;
      if (sales > 0) itemsWithSales++;
    }

    const successRate = sellerItems.length > 0
      ? Math.round((itemsWithSales / sellerItems.length) * 100)
      : 0;

    /* ── Enhanced sales estimate for the target product ── */
    const productSalesEstimate = estimateSalesEnhanced(item, tradingVariations);

    /* ── Variation analytics ── */
    const variationAnalysis = analyzeVariations(tradingVariations);

    /* ── Price position ── */
    const pricePosition = calcPricePosition(itemPrice, [
      ...sellerItems, ...comparableItems
    ]);

    /* ── Competition analysis ── */
    const competition = analyzeCompetition(allItems, seller.username);

    /* ── Seller strength score ── */
    const strength = calcStrengthScore({
      topRated:        seller.topRatedSeller ?? false,
      feedbackPct:     seller.positiveFeedbackPercent ?? 0,
      feedbackVolume:  seller.feedbackScore ?? 0,
      estimatedSales:  sellerEstimatedSales,
      activeListings:  sellerItems.length,
      successRate,
      variationHealth: variationAnalysis?.variationHealthScore ?? null
    });

    /* ══════════════════════════════════════
       FINAL RESPONSE
    ══════════════════════════════════════ */
    res.json({

      seller: {
        username:                 seller.username,
        feedbackScore:            seller.feedbackScore ?? 0,
        positiveFeedbackPercent:  seller.positiveFeedbackPercent ?? 0,
        topRatedSeller:           seller.topRatedSeller ?? false,
        relatedActiveListings:    sellerItems.length,
        estimatedTotalSales:      sellerEstimatedSales,
        successRate:              `${successRate}%`,
        strength: {
          total:   strength.total,
          tier:    strength.tier,         // "Elite" | "Strong" | "Established" | "Growing" | "New"
          pillars: strength.pillars       // transparent breakdown per pillar
        }
      },

      product: {
        itemId,
        title:     tradingTitle || item.title,
        condition: item.condition,
        itemUrl:   item.itemWebUrl || `https://www.ebay.co.uk/itm/${itemId}`,

        pricing: {
          currency:    item.price?.currency,
          price:       itemPrice,
          position:    pricePosition.label,
          percentile:  pricePosition.percentile,     // e.g. 42 = cheaper than 42% of market
          pctFromAvg:  pricePosition.pctFromAvg,     // e.g. -8.2 = 8.2% below market avg
          marketAvg:   pricePosition.marketAvg,
          marketMedian:pricePosition.marketMedian,
          sampleSize:  pricePosition.sampleSize
        },

        salesEstimate: {
          value:      productSalesEstimate.value,
          confidence: productSalesEstimate.confidence,   // "high" | "medium" | "inferred" | "low"
          source:     productSalesEstimate.source,
          signals:    productSalesEstimate.signals ?? null
        },

        shipping: {
          shippingCost: Number(item.shippingOptions?.[0]?.shippingCost?.value ?? 0),
          freeShipping: Number(item.shippingOptions?.[0]?.shippingCost?.value ?? 0) === 0
        },

        variations: {
          hasVariations: tradingVariations.length > 0,
          confidence:    tradingVariations.length > 0 ? "high" : "low",
          analytics:     variationAnalysis,            // full summary object or null
          details:       tradingVariations             // full per-variation array
        }
      },

      marketAnalysis: {
        marketplace:  market,
        searchQuery,
        totalListings: totalCount,

        competition,   // level, score, uniqueSellers, topCompetitors, marketConcentration, marketSharePct

        pricePosition: {
          label:        pricePosition.label,
          percentile:   pricePosition.percentile,
          marketAvg:    pricePosition.marketAvg,
          marketMedian: pricePosition.marketMedian
        },

        dataQuality: {
          tradingApiSuccess:   tradingResult.status === "fulfilled",
          variationConfidence: tradingVariations.length > 0 ? "high" : "low",
          salesConfidence:     productSalesEstimate.confidence,
          marketSampleSize:    allItems.length
        }
      }

    });

  } catch (error) {
    console.error("EBAY_ANALYSIS_CRASH:", error.message, error.stack);
    res.status(500).json({ message: "Failed to perform deep analysis" });
  }
};