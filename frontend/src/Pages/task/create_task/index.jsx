import React, { useEffect, useState } from "react";

import {
  getTasks,
  createTask,
  deleteTask,
} from "../../../config/task_api/task-api";

import { getStaff } from "../../../config/team_api/team_api";
import { getAccounts } from "../../../config/ebay/ebay_accounts_api";
import { getStoredUser } from "../../../config/auth";
import { hasPermission, PERMISSIONS } from "../../../config/permissions";

const initialForm = {
  date: "",
  task_id: "",
  name: "",
  Department: "",
  account_name: "",
  account_code: "",
  weekly_intent_id: "",
  task_tier: "",
  tier_description: "",
  task_description: "",
  metric_name: "",
  metric_delta: "",
  hours_spent: "",
  verified: "No",
  verification_url: "",
  waste_flag: "No",
  waste_type: "",
  scenario: "",
  product_ids_worked_on: "",
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const currentUser = getStoredUser();
  const canDeleteTask = hasPermission(currentUser, PERMISSIONS.TASK_DELETE);

  useEffect(() => {
    loadPageData();
  }, []);

  const getArrayData = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.tasks)) return res.data.tasks;
    if (Array.isArray(res?.data?.staff)) return res.data.staff;
    if (Array.isArray(res?.data?.accounts)) return res.data.accounts;
    return [];
  };

  const loadPageData = async () => {
    try {
      const [taskRes, staffRes, accountRes] = await Promise.all([
        getTasks(),
        getStaff(),
        getAccounts(),
      ]);

      setTasks(getArrayData(taskRes));
      setStaffs(getArrayData(staffRes));
      setAccounts(getArrayData(accountRes));
    } catch (error) {
      console.error("Load Tasks Page Error:", error);
    }
  };

  const getStaffName = (staff) =>
    staff.name || staff.staff_name || staff.full_name || staff.employee_name || "";

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const selectedStaff = staffs.find((staff) => getStaffName(staff) === value);

      setForm((prev) => ({
        ...prev,
        name: value,
        Department:
          selectedStaff?.Department ||
          selectedStaff?.department ||
          selectedStaff?.role ||
          prev.Department,
      }));

      return;
    }

    if (name === "account_name") {
      const selectedAccount = accounts.find(
        (acc) =>
          acc.account_name === value ||
          acc.name === value ||
          acc.account_code === value
      );

      setForm((prev) => ({
        ...prev,
        account_name:
          selectedAccount?.account_name ||
          selectedAccount?.name ||
          selectedAccount?.account_code ||
          value,
        account_code: selectedAccount?.account_code || "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.date || !form.name || !form.task_description) {
      alert("Date, Staff and Task Description are required");
      return;
    }

    try {
      setLoading(true);

      await createTask({
        ...form,
        hours_spent: Number(form.hours_spent || 0),
        metric_delta: Number(form.metric_delta || 0),
      });

      resetForm();
      await loadPageData();
      alert("Task created successfully");
    } catch (error) {
      console.error("Create Task Error:", error);
      alert("Failed to create task");
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-bold">
            eBay EOD Task
          </p>
          <h1 className="text-3xl font-bold text-slate-950">
            Create Task
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Add daily staff work log with account, tier, verification and productivity details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Input
              label="Date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />

            <Input
              label="Task ID"
              name="task_id"
              value={form.task_id}
              onChange={handleChange}
              placeholder="TASK-001"
            />

            <Select
              label="Staff"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            >
              <option value="">Select Staff</option>
              {staffs.map((staff, index) => {
                const staffName = getStaffName(staff);
                return (
                  <option key={staff.id || index} value={staffName}>
                    {staffName}
                  </option>
                );
              })}
            </Select>

            <Input
              label="Department"
              name="Department"
              value={form.Department}
              onChange={handleChange}
              placeholder="eBay"
            />

            <Select
              label="Account"
              name="account_name"
              value={form.account_name}
              onChange={handleChange}
            >
              <option value="">Select Account</option>
              {accounts.map((account, index) => (
                <option
                  key={account.id || index}
                  value={
                    account.account_name ||
                    account.name ||
                    account.account_code
                  }
                >
                  {account.account_name || account.name || account.account_code}
                </option>
              ))}
            </Select>

            <Input
              label="Account Code"
              name="account_code"
              value={form.account_code}
              onChange={handleChange}
              placeholder="LEDSONE"
            />

            <Input
              label="Weekly Intent ID"
              name="weekly_intent_id"
              value={form.weekly_intent_id}
              onChange={handleChange}
              placeholder="WI-001"
            />

            <Select
              label="Task Tier"
              name="task_tier"
              value={form.task_tier}
              onChange={handleChange}
            >
              <option value="">Select Tier</option>
              <option value="S">S</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </Select>

            <Input
              label="Tier Description"
              name="tier_description"
              value={form.tier_description}
              onChange={handleChange}
              placeholder="High Impact Task"
            />

            <Input
              label="Metric Name"
              name="metric_name"
              value={form.metric_name}
              onChange={handleChange}
              placeholder="Sales / CTR / Ranking"
            />

            <Input
              label="Metric Delta"
              type="number"
              name="metric_delta"
              value={form.metric_delta}
              onChange={handleChange}
              placeholder="0"
            />

            <Input
              label="Hours Spent"
              type="number"
              step="0.01"
              name="hours_spent"
              value={form.hours_spent}
              onChange={handleChange}
              placeholder="1.5"
            />

            <Select
              label="Verified"
              name="verified"
              value={form.verified}
              onChange={handleChange}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </Select>

            <Input
              label="Verification URL"
              name="verification_url"
              value={form.verification_url}
              onChange={handleChange}
              placeholder="https://..."
            />

            <Select
              label="Waste Flag"
              name="waste_flag"
              value={form.waste_flag}
              onChange={handleChange}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </Select>

            <Input
              label="Waste Type"
              name="waste_type"
              value={form.waste_type}
              onChange={handleChange}
              placeholder="Rework / Delay / Wrong Task"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
            <Textarea
              label="Task Description"
              name="task_description"
              value={form.task_description}
              onChange={handleChange}
              placeholder="Explain completed task"
              required
            />

            <Textarea
              label="Scenario"
              name="scenario"
              value={form.scenario}
              onChange={handleChange}
              placeholder="Reason / situation"
            />

            <Textarea
              label="Product IDs Worked On"
              name="product_ids_worked_on"
              value={form.product_ids_worked_on}
              onChange={handleChange}
              placeholder="SKU / Item IDs / ASINs"
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Create Task"}
            </button>
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-950">
              Recent Tasks
            </h2>
            <p className="text-xs uppercase font-bold text-slate-400">
              {tasks.length} records
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full min-w-[1400px] text-sm">
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
                  <Th>Hours</Th>
                  <Th>Verified</Th>
                  <Th>Waste</Th>
                  <Th>Action</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <Td>#{task.id}</Td>
                    <Td>{task.date ? String(task.date).slice(0, 10) : "—"}</Td>
                    <Td>{task.task_id || "—"}</Td>
                    <Td className="font-semibold text-slate-900">{task.name || "—"}</Td>
                    <Td>{task.Department || "—"}</Td>
                    <Td>{task.account_name || task.account_code || "—"}</Td>
                    <Td>{task.task_tier || "—"}</Td>
                    <Td className="max-w-md truncate">{task.task_description || "—"}</Td>
                    <Td className="font-bold">{task.hours_spent || 0}</Td>
                    <Td>{task.verified || "No"}</Td>
                    <Td>{task.waste_flag || "No"}</Td>
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

                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="12" className="text-center py-10 text-slate-400">
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-500 uppercase">
        {label}
      </label>
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
      <label className="text-xs font-bold text-slate-500 uppercase">
        {label}
      </label>
      <select
        {...props}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-900"
      >
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-500 uppercase">
        {label}
      </label>
      <textarea
        {...props}
        rows={4}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-900 resize-none"
      />
    </div>
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