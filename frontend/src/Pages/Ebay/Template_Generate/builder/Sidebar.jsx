import React from "react";
import CopyButton from "./CopyButton";

export default function Sidebar({ state, setState }) {

    // Helper: Update objects inside an array (Banners, Products, etc.)
    const updateArray = (key, index, field, value) => {
        const arr = [...state[key]];
        arr[index] = { ...arr[index], [field]: value };
        setState({ ...state, [key]: arr });
    };

    // Helper: Add new item to an array
    const addItem = (key, defaultValue) => {
        setState({ ...state, [key]: [...state[key], defaultValue] });
    };

    // Helper: Remove item from an array
    const removeItem = (key, index) => {
        const arr = state[key].filter((_, i) => i !== index);
        setState({ ...state, [key]: arr });
    };

    return (
        <aside className="w-[380px] h-screen bg-[#0b1220] text-white flex flex-col border-r border-white/10 sticky top-0 overflow-hidden">

            {/* FIXED HEADER */}
            <div className="p-5 border-b border-white/10 bg-[#020617] shrink-0">
                <h1 className="text-lg font-bold text-blue-400">Template Editor</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Ebay Listing Builder</p>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* 1. HEADER LOGO & LINKS SETTINGS */}
                <Section title="Header Settings">
                    <div className="space-y-4 bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Logo Branding</p>
                        <Input label="Logo Text 1" value={state.header.logoText1} onChange={(v) => setState({ ...state, header: { ...state.header, logoText1: v } })} />
                        <Input label="Logo Text 2" value={state.header.logoText2} onChange={(v) => setState({ ...state, header: { ...state.header, logoText2: v } })} />
                        <Input label="Logo Subtext" value={state.header.logoSubtext} onChange={(v) => setState({ ...state, header: { ...state.header, logoSubtext: v } })} />
                    </div>

                    <div className="mt-4 space-y-4">
                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Desktop Category Links</p>
                        <p className="text-[9px] text-gray-500 italic">Rename categories and add eBay URLs</p>
                        
                        {/* Dynamic Navigation Links mapping */}
                        {(state.header.navLinks || []).map((nav, i) => (
                            <div key={i} className="flex flex-col gap-2 p-3 bg-black/40 rounded border border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-gray-400">CATEGORY {i + 1}</span>
                                    <button onClick={() => {
                                        const newLinks = state.header.navLinks.filter((_, idx) => idx !== i);
                                        setState({ ...state, header: { ...state.header, navLinks: newLinks } });
                                    }} className="text-red-500 text-[9px] hover:underline">REMOVE</button>
                                </div>
                                <Input label="Name" value={nav.name} onChange={(v) => {
                                    const newLinks = [...state.header.navLinks];
                                    newLinks[i].name = v;
                                    setState({ ...state, header: { ...state.header, navLinks: newLinks } });
                                }} />
                                <Input label="Link (eBay URL)" value={nav.url} onChange={(v) => {
                                    const newLinks = [...state.header.navLinks];
                                    newLinks[i].url = v;
                                    setState({ ...state, header: { ...state.header, navLinks: newLinks } });
                                }} />
                            </div>
                        ))}

                        <button onClick={() => {
                            const currentLinks = state.header.navLinks || [];
                            setState({ ...state, header: { ...state.header, navLinks: [...currentLinks, { name: "New Category", url: "#" }] } });
                        }} className="w-full py-2 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 transition-all">+ ADD HEADER LINK</button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                        <p className="text-[9px] font-bold text-gray-500 uppercase">Secondary Nav Buttons</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Nav 1 Name" value={state.header.nav1Name} onChange={(v) => setState({ ...state, header: { ...state.header, nav1Name: v } })} />
                            <Input label="Nav 1 Link" value={state.header.nav1Url} onChange={(v) => setState({ ...state, header: { ...state.header, nav1Url: v } })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Nav Button" value={state.header.navBtnName} onChange={(v) => setState({ ...state, header: { ...state.header, navBtnName: v } })} />
                            <Input label="Nav Button Link" value={state.header.navBtnUrl} onChange={(v) => setState({ ...state, header: { ...state.header, navBtnUrl: v } })} />
                        </div>
                    </div>
                </Section>

                {/* 2. HERO SECTION */}
                <Section title="Hero Section">
                    <Input label="Badge Text" value={state.hero.badge} onChange={(v) => setState({ ...state, hero: { ...state.hero, badge: v } })} />
                    <Input label="Main Title" value={state.hero.title} onChange={(v) => setState({ ...state, hero: { ...state.hero, title: v } })} />
                    <Input label="Highlight" value={state.hero.highlight} onChange={(v) => setState({ ...state, hero: { ...state.hero, highlight: v } })} />
                    <Input label="Subtitle" value={state.hero.subtitle} onChange={(v) => setState({ ...state, hero: { ...state.hero, subtitle: v } })} />
                    <Input label="Hero Image URL" value={state.hero.bgImage} onChange={(v) => setState({ ...state, hero: { ...state.hero, bgImage: v } })} />
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="Primary BTN" value={state.hero.btnPrimary} onChange={(v) => setState({ ...state, hero: { ...state.hero, btnPrimary: v } })} />
                        <Input label="Secondary BTN" value={state.hero.btnSecondary} onChange={(v) => setState({ ...state, hero: { ...state.hero, btnSecondary: v } })} />
                    </div>
                </Section>

                {/* 3. BANNERS LIST */}
                <Section title="Banners List">
                    {state.bannerList.map((b, i) => (
                        <ItemCard key={i} title={`Banner ${i + 1}`} onRemove={() => removeItem("bannerList", i)}>
                            <Input label="Desktop Image" value={b.desktop} onChange={(v) => updateArray("bannerList", i, "desktop", v)} />
                            <Input label="Mobile Image" value={b.mobile} onChange={(v) => updateArray("bannerList", i, "mobile", v)} />
                            <Input label="Link URL" value={b.link} onChange={(v) => updateArray("bannerList", i, "link", v)} />
                        </ItemCard>
                    ))}
                    <button onClick={() => addItem("bannerList", { desktop: "", mobile: "", link: "" })}
                        className="w-full py-2 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 transition-all">+ ADD NEW BANNER</button>
                </Section>

                {/* 4. COMPARE PRODUCTS */}
                <Section title="Compare Products">
                    {state.compareProducts.map((p, i) => (
                        <ItemCard key={i} title={`Product ${i + 1}`} onRemove={() => removeItem("compareProducts", i)}>
                            <Input label="Image URL" value={p.image} onChange={(v) => updateArray("compareProducts", i, "image", v)} />
                            <Input label="Title" value={p.name} onChange={(v) => updateArray("compareProducts", i, "name", v)} />
                            <Input label="Button Link (eBay URL)" value={p.link} onChange={(v) => updateArray("compareProducts", i, "link", v)} />

                            <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-black/20 rounded border border-white/5">
                                <Input label="Reviews" value={p.reviews} onChange={(v) => updateArray("compareProducts", i, "reviews", v)} />
                                <Input label="Price" value={p.price} onChange={(v) => updateArray("compareProducts", i, "price", v)} />
                                <Input label="Material" value={p.material} onChange={(v) => updateArray("compareProducts", i, "material", v)} />
                                <Input label="Light Source" value={p.lightSource} onChange={(v) => updateArray("compareProducts", i, "lightSource", v)} />
                                <Input label="Fixture Type" value={p.fixtureType} onChange={(v) => updateArray("compareProducts", i, "fixtureType", v)} />
                                <Input label="Button Text" value={p.button} onChange={(v) => updateArray("compareProducts", i, "button", v)} />
                            </div>
                        </ItemCard>
                    ))}
                    <button onClick={() => addItem("compareProducts", {
                        image: "", name: "", button: "BUY NOW", link: "#",
                        reviews: "", price: "", material: "", lightSource: "", fixtureType: ""
                    })}
                        className="w-full py-2 text-xs font-bold rounded bg-green-700 hover:bg-green-600">+ ADD PRODUCT</button>
                </Section>

                {/* 5. GRID CATEGORIES */}
                <Section title="Grid Cards">
                    {state.gridCards.map((c, i) => (
                        <ItemCard key={i} title={`Card ${i + 1}`} onRemove={() => removeItem("gridCards", i)}>
                            <Input label="Image URL" value={c.image} onChange={(v) => updateArray("gridCards", i, "image", v)} />
                            <Input label="Title" value={c.title} onChange={(v) => updateArray("gridCards", i, "title", v)} />
                            <Input label="Description" value={c.text} onChange={(v) => updateArray("gridCards", i, "text", v)} />
                            <Input label="Button" value={c.button} onChange={(v) => updateArray("gridCards", i, "button", v)} />
                        </ItemCard>
                    ))}
                </Section>

                {/* 6. SLIDER CONTENT */}
                <Section title="Slides">
                    {state.slider.map((s, i) => (
                        <ItemCard key={i} title={`Slide ${i + 1}`} onRemove={() => removeItem("slider", i)}>
                            <Input label="Image URL" value={s.image} onChange={(v) => updateArray("slider", i, "image", v)} />
                            <Input label="Heading" value={s.heading} onChange={(v) => updateArray("slider", i, "heading", v)} />
                            <Input label="Description" value={s.text} onChange={(v) => updateArray("slider", i, "text", v)} />
                            <Input label="Button" value={s.button} onChange={(v) => updateArray("slider", i, "button", v)} />
                        </ItemCard>
                    ))}
                </Section>
            </div>

            {/* FIXED FOOTER WITH COPY BUTTON */}
            <div className="p-4 border-t border-white/10 bg-[#020617] shrink-0">
                <CopyButton state={state} />
            </div>
        </aside>
    );
}

/* ================= UI COMPONENTS ================= */

function Section({ title, children }) {
    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-4 shadow-sm">
            <h2 className="text-[10px] font-black mb-4 uppercase tracking-[2px] text-blue-400">{title}</h2>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function ItemCard({ title, children, onRemove }) {
    return (
        <div className="bg-[#0b1220] border border-white/10 rounded-lg p-3 relative group">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] font-bold text-gray-500 uppercase">{title}</p>
                <button onClick={onRemove} className="text-red-500 text-[9px] hover:underline opacity-0 group-hover:opacity-100 transition-opacity">REMOVE</button>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Input({ label, value, onChange }) {
    return (
        <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 mb-1 ml-1">{label}</label>
            <input
                className="w-full px-3 py-2 rounded bg-[#020617] border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-blue-600 transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck="false"
            />
        </div>
    );
}