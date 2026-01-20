import axios from "axios";

export const API_BASE_URL = "https://ecommerce-central-backend.teckvora.com";

const API = axios.create({
  baseURL: "https://ecommerce-central-backend.teckvora.com/api"
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
