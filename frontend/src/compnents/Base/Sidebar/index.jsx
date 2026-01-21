import { NavLink } from "react-router-dom";
import {
  FileText,
  PlusSquare,
  User,
  ShoppingBag,
  Store,
  Package,
  ClipboardList,
  X,
} from "lucide-react";

export default function Sidebar({ onClose }) {
  return (
    <aside className="w-72 h-full bg-gradient-to-b from-[#0f172a] to-[#020617] text-white border-r border-white/10 flex flex-col">

      {/* MOBILE CLOSE */}
      <div className="lg:hidden flex justify-end p-4">
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {/* SCROLLABLE MENU */}
      <div className="flex-1 overflow-y-auto px-2 sidebar-scroll">

        {/* PRODUCTS */}
        <Section title="EBAY">
          <Item to="/traffic-report-analysis" icon={FileText} label="Traffic Report Analysis" onClick={onClose} />
          <Item to="/Keyword-analysis" icon={PlusSquare} label="Keyword Analysis" onClick={onClose} />
          <Item to="/Seller-analysis" icon={User} label="Seller Analysis" onClick={onClose} />


        </Section>



        {/* USER MANAGEMENT */}
        <Section title="USER MANAGEMENT">
          <Item to="/user-dashboard" icon={Store} label="Manage Users" onClick={onClose} />
        </Section>

      </div>
    </aside>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <div className="px-3 py-4">
      <p className="text-xs text-yellow-400 font-semibold tracking-widest mb-3">
        {title}
      </p>

      <div className="space-y-1">{children}</div>

      <div className="border-b border-white/10 mt-4" />
    </div>
  );
}

function Item({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all
        ${
          isActive
            ? "bg-white/10 text-white"
            : "text-gray-300 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      <Icon size={16} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
