const axios = require("axios");
const getEbayToken = require("../../config/ebay/ebayAuth");
const tradingConfig = require("../../config/ebay/tradingAuth");
const { estimateSales } = require("../../utils/ebay/seller_analysis/seller_analysis");

const REQUEST_TIMEOUT = 12000;
const PAGE_LIMIT = 50;
const MAX_PAGES = 2;

exports.getSellerProfile = async (req, res) => {
  const { itemId, market } = req.body;

  if (!itemId || !market) {
    return res.status(400).json({ message: "itemId and market required" });
  }

  try {
    /* =================================================
        STEP 1: TRADING API (GET DETAILED VARIATIONS)
    ================================================= */
    let tradingVariations = [];
    let tradingTitle = null;

    // Market-kku yetha SiteID (UK = 3, US = 0, DE = 77, FR = 71)
    const siteIdMap = { "EBAY_GB": "3", "EBAY_US": "0", "EBAY_DE": "77", "EBAY_FR": "71" };
    const currentSiteId = siteIdMap[market] || "3";

    try {
      // FIX: XmlBody-la DetailLevel 'ReturnAll' matrum IncludeVariations 'true' mandatory
      const xmlBody = `
        <?xml version="1.0" encoding="utf-8"?>
        <GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials>
            <eBayAuthToken>${tradingConfig.authToken}</eBayAuthToken>
          </RequesterCredentials>
          <ItemID>${itemId}</ItemID>
          <DetailLevel>ReturnAll</DetailLevel>
          <IncludeVariations>true</IncludeVariations>
        </GetItemRequest>
      `;

      const tradingRes = await axios.post(
        tradingConfig.endpoint,
        xmlBody,
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            "X-EBAY-API-CALL-NAME": "GetItem",
            "X-EBAY-API-SITEID": currentSiteId,
            "X-EBAY-API-COMPATIBILITY-LEVEL": "1085",
            "Content-Type": "text/xml"
          }
        }
      );

      const xml = tradingRes.data;

      // Safe matching for Title
      const titleMatch = xml.match(/<Title>(.*?)<\/Title>/);
      tradingTitle = titleMatch ? titleMatch[1] : null;

      // Extract Variations specifically - Fixed Regex to be more robust
      const variationBlocks = [...xml.matchAll(/<Variation>([\s\S]*?)<\/Variation>/g)];

      if (variationBlocks && variationBlocks.length > 0) {
        tradingVariations = variationBlocks.map((v, index) => {
          const block = v[1];
          const price = block.match(/<StartPrice[^>]*>(.*?)<\/StartPrice>/)?.[1] || 0;
          const quantity = block.match(/<Quantity>(.*?)<\/Quantity>/)?.[1] || 0;
          const sold = block.match(/<QuantitySold>(.*?)<\/QuantitySold>/)?.[1] || 0;

          // Extract Attributes (Size, Color, etc.)
          const attributes = [...block.matchAll(
            /<NameValueList>[\s\S]*?<Name>(.*?)<\/Name>[\s\S]*?<Value>(.*?)<\/Value>/g
          )].map(m => ({ name: m[1], value: m[2] }));

          return {
            key: `var_${index + 1}`,
            price: Number(price),
            stock: Number(quantity),
            sold: Number(sold),
            attributes
          };
        });
      }

    } catch (apiErr) {
      console.error("Trading API Error:", apiErr.message);
    }

    /* =================================================
        STEP 2: BUY BROWSE API (CORE DATA)
    ================================================= */
    const token = await getEbayToken();
    let item;
    
    // Browse API-kku correct-ah ID-ai format panrom
    const restItemId = itemId.includes("|") ? itemId : `v1|${itemId}|0`;

    try {
      const itemRes = await axios.get(
        `https://api.ebay.com/buy/browse/v1/item/${restItemId}`,
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            Authorization: `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": market
          }
        }
      );
      item = itemRes.data;
    } catch (err) {
      // Fallback search
      const searchRes = await axios.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        {
          params: { q: itemId, limit: 1 },
          headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": market }
        }
      );
      item = searchRes.data.itemSummaries?.[0];
    }

    if (!item) return res.status(404).json({ message: "Product not found on eBay" });

    const seller = item.seller;

    /* =================================================
        STEP 3: ADVANCED COMPETITOR ANALYSIS
    ================================================= */
    let sellerItems = [];
    const searchTitle = (tradingTitle || item.title).split(' ').slice(0, 3).join(' ');

    const resPage = await axios.get(
      "https://api.ebay.com/buy/browse/v1/item_summary/search",
      {
        params: { q: searchTitle, limit: PAGE_LIMIT },
        headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": market }
      }
    );
    
    sellerItems = (resPage.data.itemSummaries || []).filter(i => i.seller?.username === seller.username);

    let sellerEstimatedSales = 0;
    let itemsWithSales = 0;
    sellerItems.forEach(i => {
      const sales = estimateSales(i);
      sellerEstimatedSales += sales;
      if (sales > 0) itemsWithSales++;
    });

    const successRate = sellerItems.length > 0 ? Math.round((itemsWithSales / sellerItems.length) * 100) : 0;
    
    // Total sales calculation: Priority given to Trading API sold counts
    const parentEstimatedSales = tradingVariations.length > 0 
      ? tradingVariations.reduce((s, v) => s + v.sold, 0) 
      : estimateSales(item);

    /* =================================================
        FINAL UI SAFE RESPONSE
    ================================================= */
    res.json({
      seller: {
        username: seller.username,
        feedbackScore: seller.feedbackScore || 0,
        positiveFeedbackPercent: seller.positiveFeedbackPercent || 0,
        topRatedSeller: seller.topRatedSeller || false,
        relatedActiveListings: sellerItems.length,
        estimatedTotalSales: sellerEstimatedSales,
        strengthScore: (seller.topRatedSeller ? 30 : 0) + (seller.positiveFeedbackPercent > 98 ? 20 : 0) + Math.min(Math.round(sellerEstimatedSales / 5), 50),
        successRate: `${successRate}%`
      },
      product: {
        itemId,
        title: tradingTitle || item.title,
        condition: item.condition,
        itemUrl: item.itemWebUrl || `https://www.ebay.co.uk/itm/${itemId}`,
        pricing: { currency: item.price?.currency, price: Number(item.price?.value) },
        inventory: {
          estimatedSales: parentEstimatedSales,
          stockLevel: tradingVariations.length > 0 ? tradingVariations.reduce((s, v) => s + v.stock, 0) : "N/A"
        },
        shipping: {
          shippingCost: Number(item.shippingOptions?.[0]?.shippingCost?.value ?? 0),
          freeShipping: Number(item.shippingOptions?.[0]?.shippingCost?.value ?? 0) === 0
        },
        variations: {
          summary: tradingVariations.length > 0 ? `${tradingVariations.length} variations found` : "Single SKU",
          confidence: tradingVariations.length > 0 ? "high" : "low",
          details: tradingVariations
        }
      },
      marketAnalysis: {
        marketplace: market,
        competitionLevel: sellerItems.length > 50 ? "High" : "Low",
        pricePosition: "market",
        confidenceNote: tradingVariations.length > 0 ? "Variation data extracted via Trading API" : "Limited variation data available"
      }
    });

  } catch (error) {
    console.error("EBAY_ANALYSIS_CRASH:", error.message);
    res.status(500).json({ message: "Failed to perform deep analysis" });
  }
};