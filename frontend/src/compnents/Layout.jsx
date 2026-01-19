import { useEffect, useState } from "react";
import Header from "./Base/Header/index";
import Sidebar from "./Base/Sidebar/index";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);


  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="h-screen bg-[#0b1220] overflow-hidden">
      {/* HEADER */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
            fixed lg:static z-40 h-full w-72
            transform transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* MAIN CONTENT */}
<main className="flex-1 overflow-y-auto hide-scrollbar bg-[#0f172a] p-4 sm:p-6">
  {children}
</main>

      </div>
    </div>
  );
}
