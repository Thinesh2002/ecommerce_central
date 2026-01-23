import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { FaFilter, FaFileExport, FaSearch } from "react-icons/fa";

/* ================= CONFIG ================= */

const ITEM_ID = "eBay item ID";
const ROWS_PER_PAGE = 200;

const METRIC_COLUMNS = [
  "Total impressions",
  "Click-through rate = Page views from eBay site/Total impressions",
  "Quantity sold",
  "% Top 20 search impressions"
];

const METRIC_COLORS = {
  "Total impressions": "bg-gray-900",
  "Click-through rate = Page views from eBay site/Total impressions":
    "bg-gray-800",
  "Quantity sold": "bg-gray-900",
  "% Top 20 search impressions": "bg-gray-800"
};

/* ================= HELPERS ================= */

const cleanNumber = (val) => {
  if (!val) return null;
  const s = val.toString().replace(/,/g, "").replace(/%/g, "").trim();
  return s === "" || isNaN(s) ? null : Number(s);
};

const fmt = (num) =>
  num === null
    ? "—"
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

const diffColor = (num) => {
  if (num > 0) return "text-green-400";
  if (num < 0) return "text-red-400";
  return "text-gray-200";
};

/* ================= COMPONENT ================= */

export default function App() {
  const [file1Name, setFile1Name] = useState("");
  const [file2Name, setFile2Name] = useState("");

  const [tempFile1, setTempFile1] = useState(null);
  const [tempFile2, setTempFile2] = useState(null);

  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [visibleMetrics, setVisibleMetrics] =
    useState(METRIC_COLUMNS);

  const [currentPage, setCurrentPage] = useState(1);

  const filterRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* ================= CSV PARSE ================= */

  const parseFile = (file, setter) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const headerIndex = rows.findIndex((r) => r.includes(ITEM_ID));
        const headers = rows[headerIndex];
        const dataRows = rows.slice(headerIndex + 1);

        const formatted = dataRows
          .filter((r) => r[headers.indexOf(ITEM_ID)])
          .map((row) => {
            const obj = {};
            headers.forEach((h, i) => (obj[h] = row[i]));
            return obj;
          });

        setter(formatted);
      }
    });
  };

  /* ================= SUBMIT / CLEAR ================= */

  const handleSubmit = () => {
    if (!file1Name.trim() || !file2Name.trim()) {
      setError("Please type a name for both tables before submit");
      return;
    }

    if (!tempFile1 || !tempFile2) {
      setError("Please upload both CSV files");
      return;
    }

    setFile1Data(tempFile1);
    setFile2Data(tempFile2);
    setSubmitted(true);
    setError("");
  };

  const handleClear = () => {
    setFile1Name("");
    setFile2Name("");
    setTempFile1(null);
    setTempFile2(null);
    setFile1Data(null);
    setFile2Data(null);
    setSubmitted(false);
    setSearch("");
    setCurrentPage(1);
  };

  const canCompare = submitted && file1Data && file2Data;

  /* ================= MERGE + SEARCH ================= */

  const searchTerms = search.toLowerCase().split(" ").filter(Boolean);

  const rows = canCompare
    ? Object.values(
        [...file1Data, ...file2Data].reduce((acc, r) => {
          const id = r[ITEM_ID];
          acc[id] = acc[id] || { file1: {}, file2: {} };
          file1Data.includes(r)
            ? (acc[id].file1 = r)
            : (acc[id].file2 = r);
          return acc;
        }, {})
      ).filter(({ file1, file2 }) => {
        const id = (file1[ITEM_ID] || file2[ITEM_ID] || "").toLowerCase();
        return searchTerms.length === 0
          ? true
          : searchTerms.some((t) => id.includes(t));
      })
    : [];

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);

  const paginatedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  /* ================= EXPORT ================= */

const exportCSV = () => {
  const exportRows = rows; // pagination ignored
  const out = [];

  const metricsToExport =
    visibleMetrics.length > 0 ? visibleMetrics : METRIC_COLUMNS;

  exportRows.forEach(({ file1, file2 }) => {
    const obj = {};

    // ✅ Clean, Excel-safe Item ID (NO apostrophe, NO spaces)
    const rawId = (file1[ITEM_ID] || file2[ITEM_ID] || "")
      .toString()
      .trim();

    obj[ITEM_ID] = `${rawId}`;

    metricsToExport.forEach((m) => {
      const n1 = cleanNumber(file1[m]) ?? 0;
      const n2 = cleanNumber(file2[m]) ?? 0;
      const diff = n2 - n1;

      obj[`${file1Name} - ${m}`] = n1;
      obj[`${file2Name} - ${m}`] = n2;
      obj[`Diff - ${m}`] = diff;
    });

    out.push(obj);
  });

  const csv = Papa.unparse(out);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ebay_traffic_comparison.csv";
  a.click();
};



  /* ================= UI ================= */

  return (
    <div className="min-h-screen text-gray-100 p-6">
      <h1 className="text-2xl font-semibold mb-6">
        eBay Traffic Report Comparison
      </h1>

      {error && (
        <div className="mb-4 bg-red-900/30 text-red-400 px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {!submitted && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="bg-gray-900 border border-gray-800 p-4 rounded-xl"
            >
              <input
                className="w-full mb-3 px-3 py-2 bg-gray-950 rounded-md"
                placeholder={`Table ${n} Name`}
                value={n === 1 ? file1Name : file2Name}
                onChange={(e) =>
                  n === 1
                    ? setFile1Name(e.target.value)
                    : setFile2Name(e.target.value)
                }
              />

              <input
                type="file"
                accept=".csv"
                onChange={(e) =>
                  parseFile(
                    e.target.files[0],
                    n === 1 ? setTempFile1 : setTempFile2
                  )
                }
              />
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="col-span-2 bg-green-700 hover:bg-green-600 py-3 rounded-lg font-semibold"
          >
            Submit & Compare
          </button>
        </div>
      )}

      {submitted && (
        <button
          onClick={handleClear}
          className="mb-4 bg-red-700 hover:bg-red-600 px-4 py-2 rounded-md"
        >
          Clear & Upload New Files
        </button>
      )}

      {canCompare && (
        <>
          {/* ACTION BAR */}
          <div className="flex gap-3 mb-4 items-center relative">
            <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded-md">
              <FaSearch />
              <input
                className="bg-transparent outline-none text-sm"
                placeholder="Search eBay item IDs (space separated)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-md"
            >
              <FaFilter /> Columns
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-md"
            >
              <FaFileExport /> Export
            </button>

            {showFilter && (
              <div
                ref={filterRef}
                className="absolute top-12 left-40 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 w-72"
              >
                <p className="font-semibold mb-2 text-sm">
                  Show / Hide Metrics
                </p>

                {METRIC_COLUMNS.map((m) => (
                  <label key={m} className="flex gap-2 text-sm mb-1">
                    <input
                      type="checkbox"
                      checked={visibleMetrics.includes(m)}
                      onChange={() =>
                        setVisibleMetrics((prev) =>
                          prev.includes(m)
                            ? prev.filter((x) => x !== m)
                            : [...prev, m]
                        )
                      }
                    />
                    {m}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-gray-700 rounded-xl">
            <table className="min-w-max w-full text-sm border border-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 border border-gray-700 bg-gray-900">
                    eBay Item ID
                  </th>

                  {visibleMetrics.map((m) => (
                    <th
                      key={m}
                      colSpan={3}
                      className={`px-4 py-3 border border-gray-700 ${METRIC_COLORS[m]}`}
                    >
                      {m}
                    </th>
                  ))}
                </tr>

                <tr>
                  <th className="border border-gray-700 bg-gray-900" />
                  {visibleMetrics.map(() => (
                    <>
                      <th className="px-4 py-2 border border-gray-700">
                        {file1Name}
                      </th>
                      <th className="px-4 py-2 border border-gray-700">
                        {file2Name}
                      </th>
                      <th className="px-4 py-2 border border-gray-700">
                        Diff
                      </th>
                    </>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map(({ file1, file2 }, i) => (
                  <tr key={i} className="hover:bg-gray-900/40">
                    <td className="px-4 py-2 border border-gray-700 bg-gray-950">
                      <a
                        href={`https://www.ebay.co.uk/itm/${
                          file1[ITEM_ID] || file2[ITEM_ID]
                        }`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white hover:text-sky-400 transition font-medium"
                      >
                        {file1[ITEM_ID] || file2[ITEM_ID]}
                      </a>
                    </td>

                    {visibleMetrics.map((m) => {
                      const n1 = cleanNumber(file1[m]);
                      const n2 = cleanNumber(file2[m]);
                      const diff = (n2 ?? 0) - (n1 ?? 0);

                      return (
                        <>
                          <td
                            className={`px-4 py-2 border border-gray-700 ${METRIC_COLORS[m]}`}
                          >
                            {fmt(n1)}
                          </td>
                          <td
                            className={`px-4 py-2 border border-gray-700 ${METRIC_COLORS[m]}`}
                          >
                            {fmt(n2)}
                          </td>
                          <td
                            className={`px-4 py-2 border border-gray-700 font-semibold ${METRIC_COLORS[m]} ${diffColor(
                              diff
                            )}`}
                          >
                            {fmt(diff)}
                          </td>
                        </>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-4 py-2 rounded-md border border-gray-700 bg-gray-900 disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-4 py-2 rounded-md border border-gray-700 bg-gray-900 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
