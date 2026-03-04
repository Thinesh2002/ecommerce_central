import React, { useState, useMemo, useEffect, useRef } from "react";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { Search, ArrowUp, ArrowDown, Filter, ChevronDown, Check, UploadCloud, LayoutDashboard, Download } from "lucide-react";

const CTR_THRESHOLD = 0.01;
const CONVERSION_THRESHOLD = 0.1;

export default function OptimizationDashboard() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const allColumns = [
    "Listing title",
    "eBay item ID",
    "Category",
    "promoted listings status",
    "Total impressions",
    "Total page views",
    "Click-through rate",
    "Quantity sold",
    "Sales conversion rate",
    "Total search impressions",
    "Total Promoted Listings impressions",
    "Total organic impressions",
    "Performance",
  ];

  const performanceOptions = [
    "High Impressions | High CTR | High Sales",
    "High Impressions | Low CTR | High Sales",
    "High Impressions | High CTR | Low Sales",
    "High Impressions | Low CTR | Low Sales",
    "Low Impressions | High CTR | High Sales",
    "Low Impressions | Low CTR | High Sales",
    "Low Impressions | High CTR | Low Sales",
    "Low Impressions | Low CTR | Low Sales",
  ];

  const [visibleColumns, setVisibleColumns] = useState(allColumns);
  const [selectedPerformances, setSelectedPerformances] = useState(performanceOptions);
  const [showColMenu, setShowColMenu] = useState(false);
  const [showPerfMenu, setShowPerfMenu] = useState(false);

  const colMenuRef = useRef(null);
  const perfMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target)) setShowColMenu(false);
      if (perfMenuRef.current && !perfMenuRef.current.contains(event.target)) setShowPerfMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPerformanceStyles = (perf) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-300 shadow-sm ";
    switch (perf) {
      case "High Impressions | High CTR | High Sales":
        return base + "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10";
      case "High Impressions | Low CTR | High Sales":
        return base + "bg-blue-500/10 text-blue-400 border-blue-500/40 shadow-blue-500/10";
      case "High Impressions | High CTR | Low Sales":
        return base + "bg-cyan-500/10 text-cyan-400 border-cyan-500/40 shadow-cyan-500/10";
      case "High Impressions | Low CTR | Low Sales":
        return base + "bg-orange-500/10 text-orange-400 border-orange-500/40 shadow-orange-500/10";
      case "Low Impressions | High CTR | High Sales":
        return base + "bg-purple-500/10 text-purple-400 border-purple-500/40 shadow-purple-500/10";
      case "Low Impressions | Low CTR | High Sales":
        return base + "bg-indigo-500/10 text-indigo-400 border-indigo-500/40 shadow-indigo-500/10";
      case "Low Impressions | High CTR | Low Sales":
        return base + "bg-yellow-500/10 text-yellow-400 border-yellow-500/40 shadow-yellow-500/10";
      case "Low Impressions | Low CTR | Low Sales":
        return base + "bg-red-500/10 text-red-400 border-red-500/40 shadow-red-500/10";
      default:
        return base + "bg-slate-800 text-slate-300 border-slate-600";
    }
  };

  const headerMap = {
    "Listing title": ["Listing title", "Angebotstitel"],
    "eBay item ID": ["eBay item ID", "eBay-Artikelnummer"],
    "Category": ["Category", "Kategorie"],
    "promoted listings status": [
      "promoted listings status",
      "Current promoted listings status",
      "Aktueller Anzeigenstatus",
    ],
    "Total impressions": ["Total impressions", "Gesamtanzahl Impressions"],
    "Total page views": ["Total page views", "Gesamtzahl Seitenaufrufe"],
    "Click-through rate": [
      "Click-through rate",
      "Click-through rate = Page views from eBay site/Total impressions",
      "Klickrate = Seitenaufrufe über eBay-Website/Gesamtzahl Impressions",
    ],
    "Quantity sold": ["Quantity sold", "Verkaufte Stückzahl"],
    "Sales conversion rate": [
      "Sales conversion rate",
      "Sales conversion rate = Quantity sold/Total page views",
      "Konversionsrate = Verkaufte Stückzahl/Gesamtzahl Seitenaufrufe",
    ],
    "Total search impressions": [
      "Total search impressions",
      "Such-Impressions gesamt",
    ],
    "Total Promoted Listings impressions": [
      "Total Promoted Listings impressions",
      "Total Promoted Listings impressions (applies to eBay site only)",
      "Gesamzahl Anzeigen-Impressions (nur auf der eBay-Website)",
    ],
    "Total organic impressions": [
      "Total organic impressions",
      "Total organic impressions on eBay site",
      "Gesamtzahl organische Impressions auf der eBay-Website",
    ],
  };

  const normalize = (str) =>
    str?.toString().replace(/\uFEFF/g, "").trim();

  const parseNumber = (value, isGerman) => {
    if (!value || value === "-" || value === "") return 0;
    let clean = value.toString().replace("%", "").trim();
    if (isGerman) {
      return Number(clean.replace(/\./g, "").replace(",", ".")) || 0;
    } else {
      return Number(clean.replace(/,/g, "")) || 0;
    }
  };

  const cleanItemId = (value) => {
    if (!value) return "";
    return value.toString().replace(/^="/, "").replace(/"$/, "").trim();
  };

  const findHeaderValue = (row, possibleHeaders) => {
    for (let key in row) {
      if (possibleHeaders.includes(normalize(key))) {
        return row[key];
      }
    }
    return "";
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      let text = event.target.result;
      text = text.replace(/\uFEFF/g, "");
      const lines = text.split(/\r?\n/);

      const headerIndex = lines.findIndex((line) =>
        line.includes("Angebotstitel") || line.includes("Listing title")
      );

      if (headerIndex === -1) {
        alert("Header row not found in file.");
        return;
      }

      const headerLine = lines[headerIndex];
      const isGermanFile = headerLine.includes("Angebotstitel");
      let delimiter = ",";
      if (headerLine.includes("\t")) delimiter = "\t";
      else if (headerLine.includes(";")) delimiter = ";";

      const cleanedText = lines.slice(headerIndex).join("\n");

      Papa.parse(cleanedText, {
        header: true,
        delimiter: delimiter,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
        complete: function (results) {
          if (!results.data || results.data.length === 0) {
            alert("Parsed but no data rows found.");
            return;
          }
          processData(results.data, isGermanFile);
        },
        error: function (err) {
          console.error(err);
          alert("Parsing failed.");
        },
      });
    };
    reader.readAsText(file, "UTF-8");
  };

  const processData = (rows, isGerman) => {
    let totalImpressionsVal = 0;
    let count = 0;

    rows.forEach((row) => {
      const impressions = parseNumber(
        findHeaderValue(row, headerMap["Total impressions"]),
        isGerman
      );
      if (impressions > 0) {
        totalImpressionsVal += impressions;
        count++;
      }
    });

    const avgImpressions = count ? totalImpressionsVal / count : 0;

    const processed = rows.map((row) => {
      const rawImpressions = findHeaderValue(row, headerMap["Total impressions"]);
      const impressions = parseNumber(rawImpressions, isGerman);

      const rawCtr = findHeaderValue(row, headerMap["Click-through rate"]);
      const ctr = parseNumber(rawCtr, isGerman) / 100;

      const rawConv = findHeaderValue(row, headerMap["Sales conversion rate"]);
      const conversion = parseNumber(rawConv, isGerman) / 100;

      const impressionLevel = impressions >= avgImpressions ? "High Impressions" : "Low Impressions";
      const ctrLevel = ctr >= CTR_THRESHOLD ? "High CTR" : "Low CTR";
      const conversionLevel = conversion >= CONVERSION_THRESHOLD ? "High Sales" : "Low Sales";

      return {
        "Listing title": findHeaderValue(row, headerMap["Listing title"]),
        "eBay item ID": cleanItemId(findHeaderValue(row, headerMap["eBay item ID"])),
        "Category": findHeaderValue(row, headerMap["Category"]),
        "promoted listings status": findHeaderValue(row, headerMap["promoted listings status"]),
        "Total impressions": rawImpressions,
        "Total page views": findHeaderValue(row, headerMap["Total page views"]),
        "Click-through rate": rawCtr,
        "Quantity sold": findHeaderValue(row, headerMap["Quantity sold"]),
        "Sales conversion rate": rawConv,
        "Total search impressions": findHeaderValue(row, headerMap["Total search impressions"]),
        "Total Promoted Listings impressions": findHeaderValue(row, headerMap["Total Promoted Listings impressions"]),
        "Total organic impressions": findHeaderValue(row, headerMap["Total organic impressions"]),
        "Performance": `${impressionLevel} | ${ctrLevel} | ${conversionLevel}`,
      };
    });
    setData(processed);
  };

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const terms = search.toLowerCase().split(" ");
      result = result.filter((row) =>
        terms.every((term) =>
          allColumns.some((col) =>
            row[col]?.toString().toLowerCase().includes(term)
          )
        )
      );
    }
    result = result.filter((row) => selectedPerformances.includes(row.Performance));
    return result;
  }, [search, data, selectedPerformances]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      return sortConfig.direction === "asc"
        ? aVal.toString().localeCompare(bVal, undefined, { numeric: true })
        : bVal.toString().localeCompare(aVal, undefined, { numeric: true });
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const exportCSV = () => {
    const csv = Papa.unparse(sortedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "Optimization_Data.csv");
  };

  const toggleColumn = (col) => {
    setVisibleColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const togglePerformance = (perf) => {
    setSelectedPerformances(prev => 
      prev.includes(perf) ? prev.filter(p => p !== perf) : [...prev, perf]
    );
  };

  return (
    <div className=" text-slate-200 font-sans relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className=" blur-[120px]"></div>
        <div className=" rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10  mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
       
              <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                Traffic Analysis
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium tracking-wide">UK & DE Traffic Intelligence</p>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-950 rounded-xl hover:bg-slate-200 font-bold text-sm transition-all"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        {/* Toolbar - FIXED Z-INDEX ISSUES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-2xl relative z-50">
          
          <div className="lg:col-span-3">
            <label className="flex items-center justify-center gap-2 h-12 w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all">
              <UploadCloud size={20} className="text-blue-400" />
              <span className="text-sm font-bold">Import CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="lg:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-950/50 border border-slate-700 rounded-xl text-sm focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="lg:col-span-4 flex gap-3">
            {/* Columns Dropdown */}
            <div className="relative flex-1" ref={colMenuRef}>
              <button 
                onClick={() => { setShowColMenu(!showColMenu); setShowPerfMenu(false); }}
                className="w-full h-12 flex items-center justify-between px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold hover:border-slate-500"
              >
                <span className="flex items-center gap-2"><Filter size={16} className="text-blue-400" /> Columns</span>
                <ChevronDown size={16} className={showColMenu ? 'rotate-180' : ''} />
              </button>
              {showColMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[100] p-2 max-h-96 overflow-y-auto ring-1 ring-white/10">
                  <div className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-2">Display Preferences</div>
                  {allColumns.map(col => (
                    <label key={col} className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${visibleColumns.includes(col) ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                        {visibleColumns.includes(col) && <Check size={14} className="text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={visibleColumns.includes(col)} onChange={() => toggleColumn(col)} />
                      <span className="text-xs font-medium text-slate-300 group-hover:text-white">{col}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Dropdown */}
            <div className="relative flex-1" ref={perfMenuRef}>
              <button 
                onClick={() => { setShowPerfMenu(!showPerfMenu); setShowColMenu(false); }}
                className="w-full h-12 flex items-center justify-between px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold hover:border-slate-500"
              >
                <span className="flex items-center gap-2"><Filter size={16} className="text-purple-400" /> Filter</span>
                <ChevronDown size={16} className={showPerfMenu ? 'rotate-180' : ''} />
              </button>
              {showPerfMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[100] p-2 ring-1 ring-white/10">
                  <div className="flex justify-between items-center p-3 border-b border-slate-800 mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Performance</span>
                    <div className="flex gap-4">
                      <button onClick={() => setSelectedPerformances(performanceOptions)} className="text-[10px] text-blue-400 font-bold">ALL</button>
                      <button onClick={() => setSelectedPerformances([])} className="text-[10px] text-red-400 font-bold">CLEAR</button>
                    </div>
                  </div>
                  {performanceOptions.map(perf => (
                    <label key={perf} className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-lg cursor-pointer group">
                      <div className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${selectedPerformances.includes(perf) ? 'bg-purple-600 border-purple-600' : 'border-slate-600'}`}>
                        {selectedPerformances.includes(perf) && <Check size={12} className="text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={selectedPerformances.includes(perf)} onChange={() => togglePerformance(perf)} />
                      <span className="text-[10px] text-slate-400 group-hover:text-white leading-tight">{perf}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Container - REMOVED OVERFLOW HIDDEN THAT WAS CLIPPING DROPDOWN */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-[24px] border border-slate-800 shadow-2xl relative">
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-[24px]">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#0f172a] shadow-md">
                  {visibleColumns.map((col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-6 py-5 cursor-pointer hover:bg-slate-800/50 transition-colors border-b border-slate-800 group"
                    >
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400">
                        {col}
                        {sortConfig.key === col && (
                          sortConfig.direction === "asc" ? <ArrowUp size={14} className="text-blue-500" /> : <ArrowDown size={14} className="text-blue-500" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {sortedData.map((row, index) => (
                  <tr key={index} className="group hover:bg-blue-500/[0.03] transition-colors">
                    {visibleColumns.map((col) => (
                      <td key={col} className="px-2 py-4 whitespace-nowrap border-r border-slate-800/20 last:border-0">
                        {col === "Performance" ? (
                          <span className={getPerformanceStyles(row[col])}>
                            {row[col]}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                            {row[col]}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 animate-pulse">
                <UploadCloud size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm italic">Unga file-ah upload panna analytics inga theriyum.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}