import React from 'react';
import ComparisonTableModule from './Modules/ComparisonTableModule';
import FourImageTextModule from './Modules/FourImageTextModule';
import DualImageTextModule from './Modules/DualImageTextModule';

const DEFAULTS = [
  { type: 'hero', label: 'Hero Banner' },
  { type: 'bgText', label: 'Background Image With Text' },
  { type: 'singleImage', label: 'Single Image + Text' },
  { type: 'dualImage', label: 'Dual Images + Text' },
  { type: 'fourImage', label: 'Four Images + Text' },
  { type: 'table', label: 'Comparison Table' }
];

export default function ModuleControls({ modules, addModule, removeModule, moveModule, updateModule, faqs, setFaqs }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6 font-sans">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">3. Module Composition Engine</h3>
          <span className="text-[10px] bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 font-semibold">
            {modules.length} / 7 Active Modules
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEFAULTS.map(item => (
            <button
              key={item.type}
              onClick={() => addModule(item.type)}
              disabled={modules.length >= 7}
              className="bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-left p-2.5 text-xs rounded-xl border border-gray-200 text-gray-700 font-semibold transition duration-150"
            >
              + {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((m, idx) => (
          <div key={m.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 relative">
            
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                M#{idx + 1} : {m.type.toUpperCase()}
              </span>
              <div className="flex space-x-1.5">
                <button 
                  onClick={() => moveModule(idx, 'up')} 
                  disabled={idx === 0} 
                  className="text-xs bg-white hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-700 shadow-xs disabled:opacity-30"
                >
                  ▲
                </button>
                <button 
                  onClick={() => moveModule(idx, 'down')} 
                  disabled={idx === modules.length - 1} 
                  className="text-xs bg-white hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-700 shadow-xs disabled:opacity-30"
                >
                  ▼
                </button>
                <button 
                  onClick={() => removeModule(m.id)} 
                  className="text-xs bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-2 py-0.5 rounded font-semibold transition"
                >
                  Remove
                </button>
              </div>
            </div>

            {m.type === 'table' ? (
              <div className="pt-1">
                <ComparisonTableModule 
                  data={m} 
                  updateModule={updateModule} 
                  styles={{}} 
                  mode="editor" 
                />
              </div>
            ) : m.type === 'fourImage' ? (
              <div className="pt-1">
                <FourImageTextModule 
                  data={m} 
                  updateModule={updateModule} 
                  styles={{}} 
                  mode="editor" 
                />
              </div>
            ) : m.type === 'dualImage' ? (
              <div className="pt-1">
                <DualImageTextModule 
                  data={m} 
                  updateModule={updateModule} 
                  styles={{}} 
                  mode="editor" 
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">PC Image CDN URL</label>
                    <input 
                      type="text" 
                      value={m.pcImage || ''} 
                      onChange={e => updateModule(m.id, { pcImage: e.target.value })} 
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Mobile Image CDN URL</label>
                    <input 
                      type="text" 
                      value={m.mobileImage || ''} 
                      onChange={e => updateModule(m.id, { mobileImage: e.target.value })} 
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Image Alt Text (SEO ~80 chars)</label>
                  <input 
                    type="text" 
                    value={m.altText || ''} 
                    placeholder="Product catalog image showcasing layout aesthetics and features..." 
                    onChange={e => updateModule(m.id, { altText: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500" 
                  />
                </div>

                {/* Text fields are only rendered if the module is NOT a hero banner layout */}
                {m.type !== 'hero' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Section Headline & Content Info</label>
                    <input 
                      type="text" 
                      value={m.title || ''} 
                      placeholder="Headline Content Title" 
                      onChange={e => updateModule(m.id, { title: e.target.value })} 
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-orange-500" 
                    />
                    <textarea 
                      value={m.description || ''} 
                      placeholder="Body Text Specification Content" 
                      onChange={e => updateModule(m.id, { description: e.target.value })} 
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-700 h-14 resize-none focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">FAQ Core Module Section</h4>
          <button 
            onClick={() => setFaqs([...faqs, { id: Date.now().toString(), question: 'New Question?', answer: 'New Answer content.' }])} 
            className="text-[11px] bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-md shadow-xs font-semibold transition"
          >
            + Add FAQ Node
          </button>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {faqs.map(f => (
            <div key={f.id} className="p-2.5 bg-gray-50 rounded-lg space-y-1.5 border border-gray-200">
              <input 
                type="text" 
                value={f.question} 
                onChange={e => setFaqs(faqs.map(x => x.id === f.id ? {...x, question: e.target.value} : x))} 
                className="w-full bg-white text-xs p-1.5 text-gray-900 rounded border border-gray-200 font-semibold focus:outline-none focus:border-orange-500" 
                placeholder="Question" 
              />
              <input 
                type="text" 
                value={f.answer} 
                onChange={e => setFaqs(faqs.map(x => x.id === f.id ? {...x, answer: e.target.value} : x))} 
                className="w-full bg-white text-xs p-1.5 text-gray-600 rounded border border-gray-200 focus:outline-none focus:border-orange-500" 
                placeholder="Answer Description" 
              />
              <button 
                onClick={() => setFaqs(faqs.filter(x => x.id !== f.id))} 
                className="text-[10px] text-rose-600 hover:underline block text-right w-full font-bold"
              >
                Delete Node
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}