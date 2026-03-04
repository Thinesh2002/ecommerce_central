import React, { useState, useCallback, useRef, useMemo } from "react";
import CopyButton from "./CopyButton";

// ─── Immutable helpers ────────────────────────────────────────────────────────

const setPath = (obj, path, value) => {
  const [head, ...rest] = path;
  if (!rest.length) return { ...obj, [head]: value };
  return { ...obj, [head]: setPath(obj[head], rest, value) };
};

const updateArray = (state, key, index, field, value) => {
  const arr = state[key].map((item, i) =>
    i === index ? { ...item, [field]: value } : item
  );
  return { ...state, [key]: arr };
};

const addItem = (state, key, defaultValue) => ({
  ...state,
  [key]: [...state[key], defaultValue],
});

const removeItem = (state, key, index) => ({
  ...state,
  [key]: state[key].filter((_, i) => i !== index),
});

// ─── Section with collapse ────────────────────────────────────────────────────

function Section({ title, icon, defaultOpen = true, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef(null);

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1627] hover:bg-[#111d33] transition-colors group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-sm opacity-70">{icon}</span>}
          <span className="text-[10px] font-black uppercase tracking-[2.5px] text-blue-400">
            {title}
          </span>
          {badge != null && (
            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "9999px" : "0px" }}
      >
        <div className="bg-[#060d1a] px-4 py-4 space-y-4 border-t border-white/[0.04]">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Item card with collapse ──────────────────────────────────────────────────

function ItemCard({ title, children, onRemove, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-white/[0.08] overflow-hidden group">
      <div className="flex items-center justify-between px-3 py-2 bg-[#0b1525] hover:bg-[#0e1c30] transition-colors">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={open}
        >
          <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 text-[9px] font-black flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
          <svg
            className={`w-3 h-3 text-gray-600 ml-auto mr-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={onRemove}
          className="text-[9px] text-red-500/60 hover:text-red-400 font-bold uppercase tracking-wider px-1.5 py-1 rounded hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
          aria-label={`Remove ${title}`}
        >
          ✕
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-2 bg-[#060d1a] space-y-3 border-t border-white/[0.04]">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

function Input({ label, value, onChange, placeholder, type = "text", monospace = false }) {
  const id = useRef(`input-${Math.random().toString(36).slice(2)}`);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id.current} className="text-[10px] text-gray-500 ml-1 font-medium tracking-wide">
        {label}
      </label>
      <input
        id={id.current}
        type={type}
        className={`w-full px-3 py-2 rounded-lg bg-[#020817] border border-white/[0.08] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all ${monospace ? "font-mono text-xs" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}

// ─── Add button ───────────────────────────────────────────────────────────────

function AddButton({ onClick, children, color = "blue" }) {
  const colors = {
    blue:  "bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30 hover:border-blue-500/60",
    green: "bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30 hover:border-green-500/60",
  };
  return (
    <button
      onClick={onClick}
      className={`w-full py-2 text-[11px] font-black rounded-lg border transition-all uppercase tracking-widest active:scale-[.98] ${colors[color]}`}
    >
      {children}
    </button>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
      <input
        type="search"
        placeholder="Search sections…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#020817] border border-white/[0.08] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({ state, setState }) {
  const [search, setSearch] = useState("");

  const set = useCallback(
    (path, value) => setState((prev) => setPath(prev, path, value)),
    [setState]
  );

  const setHeader = useCallback((field, value) => set(["header", field], value), [set]);

  const sections = useMemo(() => [
    { key: "header",          label: "Header",           icon: "🔗" },
    { key: "hero",            label: "Hero Section",     icon: "🌟" },
    { key: "bannerList",      label: "Banners",          icon: "🖼️" },
    { key: "compareProducts", label: "Compare Products", icon: "📦" },
    { key: "gridCards",       label: "Grid Cards",       icon: "🔲" },
    { key: "slider",          label: "Slides",           icon: "🎞️" },
  ], []);

  const visibleSections = useMemo(() =>
    search.trim()
      ? sections.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
      : sections,
    [search, sections]
  );

  return (
    <aside className="w-[380px] h-screen bg-[#08101e] text-white flex flex-col border-r border-white/[0.06] sticky top-0 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="px-5 py-4 border-b border-white/[0.06] bg-[#04090f] shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-sm">
            🛒
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight">Template Editor</h1>
            <p className="text-[9px] text-blue-400/70 uppercase tracking-[2px] font-bold">eBay Listing Builder</p>
          </div>
        </div>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {visibleSections.length === 0 && (
          <p className="text-center text-xs text-gray-600 py-8">No sections match "{search}"</p>
        )}

        {/* ── 1. HEADER ── */}
        {visibleSections.find((s) => s.key === "header") && (
          <Section title="Header" icon="🔗">
            <div className="space-y-3 p-3 rounded-lg bg-black/20 border border-white/[0.04]">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Logo Branding</p>
              <Input label="Logo Text 1"  value={state.header.logoText1}  onChange={(v) => setHeader("logoText1", v)} />
              <Input label="Logo Text 2"  value={state.header.logoText2}  onChange={(v) => setHeader("logoText2", v)} />
              <Input label="Logo Subtext" value={state.header.logoSubtext} onChange={(v) => setHeader("logoSubtext", v)} />
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Category Nav Links</p>
              {(state.header.navLinks || []).map((nav, i) => (
                <ItemCard key={i} title={nav.name || `Category ${i + 1}`} index={i}
                  onRemove={() => {
                    const newLinks = state.header.navLinks.filter((_, idx) => idx !== i);
                    setHeader("navLinks", newLinks);
                  }}>
                  <Input label="Name" value={nav.name} placeholder="Category name"
                    onChange={(v) => {
                      const links = [...state.header.navLinks];
                      links[i] = { ...links[i], name: v };
                      setHeader("navLinks", links);
                    }} />
                  <Input label="eBay URL" value={nav.url} placeholder="https://…" monospace
                    onChange={(v) => {
                      const links = [...state.header.navLinks];
                      links[i] = { ...links[i], url: v };
                      setHeader("navLinks", links);
                    }} />
                </ItemCard>
              ))}
              <AddButton onClick={() => setHeader("navLinks", [...(state.header.navLinks || []), { name: "New Category", url: "#" }])}>
                + Add Header Link
              </AddButton>
            </div>

            <div className="pt-3 border-t border-white/[0.06] space-y-3">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Secondary Nav</p>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Nav 1 Name" value={state.header.nav1Name}   onChange={(v) => setHeader("nav1Name", v)} />
                <Input label="Nav 1 URL"  value={state.header.nav1Url}    onChange={(v) => setHeader("nav1Url", v)} monospace />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Button Text" value={state.header.navBtnName} onChange={(v) => setHeader("navBtnName", v)} />
                <Input label="Button URL"  value={state.header.navBtnUrl}  onChange={(v) => setHeader("navBtnUrl", v)} monospace />
              </div>
            </div>
          </Section>
        )}

        {/* ── 2. HERO ── */}
        {visibleSections.find((s) => s.key === "hero") && (
          <Section title="Hero Section" icon="🌟">
            <Input label="Badge Text"    value={state.hero.badge}       onChange={(v) => set(["hero", "badge"], v)} />
            <Input label="Main Title"    value={state.hero.title}       onChange={(v) => set(["hero", "title"], v)} />
            <Input label="Highlight"     value={state.hero.highlight}   onChange={(v) => set(["hero", "highlight"], v)} />
            <Input label="Subtitle"      value={state.hero.subtitle}    onChange={(v) => set(["hero", "subtitle"], v)} />
            <Input label="Hero Image URL" value={state.hero.bgImage}   onChange={(v) => set(["hero", "bgImage"], v)} monospace placeholder="https://…" />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Primary CTA"   value={state.hero.btnPrimary}   onChange={(v) => set(["hero", "btnPrimary"], v)} />
              <Input label="Secondary CTA" value={state.hero.btnSecondary} onChange={(v) => set(["hero", "btnSecondary"], v)} />
            </div>
          </Section>
        )}

        {/* ── 3. BANNERS ── */}
        {visibleSections.find((s) => s.key === "bannerList") && (
          <Section title="Banners" icon="🖼️" badge={state.bannerList.length}>
            {state.bannerList.map((b, i) => (
              <ItemCard key={i} title={`Banner ${i + 1}`} index={i} onRemove={() => setState((p) => removeItem(p, "bannerList", i))}>
                <Input label="Desktop Image" value={b.desktop} placeholder="https://…" monospace onChange={(v) => setState((p) => updateArray(p, "bannerList", i, "desktop", v))} />
                <Input label="Mobile Image"  value={b.mobile}  placeholder="https://…" monospace onChange={(v) => setState((p) => updateArray(p, "bannerList", i, "mobile", v))} />
                <Input label="Link URL"      value={b.link}    placeholder="https://…" monospace onChange={(v) => setState((p) => updateArray(p, "bannerList", i, "link", v))} />
              </ItemCard>
            ))}
            <AddButton onClick={() => setState((p) => addItem(p, "bannerList", { desktop: "", mobile: "", link: "" }))}>
              + Add Banner
            </AddButton>
          </Section>
        )}

        {/* ── 4. COMPARE PRODUCTS ── */}
        {visibleSections.find((s) => s.key === "compareProducts") && (
          <Section title="Compare Products" icon="📦" badge={state.compareProducts.length}>
            {state.compareProducts.map((p, i) => (
              <ItemCard key={i} title={p.name || `Product ${i + 1}`} index={i} onRemove={() => setState((prev) => removeItem(prev, "compareProducts", i))}>
                <Input label="Image URL"      value={p.image}  placeholder="https://…" monospace onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "image", v))} />
                <Input label="Title"          value={p.name}                            onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "name", v))} />
                <Input label="eBay Link"      value={p.link}   placeholder="https://…" monospace onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "link", v))} />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Input label="Reviews"      value={p.reviews}     onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "reviews", v))} />
                  <Input label="Price"        value={p.price}       onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "price", v))} />
                  <Input label="Material"     value={p.material}    onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "material", v))} />
                  <Input label="Light Source" value={p.lightSource} onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "lightSource", v))} />
                  <Input label="Fixture Type" value={p.fixtureType} onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "fixtureType", v))} />
                  <Input label="Button Text"  value={p.button}      onChange={(v) => setState((prev) => updateArray(prev, "compareProducts", i, "button", v))} />
                </div>
              </ItemCard>
            ))}
            <AddButton color="green" onClick={() => setState((prev) => addItem(prev, "compareProducts", {
              image: "", name: "", button: "BUY NOW", link: "#",
              reviews: "", price: "", material: "", lightSource: "", fixtureType: "",
            }))}>
              + Add Product
            </AddButton>
          </Section>
        )}

        {/* ── 5. GRID CARDS ── */}
        {visibleSections.find((s) => s.key === "gridCards") && (
          <Section title="Grid Cards" icon="🔲" badge={state.gridCards.length}>
            {state.gridCards.map((c, i) => (
              <ItemCard key={i} title={c.title || `Card ${i + 1}`} index={i} onRemove={() => setState((p) => removeItem(p, "gridCards", i))}>
                <Input label="Image URL"   value={c.image}  placeholder="https://…" monospace onChange={(v) => setState((p) => updateArray(p, "gridCards", i, "image", v))} />
                <Input label="Title"       value={c.title}                           onChange={(v) => setState((p) => updateArray(p, "gridCards", i, "title", v))} />
                <Input label="Description" value={c.text}                            onChange={(v) => setState((p) => updateArray(p, "gridCards", i, "text", v))} />
                <Input label="Button"      value={c.button}                          onChange={(v) => setState((p) => updateArray(p, "gridCards", i, "button", v))} />
              </ItemCard>
            ))}
          </Section>
        )}

        {/* ── 6. SLIDES ── */}
        {visibleSections.find((s) => s.key === "slider") && (
          <Section title="Slides" icon="🎞️" badge={state.slider.length}>
            {state.slider.map((s, i) => (
              <ItemCard key={i} title={s.heading || `Slide ${i + 1}`} index={i} onRemove={() => setState((p) => removeItem(p, "slider", i))}>
                <Input label="Image URL"   value={s.image}   placeholder="https://…" monospace onChange={(v) => setState((p) => updateArray(p, "slider", i, "image", v))} />
                <Input label="Heading"     value={s.heading}                          onChange={(v) => setState((p) => updateArray(p, "slider", i, "heading", v))} />
                <Input label="Description" value={s.text}                             onChange={(v) => setState((p) => updateArray(p, "slider", i, "text", v))} />
                <Input label="Button"      value={s.button}                           onChange={(v) => setState((p) => updateArray(p, "slider", i, "button", v))} />
              </ItemCard>
            ))}
            <AddButton onClick={() => setState((p) => addItem(p, "slider", { image: "", heading: "", text: "", button: "Shop Now" }))}>
              + Add Slide
            </AddButton>
          </Section>
        )}

      </div>

      {/* ── FOOTER ── */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-[#04090f] shrink-0">
        <CopyButton state={state} />
      </div>
    </aside>
  );
}