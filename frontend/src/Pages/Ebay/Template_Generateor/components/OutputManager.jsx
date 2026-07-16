import React, { useState } from 'react';
import { Copy, Download, RotateCcw, Check } from 'lucide-react';
import generateHtml from '../utils/generateHtml';

export default function OutputManager({ styles = {}, headerData = {}, modules = [], faqs = [] }) {
  const [copied, setCopied] = useState(false);
  const generated = generateHtml({ styles, headerData, modules, faqs });

  // null means "not hand-edited" - always mirrors the generated HTML. Once the user
  // types in the textarea, their edits are kept as-is (not silently overwritten by
  // further module/style changes) until they explicitly regenerate.
  const [customHtml, setCustomHtml] = useState(null);
  const html = customHtml ?? generated;
  const isEdited = customHtml !== null && customHtml !== generated;

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amazon-premium-aplus-template.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-sm border border-[#D5D9D9] bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Compiled HTML</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            This is the exact markup shown in the Editor/PC/Mobile previews. Edit it directly if you need to hand-tweak anything.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isEdited && (
            <button
              onClick={() => setCustomHtml(null)}
              className="flex items-center gap-1.5 rounded-sm border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              title="Discard edits and regenerate from the editor state"
            >
              <RotateCcw size={13} />
              Regenerate
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-sm border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Download size={13} />
            Download .html
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-sm bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </button>
        </div>
      </div>

      {isEdited && (
        <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          You're viewing hand-edited HTML — further changes made in the Editor tab won't appear here until you click Regenerate.
        </div>
      )}

      <textarea
        value={html}
        onChange={(e) => setCustomHtml(e.target.value)}
        spellCheck={false}
        className="h-130 w-full resize-none rounded-sm border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
    </div>
  );
}
