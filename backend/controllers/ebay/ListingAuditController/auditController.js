const axios = require("axios");
const getEbayToken = require("../../../config/ebay/ebayAuth");

const MARKETPLACES = [
  "EBAY_US",
  "EBAY_GB",
  "EBAY_DE",
  "EBAY_FR",
  "EBAY_IT",
  "EBAY_ES",
  "EBAY_AU",
  "EBAY_CA"
];

exports.auditListing = async (req, res) => {
  const { itemId, targetKeywords = [] } = req.body;

  if (!itemId) {
    return res.status(400).json({ message: "Item ID is required" });
  }

  try {
    const token = await getEbayToken();

    if (!token) {
      return res.status(500).json({
        status: "ERROR",
        message: "Unable to retrieve eBay token"
      });
    }

    let listing = null;
    let usedMarketplace = null;
    let formattedItemId = null;

    // Try both raw ID and RESTful ID
    const possibleIds = [
      itemId,
      `v1|${itemId}|0`
    ];

    for (const id of possibleIds) {
      for (const market of MARKETPLACES) {
        try {
          const response = await axios.get(
            `https://api.ebay.com/buy/browse/v1/item/${id}?fieldgroups=PRODUCT,EXTENDED`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "X-EBAY-C-MARKETPLACE-ID": market,
                "Content-Type": "application/json"
              }
            }
          );

          listing = response.data;
          usedMarketplace = market;
          formattedItemId = id;
          break;
        } catch (err) {
          continue;
        }
      }
      if (listing) break;
    }

    if (!listing) {
      return res.status(404).json({
        status: "FAILED",
        reason: "ITEM_NOT_FOUND_OR_ENDED"
      });
    }

    /* ==============================
       FOUNDATION DATA
    ============================== */

    const title = listing.title || "";
    const subtitle = listing.subtitle || "";
    const description = listing.description || "";
    const price = parseFloat(listing.price?.value || 0);
    const originalPrice = parseFloat(
      listing.price?.originalPrice?.value || 0
    );
    const currency = listing.price?.currency || "USD";
    const condition = listing.condition || "";
    const categoryPath = listing.categoryPath || [];
    const itemSpecifics = listing.localizedAspects || [];
    const parentId = listing.itemGroupId || null;
    const isVariation = !!listing.itemGroupId;

    const images = [
      listing.image,
      ...(listing.additionalImages || [])
    ]
      .filter(Boolean)
      .map(img => img.imageUrl || img);

    /* ==============================
       TITLE SCORE
    ============================== */

    const words = title.toLowerCase().split(/\s+/).filter(Boolean);
    const uniqueWords = new Set(words);

    let titleScore = 0;

    if (title.length >= 75) titleScore += 10;
    if (uniqueWords.size === words.length) titleScore += 5;
    if (!/[^a-zA-Z0-9\s]/.test(title)) titleScore += 5;
    if (title !== title.toUpperCase()) titleScore += 5;

    const foundKeywords = targetKeywords.filter(k =>
      title.toLowerCase().includes(k.toLowerCase())
    );

    const missingKeywords = targetKeywords.filter(
      k => !title.toLowerCase().includes(k.toLowerCase())
    );

    if (foundKeywords.length > 0) titleScore += 5;

    /* ==============================
       ITEM SPECIFICS SCORE
    ============================== */

    const requiredSpecs = [
      "Brand",
      "MPN",
      "Type",
      "Color",
      "Size",
      "Material",
      "Model",
      "UPC"
    ];

    const existingSpecs = itemSpecifics.map(a => a.name);
    const missingSpecs = requiredSpecs.filter(
      r => !existingSpecs.includes(r)
    );

    let specificsScore = 10;
    if (itemSpecifics.length >= 12) specificsScore += 10;
    if (missingSpecs.length === 0) specificsScore += 5;

    /* ==============================
       IMAGE SCORE
    ============================== */

    let imageScore = 0;
    if (images.length >= 8) imageScore += 10;
    else if (images.length >= 5) imageScore += 5;

    if (images.some(img => img.includes("s-l1600"))) {
      imageScore += 5;
    }

    /* ==============================
       DESCRIPTION SCORE
    ============================== */

    let descriptionScore = 0;

    if (description.includes("<li>")) descriptionScore += 5;
    if (description.length > 500) descriptionScore += 5;

    const mobileResponsive =
      !description.includes("width=") &&
      !description.includes("height=");

    /* ==============================
       COMPETITOR ANALYSIS
    ============================== */

    let competitorData = [];
    let avgMarketPrice = 0;

    try {
      const searchRes = await axios.get(
        `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(
          title.split(" ").slice(0, 3).join(" ")
        )}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": usedMarketplace,
            "Content-Type": "application/json"
          }
        }
      );

      competitorData = searchRes.data.itemSummaries || [];

      const prices = competitorData
        .map(c => parseFloat(c.price?.value || 0))
        .filter(p => p > 0);

      if (prices.length > 0) {
        avgMarketPrice =
          prices.reduce((a, b) => a + b, 0) / prices.length;
      }
    } catch (err) {
      console.log("Competitor search failed");
    }

    /* ==============================
       PRICING SCORE
    ============================== */

    let pricingScore = 0;
    let pricePosition = "Unknown";

    if (avgMarketPrice > 0) {
      const deviation =
        ((price - avgMarketPrice) / avgMarketPrice) * 100;

      if (deviation < -10) {
        pricePosition = "Below Market";
        pricingScore += 10;
      } else if (deviation > 15) {
        pricePosition = "Above Market";
      } else {
        pricePosition = "Competitive";
        pricingScore += 8;
      }
    }

    /* ==============================
       SHIPPING SCORE
    ============================== */

    const shippingCost = parseFloat(
      listing.shippingOptions?.[0]?.shippingCost?.value || 0
    );

    let shippingScore = 0;
    if (shippingCost === 0) shippingScore += 10;
    if (listing.estimatedDeliveryDate) shippingScore += 5;

    /* ==============================
       FINAL SCORE
    ============================== */

    const autoImprovementScore = Math.min(
      Math.round(
        (titleScore +
          specificsScore +
          imageScore +
          pricingScore +
          shippingScore +
          descriptionScore) / 1.2
      ),
      100
    );

    /* ==============================
       RESPONSE
    ============================== */

    res.json({
      status: "SUCCESS",
      marketplace: usedMarketplace,
      itemId: formattedItemId,
      autoImprovementScore,
      foundationData: {
        title,
        subtitle,
        price,
        originalPrice,
        currency,
        condition,
        categoryPath,
        isVariation,
        parentId
      },
      analysis: {
        title: {
          score: titleScore,
          length: title.length,
          foundKeywords,
          missingKeywords
        },
        itemSpecifics: {
          score: specificsScore,
          total: itemSpecifics.length,
          missingSpecs
        },
        description: {
          score: descriptionScore,
          mobileResponsive
        },
        images: {
          score: imageScore,
          totalImages: images.length
        },
        pricing: {
          score: pricingScore,
          avgMarketPrice,
          pricePosition
        },
        shipping: {
          score: shippingScore,
          shippingCost
        },
        competitorComparison: {
          competitorCount: competitorData.length
        }
      }
    });

  } catch (error) {
    console.log("STATUS:", error.response?.status);
    console.log("EBAY ERROR:", error.response?.data);

    res.status(500).json({
      status: "ERROR",
      message: error.response?.data || error.message
    });
  }
};
