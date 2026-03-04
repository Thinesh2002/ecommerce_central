import React, { useState, useRef, useEffect, useMemo, cloneElement } from "react";
import API from "../../../config/api";
import { Chart } from "react-google-charts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, BarChart3, User, Package, Layers, ExternalLink, 
  AlertCircle, TrendingUp, Tag, Globe, ShieldCheck, Target, 
  Zap, Flame, ChevronDown, Activity, DollarSign, Image as ImageIcon,
  CheckCircle2, ShoppingCart, Award, ListChecks, Info as InfoIcon
} from "lucide-react";

/* ---------------- CUSTOM MARKET SELECT ---------------- */
function CustomMarketSelect({ market, setMarket }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const options = [
    { value: "EBAY_GB", label: "UK", flag: "🇬🇧" },
    { value: "EBAY_US", label: "USA", flag: "🇺🇸" },
    { value: "EBAY_DE", label: "DE", flag: "🇩🇪" },
  ];
  const selected = options.find((o) => o.value === market) || options[0];

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/40 border border-white/10 pl-4 pr-10 py-4 rounded-2xl flex items-center gap-3 focus:outline-none focus:border-orange-500/50 min-w-[140px]"
      >
        <Globe className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-black uppercase text-slate-300">{selected.flag} {selected.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="absolute right-3 text-slate-500"><ChevronDown size={14} /></motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-2 w-full z-[60] bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {options.map((o) => (
              <button key={o.value} onClick={() => { setMarket(o.value); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase ${market === o.value ? "bg-orange-500 text-white" : "text-slate-400 hover:bg-white/5"}`}>
                {o.flag} {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function EbayIntelligenceHub() {
  const [itemId, setItemId] = useState("");
  const [keywords, setKeywords] = useState("");
  const [market, setMarket] = useState("EBAY_GB");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  const handleDeepAnalyze = async () => {
    if (!itemId.trim()) return alert("Please enter a valid Item ID");
    setLoading(true);
    setData(null);
    try {
      const res = await API.post("ebay-listing/audit", {
        itemId: itemId.trim(),
        market,
        targetKeywords: keywords.split(",").map(k => k.trim()).filter(Boolean)
      });
      setData(res.data);
    } catch (err) {
      alert("Analysis failed. Please check the Item ID.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(`Copied: ${text}`);
    setTimeout(() => setCopyStatus(""), 2000);
  };

  const chartData = useMemo(() => {
    if (!data?.analysis) return [];
    const { analysis } = data;
    return [
      ["Metric", "Score", { role: "style" }],
      ["Title", analysis.title.score, "#f97316"],
      ["Specifics", analysis.itemSpecifics.score, "#fb923c"],
      ["Images", analysis.images.score, "#fbbf24"],
      ["Pricing", analysis.pricing.score, "#f59e0b"],
      ["Shipping", analysis.shipping.score, "#ea580c"],
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 selection:bg-orange-500/30 font-sans">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] pointer-events-none" />
      
      <AnimatePresence>
        {copyStatus && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 bg-orange-600 px-6 py-2 rounded-full shadow-2xl z-[100] text-xs font-bold text-white flex items-center gap-2">
            <CheckCircle2 size={14} /> {copyStatus}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
        {/* HEADER & SEARCH */}
        <section className="text-center mb-16 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">EBAY <span className="text-orange-500 uppercase tracking-widest">SCANNER</span></h1>
            <p className="text-slate-500 text-[10px] font-black tracking-[0.5em] uppercase">Professional Grade Listing Intelligence</p>
          </motion.div>

          <div className="max-w-4xl mx-auto bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 p-3 rounded-[2.5rem] flex flex-wrap gap-3 shadow-2xl">
            <div className="flex-1 min-w-[200px] flex items-center px-4">
              <Search className="text-orange-500 mr-3" size={20} />
              <input value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="Item ID..." className="bg-transparent w-full py-4 outline-none text-white font-bold placeholder:text-slate-700" />
            </div>
            <div className="flex-1 border-l border-white/5 flex items-center px-4">
              <Target className="text-amber-500 mr-3" size={20} />
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Target Keywords..." className="bg-transparent w-full py-4 outline-none text-white font-bold placeholder:text-slate-700" />
            </div>
            <CustomMarketSelect market={market} setMarket={setMarket} />
            <button onClick={handleDeepAnalyze} disabled={loading} className="px-10 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl text-black font-black uppercase tracking-widest transition-all">
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </section>

        {data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* KPI ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPI icon={<Award />} title="Overall Score" value={`${data.autoImprovementScore}%`} color="text-orange-500" />
              <KPI icon={<DollarSign />} title="Market Position" value={data.analysis.pricing.pricePosition} color="text-amber-500" />
              <KPI icon={<TrendingUp />} title="Competition" value={`${data.analysis.competitorComparison.competitorCount} Sellers`} color="text-orange-400" />
              <KPI icon={<ImageIcon />} title="Image Health" value={data.analysis.images.highResolution ? "High Res" : "Standard"} color="text-amber-600" />
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* MAIN COLUMN */}
              <div className="lg:col-span-8 space-y-8">
                {/* LISTING IDENTITY */}
                <Card icon={<Package className="text-orange-500" />} title="Foundation Data">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white leading-tight mb-4">{data.foundationData.title}</h2>
                      <div className="flex flex-wrap gap-2">
                        <Badge label={data.foundationData.condition} color="orange" />
                        <Badge label={data.marketplace} color="slate" />
                        <Badge label={data.foundationData.isFixedPrice ? "Fixed Price" : "Auction"} color="slate" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5">
                      <Info label="Price" value={`${data.foundationData.currency} ${data.foundationData.price}`} highlight />
                      <Info label="Original" value={`${data.foundationData.currency} ${data.foundationData.originalPrice}`} />
                      <Info label="Ship Cost" value={`${data.foundationData.currency} ${data.analysis.shipping.shippingCost}`} />
                      <Info label="Images" value={`${data.analysis.images.totalImages} Files`} />
                    </div>
                  </div>
                </Card>

                {/* TECH SPECS & ATTRIBUTES */}
                <div className="grid md:grid-cols-2 gap-8">
                  <Card icon={<ListChecks className="text-amber-500" />} title="Variation Attributes">
                    <div className="space-y-3">
                      {data.foundationData.variationAttributes.map((attr, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] font-black text-slate-500 uppercase">{attr.name}</span>
                          <span className="text-xs font-bold text-slate-200">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card icon={<AlertCircle className="text-red-500" />} title="Missing Specifics">
                    <div className="flex flex-wrap gap-2">
                      {data.analysis.itemSpecifics.missingSpecs.map((spec, i) => (
                        <span key={i} className="px-3 py-1.5 bg-red-500/10 text-red-400 text-[10px] font-black rounded-lg border border-red-500/20">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* KEYWORD STRATEGY */}
                <Card icon={<Zap className="text-orange-500" />} title="Keyword Optimization">
                  <div className="grid md:grid-cols-2 gap-10">
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase mb-4 tracking-widest">Missing Keywords (Add to Title)</p>
                      <div className="flex flex-wrap gap-2">
                        {data.analysis.title.missingKeywords.map((kw, i) => (
                          <button key={i} onClick={() => copyToClipboard(kw)} className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500 border border-orange-500/20 rounded-xl text-xs font-bold text-orange-200 hover:text-black transition-all">
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">Title Health</p>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-black text-white">{data.analysis.title.length}</div>
                        <div className="text-[10px] font-bold text-slate-600 italic">Characters / 80 limit</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* SIDEBAR */}
              <div className="lg:col-span-4 space-y-8">
                {/* PERFORMANCE CHART */}
                <Card icon={<Activity className="text-orange-500" />} title="Audit Chart">
                  <div className="h-64">
                    <Chart 
                      chartType="ColumnChart" 
                      width="100%" 
                      height="100%" 
                      data={chartData} 
                      options={{ 
                        backgroundColor: "transparent", 
                        legend: "none",
                        vAxis: { gridlines: { color: "#1e293b" }, textStyle: { color: "#64748b" } },
                        hAxis: { textStyle: { color: "#64748b", fontSize: 10 } }
                      }} 
                    />
                  </div>
                </Card>

                {/* MARKET CONTEXT */}
                <Card icon={<InfoIcon className="text-amber-500" />} title="Market Analytics">
                  <div className="space-y-1">
                    <Info label="Avg Market Price" value={`${data.foundationData.currency} ${data.analysis.pricing.avgMarketPrice.toFixed(2)}`} highlight />
                    <Info label="Competitors" value={data.analysis.competitorComparison.competitorCount} />
                    <Info label="Free Ship Rate" value={`${data.analysis.shipping.competitorFreeShippingPercent}%`} />
                    <Info label="Mobile Ready" value={data.analysis.description.mobileResponsive ? "Yes" : "No"} />
                  </div>
                </Card>

                {/* RECOMMENDATION BOX */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-8 rounded-[2.5rem] shadow-2xl group overflow-hidden relative">
                   <Flame size={120} className="absolute -right-4 -bottom-4 text-black opacity-10 group-hover:scale-110 transition-transform duration-700" />
                   <h4 className="text-black font-black text-xl mb-4 italic">ACTION PLAN</h4>
                   <ul className="text-black/80 text-sm font-bold space-y-3 relative z-10">
                     <li className="flex gap-2"><span>•</span> Add {data.analysis.itemSpecifics.missingSpecs.length} item specifics to boost search rank.</li>
                     <li className="flex gap-2"><span>•</span> Price is {data.analysis.pricing.pricePosition}, competitive advantage secured.</li>
                     {!data.analysis.images.highResolution && <li className="flex gap-2"><span>•</span> Upgrade images to high-resolution for better trust.</li>}
                   </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------------- UI ATOMS ---------------- */
function KPI({ title, value, icon, color }) {
  return (
    <div className="bg-[#0f172a] border border-white/5 rounded-[2rem] p-8 hover:border-orange-500/30 transition-all duration-500">
      <div className={`${color} mb-4 p-3 bg-white/5 inline-block rounded-xl`}>{cloneElement(icon, { size: 24 })}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-white mt-1 tracking-tighter">{value}</p>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-[#0f172a]/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">{icon}</div>
        <h3 className="text-white text-xl font-black tracking-tight uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Info({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{label}</span>
      <span className={`text-xs font-black ${highlight ? 'text-orange-500' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function Badge({ label, color }) {
  const styles = color === "orange" 
    ? "bg-orange-500/10 text-orange-500 border-orange-500/20" 
    : "bg-white/5 text-slate-400 border-white/10";
  return (
    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${styles}`}>
      {label}
    </span>
  );
}