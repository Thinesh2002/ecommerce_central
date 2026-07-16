import api from "../api";

export const getStaff = () => api.get("/team");

export const getStaffById = (id) => api.get(`/team/${id}`);

export const searchStaff = (keyword) =>
  api.get(`/team/search?keyword=${keyword}`);

export const createStaff = (data) => api.post("/team", data);

export const updateStaff = (id, data) => api.put(`/team/${id}`, data);

export const deleteStaff = (id) => api.delete(`/team/${id}`);

export const changeStaffStatus = (id, status) =>
  api.patch(`/team/${id}/status`, { status });
export const getTeams = () => api.get("/team/teams");
export const createTeam = (data) => api.post("/team/teams", data);
