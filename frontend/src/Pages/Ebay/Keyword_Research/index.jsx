import { useState } from "react";
import { searchKeywords } from "../../../config/api";

const ITEMS_PER_PAGE = 15;

export default function Keyword() {
  const [keyword, setKeyword] = useState("");
  const [market, setMarket] = useState("EBAY_GB");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError("Please enter a keyword");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setPage(1);

    try {
      const res = await searchKeywords({ keyword, market });
      setResult(res);
    } catch {
      setError("Failed to fetch keyword data");
    } finally {
      setLoading(false);
    }
  };

  /* -------- DEMAND LEVEL -------- */
  const getLevel = (percent) => {
    if (percent >= 40) return { label: "High", color: "text-green-400" };
    if (percent >= 20) return { label: "Medium", color: "text-yellow-400" };
    return { label: "Low", color: "text-red-400" };
  };

  /* -------- PAGINATION -------- */
  const demandKeywords = result?.relatedDemandKeywords || [];
  const totalPages = Math.ceil(demandKeywords.length / ITEMS_PER_PAGE);

  const paginated = demandKeywords.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-200">
      <h2 className="text-2xl font-semibold mb-6">
        eBay Keyword Research Tool
      </h2>

      {/* INPUT */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword (ex: led strip)"
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded"
        />

        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded"
        >
          <option value="EBAY_GB">UK</option>
          <option value="EBAY_DE">Germany</option>
        </select>

        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        >
          Search
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {loading && <p className="text-gray-400 mb-4">Analyzing keywords…</p>}

      {result && (
        <>
          {/* SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              ["Keyword", result.searchedKeyword],
              ["Market", result.market],
              ["Total Listings", result.totalListings]
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-gray-900 border border-gray-800 rounded p-4"
              >
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* ================= DEMAND KEYWORDS ================= */}
          <h3 className="text-lg font-semibold mb-3">Demand Keywords</h3>

          <table className="w-full border border-gray-800 mb-6">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3 text-left">Keyword</th>
                <th className="p-3 text-left">Demand</th>
                <th className="p-3 text-left">Demand %</th>
                <th className="p-3 text-left">Level</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item, i) => {
                const percent =
                  (item.demand / result.totalListings) * 100;
                const level = getLevel(percent);

                return (
                  <tr key={i} className="hover:bg-gray-900">
                    <td className="p-3 border-b border-gray-800">
                      {item.keyword}
                    </td>
                    <td className="p-3 border-b border-gray-800">
                      {item.demand}
                    </td>
                    <td className="p-3 border-b border-gray-800">
                      {percent.toFixed(1)}%
                    </td>
                    <td
                      className={`p-3 border-b border-gray-800 ${level.color}`}
                    >
                      {level.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex gap-2 mb-10">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded border ${
                    page === i + 1
                      ? "bg-gray-600 border-gray-500"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* ================= LONG TAIL ================= */}
          <h3 className="text-lg font-semibold mb-3">
            Long Tail Keywords
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
            {result.longTailKeywords.map((kw, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded p-3 text-sm"
              >
                {kw}
              </div>
            ))}
          </div>

          {/* ================= COMPETITORS ================= */}
          <h3 className="text-lg font-semibold mb-3">
            Top Competitors (Estimated Sales)
          </h3>

          <table className="w-full border border-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Seller</th>
                <th className="p-3">Price</th>
                <th className="p-3">Sales</th>
                <th className="p-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {result.topCompetitors.map((item, i) => (
                <tr key={i} className="hover:bg-gray-900">
                  <td className="p-3 border-b border-gray-800">
                    {item.title}
                  </td>
                  <td className="p-3 border-b border-gray-800">
                    {item.seller}
                  </td>
                  <td className="p-3 border-b border-gray-800">
                    {item.price} {item.currency}
                  </td>
                  <td className="p-3 border-b border-gray-800 text-green-400">
                    {item.estimatedSales}
                  </td>
                  <td className="p-3 border-b border-gray-800">
                    <a
                      href={item.itemUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-gray-300"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
