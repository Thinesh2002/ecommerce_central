import React from 'react';

export default function SingleImageTextModule({ data, updateModule, styles, mode }) {
  const isMobile = mode === 'mobile';
  const activeImage = isMobile ? data.mobileImage : data.pcImage;

  if (mode === 'editor') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 text-slate-800 font-sans">
        <div>
          <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Single Image Layout Setup (500×500)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Feature PC Image URL (500×500 px)</label>
            <input 
              type="text" 
              value={data.pcImage || ''} 
              onChange={e => updateModule(data.id, { pcImage: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Feature Mobile Image URL (500×500 px)</label>
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
            placeholder="Detailed description of the single product variant feature asset for SEO..." 
            onChange={e => updateModule(data.id, { altText: e.target.value })} 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-emerald-700 focus:outline-none focus:border-orange-500" 
          />
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Key Benefit Title</label>
            <input 
              type="text" 
              value={data.title || ''} 
              placeholder="Key Benefit Title" 
              onChange={e => updateModule(data.id, { title: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Deep Feature Description</label>
            <textarea 
              value={data.description || ''} 
              placeholder="Deep Technical Feature Info Description" 
              onChange={e => updateModule(data.id, { description: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 h-16 resize-none focus:outline-none focus:border-orange-500" 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white border border-slate-100 rounded-2xl shadow-xs w-full font-sans flex flex-col ${isMobile ? 'space-y-4' : 'md:flex-row md:space-x-8 items-center'} group`}>
      <div className={`aspect-square w-full ${isMobile ? 'max-w-full' : 'md:w-1/2 max-w-[500px]'} bg-transparent overflow-hidden rounded-xl flex items-center justify-center shrink-0`}>
        <img 
          src={activeImage} 
          alt={data.altText || 'Single Core Feature Product Graphic'} 
          className="w-full h-full object-cover transform transition-transform duration-300 ease-in-out group-hover:scale-103" 
        />
      </div>
      
      <div className={`${isMobile ? 'w-full' : 'md:w-1/2'} space-y-2.5`}>
        {data.title && (
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight border-b pb-1.5" style={{ borderBottomColor: styles.primaryColor || '#ea580c' }}>
            {data.title}
          </h3>
        )}
        {data.description && (
          <p className="text-xs leading-relaxed text-slate-600">
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
}