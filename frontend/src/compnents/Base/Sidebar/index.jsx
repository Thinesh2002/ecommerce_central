import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  X,
  BarChart3,
  FileCode2,
  ClipboardCheck,
  ShoppingBag,
  Store,
  Search,
  ListTodo,
  UserPlus,
  ShieldCheck,
  Activity,
  GitCompare,
  FileText,
} from "lucide-react";
import { menuSections } from "../../menuConfig";
import { getStoredUser } from "../../../config/auth";
import { hasPermission, isAdmin } from "../../../config/permissions";
import { PAGE_PERMISSIONS, ADMIN_ONLY_PATHS } from "../../../config/pageAccess";

const iconMap = {
  Dashboard: LayoutDashboard,
  "Main Dashboard": LayoutDashboard,

  "Account Overview": Store,
  "Manage Accounts": Store,
  "Channel Accounts": Store,

  "Traffic Analysis": BarChart3,
  "Report Panel": BarChart3,
  "Traffic Report Panel": BarChart3,
  "Performance Tracker": Activity,
  "Traffic Compare": GitCompare,

  "Listing Audit": ClipboardCheck,
  "Audit Tool": ClipboardCheck,

  "Template Generator": FileCode2,
  "HTML Generator": FileCode2,

  "Keyword Analysis": Search,
  "Keyword Dashboard": Search,
  "Advanced Research": BarChart3,
  "Seller Research": Users,

  "Staff Profiles": Users,
  "eBay Team Roster": Users,
  "Create User Access": UserPlus,
  "User Access List": ShieldCheck,
  "Access Control": ShieldCheck,

  "Task Dashboard": ListTodo,
  "Task Overview": ListTodo,
  "Create / Assign Task": ListTodo,

  "Daraz Central": ShoppingBag,
  "Daraz Dashboard": ShoppingBag,
  "Daraz Orders": ShoppingBag,
  "Daraz Products": ShoppingBag,

  WooCommerce: Store,
  "Woo Dashboard": Store,
  "Woo Orders": Store,
  "Woo Products": Store,
};

function makePageKey(sectionTitle, parentLabel, link) {
  return `${sectionTitle}-${parentLabel}-${link.label}-${link.to}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildMenu(menuSectionsData) {
  const pages = [];

  menuSectionsData.forEach((section) => {
    (section.items || []).forEach((item) => {
      const links =
        item.subLinks && item.subLinks.length > 0
          ? item.subLinks
          : [{ to: item.to, label: item.label }];

      links.forEach((link) => {
        pages.push({
          section: section.title,
          page_key: makePageKey(section.title, item.label, link),
          page_name: link.label,
          path: link.to,
          parent_label: item.label,
          exact: true,
        });
      });
    });
  });

  return pages;
}

function canViewPage(path, user) {
  if (ADMIN_ONLY_PATHS.includes(path)) return isAdmin(user);
  const requiredPermission = PAGE_PERMISSIONS[path];
  if (!requiredPermission) return true;
  return hasPermission(user, requiredPermission);
}

function groupMenu(menuItems) {
  return menuItems.reduce((grouped, item) => {
    const sectionName = String(item.section || "MAIN").toUpperCase();

    if (!grouped[sectionName]) {
      grouped[sectionName] = [];
    }

    grouped[sectionName].push(item);
    return grouped;
  }, {});
}

export default function Sidebar({ onClose = () => {} }) {
  const user = getStoredUser();
  const menu = useMemo(
    () => buildMenu(menuSections).filter((item) => canViewPage(item.path, user)),
    [user]
  );
  const groupedMenu = useMemo(() => groupMenu(menu), [menu]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-700 select-none">
      {/* MOBILE CLOSE BUTTON */}
      <div className="flex h-12 shrink-0 items-center justify-end border-b border-slate-200 px-4 lg:hidden">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden pb-20">
        {Object.entries(groupedMenu).map(([sectionName, items]) => (
          <div key={sectionName} className="border-b border-slate-100 py-3">
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              {sectionName}
            </p>

            <div className="space-y-1 px-2">
              {items.map((item) => {
                const Icon =
                  iconMap[item.page_name] ||
                  iconMap[item.parent_label] ||
                  FileText;

                return (
                  <NavLink
                    key={item.page_key}
                    to={item.path}
                    end={item.exact}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `relative flex cursor-pointer items-center gap-3 rounded-md px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute -left-2 top-0 h-full w-0.75 rounded-r bg-blue-600" />
                        )}

                        <Icon
                          size={16}
                          className={isActive ? "text-blue-600" : "text-slate-400"}
                        />

                        <span className="truncate">{item.page_name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
