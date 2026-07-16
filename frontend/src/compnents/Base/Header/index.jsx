import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, X } from "lucide-react";
import { getStoredUser, logout } from "../../../config/auth";
import { clearMyPermissions, roleLabel } from "../../../config/permissions";

export default function Header({ onMenuClick, sidebarOpen }) {
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const liveTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  const liveDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);

  const handleLogout = () => {
    logout();
    clearMyPermissions();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 h-12 border-b border-slate-200 bg-white shadow-sm">
      <div className="h-full flex items-center justify-between gap-3 px-2 sm:px-4">
        {/* LEFT: MENU + HEADING */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="cursor-pointer rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-wide truncate">
            Digitweb eBay Team Dashboard
          </h1>
        </div>

        {/* RIGHT: TIME + USER + LOGOUT */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right leading-none hidden sm:block">
            <p className="text-sm font-black text-slate-800 tracking-wide">{liveTime}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">{liveDate}</p>
          </div>

          {user && (
            <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-xs font-bold text-slate-700 truncate max-w-35">
                {user.name || user.email || user.user_id}
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-100">
                {roleLabel(user.role)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Logout"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
