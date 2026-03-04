import React, { useState } from "react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  UploadCloud,
  CheckCircle2,
  TrendingUp,
  FileText,
  AlertCircle
} from "lucide-react";

const periods = ["Past30", "Past14", "Past7", "Current", "Next7", "Next14", "Next30"];

export default function OptimizationTimeComparison() {
  const [periodData, setPeriodData] = useState({});
  const [mergedData, setMergedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getValue = (row, keys) => {
    const found = Object.keys(row).find(k => keys.includes(k.trim()));
    return row[found] || "";
  };

  const parseNum = (val) => {
    if (!val) return 0;
    let clean = val.toString().replace(/[^\d,.-]/g, "").trim();
    if (clean.includes(".") && clean.includes(",")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
    return parseFloat(clean) || 0;
  };

  const handleUpload = (e, period) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      beforeFirstChunk: (chunk) => {
        const lines = chunk.split("\n");
        const headerIndex = lines.findIndex(l =>
          l.includes("eBay item ID") || l.includes("eBay-Artikelnummer")
        );
        return headerIndex === -1 ? chunk : lines.slice(headerIndex).join("\n");
      },
      complete: (results) => {
        setPeriodData(prev => ({ ...prev, [period]: results.data }));
        setIsLoading(false);
      }
    });
  };

  const calculateGrowth = (current, future) => {
    if (!current || current === 0) return null;
    return (((future - current) / current) * 100).toFixed(1);
  };

  const generateComparison = () => {
    if (!periodData.Current) {
      alert("Current period file kandippa venum!");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const merged = {};

      periods.forEach(period => {
        const rows = periodData[period] || [];

        rows.forEach(row => {
          const id = getValue(row, ["eBay item ID", "eBay-Artikelnummer"]);
          if (!id) return;

          const cleanId = id.toString().replace(/[="]/g, "");

          if (!merged[cleanId])
            merged[cleanId] = { id: cleanId };

          merged[cleanId][period] = {
            impressions: parseNum(getValue(row, [
              "Total impressions",
              "Gesamtanzahl Impressions"
            ])),
            ctr: parseNum(getValue(row, [
              "Click-through rate",
              "Klickrate"
            ])),
            conversions: parseNum(getValue(row, [
              "Sales conversion rate",
              "Konversionsrate"
            ]))
          };
        });
      });

      const final = Object.values(merged).map(item => {
        const current = item.Current || {};

        return {
          id: item.id,
          metrics: periods.reduce((acc, p) => {
            acc[p] = item[p] || {
              impressions: 0,
              ctr: 0,
              conversions: 0
            };
            return acc;
          }, {}),
          Growth: {
            impressions7: calculateGrowth(
              current.impressions,
              item.Next7?.impressions || 0
            ),
            impressions14: calculateGrowth(
              current.impressions,
              item.Next14?.impressions || 0
            ),
            impressions30: calculateGrowth(
              current.impressions,
              item.Next30?.impressions || 0
            ),
            ctr7: calculateGrowth(current.ctr, item.Next7?.ctr || 0),
            ctr14: calculateGrowth(current.ctr, item.Next14?.ctr || 0),
            ctr30: calculateGrowth(current.ctr, item.Next30?.ctr || 0),
            conv7: calculateGrowth(current.conversions, item.Next7?.conversions || 0),
            conv14: calculateGrowth(current.conversions, item.Next14?.conversions || 0),
            conv30: calculateGrowth(current.conversions, item.Next30?.conversions || 0)
          }
        };
      });

      setMergedData(final);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="text-slate-200 p-6 md:p-12 font-sans">
      <AnimatePresence>
        {isLoading && (
          <motion.div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto space-y-10">

        {/* Upload Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {periods.map(period => (
            <label
              key={period}
              className="flex flex-col items-center p-6 border-2 border-dashed rounded-3xl cursor-pointer"
            >
              <span className="text-xs font-bold mb-3">{period}</span>
              {periodData[period] ? (
                <CheckCircle2 className="text-emerald-500 w-8 h-8" />
              ) : (
                <UploadCloud className="w-8 h-8 text-slate-500" />
              )}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleUpload(e, period)}
              />
            </label>
          ))}
        </section>

        <div className="flex justify-center">
          <button
            onClick={generateComparison}
            disabled={!periodData.Current}
            className="bg-blue-600 px-10 py-4 rounded-xl font-bold"
          >
            GENERATE COMPARISON
          </button>
        </div>

        {/* Table */}
        {mergedData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead>
                <tr>
                  <th className="p-4 text-left">Item ID</th>

                  {periods.filter(p => periodData[p]).map(p => (
                    <th key={p} className="p-4 text-center">
                      {p}
                      <div className="text-xs text-slate-400">
                        Imp / CTR / Conv
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {mergedData.map(row => (
                  <tr key={row.id} className="border-t border-slate-800">
                    <td className="p-4">
                      <span
                        onClick={() => navigator.clipboard.writeText(row.id)}
                        className="cursor-pointer text-blue-400"
                      >
                        {row.id}
                      </span>
                    </td>

                    {periods.filter(p => periodData[p]).map(p => {
                      const data = row.metrics[p];
                      return (
                        <td key={p} className="p-4 text-center">
                          <div>{data.impressions}</div>
                          <div>{data.ctr}%</div>
                          <div>{data.conversions}%</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!mergedData.length && !isLoading && (
          <div className="text-center py-20">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-500 mb-3" />
            <p>No Data</p>
          </div>
        )}
      </main>
    </div>
  );
}