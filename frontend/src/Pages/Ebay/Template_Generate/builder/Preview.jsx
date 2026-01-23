import { useState, useEffect } from "react";
import { generateHtml } from "../utils/generateHtml";

export default function Preview({ state }) {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' or 'code'
  const [viewMode, setViewMode] = useState("desktop"); // 'desktop' or 'mobile'
  const [editableCode, setEditableCode] = useState("");
  const [copied, setCopied] = useState(false);

  // State change aagum pothu code-ai sync pannum
  useEffect(() => {
    setEditableCode(generateHtml(state));
  }, [state]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 bg-[#f1f5f9] flex flex-col h-screen overflow-hidden">
      
      {/* 1. TOP TOOLBAR */}
      <div className="bg-white border-b border-gray-300 p-3 flex justify-between items-center px-6 shrink-0 shadow-sm">
        
        {/* TABS & VIEW SWITCHER */}
        <div className="flex gap-4 items-center">
          <div className="flex bg-gray-100 p-1 rounded-lg border">
            <button onClick={() => setActiveTab("preview")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "preview" ? "bg-white text-blue-600 shadow" : "text-gray-500"}`}>
              👁️ PREVIEW
            </button>
            <button onClick={() => setActiveTab("code")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "code" ? "bg-white text-blue-600 shadow" : "text-gray-500"}`}>
              <>{"</>"} CODE EDITOR</>
            </button>
          </div>

          {activeTab === "preview" && (
            <div className="flex bg-gray-100 p-1 rounded-lg border">
              <button onClick={() => setViewMode("desktop")}
                className={`px-3 py-1.5 rounded-md ${viewMode === "desktop" ? "bg-blue-600 text-white" : "text-gray-500"}`}>
                💻 PC
              </button>
              <button onClick={() => setViewMode("mobile")}
                className={`px-3 py-1.5 rounded-md ${viewMode === "mobile" ? "bg-blue-600 text-white" : "text-gray-500"}`}>
                📱 Mobile
              </button>
            </div>
          )}
        </div>

        {/* COPY BUTTON */}
        <button onClick={handleCopy}
          className={`px-5 py-2 text-xs font-black rounded transition-all uppercase tracking-widest ${
            copied ? "bg-green-500 text-white" : "bg-black text-white hover:bg-gray-800"
          }`}>
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>

      {/* 2. MAIN AREA */}
      <div className="flex-1 p-4 flex justify-center items-center overflow-auto bg-[#cbd5e1]">
        
        {activeTab === "preview" ? (
          /* PREVIEW MODE with Dynamic Sizing */
          <div className="transition-all duration-500 shadow-2xl rounded-xl overflow-hidden border-8 border-white bg-white"
            style={{ 
              width: viewMode === "mobile" ? "375px" : "100%", 
              height: viewMode === "mobile" ? "667px" : "100%",
              maxWidth: "100%"
            }}>
            <iframe
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-none"
              srcDoc={editableCode}
            />
          </div>
        ) : (
          /* LIVE CODE EDITOR MODE */
          <div className="w-full h-full bg-[#1e1e1e] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-800">
            <div className="bg-[#2d2d2d] px-4 py-2 text-[10px] text-gray-400 font-mono uppercase tracking-wider flex justify-between">
              <span>Full Template Code (Edit to See Changes)</span>
              <span className="text-blue-400">Live Editing Enabled</span>
            </div>
            <textarea
              className="w-full h-full p-6 bg-transparent text-green-400 font-mono text-sm outline-none resize-none leading-relaxed"
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              spellCheck="false"
            />
          </div>
        )}

      </div>
    </div>
  );
}