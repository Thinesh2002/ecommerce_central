import { useEffect, useState } from "react";
import API from "../../config/api";
import { getStoredUser } from "../../config/auth";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, recent: [] });
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

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
      await API.delete(`/auth/${id}`);
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
      await API.put(`/auth/${u.id}`, { name: newName });
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

 return (
  <div className="space-y-6 text-gray-200">
    {/* PAGE TITLE */}
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-gray-400">
        User statistics & management
      </p>
    </div>

    {/* ================= STATS ================= */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* TOTAL USERS */}
      <div className="bg-[#020617] border border-white/10 rounded-xl p-5">
        <p className="text-sm text-gray-400">Total Users</p>
        <h2 className="text-3xl font-bold mt-2">
          {stats.total ?? 0}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          As of now
        </p>
      </div>

      {/* RECENT USERS */}
      <div className="md:col-span-2 bg-[#020617] border border-white/10 rounded-xl p-5">
        <p className="text-sm text-gray-400 mb-3">
          Recent Users
        </p>

        {stats.recent?.length ? (
          <ul className="divide-y divide-white/10">
            {stats.recent.map((u) => (
              <li
                key={u.id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {u.name || "(no name)"}{" "}
                    <span className="text-xs text-gray-500">
                      #{u.user_id || u.id}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {u.email}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {u.created_at}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No recent users
          </p>
        )}
      </div>
    </div>

    {/* ================= USERS TABLE ================= */}
    <div className="bg-[#020617] border border-white/10 rounded-xl p-5">
      {/* SEARCH & ACTIONS */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          className="flex-1 bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name, email, user id or id"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />

        <button
          onClick={() => {
            setQuery("");
            setPage(1);
          }}
          className="px-4 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5"
        >
          Clear
        </button>

        <button
          onClick={handleAdd}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500"
        >
          + Add User
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3 text-left">#</th>
                  <th className="py-3 text-left">Name</th>
                  <th className="py-3 text-left">User ID</th>
                  <th className="py-3 text-left">Email</th>
                  <th className="py-3 text-left">Created</th>
                  <th className="py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {paginated.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="py-3">{u.id}</td>
                    <td className="py-3">{u.name}</td>
                    <td className="py-3">{u.user_id}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3 text-xs text-gray-400">
                      {u.created_at}
                    </td>
                    <td className="py-3 space-x-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="px-2 py-1 text-xs rounded border border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="px-2 py-1 text-xs rounded border border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-5">
            <span className="text-xs text-gray-500">
              {filtered.length} result(s)
            </span>

            <div className="space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm rounded border border-white/10 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm">
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3 py-1 text-sm rounded border border-white/10 disabled:opacity-50"
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