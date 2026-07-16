import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ModulePickerModal from './ModulePickerModal';

export default function AddModuleButton({ onAdd, disabled }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group relative flex items-center justify-center py-3">
      <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200 group-hover:bg-slate-300" />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        title={disabled ? 'Maximum of 7 modules reached' : 'Add a module here'}
        className="relative z-10 flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={13} />
        Add Module
      </button>

      {open && (
        <ModulePickerModal
          onClose={() => setOpen(false)}
          onSelect={(type) => {
            onAdd(type);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
