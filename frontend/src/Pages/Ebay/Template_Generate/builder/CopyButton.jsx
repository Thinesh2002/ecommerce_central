import { useState } from "react";
import { generateHtml } from "../utils/generateHtml";

export default function CopyButton({ state }) {
  const [copied, setCopied] = useState(false);

  function copyHtml() {
    try {
      const html = generateHtml(state);
      navigator.clipboard.writeText(html);
      
      // Feedback logic
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2 seconds kalichu palaya state-ku maarum
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  }

  return (
    <button
      onClick={copyHtml}
      className={`w-full py-3 rounded font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
        copied 
        ? "bg-white text-green-600 scale-95" 
        : "bg-green-600 text-white hover:bg-green-500 shadow-lg active:scale-95"
      }`}
    >
      {copied ? (
        <>
          <span>✅</span>
          <span>Copied Successfully!</span>
        </>
      ) : (
        <>
          <span>📋</span>
          <span>Copy Final HTML</span>
        </>
      )}
    </button>
  );
}