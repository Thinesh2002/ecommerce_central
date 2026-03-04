import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { FaFilter, FaFileExport, FaSearch, FaCloudUploadAlt, FaHistory, FaExternalLinkAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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
  "Total impressions": "bg-white/[0.02]",
  "Click-through rate = Page views from eBay site/Total impressions": "bg-white/[0.04]",
  "Quantity sold": "bg-white/[0.02]",
  "% Top 20 search impressions": "bg-white/[0.04]"
};

/* ================= HELPERS ================= */
const cleanNumber = (val) => {
  if (!val) return null;
  const s = val.toString().replace(/,/g, "").replace(/%/g, "").trim();
  return s === "" || isNaN(s) ? null : Number(s);
};

const fmt = (num) =>
  num === null ? "—" : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const diffColor = (num) => {
  if (num > 0) return "text-green-400 bg-green-500/10";
  if (num < 0) return "text-red-400 bg-red-500/10";
  return "text-gray-400 bg-white/5";
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
  const [visibleMetrics, setVisibleMetrics] = useState(METRIC_COLUMNS);
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
    setFile1Name(""); setFile2Name(""); setTempFile1(null); setTempFile2(null);
    setFile1Data(null); setFile2Data(null); setSubmitted(false); setSearch("");
    setCurrentPage(1);
  };

  const canCompare = submitted && file1Data && file2Data;
  const searchTerms = search.toLowerCase().split(" ").filter(Boolean);

  const rows = canCompare
    ? Object.values(
        [...file1Data, ...file2Data].reduce((acc, r) => {
          const id = r[ITEM_ID];
          acc[id] = acc[id] || { file1: {}, file2: {} };
          file1Data.includes(r) ? (acc[id].file1 = r) : (acc[id].file2 = r);
          return acc;
        }, {})
      ).filter(({ file1, file2 }) => {
        const id = (file1[ITEM_ID] || file2[ITEM_ID] || "").toLowerCase();
        return searchTerms.length === 0 ? true : searchTerms.some((t) => id.includes(t));
      })
    : [];

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const paginatedRows = rows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  /* ================= EXPORT ================= */
  const exportCSV = () => {
    const out = [];
    const metricsToExport = visibleMetrics.length > 0 ? visibleMetrics : METRIC_COLUMNS;
    rows.forEach(({ file1, file2 }) => {
      const obj = {};
      const rawId = (file1[ITEM_ID] || file2[ITEM_ID] || "").toString().trim();
      obj[ITEM_ID] = `${rawId}`;
      metricsToExport.forEach((m) => {
        const n1 = cleanNumber(file1[m]) ?? 0;
        const n2 = cleanNumber(file2[m]) ?? 0;
        obj[`${file1Name} - ${m}`] = n1;
        obj[`${file2Name} - ${m}`] = n2;
        obj[`Diff - ${m}`] = n2 - n1;
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Traffic Report <span className="text-orange-500 underline decoration-orange-500/30">Analysis</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Deep dive into your eBay performance metrics.</p>
        </div>
        
        {submitted && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleClear}
            className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <FaHistory /> Reset Analysis
          </motion.button>
        )}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </motion.div>
      )}

      {/* UPLOAD CARDS */}
      {!submitted && (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="bg-[#0f172a] border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <FaCloudUploadAlt size={80} className="text-orange-500" />
              </div>
              
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500 text-white font-bold text-xs">0{n}</span>
                  <input
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600"
                    placeholder={`Table ${n} Name (e.g. June Report)`}
                    value={n === 1 ? file1Name : file2Name}
                    onChange={(e) => n === 1 ? setFile1Name(e.target.value) : setFile2Name(e.target.value)}
                  />
                </div>

                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-orange-500/5 hover:border-orange-500/40 transition-all group/label">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FaCloudUploadAlt className="text-3xl text-gray-500 group-hover/label:text-orange-500 mb-3 transition-colors" />
                    <p className="text-sm text-gray-400 font-medium">
                      {(n === 1 ? tempFile1 : tempFile2) ? (
                        <span className="text-orange-500 font-bold">File Loaded Successfully</span>
                      ) : "Click to upload CSV report"}
                    </p>
                  </div>
                  <input type="file" className="hidden" accept=".csv" onChange={(e) => parseFile(e.target.files[0], n === 1 ? setTempFile1 : setTempFile2)} />
                </label>
              </div>
            </div>
          ))}

          <motion.button
            whileHover={{ scale: 1.01, translateY: -2 }} whileTap={{ scale: 0.99 }}
            onClick={handleSubmit}
            className="md:col-span-2 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 transition-all uppercase tracking-widest"
          >
            Start Comparison
          </motion.button>
        </div>
      )}

      {/* DATA ANALYSIS VIEW */}
      {canCompare && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-3 bg-[#0f172a]/50 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex-1 min-w-[300px] flex items-center gap-3 bg-black/20 border border-white/5 px-4 py-2.5 rounded-xl focus-within:border-orange-500/50 transition-all group">
              <FaSearch className="text-gray-500 group-focus-within:text-orange-500" />
              <input 
                className="bg-transparent outline-none text-sm w-full placeholder:text-gray-600" 
                placeholder="Search Item IDs (separated by space)..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setShowFilter(!showFilter)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${showFilter ? "bg-orange-500 border-orange-500 text-white" : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"}`}
              >
                <FaFilter /> Columns
              </button>
              
              <AnimatePresence>
                {showFilter && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 z-50 bg-[#1e293b] border border-white/10 rounded-2xl p-5 w-80 shadow-2xl"
                  >
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">Metric Visibility</p>
                    <div className="space-y-2">
                      {METRIC_COLUMNS.map((m) => (
                        <label key={m} className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-all group">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded accent-orange-500" 
                            checked={visibleMetrics.includes(m)} 
                            onChange={() => setVisibleMetrics(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m])} 
                          />
                          <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{m}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={exportCSV} className="flex items-center gap-2 bg-white text-black hover:bg-orange-500 hover:text-white px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-black/20">
              <FaFileExport /> Export CSV
            </button>
          </div>

          {/* MAIN DATA TABLE */}
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="overflow-x-auto sidebar-scroll max-h-[65vh]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-[#1e293b] text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <th className="px-6 py-5 border-b border-white/10 sticky left-0 z-40 bg-[#1e293b]">Item Identity</th>
                    {visibleMetrics.map((m) => (
                      <th key={m} colSpan={3} className={`px-4 py-5 border-b border-white/10 border-l border-white/5 text-center text-orange-500 bg-orange-500/[0.03]`}>
                        {m}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-[#1e293b]/90 backdrop-blur-md text-[9px] font-bold text-gray-500 uppercase border-b border-white/10">
                    <th className="px-6 py-3 sticky left-0 z-40 bg-[#1e293b]">eBay Item ID</th>
                    {visibleMetrics.map((m, idx) => (
                      <React.Fragment key={idx}>
                        <th className="px-4 py-3 border-l border-white/5 text-center">{file1Name}</th>
                        <th className="px-4 py-3 text-center">{file2Name}</th>
                        <th className="px-4 py-3 text-center bg-white/5 font-black text-gray-400">Change</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/[0.05]">
                  {paginatedRows.map(({ file1, file2 }, i) => {
                    const id = file1[ITEM_ID] || file2[ITEM_ID];
                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 sticky left-0 z-20 bg-[#0f172a] border-r border-white/5 group-hover:bg-[#151c2f] transition-colors">
                          <a 
                            href={`https://www.ebay.co.uk/itm/${id}`} 
                            target="_blank" rel="noreferrer" 
                            className="flex items-center gap-2 text-white hover:text-orange-500 font-bold transition-all"
                          >
                            {id} <FaExternalLinkAlt size={10} className="opacity-30 group-hover:opacity-100" />
                          </a>
                        </td>

                        {visibleMetrics.map((m, idx) => {
                          const n1 = cleanNumber(file1[m]);
                          const n2 = cleanNumber(file2[m]);
                          const diff = (n2 ?? 0) - (n1 ?? 0);
                          return (
                            <React.Fragment key={idx}>
                              <td className={`px-4 py-4 text-center text-gray-400 border-l border-white/5 ${METRIC_COLORS[m]}`}>{fmt(n1)}</td>
                              <td className={`px-4 py-4 text-center text-white ${METRIC_COLORS[m]}`}>{fmt(n2)}</td>
                              <td className={`px-4 py-4 text-center ${METRIC_COLORS[m]}`}>
                                <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-[10px] min-w-[60px] ${diffColor(diff)}`}>
                                  {diff > 0 ? `+${fmt(diff)}` : fmt(diff)}
                                </span>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[#0f172a] rounded-3xl border border-white/10 shadow-lg">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Showing <span className="text-white">{(currentPage-1)*ROWS_PER_PAGE + 1} - {Math.min(currentPage*ROWS_PER_PAGE, rows.length)}</span> of {rows.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold hover:bg-orange-500 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 transition-all"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1 px-3">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pNum = i + 1;
                    return (
                      <button 
                        key={i} 
                        onClick={() => setCurrentPage(pNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pNum ? "bg-orange-500 text-white" : "text-gray-500 hover:text-white"}`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold hover:bg-orange-500 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}