import React from 'react';

export default function FourImageTextModule({ data, updateModule, styles, mode }) {
  const isMobile = mode === 'mobile';
  
  const defaultItems = [
    { 
      img: 'https://placehold.co/300x225', 
      text: 'Feature 1 Title', 
      desc: 'Short description text explaining feature item one details.',
      altText: 'Detailed close-up view highlighting the premium build and materials of feature item one.' 
    },
    { 
      img: 'https://placehold.co/300x225', 
      text: 'Feature 2 Title', 
      desc: 'Short description text explaining feature item two details.',
      altText: 'Detailed close-up view highlighting the premium build and materials of feature item two.' 
    },
    { 
      img: 'https://placehold.co/300x225', 
      text: 'Feature 3 Title', 
      desc: 'Short description text explaining feature item three details.',
      altText: 'Detailed close-up view highlighting the premium build and materials of feature item three.' 
    },
    { 
      img: 'https://placehold.co/300x225', 
      text: 'Feature 4 Title', 
      desc: 'Short description text explaining feature item four details.',
      altText: 'Detailed close-up view highlighting the premium build and materials of feature item four.' 
    }
  ];

  const moduleState = data.extraData || {
    title: 'Core Product Features',
    description: 'Explore the architectural advantages and engineered highlights designed specifically to optimize your day-to-day workflow.',
    items: defaultItems
  };

  const safeTitle = moduleState.title || '';
  const safeDescription = moduleState.description || '';
  const safeItems = moduleState.items || defaultItems;

  const updateStateField = (key, value) => {
    updateModule(data.id, { extraData: { ...moduleState, [key]: value } });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...safeItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    updateStateField('items', updatedItems);
  };

  if (mode === 'editor') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 text-slate-800 font-sans">
        <div className="space-y-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider">4-Image Grid Setup</h4>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Grid Headline</label>
              <input 
                type="text" 
                value={safeTitle} 
                onChange={e => updateStateField('title', e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-semibold" 
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Section Description</label>
              <textarea 
                value={safeDescription} 
                onChange={e => updateStateField('description', e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 h-16 resize-none focus:outline-none focus:border-orange-500" 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {safeItems.map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] text-blue-600 font-bold block">Grid Item #{idx + 1}</span>
              
              <input 
                type="text" 
                value={item.img} 
                placeholder="Image URL" 
                onChange={e => handleItemChange(idx, 'img', e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-mono focus:outline-none" 
              />
              
              <input 
                type="text" 
                value={item.altText || ''} 
                placeholder="Image Alt Text (SEO ~80 chars)" 
                onChange={e => handleItemChange(idx, 'altText', e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-emerald-700 focus:outline-none" 
              />
              
              <input 
                type="text" 
                value={item.text} 
                placeholder="Item Title" 
                onChange={e => handleItemChange(idx, 'text', e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-900 font-bold focus:outline-none" 
              />

              <textarea 
                value={item.desc || ''} 
                placeholder="Item Short Description" 
                onChange={e => handleItemChange(idx, 'desc', e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-600 h-12 resize-none focus:outline-none" 
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white w-full font-sans border border-slate-100 rounded-2xl shadow-xs">
      {safeTitle && (
        <h2 className="text-center font-bold text-xl tracking-wide text-slate-800 mb-2">{safeTitle}</h2>
      )}
      {safeDescription && (
        <p className="text-center text-xs text-slate-600 max-w-2xl mx-auto mb-6 leading-relaxed px-4">{safeDescription}</p>
      )}
      
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {safeItems.map((item, idx) => (
          <div key={idx} className="bg-transparent flex flex-col justify-between items-center text-center space-y-3 group">
            
            {/* Image container with outer background removed, and hover scale/zoom active */}
            <div className="w-full bg-transparent overflow-hidden flex items-center justify-center rounded-lg">
              <img 
                src={item.img} 
                alt={item.altText || `Product grid visualization feature illustration number ${idx + 1}.`} 
                className="w-full h-auto object-contain max-h-[180px] transform transition-transform duration-300 ease-in-out group-hover:scale-105" 
              />
            </div>
            
            <div className="w-full space-y-1">
              <span className="text-xs block font-bold text-slate-900 tracking-tight leading-tight w-full px-1 truncate">
                {item.text}
              </span>
              {item.desc && (
                <p className="text-[11px] text-slate-500 leading-tight px-1 line-clamp-3">
                  {item.desc}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}