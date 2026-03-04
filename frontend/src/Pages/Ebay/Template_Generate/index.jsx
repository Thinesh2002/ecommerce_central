import { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "./builder/Sidebar";
import Preview from "./builder/Preview";
import { initialState } from "./data/templateState";

// ─── History hook (undo / redo) ───────────────────────────────────────────────

const MAX_HISTORY = 50;

function useHistory(initial) {
  const [history, setHistory] = useState([initial]);
  const [cursor, setCursor]   = useState(0);

  const state = history[cursor];

  const setState = useCallback((updater) => {
    setHistory((prev) => {
      const current = prev[cursor];
      const next    = typeof updater === "function" ? updater(current) : updater;

      // Skip if nothing actually changed
      if (JSON.stringify(next) === JSON.stringify(current)) return prev;

      // Drop any "future" states beyond current cursor, then append
      const trimmed = prev.slice(0, cursor + 1);
      const capped  = trimmed.length >= MAX_HISTORY ? trimmed.slice(1) : trimmed;
      return [...capped, next];
    });
    setCursor((c) => Math.min(c + 1, MAX_HISTORY - 1));
  }, [cursor]);

  const undo = useCallback(() => setCursor((c) => Math.max(c - 1, 0)),              []);
  const redo = useCallback(() => setCursor((c) => Math.min(c + 1, history.length - 1)), [history.length]);
  const reset = useCallback(() => { setHistory([initial]); setCursor(0); },          [initial]);

  const canUndo = cursor > 0;
  const canRedo = cursor < history.length - 1;

  return { state, setState, undo, redo, reset, canUndo, canRedo };
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function ToolbarButton({ onClick, disabled, title, children, variant = "default" }) {
  const base = "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    default: "text-gray-300 hover:text-white hover:bg-white/10",
    danger:  "text-red-400  hover:text-red-300  hover:bg-red-500/15",
    success: "text-green-400 hover:text-green-300 hover:bg-green-500/15",
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-white/10 mx-1 shrink-0" aria-hidden />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { state, setState, undo, redo, reset, canUndo, canRedo } = useHistory(initialState);
  const [isDirty, setIsDirty]   = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const resetTimerRef = useRef(null);

  // Track unsaved changes
  useEffect(() => {
    setIsDirty(JSON.stringify(state) !== JSON.stringify(initialState));
  }, [state]);

  // Keyboard shortcuts: Ctrl/Cmd + Z = undo, Ctrl/Cmd + Shift + Z = redo
  useEffect(() => {
    const handler = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); if (canUndo) undo(); }
      if (e.key === "z" &&  e.shiftKey) { e.preventDefault(); if (canRedo) redo(); }
      if (e.key === "y")                { e.preventDefault(); if (canRedo) redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, canUndo, canRedo]);

  // Unsaved-changes guard on tab/window close
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Two-step reset confirmation
  const handleReset = useCallback(() => {
    if (!resetConfirm) {
      setResetConfirm(true);
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setResetConfirm(false), 3000);
    } else {
      clearTimeout(resetTimerRef.current);
      setResetConfirm(false);
      reset();
    }
  }, [resetConfirm, reset]);

  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  return (
    <div className="h-screen flex flex-col bg-[#04090f] overflow-hidden">

      {/* ── TOOLBAR ── */}
      <header
        className="shrink-0 h-11 bg-[#04090f] border-b border-white/[0.06] flex items-center justify-between px-4"
        role="toolbar"
        aria-label="Editor toolbar"
      >
        {/* Left — branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">🛒</span>
            <span className="text-sm font-black text-white tracking-tight">
              Lumina <span className="text-blue-400">Builder</span>
            </span>
          </div>

          {isDirty && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>

        {/* Center — history controls */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 010 10H9M3 10l4-4M3 10l4 4" />
            </svg>
            Undo
          </ToolbarButton>

          <ToolbarButton onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 000 10h4M21 10l-4-4m4 4l-4 4" />
            </svg>
            Redo
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            onClick={handleReset}
            disabled={!isDirty && !resetConfirm}
            title="Reset to default"
            variant={resetConfirm ? "danger" : "default"}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M4.582 9A8 8 0 1120 15" />
            </svg>
            {resetConfirm ? "Confirm Reset?" : "Reset"}
          </ToolbarButton>
        </div>

        {/* Right — status */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-mono">⌘Z</kbd>
          <span>undo</span>
          <span className="text-gray-700">/</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-mono">⌘⇧Z</kbd>
          <span>redo</span>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar state={state} setState={setState} />
        <Preview state={state} />
      </div>

    </div>
  );
}