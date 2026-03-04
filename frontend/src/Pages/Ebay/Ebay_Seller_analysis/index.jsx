import { useState, cloneElement } from "react";
import API from "../../../config/api";
import {
  Search, BarChart2, Package, Layers, ExternalLink,
  AlertCircle, TrendingUp, Users, Tag, Globe, ShieldCheck, Target,
  ChevronDown, ChevronUp, Activity,
  ArrowUpRight, ArrowDownRight, Minus,
  CheckCircle2, XCircle, BarChart3
} from "lucide-react";

/* ─── CONSTANTS ─── */
const MARKETS = [
  { value: "EBAY_GB", label: "🇬🇧  United Kingdom" },
  { value: "EBAY_US", label: "🇺🇸  United States" },
  { value: "EBAY_DE", label: "🇩🇪  Germany" },
  { value: "EBAY_FR", label: "🇫🇷  France" },
];

const VELOCITY = {
  "top-seller": { label: "Top Seller", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  strong:       { label: "Strong",     color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  moderate:     { label: "Moderate",   color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  slow:         { label: "Slow",       color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20" },
  dead:         { label: "Dead",       color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
};

const CONFIDENCE = {
  high:     { label: "High",     color: "text-emerald-400", dot: "bg-emerald-400" },
  medium:   { label: "Medium",   color: "text-blue-400",    dot: "bg-blue-400" },
  inferred: { label: "Inferred", color: "text-amber-400",   dot: "bg-amber-400" },
  low:      { label: "Low",      color: "text-red-400",     dot: "bg-red-400" },
};

const TIER_COLORS = {
  Elite:       "from-yellow-500/20 to-amber-500/5 border-yellow-500/30 text-yellow-400",
  Strong:      "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
  Established: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
  Growing:     "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
  New:         "from-slate-500/20 to-slate-500/5 border-slate-500/30 text-slate-400",
};

const ACCENT_CLASSES = {
  blue:    "bg-blue-500/10 border-blue-500/20 text-blue-400",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  amber:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
  violet:  "bg-violet-500/10 border-violet-500/20 text-violet-400",
  red:     "bg-red-500/10 border-red-500/20 text-red-400",
};

/* ─── HELPERS ─── */
const fmt  = (n) => (n != null ? Number(n).toLocaleString() : "—");
const fmtP = (n) => (n != null ? Number(n).toFixed(2) : "—");

const PriceArrow = ({ label }) => {
  if (!label) return null;
  if (label.includes("below")) return <ArrowDownRight size={14} className="text-emerald-400" />;
  if (label.includes("above")) return <ArrowUpRight   size={14} className="text-red-400" />;
  return <Minus size={14} className="text-slate-400" />;
};

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function SellerProfilePage() {
  const [itemId,      setItemId]      = useState("");
  const [market,      setMarket]      = useState("EBAY_GB");
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [varExpanded, setVarExpanded] = useState(false);

  const fetchSellerProfile = async () => {
    if (!itemId.trim()) { setError("Please enter a valid eBay Item ID"); return; }
    setLoading(true); setError(""); setData(null); setVarExpanded(false);
    try {
      const res = await API.post("/seller/profile", { itemId: itemId.trim(), market });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch seller data");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") fetchSellerProfile(); };

  /* ── Safe destructuring – never crashes on partial responses ── */
  const seller       = data?.seller         ?? {};
  const product      = data?.product        ?? {};
  const analysis     = data?.marketAnalysis ?? {};
  const pricing      = product.pricing      ?? {};
  const shipping     = product.shipping     ?? {};
  const salesEst     = product.salesEstimate ?? {};
  const variations   = product.variations?.details   ?? [];
  const varAnalytics = product.variations?.analytics ?? null;
  const competition  = analysis.competition  ?? {};
  const dataQuality  = analysis.dataQuality  ?? {};
  const strength     = seller.strength       ?? {};
  const pillars      = strength.pillars      ?? {};

  const conf      = CONFIDENCE[salesEst.confidence ?? "low"] ?? CONFIDENCE.low;
  const tierStyle = TIER_COLORS[strength.tier] ?? TIER_COLORS.New;
  const visibleVars = varExpanded ? variations : variations.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#020817] text-slate-300 font-sans">

      {/* ── NAV ── */}
      <nav className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#020817]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">SellerScope</span>
          <span className="hidden md:block text-slate-600 text-xs px-2 py-0.5 rounded-full border border-slate-800 ml-1">Pro</span>
        </div>
        <div className="text-[11px] text-slate-600 hidden md:block">Real-time eBay market intelligence</div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-10">

        {/* ── HERO ── */}
        <div className="text-center space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[11px] font-semibold uppercase tracking-widest">
            <Activity size={10} /> Live Market Analysis
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
            Competitor Intelligence<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">at a Glance</span>
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
            Deep-dive into any eBay listing — uncover pricing strategy, variation performance, seller strength, and market position.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  placeholder="eBay Item ID (e.g. 175432198765)"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  onKeyDown={handleKey}
                  className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    className="bg-slate-800/60 border border-slate-700/50 pl-9 pr-4 py-3.5 rounded-xl text-xs font-medium text-slate-300 focus:outline-none appearance-none cursor-pointer"
                  >
                    {MARKETS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={fetchSellerProfile}
                  disabled={loading}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-40 active:scale-95 whitespace-nowrap shadow-lg shadow-blue-900/30"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing
                    </span>
                  ) : "Analyze"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="max-w-2xl mx-auto bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* ══ RESULTS ══ */}
        {data && (
          <div className="space-y-6">

            {/* PRODUCT BANNER */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Analyzing</span>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 font-mono border border-slate-700">
                    {product.itemId ?? "—"}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${conf.color} bg-slate-900 border-slate-700`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${conf.dot} mr-1`} />
                    {conf.label} confidence
                  </span>
                </div>
                <h2 className="text-white font-bold text-lg leading-snug line-clamp-2">
                  {product.title ?? "Unknown product"}
                </h2>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-2xl font-black text-white">
                    {pricing.currency ?? ""} {fmtP(pricing.price)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs mt-0.5">
                    <PriceArrow label={pricing.position} />
                    <span className={
                      pricing.position?.includes("below") ? "text-emerald-400" :
                      pricing.position?.includes("above") ? "text-red-400" : "text-slate-400"
                    }>
                      {pricing.position ?? "—"}
                    </span>
                  </div>
                </div>
                {product.itemUrl && (
                  <a
                    href={product.itemUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition-all"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={<ShieldCheck size={18} />}
                label="Strength Score"
                value={`${strength.total ?? 0}`}
                sub={strength.tier ?? "—"}
                suffix="/100"
                accent="blue"
              />
              <KpiCard
                icon={<Target size={18} />}
                label="Success Rate"
                value={seller.successRate ?? "—"}
                sub={`${seller.relatedActiveListings ?? 0} active listings`}
                accent="emerald"
              />
              <KpiCard
                icon={<Users size={18} />}
                label="Competition"
                value={competition.level ?? "—"}
                sub={`${competition.uniqueSellers ?? 0} unique sellers`}
                accent={competition.level === "High" ? "red" : competition.level === "Medium" ? "amber" : "emerald"}
              />
              <KpiCard
                icon={<TrendingUp size={18} />}
                label="Est. Total Sales"
                value={fmt(seller.estimatedTotalSales)}
                sub={`${salesEst.confidence ?? "unknown"} confidence`}
                accent="violet"
              />
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── LEFT COLUMN ── */}
              <div className="lg:col-span-2 space-y-6">

                {/* PRODUCT STATS */}
                <Section title="Product Intelligence" icon={<Package size={15} className="text-blue-400" />}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatBox label="Unit Price"      value={`${pricing.currency ?? ""} ${fmtP(pricing.price)}`} accent="blue" />
                    <StatBox label="Market Avg"      value={pricing.marketAvg    ? `${pricing.currency} ${pricing.marketAvg}`    : "—"} />
                    <StatBox label="Market Median"   value={pricing.marketMedian ? `${pricing.currency} ${pricing.marketMedian}` : "—"} />
                    <StatBox label="Est. Sales"      value={fmt(salesEst.value)} accent="emerald" />
                    <StatBox label="Total Stock"     value={varAnalytics?.totalStock != null ? fmt(varAnalytics.totalStock) : "N/A"} />
                    <StatBox
                      label="Sell-Through"
                      value={varAnalytics?.overallSellThrough != null ? `${varAnalytics.overallSellThrough}%` : "N/A"}
                      accent={(varAnalytics?.overallSellThrough ?? 0) > 50 ? "emerald" : "amber"}
                    />
                    <StatBox label="Condition"       value={product.condition ?? "—"} />
                    <StatBox
                      label="Shipping"
                      value={shipping.freeShipping ? "Free" : shipping.shippingCost != null ? `${pricing.currency ?? ""} ${shipping.shippingCost}` : "—"}
                      accent={shipping.freeShipping ? "emerald" : null}
                    />
                    <StatBox label="Price Percentile" value={pricing.percentile != null ? `${pricing.percentile}th` : "—"} />
                  </div>
                </Section>

                {/* VARIATIONS */}
                {variations.length > 0 && (
                  <Section
                    title="Variation Performance"
                    icon={<Layers size={15} className="text-amber-400" />}
                    badge={`${variations.length} variants`}
                    action={
                      varAnalytics && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Health:</span>
                          <ScorePill score={varAnalytics.variationHealthScore ?? 0} />
                        </div>
                      )
                    }
                  >
                    {/* Analytics strip */}
                    {varAnalytics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 pb-5 border-b border-slate-800">
                        <MiniStat label="Total Sold"   value={fmt(varAnalytics.totalSold)} />
                        <MiniStat label="Total Stock"  value={fmt(varAnalytics.totalStock)} />
                        <MiniStat label="Est. Revenue" value={`${pricing.currency ?? ""} ${fmt(varAnalytics.totalRevenue)}`} accent />
                        <MiniStat label="Sell-Through" value={varAnalytics.overallSellThrough != null ? `${varAnalytics.overallSellThrough}%` : "—"} accent={(varAnalytics.overallSellThrough ?? 0) > 50} />
                      </div>
                    )}

                    {/* Velocity badges */}
                    {varAnalytics?.velocityDistribution && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {Object.entries(varAnalytics.velocityDistribution).map(([tier, count]) => {
                          const v = VELOCITY[tier] ?? { label: tier, color: "text-slate-400", bg: "bg-slate-800 border-slate-700" };
                          return (
                            <span key={tier} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${v.bg} ${v.color}`}>
                              {count}× {v.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider">
                            <th className="py-3 px-4">Attributes</th>
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4">Stock</th>
                            <th className="py-3 px-4">Sold</th>
                            <th className="py-3 px-4">Sell-Through</th>
                            <th className="py-3 px-4">Velocity</th>
                            <th className="py-3 px-4">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {visibleVars.map((v, i) => {
                            const vel = VELOCITY[v.velocityTier] ?? VELOCITY.slow;
                            const str = v.sellThroughRate ?? 0;
                            return (
                              <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {(v.attributes ?? []).map((a, idx) => (
                                      <span key={idx} className="bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded text-[10px] text-slate-300">
                                        <span className="text-slate-500">{a.name}:</span> {a.value}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-sm text-blue-400 whitespace-nowrap">
                                  {pricing.currency ?? ""} {fmtP(v.price)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${(v.stock ?? 0) > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                                    {v.stock ?? 0}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-white font-bold">{v.sold ?? 0}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${str > 70 ? "bg-emerald-500" : str > 40 ? "bg-amber-500" : "bg-red-500"}`}
                                        style={{ width: `${str}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-400 tabular-nums">{str}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${vel.bg} ${vel.color}`}>
                                    {vel.label}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                                  {pricing.currency ?? ""} {fmt(v.estimatedRevenue)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {variations.length > 8 && (
                      <button
                        onClick={() => setVarExpanded(!varExpanded)}
                        className="w-full mt-3 py-2.5 text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        {varExpanded
                          ? <><ChevronUp size={13} /> Show less</>
                          : <><ChevronDown size={13} /> Show {variations.length - 8} more variations</>}
                      </button>
                    )}
                  </Section>
                )}

                {/* COMPETITION */}
                <Section title="Market Competition" icon={<BarChart3 size={15} className="text-violet-400" />}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <MiniStat label="Competition"    value={competition.level ?? "—"} />
                    <MiniStat label="Unique Sellers" value={fmt(competition.uniqueSellers)} />
                    <MiniStat label="Market Share"   value={competition.marketSharePct != null ? `${competition.marketSharePct}%` : "—"} accent />
                    <MiniStat label="Concentration"  value={competition.marketConcentration != null ? `${competition.marketConcentration}%` : "—"} />
                  </div>

                  {(competition.topCompetitors?.length ?? 0) > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-3">Top Competitors</p>
                      <div className="space-y-2 mb-5">
                        {competition.topCompetitors.map((c, i) => {
                          const maxL = competition.topCompetitors[0]?.listings || 1;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-600 w-4 tabular-nums">{i + 1}</span>
                              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {c.username?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <span className="flex-1 text-sm text-slate-300 font-medium truncate">{c.username ?? "—"}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="w-20 bg-slate-800 rounded-full h-1">
                                  <div
                                    className="bg-violet-500/60 h-full rounded-full"
                                    style={{ width: `${Math.min((c.listings / maxL) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 tabular-nums w-16 text-right">{c.listings} listings</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="pt-4 border-t border-slate-800 flex items-center gap-4">
                    <span className="text-xs text-slate-500 shrink-0">Competition pressure</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (competition.score ?? 0) >= 70 ? "bg-red-500" :
                          (competition.score ?? 0) >= 40 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${competition.score ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 tabular-nums w-8 text-right">
                      {competition.score ?? 0}
                    </span>
                  </div>
                </Section>
              </div>

              {/* ── RIGHT SIDEBAR ── */}
              <div className="space-y-6">

                {/* SELLER CARD */}
                <div className={`bg-gradient-to-b ${tierStyle} border rounded-2xl p-5`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-black text-lg">
                        {seller.username?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{seller.username ?? "—"}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">
                          {seller.topRatedSeller ? "⭐ Top Rated Plus" : "Active Seller"}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-white/10 border border-white/10">
                      {strength.tier ?? "—"}
                    </span>
                  </div>

                  {/* Score ring + pillar breakdown */}
                  <div className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5 mb-4">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none"
                          stroke="currentColor" strokeWidth="3"
                          strokeDasharray={`${strength.total ?? 0} ${100 - (strength.total ?? 0)}`}
                          className="opacity-80"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-black text-sm">{strength.total ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm mb-2">Strength Score</div>
                      <div className="space-y-1.5">
                        {Object.entries(pillars).map(([key, p]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[10px] text-white/50 w-14 capitalize">{key}</span>
                            <div className="flex-1 bg-black/30 rounded-full h-1">
                              <div
                                className="bg-white/60 h-full rounded-full"
                                style={{ width: `${(p.max ?? 0) > 0 ? ((p.score / p.max) * 100) : 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-white/60 tabular-nums">{p.score}/{p.max}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <SellerStat label="Feedback Score"    value={fmt(seller.feedbackScore)} />
                    <SellerStat label="Positive Feedback" value={`${seller.positiveFeedbackPercent ?? 0}%`} good={(seller.positiveFeedbackPercent ?? 0) >= 99} />
                    <SellerStat label="Active Listings"   value={seller.relatedActiveListings ?? "—"} />
                    <SellerStat label="Est. Total Sales"  value={fmt(seller.estimatedTotalSales)} highlight />
                  </div>
                </div>

                {/* PRICE ANALYSIS */}
                <Section title="Price Analysis" icon={<Tag size={15} className="text-blue-400" />}>
                  <div className="text-center py-3 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <PriceArrow label={pricing.position} />
                      <span className={`text-lg font-black ${
                        pricing.position?.includes("below") ? "text-emerald-400" :
                        pricing.position?.includes("above") ? "text-red-400" : "text-slate-200"
                      }`}>
                        {pricing.position ?? "—"}
                      </span>
                    </div>
                    {pricing.pctFromAvg != null && (
                      <div className="text-sm text-slate-500">
                        {pricing.pctFromAvg > 0 ? "+" : ""}{pricing.pctFromAvg}% vs market avg
                      </div>
                    )}
                  </div>

                  {pricing.percentile != null && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
                        <span>Cheapest</span>
                        <span>{pricing.percentile}th percentile</span>
                        <span>Most exp.</span>
                      </div>
                      <div className="relative bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-30" />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-white rounded-full"
                          style={{ left: `${Math.min(Math.max(pricing.percentile, 0), 99)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <MiniStat label="Your Price"    value={`${pricing.currency ?? ""} ${fmtP(pricing.price)}`} accent />
                    <MiniStat label="Market Avg"    value={pricing.marketAvg    ? `${pricing.currency} ${pricing.marketAvg}`    : "—"} />
                    <MiniStat label="Market Median" value={pricing.marketMedian ? `${pricing.currency} ${pricing.marketMedian}` : "—"} />
                    <MiniStat label="Sample Size"   value={pricing.sampleSize != null ? `${pricing.sampleSize} listings` : "—"} />
                  </div>
                </Section>

                {/* DATA QUALITY */}
                <Section title="Data Quality" icon={<CheckCircle2 size={15} className="text-slate-400" />}>
                  <div className="space-y-3">
                    <QualityRow label="Trading API"    ok={dataQuality.tradingApiSuccess === true} />
                    <QualityRow label="Variation Data" ok={dataQuality.variationConfidence === "high"} note={dataQuality.variationConfidence} />
                    <QualityRow label="Sales Estimate" ok={["high","medium"].includes(dataQuality.salesConfidence ?? "")} note={dataQuality.salesConfidence} />
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                      <span className="text-slate-600">Market sample</span>
                      <span className="text-slate-400 font-medium">{fmt(dataQuality.marketSampleSize)} listings</span>
                    </div>
                  </div>
                </Section>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   REUSABLE COMPONENTS
════════════════════════════════════════ */

function KpiCard({ icon, label, value, sub, accent = "blue", suffix = "" }) {
  const a = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.blue;
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
      <div className={`inline-flex p-2 rounded-xl border mb-3 ${a}`}>
        {cloneElement(icon, { size: 16 })}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">{label}</div>
      <div className="text-2xl font-black text-white tabular-nums">
        {value ?? "—"}
        <span className="text-slate-600 text-sm font-normal">{suffix}</span>
      </div>
      {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ title, icon, children, badge, action }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50 shrink-0">{icon}</div>
          <h3 className="text-white text-sm font-bold tracking-tight truncate">{title}</h3>
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium shrink-0">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div className={`p-3 rounded-xl border ${accent ? "bg-slate-900 border-slate-700" : "bg-slate-900/40 border-slate-800"}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">{label}</div>
      <div className={`text-sm font-bold truncate ${accent ? "text-blue-400" : "text-slate-200"}`}>{value ?? "—"}</div>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800/60 last:border-0">
      <span className="text-slate-600">{label}</span>
      <span className={`font-bold ${accent ? "text-blue-400" : "text-slate-300"}`}>{value ?? "—"}</span>
    </div>
  );
}

function SellerStat({ label, value, highlight, good }) {
  return (
    <div className="flex justify-between items-center text-xs py-2 border-b border-white/5 last:border-0">
      <span className="text-white/40">{label}</span>
      <span className={`font-bold ${highlight ? "text-white" : good ? "text-emerald-400" : "text-white/70"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function ScorePill({ score }) {
  const color =
    score >= 70 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    score >= 40 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                  "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${color}`}>
      {score}/100
    </span>
  );
}

function QualityRow({ label, ok, note }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-red-400" />}
        <span className="text-slate-400">{label}</span>
      </div>
      {note && (
        <span className={`text-[10px] font-semibold capitalize ${ok ? "text-emerald-500" : "text-slate-600"}`}>
          {note}
        </span>
      )}
    </div>
  );
}