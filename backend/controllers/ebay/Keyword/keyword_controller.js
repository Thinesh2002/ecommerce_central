const axios = require("axios");
const getEbayToken = require("../../../config/ebay/ebayAuth");
const { getRelatedKeywords, getLongTailKeywords } = require("../../../utils/ebay/keyword/keyword");

// ─── Helpers ────────────────────────────────────────────────────────────────

const safeFloat = (val, fallback = 0) => parseFloat(val ?? fallback) || fallback;
const safeInt   = (val, fallback = 0) => parseInt(val  ?? fallback) || fallback;

/** Weighted opportunity score 0-10 */
function calcOpportunityScore({ sellThroughRate, competitionLevel, avgPrice, demandRatio }) {
  let score = 0;
  score += Math.min((sellThroughRate / 100) * 4, 4);
  score += competitionLevel === "Low" ? 3 : competitionLevel === "Medium" ? 1.5 : 0;
  score += Math.min((avgPrice / 100) * 1.5, 1.5);
  score += Math.min(demandRatio * 1.5, 1.5);
  return Math.min(parseFloat(score.toFixed(1)), 10);
}

/** Classify competition */
function classifyCompetition(total) {
  if (total > 10000) return "High";
  if (total > 2000)  return "Medium";
  return "Low";
}

/** Extract category distribution */
function getCategoryBreakdown(items) {
  const map = {};
  items.forEach(i => {
    const cat = i.categories?.[0]?.categoryName || "Uncategorized";
    map[cat] = (map[cat] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count, pct: ((count / items.length) * 100).toFixed(1) + "%" }));
}

/** Price buckets for distribution insight */
function getPriceDistribution(prices) {
  if (!prices.length) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const bucketSize = Math.ceil((max - min) / 5) || 1;
  const buckets = {};
  prices.forEach(p => {
    const key = Math.floor((p - min) / bucketSize) * bucketSize + min;
    const label = `$${key.toFixed(0)}-$${(key + bucketSize).toFixed(0)}`;
    buckets[label] = (buckets[label] || 0) + 1;
  });
  return Object.entries(buckets).map(([range, count]) => ({ range, count }));
}

/** Seller leaderboard */
function getTopSellers(items, limit = 10) {
  const map = {};
  items.forEach(i => {
    const seller = i.seller?.username || "N/A";
    if (!map[seller]) map[seller] = { seller, listings: 0, totalWatchers: 0, totalBids: 0 };
    map[seller].listings++;
    map[seller].totalWatchers += safeInt(i.watchCount);
    map[seller].totalBids     += safeInt(i.bidCount);
  });
  return Object.values(map)
    .sort((a, b) => (b.totalWatchers + b.totalBids * 3) - (a.totalWatchers + a.totalBids * 3))
    .slice(0, limit)
    .map(s => ({ ...s, engagementScore: s.totalWatchers + s.totalBids * 3 }));
}

/** Extract trending title words (excluding base keyword) */
function getTrendingTitleWords(titles, keyword) {
  const stopWords = new Set(["the","a","an","and","or","for","with","in","of","to","is","by","on","at","from","new","used","lot","set","&"]);
  const kwWords   = new Set(keyword.toLowerCase().split(/\s+/));
  const freq = {};
  titles.forEach(title => {
    title.toLowerCase().split(/\W+/).forEach(w => {
      if (w.length > 2 && !stopWords.has(w) && !kwWords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));
}

/** Condition breakdown */
function getConditionBreakdown(items) {
  const map = {};
  items.forEach(i => {
    const cond = i.condition || "Not Specified";
    map[cond] = (map[cond] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([condition, count]) => ({ condition, count, pct: ((count / items.length) * 100).toFixed(1) + "%" }));
}

// ─── NEW: Listing Age / Seasonal Trend Analysis ──────────────────────────────

/**
 * Groups listings by how recently they were created/updated.
 * Uses itemCreationDate or itemEndDate from the eBay response.
 * Outputs a trendSignal: 📈 Trending Up | ➡️ Stable | 📉 Cooling Down
 */
function getListingAgeTrend(items) {
  const now = Date.now();
  const buckets = { "Last 24h": 0, "1-7 days": 0, "8-30 days": 0, "31-90 days": 0, "90+ days": 0 };

  items.forEach(i => {
    const raw = i.itemCreationDate || i.itemEndDate || null;
    if (!raw) return;
    const ageDays = (now - new Date(raw).getTime()) / 86_400_000;
    if      (ageDays <= 1)  buckets["Last 24h"]++;
    else if (ageDays <= 7)  buckets["1-7 days"]++;
    else if (ageDays <= 30) buckets["8-30 days"]++;
    else if (ageDays <= 90) buckets["31-90 days"]++;
    else                    buckets["90+ days"]++;
  });

  const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;
  const breakdown = Object.entries(buckets).map(([period, count]) => ({
    period,
    count,
    pct: ((count / total) * 100).toFixed(1) + "%"
  }));

  const recentPct = ((buckets["Last 24h"] + buckets["1-7 days"]) / total) * 100;
  const trendSignal =
    recentPct > 40 ? "📈 Trending Up" :
    recentPct > 20 ? "➡️ Stable"      : "📉 Cooling Down";

  return { breakdown, trendSignal, recentListingPct: recentPct.toFixed(1) + "%" };
}

// ─── NEW: Pricing Strategy Recommendations ───────────────────────────────────

/**
 * Uses p25/p75 percentiles to produce three actionable price points:
 *   entryPrice    – 10% below median (fast-mover)
 *   sweetSpot     – median (balanced)
 *   premiumAnchor – 10% above p75 (high-margin)
 * Also generates a written recommendation based on avg vs median skew.
 */
function getPricingStrategy(prices, avgPrice, medianPrice) {
  if (!prices.length) return null;

  const sorted = [...prices].sort((a, b) => a - b);
  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const avg  = parseFloat(avgPrice);
  const med  = parseFloat(medianPrice);

  const entryPrice    = (med * 0.90).toFixed(2);
  const sweetSpot     = med.toFixed(2);
  const premiumAnchor = (p75 * 1.10).toFixed(2);
  const undercutGap   = (avg - p25).toFixed(2);

  let recommendation;
  if (avg > med * 1.2) {
    recommendation = "Market is top-heavy with expensive outliers. Price near the median to maximise sell-through.";
  } else if (avg < med * 0.85) {
    recommendation = "Prices are skewed low. A slightly above-median listing with quality images could stand out.";
  } else {
    recommendation = "Pricing is balanced. Entering at the sweet-spot should yield competitive visibility.";
  }

  return {
    entryPrice:    `$${entryPrice}`,
    sweetSpot:     `$${sweetSpot}`,
    premiumAnchor: `$${premiumAnchor}`,
    p25:           `$${p25.toFixed(2)}`,
    p75:           `$${p75.toFixed(2)}`,
    undercutGap:   `$${undercutGap}`,
    recommendation
  };
}

// ─── NEW: Listing Quality Scoring ────────────────────────────────────────────

/**
 * Scores every listing 0–100 across 5 signals:
 *   - Title length       (optimal 60-80 chars, max 20pts)
 *   - Has image          (15pts)
 *   - Has shipping info  (10pts)
 *   - Seller feedback    (max 20pts)
 *   - Watcher/bid proof  (max 35pts combined)
 * Returns averageQualityScore, grade distribution (A/B/C/D), top 10 listings.
 */
function scoreListingQuality(items) {
  const scored = items.map(item => {
    let score = 0;
    const titleLen = (item.title || "").length;

    if      (titleLen >= 60 && titleLen <= 80) score += 20;
    else if (titleLen >= 40 && titleLen <  60) score += 14;
    else if (titleLen >= 20 && titleLen <  40) score += 8;
    else if (titleLen > 80)                    score += 12; // penalise keyword stuffing

    if (item.image?.imageUrl)        score += 15;
    if (item.shippingOptions?.length) score += 10;

    const fb = safeInt(item.seller?.feedbackScore);
    score += fb > 10000 ? 20 : fb > 1000 ? 15 : fb > 100 ? 10 : fb > 10 ? 5 : 0;

    score += Math.min(safeInt(item.watchCount) * 2, 20);
    score += Math.min(safeInt(item.bidCount)   * 3, 15);

    return {
      title:        item.title,
      qualityScore: score,
      grade:        score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D",
      itemUrl:      item.itemWebUrl,
      price:        safeFloat(item.price?.value)
    };
  });

  scored.sort((a, b) => b.qualityScore - a.qualityScore);

  const avgScore = (scored.reduce((s, i) => s + i.qualityScore, 0) / scored.length).toFixed(1);
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0 };
  scored.forEach(i => gradeDistribution[i.grade]++);

  return {
    averageQualityScore: parseFloat(avgScore),
    gradeDistribution,
    topQualityListings: scored.slice(0, 10)
  };
}

// ─── NEW: Keyword Difficulty Score ───────────────────────────────────────────

/**
 * Produces a 0–100 difficulty score from four signals:
 *   - Total listing volume    (supply pressure,   max 35pts)
 *   - Avg seller feedback     (barrier to entry,  max 25pts)
 *   - Avg watchers/listing    (demand intensity,  max 25pts)
 *   - Price floor             (cost to compete,   max 15pts)
 * Returns score, label (🟢 Easy → 🔴 Very Hard), and actionable advice.
 */
function calcKeywordDifficulty({ totalListings, items, avgWatchersPerListing, minPrice }) {
  let difficulty = 0;

  if      (totalListings > 50000) difficulty += 35;
  else if (totalListings > 10000) difficulty += 25;
  else if (totalListings > 2000)  difficulty += 15;
  else if (totalListings > 500)   difficulty += 8;
  else                            difficulty += 3;

  const avgFeedback = items.reduce((s, i) => s + safeInt(i.seller?.feedbackScore), 0) / items.length;
  if      (avgFeedback > 50000) difficulty += 25;
  else if (avgFeedback > 10000) difficulty += 18;
  else if (avgFeedback > 1000)  difficulty += 12;
  else if (avgFeedback > 100)   difficulty += 6;

  const aw = parseFloat(avgWatchersPerListing) || 0;
  if      (aw > 20) difficulty += 25;
  else if (aw > 10) difficulty += 18;
  else if (aw > 5)  difficulty += 10;
  else if (aw > 2)  difficulty += 5;

  const mp = parseFloat(minPrice) || 0;
  if      (mp > 500) difficulty += 15;
  else if (mp > 100) difficulty += 10;
  else if (mp > 25)  difficulty += 5;

  difficulty = Math.min(difficulty, 100);

  const label =
    difficulty >= 75 ? "🔴 Very Hard" :
    difficulty >= 50 ? "🟠 Hard"      :
    difficulty >= 25 ? "🟡 Moderate"  : "🟢 Easy";

  const advice =
    difficulty >= 75
      ? "Dominated by high-volume, high-feedback sellers. Target long-tail variations to find less contested niches."
      : difficulty >= 50
      ? "Competitive market. Differentiate with superior images, detailed descriptions, and competitive pricing."
      : difficulty >= 25
      ? "Moderate competition. A well-optimised listing with good SEO and fast shipping can rank well."
      : "Low barrier to entry. Act quickly — easy markets attract new sellers fast.";

  return { score: difficulty, label, advice, avgSellerFeedback: Math.round(avgFeedback) };
}

// ─── Controller ─────────────────────────────────────────────────────────────

exports.fetchKeywords = async (req, res) => {
  const { keyword, market } = req.body;

  if (!keyword || !market) {
    return res.status(400).json({ message: "keyword and market required" });
  }

  try {
    const token = await getEbayToken();

    const response = await axios.get(
      "https://api.ebay.com/buy/browse/v1/item_summary/search",
      {
        params: {
          q: keyword,
          limit: 200,
          fieldgroups: "MATCHING_ITEMS,EXTENDED"
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": market
        }
      }
    );

    const items = response.data.itemSummaries || [];
    if (items.length === 0) {
      return res.status(404).json({ message: "No listings found for this keyword." });
    }

    const titles        = items.map(i => i.title || "");
    const totalListings = safeInt(response.data.total, items.length);

    // ── Price metrics ──────────────────────────────────────────────────────
    const prices      = items.map(i => safeFloat(i.price?.value)).filter(p => p > 0);
    const avgPrice    = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : "0.00";
    const minPrice    = prices.length ? Math.min(...prices).toFixed(2) : "0.00";
    const maxPrice    = prices.length ? Math.max(...prices).toFixed(2) : "0.00";
    const medianPrice = prices.length
      ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)].toFixed(2)
      : "0.00";

    // ── Demand metrics ─────────────────────────────────────────────────────
    const totalWatchers         = items.reduce((s, i) => s + safeInt(i.watchCount), 0);
    const totalBids             = items.reduce((s, i) => s + safeInt(i.bidCount), 0);
    const demandItems           = items.filter(i => safeInt(i.watchCount) > 0 || safeInt(i.bidCount) > 0).length;
    const sellThroughRate       = ((demandItems / items.length) * 100).toFixed(2);
    const demandRatio           = totalWatchers / Math.max(items.length, 1) / 10;
    const avgWatchersPerListing = (totalWatchers / items.length).toFixed(1);

    // ── Competition & opportunity ──────────────────────────────────────────
    const competitionLevel = classifyCompetition(totalListings);
    const opportunityScore = calcOpportunityScore({
      sellThroughRate: parseFloat(sellThroughRate),
      competitionLevel,
      avgPrice: parseFloat(avgPrice),
      demandRatio
    });

    // ── New feature calculations ───────────────────────────────────────────
    const listingAgeTrend   = getListingAgeTrend(items);
    const pricingStrategy   = getPricingStrategy(prices, avgPrice, medianPrice);
    const listingQuality    = scoreListingQuality(items);
    const keywordDifficulty = calcKeywordDifficulty({
      totalListings,
      items,
      avgWatchersPerListing,
      minPrice
    });

    // ── Top 20 competitors ─────────────────────────────────────────────────
    const topCompetitors = items
      .map(item => ({
        title:          item.title,
        price:          safeFloat(item.price?.value),
        currency:       item.price?.currency || "",
        condition:      item.condition || "N/A",
        seller:         item.seller?.username || "N/A",
        sellerFeedback: safeInt(item.seller?.feedbackScore),
        watchers:       safeInt(item.watchCount),
        bids:           safeInt(item.bidCount),
        itemUrl:        item.itemWebUrl,
        image:          item.image?.imageUrl || null,
        shippingCost:   item.shippingOptions?.[0]?.shippingCost?.value || "N/A",
        listingType:    item.buyingOptions?.[0] || "N/A",
        successScore:   safeInt(item.watchCount) * 2 + safeInt(item.bidCount) * 5
      }))
      .sort((a, b) => b.successScore - a.successScore)
      .slice(0, 20);

    // ── Response ───────────────────────────────────────────────────────────
    res.json({
      searchedKeyword: keyword,
      market,
      scrapedListings: items.length,
      totalListings,

      keywordInfo: {
        totalCompetition: totalListings,
        competitionLevel,
        opportunityScore,
        opportunityLabel:
          opportunityScore >= 7 ? "🟢 High Opportunity" :
          opportunityScore >= 4 ? "🟡 Moderate"         : "🔴 Saturated",
        keywordDifficulty                          // ← NEW
      },

      marketAnalytics: {
        currency:               items[0].price?.currency || "",
        averagePrice:           avgPrice,
        medianPrice,
        minPrice,
        maxPrice,
        sellThroughRate:        `${sellThroughRate}%`,
        totalWatchers,
        totalBids,
        avgWatchersPerListing,
        priceDistribution:      getPriceDistribution(prices),
        pricingStrategy,                           // ← NEW
        listingAgeTrend                            // ← NEW
      },

      conditionBreakdown:     getConditionBreakdown(items),
      categoryBreakdown:      getCategoryBreakdown(items),
      topSellers:             getTopSellers(items),
      listingQualityAnalysis: listingQuality,      // ← NEW

      keywordInsights: {
        relatedDemandKeywords: getRelatedKeywords(titles, keyword),
        longTailKeywords:      getLongTailKeywords(titles, keyword),
        trendingTitleWords:    getTrendingTitleWords(titles, keyword)
      },

      topCompetitors
    });

  } catch (error) {
    console.error("[fetchKeywords]", error?.response?.data || error.message);
    res.status(500).json({
      message: "eBay API Error",
      error:   error?.response?.data?.errors?.[0]?.message || error.message
    });
  }
};