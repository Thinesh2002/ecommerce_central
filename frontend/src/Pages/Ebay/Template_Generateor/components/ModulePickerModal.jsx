import React from 'react';
import { X } from 'lucide-react';

// Self-contained SVG thumbnails (no external image host dependency) sketching each
// module's layout shape, so the picker always renders correctly regardless of network.
function thumb(shapes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160">
    <rect width="300" height="160" fill="#f1f5f9"/>${shapes}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MODULE_TYPES = [
  {
    type: 'hero',
    label: 'Hero Banner',
    demo: thumb(`<rect x="16" y="16" width="268" height="128" rx="6" fill="#94a3b8"/>`),
  },
  {
    type: 'bgText',
    label: 'Background + Text',
    demo: thumb(`<rect x="16" y="16" width="268" height="128" rx="6" fill="#64748b"/>
      <rect x="170" y="55" width="100" height="50" rx="4" fill="#0f172a" fill-opacity="0.75"/>`),
  },
  {
    type: 'singleImage',
    label: 'Single Image + Text',
    demo: thumb(`<rect x="16" y="16" width="120" height="128" rx="6" fill="#94a3b8"/>
      <rect x="152" y="40" width="132" height="14" rx="3" fill="#334155"/>
      <rect x="152" y="64" width="132" height="8" rx="3" fill="#cbd5e1"/>
      <rect x="152" y="80" width="100" height="8" rx="3" fill="#cbd5e1"/>`),
  },
  {
    type: 'dualImage',
    label: 'Dual Images + Text',
    demo: thumb(`<rect x="16" y="16" width="128" height="90" rx="6" fill="#94a3b8"/>
      <rect x="156" y="16" width="128" height="90" rx="6" fill="#94a3b8"/>
      <rect x="16" y="114" width="128" height="8" rx="3" fill="#cbd5e1"/>
      <rect x="156" y="114" width="128" height="8" rx="3" fill="#cbd5e1"/>`),
  },
  {
    type: 'fourImage',
    label: 'Four Images + Text',
    demo: thumb(
      [0, 1, 2, 3]
        .map((i) => `<rect x="${16 + i * 68}" y="16" width="60" height="90" rx="5" fill="#94a3b8"/>`)
        .join('') + `<rect x="16" y="118" width="268" height="8" rx="3" fill="#cbd5e1"/>`
    ),
  },
  {
    type: 'table',
    label: 'Comparison Table',
    demo: thumb(`<rect x="16" y="16" width="268" height="20" rx="3" fill="#334155"/>
      <rect x="16" y="44" width="86" height="90" rx="4" fill="#e2e8f0"/>
      <rect x="107" y="44" width="86" height="90" rx="4" fill="#e2e8f0"/>
      <rect x="198" y="44" width="86" height="90" rx="4" fill="#e2e8f0"/>`),
  },
  {
    type: 'faq',
    label: 'FAQ Section',
    demo: thumb(`<rect x="16" y="16" width="268" height="30" rx="4" fill="#cbd5e1"/>
      <rect x="16" y="56" width="268" height="30" rx="4" fill="#e2e8f0"/>
      <rect x="16" y="96" width="268" height="30" rx="4" fill="#e2e8f0"/>`),
  },
];

export default function ModulePickerModal({ onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-sm border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Add a Module</h3>
            <p className="text-xs text-slate-500">Pick a layout to insert here.</p>
          </div>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODULE_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => onSelect(item.type)}
              className="group cursor-pointer overflow-hidden rounded-sm border border-slate-200 text-left transition hover:border-slate-400 hover:shadow-sm"
            >
              <img src={item.demo} alt={item.label} className="h-24 w-full object-cover" />
              <div className="px-2.5 py-2 text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                + {item.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
