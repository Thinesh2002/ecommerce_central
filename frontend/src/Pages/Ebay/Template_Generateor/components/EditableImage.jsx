import React, { useState } from 'react';
import { ImagePlus } from 'lucide-react';

// Image with a hover "Change" control that reveals a URL field - click the image
// itself to swap it out, no separate form panel needed.
export default function EditableImage({ src, alt, onChange, className = '', imgClassName = '', style }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={`relative group ${className}`} style={style}>
      <img src={src} alt={alt} className={imgClassName} />
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="absolute top-2 right-2 z-10 flex cursor-pointer items-center gap-1 rounded-sm bg-black/60 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ImagePlus size={12} />
        Change
      </button>
      {editing && (
        <div className="absolute top-9 right-2 z-20 w-64 rounded-sm border border-slate-200 bg-white p-2 shadow-lg">
          <input
            autoFocus
            type="text"
            value={src || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            placeholder="Image URL"
            className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      )}
    </div>
  );
}
