import React from 'react';

export default function HeroBannerModule({ data, updateModule, mode }) {
  const isMobile = mode === 'mobile';
  const activeImage = isMobile ? data.mobileImage : data.pcImage;

  if (mode === 'editor') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 text-slate-800 font-sans">
        <div>
          <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Hero Banner Setup</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Hero PC Image URL (1464 × 600 px)</label>
            <input 
              type="text" 
              value={data.pcImage || ''} 
              onChange={e => updateModule(data.id, { pcImage: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Hero Mobile Image URL (600 × 450 px)</label>
            <input 
              type="text" 
              value={data.mobileImage || ''} 
              onChange={e => updateModule(data.id, { mobileImage: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-orange-500" 
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Image Alt Text (SEO ~80 chars)</label>
          <input 
            type="text" 
            value={data.altText || ''} 
            placeholder="Hero banner visualization showcasing branding elements cleanly..." 
            onChange={e => updateModule(data.id, { altText: e.target.value })} 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-emerald-700 focus:outline-none focus:border-orange-500" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative bg-white font-sans p-0 m-0 line-height-0">
      <div className={`w-full overflow-hidden block ${isMobile ? 'aspect-[600/450]' : 'aspect-[1464/600]'}`}>
        <img 
          src={activeImage} 
          alt={data.altText || 'Hero Banner Asset'} 
          className="w-full h-full object-cover block p-0 m-0" 
        />
      </div>
    </div>
  );
}