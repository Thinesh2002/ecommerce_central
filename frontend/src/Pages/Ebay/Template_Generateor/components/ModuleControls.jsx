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
    <div className="rounded-sm border border-[#D5D9D9] bg-white p-5 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Modules</h3>
          <span className="text-[10px] rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-500">
            {modules.length} / 7 Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEFAULTS.map(item => (
            <button
              key={item.type}
              onClick={() => addModule(item.type)}
              disabled={modules.length >= 7}
              className="rounded-sm border border-slate-200 bg-slate-50 p-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
            >
              + {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((m, idx) => (
          <div key={m.id} className="relative space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-4">

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                M#{idx + 1} : {m.type.toUpperCase()}
              </span>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => moveModule(idx, 'up')}
                  disabled={idx === 0}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 shadow-xs disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveModule(idx, 'down')}
                  disabled={idx === modules.length - 1}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 shadow-xs disabled:opacity-30"
                >
                  ▼
                </button>
                <button
                  onClick={() => removeModule(m.id)}
                  className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
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
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-0.5">PC Image CDN URL</label>
                    <input
                      type="text"
                      value={m.pcImage || ''}
                      onChange={e => updateModule(m.id, { pcImage: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-0.5">Mobile Image CDN URL</label>
                    <input
                      type="text"
                      value={m.mobileImage || ''}
                      onChange={e => updateModule(m.id, { mobileImage: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-0.5">Image Alt Text (SEO ~80 chars)</label>
                  <input
                    type="text"
                    value={m.altText || ''}
                    placeholder="Product catalog image showcasing layout aesthetics and features..."
                    onChange={e => updateModule(m.id, { altText: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                {/* Text fields are only rendered if the module is NOT a hero banner layout */}
                {m.type !== 'hero' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-0.5">Section Headline & Content Info</label>
                    <input
                      type="text"
                      value={m.title || ''}
                      placeholder="Headline Content Title"
                      onChange={e => updateModule(m.id, { title: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <textarea
                      value={m.description || ''}
                      placeholder="Body Text Specification Content"
                      onChange={e => updateModule(m.id, { description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 h-14 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">FAQ Section</h4>
          <button
            onClick={() => setFaqs([...faqs, { id: Date.now().toString(), question: 'New Question?', answer: 'New Answer content.' }])}
            className="text-[11px] bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md shadow-xs font-semibold transition"
          >
            + Add FAQ
          </button>
        </div>
        <div className="space-y-2 max-h-50 overflow-y-auto pr-1">
          {faqs.map(f => (
            <div key={f.id} className="p-2.5 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
              <input
                type="text"
                value={f.question}
                onChange={e => setFaqs(faqs.map(x => x.id === f.id ? {...x, question: e.target.value} : x))}
                className="w-full bg-white text-xs p-1.5 text-slate-900 rounded border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Question"
              />
              <input
                type="text"
                value={f.answer}
                onChange={e => setFaqs(faqs.map(x => x.id === f.id ? {...x, answer: e.target.value} : x))}
                className="w-full bg-white text-xs p-1.5 text-slate-600 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Answer Description"
              />
              <button
                onClick={() => setFaqs(faqs.filter(x => x.id !== f.id))}
                className="text-[10px] text-red-600 hover:underline block text-right w-full font-bold"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}