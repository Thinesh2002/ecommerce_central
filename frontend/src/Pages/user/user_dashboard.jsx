import { useEffect, useState } from "react";
import { Search, UserPlus, Pencil, Trash2 } from "lucide-react";
import API from "../../config/api";
import { getStoredUser } from "../../config/auth";
import { hasPermission, PERMISSIONS, roleLabel } from "../../config/permissions";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, recent: [] });
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;
  const currentUser = getStoredUser();
  const canCreateUser = hasPermission(currentUser, PERMISSIONS.USER_CREATE);
  const canUpdateUser = hasPermission(currentUser, PERMISSIONS.USER_UPDATE);
  const canDeleteUser = hasPermission(currentUser, PERMISSIONS.USER_DELETE);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/user/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/user/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(query.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(query.toLowerCase()) ||
      (u.user_id || "").toLowerCase().includes(query.toLowerCase()) ||
      String(u.id) === query
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await API.delete(`/user/${id}`);
      fetchStats();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleAdd = () => {
    window.location.href = "/register";
  };

  const handleEdit = async (u) => {
    const me = getStoredUser();
    if (me && me.id === u.id) {
      window.location.href = "/profile";
      return;
    }

    const newName = prompt("Name", u.name || "");
    if (newName === null) return;

    try {
      await API.put(`/user/${u.id}`, { name: newName });
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">User Access</p>
        <h1 className="text-xl font-bold text-slate-900">Users</h1>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-sm border border-[#D5D9D9] bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total ?? 0}</p>
        </div>

        <div className="md:col-span-2 rounded-sm border border-[#D5D9D9] bg-white p-4">
          <p className="mb-2 text-xs font-semibold text-slate-500">Recent Users</p>
          {stats.recent?.length ? (
            <ul className="divide-y divide-slate-100">
              {stats.recent.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {u.name || "(no name)"}{" "}
                      <span className="text-xs font-normal text-slate-400">#{u.user_id || u.id}</span>
                    </p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{u.created_at}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No recent users</p>
          )}
        </div>
      </div>

      {/* ================= USERS TABLE ================= */}
      <div className="rounded-sm border border-[#D5D9D9] bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row">
          <div className="flex flex-1 items-center rounded-sm border border-slate-300 bg-white overflow-hidden">
            <Search size={15} className="ml-2.5 text-slate-400 shrink-0" />
            <input
              className="w-full px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              placeholder="Search by name, email, user id or id"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <button
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
            className="rounded-sm border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>

          {canCreateUser && (
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <UserPlus size={15} />
              Add User
            </button>
          )}
        </div>

        {loading ? (
          <p className="p-4 text-sm text-slate-400">Loading…</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-500">{u.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600">{u.user_id}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3 text-slate-600">{roleLabel(u.role)}</td>
                      <td className="px-4 py-3 text-slate-600">{u.team_name || u.team_id || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-sm px-2 py-0.5 text-xs font-bold ${
                            String(u.status || "Active").toLowerCase() === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {u.status || "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{u.created_at}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canUpdateUser && (
                            <button
                              onClick={() => handleEdit(u)}
                              className="flex items-center gap-1 rounded-sm border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                          )}
                          {canDeleteUser && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="flex items-center gap-1 rounded-sm border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <span className="text-xs text-slate-500">{filtered.length} result(s)</span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-sm border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  Page {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-sm border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
