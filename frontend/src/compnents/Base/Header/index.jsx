import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, LogOut, LayoutGrid, Menu, X } from "lucide-react";
import { getStoredUser, logout } from "../../../config/auth";
import { clearMyPermissions, roleLabel } from "../../../config/permissions";
import { buildSearchableNav } from "../../../config/navItems";

export default function Header({ onMenuClick, sidebarOpen }) {
  const [now, setNow] = useState(new Date());
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const user = getStoredUser();
  const searchableNav = useMemo(() => buildSearchableNav(user), [user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const liveTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);

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
    <header className="h-14 bg-[#232F3E] text-white">
      <div className="h-full flex items-center gap-3 px-3 sm:px-4">
        {/* LOGO */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex items-center justify-center rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FF9900] text-[#131A22] font-black">
            <LayoutGrid size={16} />
          </div>
          <span className="hidden sm:block text-sm font-bold tracking-wide">
            Digitweb <span className="text-slate-400 font-medium">Seller Central</span>
          </span>
        </div>

        {/* SEARCH */}
        <div ref={searchRef} className="relative flex-1 max-w-xl">
          <div className="flex items-center rounded-sm border border-slate-300 bg-white overflow-hidden">
            <Search size={15} className="ml-2.5 text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search reports, tools, pages…"
              className="w-full px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
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

        {/* RIGHT: TIME + BELL + ACCOUNT + LOGOUT */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:block text-xs font-semibold text-slate-300">{liveTime}</span>

          <button
            type="button"
            className="hidden sm:flex items-center justify-center rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>

          {user && (
            <div className="hidden md:flex items-center gap-2 rounded-sm border border-slate-600 px-2.5 py-1">
              <span className="text-xs font-bold text-white truncate max-w-35">
                {user.name || user.email || user.user_id}
              </span>
              <span className="rounded-sm bg-[#FF9900]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#FFB84D]">
                {roleLabel(user.role)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-sm border border-slate-600 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300"
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
