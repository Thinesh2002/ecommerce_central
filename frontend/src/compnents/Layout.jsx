import React, { useEffect, useRef, useState } from "react";
import Header from "./Base/Header";
import Sidebar from "./Base/Sidebar";
import Footer from "./Base/Footer";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest("button")
      ) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="relative h-screen overflow-hidden bg-[#EAEDED] text-slate-900 font-sans">
      <div className="relative z-60">
        <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />
      </div>

      {/* FIXED SIDEBAR - DESKTOP */}
      <aside className="hidden lg:block fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-56 overflow-hidden">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed left-0 right-0 bottom-0 top-14 z-40 bg-slate-900/35 backdrop-blur-sm transition-all duration-300 lg:hidden"
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 overflow-hidden lg:hidden transition-all duration-300 ease-out ${
          sidebarOpen ? "translate-x-0 opacity-100 shadow-[20px_0_80px_rgba(15,23,42,0.25)]" : "-translate-x-full opacity-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="relative z-10 flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden lg:pl-56">
        <main className="flex-1 overflow-y-auto main-scroll">
          <div className="mx-auto max-w-475 p-4 sm:p-6 lg:p-8">{children}</div>
        </main>

        <div className="shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
}
