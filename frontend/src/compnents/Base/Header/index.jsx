import { useState, useRef, useEffect } from "react";
import { Menu, Settings, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../../../config/auth";

export default function Header({ onMenuClick }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = getStoredUser();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
<header className="relative z-50 h-16 bg-[#0f172a] text-white flex items-center justify-between px-4 sm:px-6 border-b border-white/10">
      
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* MOBILE MENU */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded hover:bg-white/10"
        >
          <Menu size={22} />
        </button>

        <span className="font-semibold text-base sm:text-lg whitespace-nowrap">
          Central Management System
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">

      
        <button
          onClick={handleLogout}
          className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut size={18} />
        </button>

        {/* DESKTOP DROPDOWN */}
        <div
          className="relative hidden lg:block"
          ref={dropdownRef}
        >
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            <User size={18} />
            <span className="text-sm font-medium">
              {user?.name || "User"}
            </span>
            <Settings size={18} />
          </button>

          {/* DROPDOWN */}
          <div
            className={`
              absolute right-0 mt-2 w-48 bg-[#020617] border border-white/10
              rounded-xl shadow-xl overflow-hidden transition-all origin-top-right
              ${open
                ? "opacity-100 scale-100 visible"
                : "opacity-0 scale-95 invisible"}
            `}
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
