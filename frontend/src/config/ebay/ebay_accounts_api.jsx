import api from "../api";

export const getAccounts = () => api.get("/ebay-account");

export const createAccount = (data) =>
  api.post("/ebay-account", data);

export const updateAccount = (id, data) =>
  api.put(`/ebay-account/${id}`, data);

export const deleteAccount = (id) =>
  api.delete(`/ebay-account/${id}`);