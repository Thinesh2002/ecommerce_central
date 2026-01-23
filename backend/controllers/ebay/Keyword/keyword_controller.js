const axios = require("axios");
const getEbayToken = require("../../../config/ebay/ebayAuth");
const { getRelatedKeywords, getLongTailKeywords } = require("../../../utils/ebay/keyword/keyword");

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
          limit: 100,
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
      return res.status(404).json({ message: "No data found" });
    }

    // --- MARKET ANALYSIS ---
    const prices = items.map(i => parseFloat(i.price?.value || 0)).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : "0.00";
    
    // --- DEMAND METRICS ---
    const demandItems = items.filter(i => (i.watchCount > 0 || i.bidCount > 0)).length;
    const sellThroughRate = ((demandItems / items.length) * 100).toFixed(2);
    
    const totalListings = parseInt(response.data.total) || items.length;
    const competitionLevel = totalListings > 10000 ? "High" : totalListings > 2000 ? "Medium" : "Low";

    // --- OPPORTUNITY SCORE ---
    let oppScore = (parseFloat(sellThroughRate) / 10).toFixed(1);
    if(competitionLevel === "Low") oppScore = (parseFloat(oppScore) + 2).toFixed(1);
    const opportunityScore = Math.min(oppScore, 10);

    // --- COMPETITORS ---
    const processedCompetitors = items.map(item => ({
      title: item.title,
      price: item.price?.value || 0,
      currency: item.price?.currency || "",
      seller: item.seller?.username || "N/A",
      itemUrl: item.itemWebUrl,
      estimatedSales: (item.watchCount || 0) + (item.bidCount || 0),
      successScore: ((item.watchCount || 0) * 2) + ((item.bidCount || 0) * 5)
    })).sort((a, b) => b.successScore - a.successScore).slice(0, 20);

    res.json({
      searchedKeyword: keyword,
      market,
      totalListings: totalListings,
      keywordInfo: { totalCompetition: totalListings, competitionLevel },
      marketAnalytics: {
        averagePrice: avgPrice, 
        sellThroughRate: `${sellThroughRate}%`,
        opportunityScore: opportunityScore,
        currency: items[0].price?.currency || ""
      },
      relatedDemandKeywords: getRelatedKeywords(items.map(i => i.title), keyword),
      longTailKeywords: getLongTailKeywords(items.map(i => i.title), keyword),
      topCompetitors: processedCompetitors
    });

  } catch (error) {
    res.status(500).json({ message: "eBay API Error", error: error.message });
  }
};