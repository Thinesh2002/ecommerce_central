import { useState, useMemo } from "react";
import { Chart } from "react-google-charts";
import { searchKeywords } from "../../../config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, TrendingUp, Target, Box, Activity,
  ExternalLink, Award, Layers, ChevronRight, Flame,
  Zap, BarChart2, ShieldCheck, Clock, DollarSign,
  Star, AlertTriangle, CheckCircle
} from "lucide-react";

if (typeof document !== "undefined" && !document.getElementById("kw-fonts")) {
  const l = document.createElement("link");
  l.id = "kw-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap";
  document.head.appendChild(l);
}

const ITEMS_PER_PAGE = 10;
const TOP_LIMIT = 100;

// ─── Shared style tokens ────────────────────────────────────────────────────
const card = {
  background: "rgba(6,21,35,0.7)", backdropFilter: "blur(16px)",
  border: "1px solid rgba(0,212,245,0.1)", borderRadius: 20
};
const label = { fontSize: 10, fontWeight: 700, color: "#4d8aad", textTransform: "uppercase", letterSpacing: "0.25em" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ─── Difficulty helpers ─────────────────────────────────────────────────────
function difficultyColor(score) {
  if (score >= 75) return "#f87171";
  if (score >= 50) return "#fb923c";
  if (score >= 25) return "#fbbf24";
  return "#4ade80";
}

// ─── Trend signal helpers ───────────────────────────────────────────────────
function trendColor(signal = "") {
  if (signal.includes("Up"))   return "#4ade80";
  if (signal.includes("Down")) return "#f87171";
  return "#fbbf24";
}

export default function Keyword() {
  const [keyword, setKeyword] = useState("");
  const [market, setMarket]   = useState("EBAY_GB");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [page, setPage]       = useState(1);
  const [copied, setCopied]   = useState("");

  const handleSearch = async () => {
    if (!keyword.trim()) { setError("Please enter a keyword"); return; }
    setLoading(true); setError(""); setPage(1);
    try {
      const res = await searchKeywords({ keyword, market });
      setResult(res);
    } catch { setError("Failed to fetch keyword data"); }
    finally { setLoading(false); }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text.length > 32 ? text.slice(0, 32) + "…" : text);
    setTimeout(() => setCopied(""), 2000);
  };

  const demandKeywords   = useMemo(() => result?.keywordInsights?.relatedDemandKeywords || [], [result]);
  const longTailKeywords = useMemo(() => result?.keywordInsights?.longTailKeywords || [], [result]);
  const totalDemand      = useMemo(() => demandKeywords.slice(0, TOP_LIMIT).reduce((s, i) => s + (i.demand || 0), 0), [demandKeywords]);
  const totalPages       = Math.ceil(demandKeywords.length / ITEMS_PER_PAGE);
  const paginated        = useMemo(() => demandKeywords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [demandKeywords, page]);

  const getTier = (pct) => {
    if (pct >= 5) return { label: "High",  color: "#00d4f5", bg: "rgba(0,212,245,0.08)",  border: "rgba(0,212,245,0.25)"  };
    if (pct >= 2) return { label: "Mid",   color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)" };
    return           { label: "Niche", color: "#4d8aad", bg: "rgba(77,138,173,0.08)",  border: "rgba(77,138,173,0.2)"  };
  };

  const pieData = useMemo(() => {
    if (!demandKeywords.length) return [["Keyword", "Demand"]];
    return [["Keyword", "Demand"], ...demandKeywords.slice(0, 6).map(i => [i.keyword, i.demand])];
  }, [demandKeywords]);

  const pieOptions = {
    backgroundColor: "transparent",
    pieHole: 0.65,
    colors: ["#00d4f5","#0ea5e9","#38bdf8","#7dd3fc","#0284c7","#0369a1"],
    legend: { position: "right", textStyle: { color: "#4d8aad", fontSize: 11, fontName: "Outfit" } },
    chartArea: { width: "100%", height: "82%" },
    pieSliceBorderColor: "transparent",
    tooltip: { isHtml: true },
  };

  // ── Derived new-feature data ───────────────────────────────────────────
  const difficulty   = result?.keywordInfo?.keywordDifficulty;
  const ageTrend     = result?.marketAnalytics?.listingAgeTrend;
  const pricing      = result?.marketAnalytics?.pricingStrategy;
  const quality      = result?.listingQualityAnalysis;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", color: "#e0f4ff" }} className="space-y-7">

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 360, height: 360,
        background: "radial-gradient(circle, rgba(0,212,245,0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0 }} />

      {/* Copy toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -16, x: "-50%" }}
            style={{
              position: "fixed", top: 28, left: "50%", zIndex: 9999,
              background: "rgba(10,30,48,0.95)", border: "1px solid rgba(0,212,245,0.4)",
              backdropFilter: "blur(12px)", borderRadius: 100, padding: "8px 20px",
              fontSize: 11, fontWeight: 700, color: "#00d4f5",
              boxShadow: "0 0 24px rgba(0,212,245,0.2)", letterSpacing: "0.05em",
              ...mono
            }}
          >
            ✓ Copied: {copied}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <header style={{ position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", margin: 0 }}>
          Keyword{" "}
          <span style={{ background: "linear-gradient(90deg,#00d4f5,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Analysis
          </span>
        </h1>
      </header>

      {/* Search bar */}
      <section style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          background: "rgba(6,21,35,0.8)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,212,245,0.15)", borderRadius: 16,
          padding: 6, display: "flex", flexWrap: "wrap", gap: 6
        }}>
          <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 10, padding: "4px 14px" }}>
            <Search size={15} style={{ color: "#00d4f5", opacity: 0.7, flexShrink: 0 }} />
            <input
              value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Enter niche or product keyword..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e0f4ff", fontSize: 14, fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <select value={market} onChange={e => setMarket(e.target.value)} style={{
              background: "rgba(2,13,20,0.9)", border: "1px solid rgba(0,212,245,0.15)",
              borderRadius: 10, padding: "8px 14px", color: "#4d8aad", fontSize: 11,
              fontWeight: 700, fontFamily: "'Outfit', sans-serif", outline: "none", cursor: "pointer",
              letterSpacing: "0.1em", textTransform: "uppercase"
            }}>
              <option value="EBAY_GB">🇬🇧 GB</option>
              <option value="EBAY_US">🇺🇸 US</option>
              <option value="EBAY_DE">🇩🇪 DE</option>
              <option value="EBAY_AU">🇦🇺 AU</option>
            </select>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSearch} disabled={loading}
              style={{
                padding: "9px 28px", borderRadius: 10, border: "none", cursor: "pointer",
                background: loading ? "rgba(0,212,245,0.3)" : "linear-gradient(135deg,#00d4f5,#0ea5e9)",
                color: "#020d14", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em",
                fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 0 20px rgba(0,212,245,0.25)", opacity: loading ? 0.7 : 1, transition: "all 0.2s"
              }}
            >
              {loading
                ? <><span style={{ width: 12, height: 12, border: "2px solid rgba(2,13,20,0.3)", borderTopColor: "#020d14", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> SCANNING</>
                : <><Activity size={13} /> ANALYZE</>
              }
            </motion.button>
          </div>
        </div>
      </section>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: "12px 20px", color: "#f87171", fontSize: 13, fontWeight: 500, textAlign: "center" }}>
          {error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 pb-10" style={{ position: "relative", zIndex: 1 }}>

          {/* ── Row 1: KPI cards ─────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {[
              { icon: <TrendingUp size={18} />, label: "Competition",   value: result.keywordInfo?.competitionLevel },
              { icon: <Box size={18} />,        label: "Total Listings", value: (result.totalListings || 0).toLocaleString() },
              { icon: <Target size={18} />,     label: "Opp. Score",    value: `${result.keywordInfo?.opportunityScore ?? "—"} / 10`, accent: true },
              { icon: <Award size={18} />,      label: "Sell-through",  value: result.marketAnalytics?.sellThroughRate },
            ].map((c, i) => (
              <StatCard key={i} {...c} />
            ))}
          </div>

          {/* ── Row 2: Keyword Difficulty + Listing Age Trend ────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Keyword Difficulty */}
            {difficulty && (
              <div style={{ ...card, padding: 28 }}>
                <SectionLabel icon={<Zap size={14} />} text="Keyword Difficulty" />
                <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 20 }}>
                  {/* Dial */}
                  <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
                    <svg viewBox="0 0 90 90" width="90" height="90">
                      <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle cx="45" cy="45" r="36" fill="none"
                        stroke={difficultyColor(difficulty.score)}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(difficulty.score / 100) * 226} 226`}
                        transform="rotate(-90 45 45)"
                        style={{ filter: `drop-shadow(0 0 6px ${difficultyColor(difficulty.score)})` }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: difficultyColor(difficulty.score), ...mono, lineHeight: 1 }}>{difficulty.score}</span>
                      <span style={{ fontSize: 8, color: "#4d8aad", fontWeight: 700, letterSpacing: "0.1em" }}>/100</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: difficultyColor(difficulty.score), margin: "0 0 8px", letterSpacing: "-0.01em" }}>{difficulty.label}</p>
                    <p style={{ fontSize: 11, color: "#4d8aad", lineHeight: 1.6, margin: "0 0 12px" }}>{difficulty.advice}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Chip label={`Avg Feedback: ${(difficulty.avgSellerFeedback || 0).toLocaleString()}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Listing Age Trend */}
            {ageTrend && (
              <div style={{ ...card, padding: 28 }}>
                <SectionLabel icon={<Clock size={14} />} text="Listing Age Trend" />
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: trendColor(ageTrend.trendSignal), letterSpacing: "-0.01em" }}>{ageTrend.trendSignal}</span>
                    <span style={{ fontSize: 10, color: "#4d8aad", ...mono }}>{ageTrend.recentListingPct} recent</span>
                  </div>
                  {(ageTrend.breakdown || []).map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: "#4d8aad", width: 90, flexShrink: 0, fontWeight: 600 }}>{b.period}</span>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 3,
                          width: b.pct,
                          background: i <= 1
                            ? "linear-gradient(90deg,#00d4f5,#0ea5e9)"
                            : "rgba(77,138,173,0.4)",
                          transition: "width 0.6s ease"
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#1e4d6b", ...mono, width: 36, textAlign: "right" }}>{b.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Row 3: Pricing Strategy ──────────────────────────────────── */}
          {pricing && (
            <div style={{ ...card, padding: 28 }}>
              <SectionLabel icon={<DollarSign size={14} />} text="Pricing Strategy" />
              <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                {[
                  { label: "Entry Price",     value: pricing.entryPrice,    sub: "10% below median — fast mover",   accent: false, icon: "⚡" },
                  { label: "Sweet Spot",      value: pricing.sweetSpot,     sub: "Median — balanced visibility",    accent: true,  icon: "🎯" },
                  { label: "Premium Anchor",  value: pricing.premiumAnchor, sub: "P75+10% — high margin",           accent: false, icon: "💎" },
                  { label: "P25",             value: pricing.p25,           sub: "Lower quartile floor",            accent: false, icon: "📉" },
                  { label: "P75",             value: pricing.p75,           sub: "Upper quartile ceiling",          accent: false, icon: "📈" },
                  { label: "Undercut Gap",    value: pricing.undercutGap,   sub: "Avg vs P25 spread",               accent: false, icon: "✂️" },
                ].map((p, i) => (
                  <div key={i} style={{
                    background: p.accent ? "rgba(0,212,245,0.07)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${p.accent ? "rgba(0,212,245,0.3)" : "rgba(255,255,255,0.05)"}`,
                    borderRadius: 14, padding: "16px 18px"
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: "#4d8aad", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px" }}>
                      {p.icon} {p.label}
                    </p>
                    <p style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", ...mono,
                      ...(p.accent ? { background: "linear-gradient(135deg,#00d4f5,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: "#e0f4ff" })
                    }}>{p.value}</p>
                    <p style={{ fontSize: 10, color: "#1e4d6b", margin: 0, fontWeight: 500 }}>{p.sub}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(0,212,245,0.04)", border: "1px solid rgba(0,212,245,0.1)", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <CheckCircle size={14} style={{ color: "#00d4f5", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#4d8aad", margin: 0, lineHeight: 1.6 }}>{pricing.recommendation}</p>
              </div>
            </div>
          )}

          {/* ── Row 4: Chart + Keyword Table ─────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 14 }}>
            {/* Pie chart */}
            <div style={{ ...card, padding: 28 }}>
              <SectionLabel icon={<Flame size={14} />} text="Volume Distribution" />
              <div style={{ height: 260, marginTop: 24 }}>
                {pieData.length > 1
                  ? <Chart chartType="PieChart" data={pieData} options={pieOptions} width="100%" height="100%" />
                  : <div style={{ color: "#4d8aad", fontSize: 13, textAlign: "center", paddingTop: 80 }}>No data</div>
                }
              </div>
            </div>

            {/* Keyword matrix table */}
            <div style={{ ...card, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(0,212,245,0.07)", background: "rgba(10,30,48,0.4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ ...label, margin: 0, color: "#e0f4ff" }}>Keyword Matrix</p>
                <span style={{ fontSize: 10, color: "#4d8aad", ...mono }}>{demandKeywords.length} terms</span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 300, flex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(2,13,20,0.5)", position: "sticky", top: 0, zIndex: 2 }}>
                      {["Strategic Term","Tier","Score"].map((h, i) => (
                        <th key={h} style={{ padding: "10px 20px", fontSize: 9, fontWeight: 700, color: "#4d8aad", textTransform: "uppercase", letterSpacing: "0.2em", textAlign: i === 1 ? "center" : i === 2 ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((item, i) => {
                      const pct  = totalDemand ? (item.demand / totalDemand) * 100 : 0;
                      const tier = getTier(pct);
                      return (
                        <tr key={i} onClick={() => copy(item.keyword)}
                          style={{ borderBottom: "1px solid rgba(0,212,245,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,245,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, color: "#c5e8f5", display: "flex", alignItems: "center", gap: 8 }}>
                            <ChevronRight size={11} style={{ color: "#1e4d6b", flexShrink: 0 }} />
                            {item.keyword}
                          </td>
                          <td style={{ padding: "12px 20px", textAlign: "center" }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.1em", color: tier.color, background: tier.bg, border: `1px solid ${tier.border}` }}>{tier.label}</span>
                          </td>
                          <td style={{ padding: "12px 20px", textAlign: "right", ...mono, fontSize: 11, fontWeight: 700, color: "#1e4d6b" }}>
                            {pct.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(0,212,245,0.07)", background: "rgba(2,13,20,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ fontSize: 11, fontWeight: 700, color: page === 1 ? "#1e4d6b" : "#00d4f5", background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    ← Prev
                  </button>
                  <span style={{ fontSize: 10, color: "#4d8aad", ...mono }}>{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ fontSize: 11, fontWeight: 700, color: page === totalPages ? "#1e4d6b" : "#00d4f5", background: "none", border: "none", cursor: page === totalPages ? "default" : "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Row 5: Listing Quality Analysis ─────────────────────────── */}
          {quality && (
            <div style={{ ...card, padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <SectionLabel icon={<ShieldCheck size={14} />} text="Listing Quality Analysis" noMargin />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "#4d8aad", fontWeight: 600 }}>Market avg score</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: quality.averageQualityScore >= 60 ? "#4ade80" : quality.averageQualityScore >= 40 ? "#fbbf24" : "#f87171", ...mono }}>
                    {quality.averageQualityScore}
                  </span>
                  <span style={{ fontSize: 10, color: "#1e4d6b", ...mono }}>/100</span>
                </div>
              </div>

              {/* Grade distribution bars */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
                {Object.entries(quality.gradeDistribution).map(([grade, count]) => {
                  const total = Object.values(quality.gradeDistribution).reduce((a, b) => a + b, 0) || 1;
                  const pct   = ((count / total) * 100).toFixed(0);
                  const color = grade === "A" ? "#4ade80" : grade === "B" ? "#00d4f5" : grade === "C" ? "#fbbf24" : "#f87171";
                  return (
                    <div key={grade} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                      <p style={{ fontSize: 28, fontWeight: 800, color, margin: "0 0 4px", lineHeight: 1, ...mono }}>{grade}</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "#e0f4ff", margin: "0 0 4px", ...mono }}>{count}</p>
                      <p style={{ fontSize: 10, color: "#4d8aad", margin: 0, fontWeight: 600 }}>{pct}% of listings</p>
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", marginTop: 10, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease", filter: `drop-shadow(0 0 4px ${color})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top quality listings */}
              <p style={{ ...label, marginBottom: 12 }}>Top Quality Listings</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(quality.topQualityListings || []).slice(0, 5).map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "10px 14px",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 10, transition: "border-color 0.15s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,212,245,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"}
                  >
                    <span style={{ fontSize: 10, fontWeight: 800, color: item.grade === "A" ? "#4ade80" : item.grade === "B" ? "#00d4f5" : "#fbbf24", ...mono, width: 16 }}>{item.grade}</span>
                    <span style={{ fontSize: 12, color: "#c5e8f5", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                    <span style={{ fontSize: 11, color: "#4d8aad", ...mono, flexShrink: 0 }}>${item.price?.toFixed(2)}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#00d4f5", ...mono, width: 28, textAlign: "right" }}>{item.qualityScore}</span>
                    {item.itemUrl && (
                      <a href={item.itemUrl} target="_blank" rel="noreferrer"
                        style={{ color: "#1e4d6b", display: "flex", alignItems: "center", transition: "color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#00d4f5"}
                        onMouseLeave={e => e.currentTarget.style.color = "#1e4d6b"}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Row 6: Long tail ─────────────────────────────────────────── */}
          {longTailKeywords.length > 0 && (
            <section style={{ ...card, padding: 28 }}>
              <SectionLabel icon={<Layers size={15} />} text="Long Tail Insights" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
                {longTailKeywords.map((tag, i) => (
                  <button key={i} onClick={() => copy(tag)}
                    style={{
                      padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                      color: "#4d8aad", background: "rgba(0,212,245,0.04)",
                      border: "1px solid rgba(0,212,245,0.1)", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                      fontFamily: "'Outfit', sans-serif"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,212,245,0.4)"; e.currentTarget.style.color = "#00d4f5"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,212,245,0.1)"; e.currentTarget.style.color = "#4d8aad"; }}
                  >
                    {tag} <ExternalLink size={11} style={{ opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Row 7: Market Leaders ────────────────────────────────────── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: "0 4px" }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Market Leaders</h3>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(0,212,245,0.2),transparent)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              {(result.topCompetitors || []).map((item, i) => (
                <div key={i}
                  style={{ ...card, padding: 22, transition: "border-color 0.2s, transform 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,212,245,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,212,245,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#c5e8f5", margin: "0 0 8px", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h4>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 6, color: "#00d4f5", background: "rgba(0,212,245,0.06)", border: "1px solid rgba(0,212,245,0.2)", letterSpacing: "0.12em", textTransform: "uppercase", ...mono }}>
                        {item.seller?.substring(0, 12)}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 22, fontWeight: 800, margin: 0, ...mono, background: "linear-gradient(135deg,#00d4f5,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
                        {parseFloat(item.price || 0).toFixed(2)}
                      </p>
                      <span style={{ fontSize: 9, color: "#1e4d6b", fontWeight: 700, ...mono, letterSpacing: "0.1em" }}>{item.currency}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(0,212,245,0.07)" }}>
                    <span style={{ fontSize: 11, color: "#4d8aad", fontWeight: 600 }}>👁 {item.watchers ?? 0} <span style={{ color: "#1e4d6b" }}>watchers</span></span>
                    <span style={{ fontSize: 11, color: "#4d8aad", fontWeight: 600 }}>🔨 {item.bids ?? 0} <span style={{ color: "#1e4d6b" }}>bids</span></span>
                    {item.condition && item.condition !== "N/A" && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5, marginLeft: "auto", color: "#4d8aad", background: "rgba(77,138,173,0.08)", border: "1px solid rgba(77,138,173,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {item.condition}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 700, color: "#00d4f5", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4f5", boxShadow: "0 0 6px #00d4f5", display: "inline-block" }} />
                      Live Listing
                    </div>
                    <a href={item.itemUrl} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, fontSize: 10, fontWeight: 700, textDecoration: "none", color: "#00d4f5", background: "rgba(0,212,245,0.07)", border: "1px solid rgba(0,212,245,0.25)", transition: "all 0.15s", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#00d4f5"; e.currentTarget.style.color = "#020d14"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,212,245,0.07)"; e.currentTarget.style.color = "#00d4f5"; }}
                    >
                      View <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      background: "rgba(6,21,35,0.7)", backdropFilter: "blur(16px)",
      border: `1px solid ${accent ? "rgba(0,212,245,0.25)" : "rgba(0,212,245,0.1)"}`,
      borderRadius: 16, padding: "18px 22px", transition: "transform 0.2s, border-color 0.2s",
      fontFamily: "'Outfit', sans-serif"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(0,212,245,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = accent ? "rgba(0,212,245,0.25)" : "rgba(0,212,245,0.1)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ padding: 10, borderRadius: 10, background: accent ? "rgba(0,212,245,0.1)" : "rgba(0,212,245,0.05)", border: "1px solid rgba(0,212,245,0.15)", color: "#00d4f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#4d8aad", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 4px" }}>{label}</p>
          <p style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1,
            ...(accent ? { background: "linear-gradient(135deg,#00d4f5,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: "#e0f4ff" })
          }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, text, noMargin }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, color: "#00d4f5", letterSpacing: "0.35em", textTransform: "uppercase", margin: noMargin ? 0 : "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
      {icon} {text}
    </p>
  );
}

function Chip({ label }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 6, color: "#4d8aad", background: "rgba(77,138,173,0.08)", border: "1px solid rgba(77,138,173,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
      {label}
    </span>
  );
}