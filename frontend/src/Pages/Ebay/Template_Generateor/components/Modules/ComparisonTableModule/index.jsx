import React, { useState } from 'react';
import EditableImage from '../../EditableImage';

export default function ComparisonTableModule({ data, updateModule, styles, mode }) {
  const isMobile = mode === 'mobile';
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState(0);

  const currencies = [
    { symbol: '$', label: 'USD ($)' },
    { symbol: '£', label: 'GBP (£)' },
    { symbol: '€', label: 'EUR (€)' },
    { symbol: '₹', label: 'INR (₹)' }
  ];

  const tableState = data.extraData || {
    title: "Product Comparison",
    currency: "$",
    headers: ['Features', 'Our Product', 'Competitor A', 'Competitor B', 'Competitor C'],
    images: [
      'https://placehold.co/300 rounded?text=Our+Product',
      'https://placehold.co/300 rounded?text=Comp+A',
      'https://placehold.co/300 rounded?text=Comp+B',
      'https://placehold.co/300 rounded?text=Comp+C'
    ],
    altTexts: [
      'Product display image highlighting detailed features for Our Product.',
      'Product display image highlighting detailed features for Competitor A.',
      'Product display image highlighting detailed features for Competitor B.',
      'Product display image highlighting detailed features for Competitor C.'
    ],
    cartLinks: ['#', '#', '#', '#'],
    rows: [
      ['Price', '39.99', '44.99', '11.00', '49.99'],
      ['Quality', '✓', '✕', '✕', '✕'],
      ['Material', '✓', '✕', '✓', '✕'],
      ['Warranty', '✓', '✓', '✓', '✓']
    ]
  };

  const safeTitle = tableState.title || "Compare Our Products";
  const safeCurrency = tableState.currency || "$";
  const safeHeaders = tableState.headers || ['Features'];
  const safeImages = tableState.images || [];
  const safeAltTexts = tableState.altTexts || [];
  const safeCartLinks = tableState.cartLinks || [];
  const safeRows = tableState.rows || [];

  const updateStateField = (key, value) => {
    updateModule(data.id, { extraData: { ...tableState, [key]: value } });
  };

  const addProductColumn = () => {
    if (safeHeaders.length >= 8) {
      alert("Maximum 7 products allowed!");
      return;
    }
    const colNumber = safeHeaders.length;
    const nextHeaders = [...safeHeaders, `Product ${colNumber}`];
    const nextImages = [...safeImages, `https://placehold.co/300 rounded?text=Product+${colNumber}`];
    const nextAltTexts = [...safeAltTexts, `Product display image highlighting detailed features for Product ${colNumber}.`];
    const nextCartLinks = [...safeCartLinks, '#'];
    const nextRows = safeRows.map(row => [...row, '—']);

    updateModule(data.id, {
      extraData: { 
        ...tableState, 
        headers: nextHeaders, 
        images: nextImages, 
        altTexts: nextAltTexts, 
        cartLinks: nextCartLinks, 
        rows: nextRows 
      }
    });
  };

  const removeProductColumn = (colIdx) => {
    if (safeHeaders.length <= 2) return;
    const nextHeaders = safeHeaders.filter((_, idx) => idx !== colIdx);
    const nextImages = safeImages.filter((_, idx) => idx !== (colIdx - 1));
    const nextAltTexts = safeAltTexts.filter((_, idx) => idx !== (colIdx - 1));
    const nextCartLinks = safeCartLinks.filter((_, idx) => idx !== (colIdx - 1));
    const nextRows = safeRows.map(row => row.filter((_, idx) => idx !== colIdx));

    updateModule(data.id, {
      extraData: { 
        ...tableState, 
        headers: nextHeaders, 
        images: nextImages, 
        altTexts: nextAltTexts, 
        cartLinks: nextCartLinks, 
        rows: nextRows 
      }
    });
  };

  const addFeatureRow = () => {
    if (safeRows.length >= 7) {
      alert("Maximum 7 features allowed!");
      return;
    }
    const blankRow = ['New Feature', ...Array(safeHeaders.length - 1).fill('—')];
    updateStateField('rows', [...safeRows, blankRow]);
  };

  const removeFeatureRow = (rowIndex) => {
    updateStateField('rows', safeRows.filter((_, idx) => idx !== rowIndex));
    if (selectedFeatureIdx >= safeRows.length - 1 && selectedFeatureIdx > 0) {
      setSelectedFeatureIdx(safeRows.length - 2);
    }
  };

  const handleCellUpdate = (rowIdx, cellIdx, value) => {
    const freshRows = safeRows.map((row, rIdx) =>
      rIdx === rowIdx ? row.map((cell, cIdx) => cIdx === cellIdx ? value : cell) : row
    );
    updateStateField('rows', freshRows);
  };

  const renderCellBadge = (val, isPriceRow) => {
    const clean = val.trim();
    if (isPriceRow) return <span className="font-mono text-slate-900 font-bold text-sm">{safeCurrency}{clean}</span>;
    if (clean === '✓' || clean.toLowerCase() === 'yes') return <span className="text-emerald-600 font-black text-base">✓</span>;
    if (clean === '✕' || clean.toLowerCase() === 'no') return <span className="text-rose-500 font-black text-sm">✕</span>;
    return <span className="text-slate-600 font-medium text-xs">{val}</span>;
  };

  if (mode === 'editor') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 text-slate-800 font-sans">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider">Comparison Table Setup</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Products: {safeHeaders.length - 1}/7 | Features: {safeRows.length}/7</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={addProductColumn} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs transition">
              + Add Product
            </button>
            <button onClick={addFeatureRow} className="bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs transition">
              + Add Feature
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Table Title</label>
          <input type="text" value={safeTitle} onChange={e => updateStateField('title', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500" />
        </div>

        <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="block text-[10px] text-slate-500 uppercase font-bold">Currency</label>
          <select value={safeCurrency} onChange={e => updateStateField('currency', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none">
            {currencies.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
          </select>
        </div>

        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-700 block uppercase">Products List</span>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {safeHeaders.slice(1).map((header, index) => {
              const actualIdx = index + 1;
              return (
                <div key={actualIdx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600">Product #{index + 1}</span>
                    <button onClick={() => removeProductColumn(actualIdx)} className="text-[10px] text-rose-600 hover:underline">Delete</button>
                  </div>
                  <input type="text" value={header} onChange={e => {
                    const next = [...safeHeaders]; next[actualIdx] = e.target.value; updateStateField('headers', next);
                  }} className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 p-1.5 rounded font-bold focus:outline-none focus:border-blue-500" />

                  <div className="flex gap-2">
                    <EditableImage
                      src={safeImages[index]}
                      alt={safeAltTexts[index]}
                      onChange={(v) => {
                        const next = [...safeImages]; next[index] = v; updateStateField('images', next);
                      }}
                      className="w-16 shrink-0"
                      imgClassName="h-16 w-16 rounded object-cover"
                    />
                    <div className="flex-1 space-y-1.5">
                      <input type="text" value={safeImages[index] || ''} onChange={e => {
                        const next = [...safeImages]; next[index] = e.target.value; updateStateField('images', next);
                      }} className="w-full bg-slate-50 border border-slate-200 text-[10px] text-slate-600 p-1.5 rounded focus:outline-none" placeholder="Image URL" />

                      <input type="text" value={safeAltTexts[index] || ''} onChange={e => {
                        const next = [...safeAltTexts]; next[index] = e.target.value; updateStateField('altTexts', next);
                      }} className="w-full bg-slate-50 border border-slate-200 text-[10px] text-emerald-700 p-1.5 rounded focus:outline-none" placeholder="Image Alt Text (SEO ~80 chars)" />

                      <input type="text" value={safeCartLinks[index] || ''} onChange={e => {
                        const next = [...safeCartLinks]; next[index] = e.target.value; updateStateField('cartLinks', next);
                      }} className="w-full bg-slate-50 border border-slate-200 text-[10px] text-amber-600 p-1.5 rounded focus:outline-none" placeholder="Buy Now Link" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block uppercase">Data Values</span>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {safeRows.map((row, rIdx) => (
              <div key={rIdx} className="flex items-start space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-grow">
                  {row.map((cell, cIdx) => (
                    <input key={cIdx} type="text" value={cell} onChange={e => handleCellUpdate(rIdx, cIdx, e.target.value)} className="w-full bg-white border border-slate-200 text-[11px] text-slate-800 p-1 rounded first:font-bold text-center first:text-left focus:outline-none focus:border-orange-500" />
                  ))}
                </div>
                <button onClick={() => removeFeatureRow(rIdx)} className="text-rose-600 hover:text-rose-700 text-xs font-mono pt-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="p-4 w-full bg-white text-slate-900 rounded-3xl shadow-md font-sans border border-slate-100">
        <h2 className="text-center font-bold text-base text-slate-800 tracking-normal mb-4">{safeTitle}</h2>
        
        <div className="mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 border-opacity-60">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Choose Feature to Compare:</label>
          <select
            value={selectedFeatureIdx}
            onChange={(e) => setSelectedFeatureIdx(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 transition-all shadow-xs"
          >
            {safeRows.map((row, idx) => (
              <option key={idx} value={idx}>
                {row[0] || `Feature ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-50 bg-opacity-60 border border-slate-100 rounded-2xl p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {safeHeaders.slice(1).map((header, index) => {
              const cellValue = safeRows[selectedFeatureIdx]?.[index + 1] || '—';
              return (
                <div key={index} className="bg-white border border-slate-100 p-3 rounded-xl shadow-xs flex flex-col items-center text-center justify-between space-y-2">
                  
                  <div className="h-32 w-28 bg-slate-50 border border-slate-100 p-2 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={safeImages[index]} 
                      alt={safeAltTexts[index] || `Product display image highlighting features for ${header}.`} 
                      className="max-h-full max-w-full object-contain block mix-blend-multiply" 
                    />
                  </div>

                  <div className="space-y-0.5 w-full">
                    <span className="text-[11px] font-bold text-slate-900 truncate block px-1">{header}</span>
                    <div className="bg-slate-50 py-1 px-2 rounded-md font-mono text-xs font-black mt-1">
                      {renderCellBadge(cellValue, selectedFeatureIdx === 0)}
                    </div>
                  </div>

                  <a href={safeCartLinks[index] || '#'} className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-1 rounded-full text-[10px] border border-amber-500 block text-center transition-all shadow-xs">
                    Buy Now
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full bg-white text-slate-900 rounded-2xl shadow-xs border border-slate-100 overflow-x-auto font-sans">
      <h2 className="text-center font-bold text-xl tracking-wide text-slate-800 mb-6">{safeTitle}</h2>
      
      <table className="w-full table-fixed border-collapse text-xs" style={{ minWidth: `${Math.max(700, safeHeaders.length * 150)}px` }}>
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="p-3 font-bold text-slate-400 text-left align-bottom uppercase text-[10px] w-[18%]">
              {safeHeaders[0]}
            </th>
            
            {safeHeaders.slice(1).map((header, idx) => (
              <th key={idx} className="p-4 text-center align-bottom border-l border-slate-100">
                <div className="flex flex-col items-center justify-end space-y-3 h-full">
                  
                  <div className="h-36 w-32 flex items-center justify-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl overflow-hidden shadow-xs bg-blend-multiply">
                    <img 
                      src={safeImages[idx]} 
                      alt={safeAltTexts[idx] || `Product catalog layout showcasing aesthetics of ${header}.`} 
                      className="max-h-full max-w-full object-contain block transition-transform duration-200 hover:scale-105 mix-blend-multiply"
                    />
                  </div>
                  
                  <span className={`font-bold text-xs block mt-2 leading-snug px-1 truncate w-full ${idx === 0 ? 'text-slate-900 font-extrabold' : 'text-blue-600'}`}>
                    {header}
                  </span>
                  
                  <a href={safeCartLinks[idx] || '#'} onClick={e => e.preventDefault()} className="inline-block w-full max-w-[120px] bg-amber-400 hover:bg-amber-500 text-black font-bold py-1.5 px-3 rounded-full text-[10px] border border-amber-500 text-center mt-1 transition-all shadow-xs">
                    Buy Now
                  </a>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-100">
          {safeRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
              <td className="p-3.5 font-bold text-slate-600 text-left bg-slate-50/40 border-r border-slate-100">{row[0]}</td>
              {row.slice(1).map((cell, cIdx) => (
                <td key={cIdx} className="p-3.5 text-center border-l border-slate-100">
                  {renderCellBadge(cell, rIdx === 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}