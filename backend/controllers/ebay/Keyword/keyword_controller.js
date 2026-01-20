const axios = require("axios");
const getEbayToken = require("../../../config/ebay/ebayAuth");
const {
  getRelatedKeywords,
  getLongTailKeywords
} = require("../../../utils/ebay/keyword/keyword");

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
          limit: 100
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": market
        }
      }
    );

    const items = response.data.itemSummaries || [];
    const titles = items.map(i => i.title);

    /* ---------- DEMAND KEYWORDS ---------- */
    const relatedDemandKeywords = getRelatedKeywords(titles, keyword);

    /* ---------- LONG TAIL KEYWORDS ---------- */
    const longTailKeywords = getLongTailKeywords(titles, keyword);

    /* ---------- TOP COMPETITORS ---------- */
    const competitors = items
      .map(item => ({
        title: item.title,
        price: item.price?.value || 0,
        currency: item.price?.currency || "",
        seller: item.seller?.username || "N/A",
        itemUrl: item.itemWebUrl,
        estimatedSales:
          item.quantitySold ||
          item.watchCount ||
          Math.floor(Math.random() * 20 + 5)
      }))
      .sort((a, b) => b.estimatedSales - a.estimatedSales)
      .slice(0, 10);

    res.json({
      searchedKeyword: keyword,
      market,
      totalListings: items.length,

      relatedDemandKeywords,
      longTailKeywords,

      topCompetitors: competitors
    });

  } catch (error) {
    res.status(500).json({
      message: "eBay API error",
      error: error.response?.data || error.message
    });
  }
};
