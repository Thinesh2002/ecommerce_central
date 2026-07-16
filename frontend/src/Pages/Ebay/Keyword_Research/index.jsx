import { useState, useMemo } from "react";
import { Chart } from "react-google-charts";
import { searchKeywords } from "../../../config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  Target,
  Box,
  Activity,
  ExternalLink,
  Award,
  Layers,
  ChevronRight,
  Flame,
  Zap,
  ShieldCheck,
  Clock,
  DollarSign,
  CheckCircle,
  Info,
} from "lucide-react";

if (typeof document !== "undefined" && !document.getElementById("kw-fonts")) {
  const l = document.createElement("link");
  l.id = "kw-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap";
  document.head.appendChild(l);
}

const ITEMS_PER_PAGE = 10;
const TOP_LIMIT = 100;

const colors = {
  bg: "#0b0f17",
  card: "rgba(17,24,39,0.82)",
  cardSoft: "rgba(31,41,55,0.45)",
  border: "rgba(148,163,184,0.14)",
  borderStrong: "rgba(148,163,184,0.24)",
  text: "#f8fafc",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#e5e7eb",
  good: "#86efac",
  warn: "#facc15",
  danger: "#fca5a5",
};

const card = {
  background: colors.card,
  backdropFilter: "blur(16px)",
  border: `1px solid ${colors.border}`,
  borderRadius: 18,
};

const label = {
  fontSize: 10,
  fontWeight: 700,
  color: colors.muted,
  textTransform: "uppercase",
  letterSpacing: "0.22em",
};

const mono = {
  fontFamily: "'JetBrains Mono', monospace",
};

function difficultyColor(score) {
  if (score >= 75) return colors.danger;
  if (score >= 50) return "#fdba74";
  if (score >= 25) return colors.warn;
  return colors.good;
}

function trendColor(signal = "") {
  if (signal.includes("Up")) return colors.good;
  if (signal.includes("Down")) return colors.danger;
  return colors.warn;
}

export default function Keyword() {
  const [keyword, setKeyword] = useState("");
  const [market, setMarket] = useState("EBAY_GB");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState("");

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

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text.length > 32 ? text.slice(0, 32) + "…" : text);
    setTimeout(() => setCopied(""), 2000);
  };

  const demandKeywords = useMemo(
    () => result?.keywordInsights?.relatedDemandKeywords || [],
    [result]
  );

  const longTailKeywords = useMemo(
    () => result?.keywordInsights?.longTailKeywords || [],
    [result]
  );

  const totalDemand = useMemo(
    () =>
      demandKeywords
        .slice(0, TOP_LIMIT)
        .reduce((s, i) => s + (Number(i.demand) || 0), 0),
    [demandKeywords]
  );

  const totalPages = Math.ceil(demandKeywords.length / ITEMS_PER_PAGE);

  const paginated = useMemo(
    () =>
      demandKeywords.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
      ),
    [demandKeywords, page]
  );

  const getTier = (pct) => {
    if (pct >= 5) {
      return {
        label: "High",
        color: colors.text,
        bg: "rgba(248,250,252,0.08)",
        border: "rgba(248,250,252,0.22)",
      };
    }

    if (pct >= 2) {
      return {
        label: "Mid",
        color: colors.warn,
        bg: "rgba(250,204,21,0.07)",
        border: "rgba(250,204,21,0.18)",
      };
    }

    return {
      label: "Niche",
      color: colors.muted,
      bg: "rgba(148,163,184,0.07)",
      border: "rgba(148,163,184,0.16)",
    };
  };

  const pieData = useMemo(() => {
    if (!demandKeywords.length) return [["Keyword", "Demand"]];

    return [
      ["Keyword", "Demand"],
      ...demandKeywords.slice(0, 6).map((i) => [i.keyword, Number(i.demand) || 0]),
    ];
  }, [demandKeywords]);

  const pieOptions = {
    backgroundColor: "transparent",
    pieHole: 0.68,
    colors: ["#f8fafc", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155"],
    legend: {
      position: "right",
      textStyle: {
        color: colors.muted,
        fontSize: 11,
        fontName: "Outfit",
      },
    },
    chartArea: {
      width: "100%",
      height: "82%",
    },
    pieSliceBorderColor: "transparent",
    tooltip: {
      isHtml: true,
    },
  };

  const difficulty = result?.keywordInfo?.keywordDifficulty;
  const ageTrend = result?.marketAnalytics?.listingAgeTrend;
  const pricing = result?.marketAnalytics?.pricingStrategy;
  const quality = result?.listingQualityAnalysis;

  return (
    <div
      style={{
        fontFamily: "'Outfit', sans-serif",
        color: colors.text,
        position: "relative",
        minHeight: "100vh",
        padding: "8px",
      }}
      className="space-y-7"
    >
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -16, x: "-50%" }}
            style={{
              position: "fixed",
              top: 28,
              left: "50%",
              zIndex: 9999,
              background: "rgba(15,23,42,0.96)",
              border: `1px solid ${colors.borderStrong}`,
              backdropFilter: "blur(12px)",
              borderRadius: 100,
              padding: "8px 20px",
              fontSize: 11,
              fontWeight: 700,
              color: colors.text,
              boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
              letterSpacing: "0.05em",
              ...mono,
            }}
          >
            Copied: {copied}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }

        .kw-info-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .kw-info-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid rgba(148,163,184,0.28);
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: help;
          transition: all 0.15s ease;
          background: rgba(15,23,42,0.9);
        }

        .kw-info-wrap:hover .kw-info-icon {
          color: #f8fafc;
          border-color: rgba(248,250,252,0.45);
          background: rgba(31,41,55,0.95);
        }

        .kw-tooltip {
          position: absolute;
          top: 26px;
          right: 0;
          width: 290px;
          background: #0f172a;
          border: 1px solid rgba(148,163,184,0.24);
          box-shadow: 0 20px 50px rgba(0,0,0,0.38);
          color: #cbd5e1;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 11px;
          line-height: 1.6;
          font-weight: 500;
          z-index: 50;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-4px);
          transition: all 0.16s ease;
          text-transform: none;
          letter-spacing: normal;
        }

        .kw-info-wrap:hover .kw-tooltip {
          opacity: 1;
          transform: translateY(0);
        }

        .kw-tooltip strong {
          color: #f8fafc;
          font-weight: 700;
        }
      `}</style>

      <header style={{ position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          High-Level Keyword Research
        </h1>

        <p
          style={{
            margin: "12px 0 0",
            maxWidth: 780,
            color: colors.muted,
            fontSize: 14,
            lineHeight: 1.7,
            fontWeight: 500,
          }}
        >
          Professional dashboard for keyword demand, competition, pricing,
          listing quality, and competitor intelligence.
        </p>
      </header>

      <section style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            background: "rgba(15,23,42,0.82)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 6,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 220,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "4px 14px",
            }}
          >
            <Search
              size={15}
              style={{ color: colors.muted, opacity: 0.8, flexShrink: 0 }}
            />

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search product, niche, competitor, or buyer keyword..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: colors.text,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "'Outfit', sans-serif",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              style={{
                background: "rgba(15,23,42,0.92)",
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: "8px 14px",
                color: colors.muted,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                outline: "none",
                cursor: "pointer",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <option value="EBAY_GB">GB</option>
              <option value="EBAY_US">US</option>
              <option value="EBAY_DE">DE</option>
              <option value="EBAY_AU">AU</option>
            </select>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: "9px 28px",
                borderRadius: 10,
                border: `1px solid ${colors.borderStrong}`,
                cursor: "pointer",
                background: loading ? "rgba(148,163,184,0.18)" : "#e5e7eb",
                color: "#111827",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                fontFamily: "'Outfit', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: "2px solid rgba(17,24,39,0.28)",
                      borderTopColor: "#111827",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  RESEARCHING
                </>
              ) : (
                <>
                  <Activity size={13} /> RESEARCH
                </>
              )}
            </motion.button>
          </div>
        </div>
      </section>

      {error && (
        <div
          style={{
            background: "rgba(248,113,113,0.06)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 12,
            padding: "12px 20px",
            color: colors.danger,
            fontSize: 13,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 pb-10"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Competition"
              value={result.keywordInfo?.competitionLevel}
              tooltip="Competition level is calculated from the number of active listings, seller density, and how crowded the market is for this keyword."
            />

            <StatCard
              icon={<Box size={18} />}
              label="Total Listings"
              value={(result.totalListings || 0).toLocaleString()}
              tooltip="Total listings shows how many listings were found for this keyword in the selected eBay marketplace."
            />

            <StatCard
              icon={<Target size={18} />}
              label="Opportunity"
              value={`${result.keywordInfo?.opportunityScore ?? "—"} / 10`}
              accent
              tooltip="Opportunity score compares demand, competition, sell-through, and keyword difficulty. Higher score means better keyword opportunity."
            />

            <StatCard
              icon={<Award size={18} />}
              label="Sell-Through"
              value={result.marketAnalytics?.sellThroughRate}
              tooltip="Sell-through rate is calculated by comparing sold/listing movement against total available listings. It shows market conversion strength."
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            {difficulty && (
              <div style={{ ...card, padding: 28 }}>
                <SectionTitle
                  icon={<Zap size={14} />}
                  text="Keyword Difficulty"
                  tooltip="Keyword difficulty is calculated using competition level, seller strength, listing count, and average seller feedback. Lower score is easier to rank."
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    marginTop: 20,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 90,
                      height: 90,
                      flexShrink: 0,
                    }}
                  >
                    <svg viewBox="0 0 90 90" width="90" height="90">
                      <circle
                        cx="45"
                        cy="45"
                        r="36"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="45"
                        cy="45"
                        r="36"
                        fill="none"
                        stroke={difficultyColor(difficulty.score)}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(difficulty.score / 100) * 226} 226`}
                        transform="rotate(-90 45 45)"
                      />
                    </svg>

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: difficultyColor(difficulty.score),
                          ...mono,
                          lineHeight: 1,
                        }}
                      >
                        {difficulty.score}
                      </span>
                      <span
                        style={{
                          fontSize: 8,
                          color: colors.muted,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                        }}
                      >
                        /100
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: difficultyColor(difficulty.score),
                        margin: "0 0 8px",
                      }}
                    >
                      {difficulty.label}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        lineHeight: 1.6,
                        margin: "0 0 12px",
                      }}
                    >
                      {difficulty.advice}
                    </p>

                    <Chip
                      label={`Avg Feedback: ${(
                        difficulty.avgSellerFeedback || 0
                      ).toLocaleString()}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {ageTrend && (
              <div style={{ ...card, padding: 28 }}>
                <SectionTitle
                  icon={<Clock size={14} />}
                  text="Listing Age Trend"
                  tooltip="Listing age trend checks how many listings are new vs old. More recent listings can mean active demand or increasing competition."
                />

                <div
                  style={{
                    marginTop: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: trendColor(ageTrend.trendSignal),
                      }}
                    >
                      {ageTrend.trendSignal}
                    </span>

                    <span style={{ fontSize: 10, color: colors.muted, ...mono }}>
                      {ageTrend.recentListingPct} recent
                    </span>
                  </div>

                  {(ageTrend.breakdown || []).map((b, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: colors.muted,
                          width: 90,
                          flexShrink: 0,
                          fontWeight: 600,
                        }}
                      >
                        {b.period}
                      </span>

                      <div
                        style={{
                          flex: 1,
                          height: 5,
                          borderRadius: 3,
                          background: "rgba(255,255,255,0.05)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 3,
                            width: b.pct,
                            background:
                              i <= 1
                                ? "rgba(248,250,252,0.75)"
                                : "rgba(148,163,184,0.34)",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: 10,
                          color: colors.dim,
                          ...mono,
                          width: 36,
                          textAlign: "right",
                        }}
                      >
                        {b.pct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {pricing && (
            <div style={{ ...card, padding: 28 }}>
              <SectionTitle
                icon={<DollarSign size={14} />}
                text="Pricing Strategy"
                tooltip="Pricing strategy is calculated using market price distribution. Entry price uses low-range pricing, sweet spot uses median pricing, and premium anchor uses upper-range pricing."
              />

              <div
                style={{
                  marginTop: 20,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12,
                }}
              >
                {[
                  {
                    label: "Entry Price",
                    value: pricing.entryPrice,
                    sub: "Low price range",
                  },
                  {
                    label: "Sweet Spot",
                    value: pricing.sweetSpot,
                    sub: "Median price range",
                    accent: true,
                  },
                  {
                    label: "Premium Anchor",
                    value: pricing.premiumAnchor,
                    sub: "Upper price range",
                  },
                  {
                    label: "P25",
                    value: pricing.p25,
                    sub: "Lower quartile",
                  },
                  {
                    label: "P75",
                    value: pricing.p75,
                    sub: "Upper quartile",
                  },
                  {
                    label: "Undercut Gap",
                    value: pricing.undercutGap,
                    sub: "Average vs lower range",
                  },
                ].map((p, i) => (
                  <div
                    key={i}
                    style={{
                      background: p.accent
                        ? "rgba(248,250,252,0.07)"
                        : "rgba(255,255,255,0.025)",
                      border: `1px solid ${
                        p.accent ? colors.borderStrong : "rgba(255,255,255,0.05)"
                      }`,
                      borderRadius: 14,
                      padding: "16px 18px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: colors.muted,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        margin: "0 0 6px",
                      }}
                    >
                      {p.label}
                    </p>

                    <p
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        margin: "0 0 4px",
                        color: colors.text,
                        ...mono,
                      }}
                    >
                      {p.value}
                    </p>

                    <p
                      style={{
                        fontSize: 10,
                        color: colors.dim,
                        margin: 0,
                        fontWeight: 500,
                      }}
                    >
                      {p.sub}
                    </p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.035)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <CheckCircle
                  size={14}
                  style={{ color: colors.muted, flexShrink: 0, marginTop: 1 }}
                />
                <p
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {pricing.recommendation}
                </p>
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 14,
            }}
          >
            <div style={{ ...card, padding: 28 }}>
              <SectionTitle
                icon={<Flame size={14} />}
                text="Demand Distribution"
                tooltip="Demand distribution shows the top related keywords and their demand share. Bigger share means that keyword contributes more to total demand."
              />

              <div style={{ height: 260, marginTop: 24 }}>
                {pieData.length > 1 ? (
                  <Chart
                    chartType="PieChart"
                    data={pieData}
                    options={pieOptions}
                    width="100%"
                    height="100%"
                  />
                ) : (
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: 13,
                      textAlign: "center",
                      paddingTop: 80,
                    }}
                  >
                    No data
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                ...card,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: `1px solid ${colors.border}`,
                  background: colors.cardSoft,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <SectionTitle
                  text="Keyword Opportunity Matrix"
                  tooltip="Keyword score is calculated as keyword demand divided by total demand from the top keyword set. It shows keyword weight inside this market."
                  compact
                />

                <span style={{ fontSize: 10, color: colors.muted, ...mono }}>
                  {demandKeywords.length} terms
                </span>
              </div>

              <div style={{ overflowY: "auto", maxHeight: 300, flex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        background: "rgba(15,23,42,0.58)",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                      }}
                    >
                      {["Buyer Search Term", "Tier", "Score"].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 20px",
                            fontSize: 9,
                            fontWeight: 700,
                            color: colors.muted,
                            textTransform: "uppercase",
                            letterSpacing: "0.18em",
                            textAlign:
                              i === 1 ? "center" : i === 2 ? "right" : "left",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.map((item, i) => {
                      const pct = totalDemand
                        ? ((Number(item.demand) || 0) / totalDemand) * 100
                        : 0;
                      const tier = getTier(pct);

                      return (
                        <tr
                          key={i}
                          onClick={() => copy(item.keyword)}
                          title="Click to copy keyword"
                          style={{
                            borderBottom: `1px solid rgba(148,163,184,0.07)`,
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.035)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "12px 20px",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <ChevronRight
                              size={11}
                              style={{ color: colors.dim, flexShrink: 0 }}
                            />
                            {item.keyword}
                          </td>

                          <td
                            style={{
                              padding: "12px 20px",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: tier.color,
                                background: tier.bg,
                                border: `1px solid ${tier.border}`,
                              }}
                            >
                              {tier.label}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "12px 20px",
                              textAlign: "right",
                              ...mono,
                              fontSize: 11,
                              fontWeight: 700,
                              color: colors.dim,
                            }}
                          >
                            {pct.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div
                  style={{
                    padding: "12px 20px",
                    borderTop: `1px solid ${colors.border}`,
                    background: "rgba(15,23,42,0.38)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: page === 1 ? colors.dim : colors.text,
                      background: "none",
                      border: "none",
                      cursor: page === 1 ? "default" : "pointer",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    ← Prev
                  </button>

                  <span style={{ fontSize: 10, color: colors.muted, ...mono }}>
                    {page} / {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: page === totalPages ? colors.dim : colors.text,
                      background: "none",
                      border: "none",
                      cursor: page === totalPages ? "default" : "pointer",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>

          {quality && (
            <div style={{ ...card, padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  gap: 16,
                }}
              >
                <SectionTitle
                  icon={<ShieldCheck size={14} />}
                  text="Listing Quality Analysis"
                  tooltip="Listing quality score is calculated using title quality, price clarity, seller information, image/listing completeness, and marketplace presentation signals."
                  noMargin
                />

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: colors.muted,
                      fontWeight: 600,
                    }}
                  >
                    Market avg score
                  </span>

                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color:
                        quality.averageQualityScore >= 60
                          ? colors.good
                          : quality.averageQualityScore >= 40
                          ? colors.warn
                          : colors.danger,
                      ...mono,
                    }}
                  >
                    {quality.averageQualityScore}
                  </span>

                  <span style={{ fontSize: 10, color: colors.dim, ...mono }}>
                    /100
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                {Object.entries(quality.gradeDistribution || {}).map(
                  ([grade, count]) => {
                    const total =
                      Object.values(quality.gradeDistribution || {}).reduce(
                        (a, b) => a + b,
                        0
                      ) || 1;

                    const pct = ((count / total) * 100).toFixed(0);

                    const color =
                      grade === "A"
                        ? colors.good
                        : grade === "B"
                        ? colors.text
                        : grade === "C"
                        ? colors.warn
                        : colors.danger;

                    return (
                      <div
                        key={grade}
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 12,
                          padding: "14px 16px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 28,
                            fontWeight: 800,
                            color,
                            margin: "0 0 4px",
                            lineHeight: 1,
                            ...mono,
                          }}
                        >
                          {grade}
                        </p>

                        <p
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: colors.text,
                            margin: "0 0 4px",
                            ...mono,
                          }}
                        >
                          {count}
                        </p>

                        <p
                          style={{
                            fontSize: 10,
                            color: colors.muted,
                            margin: 0,
                            fontWeight: 600,
                          }}
                        >
                          {pct}% of listings
                        </p>

                        <div
                          style={{
                            height: 3,
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.05)",
                            marginTop: 10,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: color,
                              borderRadius: 2,
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <p style={{ ...label, marginBottom: 12 }}>Top Quality Listings</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(quality.topQualityListings || []).slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = colors.borderStrong)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.04)")
                    }
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color:
                          item.grade === "A"
                            ? colors.good
                            : item.grade === "B"
                            ? colors.text
                            : colors.warn,
                        ...mono,
                        width: 16,
                      }}
                    >
                      {item.grade}
                    </span>

                    <span
                      style={{
                        fontSize: 12,
                        color: "#e2e8f0",
                        fontWeight: 500,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        ...mono,
                        flexShrink: 0,
                      }}
                    >
                      ${item.price?.toFixed(2)}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: colors.text,
                        ...mono,
                        width: 28,
                        textAlign: "right",
                      }}
                    >
                      {item.qualityScore}
                    </span>

                    {item.itemUrl && (
                      <a
                        href={item.itemUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: colors.dim,
                          display: "flex",
                          alignItems: "center",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = colors.text)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = colors.dim)
                        }
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {longTailKeywords.length > 0 && (
            <section style={{ ...card, padding: 28 }}>
              <SectionTitle
                icon={<Layers size={15} />}
                text="Long-Tail Keyword Ideas"
                tooltip="Long-tail keywords are generated from related buyer search terms. These are useful for title, item specifics, description, and SEO optimization."
              />

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 18,
                }}
              >
                {longTailKeywords.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => copy(tag)}
                    title="Click to copy keyword"
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.muted,
                      background: "rgba(255,255,255,0.035)",
                      border: `1px solid ${colors.border}`,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.borderStrong;
                      e.currentTarget.style.color = colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.color = colors.muted;
                    }}
                  >
                    {tag} <ExternalLink size={11} style={{ opacity: 0.45 }} />
                  </button>
                ))}
              </div>
            </section>
          )}

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
                padding: "0 4px",
              }}
            >
              <SectionTitle
                text="Competitor Intelligence"
                tooltip="Competitor intelligence is taken from top marketplace listings. It helps understand seller price, listing condition, watchers, bids, and live listing strength."
                heading
              />

              <div
                style={{
                  flex: 1,
                  height: 1,
                  background:
                    "linear-gradient(90deg,rgba(148,163,184,0.22),transparent)",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 14,
              }}
            >
              {(result.topCompetitors || []).map((item, i) => (
                <div
                  key={i}
                  style={{
                    ...card,
                    padding: 22,
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.borderStrong;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#e2e8f0",
                          margin: "0 0 8px",
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </h4>

                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 6,
                          color: colors.muted,
                          background: "rgba(148,163,184,0.08)",
                          border: "1px solid rgba(148,163,184,0.16)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          ...mono,
                        }}
                      >
                        {item.seller?.substring(0, 12)}
                      </span>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          margin: 0,
                          color: colors.text,
                          ...mono,
                          lineHeight: 1,
                        }}
                      >
                        {parseFloat(item.price || 0).toFixed(2)}
                      </p>

                      <span
                        style={{
                          fontSize: 9,
                          color: colors.dim,
                          fontWeight: 700,
                          ...mono,
                          letterSpacing: "0.1em",
                        }}
                      >
                        {item.currency}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginBottom: 14,
                      paddingBottom: 14,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        fontWeight: 600,
                      }}
                    >
                      {item.watchers ?? 0}{" "}
                      <span style={{ color: colors.dim }}>watchers</span>
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        fontWeight: 600,
                      }}
                    >
                      {item.bids ?? 0}{" "}
                      <span style={{ color: colors.dim }}>bids</span>
                    </span>

                    {item.condition && item.condition !== "N/A" && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 5,
                          marginLeft: "auto",
                          color: colors.muted,
                          background: "rgba(148,163,184,0.08)",
                          border: "1px solid rgba(148,163,184,0.16)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {item.condition}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 9,
                        fontWeight: 700,
                        color: colors.muted,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: colors.good,
                          display: "inline-block",
                        }}
                      />
                      Live Listing
                    </div>

                    <a
                      href={item.itemUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 16px",
                        borderRadius: 9,
                        fontSize: 10,
                        fontWeight: 700,
                        textDecoration: "none",
                        color: colors.text,
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${colors.border}`,
                        transition: "all 0.15s",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontFamily: "'Outfit', sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.text;
                        e.currentTarget.style.color = "#111827";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = colors.text;
                      }}
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

function InfoTip({ text }) {
  return (
    <span className="kw-info-wrap">
      <span className="kw-info-icon">
        <Info size={11} />
      </span>
      <span className="kw-tooltip">
        <strong>How this is calculated:</strong>
        <br />
        {text}
      </span>
    </span>
  );
}

function SectionTitle({ icon, text, tooltip, noMargin, compact, heading }) {
  if (heading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {text}
        </h3>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: noMargin ? 0 : compact ? 0 : "0 0 4px",
      }}
    >
      <p
        style={{
          ...label,
          margin: 0,
          color: compact ? colors.text : colors.muted,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {icon} {text}
      </p>
      {tooltip && <InfoTip text={tooltip} />}
    </div>
  );
}

function StatCard({ icon, label, value, accent, tooltip }) {
  return (
    <div
      style={{
        background: colors.card,
        backdropFilter: "blur(16px)",
        border: `1px solid ${accent ? colors.borderStrong : colors.border}`,
        borderRadius: 16,
        padding: "18px 22px",
        transition: "transform 0.2s, border-color 0.2s",
        fontFamily: "'Outfit', sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = colors.borderStrong;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = accent
          ? colors.borderStrong
          : colors.border;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${colors.border}`,
            color: colors.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: colors.muted,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                margin: 0,
              }}
            >
              {label}
            </p>
            {tooltip && <InfoTip text={tooltip} />}
          </div>

          <p
            style={{
              fontSize: 24,
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: colors.text,
            }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function Chip({ label }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 6,
        color: colors.muted,
        background: "rgba(148,163,184,0.08)",
        border: "1px solid rgba(148,163,184,0.16)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {label}
    </span>
  );
}