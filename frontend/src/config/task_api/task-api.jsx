import api from "../api";

// TASKS
export const getTasks = (params = {}) =>
  api.get("/tasks", { params });

// SINGLE TASK
export const getTaskById = (id) =>
  api.get(`/tasks/${id}`);

// TASK MASTER
export const getTaskMaster = () =>
  api.get("/tasks/master");

// CREATE
export const createTask = (data) =>
  api.post("/tasks", data);

// UPDATE
export const updateTask = (id, data) =>
  api.put(`/tasks/${id}`, data);

// DELETE
export const deleteTask = (id) =>
  api.delete(`/tasks/${id}`);

// BULK DELETE
export const bulkDeleteTasks = (ids) =>
  api.delete("/tasks", {
    data: { ids },
  });

// VERIFY
export const verifyTask = (id, verification_url = "") =>
  api.put(`/tasks/${id}/verify`, {
    verification_url,
  });

// UNVERIFY
export const unverifyTask = (id) =>
  api.put(`/tasks/${id}/unverify`);

// DASHBOARD SUMMARY
export const getDashboardSummary = (params = {}) =>
  api.get("/tasks/summary", { params });

// DEPARTMENT REPORT
export const getTasksByDepartment = () =>
  api.get("/tasks/department");

// STAFF REPORT
export const getTasksByStaff = () =>
  api.get("/tasks/staff");

// FILTER OPTIONS
export const getFilterOptions = () =>
  api.get("/tasks/filters");