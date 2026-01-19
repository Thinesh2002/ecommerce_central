import { useState } from "react";
import { searchKeywords } from "../../../config/api";

const ITEMS_PER_PAGE = 20;

export default function Keyword() {
  const [keyword, setKeyword] = useState("");
  const [market, setMarket] = useState("EBAY_GB");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError("Please enter a keyword");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);
    setCurrentPage(1);

    try {
      const res = await searchKeywords({ keyword, market });
      setResult(res);
    } catch (err) {
      setError("Failed to fetch keyword data");
    } finally {
      setLoading(false);
    }
  };

  const getLevel = (percent) => {
    if (percent >= 40) return { label: "High", color: "text-green-400" };
    if (percent >= 20) return { label: "Medium", color: "text-yellow-400" };
    return { label: "Low", color: "text-red-400" };
  };

  /* ---------------- PAGINATION LOGIC ---------------- */
  const totalKeywords = result?.relatedDemandKeywords?.length || 0;
  const totalPages = Math.ceil(totalKeywords / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedKeywords =
    result?.relatedDemandKeywords?.slice(startIndex, endIndex) || [];

  /* -------------------------------------------------- */

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-200">
      <h2 className="text-2xl font-semibold mb-6">
        eBay Keyword Demand & Competitor Analyzer
      </h2>

      {/* INPUT */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter keyword (ex: lamp shade)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md bg-gray-900 border border-gray-700"
        />

        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="px-4 py-2 rounded-md bg-gray-900 border border-gray-700"
        >
          <option value="EBAY_GB">UK</option>
          <option value="EBAY_DE">Germany</option>
        </select>

        <button
          onClick={handleSearch}
          className="px-6 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
        >
          Search
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {loading && <p className="text-gray-400 mb-4">Loading analysis…</p>}

      {result && (
        <>
          {/* SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-md p-4">
              <p className="text-gray-400">Keyword</p>
              <p className="font-medium">{result.searchedKeyword}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-md p-4">
              <p className="text-gray-400">Market</p>
              <p className="font-medium">{result.market}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-md p-4">
              <p className="text-gray-400">Total Listings</p>
              <p className="font-medium">{result.totalListings}</p>
            </div>
          </div>

          {/* ================= DEMAND KEYWORDS ================= */}
          <h3 className="text-lg font-semibold mb-3">
            Related Demand Keywords
          </h3>

          <div className="overflow-x-auto mb-4">
            <table className="w-full border border-gray-800 rounded-md">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left border-b border-gray-700">
                    Keyword
                  </th>
                  <th className="px-4 py-3 text-left border-b border-gray-700">
                    Demand Count
                  </th>
                  <th className="px-4 py-3 text-left border-b border-gray-700">
                    Demand %
                  </th>
                  <th className="px-4 py-3 text-left border-b border-gray-700">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedKeywords.map((item, i) => {
                  const percent =
                    (item.demand / result.totalListings) * 100;
                  const level = getLevel(percent);

                  return (
                    <tr key={i} className="hover:bg-gray-900">
                      <td className="px-4 py-3 border-b border-gray-800">
                        {item.keyword}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-800">
                        {item.demand}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-800">
                        {percent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 border-b border-gray-800">
                        <span className={level.color}>{level.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex gap-2 items-center mb-10">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-40"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1
                      ? "bg-gray-600 border-gray-500"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          {/* ================= TOP COMPETITORS ================= */}
          <h3 className="text-lg font-semibold mb-3">
            Top 10 Competitors (Estimated Sales)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-800 rounded-md">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 border-b border-gray-700">
                    Product
                  </th>
                  <th className="px-4 py-3 border-b border-gray-700">
                    Seller
                  </th>
                  <th className="px-4 py-3 border-b border-gray-700">
                    Price
                  </th>
                  <th className="px-4 py-3 border-b border-gray-700">
                    Est. Sales
                  </th>
                  <th className="px-4 py-3 border-b border-gray-700">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.topCompetitors.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-900">
                    <td className="px-4 py-3 border-b border-gray-800">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-800">
                      {item.seller}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-800">
                      {item.price} {item.currency}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-800 text-green-400">
                      {item.estimatedSales}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-800">
                      <a
                        href={item.itemUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
