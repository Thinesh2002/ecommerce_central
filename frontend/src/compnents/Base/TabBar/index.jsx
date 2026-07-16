import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getStoredUser } from "../../../config/auth";
import { buildTopLevelNav } from "../../../config/navItems";

export default function TabBar() {
  const location = useLocation();
  const user = getStoredUser();
  const items = useMemo(() => buildTopLevelNav(user), [user]);

  // A path can appear as a sub-link under more than one tab (e.g. "Channel Accounts"
  // is both its own tab and a Dashboard shortcut) - an exact match on the tab's own
  // primary link always wins over an incidental sub-link match from another tab.
  const activeItem =
    items.find((item) => item.to === location.pathname) ||
    items.find((item) =>
      item.subLinks.some(
        (link) => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)
      )
    );

  return (
    <div className="bg-white border-b border-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <nav className="flex overflow-x-auto no-scrollbar px-2 sm:px-4">
        {items.map((item) => {
          const isActive = activeItem?.key === item.key;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={`relative shrink-0 px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute left-2 right-2 bottom-0 h-0.75 rounded-t bg-[#FF9900]" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {activeItem && activeItem.subLinks.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50 border-t border-slate-100 px-2 py-2 sm:px-4">
          {activeItem.subLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
