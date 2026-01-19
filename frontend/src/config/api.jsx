import axios from "axios";

export const API_BASE_URL = "http://localhost:5000";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});


export const searchKeywords = async (payload) => {
  const res = await API.post("/ebay-keyword/search", payload);
  return res.data;
};

export default API;
