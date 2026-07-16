import React from "react";
import { ShieldCheck, Server, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="h-auto border-t border-slate-200 bg-white px-4 sm:px-8 py-3">
      <div className="max-w-450 mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-700">
            eBay Seller Central Dashboard
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Manage accounts, traffic, keyword research, templates, listings and team access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck size={13} />
            System Active
          </span>

          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Server size={13} />
            API Ready
          </span>

          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-200">
            <Clock size={13} />
            v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
}
