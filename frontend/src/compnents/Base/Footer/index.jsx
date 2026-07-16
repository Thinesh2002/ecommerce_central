import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#EAEDED] px-4 sm:px-8 py-2.5">
      <div className="max-w-450 mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-500">
        <span>© {new Date().getFullYear()} Digitweb Seller Central — eBay operations dashboard</span>
        <span className="font-semibold">v1.0.0</span>
      </div>
    </footer>
  );
}
