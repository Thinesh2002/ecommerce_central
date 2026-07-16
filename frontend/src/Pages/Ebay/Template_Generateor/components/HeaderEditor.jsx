import React from 'react';

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
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
      <h3 className="text-md font-bold text-orange-400 uppercase tracking-wider">1. Store Navigation Header Setup</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Store Brand Name</label>
          <input 
            type="text" 
            value={headerData.storeName} 
            onChange={e => setHeaderData({...headerData, storeName: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Store Landing URL</label>
          <input 
            type="text" 
            value={headerData.storeLink} 
            onChange={e => setHeaderData({...headerData, storeLink: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-400">Shop Deep-Links Configuration</span>
          <button onClick={addLink} className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded-md transition">
            + Add Navigation Link
          </button>
        </div>
        
        {headerData.shopLinks.map((link) => (
          <div key={link.id} className="flex items-center space-x-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
            <input 
              type="text" 
              value={link.label} 
              placeholder="Label"
              onChange={e => updateLink(link.id, 'label', e.target.value)}
              className="w-1/3 bg-gray-800 border border-gray-600 rounded p-1 text-xs text-white"
            />
            <input 
              type="text" 
              value={link.url} 
              placeholder="Destination URL"
              onChange={e => updateLink(link.id, 'url', e.target.value)}
              className="w-2/3 bg-gray-800 border border-gray-600 rounded p-1 text-xs text-white"
            />
            <button onClick={() => removeLink(link.id)} className="text-red-400 hover:text-red-500 text-xs px-2 font-mono">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}