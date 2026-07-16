import React from 'react';

export default function StyleCustomizer({ styles, setStyles }) {
  const updateStyle = (key, val) => setStyles({ ...styles, [key]: val });

  return (
    <div className="rounded-sm border border-[#D5D9D9] bg-white p-5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Brand Style</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <ColorField label="Primary Color" value={styles.primaryColor} onChange={(v) => updateStyle('primaryColor', v)} />
        <ColorField label="Canvas Background" value={styles.backgroundColor} onChange={(v) => updateStyle('backgroundColor', v)} />
        <ColorField label="Text Color" value={styles.textColor} onChange={(v) => updateStyle('textColor', v)} />
        <ColorField label="Header Background" value={styles.headerBg} onChange={(v) => updateStyle('headerBg', v)} />
        <ColorField label="Header Text" value={styles.headerText} onChange={(v) => updateStyle('headerText', v)} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Font Family</label>
          <select
            value={styles.fontFamily}
            onChange={e => updateStyle('fontFamily', e.target.value)}
            className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="sans-serif">Sans-Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer rounded-sm border border-slate-300 bg-white"
      />
    </div>
  );
}
