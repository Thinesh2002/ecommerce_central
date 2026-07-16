import React, { useEffect, useState } from "react";
import Header from "./Base/Header";
import Menu from "./Base/Menu";
import Footer from "./Base/Footer";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#EAEDED] text-slate-900 font-sans">
      <div className="shrink-0 relative z-60">
        <Header onMenuClick={() => setMenuOpen((prev) => !prev)} menuOpen={menuOpen} />
        <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto main-scroll">
        <div className="mx-auto max-w-475 p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      <div className="shrink-0">
        <Footer />
      </div>
    </div>
  );
}
