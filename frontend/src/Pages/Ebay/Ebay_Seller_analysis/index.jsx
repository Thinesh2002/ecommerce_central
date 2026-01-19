import { useState } from "react";
import API from "../../../config/api";

export default function SellerProfilePage() {
  const [itemId, setItemId] = useState("");
  const [market, setMarket] = useState("EBAY_GB");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSellerProfile = async () => {
    if (!itemId.trim()) {
      setError("Please enter a valid eBay Item ID");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await API.post("/seller/profile", {
        itemId: itemId.trim(),
        market
      });
      setData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to fetch seller data"
      );
    } finally {
      setLoading(false);
    }
  };

  const seller = data?.seller;
  const product = data?.product;
  const marketAnalysis = data?.marketAnalysis;
  const variations = product?.variations;

  return (
    <div className="min-h-screen bg-[#0b1220] text-gray-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-white">
            eBay Competitor Analysis
          </h1>
          <p className="text-sm text-gray-400">
            Analyze seller strength, pricing and market position
          </p>
        </header>

        {/* SEARCH BAR */}
        <div className="bg-[#020617] border border-gray-700 rounded-xl p-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Enter eBay Item ID (eg: 267193789804)"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="flex-1 bg-[#020617] border border-gray-700 px-4 py-2 rounded focus:outline-none focus:border-gray-400"
          />

          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="bg-[#020617] border border-gray-700 px-4 py-2 rounded"
          >
            <option value="EBAY_GB">UK</option>
            <option value="EBAY_US">USA</option>
            <option value="EBAY_DE">Germany</option>
            <option value="EBAY_FR">France</option>
          </select>

          <button
            onClick={fetchSellerProfile}
            className="px-6 py-2 rounded bg-gray-800 hover:bg-gray-700 text-white font-medium"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* STATES */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* RESULTS */}
        {data && (
          <>
            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPI title="Seller Sales" value={seller.estimatedTotalSales} />
              <KPI title="Avg Sales / Listing" value={seller.estimatedAvgSalesPerListing} />
              <KPI title="Competition" value={marketAnalysis.competitionLevel} />
              <KPI title="Price Position" value={marketAnalysis.pricePosition} />
            </div>

            {/* SELLER CARD */}
            <Card title="Seller Overview">
              <Info label="Username" value={seller.username} />
              <Info label="Feedback Score" value={seller.feedbackScore} />
              <Info label="Positive Feedback %" value={seller.positiveFeedbackPercent ?? "N/A"} />
              <Info label="Related Listings Found" value={seller.relatedActiveListings} />
            </Card>

            {/* PRODUCT CARD */}
            <Card title="Product Overview">
              <Info label="Title" value={product.title} />
              <Info label="Condition" value={product.condition} />
              <Info label="Listing Type" value={product.listingType} />
              <Info
                label="Price"
                value={`${product.pricing.currency} ${product.pricing.price}`}
              />
              <Info
                label="Estimated Sales"
                value={
                  product.inventory.estimatedSalesRange
                    ? `${product.inventory.estimatedSalesRange.min} – ${product.inventory.estimatedSalesRange.max}`
                    : product.inventory.estimatedSales
                }
              />

              <a
                href={product.itemUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-xs text-gray-400 hover:text-white underline"
              >
                View listing on eBay
              </a>
            </Card>

            {/* SHIPPING + VARIATIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Shipping & Returns">
                <Info
                  label="Shipping Cost"
                  value={
                    product.shipping.freeShipping
                      ? "Free Shipping"
                      : product.shipping.shippingCost
                  }
                />
                <Info
                  label="Returns Accepted"
                  value={product.returns?.returnsAccepted ? "Yes" : "No"}
                />
              </Card>

              <Card title="Variation Insight">
                <Info label="Summary" value={variations.summary} />
                <Info label="Type" value={variations.type} />
                <Info label="Confidence" value={variations.confidence.toUpperCase()} />

                {variations.note && (
                  <p className="mt-3 text-xs text-gray-400 border-l-4 border-gray-600 pl-3">
                    {variations.note}
                  </p>
                )}
              </Card>
            </div>

            {/* MARKET NOTE */}
            <div className="text-xs text-gray-400 bg-[#020617] border border-gray-700 rounded-lg p-4">
              {marketAnalysis.confidenceNote}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Card({ title, children }) {
  return (
    <div className="bg-[#020617] border border-gray-700 rounded-xl p-5 space-y-2">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-right break-all">{value}</span>
    </div>
  );
}

function KPI({ title, value }) {
  return (
    <div className="bg-[#020617] border border-gray-700 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-xl font-semibold text-white mt-1">{value}</p>
    </div>
  );
}
