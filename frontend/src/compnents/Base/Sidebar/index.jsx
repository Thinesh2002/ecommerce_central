import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  X,
  BarChart3,
  FileCode2,
  ClipboardCheck,
  Store,
  Search,
  ListTodo,
  UserPlus,
  ShieldCheck,
  Activity,
  GitCompare,
  FileText,
} from "lucide-react";
import { getStoredUser } from "../../../config/auth";
import { buildTopLevelNav } from "../../../config/navItems";

const iconMap = {
  Dashboard: LayoutDashboard,
  "Traffic Analysis": BarChart3,
  "Performance Tracker": Activity,
  "Traffic Compare": GitCompare,
  "Listing Audit": ClipboardCheck,
  "Template Generator": FileCode2,
  "Keyword Analysis": Search,
  "Advanced Research": BarChart3,
  "Seller Research": Users,
  "Channel Accounts": Store,
  "Staff Profiles": Users,
  "Create User Access": UserPlus,
  "User Access List": ShieldCheck,
  "Task Dashboard": ListTodo,
  "Access Control": ShieldCheck,
};

export default function Sidebar({ onClose = () => {} }) {
  const user = getStoredUser();
  const items = useMemo(() => buildTopLevelNav(user), [user]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-700 select-none">
      {/* MOBILE CLOSE BUTTON */}
      <div className="flex h-12 shrink-0 items-center justify-end border-b border-slate-200 px-4 lg:hidden">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden py-3 pb-20">
        {items.map((item) => {
          const Icon = iconMap[item.label] || FileText;

          if (item.subLinks.length === 1) {
            return (
              <NavLink
                key={item.key}
                to={item.to}
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `relative mx-2 mb-0.5 flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "bg-[#FFF4E5] text-[#B45F00]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-0.75 rounded-r bg-[#FF9900]" />
                    )}
                    <Icon size={16} className={isActive ? "text-[#FF9900]" : "text-slate-400"} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <div key={item.key} className="mb-3">
              <p className="mb-1 px-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {item.label}
              </p>
              <div className="space-y-0.5 px-2">
                {item.subLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${
                        isActive
                          ? "bg-[#FFF4E5] text-[#B45F00]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1 bottom-1 w-0.75 rounded-r bg-[#FF9900]" />
                        )}
                        <span className="truncate">{link.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
