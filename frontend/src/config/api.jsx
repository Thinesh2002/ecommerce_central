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

export const advancedKeywordResearch = async (payload) => {
  const res = await API.post("/ebay-keyword/advanced-research", payload);
  return res.data;
};


// Pro eBay keyword research APIs
export const proKeywordResearch = async (payload) => {
  const res = await API.post("/ebay-keyword/pro/research", payload);
  return res.data;
};

export const proBulkKeywordCompare = async (payload) => {
  const res = await API.post("/ebay-keyword/pro/bulk-compare", payload);
  return res.data;
};

export const proKeywordHistory = async ({ keyword, market = "EBAY_GB", days = 90, limit = 50 }) => {
  const res = await API.get("/ebay-keyword/pro/history", { params: { keyword, market, days, limit } });
  return res.data;
};

export const proLatestKeywordRuns = async (limit = 20) => {
  const res = await API.get("/ebay-keyword/pro/latest", { params: { limit } });
  return res.data;
};

export const proGetKeywordRun = async (runId) => {
  const res = await API.get(`/ebay-keyword/pro/run/${runId}`);
  return res.data;
};

export const proTitleBuilder = async (payload) => {
  const res = await API.post("/ebay-keyword/pro/title-builder", payload);
  return res.data;
};


export const proDownloadKeywordExport = async (runId, type = "keywords") => {
  const res = await API.get(`/ebay-keyword/pro/export/${runId}`, {
    params: { type },
    responseType: "blob",
  });
  return res.data;
};

export const proKeywordExportUrl = (runId, type = "keywords") => {
  return `${API_BASE_URL}/api/ebay-keyword/pro/export/${runId}?type=${encodeURIComponent(type)}`;
};

export default API;

// Official eBay API data layer: Browse, Trading, Fulfillment, Analytics, Marketing, Inventory, Finances
export const ebayOfficialStatus = async () => {
  const res = await API.get("/ebay-official/status");
  return res.data;
};

export const ebayRefreshUserToken = async (payload = {}) => {
  const res = await API.post("/ebay-official/oauth/refresh-user-token", payload);
  return res.data;
};

export const ebayLiveBrowseSearch = async (payload) => {
  const res = await API.post("/ebay-official/browse/live-search", payload);
  return res.data;
};

export const ebayOrderSalesSummary = async (params = {}) => {
  const res = await API.get("/ebay-official/orders/sales-summary", { params });
  return res.data;
};

export const ebayInventoryItems = async (params = {}) => {
  const res = await API.get("/ebay-official/inventory/items", { params });
  return res.data;
};

export const ebayTrafficReport = async (params = {}) => {
  const res = await API.get("/ebay-official/analytics/traffic", { params });
  return res.data;
};

export const ebayMarketingCreateReportTask = async (payload) => {
  const res = await API.post("/ebay-official/marketing/report-task", payload);
  return res.data;
};

export const ebayMarketingReportTasks = async (params = {}) => {
  const res = await API.get("/ebay-official/marketing/report-tasks", { params });
  return res.data;
};

export const ebayTradingItem = async (itemId, params = {}) => {
  const res = await API.get(`/ebay-official/trading/item/${itemId}`, { params });
  return res.data;
};

export const ebayTradingItemTransactions = async (itemId, params = {}) => {
  const res = await API.get(`/ebay-official/trading/item/${itemId}/transactions`, { params });
  return res.data;
};

export const ebayFinancesTransactions = async (params = {}) => {
  const res = await API.get("/ebay-official/finances/transactions", { params });
  return res.data;
};

// Role-based page access control (master admin manages who can see which pages)
export const fetchMyPermissions = async () => {
  const res = await API.get("/permissions/mine");
  return res.data;
};

export const fetchPermissionMatrix = async () => {
  const res = await API.get("/permissions/matrix");
  return res.data;
};

export const updateRolePermissions = async (role, permissionKeys) => {
  const res = await API.put(`/permissions/role/${role}`, { permission_keys: permissionKeys });
  return res.data;
};
