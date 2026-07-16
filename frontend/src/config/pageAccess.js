import { PERMISSIONS } from "./permissions";

// Mirrors the permission each route requires in App.jsx / Route/*_route/index.jsx.
// Paths not listed here are open to any authenticated user (e.g. /dashboard).
export const PAGE_PERMISSIONS = {
  "/register": PERMISSIONS.USER_CREATE,
  "/user-dashboard": PERMISSIONS.USER_READ,
  "/keyword-analysis": PERMISSIONS.KEYWORD_READ,
  "/advanced-keyword-research": PERMISSIONS.KEYWORD_ADVANCED,
  "/seller-analysis": PERMISSIONS.SELLER_READ,
  "/listing-audit": PERMISSIONS.LISTING_AUDIT,
  "/ebay-accounts": PERMISSIONS.ACCOUNT_READ,
  "/team-dashboard": PERMISSIONS.TEAM_READ,
  "/task-dashboard": PERMISSIONS.TASK_READ,
  "/create-task": PERMISSIONS.TASK_CREATE,
};

// Paths only the master admin can see, regardless of permission grants.
export const ADMIN_ONLY_PATHS = ["/access-control"];
