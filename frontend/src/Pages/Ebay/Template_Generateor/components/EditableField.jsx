import React from 'react';

// Click-to-edit text that visually blends into the design until focused.
export function EditableText({ value, onChange, placeholder, as = 'input', className = '', style }) {
  const shared =
    `bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-400 ` +
    `focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 rounded px-1 -mx-1 ` +
    `transition-colors cursor-text w-full ${className}`;

  if (as === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={style}
        className={`${shared} resize-none`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
      className={shared}
    />
  );
}
