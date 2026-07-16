import React from 'react';
import { Plus, X } from 'lucide-react';

export default function HeaderEditor({ headerData, setHeaderData }) {
  const addLink = () => {
    setHeaderData({
      ...headerData,
      shopLinks: [...headerData.shopLinks, { id: Date.now().toString(), label: 'New Link', url: '#' }]
    });
  };

  const removeLink = (id) => {
    setHeaderData({
      ...headerData,
      shopLinks: headerData.shopLinks.filter(l => l.id !== id)
    });
  };

  const updateLink = (id, key, val) => {
    setHeaderData({
      ...headerData,
      shopLinks: headerData.shopLinks.map(l => l.id === id ? { ...l, [key]: val } : l)
    });
  };

  return (
    <div className="rounded-sm border border-[#D5D9D9] bg-white p-5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Store Header</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Store Brand Name</label>
          <input
            type="text"
            value={headerData.storeName}
            onChange={e => setHeaderData({ ...headerData, storeName: e.target.value })}
            className="w-full rounded-sm border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Store Landing URL</label>
          <input
            type="text"
            value={headerData.storeLink}
            onChange={e => setHeaderData({ ...headerData, storeLink: e.target.value })}
            className="w-full rounded-sm border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Shop Navigation Links</span>
          <button
            onClick={addLink}
            className="flex items-center gap-1 rounded-sm border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Plus size={12} />
            Add Link
          </button>
        </div>

        {headerData.shopLinks.map((link) => (
          <div key={link.id} className="flex items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 p-2">
            <input
              type="text"
              value={link.label}
              placeholder="Label"
              onChange={e => updateLink(link.id, 'label', e.target.value)}
              className="w-1/3 rounded-sm border border-slate-200 bg-white p-1.5 text-xs text-slate-800"
            />
            <input
              type="text"
              value={link.url}
              placeholder="Destination URL"
              onChange={e => updateLink(link.id, 'url', e.target.value)}
              className="w-2/3 rounded-sm border border-slate-200 bg-white p-1.5 text-xs text-slate-800"
            />
            <button onClick={() => removeLink(link.id)} className="shrink-0 p-1 text-slate-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
