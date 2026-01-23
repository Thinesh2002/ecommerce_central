import { useState, useMemo } from "react";
import { Chart } from "react-google-charts";
import { searchKeywords } from "../../../config/api";
import {
  Search,
  TrendingUp,
  Target,
  Box,
  Zap,
  ExternalLink,
  Award,
  Layers,
  Info,
  HelpCircle,
  Activity,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;
const TOP_LIMIT = 100;

export default function Keyword() {
  const [keyword, setKeyword] = useState("");
  const [market, setMarket] = useState("EBAY_GB");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [copyStatus, setCopyStatus] = useState("");

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError("Please enter a keyword");
      return;
    }
    setLoading(true);
    setError("");
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(`Copied: ${text}`);
    setTimeout(() => setCopyStatus(""), 2000);
  };

  const getDemandCategory = (percent) => {
    if (percent >= 5)
      return { label: "High Volume", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", glow: "shadow-[0_0_15px_rgba(59,130,246,0.4)]" };
    if (percent >= 2)
      return { label: "Standard", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", glow: "shadow-[0_0_15px_rgba(99,102,241,0.3)]" };
    return { label: "Niche", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", glow: "" };
  };

  const demandKeywords = useMemo(() => result?.relatedDemandKeywords || [], [result]);
  const top100TotalDemand = useMemo(() => {
    return demandKeywords.slice(0, TOP_LIMIT).reduce((sum, item) => sum + (item.demand || 0), 0);
  }, [demandKeywords]);

  const paginated = useMemo(() => demandKeywords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [demandKeywords, page]);

  const pieChartData = useMemo(() => {
    if (!result) return [];
    const data = [["Keyword", "Demand"]];
    demandKeywords.slice(0, 6).forEach((item) => data.push([item.keyword, item.demand]));
    return data;
  }, [result, demandKeywords]);

  const pieOptions = {
    backgroundColor: "transparent",
    pieHole: 0.6,
    colors: ["#3b82f6", "#6366f1", "#8b5cf6", "#0ea5e9", "#1d4ed8", "#312e81"],
    legend: { position: "right", textStyle: { color: "#94a3b8", fontSize: 12 } },
    chartArea: { width: "100%", height: "80%" },
    pieSliceBorderColor: "transparent",
    tooltip: { isHtml: true },
  };

  return (
    <div className="min-h-screen text-slate-200  font-sans relative overflow-hidden">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none" />

      {/* Toast Notification */}
      {copyStatus && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-xl border border-blue-400/50 px-6 py-2 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] z-50 text-xs font-bold animate-in fade-in zoom-in duration-300">
          {copyStatus}
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
            <span className="text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase">ebay Market Intelligence Pro</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">
            Ebay  Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">Intelligence</span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Compact Search Architecture */}
        <section className="relative group max-w-4xl mx-auto">
          <div className="absolute -inset-1 bg-blue-600/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-700"></div>
          <div className="relative bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-xl">
            <div className="flex-1 flex items-center px-4">
              <Search className="text-blue-400 w-5 h-5 mr-3 opacity-70" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Analyze core keyword or niche..."
                className="w-full bg-transparent py-3 outline-none text-white placeholder:text-slate-600 font-semibold text-base"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="relative bg-slate-900/60 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/10 outline-none cursor-pointer text-xs font-black text-slate-300 uppercase tracking-[0.15em] transition-all duration-300 hover:border-blue-500/50 hover:text-blue-400 focus:ring-2 focus:ring-blue-500/20 appearance-none pr-10"
              >
                <option value="EBAY_GB" className="bg-slate-900 text-slate-200">🇬🇧 GB </option>
                <option value="EBAY_DE" className="bg-slate-900 text-slate-200">🇩🇪 DE </option>
              </select>
              <button onClick={handleSearch} disabled={loading} className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                {loading ? "..." : "ANALYZE"} <Activity size={14} />
              </button>
            </div>
          </div>
        </section>

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Compact KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<TrendingUp size={20} />} label="Competition" value={result.keywordInfo.competitionLevel} color="blue" />
              <StatCard icon={<Box size={20} />} label="Index Listings" value={result.totalListings.toLocaleString()} color="indigo" />
              <StatCard icon={<Target size={20} />} label="Market Fit" value={top100TotalDemand.toLocaleString()} color="cyan" />
              <StatCard icon={<Award size={20} />} label="Difficulty" value="Low" color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Distribution Card */}
              <div className="lg:col-span-5 bg-slate-900/30 border border-white/10 p-8 rounded-[2rem] backdrop-blur-3xl relative overflow-hidden group shadow-xl">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                  <Activity size={16} /> Volume Distribution
                </h3>
                <div className="h-[280px] w-full transform group-hover:scale-[1.02] transition-transform duration-500">
                  <Chart chartType="PieChart" data={pieChartData} options={pieOptions} width="100%" height="100%" />
                </div>
              </div>

              {/* Matrix Table */}
              <div className="lg:col-span-7 bg-slate-900/30 border border-white/10 rounded-[2rem] backdrop-blur-3xl overflow-hidden shadow-xl flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h3 className="font-black text-white tracking-[0.2em] text-[10px] uppercase">Keyword Matrix</h3>
                  <HelpCircle size={16} className="text-blue-400 opacity-50" />
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[300px]">
                  <table className="w-full text-left">
                    <thead className="bg-black/40 text-slate-500 text-[9px] uppercase font-black sticky top-0 z-10">
                      <tr>
                        <th className="px-8 py-5">Strategic Term</th>
                        <th className="px-8 py-5 text-center">Tier</th>
                        <th className="px-8 py-5 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginated.map((item, i) => {
                        const percent = top100TotalDemand ? (item.demand / top100TotalDemand) * 100 : 0;
                        const cat = getDemandCategory(percent);
                        return (
                          <tr key={i} onClick={() => copyToClipboard(item.keyword)} className="group hover:bg-blue-600/[0.04] transition-all cursor-pointer">
                            <td className="px-8 py-3.5 text-sm font-bold text-slate-100 group-hover:text-blue-400 flex items-center gap-2">
                              <ChevronRight size={12} className="text-slate-700" /> {item.keyword}
                            </td>
                            <td className="px-8 py-3.5 text-center">
                              <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase border ${cat.border} ${cat.bg} ${cat.color} ${cat.glow}`}>
                                {cat.label}
                              </span>
                            </td>
                            <td className="px-8 py-3.5 text-right font-mono text-blue-400/50 text-[11px] font-bold group-hover:text-blue-400">{percent.toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Semantic Cloud */}
            <section className="bg-slate-900/30 border border-white/10 p-8 rounded-[2rem] shadow-xl backdrop-blur-3xl relative overflow-hidden">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                <Layers size={18} className="text-blue-400" /> Long Tail Insights
              </h3>
              <div className="flex flex-wrap gap-3">
                {result.longTailKeywords.map((tag, i) => (
                  <button key={i} onClick={() => copyToClipboard(tag)} className="px-4 py-2 bg-white/[0.03] border border-white/10 hover:border-blue-500/50 rounded-xl text-[11px] font-bold text-slate-400 hover:text-blue-300 transition-all flex items-center gap-2 group shadow-sm">
                    <span>{tag}</span> <ExternalLink size={12} className="opacity-30 group-hover:opacity-100 text-blue-400" />
                  </button>
                ))}
              </div>
            </section>

            {/* Competitive Leaders - Essential Section */}
            <div className="space-y-6 pb-10">
              <h3 className="text-2xl font-black text-white px-2 flex items-center gap-4">
                Market Leaders <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-600/30 via-indigo-600/10 to-transparent"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.topCompetitors.map((item, i) => (
                  <div key={i} className="group bg-slate-900/30 border border-white/10 p-6 rounded-[2rem] hover:border-blue-500/40 transition-all duration-500 backdrop-blur-3xl relative overflow-hidden shadow-xl">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="space-y-3 max-w-[70%]">
                        <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-base leading-tight line-clamp-1">{item.title}</h4>
                        <span className="text-[9px] bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-xl text-blue-300 font-black tracking-widest">SELLER ID: {item.seller.substring(0, 8)}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black text-white leading-none tracking-tighter group-hover:text-blue-400 transition-colors">{item.price}</p>
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest block mt-1">{item.currency}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
                      <div className="flex items-center gap-3 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                        Live Data
                      </div>
                      <a href={item.itemUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600 rounded-xl text-blue-400 hover:text-white transition-all border border-blue-500/30 font-black text-[10px] uppercase">
                        Analyze <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const themes = {
    blue: "border-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.02)]",
    indigo: "border-indigo-500/20 text-indigo-400",
    cyan: "border-cyan-500/20 text-cyan-400",
  };

  return (
    <div className={`bg-slate-900/50 border backdrop-blur-3xl p-6 rounded-[2rem] group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden ${themes[color] || themes.blue}`}>
      <div className="flex items-center gap-5">
        <div className="p-3.5 bg-white/5 rounded-2xl text-white border border-white/10 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500">{icon}</div>
        <div className="space-y-1 relative z-10">
          <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-black">{label}</p>
          <p className="text-3xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors duration-500">{value}</p>
        </div>
      </div>
    </div>
  );
}