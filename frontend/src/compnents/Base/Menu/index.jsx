import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { getStoredUser } from "../../../config/auth";
import { buildTopLevelNav } from "../../../config/navItems";

export default function Menu({ open, onClose }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const user = getStoredUser();
  const items = buildTopLevelNav(user);
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const wrapperRef = useRef(null);
  const rowRefs = useRef({});

  useEffect(() => {
    if (!open) setExpandedKey(null);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        open &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        !event.target.closest("[data-menu-toggle]")
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const go = (to) => {
    onClose();
    navigate(to);
  };

  const expand = (key) => {
    setExpandedKey(key);
    const row = rowRefs.current[key];
    const wrapper = wrapperRef.current;
    if (row && wrapper) {
      setFlyoutTop(row.getBoundingClientRect().top - wrapper.getBoundingClientRect().top);
    }
  };

  const expandedItem = items.find((item) => item.key === expandedKey);

  return (
    <>
      <div className="fixed inset-0 top-14 z-40 bg-white/40 backdrop-blur-sm" />

      <div ref={wrapperRef} className="fixed left-0 top-14 z-50 flex items-start">
        <div ref={panelRef} className="w-64 h-[calc(100vh-3.5rem)] overflow-y-auto bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            <span className="text-sm font-bold text-slate-900">Menu</span>
          </div>

          <div className="py-1">
            {items.map((item) => {
              const hasSubmenu = item.subLinks.length > 1;
              const isExpanded = expandedKey === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  ref={(el) => {
                    rowRefs.current[item.key] = el;
                  }}
                  onMouseEnter={() => hasSubmenu && expand(item.key)}
                  onClick={() => (hasSubmenu ? expand(isExpanded ? null : item.key) : go(item.to))}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                    isExpanded ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.label}</span>
                  {hasSubmenu && <ChevronRight size={14} className="text-slate-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {expandedItem && (
          <div
            className="absolute w-60 border border-slate-200 bg-white shadow-xl"
            style={{ left: "16rem", top: flyoutTop }}
            onMouseEnter={() => expand(expandedItem.key)}
          >
            {expandedItem.subLinks.map((link) => (
              <button
                key={link.to}
                type="button"
                onClick={() => go(link.to)}
                className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
