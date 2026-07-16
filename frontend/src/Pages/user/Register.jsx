import React, { useEffect, useState } from "react";
import API from "../../config/api";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../config/auth";
import { isAdmin, isTeamLeader, roleLabel } from "../../config/permissions";
import { getTeams, getStaff } from "../../config/team_api/team_api";

export default function Register() {
  const currentUser = getStoredUser();
  const [teams, setTeams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    name: "",
    user_id: "",
    email: "",
    password: "",
    role: isTeamLeader(currentUser) ? "user" : "user",
    team_id: currentUser?.role === "team_leader" ? currentUser?.team_id || "" : "",
    staff_id: "",
    status: "Active",
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.allSettled([getTeams(), getStaff()]).then(([teamRes, staffRes]) => {
      setTeams(teamRes.value?.data?.data || []);
      setStaff(staffRes.value?.data?.data || []);
    });
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const payload = {
        ...form,
        role: isTeamLeader(currentUser) ? "user" : form.role,
        team_id: isTeamLeader(currentUser) ? currentUser.team_id : form.team_id || null,
        staff_id: form.staff_id || null,
      };
      await API.post("/user/register", payload);
      setMsg({ type: "success", text: "User access created successfully" });
      setTimeout(() => navigate("/user-dashboard"), 600);
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Register failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">User Access</p>
        <h1 className="text-xl font-bold text-slate-900">Create User Access</h1>
        <p className="mt-1 text-sm text-slate-500">
          Admin can create all roles. Team leaders can create users only inside their own team.
        </p>
      </div>

      <div className="max-w-3xl rounded-sm border border-[#D5D9D9] bg-white p-6">
        {msg && (
          <div
            className={`mb-4 rounded-sm border px-4 py-2.5 text-sm font-medium ${
              msg.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input name="name" value={form.name} onChange={change} placeholder="Full Name" required />
          <Input name="user_id" value={form.user_id} onChange={change} placeholder="User ID" required />
          <Input type="email" name="email" value={form.email} onChange={change} placeholder="Email Address" required />
          <Input type="password" name="password" value={form.password} onChange={change} placeholder="Password" required />

          <Field label="Role">
            <select
              name="role"
              value={form.role}
              onChange={change}
              disabled={!isAdmin(currentUser)}
              className={selectClass}
            >
              <option value="user">{roleLabel("user")}</option>
              <option value="team_leader">{roleLabel("team_leader")}</option>
              <option value="admin">{roleLabel("admin")}</option>
            </select>
          </Field>

          <Field label="Team">
            <select
              name="team_id"
              value={form.team_id || ""}
              onChange={change}
              disabled={isTeamLeader(currentUser)}
              className={selectClass}
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.team_id} value={team.team_id}>
                  {team.team_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Linked Staff Profile">
            <select name="staff_id" value={form.staff_id || ""} onChange={change} className={selectClass}>
              <option value="">Optional</option>
              {staff.map((item) => (
                <option key={item.staff_id} value={item.staff_id}>
                  {item.staff_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select name="status" value={form.status} onChange={change} className={selectClass}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full rounded-sm bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creating access…" : "Create User Access"}
          </button>
        </form>
      </div>
    </div>
  );
}

const selectClass =
  "mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
    />
  );
}
