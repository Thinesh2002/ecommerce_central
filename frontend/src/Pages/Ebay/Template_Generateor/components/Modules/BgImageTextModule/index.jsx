import React from 'react';

export default function BgImageTextModule({ data, updateModule, styles, mode }) {
  const isMobile = mode === 'mobile';
  const activeImage = isMobile ? data.mobileImage : data.pcImage;

  const extraSettings = data.extraData || {
    boxTheme: 'dark',
    boxPosition: 'right',
    altText: 'Loyal family friends standing together highlighting product feature descriptions.'
  };

  const updateSetting = (field, value) => {
    updateModule(data.id, {
      extraData: {
        ...extraSettings,
        [field]: value
      }
    });
  };

  const themeClasses = extraSettings.boxTheme === 'light' 
    ? 'bg-white/95 text-slate-900 border border-slate-200' 
    : 'bg-black/75 text-white backdrop-blur-xs';

  const positionClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[extraSettings.boxPosition || 'right'];

  if (mode === 'editor') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 text-slate-800 font-sans">
        <div>
          <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Background Image Layout Setup</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Background PC Image URL (1464 × 600 px)</label>
            <input 
              type="text" 
              value={data.pcImage || ''} 
              onChange={e => updateModule(data.id, { pcImage: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Background Mobile Image URL (600 × 450 px)</label>
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
            value={extraSettings.altText || ''} 
            placeholder="Describe the background graphic scene clearly for search optimization indexing..." 
            onChange={e => updateSetting('altText', e.target.value)} 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-emerald-700 focus:outline-none focus:border-orange-500" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Overlay Card Theme</label>
            <select 
              value={extraSettings.boxTheme || 'dark'} 
              onChange={e => updateSetting('boxTheme', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
            >
              <option value="dark">Dark Theme Box</option>
              <option value="light">Light Theme Box</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Card Alignment (Desktop)</label>
            <select 
              value={extraSettings.boxPosition || 'right'} 
              onChange={e => updateSetting('boxPosition', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
            >
              <option value="left">Left Side</option>
              <option value="center">Center Block</option>
              <option value="right">Right Side</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Overlay Main Headline</label>
            <input 
              type="text" 
              value={data.title || ''} 
              placeholder="HOW TO CHOOSE THE RIGHT ITEM..." 
              onChange={e => updateModule(data.id, { title: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Overlay Informational Body Text</label>
            <textarea 
              value={data.description || ''} 
              placeholder="Provide deep layout insights or variant definitions..." 
              onChange={e => updateModule(data.id, { description: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 h-16 resize-none focus:outline-none focus:border-orange-500" 
            />
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="w-full bg-white font-sans flex flex-col">
        <div className="w-full aspect-[600/450] overflow-hidden">
          <img 
            src={activeImage} 
            alt={extraSettings.altText || 'Product feature representation banner graphic.'} 
            className="w-full h-full object-cover block" 
          />
        </div>
        {(data.title || data.description) && (
          <div className={`p-5 text-left border-t border-b border-slate-100 w-full flex flex-col break-words ${
            extraSettings.boxTheme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'
          }`}>
            {data.title && (
              <h3 className="text-sm font-extrabold tracking-tight uppercase mb-1.5 whitespace-normal" style={{ color: extraSettings.boxTheme === 'light' ? (styles.primaryColor || '#ea580c') : '#ffffff' }}>
                {data.title}
              </h3>
            )}
            {data.description && (
              <p className="text-xs leading-relaxed opacity-90 whitespace-normal break-words">{data.description}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full relative flex items-center overflow-hidden aspect-[1464/600] bg-slate-100 font-sans group">
      <img 
        src={activeImage} 
        alt={extraSettings.altText || 'Product feature representation banner graphic.'} 
        className="absolute inset-0 w-full h-full object-cover block" 
      />
      
      {(data.title || data.description) && (
        <div className={`absolute inset-0 flex items-center p-8 z-10 w-full ${positionClasses}`}>
          {/* Locked fixed width at 450px and set height parameters to automatically force text down sequentially */}
          <div className={`p-6 w-[450px] min-h-[220px] h-auto text-left rounded-xs flex flex-col justify-center break-words overflow-hidden ${themeClasses}`}>
            {data.title && (
              <h3 className="text-base font-black tracking-normal uppercase mb-2 leading-tight whitespace-normal">
                {data.title}
              </h3>
            )}
            {data.description && (
              <p className="text-xs leading-relaxed font-medium opacity-90 whitespace-normal break-words">
                {data.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}