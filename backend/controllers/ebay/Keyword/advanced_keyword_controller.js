const axios = require("axios");
const getEbayToken = require("../../../config/ebay/ebayAuth");
const KeywordResearchModel = require("../../../models/ebay_keyword/keyword_research_model");
const OfficialEbayDataService = require("../../../services/ebay/api/ebayOfficialDataService");

const safeFloat = (val, fallback = 0) => {
  const num = parseFloat(val ?? fallback);
  return Number.isFinite(num) ? num : fallback;
};

const safeInt = (val, fallback = 0) => {
  const num = parseInt(val ?? fallback, 10);
  return Number.isFinite(num) ? num : fallback;
};

const clamp = (num, min = 0, max = 100) => Math.max(min, Math.min(max, Number(num) || 0));
const round = (num, digits = 2) => Number((Number(num) || 0).toFixed(digits));

const MARKETPLACES = Object.freeze({
  EBAY_GB: { label: "eBay UK", currency: "GBP", symbol: "£" },
  EBAY_DE: { label: "eBay Germany", currency: "EUR", symbol: "€" },
  EBAY_US: { label: "eBay US", currency: "USD", symbol: "$" },
  EBAY_AU: { label: "eBay Australia", currency: "AUD", symbol: "A$" },
  EBAY_FR: { label: "eBay France", currency: "EUR", symbol: "€" },
  EBAY_IT: { label: "eBay Italy", currency: "EUR", symbol: "€" },
  EBAY_ES: { label: "eBay Spain", currency: "EUR", symbol: "€" },
});

function normaliseMarketplace(market) {
  const value = String(market || "EBAY_GB").toUpperCase();
  return MARKETPLACES[value] ? value : "EBAY_GB";
}

function getCurrencySymbol(currency, market) {
  const map = { GBP: "£", EUR: "€", USD: "$", AUD: "A$" };
  return map[currency] || MARKETPLACES[market]?.symbol || currency || "";
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)));
  return sorted[index];
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function normaliseText(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stopWordsFor(keyword) {
  return new Set([
    "the", "and", "for", "with", "from", "into", "new", "used", "lot", "set", "pcs", "pc", "pack",
    "free", "post", "shipping", "delivery", "uk", "de", "us", "ebay", "best", "sale", "hot", "top",
    ...normaliseText(keyword).split(" ").filter(Boolean),
  ]);
}

function tokenise(title, keyword) {
  const stopWords = stopWordsFor(keyword);
  return normaliseText(title)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function makePhrases(words, size) {
  const phrases = [];
  for (let i = 0; i <= words.length - size; i += 1) {
    const phrase = words.slice(i, i + size).join(" ");
    if (phrase.length > 3) phrases.push(phrase);
  }
  return phrases;
}

function estimateSales(item) {
  const sold = safeInt(item.quantitySold);
  if (sold > 0) return sold;
  const watchers = safeInt(item.watchCount);
  const bids = safeInt(item.bidCount);
  const price = safeFloat(item.price?.value);
  const feedback = safeInt(item.seller?.feedbackScore);
  const feedbackBoost = feedback > 50000 ? 1.35 : feedback > 10000 ? 1.2 : feedback > 1000 ? 1.08 : 1;
  const pricePenalty = price > 80 ? 0.75 : price > 35 ? 0.9 : 1;
  return Math.max(0, Math.round((watchers * 0.22 + bids * 0.85) * feedbackBoost * pricePenalty));
}

function estimateListingAgeDays(item) {
  const raw = item.itemCreationDate || item.itemEndDate || item.marketingPrice?.discountStartDate;
  if (!raw) return null;
  const diff = Date.now() - new Date(raw).getTime();
  if (!Number.isFinite(diff)) return null;
  return Math.max(0, Math.round(diff / 86_400_000));
}

function titleSeoScore(title, keyword) {
  const cleanTitle = normaliseText(title);
  const cleanKeyword = normaliseText(keyword);
  const length = String(title || "").length;
  let score = 0;
  if (cleanTitle.includes(cleanKeyword)) score += 25;
  if (cleanTitle.startsWith(cleanKeyword)) score += 15;
  if (length >= 60 && length <= 80) score += 20;
  else if (length >= 45 && length < 60) score += 14;
  else if (length > 80) score += 10;
  else score += 8;
  const uniqueWords = new Set(cleanTitle.split(" ").filter(Boolean)).size;
  score += clamp(uniqueWords * 2, 0, 20);
  if (/\b(2pk|3pk|4pk|pack|set|pair)\b/i.test(title)) score += 8;
  if (/\b(uk|de|eu|fast|free|waterproof|outdoor|indoor|modern|vintage)\b/i.test(title)) score += 7;
  return clamp(score, 0, 100);
}

function normaliseItem(item, keyword) {
  const price = safeFloat(item.price?.value);
  const watchers = safeInt(item.watchCount);
  const bids = safeInt(item.bidCount);
  const estimatedSales = estimateSales(item);
  const feedbackScore = safeInt(item.seller?.feedbackScore);
  const titleScore = titleSeoScore(item.title, keyword);
  const ageDays = estimateListingAgeDays(item);
  const image = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null;
  const shippingCost = safeFloat(item.shippingOptions?.[0]?.shippingCost?.value, 0);
  const currency = item.price?.currency || item.shippingOptions?.[0]?.shippingCost?.currency || "";
  const successScore = Math.round(
    watchers * 2.2 +
    bids * 5 +
    estimatedSales * 7.5 +
    Math.log10(feedbackScore + 1) * 5 +
    titleScore * 0.35
  );

  return {
    itemId: item.itemId || null,
    title: item.title || "Untitled listing",
    price,
    currency,
    condition: item.condition || "N/A",
    seller: item.seller?.username || "Unknown",
    feedbackScore,
    watchers,
    bids,
    estimatedSales,
    estimatedRevenue: round(estimatedSales * price, 2),
    shippingCost,
    buyingOptions: item.buyingOptions || [],
    itemUrl: item.itemWebUrl || null,
    image,
    category: item.categories?.[0]?.categoryName || "Uncategorised",
    titleScore,
    ageDays,
    successScore,
    raw: item,
  };
}

async function fetchBrowseItems({ token, keyword, market, requestedLimit }) {
  const maxPerPage = 200;
  const limit = Math.min(Math.max(Number(requestedLimit) || 200, 50), 1000);
  const pages = Math.ceil(limit / maxPerPage);
  const all = [];
  let total = 0;

  for (let page = 0; page < pages; page += 1) {
    const response = await axios.get("https://api.ebay.com/buy/browse/v1/item_summary/search", {
      params: {
        q: keyword,
        limit: Math.min(maxPerPage, limit - all.length),
        offset: page * maxPerPage,
        fieldgroups: "MATCHING_ITEMS,EXTENDED",
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": market,
      },
      timeout: 30000,
    });

    const items = response.data.itemSummaries || [];
    total = safeInt(response.data.total, total || items.length);
    all.push(...items);
    if (items.length < maxPerPage || all.length >= limit) break;
  }

  return { items: all, totalListings: total || all.length };
}

function applyFilters(items, filters = {}) {
  const minPrice = filters.minPrice !== undefined && filters.minPrice !== "" ? safeFloat(filters.minPrice) : null;
  const maxPrice = filters.maxPrice !== undefined && filters.maxPrice !== "" ? safeFloat(filters.maxPrice) : null;
  const condition = String(filters.condition || "").trim().toLowerCase();
  const seller = String(filters.seller || "").trim().toLowerCase();
  const buyingOption = String(filters.buyingOption || "").trim().toLowerCase();

  return items.filter((item) => {
    if (minPrice !== null && item.price < minPrice) return false;
    if (maxPrice !== null && item.price > maxPrice) return false;
    if (condition && condition !== "all" && !String(item.condition).toLowerCase().includes(condition)) return false;
    if (seller && !String(item.seller).toLowerCase().includes(seller)) return false;
    if (buyingOption && buyingOption !== "all" && !item.buyingOptions.join(" ").toLowerCase().includes(buyingOption)) return false;
    return true;
  });
}

function priceDistribution(prices, bucketCount = 8) {
  if (!prices.length) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return [{ range: `${min.toFixed(2)}`, count: prices.length, pct: "100.0%" }];
  const bucketSize = Math.max((max - min) / bucketCount, 1);
  const buckets = new Map();

  prices.forEach((price) => {
    const bucket = Math.min(bucketCount - 1, Math.floor((price - min) / bucketSize));
    const start = min + bucket * bucketSize;
    const end = bucket === bucketCount - 1 ? max : start + bucketSize;
    const label = `${start.toFixed(0)}-${end.toFixed(0)}`;
    buckets.set(label, (buckets.get(label) || 0) + 1);
  });

  return [...buckets.entries()].map(([range, count]) => ({
    range,
    count,
    pct: `${round((count / prices.length) * 100, 1)}%`,
  }));
}

function getListingAgeTrend(items) {
  const buckets = { "Last 24h": 0, "1-7 days": 0, "8-30 days": 0, "31-90 days": 0, "90+ days": 0, Unknown: 0 };
  items.forEach((item) => {
    if (item.ageDays === null || item.ageDays === undefined) buckets.Unknown += 1;
    else if (item.ageDays <= 1) buckets["Last 24h"] += 1;
    else if (item.ageDays <= 7) buckets["1-7 days"] += 1;
    else if (item.ageDays <= 30) buckets["8-30 days"] += 1;
    else if (item.ageDays <= 90) buckets["31-90 days"] += 1;
    else buckets["90+ days"] += 1;
  });
  const knownTotal = Math.max(1, items.length - buckets.Unknown);
  const recentCount = buckets["Last 24h"] + buckets["1-7 days"];
  const recentListingPct = round((recentCount / knownTotal) * 100, 1);
  return {
    breakdown: Object.entries(buckets).map(([period, count]) => ({ period, count, pct: `${round((count / Math.max(items.length, 1)) * 100, 1)}%` })),
    recentListingPct: `${recentListingPct}%`,
    trendSignal: recentListingPct > 40 ? "Trending Up" : recentListingPct > 20 ? "Stable" : "Cooling Down",
  };
}

function conditionBreakdown(items) {
  const map = new Map();
  items.forEach((item) => map.set(item.condition || "N/A", (map.get(item.condition || "N/A") || 0) + 1));
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([condition, count]) => ({ condition, count, pct: `${round((count / Math.max(items.length, 1)) * 100, 1)}%` }));
}

function categoryBreakdown(items) {
  const map = new Map();
  items.forEach((item) => map.set(item.category || "Uncategorised", (map.get(item.category || "Uncategorised") || 0) + 1));
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count, pct: `${round((count / Math.max(items.length, 1)) * 100, 1)}%` }));
}

function pricingStrategy(prices, currencySymbol) {
  if (!prices.length) return null;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const med = median(prices);
  const p25 = percentile(prices, 0.25);
  const p75 = percentile(prices, 0.75);
  const p90 = percentile(prices, 0.9);
  const prefix = currencySymbol || "";
  const entry = Math.max(0, med * 0.9);
  const sweet = med;
  const premium = p75 * 1.12;
  const bundleTarget = Math.max(p90, sweet * 1.5);
  const recommendation =
    avg > med * 1.25
      ? "Market has expensive outliers. Compete near median and use better images/title to gain visibility."
      : avg < med * 0.85
      ? "Market is price-sensitive. Build pack/bundle value instead of only dropping price."
      : "Market pricing is balanced. Start near the sweet spot and test PPC on high-opportunity long-tail terms.";
  return {
    entryPrice: `${prefix}${entry.toFixed(2)}`,
    sweetSpot: `${prefix}${sweet.toFixed(2)}`,
    premiumAnchor: `${prefix}${premium.toFixed(2)}`,
    bundleTarget: `${prefix}${bundleTarget.toFixed(2)}`,
    p25: `${prefix}${p25.toFixed(2)}`,
    p75: `${prefix}${p75.toFixed(2)}`,
    p90: `${prefix}${p90.toFixed(2)}`,
    undercutGap: `${prefix}${Math.max(0, avg - p25).toFixed(2)}`,
    recommendation,
  };
}

function listingQuality(items) {
  const scored = items.map((item) => {
    let score = 0;
    score += item.titleScore * 0.35;
    if (item.image) score += 15;
    if (item.shippingCost >= 0) score += 8;
    if (item.feedbackScore > 10000) score += 14;
    else if (item.feedbackScore > 1000) score += 10;
    else if (item.feedbackScore > 100) score += 7;
    score += clamp(item.watchers * 1.3 + item.bids * 2 + item.estimatedSales * 1.8, 0, 28);
    const final = Math.round(clamp(score, 0, 100));
    return {
      title: item.title,
      itemUrl: item.itemUrl,
      price: item.price,
      seller: item.seller,
      qualityScore: final,
      grade: final >= 80 ? "A" : final >= 60 ? "B" : final >= 40 ? "C" : "D",
    };
  }).sort((a, b) => b.qualityScore - a.qualityScore);

  const total = Math.max(scored.length, 1);
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0 };
  scored.forEach((item) => { gradeDistribution[item.grade] += 1; });
  return {
    averageQualityScore: round(scored.reduce((s, i) => s + i.qualityScore, 0) / total, 1),
    gradeDistribution,
    topQualityListings: scored.slice(0, 10),
  };
}

function buildKeywordMatrix(items, keyword) {
  const wordStats = new Map();
  const phrase2Stats = new Map();
  const phrase3Stats = new Map();
  const base = normaliseText(keyword);

  const add = (map, term, item, multiplier = 1) => {
    if (!term || term === base) return;
    if (!map.has(term)) {
      map.set(term, {
        keyword: term,
        frequency: 0,
        demand: 0,
        revenue: 0,
        titleScoreTotal: 0,
        competitorCount: new Set(),
        priceTotal: 0,
      });
    }
    const current = map.get(term);
    current.frequency += 1 * multiplier;
    current.demand += (item.watchers * 2 + item.bids * 5 + item.estimatedSales * 7) * multiplier;
    current.revenue += item.estimatedRevenue * multiplier;
    current.titleScoreTotal += item.titleScore * multiplier;
    current.priceTotal += item.price * multiplier;
    current.competitorCount.add(item.seller);
  };

  items.forEach((item) => {
    const words = tokenise(item.title, keyword);
    words.forEach((word) => add(wordStats, word, item, 1));
    makePhrases(words, 2).forEach((phrase) => add(phrase2Stats, phrase, item, 1.5));
    makePhrases(words, 3).forEach((phrase) => add(phrase3Stats, phrase, item, 2));
  });

  const maxDemand = Math.max(1, ...[...wordStats.values(), ...phrase2Stats.values(), ...phrase3Stats.values()].map((x) => x.demand));
  const toRows = (map, type) => [...map.values()].map((row) => {
    const competitors = row.competitorCount.size;
    const avgTitleScore = row.titleScoreTotal / Math.max(row.frequency, 1);
    const demandScore = (row.demand / maxDemand) * 100;
    const difficulty = clamp(competitors * 8 + row.frequency * 0.7 + avgTitleScore * 0.25, 5, 98);
    const opportunity = clamp(demandScore * 0.62 + (100 - difficulty) * 0.28 + Math.min(row.revenue / 1000, 10), 1, 100);
    const organicRank = Math.max(1, Math.round(101 - opportunity + difficulty * 0.15));
    const ppcRank = Math.max(1, Math.round(organicRank * 0.62 + difficulty * 0.12));
    const estimatedSearchVolume = Math.round(row.frequency * 120 + row.demand * 3.6 + row.revenue * 0.08);
    const estimatedMonthlySales = Math.round(row.demand / 9);
    return {
      keyword: row.keyword,
      type,
      frequency: Math.round(row.frequency),
      demand: Math.round(row.demand),
      estimatedSearchVolume,
      estimatedMonthlySales,
      estimatedRevenue: round(row.revenue, 2),
      avgPrice: round(row.priceTotal / Math.max(row.frequency, 1), 2),
      competitorCount: competitors,
      difficulty: Math.round(difficulty),
      opportunityScore: Math.round(opportunity),
      organicRank,
      ppcRank,
      suggestedBid: round(0.08 + difficulty / 180 + Math.min(row.demand / 5000, 0.85), 2),
      ctr: `${round(clamp(7 - difficulty / 25 + opportunity / 45, 0.5, 12), 2)}%`,
      cvr: `${round(clamp(1.2 + opportunity / 35 - difficulty / 80, 0.3, 9), 2)}%`,
      trend: opportunity >= 68 ? "Up" : opportunity >= 42 ? "Stable" : "Down",
    };
  });

  const singleKeywords = toRows(wordStats, "Single").sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 80);
  const twoWordPhrases = toRows(phrase2Stats, "2-word").sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 80);
  const threeWordPhrases = toRows(phrase3Stats, "3-word").sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 80);
  const all = [...twoWordPhrases, ...threeWordPhrases, ...singleKeywords]
    .sort((a, b) => b.opportunityScore - a.opportunityScore || b.estimatedSearchVolume - a.estimatedSearchVolume);

  return {
    relatedDemandKeywords: all.slice(0, 150),
    longTailKeywords: [...threeWordPhrases, ...twoWordPhrases]
      .filter((item) => item.keyword.split(" ").length >= 2)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 60)
      .map((item) => item.keyword),
    singleKeywords,
    twoWordPhrases,
    threeWordPhrases,
    trendingTitleWords: singleKeywords.slice(0, 40).map((item) => ({ word: item.keyword, count: item.frequency })),
  };
}

function groupBySeller(items) {
  const sellers = new Map();
  items.forEach((item) => {
    if (!sellers.has(item.seller)) {
      sellers.set(item.seller, {
        seller: item.seller,
        listings: 0,
        totalPrice: 0,
        minPrice: item.price || 0,
        maxPrice: item.price || 0,
        feedbackScore: item.feedbackScore,
        watchers: 0,
        bids: 0,
        estimatedSales: 0,
        estimatedRevenue: 0,
        titleScoreTotal: 0,
        topItem: null,
      });
    }
    const current = sellers.get(item.seller);
    current.listings += 1;
    current.totalPrice += item.price;
    current.minPrice = current.minPrice ? Math.min(current.minPrice, item.price || current.minPrice) : item.price;
    current.maxPrice = Math.max(current.maxPrice, item.price || 0);
    current.feedbackScore = Math.max(current.feedbackScore, item.feedbackScore);
    current.watchers += item.watchers;
    current.bids += item.bids;
    current.estimatedSales += item.estimatedSales;
    current.estimatedRevenue += item.estimatedRevenue;
    current.titleScoreTotal += item.titleScore;
    if (!current.topItem || item.successScore > current.topItem.successScore) current.topItem = item;
  });

  const totalSales = Math.max(1, [...sellers.values()].reduce((sum, seller) => sum + seller.estimatedSales, 0));
  return [...sellers.values()].map((seller) => {
    const avgPrice = seller.totalPrice / Math.max(seller.listings, 1);
    const avgTitleScore = seller.titleScoreTotal / Math.max(seller.listings, 1);
    const salesVelocity = seller.estimatedSales / Math.max(seller.listings, 1);
    const strengthScore = clamp(
      Math.log10(seller.feedbackScore + 1) * 9 +
      seller.listings * 1.6 +
      seller.watchers * 0.85 +
      seller.bids * 2.5 +
      seller.estimatedSales * 4.2 +
      avgTitleScore * 0.18,
      1,
      100
    );
    return {
      ...seller,
      avgPrice: round(avgPrice, 2),
      avgTitleScore: round(avgTitleScore, 1),
      salesVelocity: round(salesVelocity, 2),
      marketSharePct: `${round((seller.estimatedSales / totalSales) * 100, 1)}%`,
      strengthScore: Math.round(strengthScore),
      riskLevel: strengthScore >= 75 ? "Dominant" : strengthScore >= 50 ? "Strong" : strengthScore >= 25 ? "Moderate" : "Weak",
    };
  }).sort((a, b) => b.strengthScore - a.strengthScore);
}

function buildTopCompetitors(items, prices) {
  const p25 = percentile(prices, 0.25);
  const p75 = percentile(prices, 0.75);
  return items
    .map((item, index) => ({
      rank: index + 1,
      itemId: item.itemId,
      title: item.title,
      seller: item.seller,
      price: item.price,
      currency: item.currency,
      condition: item.condition,
      feedbackScore: item.feedbackScore,
      watchers: item.watchers,
      bids: item.bids,
      estimatedSales: item.estimatedSales,
      estimatedRevenue: item.estimatedRevenue,
      itemUrl: item.itemUrl,
      image: item.image,
      shippingCost: item.shippingCost,
      titleScore: item.titleScore,
      ageDays: item.ageDays,
      successScore: item.successScore,
      pricePosition: item.price <= p25 ? "Low Price" : item.price >= p75 ? "Premium" : "Mid Market",
      launchThreat: item.successScore >= 80 ? "High" : item.successScore >= 40 ? "Medium" : "Low",
    }))
    .sort((a, b) => b.successScore - a.successScore)
    .slice(0, 50);
}

function buildOpportunity({ totalListings, sampledListings, prices, totalWatchers, totalBids, estimatedMonthlySales, keywordCount, topSellerStrength }) {
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const competitionPressure = clamp((totalListings / 50000) * 100, 1, 100);
  const demandSignal = clamp(totalWatchers * 0.7 + totalBids * 2 + estimatedMonthlySales * 5, 1, 100);
  const pricePower = clamp(avgPrice * 1.1, 1, 100);
  const keywordDepth = clamp(keywordCount * 1.4, 1, 100);
  const sellerBarrier = clamp(topSellerStrength || 0, 1, 100);
  const opportunityScore = Math.round(clamp(demandSignal * 0.34 + keywordDepth * 0.2 + pricePower * 0.18 + (100 - competitionPressure) * 0.16 + (100 - sellerBarrier) * 0.12, 1, 100));
  const difficultyScore = Math.round(clamp(competitionPressure * 0.38 + sellerBarrier * 0.34 + sampledListings * 0.04 + (totalBids + totalWatchers) * 0.02, 1, 100));
  return {
    opportunityScore,
    opportunityLabel: opportunityScore >= 72 ? "High Opportunity" : opportunityScore >= 48 ? "Medium Opportunity" : "Hard / Competitive",
    label: opportunityScore >= 72 ? "High Opportunity" : opportunityScore >= 48 ? "Medium Opportunity" : "Hard / Competitive",
    difficultyScore,
    difficultyLabel: difficultyScore >= 75 ? "Very Hard" : difficultyScore >= 55 ? "Hard" : difficultyScore >= 35 ? "Moderate" : "Easy",
    competitionPressure: Math.round(competitionPressure),
    demandSignal: Math.round(demandSignal),
    sellerBarrier: Math.round(sellerBarrier),
    launchRecommendation:
      opportunityScore >= 72 && difficultyScore < 60
        ? "Launch / optimise now. Prioritise long-tail keywords and mid-market pricing."
        : opportunityScore >= 48
        ? "Test carefully. Use bundle strategy, better images, and narrow PPC keyword groups."
        : "Avoid broad keyword launch. Focus only on long-tail variants or wait for stronger product differentiation.",
  };
}

function buildTrendFromHistory(history, currentSummary) {
  const rows = (history || []).map((run) => ({
    run_id: run.run_id,
    period: new Date(run.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    created_at: run.created_at,
    totalListings: safeInt(run.summary?.totalListings),
    avgPrice: safeFloat(run.summary?.avgPrice),
    opportunityScore: safeInt(run.summary?.opportunity?.opportunityScore || run.summary?.opportunityScore),
    difficultyScore: safeInt(run.summary?.opportunity?.difficultyScore || run.summary?.difficultyScore),
    estimatedSearchVolume: safeInt(run.summary?.estimatedSearchVolume),
    estimatedMonthlySales: safeInt(run.summary?.estimatedMonthlySales || run.summary?.estimatedSalesSignal),
    organicRank: safeInt(run.summary?.rankingAnalysis?.organicRank || run.summary?.organicRank, 0),
    ppcRank: safeInt(run.summary?.rankingAnalysis?.ppcRank || run.summary?.ppcRank, 0),
  })).reverse();

  if (currentSummary) {
    rows.push({
      run_id: currentSummary.runId || "current",
      period: "Now",
      created_at: new Date().toISOString(),
      totalListings: currentSummary.totalListings,
      avgPrice: currentSummary.avgPrice,
      opportunityScore: currentSummary.opportunity?.opportunityScore,
      difficultyScore: currentSummary.opportunity?.difficultyScore,
      estimatedSearchVolume: currentSummary.estimatedSearchVolume,
      estimatedMonthlySales: currentSummary.estimatedMonthlySales,
      organicRank: currentSummary.rankingAnalysis?.organicRank,
      ppcRank: currentSummary.rankingAnalysis?.ppcRank,
    });
  }

  return rows.slice(-24);
}

function buildTitleBuilder({ keyword, keywordInsights, marketplace, maxLength = 80 }) {
  const terms = (keywordInsights.relatedDemandKeywords || []).slice(0, 12).map((item) => item.keyword);
  const base = keyword.trim();
  const modifiers = terms.filter((term) => !normaliseText(base).includes(normaliseText(term))).slice(0, 6);
  const templates = [
    `${base} ${modifiers.slice(0, 3).join(" ")} Premium Quality`,
    `${base} ${modifiers.slice(0, 2).join(" ")} Fast Dispatch ${marketplace === "EBAY_DE" ? "DE" : "UK"}`,
    `${base} ${modifiers.slice(0, 4).join(" ")}`,
    `${base} 2 Pack ${modifiers.slice(0, 2).join(" ")} New`,
  ].map((title) => title.replace(/\s+/g, " ").trim());

  return templates.map((title) => ({
    title: title.length > maxLength ? title.slice(0, maxLength).trim() : title,
    length: Math.min(title.length, maxLength),
    score: titleSeoScore(title, keyword),
    note: title.length > maxLength ? `Trimmed to ${maxLength} chars` : "Ready for testing",
  }));
}

function buildCsv(rows = []) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (value) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => esc(row[h])).join(","))].join("\n");
}

async function runAdvancedResearch({ req, save = true }) {
  const keyword = String(req.body.keyword || "").trim();
  const market = normaliseMarketplace(req.body.market);
  const days = Number(req.body.days || 30);
  const requestedLimit = Math.min(Number(req.body.limit || 400), 1000);
  const filters = req.body.filters || {};

  if (!keyword) {
    const error = new Error("keyword is required");
    error.statusCode = 400;
    throw error;
  }

  const token = await getEbayToken();
  const browse = await fetchBrowseItems({ token, keyword, market, requestedLimit });
  const normalised = browse.items.map((item) => normaliseItem(item, keyword));
  const filteredItems = applyFilters(normalised, filters);

  if (!filteredItems.length) {
    const error = new Error("No active listings found for this keyword/filter.");
    error.statusCode = 404;
    throw error;
  }

  const prices = filteredItems.map((item) => item.price).filter((price) => price > 0);
  const currency = filteredItems[0]?.currency || MARKETPLACES[market].currency;
  const currencySymbol = getCurrencySymbol(currency, market);
  const avgPrice = prices.length ? round(prices.reduce((a, b) => a + b, 0) / prices.length, 2) : 0;
  const medPrice = round(median(prices), 2);
  const minPrice = prices.length ? round(Math.min(...prices), 2) : 0;
  const maxPrice = prices.length ? round(Math.max(...prices), 2) : 0;

  const keywordInsights = buildKeywordMatrix(filteredItems, keyword);
  const competitors = groupBySeller(filteredItems).slice(0, 50);
  const topCompetitors = buildTopCompetitors(filteredItems, prices);
  const totalWatchers = filteredItems.reduce((sum, item) => sum + item.watchers, 0);
  const totalBids = filteredItems.reduce((sum, item) => sum + item.bids, 0);
  const estimatedMonthlySales = filteredItems.reduce((sum, item) => sum + item.estimatedSales, 0);
  const estimatedRevenue = round(filteredItems.reduce((sum, item) => sum + item.estimatedRevenue, 0), 2);
  const estimatedSearchVolume = Math.round(
    browse.totalListings * 0.8 + totalWatchers * 8 + totalBids * 15 + keywordInsights.relatedDemandKeywords.length * 35
  );
  const topKeyword = keywordInsights.relatedDemandKeywords[0];
  const rankingAnalysis = {
    organicRank: topKeyword?.organicRank || 0,
    ppcRank: topKeyword?.ppcRank || 0,
    organicRanking: keywordInsights.relatedDemandKeywords.slice(0, 50).map((row, idx) => ({ ...row, rank: idx + 1 })),
    ppcRanking: keywordInsights.relatedDemandKeywords
      .slice(0, 50)
      .sort((a, b) => a.ppcRank - b.ppcRank)
      .map((row, idx) => ({ ...row, rank: idx + 1 })),
    rankAdvice: topKeyword?.organicRank <= 20
      ? "Good long-tail ranking opportunity. Build exact phrase in title and item specifics."
      : "Broad keyword is competitive. Start with 2-word/3-word long-tail variants and PPC testing.",
  };

  const opportunity = buildOpportunity({
    totalListings: browse.totalListings,
    sampledListings: filteredItems.length,
    prices,
    totalWatchers,
    totalBids,
    estimatedMonthlySales,
    keywordCount: keywordInsights.relatedDemandKeywords.length,
    topSellerStrength: competitors[0]?.strengthScore || 0,
  });

  const marketAnalytics = {
    currency,
    currencySymbol,
    averagePrice: avgPrice,
    avgPrice,
    medianPrice: medPrice,
    minPrice,
    maxPrice,
    p25: round(percentile(prices, 0.25), 2),
    p75: round(percentile(prices, 0.75), 2),
    p90: round(percentile(prices, 0.9), 2),
    totalWatchers,
    totalBids,
    avgWatchersPerListing: round(totalWatchers / Math.max(filteredItems.length, 1), 1),
    sellThroughRate: `${round((filteredItems.filter((i) => i.estimatedSales > 0 || i.watchers > 0 || i.bids > 0).length / filteredItems.length) * 100, 2)}%`,
    priceDistribution: priceDistribution(prices),
    pricingStrategy: pricingStrategy(prices, currencySymbol),
    listingAgeTrend: getListingAgeTrend(filteredItems),
  };

  const sellerDominance = competitors.slice(0, 15).map((seller, index) => ({
    rank: index + 1,
    seller: seller.seller,
    listings: seller.listings,
    marketSharePct: seller.marketSharePct,
    estimatedSales: seller.estimatedSales,
    estimatedRevenue: round(seller.estimatedRevenue, 2),
    strengthScore: seller.strengthScore,
    riskLevel: seller.riskLevel,
  }));

  const summary = {
    keyword,
    market,
    marketplaceName: MARKETPLACES[market].label,
    days,
    totalListings: browse.totalListings,
    sampledListings: filteredItems.length,
    rawSampledListings: normalised.length,
    currency,
    currencySymbol,
    avgPrice,
    medianPrice: medPrice,
    minPrice,
    maxPrice,
    estimatedSearchVolume,
    estimatedMonthlySales,
    estimatedRevenue,
    estimatedSalesSignal: estimatedMonthlySales,
    totalWatchers,
    totalBids,
    competitorCount: competitors.length,
    opportunity,
    rankingAnalysis,
    dataQuality: {
      salesHistoryType: "Live eBay Browse signals + tracked internal history",
      confidence: browse.totalListings > 5000 ? "Medium" : filteredItems.length >= 100 ? "Good" : "Directional",
      note: "eBay public Browse data does not expose full competitor order history or exact search volume. This tool estimates demand/rank from live listing signals and stores every run for trend tracking. Import eBay sales/traffic/promoted reports later for exact 30-day sales and PPC performance.",
    },
  };

  let ownAccountMetrics = null;
  if (req.body.includeOwnMetrics !== false && req.body.includeOwnData !== false) {
    try {
      const ownSales = await OfficialEbayDataService.getOrderSalesSummary({
        days,
        limit: 200,
        maxPages: Number(req.body.ownDataMaxPages || 20),
        itemId: req.body.itemId,
        sku: req.body.sku,
      });
      ownAccountMetrics = {
        source: "eBay Fulfillment/Orders API",
        days,
        exactOwnAccountData: true,
        salesSummary: ownSales.summary,
        matchedOrders: ownSales.matchedOrders,
        fetchedOrders: ownSales.fetchedOrders,
      };
      summary.ownAccountMetrics = ownAccountMetrics;
      summary.dataQuality.ownSalesNote = "Own-account sales are exact when a valid eBay user token/refresh token is configured. Competitor sales remain estimated unless imported from reports or tracked by snapshots.";
    } catch (error) {
      ownAccountMetrics = {
        source: "eBay Fulfillment/Orders API",
        exactOwnAccountData: false,
        error: error.message,
        setupRequired: "Add EBAY_REFRESH_TOKEN or EBAY_USER_ACCESS_TOKEN with sell.fulfillment.readonly scope.",
      };
      summary.ownAccountMetrics = ownAccountMetrics;
    }
  }

  const historyBeforeSave = await KeywordResearchModel.getRuns({ keyword, market, days, limit: 24 });
  let runId = null;
  if (save) {
    runId = await KeywordResearchModel.saveRun({
      userId: req.user?.id || req.user?.user_id,
      keyword,
      market,
      days,
      summary,
      competitors: topCompetitors.slice(0, 40).map((item) => ({
        seller: item.seller,
        title: item.title,
        itemId: item.itemId,
        itemUrl: item.itemUrl,
        price: item.price,
        currency: item.currency,
        condition: item.condition,
        feedbackScore: item.feedbackScore,
        watchers: item.watchers,
        bids: item.bids,
        estimatedSales: item.estimatedSales,
        salesVelocity: round(item.estimatedSales / 30, 2),
        image: item.image,
        raw: item,
      })),
      terms: keywordInsights.relatedDemandKeywords.slice(0, 120),
    });
  }

  summary.runId = runId;
  const searchTrend = buildTrendFromHistory(historyBeforeSave, summary);
  marketAnalytics.searchTrend = searchTrend;
  marketAnalytics.rankingTrend = searchTrend.map((row) => ({
    period: row.period,
    organicRank: row.organicRank,
    ppcRank: row.ppcRank,
    opportunityScore: row.opportunityScore,
    difficultyScore: row.difficultyScore,
  }));

  return {
    success: true,
    runId,
    summary,
    keywordInfo: {
      totalCompetition: browse.totalListings,
      competitionLevel: browse.totalListings > 10000 ? "High" : browse.totalListings > 2500 ? "Medium" : "Low",
      opportunityScore: round(opportunity.opportunityScore / 10, 1),
      opportunityLabel: opportunity.opportunityLabel,
      keywordDifficulty: {
        score: opportunity.difficultyScore,
        label: opportunity.difficultyLabel,
        advice: opportunity.launchRecommendation,
        avgSellerFeedback: Math.round(filteredItems.reduce((s, item) => s + item.feedbackScore, 0) / Math.max(filteredItems.length, 1)),
      },
    },
    marketAnalytics,
    conditionBreakdown: conditionBreakdown(filteredItems),
    categoryBreakdown: categoryBreakdown(filteredItems),
    listingQualityAnalysis: listingQuality(filteredItems),
    keywordInsights,
    bestKeywords: keywordInsights.trendingTitleWords.map((item) => ({ keyword: item.word, frequency: item.count })),
    rankingAnalysis,
    competitorAnalysis: {
      sellerDominance,
      topCompetitors,
      priceLeaders: topCompetitors.slice().sort((a, b) => a.price - b.price).slice(0, 12),
      premiumLeaders: topCompetitors.slice().sort((a, b) => b.price - a.price).slice(0, 12),
      fastestMovers: topCompetitors.slice().sort((a, b) => b.estimatedSales - a.estimatedSales).slice(0, 12),
    },
    competitors,
    topCompetitors,
    topItems: topCompetitors.slice(0, 40),
    ownAccountMetrics,
    titleBuilder: buildTitleBuilder({ keyword, keywordInsights, marketplace: market }),
    exports: {
      keywordRows: keywordInsights.relatedDemandKeywords,
      competitorRows: topCompetitors,
      sellerRows: sellerDominance,
    },
    history: searchTrend,
  };
}

exports.advancedResearch = async (req, res) => {
  try {
    const result = await runAdvancedResearch({ req, save: true });
    res.json(result);
  } catch (error) {
    console.error("[advancedResearch]", error?.response?.data || error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Advanced keyword research failed",
      error: error?.response?.data?.errors?.[0]?.message || error.message,
    });
  }
};

exports.bulkKeywordResearch = async (req, res) => {
  const keywords = Array.isArray(req.body.keywords)
    ? req.body.keywords.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 20)
    : [];
  if (!keywords.length) return res.status(400).json({ success: false, message: "keywords array is required" });

  const rows = [];
  for (const keyword of keywords) {
    try {
      const fakeReq = { ...req, body: { ...req.body, keyword, limit: Math.min(Number(req.body.limit || 120), 200) } };
      const result = await runAdvancedResearch({ req: fakeReq, save: true });
      rows.push({
        keyword,
        market: result.summary.market,
        totalListings: result.summary.totalListings,
        sampledListings: result.summary.sampledListings,
        avgPrice: result.summary.avgPrice,
        estimatedSearchVolume: result.summary.estimatedSearchVolume,
        estimatedMonthlySales: result.summary.estimatedMonthlySales,
        estimatedRevenue: result.summary.estimatedRevenue,
        opportunityScore: result.summary.opportunity.opportunityScore,
        difficultyScore: result.summary.opportunity.difficultyScore,
        organicRank: result.summary.rankingAnalysis.organicRank,
        ppcRank: result.summary.rankingAnalysis.ppcRank,
        recommendation: result.summary.opportunity.launchRecommendation,
        runId: result.runId,
      });
    } catch (error) {
      rows.push({ keyword, error: error.message, opportunityScore: 0, difficultyScore: 100 });
    }
  }

  res.json({
    success: true,
    count: rows.length,
    rows: rows.sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0)),
  });
};

exports.keywordHistory = async (req, res) => {
  const keyword = String(req.query.keyword || "").trim();
  const market = normaliseMarketplace(req.query.market);
  const days = Number(req.query.days || 90);
  if (!keyword) return res.status(400).json({ success: false, message: "keyword query is required" });
  const runs = await KeywordResearchModel.getRuns({ keyword, market, days, limit: Number(req.query.limit || 50) });
  res.json({ success: true, rows: buildTrendFromHistory(runs, null), runs });
};

exports.latestResearch = async (req, res) => {
  const rows = await KeywordResearchModel.getLatestRuns({ limit: Number(req.query.limit || 20) });
  res.json({ success: true, rows });
};

exports.getResearchRun = async (req, res) => {
  const runId = Number(req.params.runId);
  if (!runId) return res.status(400).json({ success: false, message: "valid runId required" });
  const run = await KeywordResearchModel.getRunWithDetails(runId);
  if (!run) return res.status(404).json({ success: false, message: "research run not found" });
  res.json({ success: true, run });
};

exports.exportResearch = async (req, res) => {
  const runId = Number(req.params.runId);
  const type = String(req.query.type || "keywords").toLowerCase();
  const run = await KeywordResearchModel.getRunWithDetails(runId);
  if (!run) return res.status(404).json({ success: false, message: "research run not found" });

  let rows = [];
  if (type === "competitors") rows = run.competitors || [];
  else if (type === "sellers") rows = run.summary?.competitorAnalysis?.sellerDominance || [];
  else rows = run.terms?.length ? run.terms : run.summary?.keywordInsights?.relatedDemandKeywords || [];

  const csv = buildCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=ebay-${type}-research-${runId}.csv`);
  res.send(csv || "No data");
};

exports.titleBuilder = async (req, res) => {
  const keyword = String(req.body.keyword || "").trim();
  const market = normaliseMarketplace(req.body.market);
  const terms = Array.isArray(req.body.terms) ? req.body.terms : [];
  if (!keyword) return res.status(400).json({ success: false, message: "keyword is required" });
  const keywordInsights = {
    relatedDemandKeywords: terms.map((term) => (typeof term === "string" ? { keyword: term } : term)),
  };
  const titles = buildTitleBuilder({ keyword, keywordInsights, marketplace: market, maxLength: Number(req.body.maxLength || 80) });
  res.json({ success: true, keyword, market, titles });
};

module.exports._private = {
  buildKeywordMatrix,
  normaliseMarketplace,
  runAdvancedResearch,
};
