import React, { useMemo, useState } from "react";
import { Chart } from "react-google-charts";
import {
  proKeywordResearch,
  proBulkKeywordCompare,
  proTitleBuilder,
  proDownloadKeywordExport,
} from "../../../config/api";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clipboard,
  Clock,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileJson,
  Filter,
  Flame,
  Layers,
  LineChart,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const markets = [
  { value: "EBAY_GB", label: "eBay UK" },
  { value: "EBAY_DE", label: "eBay Germany" },
  { value: "EBAY_US", label: "eBay US" },
  { value: "EBAY_AU", label: "eBay Australia" },
  { value: "EBAY_FR", label: "eBay France" },
  { value: "EBAY_IT", label: "eBay Italy" },
  { value: "EBAY_ES", label: "eBay Spain" },
];

const tabs = [
  { id: "keywords", label: "Keyword Matrix", icon: Layers },
  { id: "competitors", label: "Competitors", icon: Users },
  { id: "sellers", label: "Seller Dominance", icon: Trophy },
  { id: "ranking", label: "Ranking Tracker", icon: LineChart },
  { id: "titles", label: "Title Builder", icon: Sparkles },
  { id: "bulk", label: "Bulk Compare", icon: Clipboard },
];

const card = "bg-white border border-slate-200 rounded-3xl shadow-sm";
const softCard = "bg-slate-50 border border-slate-200 rounded-2xl";

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fmt(value) {
  return number(value).toLocaleString();
}

function money(symbol, value) {
  return `${symbol || ""}${number(value).toFixed(2)}`;
}

function clampPct(value) {
  return `${Math.max(0, Math.min(100, number(value)))}%`;
}

function buildCsv(rows = []) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (value) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => esc(row[header])).join(","))].join("\n");
}

function downloadText(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function copyText(text) {
  navigator.clipboard?.writeText(String(text || ""));
}

function trendIcon(trend) {
  if (String(trend || "").toLowerCase().includes("down")) return TrendingDown;
  if (String(trend || "").toLowerCase().includes("up")) return TrendingUp;
  return BarChart3;
}

function ChartBox({ title, subtitle, children }) {
  return (
    <div className={`${card} p-5 min-h-[330px]`}>
      <div className="mb-4">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ text = "No chart data yet. Run the keyword a few times to build history." }) {
  return (
    <div className="h-64 flex items-center justify-center text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
      {text}
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-950 text-white",
    amber: "bg-amber-500 text-white",
    green: "bg-emerald-600 text-white",
    blue: "bg-blue-600 text-white",
    red: "bg-rose-600 text-white",
  };
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl ${tones[tone] || tones.slate} flex items-center justify-center shrink-0`}>
          <Icon size={21} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">{label}</p>
          <h3 className="text-xl font-black text-slate-950 mt-1 truncate">{value ?? "-"}</h3>
          <p className="text-xs text-slate-400 mt-1 truncate">{sub ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const cls = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return <span className={`px-2.5 py-1 rounded-full border text-xs font-black ${cls[tone] || cls.slate}`}>{children}</span>;
}

function TabButton({ active, tab, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-black transition border ${
        active ? "bg-slate-950 text-white border-slate-950" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
      }`}
    >
      <Icon size={16} />
      {tab.label}
    </button>
  );
}

export default function AdvancedKeywordResearch() {
  const [keyword, setKeyword] = useState("");
  const [market, setMarket] = useState("EBAY_GB");
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(400);
  const [filters, setFilters] = useState({ minPrice: "", maxPrice: "", condition: "all", buyingOption: "all" });
  const [activeTab, setActiveTab] = useState("keywords");
  const [result, setResult] = useState(null);
  const [bulkText, setBulkText] = useState("led wall light\noutdoor wall light\nsolar wall light");
  const [bulkResult, setBulkResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [error, setError] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [sortBy, setSortBy] = useState("opportunityScore");
  const [copied, setCopied] = useState("");

  const runResearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setError("Enter a keyword first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await proKeywordResearch({ keyword, market, days, limit, filters });
      setResult(data);
      setActiveTab("keywords");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Advanced research failed");
    } finally {
      setLoading(false);
    }
  };

  const runBulkCompare = async () => {
    const keywords = bulkText.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
    if (!keywords.length) {
      setError("Enter keywords for bulk compare");
      return;
    }
    setBulkLoading(true);
    setError("");
    try {
      const data = await proBulkKeywordCompare({ keywords, market, days, limit: 120 });
      setBulkResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Bulk comparison failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const regenerateTitles = async () => {
    if (!keyword.trim()) return;
    setTitleLoading(true);
    setError("");
    try {
      const terms = result?.keywordInsights?.relatedDemandKeywords?.slice(0, 15) || [];
      const data = await proTitleBuilder({ keyword, market, terms, maxLength: 80 });
      setResult((prev) => ({ ...(prev || {}), titleBuilder: data.titles || [] }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Title builder failed");
    } finally {
      setTitleLoading(false);
    }
  };

  const summary = result?.summary;
  const marketAnalytics = result?.marketAnalytics || {};
  const keywordRows = result?.keywordInsights?.relatedDemandKeywords || [];
  const competitors = result?.competitorAnalysis?.topCompetitors || result?.topCompetitors || [];
  const sellers = result?.competitorAnalysis?.sellerDominance || [];
  const history = result?.history || marketAnalytics.searchTrend || [];
  const rankingTrend = marketAnalytics.rankingTrend || [];
  const titleIdeas = result?.titleBuilder || [];
  const currencySymbol = summary?.currencySymbol || marketAnalytics.currencySymbol || "";

  const filteredKeywords = useMemo(() => {
    const q = tableFilter.trim().toLowerCase();
    return keywordRows
      .filter((row) => !q || String(row.keyword || "").toLowerCase().includes(q))
      .slice()
      .sort((a, b) => {
        const av = number(a[sortBy]);
        const bv = number(b[sortBy]);
        if (sortBy === "organicRank" || sortBy === "ppcRank" || sortBy === "difficulty") return av - bv;
        return bv - av;
      });
  }, [keywordRows, tableFilter, sortBy]);

  const searchTrendData = useMemo(() => {
    const rows = history.map((row) => [
      row.period || new Date(row.created_at).toLocaleDateString(),
      number(row.estimatedSearchVolume),
      number(row.estimatedMonthlySales || row.estimatedSalesSignal),
      number(row.totalListings),
    ]);
    return [["Period", "Search Volume", "Monthly Sales", "Listings"], ...rows];
  }, [history]);

  const rankingTrendData = useMemo(() => {
    const rows = rankingTrend.map((row) => [
      row.period,
      number(row.organicRank),
      number(row.ppcRank),
      number(row.opportunityScore),
      number(row.difficultyScore),
    ]);
    return [["Period", "Organic Rank", "PPC Rank", "Opportunity", "Difficulty"], ...rows];
  }, [rankingTrend]);

  const priceDistributionData = useMemo(() => {
    const rows = (marketAnalytics.priceDistribution || []).map((row) => [row.range, number(row.count)]);
    return [["Price Range", "Listings"], ...rows];
  }, [marketAnalytics.priceDistribution]);

  const keywordOpportunityChart = useMemo(() => {
    const rows = keywordRows.slice(0, 12).map((row) => [row.keyword, number(row.opportunityScore), number(row.difficulty)]);
    return [["Keyword", "Opportunity", "Difficulty"], ...rows];
  }, [keywordRows]);

  const exportJson = () => {
    if (!result) return;
    downloadText(`ebay-keyword-research-${summary?.keyword || "export"}.json`, JSON.stringify(result, null, 2), "application/json;charset=utf-8");
  };

  const exportCsv = (type) => {
    if (!result) return;
    const rows = type === "competitors" ? competitors : type === "sellers" ? sellers : filteredKeywords;
    downloadText(`ebay-${type}-${summary?.keyword || "export"}.csv`, buildCsv(rows), "text/csv;charset=utf-8");
  };

  const backendCsv = async (type) => {
    if (!result?.runId) {
      exportCsv(type);
      return;
    }
    const blob = await proDownloadKeywordExport(result.runId, type);
    downloadBlob(`ebay-${type}-research-${result.runId}.csv`, blob);
  };

  const handleCopy = (text) => {
    copyText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 1600);
  };

  const priceRange = summary ? `${money(currencySymbol, summary.minPrice)} - ${money(currencySymbol, summary.maxPrice)}` : "-";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {copied && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] bg-slate-950 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
            Copied: {String(copied).slice(0, 55)}
          </div>
        )}

        <div className="flex flex-col 2xl:flex-row 2xl:items-end 2xl:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-black text-amber-600">Digitweb Seller Intelligence</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-2">Pro eBay Keyword Research Tool</h1>
            <p className="text-slate-500 mt-3 max-w-4xl leading-7">
              ZIK-style keyword research dashboard for eBay: demand, opportunity, difficulty, competitor strength, seller dominance,
              estimated organic/PPC ranking, title ideas, price strategy, and tracking history.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportCsv("keywords")} disabled={!result} className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 font-bold text-sm disabled:opacity-40 flex items-center gap-2">
              <Download size={16} /> Keywords CSV
            </button>
            <button onClick={() => exportJson()} disabled={!result} className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 font-bold text-sm disabled:opacity-40 flex items-center gap-2">
              <FileJson size={16} /> JSON
            </button>
            <button onClick={() => backendCsv("competitors")} disabled={!result} className="px-4 py-2.5 rounded-2xl bg-slate-950 text-white font-bold text-sm disabled:opacity-40 flex items-center gap-2">
              <Download size={16} /> Competitors
            </button>
          </div>
        </div>

        <form onSubmit={runResearch} className={`${card} p-4`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-3">
            <div className="relative xl:col-span-2">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Example: led wall light, ceiling rose, gu10 bulb"
                className="w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              />
            </div>

            <select value={market} onChange={(e) => setMarket(e.target.value)} className="px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none">
              {markets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>

            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none">
              <option value={7}>7-day trend</option>
              <option value={30}>30-day trend</option>
              <option value={90}>90-day trend</option>
              <option value={180}>180-day trend</option>
            </select>

            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none">
              <option value={120}>120 listings</option>
              <option value={200}>200 listings</option>
              <option value={400}>400 listings</option>
              <option value={800}>800 listings</option>
              <option value={1000}>1000 listings</option>
            </select>

            <input
              value={filters.minPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
              placeholder="Min price"
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none"
            />
            <input
              value={filters.maxPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
              placeholder="Max price"
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none"
            />

            <button disabled={loading} className="bg-slate-950 text-white font-black px-6 py-3 rounded-2xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              {loading ? "Analysing" : "Research"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Filter size={13} /> Optional filters:</span>
            <select value={filters.condition} onChange={(e) => setFilters((prev) => ({ ...prev, condition: e.target.value }))} className="px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none">
              <option value="all">All conditions</option>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
            <select value={filters.buyingOption} onChange={(e) => setFilters((prev) => ({ ...prev, buyingOption: e.target.value }))} className="px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none">
              <option value="all">All listing types</option>
              <option value="fixed_price">Fixed price</option>
              <option value="auction">Auction</option>
            </select>
          </div>
        </form>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl font-semibold flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5" /> {error}
          </div>
        )}

        {!summary && !loading && (
          <div className={`${card} p-12 text-center`}>
            <Database size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-2xl font-black">Start with a marketplace keyword</h2>
            <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
              Run one search to create your first research baseline. Repeating the same keyword later will build trend, ranking, price, and competitor movement history.
            </p>
          </div>
        )}

        {summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              <Metric icon={Target} label="Opportunity" value={summary.opportunity?.opportunityLabel || summary.opportunity?.label} sub={`${summary.opportunity?.opportunityScore || 0}/100`} tone="green" />
              <Metric icon={ShieldCheck} label="Difficulty" value={summary.opportunity?.difficultyLabel} sub={`${summary.opportunity?.difficultyScore || 0}/100`} tone={summary.opportunity?.difficultyScore >= 70 ? "red" : "amber"} />
              <Metric icon={BarChart3} label="Total Listings" value={fmt(summary.totalListings)} sub={`${fmt(summary.sampledListings)} sampled`} />
              <Metric icon={TrendingUp} label="Search Volume" value={fmt(summary.estimatedSearchVolume)} sub="Estimated monthly" tone="blue" />
              <Metric icon={Flame} label="Monthly Sales" value={fmt(summary.estimatedMonthlySales)} sub={`${money(currencySymbol, summary.estimatedRevenue)} revenue signal`} tone="amber" />
              <Metric icon={Users} label="Competitors" value={summary.competitorCount} sub={`Avg ${money(currencySymbol, summary.avgPrice)} | ${priceRange}`} />
            </div>

            <div className={`${card} p-5 bg-amber-50 border-amber-200`}>
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-700 shrink-0" size={22} />
                <div>
                  <h3 className="font-black text-amber-900">Data quality note</h3>
                  <p className="text-amber-800 text-sm mt-1 leading-6">{summary.dataQuality?.note}</p>
                  <p className="text-amber-700 text-xs mt-2 font-bold">Confidence: {summary.dataQuality?.confidence || "Directional"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartBox title="Search Trend & Demand Tracking" subtitle="Estimated search volume, monthly sales, and listing count from saved research runs.">
                {searchTrendData.length > 1 ? (
                  <Chart
                    chartType="LineChart"
                    data={searchTrendData}
                    width="100%"
                    height="260px"
                    options={{ backgroundColor: "transparent", legend: { position: "bottom" }, chartArea: { width: "82%", height: "68%" }, curveType: "function" }}
                  />
                ) : <EmptyChart />}
              </ChartBox>

              <ChartBox title="Organic vs PPC Ranking" subtitle="Estimated ranking movement. Lower rank number is better.">
                {rankingTrendData.length > 1 ? (
                  <Chart
                    chartType="LineChart"
                    data={rankingTrendData}
                    width="100%"
                    height="260px"
                    options={{ backgroundColor: "transparent", legend: { position: "bottom" }, chartArea: { width: "82%", height: "68%" }, curveType: "function" }}
                  />
                ) : <EmptyChart />}
              </ChartBox>

              <ChartBox title="Price Distribution" subtitle="Shows current marketplace pricing buckets from sampled listings.">
                {priceDistributionData.length > 1 ? (
                  <Chart
                    chartType="ColumnChart"
                    data={priceDistributionData}
                    width="100%"
                    height="260px"
                    options={{ backgroundColor: "transparent", legend: { position: "none" }, chartArea: { width: "82%", height: "68%" } }}
                  />
                ) : <EmptyChart text="No price distribution data." />}
              </ChartBox>

              <ChartBox title="Keyword Opportunity vs Difficulty" subtitle="Top keyword terms ranked by opportunity and difficulty score.">
                {keywordOpportunityChart.length > 1 ? (
                  <Chart
                    chartType="BarChart"
                    data={keywordOpportunityChart}
                    width="100%"
                    height="260px"
                    options={{ backgroundColor: "transparent", legend: { position: "bottom" }, chartArea: { width: "70%", height: "72%" } }}
                  />
                ) : <EmptyChart text="No keyword chart data." />}
              </ChartBox>
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />)}
            </div>

            {activeTab === "keywords" && (
              <div className={`${card} p-5`}>
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black">Keyword Matrix</h2>
                    <p className="text-sm text-slate-500 mt-1">Buyer terms with estimated demand, rank, PPC bid, opportunity, and difficulty.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} placeholder="Filter keyword..." className="px-4 py-2.5 rounded-2xl border border-slate-200 outline-none" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none">
                      <option value="opportunityScore">Opportunity</option>
                      <option value="estimatedSearchVolume">Search volume</option>
                      <option value="estimatedMonthlySales">Sales</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="organicRank">Organic rank</option>
                      <option value="ppcRank">PPC rank</option>
                    </select>
                    <button onClick={() => backendCsv("keywords")} className="px-4 py-2.5 rounded-2xl bg-slate-950 text-white font-bold flex items-center gap-2"><Download size={16} /> Export</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[1300px] w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <th className="py-3 pr-4">Keyword</th>
                        <th className="py-3 pr-4">Type</th>
                        <th className="py-3 pr-4">Search Vol</th>
                        <th className="py-3 pr-4">Sales</th>
                        <th className="py-3 pr-4">Revenue</th>
                        <th className="py-3 pr-4">Organic</th>
                        <th className="py-3 pr-4">PPC</th>
                        <th className="py-3 pr-4">Bid</th>
                        <th className="py-3 pr-4">CTR</th>
                        <th className="py-3 pr-4">CVR</th>
                        <th className="py-3 pr-4">Opportunity</th>
                        <th className="py-3 pr-4">Difficulty</th>
                        <th className="py-3 pr-4">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeywords.slice(0, 120).map((row) => {
                        const TrendIcon = trendIcon(row.trend);
                        return (
                          <tr key={`${row.keyword}-${row.type}`} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 pr-4 font-black text-slate-950 min-w-72">
                              <button onClick={() => handleCopy(row.keyword)} className="inline-flex items-center gap-2 hover:text-blue-600 text-left">
                                {row.keyword} <Copy size={13} />
                              </button>
                            </td>
                            <td className="py-3 pr-4"><Badge>{row.type}</Badge></td>
                            <td className="py-3 pr-4 font-bold">{fmt(row.estimatedSearchVolume)}</td>
                            <td className="py-3 pr-4">{fmt(row.estimatedMonthlySales)}</td>
                            <td className="py-3 pr-4">{money(currencySymbol, row.estimatedRevenue)}</td>
                            <td className="py-3 pr-4 font-black">#{row.organicRank}</td>
                            <td className="py-3 pr-4 font-black">#{row.ppcRank}</td>
                            <td className="py-3 pr-4">{money(currencySymbol, row.suggestedBid)}</td>
                            <td className="py-3 pr-4">{row.ctr}</td>
                            <td className="py-3 pr-4">{row.cvr}</td>
                            <td className="py-3 pr-4 min-w-36">
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: clampPct(row.opportunityScore) }} /></div>
                              <span className="text-xs font-bold text-slate-500">{row.opportunityScore}/100</span>
                            </td>
                            <td className="py-3 pr-4 min-w-36">
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: clampPct(row.difficulty) }} /></div>
                              <span className="text-xs font-bold text-slate-500">{row.difficulty}/100</span>
                            </td>
                            <td className="py-3 pr-4"><Badge tone={row.trend === "Up" ? "green" : row.trend === "Down" ? "red" : "amber"}><TrendIcon size={12} className="inline mr-1" />{row.trend}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "competitors" && (
              <div className={`${card} p-5`}>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black">Competitor Intelligence</h2>
                    <p className="text-sm text-slate-500 mt-1">Top live listings ranked by success score, watchers, bids, estimated sales, and title quality.</p>
                  </div>
                  <button onClick={() => backendCsv("competitors")} className="px-4 py-2.5 rounded-2xl bg-slate-950 text-white font-bold flex items-center gap-2"><Download size={16} /> Export</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[1250px] w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <th className="py-3 pr-4">Rank</th><th className="py-3 pr-4">Listing</th><th className="py-3 pr-4">Seller</th><th className="py-3 pr-4">Price</th><th className="py-3 pr-4">Watchers</th><th className="py-3 pr-4">Bids</th><th className="py-3 pr-4">Sales</th><th className="py-3 pr-4">Revenue</th><th className="py-3 pr-4">Title Score</th><th className="py-3 pr-4">Threat</th><th className="py-3 pr-4">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitors.map((item, index) => (
                        <tr key={`${item.itemId}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 pr-4 font-black">#{index + 1}</td>
                          <td className="py-3 pr-4 min-w-96">
                            <div className="flex items-center gap-3">
                              {item.image && <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />}
                              <div>
                                <p className="font-bold text-slate-950 line-clamp-2">{item.title}</p>
                                <p className="text-xs text-slate-400">{item.condition} · {item.pricePosition}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-bold">{item.seller}<p className="text-xs text-slate-400">FB {fmt(item.feedbackScore)}</p></td>
                          <td className="py-3 pr-4 font-black">{money(currencySymbol || item.currency, item.price)}</td>
                          <td className="py-3 pr-4">{fmt(item.watchers)}</td>
                          <td className="py-3 pr-4">{fmt(item.bids)}</td>
                          <td className="py-3 pr-4 font-bold">{fmt(item.estimatedSales)}</td>
                          <td className="py-3 pr-4">{money(currencySymbol || item.currency, item.estimatedRevenue)}</td>
                          <td className="py-3 pr-4">{item.titleScore}/100</td>
                          <td className="py-3 pr-4"><Badge tone={item.launchThreat === "High" ? "red" : item.launchThreat === "Medium" ? "amber" : "green"}>{item.launchThreat}</Badge></td>
                          <td className="py-3 pr-4">{item.itemUrl ? <a href={item.itemUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold inline-flex items-center gap-1">View <ExternalLink size={14} /></a> : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "sellers" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`${card} p-5 xl:col-span-2`}>
                  <h2 className="text-2xl font-black mb-1">Seller Dominance</h2>
                  <p className="text-sm text-slate-500 mb-5">Shows sellers controlling the niche and their estimated sales share.</p>
                  <div className="space-y-3">
                    {sellers.map((seller) => (
                      <div key={seller.seller} className={`${softCard} p-4`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-black text-slate-950">#{seller.rank} {seller.seller}</h3>
                            <p className="text-xs text-slate-500">{seller.listings} listings · {seller.marketSharePct} share · {money(currencySymbol, seller.estimatedRevenue)} revenue</p>
                          </div>
                          <Badge tone={seller.riskLevel === "Dominant" ? "red" : seller.riskLevel === "Strong" ? "amber" : "green"}>{seller.riskLevel}</Badge>
                        </div>
                        <div className="mt-3 h-2 bg-white border border-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-950" style={{ width: clampPct(seller.strengthScore) }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${card} p-5`}>
                  <h2 className="text-xl font-black mb-4">Market Strategy</h2>
                  <div className="space-y-3 text-sm text-slate-600 leading-6">
                    <p><CheckCircle size={16} className="inline text-emerald-600 mr-2" />Target keywords with high opportunity and low difficulty first.</p>
                    <p><CheckCircle size={16} className="inline text-emerald-600 mr-2" />Avoid direct price fight with dominant sellers unless you have bundle value.</p>
                    <p><CheckCircle size={16} className="inline text-emerald-600 mr-2" />Use 2-pack / 3-pack titles when low price competition is too high.</p>
                    <p><CheckCircle size={16} className="inline text-emerald-600 mr-2" />Start PPC on long-tail keywords before broad keyword campaigns.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ranking" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`${card} p-5 xl:col-span-2`}>
                  <h2 className="text-2xl font-black mb-1">Rank Tracker</h2>
                  <p className="text-sm text-slate-500 mb-5">Estimated organic and PPC rank for top keyword ideas.</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200"><th className="py-3 pr-4">Keyword</th><th className="py-3 pr-4">Organic</th><th className="py-3 pr-4">PPC</th><th className="py-3 pr-4">Bid</th><th className="py-3 pr-4">Advice</th></tr></thead>
                      <tbody>
                        {(result?.rankingAnalysis?.organicRanking || []).slice(0, 40).map((row) => (
                          <tr key={`rank-${row.keyword}`} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 pr-4 font-black">{row.keyword}</td>
                            <td className="py-3 pr-4">#{row.organicRank}</td>
                            <td className="py-3 pr-4">#{row.ppcRank}</td>
                            <td className="py-3 pr-4">{money(currencySymbol, row.suggestedBid)}</td>
                            <td className="py-3 pr-4 text-slate-500">{row.opportunityScore >= 70 ? "Push SEO + PPC" : row.difficulty > 70 ? "Long-tail only" : "Test campaign"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className={`${card} p-5`}>
                  <h2 className="text-xl font-black mb-4">Ranking Advice</h2>
                  <p className="text-sm text-slate-600 leading-7">{result?.rankingAnalysis?.rankAdvice || "Run research to generate ranking advice."}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className={`${softCard} p-4`}><p className="text-xs text-slate-500 font-bold">Organic Rank</p><p className="text-2xl font-black">#{summary.rankingAnalysis?.organicRank || 0}</p></div>
                    <div className={`${softCard} p-4`}><p className="text-xs text-slate-500 font-bold">PPC Rank</p><p className="text-2xl font-black">#{summary.rankingAnalysis?.ppcRank || 0}</p></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "titles" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`${card} p-5 xl:col-span-2`}>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div><h2 className="text-2xl font-black">SEO Title Builder</h2><p className="text-sm text-slate-500 mt-1">Title ideas built from high-opportunity keyword terms.</p></div>
                    <button onClick={regenerateTitles} disabled={titleLoading} className="px-4 py-2.5 rounded-2xl bg-slate-950 text-white font-bold flex items-center gap-2 disabled:opacity-40">{titleLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate</button>
                  </div>
                  <div className="space-y-3">
                    {titleIdeas.map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className={`${softCard} p-4`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-950">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.length}/80 chars · Score {item.score}/100 · {item.note}</p>
                          </div>
                          <button onClick={() => handleCopy(item.title)} className="p-2 rounded-xl bg-white border border-slate-200"><Copy size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${card} p-5`}>
                  <h2 className="text-xl font-black mb-4">Long-tail Keyword Bank</h2>
                  <div className="flex flex-wrap gap-2">
                    {(result?.keywordInsights?.longTailKeywords || []).slice(0, 55).map((term) => (
                      <button key={term} onClick={() => handleCopy(term)} className="px-3 py-2 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">{term}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bulk" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`${card} p-5`}>
                  <h2 className="text-2xl font-black">Bulk Keyword Compare</h2>
                  <p className="text-sm text-slate-500 mt-1 mb-4">Paste one keyword per line. Best keywords will be ranked by opportunity.</p>
                  <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={10} className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:ring-2 focus:ring-amber-500" />
                  <button onClick={runBulkCompare} disabled={bulkLoading} className="mt-3 w-full bg-slate-950 text-white font-black px-5 py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40">
                    {bulkLoading ? <Loader2 size={18} className="animate-spin" /> : <BarChart3 size={18} />} Compare Keywords
                  </button>
                </div>
                <div className={`${card} p-5 xl:col-span-2`}>
                  <h2 className="text-2xl font-black mb-5">Bulk Results</h2>
                  {!bulkResult?.rows?.length ? <EmptyChart text="No bulk results yet." /> : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200"><th className="py-3 pr-4">Keyword</th><th className="py-3 pr-4">Listings</th><th className="py-3 pr-4">Volume</th><th className="py-3 pr-4">Sales</th><th className="py-3 pr-4">Opportunity</th><th className="py-3 pr-4">Difficulty</th><th className="py-3 pr-4">Organic</th><th className="py-3 pr-4">PPC</th></tr></thead>
                        <tbody>{bulkResult.rows.map((row) => <tr key={row.keyword} className="border-b border-slate-100 hover:bg-slate-50"><td className="py-3 pr-4 font-black">{row.keyword}</td><td className="py-3 pr-4">{fmt(row.totalListings)}</td><td className="py-3 pr-4">{fmt(row.estimatedSearchVolume)}</td><td className="py-3 pr-4">{fmt(row.estimatedMonthlySales)}</td><td className="py-3 pr-4">{row.opportunityScore}/100</td><td className="py-3 pr-4">{row.difficultyScore}/100</td><td className="py-3 pr-4">#{row.organicRank}</td><td className="py-3 pr-4">#{row.ppcRank}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
