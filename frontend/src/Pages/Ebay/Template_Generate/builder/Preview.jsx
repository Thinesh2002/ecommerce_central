import { useState, useEffect, useCallback, useRef } from "react";
import { generateHtml } from "../utils/generateHtml";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = { PREVIEW: "preview", CODE: "code" };
const VIEWPORTS = {
  desktop: { label: "Desktop", icon: "💻", width: "100%", height: "100%" },
  tablet:  { label: "Tablet",  icon: "🪟", width: "768px", height: "1024px" },
  mobile:  { label: "Mobile",  icon: "📱", width: "375px", height: "667px" },
};

const COPY_STATES = { IDLE: "idle", COPYING: "copying", COPIED: "copied", ERROR: "error" };
const COPY_LABELS = {
  idle:    { icon: "⎘", text: "Copy Code" },
  copying: { icon: "…", text: "Copying" },
  copied:  { icon: "✓", text: "Copied!" },
  error:   { icon: "✕", text: "Failed" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        active
          ? "bg-white text-blue-600 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function ViewportButton({ id, active, onClick }) {
  const vp = VIEWPORTS[id];
  return (
    <button
      onClick={onClick}
      title={vp.label}
      className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        active ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {vp.icon}
    </button>
  );
}

function CopyBtn({ text }) {
  const [status, setStatus] = useState(COPY_STATES.IDLE);
  const timerRef = useRef(null);

  const handleCopy = useCallback(async () => {
    if (status !== COPY_STATES.IDLE) return;
    setStatus(COPY_STATES.COPYING);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = Object.assign(document.createElement("textarea"), {
          value: text,
          style: "position:fixed;opacity:0",
        });
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        if (!ok) throw new Error("execCommand failed");
      }
      setStatus(COPY_STATES.COPIED);
    } catch {
      setStatus(COPY_STATES.ERROR);
    } finally {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setStatus(COPY_STATES.IDLE), 2500);
    }
  }, [status, text]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const { icon, text: label } = COPY_LABELS[status];
  const colorMap = {
    idle:    "bg-gray-900 text-white hover:bg-gray-700",
    copying: "bg-gray-500 text-white cursor-wait",
    copied:  "bg-green-600 text-white",
    error:   "bg-red-600 text-white",
  };

  return (
    <button
      onClick={handleCopy}
      disabled={status === COPY_STATES.COPYING}
      aria-label="Copy HTML code to clipboard"
      aria-live="polite"
      className={`px-5 py-2 text-xs font-black rounded-lg transition-all duration-200 uppercase tracking-widest flex items-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${colorMap[status]}`}
    >
      <span className={status === COPY_STATES.COPYING ? "animate-pulse" : ""}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function LineNumbers({ code }) {
  const lines = code.split("\n").length;
  return (
    <div
      aria-hidden="true"
      className="select-none text-right pr-4 pt-6 pb-6 text-gray-600 font-mono text-sm leading-relaxed shrink-0 min-w-[3rem]"
      style={{ lineHeight: "1.625rem" }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <div key={i + 1} className="text-[11px]">{i + 1}</div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Preview({ state }) {
  const [activeTab, setActiveTab] = useState(TABS.PREVIEW);
  const [viewport, setViewport] = useState("desktop");
  const [editableCode, setEditableCode] = useState(() => generateHtml(state));
  const [previewSrc, setPreviewSrc] = useState(() => generateHtml(state));
  const [isDirty, setIsDirty] = useState(false); // code edited but not applied

  // Re-sync when upstream `state` changes
  useEffect(() => {
    const html = generateHtml(state);
    setEditableCode(html);
    setPreviewSrc(html);
    setIsDirty(false);
  }, [state]);

  const handleCodeChange = useCallback((e) => {
    setEditableCode(e.target.value);
    setIsDirty(true);
  }, []);

  // Apply code edits → refresh preview
  const applyChanges = useCallback(() => {
    setPreviewSrc(editableCode);
    setIsDirty(false);
  }, [editableCode]);

  // Switch to preview and apply pending edits
  const handleTabChange = useCallback(
    (tab) => {
      if (tab === TABS.PREVIEW && isDirty) applyChanges();
      setActiveTab(tab);
    },
    [isDirty, applyChanges]
  );

  const vp = VIEWPORTS[viewport];
  const isConstrained = viewport !== "desktop";

  return (
    <div className="flex-1 bg-slate-100 flex flex-col h-screen overflow-hidden">

      {/* ── TOOLBAR ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">

        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <TabButton active={activeTab === TABS.PREVIEW} onClick={() => handleTabChange(TABS.PREVIEW)}>
              👁 Preview
            </TabButton>
            <TabButton active={activeTab === TABS.CODE} onClick={() => handleTabChange(TABS.CODE)}>
              {"</>"} Code
            </TabButton>
          </div>

          {/* Viewport switcher — only in preview */}
          {activeTab === TABS.PREVIEW && (
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              {Object.keys(VIEWPORTS).map((id) => (
                <ViewportButton
                  key={id}
                  id={id}
                  active={viewport === id}
                  onClick={() => setViewport(id)}
                />
              ))}
            </div>
          )}

          {/* Viewport label badge */}
          {activeTab === TABS.PREVIEW && (
            <span className="text-xs text-gray-400 font-mono hidden sm:block">
              {isConstrained ? `${vp.width} × ${vp.height}` : "Responsive"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Apply changes indicator */}
          {activeTab === TABS.CODE && isDirty && (
            <button
              onClick={applyChanges}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              ▶ Apply to Preview
            </button>
          )}
          <CopyBtn text={editableCode} />
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 p-5 flex justify-center items-center overflow-auto bg-slate-200/70">

        {activeTab === TABS.PREVIEW ? (
          /* ── PREVIEW FRAME ── */
          <div
            className="transition-all duration-500 ease-in-out shadow-2xl rounded-xl overflow-hidden border-[10px] border-white bg-white"
            style={{
              width: vp.width,
              height: vp.height,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            {/* Simulated browser chrome for constrained viewports */}
            {isConstrained && (
              <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-full text-[10px] text-gray-400 text-center py-0.5 px-3 font-mono">
                  preview
                </div>
              </div>
            )}
            <iframe
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin"
              className="w-full border-none"
              style={{ height: isConstrained ? "calc(100% - 36px)" : "100%" }}
              srcDoc={previewSrc}
            />
          </div>
        ) : (
          /* ── CODE EDITOR ── */
          <div className="w-full h-full bg-[#1a1a2e] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#2a2a4a]">
            {/* Editor header */}
            <div className="bg-[#16213e] px-4 py-2.5 flex items-center justify-between border-b border-[#2a2a4a] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[11px] text-slate-400 font-mono tracking-wider">
                  index.html
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                )}
                <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">
                  {editableCode.split("\n").length} lines
                </span>
              </div>
            </div>

            {/* Editor body with line numbers */}
            <div className="flex flex-1 overflow-hidden">
              <div className="overflow-y-auto border-r border-[#2a2a4a] bg-[#16213e]">
                <LineNumbers code={editableCode} />
              </div>
              <textarea
                className="flex-1 p-6 bg-transparent text-emerald-300 font-mono text-sm outline-none resize-none leading-relaxed caret-white"
                value={editableCode}
                onChange={handleCodeChange}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                aria-label="HTML code editor"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}