const axios = require("axios");
const getEbayToken = require("../../config/ebay/ebayAuth");
const tradingConfig = require("../../config/ebay/tradingAuth");
const { estimateSales } = require("../../utils/ebay/seller_analysis/seller_analysis");

const REQUEST_TIMEOUT = 10000;
const PAGE_LIMIT = 50;
const MAX_PAGES = 2;

/* =====================================================
   FULL SELLER PROFILE CONTROLLER (CORRECTED & HONEST)
===================================================== */
exports.getSellerProfile = async (req, res) => {
  const { itemId, market } = req.body;

  if (!itemId || !market) {
    return res.status(400).json({ message: "itemId and market required" });
  }

  try {
    /* =================================================
       STEP 1: TRADING API (TRUE INVENTORY VARIATIONS)
    ================================================= */
    let tradingVariations = [];
    let tradingTitle = null;

    try {
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
            "X-EBAY-API-SITEID": "3",
            "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
            "Content-Type": "text/xml"
          }
        }
      );

      const xml = tradingRes.data;

      tradingTitle =
        xml.match(/<Title>(.*?)<\/Title>/)?.[1] || null;

      const variationBlocks =
        [...xml.matchAll(/<Variation>([\s\S]*?)<\/Variation>/g)] || [];

      tradingVariations = variationBlocks.map((v, index) => {
        const block = v[1];

        const price =
          block.match(/<StartPrice[^>]*>(.*?)<\/StartPrice>/)?.[1] || 0;

        const quantity =
          block.match(/<Quantity>(.*?)<\/Quantity>/)?.[1] || 0;

        const sold =
          block.match(/<QuantitySold>(.*?)<\/QuantitySold>/)?.[1] || 0;

        const attributes =
          [...block.matchAll(
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

    } catch {
      // Trading API optional – fallback allowed
    }

    /* =================================================
       STEP 2: BUY BROWSE API (MAIN ITEM)
    ================================================= */
    const token = await getEbayToken();
    let item;

    const restItemId = itemId.includes("|")
      ? itemId
      : `v1|${itemId}|0`;

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
    } catch {
      const searchRes = await axios.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        {
          timeout: REQUEST_TIMEOUT,
          params: { q: itemId, limit: 1 },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": market
          }
        }
      );

      if (!searchRes.data.itemSummaries?.length) {
        return res.status(404).json({ message: "Item not found" });
      }

      item = searchRes.data.itemSummaries[0];
    }

    const seller = item.seller;

    /* =================================================
       STEP 3: VARIATION META (FINAL LOGIC)
    ================================================= */
    let variationMeta = {
      summary: "Single option",
      type: "single_sku",
      confidence: "high",
      source: "browse_api",
      note: null
    };

    let parentEstimatedSales = 0;

    // TRUE INVENTORY VARIATIONS
    if (tradingVariations.length > 0) {
      parentEstimatedSales = tradingVariations.reduce(
        (s, v) => s + v.sold,
        0
      );

      variationMeta = {
        summary: `${tradingVariations.length} variations`,
        type: "inventory_variation",
        confidence: "high",
        source: "trading_api",
        note: null
      };
    }

    // GROUPED / NON-INVENTORY
    else if (
      item.itemGroupHref ||
      item.itemGroupType ||
      /option|choice|select|variation/i.test(item.title || "")
    ) {
      variationMeta = {
        summary: "Multiple options",
        type: "grouped_non_inventory",
        confidence: "low",
        source: "ebay_grouping",
        note: "Option-level data not available via eBay APIs"
      };
    }

    // SINGLE SKU
    else {
      parentEstimatedSales = estimateSales(item);
    }

    /* =================================================
       STEP 4: SELLER RELATED LISTINGS (NOT FULL STORE)
    ================================================= */
    let sellerItems = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const offset = page * PAGE_LIMIT;

      const resPage = await axios.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        {
          timeout: REQUEST_TIMEOUT,
          params: { q: item.title, limit: PAGE_LIMIT, offset },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": market
          }
        }
      );

      const items = (resPage.data.itemSummaries || [])
        .filter(i => i.seller?.username === seller.username);

      sellerItems.push(...items);

      if (items.length < PAGE_LIMIT) break;
    }

    let sellerEstimatedSales = 0;
    sellerItems.forEach(i => {
      sellerEstimatedSales += estimateSales(i);
    });

    // GROUPED SALES FIX
    if (variationMeta.type === "grouped_non_inventory") {
      parentEstimatedSales = Math.round(
        sellerEstimatedSales / Math.max(sellerItems.length, 1)
      );
    }

    /* =================================================
       STEP 5: SHIPPING + PRICE POSITION FIX
    ================================================= */
    const shippingCost =
      Number(item.shippingOptions?.[0]?.shippingCost?.value ?? 0);

    const avgMarketPrice =
      sellerItems.reduce(
        (s, i) => s + Number(i.price?.value || 0),
        0
      ) / Math.max(sellerItems.length, 1);

    let pricePosition = "market";
    if (item.price?.value < avgMarketPrice * 0.9) pricePosition = "budget";
    if (item.price?.value > avgMarketPrice * 1.1) pricePosition = "premium";

    /* =================================================
       FINAL RESPONSE (UI SAFE)
    ================================================= */
    res.json({
      seller: {
        username: seller.username,
        feedbackScore: seller.feedbackScore ?? null,
        positiveFeedbackPercent: seller.positiveFeedbackPercent ?? null,
        topRatedSeller: seller.topRatedSeller ?? false,
        relatedActiveListings: sellerItems.length,
        estimatedTotalSales: sellerEstimatedSales,
        estimatedAvgSalesPerListing:
          Math.round(sellerEstimatedSales / Math.max(sellerItems.length, 1))
      },

      product: {
        itemId,
        title: tradingTitle || item.title,
        condition: item.condition,
        listingType: "fixed_price",
        itemUrl: item.itemWebUrl,

        pricing: {
          currency: item.price?.currency,
          price: Number(item.price?.value)
        },

        inventory: {
          estimatedSales: parentEstimatedSales,
          estimatedSalesRange:
            variationMeta.confidence === "low"
              ? {
                  min: Math.max(parentEstimatedSales - 5, 0),
                  max: parentEstimatedSales + 5
                }
              : null
        },

        shipping: {
          shippingCost,
          freeShipping: shippingCost === 0
        },

        variations: {
          ...variationMeta,
          count: tradingVariations.length,
          details: tradingVariations
        }
      },

      marketAnalysis: {
        marketplace: market,
        competitionLevel:
          sellerItems.length > 200
            ? "high"
            : sellerItems.length > 50
            ? "medium"
            : "low",
        pricePosition,
        confidenceNote:
          variationMeta.confidence === "low"
            ? "Grouped listing – sales are estimated"
            : "High confidence estimation"
      }
    });

  } catch (error) {
    console.error("EBAY_SELLER_PROFILE_ERROR:", error.response?.data || error);
    res.status(500).json({
      message: "Failed to fetch seller profile"
    });
  }
};
