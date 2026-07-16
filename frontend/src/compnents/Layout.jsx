import React from "react";
import Header from "./Base/Header";
import TabBar from "./Base/TabBar";
import Footer from "./Base/Footer";

export default function Layout({ children }) {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#EAEDED] text-slate-900 font-sans">
      <div className="shrink-0 sticky top-0 z-50">
        <Header />
        <TabBar />
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
