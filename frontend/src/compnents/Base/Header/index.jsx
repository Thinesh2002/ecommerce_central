import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Mail, Settings, HelpCircle, LogOut, Menu as MenuIcon, X } from "lucide-react";
import { getStoredUser, logout } from "../../../config/auth";
import { clearMyPermissions, roleLabel } from "../../../config/permissions";
import { buildSearchableNav } from "../../../config/navItems";

export default function Header({ onMenuClick, menuOpen }) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const user = getStoredUser();
  const searchableNav = useMemo(() => buildSearchableNav(user), [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matches = query.trim()
    ? searchableNav
        .filter((item) => item.searchText.includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  const goTo = (to) => {
    setQuery("");
    setSearchOpen(false);
    navigate(to);
  };

  const handleLogout = () => {
    logout();
    clearMyPermissions();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-[#0E2B33] text-white">
      <div className="h-full flex items-center gap-3 px-3 sm:px-4">
        {/* MENU TOGGLE + LOGO */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-menu-toggle
            onClick={onMenuClick}
            className="flex items-center justify-center rounded p-1.5 text-slate-200 hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <MenuIcon size={18} />}
          </button>

          <span className="text-sm font-bold tracking-wide">
            Digitweb <span className="text-slate-400 font-medium">seller central</span>
          </span>

          {user && (
            <span className="hidden md:inline-flex items-center rounded-sm border border-slate-500 px-2 py-1 text-[11px] font-bold text-slate-200">
              {roleLabel(user.role)}
            </span>
          )}
        </div>

        {/* SEARCH */}
        <div ref={searchRef} className="relative flex-1 max-w-xl">
          <div className="flex items-center rounded-sm bg-[#1C4E58] overflow-hidden">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search"
              className="w-full px-3 py-1.5 text-sm bg-transparent text-white placeholder:text-slate-300 focus:outline-none"
            />
            <button
              type="button"
              className="flex items-center justify-center bg-[#123840] px-3 py-1.5 text-slate-200 hover:text-white"
              aria-label="Search"
            >
              <Search size={15} />
            </button>
          </div>

          {searchOpen && matches.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-sm border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
              {matches.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => goTo(item.to)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-xs text-slate-400">{item.group}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: ICONS + USER + LOGOUT */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="hidden sm:flex items-center justify-center rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Messages"
          >
            <Mail size={16} />
          </button>
          <button
            type="button"
            className="hidden sm:flex items-center justify-center rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            className="hidden sm:flex items-center justify-center rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Help"
          >
            <HelpCircle size={16} />
          </button>

          {user && (
            <span className="hidden md:block px-2 text-xs font-semibold text-slate-300 truncate max-w-35">
              {user.name || user.email || user.user_id}
            </span>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-sm border border-slate-500 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"
            aria-label="Logout"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
