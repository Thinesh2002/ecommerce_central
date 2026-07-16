import { useEffect, useState } from "react";
import {
  getStaff,
  searchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  changeStaffStatus,
} from "../../config/team_api/team_api";

import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getStoredUser } from "../../config/auth";
import { hasPermission, PERMISSIONS, isAdmin } from "../../config/permissions";

const emptyForm = {
  staff_code: "",
  staff_name: "",
  department: "eBay",
  role: "",
  email: "",
  active_status: "Active",
  team_id: "",
};

function Team() {
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUser = getStoredUser();
  const canCreateStaff = hasPermission(currentUser, PERMISSIONS.TEAM_CREATE);
  const canUpdateStaff = hasPermission(currentUser, PERMISSIONS.TEAM_UPDATE);
  const canDeleteStaff = hasPermission(currentUser, PERMISSIONS.TEAM_DELETE) && isAdmin(currentUser);

  const extractArray = (response) => {
    if (response?.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await getStaff();
      console.log("STAFF API RESPONSE:", response.data);
      setStaffList(extractArray(response));
    } catch (error) {
      console.error("FETCH STAFF ERROR:", error);
      alert(error.response?.data?.message || "Failed to load staff");
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSearch = async () => {
    try {
      if (!keyword.trim()) {
        fetchStaff();
        return;
      }
      setLoading(true);
      const response = await searchStaff(keyword);
      setStaffList(extractArray(response));
    } catch (error) {
      console.error("SEARCH STAFF ERROR:", error);
      alert("Search failed");
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.staff_code ||
      !formData.staff_name ||
      !formData.role ||
      !formData.email
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      if (editingId) {
        await updateStaff(editingId, formData);
        alert("Staff updated successfully");
      } else {
        await createStaff(formData);
        alert("Staff created successfully");
      }
      resetForm();
      fetchStaff();
    } catch (error) {
      console.error("SAVE STAFF ERROR:", error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleEdit = (staff) => {
    setEditingId(staff.staff_id);
    setFormData({
      staff_code: staff.staff_code || "",
      staff_name: staff.staff_name || "",
      department: staff.department || "eBay",
      role: staff.role || "",
      email: staff.email || "",
      active_status: staff.active_status || "Active",
      team_id: staff.team_id || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff?")) return;
    try {
      await deleteStaff(id);
      alert("Staff deleted successfully");
      fetchStaff();
    } catch (error) {
      console.error("DELETE STAFF ERROR:", error);
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const handleStatusChange = async (staff) => {
    const newStatus = staff.active_status === "Active" ? "Inactive" : "Active";
    try {
      await changeStaffStatus(staff.staff_id, newStatus);
      fetchStaff();
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);
      alert(error.response?.data?.message || "Status update failed");
    }
  };

  const safeStaffList = Array.isArray(staffList) ? staffList : [];
  const totalStaff = safeStaffList.length;
  const activeStaff = safeStaffList.filter((s) => s?.active_status === "Active").length;
  const inactiveStaff = safeStaffList.filter((s) => s?.active_status === "Inactive").length;

  return (
    <div className="">
      <div className="">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Staff Dashboard
          </h1>
          <p className="text-stone-500 mt-1">
            Manage team members, roles, departments and active status.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100">
                <Users size={24} />
              </div>
              <div>
                <p className="text-stone-500 text-sm font-medium">Total Staff</p>
                <h2 className="text-3xl font-bold text-stone-900 mt-0.5">{totalStaff}</h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-100">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-stone-500 text-sm font-medium">Active Staff</p>
                <h2 className="text-3xl font-bold text-emerald-600 mt-0.5">{activeStaff}</h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100">
                <XCircle size={24} />
              </div>
              <div>
                <p className="text-stone-500 text-sm font-medium">Inactive Staff</p>
                <h2 className="text-3xl font-bold text-rose-600 mt-0.5">{inactiveStaff}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex w-full sm:w-96 relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search staff members..."
                className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl pl-4 pr-12 py-2.5 outline-none focus:border-blue-500 transition-colors placeholder:text-stone-300"
              />
              <button
                onClick={handleSearch}
                className="absolute right-1 top-1 bottom-1 bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 rounded-lg transition-colors cursor-pointer"
              >
                <Search size={18} />
              </button>
            </div>

            {canCreateStaff && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all font-medium shadow-md shadow-blue-600/10 cursor-pointer"
              >
                <Plus size={18} />
                Add Staff Member
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h2 className="text-xl font-bold text-stone-900">
                  {editingId ? "Update Staff Profile" : "Register New Staff"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-stone-400 hover:text-rose-600 transition-colors p-1 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Staff Code"
                    name="staff_code"
                    value={formData.staff_code}
                    onChange={handleChange}
                    placeholder="e.g. STF-001"
                  />
                  <InputField
                    label="Staff Name"
                    name="staff_name"
                    value={formData.staff_name}
                    onChange={handleChange}
                    placeholder="Full Name"
                  />
                  <InputField
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. eBay"
                  />
                  <InputField
                    label="Corporate Role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g. Manager"
                  />

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@company.com"
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-stone-900 placeholder:text-stone-300 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Operational Status
                    </label>
                    <select
                      name="active_status"
                      value={formData.active_status}
                      onChange={handleChange}
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-stone-900 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium shadow-md shadow-blue-600/10 cursor-pointer"
                  >
                    {editingId ? "Save Changes" : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-stone-200 bg-stone-50">
            <h2 className="text-xl font-bold text-stone-900">
              Staff Registry Table
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-stone-700">
              <thead className="bg-stone-100 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Code</th>
                  <th className="px-5 py-4 text-left font-semibold">Name</th>
                  <th className="px-5 py-4 text-left font-semibold">Department</th>
                  <th className="px-5 py-4 text-left font-semibold">Role</th>
                  <th className="px-5 py-4 text-left font-semibold">Email</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-stone-400 font-medium">
                      <span className="inline-block animate-pulse">Loading staff details...</span>
                    </td>
                  </tr>
                ) : safeStaffList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-stone-400 font-medium">
                      No staff details found.
                    </td>
                  </tr>
                ) : (
                  safeStaffList.map((staff) => (
                    <tr key={staff.staff_id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-blue-600">
                        {staff.staff_code}
                      </td>
                      <td className="px-5 py-4 font-medium text-stone-900">
                        {staff.staff_name}
                      </td>
                      <td className="px-5 py-4 text-stone-500">
                        {staff.department}
                      </td>
                      <td className="px-5 py-4 text-stone-500">
                        {staff.role}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-stone-500">
                        {staff.email}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => canUpdateStaff && handleStatusChange(staff)}
                          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-all border cursor-pointer ${
                            staff.active_status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          {staff.active_status}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2.5">
                          <button
                            onClick={() => canUpdateStaff && handleEdit(staff)}
                            className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 text-stone-500 hover:text-amber-700 border border-stone-200 transition-all cursor-pointer"
                          >
                            <Edit size={16} />
                          </button>
                          {canDeleteStaff && (
                            <button
                              onClick={() => handleDelete(staff.staff_id)}
                              className="p-2 rounded-lg bg-stone-50 hover:bg-rose-50 text-stone-500 hover:text-rose-700 border border-stone-200 transition-all cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-stone-900 placeholder:text-stone-300 transition-colors"
      />
    </div>
  );
}

export default Team;