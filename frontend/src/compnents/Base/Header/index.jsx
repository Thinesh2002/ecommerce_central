import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, Menu as MenuIcon, X } from "lucide-react";
import { getStoredUser, logout } from "../../../config/auth";
import { clearMyPermissions, roleLabel } from "../../../config/permissions";

export default function Header({ onMenuClick, menuOpen }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const settingsRef = useRef(null);
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  const handleLogout = () => {
    logout();
    clearMyPermissions();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-[#0E2B33] text-white">
      <div className="h-full flex items-center justify-between px-3 sm:px-4">
        {/* MENU TOGGLE + TITLE */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-menu-toggle
            onClick={onMenuClick}
            className="relative z-50 flex items-center justify-center rounded p-1.5 text-slate-200 hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <MenuIcon size={18} />}
          </button>

          <span className="text-sm font-bold tracking-wide">eBay Team</span>
        </div>

        {/* RIGHT: TIME + SETTINGS POPUP */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-slate-300">{liveTime}</span>

          <div ref={settingsRef} className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="flex items-center justify-center rounded p-1.5 text-slate-200 hover:bg-white/10"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-sm border border-slate-200 bg-white text-slate-900 shadow-lg overflow-hidden z-50">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{user?.name || user?.email || user?.user_id}</p>
                    <p className="text-xs text-slate-500">{roleLabel(user?.role)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-900"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
