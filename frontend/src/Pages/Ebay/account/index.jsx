import React, { useEffect, useState, useRef } from "react";
import {
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  X,
  Layers,
  Globe,
  UserCheck,
  MoreVertical,
  Search,
  UserMinus
} from "lucide-react";

import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../../../config/ebay/ebay_accounts_api";

import { getStaff } from "../../../config/team_api/team_api";
import { getStoredUser } from "../../../config/auth";
import { hasPermission, PERMISSIONS } from "../../../config/permissions";

const EbayAccountPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [staffs, setStaffs] = useState([]);

  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_holder: "",
    marketplace: "",
    status: "Active",
  });

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [activeAccountForAssign, setActiveAccountForAssign] = useState(null);
  const [staffSearchKey, setStaffSearchKey] = useState("");

  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const currentUser = getStoredUser();
  const canCreateAccount = hasPermission(currentUser, PERMISSIONS.ACCOUNT_CREATE);
  const canUpdateAccount = hasPermission(currentUser, PERMISSIONS.ACCOUNT_UPDATE);
  const canDeleteAccount = hasPermission(currentUser, PERMISSIONS.ACCOUNT_DELETE);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await getAccounts();

      const fetchedData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const sortedAccounts = [...fetchedData].sort(
        (a, b) => Number(a.account_id) - Number(b.account_id)
      );

      setAccounts(sortedAccounts);
    } catch (error) {
      console.error("Fetch Accounts Error:", error);
      alert("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffs = async () => {
    try {
      const res = await getStaff();
      const staffData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setStaffs(staffData);
    } catch (error) {
      console.error("Fetch Staff Error:", error);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchStaffs();

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      account_code: "",
      account_name: "",
      account_holder: "",
      marketplace: "",
      status: "Active",
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId && !canUpdateAccount) return alert("No account update access");
    if (!editId && !canCreateAccount) return alert("No account create access");

    if (
      !formData.account_code.trim() ||
      !formData.account_name.trim() ||
      !formData.marketplace.trim()
    ) {
      alert("Account Code, Account Name and Marketplace are required");
      return;
    }

    try {
      if (editId) {
        await updateAccount(editId, formData);
        alert("Account updated successfully");
      } else {
        await createAccount(formData);
        alert("Account created successfully");
      }

      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error("Save Account Error:", error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleEdit = (account) => {
    if (!canUpdateAccount) return alert("No account update access");
    setEditId(account.account_id);
    setFormData({
      account_code: account.account_code || "",
      account_name: account.account_name || "",
      account_holder: account.account_holder || "",
      marketplace: account.marketplace || "",
      status: account.status || "Active",
    });
    setActiveDropdownId(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!canDeleteAccount) return alert("No account delete access");
    setActiveDropdownId(null);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this account?"
    );
    if (!confirmDelete) return;

    try {
      await deleteAccount(id);
      alert("Account deleted successfully");
      fetchAccounts();
    } catch (error) {
      console.error("Delete Account Error:", error);
      alert(error.response?.data?.message || "Failed to delete account");
    }
  };

  const handleUpdateStaffAssignment = async (account, staffNameOrEmpty) => {
    if (!canUpdateAccount) return alert("No account assignment access");
    try {
      await updateAccount(account.account_id, {
        account_code: account.account_code,
        account_name: account.account_name,
        account_holder: staffNameOrEmpty,
        marketplace: account.marketplace,
        status: account.status,
      });

      alert(staffNameOrEmpty ? "Account Holder assigned successfully" : "Account Holder removed successfully");
      setShowAssignPopup(false);
      setStaffSearchKey("");
      fetchAccounts();
    } catch (error) {
      console.error("Update AH Assignment Error:", error);
      alert(error.response?.data?.message || "Action failed");
    }
  };

  const openAssignModal = (account) => {
    setActiveAccountForAssign(account);
    setActiveDropdownId(null);
    setShowAssignPopup(true);
  };

  const toggleDropdown = (id) => {
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  const totalAccounts = accounts.length;

  const getMarketplaceKey = (name) => {
    if (!name) return "";
    const cleanStr = name.toUpperCase().trim();
    if (cleanStr.includes("UK")) return "UK";
    if (cleanStr.includes("DE")) return "DE";
    if (cleanStr.includes("FR")) return "FR";
    if (cleanStr.includes("US")) return "US";
    if (cleanStr.includes("AU")) return "AU";
    return cleanStr.replace("EBAY", "").trim() || cleanStr;
  };

  const marketplaceCounts = {};
  accounts.forEach((acc) => {
    const key = getMarketplaceKey(acc.marketplace);
    if (key) {
      marketplaceCounts[key] = (marketplaceCounts[key] || 0) + 1;
    }
  });

  const uniqueMarketsCount = Object.keys(marketplaceCounts).length;

  const filteredStaffs = staffs.filter((staff) =>
    staff.staff_name?.toLowerCase().includes(staffSearchKey.toLowerCase())
  );

  return (
    <div className="">
      <div className="">
        
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">
              eBay Account Management
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Manage eBay account details and assign Account Holders dynamically.
            </p>
          </div>

          {canCreateAccount && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="w-full sm:w-auto bg-cyan-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-700 transition-all font-medium shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20 cursor-pointer"
            >
              <Plus size={18} />
              Add Marketplace
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm shadow-cyan-100/50 hover:shadow-cyan-500/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-cyan-50 text-cyan-600 p-3 rounded-xl border border-cyan-100">
                <Layers size={22} />
              </div>
              <div>
                <p className="text-stone-500 text-xs font-semibold uppercase">Total Accounts</p>
                <h2 className="text-2xl font-bold text-stone-900">{totalAccounts}</h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm shadow-cyan-100/50 hover:shadow-cyan-500/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl border border-indigo-100">
                <Globe size={22} />
              </div>
              <div>
                <p className="text-stone-500 text-xs font-semibold uppercase">Unique Marketplaces</p>
                <h2 className="text-2xl font-bold text-indigo-600">{uniqueMarketsCount} Countries</h2>
              </div>
            </div>
          </div>

          {Object.entries(marketplaceCounts).map(([marketName, count]) => (
            <div
              key={marketName}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm shadow-cyan-100/50 hover:border-cyan-200 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="bg-cyan-50 text-cyan-600 font-mono font-bold px-3 py-2 rounded-xl border border-cyan-100 text-sm">
                  {marketName}
                </div>
                <div>
                  <p className="text-stone-500 text-xs font-semibold uppercase">{marketName} Region</p>
                  <h2 className="text-2xl font-bold text-stone-900">
                    {count} {count === 1 ? "Account" : "Accounts"}
                  </h2>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl shadow-cyan-100 w-full max-w-md overflow-hidden border-t-2 border-t-cyan-600">
              <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h2 className="text-lg font-bold text-stone-900">
                  {editId ? "Update Account Details" : "Register New Account"}
                </h2>

                <button
                  onClick={resetForm}
                  className="text-stone-400 hover:text-rose-600 p-1 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Account Code</label>
                  <input
                    type="text"
                    name="account_code"
                    value={formData.account_code}
                    onChange={handleChange}
                    placeholder="e.g. LED001"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-cyan-600 transition-colors placeholder:text-stone-300"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Account Name</label>
                  <input
                    type="text"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleChange}
                    placeholder="e.g. LEDSONE UK"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-cyan-600 transition-colors placeholder:text-stone-300"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Marketplace Domain</label>
                  <input
                    type="text"
                    name="marketplace"
                    value={formData.marketplace}
                    onChange={handleChange}
                    placeholder="e.g. eBay UK, eBay FR"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-cyan-600 transition-colors placeholder:text-stone-300"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Operational Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-cyan-600 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-700 cursor-pointer transition-all shadow-md shadow-cyan-600/10"
                  >
                    {editId ? "Save Changes" : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAssignPopup && activeAccountForAssign && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl shadow-cyan-100 w-full max-w-md overflow-hidden border-t-2 border-t-cyan-600">
              <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Assign Account Holder</h2>
                  <p className="text-xs text-stone-500 mt-0.5">For: {activeAccountForAssign.account_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignPopup(false);
                    setStaffSearchKey("");
                  }}
                  className="text-stone-400 hover:text-rose-600 p-1 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search staff profile by name..."
                    value={staffSearchKey}
                    onChange={(e) => setStaffSearchKey(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:border-cyan-600 placeholder:text-stone-300 transition-colors"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-stone-200 rounded-xl bg-stone-50 divide-y divide-stone-100 custom-scrollbar">
                  {filteredStaffs.length === 0 ? (
                    <p className="text-center text-stone-400 text-xs py-8">No staff members found matching search.</p>
                  ) : (
                    filteredStaffs.map((staff) => {
                      const isCurrent = activeAccountForAssign.account_holder === staff.staff_name;
                      return (
                        <div
                          key={staff.staff_id}
                          className="px-4 py-3 flex items-center justify-between hover:bg-white transition-colors"
                        >
                          <span className={`text-sm ${isCurrent ? "text-cyan-600 font-medium" : "text-stone-700"}`}>
                            {staff.staff_name} {isCurrent && <span className="text-xs text-stone-400 font-normal">(Current)</span>}
                          </span>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStaffAssignment(activeAccountForAssign, staff.staff_name)}
                              className="px-3 py-1 bg-cyan-50 hover:bg-cyan-600 text-cyan-600 hover:text-white rounded-lg text-xs font-semibold tracking-wide border border-cyan-200 hover:border-transparent transition-all cursor-pointer"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900">Account Connection Registry</h2>

            <button
              onClick={fetchAccounts}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-stone-700">
              <thead className="bg-stone-100 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold tracking-wider">ID</th>
                  <th className="px-5 py-4 text-left font-semibold tracking-wider">Code</th>
                  <th className="px-5 py-4 text-left font-semibold tracking-wider">Account Name</th>
                  <th className="px-5 py-4 text-left font-semibold tracking-wider">Marketplace</th>
                  <th className="px-5 py-4 text-left font-semibold tracking-wider">Status</th>
                  <th className="px-5 py-4 text-left font-semibold tracking-wider">Account Holder</th>
                  <th className="px-5 py-4 text-center font-semibold tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-stone-400 font-medium">
                      <span className="inline-block animate-pulse">Loading connected databases...</span>
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-stone-400 font-medium">
                      No matching accounts found.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.account_id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-stone-400">
                        #{account.account_id}
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-cyan-600">
                        {account.account_code}
                      </td>

                      <td className="px-5 py-4 font-medium text-stone-900">
                        {account.account_name}
                      </td>

                      <td className="px-5 py-4 text-stone-500">
                        {account.marketplace || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                            account.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {account.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-stone-800">
                        {account.account_holder ? account.account_holder : " — "}
                      </td>

                      <td className="px-5 py-4 text-center relative" ref={activeDropdownId === account.account_id ? dropdownRef : null}>
                        <button
                          type="button"
                          onClick={() => toggleDropdown(account.account_id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeDropdownId === account.account_id && (
                          <div className="absolute right-4 mt-1 w-44 rounded-xl bg-white border border-stone-200 shadow-xl shadow-cyan-100/50 z-20 overflow-hidden divide-y divide-stone-100 transform origin-top-right animate-fade-in border-r-2 border-r-cyan-600/40">
                            {!account.account_holder ? (
                              <button
                                type="button"
                                onClick={() => openAssignModal(account)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                              >
                                <UserCheck size={14} className="text-cyan-600" />
                                Assign AH
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openAssignModal(account)}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                                >
                                  <UserCheck size={14} className="text-cyan-600" />
                                  Update AH
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStaffAssignment(account, "")}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-stone-50 transition-colors cursor-pointer"
                                >
                                  <UserMinus size={14} className="text-rose-600" />
                                  Remove AH
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEdit(account)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                              <Edit size={14} className="text-amber-600" />
                              Edit Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(account.account_id)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} className="text-rose-600" />
                              Delete Record
                            </button>
                          </div>
                        )}
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
};

export default EbayAccountPage;