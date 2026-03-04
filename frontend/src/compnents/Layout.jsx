import { useEffect, useState, useRef } from "react";
import Header from "./Base/Header/index";
import Sidebar from "./Base/Sidebar/index";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        if (!event.target.closest("button")) {
          setSidebarOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="h-screen bg-[#040914] text-slate-200 overflow-hidden font-sans">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex h-[calc(100vh-4rem)] relative">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          />
        )}

        <aside
          ref={sidebarRef}
          className={`
            fixed lg:relative z-40 h-full
            bg-[#111827] border-r border-slate-800
            transition-all duration-300 ease-in-out
            ${
              sidebarOpen
                ? "w-72 translate-x-0 opacity-100"
                : "w-0 -translate-x-full lg:translate-x-0 opacity-0 lg:border-none"
            }
          `}
        >
          <div className="w-72 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 transition-all duration-300">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}