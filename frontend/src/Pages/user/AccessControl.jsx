import React, { useEffect, useState } from "react";
import { ShieldCheck, Save, Loader2, Lock } from "lucide-react";
import { fetchPermissionMatrix, updateRolePermissions } from "../../config/api";
import { ROLE } from "../../config/permissions";

const ROLE_COLUMNS = [
  { role: ROLE.ADMIN, label: "Admin", editable: false },
  { role: ROLE.TEAM_LEADER, label: "Team Leader", editable: true },
  { role: ROLE.USER, label: "User", editable: true },
];

function moduleLabel(moduleKey) {
  return String(moduleKey || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AccessControl() {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [matrix, setMatrix] = useState({ admin: [], team_leader: [], user: [] });
  const [savingRole, setSavingRole] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPermissionMatrix();
      setPermissions(data.permissions || []);
      setMatrix({
        admin: data.matrix?.admin || [],
        team_leader: data.matrix?.team_leader || [],
        user: data.matrix?.user || [],
      });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to load access matrix" });
    } finally {
      setLoading(false);
    }
  };

  const grouped = permissions.reduce((acc, perm) => {
    const key = perm.module_key || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(perm);
    return acc;
  }, {});

  const toggle = (role, permissionKey) => {
    setMatrix((prev) => {
      const current = new Set(prev[role] || []);
      if (current.has(permissionKey)) current.delete(permissionKey);
      else current.add(permissionKey);
      return { ...prev, [role]: Array.from(current) };
    });
  };

  const save = async (role) => {
    setSavingRole(role);
    setMessage(null);
    try {
      await updateRolePermissions(role, matrix[role]);
      setMessage({ type: "success", text: `Access updated for ${role.replace("_", " ")}.` });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save access" });
    } finally {
      setSavingRole(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading access control…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Access Control</h1>
          <p className="text-sm text-slate-500">
            Decide which pages and actions each role can use. Admin always has full access.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
            message.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 min-w-55">Permission</th>
                {ROLE_COLUMNS.map((col) => (
                  <th key={col.role} className="px-4 py-3 text-center min-w-30">
                    <div className="flex items-center justify-center gap-1.5">
                      {!col.editable && <Lock size={12} className="text-slate-400" />}
                      {col.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([moduleKey, perms]) => (
                <React.Fragment key={moduleKey}>
                  <tr className="bg-slate-50/60">
                    <td colSpan={ROLE_COLUMNS.length + 1} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                      {moduleLabel(moduleKey)}
                    </td>
                  </tr>
                  {perms.map((perm) => (
                    <tr key={perm.permission_key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40">
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-slate-800">{perm.description || perm.permission_key}</p>
                        <p className="text-xs text-slate-400">{perm.permission_key}</p>
                      </td>
                      {ROLE_COLUMNS.map((col) => {
                        const checked = (matrix[col.role] || []).includes(perm.permission_key);
                        return (
                          <td key={col.role} className="px-4 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!col.editable}
                              onChange={() => toggle(col.role, perm.permission_key)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
          {ROLE_COLUMNS.filter((col) => col.editable).map((col) => (
            <button
              key={col.role}
              type="button"
              onClick={() => save(col.role)}
              disabled={savingRole === col.role}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {savingRole === col.role ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save {col.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
