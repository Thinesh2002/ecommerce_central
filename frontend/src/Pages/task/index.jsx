import React, { useEffect, useMemo, useState } from "react";

import {
  getTasks,
  deleteTask,
} from "../../config/task_api/task-api";

import { getStaff } from "../../config/team_api/team_api";
import { getAccounts } from "../../config/ebay/ebay_accounts_api";
import { getStoredUser } from "../../config/auth";
import { hasPermission, PERMISSIONS } from "../../config/permissions";

const exportColumns = [
  "id",
  "date",
  "task_id",
  "name",
  "Department",
  "account_name",
  "account_code",
  "weekly_intent_id",
  "task_tier",
  "tier_description",
  "task_description",
  "metric_name",
  "metric_delta",
  "hours_spent",
  "verified",
  "verification_url",
  "waste_flag",
  "waste_type",
  "scenario",
  "product_ids_worked_on",
];

const filterOptions = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 14 Days",
  "This Month",
  "Last Month",
  "All Time",
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [dateFilter, setDateFilter] = useState("This Month");
  const [staffFilter, setStaffFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [wasteFilter, setWasteFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const currentUser = getStoredUser();
  const canDeleteTask = hasPermission(currentUser, PERMISSIONS.TASK_DELETE);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getArrayData = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.tasks)) return res.data.tasks;
    if (Array.isArray(res?.data?.accounts)) return res.data.accounts;
    if (Array.isArray(res?.data?.staff)) return res.data.staff;
    return [];
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [taskRes, staffRes, accountRes] = await Promise.all([
        getTasks(),
        getStaff(),
        getAccounts(),
      ]);

      setTasks(getArrayData(taskRes));
      setStaffs(getArrayData(staffRes));
      setAccounts(getArrayData(accountRes));
    } catch (error) {
      console.error("Dashboard Load Error:", error);
      setTasks([]);
      setStaffs([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Delete Task Error:", error);
      alert("Failed to delete task");
    }
  };

  const toDateOnly = (value) => {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const isInDateRange = (taskDate, filter) => {
    if (!taskDate) return false;
    if (filter === "All Time") return true;

    const today = new Date();
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const date = toDateOnly(taskDate);

    if (filter === "Today") return date.getTime() === current.getTime();

    if (filter === "Yesterday") {
      const yesterday = new Date(current);
      yesterday.setDate(current.getDate() - 1);
      return date.getTime() === yesterday.getTime();
    }

    if (filter === "Last 7 Days") {
      const start = new Date(current);
      start.setDate(current.getDate() - 6);
      return date >= start && date <= current;
    }

    if (filter === "Last 14 Days") {
      const start = new Date(current);
      start.setDate(current.getDate() - 13);
      return date >= start && date <= current;
    }

    if (filter === "This Month") {
      return (
        date.getMonth() === current.getMonth() &&
        date.getFullYear() === current.getFullYear()
      );
    }

    if (filter === "Last Month") {
      const lastMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      return (
        date.getMonth() === lastMonth.getMonth() &&
        date.getFullYear() === lastMonth.getFullYear()
      );
    }

    return true;
  };

  const normalizeYesNo = (value) => {
    if (value === 1 || value === "1" || value === true || value === "Yes") return "Yes";
    if (value === 0 || value === "0" || value === false || value === "No") return "No";
    return value || "No";
  };

  const getStaffName = (staff) =>
    staff.name || staff.staff_name || staff.full_name || staff.employee_name || "";

  const getAccountName = (account) =>
    account.account_name || account.name || account.account_code || "";

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter((task) => {
      const verifiedValue = normalizeYesNo(task.verified);
      const wasteValue = normalizeYesNo(task.waste_flag);

      const text = `
        ${task.id || ""}
        ${task.date || ""}
        ${task.task_id || ""}
        ${task.name || ""}
        ${task.Department || ""}
        ${task.account_name || ""}
        ${task.account_code || ""}
        ${task.task_description || ""}
        ${task.scenario || ""}
        ${task.product_ids_worked_on || ""}
      `.toLowerCase();

      return (
        isInDateRange(task.date, dateFilter) &&
        (staffFilter === "All" || task.name === staffFilter) &&
        (
          accountFilter === "All" ||
          task.account_name === accountFilter ||
          task.account_code === accountFilter
        ) &&
        (tierFilter === "All" || task.task_tier === tierFilter) &&
        (verifiedFilter === "All" || verifiedValue === verifiedFilter) &&
        (wasteFilter === "All" || wasteValue === wasteFilter) &&
        text.includes(search.toLowerCase())
      );
    });
  }, [
    tasks,
    dateFilter,
    staffFilter,
    accountFilter,
    tierFilter,
    verifiedFilter,
    wasteFilter,
    search,
  ]);

  const totalTasks = filteredTasks.length;

  const totalHours = filteredTasks.reduce(
    (sum, task) => sum + Number(task.hours_spent || 0),
    0
  );

  const wastedHours = filteredTasks
    .filter((task) => normalizeYesNo(task.waste_flag) === "Yes")
    .reduce((sum, task) => sum + Number(task.hours_spent || 0), 0);

  const productiveHours = totalHours - wastedHours;

  const verifiedTasks = filteredTasks.filter(
    (task) => normalizeYesNo(task.verified) === "Yes"
  ).length;

  const wasteTasks = filteredTasks.filter(
    (task) => normalizeYesNo(task.waste_flag) === "Yes"
  ).length;

  const exportCSV = () => {
    const header = exportColumns.join(",");

    const rows = filteredTasks.map((task) =>
      exportColumns
        .map((col) => {
          const value = task?.[col] ?? "";
          return `"${String(value).replaceAll('"', '""')}"`;
        })
        .join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "task-dashboard-export.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 max-w-[1800px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-[0.18em]">
            eBay EOD Task Analytics
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-950">
            Task Performance Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Staff, account, productivity, verification and wasted time overview
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadDashboardData}
            className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100"
          >
            Refresh
          </button>

          <button
            onClick={exportCSV}
            className="px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4">
          <Select label="Date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            {filterOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>

          <Select label="Staff" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
            <option>All</option>
            {staffs.map((staff, index) => {
              const staffName = getStaffName(staff);
              return (
                <option key={staff.id || index} value={staffName}>
                  {staffName}
                </option>
              );
            })}
          </Select>

          <Select label="Account" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option>All</option>
            {accounts.map((account, index) => {
              const accountName = getAccountName(account);
              return (
                <option key={account.id || index} value={accountName}>
                  {accountName}
                </option>
              );
            })}
          </Select>

          <Select label="Tier" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
            <option>All</option>
            <option>S</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
          </Select>

          <Select label="Verified" value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
            <option>All</option>
            <option>Yes</option>
            <option>No</option>
          </Select>

          <Select label="Waste" value={wasteFilter} onChange={(e) => setWasteFilter(e.target.value)}>
            <option>All</option>
            <option>Yes</option>
            <option>No</option>
          </Select>

          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task / staff / account"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card title="Total Tasks" value={totalTasks} />
            <Card title="Total Hours" value={totalHours.toFixed(2)} />
            <Card title="Productive Hours" value={productiveHours.toFixed(2)} />
            <Card title="Wasted Hours" value={wastedHours.toFixed(2)} danger />
            <Card title="Verified Tasks" value={verifiedTasks} />
          </div>

          <Panel title="Task Details" rightText={`${filteredTasks.length} records`}>
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
              <table className="w-full min-w-[2100px] text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <Th>ID</Th>
                    <Th>Date</Th>
                    <Th>Task ID</Th>
                    <Th>Staff</Th>
                    <Th>Department</Th>
                    <Th>Account</Th>
                    <Th>Tier</Th>
                    <Th>Description</Th>
                    <Th>Metric</Th>
                    <Th>Delta</Th>
                    <Th>Hours</Th>
                    <Th>Verified</Th>
                    <Th>Proof</Th>
                    <Th>Waste</Th>
                    <Th>Waste Type</Th>
                    <Th>Scenario</Th>
                    <Th>Product IDs</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50">
                      <Td>#{task.id}</Td>
                      <Td>{task.date ? String(task.date).slice(0, 10) : "—"}</Td>
                      <Td>{task.task_id || "—"}</Td>
                      <Td className="font-semibold text-slate-900">{task.name || "—"}</Td>
                      <Td>{task.Department || "—"}</Td>
                      <Td>{task.account_name || task.account_code || "—"}</Td>
                      <Td>
                        <span className="px-2 py-1 rounded-lg bg-slate-100 border text-xs font-bold">
                          {task.task_tier || "—"}
                        </span>
                      </Td>
                      <Td className="max-w-md truncate">{task.task_description || "—"}</Td>
                      <Td>{task.metric_name || "—"}</Td>
                      <Td>{task.metric_delta || "—"}</Td>
                      <Td className="font-bold">{task.hours_spent || 0}</Td>
                      <Td>
                        <StatusBadge value={normalizeYesNo(task.verified)} />
                      </Td>
                      <Td>
                        {task.verification_url ? (
                          <a
                            href={task.verification_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-900 underline font-semibold"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td>
                        <StatusBadge value={normalizeYesNo(task.waste_flag)} />
                      </Td>
                      <Td>{task.waste_type || "—"}</Td>
                      <Td>{task.scenario || "—"}</Td>
                      <Td>{task.product_ids_worked_on || "—"}</Td>
                      <Td>
                        {canDeleteTask ? (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 font-semibold hover:bg-red-100"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">No delete access</span>
                        )}
                      </Td>
                    </tr>
                  ))}

                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan="18" className="text-center py-10 text-slate-400">
                        No task records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {wasteTasks > 0 && (
              <p className="text-sm text-slate-500 mt-4">
                Waste task count:{" "}
                <span className="font-bold text-red-600">{wasteTasks}</span>
              </p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function Card({ title, value, danger = false }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
        {title}
      </p>
      <h3 className={`text-3xl font-bold mt-2 ${danger ? "text-red-600" : "text-slate-950"}`}>
        {value}
      </h3>
    </div>
  );
}

function Panel({ title, rightText, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        {rightText && (
          <p className="text-slate-400 text-xs font-bold uppercase">{rightText}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <input
        {...props}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-900"
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <select
        {...props}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-900"
      >
        {children}
      </select>
    </div>
  );
}

function StatusBadge({ value }) {
  const isYes = value === "Yes";

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
        isYes
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {value}
    </span>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left whitespace-nowrap font-bold">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 whitespace-nowrap text-slate-600 ${className}`}>
      {children}
    </td>
  );
}