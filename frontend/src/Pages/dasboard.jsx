import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ListTodo,
  Clock,
  CheckCircle2,
  Users,
  Search,
  BarChart3,
  ClipboardCheck,
  Store,
  FileCode2,
  ArrowUpRight,
} from "lucide-react";
import API from "../config/api";
import { getDashboardSummary } from "../config/task_api/task-api";
import { getStaff } from "../config/team_api/team_api";
import { getStoredUser } from "../config/auth";
import { hasPermission, PERMISSIONS } from "../config/permissions";

const QUICK_LINKS = [
  { to: "/keyword-analysis", label: "Keyword Analysis", icon: Search, permission: PERMISSIONS.KEYWORD_READ },
  { to: "/seller-analysis", label: "Seller Research", icon: Users, permission: PERMISSIONS.SELLER_READ },
  { to: "/listing-audit", label: "Listing Audit", icon: ClipboardCheck, permission: PERMISSIONS.LISTING_AUDIT },
  { to: "/traffic-report-analysis", label: "Traffic Reports", icon: BarChart3 },
  { to: "/ebay-accounts", label: "Channel Accounts", icon: Store, permission: PERMISSIONS.ACCOUNT_READ },
  { to: "/ebay-template", label: "Template Generator", icon: FileCode2 },
];

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-sm border border-[#D5D9D9] bg-white p-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: null,
    totalHours: null,
    verifiedTasks: null,
    teamMembers: null,
    totalUsers: null,
  });

  const canReadTasks = hasPermission(user, PERMISSIONS.TASK_READ);
  const canReadTeam = hasPermission(user, PERMISSIONS.TEAM_READ);
  const canReadUsers = hasPermission(user, PERMISSIONS.USER_READ);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const next = {};

      await Promise.all([
        canReadTasks
          ? getDashboardSummary()
              .then((res) => {
                const data = res.data?.data || {};
                next.totalTasks = data.total_tasks ?? 0;
                next.totalHours = data.total_hours ?? 0;
                next.verifiedTasks = data.verified_tasks ?? 0;
              })
              .catch(() => {})
          : Promise.resolve(),
        canReadTeam
          ? getStaff()
              .then((res) => {
                next.teamMembers = res.data?.count ?? 0;
              })
              .catch(() => {})
          : Promise.resolve(),
        canReadUsers
          ? API.get("/user/stats")
              .then((res) => {
                next.totalUsers = res.data?.total ?? 0;
              })
              .catch(() => {})
          : Promise.resolve(),
      ]);

      if (!cancelled) {
        setStats((prev) => ({ ...prev, ...next }));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canReadTasks, canReadTeam, canReadUsers]);

  const visibleQuickLinks = QUICK_LINKS.filter(
    (link) => !link.permission || hasPermission(user, link.permission)
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dashboard</p>
        <h1 className="text-xl font-bold text-slate-900">
          Welcome back, {user?.name || user?.email || "there"}
        </h1>
      </div>

      {(canReadTasks || canReadTeam || canReadUsers) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {canReadTasks && (
            <>
              <StatTile
                icon={ListTodo}
                label="Total Tasks"
                value={loading ? "…" : stats.totalTasks}
                accent="bg-slate-100 text-slate-600"
              />
              <StatTile
                icon={Clock}
                label="Hours Logged"
                value={loading ? "…" : stats.totalHours}
                accent="bg-slate-100 text-slate-600"
              />
              <StatTile
                icon={CheckCircle2}
                label="Verified Tasks"
                value={loading ? "…" : stats.verifiedTasks}
                accent="bg-emerald-50 text-emerald-600"
              />
            </>
          )}
          {canReadTeam && (
            <StatTile
              icon={Users}
              label="Team Members"
              value={loading ? "…" : stats.teamMembers}
              accent="bg-slate-100 text-slate-600"
            />
          )}
          {!canReadTeam && canReadUsers && (
            <StatTile
              icon={Users}
              label="Total Users"
              value={loading ? "…" : stats.totalUsers}
              accent="bg-slate-100 text-slate-600"
            />
          )}
        </div>
      )}

      <div className="rounded-sm border border-[#D5D9D9] bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Quick access</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100">
          {visibleQuickLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center justify-between gap-2 bg-white p-4 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-50 text-slate-500 group-hover:text-slate-900">
                  <Icon size={16} />
                </span>
                <span className="text-sm font-semibold text-slate-700 truncate">{label}</span>
              </span>
              <ArrowUpRight size={14} className="shrink-0 text-slate-300 group-hover:text-slate-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
