import React from 'react';

export default function StyleCustomizer({ styles, setStyles }) {
  const updateStyle = (key, val) => setStyles({ ...styles, [key]: val });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <h3 className="text-md font-bold text-orange-400 uppercase tracking-wider mb-4">2. Visual Brand Aesthetics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Primary Color</label>
          <input type="color" value={styles.primaryColor} onChange={e => updateStyle('primaryColor', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Canvas Background</label>
          <input type="color" value={styles.backgroundColor} onChange={e => updateStyle('backgroundColor', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Typography Text</label>
          <input type="color" value={styles.textColor} onChange={e => updateStyle('textColor', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Header Background</label>
          <input type="color" value={styles.headerBg} onChange={e => updateStyle('headerBg', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Header Typography</label>
          <input type="color" value={styles.headerText} onChange={e => updateStyle('headerText', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Font Engine Family</label>
          <select value={styles.fontFamily} onChange={e => updateStyle('fontFamily', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white">
            <option value="sans-serif">Modern Sans-Serif</option>
            <option value="serif">Classic Serif</option>
            <option value="monospace">Technical Monospace</option>
          </select>
        </div>
      </div>
    </div>
  );
}