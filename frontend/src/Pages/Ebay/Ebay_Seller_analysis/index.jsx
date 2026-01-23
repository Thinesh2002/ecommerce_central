import { useState, cloneElement } from "react";
import API from "../../../config/api";
import { 
  Search, BarChart3, User, Package, Truck, Layers, ExternalLink, 
  AlertCircle, TrendingUp, Users, Tag, Globe, ShieldCheck, Target, Zap 
} from "lucide-react";

export default function SellerProfilePage() {
  const [itemId, setItemId] = useState("");
  const [market, setMarket] = useState("EBAY_GB");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSellerProfile = async () => {
    if (!itemId.trim()) {
      setError("Please enter a valid eBay Item ID");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await API.post("/seller/profile", {
        itemId: itemId.trim(),
        market
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch seller data");
    } finally {
      setLoading(false);
    }
  };

  const seller = data?.seller;
  const product = data?.product;
  const marketAnalysis = data?.marketAnalysis;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-2xl">
              <Zap className="w-8 h-8 text-blue-500 fill-blue-500/20" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Advanced Competitor Insights</h1>
              <p className="text-slate-500 text-sm">Real-time market dominance & seller strength analysis</p>
            </div>
          </div>
        </header>

        {/* SEARCH BAR */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-3 rounded-3xl flex flex-wrap items-center gap-3 shadow-2xl">
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Paste eBay Item ID here..."
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-700/50 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-white"
            />
          </div>

          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="bg-slate-950/40 border border-slate-700/50 pl-10 pr-10 py-4 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium"
            >
              <option value="EBAY_GB">United Kingdom</option>
              <option value="EBAY_US">United States</option>
              <option value="EBAY_DE">Germany</option>
              <option value="EBAY_FR">France</option>
            </select>
          </div>

          <button
            onClick={fetchSellerProfile}
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 active:scale-95"
          >
            {loading ? "Analyzing..." : "Analyze Now"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {data && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            
            {/* TOP METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <KPI icon={<ShieldCheck />} title="Strength Score" value={`${seller.strengthScore}/100`} color="text-blue-400" />
              <KPI icon={<Target />} title="Success Rate" value={seller.successRate} color="text-emerald-400" />
              <KPI icon={<TrendingUp />} title="Market Rank" value={marketAnalysis.competitionLevel} color="text-amber-400" />
              <KPI icon={<Tag />} title="Price Tier" value={marketAnalysis.pricePosition.toUpperCase()} color="text-purple-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* MAIN ANALYSIS CARD */}
              <div className="lg:col-span-8 space-y-6">
                <Card icon={<Package className="text-blue-400" />} title="Competitor Product Intelligence">
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 mb-4">
                    <h2 className="text-white text-lg font-semibold leading-snug">{product.title}</h2>
                    <div className="flex gap-2 mt-3">
                       <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded-full border border-blue-500/20">
                         {product.condition}
                       </span>
                       <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded-full border border-slate-700">
                         ID: {product.itemId}
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-2">
                    <Info label="Current Price" value={`${product.pricing.currency} ${product.pricing.price}`} highlight />
                    <Info label="Stock Level" value={product.inventory.stockLevel} />
                    <Info label="Est. Monthly Sales" value={product.inventory.estimatedSales} />
                    <Info label="Shipping" value={product.shipping.freeShipping ? "Free Delivery" : product.shipping.shippingCost} />
                  </div>

                  <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                      Marketplace: <span className="text-slate-300 font-bold">{marketAnalysis.marketplace}</span>
                    </div>
                    <a href={product.itemUrl} target="_blank" className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-bold transition-all">
                      View Original Listing <ExternalLink size={14} />
                    </a>
                  </div>
                </Card>

                {/* --- NEW: VARIATION BREAKDOWN TABLE --- */}
                {product.variations?.details?.length > 0 && (
                  <Card icon={<Layers className="text-amber-400" />} title="Variation Breakdown & Sales">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-widest">
                            <th className="py-4 px-2">Variation Attributes</th>
                            <th className="py-4 px-2">Price</th>
                            <th className="py-4 px-2">Stock</th>
                            <th className="py-4 px-2 text-center">Qty Sold</th>
                            <th className="py-4 px-2 text-right">Market Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {product.variations.details.map((v, i) => {
                            const totalSold = product.inventory.estimatedSales;
                            const share = totalSold > 0 ? Math.round((v.sold / totalSold) * 100) : 0;
                            return (
                              <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                <td className="py-4 px-2">
                                  <div className="flex flex-wrap gap-1">
                                    {v.attributes.map((attr, idx) => (
                                      <span key={idx} className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700">
                                        <span className="text-slate-500">{attr.name}:</span> {attr.value}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-4 px-2 text-blue-400 font-mono">
                                  {product.pricing.currency} {v.price}
                                </td>
                                <td className="py-4 px-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.stock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                                    {v.stock}
                                  </span>
                                </td>
                                <td className="py-4 px-2 text-center font-bold text-white">
                                  {v.sold}
                                </td>
                                <td className="py-4 px-2">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-12 bg-slate-800 h-1 rounded-full overflow-hidden hidden sm:block">
                                      <div className="bg-amber-500 h-full" style={{ width: `${share}%` }} />
                                    </div>
                                    <span className="text-amber-500 text-[11px] font-bold">{share}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* COMPETITION CONTEXT */}
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <BarChart3 size={180} className="text-blue-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">
                      <Zap size={16} /> Market Strategy Note
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed max-w-2xl italic">
                      "{marketAnalysis.confidenceNote}"
                    </p>
                  </div>
                </div>
              </div>

              {/* SELLER STATS SIDEBAR */}
              <div className="lg:col-span-4 space-y-6">
                <Card icon={<User className="text-emerald-400" />} title="Seller Profile">
                  <div className="flex items-center gap-4 mb-6 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xl">
                      {seller.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-bold">{seller.username}</div>
                      <div className="text-[10px] text-emerald-500 uppercase font-black tracking-tighter">
                        {seller.topRatedSeller ? "🏆 Top Rated Plus" : "Active Seller"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Info label="Feedback Score" value={seller.feedbackScore.toLocaleString()} />
                    <Info label="Success Rate" value={seller.successRate} />
                    <Info label="Related Listings" value={seller.relatedActiveListings} />
                    <Info label="Total Monthly Vol." value={seller.estimatedTotalSales} highlight />
                  </div>
                </Card>

                <Card icon={<Layers className="text-amber-400" />} title="Variation Matrix">
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                      <p className="text-sm text-slate-300">{product.variations.summary}</p>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Confidence Level</span>
                      <span className="text-emerald-400 font-bold">{product.variations.confidence.toUpperCase()}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- MODERN UI COMPONENTS ---------------- */

function Card({ title, icon, children }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2rem] p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-slate-800/50 rounded-xl">{icon}</div>
        <h3 className="text-white text-lg font-bold tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Info({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/40 last:border-0">
      <span className="text-slate-500 text-sm font-medium">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-blue-400' : 'text-slate-100'}`}>
        {value}
      </span>
    </div>
  );
}

function KPI({ title, value, icon, color }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
      <div className={`${color} mb-3 p-2 bg-slate-950 inline-block rounded-xl border border-slate-800`}>
        {cloneElement(icon, { size: 20 })}
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
      <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-125 transition-transform duration-500">
        {cloneElement(icon, { size: 80 })}
      </div>
    </div>
  );
}