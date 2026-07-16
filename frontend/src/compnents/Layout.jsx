import React, { useEffect, useRef, useState } from "react";
import Header from "./Base/Header";
import Sidebar from "./Base/Sidebar";
import Footer from "./Base/Footer";


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
    <div className="relative h-screen overflow-hidden bg-[#f6f8fb] text-slate-900 font-sans">

      {/* FULL PAGE HEADER */}
      <div className="relative z-60">
        <Header
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />
      </div>

      {/* FIXED SIDEBAR - DESKTOP */}
      <aside className="hidden lg:block fixed left-0 top-12 z-50 h-[calc(100vh-3rem)] w-55 overflow-hidden">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed left-0 right-0 bottom-0 top-12 z-40 bg-slate-900/35 backdrop-blur-sm transition-all duration-300 lg:hidden"
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`
          fixed left-0 top-12 z-50 h-[calc(100vh-3rem)] w-52 overflow-hidden lg:hidden
          transition-all duration-300 ease-out
          ${
            sidebarOpen
              ? "translate-x-0 opacity-100 shadow-[20px_0_80px_rgba(15,23,42,0.25)]"
              : "-translate-x-full opacity-0"
          }
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="relative z-10 flex h-[calc(100vh-3rem)] flex-col overflow-hidden lg:pl-55">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 main-scroll">
          <div className="mx-auto max-w-475">{children}</div>
        </main>

        <div className="shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
}