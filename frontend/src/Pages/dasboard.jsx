import React from "react";
import { Link } from "react-router-dom";

/* ================= STAT CARD ================= */
const StatCard = ({ title, value, subtitle }) => (
  <div
    className="
      bg-[#020617]
      border border-white/10
      rounded-2xl
      p-5
      shadow-sm
    "
  >
    <p className="text-sm text-gray-400">{title}</p>
    <h3 className="text-3xl font-semibold text-white mt-2">
      {value}
    </h3>
    <p className="text-xs text-gray-500 mt-1">
      {subtitle}
    </p>
  </div>
);

/* ================= DASHBOARD ACTION CARD ================= */
const DashboardCard = ({ to, title, description }) => (
  <Link
    to={to}
    className="
      group
      bg-[#020617]
      border border-white/10
      rounded-2xl
      p-6
      transition-all
      hover:border-blue-500/50
      hover:shadow-lg
    "
  >
    <h2
      className="
        text-lg
        font-semibold
        text-white
        mb-2
        group-hover:text-blue-400
      "
    >
      {title}
    </h2>
    <p className="text-sm text-gray-400">
      {description}
    </p>
  </Link>
);

/* ================= MAIN DASHBOARD ================= */
export default function Dashboard() {
  return (
    <div className="space-y-8 text-gray-200">

      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-semibold">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          System overview & quick actions
        </p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Products"
          value="128"
          subtitle="Active listings"
        />
        <StatCard
          title="Orders Today"
          value="24"
          subtitle="Processing & completed"
        />
        <StatCard
          title="Users"
          value="56"
          subtitle="Registered"
        />
        <StatCard
          title="Revenue"
          value="Rs. 145,000"
          subtitle="This month"
        />
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            to="/manage-products"
            title="Manage Products"
            description="Create, update, or remove products."
          />

          <DashboardCard
            to="/admin/orders"
            title="View Orders"
            description="Process and track customer orders."
          />

          <DashboardCard
            to="/admin/users"
            title="User Management"
            description="Control access and roles."
          />
        </div>
      </div>

    </div>
  );
}
