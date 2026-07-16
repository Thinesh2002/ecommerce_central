require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/user_route");
const ebayKeyword = require("./routes/ebay/keyword_route");
const ebaySellerRoute = require("./routes/ebay/seller_analysis_route");
const GeminiRoute = require("./routes/gemini/gemini_route");
const ebayAuditListing = require("./routes/ebay/ListingAuditRoute/audit_route");
const ebayEodTaskRoute = require("./routes/task/ebay_eod_task_route");
const ebayEodTaskDashboardRoute = require("./routes/task/ebay_eod_task_dashboard_route");
const ebayAccount = require("./routes/ebay/ebay_account_routes/ebay_account_route");
const ebayOfficialApiRoute = require("./routes/ebay/official_api/ebay_official_api_route");
const teamRoute = require("./routes/team/team_route");
const permissionRoute = require("./routes/permission/permission_route");
const { refreshRolePermissions } = require("./config/permissions");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/user", authRoutes);
app.use("/api/ebay-keyword", ebayKeyword);
app.use("/api/seller", ebaySellerRoute);
app.use("/api/ai", GeminiRoute);
app.use("/api/ebay-listing", ebayAuditListing);
app.use("/api/tasks", ebayEodTaskRoute);
app.use("/api/task/dashboard", ebayEodTaskDashboardRoute);
app.use("/api/ebay-account", ebayAccount);
app.use("/api/ebay-official", ebayOfficialApiRoute);
app.use("/api/team", teamRoute);
app.use("/api/permissions", permissionRoute);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API server is running",
  });
});

const PORT = process.env.PORT || 4000;

refreshRolePermissions()
  .catch((err) => console.error("Failed to load role permissions:", err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server running → http://localhost:${PORT}`);
    });
  });