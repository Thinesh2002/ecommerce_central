import { useState, useCallback } from "react";
import { generateHtml } from "../utils/generateHtml";

const STATES = {
  IDLE: "idle",
  COPYING: "copying",
  COPIED: "copied",
  ERROR: "error",
};

const CONFIG = {
  RESET_DELAY: 2500,
  COPY_DELAY: 150, // Brief "copying" state for perceived feedback
};

export default function CopyButton({ state, disabled = false }) {
  const [status, setStatus] = useState(STATES.IDLE);

  const copyHtml = useCallback(async () => {
    if (status !== STATES.IDLE || disabled) return;

    setStatus(STATES.COPYING);

    try {
      const html = generateHtml(state);

      // Prefer async clipboard API; fall back to execCommand
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(html);
      } else {
        const el = document.createElement("textarea");
        el.value = html;
        el.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        if (!ok) throw new Error("execCommand copy failed");
      }

      // Brief pause so "copying…" pulse is visible
      await new Promise((r) => setTimeout(r, CONFIG.COPY_DELAY));
      setStatus(STATES.COPIED);
    } catch (err) {
      console.error("Failed to copy HTML:", err);
      setStatus(STATES.ERROR);
    } finally {
      setTimeout(() => setStatus(STATES.IDLE), CONFIG.RESET_DELAY);
    }
  }, [status, state, disabled]);

  const variants = {
    [STATES.IDLE]: {
      label: "Copy Final HTML",
      icon: "📋",
      cls: "bg-green-600 text-white hover:bg-green-500 shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5",
      ariaLabel: "Copy generated HTML to clipboard",
    },
    [STATES.COPYING]: {
      label: "Copying…",
      icon: (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
          />
        </svg>
      ),
      cls: "bg-green-700 text-white cursor-wait scale-95",
      ariaLabel: "Copying HTML…",
    },
    [STATES.COPIED]: {
      label: "Copied!",
      icon: "✅",
      cls: "bg-white text-green-600 ring-2 ring-green-500 scale-95",
      ariaLabel: "HTML copied to clipboard",
    },
    [STATES.ERROR]: {
      label: "Copy failed — try again",
      icon: "❌",
      cls: "bg-red-50 text-red-600 ring-2 ring-red-400 scale-95",
      ariaLabel: "Copy failed. Click to retry.",
    },
  };

  const { label, icon, cls, ariaLabel } = variants[status];
  const isDisabled = disabled || status === STATES.COPYING;

  return (
    <button
      onClick={copyHtml}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-live="polite"
      aria-busy={status === STATES.COPYING}
      className={[
        "w-full py-3 rounded font-bold",
        "transition-all duration-300",
        "flex items-center justify-center gap-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-95",
        cls,
      ].join(" ")}
    >
      <span aria-hidden="true">
        {typeof icon === "string" ? icon : icon}
      </span>
      <span>{label}</span>
    </button>
  );
}