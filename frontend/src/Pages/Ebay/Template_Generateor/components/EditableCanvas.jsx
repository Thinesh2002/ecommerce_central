import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus, X, Palette } from 'lucide-react';
import { EditableText } from './EditableField';
import EditableImage from './EditableImage';
import AddModuleButton from './AddModuleButton';
import ComparisonTableModule from './Modules/ComparisonTableModule';
import DualImageTextModule from './Modules/DualImageTextModule';
import FourImageTextModule from './Modules/FourImageTextModule';

function LabeledMini({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="text"
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-sm border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
    </label>
  );
}

function ModuleShell({ label, idx, total, onMoveUp, onMoveDown, onRemove, children }) {
  return (
    <div className="group/shell relative rounded-sm border border-slate-200 bg-white">
      <div className="absolute -top-3 right-3 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/shell:opacity-100">
        <span className="rounded-sm border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 shadow-sm">
          {label}
        </span>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={idx === 0}
          className="cursor-pointer rounded-sm border border-slate-200 bg-white p-1 text-slate-500 shadow-sm hover:text-slate-900 disabled:opacity-30"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={idx === total - 1}
          className="cursor-pointer rounded-sm border border-slate-200 bg-white p-1 text-slate-500 shadow-sm hover:text-slate-900 disabled:opacity-30"
        >
          <ChevronDown size={12} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer rounded-sm border border-red-200 bg-white p-1 text-red-500 shadow-sm hover:bg-red-50"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {children}
    </div>
  );
}

function HeroBlock({ m, update }) {
  return (
    <div className="space-y-2 p-3">
      <EditableImage
        src={m.pcImage}
        alt={m.altText}
        onChange={(v) => update({ pcImage: v })}
        imgClassName="aspect-[1464/600] w-full rounded-sm object-cover"
      />
      <div className="grid grid-cols-2 gap-2">
        <LabeledMini label="Mobile Image URL" value={m.mobileImage} onChange={(v) => update({ mobileImage: v })} />
        <LabeledMini label="Alt Text" value={m.altText} onChange={(v) => update({ altText: v })} />
      </div>
    </div>
  );
}

function BgTextBlock({ m, update }) {
  const settings = m.extraData || { boxTheme: 'dark', boxPosition: 'right', altText: '' };
  const updateExtra = (partial) => update({ extraData: { ...settings, ...partial } });
  const posClass =
    settings.boxPosition === 'left' ? 'justify-start' : settings.boxPosition === 'center' ? 'justify-center' : 'justify-end';

  return (
    <div className="space-y-2 p-3">
      <div className="relative">
        <EditableImage
          src={m.pcImage}
          alt={settings.altText}
          onChange={(v) => update({ pcImage: v })}
          imgClassName="aspect-[1464/600] w-full rounded-sm object-cover"
        />
        <div className={`pointer-events-none absolute inset-0 flex items-center p-6 ${posClass}`}>
          <div
            className={`pointer-events-auto max-w-sm rounded p-4 ${
              settings.boxTheme === 'light'
                ? 'border border-slate-200 bg-white/95 text-slate-900'
                : 'bg-black/75 text-white'
            }`}
          >
            <EditableText
              value={m.title}
              onChange={(v) => update({ title: v })}
              placeholder="Headline"
              className="text-lg font-black uppercase"
            />
            <EditableText
              as="textarea"
              value={m.description}
              onChange={(v) => update({ description: v })}
              placeholder="Description"
              className="mt-1 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Box Theme</span>
          <select
            value={settings.boxTheme}
            onChange={(e) => updateExtra({ boxTheme: e.target.value })}
            className="mt-0.5 w-full rounded-sm border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Box Position</span>
          <select
            value={settings.boxPosition}
            onChange={(e) => updateExtra({ boxPosition: e.target.value })}
            className="mt-0.5 w-full rounded-sm border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <LabeledMini label="Alt Text" value={settings.altText} onChange={(v) => updateExtra({ altText: v })} />
      </div>
    </div>
  );
}

function SingleImageBlock({ m, update }) {
  return (
    <div className="flex flex-col items-center gap-4 p-4 md:flex-row">
      <EditableImage
        src={m.pcImage}
        alt={m.altText}
        onChange={(v) => update({ pcImage: v })}
        className="w-full md:w-1/2"
        imgClassName="aspect-square w-full rounded-sm object-cover"
      />
      <div className="w-full space-y-1.5 md:w-1/2">
        <EditableText
          value={m.title}
          onChange={(v) => update({ title: v })}
          placeholder="Headline"
          className="border-b-2 border-slate-300 pb-1 text-lg font-extrabold"
        />
        <EditableText
          as="textarea"
          value={m.description}
          onChange={(v) => update({ description: v })}
          placeholder="Description"
          className="text-sm text-slate-600"
        />
        <LabeledMini label="Alt Text" value={m.altText} onChange={(v) => update({ altText: v })} />
      </div>
    </div>
  );
}

function FaqBlock({ m, update }) {
  const state = m.extraData || { items: [] };
  const items = state.items || [];
  const updateItems = (next) => update({ extraData: { ...state, items: next } });

  const addItem = () =>
    updateItems([...items, { id: Date.now().toString(), question: 'New Question?', answer: 'New answer.' }]);
  const removeItem = (id) => updateItems(items.filter((i) => i.id !== id));
  const updateItem = (id, field, value) => updateItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="space-y-3 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-center text-sm font-extrabold uppercase tracking-wide text-slate-800">
          Frequently Asked Questions
        </h3>
        <button
          type="button"
          onClick={addItem}
          className="flex cursor-pointer items-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Plus size={12} />
          Add Question
        </button>
      </div>
      <div className="mx-auto max-w-2xl space-y-2.5">
        {items.map((f) => (
          <div key={f.id} className="relative rounded border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() => removeItem(f.id)}
              className="absolute top-2 right-2 cursor-pointer text-slate-300 hover:text-red-500"
            >
              <X size={13} />
            </button>
            <div className="flex gap-1.5 pr-5 text-sm font-bold text-slate-900">
              <span>Q:</span>
              <EditableText value={f.question} onChange={(v) => updateItem(f.id, 'question', v)} placeholder="Question" />
            </div>
            <div className="mt-1 border-l-2 border-slate-300 pl-3">
              <EditableText
                as="textarea"
                value={f.answer}
                onChange={(v) => updateItem(f.id, 'answer', v)}
                placeholder="Answer"
                className="text-xs text-slate-600"
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-400">No questions yet - click "Add Question".</p>
        )}
      </div>
    </div>
  );
}

export default function EditableCanvas({
  styles,
  setStyles,
  headerData,
  setHeaderData,
  modules,
  addModuleAt,
  removeModule,
  moveModule,
  updateModule,
}) {
  const [styleOpen, setStyleOpen] = useState(false);
  const atMax = modules.length >= 7;

  return (
    <div className="space-y-0">
      {/* Store header - editable inline */}
      <div className="relative rounded-t-sm border border-b-0 border-slate-200 p-4" style={{ backgroundColor: styles.headerBg, color: styles.headerText }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EditableText
            value={headerData.storeName}
            onChange={(v) => setHeaderData({ ...headerData, storeName: v })}
            placeholder="Store Name"
            className="max-w-50 text-lg font-extrabold"
            style={{ color: styles.primaryColor }}
          />
          <div className="flex flex-wrap gap-3">
            {headerData.shopLinks.map((link) => (
              <EditableText
                key={link.id}
                value={link.label}
                onChange={(v) =>
                  setHeaderData({
                    ...headerData,
                    shopLinks: headerData.shopLinks.map((l) => (l.id === link.id ? { ...l, label: v } : l)),
                  })
                }
                className="w-auto max-w-30 text-sm font-semibold"
              />
            ))}
            <button
              type="button"
              onClick={() =>
                setHeaderData({
                  ...headerData,
                  shopLinks: [...headerData.shopLinks, { id: Date.now().toString(), label: 'New Link', url: '#' }],
                })
              }
              className="cursor-pointer rounded-sm border border-current px-2 py-0.5 text-xs opacity-70 hover:opacity-100"
            >
              + Link
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStyleOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-1 rounded-sm border border-current px-2 py-1 text-xs font-semibold opacity-80 hover:opacity-100"
          >
            <Palette size={13} />
            Style
          </button>
        </div>
      </div>

      {styleOpen && (
        <div className="grid grid-cols-2 gap-3 border border-t-0 border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <ColorField label="Primary" value={styles.primaryColor} onChange={(v) => setStyles({ ...styles, primaryColor: v })} />
          <ColorField label="Canvas Background" value={styles.backgroundColor} onChange={(v) => setStyles({ ...styles, backgroundColor: v })} />
          <ColorField label="Text" value={styles.textColor} onChange={(v) => setStyles({ ...styles, textColor: v })} />
          <ColorField label="Header Background" value={styles.headerBg} onChange={(v) => setStyles({ ...styles, headerBg: v })} />
          <ColorField label="Header Text" value={styles.headerText} onChange={(v) => setStyles({ ...styles, headerText: v })} />
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Font</span>
            <select
              value={styles.fontFamily}
              onChange={(e) => setStyles({ ...styles, fontFamily: e.target.value })}
              className="mt-0.5 w-full rounded-sm border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
            >
              <option value="sans-serif">Sans-Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </label>
        </div>
      )}

      <div className="rounded-b-sm border border-t-0 border-slate-200 bg-white p-3">
        <AddModuleButton disabled={atMax} onAdd={(type) => addModuleAt(0, type)} />

        {modules.map((m, idx) => {
          const update = (fields) => updateModule(m.id, fields);
          return (
            <React.Fragment key={m.id}>
              <ModuleShell
                label={m.type}
                idx={idx}
                total={modules.length}
                onMoveUp={() => moveModule(idx, 'up')}
                onMoveDown={() => moveModule(idx, 'down')}
                onRemove={() => removeModule(m.id)}
              >
                {m.type === 'hero' && <HeroBlock m={m} update={update} />}
                {m.type === 'bgText' && <BgTextBlock m={m} update={update} />}
                {m.type === 'singleImage' && <SingleImageBlock m={m} update={update} />}
                {m.type === 'faq' && <FaqBlock m={m} update={update} />}
                {m.type === 'dualImage' && (
                  <DualImageTextModule data={m} updateModule={updateModule} styles={{}} mode="editor" />
                )}
                {m.type === 'fourImage' && (
                  <FourImageTextModule data={m} updateModule={updateModule} styles={{}} mode="editor" />
                )}
                {m.type === 'table' && (
                  <ComparisonTableModule data={m} updateModule={updateModule} styles={{}} mode="editor" />
                )}
              </ModuleShell>
              <AddModuleButton disabled={atMax} onAdd={(type) => addModuleAt(idx + 1, type)} />
            </React.Fragment>
          );
        })}

        {modules.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Your template is empty - click "Add Module" above to get started.
          </p>
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 h-9 w-full cursor-pointer rounded-sm border border-slate-300 bg-white"
      />
    </label>
  );
}
